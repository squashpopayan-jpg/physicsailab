# Cap. 21: macroscópicos — ecuación de la brecha BCS con corte ħω_D (SciPy), RCSJ por DOP853, Fraunhofer por quad, Landau por minimize_scalar, BEC en trampa por suma exacta
from scipy.integrate import quad, solve_ivp
from scipy.optimize import brentq, minimize_scalar
# --- BCS con corte: 1/NV = ln(1.134 ħω_D/kTc) se obtiene de la ecuación a T_c; Δ(T) por brentq ---
WD = 300.0         # ħω_D/kTc
def inv_NV():
    return quad(lambda x: math.tanh(x/2)/x, 0, WD, epsabs=0, epsrel=1e-12, limit=800)[0]
G = inv_NV()
def gap_cut(t):
    f = lambda D: quad(lambda x: math.tanh(math.sqrt(x*x+D*D)/(2*t))/math.sqrt(x*x+D*D), 0, WD, epsabs=0, epsrel=1e-12, limit=800)[0]-G
    return brentq(f, 1e-6, 2.5, xtol=1e-13)
ref['bcs'] = [dict(t=t, D=gap_cut(t)) for t in (0.05, 0.3, 0.5, 0.7, 0.9, 0.99)]
# salto del calor específico: ΔC/(γTc) = 1.43 (derivada de la entropía; aquí con Δ² ≈ 9.38(1−t) cerca de Tc por derivación de la ecuación de la brecha)
d = (gap_cut(0.999)**2-gap_cut(0.9999)**2)/(0.9999-0.999); ref['dD2dt'] = float(d)
# --- RCSJ sobreamortiguado por DOP853 ---
def rcsj_num(i, T=600):
    s = solve_ivp(lambda t, y: [i-math.sin(y[0])], (0, T), [0.0], method='DOP853', rtol=1e-12, atol=1e-12); return float(s.y[0][-1]/T)
ref['rcsj'] = [dict(i=i, v=rcsj_num(i)) for i in (1.05, 1.5, 2.0, 5.0)]
# --- Fraunhofer: ∫₀¹ sen(φ₀ + 2π x Φ/Φ₀) dx maximizado sobre φ₀ ---
def fraunhofer_num(f):
    g = lambda p0: -abs(quad(lambda x: math.sin(p0+2*math.pi*f*x), 0, 1, epsabs=0, epsrel=1e-13)[0])
    r = minimize_scalar(g, bounds=(0, math.pi), method='bounded', options=dict(xatol=1e-10)); return float(-r.fun)
ref['fraunhofer'] = [dict(f=f, I=fraunhofer_num(f)) for f in (0.0, 0.25, 0.5, 1.2, 1.5, 2.5)]
# --- constantes ---
ref['mac_consts'] = dict(Phi0=C.physical_constants['mag. flux quantum'][0], KJ=C.physical_constants['Josephson constant'][0])
# --- Landau con el espectro de rotones ---
Dl = 8.65*C.k; p0 = 1.91e10*C.hbar; mu = 0.16*4.002602*C.atomic_mass
r = minimize_scalar(lambda p: (Dl+(p-p0)**2/(2*mu))/p, bounds=(0.5*p0, 1.5*p0), method='bounded', options=dict(xatol=1e-40))
ref['landau'] = dict(v=float(r.fun), p=float(r.x))
# --- BEC en trampa armónica isótropa: Tc por suma exacta sobre los niveles ---
def tc_exact(N, w):
    hw = C.hbar*w
    def Nth(T):
        # niveles n = nx + ny + nz: degeneración (n+1)(n+2)/2 ; energía n ħω (sin la de punto cero); μ = 0 (condensado en el fundamental)
        n = np.arange(1, 4000); g = (n+1)*(n+2)/2; x = hw*n/(C.k*T); return float((g/np.expm1(x)).sum())
    return brentq(lambda T: Nth(T)-N, 1e-10, 1e-3)
ref['trap'] = [dict(N=N, w=2*math.pi*f, Tc=tc_exact(N, 2*math.pi*f)) for (N, f) in ((1e6, 100.0), (1e5, 100.0), (1e7, 50.0))]
