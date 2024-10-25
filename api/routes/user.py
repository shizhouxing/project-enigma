"""
User Management Routes Module
============================

This module handles all user-related API endpoints including user registration,
retrieval, and logout functionality. It provides the core user management
functionality for the application.

Routes:
- POST /signup: User registration
- GET /{user_id}: Retrieve user details
- POST /logout: User logout

Dependencies:
- FastAPI for route handling
- MongoDB for user storage
- Pydantic for data validation
"""

from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pydantic import ValidationError

from fastapi import APIRouter, HTTPException, status

from api import crud
from api.deps import (
    Session, 
    CurrentUser,
    clear_user_token,
)
from api.models import (
    User, 
    UserRegister, 
    UserPublic,
    Message
)


router = APIRouter()


@router.post("/signup", response_model=UserPublic)
async def register_user(session : Session, user_in : UserRegister) -> UserPublic:
    """
    Create new user without the need to be logged in.
    """
    user = await crud.get_user_by_username(session=session, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    user = await crud.create_user(session=session, user_create=user_in)
    return UserPublic.from_user(user)

@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: str, session: Session
) -> UserPublic:
    """Get a specific user by id.

    Args:
        user_id (str): _description_
        session (Session): _description_

    Raises:
        HTTPException: _description_
        HTTPException: _description_
        HTTPException: _description_

    Returns:
        UserPublic: _description_
    """
    try:
        object_id = ObjectId(user_id)
        
        # Query the database
        user_dict = await session.users.find_one({"_id": object_id})
        if user_dict is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
            
        # Convert to User model first for validation
        user = User.model_validate(user_dict)
        
        # Convert to UserPublic for response
        return UserPublic.from_user(user)
        
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    

@router.post("/logout")
async def logout(
    current_user: CurrentUser,
    session: Session
) -> Message:
    """
    Logout endpoint that clears the user's access token.
    """
    try:

        user = User.model_validate(current_user)
        await clear_user_token(session, user.id)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    
    return Message(
        message="Successfully logged out",
        status="success"
    )