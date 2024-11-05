import json

from fastapi import APIRouter, \
                    Depends, \
                    HTTPException,\
                    status,\
                    Request
from sse_starlette.sse import EventSourceResponse

from datetime import datetime, UTC
from api import crud
from api.deps import Database, CurrentUser
from api.models import GameSessionCreateResponse, ModelQuery, GameSessionPublic
from api.generative._registry import ModelRegistry

router = APIRouter()

@router.post("/create")
async def create_session(
    game_id: str, 
    user: CurrentUser, 
    session: Database
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

    game = await crud.get_game_from_id(session=session, id=game_id)

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No contexts found for the specified game"
        )

    model_id = await crud.get_random_model_id(session=session)
    
    print(user)

    new_session = await crud.create_game_session(
        session=session,
        user_id=user.id,
        game_id=game_id,
        model_id=model_id, 
    )

    return GameSessionCreateResponse.from_game(new_session)

@router.post("/")
async def session_(
    session_id : str,
    current_user: CurrentUser, 
    session: Database
) -> GameSessionPublic:

    current_session = await crud.get_session(session_id=session_id, 
                                             user_id = current_user.id,
                                             session=session)
    return current_session




@router.post("/generate")
async def chat(
    query : ModelQuery,
    current_user: CurrentUser, 
    session: Database
) -> GameSessionPublic:
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
    try:
        current_session : GameSessionPublic = await crud.get_session(session_id=query.session_id, 
                                                                     user_id=current_user.id,
                                                                     session=session)

        print(current_session.user_id, current_user.id, current_session.completed)
        if str(current_session.user_id) != str(current_user.id) or current_session.completed:
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                detail = "You do not have permission to access this session"
            )
        

        current_session.history.append({"role": "user", "content": query.prompt})
        model = current_session.model.get("name", None)
        client = ModelRegistry.get_client(
                model
            )
        
        async def model_generate_generator():
            calmative_token = ""
            for token in client.generate(current_session.history, model):
                calmative_token+=token
                yield {
                        "event": "message_token",
                        "id": "message",
                        "data": json.dumps({"content" : token}),
                    }

            current_session.history.append({"role": "assistant", "content": calmative_token})
            await crud.update_game_session(session_id=query.session_id, 
                                           updated_session=current_session,
                                           session=session,
                                           updates=[
                                               "history",
                                               "completed",
                                               "outcome",
                                               "complete_time"
                                           ])
            yield {
                    "event": "exit_stream",
                    "id": "message",
                    "data": "",
            }
            

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong withing the stream"
        )

    return EventSourceResponse(model_generate_generator())

# @router.get("/history")
# async def get_history(
#     current_user: CurrentUser,
#     session: Database
# ):
#     """
#     Retrieves the chat history of all game sessions of current user

#     Args:
#         current_user (CurrentUser): The currently authenticated user
#         session: MongoDB session instance
#     Returns:
#         List[GameSessionHistoryResponse]: List of completed game sessions with session_id, target, outcome, duration
#     """

#     sessions = await crud.get_sessions_for_user(str(current_user.id), session)
    
#     history_response = [
#         GameSessionHistoryResponse(
#             session_id=str(session.session_id),
#             target_phrase=session.target,
#             outcome=session.outcome,
#             duration=(session.complete_time - session.create_time).total_seconds()
#         )
#         for session in sessions
#     ]

#     return history_response

# @router.get("/history/{session_id}")
# async def get_session_history(
#     session_id: str,
#     current_user: CurrentUser,
#     session: Database
# ):
#     """
#     Retrieves the chat history of session_id of current user

#     Args:
#         session_id (str): The ID of the session to retrieve history for
#         current_user (CurrentUser): The currently authenticated user
#         session: MongoDB session instance
#     Returns:
#         GameSessionHistoryResponse: Database history details
#     """
#     session = await crud.get_session(session_id=session_id, session=session)
    
#     if str(session.user_id) != str(current_user.id) or not session.completed:
#         raise HTTPException(
#             status_code = status.HTTP_403_FORBIDDEN,
#             detail = "You do not have permission to access this session"
#         )
    
#     duration = (session.complete_time - session.create_time).total_seconds()
    
#     response_data = GameSessionHistoryResponse(
#         session_id=str(session.session_id),
#         target_phrase=session.target,
#         outcome=session.outcome,
#         duration=duration
#     )

#     return response_data

# @router.post("/forfeit")
# async def forfeit(
#     session_id: str, 
#     current_user: CurrentUser, 
#     session: Database
# ):
#     """
#     Forfeits current game session for user
#     Args:
#         session_id (str): The ID of the session to forfeit.
#         current_user (CurrentUser): The currently authenticated user.
#         session: MongoDB session instance.
#     Returns:
#         dict: response containing outcome {"outcome": "forfeit"}
#     """

#     current_session = await crud.get_session(session_id=session_id, session=session)
    
#     if str(current_session.user_id) != str(current_user.id) or current_session.completed:
#         raise HTTPException(
#             status_code = status.HTTP_403_FORBIDDEN,
#             detail = "You do not have permission to access this session"
#         )
    
#     current_session.completed = True
#     current_session.outcome = "forfeit"
#     current_session.complete_time = datetime.now(UTC)

#     await crud.update_game_session(session_id=session_id, session=session, updated_session=current_session)

#     return Message(
#         status="success",
#         data={"outcome": current_session.outcome}
#         )

# @router.post("/end")
# async def end(
#     session_id: str, 
#     current_user: CurrentUser, 
#     session: Database
# ):
#     """
#     Ends current game session for user
#     Args:
#         session_id (str): The ID of the session to forfeit.
#         current_user (CurrentUser): The currently authenticated user.
#         session: MongoDB session instance.
#     Returns:
#         dict: response containing outcome {"outcome": "loss"}
#     """

#     current_session = await crud.get_session(session_id=session_id, session=session)
    
#     if str(current_session.user_id) != str(current_user.id) or current_session.completed:
#         raise HTTPException(
#             status_code = status.HTTP_403_FORBIDDEN,
#             detail = "You do not have permission to access this session"
#         )
    
#     current_session.completed = True
#     current_session.outcome = "loss"
#     current_session.complete_time = datetime.now(UTC)

#     await crud.update_game_session(session_id=session_id, session=session, updated_session=current_session)

#     return {"outcome": current_session.outcome}