from fastapi import APIRouter, Depends
from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.database import Database
from src.utils import json_serialize_llm_response
from src.prompt import JobSeachPrompt

from src.config import settings
from src.job.schema import JobsSearchIn, SaveJobIn
from src.job.models import Job

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


@job_router.post("/save")
async def save_job(
    # user_id: int,  # DAPAT PAGKUHA SA ID IS THROUGH DEPENDENCY NA get_authenticated_user
    payload: SaveJobIn,
    session: AsyncSession = Depends(Database.get_async_session),
):
    DUMMY_USER_ID = 1
    job_data = payload.model_dump()
    job_data["user_id"] = DUMMY_USER_ID

    new_job = Job(**job_data)
    session.add(new_job)
    await session.commit()
    await session.refresh(new_job)

    return {"message": "Job saved successfully", "job": payload}


@job_router.get("/saved")
async def get_saved_jobs_by_user(
    # user_id: int,  # DAPAT PAGKUHA SA ID IS THROUGH DEPENDENCY NA get_authenticated_user
    session: AsyncSession = Depends(Database.get_async_session),
):
    DUMMY_USER_ID = 1
    result = await session.execute(
        select(Job).where(Job.user_id == DUMMY_USER_ID).order_by(Job.id.desc())
    )
    jobs = result.scalars().all()
    return jobs
