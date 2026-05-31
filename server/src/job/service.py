import hashlib
import logging
import httpx
import json
from openai import AsyncOpenAI
from redis.client import Redis

from src.config.runtime import params
from src.utils import json_decode, clean_markdown_json
from src.prompt import JobSeachPrompt, EmployerInsightsPrompt, ResumeExtractionPrompt
from firecrawl import AsyncFirecrawlApp

COUNTRY_CODE_TO_NAME = {
    "us": "United States",
    "gb": "United Kingdom",
    "ca": "Canada",
    "de": "Germany",
    "ph": "Philippines",
    "sg": "Singapore",
    "au": "Australia",
}

logger = logging.getLogger("job")

class JobsService:
    async def get_job_search_results(
        self,
        redis_client: Redis,
        job_platform: str,
        job_title: str,
        country: str,
        date_posted: str,
        job_list_page_length: str,
    ):
        cache_key = f"jobsearch:{job_platform}:{job_title}:{country}:{date_posted}"

        # Results already in cache
        cached_results = await redis_client.get(cache_key)
        if cached_results is not None:
            return json_decode(cached_results)

        if job_platform == "linkedin":
            location = COUNTRY_CODE_TO_NAME.get(country, "United States")
            raw_response = await self.search_rapidapi_linkedin_jobs(
                title_filter=job_title,
                location_filter=location,
            )
            # Normalize to the {"data": [...]} envelope the rest of the pipeline expects
            if isinstance(raw_response, list):
                job_search_results = {"data": raw_response}
            elif isinstance(raw_response, dict) and "data" not in raw_response:
                job_search_results = {"data": list(raw_response.values())[0] if raw_response else []}
            else:
                job_search_results = raw_response
        else:
            job_search_results = await self.search_rapidapi_jobs_jsearch(
                job_title=job_title,
                country=country,
                date_posted=date_posted,  # all, today, 3days, week, month
                page=job_list_page_length,
            )

        ttl = 15 * 60  # 15 minutes in seconds
        await redis_client.setex(cache_key, ttl, json.dumps(job_search_results))
        return job_search_results


    async def generate_employer_insights(self, employer_website: str) -> str:
        api_key = params.get("FIRECRAWL_API_KEY")
        if not api_key:
            raise ValueError("FIRECRAWL_API_KEY is not configured")

        employer_website_context = ""
        if api_key:
            try:
                app = AsyncFirecrawlApp(api_key=api_key)
                scrape_response = await app.scrape(url=employer_website, params={"formats": ["markdown"]})
                logger.info(f"SCRAPE RESPONSE for insights: {scrape_response}")
                if isinstance(scrape_response, dict):
                    markdown = scrape_response.get("markdown")
                else:
                    markdown = getattr(scrape_response, "markdown", None)
                if markdown:
                    employer_website_context = markdown
            except Exception as e:
                logger.error(f"Error scraping employer website with FirecrawlApp: {e}")
                return "Could not retrieve insights. Failed to scrape the employer website."
        
        if not employer_website_context:
            return "Could not retrieve insights from the employer website."

        client: AsyncOpenAI = AsyncOpenAI(api_key=params["OPENAI_API_KEY"])

        prompt = EmployerInsightsPrompt()
        system_prompt = prompt.load_system_prompt(employer_website_context)
        user_prompt = prompt.load_user_prompt()

        response = await client.responses.create(
            model=params["OPENAI_MODEL"],
            input=[system_prompt, user_prompt],
        )

        return response.output_text, employer_website_context

    # ------------------------------------------------------------------ #
    #  LinkedIn API schema → canonical LLM-ready schema                  #
    # ------------------------------------------------------------------ #
    def _normalize_linkedin_job(self, job: dict) -> dict:
        """
        Maps a LinkedIn RapidAPI job object to the canonical field names
        that the LLM prompt and downstream consumers expect.
        """
        # --- location helpers ---
        locations_raw = job.get("locations_raw") or []
        first_loc = locations_raw[0] if locations_raw else {}
        address = first_loc.get("address") or {}
        lat = first_loc.get("latitude") or (job.get("lats_derived") or [None])[0]
        lng = first_loc.get("longitude") or (job.get("lngs_derived") or [None])[0]

        country_raw = address.get("addressCountry") or (job.get("countries_derived") or [None])[0]

        # --- salary helpers ---
        salary_raw = job.get("salary_raw") or {}
        salary_value = salary_raw.get("value") or {}
        job_min_salary = salary_value.get("minValue")
        job_max_salary = salary_value.get("maxValue")
        job_salary_period = salary_value.get("unitText")

        # --- employment type ---
        emp_types = job.get("employment_type") or []
        employment_type_map = {
            "FULL_TIME": "Full-time",
            "PART_TIME": "Part-time",
            "CONTRACTOR": "Contract",
            "TEMPORARY": "Temporary",
            "INTERN": "Internship",
        }
        job_employment_type = employment_type_map.get(emp_types[0], emp_types[0]) if emp_types else None

        # --- posted_at: convert ISO date to a readable string ---
        date_posted = job.get("date_posted") or ""
        job_posted_at = date_posted[:10] if date_posted else None  # "YYYY-MM-DD"

        return {
            "job_title": job.get("title"),
            "job_description": job.get("description_text"),
            "job_employment_type": job_employment_type,
            "job_apply_link": job.get("url"),
            "job_apply_is_direct": job.get("directapply", False),
            "job_is_remote": job.get("remote_derived", False),
            "job_country": country_raw,
            "job_publisher": job.get("source") or job.get("source_domain"),

            "job_latitude": lat,
            "job_longitude": lng,

            "employer_name": job.get("organization"),
            "employer_logo": job.get("organization_logo"),
            "employer_website": job.get("linkedin_org_url"),

            "job_min_salary": job_min_salary,
            "job_max_salary": job_max_salary,
            "job_salary_period": job_salary_period,
            "job_posted_at": job_posted_at,
        }

    # ------------------------------------------------------------------ #
    #  Old JSearch schema: just strip noisy fields                        #
    # ------------------------------------------------------------------ #
    def _truncate_jsearch_job(self, job: dict) -> dict:
        properties_to_remove = {
            "apply_options",
            "job_benefits",
            "job_city",
            "job_google_link",
            "job_id",
            "job_location",
            "job_onet_job_zone",
            "job_onet_soc",
            "job_posted_at_datetime_utc",
            "job_posted_at_timestamp",
            "job_state",
        }
        return {k: v for k, v in job.items() if k not in properties_to_remove}

    def truncate_job_listing_properties(self, job_listing: list) -> list:
        """
        Normalizes a list of raw job objects (from any supported API) into
        the canonical schema the LLM prompt expects.

        Detection heuristic:
          - LinkedIn API objects contain an 'organization' key.
          - JSearch API objects contain a 'job_title' key.
        """
        normalized = []
        for job in job_listing:
            if "organization" in job:
                # New LinkedIn RapidAPI schema
                normalized.append(self._normalize_linkedin_job(job))
            else:
                # Legacy JSearch schema
                normalized.append(self._truncate_jsearch_job(job))
        return normalized


    async def job_matching(self, job_listings, job_params: dict):

        client: AsyncOpenAI = AsyncOpenAI(api_key=params["OPENAI_API_KEY"])

        job_seach_prompt = JobSeachPrompt()
        system_prompt = job_seach_prompt.load_system_prompt(
            job_params.get("extracted_resume_fields") or {},
        )
        user_prompt = job_seach_prompt.load_user_prompt(job_listings)

        response = await client.responses.create(
            model=params["OPENAI_MODEL"],
            input=[system_prompt, user_prompt],
            temperature=0,
        )

        response_text = clean_markdown_json(response.output_text)
        jobs_matched = json_decode(response_text)
        return jobs_matched


    async def extract_resume_fields(self, resume_text: str, redis_client: Redis | None = None) -> dict:
        """
        Reads the raw resume text and extracts structured fields:
          - professional_summary (str | null)
          - work_experience (list of objects)
          - skills (list of strings)
          - education (list of objects)

        Results are cached in Redis keyed by a SHA-256 hash of the resume
        text, so the same resume never triggers a second LLM call.
        TTL: 24 hours.
        """
        
        cache_ttl = 60 * 60 * 24  # 24 hours
        resume_hash = hashlib.sha256(resume_text.encode()).hexdigest()
        cache_key = f"resume_extraction:{resume_hash}"

        if redis_client is not None:
            cached = await redis_client.get(cache_key)
            if cached is not None:
                logger.info("Cache HIT for resume extraction (key=%s)", cache_key)
                return json_decode(cached)

        client: AsyncOpenAI = AsyncOpenAI(api_key=params["OPENAI_API_KEY"])

        prompt = ResumeExtractionPrompt()
        system_prompt = prompt.load_system_prompt(resume_text)
        user_prompt = prompt.load_user_prompt()

        response = await client.responses.create(
            model=params["OPENAI_MODEL"],
            input=[system_prompt, user_prompt],
            temperature=0,
        )

        response_text = clean_markdown_json(response.output_text)
        extracted = json_decode(response_text)
        logger.info("EXTRACTED RESUME DATA %s", extracted)

        if redis_client is not None:
            await redis_client.setex(cache_key, cache_ttl, json.dumps(extracted))
            logger.info("Cache SET for resume extraction (key=%s, ttl=%ds)", cache_key, cache_ttl)

        return extracted


    async def search_rapidapi_jobs_jsearch(self, job_title, country, date_posted, page):
        """
        Free tier: 150 requests/month
        API: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
        Asynchronous version using httpx.AsyncClient for better performance.
        """

        url = "https://jsearch.p.rapidapi.com/search"

        querystring = {
            "query": f"{job_title} ",
            "country": country,
            "page": page,
            "num_pages": page,
            "date_posted": date_posted,
        }

        headers = {
            "X-RapidAPI-Key": params["RAPID_API_KEY"],
            "X-RapidAPI-Host": params["RAPID_API_HOST"],
        }

        try:
            async with httpx.AsyncClient(timeout=30, http2=True) as client:
                response = await client.get(url, headers=headers, params=querystring)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error("Timeout occurred while searching for jobs on RapidAPI")
            return {"data": []}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while searching for jobs: {e.response.status_code} - {e.response.text}")
            return {"data": []}
        except Exception as e:
            logger.error(f"An unexpected error occurred during job search: {e}", exc_info=True)
            return {"data": []}

    async def search_rapidapi_linkedin_jobs(self, title_filter: str, location_filter: str = "United States", limit: str = "10"):
        url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-7d"

        querystring = {
            "limit": limit,
            "offset": "0",
            "title_filter": f'"{title_filter}"',
            "location_filter": f'"{location_filter}"',
            "description_type": "text"
        }

        headers = {
            "X-RapidAPI-Key": params["RAPID_API_KEY"],
            "X-RapidAPI-Host": params["LINKEDIN_RAPID_API_HOST"],
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=30, http2=True) as client:
                response = await client.get(url, headers=headers, params=querystring)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error("Timeout occurred while searching for LinkedIn jobs on RapidAPI")
            return {"data": []}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while searching for LinkedIn jobs: {e.response.status_code} - {e.response.text}")
            return {"data": []}
        except Exception as e:
            logger.error(f"An unexpected error occurred during LinkedIn job search: {e}", exc_info=True)
            return {"data": []}



