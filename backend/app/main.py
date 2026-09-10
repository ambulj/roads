import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.api import websockets
from app.services.synthetic_generator import synthetic_generator_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Start background fleet simulation loop (fast 2-second pings)
    sim_task = asyncio.create_task(websockets.simulation_loop())
    
    # 2. Start 5-minute (300s) synthetic data generation loop
    synthetic_interval = int(os.getenv("SYNTHETIC_INTERVAL_SECONDS", "300"))
    synth_task = asyncio.create_task(synthetic_generator_loop(interval_seconds=synthetic_interval))
    
    yield
    
    sim_task.cancel()
    synth_task.cancel()
    try:
        await asyncio.gather(sim_task, synth_task, return_exceptions=True)
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Edge-AI and WebGIS Road Intelligence Platform for Public Transit Fleets",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API router
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

# Mount WebSocket router
app.include_router(websockets.router)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "RoadSaarthi Core Intelligence Engine",
        "version": settings.VERSION,
        "mode": "Sovereign Self-Hosted Standalone"
    }

@app.get("/live", tags=["System"])
def liveness_probe():
    return {"status": "alive", "timestamp": "now"}

@app.get("/ready", tags=["System"])
def readiness_probe():
    from app.storage.database import engine
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "unready", "error": str(e)}

@app.get("/", tags=["System"])
def root():
    return {
        "title": "RoadSaarthi API",
        "docs_url": "/docs",
        "health_url": "/health",
        "live_url": "/live",
        "ready_url": "/ready",
        "webgis_dashboard": "http://localhost:5173"
    }
