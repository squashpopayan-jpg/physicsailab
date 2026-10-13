/* ===================================================================
   lib/30-linear.js — Modelos lineales: mínimos cuadrados con
   inferencia y diagnóstico, Ridge, Lasso, Elastic Net (descenso por
   coordenadas, mismo objetivo que scikit-learn), regresión logística
   binaria y multinomial (Newton, penalización L2 como C de sklearn),
   Huber y regresión cuantílica.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const LA = L.la, U = L.util, ST = L.stat;
  const LIN = (L.lin = {});

  const colMeans = (X) => { const p = X[0].length, m = new Float64Array(p); for (const r of X) for (let j = 0; j < p; j++) m[j] += r[j]; for (let j = 0; j < p; j++) m[j] /= X.length; return m; };

  /* Mínimos cuadrados por QR de Householder: minimiza ||A x − b||. Devuelve x o null. */
  LIN.lstsq = function (A, b) {
    const n = A.length, p = A[0].length;
    const R = A.map((r) => Float64Array.from(r)), q = Float64Array.from(b);
    for (let k = 0; k < p; k++) {
      let norm = 0;
      for (let i = k; i < n; i++) norm += R[i][k] * R[i][k];
      norm = Math.sqrt(norm);
      if (norm < 1e-300) return null;
      const alpha = R[k][k] > 0 ? -norm : norm;
      const v = new Float64Array(n);
      v[k] = R[k][k] - alpha;
      for (let i = k + 1; i < n; i++) v[i] = R[i][k];
      let vv = 0;
      for (let i = k; i < n; i++) vv += v[i] * v[i];
      if (vv < 1e-300) continue;
      for (let j = k; j < p; j++) {
        let s = 0;
        for (let i = k; i < n; i++) s += v[i] * R[i][j];
        s = (2 * s) / vv;
        for (let i = k; i < n; i++) R[i][j] -= s * v[i];
      }
      let s = 0;
      for (let i = k; i < n; i++) s += v[i] * q[i];
      s = (2 * s) / vv;
      for (let i = k; i < n; i++) q[i] -= s * v[i];
    }
    const x = new Float64Array(p);
    for (let i = p - 1; i >= 0; i--) {
      let s = q[i];
      for (let j = i + 1; j < p; j++) s -= R[i][j] * x[j];
      if (Math.abs(R[i][i]) < 1e-12 * Math.abs(R[0][0])) return null;
      x[i] = s / R[i][i];
    }
    return x;
  };

  /* Regresión lineal por mínimos cuadrados con intercepto y estadísticos de inferencia */
  LIN.ols = function (X, y, o = {}) {
    const n = X.length, p = X[0].length;
    const A = o.noIntercept ? X : X.map((r) => [1, ...r]);
    const k = A[0].length;
    const beta = LIN.lstsq(A, y);
    if (!beta) return null;
    const yhat = A.map((r) => LA.dot(r, beta));
    const res = y.map((v, i) => v - yhat[i]);
    const ym = ST.mean(y);
    const sse = U.sum(res.map((r) => r * r)), sst = U.sum(y.map((v) => (v - ym) ** 2));
    const df = n - k;
    const s2 = df > 0 ? sse / df : NaN;
    const out = {
      coef: o.noIntercept ? Array.from(beta) : Array.from(beta.slice(1)), intercept: o.noIntercept ? 0 : beta[0], beta: Array.from(beta),
      yhat, res, sse, sst, r2: 1 - sse / sst, n, p, df,
      r2adj: 1 - (sse / df) / (sst / (n - 1)), sigma: Math.sqrt(s2), mse: sse / n
    };
    out.predict = (Z) => Z.map((r) => (o.noIntercept ? 0 : beta[0]) + LA.dot(r, o.noIntercept ? beta : beta.slice(1)));
    if (o.stats !== false && df > 0) {
      const XtX = LA.zeros(k);
      for (const r of A) for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) XtX[i][j] += r[i] * r[j];
      const inv = LA.inv(XtX);
      if (inv) {
        out.se = beta.map((_, i) => Math.sqrt(s2 * inv[i][i]));
        out.t = Array.from(beta).map((b, i) => b / out.se[i]);
        out.pval = out.t.map((t) => 2 * (1 - ST.tCDF(Math.abs(t), df)));
        const tq = ST.tQuantile(0.975, df);
        out.ci = Array.from(beta).map((b, i) => [b - tq * out.se[i], b + tq * out.se[i]]);
        out.lev = A.map((r) => { let s = 0; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) s += r[i] * inv[i][j] * r[j]; return s; });
        out.cook = res.map((e, i) => (e * e) / (k * s2) * out.lev[i] / (1 - out.lev[i]) ** 2);
        out.stud = res.map((e, i) => e / Math.sqrt(s2 * (1 - out.lev[i])));
        const msr = (sst - sse) / Math.max(1, k - 1);
        out.F = msr / s2;
        out.inv = inv;
      }
    }
    return out;
  };


  /* Polinomios de Legendre P_1..P_d evaluados en u ∈ [−1, 1] (base bien condicionada) */
  LIN.legendre = function (u, d) {
    const out = new Array(d);
    let p0 = 1, p1 = u;
    for (let k = 1; k <= d; k++) {
      if (k === 1) out[0] = u;
      else { const p2 = ((2 * k - 1) * u * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; out[k - 1] = p2; }
    }
    return out;
  };
  /* Ajuste polinómico 1D de grado d en la base de Legendre sobre [a, b]; alpha = penalización Ridge */
  LIN.polyFit = function (x, y, d, o = {}) {
    const a = o.a === undefined ? -1.6 : o.a, b = o.b === undefined ? 1.6 : o.b;
    const u = (v) => (2 * (v - a)) / (b - a) - 1;
    if (d === 0) { const m = L.stat.mean(y); return { predict1: () => m, d }; }
    const F = x.map((v) => LIN.legendre(u(v), d));
    const m = LIN.ridge(F, y, o.alpha === undefined ? 1e-10 : o.alpha);
    return { d, coef: m.coef, intercept: m.intercept, predict1: (v) => m.intercept + LA.dot(LIN.legendre(u(v), d), m.coef) };
  };
  /* Mínimos cuadrados de norma mínima (λ → 0) o Ridge sin intercepto, en forma primal o dual */
  LIN.minNorm = function (Phi, y, lam = 1e-10) {
    const n = Phi.length, p = Phi[0].length;
    if (p <= n) {
      const A = LA.zeros(p), c = new Float64Array(p);
      for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) { c[j] += Phi[i][j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += Phi[i][j] * Phi[i][k]; }
      for (let j = 0; j < p; j++) A[j][j] += lam;
      return Array.from(LA.solve(A, c));
    }
    const K = LA.zeros(n);
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { let s = 0; for (let j = 0; j < p; j++) s += Phi[i][j] * Phi[k][j]; K[i][k] = s; }
    for (let i = 0; i < n; i++) K[i][i] += lam;
    const al = LA.solve(K, y), w = new Float64Array(p);
    for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) w[j] += Phi[i][j] * al[i];
    return Array.from(w);
  };

  /* Factores de inflación de la varianza: VIF_j = 1/(1 − R²_j) */
  LIN.vif = function (X) {
    const p = X[0].length;
    return U.range(p).map((j) => {
      const Xo = X.map((r) => r.filter((_, k) => k !== j));
      const yj = X.map((r) => r[j]);
      const m = LIN.ols(Xo, yj, { stats: false });
      return m ? 1 / Math.max(1e-12, 1 - m.r2) : Infinity;
    });
  };

  /* Ridge (sklearn): minimiza ||y − Xw − b||² + α||w||², intercepto sin penalizar */
  LIN.ridge = function (X, y, alpha) {
    const n = X.length, p = X[0].length;
    const mx = colMeans(X), my = ST.mean(y);
    const A = LA.zeros(p), c = new Float64Array(p);
    for (let i = 0; i < n; i++) {
      const r = X[i];
      for (let a = 0; a < p; a++) { const xa = r[a] - mx[a]; c[a] += xa * (y[i] - my); for (let b = 0; b < p; b++) A[a][b] += xa * (r[b] - mx[b]); }
    }
    for (let a = 0; a < p; a++) A[a][a] += alpha;
    const w = LA.solve(A, c);
    const b = my - LA.dot(w, mx);
    return { coef: Array.from(w), intercept: b, predict: (Z) => Z.map((r) => b + LA.dot(r, w)) };
  };

  /* Elastic Net (sklearn): (1/2n)||y − Xw − b||² + α·ρ||w||₁ + ½α(1−ρ)||w||², ρ = l1_ratio.
     Lasso = ρ = 1. Descenso por coordenadas cíclico sobre datos centrados. */
  LIN.enet = function (X, y, alpha, l1 = 1, o = {}) {
    const n = X.length, p = X[0].length;
    const mx = colMeans(X), my = ST.mean(y);
    const Xc = X.map((r) => r.map((v, j) => v - mx[j]));
    const yc = y.map((v) => v - my);
    const w = o.w0 ? Float64Array.from(o.w0) : new Float64Array(p);
    const z = new Float64Array(p);
    for (let j = 0; j < p; j++) for (let i = 0; i < n; i++) z[j] += Xc[i][j] * Xc[i][j];
    const r = yc.slice();
    for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) r[i] -= Xc[i][j] * w[j];
    const l1n = alpha * l1 * n, l2n = alpha * (1 - l1) * n;
    const tol = o.tol || 1e-10, maxIt = o.maxIt || 20000;
    let it = 0;
    for (; it < maxIt; it++) {
      let dmax = 0, wmax = 0;
      for (let j = 0; j < p; j++) {
        if (z[j] === 0) continue;
        const wj = w[j];
        let rho = 0;
        for (let i = 0; i < n; i++) rho += Xc[i][j] * (r[i] + Xc[i][j] * wj);
        const nw = Math.sign(rho) * Math.max(0, Math.abs(rho) - l1n) / (z[j] + l2n);
        if (nw !== wj) for (let i = 0; i < n; i++) r[i] -= Xc[i][j] * (nw - wj);
        w[j] = nw;
        dmax = Math.max(dmax, Math.abs(nw - wj));
        wmax = Math.max(wmax, Math.abs(nw));
      }
      if (dmax <= tol * Math.max(1, wmax)) break;
    }
    const b = my - LA.dot(w, mx);
    return { coef: Array.from(w), intercept: b, iters: it, predict: (Z) => Z.map((row) => b + LA.dot(row, w)) };
  };
  LIN.lasso = (X, y, alpha, o) => LIN.enet(X, y, alpha, 1, o);
  /* Camino de coeficientes para una rejilla de α (de mayor a menor, con arranque en caliente) */
  LIN.path = function (X, y, alphas, l1 = 1, o = {}) {
    let w0 = null;
    return alphas.map((a) => {
      const m = l1 === 0 ? LIN.ridge(X, y, a * X.length) : LIN.enet(X, y, a, l1, { w0, tol: o.tol });
      w0 = m.coef;
      return m;
    });
  };
  /* α mínimo que anula todos los coeficientes del Lasso: max |Xcᵀ yc| / n */
  LIN.alphaMax = function (X, y, l1 = 1) {
    const n = X.length, p = X[0].length, mx = colMeans(X), my = ST.mean(y);
    let m = 0;
    for (let j = 0; j < p; j++) { let s = 0; for (let i = 0; i < n; i++) s += (X[i][j] - mx[j]) * (y[i] - my); m = Math.max(m, Math.abs(s)); }
    return m / (n * l1);
  };

  /* Regresión logística binaria (sklearn): minimiza ½||w||² + C Σ log-loss; intercepto sin penalizar.
     Newton–Raphson; C = Infinity → sin penalización. sample weight opcional (class_weight). */
  LIN.logistic = function (X, y, o = {}) {
    const n = X.length, p = X[0].length, k = p + 1;
    const C = o.C === undefined ? 1 : o.C;
    const lam = isFinite(C) ? 1 / C : 0;
    const sw = o.weights || null;
    let w = new Float64Array(k);
    let it = 0;
    for (; it < (o.maxIt || 100); it++) {
      const g = new Float64Array(k), H = LA.zeros(k);
      for (let i = 0; i < n; i++) {
        const xi = X[i];
        let z = w[0];
        for (let j = 0; j < p; j++) z += w[j + 1] * xi[j];
        const pr = U.sigmoid(z), si = sw ? sw[i] : 1;
        const e = (pr - y[i]) * si, h = Math.max(pr * (1 - pr), 1e-12) * si;
        g[0] += e;
        H[0][0] += h;
        for (let a = 0; a < p; a++) {
          g[a + 1] += e * xi[a];
          H[0][a + 1] += h * xi[a];
          for (let b = a; b < p; b++) H[a + 1][b + 1] += h * xi[a] * xi[b];
        }
      }
      for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) H[a][b] = H[b][a];
      for (let a = 1; a < k; a++) { g[a] += lam * w[a]; H[a][a] += lam; }
      H[0][0] += 1e-10;
      if (!lam) for (let a = 1; a < k; a++) H[a][a] += 1e-10;
      const d = LA.solve(H, g);
      if (!d) break;
      let dn = 0;
      for (let a = 0; a < k; a++) { w[a] -= d[a]; dn = Math.max(dn, Math.abs(d[a])); }
      if (!isFinite(dn)) break;
      if (dn < 1e-12 * Math.max(1, ...Array.from(w).map(Math.abs))) { it++; break; }
    }
    const b = w[0], coef = Array.from(w.slice(1));
    const decision = (Z) => Z.map((r) => b + LA.dot(r, coef));
    return { coef, intercept: b, iters: it, decision, proba: (Z) => decision(Z).map(U.sigmoid), predict: (Z) => decision(Z).map((z) => (z >= 0 ? 1 : 0)) };
  };
  /* Pérdida logarística media y su gradiente para entrenamiento paso a paso (w = [b, w1, ...]) */
  LIN.logLossGrad = function (X, y, w, lam = 0, idx) {
    const p = X[0].length, g = new Float64Array(p + 1);
    let loss = 0;
    const I = idx || U.range(X.length);
    for (const i of I) {
      let z = w[0];
      for (let j = 0; j < p; j++) z += w[j + 1] * X[i][j];
      const pr = U.sigmoid(z);
      loss += U.softplus(z) - y[i] * z;
      const e = pr - y[i];
      g[0] += e;
      for (let j = 0; j < p; j++) g[j + 1] += e * X[i][j];
    }
    const m = I.length;
    for (let j = 0; j <= p; j++) g[j] /= m;
    loss /= m;
    for (let j = 1; j <= p; j++) { g[j] += lam * w[j]; loss += 0.5 * lam * w[j] * w[j]; }
    return { loss, g };
  };

  /* Regresión logística multinomial (softmax), penalización ½||W||²/C como sklearn (multinomial) */
  LIN.softmax = function (X, y, o = {}) {
    const n = X.length, p = X[0].length, K = o.K || Math.max(...y) + 1, d = p + 1;
    const C = o.C === undefined ? 1 : o.C, lam = isFinite(C) ? 1 / C : 0;
    const W = new Float64Array(K * d);
    const probs = (xi) => { const z = []; for (let c = 0; c < K; c++) { let s = W[c * d]; for (let j = 0; j < p; j++) s += W[c * d + j + 1] * xi[j]; z.push(s); } return U.softmax(z); };
    let it = 0;
    for (; it < (o.maxIt || 60); it++) {
      const D = K * d, g = new Float64Array(D), H = LA.zeros(D);
      for (let i = 0; i < n; i++) {
        const xi = [1, ...X[i]], pr = probs(X[i]);
        for (let c = 0; c < K; c++) {
          const e = pr[c] - (y[i] === c ? 1 : 0);
          for (let a = 0; a < d; a++) g[c * d + a] += e * xi[a];
          for (let c2 = 0; c2 < K; c2++) {
            const h = pr[c] * ((c === c2 ? 1 : 0) - pr[c2]);
            if (!h) continue;
            for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) H[c * d + a][c2 * d + b] += h * xi[a] * xi[b];
          }
        }
      }
      for (let c = 0; c < K; c++) {
        H[c * d][c * d] += 1e-9;
        for (let a = 1; a < d; a++) { g[c * d + a] += lam * W[c * d + a]; H[c * d + a][c * d + a] += lam || 1e-9; }
      }
      const step = LA.solve(H, g);
      if (!step) break;
      let dn = 0;
      for (let q = 0; q < D; q++) { W[q] -= step[q]; dn = Math.max(dn, Math.abs(step[q])); }
      if (dn < 1e-11) { it++; break; }
    }
    /* Centra los interceptos (suma cero) para fijar la redundancia del softmax */
    let mb = 0;
    for (let c = 0; c < K; c++) mb += W[c * d] / K;
    for (let c = 0; c < K; c++) W[c * d] -= mb;
    const coef = U.range(K).map((c) => Array.from(W.slice(c * d + 1, c * d + d)));
    const intercept = U.range(K).map((c) => W[c * d]);
    return { coef, intercept, K, iters: it, proba: (Z) => Z.map(probs), predict: (Z) => Z.map((r) => U.argmax(probs(r))) };
  };

  /* Regresión de Huber con escala fija s (por defecto 1.4826·MAD de los residuos de MCO), IRLS */
  LIN.huber = function (X, y, eps = 1.35, o = {}) {
    const n = X.length;
    let m = LIN.ols(X, y, { stats: false });
    let s = o.scale;
    if (!s) { const r = m.res.map(Math.abs); s = 1.4826 * ST.median(r) || 1; }
    let beta = m.beta;
    const A = X.map((r) => [1, ...r]);
    for (let it = 0; it < (o.maxIt || 100); it++) {
      const w = A.map((r, i) => { const e = Math.abs(y[i] - LA.dot(r, beta)) / s; return e <= eps ? 1 : eps / e; });
      const sw = w.map(Math.sqrt);
      const nb = LIN.lstsq(A.map((r, i) => r.map((v) => v * sw[i])), y.map((v, i) => v * sw[i]));
      if (!nb) break;
      let d = 0;
      for (let j = 0; j < nb.length; j++) d = Math.max(d, Math.abs(nb[j] - beta[j]));
      beta = Array.from(nb);
      if (d < 1e-10) break;
    }
    void n;
    return { intercept: beta[0], coef: beta.slice(1), scale: s, predict: (Z) => Z.map((r) => beta[0] + LA.dot(r, beta.slice(1))) };
  };

  /* Regresión cuantílica (pérdida pinball). Con una variable: solución exacta del
     programa lineal (la recta óptima pasa por dos datos). Si no, IRLS suavizado. */
  LIN.pinball = (r, tau) => (r >= 0 ? tau * r : (tau - 1) * r);
  LIN.quantile = function (X, y, tau = 0.5) {
    const n = X.length, p = X[0].length;
    const loss = (b0, b) => { let s = 0; for (let i = 0; i < n; i++) s += LIN.pinball(y[i] - b0 - LA.dot(X[i], b), tau); return s / n; };
    if (p === 1) {
      let best = null;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = X[j][0] - X[i][0];
        if (Math.abs(dx) < 1e-12) continue;
        const b1 = (y[j] - y[i]) / dx, b0 = y[i] - b1 * X[i][0];
        const l = loss(b0, [b1]);
        if (!best || l < best.l - 1e-15) best = { l, b0, b1 };
      }
      if (!best) best = { b0: ST.quantile(y, tau), b1: 0, l: loss(ST.quantile(y, tau), [0]) };
      return { intercept: best.b0, coef: [best.b1], loss: best.l, predict: (Z) => Z.map((r) => best.b0 + best.b1 * r[0]) };
    }
    const A = X.map((r) => [1, ...r]);
    let beta = Array.from(LIN.lstsq(A, y));
    for (let it = 0; it < 300; it++) {
      const w = A.map((r, i) => { const e = y[i] - LA.dot(r, beta); return (e >= 0 ? tau : 1 - tau) / Math.max(Math.abs(e), 1e-7); });
      const sw = w.map(Math.sqrt);
      const nb = LIN.lstsq(A.map((r, i) => r.map((v) => v * sw[i])), y.map((v, i) => v * sw[i]));
      if (!nb) break;
      beta = Array.from(nb);
    }
    return { intercept: beta[0], coef: beta.slice(1), loss: loss(beta[0], beta.slice(1)), predict: (Z) => Z.map((r) => beta[0] + LA.dot(r, beta.slice(1))) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
