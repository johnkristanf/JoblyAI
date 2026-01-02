import json
from src.database import Database


class RedisInstance:
    def __init__(self):
        self.redis_client_sync = Database.get_redis_client(async_client=False)

    def set_task_state(self, task_id: str, data: dict, ttl: int = 600):
        self.redis_client_sync.setex(f"task:{task_id}", ttl, json.dumps(data))

    def get_task_state(self, task_id: str):
        raw = self.redis_client_sync.get(f"task:{task_id}")
        return json.loads(raw) if raw else None
