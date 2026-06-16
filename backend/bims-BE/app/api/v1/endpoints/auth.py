"""
Authentication Endpoints (JWT + sessions + refresh token rotation)
Includes OTP-based registration and Google OAuth login.
"""
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from pydantic import BaseModel
from authlib.integrations.starlette_client import OAuth

from app.api.v1.dependencies import get_current_user, get_registration_email
from app.core.config import settings
from app.core.database import get_db
from app.core.email_service import send_otp_email
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_registration_token,
    get_password_hash,
    hash_otp,
    hash_refresh_token,
    verify_otp,
    verify_password,
)
from app.models.auth_models import AuthSession, LoginAudit, LoginStatus, OtpVerification, RefreshToken
from app.models.profile import Profile, Creator, CreatorVerificationStatus
from app.models.user import User, UserRole, UserStatus
from app.models.brand import Brand
from app.schemas.user import (
    TokenPair,
    UserCreate,
    BrandUserCreate,
    UserLogin,
    UserResponse,
    RequestOtpRequest,
    VerifyOtpRequest,
    VerifyOtpResponse,
    ResendOtpRequest,
    CompleteRegistrationRequest,
)

router = APIRouter()

OTP_EXPIRE_MINUTES = settings.OTP_EXPIRE_MINUTES
REGISTRATION_TOKEN_EXPIRE_MINUTES = settings.REGISTRATION_TOKEN_EXPIRE_MINUTES

# Google OAuth (authlib) – client_id and client_secret from .env
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _generate_otp() -> str:
    """Generate 6-digit numeric OTP."""
    return "".join(secrets.choice("0123456789") for _ in range(6))


