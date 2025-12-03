from fastapi import APIRouter, Depends
from src.auth.dependencies import verify_user_from_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import Database
from src.user.model import Profile

user_route = APIRouter()

@user_route.get(
    "/",
)
async def get_user(
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session)
):
    stmt = select(Profile).where(Profile.user_id == user["id"])
    result = await session.execute(stmt)
    profile = result.scalars().first()
    if not profile:
        return None
    return {
        "user_id": str(profile.user_id),
        "full_name": profile.full_name,
        "email": user["email"],
        "avatar_url": profile.avatar_url,
    }
