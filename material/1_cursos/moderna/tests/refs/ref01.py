# Cap. 1: interferómetro de Michelson–Morley, resuelto sin fórmulas cerradas (brentq sobre la trayectoria de la luz en el sistema del éter)
def mm_round_trip(L, b, th, contracted=False):
    """Ida y vuelta de la luz en un brazo (vector d desde la fuente) cuando el aparato se mueve con velocidad v = b c a lo largo de x en el éter."""
    v = b*c
    dx, dy = L*math.cos(th), L*math.sin(th)
    if contracted: dx *= math.sqrt(1-b*b)
    f1 = lambda t: math.hypot(dx+v*t, dy) - c*t          # la luz llega al espejo, que se movió v t
    t1 = optimize.brentq(f1, 0, 10*L/c*(1+10*b), xtol=1e-30, rtol=1e-15)
    px, py = dx+v*t1, dy                                  # punto de reflexión (en el sistema del éter)
    f2 = lambda s: math.hypot(px - v*(t1+s), py) - c*s    # la luz vuelve a la fuente, que se sigue moviendo
    s = optimize.brentq(f2, 0, 10*L/c*(1+10*b), xtol=1e-30, rtol=1e-15)
    return t1+s
ref['mm'] = []
for (L, lam, b) in ((11.0, 550e-9, 29.78e3/c), (11.0, 550e-9, 369.8e3/c), (1.0, 632.8e-9, 1e-3), (0.5, 500e-9, 0.1), (11.0, 550e-9, 0.5)):
    row = dict(L=L, lam=lam, b=b, T={}, Tc={})
    for thd in (0, 30, 45, 60, 90, 135):
        th = math.radians(thd)
        row['T'][str(thd)] = mm_round_trip(L, b, th)
        row['Tc'][str(thd)] = mm_round_trip(L, b, th, True)
    ref['mm'].append(row)
# reloj de luz: T = 2 L/(c sqrt(1-b^2)) obtenido de resolver el zigzag con fsolve
def clock(L, b):
    v = b*c
    f = lambda T: math.hypot(L, v*T/2) - c*T/2           # cada tramo mide c T/2 y su proyección es L y v T/2
    return optimize.brentq(f, 0, 100*L/c/(1-b*b)**0.5 + 1e-18, xtol=1e-30, rtol=1e-15)
ref['lightclock'] = [dict(L=L, b=b, T=clock(L, b)) for (L, b) in ((0.3, 0.6), (1.0, 0.9), (0.15, 0.99), (2.0, 0.1))]
mp.mp.dps = 40
_g = mp.mpf(10)**6
ref['omb_1e6'] = float(1 - mp.sqrt(1 - 1/_g**2))
