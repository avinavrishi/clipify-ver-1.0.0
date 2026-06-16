"""
Application Configuration Settings
"""
from pydantic_settings import BaseSettings
from typing import List, Union


class Settings(BaseSettings):
    """Application settings"""
    
    # App Settings
    APP_NAME: str = "Brandfluence"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./brandfluence.db"

    # Admin bootstrap – create default admin on first startup if set in .env
    ADMIN_BOOTSTRAP_EMAIL: str = ""
    ADMIN_BOOTSTRAP_PASSWORD: str = ""
    
    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    SESSION_EXPIRE_DAYS: int = 30
    
    # Social account bio verification (clipster-style)
    SOCIAL_VERIFICATION_CODE_EXPIRE_MINUTES: int = 10
    SOCIAL_VERIFICATION_CODE_PREFIX: str = "BIMS"

    # RabbitMQ (Instagram verification worker)
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    INSTAGRAM_VERIFICATION_QUEUE: str = "instagram_verification"
    INSTAGRAM_VERIFICATION_ENABLED: bool = True  # Kill switch for async verification

    # CORS Settings (can be comma-separated string or list)
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:8000"
    
    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"

    # OTP (registration) – expiry in minutes
    OTP_EXPIRE_MINUTES: int = 10
    REGISTRATION_TOKEN_EXPIRE_MINUTES: int = 15

    # SMTP (Gmail) – load from .env; used for OTP emails
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_APP_PASSWORD: str = ""

    # Google OAuth – load from .env
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # Frontend URL to redirect after Google login (with tokens in fragment). e.g. http://localhost:3000/auth/callback
    OAUTH_FRONTEND_CALLBACK_URL: str = "http://localhost:3000/auth/callback"

    # Seed data for scripts/campaign_seeds.py (optional; override in .env)
    SEED_BRAND_EMAIL: str = ""
    SEED_BRAND_PASSWORD: str = ""
    SEED_BRAND_COMPANY_NAME: str = "Demo Brand Co"
    SEED_BRAND_INDUSTRY: str = "Technology"
    SEED_BRAND_WEBSITE: str = "https://demobrand.example.com"

    SEED_CREATOR_EMAIL: str = ""
    SEED_CREATOR_PASSWORD: str = ""
    SEED_CREATOR_DISPLAY_NAME: str = "Demo Creator"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS to list format"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars (e.g. worker-only INSTAGRAM_*)


settings = Settings()

