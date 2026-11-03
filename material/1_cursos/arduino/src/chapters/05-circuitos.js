/* Capítulo 5 — Serie, paralelo y divisor de voltaje */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, sp = EM.spice;
  const board = () => ({ boards: [{ id: 'bb', kind: 'half', x: 0, y: 0 }], mcus: [], parts: [], wires: [], env: {} });
  const RV = [[100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [680, '680 Ω'], [1000, '1 kΩ'], [2200, '2,2 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ']];
  const BAT = { id: 'B1', type: 'BAT', v: 9, rint: 1.7, at: [-26, 24], pins: ['T+2', 'T-2'] };
  const rsel = (id, label, value, idx) => ({ type: 'select', id, label, options: RV, value, apply: (lab, v) => { lab.scene.parts.find((p) => p.id === idx).value = +v; } });
  const iOf = (lab, id) => lab.bench.c.find(id + ':main').i;
  const vOf = (lab, id) => lab.bench.c.find(id + ':main').vab;

  /* 5.1 Serie */
  EM.defineSim('serie', function (sim) {
    const sc = board();
    sc.parts = [Object.assign({}, BAT), { id: 'R1', type: 'R', value: 1000, pins: ['h10', 'h14'] }, { id: 'R2', type: 'R', value: 2200, pins: ['g14', 'g18'] }, { id: 'R3', type: 'R', value: 4700, pins: ['f18', 'f22'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j22', b: 'T-4' }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5, jack: 'VΩmA' }];
    sc.sch = { w: 26, h: 11, parts: { B1: { at: [4, 6], rot: 90, lab: [-3.2, 0] }, R1: { at: [9, 2] }, R2: { at: [15, 2] }, R3: { at: [21, 2] } }, wires: [['B1.0', [4, 2], 'R1.0'], ['R1.1', 'R2.0'], ['R2.1', 'R3.0'], ['R3.1', [25, 2], [25, 10], [4, 10], 'B1.1']] };
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: false, below: true, hint: 'Cambie las resistencias y vea cómo se reparte la tensión. Alterne entre protoboard y esquema.',
      controls: [rsel('r1', 'R1', 1000, 'R1'), rsel('r2', 'R2', 2200, 'R2'), rsel('r3', 'R3', 4700, 'R3')],
      outs: [
        { id: 'rt', label: 'Resistencia total (suma)', fn: (lab) => sp.fmtR(['R1', 'R2', 'R3'].reduce((s, id) => s + PT.val(lab.scene.parts.find((p) => p.id === id), 'value'), 0)) },
        { id: 'i', label: 'Corriente (la misma en todas)', hl: true, fn: (lab) => EM.fmtI(iOf(lab, 'R1')) },
        { id: 'v1', label: 'V en R1 · R2 · R3', fn: (lab) => ['R1', 'R2', 'R3'].map((id) => EM.fix(vOf(lab, id), 3)).join(' · ') + ' V' },
        { id: 'sum', label: 'Suma de las caídas', fn: (lab) => EM.fix(['R1', 'R2', 'R3'].reduce((s, id) => s + vOf(lab, id), 0), 3) + ' V (pila: ' + EM.fix(lab.bench.v('bb:T+4') - lab.bench.v('bb:T-4'), 3) + ' V)' }
      ]
    });
  });

  /* 5.2 Paralelo */
  EM.defineSim('paralelo', function (sim) {
    const sc = board();
    const pin = { R1: ['h10', 'h14'], R2: ['g10', 'g14'], R3: ['f10', 'f14'] };
    sc.parts = [Object.assign({}, BAT), { id: 'R1', type: 'R', value: 1000, pins: pin.R1.slice() }, { id: 'R2', type: 'R', value: 2200, pins: pin.R2.slice() }, { id: 'R3', type: 'R', value: 4700, pins: pin.R3.slice() }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j14', b: 'T-4' }];
    sc.sch = { w: 26, h: 15, parts: { B1: { at: [4, 8], rot: 90, lab: [-3.2, 0] }, R1: { at: [10, 8], rot: 90, lab: [1.8, 0] }, R2: { at: [16, 8], rot: 90, lab: [1.8, 0] }, R3: { at: [22, 8], rot: 90, lab: [1.8, 0] } },
      wires: [['B1.0', [4, 3], [10, 3]], [{ in: ['R1.0', 'R2.0', 'R3.0'] }, [10, 3], [16, 3]], [{ in: ['R3.0'] }, [16, 3], [22, 3], 'R3.0'], [[10, 3], 'R1.0'], [[16, 3], 'R2.0'],
        ['R1.1', [10, 13]], ['R2.1', [16, 13], [10, 13]], ['R3.1', [22, 13], [16, 13]], [[10, 13], [4, 13], 'B1.1']] };
    sc.sch.wires[1] = [{ in: ['R2.0', 'R3.0'] }, [10, 3], [16, 3]];
    sc.sch.wires[5] = ['R1.1', [10, 13]];
    sc.sch.wires.splice(5, 4, ['R1.1', [10, 13]], ['R2.1', [16, 13]], [{ out: ['R2.1', 'R3.1'] }, [16, 13], [10, 13]], ['R3.1', [22, 13], [16, 13]], [{ out: ['R1.1', 'R2.1', 'R3.1'] }, [10, 13], [4, 13], 'B1.1']);
    const branch = (id) => ({ type: 'check', id: 'on-' + id, label: 'Rama de ' + id + ' conectada', value: true, apply: (lab, on) => { lab.scene.parts.find((p) => p.id === id).pins = on ? pin[id].slice() : [null, null]; lab.rebuild(); } });
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: false, below: true, hint: 'Desconecte ramas con las casillas y vea cómo cambia la corriente total.',
      controls: [rsel('r1', 'R1', 1000, 'R1'), rsel('r2', 'R2', 2200, 'R2'), rsel('r3', 'R3', 4700, 'R3'), branch('R2'), branch('R3')],
      outs: [
        { id: 'i', label: 'Corriente de cada rama', fn: (lab) => ['R1', 'R2', 'R3'].map((id) => (lab.scene.parts.find((p) => p.id === id).pins[0] ? EM.fix(iOf(lab, id) * 1000, 2) : '0')).join(' · ') + ' mA' },
        { id: 'it', label: 'Corriente total (suma)', hl: true, fn: (lab) => EM.fmtI(-lab.bench.c.find('B1:src').i) },
        { id: 'req', label: 'Resistencia equivalente', fn: (lab) => { const g = ['R1', 'R2', 'R3'].reduce((s, id) => { const p = lab.scene.parts.find((q) => q.id === id); return s + (p.pins[0] ? 1 / PT.val(p, 'value') : 0); }, 0); return sp.fmtR(1 / g); } },
        { id: 'v', label: 'Tensión común', fn: (lab) => EM.fix(lab.bench.v('bb:T+4') - lab.bench.v('bb:T-4'), 3) + ' V' }
      ]
    });
  });

  /* 5.3 Divisor de tensión con carga */
  EM.defineSim('divisor', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'FA', type: 'LAB', v: 5, ilimit: 1, at: [-30, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 10000, pins: ['h10', 'h14'] }, { id: 'R2', type: 'R', value: 10000, pins: ['g14', 'g18'] }, { id: 'RL', type: 'R', value: 1e9, pins: ['f14', 'f18'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j10' }, { id: 'w2', a: 'j18', b: 'T-4' }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5, jack: 'VΩmA' }];
    sc.sch = { w: 22, h: 14, parts: { FA: { at: [4, 7], rot: 90, lab: [-3.2, 0] }, R1: { at: [11, 3], rot: 90, lab: [1.8, 0] }, R2: { at: [11, 11], rot: 90, lab: [1.8, 0] }, RL: { at: [19, 11], rot: 90, lab: [1.8, 0] } },
      wires: [['FA.0', [4, 0], [11, 0], [11, 1]], [[11, 1], 'R1.0'], ['R1.1', [11, 7], [11, 9]], ['R2.0', [11, 9]], [[11, 7], [19, 7], [19, 9]], [[19, 9], 'RL.0'], ['R2.1', [11, 15]], ['RL.1', [19, 15], [11, 15]], [[11, 15], [4, 15], 'FA.1']], texts: [{ at: [13.4, 6.3], text: 'Vout', size: 1.0, color: '--accent' }] };
    sc.sch.wires = [['FA.0', [4, 0], [11, 0], 'R1.0'], ['R1.1', [11, 7]], [[11, 7], 'R2.0'], [{ in: ['RL.0'] }, [11, 7], [19, 7], 'RL.0'], ['R2.1', [11, 15]], ['RL.1', [19, 15], [11, 15]], [{ out: ['R2.1', 'RL.1'] }, [11, 15], [4, 15], 'FA.1']];
    sc.sch.parts.R1.at = [11, 3]; sc.sch.parts.R2.at = [11, 11]; sc.sch.h = 16;
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: false, below: true, hint: 'Cambie R1, R2 y la carga. Mida Vout con el multímetro entre el punto medio y tierra.',
      controls: [
        { type: 'select', id: 'r1', label: 'R1 (arriba)', options: RV, value: 10000, apply: (lab, v) => { lab.scene.parts[1].value = +v; } },
        { type: 'select', id: 'r2', label: 'R2 (abajo)', options: RV, value: 10000, apply: (lab, v) => { lab.scene.parts[2].value = +v; } },
        { type: 'select', id: 'rl', label: 'Carga conectada a la salida', options: [[1e9, 'Sin carga'], [100000, '100 kΩ'], [10000, '10 kΩ'], [1000, '1 kΩ'], [220, '220 Ω']], value: 1e9, apply: (lab, v) => { lab.scene.parts[3].value = +v; } }
      ],
      outs: [
        { id: 'vo', label: 'Vout (con la carga)', hl: true, fn: (lab) => EM.fix(vOf(lab, 'R2'), 3) + ' V' },
        { id: 'id', label: 'Vout ideal (sin carga)', fn: (lab) => EM.fix(5 * PT.val(lab.scene.parts[2], 'value') / (PT.val(lab.scene.parts[1], 'value') + PT.val(lab.scene.parts[2], 'value')), 3) + ' V' },
        { id: 'ic', label: 'Corriente que gasta el divisor', fn: (lab) => EM.fmtI(iOf(lab, 'R1')) }
      ],
      panel: {
        aspect: 3.4, label: 'Salida según la carga',
        draw(lab, cv) {
          const R1 = PT.val(lab.scene.parts[1], 'value'), R2 = PT.val(lab.scene.parts[2], 'value'), RL = PT.val(lab.scene.parts[3], 'value');
          const f = (rl) => 5 * (R2 * rl / (R2 + rl)) / (R1 + R2 * rl / (R2 + rl));
          const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 100, xmax: 1e7, xlog: true, ymin: 0, ymax: 5, xlabel: 'resistencia de carga (Ω)', ylabel: 'Vout (V)', ml: 48, mr: 14, mt: 12, mb: 36 });
          pl.frame();
          pl.hline(5 * R2 / (R1 + R2), { color: '--ink-3', dash: [4, 3] });
          const xs = [], ys = [];
          for (let k = 0; k <= 120; k++) { const x = 100 * Math.pow(1e5, k / 120); xs.push(x); ys.push(f(x)); }
          pl.xy(xs, ys, { color: '--accent', width: 2.4 });
          pl.dot(Math.min(RL, 1e7), f(RL), { color: '--accent', r: 6 });
        }
      }
    });
  });

  /* 5.4 Circuito mixto y Kirchhoff */
  EM.defineSim('mixto', function (sim) {
    const sc = board();
    sc.parts = [Object.assign({}, BAT), { id: 'R1', type: 'R', value: 330, pins: ['h8', 'h12'] }, { id: 'R2', type: 'R', value: 470, pins: ['g12', 'g16'] }, { id: 'R3', type: 'R', value: 680, pins: ['f12', 'f16'] }];
    sc.wires = [{ id: 'w1', a: 'T+4', b: 'j8' }, { id: 'w2', a: 'j16', b: 'T-4' }];
    sc.meters = [{ id: 'm1', mode: 'V', at: [93, 4], scale: 0.5, jack: 'VΩmA' }];
    sc.sch = { w: 26, h: 14, parts: { B1: { at: [4, 8], rot: 90, lab: [-3.2, 0] }, R1: { at: [10, 3] }, R2: { at: [17, 7], rot: 90, lab: [1.8, 0] }, R3: { at: [23, 7], rot: 90, lab: [1.8, 0] } },
      wires: [['B1.0', [4, 3], 'R1.0'], [{ in: ['R2.0', 'R3.0'] }, 'R1.1', [17, 3]].slice(0, 0), ['R1.1', [17, 3]], [{ in: ['R3.0'] }, [17, 3], [23, 3], 'R3.0'], [[17, 3], 'R2.0'], ['R2.1', [17, 13]], ['R3.1', [23, 13], [17, 13]], [{ out: ['R2.1', 'R3.1'] }, [17, 13], [4, 13], 'B1.1']] };
    sc.sch.wires = [['B1.0', [4, 3], 'R1.0'], ['R1.1', [17, 3]], [{ in: ['R3.0'] }, [17, 3], [23, 3], 'R3.0'], [{ in: ['R2.0'] }, [17, 3], 'R2.0'], ['R2.1', [17, 13]], ['R3.1', [23, 13], [17, 13]], [{ out: ['R2.1', 'R3.1'] }, [17, 13], [4, 13], 'B1.1']];
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: false, below: true, hint: 'Compruebe las dos leyes: en el nudo y en el lazo.',
      controls: [rsel('r1', 'R1', 330, 'R1'), rsel('r2', 'R2', 470, 'R2'), rsel('r3', 'R3', 680, 'R3')],
      outs: [
        { id: 'req', label: 'R2 ∥ R3 · resistencia total', fn: (lab) => { const a = PT.val(lab.scene.parts[2], 'value'), b = PT.val(lab.scene.parts[3], 'value'), p = a * b / (a + b); return sp.fmtR(p) + ' · ' + sp.fmtR(PT.val(lab.scene.parts[1], 'value') + p); } },
        { id: 'it', label: 'Corriente de la fuente', hl: true, fn: (lab) => EM.fmtI(-lab.bench.c.find('B1:src').i) },
        { id: 'ramas', label: 'Corriente por R2 y por R3', fn: (lab) => EM.fix(iOf(lab, 'R2') * 1000, 2) + ' mA y ' + EM.fix(iOf(lab, 'R3') * 1000, 2) + ' mA' },
        { id: 'kcl', label: 'Ley de corrientes: I(R1) − I(R2) − I(R3)', fn: (lab) => EM.fix((iOf(lab, 'R1') - iOf(lab, 'R2') - iOf(lab, 'R3')) * 1000, 4) + ' mA ≈ 0' },
        { id: 'kvl', label: 'Ley de tensiones: pila − V(R1) − V(R2)', fn: (lab) => EM.fix(lab.bench.v('bb:T+4') - lab.bench.v('bb:T-4') - vOf(lab, 'R1') - vOf(lab, 'R2'), 4) + ' V ≈ 0' }
      ]
    });
  });

  /* 5.5 LED en serie y en paralelo */
  EM.defineSim('leds', function (sim) {
    const sc = board();
    sc.parts = [{ id: 'FA', type: 'LAB', v: 5, ilimit: 1, at: [-30, 24], pins: ['T+2', 'T-2'] }, { id: 'R1', type: 'R', value: 100, pins: ['h10', 'h14'] }, { id: 'R2', type: 'R', value: 220, pins: [null, null] }, { id: 'D1', type: 'LED', color: 'rojo', pins: ['g14', 'g15'] }, { id: 'D2', type: 'LED', color: 'rojo', pins: ['f15', 'f16'] }, { id: 'D3', type: 'LED', color: 'rojo', pins: [null, null] }];
    sc.wires = [{ id: 'wp', a: 'T+5', b: 'j10' }, { id: 'wn', a: 'j16', b: 'T-5' }, { id: 'wn2', a: 'j13', b: 'T-5', cut: true }];
    const MODES = {
      s2: { txt: 'Dos LED rojos en serie con 100 Ω: las caídas suman 3.9 V y la resistencia se queda con 1.1 V.', set: (s) => { s.parts[1].value = 100; s.parts[1].pins = ['h10', 'h14']; s.parts[2].pins = [null, null]; s.parts[3].pins = ['g14', 'g15']; s.parts[4].pins = ['f15', 'f16']; s.parts[5].pins = [null, null]; s.parts[3].color = s.parts[4].color = 'rojo'; s.wires[1].a = 'j16'; s.wires[2].cut = true; } },
      s3: { txt: 'Tres LED rojos en serie: necesitan más de 5.85 V y la fuente solo da 5 V: no encienden.', set: (s) => { MODES.s2.set(s); s.parts[5].pins = ['h16', 'h17']; s.wires[1].a = 'j17'; } },
      p1: { txt: 'Dos LED distintos (rojo y verde) en paralelo con UNA resistencia de 100 Ω: se reparten la corriente de forma desigual.', set: (s) => { MODES.s2.set(s); s.parts[4].pins = ['f14', 'f15']; s.parts[4].color = 'verde'; s.wires[1].a = 'j15'; } },
      p2: { txt: 'Los mismos LED con una resistencia de 220 Ω cada uno: cada LED recibe una corriente casi igual y controlada.', set: (s) => { MODES.s2.set(s); s.parts[1].value = 220; s.parts[2].pins = ['i10', 'i12']; s.parts[2].value = 220; s.parts[4].pins = ['h12', 'h13']; s.parts[4].color = 'verde'; s.wires[1].a = 'j15'; s.wires[2].cut = false; } }
    };
    let mode = 's2';
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: sc, speeds: false, below: true, hint: 'Elija una conexión y mire el brillo y las corrientes.',
      controls: [{ type: 'select', id: 'mode', label: 'Conexión', options: [['s2', 'Dos LED en serie'], ['s3', 'Tres LED en serie'], ['p1', 'Dos LED en paralelo, una sola resistencia'], ['p2', 'Dos LED en paralelo, una resistencia por LED']], value: 's2', apply: (lab, v) => { mode = v; MODES[v].set(lab.scene); lab.rebuild(); } }],
      outs: [
        { id: 'tx', label: 'Qué pasa', fn: () => MODES[mode].txt },
        { id: 'd1', label: 'Corriente del LED 1 (rojo)', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts[3])) },
        { id: 'd2', label: 'Corriente del LED 2', fn: (lab) => (lab.scene.parts[4].pins[0] ? EM.fmtI(lab.bench.partCurrent(lab.scene.parts[4])) : '—') },
        { id: 'd3', label: 'Corriente del LED 3', fn: (lab) => (lab.scene.parts[5].pins[0] ? EM.fmtI(lab.bench.partCurrent(lab.scene.parts[5])) : '—') }
      ]
    });
  });
})();
