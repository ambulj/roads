"""
================================================================================
  SheherSaathi API Router - Two-Tier Urban Intelligence Architecture
================================================================================
  Tier 1: On-Bus Edge Intelligence & Low-Bandwidth Telemetry Ingestion Layer
  Tier 2: Centralized Civic Command, GIS Analytics & Multi-Agency Operations
================================================================================
"""

from fastapi import APIRouter
from app.api.endpoints import (
    telemetry, clusters, work_orders, fleet, analytics, incidents,
    models, streams, auth, traffic, dispatch, simulation, learning, road_memory, city_brain, privacy, evidence,
    pedestrian
)
from app.api import websockets

api_router = APIRouter()

# ── TIER 1: ON-BUS EDGE INTELLIGENCE & TELEMETRY INGESTION ──────────────────
api_router.include_router(
    telemetry.router, 
    prefix="/telemetry", 
    tags=["[Tier 1 Edge] Sensor Fusion, Buffer Sync & Telematics Ingestion"]
)
api_router.include_router(
    fleet.router, 
    prefix="/fleet", 
    tags=["[Tier 1 Edge] Fleet Edge Nodes, NPU Hardware & CCTV DVRs"]
)
api_router.include_router(
    models.router, 
    prefix="/models", 
    tags=["[Tier 1 Edge] AI Model Registry, SHA-256 Checksums & RKNN Matrix"]
)
api_router.include_router(
    streams.router, 
    prefix="/streams", 
    tags=["[Tier 1 Edge] Zero-Hardware RTSP Streams & Keyframe Extraction"]
)
api_router.include_router(
    learning.router, 
    prefix="/learning", 
    tags=["[Tier 1 Edge] Continuous Active Learning & Empiric Retraining"]
)
api_router.include_router(
    privacy.router, 
    prefix="/privacy", 
    tags=["[Tier 1 Edge] DPDP Act 2023 On-Edge Anonymization & Face Masking"]
)

# ── TIER 2: CENTRALIZED CIVIC COMMAND & MUNICIPAL PLATFORM ──────────────────
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["[Tier 2 Central] Officer Authentication, RBAC & Personas"]
)
api_router.include_router(
    clusters.router, 
    prefix="/clusters", 
    tags=["[Tier 2 Central] 15m DBSCAN Road Distress Clusters & Consensus"]
)
api_router.include_router(
    incidents.router, 
    prefix="/incidents", 
    tags=["[Tier 2 Central] Traffic Violations, Hit-and-Run & ANPR Docket"]
)
api_router.include_router(
    pedestrian.router, 
    prefix="/pedestrian-safety", 
    tags=["[Tier 2 Central] Vision Zero, School Zone & Hospital Safety Radar"]
)
api_router.include_router(
    traffic.router, 
    prefix="/traffic", 
    tags=["[Tier 2 Central] Vehicle Density, IRC:106 Congestion & Bottlenecks"]
)
api_router.include_router(
    work_orders.router, 
    prefix="/work-orders", 
    tags=["[Tier 2 Central] PWD Work Orders, Contractor SLA & Debarment"]
)
api_router.include_router(
    analytics.router, 
    prefix="/analytics", 
    tags=["[Tier 2 Central] GTFS Transit Delays, Markov Decay & Risk Index"]
)
api_router.include_router(
    dispatch.router, 
    prefix="/dispatch", 
    tags=["[Tier 2 Central] PCR 112 Emergency Alert & Radio Dispatch"]
)
api_router.include_router(
    evidence.router, 
    prefix="/evidence", 
    tags=["[Tier 2 Central] Forensic Evidence Vault & Chain of Custody"]
)
api_router.include_router(
    road_memory.router, 
    prefix="/road-memory", 
    tags=["[Tier 2 Central] Road Deterioration Time Machine & Digital Twin"]
)
api_router.include_router(
    city_brain.router, 
    prefix="/city-brain", 
    tags=["[Tier 2 Central] City Brain Autonomous Resource Orchestration"]
)
api_router.include_router(
    simulation.router, 
    prefix="/simulation", 
    tags=["[Tier 2 Central] Synthetic Data Generation & Lifecycle Simulator"]
)
