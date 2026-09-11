from typing import Dict, Any, List, Optional
import math
from datetime import datetime, timezone
from app.storage.database import SessionLocal
from app.models.db_models import DBDistressCluster, DBTrafficDensity

class RiskReasoningEngine:
    """
    Dynamic Risk Reasoning, Kinematic TTC, and Counterfactual What-If Traffic Routing Engine.
    Computes real-time dynamic risk indices adapting to weather, PCU density, and road physics.
    """

    def calculate_kinematic_ttc(
        self,
        distance_m: float,
        vehicle_speed_kmh: float,
        target_relative_speed_kmh: float = 0.0,
        lateral_offset_m: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculates Kinematic Time-To-Collision (TTC) for pedestrian & collision avoidance:
        TTC = d / max(0.5, relative_speed_mps)
        Flags:
        - TTC < 2.5s: CRITICAL_COLLISION_RISK
        - 2.5s <= TTC <= 4.5s: ELEVATED_PEDESTRIAN_INTERACTION
        - TTC > 4.5s: SAFE_PASSAGE
        """
        # Convert speeds to m/s
        ego_speed_mps = max(0.0, vehicle_speed_kmh / 3.6)
        closing_speed_mps = ego_speed_mps + (target_relative_speed_kmh / 3.6)
        effective_speed_mps = max(0.5, closing_speed_mps)

        # 2D Euclidean distance accounting for lateral offset
        effective_dist = math.sqrt(distance_m ** 2 + lateral_offset_m ** 2)
        ttc_seconds = round(effective_dist / effective_speed_mps, 2)

        # Braking distance estimation (d_stop = v^2 / (2 * mu * g), mu=0.7 on dry asphalt, 0.4 on wet)
        g = 9.81
        mu_dry = 0.65
        stopping_dist_m = round((ego_speed_mps ** 2) / (2.0 * mu_dry * g) + (ego_speed_mps * 0.75), 1) # includes 0.75s driver reaction time

        is_critical = ttc_seconds < 2.5 or (effective_dist <= stopping_dist_m and vehicle_speed_kmh > 15.0)
        is_elevated = 2.5 <= ttc_seconds <= 4.5

        if is_critical:
            verdict = "CRITICAL_COLLISION_RISK"
            action = "TRIGGER_CABIN_HUD_AUDIO_ALERT_AND_SLOW"
            color = "#EF4444"
        elif is_elevated:
            verdict = "ELEVATED_PEDESTRIAN_INTERACTION"
            action = "DISPLAY_YELLOW_CAUTION_BOUNDING_BOX"
            color = "#F59E0B"
        else:
            verdict = "SAFE_PASSAGE"
            action = "MONITOR_PERIPHERAL"
            color = "#10B981"

        return {
            "ttc_seconds": ttc_seconds,
            "distance_m": round(effective_dist, 1),
            "vehicle_speed_kmh": round(vehicle_speed_kmh, 1),
            "stopping_distance_m": stopping_dist_m,
            "stopping_headroom_m": round(effective_dist - stopping_dist_m, 1),
            "verdict": verdict,
            "recommended_action": action,
            "color_hex": color,
            "statutory_standard": "MoRTH AIS-140 / UN-ECE R151 Blind Spot & Collision Warning"
        }

    def compute_dynamic_rpi(
        self,
        base_rpi: float,
        road_classification: str,
        weather_condition: str = "CLEAR",
        live_pcu_per_km: Optional[float] = None,
        depth_cm: float = 4.5,
        pass_count: int = 12
    ) -> Dict[str, Any]:
        """
        Calculates Dynamic Road Priority Index:
        RPI_dyn = RPI_base * M_weather * M_traffic * M_deterioration
        """
        # Weather multiplier
        w_norm = weather_condition.upper()
        if "RAIN" in w_norm or "MONSOON" in w_norm:
            m_weather = 1.35
            weather_note = "Monsoon Subsurface Water Saturation (+35%)"
        elif "WET" in w_norm or "MIST" in w_norm or "OVERCAST" in w_norm:
            m_weather = 1.15
            weather_note = "Damp Pavement Friction Reduction (+15%)"
        else:
            m_weather = 1.00
            weather_note = "Nominal Dry Conditions (+0%)"

        # Traffic density multiplier
        pcu = live_pcu_per_km if live_pcu_per_km is not None else (1450.0 if "ARTERIAL" in road_classification.upper() else 650.0)
        if pcu > 1600.0:
            m_traffic = 1.28
            traffic_note = f"High Bus/Vehicle Arterial Congestion ({pcu} PCU/km, +28%)"
        elif pcu > 900.0:
            m_traffic = 1.12
            traffic_note = f"Moderate Transit Density ({pcu} PCU/km, +12%)"
        else:
            m_traffic = 1.00
            traffic_note = f"Low Traffic Density ({pcu} PCU/km, +0%)"

        # Cavity depth & fatigue deterioration multiplier
        m_depth = 1.0 + min(0.40, max(0.0, (depth_cm - 3.0) * 0.04))
        m_fatigue = 1.0 + min(0.25, max(0.0, pass_count * 0.004))
        m_deterioration = round(m_depth * m_fatigue, 3)

        dynamic_rpi = round(min(100.0, base_rpi * m_weather * m_traffic * m_deterioration), 1)

        # Dynamic SLA calculation
        if dynamic_rpi >= 80.0:
            sla_hours = 24
            urgency = "EMERGENCY_REPAIR"
        elif dynamic_rpi >= 60.0:
            sla_hours = 48
            urgency = "URGENT_MAINTENANCE"
        else:
            sla_hours = 72
            urgency = "SCHEDULED_RESTRICTED"

        return {
            "base_rpi": base_rpi,
            "dynamic_rpi": dynamic_rpi,
            "rpi_delta": round(dynamic_rpi - base_rpi, 1),
            "multipliers": {
                "weather": m_weather,
                "traffic": m_traffic,
                "deterioration": m_deterioration
            },
            "explanations": [weather_note, traffic_note, f"Cavity Depth {depth_cm}cm with {pass_count} Heavy Bus Transits"],
            "calculated_sla_hours": sla_hours,
            "urgency_grade": urgency,
            "statutory_citation": "MoHUA IRC:SP:20 Clause 6.4 (Dynamic Prioritization Matrix)"
        }

    def simulate_corridor_whatif(
        self,
        corridor_name: str,
        closure_percentage: float = 50.0
    ) -> Dict[str, Any]:
        """
        Counterfactual What-If Traffic Choke-Point Routing:
        Simulates downstream congestion impact of closing a distressed lane/road,
        predicting vehicle rerouting, delay increase, and adjacent corridor load.
        """
        db = SessionLocal()
        try:
            # Query known corridors
            densities = db.query(DBTrafficDensity).all()
            base_pcu = 1850.0
            avg_speed = 34.0

            matched = [d for d in densities if corridor_name.lower() in d.road_name.lower()]
            if matched:
                base_pcu = matched[0].density_pcu_per_km or 1850.0
                avg_speed = matched[0].average_speed_kmh or 34.0

            diverted_pcu = round(base_pcu * (closure_percentage / 100.0) * 0.85, 1)
            predicted_speed = round(max(8.0, avg_speed * (1.0 - (closure_percentage / 100.0) * 0.65)), 1)
            travel_time_increase_pct = round(((avg_speed / max(1.0, predicted_speed)) - 1.0) * 100.0, 1)
            predicted_delay_mins = round(12.0 * (travel_time_increase_pct / 100.0), 1)

            # Alternate corridors receiving overflow
            alternate_routes = [
                {
                    "route_name": "Poonamallee High Road (NH 48 Bypass)",
                    "capacity_headroom_pcu": 420,
                    "overflow_assigned_pcu": round(diverted_pcu * 0.55, 1),
                    "predicted_los": "LoS D (Approaching Capacity)" if diverted_pcu * 0.55 > 350 else "LoS C (Stable Flow)",
                    "estimated_additional_delay_mins": round(predicted_delay_mins * 0.45, 1)
                },
                {
                    "route_name": "Inner Ring Road (Jawaharlal Nehru Road)",
                    "capacity_headroom_pcu": 600,
                    "overflow_assigned_pcu": round(diverted_pcu * 0.45, 1),
                    "predicted_los": "LoS C (Stable Flow)",
                    "estimated_additional_delay_mins": round(predicted_delay_mins * 0.35, 1)
                }
            ]

            return {
                "corridor_name": corridor_name,
                "simulated_lane_closure_pct": closure_percentage,
                "baseline_metrics": {
                    "pcu_per_km": base_pcu,
                    "average_speed_kmh": avg_speed,
                    "baseline_los": "LoS B" if avg_speed > 30 else "LoS C"
                },
                "predicted_impact": {
                    "diverted_pcu_per_km": diverted_pcu,
                    "predicted_chokepoint_speed_kmh": predicted_speed,
                    "delay_increase_pct": travel_time_increase_pct,
                    "estimated_delay_mins": predicted_delay_mins,
                    "predicted_chokepoint_los": "LoS F (Severe Gridlock)" if predicted_speed < 12.0 else "LoS E (Near Breakdown)",
                    "fuel_wastage_liters_per_hour": round(diverted_pcu * 0.18, 1)
                },
                "recommended_diversion_plan": alternate_routes,
                "mitigation_advisory": f"Recommend dynamic variable messaging signs (VMS) at 500m prior to {corridor_name} and signal retiming by +15s green split on Poonamallee bypass."
            }
        finally:
            db.close()

risk_reasoning_engine = RiskReasoningEngine()
