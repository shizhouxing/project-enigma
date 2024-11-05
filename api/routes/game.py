from __future__ import annotations
from typing import List, Any, Annotated

from fastapi import APIRouter, HTTPException, Query
from api.deps import Database
from api.crud import get_game_from_id, get_games
from api.models import GamePublic


router = APIRouter()

@router.get("/{id}")
async def game_from_id(session : Database, id : str) -> Any:
    response = await get_game_from_id(session=session, id=id)
    return GamePublic.from_game(response)


@router.get("/")
async def get_all_games(
    session: Database
) -> List[GamePublic]:
    """
    Get all games and convert them to GamePublic model.
    Accessible via both /game/ and /game
    """
    try:
        response = await get_games(session=session)
        return [GamePublic.from_game(game) for game in response]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching games: {str(e)}"
        )

