"""
Authentication Routes Module
===========================

This module handles all authentication-related endpoints including login and
token validation. It implements OAuth2 password flow with JWT tokens for
secure authentication.

Routes:
- POST /login/access-token: Login endpoint returning JWT token
- POST /login/test-token: Endpoint to validate JWT token
- GET /verify-token: verify if token is valid

Dependencies:
- FastAPI OAuth2 for authentication
- JWT for token generation
- MongoDB for user storage
"""
import json

from datetime import datetime, timedelta, UTC
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from api import crud
from api.deps import CurrentUser, Database
from api.core import security
from api.core.security import verify_expired
from api.core.config import settings
from api.models import Token, UserPublic, User, Message



router = APIRouter()

@router.post("/login/access-token", response_description="login authorization", response_model=Token)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Database
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
    # check if username exist, as well if the passwords match else return None
    user = await crud.authenticate(
        session=session, username=form_data.username, password=form_data.password
    )

    # raise exception if user does not exist or validate credential
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    access_token = user.access_token 
    try:
        # check if the the token has been expired
        if verify_expired(token=user.access_token):
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = security.create_access_token(
                str(user.id),  # Convert ObjectId to string for token
                expires_delta=access_token_expires
            )
    
            update_result = await session.users.update_one(
                {"_id": user.id},
                {"$set": {"access_token": access_token, "last_login" : datetime.now(UTC) }}
            )
        
            if update_result.modified_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user token"
                )
            
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while updating token"
        )

    return Token(
        access_token=access_token
    )

@router.get("/verify-token", response_model=Message)
async def test_token(user: CurrentUser) -> Message:
    """test the clients token

    Args:
        current_user (CurrentUser): dependency on the current client auth token

    Returns:
        UserPublic: public information of the user 
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Message(
        status="success",
        message="token is valid",
        data=True
    )
