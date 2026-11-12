/* Capítulo 7 — Condensadores y circuitos RC */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 7.1 Carga y descarga de un electrolítico, medida con el multímetro */
  EM.defineSim('c7-carga', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, startZero: true, tdiv: 1, showInst: 'dmm',
      hint: 'Un resistor de 10 kΩ carga un condensador de 100 µF (τ = 1 s). El tiempo del simulador va lento: observe el multímetro y el reloj.',
      spec: { parts: [['R1', 'R', { r: 10000 }, 'h8', 'h12'], ['C1', 'CE', { c: 1e-4, vmax: 16 }, 'g12', 'g16']], wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v: 5, ilim: 0.2, on: true } }, probes: { dmmR: 'i12', dmmB: 'T-6' }, dmm: { mode: 'V=', jack: 'v' } },
      controls: [
        { type: 'check', id: 'd', label: 'Descargar el condensador con un cable', value: false, init: false, apply: (L, v) => { if (v && !L.hasWire('wd')) L.wire('f12', 'T-8', 'white', 'wd'); else if (!v && L.hasWire('wd')) L.unwire('wd'); } },
        { type: 'select', id: 'r', label: 'Resistor de carga', options: [[1000, '1 kΩ (τ = 0,1 s)'], [10000, '10 kΩ (τ = 1 s)'], [47000, '47 kΩ (τ = 4,7 s)']], value: 10000, init: false, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 't', label: 'Tiempo simulado', fn: (L) => fmt(L.bench.simT, 's', 3) },
        { id: 'v', label: 'Tensión en el condensador', hl: true, fn: (L) => fmt(L.vp('C1'), 'V') },
        { id: 'te', label: 'Teórica 5·(1−e^(−t/RC))', fn: (L) => fmt(5 * (1 - Math.exp(-L.bench.simT / (L.part('R1').p.r * 1e-4))), 'V') },
        { id: 'tau', label: 'Constante de tiempo τ = RC', fn: (L) => fmt(L.part('R1').p.r * 1e-4, 's') }
      ]
    });
  });

  /* 7.2 RC con onda cuadrada: ver la carga en el osciloscopio */
  const rcSq = (R, C, f) => ({
    parts: [['R1', 'R', { r: R }, 'h5', 'h9'], ['C1', C >= 1e-6 ? 'CF' : 'C', { c: C }, 'g9', 'g12']],
    wires: [['@fgo', 'j5', 'yellow'], ['@fgg', 'T-1', 'black'], ['T-3', 'j12', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6', s2: 'i9', s2g: 'T-8' },
    fg: { wave: 'square', f, amp: 2.5, off: 2.5, on: true },
    osc: { tdiv: 5e-4, ch: [{ vdiv: 1, on: true, pos: -2 }, { vdiv: 1, on: true, pos: -2 }] }
  });
  EM.defineSim('c7-rc-scope', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope', startZero: false,
      hint: 'Una onda cuadrada de 0 a 5 V carga y descarga el condensador. Canal 1: entrada; canal 2: tensión en C.',
      spec: rcSq(1000, 1e-6, 200),
      controls: [
        { type: 'select', id: 'r', label: 'Resistor', options: [[470, '470 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ']], value: 1000, init: false, apply: (L, v) => { L.set('R1', 'r', +v); } },
        { type: 'select', id: 'c', label: 'Condensador', options: [[1e-7, '100 nF'], [1e-6, '1 µF'], [1e-5, '10 µF']], value: 1e-6, init: false, apply: (L, v) => { L.set('C1', 'c', +v); } },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 20, max: 5000, value: 200, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (L, v) => { L.fg({ f: v }); L.autoTdiv(v, 2); } }
      ],
      outs: [
        { id: 'tau', label: 'Constante de tiempo τ = RC', hl: true, fn: (L) => fmt((L.part('R1').p.r + 50) * L.part('C1').p.c, 's') },
        { id: 'tr', label: 'Tiempo de subida 10–90 % = 2,2τ', fn: (L) => fmt(2.2 * (L.part('R1').p.r + 50) * L.part('C1').p.c, 's') },
        { id: 'T', label: 'Medio periodo de la cuadrada', fn: (L) => fmt(0.5 / L.bench.inst.fg.f, 's') },
        { id: 'a', label: 'Pico a pico en C', fn: (L) => { const s = L.stat('c2'); return s ? fmt(s.pp, 'V') : '—'; } }
      ]
    });
  });

  /* 7.3 Filtro pasaaltos: el condensador en serie */
  const hp = () => ({
    parts: [['C1', 'CF', { c: 1e-7 }, 'g5', 'g9'], ['R1', 'R', { r: 1000 }, 'h9', 'h13']],
    wires: [['@fgo', 'j5', 'yellow'], ['@fgg', 'T-1', 'black'], ['T-3', 'j13', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6', s2: 'i9', s2g: 'T-8' },
    fg: { wave: 'sin', f: 1000, amp: 1, off: 0, on: true },
    osc: { tdiv: 5e-4, ch: [{ vdiv: 0.5, on: true }, { vdiv: 0.5, on: true }] }
  });
  EM.defineSim('c7-pasaaltos', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'Filtro pasaaltos: el condensador en serie (100 nF) y el resistor a tierra (1 kΩ). La salida es la tensión en el resistor.',
      spec: hp(),
      controls: [{ type: 'slider', id: 'f', label: 'Frecuencia', min: 20, max: 20000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => { L.fg({ f: v }); L.autoTdiv(v, 3); } }],
      outs: [
        { id: 'g', label: 'Ganancia medida (CH2/CH1)', hl: true, fn: (L) => { const a = L.stat('c1'), b = L.stat('c2'); return a && b && a.pp > 1e-6 ? (b.pp / a.pp).toFixed(3) : '—'; } },
        { id: 'gt', label: 'Ganancia teórica', fn: (L) => { const f = L.bench.inst.fg.f, fc = 1 / (2 * Math.PI * 1000 * 1e-7); return (1 / Math.hypot(1, fc / f)).toFixed(3); } },
        { id: 'fc', label: 'Frecuencia de corte', fn: () => fmt(1 / (2 * Math.PI * 1000 * 1e-7), 'Hz') }
      ]
    });
  });
})();
