/* Capítulo 21 — Proyectos en casa III: energía */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* P7 · Fuente de 5 V con un 7805 alimentado por una batería: carga de 100 Ω y LED indicador */
  const f5 = (kind, rl) => ({
    parts: [['B1', 'BATP', { kind }, 'B+1', 'B-1'], ['U1', 'REG', { model: '7805' }, 'e10'], ['C1', 'C', { c: 3.3e-7 }, 'c10', 'c11'], ['C2', 'C', { c: 1e-7 }, 'c12', 'b11'],
      ['R1', 'R', { r: 330 }, 'd12', 'd16'], ['D1', 'LED', { color: 'verde' }, 'c16', 'c17'], ['R2', 'R', { r: rl, watt: 1 }, 'a12', 'B-8']],
    wires: [['a10', 'B+3', 'red'], ['a11', 'B-3', 'black'], ['a17', 'B-5', 'black']],
    probes: {}, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('p7-fuente5', function (sim) {
    const st = { k: 'alk9', rl: 100 };
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, thermal: 20, showInst: 'dmm',
      hint: 'Fuente de 5 V para un proyecto: batería → 7805 → carga. ¿Alcanza una batería de 4 pilas (6 V)? Mida la salida con el multímetro.',
      spec: Object.assign(f5('alk9', 100), { probes: { dmmR: 'b12', dmmB: 'B-10' } }),
      controls: [
        { type: 'select', id: 'k', label: 'Alimentación', options: [['alk9', 'Batería de 9 V'], ['aa4', '4 pilas AA (6 V)'], ['usb', 'Cargador USB (5,1 V)']], value: 'alk9', init: false, apply: (L, v) => L.set('B1', 'kind', v) },
        { type: 'select', id: 'rl', label: 'Carga', options: [[1000, '1 kΩ (5 mA)'], [100, '100 Ω (50 mA)'], [47, '47 Ω (106 mA)'], [22, '22 Ω (230 mA)']], value: 100, init: false, apply: (L, v) => L.set('R2', 'r', +v) }
      ],
      outs: [
        { id: 'vo', label: 'Salida del 7805', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'vb', label: 'Tensión de la batería bajo carga', fn: (L) => fmt(L.v('a10', 'a11'), 'V') },
        { id: 'tr', label: 'Temperatura del 7805', fn: (L) => Math.round(L.T('U1')) + ' °C' },
        { id: 'au', label: 'Autonomía estimada (batería de 9 V, 500 mAh)', fn: (L) => { const i = Math.abs(L.i('B1')); return i > 0 ? fmt(0.5 / i, 'h') : '—'; } }
      ]
    });
  });

  /* P8 · Fuente regulable de 1,25 V a 12 V con LM317 y un potenciómetro (entrada de 15 V) */
  const var317 = () => ({
    parts: [['U1', 'REG', { model: 'LM317', hs: 20 }, 'e10'], ['R1', 'R', { r: 240 }, 'c11', 'c10'], ['RV1', 'POT', { r: 2500, pos: 0.5 }, 'e16'], ['R3', 'R', { r: 470, watt: 2 }, 'd11', 'B-8']],
    wires: [['@ps1+', 'B+1', 'red'], ['@ps1-', 'B-1', 'black'], ['a12', 'B+4', 'red'], ['a16', 'a10', 'orange'], ['a17', 'b18', 'orange'], ['a18', 'B-6', 'black']],
    psu: { 1: { v: 15, ilim: 1, on: true } }, probes: { dmmR: 'a11', dmmB: 'B-10' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('p8-regulable', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, thermal: 20, showInst: 'dmm',
      hint: 'LM317 con un potenciómetro de 2,5 kΩ como R₂: gire el cursor y la salida cambia de 1,25 V a unos 12 V.',
      spec: var317(),
      controls: [{ type: 'slider', id: 'p', label: 'Perilla del potenciómetro', min: 0, max: 1, step: 0.01, value: 0.5, apply: (L, v) => L.set('RV1', 'pos', v) }],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'vt', label: 'Teórica', fn: (L) => fmt(1.25 * (1 + 2500 * L.part('RV1').p.pos / 240), 'V') },
        { id: 't', label: 'Temperatura del LM317', fn: (L) => Math.round(L.T('U1')) + ' °C' }
      ]
    });
  });

  /* P9 · Resistencia interna de una pila: tensión en vacío y bajo carga */
  const rint = (kind, rl) => ({
    parts: [['B1', 'BATP', { kind }, 'B+1', 'B-1'], ['R1', 'R', { r: rl, watt: 5 }, 'B+5', 'B-5']],
    wires: [], probes: { dmmR: 'B+8', dmmB: 'B-8' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('p9-pila', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, thermal: 20, showInst: 'dmm',
      hint: 'Mida la tensión de una batería sin carga y con un resistor de carga: la diferencia da su resistencia interna.',
      spec: rint('alk9', 1e9),
      controls: [
        { type: 'select', id: 'k', label: 'Fuente', options: [['alk9', 'Batería alcalina de 9 V'], ['aa2', '2 pilas AA en serie (3 V)'], ['aa4', '4 pilas AA (6 V)'], ['li', 'Li-ion 18650 (3,7 V)'], ['usb', 'Cargador USB (5 V)']], value: 'alk9', apply: (L, v) => L.set('B1', 'kind', v) },
        { type: 'select', id: 'rl', label: 'Carga', options: [[1e9, 'sin carga'], [1000, '1 kΩ'], [100, '100 Ω'], [47, '47 Ω'], [22, '22 Ω']], value: 1e9, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 'v', label: 'Tensión en bornes (multímetro)', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'i', label: 'Corriente de la carga', fn: (L) => fmt(Math.abs(L.i('B1')), 'A') },
        { id: 'r', label: 'Resistencia interna r = (E − V)/I', fn: (L) => { const E = L.part('B1').p.v, V = L.v('B+5', 'B-5'), I = Math.abs(L.i('B1')); return I > 1e-4 ? fmt((E - V) / I, 'Ω') : '—'; } },
        { id: 'p', label: 'Potencia perdida dentro de la batería', fn: (L) => fmt(Math.abs(L.i('B1')) ** 2 * L.part('B1').p.rs, 'W') }
      ]
    });
  });
})();
