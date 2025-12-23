import boto3
import uuid

from fastapi import APIRouter, Depends
from fastapi import UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.resume.model import Resume
from src.config import settings


resume_router = APIRouter()
session = boto3.Session(profile_name=settings.AWS_PROFILE)
s3 = session.client("s3", region_name=settings.AWS_REGION)


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
                Bucket=settings.AWS_S3_BUCKET_NAME,
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
            
            print("Inserted resume ID:", db_resume.id)

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
    result = await session.execute(
        select(Resume).where(Resume.user_id == user.get("id"))
    )
    all_resumes = result.scalars().all()

    resumes = []
    for resume in all_resumes:
        try:
            temp_url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": settings.AWS_S3_BUCKET_NAME,
                    "Key": resume.object_key,
                },
                ExpiresIn=60 * 30,  # 30 minutes
            )
            resumes.append(
                {
                    "id": resume.id,
                    "name": resume.filename,
                    "uploadDate": (
                        resume.created_at.isoformat()
                        if hasattr(resume, "created_at")
                        else None
                    ),
                    "url": temp_url,
                    "objectKey": resume.object_key,
                }
            )
        except Exception as e:
            resumes.append(
                {
                    "id": resume.id,
                    "name": resume.filename,
                    "uploadDate": (
                        resume.created_at.isoformat()
                        if hasattr(resume, "created_at")
                        else None
                    ),
                    "error": str(e),
                    "objectKey": resume.object_key,
                }
            )

    return resumes
