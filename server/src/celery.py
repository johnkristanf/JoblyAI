from celery import Celery

from src.config.runtime import params

celery = Celery(
    "worker",
    broker=params["CELERY_BROKER_URL"],
    backend=params["CELERY_BACKEND_URL"],
    include=["src.tasks.job_matching"]
)

celery.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
)