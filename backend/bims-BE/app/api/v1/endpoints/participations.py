"""
Campaign Participation and Content Submission Endpoints
"""
from typing import List, Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.campaign import (
    Campaign,
    CampaignStatus,
    CAMPAIGN_TYPE_FACE_CREATOR,
    CAMPAIGN_TYPE_FACELESS_CREATOR,
)
from app.models.profile import Creator, CreatorType
from app.models.social import (
    CampaignParticipation,
    CampaignParticipationStatus,
    ContentSubmission,
    ContentSubmissionStatus,
    SocialAccount,
)
from app.schemas.participation import (
    CampaignParticipationCreate,
    CampaignParticipationResponse,
    CampaignParticipationWithCampaign,
    ContentSubmissionCreate,
    ContentSubmissionResponse,
    ContentSubmissionWithDetails,
    ContentSubmissionUpdate,
    SubmitLinkCreate,
    SubmitLinkResponse,
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


# ========== Campaign Participation Endpoints ==========

@router.post(
    "/participations",
    response_model=CampaignParticipationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_campaign(
    participation_data: CampaignParticipationCreate,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """
    Apply to participate in a campaign (face creators only).
    Faceless creators should use POST /creator/submit-link instead.
    """
    if creator.creator_type != CreatorType.FACE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apply to Campaign is only for face creators. Faceless creators should use Submit Link.",
        )
    # Check if campaign exists and is active
    campaign = db.query(Campaign).filter(Campaign.id == participation_data.campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.campaign_type != CAMPAIGN_TYPE_FACE_CREATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is for faceless creators only. Use Submit Link instead.",
        )

    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is not active. Only active campaigns can be joined."
        )

    # Check if campaign is still accepting applications (date check)
    today = date.today()
    if campaign.end_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has ended"
        )
    
    if campaign.start_date > today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has not started yet"
        )
    
    # Check if creator already applied
    existing_participation = db.query(CampaignParticipation).filter(
        and_(
            CampaignParticipation.campaign_id == participation_data.campaign_id,
            CampaignParticipation.creator_id == creator.id
        )
    ).first()
    
    if existing_participation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this campaign"
        )
    
    # Create participation with APPLIED status
    new_participation = CampaignParticipation(
        campaign_id=participation_data.campaign_id,
        creator_id=creator.id,
        status=CampaignParticipationStatus.APPLIED,
    )
    db.add(new_participation)
    db.commit()
    db.refresh(new_participation)
    
    # Notify brand and admin about new participation request
    from app.core.notifications import (
        notify_brand_campaign_participation_pending,
        notify_admin_campaign_participation_pending,
    )
    from app.models.profile import Profile
    from app.models.brand import Brand
    
    profile = db.query(Profile).filter(Profile.user_id == creator.user_id).first()
    creator_username = profile.display_name if profile else "Creator"
    
    # Notify brand
    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if brand:
        brand_user = db.query(User).filter(User.id == brand.user_id).first()
        if brand_user:
            notify_brand_campaign_participation_pending(
                db=db,
                brand_id=brand_user.id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                creator_username=creator_username,
                participation_id=new_participation.id,
            )
    
    # Notify admins (so admin can approve/reject from notification)
    notify_admin_campaign_participation_pending(
        db=db,
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        creator_username=creator_username,
        participation_id=new_participation.id,
    )
    
    return new_participation


