from dotenv import load_dotenv

load_dotenv()

import boto3
import uuid
import os
import logging

from botocore.exceptions import ClientError
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi import UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from src.config.runtime import params
from src.resume.schema import RemoveResumeIn
from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.resume.model import Resume
from src.pydantic_config import settings


if os.getenv("APP_ENV") == "development":
    session = boto3.Session(profile_name=settings.AWS_PROFILE)
    s3 = session.client("s3", region_name=settings.AWS_REGION)
else:
    s3 = boto3.client("s3", region_name=params["AWS_REGION"])


logger = logging.getLogger("resume")
resume_router = APIRouter()


@resume_router.post("/upload")
async def upload_resume(
    resume: list[UploadFile] = File(...),
    session: AsyncSession = Depends(Database.get_async_session),
    user: dict = Depends(verify_user_from_token),
):
    print(f"resume 123: {resume}")
    print(f"user 123: {user}")

    uploaded_files = []
    for file in resume:
        object_key = f"resumes/{user.get('id')}/{uuid.uuid4()}_{file.filename}"
        file_content = await file.read()
        try:
            s3.put_object(
                Bucket=params["AWS_S3_BUCKET_NAME"],
                Key=object_key,
                Body=file_content,
                ContentType=file.content_type,
            )

            # Insert resume details in database
            db_resume = Resume(
                filename=file.filename, object_key=object_key, user_id=user.get("id")
            )

            session.add(db_resume)
            await session.commit()
            await session.refresh(db_resume)

            uploaded_files.append(
                {
                    "filename": file.filename,
                    "content_type": file.content_type,
                }
            )
        except Exception as e:
            print(f"Error uploading {file.filename}: {e}")
            await session.rollback()
            uploaded_files.append(
                {
                    "filename": file.filename,
                    "error": str(e),
                }
            )
    return {
        "message": "Resume(s) uploaded",
        "files": uploaded_files,
    }


@resume_router.get("/get/all")
async def get_all_resume_urls(
    session: AsyncSession = Depends(Database.get_async_session),
    user: dict = Depends(verify_user_from_token),
):
    """
    Fetch all resumes for the current user, generate temp URLs for each file in S3,
    and return an array of objects with filename, upload date, S3 temp URL, and object key.
    """
    user_id = user.get("id")
    logger.info(
        "Fetching all resumes",
        extra={
            "endpoint": "/resume/get/all",
            "user_id": user_id,
        },
    )

    try:
        result = await session.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )
        all_resumes = result.scalars().all()
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

    resumes = []
    for resume in all_resumes:
        resume_dict = {
            "id": resume.id,
            "name": resume.filename,
            "upload_date": getattr(resume, "created_at", None),
            "objectKey": resume.object_key,
            "url": None,
        }

        try:
            temp_url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": params["AWS_S3_BUCKET_NAME"],
                    "Key": resume.object_key,
                },
                ExpiresIn=60 * 30,  # 30 minutes
            )
            resume_dict["url"] = temp_url
        except Exception as e:
            logger.error(
                "Failed to generate S3 presigned URL",
                extra={
                    "endpoint": "/resume/get/all",
                    "user_id": user_id,
                    "resume_id": resume.id,
                    "error": str(e),
                },
                exc_info=True,
            )
            resume_dict["error"] = str(e)

        resumes.append(resume_dict)

    return resumes


@resume_router.post("/remove")
async def remove_resume(
    payload: RemoveResumeIn,
    session: AsyncSession = Depends(Database.get_async_session),
    user: dict = Depends(verify_user_from_token),
):
    print(f"payload: {payload}")
    resume_id = payload.id
    object_key = payload.object_key
    if not resume_id or not object_key:
        raise HTTPException(
            detail="resume_id and object_key required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Get the resume for the current user
    result = await session.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.get("id"))
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )

    # Remove from S3
    try:
        s3.delete_object(Bucket=params["AWS_S3_BUCKET_NAME"], Key=object_key)
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to remove from S3: {str(e)}",
        )

    # Remove from database
    await session.delete(resume)
    await session.commit()

    return {"success": True, "message": "Resume removed."}
