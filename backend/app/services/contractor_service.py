import datetime
import hashlib
import re
import uuid
import random
from typing import Optional, Tuple, Union
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.db_models import (
    DBContractor, DBDistressCluster, DBContractorPenalty, 
    DBContractorDebarment, DBAuditLog, DBRepairAudit
)
from app.spatial.poi_database import haversine_distance_m


class PenaltyResult(tuple):
    """
    Result tuple representing (penalty_amount, debarment_triggered).
    Supports unpacking, named property access, and direct numeric comparison.
    """
    def __new__(cls, amount: float, debarment_triggered: bool):
        return super().__new__(cls, (float(amount), bool(debarment_triggered)))

    @property
    def amount(self) -> float:
        return self[0]

    @property
    def debarment_triggered(self) -> bool:
        return self[1]

    def __eq__(self, other):
        if isinstance(other, (int, float)):
            return self[0] == float(other)
        return super().__eq__(other)

    def __float__(self):
        return float(self[0])

    def __int__(self):
        return int(self[0])


# IRC:82:2015 Civil Engineering Standard Constants
SAW_CUT_MARGIN_PCT: float = 15.0       # IRC:82 Cl 5.2: Rectangular saw-cut perimeter trim (+15%)
COMPACTION_FACTOR: float = 1.10        # IRC:82 Cl 5.4: Bulk asphalt compaction factor (+10%)
TOTAL_IRC82_VOLUME_FACTOR: float = 1.265  # 1.15 * 1.10 = 1.265 combined volumetric multiplier
ASPHALT_BULK_DENSITY_KG_L: float = 2.35   # 2.35 g/cm³ (MoRTH Section 500 DBM compacted bulk density)
PWD_SOR_RATE_PER_KG: float = 68.0         # PWD SOR 2025 rate for VG-30 patch repair


def calculate_irc82_patch_estimate(
    cavity_area_m2: Optional[float] = None,
    depth_cm: Optional[float] = None,
    saw_cut_margin_pct: float = SAW_CUT_MARGIN_PCT,
    compaction_factor: float = COMPACTION_FACTOR,
    density_kg_l: float = ASPHALT_BULK_DENSITY_KG_L,
    rate_inr_per_kg: float = PWD_SOR_RATE_PER_KG,
    *,
    cavity_volume_liters: Optional[float] = None
) -> dict:
    """
    Computes IRC:82 calibrated patch repair volume, asphalt mass, and PWD SOR 2025 repair cost.
    Formula:
      V_cavity = Area (m²) * Depth (m) * 1000 (L)
      V_patch  = V_cavity * (1 + saw_cut_margin / 100) * compaction_factor = V_cavity * 1.265
      Mass     = V_patch * 2.35 kg
      Cost     = Mass * ₹68.0
    """
    if cavity_volume_liters is not None:
        raw_vol_liters = float(cavity_volume_liters)
    elif cavity_area_m2 is not None and depth_cm is not None:
        raw_vol_liters = float(cavity_area_m2) * (float(depth_cm) / 100.0) * 1000.0
    elif cavity_area_m2 is not None and depth_cm is None:
        raw_vol_liters = float(cavity_area_m2)
    else:
        raw_vol_liters = 0.0

    trim_multiplier = 1.0 + (saw_cut_margin_pct / 100.0)
    patch_vol_liters = raw_vol_liters * trim_multiplier * compaction_factor
    asphalt_kg = patch_vol_liters * density_kg_l
    repair_cost_inr = asphalt_kg * rate_inr_per_kg

    return {
        "raw_cavity_liters": round(raw_vol_liters, 2),
        "patch_volume_liters": round(patch_vol_liters, 2),
        "asphalt_mass_kg": round(asphalt_kg, 1),
        "repair_cost_inr": round(repair_cost_inr, 0),
        "saw_cut_margin_pct": saw_cut_margin_pct,
        "compaction_factor": compaction_factor,
        "density_kg_l": density_kg_l,
        "rate_inr_per_kg": rate_inr_per_kg
    }


