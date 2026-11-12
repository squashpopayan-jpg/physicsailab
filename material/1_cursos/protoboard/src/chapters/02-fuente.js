/* Capítulo 2 — La fuente y el multímetro */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 2.1 Fuente CV/CC con una carga entre los rieles */
  EM.defineSim('c2-fuente', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu'], tray: false, thermal: 4, showInst: 'psu',
      hint: 'La carga (un resistor) está entre los rieles. Gire las perillas de la fuente: tensión y límite de corriente.',
      spec: {
        parts: [['R1', 'R', { r: 22, watt: 5 }, 'h10', 'h14']],
        wires: EM.RAILS_PS1([['T+3', 'i10', 'orange'], ['T-3', 'i14', 'gray']]),
        psu: { 1: { v: 5, ilim: 0.5, on: true } }
      },
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión ajustada', min: 0, max: 30, step: 0.1, value: 5, unit: 'V', apply: (L, v) => L.psu(1, { v }) },
        { type: 'slider', id: 'il', label: 'Límite de corriente', min: 0.01, max: 3, step: 0.01, value: 0.5, unit: 'A', apply: (L, v) => L.psu(1, { ilim: v }) },
        { type: 'select', id: 'r', label: 'Carga', options: [[1, '1 Ω'], [4.7, '4,7 Ω'], [22, '22 Ω'], [100, '100 Ω'], [1000, '1 kΩ']], value: 22, apply: (L, v) => L.set('R1', 'r', +v) }
      ],
      outs: [
        { id: 'modo', label: 'Modo de la fuente', hl: true, fn: (L) => (L.bench.psuOut(1).cc ? 'C.C. (limita la corriente)' : 'C.V. (tensión constante)') },
        { id: 'v', label: 'Tensión en la carga', fn: (L) => fmt(L.bench.psuOut(1).v, 'V') },
        { id: 'i', label: 'Corriente', fn: (L) => fmt(L.bench.psuOut(1).i, 'A') },
        { id: 'p', label: 'Potencia en la carga', fn: (L) => { const o = L.bench.psuOut(1); return fmt(o.v * o.i, 'W'); } }
      ]
    });
  });

  /* 2.2 Voltímetro en paralelo: divisor de tensión */
  EM.defineSim('c2-voltimetro', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'Mida la tensión en R₂: arrastre la punta roja a un extremo y la negra al otro. Función V⎓.',
      spec: {
        parts: [['R1', 'R', { r: 4700 }, 'g10', 'g14'], ['R2', 'R', { r: 10000 }, 'h14', 'h18']],
        wires: EM.RAILS_PS1([['T+3', 'j10', 'orange'], ['T-3', 'j18', 'gray']]),
        psu: { 1: { v: 10, ilim: 0.2, on: true } }, dmm: { mode: 'V=', jack: 'v' }
      },
      goals: [
        { label: 'Mida la tensión en R₂ (≈ 6,8 V)', test: (L) => { const d = L.dmm(); return d.mode === 'V=' && Math.abs(d.value - 6.803) < 0.12 && L.bench.touch(L.bench.scene.probes.dmmR).ref !== undefined; } },
        { label: 'Mida la tensión en R₁ (≈ 3,2 V)', test: (L) => { const d = L.dmm(); return d.mode === 'V=' && Math.abs(d.value - 3.197) < 0.12; } }
      ],
      outs: [
        { id: 'lec', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'ide', label: 'Valor teórico en R₂', fn: () => '6.803 V' }
      ]
    });
  });

  /* 2.3 Amperímetro en serie: hay que abrir el circuito */
  EM.defineSim('c2-amperimetro', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'full', instruments: ['psu', 'dmm'], tray: ['Resistor 1 kΩ'], showInst: 'dmm',
      hint: 'El circuito tiene un hueco entre las columnas 8 y 10 de la mitad superior (j8 y j10). Ponga el multímetro EN SERIE: punta roja en un lado, negra en el otro. Elija A⎓ y la toma mA.',
      spec: {
        parts: [['R1', 'R', { r: 470 }, 'h10', 'h16'], ['D1', 'LED', { color: 'rojo' }, 'g16', 'g17']],
        wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j17', 'gray']]),
        psu: { 1: { v: 5, ilim: 0.2, on: true } }, dmm: { mode: 'V=', jack: 'v' }
      },
      goals: [{ label: 'Mida la corriente del LED con el multímetro en serie (≈ 6,5 mA)', test: (L) => { const d = L.dmm(); return d.mode === 'A=' && L.bench.inst.dmm.jack === 'ma' && Math.abs(d.value - 0.00653) < 0.0004; } }, { label: 'Los fusibles siguen en buen estado', test: (L) => !L.bench.inst.dmm.blown.ma && !L.bench.inst.dmm.blown.a10 }],
      outs: [
        { id: 'lec', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'led', label: 'Corriente real del LED', fn: (L) => fmt(L.i('D1'), 'A') },
        { id: 'fus', label: 'Fusibles', fn: (L) => (L.bench.inst.dmm.blown.ma || L.bench.inst.dmm.blown.a10 ? '¡fundido!' : 'en buen estado') }
      ]
    });
  });

  /* 2.4 Trampas del multímetro */
  const TRAP = {
    a: { desc: 'La punta roja está en la toma mA y se mide «voltaje» en paralelo con una batería de 9 V.', jack: 'ma', mode: 'V=', probes: { dmmR: 'B+8', dmmB: 'B-8' } },
    b: { desc: 'Ohmímetro conectado a un circuito encendido.', jack: 'v', mode: 'Ω', probes: { dmmR: 'c10', dmmB: 'c14' } },
    c: { desc: 'Amperímetro en paralelo con una resistencia (la deja casi en cortocircuito).', jack: 'ma', mode: 'A=', probes: { dmmR: 'c10', dmmB: 'c14' } },
    d: { desc: 'Voltímetro en un divisor de 1 MΩ: el instrumento carga el circuito.', jack: 'v', mode: 'V=', probes: { dmmR: 'c14', dmmB: 'c18' }, big: true }
  };
  const trapSpec = (k) => {
    const T = TRAP[k];
    const R = T.big ? [1e6, 1e6] : [1000, 2200];
    return {
      parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1', { body: [26, 80] }], ['R1', 'R', { r: R[0] }, 'e10', 'e14'], ['R2', 'R', { r: R[1] }, 'd14', 'd18']],
      wires: [['a10', 'B+3', 'red'], ['a18', 'B-3', 'black']],
      probes: T.probes, psu: undefined, dmm: { mode: T.mode, jack: T.jack, blown: { ma: false, a10: false } }
    };
  };
  EM.defineSim('c2-trampas', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, thermal: 20, showInst: 'dmm',
      hint: 'Cada montaje reproduce un error clásico. Observe el multímetro y lo que le ocurre al circuito.',
      spec: trapSpec('a'),
      controls: [{ type: 'select', id: 't', label: 'Error', options: [['a', 'A · voltímetro con la punta en la toma mA'], ['b', 'B · ohmímetro con el circuito encendido'], ['c', 'C · amperímetro en paralelo'], ['d', 'D · el voltímetro carga el circuito (1 MΩ + 1 MΩ)']], value: 'a', init: false, apply: (L, v) => { L.load(trapSpec(v)); } }],
      outs: [
        { id: 'lec', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'nota', label: 'Aviso del instrumento', fn: (L) => L.dmm().note || '—' },
        { id: 'fus', label: 'Fusibles', fn: (L) => (L.bench.inst.dmm.blown.ma ? 'mA fundido' : L.bench.inst.dmm.blown.a10 ? '10 A fundido' : 'bien') }
      ]
    });
  });
})();
