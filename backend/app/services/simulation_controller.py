"""
simulation_controller.py — Runtime toggle controller for background synthetic generator
and vehicle position simulation loops.

Enables demo presenters to pause all simulated data generation with a single click
or config toggle, ensuring judged demos exclusively showcase real computer vision detections.
"""

from app.core.config import settings

class SimulationController:
    def __init__(self):
        # If DEMO_MODE is true, background simulation starts paused by default
        self.demo_mode: bool = settings.DEMO_MODE
        self.fleet_simulation_active: bool = settings.ENABLE_FLEET_SIMULATION and not self.demo_mode
        self.synthetic_generation_active: bool = settings.ENABLE_SYNTHETIC_GENERATION and not self.demo_mode
        self.interval_seconds: int = settings.SYNTHETIC_INTERVAL_SECONDS

    def is_fleet_simulation_active(self) -> bool:
        return self.fleet_simulation_active and not self.demo_mode

    def is_synthetic_generation_active(self) -> bool:
        return self.synthetic_generation_active and not self.demo_mode

    def set_fleet_simulation(self, active: bool):
        self.fleet_simulation_active = active

    def set_synthetic_generation(self, active: bool):
        self.synthetic_generation_active = active

    def set_demo_mode(self, enabled: bool):
        self.demo_mode = enabled
        if enabled:
            # Entering demo mode: pause background fake pings
            self.fleet_simulation_active = False
            self.synthetic_generation_active = False
        else:
            # Exiting demo mode: restore to config defaults
            self.fleet_simulation_active = settings.ENABLE_FLEET_SIMULATION
            self.synthetic_generation_active = settings.ENABLE_SYNTHETIC_GENERATION

    def get_status(self) -> dict:
        return {
            "demo_mode": self.demo_mode,
            "fleet_simulation_active": self.is_fleet_simulation_active(),
            "synthetic_generation_active": self.is_synthetic_generation_active(),
            "interval_seconds": self.interval_seconds,
            "mode_label": "DEMO MODE (Simulation Paused — 100% Real Detections)" if self.demo_mode or (not self.fleet_simulation_active and not self.synthetic_generation_active) else "SIMULATION ACTIVE (Background Fleet & Synthetic Pings)"
        }

simulation_controller = SimulationController()
