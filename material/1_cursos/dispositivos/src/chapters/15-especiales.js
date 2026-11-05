/* Capítulo 15 — Zener, LED, fotodiodo y celda solar */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const K = 8.617333262e-5, VT = K * 300.15;

  /* 15.1 Regulador con Zener */
  EM.defineSim('c15-zener', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.5, edit: 'values', panels: ['sweep', 'table'], autoSweep: true,
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 12 } }, items: [{ id: 'R1', t: 'R', p: { r: 680, watt: 1 }, mode: 'series', tap: 'out' }, { id: 'DZ', t: 'ZD', p: { vz: 5.1 }, mode: 'shunt', rot: 3 }, { id: 'RL', t: 'R', p: { r: 1000, watt: 0.5 }, mode: 'shunt' }] }),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de entrada', min: 0, max: 20, step: 0.1, value: 12, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga', min: 100, max: 100000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'select', id: 'vz', label: 'Tensión Zener', options: [[3.3, '3.3 V'], [4.7, '4.7 V'], [5.1, '5.1 V'], [6.2, '6.2 V'], [9.1, '9.1 V'], [12, '12 V']], value: 5.1, apply: (T, v) => T.set('DZ', 'vz', +v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (T) => fmt(T.v('out'), 'V', 4) },
        { id: 'iz', label: 'Corriente del Zener', fn: (T) => fmt(Math.max(0, -T.i('DZ')), 'A') },
        { id: 'il', label: 'Corriente de la carga', fn: (T) => fmt(T.v('out') / T.net.part('RL').p.r, 'A') },
        { id: 'pz', label: 'Potencia en el Zener', fn: (T) => fmt(Math.max(0, -T.i('DZ')) * T.v('out'), 'W') }
      ]
    });
    T.setSweep({ src: 'V1', a: 0, b: 20, n: 100, measLabel: 'out' });
  });

  /* 15.2 LED */
  EM.defineSim('c15-led', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.3, edit: 'values', panels: ['table'],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 5 } }, items: [{ id: 'R1', t: 'R', p: { r: 220, watt: 0.5 }, mode: 'series' }, { id: 'D1', t: 'LED', p: { color: 'rojo' }, mode: 'shunt', rot: 1 }] }),
      controls: [
        { type: 'select', id: 'c', label: 'Color del LED', options: Object.keys(MOD.LED).map((k) => [k, k === 'IR' ? 'Infrarrojo' : k[0].toUpperCase() + k.slice(1)]), value: 'rojo', apply: (T, v) => T.set('D1', 'color', v) },
        { type: 'slider', id: 'v', label: 'Tensión de alimentación', min: 1, max: 12, step: 0.1, value: 5, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'slider', id: 'r', label: 'Resistor limitador', min: 22, max: 10000, value: 220, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('R1', 'r', v) }
      ],
      outs: [
        { id: 'i', label: 'Corriente del LED', hl: true, fn: (T) => fmt(T.i('D1'), 'A') },
        { id: 'vf', label: 'Tensión del LED V_F', fn: (T) => fmt(T.vd('R1.1', 'gnd'), 'V') },
        { id: 'pr', label: 'Potencia en el resistor', fn: (T) => fmt(Math.pow(T.i('R1'), 2) * T.net.part('R1').p.r, 'W') },
        { id: 'rc', label: 'R para 15 mA con esta V_S y V_F ≈ 1.95…3.1 V', fn: (T) => { const m = MOD.LED[T.net.part('D1').p.color]; return fmt(Math.max(0, (T.net.part('V1').p.v - m.vf * 0.97) / 0.015), 'Ω'); } },
        { id: 's', label: 'Estado', fn: (T) => (T.net.part('D1').dead ? '<b style="color:var(--warn-ink)">quemado</b>' : 'correcto') }
      ]
    });
  });

  /* 15.3 Fotodiodo en modo fotoconductivo */
  EM.defineSim('c15-fotodiodo', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['table'],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 5 } }, items: [{ id: 'R1', t: 'R', p: { r: 10000 }, mode: 'series', tap: 'out' }, { id: 'PD1', t: 'PD', p: { lux: 1000 }, mode: 'shunt', rot: 3 }] }),
      controls: [
        { type: 'slider', id: 'lx', label: 'Iluminancia', min: 0, max: 20000, value: 1000, unit: 'lx', apply: (T, v) => T.set('PD1', 'lux', v) },
        { type: 'slider', id: 'r', label: 'Resistor de carga', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R1', 'r', v) }
      ],
      outs: [
        { id: 'ip', label: 'Fotocorriente I_ph', hl: true, fn: (T) => fmt(Math.max(0, T.i('R1')), 'A') },
        { id: 'vo', label: 'Tensión de salida (sobre el fotodiodo)', fn: (T) => fmt(T.v('out'), 'V') },
        { id: 'vr', label: 'Caída en el resistor = I_ph·R', fn: (T) => fmt(T.net.part('V1').p.v - T.v('out'), 'V') }
      ]
    });
  });

  /* 15.4 Celda solar */
  EM.defineSim('c15-solar', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Curvas I–V y P–V del panel solar' });
    const m = MOD.SOLAR.panel;
    sim.group('Panel de 6 V (12 celdas)');
    sim.slider('g', { label: 'Irradiancia', min: 50, max: 1100, step: 10, value: 1000, unit: 'W/m²' });
    sim.slider('rl', { label: 'Resistencia de carga', min: 3, max: 500, value: 30, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0) });
    sim.out('voc', 'Tensión de circuito abierto V_oc', { hl: true }); sim.out('isc', 'Corriente de cortocircuito I_sc'); sim.out('mpp', 'Punto de máxima potencia'); sim.out('ff', 'Factor de llenado'); sim.out('op', 'Punto de trabajo con la carga', { hl: true }); sim.out('eta', 'Potencia aprovechada / P_max');
    const iOf = (g, V) => { const iph = m.isc1000 * g / 1000; let lo = -1, hi = iph + 0.5; for (let k = 0; k < 90; k++) { const I = 0.5 * (lo + hi), Vd = V + I * m.rs, f = iph - m.Is * (Math.exp(Math.min(Vd / (m.n * VT), 80)) - 1) - Vd / m.rsh - I; if (f > 0) lo = I; else hi = I; } return 0.5 * (lo + hi); };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const iph = m.isc1000 * p.g / 1000, Voc = m.n * VT * Math.log(iph / m.Is + 1);
      const Vs = M.linspace(0, Voc * 1.02, 200), Is = Vs.map((v) => Math.max(0, iOf(p.g, v))), Ps = Vs.map((v, k) => v * Is[k]);
      let kb = 0; for (let k = 1; k < Ps.length; k++) if (Ps[k] > Ps[kb]) kb = k;
      const Isc = iOf(p.g, 0);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: 9, ymin: 0, ymax: 0.25 * 1000, ml: 56, mr: 56, mt: 14, mb: 40, xlabel: 'tensión (V)', ylabel: 'corriente (mA)' });
      pl.frame();
      pl.xy(Vs, Is.map((i) => i * 1000), { color: '--c1', width: 2.8 });
      const pmax = Math.max(...Ps) || 1;
      pl.xy(Vs, Ps.map((q) => q / 1.4 * 250), { color: '--c3', width: 2.4 });
      pl.dot(Vs[kb], Is[kb] * 1000, { color: '--c4', r: 6 });
      /* recta de carga: V = R·I */
      const op = (() => { let lo = 0, hi = Voc; for (let k = 0; k < 80; k++) { const V = 0.5 * (lo + hi), I = iOf(p.g, V); if (V / p.rl > I) hi = V; else lo = V; } const V = 0.5 * (lo + hi); return { V, I: V / p.rl }; })();
      pl.xy([0, 9], [0, 9 / p.rl * 1000], { color: '--c2', width: 1.8, dash: [6, 4] });
      pl.dot(op.V, op.I * 1000, { color: '--c2', r: 7 });
      EM.text(c, 'potencia (0–1.4 W)', w - 52, 28, { size: 11.5, color: '--c3', align: 'right' });
      pl.legend([{ label: 'I(V)', color: '--c1' }, { label: 'P(V)', color: '--c3' }, { label: 'recta de carga V = R·I', color: '--c2', kind: 'dash' }], 'bl');
      sim.set('voc', fmt(Voc, 'V')); sim.set('isc', fmt(Isc, 'A')); sim.set('mpp', `${fmt(Vs[kb], 'V')} · ${fmt(Is[kb], 'A')} · ${fmt(Ps[kb], 'W')}`); sim.set('ff', EM.fix(Ps[kb] / (Voc * Isc), 2));
      sim.set('op', `${fmt(op.V, 'V')} · ${fmt(op.I, 'A')} · ${fmt(op.V * op.I, 'W')}`); sim.set('eta', EM.fix(100 * op.V * op.I / pmax, 0) + ' %');
    });
  });
})();
