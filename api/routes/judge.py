
from typing import Dict, Any

from fastapi import APIRouter

from api import crud
from api.judge import registry
from api.deps import Database
from api.models import Judge

router = APIRouter()


@router.get('/judge/{id}', tags=["Judge"])
async def get_judge(db : Database, id : str) -> Judge:
    try:
        response = await crud.get_judge_from_id(db=db, id=id)

    except Exception as e:
        raise e
    
    return response.model_dump()

@router.get("/judge/{id}/sample", tags=["Judge"])
async def get_sample(db : Database, id : str) -> Dict[str, Any]:
    try:
        response = await crud.get_judge_from_id(db=db, id=id)
        
        name = response.sampler.function.name
        sample = registry.get_sampler(name)()

    except Exception as e:
        raise e
    
    return sample 


@router.post("/judge/{id}/validate", tags=["Judge"])
async def validate_response(id : str, 
                            db : Database, 
                            promptPayload : Dict[str, Any]) -> bool:
    try:
        response = await crud.get_judge_from_id(db=db, id=id) 

        sample_name = response.validator.function.name
        sampled : Dict[str, Any] = registry.get_sampler(sample_name)()

        # check if metadata if so store it for model query
        metadata = sampled.pop("metadata", None)


        
        

        validator_name = response.validator.function.name
        is_valid = registry.get_validator(validator_name)(**{"source" : source} | kwd )

    except Exception as e:
        raise e
    
    return is_valid 



