/* Capítulo 12 — Amplificador de emisor común */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* BC547 en e10–e12 (C, B, E). Polarización por divisor 47k/10k, RC = 4,7k, RE = 1k, 12 V. */
  const amp = (bypass) => ({
    parts: [['Q1', 'NPN', { model: 'BC547' }, 'e10'], ['R1', 'R', { r: 47000 }, 'B+4', 'a11'], ['R2', 'R', { r: 10000 }, 'c11', 'B-4'],
      ['R3', 'R', { r: 4700 }, 'B+8', 'a10'], ['R4', 'R', { r: 1000 }, 'a12', 'B-8'], ['C1', 'CF', { c: 1e-6 }, 'b16', 'b11'],
      ['C2', 'CE', { c: 1e-5, vmax: 25 }, 'd10', 'd17'], ['R5', 'R', { r: 10000 }, 'c17', 'B-12']].concat(bypass ? [['C3', 'CE', { c: 1e-4, vmax: 25 }, 'b12', 'B-10']] : []),
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['@fgo', 'a16', 'yellow'], ['@fgg', 'B-2', 'black']])),
    psu: { 1: { v: 12, ilim: 0.2, on: true } }, fg: { wave: 'sin', f: 1000, amp: 0.01, off: 0, on: true },
    probes: { s1: 'e16', s1g: 'B-14', s2: 'e17', s2g: 'B-16' }, osc: { tdiv: 5e-4, ch: [{ vdiv: 0.02, on: true }, { vdiv: 0.5, on: true }] }
  });
  EM.defineSim('c12-amp', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'fg', 'scope', 'dmm'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'Amplificador de emisor común con BC547 a 12 V. Canal 1: entrada (20 mV/div); canal 2: salida. Active el condensador de emisor.',
      spec: amp(true),
      controls: [
        { type: 'check', id: 'ce', label: 'Condensador de desacople en el emisor (100 µF)', value: true, init: false, apply: (L, v) => { if (v) L.addPartAt('C3', 'CE', { c: 1e-4, vmax: 25 }, ['b12', 'B-10']); else L.removePart('C3'); } },
        { type: 'slider', id: 'a', label: 'Amplitud de entrada (pico)', min: 2, max: 150, step: 1, value: 10, unit: 'mV', init: false, apply: (L, v) => { L.fg({ amp: v / 1000 }); const c = L.bench.inst.osc.ch; c[0].vdiv = v <= 10 ? 0.02 : v <= 30 ? 0.05 : 0.1; if (L.inst) L.inst.refresh(); } },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 20, max: 100000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (L, v) => { L.fg({ f: v }); L.autoTdiv(v, 3); } }
      ],
      outs: [
        { id: 'g', label: 'Ganancia |V_out/V_in|', hl: true, fn: (L) => { const a = L.stat('c1'), b = L.stat('c2'); return a && b && a.pp > 1e-4 ? (b.pp / a.pp).toFixed(1) : '—'; } },
        { id: 'vb', label: 'V_B (reposo)', fn: (L) => fmt(L.v('a11') , 'V') },
        { id: 've', label: 'V_E', fn: (L) => fmt(L.v('a12'), 'V') },
        { id: 'vc', label: 'V_C', fn: (L) => fmt(L.v('a10'), 'V') }
      ]
    });
  });
})();
