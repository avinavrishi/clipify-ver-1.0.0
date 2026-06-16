"""
Business logic: run Instagram bio check and update verification status in DB.
Idempotent updates by request_id.
"""
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.social import (
    SocialAccount,
    SocialAccountVerification,
    SocialVerificationStatus,
    SocialPlatform,
)
from worker.instagram_client import check_bio_contains_code

logger = logging.getLogger(__name__)


def _get_db() -> Session:
    return SessionLocal()


async def process_verification_job(payload: dict[str, Any]) -> bool:
    """
    Process a single verification job. Returns True if processed (ack), False to requeue.
    Updates DB by request_id: VERIFIED, FAILED, or ERROR.
    """
    request_id = payload.get("request_id")
    username = payload.get("username")
    verification_code = payload.get("verification_code")
    print(f"[WORKER] Stage: Verification service received job request_id={request_id} username={username}")

    if os.getenv("INSTAGRAM_VERIFICATION_ENABLED", "true").lower() in ("false", "0", "no"):
        print("[WORKER] Stage: Kill switch on; skipping job")
        logger.info("Kill switch enabled; skipping verification job")
        return True

    user_id = payload.get("user_id")
    if not all([request_id, user_id, username, verification_code]):
        logger.error("Missing required fields in payload for request_id=%s", request_id)
        return True  # ack to avoid poison message

    db = _get_db()
    try:
        print("[WORKER] Stage: Fetching verification record from DB...")
        verification = db.query(SocialAccountVerification).filter(
            SocialAccountVerification.id == request_id,
        ).first()
        if not verification:
            print(f"[WORKER] Stage: No verification found for request_id={request_id}; acking")
            logger.warning("Verification request_id=%s not found in DB", request_id)
            return True  # ack

        if verification.status != SocialVerificationStatus.PENDING:
            print(f"[WORKER] Stage: Verification already {verification.status}; skipping (idempotent)")
            logger.info("Verification request_id=%s already in status %s; skipping", request_id, verification.status)
            return True  # idempotent

        if verification.platform != SocialPlatform.INSTAGRAM:
            print(f"[WORKER] Stage: Not Instagram; marking ERROR")
            logger.error("Request %s is not Instagram", request_id)
            _update_status(db, request_id, SocialVerificationStatus.ERROR, "Not Instagram")
            return True

        print("[WORKER] Stage: Calling Instagram client to check bio...")
        try:
            found = await check_bio_contains_code(username, verification_code)
        except Exception as e:
            print(f"[WORKER] Stage: Instagram client raised: {e}; marking ERROR")
            logger.exception("Instagram automation failed for request_id=%s: %s", request_id, e)
            _update_status(db, request_id, SocialVerificationStatus.ERROR, str(e))
            return True

        if found:
            print(f"[WORKER] Stage: Code FOUND in bio; marking VERIFIED")
            _update_status(db, request_id, SocialVerificationStatus.VERIFIED, None)
            _create_social_account_if_verified(db, request_id)
            logger.info("Verification request_id=%s VERIFIED", request_id)
        else:
            print(f"[WORKER] Stage: Code NOT in bio; marking FAILED")
            _update_status(db, request_id, SocialVerificationStatus.FAILED, "Code not found in bio")
            logger.info("Verification request_id=%s FAILED (code not in bio)", request_id)

        return True
    except Exception as e:
        logger.exception("process_verification_job failed for request_id=%s: %s", request_id, e)
        return False  # requeue
    finally:
        db.close()


def _update_status(
    db: Session,
    request_id: str,
    status: SocialVerificationStatus,
    error_message: Optional[str],
) -> None:
    """Idempotent update by request_id."""
    row = db.query(SocialAccountVerification).filter(
        SocialAccountVerification.id == request_id,
    ).first()
    if not row:
        return
    row.status = status
    row.verified_at = datetime.now(timezone.utc) if status == SocialVerificationStatus.VERIFIED else None
    db.commit()
    logger.info("Updated request_id=%s to status=%s", request_id, status.value)


def _create_social_account_if_verified(db: Session, request_id: str) -> None:
    """When verification is VERIFIED, create SocialAccount and link it. Idempotent (skips if already exists)."""
    verification = db.query(SocialAccountVerification).filter(
        SocialAccountVerification.id == request_id,
    ).first()
    if not verification or verification.status != SocialVerificationStatus.VERIFIED:
        return
    if verification.social_account_id:
        return  # already linked
    existing = db.query(SocialAccount).filter(
        SocialAccount.creator_id == verification.creator_id,
        SocialAccount.platform == verification.platform,
        SocialAccount.username == verification.username,
    ).first()
    if existing:
        verification.social_account_id = existing.id
        db.commit()
        logger.info("SocialAccount already exists for creator+platform+username; linked verification")
        return
    account = SocialAccount(
        creator_id=verification.creator_id,
        platform=verification.platform,
        username=verification.username,
        platform_user_id=verification.username,
        access_token=None,
        refresh_token=None,
        token_expiry=None,
    )
    db.add(account)
    db.flush()
    verification.social_account_id = account.id
    db.commit()
    logger.info("Created SocialAccount id=%s for verification request_id=%s", account.id, request_id)
