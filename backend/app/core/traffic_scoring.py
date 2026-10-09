"""
================================================================================
  RoadSaathi - Canonical IRC:106-1990 Traffic Scoring & Congestion Engine
================================================================================
  Single canonical source of truth for:
  1. IRC:106-1990 Passenger Car Unit (PCU) equivalence scoring
  2. Highway Capacity Manual (HCM) Level of Service (LoS A-F)
  3. Dynamic speed-ratio congestion and bottleneck classification
================================================================================
"""

from typing import Dict, Any, Optional

# IRC:106-1990 Table 1: Recommended PCU Factors for Urban Roads in Plain Areas
IRC106_PCU_FACTORS = {
    "2w": 0.5,             # Motor cycle, Scooter, Moped (0.5 PCU)
    "3w": 1.2,             # Auto-rickshaw (1.2 PCU)
    "car": 1.0,            # Passenger Car, Pick-up, Taxi, Van (1.0 PCU)
    "4w": 1.0,             # Car equivalent alias
    "lcv": 1.4,            # Light Commercial Vehicle, Mini-Bus, Tempo, Ambulance (1.4 PCU)
    "bus": 2.2,            # Transit Bus, Standard City Bus (2.2 PCU)
    "truck": 2.2,          # Heavy Commercial Vehicle / 2-Axle Truck (2.2 PCU)
    "heavy_truck": 2.2,    # Truck equivalent
    "tractor": 4.0,        # Agricultural Tractor / Trailer (4.0 PCU)
    "bicycle": 0.5,        # Pedal Cycle (0.5 PCU)
    "cycle": 0.5,          # Bicycle alias
    "cycle_rickshaw": 1.5, # Cycle Rickshaw (1.5 PCU)
    "cart": 1.5            # Hand Cart / Horse Cart (1.5 PCU)
}

def calculate_irc106_pcu(
    counts_2w: int = 0,
    counts_3w: int = 0,
    counts_4w: int = 0,
    counts_bus: int = 0,
    counts_truck: int = 0,
    counts_lcv: int = 0,
    counts_tractor: int = 0,
    counts_cycle: int = 0,
    counts_cart: int = 0
) -> float:
    """
    Computes total Passenger Car Units (PCU) strictly per IRC:106-1990 Table 1:
    PCU = (2W * 0.5) + (3W * 1.2) + (Car * 1.0) + (LCV * 1.4) +
          (Bus * 2.2) + (Truck * 2.2) + (Tractor * 4.0) + (Cycle * 0.5) + (Cart * 1.5)
    """
    pcu = (
        (counts_2w * IRC106_PCU_FACTORS["2w"]) +
        (counts_3w * IRC106_PCU_FACTORS["3w"]) +
        (counts_4w * IRC106_PCU_FACTORS["4w"]) +
        (counts_bus * IRC106_PCU_FACTORS["bus"]) +
        (counts_truck * IRC106_PCU_FACTORS["truck"]) +
        (counts_lcv * IRC106_PCU_FACTORS["lcv"]) +
        (counts_tractor * IRC106_PCU_FACTORS["tractor"]) +
        (counts_cycle * IRC106_PCU_FACTORS["cycle"]) +
        (counts_cart * IRC106_PCU_FACTORS["cart"])
    )
    return round(float(pcu), 2)

