from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ADZUNA_APP_ID: str
    ADZUNA_APP_KEY: str
    
    RAPID_API_KEY: str
    RAPID_API_HOST: str
    
    OPENAI_MODEL: str
    OPENAI_API_KEY: str
    
    DATABASE_URL: str
    REDIS_URL: str
    
    SUPABASE_JWT_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()
