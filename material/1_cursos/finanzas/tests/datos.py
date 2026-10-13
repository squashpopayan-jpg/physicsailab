"""Genera src/lib/80-datos.js a partir de las fuentes guardadas en docs/fuentes/.

- histretSP.xls: A. Damodaran, «Historical Returns on Stocks, Bonds and Bills» (actualizado 2026-01-01),
  rentabilidades anuales en dólares de EE. UU., 1928-2025.
- FP.CPI.TOTL.ZG.json, PA.NUS.FCRF.json, FP.CPI.TOTL.json: Banco Mundial (indicadores del desarrollo mundial,
  actualizados 2026-07-13) para Colombia: inflación promedio anual del IPC, tasa de cambio oficial promedio
  (pesos por dólar) e índice de precios al consumidor (2010 = 100).
Uso: python tests/datos.py
"""
import json, os
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, "docs", "fuentes")
d = pd.read_excel(os.path.join(F, "histretSP.xls"), "Returns by year", header=None)
rows = d.iloc[20:118]
assert int(rows.iloc[0, 0]) == 1928 and int(rows.iloc[-1, 0]) == 2025
r5 = lambda v: round(float(v), 6)
us = {
    "years": [int(v) for v in rows[0]],
    "sp500": [r5(v) for v in rows[1]],
    "smallcap": [r5(v) for v in rows[2]],
    "tbill": [r5(v) for v in rows[3]],
    "tbond": [r5(v) for v in rows[4]],
    "baa": [r5(v) for v in rows[5]],
    "realestate": [r5(v) for v in rows[6]],
    "gold": [r5(v) for v in rows[7]],
    "inflation": [r5(v) for v in rows[20]],
}
co = {}
for key, fn in [("infl", "FP.CPI.TOTL.ZG.json"), ("usdcop", "PA.NUS.FCRF.json"), ("ipc", "FP.CPI.TOTL.json")]:
    pairs = json.load(open(os.path.join(F, fn)))
    co["years"] = [p[0] for p in pairs]
    co[key] = [round(p[1], 4) for p in pairs]
js = """/* ===================================================================
   lib/80-datos.js — Datos históricos reales (generado por tests/datos.py; no editar a mano).
   EE. UU. 1928-2025: A. Damodaran, NYU Stern, «Historical Returns on Stocks, Bonds and Bills»,
   actualización del 1 de enero de 2026. Rentabilidades anuales totales en dólares (fracciones):
   S&P 500 con dividendos, acciones pequeñas (decil inferior), letras del Tesoro a 3 meses,
   bonos del Tesoro a 10 años, bonos corporativos Baa, vivienda (índice Case-Shiller), oro e inflación (IPC).
   Colombia 1960-2025: Banco Mundial (WDI, 13 de julio de 2026): inflación promedio anual del IPC (%),
   tasa de cambio oficial promedio (pesos por dólar) e IPC (2010 = 100).
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  L.DATA = { us: @US@, co: @CO@ };
})(typeof window !== 'undefined' ? window : globalThis);
""".replace("@US@", json.dumps(us, separators=(",", ":"))).replace("@CO@", json.dumps(co, separators=(",", ":")))
open(os.path.join(ROOT, "src", "lib", "80-datos.js"), "w", encoding="utf-8").write(js)
print("ok", len(us["years"]), "años EE. UU.,", len(co["years"]), "años Colombia")
