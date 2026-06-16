"""
Supported platforms and campaign-platform mapping models.
"""
from uuid import uuid4

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid4())


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(String, primary_key=True, default=_uuid_str)
    name = Column(String, unique=True, nullable=False)

    campaign_platforms = relationship("CampaignPlatform", back_populates="platform")


class CampaignPlatform(Base):
    __tablename__ = "campaign_platforms"

    campaign_id = Column(String, ForeignKey("campaigns.id"), primary_key=True)
    platform_id = Column(String, ForeignKey("platforms.id"), primary_key=True)

    campaign = relationship("Campaign", back_populates="campaign_platforms")
    platform = relationship(Platform, back_populates="campaign_platforms")

