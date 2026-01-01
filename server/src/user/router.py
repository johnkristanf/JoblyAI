import base64
import uuid

from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from imagekitio import ImageKit
from imagekitio.file import UploadFileRequestOptions
from src.config.runtime import params
from src.resume.dependencies import get_resume_service
from src.resume.service import ResumeService
from src.user.dependencies import get_image_kit_method
from src.auth.dependencies import verify_user_from_token
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import Database
from src.user.model import Profile
from typing import Optional

user_route = APIRouter()


@user_route.get(
    "/profile",
)
async def get_user(
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
    resume_service: ResumeService = Depends(get_resume_service),
):
    profile = await session.get(Profile, user["id"])
    if not profile:
        raise HTTPException(status_code=401, detail="Profile not found.")

    # Generate a presigned avatar URL if avatar_url is set
    avatar_url = None
    if profile.avatar_url:
        avatar_url = await resume_service.get_presigned_url_safe(
            params["AWS_S3_BUCKET_NAME"], profile.avatar_url
        )

    return {
        "user_id": str(profile.user_id),
        "full_name": profile.full_name,
        "email": user["email"],
        "avatar_url": avatar_url,
    }


@user_route.patch("/profile")
async def update_profile(
    full_name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    user: dict = Depends(verify_user_from_token),
    resume_service: ResumeService = Depends(get_resume_service),
    imagekit: ImageKit = Depends(get_image_kit_method),
    session: AsyncSession = Depends(Database.get_async_session),
):
    user_id = user.get("id")

    profile = await session.get(Profile, user_id)
    if not profile:
        raise HTTPException(status_code=401, detail="Profile not found.")

    avatar_presigned_url = None
    updated = False
    if full_name is not None:
        profile.full_name = full_name.strip()
        updated = True
    if avatar is not None:
        file_content = await avatar.read()

        bucket = params["AWS_S3_BUCKET_NAME"]
        file_name = avatar.filename
        object_key = f"avatar/{user_id}/{uuid.uuid4()}_{file_name}"
        file_content_type = avatar.content_type

        if profile.avatar_url:
            resume_service.remove_object_from_s3(bucket, profile.avatar_url, user_id)

        resume_service.put_s3_object(
            bucket, object_key, file_content, file_content_type
        )

        avatar_presigned_url = await resume_service.get_presigned_url_safe(
            bucket, object_key
        )

        profile.avatar_url = object_key
        updated = True

    if updated:
        await session.commit()
        await session.refresh(profile)

    return {
        "user_id": str(profile.user_id),
        "full_name": profile.full_name,
        "avatar_url": avatar_presigned_url,
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
