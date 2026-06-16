import requests
from bs4 import BeautifulSoup
from typing import Optional
import time


# =====================================================
# Configuration
# =====================================================

REQUEST_TIMEOUT = 10
RATE_LIMIT_DELAY = 3

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# =====================================================
# Utility
# =====================================================

def fetch_html(url: str) -> Optional[str]:
    """Fetch HTML content from a public URL."""
    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=REQUEST_TIMEOUT,
        )
        if response.status_code != 200:
            return None
        return response.text
    except requests.RequestException:
        return None


# =====================================================
# Instagram Scraper
# =====================================================

def extract_instagram_bio(html: str) -> Optional[str]:
    """Extract Instagram bio from og:description meta tag."""
    soup = BeautifulSoup(html, "html.parser")
    meta = soup.find("meta", property="og:description")
    if not meta:
        return None
    return meta.get("content", "").strip()


def get_instagram_bio(username: str) -> Optional[str]:
    """
    Fetch public Instagram bio using mobile site to avoid login redirect.
    """
    url = f"https://m.instagram.com/{username}/"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/16.0 Mobile/15E148 Safari/604.1"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")
        meta = soup.find("meta", property="og:description")

        if not meta:
            return None

        return meta.get("content", "").strip()

    except requests.RequestException:
        return None


def verify_instagram_code(username: str, code: str) -> bool:
    """Verify code presence in Instagram bio."""
    bio = get_instagram_bio(username)
    if not bio:
        return False
    return code in bio


# =====================================================
# YouTube Scraper
# =====================================================

def extract_youtube_description(html: str) -> Optional[str]:
    """
    Extract YouTube channel description.
    Usually present in og:description meta tag.
    """
    soup = BeautifulSoup(html, "html.parser")
    meta = soup.find("meta", property="og:description")
    if not meta:
        return None
    return meta.get("content", "").strip()


def get_youtube_channel_description(channel_identifier: str) -> Optional[str]:
    """
    channel_identifier can be:
    - Channel ID (UCxxxx)
    - Custom handle (@channelname)
    """
    if channel_identifier.startswith("@"):
        url = f"https://www.youtube.com/{channel_identifier}"
    else:
        url = f"https://www.youtube.com/channel/{channel_identifier}"

    html = fetch_html(url)
    time.sleep(RATE_LIMIT_DELAY)
    if not html:
        return None
    return extract_youtube_description(html)


def verify_youtube_code(channel_identifier: str, code: str) -> bool:
    """Verify code presence in YouTube channel description."""
    description = get_youtube_channel_description(channel_identifier)
    if not description:
        return False
    return code in description


# =====================================================
# Menu Interface
# =====================================================

def show_menu():
    print("\n=== Social Account Scraper ===")
    print("1. Scrape Instagram bio")
    print("2. Verify Instagram bio code")
    print("3. Scrape YouTube channel description")
    print("4. Verify YouTube channel code")
    print("5. Exit")


def main():
    while True:
        show_menu()
        choice = input("\nSelect an option (1-5): ").strip()

        if choice == "1":
            username = input("Enter Instagram username (without @): ").strip()
            bio = get_instagram_bio(username)
            if bio:
                print("\n📄 Instagram Bio:")
                print(bio)
            else:
                print("\n❌ Could not fetch Instagram bio")

        elif choice == "2":
            username = input("Enter Instagram username (without @): ").strip()
            code = input("Enter verification code: ").strip()
            if verify_instagram_code(username, code):
                print("\n✅ Instagram verification successful")
            else:
                print("\n❌ Verification code not found")

        elif choice == "3":
            channel = input(
                "Enter YouTube channel ID (UC...) or handle (@name): "
            ).strip()
            description = get_youtube_channel_description(channel)
            if description:
                print("\n📄 YouTube Channel Description:")
                print(description)
            else:
                print("\n❌ Could not fetch YouTube channel description")

        elif choice == "4":
            channel = input(
                "Enter YouTube channel ID (UC...) or handle (@name): "
            ).strip()
            code = input("Enter verification code: ").strip()
            if verify_youtube_code(channel, code):
                print("\n✅ YouTube verification successful")
            else:
                print("\n❌ Verification code not found")

        elif choice == "5":
            print("\n👋 Exiting")
            break

        else:
            print("\n⚠️ Invalid option, try again")


if __name__ == "__main__":
    main()
