/* ===================================================================
   30-stats.js — Generador pseudoaleatorio, distribuciones y utilidades estadísticas
   (sin DOM; validado contra SciPy en tests/validar.js)
   =================================================================== */
(function () {
  'use strict';
  const ML = (window.ML = window.ML || {});
  const L = (ML.L = ML.L || {});
  const S = (L.stats = {});

  /* ---------- Aleatorios con semilla ---------- */
  S.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const f = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    f.normal = function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0, v = 0, r = 0;
      do { u = 2 * f() - 1; v = 2 * f() - 1; r = u * u + v * v; } while (r >= 1 || r === 0);
      const m = Math.sqrt((-2 * Math.log(r)) / r);
      spare = v * m;
      return u * m;
    };
    f.int = (n) => Math.floor(f() * n);
    f.poisson = function (lam) {
      const Lm = Math.exp(-lam);
      let k = 0, p = 1;
      do { k++; p *= f(); } while (p > Lm);
      return k - 1;
    };
    return f;
  };

  /* ---------- Resúmenes ---------- */
  S.mean = (x) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i]; return s / x.length; };
  S.sd = (x) => {
    const n = x.length;
    if (n < 2) return NaN;
    const m = S.mean(x);
    let v = 0;
    for (let i = 0; i < n; i++) v += (x[i] - m) * (x[i] - m);
    return Math.sqrt(v / (n - 1));
  };
  S.quantile = (xs, q) => {
    const a = Array.from(xs).filter((v) => v === v).sort((p, r) => p - r);
    if (!a.length) return NaN;
    const h = (a.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
    return a[lo] + (a[hi] - a[lo]) * (h - lo);
  };
  S.skew = (x) => {
    const n = x.length, m = S.mean(x), s = Math.sqrt(x.reduce((a, v) => a + (v - m) * (v - m), 0) / n);
    return s > 0 ? x.reduce((a, v) => a + Math.pow((v - m) / s, 3), 0) / n : NaN;
  };
  S.corr = (x, y) => {
    const n = x.length, mx = S.mean(x), my = S.mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
    return sxy / Math.sqrt(sxx * syy);
  };
  S.histogram = function (x, lo, hi, bins) {
    const h = new Array(bins).fill(0), w = (hi - lo) / bins;
    for (const v of x) { if (v !== v) continue; const k = Math.floor((v - lo) / w); if (k >= 0 && k < bins) h[k]++; else if (v === hi) h[bins - 1]++; }
    return h;
  };

  /* ---------- Normal ---------- */
  S.erf = function (x) {
    /* Abramowitz–Stegun 7.1.26 es poco precisa; se usa la serie/fracción continua (precisión ~1e-15) */
    const ax = Math.abs(x);
    let r;
    if (ax < 2.5) {
      let sum = ax, term = ax;
      for (let n = 1; n < 80; n++) { term *= (-ax * ax) / n; sum += term / (2 * n + 1); }
      r = (2 / Math.sqrt(Math.PI)) * sum;
    } else {
      /* fracción continua de erfc */
      let f = 0;
      for (let k = 60; k >= 1; k--) f = k / 2 / (ax + f);
      r = 1 - (Math.exp(-ax * ax) / Math.sqrt(Math.PI)) / (ax + f);
    }
    return x < 0 ? -r : r;
  };
  S.normCdf = (z) => 0.5 * (1 + S.erf(z / Math.SQRT2));
  S.normSf = (z) => 0.5 * (1 - S.erf(z / Math.SQRT2));
  S.normInv = function (p) {
    /* Acklam con un paso de Halley */
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    let x;
    if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    const e = S.normCdf(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    return x - u / (1 + (x * u) / 2);
  };

  /* ---------- t de Student (beta incompleta regularizada) ---------- */
  function lgamma(x) {
    const g = [57.1562356658629235, -59.5979603554754912, 14.1360979747417471, -0.491913816097620199, 0.339946499848118887e-4, 0.465236289270485756e-4, -0.983744753048795646e-4, 0.158088703224912494e-3, -0.210264441724104883e-3, 0.217439618115212643e-3, -0.164318106536763890e-3, 0.844182239838527433e-4, -0.261908384015814087e-4, 0.368991826595316234e-5];
    let y = x, t = x + 5.24218750000000000;
    t = (x + 0.5) * Math.log(t) - t;
    let s = 0.999999999999997092;
    for (let j = 0; j < 14; j++) s += g[j] / ++y;
    return t + Math.log((2.5066282746310005 * s) / x);
  }
  function betacf(a, b, x) {
    const FP = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FP) d = FP;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
      c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
      d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
      c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  S.betaInc = function (a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  };
  S.tCdf = function (t, df) {
    const x = df / (df + t * t), p = 0.5 * S.betaInc(df / 2, 0.5, x);
    return t > 0 ? 1 - p : p;
  };
  S.tInv = function (p, df) {
    let lo = -50, hi = 50;
    if (df > 1e6) return S.normInv(p);
    for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (S.tCdf(m, df) < p) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  };
  /* p-valor bilateral de un estadístico t */
  S.tP2 = (t, df) => 2 * (1 - S.tCdf(Math.abs(t), df));

  /* Intervalo de confianza de la media (t de Student) */
  S.meanCI = function (x, conf = 0.95) {
    const n = x.length, m = S.mean(x), se = S.sd(x) / Math.sqrt(n);
    const q = n > 1 ? S.tInv(1 - (1 - conf) / 2, n - 1) : NaN;
    return { n, mean: m, se, lo: m - q * se, hi: m + q * se, t: m / se, p: n > 1 ? S.tP2(m / se, n - 1) : NaN };
  };
  /* Operaciones necesarias para detectar una ventaja `edge` (en R) con desviación `sd` (potencia 80 %, bilateral 5 %) */
  S.nForEdge = function (edge, sd, alpha = 0.05, power = 0.8) {
    const za = S.normInv(1 - alpha / 2), zb = S.normInv(power);
    return Math.ceil(((za + zb) * sd / edge) ** 2);
  };
  /* Máximo esperado de K estadísticos t independientes bajo la nula (aprox.): cuantil 1 - 1/(K+1) normal */
  S.expMaxZ = (K) => S.normInv(1 - 1 / (K + 1));

  /* Remuestreo (bootstrap) de la media */
  S.bootMean = function (x, B, rng) {
    const n = x.length, out = new Float64Array(B);
    for (let b = 0; b < B; b++) { let s = 0; for (let i = 0; i < n; i++) s += x[rng.int(n)]; out[b] = s / n; }
    return out;
  };
})();
