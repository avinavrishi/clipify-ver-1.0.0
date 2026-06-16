"""
Campaign Endpoints aligned with UML.
"""
from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.v1.dependencies import get_current_brand_or_admin, get_current_user
from app.core.database import get_db
from app.models.brand import Brand
from app.models.campaign import Campaign
from app.models.platform import CampaignPlatform, Platform
from app.models.profile import Creator, Profile
from app.models.social import CampaignParticipation
from app.models.user import User, UserRole
from app.schemas.campaign import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
    PlatformBrief,
)

router = APIRouter()

MAX_PARTICIPANT_AVATARS = 5


def _get_participant_data(db: Session, campaign_ids: List[str]) -> Dict[str, dict]:
    """
    Return for each campaign_id: {"count": int, "avatars": List[str]} (up to 5 avatar URLs).
    Uses Creator -> User -> Profile for profile_picture_url.
    """
    if not campaign_ids:
        return {}
    rows = (
        db.query(CampaignParticipation.campaign_id, Profile.profile_picture_url)
        .join(Creator, CampaignParticipation.creator_id == Creator.id)
        .join(User, Creator.user_id == User.id)
        .outerjoin(Profile, User.id == Profile.user_id)
        .filter(CampaignParticipation.campaign_id.in_(campaign_ids))
        .order_by(CampaignParticipation.joined_at.desc())
        .all()
    )
    # Group by campaign_id: collect up to 5 avatar URLs per campaign; count = total participations
    by_campaign: Dict[str, List[str]] = defaultdict(list)
    for campaign_id, url in rows:
        if len(by_campaign[campaign_id]) < MAX_PARTICIPANT_AVATARS and url:
            by_campaign[campaign_id].append(url)
    # Count participations per campaign (from same rows)
    count_by_campaign: Dict[str, int] = defaultdict(int)
    for campaign_id, _ in rows:
        count_by_campaign[campaign_id] += 1
    return {
        cid: {"count": count_by_campaign[cid], "avatars": by_campaign.get(cid, [])}
        for cid in campaign_ids
    }


def _campaign_to_response(
    campaign: Campaign,
    participant_count: int = 0,
    participant_avatars: List[str] = None,
) -> CampaignResponse:
    """Build CampaignResponse with platforms and participant info for card."""
    platforms = [
        PlatformBrief(id=cp.platform.id, name=cp.platform.name)
        for cp in campaign.campaign_platforms
    ]
    data = {
        "id": campaign.id,
        "brand_id": campaign.brand_id,
        "title": campaign.title,
        "category": campaign.category,
        "campaign_type": campaign.campaign_type,
        "content_type": campaign.content_type,
        "description": campaign.description,
        "total_budget": campaign.total_budget,
        "used_budget": campaign.used_budget,
        "rate_per_million_views": campaign.rate_per_million_views,
        "max_submissions_per_account": campaign.max_submissions_per_account,
        "max_earnings_per_creator": campaign.max_earnings_per_creator,
        "max_earnings_per_post": campaign.max_earnings_per_post,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "status": campaign.status,
        "logo_drive_link": campaign.logo_drive_link,
        "guidelines_link": campaign.guidelines_link,
        "discord_link": campaign.discord_link,
        "created_at": campaign.created_at,
        "platforms": platforms,
        "participant_count": participant_count,
        "participant_avatars": participant_avatars or [],
    }
    return CampaignResponse(**data)


