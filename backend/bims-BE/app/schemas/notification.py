"""
Notification Schemas
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationMarkReadRequest(BaseModel):
    """Schema for marking notification as read"""
    read: bool = True


class UnreadCountResponse(BaseModel):
    """Schema for unread notification count"""
    unread_count: int


class NotificationCreateRequest(BaseModel):
    """Schema for creating notification (internal/admin use)"""
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
