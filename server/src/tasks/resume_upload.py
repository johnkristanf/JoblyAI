import uuid
import asyncio
import base64
import logging

from src.celery import celery
from src.resume.service import ResumeService
from src.database import Database
from src.config.runtime import params
from src.core.redis import RedisInstance

logger = logging.getLogger("tasks.resume_upload") 


async def _save_resume_to_db(filename: str, object_key: str, user_id: str):
    """Create a DB resume record inside an async session."""
    Database.connect_async_session()
    async with Database.async_session() as session:
        resume_service = ResumeService()
        await resume_service.create_db_resume(session, filename, object_key, user_id)


@celery.task(bind=True)
def upload_resume(
    self,
    file_bytes_b64: str,
    filename: str,
    content_type: str,
    user_id: str,
):
    """
    Uploads resume bytes to S3 and inserts a DB record simultaneously.
    """
    task_id = self.request.id
    logger.info(f"Task {task_id}: uploading resume '{filename}' for user {user_id}")

    object_key = f"resumes/{user_id}/{uuid.uuid4()}_{filename}"

    try:
        file_bytes = base64.b64decode(file_bytes_b64)
        resume_service = ResumeService()

        # 1. Upload to S3 (synchronous boto3 — safe in Celery worker)
        resume_service.put_s3_object(
            params["AWS_S3_BUCKET_NAME"],
            object_key,
            file_bytes,
            content_type,
        )
        logger.info(f"Task {task_id}: S3 upload complete for '{filename}'")

        # 2. Persist to DB (async method wrapped in asyncio.run)
        asyncio.run(_save_resume_to_db(filename, object_key, user_id))
        logger.info(f"Task {task_id}: DB record created for '{filename}'")

        response_object = {"status": "SUCCESS", "object_key": object_key}
        
        redis_instance = RedisInstance()
        redis_instance.set_task_state(
            task_id,
            data=response_object,
            ttl=15 * 60,
        )

        return response_object

    except Exception as e:
        logger.error(
            f"Task {task_id}: failed to upload resume '{filename}': {e}",
            exc_info=True,
        )
        redis_instance = RedisInstance()
        redis_instance.set_task_state(
            task_id,
            {
                "status": "FAILURE",
                "error": str(e),
            },
            ttl=15 * 60,
        )
        raise