@router.post(
    "/submit-link",
    response_model=SubmitLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_link_faceless(
    data: SubmitLinkCreate,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """
    Faceless creators only: submit a content link directly (no apply step).
    Creates an approved participation and a content submission in one call.
    Face creators must use "Apply to Campaign" instead.
    """
    if creator.creator_type != CreatorType.FACELESS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Submit Link is only for faceless creators. Face creators should use Apply to Campaign.",
        )
    campaign = db.query(Campaign).filter(Campaign.id == data.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    if campaign.campaign_type != CAMPAIGN_TYPE_FACELESS_CREATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is for face creators only. Use Apply to Campaign instead.",
        )
    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is not active. Only active campaigns accept link submissions.",
        )
    today = date.today()
    if campaign.end_date < today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campaign has ended")
    if campaign.start_date > today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campaign has not started yet")

    social_account = db.query(SocialAccount).filter(
        and_(
            SocialAccount.id == data.social_account_id,
            SocialAccount.creator_id == creator.id,
        )
    ).first()
    if not social_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found or does not belong to you",
        )

    existing_participation = db.query(CampaignParticipation).filter(
        and_(
            CampaignParticipation.campaign_id == data.campaign_id,
            CampaignParticipation.creator_id == creator.id,
        )
    ).first()
    if existing_participation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already participated in this campaign. Use content submission to add more links.",
        )

    if campaign.max_submissions_per_account:
        existing_count = db.query(ContentSubmission).filter(
            and_(
                ContentSubmission.campaign_id == data.campaign_id,
                ContentSubmission.social_account_id == data.social_account_id,
            )
        ).count()
        if existing_count >= campaign.max_submissions_per_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum submissions limit ({campaign.max_submissions_per_account}) reached for this account",
            )

    existing_submission = db.query(ContentSubmission).filter(
        and_(
            ContentSubmission.campaign_id == data.campaign_id,
            ContentSubmission.content_url == data.content_url,
            ContentSubmission.creator_id == creator.id,
        )
    ).first()
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This content URL has already been submitted for this campaign",
        )

    new_participation = CampaignParticipation(
        campaign_id=data.campaign_id,
        creator_id=creator.id,
        status=CampaignParticipationStatus.APPROVED,
    )
    db.add(new_participation)
    db.flush()

    new_submission = ContentSubmission(
        campaign_id=data.campaign_id,
        creator_id=creator.id,
        social_account_id=data.social_account_id,
        content_url=data.content_url,
        platform_content_id=data.platform_content_id,
        status=ContentSubmissionStatus.PENDING,
    )
    db.add(new_submission)
    new_participation.total_submissions = 1
    db.commit()
    db.refresh(new_participation)
    db.refresh(new_submission)

    from app.core.notifications import (
        notify_brand_content_submitted,
        notify_admin_content_submitted,
    )
    from app.models.profile import Profile
    from app.models.brand import Brand

    profile = db.query(Profile).filter(Profile.user_id == creator.user_id).first()
    creator_username = profile.display_name if profile else "Creator"
    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if brand:
        brand_user = db.query(User).filter(User.id == brand.user_id).first()
        if brand_user:
            notify_brand_content_submitted(
                db=db,
                brand_id=brand_user.id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                creator_username=creator_username,
                content_url=data.content_url,
            )
    notify_admin_content_submitted(
        db=db,
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        creator_username=creator_username,
        content_url=data.content_url,
    )

    return SubmitLinkResponse(
        participation_id=new_participation.id,
        submission_id=new_submission.id,
        message="Link submitted. Your submission is under review.",
    )


