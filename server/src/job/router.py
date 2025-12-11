import json
import pymupdf

from fastapi import APIRouter, Depends, File, UploadFile, Form
from redis.client import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.utils import extract_data_from_batch_tasks
from src.job.schema import JobsSearchIn, SaveJobIn
from src.job.models import Job

from src.job.service import (
    llm_job_extraction,
    search_rapidapi_jobs_jsearch,
    truncate_job_listing_properties,
)

job_router = APIRouter()


@job_router.post("/search")
async def job_search(
    job_title: str = Form(...),
    date_posted: str = Form(...),
    country: str = Form(...),
    resume: UploadFile = File(None),
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
):
    print(
        f"job_title: {job_title}, date_posted: {date_posted}, country: {country}, user: {user}"
    )
    print(f"resume: {resume}")

    job_search_results = None
    cache_key = f"jobsearch:{job_title}:{country}:{date_posted}"

    cached_results = redis_client.get(cache_key)
    if cached_results is None:
        print("NO CACHE")
        job_search_results = await search_rapidapi_jobs_jsearch(
            job_title=job_title,
            country=country,
            date_posted=date_posted,  # all, today, 3days, week, month
            page="4",
        )

        expire_seconds = 15 * 60  # 15 minutes in seconds
        redis_client.setex(cache_key, expire_seconds, json.dumps(job_search_results))
    else:
        print("CACHE HIT ")
        job_search_results = json.loads(cached_results)

    # Scrape text data out of a resume PDF using pymupdf (fitz)
    resume_text = ""
    if resume is not None:
        try:
            resume_content = await resume.read()
            doc = pymupdf.open(stream=resume_content, filetype="pdf")
            for page in doc:
                resume_text += page.get_text()
        except Exception as e:
            print(f"Error extracting text from resume: {e}")
            resume_text = ""

    print(f"resume_text: {resume_text}")

    job_listings_raw = job_search_results.get("data", [])
    job_listings = truncate_job_listing_properties(job_listings_raw)

    print(f"job_listings: {job_listings}")

    job_data = {
        "resume_text": resume_text,
    }
    jobs_matched = await extract_data_from_batch_tasks(
        list_data=job_listings, awaitable=llm_job_extraction, params=job_data
    )
    print(f"jobs_matched: {jobs_matched}")

    return {"job_listings": job_listings, "jobs_matched": jobs_matched}


@job_router.post("/save")
async def save_job(
    payload: SaveJobIn,
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
):
    job_data = payload.model_dump()
    job_data["user_id"] = user.get("id")

    new_job = Job(**job_data)
    session.add(new_job)
    await session.commit()
    await session.refresh(new_job)

    return {"message": "Job saved successfully", "job": payload}


@job_router.get("/saved")
async def get_saved_jobs_by_user(
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
):
    user_id = user.get("id")
    result = await session.execute(
        select(Job).where(Job.user_id == user_id).order_by(Job.id.desc())
    )
    jobs = result.scalars().all()
    return jobs
