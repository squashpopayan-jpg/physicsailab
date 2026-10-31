# -*- coding: utf-8 -*-
"""Genera tests/referencias.json con cálculos independientes (SciPy, SymPy, mpmath, NumPy).
Ejecutar: python tests/referencias.py   (luego: node tests/validar.js)"""
import json, math, os, sys
import numpy as np
import scipy.constants as C
from scipy import integrate, special, optimize, linalg
import mpmath as mp
import sympy as sp

ref = {}
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------- Cap. 1: orígenes ----------
h, c, kB, e, me = C.h, C.c, C.k, C.e, C.m_e
def planck_lambda(lam, T):
    return 2*h*c**2/lam**5/np.expm1(h*c/(lam*kB*T))
ref['planck'] = {f'{l}_{T}': planck_lambda(l, T) for l in (1e-7, 4e-7, 5e-7, 1e-6, 1e-5) for T in (300, 2000, 5772)}
ref['wien_b'] = C.Wien
ref['sigma'] = C.Stefan_Boltzmann
ref['sigma_from_const'] = 2*np.pi**5*kB**4/(15*h**3*c**2)
# fracción visible: integral numérica con quad en variable x = hc/(lam kT)
def band(l1, l2, T):
    f = lambda l: np.pi*planck_lambda(l, T)
    val, _ = integrate.quad(f, l1, l2, epsabs=0, epsrel=1e-12, limit=400)
    return val/(C.Stefan_Boltzmann*T**4)
ref['band'] = {f'{T}': band(380e-9, 780e-9, T) for T in (2000, 3000, 5772, 10000)}
# raíz de Wien x = 5(1-e^-x)
ref['wien_x'] = optimize.brentq(lambda x: x - 5*(1-np.exp(-x)), 1, 10, xtol=1e-14)
ref['bose3'] = float(mp.quad(lambda x: x**3/(mp.e**x-1), [0, mp.inf]))
ref['compton_lambda'] = C.value('Compton wavelength')
mC = me
def compton_KE_eV(lam, th):
    lp = lam + h/(mC*c)*(1-np.cos(th))
    return h*c/e*(1/lam - 1/lp)
ref['compton_KE'] = {f'{l}_{t}': compton_KE_eV(l, math.radians(t)) for l in (71.07e-12, 1.2398e-9, 1.2398e-12) for t in (30, 90, 180)}
def recoil(lam, th):
    # ángulo del electrón desde las componentes del momento
    p = h/lam; lp = lam + h/(mC*c)*(1-np.cos(th)); pp = h/lp
    px = p - pp*np.cos(th); py = -pp*np.sin(th)
    return abs(math.degrees(math.atan2(py, px)))
ref['compton_recoil'] = {f'{l}_{t}': recoil(l, math.radians(t)) for l in (71.07e-12, 1.2398e-12) for t in (30, 90, 150)}
# Bohr: masa reducida
Rinf = C.value('Rydberg constant')
mp_, md_, ma_ = C.m_p, C.value('deuteron mass'), C.value('alpha particle mass')
def R_M(M): return Rinf/(1+me/M)
def lam_bohr(ni, nf, Z, M): return 1e9/(R_M(M)*Z*Z*(1/nf**2-1/ni**2))
ref['bohr'] = {f'{ni}_{nf}_{Z}_{name}': lam_bohr(ni, nf, Z, M) for (ni, nf, Z) in ((3, 2, 1), (4, 2, 1), (2, 1, 1), (4, 3, 2), (6, 4, 1)) for name, M in (('p', mp_), ('d', md_), ('a', ma_))}
ref['bohr_E1'] = {'inf': -Rinf*h*c/e, 'p': -R_M(mp_)*h*c/e}
ref['bohr_r1'] = C.value('Bohr radius')
# de Broglie relativista exacta
def dB(Tj, m):
    pc = math.sqrt(Tj*(Tj+2*m*c**2)); return h*c/pc
ref['debroglie'] = {f'{V}': dB(V*e, me) for V in (10, 54, 100, 1e5, 3e5)}
ref['debroglie_n'] = dB(1.5*kB*300, C.m_n)

# ---------- Cap. 3: ondas libres ----------
rng = np.random.default_rng(1)
z = rng.normal(size=64)+1j*rng.normal(size=64)
Z = np.fft.fft(z)
ref['fft'] = dict(inr=z.real.tolist(), ini=z.imag.tolist(), re=Z.real.tolist(), im=Z.imag.tolist())
# paquete gaussiano libre: evolución espectral exacta (ħ = m = 1)
Ng = 1024; Lg = 80.0
xg = -Lg/2 + Lg*np.arange(Ng)/Ng
s0g, x0g, k0g, tg = 1.3, -3.0, 2.0, 2.5
psi0 = (2*np.pi*s0g**2)**-0.25*np.exp(-(xg-x0g)**2/(4*s0g**2))*np.exp(1j*k0g*(xg-x0g))
kg = 2*np.pi*np.fft.fftfreq(Ng, d=Lg/Ng)
psit = np.fft.ifft(np.fft.fft(psi0)*np.exp(-1j*kg**2*tg/2))
idx = list(range(0, Ng, 48))
ref['gauss_free'] = dict(x=xg[idx].tolist(), re=psit.real[idx].tolist(), im=psit.imag[idx].tolist(), s0=s0g, x0=x0g, k0=k0g, t=tg)
ref['gauss_width'] = {str(t): s0g*math.sqrt(1+(t/(2*s0g**2))**2) for t in (0.0, 1.0, 5.0, 20.0)}
# autovalores por diferencias finitas: scipy.linalg.eigh_tridiagonal con la misma malla
def fd_eigs(V, a, b, N, k):
    h = (b-a)/(N+1); x = a+h*np.arange(1, N+1); t = 1/(2*h*h)
    d = 2*t+V(x); e = -t*np.ones(N-1)
    w = linalg.eigh_tridiagonal(d, e, select='i', select_range=(0, k-1), eigvals_only=True)
    return w.tolist()
ref['fd_ho'] = fd_eigs(lambda x: 0.5*x**2, -8, 8, 1000, 6)
ref['fd_box'] = fd_eigs(lambda x: 0*x, -1, 1, 800, 5)
ref['fd_dw'] = fd_eigs(lambda x: (x**2-4)**2/8, -5, 5, 1200, 6)

# ---------- Cap. 7: pozo finito, delta, doble pozo ----------
def finite_roots(z0):
    out = []; k = 0
    while k*math.pi/2 < z0:
        lo = k*math.pi/2+1e-12; hi = min((k+1)*math.pi/2-1e-12, z0)
        if hi <= lo: break
        f = (lambda z: math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z) if k % 2 == 0 else (lambda z: -1/math.tan(z)-math.sqrt(max(0, z0*z0-z*z))/z)
        out.append(optimize.brentq(f, lo, hi, xtol=1e-14)); k += 1
    return out
ref['finite'] = {str(z0): finite_roots(z0) for z0 in (0.3, 1.0, 1.6, 3.0, 5.0, 9.5)}
def dd_roots(k0, a):
    fe = lambda k: k*(1+math.tanh(k*a))-2*k0; fo = lambda k: k*(1+1/math.tanh(k*a))-2*k0
    return [optimize.brentq(fe, 1e-12, 2*k0), (optimize.brentq(fo, 1e-12, 2*k0) if 2*k0*a > 1 else None)]
ref['dd'] = {f'{k0}_{a}': dd_roots(k0, a) for (k0, a) in ((1, 0.4), (1, 1), (1, 2), (2, 0.7), (0.5, 3))}
def fd_dw(V0, a, N=3000):
    xa = -3*a-3; xb = 3*a+3; h = (xb-xa)/(N+1); x = xa+h*np.arange(1, N+1); t = 1/(2*h*h)
    return linalg.eigh_tridiagonal(2*t+V0*((x/a)**2-1)**2, -t*np.ones(N-1), select='i', select_range=(0, 1), eigvals_only=True).tolist()
ref['dw'] = {f'{V0}_{a}': fd_dw(V0, a) for (V0, a) in ((12, 1.5), (24, 1.5), (12, 2.5), (6, 1.0))}

# ---------- Cap. 8: dispersión 1D (amplitudes por sistema lineal, método independiente del de la biblioteca) ----------
def scat_ref(E, bounds, Vs, m=1.0, xs=None):
    n = len(bounds); k = [np.sqrt(complex(2*m*(E-V))) for V in Vs]
    nun = 2*n; M = np.zeros((nun, nun), complex); rhs = np.zeros(nun, complex)
    idx = {('B', 0): 0, ('A', n): nun-1}; c = 1
    for j in range(1, n): idx[('A', j)] = c; idx[('B', j)] = c+1; c += 2
    row = 0
    for i, b in enumerate(bounds):
        for (reg, sgn) in ((i, +1), (i+1, -1)):
            kk = k[reg]
            for (ab, sg) in (('A', +1), ('B', -1)):
                key = (ab, reg)
                if key in idx: M[row, idx[key]] += sgn*np.exp(1j*sg*kk*b); M[row+1, idx[key]] += sgn*(1j*sg*kk)*np.exp(1j*sg*kk*b)
                elif key == ('A', 0): rhs[row] -= sgn*np.exp(1j*sg*kk*b); rhs[row+1] -= sgn*(1j*sg*kk)*np.exp(1j*sg*kk*b)
        row += 2
    x = np.linalg.solve(M, rhs)
    T = (k[n].real/k[0].real)*abs(x[idx[('A', n)]])**2 if k[n].real > 0 else 0.0
    R = abs(x[idx[('B', 0)]])**2
    dens = None
    if xs is not None:
        def amp(xx):
            reg = int(np.searchsorted(bounds, xx, side='right'))
            a_ = 1.0 if reg == 0 else x[idx[('A', reg)]]; b_ = x[idx[('B', reg)]] if ('B', reg) in idx else 0.0
            return abs(a_*np.exp(1j*k[reg]*xx)+b_*np.exp(-1j*k[reg]*xx))**2
        dens = [amp(xx) for xx in xs]
    return T, R, dens
cases = {'barrera': ([0, 0.7], [0, 1, 0]), 'doble': ([0, 1, 3, 4], [0, 1, 0, 1, 0]), 'triple': ([0, 0.5, 1.5, 2.0, 3.0, 3.5], [0, 1.2, 0, 1.2, 0, 1.2, 0]), 'escalon': ([0], [0, 1]), 'escalon2': ([0], [0.3, 1.0]), 'tres': ([0, 1.0], [0, 2.0, 0.5])}
ref['scat'] = {}
for nm, (bd, Vs) in cases.items():
    ref['scat'][nm] = {'bounds': bd, 'Vs': Vs, 'E': {}}
    for E in (0.15, 0.4, 0.8, 1.05, 1.3, 2.2, 3.7):
        T, R, _ = scat_ref(E, bd, Vs)
        ref['scat'][nm]['E'][str(E)] = [T, R]
xs_ = [-3.0, -1.1, -0.2, 0.3, 0.9, 1.7, 2.6, 3.2, 4.4, 6.0]
T_, R_, d_ = scat_ref(0.5, [0, 1, 3, 4], [0, 1, 0, 1, 0], xs=xs_)
ref['scat_psi'] = {'E': 0.5, 'xs': xs_, 'dens': d_}
# paquete contra barrera: operador dividido de numpy con la misma malla alineada (N = 2048, L = 256)
def packet_ref(E0, a, sig, N=2048, L=256, dt=0.05, x0=-60):
    x = -L/2+L*np.arange(N)/N; dx = L/N; k = 2*np.pi*np.fft.fftfreq(N, d=dx); k0 = math.sqrt(2*E0); Tf = 150/k0
    psi = (2*np.pi*sig**2)**-0.25*np.exp(-(x-x0)**2/(4*sig**2))*np.exp(1j*k0*(x-x0))
    V = np.where((x >= -1e-9) & (x < a-1e-9), 1.0, 0.0); U = np.exp(-1j*V*dt/2); Kp = np.exp(-1j*k**2*dt/2)
    for _ in range(int(round(Tf/dt))): psi = U*np.fft.ifft(Kp*np.fft.fft(U*psi))
    d = abs(psi)**2*dx
    return float(d[x >= a-1e-9].sum())
