import json
import base64

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from openai import OpenAI
from redis.client import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.celery.tasks.job_matching import job_matching
from src.celery.tasks.resume_upload import upload_resume
from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.utils import (
    json_decode,
    read_return_pdf_content_stream,
)
from src.job.schema import JobsSearchIn, SaveJobIn, EmployerInsightsIn, JobQueryIn
from src.job.models import Job

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from src.config.runtime import params
from src.job.tools.job_search_tool import search_jsearch_job_tool, search_linkedin_job_tool
from src.prompt import JobQueryPrompt

from src.job.dependencies import get_jobs_service
from src.job.service import JobsService

from src.resume.dependencies import get_resume_service
from src.resume.service import ResumeService

# Module-level memory store — persists conversation history per user across requests
_agent_memory = MemorySaver()

job_router = APIRouter()

@job_router.post("/search")
async def job_search(
    job_title: str = Form(...),
    date_posted: str = Form(...),
    country: str = Form(...),
    job_platform: str = Form("all"),
    new_resume: UploadFile = File(None),
    existing_resume: str = Form(None),

    # Dependencies
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
    jobs_service: JobsService = Depends(get_jobs_service),
    resume_service: ResumeService = Depends(get_resume_service),
):
    job_list_page_length = "3"
    job_search_results = await jobs_service.get_job_search_results(
        redis_client=redis_client,
        job_platform=job_platform,
        job_title=job_title,
        country=country,
        date_posted=date_posted,
        job_list_page_length=job_list_page_length,
    )

    # Process resume text and handle upload if new resume
    resume_text, upload_task_id = await resume_service.process_resume_for_job_search(
        new_resume=new_resume,
        existing_resume=existing_resume,
        user=user
    )

    # Pre-process job listing before feeding to LLM
    raw_job_listings = job_search_results.get("data", [])
    job_listings = jobs_service.truncate_job_listing_properties(raw_job_listings)

    # Process llm job in the background
    task = job_matching.delay(job_listings, resume_text)
    print(f"task LLM: {task}")
    
    return {
        "message": "Job matching task submitted successfully",
        "task_id": task.id,
        "resume_upload_task_id": upload_task_id,
    }


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


@job_router.delete("/saved/{job_id}")
async def delete_saved_job_by_id(
    job_id: int,
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
):
    user_id = user.get("id")
    result = await session.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        return {"error": "Saved job not found"}, 404

    await session.delete(job)
    await session.commit()
    return {"message": "Saved job deleted successfully"}




@job_router.post("/employer-insights")
async def get_employer_insights(
    payload: EmployerInsightsIn,
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
    jobs_service: JobsService = Depends(get_jobs_service),
):
    try:
        cache_key = f"employer_insights:{payload.employer_website}"
        cached_insights = await redis_client.get(cache_key)
        
        if cached_insights:
            # Redis get returns bytes for strings in most async clients (like aioredis or redis-py async)
            decoded_insights = cached_insights.decode("utf-8") if isinstance(cached_insights, bytes) else cached_insights
            return {"insights": decoded_insights}

        insights_text, employer_website_context = await jobs_service.generate_employer_insights(payload.employer_website)
        
        # Cache the resulting insights for 24 hours
        ttl = 60 * 60 * 24
        await redis_client.setex(cache_key, ttl, insights_text)
        
        return {"insights": insights_text, "employer_website_context": employer_website_context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@job_router.post("/query")
async def process_job_query(
    payload: JobQueryIn,
    user: dict = Depends(verify_user_from_token)
):
    try:
        # Initialize LLM
        llm = ChatOpenAI(
            model=params["OPENAI_MODEL"], 
            api_key=params["OPENAI_API_KEY"],
            temperature=0
        )
        
        # Load tools and prompt
        tools = [search_jsearch_job_tool, search_linkedin_job_tool]
        prompt_str = JobQueryPrompt().load_system_prompt()
        
        # Create agent with persistent memory (per-user thread)
        agent = create_agent(llm, tools=tools, system_prompt=prompt_str, checkpointer=_agent_memory)
        
        # Use user ID as thread_id to isolate each user's conversation history
        thread_config = {"configurable": {"thread_id": user["id"]}}
        
        # Invoke the agent asynchronously
        result = await agent.ainvoke({"messages": [("user", payload.query)]}, config=thread_config)
        
        # The agent returns a dictionary with 'messages' list; the last message is the AI's final response
        final_message = result["messages"][-1].content
        
        return {"response": final_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
