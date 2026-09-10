from fastapi import APIRouter
from app.api.endpoints import telemetry, clusters, work_orders, fleet, analytics, incidents, models, streams
from app.api import websockets

api_router = APIRouter()

api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry & Ingestion"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["Hazard Clusters"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Traffic & Safety Incidents"])
api_router.include_router(work_orders.router, prefix="/work-orders", tags=["Work Orders & PWD"])
api_router.include_router(fleet.router, prefix="/fleet", tags=["Fleet Nodes & BOM"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Corridor Analytics"])

api_router.include_router(models.router, prefix="/models", tags=["AI Models Registry"])
api_router.include_router(streams.router, prefix="/streams", tags=["Zero-Hardware Stream Connectors"])
