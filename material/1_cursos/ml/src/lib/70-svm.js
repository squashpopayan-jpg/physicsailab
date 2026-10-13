/* ===================================================================
   lib/70-svm.js — Máquina de vectores de soporte binaria (C-SVC).
   Resuelve el dual con SMO y selección de pares de segundo orden
   (Fan, Chen y Lin, 2005), el mismo algoritmo de LIBSVM que usa
   sklearn.svm.SVC. Núcleos: lineal, RBF y polinómico.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util;
  const SV = (L.svm = {});

  SV.kernel = function (o = {}) {
    const kind = o.kernel || 'rbf', g = o.gamma === undefined ? 1 : o.gamma, d = o.degree || 3, c0 = o.coef0 || 0;
    if (kind === 'linear') return (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
    if (kind === 'poly') return (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return Math.pow(g * s + c0, d); };
    return (a, b) => Math.exp(-g * U.dist2(a, b));
  };
  /* gamma = 'scale' de sklearn: 1 / (p · Var(X)) */
  SV.gammaScale = function (X) {
    const all = [];
    for (const r of X) for (const v of r) all.push(v);
    return 1 / (X[0].length * L.stat.variance(all, 0));
  };

  /* y en {0, 1}. o = {C, kernel, gamma, degree, coef0, tol, maxIt, weights:[w0, w1]} */
  SV.fit = function (X, y01, o = {}) {
    const n = X.length, C = o.C === undefined ? 1 : o.C;
    const Cw = o.weights ? y01.map((v) => C * o.weights[v]) : new Array(n).fill(C);
    const y = y01.map((v) => (v === 1 ? 1 : -1));
    const k = SV.kernel(o);
    const Kc = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = k(X[i], X[j]); Kc[i][j] = v; Kc[j][i] = v; }
    const QD = Kc.map((r, i) => r[i]);
    const alpha = new Float64Array(n), G = new Float64Array(n).fill(-1);
    const eps = o.tol || 1e-3, TAU = 1e-12;
    const up = (t) => alpha[t] >= Cw[t];
    const low = (t) => alpha[t] <= 0;
    let it = 0;
    const maxIt = o.maxIt || Math.max(10000000, 100 * n);
    for (; it < maxIt; it++) {
      let Gmax = -Infinity, Gmax2 = -Infinity, gi = -1, gj = -1, objMin = Infinity;
      for (let t = 0; t < n; t++) {
        if (y[t] === 1) { if (!up(t) && -G[t] >= Gmax) { Gmax = -G[t]; gi = t; } }
        else if (!low(t) && G[t] >= Gmax) { Gmax = G[t]; gi = t; }
      }
      const i = gi;
      if (i < 0) break;
      for (let j = 0; j < n; j++) {
        const Qij = y[i] * y[j] * Kc[i][j];
        if (y[j] === 1) {
          if (!low(j)) {
            const gd = Gmax + G[j];
            if (G[j] >= Gmax2) Gmax2 = G[j];
            if (gd > 0) { const qc = QD[i] + QD[j] - 2 * y[i] * Qij; const od = -(gd * gd) / (qc > 0 ? qc : TAU); if (od <= objMin) { gj = j; objMin = od; } }
          }
        } else if (!up(j)) {
          const gd = Gmax - G[j];
          if (-G[j] >= Gmax2) Gmax2 = -G[j];
          if (gd > 0) { const qc = QD[i] + QD[j] + 2 * y[i] * Qij; const od = -(gd * gd) / (qc > 0 ? qc : TAU); if (od <= objMin) { gj = j; objMin = od; } }
        }
      }
      if (Gmax + Gmax2 < eps || gj < 0) break;
      const j = gj;
      const Qij = y[i] * y[j] * Kc[i][j], Ci = Cw[i], Cj = Cw[j];
      const ai = alpha[i], aj = alpha[j];
      if (y[i] !== y[j]) {
        let qc = QD[i] + QD[j] + 2 * Qij;
        if (qc <= 0) qc = TAU;
        const delta = (-G[i] - G[j]) / qc, diff = alpha[i] - alpha[j];
        alpha[i] += delta; alpha[j] += delta;
        if (diff > 0) { if (alpha[j] < 0) { alpha[j] = 0; alpha[i] = diff; } } else if (alpha[i] < 0) { alpha[i] = 0; alpha[j] = -diff; }
        if (diff > Ci - Cj) { if (alpha[i] > Ci) { alpha[i] = Ci; alpha[j] = Ci - diff; } } else if (alpha[j] > Cj) { alpha[j] = Cj; alpha[i] = Cj + diff; }
      } else {
        let qc = QD[i] + QD[j] - 2 * Qij;
        if (qc <= 0) qc = TAU;
        const delta = (G[i] - G[j]) / qc, sum = alpha[i] + alpha[j];
        alpha[i] -= delta; alpha[j] += delta;
        if (sum > Ci) { if (alpha[i] > Ci) { alpha[i] = Ci; alpha[j] = sum - Ci; } } else if (alpha[j] < 0) { alpha[j] = 0; alpha[i] = sum; }
        if (sum > Cj) { if (alpha[j] > Cj) { alpha[j] = Cj; alpha[i] = sum - Cj; } } else if (alpha[i] < 0) { alpha[i] = 0; alpha[j] = sum; }
      }
      const dai = alpha[i] - ai, daj = alpha[j] - aj;
      for (let t = 0; t < n; t++) G[t] += y[i] * y[t] * Kc[i][t] * dai + y[j] * y[t] * Kc[j][t] * daj;
    }
    /* ρ (sesgo con signo cambiado) */
    let nf = 0, sf = 0, ub = Infinity, lb = -Infinity;
    for (let t = 0; t < n; t++) {
      const yG = y[t] * G[t];
      if (up(t)) { if (y[t] === -1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else if (low(t)) { if (y[t] === 1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else { nf++; sf += yG; }
    }
    const rho = nf > 0 ? sf / nf : (ub + lb) / 2;
    const sv = U.range(n).filter((t) => alpha[t] > 1e-12);
    const coef = sv.map((t) => alpha[t] * y[t]);
    const SVX = sv.map((t) => X[t]);
    const decision1 = (x) => { let s = -rho; for (let q = 0; q < sv.length; q++) s += coef[q] * k(SVX[q], x); return s; };
    let w = null;
    if ((o.kernel || 'rbf') === 'linear') { w = new Float64Array(X[0].length); sv.forEach((t, q) => { for (let d = 0; d < w.length; d++) w[d] += coef[q] * X[t][d]; }); w = Array.from(w); }
    /* Variables primales: margen funcional y_i f(x_i) */
    const margins = U.range(n).map((t) => y[t] * decision1(X[t]));
    return {
      alpha: Array.from(alpha), sv, coef, rho, b: -rho, w, iters: it, C, margins,
      bounded: sv.filter((t) => alpha[t] >= Cw[t] - 1e-9),
      decision1, decision: (Z) => Z.map(decision1), predict: (Z) => Z.map((x) => (decision1(x) >= 0 ? 1 : 0))
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
