/* ===================================================================
   lib/75-alc.js — Lógica descriptiva ALC: conceptos, TBox acíclica,
   ABox y razonamiento por tableaux (satisfacibilidad, subsunción,
   comprobación de instancia y consistencia). Mundo abierto.
   Sintaxis: Top Bot  ~C  C & D  C | D  some r.C  only r.C  (paréntesis)
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const A = (L.alc = {});

  /* ---------- Análisis ---------- */
  A.parsear = function (s) {
    const t = s.match(/->|[()&|~.]|[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_][A-Za-zÁÉÍÓÚÜáéíóúüÑñ_0-9]*/g) || []; let i = 0;
    const peek = () => t[i], next = () => t[i++];
    const or = () => { let a = and(); while (peek() === '|') { next(); a = { k: 'or', a, b: and() }; } return a; };
    const and = () => { let a = un(); while (peek() === '&') { next(); a = { k: 'and', a, b: un() }; } return a; };
    const un = () => {
      const p = next();
      if (p === '~') return { k: 'not', a: un() };
      if (p === 'some' || p === 'only') { const r = next(); if (next() !== '.') throw new Error('falta . tras el rol'); return { k: p, r, a: un() }; }
      if (p === '(') { const c = or(); if (next() !== ')') throw new Error('falta )'); return c; }
      if (p === 'Top') return { k: 'top' };
      if (p === 'Bot') return { k: 'bot' };
      if (p === undefined || !/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ_]/.test(p)) throw new Error('concepto no válido');
      return { k: 'name', n: p };
    };
    const c = or(); if (i < t.length) throw new Error('sobra «' + t[i] + '»'); return c;
  };
  const tx = (c) => {
    switch (c.k) {
      case 'top': return 'Top'; case 'bot': return 'Bot'; case 'name': return c.n;
      case 'not': return '¬' + tx1(c.a);
      case 'and': return tx1(c.a) + ' ⊓ ' + tx1(c.b); case 'or': return tx1(c.a) + ' ⊔ ' + tx1(c.b);
      case 'some': return '∃' + c.r + '.' + tx1(c.a); case 'only': return '∀' + c.r + '.' + tx1(c.a);
    }
  };
  const tx1 = (c) => (c.k === 'and' || c.k === 'or' ? '(' + tx(c) + ')' : tx(c));
  A.texto = tx;
  const key = (c) => JSON.stringify(c);

  /* Forma normal negativa y desplegado de la TBox (definiciones acíclicas nombre ≡ concepto) */
  const nnf = (c, neg, tbox, vis) => {
    switch (c.k) {
      case 'top': return neg ? { k: 'bot' } : c;
      case 'bot': return neg ? { k: 'top' } : c;
      case 'name': {
        if (tbox && tbox[c.n]) { if (vis.includes(c.n)) throw new Error('definición cíclica: ' + c.n); return nnf(tbox[c.n], neg, tbox, vis.concat([c.n])); }
        return neg ? { k: 'not', a: c } : c;
      }
      case 'not': return nnf(c.a, !neg, tbox, vis);
      case 'and': return neg ? { k: 'or', a: nnf(c.a, true, tbox, vis), b: nnf(c.b, true, tbox, vis) } : { k: 'and', a: nnf(c.a, false, tbox, vis), b: nnf(c.b, false, tbox, vis) };
      case 'or': return neg ? { k: 'and', a: nnf(c.a, true, tbox, vis), b: nnf(c.b, true, tbox, vis) } : { k: 'or', a: nnf(c.a, false, tbox, vis), b: nnf(c.b, false, tbox, vis) };
      case 'some': return neg ? { k: 'only', r: c.r, a: nnf(c.a, true, tbox, vis) } : { k: 'some', r: c.r, a: nnf(c.a, false, tbox, vis) };
      case 'only': return neg ? { k: 'some', r: c.r, a: nnf(c.a, true, tbox, vis) } : { k: 'only', r: c.r, a: nnf(c.a, false, tbox, vis) };
    }
  };
  A.nnf = (c, tbox) => nnf(c, false, tbox || null, []);

  /* ---------- Tableau ---------- */
  /* estado: {nodos: Map id → {cs: Map key→concepto, suc: Array [rol, id], hechos: Set}} */
  const clonar = (e) => ({ nodos: new Map(Array.from(e.nodos, ([id, n]) => [id, { cs: new Map(n.cs), suc: n.suc.map((x) => x.slice()), hechos: new Set(n.hechos) }])), n: e.n });
  const anade = (nodo, c) => { const k = key(c); if (nodo.cs.has(k)) return false; nodo.cs.set(k, c); return true; };
  const choque = (nodo) => { for (const c of nodo.cs.values()) { if (c.k === 'bot') return true; if (c.k === 'not' && nodo.cs.has(key(c.a))) return true; } return false; };
  function expandir(e) {
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const [id, nodo] of e.nodos) {
        if (choque(nodo)) return false;
        for (const c of Array.from(nodo.cs.values())) {
          const k = key(c);
          if (c.k === 'and' && !nodo.hechos.has(k)) { nodo.hechos.add(k); anade(nodo, c.a); anade(nodo, c.b); cambio = true; }
          else if (c.k === 'only') for (const [r, s] of nodo.suc) if (r === c.r && anade(e.nodos.get(s), c.a)) cambio = true;
        }
      }
    }
    for (const [id, nodo] of e.nodos) if (choque(nodo)) return false;
    /* disyunciones */
    for (const [id, nodo] of e.nodos) {
      for (const c of Array.from(nodo.cs.values())) {
        if (c.k === 'or' && !nodo.hechos.has(key(c)) && !nodo.cs.has(key(c.a)) && !nodo.cs.has(key(c.b))) {
          for (const alt of [c.a, c.b]) { const e2 = clonar(e); anade(e2.nodos.get(id), alt); e2.nodos.get(id).hechos.add(key(c)); if (expandir(e2)) return true; }
          return false;
        }
      }
    }
    /* existenciales */
    for (const [id, nodo] of Array.from(e.nodos)) {
      for (const c of Array.from(nodo.cs.values())) {
        if (c.k === 'some' && !nodo.hechos.has(key(c))) {
          const k = key(c); nodo.hechos.add(k);
          const ya = nodo.suc.some(([r, s]) => r === c.r && e.nodos.get(s).cs.has(key(c.a)));
          if (!ya) {
            const nuevo = { cs: new Map(), suc: [], hechos: new Set() }; anade(nuevo, c.a);
            for (const d of nodo.cs.values()) if (d.k === 'only' && d.r === c.r) anade(nuevo, d.a);
            const nid = 'n' + (++e.n); e.nodos.set(nid, nuevo); nodo.suc.push([c.r, nid]);
          }
          return expandir(e);
        }
      }
    }
    return true;
  }
  /* abox: {afirmaciones: [[individuo, concepto]], roles: [[rol, a, b]]} */
  A.consistente = function (abox, tbox) {
    const e = { nodos: new Map(), n: 0 };
    const nodo = (a) => { if (!e.nodos.has(a)) e.nodos.set(a, { cs: new Map(), suc: [], hechos: new Set() }); return e.nodos.get(a); };
    for (const [a, c] of abox.afirmaciones || []) anade(nodo(a), A.nnf(typeof c === 'string' ? A.parsear(c) : c, tbox));
    for (const [r, a, b] of abox.roles || []) { nodo(a).suc.push([r, b]); nodo(b); }
    return expandir(e);
  };
  A.satisfacible = (c, tbox) => A.consistente({ afirmaciones: [['x0', typeof c === 'string' ? A.parsear(c) : c]] }, tbox);
  /* C ⊑ D  ⇔  C ⊓ ¬D insatisfacible */
  A.subsume = (d, c, tbox) => !A.satisfacible({ k: 'and', a: typeof c === 'string' ? A.parsear(c) : c, b: { k: 'not', a: typeof d === 'string' ? A.parsear(d) : d } }, tbox);
  /* a es instancia de C ⇔ ABox ∪ {a : ¬C} inconsistente */
  A.instancia = function (abox, a, c, tbox) {
    const cc = typeof c === 'string' ? A.parsear(c) : c;
    return !A.consistente({ afirmaciones: (abox.afirmaciones || []).concat([[a, { k: 'not', a: cc }]]), roles: abox.roles }, tbox);
  };

  /* Extensión de un concepto en una interpretación finita {dominio, nom: {N: Set}, rol: {r: Set 'a|b'}} (para comprobar modelos) */
  A.extension = function (I, c) {
    const ext = (x) => {
      switch (x.k) {
        case 'top': return new Set(I.dominio); case 'bot': return new Set();
        case 'name': return new Set(I.nom[x.n] || []);
        case 'not': { const s = ext(x.a); return new Set(I.dominio.filter((d) => !s.has(d))); }
        case 'and': { const a = ext(x.a), b = ext(x.b); return new Set(I.dominio.filter((d) => a.has(d) && b.has(d))); }
        case 'or': { const a = ext(x.a), b = ext(x.b); return new Set(I.dominio.filter((d) => a.has(d) || b.has(d))); }
        case 'some': { const s = ext(x.a), R = I.rol[x.r] || new Set(); return new Set(I.dominio.filter((d) => I.dominio.some((e) => R.has(d + '|' + e) && s.has(e)))); }
        case 'only': { const s = ext(x.a), R = I.rol[x.r] || new Set(); return new Set(I.dominio.filter((d) => I.dominio.every((e) => !R.has(d + '|' + e) || s.has(e)))); }
      }
    };
    return ext(typeof c === 'string' ? A.parsear(c) : c);
  };
  /* Búsqueda de modelo por fuerza bruta con hasta N individuos, un rol r y los nombres dados */
  A.modeloBruto = function (c, nombres, N = 3, rol = 'r') {
    const cc = typeof c === 'string' ? A.parsear(c) : c;
    for (let n = 1; n <= N; n++) {
      const dom = Array.from({ length: n }, (_, i) => i);
      const pares = []; for (const a of dom) for (const b of dom) pares.push(a + '|' + b);
      for (let mr = 0; mr < 2 ** pares.length; mr++) {
        const R = new Set(pares.filter((_, i) => (mr >> i) & 1));
        for (let mn = 0; mn < 2 ** (nombres.length * n); mn++) {
          const nom = {}; nombres.forEach((nm, j) => { nom[nm] = new Set(dom.filter((d) => (mn >> (j * n + d)) & 1)); });
          const I = { dominio: dom, nom, rol: { [rol]: R } };
          if (A.extension(I, cc).size > 0) return I;
        }
      }
    }
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
