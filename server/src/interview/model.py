import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from src.database import Base

interview_type_enum = ENUM(
    "TECHNICAL",
    "BEHAVIORAL",
    "HR_SCREENING",
    name="type",
    create_type=False,
)

interview_result_enum = ENUM(
    "EXCELLENT",
    "PASSED",
    "BORDERLINE",
    "NEEDS_IMPROVEMENT",
    "FAILED",
    "INCOMPLETE",
    name="result",
    create_type=False,
)


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type = Column(interview_type_enum, nullable=False)

    job_title = Column(String, nullable=True)
    employer = Column(String, nullable=True)
    resume_object_key = Column(String, nullable=True)

    # Populated at the end of the session
    transcripts = Column(JSONB, nullable=True)  # [{role, text}, ...]

    # Populated by the grader after the session
    result = Column(interview_result_enum, nullable=True)
    feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
