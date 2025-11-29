from src.jobs.service import JobsService

def get_jobs_service(openai_client):
    return JobsService(openai_client)
