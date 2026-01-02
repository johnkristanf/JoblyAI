import json
from src.database import Database


class RedisInstance:
    def __init__(self):
        self.redis_client = Database.get_redis_client()

    async def set_task_state(self, task_id: str, data: dict, ttl: int = 600):
        await self.redis_client.setex(
            f"task:{task_id}",
            ttl,
            json.dumps(data)
        )

    async def get_task_state(self, task_id: str):
        raw = await self.redis_client.get(f"task:{task_id}")
        return json.loads(raw) if raw else None

