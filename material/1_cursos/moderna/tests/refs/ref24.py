# Cap. 24: reacciones — cinemática con fsolve, pico de Gamow con minimize_scalar/quad, extinción de cadenas por brentq y Monte Carlo NumPy, cinética puntual con Radau e inversa horaria
from scipy.optimize import fsolve as _fs, brentq as _bq, minimize_scalar as _ms
from scipy.integrate import quad as _quad2, solve_ivp as _ivp2
# cinemática relativista de dos cuerpos: conservación de energía y momento resuelta numéricamente
def _kin(m1, m2, Etot):
    f = lambda p: [math.sqrt(p[0]**2+m1**2)+math.sqrt(p[0]**2+m2**2)-Etot]
    p = _fs(f, [100.0])[0]; return float(math.sqrt(p**2+m1**2)-m1), float(math.sqrt(p**2+m2**2)-m2)
_mn = 939.56542052; _ma = 3727.3794066; _uM = 931.49410242
ref['kin'] = [dict(m1=_mn, m2=_ma, E=_mn+_ma+17.589), dict(m1=_mn, m2=_ma, E=_mn+_ma+17.589)]
ref['kin'] = [dict(m1=m1, m2=m2, E=E, T=_kin(m1, m2, E)) for (m1, m2, E) in ((_mn, _ma, _mn+_ma+17.589), (938.27208816, 3727.3794066, 938.27208816+3727.3794066+18.354), (3727.3794066, 3727.3794066, 2*3727.3794066+17.346))]
# pico de Gamow
def _gamow(Z1, Z2, mu, kT):
    EG = 2*mu*(math.pi/137.035999084*Z1*Z2)**2
    r = _ms(lambda E: E/kT+math.sqrt(EG/E), bounds=(1e-9, 50*kT), method='bounded', options=dict(xatol=1e-14))
    E0 = float(r.x); fE = lambda E: math.exp(-E/kT-math.sqrt(EG/E))
    # anchura (1/e) numérica: el ancho de la gaussiana que reproduce la curvatura en el máximo
    h = E0*1e-4; d2 = (math.log(fE(E0+h))-2*math.log(fE(E0))+math.log(fE(E0-h)))/h**2; sig = 1/math.sqrt(-d2); return dict(EG=EG, E0=E0, sig=float(sig))
_mu = lambda a, b: a*b/(a+b)
ref['gamowfus'] = [dict(name='pp', kT=1.29e-3, **_gamow(1, 1, _mu(938.272, 938.272), 1.29e-3)), dict(name='DT', kT=0.020, **_gamow(1, 1, _mu(1875.613, 2808.921), 0.020)), dict(name='DD', kT=0.020, **_gamow(1, 1, _mu(1875.613, 1875.613), 0.020)), dict(name='pB11', kT=0.100, **_gamow(1, 5, _mu(938.272, 10252.55), 0.100))]
# extinción: brentq y Monte Carlo
def _ext(k): return _bq(lambda q: q-math.exp(k*(q-1)), 0, 1-1e-9) if k > 1 else 1.0
ref['ext'] = [dict(k=k, q=_ext(k)) for k in (1.05, 1.1, 1.5, 2.0, 2.43)]
_rng = np.random.default_rng(7)
def _mc_ext(k, runs=20000, gens=60):
    ext = 0
    for _ in range(runs):
        n = 1
        for g in range(gens):
            n = int(_rng.poisson(k*n)) if n > 0 else 0
            if n == 0 or n > 2000: break
        ext += (n == 0)
    return ext/runs
ref['ext_mc'] = [dict(k=k, q=_mc_ext(k)) for k in (1.1, 1.5, 2.0)]
# cinética puntual (Radau) e inversa horaria
def _kin_pt(rho, beta=0.0065, Lam=1e-4, lam=0.08, T=2.0):
    f = lambda t, y: [(rho-beta)/Lam*y[0]+lam*y[1], beta/Lam*y[0]-lam*y[1]]
    s = _ivp2(f, (0, T), [1.0, beta/(Lam*lam)], method='Radau', rtol=1e-10, atol=1e-12, t_eval=[T]); return float(s.y[0][-1])
def _inh(rho, beta=0.0065, Lam=1e-4, lam=0.08):
    f = lambda w: Lam*w+beta*w/(w+lam)-rho
    return _bq(f, 1e-9, 1e6) if rho > 0 else _bq(f, -lam+1e-9, -1e-12)
ref['pk'] = [dict(rho=r, n=_kin_pt(r), w=_inh(r)) for r in (-0.002, 0.001, 0.003, 0.005)]
