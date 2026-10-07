import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.models.db_models import (
    DBContractor, DBDistressCluster, DBContractorPenalty, 
    DBContractorDebarment
)
from app.services.contractor_service import (
    execute_contractor_auto_debit,
    issue_form14_show_cause_notice,
    sign_form14_show_cause_notice,
    enforce_liquidated_damages,
    dismiss_penalty_on_cure
)
from app.api.websockets import manager

router = APIRouter()


# ── Pydantic Request / Response Schemas ────────────────────────────────────────

class ContractorLedgerItem(BaseModel):
    id: str
    name: str
    cin: str
    director: str
    assigned_corridor: str
    zone: str
    security_deposit_inr: float
    penalties_deducted_inr: float
    remaining_deposit_inr: float
    active_work_orders: int
    resolved_work_orders: int
    breached_work_orders: int
    on_time_sla_pct: float
    quality_score_pct: float
    compaction_density_gcm3: float
    warranty_expiry: Optional[str] = None
    debarment_risk: str
    dlp_months: Optional[int] = 36
    dlp_tier_months: Optional[int] = 36
    contract_type: Optional[str] = "Flexible Arterial (DBM+BC)"
    contract_package_type: Optional[str] = "Flexible Arterial (DBM+BC)"

    model_config = ConfigDict(from_attributes=True)


class PenaltyDocketItem(BaseModel):
    id: str
    contractor_id: Optional[str] = None
    contractor_name: str
    cluster_code: str
    corridor_name: str
    re_pothole_count: int
    penalty_amount_inr: float
    statutory_clause: str
    status: str
    notice_status: Optional[str] = None
    pfms_txn_ref: Optional[str] = None
    evidence_sha256: Optional[str] = None
    evidence_hash: Optional[str] = None
    patrol_bus_id: Optional[str] = None
    measured_gz: Optional[float] = 1.0
    threshold_gz: Optional[float] = 1.35
    notice_docket_no: Optional[str] = None
    cure_deadline: Optional[str] = None
    dlp_months: Optional[int] = 36
    dlp_tier_months: Optional[int] = 36
    section_65b_cert_id: Optional[str] = None
    certificate_id: Optional[str] = None
    ee_signoff_by: Optional[str] = None
    ee_signoff_at: Optional[str] = None
    issued_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EscrowSheetResponse(BaseModel):
    contractor_id: str
    contractor_name: str
    cin: str
    initial_deposit_inr: float
    penalties_deducted_inr: float
    remaining_deposit_inr: float
    holdback_releases: List[Dict[str, Any]]
    settlements: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)


class AutoDebitRequest(BaseModel):
    cluster_code: str
    measured_gz: float = 1.48
    patrol_bus_id: str = "BUS-04"
    notes: Optional[str] = None


class AutoDebitResponse(BaseModel):
    success: bool
    penalty_id: str
    contractor_name: str
    cluster_code: str
    penalty_amount_inr: float
    remaining_deposit_inr: float
    pfms_txn_ref: str
    evidence_sha256: str
    debarment_triggered: bool
    notice_docket_no: Optional[str] = None
    section_65b_cert_id: Optional[str] = None
    cure_deadline: Optional[str] = None
    status: Optional[str] = "DEBIT_ISSUED"
    message: str


class Form14IssueRequest(BaseModel):
    cluster_code: str
    measured_gz: float = 1.48
    patrol_bus_id: str = "BUS-04"
    ee_signoff_by: Optional[str] = None
    notes: Optional[str] = None


class Form14SignRequest(BaseModel):
    ee_name: str
    ee_designation: str = "Executive Engineer"


class Form14NoticeResponse(BaseModel):
    success: bool
    penalty_id: str
    notice_docket_no: str
    contractor_id: Optional[str] = None
    contractor_name: str
    cluster_code: str
    corridor_name: str
    re_pothole_count: int
    penalty_amount_inr: float
    status: str
    notice_status: str
    cure_deadline: str
    evidence_sha256: str
    section_65b_cert_id: str
    dlp_tier_months: int
    patrol_bus_id: str
    measured_gz: float
    ee_signoff_by: Optional[str] = None
    ee_signoff_at: Optional[str] = None
    message: str


