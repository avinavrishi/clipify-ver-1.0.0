"""
Database Configuration and Session Management
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine with appropriate connection args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}  # Needed for SQLite

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database - create all tables if they don't exist
    This is idempotent and safe to call multiple times
    """
    # Import all models to ensure they're registered with Base.metadata
    from app.models import (  # noqa: F401
        User,
        Brand,
        Campaign,
        AuthSession,
        RefreshToken,
        LoginAudit,
        OtpVerification,
        Profile,
        Creator,
        SocialAccount,
        SocialAccountVerification,
        CampaignParticipation,
        ContentSubmission,
        Payout,
        LeaderboardEntry,
        Platform,
        CampaignPlatform,
        Notification,
    )

    # Create all tables (only creates if they don't exist)
    Base.metadata.create_all(bind=engine)

    # Bootstrap default admin user if ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are set in .env
    admin_email = (settings.ADMIN_BOOTSTRAP_EMAIL or "").strip()
    admin_password = (settings.ADMIN_BOOTSTRAP_PASSWORD or "").strip()

    db = SessionLocal()
    try:
        if admin_email and admin_password:
            from app.models.user import UserRole, UserStatus  # local import to avoid cycles
            from app.core.security import get_password_hash
            from app.models.user import User as UserModel

            existing_admin = (
                db.query(UserModel)
                .filter(UserModel.email == admin_email)
                .first()
            )
            if not existing_admin:
                admin_user = UserModel(
                    email=admin_email,
                    password_hash=get_password_hash(admin_password),
                    role=UserRole.ADMIN,
                    status=UserStatus.ACTIVE,
                )
                db.add(admin_user)

        # Seed Platform table with Instagram, YouTube, TikTok (for campaign-platform mapping)
        from app.models.platform import Platform as PlatformModel
        for name in ("Instagram", "YouTube", "TikTok"):
            if db.query(PlatformModel).filter(PlatformModel.name == name).first() is None:
                db.add(PlatformModel(name=name))
        db.commit()
    finally:
        db.close()


def check_db_exists():
    """
    Check if database file exists (for SQLite) or connection works (for PostgreSQL)
    Returns True if database is accessible, False otherwise
    """
    if settings.DATABASE_URL.startswith("sqlite"):
        # Extract database file path from SQLite URL
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        # Handle relative paths
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.getcwd(), db_path)
        return os.path.exists(db_path)
    else:
        # For PostgreSQL and other databases, try to connect
        try:
            with engine.connect() as conn:
                return True
        except Exception:
            return False

