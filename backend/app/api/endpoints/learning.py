from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.self_learning_engine import self_learning_engine

router = APIRouter()

class AnnotateRequest(BaseModel):
    queue_id: str
    action: str  # CONFIRM, CORRECT, REJECT
    corrected_label: Optional[str] = None
    corrected_bbox: Optional[Dict[str, float]] = None
    reviewed_by: Optional[str] = "OFFICER_INSPECTOR"

@router.get("/status")
def get_learning_status():
    """Returns active learning dataset counts, model versions, and accuracy metrics."""
    return self_learning_engine.get_learning_status()

@router.get("/queue")
def get_annotation_queue():
    """Returns ambiguous detections awaiting human-in-the-loop review."""
    return self_learning_engine.get_annotation_queue()

@router.post("/annotate")
def submit_annotation(req: AnnotateRequest):
    """Submits officer review to promote ambiguous sample to verified training set."""
    res = self_learning_engine.submit_annotation(
        queue_id=req.queue_id,
        action=req.action,
        corrected_label=req.corrected_label,
        corrected_bbox=req.corrected_bbox,
        reviewed_by=req.reviewed_by or "OFFICER_INSPECTOR"
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to submit annotation"))
    return res

@router.post("/train")
def trigger_continuous_training():
    """Triggers an empirical retraining cycle, increments version, and hot-reloads weights."""
    return self_learning_engine.run_training_cycle()
