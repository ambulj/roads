import math
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.rpi_engine import (
    calculate_rpi,
    compute_rpi,
    compute_pothole_volume,
    get_severity_label,
    get_recommended_sla,
    DEFECT_SEVERITY_SCORES,
    ROAD_CLASS_SCORES
)
from app.models.schemas import DefectType

client = TestClient(app)

def test_rpi_statutory_formula_weights():
    """Verify exact numerical weights and terms calculation for compute_rpi."""
    # Test case: S=100 (D40), N=7 passes, W=85 (Arterial), D=300m, Monsoon=1.0
    # T1 = 0.40 * 100 = 40.0
    # consensus_scale = min(100, 20 * log2(1 + 7)) = 20 * 3 = 60.0
    # T2 = 0.20 * 60.0 = 12.0
    # T3 = 0.20 * 85.0 = 17.0
    # proximity_scale = max(0, 100 * (1 - 300/1500)) = 100 * (1 - 0.2) = 80.0
    # T4 = 0.20 * 80.0 = 16.0
    # Raw Sum = 40.0 + 12.0 + 17.0 + 16.0 = 85.0
    # RPI (M=1.0) = 85.0 -> P0 (24h)
    res = compute_rpi(severity=100.0, pass_count=7, road_weight=85.0, poi_distance_m=300.0, monsoon_multiplier=1.0)
    assert res["terms"]["t1_severity"] == 40.0
    assert res["terms"]["t2_consensus"] == 12.0
    assert res["terms"]["t3_road_weight"] == 17.0
    assert res["terms"]["t4_poi_proximity"] == 16.0
    assert res["raw_sum"] == 85.0
    assert res["rpi"] == 85.0
    assert res["sla_tier"] == "P0"
    assert res["sla_hours"] == 24

def test_rpi_sla_classification_boundaries():
    """Verify SLA classification tier transitions: >=85 P0 (24h), >=70 P1 (48h), <70 P2 (72h)."""
    # 85.0 -> P0
    p0_res = compute_rpi(severity=100.0, pass_count=7, road_weight=85.0, poi_distance_m=300.0, monsoon_multiplier=1.0)
    assert p0_res["rpi"] >= 85.0
    assert p0_res["sla_tier"] == "P0"
    assert p0_res["sla_hours"] == 24

    # 72.0 -> P1
    p1_res = compute_rpi(severity=75.0, pass_count=3, road_weight=70.0, poi_distance_m=600.0, monsoon_multiplier=1.0)
    # T1 = 0.40 * 75 = 30.0
    # T2 = 0.20 * 40 = 8.0
    # T3 = 0.20 * 70 = 14.0
    # T4 = 0.20 * 60 = 12.0
    # Raw Sum = 30 + 8 + 14 + 12 = 64.0 -> with monsoon 1.15 = 73.6 (P1)
    p1_monsoon = compute_rpi(severity=75.0, pass_count=3, road_weight=70.0, poi_distance_m=600.0, monsoon_multiplier=1.15)
    assert 70.0 <= p1_monsoon["rpi"] < 85.0
    assert p1_monsoon["sla_tier"] == "P1"
    assert p1_monsoon["sla_hours"] == 48

    # <70.0 -> P2
    p2_res = compute_rpi(severity=40.0, pass_count=1, road_weight=50.0, poi_distance_m=1200.0, monsoon_multiplier=1.0)
    assert p2_res["rpi"] < 70.0
    assert p2_res["sla_tier"] == "P2"
    assert p2_res["sla_hours"] == 72

