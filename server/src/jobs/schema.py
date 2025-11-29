from pydantic import BaseModel


class JobsSearchIn(BaseModel):
    job_title: str
    location: str | None = None
    country: str
    date_posted: str
    
    experience: str
    professional_summary: str
