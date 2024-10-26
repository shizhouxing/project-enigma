"""
Database CRUD Operations Helper Module
====================================

This module provides helper functions for database CRUD (Create, Read, Update, Delete) operations,
primarily used by route handlers. It serves as a layer of abstraction between the API routes
and direct database operations, promoting code reusability and maintainability.

Key Features:
- User management operations (create, retrieve, authenticate)
- Game-related operations (TBD)

Usage:
    from api import crud
    
    # In your route handler:
    user = await crud.get_user_by_username(session=db, username="example")

Dependencies:
- FastAPI for HTTP exception handling
- MongoDB for database operations
- Custom security utils for password hashing
"""
from typing import Optional
from datetime import datetime, UTC

from fastapi import HTTPException, status

from api.deps import Session
from api.core.security import get_password_hash, verify_password
from api.models import User, UserRegister



# = User ==============================================================

async def get_user_by_username(*, session: Session, username: str) -> Optional[User]:
    """Retrieve user from database by username.
    
    Args:
        session (Session): Database session
        username (str): Username to look up
        
    Returns:
        Optional[User]: User if found, None otherwise
    """

    user_data = await session.users.find_one({"username": username})

    if user_data:
        return User(**user_data)
    return None


async def create_user(*, session: Session, user_create: UserRegister) -> User:
    """Create new user in database.
    
    Args:
        session (Session): Database session
        user_create (UserRegister): User registration data
        
    Returns:
        User: Created user object
        
    Raises:
        HTTPException: If username already exists or if there's a database error
    """
    try:
        existing_user = await get_user_by_username(
            session=session, username=user_create.username
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )

        hashed_password = get_password_hash(user_create.password)
        user_data = user_create.dict()
        user_data["password"] = hashed_password
        user_data["created_at"] = datetime.now(UTC)
        user_data["last_login"] = None
        user_data["last_signout"] = None
        user_data["access_token"] = None

        result = await session.users.insert_one(user_data)

        user_data["id"] = str(result.inserted_id)
        return User(**user_data)

    except Exception as e:
        # Catch any unexpected errors
        # Log the error here if you have logging configured
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        ) from e

async def authenticate(*, session : Session, username : str, password : str) -> Optional[User]:
    """
    

    Args:
        session (Annotated[AsyncIOMotorDatabase, Depends(get_db)]): client session to the backend
        username (str): username of the client
        password (str): un hashed password of the client

    Returns:
        Optional[User]: if the user does not exist or the password does not match return None else User
    """
    user = await get_user_by_username(session=session, username=username)
    if user is None:
        return None
    if not verify_password(password, user.password):
        return None
    return user
# =====================================================================

# NOTE add more 

# = Game ==============================================================


# =====================================================================