def avgT_ref(E0, a, sig):
    k0 = math.sqrt(2*E0); sk = 1/(2*sig); ks = np.linspace(max(1e-4, k0-8*sk), k0+8*sk, 3001); w = np.exp(-(ks-k0)**2/(2*sk*sk))
    return float((w*np.array([scat_ref(kk*kk/2, [0, a], [0, 1, 0])[0] for kk in ks])).sum()/w.sum())
ref['packet'] = {f'{E0}_{a}_{sg}': [packet_ref(E0, a, sg), avgT_ref(E0, a, sg)] for (E0, a, sg) in ((0.6, 1, 6), (0.3, 1, 6), (1.5, 1, 6), (0.6, 2, 6))}

# ---------- Cap. 9: oscilador armónico ----------
def ho_psi(n, x):
    return special.eval_hermite(n, x)*np.exp(-x*x/2)/math.sqrt(2.0**n*math.factorial(n)*math.sqrt(math.pi)) if n < 100 else float('nan')
xs_ho = [-6.3, -2.1, -0.4, 0.0, 0.9, 1.7, 3.3, 5.2]
ref['ho_psi'] = {str(n): [float(ho_psi(n, x)) for x in xs_ho] for n in (0, 1, 2, 5, 12, 25, 40)}
ref['ho_xs'] = xs_ho
def forb(n):
    xt = math.sqrt(2*n+1)
    return 2*integrate.quad(lambda x: ho_psi(n, x)**2, xt, xt+20, epsabs=1e-14, epsrel=1e-12, limit=400)[0]
ref['ho_forb'] = {str(n): forb(n) for n in (0, 1, 2, 3, 5, 10, 20, 30)}
def xel(n, m):
    return integrate.quad(lambda x: ho_psi(n, x)*x*ho_psi(m, x), -30, 30, epsabs=1e-13, epsrel=1e-12, limit=800)[0]
ref['ho_x'] = {f'{n}_{m}': xel(n, m) for (n, m) in ((0, 1), (1, 2), (3, 4), (4, 3), (0, 2), (2, 2), (5, 6), (10, 9))}
ref['ho_x2'] = {str(n): integrate.quad(lambda x: ho_psi(n, x)**2*x*x, -30, 30, epsabs=1e-13, epsrel=1e-12, limit=800)[0] for n in (0, 1, 2, 7)}

# ---------- Cap. 10: estados coherentes, comprimidos y Wigner ----------
from scipy.linalg import expm
Nf = 70; a_op = np.diag(np.sqrt(np.arange(1, Nf)), 1); ad_op = a_op.T
def coh_vec(al):
    n = np.arange(Nf); lg = np.array([math.lgamma(k+1) for k in n]); return np.exp(-abs(al)**2/2+n*np.log(complex(al)+1e-300)-0.5*lg)
def psi_fock_x(n, x): return special.eval_hermite(n, x)*np.exp(-x*x/2)/math.sqrt(2.0**n*math.factorial(n)*math.sqrt(math.pi))
def coh_density_ref(al, t, x):
    c = coh_vec(al)*np.exp(-1j*(np.arange(Nf)+0.5)*t); return abs(sum(c[n]*psi_fock_x(n, x) for n in range(Nf)))**2
pts_c = [(1.2+0.5j, 0.0, -1.0), (1.2+0.5j, 0.7, 0.4), (-2.0+1.0j, 2.2, -2.5), (0.0, 1.0, 0.3), (3.0, 5.0, 3.1)]
ref['coh'] = [dict(re=float(np.real(al)), im=float(np.imag(al)), t=t, x=x, d=float(coh_density_ref(al, t, x))) for (al, t, x) in pts_c]
ref['poisson'] = {f'{n}_{m}': float(stats.poisson.pmf(n, m)) for (n, m) in ((0, 0.5), (3, 2.0), (9, 9.0), (20, 6.25), (40, 36.0))} if 'stats' in globals() else {}
from scipy import stats as _st
ref['poisson'] = {f'{n}_{m}': float(_st.poisson.pmf(n, m)) for (n, m) in ((0, 0.5), (3, 2.0), (9, 9.0), (20, 6.25), (40, 36.0))}
# Wigner por la definición (integral numérica), con ψ de Fock y del gato (desarrollo en Fock)
def wigner_num(psi, x, p):
    f = lambda y: psi(x+y)*psi(x-y)*np.cos(2*p*y)/math.pi
    return integrate.quad(f, -12, 12, limit=400, epsabs=1e-12)[0]
wf = {}
for n in (0, 1, 2, 3, 5):
    for (x, p) in ((0.0, 0.0), (0.7, -0.4), (1.5, 1.1), (-2.0, 0.3)): wf[f'{n}_{x}_{p}'] = wigner_num(lambda u, n=n: psi_fock_x(n, u), x, p)
ref['wigner_fock'] = wf
def cat_psi(al, par):
    c = coh_vec(al); cm = coh_vec(-al); v = c+par*cm; v = v/np.linalg.norm(v)
    return lambda u: sum(v[n]*psi_fock_x(n, u) for n in range(0, Nf) if abs(v[n]) > 1e-14).real
wc = {}
for (al, par) in ((1.5, 1), (1.5, -1), (2.0, 1)):
    ps = cat_psi(al, par)
    for (x, p) in ((0.0, 0.0), (1.0, 0.5), (2.1, 1.3), (0.4, -0.9)): wc[f'{al}_{par}_{x}_{p}'] = wigner_num(ps, x, p)
ref['wigner_cat'] = wc
# covarianza del estado comprimido por la matriz S(r) = exp[(r/2)(a² − a†²)] y evolución e^{−it a†a}
def sq_cov(r, th, t):
    S = expm(0.5*r*(a_op@a_op-ad_op@ad_op)); vac = np.zeros(Nf, complex); vac[0] = 1; psi = S@vac
    # rotación de la dirección comprimida th en el plano ξ–π: e^{−i(th)·(a†a)} gira el plano de fases
    Rot = np.diag(np.exp(+1j*np.arange(Nf)*th)); psi = Rot@psi
    U = np.diag(np.exp(-1j*np.arange(Nf)*t)); psi = U@psi
    X = (a_op+ad_op)/math.sqrt(2); P = 1j*(ad_op-a_op)/math.sqrt(2)
    ex = lambda O: np.vdot(psi, O@psi)
    return [float(ex(X@X).real-ex(X).real**2), float((0.5*ex(X@P+P@X)-ex(X)*ex(P)).real), float(ex(P@P).real-ex(P).real**2)]
ref['sq'] = {f'{r}_{th}_{t}': sq_cov(r, th, t) for (r, th, t) in ((0.8, 0.0, 0.0), (0.8, 0.0, 0.6), (1.0, 0.5, 1.3), (0.5, 1.2, 2.5), (0.9, 0.0, 1.5707963267948966))}

# ---------- Cap. 11: bandas ----------
def kp_f(E, P):
    if E > 1e-14: q = math.sqrt(2*E); return math.cos(q)+P*math.sin(q)/q
    if E < -1e-14: k = math.sqrt(-2*E); return math.cosh(k)+P*math.sinh(k)/k
    return 1+P
def kp_bands(P, Emax, Emin):
    Es = np.linspace(Emin, Emax, 120001); ins = np.array([abs(kp_f(E, P)) <= 1 for E in Es]); out = []; cur = None
    for i in range(1, len(Es)):
        if ins[i] and not ins[i-1]: cur = [optimize.brentq(lambda E: abs(kp_f(E, P))-1, Es[i-1], Es[i], xtol=1e-13)]
        if (not ins[i]) and ins[i-1] and cur: cur.append(optimize.brentq(lambda E: abs(kp_f(E, P))-1, Es[i-1], Es[i], xtol=1e-13)); out.append(cur); cur = None
    if cur: cur.append(Emax); out.append(cur)
    return out
ref['kp'] = {}
for (P, Emin) in ((3.0, 1e-4), (0.5, 1e-4), (-6.0, -25.0), (8.0, 1e-4)):
    bd = kp_bands(P, 60.0, Emin)[:4]
    ks = [0.3, 1.1, 2.0, 2.9]
    Ek = [[optimize.brentq(lambda E: kp_f(E, P)-math.cos(k), b[0], b[1], xtol=1e-13) for k in ks] for b in bd[:3]]
    ref['kp'][str(P)] = dict(bands=bd, ks=ks, Ek=Ek)
def nfe_ref(k, V1, M=8):
    n = 2*M+1; A = np.zeros((n, n))
    for i in range(n):
        A[i, i] = 0.5*(k+2*math.pi*(i-M))**2
        if i+1 < n: A[i, i+1] = V1; A[i+1, i] = V1
    return linalg.eigvalsh(A).tolist()
ref['nfe'] = {f'{V1}_{k}': nfe_ref(k, V1)[:5] for V1 in (0.1, 0.5, 0.8, 1.5) for k in (0.0, 1.0, math.pi)}

# ---------- Cap. 12: momento angular ----------
sph = special.sph_harm if hasattr(special, 'sph_harm') else None
pts_y = [(0.4, 1.1), (1.2, 2.5), (2.3, -0.7), (0.9, 4.0), (3.0, 0.3)]
yref = {}
for l in range(0, 6):
    for m in range(-l, l+1):
        yref[f'{l}_{m}'] = [[float(np.real(special.sph_harm(m, l, ph, th))), float(np.imag(special.sph_harm(m, l, ph, th)))] for (th, ph) in pts_y]
ref['ylm'] = dict(pts=pts_y, y=yref)
def jmat(j):
    n = int(round(2*j+1)); ms = [j-a for a in range(n)]; Jz = np.diag(ms).astype(complex); Jp = np.zeros((n, n), complex)
    for a in range(1, n): Jp[a-1, a] = math.sqrt(j*(j+1)-ms[a]*(ms[a]+1))
    return Jz, Jp, Jp.conj().T
ref['jmat'] = {}
for j in (0.5, 1.0, 1.5, 2.0, 3.0):
    Jz, Jp, Jm = jmat(j); Jx = (Jp+Jm)/2; Jy = (Jp-Jm)/(2j)
    ref['jmat'][str(j)] = dict(comm_xy_err=float(np.linalg.norm(Jx@Jy-Jy@Jx-1j*Jz)), j2=float(np.real(np.trace(Jx@Jx+Jy@Jy+Jz@Jz))/(2*j+1)))
# rotor: <cos²θ> de una superposición (integral con polinomios de Legendre)
def cos2_num(c, B, t):
    xs, ws = np.polynomial.legendre.leggauss(120); psi = np.zeros_like(xs, dtype=complex)
    for l, cl in enumerate(c):
        if abs(cl) > 0: psi += cl*math.sqrt((2*l+1)/2)*special.eval_legendre(l, xs)*np.exp(-1j*B*l*(l+1)*t)
    return float(np.sum(ws*xs**2*abs(psi)**2)/np.sum(ws*abs(psi)**2))
cs = [0.0]*30
for l in range(0, 30, 2): cs[l] = math.exp(-((l-8)**2)/(4*2.0**2))
nr = math.sqrt(sum(v*v for v in cs)); cs = [v/nr for v in cs]
ref['cos2'] = dict(c=cs, vals={str(t): cos2_num(cs, 1.0, t) for t in (0.0, 0.2, 0.5, 1.0, 1.7, math.pi/2, math.pi)})

