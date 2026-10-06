import datetime
import uuid
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.db_models import (
    DBDistressCluster, DBRepairAudit, DBRawIngest, DBAuditLog
)
from app.spatial.poi_database import haversine_distance_m


# ── Canonical Verification Constants ─────────────────────────────────────────
REQUIRED_DISTINCT_BUSES: int = 3
MONITORING_WINDOW_HOURS: int = 48
VERTICAL_GZ_TOLERANCE: float = 0.15      # |gz - 1.0| < 0.15g -> 0.85g <= gz <= 1.15g
SHOCK_FAILURE_THRESHOLD: float = 0.35    # |gz - 1.0| >= 0.35g -> gz >= 1.35g or gz <= 0.65g
CORRIDOR_MATCH_METERS: float = 15.0


# ── Concurrence Data Schemas ─────────────────────────────────────────────────
class ConcurrencePassItem(BaseModel):
    bus_id: str
    vertical_gz: float
    optical_status: str
    passed_optical: bool
    passed_imu: bool
    timestamp: str

    def __getitem__(self, item):
        return getattr(self, item)


class ConcurrenceEvaluationResult(BaseModel):
    order_id: str
    status: str
    distinct_buses_count: int
    required_buses_count: int = REQUIRED_DISTINCT_BUSES
    window_hours: int = MONITORING_WINDOW_HOURS
    passes: List[ConcurrencePassItem] = Field(default_factory=list)
    invoice_clearance_authorized: bool = False
    escrow_holdback_released: bool = False
    failure_reason: Optional[str] = None

    def __getitem__(self, item):
        return getattr(self, item)


# ── Concurrence Logic Engine ─────────────────────────────────────────────────
def evaluate_concurrence_passes(
    passes: List[Dict[str, Any]], 
    order_id: str = "WO-UNKNOWN"
) -> ConcurrenceEvaluationResult:
    """
    Evaluates multi-pass transit telematics against physical concurrence gates:
      1. Cross-Bus Diversity: Requires passes from at least 3 distinct transit fleet vehicles (bus_ids).
      2. Dual-Sensor Criteria:
         - Optical: SMOOTH_SURFACE (or cavity confidence < 0.10)
         - IMU: |gz - 1.0| < 0.15g (0.85g <= gz <= 1.15g)
      3. Recurrence Shock:
         - If any pass exhibits severe shock (|gz - 1.0| >= 0.35g) or open cavity,
           immediately marks status = REPAIR_FAILED_RECURRENCE.
      4. Clearance:
         - If at least 3 distinct buses satisfy dual sensor criteria:
           status = REPAIR_VERIFIED, invoice_clearance_authorized = True, escrow_holdback_released = True.
         - Otherwise:
           status = AWAITING_CONCURRENCE, invoice_clearance_authorized = False.
    """
    processed_passes: List[ConcurrencePassItem] = []
    severe_failure = False
    failure_reasons = []

    for p in passes:
        bus_id = str(p.get("bus_id") or p.get("verifying_bus_id") or "BUS-UNKNOWN")
        gz = float(p.get("vertical_gz") if "vertical_gz" in p else p.get("vertical_g_force", 1.0))
        optical_status = str(p.get("optical_status") or "SMOOTH_SURFACE")
        timestamp = str(p.get("timestamp") or p.get("captured_at") or p.get("verified_at") or datetime.datetime.now(datetime.timezone.utc).isoformat())
        confidence = float(p.get("confidence", 0.0))

        delta_gz = round(abs(gz - 1.0), 4)
        is_cavity = optical_status.upper() in (
            "CAVITY_DETECTED", "RECURRENT_CAVITY_DETECTED", "D40", "OPEN_CAVITY", "CAVITY"
        ) or ("CAVITY" in optical_status.upper())
        is_severe_shock = delta_gz >= SHOCK_FAILURE_THRESHOLD

        passed_optical = (optical_status.upper() == "SMOOTH_SURFACE" or confidence < 0.10) and not is_cavity
        passed_imu = delta_gz < VERTICAL_GZ_TOLERANCE

        pass_item = ConcurrencePassItem(
            bus_id=bus_id,
            vertical_gz=gz,
            optical_status=optical_status,
            passed_optical=passed_optical,
            passed_imu=passed_imu,
            timestamp=timestamp
        )
        processed_passes.append(pass_item)

        if is_severe_shock or is_cavity:
            severe_failure = True
            reason = f"Severe shock ({gz:.2f}g)" if is_severe_shock else f"Cavity detected ({optical_status})"
            failure_reasons.append(f"{bus_id}: {reason}")

    if severe_failure:
        unique_buses = len(set(p.bus_id for p in processed_passes))
        return ConcurrenceEvaluationResult(
            order_id=order_id,
            status="REPAIR_FAILED_RECURRENCE",
            distinct_buses_count=unique_buses,
            required_buses_count=REQUIRED_DISTINCT_BUSES,
            window_hours=MONITORING_WINDOW_HOURS,
            passes=processed_passes,
            invoice_clearance_authorized=False,
            escrow_holdback_released=False,
            failure_reason="; ".join(failure_reasons)
        )

    # Filter for passes that satisfy BOTH optical and IMU criteria
    qualifying_passes = [p for p in processed_passes if p.passed_optical and p.passed_imu]
    distinct_qualifying_buses = set(p.bus_id for p in qualifying_passes)
    distinct_count = len(distinct_qualifying_buses)

    if distinct_count >= REQUIRED_DISTINCT_BUSES:
        return ConcurrenceEvaluationResult(
            order_id=order_id,
            status="REPAIR_VERIFIED",
            distinct_buses_count=distinct_count,
            required_buses_count=REQUIRED_DISTINCT_BUSES,
            window_hours=MONITORING_WINDOW_HOURS,
            passes=processed_passes,
            invoice_clearance_authorized=True,
            escrow_holdback_released=True,
            failure_reason=None
        )
    else:
        return ConcurrenceEvaluationResult(
            order_id=order_id,
            status="AWAITING_CONCURRENCE",
            distinct_buses_count=distinct_count,
            required_buses_count=REQUIRED_DISTINCT_BUSES,
            window_hours=MONITORING_WINDOW_HOURS,
            passes=processed_passes,
            invoice_clearance_authorized=False,
            escrow_holdback_released=False,
            failure_reason=f"Insufficient distinct fleet passes: {distinct_count}/{REQUIRED_DISTINCT_BUSES} verified."
        )


