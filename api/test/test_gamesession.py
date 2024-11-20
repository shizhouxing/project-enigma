import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import status
from fastapi.testclient import TestClient
from bson import ObjectId
import sys
import os
from httpx import AsyncClient

# Add API directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from api.main import app
from api.core.config import settings

# Use the TestClient for synchronous FastAPI calls
client = TestClient(app)

@pytest.fixture(scope="function")
async def test_db():
    """Fixture for MongoDB connection."""
    client_db = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
    db = client_db[settings.MONGODB_NAME]
    try:
        await db.list_collection_names()  # Verify connection
        return db  # Return the database object
    except ConnectionError:
        pytest.fail(f"Failed to connect to MongoDB at {settings.MONGODB_DATABASE_URI}")


@pytest.mark.asyncio
async def test_mongo_connection(test_db):
    assert test_db is not None

@pytest.mark.asyncio
async def test_create_bad_words_game_session(test_db):
    """Test the process of creating a game session."""
    username = "LVivona"
    password = "5475726e696e67436f6d706c65746541474921"
    game_id = str(ObjectId("672308fb2c5a75e6d63e2d08"))

    async with AsyncClient(app=app, base_url="http://testserver") as async_client:
        login_response = await async_client.post(
            "/login",
            data={"username": username, "password": password, "grant_type": "password"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert login_response.status_code == status.HTTP_200_OK, login_response.json()
        token = login_response.json().get("access_token")
        assert token, "Access token should be present"
        print(token)

        response = await async_client.post(
            f"/create-chat?game_id={game_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK, response.json()
        session_data = response.json()
        session_id = session_data["session_id"]

        db = await test_db
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        assert session, "Game session should exist in the database"

        # Interact with the /completion route
        prompt = "Hello, how do I win this game?"

        response = await async_client.post(
            f"/{session_id}/completion?prompt={prompt}",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Ensure the request was successful
        assert response.status_code == status.HTTP_200_OK, response.json()

        # Handle the streaming response
        async for line in response.aiter_lines():
            print("Streamed Response:", line)
