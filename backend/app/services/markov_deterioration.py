"""
Markov-Chain Pavement Deterioration Engine.
Compliant with IRC:37-2018 (Guidelines for the Design of Flexible Pavements)
and MoRTH Section 500 (Bituminous Base & Surface Courses).
"""

from typing import Dict, List, Any
import copy

PAVEMENT_STATES = [
    {
        "state_id": 1,
        "code": "S1_MICRO_CRACK",
        "title": "Stage 1: Hairline Micro-Crack (D10/D20)",
        "pavement_status": "Good - Preventative Window Open",
        "crack_width_mm": 1.8,
        "cavity_depth_cm": 0.5,
        "area_m2": 0.28,
        "iri_roughness": 2.1,
        "rpi_score": 42.0,
        "recommended_action": "Bituminous Cold Slurry Seal (IRC:SP:20)",
        "repair_cost_inr": 1800,
        "statutory_reference": "IRC:SP:20-2002 Clause 11.4",
        "diagram_color": "#FBBF24"
    },
    {
        "state_id": 2,
        "code": "S2_ALLIGATOR_WEB",
        "title": "Stage 2: Interconnected Alligator Crack Web",
        "pavement_status": "Fair - Moisture Infiltration Active",
        "crack_width_mm": 4.5,
        "cavity_depth_cm": 2.1,
        "area_m2": 0.55,
        "iri_roughness": 3.2,
        "rpi_score": 68.5,
        "recommended_action": "Micro-Surfacing & Edge Routing (IRC:SP:81)",
        "repair_cost_inr": 4500,
        "statutory_reference": "IRC:SP:81-2010 Clause 5.2",
        "diagram_color": "#F97316"
    },
    {
        "state_id": 3,
        "code": "S3_RAVELLING_PUMPING",
        "title": "Stage 3: Subgrade Weakening & Ravelling",
        "pavement_status": "Poor - Wheel Path Depressions Forming",
        "crack_width_mm": 12.0,
        "cavity_depth_cm": 4.8,
        "area_m2": 0.85,
        "iri_roughness": 4.6,
        "rpi_score": 84.0,
        "recommended_action": "Tack Coat + Hot-Mix Dense Bituminous Patch (DBM)",
        "repair_cost_inr": 9200,
        "statutory_reference": "MoRTH Section 500 Clause 507",
        "diagram_color": "#EF4444"
    },
    {
        "state_id": 4,
        "code": "S4_CRITICAL_POTHOLE",
        "title": "Stage 4: Severe P0 Pothole Crater (D40)",
        "pavement_status": "Critical - Axle Shock & Rim Impact Zone",
        "crack_width_mm": 28.0,
        "cavity_depth_cm": 8.4,
        "area_m2": 1.40,
        "iri_roughness": 5.8,
        "rpi_score": 98.0,
        "recommended_action": "Full-Depth Base Course Excavation + Compaction",
        "repair_cost_inr": 16800,
        "statutory_reference": "IRC:82-2015 Code of Practice for Maintenance of Bituminous Surfaces",
        "diagram_color": "#DC2626"
    },
    {
        "state_id": 5,
        "code": "S5_STRUCTURAL_COLLAPSE",
        "title": "Stage 5: Complete Structural Base Course Failure",
        "pavement_status": "Catastrophic - Road Bed Subgrade Erosion",
        "crack_width_mm": 65.0,
        "cavity_depth_cm": 14.5,
        "area_m2": 3.20,
        "iri_roughness": 7.4,
        "rpi_score": 100.0,
        "recommended_action": "Full Roadway Reconstruction & Sub-base Chemical Stabilization",
        "repair_cost_inr": 28500,
        "statutory_reference": "IRC:37-2018 Section 9 / IRC:SP:84-2019",
        "diagram_color": "#991B1B"
    }
]

# Baseline monthly (30-day) transition probability matrix P (Dry Weather)
BASELINE_TPM = [
    [0.78, 0.22, 0.00, 0.00, 0.00],  # From S1
    [0.00, 0.72, 0.28, 0.00, 0.00],  # From S2
    [0.00, 0.00, 0.65, 0.35, 0.00],  # From S3
    [0.00, 0.00, 0.00, 0.58, 0.42],  # From S4
    [0.00, 0.00, 0.00, 0.00, 1.00],  # From S5 (Absorbing State)
]

# Monsoon-accelerated monthly transition probability matrix (2.2x decay rate)
MONSOON_TPM = [
    [0.52, 0.48, 0.00, 0.00, 0.00],
    [0.00, 0.44, 0.56, 0.00, 0.00],
    [0.00, 0.00, 0.35, 0.65, 0.00],
    [0.00, 0.00, 0.00, 0.25, 0.75],
    [0.00, 0.00, 0.00, 0.00, 1.00],
]

