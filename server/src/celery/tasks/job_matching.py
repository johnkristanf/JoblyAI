import asyncio
from src.core.redis import RedisInstance
from src.job.service import JobsService
from src.utils import extract_data_from_batch_tasks
from src.celery import celery

import logging

logger = logging.getLogger("tasks.job_matching")


@celery.task(bind=True)
def job_matching(self, job_listings: list, extracted_resume_fields: dict | None = None):
    task_id = self.request.id

    logger.info(f"Task {task_id} started: matching jobs with resume.")

    jobs_service = JobsService()
    redis_instance = RedisInstance()

    cache_ttl = 15 * 60  # 15 minutes

    try:
        jobs_matched = asyncio.run(
            extract_data_from_batch_tasks(
                job_listings,
                awaitable=jobs_service.job_matching,
                params={
                    "extracted_resume_fields": extracted_resume_fields,
                },
            )
        )

        logger.info(f"Task {task_id} succeeded, updating task state.")

        response_object = {
            "status": "SUCCESS",
            "progress": 100,
            "jobs_matched": jobs_matched,
            "error": None,
        }

        redis_instance.set_task_state(
            task_id,
            data=response_object,
            ttl=cache_ttl,
        )

        return response_object

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        redis_instance.set_task_state(
            task_id,
            {
                "status": "FAILURE",
                "progress": 100,
                "jobs_matched": None,
                "error": str(e),
            },
        )