def _ensure_default_contractors(db: Session):
    """Dynamically seeds default municipal contractors if the table is empty."""
    if db.query(DBContractor).count() == 0:
        defaults = [
            DBContractor(
                id="CTR-01",
                name="L&T Highways Infra Ltd",
                cin="U45203TN2001PLC047123",
                director="Er. R. Sundararaman",
                assigned_corridor="GST Road (NH-32) Airport Corridor",
                zone="Zone 12 (Alandur / Guindy)",
                security_deposit_inr=5000000.0,
                penalties_deducted_inr=45000.0,
                active_work_orders=3,
                resolved_work_orders=14,
                breached_work_orders=0,
                on_time_sla_pct=96.5,
                quality_score_pct=94.2,
                compaction_density_gcm3=2.38,
                warranty_expiry="2028-10-15",
                debarment_risk="Low",
                created_at="2026-01-15T00:00:00Z",
                updated_at="2026-10-06T00:00:00Z"
            ),
            DBContractor(
                id="CTR-02",
                name="GMR Urban Highways Ltd",
                cin="U45201DL1996PLC078234",
                director="Er. K. Venkatraman",
                assigned_corridor="Anna Salai Arterial Link",
                zone="Zone 9 (Teynampet)",
                security_deposit_inr=5000000.0,
                penalties_deducted_inr=30000.0,
                active_work_orders=2,
                resolved_work_orders=18,
                breached_work_orders=1,
                on_time_sla_pct=91.0,
                quality_score_pct=88.5,
                compaction_density_gcm3=2.34,
                warranty_expiry="2027-12-31",
                debarment_risk="Low",
                created_at="2026-01-15T00:00:00Z",
                updated_at="2026-10-06T00:00:00Z"
            ),
            DBContractor(
                id="CTR-03",
                name="TNRDC",
                cin="U45203TN1998SGC040120",
                director="Er. M. Rajasekaran",
                assigned_corridor="Rajiv Gandhi IT Expressway (OMR)",
                zone="Zone 13 (Adyar)",
                security_deposit_inr=5000000.0,
                penalties_deducted_inr=0.0,
                active_work_orders=1,
                resolved_work_orders=22,
                breached_work_orders=0,
                on_time_sla_pct=99.2,
                quality_score_pct=98.0,
                compaction_density_gcm3=2.42,
                warranty_expiry="2029-03-31",
                debarment_risk="Low",
                created_at="2026-01-15T00:00:00Z",
                updated_at="2026-10-06T00:00:00Z"
            )
        ]
        for c in defaults:
            db.add(c)
        db.commit()


# ── REST API Endpoints ─────────────────────────────────────────────────────────

@router.get("/ledger", response_model=List[ContractorLedgerItem])
def get_contractor_ledger(db: Session = Depends(get_db)):
    """
    Returns performance scorecard and escrow balance sheets for all contractors.
    Includes initial deposit, deductions, remaining escrow, quality score, and debarment risk.
    """
    _ensure_default_contractors(db)
    rows = db.query(DBContractor).all()

    items = []
    for r in rows:
        deposit = float(r.security_deposit_inr or 5000000.0)
        deducted = float(r.penalties_deducted_inr or 0.0)
        remaining = max(0.0, deposit - deducted)
        
        items.append(ContractorLedgerItem(
            id=r.id,
            name=r.name,
            cin=r.cin,
            director=r.director,
            assigned_corridor=r.assigned_corridor,
            zone=r.zone,
            security_deposit_inr=deposit,
            penalties_deducted_inr=deducted,
            remaining_deposit_inr=remaining,
            active_work_orders=r.active_work_orders or 0,
            resolved_work_orders=r.resolved_work_orders or 0,
            breached_work_orders=r.breached_work_orders or 0,
            on_time_sla_pct=float(r.on_time_sla_pct or 100.0),
            quality_score_pct=float(r.quality_score_pct or 100.0),
            compaction_density_gcm3=float(r.compaction_density_gcm3 or 2.35),
            warranty_expiry=r.warranty_expiry,
            debarment_risk=r.debarment_risk or "Low",
            dlp_months=getattr(r, "dlp_months", 36) or 36,
            dlp_tier_months=getattr(r, "dlp_tier_months", 36) or 36,
            contract_type=getattr(r, "contract_type", "Flexible Arterial (DBM+BC)") or "Flexible Arterial (DBM+BC)",
            contract_package_type=getattr(r, "contract_package_type", "Flexible Arterial (DBM+BC)") or "Flexible Arterial (DBM+BC)"
        ))
    return items


