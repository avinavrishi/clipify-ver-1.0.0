"""
Social Account Management Endpoints
"""
import secrets
import string
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api.v1.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.profile import Creator
from app.models.social import (
    SocialAccount,
    SocialAccountVerification,
    SocialPlatform,
    SocialVerificationStatus,
)
from app.schemas.social import (
    SocialAccountResponse,
    SocialAccountUpdate,
    VerificationInitiateRequest,
    VerificationInitiateResponse,
    VerificationCompleteRequest,
    VerificationStatusResponse,
)

router = APIRouter()


def get_current_creator(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Creator:
    """Dependency to get current creator profile"""
    if current_user.role != UserRole.CREATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to creators"
        )
    
    creator = db.query(Creator).filter(Creator.user_id == current_user.id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not found. Please complete your creator profile."
        )
    return creator


def _generate_verification_code() -> str:
    """Generate unique code like BIMS-A1B2C3"""
    prefix = getattr(settings, "SOCIAL_VERIFICATION_CODE_PREFIX", "BIMS")
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"{prefix}-{suffix}"


def validate_username_format(platform: SocialPlatform, username: str) -> bool:
    """Validate username format based on platform"""
    username = username.strip().replace("@", "")
    
    if platform == SocialPlatform.INSTAGRAM:
        # Instagram: 1-30 chars, alphanumeric, periods, underscores
        if len(username) < 1 or len(username) > 30:
            return False
        return all(c.isalnum() or c in ['.', '_'] for c in username)
    
    elif platform == SocialPlatform.YOUTUBE:
        # YouTube: Can be channel handle (@handle) or channel ID
        # For now, accept any non-empty string
        return len(username) > 0
    
    elif platform == SocialPlatform.TIKTOK:
        # TikTok: 1-24 chars, alphanumeric, underscores, periods
        if len(username) < 1 or len(username) > 24:
            return False
        return all(c.isalnum() or c in ['.', '_'] for c in username)
    
    return True


def _link_social_account_for_verified(db: Session, verification: SocialAccountVerification) -> None:
    """Create SocialAccount for a VERIFIED verification and set social_account_id. Idempotent."""
    if verification.social_account_id:
        return
    existing = db.query(SocialAccount).filter(
        SocialAccount.creator_id == verification.creator_id,
        SocialAccount.platform == verification.platform,
        SocialAccount.username == verification.username,
    ).first()
    if existing:
        verification.social_account_id = existing.id
        return
    account = SocialAccount(
        creator_id=verification.creator_id,
        platform=verification.platform,
        username=verification.username,
        platform_user_id=verification.username,
        access_token=None,
        refresh_token=None,
        token_expiry=None,
    )
    db.add(account)
    db.flush()
    verification.social_account_id = account.id


# ========== Bio verification flow (clipster-style) ========== 