# ---------- Cap. 13: potenciales centrales ----------
xs_ = np.linspace(0.05, 60, 120001)
ref['jl_zeros'] = {}
for l in range(0, 6):
    f = special.spherical_jn(l, xs_); idx = np.where(np.diff(np.sign(f)) != 0)[0][:5]
    ref['jl_zeros'][str(l)] = [optimize.brentq(lambda t: special.spherical_jn(l, t), xs_[i], xs_[i+1], xtol=1e-14) for i in idx]
ref['jl_vals'] = {str(l): [float(special.spherical_jn(l, x)) for x in (0.01, 0.3, 1.0, 2.5, 7.0, 15.0, 33.0)] for l in range(0, 9)}
ref['jl_x'] = [0.01, 0.3, 1.0, 2.5, 7.0, 15.0, 33.0]
def well0_ref(V0, a, m=1.0):
    z0 = a*math.sqrt(2*m*V0); out = []; n = 0
    while (n+0.5)*math.pi < z0:
        lo = (n+0.5)*math.pi+1e-12; hi = min((n+1)*math.pi-1e-12, z0); g = lambda x: -x/math.tan(x)-math.sqrt(max(0, z0*z0-x*x))
        if g(lo)*g(hi) < 0: x = optimize.brentq(g, lo, hi, xtol=1e-14); out.append(-(z0*z0-x*x)/(a*a)/(2*m))
        n += 1
    return out
ref['well0'] = {f'{V0}_{a}': well0_ref(V0, a) for (V0, a) in ((30, 1.0), (5, 1.0), (60, 1.5), (1.5, 1.0), (200, 0.8))}
def radial_fd(V, l, R, N, k):
    h = R/(N+1); r = h*np.arange(1, N+1); t = 1/(2*h*h)
    return linalg.eigh_tridiagonal(2*t+V(r)+l*(l+1)/(2*r*r), -t*np.ones(N-1), select='i', select_range=(0, k-1), eigvals_only=True).tolist()
ref['radial_ho'] = {str(l): radial_fd(lambda r: 0.5*r*r, l, 9.0, 1500, 4) for l in range(0, 4)}
ref['radial_cou'] = {str(l): radial_fd(lambda r: -1/r, l, 50.0, 2500, 3) for l in range(0, 3)}
ref['rayleigh'] = {f'{kr}_{L}': [float(abs(sum((2*l+1)*(1j)**l*special.spherical_jn(l, kr) for l in range(L+1))-np.exp(1j*kr)))] for (kr, L) in ((5.0, 5), (5.0, 15), (10.0, 10), (10.0, 23), (20.0, 36))}

# ---------- Cap. 14: átomo de hidrógeno ----------
from sympy.physics.hydrogen import R_nl as sympy_Rnl
def Rnl_scipy(n, l, r, Z=1.0, mu=1.0):
    a = 1/(Z*mu); rho = 2*r/(n*a)
    N = math.sqrt((2/(n*a))**3*math.factorial(n-l-1)/(2*n*math.factorial(n+l)))
    return N*rho**l*math.exp(-rho/2)*special.eval_genlaguerre(n-l-1, 2*l+1, rho)
hyd_pts = [0.1, 0.7, 1.9, 4.0, 9.5, 20.0]
ref['hyd_R'] = {f'{n}_{l}': dict(r=hyd_pts, scipy=[Rnl_scipy(n, l, r) for r in hyd_pts], sympy=[float(sympy_Rnl(n, l, r, 1)) for r in hyd_pts]) for (n, l) in ((1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2), (4, 3), (5, 2))}
def rk_quad(n, l, k, Z=1.0, mu=1.0):
    f = lambda r: r**(k+2)*Rnl_scipy(n, l, r, Z, mu)**2
    pts = [0] + [i*n*n/(Z*mu) for i in range(1, 12)]
    return sum(integrate.quad(f, pts[i], pts[i+1], epsabs=1e-14, epsrel=1e-13)[0] for i in range(len(pts)-1)) + integrate.quad(f, pts[-1], np.inf, epsabs=1e-14, epsrel=1e-13)[0]
ref['hyd_rk'] = {f'{n}_{l}_{k}': rk_quad(n, l, k) for (n, l) in ((1, 0), (2, 0), (2, 1), (3, 1), (3, 2), (4, 0)) for k in (-2, -1, 1, 2)}
ref['hyd_Zmu'] = {f'{Z}_{mu}_{n}_{l}': dict(r=hyd_pts, v=[Rnl_scipy(n, l, r, Z, mu) for r in hyd_pts]) for (Z, mu, n, l) in ((2.0, 0.99986, 2, 1), (1.0, 0.5, 3, 0), (3.0, 1.0, 2, 0), (1.0, 185.84, 2, 1))}

# ---------- Cap. 15: espín ½ ----------
sig = [np.array([[0, 1], [1, 0]], complex), np.array([[0, -1j], [1j, 0]], complex), np.array([[1, 0], [0, -1]], complex)]
rng15 = np.random.default_rng(15)
cases = []
for k in range(8):
    psi = rng15.normal(size=2)+1j*rng15.normal(size=2); psi /= np.linalg.norm(psi)
    w = rng15.normal(size=3)*2.0; t = float(rng15.uniform(0.1, 3.0))
    Hs = 0.5*sum(w[i]*sig[i] for i in range(3)); out = linalg.expm(-1j*Hs*t)@psi
    bl = [float(np.real(np.conj(out)@sig[i]@out)) for i in range(3)]
    th, ph = float(rng15.uniform(0, math.pi)), float(rng15.uniform(0, 2*math.pi))
    nvec = np.array([math.sin(th)*math.cos(ph), math.sin(th)*math.sin(ph), math.cos(th)]); chi = (nvec[0]*sig[0]+nvec[1]*sig[1]+nvec[2]*sig[2])
    ev, evec = np.linalg.eigh(chi); up = evec[:, 1]
    pn = float(abs(np.vdot(up, out))**2)
    cases.append(dict(psi=[[psi[0].real, psi[0].imag], [psi[1].real, psi[1].imag]], w=w.tolist(), t=t, out=[[out[0].real, out[0].imag], [out[1].real, out[1].imag]], bloch=bl, th=th, ph=ph, pn=pn))
ref['spin_evolve'] = cases
def nst(th, ph): return np.array([math.cos(th/2), np.exp(1j*ph)*math.sin(th/2)])
ref['spin_chain'] = [dict(angles=a, P=float(np.prod([abs(np.vdot(nst(a[i], 0), nst(a[i-1], 0)))**2 for i in range(1, len(a))]))) for a in ([0, 0.7, 2.0], [0, math.pi/2, math.pi], [0, 0.3, 0.9, 1.7, math.pi])]
ref['spin_nstate'] = [dict(th=th, ph=ph, ok=float(np.linalg.norm((np.sin(th)*math.cos(ph)*sig[0]+np.sin(th)*math.sin(ph)*sig[1]+np.cos(th)*sig[2])@nst(th, ph)-nst(th, ph)))) for th, ph in ((0.3, 0.2), (1.2, 4.0), (2.8, 5.5))]

# ---------- Cap. 16: suma de momentos angulares ----------
from sympy.physics.wigner import clebsch_gordan as sp_cg
from sympy import Rational as Rt
def mk(x): return Rt(int(round(2*x)), 2)
cgref = []
for (j1, j2) in ((0.5, 0.5), (1, 0.5), (1, 1), (1.5, 1), (2, 1.5), (2, 2), (3, 1)):
    J = abs(j1-j2)
    while J <= j1+j2+1e-9:
        for m1 in np.arange(-j1, j1+0.1, 1):
            for m2 in np.arange(-j2, j2+0.1, 1):
                M = m1+m2
                if abs(M) <= J+1e-9: cgref.append([j1, float(m1), j2, float(m2), float(J), float(M), float(sp_cg(mk(j1), mk(j2), mk(J), mk(m1), mk(m2), mk(M)))])
        J += 1
ref['cg'] = cgref
def zeeman6(A, b):
    mls = (1, 0, -1); mss = (0.5, -0.5); basis = [(ml, ms) for ml in mls for ms in mss]; H = np.zeros((6, 6))
    for i, (ml, ms) in enumerate(basis):
        H[i, i] = A*ml*ms + b*(ml+2*ms)
        for k, (ml2, ms2) in enumerate(basis):
            if ml2 == ml+1 and ms2 == ms-1: v = 0.5*A*math.sqrt(2)*1.0; H[i, k] = v; H[k, i] = v
    return np.sort(np.linalg.eigvalsh(H)).tolist()
ref['zeemanP'] = {f'{A}_{b}': zeeman6(A, b) for (A, b) in ((1.0, 0.0), (1.0, 0.1), (1.0, 0.7), (1.0, 3.0), (2.3, 1.1), (0.4, 5.0))}
# términos de np² por el método de la tabla (M_L, M_S) con combinaciones de 2 electrones
from itertools import combinations
from collections import Counter
orbp = [(ml, ms) for ml in (1, 0, -1) for ms in (0.5, -0.5)]
tab = Counter((sum(o[0] for o in c), sum(o[1] for o in c)) for c in combinations(orbp, 2)); ref['p2_table'] = {f'{k[0]}_{k[1]}': v for k, v in tab.items()}

# ---------- Cap. 17: campos electromagnéticos ----------
def landau_fd(x0, nmax=7, L=14.0, N=3000):
    h = 2*L/(N+1); x = -L+h*np.arange(1, N+1); t = 1/(2*h*h)
    return linalg.eigh_tridiagonal(2*t+0.5*(x-x0)**2, -t*np.ones(N-1), select='i', select_range=(0, nmax-1), eigvals_only=True).tolist()
ref['landau_fd'] = {str(x0): landau_fd(x0) for x0 in (0.0, 1.7)}
xs17 = [-3.1, -1.2, 0.0, 0.8, 2.5, 4.4]
ref['landau_psi'] = {str(n): [float(special.eval_hermite(n, x)*math.exp(-x*x/2)/math.sqrt(2.0**n*math.factorial(n)*math.sqrt(math.pi))) for x in xs17] for n in range(0, 7)}
ref['landau_x'] = xs17
# línea de A de un solenoide: ∮ A·dl = Φ sobre círculos de cualquier radio (A_φ = Φ/2πr)
Phi_t = 3.7e-15
ref['ab_loop'] = {str(r): float(integrate.quad(lambda ph: (Phi_t/(2*math.pi*r))*r, 0, 2*math.pi)[0]) for r in (0.2e-6, 1e-6, 7e-6)}
ref['ab_loop_phi'] = Phi_t
ref['ab_pattern'] = [dict(y=y, nq=nq, I=float(abs(1+np.exp(1j*(2*math.pi*y-2*math.pi*nq)))**2/4)) for y in (-1.3, -0.4, 0.0, 0.7, 1.9) for nq in (0.0, 0.25, 0.5, 1.0, 2.3)]
import scipy.constants as sc17
ref['mag_const'] = dict(phi0=sc17.h/sc17.e, rk=sc17.h/sc17.e**2, hbar=sc17.hbar)

# ---------- Cap. 18: simetrías y reglas de selección ----------
from sympy.physics.quantum.spin import Rotation as SpRot
from sympy import Rational as R18, N as N18
wd_ref = []
for j in (0.5, 1, 1.5, 2, 3):
    for mp in np.arange(-j, j+0.1, 1):
        for m in np.arange(-j, j+0.1, 1):
            for beta in (0.4, 1.3, 2.9, 4.5):
                v = float(sp.re(N18(SpRot.d(R18(int(round(2*j)), 2), R18(int(round(2*mp)), 2), R18(int(round(2*m)), 2), beta).doit())))
                wd_ref.append([j, float(mp), float(m), beta, v])
ref['wigner_d'] = wd_ref
alpha_ = 7.2973525693e-3; c_ = 299792458.0; a0_ = 5.29177210903e-11; Ry_ = 13.605693122994; e_ = 1.602176634e-19; hb_ = 1.054571817e-34
def rint18(n1, l1, n2, l2):
    f = lambda r: float(sympy_Rnl(n1, l1, r, 1))*float(sympy_Rnl(n2, l2, r, 1))*r**3
    return integrate.quad(f, 0, 250, limit=500, epsabs=1e-13)[0]
