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
    sim_task = None
    synth_task = None

    # 1. Start background fleet simulation loop if enabled
    if settings.ENABLE_FLEET_SIMULATION and not settings.DEMO_MODE:
        sim_task = asyncio.create_task(websockets.simulation_loop())
    
    # 2. Start 5-minute synthetic data generation loop if enabled
    if settings.ENABLE_SYNTHETIC_GENERATION and not settings.DEMO_MODE:
        synth_task = asyncio.create_task(synthetic_generator_loop(interval_seconds=settings.SYNTHETIC_INTERVAL_SECONDS))
    
    yield
    
    tasks_to_cancel = [t for t in (sim_task, synth_task) if t is not None]
    for t in tasks_to_cancel:
        t.cancel()
    if tasks_to_cancel:
        try:
            await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
        except Exception:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Edge-AI and WebGIS Road Intelligence Platform for Public Transit Fleets",
    lifespan=lifespan
)

# CORS configuration: Standard compliant (no wildcard with credentials)
is_wildcard = settings.CORS_ORIGINS == ["*"]
allow_creds = not is_wildcard

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not is_wildcard else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if not is_wildcard else None,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount REST API router
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

# Mount WebSocket router
app.include_router(websockets.router)

# Mount uploaded media directory
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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
