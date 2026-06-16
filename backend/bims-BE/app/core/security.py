"""
Security utilities for authentication and authorization
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def create_refresh_token() -> str:
    """
    Create a high-entropy refresh token (store only its hash in DB).
    """
    # ~43 chars urlsafe, plenty of entropy
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """
    Hash refresh token using a server-side secret salt.
    """
    material = f"{settings.SECRET_KEY}:{token}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def hash_otp(otp: str) -> str:
    """Hash OTP for storage (do not store plain OTP)."""
    material = f"{settings.SECRET_KEY}:otp:{otp}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def verify_otp(plain_otp: str, otp_hash: str) -> bool:
    """Verify user-provided OTP against stored hash."""
    return hash_otp(plain_otp) == otp_hash


# Registration token (short-lived JWT after OTP verify; used to complete signup)
REGISTRATION_TOKEN_TYPE = "registration"


def create_registration_token(email: str) -> str:
    """Create a short-lived JWT for completing registration (email in payload)."""
    expire = datetime.utcnow() + timedelta(minutes=settings.REGISTRATION_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "email": email,
        "type": REGISTRATION_TOKEN_TYPE,
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_registration_token(token: str) -> Optional[dict]:
    """Decode and verify registration token; return payload with email or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != REGISTRATION_TOKEN_TYPE:
            return None
        return payload
    except JWTError:
        return None