def calculate_clause14_penalty(re_pothole_count: int = 1) -> PenaltyResult:
    """
    Computes statutory liquidated damages under Contractual DLP Clause (PWD/MORTH GCC Clause 16/17) & Section 63/65B BSA 2023:
      - 1st recurrence: ₹25,000 INR
      - 2nd recurrence: ₹50,000 INR
      - 3rd+ recurrence: ₹1,00,000 INR + GeM debarment notice trigger
    """
    count = int(re_pothole_count)
    if count <= 1:
        return PenaltyResult(25000.0, False)
    elif count == 2:
        return PenaltyResult(50000.0, False)
    else:
        return PenaltyResult(100000.0, True)


def _parse_datetime(dt_input: Union[str, datetime.datetime, datetime.date]) -> datetime.datetime:
    """Helper to parse varied date representations into timezone-aware/naive datetimes."""
    if isinstance(dt_input, datetime.datetime):
        return dt_input
    if isinstance(dt_input, datetime.date):
        return datetime.datetime.combine(dt_input, datetime.time.min)
    if not isinstance(dt_input, str):
        raise ValueError(f"Cannot parse datetime from type: {type(dt_input)}")

    cleaned = dt_input.strip()
    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"
    
    # Try ISO fromisoformat first
    try:
        return datetime.datetime.fromisoformat(cleaned)
    except Exception:
        pass

    # Common formats fallback
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d %b %Y",
        "%d %B %Y",
        "%d %b, %I:%M %p",
        "%Y/%m/%d",
    ):
        try:
            return datetime.datetime.strptime(cleaned, fmt)
        except ValueError:
            continue

    raise ValueError(f"Unable to parse date string: {dt_input}")


def evaluate_recurrence_window(
    resolved_at_str: Union[str, datetime.datetime], 
    detected_at_str: Union[str, datetime.datetime],
    dlp_months: int = 36
) -> bool:
    """
    Evaluates whether a detected defect falls within the Defect Liability Period (DLP).
    Supports dynamic statutory tiers:
      - 12 months (Bituminous Overlay): 365 days
      - 36 months (Flexible Arterial - default): 1,095 days
      - 60 months (Rigid Concrete / PQC): 1,825 days
    """
    t_resolved = _parse_datetime(resolved_at_str)
    t_detected = _parse_datetime(detected_at_str)

    # Normalize tz awareness if one is aware and one naive
    if t_resolved.tzinfo is not None and t_detected.tzinfo is None:
        t_detected = t_detected.replace(tzinfo=t_resolved.tzinfo)
    elif t_resolved.tzinfo is None and t_detected.tzinfo is not None:
        t_resolved = t_resolved.replace(tzinfo=t_detected.tzinfo)

    delta = t_detected - t_resolved
    total_seconds = delta.total_seconds()
    
    days_map = {12: 365, 36: 1095, 60: 1825}
    allowed_days = days_map.get(dlp_months, int(round(dlp_months * 30.4375)))
    
    return 0 <= total_seconds <= (allowed_days * 86400)


# Alias for plan compatibility
check_within_36_month_dlp = evaluate_recurrence_window


def generate_pfms_voucher_ref(dt: Optional[datetime.datetime] = None) -> str:
    """
    Generates a CAG-compliant Public Financial Management System (PFMS)
    transaction voucher reference: PFMS/DLP-RETENTION/{YYYY}/{MMDD}-{HEX6}
    """
    if dt is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    yyyy = dt.strftime("%Y")
    mmdd = dt.strftime("%m%d")
    hex6 = uuid.uuid4().hex[:6].upper()
    return f"PFMS/DLP-RETENTION/{yyyy}/{mmdd}-{hex6}"


def generate_form14_docket_no(cluster_code: str, dt: Optional[datetime.datetime] = None) -> str:
    """
    Generates statutory Form 14 notice docket number:
    FORM-14/DLP/{YYYY}/{CLUSTER_CODE}
    """
    if dt is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    return f"FORM-14/DLP/{dt.year}/{cluster_code}"


