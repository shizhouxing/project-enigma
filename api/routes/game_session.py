import json
from typing import Literal, Any
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
                        GameSessionTitleRequest,
                        Message)
from api.generative import Registry as Models
from api.judge import registry
from api.utils import handleStreamResponse, logger

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
    try:
        game = await crud.get_game_from_id(db=db, id=game_id)

        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No contexts found for the specified game"
            )

        model_id = await crud.get_random_model_id(db=db)
        logger.info(f"sample model id: {model_id}")
        new_session = await crud.create_game_session(
            db=db,
            user_id=user.id,
            game_id=game_id,
            model_id=model_id, 
        )
    except Exception as e:
        raise HTTPException( status_code=status.HTTP_400_BAD_REQUEST, detail="Something went wrong")
        

    return GameSessionCreateResponse.from_game(new_session)


# NOTE: Comment or Delete when in production
@router.delete("/{id}/session/{user_id}", tags=["Game Session"])
async def deleted_session(
    id : str,
    user_id : str,
    user: CurrentUser, 
    db: Database
) -> Message:
    """NOTE: this is just for testing"""

    try:

        if str(user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User does not match the authentication"
            )
        
        response = await db.sessions.delete_one({
            "_id" : ObjectId(id),
            "user_id" : user.id, 
            "completed" : True
        })

        if response.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {id} not found"
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Session was not deleted for what ever reason"
        )
    return Message(
        status=status.HTTP_200_OK,
        message=f"{id} successfully deleted"
    )


@router.post("/{id}/chat_conversation/{user_id}/title", tags=["Game Session"])
async def title_completion(
    current_user: CurrentUser,
    db: Database,
    content: GameSessionTitleRequest,
    id: str,
    user_id: str = None,
) -> Any:
    """
    Generate and update a session title using minimal tokens.
    
    Args:
        current_user (CurrentUser): The authenticated user
        db (Database): Database connection
        content (GameSessionTitleRequest): Request containing prompt/history
        id (str): Session ID
        user_id (str): User ID
    
    Returns:
        dict: Updated session information
    """
    try:
        session = await crud.get_session(session_id=id, user_id=current_user.id, db=db)
        
        if str(session.user_id) != str(current_user.id) != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this session"
            )
        
        # Create minimal context for title generation
        title_prompt = [
            {"role": "system", "content": "Create a brief, descriptive title."},
            {"role": "user", "content": content.message_content}  # Use just first message
        ]
        
        client = Models.get_client(session.model.name)


        # Generate title with max_tokens limit
        title_response = client.generate(
            title_prompt,
            session.model.name,
            stream=False,
            max_tokens=10  # Limit token usage
        )
        
        response = title_response.get_text().strip()
        # Update title in database
        result = await db.sessions.update_one(
            {"_id": session.id},
            {"$set": {"title": response}}
        )
        

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or no changes made"
            )
            
        return Message(
                status=status.HTTP_200_OK,
                message="Title response was completion was successful.",
                data={"title": response})
        
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating title: {str(e)}"
        )



