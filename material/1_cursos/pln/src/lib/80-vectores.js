/* ===================================================================
   lib/80-vectores.js — Texto como vectores: bolsa de palabras, n-gramas,
   TF-IDF y búsqueda por coseno. Reproduce las convenciones de scikit-learn
   (CountVectorizer / TfidfVectorizer): minúsculas, tokens de 2 o más
   caracteres de palabra, palabras vacías antes de formar n-gramas,
   idf suavizado = ln((1+n)/(1+df)) + 1 y normalización L2.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const V = (L.vec = {});

  const TOKEN = /[\p{L}\p{N}_]{2,}/gu;
  /* opts: {vacias: Set|null, n: [min, max], minDf: 1, maxRasgos: null, binario: false} */
  V.analizador = (opts = {}) => {
    const [n1, n2] = opts.n || [1, 1], vacias = opts.vacias || null;
    return (texto) => {
      let t = (texto.toLowerCase().match(TOKEN) || []);
      if (vacias) t = t.filter((w) => !vacias.has(w));
      const out = [];
      for (let n = n1; n <= n2; n++) for (let i = 0; i + n <= t.length; i++) out.push(t.slice(i, i + n).join(' '));
      return out;
    };
  };
  /* Ajusta el vocabulario sobre una lista de textos */
  V.ajustar = (docs, opts = {}) => {
    const an = V.analizador(opts), df = new Map(), tf = new Map();
    for (const d of docs) {
      const t = an(d);
      for (const w of t) tf.set(w, (tf.get(w) || 0) + 1);
      for (const w of new Set(t)) df.set(w, (df.get(w) || 0) + 1);
    }
    let vocab = Array.from(df.keys()).filter((w) => df.get(w) >= (opts.minDf || 1));
    if (opts.maxRasgos) {
      vocab = vocab.sort((a, b) => tf.get(b) - tf.get(a) || (a < b ? -1 : a > b ? 1 : 0)).slice(0, opts.maxRasgos);
    }
    vocab.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const idx = new Map(vocab.map((w, i) => [w, i]));
    return { vocab, idx, df: vocab.map((w) => df.get(w)), N: docs.length, opts, an };
  };
  /* Vector de conteos (Map índice → conteo) */
  V.contar = (m, texto) => {
    const c = new Map();
    for (const w of m.an(texto)) { const i = m.idx.get(w); if (i !== undefined) c.set(i, (c.get(i) || 0) + 1); }
    if (m.opts.binario) for (const k of c.keys()) c.set(k, 1);
    return c;
  };
  V.idf = (m, suave = true) => m.df.map((d) => (suave ? Math.log((1 + m.N) / (1 + d)) + 1 : Math.log(m.N / d)));
  const l2 = (v) => { let s = 0; for (const x of v.values()) s += x * x; s = Math.sqrt(s); if (s > 0) for (const [k, x] of v) v.set(k, x / s); return v; };
  /* TF-IDF de un vector de conteos; opts {sublineal, suave, norma} */
  V.tfidf = (m, c, opts = {}) => {
    const suave = opts.suave !== false, cache = m.idfc || (m.idfc = {});
    const idf = cache[suave] || (cache[suave] = V.idf(m, suave));
    const v = new Map();
    for (const [i, n] of c) v.set(i, (opts.sublineal ? 1 + Math.log(n) : n) * idf[i]);
    return opts.norma === false ? v : l2(v);
  };
  V.coseno = (a, b) => {
    let p = 0, na = 0, nb = 0;
    for (const x of a.values()) na += x * x;
    for (const x of b.values()) nb += x * x;
    const [c, d] = a.size < b.size ? [a, b] : [b, a];
    for (const [k, x] of c) { const y = d.get(k); if (y !== undefined) p += x * y; }
    return na && nb ? p / Math.sqrt(na * nb) : 0;
  };
  /* Matriz densa (filas = documentos) a partir de vectores dispersos */
  V.densa = (vs, n) => vs.map((v) => { const r = new Array(n).fill(0); for (const [k, x] of v) r[k] = x; return r; });
  /* Búsqueda: documentos ordenados por coseno con la consulta */
  V.buscar = (m, vectores, consulta, k = 5, opts = {}) => {
    const q = V.tfidf(m, V.contar(m, consulta), opts);
    return vectores.map((v, i) => [i, V.coseno(q, v)]).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k);
  };
})(typeof window !== 'undefined' ? window : globalThis);