def test_rpi_clamping_and_monsoon():
    """Verify clamping to [0, 100] and monsoon multiplier scaling."""
    # Overflow scenario
    overflow_res = compute_rpi(severity=100.0, pass_count=50, road_weight=100.0, poi_distance_m=0.0, monsoon_multiplier=1.30)
    assert overflow_res["rpi"] == 100.0
    assert overflow_res["rpi"] <= 100.0

    # Minimum scenario
    underflow_res = compute_rpi(severity=0.0, pass_count=0, road_weight=0.0, poi_distance_m=2000.0, monsoon_multiplier=1.0)
    assert underflow_res["rpi"] == 0.0

    # Monsoon effect
    base_res = compute_rpi(severity=60.0, pass_count=3, road_weight=60.0, poi_distance_m=750.0, monsoon_multiplier=1.0)
    monsoon_res = compute_rpi(severity=60.0, pass_count=3, road_weight=60.0, poi_distance_m=750.0, monsoon_multiplier=1.15)
    assert monsoon_res["rpi"] > base_res["rpi"]
    assert math.isclose(monsoon_res["rpi"], round(base_res["raw_sum"] * 1.15, 1), abs_tol=0.1)

def test_rpi_mathematical_formulation_boundaries():
    """Verify legacy calculate_rpi strictly stays within [0.0, 100.0] under extreme values."""
    max_rpi = calculate_rpi(
        defect_type=DefectType.D40,
        pass_count=50,
        road_class="National Highway (NH)",
        poi_distance_m=0.0,
        poi_category="hospital"
    )
    assert max_rpi <= 100.0
    assert max_rpi >= 90.0

    min_rpi = calculate_rpi(
        defect_type=DefectType.D00,
        pass_count=1,
        road_class="Suburban Arterial",
        poi_distance_m=2000.0,
        poi_category="general"
    )
    assert min_rpi >= 0.0
    assert min_rpi < 50.0

def test_rpi_logarithmic_pass_consensus_scaling():
    """Verify log2(1 + N) consensus scaling progression."""
    rpi_1 = calculate_rpi(DefectType.D40, pass_count=1, road_class="National Highway (NH)", poi_distance_m=1500.0)
    rpi_3 = calculate_rpi(DefectType.D40, pass_count=3, road_class="National Highway (NH)", poi_distance_m=1500.0)
    rpi_7 = calculate_rpi(DefectType.D40, pass_count=7, road_class="National Highway (NH)", poi_distance_m=1500.0)
    rpi_15 = calculate_rpi(DefectType.D40, pass_count=15, road_class="National Highway (NH)", poi_distance_m=1500.0)
    
    assert rpi_1 < rpi_3 < rpi_7 < rpi_15

    # Verify logarithmic steps in compute_rpi
    c1 = compute_rpi(100, 1, 100, 1500, 1.0)["terms"]["t2_consensus"]
    c3 = compute_rpi(100, 3, 100, 1500, 1.0)["terms"]["t2_consensus"]
    c7 = compute_rpi(100, 7, 100, 1500, 1.0)["terms"]["t2_consensus"]
    c15 = compute_rpi(100, 15, 100, 1500, 1.0)["terms"]["t2_consensus"]
    c31 = compute_rpi(100, 31, 100, 1500, 1.0)["terms"]["t2_consensus"]
    
    # 20 * log2(2) * 0.20 = 20 * 1 * 0.20 = 4.0
    assert math.isclose(c1, 4.0, abs_tol=0.01)
    # 20 * log2(4) * 0.20 = 20 * 2 * 0.20 = 8.0
    assert math.isclose(c3, 8.0, abs_tol=0.01)
    # 20 * log2(8) * 0.20 = 20 * 3 * 0.20 = 12.0
    assert math.isclose(c7, 12.0, abs_tol=0.01)
    # 20 * log2(16) * 0.20 = 20 * 4 * 0.20 = 16.0
    assert math.isclose(c15, 16.0, abs_tol=0.01)
    # 20 * log2(32) * 0.20 = 20 * 5 * 0.20 = 20.0
    assert math.isclose(c31, 20.0, abs_tol=0.01)

def test_rpi_sla_category_transitions():
    """Verify P0, P1, and P2 SLA transitions in helper functions."""
    assert get_severity_label(88.0) == "critical"
    assert get_recommended_sla("critical") == 24

    assert get_severity_label(75.0) == "high"
    assert get_recommended_sla("high") == 48

    assert get_severity_label(62.0) == "medium"
    assert get_recommended_sla("medium") == 72

