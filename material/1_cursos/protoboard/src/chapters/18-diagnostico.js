/* Capítulo 18 — Diagnóstico de fallas: la clínica del banco */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const CASOS = {
    1: { nombre: 'Caso 1', faults: [{ kind: 'wirebreak', id: 'w1' }], pista: 'El cable naranja de la toma «~1» del transformador a la placa está cortado por dentro (parece conectado, pero no conduce).' },
    2: { nombre: 'Caso 2', faults: [{ kind: 'wirebreak', id: 'w4' }], pista: 'El cable rojo que lleva el «+» del filtro a la entrada del 7805 tiene el conductor roto.' },
    3: { nombre: 'Caso 3', part: ['C1', { kind: 'drift', factor: 0.04 }], pista: 'El electrolítico de filtro de 2200 µF se secó con los años: conserva solo ≈ 90 µF de capacidad (envejecimiento).' },
    4: { nombre: 'Caso 4', part: ['C2', { kind: 'short' }], pista: 'El condensador de salida de 100 µF está en cortocircuito interno.' },
    5: { nombre: 'Caso 5', part: ['U1', { kind: 'open' }], pista: 'El regulador 7805 tiene un circuito abierto interno.' }
  };
  const caso = (k) => {
    const sp = EM.SP.fuente5(47);
    const c = CASOS[k];
    if (c.faults) sp.faults = c.faults;
    if (c.part) { const it = sp.parts.find((q) => q[0] === c.part[0]); it.push({ fault: c.part[1] }); }
    return sp;
  };
  EM.defineSim('c18-clinica', function (sim) {
    const st = { k: 1, rev: false };
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['ac', 'dmm', 'scope'], tray: false, tdiv: 5e-3, showInst: 'dmm', thermal: 20, partFaults: false,
      hint: 'La fuente de 5 V de siempre, pero con una avería oculta. Diagnostique con el multímetro y el osciloscopio. El LED verde debería estar encendido.',
      spec: caso(1),
      controls: [
        { type: 'select', id: 'k', label: 'Avería', options: [[1, 'Caso 1'], [2, 'Caso 2'], [3, 'Caso 3'], [4, 'Caso 4'], [5, 'Caso 5']], value: 1, init: false, apply: (L, v) => { st.k = +v; st.rev = false; L.load(caso(st.k)); } },
        { type: 'check', id: 'r', label: 'Revelar la causa', value: false, init: false, apply: (L, v) => { st.rev = !!v; } }
      ],
      outs: [
        { id: 'vo', label: 'Tensión en la carga de 47 Ω', hl: true, fn: (L) => fmt(L.v('b14', 'B-9'), 'V') },
        { id: 'led', label: 'LED verde', fn: (L) => (L.i('D1') > 0.001 ? 'encendido' : 'apagado') },
        { id: 'c', label: 'Causa', fn: () => (st.rev ? CASOS[st.k].pista : 'oculta: averígüela midiendo') }
      ]
    });
  });
})();
