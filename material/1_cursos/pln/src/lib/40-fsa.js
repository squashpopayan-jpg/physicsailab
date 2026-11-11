/* ===================================================================
   lib/40-fsa.js — Autómatas finitos: expresión regular → AFN (Thompson)
   → AFD (construcción de subconjuntos) → AFD mínimo (Moore).
   Sintaxis admitida: literales, ., [abc], (…), |, *, +, ?, \x (escape).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const F = (L.fsa = {});

  /* ---------- Análisis de la expresión regular ---------- */
  F.parse = function (re) {
    let i = 0;
    const peek = () => re[i];
    function expr() {
      let t = [term()];
      while (peek() === '|') { i++; t.push(term()); }
      return t.length === 1 ? t[0] : { t: 'alt', xs: t };
    }
    function term() {
      const xs = [];
      while (i < re.length && peek() !== '|' && peek() !== ')') xs.push(factor());
      return xs.length === 1 ? xs[0] : { t: 'cat', xs };
    }
    function factor() {
      let a = atom();
      while (peek() === '*' || peek() === '+' || peek() === '?') { a = { t: re[i] === '*' ? 'star' : re[i] === '+' ? 'plus' : 'opt', x: a }; i++; }
      return a;
    }
    function atom() {
      const c = re[i++];
      if (c === '(') { const e = expr(); if (re[i++] !== ')') throw new Error('falta )'); return e; }
      if (c === '[') { const set = []; while (re[i] !== ']' && i < re.length) { if (re[i + 1] === '-' && re[i + 2] !== ']') { for (let k = re.charCodeAt(i); k <= re.charCodeAt(i + 2); k++) set.push(String.fromCharCode(k)); i += 3; } else set.push(re[i++]); } i++; return { t: 'set', set }; }
      if (c === '.') return { t: 'any' };
      if (c === '\\') return { t: 'lit', c: re[i++] };
      if (c === undefined || c === '*' || c === '+' || c === '?' || c === ')') throw new Error('patrón no válido');
      return { t: 'lit', c };
    }
    const a = expr();
    if (i < re.length) throw new Error('sobra «' + re[i] + '»');
    return a;
  };
  const literales = (a, s) => { if (a.t === 'lit') s.add(a.c); else if (a.t === 'set') a.set.forEach((c) => s.add(c)); else if (a.xs) a.xs.forEach((x) => literales(x, s)); else if (a.x) literales(a.x, s); return s; };

  /* ---------- Thompson: AFN con transiciones ε ('') ---------- */
  F.nfa = function (re, alfabeto) {
    const ast = F.parse(re);
    const alpha = Array.from(literales(ast, new Set(alfabeto || []))).sort();
    const eps = [], tr = [];
    const nuevo = () => { eps.push(new Set()); tr.push(new Map()); return eps.length - 1; };
    const arco = (a, c, b) => { if (c === '') eps[a].add(b); else { if (!tr[a].has(c)) tr[a].set(c, new Set()); tr[a].get(c).add(b); } };
    function build(a) {
      const s = nuevo(), f = nuevo();
      if (a.t === 'lit') arco(s, a.c, f);
      else if (a.t === 'set') a.set.forEach((c) => arco(s, c, f));
      else if (a.t === 'any') alpha.forEach((c) => arco(s, c, f));
      else if (a.t === 'cat') { let prev = s; for (const x of a.xs) { const [s2, f2] = build(x); arco(prev, '', s2); prev = f2; } arco(prev, '', f); }
      else if (a.t === 'alt') for (const x of a.xs) { const [s2, f2] = build(x); arco(s, '', s2); arco(f2, '', f); }
      else if (a.t === 'star') { const [s2, f2] = build(a.x); arco(s, '', s2); arco(s, '', f); arco(f2, '', s2); arco(f2, '', f); }
      else if (a.t === 'plus') { const [s2, f2] = build(a.x); arco(s, '', s2); arco(f2, '', s2); arco(f2, '', f); }
      else if (a.t === 'opt') { const [s2, f2] = build(a.x); arco(s, '', s2); arco(s, '', f); arco(f2, '', f); }
      else if (a.t === 'cat0') arco(s, '', f);
      return [s, f];
    }
    /* expresión vacía */
    const [s, f] = ast.xs && ast.xs.length === 0 ? (() => { const a = nuevo(), b = nuevo(); arco(a, '', b); return [a, b]; })() : build(ast);
    return { n: eps.length, start: s, finals: new Set([f]), eps, tr, alphabet: alpha };
  };
  F.clausura = function (nfa, set) {
    const st = Array.from(set), out = new Set(set);
    while (st.length) { const q = st.pop(); for (const r of nfa.eps[q]) if (!out.has(r)) { out.add(r); st.push(r); } }
    return out;
  };
  F.mover = function (nfa, set, c) {
    const out = new Set();
    for (const q of set) { const t = nfa.tr[q].get(c); if (t) for (const r of t) out.add(r); }
    return F.clausura(nfa, out);
  };
  F.aceptaAFN = function (nfa, s) {
    let cur = F.clausura(nfa, new Set([nfa.start]));
    for (const c of s) { cur = F.mover(nfa, cur, c); if (!cur.size) return false; }
    return Array.from(cur).some((q) => nfa.finals.has(q));
  };
  /* Traza de conjuntos de estados del AFN paso a paso */
  F.trazaAFN = function (nfa, s) {
    let cur = F.clausura(nfa, new Set([nfa.start]));
    const out = [Array.from(cur).sort((a, b) => a - b)];
    for (const c of s) { cur = F.mover(nfa, cur, c); out.push(Array.from(cur).sort((a, b) => a - b)); }
    return out;
  };

  /* ---------- Construcción de subconjuntos (AFD completo, con estado de error) ---------- */
  F.dfa = function (nfa) {
    const key = (s) => Array.from(s).sort((a, b) => a - b).join(',');
    const ini = F.clausura(nfa, new Set([nfa.start]));
    const ids = new Map([[key(ini), 0]]), sets = [ini], delta = [];
    for (let q = 0; q < sets.length; q++) {
      delta[q] = new Map();
      for (const c of nfa.alphabet) {
        const t = F.mover(nfa, sets[q], c), k = key(t);
        if (!ids.has(k)) { ids.set(k, sets.length); sets.push(t); }
        delta[q].set(c, ids.get(k));
      }
    }
    const finals = new Set(); sets.forEach((s, q) => { if (Array.from(s).some((x) => nfa.finals.has(x))) finals.add(q); });
    return { n: sets.length, start: 0, finals, delta, alphabet: nfa.alphabet, sets };
  };
  /* Minimización por refinamiento de particiones (Moore); devuelve AFD completo mínimo */
  F.minimizar = function (d) {
    /* estados alcanzables ya lo son por construcción */
    let cls = Array.from({ length: d.n }, (_, q) => (d.finals.has(q) ? 1 : 0));
    for (;;) {
      const sigs = new Map(); const nuevo = [];
      for (let q = 0; q < d.n; q++) {
        const sg = cls[q] + '|' + d.alphabet.map((c) => cls[d.delta[q].get(c)]).join(',');
        if (!sigs.has(sg)) sigs.set(sg, sigs.size);
        nuevo[q] = sigs.get(sg);
      }
      const prevN = new Set(cls).size;
      cls = nuevo;
      if (sigs.size === prevN) break;
    }
    const nn = new Set(cls).size, rep = new Map();
    cls.forEach((c, q) => { if (!rep.has(c)) rep.set(c, q); });
    const idx = (c) => c;
    /* renumerar para que el inicial sea 0 */
    const order = [], seen = new Set();
    const cola = [cls[d.start]]; seen.add(cls[d.start]);
    while (cola.length) { const c = cola.shift(); order.push(c); const q = rep.get(c); for (const a of d.alphabet) { const t = cls[d.delta[q].get(a)]; if (!seen.has(t)) { seen.add(t); cola.push(t); } } }
    const num = new Map(order.map((c, i) => [c, i]));
    const delta = order.map((c) => { const q = rep.get(c), m = new Map(); for (const a of d.alphabet) m.set(a, num.get(cls[d.delta[q].get(a)])); return m; });
    const finals = new Set(); order.forEach((c, i) => { if (d.finals.has(rep.get(c))) finals.add(i); });
    return { n: nn, start: 0, finals, delta, alphabet: d.alphabet };
  };
  /* Estado de error: el que no es final y solo se transita a sí mismo */
  F.errorState = (d) => { for (let q = 0; q < d.n; q++) if (!d.finals.has(q) && Array.from(d.delta[q].values()).every((t) => t === q)) return q; return -1; };
  F.aceptaAFD = function (d, s) {
    let q = d.start;
    for (const c of s) { if (!d.delta[q].has(c)) return false; q = d.delta[q].get(c); }
    return d.finals.has(q);
  };
  /* Camino de estados de un AFD */
  F.caminoAFD = function (d, s) {
    let q = d.start; const path = [q];
    for (const c of s) { if (!d.delta[q].has(c)) { path.push(-1); return path; } q = d.delta[q].get(c); path.push(q); }
    return path;
  };
  /* Cuántas cadenas de longitud ≤ maxLen sobre el alfabeto acepta una función */
  F.contar = function (acepta, alfabeto, maxLen) {
    let n = 0, nivel = [''];
    for (let len = 0; len <= maxLen; len++) {
      for (const s of nivel) if (acepta(s)) n++;
      if (len < maxLen) { const sig = []; for (const s of nivel) for (const c of alfabeto) sig.push(s + c); nivel = sig; }
    }
    return n;
  };
  /* Lenguaje {aⁿbⁿ : n ≤ k} como expresión regular (alternancia finita) */
  F.anbn = (k) => { const xs = ['']; for (let n = 1; n <= k; n++) xs.push('a'.repeat(n) + 'b'.repeat(n)); return '(' + xs.join('|') + ')'; };
})(typeof window !== 'undefined' ? window : globalThis);
