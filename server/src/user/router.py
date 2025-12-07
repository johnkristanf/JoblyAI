from fastapi import APIRouter, Depends, Form, UploadFile, File
from src.auth.dependencies import verify_user_from_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import Database
from src.user.model import Profile
from typing import Optional
from passlib.context import CryptContext

user_route = APIRouter()


@user_route.get(
    "/",
)
async def get_user(
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
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


@user_route.patch("/profile")
async def update_profile(
    full_name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
):
    print(f"full_name: {full_name}")
    print(f"avatar: {avatar}")
    print(f"user: {user}")

    stmt = select(Profile).where(Profile.user_id == user["id"])
    result = await session.execute(stmt)
    profile = result.scalars().first()

    if not profile:
        return {"error": "Profile not found."}

    updated = False
    if full_name is not None:
        profile.full_name = full_name.strip()
        updated = True
    if avatar is not None:
        contents = await avatar.read()
        mime_type = avatar.content_type or "application/octet-stream"
        # profile.avatar_url = data_url
        # updated = True

    if updated:
        await session.commit()
        await session.refresh(profile)

    return {
        "user_id": str(profile.user_id),
        "full_name": profile.full_name,
        "avatar_url": profile.avatar_url,
    }


# @user_route.patch("/change-password")
# async def change_password(
#     current_password: str = Form(...),
#     new_password: str = Form(...),
#     user: dict = Depends(verify_user_from_token),
#     session: AsyncSession = Depends(Database.get_async_session),
# ):
#     """
#     Change the current user's password after validating the current password.
#     """

#     pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#     stmt = select(Profile).where(Profile.user_id == user["id"])
#     result = await session.execute(stmt)
#     profile = result.scalars().first()

#     if not profile:
#         return {"error": "Profile not found."}
#     # Assume the main User table is available
#     user_stmt = select(User).where(User.id == user["id"])
#     user_result = await session.execute(user_stmt)
#     db_user = user_result.scalar_one_or_none()

#     if not db_user or not db_user.hashed_password:
#         return {"error": "User not found."}

#     # Validate current password
#     if not pwd_context.verify(current_password, db_user.hashed_password):
#         return {"error": "Current password is incorrect."}

#     # Password strength check
#     if len(new_password) < 8:
#         return {"error": "New password must be at least 8 characters."}

#     # Update user password
#     db_user.hashed_password = pwd_context.hash(new_password)
#     await session.commit()
#     return {"message": "Password updated successfully."}
