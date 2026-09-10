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
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://roadsaarthi:roadsaarthi@localhost:5432/roadsaarthi_db")
    USE_POSTGIS: bool = os.getenv("USE_POSTGIS", "false").lower() == "true"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
