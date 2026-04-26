import json
import asyncio

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from openai import OpenAI
from playwright.sync_api import sync_playwright
from redis.client import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.tasks.job_matching import job_matching
from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.utils import (
    extract_data_from_batch_tasks,
    json_decode,
    read_return_pdf_content_stream,
)
from src.job.schema import JobsSearchIn, SaveJobIn, InterviewProcessIn, AutoApplyIn, EmployerInsightsIn
from src.job.models import Job
from src.job.playwright_tools import TOOL_SCHEMAS, TOOL_DISPATCH

from src.job.service import (
    extract_resume_from_source,
    truncate_job_listing_properties,
)
from src.job.dependencies import get_jobs_service
from src.job.service import JobsService

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
    jobs_service: JobsService = Depends(get_jobs_service),
):
    job_list_page_length = "3"
    job_search_results = None
    cache_key = f"jobsearch:{job_title}:{country}:{date_posted}"

    cached_results = await redis_client.get(cache_key)
    if cached_results is None:
        job_search_results = await jobs_service.search_rapidapi_jobs_jsearch(
            job_title=job_title,
            country=country,
            date_posted=date_posted,  # all, today, 3days, week, month
            page=job_list_page_length,
        )

        ttl = 15 * 60  # 15 minutes in seconds
        await redis_client.setex(cache_key, ttl, json.dumps(job_search_results))
    else:
        job_search_results = json_decode(cached_results)

    # Read uploaded resume data from the memory
    resume_text = ""
    if new_resume is not None:
        try:
            resume_content = await new_resume.read()
            resume_text = read_return_pdf_content_stream(resume_content)
        except Exception as e:
            print(f"Error extracting text from resume PDF: {e}")
            resume_text = ""

    # Read existing resume data from object storage source
    if existing_resume is not None:
        resume_data = json_decode(existing_resume)
        resume_source_url = resume_data.get("resume_source_url")
        if resume_source_url:
            resume_text = await extract_resume_from_source(resume_source_url)

    # Pre-process job listing before feeding to LLM
    raw_job_listings = job_search_results.get("data", [])
    job_listings = truncate_job_listing_properties(raw_job_listings)

    # Process llm job in the background
    task = job_matching.delay(job_listings, resume_text)
    print(f"task LLM: {task}")

    return {"message": "Job matching task submitted successfully", "task_id": task.id}


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


@job_router.get("/search/response/{taskID}")
async def get_job_search_response(
    taskID: str,
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
):
    key = f"task:{taskID}"
    result = await redis_client.get(key)
    if not result:
        return {"error": "No search response found for this task."}, 404

    job_response_data = json_decode(result)
    return job_response_data


@job_router.post("/interview-process")
async def get_interview_process(
    payload: InterviewProcessIn,
    user: dict = Depends(verify_user_from_token),
    jobs_service: JobsService = Depends(get_jobs_service),
):
    job_data = payload.model_dump(exclude_none=True)
    process_text = await jobs_service.generate_interview_process(job_data)
    return {"process": process_text}


