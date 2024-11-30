from api.utils import repeat_every, logger
from api.deps import get_database

from pymongo.results import DeleteResult

@repeat_every(seconds=60, logger=logger)
def check_model_tokens_usage():
    """
        function just check if the model token usages is getting low
        if so then we can email one of the maintainers to refile or
        turn of the model
    """
    ...


@repeat_every(seconds=60, logger=logger)
def compute_leaderboard():
    ...
    # spawn threads loop though all games in threads
    # run job
    

@repeat_every(seconds=60, logger=logger)
async def history_garbage_collection():
    """
        function just run a query within the backend 
        to clean up any forfeited games or game user 
        was afk
    """
    db = await get_database()
    result : DeleteResult = await db.sessions.delete_many({
        "completed": True,
        "$or": [
            { "visible": { "$exists": False } },
            { "visible": False },
            {
              "$expr": {
                  "$lt": [{ "$size": "$history" }, 1],
                },
            }
        ]
    })

    if result.deleted_count == 0:
        logger.info("Currently no empty sessions")
