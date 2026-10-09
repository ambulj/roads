# Phase 19 Research: Physical Concurrence & Officer-Certified Gating

## Executive Summary
Phase 19 addresses critical findings identified in municipal audit reviews regarding work order repair verification, contractor financial liabilities, and administrative defect triage. Specifically:
1. **Time-Windowed Post-Repair Verification & Narrowed Spatial Corridor (D-19-01, D-19-02)**: Eliminates false recurrence penalties caused by querying pre-repair distress telematics or nearby manholes by filtering telemetry strictly to $[t_{\text{repair}}, t_{\text{repair}} + 48\text{h}]$, narrowing corridor radius from 15.0m to 5.0m, and speed-normalizing vertical shock jerk ($G_{norm} = \frac{|G_z - 1.0|}{v / 30}$).
2. **Fail-Closed Missing Sensor Handling & Zero Fallback Fabrication (D-19-02, D-19-03)**: Eliminates dangerous fallback defaults ($G_z = 1.0\text{g}$, $\text{optical} = \text{SMOOTH\_SURFACE}$) that incorrectly scored unequipped buses as verified passes, and removes hardcoded fabricated penalty values ($G_z = 1.48\text{g}$, `"BUS-04"`). Passes with missing sensors or crawl speeds ($v < 15\text{ km/h}$) fail closed as `NO_DATA`.
3. **Officer-Certified Recommendation Workflows (D-19-04)**: Replaces legally indefensible automated escrow debits (`execute_contractor_auto_debit`) and unilateral payment authorizations with structured statutory recommendations (`recommend_release`, `proposed_deduction`, `approval_status`) requiring Assistant Engineer (AE) / Executive Engineer (EE) digital certification.
4. **Structured Defect Triage Schema Extensions (D-19-05)**: Extends `DBDistressCluster` with `repair_completed_at`, `acknowledged_at`, `assigned_officer_id`, `rejection_reason` (constrained to `FALSE_POSITIVE`, `DUPLICATE_CLUSTER`, `JURISDICTION_NON_PWD`, `UNDER_ACTIVE_REPAIR`), and `triage_status`, backed by SQLite PRAGMA migrations and a `POST /api/clusters/{id}/triage` endpoint.

---

## 1. Time-Windowed Post-Repair Verification & Spatial Tolerance (D-19-01, D-19-02)

### 1.1 Baseline Repair Timestamp Determination
In the existing codebase (`backend/app/services/concurrence_service.py`), `evaluate_work_order_concurrence()` queries raw ingests without checking repair dates. Consequently, historical telemetry captured when the pothole was still open triggers `REPAIR_FAILED_RECURRENCE`.

The repair baseline timestamp must be determined using hierarchical resolution:
1. `cluster.repair_completed_at` (primary: set when field contractor or engineer logs repair completion)
2. `cluster.updated_at` (fallback: timestamp of cluster status transition to `repaired` / `reinspection_pending`)
3. `cluster.created_at` (tertiary fallback)

```python
def get_repair_baseline_datetime(cluster: DBDistressCluster) -> datetime.datetime:
    """Extracts timezone-aware UTC datetime for repair completion."""
    raw = cluster.repair_completed_at or cluster.updated_at or cluster.created_at
    return parse_datetime_to_utc(raw)
```

The verification monitoring window is strictly bounded:
$$\text{Window} = \left[ t_{\text{repair}},\, t_{\text{repair}} + 48\text{ hours} \right]$$
Any telemetry with $\text{captured\_at} < t_{\text{repair}}$ or $\text{captured\_at} > t_{\text{repair}} + 48\text{h}$ is excluded from post-repair evaluation.

### 1.2 Corridor Tolerance Narrowing
- **Existing Constant**: `CORRIDOR_MATCH_METERS = 15.0`
- **Updated Constant**: `CORRIDOR_MATCH_METERS = 5.0`
- **Physical Rationale**: A 15m radius forms a 30m diameter spatial circle. In Indian municipal road environments, a 30m circle frequently encompasses adjacent-lane utility trenches, CMWSSB cast iron manholes, or speed breakers, causing false failures on a properly patched 1m asphalt defect. A 5m corridor aligns with standard lane geometry (3.5m–4.0m lane width + buffer) and avoids cross-lane contamination.

