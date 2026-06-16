"""
Profile and role extension models based on UML design.

These models are additive to the existing Brand/Influencer setup and are
focused on the Clipster-style creator experience.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.user import User
import enum


def _uuid_str() -> str:
    return str(uuid4())


class Profile(Base):
    """
    Public identity profile for any user.
    """

    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=_uuid_str)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    country = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship(User, backref="profile")


class CreatorVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class CreatorType(str, enum.Enum):
    FACE = "FACE"
    FACELESS = "FACELESS"


class Creator(Base):
    """
    Creator extension for a user (maps conceptually to Influencer).
    """

    __tablename__ = "creators"

    id = Column(String, primary_key=True, default=_uuid_str)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    creator_type = Column(Enum(CreatorType), nullable=True)  # Set when connecting first social / onboarding
    # Face creator only
    name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    reel_price = Column(Float, nullable=True)
    story_price = Column(Float, nullable=True)
    reel_story_price = Column(Float, nullable=True)  # Combined reel+story price
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    language = Column(String, nullable=True)
    total_earnings = Column(Float, default=0.0, nullable=False)
    wallet_balance = Column(Float, default=0.0, nullable=False)
    verification_status = Column(
        Enum(CreatorVerificationStatus),
        default=CreatorVerificationStatus.PENDING,
        nullable=False,
    )

    user = relationship(User, backref="creator_profile")

