/* Capítulo 16 — El temporizador 555 */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* 555 en e10: 1 GND e10, 2 TRIG e11, 3 OUT e12, 4 RESET e13, 5 CTRL f13, 6 THR f12, 7 DIS f11, 8 VCC f10 */
  const astable = (r2, c) => ({
    parts: [['U1', 'T555', {}, 'e10'], ['R1', 'R', { r: 1000 }, 'h10', 'h11'], ['R2', 'R', { r: r2 }, 'g11', 'g12'], ['C1', 'CE', { c, vmax: 16 }, 'b11', 'B-11'], ['R3', 'R', { r: 330 }, 'c12', 'c16'], ['D1', 'LED', { color: 'rojo' }, 'b16', 'b17']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a10', 'B-3', 'black'], ['j12', 'a11', 'green'], ['d13', 'i10', 'orange'], ['a17', 'B-17', 'black']])),
    psu: { 1: { v: 9, ilim: 0.2, on: true } }, probes: { s1: 'c11', s1g: 'B-8', s2: 'd12', s2g: 'B-10' }, osc: { tdiv: 0.1, ch: [{ vdiv: 2, on: true, pos: -3 }, { vdiv: 5, on: true, pos: -3 }] }
  });
  EM.defineSim('c16-astable', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'scope'], tray: false, tdiv: 0.1, showInst: 'scope',
      hint: 'Oscilador astable con el 555: R₁ = 1 kΩ, R₂ y C a elegir. Canal 1: tensión del condensador; canal 2: la salida (pata 3).',
      spec: astable(47000, 1e-5),
      controls: [
        { type: 'select', id: 'r2', label: 'R₂', options: [[10000, '10 kΩ'], [47000, '47 kΩ'], [100000, '100 kΩ'], [470000, '470 kΩ']], value: 47000, init: false, apply: (L, v) => { L.set('R2', 'r', +v); L.autoTdiv(1 / (0.693 * (1000 + 2 * +v) * L.part('C1').p.c), 2); } },
        { type: 'select', id: 'c', label: 'C', options: [[1e-6, '1 µF'], [1e-5, '10 µF'], [4.7e-5, '47 µF'], [1e-4, '100 µF']], value: 1e-5, init: false, apply: (L, v) => { L.set('C1', 'c', +v); L.autoTdiv(1 / (0.693 * (1000 + 2 * L.part('R2').p.r) * +v), 2); } }
      ],
      outs: [
        { id: 'f', label: 'Frecuencia medida', hl: true, fn: (L) => { const s = L.stat('c2'); return s && isFinite(s.f) ? fmt(s.f, 'Hz') : '—'; } },
        { id: 'ft', label: 'Teórica 1,44/((R₁+2R₂)C)', fn: (L) => fmt(1.44 / ((1000 + 2 * L.part('R2').p.r) * L.part('C1').p.c), 'Hz') },
        { id: 'd', label: 'Ciclo de trabajo medido', fn: (L) => { const s = L.stat('c2'); return s && isFinite(s.duty) ? Math.round(s.duty * 100) + ' %' : '—'; } },
        { id: 'dt', label: 'Teórico (R₁+R₂)/(R₁+2R₂)', fn: (L) => { const r2 = L.part('R2').p.r; return Math.round(100 * (1000 + r2) / (1000 + 2 * r2)) + ' %'; } }
      ]
    });
  });

  /* Monoestable: un pulsador dispara un pulso de duración 1,1·R·C */
  const mono = (c) => ({
    parts: [['U1', 'T555', {}, 'e10'], ['R1', 'R', { r: 100000 }, 'h10', 'h11'], ['C1', 'CE', { c, vmax: 16 }, 'i12', 'T-8'], ['R2', 'R', { r: 10000 }, 'd11', 'B+4'], ['S1', 'BTN', {}, 'e20'],
      ['R3', 'R', { r: 330 }, 'd12', 'd16'], ['D1', 'LED', { color: 'verde' }, 'c16', 'c17']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a10', 'B-3', 'black'], ['j11', 'j12', 'green'], ['d13', 'B+6', 'orange'], ['a20', 'a11', 'yellow'], ['j20', 'T-2', 'black'], ['a17', 'B-9', 'black']])),
    psu: { 1: { v: 9, ilim: 0.2, on: true } }, probes: { s1: 'g12', s1g: 'T-14', s2: 'c12', s2g: 'T-16' }, osc: { tdiv: 0.2, ch: [{ vdiv: 2, on: true, pos: -3 }, { vdiv: 5, on: true, pos: -3 }] }
  });
  EM.defineSim('c16-mono', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'scope'], tray: false, tdiv: 0.2, showInst: 'scope', startZero: false,
      hint: 'Monoestable: al pulsar el botón, la salida (LED verde) queda en alto durante T = 1,1·R·C. Mantenga el clic sobre el botón un instante.',
      spec: mono(1e-5),
      controls: [
        { type: 'check', id: 'b', label: 'Pulsar el botón', value: false, apply: (L, v) => L.press('S1', !!v) },
        { type: 'select', id: 'c', label: 'C', options: [[1e-6, '1 µF'], [1e-5, '10 µF'], [4.7e-5, '47 µF']], value: 1e-5, init: false, apply: (L, v) => L.set('C1', 'c', +v) }
      ],
      outs: [
        { id: 'T', label: 'Duración teórica 1,1·R·C', hl: true, fn: (L) => fmt(1.1 * L.part('R1').p.r * L.part('C1').p.c, 's') },
        { id: 'led', label: 'LED', fn: (L) => (L.i('D1') > 0.001 ? 'ENCENDIDO' : 'apagado') }
      ]
    });
  });
})();
