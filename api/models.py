from __future__ import annotations
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
from datetime import datetime
from typing import Optional, Any, Literal, List, Union, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator, HttpUrl, EmailStr
from bson import ObjectId



# Base Message Model
class Message(BaseModel):
    """Generic response message"""
    status: int 
    message: Optional[str] = None
    data: Optional[Any]    = None

# Token ======================================================
class Token(BaseModel):
    """OAuth2 compatible token"""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user id
    exp: datetime

# ===========================================================

# User ======================================================

class UserRegister(BaseModel):
    """User registration request model"""
    username : Optional[str]   = Field(
        min_length=1,
        max_length=50,
        description="Username for login"
    )
    email : Optional[EmailStr] = None
    password: Optional[str]    = Field(
        min_length=8,
        description="Hashed password for user authentication")
    image : Optional[Union[str, HttpUrl]] = None
    provider : Optional[Literal["google"]] = None

    @field_validator('username')
    def username_alphanumeric(cls, v: str | None) -> str:
        print(v)
        if v is None:
            return v
        if not v.replace("_", "").isalnum():
            raise ValueError('Username must be alphanumeric, underscores allowed')
        return v

class User(BaseModel):
    """Internal user model with full details"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "username": "john_doe",
                "password": "hashed_password_string",
                "access_token": "jwt_token_string"
            }
        }
    )
    
    id: Union[ObjectId, str]  = Field(default_factory=ObjectId, alias="_id")
    email : Optional[EmailStr] = None
    username: Optional[str] = Field(
        min_length=1,
        max_length=50,
        description="Username for login"
    )
    password: Optional[str] = Field(
        min_length=8,
        description="Hashed password for user authentication"
    )
    created_at: datetime                  = Field(default_factory=datetime.now)
    access_token: Optional[str]           = None
    last_login : Optional[datetime]       = None
    last_signout : Optional[datetime]     = None
    image : Optional[Union[str, HttpUrl]] = None
    provider : Optional[Literal['google']]= None
        
    @field_validator('username')
    def username_alphanumeric(cls, v: str | None) -> str:
        if v is None:
            return v
        if not v.replace("_", "").isalnum():
            raise ValueError('Username must be alphanumeric, underscores allowed')
        return v


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
    id : Optional[str] = None
    username: str = None
    image : Optional[str | HttpUrl] =None

    @classmethod
    def from_user(cls, user: User) -> "UserPublic":
        """Convert internal user model to public user model"""
        return cls(
            id=str(user.id),
            username=user.username,
            image=user.image
        )


# Judge ================================================
class JudgeFunctionMetadata(BaseModel):
    doc : Optional[str]
    required_params : List[str]
    optional_params : List[str]

class JudgeFunctionAnnotations(BaseModel):
    name : str
    parameters : Dict[str, Any]
    returns : Dict[str, Any]
    metadata : JudgeFunctionMetadata
    

class JudgeFunction(BaseModel):
    type : Literal['function']
    function : JudgeFunctionAnnotations
    

class Judge(BaseModel):
    id: ObjectId | str             = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime           = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    active : bool
    sampler : JudgeFunction
    validator : JudgeFunction
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        populate_by_name=True,
         json_schema_extra = {
             "_id" : "507f1f77bcf86cd799439011",
         })
    
class JudgePublic(BaseModel):
    id: Optional[Union[ObjectId, str]] = None
    created_at: Optional[datetime]     = None
    updated_at: Optional[datetime]     = None
    active : Optional[bool]            = None
    sampler : Optional[JudgeFunction]  = None
    validator : Optional[JudgeFunction]= None
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        populate_by_name=True,
         json_schema_extra = {
             "_id" : "507f1f77bcf86cd799439011",
         })

# ======================================================

# Game =================================================

class GameMetadata(BaseModel):
    models_config : Dict[str, Any] = Field(alias="model_config")
    game_config : Optional[Dict[str, Any]]

class Game(BaseModel):
    """Game model for Game object"""
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        populate_by_name=True,
    )

    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    judge_id: ObjectId
    title: str
    author: List[str]
    description: str
    gameplay: Optional[str] = None  # Detailed gameplay description
    objective: Optional[str] = None  # Description of the game's objective
    image: Union[HttpUrl, str, None] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    stars: List[str] = Field(...)
    metadata: Dict[str, Any]
    
class GamePublic(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id : Optional[str]                      = None
    title: Optional[str]                    = None
    judge : Optional[JudgePublic]           = None
    author: Optional[List[str]]             = None
    description: Optional[str]              = None
    gameplay: Optional[str]                 = None  
    objective: Optional[str]                = None
    image: Optional[Union[HttpUrl, str]]    = None
    created_at: Optional[datetime]          = None
    updated_at: Optional[datetime]          = None
    stars: Optional[int]                    = None
    metadata: Optional[GameSessionMetadata] = None



# Session =============================================
class GameSession(BaseModel):
    """Session model for Session object"""
    id: Optional[ObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId = Field(...)
    game_id: ObjectId = Field(...)
    judge_id: ObjectId = Field(...)
    agent_id: ObjectId = Field(...)
    user : Optional[User] = None
    judge : Optional[Judge] = None
    model : Optional[Model] = None
    description : Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    completed: bool = False
    create_time: datetime = Field(default_factory=datetime.now)
    completed_time: Optional[datetime] = None
    outcome: Optional[str] = None
    shared: Optional[HttpUrl] = None
    metadata : Dict[str, Any]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str})

class GameSessionCreateResponse(BaseModel):
    """Response model for creating a new game session"""
    session_id: str = Field(...)
    description: str = Field(...)
    metadata : Dict[str, Any]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                "session_id": "64b2c8f9b3e3b975c9d3e8d9",
            }
        }
    )

    @classmethod
    def from_game(cls, game : GameSession):
        return cls(
            session_id=str(game.id),
            metadata=game.metadata,
            description=game.description
        )

class GameSessionMetadata(GameMetadata):
    kwargs : Optional[Dict[str, Any]] = {}

class GameSessionPublic(BaseModel):
    id : Optional[str]
    user : Optional[UserPublic]
    model : Optional[Model]
    judge : Optional[Judge]
    history : List[Dict[str, Any]] 
    completed: bool                    = False
    completed_time: Optional[datetime] = None
    outcome: Optional[str]             = None
    metadata : Optional[GameSessionMetadata]
    
class GameSessionHistoryItem(BaseModel):
    """Model representing a single item in the game session history response."""
    session_id: str
    outcome: Optional[Union[Literal['win', 'loss', 'forfeit']]] = None
    duration: Optional[float] = None
    last_message : Optional[datetime] = None


class GameSessionHistoryResponse(BaseModel):
    """Response model for retrieving game session history."""
    history: List[GameSessionHistoryItem]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                "history": [
                    {
                        "session_id": "64b2c8f9b3e3b975c9d3e8d9",
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
        })


# Model ============================================
class ModelMetadata(BaseModel):
    endpoint : Optional[str]
    tools : Optional[List[Dict]]
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str})

class Model(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    image : Union[str, HttpUrl]
    name : str = Field(...)
    provider : str = Field(...)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    metadata : Union[ModelMetadata, Dict]
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str})

class ModelPublic(BaseModel):
    name : Optional[str]
    provider : Optional[str]
    image : Optional[Union[str, HttpUrl]]
    metadata : Optional[Union[ModelMetadata, Dict]]

    @classmethod
    def from_model(cls, model : Model) -> "ModelPublic":
        return cls(
            name=model.name,
            provider=model.provider,
            image=model.image,
            metadata=model.metadata
        )
    


class StreamResponse(BaseModel):
    event : Literal["message", "end"]
    id : str
    retry : Optional[int] = None
    data : Dict[str, Any] | str


# # NOTE if you need more Models then continue here
