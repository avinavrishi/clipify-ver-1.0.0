"""
Auth and session-related models based on UML design
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Enum,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.user import User
import enum


def _uuid_str() -> str:
    """Helper to generate UUIDs as strings for SQLite compatibility."""
    return str(uuid4())


class LoginStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class AuthSession(Base):
    """
    Represents a logical login session for a user.

    Note: We store UUIDs as string columns to remain compatible with SQLite.
    """

    __tablename__ = "auth_sessions"

    id = Column(String, primary_key=True, default=_uuid_str)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    device_info = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    user = relationship(User, backref="auth_sessions")
    refresh_tokens = relationship(
        "RefreshToken", back_populates="session", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    """
    Refresh token tied to an AuthSession.

    We store a hash of the refresh token rather than the raw token.
    """

    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=_uuid_str)
    session_id = Column(String, ForeignKey("auth_sessions.id"), nullable=False)
    token_hash = Column(String, nullable=False, index=True)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    session = relationship("AuthSession", back_populates="refresh_tokens")


class LoginAudit(Base):
    """
    Audit log for login attempts.
    """

    __tablename__ = "login_audits"

    id = Column(String, primary_key=True, default=_uuid_str)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status = Column(Enum(LoginStatus), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship(User, backref="login_audits")


class OtpVerification(Base):
    """
    OTP sent for email verification during registration.
    OTP is stored hashed; expires after OTP_EXPIRE_MINUTES.
    One row per email; resend overwrites the same row.
    """

    __tablename__ = "otp_verifications"

    id = Column(String, primary_key=True, default=_uuid_str)
    email = Column(String, nullable=False, index=True)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)  # Set when registration is completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

