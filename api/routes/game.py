from __future__ import annotations
from typing import List, Any, Optional, Dict

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from api.deps import Database
from api.crud import get_game_from_id, get_games
from api.models import Game, StreamResponse
from api.utils import handleStreamResponse



router = APIRouter()

@router.get("/")
async def get_all_games(
    db : Database,
    s : int,
    l : Optional[int] = None
) -> List[Game]:
    """
    Get all games and convert them to GamePublic model.
    Accessible via both /game/ and /game
    """
    try:
        response = []
        async for game in get_games(db=db, skip=s, limit=l):
                response.append(
                     Game(
                          id=str(game.id),
                          title=game.title,
                          image=game.image
                    ).to_dict()
                )
        return response
    except HTTPException as e:
        raise e
    
@router.get("/stream")
async def get_all_games_stream(
    db : Database,
    s : int,
    l : Optional[int] = None
):
    """
    Get all games and convert them to GamePublic model.
    Accessible via both /game/ and /game
    """

    @handleStreamResponse(include_end=True)
    async def stream_games():
        async for game in get_games(db=db, skip=s, limit=l):
            yield StreamResponse(
                    event="message",
                    id="game",
                    data=Game(
                        id=str(game.id),
                        title=game.title,
                        image=game.image
                        ).model_dump_json(exclude_none=True)
                    )
        
            
    return EventSourceResponse(stream_games())



@router.get("/{id}")
async def game_from_id(db : Database, id : str) -> Any:
    response = await get_game_from_id(db=db, id=id)
    return response


