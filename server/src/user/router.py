from fastapi import APIRouter, Depends
from src.auth.dependencies import verify_token

user_route = APIRouter()


@user_route.get(
    "/",
)
def get_user(user: dict = Depends(verify_token)):
    return {
        "message": "This is protected data from FastAPI!",
        "user": {"id": user["id"], "email": user["email"], "role": user["role"]},
    }
