import logging

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
from skfuzzy.control import ControlSystem

__all__ = ["FuzzyAutopilot"]

# Universe of the input variable (deviation error, in degrees)
ERROR_MIN: float = -15.0
ERROR_MAX: float =  15.0

# Universe of the output variable (control correction, in degrees)
CONTROL_MIN: float = -20.0
CONTROL_MAX: float =  20.0

# Resolution of the universe — finer = smoother centroid, slower
UNIVERSE_STEP: float = 0.1

# MF midpoints — derived from limits
_ERROR_MID: float   = (ERROR_MAX - ERROR_MIN) / 4
_CONTROL_MID: float = (CONTROL_MAX - CONTROL_MIN) / 4

_log = logging.getLogger(__name__)

def _make_trimfs(variable: ctrl.Antecedent | ctrl.Consequent, lo: float, mid: float, hi: float) -> None:
    v = variable
    v['NG'] = fuzz.trimf(v.universe, [ lo,   lo,  -mid])
    v['NP'] = fuzz.trimf(v.universe, [ lo,  -mid,  0.0])
    v['Z']  = fuzz.trimf(v.universe, [-mid,  0.0,  mid])
    v['PP'] = fuzz.trimf(v.universe, [ 0.0,  mid,  hi ])
    v['PG'] = fuzz.trimf(v.universe, [ mid,  hi,   hi ])

def _build_fuzzy_system() -> ControlSystem:
    error      = ctrl.Antecedent(np.arange(ERROR_MIN, ERROR_MAX + UNIVERSE_STEP, UNIVERSE_STEP), 'error')
    correction = ctrl.Consequent(np.arange(CONTROL_MIN, CONTROL_MAX + UNIVERSE_STEP, UNIVERSE_STEP), 'correction')

    _make_trimfs(error, lo=ERROR_MIN, mid=_ERROR_MID, hi=ERROR_MAX)
    _make_trimfs(correction, lo=CONTROL_MIN, mid=_CONTROL_MID, hi=CONTROL_MAX)

    # Symmetrical rules: each label is paired with its inverse opposite
    labels = ['NG', 'NP', 'Z', 'PP', 'PG']
    corrections = ['PG', 'PP', 'Z', 'NP', 'NG']

    rules = [
        ctrl.Rule(error[e], correction[c])
        for e, c in zip(labels, corrections)
    ]

    return ctrl.ControlSystem(rules)


class FuzzyAutopilot:
    _system_x: ctrl.ControlSystem
    _system_y: ctrl.ControlSystem

    def __init__(self) -> None:
        # ControlSystem is stateless: it is built once and shared.
        # The ControlSystemSimulation (stateful) is instantiated on each _compute().
        self._system_x = _build_fuzzy_system()
        self._system_y = _build_fuzzy_system()

    def _compute(self, system: ctrl.ControlSystem, error_val: float) -> float:
        error_clipped = float(np.clip(error_val, ERROR_MIN, ERROR_MAX))

        try:
            sim = ctrl.ControlSystemSimulation(system)
            sim.input['error'] = error_clipped
            sim.compute()

            result = float(sim.output['correction'])

            if not np.isfinite(result):
                raise ValueError(f"Defuzzification produced a non-finite value: {result}")

            return result

        except Exception as e:  # noqa: BLE001
            # Safe fallback: no active correction.
            # The simulator is still alive; the next tick will try again.
            _log.warning(
                "FuzzyAutopilot: inference failure (error=%.3f) → fallback 0.0 | %s: %s",
                error_clipped, type(e).__name__, e,
            )
            return 0.0

    def compute_x(self, error_x: float) -> float:
        """Calculate the correction for the X-axis (roll)."""
        return self._compute(self._system_x, error_x)

    def compute_y(self, error_y: float) -> float:
        """Calculate the correction for the Y-axis (pitch)."""
        return self._compute(self._system_y, error_y)

if __name__ == '__main__':
    from typing import NamedTuple

    class Case(NamedTuple):
        name: str
        error_x: float
        error_y: float

    cases: list[Case] = [
        Case("No error", 0.0, 0.0),
        Case("Small positive X error", 3.0, 0.0),
        Case("Large negative X error", -12.0, 0.0),
        Case("Small negative Y error", 0.0, -4.0),
        Case("Both axes misaligned", 8.0, -8.0),
        Case("X edge exactly positive", 15.0, 0.0),
        Case("X edge exactly negative", -15.0, 0.0),
        Case("Y edge exactly positive", 0.0, 15.0),
        Case("Y edge exactly negative", 0.0, -15.0),
    ]

    pilot = FuzzyAutopilot()

    print(f"\n{'─' * 66}")
    print(f"  {'Case':<28} {'Error X':>8} {'Error Y':>8} {'Ux':>8} {'Uy':>8}")
    print(f"{'─' * 66}")

    for c in cases:
        ux = pilot.compute_x(c.error_x)
        uy = pilot.compute_y(c.error_y)
        print(f"  {c.name:<28} {c.error_x:>8.2f} {c.error_y:>8.2f} {ux:>8.3f} {uy:>8.3f}")

    print(f"{'─' * 66}\n")
    print()