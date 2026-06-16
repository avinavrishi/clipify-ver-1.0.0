"""
Tests that Instagram login form XPaths still resolve on the live login page.

Instagram can change their DOM; when that happens, the default XPaths in
worker/instagram_client.py (or overrides in .env) may break. These tests
load the real login page and assert that:
- Username field XPath finds a visible element
- Password field XPath finds a visible element
- Login button XPath finds a visible element

Run with: pytest tests/test_instagram_xpaths.py -v
To run against live Instagram: RUN_INSTAGRAM_INTEGRATION=1 pytest tests/test_instagram_xpaths.py -v
"""
import os
import sys

import pytest
from playwright.async_api import async_playwright

# Ensure project root is on path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Import after path is set so we get env-loaded XPaths
from worker.instagram_client import (
    INSTAGRAM_LOGIN,
    NAV_TIMEOUT,
    XPATH_USERNAME,
    XPATH_PASSWORD,
    XPATH_LOGIN_BUTTON,
)


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_xpath_username_field_found_on_login_page(run_instagram_integration):
    """Configured username XPath must locate a visible element on Instagram login page."""
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run XPath tests against live Instagram")

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
                locator = page.locator(f"xpath={XPATH_USERNAME}")
                await locator.wait_for(state="visible", timeout=15000)
                assert await locator.count() >= 1, "Username XPath should match at least one element"
            finally:
                await context.close()
        finally:
            await browser.close()


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_xpath_password_field_found_on_login_page(run_instagram_integration):
    """Configured password XPath must locate a visible element on Instagram login page."""
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run XPath tests against live Instagram")

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
                locator = page.locator(f"xpath={XPATH_PASSWORD}")
                await locator.wait_for(state="visible", timeout=15000)
                assert await locator.count() >= 1, "Password XPath should match at least one element"
            finally:
                await context.close()
        finally:
            await browser.close()


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_xpath_login_button_found_on_login_page(run_instagram_integration):
    """Configured login button XPath must locate a visible element on Instagram login page."""
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run XPath tests against live Instagram")

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
                locator = page.locator(f"xpath={XPATH_LOGIN_BUTTON}")
                await locator.wait_for(state="visible", timeout=15000)
                assert await locator.count() >= 1, "Login button XPath should match at least one element"
            finally:
                await context.close()
        finally:
            await browser.close()


@pytest.mark.instagram_integration
@pytest.mark.asyncio
async def test_all_xpaths_found_on_login_page(run_instagram_integration):
    """Single test that all three XPaths (username, password, login button) are found on login page."""
    if not run_instagram_integration:
        pytest.skip("Set RUN_INSTAGRAM_INTEGRATION=1 to run XPath tests against live Instagram")

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

                for name, xpath in [
                    ("username", XPATH_USERNAME),
                    ("password", XPATH_PASSWORD),
                    ("login_button", XPATH_LOGIN_BUTTON),
                ]:
                    locator = page.locator(f"xpath={xpath}")
                    try:
                        await locator.wait_for(state="visible", timeout=15000)
                        assert await locator.count() >= 1, f"XPath for {name} should match at least one element"
                    except Exception as e:
                        raise AssertionError(f"XPath for {name} failed (Instagram DOM may have changed): {e}") from e
            finally:
                await context.close()
        finally:
            await browser.close()
