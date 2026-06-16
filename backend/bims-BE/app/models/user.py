"""
User model aligned with UML.
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid4())


class UserRole(str, enum.Enum):
    CREATOR = "CREATOR"
    BRAND = "BRAND"
    ADMIN = "ADMIN"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BANNED = "BANNED"


class User(Base):
    """
    Core authentication user.
    """

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid_str, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # Creator display username; set once on first login
    password_hash = Column(String, nullable=True)  # None for OAuth-only (e.g. Google) users; set when they set password
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CREATOR)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

