import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

from api.core.config import settings


async def db_ping_server():
    """
    simple ping to the mongodb server

    Raises:
        e: raise an exception if the connection between client
           and the backend is unsuccessful
    """
    uri = settings.MONGODB_DATABASE_URI
    client = AsyncIOMotorClient(uri)

    try: 
        result = await client.admin.command("ping")
        print(f"client pinged server to check if healthy result: {result}")
    except Exception as e:
        raise e

if __name__ == "__main__":
    # health check for testing if the server is alive
    asyncio.run(db_ping_server())