import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from src.resume.dependencies import get_resume_service
from src.resume.service import ResumeService
from src.config.runtime import params
from src.resume.schema import RemoveResumeIn
from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.resume.model import Resume
from src.pydantic_config import settings


logger = logging.getLogger("resume")
resume_router = APIRouter()


@resume_router.post("/upload")
async def upload_resume(
    resume: list[UploadFile] = File(...),
    resume_service: ResumeService = Depends(get_resume_service),
    session: AsyncSession = Depends(Database.get_async_session),
    user: dict = Depends(verify_user_from_token),
):
    user_id = user.get("id")

    uploaded_files = []
    for file in resume:
        object_key = f"resumes/{user_id}/{uuid.uuid4()}_{file.filename}"

        file_content = await file.read()
        file_name = file.filename
        file_content_type = file.content_type

        try:
            resume_service.put_s3_object(
                params["AWS_S3_BUCKET_NAME"],
                object_key,
                file_content,
                file_content_type,
            )

            await resume_service.create_db_resume(session, file_name, object_key, user_id)

            uploaded_files.append(
                {
                    "filename": file.filename,
                    "content_type": file.content_type,
                }
            )
        except Exception as e:
            logger.error(f"Error uploading {file.filename}: {e}", exc_info=True)
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
    resume_service: ResumeService = Depends(get_resume_service),
):
    user_id = user.get("id")
    logger.info(
        "Fetching all resumes",
        extra={
            "endpoint": "/resume/get/all",
            "user_id": user_id,
        },
    )

    all_resumes = await resume_service.get_all_resume(session, user_id)

    resumes = []
    errors = []

    for resume in all_resumes:
        resume_dict = {
            "id": resume.id,
            "name": resume.filename,
            "upload_date": getattr(resume, "created_at", None),
            "objectKey": resume.object_key,
            "url": None,
        }

        try:
            resume_dict["url"] = await resume_service.get_presigned_url_safe(
                params["AWS_S3_BUCKET_NAME"],
                resume.object_key,
            )

        except Exception as e:
            errors.append(
                {
                    "resume_id": resume.id,
                    "message": f"Failed to generate presigned URL for resume ID {resume.id}: {str(e)}",
                }
            )

        resumes.append(resume_dict)

    if errors:
        logger.info(
            "Partial resume URL generation",
            extra={
                "endpoint": "/resume/get/all",
                "user_id": user_id,
                "failed_count": len(errors),
                "error_details": errors,
            },
        )

    return resumes


@resume_router.post("/remove")
async def remove_resume(
    payload: RemoveResumeIn,
    resume_service: ResumeService = Depends(get_resume_service),
    session: AsyncSession = Depends(Database.get_async_session),
    user: dict = Depends(verify_user_from_token),
):
    user_id = user.get("id")
    resume_id = payload.id
    object_key = payload.object_key

    if not resume_id or not object_key:
        raise HTTPException(
            detail="resume_id and object_key required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Get the resume for the current user
    resume = await resume_service.get_user_resume_by_id(session, resume_id, user_id)

    # Remove from S3
    resume_service.remove_object_from_s3(
        params["AWS_S3_BUCKET_NAME"], resume.object_key, user_id
    )
    
    await session.delete(resume)
    await session.commit()

    return {"success": True, "message": "Resume removed."}
