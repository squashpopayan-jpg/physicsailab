# Cap. 20: sólidos — bandas por ondas planas (NumPy), semiconductores con Fermi–Dirac completa (SciPy), unión pn por solve_bvp, diodo por difusión numérica, Shockley–Queisser por quad
from scipy.integrate import quad, solve_bvp
from scipy.optimize import brentq, minimize_scalar
import numpy as _np
# --- Kronig–Penney por ondas planas: H = (k+G)² δ + 2P (unidades ħ²/2m = 1, a = 1, β² = E) ---
def kp_pw(P, nG=300, nk=61, nb=4):
    Gs = 2*math.pi*np.arange(-nG, nG+1); ks = np.linspace(0, math.pi, nk); lo = np.full(nb, np.inf); hi = np.full(nb, -np.inf)
    V = 2*P*np.ones((len(Gs), len(Gs)))
    for k in ks:
        H = V+np.diag((k+Gs)**2); ev = np.linalg.eigvalsh(H)[:nb]; lo = np.minimum(lo, ev); hi = np.maximum(hi, ev)
    return [(math.sqrt(a), math.sqrt(b)) for a, b in zip(lo, hi)]
ref['kp'] = {str(P): kp_pw(P) for P in (0.5, 2.0, 5.0)}
# --- Nc, ni, neutralidad de carga con Fermi–Dirac completa ---
def Fhalf(eta): return quad(lambda x: math.sqrt(x)/(math.exp(min(x-eta, 700))+1), 0, 80+max(eta, 0), limit=400, epsabs=0, epsrel=1e-12)[0]
def carriers_fd(ND, NA, Eg_eV, mc, mv, T):
    kT = C.k*T; Nc = 2*(2*math.pi*mc*C.m_e*kT/C.h**2)**1.5; Nv = 2*(2*math.pi*mv*C.m_e*kT/C.h**2)**1.5; Eg = Eg_eV*C.e
    n_ = lambda mu: Nc*2/math.sqrt(math.pi)*Fhalf((mu-Eg)/kT) if False else Nc*2/math.sqrt(math.pi)*Fhalf((mu)/kT)     # origen en el borde de la banda de conducción: E_C = 0, E_V = −Eg
    p_ = lambda mu: Nv*2/math.sqrt(math.pi)*Fhalf((-Eg-mu)/kT)
    mu = brentq(lambda m: n_(m)+NA-p_(m)-ND, -Eg-10*kT, 10*kT, xtol=1e-30, rtol=1e-14)
    return float(n_(mu)), float(p_(mu)), float(Nc), float(Nv)
ref['carr'] = []
for (ND, NA, T) in ((1e22, 0, 300), (1e21, 0, 300), (0, 1e22, 300), (1e22, 0, 400), (1e18, 0, 500), (0, 0, 300)):
    n_, p_, Nc, Nv = carriers_fd(ND, NA, 1.12, 1.08, 0.56, T); ref['carr'].append(dict(ND=ND, NA=NA, T=T, n=n_, p=p_, Nc=Nc, Nv=Nv))
# --- unión pn: ecuación de Poisson–Boltzmann no lineal ---
def pn_numeric(NA, ND, ni, T, epsr, L):
    Vt = C.k*T/C.e; epsl = epsr*C.epsilon_0; Lg = 1e-6                      # longitud característica 1 µm
    psiL = -math.asinh(NA/(2*ni)); psiR = math.asinh(ND/(2*ni)); w = 0.003   # salto de dopaje suavizado en 3 nm (unidad: µm)
    def f(x, y):
        psi = y[0]; n_ = ni*np.exp(np.clip(psi, -60, 60)); p_ = ni*np.exp(-np.clip(psi, -60, 60)); s_ = 0.5*(1+np.tanh(x/w)); dop = ND*s_-NA*(1-s_)
        return np.vstack([y[1], -C.e*(p_-n_+dop)/epsl*Lg**2/Vt])
    bc = lambda ya, yb: np.array([ya[0]-psiL, yb[0]-psiR])
    xx = np.linspace(-L, L, 4001)
    guess = np.vstack([np.tanh(xx/0.15)*(psiR-psiL)/2+(psiR+psiL)/2, np.gradient(np.tanh(xx/0.15)*(psiR-psiL)/2, xx)])
    sol = solve_bvp(f, bc, xx, guess, tol=1e-6, max_nodes=400000)
    xf = np.linspace(-L, L, 40001); y = sol.sol(xf); psi = y[0]*Vt; E = -y[1]*Vt/Lg
    return dict(Vbi=float(psi[-1]-psi[0]), Emax=float(np.max(np.abs(E))), psi0=float(sol.sol(0.0)[0]*Vt), ok=bool(sol.success))
