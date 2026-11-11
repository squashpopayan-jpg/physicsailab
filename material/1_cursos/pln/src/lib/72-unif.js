/* ===================================================================
   lib/72-unif.js — Estructuras de rasgos y unificación; análisis con
   gramáticas de unificación (concordancia de género, número y persona).
   Estructura de rasgos: objeto anidado; átomos: cadenas o números;
   variables: cadenas que empiezan por «?».
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const U = (L.unif = {});

  const esVar = (x) => typeof x === 'string' && x[0] === '?';
  const esObj = (x) => x !== null && typeof x === 'object';

  /* Unifica dos estructuras. Devuelve la estructura resultante (con las variables resueltas) o null si fallan. */
  U.unificar = function (a, b) {
    const env = new Map();
    const raiz = (v) => { while (esVar(v) && env.has(v)) v = env.get(v); return v; };
    const uni = (x, y) => {
      x = raiz(x); y = raiz(y);
      if (esVar(x)) { if (x !== y) env.set(x, y); return true; }
      if (esVar(y)) { env.set(y, x); return true; }
      if (esObj(x) && esObj(y)) {
        const out = {};
        for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
          if (k in x && k in y) { const r = uniVal(x[k], y[k]); if (r === undefined) return false; out[k] = r; }
          else out[k] = k in x ? x[k] : y[k];
        }
        return out;
      }
      if (esObj(x) || esObj(y)) return false;
      return x === y;
    };
    const uniVal = (x, y) => {
      x = raiz(x); y = raiz(y);
      if (esObj(x) && esObj(y)) { const r = uni(x, y); return r === false ? undefined : r; }
      if (esVar(x) || esVar(y)) { const r = uni(x, y); return r === false ? undefined : raiz(esVar(x) ? x : y); }
      if (esObj(x) || esObj(y)) return undefined;
      return x === y ? x : undefined;
    };
    const r = uniVal(a, b);
    if (r === undefined) return null;
    const resolver = (x) => { x = raiz(x); if (esObj(x)) { const o = {}; for (const k of Object.keys(x)) o[k] = resolver(x[k]); return o; } return x; };
    return resolver(r);
  };
  U.texto = (fs) => (esObj(fs) ? '[' + Object.keys(fs).sort().map((k) => k + '=' + U.texto(fs[k])).join(', ') + ']' : String(fs));

  /* ---------- Gramática de unificación con concordancia ---------- */
  /* Léxico: palabra → lista de {cat, agr:{gen,num,per}, ...} */
  const A = (gen, num, per) => { const o = {}; if (gen) o.gen = gen; if (num) o.num = num; if (per) o.per = per; return o; };
  U.LEX = {
    el: [{ cat: 'Det', agr: A('m', 's') }], la: [{ cat: 'Det', agr: A('f', 's') }], los: [{ cat: 'Det', agr: A('m', 'p') }], las: [{ cat: 'Det', agr: A('f', 'p') }],
    un: [{ cat: 'Det', agr: A('m', 's') }], una: [{ cat: 'Det', agr: A('f', 's') }],
    niño: [{ cat: 'N', agr: A('m', 's') }], niños: [{ cat: 'N', agr: A('m', 'p') }], niña: [{ cat: 'N', agr: A('f', 's') }], niñas: [{ cat: 'N', agr: A('f', 'p') }],
    gato: [{ cat: 'N', agr: A('m', 's') }], gatos: [{ cat: 'N', agr: A('m', 'p') }], casa: [{ cat: 'N', agr: A('f', 's') }], casas: [{ cat: 'N', agr: A('f', 'p') }],
    mesa: [{ cat: 'N', agr: A('f', 's') }], libro: [{ cat: 'N', agr: A('m', 's') }], libros: [{ cat: 'N', agr: A('m', 'p') }],
    grande: [{ cat: 'Adj', agr: { num: 's' } }], grandes: [{ cat: 'Adj', agr: { num: 'p' } }], roja: [{ cat: 'Adj', agr: A('f', 's') }], rojas: [{ cat: 'Adj', agr: A('f', 'p') }], rojo: [{ cat: 'Adj', agr: A('m', 's') }], rojos: [{ cat: 'Adj', agr: A('m', 'p') }],
    yo: [{ cat: 'Pron', agr: A(null, 's', '1') }], tú: [{ cat: 'Pron', agr: A(null, 's', '2') }],
    lee: [{ cat: 'V', agr: A(null, 's', '3'), tr: true }], leen: [{ cat: 'V', agr: A(null, 'p', '3'), tr: true }], leo: [{ cat: 'V', agr: A(null, 's', '1'), tr: true }],
    duerme: [{ cat: 'V', agr: A(null, 's', '3'), tr: false }], duermen: [{ cat: 'V', agr: A(null, 'p', '3'), tr: false }], duermo: [{ cat: 'V', agr: A(null, 's', '1'), tr: false }],
    ve: [{ cat: 'V', agr: A(null, 's', '3'), tr: true }], ven: [{ cat: 'V', agr: A(null, 'p', '3'), tr: true }], es: [{ cat: 'V', agr: A(null, 's', '3'), tr: false, cop: true }], son: [{ cat: 'V', agr: A(null, 'p', '3'), tr: false, cop: true }]
  };
  /* Reglas con restricciones: cada regla lista los hijos cuya concordancia debe unificarse; agr del resultado = unión */
  U.REGLAS = [
    { lhs: 'SN', rhs: ['Det', 'N'], conc: [0, 1] },
    { lhs: 'SN', rhs: ['Det', 'N', 'Adj'], conc: [0, 1, 2] },
    { lhs: 'SN', rhs: ['N'], conc: [0] },
    { lhs: 'SN', rhs: ['Pron'], conc: [0] },
    { lhs: 'SV', rhs: ['V'], conc: [0], tr: false },
    { lhs: 'SV', rhs: ['V', 'SN'], conc: [0], tr: true },
    { lhs: 'SV', rhs: ['V', 'Adj'], conc: [0], cop: true, adj: 1 },
    { lhs: 'S', rhs: ['SN', 'SV'], conc: [0, 1], soloNP: [0, 1] }
  ];
  /* Analiza con o sin concordancia; devuelve {n, arboles} (árboles con estructuras de rasgos) */
  U.analizar = function (palabras, o = {}) {
    const conc = o.concordancia !== false;
    const memo = new Map();
    const item = (cat, i, j) => {
      const k = cat + '|' + i + '|' + j; if (memo.has(k)) return memo.get(k);
      memo.set(k, []);
      const out = [];
      if (j === i + 1) for (const e of U.LEX[palabras[i]] || []) if (e.cat === cat) out.push({ cat, agr: Object.assign({}, e.agr), tree: [cat, palabras[i]], e });
      for (const r of U.REGLAS) {
        if (r.lhs !== cat) continue;
        const rec = (idx, desde, acc) => {
          if (idx === r.rhs.length) { if (desde === j) { const f = unifRegla(r, acc); if (f) out.push(f); } return; }
          for (let m = desde + 1; m <= j - (r.rhs.length - idx - 1); m++) for (const it of item(r.rhs[idx], desde, m)) rec(idx + 1, m, acc.concat([it]));
        };
        rec(0, i, []);
      }
      memo.set(k, out);
      return out;
    };
    const unifRegla = (r, hijos) => {
      if (r.tr !== undefined && hijos[0].e && !!hijos[0].e.tr !== r.tr) return null;
      if (r.cop && !(hijos[0].e && hijos[0].e.cop)) return null;
      let agr = {};
      if (conc) {
        if (r.lhs === 'S') { const s = hijos[0].agr, v = hijos[1].agr; const a = U.unificar({ num: s.num, per: s.per || '3' }, { num: v.num, per: v.per }); if (!a) return null; agr = a; }
        else if (r.lhs === 'SV') { agr = hijos[0].agr; if (r.rhs.length === 2 && r.rhs[1] === 'SN') agr = hijos[0].agr; }
        else { for (const idx of r.conc) { const a = U.unificar(agr, hijos[idx].agr); if (!a) return null; agr = a; } }
      } else agr = hijos[0] ? hijos[0].agr : {};
      return { cat: r.lhs, agr, tree: [r.lhs].concat(hijos.map((h) => h.tree)), e: hijos[0].e };
    };
    const raiz = item('S', 0, palabras.length);
    return { n: raiz.length, arboles: raiz.map((x) => ({ tree: x.tree, agr: x.agr })) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
