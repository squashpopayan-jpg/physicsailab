"""Valores de referencia independientes para validar el núcleo de cálculo (src/lib).

Usa numpy-financial (las mismas convenciones de Excel), SciPy y la hoja original de
A. Damodaran (docs/fuentes/histretSP.xls, leída de nuevo aquí, sin pasar por 80-datos.js).
Escribe src/lib/85-ref.js. Uso: python tests/referencias.py
"""
import json, math, os
import numpy as np
import numpy_financial as npf
import pandas as pd
import scipy
from scipy import optimize, stats

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref = {}

# ---------- 6 · Interés compuesto ----------
ref["fv1"] = float(npf.fv(0.01, 120, -100000, -1_000_000))
ref["fv1b"] = float(npf.fv(0.01, 120, -100000, -1_000_000, when="begin"))
ref["dup8"] = math.log(2) / math.log(1.08)

# ---------- 7 · Tasas ----------
ref["usura_mv"] = 1.2859 ** (1 / 12) - 1
ref["nom24"] = 1.02 ** 12 - 1
ref["real10"] = 1.10 / 1.051 - 1
# Crédito de 10 millones a 36 meses al 1,8 % mensual con 2 % de comisión inicial,
# seguro de 0,1 % mensual sobre el saldo y cuota de manejo de 15.000
P, im, n = 10_000_000, 0.018, 36
cuota = -npf.pmt(im, n, P)
flows = [P * (1 - 0.02)]
saldo = P
for k in range(n):
    seg = 0.001 * saldo
    saldo -= cuota - saldo * im
    flows.append(-(cuota + seg + 15000))
ref["costo_tir"] = float(npf.irr(flows))

# ---------- 9 · Valor del dinero en el tiempo ----------
ref["pv1"] = float(npf.pv(0.008, 60, -450000, 0))
ref["pmt1"] = float(npf.pmt(0.012, 48, 25_000_000))
ref["nper1"] = float(npf.nper(0.015, -300000, 5_000_000))
ref["rate1"] = float(npf.rate(24, -520000, 10_000_000, 0))
ref["rate2"] = float(npf.rate(60, -200000, 0, 15_000_000))
cf = [-30_000_000, 6_000_000, 8_000_000, 9_000_000, 10_000_000, 12_000_000]
ref["npv1"] = float(npf.npv(0.11, cf))
ref["irr1"] = float(npf.irr(cf))
ref["npvx"] = float(sum(v / 1.11 ** (k + 1) for k, v in enumerate(cf)))

# ---------- 10 · Créditos ----------
P, im, n = 80_000_000, 0.011, 180
per = np.arange(1, n + 1)
ref["fr_int"] = float(-npf.ipmt(im, per, n, P).sum())
ref["fr_i12"] = float(-npf.ipmt(im, 12, n, P))
ref["fr_c12"] = float(-npf.ppmt(im, 12, n, P))
ref["de_int"] = im * P * (n + 1) / 2

# ---------- 13 · Seguros (utilidad logarítmica) ----------
W, X, p = 20_000_000, 15_000_000, 0.02
U = p * math.log(W - X) + (1 - p) * math.log(W)
ref["ec_sin"] = math.exp(U)
ref["prima_max"] = optimize.brentq(lambda pi: math.log(W - pi) - U, 0, W - 1, xtol=1e-9)

# ---------- 14 · Deudas ----------
def min_payment(s, im, pct, piso):
    k, pag, it = 0, 0.0, 0.0
    while s > 0.5 and k < 1200:
        k += 1
        i = s * im; s += i; it += i
        pago = min(s, max(piso, pct * s))
        s -= pago; pag += pago
    return k, pag, it
k, pag, it = min_payment(3_000_000, 0.021, 0.05, 50000)
ref["pm_meses"], ref["pm_int"] = k, it

def plan(deudas, B, estr):
    ds = [dict(d) for d in deudas]
    mes, ti = 0, 0.0
    while any(d["saldo"] > 0.5 for d in ds) and mes < 600:
        mes += 1
        for d in ds:
            if d["saldo"] > 0:
                i = d["saldo"] * d["im"]; d["saldo"] += i; ti += i
        caja = B
        for d in ds:
            if d["saldo"] > 0:
                p = min(d["saldo"], d["min"], caja); d["saldo"] -= p; caja -= p
        vivos = [d for d in ds if d["saldo"] > 0.5]
        key = (lambda d: (d["saldo"], -d["im"])) if estr == "bola" else (lambda d: (-d["im"], d["saldo"]))
        for d in sorted(vivos, key=key):
            if caja <= 0: break
            p = min(d["saldo"], caja); d["saldo"] -= p; caja -= p
        for d in ds:
            if d["saldo"] <= 0.5: d["saldo"] = 0
    return mes, ti
DEUDAS = [dict(saldo=4_500_000, im=0.026, min=180000), dict(saldo=1_200_000, im=0.019, min=60000),
          dict(saldo=9_000_000, im=0.014, min=310000), dict(saldo=600_000, im=0.03, min=40000)]
ref["av_meses"], ref["av_int"] = plan(DEUDAS, 1_000_000, "avalancha")
ref["bo_meses"], ref["bo_int"] = plan(DEUDAS, 1_000_000, "bola")
g = [-1_000_000] + [1_200_000 / 30] * 30
ref["gota_ea"] = (1 + float(npf.irr(g))) ** 365 - 1

