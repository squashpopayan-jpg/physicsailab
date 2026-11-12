/* Capítulo 20 — Proyectos en casa II: sonido y movimiento */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* P4 · Timbre / sirena con el 555 y un altavoz (4 pilas AA en los rieles superiores) */
  const timbre = (r2, c) => ({
    parts: [['B1', 'BATP', { kind: 'aa4' }, 'T+1', 'T-1', { body: [24, 44] }], ['U1', 'T555', {}, 'e10'], ['R1', 'R', { r: 1000 }, 'h10', 'h11'], ['R2', 'R', { r: r2 }, 'g11', 'g12'], ['C1', 'C', { c }, 'b11', 'B-11'],
      ['C2', 'CE', { c: 1e-4, vmax: 16 }, 'c12', 'c16'], ['LS1', 'SPK', {}, 'd16', 'B-9']],
    wires: EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a10', 'B-3', 'black'], ['j12', 'a11', 'green'], ['d13', 'i10', 'orange']]),
    probes: {}
  });
  EM.defineSim('p4-timbre', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: [], tray: false, thermal: 4, slowmo: false,
      hint: 'Un 555 genera una nota que suena en el altavoz. Active el sonido (icono del altavoz de la barra) y cambie el condensador y R₂.',
      spec: timbre(6800, 1e-7),
      controls: [
        { type: 'select', id: 'c', label: 'C (nota)', options: [[1e-8, '10 nF (agudo)'], [1e-7, '100 nF'], [1e-6, '1 µF (grave)']], value: 1e-7, init: false, apply: (L, v) => L.set('C1', 'c', +v) },
        { type: 'select', id: 'r', label: 'R₂', options: [[1000, '1 kΩ'], [6800, '6,8 kΩ'], [22000, '22 kΩ'], [100000, '100 kΩ']], value: 6800, init: false, apply: (L, v) => L.set('R2', 'r', +v) }
      ],
      outs: [
        { id: 'ft', label: 'Frecuencia teórica 1,44/((R₁+2R₂)C)', hl: true, fn: (L) => fmt(1.44 / ((1000 + 2 * L.part('R2').p.r) * L.part('C1').p.c), 'Hz') },
        { id: 'fm', label: 'Frecuencia medida en el altavoz', fn: (L) => { const s = EM.sigStats(L.bench.spkRing('LS1').last(1024), L.bench.dt); return s && isFinite(s.f) ? fmt(s.f, 'Hz') : '—'; } },
        { id: 'v', label: 'Amplitud en el altavoz', fn: (L) => { const s = EM.sigStats(L.bench.spkRing('LS1').last(1024), L.bench.dt); return s ? fmt(s.pp, 'Vpp') : '—'; } },
        { id: 'i', label: 'Corriente de la batería', fn: (L) => fmt(Math.abs(L.i('B1')), 'A') }
      ]
    });
  });

  /* P5 · Probador de continuidad: dos pilas AA, un BC547 y un zumbador activo */
  const cont = (rx) => ({
    parts: [['B1', 'BATP', { kind: 'aa2' }, 'B+1', 'B-1'], ['Q1', 'NPN', { model: 'BC547' }, 'e10'], ['BZ1', 'BUZA', {}, 'B+10', 'a10'], ['R1', 'R', { r: 1000 }, 'B+6', 'a16'], ['RX', 'R', { r: rx }, 'd16', 'd11']],
    wires: [['a12', 'B-4', 'black']]
  });
  EM.defineSim('p5-continuidad', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: [], tray: false, thermal: 4,
      hint: 'RX es el objeto que se prueba entre las puntas. El zumbador suena cuando su resistencia es baja. (Active el sonido.)',
      spec: cont(1e9),
      controls: [{ type: 'select', id: 'rx', label: 'Entre las puntas hay…', options: [[1e9, 'nada (circuito abierto)'], [1, 'un cable (1 Ω)'], [100, '100 Ω'], [1000, '1 kΩ'], [10000, '10 kΩ'], [100000, '100 kΩ']], value: 1e9, apply: (L, v) => L.set('RX', 'r', +v) }],
      outs: [
        { id: 'ib', label: 'Corriente de base', fn: (L) => fmt(Math.abs(L.i('RX')), 'A') },
        { id: 'ic', label: 'Corriente del zumbador', fn: (L) => fmt(Math.abs(L.i('BZ1')), 'A') },
        { id: 'z', label: 'Zumbador', hl: true, fn: (L) => (Math.abs(L.i('BZ1')) > 0.012 ? '¡SUENA!' : 'en silencio') }
      ]
    });
  });

  /* P6 · Motor de juguete con un MOSFET y un pulsador (4 pilas AA) */
  const motor = () => ({
    parts: [['B1', 'BATP', { kind: 'aa4' }, 'B+1', 'B-1'], ['Q1', 'NMOS', { model: 'IRLZ44N' }, 'e10'], ['M1', 'MOT', { vnom: 6, tl: 0.004 }, 'B+6', 'a11'], ['D1', 'D', { model: '1N4007' }, 'b11', 'B+4'],
      ['R1', 'R', { r: 10000 }, 'd10', 'B-6'], ['S1', 'BTN', {}, 'e20'], ['R2', 'R', { r: 1000 }, 'c20', 'c10']],
    wires: [['a12', 'B-3', 'black'], ['j20', 'B+12', 'red'], ['a20', 'a10', 'orange']]
  });
  EM.defineSim('p6-motor', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: [], tray: false, thermal: 4,
      hint: 'Mantenga pulsado el botón: la compuerta recibe 6 V y el MOSFET arranca el motor. Al soltar, el resistor de 10 kΩ lo apaga.',
      spec: motor(),
      controls: [{ type: 'check', id: 'b', label: 'Pulsar el botón', value: false, apply: (L, v) => L.press('S1', !!v) }],
      outs: [
        { id: 'w', label: 'Velocidad (% de la máxima)', hl: true, fn: (L) => { const r = L.bench.net.rt.M1; return r && r.motor ? Math.round(100 * r.motor.w / (6 / 0.01)) + ' %' : '—'; } },
        { id: 'ib', label: 'Corriente de la batería', fn: (L) => fmt(Math.abs(L.i('B1')), 'A') },
        { id: 'vg', label: 'Tensión de compuerta', fn: (L) => fmt(L.v('a10', 'B-3'), 'V') }
      ]
    });
  });
})();
