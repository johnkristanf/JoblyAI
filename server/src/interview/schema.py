from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Literal, Optional


InterviewType = Literal["TECHNICAL", "BEHAVIORAL", "HR_SCREENING"]
InterviewResult = Literal[
    "EXCELLENT", "PASSED", "BORDERLINE", "NEEDS_IMPROVEMENT", "FAILED", "INCOMPLETE"
]


class CreateInterviewRequest(BaseModel):
    type: InterviewType
    job_title: str | None = None
    employer: str | None = None
    resume_object_key: str | None = None


class CreateInterviewResponse(BaseModel):
    interview_id: str


class InterviewRecordResponse(BaseModel):
    id: UUID
    type: InterviewType
    job_title: Optional[str] = None
    employer: Optional[str] = None
    result: Optional[InterviewResult] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