# ---------- 15 · Impuesto de renta (art. 241 E.T.) ----------
def renta(b):
    tabla = [(0, 1090, 0, 0), (1090, 1700, .19, 0), (1700, 4100, .28, 116), (4100, 8670, .33, 788),
             (8670, 18970, .35, 2296), (18970, 31000, .37, 5901), (31000, math.inf, .39, 10352)]
    for a, c, t, acc in tabla:
        if a < b <= c: return acc + (b - a) * t
    return 0
ref["renta"] = [renta(b) for b in (1000, 1500, 2000, 5000, 10000, 20000, 40000)]

# ---------- 16-17 · Datos históricos (hoja original de Damodaran) ----------
d = pd.read_excel(os.path.join(ROOT, "docs", "fuentes", "histretSP.xls"), "Returns by year", header=None)
rows = d.iloc[20:118]
sp, tb, bo, inf = [rows[c].astype(float).to_numpy() for c in (1, 3, 4, 20)]
ref["dam_sp_arit"] = float(d.iloc[120, 1])
ref["dam_sp_geo"] = float(d.iloc[125, 1])
ref["dam_tb_geo"] = float(d.iloc[125, 3])
ref["dam_bo_geo"] = float(d.iloc[125, 4])
ref["dam_sp_real_geo"] = float(d.iloc[125, 21])
ref["sp_sd"] = float(np.std(sp, ddof=1))
ref["corr_sp_bo"] = float(np.corrcoef(sp, bo)[0, 1])
v = np.cumprod(1 + sp); peak = np.maximum.accumulate(np.concatenate([[1.0], v]))
ref["sp_mdd"] = float(np.min(np.concatenate([[1.0], v]) / peak - 1))
# volatilidad de 10 activos con σ = 0,3 y ρ = 0,25 en partes iguales: √(wᵀΣw)
S = np.full((10, 10), 0.25 * 0.09); np.fill_diagonal(S, 0.09); w = np.full(10, 0.1)
ref["sigma10"] = float(np.sqrt(w @ S @ w))
res = optimize.minimize_scalar(lambda x: x**2 * .2**2 + (1 - x)**2 * .07**2 + 2 * x * (1 - x) * .1 * .2 * .07, bounds=(0, 1), method="bounded", options={"xatol": 1e-12})
ref["wmin"] = float(res.x)
ref["z975"] = float(stats.norm.ppf(0.975))
ref["Phi1"] = float(stats.norm.cdf(1.0))

# ---------- 18 · Bonos ----------
ref["bono_p"] = float(-npf.pv(0.11 / 2, 20, 1000 * 0.09 / 2, 1000))
t = np.arange(1, 21) / 2; c = np.full(20, 45.0); c[-1] += 1000; dfac = (1 + 0.055) ** -np.arange(1, 21)
ref["bono_mac"] = float((t * c * dfac).sum() / (c * dfac).sum())

# ---------- 20 · Kelly ----------
ref["kelly"] = float(optimize.minimize_scalar(lambda f: -(0.55 * math.log(1 + 1.5 * f) + 0.45 * math.log(1 - f)), bounds=(0, 0.99), method="bounded", options={"xatol": 1e-12}).x)

# ---------- 3 · Teoría prospectiva ----------
def val(x, a=.88, lam=2.25): return x ** a if x >= 0 else -lam * (-x) ** a
def wgt(p, g): return p ** g / (p ** g + (1 - p) ** g) ** (1 / g)
ref["w01"] = wgt(0.01, 0.61)
ref["mingain"] = optimize.brentq(lambda G: wgt(.5, .61) * val(G) + wgt(.5, .69) * val(-100), 1, 5000, xtol=1e-10)

# ---------- 23 · Retiro: regla del 4 % con datos históricos ----------
def trinity(wr, ws, N):
    ok = tot = 0
    for s in range(0, len(sp) - N + 1):
        W, ret, good = 1.0, wr, True
        for k in range(N):
            W -= ret
            if W <= 0: good = False; break
            W *= 1 + ws * sp[s + k] + (1 - ws) * bo[s + k]
            ret *= 1 + inf[s + k]
        ok += good; tot += 1
    return ok / tot
ref["tri_4_50"] = trinity(0.04, 0.5, 30)
ref["tri_4_75"] = trinity(0.04, 0.75, 30)
ref["tri_5_50"] = trinity(0.05, 0.5, 30)

# ---------- 24 · Independencia financiera ----------
s, r, wr = 0.5, 0.05, 0.04
ref["fi50"] = optimize.brentq(lambda n: s * ((1 + r) ** n - 1) / r - (1 - s) / wr, 0.1, 200, xtol=1e-12)

out = {"versions": {"numpy_financial": npf.__version__, "numpy": np.__version__, "scipy": scipy.__version__, "pandas": pd.__version__},
       "ref": ref}
js = ("/* lib/85-ref.js — Valores de referencia generados por tests/referencias.py (no editar a mano). */\n"
      "(function (root) {\n  'use strict';\n  const CC = (root.CC = root.CC || {});\n  const L = (CC.L = CC.L || {});\n"
      "  L.REF = " + json.dumps(out, ensure_ascii=False) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(ROOT, "src", "lib", "85-ref.js"), "w", encoding="utf-8").write(js)
print("ok", len(ref), "referencias")
for k, v in ref.items():
    print(f"  {k:12s} {v}")