### 1.3 Database Query Time & Corridor Filtering
#### PostgreSQL / PostGIS:
```sql
SELECT bus_id, vertical_g_force, defect_type, confidence, speed_kmh, captured_at
FROM raw_ingests
WHERE geom IS NOT NULL
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, :buffer_m)
  AND captured_at >= :window_start_iso
  AND captured_at <= :window_end_iso
ORDER BY captured_at ASC;
```

#### SQLite Fallback:
Bounding box search using $\Delta_{\text{deg}} \approx 0.000055$ ($\approx 6.0\text{m}$ lat/lng margin), followed by `haversine_distance_m(lat, lng) <= 5.0` and timestamp parsing filtering for $t \in [t_{\text{repair}},\, t_{\text{repair}} + 48\text{h}]$.

#### Audit Query Filtering:
`DBRepairAudit` entries must also be filtered:
```python
audits = db.query(DBRepairAudit).filter(
    (DBRepairAudit.cluster_id == cluster.id) | (DBRepairAudit.cluster_code == cluster.cluster_code),
    DBRepairAudit.verified_at >= window_start_iso,
    DBRepairAudit.verified_at <= window_end_iso
).all()
```

---

## 2. Telemetry Physics & Fail-Closed Sensor Handling (D-19-02, D-19-03)

### 2.1 Speed-Normalized Shock Jerk ($G_{norm}$)
At different vehicle velocities, road profile shock varies non-linearly. We evaluate speed-normalized jerk:
$$G_{norm} = \frac{|G_z - 1.0|}{v / 30.0}$$
- Standard operating speed baseline: $30\text{ km/h}$.
- At $60\text{ km/h}$, a raw $|G_z - 1.0| = 0.30\text{g}$ yields $G_{norm} = \frac{0.30}{2.0} = 0.15$ (smooth pass).
- At $15\text{ km/h}$, a raw $|G_z - 1.0| = 0.20\text{g}$ yields $G_{norm} = \frac{0.20}{0.5} = 0.40$ (severe recurrence shock).

### 2.2 Low Speed & Missing Telematics: Fail-Closed as `NO_DATA`
Under Audit Finding 1.2, missing sensor fields previously defaulted to clean passes:
- Missing `vertical_gz` defaulted to $1.0\text{g}$.
- Missing `optical_status` defaulted to `"SMOOTH_SURFACE"`.
- Buses crawling below $15\text{ km/h}$ do not generate sufficient suspension deflection for IMU shock detection, nor can camera shutter frequencies avoid motion artifacts.

**Fail-Closed Rule**:
If $v < 15\text{ km/h}$ OR `vertical_gz is None` OR `optical_status is None`:
- Set `is_no_data = True`
- Set `optical_status = "NO_DATA"`
- Set `passed_optical = False`
- Set `passed_imu = False`
- **Result**: The pass is NEVER counted towards the 3 clean verified passes required for payment release.
- **Safety**: A `NO_DATA` pass does NOT trigger `REPAIR_FAILED_RECURRENCE` either; lack of data is not evidence of defect recurrence.

### 2.3 Elimination of Fabricated Fallback Penalty Data (D-19-03)
In `backend/app/services/concurrence_service.py` lines 314–320:
```python
# OBSOLETE FABRICATED LOGIC:
failing_pass = next((p for p in result.passes if abs(p.vertical_gz - 1.0) >= SHOCK_FAILURE_THRESHOLD or not p.passed_optical), None)
failing_gz = failing_pass.vertical_gz if failing_pass else 1.48      # <-- REMOVE!
failing_bus = failing_pass.bus_id if failing_pass else "BUS-04"       # <-- REMOVE!
```

**New Policy**:
- Scan `result.passes` for an empirical tripping pass ($G_{norm} \ge 0.35$ or optical cavity detection, where `is_no_data == False` and $v \ge 15\text{ km/h}$).
- If an empirical pass is identified:
  - `measured_gz = failing_pass.vertical_gz`
  - `bus_id = failing_pass.bus_id`
  - Compute proposed Clause 14 penalty amount via `calculate_clause14_penalty()`.
  - Set `proposed_deduction = penalty_amount`.
