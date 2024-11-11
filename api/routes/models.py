from typing import List

from fastapi import APIRouter

from api.deps import Database
from api.crud import get_models
from api.models import ModelPublic, Model
router = APIRouter()


@router.get("/")
async def get_public_models(db : Database) -> List[ModelPublic]:
    models : List[Model]= await get_models(db=db)
    return [ModelPublic.from_model(model) for model in models]