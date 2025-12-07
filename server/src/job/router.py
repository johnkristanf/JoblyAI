import json

from fastapi import APIRouter, Depends
from redis.client import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

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
    payload: JobsSearchIn, redis_client: Redis = Depends(Database.get_redis_client)
):
    # -----
    # LLM API (OpenAI prompts) optimizations for speed:
    # 1. Reduce context size - limit jobs sent, truncate descriptions, send less fields.
    # 2. Use faster/cheaper models (e.g. gpt-3.5-turbo, not gpt-4).
    # 3. Parallelize jobs: Send to LLM in smaller batches, possibly concurrent if doing per-job calls.
    # 4. Tune prompt - shorter system prompt and user input helps.
    # 5. Early return/caching: If input is identical, cache LLM responses.
    # 6. Use OpenAI function-calling instead of pure text output (structure, less output).
    # 7. If using asyncio, employ asyncio.to_thread if using sync libraries.
    # 8. For ultra-low latency, consider fine-tuning a smaller local model for batch inference.
    # -----

    job_search_results = None
    cache_key = f"jobsearch:{payload.job_title}:{payload.experience_level}:{payload.country}:{payload.date_posted}:{payload.professional_summary}"

    cached_results = redis_client.get(cache_key)
    if cached_results is None:
        print("WALAY CACHE")
        job_search_results = await search_rapidapi_jobs_jsearch(
            job_title=payload.job_title,
            country=payload.country,
            date_posted=payload.date_posted,  # all, today, 3days, week, month
            page="4",
        )

        expire_seconds = 15 * 60  # 15 minutes in seconds
        redis_client.setex(cache_key, expire_seconds, json.dumps(job_search_results))
    else:
        print("CACHE HIT BOSS")
        job_search_results = json.loads(cached_results)

    job_listings_raw = job_search_results.get("data", [])
    job_listings = truncate_job_listing_properties(job_listings_raw)

    print(f"job_listings: {job_listings}")

    job_data = {
        "job_title": payload.job_title,
        "experience_level": payload.experience_level,
        "professional_summary": payload.professional_summary,
    }
    jobs_matched = await extract_data_from_batch_tasks(
        list_data=job_listings, awaitable=llm_job_extraction, params=job_data
    )
    print(f"jobs_matched: {jobs_matched}")

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
