import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any, List
from fastapi import Header, HTTPException, Depends, status
from app.core.config import settings

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if (len(data) % 4) != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique salt."""
    if not salt:
        salt = hashlib.sha256(f"{time.time()}_{password}".encode('utf-8')).hexdigest()[:16]
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    """Verifies a plain password against an expected PBKDF2-HMAC-SHA256 hash."""
    computed_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(computed_hash, expected_hash)

DEFAULT_GOV_PASSWORD = "chennai@2026"
DEFAULT_SALT = "SheherSaathi_salt_2026"
DEFAULT_PW_HASH = "c48c3acb586a71bfac26854fca1a837b984ebd03b4390ae7b19903562294ddc5"

# ── Seeded Government Personas (4 Official Civic Profiles + Admin Superuser) ──
SEEDED_USERS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "username": "admin",
        "name": "State ICCC Super Administrator",
        "email": "admin@metravue.chennai.gov.in",
        "role": "admin",
        "designation": "Chief Director & System Administrator",
        "department": "Integrated Command and Control Centre (ICCC)",
        "agency": "State Municipal Administration & Digital Hub",
        "badge_number": "ICCC-ADMIN-001",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["all", "work_orders", "incidents", "anpr_review", "echallan", "pcr_dispatch", "vahan_compliance", "executive_oversight", "high_value_approval", "policy_reports", "command"]
    },
    "admin2": {
        "username": "admin2",
        "name": "Dr. V. Arvind, Ph.D.",
        "email": "admin2@metravue.chennai.gov.in",
        "role": "admin2",
        "designation": "Chief Director of Fleet Edge AI & Autonomous Systems",
        "department": "Decentralized Edge Telematics & MLOps Command (ICCC-Edge)",
        "agency": "State Urban Transport & Edge Intelligence Authority",
        "badge_number": "EDGE-ADMIN-002",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["all", "edge_mlops", "fleet_telemetry", "work_orders", "incidents", "anpr_review", "echallan", "command"]
    },
    "traffic_police": {
        "username": "traffic_police",
        "name": "S. Priya, IPS",
        "email": "traffic_police@metravue.chennai.gov.in",
        "role": "traffic_police",
        "designation": "Deputy Commissioner of Police (Traffic)",
        "department": "Traffic Enforcement & PCR Interceptor Wing",
        "agency": "Greater Chennai Traffic Police (GCTP)",
        "badge_number": "GCTP-IPS-009",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["incidents", "anpr_review", "echallan", "pcr_dispatch", "command"]
    },
    "pwd_engineer": {
        "username": "pwd_engineer",
        "name": "Er. K. Shanmugam, M.E.",
        "email": "pwd_engineer@metravue.chennai.gov.in",
        "role": "pwd_engineer",
        "designation": "Superintending Engineer (Roads & Bridges)",
        "department": "Bus Route Roads & PWD Works Dept",
        "agency": "GCC & Tamil Nadu Highways PWD",
        "badge_number": "PWD-ENG-312",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["work_orders", "clusters", "road_memory", "sla_enforcement", "command"]
    },
    "rto_officer": {
        "username": "rto_officer",
        "name": "Thiru M. Natarajan",
        "email": "rto_officer@metravue.chennai.gov.in",
        "role": "rto_officer",
        "designation": "Regional Transport Officer (Chennai Central / TN-01)",
        "department": "Vehicle Compliance & Registration Authority",
        "agency": "Tamil Nadu Transport Department (RTO)",
        "badge_number": "TN-RTO-01",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["vahan_compliance", "confirmed_anpr", "rto_lookup", "command"]
    },
    "commissioner": {
        "username": "commissioner",
        "name": "Dr. R. Sundaravel, IAS",
        "email": "commissioner@metravue.chennai.gov.in",
        "role": "commissioner",
        "designation": "Transport Commissioner & Secretary to Govt",
        "department": "Transport & Urban Infrastructure Oversight",
        "agency": "Government of Tamil Nadu",
        "badge_number": "GOV-IAS-001",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["executive_oversight", "high_value_approval", "policy_reports", "analytics", "command"]
    }
}

# Legacy Persona Aliases for Seamless Backward Compatibility
ROLE_ALIASES: Dict[str, str] = {
    "safety": "traffic_police",
    "maintenance": "pwd_engineer",
    "operations": "rto_officer",
    "admin2": "admin2",
    "edge_admin": "admin2",
    "edge": "admin2"
}

def resolve_canonical_role(role_name: str) -> str:
    """Normalizes role aliases to the 4 canonical profiles."""
    r = (role_name or "").lower().strip()
    return ROLE_ALIASES.get(r, r)

# ── JWT Functions ────────────────────────────────────────────────────────────

def create_access_token(data: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    """Creates an HMAC-SHA256 signed JWT token."""
    header = {"alg": settings.JWT_ALGORITHM, "typ": "JWT"}
    now = int(time.time())
    expires = now + (expires_delta_seconds or (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
    
    payload = {
        **data,
        "iat": now,
        "exp": expires,
        "iss": "SheherSaathi-Auth-Core"
    }
    
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode('utf-8'),
        f"{header_b64}.{payload_b64}".encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and verifies an HMAC-SHA256 JWT token."""
    parts = token.split('.')
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT token format",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    header_b64, payload_b64, signature_b64 = parts
    expected_sig = hmac.new(
        settings.JWT_SECRET_KEY.encode('utf-8'),
        f"{header_b64}.{payload_b64}".encode('utf-8'),
        hashlib.sha256
    ).digest()
    expected_sig_b64 = _base64url_encode(expected_sig)
    
    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT signature",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Corrupt JWT payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    now = int(time.time())
    if "exp" in payload and payload["exp"] < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    return payload

# ── FastAPI Dependencies ─────────────────────────────────────────────────────

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_role: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Validates Authorization: Bearer <token>.
    Supports X-Demo-Role header as fallback during interactive demo exploration.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        payload = decode_access_token(token)
        username = payload.get("sub") or payload.get("username")
        canonical_user_key = resolve_canonical_role(username)
        user = SEEDED_USERS.get(canonical_user_key)
        if user:
            return user
        canonical_role = resolve_canonical_role(payload.get("role", "pwd_engineer"))
        return {
            "username": username,
            "role": canonical_role,
            "name": payload.get("name", username),
            "agency": payload.get("agency", "GCC & TN Highways PWD"),
            "permissions": payload.get("permissions", ["work_orders", "clusters", "command"])
        }
    
    # Fallback to demo persona if provided in header
    if x_demo_role:
        canonical_key = resolve_canonical_role(x_demo_role)
        if canonical_key in SEEDED_USERS:
            return SEEDED_USERS[canonical_key]
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Bearer token required.",
        headers={"WWW-Authenticate": "Bearer"}
    )

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_role: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """Yields current user if token present, or None if anonymous."""
    try:
        return get_current_user(authorization, x_demo_role)
    except HTTPException:
        return None

def require_roles(allowed_roles: List[str]):
    """Returns a dependency function verifying the user's role against allowed roles."""
    canonical_allowed = set()
    for r in allowed_roles:
        canonical_allowed.add(resolve_canonical_role(r))
        canonical_allowed.add(r.lower())

    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        role = resolve_canonical_role(user.get("role", ""))
        if role == "admin" or user.get("role") == "admin":
            return user  # Superuser Master Access to all civic subsystems
        if role not in canonical_allowed and user.get("role") not in canonical_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{role}' does not have permission. Required role(s): {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
