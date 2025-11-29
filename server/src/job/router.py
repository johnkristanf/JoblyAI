from fastapi import APIRouter
from src.utils import json_serialize_llm_response
from src.prompt import JobSeachPrompt
from openai import OpenAI

from src.config import settings
from src.job.schema import JobsSearchIn
from src.job.service import search_rapidapi_jobs_jsearch

job_router = APIRouter()


@job_router.post("/search")
def job_search(
    payload: JobsSearchIn,
):
    client: OpenAI = OpenAI(api_key=settings.OPENAI_API_KEY)
    print(f"payload: {payload}")

    results = search_rapidapi_jobs_jsearch(
        job_title=payload.job_title,
        country=payload.country,
        date_posted=payload.date_posted,  # all, today, 3days, week, month
        page="1",
    )
    job_listings = results.get("data", [])
    print(f"job_listings: {job_listings}")

    job_seach_prompt = JobSeachPrompt()

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            job_seach_prompt.load_system_prompt(
                payload.job_title,
                payload.experience_level,
                payload.professional_summary,
            ),
            job_seach_prompt.load_user_prompt(job_listings),
        ],
    )
    print(f"response.output_text: {response.output_text}")

    jobs_matched = json_serialize_llm_response(response.output_text)

    return {"job_listings": job_listings, "jobs_matched": jobs_matched}