@router.get("/penalties", response_model=List[PenaltyDocketItem])
def get_contractor_penalties(
    contractor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lists historical IRC:SP:20 Clause 14 penalty dockets with PFMS voucher references,
    cryptographic SHA-256 evidence links, and patrol bus telemetry proofs.
    """
    query = db.query(DBContractorPenalty)

    if contractor_id:
        query = query.filter(
            (DBContractorPenalty.contractor_id == contractor_id) |
            (DBContractorPenalty.contractor_name == contractor_id)
        )

    if status and status != "all":
        query = query.filter(DBContractorPenalty.status.ilike(status))

    if search:
        q = f"%{search.strip()}%"
        query = query.filter(
            (DBContractorPenalty.contractor_name.ilike(q)) |
            (DBContractorPenalty.cluster_code.ilike(q)) |
            (DBContractorPenalty.corridor_name.ilike(q)) |
            (DBContractorPenalty.pfms_txn_ref.ilike(q))
        )

    rows = query.order_by(DBContractorPenalty.issued_at.desc()).all()
    return [
        PenaltyDocketItem(
            id=r.id,
            contractor_id=r.contractor_id,
            contractor_name=r.contractor_name,
            cluster_code=r.cluster_code,
            corridor_name=r.corridor_name,
            re_pothole_count=r.re_pothole_count or 1,
            penalty_amount_inr=float(r.penalty_amount_inr),
            statutory_clause=r.statutory_clause or "MoHUA IRC:SP:20 Clause 14.2 & Section 63 BSA 2023",
            status=r.status or "UNDER_NOTICE_CURE_PERIOD",
            notice_status=r.notice_status or r.status or "UNDER_NOTICE_CURE_PERIOD",
            pfms_txn_ref=r.pfms_txn_ref,
            evidence_sha256=r.evidence_sha256,
            evidence_hash=r.evidence_hash or r.evidence_sha256,
            patrol_bus_id=r.patrol_bus_id,
            measured_gz=r.measured_gz,
            threshold_gz=r.threshold_gz,
            notice_docket_no=r.notice_docket_no,
            cure_deadline=r.cure_deadline,
            dlp_months=r.dlp_months or 36,
            dlp_tier_months=r.dlp_tier_months or 36,
            section_65b_cert_id=r.section_65b_cert_id,
            certificate_id=r.certificate_id or r.section_65b_cert_id,
            ee_signoff_by=r.ee_signoff_by,
            ee_signoff_at=r.ee_signoff_at,
            issued_at=r.issued_at
        )
        for r in rows
    ]


@router.get("/{contractor_id}/escrow", response_model=EscrowSheetResponse)
def get_contractor_escrow(contractor_id: str, db: Session = Depends(get_db)):
    """
    Retrieves detailed escrow balance sheet, active holdbacks, and PFMS voucher settlements
    for a specific contractor.
    """
    _ensure_default_contractors(db)
    contractor = db.query(DBContractor).filter(
        (DBContractor.id == contractor_id) | (DBContractor.cin == contractor_id) | (DBContractor.name == contractor_id)
    ).first()

    if not contractor:
        raise HTTPException(status_code=404, detail=f"Contractor not found: {contractor_id}")

    deposit = float(contractor.security_deposit_inr or 5000000.0)
    deducted = float(contractor.penalties_deducted_inr or 0.0)
    remaining = max(0.0, deposit - deducted)

    # Fetch penalties as settlement records
    penalties = db.query(DBContractorPenalty).filter(
        (DBContractorPenalty.contractor_id == contractor.id) |
        (DBContractorPenalty.contractor_name == contractor.name)
    ).order_by(DBContractorPenalty.issued_at.desc()).all()

    settlements = [
        {
            "id": p.id,
            "voucher_ref": p.pfms_txn_ref or f"PFMS-{p.id}",
            "cluster_code": p.cluster_code,
            "corridor_name": p.corridor_name,
            "amount_inr": p.penalty_amount_inr,
            "re_pothole_count": p.re_pothole_count,
            "type": "STATUTORY_PENALTY_DEBIT",
            "evidence_sha256": p.evidence_sha256,
            "status": p.status,
            "issued_at": p.issued_at
        }
        for p in penalties
    ]

    # Fetch associated clusters for holdback releases
    clusters = db.query(DBDistressCluster).filter(
        (DBDistressCluster.contractor_id == contractor.id) |
        (DBDistressCluster.assigned_agency == contractor.name)
    ).all()

    holdbacks = [
        {
            "cluster_code": c.cluster_code,
            "road_name": c.road_name,
            "holdback_amount_inr": float(c.escrow_deposit_inr or 50000.0),
            "verification_status": c.verification_status or "UNVERIFIED",
            "concurrence_passes_count": c.concurrence_passes_count or 0,
            "warranty_end_date": c.warranty_end_date or contractor.warranty_expiry
        }
        for c in clusters
    ]

    return EscrowSheetResponse(
        contractor_id=contractor.id,
        contractor_name=contractor.name,
        cin=contractor.cin,
        initial_deposit_inr=deposit,
        penalties_deducted_inr=deducted,
        remaining_deposit_inr=remaining,
        holdback_releases=holdbacks,
        settlements=settlements
    )


@router.post("/penalties/auto-debit", response_model=AutoDebitResponse)
async def post_auto_debit(payload: AutoDebitRequest, db: Session = Depends(get_db)):
    """
    Submits fresh telematics proving recurrent pavement distress on a resolved work order.
    Executes automated IRC:SP:20 Clause 14 penalty debit, deducts from escrow,
    and returns a cryptographically signed PFMS transaction voucher.
    """
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.cluster_code == payload.cluster_code) |
        (DBDistressCluster.id == payload.cluster_code)
    ).first()

    if not cluster:
        raise HTTPException(
            status_code=404,
            detail=f"Work order / distress cluster '{payload.cluster_code}' not found."
        )

    try:
        penalty = execute_contractor_auto_debit(
            db=db,
            cluster=cluster,
            measured_gz=payload.measured_gz,
            bus_id=payload.patrol_bus_id,
            notes=payload.notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-debit execution failed: {str(e)}")

    # Resolve updated contractor balance
    contractor = db.query(DBContractor).filter(DBContractor.id == penalty.contractor_id).first()
    deposit = float(contractor.security_deposit_inr or 5000000.0) if contractor else 5000000.0
    deducted = float(contractor.penalties_deducted_inr or 0.0) if contractor else penalty.penalty_amount_inr
    remaining = max(0.0, deposit - deducted)
    debarment_triggered = (penalty.re_pothole_count >= 3)

    # Broadcast WebSocket update
    try:
        await manager.broadcast({
            "type": "CONTRACTOR_LEDGER_UPDATE",
            "cluster_code": penalty.cluster_code,
            "penalty_id": penalty.id,
            "contractor_name": penalty.contractor_name,
            "penalty_amount_inr": penalty.penalty_amount_inr,
            "pfms_txn_ref": penalty.pfms_txn_ref
        })
    except Exception:
        pass

    return AutoDebitResponse(
        success=True,
        penalty_id=penalty.id,
        contractor_name=penalty.contractor_name,
        cluster_code=penalty.cluster_code,
        penalty_amount_inr=penalty.penalty_amount_inr,
        remaining_deposit_inr=remaining,
        pfms_txn_ref=penalty.pfms_txn_ref or "",
        evidence_sha256=penalty.evidence_sha256 or "",
        debarment_triggered=debarment_triggered,
        notice_docket_no=penalty.notice_docket_no,
        section_65b_cert_id=penalty.section_65b_cert_id,
        cure_deadline=penalty.cure_deadline,
        status=penalty.status,
        message=f"Autonomous Clause 14 penalty of ₹{penalty.penalty_amount_inr:,.0f} executed under PFMS voucher {penalty.pfms_txn_ref}."
    )


@router.post("/simulate-clause14-debit", response_model=AutoDebitResponse)
async def post_simulate_clause14_debit(payload: AutoDebitRequest, db: Session = Depends(get_db)):
    """Backwards-compatible wrapper for simulate-clause14-debit endpoint."""
    return await post_auto_debit(payload, db)


@router.post("/penalties/issue-form-14", response_model=Form14NoticeResponse)
@router.post("/show-cause-notice", response_model=Form14NoticeResponse)
async def post_issue_form14_notice(payload: Form14IssueRequest, db: Session = Depends(get_db)):
    """
    Issues a Section 63/65B BSA 2023 Statutory Form 14 Show-Cause Notice Pack.
    Places penalty in UNDER_NOTICE_CURE_PERIOD escrow holdback (not liquidated)
    with a mandatory 7-day statutory cure window.
    """
    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.cluster_code == payload.cluster_code) |
        (DBDistressCluster.id == payload.cluster_code)
    ).first()

    if not cluster:
        raise HTTPException(
            status_code=404,
            detail=f"Work order / distress cluster '{payload.cluster_code}' not found."
        )

    try:
        penalty = issue_form14_show_cause_notice(
            db=db,
            cluster=cluster,
            measured_gz=payload.measured_gz,
            bus_id=payload.patrol_bus_id,
            ee_signoff_by=payload.ee_signoff_by,
            notes=payload.notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Form 14 notice generation failed: {str(e)}")

    try:
        await manager.broadcast({
            "type": "STATUTORY_NOTICE_ISSUED",
            "cluster_code": penalty.cluster_code,
            "penalty_id": penalty.id,
            "notice_docket_no": penalty.notice_docket_no,
            "contractor_name": penalty.contractor_name,
            "penalty_amount_inr": penalty.penalty_amount_inr,
            "status": penalty.status,
            "cure_deadline": penalty.cure_deadline
        })
    except Exception:
        pass

    return Form14NoticeResponse(
        success=True,
        penalty_id=penalty.id,
        notice_docket_no=penalty.notice_docket_no or f"FORM-14/DLP/2026/{penalty.cluster_code}",
        contractor_id=penalty.contractor_id,
        contractor_name=penalty.contractor_name,
        cluster_code=penalty.cluster_code,
        corridor_name=penalty.corridor_name,
        re_pothole_count=penalty.re_pothole_count,
        penalty_amount_inr=penalty.penalty_amount_inr,
        status=penalty.status,
        notice_status=penalty.notice_status or penalty.status,
        cure_deadline=penalty.cure_deadline or "",
        evidence_sha256=penalty.evidence_sha256 or "",
        section_65b_cert_id=penalty.section_65b_cert_id or "",
        dlp_tier_months=penalty.dlp_tier_months or 36,
        patrol_bus_id=penalty.patrol_bus_id or "BUS-04",
        measured_gz=penalty.measured_gz or 1.48,
        ee_signoff_by=penalty.ee_signoff_by,
        ee_signoff_at=penalty.ee_signoff_at,
        message=f"Form 14 Show-Cause Notice {penalty.notice_docket_no} issued under Section 63 BSA 2023 with 7-day cure window."
    )


@router.post("/penalties/{penalty_id}/sign-notice", response_model=Form14NoticeResponse)
@router.post("/sign-notice/{penalty_id}", response_model=Form14NoticeResponse)
async def post_sign_form14_notice(penalty_id: str, payload: Form14SignRequest, db: Session = Depends(get_db)):
    """
    Stage 2: Municipal Executive Engineer digital sign-off.
    Transitions Form 14 notice from UNDER_NOTICE_CURE_PERIOD to NOTICE_SERVED.
    """
    try:
        penalty = sign_form14_show_cause_notice(
            db=db,
            penalty_id=penalty_id,
            ee_name=payload.ee_name,
            ee_designation=payload.ee_designation
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EE sign-off failed: {str(e)}")

    try:
        await manager.broadcast({
            "type": "STATUTORY_NOTICE_SERVED",
            "penalty_id": penalty.id,
            "notice_docket_no": penalty.notice_docket_no,
            "ee_signoff_by": penalty.ee_signoff_by,
            "status": penalty.status
        })
    except Exception:
        pass

    return Form14NoticeResponse(
        success=True,
        penalty_id=penalty.id,
        notice_docket_no=penalty.notice_docket_no or f"FORM-14/DLP/2026/{penalty.cluster_code}",
        contractor_id=penalty.contractor_id,
        contractor_name=penalty.contractor_name,
        cluster_code=penalty.cluster_code,
        corridor_name=penalty.corridor_name,
        re_pothole_count=penalty.re_pothole_count,
        penalty_amount_inr=penalty.penalty_amount_inr,
        status=penalty.status,
        notice_status=penalty.notice_status or penalty.status,
        cure_deadline=penalty.cure_deadline or "",
        evidence_sha256=penalty.evidence_sha256 or "",
        section_65b_cert_id=penalty.section_65b_cert_id or "",
        dlp_tier_months=penalty.dlp_tier_months or 36,
        patrol_bus_id=penalty.patrol_bus_id or "BUS-04",
        measured_gz=penalty.measured_gz or 1.48,
        ee_signoff_by=penalty.ee_signoff_by,
        ee_signoff_at=penalty.ee_signoff_at,
        message=f"Form 14 Notice digitally signed by {penalty.ee_signoff_by}. Status updated to NOTICE_SERVED."
    )


@router.post("/penalties/{penalty_id}/enforce-liquidation", response_model=Dict[str, Any])
@router.post("/enforce-liquidated-damages/{penalty_id}", response_model=Dict[str, Any])
async def post_enforce_liquidation(penalty_id: str, db: Session = Depends(get_db)):
    """
    Executes liquidated damages upon expiry of 7-day cure window.
    Deducts assessed damages from contractor security deposit escrow.
    """
    try:
        penalty = enforce_liquidated_damages(db=db, penalty_id=penalty_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liquidation enforcement failed: {str(e)}")

    contractor = db.query(DBContractor).filter(DBContractor.id == penalty.contractor_id).first()
    remaining = max(0.0, float(contractor.security_deposit_inr or 5000000.0) - float(contractor.penalties_deducted_inr or 0.0)) if contractor else 0.0

    return {
        "success": True,
        "penalty_id": penalty.id,
        "notice_docket_no": penalty.notice_docket_no,
        "contractor_name": penalty.contractor_name,
        "penalty_amount_inr": penalty.penalty_amount_inr,
        "remaining_deposit_inr": remaining,
        "pfms_txn_ref": penalty.pfms_txn_ref,
        "status": penalty.status,
        "message": f"Liquidated damages of ₹{penalty.penalty_amount_inr:,.0f} debited from contractor escrow under PFMS ref {penalty.pfms_txn_ref}."
    }


@router.get("/penalties/{penalty_id}/notice-pack", response_model=Dict[str, Any])
@router.get("/show-cause-notice/{penalty_id}", response_model=Dict[str, Any])
def get_form14_notice_pack(penalty_id: str, db: Session = Depends(get_db)):
    """
    Returns the complete Section 63/65B BSA 2023 Statutory Form 14 Evidentiary Pack JSON
    for rendering official legal notices, prints, and court filings.
    """
    penalty = db.query(DBContractorPenalty).filter(
        (DBContractorPenalty.id == penalty_id) | (DBContractorPenalty.notice_docket_no == penalty_id)
    ).first()

    if not penalty:
        raise HTTPException(status_code=404, detail=f"Penalty notice record not found: {penalty_id}")

    contractor = db.query(DBContractor).filter(
        (DBContractor.id == penalty.contractor_id) | (DBContractor.name == penalty.contractor_name)
    ).first()

    cluster = db.query(DBDistressCluster).filter(
        (DBDistressCluster.cluster_code == penalty.cluster_code) | (DBDistressCluster.id == penalty.cluster_code)
    ).first()

    return {
        "notice_docket_no": penalty.notice_docket_no or f"FORM-14/DLP/2026/{penalty.cluster_code}",
        "penalty_id": penalty.id,
        "statutory_act": "Bharatiya Sakshya Adhiniyam 2023 (Section 63 / 65B) & IRC:SP:20 Clause 14.2",
        "issued_at": penalty.issued_at,
        "cure_deadline": penalty.cure_deadline,
        "status": penalty.status,
        "notice_status": penalty.notice_status or penalty.status,
        "contractor": {
            "id": contractor.id if contractor else penalty.contractor_id,
            "name": contractor.name if contractor else penalty.contractor_name,
            "cin": contractor.cin if contractor else "U45203TN2001PLC047123",
            "director": contractor.director if contractor else "Executive Director",
            "assigned_corridor": penalty.corridor_name,
            "dlp_tier_months": penalty.dlp_tier_months or (contractor.dlp_tier_months if contractor else 36),
            "contract_type": getattr(contractor, "contract_type", "Flexible Arterial (DBM+BC)") if contractor else "Flexible Arterial (DBM+BC)"
        },
        "telemetry_provenance": {
            "cluster_code": penalty.cluster_code,
            "corridor_name": penalty.corridor_name,
            "patrol_bus_id": penalty.patrol_bus_id or "BUS-04",
            "measured_gz": penalty.measured_gz or 1.48,
            "threshold_gz": penalty.threshold_gz or 1.35,
            "re_pothole_count": penalty.re_pothole_count,
            "penalty_amount_inr": penalty.penalty_amount_inr,
            "lat": cluster.lat if cluster else 12.9516,
            "lng": cluster.lng if cluster else 80.1462
        },
        "section_65b_certificate": {
            "certificate_id": penalty.section_65b_cert_id or penalty.certificate_id,
            "hash_algorithm": "SHA-256",
            "evidence_digest": penalty.evidence_sha256 or penalty.evidence_hash,
            "custodian_statement": "Records generated automatically by calibrated vehicle sensor edge NPU during scheduled municipal transit operations.",
            "ee_signoff_by": penalty.ee_signoff_by,
            "ee_signoff_at": penalty.ee_signoff_at
        },
        "pfms_settlement": {
            "voucher_ref": penalty.pfms_txn_ref,
            "clause": penalty.statutory_clause
        }
    }


@router.get("/debarments", response_model=List[Dict[str, Any]])
def get_contractor_debarments(db: Session = Depends(get_db)):
    """
    Lists contractors flagged for statutory debarment or blacklisted under GeM portal rules
    due to recurrent pavement failures or SLA defaults.
    """
    rows = db.query(DBContractorDebarment).all()
    return [
        {
            "id": r.id,
            "contractor_name": r.contractor_name,
            "demerit_score": r.demerit_score,
            "debarment_status": r.debarment_status,
            "reason": r.reason,
            "gem_portal_reference": r.gem_portal_reference,
            "effective_date": r.effective_date
        }
        for r in rows
    ]
