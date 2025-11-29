from fastapi import APIRouter, Depends, Request
from src.prompt import JobSeachPrompt
from src.config import settings
from src.jobs.schema import JobsSearchIn
from src.jobs.dependencies import get_jobs_service
from src.jobs.service import JobsService
from openai import OpenAI

jobs_router = APIRouter()

@jobs_router.post("/search")
def job_search(
    request: Request,
    payload: JobsSearchIn,
    jobs_service: JobsService = Depends(get_jobs_service),
):

    openai_client: OpenAI = request.app.state.openai_client

    job_listings = jobs_service.search_rapidapi_jobs_jsearch(
        payload.job_title, 
        payload.location, 
        payload.country, 
        payload.date_posted  # all, today, 3days, week, month
    )

    # job_seach_prompt = JobSeachPrompt()

    # response = openai_client.chat.completions.create(
    #     model=settings.OPENAI_MODEL,
    #     temperature=0.5,
    #     messages=[
    #         job_seach_prompt.load_system_prompt(
    #             payload.job_title, payload.experience, payload.professional_summary
    #         ),
    #         job_seach_prompt.load_user_prompt(job_listings),
    #     ],
    # )

    return {"job_listings": job_listings}
