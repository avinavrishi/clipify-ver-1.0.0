"""
Pytest configuration and shared fixtures for bims-BE tests.

Loads .env from project root so INSTAGRAM_* and other vars are available.
Integration tests (XPath checks, account validation) are skipped when
RUN_INSTAGRAM_INTEGRATION=1 is not set, to avoid hitting Instagram from CI.
"""
import os
import sys

import pytest

# Project root on path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Load .env if present (worker and app use it)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_ROOT, ".env"))
except Exception:
    pass


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "instagram_integration: mark test as Instagram integration (requires network, credentials/session)",
    )


@pytest.fixture(scope="session")
def run_instagram_integration():
    """Whether to run Instagram integration tests (live login page / account check)."""
    return os.getenv("RUN_INSTAGRAM_INTEGRATION", "").strip().lower() in ("1", "true", "yes")


@pytest.fixture(scope="session")
def has_instagram_credentials():
    """True if INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD are set."""
    from worker import instagram_client
    return bool(
        os.getenv("INSTAGRAM_USERNAME", "").strip()
        and os.getenv("INSTAGRAM_PASSWORD", "").strip()
    )


@pytest.fixture(scope="session")
def instagram_state_path():
    """Resolved INSTAGRAM_SESSION_STATE_PATH or default worker path."""
    path = os.getenv("INSTAGRAM_SESSION_STATE_PATH", "").strip()
    if path:
        return os.path.abspath(path)
    return os.path.join(_ROOT, "worker", "instagram_state.json")
