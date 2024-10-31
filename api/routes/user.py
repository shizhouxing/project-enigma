"""
User Management Routes Module
============================

This module handles all user-related API endpoints including user registration,
retrieval, and logout functionality. It provides the core user management
functionality for the application.

Routes:
- POST /signup: User registration
- POST /logout: User logout
- GET /{user_id}: Retrieve user details
- GET /available: check if username is available

Dependencies:
- FastAPI for route handling
- MongoDB for user storage
- Pydantic for data validation
"""
import re

from bson import ObjectId
from bson.errors import InvalidId

from pydantic import ValidationError

from fastapi import APIRouter, Query, Depends, HTTPException, status

from api import crud
from api.deps import (
    ClientSession, 
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

@router.post("/signup", response_model=Message)
async def register_user(session : ClientSession, user_in : UserRegister) -> Message:
    """
    Register a new user in the system.
    
    This endpoint allows for user registration without requiring authentication.
    It checks for username uniqueness before creating the new user account.
    
    Args:
        session (ClientSession): Database session for performing database operations
        user_in (UserRegister): User registration data including username and password
        
    Returns:
        UserPublic: Public user information of the newly created user
        
    Raises:
        HTTPException (400): If the username is already taken
    
    """
    user = await crud.get_user_by_username(session=session, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    
    await crud.create_user(session=session, user_create=user_in)
    return Message(
        message="Successfully create user",
        status="success",
        data=True
    )

@router.post("/logout")
async def logout(
    current_user: CurrentUser,
    session: ClientSession
) -> Message:
    """
    Logout the current user and invalidate their access token.
    
    This endpoint handles user logout by clearing the user's active token
    from the system and ending their current session.
    
    Args:
        current_user (CurrentUser): The currently authenticated user
        session (ClientSession): Database session for performing database operations
        
    Returns:
        Message: Success message indicating successful logout
        
    Raises:
        HTTPException (500): If an unexpected error occurs during logout
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
        status="success",
        data=True
    )


@router.get("/available")
async def is_available_username(session : ClientSession,
                                username : str = Query(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")) -> Message:
    """
    Check if a username is available for registration.
    
    This endpoint performs a case-insensitive check to determine if the
    requested username is already taken in the system.
    
    Args:
        session (ClientSession): Database session for performing database operations
        username (str): The username to check for availability
        
    Returns:
        Message: Success message if username is available
        
    Raises:
        HTTPException (400): If the username is already taken
    """
    user = await session.users.find_one({"username": re.compile(f"^{username}$", re.IGNORECASE)})
    if user:
        return Message(
            message="Username is currently taken",
            status="success",
            data=False   
        )
    return Message(
        message="Successful username is currently available",
        status="success",
        data=True
    )

@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user_id: str, session: ClientSession
) -> UserPublic:
    """
    Retrieve user information by their unique identifier.
    
    This endpoint fetches and returns public user information for the specified
    user ID. It includes validation of the ID format and handles various error cases.
    
    Args:
        user_id (str): The unique identifier of the user to retrieve
        session (ClientSession): Database session for performing database operations
        
    Returns:
        UserPublic: Public user information for the requested user
        
    Raises:
        HTTPException (400): If the user ID format is invalid
        HTTPException (404): If no user is found with the specified ID
        HTTPException (422): If the retrieved user data fails validation
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