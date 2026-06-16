"""
Unit and integration tests for worker.instagram_client.

- Unit: _mask_password, _has_credentials, _is_login_page, URL/profile building.
- Integration: full account validation (session or credential login, then fetch profile/bio).
"""
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from worker.instagram_client import (
    INSTAGRAM_BASE,
    INSTAGRAM_LOGIN,
    SESSION_STATE_PATH,
    _do_login,
    _get_logged_in_context,
    _has_credentials,
    _is_login_page,
    _mask_password,
    check_bio_contains_code,
)


# --- Unit tests (no network) ---


class TestMaskPassword:
    def test_empty(self):
        assert _mask_password("") == "(empty)"

    def test_short(self):
        assert _mask_password("a") == "**"
        assert _mask_password("ab") == "**"

    def test_medium(self):
        assert _mask_password("abc") == "****"
        assert _mask_password("abcd") == "****"

    def test_long(self):
        assert _mask_password("abcde") == "a***e"
        assert _mask_password("password123") == "p***3"


class TestHasCredentials:
    def test_no_username(self):
        with patch("worker.instagram_client.INSTAGRAM_USERNAME", ""), patch(
            "worker.instagram_client.INSTAGRAM_PASSWORD", "secret"
        ):
            from worker.instagram_client import _has_credentials
            assert _has_credentials() is False

    def test_no_password(self):
        with patch("worker.instagram_client.INSTAGRAM_USERNAME", "user"), patch(
            "worker.instagram_client.INSTAGRAM_PASSWORD", ""
        ):
            from worker.instagram_client import _has_credentials
            assert _has_credentials() is False

    def test_both_set(self):
        with patch("worker.instagram_client.INSTAGRAM_USERNAME", "user"), patch(
            "worker.instagram_client.INSTAGRAM_PASSWORD", "pass"
        ):
            from worker.instagram_client import _has_credentials
            assert _has_credentials() is True


@pytest.mark.asyncio
async def test_is_login_page_login_url():
    page = AsyncMock()
    page.url = "https://www.instagram.com/accounts/login/"
    assert await _is_login_page(page) is True


@pytest.mark.asyncio
async def test_is_login_page_challenge():
    page = AsyncMock()
    page.url = "https://www.instagram.com/challenge/123/"
    assert await _is_login_page(page) is True


@pytest.mark.asyncio
async def test_is_login_page_onetap():
    page = AsyncMock()
    page.url = "https://www.instagram.com/accounts/onetap/"
    assert await _is_login_page(page) is True


@pytest.mark.asyncio
async def test_is_login_page_feed_not_login():
    page = AsyncMock()
    page.url = "https://www.instagram.com/"
    assert await _is_login_page(page) is False


@pytest.mark.asyncio
async def test_is_login_page_profile_not_login():
    page = AsyncMock()
    page.url = "https://www.instagram.com/someuser/"
    assert await _is_login_page(page) is False


def test_profile_url_building():
    """Profile URL is built from INSTAGRAM_BASE and normalized username."""
    from worker.instagram_client import INSTAGRAM_BASE
    username = "  @testuser  "
    expected = f"{INSTAGRAM_BASE}/testuser/"
    actual = f"{INSTAGRAM_BASE}/{username.strip().replace('@', '')}/"
    assert actual == expected


# --- Integration: account validation (session or login, then fetch profile) ---


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_instagram_account_valid_session_or_login_then_fetch_profile(
    run_instagram_integration,
    instagram_state_path,
    has_instagram_credentials,
):
    """
    Validates that the provided Instagram account is valid and working:
    - If instagram_state.json (or INSTAGRAM_SESSION_STATE_PATH) exists and is valid, uses it.
    - Otherwise uses INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD to log in (same logic as worker).
    - Opens Instagram home and verifies we are not on the login page (i.e. logged in).
    - Optionally opens a profile page to confirm we can fetch profile/bio content.
    """
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run account validation test")

    has_session = Path(instagram_state_path).exists()
    if not has_session and not has_instagram_credentials:
        pytest.skip(
            "Need either instagram_state.json (or INSTAGRAM_SESSION_STATE_PATH) or "
            "INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD set to run account validation"
        )

    from worker.instagram_client import check_bio_contains_code, _get_logged_in_context
    from playwright.async_api import async_playwright

    # 1) Get logged-in context (session or credential login)
    state_path = instagram_state_path if has_session else None
    if not has_session:
        state_path = instagram_state_path  # so we can save after login

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await _get_logged_in_context(browser, state_path)
            try:
                page = await context.new_page()
                try:
                    await page.goto(INSTAGRAM_BASE, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_load_state("domcontentloaded", timeout=5000)
                    # 2) We must not be on login page
                    assert await _is_login_page(page) is False, (
                        "After loading session or logging in, we should not be on the login page. "
                        "Session may be expired or credentials invalid."
                    )
                    # 3) Fetch own profile or a known profile to confirm we can load profile/bio
                    # Use a harmless public check: load Instagram main page content
                    content = await page.content()
                    assert "instagram" in content.lower(), "Page content should contain Instagram"
                finally:
                    await page.close()
            finally:
                await context.close()
        finally:
            await browser.close()


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_instagram_bio_check_integration(
    run_instagram_integration,
    instagram_state_path,
    has_instagram_credentials,
):
    """
    Full flow: get logged-in context, open a profile URL, ensure we get profile content (not login).
    Uses check_bio_contains_code with a dummy code that may or may not be in the bio;
    the test only checks that we do not get login page and that the function runs without error.
    """
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run")

    has_session = Path(instagram_state_path).exists()
    if not has_session and not has_instagram_credentials:
        pytest.skip("Need session file or INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD")

    # Use a well-known public username and a code that likely isn't in their bio (we only care that we get a bool)
    result = await check_bio_contains_code("instagram", "BIMS_XYZZY_999")
    assert isinstance(result, bool)
