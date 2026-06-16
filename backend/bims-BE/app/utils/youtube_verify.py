"""
YouTube channel description verification using requests + BeautifulSoup.
No worker; used synchronously from the social API when user completes verification.
"""
import logging

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
TIMEOUT = 15


def _normalize_username(username: str) -> str:
    """Remove @ and strip."""
    return username.strip().replace("@", "")


def _channel_url(username: str) -> str:
    """Build YouTube channel URL. Supports @handle or channel ID."""
    raw = _normalize_username(username)
    if raw.startswith("UC") and len(raw) == 24 and raw.isalnum():
        return f"https://www.youtube.com/channel/{raw}"
    return f"https://www.youtube.com/@{raw}"


def verify_youtube_channel_description(username: str, verification_code: str) -> bool:
    """
    Fetch the YouTube channel page and check if verification_code appears
    in the page content (e.g. channel description). Uses requests + BeautifulSoup.
    Returns True if code is found, False otherwise.
    """
    url = _channel_url(username)
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    try:
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.warning("YouTube fetch failed for %s: %s", username, e)
        return False

    soup = BeautifulSoup(resp.text, "html.parser")

    # Prefer meta description (channel description is often here)
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        if verification_code in meta_desc["content"]:
            logger.info("YouTube verification code found in meta description for %s", username)
            return True

    # Fallback: search full page text (description may be in JSON or body)
    if verification_code in resp.text:
        logger.info("YouTube verification code found in page content for %s", username)
        return True

    logger.info("YouTube verification code not found for %s", username)
    return False
