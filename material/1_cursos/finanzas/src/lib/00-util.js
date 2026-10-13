/* ===================================================================
   lib/00-util.js — Utilidades sin DOM: azar reproducible y estadística.
   Todo el núcleo de cálculo (src/lib) corre igual en el navegador y en
   Node (tests/cargar.js), para poder validarlo fuera de la página.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});

  /* Generador mulberry32 con semilla; rng() ∈ [0,1), rng.gauss() ~ N(0,1) */
  L.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    r.gauss = function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0, v = 0;
      while (u <= 1e-300) u = r();
      v = r();
      const m = Math.sqrt(-2 * Math.log(u));
      spare = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    };
    r.uniform = (a0, b0) => a0 + (b0 - a0) * r();
    r.int = (n) => Math.floor(r() * n);
    r.bernoulli = (p) => r() < p;
    return r;
  };

  const S = (L.stat = {});
  S.sum = (a) => { let s = 0; for (const v of a) s += v; return s; };
  S.mean = (a) => (a.length ? S.sum(a) / a.length : NaN);
  S.variance = (a, ddof = 1) => {
    const m = S.mean(a);
    let s = 0;
    for (const v of a) s += (v - m) * (v - m);
    return s / Math.max(1, a.length - ddof);
  };
  S.sd = (a, ddof = 1) => Math.sqrt(S.variance(a, ddof));
  S.cov = (a, b, ddof = 1) => {
    const ma = S.mean(a), mb = S.mean(b);
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
    return s / Math.max(1, a.length - ddof);
  };
  S.corr = (a, b) => S.cov(a, b) / (S.sd(a) * S.sd(b));
  /* Cuantil con interpolación lineal (método 7 de Hyndman y Fan, el de NumPy y Excel PERCENTIL.INC) */
  S.quantile = function (a, q) {
    const s = Float64Array.from(a).sort();
    if (!s.length) return NaN;
    const h = (s.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
  };
  S.quantilesSorted = function (sorted, qs) {
    return qs.map((q) => { const h = (sorted.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h); return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]); });
  };
  /* Media geométrica de rentabilidades simples: (Π(1+r))^(1/n) − 1 */
  S.geoMean = (r) => { let s = 0; for (const v of r) s += Math.log1p(v); return Math.expm1(s / r.length); };
  /* Función de distribución normal estándar (Abramowitz–Stegun 7.1.26 mejorada con erfc de Numerical Recipes) */
  S.normCDF = function (x) {
    const z = Math.abs(x) / Math.SQRT2;
    const t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? 1 - r / 2 : r / 2;
  };
  /* Cuantil normal estándar (Acklam, error relativo < 1.2e-9 tras un paso de Newton) */
  S.normQuantile = function (p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let x;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const e = S.normCDF(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    return x - u / (1 + (x * u) / 2);
  };

  const U = (L.util = {});
  U.linspace = (a, b, n) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));
  U.range = (n) => Array.from({ length: n }, (_, i) => i);
  U.cumsum = (a) => { let s = 0; return a.map((v) => (s += v)); };
  U.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  /* Raíz de f en [a, b] por bisección (f(a) y f(b) de signos opuestos) */
  U.bisect = function (f, a, b, tol = 1e-13, it = 300) {
    let fa = f(a);
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      if (Math.abs(b - a) < tol * (1 + Math.abs(a))) break;
    }
    return 0.5 * (a + b);
  };
})(typeof window !== 'undefined' ? window : globalThis);
