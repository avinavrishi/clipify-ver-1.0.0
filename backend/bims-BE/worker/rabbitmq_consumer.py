"""
RabbitMQ consumer for Instagram verification queue.
Processes messages sequentially (prefetch_count=1). Supports graceful shutdown and requeue on failure.
"""
import asyncio
import json
import logging
import os
from typing import Callable, Optional

import aio_pika
from aio_pika import IncomingMessage

from worker.verification_service import process_verification_job

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
QUEUE_NAME = os.getenv("INSTAGRAM_VERIFICATION_QUEUE", "instagram_verification")


async def run_consumer(shutdown_ref: Optional[Callable[[], bool]] = None) -> None:
    while True:
        if shutdown_ref and shutdown_ref():
            break
        try:
            print("[WORKER] Stage: Connecting to RabbitMQ...")
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            print("[WORKER] Stage: Connected to RabbitMQ")
        except Exception as e:
            logger.warning("RabbitMQ connection failed: %s. Retrying in 10s...", e)
            await asyncio.sleep(10)
            continue

        try:
            async with connection.channel() as channel:
                await channel.set_qos(prefetch_count=1)
                queue = await channel.declare_queue(QUEUE_NAME, durable=True)
                print(f"[WORKER] Stage: Listening on queue '{QUEUE_NAME}' (waiting for messages)...")
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        if shutdown_ref and shutdown_ref():
                            await message.nack(requeue=True)
                            return
                        print("[WORKER] Stage: Message received from queue, processing...")
                        await _process_message(message)
                        print("[WORKER] Stage: Message processed, waiting for next...")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.exception("Consumer error: %s", e)
        finally:
            await connection.close()
        await asyncio.sleep(5)


async def _process_message(message: IncomingMessage) -> None:
    try:
        body = json.loads(message.body.decode("utf-8"))
    except Exception as e:
        logger.error("Invalid message body: %s", e)
        await message.reject(requeue=False)
        return

    request_id = body.get("request_id")
    if not request_id:
        logger.error("Message missing request_id")
        await message.reject(requeue=False)
        return

    try:
        success = await process_verification_job(body)
        if success:
            print("[WORKER] Stage: Job completed successfully; acknowledging message")
            await message.ack()
        else:
            print("[WORKER] Stage: Job returned False; requeuing message")
            await message.nack(requeue=True)
    except Exception as e:
        logger.exception("Processing failed for request_id=%s: %s", request_id, e)
        print("[WORKER] Stage: Job failed with exception; requeuing message")
        await message.nack(requeue=True)
