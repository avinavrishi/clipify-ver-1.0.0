"""
Social Account Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.social import SocialPlatform, SocialVerificationStatus


# ========== Bio verification flow ==========

class VerificationInitiateRequest(BaseModel):
    """Request to start bio verification"""
    platform: SocialPlatform
    username: str


class VerificationInitiateResponse(BaseModel):
    """Response with code to add to bio"""
    verification_id: str
    verification_code: str
    platform: str
    username: str
    expires_at: datetime
    message: str


class VerificationCompleteRequest(BaseModel):
    """Request when user has added code to bio"""
    verification_id: str


class VerificationStatusResponse(BaseModel):
    """Current status of a verification attempt"""
    verification_id: str
    platform: str
    username: str
    status: SocialVerificationStatus
    verification_code: str
    expires_at: datetime
    created_at: datetime
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    social_account_id: Optional[str] = None


# ========== Social account (legacy / admin) ==========

class SocialAccountCreate(BaseModel):
    """Schema for manually adding a social account"""
    platform: SocialPlatform
    username: str
    platform_user_id: Optional[str] = None  # Optional, can be fetched later


class SocialAccountResponse(BaseModel):
    """Schema for social account response"""
    id: str
    creator_id: str
    platform: SocialPlatform
    platform_user_id: str
    username: str
    is_verified: bool  # True if OAuth connected (has access_token)
    created_at: str

    class Config:
        from_attributes = True


class SocialAccountUpdate(BaseModel):
    """Schema for updating social account"""
    username: Optional[str] = None
    platform_user_id: Optional[str] = None
