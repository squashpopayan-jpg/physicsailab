/* ===================================================================
   lib/45-fst.js — Transductores de estados finitos (FST) y morfología
   de dos niveles. Reglas ortográficas del español compiladas como FST,
   cascada superficie ⇄ intermedio y análisis por inversión.
   Arcos: {from, i, o, to}; '' = ε. Símbolos de frontera: ^ (morfemas) y # (palabra).
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const T = (L.fst = {});

  /* ---------- FST genérico ---------- */
  T.nuevo = () => ({ n: 1, start: 0, finals: new Set([0]), arcs: [], nombres: ['q0'] });
  T.estado = function (f, nombre, final) { f.nombres.push(nombre || 'q' + f.n); if (final) f.finals.add(f.n); return f.n++; };
  T.arco = (f, from, i, o, to) => { f.arcs.push({ from, i, o, to }); };
  T.invertir = (f) => ({ n: f.n, start: f.start, finals: new Set(f.finals), arcs: f.arcs.map((a) => ({ from: a.from, i: a.o, o: a.i, to: a.to })), nombres: f.nombres.slice() });
  /* Aplica el transductor a una cadena; devuelve el conjunto de salidas. maxLen acota la longitud de salida
     (necesario al invertir, cuando aparecen arcos ε de entrada). traza = true devuelve también un camino por salida. */
  T.aplicar = function (f, entrada, o = {}) {
    const maxLen = o.maxLen === undefined ? entrada.length + 8 : o.maxLen;
    const por = new Map();
    f.arcs.forEach((a) => { if (!por.has(a.from)) por.set(a.from, []); por.get(a.from).push(a); });
    const vistos = new Set(), salidas = new Map();
    const cola = [{ q: f.start, p: 0, s: '', camino: [f.start] }];
    while (cola.length) {
      const c = cola.shift();
      const k = c.q + '|' + c.p + '|' + c.s;
      if (vistos.has(k)) continue;
      vistos.add(k);
      if (c.p === entrada.length && f.finals.has(c.q) && !salidas.has(c.s)) salidas.set(c.s, c.camino);
      for (const a of por.get(c.q) || []) {
        if (a.i !== '') { if (entrada[c.p] !== a.i) continue; }
        const s2 = c.s + a.o;
        if (s2.length > maxLen) continue;
        cola.push({ q: a.to, p: c.p + (a.i === '' ? 0 : 1), s: s2, camino: o.traza ? c.camino.concat([a.to]) : null });
      }
      if (vistos.size > 60000) break;
    }
    return o.traza ? salidas : Array.from(salidas.keys()).sort();
  };
  /* Cascada: aplica una lista de FST en serie a un conjunto de cadenas */
  T.cascada = function (fsts, entradas, o = {}) {
    let cur = new Set(entradas);
    for (const f of fsts) { const nxt = new Set(); for (const s of cur) for (const t of T.aplicar(f, s, o)) nxt.add(t); cur = nxt; }
    return Array.from(cur).sort();
  };

  /* ---------- Alfabeto ---------- */
  const VOC = 'aeiouáéíóúü'.split('');
  const TILDE = 'áéíóú'.split('');
  const CON = 'bcdfghjklmnñpqrstvwxyz'.split('');
  const LETRAS = VOC.concat(CON);
  T.ALFABETO = LETRAS.concat(['^', '#']);

  /* ---------- Compilador de reglas «a → b / _ contexto derecho» (obligatorias) ---------- */
  /* map = {a: b, …}; ctx = [conjunto de símbolos, …] (contexto derecho) */
  T.reglaDerecha = function (map, ctx, nombre) {
    const f = T.nuevo(); f.nombres[0] = 'q0';
    const m = ctx.length, need = [], avoid = [];
    for (let k = 1; k <= m; k++) need.push(T.estado(f, 'n' + k, false));
    for (let k = 1; k <= m; k++) avoid.push(T.estado(f, 'a' + k, true));
    const base = (desde, x) => {
      if (map[x] !== undefined) { T.arco(f, desde, x, map[x], need[0]); T.arco(f, desde, x, x, avoid[0]); } else T.arco(f, desde, x, x, 0);
    };
    for (const x of T.ALFABETO) base(0, x);
    for (let k = 0; k < m; k++) {
      for (const x of ctx[k]) T.arco(f, need[k], x, x, k + 1 < m ? need[k + 1] : 0);
      for (const x of T.ALFABETO) {
        if (ctx[k].has(x)) { if (k + 1 < m) T.arco(f, avoid[k], x, x, avoid[k + 1]); } else base(avoid[k], x);
      }
    }
    f.nombre = nombre;
    return f;
  };
  const S = (s) => new Set(Array.isArray(s) ? s : s.split(''));
  /* z → c ante ^e */
  T.rZC = T.reglaDerecha({ z: 'c' }, [S('^'), S('e')], 'z → c / _ ^e');
  /* vocal con tilde → sin tilde ante {n,s} ^ e */
  T.rTilde = T.reglaDerecha({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }, [S('ns'), S('^'), S('e')], 'tilde → ∅ / _ {n,s}^e');
  /* Inserción de e: ε → e / consonante ^ _ s# */
  T.rE = (function () {
    const f = T.nuevo();
    const q1 = T.estado(f, 'C', true);      /* acaba de leer una consonante */
    const q2 = T.estado(f, 'C^', true);     /* consonante + frontera */
    const q3 = T.estado(f, 'e', false);     /* e insertada: debe seguir s# */
    const q4 = T.estado(f, 's', false);     /* leída la s tras la e: sigue # */
    const q5 = T.estado(f, 's?', false);    /* s tras C^ sin insertar: prohibido que siga # */
    const base = (de, x) => { if (CON.includes(x)) T.arco(f, de, x, x, q1); else if (VOC.includes(x) || x === '#') T.arco(f, de, x, x, 0); else if (x === '^') T.arco(f, de, x, x, 0); };
    for (const x of T.ALFABETO) base(0, x);
    for (const x of T.ALFABETO) { if (x === '^') T.arco(f, q1, x, x, q2); else base(q1, x); }
    /* tras C^: insertar e y exigir s# ; o seguir sin insertar si lo siguiente no es s# */
    T.arco(f, q2, '', 'e', q3);
    T.arco(f, q3, 's', 's', q4); T.arco(f, q4, '#', '#', 0);
    for (const x of T.ALFABETO) { if (x === 's') T.arco(f, q2, x, x, q5); else if (x !== '^') base(q2, x); }
    for (const x of T.ALFABETO) { if (x !== '#') base(q5, x); }
    f.nombre = 'ε → e / C^_ s#';
    return f;
  })();
  /* Limpieza: quitar fronteras */
  T.rLimpiar = (function () {
    const f = T.nuevo();
    for (const x of LETRAS) T.arco(f, 0, x, x, 0);
    T.arco(f, 0, '^', '', 0); T.arco(f, 0, '#', '', 0);
    f.nombre = '^ #  →  ε';
    return f;
  })();
  /* Cascada de generación (intermedio → superficie) y su inversa */
  T.REGLAS = [T.rE, T.rZC, T.rTilde, T.rLimpiar];
  T.generar = (inter) => T.cascada(T.REGLAS, [inter]);
  /* Inversión: las reglas se invierten como transductores (la inversa lee la salida y escribe la entrada).
     La inversa de «quitar fronteras» insertaría ^ y # en cualquier parte, con lo que el espacio de búsqueda explota;
     se sustituye por una inserción controlada: a lo sumo un ^ y un # final, como exige la morfotáctica del lexicón. */
  T.INVERSAS = [T.rTilde, T.rZC, T.rE].map(T.invertir);
  /* Candidatos de nivel intermedio para una forma de superficie */
  T.candidatos = function (sup) {
    const base = [sup + '#'];
    for (let p = 1; p < sup.length; p++) base.push(sup.slice(0, p) + '^' + sup.slice(p) + '#');
    return T.cascada(T.INVERSAS, base, { maxLen: sup.length + 4 });
  };
  /* Análisis completo por transductores: superficie → intermedio válido en el lexicón → nivel léxico */
  let INT = null;
  T.indiceIntermedio = function () {
    if (INT) return INT;
    INT = new Map();
    for (const e of L.morph.LEX) for (const f of L.morph.generar(e)) { const k = f.inter.includes('#') ? f.inter : f.inter + '#'; if (!INT.has(k)) INT.set(k, []); INT.get(k).push(f.lex); }
    return INT;
  };
  T.analizar = function (sup) {
    const idx = T.indiceIntermedio(), out = [], intermedios = [];
    for (const c of T.candidatos(sup.toLowerCase())) if (idx.has(c)) { intermedios.push(c); for (const l of idx.get(c)) if (!out.includes(l)) out.push(l); }
    return { analisis: out, intermedios };
  };
})(typeof window !== 'undefined' ? window : globalThis);