Vt300 = C.k*300/C.e
ref['pn'] = []
for (NA, ND, ni, epsr) in ((1e22, 1e22, 1.0e16, 11.7), (1e23, 1e21, 1.0e16, 11.7), (1e21, 1e21, 1.0e16, 11.7)):
    ref['pn'].append(dict(NA=NA, ND=ND, ni=ni, epsr=epsr, **pn_numeric(NA, ND, ni, 300, epsr, 4.0)))
# --- diodo de base larga: ecuación de difusión de minoritarios por solve_bvp ---
def diode_numeric(V, p0, D, tau, T=300):
    Lp = math.sqrt(D*tau); Vt = C.k*T/C.e; xs = np.linspace(0, 12, 400)    # x en unidades de L
    fun = lambda x, y: np.vstack([y[1], y[0]-1.0])                          # d²δ/dx² = δ̃ − 1 con p̃ = p/p0
    bc = lambda ya, yb: np.array([ya[0]-math.exp(V/Vt), yb[0]-1.0])
    sol = solve_bvp(fun, bc, xs, np.vstack([np.ones_like(xs), np.zeros_like(xs)]), tol=1e-12)
    return float(-sol.sol(0.0)[1]*p0*D/Lp)                                  # flujo difusivo en x = 0 (m⁻² s⁻¹)
ref['diode'] = [dict(V=V, p0=1e10, D=1.0e-3, tau=1e-6, flux=diode_numeric(V, 1e10, 1.0e-3, 1e-6), Lp=math.sqrt(1.0e-3*1e-6)) for V in (-0.2, 0.1, 0.3, 0.4)]
# --- Shockley–Queisser con cuerpo negro (quad + minimize_scalar) ---
def nph(Eg, T): return 2*math.pi/(C.h**3*C.c**2)*quad(lambda E: E**2/math.expm1(E/(C.k*T)), Eg, Eg+80*C.k*T, epsabs=0, epsrel=1e-12, limit=400)[0]
def sq_eff(EgeV, Ts, Tc=300, f=2.1625e-5):
    Eg = EgeV*C.e
    phiS = f*nph(Eg, Ts)
    def J(V): return C.e*(phiS-2*math.pi/(C.h**3*C.c**2)*quad(lambda E: E**2/math.expm1((E-C.e*V)/(C.k*Tc)), Eg, Eg+80*C.k*Tc+C.e*V, epsabs=0, epsrel=1e-12, limit=400)[0])
    r = minimize_scalar(lambda V: -J(V)*V, bounds=(0.1, EgeV), method='bounded', options=dict(xatol=1e-7))
    return float(-r.fun/(f*C.sigma*Ts**4)), float(r.x)
ref['sq'] = [dict(Eg=Eg, Ts=Ts, eta=sq_eff(Eg, Ts)[0], V=sq_eff(Eg, Ts)[1], ult=Eg*C.e*nph(Eg*C.e, Ts)/(C.sigma*Ts**4)) for (Eg, Ts) in ((1.1, 6000), (1.34, 5800), (1.0, 6000), (1.8, 6000))]
