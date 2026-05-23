from pydantic import BaseModel

class RemoveResumeIn(BaseModel):
    id: int
    object_key: str

class TailorResumeIn(BaseModel):
    object_key: str
    job_title: str
    job_description: str
    employer_name: str | None = None