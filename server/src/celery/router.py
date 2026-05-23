from fastapi import APIRouter, Depends
from redis.client import Redis

from src.auth.dependencies import verify_user_from_token
from src.database import Database
from src.utils import json_decode

celery_router = APIRouter()

@celery_router.get("/task/{taskID}/status")
async def get_task_status(
    taskID: str,
    user: dict = Depends(verify_user_from_token),
    redis_client: Redis = Depends(Database.get_redis_client),
):
    key = f"task:{taskID}"
    result = await redis_client.get(key)
    if not result:
        return {"error": "No response found for this task."}, 404

    response_data = json_decode(result)
    return response_data
