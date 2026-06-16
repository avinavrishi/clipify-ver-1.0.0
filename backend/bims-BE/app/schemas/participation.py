"""
Campaign Participation and Content Submission Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl
from app.models.social import CampaignParticipationStatus, ContentSubmissionStatus


# ========== Campaign Participation Schemas ==========

class CampaignParticipationCreate(BaseModel):
    """Schema for applying to a campaign"""
    campaign_id: str


class SubmitLinkCreate(BaseModel):
    """Schema for faceless creators: submit a content link (creates participation + submission in one)."""
    campaign_id: str
    content_url: str
    social_account_id: str
    platform_content_id: Optional[str] = None


class SubmitLinkResponse(BaseModel):
    """Response after faceless creator submits a link."""
    participation_id: str
    submission_id: str
    message: str = "Link submitted. Your submission is under review."


class CampaignParticipationResponse(BaseModel):
    """Schema for campaign participation response"""
    id: str
    campaign_id: str
    creator_id: str
    status: CampaignParticipationStatus
    total_submissions: int
    total_earned: float
    joined_at: datetime

    class Config:
        from_attributes = True


class CampaignParticipationWithCampaign(CampaignParticipationResponse):
    """Participation with campaign details"""
    campaign_title: Optional[str] = None
    campaign_status: Optional[str] = None
    campaign_budget: Optional[float] = None
    campaign_rate_per_million: Optional[float] = None


# ========== Content Submission Schemas ==========

class ContentSubmissionCreate(BaseModel):
    """Schema for submitting content URL"""
    campaign_id: str
    social_account_id: str
    content_url: str
    platform_content_id: Optional[str] = None  # Optional platform-specific content ID


class ContentSubmissionResponse(BaseModel):
    """Schema for content submission response"""
    id: str
    campaign_id: str
    creator_id: str
    social_account_id: str
    content_url: str
    platform_content_id: Optional[str]
    verified_views: int
    calculated_earnings: float
    status: ContentSubmissionStatus
    submitted_at: datetime

    class Config:
        from_attributes = True


class ContentSubmissionWithDetails(ContentSubmissionResponse):
    """Submission with campaign and account details"""
    campaign_title: Optional[str] = None
    social_account_username: Optional[str] = None
    social_platform: Optional[str] = None


class ContentSubmissionUpdate(BaseModel):
    """Schema for updating submission status (admin/brand only)"""
    status: ContentSubmissionStatus
    verified_views: Optional[int] = None
    calculated_earnings: Optional[float] = None
