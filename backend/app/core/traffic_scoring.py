"""
================================================================================
  SheherSaathi - Canonical IRC:106-1990 Traffic Scoring & Congestion Engine
================================================================================
  Single canonical source of truth for:
  1. IRC:106-1990 Passenger Car Unit (PCU) equivalence scoring
  2. Highway Capacity Manual (HCM) Level of Service (LoS A-F)
  3. Dynamic speed-ratio congestion and bottleneck classification
================================================================================
"""

from typing import Dict, Any, Optional

# IRC:106-1990 Urban Road PCU Factors (Commercial / Transit Vehicle Equivalent)
IRC106_PCU_FACTORS = {
    "2w": 0.5,     # Motorcycle, Scooter, Moped
    "3w": 1.0,     # Auto-rickshaw
    "4w": 1.0,     # Passenger Car, Taxi, Small Van
    "bus": 3.0,    # Transit Bus (IRC:106 Heavy Transit Vehicle)
    "truck": 3.0,  # Commercial Truck / Lorry
    "heavy_truck": 3.0 # Multi-axle commercial vehicle
}

def calculate_irc106_pcu(
    counts_2w: int = 0,
    counts_3w: int = 0,
    counts_4w: int = 0,
    counts_bus: int = 0,
    counts_truck: int = 0
) -> float:
    """
    Computes total Passenger Car Units (PCU) per IRC:106-1990:
    PCU = (2W * 0.5) + (3W * 1.0) + (Car * 1.0) + (Bus * 2.2) + (Truck * 2.2)
    """
    pcu = (
        (counts_2w * IRC106_PCU_FACTORS["2w"]) +
        (counts_3w * IRC106_PCU_FACTORS["3w"]) +
        (counts_4w * IRC106_PCU_FACTORS["4w"]) +
        (counts_bus * IRC106_PCU_FACTORS["bus"]) +
        (counts_truck * IRC106_PCU_FACTORS["truck"])
    )
    return round(float(pcu), 2)


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
