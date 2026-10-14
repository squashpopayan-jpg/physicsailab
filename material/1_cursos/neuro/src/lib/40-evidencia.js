/* ===================================================================
   lib/40-evidencia.js — Herramientas para juzgar la evidencia:
   regresión a la media, ensayos simulados con placebo e historia natural,
   potencia estadística, distribución t, metaanálisis de efectos aleatorios
   (DerSimonian-Laird), prueba de Egger, sesgo de publicación, NNT,
   teoría de detección de señales y prueba binomial exacta.
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const E = (L.ev = {});
  const S = () => L.stat;

  E.phi = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  /* Media de una normal truncada por abajo: E[X | X > c] */
  E.truncMean = function (mu, sd, c) {
    const a = (c - mu) / sd;
    return mu + (sd * E.phi(a)) / (1 - S().normCDF(a));
  };
  /* Regresión a la media esperada: si X e Y son normales con la misma media y desviación y correlación ρ,
     E[Y | X > c] = μ + ρ (E[X | X > c] − μ) */
  E.rtmExpected = (mu, sd, rho, c) => mu + rho * (E.truncMean(mu, sd, c) - mu);

  /* ---------- Ensayo simulado: síntoma crónico que fluctúa (AR(1)) ----------
     Cada persona tiene su propio nivel medio (sdBetween) y semanas que oscilan (sdWithin, autocorrelación phi).
     Busca tratamiento cuando su síntoma de esa semana supera `umbral`. A las `semanas` se mide de nuevo.
     efecto: mejora real del tratamiento; placebo: mejora por expectativa (en ambos brazos si hay simulación). */
  E.trial = function (o) {
    const rng = L.rng(o.seed || 1), n = o.n || 100, mu = o.mu === undefined ? 5 : o.mu;
    const sb = o.sdBetween === undefined ? 1 : o.sdBetween, sw = o.sdWithin === undefined ? 1.5 : o.sdWithin, ph = o.phi === undefined ? 0.6 : o.phi;
    const k = o.semanas || 4, um = o.umbral === undefined ? 7 : o.umbral;
    const arms = { trat: { pre: [], post: [] }, ctrl: { pre: [], post: [] } };
    let tries = 0;
    for (const arm of ['trat', 'ctrl']) {
      while (arms[arm].pre.length < n && tries < 2e6) {
        tries++;
        const base = mu + sb * rng.gauss();
        /* estado estacionario del AR(1) con varianza sw² */
        let e = sw * rng.gauss(), pre = null;
        for (let w = 0; w < 52; w++) {
          const y = base + e;
          if (w > 4 && y >= um) { pre = y; break; }
          e = ph * e + sw * Math.sqrt(1 - ph * ph) * rng.gauss();
        }
        if (pre === null) continue;
        for (let w = 0; w < k; w++) e = ph * e + sw * Math.sqrt(1 - ph * ph) * rng.gauss();
        let post = base + e;
        if (arm === 'trat') post -= (o.efecto || 0) + (o.placebo || 0);
        else if (o.simulado) post -= o.placebo || 0;
        post = Math.max(0, Math.min(10, post));
        arms[arm].pre.push(Math.min(10, pre)); arms[arm].post.push(post);
      }
    }
    const m = (a) => S().mean(a);
    const r = {
      arms,
      mejoraTrat: m(arms.trat.pre) - m(arms.trat.post),
      mejoraCtrl: m(arms.ctrl.pre) - m(arms.ctrl.post),
      frac: (arm) => arms[arm].pre.filter((p, i) => p - arms[arm].post[i] >= (o.mejoraMin || 2)).length / arms[arm].pre.length
    };
    r.diff = r.mejoraTrat - r.mejoraCtrl;
    return r;
  };

  /* ---------- Distribución t de Student ---------- */
  /* Logaritmo de la función gamma (Lanczos) */
  E.lgamma = function (x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - E.lgamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  };
  /* Beta incompleta regularizada I_x(a, b) por fracción continua (Numerical Recipes 6.4) */
  E.betainc = function (x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(E.lgamma(a + b) - E.lgamma(a) - E.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    const cf = (x, a, b) => {
      const FP = 1e-300;
      let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
      if (Math.abs(d) < FP) d = FP;
      d = 1 / d;
      let h = d;
      for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 3e-15) break;
      }
      return h;
    };
    return x < (a + 1) / (a + b + 2) ? (bt * cf(x, a, b)) / a : 1 - (bt * cf(1 - x, b, a)) / b;
  };
  /* Función de distribución de la t con ν grados de libertad */
  E.tCDF = function (t, nu) {
    const x = nu / (nu + t * t);
    const p = 0.5 * E.betainc(x, nu / 2, 0.5);
    return t >= 0 ? 1 - p : p;
  };
  /* Prueba t de dos muestras independientes (Welch); devuelve {t, df, p, d} */
  E.welch = function (a, b) {
    const ma = S().mean(a), mb = S().mean(b), va = S().variance(a), vb = S().variance(b), na = a.length, nb = b.length;
    const se2 = va / na + vb / nb, t = (ma - mb) / Math.sqrt(se2);
    const df = (se2 * se2) / ((va / na) * (va / na) / (na - 1) + (vb / nb) * (vb / nb) / (nb - 1));
    const sp = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
    return { t, df, p: 2 * (1 - E.tCDF(Math.abs(t), df)), d: (ma - mb) / sp };
  };
  /* Potencia de una comparación de dos grupos de n por brazo (aproximación normal) */
  E.power = function (d, n, alpha = 0.05) {
    const z = S().normQuantile(1 - alpha / 2), nc = d * Math.sqrt(n / 2);
    return S().normCDF(nc - z) + S().normCDF(-nc - z);
  };
  /* n por brazo para una potencia dada (aproximación normal) */
  E.nForPower = function (d, pw = 0.8, alpha = 0.05) {
    const z = S().normQuantile(1 - alpha / 2) + S().normQuantile(pw);
    return Math.ceil((2 * z * z) / (d * d));
  };

  /* ---------- Metaanálisis de efectos aleatorios (DerSimonian y Laird, 1986) ---------- */
  E.metaDL = function (y, v) {
    const k = y.length, w = v.map((x) => 1 / x);
    const sw = w.reduce((a, b) => a + b, 0);
    const yf = w.reduce((a, wi, i) => a + wi * y[i], 0) / sw;
    const Q = w.reduce((a, wi, i) => a + wi * (y[i] - yf) * (y[i] - yf), 0);
    const c = sw - w.reduce((a, wi) => a + wi * wi, 0) / sw;
    const tau2 = Math.max(0, (Q - (k - 1)) / c);
    const ws = v.map((x) => 1 / (x + tau2));
    const sws = ws.reduce((a, b) => a + b, 0);
    const mu = ws.reduce((a, wi, i) => a + wi * y[i], 0) / sws;
    const se = Math.sqrt(1 / sws);
    const I2 = Q > k - 1 ? (Q - (k - 1)) / Q : 0;
    return { mu, se, lo: mu - 1.959964 * se, hi: mu + 1.959964 * se, tau2, Q, I2, fixed: yf, seFixed: Math.sqrt(1 / sw) };
  };
  /* Prueba de Egger: regresión de y/se sobre 1/se; intercepto ≠ 0 sugiere asimetría del embudo */
  E.egger = function (y, v) {
    const se = v.map(Math.sqrt), X = se.map((s) => 1 / s), Y = y.map((yi, i) => yi / se[i]);
    const n = y.length, mx = S().mean(X), my = S().mean(Y);
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) * (X[i] - mx); }
    const b = sxy / sxx, a = my - b * mx;
    let rss = 0;
    for (let i = 0; i < n; i++) { const e = Y[i] - a - b * X[i]; rss += e * e; }
    const s2 = rss / (n - 2), seA = Math.sqrt(s2 * (1 / n + (mx * mx) / sxx));
    const t = a / seA;
    return { intercept: a, slope: b, t, p: 2 * (1 - E.tCDF(Math.abs(t), n - 2)) };
  };
  /* Simulación de una literatura: k estudios con n por brazo al azar entre nMin y nMax; d verdadero.
     Se publica todo lo significativo (p < 0,05 a favor) y solo una fracción `pubNull` del resto. */
  E.literature = function (o) {
    const rng = L.rng(o.seed || 4), k = o.k || 60, out = [];
    for (let i = 0; i < k; i++) {
      const n = Math.round(o.nMin + (o.nMax - o.nMin) * Math.pow(rng(), o.skew || 1.6));
      const v = 2 / n + (o.d * o.d) / (4 * n);
      const y = o.d + Math.sqrt(v) * rng.gauss() + (o.tau || 0) * rng.gauss();
      const z = y / Math.sqrt(v);
      const sig = z > 1.959964;
      const pub = sig || rng() < (o.pubNull === undefined ? 1 : o.pubNull);
      out.push({ y, v, n, sig, pub });
    }
    return out;
  };

  /* ---------- Tamaños de efecto ---------- */
  /* Número necesario a tratar a partir de d (Kraemer y Kupfer, 2006): NNT = 1 / (2Φ(d/√2) − 1) */
  E.nnt = (d) => 1 / (2 * S().normCDF(d / Math.SQRT2) - 1);
  /* Probabilidad de superioridad (lenguaje común): Φ(d/√2) */
  E.cles = (d) => S().normCDF(d / Math.SQRT2);
  E.rToD = (r) => (2 * r) / Math.sqrt(1 - r * r);
  E.dToR = (d) => d / Math.sqrt(d * d + 4);

  /* ---------- Detección de señales ---------- */
  E.dprime = function (hit, fa) {
    const zq = S().normQuantile;
    return { d: zq(hit) - zq(fa), c: -0.5 * (zq(hit) + zq(fa)) };
  };
  /* Prueba binomial exacta de dos colas (método de probabilidades menores o iguales, como SciPy) */
  E.binomPMF = function (k, n, p) {
    return Math.exp(E.lgamma(n + 1) - E.lgamma(k + 1) - E.lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  };
  E.binomTest = function (k, n, p = 0.5) {
    const pk = E.binomPMF(k, n, p);
    let s = 0;
    for (let i = 0; i <= n; i++) { const pi = E.binomPMF(i, n, p); if (pi <= pk * (1 + 1e-7)) s += pi; }
    return Math.min(1, s);
  };
})(typeof window !== 'undefined' ? window : globalThis);
