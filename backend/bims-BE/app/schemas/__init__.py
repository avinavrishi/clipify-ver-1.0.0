"""
Pydantic Schemas for Request/Response Validation (UML-only)
"""
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.schemas.campaign import CampaignCreate, CampaignResponse, CampaignUpdate

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "CampaignCreate",
    "CampaignResponse",
    "CampaignUpdate",
]

