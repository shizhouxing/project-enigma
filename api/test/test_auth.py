import pytest
import sys
import os
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

from fastapi import status
from fastapi.testclient import TestClient

# Add API directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from api.main import app
from api.core.config import settings
from api.deps import get_db
from api.models import UserRegister

client = TestClient(app)

def test_available_username():
    response = client.get("/available", params={ "username" : "0XNone"})
    assert response.status_code == 200
    assert response.json().get("data", False)

@pytest.mark.asyncio
async def test_signup_username():
    username = "NoneType"
    
    # Create UserRegister compatible data
    user_data = {
        "username": username,
        "password": "68656c6c6f776f726c6"
    }
    
    # First signup attempt
    response = client.post(
        "/signup",
        json=user_data  # Send as JSON to match FastAPI's automatic parsing
    )
    assert response.status_code == status.HTTP_200_OK, response.json()
    response_data = response.json()
    assert response_data.get("username") == username

    # Test duplicate username (capitalized)
    duplicate_data = {
        "username": username.capitalize(),
        "password": "68656c6c6f776f726c6"
    }
    
    response = client.post(
        "/signup",
        json=duplicate_data
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST, "Expected duplicate username to fail"
    assert "already exists" in response.json().get("detail", ""), "Expected proper error message"

    # Cleanup
    client_db = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
    db = client_db[settings.MONGODB_NAME]
    db.users.delete_one({"username": username})

@pytest.mark.asyncio
async def test_login_username():
    username = "User"
    password = "68656c6c6f776f726c64"
    
    # First register the user
    response = client.post(
        "/signup",
        json={
            "username": username,
            "password": password
        }
    )
    assert response.status_code == 200, response.json()
    assert response.json().get("username") == username
    
    # Login to get access token
    # Note: Using data parameter for form-urlencoded, not json
    response = client.post(
        "/login/access-token",
        data={
            "username": username,
            "password": password,
            "grant_type": "password"  # Often required for OAuth2 form login
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = response.json()
    assert response.status_code == 200, token
    assert token.get("token_type") is not None, "Token type should be present"
    assert token.get("access_token") is not None, "Access token should be present"
    
    # Verify the token
    response = client.get(
        "/verify-token",
        headers={
            "Authorization": f"Bearer {token['access_token']}"
        }
    )
    assert response.status_code == 200
    assert response.json().get("data", False)
    
    # Cleanup
    client_db = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
    db = client_db[settings.MONGODB_NAME]
    await db.users.delete_one({"username": username})




# @pytest.fixture(scope="module")
# def event_loop():
#     """Create an instance of the default event loop for the test session."""
#     import asyncio
#     loop = asyncio.get_event_loop_policy().new_event_loop()
#     yield loop
#     loop.close()

# @pytest.fixture(scope="module")
# async def mongo_client():
#     """Create a MongoDB client for testing."""
#     client = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
#     # Clear database before tests
#     await client.drop_database(settings.MONGODB_NAME)
#     yield client
#     # Cleanup after tests
#     await client.drop_database(settings.MONGODB_NAME)
#     client.close()

# @pytest.fixture(scope="module")
# async def http_client():
#     """Create an async HTTP client for testing."""
#     async with AsyncClient(app=app, base_url="http://0.0.0.0:8000") as client:
#         yield client

# @pytest.fixture(scope="function")
# async def clean_db(mongo_client):
#     """Get clean test database for each test."""
#     db = mongo_client[settings.MONGODB_NAME]
#     # Clear all collections before each test
#     collections = await db.list_collection_names()
#     for collection in collections:
#         await db[collection].delete_many({})
#     return db

# @pytest.mark.asyncio
# async def test_register_user_success(http_client, clean_db):
#     """Test successful user registration flow."""
#     user_data = {
#         "username": "testuser",
#         "password": "SecurePass123!"
#     }

#     # 1. Check username availability
#     availability_response = await http_client.get(
#         "/available",
#         params={"username": user_data["username"]}
#     )
#     assert availability_response.status_code == 200
#     assert availability_response.json()["data"] is True

#     # 2. Register new user
#     signup_response = await http_client.post(
#         "/signup",
#         json=user_data
#     )
#     assert signup_response.status_code == 200
#     response_data = signup_response.json()
#     assert response_data["username"] == user_data["username"]

#     # 3. Verify user in database
#     db_user = await clean_db.users.find_one({"username": user_data["username"]})
#     assert db_user is not None
#     assert db_user["username"] == user_data["username"]
#     assert db_user["password"] != user_data["password"]  # password should be hashed

# @pytest.mark.asyncio
# async def test_register_duplicate_user(http_client, clean_db):
#     """Test registration with duplicate username."""
#     user_data = {
#         "username": "duplicate_user",
#         "password": "SecurePass123!"
#     }

#     # Register first user
#     first_response = await http_client.post("/signup", json=user_data)
#     assert first_response.status_code == 200

# @pytest.mark.asyncio
# async def test_username_validation(http_client):
#     """Test username validation rules."""
#     invalid_usernames = [
#         "",  # Empty username
#         "a",  # Too short
#         "a" * 51,  # Too long
#         "user@name",  # Invalid characters
#         "admin"  # Reserved username
#     ]

#     for username in invalid_usernames:
#         response = await http_client.post(
#             "/signup",
#             json={
#                 "username": username,
#                 "password": "SecurePass123!"
#             }
#         )
#         assert response.status_code == 422, f"Username '{username}' should be invalid"

# @pytest.mark.asyncio
# async def test_password_validation(http_client):
#     """Test password validation rules."""
#     invalid_passwords = [
#         "",  # Empty password
#         "short",  # Too short
#         "no_uppercase",  # No uppercase
#         "NO_LOWERCASE",  # No lowercase
#         "NoSpecial1",  # No special characters
#         "NoNumbers!"  # No numbers
#     ]

#     for password in invalid_passwords:
#         response = await http_client.post(
#             "/signup",
#             json={
#                 "username": "testuser",
#                 "password": password
#             }
#         )
#         assert response.status_code == 422, f"Password '{password}' should be invalid"