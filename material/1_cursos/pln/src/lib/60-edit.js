/* ===================================================================
   lib/60-edit.js — Distancia de edición (Levenshtein, Damerau-OSA) con
   alineamiento, generación de candidatos (Norvig) y corrector ortográfico
   de canal ruidoso con un modelo de lengua unigrama.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const E = (L.edit = {});

  /* Matriz de programación dinámica. o = {ins, del, sub, trans (null = sin transposiciones)} */
  E.matriz = function (a, b, o = {}) {
    const ci = o.ins === undefined ? 1 : o.ins, cd = o.del === undefined ? 1 : o.del, cs = o.sub === undefined ? 1 : o.sub, ct = o.trans === undefined ? null : o.trans;
    const n = a.length, m = b.length;
    const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) D[i][0] = D[i - 1][0] + cd;
    for (let j = 1; j <= m; j++) D[0][j] = D[0][j - 1] + ci;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      let v = Math.min(D[i - 1][j] + cd, D[i][j - 1] + ci, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : cs));
      if (ct !== null && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, D[i - 2][j - 2] + ct);
      D[i][j] = v;
    }
    return D;
  };
  E.dist = (a, b, o) => E.matriz(Array.from(a), Array.from(b), o)[a.length][b.length];
  /* Alineamiento por retroceso: lista de operaciones [tipo, a, b] */
  E.alinear = function (a, b, o = {}) {
    a = Array.from(a); b = Array.from(b);
    const ci = o.ins === undefined ? 1 : o.ins, cd = o.del === undefined ? 1 : o.del, cs = o.sub === undefined ? 1 : o.sub, ct = o.trans === undefined ? null : o.trans;
    const D = E.matriz(a, b, o);
    let i = a.length, j = b.length; const ops = [], camino = [[i, j]];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && D[i][j] === D[i - 1][j - 1]) { ops.push(['=', a[i - 1], b[j - 1]]); i--; j--; }
      else if (ct !== null && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && D[i][j] === D[i - 2][j - 2] + ct) { ops.push(['t', a[i - 2] + a[i - 1], b[j - 2] + b[j - 1]]); i -= 2; j -= 2; }
      else if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + cs) { ops.push(['s', a[i - 1], b[j - 1]]); i--; j--; }
      else if (i > 0 && D[i][j] === D[i - 1][j] + cd) { ops.push(['d', a[i - 1], '']); i--; }
      else { ops.push(['i', '', b[j - 1]]); j--; }
      camino.push([i, j]);
    }
    return { ops: ops.reverse(), camino: camino.reverse(), D };
  };

  E.ALFABETO = 'abcdefghijklmnñopqrstuvwxyzáéíóúü'.split('');
  /* Candidatos a distancia 1 (Norvig): borrados, transposiciones, sustituciones, inserciones */
  E.edits1 = function (w) {
    const out = new Set(), A = E.ALFABETO;
    for (let i = 0; i <= w.length; i++) {
      const l = w.slice(0, i), r = w.slice(i);
      if (r) out.add(l + r.slice(1));
      if (r.length > 1) out.add(l + r[1] + r[0] + r.slice(2));
      if (r) for (const c of A) out.add(l + c + r.slice(1));
      for (const c of A) out.add(l + c + r);
    }
    return out;
  };
  E.edits2 = function (w) { const out = new Set(); for (const e of E.edits1(w)) for (const f of E.edits1(e)) out.add(f); return out; };

  /* Modelo de lengua unigrama a partir de un vocabulario {w, n, total} */
  E.modelo = function (v) {
    const f = new Map(); v.w.forEach((x, i) => f.set(x, v.n[i]));
    return { f, total: v.total, logP: (w) => Math.log(f.get(w) / v.total) };
  };
  /* Corrector de canal ruidoso. o = {lambda: probabilidad de error por edición, prioridad: 'norvig' | 'ruidoso'}.
     Devuelve candidatos ordenados: {w, d, n, score}. */
  E.corregir = function (palabra, mod, o = {}) {
    const lam = o.lambda === undefined ? 0.01 : o.lambda, w = palabra.toLowerCase();
    const cands = [];
    if (mod.f.has(w)) cands.push({ w, d: 0 });
    const e1 = E.edits1(w); for (const c of e1) if (mod.f.has(c) && c !== w) cands.push({ w: c, d: 1 });
    if (!cands.some((c) => c.d <= 1) || o.dos) { const e2 = E.edits2(w); for (const c of e2) if (mod.f.has(c) && c !== w && !e1.has(c)) cands.push({ w: c, d: 2 }); }
    for (const c of cands) { c.n = mod.f.get(c.w); c.score = mod.logP(c.w) + c.d * Math.log(lam); }
    if (o.prioridad === 'norvig') cands.sort((a, b) => a.d - b.d || b.n - a.n || (a.w < b.w ? -1 : 1));
    else cands.sort((a, b) => b.score - a.score || (a.w < b.w ? -1 : 1));
    return cands;
  };
})(typeof window !== 'undefined' ? window : globalThis);
