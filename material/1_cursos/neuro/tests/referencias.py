"""Valores de referencia independientes para validar el núcleo de cálculo (src/lib).

Cada modelo se vuelve a programar aquí desde sus ecuaciones publicadas, con NumPy y SciPy
(integradores de paso adaptativo, distribuciones exactas, ajuste no lineal), sin leer el
código JavaScript. Escribe src/lib/85-ref.js. Uso: python tests/referencias.py
"""
import json, math, os
import numpy as np
import scipy
from scipy import integrate, optimize, stats, special

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref = {}
data = {}

# ---------------- 2 · Hodgkin-Huxley (1952), convención moderna ----------------
gNa, gK, gL, ENa, EK, EL = 120.0, 36.0, 0.3, 50.0, -77.0, -54.387
def am(V): x = V + 40; return 1.0 if abs(x) < 1e-7 else 0.1 * x / (1 - math.exp(-x / 10))
def bm(V): return 4 * math.exp(-(V + 65) / 18)
def ah(V): return 0.07 * math.exp(-(V + 65) / 20)
def bh(V): return 1 / (1 + math.exp(-(V + 35) / 10))
def an(V): x = V + 55; return 0.1 if abs(x) < 1e-7 else 0.01 * x / (1 - math.exp(-x / 10))
def bn(V): return 0.125 * math.exp(-(V + 65) / 80)
def rest(V=-65.0):
    return [V, am(V) / (am(V) + bm(V)), ah(V) / (ah(V) + bh(V)), an(V) / (an(V) + bn(V))]
def hh(t, y, I):
    V, m, h, n = y
    return [I(t) - gNa * m**3 * h * (V - ENa) - gK * n**4 * (V - EK) - gL * (V - EL),
            am(V) * (1 - m) - bm(V) * m, ah(V) * (1 - h) - bh(V) * h, an(V) * (1 - n) - bn(V) * n]
def spikes(I, T, max_step=0.02):
    ev = lambda t, y, I: y[0]
    ev.direction = 1
    s = integrate.solve_ivp(hh, (0, T), rest(), args=(I,), method="RK45", rtol=1e-9, atol=1e-9, max_step=max_step, events=ev)
    return s.t_events[0]
def rate(Ival, T=500, tA=100):
    sp = [t for t in spikes(lambda t: Ival, T) if t >= tA]
    return 0.0 if len(sp) < 2 else 1000 * (len(sp) - 1) / (sp[-1] - sp[0])
ref["hh_rate10"] = rate(10.0)
ref["hh_rate20"] = rate(20.0)
ref["hh_pulse"] = float(spikes(lambda t: 20.0 if 5 < t < 6 else 0.0, 50, 0.005)[0])
# corriente mínima para disparo repetitivo (bisección sobre la frecuencia sostenida)
lo, hi = 5.5, 7.0
for _ in range(14):
    mid = 0.5 * (lo + hi)
    if rate(mid, 600, 300) > 0: hi = mid
    else: lo = mid
ref["hh_onset"] = 0.5 * (lo + hi)

# ---------------- 2 · Nernst y Goldman-Hodgkin-Katz (37 °C) ----------------
from scipy import constants as cst
RTF = cst.R * (37 + 273.15) / cst.physical_constants["Faraday constant"][0] * 1000
ref["nernst_K"] = RTF * math.log(5 / 140)
ref["nernst_Na"] = RTF * math.log(145 / 12)
ref["ghk"] = RTF * math.log((1 * 5 + 0.05 * 145 + 0.45 * 7) / (1 * 140 + 0.05 * 12 + 0.45 * 110))

# ---------------- 2 · LIF: frecuencia analítica ----------------
tau, ELl, Vth, Vr, R, tref = 10.0, -65.0, -50.0, -65.0, 10.0, 2.0
Vinf = ELl + R * 2.0
ref["lif_rate2"] = 1000 / (tref + tau * math.log((Vinf - Vr) / (Vinf - Vth)))

