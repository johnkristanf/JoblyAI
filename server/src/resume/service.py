import os
import boto3
import logging
import asyncio

from botocore.exceptions import ClientError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool

from src.resume.model import Resume
from src.pydantic_config import settings
from src.config.runtime import params

from dotenv import load_dotenv

load_dotenv()

if os.getenv("APP_ENV") == "development":
    session = boto3.Session(profile_name=settings.AWS_PROFILE)
    s3 = session.client("s3", region_name=settings.AWS_REGION)
else:
    s3 = boto3.client("s3", region_name=params["AWS_REGION"])


logger = logging.getLogger("resume")
s3_semaphore = asyncio.Semaphore(5)


class ResumeService:

    async def create_db_resume(
        self, session: AsyncSession, filename: str, object_key: str, user_id: int
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
        session: AsyncSession, resume_id: int, user_id: int
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

    # ---------------------------------- AWS S3 RELATED METHODS ---------------------------------------

    def put_s3_object(
        self,
        bucket: str,
        object_key: str,
        file_content: bytes,
        file_content_type: str | None,
    ):
        return s3.put_object(
            Bucket=bucket,
            Key=object_key,
            Body=file_content,
            ContentType=file_content_type,
        )

    def generate_presigned_url(self, bucket: str, key: str) -> str:
        return s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": bucket,
                "Key": key,
            },
            ExpiresIn=60 * 30,  # 30 minutes
        )

    async def get_presigned_url_safe(self, bucket: str, key: str) -> str:
        """
        Generate a presigned S3 URL safely using a semaphore to control concurrency
        and a threadpool to avoid blocking the async event loop.
        """
        async with s3_semaphore:
            return await run_in_threadpool(
                self.generate_presigned_url,
                bucket,
                key,
            )

    def remove_object_from_s3(self, bucket, object_key, user_id):
        try:
            s3.delete_object(Bucket=bucket, Key=object_key)
        except ClientError as e:
            logger.error(
                "Failed to delete object from S3",
                extra={
                    "bucket": params["AWS_S3_BUCKET_NAME"],
                    "key": object_key,
                    "endpoint": "/resume/remove",
                    "user_id": user_id,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to remove from S3: {str(e)}",
            )
