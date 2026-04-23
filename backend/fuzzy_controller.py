import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl


def _build_fuzzy_system() -> ctrl.ControlSystemSimulation:
    error      = ctrl.Antecedent(np.arange(-15, 15.1, 0.1), 'error')
    correction = ctrl.Consequent(np.arange(-20, 20.1, 0.1), 'correction')

    error['NG'] = fuzz.trimf(error.universe, [-15,  -15,   -7.5])
    error['NP'] = fuzz.trimf(error.universe, [-15,   -7.5,  0  ])
    error['Z']  = fuzz.trimf(error.universe, [ -7.5,  0,    7.5])
    error['PP'] = fuzz.trimf(error.universe, [  0,    7.5, 15  ])
    error['PG'] = fuzz.trimf(error.universe, [  7.5, 15,   15  ])

    correction['NG'] = fuzz.trimf(correction.universe, [-20,  -20,  -10])
    correction['NP'] = fuzz.trimf(correction.universe, [-20,  -10,   0 ])
    correction['Z']  = fuzz.trimf(correction.universe, [-10,    0,  10 ])
    correction['PP'] = fuzz.trimf(correction.universe, [  0,   10,  20 ])
    correction['PG'] = fuzz.trimf(correction.universe, [ 10,   20,  20 ])

    rule_1 = ctrl.Rule(error['NG'], correction['PG'])
    rule_2 = ctrl.Rule(error['NP'], correction['PP'])
    rule_3 = ctrl.Rule(error['Z'],  correction['Z'])
    rule_4 = ctrl.Rule(error['PP'], correction['NP'])
    rule_5 = ctrl.Rule(error['PG'], correction['NG'])

    system = ctrl.ControlSystem([rule_1, rule_2, rule_3, rule_4, rule_5])
    simulation = ctrl.ControlSystemSimulation(system)

    return simulation


class FuzzyAutopilot:
    def __init__(self):
        self.sim_x = _build_fuzzy_system()
        self.sim_y = _build_fuzzy_system()

    def _compute(self, sim: ctrl.ControlSystemSimulation, error_val: float) -> float:
        error_clipped = float(np.clip(error_val, -15.0, 15.0))

        sim.input['error'] = error_clipped
        sim.compute()

        return float(sim.output['correction'])

    def compute_x(self, error_x: float) -> float:
        return self._compute(self.sim_x, error_x)

    def compute_y(self, error_y: float) -> float:
        return self._compute(self.sim_y, error_y)

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