# ---------------- 29 · Cable de Hodgkin-Huxley (mismo esquema de diferencias finitas) ----------------
def cable_velocity(n=60, dx=0.1, a=0.0238, Ri=35.4, dt=0.005, T=6.0, block=None):
    gc = 1000 * a / (2 * Ri * dx * dx)
    r = rest()
    V = np.full(n, r[0]); m = np.full(n, r[1]); h = np.full(n, r[2]); nn = np.full(n, r[3])
    blk = np.zeros(n) if block is None else block
    cross = np.full(n, np.nan)
    t = 0.0
    vam, vbm, vah, vbh, van, vbn = (np.vectorize(f) for f in (am, bm, ah, bh, an, bn))
    while t < T:
        left = np.concatenate([[V[0]], V[:-1]]); right = np.concatenate([V[1:], [V[-1]]])
        Iax = gc * (left - 2 * V + right)
        Iion = gNa * (1 - blk) * m**3 * h * (V - ENa) + gK * nn**4 * (V - EK) + gL * (V - EL)
        Iext = np.zeros(n)
        if t < 0.5: Iext[0] = 200.0
        dV = (Iax - Iion + Iext)
        A_m, B_m, A_h, B_h, A_n, B_n = vam(V), vbm(V), vah(V), vbh(V), van(V), vbn(V)
        m = m + dt * (A_m * (1 - m) - B_m * m)
        h = h + dt * (A_h * (1 - h) - B_h * h)
        nn = nn + dt * (A_n * (1 - nn) - B_n * nn)
        Vn = V + dt * dV
        up = np.isnan(cross) & (V < 0) & (Vn >= 0)
        cross[up] = t + dt * (0 - V[up]) / (Vn[up] - V[up])
        V = Vn
        t += dt
    i1, i2 = round(n * 0.2), round(n * 0.45)
    return (i2 - i1) * dx * 0.01 / ((cross[i2] - cross[i1]) * 1e-3), cross
ref["cable_v"], _ = cable_velocity()

# ---------------- 4 · Regla de Oja: vector propio principal ----------------
C = np.array([[1.0, 0.6 * 1 * 0.5], [0.6 * 1 * 0.5, 0.25]])
w, v = np.linalg.eigh(C)
ref["oja_v1"] = [float(abs(v[0, 1])), float(abs(v[1, 1]) * np.sign(v[0, 1] * v[1, 1]))]

# ---------------- 5 · Hopfield: probabilidad de bit inestable ----------------
ref["hop_err_100_14"] = 0.5 * (1 - special.erf(math.sqrt(100 / (2 * 14))))
ref["hop_err_200_30"] = 0.5 * (1 - special.erf(math.sqrt(200 / (2 * 30))))

# ---------------- 7 · Rescorla-Wagner y diferencias temporales ----------------
ref["rw10"] = 1 - (1 - 0.3) ** 10
ref["td_exact"] = [0.98 ** (15 - t) for t in range(5, 16)]

# ---------------- 8 · Integración óptima de señales ----------------
sV, sH = 2.0, 1.0
ref["cue_s"] = math.sqrt(sV**2 * sH**2 / (sV**2 + sH**2))
ref["cue_wV"] = (1 / sV**2) / (1 / sV**2 + 1 / sH**2)

# ---------------- 5 · Pavlik y Anderson (2005) ----------------
def pa_recall(times, t, c=0.217, a=0.177, tau=-0.704, s=0.255):
    d = []
    for j in range(len(times)):
        if j == 0: m = -math.inf
        else: m = math.log(sum((times[j] - times[k]) ** (-d[k]) for k in range(j)))
        d.append(c * math.exp(m) + a)
    m = math.log(sum((t - times[k]) ** (-d[k]) for k in range(len(times))))
    return 1 / (1 + math.exp((tau - m) / s))
