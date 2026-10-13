/* ===================================================================
   lib/50-cargas.js — Cuadro de cargas, balance de fases, demanda,
   acometida y circuito representativo de la casa ejemplo
   =================================================================== */
(function (root) {
  'use strict';
  const RT = (root.RT = root.RT || {});
  const L = (RT.L = RT.L || {});
  const C = L.C, N = L.N;
  const Q = (L.Q = {});

  /* Carga de cada punto (VA) para el cuadro de cargas.
     Criterio: luminarias por su potencia; tomas generales 180 VA por salida (220.14(I),
     usado como criterio para repartir circuitos); los circuitos de pequeños artefactos y de
     lavandería se cargan con 1 500 VA (220.52); salidas especiales por su placa. */
  Q.cargaPunto = function (p, c) {
    if (p.tipo === 'lum' || p.tipo === 'aplique') return p.W;
    if (p.tipo === 'ducha' || p.tipo === 'estufa') return p.W;
    if (p.tipo === 'toma') return 180;
    return 0;
  };
  Q.circuitosEspeciales = { C4: 1500, C5: 1500, C6: 1500 };
  Q.cuadro = function (casa) {
    const filas = [];
    for (const c of casa.electrico.circuitos) {
      const pts = casa.electrico.puntos.filter((p) => p.c === c.id);
      const cuenta = { lum: 0, toma: 0, gfci: 0, esp: 0, int: 0 };
      let va = 0;
      for (const p of pts) {
        va += Q.cargaPunto(p, c);
        if (p.tipo === 'lum' || p.tipo === 'aplique') cuenta.lum++;
        else if (p.tipo === 'toma') { cuenta.toma++; if (p.gfci) cuenta.gfci++; }
        else if (p.tipo === 'ducha' || p.tipo === 'estufa') cuenta.esp++;
        else cuenta.int++;
      }
      const vaBase = va;
      if (Q.circuitosEspeciales[c.id]) va = Math.max(va, Q.circuitosEspeciales[c.id]);
      const I = va / c.V;
      const amb = [...new Set(pts.map((p) => p.amb))].map((a) => (a === 'exterior' ? 'exterior' : (casa.ambiente(a) || {}).nombre)).join(', ');
      const prot = (c.polos === 2 ? '2P ' : '1P ') + c.In + ' A' + (c.diferencial ? ' + diferencial 30 mA' : '');
      filas.push({ c, id: c.id, nombre: c.nombre, amb, pts, cuenta, vaBase, va, I, carga: I / c.In, prot, awg: c.awg, tierra: c.tierra, tubo: c.tubo, fase: c.fase, V: c.V });
    }
    return filas;
  };
  Q.balance = function (casa, asign = null) {
    const f = Q.cuadro(casa);
    let A = 0, B = 0;
    for (const r of f) {
      const fase = asign ? asign[r.id] || r.fase : r.fase;
      if (fase === 'AB') { A += r.va / 2; B += r.va / 2; }
      else if (fase === 'A') A += r.va; else B += r.va;
    }
    const prom = (A + B) / 2;
    return { A, B, IA: A / 120, IB: B / 120, IN: Math.abs(A - B) / 120, desb: prom ? Math.abs(A - B) / (2 * prom) : 0 };
  };
  /* Demanda de la casa por el método estándar */
  Q.demanda = function (casa) {
    const area = casa.areaConstruida();
    const P = casa.electrico.puntos;
    const est = P.filter((p) => p.tipo === 'estufa').map((p) => p.W / 1000);
    const fijos = P.filter((p) => p.tipo === 'ducha').map((p) => ({ n: 'ducha ' + p.W + ' W', W: p.W }));
    return C.demandaVivienda({ area, nPA: 2, nLav: 1, estufas: est, fijos });
  };
  /* Acometida / alimentador principal */
  Q.acometida = function (casa) {
    const d = Q.demanda(casa);
    const I = d.I240;
    const awg = N.AWG.find((a) => N.AMPACIDAD[a][0] >= I);
    const ci = C.capacidadInstalable(awg, 240);
    const In = C.protMax(awg, 60);
    const med = casa.electrico.medidor, tg = casa.punto('TG');
    const Lal = Math.abs(med.z - casa.H.zPiso) + Math.hypot(tg.x - med.x, tg.y - med.y) + Math.abs(tg.z - 0.25 - casa.H.zPiso);
    const dv = C.caida({ I, L: Lal, awg, V: 240 });
    return { dem: d, I, awg, ci, In, Lal, dv };
  };
  /* Caída de tensión por circuito: corriente de diseño hasta el punto más lejano del árbol */
  Q.caidas = function (casa) {
    const tr = L.R.tramos(casa);
    const out = [];
    for (const r of Q.cuadro(casa)) {
      const c = r.c;
      const hijos = {};
      tr.filter((t) => t.c === c.id).forEach((t) => { (hijos[t.u] = hijos[t.u] || []).push(t); });
      let Lmax = 0, lejano = null;
      const dfs = (n, acc) => { const hs = hijos[n] || []; if (!hs.length && acc > Lmax) { Lmax = acc; lejano = n; } hs.forEach((t) => dfs(t.v, acc + t.L)); };
      dfs('TG', 0);
      /* criterio conservador: toda la carga concentrada en el punto más lejano */
      const dv = C.caida({ I: r.I, L: Lmax, awg: c.awg, V: c.V });
      out.push({ id: c.id, Lmax, lejano, I: r.I, pct: dv.pct, dV: dv.dV });
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
