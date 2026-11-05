/* Capítulo 13 — Diodos: modelos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const K = 8.617333262e-5, VT = K * 300.15;
  const vOfI = (m, I) => m.n * VT * Math.log(I / m.Is + 1) + I * m.rs;
  const modelOf = (k) => (k === 'led' ? Object.assign({ name: 'LED rojo' }, MOD.LED.rojo) : MOD.D[k]);
  const solve = (m, Vs, R) => { let lo = 0, hi = Vs / R; for (let k = 0; k < 100; k++) { const mid = 0.5 * (lo + hi); if (vOfI(m, mid) < Vs - R * mid) lo = mid; else hi = mid; } return 0.5 * (lo + hi); };

  /* 13.1 Modelos de diodo */
  EM.defineSim('c13-modelos', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Modelos de diodo' });
    sim.group('Circuito');
    sim.select('d', { label: 'Diodo real', options: [['1N4148', '1N4148 (Si)'], ['1N5819', '1N5819 (Schottky)']], value: '1N4148' });
    sim.slider('vs', { label: 'Tensión de la fuente', min: 0.2, max: 12, step: 0.1, value: 5, unit: 'V' });
    sim.slider('r', { label: 'Resistencia en serie', min: 22, max: 10000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.out('real', 'Corriente real (Shockley + R_S)', { hl: true }); sim.out('id', 'Ideal'); sim.out('cd', 'Caída constante'); sim.out('lt', 'Lineal por tramos');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, m = modelOf(p.d), vd0 = p.d === '1N5819' ? 0.3 : 0.7, vd1 = p.d === '1N5819' ? 0.2 : 0.6, rdp = p.d === '1N5819' ? 6 : 10;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const I = { real: (V) => solve(m, V, p.r), id: (V) => V / p.r, cd: (V) => Math.max(0, (V - vd0) / p.r), lt: (V) => Math.max(0, (V - vd1) / (p.r + rdp)) };
      const ymax = Math.max(12 / p.r * 1000 * 1.05, 0.5);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: 12, ymin: 0, ymax, ml: 56, mr: 14, mt: 14, mb: 40, xlabel: 'tensión de la fuente (V)', ylabel: 'corriente (mA)' });
      pl.frame();
      const Vs = M.linspace(0, 12, 200);
      pl.xy(Vs, Vs.map((v) => I.id(v) * 1000), { color: '--ink-3', width: 1.8, dash: [6, 4] });
      pl.xy(Vs, Vs.map((v) => I.cd(v) * 1000), { color: '--c2', width: 2 });
      pl.xy(Vs, Vs.map((v) => I.lt(v) * 1000), { color: '--c3', width: 2 });
      pl.xy(Vs, Vs.map((v) => I.real(v) * 1000), { color: '--c1', width: 2.8 });
      pl.vline(p.vs, { color: '--ink-3', dash: [3, 4] });
      pl.legend([{ label: 'real', color: '--c1' }, { label: 'ideal', color: '--ink-3', kind: 'dash' }, { label: 'caída constante ' + vd0 + ' V', color: '--c2' }, { label: 'lineal por tramos', color: '--c3' }], 'tl');
      const ir = I.real(p.vs), er = (x) => (ir > 1e-9 ? ` (${x > ir ? '+' : ''}${EM.fix(100 * (x - ir) / ir, 0)} %)` : '');
      sim.set('real', fmt(ir, 'A')); sim.set('id', fmt(I.id(p.vs), 'A') + er(I.id(p.vs))); sim.set('cd', fmt(I.cd(p.vs), 'A') + er(I.cd(p.vs))); sim.set('lt', fmt(I.lt(p.vs), 'A') + er(I.lt(p.vs)));
    });
  });

  /* 13.2 Resistencia dinámica: atenuador */
  EM.defineSim('c13-dinamica', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['scope'], tdiv: 2e-4,
      probes: [{ label: 'señal (fuente)', at: 'sig', color: '#ffd84a', ac: true }, { label: 'en el diodo', at: 'out', color: '#4ae3ff', ac: true }],
      spec: {
        parts: [['V1', 'VDC', 4, 8, 0, { v: 5 }], ['R1', 'R', 10, 6, 0, { r: 4300 }], ['D1', 'D', 14, 8, 1, { model: '1N4148' }], ['C1', 'C', 20, 6, 0, { c: 1e-5, kind: 'elec', vmax: 25 }], ['R2', 'R', 26, 6, 0, { r: 1000 }], ['V2', 'VAC', 30, 8, 0, { amp: 0.01, f: 1000, rs: 0.001 }], ['No', 'LBL', 14, 4, 0, { name: 'out' }], ['Ns', 'LBL', 30, 4, 0, { name: 'sig' }]],
        wires: [['V1.0', 'R1.0'], ['R1.1', 'D1.0'], ['C1.0', [14, 6]], ['R2.0', 'C1.1'], ['R2.1', 'V2.0'], [[4, 10], [30, 10]], ['V1.1', 'gnd'], [[14, 6], [14, 4]], [[30, 6], [30, 4]]]
      },
      controls: [
        { type: 'slider', id: 'vb', label: 'Tensión de polarización', min: 0.8, max: 12, step: 0.1, value: 5, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal (pico)', min: 0.005, max: 0.5, value: 0.01, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('V2', 'amp', v) }
      ],
      outs: [
        { id: 'i', label: 'Corriente de polarización', hl: true, fn: (T) => fmt(T.i('D1'), 'A') },
        { id: 'rd', label: 'r_d = nV_T/I (n = 1.752)', fn: (T) => { const i = T.i('D1'); return i > 1e-9 ? fmt(1.752 * VT / i, 'Ω') : '∞'; } },
        { id: 'att', label: 'Atenuación medida (en el diodo / fuente)', fn: (T) => { const a = T.stat('señal (fuente)'), b = T.stat('en el diodo'); return a && b && a.pp > 0 ? EM.fix(b.pp / a.pp, 4) : '—'; } },
        { id: 'tt', label: 'Atenuación teórica (r_d ∥ 4.3 kΩ) / (1 kΩ + …)', fn: (T) => { const i = T.i('D1'), rd = 1.752 * VT / Math.max(i, 1e-9), pr = rd * 4300 / (rd + 4300); return EM.fix(pr / (1000 + pr), 4); } }
      ]
    });
  });

  /* 13.3 Curvas comparadas */
  EM.defineSim('c13-curvas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Curvas I–V de varios diodos' });
    sim.group('Condiciones');
    sim.seg('s', { label: 'Escala de corriente', options: [['log', 'Logarítmica'], ['lin', 'Lineal']], value: 'log' });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 5, value: 300, unit: 'K' });
    sim.out('a', 'V a 1 mA: 1N4148', { hl: true }); sim.out('b', '1N4007'); sim.out('c', '1N5819 (Schottky)'); sim.out('d', 'OA91 (germanio)'); sim.out('e', 'LED rojo');
    const KEYS = [['1N4148', '--c1'], ['1N4007', '--c2'], ['1N5819', '--c3'], ['OA91', '--c4'], ['led', '--c5']];
    const IsT = (m, T) => m.Is * Math.pow(T / 300.15, 3 / m.n) * Math.exp((T / 300.15 - 1) * 1.11 / (m.n * K * T));
    const vI = (m, I, T) => m.n * K * T * Math.log(I / IsT(m, T) + 1) + I * m.rs;
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, lg = p.s === 'log';
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: 2.2, ymin: lg ? 1e-9 : 0, ymax: lg ? 1 : 100, ylog: lg, ml: 64, mr: 14, mt: 14, mb: 40, xlabel: 'tensión (V)', ylabel: lg ? 'corriente (A)' : 'corriente (mA)' });
      pl.frame();
      const Is = M.linspace(-9, 0, 280).map((e) => Math.pow(10, e));
      for (const [k, col] of KEYS) { const m = modelOf(k); pl.xy(Is.map((I) => vI(m, I, p.T)), Is.map((I) => (lg ? I : I * 1000)), { color: col, width: 2.4 }); }
      pl.legend(KEYS.map(([k, col]) => ({ label: modelOf(k).name || k, color: col })), 'br');
      ['a', 'b', 'c', 'd', 'e'].forEach((id, i) => sim.set(id, EM.fix(vI(modelOf(KEYS[i][0]), 1e-3, p.T), 3) + ' V'));
    });
  });
})();
