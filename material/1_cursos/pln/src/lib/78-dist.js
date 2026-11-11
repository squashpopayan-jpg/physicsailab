/* ===================================================================
   lib/78-dist.js — Semántica distribucional: vectores de coocurrencia
   (ventana ±2 sobre CESS-ESP), PMI positivo, coseno y vecinos más cercanos.
   Los marginales se calculan sobre la matriz restringida (400 × 800).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const D = (L.dist = {});

  let idx = null, filaSuma = null, colSuma = null, total = 0;
  const init = () => {
    if (idx) return;
    const c = L.corpus.cooc; idx = new Map(c.filas.map((w, i) => [w, i]));
    filaSuma = c.m.map((r) => r.reduce((s, x) => s + x[1], 0));
    colSuma = new Array(c.cols.length).fill(0);
    c.m.forEach((r) => r.forEach(([j, n]) => { colSuma[j] += n; }));
    total = filaSuma.reduce((a, b) => a + b, 0);
  };
  D.palabras = () => { init(); return L.corpus.cooc.filas; };
  D.contextos = () => { init(); return L.corpus.cooc.cols; };
  D.total = () => { init(); return total; };

  /* Vector disperso de una palabra: Map columna → valor. rep = 'conteo' | 'ppmi' */
  const memo = { conteo: new Map(), ppmi: new Map() };
  D.vector = (w, rep = 'ppmi') => {
    init();
    const i = idx.get(w); if (i === undefined) return null;
    if (memo[rep].has(w)) return memo[rep].get(w);
    const v = new Map();
    for (const [j, n] of L.corpus.cooc.m[i]) {
      if (rep === 'conteo') v.set(j, n);
      else { const pmi = Math.log2((n / total) / ((filaSuma[i] / total) * (colSuma[j] / total))); if (pmi > 0) v.set(j, pmi); }
    }
    memo[rep].set(w, v); return v;
  };
  const norma = (v) => { let s = 0; for (const x of v.values()) s += x * x; return Math.sqrt(s); };
  D.coseno = (a, b) => {
    let p = 0; const [c, d] = a.size < b.size ? [a, b] : [b, a];
    for (const [j, x] of c) { const y = d.get(j); if (y !== undefined) p += x * y; }
    const na = norma(a), nb = norma(b);
    return na && nb ? p / (na * nb) : 0;
  };
  D.sim = (w1, w2, rep = 'ppmi') => { const a = D.vector(w1, rep), b = D.vector(w2, rep); return a && b ? D.coseno(a, b) : null; };
  D.vecinos = (w, k = 10, rep = 'ppmi') => {
    const v = D.vector(w, rep); if (!v) return [];
    return D.palabras().filter((x) => x !== w).map((x) => [x, D.coseno(v, D.vector(x, rep))]).sort((p, q) => q[1] - p[1] || (p[0] < q[0] ? -1 : 1)).slice(0, k);
  };
  /* Contextos con mayor valor del vector de una palabra: [[contexto, conteo, pmi]] */
  D.topContextos = (w, k = 10) => {
    init();
    const pp = D.vector(w, 'ppmi'), cn = D.vector(w, 'conteo');
    return Array.from(pp.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([j, v]) => [L.corpus.cooc.cols[j], cn.get(j), v]);
  };
  /* Contextos compartidos entre dos palabras, ordenados por la contribución al producto escalar */
  D.compartidos = (w1, w2, k = 8) => {
    const a = D.vector(w1, 'ppmi'), b = D.vector(w2, 'ppmi'), out = [];
    for (const [j, x] of a) { const y = b.get(j); if (y !== undefined) out.push([L.corpus.cooc.cols[j], x, y, x * y]); }
    return out.sort((p, q) => q[3] - p[3]).slice(0, k);
  };
})(typeof window !== 'undefined' ? window : globalThis);