ref["pa_masivo"] = pa_recall([0, 10, 20, 30], 30 + 86400 * 7)
ref["pa_espaciado"] = pa_recall([0, 86400, 2 * 86400, 3 * 86400], 3 * 86400 + 86400 * 7)

# ---------------- 1 · Evidencia ----------------
mu, sd, c = 5.0, 1.8, 7.0
ref["truncmean"] = float(stats.truncnorm.mean((c - mu) / sd, np.inf, loc=mu, scale=sd))
ref["tcdf_2_10"] = float(stats.t.cdf(2.0, 10))
ref["tcdf_m13_45"] = float(stats.t.cdf(-1.3, 4.5))
d, n = 0.5, 64
df = 2 * n - 2; nc = d * math.sqrt(n / 2); tc = stats.t.ppf(0.975, df)
ref["power_exact"] = float(1 - stats.nct.cdf(tc, df, nc) + stats.nct.cdf(-tc, df, nc))
xa = [5.1, 6.3, 4.8, 7.2, 6.0, 5.5, 6.8, 5.9]; xb = [4.2, 5.0, 4.9, 3.8, 5.6, 4.4, 4.0]
data["welch_a"], data["welch_b"] = xa, xb
tt = stats.ttest_ind(xa, xb, equal_var=False)
ref["welch_t"], ref["welch_p"] = float(tt.statistic), float(tt.pvalue)
ref["nnt05"] = 1 / (2 * stats.norm.cdf(0.5 / math.sqrt(2)) - 1)
ref["dprime"] = float(stats.norm.ppf(0.8) - stats.norm.ppf(0.3))
ref["binom_60_100"] = float(stats.binomtest(60, 100, 0.5).pvalue)
ref["binom_9_12"] = float(stats.binomtest(9, 12, 0.5).pvalue)
# Metaanálisis: datos BCG (Colditz y otros, 1994; conjunto dat.bcg del paquete metafor)
bcg = np.array([[4,119,11,128],[6,300,29,274],[3,228,11,209],[62,13536,248,12619],[33,5036,47,5761],[180,1361,372,1079],[8,2537,10,619],[505,87886,499,87892],[29,7470,45,7232],[17,1699,65,1600],[186,50448,141,27197],[5,2493,3,2338],[27,16886,29,17825]], float)
a_, b_, c_, d_ = bcg.T
yi = np.log((a_ / (a_ + b_)) / (c_ / (c_ + d_))); vi = 1 / a_ - 1 / (a_ + b_) + 1 / c_ - 1 / (c_ + d_)
data["bcg_y"], data["bcg_v"] = yi.tolist(), vi.tolist()
wi = 1 / vi; yf = (wi * yi).sum() / wi.sum(); Q = (wi * (yi - yf) ** 2).sum()
tau2 = max(0.0, (Q - 12) / (wi.sum() - (wi**2).sum() / wi.sum()))
ws = 1 / (vi + tau2)
ref["dl_mu"] = float((ws * yi).sum() / ws.sum()); ref["dl_tau2"] = float(tau2); ref["dl_Q"] = float(Q)
ref["dl_se"] = float(math.sqrt(1 / ws.sum()))
lr = stats.linregress(1 / np.sqrt(vi), yi / np.sqrt(vi))
ref["egger_int"] = float(lr.intercept)

# ---------------- 15 · Curva de Lally: ajuste no lineal ----------------
rng = np.random.default_rng(15)
ts = np.arange(0, 85, 3, dtype=float)
ys = np.clip(5.6 - 4.1 * np.exp(-0.045 * ts) + 0.3 * rng.standard_normal(ts.size), 1, 7)
data["lally_t"], data["lally_y"] = ts.tolist(), ys.tolist()
p, _ = optimize.curve_fit(lambda t, a, b, c: a - b * np.exp(-c * t), ts, ys, p0=[6, 4, 0.05], maxfev=20000)
ref["lally_p"] = p.tolist()
ref["lally_t95"] = float(math.log(p[1] / (0.05 * p[0])) / p[2])