# Example response object from job rapid API:
# {
#     "employer_logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0EfPVHF5N0I08Ioa1WKZDYxcfrJkurRgwcHI5&s=0",
#     "employer_name": "Lensa",
#     "employer_website": "https://lensa.com",
#     "job_apply_is_direct": false,
#     "job_apply_link": "https://www.linkedin.com/jobs/view/2026-ford-undergraduate-program-tech-data-automation-at-lensa-4339455550?utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic",
#     "job_benefits": null,
#     "job_city": "Washington",
#     "job_country": "US",
#     "job_description": "Lensa is a career site that helps job seekers find great jobs in the US. We are not a staffing firm or agency. Lensa does not hire directly for these jobs, but promotes jobs on LinkedIn on behalf of its direct clients, recruitment ad agencies, and marketing partners. Lensa partners with DirectEmployers to promote this job for Ford Motor Company. Clicking \"Apply Now\" or \"Read more\" on Lensa redirects you to the job board/employer site. Any information collected there is subject to their terms and privacy notice.\n• Process Automation: Design and implement automation solutions to streamline workflows and eliminate manual processes.\n• Data Analytics: Deep dive into complex datasets, creating daily tracking reports and generating actionable insights to drive performance.\n• System Optimization: Apply engineering logic and technical skills to enhance business operational efficiency.\n• Undergraduate students in Computer Engineering, IT, Data Science, Industrial Engineering, or related fields.\n• Strong proficiency in Microsoft Office, especially Excel (Advanced).\n• Experience with Power Apps, Power BI, and SharePoint is highly desirable.\n• Familiarity with automation tools, scripting, or coding (e.g., Python, VBA, SQL) is a huge plus.\n• Analytical mind with a passion for turning data into solutions.\n• Good command of English, both written and spoken.\n• Able to join the program for 4-6 months.\n• Must be able to provide an official letter (?) from your university.\n\nRequisition ID : 55690\n\nIf you have questions about this posting, please contact support@lensa.com",
#     "job_employment_type": "Full-time",
#     "job_employment_types": ["FULLTIME"],
#     "job_google_link": "https://www.google.com/search?q=jobs&gl=us&hl=en&udm=8#vhid=vt%3D20/docid%3Dwu9g5S8uho2xW8RZAAAAAA%3D%3D&vssid=jobs-detail-viewer",
#     "job_highlights": {"Qualifications": [...], "Responsibilities": [...]},
#     "job_id": "wu9g5S8uho2xW8RZAAAAAA==",
#     "job_is_remote": false,
#     "job_latitude": 38.9071923,
#     "job_location": "Washington, DC",
#     "job_longitude": -77.0368707,
#     "job_max_salary": null,
#     "job_min_salary": null,
#     "job_onet_job_zone": "5",
#     "job_onet_soc": "21101200",
#     "job_posted_at": "17 hours ago",
#     "job_posted_at_datetime_utc": "2025-11-29T07:00:00.000Z",
#     "job_posted_at_timestamp": 1764399600,
#     "job_publisher": "LinkedIn",
#     "job_salary": null,
#     "job_salary_period": null,
#     "job_state": "District of Columbia",
#     "job_title": "2026 Ford Undergraduate Program - Tech & Data Automation"
# }
