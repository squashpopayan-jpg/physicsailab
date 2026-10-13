/* ===================================================================
   lib/80-cluster.js — Aprendizaje no supervisado: k-medias (Lloyd,
   k-means++), aglomerativo (simple, completo, promedio, Ward), DBSCAN,
   mezclas gaussianas (EM), PCA, t-SNE exacto, distancia de
   Mahalanobis y factor local de anomalía (LOF).
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util, LA = L.la;
  const CL = (L.clu = {});

  /* ---------- k-medias ---------- */
  CL.initPP = function (X, k, rng) {
    const n = X.length, C = [X[rng.int(n)].slice()];
    const d2 = X.map((x) => U.dist2(x, C[0]));
    while (C.length < k) {
      const s = U.sum(d2);
      let r = rng() * s, i = 0;
      for (; i < n - 1; i++) { r -= d2[i]; if (r <= 0) break; }
      C.push(X[i].slice());
      for (let q = 0; q < n; q++) d2[q] = Math.min(d2[q], U.dist2(X[q], X[i]));
    }
    return C;
  };
  CL.initRandom = (X, k, rng) => rng.perm(X.length).slice(0, k).map((i) => X[i].slice());
  CL.assign = function (X, C) {
    let inertia = 0;
    const lab = X.map((x) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = U.dist2(x, c); if (d < bd) { bd = d; b = j; } }); inertia += bd; return b; });
    return { lab, inertia };
  };
  CL.update = function (X, lab, k, Cold) {
    const p = X[0].length, S = Array.from({ length: k }, () => new Float64Array(p)), n = new Array(k).fill(0);
    X.forEach((x, i) => { n[lab[i]]++; for (let d = 0; d < p; d++) S[lab[i]][d] += x[d]; });
    return S.map((s, j) => (n[j] ? Array.from(s, (v) => v / n[j]) : Cold[j].slice()));
  };
  /* Lloyd hasta convergencia; o = {init: 'pp'|'random'|centros, rng, maxIt, nInit} */
  CL.kmeans = function (X, k, o = {}) {
    const rng = o.rng || L.rng(0);
    let best = null;
    for (let r = 0; r < (o.nInit || 1); r++) {
      let C = Array.isArray(o.init) ? o.init.map((c) => c.slice()) : o.init === 'random' ? CL.initRandom(X, k, rng) : CL.initPP(X, k, rng);
      let a = CL.assign(X, C), it = 0;
      for (; it < (o.maxIt || 300); it++) {
        const C2 = CL.update(X, a.lab, k, C);
        const shift = Math.max(...C2.map((c, j) => U.dist2(c, C[j])));
        C = C2;
        a = CL.assign(X, C);
        if (shift < 1e-14) break;
      }
      if (!best || a.inertia < best.inertia) best = { C, lab: a.lab, inertia: a.inertia, iters: it + 1 };
    }
    return best;
  };

  /* ---------- Aglomerativo (Lance–Williams) ----------
     Devuelve merges [[a, b, distancia, tamaño]] con ids estilo SciPy (n..2n−2). */
  CL.agglo = function (X, method = 'ward') {
    const n = X.length;
    const D = Array.from({ length: n }, (_, i) => new Float64Array(n).map((_, j) => (method === 'ward' ? U.dist2(X[i], X[j]) : U.dist(X[i], X[j]))));
    const active = new Array(n).fill(true), size = new Array(n).fill(1), id = U.range(n);
    const merges = [];
    for (let step = 0; step < n - 1; step++) {
      let bi = -1, bj = -1, bd = Infinity;
      for (let i = 0; i < n; i++) if (active[i]) for (let j = i + 1; j < n; j++) if (active[j] && D[i][j] < bd) { bd = D[i][j]; bi = i; bj = j; }
      const ni = size[bi], nj = size[bj];
      for (let k = 0; k < n; k++) {
        if (!active[k] || k === bi || k === bj) continue;
        const nk = size[k];
        let v;
        if (method === 'single') v = Math.min(D[bi][k], D[bj][k]);
        else if (method === 'complete') v = Math.max(D[bi][k], D[bj][k]);
        else if (method === 'average') v = (ni * D[bi][k] + nj * D[bj][k]) / (ni + nj);
        else v = ((ni + nk) * D[bi][k] + (nj + nk) * D[bj][k] - nk * D[bi][bj]) / (ni + nj + nk);
        D[bi][k] = D[k][bi] = v;
      }
      const a = id[bi], b = id[bj];
      merges.push([Math.min(a, b), Math.max(a, b), method === 'ward' ? Math.sqrt(Math.max(0, bd)) : bd, ni + nj]);
      active[bj] = false;
      size[bi] = ni + nj;
      id[bi] = n + step;
    }
    return merges;
  };
  /* Etiquetas al cortar en k grupos */
  CL.cutK = function (merges, n, k) {
    const parent = U.range(2 * n - 1);
    const find = (a) => { while (parent[a] !== a) a = parent[a] = parent[parent[a]]; return a; };
    for (let s = 0; s < n - k; s++) { const [a, b] = merges[s]; parent[find(a)] = n + s; parent[find(b)] = n + s; }
    const roots = new Map();
    return U.range(n).map((i) => { const r = find(i); if (!roots.has(r)) roots.set(r, roots.size); return roots.get(r); });
  };

  /* ---------- DBSCAN ---------- */
  CL.dbscan = function (X, eps, minPts) {
    const n = X.length, lab = new Array(n).fill(-2), core = new Array(n).fill(false);
    const nb = X.map((x) => U.range(n).filter((j) => U.dist(x, X[j]) <= eps));
    nb.forEach((v, i) => { core[i] = v.length >= minPts; });
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (lab[i] !== -2 || !core[i]) continue;
      const q = [i];
      lab[i] = c;
      while (q.length) {
        const a = q.pop();
        if (!core[a]) continue;
        for (const b of nb[a]) if (lab[b] < 0) { lab[b] = c; q.push(b); }
      }
      c++;
    }
    return { lab: lab.map((v) => (v === -2 ? -1 : v)), core, nClusters: c };
  };
  /* Distancia al k-ésimo vecino de cada punto (gráfica de codo para elegir eps) */
  CL.kdist = (X, k) => X.map((x, i) => { const d = X.map((z, j) => (i === j ? Infinity : U.dist(x, z))).sort((a, b) => a - b); return d[k - 1]; });

  /* ---------- Mezcla gaussiana (EM, covarianza completa) ---------- */
  CL.gmmInit = function (X, k, rng) {
    const km = CL.kmeans(X, k, { rng, nInit: 1 });
    const p = X[0].length;
    const comps = km.C.map((m, j) => {
      const pts = X.filter((_, i) => km.lab[i] === j);
      const S = pts.length > p ? L.gen.covOf(pts, m, 0) : LA.eye(p);
      for (let d = 0; d < p; d++) S[d][d] += 1e-6;
      return { w: Math.max(pts.length, 1) / X.length, m: Array.from(m), S };
    });
    return comps;
  };
  /* Un paso E + M. Devuelve {comps, resp, ll (log-verosimilitud media)} */
  CL.gmmStep = function (X, comps, reg = 1e-6) {
    const n = X.length, k = comps.length, p = X[0].length;
    const pre = comps.map((c) => ({ Pi: LA.inv(c.S), ld: L.gen.logdet(c.S) }));
    let ll = 0;
    const R = X.map((x) => {
      const lg = comps.map((c, j) => Math.log(c.w) + L.gen.logN(x, c.m, pre[j].Pi, pre[j].ld));
      const m = Math.max(...lg);
      const e = lg.map((v) => Math.exp(v - m)), s = U.sum(e);
      ll += m + Math.log(s);
      return e.map((v) => v / s);
    });
    const nc = comps.map(() => 0);
    const out = comps.map((c, j) => {
      let Nk = 0;
      const m = new Float64Array(p);
      for (let i = 0; i < n; i++) { Nk += R[i][j]; for (let d = 0; d < p; d++) m[d] += R[i][j] * X[i][d]; }
      for (let d = 0; d < p; d++) m[d] /= Nk;
      const S = LA.zeros(p);
      for (let i = 0; i < n; i++) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += R[i][j] * (X[i][a] - m[a]) * (X[i][b] - m[b]);
      for (let a = 0; a < p; a++) { for (let b = 0; b < p; b++) S[a][b] /= Nk; S[a][a] += reg; }
      nc[j] = Nk;
      return { w: Nk / n, m: Array.from(m), S };
    });
    return { comps: out, resp: R, ll: ll / n };
  };
  CL.gmmLL = function (X, comps) {
    const pre = comps.map((c) => ({ Pi: LA.inv(c.S), ld: L.gen.logdet(c.S) }));
    let ll = 0;
    for (const x of X) { const lg = comps.map((c, j) => Math.log(c.w) + L.gen.logN(x, c.m, pre[j].Pi, pre[j].ld)); const m = Math.max(...lg); ll += m + Math.log(U.sum(lg.map((v) => Math.exp(v - m)))); }
    return ll / X.length;
  };
  CL.gmm = function (X, k, o = {}) {
    let comps = o.init || CL.gmmInit(X, k, o.rng || L.rng(0));
    let prev = -Infinity, r = null, it = 0;
    for (; it < (o.maxIt || 500); it++) {
      r = CL.gmmStep(X, comps, o.reg);
      comps = r.comps;
      if (Math.abs(r.ll - prev) < (o.tol || 1e-10)) break;
      prev = r.ll;
    }
    const ll = CL.gmmLL(X, comps), p = X[0].length;
    const nPar = k * (p + (p * (p + 1)) / 2) + k - 1;
    return { comps, ll, iters: it, bic: -2 * ll * X.length + nPar * Math.log(X.length), resp: r.resp };
  };

  /* ---------- PCA ---------- */
  const DR = (L.dr = {});
  DR.pca = function (X) {
    const n = X.length, p = X[0].length;
    const mean = new Float64Array(p);
    for (const r of X) for (let j = 0; j < p; j++) mean[j] += r[j] / n;
    const S = LA.zeros(p);
    for (const r of X) for (let a = 0; a < p; a++) for (let b = a; b < p; b++) S[a][b] += (r[a] - mean[a]) * (r[b] - mean[b]) / (n - 1);
    for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) S[a][b] = S[b][a];
    const e = LA.eigh(S);
    const order = U.range(p).reverse();
    const vals = order.map((i) => Math.max(0, e.values[i]));
    /* Componentes como filas; signo: la mayor componente en valor absoluto, positiva */
    const comps = order.map((i) => {
      const v = U.range(p).map((r) => e.vectors[r][i]);
      const big = v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);
      return big < 0 ? v.map((x) => -x) : v;
    });
    const tot = U.sum(vals);
    return {
      mean: Array.from(mean), comps, var: vals, ratio: vals.map((v) => v / tot), cov: S,
      transform: (Z, k = p) => Z.map((r) => comps.slice(0, k).map((c) => U.sum(c.map((w, j) => w * (r[j] - mean[j]))))),
      inverse: (T) => T.map((t) => { const out = Array.from(mean); t.forEach((s, q) => { for (let j = 0; j < p; j++) out[j] += s * comps[q][j]; }); return out; })
    };
  };

  /* ---------- t-SNE exacto (para n ≲ 400) ---------- */
  DR.tsne = function (X, o = {}) {
    const n = X.length, perp = o.perplexity || 30, rng = o.rng || L.rng(5);
    const D = X.map((a) => X.map((b) => U.dist2(a, b)));
    const P = Array.from({ length: n }, () => new Float64Array(n));
    const H = Math.log(perp);
    for (let i = 0; i < n; i++) {
      /* Distancias desplazadas por la mínima (no cambia P normalizada y evita que exp se anule) */
      let dmin = Infinity;
      for (let j = 0; j < n; j++) if (j !== i && D[i][j] < dmin) dmin = D[i][j];
      const Di = D[i].map((v) => v - dmin);
      let dmean = 0;
      for (let j = 0; j < n; j++) if (j !== i) dmean += Di[j] / (n - 1);
      let lo = 0, hi = Infinity, beta = 1 / Math.max(dmean, 1e-12);
      for (let t = 0; t < 100; t++) {
        let s = 0, sh = 0;
        for (let j = 0; j < n; j++) { if (j === i) { P[i][j] = 0; continue; } const v = Math.exp(-Di[j] * beta); P[i][j] = v; s += v; sh += beta * Di[j] * v; }
        const Hc = Math.log(s) + sh / s;
        for (let j = 0; j < n; j++) P[i][j] /= s;
        if (Math.abs(Hc - H) < 1e-6) break;
        if (Hc > H) { lo = beta; beta = hi === Infinity ? beta * 2 : (beta + hi) / 2; } else { hi = beta; beta = (beta + lo) / 2; }
      }
    }
    const Pj = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Pj[i][j] = Math.max((P[i][j] + P[j][i]) / (2 * n), 1e-12);
    const Y = Array.from({ length: n }, () => [1e-4 * rng.gauss(), 1e-4 * rng.gauss()]);
    const V = Array.from({ length: n }, () => [0, 0]), gains = Array.from({ length: n }, () => [1, 1]);
    let it = 0, kl = NaN;
    const step = (iters = 1) => {
      for (let s = 0; s < iters; s++) {
        const exag = it < (o.exagIters || 100) ? o.exag || 12 : 1;
        const mom = it < 250 ? 0.5 : 0.8;
        const lr = o.lr || Math.max(n / 12 / 4, 50);
        const Q = Array.from({ length: n }, () => new Float64Array(n));
        let Z = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const q = 1 / (1 + U.dist2(Y[i], Y[j])); Q[i][j] = Q[j][i] = q; Z += 2 * q; }
        kl = 0;
        const G = [];
        for (let i = 0; i < n; i++) {
          let gx = 0, gy = 0;
          for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const q = Q[i][j], m = (exag * Pj[i][j] - q / Z) * q;
            gx += 4 * m * (Y[i][0] - Y[j][0]); gy += 4 * m * (Y[i][1] - Y[j][1]);
            if (exag === 1) kl += Pj[i][j] * Math.log(Pj[i][j] / Math.max(q / Z, 1e-12));
          }
          G.push([gx, gy]);
        }
        for (let i = 0; i < n; i++) for (let d = 0; d < 2; d++) {
          const g = G[i][d];
          gains[i][d] = Math.sign(g) !== Math.sign(V[i][d]) ? gains[i][d] + 0.2 : Math.max(0.01, gains[i][d] * 0.8);
          V[i][d] = mom * V[i][d] - lr * gains[i][d] * g;
          Y[i][d] += V[i][d];
        }
        const my = [ML.L.stat.mean(Y.map((r) => r[0])), ML.L.stat.mean(Y.map((r) => r[1]))];
        for (const r of Y) { r[0] -= my[0]; r[1] -= my[1]; }
        it++;
      }
      return Y;
    };
    return { Y, step, get it() { return it; }, get kl() { return kl; }, P: Pj };
  };

  /* ---------- Anomalías ---------- */
  const AN = (L.anom = {});
  AN.mahalanobis = function (X) {
    const m = L.gen.meanOf(X), S = L.gen.covOf(X, m), Pi = LA.inv(S);
    const d1 = (x) => { let q = 0; for (let a = 0; a < m.length; a++) for (let b = 0; b < m.length; b++) q += (x[a] - m[a]) * Pi[a][b] * (x[b] - m[b]); return Math.sqrt(Math.max(0, q)); };
    return { mean: Array.from(m), S, d1, d: (Z) => Z.map(d1) };
  };
  /* Factor local de anomalía (LOF) con k vecinos; valores ≫ 1 indican anomalía */
  AN.lof = function (X, k = 10) {
    const n = X.length;
    const nb = X.map((x, i) => L.knn.neighbors(X, x, k, 'euclid', i));
    const kd = nb.map((v) => v[v.length - 1][0]);
    const lrd = nb.map((v) => 1 / (U.sum(v.map(([d, j]) => Math.max(d, kd[j]))) / v.length || 1e-12));
    const lof = nb.map((v, i) => U.sum(v.map(([, j]) => lrd[j])) / v.length / lrd[i]);
    const score1 = (x) => {
      const v = L.knn.neighbors(X, x, k);
      const l = 1 / (U.sum(v.map(([d, j]) => Math.max(d, kd[j]))) / v.length || 1e-12);
      return U.sum(v.map(([, j]) => lrd[j])) / v.length / l;
    };
    void n;
    return { lof, lrd, score1 };
  };
})(typeof window !== 'undefined' ? window : globalThis);
