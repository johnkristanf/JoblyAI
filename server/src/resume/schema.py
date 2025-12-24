from pydantic import BaseModel

class RemoveResumeIn(BaseModel):
    id: int
    object_key: str