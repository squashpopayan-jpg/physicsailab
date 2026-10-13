/* ===================================================================
   lib/60-tree.js — Árboles CART (clasificación con Gini/entropía y
   regresión con error cuadrático), poda de costo–complejidad,
   bosques aleatorios y bagging (con OOB), AdaBoost (SAMME),
   gradient boosting (cuadrático y log-loss) y bosque de aislamiento.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util;
  const T = (L.tree = {});

  const log2 = (x) => Math.log(x) / Math.LN2;
  const imp = {
    gini(c, W) { if (W <= 0) return 0; let s = 0; for (const v of c) s += (v / W) ** 2; return 1 - s; },
    entropy(c, W) { if (W <= 0) return 0; let s = 0; for (const v of c) if (v > 0) { const q = v / W; s -= q * log2(q); } return s; }
  };
  T.impurity = imp;

  /* Ajusta un árbol. o = {task:'clf'|'reg', K, criterion, maxDepth, minLeaf, minSplit,
     maxFeatures, minDecrease, rng, weights, idx (subconjunto de filas)} */
  T.fit = function (X, y, o = {}) {
    const task = o.task || 'clf';
    const p = X[0].length;
    const K = task === 'clf' ? o.K || Math.max(...y) + 1 : 0;
    const crit = o.criterion || (task === 'clf' ? 'gini' : 'mse');
    const maxDepth = o.maxDepth === undefined || o.maxDepth === null ? Infinity : o.maxDepth;
    const minLeaf = o.minLeaf || 1, minSplit = Math.max(2, o.minSplit || 2);
    const mf = Math.min(p, o.maxFeatures || p);
    const minDec = o.minDecrease || 0;
    const w = o.weights || null;
    const rng = o.rng || L.rng(0);
    const rows = o.idx ? o.idx.slice() : U.range(X.length);
    let Wtot = 0;
    for (const i of rows) Wtot += w ? w[i] : 1;
    const nodes = [];
    const stats = (I) => {
      if (task === 'clf') {
        const c = new Float64Array(K);
        let W = 0;
        for (const i of I) { const wi = w ? w[i] : 1; c[y[i]] += wi; W += wi; }
        return { c, W, imp: imp[crit](c, W) };
      }
      let W = 0, s = 0, s2 = 0;
      for (const i of I) { const wi = w ? w[i] : 1; W += wi; s += wi * y[i]; s2 += wi * y[i] * y[i]; }
      const m = s / W;
      return { mean: m, W, imp: Math.max(0, s2 / W - m * m) };
    };
    const build = (I, depth) => {
      const st = stats(I);
      const node = { id: nodes.length, n: I.length, W: st.W, imp: st.imp, depth, leaf: true };
      if (task === 'clf') { node.counts = Array.from(st.c); node.value = node.counts.map((v) => v / st.W); }
      else node.value = st.mean;
      nodes.push(node);
      if (depth >= maxDepth || I.length < minSplit || I.length < 2 * minLeaf || st.imp <= 1e-14) return node;
      let best = null;
      const feats = mf < p ? rng.perm(p).slice(0, mf) : U.range(p);
      for (const f of feats) {
        const S = I.slice().sort((a, b) => X[a][f] - X[b][f]);
        const m = S.length;
        if (X[S[0]][f] === X[S[m - 1]][f]) continue;
        if (task === 'clf') {
          const cl = new Float64Array(K), cr = Float64Array.from(st.c);
          let Wl = 0, Wr = st.W;
          for (let k = 0; k < m - 1; k++) {
            const i = S[k], wi = w ? w[i] : 1;
            cl[y[i]] += wi; cr[y[i]] -= wi; Wl += wi; Wr -= wi;
            const a = X[i][f], b = X[S[k + 1]][f];
            if (a === b || k + 1 < minLeaf || m - k - 1 < minLeaf) continue;
            const dec = st.W * st.imp - (Wl * imp[crit](cl, Wl) + Wr * imp[crit](cr, Wr));
            if (!best || dec > best.dec + 1e-12) { let thr = (a + b) / 2; if (thr === b) thr = a; best = { dec, f, thr, k }; }
          }
        } else {
          let Wl = 0, sl = 0, ql = 0;
          let Wr = 0, sr = 0, qr = 0;
          for (const i of S) { const wi = w ? w[i] : 1; Wr += wi; sr += wi * y[i]; qr += wi * y[i] * y[i]; }
          for (let k = 0; k < m - 1; k++) {
            const i = S[k], wi = w ? w[i] : 1, v = y[i];
            Wl += wi; sl += wi * v; ql += wi * v * v; Wr -= wi; sr -= wi * v; qr -= wi * v * v;
            const a = X[i][f], b = X[S[k + 1]][f];
            if (a === b || k + 1 < minLeaf || m - k - 1 < minLeaf) continue;
            const il = Math.max(0, ql / Wl - (sl / Wl) ** 2), ir = Math.max(0, qr / Wr - (sr / Wr) ** 2);
            const dec = st.W * st.imp - (Wl * il + Wr * ir);
            if (!best || dec > best.dec + 1e-12) { let thr = (a + b) / 2; if (thr === b) thr = a; best = { dec, f, thr, k }; }
          }
        }
      }
      if (!best || best.dec / Wtot < minDec || best.dec <= 1e-14) return node;
      const left = [], right = [];
      for (const i of I) (X[i][best.f] <= best.thr ? left : right).push(i);
      node.leaf = false;
      node.feature = best.f;
      node.thr = best.thr;
      node.gain = best.dec / Wtot;
      node.left = build(left, depth + 1);
      node.right = build(right, depth + 1);
      return node;
    };
    const rootNode = build(rows, 0);
    const tree = { root: rootNode, nodes, task, K, p, crit, Wtot };
    return T.wrap(tree);
  };

  /* Añade métodos de predicción a una estructura de árbol */
  T.wrap = function (tree) {
    const leafOf = (x) => { let nd = tree.root; while (!nd.leaf) nd = x[nd.feature] <= nd.thr ? nd.left : nd.right; return nd; };
    tree.leafOf = leafOf;
    tree.value1 = (x) => leafOf(x).value;
    tree.predict = (Z) => Z.map((x) => (tree.task === 'clf' ? U.argmax(leafOf(x).value) : leafOf(x).value));
    tree.proba = (Z) => Z.map((x) => leafOf(x).value);
    tree.leaves = () => { const out = []; const walk = (nd) => { if (nd.leaf) out.push(nd); else { walk(nd.left); walk(nd.right); } }; walk(tree.root); return out; };
    tree.depth = () => Math.max(...tree.leaves().map((n) => n.depth));
    tree.importances = () => {
      const imp2 = new Float64Array(tree.p);
      const walk = (nd) => { if (nd.leaf) return; imp2[nd.feature] += nd.W * nd.imp - nd.left.W * nd.left.imp - nd.right.W * nd.right.imp; walk(nd.left); walk(nd.right); };
      walk(tree.root);
      const s = U.sum(imp2);
      return Array.from(imp2, (v) => (s > 0 ? v / s : 0));
    };
    /* Camino de nodos (para explicar una predicción) */
    tree.path = (x) => { const out = []; let nd = tree.root; while (!nd.leaf) { out.push(nd); nd = x[nd.feature] <= nd.thr ? nd.left : nd.right; } out.push(nd); return out; };
    return tree;
  };

  /* Poda de costo–complejidad: secuencia de α efectivos (como cost_complexity_pruning_path) */
  T.prunePath = function (tree) {
    const N = tree.Wtot;
    const R = (nd) => (nd.W / N) * nd.imp;
    const clone = (nd) => (nd.leaf ? { ...nd } : { ...nd, left: clone(nd.left), right: clone(nd.right) });
    let rootN = clone(tree.root);
    const leaves = (nd) => (nd.leaf ? [nd] : [...leaves(nd.left), ...leaves(nd.right)]);
    const alphas = [0], imps = [U.sum(leaves(rootN).map(R))], sizes = [leaves(rootN).length];
    const trees = [rootN];
    while (!rootN.leaf) {
      let best = null;
      const walk = (nd) => {
        if (nd.leaf) return;
        const lv = leaves(nd);
        const g = (R(nd) - U.sum(lv.map(R))) / (lv.length - 1);
        if (!best || g < best.g - 1e-15) best = { g, nd };
        walk(nd.left); walk(nd.right);
      };
      walk(rootN);
      rootN = clone(rootN);
      const target = best.nd.id;
      const cut = (nd) => { if (nd.id === target) { nd.leaf = true; delete nd.left; delete nd.right; return; } if (!nd.leaf) { cut(nd.left); cut(nd.right); } };
      cut(rootN);
      alphas.push(Math.max(0, best.g));
      imps.push(U.sum(leaves(rootN).map(R)));
      sizes.push(leaves(rootN).length);
      trees.push(rootN);
    }
    return { alphas, impurities: imps, sizes, trees };
  };
  /* Árbol podado para un α dado */
  T.prune = function (tree, alpha, path) {
    path = path || T.prunePath(tree);
    let k = 0;
    for (let i = 0; i < path.alphas.length; i++) if (path.alphas[i] <= alpha + 1e-15) k = i;
    const nodes = [];
    const walk = (nd) => { nodes.push(nd); if (!nd.leaf) { walk(nd.left); walk(nd.right); } };
    walk(path.trees[k]);
    return T.wrap({ root: path.trees[k], nodes, task: tree.task, K: tree.K, p: tree.p, crit: tree.crit, Wtot: tree.Wtot });
  };

  /* ---------- Bosques aleatorios y bagging ---------- */
  const E = (L.ens = {});
  /* o = {nTrees, maxFeatures, maxDepth, minLeaf, bootstrap, rng, task, K} */
  E.forest = function (X, y, o = {}) {
    const n = X.length, p = X[0].length, task = o.task || 'clf';
    const K = task === 'clf' ? o.K || Math.max(...y) + 1 : 0;
    const rng = o.rng || L.rng(1);
    const mf = o.maxFeatures || (task === 'clf' ? Math.max(1, Math.round(Math.sqrt(p))) : p);
    const trees = [], bags = [];
    for (let t = 0; t < (o.nTrees || 100); t++) {
      const idx = o.bootstrap === false ? U.range(n) : Array.from({ length: n }, () => rng.int(n));
      const inb = new Uint8Array(n);
      for (const i of idx) inb[i] = 1;
      bags.push(inb);
      trees.push(T.fit(X, y, { task, K, idx, maxFeatures: mf, maxDepth: o.maxDepth, minLeaf: o.minLeaf, criterion: o.criterion, rng }));
    }
    const f = { trees, bags, task, K };
    f.proba1 = (x, m) => { const v = new Float64Array(K); const M = m || trees.length; for (let t = 0; t < M; t++) { const pr = trees[t].value1(x); for (let c = 0; c < K; c++) v[c] += pr[c] / M; } return Array.from(v); };
    f.value1 = (x, m) => { const M = m || trees.length; let s = 0; for (let t = 0; t < M; t++) s += trees[t].value1(x); return s / M; };
    f.predict = (Z, m) => Z.map((x) => (task === 'clf' ? U.argmax(f.proba1(x, m)) : f.value1(x, m)));
    f.proba = (Z, m) => Z.map((x) => f.proba1(x, m));
    /* Estimación fuera de bolsa (OOB) con los primeros m árboles */
    f.oob = (m) => {
      const M = m || trees.length;
      let ok = 0, cnt = 0, se = 0;
      for (let i = 0; i < n; i++) {
        let v = task === 'clf' ? new Float64Array(K) : 0, k = 0;
        for (let t = 0; t < M; t++) {
          if (bags[t][i]) continue;
          k++;
          if (task === 'clf') { const pr = trees[t].value1(X[i]); for (let c = 0; c < K; c++) v[c] += pr[c]; } else v += trees[t].value1(X[i]);
        }
        if (!k) continue;
        cnt++;
        if (task === 'clf') { if (U.argmax(v) === y[i]) ok++; } else se += (v / k - y[i]) ** 2;
      }
      return task === 'clf' ? ok / Math.max(1, cnt) : se / Math.max(1, cnt);
    };
    f.importances = () => { const s = new Float64Array(p); for (const t of trees) t.importances().forEach((v, j) => { s[j] += v / trees.length; }); return Array.from(s); };
    return f;
  };

  /* ---------- AdaBoost (SAMME) con tocones ---------- */
  E.adaboost = function (X, y, o = {}) {
    const n = X.length, K = o.K || Math.max(...y) + 1, M = o.nEst || 50, lr = o.lr || 1;
    let w = new Float64Array(n).fill(1 / n);
    const learners = [], alphas = [], weightsHist = [], errs = [];
    for (let m = 0; m < M; m++) {
      weightsHist.push(Float64Array.from(w));
      const t = T.fit(X, y, { task: 'clf', K, maxDepth: o.depth || 1, weights: Array.from(w) });
      const pred = t.predict(X);
      let err = 0;
      for (let i = 0; i < n; i++) if (pred[i] !== y[i]) err += w[i];
      err /= U.sum(w);
      errs.push(err);
      if (err >= 1 - 1 / K) break;
      const a = lr * (Math.log((1 - Math.max(err, 1e-12)) / Math.max(err, 1e-12)) + Math.log(K - 1));
      learners.push(t); alphas.push(a);
      if (err <= 0) break;
      for (let i = 0; i < n; i++) if (pred[i] !== y[i]) w[i] *= Math.exp(a);
      const s = U.sum(w);
      w = w.map((v) => v / s);
    }
    const score1 = (x, mm) => { const v = new Float64Array(K); const M2 = Math.min(mm || learners.length, learners.length); for (let m = 0; m < M2; m++) v[learners[m].predict([x])[0]] += alphas[m]; return Array.from(v); };
    return { learners, alphas, weightsHist, errs, K, score1, predict: (Z, mm) => Z.map((x) => U.argmax(score1(x, mm))) };
  };

  /* ---------- Gradient boosting ---------- */
  /* loss: 'sq' (regresión, error cuadrático) o 'log' (clasificación binaria, log-loss).
     o = {nEst, lr, depth, minLeaf, subsample, rng, Xval, yval} */
  E.gboost = function (X, y, o = {}) {
    const n = X.length, loss = o.loss || 'sq', M = o.nEst || 100, lr = o.lr === undefined ? 0.1 : o.lr;
    const rng = o.rng || L.rng(3);
    let F0;
    if (loss === 'sq') F0 = L.stat.mean(y);
    else { const pm = U.clamp(L.stat.mean(y), 1e-12, 1 - 1e-12); F0 = Math.log(pm / (1 - pm)); }
    const F = new Float64Array(n).fill(F0);
    const trees = [];
    const trainLoss = [], valLoss = [];
    let Fv = o.Xval ? new Float64Array(o.Xval.length).fill(F0) : null;
    const lossOf = (yy, FF) => {
      let s = 0;
      for (let i = 0; i < yy.length; i++) s += loss === 'sq' ? (yy[i] - FF[i]) ** 2 : U.softplus(FF[i]) - yy[i] * FF[i];
      return s / yy.length;
    };
    for (let m = 0; m < M; m++) {
      const r = new Float64Array(n);
      for (let i = 0; i < n; i++) r[i] = loss === 'sq' ? y[i] - F[i] : y[i] - U.sigmoid(F[i]);
      const idx = o.subsample && o.subsample < 1 ? rng.perm(n).slice(0, Math.max(2, Math.round(n * o.subsample))) : U.range(n);
      const t = T.fit(X, Array.from(r), { task: 'reg', maxDepth: o.depth || 3, minLeaf: o.minLeaf || 1, idx });
      if (loss === 'log') {
        /* Paso de Newton en cada hoja: Σ r / Σ p(1 − p) */
        const num = new Map(), den = new Map();
        for (const i of idx) { const lf = t.leafOf(X[i]); const pr = U.sigmoid(F[i]); num.set(lf, (num.get(lf) || 0) + r[i]); den.set(lf, (den.get(lf) || 0) + pr * (1 - pr)); }
        for (const lf of t.leaves()) { const d = den.get(lf) || 0; lf.value = Math.abs(d) < 1e-150 ? 0 : (num.get(lf) || 0) / d; }
      }
      trees.push(t);
      for (let i = 0; i < n; i++) F[i] += lr * t.value1(X[i]);
      trainLoss.push(lossOf(y, F));
      if (Fv) { for (let i = 0; i < Fv.length; i++) Fv[i] += lr * t.value1(o.Xval[i]); valLoss.push(lossOf(o.yval, Fv)); }
    }
    const raw1 = (x, mm) => { let s = F0; const M2 = Math.min(mm === undefined ? trees.length : mm, trees.length); for (let m = 0; m < M2; m++) s += lr * trees[m].value1(x); return s; };
    return {
      trees, F0, lr, loss, trainLoss, valLoss, raw1,
      predict: (Z, mm) => Z.map((x) => (loss === 'sq' ? raw1(x, mm) : raw1(x, mm) >= 0 ? 1 : 0)),
      proba: (Z, mm) => Z.map((x) => U.sigmoid(raw1(x, mm)))
    };
  };

  /* ---------- Bosque de aislamiento ---------- */
  const H = (n) => Math.log(n) + 0.5772156649015329;
  /* Longitud media de un camino de búsqueda sin éxito en un BST de n puntos */
  T.cIso = (n) => (n > 2 ? 2 * H(n - 1) - (2 * (n - 1)) / n : n === 2 ? 1 : 0);
  E.isoForest = function (X, o = {}) {
    const rng = o.rng || L.rng(11), n = X.length, p = X[0].length;
    const psi = Math.min(o.psi || 256, n), hmax = Math.ceil(Math.log2(psi));
    const trees = [];
    const grow = (I, d) => {
      if (d >= hmax || I.length <= 1) return { leaf: true, size: I.length };
      const f = rng.int(p);
      let lo = Infinity, hi = -Infinity;
      for (const i of I) { lo = Math.min(lo, X[i][f]); hi = Math.max(hi, X[i][f]); }
      if (hi <= lo) return { leaf: true, size: I.length };
      const thr = lo + (hi - lo) * rng();
      const l = [], r = [];
      for (const i of I) (X[i][f] < thr ? l : r).push(i);
      return { leaf: false, f, thr, left: grow(l, d + 1), right: grow(r, d + 1) };
    };
    for (let t = 0; t < (o.nTrees || 100); t++) trees.push(grow(rng.perm(n).slice(0, psi), 0));
    const pathLen = (x, nd, d) => (nd.leaf ? d + T.cIso(nd.size) : pathLen(x, x[nd.f] < nd.thr ? nd.left : nd.right, d + 1));
    const c = T.cIso(psi);
    const avgPath = (x) => { let s = 0; for (const t of trees) s += pathLen(x, t, 0); return s / trees.length; };
    return { trees, psi, avgPath, score1: (x) => Math.pow(2, -avgPath(x) / c), score: (Z) => Z.map((x) => Math.pow(2, -avgPath(x) / c)) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
