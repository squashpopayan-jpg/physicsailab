/* Capítulo 16 — El transistor bipolar */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const K = 8.617333262e-5;

  /* 16.1 Curvas de salida (familia) */
  EM.defineSim('c16-curvas', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['sweep', 'table'], autoSweep: true, hint: 'Una fuente de corriente de base (IB) y una fuente de tensión colector-emisor (VCE) alimentan un 2N3904.',
      spec: {
        parts: [['IB', 'IDC', 4, 8, 0, { i: 30e-6 }], ['Q1', 'NPN', 12, 8, 0, { model: '2N3904' }], ['VCE', 'VDC', 20, 8, 0, { v: 5 }]],
        wires: [[[4, 6], [10, 6], [10, 8]], ['Q1.C', 'VCE.0'], [[4, 10], [20, 10]], ['IB.1', 'gnd']]
      },
      controls: [
        { type: 'select', id: 'm', label: 'Transistor', options: Object.keys(MOD.BJT).filter((k) => MOD.BJT[k].pol > 0).map((k) => [k, MOD.BJT[k].name + ' (β ≈ ' + MOD.BJT[k].bf + ', V_A = ' + MOD.BJT[k].vaf + ' V)']), value: '2N3904', apply: (T, v) => T.set('Q1', 'model', v) },
        { type: 'slider', id: 'ib', label: 'Corriente de base', min: 1e-6, max: 100e-6, value: 30e-6, unit: 'A', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('IB', 'i', v) },
        { type: 'slider', id: 'vce', label: 'Tensión colector–emisor', min: 0, max: 10, step: 0.1, value: 5, unit: 'V', apply: (T, v) => T.set('VCE', 'v', v) }
      ],
      outs: [
        { id: 'ic', label: 'Corriente de colector I_C', hl: true, fn: (T) => fmt(T.m('Q1').ic, 'A') },
        { id: 'b', label: 'β = I_C / I_B', fn: (T) => { const q = T.m('Q1'); return Math.abs(q.ib) > 1e-9 ? EM.fix(q.ic / q.ib, 0) : '—'; } },
        { id: 'vbe', label: 'V_BE', fn: (T) => fmt(T.m('Q1').vbe, 'V') },
        { id: 'gm', label: 'g_m = I_C / V_T', fn: (T) => fmt(Math.max(0, T.m('Q1').ic) / 0.02585, 'S') },
        { id: 'ro', label: 'r_o ≈ (V_A + V_CE) / I_C', fn: (T) => { const q = T.m('Q1'), va = MOD.BJT[T.net.part('Q1').p.model].vaf; return q.ic > 1e-9 ? fmt((va + q.vce) / q.ic, 'Ω') : '∞'; } }
      ]
    });
    T.setSweep({ src: 'VCE', a: 0, b: 10, n: 120, src2: 'IB', a2: 10e-6, b2: 50e-6, n2: 5, meas: 'i:Q1' });
  });

  /* 16.2 Característica de transferencia (Ebers–Moll) */
  EM.defineSim('c16-ebersmoll', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Característica I_C frente a V_BE' });
    sim.group('Transistor');
    sim.select('q', { label: 'Modelo', options: [['BC547', 'BC547'], ['2N3904', '2N3904'], ['2N2222', '2N2222A'], ['TIP31', 'TIP31C (potencia)']], value: '2N3904' });
    sim.seg('s', { label: 'Escala de I_C', options: [['log', 'Logarítmica'], ['lin', 'Lineal']], value: 'log' });
    sim.slider('T', { label: 'Temperatura de la unión', min: 250, max: 420, step: 5, value: 300, unit: 'K' });
    sim.slider('v', { label: 'Tensión del cursor V_BE', min: 0.4, max: 0.85, step: 0.005, value: 0.65, unit: 'V' });
    sim.out('ic', 'I_C en el cursor', { hl: true }); sim.out('gm', 'g_m = I_C / V_T', { hl: true }); sim.out('rpi', 'r_π = β / g_m'); sim.out('x2', 'V_BE para duplicar I_C (V_T ln 2)'); sim.out('dv', 'dV_BE/dT a I_C fija');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, m = MOD.BJT[p.q], vt = K * p.T;
      const IsT = m.Is * Math.pow(p.T / 300.15, 3) * Math.exp((p.T / 300.15 - 1) * 1.11 / vt);
      const ic = (v) => IsT * (Math.exp(v / vt) - 1);
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const lg = p.s === 'log';
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0.4, xmax: 0.85, ymin: lg ? 1e-9 : 0, ymax: lg ? 1 : 100, ylog: lg, ml: 64, mr: 14, mt: 14, mb: 40, xlabel: 'V_BE (V)', ylabel: lg ? 'I_C (A)' : 'I_C (mA)' });
      pl.frame();
      const vs = M.linspace(0.4, 0.85, 200);
      pl.xy(vs, vs.map((v) => (lg ? ic(v) : ic(v) * 1000)), { color: '--c1', width: 2.8 });
      const I = ic(p.v);
      pl.dot(p.v, lg ? Math.max(I, 1e-9) : I * 1000, { color: '--c2', r: 6 }); pl.vline(p.v, { color: '--ink-3', dash: [3, 4] });
      const vbe1 = vt * Math.log(1e-3 / IsT + 1), vbe2 = K * (p.T + 1) * Math.log(1e-3 / (m.Is * Math.pow((p.T + 1) / 300.15, 3) * Math.exp(((p.T + 1) / 300.15 - 1) * 1.11 / (K * (p.T + 1)))) + 1);
      sim.set('ic', fmt(I, 'A')); sim.set('gm', fmt(I / vt, 'S')); sim.set('rpi', I > 1e-9 ? fmt(m.bf * vt / I, 'Ω') : '∞'); sim.set('x2', EM.fix(vt * Math.LN2 * 1000, 1) + ' mV'); sim.set('dv', EM.fix((vbe2 - vbe1) * 1000, 2) + ' mV/K (a 1 mA)');
    });
  });

  /* 16.3 Regiones de funcionamiento */
  EM.defineSim('c16-modos', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['table'], hint: 'Suba la tensión de base V_B desde 0: el transistor pasa de corte a activa y luego a saturación.',
      spec: CX.ce({ q: '2N3904', vcc: 12, rc: 1000, rb: 10000, vb: 0 }),
      controls: [
        { type: 'slider', id: 'vb', label: 'Tensión de la fuente de base V_B', min: 0, max: 8, step: 0.05, value: 0, unit: 'V', apply: (T, v) => T.set('VB', 'v', v) },
        { type: 'slider', id: 'rb', label: 'Resistor de base R_B', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RB', 'r', v) }
      ],
      outs: [
        { id: 'm', label: 'Región', hl: true, fn: (T) => { const q = T.m('Q1'); if (!q) return '—'; if (q.vbe < 0.45) return 'corte'; if (q.vce < 0.3) return 'saturación'; return 'activa directa'; } },
        { id: 'ib', label: 'I_B', fn: (T) => fmt(T.m('Q1').ib, 'A') },
        { id: 'ic', label: 'I_C', fn: (T) => fmt(T.m('Q1').ic, 'A') },
        { id: 'b', label: 'β = I_C / I_B', fn: (T) => { const q = T.m('Q1'); return Math.abs(q.ib) > 1e-8 ? EM.fix(q.ic / q.ib, 0) : '—'; } },
        { id: 'vbe', label: 'V_BE', fn: (T) => fmt(T.m('Q1').vbe, 'V') },
        { id: 'vce', label: 'V_CE', fn: (T) => fmt(T.m('Q1').vce, 'V') }
      ]
    });
  });
})();