@router.post("/register/request-otp", status_code=status.HTTP_200_OK)
async def request_otp(body: RequestOtpRequest, db: Session = Depends(get_db)):
    """
    Step 1 of registration: send a 6-digit OTP to the given email.
    If email is already registered, returns 400. Otherwise creates/overwrites OTP (valid 10 min) and sends email.
    """
    result = db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    otp_hash = hash_otp(otp)

    existing = db.execute(select(OtpVerification).where(OtpVerification.email == body.email)).scalar_one_or_none()
    if existing:
        existing.otp_hash = otp_hash
        existing.expires_at = expires_at
        existing.used_at = None
    else:
        db.add(OtpVerification(email=body.email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()

    if not send_otp_email(body.email, otp):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Check server SMTP configuration.",
        )
    return {"message": "OTP sent to your email", "expires_in_minutes": OTP_EXPIRE_MINUTES}


@router.post("/register/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Step 2: Verify the OTP. If valid, returns a short-lived registration_token.
    Use that token in Authorization header when calling POST /auth/register/complete.
    If OTP is expired, returns 400 with detail 'OTP expired' and code so frontend can offer resend.
    """
    row = db.execute(select(OtpVerification).where(OtpVerification.email == body.email)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP found for this email. Request one first.")
    if row.used_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP already used. Request a new one.")
    if datetime.utcnow() > row.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired. Please request a new one.",
        )
    if not verify_otp(body.otp.strip(), row.otp_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP.")

    token = create_registration_token(body.email)
    return VerifyOtpResponse(
        registration_token=token,
        expires_in=REGISTRATION_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/register/resend-otp", status_code=status.HTTP_200_OK)
async def resend_otp(body: ResendOtpRequest, db: Session = Depends(get_db)):
    """
    Resend OTP to the same email. Invalidates the previous OTP; new one valid for 10 minutes.
    """
    result = db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    otp_hash = hash_otp(otp)

    row = db.execute(select(OtpVerification).where(OtpVerification.email == body.email)).scalar_one_or_none()
    if row:
        row.otp_hash = otp_hash
        row.expires_at = expires_at
        row.used_at = None
    else:
        db.add(OtpVerification(email=body.email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()

    if not send_otp_email(body.email, otp):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP email. Check server SMTP configuration.",
        )
    return {"message": "New OTP sent to your email", "expires_in_minutes": OTP_EXPIRE_MINUTES}


@router.post(
    "/register/complete",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def complete_registration(
    body: CompleteRegistrationRequest,
    email: str = Depends(get_registration_email),
    db: Session = Depends(get_db),
):
    """
    Step 3: Complete creator registration with password only. Username is set by user on first dashboard visit.
    Requires Authorization: Bearer <registration_token> from verify-otp.
    Creates user, profile, and creator; marks OTP as used.
    """
    result = db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    row = db.execute(select(OtpVerification).where(OtpVerification.email == email)).scalar_one_or_none()
    if not row or row.used_at or datetime.utcnow() > row.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or already used. Please verify OTP again.",
        )

    password_hash = get_password_hash(body.password)
    new_user = User(
        email=email,
        password_hash=password_hash,
        role=UserRole.CREATOR,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    db.flush()

    display_name = (email.split("@")[0] or "User").strip()[:255]
    profile = Profile(user_id=new_user.id, display_name=display_name)
    creator = Creator(
        user_id=new_user.id,
        total_earnings=0.0,
        wallet_balance=0.0,
        verification_status=CreatorVerificationStatus.PENDING,
    )
    db.add(profile)
    db.add(creator)

    row.used_at = datetime.utcnow()
    db.commit()
    db.refresh(new_user)
    return new_user


# --- Google OAuth ---


@router.get("/login/google")
async def login_google(request: Request):
    """
    Redirects the user to Google sign-in. After approval, Google redirects back to
    GET /auth/google/callback. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
        )
    # url_for returns full URL in some setups; use as-is if absolute, else prepend base
    path = request.url_for("auth_google_callback")
    redirect_uri = str(path)
    if not redirect_uri.startswith("http"):
        redirect_uri = str(request.base_url).rstrip("/") + redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="auth_google_callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Google OAuth callback. Finds or creates user by email (password_hash=None for OAuth users),
    creates session and tokens, then redirects to frontend with tokens in URL fragment.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth not configured.")

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth error: {e}") from e

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No user info from Google.")

    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google.")

    result = db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        display_name = (email.split("@")[0] or "User").strip()[:255]
        user = User(
            email=email,
            password_hash=None,
            role=UserRole.CREATOR,
            status=UserStatus.ACTIVE,
        )
        db.add(user)
        db.flush()
        profile = Profile(user_id=user.id, display_name=display_name)
        creator = Creator(
            user_id=user.id,
            total_earnings=0.0,
            wallet_balance=0.0,
            verification_status=CreatorVerificationStatus.PENDING,
        )
        db.add(profile)
        db.add(creator)

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is not active.")

    session_expires_at = datetime.utcnow() + timedelta(days=settings.SESSION_EXPIRE_DAYS)
    session = AuthSession(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        is_active=True,
        last_used_at=datetime.utcnow(),
        expires_at=session_expires_at,
    )
    db.add(session)
    db.flush()

    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value,
            "session_id": session.id,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token_raw = create_refresh_token()
    refresh_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh = RefreshToken(
        session_id=session.id,
        token_hash=hash_refresh_token(refresh_token_raw),
        revoked=False,
        expires_at=refresh_expires_at,
    )
    db.add(refresh)
    db.commit()

    # Redirect to frontend with tokens in URL fragment: .../auth/callback#access_token=...&refresh_token=...&token_type=bearer
    frontend_base = (settings.OAUTH_FRONTEND_CALLBACK_URL or "").strip() or "http://localhost:3000/auth/callback"
    base_url = frontend_base.split("#")[0].split("?")[0].rstrip("/")
    fragment = urlencode({
        "access_token": access_token,
        "refresh_token": refresh_token_raw,
        "token_type": "bearer",
    })
    redirect_url = f"{base_url}#{fragment}"
    print(redirect_url)
    print(base_url)
    print(fragment)
    print("================================================")
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new creator (legacy: single-step, no OTP). Prefer /register/request-otp → verify-otp → complete."""
    result = db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    password_hash = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=password_hash,
        role=UserRole.CREATOR,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    db.flush()

    # Placeholder display_name until creator sets username on first login
    display_name = user_data.email.split("@")[0] if user_data.email else "Creator"
    profile = Profile(
        user_id=new_user.id,
        display_name=display_name,
    )
    creator = Creator(
        user_id=new_user.id,
        total_earnings=0.0,
        wallet_balance=0.0,
        verification_status=CreatorVerificationStatus.PENDING,
    )
    db.add(profile)
    db.add(creator)

    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/register-brand",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_brand(user_data: BrandUserCreate, db: Session = Depends(get_db)):
    """Register a new brand user and associated Brand profile."""
    result = db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    password_hash = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=password_hash,
        role=UserRole.BRAND,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    db.flush()

    brand = Brand(
        user_id=new_user.id,
        company_name=user_data.company_name,
        industry=user_data.industry,
        website=user_data.website,
    )
    db.add(brand)

    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenPair)
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login by email/password and receive a JWT access token. Works for creators, brands, and admins."""
    result = db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user:
        audit = LoginAudit(user_id=None, status=LoginStatus.FAILED)
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.password_hash is None:
        audit = LoginAudit(user_id=user.id, status=LoginStatus.FAILED)
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google sign-in. Please use Login with Google.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(credentials.password, user.password_hash):
        audit = LoginAudit(user_id=user.id, status=LoginStatus.FAILED)
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    device_info = request.headers.get("x-device-info")

    session_expires_at = datetime.utcnow() + timedelta(days=settings.SESSION_EXPIRE_DAYS)
    session = AuthSession(
        user_id=user.id,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=True,
        last_used_at=datetime.utcnow(),
        expires_at=session_expires_at,
    )
    db.add(session)
    db.flush()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value,
            "session_id": session.id,
        },
        expires_delta=access_token_expires,
    )

    refresh_token_raw = create_refresh_token()
    refresh_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh = RefreshToken(
        session_id=session.id,
        token_hash=hash_refresh_token(refresh_token_raw),
        revoked=False,
        expires_at=refresh_expires_at,
    )
    db.add(refresh)

    audit = LoginAudit(
        user_id=user.id,
        status=LoginStatus.SUCCESS,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_raw,
        "session_id": session.id,
    }


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(data: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    """Refresh token rotation: validate refresh token, revoke old, issue new pair."""
    token_hash = hash_refresh_token(data.refresh_token)
    result = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    rt = result.scalar_one_or_none()
    if not rt or rt.revoked or (rt.expires_at and rt.expires_at < datetime.utcnow()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = db.execute(select(AuthSession).where(AuthSession.id == rt.session_id))
    session = result.scalar_one_or_none()
    if not session or not session.is_active or (session.expires_at and session.expires_at < datetime.utcnow()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    result = db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    rt.revoked = True
    session.last_used_at = datetime.utcnow()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value,
            "session_id": session.id,
        },
        expires_delta=access_token_expires,
    )

    new_refresh_raw = create_refresh_token()
    refresh_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_rt = RefreshToken(
        session_id=session.id,
        token_hash=hash_refresh_token(new_refresh_raw),
        revoked=False,
        expires_at=refresh_expires_at,
    )
    db.add(new_rt)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": new_refresh_raw,
        "session_id": session.id,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Logout the current session (multi-device safe). Requires Authorization: Bearer <access_token>."""
    from app.core.security import decode_access_token

    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")

    payload = decode_access_token(parts[1])
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token missing session_id")

    result = db.execute(
        select(AuthSession).where(
            AuthSession.id == session_id,
            AuthSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session:
        session.is_active = False
        db.execute(
            update(RefreshToken).where(RefreshToken.session_id == session.id).values(revoked=True)
        )
        db.commit()
    return None


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