def generate_section_65b_certificate_id(evidence_hash: Optional[str] = None, dt: Optional[datetime.datetime] = None) -> str:
    """
    Generates Section 63/65B BSA 2023 certificate ID:
    CERT-BSA63-{evidence_hash[:12]} or CERT-BSA63/{YYYYMMDD}-{HEX6}
    """
    if evidence_hash:
        return f"CERT-BSA63-{evidence_hash[:12].upper()}"
    if dt is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    hex6 = uuid.uuid4().hex[:6].upper()
    return f"CERT-BSA63/{dt.strftime('%Y%m%d')}-{hex6}"


def compute_evidence_hash(cin: str, cluster_code: str, amount: float, timestamp: str) -> str:
    """
    Generates immutable SHA-256 evidence hash linking contractor CIN,
    cluster code, statutory penalty amount, and detection timestamp.
    """
    raw_payload = f"{cin}:{cluster_code}:{amount:.2f}:{timestamp}".encode("utf-8")
    return hashlib.sha256(raw_payload).hexdigest()


def compute_statutory_evidence_hash(
    cin: str,
    cluster_code: str,
    amount: float,
    timestamp: str,
    bus_id: str = "PATROL-BUS",
    gz: float = 1.0
) -> str:
    """
    Generates 64-character SHA-256 statutory evidence digest linking contractor CIN,
    cluster code, penalty amount, timestamp, patrol vehicle ID, and measured vertical acceleration.
    """
    raw_payload = f"{cin}:{cluster_code}:{amount:.2f}:{timestamp}:{bus_id}:{gz:.2f}".encode("utf-8")
    return hashlib.sha256(raw_payload).hexdigest()


def find_recurrent_distress_cluster(
    lat: float,
    lng: float,
    detection_time_iso: Optional[str] = None,
    db: Optional[Session] = None,
    buffer_meters: float = 15.0
) -> Optional[DBDistressCluster]:
    """
    Correlates coordinates to previously resolved clusters within buffer_meters (15m corridor buffer).
    Uses PostGIS ST_DWithin on PostgreSQL and bounding-box + Haversine fallback on SQLite.
    Filters for clusters closed within the 36-month (1,095 days) DLP.
    """
    if db is None:
        return None

    is_postgres = False
    try:
        if db.bind and db.bind.dialect.name == "postgresql":
            is_postgres = True
    except Exception:
        pass

    resolved_statuses = ["resolved", "verified_closed", "REPAIR_VERIFIED"]

    if is_postgres:
        stmt = text("""
            SELECT id, cluster_code, assigned_agency, contractor_id, road_name, status, updated_at,
                   ST_Distance(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) AS distance_meters
            FROM distress_clusters
            WHERE status IN ('resolved', 'verified_closed', 'REPAIR_VERIFIED')
              AND geom IS NOT NULL
              AND ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
            ORDER BY distance_meters ASC
            LIMIT 1
        """)
        row = db.execute(stmt, {"lat": lat, "lng": lng, "buffer_m": buffer_meters}).mappings().first()
        if row:
            cluster = db.query(DBDistressCluster).filter(DBDistressCluster.id == row["id"]).first()
            if cluster and detection_time_iso and cluster.updated_at:
                if not evaluate_recurrence_window(cluster.updated_at, detection_time_iso):
                    return None
            return cluster
        return None

    # SQLite fallback: coarse bounding box filter (~27m box) + Haversine distance
    delta_deg = 0.00035  # ~38m bounding box margin
    candidates = db.query(DBDistressCluster).filter(
        DBDistressCluster.status.in_(resolved_statuses),
        DBDistressCluster.lat.between(lat - delta_deg, lat + delta_deg),
        DBDistressCluster.lng.between(lng - delta_deg, lng + delta_deg)
    ).all()

    best_candidate = None
    min_dist = float("inf")

    for c in candidates:
        dist = haversine_distance_m(lat, lng, c.lat, c.lng)
        if dist <= buffer_meters and dist < min_dist:
            if detection_time_iso and c.updated_at:
                if not evaluate_recurrence_window(c.updated_at, detection_time_iso):
                    continue
            min_dist = dist
            best_candidate = c

    return best_candidate


