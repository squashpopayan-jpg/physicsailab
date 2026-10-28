/* ===================================================================
   39-fq-ads.js — Adsorción: isotermas de Langmuir, Freundlich y BET, determinación de área superficial, calor isostérico y desorción térmica programada.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const A = (FQ.ads = {});
  const R = 8.314462618, NA = 6.02214076e23;
  /* Langmuir: θ = KP/(1 + KP); disociativo: θ = (KP)^½/(1 + (KP)^½); competitivo: θ_i = K_iP_i/(1 + ΣK_jP_j) */
  A.langmuir = (K, P) => (K * P) / (1 + K * P);
  A.langmuirDiss = (K, P) => Math.sqrt(K * P) / (1 + Math.sqrt(K * P));
  A.competitive = (Ks, Ps) => { const s = 1 + Ks.reduce((a, K, i) => a + K * Ps[i], 0); return Ks.map((K, i) => (K * Ps[i]) / s); };
  A.freundlich = (kf, n, P) => kf * Math.pow(P, 1 / n);
  /* K(T) = K₀ exp(ΔH_ads... ) : K = A₀ exp(q/RT) con q > 0 el calor de adsorción */
  A.K = (A0, q, T) => A0 * Math.exp(q / (R * T));
  /* Presión a cobertura θ fija: P = θ/[(1 − θ)K]; calor isostérico q_st = R ln(P₂/P₁)/(1/T₁ − 1/T₂)·(−1) → positivo si P crece con T */
  A.isosteric = (P1, T1, P2, T2) => (R * Math.log(P2 / P1)) / (1 / T1 - 1 / T2);
  /* BET: n/n_m = C x/[(1 − x)(1 + (C − 1)x)], x = P/P₀ */
  A.bet = (C, x) => (C * x) / ((1 - x) * (1 + (C - 1) * x));
  /* Ajuste lineal BET: x/[n(1 − x)] = 1/(n_m C) + (C − 1)x/(n_m C) por mínimos cuadrados; devuelve n_m, C */
  A.betFit = function (xs, ns) {
    const y = xs.map((x, i) => x / (ns[i] * (1 - x))), n = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = y.reduce((a, b) => a + b, 0), sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, x, i) => a + x * y[i], 0);
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n, nm = 1 / (m + b), C = m / b + 1; return { nm, C, slope: m, icpt: b };
  };
  /* Área específica (m²/g) a partir de la monocapa n_m (cm³ STP/g) y el área de la molécula σ (nm²): N₂ a 77 K, σ = 0.162 nm² */
  A.area = (nm_cm3STP, sigma_nm2) => (nm_cm3STP / 22414) * NA * sigma_nm2 * 1e-18;
  A.nmFromArea = (S, sigma_nm2) => (S / (NA * sigma_nm2 * 1e-18)) * 22414;
  /* Desorción térmica programada de primer orden: dθ/dt = −ν θ exp(−E/RT), T = T₀ + βt. Devuelve la curva y T_p */
  A.tpd = function (E, nu, beta, T0, T1) {
    const dT = 0.05, Ts = [], rs = []; let th = 1, T = T0, best = [0, 0];
    while (T < T1 && th > 1e-6) { const k = nu * Math.exp(-E / (R * T)), dth = k * th * (dT / beta); const rate = k * th; Ts.push(T); rs.push(rate); if (rate > best[1]) best = [T, rate]; th = Math.max(0, th - dth); T += dT; }
    return { T: Ts, rate: rs, Tp: best[0] };
  };
  /* Redhead (1962), primer orden: E = RT_p[ln(νT_p/β) − 3.46] */
  A.redhead = (Tp, nu, beta) => R * Tp * (Math.log((nu * Tp) / beta) - 3.46);
  A.redheadTp = (E, nu, beta) => FQ.bisect((T) => A.redhead(T, nu, beta) - E, 50, 3000);

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
