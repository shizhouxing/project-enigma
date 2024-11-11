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
import io
import httpx
import base64

from bson import ObjectId
from bson.errors import InvalidId

from pydantic import ValidationError

from fastapi import APIRouter, Query, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse

from api import crud
from api.deps import (
    Database, 
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
async def register_user(db : Database, user_in : UserRegister) -> Message:
    """
    Register a new user in the system.
    
    This endpoint allows for user registration without requiring authentication.
    It checks for username uniqueness before creating the new user account.
    
    Args:
        db (Database): Database session for performing database operations
        user_in (UserRegister): User registration data including username and password
        
    Returns:
        UserPublic: Public user information of the newly created user
        
    Raises:
        HTTPException (400): If the username is already taken
    
    """
    user = await crud.find_user(db=db, 
                                username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interrupt the user with this username already exists in the system.",
        )
    
    await crud.create_user(db=db, user_create=user_in)
    return Message(
        status=status.HTTP_201_CREATED,
        message=f"{user_in.username} was successfully created",
        data=True
    )

@router.post("/logout")
async def logout(
    db: Database,
    user: CurrentUser
) -> Message:
    """
    Logout the current user and invalidate their access token.
    
    This endpoint handles user logout by clearing the user's active token
    from the system and ending their current session.
    
    Args:
        current_user (CurrentUser): The currently authenticated user
        db (Database): Database session for performing database operations
        
    Returns:
        Message: Success message indicating successful logout
        
    Raises:
        HTTPException (500): If an unexpected error occurs during logout
    """
    try:
        await clear_user_token(db, user.id)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    
    return Message(
        message=f"{user.username} was successfully logged out",
        status=status.HTTP_200_OK,
        data=True
    )


@router.get("/available-username")
async def is_available_username(db : Database,
                                username : str = Query(..., min_length=1, max_length=50, pattern="^[a-zA-Z0-9_-]+$")) -> Message:
    """
    Check if a username is available for registration.
    
    This endpoint performs a case-insensitive check to determine if the
    requested username is already taken in the system.
    
    Args:
        db (Database): Database session for performing database operations
        username (str): The username to check for availability
        
    Returns:
        Message: Success message if username is available
        
    Raises:
        HTTPException (400): If the username is already taken
    """


    user = await crud.find_user(db=db, username=username)

    if user is not None and user.provider is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must login via your provider."
        )

    message = f"{username} is currently available" if user is None\
                else f"Username is currently taken"
    
    return Message(
        message=message,
        status=status.HTTP_200_OK,
        data=user is None
    )
@router.post('/update-username', response_model=Message)
async def update_username(db: Database, user: CurrentUser, username: str):
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    
    # Check if username already exists
    if await crud.get_user_by_username(db=db, username=username) is not None:
        raise HTTPException(
            detail="Username already exists",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Update the username
        results = await db.users.update_one(
            {"_id": user.id},
            {"$set": {"username": username}}
        )

        if results.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user token"
            )
        
        # Return success response
        return Message(
            status=200,
            message="Username updated successfully",
            data={
                "user_id": str(user.id),
                "username": username
            }
        )
    
    except Exception as e:
        # Handle database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update username"
        )



@router.get("/{id}", response_model=UserPublic)
async def read_user_by_id(
    id: str, 
    db: Database
) -> UserPublic:
    """
    Retrieve user information by their unique identifier.
    
    This endpoint fetches and returns public user information for the specified
    user ID. It includes validation of the ID format and handles various error cases.
    
    Args:
        id (str): The unique identifier of the user to retrieve
        db (Database): Database session for performing database operations
        
    Returns:
        UserPublic: Public user information for the requested user
        
    Raises:
        HTTPException (400): If the user ID format is invalid
        HTTPException (404): If no user is found with the specified ID
        HTTPException (422): If the retrieved user data fails validation
    """
    try:
        object_id = ObjectId(id)
        
        # Query the database
        user_dict = await db.users.find_one({"_id": object_id})
        if user_dict is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Interrupt user with id {id} not found"
            )
            
        # Convert to User model first for validation
        user = User.model_validate(user_dict)
        
        # Convert to UserPublic for response
        return UserPublic.from_user(user)
        
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interrupt invalid user ID format"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    

@router.get('/avatar/{user_id}')
async def get_avatar(db: Database, user_id: str):
    try:
        # Retrieve the user from the database
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User does not exist"
            )

        # Get the image path or URL
        image : str = user.get("image")
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )

        # Check if the image is a URL
        if image.startswith("https://"):
            # Fetch the image content from the URL
            async with httpx.AsyncClient() as client:
                response = await client.get(image)
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Image could not be retrieved from the URL"
                    )
                
                # Get the Content-Type from the response headers
                content_type = response.headers.get("Content-Type", "")
                if not content_type.startswith("image/"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="URL does not point to a valid image"
                    )

                # Stream the image response back to the client with the detected MIME type
                return StreamingResponse(
                    response.iter_bytes(),
                    media_type=content_type
                )
        elif image.startswith("http://"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image could not be retrieved from non secure URLs"
            )
       
        base64_data = None
        if image.startswith("data:image"):
            base64_data = image.split(",")[-1]
        
        image = base64.b64decode(base64_data)

        # If image is a local path, serve it as a file
        return StreamingResponse(
            io.BytesIO(image),
            media_type='image/webp'
        )

    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{user_id} is an invalid user ID"
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the avatar"
        )