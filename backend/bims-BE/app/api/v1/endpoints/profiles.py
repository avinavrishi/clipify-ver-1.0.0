"""
Profile endpoints (public identity for any user).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.models.profile import Profile, Creator, CreatorType
from app.models.brand import Brand
from app.models.user import User
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    SetUsernameRequest,
    SetCreatorTypeRequest,
    CreatorTypeResponse,
    UpdateCreatorFaceDetailsRequest,
)

router = APIRouter()


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the profile for the current authenticated user.
    """

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user",
        )

    if current_user.role.value == "CREATOR":
        creator_data = db.query(Creator).filter(Creator.user_id == current_user.id).first()
        if not creator_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Creator profile not found for this user",
            )
        profile.wallet_balance = creator_data.wallet_balance
        profile.total_earnings = creator_data.total_earnings
        profile.verification_status = creator_data.verification_status
        profile.email = current_user.email
        profile.creator_type = creator_data.creator_type.value if creator_data.creator_type else None
        profile.creator_face_details = {
            "name": creator_data.name,
            "category": creator_data.category,
            "reel_price": creator_data.reel_price,
            "story_price": creator_data.story_price,
            "reel_story_price": creator_data.reel_story_price,
            "state": creator_data.state,
            "city": creator_data.city,
            "language": creator_data.language,
        } if creator_data.creator_type == CreatorType.FACE else None
        profile.username = current_user.username
        return profile
    elif current_user.role.value == "BRAND":
        profile = db.query(Brand).filter(Brand.user_id == current_user.id).first()

    return profile


@router.patch("/me/username", status_code=status.HTTP_200_OK)
async def set_my_username(
    data: SetUsernameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set creator username (one-time). Only for creators; only allowed when username is not yet set.
    After setting, the creator can access the dashboard.
    """
    if current_user.role.value != "CREATOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creators can set a username",
        )
    if current_user.username is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already set",
        )
    username = data.username.strip()
    if not username or len(username) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username must be at least 2 characters")
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    current_user.username = username
    # Update profile display_name so it matches the chosen username
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        profile.display_name = username
    db.commit()
    db.refresh(current_user)
    return {"username": current_user.username, "message": "Username set"}


@router.get("/me/creator-type", response_model=CreatorTypeResponse)
async def get_my_creator_type(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get creator type and face creator details (for creators)."""
    if current_user.role.value != "CREATOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creators only")
    creator = db.query(Creator).filter(Creator.user_id == current_user.id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator profile not found")
    return CreatorTypeResponse(
        creator_type=creator.creator_type.value if creator.creator_type else None,
        name=creator.name,
        category=creator.category,
        reel_price=creator.reel_price,
        story_price=creator.story_price,
        reel_story_price=creator.reel_story_price,
        state=creator.state,
        city=creator.city,
        language=creator.language,
    )


@router.patch("/me/creator-type", response_model=CreatorTypeResponse, status_code=status.HTTP_200_OK)
async def set_my_creator_type(
    data: SetCreatorTypeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set creator type (FACE or FACELESS) one-time, after username is set. If FACE, provide the face creator form fields.
    Called once during onboarding (after set username). Once set, use PATCH /me/creator-face-details to update face details.
    """
    if current_user.role.value != "CREATOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creators only")
    creator = db.query(Creator).filter(Creator.user_id == current_user.id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator profile not found")
    if creator.creator_type is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Creator type is already set. You can update your face creator details from your profile.",
        )
    try:
        creator.creator_type = CreatorType(data.creator_type)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="creator_type must be FACE or FACELESS")
    if creator.creator_type == CreatorType.FACE:
        creator.name = data.name
        creator.category = data.category
        creator.reel_price = data.reel_price
        creator.story_price = data.story_price
        creator.reel_story_price = data.reel_story_price
        creator.state = data.state
        creator.city = data.city
        creator.language = data.language
    else:
        creator.name = None
        creator.category = None
        creator.reel_price = None
        creator.story_price = None
        creator.reel_story_price = None
        creator.state = None
        creator.city = None
        creator.language = None
    db.commit()
    db.refresh(creator)
    return CreatorTypeResponse(
        creator_type=creator.creator_type.value,
        name=creator.name,
        category=creator.category,
        reel_price=creator.reel_price,
        story_price=creator.story_price,
        reel_story_price=creator.reel_story_price,
        state=creator.state,
        city=creator.city,
        language=creator.language,
    )


@router.patch("/me/creator-face-details", response_model=CreatorTypeResponse, status_code=status.HTTP_200_OK)
async def update_my_creator_face_details(
    data: UpdateCreatorFaceDetailsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update face creator details (name, category, prices, location, language). Only for creators with creator_type FACE.
    Used on the profile page to edit these details.
    """
    if current_user.role.value != "CREATOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creators only")
    creator = db.query(Creator).filter(Creator.user_id == current_user.id).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator profile not found")
    if creator.creator_type != CreatorType.FACE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face creator details can only be updated for face creators. Your creator type is FACELESS.",
        )
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(creator, field, value)
    db.commit()
    db.refresh(creator)
    return CreatorTypeResponse(
        creator_type=creator.creator_type.value,
        name=creator.name,
        category=creator.category,
        reel_price=creator.reel_price,
        story_price=creator.story_price,
        reel_story_price=creator.reel_story_price,
        state=creator.state,
        city=creator.city,
        language=creator.language,
    )


@router.post("/me", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a profile for the current authenticated user (if none exists).
    """
    existing = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this user",
        )

    profile = Profile(
        user_id=current_user.id,
        display_name=data.display_name,
        bio=data.bio,
        profile_picture_url=data.profile_picture_url,
        country=data.country,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the profile for the current authenticated user.
    """

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user",
        )

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile

