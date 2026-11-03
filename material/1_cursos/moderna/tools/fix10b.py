# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\tests\refs\ref10.py'
s = open(p, encoding='utf-8').read()
i0 = s.index("def rutherford_angle(b, X0=2e5):")
i1 = s.index("ref['ruth'] =")
new = """def rutherford_angle(b, X0=2e5):
    k = 0.5
    def f(t, y):
        x, yy, vx, vy = y; r3 = (x*x+yy*yy)**1.5
        return [vx, vy, k*x/r3, k*yy/r3]
    ev = lambda t, y: math.hypot(y[0], y[1]) - X0
    ev.terminal = False; ev.direction = 1
    sol = integrate.solve_ivp(f, [0, 6*X0], [-X0, b, 1.0, 0.0], method='DOP853', rtol=1e-13, atol=1e-13, events=ev)
    te = sol.t_events[0]; ye = sol.y_events[0]
    vx, vy = ye[-1][2], ye[-1][3]            # velocidad cuando la partícula vuelve a estar a distancia X0 del centro
    return math.atan2(vy, vx)
"""
s = s[:i0] + new + s[i1:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
