import os
from typing import List

class Settings:
    PROJECT_NAME: str = "RoadSaarthi — Mobile Urban Road Intelligence"
    VERSION: str = "2.6.0-PROD"
    API_V1_STR: str = "/api"
    
    # RPI Formula Weights
    WEIGHT_SEVERITY: float = 0.40
    WEIGHT_FREQUENCY: float = 0.20
    WEIGHT_HIGHWAY: float = 0.20
    WEIGHT_POI: float = 0.20
    MAX_POI_DISTANCE_M: float = 1500.0
    
    # Spatial Clustering
    DBSCAN_EPS_METERS: float = 15.0
    
    # Database (No hardcoded credentials; defaults to local SQLite unless DATABASE_URL env var is provided)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite")
    USE_POSTGIS: bool = os.getenv("USE_POSTGIS", "false").lower() == "true"
    
    # Simulation & Demo Toggles (Control background loops during judged demo)
    ENABLE_FLEET_SIMULATION: bool = os.getenv("ENABLE_FLEET_SIMULATION", "true").lower() in ("true", "1", "yes")
    ENABLE_SYNTHETIC_GENERATION: bool = os.getenv("ENABLE_SYNTHETIC_GENERATION", "true").lower() in ("true", "1", "yes")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    SYNTHETIC_INTERVAL_SECONDS: int = int(os.getenv("SYNTHETIC_INTERVAL_SECONDS", "300"))

    # Authentication & Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "roadsaarthi-sovereign-gov-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

    # Multi-Channel Gateway Tokens
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")

    # CORS (Explicit allowed origins avoiding wildcard credentials violation)
    DEFAULT_CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    _cors_env = os.getenv("CORS_ORIGINS", "")
    CORS_ORIGINS: List[str] = [orig.strip() for orig in _cors_env.split(",") if orig.strip()] if _cors_env else DEFAULT_CORS_ORIGINS

settings = Settings()




