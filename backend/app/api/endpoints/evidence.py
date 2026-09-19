from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.services.evidence_vault import evidence_vault

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

@router.get("/cluster/{cluster_id}", response_model=List[Dict[str, Any]])
def get_cluster_evidence(cluster_id: str):
    """Retrieves all evidence frames and captures associated with a specific Hazard Cluster."""
    return evidence_vault.get_evidence_for_cluster(cluster_id)

@router.post("/temp/purge")
def trigger_temp_purge():
    """
    Manually triggers the temporary footage purge cycle.
    Deletes raw unflagged temporary video/photo buffers older than 24 hours while permanently retaining verified evidence.
    """
    purged = evidence_vault.purge_expired_temp_footage()
    return {
        "status": "success",
        "purged_temp_files": purged,
        "message": f"Purged {purged} expired temporary footage file(s)"
    }