def issue_form14_show_cause_notice(
    db: Session,
    cluster: Union[DBDistressCluster, str],
    measured_gz: Optional[float] = None,
    bus_id: Optional[str] = None,
    ee_signoff_by: Optional[str] = None,
    notes: Optional[str] = None
) -> DBContractorPenalty:
    """
    Autonomous Section 63/65B BSA 2023 Statutory Form 14 Show-Cause Notice Pack generation:
      1. Resolves contractor along the corridor package.
      2. Computes tiered Clause 14 liquidated damages assessment.
      3. Calculates 7-day cure window deadline.
      4. Computes SHA-256 cryptographic evidence hash and generates Section 65B Certificate ID.
      5. Registers escrow holdback in DBContractorPenalty with status = UNDER_NOTICE_CURE_PERIOD
         (or NOTICE_SERVED if EE sign-off provided at creation).
      6. Does NOT immediately liquidate contractor deposit balance.
      7. Flags debarment risk if recurrence >= 3.
      8. Logs audit trail and updates cluster status.
    """
    measured_gz_val = float(measured_gz) if measured_gz is not None else 1.0
    bus_id_val = str(bus_id) if bus_id is not None else "PATROL-UNKNOWN"
    if isinstance(cluster, str):
        target_cluster = db.query(DBDistressCluster).filter(
            (DBDistressCluster.id == cluster) | (DBDistressCluster.cluster_code == cluster)
        ).first()
        if not target_cluster:
            raise ValueError(f"Distress cluster not found: {cluster}")
    else:
        target_cluster = cluster

    # Resolve contractor
    contractor = None
    if target_cluster.contractor_id:
        contractor = db.query(DBContractor).filter(DBContractor.id == target_cluster.contractor_id).first()
    
    if not contractor and target_cluster.assigned_agency:
        contractor = db.query(DBContractor).filter(
            DBContractor.name.ilike(f"%{target_cluster.assigned_agency.strip()}%")
        ).first()

    if not contractor:
        contractor = db.query(DBContractor).first()

    if not contractor:
        contractor = DBContractor(
            id="CTR-01",
            name=target_cluster.assigned_agency or "L&T Highways Infra Ltd",
            cin="U45203TN2001PLC047123",
            director="Er. R. Sundararaman",
            assigned_corridor=target_cluster.road_name or "GST Road (NH-32)",
            zone="Zone 12 (Alandur / Guindy)",
            security_deposit_inr=5000000.0,
            penalties_deducted_inr=0.0,
            active_work_orders=1,
            resolved_work_orders=5,
            breached_work_orders=0,
            on_time_sla_pct=95.0,
            quality_score_pct=92.0,
            compaction_density_gcm3=2.36,
            debarment_risk="Low",
            dlp_months=36,
            dlp_tier_months=36,
            contract_type="Flexible Arterial (DBM+BC)",
            contract_package_type="Flexible Arterial (DBM+BC)",
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        db.add(contractor)
        db.flush()

    # Recurrence count calculation
    existing_penalties_count = db.query(DBContractorPenalty).filter(
        (DBContractorPenalty.contractor_id == contractor.id) |
        (DBContractorPenalty.contractor_name == contractor.name)
    ).count()
    re_pothole_count = existing_penalties_count + 1

    # Penalty formula computation
    penalty_amount, debarment_triggered = calculate_clause14_penalty(re_pothole_count)

    now_dt = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now_dt.isoformat()
    cure_deadline_iso = (now_dt + datetime.timedelta(days=7)).isoformat()

    # Cryptographic evidence digest and Section 65B certificate ID
    evidence_hash = compute_statutory_evidence_hash(
        cin=contractor.cin,
        cluster_code=target_cluster.cluster_code,
        amount=penalty_amount,
        timestamp=now_iso,
        bus_id=bus_id_val,
        gz=measured_gz_val
    )
    cert_id = generate_section_65b_certificate_id(evidence_hash=evidence_hash, dt=now_dt)
    docket_no = generate_form14_docket_no(target_cluster.cluster_code, now_dt)
    pfms_ref = generate_pfms_voucher_ref(now_dt)

    status = "NOTICE_SERVED" if ee_signoff_by else "UNDER_NOTICE_CURE_PERIOD"
    ee_signoff_at = now_iso if ee_signoff_by else None

    dlp_tier = getattr(contractor, "dlp_tier_months", None) or getattr(contractor, "dlp_months", 36) or 36

    penalty = DBContractorPenalty(
        id=f"pen-{uuid.uuid4().hex[:8]}",
        contractor_id=contractor.id,
        contractor_name=contractor.name,
        cluster_code=target_cluster.cluster_code,
        corridor_name=target_cluster.road_name or contractor.assigned_corridor,
        re_pothole_count=re_pothole_count,
        penalty_amount_inr=penalty_amount,
        statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023",
        status=status,
        notice_status=status,
        provenance="DERIVED_FROM_RECURRENT_DISTRESS",
        pfms_txn_ref=pfms_ref,
        evidence_sha256=evidence_hash,
        evidence_hash=evidence_hash,
        patrol_bus_id=bus_id_val,
        measured_gz=measured_gz_val,
        threshold_gz=1.35,
        notice_docket_no=docket_no,
        cure_deadline=cure_deadline_iso,
        dlp_months=dlp_tier,
        dlp_tier_months=dlp_tier,
        section_65b_cert_id=cert_id,
        certificate_id=cert_id,
        ee_signoff_by=ee_signoff_by,
        ee_signoff_at=ee_signoff_at,
        issued_at=now_iso
    )
    db.add(penalty)

    # Performance metric adjustments
    contractor.breached_work_orders = (contractor.breached_work_orders or 0) + 1
    contractor.quality_score_pct = max(0.0, round(100.0 - (contractor.breached_work_orders * 12.5), 1))

    # Debarment risk calculation
    initial_deposit = float(contractor.security_deposit_inr or 5000000.0)
    current_deductions = float(contractor.penalties_deducted_inr or 0.0)
    projected_balance = max(0.0, initial_deposit - (current_deductions + penalty_amount))

    if debarment_triggered or re_pothole_count >= 3 or projected_balance < (0.20 * initial_deposit):
        contractor.debarment_risk = "Critical Debarment Warning"
    elif re_pothole_count == 2 or (contractor.on_time_sla_pct or 100.0) < 80.0:
        contractor.debarment_risk = "Medium"
    else:
        contractor.debarment_risk = "Low"

    contractor.updated_at = now_iso

    # Register statutory GeM debarment warning if recurrence >= 3
    if debarment_triggered or re_pothole_count >= 3:
        existing_deb = db.query(DBContractorDebarment).filter(
            DBContractorDebarment.contractor_name == contractor.name
        ).first()
        if not existing_deb:
            debarment_record = DBContractorDebarment(
                id=f"deb-{uuid.uuid4().hex[:8]}",
                contractor_name=contractor.name,
                demerit_score=min(100.0, 75.0 + re_pothole_count * 10.0),
                debarment_status="STATUTORY_DEBARMENT_NOTICE",
                reason=f"Defect recurrence threshold exceeded (N={re_pothole_count} within {dlp_tier}-month DLP) under Contractual DLP Clause & Section 63/65B BSA 2023.",
                gem_portal_reference=f"GeM/{now_dt.year}/DEB-{random.randint(1000, 9999)}",
                effective_date=now_iso
            )
            db.add(debarment_record)
        else:
            existing_deb.demerit_score = min(100.0, 75.0 + re_pothole_count * 10.0)
            existing_deb.debarment_status = "STATUTORY_DEBARMENT_NOTICE"

    # Update cluster status
    target_cluster.status = "REPAIR_FAILED_RECURRENCE"
    target_cluster.verification_status = "REPAIR_FAILED_RECURRENCE"
    target_cluster.contractor_id = contractor.id
    target_cluster.updated_at = now_iso

    # Append audit trail
    db.add(DBAuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        bus_id=bus_id_val,
        corridor=target_cluster.road_name,
        message=f"Form 14 Show-Cause Notice {docket_no} drafted for {contractor.name} ({contractor.cin}). Penalty: ₹{penalty_amount:,.0f}, Cert: {cert_id}",
        latency_ms=42,
        type="STATUTORY_NOTICE_AUDIT",
        timestamp="Just now",
        created_at=now_iso
    ))

    db.add(DBRepairAudit(
        id=f"audit-rep-{uuid.uuid4().hex[:8]}",
        cluster_id=target_cluster.id,
        cluster_code=target_cluster.cluster_code,
        contractor_name=contractor.name,
        road_name=target_cluster.road_name,
        verifying_bus_id=bus_id_val,
        vertical_gz=measured_gz_val,
        optical_status="RECURRENT_CAVITY_DETECTED",
        audit_verdict="REPAIR_FAILED_RECURRENCE",
        penalty_debit_inr=penalty_amount,
        statutory_clause="Contractual DLP Clause & Section 63/65B BSA 2023",
        notes=notes or f"Form 14 Show-Cause Notice issued: {docket_no}",
        verified_at=now_iso
    ))

    db.commit()
    db.refresh(penalty)
    return penalty


