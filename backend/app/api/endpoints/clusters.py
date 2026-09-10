from fastapi import APIRouter, HTTPException
from typing import List
from app.storage.mock_database import store
from app.models.schemas import HazardCluster

router = APIRouter()

@router.get("", response_model=List[HazardCluster])
def list_clusters():
    return store.get_clusters()

@router.get("/{cluster_id}", response_model=HazardCluster)
def get_cluster(cluster_id: str):
    clusters = store.get_clusters()
    for c in clusters:
        if c["id"] == cluster_id or c["cluster_code"] == cluster_id:
            return c
    raise HTTPException(status_code=404, detail="Hazard cluster not found")
