/* ===================================================================
   lib/77-wordnet.js — WordNet (subconjunto con lemas del español):
   jerarquía de hiperónimos, similitud por camino y de Wu-Palmer, y
   desambiguación del sentido con el algoritmo de Lesk simplificado.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const W = (L.wn = {});

  let SS = null, POR = null, ES = null;
  const init = () => {
    if (SS) return;
    SS = new Map(); POR = new Map(); ES = new Map();
    for (const s of L.corpus.wordnet.synsets) SS.set(s.id, s);
    for (const s of SS.values()) for (const l of s.es) { const k = l.toLowerCase(); if (!ES.has(k)) ES.set(k, []); ES.get(k).push(s.id); }
  };
  W.synset = (id) => { init(); return SS.get(id); };
  W.todos = () => { init(); return Array.from(SS.values()); };
  /* Sentidos de una palabra del español (en orden de WordNet) */
  W.sentidos = (palabra) => { init(); const sem = L.corpus.wordnet.semillas[palabra.toLowerCase()]; return sem ? sem.slice() : (ES.get(palabra.toLowerCase()) || []).slice(); };

  const memoMin = new Map(), memoMax = new Map();
  W.profMin = (id) => { if (memoMin.has(id)) return memoMin.get(id); const h = W.synset(id).h; const v = h.length ? 1 + Math.min(...h.map(W.profMin)) : 0; memoMin.set(id, v); return v; };
  W.profMax = (id) => { if (memoMax.has(id)) return memoMax.get(id); const h = W.synset(id).h; const v = h.length ? 1 + Math.max(...h.map(W.profMax)) : 0; memoMax.set(id, v); return v; };
  /* Ancestros con su distancia mínima (BFS hacia arriba), incluido el propio */
  W.ancestros = (id) => {
    const d = new Map(), cola = [[id, 0]];
    while (cola.length) { const [s, k] = cola.shift(); if (d.has(s)) continue; d.set(s, k); for (const h of W.synset(s).h) cola.push([h, k + 1]); }
    return d;
  };
  W.distancia = (a, b) => {
    if (a === b) return 0;
    const A = W.ancestros(a), B = W.ancestros(b); let m = Infinity;
    for (const [s, d1] of A) { const d2 = B.get(s); if (d2 !== undefined) m = Math.min(m, d1 + d2); }
    return isFinite(m) ? m : null;
  };
  W.camino = (a, b) => { const d = W.distancia(a, b); return d === null ? null : 1 / (d + 1); };
  W.hipernimosComunes = (a, b) => { const A = W.ancestros(a), B = W.ancestros(b); return Array.from(A.keys()).filter((s) => B.has(s)); };
  /* Subsumidor de Wu-Palmer como en NLTK (use_min_depth = True) */
  W.subsumidor = (a, b) => {
    const com = W.hipernimosComunes(a, b); if (!com.length) return null;
    const mx = Math.max(...com.map(W.profMin));
    const c = com.filter((s) => W.profMin(s) === mx).sort();
    return c.includes(a) ? a : c[0];
  };
  W.wup = (a, b) => {
    const s = W.subsumidor(a, b); if (s === null) return null;
    const depth = W.profMax(s) + 1;
    const l1 = W.distancia(a, s) + depth, l2 = W.distancia(b, s) + depth;
    return (2 * depth) / (l1 + l2);
  };
  /* Cadena de hiperónimos más corta hasta la raíz, con su etiqueta en español o inglés */
  W.etiqueta = (id) => { const s = W.synset(id); return (s.es[0] || s.en[0] || id).replace(/_/g, ' '); };
  W.cadena = (id) => { const c = [id]; let x = id; while (W.synset(x).h.length) { x = W.synset(x).h.slice().sort((p, q) => W.profMin(p) - W.profMin(q))[0]; c.push(x); } return c; };

  /* ---------- Lesk simplificado con inventarios de sentidos en español ---------- */
  const raices = (texto, objetivo) => {
    const obj = L.stem.es(objetivo);
    return new Set(L.text.tokensLetras(texto.toLowerCase()).filter((w) => !L.text.STOP.has(L.text.sinTildes(w)) && w.length > 2).map((w) => L.stem.es(w)).filter((r) => r !== obj));
  };
  /* opts.ejemplos (por defecto true): incluir las oraciones de ejemplo en la firma; opts.idf (false): ponderar cada coincidencia con su IDF */
  W.firma = (palabra, i, opts = {}) => { const s = L.corpus.wsd.palabras[palabra][i]; return raices(s.d + (opts.ejemplos === false ? '' : ' ' + s.e.join(' ')), palabra); };
  let IDF = null;
  const idfDe = () => {
    if (IDF) return IDF;
    const P = L.corpus.wsd.palabras, df = new Map(); let N = 0;
    for (const p of Object.keys(P)) P[p].forEach((_, i) => { N++; for (const r of W.firma(p, i)) df.set(r, (df.get(r) || 0) + 1); });
    IDF = (r) => Math.log(N / (df.get(r) || 1));
    return IDF;
  };
  W.lesk = function (palabra, oracion, opts = {}) {
    const ss = L.corpus.wsd.palabras[palabra]; if (!ss) return null;
    const ctx = raices(oracion, palabra), pun = [], sol = [], idf = opts.idf ? idfDe() : null;
    ss.forEach((_, i) => { const f = W.firma(palabra, i, opts), inter = Array.from(ctx).filter((r) => f.has(r)); pun.push(idf ? inter.reduce((s, r) => s + idf(r), 0) : inter.length); sol.push(inter); });
    let best = 0; pun.forEach((p, i) => { if (p > pun[best]) best = i; });
    return { sentido: best, puntajes: pun, solapes: sol, contexto: Array.from(ctx) };
  };
  /* Bayes ingenuo (multinomial, suavizado de Laplace, a priori uniforme) entrenado con la definición y los ejemplos de cada sentido */
  const lista = (texto, objetivo) => { const obj = L.stem.es(objetivo); return L.text.tokensLetras(texto.toLowerCase()).filter((w) => !L.text.STOP.has(L.text.sinTildes(w)) && w.length > 2).map((w) => L.stem.es(w)).filter((r) => r !== obj); };
  W.bayes = function (palabra, oracion) {
    const ss = L.corpus.wsd.palabras[palabra]; if (!ss) return null;
    const docs = ss.map((s) => lista(s.d + ' ' + s.e.join(' '), palabra)), V = new Set(docs.flat());
    const cuentas = docs.map((d) => { const m = new Map(); d.forEach((r) => m.set(r, (m.get(r) || 0) + 1)); return m; });
    const ctx = lista(oracion, palabra).filter((r) => V.has(r));
    const pun = cuentas.map((m, i) => Math.log(1 / ss.length) + ctx.reduce((s, r) => s + Math.log(((m.get(r) || 0) + 1) / (docs[i].length + V.size)), 0));
    let best = 0; pun.forEach((p, i) => { if (p > pun[best]) best = i; });
    return { sentido: best, puntajes: pun, contexto: ctx };
  };
  W.evaluarLesk = function (opts = {}) {
    let ok = 0, base = 0; const filas = [];
    for (const [p, g, o] of L.corpus.wsd.pruebas) { const r = W.lesk(p, o, opts); filas.push({ p, g, o, r }); if (r.sentido === g) ok++; if (g === 0) base++; }
    return { acc: ok / filas.length, base: base / filas.length, n: filas.length, filas };
  };
})(typeof window !== 'undefined' ? window : globalThis);
