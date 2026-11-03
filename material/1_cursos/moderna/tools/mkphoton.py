# -*- coding: utf-8 -*-
import xraydb, json
els = [('Cr', 24), ('Fe', 26), ('Cu', 29), ('Mo', 42), ('Ag', 47), ('W', 74)]
data = {}
for s, z in els:
    ka = xraydb.xray_line(s, 'Ka1').energy; kb = xraydb.xray_line(s, 'Kb1').energy; edge = xraydb.xray_edge(s, 'K').energy
    data[s] = [z, round(ka, 1), round(kb, 1), round(edge, 1)]
print(json.dumps(data))
js = r"""/* ===================================================================
   53-fm-photon.js — Fotones (EM.fm.ph): sección eficaz de Klein–Nishina, borde Compton, tubo de rayos X (Duane–Hunt, Kramers),
   líneas K, producción de pares. Complementa EM.qm.orig (fotoeléctrico y Compton). Sin DOM; SI salvo aviso (energías en keV cuando se indica).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const P = (fm.ph = {});
  const { h, c, e, me } = K;
  P.re = 2.8179403262e-15;
  P.mc2keV = (me * c * c) / e / 1e3;                     /* 510.999 keV */
  /* Datos de líneas K (eV): [Z, Kα1, Kβ1, borde K]; Elam, Ravel y Sieber (2002), tabulados en xraydb */
  P.KLINES = __DATA__;
  /* ---------- Klein–Nishina ---------- */
  /* Cociente de energías del fotón dispersado k′/k = 1/(1 + ε(1 − cos θ)), ε = E/mc² */
  P.ratio = (eps, th) => 1 / (1 + eps * (1 - Math.cos(th)));
  /* Sección eficaz diferencial por electrón libre [m²/sr] */
  P.kn = (eps, th) => { const r = P.ratio(eps, th); return 0.5 * P.re * P.re * r * r * (r + 1 / r - Math.sin(th) ** 2); };
  /* Sección eficaz total por electrón [m²] (forma cerrada) */
  P.knTotal = (eps) => {
    if (eps < 1e-4) return (8 * Math.PI / 3) * P.re * P.re * (1 - 2 * eps + 5.2 * eps * eps);   /* límite de Thomson con las primeras correcciones */
    const l = Math.log(1 + 2 * eps);
    return 2 * Math.PI * P.re * P.re * (((1 + eps) / (eps * eps)) * ((2 * (1 + eps)) / (1 + 2 * eps) - l / eps) + l / (2 * eps) - (1 + 3 * eps) / Math.pow(1 + 2 * eps, 2));
  };
  P.thomson = () => (8 * Math.PI / 3) * P.re * P.re;
  /* Coeficiente másico de atenuación Compton μ/ρ [cm²/g] = N_A (Z/A) σ_KN con Z/A de un material */
  P.massAtt = (eps, ZoverA) => K.NA * ZoverA * P.knTotal(eps) * 1e4;
  /* Borde Compton: máxima energía cinética del electrón (keV) para un fotón de energía E (keV) */
  P.comptonEdge = (E) => (2 * E * E) / (P.mc2keV + 2 * E);
  P.backscatter = (E) => E / (1 + 2 * E / P.mc2keV);
  /* ---------- Tubo de rayos X ---------- */
  P.lambdaMin = (V) => (h * c) / (e * V);                /* Duane–Hunt (m) para V en voltios */
  /* Espectro continuo de Kramers por longitud de onda (u. arbitrarias): I(λ) ∝ (λ/λ_min − 1)/λ² para λ > λ_min */
  P.kramers = (lam, lmin) => (lam > lmin ? (lam / lmin - 1) / (lam * lam) : 0);
  P.lambdaPeak = (lmin) => 2 * lmin;                     /* máximo de la curva de Kramers: dI/dλ = 0 en λ = 2λ_min */
  P.moseleyKa = (Z) => 0.75 * K.Ry_eV * (Z - 1) ** 2;   /* Kα ≈ (3/4) Ry (Z − 1)² [eV] */
  /* ---------- Pares ---------- */
  P.pairThresholdNucleus = () => 2 * P.mc2keV;           /* keV */
  P.pairThresholdElectron = () => 4 * P.mc2keV;          /* triplete */
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
"""
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\53-fm-photon.js', 'w', encoding='utf-8').write(js.replace('__DATA__', json.dumps(data)))