def A18(n, l, n2, l2):
    w = Ry_*(1/n2**2-1/n**2)*e_/hb_
    return 4*alpha_*w**3/(3*c_**2)*max(l, l2)/(2*l+1)*(rint18(n, l, n2, l2)*a0_)**2
ref['hyd_radial'] = {f'{a}_{b}_{c}_{d}': rint18(a, b, c, d) for (a, b, c, d) in ((2, 1, 1, 0), (3, 1, 1, 0), (3, 1, 2, 0), (3, 0, 2, 1), (3, 2, 2, 1), (4, 3, 3, 2), (4, 1, 2, 0), (5, 2, 3, 1))}
ref['hyd_A'] = {f'{a}_{b}_{c}_{d}': A18(a, b, c, d) for (a, b, c, d) in ((2, 1, 1, 0), (3, 1, 1, 0), (3, 1, 2, 0), (3, 0, 2, 1), (3, 2, 2, 1), (4, 3, 3, 2), (4, 1, 2, 0), (5, 2, 3, 1))}

# ---------- Cap. 19: perturbaciones ----------
from fractions import Fraction as Fr
def x4_exact(M):
    # <i|x^4|j> con elementos exactos de x² = (a+a†)²/2 en racionales: x⁴ = (a+a†)⁴/4 -> usar matriz de x con raíces (float) y verificar con fracciones del cuadrado
    X = np.zeros((M, M)); 
    for n in range(M-1): X[n, n+1] = X[n+1, n] = math.sqrt((n+1)/2)
    return X
def rs_exact(n0, K, M=90):
    # x² tiene elementos racionales·√ en n+2; trabajamos con X2 = X@X y X4 = X2@X2 en fracciones (los elementos de x² son racionales: (2n+1)/2 y √((n+1)(n+2))/2 -> irracional en general). Usamos mpmath con 50 dígitos.
    import mpmath as mp18
    mp18.mp.dps = 50
    X = mp18.zeros(M, M)
    for n in range(M-1): X[n, n+1] = X[n+1, n] = mp18.sqrt(mp18.mpf(n+1)/2)
    X2 = X*X; V = X2*X2
    E0 = [mp18.mpf(i)+mp18.mpf(1)/2 for i in range(M)]
    psi = [[mp18.mpf(1) if i == n0 else mp18.mpf(0) for i in range(M)]]; E = [E0[n0]]
    for k in range(1, K+1):
        Vp = [sum(V[i, j]*psi[k-1][j] for j in range(max(0, i-4), min(M, i+5))) for i in range(M)]
        E.append(Vp[n0]); cur = [mp18.mpf(0)]*M
        for m in range(M):
            if m == n0: continue
            t = Vp[m]
            for j in range(1, k): t -= E[j]*psi[k-j][m]
            cur[m] = t/(E0[n0]-E0[m])
        psi.append(cur)
    return [float(e) for e in E]
ref['anharm_series'] = {str(n0): rs_exact(n0, 8) for n0 in (0, 1, 2)}
def anh_exact(g, M=200, k=4):
    X = x4_exact(M); X4 = np.linalg.matrix_power(X, 4); H = np.diag(np.arange(M)+0.5)+g*X4
    return np.sort(np.linalg.eigvalsh(H))[:k].tolist()
ref['anharm_exact'] = {str(g): anh_exact(g) for g in (0.01, 0.05, 0.1, 0.3, 1.0)}
x_ = sp.Symbol('x'); ref['two_series'] = [float(c) for c in sp.Poly(sp.series(sp.Rational(1, 2)-sp.sqrt(sp.Rational(1, 4)+x_), x_, 0, 14).removeO(), x_).all_coeffs()[::-1][:14]]

# ---------- Cap. 20: estructura fina e hiperfina ----------
import mpmath as mp20
mp20.mp.dps = 50
al20 = mp20.mpf('7.2973525693e-3')
def dirac20(n, j, Z):
    za = Z*al20; d = (j+mp20.mpf(1)/2)-mp20.sqrt((j+mp20.mpf(1)/2)**2-za**2)
    return float((1/mp20.sqrt(1+za**2/(n-d)**2)-1)/al20**2)
ref['dirac_E'] = {f'{n}_{j}_{Z}': dirac20(n, j, Z) for n in (1, 2, 3, 4) for j in (0.5, 1.5, 2.5, 3.5) if j < n for Z in (1, 2, 10, 40)}
# serie de Dirac a O(α²) con sympy (variable a = α)
a_s, n_s, j_s = sp.symbols('a n j', positive=True)
dl = j_s+sp.Rational(1, 2)-sp.sqrt((j_s+sp.Rational(1, 2))**2-a_s**2)
Edir = (1/sp.sqrt(1+a_s**2/(n_s-dl)**2)-1)/a_s**2
ser = sp.series(Edir, a_s, 0, 3).removeO()
c0 = sp.simplify(ser.coeff(a_s, 0)); c2 = sp.simplify(ser.coeff(a_s, 2))
ref['dirac_series'] = [dict(n=n, j=j, e0=float(c0.subs({n_s: n, j_s: j})), e2=float(c2.subs({n_s: n, j_s: j}))) for (n, j) in ((1, 0.5), (2, 0.5), (2, 1.5), (3, 2.5), (4, 3.5))]
def br_num(a, be, bp):
    Sz = np.diag([0.5, -0.5]); sx = np.array([[0, .5], [.5, 0]]); sy = np.array([[0, -.5j], [.5j, 0]])
    SI = sum(np.kron(s1, s1) for s1 in (sx, sy, Sz))
    H = a*SI+be*np.kron(Sz, np.eye(2))-bp*np.kron(np.eye(2), Sz); return np.sort(np.linalg.eigvalsh(H)).tolist()
ref['breit_rabi'] = {f'{B}': br_num(1420.405751768, 28.0249514*B*1e3, 42.5774785*B) for B in (0.0, 0.01, 0.05, 0.2, 1.0, 5.0)}

# ---------- Cap. 21: variacional ----------
def gto_ref(exps, Z=1.0):
    n = len(exps); H = np.zeros((n, n)); S = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            a, b = exps[i], exps[j]; q = a+b
            S[i, j] = (math.pi/q)**1.5
            # integrales por cuadratura radial independiente: ∫ e^{-a r²} (-½∇²) e^{-b r²} d³r y ∫ e^{-q r²} (1/r) d³r
            T = integrate.quad(lambda r: 4*math.pi*r*r*math.exp(-a*r*r)*(-0.5)*((4*b*b*r*r-6*b)*math.exp(-b*r*r)), 0, np.inf)[0]
            V = integrate.quad(lambda r: 4*math.pi*r*math.exp(-q*r*r), 0, np.inf)[0]
            H[i, j] = T-Z*V
    w, vec = linalg.eigh(H, S)
    return w.tolist()
ref['gto'] = {','.join(str(e) for e in ex): gto_ref(ex) for ex in ([0.2829421], [0.2, 1.0], [0.1, 0.4, 1.6], [0.1, 0.4, 1.6, 6.4, 25.6], [0.05, 0.3, 1.5, 7.0, 30.0, 150.0])}
def anh_var(g):
    f = lambda a: a/4+1/(4*a)+3*g/(4*a*a); r = optimize.minimize_scalar(f, bounds=(0.3, 6), method='bounded', options={'xatol': 1e-12}); return [float(r.x), float(r.fun)]
ref['anh_var'] = {str(g): anh_var(g) for g in (0.0, 0.05, 0.3, 1.0, 5.0)}
def h2p_ref(R):
    phi = lambda r: math.exp(-r)/math.sqrt(math.pi)
    ra = lambda rho, z: math.hypot(rho, z+R/2); rb = lambda rho, z: math.hypot(rho, z-R/2)
    opt = dict(epsabs=1e-11, epsrel=1e-11)
    S = integrate.dblquad(lambda z, rho: 2*math.pi*rho*phi(ra(rho, z))*phi(rb(rho, z)), 0, 30, -30, 30, **opt)[0]
    j = integrate.dblquad(lambda z, rho: 2*math.pi*rho*phi(ra(rho, z))**2/rb(rho, z), 0, 30, -30, 30, **opt)[0]
    k = integrate.dblquad(lambda z, rho: 2*math.pi*rho*phi(ra(rho, z))*phi(rb(rho, z))/ra(rho, z), 0, 30, -30, 30, **opt)[0]
    return [S, j, k]
ref['h2p_int'] = {str(R): h2p_ref(R) for R in (1.0, 2.0, 3.5)}

# ---------- Cap. 22: WKB ----------
def bs_level(V, n, xm, L, Emax=40.0):
    def act(E):
        xs = np.linspace(xm, xm+L, 40001); i = np.argmax(V(xs) > E); x2 = optimize.brentq(lambda x: V(x)-E, xs[i-1], xs[i])
        xs = np.linspace(xm, xm-L, 40001); i = np.argmax(V(xs) > E); x1 = optimize.brentq(lambda x: V(x)-E, xs[i], xs[i-1])
        return integrate.quad(lambda x: math.sqrt(max(0, 2*(E-V(x)))), x1, x2, limit=400, epsabs=1e-13, epsrel=1e-13)[0]
    t = (n+0.5)*math.pi
    return optimize.brentq(lambda E: act(E)-t, V(xm)+1e-6, Emax, xtol=1e-12)
ref['wkb_lin'] = [bs_level(lambda x: np.abs(x), n, 0.0, 60) for n in range(6)]
ref['wkb_quar'] = [bs_level(lambda x: x**4, n, 0.0, 20) for n in range(6)]
ref['wkb_mor'] = [bs_level(lambda x: 12*(1-np.exp(-x))**2, n, 0.0, 30, 11.9999) for n in range(5)]
ref['airy_lin'] = sorted((-special.ai_zeros(4)[0]/2**(1/3)).tolist()+(-special.ai_zeros(4)[1]/2**(1/3)).tolist())[:6]
def fd_levels(V, a, b, N, k):
    h = (b-a)/(N+1); x = a+h*np.arange(1, N+1); t = 1/(2*h*h)
    return linalg.eigh_tridiagonal(2*t+V(x), -t*np.ones(N-1), select='i', select_range=(0, k-1), eigvals_only=True).tolist()
ref['fd_quar'] = fd_levels(lambda x: x**4, -6, 6, 4000, 6)
# transmisión exacta por integración de la ecuación de Schrödinger (solve_ivp), ħ = m = 1, barrera parabólica truncada
from scipy.integrate import solve_ivp
def T_ode(V, E, xl, xr):
    kR = math.sqrt(2*E)
    def f(x, y): return [y[1], -2*(E-V(x))*y[0]]
    sol = solve_ivp(f, [xr, xl], [1+0j, 1j*kR], rtol=1e-12, atol=1e-14, method='DOP853')
    psi, dpsi = sol.y[0, -1], sol.y[1, -1]
    A = 0.5*(psi+dpsi/(1j*kR)); return float(1/abs(A)**2)
Vpar = lambda V0: (lambda x: V0*(1-x*x) if abs(x) < 1 else 0.0)
Vtri = lambda V0: (lambda x: V0*(1-x) if 0 < x < 1 else 0.0)
ref['T_par'] = {f'{V0}_{e}': [T_ode(Vpar(V0), e*V0, -3, 3), math.exp(-2*integrate.quad(lambda x: math.sqrt(2*(V0*(1-x*x)-e*V0)), -math.sqrt(1-e), math.sqrt(1-e))[0])] for V0 in (20.0, 40.0) for e in (0.2, 0.4, 0.7, 0.9)}
ref['T_tri'] = {f'{V0}_{e}': [T_ode(Vtri(V0), e*V0, -1, 2), math.exp(-2*integrate.quad(lambda x: math.sqrt(2*(V0*(1-x)-e*V0)), 0, 1-e)[0])] for V0 in (20.0,) for e in (0.2, 0.4, 0.7)}
ref['gamow'] = [[k, mu, E, R, float(integrate.quad(lambda r: 2*math.sqrt(2*mu*(k/r-E)), R, k/E)[0])] for (k, mu, E, R) in ((1.0, 1.0, 0.5, 0.4), (3.0, 2.0, 0.8, 0.5), (259.19, 3664.7, 4.27, 9.2996))]

