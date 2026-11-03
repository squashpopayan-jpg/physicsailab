/* Capítulo 7 — Condensadores, diodos y transistores */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, sp = EM.spice;
  const board = () => ({ boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: {} });
  const find = (lab, id) => lab.scene.parts.find((p) => p.id === id);
  const LEDCOL = { rojo: 'LED rojo', azul: 'LED azul', blanco: 'LED blanco' };

  /* 7.1 RC con osciloscopio */
  EM.defineSim('rc', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'SG', type: 'SIGGEN', kind: 'square', amp: 5, offset: 0, freq: 0.2, duty: 0.5, rint: 1, at: [-28, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 10000, pins: ['h10', 'h14'] }, { id: 'C1', type: 'ECAP', value: 100e-6, vmax: 16, pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.sch = { w: 22, h: 12, parts: { SG: { at: [3, 6], rot: 90, lab: [-3.2, 0] }, R1: { at: [9, 2] }, C1: { at: [15, 6], rot: 90, lab: [2, 0] } }, wires: [['SG.0', [3, 2], 'R1.0'], ['R1.1', [15, 2], 'C1.0'], ['C1.1', [15, 10], [3, 10], 'SG.1']] };
    const RS = [[1000, '1 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ'], [100000, '100 kΩ']], CS = [[10e-6, '10 µF'], [100e-6, '100 µF'], [470e-6, '470 µF']];
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: [[1, '1×'], [3, '3×'], [10, '10×']], below: true, bench: { dtStep: 2e-3, maxSteps: 160 }, hint: 'La línea de color es la tensión del condensador; la otra, la señal de entrada.',
      controls: [
        { type: 'select', id: 'r', label: 'Resistencia R', options: RS, value: 10000, apply: (lab, v) => { find(lab, 'R1').value = +v; } },
        { type: 'select', id: 'c', label: 'Condensador C', options: CS, value: 100e-6, apply: (lab, v) => { find(lab, 'C1').value = +v; } },
        { type: 'seg', id: 'f', label: 'Frecuencia de la onda cuadrada', options: [[0.1, '0,1 Hz'], [0.2, '0,2 Hz'], [0.5, '0,5 Hz'], [1, '1 Hz']], value: 0.2, apply: (lab, v) => { find(lab, 'SG').freq = +v; } }
      ],
      scope: { channels: [{ ref: 'bb:T+4', label: 'Entrada (generador)', color: '--c2' }, { ref: 'bb:i14', label: 'Condensador', color: '--c1' }], span: 12, ymin: -0.3, ymax: 5.6 },
      outs: [
        { id: 'tau', label: 'Constante de tiempo τ = R·C', hl: true, fn: (lab) => EM.fix(PT.val(find(lab, 'R1'), 'value') * PT.val(find(lab, 'C1'), 'value'), 3) + ' s' },
        { id: 'vc', label: 'Tensión del condensador ahora', fn: (lab) => EM.fix(lab.bench.v('bb:i14'), 2) + ' V' },
        { id: 'e', label: 'Energía almacenada ½CV²', fn: (lab) => EM.si(0.5 * PT.val(find(lab, 'C1'), 'value') * Math.pow(lab.bench.v('bb:i14'), 2), 'J', 3) }
      ]
    });
  });

  /* 7.2 Curva del diodo y recta de carga */
  EM.defineSim('diodoiv', function (sim) {
    const KIND = { led_r: ['LED', { color: 'rojo' }, 'LED rojo'], led_b: ['LED', { color: 'azul' }, 'LED azul'], d4007: ['D', { model: '1N4007' }, 'Diodo 1N4007'], sch: ['D', { model: 'SCHOTTKY' }, 'Diodo Schottky'] };
    const sc = board();
    sc.parts = [{ id: 'FA', type: 'LAB', v: 5, ilimit: 1, at: [-30, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 330, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.sch = { w: 22, h: 12, parts: { FA: { at: [3, 6], rot: 90, lab: [-3.2, 0] }, R1: { at: [9, 2] }, D1: { at: [16, 6], rot: 90, lab: [2, 0] } }, wires: [['FA.0', [3, 2], 'R1.0'], ['R1.1', [16, 2], 'D1.0'], ['D1.1', [16, 10], [3, 10], 'FA.1']] };
    let kind = 'led_r';
    const model = () => { const t = KIND[kind]; return t[0] === 'LED' ? sp.LEDS[t[1].color] : sp.DIODES[t[1].model]; };
    const curve = (I) => { const m = model(); return m.n * sp.VT * Math.log(I / m.Is + 1) + I * m.rs; };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: false, below: true, hint: 'El punto naranja es el punto de funcionamiento real del circuito.',
      controls: [
        { type: 'select', id: 'k', label: 'Diodo', options: Object.entries(KIND).map(([k, v]) => [k, v[2]]), value: 'led_r', apply: (lab, v) => { kind = v; const D = find(lab, 'D1'); D.type = KIND[v][0]; delete D.color; delete D.model; Object.assign(D, KIND[v][1]); } },
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 12, step: 0.1, value: 5, unit: 'V', apply: (lab, v) => { find(lab, 'FA').v = v; } },
        { type: 'select', id: 'r', label: 'Resistencia', options: [[47, '47 Ω'], [100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ']], value: 330, apply: (lab, v) => { find(lab, 'R1').value = +v; } }
      ],
      outs: [
        { id: 'i', label: 'Corriente', hl: true, fn: (lab) => EM.fix(lab.bench.partCurrent(find(lab, 'D1')) * 1000, 2) + ' mA' },
        { id: 'vd', label: 'Tensión en el diodo', fn: (lab) => { const D = find(lab, 'D1'); return EM.fix(lab.bench.v(D.pins[0]) - lab.bench.v(D.pins[1]), 3) + ' V'; } },
        { id: 'vr', label: 'Tensión en la resistencia', fn: (lab) => EM.fix(lab.bench.c.find('R1:main').vab, 3) + ' V' }
      ],
      panel: {
        aspect: 3.2, label: 'Curva del diodo y recta de carga',
        draw(lab, cv) {
          const V = find(lab, 'FA').v, R = PT.val(find(lab, 'R1'), 'value'), xmax = Math.max(3.5, Math.min(V * 1.05, 12)), ymax = Math.max(8, Math.min(V / R * 1000 * 1.1, 260));
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(xmax, 3.5), ymin: 0, ymax, xlabel: 'tensión en el diodo (V)', ylabel: 'corriente (mA)', ml: 50, mr: 12, mt: 12, mb: 36 });
          pl.frame();
          const xs = [], ys = [];
          for (let k = 0; k <= 160; k++) { const I = 1e-6 * Math.pow(0.4 / 1e-6, k / 160); const v = curve(I); if (v <= pl.o.xmax) { xs.push(v); ys.push(I * 1000); } }
          pl.xy(xs, ys, { color: '--accent', width: 2.6 });
          pl.xy([0, V], [V / R * 1000, 0], { color: '--c1', width: 2, dash: [6, 4] });
          const D = find(lab, 'D1'); const i = lab.bench.partCurrent(D) * 1000, vd = lab.bench.v(D.pins[0]) - lab.bench.v(D.pins[1]);
          pl.dot(vd, i, { color: '--c2', r: 6 });
          pl.legend([{ label: 'curva del diodo', color: '--accent' }, { label: 'recta de carga (V − V_D)/R', color: '--c1', kind: 'dash' }], 'br');
        }
      }
    });
  });

  /* 7.3 Rectificador */
  EM.defineSim('rectif', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'SG', type: 'SIGGEN', kind: 'sin', amp: 5, offset: 0, freq: 1, rint: 10, at: [-28, 24], pins: ['T+2', 'T-2'] }, { id: 'D1', type: 'D', model: '1N4007', pins: ['h10', 'h14'] }, { id: 'RL', type: 'R', value: 1000, pins: ['g14', 'g15'] }, { id: 'C1', type: 'ECAP', value: 470e-6, vmax: 16, pins: ['f14', 'f15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.sch = { w: 24, h: 12, parts: { SG: { at: [3, 6], rot: 90, lab: [-3.2, 0] }, D1: { at: [10, 2] }, RL: { at: [20, 6], rot: 90, lab: [1.8, 0] }, C1: { at: [15, 6], rot: 90, lab: [1.8, 0] } }, wires: [['SG.0', [3, 2], 'D1.0'], ['D1.1', [15, 2], 'C1.0'], [{ in: ['RL.0'] }, [15, 2], [20, 2], 'RL.0'], ['C1.1', [15, 10]], ['RL.1', [20, 10], [15, 10]], [{ out: ['C1.1', 'RL.1'] }, [15, 10], [3, 10], 'SG.1']] };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: [[1, '1×'], [3, '3×'], [10, '10×']], below: true, bench: { dtStep: 2e-3, maxSteps: 160 }, hint: 'Active el condensador de filtro y compare la salida.',
      controls: [
        { type: 'check', id: 'cap', label: 'Condensador de filtro conectado', value: true, apply: (lab, v) => { find(lab, 'C1').pins = v ? ['f14', 'f15'] : [null, null]; lab.rebuild(); } },
        { type: 'seg', id: 'c', label: 'Valor del condensador', options: [[100e-6, '100 µF'], [470e-6, '470 µF'], [1000e-6, '1000 µF']], value: 470e-6, apply: (lab, v) => { find(lab, 'C1').value = +v; } },
        { type: 'seg', id: 'rl', label: 'Carga', options: [[330, '330 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ']], value: 1000, apply: (lab, v) => { find(lab, 'RL').value = +v; } }
      ],
      scope: { channels: [{ ref: 'bb:T+4', label: 'Entrada (alterna)', color: '--c2' }, { ref: 'bb:i14', label: 'Salida rectificada', color: '--c1' }], span: 6, ymin: -5.6, ymax: 5.6 },
      outs: [
        { id: 'v', label: 'Salida ahora', hl: true, fn: (lab) => EM.fix(lab.bench.v('bb:i14'), 2) + ' V' },
        { id: 'r', label: 'Rizado estimado I/(f·C)', fn: (lab) => { const C = find(lab, 'C1'); if (!C.pins[0]) return 'sin filtro'; const RL = PT.val(find(lab, 'RL'), 'value'); return EM.fix(4.35 / RL / (1 * PT.val(C, 'value')), 2) + ' V (media onda a 1 Hz)'; } }
      ]
    });
  });

  /* 7.4 Zener */
  EM.defineSim('zener', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'FA', type: 'LAB', v: 9, ilimit: 1, at: [-30, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 330, pins: ['h10', 'h14'] }, { id: 'Z1', type: 'ZENER', vz: 5.1, pins: ['g15', 'g14'] }, { id: 'RL', type: 'R', value: 1e9, pins: ['f14', 'f15'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'T-4' }];
    sc.sch = { w: 22, h: 12, parts: { FA: { at: [3, 6], rot: 90, lab: [-3.2, 0] }, R1: { at: [9, 2] }, Z1: { at: [15, 6], rot: 270, lab: [1.8, 0] }, RL: { at: [20, 6], rot: 90, lab: [1.8, 0] } }, wires: [['FA.0', [3, 2], 'R1.0'], ['R1.1', [15, 2], 'Z1.1'], [{ in: ['RL.0'] }, [15, 2], [20, 2], 'RL.0'], ['Z1.0', [15, 10]], ['RL.1', [20, 10], [15, 10]], [{ out: ['Z1.0', 'RL.1'] }, [15, 10], [3, 10], 'FA.1']] };
    const f = (vin, rl) => { const c = new sp.Circuit(); c.add(sp.V('v', 'a', '0', vin, 0.05)); c.add(sp.R('r', 'a', 'k', 330)); c.add(sp.zener('z', '0', 'k', 5.1)); if (rl < 1e8) c.add(sp.R('l', 'k', '0', rl)); c.solveDC(); return c.vNamed('k'); };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: false, below: true, hint: 'Cambie la tensión de entrada y la carga; mire la salida.',
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de entrada', min: 0, max: 15, step: 0.1, value: 9, unit: 'V', apply: (lab, v) => { find(lab, 'FA').v = v; } },
        { type: 'select', id: 'rl', label: 'Carga', options: [[1e9, 'Sin carga'], [1000, '1 kΩ'], [220, '220 Ω'], [100, '100 Ω']], value: 1e9, apply: (lab, v) => { find(lab, 'RL').value = +v; } }
      ],
      outs: [
        { id: 'o', label: 'Tensión de salida', hl: true, fn: (lab) => EM.fix(lab.bench.v('bb:i14'), 3) + ' V' },
        { id: 'ir', label: 'Corriente por la resistencia', fn: (lab) => EM.fix(lab.bench.c.find('R1:main').i * 1000, 2) + ' mA' },
        { id: 'iz', label: 'Corriente por el Zener', fn: (lab) => EM.fix(Math.abs(lab.bench.partCurrent(find(lab, 'Z1'))) * 1000, 2) + ' mA' }
      ],
      panel: {
        aspect: 3.4, label: 'Salida en función de la entrada',
        draw(lab, cv) {
          const RL = PT.val(find(lab, 'RL'), 'value'), V = find(lab, 'FA').v;
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 15, ymin: 0, ymax: 8, xlabel: 'tensión de entrada (V)', ylabel: 'salida (V)', ml: 48, mr: 12, mt: 12, mb: 36 });
          pl.frame();
          pl.hline(5.1, { color: '--ink-3', dash: [4, 3] });
          const xs = [], ys = [];
          for (let k = 0; k <= 75; k++) { const x = k * 0.2; xs.push(x); ys.push(f(x, RL)); }
          pl.xy(xs, ys, { color: '--accent', width: 2.6 });
          pl.dot(V, f(V, RL), { color: '--c2', r: 6 });
        }
      }
    });
  });

  /* 7.5 Transistor bipolar */
  EM.defineSim('bjt', function (sim) {
    const sc = board();
    sc.parts = [
      { id: 'FA', type: 'LAB', v: 5, ilimit: 1, at: [-30, 12], pins: ['T+2', 'T-2'] },
      { id: 'FB', type: 'LAB', v: 0, ilimit: 0.1, at: [-30, 40], pins: ['B+3', 'B-3'] },
      { id: 'R1', type: 'R', value: 330, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] },
      { id: 'RB', type: 'R', value: 10000, pins: ['c15', 'c19'] }, { id: 'Q1', type: 'BJT', model: 'BC547', pins: ['e18', 'e19', 'e20'] }
    ];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'a18' }, { id: 'w3', a: 'B+8', b: 'a15' }, { id: 'w4', a: 'a20', b: 'B-8' }, { id: 'w5', a: 'B-5', b: 'T-5' }];
    const Q = (vin, RB) => { const c = new sp.Circuit(); c.add(sp.V('vcc', 'vcc', '0', 5, 0.05)); c.add(sp.V('vin', 'in', '0', vin, 0.05)); c.add(sp.R('rb', 'in', 'b', RB)); c.add(sp.R('rc', 'vcc', 'a', 330)); const L = sp.LEDS.rojo; c.add({ type: 'D', id: 'd', a: 'a', b: 'k', Is: L.Is, n: L.n }); c.add(sp.R('rs', 'k', 'c', L.rs)); c.add(sp.bjt('q', 'c', 'b', '0', 'BC547')); c.solveDC(); return c.find('q').ic * 1000; };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: false, below: true, hint: 'Suba la tensión de entrada (a la base) poco a poco.',
      controls: [
        { type: 'slider', id: 'vin', label: 'Tensión de entrada Vin', min: 0, max: 5, step: 0.05, value: 0, unit: 'V', apply: (lab, v) => { find(lab, 'FB').v = v; } },
        { type: 'select', id: 'rb', label: 'Resistencia de base', options: [[1000, '1 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ'], [47000, '47 kΩ'], [100000, '100 kΩ']], value: 10000, apply: (lab, v) => { find(lab, 'RB').value = +v; } }
      ],
      outs: [
        { id: 'st', label: 'Estado del transistor', hl: true, fn: (lab) => { const q = lab.bench.c.find('Q1:main'); if (!q) return '—'; if (q.ib < 1e-6) return 'corte (apagado)'; if (q.vce < 0.35) return 'saturación (encendido)'; return 'zona activa'; } },
        { id: 'ib', label: 'Corriente de base', fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').ib) },
        { id: 'ic', label: 'Corriente de colector (LED)', fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').ic) },
        { id: 'v', label: 'V_BE · V_CE', fn: (lab) => { const q = lab.bench.c.find('Q1:main'); return EM.fix(q.vbe, 3) + ' V · ' + EM.fix(q.vce, 3) + ' V'; } },
        { id: 'b', label: 'Ganancia real I_C / I_B', fn: (lab) => { const q = lab.bench.c.find('Q1:main'); return q.ib > 1e-7 ? EM.fix(q.ic / q.ib, 0) : '—'; } }
      ],
      panel: {
        aspect: 3.4, label: 'Corriente de colector según la tensión de entrada',
        draw(lab, cv) {
          const RB = PT.val(find(lab, 'RB'), 'value'), vin = find(lab, 'FB').v;
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 5, ymin: 0, ymax: 10, xlabel: 'tensión de entrada Vin (V)', ylabel: 'I_C (mA)', ml: 48, mr: 12, mt: 12, mb: 36 });
          pl.frame();
          const xs = [], ys = [];
          for (let k = 0; k <= 100; k++) { const x = k * 0.05; xs.push(x); ys.push(Q(x, RB)); }
          pl.xy(xs, ys, { color: '--accent', width: 2.6 });
          pl.dot(vin, Q(vin, RB), { color: '--c2', r: 6 });
        }
      }
    });
  });

  /* 7.6 MOSFET */
  EM.defineSim('mosfet', function (sim) {
    const sc = board();
    sc.parts = [
      { id: 'FA', type: 'LAB', v: 5, ilimit: 1, at: [-30, 12], pins: ['T+2', 'T-2'] },
      { id: 'FB', type: 'LAB', v: 0, ilimit: 0.1, at: [-30, 40], pins: ['B+3', 'B-3'] },
      { id: 'R1', type: 'R', value: 330, pins: ['h10', 'h14'] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] },
      { id: 'Q1', type: 'NMOS', model: 'IRLZ44N', pins: ['e18', 'e19', 'e20'] }
    ];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j15', b: 'a19' }, { id: 'w3', a: 'B+8', b: 'a18' }, { id: 'w4', a: 'a20', b: 'B-8' }, { id: 'w5', a: 'B-5', b: 'T-5' }];
    const M = (vg) => { const c = new sp.Circuit(); c.add(sp.V('vcc', 'vcc', '0', 5, 0.05)); c.add(sp.V('vg', 'g', '0', vg, 0.05)); c.add(sp.R('rc', 'vcc', 'a', 330)); const L = sp.LEDS.rojo; c.add({ type: 'D', id: 'd', a: 'a', b: 'k', Is: L.Is, n: L.n }); c.add(sp.R('rs', 'k', 'd', L.rs)); c.add(sp.mos('q', 'd', 'g', '0', 'IRLZ44N')); c.solveDC(); return c.find('q').i * 1000; };
    EM.Lab.mount(sim, {
      aspect: 1.8, scene: sc, speeds: false, below: true, hint: 'Suba la tensión de la compuerta (G).',
      controls: [{ type: 'slider', id: 'vg', label: 'Tensión de compuerta Vg', min: 0, max: 5, step: 0.05, value: 0, unit: 'V', apply: (lab, v) => { find(lab, 'FB').v = v; } }],
      outs: [
        { id: 'st', label: 'Estado', hl: true, fn: (lab) => { const q = lab.bench.c.find('Q1:main'); return q.ids < 1e-6 ? 'apagado' : (q.vds < 0.1 ? 'saturado (encendido)' : 'conduciendo parcialmente'); } },
        { id: 'id', label: 'Corriente de drenaje', fn: (lab) => EM.fmtI(lab.bench.c.find('Q1:main').i) },
        { id: 'vds', label: 'Tensión drenaje–fuente', fn: (lab) => EM.fix(lab.bench.c.find('Q1:main').vds, 3) + ' V' }
      ],
      panel: {
        aspect: 3.4, label: 'Corriente de drenaje según Vg',
        draw(lab, cv) {
          const vg = find(lab, 'FB').v;
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 5, ymin: 0, ymax: 10, xlabel: 'tensión de compuerta Vg (V)', ylabel: 'I_D (mA)', ml: 48, mr: 12, mt: 12, mb: 36 });
          pl.frame(); pl.vline(1.7, { color: '--ink-3', dash: [4, 3] }); pl.label(1.75, 9.4, 'umbral ≈ 1.7 V', { color: '--ink-2' });
          const xs = [], ys = [];
          for (let k = 0; k <= 100; k++) { const x = k * 0.05; xs.push(x); ys.push(M(x)); }
          pl.xy(xs, ys, { color: '--accent', width: 2.6 });
          pl.dot(vg, M(vg), { color: '--c2', r: 6 });
        }
      }
    });
  });
})();
