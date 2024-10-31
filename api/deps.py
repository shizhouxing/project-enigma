import jwt

from datetime import datetime, UTC

from bson.errors import InvalidId
from bson import ObjectId
from typing import Annotated, Any, Generator

from jwt.exceptions import InvalidTokenError

from pydantic import ValidationError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from api.core.config import settings
from api.core.security import ALGORITHM, verify_expired
from api.models import User

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/access-token")

def get_db() -> Generator[AsyncIOMotorDatabase, None, None]:
    """
    Context manager for database connections.
    """
    client = AsyncIOMotorClient(settings.MONGODB_DATABASE_URI)
    try:
        db = client[settings.MONGODB_NAME]
        yield db
    finally:
        client.close()

# Annotation type that used in context we desire the read/write access to the db
ClientSession = Annotated[AsyncIOMotorDatabase, Depends(get_db)]


async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        session: ClientSession
    ) -> Any:
    """
    Validate JWT token and return current user.
    
    Args:
        token (str): JWT token from authorization header
        session (ClientSession): Database session
        
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

        user_id = payload.get("sub", None)
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = ObjectId(user_id)

    except (InvalidTokenError, ValidationError, InvalidId):
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

    return user

async def clear_user_token(session: ClientSession, user_id: ObjectId) -> None:
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