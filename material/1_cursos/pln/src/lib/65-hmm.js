/* ===================================================================
   lib/65-hmm.js — Etiquetado morfosintáctico: etiquetas gruesas, tagger
   de línea base, modelo oculto de Markov bigrama (estados <s> y </s>,
   suavizado de Laplace/add-k, palabras desconocidas por hápax),
   algoritmo de Viterbi con matriz y retroceso, y evaluación.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const H = (L.hmm = {});

  /* Etiqueta gruesa (tipo UPOS) a partir de la etiqueta EAGLES de CESS-ESP */
  H.coarse = function (t) {
    const c = t[0];
    if (c === 'n') return t.startsWith('np') ? 'PROPN' : 'NOUN';
    if (c === 'v') return t.startsWith('va') ? 'AUX' : 'VERB';
    return { a: 'ADJ', r: 'ADV', d: 'DET', p: 'PRON', s: 'ADP', c: 'CONJ', z: 'NUM', Z: 'NUM', F: 'PUNCT', W: 'DATE', i: 'INTJ', I: 'INTJ' }[c] || 'X';
  };
  H.prep = function (sents, o = {}) {
    return sents.map((s) => s.map(([w, t]) => [o.lower === false ? w : w.toLowerCase(), o.coarse ? H.coarse(t) : t]));
  };

  /* Entrenamiento por conteo. o = {lower, coarse, k (suavizado add-k; 0 = máxima verosimilitud), unk: 'hapax' | 'ninguno'} */
  H.fit = function (sents, o = {}) {
    const k = o.k || 0, unk = o.unk === undefined ? 'hapax' : o.unk;
    const S = H.prep(sents, o);
    const cw = new Map();
    for (const s of S) for (const [w] of s) cw.set(w, (cw.get(w) || 0) + 1);
    const tagSet = new Set();
    for (const s of S) for (const [, t] of s) tagSet.add(t);
    const tags = Array.from(tagSet).sort();
    const id = new Map(tags.map((t, i) => [t, i]));
    const T = tags.length;
    const init = new Array(T).fill(0), fin = new Array(T).fill(0), tagCount = new Array(T).fill(0);
    const trans = Array.from({ length: T }, () => new Array(T).fill(0));
    const emis = Array.from({ length: T }, () => new Map());
    const vocab = new Set();
    for (const s of S) {
      let prev = -1;
      for (const [w0, t] of s) {
        const w = unk === 'hapax' && cw.get(w0) === 1 ? '<UNK>' : w0;
        const j = id.get(t);
        vocab.add(w);
        tagCount[j]++;
        emis[j].set(w, (emis[j].get(w) || 0) + 1);
        if (prev < 0) init[j]++; else trans[prev][j]++;
        prev = j;
      }
      if (prev >= 0) fin[prev]++;
    }
    const V = vocab.size, nS = S.length;
    const m = { tags, id, T, init, fin, trans, emis, tagCount, vocab, V, nS, k, unk, o, known: new Set(Array.from(cw.keys())), cw };
    /* log-probabilidades */
    m.logInit = (j) => Math.log((init[j] + k) / (nS + k * T));
    m.logTrans = (i, j) => Math.log((trans[i][j] + k) / (tagCount[i] + k * (T + 1)));
    m.logFin = (i) => Math.log((fin[i] + k) / (tagCount[i] + k * (T + 1)));
    m.simbolo = (w) => {
      const x = o.lower === false ? w : w.toLowerCase();
      if (m.vocab.has(x) && !(unk === 'hapax' && cw.get(x) === 1)) return x;
      if (unk === 'hapax') return '<UNK>';
      return x;
    };
    m.logEmis = (j, w) => Math.log(((emis[j].get(w) || 0) + k) / (tagCount[j] + k * V));
    return m;
  };

  /* Viterbi. Devuelve {path (etiquetas), logp, M (matriz log-viterbi), B (retroceso), words, ok} */
  H.viterbi = function (m, palabras) {
    const n = palabras.length, T = m.T, NEG = -Infinity;
    if (!n) return { path: [], logp: 0, M: [], B: [], words: [], ok: true };
    const sym = palabras.map((w) => m.simbolo(w));
    const M = Array.from({ length: T }, () => new Array(n).fill(NEG));
    const B = Array.from({ length: T }, () => new Array(n).fill(-1));
    for (let j = 0; j < T; j++) M[j][0] = m.logInit(j) + m.logEmis(j, sym[0]);
    for (let t = 1; t < n; t++) for (let j = 0; j < T; j++) {
      let best = NEG, arg = -1;
      for (let i = 0; i < T; i++) { const v = M[i][t - 1] + m.logTrans(i, j); if (v > best) { best = v; arg = i; } }
      M[j][t] = best + m.logEmis(j, sym[t]);
      B[j][t] = arg;
    }
    let best = NEG, arg = -1;
    for (let j = 0; j < T; j++) { const v = M[j][n - 1] + m.logFin(j); if (v > best) { best = v; arg = j; } }
    if (arg < 0) return { path: null, logp: NEG, M, B, words: sym, ok: false };
    const path = new Array(n); path[n - 1] = arg;
    for (let t = n - 1; t > 0; t--) path[t - 1] = B[path[t]][t];
    return { path: path.map((j) => m.tags[j]), idx: path, logp: best, M, B, words: sym, ok: true };
  };

  /* Evaluación sobre oraciones etiquetadas. predictor(palabras) → etiquetas */
  H.evaluar = function (predictor, test, o = {}, conocidas) {
    const T = H.prep(test, o);
    let ok = 0, n = 0, okK = 0, nK = 0, okU = 0, nU = 0;
    const conf = new Map();
    for (const s of T) {
      const pred = predictor(s.map(([w]) => w));
      s.forEach(([w, t], i) => {
        const p = pred[i];
        n++; if (p === t) ok++;
        const k = conocidas ? conocidas.has(w) : true;
        if (k) { nK++; if (p === t) okK++; } else { nU++; if (p === t) okU++; }
        const key = t + '>' + p; conf.set(key, (conf.get(key) || 0) + 1);
      });
    }
    return { acc: ok / n, n, accK: nK ? okK / nK : NaN, nK, accU: nU ? okU / nU : NaN, nU, conf };
  };

  /* Cadena de taggers con retroceso (backoff): bigrama (etiqueta previa, palabra) → unigrama (palabra) → sufijos (palabras raras) → etiqueta por defecto.
     o = {coarse, lower, bigrama: bool, sufijos: bool, rara: umbral de frecuencia de las «palabras raras» (2), largos: [3, 2, 1]} */
  H.cadena = function (sents, o = {}) {
    const S = H.prep(sents, o), rara = o.rara === undefined ? 2 : o.rara, largos = o.largos || [3, 2, 1];
    const mejor = (mp) => Array.from(mp.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const sum = (m, k, t) => { if (!m.has(k)) m.set(k, new Map()); m.get(k).set(t, (m.get(k).get(t) || 0) + 1); };
    const cw = new Map(), glob = new Map(), uni = new Map(), bi = new Map(), suf = new Map();
    for (const s of S) for (const [w] of s) cw.set(w, (cw.get(w) || 0) + 1);
    for (const s of S) {
      let prev = '<s>';
      for (const [w, t] of s) {
        glob.set(t, (glob.get(t) || 0) + 1); sum(uni, w, t); sum(bi, prev + '|' + w, t);
        if (cw.get(w) <= rara) for (const n of largos) if (w.length >= n) sum(suf, n + ':' + w.slice(-n), t);
        prev = t;
      }
    }
    const def = mejor(glob);
    const U = new Map(Array.from(uni).map(([k, v]) => [k, mejor(v)])), B = new Map(Array.from(bi).map(([k, v]) => [k, mejor(v)])), SF = new Map(Array.from(suf).map(([k, v]) => [k, mejor(v)]));
    const sufijo = (w) => { for (const n of largos) if (w.length >= n && SF.has(n + ':' + w.slice(-n))) return SF.get(n + ':' + w.slice(-n)); return null; };
    const una = (w, prev) => {
      if (o.bigrama && B.has(prev + '|' + w)) return B.get(prev + '|' + w);
      if (U.has(w)) return U.get(w);
      if (o.sufijos) { const s = sufijo(w); if (s) return s; }
      return def;
    };
    return { def, conocidas: new Set(cw.keys()), predecir: (ws) => { let prev = '<s>'; return ws.map((w0) => { const w = o.lower === false ? w0 : w0.toLowerCase(); const t = una(w, prev); prev = t; return t; }); } };
  };

  /* Línea de base: la etiqueta más frecuente de cada palabra; para las desconocidas, la más frecuente del corpus */
  H.baseline = function (sents, o = {}) {
    const S = H.prep(sents, o), por = new Map(), glob = new Map();
    for (const s of S) for (const [w, t] of s) {
      if (!por.has(w)) por.set(w, new Map());
      por.get(w).set(t, (por.get(w).get(t) || 0) + 1);
      glob.set(t, (glob.get(t) || 0) + 1);
    }
    const mejor = (mp) => Array.from(mp.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    const def = mejor(glob), tabla = new Map();
    for (const [w, mp] of por) tabla.set(w, mejor(mp));
    return { tabla, def, conocidas: new Set(por.keys()), predecir: (ws) => ws.map((w) => tabla.get(o.lower === false ? w : w.toLowerCase()) || def) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
