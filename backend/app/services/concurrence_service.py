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
from app.services.sensor_fusion_engine import compute_normalized_shock, compute_gnorm


# ── Canonical Verification Constants ─────────────────────────────────────────
REQUIRED_DISTINCT_BUSES: int = 3
MONITORING_WINDOW_HOURS: int = 48
MIN_TRIP_SEPARATION_SECONDS: int = 7200  # 2 hours
VERTICAL_GZ_TOLERANCE: float = 0.15      # |gz - 1.0| < 0.15g -> 0.85g <= gz <= 1.15g (at 30 km/h)
SHOCK_FAILURE_THRESHOLD: float = 0.35    # |gz - 1.0| >= 0.35g -> gz >= 1.35g or gz <= 0.65g (at 30 km/h)
CORRIDOR_MATCH_METERS: float = 5.0       # Narrowed from 15.0m to lane-aligned buffer


# ── Concurrence Data Schemas ─────────────────────────────────────────────────
class ConcurrencePassItem(BaseModel):
    bus_id: str
    vertical_gz: Optional[float] = None
    speed_kmh: float = 30.0
    g_norm: float = 0.0
    optical_status: str
    passed_optical: bool
    passed_imu: bool
    is_no_data: bool = False
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
    recommend_release: bool = False
    proposed_deduction: float = 0.0
    approval_status: str = "PENDING_AE_REVIEW"
    officer_notes: Optional[str] = None
    invoice_clearance_authorized: bool = False
    escrow_holdback_released: bool = False
    failure_reason: Optional[str] = None

    def __getitem__(self, item):
        return getattr(self, item)


def parse_datetime_to_utc(dt_input: Union[str, datetime.datetime, None]) -> datetime.datetime:
    """Helper to parse varied date representations into timezone-aware UTC datetime."""
    if dt_input is None:
        return datetime.datetime.now(datetime.timezone.utc)
    if isinstance(dt_input, datetime.datetime):
        if dt_input.tzinfo is None:
            return dt_input.replace(tzinfo=datetime.timezone.utc)
        return dt_input.astimezone(datetime.timezone.utc)
    s = str(dt_input).strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.datetime.fromisoformat(s)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc)
        return dt.astimezone(datetime.timezone.utc)
    except Exception:
        pass
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d %b, %I:%M %p",
        "%d %b %Y",
        "%d %B %Y",
        "%Y/%m/%d",
    ):
        try:
            parsed = datetime.datetime.strptime(s, fmt)
            if "%Y" not in fmt:
                now_year = datetime.datetime.now(datetime.timezone.utc).year
                parsed = parsed.replace(year=now_year)
            return parsed.replace(tzinfo=datetime.timezone.utc)
        except Exception:
            continue
    return datetime.datetime.now(datetime.timezone.utc)


def get_repair_baseline_datetime(cluster: DBDistressCluster) -> datetime.datetime:
    """
    Extracts timezone-aware UTC datetime for repair completion.
    Hierarchical resolution: cluster.repair_completed_at -> cluster.updated_at -> cluster.created_at.
    """
    raw = getattr(cluster, "repair_completed_at", None) or cluster.updated_at or cluster.created_at
    return parse_datetime_to_utc(raw)


def select_qualifying_trip_passes(
    passes: List[Any], 
    min_separation_seconds: int = MIN_TRIP_SEPARATION_SECONDS
) -> List[Any]:
    """
    Groups passes by vehicle and applies the 2-hour separation window.
    Sorts passes chronologically, then filters so each vehicle can contribute
    multiple passes only if separated by >= min_separation_seconds (7,200s).
    Passes from the same vehicle within < 2 hours are suppressed as intra-trip duplicates.
    """
    if not passes:
        return []

    def get_ts(p):
        if isinstance(p, dict):
            raw = p.get("timestamp") or p.get("captured_at") or p.get("verified_at") or ""
        else:
            raw = getattr(p, "timestamp", "")
        if isinstance(raw, datetime.datetime):
            return raw
        try:
            return datetime.datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        except Exception:
            return datetime.datetime.now(datetime.timezone.utc)

    def get_bus(p):
        if isinstance(p, dict):
            return str(p.get("bus_id") or p.get("verifying_bus_id") or "BUS-UNKNOWN")
        return str(getattr(p, "bus_id", "BUS-UNKNOWN"))

    try:
        sorted_passes = sorted(passes, key=get_ts)
    except Exception:
        sorted_passes = list(passes)

    qualifying: List[Any] = []
    last_pass_time_by_bus: Dict[str, datetime.datetime] = {}

    for p in sorted_passes:
        bus = get_bus(p)
        t = get_ts(p)

        if bus not in last_pass_time_by_bus:
            last_pass_time_by_bus[bus] = t
            qualifying.append(p)
        else:
            delta_sec = (t - last_pass_time_by_bus[bus]).total_seconds()
            if delta_sec >= min_separation_seconds:
                last_pass_time_by_bus[bus] = t
                qualifying.append(p)

    return qualifying


