"""
Validate Instagram account and login flow (session or credentials).

Run from project root:
  python -m worker.validate_instagram_account

This script:
1. Loads INSTAGRAM_XPATH_* from .env and checks they are set and valid on the login page (when using credentials).
2. Gets a logged-in context: loads instagram_state.json if present and valid, otherwise logs in with
   INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD using the same XPath-based login logic as the worker.
3. Verifies we are logged in by opening Instagram and ensuring we are not on the login page.

Requires:
- Either worker/instagram_state.json (or INSTAGRAM_SESSION_STATE_PATH) with a valid session, or
- INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env

For auto-login, set in .env: INSTAGRAM_XPATH_USERNAME, INSTAGRAM_XPATH_PASSWORD, INSTAGRAM_XPATH_LOGIN_BUTTON (see .env.example).
"""
import asyncio
import os
import sys

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _PROJECT_ROOT)

# Load .env first so all env vars (including XPaths) are available
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_PROJECT_ROOT, ".env"))
except Exception:
    pass


def _get_xpaths_from_env():
    """Load Instagram login form XPaths from .env. Returns (username, password, login_button) or (None, None, None) if any missing."""
    xpath_user = os.getenv("INSTAGRAM_XPATH_USERNAME", "").strip()
    xpath_pass = os.getenv("INSTAGRAM_XPATH_PASSWORD", "").strip()
    xpath_btn = os.getenv("INSTAGRAM_XPATH_LOGIN_BUTTON", "").strip()
    if xpath_user and xpath_pass and xpath_btn:
        return (xpath_user, xpath_pass, xpath_btn)
    return (None, None, None)


def _validate_xpaths_set(xpath_username, xpath_password, xpath_login_button):
    """Return True if all three XPaths are non-empty; else print missing and return False."""
    missing = []
    if not (xpath_username or "").strip():
        missing.append("INSTAGRAM_XPATH_USERNAME")
    if not (xpath_password or "").strip():
        missing.append("INSTAGRAM_XPATH_PASSWORD")
    if not (xpath_login_button or "").strip():
        missing.append("INSTAGRAM_XPATH_LOGIN_BUTTON")
    if missing:
        print("XPath config missing in .env. Set these (see .env.example):")
        for m in missing:
            print(f"  - {m}")
        return False
    return True


# Import after .env is loaded so instagram_client reads from env
from worker.instagram_client import (
    INSTAGRAM_BASE,
    INSTAGRAM_LOGIN,
    NAV_TIMEOUT,
    _get_logged_in_context,
    _is_login_page,
)
from playwright.async_api import async_playwright


def _state_path():
    path = os.getenv("INSTAGRAM_SESSION_STATE_PATH", "").strip()
    if path:
        return os.path.abspath(path)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "instagram_state.json")


async def check_xpaths_valid(xpath_username, xpath_password, xpath_login_button):
    """
    Verify that the XPaths from .env find visible elements on the Instagram login page.
    Returns True if all three are valid, False otherwise.
    """
    print("Loading Instagram login page and validating XPaths from .env...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = await context.new_page()
            try:
                await page.goto(INSTAGRAM_LOGIN, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
                await page.wait_for_load_state("domcontentloaded", timeout=10000)
                all_ok = True
                for name, xpath in [
                    ("Username field", xpath_username),
                    ("Password field", xpath_password),
                    ("Login button", xpath_login_button),
                ]:
                    locator = page.locator(f"xpath={xpath}")
                    try:
                        await locator.wait_for(state="visible", timeout=15000)
                        print(f"  [OK] {name} (XPath valid)")
                    except Exception as e:
                        print(f"  [FAIL] {name} not found: {e}")
                        all_ok = False
            finally:
                await context.close()
        finally:
            await browser.close()
    return all_ok


async def main():
    state_path = _state_path()
    has_session = os.path.isfile(state_path)
    has_creds = bool(os.getenv("INSTAGRAM_USERNAME", "").strip() and os.getenv("INSTAGRAM_PASSWORD", "").strip())

    # Load XPaths from .env (used for validation and by instagram_client when logging in)
    xpath_user, xpath_pass, xpath_btn = _get_xpaths_from_env()

    print("Instagram account validation")
    print("-----------------------------")
    if has_session:
        print(f"Session file: {state_path}")
    else:
        print("No session file found; will use INSTAGRAM_USERNAME + INSTAGRAM_PASSWORD if set.")

    if not has_session and has_creds:
        # Require XPaths in .env for credential login
        if not _validate_xpaths_set(xpath_user, xpath_pass, xpath_btn):
            sys.exit(1)
        # Check that XPaths actually find elements on the live login page
        if not await check_xpaths_valid(xpath_user, xpath_pass, xpath_btn):
            print()
            print("XPath validation failed. Update INSTAGRAM_XPATH_* in .env if Instagram changed their login form.")
            sys.exit(1)
        print()

    if not has_session and not has_creds:
        print("Error: Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env, or provide a session file at:")
        print(f"  {state_path}")
        print("To create a session file, run: python -m worker.save_instagram_session")
        sys.exit(1)

    print("Getting logged-in context (session or credential login)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await _get_logged_in_context(browser, state_path if has_session else state_path)
            try:
                page = await context.new_page()
                try:
                    await page.goto(INSTAGRAM_BASE, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
                    await page.wait_for_load_state("domcontentloaded", timeout=5000)
                    if await _is_login_page(page):
                        print("FAIL: Still on login page after loading session or logging in.")
                        print("      Session may be expired or credentials invalid.")
                        sys.exit(1)
                    content = await page.content()
                    if "instagram" not in content.lower():
                        print("FAIL: Page content unexpected.")
                        sys.exit(1)
                    print("SUCCESS: Logged in; Instagram page loaded.")
                    print("Account validation passed. You can use this setup to fetch profile/bio.")
                finally:
                    await page.close()
            finally:
                await context.close()
        finally:
            await browser.close()
    print()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