@router.get("/platforms", response_model=List[PlatformBrief])
async def list_platforms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all platforms (Instagram, YouTube, TikTok, etc.) for campaign platform selection."""
    platforms = db.query(Platform).order_by(Platform.name).all()
    return [PlatformBrief(id=p.id, name=p.name) for p in platforms]


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_brand_or_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new campaign. Brand users create for their own brand; admins may pass brand_id to create on behalf of a brand.
    Include platform_ids to link the campaign to one or more platforms (e.g. Instagram, YouTube, TikTok).
    """
    if current_user.role == UserRole.ADMIN and campaign_data.brand_id:
        brand = db.query(Brand).filter(Brand.id == campaign_data.brand_id).first()
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Brand not found.",
            )
    else:
        brand = db.query(Brand).filter(Brand.user_id == current_user.id).first()
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Brand profile not found for this user.",
            )

    create_fields = campaign_data.model_dump(exclude={"platform_ids", "brand_id"})
    new_campaign = Campaign(brand_id=brand.id, **create_fields)
    db.add(new_campaign)
    db.flush()

    for platform_id in campaign_data.platform_ids or []:
        platform = db.query(Platform).filter(Platform.id == platform_id).first()
        if platform:
            db.add(CampaignPlatform(campaign_id=new_campaign.id, platform_id=platform.id))

    db.commit()
    db.refresh(new_campaign)
    new_campaign = (
        db.query(Campaign)
        .options(
            joinedload(Campaign.campaign_platforms).joinedload(CampaignPlatform.platform)
        )
        .filter(Campaign.id == new_campaign.id)
        .first()
    )
    part_data = _get_participant_data(db, [new_campaign.id])
    info = part_data.get(new_campaign.id, {"count": 0, "avatars": []})
    return _campaign_to_response(new_campaign, info["count"], info["avatars"])


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List campaigns with role-based visibility:
    - Creators: see all campaigns.
    - Admins: see all campaigns.
    - Brands: see only their own campaigns.
    Each campaign includes linked platforms for card/details.
    """
    query = db.query(Campaign).options(
        joinedload(Campaign.campaign_platforms).joinedload(CampaignPlatform.platform)
    )

    if current_user.role == UserRole.BRAND:
        brand = db.query(Brand).filter(Brand.user_id == current_user.id).first()
        if not brand:
            return []
        query = query.filter(Campaign.brand_id == brand.id)

    campaigns = query.offset(skip).limit(limit).all()
    campaign_ids = [c.id for c in campaigns]
    part_data = _get_participant_data(db, campaign_ids)
    return [
        _campaign_to_response(
            c,
            part_data.get(c.id, {}).get("count", 0),
            part_data.get(c.id, {}).get("avatars", []),
        )
        for c in campaigns
    ]


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = (
        db.query(Campaign)
        .options(
            joinedload(Campaign.campaign_platforms).joinedload(CampaignPlatform.platform)
        )
        .filter(Campaign.id == campaign_id)
        .first()
    )
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    part_data = _get_participant_data(db, [campaign_id])
    info = part_data.get(campaign_id, {"count": 0, "avatars": []})
    return _campaign_to_response(campaign, info["count"], info["avatars"])


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    campaign_data: CampaignUpdate,
    current_user: User = Depends(get_current_brand_or_admin),
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .options(
            joinedload(Campaign.campaign_platforms).joinedload(CampaignPlatform.platform)
        )
        .filter(Campaign.id == campaign_id)
        .first()
    )
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    brand = db.query(Brand).filter(Brand.user_id == current_user.id).first()
    if not brand or campaign.brand_id != brand.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this campaign",
            )

    update_data = campaign_data.model_dump(exclude_unset=True)
    platform_ids = update_data.pop("platform_ids", None)

    for field, value in update_data.items():
        setattr(campaign, field, value)

    if platform_ids is not None:
        for cp in list(campaign.campaign_platforms):
            db.delete(cp)
        for platform_id in platform_ids:
            platform = db.query(Platform).filter(Platform.id == platform_id).first()
            if platform:
                db.add(CampaignPlatform(campaign_id=campaign.id, platform_id=platform.id))

    db.commit()
    db.refresh(campaign)
    campaign = (
        db.query(Campaign)
        .options(
            joinedload(Campaign.campaign_platforms).joinedload(CampaignPlatform.platform)
        )
        .filter(Campaign.id == campaign_id)
        .first()
    )
    part_data = _get_participant_data(db, [campaign_id])
    info = part_data.get(campaign_id, {"count": 0, "avatars": []})
    return _campaign_to_response(campaign, info["count"], info["avatars"])


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_brand_or_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a campaign. Brand users can delete only their own campaigns; admins can delete any campaign.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    if current_user.role == UserRole.BRAND:
        brand = db.query(Brand).filter(Brand.user_id == current_user.id).first()
        if not brand or campaign.brand_id != brand.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this campaign",
            )
    db.delete(campaign)
    db.commit()
    return None

