"""
Instagram bio verification using Playwright.
Uses saved session (INSTAGRAM_SESSION_STATE_PATH) when available.
If session is missing or expired, can log in automatically with
INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD and save the new session for next time.
"""
import logging
import os
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

INSTAGRAM_BASE = "https://www.instagram.com"
INSTAGRAM_LOGIN = "https://www.instagram.com/accounts/login/"
SESSION_STATE_PATH = os.getenv("INSTAGRAM_SESSION_STATE_PATH", "")
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD", "")

# Timeouts
NAV_TIMEOUT = 20000
LOGIN_WAIT_TIMEOUT = 15000

# Instagram login form XPaths – load from .env only (no defaults in code).
# Set INSTAGRAM_XPATH_USERNAME, INSTAGRAM_XPATH_PASSWORD, INSTAGRAM_XPATH_LOGIN_BUTTON in .env.
# See .env.example for current values; update there if Instagram changes their DOM.
XPATH_USERNAME = os.getenv("INSTAGRAM_XPATH_USERNAME", "").strip()
XPATH_PASSWORD = os.getenv("INSTAGRAM_XPATH_PASSWORD", "").strip()
XPATH_LOGIN_BUTTON = os.getenv("INSTAGRAM_XPATH_LOGIN_BUTTON", "").strip()


def _mask_password(pwd: str) -> str:
    """Return masked string for logging (e.g. ab***xy or ****)."""
    if not pwd:
        return "(empty)"
    if len(pwd) <= 2:
        return "**"
    return pwd[:1] + "***" + pwd[-1] if len(pwd) > 4 else "****"


def _has_credentials() -> bool:
    return bool(INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD)


async def _is_login_page(page) -> bool:
    """True if current page is the login/join flow."""
    url = page.url
    return "/accounts/login" in url or "challenge" in url.lower() or "/accounts/onetap" in url


def _require_xpaths() -> None:
    """Raise if any login form XPath is not set (must be set in .env for auto-login)."""
    missing = []
    if not XPATH_USERNAME:
        missing.append("INSTAGRAM_XPATH_USERNAME")
    if not XPATH_PASSWORD:
        missing.append("INSTAGRAM_XPATH_PASSWORD")
    if not XPATH_LOGIN_BUTTON:
        missing.append("INSTAGRAM_XPATH_LOGIN_BUTTON")
    if missing:
        raise RuntimeError(
            f"Instagram login form XPaths not set. Set in .env: {', '.join(missing)}. See .env.example for values."
        )


async def _do_login(context, page) -> bool:
    """
    Perform username/password login on the current page.
    Returns True if login succeeded (we left the login page), False otherwise.
    Uses XPaths for username, password, and login button (from .env).
    """
    _require_xpaths()
    try:
        print("[WORKER] Stage: Instagram login page loaded; waiting for username field...")
        username_input = page.locator(f"xpath={XPATH_USERNAME}")
        await username_input.wait_for(state="visible", timeout=15000)
        print(f"[WORKER] Stage: Using username='{INSTAGRAM_USERNAME}' password='{_mask_password(INSTAGRAM_PASSWORD)}'")
        print("[WORKER] Stage: Filling username and password...")
        await username_input.fill(INSTAGRAM_USERNAME)
        password_input = page.locator(f"xpath={XPATH_PASSWORD}")
        await password_input.wait_for(state="visible", timeout=10000)
        await password_input.fill(INSTAGRAM_PASSWORD)
        print("[WORKER] Stage: Submitting login form...")
        login_btn = page.locator(f"xpath={XPATH_LOGIN_BUTTON}")
        await login_btn.click()
        print("[WORKER] Stage: Waiting for redirect after login (timeout %sms)..." % LOGIN_WAIT_TIMEOUT)
        try:
            await page.wait_for_url(
                lambda u: "/accounts/login" not in u and "challenge" not in u.lower(),
                timeout=LOGIN_WAIT_TIMEOUT,
            )
        except Exception as nav_err:
            print("[WORKER] Stage: FAILED AT 'Waiting for redirect' – timeout or URL did not change. Current URL: %s" % page.url)
            raise nav_err
        # Dismiss "Save Your Login Info?" if present
        try:
            not_now = page.get_by_role("button", name="Not Now")
            if await not_now.is_visible():
                await not_now.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass
        print("[WORKER] Stage: Login succeeded")
        return True
    except Exception as e:
        logger.warning("Instagram auto-login failed: %s", e)
        print(f"[WORKER] Stage: Login failed: {e}")
        print("[WORKER] Stage: (Failure is usually: wrong credentials, CAPTCHA, or timeout waiting for redirect after clicking Login.)")
        return False


