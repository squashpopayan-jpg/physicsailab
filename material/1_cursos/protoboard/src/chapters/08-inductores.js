/* Capítulo 8 — Inductores y relés */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 8.1 Circuito RL con onda cuadrada */
  const rl = (L, R) => ({
    parts: [['L1', 'L', { l: L, kind: 'ferrite', imax: 0.5 }, 'h5', 'h9'], ['R1', 'R', { r: R }, 'g9', 'g13']],
    wires: [['@fgo', 'j5', 'yellow'], ['@fgg', 'T-1', 'black'], ['T-3', 'j13', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6', s2: 'i9', s2g: 'T-8' },
    fg: { wave: 'square', f: 1000, amp: 2.5, off: 2.5, on: true },
    osc: { tdiv: 1e-4, ch: [{ vdiv: 1, on: true, pos: -2 }, { vdiv: 1, on: true, pos: -2 }] }
  });
  EM.defineSim('c8-rl', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 1e-4, showInst: 'scope',
      hint: 'Inductor de 10 mH en serie con 100 Ω y una onda cuadrada. Canal 1: la cuadrada; canal 2: tensión en el resistor, proporcional a la corriente.',
      spec: rl(1e-2, 100),
      controls: [
        { type: 'select', id: 'l', label: 'Inductor', options: [[1e-3, '1 mH'], [1e-2, '10 mH'], [1e-1, '100 mH']], value: 1e-2, init: false, apply: (L, v) => { L.set('L1', 'l', +v); } },
        { type: 'select', id: 'r', label: 'Resistor', options: [[47, '47 Ω'], [100, '100 Ω'], [470, '470 Ω']], value: 100, init: false, apply: (L, v) => { L.set('R1', 'r', +v); } }
      ],
      outs: [
        { id: 'tau', label: 'Constante de tiempo τ = L/R_total', hl: true, fn: (L) => fmt(L.part('L1').p.l / (L.part('R1').p.r + 50 + 1.2), 's') },
        { id: 'ipk', label: 'Corriente final V/R', fn: (L) => fmt(5 / (L.part('R1').p.r + 51.2), 'A') }
      ]
    });
  });

  /* 8.2 Relé accionado con un pulsador */
  const releSpec = (diode) => ({
    parts: [
      ['K1', 'RELAY', { vnom: 5, rc: 70 }, 'e10'],
      ['S1', 'BTN', {}, 'e20'],
      ['R1', 'R', { r: 330 }, 'h14', 'h18'],
      ['D2', 'LED', { color: 'verde' }, 'g18', 'g19']
    ].concat(diode ? [['D1', 'D', { model: '1N4007' }, 'i10', 'd10']] : []),
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['j20', 'T+3', 'red'], ['a20', 'a10', 'orange'], ['j10', 'T-3', 'black'], ['a15', 'B+3', 'red'], ['j19', 'T-5', 'black']])),
    psu: { 1: { v: 5, ilim: 0.5, on: true } }
  });
  EM.defineSim('c8-rele', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu'], tray: false, thermal: 4, tdiv: 5e-3, showInst: 'psu',
      hint: 'Mantenga pulsado el botón (clic sostenido): la bobina del relé se activa y su contacto enciende el LED verde.',
      spec: releSpec(false),
      controls: [
        { type: 'check', id: 'b', label: 'Mantener el pulsador apretado', value: false, apply: (L, v) => L.press('S1', !!v) },
        { type: 'check', id: 'd', label: 'Diodo de rueda libre en la bobina (1N4007)', value: false, init: false, apply: (L, v) => { if (v) L.addPartAt('D1', 'D', { model: '1N4007' }, ['i10', 'd10']); else L.removePart('D1'); } }
      ],
      outs: [
        { id: 'ib', label: 'Corriente de la bobina', hl: true, fn: (L) => fmt(Math.abs(L.i('K1')), 'A') },
        { id: 'rl', label: 'Estado del relé', fn: (L) => { const r = L.bench.net.rt.K1; return r && r.ref && r.ref.relay && r.ref.relay.on ? 'conectado (NA cerrado)' : 'en reposo'; } },
        { id: 'led', label: 'Corriente del LED', fn: (L) => fmt(Math.max(0, L.i('D2')), 'A') }
      ]
    });
  });
})();
