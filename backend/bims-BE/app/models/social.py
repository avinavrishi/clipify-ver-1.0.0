"""
Social account and campaign participation related models (partial UML coverage).
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.profile import Creator
from app.models.campaign import Campaign
import enum


def _uuid_str() -> str:
    return str(uuid4())


class SocialPlatform(str, enum.Enum):
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    YOUTUBE = "YOUTUBE"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String, primary_key=True, default=_uuid_str)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    platform = Column(Enum(SocialPlatform), nullable=False)
    platform_user_id = Column(String, nullable=False)
    username = Column(String, nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship(Creator, backref="social_accounts")


class SocialVerificationStatus(str, enum.Enum):
    """Status of bio verification flow"""
    CODE_ACTIVE = "CODE_ACTIVE"  # Code issued, user has time to add to bio
    PENDING_VERIFICATION = "PENDING_VERIFICATION"  # User confirmed; waiting for admin/auto verify
    PENDING = "PENDING"  # Queued for async worker (e.g. Instagram)
    VERIFIED = "VERIFIED"  # Bio checked, account linked
    FAILED = "FAILED"  # Worker checked, code not found in bio
    ERROR = "ERROR"  # Automation/worker error
    REJECTED = "REJECTED"  # Verification failed
    EXPIRED = "EXPIRED"  # Code expired before completion


class SocialAccountVerification(Base):
    """
    Tracks social account verification via bio code.
    Creator gets a code, adds it to their profile bio within the time window,
    then we verify (admin or automated) and create SocialAccount on success.
    """
    __tablename__ = "social_account_verifications"

    id = Column(String, primary_key=True, default=_uuid_str)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    platform = Column(Enum(SocialPlatform), nullable=False)
    username = Column(String, nullable=False)  # Handle they are claiming
    verification_code = Column(String, nullable=False, unique=True, index=True)
    status = Column(
        Enum(SocialVerificationStatus),
        default=SocialVerificationStatus.CODE_ACTIVE,
        nullable=False,
    )
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)  # When user clicked "I've added the code"
    verified_at = Column(DateTime, nullable=True)  # When admin/auto verified
    verified_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Admin who verified
    social_account_id = Column(String, ForeignKey("social_accounts.id"), nullable=True)

    creator = relationship(Creator, backref="social_verifications")
    social_account = relationship(SocialAccount, backref="verification", uselist=False)


class CampaignParticipationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CampaignParticipation(Base):
    __tablename__ = "campaign_participations"
    __table_args__ = (
        UniqueConstraint("campaign_id", "creator_id", name="uq_campaign_participation_campaign_creator"),
    )

    id = Column(String, primary_key=True, default=_uuid_str)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    status = Column(
        Enum(CampaignParticipationStatus),
        default=CampaignParticipationStatus.APPLIED,
        nullable=False,
        index=True,
    )
    total_submissions = Column(Integer, default=0, nullable=False)
    total_earned = Column(Float, default=0.0, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship(Campaign, backref="participations")
    creator = relationship(Creator, backref="participations")


class ContentSubmissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ContentSubmission(Base):
    __tablename__ = "content_submissions"

    id = Column(String, primary_key=True, default=_uuid_str)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    creator_id = Column(String, ForeignKey("creators.id"), nullable=False, index=True)
    social_account_id = Column(String, ForeignKey("social_accounts.id"), nullable=False)
    content_url = Column(Text, nullable=False)
    platform_content_id = Column(String, nullable=True)
    verified_views = Column(Integer, default=0, nullable=False)
    calculated_earnings = Column(Float, default=0.0, nullable=False)
    status = Column(
        Enum(ContentSubmissionStatus),
        default=ContentSubmissionStatus.PENDING,
        nullable=False,
    )
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship(Campaign, backref="submissions")
    creator = relationship(Creator, backref="submissions")
    social_account = relationship(SocialAccount, backref="submissions")

