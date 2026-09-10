import math
from typing import Tuple

# Key Infrastructure & Healthcare / Education Nodes in Chennai
CRITICAL_POIS = [
    {"name": "MIOT International Hospital Corridor", "lat": 13.0232, "lng": 80.1872, "type": "hospital"},
    {"name": "Anna University Highway Zone", "lat": 13.0102, "lng": 80.2355, "type": "university"},
    {"name": "SRM Medical College & University Link", "lat": 12.8236, "lng": 80.0450, "type": "hospital"},
    {"name": "Apollo Hospital, Greams Road Arterial", "lat": 13.0610, "lng": 80.2520, "type": "hospital"},
    {"name": "Fortis Malar Hospital Adyar Corridor", "lat": 13.0065, "lng": 80.2570, "type": "hospital"},
    {"name": "D.A.V. Higher Secondary School Link", "lat": 13.0450, "lng": 80.2380, "type": "school"},
    {"name": "IIT Madras Research Park Highway Gate", "lat": 12.9880, "lng": 80.2440, "type": "university"},
    {"name": "Madras Medical College & Central Corridor", "lat": 13.0805, "lng": 80.2760, "type": "hospital"},
    {"name": "Kendriya Vidyalaya Anna Nagar", "lat": 13.0890, "lng": 80.2120, "type": "school"},
    {"name": "Chennai International Airport T1 Arterial", "lat": 12.9941, "lng": 80.1709, "type": "transit"},
    {"name": "CMBT Koyambedu Central Bus Terminal", "lat": 13.0694, "lng": 80.2057, "type": "transit"},
]

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes accurate geodesic distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def find_nearest_poi(lat: float, lng: float) -> Tuple[str, float]:
    """Finds the closest critical landmark name and its distance in meters."""
    closest_name = "Urban Arterial Network"
    min_dist = float("inf")

    for poi in CRITICAL_POIS:
        dist = haversine_distance_m(lat, lng, poi["lat"], poi["lng"])
        if dist < min_dist:
            min_dist = dist
            closest_name = poi["name"]

    return closest_name, round(min_dist, 1)
