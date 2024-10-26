"""Entrance file """
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from api.core.config import settings
from api.routes import login, user
from api.backend_ping_test import db_ping_server

def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

@asynccontextmanager
async def lifespan(_app : FastAPI):
    """ check if the server is up """
    # NOTE: before the server starts run these functions
    try :
        await db_ping_server()
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
