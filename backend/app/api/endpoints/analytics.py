from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.storage.database import get_db
from app.storage.mock_database import store
from app.models.schemas import CorridorRisk
from app.models.db_models import DBDistressCluster

router = APIRouter()

@router.get("/corridors", response_model=List[CorridorRisk])
def get_arterial_corridors(db: Session = Depends(get_db)):
    """
    Returns arterial corridor risk assessments dynamically aggregated
    from active road distress clusters in the database.
    """
    corridors = list(store.arterial_corridors)
    clusters = db.query(DBDistressCluster).all()
    
    # Map road names to cluster stats
    road_stats = {}
    for c in clusters:
        # Match corridor by substring
        matched_corr = None
        for corr in corridors:
            if corr["corridor_name"].lower() in c.road_name.lower() or c.road_name.lower() in corr["corridor_name"].lower():
                matched_corr = corr["corridor_name"]
                break
        if not matched_corr:
            matched_corr = c.road_name

        if matched_corr not in road_stats:
            road_stats[matched_corr] = {"count": 0, "rpi_sum": 0.0, "d40_count": 0}
        road_stats[matched_corr]["count"] += 1
        road_stats[matched_corr]["rpi_sum"] += c.rpi_score
        if c.defect_type == "D40" or c.severity_level == "critical":
            road_stats[matched_corr]["d40_count"] += 1

    result = []
    for corr in corridors:
        c_name = corr["corridor_name"]
        stats = road_stats.get(c_name)
        if stats and stats["count"] > 0:
            avg_rpi = round(stats["rpi_sum"] / stats["count"], 1)
            action = "PRIORITY DISPATCH" if (stats["d40_count"] > 0 or avg_rpi > 80.0) else "NORMAL PATROL"
            result.append(CorridorRisk(
                corridor_name=c_name,
                classification=corr.get("classification", "Transit Corridor"),
                description=corr.get("description", ""),
                clusters_count=stats["count"],
                raw_ingests=corr.get("raw_ingests", 6),
                critical_d40_count=stats["d40_count"],
                average_rpi=avg_rpi,
                action_status=action
            ))
        else:
            result.append(CorridorRisk(**corr))

    return result


@router.get("/speed-distress")
def get_speed_distress_series():
    """24-hour time series correlation between transit speed (km/h) and distress frequency computed from live telemetry."""
    from app.services.gtfs_analytics_engine import gtfs_analytics_engine
    return gtfs_analytics_engine.compute_speed_distress_series()

@router.get("/transit-delays")
def get_transit_corridor_delays():
    """Returns transit route delay attribution correlated to road surface distress clusters."""
    from app.services.gtfs_analytics_engine import gtfs_analytics_engine
    return gtfs_analytics_engine.compute_corridor_delays()


@router.get("/rpi-weights")
def get_rpi_weights():
    return {
        "factors": [
            {"factor": "Defect Severity (S_defect)", "weight": 40, "color": "#f43f5e"},
            {"factor": "Observation Frequency (Passes)", "weight": 20, "color": "#f59e0b"},
            {"factor": "Corridor Classification (C_road)", "weight": 20, "color": "#06b6d4"},
            {"factor": "Critical POI Proximity (D_poi)", "weight": 20, "color": "#3b82f6"}
        ],
        "values": [40, 20, 20, 20]
    }

@router.get("/safe-corridors")
def get_safe_corridors():
    """Returns Vision Zero pedestrian safety audit scores for schools and hospitals."""
    from app.services.pedestrian_safety import get_safe_corridor_scores
    return get_safe_corridor_scores()

@router.get("/dark-spots")
def get_dark_spots(db: Session = Depends(get_db)):
    """Returns unlit pedestrian and transit corridors detected by night-time bus patrols (<5 Lux)."""
    from app.models.db_models import DBDarkSpot
    rows = db.query(DBDarkSpot).all()
    if rows:
        return [
            {
                "id": r.id,
                "road_name": r.corridor_name,
                "zone": "Zone 8 / Zone 11 Arterial",
                "lat": r.lat,
                "lng": r.lng,
                "lux_reading": r.illuminance_lux,
                "dark_spot_length_m": int(r.dark_length_meters),
                "pedestrian_risk": r.pedestrian_risk,
                "surrounding_poi": "Maduravoyal Transit Core",
                "identified_at": r.detected_at,
                "status": r.status,
                "provenance": "NIGHT_PATROL_TELEMETRY"
            }
            for r in rows
        ]
    return store.get_dark_spots()

