/* ===================================================================
   lib/89-ner.js — Reconocimiento de entidades nombradas con etiquetas BIO:
   perceptrón promediado con decodificación voraz (el estado previo es la
   etiqueta predicha) y evaluación por entidades al estilo de conlleval.
   Es la misma implementación que py/33-ner.py (se comprueba que dan
   exactamente las mismas etiquetas).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const N = (L.ner = {});

  N.forma = (w) => { let out = ''; for (const c of w) { const k = /\p{Lu}/u.test(c) ? 'X' : /\p{Ll}/u.test(c) ? 'x' : /\p{Nd}/u.test(c) ? 'd' : c; if (!out || out[out.length - 1] !== k) out += k; } return out; };
  const suf = (s, n) => Array.from(s).slice(-n).join(''), pre = (s, n) => Array.from(s).slice(0, n).join('');
  N.rasgos = function (pal, i, previa) {
    const w = pal[i], lw = w.toLowerCase(), n = pal.length, a = i > 0 ? pal[i - 1].toLowerCase() : '<s>', d = i < n - 1 ? pal[i + 1].toLowerCase() : '</s>';
    return ['b', 'w=' + lw, 's3=' + suf(lw, 3), 's2=' + suf(lw, 2), 'p3=' + pre(lw, 3), 'f=' + N.forma(w), 'ini=' + (i === 0 ? 'True' : 'False'), 't-1=' + previa, 't-1w=' + previa + '|' + lw,
      'w-1=' + a, 'w+1=' + d, 'f-1=' + (i > 0 ? N.forma(pal[i - 1]) : '<s>'), 'f+1=' + (i < n - 1 ? N.forma(pal[i + 1]) : '</s>'),
      'w-2=' + (i > 1 ? pal[i - 2].toLowerCase() : '<s>'), 'w+2=' + (i < n - 2 ? pal[i + 2].toLowerCase() : '</s>')];
  };

  N.entrenar = function (sents, epocas = 5) {
    const TAGS = Array.from(new Set(sents.flatMap((s) => s.map((x) => x[1])))).sort();
    const m = { TAGS, w: new Map(), tot: new Map(), est: new Map(), i: 0 };
    const puntos = (rs) => { const s = new Map(TAGS.map((t) => [t, 0])); for (const f of rs) { const v = m.w.get(f); if (v) for (const [t, x] of v) s.set(t, s.get(t) + x); } return s; };
    const predice = (rs) => { const s = puntos(rs); let mejor = TAGS[0]; for (const t of TAGS) if (s.get(t) > s.get(mejor)) mejor = t; return mejor; };
    const clave = (f, t) => f + '\u0000' + t;
    for (let ep = 0; ep < epocas; ep++) {
      for (const s of sents) {
        const pal = s.map((x) => x[0]); let prev = '<s>';
        s.forEach(([, t], i) => {
          const rs = N.rasgos(pal, i, prev), g = predice(rs);
          m.i++;
          if (g !== t) {
            for (const f of rs) for (const [tg, d] of [[t, 1], [g, -1]]) {
              const k = clave(f, tg); let v = m.w.get(f); if (!v) { v = new Map(); m.w.set(f, v); } const wv = v.get(tg) || 0;
              m.tot.set(k, (m.tot.get(k) || 0) + (m.i - (m.est.get(k) || 0)) * wv); m.est.set(k, m.i); v.set(tg, wv + d);
            }
          }
          prev = g;
        });
      }
    }
    for (const [f, v] of m.w) for (const [t, wv] of v) { const k = clave(f, t); v.set(t, ((m.tot.get(k) || 0) + (m.i - (m.est.get(k) || 0)) * wv) / m.i); }
    m.puntos = puntos; m.predice = predice;
    return m;
  };
  N.etiquetar = function (m, pal) { let prev = '<s>'; const out = []; for (let i = 0; i < pal.length; i++) { prev = m.predice(N.rasgos(pal, i, prev)); out.push(prev); } return out; };

  /* Entidades [tipo, inicio, fin) de una secuencia BIO (una I- sin B- previa del mismo tipo abre una entidad, como conlleval) */
  N.entidades = function (tags) {
    const out = []; let ini = null, tipo = null;
    for (let i = 0; i <= tags.length; i++) {
      const t = i < tags.length ? tags[i] : 'O', p = t === 'O' ? 'O' : t.split('-')[0], tp = t === 'O' ? '' : t.slice(2);
      if (tipo !== null && (p === 'O' || p === 'B' || tp !== tipo)) { out.push([tipo, ini, i]); tipo = null; }
      if (p === 'B' || (p === 'I' && tipo === null)) { ini = i; tipo = tp; }
    }
    return out;
  };
  N.evaluar = function (oro, pred) {
    const ok = {}, np = {}, ng = {}; const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
    oro.forEach((g, s) => {
      const G = N.entidades(g), P = N.entidades(pred[s]), kP = new Set(P.map((e) => e.join(':')));
      G.forEach((e) => { inc(ng, e[0]); if (kP.has(e.join(':'))) inc(ok, e[0]); }); P.forEach((e) => inc(np, e[0]));
    });
    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0), prf = (a, b, c) => { const p = b ? a / b : 0, r = c ? a / c : 0; return { p, r, f: p + r ? 2 * p * r / (p + r) : 0 }; };
    const res = {}; Object.keys(ng).sort().forEach((t) => { res[t] = prf(ok[t] || 0, np[t] || 0, ng[t]); });
    res.TOTAL = prf(sum(ok), sum(np), sum(ng)); return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
