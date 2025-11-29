from pydantic import BaseModel


class JobsSearchIn(BaseModel):
    job_title: str
    experience_level: str
    date_posted: str
    country: str
    professional_summary: str

