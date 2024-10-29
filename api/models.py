"""
Pydantic Data Models Module
==========================

This module defines the Pydantic models used throughout the application for data validation,
serialization, and documentation. These models serve as the core data structures and
ensure type safety and validation across the API.

The models are organized into several categories:
1. Message Models - For API responses
2. Token Models - For authentication and JWT handling
3. User Models - Various user-related models for different contexts

Key Features:
- Automatic validation of input data
- JSON Schema generation for API documentation
- MongoDB ObjectId handling
- Secure password handling
- Custom field validators

Usage:
    from api.models import User, UserRegister, UserPublic, Token
    
    # Validate user registration data
    user_data = UserRegister(username="john_doe", password="secure123")
    
    # Convert internal user to public response
    public_user = UserPublic.from_user(user)
"""

from datetime import datetime, UTC
from typing import Optional, Any, Literal, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from bson import ObjectId

# Base Message Model
class Message(BaseModel):
    """Generic response message"""
    status: Literal["success", "failed"] = "success"
    message: Optional[str] = None
    data: Optional[Any] = None

# Token Models
class Token(BaseModel):
    """OAuth2 compatible token"""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user id
    exp: datetime
    
# User Models
class UserBase(BaseModel):
    """Base user properties"""
    username: str = Field(
        min_length=3,
        max_length=50,
        description="Username for login"
    )
    
    @field_validator('username')
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError('Username must be alphanumeric, underscores allowed')
        return v

class UserRegister(UserBase):
    """User registration request model"""
    password: str = Field(
        min_length=8,
        max_length=40,
        description="Password for user authentication"
    )

class UserResponse(UserBase):
    """User response model with public fields"""
    id: str
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "username": "john_doe",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }

class User(UserBase):
    """Internal user model with full details"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "username": "john_doe",
                "password": "hashed_password_string",
                "access_token": "jwt_token_string"
            }
        }
    )
    
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    password: str = Field(
        min_length=8,
        description="Hashed password for user authentication"
    )
    access_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    last_login : Optional[datetime] = None
    last_signout : Optional[datetime] = None


class UserPublic(BaseModel):
    """Public user information model"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "username": "john_doe"
            }
        }
    )
    
    id: str = Field(alias="_id")
    username: str

    @classmethod
    def from_user(cls, user: User) -> "UserPublic":
        """Convert internal user model to public user model"""
        return cls(
            _id=str(user.id),
            username=user.username
        )

class GameSessionCreateResponse(BaseModel):
    """Response model for creating a new game session"""
    session_id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    target: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "64b2c8f9b3e3b975c9d3e8d9",
                "target": "Hello"
            }
        }

class GameSessionChatResponse(BaseModel):
    """Response model for chatting in a game session"""
    model_output: str
    outcome: str

    class Config:
        schema_extra = {
            "example": {
                "model_output": "This is the response from the model.",
                "outcome": "win"
            }
        }

class GameSessionHistoryItem(BaseModel):
    """Model representing a single item in the game session history response."""
    session_id: str
    target: str
    outcome: str
    duration: float

class GameSessionHistoryResponse(BaseModel):
    """Response model for retrieving game session history."""
    history: List[GameSessionHistoryItem]

    class Config:
        schema_extra = {
            "example": {
                "history": [
                    {
                        "session_id": "64b2c8f9b3e3b975c9d3e8d9",
                        "target_phrase": "Hello, how are you?",
                        "outcome": "win",
                        "duration": 300.5
                    },
                    {
                        "session_id": "64b2c8f9b3e3b975c9d3e8da",
                        "target_phrase": "Hello, how are you?",
                        "outcome": "loss",
                        "duration": 150.0
                    }
                ]
            }
        }

class Game(BaseModel):
    """Game model for Game object"""
    game_id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    contexts: List[str]
    judge_id: ObjectId

    class Config:
        arbitrary_types_allowed=True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "game_id": "507f1f77bcf86cd799439011", 
                "contexts": ["hello", "goodbye"],
                "judge_id": "507f1f77bcf86cd799439011"
            }
        }

class Context(BaseModel):
    """Model representing a single context entry in history of the GameSession object."""
    role: str
    content: str

class GameSession(BaseModel):
    """Session model for Session object"""
    session_id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId
    game_id: ObjectId
    model_id: ObjectId
    history: List[Context]
    completed: bool
    create_time: datetime
    outcome: Optional[str]
    shared: bool
    target: str
    complete_time: Optional[datetime]

    class Config:
        arbitrary_types_allowed=True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "session_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "game_id": "507f1f77bcf86cd799439013",
                "model_id": "507f1f77bcf86cd799439014",
                "history": [{"role": "model", "content": "Hello"}, {"role": "user", "content": "Hello"}],
                "completed": False,
                "create_time": "2024-10-28T12:00:00Z",
                "outcome": None,
                "shared": False,
                "target": "Hello, how are you?",
                "complete_time": None
            }
        }

# NOTE if you need more Models then continue here
