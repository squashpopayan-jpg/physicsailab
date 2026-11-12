/* Capítulo 1 — El banco */
(function () {
  'use strict';
  const EM = window.EM;

  /* 1.1 Continuidad entre agujeros */
  EM.defineSim('c1-tiras', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, thermal: 1, showInst: 'dmm',
      hint: 'Arrastre las puntas del multímetro (roja y negra) hasta los agujeros: pita cuando hay continuidad.',
      spec: { parts: [], wires: [['a12', 'a20', 'green'], ['f25', 'f27', 'blue']], dmm: { mode: '·)))', jack: 'v' } },
      goals: [
        { label: 'Pite entre dos agujeros de una misma columna (por ejemplo a12 y e12)', test: (L) => { const d = L.dmm(); const a = L.bench.touch(L.bench.scene.probes.dmmR), b = L.bench.touch(L.bench.scene.probes.dmmB); return d.beep && a.ref && b.ref && a.ref.split(':')[1][0] !== undefined && a.ref !== b.ref && L.bench.holeKey(a.ref) === L.bench.holeKey(b.ref) && a.ref.split(':')[1].slice(1) === b.ref.split(':')[1].slice(1); } },
        { label: 'No pite entre e12 y f12: el canal central separa las mitades', test: (L) => { const a = L.bench.touch(L.bench.scene.probes.dmmR).ref, b = L.bench.touch(L.bench.scene.probes.dmmB).ref; return !!a && !!b && /:(e|f)12$/.test(a) && /:(e|f)12$/.test(b) && a !== b && !L.dmm().beep; } },
        { label: 'Encuentre qué columnas une el cable verde: pite entre a12 y a20', test: (L) => { const a = L.bench.touch(L.bench.scene.probes.dmmR).ref, b = L.bench.touch(L.bench.scene.probes.dmmB).ref; return !!a && !!b && /:(a12|a20)$/.test(a) && /:(a12|a20)$/.test(b) && a !== b && L.dmm().beep; } }
      ],
      outs: [{ id: 'lec', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.beep ? 'PITA · ' + d.text + ' ' + d.unit : d.text + ' ' + d.unit; } }]
    });
  });

  /* 1.2 Primer LED */
  const stage = (n) => ({ st: n });
  EM.defineSim('c1-led', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'full', instruments: [], tray: ['R', 'LED', 'Resistor 1 kΩ', 'Resistor 10 kΩ'], thermal: 4, autosave: false,
      hint: 'Arrastre el resistor y el LED a la protoboard y cablee: riel + → resistor → LED → riel −.',
      spec: { parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 330 }, stage(0)], ['D1', 'LED', { color: 'rojo' }, stage(1)]], wires: [] },
      goals: [
        { label: 'El resistor y el LED están insertados en la protoboard', test: (L) => L.part('R1') && L.part('D1') && L.part('R1')._plugged && L.part('D1')._plugged },
        { label: 'El LED está encendido (entre 3 y 25 mA)', test: (L) => { const i = L.i('D1'); return i > 0.003 && i < 0.025 && !L.dead('D1'); } },
        { label: 'Nada se ha quemado', test: (L) => !L.anyDead() }
      ],
      outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (L) => EM.si(Math.max(0, L.i('D1')), 'A', 3) }, { id: 'v', label: 'Tensión en el LED', fn: (L) => EM.si(Math.max(0, L.vp('D1')), 'V', 3) }]
    });
  });

  /* 1.3 Montajes con error */
  const base = (over) => {
    const o = Object.assign({ r: ['e5', 'e9'], d: ['d9', 'd12'], w: [['a5', 'B+2', 'red'], ['a12', 'B-2', 'black']] }, over);
    return { parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 330 }, ...o.r], ['D1', 'LED', { color: 'rojo' }, ...o.d]], wires: o.w };
  };
  const ERR = {
    ok: base({}),
    puente: base({ r: ['e5', 'd5'] }),
    invertido: base({ d: ['d12', 'd9'] }),
    suelta: base({ r: ['e5', 'e9^'] }),
    vecina: base({ w: [['a5', 'B+2', 'red'], ['a13', 'B-2', 'black']] })
  };
  EM.defineSim('c1-errores', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, thermal: 20, showInst: 'dmm',
      hint: 'Elija un montaje y averigüe qué falla. Puede mover cables y usar el multímetro.',
      spec: ERR.ok,
      controls: [{ type: 'select', id: 'm', label: 'Montaje', options: [['ok', 'Correcto'], ['puente', 'A · el resistor y su tira'], ['invertido', 'B · el LED y su polaridad'], ['suelta', 'C · una pata en el aire'], ['vecina', 'D · el cable negro']], value: 'ok', init: false, apply: (L, v) => { L.load(ERR[v]); L.dmmSet({ mode: '·)))' }); } }],
      outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (L) => EM.si(Math.max(0, L.i('D1')), 'A', 3) }, { id: 'estado', label: 'Estado del LED', fn: (L) => (L.dead('D1') ? 'quemado' : L.i('D1') > 0.002 ? 'encendido' : 'apagado') }]
    });
  });

  /* 1.4 Mesa libre */
  EM.defineSim('c1-libre', function (sim) {
    EM.Lab.mount(sim, { aspect: 1.55, boards: ['half'], edit: 'full', instruments: ['psu', 'fg', 'dmm', 'scope'], tray: true, autosave: 'c1-libre', partFaults: true, hint: 'Mesa libre: saque piezas de la caja, arrástrelas a la placa y tienda cables desde las tomas.' });
  });
})();