@router.post(
    "/social/accounts/verify/initiate",
    response_model=VerificationInitiateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_bio_verification(
    body: VerificationInitiateRequest,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """
    Start connecting a social account. You receive a code to add to your profile bio.
    You have 10 minutes to add the code and call 'complete'. After that we verify the code is in your bio.
    """
    if not validate_username_format(body.platform, body.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {body.platform.value} username format",
        )
    clean_username = body.username.strip().replace("@", "")

    # Already have this account connected?
    existing = db.query(SocialAccount).filter(
        and_(
            SocialAccount.creator_id == creator.id,
            SocialAccount.platform == body.platform,
            SocialAccount.username == clean_username,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This {body.platform.value} account is already connected.",
        )

    # Active verification already for this creator+platform+username?
    active = db.query(SocialAccountVerification).filter(
        and_(
            SocialAccountVerification.creator_id == creator.id,
            SocialAccountVerification.platform == body.platform,
            SocialAccountVerification.username == clean_username,
            SocialAccountVerification.status.in_([
                SocialVerificationStatus.CODE_ACTIVE,
                SocialVerificationStatus.PENDING_VERIFICATION,
            ]),
        )
    ).first()
    if active:
        if active.status == SocialVerificationStatus.CODE_ACTIVE and active.expires_at > datetime.utcnow():
            return VerificationInitiateResponse(
                verification_id=active.id,
                verification_code=active.verification_code,
                platform=active.platform.value,
                username=active.username,
                expires_at=active.expires_at,
                message=f"Add this code to your {body.platform.value} profile bio within the time limit, then complete verification.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active verification for this account. Complete or wait for it to expire.",
        )

    expire_minutes = getattr(settings, "SOCIAL_VERIFICATION_CODE_EXPIRE_MINUTES", 10)
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
    code = _generate_verification_code()
    while db.query(SocialAccountVerification).filter(SocialAccountVerification.verification_code == code).first():
        code = _generate_verification_code()

    verification = SocialAccountVerification(
        creator_id=creator.id,
        platform=body.platform,
        username=clean_username,
        verification_code=code,
        status=SocialVerificationStatus.CODE_ACTIVE,
        expires_at=expires_at,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    return VerificationInitiateResponse(
        verification_id=verification.id,
        verification_code=verification.verification_code,
        platform=verification.platform.value,
        username=verification.username,
        expires_at=verification.expires_at,
        message=f"Add the code '{verification.verification_code}' to your {body.platform.value} profile bio. You have {expire_minutes} minutes. Then call the complete endpoint.",
    )


@router.post(
    "/social/accounts/verify/complete",
    response_model=VerificationStatusResponse,
)
async def complete_bio_verification(
    body: VerificationCompleteRequest,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """
    Call this after you have added the verification code to your profile bio.
    Instagram: job is enqueued for the worker (automatic bio check). YouTube: verified synchronously via channel description scrape.
    """
    verification = db.query(SocialAccountVerification).filter(
        and_(
            SocialAccountVerification.id == body.verification_id,
            SocialAccountVerification.creator_id == creator.id,
        )
    ).first()
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found.",
        )
    if verification.status != SocialVerificationStatus.CODE_ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Verification is not in CODE_ACTIVE state (current: {verification.status}).",
        )
    if verification.expires_at < datetime.utcnow():
        verification.status = SocialVerificationStatus.EXPIRED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please start again with initiate.",
        )

    verification.completed_at = datetime.utcnow()

    # YouTube: synchronous verification via requests + bs4 (channel description)
    if verification.platform == SocialPlatform.YOUTUBE:
        from app.utils.youtube_verify import verify_youtube_channel_description
        from datetime import timezone
        try:
            found = verify_youtube_channel_description(
                verification.username,
                verification.verification_code,
            )
            if found:
                verification.status = SocialVerificationStatus.VERIFIED
                verification.verified_at = datetime.now(timezone.utc)
                # Create SocialAccount and link to verification
                _link_social_account_for_verified(db, verification)
            else:
                verification.status = SocialVerificationStatus.FAILED
        except Exception:
            verification.status = SocialVerificationStatus.ERROR
        db.commit()
        db.refresh(verification)
        return VerificationStatusResponse(
            verification_id=verification.id,
            platform=verification.platform.value,
            username=verification.username,
            status=verification.status,
            verification_code=verification.verification_code,
            expires_at=verification.expires_at,
            created_at=verification.created_at,
            completed_at=verification.completed_at,
            verified_at=verification.verified_at,
            social_account_id=verification.social_account_id,
        )

    # Instagram: enqueue for worker (automatic bio check; no admin approval)
    if verification.platform == SocialPlatform.INSTAGRAM:
        from app.core.rabbitmq import publish_verification_job
        verification.status = SocialVerificationStatus.PENDING
        db.commit()
        db.refresh(verification)
        if getattr(settings, "INSTAGRAM_VERIFICATION_ENABLED", True):
            await publish_verification_job(
                request_id=verification.id,
                user_id=creator.user_id,
                instagram_username=verification.username,
                verification_code=verification.verification_code,
            )
        # If worker disabled, status stays PENDING (no admin notify)
    else:
        # TikTok or other: mark pending (no admin notification)
        verification.status = SocialVerificationStatus.PENDING_VERIFICATION
        db.commit()
        db.refresh(verification)

    return VerificationStatusResponse(
        verification_id=verification.id,
        platform=verification.platform.value,
        username=verification.username,
        status=verification.status,
        verification_code=verification.verification_code,
        expires_at=verification.expires_at,
        created_at=verification.created_at,
        completed_at=verification.completed_at,
        verified_at=verification.verified_at,
        social_account_id=verification.social_account_id,
    )


@router.get(
    "/social/accounts/verify/status/{verification_id}",
    response_model=VerificationStatusResponse,
)
async def get_verification_status(
    verification_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Get the current status of a verification attempt."""
    verification = db.query(SocialAccountVerification).filter(
        and_(
            SocialAccountVerification.id == verification_id,
            SocialAccountVerification.creator_id == creator.id,
        )
    ).first()
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found.",
        )

    # Auto-expire if still CODE_ACTIVE and past expiry
    if (
        verification.status == SocialVerificationStatus.CODE_ACTIVE
        and verification.expires_at < datetime.utcnow()
    ):
        verification.status = SocialVerificationStatus.EXPIRED
        db.commit()
        db.refresh(verification)

    return VerificationStatusResponse(
        verification_id=verification.id,
        platform=verification.platform.value,
        username=verification.username,
        status=verification.status,
        verification_code=verification.verification_code,
        expires_at=verification.expires_at,
        created_at=verification.created_at,
        completed_at=verification.completed_at,
        verified_at=verification.verified_at,
        social_account_id=verification.social_account_id,
    )


@router.get(
    "/social/accounts/verify/my",
    response_model=List[VerificationStatusResponse],
)
async def list_my_verifications(
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
    status_filter: Optional[SocialVerificationStatus] = Query(None),
):
    """List all verification attempts for the current creator."""
    query = db.query(SocialAccountVerification).filter(
        SocialAccountVerification.creator_id == creator.id
    )
    if status_filter:
        query = query.filter(SocialAccountVerification.status == status_filter)
    verifications = query.order_by(SocialAccountVerification.created_at.desc()).all()

    return [
        VerificationStatusResponse(
            verification_id=v.id,
            platform=v.platform.value,
            username=v.username,
            status=v.status,
            verification_code=v.verification_code,
            expires_at=v.expires_at,
            created_at=v.created_at,
            completed_at=v.completed_at,
            verified_at=v.verified_at,
            social_account_id=v.social_account_id,
        )
        for v in verifications
    ]


# ========== Social account CRUD (accounts created only after verification) ==========

@router.get(
    "/social/accounts",
    response_model=List[SocialAccountResponse],
)
async def get_my_social_accounts(
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
    platform: Optional[SocialPlatform] = Query(None, description="Filter by platform"),
):
    """
    Get all social accounts connected by the current creator.
    Can filter by platform.
    """
    query = db.query(SocialAccount).filter(
        SocialAccount.creator_id == creator.id
    )
    
    if platform:
        query = query.filter(SocialAccount.platform == platform)
    
    accounts = query.order_by(SocialAccount.created_at.desc()).all()
    
    return [
        {
            "id": account.id,
            "creator_id": account.creator_id,
            "platform": account.platform,
            "platform_user_id": account.platform_user_id,
            "username": account.username,
            "is_verified": account.access_token is not None,
            "created_at": account.created_at.isoformat(),
        }
        for account in accounts
    ]


@router.get(
    "/social/accounts/{account_id}",
    response_model=SocialAccountResponse,
)
async def get_social_account(
    account_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Get details of a specific social account"""
    account = db.query(SocialAccount).filter(
        and_(
            SocialAccount.id == account_id,
            SocialAccount.creator_id == creator.id
        )
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    return {
        "id": account.id,
        "creator_id": account.creator_id,
        "platform": account.platform,
        "platform_user_id": account.platform_user_id,
        "username": account.username,
        "is_verified": account.access_token is not None,
        "created_at": account.created_at.isoformat(),
    }


@router.put(
    "/social/accounts/{account_id}",
    response_model=SocialAccountResponse,
)
async def update_social_account(
    account_id: str,
    account_data: SocialAccountUpdate,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Update social account details (username, platform_user_id)"""
    account = db.query(SocialAccount).filter(
        and_(
            SocialAccount.id == account_id,
            SocialAccount.creator_id == creator.id
        )
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    # Update fields if provided
    if account_data.username is not None:
        clean_username = account_data.username.strip().replace("@", "")
        if not validate_username_format(account.platform, clean_username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {account.platform.value} username format"
            )
        account.username = clean_username
    
    if account_data.platform_user_id is not None:
        account.platform_user_id = account_data.platform_user_id
    
    db.commit()
    db.refresh(account)
    
    return {
        "id": account.id,
        "creator_id": account.creator_id,
        "platform": account.platform,
        "platform_user_id": account.platform_user_id,
        "username": account.username,
        "is_verified": account.access_token is not None,
        "created_at": account.created_at.isoformat(),
    }


@router.delete(
    "/social/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_social_account(
    account_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Delete a social account"""
    account = db.query(SocialAccount).filter(
        and_(
            SocialAccount.id == account_id,
            SocialAccount.creator_id == creator.id
        )
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    # TODO: Check if account has submissions - maybe prevent deletion or warn
    # For now, allow deletion
    
    db.delete(account)
    db.commit()
    
    return None


# ========== OAuth Endpoints (For Future Implementation) ==========

@router.get("/social/connect/instagram")
async def connect_instagram_oauth(
    creator: Creator = Depends(get_current_creator),
):
    """
    Initiate Instagram OAuth flow.
    TODO: Implement OAuth flow with Instagram Graph API
    """
    # This will redirect to Instagram OAuth page
    # For now, return a message indicating it's not implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Instagram OAuth connection is not yet implemented. Please use manual account addition."
    )


@router.get("/social/connect/youtube")
async def connect_youtube_oauth(
    creator: Creator = Depends(get_current_creator),
):
    """
    Initiate YouTube OAuth flow.
    TODO: Implement OAuth flow with YouTube Data API v3
    """
    # This will redirect to Google OAuth page
    # For now, return a message indicating it's not implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="YouTube OAuth connection is not yet implemented. Please use manual account addition."
    )