@router.post("/{id}/chat_conversation/{user_id}/conversation", tags=["Game Session"])
async def completion(
    current_user: CurrentUser, 
    db: Database,
    prompt : str,
    id : str,
    user_id : str=None,
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
        
        current_session : GameSessionPublic = await crud.get_session(session_id=id, 
                                                                     user_id=current_user.id,
                                                                     db=db)

        if str(current_session.user_id) != str(current_user.id) != user_id\
           or current_session.completed:
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                detail = "You do not have permission to access this session"
            )
        
        current_session.history.append({"role": "user", "content": prompt})
        model = current_session.model.name
        metadata = current_session.metadata
        print(registry.validators)
        validator = registry.get_validator(current_session.judge.validator.function.name)
        

        client = Models.get_client(model)

        @handleStreamResponse(include_end=True)
        async def model_generate_generator():
            # NOTE: need to handle it when something goes wrong
            updates = ["history"]
            calmative_token = ""
            if metadata.model_config.get("models_config", {}).get("tools_config", {}).get("enabled", False):
                stream = client.generate(current_session.history, model, tools=metadata.models_config.tools_config.tools)
            else:
                stream = client.generate(current_session.history, model)
            for token in stream.iter_tokens():
                calmative_token += token
                
                print(validator(**{"source" : calmative_token } | metadata.kwargs ), metadata.kwargs, calmative_token)
                if not current_session.outcome and\
                   validator(**{"source" : calmative_token } | metadata.kwargs ):
                    current_session.outcome = "win"
                    current_session.completed = True
                    current_session.completed_time = datetime.now(UTC) 
                    updates = updates +\
                          ["completed","outcome","completed_time"]
                
                yield StreamResponse(
                        event="message",
                        id="response",
                        data=json.dumps({"content" : token}))

            functions_called = stream.get_function_call()
            if functions_called and any(validator(**{"source" : calmative_token } | metadata.get("kwargs", {}) | {"function_call_name": func.name, "function_call_arguments": func.argument}) for func in functions_called):
                current_session.outcome = "win"
                current_session.completed = True
                current_session.completed_time = datetime.now(UTC) 
                updates = updates +\
                        ["completed","outcome","completed_time"]
                
            current_session.history.append({"role": "assistant", "content": calmative_token})
            await crud.update_game_session(session_id=id, 
                                           updated_session=current_session,
                                           db=db,
                                           updates=updates)
           
            

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong withing the stream"
        )

    return EventSourceResponse(model_generate_generator())

@router.post("/{id}/chat_conversation/{user_id}/forfeit", tags=["Game Session"])
async def forfeit(
    current_user: CurrentUser, 
    db: Database,
    id: str, 
    user_id : str | None=None,
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

    session = await crud.get_session(session_id=id, user_id=user_id, db=db)
    
    if user_id != str(session.user_id) != str(current_user.id) \
       or session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    session.completed = True
    session.outcome = "forfeit"
    session.complete_time = datetime.now(UTC)

    await crud.update_game_session(db=db,
                                   session_id=id, 
                                   updated_session=session,
                                   updates=[
                                       "completed",
                                       "outcome",
                                       "complete_time"
                                   ])

    return Message(
        status=status.HTTP_200_OK,
        data="the chat was officially forfeited")

@router.post("/{id}/chat_conversation/{user_id}/end_game", tags=["Game Session"])
async def end(
    id: str, 
    user_id : str,
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

    session = await crud.get_session(session_id=id,
                                     user_id=ObjectId(user_id),
                                     db=db)
    
    if user_id != str(session.user_id) != str(current_user.id)\
       or session.completed:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "You do not have permission to access this session"
        )
    
    session.completed = True
    session.outcome = "loss"
    session.complete_time = datetime.now(UTC)

    try:

        await crud.update_game_session(session_id=id, 
                                       db=db, 
                                       updated_session=session,
                                       updates=[
                                            "completed",
                                            "outcome",
                                            "complete_time"])

    except Exception as e:
        raise e


    return Message(
        status=status.HTTP_200_OK,
        data={"outcome": session.outcome}
    )



@router.post("/history", tags=["History"])
async def get_history(
    current_user: CurrentUser,
    db: Database,
    s : int,
    l : int = None
):
    """
    Retrieves the chat history of all game sessions of current user

    Args:
        current_user (CurrentUser): The currently authenticated user
        session: MongoDB session instance
    Returns:
        List[GameSessionHistoryResponse]: List of completed game sessions with session_id, target, outcome, duration
    """
    try:
        sessions = await crud.get_sessions_for_user(user_id=current_user.id, db=db, skip=s, limit=l)

        @handleStreamResponse(include_end=True)    
        async def stream_game_sessions():
            for session in sessions:
                yield StreamResponse(
                    event="message",
                    id="game_session",
                    data=GameSessionHistoryItem(
                        session_id=str(session.id),
                        outcome=session.outcome,
                        duration=(session.completed_time - session.create_time).total_seconds(),
                        last_message=session.completed_time
                    ).model_dump_json(exclude_none=True)
                )
    except Exception as e:
        print(e)
        raise e
    
    return EventSourceResponse(stream_game_sessions())

@router.get("/history/{id}", tags=["History"])
async def get_session_history(
    id: str,
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
    session = await crud.get_session(session_id=id, db=db)
    
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
