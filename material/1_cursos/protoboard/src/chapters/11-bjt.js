/* Capítulo 11 — El transistor bipolar como interruptor */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* NPN BC547 con patas C-B-E en e10, e11, e12. Carga: +5 V → R 330 → LED → colector.
     Base: canal 2 de la fuente → Rb → base. Alimentación del canal 1 en los rieles superiores (unidos a los inferiores). */
  const swSpec = (rb) => ({
    parts: [['Q1', 'NPN', { model: 'BC547' }, 'e10'], ['R1', 'R', { r: 330 }, 'B+5', 'a14'], ['D1', 'LED', { color: 'rojo' }, 'b14', 'b10'], ['R2', 'R', { r: rb }, 'd11', 'd16']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['a12', 'B-3', 'black'], ['@ps2+', 'a16', 'yellow'], ['@ps2-', 'B-6', 'black']])),
    psu: { 1: { v: 5, ilim: 0.3, on: true }, 2: { v: 0, ilim: 0.05, on: true } }
  });
  EM.defineSim('c11-led', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'psu', thermal: 4,
      hint: 'Un BC547 enciende un LED. La señal de base viene del canal 2 de la fuente a través de Rb: suba su tensión de 0 a 5 V.',
      spec: swSpec(10000),
      controls: [
        { type: 'slider', id: 'vb', label: 'Tensión de señal (canal 2)', min: 0, max: 5, step: 0.05, value: 0, unit: 'V', apply: (L, v) => L.psu(2, { v }) },
        { type: 'select', id: 'rb', label: 'Resistor de base Rb', options: [[1000, '1 kΩ'], [10000, '10 kΩ'], [47000, '47 kΩ'], [470000, '470 kΩ']], value: 10000, apply: (L, v) => L.set('R2', 'r', +v) }
      ],
      outs: [
        { id: 'ib', label: 'Corriente de base I_B', fn: (L) => fmt(Math.abs(L.i('R2')), 'A') },
        { id: 'ic', label: 'Corriente de colector I_C', hl: true, fn: (L) => fmt(Math.max(0, L.i('R1')), 'A') },
        { id: 'vce', label: 'Tensión colector–emisor V_CE', fn: (L) => fmt(Math.abs(L.vp('Q1', 0, 2)), 'V') },
        { id: 'm', label: 'Modo', fn: (L) => { const ic = Math.max(0, L.i('R1')), ib = Math.abs(L.i('R2')); const vce = Math.abs(L.vp('Q1', 0, 2)); return ic < 1e-5 ? 'corte' : vce < 0.4 ? 'saturación' : 'activa (β = ' + (ib > 1e-9 ? Math.round(ic / ib) : '—') + ')'; } }
      ]
    });
  });

  /* 11.2 Relé con y sin diodo de rueda libre, excitado por una cuadrada del generador */
  const releSpec = (diode) => ({
    parts: [['Q1', 'NPN', { model: 'BC547' }, 'e10'], ['K1', 'RELAY', { vnom: 5, rc: 70 }, 'e20'], ['R2', 'R', { r: 1000 }, 'd11', 'd16']].concat(diode ? [['D1', 'D', { model: '1N4007' }, 'f21', 'e24']] : []),
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['a12', 'B-3', 'black'], ['@fgo', 'a16', 'yellow'], ['@fgg', 'B-6', 'black'], ['a10', 'a20', 'orange'], ['j20', 'T+4', 'red']])),
    psu: { 1: { v: 5, ilim: 0.5, on: true } }, fg: { wave: 'pulse', f: 200, amp: 2.5, off: 0, duty: 0.5, on: true },
    probes: { s1: 'c11', s1g: 'B-8', s2: 'c10', s2g: 'B-10' }, osc: { tdiv: 1e-3, ch: [{ vdiv: 1, on: true }, { vdiv: 5, on: true }] }
  });
  EM.defineSim('c11-rele', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'fg', 'scope'], tray: false, thermal: 4, tdiv: 1e-3, showInst: 'scope',
      hint: 'Un BC547 maneja la bobina de un relé de 5 V con una cuadrada de 200 Hz (rápida, para ver el pico). Active y desactive el diodo.',
      spec: releSpec(false),
      controls: [{ type: 'check', id: 'd', label: 'Diodo de rueda libre 1N4007 en la bobina', value: false, init: false, apply: (L, v) => { if (v) L.addPartAt('D1', 'D', { model: '1N4007' }, ['d20', 'g20']); else L.removePart('D1'); } }],
      outs: [
        { id: 'q', label: 'Transistor', hl: true, fn: (L) => (L.dead('Q1') ? 'DESTRUIDO: ' + L.part('Q1').dead.why : 'normal (' + Math.round(L.T('Q1')) + ' °C)') },
        { id: 'vp', label: 'Pico de V_CE registrado', fn: (L) => { const r = L.bench.net.rt.Q1; return r && r.vpk ? fmt(r.vpk, 'V') : '—'; } }
      ]
    });
  });
})();