- If NO valid empirical failing pass is found:
  - Do NOT debit or penalize! Set `proposed_deduction = 0.0`.
  - Absolute elimination of synthetic defaults (`1.48g`, `"BUS-04"`).

---

## 3. Municipal Governance Realignment & Officer Certification (D-19-04)

### 3.1 Statutory Notice vs. Autonomous Escrow Debits
Unilateral auto-debits without engineer digital sign-off violate Indian contract arbitration standards and MoHUA procedural norms. Concurrence evaluation must produce **recommendations** for municipal engineers rather than autonomous financial actions.

### 3.2 Schema Extensions in Concurrence & Work Orders
In `ConcurrenceEvaluationResult` (`concurrence_service.py` and `schemas.py`):
```python
class ConcurrenceEvaluationResult(BaseModel):
    order_id: str
    status: str
    distinct_buses_count: int
    required_buses_count: int = REQUIRED_DISTINCT_BUSES
    window_hours: int = MONITORING_WINDOW_HOURS
    passes: List[ConcurrencePassItem] = Field(default_factory=list)
    recommend_release: bool = False
    proposed_deduction: float = 0.0
    approval_status: str = "PENDING_AE_REVIEW"  # PENDING_AE_REVIEW | RECOMMENDED_BY_AE | CERTIFIED_BY_EE | REJECTED_BY_OFFICER
    officer_notes: Optional[str] = None
    invoice_clearance_authorized: bool = False  # Maintained for backward compatibility
    escrow_holdback_released: bool = False     # Held until EE certification
    failure_reason: Optional[str] = None
```

- When concurrence criteria (3 distinct trips in 48h, $G_{norm} < 0.15$, optical smooth surface) are satisfied:
  - `status = "REPAIR_VERIFIED"`
  - `recommend_release = True`
  - `proposed_deduction = 0.0`
  - `approval_status = "RECOMMENDED_BY_AE"` (or `PENDING_AE_REVIEW`)
  - `invoice_clearance_authorized = True`
  - `escrow_holdback_released = False` (actual escrow liquidation awaits EE certification)
- When recurrence shock or cavity is confirmed:
  - `status = "REPAIR_FAILED_RECURRENCE"`
  - `recommend_release = False`
  - `proposed_deduction = calculate_clause14_penalty(re_count).amount`
  - `approval_status = "PENDING_AE_REVIEW"` (Form 14 notice drafted under 7-day cure window, no immediate debit)

### 3.3 UI Realignment in `WorkOrderActionConsole.tsx` (Tab 3)
1. **Button Update**: Replace "Authorize Payment & Release Escrow" with:
   `"Recommend Milestone Payment Release (Requires AE/EE Certification)"`
2. **Proposed Deduction Display**: Display proposed contractor deduction rather than unilateral immediate penalty deduction.
3. **Certification Notice**: Clearly inform the user that statutory release requires AE/EE digital sign-off under Section 65B BSA 2023.

---

## 4. Structured Defect Triage Schema Extensions (D-19-05)

### 4.1 ORM Model: `DBDistressCluster`
In `backend/app/models/db_models.py`, add 5 fields to `DBDistressCluster`:
```python
repair_completed_at = Column(String(64), nullable=True)
acknowledged_at = Column(String(64), nullable=True)
assigned_officer_id = Column(String(64), nullable=True)
rejection_reason = Column(String(64), nullable=True)
triage_status = Column(String(32), default="NEW")
```

- **`triage_status`**: Choices: `"NEW"`, `"ACKNOWLEDGED"`, `"ASSIGNED"`, `"REJECTED"`.
- **`rejection_reason`**: Strictly validated to:
  - `"FALSE_POSITIVE"`
  - `"DUPLICATE_CLUSTER"`
  - `"JURISDICTION_NON_PWD"`
  - `"UNDER_ACTIVE_REPAIR"`

