"""
User Schemas aligned with UML.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    """
    Creator signup schema. Display name/username is asked on first login, not at registration.
    """

    password: str


class BrandUserCreate(UserBase):
    """
    Brand user signup schema (creates USER+BRAND).
    """

    password: str
    company_name: str
    industry: Optional[str] = None
    website: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    username: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPair(Token):
    refresh_token: str
    session_id: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# --- OTP registration flow ---


class RequestOtpRequest(BaseModel):
    """Request OTP for registration; sends 6-digit OTP to email."""
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    """Verify OTP and receive a short-lived registration token."""
    email: EmailStr
    otp: str  # 6-digit string


class VerifyOtpResponse(BaseModel):
    """Returned after successful OTP verification; use registration_token in Authorization to complete signup."""
    registration_token: str
    expires_in: int  # seconds until token expires


class ResendOtpRequest(BaseModel):
    """Resend OTP to the same email (invalidates previous OTP)."""
    email: EmailStr


class CompleteRegistrationRequest(BaseModel):
    """Complete creator registration after OTP verified. Send with Authorization: Bearer <registration_token>. Username is set later on first dashboard visit."""
    password: str

