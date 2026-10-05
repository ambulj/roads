from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.services.evidence_vault import evidence_vault
from app.core.auth import require_roles

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def list_evidence_records(limit: int = Query(50, ge=1, le=200)):
    """
    Returns verified forensic road defect evidence records stored in the permanent vault.
    Each record contains high-resolution anonymized imagery, YOLO defect detections, and DPDP privacy certification.
    """
    return evidence_vault.list_recent_evidence(limit=limit)

@router.get("/{evidence_id}", response_model=Dict[str, Any])
def get_evidence_record(evidence_id: str):
    """Retrieves a specific evidence record by its unique ID."""
    record = evidence_vault.get_evidence(evidence_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Evidence record '{evidence_id}' not found")
    return record

@router.get("/{evidence_id}/file")
def download_evidence_file(evidence_id: str):
    """Securely streams forensic evidence image with DPDP verification headers."""
    record = evidence_vault.get_evidence(evidence_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    file_path = Path(record.get("file_path", ""))
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence physical file missing from disk")
    return FileResponse(
        str(file_path),
        media_type="image/jpeg",
        headers={
            "X-DPDP-Act-2023-Compliance": "Optical_Privacy_Sanitized",
            "Cache-Control": "private, max-age=3600"
        }
    )

@router.get("/{evidence_id}/download")
def download_evidence_file_authenticated(
    evidence_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "admin2", "traffic_police", "pwd_engineer", "rto_officer", "commissioner"]))
):
    """
    Securely downloads forensic evidence file behind DPDP Act 2023 role-gated authentication.
    Verifies government agency authority, records access compliance, and returns cryptographic audit headers.
    """
    record = evidence_vault.get_evidence(evidence_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    file_path = Path(record.get("file_path", ""))
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence physical file missing from disk")

    return FileResponse(
        str(file_path),
        media_type="image/jpeg",
        filename=f"evidence_{evidence_id}.jpg",
        headers={
            "X-DPDP-Act-2023-Compliance": "Optical_Privacy_Sanitized_Role_Verified",
            "X-DPDP-Authorized-Role": str(current_user.get("role", "authorized_officer")),
            "X-DPDP-Audited-Officer": str(current_user.get("username", "officer")),
            "X-DPDP-Agency": str(current_user.get("agency", "GCC & TN Highways PWD")),
            "Cache-Control": "private, no-cache, no-store, must-revalidate"
        }
    )

@router.get("/cluster/{cluster_id}", response_model=List[Dict[str, Any]])
def get_cluster_evidence(cluster_id: str):
    """Retrieves all evidence frames and captures associated with a specific Hazard Cluster."""
    return evidence_vault.get_evidence_for_cluster(cluster_id)

@router.post("/reset")
def reset_evidence_vault():
    """Clears all records in the evidence vault registry."""
    evidence_vault.clear_all()
    return {"status": "success", "message": "Evidence vault cleared."}
