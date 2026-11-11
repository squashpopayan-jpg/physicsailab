/* ===================================================================
   lib/82-embed.js — Vectores densos de palabras:
   (1) SVD truncada de la matriz PPMI (iteración de subespacio + Rayleigh–Ritz),
   (2) skip-gram con muestreo negativo (word2vec) entrenado con SGD.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const E = (L.emb = {});

  /* ---------- Jacobi cíclico para matrices simétricas pequeñas ---------- */
  function jacobi(A, n) {
    const a = A.map((r) => r.slice()), v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
      if (off < 1e-26) break;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
      }
    }
    return { valores: a.map((r, i) => r[i]), vectores: v };
  }

  /* SVD truncada de una matriz dispersa dada como filas Map(col → valor).
     Devuelve {S: [σ1…σk], U: Array(n) de Float64Array(k)} (columnas de U ortonormales) */
  E.svd = function (filas, nCols, k, o = {}) {
    const n = filas.length, K = Math.min(n, k + (o.extra === undefined ? 12 : o.extra)), iter = o.iter || 160, rng = L.rng(o.semilla || 1);
    const idx = filas.map((f) => Array.from(f.keys())), val = filas.map((f) => Array.from(f.values()));
    let Q = Array.from({ length: n }, () => Float64Array.from({ length: K }, () => rng.gauss()));
    const ortho = (X) => {
      for (let c = 0; c < K; c++) {
        for (let b = 0; b < c; b++) { let d = 0; for (let i = 0; i < n; i++) d += X[i][c] * X[i][b]; for (let i = 0; i < n; i++) X[i][c] -= d * X[i][b]; }
        let nm = 0; for (let i = 0; i < n; i++) nm += X[i][c] * X[i][c]; nm = Math.sqrt(nm) || 1; for (let i = 0; i < n; i++) X[i][c] /= nm;
      }
      return X;
    };
    const Zde = (Qm) => { const Z = Array.from({ length: nCols }, () => new Float64Array(K)); for (let i = 0; i < n; i++) { const ix = idx[i], vl = val[i], q = Qm[i]; for (let t = 0; t < ix.length; t++) { const z = Z[ix[t]], w = vl[t]; for (let c = 0; c < K; c++) z[c] += w * q[c]; } } return Z; };
    Q = ortho(Q);
    for (let it = 0; it < iter; it++) {
      const Z = Zde(Q), Y = Array.from({ length: n }, () => new Float64Array(K));
      for (let i = 0; i < n; i++) { const ix = idx[i], vl = val[i], y = Y[i]; for (let t = 0; t < ix.length; t++) { const z = Z[ix[t]], w = vl[t]; for (let c = 0; c < K; c++) y[c] += w * z[c]; } }
      Q = ortho(Y);
    }
    /* Rayleigh–Ritz: T = Qᵀ P Pᵀ Q = ZᵀZ con Z = Pᵀ Q */
    const Z = Zde(Q), T = Array.from({ length: K }, () => new Array(K).fill(0));
    for (let j = 0; j < nCols; j++) { const z = Z[j]; for (let a = 0; a < K; a++) { if (z[a] === 0) continue; for (let b = a; b < K; b++) T[a][b] += z[a] * z[b]; } }
    for (let a = 0; a < K; a++) for (let b = 0; b < a; b++) T[a][b] = T[b][a];
    const { valores, vectores } = jacobi(T, K), ord = valores.map((x, i) => i).sort((p, q) => valores[q] - valores[p]).slice(0, k);
    const S = ord.map((i) => Math.sqrt(Math.max(valores[i], 0)));
    const U = Array.from({ length: n }, (_, i) => { const u = new Float64Array(k); ord.forEach((c, t) => { let s = 0; for (let b = 0; b < K; b++) s += Q[i][b] * vectores[b][c]; u[t] = s; }); return u; });
    return { S, U };
  };

  /* Embeddings de palabras por SVD de la matriz PPMI: filas = U · S^alpha */
  const cacheSVD = new Map();
  E.porSVD = function (k, alpha = 1) {
    const clave = k + '|' + alpha;
    if (cacheSVD.has(clave)) return cacheSVD.get(clave);
    const pal = L.dist.palabras(), filas = pal.map((w) => L.dist.vector(w, 'ppmi')), r = E.svd(filas, L.dist.contextos().length, k);
    const W = r.U.map((u) => Float64Array.from(u, (x, t) => x * Math.pow(r.S[t], alpha)));
    const res = { palabras: pal, idx: new Map(pal.map((w, i) => [w, i])), W, S: r.S };
    cacheSVD.set(clave, res); return res;
  };
  E.coseno = (a, b) => { let p = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { p += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return na && nb ? p / Math.sqrt(na * nb) : 0; };
  E.vecinos = (m, w, k = 8) => {
    const i = m.idx.get(w); if (i === undefined) return [];
    return m.palabras.map((x, j) => [x, j === i ? -2 : E.coseno(m.W[i], m.W[j])]).filter((x) => x[1] > -2).sort((p, q) => q[1] - p[1] || (p[0] < q[0] ? -1 : 1)).slice(0, k);
  };

  /* ---------- Skip-gram con muestreo negativo ---------- */
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  /* Pérdida de un par (w, c) con negativos ns: −log σ(w·c) − Σ log σ(−w·n) */
  E.sgnsPerdida = (w, c, ns) => -Math.log(sig(dot(w, c))) + ns.reduce((s, n) => s - Math.log(sig(-dot(w, n))), 0);
  /* Gradientes analíticos respecto de w, c y de cada negativo */
  E.sgnsGrad = (w, c, ns) => {
    const gw = new Array(w.length).fill(0), gc = c.map(() => 0), gn = ns.map((n) => n.map(() => 0));
    const gp = sig(dot(w, c)) - 1;
    for (let i = 0; i < w.length; i++) { gw[i] += gp * c[i]; gc[i] = gp * w[i]; }
    ns.forEach((n, k) => { const g = sig(dot(w, n)); for (let i = 0; i < w.length; i++) { gw[i] += g * n[i]; gn[k][i] = g * w[i]; } });
    return { gw, gc, gn };
  };

  /* Entrenamiento. o = {dim, vent, neg, epocas, lr, minimo, semilla} */
  E.sgns = function (sents, o = {}) {
    const dim = o.dim || 24, vent = o.vent || 2, neg = o.neg || 5, minimo = o.minimo || 3, rng = L.rng(o.semilla || 3);
    const frec = new Map(); const toks = sents.map((s) => s.split(' ').filter(Boolean));
    for (const t of toks) for (const w of t) frec.set(w, (frec.get(w) || 0) + 1);
    const pal = Array.from(frec.keys()).filter((w) => frec.get(w) >= minimo).sort((a, b) => frec.get(b) - frec.get(a) || (a < b ? -1 : 1)), V = pal.length;
    const id = new Map(pal.map((w, i) => [w, i]));
    const W = Array.from({ length: V }, () => Float64Array.from({ length: dim }, () => (rng() - 0.5) / dim)), C = Array.from({ length: V }, () => new Float64Array(dim));
    /* tabla de muestreo negativo ∝ frecuencia^0.75 */
    const pesos = pal.map((w) => Math.pow(frec.get(w), 0.75)), tot = pesos.reduce((a, b) => a + b, 0), TAM = 20000, tabla = new Int32Array(TAM);
    { let acc = 0, j = 0; for (let t = 0; t < TAM; t++) { while (j < V - 1 && (acc + pesos[j]) / tot < (t + 0.5) / TAM) { acc += pesos[j]; j++; } tabla[t] = j; } }
    const sec = toks.map((t) => t.filter((w) => id.has(w)).map((w) => id.get(w)));
    const hist = [];
    const epoca = (lr0, lr1) => {
      let perd = 0, pares = 0; const total = sec.reduce((s, t) => s + t.length, 0); let visto = 0;
      for (const t of sec) for (let i = 0; i < t.length; i++, visto++) {
        const lr = lr0 + (lr1 - lr0) * (visto / total), w = W[t[i]];
        for (let j = Math.max(0, i - vent); j <= Math.min(t.length - 1, i + vent); j++) {
          if (j === i) continue;
          const gw = new Float64Array(dim);
          const pasos = [[t[j], 1]]; for (let k = 0; k < neg; k++) { let n = tabla[Math.floor(rng() * TAM)]; if (n === t[j]) n = (n + 1) % V; pasos.push([n, 0]); }
          for (const [c, y] of pasos) {
            const cv = C[c], g = sig(dot(w, cv)) - y;
            perd += y ? -Math.log(sig(dot(w, cv))) : -Math.log(sig(-dot(w, cv)));
            for (let d = 0; d < dim; d++) { gw[d] += g * cv[d]; cv[d] -= lr * g * w[d]; }
          }
          for (let d = 0; d < dim; d++) w[d] -= lr * gw[d];
          pares++;
        }
      }
      hist.push(perd / pares);
    };
    const modelo = { palabras: pal, idx: id, W, C, hist, dim, V, epocaN: 0, lr: o.lr || 0.05 };
    modelo.entrenar = (n = 1) => { for (let e = 0; e < n; e++) { const t = modelo.epocaN, T = o.epocasTotal || 10; epoca(modelo.lr * (1 - t / (T + 1)), modelo.lr * (1 - (t + 1) / (T + 1))); modelo.epocaN++; } return modelo; };
    return modelo;
  };
})(typeof window !== 'undefined' ? window : globalThis);
