"""
Notification Helper Functions
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.models.brand import Brand
from app.models.campaign import Campaign


def create_notification(
    db: Session,
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: Optional[Dict[str, Any]] = None,
) -> Notification:
    """
    Create a notification for a user.
    Returns the created notification.
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {},
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_admin_social_verification_pending(
    db: Session,
    verification_id: str,
    creator_username: str,
    platform: str,
    username: str,
) -> None:
    """Notify all admins about a pending social account verification"""
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            notification_type=NotificationType.SOCIAL_ACCOUNT_PENDING,
            title="New Social Account Verification Request",
            message=f"Creator {creator_username} wants to connect their {platform} account (@{username}). Please verify the code in their bio.",
            data={
                "verification_id": verification_id,
                "platform": platform,
                "username": username,
                "creator_username": creator_username,
            },
        )


def notify_creator_social_account_approved(
    db: Session,
    creator_id: str,
    platform: str,
    username: str,
) -> None:
    """Notify creator that their social account was approved"""
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.SOCIAL_ACCOUNT_APPROVED,
        title="Social Account Connected",
        message=f"Your {platform} account (@{username}) has been verified and connected successfully!",
        data={
            "platform": platform,
            "username": username,
        },
    )


def notify_creator_social_account_rejected(
    db: Session,
    creator_id: str,
    platform: str,
    username: str,
    reason: Optional[str] = None,
) -> None:
    """Notify creator that their social account verification was rejected"""
    message = f"Your {platform} account (@{username}) verification was rejected."
    if reason:
        message += f" Reason: {reason}"
    
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.SOCIAL_ACCOUNT_REJECTED,
        title="Social Account Verification Rejected",
        message=message,
        data={
            "platform": platform,
            "username": username,
            "reason": reason,
        },
    )


def notify_brand_campaign_participation_pending(
    db: Session,
    brand_id: str,
    campaign_id: str,
    campaign_title: str,
    creator_username: str,
    participation_id: str,
) -> None:
    """Notify brand: X creator is applying for Y campaign"""
    create_notification(
        db=db,
        user_id=brand_id,
        notification_type=NotificationType.CAMPAIGN_PARTICIPATION_PENDING,
        title="New Campaign Application",
        message=f"{creator_username} is applying for campaign \"{campaign_title}\".",
        data={
            "participation_id": participation_id,
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "creator_username": creator_username,
        },
    )


def notify_admin_campaign_participation_pending(
    db: Session,
    campaign_id: str,
    campaign_title: str,
    creator_username: str,
    participation_id: str,
) -> None:
    """Notify all admins: X creator is applying for Y campaign"""
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            notification_type=NotificationType.CAMPAIGN_PARTICIPATION_PENDING,
            title="New Campaign Application",
            message=f"{creator_username} is applying for campaign \"{campaign_title}\".",
            data={
                "participation_id": participation_id,
                "campaign_id": campaign_id,
                "campaign_title": campaign_title,
                "creator_username": creator_username,
            },
        )


def notify_creator_participation_approved(
    db: Session,
    creator_id: str,
    campaign_id: str,
    campaign_title: str,
) -> None:
    """Notify creator that their campaign participation was approved"""
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.CAMPAIGN_PARTICIPATION_APPROVED,
        title="Campaign Application Approved",
        message=f"Your application to campaign '{campaign_title}' has been approved! You can now submit content.",
        data={
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
        },
    )


def notify_creator_participation_rejected(
    db: Session,
    creator_id: str,
    campaign_id: str,
    campaign_title: str,
    reason: Optional[str] = None,
) -> None:
    """Notify creator that their campaign participation was rejected"""
    message = f"Your application to campaign '{campaign_title}' was rejected."
    if reason:
        message += f" Reason: {reason}"
    
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.CAMPAIGN_PARTICIPATION_REJECTED,
        title="Campaign Application Rejected",
        message=message,
        data={
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "reason": reason,
        },
    )


def notify_brand_content_submitted(
    db: Session,
    brand_id: str,
    campaign_id: str,
    campaign_title: str,
    creator_username: str,
    content_url: str,
) -> None:
    """Notify brand about new content submission"""
    create_notification(
        db=db,
        user_id=brand_id,
        notification_type=NotificationType.CONTENT_SUBMITTED,
        title="New Content Submission",
        message=f"Creator {creator_username} has submitted content for campaign '{campaign_title}'",
        data={
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "creator_username": creator_username,
            "content_url": content_url,
        },
    )


def notify_admin_content_submitted(
    db: Session,
    campaign_id: str,
    campaign_title: str,
    creator_username: str,
    content_url: str,
) -> None:
    """Notify all admins about new content submission"""
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            notification_type=NotificationType.CONTENT_SUBMITTED,
            title="New Content Submission",
            message=f"Creator {creator_username} has submitted content for campaign '{campaign_title}'",
            data={
                "campaign_id": campaign_id,
                "campaign_title": campaign_title,
                "creator_username": creator_username,
                "content_url": content_url,
            },
        )


def notify_creator_content_approved(
    db: Session,
    creator_id: str,
    campaign_id: str,
    campaign_title: str,
    content_url: str,
) -> None:
    """Notify creator that their content was approved"""
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.CONTENT_APPROVED,
        title="Content Approved",
        message=f"Your content submission for campaign '{campaign_title}' has been approved!",
        data={
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "content_url": content_url,
        },
    )


def notify_creator_content_rejected(
    db: Session,
    creator_id: str,
    campaign_id: str,
    campaign_title: str,
    content_url: str,
    reason: Optional[str] = None,
) -> None:
    """Notify creator that their content was rejected"""
    message = f"Your content submission for campaign '{campaign_title}' was rejected."
    if reason:
        message += f" Reason: {reason}"
    
    create_notification(
        db=db,
        user_id=creator_id,
        notification_type=NotificationType.CONTENT_REJECTED,
        title="Content Rejected",
        message=message,
        data={
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "content_url": content_url,
            "reason": reason,
        },
    )
