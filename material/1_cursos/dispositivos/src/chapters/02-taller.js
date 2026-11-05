/* Capítulo 2 — El Taller */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 2.1 Primera práctica: LED sin quemarlo */
  EM.defineSim('c2-libre', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.7, edit: 'full', panels: [], lock: true, goalTitle: 'Objetivos',
      spec: { parts: [['V1', 'VDC', 4, 10, 0, { v: 9 }], ['D1', 'LED', 26, 10, 1, { color: 'rojo' }]], wires: [['V1.1', 'gnd']] },
      goals: [
        { label: 'El LED está encendido (entre 3 y 25 mA)', test: (T) => { const D = T.net.part('D1'); if (!D) return false; const i = T.i('D1'); return i > 0.003 && i < 0.025 && !D.dead; } },
        { label: 'Ningún componente se ha dañado', test: (T) => !T.net.doc.parts.some((p) => p.dead) },
        { label: 'Corriente del LED menor que 21 mA', test: (T) => { const i = T.i('D1'); return i > 0.001 && i < 0.021; } }
      ],
      hint: 'Elija «Resistor» en la paleta, colóquelo y conecte fuente, resistor y LED en serie.'
    });
  });

  /* 2.2 El multímetro */
  EM.defineSim('c2-dmm', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.9, edit: 'values', panels: ['table'], hint: 'Haga clic en el multímetro para elegir su función.',
      spec: {
        parts: [['V1', 'VDC', 4, 8, 0, { v: 10 }], ['R1', 'R', 10, 6, 0, { r: 4700 }], ['R2', 'R', 16, 8, 1, { r: 10000 }], ['M1', 'DMM', 26, -2, 0, { mode: 'V=' }]],
        wires: [['V1.0', 'R1.0'], ['R1.1', [16, 6]], [[4, 10], [27, 10]], ['V1.1', 'gnd'], [[25, 2], [16, 2], [16, 6]], [[27, 2], [27, 10]]]
      },
      controls: [
        { type: 'seg', id: 'mode', label: 'Función del multímetro', options: [['V=', 'V DC'], ['A=', 'A DC'], ['Ω', 'Ω'], ['→|', 'diodo']], value: 'V=', apply: (T, v) => T.set('M1', 'mode', v) },
        { type: 'slider', id: 'vs', label: 'Tensión de la fuente', min: 1, max: 100, step: 1, value: 10, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'slider', id: 'r1', label: 'Resistencia R₁', min: 5, max: 10000, value: 4700, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R1', 'r', v) }
      ],
      outs: [
        { id: 'lec', label: 'Lectura del multímetro', hl: true, fn: (T) => { const d = T.dmm('M1'); return d.text + ' ' + (d.unit || ''); } },
        { id: 'ide', label: 'V real en R₂ sin instrumento', fn: (T) => { const v = T.net.part('V1').p.v, a = T.net.part('R1').p.r, b = T.net.part('R2').p.r; return fmt(v * b / (a + b), 'V', 4); } },
        { id: 'ir', label: 'Corriente por R₁', fn: (T) => fmt(T.i('R1'), 'A') }
      ]
    });
  });

  /* 2.3 Osciloscopio + generador + filtro RC */
  EM.defineSim('c2-scope', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.55, edit: 'values', panels: ['scope', 'bode'], tdiv: 1e-3, hint: 'Filtro RC pasabajos alimentado por un generador de funciones; el osciloscopio mide la entrada y la salida.',
      spec: {
        parts: [['FG1', 'FG', 4, 12, 0, { wave: 'square', amp: 1, off: 0, f: 100 }], ['R1', 'R', 12, 11, 0, { r: 950 }], ['C1', 'C', 18, 13, 1, { c: 1e-6 }], ['OSC', 'SCOPE', 12, 2, 0, { probe: 10 }], ['N1', 'LBL', 9, 13, 0, { name: 'in' }], ['N2', 'LBL', 20, 11, 0, { name: 'out' }]],
        wires: [['FG1.0', 'R1.0'], ['R1.1', 'C1.0'], ['FG1.1', [7, 15], [25, 15]], [[7, 15], [7, 16]], ['gndat', 7, 16], [[15, 7], [25, 7], [25, 15]],
          [[9, 7], [9, 11]], [[12, 7], [12, 9], [16, 9], [16, 11]], [[9, 11], [9, 13]], [[18, 11], [20, 11]]]
      },
      controls: [
        { type: 'seg', id: 'wave', label: 'Forma de onda', options: [['sin', 'Senoidal'], ['square', 'Cuadrada'], ['tri', 'Triangular']], value: 'square', apply: (T, v) => T.set('FG1', 'wave', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 10, max: 100000, value: 100, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'f', v) },
        { type: 'slider', id: 'a', label: 'Amplitud (pico)', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'V', apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'seg', id: 'pr', label: 'Punta del osciloscopio', options: [[1, '×1'], [10, '×10']], value: 10, apply: (T, v) => T.set('OSC', 'probe', v) }
      ],
      outs: [
        { id: 'fc', label: 'Frecuencia de corte 1/(2πRC)', fn: (T) => fmt(1 / (2 * Math.PI * (T.net.part('R1').p.r + T.net.part('FG1').p.rs) * T.net.part('C1').p.c), 'Hz') },
        { id: 'tau', label: 'Constante de tiempo τ = RC', fn: (T) => fmt((T.net.part('R1').p.r + T.net.part('FG1').p.rs) * T.net.part('C1').p.c, 's') }
      ]
    });
  });

  /* 2.4 Fuente de laboratorio CV/CC */
  EM.defineSim('c2-psu', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: [], hint: 'La fuente limita la corriente: baje la resistencia de carga y observe el cambio de CV a CC.',
      spec: CX.ladder({ src: { id: 'PS1', t: 'PSU', p: { v: 5, ilim: 0.1 } }, items: [{ id: 'RL', t: 'R', p: { r: 100, watt: 25 }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión ajustada', min: 0, max: 30, step: 0.1, value: 5, unit: 'V', apply: (T, v) => T.set('PS1', 'v', v) },
        { type: 'slider', id: 'il', label: 'Límite de corriente', min: 0.01, max: 5, value: 0.1, unit: 'A', log: true, fmt: (v) => EM.fix(v, v < 0.1 ? 3 : 2), apply: (T, v) => T.set('PS1', 'ilim', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga', min: 0.1, max: 1000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 2 : 1), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'm', label: 'Modo', hl: true, fn: (T) => { const r = T.net.rt.PS1; return r && r.psu && r.psu.cc ? 'corriente constante (CC)' : 'tensión constante (CV)'; } },
        { id: 'vo', label: 'Tensión de salida', fn: (T) => fmt(T.v('out'), 'V') },
        { id: 'io', label: 'Corriente', fn: (T) => fmt(T.i('RL'), 'A') },
        { id: 'p', label: 'Potencia en la carga', fn: (T) => fmt(T.v('out') * T.i('RL'), 'W') }
      ]
    });
  });

  /* 2.5 Cortocircuito y fusible */
  EM.defineSim('c2-falla', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], hint: 'Pulse «Cortocircuito» y haga clic en los dos terminales de R₁ para puentearla.',
      spec: CX.ladder({ src: { id: 'B1', t: 'BAT', p: { kind: 'pb' } }, items: [{ id: 'F1', t: 'FUSE', p: { ir: 1 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 100, watt: 2 }, mode: 'shunt', tap: 'out' }] }),
      outs: [
        { id: 'v', label: 'Tensión en la carga', hl: true, fn: (T) => fmt(T.v('out'), 'V') },
        { id: 'i', label: 'Corriente de la batería', fn: (T) => fmt(Math.abs(T.m('B1') ? T.m('B1').i : 0), 'A') },
        { id: 'f', label: 'Estado del fusible', fn: (T) => (T.net.part('F1').dead ? 'fundido' : 'sano') }
      ]
    });
  });
})();
