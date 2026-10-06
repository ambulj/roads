"""
clustering_service.py — Spatial DBSCAN Clustering & Road Corridor Snapping Engine.

Dual-Mode Architecture:
1. Multi-Bus Defect Aggregation:
   - PostgreSQL: Native PostGIS ST_ClusterDBSCAN(geom, eps := 0.00005, minpoints := 2)
   - SQLite / Local: Python density clustering with Haversine metric (eps ~5.5m - 15m)
2. Road Corridor Snapping:
   - PostgreSQL: ST_DWithin(road.geom::geography, defect.geom::geography, 15.0)
   - SQLite / Local: Geodesic perpendicular distance projection via MapMatchingEngine
"""
import uuid
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.spatial.poi_database import haversine_distance_m, find_nearest_poi
from app.services.map_matching_engine import map_matching_engine


class ClusteringService:
    def __init__(self, eps_meters: float = 15.0, min_points: int = 2):
        self.eps_meters = eps_meters
        self.min_points = min_points

    def snap_to_road_corridor(
        self,
        lat: float,
        lng: float,
        db: Optional[Session] = None,
        corridor_buffer_m: float = 15.0
    ) -> Dict[str, Any]:
        """
        Snaps spatial coordinates to the nearest road network centerline within
        corridor_buffer_m (default 15.0m).
        Uses PostGIS ST_DWithin on PostgreSQL, falls back to Haversine projection on SQLite.
        """
        if db is not None:
            try:
                dialect = db.bind.dialect.name
                if dialect == "postgresql":
                    stmt = text("""
                        SELECT segment_id, name, classification,
                               ST_Distance(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) AS distance_meters
                        FROM road_segments
                        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
                        ORDER BY distance_meters ASC
                        LIMIT 1
                    """)
                    row = db.execute(stmt, {"lat": lat, "lng": lng, "buffer_m": corridor_buffer_m}).mappings().first()
                    if row:
                        return {
                            "segment_id": row["segment_id"],
                            "road_name": row["name"],
                            "classification": row["classification"],
                            "distance_meters": round(float(row["distance_meters"]), 2),
                            "snapped": True
                        }
            except Exception:
                # If table does not exist or dialect is not PostgreSQL, proceed to fallback
                pass

        # Python Haversine fallback using MapMatchingEngine ROAD_NETWORK
        best_seg = None
        min_dist = float("inf")

        for seg in map_matching_engine.ROAD_NETWORK:
            p1 = seg["start_coords"]
            p2 = seg["end_coords"]
            dist_m = map_matching_engine._distance_point_to_line_segment(lat, lng, p1[0], p1[1], p2[0], p2[1])
            if dist_m < min_dist:
                min_dist = dist_m
                best_seg = seg

        if best_seg and min_dist <= corridor_buffer_m:
            return {
                "segment_id": best_seg["segment_id"],
                "road_name": best_seg["name"],
                "classification": best_seg["classification"],
                "distance_meters": round(min_dist, 2),
                "snapped": True
            }

        return {
            "segment_id": None,
            "road_name": best_seg["name"] if best_seg else "Urban Arterial Corridor",
            "classification": best_seg["classification"] if best_seg else "Municipal Road",
            "distance_meters": round(min_dist, 2) if best_seg else None,
            "snapped": False
        }

    def cluster_points(
        self,
        points: List[Dict[str, Any]],
        eps_meters: Optional[float] = None,
        min_points: Optional[int] = None,
        db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        """
        Density-based spatial clustering for defect passes.
        Groups points within eps_meters (default 15m) sharing the same defect classification.
        Points forming clusters of size >= min_points are multi-pass validated.
        Single points remaining isolated are preserved as separate clusters (pass_count=1).
        """
        if not points:
            return []

        eps = eps_meters if eps_meters is not None else self.eps_meters
        k_min = min_points if min_points is not None else self.min_points

        # Group by defect_type
        by_defect: Dict[str, List[Dict[str, Any]]] = {}
        for p in points:
            dtype = p.get("defect_type", "D40")
            by_defect.setdefault(dtype, []).append(p)

        results: List[Dict[str, Any]] = []

        for defect_type, pts in by_defect.items():
            n = len(pts)
            visited = [False] * n
            cluster_assignments: List[Optional[int]] = [None] * n
            current_cluster_id = 0

            # Find neighbor indices within eps_meters
            def get_neighbors(idx: int) -> List[int]:
                p_idx = pts[idx]
                return [
                    j for j in range(n)
                    if haversine_distance_m(p_idx["lat"], p_idx["lng"], pts[j]["lat"], pts[j]["lng"]) <= eps
                ]

            for i in range(n):
                if visited[i]:
                    continue
                visited[i] = True
                neighbors = get_neighbors(i)

                if len(neighbors) < k_min:
                    # Noise / candidate point for now (may be merged later if reached by a core point)
                    continue

                # Expand cluster
                cluster_assignments[i] = current_cluster_id
                queue = list(neighbors)

                while queue:
                    neighbor_idx = queue.pop(0)
                    if not visited[neighbor_idx]:
                        visited[neighbor_idx] = True
                        sub_neighbors = get_neighbors(neighbor_idx)
                        if len(sub_neighbors) >= k_min:
                            queue.extend([sn for sn in sub_neighbors if sn not in queue])

                    if cluster_assignments[neighbor_idx] is None:
                        cluster_assignments[neighbor_idx] = current_cluster_id

                current_cluster_id += 1

            # Group points by cluster id
            clustered_groups: Dict[int, List[Dict[str, Any]]] = {}
            unclustered: List[Dict[str, Any]] = []

            for idx, c_id in enumerate(cluster_assignments):
                if c_id is not None:
                    clustered_groups.setdefault(c_id, []).append(pts[idx])
                else:
                    unclustered.append(pts[idx])

            # Build result dicts for multi-pass clusters
            for c_id, group in clustered_groups.items():
                centroid_lat = sum(p["lat"] for p in group) / len(group)
                centroid_lng = sum(p["lng"] for p in group) / len(group)
                distinct_buses = len(set(p.get("bus_id", "") for p in group if p.get("bus_id")))
                avg_conf = sum(p.get("confidence", 0.9) for p in group) / len(group)
                max_g = max((p.get("vertical_g_force", 1.0) for p in group), default=1.0)

                snap = self.snap_to_road_corridor(centroid_lat, centroid_lng, db=db, corridor_buffer_m=eps)
                poi_name, poi_dist = find_nearest_poi(centroid_lat, centroid_lng)

                results.append({
                    "id": f"cl-{uuid.uuid4().hex[:8]}",
                    "cluster_code": f"WO-{uuid.uuid4().hex[:4].upper()}",
                    "defect_type": defect_type,
                    "defect_name": group[0].get("defect_name", "Pothole / Surface Distress"),
                    "lat": centroid_lat,
                    "lng": centroid_lng,
                    "centroid_lat": centroid_lat,
                    "centroid_lng": centroid_lng,
                    "pass_count": len(group),
                    "distinct_buses": max(1, distinct_buses),
                    "confidence": round(avg_conf, 3),
                    "avg_confidence": round(avg_conf, 3),
                    "vertical_g_force": max_g,
                    "max_g_force": max_g,
                    "road_name": snap.get("road_name", "GST Road (NH-32)"),
                    "segment_id": snap.get("segment_id"),
                    "classification": snap.get("classification", "National Highway"),
                    "nearest_poi": poi_name,
                    "poi_distance_m": poi_dist,
                    "points": group,
                    "is_multi_pass": True
                })

            # Unclustered points each form an isolated single-pass cluster
            for single_pt in unclustered:
                snap = self.snap_to_road_corridor(single_pt["lat"], single_pt["lng"], db=db, corridor_buffer_m=eps)
                poi_name, poi_dist = find_nearest_poi(single_pt["lat"], single_pt["lng"])

                results.append({
                    "id": f"cl-{uuid.uuid4().hex[:8]}",
                    "cluster_code": f"WO-{uuid.uuid4().hex[:4].upper()}",
                    "defect_type": defect_type,
                    "defect_name": single_pt.get("defect_name", "Pothole / Surface Distress"),
                    "lat": single_pt["lat"],
                    "lng": single_pt["lng"],
                    "centroid_lat": single_pt["lat"],
                    "centroid_lng": single_pt["lng"],
                    "pass_count": 1,
                    "distinct_buses": 1 if single_pt.get("bus_id") else 0,
                    "confidence": single_pt.get("confidence", 0.9),
                    "avg_confidence": single_pt.get("confidence", 0.9),
                    "vertical_g_force": single_pt.get("vertical_g_force", 1.0),
                    "max_g_force": single_pt.get("vertical_g_force", 1.0),
                    "road_name": snap.get("road_name", "GST Road (NH-32)"),
                    "segment_id": snap.get("segment_id"),
                    "classification": snap.get("classification", "National Highway"),
                    "nearest_poi": poi_name,
                    "poi_distance_m": poi_dist,
                    "points": [single_pt],
                    "is_multi_pass": False
                })

        return results

    def cluster_raw_ingests(
        self,
        db: Session,
        lookback_hours: int = 24,
        eps_meters: Optional[float] = None,
        min_points: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes dual-mode clustering on raw ingests in the database.
        On PostgreSQL: Executes native ST_ClusterDBSCAN.
        On SQLite: Loads raw ingests and applies Python Haversine DBSCAN.
        """
        eps = eps_meters if eps_meters is not None else self.eps_meters
        k_min = min_points if min_points is not None else self.min_points

        try:
            dialect = db.bind.dialect.name
            if dialect == "postgresql":
                eps_deg = eps / 111139.0
                stmt = text("""
                    WITH clustered AS (
                        SELECT 
                            id, bus_id, defect_type, lat, lng, confidence, speed_kmh, vertical_g_force,
                            ST_ClusterDBSCAN(geom, eps := :eps_deg, minpoints := :k_min) OVER (
                                PARTITION BY defect_type
                            ) AS cluster_idx
                        FROM raw_ingests
                        WHERE captured_at >= NOW() - (:lookback || ' HOURS')::INTERVAL
                    )
                    SELECT 
                        defect_type,
                        cluster_idx,
                        COUNT(*) AS pass_count,
                        COUNT(DISTINCT bus_id) AS distinct_buses,
                        AVG(lat) AS centroid_lat,
                        AVG(lng) AS centroid_lng,
                        AVG(confidence) AS avg_confidence,
                        MAX(vertical_g_force) AS max_g_force
                    FROM clustered
                    WHERE cluster_idx IS NOT NULL
                    GROUP BY defect_type, cluster_idx;
                """)
                rows = db.execute(stmt, {
                    "eps_deg": eps_deg,
                    "k_min": k_min,
                    "lookback": lookback_hours
                }).mappings().all()

                results = []
                for r in rows:
                    snap = self.snap_to_road_corridor(r["centroid_lat"], r["centroid_lng"], db=db)
                    poi_name, poi_dist = find_nearest_poi(r["centroid_lat"], r["centroid_lng"])
                    results.append({
                        "id": f"cl-{uuid.uuid4().hex[:8]}",
                        "cluster_code": f"WO-{uuid.uuid4().hex[:4].upper()}",
                        "defect_type": r["defect_type"],
                        "defect_name": "Pothole / Surface Distress",
                        "lat": float(r["centroid_lat"]),
                        "lng": float(r["centroid_lng"]),
                        "centroid_lat": float(r["centroid_lat"]),
                        "centroid_lng": float(r["centroid_lng"]),
                        "pass_count": int(r["pass_count"]),
                        "distinct_buses": int(r["distinct_buses"]),
                        "avg_confidence": float(r["avg_confidence"]),
                        "confidence": float(r["avg_confidence"]),
                        "max_g_force": float(r["max_g_force"]),
                        "vertical_g_force": float(r["max_g_force"]),
                        "road_name": snap.get("road_name", "GST Road (NH-32)"),
                        "segment_id": snap.get("segment_id"),
                        "classification": snap.get("classification", "National Highway"),
                        "nearest_poi": poi_name,
                        "poi_distance_m": poi_dist,
                        "is_multi_pass": True
                    })
                return results
        except Exception:
            pass

        # SQLite fallback: load rows via ORM
        from app.models.db_models import DBRawIngest
        rows = db.query(DBRawIngest).all()
        points = [
            {
                "id": r.id,
                "bus_id": r.bus_id,
                "defect_type": r.defect_type,
                "confidence": r.confidence,
                "speed_kmh": r.speed_kmh,
                "vertical_g_force": r.vertical_g_force,
                "lat": r.lat,
                "lng": r.lng,
                "captured_at": r.captured_at
            }
            for r in rows
        ]
        return self.cluster_points(points, eps_meters=eps, min_points=k_min, db=db)


clustering_service = ClusteringService()
