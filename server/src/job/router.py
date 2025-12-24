import json
import httpx

from fastapi import APIRouter, Depends, File, UploadFile, Form
from redis.client import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.utils import (
    extract_data_from_batch_tasks,
    json_decode,
    read_return_pdf_content_stream,
)
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
    new_resume: UploadFile = File(None),
    existing_resume: str = Form(None),
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
):
    print(
        f"job_title: {job_title}, date_posted: {date_posted}, country: {country}, user: {user}"
    )
    print(f"new_resume: {new_resume}")
    print(f"existing_resume: {existing_resume}")

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

    # Read uploaded resume data from the memory
    resume_text = ""
    if new_resume is not None:
        try:
            resume_content = await new_resume.read()
            resume_text = read_return_pdf_content_stream(resume_content)
        except Exception as e:
            print(f"Error extracting text from resume: {e}")
            resume_text = ""

    # Read existing resume data from object storage source
    if existing_resume is not None:
        resume_data = json_decode(existing_resume)
        resume_source_url = resume_data.get("resume_source_url")
        if resume_source_url:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(resume_source_url)
                    if response.status_code == 200:
                        resume_content = response.content
                        resume_text = read_return_pdf_content_stream(resume_content)
                    else:
                        print(
                            f"Failed to fetch resume from {resume_source_url}: {response.status_code}"
                        )
            except Exception as e:
                print(f"Error fetching or reading the resume from URL: {e}")

    print(f"resume_text: {resume_text}")

    raw_job_listings = job_search_results.get("data", [])
    job_listings = truncate_job_listing_properties(raw_job_listings)

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
