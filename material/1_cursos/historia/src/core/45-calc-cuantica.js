(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  C.HBAR = K.h / (2 * PI);
  /* de Broglie: λ = h/√(2mE) para energía cinética E en eV */
  C.deBroglieNm = (EeV, m) => (K.h / Math.sqrt(2 * (m || K.me) * EeV * K.e)) * 1e9;
  /* Davisson–Germer: pico de orden 1 con espaciado superficial d (nm): λ = d sen φ */
  C.davissonAngle = (EeV, dNm) => { const s = C.deBroglieNm(EeV) / dNm; return Math.abs(s) <= 1 ? Math.asin(s) : NaN; };
  /* Pozo infinito, oscilador */
  C.boxE = (n, L, m) => (n * n * PI * PI * C.HBAR * C.HBAR) / (2 * (m || K.me) * L * L);
  /* Valores propios más bajos de una matriz tridiagonal simétrica (bisección con secuencia de Sturm) */
  C.tridiagEig = function (d, e, k) {
    const n = d.length;
    const count = (x) => { let c = 0, q = d[0] - x; if (q < 0) c++; for (let i = 1; i < n; i++) { q = d[i] - x - (e[i - 1] * e[i - 1]) / (q === 0 ? 1e-300 : q); if (q < 0) c++; } return c; };
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < n - 1 ? Math.abs(e[i]) : 0); lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r); }
    const out = [];
    for (let j = 0; j < k; j++) {
      let a = lo, b = hi;
      for (let it = 0; it < 200; it++) { const m = 0.5 * (a + b); if (count(m) > j) b = m; else a = m; if (b - a < 1e-14 * Math.max(1, Math.abs(a))) break; }
      out.push(0.5 * (a + b));
    }
    return out;
  };
  /* Autovector por iteración inversa con el sistema tridiagonal (Thomas) */
  C.tridiagVec = function (d, e, lam) {
    const n = d.length; let x = new Float64Array(n).map((_, i) => Math.sin((i + 1) * 0.37) + 0.1);
    for (let it = 0; it < 6; it++) {
      const cp = new Float64Array(n), dp = new Float64Array(n), b0 = d[0] - lam - 1e-10;
      cp[0] = e[0] / b0; dp[0] = x[0] / b0;
      for (let i = 1; i < n; i++) { const b = d[i] - lam - 1e-10, m = b - e[i - 1] * cp[i - 1]; cp[i] = i < n - 1 ? e[i] / m : 0; dp[i] = (x[i] - e[i - 1] * dp[i - 1]) / m; }
      const y = new Float64Array(n); y[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) y[i] = dp[i] - cp[i] * y[i + 1];
      let nr = 0; for (let i = 0; i < n; i++) nr += y[i] * y[i]; nr = Math.sqrt(nr); x = y.map((v) => v / nr);
    }
    return x;
  };
  /* Ecuación de Schrödinger unidimensional (ħ = m = 1): H = −½ d²/dx² + V(x) en una malla de N puntos interiores */
  C.schrodinger1D = function (V, x0, x1, N, k, withVec) {
    const dx = (x1 - x0) / (N + 1), d = [], e = [];
    for (let i = 0; i < N; i++) { d.push(1 / (dx * dx) + V(x0 + (i + 1) * dx)); if (i < N - 1) e.push(-1 / (2 * dx * dx)); }
    const E = C.tridiagEig(d, e, k);
    const out = { E, dx, x: Array.from({ length: N }, (_, i) => x0 + (i + 1) * dx) };
    if (withVec) out.psi = E.map((l) => C.tridiagVec(d, e, l));
    return out;
  };
  /* Hidrógeno l = 0 en unidades atómicas: u'' = 2(V − E)u con V = −1/r; devuelve los k niveles */
  C.hydrogenS = (rmax, N, k) => C.schrodinger1D((r) => -1 / r, 0, rmax, N, k, false).E;
  /* Incertidumbre de un estado: Δx, Δp (ħ = 1) por integración numérica de ψ real normalizada en puntos x */
  C.uncertainty = function (x, psi) {
    const n = x.length, dx = x[1] - x[0]; let nr = 0, mx = 0, mx2 = 0, kp = 0;
    for (let i = 0; i < n; i++) nr += psi[i] * psi[i] * dx;
    for (let i = 0; i < n; i++) { const p = psi[i] * psi[i] * dx / nr; mx += p * x[i]; mx2 += p * x[i] * x[i]; }
    for (let i = 0; i < n - 1; i++) { const d = (psi[i + 1] - psi[i]) / dx; kp += d * d * dx / nr; }
    return { dx: Math.sqrt(mx2 - mx * mx), dp: Math.sqrt(kp) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
