/* Capítulo 6 — Divisor de tensión, carga y sensores resistivos */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* canal 1 de la fuente → rieles inferiores (+ en B+1, − en B−1) */
  const railsB = (extra) => [['@ps1+', 'B+1', 'red'], ['@ps1-', 'B-1', 'black']].concat(extra || []);

  /* 6.1 Divisor de tensión */
  const R_OPT = [[330, '330 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ'], [47000, '47 kΩ'], [100000, '100 kΩ']];
  EM.defineSim('c6-divisor', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'Divisor de 10 V. La punta roja ya está en el punto medio; mueva la negra si quiere medir otra tensión.',
      spec: { parts: [['R1', 'R', { r: 4700 }, 'h8', 'h12'], ['R2', 'R', { r: 10000 }, 'g12', 'g16']], wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v: 10, ilim: 0.1, on: true } }, probes: { dmmR: 'i12', dmmB: 'T-6' }, dmm: { mode: 'V=', jack: 'v' } },
      controls: [
        { type: 'select', id: 'r1', label: 'R₁ (arriba)', options: R_OPT, value: 4700, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'select', id: 'r2', label: 'R₂ (abajo)', options: R_OPT, value: 10000, apply: (L, v) => L.set('R2', 'r', +v) }
      ],
      outs: [
        { id: 'm', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 't', label: 'Teórica 10·R₂/(R₁+R₂)', fn: (L) => fmt(10 * L.part('R2').p.r / (L.part('R1').p.r + L.part('R2').p.r), 'V') },
        { id: 'i', label: 'Corriente del divisor', fn: (L) => fmt(10 / (L.part('R1').p.r + L.part('R2').p.r), 'A') }
      ]
    });
  });

  /* 6.2 Efecto de la carga */
  EM.defineSim('c6-carga', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'El mismo divisor 10 kΩ + 10 kΩ, ahora con una carga entre el punto medio y tierra. ¿Cuánto cae la tensión?',
      spec: { parts: [['R1', 'R', { r: 10000 }, 'h8', 'h12'], ['R2', 'R', { r: 10000 }, 'g12', 'g16'], ['R3', 'R', { r: 1e9 }, 'i12', 'T-8']], wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v: 10, ilim: 0.1, on: true } }, probes: { dmmR: 'f12', dmmB: 'T-6' }, dmm: { mode: 'V=', jack: 'v' } },
      controls: [{ type: 'select', id: 'rl', label: 'Carga R_L', options: [[1e9, 'sin carga'], [1e6, '1 MΩ'], [100000, '100 kΩ'], [10000, '10 kΩ'], [1000, '1 kΩ']], value: 1e9, apply: (L, v) => L.set('R3', 'r', +v) }],
      outs: [
        { id: 'm', label: 'Tensión de salida medida', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 't', label: 'Teórica con carga', fn: (L) => { const RL = L.part('R3').p.r, Rp = (1e4 * RL) / (1e4 + RL); return fmt(10 * Rp / (Rp + 1e4), 'V'); } },
        { id: 'th', label: 'Resistencia de Thévenin', fn: () => '5 kΩ' }
      ]
    });
  });

  /* 6.3 Potenciómetro como atenuador de un LED */
  EM.defineSim('c6-pot', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu'], tray: false, showInst: 'psu',
      hint: 'Un potenciómetro de 10 kΩ reparte 5 V; el cursor alimenta un LED con un resistor de 330 Ω. Mueva el cursor.',
      spec: { parts: [['RV1', 'POT', { r: 10000, pos: 0.5 }, 'e8'], ['R1', 'R', { r: 330 }, 'd9', 'd13'], ['D1', 'LED', { color: 'rojo' }, 'c13', 'c14']], wires: railsB([['a8', 'B+3', 'orange'], ['a10', 'B-3', 'gray'], ['a14', 'B-5', 'black']]), psu: { 1: { v: 5, ilim: 0.2, on: true } } },
      controls: [{ type: 'slider', id: 'p', label: 'Posición del cursor', min: 0, max: 1, step: 0.01, value: 0.5, apply: (L, v) => L.set('RV1', 'pos', v) }],
      outs: [
        { id: 'v', label: 'Tensión del cursor', hl: true, fn: (L) => fmt(L.v('d9', 'a10'), 'V') },
        { id: 'i', label: 'Corriente del LED', fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') }
      ]
    });
  });

  /* 6.4 LDR como sensor de luz */
  EM.defineSim('c6-ldr', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'LDR + resistor de 10 kΩ: un divisor que «siente» la luz. Cambie la iluminación y mida la salida.',
      spec: { parts: [['R1', 'R', { r: 10000 }, 'h8', 'h12'], ['LDR1', 'LDR', { lux: 100 }, 'g12', 'g16']], wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v: 5, ilim: 0.1, on: true } }, probes: { dmmR: 'i12', dmmB: 'T-6' }, dmm: { mode: 'V=', jack: 'v' } },
      controls: [{ type: 'slider', id: 'lux', label: 'Iluminación', min: 1, max: 10000, value: 100, unit: 'lux', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => L.set('LDR1', 'lux', v) }],
      outs: [
        { id: 'r', label: 'Resistencia de la LDR', fn: (L) => fmt(EM.spice.ldr(L.part('LDR1').p.lux, L.part('LDR1').p.r10, 0.7), 'Ω') },
        { id: 'm', label: 'Tensión de salida (V)', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } }
      ]
    });
  });
})();
