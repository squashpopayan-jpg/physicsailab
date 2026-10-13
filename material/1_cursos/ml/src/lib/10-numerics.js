/* ===================================================================
   lib/10-numerics.js — Utilidades, funciones especiales, generador
   pseudoaleatorio con semilla y estadística básica (sin DOM).
   Todo el núcleo de algoritmos vive en ML.L y se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});

  /* ---------- Utilidades ---------- */
  const U = (L.util = {});
  U.linspace = (a, b, n) => { const o = new Float64Array(n); for (let i = 0; i < n; i++) o[i] = n === 1 ? a : a + ((b - a) * i) / (n - 1); return o; };
  U.range = (n) => Array.from({ length: n }, (_, i) => i);
  U.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  U.sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  U.argmax = (a) => { let k = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[k]) k = i; return k; };
  U.argmin = (a) => { let k = 0; for (let i = 1; i < a.length; i++) if (a[i] < a[k]) k = i; return k; };
  U.argsort = (a, desc) => U.range(a.length).sort((i, j) => (desc ? a[j] - a[i] : a[i] - a[j]) || i - j);
  U.unique = (a) => Array.from(new Set(a)).sort((x, y) => x - y);
  U.sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
  U.logit = (p) => Math.log(p / (1 - p));
  /* log(1 + e^z) estable */
  U.softplus = (z) => (z > 30 ? z : z < -30 ? Math.exp(z) : Math.log1p(Math.exp(z)));
  U.softmax = function (z, T = 1) {
    let m = -Infinity;
    for (const v of z) if (v / T > m) m = v / T;
    const e = z.map((v) => Math.exp(v / T - m));
    const s = U.sum(e);
    return e.map((v) => v / s);
  };
  U.dist2 = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s; };
  U.dist = (a, b) => Math.sqrt(U.dist2(a, b));
  U.manhattan = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s; };
  U.bisect = function (f, a, b, tol = 1e-13, it = 300) {
    let fa = f(a), fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) return NaN;
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fm === 0) return m;
      if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
      if (Math.abs(b - a) < tol * Math.max(1, Math.abs(m))) break;
    }
    return 0.5 * (a + b);
  };
  /* Mínimo por sección áurea en [a, b] */
  U.golden = function (f, a, b, tol = 1e-10) {
    const g = (Math.sqrt(5) - 1) / 2;
    let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
    for (let i = 0; i < 200 && Math.abs(b - a) > tol * (Math.abs(c) + Math.abs(d) + 1e-12); i++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); }
      else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
    }
    const x = 0.5 * (a + b);
    return { x, f: f(x) };
  };
  /* Columna j de una matriz (arreglo de filas) */
  U.col = (X, j) => X.map((r) => r[j]);
  U.take = (a, idx) => idx.map((i) => a[i]);

  /* ---------- Funciones especiales ---------- */
  const S = (L.sf = {});
  S.logGamma = function (x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  };
  S.logBinom = (n, k) => S.logGamma(n + 1) - S.logGamma(k + 1) - S.logGamma(n - k + 1);
  S.binom = (n, k) => (k < 0 || k > n ? 0 : Math.round(Math.exp(S.logBinom(n, k))));
  S.erf = function (x) {
    const ax = Math.abs(x);
    if (ax < 2) {
      let sum = x, term = x;
      const x2 = x * x;
      for (let n = 1; n < 60; n++) { term *= -x2 / n; const t = term / (2 * n + 1); sum += t; if (Math.abs(t) < 1e-17) break; }
      return (2 / Math.sqrt(Math.PI)) * sum;
    }
    let f = 0;
    for (let k = 60; k >= 1; k--) f = (k / 2) / (ax + f);
    const erfc = Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f);
    return Math.sign(x) * (1 - erfc);
  };
  /* Beta incompleta regularizada I_x(a,b) (fracción continua de Lentz) */
  S.betaInc = function (x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbt = S.logGamma(a + b) - S.logGamma(a) - S.logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    const cf = (x2, a2, b2) => {
      const tiny = 1e-300;
      let c = 1, d = 1 - ((a2 + b2) * x2) / (a2 + 1);
      if (Math.abs(d) < tiny) d = tiny;
      d = 1 / d;
      let h = d;
      for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b2 - m) * x2) / ((a2 + m2 - 1) * (a2 + m2));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; h *= d * c;
        aa = (-(a2 + m) * (a2 + b2 + m) * x2) / ((a2 + m2) * (a2 + m2 + 1));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d;
        const del = d * c; h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
      }
      return h;
    };
    if (x < (a + 1) / (a + b + 2)) return (Math.exp(lbt) * cf(x, a, b)) / a;
    return 1 - (Math.exp(lbt) * cf(1 - x, b, a)) / b;
  };
  /* Gamma incompleta regularizada inferior P(a, x) */
  S.gammaP = function (a, x) {
    if (x <= 0) return 0;
    const gln = S.logGamma(a);
    if (x < a + 1) {
      let ap = a, sum = 1 / a, del = sum;
      for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
  };

  /* ---------- Generador pseudoaleatorio Mulberry32 ---------- */
  L.rng = function (seed) {
    let s = seed >>> 0;
    const r = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    r.gauss = function () {
      if (spare !== null) { const v = spare; spare = null; return v; }
      let u = 0;
      while (u === 0) u = r();
      const v = r(), R = Math.sqrt(-2 * Math.log(u));
      spare = R * Math.sin(2 * Math.PI * v);
      return R * Math.cos(2 * Math.PI * v);
    };
    r.int = (n) => Math.floor(r() * n);
    r.uniform = (a, b) => a + (b - a) * r();
    r.normal = (m = 0, sd = 1) => m + sd * r.gauss();
    r.perm = (n) => { const p = U.range(n); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; } return p; };
    r.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    r.choice = (n, k, replace) => (replace ? Array.from({ length: k }, () => Math.floor(r() * n)) : r.perm(n).slice(0, k));
    r.state = () => s;
    return r;
  };

  /* ---------- Estadística ---------- */
  const ST = (L.stat = {});
  ST.mean = (a) => { let s = 0; for (const v of a) s += v; return a.length ? s / a.length : NaN; };
  ST.variance = (a, ddof = 1) => { const m = ST.mean(a); let s = 0; for (const v of a) s += (v - m) * (v - m); return a.length > ddof ? s / (a.length - ddof) : 0; };
  ST.std = (a, ddof = 1) => Math.sqrt(ST.variance(a, ddof));
  /* Cuantil con interpolación lineal (igual que numpy.quantile por defecto) */
  ST.quantile = function (a, q) {
    const s = Float64Array.from(a).sort();
    if (!s.length) return NaN;
    const h = (s.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
  };
  ST.median = (a) => ST.quantile(a, 0.5);
  ST.cov = (a, b) => { const ma = ST.mean(a), mb = ST.mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); };
  ST.corr = (a, b) => ST.cov(a, b) / (ST.std(a) * ST.std(b));
  ST.normPDF = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s);
  ST.normCDF = (z) => 0.5 * (1 + S.erf(z / Math.SQRT2));
  ST.normQuantile = (p) => U.bisect((z) => ST.normCDF(z) - p, -40, 40, 1e-15);
  ST.tCDF = function (t, nu) {
    const x = nu / (nu + t * t);
    const p = 0.5 * S.betaInc(x, nu / 2, 0.5);
    return t >= 0 ? 1 - p : p;
  };
  ST.tQuantile = (p, nu) => (nu > 0 ? U.bisect((t) => ST.tCDF(t, nu) - p, -1e3, 1e3, 1e-14) : NaN);
  ST.chi2CDF = (x, k) => S.gammaP(k / 2, x / 2);
  /* Intervalo de confianza de la media con t de Student */
  ST.ci = function (a, level = 0.95) {
    const n = a.length, m = ST.mean(a), s = ST.std(a);
    const t = n > 1 ? ST.tQuantile(0.5 + level / 2, n - 1) : NaN;
    return { n, mean: m, std: s, sem: s / Math.sqrt(n), t, half: (t * s) / Math.sqrt(n) };
  };
  /* Histograma: {lo, hi, nb, w, counts, dens} */
  ST.hist = function (a, lo, hi, nb) {
    const counts = new Float64Array(nb);
    const w = (hi - lo) / nb;
    let n = 0;
    for (const v of a) { let k = Math.floor((v - lo) / w); if (v === hi) k = nb - 1; if (k >= 0 && k < nb) { counts[k]++; n++; } }
    const dens = counts.map((c) => (a.length ? c / (a.length * w) : 0));
    return { lo, hi, nb, w, counts, dens, n };
  };
  /* Rangos promedio (empates → rango medio), base 1 */
  ST.rank = function (a) {
    const idx = U.argsort(a), r = new Float64Array(a.length);
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++;
      const rr = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k]] = rr;
      i = j + 1;
    }
    return r;
  };
  ST.spearman = (a, b) => ST.corr(Array.from(ST.rank(a)), Array.from(ST.rank(b)));
})(typeof window !== 'undefined' ? window : globalThis);
