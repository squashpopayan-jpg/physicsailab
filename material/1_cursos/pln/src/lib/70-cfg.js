/* ===================================================================
   lib/70-cfg.js — Gramáticas libres de contexto: lectura de gramáticas,
   analizadores descendente, ascendente, CKY y Earley; conteo de árboles;
   gramáticas probabilistas (CKY de Viterbi y algoritmo interior),
   estimación por conteo en un treebank y métricas PARSEVAL.
   Notación: «A -> B C | 'palabra' [0.4]» (las palabras van entre comillas simples).
   Árbol: [símbolo, hijo, …] con las hojas como cadenas.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const G = (L.cfg = {});

  /* ---------- Gramática ---------- */
  G.leer = function (texto) {
    const rules = []; let start = null;
    for (const linea0 of texto.split('\n')) {
      const linea = linea0.replace(/#.*$/, '').trim();
      if (!linea) continue;
      const [lhs, rhs] = linea.split('->').map((s) => s.trim());
      if (!start) start = lhs;
      for (const alt of rhs.split(/\|(?=(?:[^']*'[^']*')*[^']*$)/)) {
        let a = alt.trim(), p = null;
        const m = a.match(/\[([0-9.eE-]+)\]\s*$/);
        if (m) { p = parseFloat(m[1]); a = a.slice(0, m.index).trim(); }
        const rhsSyms = a.match(/'[^']*'|\S+/g).map((x) => (x[0] === "'" ? { t: x.slice(1, -1) } : { n: x }));
        rules.push({ lhs, rhs: rhsSyms.map((s) => (s.t !== undefined ? "'" + s.t + "'" : s.n)), p });
      }
    }
    const nts = new Set(rules.map((r) => r.lhs));
    return { start, rules, nts, texto };
  };
  const esT = (s) => s[0] === "'";
  const pal = (s) => s.slice(1, -1);
  G.regla = (r) => r.lhs + ' → ' + r.rhs.join(' ') + (r.p !== null ? ' [' + r.p + ']' : '');

  /* ---------- Árboles ---------- */
  G.corchetes = (t) => (typeof t === 'string' ? t : '(' + t[0] + ' ' + t.slice(1).map(G.corchetes).join(' ') + ')');
  G.hojas = (t) => (typeof t === 'string' ? [t] : t.slice(1).flatMap(G.hojas));
  /* Constituyentes etiquetados como [símbolo, i, j] (sin preterminales ni hojas) para PARSEVAL */
  G.constituyentes = function (t, i = 0, out = []) {
    const rec = (n, a) => {
      if (typeof n === 'string') return a + 1;
      let j = a;
      for (const h of n.slice(1)) j = rec(h, j);
      if (!(n.length === 2 && typeof n[1] === 'string')) out.push([n[0], a, j]);
      return j;
    };
    rec(t, i);
    return out;
  };

  /* ---------- Binarización (para CKY): A → X1 X2 … Xn  ⇒  A → X1 @A_1, @A_1 → X2 @A_2 … ---------- */
  G.cnf = function (g) {
    const rules = []; let k = 0;
    for (const r of g.rules) {
      if (r.rhs.length <= 2) { rules.push({ lhs: r.lhs, rhs: r.rhs, p: r.p }); continue; }
      let lhs = r.lhs, p = r.p;
      for (let i = 0; i < r.rhs.length - 2; i++) {
        const nuevo = '@' + (++k);
        rules.push({ lhs, rhs: [r.rhs[i], nuevo], p }); lhs = nuevo; p = p === null ? null : 1;
      }
      rules.push({ lhs, rhs: r.rhs.slice(-2), p });
    }
    return { start: g.start, rules };
  };
  const desbin = (t) => {
    if (typeof t === 'string') return [t];
    if (t[0][0] === '@') return t.slice(1).flatMap(desbin);
    return [[t[0]].concat(t.slice(1).flatMap(desbin))];
  };

  /* ---------- CKY con cierre de reglas unitarias; contabiliza celdas y combinaciones ---------- */
  /* o = {prob: 'ninguna'|'viterbi'|'interior', arboles: n}  Devuelve {cuenta, tabla, pasos, ok, mejor, logp, arboles} */
  G.cky = function (g, palabras, o = {}) {
    const C = G.cnf(g), n = palabras.length;
    const bin = new Map(), un = new Map(), lex = new Map();
    for (const r of C.rules) {
      if (r.rhs.length === 2) { const k = r.rhs[0] + ' ' + r.rhs[1]; if (!bin.has(k)) bin.set(k, []); bin.get(k).push(r); }
      else if (esT(r.rhs[0])) { const k = pal(r.rhs[0]); if (!lex.has(k)) lex.set(k, []); lex.get(k).push(r); }
      else { if (!un.has(r.rhs[0])) un.set(r.rhs[0], []); un.get(r.rhs[0]).push(r); }
    }
    const tabla = Array.from({ length: n + 1 }, () => Array.from({ length: n + 1 }, () => new Map()));
    let pasos = 0;
    const prob = o.prob || 'ninguna';
    const add = (cell, sym, rule, bp, cnt, lp, li) => {
      let e = cell.get(sym);
      if (!e) { e = { cnt: 0, lp: -Infinity, ins: -Infinity, derivs: [], best: null }; cell.set(sym, e); }
      e.cnt += cnt;
      if (prob !== 'ninguna') { e.ins = e.ins === -Infinity ? li : Math.max(e.ins, li) + Math.log1p(Math.exp(-Math.abs(e.ins - li))); if (lp > e.lp) { e.lp = lp; e.best = { rule, bp }; } }
      e.derivs.push({ rule, bp });
    };
    const lpOf = (r) => (r.p === null ? 0 : Math.log(r.p));
    /* Cierre por reglas unitarias A → B (sin ciclos): se recalcula a partir de las entradas base hasta el punto fijo */
    const lse = (a, b) => (a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b))));
    const cierre = (cell) => {
      const base = new Map(cell);
      if (!base.size) return;
      let fin = base;
      for (let it = 0; it < 12; it++) {
        const nuevo = new Map();
        for (const [s, e] of base) nuevo.set(s, { cnt: e.cnt, lp: e.lp, ins: e.ins, derivs: e.derivs.slice(), best: e.best });
        let cambio = false;
        for (const [b, eb] of fin) for (const r of un.get(b) || []) {
          pasos++;
          let e = nuevo.get(r.lhs);
          if (!e) { e = { cnt: 0, lp: -Infinity, ins: -Infinity, derivs: [], best: null }; nuevo.set(r.lhs, e); }
          e.cnt += eb.cnt; e.derivs.push({ rule: r, bp: [[b]] });
          if (prob !== 'ninguna') { const lp = eb.lp + lpOf(r), ins = eb.ins + lpOf(r); e.ins = lse(e.ins, ins); if (lp > e.lp) { e.lp = lp; e.best = { rule: r, bp: [[b]] }; } }
        }
        for (const [s, e] of nuevo) { const o2 = fin.get(s); if (!o2 || o2.cnt !== e.cnt || (prob !== 'ninguna' && (o2.ins !== e.ins || o2.lp !== e.lp))) cambio = true; }
        fin = nuevo;
        if (!cambio) break;
      }
      cell.clear();
      for (const [s, e] of fin) cell.set(s, e);
    };
    for (let i = 0; i < n; i++) {
      const cell = tabla[i][i + 1];
      for (const r of lex.get(palabras[i]) || []) { pasos++; add(cell, r.lhs, r, [], 1, lpOf(r), lpOf(r)); }
      cierre(cell);
    }
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i + len <= n; i++) {
        const j = i + len, cell = tabla[i][j];
        for (let k = i + 1; k < j; k++) {
          const A = tabla[i][k], B = tabla[k][j];
          for (const [a, ea] of A) for (const [b, eb] of B) {
            const rs = bin.get(a + ' ' + b); if (!rs) continue;
            for (const r of rs) { pasos++; add(cell, r.lhs, r, [[a, i, k], [b, k, j]], ea.cnt * eb.cnt, ea.lp + eb.lp + lpOf(r), ea.ins + eb.ins + lpOf(r)); }
          }
        }
        cierre(cell);
      }
    }
    const top = tabla[0][n].get(C.start);
    const res = { cuenta: top ? top.cnt : 0, ok: !!top, tabla, pasos, cnf: C };
    if (top && prob !== 'ninguna') { res.logpMejor = top.lp; res.logpInterior = top.ins; }
    /* reconstrucción de árboles */
    const arbol = (sym, i, j, uso) => {
      const e = tabla[i][j].get(sym); const d = uso;
      const r = d.rule, bp = d.bp;
      if (r.rhs.length === 2) { const hi = arbol(bp[0][0], bp[0][1], bp[0][2], tabla[bp[0][1]][bp[0][2]].get(bp[0][0]).best || tabla[bp[0][1]][bp[0][2]].get(bp[0][0]).derivs[0]); const hd = arbol(bp[1][0], bp[1][1], bp[1][2], tabla[bp[1][1]][bp[1][2]].get(bp[1][0]).best || tabla[bp[1][1]][bp[1][2]].get(bp[1][0]).derivs[0]); return [sym, hi, hd]; }
      if (esT(r.rhs[0])) return [sym, pal(r.rhs[0])];
      const sub = tabla[i][j].get(bp[0][0]);
      return [sym, arbol(bp[0][0], i, j, sub.best || sub.derivs[0])];
    };
    if (top) {
      res.mejor = desbin(arbol(C.start, 0, n, top.best || top.derivs[0]))[0];
      /* todos los árboles (hasta o.arboles) por enumeración de derivaciones */
      const max = o.arboles || 0;
      if (max) {
        const todos = (sym, i, j) => {
          const e = tabla[i][j].get(sym), out = [];
          for (const d of e.derivs) {
            const r = d.rule, bp = d.bp;
            if (r.rhs.length === 2) { const L1 = todos(bp[0][0], bp[0][1], bp[0][2]), R1 = todos(bp[1][0], bp[1][1], bp[1][2]); for (const a of L1) for (const b of R1) { out.push([sym, a, b]); if (out.length >= max * 4) return out; } }
            else if (esT(r.rhs[0])) out.push([sym, pal(r.rhs[0])]);
            else for (const a of todos(bp[0][0], i, j)) out.push([sym, a]);
            if (out.length >= max * 4) return out;
          }
          return out;
        };
        const set = new Set(), arb = [];
        for (const t of todos(C.start, 0, n)) { const u = desbin(t)[0], k = G.corchetes(u); if (!set.has(k)) { set.add(k); arb.push(u); } if (arb.length >= max) break; }
        res.arboles = arb;
      }
    }
    return res;
  };

  /* ---------- Analizador descendente (descenso recursivo con retroceso) ---------- */
  /* Devuelve {cuenta, pasos, arboles, truncado}. pasos = expansiones de reglas intentadas. */
  G.descendente = function (g, palabras, o = {}) {
    const por = new Map();
    for (const r of g.rules) { if (!por.has(r.lhs)) por.set(r.lhs, []); por.get(r.lhs).push(r); }
    let pasos = 0, trunc = false;
    const limite = o.limite || 200000, prof = o.prof || 40;
    const analizar = (sym, i, d) => {
      if (pasos > limite || d > prof) { trunc = true; return []; }
      if (esT(sym)) return palabras[i] === pal(sym) ? [{ j: i + 1, t: pal(sym) }] : [];
      const res = [];
      for (const r of por.get(sym) || []) {
        pasos++;
        let cur = [{ j: i, hs: [] }];
        for (const s of r.rhs) {
          const nxt = [];
          for (const c of cur) for (const x of analizar(s, c.j, d + 1)) nxt.push({ j: x.j, hs: c.hs.concat([x.t]) });
          cur = nxt; if (!cur.length) break;
        }
        for (const c of cur) res.push({ j: c.j, t: [sym].concat(c.hs) });
      }
      return res;
    };
    const rs = analizar(g.start, 0, 0).filter((x) => x.j === palabras.length);
    return { cuenta: rs.length, pasos, arboles: rs.map((x) => x.t), truncado: trunc };
  };

  /* ---------- Analizador ascendente (desplazar y reducir con retroceso) ---------- */
  G.ascendente = function (g, palabras, o = {}) {
    let pasos = 0, trunc = false, cuenta = 0;
    const limite = o.limite || 200000, arboles = [];
    const rec = (pila, i, d) => {
      if (pasos > limite || d > 200) { trunc = true; return; }
      if (i === palabras.length && pila.length === 1 && pila[0][0] === g.start) { cuenta++; if (arboles.length < (o.arboles || 0)) arboles.push(pila[0]); }
      /* reducir */
      for (const r of g.rules) {
        const m = r.rhs.length;
        if (m > pila.length) continue;
        let ok = true;
        for (let q = 0; q < m && ok; q++) { const x = pila[pila.length - m + q], s = r.rhs[q]; if (esT(s)) ok = x === pal(s); else ok = typeof x !== 'string' && x[0] === s; }
        if (!ok) continue;
        pasos++;
        const hijos = pila.slice(pila.length - m).map((x) => x);
        rec(pila.slice(0, pila.length - m).concat([[r.lhs].concat(hijos)]), i, d + 1);
      }
      /* desplazar */
      if (i < palabras.length) { pasos++; rec(pila.concat([palabras[i]]), i + 1, d + 1); }
    };
    rec([], 0, 0);
    return { cuenta, pasos, truncado: trunc, arboles };
  };

  /* ---------- Earley (reconocedor) ---------- */
  G.earley = function (g, palabras) {
    const n = palabras.length, charts = Array.from({ length: n + 1 }, () => []);
    const vistos = Array.from({ length: n + 1 }, () => new Set());
    const por = new Map();
    for (const r of g.rules) { if (!por.has(r.lhs)) por.set(r.lhs, []); por.get(r.lhs).push(r); }
    const key = (it) => it.r + '|' + it.p + '|' + it.o;
    const nr = new Map(g.rules.map((r, i) => [r, i]));
    const add = (k, it) => { const kk = key(it); if (!vistos[k].has(kk)) { vistos[k].add(kk); charts[k].push(it); return true; } return false; };
    const S0 = '$γ';
    const reglas = g.rules.concat([{ lhs: S0, rhs: [g.start], p: null }]);
    const idx = new Map(reglas.map((r, i) => [r, i]));
    const porIdx = new Map(); reglas.forEach((r, i) => { if (!porIdx.has(r.lhs)) porIdx.set(r.lhs, []); porIdx.get(r.lhs).push(i); });
    add(0, { r: reglas.length - 1, p: 0, o: 0 });
    let items = 0;
    for (let k = 0; k <= n; k++) {
      for (let q = 0; q < charts[k].length; q++) {
        const it = charts[k][q], r = reglas[it.r]; items++;
        if (it.p < r.rhs.length) {
          const s = r.rhs[it.p];
          if (!esT(s)) { for (const ri of porIdx.get(s) || []) add(k, { r: ri, p: 0, o: k }); }            /* predictor */
          else if (k < n && palabras[k] === pal(s)) add(k + 1, { r: it.r, p: it.p + 1, o: it.o });         /* escáner */
        } else {                                                                                            /* completador */
          for (const it2 of charts[it.o].slice()) { const r2 = reglas[it2.r]; if (it2.p < r2.rhs.length && r2.rhs[it2.p] === r.lhs) add(k, { r: it2.r, p: it2.p + 1, o: it2.o }); }
          if (it.o === k) for (const it2 of charts[k]) { const r2 = reglas[it2.r]; if (it2.p < r2.rhs.length && r2.rhs[it2.p] === r.lhs) add(k, { r: it2.r, p: it2.p + 1, o: it2.o }); }
        }
      }
    }
    const ok = charts[n].some((it) => it.r === reglas.length - 1 && it.p === 1 && it.o === 0);
    return { ok, items, charts: charts.map((c) => c.map((it) => ({ regla: reglas[it.r], p: it.p, o: it.o }))), n };
  };

  /* ---------- Gramática probabilista: estimación por conteo de árboles ---------- */
  G.reglasDeArbol = function (t, out = []) {
    if (typeof t === 'string') return out;
    const hijos = t.slice(1);
    const rhs = hijos.map((h) => (typeof h === 'string' ? "'" + h + "'" : h[0]));
    out.push({ lhs: t[0], rhs });
    for (const h of hijos) G.reglasDeArbol(h, out);
    return out;
  };
  G.estimar = function (arboles, o = {}) {
    const k = o.k || 0, cuenta = new Map(), tot = new Map();
    for (const t of arboles) for (const r of G.reglasDeArbol(t)) { const key = r.lhs + ' -> ' + r.rhs.join(' '); cuenta.set(key, (cuenta.get(key) || 0) + 1); tot.set(r.lhs, (tot.get(r.lhs) || 0) + 1); }
    const rules = []; let start = null;
    for (const [key, c] of cuenta) { const [lhs, rhs] = key.split(' -> '); if (!start) start = lhs; rules.push({ lhs, rhs: rhs.match(/'[^']*'|\S+/g), p: c / tot.get(lhs), c }); }
    return { start: o.start || (arboles[0] && arboles[0][0]), rules, nts: new Set(rules.map((r) => r.lhs)) };
  };
  /* log-probabilidad de un árbol bajo una gramática probabilista */
  G.logpArbol = function (g, t) {
    const idx = new Map(g.rules.map((r) => [r.lhs + ' -> ' + r.rhs.join(' '), r.p]));
    let lp = 0;
    for (const r of G.reglasDeArbol(t)) { const p = idx.get(r.lhs + ' -> ' + r.rhs.join(' ')); lp += p ? Math.log(p) : -Infinity; }
    return lp;
  };
  /* PARSEVAL: precisión, cobertura y F1 etiquetados de constituyentes */
  G.parseval = function (pred, ref) {
    const a = G.constituyentes(pred, 0, []).map((x) => x.join('|')), b = G.constituyentes(ref, 0, []).map((x) => x.join('|'));
    const sb = new Map(); for (const x of b) sb.set(x, (sb.get(x) || 0) + 1);
    let tp = 0; for (const x of a) if (sb.get(x) > 0) { tp++; sb.set(x, sb.get(x) - 1); }
    const p = a.length ? tp / a.length : 0, r = b.length ? tp / b.length : 0;
    return { tp, np: a.length, nr: b.length, p, r, f: p + r ? (2 * p * r) / (p + r) : 0 };
  };
})(typeof window !== 'undefined' ? window : globalThis);


