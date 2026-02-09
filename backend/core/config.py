from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 

    MONGODB_URL: str = os.getenv("MONGODB_URL")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME")
    API_BASE_URL : str | None = os.getenv("API_BASE_URL")
    GOOGLE_API_KEY: str | None = os.getenv("GOOGLE_API_KEY")
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()