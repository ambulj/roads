import math
from app.core.config import settings
from app.models.schemas import DefectType

DEFECT_SEVERITY_SCORES = {
    DefectType.D40: 100.0,       # Pothole / Deep Cavity
    DefectType.D20: 75.0,        # Alligator / Structural Fatigue Crack
    DefectType.D10: 50.0,        # Transverse Crack
    DefectType.D00: 30.0,        # Longitudinal Crack
    DefectType.WATERLOGGING: 85.0,
    DefectType.MISSING_DIVIDER: 70.0,
    DefectType.MISSING_SIGN: 60.0,
    DefectType.ZEBRA_CROSSING: 55.0,     # Pedestrian Crossing Audit
    DefectType.FADED_CROSSING: 88.0,     # Faded Crossing - High Pedestrian Hazard near Schools/Hospitals
    DefectType.UNMARKED_SPEED_BREAKER: 82.0,  # Two-wheeler spine impact hazard (IRC:99)
    DefectType.DARK_SPOT_OUTAGE: 65.0,        # Unlit road segment - Pedestrian/Women Safety
    DefectType.OPEN_MANHOLE: 98.0,            # IS:1726 Open manhole - Critical Life Safety (2-hr SLA)
    DefectType.SUNKEN_TRENCH: 94.0,           # High-speed axle fracture drop-off
    DefectType.SUBMERGED_POTHOLE: 91.0,        # Hydro-dynamic hidden cavity in floodwaters
    DefectType.FOLIAGE_OBSCURED_SIGN: 72.0,   # Overgrown tree obscuring IRC:67 regulatory sign
    DefectType.BANNER_OBSCURED_SIGN: 70.0,    # Unauthorized flex banner obscuring road sign
}

ROAD_CLASS_SCORES = {
    "National Highway (NH)": 100.0,
    "State Highway (SH)": 80.0,
    "Major Arterial": 65.0,
    "Commercial Transit Corridor": 60.0,
    "Suburban Arterial": 45.0,
}

def calculate_rpi(
    defect_type: DefectType,
    pass_count: int,
    road_class: str,
    poi_distance_m: float,
    poi_category: str = "general"
) -> float:
    """
    Computes the Dynamic Multi-Factor Road Priority Index (RPI) from 0.0 to 100.0:
    RPI = min(100.0, w1*Severity + w2*log2(1+Passes) + w3*RoadClass + w4*POI_Proximity*100 + POI_Category_Boost)
    Schools and Hospitals receive explicit priority boosts to protect vulnerable pedestrians.
    """
    # 1. Base Defect Severity (0 - 100)
    s_defect = DEFECT_SEVERITY_SCORES.get(defect_type, 40.0)
    
    # 2. Observation Frequency Scale: log2(1 + passes) normalized with factor 20.0
    s_freq = min(100.0, math.log2(1 + max(1, pass_count)) * 20.0)
    
    # 3. Road Classification (0 - 100)
    s_road = ROAD_CLASS_SCORES.get(road_class, 50.0)
    
    # 4. Critical POI Proximity (0 - 100): Closest gives 100, >1500m gives 0
    clamped_poi_dist = min(poi_distance_m, settings.MAX_POI_DISTANCE_M)
    s_poi = (1.0 - (clamped_poi_dist / settings.MAX_POI_DISTANCE_M)) * 100.0
    
    # 5. Vulnerable Zone Priority Boost (Hospitals & Schools)
    cat_lower = (poi_category or "general").lower()
    poi_boost = 0.0
    if clamped_poi_dist <= settings.MAX_POI_DISTANCE_M:
        if "hospital" in cat_lower or "emergency" in cat_lower or "medical" in cat_lower:
            poi_boost = 15.0
        elif "school" in cat_lower or "college" in cat_lower or "university" in cat_lower:
            poi_boost = 10.0
        elif "transit" in cat_lower or "metro" in cat_lower or "station" in cat_lower:
            poi_boost = 5.0
    
    raw_rpi = (
        settings.WEIGHT_SEVERITY * s_defect +
        settings.WEIGHT_FREQUENCY * s_freq +
        settings.WEIGHT_HIGHWAY * s_road +
        settings.WEIGHT_POI * s_poi +
        poi_boost
    )
    
    return round(min(100.0, max(0.0, raw_rpi)), 1)

def get_severity_label(rpi_score: float) -> str:
    if rpi_score >= 85.0:
        return "critical"
    elif rpi_score >= 70.0:
        return "high"
    elif rpi_score >= 50.0:
        return "medium"
    return "low"

def get_recommended_sla(severity_label: str) -> int:
    sla_map = {
        "critical": 24, # 24 hours (or 12h for emergency)
        "high": 48,     # 48 hours
        "medium": 72,   # 72 hours
        "low": 120      # 5 days
    }
    return sla_map.get(severity_label, 72)
