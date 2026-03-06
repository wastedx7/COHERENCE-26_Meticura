from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Clerk Configuration
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_JWT_VERIFICATION_KEY: Optional[str] = None
    
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Budget Watchdog API"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/budget_watchdog"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
