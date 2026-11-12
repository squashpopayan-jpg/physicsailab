/* Capítulo 4 — Por qué se queman las cosas */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const state = (L, id) => { const P = L.part(id); return !P ? '—' : P.dead ? 'DAÑADO · ' + P.dead.desc : L.T(id) > 150 ? 'humeando (' + Math.round(L.T(id)) + ' °C)' : L.T(id) > 60 ? 'caliente (' + Math.round(L.T(id)) + ' °C)' : 'normal (' + Math.round(L.T(id)) + ' °C)'; };

  /* 4.1 Resistor y potencia nominal */
  EM.defineSim('c4-resistor', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 20, showInst: 'psu',
      hint: 'Un resistor de 100 Ω y 1/4 W entre los rieles. Suba la tensión y vea su temperatura (active «Temperatura»).',
      spec: { parts: [['R1', 'R', { r: 100, watt: 0.25 }, 'h10', 'h14']], wires: EM.RAILS_PS1([['T+3', 'i10', 'orange'], ['T-3', 'i14', 'gray']]), psu: { 1: { v: 3, ilim: 3, on: true } } },
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 20, step: 0.1, value: 3, unit: 'V', apply: (L, v) => L.psu(1, { v }) },
        { type: 'select', id: 'w', label: 'Potencia nominal del resistor', options: [[0.125, '1/8 W'], [0.25, '1/4 W'], [0.5, '1/2 W'], [1, '1 W'], [2, '2 W'], [5, '5 W']], value: 0.25, apply: (L, v) => L.set('R1', 'watt', +v) },
        { type: 'select', id: 'r', label: 'Valor', options: [[10, '10 Ω'], [100, '100 Ω'], [1000, '1 kΩ']], value: 100, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 'p', label: 'Potencia disipada V²/R', hl: true, fn: (L) => fmt(L.vp('R1') ** 2 / L.part('R1').p.r, 'W') },
        { id: 'pn', label: 'Cociente potencia / nominal', fn: (L) => (L.vp('R1') ** 2 / L.part('R1').p.r / L.part('R1').p.watt).toFixed(2) + '×' },
        { id: 'st', label: 'Estado', fn: (L) => state(L, 'R1') }
      ]
    });
  });

  /* 4.2 LED sin resistor */
  EM.defineSim('c4-led', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 4, showInst: 'psu',
      hint: 'LED rojo alimentado con 5 V a través de un resistor. Elija el valor… y cuidado con el cero.',
      spec: { parts: [['R1', 'R', { r: 330 }, 'h10', 'h14'], ['D1', 'LED', { color: 'rojo' }, 'g14', 'g15']], wires: EM.RAILS_PS1([['T+3', 'i10', 'orange'], ['T-3', 'j15', 'gray']]), psu: { 1: { v: 5, ilim: 1, on: true } } },
      controls: [
        { type: 'select', id: 'r', label: 'Resistor en serie', options: [[0.001, 'ninguno (0 Ω)'], [47, '47 Ω'], [100, '100 Ω'], [330, '330 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ']], value: 330, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'seg', id: 'c', label: 'Color del LED', options: [['rojo', 'Rojo'], ['verde', 'Verde'], ['azul', 'Azul']], value: 'rojo', apply: (L, v) => L.set('D1', 'color', v) }
      ],
      outs: [
        { id: 'i', label: 'Corriente del LED', hl: true, fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') },
        { id: 'v', label: 'Tensión en el LED', fn: (L) => fmt(Math.max(0, L.vp('D1')), 'V') },
        { id: 'st', label: 'Estado del LED', fn: (L) => state(L, 'D1') }
      ]
    });
  });

  /* 4.3 Condensador electrolítico: polaridad y tensión máxima */
  const capSpec = (rev) => ({
    parts: [['C1', 'CE', { c: 1e-4, vmax: 16 }, rev ? 'h14' : 'h10', rev ? 'h10' : 'h14']],
    wires: EM.RAILS_PS1([['T+3', 'i10', 'orange'], ['T-3', 'i14', 'gray']]), psu: { 1: { v: 5, ilim: 0.5, on: true } }
  });
  EM.defineSim('c4-electrolitico', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 20, showInst: 'psu', startZero: true,
      hint: 'Electrolítico de 100 µF / 16 V. La pata + (la de la izquierda) va al riel positivo: pruebe a invertirlo y a pasarse de tensión.',
      spec: capSpec(false),
      controls: [
        { type: 'seg', id: 'rev', label: 'Montaje', options: [[0, 'Polaridad correcta'], [1, 'Invertido']], value: 0, apply: (L, v) => { L.load(capSpec(+v === 1)); L.psu(1, { v: L.sim.p && L.sim.p.v ? L.sim.p.v : 5 }); } },
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 30, step: 0.5, value: 5, unit: 'V', apply: (L, v) => L.psu(1, { v }) }
      ],
      outs: [
        { id: 'v', label: 'Tensión en el condensador', hl: true, fn: (L) => fmt(L.vp('C1'), 'V') },
        { id: 'i', label: 'Corriente de fuga', fn: (L) => fmt(Math.abs(L.i('C1')), 'A') },
        { id: 'st', label: 'Estado', fn: (L) => (L.dead('C1') ? 'REVENTÓ · ' + L.part('C1').dead.why : 'normal') }
      ]
    });
  });

  /* 4.4 Cortocircuito: batería frente a fuente con límite */
  EM.defineSim('c4-corto', function (sim) {
    const base = (src) => (src === 'bat'
      ? { parts: [['B1', 'BATP', { kind: 'alk9' }, 'T+1', 'T-1', { body: [24, 40] }], ['R1', 'R', { r: 470 }, 'h10', 'h14'], ['D1', 'LED', { color: 'rojo' }, 'g14', 'g15']], wires: [['T+3', 'i10', 'orange'], ['T-3', 'j15', 'gray']] }
      : { parts: [['R1', 'R', { r: 470 }, 'h10', 'h14'], ['D1', 'LED', { color: 'rojo' }, 'g14', 'g15']], wires: EM.RAILS_PS1([['T+3', 'i10', 'orange'], ['T-3', 'j15', 'gray']]), psu: { 1: { v: 9, ilim: 0.3, on: true } } });
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 20, showInst: 'psu',
      hint: 'Un cable entre los rieles (+ y −) cortocircuita la fuente. Compare una batería de 9 V con la fuente de laboratorio con límite de corriente.',
      spec: base('psu'),
      controls: [
        { type: 'seg', id: 's', label: 'Fuente', options: [['psu', 'Fuente con límite 0,3 A'], ['bat', 'Batería de 9 V']], value: 'psu', init: false, apply: (L, v) => { L.load(base(v)); } },
        { type: 'check', id: 'k', label: 'Cable de cortocircuito entre los rieles', value: false, apply: (L, v) => { if (v && !L.hasWire('wk')) L.wire('T+10', 'T-10', 'white', 'wk'); else if (!v && L.hasWire('wk')) L.unwire('wk'); } }
      ],
      outs: [
        { id: 'i', label: 'Corriente de la fuente', hl: true, fn: (L) => { const o = L.part('B1') ? { i: Math.abs(L.i('B1')) } : L.bench.psuOut(1); return fmt(o.i, 'A'); } },
        { id: 'tb', label: 'Temperatura de la batería', fn: (L) => (L.part('B1') ? Math.round(L.T('B1')) + ' °C' : '—') },
        { id: 'st', label: 'Estado', fn: (L) => (L.part('B1') ? (L.dead('B1') ? 'batería dañada' : 'ok') : L.bench.psuOut(1).cc ? 'fuente en C.C.: protegida' : 'normal') }
      ]
    });
  });

  /* 4.5 Fusible */
  EM.defineSim('c4-fusible', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 20, showInst: 'psu',
      hint: 'Un fusible rápido de 0,5 A protege la carga. Elija una carga que pida más corriente y vea cuánto tarda en fundirse.',
      spec: { parts: [['F1', 'FUSE', { ir: 0.5, kind: 'fast' }, 'h8', 'h12'], ['R1', 'R', { r: 100, watt: 5 }, 'g12', 'g16']], wires: EM.RAILS_PS1([['T+3', 'i8', 'orange'], ['T-3', 'i16', 'gray']]), psu: { 1: { v: 9, ilim: 3, on: true } } },
      controls: [
        { type: 'select', id: 'r', label: 'Carga', options: [[100, '100 Ω → 0,09 A'], [22, '22 Ω → 0,41 A'], [15, '15 Ω → 0,6 A'], [10, '10 Ω → 0,9 A'], [4.7, '4,7 Ω → 1,9 A'], [1, '1 Ω → 9 A']], value: 100, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'seg', id: 'k', label: 'Tipo de fusible', options: [['fast', 'Rápido (F)'], ['slow', 'Retardado (T)']], value: 'fast', apply: (L, v) => L.set('F1', 'kind', v) }
      ],
      outs: [
        { id: 'i', label: 'Corriente en el circuito', hl: true, fn: (L) => fmt(Math.abs(L.i('R1')), 'A') },
        { id: 'f', label: 'Fusible', fn: (L) => (L.dead('F1') ? 'FUNDIDO' : 'bien') }
      ]
    });
  });

  /* 4.6 Circuito integrado alimentado al revés */
  const icSpec = (rev) => ({
    parts: [['U1', 'T555', {}, 'e10']],
    wires: [[rev ? '@ps1-' : '@ps1+', 'T+1', rev ? 'black' : 'red'], [rev ? '@ps1+' : '@ps1-', 'T-1', rev ? 'red' : 'black'], ['j10', 'T+10', 'red'], ['a10', 'B-10', 'black'], ['T-25', 'B-25', 'black']],
    psu: { 1: { v: 9, ilim: 0.3, on: true } }
  });
  EM.defineSim('c4-ic', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, edit: 'wires', instruments: ['psu'], tray: false, thermal: 4, showInst: 'psu',
      hint: 'Un 555 alimentado a 9 V. Pruebe a conectar la fuente con la polaridad invertida (rojo en el riel negativo).',
      spec: icSpec(false),
      controls: [{ type: 'seg', id: 'p', label: 'Conexión de la fuente', options: [[0, 'Correcta'], [1, 'Polaridad invertida']], value: 0, init: false, apply: (L, v) => { L.load(icSpec(+v === 1)); } }],
      outs: [
        { id: 'i', label: 'Corriente de la fuente', hl: true, fn: (L) => fmt(L.bench.psuOut(1).i, 'A') },
        { id: 'st', label: 'Estado del 555', fn: (L) => state(L, 'U1') }
      ]
    });
  });
})();