# ---------------- 19 · Curvas de aprendizaje ----------------
Ns = np.arange(1, 121, dtype=float)
Tobs = 2.0 + 6.0 * Ns ** -0.6 + 0.08 * np.sin(Ns)
data["lc_N"], data["lc_T"] = Ns.tolist(), Tobs.tolist()
pp, _ = optimize.curve_fit(lambda N, a, b, c: a + b * N ** (-c), Ns, Tobs, p0=[1.6, 6.4, 0.5], maxfev=20000)
pe, _ = optimize.curve_fit(lambda N, a, b, c: a + b * np.exp(-c * N), Ns, Tobs, p0=[2.0, 6.0, 0.05], maxfev=20000)
ref["lc_pow"], ref["lc_exp"] = pp.tolist(), pe.tolist()

# ---------------- 19 · Adaptación motora de dos estados ----------------
pert = [1.0] * 200 + [-1.0] * 6 + [None] * 100
xf = xs = 0.0; X = []
for f in pert:
    X.append(xf + xs)
    e = 0.0 if f is None else f - (xf + xs)
    xf, xs = 0.92 * xf + 0.1 * e, 0.996 * xs + 0.02 * e
ref["ts_200"], ref["ts_206"], ref["ts_246"] = X[199], X[205], X[245]

# ---------------- 21 · Banister y Foster ----------------
week = [1, 0.6, 1, 0, 1, 0.8, 0]
loads = [400 * f for _ in range(10) for f in week]
data["ban_loads"] = loads
t = np.arange(len(loads) + 1)
g = np.array([sum(loads[s] * math.exp(-(k - s) / 42) for s in range(k)) for k in t])
h = np.array([sum(loads[s] * math.exp(-(k - s) / 7) for s in range(k)) for k in t])
ref["ban_p70"] = float(g[70] - 2 * h[70])
ref["ban_g70"] = float(g[70])
wk = np.array([300, 420, 0, 380, 300, 520, 0], float)
ref["foster_mono"] = float(wk.mean() / wk.std(ddof=0)); ref["foster_strain"] = float(wk.sum() * wk.mean() / wk.std(ddof=0))

# ---------------- 23 · Energía: Mifflin, Deurenberg y modelo de Hall (2011) ----------------
ref["mifflin_h"] = 10 * 95 + 6.25 * 175 - 5 * 40 + 5
ref["mifflin_m"] = 10 * 68 + 6.25 * 162 - 5 * 33 - 161
ref["deur_h"] = 1.2 * (95 / 1.75**2) + 0.23 * 40 - 10.8 - 5.4
KJ = 4.184
rhoF, rhoL, rhoG = 39.5e3, 7.6e3, 17.6e3
gF, gLm, etaF, etaL, bTEF, bAT, tAT = 13.0, 92.0, 750.0, 960.0, 0.1, 0.14, 14.0
G0, agua, NaC, xiNa, xiCI, Cf = 0.5, 2.7, 3.22, 3000.0, 4000.0, 10.4
def hall(sexo, edad, talla, peso, pal, dEIkcal, dias, carb0=0.5, carb=0.5):
    H = talla / 100; bmi = peso / H**2
    pct = 1.2 * bmi + 0.23 * edad - 10.8 * (1 if sexo == "h" else 0) - 5.4
    F0 = peso * pct / 100; ECF0 = 0.235 * peso; L0 = peso - F0 - ECF0 - G0 * (1 + agua)
    RMR = (10 * peso + 6.25 * talla - 5 * edad + (5 if sexo == "h" else -161)) * KJ
    EI0 = pal * RMR; delta = ((1 - bTEF) * pal - 1) * RMR / peso
    K = EI0 - gF * F0 - gLm * L0 - delta * peso
    CIb = carb0 * EI0; kG = CIb / G0**2
    EI = EI0 + dEIkcal * KJ; CI = carb * EI
    Cc = Cf * rhoL / rhoF
    def f(t, y):
        F, Lm, G, ECF, AT = y
        dG = (CI - kG * G * G) / rhoG
        dECF = (0 - xiNa * (ECF - ECF0) - xiCI * (1 - CI / CIb)) / (NaC * 1000)
        BW = F + Lm + G * (1 + agua) + ECF
        p = Cc / (Cc + F)
        aa = etaF / rhoF * (1 - p) + etaL / rhoL * p
        EE = (K + gF * F + gLm * Lm + delta * BW + bTEF * (EI - EI0) + AT + aa * (EI - rhoG * dG)) / (1 + aa)
        bal = EI - EE - rhoG * dG
        return [(1 - p) * bal / rhoF, p * bal / rhoL, dG, dECF, (bAT * (EI - EI0) - AT) / tAT]
    sol = integrate.solve_ivp(f, (0, dias), [F0, L0, G0, ECF0, 0.0], method="LSODA", rtol=1e-10, atol=1e-10, dense_output=True)
    def BW(tq):
        F, Lm, G, ECF, AT = sol.sol(tq)
        return float(F + Lm + G * (1 + agua) + ECF)
    return BW, sol