async def _get_logged_in_context(browser, state_path: Optional[str]):
    """
    Return a browser context that is logged in: from saved state, or by logging in with credentials.
    If we log in with credentials and state_path is set, save the new session there.
    """
    if state_path and Path(state_path).exists():
        try:
            print("[WORKER] Stage: Loading saved Instagram session from file...")
            context = await browser.new_context(storage_state=state_path)
            page = await context.new_page()
            await page.goto(INSTAGRAM_BASE, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
            if await _is_login_page(page):
                await page.close()
                await context.close()
                print("[WORKER] Stage: Saved session expired or invalid; will try credential login")
                logger.info("Saved session expired or invalid; will try credential login")
            else:
                await page.close()
                print("[WORKER] Stage: Saved session valid; using it")
                return context
        except Exception as e:
            logger.warning("Failed to load saved session: %s", e)
            print(f"[WORKER] Stage: Failed to load saved session: {e}")

    if not _has_credentials():
        raise RuntimeError(
            "No valid Instagram session and INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD not set. "
            "Set env vars or run: python -m worker.save_instagram_session"
        )

    print("[WORKER] Stage: Creating new browser context for credential login...")
    context = await browser.new_context(
        viewport={"width": 1280, "height": 800},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
    )
    page = await context.new_page()
    try:
        print("[WORKER] Stage: Navigating to Instagram login URL...")
        await page.goto(INSTAGRAM_LOGIN, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
        ok = await _do_login(context, page)
        if not ok:
            await context.close()
            raise RuntimeError("Instagram login failed (check credentials or CAPTCHA)")
        if state_path:
            await context.storage_state(path=state_path)
            print(f"[WORKER] Stage: Saved new session to {state_path}")
            logger.info("Saved new Instagram session to %s", state_path)
    finally:
        await page.close()
    return context


async def check_bio_contains_code(username: str, verification_code: str) -> bool:
    """
    Load Instagram profile page and check if verification_code appears in the bio text.
    Uses saved session or auto-login with INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD if needed.
    Returns True if code is found, False otherwise.
    Raises on automation/network errors.
    """
    profile_url = f"{INSTAGRAM_BASE}/{username.strip().replace('@', '')}/"
    state_path = SESSION_STATE_PATH.strip() or None

    async with async_playwright() as p:
        print("[WORKER] Stage: Launching browser (headless)...")
        browser = await p.chromium.launch(headless=True)
        try:
            context = await _get_logged_in_context(browser, state_path)
            try:
                page = await context.new_page()
                try:
                    print(f"[WORKER] Stage: Opening profile page: {profile_url}")
                    await page.goto(profile_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    if await _is_login_page(page):
                        logger.warning("Got login page when loading profile; session may have expired")
                        print("[WORKER] Stage: Got login page instead of profile; session likely expired")
                        return False
                    content = await page.content()
                    found = verification_code in content
                    print(f"[WORKER] Stage: Bio check done; code present in page: {found}")
                    logger.info("Bio check username=%s code_present=%s", username, found)
                    return found
                finally:
                    await page.close()
            finally:
                await context.close()
        finally:
            await browser.close()
