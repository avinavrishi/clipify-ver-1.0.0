"""
Campaign model aligned with UML.
"""
from uuid import uuid4
from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey, Float, Enum, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid4())


class CampaignStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


class CampaignContentType(str, PyEnum):
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"


# campaign_type (Integer): who the campaign is for
CAMPAIGN_TYPE_FACE_CREATOR = 0
CAMPAIGN_TYPE_FACELESS_CREATOR = 1


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=_uuid_str, index=True)
    brand_id = Column(String, ForeignKey("brands.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    category = Column(String, nullable=True)
    # 0 = face-creator campaign, 1 = faceless-creator campaign
    campaign_type = Column(Integer, nullable=False, default=CAMPAIGN_TYPE_FACE_CREATOR)
    content_type = Column(Enum(CampaignContentType, name="campaign_content_type"), nullable=False)
    description = Column(Text, nullable=True)

    total_budget = Column(Float, nullable=False)
    used_budget = Column(Float, default=0.0, nullable=False)
    rate_per_million_views = Column(Float, nullable=False)
    max_submissions_per_account = Column(Integer, nullable=True)
    max_earnings_per_creator = Column(Float, nullable=True)
    max_earnings_per_post = Column(Float, nullable=True)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(CampaignStatus, name="campaign_status"), default=CampaignStatus.ACTIVE, nullable=False)

    logo_drive_link = Column(String, nullable=True)
    guidelines_link = Column(String, nullable=True)
    discord_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    brand = relationship("Brand", back_populates="campaigns")
    campaign_platforms = relationship(
        "CampaignPlatform", back_populates="campaign", cascade="all, delete-orphan"
    )
