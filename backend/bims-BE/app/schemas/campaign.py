"""
Campaign Schemas aligned with UML.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from app.models.campaign import CampaignStatus, CampaignContentType


class PlatformBrief(BaseModel):
    """Platform id and name for campaign card/details."""
    id: str
    name: str


class CampaignBase(BaseModel):
    title: str
    category: Optional[str] = None
    # 0 = face creator campaign, 1 = faceless creator campaign
    campaign_type: int = Field(..., ge=0, le=1)
    content_type: CampaignContentType
    description: Optional[str] = None
    total_budget: float
    rate_per_million_views: float
    max_submissions_per_account: Optional[int] = None
    max_earnings_per_creator: Optional[float] = None
    max_earnings_per_post: Optional[float] = None
    start_date: date
    end_date: date
    logo_drive_link: Optional[str] = None
    guidelines_link: Optional[str] = None
    discord_link: Optional[str] = None


class CampaignCreate(CampaignBase):
    """Create campaign. Include platform_ids to link campaign to platforms. Admin may set brand_id to create on behalf of a brand."""
    platform_ids: List[str] = []
    brand_id: Optional[str] = None  # Only used when caller is admin; otherwise ignored


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    campaign_type: Optional[int] = Field(None, ge=0, le=1)
    content_type: Optional[CampaignContentType] = None
    description: Optional[str] = None
    total_budget: Optional[float] = None
    used_budget: Optional[float] = None
    rate_per_million_views: Optional[float] = None
    max_submissions_per_account: Optional[int] = None
    max_earnings_per_creator: Optional[float] = None
    max_earnings_per_post: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[CampaignStatus] = None
    logo_drive_link: Optional[str] = None
    guidelines_link: Optional[str] = None
    discord_link: Optional[str] = None
    platform_ids: Optional[List[str]] = None  # If set, replaces campaign's linked platforms


class CampaignResponse(CampaignBase):
    id: str
    brand_id: str
    status: CampaignStatus
    used_budget: float
    created_at: datetime
    platforms: List[PlatformBrief] = []  # Platforms linked to this campaign (for card/details)
    participant_count: int = 0  # Total creators joined (participated) in this campaign
    participant_avatars: List[str] = []  # Up to 5 profile picture URLs for campaign card avatar stack

    class Config:
        from_attributes = True