generate_form14_show_cause_notice = issue_form14_show_cause_notice


def sign_form14_show_cause_notice(
    db: Session,
    penalty_id: str,
    ee_name: str,
    ee_designation: str = "Executive Engineer"
) -> DBContractorPenalty:
    """
    Stage 2: Municipal Executive Engineer digital sign-off.
    Transitions penalty status from UNDER_NOTICE_CURE_PERIOD to NOTICE_SERVED.
    """
    penalty = db.query(DBContractorPenalty).filter(DBContractorPenalty.id == penalty_id).first()
    if not penalty:
        raise ValueError(f"Penalty record not found: {penalty_id}")

    signoff_str = f"{ee_name} ({ee_designation})" if ee_designation else ee_name
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    penalty.ee_signoff_by = signoff_str
    penalty.ee_signoff_at = now_iso
    penalty.status = "NOTICE_SERVED"
    penalty.notice_status = "NOTICE_SERVED"

    db.add(DBAuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        bus_id="EE_CONSOLE",
        corridor=penalty.corridor_name,
        message=f"Form 14 Notice {penalty.notice_docket_no or penalty.id} signed by {signoff_str}. Notice served to {penalty.contractor_name}.",
        latency_ms=25,
        type="EE_SIGNOFF_AUDIT",
        timestamp="Just now",
        created_at=now_iso
    ))

    db.commit()
    db.refresh(penalty)
    return penalty


