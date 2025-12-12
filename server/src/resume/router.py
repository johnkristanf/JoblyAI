import os
import boto3
import uuid

from fastapi import APIRouter
from fastapi import UploadFile, File
from src.config import settings


resume_router = APIRouter()
s3 = boto3.client("s3", region_name=settings.AWS_REGION)

@resume_router.post("/upload")
async def upload_resume(resume: UploadFile = File(...)):
    object_key = f"resumes/{uuid.uuid4()}_{resume.filename}"
    file_content = await resume.read()
    try:
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=object_key,
            Body=file_content,
            ContentType=resume.content_type,
        )
        resume_url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"
        return {"message": "Resume uploaded successfully", "url": resume_url}
    except Exception as e:
        return {"error": str(e)}

