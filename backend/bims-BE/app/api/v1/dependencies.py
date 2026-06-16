"""
API Dependencies
"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token, decode_registration_token
from app.models.user import User, UserStatus, UserRole


def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Expect header in form "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise credentials_exception

    token = parts[1]

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


def get_current_brand_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to ensure user is a brand"""
    if current_user.role != UserRole.BRAND:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to brands"
        )
    return current_user


def get_registration_email(
    authorization: str = Header(..., alias="Authorization"),
) -> str:
    """Dependency for complete-registration: require Bearer <registration_token>, return email from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired registration token. Verify OTP again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise credentials_exception
    payload = decode_registration_token(parts[1])
    if not payload:
        raise credentials_exception
    email = payload.get("email") or payload.get("sub")
    if not email:
        raise credentials_exception
    return email


def get_current_brand_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to ensure user is a brand or admin"""
    if current_user.role not in (UserRole.BRAND, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to brands or admins",
        )
    return current_user

