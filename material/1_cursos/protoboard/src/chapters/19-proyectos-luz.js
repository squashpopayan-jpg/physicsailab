/* Capítulo 19 — Proyectos en casa I: luz y sensores */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* P1 · Linterna con LED blanco: batería de 4 pilas AA → interruptor → resistor → LED */
  const lin = (kind, color, r) => ({
    parts: [['B1', 'BATP', { kind }, 'B+1', 'B-1'], ['S1', 'SW', { pos: 0 }, 'e8'], ['R1', 'R', { r }, 'd10', 'd14'], ['D1', 'LED', { color }, 'c14', 'c15']],
    wires: [['a9', 'B+3', 'red'], ['a15', 'B-4', 'black']]
  });
  EM.defineSim('p1-linterna', function (sim) {
    const st = { kind: 'aa4', color: 'blanco', r: 150 };
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, showInst: 'dmm', thermal: 4,
      hint: 'Linterna de 4 pilas AA y un LED blanco. Cierre el interruptor y pruebe otros colores, otras pilas y otro resistor.',
      spec: lin('aa4', 'blanco', 150),
      controls: [
        { type: 'check', id: 'on', label: 'Interruptor cerrado', value: false, init: false, apply: (L, v) => L.set('S1', 'pos', v ? 1 : 0) },
        { type: 'select', id: 'c', label: 'LED', options: [['blanco', 'Blanco (≈ 3,1 V)'], ['azul', 'Azul (≈ 3,0 V)'], ['verde', 'Verde (≈ 2,1 V)'], ['rojo', 'Rojo (≈ 2,0 V)']], value: 'blanco', init: false, apply: (L, v) => L.set('D1', 'color', v) },
        { type: 'select', id: 'k', label: 'Pilas', options: [['aa2', '2 pilas AA (3 V)'], ['aa4', '4 pilas AA (6 V)'], ['alk9', 'Batería de 9 V']], value: 'aa4', init: false, apply: (L, v) => L.set('B1', 'kind', v) },
        { type: 'select', id: 'r', label: 'Resistor', options: [[47, '47 Ω'], [100, '100 Ω'], [150, '150 Ω'], [330, '330 Ω'], [1000, '1 kΩ']], value: 150, init: false, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 'i', label: 'Corriente del LED', hl: true, fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') },
        { id: 'p', label: 'Potencia en el resistor', fn: (L) => fmt(L.i('R1') ** 2 * L.part('R1').p.r, 'W') },
        { id: 'st', label: 'Estado', fn: (L) => (L.dead('D1') ? 'LED QUEMADO' : L.i('D1') > 0.002 ? 'encendido' : 'apagado') }
      ]
    });
  });

  /* P2 · Lámpara nocturna automática con LM358 y LDR, alimentada con 4 pilas AA (rieles superiores) */
  const noct = () => ({
    parts: [['B1', 'BATP', { kind: 'aa4' }, 'T+1', 'T-1', { body: [24, 44] }], ['U1', 'LM358', {}, 'e10'], ['LDR1', 'LDR', { lux: 200 }, 'B+6', 'a11'], ['R1', 'R', { r: 10000 }, 'b11', 'B-6'], ['RV1', 'POT', { r: 10000, pos: 0.5 }, 'e16'],
      ['R2', 'R', { r: 220 }, 'd10', 'd14'], ['D1', 'LED', { color: 'blanco' }, 'c14', 'c15']],
    wires: EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a13', 'B-4', 'black'], ['a16', 'B+3', 'red'], ['a18', 'B-3', 'black'], ['a17', 'a12', 'orange'], ['a15', 'B-5', 'black']]),
    probes: { dmmR: 'c11', dmmB: 'B-8' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('p2-nocturna', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, showInst: 'dmm',
      hint: 'Lámpara que se enciende sola al oscurecer: 4 pilas AA, un LM358, una LDR y un potenciómetro de umbral.',
      spec: noct(),
      controls: [
        { type: 'slider', id: 'lux', label: 'Luz de la habitación', min: 1, max: 10000, value: 200, unit: 'lux', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => L.set('LDR1', 'lux', v) },
        { type: 'slider', id: 'p', label: 'Umbral (potenciómetro)', min: 0.05, max: 0.95, step: 0.01, value: 0.5, apply: (L, v) => L.set('RV1', 'pos', v) }
      ],
      outs: [
        { id: 'lux', label: 'Tensión de la LDR (IN−)', fn: (L) => fmt(L.v('a11', 'B-8'), 'V') },
        { id: 'u', label: 'Umbral (IN+)', fn: (L) => fmt(L.v('a12', 'B-8'), 'V') },
        { id: 'led', label: 'Lámpara', hl: true, fn: (L) => (L.i('D1') > 0.002 ? 'ENCENDIDA (' + fmt(L.i('D1'), 'A') + ')' : 'apagada') }
      ]
    });
  });

  /* P3 · Sensor de toque / humedad con un par Darlington de dos BC547 */
  const toque = (rf) => ({
    parts: [['B1', 'BATP', { kind: 'aa4' }, 'B+1', 'B-1'], ['Q1', 'NPN', { model: 'BC547' }, 'e10'], ['Q2', 'NPN', { model: 'BC547' }, 'e14'], ['R1', 'R', { r: 330 }, 'B+6', 'a9'], ['D1', 'LED', { color: 'rojo' }, 'b9', 'b10'], ['RF1', 'R', { r: rf }, 'd11', 'B+8']],
    wires: [['a12', 'a15', 'orange'], ['a10', 'a14', 'green'], ['a16', 'B-4', 'black']]
  });
  EM.defineSim('p3-toque', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: [], tray: false, thermal: 4,
      hint: 'Dos BC547 en Darlington amplifican la corriente minúscula que pasa por la piel (la resistencia RF1 representa el dedo).',
      spec: toque(1e9),
      controls: [{ type: 'select', id: 'rf', label: 'Entre las dos puntas hay…', options: [[1e9, 'aire (sin tocar)'], [1e7, 'un dedo seco (10 MΩ)'], [1e6, 'un dedo (1 MΩ)'], [1e5, 'un dedo mojado (100 kΩ)'], [1e4, 'tierra húmeda (10 kΩ)']], value: 1e9, apply: (L, v) => L.set('RF1', 'r', +v) }],
      outs: [
        { id: 'ib', label: 'Corriente por la piel', fn: (L) => fmt(Math.abs(L.i('RF1')), 'A') },
        { id: 'ic', label: 'Corriente del LED', hl: true, fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') },
        { id: 'led', label: 'LED', fn: (L) => (L.i('D1') > 0.001 ? 'ENCENDIDO' : 'apagado') }
      ]
    });
  });
})();
