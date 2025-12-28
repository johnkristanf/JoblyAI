from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str
    
    RAPID_API_KEY: str
    RAPID_API_HOST: str

    OPENAI_MODEL: str
    OPENAI_API_KEY: str

    DATABASE_URL: str
    REDIS_URL: str

    SUPABASE_JWT_SECRET: str

    IMAGE_KIT_PUBLIC_KEY: str
    IMAGE_KIT_PRIVATE_KEY: str
    IMAGE_KIT_URL_ENDPOINT: str

    AWS_REGION: str
    AWS_PROFILE: str
    AWS_S3_BUCKET_NAME: str

    class Config:
        env_file = ".env"


settings = Settings()