# ---------- Cap. 23: dependiente del tiempo ----------
from scipy.integrate import solve_ivp
def pulse_g(kind, T):
    return {'sq': lambda t: 1.0, 'ga': lambda t: math.exp(-((t-T/2)**2)/(2*(T/4)**2)), 'sin': lambda t: math.sin(math.pi*t/T)**2}[kind]
def pulse_exact(kind, T, V, D):
    g = pulse_g(kind, T)
    def f(t, y):
        a = V/2*g(t); c = a*np.exp(1j*D*t)
        H = np.array([[0, c], [np.conj(c), 0]]); return list(-1j*(H@np.array([y[0], y[1]])))
    sol = solve_ivp(lambda t, y: np.array(f(t, y)), [0, T], [1+0j, 0j], rtol=1e-11, atol=1e-13, method='DOP853')
    return float(abs(sol.y[1, -1])**2)
def pulse_first(kind, T, V, D):
    g = pulse_g(kind, T); re = integrate.quad(lambda t: g(t)*math.cos(D*t), 0, T, epsabs=1e-13, epsrel=1e-12)[0]; im = integrate.quad(lambda t: g(t)*math.sin(D*t), 0, T, epsabs=1e-13, epsrel=1e-12)[0]
    return (V/2)**2*(re*re+im*im)
ref['pulse'] = [dict(kind=k, T=T, V=V, D=D, ex=pulse_exact(k, T, V, D), p1=pulse_first(k, T, V, D)) for (k, T, V, D) in (('sq', 12.0, 0.1, 0.2), ('sq', 12.0, 0.1, 0.0), ('sq', 5.0, 0.05, -0.7), ('ga', 12.0, 0.1, 0.2), ('ga', 20.0, 0.05, 0.0), ('sin', 12.0, 0.1, 0.3), ('sin', 8.0, 0.2, -0.4))]
def band_ref(N, eps, V, ts):
    H = np.zeros((N+1, N+1))
    for j in range(1, N+1): H[j, j] = eps*(j-(N+1)/2); H[0, j] = H[j, 0] = V
    w, U = np.linalg.eigh(H); return [float(abs(np.sum(U[0, :]**2*np.exp(-1j*w*t)))**2) for t in ts]
ts23 = [0.0, 5.0, 20.0, 62.8318530718, 100.0]
ref['band23'] = {f'{N}_{eps}_{V}': band_ref(N, eps, V, ts23) for (N, eps, V) in ((100, 0.1, 0.01), (200, 0.1, 0.01), (200, 0.1, 0.03), (60, 0.2, 0.02))}
ref['band_t'] = ts23
def lz_num(g, v, T):
    sol = solve_ivp(lambda t, y: [-1j*(v*t/2*y[0]+g*y[1]), -1j*(g*y[0]-v*t/2*y[1])], [-T, T], [1+0j, 0j], rtol=1e-11, atol=1e-13, method='DOP853')
    return float(abs(sol.y[0, -1])**2)
ref['lz'] = {f'{g}_{v}': lz_num(g, v, 40.0) for (g, v) in ((0.5, 2.0), (0.3, 1.0), (0.2, 0.5), (1.0, 3.0))}

# ---------- Cap. 24: adiabático ----------
sx24 = np.array([[0, 1], [1, 0]], complex); sz24 = np.diag([1, -1]).astype(complex)
def berry_stay_ref(th, om, t):
    Hrot = 0.5*(math.sin(th)*sx24+(math.cos(th)-om)*sz24); psi0 = np.array([math.cos(th/2), math.sin(th/2)], complex)
    psi = linalg.expm(-1j*Hrot*t)@psi0
    # en el sistema giratorio el espín de referencia (alineado con B) es psi0 (el campo es fijo en ese sistema)
    return float(abs(np.vdot(psi0, psi))**2)
ref['berry_stay'] = [dict(th=th, om=om, t=t, P=berry_stay_ref(th, om, t)) for th in (0.5, 1.0472, 1.5708, 2.4) for om in (0.05, 0.3, 1.0, 2.0) for t in (3.0, 17.0, 60.0)]
def berry_phase_ref(th, om):
    T = 2*math.pi/om; Hrot = 0.5*(math.sin(th)*sx24+(math.cos(th)-om)*sz24); psi0 = np.array([math.cos(th/2), math.sin(th/2)], complex)
    U = linalg.expm(-0.5j*om*T*sz24)@linalg.expm(-1j*Hrot*T); return float(np.angle(np.vdot(psi0, U@psi0)))
ref['berry_phase'] = [dict(th=th, om=om, phi=berry_phase_ref(th, om)) for th in (0.5, 1.0472, 1.5708, 2.4) for om in (0.1, 0.01, 0.002)]
# solapamiento brusco del oscilador: ∫ψ0(ω0)ψ0(ω1) dx
ref['ho_sudden'] = [[r, float(integrate.quad(lambda x: (1/math.pi**0.25)*math.exp(-x*x/2)*(r**0.25/math.pi**0.25)*math.exp(-r*x*x/2), -np.inf, np.inf)[0]**2)] for r in (0.5, 2.0, 3.0, 0.2)]

# ---------- Cap. 25: dispersión ----------
from scipy.integrate import solve_ivp
def delta_ode(l, k, V, a, r0=1e-6):
    # u'' = [l(l+1)/r² + 2V − k²] u ; u ~ r^{l+1}
    f = lambda r, y: [y[1], (l*(l+1)/r**2+2*V(r)-k*k)*y[0]]
    sol = solve_ivp(f, [r0, a], [r0**(l+1), (l+1)*r0**l], rtol=1e-11, atol=1e-30, method='DOP853')
    u, du = sol.y[0, -1], sol.y[1, -1]; beta = a*du/u-1; x = k*a
    jl, yl = special.spherical_jn(l, x), special.spherical_yn(l, x); jlp, ylp = special.spherical_jn(l, x, derivative=True), special.spherical_yn(l, x, derivative=True)
    d = math.atan2(x*jlp-beta*jl, x*ylp-beta*yl); return d-math.pi*round(d/math.pi)
yuk25 = lambda V0: (lambda r: -V0*math.exp(-r)/r); gau25 = lambda V0: (lambda r: -V0*math.exp(-r*r))
ref['delta3d'] = [dict(pot=nm, V0=V0, k=k, l=l, d=delta_ode(l, k, f(V0), a)) for (nm, f, a) in (('yuk', yuk25, 25.0), ('gau', gau25, 8.0)) for V0 in (0.5, 3.0) for k in (0.3, 1.0, 2.5) for l in (0, 1, 2, 3)]
ref['hard_delta'] = [dict(l=l, x=x, d=(lambda d: d-math.pi*round(d/math.pi))(math.atan2(special.spherical_jn(l, x), special.spherical_yn(l, x)))) for l in (0, 1, 2, 5, 9) for x in (0.1, 1.0, 3.7, 9.0)]
def well_ode(l, k, V0, a):
    # pozo cuadrado: integración con corte exacto en r = a y matching en r = 2a (potencial nulo fuera)
    f = lambda r, y: [y[1], (l*(l+1)/r**2+(-2*V0 if r < a else 0.0)-k*k)*y[0]]
    r0 = 1e-6; s1 = solve_ivp(f, [r0, a], [r0**(l+1), (l+1)*r0**l], rtol=1e-12, atol=1e-30, method='DOP853'); s2 = solve_ivp(f, [a, 2*a], s1.y[:, -1], rtol=1e-12, atol=1e-30, method='DOP853')
    u, du = s2.y[0, -1], s2.y[1, -1]; A = 2*a; beta = A*du/u-1; x = k*A
    jl, yl = special.spherical_jn(l, x), special.spherical_yn(l, x); jlp, ylp = special.spherical_jn(l, x, derivative=True), special.spherical_yn(l, x, derivative=True)
    d = math.atan2(x*jlp-beta*jl, x*ylp-beta*yl); return d-math.pi*round(d/math.pi)
ref['well_delta'] = [dict(l=l, k=k, V0=V0, a=1.0, d=well_ode(l, k, V0, 1.0)) for (V0, k) in ((3.0, 0.8), (6.0, 0.3), (10.0, 1.7)) for l in (0, 1, 2)]
def born_num(V, k, rmax):
    q_int = lambda q: -2/q*integrate.quad(lambda r: r*V(r)*math.sin(q*r), 0, rmax, limit=800, epsabs=1e-13)[0]
    return (2*math.pi/k**2)*integrate.quad(lambda q: q_int(q)**2*q, 0, 2*k, epsabs=1e-12)[0]
ref['born'] = [dict(pot=nm, V0=V0, k=k, s=born_num(f(V0), k, a)) for (nm, f, a) in (('yuk', yuk25, 60.0), ('gau', gau25, 12.0)) for V0 in (0.5, 2.0) for k in (0.4, 1.0, 3.0)]

# ---------- Cap. 26: resonancias ----------
def ws_res(l, V0):
    V = lambda r: -V0/(1+math.exp((r-1.0)/0.05))
    dk = lambda k: delta_ode(l, k, V, 6.0)
    # localizar el cruce δ = π/2 por búsqueda en k con paso fino y brentq sobre cos(δ)
    ks = np.arange(0.2, 3.0, 0.01); ds = [dk(k) for k in ks]; kr = None
    for i in range(1, len(ks)):
        if ds[i-1] < math.pi/2 <= ds[i] or (ds[i-1] > 0 and ds[i] < 0 and abs(ds[i]-ds[i-1]) > 1.0 and ds[i-1] > 1.3):
            kr = optimize.brentq(lambda k: math.cos(dk(k)) if abs(dk(k)) < 1.9 else (math.cos(dk(k)) ), ks[i-1], ks[i]) if False else ks[i]; break
    return kr
def delta_unwrapped_ode(l, V0, ks):
    V = lambda r: -V0/(1+math.exp((r-1.0)/0.05)); out = []
    for k in ks:
        d = delta_ode(l, k, V, 6.0); out.append(d)
    for i in range(1, len(out)): out[i] += math.pi*round((out[i-1]-out[i])/math.pi)
    return out
def res_params(l, V0, k0):
    ks = np.arange(k0-0.15, k0+0.15, 0.0025); ds = np.array(delta_unwrapped_ode(l, V0, ks)); Es = ks**2/2
    sl = np.gradient(ds, Es); i = int(np.argmax(sl)); return dict(Er=float(Es[i]), Gam=float(2/sl[i]), smax=float(sl[i]))
ref['ws_res'] = {f'{l}_{V0}': res_params(l, V0, k0) for (l, V0, k0) in ((3, 15.0, 1.625), (3, 16.0, 1.21), (3, 14.0, 1.93))}
def bound_s(K0):
    f = lambda x: x/math.tan(x)+math.sqrt(K0*K0-x*x); xs = np.linspace(0.01, K0-1e-6, 40000); v = [f(x) for x in xs]
    return [optimize.brentq(f, xs[i], xs[i+1]) for i in range(len(xs)-1) if v[i]*v[i+1] < 0 and abs(v[i]) < 50 and abs(v[i+1]) < 50]
ref['well_bound'] = {str(K0): bound_s(K0) for K0 in (1.2, 2.2, 4.0, 5.0, 7.0, 10.0)}

