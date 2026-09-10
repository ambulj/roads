from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.model_registry import model_registry

router = APIRouter()

class LoadModelRequest(BaseModel):
    model_key: str
    model_path: str

@router.get("/status")
def get_models_status():
    """Returns status and configuration of all AI/ML models."""
    return model_registry.get_status()

@router.post("/load")
def load_custom_model(req: LoadModelRequest):
    """Loads a custom .pt PyTorch / Ultralytics model file dynamically."""
    res = model_registry.load_custom_weights(req.model_key, req.model_path)
    return res
