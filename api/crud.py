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
import re

from typing import Optional, List, Union
from datetime import datetime, UTC

from fastapi import HTTPException, status

from api.deps import ClientSession
from api.core.security import get_password_hash, verify_password
from api.models import User, UserRegister, Game, GameSession, Model
from api.utils import generate
from bson import ObjectId, errors
import random


# = User ==============================================================

async def get_user_by_username(*, session: ClientSession, username: str) -> Optional[User]:
    """Retrieve user from database by username.
    
    Args:
        session (ClientSession): Database session
        username (str): Username to look up
        
    Returns:
        Optional[User]: User if found, None otherwise
    """

    user_data = await session.users.find_one({"username": re.compile(f"^{username}$", re.IGNORECASE)})

    if user_data:
        return User(**user_data)
    return None


async def create_user(*, session: ClientSession, user_create: UserRegister) -> User:
    """Create new user in database.
    
    Args:
        session (ClientSession): Database session
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
        user_data["icon"] = generate(user_create.username)

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

async def authenticate(*, session : ClientSession, username : str, password : str) -> Optional[User]:
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

async def get_game_from_id(*, session: ClientSession, id: str) -> Game:
    """
    Fetch Game object by its game_id including associated judge information
    
    Args:
        session: MongoDB session instance
        game_id (str): Unique session ID of GameSession
        
    Returns:
        Game: Game object with judge information, if found
        
    Raises:
        HTTPException: If game_id is invalid or game is not found
    """
    try:
        id = ObjectId(id)
    except errors.InvalidId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not a valid ID"
        )

    game_data = await session.games.find_one({
                "_id": id
        },)
    
    if not game_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    

    return Game.model_validate(game_data)

async def get_games(*, session: ClientSession) -> List[Game]:
    """
    Fetch all games from the database
    
    Args:
        session: MongoDB session instance
        
    Returns:
        List[Game]: List of all games
        
    Raises:
        HTTPException: If there's an error retrieving games
    """
    try:
        # Convert cursor to list since find() returns a cursor
        game_data = await session.games.find({}).to_list(length=None)
        if game_data is None:  # This would be unusual - likely a connection issue
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Something went wrong when finding the games"
            )
            
        return [Game.model_validate(game) for game in game_data]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving games: {str(e)}"
        )

# =====================================================================


# = Session ==============================================================

async def create_game_session(*, 
                              session:  ClientSession, 
                              user_id:  Union[str, ObjectId], 
                              game_id:  Union[str, ObjectId],
                              model_id: Union[str, ObjectId]) -> GameSession:
    """
    Creates new game session in database

    Args:
        session: MongoDB session instance
        user_id (str): ID of user creating the session
        game_id (str): ID of the game for the session
        model_id (str): ID of the model for the session
        target (str): Randomly chosen prompt from the game's contexts
        session: MonogDB session instance
    
    Returns:
        GameSession: The created GameSession object
    """

    try:
        user_id = ObjectId(user_id) if (isinstance(user_id, str)) else user_id
        game_id = ObjectId(game_id) if (isinstance(game_id, str)) else game_id
        model_id = ObjectId(model_id) if (isinstance(model_id, str)) else model_id
    
        game = await session.games.find_one({
            "_id" : game_id
        })

        game : Game = Game.model_validate(game)

        new_session = GameSession(
            user_id=user_id,
            game_id=game_id,
            judge_id=ObjectId(game.judge_id),
            agent_id=model_id,
            history=[],
            completed=False,
            create_time=datetime.now(UTC),
            complete_time=None,
            outcome=None,
            shared=None
        ).model_dump()

        result = await session["sessions"].insert_one(new_session) 
        new_session["session_id"] = str(result.inserted_id)
    except errors.InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Something else went wrong"
        )
    return GameSession.model_validate(new_session)


async def delete_game_session(session: ClientSession, session_id: str) -> None:
    await session["session"].delete_one({"_id": session_id})

async def get_session(*, session_id : str, session: ClientSession) -> GameSession:
    """
    Get session object by session_id

    Args:
        session_id (str): Unique session ID of the GameSession
        session: MonogDB session instance
    Returns:
        GameSession: The GameSession object, if found
    """
    try: 
        session_id_obj = ObjectId(session_id)
    except Exception:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail="Invalid session_id format"
        )

    session_data = await session["sessions"].find_one({"_id": session_id_obj})
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return GameSession(**session_data)

async def update_game_session(*, session: ClientSession, session_id: str, updated_session: GameSession):
    """
    Update an existing GameSession in the database.

    Args:
        session: MongoDB session instance
        session_id (str): ID of the session to be updated
        updated_session: The GameSession object containing updated fields
    """
    try:
        session_id_obj = ObjectId(session_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session_id format"
        )

    result = await session["sessions"].update_one(
        {"_id": session_id_obj},
        {"$set": {
            "history": updated_session.history,
            "completed": updated_session.completed,
            "outcome": updated_session.outcome,
            "shared": updated_session.shared,
            "complete_time": updated_session.complete_time
        }}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or no changes made"
        )

    return {"message": "Session updated successfully"}

async def get_sessions_for_user(user_id: str, session: ClientSession) -> List[GameSession]:
    """
    Get all game sessions for a specific user.

    Args:
        user_id (str): ID of the user sessions to retrieve
        session (Session): MongoDB session instance

    Returns:
        List[GameSession]: List of GameSession objects for the user.
    """
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    sessions_data = await session["GameSessions"].find({
        "user_id": user_id_obj,
        "completed": True
    }).to_list(length=None)

    if not sessions_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No history found"
        )
    
    return [GameSession(**session_data) for session_data in sessions_data]

# =====================================================================

# = Model ==============================================================


async def get_models(session : ClientSession) -> List[Model]:
    models = await session.models.find({
        "available" : True
    }).to_list()

    if models is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available models found in the database"
        )
    
    return [Model.model_validate(model) for model in models]


async def get_random_model_id(session : ClientSession) -> ObjectId:
    """
    Fetch a random model ID from the Models collection.

    Args:
        session: MongoDB session instance
    Returns:
        str: The ID of the randomly selected model
    """

    models : List[Model] = await get_models(session=session)

    if not models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No models found in the database"
        )
    
    selected_model = random.choice(models)
    if (id := selected_model.id) is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Not a valid model"
        )
    return id

def get_model_client_from_provider(provider : str):
    ...
# =====================================================================