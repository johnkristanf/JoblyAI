import requests
import httpx
from src.config import settings


def search_adzuna_jobs(self, query, location, country="us"):
    """
    Searches Adzuna jobs API for the given query and location.

    Args:
        query (str): The job search query.
        location (str): The job location.
        app_id (str): Your Adzuna application ID.
        app_key (str): Your Adzuna application Key.
        country (str): The country code for the search ("us" or "gb" or others). Defaults to "us".

    Returns:
        dict: The JSON response from the Adzuna API.
    """

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "what": query,
        "where": location,
        "results_per_page": 20,
    }

    response = requests.get(url, params=params)
    if response.status_code == 401:
        print("Authorization failed: Please check your app_id and app_key.")
        print(
            "If you do not have valid credentials, register for free at https://developer.adzuna.com/ to get them."
        )
        return None
    elif response.status_code != 200:
        print(f"Error: Received status code {response.status_code}")
        print(response.text)
        return None

    return response.json()


async def search_rapidapi_jobs_jsearch(job_title, country, date_posted, page):
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
        "X-RapidAPI-Key": settings.RAPID_API_KEY,
        "X-RapidAPI-Host": settings.RAPID_API_HOST,
    }

    try:
        async with httpx.AsyncClient(timeout=30, http2=True) as client:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        # log here
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
