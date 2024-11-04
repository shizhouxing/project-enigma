from typing import List

from fastapi import APIRouter

from api.deps import ClientSession
from api.crud import get_models
from api.models import ModelPublic, Model
router = APIRouter()


@router.get("/")
async def get_public_models(session : ClientSession) -> List[ModelPublic]:
    models : List[Model]= await get_models(session=session)
    return [ModelPublic.from_model(model) for model in models]