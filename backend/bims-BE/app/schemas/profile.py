"""
Profile schemas (public identity layer).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProfileBase(BaseModel):
    display_name: str
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    country: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    country: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Creator type (face / faceless) and face creator form ==========


class SetUsernameRequest(BaseModel):
    """Set creator username (one-time on first login)."""
    username: str


class SetCreatorTypeRequest(BaseModel):
    """Set creator type; if FACE, include face creator form fields."""
    creator_type: str  # "FACE" | "FACELESS"
    name: Optional[str] = None
    category: Optional[str] = None
    reel_price: Optional[float] = None
    story_price: Optional[float] = None
    reel_story_price: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None


class CreatorTypeResponse(BaseModel):
    """Creator type and face creator details."""
    creator_type: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    reel_price: Optional[float] = None
    story_price: Optional[float] = None
    reel_story_price: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None

    class Config:
        from_attributes = True


class UpdateCreatorFaceDetailsRequest(BaseModel):
    """Update face creator details (profile edit). Only for creators with creator_type FACE. All fields optional."""
    name: Optional[str] = None
    category: Optional[str] = None
    reel_price: Optional[float] = None
    story_price: Optional[float] = None
    reel_story_price: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    language: Optional[str] = None

