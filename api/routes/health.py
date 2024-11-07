import time
import urllib.parse
import aiohttp
import asyncio
import urllib
from datetime import datetime, UTC
from typing import Dict, Any


from fastapi import APIRouter, HTTPException, status

from api.core.config import settings

async def check_model_service(model_endpoint: str) -> Dict[str, str]:
    try:
        
        base_url = f"{settings.FRONTEND_HOST}/api/"
        endpoint = urllib.parse.urljoin(base_url, model_endpoint)
        print(endpoint)
        async with aiohttp.ClientSession() as session:
            start_time = time.time()
            async with session.get(endpoint, timeout=5) as response:
                end_time = time.time()
                return {
                    "endpoint" : endpoint,
                    "status": response.status,
                    "latency": f"{(end_time - start_time):.2f}s"
                }
    except Exception as e:
        return {"status": "error", "message": str(e)}

from api.backend_ping_test import db_ping_server

router = APIRouter()

@router.get("/health/")
async def health_check() -> Dict[str, Any]:
    start_time = datetime.now(UTC)
    
    # Run all health checks concurrently
    checks = await asyncio.gather(
        db_ping_server(),
        check_model_service("game/?s=0"),
        return_exceptions=True
    )
    
    end_time = datetime.now(UTC)
    response_time = (end_time - start_time).total_seconds()
    
    health_status = {
        "status": "healthy",  # Will be updated based on checks
        "timestamp": datetime.now(UTC).isoformat(),
        "response_time": f"{response_time:.2f}s",
        "services": {
            "mongoDB": checks[0],
            "dependencies": {
                "model_service": checks[1]
            },
            "api": {
                "version": "1.0.0",  # Replace with your API version
            }
        },
        "environment": settings.ENVIRONMENT  # Add this during app initialization
    }
    
    # Determine overall status
    if any(check.get("status") == "error" for check in [
        checks[0],  # MongoDB
        checks[1]   # Model Service
    ]):
        health_status["status"] = "error"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )

    
    return health_status