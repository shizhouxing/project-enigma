from typing import List, Any

from fastapi import APIRouter, HTTPException, Depends
from api.deps import ClientSession
from api.crud import get_game, get_games
from api.models import Game


router = APIRouter()

@router.get("/{id}")
async def game_from_id(session : ClientSession, id : str) -> Any:
    response = await get_game(session=session, game_id=id)
    return response


@router.get("/")
async def game(session : ClientSession) -> List[Any]:
    response = await get_games(session=session)
    return response