def map_class_to_irc106_pcu(class_name: str) -> float:
    """
    Maps detected labels from indian_roads_detection.pt and vehicle_detection.pt
    to official IRC:106-1990 Table 1 Passenger Car Unit (PCU) factors.
    """
    name = class_name.lower().replace("_", "").replace(" ", "").replace("-", "")
    if any(k in name for k in ["motorcycle", "motorbike", "scooter", "bike", "2w"]):
        return IRC106_PCU_FACTORS["2w"]       # 0.5
    if any(k in name for k in ["autorickshaw", "auto", "3w"]):
        return IRC106_PCU_FACTORS["3w"]       # 1.2
    if any(k in name for k in ["tractor"]):
        return IRC106_PCU_FACTORS["tractor"]  # 4.0
    if any(k in name for k in ["bus"]):
        return IRC106_PCU_FACTORS["bus"]      # 2.2
    if any(k in name for k in ["truck", "lorry"]):
        return IRC106_PCU_FACTORS["truck"]    # 2.2
    if any(k in name for k in ["lcv", "tempo", "ambulance"]):
        return IRC106_PCU_FACTORS["lcv"]      # 1.4
    if any(k in name for k in ["cycle", "bicycle"]):
        return IRC106_PCU_FACTORS["cycle"]    # 0.5
    if any(k in name for k in ["cart", "rikshaw", "cyclerickshaw"]):
        return IRC106_PCU_FACTORS["cart"]     # 1.5
    if any(k in name for k in ["car", "taxi", "van", "suv", "4w"]):
        return IRC106_PCU_FACTORS["car"]      # 1.0
    return 1.0  # Default passenger car equivalent


def classify_congestion(
    average_speed_kmh: float,
    free_flow_speed_kmh: float = 50.0,
    vehicle_count: Optional[int] = None,
    pcu_count: Optional[float] = None,
    los_grade: Optional[str] = None
) -> Dict[str, Any]:
    """
    Classifies corridor congestion and bottleneck status based on real-time speed ratio
    relative to free-flow design speed:
    - Speed ratio >= 0.80 -> FREE_FLOW (LoS A/B)
    - Speed ratio >= 0.50 -> MODERATE (LoS C)
    - Speed ratio >= 0.30 -> CONGESTED (LoS D/E, Bottleneck trigger)
    - Speed ratio <  0.30 -> GRIDLOCK (LoS F, Critical Bottleneck trigger)
    """
    free_speed = max(15.0, float(free_flow_speed_kmh))
    avg_speed = max(0.0, float(average_speed_kmh))
    speed_ratio = round(avg_speed / free_speed, 3)

    if speed_ratio >= 0.80:
        congestion = "FREE_FLOW"
        is_bottleneck = False
        cause = None
    elif speed_ratio >= 0.50:
        congestion = "MODERATE"
        is_bottleneck = False
        cause = None
    elif speed_ratio >= 0.30:
        congestion = "CONGESTED"
        is_bottleneck = True
        cause = (
            f"High vehicle volume ({vehicle_count} vehicles, PCU: {pcu_count})"
            if vehicle_count is not None and pcu_count is not None
            else "Carriageway impedance / Traffic volume saturation"
        )
    else:
        congestion = "GRIDLOCK"
        is_bottleneck = True
        cause = (
            f"Corridor saturation / severe stall (LoS: {los_grade or 'F'})"
            if los_grade
            else "Severe flow stall / Road hazard constriction"
        )

    return {
        "congestion_level": congestion,
        "is_bottleneck": is_bottleneck,
        "bottleneck_cause": cause,
        "speed_ratio": speed_ratio,
        "average_speed_kmh": round(avg_speed, 1),
        "free_flow_speed_kmh": round(free_speed, 1)
    }


def compute_los_grade(volume_to_capacity_ratio: float) -> str:
    """
    Computes Level of Service (LoS A-F) based on Volume/Capacity (v/c) ratio (HCM 2010):
    - v/c <= 0.60: LoS A (Free flow)
    - v/c <= 0.70: LoS B (Reasonably free flow)
    - v/c <= 0.80: LoS C (Stable flow)
    - v/c <= 0.90: LoS D (Approaching unstable flow)
    - v/c <= 1.00: LoS E (Unstable flow / capacity)
    - v/c >  1.00: LoS F (Breakdown flow / forced gridlock)
    """
    if volume_to_capacity_ratio <= 0.60:
        return "A"
    elif volume_to_capacity_ratio <= 0.70:
        return "B"
    elif volume_to_capacity_ratio <= 0.80:
        return "C"
    elif volume_to_capacity_ratio <= 0.90:
        return "D"
    elif volume_to_capacity_ratio <= 1.00:
        return "E"
    else:
        return "F"
