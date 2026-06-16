"""
Save Instagram session (cookies + local storage) for the verification worker.

Run from project root:
  python -m worker.save_instagram_session

A browser window will open. Log in to Instagram manually. When you see your
feed or profile, the script will save the session to a file and exit.
Set that path as INSTAGRAM_SESSION_STATE_PATH when running the worker.
"""
import asyncio
import os
import sys

# Project root on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.async_api import async_playwright

DEFAULT_STATE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "instagram_state.json",
)
INSTAGRAM_LOGIN = "https://www.instagram.com/accounts/login/"


async def main():
    state_path = os.getenv("INSTAGRAM_SESSION_STATE_PATH", DEFAULT_STATE_PATH)
    state_path = os.path.abspath(state_path)

    print("Opening browser. Log in to Instagram in the window that appears.")
    print("When you see your feed or profile, come back here and press Enter.")
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()
        await page.goto(INSTAGRAM_LOGIN, wait_until="domcontentloaded")

        # Wait for user to log in: press Enter in terminal when done
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: input("After you have logged in, press Enter here to save the session..."),
        )

        await context.storage_state(path=state_path)
        await browser.close()

    print()
    print("Session saved to:")
    print(f"  {state_path}")
    print()
    print("Use it when running the worker:")
    print(f'  set INSTAGRAM_SESSION_STATE_PATH={state_path}')
    print("  (or export on Linux/macOS)")


if __name__ == "__main__":
    asyncio.run(main())
