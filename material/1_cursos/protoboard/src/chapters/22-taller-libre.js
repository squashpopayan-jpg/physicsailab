/* Capítulo 22 — Taller libre y retos */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const st = (n) => ({ st: n });

  /* Reto 1: un LED con 10 mA ± 20 % desde una batería de 9 V */
  EM.defineSim('c22-reto1', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'full', instruments: ['dmm'], tray: ['R', 'Resistor 1 kΩ', 'Resistor 10 kΩ', 'LED', 'LED rojo', 'LED verde'], thermal: 4, showInst: 'dmm',
      hint: 'Reto: haga circular entre 8 y 12 mA por el LED rojo con la batería de 9 V. Elija el resistor (cambie su valor en las propiedades) y mida con el multímetro.',
      spec: { parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 330 }, st(0)], ['D1', 'LED', { color: 'rojo' }, st(1)]], wires: [] },
      goals: [
        { label: 'El resistor y el LED están en la protoboard', test: (L) => L.part('R1') && L.part('D1') && L.part('R1')._plugged && L.part('D1')._plugged },
        { label: 'La corriente del LED está entre 8 y 12 mA', test: (L) => { const i = L.i('D1'); return i > 0.008 && i < 0.012; } },
        { label: 'Nada se ha quemado', test: (L) => !L.anyDead() },
        { label: 'Midió la corriente con el multímetro en serie (toma mA)', test: (L) => { const d = L.dmm(); return L.bench.inst.dmm.jack === 'ma' && d.mode === 'A=' && Math.abs(d.value) > 0.005; } }
      ],
      outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') }, { id: 'r', label: 'Resistor usado', fn: (L) => fmt(L.part('R1').p.r, 'Ω') }]
    });
  });

  /* Reto 2: 3,3 V ± 3 % en la columna 20 con resistores y 9 V */
  EM.defineSim('c22-reto2', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'full', instruments: ['dmm'], tray: ['R', 'Resistor 1 kΩ', 'Resistor 10 kΩ'], thermal: 4, showInst: 'dmm',
      hint: 'Reto: obtenga 3,3 V (±3 %) en la columna 20 (agujero a20) respecto al riel «−», con dos resistores y la batería de 9 V.',
      spec: { parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 1000 }, st(0)], ['R2', 'R', { r: 1000 }, st(1)]], wires: [], dmm: { mode: 'V=', jack: 'v' } },
      goals: [
        { label: 'Los dos resistores están insertados', test: (L) => L.part('R1')._plugged && L.part('R2')._plugged },
        { label: 'La columna 20 tiene 3,3 V ± 3 % respecto al riel «−»', test: (L) => { const v = L.v('a20', 'B-3'); return Math.abs(v - 3.3) < 0.1; } },
        { label: 'La corriente del divisor es menor de 5 mA (no desperdicie la batería)', test: (L) => Math.abs(L.i('R2')) < 0.005 && Math.abs(L.i('R2')) > 1e-6 }
      ],
      outs: [{ id: 'v', label: 'Tensión en a20', hl: true, fn: (L) => fmt(L.v('a20', 'B-3'), 'V') }, { id: 'i', label: 'Corriente de la batería', fn: (L) => fmt(Math.abs(L.i('B1')), 'A') }]
    });
  });

  /* Reto 3: fuente de 5 V para una carga de 100 Ω con un 7805 */
  EM.defineSim('c22-reto3', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'full', instruments: ['dmm'], tray: ['REG', 'Regulador 7805', 'Cerámico 100 nF', 'Electrolítico 100 µF'], thermal: 20, showInst: 'dmm',
      hint: 'Reto: alimente la carga de 100 Ω (entre a20 y el riel «−») con 5 V ± 2 % usando la batería de 9 V y un regulador 7805.',
      spec: { parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['RL', 'R', { r: 100, watt: 1 }, 'a20', 'B-12'], ['U1', 'REG', { model: '7805' }, st(0)], ['C1', 'C', { c: 1e-7 }, st(1)]], wires: [], dmm: { mode: 'V=', jack: 'v' } },
      goals: [
        { label: 'El regulador está insertado en la protoboard', test: (L) => L.part('U1') && L.part('U1')._plugged },
        { label: 'La carga recibe 5 V ± 2 %', test: (L) => Math.abs(L.v('a20', 'B-12') - 5) < 0.1 },
        { label: 'El regulador no se quemó ni se apagó por calor', test: (L) => !L.dead('U1') && !(L.bench.net.rt.U1 && L.bench.net.rt.U1.regHot) }
      ],
      outs: [{ id: 'v', label: 'Tensión en la carga', hl: true, fn: (L) => fmt(L.v('a20', 'B-12'), 'V') }, { id: 't', label: 'Temperatura del regulador', fn: (L) => (L.part('U1') ? Math.round(L.T('U1')) + ' °C' : '—') }]
    });
  });

  /* Taller libre: protoboard completa, todos los instrumentos y todas las piezas; recuerda el último montaje */
  EM.defineSim('c22-libre', function (sim) {
    EM.Lab.mount(sim, { aspect: 1.45, boards: ['full'], edit: 'full', instruments: ['psu', 'ac', 'fg', 'dmm', 'scope'], tray: true, autosave: 'c22-libre-full', partFaults: true, hint: 'Taller libre: protoboard completa de 830 puntos, fuente de dos canales, transformador, generador, multímetro y osciloscopio. El montaje se guarda en este navegador.' });
  });
})();
