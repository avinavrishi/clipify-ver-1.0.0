"""
In-App Notification System
"""
from datetime import datetime
from uuid import uuid4
import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.user import User


def _uuid_str() -> str:
    return str(uuid4())


class NotificationType(str, enum.Enum):
    """Types of notifications"""
    # Social Account Verification
    SOCIAL_ACCOUNT_PENDING = "SOCIAL_ACCOUNT_PENDING"  # Admin: new verification request
    SOCIAL_ACCOUNT_APPROVED = "SOCIAL_ACCOUNT_APPROVED"  # Creator: account approved
    SOCIAL_ACCOUNT_REJECTED = "SOCIAL_ACCOUNT_REJECTED"  # Creator: account rejected
    
    # Campaign Participation
    CAMPAIGN_PARTICIPATION_PENDING = "CAMPAIGN_PARTICIPATION_PENDING"  # Brand/Admin: creator applied
    CAMPAIGN_PARTICIPATION_APPROVED = "CAMPAIGN_PARTICIPATION_APPROVED"  # Creator: participation approved
    CAMPAIGN_PARTICIPATION_REJECTED = "CAMPAIGN_PARTICIPATION_REJECTED"  # Creator: participation rejected
    
    # Content Submission
    CONTENT_SUBMITTED = "CONTENT_SUBMITTED"  # Brand/Admin: new content submitted
    CONTENT_APPROVED = "CONTENT_APPROVED"  # Creator: content approved
    CONTENT_REJECTED = "CONTENT_REJECTED"  # Creator: content rejected
    
    # Campaign Updates (for brands)
    CAMPAIGN_CREATED = "CAMPAIGN_CREATED"  # Brand: campaign created successfully
    CAMPAIGN_UPDATED = "CAMPAIGN_UPDATED"  # Brand: campaign updated
    
    # Earnings/Payouts
    PAYOUT_PROCESSED = "PAYOUT_PROCESSED"  # Creator: payout processed
    EARNINGS_UPDATED = "EARNINGS_UPDATED"  # Creator: earnings updated from view counts


class Notification(Base):
    """
    In-app notification for users.
    Notifications are created when important events happen and shown in the UI.
    """
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid_str, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)  # Additional data (e.g. campaign_id, verification_id, etc.)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    user = relationship(User, backref="notifications")
