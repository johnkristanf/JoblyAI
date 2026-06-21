from fastapi import Depends
from src.aws.s3_service import S3Service, get_s3_service
from src.resume.service import ResumeService


def get_resume_service(s3_service: S3Service = Depends(get_s3_service)) -> ResumeService:
    return ResumeService(s3_service=s3_service)
