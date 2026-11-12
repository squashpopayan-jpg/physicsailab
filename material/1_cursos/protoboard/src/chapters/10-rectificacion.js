/* Capítulo 10 — Rectificación y fuente de alimentación */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 10.1 Media onda: el transformador alimenta un diodo y una carga */
  const media = (RL) => ({
    parts: [['D1', 'D', { model: '1N4007' }, 'h5', 'h9'], ['R1', 'R', { r: RL }, 'g9', 'g13']],
    wires: [['@ac1', 'j5', 'orange'], ['@ac2', 'T-1', 'black'], ['j13', 'T-3', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6', s2: 'i9', s2g: 'T-8' },
    ac: { vrms: 12 },
    osc: { tdiv: 5e-3, ch: [{ vdiv: 5, on: true }, { vdiv: 5, on: true }] }
  });
  EM.defineSim('c10-media', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['ac', 'scope'], tray: false, tdiv: 5e-3, showInst: 'scope',
      hint: 'El secundario del transformador (12 V eficaces) alimenta un diodo y una carga. Canal 1: entrada; canal 2: carga.',
      spec: media(1000),
      controls: [{ type: 'select', id: 'r', label: 'Carga', options: [[100, '100 Ω'], [1000, '1 kΩ'], [10000, '10 kΩ']], value: 1000, init: false, apply: (L, v) => L.set('R1', 'r', +v) }],
      outs: [
        { id: 'in', label: 'Entrada: pico', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.mx, 'V') : '—'; } },
        { id: 'out', label: 'Salida: pico', hl: true, fn: (L) => { const s = L.stat('c2'); return s ? fmt(s.mx, 'V') : '—'; } },
        { id: 'med', label: 'Salida: valor medio', fn: (L) => { const s = L.stat('c2'); return s ? fmt(s.mean, 'V') : '—'; } }
      ]
    });
  });

  /* 10.2 Puente rectificador con filtro */
  const puente = () => ({
    parts: [['BR1', 'BR', { model: '1N4007' }, 'e8'], ['R1', 'R', { r: 470, watt: 2 }, 'd9', 'B-5']],
    wires: [['@ac1', 'a8', 'orange'], ['@ac2', 'a10', 'orange'], ['a11', 'B-3', 'black']],
    probes: { s1: 'c9', s1g: 'B-8', s2: 'c8', s2g: 'B-10' },
    ac: { vrms: 12 },
    osc: { tdiv: 5e-3, ch: [{ vdiv: 5, on: true, pos: -3 }, { vdiv: 5, on: true, pos: -3 }] }
  });
  EM.defineSim('c10-puente', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['ac', 'scope', 'dmm'], tray: false, tdiv: 5e-3, showInst: 'scope',
      hint: 'Puente rectificador, carga de 470 Ω y un electrolítico de filtro opcional. Canal 1: salida (+); canal 2: una entrada del puente.',
      spec: puente(),
      controls: [
        { type: 'select', id: 'c', label: 'Condensador de filtro', options: [[0, 'ninguno'], [1e-5, '10 µF'], [1e-4, '100 µF'], [4.7e-4, '470 µF'], [2.2e-3, '2200 µF']], value: 0, init: false, apply: (L, v) => { if (+v === 0) L.removePart('C1'); else if (L.part('C1')) L.set('C1', 'c', +v); else L.addPartAt('C1', 'CE', { c: +v, vmax: 35 }, ['c9', 'B-7']); } },
        { type: 'select', id: 'r', label: 'Carga', options: [[100, '100 Ω'], [470, '470 Ω'], [2200, '2,2 kΩ']], value: 470, init: false, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 'med', label: 'Tensión continua (media)', hl: true, fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'pp', label: 'Rizado (pico a pico)', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'st', label: 'Estado', fn: (L) => (L.anyDead() ? 'algo se dañó' : 'normal') }
      ]
    });
  });

  /* 10.3 Fuente completa de 5 V: puente + filtro + 7805 */
  const fuente = EM.SP.fuente5;
  EM.defineSim('c10-fuente', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['ac', 'scope', 'dmm'], tray: false, tdiv: 5e-3, showInst: 'scope', thermal: 20,
      hint: 'Fuente lineal: transformador, puente, filtro de 2200 µF, regulador 7805, un LED y una carga. Canal 1: antes del regulador; canal 2: salida.',
      spec: fuente(47),
      controls: [
        { type: 'select', id: 'rl', label: 'Carga', options: [[1000, '1 kΩ (5 mA)'], [100, '100 Ω (50 mA)'], [47, '47 Ω (106 mA)'], [10, '10 Ω (0,5 A)']], value: 47, init: false, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'select', id: 'v', label: 'Tensión del transformador', options: [[9, '9 V~'], [12, '12 V~'], [18, '18 V~'], [24, '24 V~']], value: 12, init: false, apply: (L, v) => { L.bench.inst.ac.vrms = +v; L.bench.invalidate(); if (L.inst) L.inst.refresh(); } }
      ],
      outs: [
        { id: 'vi', label: 'Entrada del regulador (media)', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'ri', label: 'Rizado en la entrada', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'vo', label: 'Salida (media)', hl: true, fn: (L) => { const s = L.stat('c2'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'ro', label: 'Rizado en la salida', fn: (L) => { const s = L.stat('c2'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'tr', label: 'Temperatura del 7805', fn: (L) => (L.dead('U1') ? 'dañado' : Math.round(L.T('U1')) + ' °C') }
      ]
    });
  });
})();
