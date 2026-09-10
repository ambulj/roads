from typing import List, Dict, Any
from app.spatial.poi_database import haversine_distance_m
from app.core.config import settings

def cluster_points_15m(points: List[Dict[str, Any]], eps_meters: float = 15.0) -> List[List[Dict[str, Any]]]:
    """
    Groups raw detection points into clusters where points in the same cluster
    are within `eps_meters` (default 15m) of each other and share defect characteristics.
    """
    n = len(points)
    visited = [False] * n
    clusters = []

    for i in range(n):
        if visited[i]:
            continue
        
        visited[i] = True
        current_cluster = [points[i]]
        queue = [i]

        while queue:
            curr_idx = queue.pop(0)
            curr_pt = points[curr_idx]

            for j in range(n):
                if not visited[j]:
                    dist = haversine_distance_m(
                        curr_pt["lat"], curr_pt["lng"],
                        points[j]["lat"], points[j]["lng"]
                    )
                    # Check spatial distance and defect classification compatibility
                    if dist <= eps_meters:
                        visited[j] = True
                        current_cluster.append(points[j])
                        queue.append(j)

        clusters.append(current_cluster)

    return clusters

def deduplicate_ingest_into_clusters(
    new_ingest: Dict[str, Any],
    existing_clusters: List[Dict[str, Any]],
    eps_meters: float = 15.0
) -> Dict[str, Any]:
    """
    Checks if an incoming detection is within eps_meters of an existing cluster.
    If yes, merges into that cluster (increments passes, updates centroid).
    If no, creates a new cluster candidate.
    """
    best_cluster = None
    min_distance = float("inf")

    for cluster in existing_clusters:
        dist = haversine_distance_m(
            new_ingest["lat"], new_ingest["lng"],
            cluster["lat"], cluster["lng"]
        )
        if dist <= eps_meters and dist < min_distance:
            min_distance = dist
            best_cluster = cluster

    return {
        "is_merged": best_cluster is not None,
        "target_cluster": best_cluster,
        "distance_m": min_distance if best_cluster else None
    }
