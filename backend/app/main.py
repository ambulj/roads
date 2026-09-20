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

    # 1. Start background fleet simulation loop if enabled (advances bus GPS positions)
    if settings.ENABLE_FLEET_SIMULATION and not settings.DEMO_MODE:
        sim_task = asyncio.create_task(websockets.simulation_loop())
    
    # NOTE: Automatic continuous synthetic generation is disabled.
    # Synthetic telemetry is generated strictly on-demand when the user clicks the Command Center button.
    
    yield
    
    if sim_task is not None:
        sim_task.cancel()
        try:
            await asyncio.gather(sim_task, return_exceptions=True)
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
        "service": "SheherSaathi Core Intelligence Engine",
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
        "title": "SheherSaathi API",
        "docs_url": "/docs",
        "health_url": "/health",
        "live_url": "/live",
        "ready_url": "/ready",
        "webgis_dashboard": "http://localhost:5173"
    }
