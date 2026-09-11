from fastapi import APIRouter
from app.api.endpoints import (
    telemetry, clusters, work_orders, fleet, analytics, incidents,
    models, streams, auth, traffic, dispatch, simulation, learning, road_memory, city_brain
)
from app.api import websockets

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Officer Authentication & RBAC"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry & Ingestion"])
api_router.include_router(traffic.router, prefix="/traffic", tags=["Vehicle Density & Bottlenecks"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["Hazard Clusters"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Traffic & Safety Incidents"])
api_router.include_router(work_orders.router, prefix="/work-orders", tags=["Work Orders & PWD"])
api_router.include_router(fleet.router, prefix="/fleet", tags=["Fleet Nodes & BOM"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Corridor Analytics"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["Multi-Channel Dispatch"])
api_router.include_router(models.router, prefix="/models", tags=["AI Models Registry"])
api_router.include_router(streams.router, prefix="/streams", tags=["Zero-Hardware Stream Connectors"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["Simulation & Demo Mode Control"])
api_router.include_router(learning.router, prefix="/learning", tags=["Self-Learning & Active Learning Pipeline"])
api_router.include_router(road_memory.router, prefix="/road-memory", tags=["Road Memory & AI Repair Verification"])
api_router.include_router(city_brain.router, prefix="/city-brain", tags=["City Brain Decision AI & Optimization"])



