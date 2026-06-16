"""
Instagram Verification Worker - consumes jobs from RabbitMQ and verifies Instagram bios.
Run from project root: python -m worker.main
No HTTP server; communicates only via RabbitMQ.
"""
import asyncio
import logging
import os
import signal
import sys

# Project root and path
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _project_root)

# Load .env from project root (same place as the FastAPI app)
from dotenv import load_dotenv
_env_path = os.path.join(_project_root, ".env")
load_dotenv(_env_path)
print(f"[WORKER] Stage: Loaded .env from {_env_path}")

from worker.rabbitmq_consumer import run_consumer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("worker.main")

_shutdown = False


def _handle_signal(sig, frame):
    global _shutdown
    print("[WORKER] Stage: Shutdown signal received")
    logger.info("Received signal %s, initiating graceful shutdown", sig)
    _shutdown = True


def main():
    print("[WORKER] Stage: Starting worker process")
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    if os.getenv("INSTAGRAM_VERIFICATION_ENABLED", "true").lower() in ("false", "0", "no"):
        print("[WORKER] Stage: Disabled by INSTAGRAM_VERIFICATION_ENABLED; exiting")
        logger.warning("INSTAGRAM_VERIFICATION_ENABLED is false; worker will not process jobs")
        return 0

    print("[WORKER] Stage: Entering RabbitMQ consumer loop (waiting for jobs)")
    try:
        asyncio.run(run_consumer(shutdown_ref=lambda: _shutdown))
    except KeyboardInterrupt:
        pass
    print("[WORKER] Stage: Worker stopped")
    logger.info("Worker stopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
