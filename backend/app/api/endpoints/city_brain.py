"""
City Brain & Advanced AI Decision Architecture Endpoints
Exposes Points 51-90:
- Map matching, lane-level assignment, and 3D bounding box lifting
- Domain adaptation, monsoon specular glare filtering, and IRC:SP:55 construction zones
- Sensor cross-validation, GPS uncertainty covariance ellipse, and temperature calibration
- 6-Stage auditable lifecycle state machine and observation exponential decay
- Citywide chronic infrastructure failure recurrence engine (IRC:37)
- 0/1 Knapsack economic budget optimizer and Pareto trade-off curve
- Defensible XAI reasoning trace generator (MoRTH Section 198A)
- Command centre shift triage and alert-fatigue suppression (Top 20 Interventions)
- Federated learning (FedAvg) simulation and 3-tier bandwidth scheduler
- Edge NPU hardware diagnostics, SSD circular ring-buffer, and canary rollback
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from app.services.city_brain_engine import city_brain_engine
from app.services.road_memory_engine import road_memory_engine
from app.services.federated_edge_engine import federated_edge_engine
from app.services.map_matching_engine import map_matching_engine
from app.services.domain_adaptation_engine import domain_adaptation_engine
from app.services.sensor_fusion_engine import sensor_fusion_engine

router = APIRouter()

# --- Request / Response Pydantic Schemas ---

class BudgetOptimizationRequest(BaseModel):
    budget_lakhs: float = Field(10.0, description="Municipal capital budget in INR Lakhs", ge=0.5, le=200.0)
    target_corridor: Optional[str] = Field("ALL", description="Filter by corridor name or ALL")

class LifecycleTransitionRequest(BaseModel):
    cluster_id: str = Field(..., description="Distress cluster ID or cluster code")
    to_stage: str = Field(..., description="Target lifecycle stage: CANDIDATE, CONFIRMED, ESCALATED, MAINTENANCE, REINSPECTION, RESOLVED")
    actor_id: str = Field("MUNICIPAL_CHIEF_ENGINEER", description="Official or system actor authorizing transition")
    reason: Optional[str] = Field("Independent transit verification pass completed", description="Justification note")

class ObservationDecayRequest(BaseModel):
    initial_weight: float = Field(1.0, ge=0.0, le=1.0)
    age_days: float = Field(7.0, ge=0.0)
    defect_type: str = Field("D40", description="D40, D10, D20, or D00")

class MapMatchRequest(BaseModel):
    lat: float = Field(12.9516)
    lng: float = Field(80.1462)
    heading: float = Field(90.0)
    lateral_offset_m: float = Field(1.2)
    vehicle_type: str = Field("TRANSIT_BUS")

class BBox3DLiftRequest(BaseModel):
    bbox_2d: List[float] = Field([400.0, 500.0, 600.0, 680.0], description="[x1, y1, x2, y2] bounding box")
    camera_height_m: float = Field(2.45)
    pitch_angle_deg: float = Field(8.5)

class DomainAdaptationRequest(BaseModel):
    mean_luminance: float = Field(42.0, description="Mean image luminance 0-255")
    wet_road_flag: bool = Field(False)
    puddle_glare_candidate: bool = Field(False)

class FederatedRoundRequest(BaseModel):
    round_id: Optional[int] = Field(None, description="Round number (auto-increments if None)")
    participating_buses: Optional[List[str]] = Field(None, description="Subset of bus IDs")

class BandwidthScheduleRequest(BaseModel):
    event_type: str = Field("CRITICAL_POTHOLE")
    urgency: str = Field("HIGH")
    payload_bytes: int = Field(2048)
    cellular_available: bool = Field(True)
    depot_wifi_available: bool = Field(False)

class ModelRolloutRequest(BaseModel):
    model_version: str = Field("v2.4.1-in-morth")
    sha256_hash: str = Field("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    target_stage: str = Field("STAGE_2_CANARY_50_PCT")

class RollbackRequest(BaseModel):
    failed_version: str = Field("v2.4.1-in-morth")
    reason: str = Field("CANARY_INFERENCE_LATENCY_SPIKE_EXCEEDED_45MS")


# --- Endpoints ---

@router.post("/optimize-budget", summary="Economic 0/1 Knapsack Budget Optimizer")
def optimize_budget(req: BudgetOptimizationRequest):
    """
    Solves 0/1 Knapsack optimization to select the mathematically optimal set of interventions
    that maximizes citywide safety risk reduction (sum of Delta RPI * Vulnerable POI Multiplier).
    """
    result = city_brain_engine.optimize_budget_knapsack(
        budget_lakhs=req.budget_lakhs,
        target_corridor=req.target_corridor
    )
    return result

@router.get("/shift-triage", summary="Command Centre Shift Workload Triage")
def get_shift_triage(
    shift_name: str = Query("Morning Shift (06:00 - 14:00)"),
    max_items: int = Query(20, ge=5, le=50)
):
    """
    Filters alert noise and generates the definitive Top 20 Critical Interventions
    for active municipal command center shifts, with SLA priorities (P1, P2, P3).
    """
    return city_brain_engine.get_shift_workload_triage(shift_name=shift_name, max_items=max_items)

@router.get("/xai-trace/{entity_id}", summary="Defensible XAI Reasoning Trace Generator")
def get_xai_trace(entity_id: str):
    """
    Returns an auditable, legally defensible explanation of why a defect or violation
    was prioritized, including statutory liability citations (MoRTH Section 198A).
    """
    return city_brain_engine.generate_xai_reasoning_trace(cluster_or_incident_id=entity_id)

@router.get("/kpi/{cluster_id}", summary="Closed-Loop Safety KPI Measurement")
def get_kpi(cluster_id: str):
    """
    Computes verified post-repair safety improvement:
    Effectiveness % = (RPI_pre - RPI_post) / RPI_pre * 100
    """
    return city_brain_engine.measure_intervention_kpi(cluster_id=cluster_id)

@router.get("/chronic-failures", summary="Citywide Chronic Failure Recurrence Engine (IRC:37)")
def get_chronic_failures(
    window_days: int = Query(180, ge=30, le=365),
    threshold_events: int = Query(3, ge=2, le=10)
):
    """
    Identifies chronic pavement structural failure hotspots (>3 repair cycles in 6 months).
    Mandates IRC:37 full-depth sub-base reconstruction over superficial patch repairs.
    """
    return road_memory_engine.analyze_chronic_failures(
        window_days=window_days,
        threshold_events=threshold_events
    )

@router.post("/lifecycle/transition", summary="6-Stage Auditable Lifecycle Transition")
def transition_lifecycle(req: LifecycleTransitionRequest):
    """
    Transitions a defect through the auditable lifecycle:
    CANDIDATE -> CONFIRMED -> ESCALATED -> MAINTENANCE -> REINSPECTION -> RESOLVED.
    """
    result = road_memory_engine.transition_lifecycle_state(
        cluster_id=req.cluster_id,
        to_stage=req.to_stage,
        actor_id=req.actor_id,
        reason=req.reason
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/observation/decay", summary="Exponential Observation Decay Calculator")
def calculate_decay(req: ObservationDecayRequest):
    """
    Evaluates exponential decay of unconfirmed sensor evidence:
    w(t) = w_0 * exp(-lambda * delta_t) with half-life per defect type.
    """
    return road_memory_engine.calculate_observation_decay(
        initial_weight=req.initial_weight,
        age_days=req.age_days,
        defect_type=req.defect_type
    )

@router.post("/map-match", summary="Geospatial Map Matching & Lane-Level Assignment")
def map_match_point(req: MapMatchRequest):
    """
    Projects raw bus GPS coordinates onto road network segments, determines lane assignment
    (Lane 1, 2, 3), and detects dedicated bus-lane encroachments or wrong-way travel.
    """
    return map_matching_engine.match_gps_to_road(
        lat=req.lat,
        lng=req.lng,
        heading=req.heading,
        speed_kmh=40.0
    )

@router.post("/lift-3d", summary="Monocular Inverse Perspective Mapping (3D Lifting)")
def lift_bbox_to_3d(req: BBox3DLiftRequest):
    """
    Lifts 2D camera image coordinates to 3D ego-vehicle coordinates (X, Y, Z meters)
    using ground-plane assumption and calibrated camera intrinsics/extrinsics.
    """
    x1, y1, x2, y2 = req.bbox_2d
    w = max(1.0, x2 - x1)
    h = max(1.0, y2 - y1)
    cx = (x1 + x2) / 2.0 / 1280.0
    cy = (y1 + y2) / 2.0 / 720.0
    return map_matching_engine.lift_2d_to_3d(
        bbox_normalized={"x": cx, "y": cy, "w": w / 1280.0, "h": h / 720.0},
        camera_channel=1
    )

@router.post("/domain-adaptation", summary="Illumination Classification & Glare Suppression")
def classify_domain(req: DomainAdaptationRequest):
    """
    Classifies environmental illumination (Daylight, Twilight, Low Light, Headlight Glare),
    applies adaptive CLAHE parameters, and filters monsoon puddle specular reflections.
    """
    domain = domain_adaptation_engine.classify_illumination_domain(req.mean_luminance)
    specular_result = domain_adaptation_engine.detect_monsoon_specular_reflection(
        is_wet_road=req.wet_road_flag,
        candidate_pothole_has_high_specularity=req.puddle_glare_candidate
    )
    return {
        "illumination_domain": domain,
        "specular_reflection_analysis": specular_result,
        "irc_sp_55_construction_mode": domain_adaptation_engine.is_construction_mode_active()
    }

@router.get("/edge-diagnostics", summary="Fleet Edge NPU Diagnostics & SSD Ring-Buffer")
def get_edge_diagnostics():
    """
    Returns edge hardware telemetry across all transit buses: Rockchip RK3588 NPU temperatures,
    thermal throttling state, inference FPS, and 128GB SSD ring-buffer capacity.
    """
    return federated_edge_engine.get_fleet_edge_diagnostics()

@router.post("/federated-round", summary="Federated Learning (FedAvg) Training Round")
def run_federated_round(req: FederatedRoundRequest):
    """
    Executes a simulated federated learning aggregation round across fleet edge nodes,
    aggregating local parameter gradient deltas while preserving 99.9% bandwidth.
    """
    return federated_edge_engine.execute_federated_training_round(
        round_id=req.round_id,
        participating_buses=req.participating_buses
    )

@router.post("/bandwidth-schedule", summary="3-Tier Hierarchical Bandwidth Telemetry Scheduler")
def schedule_bandwidth(req: BandwidthScheduleRequest):
    """
    Intelligently routes telemetry packets to Tier 1 (4G/5G real-time),
    Tier 2 (Batch cellular), or Tier 3 (Depot Wi-Fi bulk offload).
    """
    return federated_edge_engine.schedule_telemetry_bandwidth(
        event_type=req.event_type,
        urgency=req.urgency,
        payload_bytes=req.payload_bytes,
        cellular_available=req.cellular_available,
        depot_wifi_available=req.depot_wifi_available
    )

@router.post("/model-rollout", summary="Cryptographic Model Verification & Canary Rollout")
def rollout_model(req: ModelRolloutRequest):
    """
    Verifies SHA-256 cryptographic digest of model weights and activates canary rollout.
    """
    result = federated_edge_engine.verify_and_rollout_model(
        model_version=req.model_version,
        sha256_hash=req.sha256_hash,
        target_stage=req.target_stage
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.post("/model-rollback", summary="Automated Canary Rollback")
def rollback_model(req: RollbackRequest):
    """
    Instantly rolls back fleet to the last known stable model checkpoint.
    """
    return federated_edge_engine.trigger_canary_rollback(
        failed_version=req.failed_version,
        reason=req.reason
    )
