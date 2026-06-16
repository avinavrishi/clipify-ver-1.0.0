"""
Admin endpoints for managing users, brands, and KPIs.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.brand import Brand
from app.models.campaign import Campaign, CampaignStatus
from app.models.economy import Payout
from app.models.social import (
    SocialAccount,
    SocialAccountVerification,
    SocialVerificationStatus,
    CampaignParticipation,
    CampaignParticipationStatus,
    ContentSubmission,
    ContentSubmissionStatus,
)
from app.schemas.user import UserResponse

router = APIRouter()


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ==== USER MANAGEMENT ====


@router.get("/users", response_model=List[UserResponse])
async def admin_list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    return db.query(User).all()


@router.get("/users/{user_id}", response_model=UserResponse)
async def admin_get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    db.delete(user)
    db.commit()
    return None


# ==== BRAND MANAGEMENT ====


class BrandAdminResponseModel(BaseModel):
    id: str
    user_id: str
    company_name: str
    industry: str | None = None
    website: str | None = None


class BrandAdminCreate(BaseModel):
    user_id: str
    company_name: str
    industry: str | None = None
    website: str | None = None


class BrandAdminUpdate(BaseModel):
    company_name: str | None = None
    industry: str | None = None
    website: str | None = None


@router.get("/brands", response_model=List[BrandAdminResponseModel])
async def admin_list_brands(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    return db.query(Brand).all()


@router.post(
    "/brands",
    response_model=BrandAdminResponseModel,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_brand(
    data: BrandAdminCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    # Ensure user exists and is a BRAND
    brand_user = db.query(User).filter(User.id == data.user_id).first()
    if not brand_user or brand_user.role != UserRole.BRAND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided user_id must belong to a BRAND user",
        )

    existing = db.query(Brand).filter(Brand.user_id == data.user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand already exists for this user",
        )

    brand = Brand(
        user_id=data.user_id,
        company_name=data.company_name,
        industry=data.industry,
        website=data.website,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.get("/brands/{brand_id}", response_model=BrandAdminResponseModel)
async def admin_get_brand(
    brand_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )
    return brand


@router.patch("/brands/{brand_id}", response_model=BrandAdminResponseModel)
async def admin_update_brand(
    brand_id: str,
    data: BrandAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(brand, field, value)

    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_brand(
    brand_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found",
        )
    db.delete(brand)
    db.commit()
    return None


# ==== SOCIAL ACCOUNT VERIFICATION (bio code) ====


class SocialVerificationAdminItem(BaseModel):
    id: str
    creator_id: str
    platform: str
    username: str
    verification_code: str
    status: str
    expires_at: datetime
    created_at: datetime
    completed_at: Optional[datetime] = None


class SocialAccountAdminResponse(BaseModel):
    id: str
    creator_id: str
    platform: str
    username: str
    platform_user_id: str


@router.get(
    "/social/verifications/pending",
    response_model=List[SocialVerificationAdminItem],
)
async def admin_list_pending_social_verifications(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """List verifications waiting for admin to check bio and approve/reject."""
    rows = (
        db.query(SocialAccountVerification)
        .filter(SocialAccountVerification.status == SocialVerificationStatus.PENDING_VERIFICATION)
        .order_by(SocialAccountVerification.completed_at.desc())
        .all()
    )
    return [
        SocialVerificationAdminItem(
            id=r.id,
            creator_id=r.creator_id,
            platform=r.platform.value,
            username=r.username,
            verification_code=r.verification_code,
            status=r.status.value,
            expires_at=r.expires_at,
            created_at=r.created_at,
            completed_at=r.completed_at,
        )
        for r in rows
    ]


@router.post(
    "/social/verifications/{verification_id}/approve",
    response_model=SocialAccountAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_approve_social_verification(
    verification_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """
    After checking that the verification code appears in the creator's profile bio,
    approve the verification. This creates the SocialAccount and links it to the creator.
    """
    verification = (
        db.query(SocialAccountVerification)
        .filter(SocialAccountVerification.id == verification_id)
        .first()
    )
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found",
        )
    if verification.status != SocialVerificationStatus.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Verification is not pending (current: {verification.status})",
        )

    # Avoid duplicate account
    existing = db.query(SocialAccount).filter(
        SocialAccount.creator_id == verification.creator_id,
        SocialAccount.platform == verification.platform,
        SocialAccount.username == verification.username,
    ).first()
    if existing:
        verification.status = SocialVerificationStatus.REJECTED
        verification.verified_at = datetime.utcnow()
        verification.verified_by_user_id = admin.id
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already connected for this creator",
        )

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

    verification.status = SocialVerificationStatus.VERIFIED
    verification.verified_at = datetime.utcnow()
    verification.verified_by_user_id = admin.id
    verification.social_account_id = account.id
    db.commit()
    db.refresh(account)

    # Notify creator that account was approved
    from app.core.notifications import notify_creator_social_account_approved
    from app.models.profile import Creator
    creator = db.query(Creator).filter(Creator.id == verification.creator_id).first()
    if creator:
        notify_creator_social_account_approved(
            db=db,
            creator_id=creator.user_id,
            platform=verification.platform.value,
            username=verification.username,
        )

    return SocialAccountAdminResponse(
        id=account.id,
        creator_id=account.creator_id,
        platform=account.platform.value,
        username=account.username,
        platform_user_id=account.platform_user_id,
    )


@router.post(
    "/social/verifications/{verification_id}/reject",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def admin_reject_social_verification(
    verification_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """Reject a verification (e.g. code not found in bio)."""
    verification = (
        db.query(SocialAccountVerification)
        .filter(SocialAccountVerification.id == verification_id)
        .first()
    )
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found",
        )
    if verification.status != SocialVerificationStatus.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification is not pending",
        )

    verification.status = SocialVerificationStatus.REJECTED
    verification.verified_at = datetime.utcnow()
    verification.verified_by_user_id = admin.id
    db.commit()

    # Notify creator that account was rejected
    from app.core.notifications import notify_creator_social_account_rejected
    from app.models.profile import Creator
    creator = db.query(Creator).filter(Creator.id == verification.creator_id).first()
    if creator:
        notify_creator_social_account_rejected(
            db=db,
            creator_id=creator.user_id,
            platform=verification.platform.value,
            username=verification.username,
            reason="Verification code not found in bio or profile invalid",
        )

    return None


# ==== CAMPAIGN PARTICIPATION MANAGEMENT ====


class ParticipationUpdateRequest(BaseModel):
    status: CampaignParticipationStatus
    reason: Optional[str] = None


@router.get("/participations/pending", response_model=List[dict])
async def admin_list_pending_participations(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
    skip: int = 0,
    limit: int = 100,
):
    """
    List all pending (APPLIED) participations across all campaigns.
    Use this for admin dashboard / notifications: "X creator is applying for Y campaign".
    """
    from app.models.profile import Profile, Creator as CreatorModel

    participations = (
        db.query(CampaignParticipation)
        .filter(CampaignParticipation.status == CampaignParticipationStatus.APPLIED)
        .order_by(CampaignParticipation.joined_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for p in participations:
        campaign = db.query(Campaign).filter(Campaign.id == p.campaign_id).first()
        creator = db.query(CreatorModel).filter(CreatorModel.id == p.creator_id).first()
        profile = db.query(Profile).filter(Profile.user_id == creator.user_id).first() if creator else None
        result.append({
            "id": p.id,
            "participation_id": p.id,
            "campaign_id": p.campaign_id,
            "campaign_title": campaign.title if campaign else None,
            "creator_id": p.creator_id,
            "creator_display_name": profile.display_name if profile else "Creator",
            "status": p.status.value,
            "total_submissions": p.total_submissions,
            "total_earned": p.total_earned,
            "joined_at": p.joined_at.isoformat(),
        })
    return result


@router.get("/campaigns/{campaign_id}/participations", response_model=List[dict])
async def admin_list_campaign_participations(
    campaign_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """List all participations for a campaign with creator display names"""
    from app.models.profile import Profile, Creator as CreatorModel

    participations = (
        db.query(CampaignParticipation)
        .filter(CampaignParticipation.campaign_id == campaign_id)
        .order_by(CampaignParticipation.joined_at.desc())
        .all()
    )
    result = []
    for p in participations:
        campaign = db.query(Campaign).filter(Campaign.id == p.campaign_id).first()
        creator = db.query(CreatorModel).filter(CreatorModel.id == p.creator_id).first()
        profile = db.query(Profile).filter(Profile.user_id == creator.user_id).first() if creator else None
        result.append({
            "id": p.id,
            "participation_id": p.id,
            "campaign_id": p.campaign_id,
            "campaign_title": campaign.title if campaign else None,
            "creator_id": p.creator_id,
            "creator_display_name": profile.display_name if profile else "Creator",
            "status": p.status.value,
            "total_submissions": p.total_submissions,
            "total_earned": p.total_earned,
            "joined_at": p.joined_at.isoformat(),
        })
    return result


@router.patch(
    "/participations/{participation_id}",
    response_model=dict,
)
async def admin_update_participation(
    participation_id: str,
    data: ParticipationUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """Approve or reject a campaign participation"""
    participation = (
        db.query(CampaignParticipation)
        .filter(CampaignParticipation.id == participation_id)
        .first()
    )
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participation not found",
        )

    old_status = participation.status
    participation.status = data.status
    db.commit()
    db.refresh(participation)

    # Notify creator
    from app.core.notifications import (
        notify_creator_participation_approved,
        notify_creator_participation_rejected,
    )
    from app.models.profile import Creator
    from app.models.campaign import Campaign

    creator = db.query(Creator).filter(Creator.id == participation.creator_id).first()
    campaign = db.query(Campaign).filter(Campaign.id == participation.campaign_id).first()

    if creator and campaign:
        if data.status == CampaignParticipationStatus.APPROVED:
            notify_creator_participation_approved(
                db=db,
                creator_id=creator.user_id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
            )
        elif data.status == CampaignParticipationStatus.REJECTED:
            notify_creator_participation_rejected(
                db=db,
                creator_id=creator.user_id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                reason=data.reason,
            )

    return {
        "id": participation.id,
        "status": participation.status.value,
        "message": f"Participation {data.status.value.lower()} successfully",
    }


# ==== CONTENT SUBMISSION MANAGEMENT ====


class ContentSubmissionUpdateRequest(BaseModel):
    status: ContentSubmissionStatus
    verified_views: Optional[int] = None
    calculated_earnings: Optional[float] = None
    reason: Optional[str] = None


@router.get("/campaigns/{campaign_id}/submissions", response_model=List[dict])
async def admin_list_campaign_submissions(
    campaign_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """List all content submissions for a campaign"""
    submissions = (
        db.query(ContentSubmission)
        .filter(ContentSubmission.campaign_id == campaign_id)
        .all()
    )
    return [
        {
            "id": s.id,
            "creator_id": s.creator_id,
            "content_url": s.content_url,
            "status": s.status.value,
            "verified_views": s.verified_views,
            "calculated_earnings": s.calculated_earnings,
            "submitted_at": s.submitted_at.isoformat(),
        }
        for s in submissions
    ]


@router.patch(
    "/submissions/{submission_id}",
    response_model=dict,
)
async def admin_update_submission(
    submission_id: str,
    data: ContentSubmissionUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """Approve or reject a content submission"""
    submission = (
        db.query(ContentSubmission)
        .filter(ContentSubmission.id == submission_id)
        .first()
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    submission.status = data.status
    if data.verified_views is not None:
        submission.verified_views = data.verified_views
    if data.calculated_earnings is not None:
        submission.calculated_earnings = data.calculated_earnings
    db.commit()
    db.refresh(submission)

    # Notify creator
    from app.core.notifications import (
        notify_creator_content_approved,
        notify_creator_content_rejected,
    )
    from app.models.profile import Creator
    from app.models.campaign import Campaign

    creator = db.query(Creator).filter(Creator.id == submission.creator_id).first()
    campaign = db.query(Campaign).filter(Campaign.id == submission.campaign_id).first()

    if creator and campaign:
        if data.status == ContentSubmissionStatus.APPROVED:
            notify_creator_content_approved(
                db=db,
                creator_id=creator.user_id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                content_url=submission.content_url,
            )
        elif data.status == ContentSubmissionStatus.REJECTED:
            notify_creator_content_rejected(
                db=db,
                creator_id=creator.user_id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                content_url=submission.content_url,
                reason=data.reason,
            )

    return {
        "id": submission.id,
        "status": submission.status.value,
        "message": f"Submission {data.status.value.lower()} successfully",
    }


# ==== KPIs ====


class AdminKPIResponse(BaseModel):
    total_users: int
    total_creators: int
    total_brands: int
    total_admins: int
    total_campaigns: int
    active_campaigns: int
    paused_campaigns: int
    completed_campaigns: int
    total_payout_amount: float


@router.get("/kpis", response_model=AdminKPIResponse)
async def admin_kpis(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    from app.models.user import UserRole as UR

    total_users = db.query(User).count()
    total_creators = db.query(User).filter(User.role == UR.CREATOR).count()
    total_brands = db.query(User).filter(User.role == UR.BRAND).count()
    total_admins = db.query(User).filter(User.role == UR.ADMIN).count()

    total_campaigns = db.query(Campaign).count()
    active_campaigns = db.query(Campaign).filter(Campaign.status == CampaignStatus.ACTIVE).count()
    paused_campaigns = db.query(Campaign).filter(Campaign.status == CampaignStatus.PAUSED).count()
    completed_campaigns = db.query(Campaign).filter(Campaign.status == CampaignStatus.COMPLETED).count()

    total_payout_amount = (
        db.query(Payout)
        .with_entities(func.coalesce(func.sum(Payout.amount), 0.0))
        .scalar()
    )

    return AdminKPIResponse(
        total_users=total_users,
        total_creators=total_creators,
        total_brands=total_brands,
        total_admins=total_admins,
        total_campaigns=total_campaigns,
        active_campaigns=active_campaigns,
        paused_campaigns=paused_campaigns,
        completed_campaigns=completed_campaigns,
        total_payout_amount=total_payout_amount,
    )

