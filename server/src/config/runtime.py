import os
import logging
import sys

from src.aws.ssm import get_ssm_parameter
from dotenv import load_dotenv
load_dotenv()


# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def get_env_param(name, param_store_path):
    APP_ENV = os.getenv("APP_ENV")
    
    if APP_ENV == "development":
        value = os.getenv(name)
        logger.info(f"   Mode: DEVELOPMENT")
        if value:
            logger.info(f"   ✅ Value found in .env")
        else:
            logger.warning(f"   ⚠️  Value NOT found in .env")
        return value.strip()

    logger.info(f"   Mode: PRODUCTION - Fetching from SSM...")
    try:
        value = get_ssm_parameter(param_store_path)
        logger.info(f"   ✅ Successfully retrieved from SSM")
        return value.strip()
    except Exception as e:
        logger.error(f"   ❌ CRITICAL ERROR: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


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
    "AWS_REGION": get_env_param("AWS_REGION", "/joblyai/prod/AWS_REGION"),
    "AWS_S3_BUCKET_NAME": get_env_param(
        "AWS_S3_BUCKET_NAME", "/joblyai/prod/AWS_S3_BUCKET_NAME"
    ),
    
    "CELERY_BROKER_URL": get_env_param("CELERY_BROKER_URL", "/joblyai/prod/CELERY_BROKER_URL"),
    "CELERY_BACKEND_URL": get_env_param(
        "CELERY_BACKEND_URL", "/joblyai/prod/CELERY_BACKEND_URL"
    ),
}
