/* ===================================================================
   lib/70-cableado.js — Banco de cableado de cajas
   Cinco montajes reales de la casa (punto de luz con interruptor,
   conmutada, tomas con GFCI, ducha, estufa de 240 V). El estudiante
   dibuja cada conductor entre bornes y le asigna un color; el motor
   compara las redes con las esperadas, revisa el color según la
   Tabla 3.5.a y simula el montaje (interruptores, fuga a tierra).
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const N = L.N;
  const O = L.O;

  const T = (id, caja, x, y, nombre, extra) => Object.assign({ id, caja, x, y, nombre }, extra || {});
  const FUENTES = { 'tg.F': 'F', 'tg.N': 'N', 'tg.T': 'T' };

  O.EJ = [
    {
      id: 'luz', titulo: 'Punto de luz con interruptor', ref: 'Circuito C1 · sala (S1/LS)',
      intro: 'El tablero alimenta la caja de la luminaria; el interruptor corta la fase, nunca el neutro. Una el tablero con el interruptor y el interruptor con el portalámparas.',
      cajas: [
        { id: 'tg', n: 'Tablero · C1 (15 A)', x: 10, y: 20, w: 170, h: 320 },
        { id: 'cs', n: 'Caja del interruptor', x: 320, y: 20, w: 220, h: 320 },
        { id: 'cl', n: 'Caja de la luminaria', x: 600, y: 20, w: 190, h: 320 }],
      term: [
        T('tg.F', 'tg', 180, 90, 'Fase (interruptor de 15 A)', { tor: 'bronce' }), T('tg.N', 'tg', 180, 170, 'Barra de neutro', { tor: 'plata' }), T('tg.T', 'tg', 180, 250, 'Barra de tierra', { tor: 'verde' }),
        T('sw.a', 'cs', 320, 90, 'Entrada', { tor: 'bronce' }), T('sw.b', 'cs', 540, 90, 'Salida', { tor: 'bronce' }), T('sw.T', 'cs', 320, 250, 'Tierra de la caja', { tor: 'verde' }),
        T('lam.L', 'cl', 600, 90, 'Contacto central', { tor: 'bronce' }), T('lam.N', 'cl', 600, 170, 'Rosca', { tor: 'plata' }), T('lam.T', 'cl', 600, 250, 'Tierra de la caja', { tor: 'verde' })],
      fuentes: FUENTES,
      interruptores: [{ id: 'sw', tipo: 'spst', t: ['sw.a', 'sw.b'], nombre: 'Interruptor', x: 430, y: 90 }],
      cargas: [{ id: 'lam', a: 'lam.L', b: 'lam.N', t: 'lam.T', V: 120, tipo: 'lampara', nombre: 'Luminaria', x: 695, y: 255 }],
      esperado: [{ fn: 'F', t: ['tg.F', 'sw.a'] }, { fn: 'R', t: ['sw.b', 'lam.L'] }, { fn: 'N', t: ['tg.N', 'lam.N'] }, { fn: 'T', t: ['tg.T', 'sw.T', 'lam.T'] }],
      funcional: (an) => an.some((a) => a.pos.sw === 1 && a.cargas.lam.on) && an.every((a) => a.pos.sw === 1 || !a.cargas.lam.on)
    },
    {
      id: 'conm', titulo: 'Lámpara conmutada desde dos puntos', ref: 'Circuito C1 · hall (S5/S6)',
      intro: 'Dos conmutadores gobiernan la misma lámpara. La fase entra por el común del primero; los dos viajeros unen los conmutadores; el común del segundo lleva el retorno a la lámpara.',
      cajas: [
        { id: 'tg', n: 'Tablero · C1', x: 10, y: 20, w: 150, h: 320 },
        { id: 's1', n: 'Conmutador S5', x: 230, y: 20, w: 150, h: 320 },
        { id: 's2', n: 'Conmutador S6', x: 420, y: 20, w: 150, h: 320 },
        { id: 'cl', n: 'Luminaria LH', x: 640, y: 20, w: 150, h: 320 }],
      term: [
        T('tg.F', 'tg', 160, 90, 'Fase (15 A)', { tor: 'bronce' }), T('tg.N', 'tg', 160, 170, 'Neutro', { tor: 'plata' }), T('tg.T', 'tg', 160, 250, 'Tierra', { tor: 'verde' }),
        T('s1.C', 's1', 230, 90, 'S5 · común', { tor: 'negro' }), T('s1.t1', 's1', 380, 60, 'S5 · viajero 1', { tor: 'bronce' }), T('s1.t2', 's1', 380, 120, 'S5 · viajero 2', { tor: 'bronce' }), T('s1.T', 's1', 230, 250, 'S5 · tierra', { tor: 'verde' }),
        T('s2.C', 's2', 570, 90, 'S6 · común', { tor: 'negro' }), T('s2.t1', 's2', 420, 60, 'S6 · viajero 1', { tor: 'bronce' }), T('s2.t2', 's2', 420, 120, 'S6 · viajero 2', { tor: 'bronce' }), T('s2.T', 's2', 420, 250, 'S6 · tierra', { tor: 'verde' }),
        T('lam.L', 'cl', 640, 90, 'Lámpara · contacto central', { tor: 'bronce' }), T('lam.N', 'cl', 640, 170, 'Lámpara · rosca', { tor: 'plata' }), T('lam.T', 'cl', 640, 250, 'Lámpara · tierra', { tor: 'verde' })],
      fuentes: FUENTES,
      interruptores: [
        { id: 's1', tipo: 'spdt', c: 's1.C', t1: 's1.t1', t2: 's1.t2', nombre: 'S5', x: 305, y: 90 },
        { id: 's2', tipo: 'spdt', c: 's2.C', t1: 's2.t1', t2: 's2.t2', nombre: 'S6', x: 495, y: 90 }],
      cargas: [{ id: 'lam', a: 'lam.L', b: 'lam.N', t: 'lam.T', V: 120, tipo: 'lampara', nombre: 'Lámpara', x: 715, y: 255 }],
      esperado: [{ fn: 'F', t: ['tg.F', 's1.C'] }, { fn: 'V', t: ['s1.t1', 's2.t1'] }, { fn: 'V', t: ['s1.t2', 's2.t2'] }, { fn: 'R', t: ['s2.C', 'lam.L'] }, { fn: 'N', t: ['tg.N', 'lam.N'] }, { fn: 'T', t: ['tg.T', 's1.T', 's2.T', 'lam.T'] }],
      alt: [[{ fn: 'F', t: ['tg.F', 's1.C'] }, { fn: 'V', t: ['s1.t1', 's2.t2'] }, { fn: 'V', t: ['s1.t2', 's2.t1'] }, { fn: 'R', t: ['s2.C', 'lam.L'] }, { fn: 'N', t: ['tg.N', 'lam.N'] }, { fn: 'T', t: ['tg.T', 's1.T', 's2.T', 'lam.T'] }]],
      funcional: (an) => {
        const f = (p1, p2) => an.find((a) => a.pos.s1 === p1 && a.pos.s2 === p2).cargas.lam.on;
        const x = [f(0, 0), f(0, 1), f(1, 0), f(1, 1)];
        const xnor = x[0] && !x[1] && !x[2] && x[3], xor = !x[0] && x[1] && x[2] && !x[3];
        return xnor || xor;
      }
    },
    {
      id: 'gfci', titulo: 'Tomas con GFCI y toma aguas abajo', ref: 'Circuito C5 · cocina (TK1 → TK3)',
      intro: 'El GFCI protege lo que se conecta a sus bornes LOAD. Alimente el GFCI por LINE y la toma común por LOAD. Observe los bornes: latón es la fase, plateado el neutro y verde la tierra.',
      cajas: [
        { id: 'tg', n: 'Tablero · C5 (20 A)', x: 10, y: 20, w: 150, h: 320 },
        { id: 'g', n: 'Toma GFCI TK1', x: 280, y: 20, w: 200, h: 320 },
        { id: 't', n: 'Toma común TK3', x: 600, y: 20, w: 190, h: 320 }],
      term: [
        T('tg.F', 'tg', 160, 80, 'Fase (20 A)', { tor: 'bronce' }), T('tg.N', 'tg', 160, 160, 'Neutro', { tor: 'plata' }), T('tg.T', 'tg', 160, 250, 'Tierra', { tor: 'verde' }),
        T('g.LF', 'g', 280, 70, 'GFCI · LINE fase', { tor: 'bronce' }), T('g.LN', 'g', 280, 130, 'GFCI · LINE neutro', { tor: 'plata' }), T('g.T', 'g', 280, 250, 'GFCI · tierra', { tor: 'verde' }),
        T('g.CF', 'g', 480, 70, 'GFCI · LOAD fase', { tor: 'bronce' }), T('g.CN', 'g', 480, 130, 'GFCI · LOAD neutro', { tor: 'plata' }),
        T('t.F', 't', 600, 70, 'Toma · borne latón (fase)', { tor: 'bronce' }), T('t.N', 't', 600, 130, 'Toma · borne plateado (neutro)', { tor: 'plata' }), T('t.T', 't', 600, 250, 'Toma · borne verde (tierra)', { tor: 'verde' })],
      fuentes: FUENTES,
      interruptores: [],
      gfci: [{ id: 'g', linea: ['g.LF', 'g.LN'], carga: ['g.CF', 'g.CN'], x: 380, y: 200 }],
      cargas: [],
      esperado: [{ fn: 'F', t: ['tg.F', 'g.LF'] }, { fn: 'N', t: ['tg.N', 'g.LN'] }, { fn: 'F', t: ['g.CF', 't.F'] }, { fn: 'N', t: ['g.CN', 't.N'] }, { fn: 'T', t: ['tg.T', 'g.T', 't.T'] }],
      funcional: () => true
    },
    {
      id: 'ducha', titulo: 'Ducha eléctrica de 120 V', ref: 'Circuito C7 · baño (XD)',
      intro: 'Circuito exclusivo de 30 A con protección diferencial de 30 mA. La carcasa metálica de la ducha va siempre a tierra.',
      cajas: [
        { id: 'tg', n: 'Tablero · C7 (30 A + diferencial)', x: 10, y: 20, w: 190, h: 320 },
        { id: 'd', n: 'Ducha eléctrica', x: 560, y: 20, w: 230, h: 320 }],
      term: [
        T('tg.F', 'tg', 200, 90, 'Fase (30 A + 30 mA)', { tor: 'bronce' }), T('tg.N', 'tg', 200, 170, 'Neutro', { tor: 'plata' }), T('tg.T', 'tg', 200, 250, 'Tierra', { tor: 'verde' }),
        T('d.L', 'd', 560, 90, 'Resistencia · fase', { tor: 'bronce' }), T('d.N', 'd', 560, 170, 'Resistencia · neutro', { tor: 'plata' }), T('d.T', 'd', 560, 250, 'Carcasa · tierra', { tor: 'verde' })],
      fuentes: FUENTES,
      interruptores: [],
      cargas: [{ id: 'd', a: 'd.L', b: 'd.N', t: 'd.T', V: 120, tipo: 'ducha', nombre: 'Ducha 3 500 W', x: 675, y: 245 }],
      esperado: [{ fn: 'F', t: ['tg.F', 'd.L'] }, { fn: 'N', t: ['tg.N', 'd.N'] }, { fn: 'T', t: ['tg.T', 'd.T'] }],
      funcional: (an) => an.every((a) => a.cargas.d.on)
    },
    {
      id: 'estufa', titulo: 'Estufa eléctrica de 240 V', ref: 'Circuito C8 · cocina (XE)',
      intro: 'La estufa se alimenta entre las dos fases (240 V) y necesita el neutro para su reloj y luz piloto de 120 V. Cada fase lleva su color.',
      cajas: [
        { id: 'tg', n: 'Tablero · C8 (2 polos, 30 A)', x: 10, y: 20, w: 190, h: 320 },
        { id: 'e', n: 'Estufa eléctrica 6 kW', x: 560, y: 20, w: 230, h: 320 }],
      term: [
        T('tg.F1', 'tg', 200, 60, 'Fase A · polo 1', { tor: 'bronce' }), T('tg.F2', 'tg', 200, 120, 'Fase B · polo 2', { tor: 'bronce' }), T('tg.N', 'tg', 200, 190, 'Neutro', { tor: 'plata' }), T('tg.T', 'tg', 200, 255, 'Tierra', { tor: 'verde' }),
        T('e.L1', 'e', 560, 60, 'Estufa · L1', { tor: 'bronce' }), T('e.L2', 'e', 560, 120, 'Estufa · L2', { tor: 'bronce' }), T('e.N', 'e', 560, 190, 'Estufa · neutro', { tor: 'plata' }), T('e.T', 'e', 560, 255, 'Estufa · carcasa', { tor: 'verde' })],
      fuentes: { 'tg.F1': 'F1', 'tg.F2': 'F2', 'tg.N': 'N', 'tg.T': 'T' },
      interruptores: [],
      cargas: [
        { id: 'res', a: 'e.L1', b: 'e.L2', t: 'e.T', V: 240, tipo: 'estufa', nombre: 'Resistencias 6 kW', x: 640, y: 262 },
        { id: 'piloto', a: 'e.L1', b: 'e.N', t: 'e.T', V: 120, tipo: 'piloto', nombre: 'Luz piloto', x: 745, y: 262 }],
      esperado: [{ fn: 'F1', t: ['tg.F1', 'e.L1'] }, { fn: 'F2', t: ['tg.F2', 'e.L2'] }, { fn: 'N', t: ['tg.N', 'e.N'] }, { fn: 'T', t: ['tg.T', 'e.T'] }],
      alt: [[{ fn: 'F1', t: ['tg.F1', 'e.L2'] }, { fn: 'F2', t: ['tg.F2', 'e.L1'] }, { fn: 'N', t: ['tg.N', 'e.N'] }, { fn: 'T', t: ['tg.T', 'e.T'] }]],
      funcional: (an) => an.every((a) => a.cargas.res.on)
    }
  ];

  O.ejPorId = (id) => O.EJ.find((e) => e.id === id);

  /* Redes: unión de bornes por conductores (y, si se pide, por el interior de los aparatos) */
  O.redes = function (ej, cables, opt) {
    opt = opt || {};
    const parent = {};
    ej.term.forEach((t) => { parent[t.id] = t.id; });
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const union = (a, b) => { if (parent[a] === undefined || parent[b] === undefined) return; parent[find(a)] = find(b); };
    for (const w of cables) union(w.a, w.b);
    if (opt.pos) {
      for (const s of ej.interruptores || []) {
        const p = opt.pos[s.id] || 0;
        if (s.tipo === 'spst') { if (p) union(s.t[0], s.t[1]); } else union(s.c, p ? s.t2 : s.t1);
      }
    }
    if (opt.gfci) for (const g of ej.gfci || []) { union(g.linea[0], g.carga[0]); union(g.linea[1], g.carga[1]); }
    const grupos = {};
    ej.term.forEach((t) => { const r = find(t.id); (grupos[r] = grupos[r] || []).push(t.id); });
    const fuentesDe = (r) => [...new Set(grupos[r].map((id) => ej.fuentes[id]).filter(Boolean))];
    return { find, grupos, fuentesDe };
  };
  const esFase = (s) => s === 'F' || s === 'F1' || s === 'F2';
  function voltaje(sa, sb) {
    for (const a of sa) for (const b of sb) {
      if (esFase(a) && b === 'N') return 120;
      if (esFase(b) && a === 'N') return 120;
      if ((a === 'F1' && b === 'F2') || (a === 'F2' && b === 'F1')) return 240;
    }
    return 0;
  }
  /* Simulación del montaje en un estado de interruptores */
  O.simulaEj = function (ej, cables, pos) {
    const rd = O.redes(ej, cables, { pos, gfci: true });
    const out = { pos, cortos: [], cargas: {}, peligros: [] };
    for (const r in rd.grupos) {
      const s = rd.fuentesDe(r);
      if (s.length >= 2) {
        const fases = s.filter(esFase);
        if (fases.length && s.includes('N')) out.cortos.push('Cortocircuito fase–neutro: el interruptor automático dispara de inmediato.');
        else if (fases.length && s.includes('T')) out.cortos.push('Fase conectada a tierra: falla a tierra directa que dispara la protección.');
        else if (fases.length >= 2) out.cortos.push('Las dos fases quedaron unidas: cortocircuito entre fases.');
        else if (s.includes('N') && s.includes('T')) out.peligros.push('Neutro y tierra unidos aguas abajo del tablero: la corriente de carga retorna también por la tierra y la carcasa puede energizarse.');
      }
    }
    for (const c of ej.cargas) {
      const sa = rd.fuentesDe(rd.find(c.a)), sb = rd.fuentesDe(rd.find(c.b));
      const V = voltaje(sa, sb);
      const on = V > 0 && !out.cortos.length;
      out.cargas[c.id] = { V, on };
      const ga = sa.some(esFase), gb = sb.some(esFase);
      if (!on && (ga || gb)) out.peligros.push(`${c.nombre}: queda con tensión en ${ga ? 'el contacto de fase' : 'el neutro'} aunque esté apagada (el corte debe hacerse en la fase).`);
      if (c.t && rd.fuentesDe(rd.find(c.t)).some(esFase)) out.peligros.push(`${c.nombre}: la carcasa quedó conectada a la fase y se electrifica.`);
    }
    return out;
  };
  /* Todas las combinaciones de interruptores */
  O.simulaTodo = function (ej, cables) {
    const ids = (ej.interruptores || []).map((s) => s.id);
    const res = [];
    for (let m = 0; m < (1 << ids.length); m++) {
      const pos = {};
      ids.forEach((id, i) => { pos[id] = (m >> i) & 1; });
      res.push(O.simulaEj(ej, cables, pos));
    }
    return res;
  };
  /* Fuga a tierra simulada en la toma aguas abajo del GFCI: ¿dispara? */
  O.pruebaGFCI = function (ej, cables) {
    const rd = O.redes(ej, cables, {});
    const g = ej.gfci[0];
    const linea = rd.find(g.linea[0]);
    const carga = rd.find(g.carga[0]);
    const tF = rd.find('t.F');
    if (rd.find(g.linea[0]) === rd.find('g.CF')) return { ok: false, msg: 'El borne LINE y el LOAD están unidos por fuera: el GFCI queda puenteado y no protege.' };
    if (rd.fuentesDe(rd.find('g.CF')).length) return { ok: false, msg: 'La alimentación llegó a los bornes LOAD: línea y carga están invertidas, el GFCI no rearma y no protege.' };
    if (tF === carga) return { ok: true, msg: 'La fuga en la toma aguas abajo pasa por el GFCI: dispara en menos de 25 ms (corriente de 6 mA o más).' };
    if (tF === linea) return { ok: false, msg: 'La toma común está conectada a la línea, no a LOAD: una fuga en ella no pasa por el GFCI y no dispara.' };
    return { ok: false, msg: 'La toma común no está alimentada desde los bornes LOAD del GFCI.' };
  };

  const nombreT = (ej, id) => (ej.term.find((t) => t.id === id) || { nombre: id }).nombre;
  /* Cruces típicos entre funciones: mensaje didáctico */
  const CRUCE = {
    'F-N': 'cortocircuito fase–neutro', 'F-T': 'fase a tierra', 'N-T': 'neutro unido a tierra fuera del tablero', 'F1-F2': 'cortocircuito entre fases',
    'F-R': 'el interruptor queda puenteado y la luminaria no se apaga', 'N-R': 'retorno unido al neutro: la luminaria se apaga mal o hay corto', 'F-V': 'fase conectada a un viajero', 'R-V': 'viajero unido al retorno'
  };
  /* Compara las redes dibujadas con un conjunto esperado */
  function compara(ej, cand, rd) {
    const issues = [];
    const sitio = {}; // borne → índice de red esperada
    cand.forEach((n, i) => n.t.forEach((t) => { sitio[t] = i; }));
    cand.forEach((n) => {
      const raices = [...new Set(n.t.map((t) => rd.find(t)))];
      if (raices.length > 1) {
        raices.slice(1).forEach((r) => {
          const t0 = n.t.find((t) => rd.find(t) === raices[0]), t1 = n.t.find((t) => rd.find(t) === r);
          issues.push({ tipo: 'falta', a: t0, b: t1, msg: `Falta unir «${nombreT(ej, t0)}» con «${nombreT(ej, t1)}».` });
        });
      }
    });
    for (const r in rd.grupos) {
      const idx = [...new Set(rd.grupos[r].map((t) => (sitio[t] === undefined ? 'x' + t : sitio[t])))];
      if (idx.length > 1) {
        const ORD = ['F', 'F1', 'F2', 'N', 'T', 'R', 'V', 'X'];
        const lista = idx.map((i) => (typeof i === 'number' ? cand[i].fn : 'X')).sort((p, q) => ORD.indexOf(p) - ORD.indexOf(q));
        const dosFases = lista.length === 2 && lista[0] === 'F1' && lista[1] === 'F2';
        const kk = dosFases ? 'F1-F2' : lista.map((x) => (x[0] === 'F' ? 'F' : x)).join('-');
        const nota = CRUCE[kk] || '';
        const ts = idx.map((i) => (typeof i === 'number' ? cand[i].t[0] : i.slice(1)));
        issues.push({ tipo: 'cruce', msg: `Hay bornes unidos que no deben estarlo: «${nombreT(ej, ts[0])}» y «${nombreT(ej, ts[1])}»${nota ? ' → ' + nota : ''}.` });
      }
    }
    return issues;
  }
  /* Verificación completa de un montaje */
  O.verificaEj = function (ej, cables) {
    const rd = O.redes(ej, cables, {});
    const cands = [ej.esperado].concat(ej.alt || []);
    let mejor = null;
    for (const cand of cands) {
      const iss = compara(ej, cand, rd);
      if (!mejor || iss.length < mejor.iss.length) mejor = { cand, iss };
    }
    const problemas = mejor.iss.map((i) => ({ t: 'conexión', msg: i.msg }));
    // colores
    const colorIncorrectos = [];
    for (const w of cables) {
      const r = rd.find(w.a);
      const fuentes = rd.fuentesDe(r);
      let fn = null;
      const sf = fuentes.find((s) => ['F', 'F1', 'F2', 'N', 'T'].includes(s));
      if (fuentes.length === 1) fn = sf;
      else if (!fuentes.length) {
        const n = mejor.cand.find((n) => n.t.includes(w.a) || n.t.includes(w.b));
        if (n) fn = n.fn;
      }
      if (!fn) continue;
      if (!w.color) { colorIncorrectos.push(w); problemas.push({ t: 'color', msg: `El conductor «${nombreT(ej, w.a)}» → «${nombreT(ej, w.b)}» no tiene color asignado.` }); continue; }
      if (!N.colorOk(fn, w.color)) {
        colorIncorrectos.push(w);
        const ok = N.COLOR_FUNCION[fn].join(' o ');
        problemas.push({ t: 'color', msg: `El conductor de ${N.FUNCION_NOMBRE[fn]} («${nombreT(ej, w.a)}» → «${nombreT(ej, w.b)}») es ${w.color}; debe ser ${ok}` + (fn === 'R' || fn === 'V' ? ' (nunca blanco, gris ni verde, reservados al neutro y a la tierra).' : '.') });
      }
    }
    // comportamiento
    const an = O.simulaTodo(ej, cables);
    const seg = new Set();
    an.forEach((a) => { a.cortos.forEach((m) => seg.add(m)); a.peligros.forEach((m) => seg.add(m)); });
    seg.forEach((m) => problemas.push({ t: 'seguridad', msg: m }));
    const estructuraOk = mejor.iss.length === 0;
    const funcional = estructuraOk && ej.funcional(an);
    if (estructuraOk && !funcional) problemas.push({ t: 'función', msg: 'El montaje no se comporta como se espera.' });
    if (ej.gfci) {
      const g = O.pruebaGFCI(ej, cables);
      if (!g.ok) problemas.push({ t: 'seguridad', msg: g.msg });
    }
    return { ok: problemas.length === 0 && cables.length > 0, problemas, estructuraOk, nCables: cables.length, redes: rd, an };
  };

  /* Evaluación de la etapa */
  O.ev.cableado = function (E) {
    const items = [];
    for (const ej of O.EJ) {
      const s = E.cableado[ej.id];
      if (!s || !s.cables || !s.cables.length) { items.push(O.it('pend', 'RETIE Título 5 y NTC 2050, 200.6, 250.119', `${ej.titulo}: sin cablear.`, { ej: ej.id })); continue; }
      const v = O.verificaEj(ej, s.cables);
      items.push(v.ok ? O.it('ok', 'RETIE Título 5, Tabla 3.5.a', `${ej.titulo}: conexiones, colores y funcionamiento correctos.`, { ej: ej.id })
        : O.it('falla', 'RETIE Título 5, Tabla 3.5.a', `${ej.titulo}: ${v.problemas[0].msg}`, { ej: ej.id }));
    }
    const q = E.cableado.quiz;
    items.push(!q || q.total == null ? O.it('pend', 'RETIE Tabla 3.5.a', 'Cuestionario del código de colores sin responder.')
      : q.aciertos >= q.total - 1 ? O.it('ok', 'RETIE Tabla 3.5.a', `Código de colores: ${q.aciertos} de ${q.total}.`) : O.it('falla', 'RETIE Tabla 3.5.a', `Código de colores: ${q.aciertos} de ${q.total}.`));
    return O.resumen(items);
  };

  /* Preguntas del código de colores (Tabla 3.5.a) */
  O.QUIZ = [
    { q: 'En un sistema monofásico trifilar 120/240 V, ¿de qué color es el conductor neutro?', op: ['Blanco', 'Verde', 'Negro', 'Gris'], ok: 0, por: 'Tabla 3.5.a: el neutro es blanco en 120/240 V y 208/120 V.' },
    { q: '¿Qué colores tienen las dos fases de un monofásico trifilar 120/240 V?', op: ['Negro y rojo', 'Amarillo y azul', 'Blanco y negro', 'Rojo y verde'], ok: 0, por: 'La Tabla 3.5.a admite el color de las fases o negro; en la práctica negro y rojo.' },
    { q: 'El conductor de puesta a tierra de equipos (aislado) debe ser:', op: ['Verde o verde con franja amarilla', 'Blanco con franja verde', 'Rojo', 'Gris'], ok: 0, por: 'La tierra es verde, verde/amarillo o desnuda; ningún otro color.' },
    { q: 'En un trifásico 208/120 V, ¿cuáles son los colores de las fases?', op: ['Amarillo, azul y rojo', 'Negro, rojo y azul', 'Café, naranja y amarillo', 'Verde, blanco y negro'], ok: 0, por: 'Tabla 3.5.a: 208/120 V es amarillo, azul y rojo; café, naranja y amarillo es 480/277 V.' },
    { q: 'En un trifásico 480/277 V, ¿de qué color es el neutro?', op: ['Gris', 'Blanco', 'Verde', 'Negro'], ok: 0, por: 'En 480/277 V el neutro es gris; el blanco es de 208/120 V y 120/240 V.' },
    { q: 'El conductor de retorno de un interruptor (hacia la lámpara) no puede ser:', op: ['Blanco', 'Amarillo', 'Azul', 'Negro'], ok: 0, por: 'El blanco y el gris están reservados al neutro, y el verde a la tierra.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
