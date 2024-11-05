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

from datetime import datetime, UTC
from typing import Optional, Any, Literal, List, Union, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator, HttpUrl
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
    icon : str


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

class Judge(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    active : bool
    sampler : Any
    validator : Any # NOTE: set this to 
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                    "_id": "6723f3adf927e981a313ccbd0",
                    "active": True,
                    "created_at": "2024-10-31T04:23:51.135458",
                    "updated_at": None,
                    "sampler": {
                        "type": "function",
                        "function": {
                            "name": "get_bad_word",
                            "parameters": {},
                            "return": {
                                "type": "string"
                            },
                            "metadata": {
                                "is_async": False,
                                "doc": None,
                                "required_params": [],
                                "optional_params": []
                            }
                        }
                    },
                    "validator": {
                        "type": "function",
                        "function": {
                            "name": "target",
                            "parameters": {
                                "source": {
                                    "type": "string",
                                    "description": "user output of injected prompt",
                                    "required": True
                                },
                                "target": {
                                    "type": "string",
                                    "description": "the targeted prompt.",
                                    "required": True
                                },
                                "regex": {
                                    "type": "union",
                                    "types": ["string", "Pattern", "null"],
                                    "description": "Regular expression pattern to use for matching",
                                    "required": False,
                                    "default": None
                                },
                                "ignore_case": {
                                    "type": "boolean",
                                    "description": "Whether to ignore case when matching",
                                    "required": False,
                                    "default": False
                                }
                            },
                            "return": {
                                "type": "boolean",
                                "description": "Whether the source matches the target"
                            },
                            "metadata": {
                                "is_async": False,
                                "doc": "Compare source and target strings using exact match or regex",
                                "required_params": ["source", "target"],
                                "optional_params": ["regex", "ignore_case"]
                            }
                        }
                    }
                }
            }
    )

class Game(BaseModel):
    """Game model for Game object"""
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
    metadata: dict = Field(...)
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "judge_id": "507f1f77bcf86cd799439011",
                "title": "Bad Words",
                "author": "LMSYS & Pliny",
                "description": "...",
                "image": "https://avatars.githubusercontent.com/u/66436953?v=4&size=64",
                "created_at" : datetime.now(UTC),
                "updated_at" : None,
                "stars": 999,
                "metadata": {
                    "model_config": {
                        "system_prompt": "",
                        "temperature": 0.7,
                        "max_tokens": 150,
                        "tools_config": {
                            "enabled": False,
                            "tools": []
                        },
                    },
                    "game_rules": {
                        "timed": True,
                        "time_limit": 90000, 
                    },
               }
            }
        }
    )


class GamePublic(BaseModel):
    title: str
    author: List[str]
    description: str
    gameplay: Optional[str] = None  # Detailed gameplay description
    objective: Optional[str] = None  # Description of the game's objective
    image: Union[HttpUrl, str, None]
    created_at: datetime
    updated_at: Optional[datetime] = None
    stars: int
    metadata: dict

    @classmethod
    def from_game(cls, game: Game) -> "GamePublic":
        """Convert internal game model to public game model"""
        return cls(
            title=game.title,
            author=game.author,
            description=game.description,
            gameplay=game.gameplay,
            objective=game.objective,
            image=game.image,
            created_at=game.created_at,
            updated_at=game.updated_at,
            stars=len(game.stars),
            metadata=game.metadata
        )



class GameSession(BaseModel):
    """Session model for Session object"""
    id: Optional[ObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId = Field(...)
    game_id: ObjectId = Field(...)
    judge_id: ObjectId = Field(...)
    agent_id: ObjectId = Field(...)
    description : Optional[str] = Field(...)
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    completed: bool = False
    create_time: datetime = Field(default_factory=datetime.now)
    completed_time: Optional[datetime] = None
    outcome: Optional[str] = None
    shared: Optional[HttpUrl] = None
    metadata : Dict[str, Any]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "session_id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "game_id": "507f1f77bcf86cd799439013",
                "judge_id": "507f1f77bcf86cd799439014",
                "model_id": "507f1f77bcf86cd799439015",
                "history": [
                    {
                        "role": "assistant",
                        "content": "Hello, welcome to the game!"
                    },
                    {
                        "role": "user",
                        "content": "Hi, I'm ready to play!"
                    }
                ],
                "completed": False,
                "create_time": "2024-10-28T12:00:00Z",
                "complete_time": None,
                "outcome": None,
                "shared": None
            }
        }
    )

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


GameSession

class GameSessionPublic(BaseModel):
    id : Optional[str]
    user_id : Optional[str]
    history : List[Dict[str, Any]] 
    completed: bool = False
    completed_time: Optional[datetime] = None
    outcome: Optional[str] = None
    user : Dict[str, Any]
    model : Dict[str, Any]
    judge : Dict[str, Any]
    metadata : Dict[str, Any]
    
    @classmethod
    def from_dict(cls, obj : Dict[str, Any]):
        return cls(
            id=str(obj.get("_id", None)),
            user_id=str(obj.get("user_id", None)),
            history=obj.get("history"),
            completed=obj.get("completed"),
            complete_time=obj.get("complete_time"),
            outcome=obj.get("outcome"),
            user=obj.get("user"),
            model=obj.get("model"),
            judge=obj.get("judge"),
            metadata=obj.get("metadata")
        )

class GameSessionChatResponse(BaseModel):
    """Response model for chatting in a game session"""
    output: str
    outcome: str
      
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders = {ObjectId: str},
        json_schema_extra = {
            "example": {
                "model_output": "This is the response from the model.",
                "outcome": "win"
            }
        }
    )

class GameSessionHistoryItem(BaseModel):
    """Model representing a single item in the game session history response."""
    session_id: str
    outcome: Union[Literal['win', 'loss', 'forfeit'], None]
    duration: Optional[float]


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

class ModelQuery(BaseModel):
    session_id : str
    prompt : str



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
    name : str = Field(...)
    provider : str = Field(...)
    image : Union[str, HttpUrl] = Field(...)

    @classmethod
    def from_model(cls, model : Model) -> "ModelPublic":
        return cls(
            name=model.name,
            provider=model.provider,
            image=model.image
        )

# # NOTE if you need more Models then continue here
