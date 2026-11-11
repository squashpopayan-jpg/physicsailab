/* ===================================================================
   lib/66-perceptron.js — Etiquetador de perceptrón promediado (Collins,
   2002; Honnibal, 2013): modelo lineal discriminativo con rasgos de la
   palabra, sufijos, contexto y etiquetas previas. Decodificación voraz de
   izquierda a derecha. Más métricas de evaluación por etiqueta.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const P = (L.perc = {});

  P.rasgos = function (palabras, i, p1, p2) {
    const w0 = palabras[i], w = w0.toLowerCase();
    const ant = i > 0 ? palabras[i - 1].toLowerCase() : '<s>', sig = i + 1 < palabras.length ? palabras[i + 1].toLowerCase() : '</s>';
    const f = ['b', 'w=' + w, 's3=' + w.slice(-3), 's2=' + w.slice(-2), 'p1=' + p1, 'p1w=' + p1 + '|' + w, 'p21=' + p2 + '|' + p1, 'pw=' + ant, 'nw=' + sig];
    if (/^[A-ZÁÉÍÓÚÑ]/.test(w0) && i > 0) f.push('cap');
    if (/[0-9]/.test(w0)) f.push('dig');
    return f;
  };
  P.fit = function (sents, o = {}) {
    const S = o.coarse ? sents.map((s) => s.map(([w, t]) => [w, L.hmm.coarse(t)])) : sents;
    const tags = Array.from(new Set(S.flatMap((s) => s.map(([, t]) => t)))).sort();
    const W = new Map(), tot = new Map(), ts = new Map();
    let it = 0;
    const score = (fs) => {
      const sc = new Map(tags.map((t) => [t, 0]));
      for (const f of fs) { const m = W.get(f); if (m) for (const [t, v] of m) sc.set(t, sc.get(t) + v); }
      return sc;
    };
    const mejor = (sc) => { let b = null, bv = -Infinity; for (const t of tags) { const v = sc.get(t); if (v > bv) { bv = v; b = t; } } return b; };
    const upd = (f, t, d) => {
      const k = f + '\u0000' + t;
      const m = W.get(f) || new Map(); W.set(f, m);
      const cur = m.get(t) || 0;
      tot.set(k, (tot.get(k) || 0) + (it - (ts.get(k) || 0)) * cur);
      ts.set(k, it);
      m.set(t, cur + d);
    };
    const epochs = o.epochs === undefined ? 5 : o.epochs;
    for (let e = 0; e < epochs; e++) {
      for (const s of S) {
        const ws = s.map(([w]) => w);
        let p1 = '<s>', p2 = '<s>';
        s.forEach(([, gold], i) => {
          const fs = P.rasgos(ws, i, p1, p2);
          const guess = mejor(score(fs));
          it++;
          if (guess !== gold) for (const f of fs) { upd(f, gold, 1); upd(f, guess, -1); }
          p2 = p1; p1 = guess;
        });
      }
    }
    /* promedio de pesos */
    const A = new Map();
    for (const [f, m] of W) {
      const nm = new Map();
      for (const [t, v] of m) { const k = f + '\u0000' + t; const total = (tot.get(k) || 0) + (it - (ts.get(k) || 0)) * v; const a = total / it; if (a !== 0) nm.set(t, a); }
      if (nm.size) A.set(f, nm);
    }
    const sc2 = (fs) => { const sc = new Map(tags.map((t) => [t, 0])); for (const f of fs) { const m = A.get(f); if (m) for (const [t, v] of m) sc.set(t, sc.get(t) + v); } return sc; };
    return { tags, nRasgos: A.size, iter: it, predecir: (ws) => { let p1 = '<s>', p2 = '<s>'; return ws.map((_, i) => { const t = mejor(sc2(P.rasgos(ws, i, p1, p2))); p2 = p1; p1 = t; return t; }); }, pesos: A, puntuar: sc2 };
  };

  /* Métricas por etiqueta a partir del mapa de confusión «real>predicha» → n */
  P.metricas = function (conf) {
    const tags = new Set(); for (const k of conf.keys()) { const [a, b] = k.split('>'); tags.add(a); tags.add(b); }
    const out = [];
    for (const t of tags) {
      let tp = 0, fn = 0, fp = 0;
      for (const [k, n] of conf) { const [a, b] = k.split('>'); if (a === t && b === t) tp += n; else if (a === t) fn += n; else if (b === t) fp += n; }
      const p = tp + fp ? tp / (tp + fp) : 0, r = tp + fn ? tp / (tp + fn) : 0;
      out.push({ t, tp, fp, fn, soporte: tp + fn, p, r, f: p + r ? (2 * p * r) / (p + r) : 0 });
    }
    return out.sort((a, b) => b.soporte - a.soporte);
  };
})(typeof window !== 'undefined' ? window : globalThis);