def evaluate_work_order_concurrence(
    order_id: str,
    db: Session,
    passes: Optional[List[Dict[str, Any]]] = None
) -> ConcurrenceEvaluationResult:
    """
    Evaluates physical concurrence for a cluster in the database.
    Queries DBRepairAudit and DBRawIngest within 15m radius of the cluster.
    If passes satisfy criteria: updates cluster to 'resolved' and 'REPAIR_VERIFIED'.
    If shock or cavity detected: updates cluster to 'REPAIR_FAILED_RECURRENCE' and invokes execute_contractor_auto_debit.
    """
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == order_id) | (DBDistressCluster.cluster_code == order_id)
    ).first()

    if not cluster:
        # Return fallback evaluation if cluster not in persistent table
        effective_passes = passes or []
        return evaluate_concurrence_passes(effective_passes, order_id=order_id)

    collected_passes: List[Dict[str, Any]] = []

    if passes is not None:
        collected_passes = list(passes)
    else:
        # 1. Query existing DBRepairAudit records for this cluster
        audits = db.query(DBRepairAudit).filter(
            (DBRepairAudit.cluster_id == cluster.id) | (DBRepairAudit.cluster_code == cluster.cluster_code)
        ).all()
        for a in audits:
            collected_passes.append({
                "bus_id": a.verifying_bus_id,
                "vertical_gz": a.vertical_gz,
                "optical_status": a.optical_status,
                "timestamp": a.verified_at or cluster.updated_at
            })

        # 2. Query DBRawIngest records within 15 meters of cluster coordinates
        is_postgres = False
        try:
            if db.bind and db.bind.dialect.name == "postgresql":
                is_postgres = True
        except Exception:
            pass

        if is_postgres:
            stmt = text("""
                SELECT bus_id, vertical_g_force, defect_type, confidence, captured_at
                FROM raw_ingests
                WHERE geom IS NOT NULL
                  AND ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
                ORDER BY captured_at DESC
            """)
            rows = db.execute(stmt, {
                "lat": cluster.lat, 
                "lng": cluster.lng, 
                "buffer_m": CORRIDOR_MATCH_METERS
            }).mappings().all()
            for r in rows:
                optical = "SMOOTH_SURFACE" if r["defect_type"] in ("SMOOTH_SURFACE", "smooth", "none") or (r["confidence"] < 0.10) else r["defect_type"]
                collected_passes.append({
                    "bus_id": r["bus_id"],
                    "vertical_gz": r["vertical_g_force"],
                    "optical_status": optical,
                    "confidence": r["confidence"],
                    "timestamp": r["captured_at"]
                })
        else:
            delta_deg = 0.00035
            raw_candidates = db.query(DBRawIngest).filter(
                DBRawIngest.lat.between(cluster.lat - delta_deg, cluster.lat + delta_deg),
                DBRawIngest.lng.between(cluster.lng - delta_deg, cluster.lng + delta_deg)
            ).all()
            for r in raw_candidates:
                dist = haversine_distance_m(cluster.lat, cluster.lng, r.lat, r.lng)
                if dist <= CORRIDOR_MATCH_METERS:
                    optical = "SMOOTH_SURFACE" if r.defect_type in ("SMOOTH_SURFACE", "smooth", "none") or (r.confidence < 0.10) else r.defect_type
                    collected_passes.append({
                        "bus_id": r.bus_id,
                        "vertical_gz": r.vertical_g_force,
                        "optical_status": optical,
                        "confidence": r.confidence,
                        "timestamp": r.captured_at
                    })

    # Evaluate the passes
    result = evaluate_concurrence_passes(collected_passes, order_id=cluster.cluster_code or cluster.id)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if result.status == "REPAIR_FAILED_RECURRENCE":
        cluster.status = "REPAIR_FAILED_RECURRENCE"
        cluster.verification_status = "REPAIR_FAILED_RECURRENCE"
        cluster.updated_at = now_iso

        # Invoke autonomous contractor penalty debit
        from app.services.contractor_service import execute_contractor_auto_debit
        failing_pass = next(
            (p for p in result.passes if abs(p.vertical_gz - 1.0) >= SHOCK_FAILURE_THRESHOLD or not p.passed_optical),
            None
        )
        failing_gz = failing_pass.vertical_gz if failing_pass else 1.48
        failing_bus = failing_pass.bus_id if failing_pass else "BUS-04"
        
        try:
            execute_contractor_auto_debit(
                db=db,
                cluster=cluster,
                measured_gz=failing_gz,
                bus_id=failing_bus,
                notes=f"Concurrence gating tripped: {result.failure_reason}"
            )
        except Exception as deb_err:
            print(f"[CONCURRENCE] Auto-debit execution warning: {deb_err}")

        db.commit()
        db.refresh(cluster)

    elif result.status == "REPAIR_VERIFIED":
        cluster.status = "resolved"
        cluster.verification_status = "REPAIR_VERIFIED"
        cluster.concurrence_passes_count = result.distinct_buses_count
        cluster.updated_at = now_iso

        # Record audit log
        db.add(DBAuditLog(
            id=f"audit-{uuid.uuid4().hex[:8]}",
            bus_id="FLEET_CONSENSUS",
            corridor=cluster.road_name,
            message=f"Multi-pass physical concurrence VERIFIED for {cluster.cluster_code} across {result.distinct_buses_count} distinct transit buses. Payment invoice clearance authorized.",
            latency_ms=35,
            type="CONCURRENCE_VERIFICATION",
            timestamp="Just now",
            created_at=now_iso
        ))

        # Record verified passes in DBRepairAudit if not already present
        for p in result.passes:
            existing = db.query(DBRepairAudit).filter(
                (DBRepairAudit.cluster_id == cluster.id) | (DBRepairAudit.cluster_code == cluster.cluster_code),
                DBRepairAudit.verifying_bus_id == p.bus_id
            ).first()
            if not existing:
                db.add(DBRepairAudit(
                    id=f"audit-rep-{uuid.uuid4().hex[:8]}",
                    cluster_id=cluster.id,
                    cluster_code=cluster.cluster_code,
                    contractor_name=cluster.assigned_agency,
                    road_name=cluster.road_name,
                    verifying_bus_id=p.bus_id,
                    vertical_gz=p.vertical_gz,
                    optical_status=p.optical_status,
                    audit_verdict="REPAIR_VERIFIED",
                    penalty_debit_inr=0.0,
                    statutory_clause="MoHUA IRC:SP:20 Clause 14.2 Concurrence Clearance",
                    notes="Automated multi-pass physical concurrence verified.",
                    verified_at=p.timestamp
                ))

        db.commit()
        db.refresh(cluster)

    else:
        # Awaiting concurrence
        cluster.verification_status = "AWAITING_CONCURRENCE"
        cluster.concurrence_passes_count = result.distinct_buses_count
        cluster.updated_at = now_iso
        db.commit()
        db.refresh(cluster)

    return result


def verify_cluster_concurrence(
    first_arg: Union[Session, str], 
    second_arg: Union[str, Session],
    passes: Optional[List[Dict[str, Any]]] = None
) -> ConcurrenceEvaluationResult:
    """
    Polymorphic wrapper supporting both verify_cluster_concurrence(db, cluster_id)
    and verify_cluster_concurrence(cluster_id, db).
    """
    if isinstance(first_arg, Session):
        db_sess: Session = first_arg
        cid: str = str(second_arg)
    else:
        cid = str(first_arg)
        db_sess = second_arg  # type: ignore

    return evaluate_work_order_concurrence(order_id=cid, db=db_sess, passes=passes)
