"""
Seed a sample brand (and its user) and campaigns into the database.
Each campaign is linked to one or more platforms (Instagram, YouTube, TikTok).
Uses Unsplash image URLs for campaign logos.

Run from project root: python scripts/campaign_seeds.py
"""

from datetime import date, timedelta

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.campaign import (
    Campaign,
    CampaignStatus,
    CampaignContentType,
    CAMPAIGN_TYPE_FACE_CREATOR,
    CAMPAIGN_TYPE_FACELESS_CREATOR,
)
from app.models.brand import Brand
from app.models.platform import Platform, CampaignPlatform
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile, Creator, CreatorVerificationStatus


# Seed brand user + brand (created if not present) – values come from .env via settings
SEED_BRAND_EMAIL = settings.SEED_BRAND_EMAIL or "brand@example.com"
SEED_BRAND_PASSWORD = settings.SEED_BRAND_PASSWORD or "Brand@123"  # dev default; override in .env
SEED_COMPANY_NAME = settings.SEED_BRAND_COMPANY_NAME or "Demo Brand Co"
SEED_INDUSTRY = settings.SEED_BRAND_INDUSTRY or "Technology"
SEED_WEBSITE = settings.SEED_BRAND_WEBSITE or "https://demobrand.example.com"

# Seed creator user (User + Profile + Creator) – values come from .env via settings
SEED_CREATOR_EMAIL = settings.SEED_CREATOR_EMAIL or "creator@example.com"
SEED_CREATOR_PASSWORD = settings.SEED_CREATOR_PASSWORD or "Creator@123"  # dev default; override in .env
SEED_CREATOR_DISPLAY_NAME = settings.SEED_CREATOR_DISPLAY_NAME or "Demo Creator"


