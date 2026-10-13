/* ===================================================================
   lib/50-neighbors-bayes.js — k vecinos más cercanos (clasificación y
   regresión), Bayes ingenuo gaussiano y multinomial, análisis
   discriminante lineal (LDA) y cuadrático (QDA).
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util, LA = L.la;

  /* ---------- k vecinos ---------- */
  const NB = (L.knn = {});
  /* Índices y distancias de los k vecinos de x (búsqueda exhaustiva) */
  NB.neighbors = function (X, x, k, metric = 'euclid', skip = -1) {
    const d = [];
    for (let i = 0; i < X.length; i++) {
      if (i === skip) continue;
      const v = metric === 'manhattan' ? U.manhattan(X[i], x) : metric === 'cheb' ? Math.max(...X[i].map((a, j) => Math.abs(a - x[j]))) : U.dist(X[i], x);
      d.push([v, i]);
    }
    d.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return d.slice(0, k);
  };
  NB.classifier = function (X, y, k = 5, o = {}) {
    const K = o.K || Math.max(...y) + 1;
    const proba = (x, skip) => {
      const nb = NB.neighbors(X, x, k, o.metric, skip);
      const v = new Array(K).fill(0);
      let tot = 0;
      for (const [d, i] of nb) { const w = o.weights === 'distance' ? (d < 1e-12 ? 1e12 : 1 / d) : 1; v[y[i]] += w; tot += w; }
      return v.map((a) => a / tot);
    };
    return { k, proba, predict1: (x) => U.argmax(proba(x)), predict: (Z) => Z.map((x) => U.argmax(proba(x))), probaAll: (Z) => Z.map((x) => proba(x)) };
  };
  NB.regressor = function (X, y, k = 5, o = {}) {
    const pred1 = (x) => {
      const nb = NB.neighbors(X, x, k, o.metric);
      let s = 0, tot = 0;
      for (const [d, i] of nb) { const w = o.weights === 'distance' ? (d < 1e-12 ? 1e12 : 1 / d) : 1; s += w * y[i]; tot += w; }
      return s / tot;
    };
    return { k, predict1: pred1, predict: (Z) => Z.map(pred1) };
  };

  /* ---------- Modelos generativos ---------- */
  const G = (L.gen = {});
  const byClass = (X, y, K) => U.range(K).map((c) => X.filter((_, i) => y[i] === c));
  const meanOf = (A) => { const p = A[0].length, m = new Float64Array(p); for (const r of A) for (let j = 0; j < p; j++) m[j] += r[j] / A.length; return m; };
  const covOf = (A, m, ddof = 1) => {
    const p = m.length, S = LA.zeros(p);
    for (const r of A) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += (r[a] - m[a]) * (r[b] - m[b]);
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] /= Math.max(1, A.length - ddof);
    return S;
  };
  G.meanOf = meanOf;
  G.covOf = covOf;
  /* log-densidad gaussiana multivariante con precisión Pi y log|Σ| */
  const logN = (x, m, Pi, logdet) => {
    const p = m.length;
    let q = 0;
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) q += (x[a] - m[a]) * Pi[a][b] * (x[b] - m[b]);
    return -0.5 * (q + logdet + p * Math.log(2 * Math.PI));
  };
  const logdetOf = (S) => { const Lc = LA.cholesky(S); if (!Lc) return NaN; let s = 0; for (let i = 0; i < S.length; i++) s += 2 * Math.log(Lc[i][i]); return s; };
  G.logN = logN;
  G.logdet = logdetOf;
  const fromLogs = (lg) => { const m = Math.max(...lg); const e = lg.map((v) => Math.exp(v - m)); const s = U.sum(e); return e.map((v) => v / s); };

  /* Bayes ingenuo gaussiano (sklearn GaussianNB: varianzas ddof=0 + var_smoothing·max var) */
  G.gaussianNB = function (X, y, o = {}) {
    const K = o.K || Math.max(...y) + 1, p = X[0].length, n = X.length;
    const groups = byClass(X, y, K);
    let vmax = 0;
    for (let j = 0; j < p; j++) { const c = X.map((r) => r[j]); vmax = Math.max(vmax, L.stat.variance(c, 0)); }
    const eps = (o.smoothing === undefined ? 1e-9 : o.smoothing) * vmax;
    const theta = groups.map((g) => meanOf(g));
    const sigma = groups.map((g, c) => Array.from({ length: p }, (_, j) => U.sum(g.map((r) => (r[j] - theta[c][j]) ** 2)) / g.length + eps));
    const prior = groups.map((g) => o.priors ? o.priors[groups.indexOf(g)] : g.length / n);
    const logp = (x) => U.range(K).map((c) => {
      let s = Math.log(prior[c]);
      for (let j = 0; j < p; j++) s += -0.5 * Math.log(2 * Math.PI * sigma[c][j]) - ((x[j] - theta[c][j]) ** 2) / (2 * sigma[c][j]);
      return s;
    });
    const proba1 = (x) => fromLogs(logp(x));
    return { K, theta, sigma, prior, logp, proba1, proba: (Z) => Z.map(proba1), predict: (Z) => Z.map((x) => U.argmax(logp(x))) };
  };
  /* LDA: covarianza común agrupada (estimador con divisor n − K, como sklearn solver='lsqr') */
  G.lda = function (X, y, o = {}) {
    const K = o.K || Math.max(...y) + 1, p = X[0].length, n = X.length;
    const groups = byClass(X, y, K);
    const mu = groups.map(meanOf);
    const S = LA.zeros(p);
    groups.forEach((g, c) => { for (const r of g) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += (r[a] - mu[c][a]) * (r[b] - mu[c][b]); });
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] /= n - K;
    const Pi = LA.inv(S), ld = logdetOf(S);
    const prior = groups.map((g) => g.length / n);
    const logp = (x) => U.range(K).map((c) => Math.log(prior[c]) + logN(x, mu[c], Pi, ld));
    const proba1 = (x) => fromLogs(logp(x));
    /* coeficientes lineales de la frontera: w_c = Σ⁻¹ μ_c, b_c = −½ μ_cᵀ Σ⁻¹ μ_c + log π_c */
    const coef = mu.map((m) => LA.matvec(Pi, Array.from(m)));
    const intercept = mu.map((m, c) => -0.5 * LA.dot(m, coef[c]) + Math.log(prior[c]));
    return { K, mu, S, prior, coef, intercept, logp, proba1, proba: (Z) => Z.map(proba1), predict: (Z) => Z.map((x) => U.argmax(logp(x))) };
  };
  /* QDA: una covarianza por clase (divisor n_c − 1) y regularización opcional reg */
  G.qda = function (X, y, o = {}) {
    const K = o.K || Math.max(...y) + 1, p = X[0].length, n = X.length;
    const groups = byClass(X, y, K);
    const mu = groups.map(meanOf);
    const reg = o.reg || 0;
    const Sg = groups.map((g, c) => { const S = covOf(g, mu[c]); if (reg) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] = (1 - reg) * S[a][b] + (a === b ? reg : 0); return S; });
    const Pi = Sg.map((S) => LA.inv(S)), ld = Sg.map(logdetOf);
    const prior = groups.map((g) => g.length / n);
    const logp = (x) => U.range(K).map((c) => Math.log(prior[c]) + logN(x, mu[c], Pi[c], ld[c]));
    const proba1 = (x) => fromLogs(logp(x));
    return { K, mu, S: Sg, prior, logp, proba1, proba: (Z) => Z.map(proba1), predict: (Z) => Z.map((x) => U.argmax(logp(x))) };
  };
  /* Bayes ingenuo multinomial para conteos de palabras, suavizado de Laplace α */
  G.multinomialNB = function (docs, y, vocab, alpha = 1) {
    const K = Math.max(...y) + 1, V = vocab.length;
    const cnt = Array.from({ length: K }, () => new Float64Array(V)), nd = new Array(K).fill(0);
    docs.forEach((d, i) => { nd[y[i]]++; d.forEach((c, j) => { cnt[y[i]][j] += c; }); });
    const tot = cnt.map((r) => U.sum(r));
    const logLik = cnt.map((r, c) => Array.from(r, (v) => Math.log((v + alpha) / (tot[c] + alpha * V))));
    const logPrior = nd.map((v) => Math.log(v / docs.length));
    const logp = (d) => U.range(K).map((c) => logPrior[c] + U.sum(d.map((v, j) => v * logLik[c][j])));
    return { K, cnt, logLik, logPrior, logp, proba1: (d) => fromLogs(logp(d)), predict: (D) => D.map((d) => U.argmax(logp(d))) };
  };
  G.fromLogs = fromLogs;
})(typeof window !== 'undefined' ? window : globalThis);
