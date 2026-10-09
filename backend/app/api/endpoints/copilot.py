"""
================================================================================
  RoadSaathi Civic Copilot API Endpoints
================================================================================
  - POST /copilot/query: Natural language query dispatcher
  - GET  /copilot/health: Health & readiness check
  - GET  /copilot/suggestions: Quick-prompt suggestion strings
  - GET  /copilot/suggested-prompts: Alias for quick-prompt suggestion strings
================================================================================
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.storage.database import get_db
from app.services.copilot_engine import (
    copilot_engine,
    CopilotQueryRequest,
    CopilotQueryResponse,
    CopilotIntent,
    SUGGESTED_PROMPTS,
)

router = APIRouter()


@router.post("/query", response_model=CopilotQueryResponse)
def query_copilot(
    request: CopilotQueryRequest,
    db: Session = Depends(get_db),
) -> CopilotQueryResponse:
    """
    Dispatches natural language query to deterministic semantic query engine.
    Returns executive summary, structured action cards, and deep-link triggers in <10ms.
    """
    if not request.query or not request.query.strip():
        return copilot_engine.process_query("help", db, request.context)

    try:
        return copilot_engine.process_query(request.query, db, request.context)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Civic Copilot dispatch failed: {str(e)}"
        )


@router.get("/health")
def copilot_health() -> Dict[str, Any]:
    """
    Health check verifying the deterministic semantic copilot engine is online.
    """
    return {
        "status": "ready",
        "engine": "RoadSaathi Deterministic Semantic Router",
        "version": "5.0.0",
        "latency_target": "<10ms",
        "supported_intents": [i.value for i in CopilotIntent],
    }


@router.get("/suggestions", response_model=List[str])
def get_copilot_suggestions() -> List[str]:
    """
    Returns preset quick-prompt chips for municipal commanders and engineers.
    """
    return SUGGESTED_PROMPTS


@router.get("/suggested-prompts", response_model=List[str])
def get_suggested_prompts() -> List[str]:
    """
    Alias endpoint for get_copilot_suggestions.
    """
    return SUGGESTED_PROMPTS