# ── Concurrence Logic Engine ─────────────────────────────────────────────────
def evaluate_concurrence_passes(
    passes: List[Dict[str, Any]], 
    order_id: str = "WO-UNKNOWN"
) -> ConcurrenceEvaluationResult:
    """
    Evaluates multi-pass transit telematics against physical concurrence gates:
      1. Trip-Windowed Multi-Pass Diversity:
         Requires at least 3 qualifying patrol passes within 48 hours. A pass qualifies
         from a distinct vehicle ID OR from the same vehicle on distinct trips
         separated by at least 2 hours (delta_t >= 7,200 seconds).
      2. Dual-Sensor Criteria & Optical Clearance Dominance:
         - Optical: SMOOTH_SURFACE (or cavity confidence < 0.10 and not cavity).
           Confirms repaired road surface without requiring vehicle wheel collision.
         - IMU: g_norm < 0.15 (at 30 km/h baseline, |gz - 1.0| < 0.15g).
      3. Fail-Closed Missing Sensor Handling & Crawl Speeds:
         - Any pass with missing vertical acceleration, missing optical status,
           or vehicle speed < 15 km/h fails closed as NO_DATA. It never counts toward
           clean pass quorum, nor does it falsely fail a repair.
      4. Recurrence Shock Override & Empirical Penalty:
         - If any valid pass exhibits severe shock (g_norm >= 0.35g) or open cavity,
           immediately marks status = REPAIR_FAILED_RECURRENCE.
         - Proposes Clause 14 deduction only citing empirical tripping pass; zero deduction if none.
      5. Structured Officer Recommendations:
         - Replaces unilateral autonomous payment releases with recommend_release,
           proposed_deduction, and PENDING_AE_REVIEW / RECOMMENDED_BY_AE approval statuses.
    """
    processed_passes: List[ConcurrencePassItem] = []
    severe_failure = False
    failure_reasons = []

    for p in passes:
        bus_id = str(p.get("bus_id") or p.get("verifying_bus_id") or "BUS-UNKNOWN")
        gz_val = p.get("vertical_gz") if "vertical_gz" in p else p.get("vertical_g_force")
        has_gz = gz_val is not None
        optical_val = p.get("optical_status")
        has_optical = optical_val is not None
        speed_raw = p.get("speed_kmh")
        speed_kmh = float(speed_raw) if speed_raw is not None else 30.0
        timestamp = str(p.get("timestamp") or p.get("captured_at") or p.get("verified_at") or datetime.datetime.now(datetime.timezone.utc).isoformat())
        confidence = float(p.get("confidence", 0.0))

        # Fail-closed NO_DATA criteria: missing sensors or crawl speed < 15 km/h
        if not has_gz or not has_optical or speed_kmh < 15.0:
            pass_item = ConcurrencePassItem(
                bus_id=bus_id,
                vertical_gz=float(gz_val) if has_gz else None,
                speed_kmh=speed_kmh,
                g_norm=0.0,
                optical_status="NO_DATA",
                passed_optical=False,
                passed_imu=False,
                is_no_data=True,
                timestamp=timestamp
            )
            processed_passes.append(pass_item)
            continue

        gz = float(gz_val)
        optical_status = str(optical_val)

        # Speed-normalized shock jerk G_norm = |Gz - 1.0| / (v / 30.0)
        speed_factor = max(0.5, speed_kmh / 30.0)
        g_norm = abs(gz - 1.0) / speed_factor

        is_cavity = optical_status.upper() in (
            "CAVITY_DETECTED", "RECURRENT_CAVITY_DETECTED", "D40", "OPEN_CAVITY", "CAVITY"
        ) or ("CAVITY" in optical_status.upper())
        is_severe_shock = g_norm >= SHOCK_FAILURE_THRESHOLD

        passed_optical = (optical_status.upper() == "SMOOTH_SURFACE" or confidence < 0.10) and not is_cavity
        passed_imu = g_norm < VERTICAL_GZ_TOLERANCE

        pass_item = ConcurrencePassItem(
            bus_id=bus_id,
            vertical_gz=gz,
            speed_kmh=speed_kmh,
            g_norm=round(g_norm, 4),
            optical_status=optical_status,
            passed_optical=passed_optical,
            passed_imu=passed_imu,
            is_no_data=False,
            timestamp=timestamp
        )
        processed_passes.append(pass_item)

        if is_severe_shock or is_cavity:
            severe_failure = True
            reason = f"Severe shock ({gz:.2f}g, g_norm={g_norm:.2f})" if is_severe_shock else f"Cavity detected ({optical_status})"
            failure_reasons.append(f"{bus_id}: {reason}")

    if severe_failure:
        qualified_trips = select_qualifying_trip_passes(
            [p for p in processed_passes if not p.is_no_data], 
            min_separation_seconds=MIN_TRIP_SEPARATION_SECONDS
        )
        empirical_tripping_pass = next(
            (p for p in processed_passes if not p.is_no_data and (p.g_norm >= SHOCK_FAILURE_THRESHOLD or not p.passed_optical)),
            None
        )
        proposed_deduction = 0.0
        if empirical_tripping_pass:
            from app.services.contractor_service import calculate_clause14_penalty
            proposed_deduction = calculate_clause14_penalty(1).amount

        return ConcurrenceEvaluationResult(
            order_id=order_id,
            status="REPAIR_FAILED_RECURRENCE",
            distinct_buses_count=len(qualified_trips),
            required_buses_count=REQUIRED_DISTINCT_BUSES,
            window_hours=MONITORING_WINDOW_HOURS,
            passes=processed_passes,
            recommend_release=False,
            proposed_deduction=proposed_deduction,
            approval_status="PENDING_AE_REVIEW",
            officer_notes="Defect recurrence detected by patrol telematics. Form 14 statutory notice proposed under 7-day cure window.",
            invoice_clearance_authorized=False,
            escrow_holdback_released=False,
            failure_reason="; ".join(failure_reasons)
        )

    # Filter for passes that satisfy BOTH optical and IMU criteria and NOT NO_DATA
    qualifying_passes = [p for p in processed_passes if not p.is_no_data and p.passed_optical and p.passed_imu]
    qualified_trips = select_qualifying_trip_passes(qualifying_passes, min_separation_seconds=MIN_TRIP_SEPARATION_SECONDS)
    distinct_count = len(qualified_trips)

    if distinct_count >= REQUIRED_DISTINCT_BUSES:
        return ConcurrenceEvaluationResult(
            order_id=order_id,
            status="REPAIR_VERIFIED",
            distinct_buses_count=distinct_count,
            required_buses_count=REQUIRED_DISTINCT_BUSES,
            window_hours=MONITORING_WINDOW_HOURS,
            passes=processed_passes,
            recommend_release=True,
            proposed_deduction=0.0,
            approval_status="RECOMMENDED_BY_AE",
            officer_notes="Physical concurrence verified across distinct trips. Payment release recommended for AE/EE sign-off.",
            invoice_clearance_authorized=True,
            escrow_holdback_released=False,
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
            recommend_release=False,
            proposed_deduction=0.0,
            approval_status="PENDING_AE_REVIEW",
            officer_notes=f"Awaiting remaining patrol passes ({distinct_count}/{REQUIRED_DISTINCT_BUSES} verified).",
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
    Queries DBRepairAudit and DBRawIngest within 5m lane corridor of the cluster,
    strictly windowed to [t_repair, t_repair + 48h].
    If passes satisfy criteria: updates cluster to 'resolved' and 'REPAIR_VERIFIED'.
    If shock or cavity detected: updates cluster to 'REPAIR_FAILED_RECURRENCE', proposes Clause 14 penalty,
    and drafts Form 14 notice without unilateral automated escrow debit.
    """
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.id == order_id) | (DBDistressCluster.cluster_code == order_id)
    ).first()

    if not cluster:
        # Return fallback evaluation if cluster not in persistent table
        effective_passes = passes or []
        return evaluate_concurrence_passes(effective_passes, order_id=order_id)

    # Establish post-repair time window: [t_repair, t_repair + 48h]
    t_repair = get_repair_baseline_datetime(cluster)
    window_start = t_repair
    window_end = t_repair + datetime.timedelta(hours=MONITORING_WINDOW_HOURS)
    window_start_iso = window_start.isoformat()
    window_end_iso = window_end.isoformat()

    collected_passes: List[Dict[str, Any]] = []

    if passes is not None:
        collected_passes = list(passes)
    else:
        # 1. Query existing DBRepairAudit records for this cluster within post-repair window
        audits = db.query(DBRepairAudit).filter(
            (DBRepairAudit.cluster_id == cluster.id) | (DBRepairAudit.cluster_code == cluster.cluster_code)
        ).all()
        for a in audits:
            audit_dt = parse_datetime_to_utc(a.verified_at or cluster.updated_at)
            if window_start <= audit_dt <= window_end:
                collected_passes.append({
                    "bus_id": a.verifying_bus_id,
                    "vertical_gz": a.vertical_gz,
                    "optical_status": a.optical_status,
                    "timestamp": a.verified_at or cluster.updated_at
                })

        # 2. Query DBRawIngest records within 5 meters corridor and within post-repair window
        is_postgres = False
        try:
            if db.bind and db.bind.dialect.name == "postgresql":
                is_postgres = True
        except Exception:
            pass

        if is_postgres:
            stmt = text("""
                SELECT bus_id, vertical_g_force, defect_type, confidence, speed_kmh, captured_at
                FROM raw_ingests
                WHERE geom IS NOT NULL
                  AND ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
                  AND captured_at >= :window_start_iso
                  AND captured_at <= :window_end_iso
                ORDER BY captured_at ASC
            """)
            rows = db.execute(stmt, {
                "lat": cluster.lat, 
                "lng": cluster.lng, 
                "buffer_m": CORRIDOR_MATCH_METERS,
                "window_start_iso": window_start_iso,
                "window_end_iso": window_end_iso
            }).mappings().all()
            for r in rows:
                optical = "SMOOTH_SURFACE" if r["defect_type"] in ("SMOOTH_SURFACE", "smooth", "none") or (r["confidence"] < 0.10) else r["defect_type"]
                collected_passes.append({
                    "bus_id": r["bus_id"],
                    "vertical_gz": r["vertical_g_force"],
                    "speed_kmh": float(r["speed_kmh"]) if r.get("speed_kmh") is not None else 30.0,
                    "optical_status": optical,
                    "confidence": r["confidence"],
                    "timestamp": r["captured_at"]
                })
        else:
            delta_deg = 0.00006  # ~6.5m margin for 5m corridor
            raw_candidates = db.query(DBRawIngest).filter(
                DBRawIngest.lat.between(cluster.lat - delta_deg, cluster.lat + delta_deg),
                DBRawIngest.lng.between(cluster.lng - delta_deg, cluster.lng + delta_deg)
            ).all()
            for r in raw_candidates:
                dist = haversine_distance_m(cluster.lat, cluster.lng, r.lat, r.lng)
                if dist <= CORRIDOR_MATCH_METERS:
                    cap_dt = parse_datetime_to_utc(r.captured_at)
                    if window_start <= cap_dt <= window_end:
                        optical = "SMOOTH_SURFACE" if r.defect_type in ("SMOOTH_SURFACE", "smooth", "none") or (r.confidence < 0.10) else r.defect_type
                        collected_passes.append({
                            "bus_id": r.bus_id,
                            "vertical_gz": r.vertical_g_force,
                            "speed_kmh": float(r.speed_kmh) if r.speed_kmh is not None else 30.0,
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

        failing_pass = next(
            (p for p in result.passes if not p.is_no_data and (p.g_norm >= SHOCK_FAILURE_THRESHOLD or not p.passed_optical)),
            None
        )

        if failing_pass and failing_pass.vertical_gz is not None:
            from app.services.contractor_service import issue_form14_show_cause_notice
            try:
                issue_form14_show_cause_notice(
                    db=db,
                    cluster=cluster,
                    measured_gz=failing_pass.vertical_gz,
                    bus_id=failing_pass.bus_id,
                    notes=f"Concurrence gating tripped: {result.failure_reason}"
                )
            except Exception as notice_err:
                print(f"[CONCURRENCE] Statutory notice issuance warning: {notice_err}")
        else:
            result.proposed_deduction = 0.0

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
            message=f"Multi-pass physical concurrence VERIFIED for {cluster.cluster_code} across {result.distinct_buses_count} distinct transit buses. Recommended for AE/EE milestone payment sign-off.",
            latency_ms=35,
            type="CONCURRENCE_VERIFICATION",
            timestamp="Just now",
            created_at=now_iso
        ))

        # Record verified passes in DBRepairAudit if not already present
        for p in result.passes:
            if p.is_no_data:
                continue
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
                    vertical_gz=p.vertical_gz or 1.0,
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
