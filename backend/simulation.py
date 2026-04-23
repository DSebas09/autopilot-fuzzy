import random
from dataclasses import dataclass
from typing import Literal

import numpy as np

from fuzzy_controller import FuzzyAutopilot

TurbulenceIntensity = Literal["low", "medium", "high"]

# Euler integration time step (seconds) — must match the server tick interval
DT: float = 0.1

# Natural velocity damping — simulates aerodynamic friction.
# Without this, angular velocity would accumulate indefinitely.
DAMPING: float = 0.85

# Scales fuzzy correction output into Euler-compatible force units.
# Empirical value: keeps the response visible but stable.
CONTROL_GAIN: float = 0.08

# Maximum angular deviation allowed (degrees).
# Must stay in sync with fuzzy_controller.ERROR_MAX (currently ±15°).
POSITION_LIMIT: float = 15.0

# Maximum turbulence amplitude per intensity level (degrees/s²).
TURBULENCE_PARAMS: dict[TurbulenceIntensity, float] = {
    "low": 1.5,
    "medium": 4.0,
    "high": 8.5,
}

# Pulse amplitude applied when trigger_pulse() is called, per intensity level.
# Higher than continuous turbulence to produce a sharp, visible disturbance.
PULSE_AMPLITUDES: dict[TurbulenceIntensity, float] = {
    "low": 5.0,
    "medium": 10.0,
    "high": 16.0,
}

# Duration of a turbulence pulse in ticks (~0.8 s at DT=0.1)
PULSE_DURATION_TICKS: int = 8


@dataclass(slots=True)
class SimulationState:
    time: float = 0.0

    pos_x: float = 0.0  # roll
    pos_y: float = 0.0  # pitch

    vel_x: float = 0.0
    vel_y: float = 0.0

    ctrl_ux: float = 0.0
    ctrl_uy: float = 0.0

    turb_x: float = 0.0
    turb_y: float = 0.0

    turbulence_intensity: TurbulenceIntensity = "low"

    def to_dict(self) -> dict[str, object]:
        return {
            "type": "state",
            "time": round(self.time, 3),
            "position": {
                "x": round(self.pos_x, 4),
                "y": round(self.pos_y, 4),
            },
            "velocity": {
                "x": round(self.vel_x, 4),
                "y": round(self.vel_y, 4),
            },
            "control": {
                "ux": round(self.ctrl_ux, 4),
                "uy": round(self.ctrl_uy, 4),
            },
            "turbulence": {
                "x": round(self.turb_x, 4),
                "y": round(self.turb_y, 4),
            },
            "turbulence_intensity": self.turbulence_intensity,
        }


class AircraftSimulation:
    def __init__(self) -> None:
        self.autopilot = FuzzyAutopilot()
        self.state = SimulationState()
        self.paused: bool = False
        self._intensity: TurbulenceIntensity = "low"

        # Pulse state: tracks remaining ticks and amplitude of an active pulse
        self._pulse_ticks_remaining: int = 0
        self._pulse_amplitude: float = 0.0

    def reset(self) -> None:
        self.state = SimulationState()
        self._pulse_ticks_remaining = 0

    def set_turbulence_intensity(self, intensity: TurbulenceIntensity) -> None:
        self._intensity = intensity
        self.state.turbulence_intensity = intensity

    def trigger_pulse(self, intensity: TurbulenceIntensity) -> None:
        self._pulse_ticks_remaining = PULSE_DURATION_TICKS
        self._pulse_amplitude = PULSE_AMPLITUDES[intensity]
        self.set_turbulence_intensity(intensity)

    def set_paused(self, value: bool) -> None:
        self.paused = value

    def step(self) -> SimulationState:
        if self.paused:
            return self.state

        turb_x, turb_y = self._generate_turbulence()

        ux = self.autopilot.compute_x(self.state.pos_x)
        uy = self.autopilot.compute_y(self.state.pos_y)

        force_x = -ux * CONTROL_GAIN
        force_y = -uy * CONTROL_GAIN

        accel_x = force_x + turb_x
        accel_y = force_y + turb_y

        new_pos_x, new_vel_x = self._euler_step(self.state.pos_x, self.state.vel_x, accel_x)
        new_pos_y, new_vel_y = self._euler_step(self.state.pos_y, self.state.vel_y, accel_y)

        new_pos_x = float(np.clip(new_pos_x, -POSITION_LIMIT, POSITION_LIMIT))
        new_pos_y = float(np.clip(new_pos_y, -POSITION_LIMIT, POSITION_LIMIT))

        self.state.time    += DT
        self.state.pos_x    = new_pos_x
        self.state.pos_y    = new_pos_y
        self.state.vel_x    = new_vel_x
        self.state.vel_y    = new_vel_y
        self.state.ctrl_ux  = ux
        self.state.ctrl_uy  = uy
        self.state.turb_x   = turb_x
        self.state.turb_y   = turb_y
        self.state.turbulence_intensity = self._intensity

        return self.state

    def _euler_step(self, pos: float, vel: float, accel: float) -> tuple[float, float]:
        new_vel = (vel + accel * DT) * DAMPING
        new_pos = pos + new_vel * DT
        return new_pos, new_vel

    def _generate_turbulence(self) -> tuple[float, float]:
        amp = TURBULENCE_PARAMS[self._intensity]
        turb_x = random.gauss(0, amp * 0.3)
        turb_y = random.gauss(0, amp * 0.3)

        if self._pulse_ticks_remaining > 0:
            turb_x += random.gauss(0, self._pulse_amplitude * 0.4)
            turb_y += random.gauss(0, self._pulse_amplitude * 0.4)
            self._pulse_ticks_remaining -= 1

        return turb_x, turb_y


if __name__ == '__main__':
    sim = AircraftSimulation()
    sim.set_turbulence_intensity("medium")

    print(f"\n{'t':>6} {'pos_x':>8} {'pos_y':>8} {'ux':>8} {'uy':>8} {'turb_x':>8}")
    print("-" * 54)

    for _ in range(20):
        state = sim.step()
        print(
            f"{state.time:>6.1f} "
            f"{state.pos_x:>8.3f} "
            f"{state.pos_y:>8.3f} "
            f"{state.ctrl_ux:>8.3f} "
            f"{state.ctrl_uy:>8.3f} "
            f"{state.turb_x:>8.3f}"
        )