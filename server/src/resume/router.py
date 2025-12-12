import os
import boto3
import uuid

from fastapi import APIRouter
from fastapi import UploadFile, File
from src.config import settings


resume_router = APIRouter()
s3 = boto3.client("s3", region_name=settings.AWS_REGION)

@resume_router.post("/upload")
async def upload_resume(resume: list[UploadFile] = File(...)):
    print(f"resume: {resume}")
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
            resume_url = (
                f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"
            )
            uploaded_files.append(
                {
                    "filename": file.filename,
                    "url": resume_url,
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