def _matrix_multiply(A: List[List[float]], B: List[List[float]]) -> List[List[float]]:
    n = len(A)
    m = len(B[0])
    p = len(B)
    result = [[0.0] * m for _ in range(n)]
    for i in range(n):
        for j in range(m):
            for k in range(p):
                result[i][j] += A[i][k] * B[k][j]
    return result

def _matrix_power(A: List[List[float]], power: int) -> List[List[float]]:
    n = len(A)
    # Identity matrix
    result = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    base = copy.deepcopy(A)
    while power > 0:
        if power % 2 == 1:
            result = _matrix_multiply(result, base)
        base = _matrix_multiply(base, base)
        power //= 2
    return result

class MarkovDeteriorationEngine:
    """Computes probabilistic pavement decay trajectories and life-cycle cost matrices."""

    def get_matrix_spec(self) -> Dict[str, Any]:
        return {
            "model_standard": "IRC:37-2018 / MoRTH Section 500",
            "time_step_unit": "30 days (1 month)",
            "states": PAVEMENT_STATES,
            "baseline_tpm": BASELINE_TPM,
            "monsoon_tpm": MONSOON_TPM,
            "monsoon_acceleration_factor": 2.2,
            "absorbing_state": 5,
            "description": "Discrete-time Markov Chain modeling stochastic pavement degradation under heavy axle loading and moisture infiltration."
        }

    def simulate(self, days: int = 90, monsoon: bool = True, initial_state_id: int = 1) -> Dict[str, Any]:
        tpm = MONSOON_TPM if monsoon else BASELINE_TPM
        steps = max(0, round(days / 30))
        
        # Compute P^k
        transition_matrix = _matrix_power(tpm, steps)
        
        # Initial state probability vector pi_0
        idx = max(0, min(initial_state_id - 1, 4))
        pi_0 = [1.0 if i == idx else 0.0 for i in range(5)]
        
        # pi_t = pi_0 * P^k
        pi_t = [0.0] * 5
        for j in range(5):
            for i in range(5):
                pi_t[j] += pi_0[i] * transition_matrix[i][j]

        # Expected metrics
        exp_depth = sum(pi_t[i] * PAVEMENT_STATES[i]["cavity_depth_cm"] for i in range(5))
        exp_width = sum(pi_t[i] * PAVEMENT_STATES[i]["crack_width_mm"] for i in range(5))
        exp_iri = sum(pi_t[i] * PAVEMENT_STATES[i]["iri_roughness"] for i in range(5))
        exp_rpi = sum(pi_t[i] * PAVEMENT_STATES[i]["rpi_score"] for i in range(5))
        exp_cost = sum(pi_t[i] * PAVEMENT_STATES[i]["repair_cost_inr"] for i in range(5))

        # Dominant state
        dominant_idx = max(range(5), key=lambda i: pi_t[i])
        dominant_state = PAVEMENT_STATES[dominant_idx]

        # Taxpayer savings vs Stage 5 reconstruct
        max_cost = PAVEMENT_STATES[4]["repair_cost_inr"]
        baseline_cost = PAVEMENT_STATES[0]["repair_cost_inr"]
        taxpayer_savings_pct = max(0.0, round(((max_cost - exp_cost) / max_cost) * 100, 1))

        return {
            "requested_days": days,
            "computed_steps": steps,
            "monsoon_active": monsoon,
            "state_distribution": [
                {
                    "state_id": i + 1,
                    "probability": round(pi_t[i], 4),
                    "code": PAVEMENT_STATES[i]["code"],
                    "title": PAVEMENT_STATES[i]["title"]
                }
                for i in range(5)
            ],
            "expected_metrics": {
                "cavity_depth_cm": round(exp_depth, 2),
                "crack_width_mm": round(exp_width, 1),
                "iri_roughness_m_per_km": round(exp_iri, 2),
                "rpi_score": round(exp_rpi, 1),
                "estimated_repair_cost_inr": round(exp_cost, 0),
                "taxpayer_savings_pct": taxpayer_savings_pct,
                "cost_escalation_factor": f"{round(exp_cost / baseline_cost, 1)}x"
            },
            "dominant_state": dominant_state,
            "recommended_intervention": dominant_state["recommended_action"],
            "statutory_citation": dominant_state["statutory_reference"]
        }

markov_engine = MarkovDeteriorationEngine()