def test_pothole_volume_formula():
    """Verify volumetric formula V = (pi / 4) * d^2 * h."""
    # Diameter = 0.65m, depth = 0.084m (8.4cm)
    vol_m3 = compute_pothole_volume(diameter_m=0.65, depth_m=0.084)
    expected = (math.pi / 4.0) * (0.65 ** 2) * 0.084
    assert math.isclose(vol_m3, expected, rel_tol=1e-5)
    
    # In Litres: 1 m^3 = 1000 Litres -> ~27.87 L
    vol_litres = vol_m3 * 1000.0
    assert 27.0 <= vol_litres <= 29.0

def test_traffic_od_matrix_endpoint():
    """Verify GET /api/traffic/od-matrix returns valid PS 26124 transit desire lines and GeoJSON."""
    response = client.get("/api/traffic/od-matrix")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_monitored_od_pairs"] >= 5
    assert "network_avg_travel_time_ratio" in data
    assert data["network_avg_travel_time_ratio"] > 0
    
    corridors = data["corridors"]
    assert any(c["id"] == "od-tambaram-broadway" for c in corridors)
    assert any(c["id"] == "od-koyambedu-siruseri" for c in corridors)
    assert any(c["id"] == "od-central-guindy" for c in corridors)
    assert any(c["id"] == "od-broadway-kelambakkam" for c in corridors)
    assert any(c["id"] == "od-kathipara-omr" for c in corridors)
    
    for c in corridors:
        assert "hourly_pcu_flow" in c and c["hourly_pcu_flow"] > 0
        assert "peak_hour_flow" in c and c["peak_hour_flow"] > 0
        assert "daily_passengers" in c and c["daily_passengers"] > 0
        assert "corridor_iri" in c and c["corridor_iri"] > 0
        assert "roughness_delay_minutes" in c and c["roughness_delay_minutes"] >= 0
        assert "distress_delay_attribution_mins" in c and c["distress_delay_attribution_mins"] >= 0
        assert "congestion_factor" in c and c["congestion_factor"] >= 1.0
        assert "level_of_service" in c and "LoS" in c["level_of_service"]
        assert "origin" in c and len(c["origin"]) > 0
        assert "destination" in c and len(c["destination"]) > 0

    # Verify GeoJSON FeatureCollection
    assert "geojson" in data
    geojson = data["geojson"]
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == len(corridors)
    for feat in geojson["features"]:
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "LineString"
        coords = feat["geometry"]["coordinates"]
        assert len(coords) >= 10  # Curvature interpolated Bezier points
        # Verify longitudes (approx 70-85) and latitudes (approx 10-20)
        for pt in coords:
            assert len(pt) == 2
            assert 70.0 <= pt[0] <= 85.0
            assert 10.0 <= pt[1] <= 25.0
        props = feat["properties"]
        assert "origin" in props
        assert "destination" in props
        assert "daily_passengers" in props
        assert "peak_hour_flow" in props
        assert "corridor_iri" in props
        assert "roughness_delay_minutes" in props
        assert "congestion_factor" in props

def test_traffic_density_and_bottlenecks():
    """Verify GET /api/traffic/density and GET /api/traffic/bottlenecks calculate PCU flows and choke-points."""
    res_dens = client.get("/api/traffic/density")
    assert res_dens.status_code == 200
    dens_list = res_dens.json()
    assert len(dens_list) >= 1
    for d in dens_list:
        assert "density_pcu_per_km" in d and d["density_pcu_per_km"] >= 0
        assert "average_speed_kmh" in d and d["average_speed_kmh"] >= 0
        assert "congestion_level" in d
        assert "road_name" in d

    res_bn = client.get("/api/traffic/bottlenecks")
    assert res_bn.status_code == 200
    bn_list = res_bn.json()
    assert isinstance(bn_list, list)
    for b in bn_list:
        assert "cause" in b or "bottleneck_cause" in b
        assert "recommended_diversion" in b
        assert "speed_drop_pct" in b and b["speed_drop_pct"] >= 0

