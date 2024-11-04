from api.utils import repeat_every, logger


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
    

    