def get_or_create_seed_brand(db):
    """
    Return a brand to use for seeding. Creates a BRAND user and Brand if none exist.
    """
    # Prefer existing brand with our seed email
    user = db.query(User).filter(User.email == SEED_BRAND_EMAIL).first()
    if user:
        brand = db.query(Brand).filter(Brand.user_id == user.id).first()
        if brand:
            return brand
        # User exists but no brand (shouldn't happen)
        brand = Brand(
            user_id=user.id,
            company_name=SEED_COMPANY_NAME,
            industry=SEED_INDUSTRY,
            website=SEED_WEBSITE,
        )
        db.add(brand)
        db.commit()
        db.refresh(brand)
        return brand

    # Create brand user + brand
    user = User(
        email=SEED_BRAND_EMAIL,
        password_hash=get_password_hash(SEED_BRAND_PASSWORD),
        role=UserRole.BRAND,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.flush()

    brand = Brand(
        user_id=user.id,
        company_name=SEED_COMPANY_NAME,
        industry=SEED_INDUSTRY,
        website=SEED_WEBSITE,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    print(f"✅ Created brand user and brand: {SEED_COMPANY_NAME} ({SEED_BRAND_EMAIL})")
    return brand


def get_or_create_seed_creator(db):
    """
    Return a creator user for seeding. Creates User + Profile + Creator if not present.
    """
    user = db.query(User).filter(User.email == SEED_CREATOR_EMAIL).first()
    if user:
        creator = db.query(Creator).filter(Creator.user_id == user.id).first()
        if creator:
            return creator
        # User exists but no Profile/Creator
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            profile = Profile(user_id=user.id, display_name=SEED_CREATOR_DISPLAY_NAME)
            db.add(profile)
            db.flush()
        creator = Creator(
            user_id=user.id,
            total_earnings=0.0,
            wallet_balance=0.0,
            verification_status=CreatorVerificationStatus.PENDING,
        )
        db.add(creator)
        db.commit()
        db.refresh(creator)
        print(f"✅ Created Profile + Creator for existing user: {SEED_CREATOR_EMAIL}")
        return creator

    user = User(
        email=SEED_CREATOR_EMAIL,
        password_hash=get_password_hash(SEED_CREATOR_PASSWORD),
        role=UserRole.CREATOR,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id, display_name=SEED_CREATOR_DISPLAY_NAME)
    creator = Creator(
        user_id=user.id,
        total_earnings=0.0,
        wallet_balance=0.0,
        verification_status=CreatorVerificationStatus.PENDING,
    )
    db.add(profile)
    db.add(creator)
    db.commit()
    db.refresh(creator)
    print(f"✅ Created creator user: {SEED_CREATOR_DISPLAY_NAME} ({SEED_CREATOR_EMAIL})")
    return creator


# Campaign definitions: list of (campaign_kwargs, platform_names).
# platform_names: ["Instagram"], ["YouTube"], ["Instagram", "YouTube"], etc.
# campaign_type: CAMPAIGN_TYPE_FACE_CREATOR (0) or CAMPAIGN_TYPE_FACELESS_CREATOR (1).
# Logo URLs are Unsplash images (various themes).
CAMPAIGN_DEFINITIONS = [
    (
        {
            "title": "BetStrike [GENERAL - VIDEO]",
            "category": "GENERAL",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Create English short-form videos promoting BetStrike.",
            "total_budget": 2000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 30.0,
            "max_submissions_per_account": 50,
            "max_earnings_per_creator": 1500.0,
            "max_earnings_per_post": 90.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://plus.unsplash.com/premium_photo-1670005278847-3398f72aecdc?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "guidelines_link": "https://notion.so/example-guidelines",
            "discord_link": "https://discord.gg/example",
        },
        ["Instagram", "YouTube"],
    ),
    (
        {
            "title": "CryptoPlay Reels Campaign",
            "category": "CRYPTO",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Instagram Reels & TikTok videos for CryptoPlay app.",
            "total_budget": 5000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 45.0,
            "max_submissions_per_account": 20,
            "max_earnings_per_creator": 2000.0,
            "max_earnings_per_post": 120.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "TikTok"],
    ),
    (
        {
            "title": "ShopEase Product Image Campaign",
            "category": "E-COMMERCE",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.IMAGE,
            "description": "Post product images showcasing ShopEase deals.",
            "total_budget": 1000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 20.0,
            "max_submissions_per_account": 10,
            "max_earnings_per_creator": 500.0,
            "max_earnings_per_post": 50.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram"],
    ),
    (
        {
            "title": "FitLife Fitness Reels",
            "category": "HEALTH",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Short fitness and workout reels for FitLife app.",
            "total_budget": 3500.0,
            "used_budget": 0.0,
            "rate_per_million_views": 40.0,
            "max_submissions_per_account": 30,
            "max_earnings_per_creator": 1200.0,
            "max_earnings_per_post": 80.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "YouTube", "TikTok"],
    ),
    (
        {
            "title": "TechGear Unboxing Videos",
            "category": "TECHNOLOGY",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "YouTube unboxing and review videos for TechGear gadgets.",
            "total_budget": 8000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 55.0,
            "max_submissions_per_account": 15,
            "max_earnings_per_creator": 2500.0,
            "max_earnings_per_post": 150.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["YouTube"],
    ),
    (
        {
            "title": "StyleHub Fashion Lookbook",
            "category": "FASHION",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.IMAGE,
            "description": "Instagram and TikTok fashion lookbook images and short clips.",
            "total_budget": 4500.0,
            "used_budget": 0.0,
            "rate_per_million_views": 35.0,
            "max_submissions_per_account": 25,
            "max_earnings_per_creator": 900.0,
            "max_earnings_per_post": 70.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "TikTok"],
    ),
    (
        {
            "title": "FreshBite Food Content",
            "category": "FOOD",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Recipe and food review videos for FreshBite delivery brand.",
            "total_budget": 2800.0,
            "used_budget": 0.0,
            "rate_per_million_views": 32.0,
            "max_submissions_per_account": 40,
            "max_earnings_per_creator": 800.0,
            "max_earnings_per_post": 65.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=699&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "YouTube"],
    ),
    (
        {
            "title": "Wanderlust Travel Vlogs",
            "category": "TRAVEL",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Travel vlogs and destination videos for Wanderlust tours.",
            "total_budget": 6000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 50.0,
            "max_submissions_per_account": 18,
            "max_earnings_per_creator": 1800.0,
            "max_earnings_per_post": 100.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["YouTube", "TikTok"],
    ),
    (
        {
            "title": "SportMax Energy Campaign",
            "category": "SPORTS",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "High-energy sports and athletic content for SportMax brand.",
            "total_budget": 4200.0,
            "used_budget": 0.0,
            "rate_per_million_views": 42.0,
            "max_submissions_per_account": 22,
            "max_earnings_per_creator": 1100.0,
            "max_earnings_per_post": 85.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "YouTube"],
    ),
    (
        {
            "title": "GlowUp Beauty Tutorials",
            "category": "BEAUTY",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Makeup and skincare tutorials for GlowUp beauty products.",
            "total_budget": 3800.0,
            "used_budget": 0.0,
            "rate_per_million_views": 38.0,
            "max_submissions_per_account": 28,
            "max_earnings_per_creator": 950.0,
            "max_earnings_per_post": 72.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "TikTok"],
    ),
    (
        {
            "title": "EduLearn Course Promo",
            "category": "EDUCATION",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Educational explainer videos promoting EduLearn online courses.",
            "total_budget": 5500.0,
            "used_budget": 0.0,
            "rate_per_million_views": 48.0,
            "max_submissions_per_account": 20,
            "max_earnings_per_creator": 1400.0,
            "max_earnings_per_post": 95.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["YouTube"],
    ),
    (
        {
            "title": "StreamZone Entertainment",
            "category": "ENTERTAINMENT",
            "campaign_type": CAMPAIGN_TYPE_FACELESS_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Fun and entertaining short-form content for StreamZone platform.",
            "total_budget": 7200.0,
            "used_budget": 0.0,
            "rate_per_million_views": 52.0,
            "max_submissions_per_account": 24,
            "max_earnings_per_creator": 2000.0,
            "max_earnings_per_post": 110.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["Instagram", "YouTube", "TikTok"],
    ),
    (
        {
            "title": "FinanceWise Tips & Insights",
            "category": "FINANCE",
            "campaign_type": CAMPAIGN_TYPE_FACE_CREATOR,
            "content_type": CampaignContentType.VIDEO,
            "description": "Finance tips and investment insights for FinanceWise app.",
            "total_budget": 4000.0,
            "used_budget": 0.0,
            "rate_per_million_views": 44.0,
            "max_submissions_per_account": 16,
            "max_earnings_per_creator": 1300.0,
            "max_earnings_per_post": 88.0,
            "start_date": None,
            "end_date": None,
            "status": CampaignStatus.ACTIVE,
            "logo_drive_link": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
            "guidelines_link": None,
            "discord_link": None,
        },
        ["YouTube", "Instagram"],
    ),
]


def seed_campaigns():
    db = SessionLocal()
    try:
        # --------------------------------------------------
        # Get or create the seed brand and seed creator
        # --------------------------------------------------
        brand = get_or_create_seed_brand(db)
        get_or_create_seed_creator(db)

        # --------------------------------------------------
        # Ensure platforms exist (Instagram, YouTube, TikTok)
        # --------------------------------------------------
        platform_names = ["Instagram", "YouTube", "TikTok"]
        platforms_by_name = {}
        for name in platform_names:
            platform = db.query(Platform).filter(Platform.name == name).first()
            if not platform:
                platform = Platform(name=name)
                db.add(platform)
                db.flush()
            platforms_by_name[name] = platform

        # --------------------------------------------------
        # Check if campaigns already exist for this brand
        # --------------------------------------------------
        existing = db.query(Campaign).filter(Campaign.brand_id == brand.id).count()
        if existing > 0:
            print("[INFO] Campaigns already exist for this brand. Skipping campaign seeding.")
            return

        today = date.today()

        # --------------------------------------------------
        # Create each campaign and link platforms
        # --------------------------------------------------
        for kwargs, platform_names_list in CAMPAIGN_DEFINITIONS:
            data = dict(kwargs)
            data["start_date"] = data.pop("start_date") or today
            data["end_date"] = data.pop("end_date") or (today + timedelta(days=30))
            campaign = Campaign(brand_id=brand.id, **data)
            db.add(campaign)
            db.flush()
            for pname in platform_names_list:
                platform = platforms_by_name.get(pname)
                if platform:
                    db.add(CampaignPlatform(campaign_id=campaign.id, platform_id=platform.id))
        db.commit()

        print(f"[OK] Seeded {len(CAMPAIGN_DEFINITIONS)} campaigns with platforms under brand '{brand.company_name}'.")

    except Exception as e:
        db.rollback()
        print("[ERROR] Error seeding campaigns:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_campaigns()