@job_router.post("/employer-insights")
async def get_employer_insights(
    payload: EmployerInsightsIn,
    user: dict = Depends(verify_user_from_token),
    jobs_service: JobsService = Depends(get_jobs_service),
):
    try:
        insights_text = await jobs_service.generate_employer_insights(payload.employer_website)
        return {"insights": insights_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

MAX_AGENT_ITERATIONS = 15


def _build_system_prompt(payload: AutoApplyIn) -> str:
    p = payload.user_profile
    profile_lines = [
        f"- Full name: {p.full_name}",
        f"- Email: {p.email}",
        f"- Phone: {p.phone or 'not provided'}",
        f"- Location: {p.location or 'not provided'}",
        f"- LinkedIn: {p.linkedin_url or 'not provided'}",
        f"- Current role: {p.current_role or 'not provided'}",
        f"- Years of experience: {p.years_of_experience if p.years_of_experience is not None else 'not provided'}",
        f"- Highest education: {p.highest_education or 'not provided'}",
        f"- Resume URL: {p.resume_url or 'not provided'}",
    ]
    job_lines = [
        f"- Job title: {payload.job_title or 'not provided'}",
        f"- Employer: {payload.employer_name or 'not provided'}",
        f"- Apply URL: {payload.job_apply_link}",
    ]
    return (
        "You are an automated job application assistant. "
        "Your goal is to complete a job application on behalf of the user using the browser tools available to you.\n\n"
        "## Job Information\n" + "\n".join(job_lines) + "\n\n"
        "## Applicant Profile\n" + "\n".join(profile_lines) + "\n\n"
        "## Instructions\n"
        "1. Navigate to the job apply URL.\n"
        "2. Get a page snapshot to understand the current state of the page.\n"
        "3. Detect which job site you are on (LinkedIn, Jobstreet, Glassdoor, Beebee, or generic) and use the appropriate site-specific apply button tool if available.\n"
        "4. Fill in every required form field using the applicant profile data above.\n"
        "5. If a field cannot be mapped to the profile data, skip it and move on.\n"
        "6. After all fields are filled, click the submit/apply button.\n"
        "7. Once the application is submitted (or you reach a page that requires human login/verification), stop calling tools and return a final summary of what was completed.\n"
        "8. Do NOT close the browser — the user will continue from where you left off.\n"
    )


def _run_llm_auto_apply(payload: AutoApplyIn, openai_api_key: str, openai_model: str) -> dict:
    """Run the LLM agentic loop with Playwright tools to apply for a job."""
    import logging
    agent_logger = logging.getLogger("playwright_agent")

    client = OpenAI(api_key=openai_api_key)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        messages = [
            {"role": "system", "content": _build_system_prompt(payload)},
            {"role": "user", "content": "Please start the automated job application now."},
        ]

        actions_taken: list[str] = []

        for iteration in range(MAX_AGENT_ITERATIONS):
            response = client.chat.completions.create(
                model=openai_model,
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
            )

            assistant_message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason

            # Append the raw assistant message to keep conversation history intact
            messages.append(assistant_message)

            # No tool calls — LLM decided it is done
            if finish_reason != "tool_calls" or not assistant_message.tool_calls:
                final_text = assistant_message.content or "Agent completed."
                actions_taken.append(f"Agent finished: {final_text.strip()}")
                break

            # Execute each tool call and collect results
            for call in assistant_message.tool_calls:
                tool_name = call.function.name
                try:
                    args = json.loads(call.function.arguments) if call.function.arguments else {}
                except (json.JSONDecodeError, TypeError):
                    args = {}

                if tool_name in TOOL_DISPATCH:
                    try:
                        result = TOOL_DISPATCH[tool_name](page, **args)
                    except Exception as e:
                        result = f"Tool execution error: {e}"
                else:
                    result = f"Unknown tool: {tool_name}"

                agent_logger.info(
                    f"[iter={iteration}] Tool={tool_name} args={args} -> {result[:200]}"
                )
                actions_taken.append(f"{tool_name}({args}) -> {result[:120]}")

                # Feed each tool result back as a 'tool' role message
                messages.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": result,
                })

        # Browser intentionally left open for the user
        return {
            "message": "Auto-apply agent completed",
            "actions_taken": actions_taken,
            "iterations": iteration + 1,
        }


@job_router.post("/auto-apply")
async def auto_apply_job(
    payload: AutoApplyIn,
    user: dict = Depends(verify_user_from_token),
):
    if not payload.job_apply_link:
        raise HTTPException(status_code=400, detail="No apply link provided")

    from src.config.runtime import params
    result = await asyncio.to_thread(
        _run_llm_auto_apply,
        payload,
        params["OPENAI_API_KEY"],
        params["OPENAI_MODEL"],
    )
    return result
