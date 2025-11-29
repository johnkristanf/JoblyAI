from pydantic import BaseModel


class JobsSearchIn(BaseModel):
    job_title: str
    experience_level: str
    date_posted: str
    country: str
    professional_summary: str


class SaveJobIn(BaseModel):
    job_title: str | None = None
    job_description: str | None = None
    job_employment_type: str | None = None
    job_apply_link: str | None = None
    job_apply_is_direct: bool | None = None
    job_is_remote: bool | None = None

    employer_name: str | None = None
    employer_logo: str | None = None
    employer_website: str | None = None

    job_min_salary: float | None = None
    job_max_salary: float | None = None
    job_salary_period: str | None = None

    extraction_note: str | None = None