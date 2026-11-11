/* ===================================================================
   lib/74-logica.js — Lógica de primer orden: analizador de fórmulas,
   evaluación en modelos finitos (dominio + interpretación) y tablas de
   verdad proposicionales. Sintaxis compatible con NLTK:
     all x.(perro(x) -> mamifero(x))   exists x.(libro(x) & lee(marta, x))
     -  &  |  ->  <->  =  (y los símbolos ∀ ∃ ¬ ∧ ∨ → ↔)
   Variables: una letra (menos «e») con dígitos opcionales; el resto son constantes.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const F = (L.fol = {});

  const esVarNombre = (s) => /^[a-df-z]\d*$/.test(s);
  const TOK = /\s*(<->|->|[()&|\-=.,¬∧∨→↔∀∃]|[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_][A-Za-zÁÉÍÓÚÜáéíóúüÑñ_0-9]*)/y;
  function tokens(s) {
    const out = []; TOK.lastIndex = 0; let m;
    while (TOK.lastIndex < s.length && (m = TOK.exec(s)) !== null) out.push(m[1]);
    if (TOK.lastIndex < s.replace(/\s+$/, '').length) throw new Error('símbolo no válido cerca de «' + s.slice(TOK.lastIndex, TOK.lastIndex + 8) + '»');
    return out.map((t) => ({ '¬': '-', '∧': '&', '∨': '|', '→': '->', '↔': '<->', '∀': 'all', '∃': 'exists' }[t] || t));
  }
  /* Gramática: iff → imp ('<->' imp)* ; imp → or ('->' imp)? ; or → and ('|' and)* ; and → un ('&' un)* ; un → '-' un | cuant | atom */
  F.parsear = function (texto) {
    const t = tokens(texto); let i = 0;
    const peek = () => t[i], next = () => t[i++];
    const esp = (x) => { if (next() !== x) throw new Error('se esperaba «' + x + '»'); };
    const term = () => {
      const n = next();
      if (n === undefined || !/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_]/.test(n)) throw new Error('término no válido');
      if (peek() === '(') { next(); const args = [term()]; while (peek() === ',') { next(); args.push(term()); } esp(')'); return { t: 'fn', n, args }; }
      return esVarNombre(n) ? { t: 'var', n } : { t: 'cte', n };
    };
    const iff = () => { let a = imp(); while (peek() === '<->') { next(); a = { t: 'iff', a, b: imp() }; } return a; };
    const imp = () => { const a = or(); if (peek() === '->') { next(); return { t: 'imp', a, b: imp() }; } return a; };
    const or = () => { let a = and(); while (peek() === '|') { next(); a = { t: 'or', a, b: and() }; } return a; };
    const and = () => { let a = un(); while (peek() === '&') { next(); a = { t: 'and', a, b: un() }; } return a; };
    const un = () => {
      const p = peek();
      if (p === '-') { next(); return { t: 'not', a: un() }; }
      if (p === 'all' || p === 'exists') {
        next(); const v = next(); if (!esVarNombre(v)) throw new Error('«' + v + '» no es una variable'); if (peek() === '.') next();
        return { t: p, v, a: un() };
      }
      return atom();
    };
    const atom = () => {
      if (peek() === '(') { next(); const f = iff(); esp(')'); return f; }
      const n = next();
      if (n === undefined) throw new Error('fórmula incompleta');
      if (peek() === '(') { next(); const args = [term()]; while (peek() === ',') { next(); args.push(term()); } esp(')'); return { t: 'pred', n, args }; }
      if (peek() === '=') { next(); const b = term(); return { t: 'eq', a: esVarNombre(n) ? { t: 'var', n } : { t: 'cte', n }, b }; }
      return { t: 'pred', n, args: [] };
    };
    const f = iff();
    if (i < t.length) throw new Error('sobra «' + t[i] + '»');
    return f;
  };
  const termTxt = (x) => (x.t === 'fn' ? x.n + '(' + x.args.map(termTxt).join(', ') + ')' : x.n);
  F.texto = function (f) {
    const par = (x, p) => { const s = F.texto(x); return PREC[x.t] !== undefined && PREC[x.t] < p ? '(' + s + ')' : s; };
    switch (f.t) {
      case 'pred': return f.n + (f.args.length ? '(' + f.args.map(termTxt).join(', ') + ')' : '');
      case 'eq': return termTxt(f.a) + ' = ' + termTxt(f.b);
      case 'not': return '¬' + par(f.a, 5);
      case 'and': return par(f.a, 3) + ' ∧ ' + par(f.b, 4);
      case 'or': return par(f.a, 2) + ' ∨ ' + par(f.b, 3);
      case 'imp': return par(f.a, 2) + ' → ' + par(f.b, 1);
      case 'iff': return par(f.a, 1) + ' ↔ ' + par(f.b, 1);
      case 'all': return '∀' + f.v + '.' + par(f.a, 4);
      case 'exists': return '∃' + f.v + '.' + par(f.a, 4);
    }
  };
  const PREC = { iff: 0, imp: 1, or: 2, and: 3, all: 4, exists: 4, not: 5, pred: 6, eq: 6 };

  /* Variables libres */
  F.libres = function (f, lig = new Set(), out = new Set()) {
    const tv = (x) => { if (x.t === 'var') { if (!lig.has(x.n)) out.add(x.n); } else if (x.t === 'fn') x.args.forEach(tv); };
    switch (f.t) {
      case 'pred': f.args.forEach(tv); break;
      case 'eq': tv(f.a); tv(f.b); break;
      case 'all': case 'exists': { const l2 = new Set(lig); l2.add(f.v); F.libres(f.a, l2, out); break; }
      case 'not': F.libres(f.a, lig, out); break;
      default: F.libres(f.a, lig, out); F.libres(f.b, lig, out);
    }
    return out;
  };

  /* Modelo: {dominio: [individuos], cte: {nombre: individuo}, pred: {nombre: Set de 'a|b'}} */
  F.evaluar = function (m, f, g = {}) {
    const val = (x) => {
      if (x.t === 'var') { if (!(x.n in g)) throw new Error('variable libre sin asignar: ' + x.n); return g[x.n]; }
      if (x.t === 'cte') { if (!(x.n in m.cte)) throw new Error('constante sin interpretar: ' + x.n); return m.cte[x.n]; }
      throw new Error('funciones no admitidas en los modelos finitos');
    };
    switch (f.t) {
      case 'pred': { const s = m.pred[f.n]; if (!s) { if (f.args.length === 0) return false; throw new Error('predicado sin interpretar: ' + f.n); } return s.has(f.args.map(val).join('|')); }
      case 'eq': return val(f.a) === val(f.b);
      case 'not': return !F.evaluar(m, f.a, g);
      case 'and': return F.evaluar(m, f.a, g) && F.evaluar(m, f.b, g);
      case 'or': return F.evaluar(m, f.a, g) || F.evaluar(m, f.b, g);
      case 'imp': return !F.evaluar(m, f.a, g) || F.evaluar(m, f.b, g);
      case 'iff': return F.evaluar(m, f.a, g) === F.evaluar(m, f.b, g);
      case 'all': return m.dominio.every((d) => F.evaluar(m, f.a, Object.assign({}, g, { [f.v]: d })));
      case 'exists': return m.dominio.some((d) => F.evaluar(m, f.a, Object.assign({}, g, { [f.v]: d })));
    }
  };
  /* Construye un modelo a partir de {dominio, cte, pred: {nombre: [[a,b],…] o [a,…]}} */
  F.modelo = function (o) {
    const pred = {};
    for (const [k, v] of Object.entries(o.pred || {})) pred[k] = new Set(v.map((t) => (Array.isArray(t) ? t.join('|') : t)));
    return { dominio: o.dominio, cte: o.cte || {}, pred };
  };
  F.verdad = (m, texto, g) => F.evaluar(m, F.parsear(texto), g);

  /* Proposicional: átomos = predicados sin argumentos; devuelve {atomos, filas:[{v, valor}], modelos} */
  F.atomos = (f, out = new Set()) => { if (f.t === 'pred' && f.args.length === 0) out.add(f.n); else if (f.a) { F.atomos(f.a, out); if (f.b) F.atomos(f.b, out); } return out; };
  F.tabla = function (f) {
    const at = Array.from(F.atomos(f)).sort(), filas = [];
    for (let k = 0; k < 1 << at.length; k++) {
      const v = {}; at.forEach((a, i) => { v[a] = !!((k >> (at.length - 1 - i)) & 1); });
      const m = { dominio: [0], cte: {}, pred: Object.fromEntries(at.filter((a) => v[a]).map((a) => [a, new Set([''])])) };
      filas.push({ v, valor: F.evaluar(m, f) });
    }
    return { atomos: at, filas, modelos: filas.filter((x) => x.valor).length };
  };
  F.equivalentes = (a, b) => { const f = F.parsear('(' + a + ') <-> (' + b + ')'); return F.tabla(f).filas.every((x) => x.valor); };

  /* Consecuencia lógica en modelos finitos de hasta N individuos (cota, no demostración): busca un contramodelo.
     vocab = {pred: {nombre: aridad}, cte: [nombres]} */
  F.contramodelo = function (premisas, conclusion, vocab, N = 3) {
    const Ps = premisas.map(F.parsear), C = F.parsear(conclusion);
    for (let n = 1; n <= N; n++) {
      const dom = Array.from({ length: n }, (_, i) => 'd' + i);
      const preds = Object.entries(vocab.pred);
      const celdas = []; for (const [p, ar] of preds) { const ts = []; const rec = (pre) => { if (pre.length === ar) { ts.push(pre.join('|')); return; } for (const d of dom) rec(pre.concat([d])); }; rec([]); ts.forEach((t) => celdas.push([p, t])); }
      const ctes = vocab.cte || [];
      const totalCtes = Math.pow(n, ctes.length);
      for (let mask = 0; mask < 2 ** celdas.length; mask++) {
        const pred = {}; preds.forEach(([p]) => { pred[p] = new Set(); });
        celdas.forEach(([p, t], i) => { if ((mask >> i) & 1) pred[p].add(t); });
        for (let c = 0; c < totalCtes; c++) {
          const cte = {}; let k = c; ctes.forEach((nom) => { cte[nom] = dom[k % n]; k = Math.floor(k / n); });
          const m = { dominio: dom, cte, pred };
          if (Ps.every((p) => F.evaluar(m, p)) && !F.evaluar(m, C)) return m;
        }
      }
    }
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