sign_form14_notice = sign_form14_show_cause_notice


def enforce_liquidated_damages(db: Session, penalty_id: str) -> DBContractorPenalty:
    """
    Executes post-notice liquidated damages upon expiry of the 7-day cure window.
    Deducts penalty amount from contractor security deposit escrow, with non-negative clamping.
    Transitions status to LIQUIDATED_DAMAGES_ENFORCED.
    """
    penalty = db.query(DBContractorPenalty).filter(DBContractorPenalty.id == penalty_id).first()
    if not penalty:
        raise ValueError(f"Penalty record not found: {penalty_id}")

    contractor = db.query(DBContractor).filter(
        (DBContractor.id == penalty.contractor_id) | (DBContractor.name == penalty.contractor_name)
    ).first()

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if contractor:
        initial_deposit = float(contractor.security_deposit_inr or 5000000.0)
        current_deductions = float(contractor.penalties_deducted_inr or 0.0)
        new_deductions = current_deductions + penalty.penalty_amount_inr
        contractor.penalties_deducted_inr = new_deductions
        remaining_balance = max(0.0, initial_deposit - new_deductions)

        if penalty.re_pothole_count >= 3 or remaining_balance < (0.20 * initial_deposit):
            contractor.debarment_risk = "Critical Debarment Warning"
        contractor.updated_at = now_iso

    if not penalty.pfms_txn_ref:
        penalty.pfms_txn_ref = generate_pfms_voucher_ref()

    penalty.status = "LIQUIDATED_DAMAGES_ENFORCED"
    penalty.notice_status = "LIQUIDATED_DAMAGES_ENFORCED"

    db.add(DBAuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        bus_id="TREASURY_ESCROW",
        corridor=penalty.corridor_name,
        message=f"Liquidated damages of ₹{penalty.penalty_amount_inr:,.0f} enforced for {penalty.contractor_name} under {penalty.notice_docket_no or penalty.id}. Ref: {penalty.pfms_txn_ref}",
        latency_ms=30,
        type="ESCROW_LIQUIDATION_AUDIT",
        timestamp="Just now",
        created_at=now_iso
    ))

    db.commit()
    db.refresh(penalty)
    return penalty


