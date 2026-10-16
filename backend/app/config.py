import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    secret_key: str = os.getenv("SECRET_KEY", "super-secret-quizai-jwt-key-2026-change-in-prod")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./quizai.db")
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")

    @property
    def origins_list(self) -> list[str]:
        if not self.allowed_origins or self.allowed_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"

_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