# ---------- Cap. 27: partículas idénticas ----------
def R10_(r, Z): return 2*Z**1.5*math.exp(-Z*r)
def R20_(r, Z): return Z**1.5/math.sqrt(2)*(1-Z*r/2)*math.exp(-Z*r/2)
def JK_ref(Z1, Z2):
    inner = lambda f, r1: integrate.quad(lambda r2: f(r2)/max(r1, r2), 0, r1, epsabs=1e-13)[0]+integrate.quad(lambda r2: f(r2)/max(r1, r2), r1, 70, epsabs=1e-13, limit=200)[0]
    f2 = lambda r: R20_(r, Z2)**2*r*r; g = lambda r: R10_(r, Z1)*R20_(r, Z2)*r*r
    J = integrate.quad(lambda r1: R10_(r1, Z1)**2*r1*r1*inner(f2, r1), 0, 70, epsabs=1e-12, limit=200)[0]
    K = integrate.quad(lambda r1: g(r1)*inner(g, r1), 0, 70, epsabs=1e-12, limit=200)[0]
    return [J, K]
ref['JK'] = {f'{a}_{b}': JK_ref(a, b) for (a, b) in ((2.0, 2.0), (2.0, 1.0), (1.5, 0.8), (1.0, 1.0))}
phi27 = lambda n, x: math.sqrt(2)*math.sin(n*math.pi*x)
def sep2_ref(a, b, sg):
    ps = (lambda x1, x2: phi27(a, x1)*phi27(b, x2)) if sg == 0 else (lambda x1, x2: (phi27(a, x1)*phi27(b, x2)+sg*phi27(b, x1)*phi27(a, x2))/math.sqrt(2))
    return integrate.dblquad(lambda x2, x1: (x1-x2)**2*ps(x1, x2)**2, 0, 1, 0, 1, epsabs=1e-12)[0]
ref['sep2'] = {f'{a}_{b}_{sg}': sep2_ref(a, b, sg) for (a, b) in ((1, 2), (1, 3), (2, 3), (1, 4)) for sg in (0, 1, -1)}
def contact_ref(a, b, sg):
    ps = (lambda x: phi27(a, x)*phi27(b, x)) if sg == 0 else (lambda x: math.sqrt(2)*phi27(a, x)*phi27(b, x) if sg == 1 else 0.0)
    return integrate.quad(lambda x: ps(x)**2, 0, 1)[0]
ref['contact'] = {f'{a}_{b}_{sg}': contact_ref(a, b, sg) for (a, b) in ((1, 1), (1, 2), (2, 3), (1, 4)) for sg in (0, 1, -1)}
ref['slater3'] = float(np.sum(np.array([[0.0]]))) if False else None
import itertools as it27
ref['counts'] = {f'{N}_{M}': [M**N, sum(1 for _ in it27.combinations_with_replacement(range(M), N)), sum(1 for _ in it27.combinations(range(M), N))] for N in (2, 3, 4) for M in (2, 3, 5, 6)}

# ---------- Cap. 28: muchos electrones ----------
def rhf28(exps, Z, iters=500):
    n = len(exps); S = np.zeros((n, n)); h = np.zeros((n, n)); G = np.zeros((n, n, n, n))
    for i in range(n):
        for j in range(n):
            a, b = exps[i], exps[j]; q = a+b; S[i, j] = (math.pi/q)**1.5; h[i, j] = 3*a*b/q*S[i, j]-2*math.pi*Z/q
    for i in range(n):
        for j in range(n):
            for k in range(n):
                for l in range(n):
                    p_ = exps[i]+exps[j]; q_ = exps[k]+exps[l]; G[i, j, k, l] = 2*math.pi**2.5/(p_*q_*math.sqrt(p_+q_))
    w, C = linalg.eigh(h, S); c = C[:, 0]; E_old = 0
    for it in range(iters):
        F = h+np.einsum('kl,ijkl->ij', np.outer(c, c), 2*G-np.transpose(G, (0, 2, 1, 3)))
        w, C = linalg.eigh(F, S); cn = C[:, 0]; cn = cn/math.sqrt(cn@S@cn)
        if np.dot(cn, c) < 0: cn = -cn
        e = 2*cn@h@cn+np.einsum('i,j,k,l,ijkl', cn, cn, cn, cn, G)
        if abs(e-E_old) < 1e-13 and it > 5: break
        c = 0.5*(cn+c); c = c/math.sqrt(c@S@c); E_old = e
    return [float(e), float(w[0])]
ref['rhf'] = {f'{Z}_{n}_{a1}_{b}': rhf28([a1*b**i for i in range(n)], Z) for (Z, n, a1, b) in ((2, 1, 0.77, 3.0), (2, 4, 0.1, 4.0), (2, 8, 0.05, 3.2), (3, 8, 0.1, 3.0), (2, 6, 0.04, 4.5), (4, 6, 0.2, 3.5))}

# ---------- Cap. 29: segunda cuantización ----------
def jw(M):
    sz = np.diag([1.0, -1.0]); sm = np.array([[0.0, 1.0], [0.0, 0.0]]); I2 = np.eye(2)
    ops = []
    for j in range(M):
        mats = [sz]*j+[sm]+[I2]*(M-j-1); out = mats[0]
        for m_ in mats[1:]: out = np.kron(out, m_)
        ops.append(out)
    return ops
def hub2_eigs(t, U):
    c = jw(4); d = [x.T for x in c]; n = [d[i]@c[i] for i in range(4)]
    H = np.zeros((16, 16))
    for a, b in ((0, 2), (1, 3)): H += -t*(d[a]@c[b]+d[b]@c[a])
    H += U*(n[0]@n[1]+n[2]@n[3]); return np.sort(np.linalg.eigvalsh(H)).tolist()
ref['hubbard2'] = {f'{t}_{U}': hub2_eigs(t, U) for (t, U) in ((1.0, 0.0), (1.0, 4.0), (1.0, 20.0), (0.7, 3.3), (1.0, 8.0))}
ref['fermi_mu'] = {str(T): float(optimize.brentq(lambda mu: integrate.quad(lambda x: 1.5*math.sqrt(x)*special.expit(-(x-mu)/T), 0, 40*T+10, epsabs=1e-12)[0]-1, -10*T-1, 2)) for T in (0.01, 0.05, 0.1, 0.3, 1.0)}
ref['zeta'] = [float(sp.zeta(sp.Rational(3, 2))), float(sp.zeta(3))]

# ---------- Cap. 30–34: información cuántica (matriz densidad, entrelazamiento, Lindblad) ----------
rng30 = np.random.default_rng(30)
def rand_rho(d, rank=None):
    rank = rank or d; A = rng30.normal(size=(d, rank))+1j*rng30.normal(size=(d, rank)); r = A@A.conj().T; return r/np.trace(r).real
def entropy_bits(r):
    w = np.linalg.eigvalsh(r); w = w[w > 1e-14]; return float(-np.sum(w*np.log2(w)))
def concurrence_ref(r):
    yy = np.kron(np.array([[0, -1j], [1j, 0]]), np.array([[0, -1j], [1j, 0]])); rt = yy@r.conj()@yy
    sr = linalg.sqrtm(r); lam = np.sqrt(np.abs(np.sort(np.linalg.eigvals(sr@rt@sr).real)))[::-1]; return float(max(0, lam[0]-lam[1]-lam[2]-lam[3]))
def ptrace_ref(r, dA, dB, keep):
    r4 = r.reshape(dA, dB, dA, dB); return np.einsum('ijkj->ik', r4) if keep == 'A' else np.einsum('ijil->jl', r4)
def chsh_max_ref(r):
    P = [np.array([[0, 1], [1, 0]], complex), np.array([[0, -1j], [1j, 0]]), np.array([[1, 0], [0, -1]], complex)]
    T = np.array([[np.trace(r@np.kron(P[i], P[j])).real for j in range(3)] for i in range(3)]); u = np.sort(np.linalg.eigvalsh(T.T@T))[::-1]; return float(2*math.sqrt(u[0]+u[1]))
cases30 = []
for k in range(6):
    r = rand_rho(4, rank=[1, 2, 3, 4, 4, 2][k]); cases30.append(dict(re=r.real.tolist(), im=r.imag.tolist(), S=entropy_bits(r), pur=float(np.trace(r@r).real), C=concurrence_ref(r), chsh=chsh_max_ref(r), SA=entropy_bits(ptrace_ref(r, 2, 2, 'A')), SB=entropy_bits(ptrace_ref(r, 2, 2, 'B')), rA=[ptrace_ref(r, 2, 2, 'A').real.tolist(), ptrace_ref(r, 2, 2, 'A').imag.tolist()], rB=[ptrace_ref(r, 2, 2, 'B').real.tolist(), ptrace_ref(r, 2, 2, 'B').imag.tolist()]))
ref['rho4'] = cases30
def werner_ref(p):
    psi = np.array([0, 1, -1, 0])/math.sqrt(2); return p*np.outer(psi, psi)+(1-p)*np.eye(4)/4
ref['werner'] = {str(p_): dict(C=concurrence_ref(werner_ref(p_)), S=entropy_bits(werner_ref(p_)), chsh=chsh_max_ref(werner_ref(p_))) for p_ in (0.0, 0.2, 1/3, 0.5, 0.7071, 0.9, 1.0)}

# ---------- Cap. 32: medida y decoherencia ----------
def central_spin(gs, ts):
    N = len(gs); sz = np.diag([1.0, -1.0]); I2 = np.eye(2); out = []
    def op(site, m):
        mats = [I2]*(N+1); mats[site] = m; r = mats[0]
        for x in mats[1:]: r = np.kron(r, x)
        return r
    H = sum(0.5*gs[k]*op(0, sz)@op(k+1, sz) for k in range(N))
    plus = np.array([1, 1])/math.sqrt(2); psi0 = plus.copy()
    for _ in range(N): psi0 = np.kron(psi0, plus)
    w, U = np.linalg.eigh(H)
    for t in ts:
        psi = U@(np.exp(-1j*w*t)*(U.T@psi0)); r = np.outer(psi, psi.conj()).reshape(2, 2**N, 2, 2**N); rS = np.einsum('iaja->ij', r); out.append(float(abs(rS[0, 1])))
    return out
gs32 = [1.0, 0.7, 1.3, 0.4, 0.9]; ts32 = [0.0, 0.3, 0.8, 1.5, 2.6, 4.0]
ref['central'] = dict(g=gs32, t=ts32, c=central_spin(gs32, ts32), g2=[1.0, 1.0, 1.0], c2=central_spin([1.0, 1.0, 1.0], ts32))
from scipy.integrate import solve_ivp
def cat_lindblad(alpha, gam_t, N=44):
    a = np.diag(np.sqrt(np.arange(1, N)), 1); ad = a.T
    def coh(z): 
        v = np.array([math.exp(-abs(z)**2/2)*z**n/math.sqrt(math.factorial(n)) for n in range(N)], complex); return v
    psi = coh(alpha)+coh(-alpha); psi /= np.linalg.norm(psi); rho0 = np.outer(psi, psi.conj())
    def f(t, y):
        r = y.reshape(N, N); return (a@r@ad-0.5*(ad@a@r+r@ad@a)).reshape(-1)
    sol = solve_ivp(f, [0, gam_t], rho0.reshape(-1), rtol=1e-10, atol=1e-12, method='DOP853'); rt = sol.y[:, -1].reshape(N, N)
    at = alpha*math.exp(-gam_t/2); cA = coh(at); cB = coh(-at); nrm = 2*(1+math.exp(-2*alpha**2)); c = math.exp(-0.5*(2*alpha)**2*(1-math.exp(-gam_t)))
    model = (np.outer(cA, cA.conj())+np.outer(cB, cB.conj())+c*(np.outer(cA, cB.conj())+np.outer(cB, cA.conj())))/nrm
    # la normalización exacta es 1/(2(1+e^{-2α²}))·(1 + ...) → se usa la traza para reescalar
    model = model/np.trace(model).real
    return float(np.max(np.abs(rt-model))), float(np.trace(rt).real)