### 4.2 SQLite PRAGMA Migrations in `database.py`
In `init_db()`, query `PRAGMA table_info(distress_clusters)` and apply:
```python
for col in ("repair_completed_at", "acknowledged_at", "assigned_officer_id", "rejection_reason"):
    if col not in existing_cols and existing_cols:
        cursor.execute(f"ALTER TABLE distress_clusters ADD COLUMN {col} TEXT")
if "triage_status" not in existing_cols and existing_cols:
    cursor.execute("ALTER TABLE distress_clusters ADD COLUMN triage_status TEXT DEFAULT 'NEW'")
```

### 4.3 REST API Triage Endpoint
Endpoint: `POST /api/clusters/{cluster_id}/triage` (with alias `POST /api/work-orders/{order_id}/triage`)
- Accepts `ClusterTriageRequest`:
  - `officer_id: str`
  - `action: str` (`"ACKNOWLEDGE"`, `"ASSIGN"`, `"REJECT"`)
  - `assigned_officer_id: Optional[str]`
  - `rejection_reason: Optional[str]`
  - `notes: Optional[str]`
- Validates actions:
  - If `REJECT`: requires valid `rejection_reason` $\in$ allowed set; updates `cluster.status = "rejected"`, `cluster.triage_status = "REJECTED"`.
  - If `ACKNOWLEDGE`: sets `cluster.triage_status = "ACKNOWLEDGED"`, `cluster.acknowledged_at = now_iso`.
  - If `ASSIGN`: sets `cluster.triage_status = "ASSIGNED"`, `cluster.status = "assigned"`, `cluster.assigned_officer_id = assigned_officer_id or officer_id`.
- Emits audit log entry and returns updated `HazardCluster`.

---

## 5. Architectural & Behavioral Impact Analysis

| Component | Before (v5.0 / Phase 18) | After (v6.0 / Phase 19) |
|---|---|---|
| **Concurrence Query** | Searched all `raw_ingests` without timestamp bounds | Strictly queries $t \in [t_{\text{repair}}, t_{\text{repair}} + 48\text{h}]$, ignoring pre-repair detections |
| **Corridor Tolerance** | 15.0m buffer (30m circle) | 5.0m lane-aligned corridor tolerance |
| **Telemetry Defaults** | Missing IMU/camera defaulted to $1.0\text{g}$ / SMOOTH | Missing sensors or $v < 15\text{ km/h}$ fail-closed as `NO_DATA` (never clean passes) |
| **Failing Pass Fallbacks** | Fabricated $1.48\text{g}$ and `"BUS-04"` if no pass found | Zero fallback fabrication; cites empirical pass only; ₹0 deduction if no pass exists |
| **Contractor Action** | Unilateral immediate escrow debits | Structured recommendations (`recommend_release`, `proposed_deduction`, AE/EE approval) |
| **Cluster Triage** | Only free-text field notes | Structured triage status and validated rejection reasons |

---

## Validation Architecture

### Automated Backend Test Command
```powershell
pytest -o pythonpath=backend backend/tests/test_concurrence_gating.py backend/tests/test_contractor_ledger.py backend/tests/test_urban_sensing.py backend/tests/test_copilot_engine.py -q
```

### Frontend Build Command
```powershell
npm --prefix frontend run build
```

### Specific Test Coverage
1. `test_post_repair_time_window_filtering`: Telemetry before $t_{\text{repair}}$ is ignored; only passes within 48h after repair qualify.
2. `test_corridor_tolerance_5m`: Telemetry within 5m matches; telemetry at 8m (previously within 15m) is excluded.
3. `test_fail_closed_missing_sensor_and_crawl_speed`: Telemetry with missing $G_z$, missing optical, or $v < 15\text{ km/h}$ flagged as `NO_DATA` and excluded from clean quorum.
4. `test_zero_fallback_penalty_fabrication`: Failure without empirical tripping pass proposes no deduction and fabricates no values.
5. `test_officer_certified_recommendation_workflow`: Verified concurrence produces `recommend_release = True`, `proposed_deduction = 0.0`, `approval_status = "RECOMMENDED_BY_AE"` without autonomous debit.
6. `test_cluster_triage_endpoint`: Validates `POST /api/clusters/{id}/triage` for `ACKNOWLEDGE`, `ASSIGN`, and `REJECT` with strict rejection reason validation.

## RESEARCH COMPLETE
