"""
RabbitMQ connection and publishing for Instagram verification jobs.
FastAPI acts as producer only; worker consumes in a separate process.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import aio_pika
from aio_pika import Channel, Connection, Message, DeliveryMode

from app.core.config import settings

logger = logging.getLogger(__name__)

_connection: Optional[Connection] = None
_channel: Optional[Channel] = None


async def get_rabbitmq_connection() -> Connection:
    """Get or create the shared RabbitMQ connection."""
    global _connection
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        logger.info("RabbitMQ connection established")
    return _connection


async def get_channel() -> Channel:
    """Get or create the shared channel (for publishing)."""
    global _channel
    if _channel is None or _channel.is_closed:
        conn = await get_rabbitmq_connection()
        _channel = await conn.channel()
        await _channel.set_qos(prefetch_count=1)
        logger.info("RabbitMQ channel ready")
    return _channel


async def init_rabbitmq() -> None:
    """Initialize RabbitMQ connection and declare queue (startup)."""
    if not getattr(settings, "INSTAGRAM_VERIFICATION_ENABLED", True):
        logger.info("Instagram verification disabled; skipping RabbitMQ init")
        return
    try:
        channel = await get_channel()
        await channel.declare_queue(
            settings.INSTAGRAM_VERIFICATION_QUEUE,
            durable=True,
        )
        logger.info("Instagram verification queue declared: %s", settings.INSTAGRAM_VERIFICATION_QUEUE)
    except Exception as e:
        logger.warning("RabbitMQ init failed (worker may not be running): %s", e)


async def close_rabbitmq() -> None:
    """Close RabbitMQ connection (shutdown)."""
    global _channel, _connection
    try:
        if _channel and not _channel.is_closed:
            await _channel.close()
        if _connection and not _connection.is_closed:
            await _connection.close()
    except Exception as e:
        logger.warning("RabbitMQ close error: %s", e)
    finally:
        _channel = None
        _connection = None
        logger.info("RabbitMQ connection closed")


def _build_verification_payload(
    request_id: str,
    user_id: str,
    username: str,
    verification_code: str,
) -> dict[str, Any]:
    return {
        "request_id": request_id,
        "user_id": user_id,
        "platform": "instagram",
        "username": username,
        "verification_code": verification_code,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def publish_verification_job(
    request_id: str,
    user_id: str,
    instagram_username: str,
    verification_code: str,
) -> bool:
    """
    Publish an Instagram verification job to RabbitMQ.
    Returns True if published, False if disabled or publish failed.
    """

    if not getattr(settings, "INSTAGRAM_VERIFICATION_ENABLED", True):
        logger.info("Instagram verification disabled; not publishing job %s", request_id)
        return False
    try:
        channel = await get_channel()
        payload = _build_verification_payload(
            request_id=request_id,
            user_id=user_id,
            username=instagram_username,
            verification_code=verification_code,
        )
        body = json.dumps(payload).encode("utf-8")
        await channel.default_exchange.publish(
            Message(
                body=body,
                delivery_mode=DeliveryMode.PERSISTENT,
                content_type="application/json",
            ),
            routing_key=settings.INSTAGRAM_VERIFICATION_QUEUE,
        )
        logger.info("Published Instagram verification job request_id=%s username=%s", request_id, instagram_username)
        print(f"Published Instagram verification job request_id={request_id} username={instagram_username}")
        return True
    except Exception as e:
        logger.exception("Failed to publish verification job request_id=%s: %s", request_id, e)
        print(f"Failed to publish verification job request_id={request_id}: {e}")
        return False
