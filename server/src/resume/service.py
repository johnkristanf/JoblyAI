import logging
import base64

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status, UploadFile

from src.utils import json_decode, read_return_pdf_content_stream, read_return_docx_content, is_valid_resume_file, get_file_extension
from src.resume.model import Resume
from src.config.runtime import params
from src.celery.tasks.resume_upload import upload_resume
from src.aws.s3_service import S3Service


logger = logging.getLogger("resume")


class ResumeService:
    def __init__(self, s3_service: S3Service):
        self.s3 = s3_service

    async def create_db_resume(
        self, session: AsyncSession, filename: str, object_key: str, user_id: str
    ):
        db_resume = Resume(
            filename=filename,
            object_key=object_key,
            user_id=user_id,
        )
        session.add(db_resume)
        await session.commit()
        await session.refresh(db_resume)
        return db_resume

    async def get_all_resume(self, session: AsyncSession, user_id):
        try:
            result = await session.execute(
                select(Resume)
                .where(Resume.user_id == user_id)
                .order_by(Resume.created_at.desc())
            )

            return result.scalars().all()
        except Exception as e:
            logger.error(
                "Database error while fetching resumes",
                extra={
                    "endpoint": "/resume/get/all",
                    "user_id": user_id,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch resumes",
            )

    async def get_user_resume_by_id(
        self, session: AsyncSession, resume_id: int, user_id: int
    ) -> Resume:
        try:
            result = await session.execute(
                select(Resume)
                .where(Resume.id == resume_id, Resume.user_id == user_id)
                .order_by(Resume.created_at.desc())
            )

            resume = result.scalar_one_or_none()
            if not resume:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
                )
            return resume
        except Exception as e:
            logger.error(
                "Database error while fetching resume by id",
                extra={
                    "endpoint": "/resume/get/by_id",
                    "user_id": user_id,
                    "resume_id": resume_id,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise HTTPException(status_code=500, detail="Failed to fetch resumes")

    async def remove_resume_for_user(
        self, session: AsyncSession, resume_id: int, user_id: int
    ):
        result = await session.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
            )

        await session.delete(resume)
        await session.commit()

        return resume

    async def check_resume_already_exists(
        self, session: AsyncSession, filename: str, user_id: str
    ) -> None:
        """Raise HTTP 409 if a resume with the same filename already exists for this user."""
        existing = await session.execute(
            select(Resume).where(
                Resume.user_id == user_id,
                Resume.filename == filename,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A resume named '{filename}' already exists. Please select it from your existing resumes or upload a file with a different name.",
            )

    async def handle_new_resume(
        self, new_resume: UploadFile, user: dict, session: AsyncSession | None
    ) -> tuple[str, str | None]:
        """Validate, deduplicate, extract text, and enqueue background upload for a new resume file.
        Returns (resume_text, upload_task_id).
        """
        filename = new_resume.filename or "resume.pdf"
        content_type = new_resume.content_type or "application/pdf"

        if not is_valid_resume_file(filename, content_type):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid file type. Only PDF and Word (.doc/.docx) files are accepted.",
            )

        if session is not None:
            await self.check_resume_already_exists(session, filename, user.get("id"))

        resume_text = ""
        upload_task_id = None
        try:
            resume_content = await new_resume.read()
            ext = get_file_extension(filename)
            if ext in ("doc", "docx"):
                resume_text = read_return_docx_content(resume_content)
            else:
                resume_text = read_return_pdf_content_stream(resume_content)

            # Fire-and-forget: persist resume to S3 + DB in the background
            file_bytes_b64 = base64.b64encode(resume_content).decode("utf-8")
            upload_task = upload_resume.delay(
                file_bytes_b64=file_bytes_b64,
                filename=filename,
                content_type=content_type,
                user_id=user.get("id"),
            )
            if upload_task:
                upload_task_id = upload_task.id
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error extracting text from resume: {e}")
            resume_text = ""

        return resume_text, upload_task_id

    def handle_existing_resume(self, existing_resume: str) -> tuple[str, str | None]:
        """Decode the existing-resume JSON payload and fetch its text from S3.
        Returns (resume_text, object_key).
        """
        existing_resume_data = json_decode(existing_resume)
        object_key = existing_resume_data.get("object_key")
        resume_text = ""
        if object_key:
            try:
                resume_text = self.s3.get_resume_text(params["AWS_S3_BUCKET_NAME"], object_key)
            except Exception as e:
                logger.error(f"Error fetching existing resume from S3: {e}", exc_info=True)
        return resume_text, object_key
