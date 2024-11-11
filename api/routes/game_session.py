import json
from typing import Any
from bson import ObjectId
from fastapi import APIRouter, \
                    HTTPException,\
                    status
from sse_starlette.sse import EventSourceResponse

from datetime import datetime, UTC
from api import crud
from api.deps import Database, CurrentUser
from api.models import (StreamResponse, 
                        GameSessionCreateResponse, 
                        GameSessionPublic, 
                        GameSessionHistoryItem, 
                        Message)
from api.generative._registry import ModelRegistry
from api.judge._registry import registry
from api.utils import handleStreamResponse

router = APIRouter()

@router.post("/create-chat", tags=["Game Session"])
async def create_session(
    game_id: str, 
    user: CurrentUser, 
    db: Database
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

    game = await crud.get_game_from_id(db=db, id=game_id)

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No contexts found for the specified game"
        )

    model_id = await crud.get_random_model_id(db=db)

    new_session = await crud.create_game_session(
        db=db,
        user_id=user.id,
        game_id=game_id,
        model_id=model_id, 
    )

    return GameSessionCreateResponse.from_game(new_session)


# NOTE: Comment or Delete when in production
@router.delete("/{session_id}", tags=["Game Session"])
async def deleted_session(
    session_id : str,
    user: CurrentUser, 
    db: Database
) -> Message:
    """NOTE: this is just for testing"""

    try:
        response = await db.sessions.delete_one({
            "_id" : ObjectId(session_id),
            "user_id" : user.id
        })

        if response.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )
        
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=400,
            detail="Session was not deleted for what ever reason"
        )
    return Message(
        status=status.HTTP_200_OK,
        message=f"{session_id} successfully deleted"
    )


@router.post("/{session_id}/completion", tags=["Game Session"])
async def completion(
    session_id : str,
    prompt : str,
    current_user: CurrentUser, 
    db: Database
) -> Any:
    """
    Handle prompt from the user.

    Args:
        session_id (str): ID of the current game session
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance

    Returns:
        GameSessionChatResponse: Response model with model_output, outcome
    """
    try:
        
        current_session : GameSessionPublic = await crud.get_session(session_id=session_id, 
                                                                     user_id=current_user.id,
                                                                     db=db)

        if str(current_session.user_id) != str(current_user.id) or current_session.completed:
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                detail = "You do not have permission to access this session"
            )
        

        current_session.history.append({"role": "user", "content": prompt})
        model = current_session.model.get("name", None)
        metadata = current_session.metadata
        target = registry.get_validator(current_session.judge["validator"]["function"]\
                                        .get("name", None))
        

        
        client = ModelRegistry.get_client(
                model
            )
        

        @handleStreamResponse(include_end=True)
        async def model_generate_generator():
            # NOTE: need to handle it when something goes wrong
            updates = ["history"]
            calmative_token = ""
            for token in client.generate(current_session.history, model):
                calmative_token += token
                
                if not current_session.outcome and\
                   target(**{"source" : calmative_token } | metadata.get("kwargs", {}) ):
                    current_session.outcome = "win"
                    current_session.completed = True
                    current_session.completed_time = datetime.now(UTC) 
                    updates = updates +\
                          ["completed","outcome","completed_time"]
                
                yield StreamResponse(
                        event="message",
                        id="response",
                        data=json.dumps({"content" : token}))
                
            current_session.history.append({"role": "assistant", "content": calmative_token})
            await crud.update_game_session(session_id=session_id, 
                                           updated_session=current_session,
                                           db=db,
                                           updates=updates)
           
            

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong withing the stream"
        )

    return EventSourceResponse(model_generate_generator())

@router.post("/{session_id}/forfeit", tags=["Game Session"])
async def forfeit(
    session_id: str, 
    current_user: CurrentUser, 
    db: Database
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

    current_session = await crud.get_session(session_id=session_id, db=db)
    
    if str(current_session.user_id) != str(current_user.id) or current_session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    current_session.completed = True
    current_session.outcome = "forfeit"
    current_session.complete_time = datetime.now(UTC)

    await crud.update_game_session(db=db,
                                   session_id=session_id, 
                                   updated_session=current_session,
                                   updates=[
                                       "completed",
                                       "outcome",
                                       "complete_time"
                                   ])

    return Message(
        status=status.HTTP_200_OK,
        data="the chat was officially forfeited")

@router.post("/{session_id}/end", tags=["Game Session"])
async def end(
    session_id: str, 
    current_user: CurrentUser, 
    db: Database
) -> Message:
    """
    Ends current game session for user
    Args:
        session_id (str): The ID of the session to forfeit.
        current_user (CurrentUser): The currently authenticated user.
        session: MongoDB session instance.
    Returns:
        dict: response containing outcome {"outcome": "loss"}
    """

    current_session = await crud.get_session(session_id=session_id, db=db)
    
    if str(current_session.user_id) != str(current_user.id) or current_session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    current_session.completed = True
    current_session.outcome = "loss"
    current_session.complete_time = datetime.now(UTC)

    try:

        await crud.update_game_session(session_id=session_id, 
                                    db=db, 
                                    updated_session=current_session,
                                    updates=[
                                        "completed",
                                        "outcome",
                                        "complete_time"
                                    ])

    except Exception as e:
        raise e


    return Message(
        status=status.HTTP_200_OK,
        data={"outcome": current_session.outcome}
    )



@router.get("/history", tags=["History"])
async def get_history(
    current_user: CurrentUser,
    db: Database
):
    """
    Retrieves the chat history of all game sessions of current user

    Args:
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance
    Returns:
        List[GameSessionHistoryResponse]: List of completed game sessions with session_id, target, outcome, duration
    """

    sessions = await crud.get_sessions_for_user(current_user.id, 
                                                db)
    
    history_response = [
        GameSessionHistoryItem(
            session_id=str(db.id),
            outcome=db.outcome,
            duration=(session.completed_time - session.create_time).total_seconds()
        )
        for session in sessions
    ]

    return history_response

@router.get("/history/{session_id}", tags=["History"])
async def get_session_history(
    session_id: str,
    current_user: CurrentUser,
    db : Database
):
    """
    Retrieves the chat history of session_id of current user

    Args:
        session_id (str): The ID of the session to retrieve history for
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance
    Returns:
        GameSessionHistoryResponse: Database history details
    """
    session = await crud.get_session(session_id=session_id, session=session)
    
    if str(session.user_id) != str(current_user.id) or not session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    duration = (session.complete_time - session.create_time).total_seconds()
    
    response_data = GameSessionHistoryItem(
        session_id=str(session.session_id),
        outcome=session.outcome,
        duration=duration
    )

    return response_data