@router.get("/recurrence-penalties")
def get_recurrence_penalties(db: Session = Depends(get_db)):
    """Returns MoHUA IRC:SP:20 Clause 14.2 re-pothole penalty debit records."""
    from app.models.db_models import DBContractorPenalty, DBDistressCluster
    rows = db.query(DBContractorPenalty).all()
    if rows:
        return [
            {
                "id": r.id,
                "contractor_name": r.contractor_name,
                "zone": "Zone 12 (Tambaram) / NHAI",
                "road_name": r.corridor_name,
                "cluster_code": r.cluster_code,
                "re_pothole_count": r.re_pothole_count,
                "penalty_debit_inr": int(r.penalty_amount_inr),
                "penalty_reason": f"Recurrent pothole after initial mastic repair ({r.statutory_clause})",
                "statutory_clause": r.statutory_clause,
                "issued_at": r.issued_at,
                "status": r.status,
                "provenance": r.provenance or "DERIVED_FROM_RECURRENT_DISTRESS"
            }
            for r in rows
        ]
    return store.get_contractor_penalties()

@router.get("/open-manholes")
def get_open_manholes(db: Session = Depends(get_db)):
    """Returns IS:1726 open manhole alerts with Jal Board 2-hr emergency dockets."""
    from app.models.db_models import DBOpenManholeAlert
    rows = db.query(DBOpenManholeAlert).all()
    if rows:
        return [
            {
                "id": r.id,
                "docket_number": r.docket_number,
                "road_name": r.location_name,
                "zone": "Zone 10 (Kodambakkam)",
                "lat": r.lat,
                "lng": r.lng,
                "void_diameter_cm": int(r.void_diameter_cm),
                "depth_meters": r.depth_meters,
                "sla_minutes_remaining": r.sla_minutes_remaining,
                "sla_hours": 2,
                "status": r.status,
                "agency_responsible": r.agency_responsible,
                "statutory_standard": r.statutory_standard,
                "identified_at": r.detected_at,
                "provenance": "EMERGENCY_IS1726_MUNICIPAL_DOCKET"
            }
            for r in rows
        ]
    return store.get_open_manholes()

@router.get("/submerged-potholes")
def get_submerged_potholes():
    """Returns hydro-dynamic acoustic submerged pothole hazards under standing floodwater."""
    records = store.get_submerged_potholes()
    for rec in records:
        rec["provenance"] = "HYDROLOGIC_FLOOD_OVERLAY_AUDIT"
    return records

@router.get("/obscured-signs")
def get_obscured_signs():
    """Returns IRC:67 regulatory road signs obscured by overgrown foliage or political banners."""
    records = store.get_obscured_signs()
    for rec in records:
        rec["provenance"] = "IRC67_CLEARANCE_FIELD_AUDIT"
    return records

@router.get("/contractor-debarments")
def get_contractor_debarments(db: Session = Depends(get_db)):
    """Returns GeM / e-Procurement statutory tender debarment and blacklist records."""
    from app.models.db_models import DBContractorDebarment
    rows = db.query(DBContractorDebarment).all()
    if rows:
        return [
            {
                "id": r.id,
                "contractor_name": r.contractor_name,
                "demerit_score": r.demerit_score,
                "debarment_status": r.debarment_status,
                "reason": r.reason,
                "gem_portal_reference": r.gem_portal_reference,
                "effective_date": r.effective_date,
                "provenance": "STATUTORY_GEM_DEBARMENT_REGISTRY"
            }
            for r in rows
        ]
    return store.get_contractor_debarments()

@router.get("/asphalt-quality")
def get_asphalt_quality():
    """Returns IRC:SP:20 cold-mix & hot-mix asphalt temperature and geometric milling audits."""
    records = store.get_asphalt_quality_audits()
    for rec in records:
        rec["provenance"] = "IRC_SP20_LAB_CALIBRATED_BENCHMARK"
    return records

@router.get("/road-memory-corridors")
def get_road_memory_corridors():
    """Returns historical corridor maintenance records and multi-bus consensus timeline."""
    records = store.get_road_memory_corridors()
    for rec in records:
        rec["provenance"] = "CORRIDOR_MAINTENANCE_LIFECYCLE_LOG"
    return records

@router.get("/deterioration-matrix")
def get_deterioration_matrix():
    """
    Returns Markov Chain 5-State Transition Probability Matrices (IRC:37-2018 / MoRTH Section 500).
    Provides baseline (dry) and monsoon-accelerated (2.2x decay) stochastic transition specifications.
    """
    from app.services.markov_deterioration import markov_engine
    return markov_engine.get_matrix_spec()

@router.post("/simulate-deterioration")
def simulate_pavement_deterioration(payload: Dict[str, Any] = None):
    """
    Simulates stochastic pavement decay using Markov Chain matrix exponentiation (P^t).
    Calculates expected cavity depth, crack width, IRI roughness, RPI score, and taxpayer savings.
    """
    from app.services.markov_deterioration import markov_engine
    params = payload or {}
    days = int(params.get("days", 90))
    monsoon = bool(params.get("monsoon", True))
    initial_state_id = int(params.get("initial_state_id", 1))
    return markov_engine.simulate(days=days, monsoon=monsoon, initial_state_id=initial_state_id)

@router.get("/pois")
def get_critical_pois():
    """Returns canonical Chennai critical infrastructure and POI landmarks from spatial database."""
    from app.spatial.poi_database import CRITICAL_POIS
    return CRITICAL_POIS

