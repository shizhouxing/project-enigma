import asyncio
import logging
from typing import Coroutine, Any
from motor.motor_asyncio import AsyncIOMotorClient
import time

from api.core.config import settings
from api.utils import logger

async def db_ping_server() -> Coroutine[Any, Any, None]:
    """
    simple ping to the mongodb server

    Raises:
        e: raise an exception if the connection between client
           and the backend is unsuccessful
    """
    uri = settings.MONGODB_DATABASE_URI
    client = AsyncIOMotorClient(uri)

    try: 
        start = time.time()
        result = await client.admin.command("ping")
        end = time.time()
        logger.info(f"client pinged server to check if healthy result: {bool(result.get("ok"))}")
        logger.info(f"ping elapse time: {round((end - start), 3)}s")
    except Exception as e:
        logger.error(f"Something has occurred: {e}")
        raise e

if __name__ == "__main__":
    # health check for testing if the server is alive
    asyncio.run(db_ping_server())