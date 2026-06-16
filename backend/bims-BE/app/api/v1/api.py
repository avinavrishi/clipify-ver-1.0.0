"""
API v1 Router - includes UML-relevant routers
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, campaigns, admin, profiles, participations, social, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(participations.router, prefix="/creator", tags=["Creator - Participations & Submissions"])
api_router.include_router(social.router, prefix="/creator", tags=["Creator - Social Accounts"])
api_router.include_router(notifications.router, prefix="", tags=["Notifications"])

