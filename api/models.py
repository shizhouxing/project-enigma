from datetime import datetime, timedelta
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
from bson import ObjectId

# Base Message Model
class Message(BaseModel):
    """Generic response message"""
    status: str = "success"
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
        return v.lower()

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
    created_at: datetime = Field(default_factory=datetime.utcnow)

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