ref['cat'] = {f'{a}_{g}': cat_lindblad(a, g) for (a, g) in ((0.8, 0.1), (1.2, 0.3), (1.5, 0.6), (1.0, 1.0))}

# ---- Cap. 33: ecuación de Lindblad (superoperador exponencial, numpy/scipy) ----
from scipy.linalg import expm as _expm
_X = np.array([[0, 1], [1, 0]], complex); _Z = np.diag([1, -1]).astype(complex); _sm = np.array([[0, 1], [0, 0]], complex)
def _liou(H, Ls):
    I = np.eye(2); Lm = -1j*(np.kron(H, I)-np.kron(I, H.T))
    for g, A in Ls:
        AdA = A.conj().T@A; Lm = Lm+g*(np.kron(A, A.conj())-0.5*np.kron(AdA, I)-0.5*np.kron(I, AdA.T))
    return Lm
def _ev(r0, H, Ls, t): return (_expm(_liou(H, Ls)*t)@r0.reshape(-1)).reshape(2, 2)
def _bloch(r): return [float(2*r[0, 1].real), float(-2*r[0, 1].imag), float((r[0, 0]-r[1, 1]).real)]
def _S(r):
    w = np.linalg.eigvalsh(r); w = w[w > 1e-15]; return float(-(w*np.log2(w)).sum())
relax = []
for (T1, Tp, w, th, t) in ((5, 20, 2, 70, 3), (5, 20, 2, 70, 25), (2, 1.5, 3.3, 120, 4), (10, 4, 0.7, 40, 6)):
    r0 = np.array([[(1+math.cos(math.radians(th)))/2, math.sin(math.radians(th))/2], [math.sin(math.radians(th))/2, (1-math.cos(math.radians(th)))/2]], complex)
    r = _ev(r0, 0.5*w*_Z, [(1/T1, _sm), (1/(2*Tp), _Z)], t); relax.append(dict(T1=T1, Tp=Tp, w=w, th=th, t=t, bloch=_bloch(r), pur=float(np.trace(r@r).real), S=_S(r)))
ref['lind_relax'] = relax
opt = []
for (Om, De, t) in ((2, 0, 0.5), (2, 0, 1.0), (2, 0, 8.0), (1, 1, 3.0), (0.2, 0.5, 6.0), (5, -2, 2.0)):
    r = _ev(np.diag([1, 0]).astype(complex), 0.5*(Om*_X+De*_Z), [(1, _sm)], t); opt.append(dict(Om=Om, De=De, t=t, ree=float(r[1, 1].real), coh=float(abs(r[0, 1]))))
ref['lind_opt'] = opt
ss = []
for (Om, De) in ((2, 0), (1, 1), (0.5, -0.7), (6, 2)):
    Lm = _liou(0.5*(Om*_X+De*_Z), [(1, _sm)]); wv, vv = np.linalg.eig(Lm); k = np.argmin(abs(wv)); v = vv[:, k].reshape(2, 2); v = v/np.trace(v); ss.append(dict(Om=Om, De=De, ree=float(v[1, 1].real), formula=(Om**2/4)/(De**2+0.25+Om**2/2)))
ref['lind_ss'] = ss
chn = []
for p in (0.1, 0.4, 0.9):
    K = [np.diag([1, math.sqrt(1-p)]), np.array([[0, math.sqrt(p)], [0, 0]])]
    J = np.zeros((4, 4), complex)
    for i in range(2):
        for j in range(2):
            E = np.zeros((2, 2), complex); E[i, j] = 1; F = sum(k@E@k.conj().T for k in K); J[2*i:2*i+2, 2*j:2*j+2] = F
    plus = np.array([[.5, .5], [.5, .5]]); o = sum(k@plus@k.conj().T for k in K)
    chn.append(dict(p=p, choi=[float(x) for x in np.linalg.eigvalsh(J)], out=_bloch(o), S=_S(o)))
ref['kraus_amp'] = chn

# ---- Cap. 34: computación cuántica (numpy puro: matrices explícitas, FFT) ----
def _k(*ms):
    r = np.eye(1, dtype=complex)
    for m in ms: r = np.kron(r, m)
    return r
_I2 = np.eye(2, dtype=complex); _H = np.array([[1, 1], [1, -1]], complex)/math.sqrt(2); _Sg = np.diag([1, 1j]); _Tg = np.diag([1, np.exp(1j*math.pi/4)])
_Xg = np.array([[0, 1], [1, 0]], complex); _Zg = np.diag([1, -1]).astype(complex)
def _op1(n, q, g): return _k(*[g if i == q else _I2 for i in range(n)])
def _bits(n, i): return [(i >> (n-1-q)) & 1 for q in range(n)]
def _perm(n, f):
    N = 2**n; M = np.zeros((N, N), complex)
    for i in range(N): M[f(i), i] = 1
    return M
def _cnot(n, c, t): return _perm(n, lambda i: i ^ (1 << (n-1-t)) if (i >> (n-1-c)) & 1 else i)
def _swap(n, a, b):
    def f(i):
        ba, bb = (i >> (n-1-a)) & 1, (i >> (n-1-b)) & 1
        return i if ba == bb else i ^ (1 << (n-1-a)) ^ (1 << (n-1-b))
    return _perm(n, f)
def _cp(n, c, t, ph): return np.diag([np.exp(1j*ph) if (_bits(n, i)[c] and _bits(n, i)[t]) else 1 for i in range(2**n)]).astype(complex)
def _ry(t): return np.array([[math.cos(t/2), -math.sin(t/2)], [math.sin(t/2), math.cos(t/2)]], complex)
def _rz(f): return np.diag([np.exp(-1j*f/2), np.exp(1j*f/2)])
circ = [['H', 0], ['H', 1], ['T', 1], ['CNOT', 0, 2], ['CP', 1, 3, 0.7], ['RY', 2, 0.9], ['CNOT', 3, 1], ['S', 0], ['H', 3], ['CP', 0, 2, -1.1], ['RZ', 1, 0.4], ['SWAP', 0, 3], ['Y', 2], ['X', 1]]
_Yg = np.array([[0, -1j], [1j, 0]])
def _run(n, ops, psi):
    for o in ops:
        if o[0] == 'CNOT': U = _cnot(n, o[1], o[2])
        elif o[0] == 'CP': U = _cp(n, o[1], o[2], o[3])
        elif o[0] == 'SWAP': U = _swap(n, o[1], o[2])
        elif o[0] == 'RY': U = _op1(n, o[1], _ry(o[2]))
        elif o[0] == 'RZ': U = _op1(n, o[1], _rz(o[2]))
        else: U = _op1(n, o[1], dict(H=_H, S=_Sg, T=_Tg, X=_Xg, Y=_Yg, Z=_Zg)[o[0]])
        psi = U@psi
    return psi
psi0 = np.zeros(16, complex); psi0[0] = 1; fin = _run(4, circ, psi0)
ref['qc_circ'] = dict(ops=circ, re=[float(x.real) for x in fin], im=[float(x.imag) for x in fin])
# Grover con matrices explícitas
def grover_ref(n, marked, k):
    N = 2**n; Hn = _k(*[_H]*n); e0 = np.zeros((N, N)); e0[0, 0] = 1; D = Hn@(2*e0-np.eye(N))@Hn
    O = np.eye(N); O[marked, marked] = -1; s = Hn[:, 0].astype(complex)
    for _ in range(k): s = D@(O@s)
    return float(abs(s[marked])**2), float(np.linalg.norm(s)**2)
ref['grover'] = {f'{n}_{m}_{k}': grover_ref(n, m, k) for (n, m, k) in ((2, 1, 1), (3, 5, 1), (3, 5, 2), (4, 9, 3), (5, 17, 4), (6, 33, 6))}
# QFT frente a la FFT inversa normalizada
rng = np.random.default_rng(7); v = rng.normal(size=32)+1j*rng.normal(size=32); v /= np.linalg.norm(v); q = np.fft.ifft(v)*math.sqrt(32)
ref['qft'] = dict(re=[float(x.real) for x in v], im=[float(x.imag) for x in v], ore=[float(x.real) for x in q], oim=[float(x.imag) for x in q])
# Teletransporte con matrices de densidad (numpy puro)
def tele_ref(theta, phi, p):
    psi = np.array([math.cos(theta/2), math.sin(theta/2)*np.exp(1j*phi)]); pin = np.outer(psi, psi.conj())
    phip = np.array([1, 0, 0, 1])/math.sqrt(2); res = p*np.outer(phip, phip)+(1-p)*np.eye(4)/4; rho = np.kron(pin, res)
    cn = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]], complex); U = np.kron(_H, np.eye(4))@np.kron(cn, _I2); r1 = U@rho@U.conj().T
    out = []; Fa = 0
    for m1 in (0, 1):
        for m2 in (0, 1):
            P = np.zeros((4, 4)); P[2*m1+m2, 2*m1+m2] = 1; Pf = np.kron(P, _I2); R = Pf@r1@Pf; pr = float(np.trace(R).real)
            rb = R.reshape(4, 2, 4, 2); rb = np.einsum('ijik->jk', rb)/pr
            corr = np.linalg.matrix_power(_Zg, m1)@np.linalg.matrix_power(_Xg, m2)@rb@np.linalg.matrix_power(_Xg, m2).conj().T@np.linalg.matrix_power(_Zg, m1).conj().T
            F = float(np.trace(pin@corr).real); Fa += pr*F; out.append(dict(prob=pr, F=F, Fpre=float(np.trace(pin@rb).real)))
    return dict(out=out, F=float(Fa))
ref['tele'] = {f'{a}_{b}_{c}': tele_ref(a, b, c) for (a, b, c) in ((0.7, 0.4, 1.0), (1.3, 2.1, 0.8), (2.4, -0.9, 0.5), (0.5, 0.0, 0.2))}
# Shor: distribución exacta del registro de entrada (FFT de los pulsos periódicos)
def shor_ref(N, a, m):
    Qn = 2**m; r = 1; x = a % N
    while x != 1: x = (x*a) % N; r += 1
    P = np.zeros(Qn)
    for x0 in range(r):
        v = np.zeros(Qn, complex); v[x0::r] = 1; amp = np.fft.fft(v)/math.sqrt(Qn)   # amplitud sin normalizar de la rama x0
        P += abs(amp)**2/Qn  # (1/Q)·|Σ|²/Q: peso K/Q × normalización 1/(QK) ⇒ |Σ|²/Q²
    return r, P
