from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    object_key = Column(String, nullable=False)

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        nullable=False,
        unique=True,
        foreign_key=ForeignKey("auth.users.id", ondelete="CASCADE"),
    )

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
