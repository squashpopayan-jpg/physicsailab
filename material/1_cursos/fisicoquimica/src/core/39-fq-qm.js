/* ===================================================================
   39-fq-qm.js — Modelos cuánticos solubles: caja, barrera (túnel), oscilador armónico y de Morse, rotor rígido.
   Unidades atómicas (ħ = m_e = e = 4πε₀ = 1) salvo indicación; conversión: 1 Hartree = 27.211386 eV = 2625.4996 kJ/mol = 219474.63 cm⁻¹.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const Q = (FQ.qm = {});
  Q.HARTREE_EV = 27.211386245988; Q.HARTREE_KJ = 2625.4996394799; Q.HARTREE_CM = 219474.6313632; Q.BOHR_A = 0.529177210903; Q.AMU = 1822.888486209; /* m_u/m_e */

  /* Partícula en una caja de ancho L (u.a.): E_n = n²π²/(2mL²), ψ_n = √(2/L) sin(nπx/L) */
  Q.boxE = (n, L, m = 1) => (n * n * Math.PI * Math.PI) / (2 * m * L * L);
  Q.boxPsi = (n, L, x) => Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);

  /* Barrera rectangular de altura V0 y ancho a (u.a.): transmisión exacta */
  Q.tunnelRect = function (E, V0, a, m = 1) {
    if (E <= 0) return 0;
    if (Math.abs(E - V0) < 1e-12 * V0) return 1 / (1 + (m * V0 * a * a) / 2);
    if (E < V0) { const k = Math.sqrt(2 * m * (V0 - E)), s = Math.sinh(k * a); return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E))); }
    const k = Math.sqrt(2 * m * (E - V0)), s = Math.sin(k * a); return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
  };
  /* Barrera parabólica invertida V = V0 − ½mω²x² (Kemble): T(E) = 1/(1 + exp[2π(V0 − E)/ω]) */
  Q.tunnelParab = (E, V0, w) => 1 / (1 + Math.exp((2 * Math.PI * (V0 - E)) / w));
  /* Corrección de túnel de Wigner y de Bell (parabólica) con u = hν‡/k_BT */
  Q.wigner = (u) => 1 + (u * u) / 24;
  Q.bell = (u) => (u < 2 * Math.PI ? u / 2 / Math.sin(u / 2) : Infinity);

  /* Oscilador armónico (u.a.): E_v = ω(v + ½); funciones de Hermite normalizadas ψ_v(x) con x en bohr */
  Q.hoE = (v, w) => w * (v + 0.5);
  Q.hoPsi = function (v, m, w, x) {
    const y = Math.sqrt(m * w) * x; let p0 = Math.pow((m * w) / Math.PI, 0.25) * Math.exp(-0.5 * y * y), p1 = Math.SQRT2 * y * p0;
    if (v === 0) return p0; for (let n = 1; n < v; n++) { const p2 = Math.sqrt(2 / (n + 1)) * y * p1 - Math.sqrt(n / (n + 1)) * p0; p0 = p1; p1 = p2; } return p1;
  };
  /* Oscilador de Morse V = D(1 − e^{−a(r − re)})²: E_v = ω(v + ½) − [ω(v + ½)]²/(4D), ω = a√(2D/μ) (u.a.), v ≤ v_max */
  Q.morseOmega = (D, a, mu) => a * Math.sqrt((2 * D) / mu);
  Q.morseE = (v, D, a, mu) => { const w = Q.morseOmega(D, a, mu), x = w * (v + 0.5); return x - (x * x) / (4 * D); };
  Q.morseVmax = (D, a, mu) => Math.floor(Q.morseOmega(D, a, mu) > 0 ? (2 * D) / Q.morseOmega(D, a, mu) - 0.5 : 0);


  /* Función de onda de Morse (u.a.): λ = √(2μD)/a, ψ_v(r) ∝ z^{λ−v−½} e^{−z/2} L_v^{(2λ−2v−1)}(z), z = 2λ e^{−a(r−re)}; normalizada por cuadratura (trapecio) en [r1, r2] */
  Q.laguerre = (n, al, x) => { if (n === 0) return 1; let l0 = 1, l1 = 1 + al - x; for (let k = 1; k < n; k++) { const l2 = ((2 * k + 1 + al - x) * l1 - (k + al) * l0) / (k + 1); l0 = l1; l1 = l2; } return l1; };
  Q.morsePsi = function (v, D, a, mu, re, rs) {
    const lam = Math.sqrt(2 * mu * D) / a, raw = (r) => { const z = 2 * lam * Math.exp(-a * (r - re)); return Math.pow(z, lam - v - 0.5) * Math.exp(-z / 2) * Q.laguerre(v, 2 * lam - 2 * v - 1, z); };
    let s = 0; for (let i = 0; i < rs.length - 1; i++) { const f0 = raw(rs[i]), f1 = raw(rs[i + 1]); s += 0.5 * (f0 * f0 + f1 * f1) * (rs[i + 1] - rs[i]); }
    const nrm = 1 / Math.sqrt(s), sgn = raw(re) < 0 ? 1 : 1; return rs.map((r) => nrm * sgn * raw(r));
  };

  /* Rotor rígido: E_J = B J(J+1), degeneración 2J+1; población relativa ∝ (2J+1) exp(−BJ(J+1)/kT) */
  Q.rotPop = (J, B, kT) => (2 * J + 1) * Math.exp((-B * J * (J + 1)) / kT);
  Q.rotJmax = (B, kT) => Math.sqrt(kT / (2 * B)) - 0.5;
  /* Funciones de Legendre asociadas y armónicos esféricos reales (m ≥ 0: coseno; m < 0: seno) */
  Q.plm = function (l, m, x) {
    m = Math.abs(m); let pmm = 1; if (m > 0) { const s = Math.sqrt((1 - x) * (1 + x)); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
    if (l === m) return pmm; let pm1 = x * (2 * m + 1) * pmm; if (l === m + 1) return pm1;
    let pl = 0; for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * pm1 - (ll + m - 1) * pmm) / (ll - m); pmm = pm1; pm1 = pl; } return pl;
  };
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  Q.ylmReal = function (l, m, th, ph) {
    const am = Math.abs(m), N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (fact(l - am) / fact(l + am))), P = Q.plm(l, am, Math.cos(th));
    return m === 0 ? N * P : Math.SQRT2 * N * P * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph));
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
