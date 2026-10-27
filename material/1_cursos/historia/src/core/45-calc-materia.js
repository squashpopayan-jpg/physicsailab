(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  /* Kronig–Penney (a = 1, ħ²/2m = 1): cos(k) = cos(α) + P sen(α)/α, E = α². Bandas permitidas en α */
  C.kpF = (alpha, P) => Math.cos(alpha) + (alpha === 0 ? P : (P * Math.sin(alpha)) / alpha);
  C.kpBands = function (P, amax) {
    const bands = []; let inB = false, a0 = 0, prev = C.kpF(1e-9, P), step = 1e-4;
    const bis = (lo, hi, target) => { for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if ((Math.abs(C.kpF(m, P)) <= 1) === target) hi = m; else lo = m; } return 0.5 * (lo + hi); };
    inB = Math.abs(prev) <= 1; a0 = 0;
    for (let a = step; a <= amax; a += step) {
      const ok = Math.abs(C.kpF(a, P)) <= 1;
      if (ok && !inB) { a0 = bis(a - step, a, true); inB = true; }
      else if (!ok && inB) { bands.push([a0 * a0, Math.pow(bis(a - step, a, false), 2)]); inB = false; }
    }
    return bands;
  };
  /* Diodo de Shockley */
  C.VT = (T) => (K.kB * T) / K.e;
  C.diodeI = (V, Is, n, T) => Is * Math.expm1(V / (n * C.VT(T || 300)));
  /* Ley de Moore: duplicación por regresión log2 N = a + t/T2 */
  C.MOORE = [[1971, 2300, '4004'], [1974, 6000, '8080'], [1978, 29000, '8086'], [1982, 134000, '80286'], [1985, 275000, '80386'], [1989, 1180000, '80486'], [1993, 3100000, 'Pentium'], [1997, 7500000, 'Pentium II'], [1999, 9500000, 'Pentium III'], [2000, 42000000, 'Pentium 4'], [2006, 291000000, 'Core 2'], [2010, 1170000000, 'Core i7'], [2015, 1750000000, 'Skylake'], [2020, 11800000000, 'M1']];
  C.doublingTime = function (data) { const xs = data.map((d) => d[0]), ys = data.map((d) => Math.log2(d[1])); const f = C.linfit ? C.linfit(xs, ys) : null; return 1 / f.m; };
  /* BCS en acoplamiento débil: ecuación de la brecha con corte ħω_D = 1, N(0)V = g */
  C.bcsDelta0 = (g, w) => (w || 1) / Math.sinh(1 / g);
  C.bcsTc = function (g, w) {
    w = w || 1; const f = (T) => { const n = 4000, h = w / n; let s = 0; for (let i = 1; i <= n; i++) { const x = (i - 0.5) * h; s += Math.tanh(x / (2 * T)) / x * h; } return s - 1 / g; };
    let lo = 1e-4, hi = 1; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (f(m) > 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  };
  /* Láser: ecuaciones de balance con emisión espontánea β. Estado estacionario por bisección en n */
  C.laserSS = function (R, tau, G, tauc, beta) {
    const nth = 1 / (G * tauc);
    const phiOf = (n) => (beta * n / tau) / Math.max(1 / tauc - G * n, 1e-300);
    let lo = 0, hi = nth * (1 - 1e-12);
    for (let i = 0; i < 200; i++) { const n = 0.5 * (lo + hi), rhs = n / tau + G * n * phiOf(n); if (rhs < R) lo = n; else hi = n; }
    const n = 0.5 * (lo + hi); return { n, phi: phiOf(n), nth };
  };
  C.einsteinRatio = (nu) => (8 * PI * K.h * nu * nu * nu) / Math.pow(K.c, 3); /* A21/B21 */
})(typeof window !== 'undefined' ? window : globalThis);
