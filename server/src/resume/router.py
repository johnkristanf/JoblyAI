import boto3
import uuid

from fastapi import APIRouter, Depends
from fastapi import UploadFile, File
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
    user: dict = Depends(verify_user_from_token)
):
    print(f"resume: {resume}")
    print(f"user: {user}")
    
    uploaded_files = []
    for file in resume:
        object_key = f"resumes/{uuid.uuid4()}_{file.filename}"
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
                filename=file.filename,
                object_key=object_key,
                user_id=user.get("id")
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
