import asyncio
from src.core.redis import RedisInstance
from src.job.service import llm_job_extraction
from src.utils import extract_data_from_batch_tasks
from src.celery import celery

import logging

logger = logging.getLogger("tasks.job_matching")


@celery.task(bind=True)
def job_matching(self, job_listings: list, resume_text: str):
    task_id = self.request.id

    logger.info(f"Task {task_id} started: matching jobs with resume.")

    redis_instance = RedisInstance()
    
    redis_instance.set_task_state(
        task_id, {"status": "RUNNING", "progress": 0, "result": None, "error": None}
    )

    try:
        task_results = asyncio.run(
            extract_data_from_batch_tasks(
                job_listings,
                awaitable=llm_job_extraction,
                params={"resume_text": resume_text},
            )
        )

        logger.info(f"Task {task_id} succeeded, updating task state.")

        redis_instance.set_task_state(
            task_id,
            {
                "status": "SUCCESS",
                "progress": 100,
                "result": task_results,
                "error": None,
            },
        )
        
        logger.info(f"Job matching finished: {task_results}")
        return task_results

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        redis_instance.set_task_state(
            task_id,
            {"status": "FAILURE", "progress": 100, "result": None, "error": str(e)},
        )
