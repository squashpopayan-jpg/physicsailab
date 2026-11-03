# Cap. 10: Rutherford por integración numérica de la órbita; Bohr de dos cuerpos con scipy.constants; Moseley por ajuste con numpy
import xraydb
e, me, hbar, c, eps0 = C.e, C.m_e, C.hbar, C.c, C.epsilon_0
# --- Rutherford: m r″ = k r/|r|³ con m = v∞ = 1, d₀ = 1 ⇒ k = 1/2. Ángulo de deflexión por integración numérica (DOP853) ---
def rutherford_angle(b, X0=2e5):
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
ref['ruth'] = [dict(b=b, theta=rutherford_angle(b)) for b in (0.1, 0.5, 1.0, 2.0, 5.0)]
# distancia mínima: de la conservación de energía y del momento angular (resuelta numéricamente con brentq)
def rmin_num(b):
    k = 0.5; E = 0.5; L = b
    f = lambda r: E - 0.5*L*L/r**2 - k/r
    return optimize.brentq(f, 1e-6, 1e3)
ref['rmin'] = [dict(b=b, rmin=rmin_num(b)) for b in (0.1, 0.5, 1.0, 2.0, 5.0)]
# --- Bohr con masa reducida ---
ke2 = e*e/(4*math.pi*eps0)
def level(n, mu, Z=1): return -mu*(Z*ke2)**2/(2*hbar**2*n**2)/e
mp = C.m_p; mmu = C.physical_constants['muon mass'][0]
ref['bohr2'] = dict(inf=level(1, me), H=level(1, me*mp/(me+mp)), pos=level(1, me/2), mup=level(1, mmu*mp/(mmu+mp)), a0=C.physical_constants['Bohr radius'][0],
                    Ry=C.physical_constants['Rydberg constant times hc in eV'][0], mu_p=mmu*mp/(mmu+mp), mmu=mmu)
# --- Moseley: ajuste lineal con numpy.polyfit de √E frente a Z (líneas K de xraydb) ---
els = [('Mg', 12), ('Ca', 20), ('Ti', 22), ('Cr', 24), ('Fe', 26), ('Co', 27), ('Cu', 29), ('Zn', 30)]
Zs = np.array([z for _, z in els], float); Es = np.array([xraydb.xray_line(s, 'Ka1').energy for s, _ in els], float)
a_, b_ = np.polyfit(Zs, np.sqrt(Es), 1); ref['moseley'] = dict(Z=Zs.tolist(), E=Es.tolist(), a=float(a_), sigma=float(-b_/a_), a_theory=math.sqrt(0.75*13.605693122994))
ref['moseley_kalpha'] = {s_: xraydb.xray_line(s_, 'Ka1').energy for s_ in ('Mg','Ca','Ti','Cr','Fe','Co','Cu','Zn','Zr','Mo','Ag','Sn','W','Au')}
