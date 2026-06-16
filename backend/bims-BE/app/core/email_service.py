"""
Send emails via SMTP (Gmail). Used for OTP during registration.
All sensitive config (SMTP_USER, SMTP_APP_PASSWORD) from .env via settings.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(receiver_email: str, otp: str) -> bool:
    """
    Send OTP to the given email. Returns True if sent, False otherwise.
    Uses SMTP_USER and SMTP_APP_PASSWORD from settings (.env).
    """
    if not settings.SMTP_USER or not settings.SMTP_APP_PASSWORD:
        logger.warning("SMTP_USER or SMTP_APP_PASSWORD not set; cannot send OTP email")
        return False

    subject = "OTP Verification"
    body = f"Your OTP for registration is {otp}. It is valid for {settings.OTP_EXPIRE_MINUTES} minutes."

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_USER
    msg["To"] = receiver_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_USER, receiver_email, msg.as_string())
        server.quit()
        logger.info("OTP email sent to %s", receiver_email)
        return True
    except Exception as e:
        logger.exception("Failed to send OTP email: %s", e)
        return False
