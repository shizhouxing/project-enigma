"""Entrance file """
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from api.core.config import settings
from api.routes import login, user, game, models, game_session
from api.backend_ping_test import db_ping_server
from api.cron import compute_leaderboard, check_model_tokens_usage

def custom_generate_unique_id(route: APIRoute) -> str:
    if len(route.tags) > 0:
        return f"{route.tags[0]}-{route.name}"
    else:
        return f'{route.name}'


@asynccontextmanager
async def lifespan(_app : FastAPI):
    """ check if the server is up """
    # NOTE: before the server starts run these functions
    try :
        await db_ping_server()
        # foo()
    except Exception as e:
        raise e
    
    # NOTE Server has started
    yield
    
    # NOTE: if anything needs to be cleaned up put below here


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan
)

if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app.include_router(login.router, tags=["login"])
app.include_router(user.router,  tags=["user"])
app.include_router(game.router, prefix="/game", tags=["game"])
app.include_router(game_session.router, prefix="/session", tags=["game", "session"])
app.include_router(models.router, prefix="/model", tags=["model"])


@app.get("/health/")
def health_check() -> dict:
    return { "status" : "Server is function and working" }