BWf, _ = hall("h", 40, 175, 95, 1.6, -500, 1095)
ref["hall_30"], ref["hall_180"], ref["hall_365"], ref["hall_1095"] = BWf(30), BWf(180), BWf(365), BWf(1095)
BWl, _ = hall("h", 40, 175, 95, 1.6, -500, 30, 0.5, 0.1)
ref["hall_lowcarb_7"] = BWl(7)
BWs, _ = hall("h", 40, 175, 95, 1.6, -100 / KJ, 4000)   # −100 kJ/día
ref["hall_steady_100kJ"] = BWs(4000) - 95
ref["frayn"] = [4.55 * 2.8 - 3.21 * 3.0, 1.67 * 3.0 - 1.67 * 2.8]

# ---------------- 18 · Tendencias: regresión y Kalman ----------------
rng = np.random.default_rng(18)
yy = 90 - 0.5 / 7 * np.arange(60) + 0.6 * rng.standard_normal(60)
data["tend_y"] = yy.tolist()
lr = stats.linregress(np.arange(60), yy)
tq = stats.t.ppf(0.975, 58)
ref["ols_b"], ref["ols_hi"] = float(lr.slope), float(lr.slope + tq * lr.stderr)
# Kalman de tendencia lineal local (mismas matrices)
x = np.array([yy[0], 0.0]); P = np.array([[1.0, 0.0], [0.0, 0.01]])
Fm = np.array([[1.0, 1.0], [0.0, 1.0]]); Qm = np.diag([0.01, 1e-5]); Hm = np.array([[1.0, 0.0]]); Rm = 0.36
for k in range(60):
    if k > 0:
        x = Fm @ x; P = Fm @ P @ Fm.T + Qm
    S = (Hm @ P @ Hm.T)[0, 0] + Rm; Kg = (P @ Hm.T)[:, 0] / S
    x = x + Kg * (yy[k] - x[0]); P = P - np.outer(Kg, Hm @ P)
ref["kal_lvl"], ref["kal_slope"] = float(x[0]), float(x[1])

out = {"versions": {"numpy": np.__version__, "scipy": scipy.__version__}, "ref": ref, "data": data}
js = ("/* lib/85-ref.js — Valores de referencia generados por tests/referencias.py (no editar a mano). */\n"
      "(function (root) {\n  'use strict';\n  const RC = (root.RC = root.RC || {});\n  const L = (RC.L = RC.L || {});\n"
      "  L.REF = " + json.dumps(out, ensure_ascii=False) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "85-ref.js"), "w", encoding="utf-8").write(js)
print("ok", len(ref), "referencias")
for k, v in ref.items():
    print(f"  {k:18s} {v}")
