/* ===================================================================
   56-fm-box.js — Pozo infinito y confinamiento (EM.fm.box): niveles, funciones de onda, valores esperados, dinámica por
   superposición (revivals), esfera infinita y puntos cuánticos (fórmula de Brus). Sin DOM; SI salvo aviso.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const X = (fm.box = {});
  const { h, hbar, e, me, c } = K;
  X.E = (n, L, m = me) => (n * n * Math.PI * Math.PI * hbar * hbar) / (2 * m * L * L);          /* J */
  X.psi = (n, x, L) => Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);
  /* Probabilidad de hallar la partícula en [a, b] (a, b en unidades de L): ∫ 2 sen²(nπu) du = (b − a) − [sen(2nπb) − sen(2nπa)]/(2nπ) */
  X.prob = (n, a, b) => (b - a) - (Math.sin(2 * n * Math.PI * b) - Math.sin(2 * n * Math.PI * a)) / (2 * n * Math.PI);
  /* Valores esperados en unidades de L: ⟨x⟩ = 1/2, ⟨x²⟩ = 1/3 − 1/(2n²π²), Δx = L√(1/12 − 1/(2n²π²)), Δp = nπħ/L */
  X.x2 = (n) => 1 / 3 - 1 / (2 * n * n * Math.PI * Math.PI);
  X.dx = (n) => Math.sqrt(1 / 12 - 1 / (2 * n * n * Math.PI * Math.PI));
  X.dpL = (n) => n * Math.PI;                                  /* Δp·L/ħ */
  X.uncertainty = (n) => X.dx(n) * X.dpL(n);                   /* ΔxΔp/ħ */
  /* Dinámica: estado inicial por coeficientes c_n; ψ(x, t) = Σ c_n ψ_n(x) e^{−iE_nt/ħ}. Devuelve {re, im} en x = u·L */
  X.evolve = (cs, u, tt) => {                                  /* tt = t en unidades de ħ/E₁ */
    let re = 0, im = 0;
    for (let n = 1; n <= cs.length; n++) { const f = Math.SQRT2 * Math.sin(n * Math.PI * u), ph = -n * n * tt; re += cs[n - 1] * f * Math.cos(ph); im += cs[n - 1] * f * Math.sin(ph); }
    return { re, im };
  };
  /* Coeficientes de un paquete gaussiano de centro u0 y anchura s (unidades de L) con momento k0 (en 1/L): c_n = ∫ ψ_n(u) ψ₀(u) du por Simpson */
  X.gaussCoeffs = (u0, s, k0, N = 80, M = 4000) => {
    const cs = new Float64Array(N), re = new Float64Array(M + 1), im = new Float64Array(M + 1); let nrm = 0;
    for (let i = 0; i <= M; i++) { const u = i / M, g = Math.exp(-((u - u0) ** 2) / (4 * s * s)); re[i] = g * Math.cos(k0 * u); im[i] = g * Math.sin(k0 * u); }
    for (let i = 0; i <= M; i++) nrm += (re[i] ** 2 + im[i] ** 2) * (i === 0 || i === M ? 0.5 : 1) / M;
    const cr = [], ci = [];
    for (let n = 1; n <= N; n++) { let a = 0, b = 0; for (let i = 0; i <= M; i++) { const u = i / M, f = Math.SQRT2 * Math.sin(n * Math.PI * u) * (i === 0 || i === M ? 0.5 : 1) / M; a += f * re[i]; b += f * im[i]; } cr.push(a / Math.sqrt(nrm)); ci.push(b / Math.sqrt(nrm)); }
    return { cr, ci, N };
  };
  /* Evolución con coeficientes complejos (cr, ci) → densidad |ψ|² en u */
  X.density = (co, u, tt) => {
    let re = 0, im = 0;
    for (let n = 1; n <= co.N; n++) { const f = Math.SQRT2 * Math.sin(n * Math.PI * u), ph = -n * n * tt, c0 = Math.cos(ph), s0 = Math.sin(ph); re += f * (co.cr[n - 1] * c0 - co.ci[n - 1] * s0); im += f * (co.cr[n - 1] * s0 + co.ci[n - 1] * c0); }
    return re * re + im * im;
  };
  /* Tiempo de revival: ħ(E₂ − ... ) → T_rev = 4mL²/(πħ); y periodo de una superposición de n y m: T = 2πħ/(E_m − E_n) */
  X.revivalTime = (L, m = me) => (4 * m * L * L) / (Math.PI * hbar);
  X.beatPeriod = (n, m, L, mass = me) => (2 * Math.PI * hbar) / (X.E(m, L, mass) - X.E(n, L, mass));
  /* Energía del estado l = 0 de una esfera infinita de radio R: ħ²π²/(2mR²) y fórmula de Brus para un punto cuántico semiconductor */
  X.sphereE0 = (R, m = me) => (Math.PI * Math.PI * hbar * hbar) / (2 * m * R * R);
  X.brus = (R, p) => {                                       /* p = {Eg (eV), me, mh (en m_e), eps}; devuelve la energía de la transición (eV) */
    const conf = (Math.PI * Math.PI * hbar * hbar) / (2 * me * R * R) * (1 / p.me + 1 / p.mh) / e, coul = (1.786 * e * e) / (4 * Math.PI * K.eps0 * p.eps * R) / e;
    return p.Eg + conf - coul;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = X;
})(typeof window !== 'undefined' ? window : globalThis);
