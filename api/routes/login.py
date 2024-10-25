"""
Authentication Routes Module
===========================

This module handles all authentication-related endpoints including login and
token validation. It implements OAuth2 password flow with JWT tokens for
secure authentication.

Routes:
- POST /login/access-token: Login endpoint returning JWT token
- POST /login/test-token: Endpoint to validate JWT token

Dependencies:
- FastAPI OAuth2 for authentication
- JWT for token generation
- MongoDB for user storage
"""
from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from api import crud
from api.deps import CurrentUser, get_db
from api.core import security
from api.core.config import settings
from api.models import Token, UserPublic, User



router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Any = Depends(get_db)
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    and update the user's stored token.
    
    Args:
        session: Database session
        form_data: OAuth2 password request form
        
    Returns:
        Token: Access token for authentication
        
    Raises:
        HTTPException: If authentication fails
    """
    user = await crud.authenticate(
        session=session, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        str(user.id),  # Convert ObjectId to string for token
        expires_delta=access_token_expires
    )
   
    try:
        update_result = await session.users.update_one(
            {"_id": user.id},
            {"$set": {"access_token": access_token}}
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user token"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while updating token"
        )

    return Token(
        access_token=access_token
    )

@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> UserPublic:
    """test the clients token

    Args:
        current_user (CurrentUser): dependency on the current client auth token

    Returns:
        UserPublic: public information of the user 
    """
    user = User.model_validate(current_user)
    if user.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    pub_user = UserPublic.from_user(user)
    return pub_user

