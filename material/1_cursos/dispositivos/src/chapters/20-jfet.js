/* Capítulo 20 — El transistor de efecto de campo de unión (JFET) */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const par = (a, b) => (a * b) / (a + b);
  const jn = Object.keys(MOD.JFET).filter((k) => MOD.JFET[k].pol > 0);
  const idJ = (idss, P, vgs) => (vgs >= 0 ? idss : vgs <= -P ? 0 : idss * Math.pow(1 - vgs / -P, 2));

  /* 20.1 Curvas del JFET */
  EM.defineSim('c20-curvas', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['sweep', 'table'], autoSweep: true, net: { damage: false },
      hint: 'La puerta se polariza con una tensión negativa respecto de la fuente (unión pn en inversa): casi no circula corriente por ella.',
      spec: {
        parts: [['VGS', 'VDC', 4, 8, 0, { v: -1 }], ['J1', 'JFN', 12, 8, 0, { model: '2N5457' }], ['VDS', 'VDC', 20, 8, 0, { v: 8 }]],
        wires: [[[4, 6], [10, 6], [10, 8]], ['J1.0', 'VDS.0'], [[4, 10], [20, 10]], ['VGS.1', 'gnd']]
      },
      controls: [
        { type: 'select', id: 'm', label: 'JFET de canal n', options: jn.map((k) => [k, MOD.JFET[k].name + ' · I_DSS = ' + MOD.JFET[k].idss * 1e3 + ' mA, V_P = −' + MOD.JFET[k].vp + ' V']), value: '2N5457', apply: (T, v) => T.set('J1', 'model', v) },
        { type: 'slider', id: 'vgs', label: 'Tensión puerta–fuente V_GS', min: -4, max: 0.65, step: 0.01, value: -1, unit: 'V', apply: (T, v) => T.set('VGS', 'v', v) },
        { type: 'slider', id: 'vds', label: 'Tensión drenador–fuente V_DS', min: 0, max: 12, step: 0.05, value: 8, unit: 'V', apply: (T, v) => T.set('VDS', 'v', v) }
      ],
      outs: [
        { id: 'reg', label: 'Región', hl: true, fn: (T) => { const e = T.m('J1'), m = MOD.JFET[T.net.part('J1').p.model]; if (!e) return '—'; if (e.vgs <= -m.vp) return 'corte (estrangulado)'; return e.vds < e.vgs + m.vp ? 'triodo (óhmica)' : 'saturación (canal estrangulado)'; } },
        { id: 'id', label: 'Corriente de drenador I_D', hl: true, fn: (T) => fmt(T.m('J1').i, 'A') },
        { id: 'ig', label: 'Corriente de puerta I_G', fn: (T) => { const n = T.net, e = n.cir.els.find((x) => x.id === 'J1:gs'); return e ? fmt(Math.abs(e.i || 0), 'A') : '—'; } },
        { id: 'gm', label: 'g_m = g_m0 (1 − V_GS/V_P)', fn: (T) => { const m = MOD.JFET[T.net.part('J1').p.model], e = T.m('J1'); return fmt(Math.max(0, m.k * (e.vgs + m.vp)), 'S') + ' (g_m0 = ' + fmt(2 * m.idss / m.vp, 'S') + ')'; } },
        { id: 'rds', label: 'R_DS = 1/(k·V_ov) (triodo)', fn: (T) => { const m = MOD.JFET[T.net.part('J1').p.model], e = T.m('J1'); const ov = e.vgs + m.vp; return ov > 0 ? fmt(1 / (m.k * ov), 'Ω') : '∞'; } }
      ]
    });
    T.setSweep({ src: 'VDS', a: 0, b: 12, n: 120, src2: 'VGS', a2: -2, b2: 0, n2: 5, meas: 'i:J1' });
  });

  /* 20.2 Autopolarización: dispersión de parámetros y recta de polarización */
  const DEV = { min: { n: 'mínimo (I_DSS = 1.5 mA, V_P = 1.5 V)', idss: 1.5e-3, P: 1.5 }, nom: { n: 'nominal (I_DSS = 3 mA, V_P = 2.5 V)', idss: 3e-3, P: 2.5 }, max: { n: 'máximo (I_DSS = 5 mA, V_P = 4 V)', idss: 5e-3, P: 4 } };
  const selfBias = (d, rs) => { const a = rs / d.P, x = d.idss * a; const id = ((2 * x + 1) - Math.sqrt(4 * x + 1)) / (2 * d.idss * a * a); return { id, vgs: -id * rs }; };
  EM.defineSim('c20-polar', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Curva de transferencia y rectas de polarización' });
    sim.group('Polarización');
    sim.seg('t', { label: 'Tipo de polarización', options: [['auto', 'Autopolarización (R_S)'], ['fija', 'Tensión fija V_GG']], value: 'auto' });
    sim.slider('rs', { label: 'Resistor de fuente R_S', min: 100, max: 3000, step: 10, value: 800, unit: 'Ω' });
    sim.slider('vgg', { label: 'Tensión fija V_GG (sólo «fija»)', min: -3, max: 0, step: 0.05, value: -1.2, unit: 'V' });
    sim.out('imin', 'I_D del ejemplar «mínimo»', { hl: true }); sim.out('inom', 'I_D del ejemplar «nominal»', { hl: true }); sim.out('imax', 'I_D del ejemplar «máximo»', { hl: true }); sim.out('rat', 'Cociente I_D máx / I_D mín', { hl: true }); sim.out('gm', 'g_m del nominal en su punto');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: -4.5, xmax: 0.2, ymin: 0, ymax: 5.4, ml: 56, mr: 14, mt: 14, mb: 40, xlabel: 'V_GS (V)', ylabel: 'I_D (mA)' });
      pl.frame();
      const vs = M.linspace(-4.5, 0, 200), cols = { min: '--c3', nom: '--c1', max: '--c2' }, res = {};
      c.font = '12px ' + (EM.FONT_MONO || 'monospace'); c.textAlign = 'left';
      [['max', 'ejemplar máximo'], ['nom', 'ejemplar nominal'], ['min', 'ejemplar mínimo']].forEach(([k, t], i) => { c.fillStyle = EM.col(cols[k]); c.fillRect(70, 24 + i * 18, 14, 4); c.fillStyle = EM.col('--ink-2'); c.fillText(t, 90, 30 + i * 18); });
      for (const k of ['min', 'nom', 'max']) {
        const d = DEV[k];
        pl.xy(vs, vs.map((v) => idJ(d.idss, d.P, v) * 1e3), { color: cols[k], width: 2.4 });
        let id, vgs;
        if (p.t === 'auto') ({ id, vgs } = selfBias(d, p.rs)); else { vgs = p.vgg; id = idJ(d.idss, d.P, vgs); }
        res[k] = { id, vgs, d };
        pl.dot(vgs, id * 1e3, { color: cols[k], r: 6 });
      }
      if (p.t === 'auto') pl.xy([-4.5, 0], [4.5e3 / p.rs, 0], { color: '--ink-3', width: 1.6, dash: [6, 4] }); else pl.vline(p.vgg, { color: '--ink-3', dash: [6, 4] });
      sim.set('imin', fmt(res.min.id, 'A')); sim.set('inom', fmt(res.nom.id, 'A')); sim.set('imax', fmt(res.max.id, 'A'));
      sim.set('rat', res.min.id > 1e-9 ? EM.fix(res.max.id / res.min.id, 2) : '∞');
      const n = res.nom; sim.set('gm', fmt(Math.max(0, 2 * n.d.idss / n.d.P * (1 + n.vgs / n.d.P)), 'S'));
    });
  });

  /* 20.3 Amplificador de fuente común con JFET (autopolarizado) */
  EM.defineSim('c20-amp', function (sim) {
    const dcn = (T) => { const k = JSON.stringify(T.net.doc.parts.map((q) => q.p)); if (!T._dc || T._dc.k !== k) T._dc = { k, n: EM.Panels.tempNet(T) }; return T._dc.n; };
    const op = (T) => { const n = dcn(T), m = MOD.JFET[T.net.part('Q1').p.model], e = n.cir.els.find((x) => x.type === 'M'); return { id: Math.abs(n.iPart(n.part('Q1'))), vgs: e.vgs, gm: Math.max(0, m.k * (e.vgs + m.vp)) }; };
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope', 'bode'], tdiv: 5e-4,
      hint: 'JFET autopolarizado: la puerta va a tierra a través de 1 MΩ y V_GS = −I_D·R_S. C_S desacopla R_S para la señal.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ jfet: true, mode: 'ce', vcc: 15, amp: 0.1, r1: 1e9, r2: 1e6, rc: 4700, re: 470, rl: 10000 }),
      controls: [
        { type: 'select', id: 'q', label: 'JFET', options: jn.map((k) => [k, MOD.JFET[k].name + ' (I_DSS = ' + MOD.JFET[k].idss * 1e3 + ' mA)']), value: '2N5457', apply: (T, v) => T.set('Q1', 'model', v) },
        { type: 'seg', id: 'ce', label: 'Desacoplo C_S', options: [['con', 'Con C_S'], ['sin', 'Sin C_S']], value: 'con', apply: (T, v) => T.set('CE', 'c', v === 'con' ? 100e-6 : 1e-15) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.01, max: 2, value: 0.1, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'rs', label: 'Resistor de fuente R_S', min: 100, max: 3000, value: 470, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RE', 'r', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i && i.pp > 1e-5 ? EM.fix(o.pp / i.pp, 2) : '—'; } },
        { id: 'avt', label: 'Ganancia teórica', fn: (T) => { const q = op(T), by = T.net.part('CE').p.c > 1e-6, RS = T.net.part('RE').p.r, RD = T.net.part('RC').p.r, RL = T.net.part('RL').p.r; return EM.fix(-q.gm * par(RD, RL) / (by ? 1 : 1 + q.gm * RS), 2); } },
        { id: 'id', label: 'Punto de reposo I_D', fn: (T) => fmt(op(T).id, 'A') },
        { id: 'vgs', label: 'V_GS en reposo', fn: (T) => fmt(op(T).vgs, 'V') },
        { id: 'gm', label: 'g_m en el punto de reposo', fn: (T) => fmt(op(T).gm, 'S') }
      ]
    });
    T.setBode(10, 1e7);
  });

  /* 20.4 Resistencia controlada por tensión */
  EM.defineSim('c20-vcr', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 5e-4, net: { damage: false },
      hint: 'El JFET trabaja en la región óhmica: su resistencia drenador–fuente depende de V_GS. Forma con R₁ un divisor cuya relación se controla con una tensión continua (atenuador, control automático de ganancia).',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: {
        parts: [['FG1', 'FG', -1, 12, 0, { wave: 'sin', amp: 0.05, f: 1000, rs: 1 }], ['R1', 'R', 6, 10, 0, { r: 10000 }], ['J1', 'JFN', 14, 14, 0, { model: '2N5457' }], ['VG', 'VDC', 8, 16, 0, { v: -1.5 }],
          ['Ni', 'LBL', 3, 8, 2, { name: 'in' }], ['No', 'LBL', 18, 10, 0, { name: 'out' }]],
        wires: [['FG1.OUT', [2, 10], 'R1.0'], [[3, 10], [3, 8]], ['R1.1', [16, 10], 'J1.0'], [[16, 10], [18, 10]], ['VG.0', 'J1.1'], ['VG.1', [8, 22]], ['FG1.GND', [2, 22], [16, 22]], ['J1.2', [16, 22]], [[8, 22], [8, 23]], ['gndat', 8, 23]]
      },
      controls: [
        { type: 'slider', id: 'vg', label: 'Tensión de control V_GS', min: -2.6, max: 0, step: 0.02, value: -1.5, unit: 'V', apply: (T, v) => T.set('VG', 'v', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.005, max: 1, value: 0.05, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'select', id: 'm', label: 'JFET', options: jn.map((k) => [k, MOD.JFET[k].name + ' (V_P = −' + MOD.JFET[k].vp + ' V)']), value: '2N5457', apply: (T, v) => T.set('J1', 'model', v) }
      ],
      outs: [
        { id: 'rds', label: 'R_DS = 1/[k (V_GS + V_P)]', hl: true, fn: (T) => { const m = MOD.JFET[T.net.part('J1').p.model], vgs = T.net.part('VG').p.v, ov = vgs + m.vp; return ov > 0 ? fmt(1 / (m.k * ov), 'Ω') : '∞ (corte)'; } },
        { id: 'att', label: 'Atenuación teórica R_DS/(R₁ + R_DS)', fn: (T) => { const m = MOD.JFET[T.net.part('J1').p.model], vgs = T.net.part('VG').p.v, ov = vgs + m.vp, r = ov > 0 ? 1 / (m.k * ov) : 1e12, g = r / (r + T.net.part('R1').p.r); return EM.fix(g, 4) + ' (' + EM.fix(20 * Math.log10(g), 1) + ' dB)'; } },
        { id: 'am', label: 'Atenuación medida V_sal / V_ent', fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); if (!o || !i || i.pp < 1e-5) return '—'; const g = o.pp / i.pp; return EM.fix(g, 4) + ' (' + EM.fix(20 * Math.log10(Math.max(g, 1e-9)), 1) + ' dB)'; } },
        { id: 'vo', label: 'Salida pico a pico', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } }
      ]
    });
  });
})();
