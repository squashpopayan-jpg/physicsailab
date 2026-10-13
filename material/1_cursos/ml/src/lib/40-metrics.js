/* ===================================================================
   lib/40-metrics.js — Métricas de regresión, clasificación (matriz
   de confusión, curvas ROC y precisión–exhaustividad, AUC, AP,
   log-loss, Brier, MCC, kappa), calibración y agrupamiento
   (silueta, índice de Rand ajustado). Mismas convenciones que sklearn.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util, ST = L.stat;
  const MT = (L.met = {});

  /* ---------- Regresión ---------- */
  MT.mse = (y, p) => { let s = 0; for (let i = 0; i < y.length; i++) s += (y[i] - p[i]) ** 2; return s / y.length; };
  MT.rmse = (y, p) => Math.sqrt(MT.mse(y, p));
  MT.mae = (y, p) => { let s = 0; for (let i = 0; i < y.length; i++) s += Math.abs(y[i] - p[i]); return s / y.length; };
  MT.medae = (y, p) => ST.median(y.map((v, i) => Math.abs(v - p[i])));
  MT.mape = (y, p) => { let s = 0; for (let i = 0; i < y.length; i++) s += Math.abs(y[i] - p[i]) / Math.max(Math.abs(y[i]), 2.220446049250313e-16); return s / y.length; };
  MT.r2 = (y, p) => { const m = ST.mean(y); let a = 0, b = 0; for (let i = 0; i < y.length; i++) { a += (y[i] - p[i]) ** 2; b += (y[i] - m) ** 2; } return 1 - a / b; };
  MT.r2adj = (r2, n, k) => 1 - ((1 - r2) * (n - 1)) / (n - k - 1);
  MT.maxErr = (y, p) => Math.max(...y.map((v, i) => Math.abs(v - p[i])));

  /* ---------- Clasificación ---------- */
  MT.confusion = function (y, p, K) {
    K = K || Math.max(...y, ...p) + 1;
    const M = Array.from({ length: K }, () => new Array(K).fill(0));
    for (let i = 0; i < y.length; i++) M[y[i]][p[i]]++;
    return M;
  };
  /* Métricas binarias desde los conteos (clase positiva = 1) */
  MT.binary = function (y, p) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < y.length; i++) {
      if (p[i] === 1) { if (y[i] === 1) tp++; else fp++; } else if (y[i] === 1) fn++; else tn++;
    }
    return MT.fromCounts(tp, fp, fn, tn);
  };
  MT.fromCounts = function (tp, fp, fn, tn) {
    const n = tp + fp + fn + tn;
    const prec = tp + fp ? tp / (tp + fp) : 0, rec = tp + fn ? tp / (tp + fn) : 0;
    const spec = tn + fp ? tn / (tn + fp) : 0;
    const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
    const acc = (tp + tn) / n;
    const den = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
    const mcc = den ? (tp * tn - fp * fn) / den : 0;
    const pe = ((tp + fp) * (tp + fn) + (fn + tn) * (fp + tn)) / (n * n);
    const kappa = pe < 1 ? (acc - pe) / (1 - pe) : 0;
    return { tp, fp, fn, tn, n, acc, prec, rec, spec, f1, mcc, kappa, bacc: (rec + spec) / 2, fpr: 1 - spec, npv: tn + fn ? tn / (tn + fn) : 0, prev: (tp + fn) / n };
  };
  MT.fbeta = (prec, rec, b) => (prec + rec ? ((1 + b * b) * prec * rec) / (b * b * prec + rec) : 0);
  /* Informe multiclase: por clase, macro, ponderado y micro (= exactitud) */
  MT.report = function (y, p, K) {
    const M = MT.confusion(y, p, K);
    K = M.length;
    const cls = U.range(K).map((c) => {
      const tp = M[c][c], sup = U.sum(M[c]), pred = U.sum(M.map((r) => r[c]));
      const prec = pred ? tp / pred : 0, rec = sup ? tp / sup : 0;
      return { prec, rec, f1: prec + rec ? (2 * prec * rec) / (prec + rec) : 0, sup };
    });
    const n = y.length;
    const avg = (k, w) => U.sum(cls.map((c) => c[k] * (w ? c.sup / n : 1 / K)));
    const acc = U.sum(U.range(K).map((c) => M[c][c])) / n;
    return { M, cls, acc, macro: { prec: avg('prec'), rec: avg('rec'), f1: avg('f1') }, weighted: { prec: avg('prec', 1), rec: avg('rec', 1), f1: avg('f1', 1) } };
  };
  /* Curva ROC: umbrales en orden decreciente; maneja empates como sklearn */
  MT.roc = function (y, s) {
    const idx = U.argsort(s, true);
    const P = y.filter((v) => v === 1).length, N = y.length - P;
    const fpr = [0], tpr = [0], thr = [Infinity];
    let tp = 0, fp = 0;
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      if (y[i] === 1) tp++; else fp++;
      if (k === idx.length - 1 || s[idx[k + 1]] !== s[i]) { fpr.push(N ? fp / N : 0); tpr.push(P ? tp / P : 0); thr.push(s[i]); }
    }
    return { fpr, tpr, thr };
  };
  MT.trapz = (x, y) => { let a = 0; for (let i = 1; i < x.length; i++) a += ((x[i] - x[i - 1]) * (y[i] + y[i - 1])) / 2; return a; };
  MT.auc = (y, s) => { const r = MT.roc(y, s); return MT.trapz(r.fpr, r.tpr); };
  /* AUC como probabilidad de que un positivo puntúe más que un negativo (Mann–Whitney) */
  MT.aucRank = function (y, s) {
    const r = ST.rank(s);
    let sp = 0, P = 0;
    for (let i = 0; i < y.length; i++) if (y[i] === 1) { sp += r[i]; P++; }
    const N = y.length - P;
    return (sp - (P * (P + 1)) / 2) / (P * N);
  };
  /* Curva precisión–exhaustividad (umbral decreciente) y precisión promedio (AP de sklearn) */
  MT.pr = function (y, s) {
    const idx = U.argsort(s, true);
    const P = y.filter((v) => v === 1).length;
    const prec = [], rec = [], thr = [];
    let tp = 0, fp = 0;
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      if (y[i] === 1) tp++; else fp++;
      if (k === idx.length - 1 || s[idx[k + 1]] !== s[i]) { prec.push(tp / (tp + fp)); rec.push(P ? tp / P : 0); thr.push(s[i]); }
    }
    let ap = 0, rPrev = 0;
    for (let k = 0; k < rec.length; k++) { ap += (rec[k] - rPrev) * prec[k]; rPrev = rec[k]; }
    return { prec, rec, thr, ap };
  };
  MT.ap = (y, s) => MT.pr(y, s).ap;
  /* Pérdida logarítmica (entropía cruzada) binaria o multiclase (proba = [[p0, p1, ...]]) */
  MT.logloss = function (y, proba, eps = 1e-15) {
    let s = 0;
    for (let i = 0; i < y.length; i++) {
      const pi = Array.isArray(proba[i]) ? proba[i][y[i]] : y[i] === 1 ? proba[i] : 1 - proba[i];
      s -= Math.log(U.clamp(pi, eps, 1 - eps));
    }
    return s / y.length;
  };
  MT.brier = (y, p) => { let s = 0; for (let i = 0; i < y.length; i++) s += (p[i] - y[i]) ** 2; return s / y.length; };
  MT.accuracy = (y, p) => { let c = 0; for (let i = 0; i < y.length; i++) if (y[i] === p[i]) c++; return c / y.length; };
  /* Curva de fiabilidad con bins uniformes (sklearn.calibration.calibration_curve) */
  MT.calibration = function (y, p, nb = 10) {
    const sum = new Float64Array(nb), tru = new Float64Array(nb), cnt = new Float64Array(nb);
    for (let i = 0; i < y.length; i++) {
      let b = 0;
      while (b < nb - 1 && p[i] > (b + 1) / nb) b++;
      sum[b] += p[i]; tru[b] += y[i]; cnt[b]++;
    }
    const out = { pred: [], true: [], count: [], ece: 0 };
    for (let b = 0; b < nb; b++) if (cnt[b]) {
      out.pred.push(sum[b] / cnt[b]); out.true.push(tru[b] / cnt[b]); out.count.push(cnt[b]);
      out.ece += (cnt[b] / y.length) * Math.abs(sum[b] / cnt[b] - tru[b] / cnt[b]);
    }
    return out;
  };


  /* Regresión isotónica (pool adjacent violators): ajuste no decreciente de y sobre x.
     Devuelve f(x) con interpolación lineal entre los bloques, como IsotonicRegression. */
  MT.isotonic = function (x, y, w) {
    const idx = U.argsort(x);
    const blocks = [];
    for (const i of idx) {
      blocks.push({ s: y[i] * (w ? w[i] : 1), w: w ? w[i] : 1, x0: x[i], x1: x[i] });
      while (blocks.length > 1 && blocks[blocks.length - 2].s / blocks[blocks.length - 2].w >= blocks[blocks.length - 1].s / blocks[blocks.length - 1].w) {
        const b = blocks.pop(), a = blocks[blocks.length - 1];
        a.s += b.s; a.w += b.w; a.x1 = b.x1;
      }
    }
    const kx = [], ky = [];
    for (const b of blocks) { const v = b.s / b.w; kx.push(b.x0); ky.push(v); if (b.x1 > b.x0) { kx.push(b.x1); ky.push(v); } }
    const f = (v) => {
      if (v <= kx[0]) return ky[0];
      if (v >= kx[kx.length - 1]) return ky[ky.length - 1];
      let lo = 0, hi = kx.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (kx[m] <= v) lo = m; else hi = m; }
      const t = kx[hi] > kx[lo] ? (v - kx[lo]) / (kx[hi] - kx[lo]) : 0;
      return ky[lo] + t * (ky[hi] - ky[lo]);
    };
    return { f, kx, ky };
  };

  /* ---------- Agrupamiento ---------- */
  /* Coeficiente de silueta medio (clústeres de un solo punto → 0, como sklearn) */
  MT.silhouetteSamples = function (X, lab) {
    const n = X.length, ks = U.unique(lab);
    const size = {};
    ks.forEach((k) => { size[k] = 0; });
    lab.forEach((k) => { size[k]++; });
    const s = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const sums = {};
      ks.forEach((k) => { sums[k] = 0; });
      for (let j = 0; j < n; j++) if (j !== i) sums[lab[j]] += U.dist(X[i], X[j]);
      if (size[lab[i]] <= 1) { s[i] = 0; continue; }
      const a = sums[lab[i]] / (size[lab[i]] - 1);
      let b = Infinity;
      ks.forEach((k) => { if (k !== lab[i]) b = Math.min(b, sums[k] / size[k]); });
      s[i] = (b - a) / Math.max(a, b);
    }
    return s;
  };
  MT.silhouette = (X, lab) => ST.mean(MT.silhouetteSamples(X, lab));
  /* Índice de Rand ajustado */
  MT.ari = function (a, b) {
    const n = a.length, ka = U.unique(a), kb = U.unique(b);
    const ia = new Map(ka.map((k, i) => [k, i])), ib = new Map(kb.map((k, i) => [k, i]));
    const T = Array.from({ length: ka.length }, () => new Array(kb.length).fill(0));
    for (let i = 0; i < n; i++) T[ia.get(a[i])][ib.get(b[i])]++;
    const c2 = (x) => (x * (x - 1)) / 2;
    let sij = 0;
    for (const r of T) for (const v of r) sij += c2(v);
    const sa = U.sum(T.map((r) => c2(U.sum(r))));
    const sb = U.sum(kb.map((_, j) => c2(U.sum(T.map((r) => r[j])))));
    const exp = (sa * sb) / c2(n), mx = (sa + sb) / 2;
    return mx === exp ? 1 : (sij - exp) / (mx - exp);
  };
})(typeof window !== 'undefined' ? window : globalThis);
