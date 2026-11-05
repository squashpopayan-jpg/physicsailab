/* Capítulo 19 — El transistor MOSFET */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const par = (a, b) => (a * b) / (a + b);
  const nmos = Object.keys(MOD.MOS).filter((k) => MOD.MOS[k].pol > 0 && !MOD.MOS[k].edu);

  /* corriente de drenador del modelo (canal N equivalente), igual que el motor de simulación */
  const idOf = (m, vgs, vds) => {
    const ov = vgs - m.vth, lam = m.lam || 0;
    if (ov <= 0 || vds <= 0) return 0;
    return vds < ov ? m.k * (ov * vds - vds * vds / 2) * (1 + lam * vds) : 0.5 * m.k * ov * ov * (1 + lam * vds);
  };

  /* 19.1 Curvas de salida (familia) */
  EM.defineSim('c19-curvas', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['sweep', 'table'], autoSweep: true, net: { damage: false },
      hint: 'Una fuente de tensión puerta–fuente (V_GS) y otra de drenador–fuente (V_DS) polarizan un MOSFET. No circula corriente por la puerta.',
      spec: {
        parts: [['VGS', 'VDC', 4, 8, 0, { v: 3.5 }], ['M1', 'NMOS', 12, 8, 0, { model: '2N7000' }], ['VDS', 'VDC', 20, 8, 0, { v: 5 }]],
        wires: [[[4, 6], [10, 6], [10, 8]], ['M1.0', 'VDS.0'], [[4, 10], [20, 10]], ['VGS.1', 'gnd']]
      },
      controls: [
        { type: 'select', id: 'm', label: 'Transistor', options: nmos.map((k) => [k, MOD.MOS[k].name + ' · V_th = ' + MOD.MOS[k].vth + ' V']), value: '2N7000', apply: (T, v) => T.set('M1', 'model', v) },
        { type: 'slider', id: 'vgs', label: 'Tensión puerta–fuente V_GS', min: 0, max: 8, step: 0.05, value: 3.5, unit: 'V', apply: (T, v) => T.set('VGS', 'v', v) },
        { type: 'slider', id: 'vds', label: 'Tensión drenador–fuente V_DS', min: 0, max: 10, step: 0.05, value: 5, unit: 'V', apply: (T, v) => T.set('VDS', 'v', v) }
      ],
      outs: [
        { id: 'reg', label: 'Región', hl: true, fn: (T) => { const e = T.m('M1'), m = MOD.MOS[T.net.part('M1').p.model]; if (!e) return '—'; if (e.vgs <= m.vth) return 'corte'; return e.vds < e.vgs - m.vth ? 'triodo (óhmica)' : 'saturación'; } },
        { id: 'id', label: 'Corriente de drenador I_D', hl: true, fn: (T) => fmt(T.m('M1').i, 'A') },
        { id: 'vov', label: 'Sobretensión V_ov = V_GS − V_th', fn: (T) => { const m = MOD.MOS[T.net.part('M1').p.model], e = T.m('M1'); return fmt(Math.max(0, e.vgs - m.vth), 'V'); } },
        { id: 'gm', label: 'g_m = k·V_ov (saturación)', fn: (T) => { const m = MOD.MOS[T.net.part('M1').p.model], e = T.m('M1'); return fmt(m.k * Math.max(0, e.vgs - m.vth), 'S'); } },
        { id: 'rds', label: 'R_DS(on) = 1/(k·V_ov) (triodo)', fn: (T) => { const m = MOD.MOS[T.net.part('M1').p.model], e = T.m('M1'); const ov = e.vgs - m.vth; return ov > 0 ? fmt(1 / (m.k * ov), 'Ω') : '∞'; } }
      ]
    });
    T.setSweep({ src: 'VDS', a: 0, b: 10, n: 120, src2: 'VGS', a2: 2.5, b2: 5, n2: 6, meas: 'i:M1' });
  });

  /* 19.2 Característica de transferencia, extracción de V_th y k */
  EM.defineSim('c19-transfer', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Característica de transferencia I_D(V_GS)' });
    sim.group('Transistor');
    sim.select('q', { label: 'Modelo', options: nmos.map((k) => [k, MOD.MOS[k].name]), value: '2N7000' });
    sim.seg('s', { label: 'Representación', options: [['id', 'I_D (lineal)'], ['sq', '√I_D (extracción de V_th)']], value: 'id' });
    sim.slider('vds', { label: 'Tensión drenador–fuente V_DS', min: 0.1, max: 12, step: 0.1, value: 8, unit: 'V' });
    sim.slider('vgs', { label: 'Cursor V_GS', min: 0, max: 8, step: 0.05, value: 4, unit: 'V' });
    sim.out('id', 'I_D en el cursor', { hl: true }); sim.out('gm', 'g_m en el cursor'); sim.out('vth', 'V_th (corte de la recta √I_D)'); sim.out('k', 'k = 2·(pendiente de √I_D)²'); sim.out('rds', 'R_DS(on) a V_ov del cursor');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, m = MOD.MOS[p.q];
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const vmax = 8, vs = M.linspace(0, vmax, 240), sq = p.s === 'sq';
      const ys = vs.map((v) => idOf(m, v, p.vds));
      const ymax = Math.max(...ys.map((y) => (sq ? Math.sqrt(y) : y)), 1e-9) * 1.08;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: vmax, ymin: 0, ymax, ml: 70, mr: 14, mt: 14, mb: 40, xlabel: 'V_GS (V)', ylabel: sq ? '√I_D (√A)' : 'I_D (A)' });
      pl.frame();
      pl.xy(vs, ys.map((y) => (sq ? Math.sqrt(y) : y)), { color: '--c1', width: 2.8 });
      const I = idOf(m, p.vgs, p.vds), ov = p.vgs - m.vth;
      pl.dot(p.vgs, sq ? Math.sqrt(I) : I, { color: '--c2', r: 6 }); pl.vline(p.vgs, { color: '--ink-3', dash: [3, 4] });
      pl.vline(m.vth, { color: '--c3', dash: [6, 4] });
      sim.set('id', fmt(I, 'A'));
      sim.set('gm', ov > 0 && p.vds >= ov ? fmt(m.k * ov * (1 + (m.lam || 0) * p.vds), 'S') : ov > 0 ? fmt(m.k * p.vds * (1 + (m.lam || 0) * p.vds), 'S') + ' (triodo)' : '0');
      sim.set('vth', EM.fix(m.vth, 2) + ' V'); sim.set('k', fmt(m.k, 'A/V²'));
      sim.set('rds', ov > 0 ? fmt(1 / (m.k * ov), 'Ω') : '∞');
    });
  });

  /* 19.3 Inversor CMOS */
  const cmosSpec = (o) => ({
    parts: [['VDD', 'VDC', 4, 10, 0, { v: o.vdd }], ['MP', 'PMOS', 14, 10, 0, { model: 'EDU_P', vth: 1.5, k: o.kp, flip: true }], ['MN', 'NMOS', 14, 18, 0, { model: 'EDU_N', vth: 1.5, k: o.kn }],
      ['FG1', 'FG', -3, 17, 0, { wave: 'square', amp: o.vdd / 2, off: o.vdd / 2, f: 100000, rs: 1 }], ['CL', 'C', 20, 16, 1, { c: o.cl, kind: 'ceramic' }],
      ['Ni', 'LBL', 8, 14, 2, { name: 'in' }], ['No', 'LBL', 18, 12, 0, { name: 'out' }]],
    wires: [['VDD.0', [16, 8]], [[4, 12], [2, 12]], ['gndat', 2, 12], [[12, 10], [10, 10], [10, 18], [12, 18]], ['FG1.OUT', [0, 16], [10, 16]], [[8, 16], [8, 14]],
      ['MP.0', 'MN.0'], [[16, 14], [20, 14]], [[18, 14], [18, 12]], ['CL.1', [20, 22]], ['FG1.GND', [0, 22], [20, 22]], ['MN.2', [16, 22]], [[10, 22], [10, 23]], ['gndat', 10, 23]]
  });
  EM.defineSim('c19-cmos', function (sim) {
    const cur = () => ({ vdd: sim.p.vdd || 5, kn: 2e-3, kp: 2e-3 * (sim.p.r || 1), cl: sim.p.cl || 1e-9 });
    const T = EM.Taller.mount(sim, {
      aspect: 1.25, edit: 'values', panels: ['sweep', 'scope'], autoSweep: true, tdiv: 1e-6, net: { damage: false },
      hint: 'Inversor CMOS: un PMOS arriba y un NMOS abajo (modelos didácticos, V_th = 1.5 V). En «Barrido» obtiene la característica de transferencia V_sal(V_ent); en «Osciloscopio», la conmutación con una carga capacitiva.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: cmosSpec({ vdd: 5, kn: 2e-3, kp: 2e-3, cl: 1e-9 }),
      controls: [
        { type: 'slider', id: 'vdd', label: 'Tensión de alimentación V_DD', min: 3.3, max: 12, step: 0.1, value: 5, unit: 'V', init: false, apply: (T, v) => { T.loadSpec(cmosSpec(cur())); T.set('FG1', 'amp', v / 2); T.set('FG1', 'off', v / 2); T.setSweep({ src: 'FG1', a: 0, b: v, n: 160, measLabel: 'out' }); } },
        { type: 'slider', id: 'r', label: 'Relación k_p / k_n (ancho del PMOS)', min: 0.25, max: 4, value: 1, unit: '', log: true, fmt: (v) => EM.fix(v, 2), init: false, apply: (T, v) => T.set('MP', 'k', 2e-3 * v) },
        { type: 'slider', id: 'cl', label: 'Capacitancia de carga C_L', min: 1e-10, max: 1e-8, value: 1e-9, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set('CL', 'c', v) }
      ],
      outs: [
        { id: 'vm', label: 'Umbral lógico V_M (teórico)', hl: true, fn: (T) => { const vdd = T.net.part('VDD').p.v, r = Math.sqrt(T.net.part('MP').p.k / T.net.part('MN').p.k); return fmt((1.5 + r * (vdd - 1.5)) / (1 + r), 'V'); } },
        { id: 'pd', label: 'Potencia dinámica C·V²·f', fn: (T) => { const vdd = T.net.part('VDD').p.v; return fmt(T.net.part('CL').p.c * vdd * vdd * T.net.part('FG1').p.f, 'W'); } },
        { id: 'isc', label: 'Pico de corriente de cortocircuito (a V_M)', fn: (T) => { const vdd = T.net.part('VDD').p.v, kn = T.net.part('MN').p.k, r = Math.sqrt(T.net.part('MP').p.k / kn), vm = (1.5 + r * (vdd - 1.5)) / (1 + r); return fmt(0.5 * kn * Math.pow(Math.max(0, vm - 1.5), 2), 'A'); } }
      ]
    });
    T.setSweep({ src: 'FG1', a: 0, b: 5, n: 160, measLabel: 'out' });
  });

  /* 19.4 MOSFET como interruptor */
  EM.defineSim('c19-switch', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['table'], net: { thermalSpeed: 20 },
      hint: 'Carga de 12 V controlada por el MOSFET con la fuente conectada a tierra (conmutación de lado bajo). La puerta se excita con una tensión continua V_G a través de 100 Ω.',
      spec: CX.ce({ fet: true, q: 'IRLZ44N', vcc: 12, rc: 6, rcw: 100, rb: 100, vb: 0, re: 0.001 }),
      controls: [
        { type: 'select', id: 'm', label: 'MOSFET', options: [['IRLZ44N', 'IRLZ44N (nivel lógico, V_th = 1.7 V)'], ['IRF540N', 'IRF540N (estándar, V_th = 3.5 V)'], ['2N7000', '2N7000 (señal, 0.2 A)']], value: 'IRLZ44N', apply: (T, v) => T.set('Q1', 'model', v) },
        { type: 'slider', id: 'vg', label: 'Tensión de puerta V_G', min: 0, max: 12, step: 0.05, value: 0, unit: 'V', apply: (T, v) => T.set('VB', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de la carga R_L', min: 1, max: 100, value: 6, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('RC', 'r', v) }
      ],
      outs: [
        { id: 'id', label: 'Corriente de la carga I_D', hl: true, fn: (T) => fmt(T.m('Q1').i, 'A') },
        { id: 'vds', label: 'V_DS', fn: (T) => fmt(T.m('Q1').vds, 'V') },
        { id: 'rds', label: 'R_DS efectiva = V_DS / I_D', fn: (T) => { const e = T.m('Q1'); return e.i > 1e-4 ? fmt(e.vds / e.i, 'Ω') : '∞'; } },
        { id: 'p', label: 'Potencia disipada en el MOSFET', hl: true, fn: (T) => fmt(Math.abs(T.m('Q1').vds * T.m('Q1').i), 'W') },
        { id: 'pl', label: 'Potencia entregada a la carga', fn: (T) => fmt(T.net.part('RC').p.r * Math.pow(T.m('Q1').i, 2), 'W') },
        { id: 'tj', label: 'Temperatura de la unión', fn: (T) => { const r = T.net.rt.Q1; return r && r.T ? Math.round(r.T) + ' °C' : '—'; } },
        { id: 'st', label: 'Estado', fn: (T) => (T.net.part('Q1').dead ? '<b style="color:var(--warn-ink)">destruido</b>' : 'correcto') }
      ]
    });
  });

  /* 19.5 Amplificador de fuente común */
  EM.defineSim('c19-cs', function (sim) {
    const dcn = (T) => { const k = JSON.stringify(T.net.doc.parts.map((q) => q.p)); if (!T._dc || T._dc.k !== k) T._dc = { k, n: EM.Panels.tempNet(T) }; return T._dc.n; };
    const op = (T) => { const n = dcn(T), m = MOD.MOS[T.net.part('Q1').p.model], e = n.cir.els.find((x) => x.type === 'M'); return { id: Math.abs(n.iPart(n.part('Q1'))), vov: e.vgs - m.vth, k: m.k, vgs: e.vgs }; };
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope', 'bode'], tdiv: 5e-4,
      hint: 'Amplificador de fuente común con polarización por divisor y R_S desacoplada. La puerta no toma corriente: R_in es el paralelo de R₁ y R₂.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ fet: true, mode: 'ce', amp: 0.05, rl: 10000 }),
      controls: [
        { type: 'seg', id: 'ce', label: 'Desacoplo de la fuente C_S', options: [['con', 'Con C_S'], ['sin', 'Sin C_S']], value: 'con', apply: (T, v) => T.set('CE', 'c', v === 'con' ? 100e-6 : 1e-15) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.005, max: 1, value: 0.05, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'rl', label: 'Resistor de carga R_L', min: 500, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i && i.pp > 1e-5 ? EM.fix(o.pp / i.pp, 1) : '—'; } },
        { id: 'avt', label: 'Ganancia teórica', fn: (T) => { const q = op(T), gm = q.k * q.vov, RD = T.net.part('RC').p.r, RL = T.net.part('RL').p.r, RS = T.net.part('RE').p.r; const by = T.net.part('CE').p.c > 1e-6; return EM.fix(-gm * par(RD, RL) / (by ? 1 : 1 + gm * RS), 1); } },
        { id: 'id', label: 'Corriente de reposo I_D', fn: (T) => fmt(op(T).id, 'A') },
        { id: 'gm', label: 'g_m = k·V_ov', fn: (T) => fmt(op(T).k * op(T).vov, 'S') },
        { id: 'rin', label: 'Resistencia de entrada', fn: (T) => fmt(par(T.net.part('R1').p.r, T.net.part('R2').p.r), 'Ω') }
      ]
    });
    T.setBode(10, 1e7);
  });
})();
