import jwt

from datetime import datetime, UTC

from bson.errors import InvalidId
from bson import ObjectId
from typing import Annotated, Optional

from jwt.exceptions import InvalidTokenError

from pydantic import ValidationError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from api.core.config import settings
from api.core.security import ALGORITHM, verify_expired
from api.models import User

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/access-token")

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    def get_client(cls) -> AsyncIOMotorClient:
        if cls.client is None:
            cls.client = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
        return cls.client

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        if cls.db is None:
            cls.db = cls.get_client()[settings.MONGODB_NAME]
        return cls.db

async def get_database() -> AsyncIOMotorDatabase:
    return DatabaseManager.get_db()

Database = Annotated[AsyncIOMotorDatabase, Depends(get_database)]

async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        session: Database
    ) -> User:
    """
    Validate JWT token and return current user.
    
    Args:
        token (str): JWT token from authorization header
        session (Database): Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    user_id = None
    try:
        if verify_expired(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials due to expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        
        if (user := payload.get("sub", None)) is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = ObjectId(user)

    except (InvalidTokenError, ValidationError, InvalidId, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await session.users.find_one({"_id": user_id})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user["access_token"] != token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The token you enter is has not been updated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return User.model_validate(user)

async def clear_user_token(session: Database, user_id: ObjectId) -> None:
    """
    Clear a user's access token when it's no longer valid.
    
    Args:
        session: Database session
        user_id: User's ObjectId
    """
    try:
        await session.users.update_one(
            {"_id": user_id},
            {"$set": {"access_token": None, "last_signout" : datetime.now(UTC)}}
        )
    except Exception:
        # Log error but don't raise - this is a cleanup operation
        pass

# Annotation type that used in context we desire the user information
CurrentUser = Annotated[User, Depends(get_current_user)]