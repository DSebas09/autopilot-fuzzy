import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
from skfuzzy.control import ControlSystem

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


def _build_fuzzy_system() -> ControlSystem:
    error      = ctrl.Antecedent(np.arange(ERROR_MIN, ERROR_MAX + UNIVERSE_STEP, UNIVERSE_STEP), 'error')
    correction = ctrl.Consequent(np.arange(CONTROL_MIN, CONTROL_MAX + UNIVERSE_STEP, UNIVERSE_STEP), 'correction')

    error['NG'] = fuzz.trimf(error.universe, [ERROR_MIN, ERROR_MIN, -_ERROR_MID])
    error['NP'] = fuzz.trimf(error.universe, [ERROR_MIN, -_ERROR_MID, 0.0])
    error['Z']  = fuzz.trimf(error.universe, [-_ERROR_MID, 0.0, _ERROR_MID])
    error['PP'] = fuzz.trimf(error.universe, [0.0, _ERROR_MID, ERROR_MAX])
    error['PG'] = fuzz.trimf(error.universe, [_ERROR_MID, ERROR_MAX, ERROR_MAX])

    correction['NG'] = fuzz.trimf(correction.universe, [CONTROL_MIN, CONTROL_MIN, -_CONTROL_MID])
    correction['NP'] = fuzz.trimf(correction.universe, [CONTROL_MIN, -_CONTROL_MID, 0.0])
    correction['Z']  = fuzz.trimf(correction.universe, [-_CONTROL_MID, 0.0, _CONTROL_MID])
    correction['PP'] = fuzz.trimf(correction.universe, [0.0, _CONTROL_MID, CONTROL_MAX])
    correction['PG'] = fuzz.trimf(correction.universe, [_CONTROL_MID, CONTROL_MAX, CONTROL_MAX])

    rule_1 = ctrl.Rule(error['NG'], correction['PG'])
    rule_2 = ctrl.Rule(error['NP'], correction['PP'])
    rule_3 = ctrl.Rule(error['Z'],  correction['Z'])
    rule_4 = ctrl.Rule(error['PP'], correction['NP'])
    rule_5 = ctrl.Rule(error['PG'], correction['NG'])

    system = ctrl.ControlSystem([rule_1, rule_2, rule_3, rule_4, rule_5])
    return system


class FuzzyAutopilot:
    def __init__(self):
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
            print("FuzzyAutopilot: inference failure (error=%.3f) → fallback 0.0 | %s: %s", e)
            return 0.0

    def compute_x(self, error_x: float) -> float:
        """Calculate the correction for the X-axis (roll)."""
        return self._compute(self._system_x, error_x)

    def compute_y(self, error_y: float) -> float:
        """Calculate the correction for the Y-axis (pitch)."""
        return self._compute(self._system_y, error_y)

if __name__ == '__main__':
    pilot = FuzzyAutopilot()

    cases = [
        ("Zero error",              0.0,   0.0),
        ("Small error X pos",       3.0,   0.0),
        ("Large negative X error", -12.0,  0.0),
        ("Error Y small neg",       0.0,  -4.0),
        ("Both axes deviated",      8.0,  -8.0),
    ]

    print(f"\n{'Case':<30} {'Error X':>8} {'Error Y':>8} {'Ux':>8} {'Uy':>8}")
    print("-" * 66)
    for name, ex, ey in cases:
        ux = pilot.compute_x(ex)
        uy = pilot.compute_y(ey)
        print(f"{name:<30} {ex:>8.2f} {ey:>8.2f} {ux:>8.3f} {uy:>8.3f}")
    print()