import os
import asyncio
import logging

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool

from src.config.runtime import params
from src.utils import read_return_pdf_content_stream, read_return_docx_content, get_file_extension

from dotenv import load_dotenv

load_dotenv()

if os.getenv("APP_ENV") == "development":
    _boto_session = boto3.Session(profile_name=os.getenv("AWS_PROFILE"))
    s3 = _boto_session.client("s3", region_name=params["AWS_REGION"])
else:
    s3 = boto3.client("s3", region_name=params["AWS_REGION"])

logger = logging.getLogger("aws.s3_service")
s3_semaphore = asyncio.Semaphore(5)


class S3Service:
    def put_object(
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

    def get_object(self, bucket: str, object_key: str) -> bytes:
        response = s3.get_object(Bucket=bucket, Key=object_key)
        return response["Body"].read()

    async def get_object_safe(self, bucket: str, object_key: str) -> bytes:
        async with s3_semaphore:
            return await run_in_threadpool(self.get_object, bucket, object_key)

    def get_resume_text(self, bucket: str, object_key: str) -> str:
        """Fetch a resume file from S3 and extract its plain text."""
        resume_content = self.get_object(bucket, object_key)
        ext = get_file_extension(object_key)
        if ext in ("doc", "docx"):
            return read_return_docx_content(resume_content)
        return read_return_pdf_content_stream(resume_content)

    def generate_presigned_url(self, bucket: str, key: str) -> str:
        return s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=60 * 30,  # 30 minutes
        )

    async def get_presigned_url_safe(self, bucket: str, key: str) -> str:
        """
        Generate a presigned S3 URL safely using a semaphore to control concurrency
        and a threadpool to avoid blocking the async event loop.
        """
        async with s3_semaphore:
            return await run_in_threadpool(self.generate_presigned_url, bucket, key)

    def remove_object(self, bucket: str, object_key: str, user_id: str) -> None:
        try:
            s3.delete_object(Bucket=bucket, Key=object_key)
        except ClientError as e:
            logger.error(
                "Failed to delete object from S3",
                extra={
                    "bucket": bucket,
                    "key": object_key,
                    "user_id": user_id,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to remove from S3: {str(e)}",
            )


def get_s3_service() -> S3Service:
    return S3Service()