@router.get(
    "/participations/my",
    response_model=List[CampaignParticipationWithCampaign],
)
async def get_my_participations(
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[CampaignParticipationStatus] = None,
):
    """
    Get all campaigns that the current creator has participated in.
    Can filter by participation status.
    """
    query = db.query(CampaignParticipation).filter(
        CampaignParticipation.creator_id == creator.id
    )
    
    if status_filter:
        query = query.filter(CampaignParticipation.status == status_filter)
    
    participations = query.order_by(CampaignParticipation.joined_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich with campaign details
    result = []
    for participation in participations:
        campaign = db.query(Campaign).filter(Campaign.id == participation.campaign_id).first()
        participation_dict = {
            **participation.__dict__,
            "campaign_title": campaign.title if campaign else None,
            "campaign_status": campaign.status.value if campaign else None,
            "campaign_budget": campaign.total_budget if campaign else None,
            "campaign_rate_per_million": campaign.rate_per_million_views if campaign else None,
        }
        result.append(CampaignParticipationWithCampaign(**participation_dict))
    
    return result


@router.get(
    "/participations/{participation_id}",
    response_model=CampaignParticipationWithCampaign,
)
async def get_participation(
    participation_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Get details of a specific participation"""
    participation = db.query(CampaignParticipation).filter(
        and_(
            CampaignParticipation.id == participation_id,
            CampaignParticipation.creator_id == creator.id
        )
    ).first()
    
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participation not found"
        )
    
    campaign = db.query(Campaign).filter(Campaign.id == participation.campaign_id).first()
    participation_dict = {
        **participation.__dict__,
        "campaign_title": campaign.title if campaign else None,
        "campaign_status": campaign.status.value if campaign else None,
        "campaign_budget": campaign.total_budget if campaign else None,
        "campaign_rate_per_million": campaign.rate_per_million_views if campaign else None,
    }
    return CampaignParticipationWithCampaign(**participation_dict)


# ========== Content Submission Endpoints ==========

@router.post(
    "/submissions",
    response_model=ContentSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_content(
    submission_data: ContentSubmissionCreate,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """
    Submit content URL for a campaign.
    Creator must have an approved participation in the campaign.
    """
    # Check if campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == submission_data.campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.campaign_type == CAMPAIGN_TYPE_FACE_CREATOR and creator.creator_type != CreatorType.FACE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is for face creators only.",
        )
    if campaign.campaign_type == CAMPAIGN_TYPE_FACELESS_CREATOR and creator.creator_type != CreatorType.FACELESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is for faceless creators only.",
        )

    # Check if social account exists and belongs to creator
    social_account = db.query(SocialAccount).filter(
        and_(
            SocialAccount.id == submission_data.social_account_id,
            SocialAccount.creator_id == creator.id
        )
    ).first()
    
    if not social_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found or does not belong to you"
        )
    
    # Check if creator has approved participation in this campaign
    participation = db.query(CampaignParticipation).filter(
        and_(
            CampaignParticipation.campaign_id == submission_data.campaign_id,
            CampaignParticipation.creator_id == creator.id,
            CampaignParticipation.status == CampaignParticipationStatus.APPROVED
        )
    ).first()
    
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an approved participation in this campaign to submit content"
        )
    
    # Check max submissions per account limit if set
    if campaign.max_submissions_per_account:
        existing_submissions_count = db.query(ContentSubmission).filter(
            and_(
                ContentSubmission.campaign_id == submission_data.campaign_id,
                ContentSubmission.social_account_id == submission_data.social_account_id
            )
        ).count()
        
        if existing_submissions_count >= campaign.max_submissions_per_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum submissions limit ({campaign.max_submissions_per_account}) reached for this social account"
            )
    
    # Check if URL already submitted (prevent duplicates)
    existing_submission = db.query(ContentSubmission).filter(
        and_(
            ContentSubmission.campaign_id == submission_data.campaign_id,
            ContentSubmission.content_url == submission_data.content_url,
            ContentSubmission.creator_id == creator.id
        )
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This content URL has already been submitted for this campaign"
        )
    
    # Create submission
    new_submission = ContentSubmission(
        campaign_id=submission_data.campaign_id,
        creator_id=creator.id,
        social_account_id=submission_data.social_account_id,
        content_url=submission_data.content_url,
        platform_content_id=submission_data.platform_content_id,
        status=ContentSubmissionStatus.PENDING,
    )
    
    db.add(new_submission)
    
    # Update participation total_submissions count
    participation.total_submissions += 1
    
    db.commit()
    db.refresh(new_submission)
    
    # Notify brand and admin about new content submission
    from app.core.notifications import (
        notify_brand_content_submitted,
        notify_admin_content_submitted,
    )
    from app.models.profile import Profile
    from app.models.brand import Brand
    
    profile = db.query(Profile).filter(Profile.user_id == creator.user_id).first()
    creator_username = profile.display_name if profile else "Creator"
    
    # Notify brand
    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if brand:
        brand_user = db.query(User).filter(User.id == brand.user_id).first()
        if brand_user:
            notify_brand_content_submitted(
                db=db,
                brand_id=brand_user.id,
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                creator_username=creator_username,
                content_url=submission_data.content_url,
            )
    
    # Notify admins
    notify_admin_content_submitted(
        db=db,
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        creator_username=creator_username,
        content_url=submission_data.content_url,
    )
    
    return new_submission


@router.get(
    "/submissions/my",
    response_model=List[ContentSubmissionWithDetails],
)
async def get_my_submissions(
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
    campaign_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[ContentSubmissionStatus] = None,
):
    """
    Get all content submissions by the current creator.
    Can filter by campaign_id and status.
    """
    query = db.query(ContentSubmission).filter(
        ContentSubmission.creator_id == creator.id
    )
    
    if campaign_id:
        query = query.filter(ContentSubmission.campaign_id == campaign_id)
    
    if status_filter:
        query = query.filter(ContentSubmission.status == status_filter)
    
    submissions = query.order_by(ContentSubmission.submitted_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich with campaign and social account details
    result = []
    for submission in submissions:
        campaign = db.query(Campaign).filter(Campaign.id == submission.campaign_id).first()
        social_account = db.query(SocialAccount).filter(SocialAccount.id == submission.social_account_id).first()
        
        submission_dict = {
            **submission.__dict__,
            "campaign_title": campaign.title if campaign else None,
            "social_account_username": social_account.username if social_account else None,
            "social_platform": social_account.platform.value if social_account else None,
        }
        result.append(ContentSubmissionWithDetails(**submission_dict))
    
    return result


@router.get(
    "/submissions/{submission_id}",
    response_model=ContentSubmissionWithDetails,
)
async def get_submission(
    submission_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
):
    """Get details of a specific content submission"""
    submission = db.query(ContentSubmission).filter(
        and_(
            ContentSubmission.id == submission_id,
            ContentSubmission.creator_id == creator.id
        )
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    campaign = db.query(Campaign).filter(Campaign.id == submission.campaign_id).first()
    social_account = db.query(SocialAccount).filter(SocialAccount.id == submission.social_account_id).first()
    
    submission_dict = {
        **submission.__dict__,
        "campaign_title": campaign.title if campaign else None,
        "social_account_username": social_account.username if social_account else None,
        "social_platform": social_account.platform.value if social_account else None,
    }
    return ContentSubmissionWithDetails(**submission_dict)


@router.get(
    "/campaigns/{campaign_id}/submissions",
    response_model=List[ContentSubmissionWithDetails],
)
async def get_campaign_submissions(
    campaign_id: str,
    creator: Creator = Depends(get_current_creator),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all submissions for a specific campaign by the current creator.
    """
    # Verify creator has participation in this campaign
    participation = db.query(CampaignParticipation).filter(
        and_(
            CampaignParticipation.campaign_id == campaign_id,
            CampaignParticipation.creator_id == creator.id
        )
    ).first()
    
    if not participation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this campaign"
        )
    
    submissions = db.query(ContentSubmission).filter(
        and_(
            ContentSubmission.campaign_id == campaign_id,
            ContentSubmission.creator_id == creator.id
        )
    ).order_by(ContentSubmission.submitted_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich with details
    result = []
    for submission in submissions:
        campaign = db.query(Campaign).filter(Campaign.id == submission.campaign_id).first()
        social_account = db.query(SocialAccount).filter(SocialAccount.id == submission.social_account_id).first()
        
        submission_dict = {
            **submission.__dict__,
            "campaign_title": campaign.title if campaign else None,
            "social_account_username": social_account.username if social_account else None,
            "social_platform": social_account.platform.value if social_account else None,
        }
        result.append(ContentSubmissionWithDetails(**submission_dict))
    
    return result
