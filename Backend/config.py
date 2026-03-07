from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars-long"
    
    # Super Admin Configuration
    SUPER_ADMIN_EMAIL: str = "admin@meticura.gov"
    SUPER_ADMIN_PASSWORD: str = "Admin@123!meticura"
    SUPER_ADMIN_NAME: str = "System Administrator"
    
    # Clerk Configuration (deprecated, kept for backwards compatibility)
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_JWT_VERIFICATION_KEY: Optional[str] = None
    DEV_AUTH_ENABLED: bool = False  # Disabled - using custom auth now
    DEV_AUTH_TOKEN: str = "demo-token"
    DEV_AUTH_USER_ID: str = "dev_local_user"
    DEV_AUTH_EMAIL: str = "admin@meticura.gov"
    DEV_AUTH_FULL_NAME: str = "System Admin"
    DEV_AUTH_USERNAME: str = "sysadmin"
    
    # API Configuration
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Budget Watchdog API"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/budget_watchdog"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_TIMEZONE: str = "Asia/Kolkata"
    CELERY_ENABLE_UTC: bool = True
    
    # Pipeline Configuration
    ML_MODEL_PATH: str = "ml/artifacts/model.pkl"
    ML_SCALER_PATH: str = "ml/artifacts/scaler.pkl"
    
    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