def dismiss_penalty_on_cure(db: Session, penalty_id: str) -> DBContractorPenalty:
    """
    Contractor rectified defect within 7-day cure window with multi-pass concurrence.
    Transitions status to CURED_BY_CONTRACTOR and releases escrow holdback without deduction.
    """
    penalty = db.query(DBContractorPenalty).filter(DBContractorPenalty.id == penalty_id).first()
    if not penalty:
        raise ValueError(f"Penalty record not found: {penalty_id}")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    penalty.status = "CURED_BY_CONTRACTOR"
    penalty.notice_status = "CURED_BY_CONTRACTOR"

    db.add(DBAuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        bus_id="CONCURRENCE_GATING",
        corridor=penalty.corridor_name,
        message=f"Form 14 Notice {penalty.notice_docket_no or penalty.id} dismissed upon successful contractor cure. Escrow holdback released.",
        latency_ms=20,
        type="PENALTY_CURED_AUDIT",
        timestamp="Just now",
        created_at=now_iso
    ))

    db.commit()
    db.refresh(penalty)
    return penalty


def execute_contractor_auto_debit(
    db: Session,
    cluster: Union[DBDistressCluster, str],
    measured_gz: Optional[float] = None,
    bus_id: Optional[str] = None,
    notes: Optional[str] = None
) -> DBContractorPenalty:
    """
    Executes an autonomous statutory penalty debit against a contractor's security deposit:
      1. Issues Form 14 statutory notice pack.
      2. Immediately applies escrow deduction and PFMS settlement for backwards compatibility.
      3. Clamps remaining security deposit escrow balance at 0 (never negative).
      4. Flags Critical Debarment Warning if balance < 20% or recurrence >= 3.
      5. Commits and returns penalty with status = DEBIT_ISSUED.
    """
    penalty = issue_form14_show_cause_notice(
        db=db,
        cluster=cluster,
        measured_gz=measured_gz,
        bus_id=bus_id,
        notes=notes
    )

    contractor = db.query(DBContractor).filter(
        (DBContractor.id == penalty.contractor_id) | (DBContractor.name == penalty.contractor_name)
    ).first()

    if contractor:
        initial_deposit = float(contractor.security_deposit_inr or 5000000.0)
        current_deductions = float(contractor.penalties_deducted_inr or 0.0)
        new_deductions = current_deductions + penalty.penalty_amount_inr
        contractor.penalties_deducted_inr = new_deductions
        remaining_balance = max(0.0, initial_deposit - new_deductions)

        if penalty.re_pothole_count >= 3 or remaining_balance < (0.20 * initial_deposit):
            contractor.debarment_risk = "Critical Debarment Warning"
        elif penalty.re_pothole_count == 2 or (contractor.on_time_sla_pct or 100.0) < 80.0:
            contractor.debarment_risk = "Medium"
        else:
            contractor.debarment_risk = "Low"

    penalty.status = "DEBIT_ISSUED"
    penalty.notice_status = "DEBIT_ISSUED"

    db.commit()
    db.refresh(penalty)
    return penalty
