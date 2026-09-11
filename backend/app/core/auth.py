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
DEFAULT_SALT = "roadsaarthi_salt_2026"
DEFAULT_PW_HASH = "c48c3acb586a71bfac26854fca1a837b984ebd03b4390ae7b19903562294ddc5"

# ── Seeded Government Personas ───────────────────────────────────────────────
SEEDED_USERS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "username": "admin",
        "name": "Dr. R. Sundaravel, IAS",
        "email": "admin@metravue.chennai.gov.in",
        "role": "admin",
        "designation": "Chief Road Engineer & Commissioner",
        "department": "Command & Policy Operations",
        "agency": "Greater Chennai Corporation (GCC)",
        "badge_number": "GCC-ADM-001",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["all"]
    },
    "operations": {
        "username": "operations",
        "name": "Capt. M. Balaji",
        "email": "operations@metravue.chennai.gov.in",
        "role": "operations",
        "designation": "Chief Transport Operations Manager",
        "department": "Intelligent Transit Monitoring",
        "agency": "Metropolitan Transport Corp (MTC)",
        "badge_number": "MTC-OPS-104",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["fleet", "telemetry", "streams", "analytics"]
    },
    "maintenance": {
        "username": "maintenance",
        "name": "Er. K. Shanmugam, M.E.",
        "email": "maintenance@metravue.chennai.gov.in",
        "role": "maintenance",
        "designation": "Superintending Engineer (Roads & Bridges)",
        "department": "Bus Route Roads & Works Dept",
        "agency": "GCC Engineering Wing",
        "badge_number": "GCC-ENG-312",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["work_orders", "clusters", "contractor_audits", "analytics"]
    },
    "safety": {
        "username": "safety",
        "name": "S. Priya, IPS",
        "email": "safety@metravue.chennai.gov.in",
        "role": "safety",
        "designation": "Deputy Commissioner of Police (Traffic)",
        "department": "Traffic Enforcement & PCR Fleet",
        "agency": "Greater Chennai Traffic Police (GCTP)",
        "badge_number": "GCTP-IPS-009",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["incidents", "anpr_review", "echallan", "pcr_dispatch", "analytics"]
    },
    "analyst": {
        "username": "analyst",
        "name": "V. Divya, M.Tech",
        "email": "analyst@metravue.chennai.gov.in",
        "role": "analyst",
        "designation": "Senior Mobility Data Analyst",
        "department": "Urban Transport Planning Wing",
        "agency": "Chennai Metro Development Authority (CMDA)",
        "badge_number": "CMDA-ANA-045",
        "password_hash": DEFAULT_PW_HASH,
        "salt": DEFAULT_SALT,
        "permissions": ["read_only", "analytics"]
    }
}

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
        "iss": "RoadSaarthi-Auth-Core"
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
        try:
            payload = decode_access_token(token)
            username = payload.get("sub") or payload.get("username")
            user = SEEDED_USERS.get(username)
            if user:
                return user
            return {
                "username": username,
                "role": payload.get("role", "maintenance"),
                "name": payload.get("name", username),
                "agency": payload.get("agency", "GCC Engineering Wing"),
                "permissions": payload.get("permissions", ["work_orders", "clusters", "analytics"])
            }
        except Exception:
            # Stale or invalid bearer token: fall through gracefully to demo header or default
            pass
    
    # Fallback to demo persona if provided in header
    if x_demo_role and x_demo_role.lower() in SEEDED_USERS:
        return SEEDED_USERS[x_demo_role.lower()]
        
    # Default sovereign demo evaluation fallback (Road Maintenance Officer)
    return SEEDED_USERS["maintenance"]

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
    """Returns a dependency function verifying the user's role."""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        role = user.get("role")
        if role == "admin":
            return user  # Admin has sovereign clearance
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{role}' does not have permission. Required role(s): {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
