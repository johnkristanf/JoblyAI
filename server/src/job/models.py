from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    job_title = Column(String, nullable=True)
    job_description = Column(String, nullable=True)
    job_employment_type = Column(String, nullable=True)
    job_apply_link = Column(String, nullable=True)
    job_apply_is_direct = Column(Boolean, nullable=True)
    job_is_remote = Column(Boolean, nullable=True)
    job_country = Column(String, nullable=True)
    job_publisher = Column(String, nullable=True)

    job_latitude = Column(Float, nullable=True)
    job_longitude = Column(Float, nullable=True)

    employer_name = Column(String, nullable=True)
    employer_logo = Column(String, nullable=True)
    employer_website = Column(String, nullable=True)

    job_min_salary = Column(Float, nullable=True)
    job_max_salary = Column(Float, nullable=True)
    job_salary_period = Column(String, nullable=True)

    extraction_note = Column(String, nullable=True)

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        nullable=False,
        foreign_key=ForeignKey("auth.users.id", ondelete="CASCADE"),
    )