ref['shor'] = {}
for (N, a, m) in ((15, 7, 8), (21, 2, 10), (35, 3, 11), (15, 2, 7)):
    r, P = shor_ref(N, a, m); ref['shor'][f'{N}_{a}_{m}'] = dict(r=r, P=[float(x) for x in P[::max(1, len(P)//64)]], step=max(1, len(P)//64), tot=float(P.sum()), pmax=float(P.max()))
# Código de repetición: fidelidad media exacta (numpy)
def bitflip_ref(p, alpha):
    a = alpha; b = math.sqrt(1-a*a); enc = np.zeros(8, complex); enc[0] = a; enc[7] = b; F = 0; pL = 0
    for e in range(8):
        w = bin(e).count('1'); pe = p**w*(1-p)**(3-w); s = enc.copy()
        for q in range(3):
            if (e >> (2-q)) & 1: s = _op1(3, q, _Xg)@s
        idx = int(np.argmax(abs(s))); z = _bits(3, idx); s01, s12 = z[0] ^ z[1], z[1] ^ z[2]
        fix = {(1, 0): 0, (1, 1): 1, (0, 1): 2}.get((s01, s12))
        if fix is not None: s = _op1(3, fix, _Xg)@s
        F += pe*abs(np.vdot(enc, s))**2
        if w >= 2: pL += pe
    return float(F), float(pL)
ref['bitflip'] = {f'{p}_{al}': bitflip_ref(p, al) for (p, al) in ((0.01, 0.6), (0.1, 0.6), (0.3, 0.8), (0.1, math.sqrt(0.5)))}

# ---- Cap. 35: Jaynes–Cummings (numpy/scipy: exponencial de la matriz en el espacio de Fock truncado) ----
def _coh(nbar, N): return np.array([math.exp(-nbar/2)*nbar**(k/2)/math.sqrt(math.factorial(k)) for k in range(N)])
def jc_ref(c, Delta, g, t, wpts=()):
    N = len(c); a = np.diag(np.sqrt(np.arange(1, N)), 1); sp_ = np.array([[0, 1], [0, 0]], float); sz_ = np.diag([1.0, -1.0])
    H = 0.5*Delta*np.kron(sz_, np.eye(N))+g*(np.kron(sp_, a)+np.kron(sp_.T, a.T))
    psi = linalg.expm(-1j*H*t)@np.kron([1.0, 0.0], c); M = psi.reshape(2, N)
    rho_a = M@M.conj().T; w_ = np.linalg.eigvalsh(rho_a); w_ = w_[w_ > 1e-14]; S = float(-(w_*np.log2(w_)).sum())
    rho_f = M.T@M.conj(); out = dict(Pe=float(rho_a[0, 0].real), S=S, pur=float(np.trace(rho_a@rho_a).real), purF=float(np.trace(rho_f@rho_f).real), W=[])
    # Wigner por paridad desplazada: W(ξ, π) = (1/π) Tr[D†(α) ρ_F D(α) Π], α = (ξ + iπ)/√2
    par = np.diag([(-1)**n for n in range(N)]).astype(complex)
    for (xi, pi_) in wpts:
        al = (xi+1j*pi_)/math.sqrt(2); D = linalg.expm(al*a.T-np.conj(al)*a); out['W'].append(float((np.trace(D.conj().T@rho_f@D@par)/math.pi).real))
    return out
ref['jc'] = []
for (nb, fk, De, g_, t_) in ((9, None, 0.0, 1.0, 2.0), (9, None, 0.0, 1.0, 9.4), (4, None, 1.3, 1.0, 3.1), (1.5, None, -2.0, 0.8, 5.0), (0, 3, 0.6, 1.0, 2.2), (25, None, 0.0, 1.0, 15.708)):
    NN = 110 if nb >= 20 else 60
    c_ = _coh(nb, NN) if fk is None else np.eye(NN)[fk]
    pts = ((0.0, 0.0), (1.3, -0.7), (-2.1, 0.4), (0.5, 2.2), (3.0, 1.0), (-4.0, -2.0)) if nb == 4 else ()
    r_ = jc_ref(c_, De, g_, t_, pts); r_.update(nb=nb, fk=-1 if fk is None else fk, De=De, g=g_, t=t_, pts=[list(p) for p in pts]); ref['jc'].append(r_)
# Casimir: energía por unidad de área con corte exponencial e^{−εω} (sumas geométricas exactas, SymPy): el término finito es −π²ħc/(720 d³)
_d, _e = sp.symbols('d epsilon', positive=True); _x = sp.exp(-sp.pi*_e/_d)
_S0 = _x/(1-_x); _S1 = _x/(1-_x)**2; _S2 = _x*(1+_x)/(1-_x)**3
_E = (1/(2*sp.pi))*(1/_e**3+(sp.pi**2/(_d**2*_e))*_S2+(2*sp.pi/(_d*_e**2))*_S1+(2/_e**3)*_S0-6*_d/(sp.pi*_e**4))
_c = sp.series(_E, _e, 0, 1).removeO()
ref['casimir'] = dict(coef=float(sp.simplify(_c*_d**3)), exact=float(-sp.pi**2/720))

# ---- Cap. 36: integrales de camino ----
from scipy.special import eval_hermite as _eh, fresnel as _fr
def _psi_ho(n, x): return _eh(n, x)*np.exp(-x*x/2)/math.sqrt(2.0**n*math.factorial(n)*math.sqrt(math.pi))
def rho_eig(beta, xs, nmax=80): return sum(math.exp(-beta*(n+0.5))*np.outer(_psi_ho(n, xs), _psi_ho(n, xs)) for n in range(nmax))
_xs = np.linspace(-6, 6, 121); _r3 = rho_eig(3.0, _xs); _r1 = rho_eig(1.0, _xs)
ref['euc'] = dict(x=[float(v) for v in _xs[::10]], d3=[float(_r3[i, i]) for i in range(0, 121, 10)], d1=[float(_r1[i, i]) for i in range(0, 121, 10)],
                  off3=[float(_r3[i, 120-i]) for i in range(0, 121, 10)], Z3=float(sum(math.exp(-3*(n+0.5)) for n in range(80))))
def coh_exact(x, t, a0=1.5):
    xc = math.sqrt(2)*a0*math.cos(t); pc = -math.sqrt(2)*a0*math.sin(t)
    return np.pi**-0.25*np.exp(-(x-xc)**2/2+1j*pc*x-1j*pc*xc/2-0.5j*t)
ref['coh36'] = {str(t): [[float(v.real), float(v.imag)] for v in coh_exact(np.array([-1.0, 0.4, 2.2]), t)] for t in (0.7, 2.0, 3.6, 5.5)}
def free_exact(x, t): return np.pi**-0.25/np.sqrt(1+1j*t)*np.exp(-x*x/(2*(1+1j*t)))
ref['free'] = {str(t): [[float(v.real), float(v.imag)] for v in free_exact(np.array([-1.0, 0.4, 2.2]), t)] for t in (0.5, 2.0, 6.0)}
def ho_disc_np(beta, Pn):
    eps = beta/Pn; A = np.zeros((Pn, Pn))
    for i in range(Pn): A[i, i] = 2/eps+eps; A[i, (i+1) % Pn] -= 1/eps; A[i, (i-1) % Pn] -= 1/eps
    return float(np.linalg.inv(A)[0, 0])
ref['hodisc'] = {f'{b}_{p}': ho_disc_np(b, p) for (b, p) in ((4.0, 32), (1.0, 8), (8.0, 64), (0.5, 4))}
def trot_x2(V, beta, Pn, M=361, L=7.0):
    xs = np.linspace(-L, L, M); dx = xs[1]-xs[0]; eps = beta/Pn; Vv = V(xs)
    T = np.exp(-0.5*eps*(Vv[:, None]+Vv[None, :])-(xs[:, None]-xs[None, :])**2/(2*eps))/math.sqrt(2*math.pi*eps)*dx
    Mt = np.linalg.matrix_power(T, Pn); d = np.diag(Mt); return float((d*xs**2).sum()/d.sum()), float(d.sum())
ref['pimc'] = {}
for (nm, V, beta, Pn) in (('ho', lambda x: 0.5*x*x, 4.0, 16), ('ho2', lambda x: 0.5*x*x, 2.0, 8), ('dw', lambda x: (x*x-1)**2, 3.0, 16), ('dw2', lambda x: (x*x-1)**2, 1.0, 8)):
    ref['pimc'][nm] = dict(beta=beta, P=Pn, x2=trot_x2(V, beta, Pn)[0])
# exacto del doble pozo (diagonalización en DVR de Fourier fino) para el límite del continuo
def dw_exact_x2(beta, M=600, L=8.0):
    xs = np.linspace(-L, L, M, endpoint=False); dx = xs[1]-xs[0]; k = 2*np.pi*np.fft.fftfreq(M, dx)
    F = np.fft.fft(np.eye(M), axis=0); T = np.real(np.fft.ifft((0.5*k**2)[:, None]*F, axis=0)); H = T+np.diag((xs**2-1)**2)
    w, v = np.linalg.eigh(H); Z = np.exp(-beta*w); return float(((v**2*xs[:, None]**2).sum(0)*Z).sum()/Z.sum()), float(w[0]), float(w[1])
ref['dw_exact'] = {str(b): dw_exact_x2(b) for b in (1.0, 3.0)}
_fx = [0.3, 1.0, 2.7, 5.2, -2.0, 12.0]; ref['fresnel'] = [dict(x=x, S=float(_fr(x)[0]), C=float(_fr(x)[1])) for x in _fx]

# ---- Cap. 37: ecuación de Dirac ----
def dirac1d_ref(N, L, sigma, p0, chi, m, times):
    x = -L/2+np.arange(N)*L/N; g = (2*math.pi*sigma**2)**-0.25*np.exp(-x*x/(4*sigma**2))
    a = np.cos(chi)*g*np.exp(1j*p0*x); b = np.sin(chi)*g*np.exp(1j*p0*x); nr = math.sqrt(((abs(a)**2+abs(b)**2).sum())*L/N); a /= nr; b /= nr
    k = 2*np.pi*np.fft.fftfreq(N, L/N); ak = np.fft.fft(a); bk = np.fft.fft(b); out = []
    for t in times:
        ak2 = np.zeros(N, complex); bk2 = np.zeros(N, complex)
        for j in range(N):
            Hk = np.array([[m, k[j]], [k[j], -m]]); v = linalg.expm(-1j*Hk*t)@np.array([ak[j], bk[j]]); ak2[j], bk2[j] = v
        a2 = np.fft.ifft(ak2); b2 = np.fft.ifft(bk2); rho = abs(a2)**2+abs(b2)**2; dx = L/N
        out.append(dict(t=t, norm=float(rho.sum()*dx), x=float((x*rho).sum()*dx/(rho.sum()*dx)), sx=float((2*(a2.conj()*b2).real).sum()*dx/(rho.sum()*dx))))
    return out
ref['dirac1d'] = []
for (N_, L_, sg, p0, chi, m_) in ((128, 40.0, 1.0, 0.0, math.pi/4, 1.0), (128, 40.0, 0.8, 1.2, 0.3, 1.0), (128, 40.0, 1.5, -0.7, 1.0, 1.4)):
    ref['dirac1d'].append(dict(N=N_, L=L_, sigma=sg, p0=p0, chi=chi, m=m_, ev=dirac1d_ref(N_, L_, sg, p0, chi, m_, (0.4, 1.3, 2.9))))
def klein_match(E, V0, m=1.0):
    p = math.sqrt(E*E-m*m); eps = E-V0
    if eps*eps < m*m: return dict(R=1.0, T=0.0)
    q = math.sqrt(eps*eps-m*m); kk = q if eps > 0 else -q
    u_in = np.array([1.0, p/(E+m)]); u_r = np.array([1.0, -p/(E+m)]); u_t = np.array([1.0, kk/(eps+m)])
    A = np.array([[u_r[0], -u_t[0]], [u_r[1], -u_t[1]]]); rho, tau = np.linalg.solve(A, -u_in)
    j = lambda u: u[0]*u[1]*2   # corriente ψ†σ_xψ = 2ab para espinores reales
    return dict(R=float(rho**2), T=float(tau**2*j(u_t)/j(u_in)))
ref['klein'] = [dict(E=E, V0=V0, **klein_match(E, V0)) for (E, V0) in ((2.0, 0.5), (2.0, 1.0), (2.0, 2.0), (2.0, 5.0), (2.0, 100.0), (1.2, 4.0), (5.0, 9.0), (1.05, 3.0))]
import mpmath as _mpm; _mpm.mp.dps = 30; _al = _mpm.mpf('7.2973525693e-3')
ref['dirac_hyd'] = [dict(n=n_, j=j_, Z=Z_, E=float(1/_mpm.sqrt(1+(Z_*_al)**2/(n_-(j_+_mpm.mpf(1)/2-_mpm.sqrt((j_+_mpm.mpf(1)/2)**2-(Z_*_al)**2)))**2))) for (n_, j_, Z_) in ((1, 0.5, 1), (1, 0.5, 26), (1, 0.5, 92), (2, 0.5, 92), (2, 1.5, 92), (2, 1.5, 1), (3, 2.5, 50), (3, 0.5, 50))]

json.dump(ref, open(os.path.join(HERE, 'referencias.json'), 'w'), indent=1)
print('referencias.json escrito:', len(ref), 'bloques')
