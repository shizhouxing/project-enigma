from fastapi import APIRouter, Depends, HTTPException, status
import random
from datetime import datetime, UTC
from bson import ObjectId
from api import crud
from api.deps import ClientSession, CurrentUser
from api.models import GameSessionCreateResponse, GameSessionChatResponse, GameSessionHistoryResponse

router = APIRouter()

@router.post("/create")
async def create_session(
    game_id: str, 
    current_user: CurrentUser, 
    session: ClientSession
) -> GameSessionCreateResponse:
    """
    Creates a new game session for the currenet user with the specified game ID

    Args:
        game_id (str): ID of the game for the session
        current_user (CurrentUser): Currently authenticated user
        session: MongoDB session instance
    
    Returns:
        GameSessionCreateResponse: Response model with session_id and target
    """

    game = await crud.get_game(session=session, game_id=game_id)

    if not game.contexts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No contexts found for the specified game"
        )

    target = random.choice(game.contexts)
    model_id = await crud.get_random_model_id(session=session)

    new_session = await crud.create_game_session(
        session=session,
        user_id=current_user.id,
        game_id=game_id,
        model_id=model_id, 
        target=target
    )

    return GameSessionCreateResponse(session_id=str(new_session.session_id), target=new_session.target)


@router.post("/chat")
async def chat(
    session_id: str, 
    user_input: str, 
    current_user: CurrentUser, 
    session: ClientSession
) -> GameSessionChatResponse:
    """
    Handle chat messages from the user.

    Args:
        session_id (str): ID of the current game session
        user_input (str): The message sent by the user
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance

    Returns:
        GameSessionChatResponse: Response model with model_output, outcome
    """

    current_session = await crud.get_session(session_id=session_id, session=session)
    
    if str(current_session.user_id) != str(current_user.id) or current_session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    current_session.history.append({"role": "user", "content": user_input})
    
    model_output = result # TODO: implement model routes
    outcome = res # TODO: implement judge routes

    current_session.history.append({"role": "model", "content": model_output})

    if outcome == "win":
        current_session.completed = True
        current_session.outcome = "win"
        current_session.complete_time = datetime.now(UTC)
    
    updated_session = await crud.update_game_session(session=session, session_id=session_id, updated_session=current_session)

    return GameSessionChatResponse(
        model_output = model_output,
        outcome=outcome
    )

@router.get("/history")
async def get_history(
    current_user: CurrentUser,
    session: ClientSession
):
    """
    Retrieves the chat history of all game sessions of current user

    Args:
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance
    Returns:
        List[GameSessionHistoryResponse]: List of completed game sessions with session_id, target, outcome, duration
    """

    sessions = await crud.get_sessions_for_user(str(current_user.id), session)
    
    history_response = [
        GameSessionHistoryResponse(
            session_id=str(session.session_id),
            target_phrase=session.target,
            outcome=session.outcome,
            duration=(session.complete_time - session.create_time).total_seconds()
        )
        for session in sessions
    ]

    return history_response

@router.get("/history/{session_id}")
async def get_session_history(
    session_id: str,
    current_user: CurrentUser,
    session: ClientSession
):
    """
    Retrieves the chat history of session_id of current user

    Args:
        session_id (str): The ID of the session to retrieve history for
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance
    Returns:
        GameSessionHistoryResponse: ClientSession history details
    """
    session = await crud.get_session(session_id=session_id, session=session)
    
    if str(session.user_id) != str(current_user.id) or not session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    duration = (session.complete_time - session.create_time).total_seconds()
    
    response_data = GameSessionHistoryResponse(
        session_id=str(session.session_id),
        target_phrase=session.target,
        outcome=session.outcome,
        duration=duration
    )

    return response_data

@router.post("/forfeit")
async def forfeit(
    session_id: str, 
    current_user: CurrentUser, 
    session: ClientSession
):
    """
    Forfeits current game session for user
    Args:
        session_id (str): The ID of the session to forfeit.
        current_user (CurrentUser): The currently authenticated user.
        session: MongoDB session instance.
    Returns:
        dict: response containing outcome {"outcome": "forfeit"}
    """

    current_session = await crud.get_session(session_id=session_id, session=session)
    
    if str(current_session.user_id) != str(current_user.id) or current_session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    current_session.completed = True
    current_session.outcome = "forfeit"
    current_session.complete_time = datetime.now(UTC)

    await crud.update_game_session(session_id=session_id, session=session, updated_session=current_session)

    return {"outcome": current_session.outcome}

@router.post("/end")
async def end(
    session_id: str, 
    current_user: CurrentUser, 
    session: ClientSession
):
    """
    Ends current game session for user
    Args:
        session_id (str): The ID of the session to forfeit.
        current_user (CurrentUser): The currently authenticated user.
        session: MongoDB session instance.
    Returns:
        dict: response containing outcome {"outcome": "loss"}
    """

    current_session = await crud.get_session(session_id=session_id, session=session)
    
    if str(current_session.user_id) != str(current_user.id) or current_session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    current_session.completed = True
    current_session.outcome = "loss"
    current_session.complete_time = datetime.now(UTC)

    await crud.update_game_session(session_id=session_id, session=session, updated_session=current_session)

    return {"outcome": current_session.outcome}