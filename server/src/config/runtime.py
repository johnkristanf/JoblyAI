from dotenv import load_dotenv

load_dotenv()

import os
from src.aws.ssm import get_ssm_parameter


def get_env_param(name, param_store_path):
    APP_ENV = os.getenv("APP_ENV", "development").lower()
    if APP_ENV == "development":
        return os.getenv(name)

    return get_ssm_parameter(param_store_path)


params = {
    "SUPABASE_JWT_SECRET": get_env_param(
        "SUPABASE_JWT_SECRET", "/joblyai/prod/SUPABASE_JWT_SECRET"
    ),
    "DATABASE_URL": get_env_param("DATABASE_URL", "/joblyai/prod/DATABASE_URL"),
    "REDIS_URL": get_env_param("REDIS_URL", "/joblyai/prod/REDIS_URL"),
    "RAPID_API_KEY": get_env_param("RAPID_API_KEY", "/joblyai/prod/RAPID_API_KEY"),
    "RAPID_API_HOST": get_env_param("RAPID_API_HOST", "/joblyai/prod/RAPID_API_HOST"),
    "OPENAI_API_KEY": get_env_param("OPENAI_API_KEY", "/joblyai/prod/OPENAI_API_KEY"),
    "OPENAI_MODEL": get_env_param("OPENAI_MODEL", "/joblyai/prod/OPENAI_MODEL"),
    "IMAGE_KIT_PUBLIC_KEY": get_env_param(
        "IMAGE_KIT_PUBLIC_KEY", "/joblyai/prod/IMAGE_KIT_PUBLIC_KEY"
    ),
    "IMAGE_KIT_PRIVATE_KEY": get_env_param(
        "IMAGE_KIT_PRIVATE_KEY", "/joblyai/prod/IMAGE_KIT_PRIVATE_KEY"
    ),
    "IMAGE_KIT_URL_ENDPOINT": get_env_param(
        "IMAGE_KIT_URL_ENDPOINT", "/joblyai/prod/IMAGE_KIT_URL_ENDPOINT"
    ),
    "AWS_PROFILE": get_env_param("AWS_PROFILE", "/joblyai/prod/AWS_PROFILE"),
    "AWS_REGION": get_env_param("AWS_REGION", "/joblyai/prod/AWS_REGION"),
    "AWS_S3_BUCKET_NAME": get_env_param(
        "AWS_S3_BUCKET_NAME", "/joblyai/prod/AWS_S3_BUCKET_NAME"
    ),
}
