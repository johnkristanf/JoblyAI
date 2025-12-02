from sqlalchemy import Column, String, ForeignKey
from src.database import Base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        nullable=False,
        unique=True,
        foreign_key=ForeignKey("auth.users.id", ondelete="CASCADE"),
    )
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
