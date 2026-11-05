/* Capítulo 12 — La unión PN */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const K = 8.617333262e-5, QE = 1.602176634e-19, ES = 11.7 * 8.854e-14, NI = 1e10;
  const VT = K * 300;

  /* 12.1 Estructura de la unión abrupta */
  EM.defineSim('c12-union', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, label: 'Unión PN: carga, campo y potencial' });
    sim.group('Dopado y polarización');
    sim.slider('NA', { label: 'Aceptores N_A (lado p)', min: 1e14, max: 1e19, value: 1e16, unit: 'cm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('ND', { label: 'Donores N_D (lado n)', min: 1e14, max: 1e19, value: 1e16, unit: 'cm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('V', { label: 'Tensión aplicada (directa +)', min: -20, max: 0.65, step: 0.05, value: 0, unit: 'V' });
    sim.out('v0', 'Potencial de contacto V₀', { hl: true }); sim.out('w', 'Anchura W'); sim.out('x', 'x_p y x_n'); sim.out('e', 'Campo máximo'); sim.out('c', 'C_j por cm²');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const V0 = VT * Math.log(p.NA * p.ND / (NI * NI)), Vb = Math.max(0.02, V0 - p.V);
      const W = Math.sqrt(2 * ES / QE * (1 / p.NA + 1 / p.ND) * Vb), xn = W * p.NA / (p.NA + p.ND), xp = W * p.ND / (p.NA + p.ND);
      const Em = QE * p.ND * xn / ES, lim = Math.max(xn, xp, 3e-5) * 1e4 * 1.5;
      const x = M.linspace(-lim, lim, 400);
      const rho = x.map((u) => { const uc = u * 1e-4; return uc < -xp ? 0 : uc < 0 ? -QE * p.NA : uc <= xn ? QE * p.ND : 0; });
      const E = x.map((u) => { const uc = u * 1e-4; return uc < -xp ? 0 : uc < 0 ? -QE * p.NA * (uc + xp) / ES : uc <= xn ? -QE * p.ND * (xn - uc) / ES : 0; });
      const phi = x.map((u) => { const uc = u * 1e-4; return uc < -xp ? 0 : uc < 0 ? QE * p.NA * (uc + xp) * (uc + xp) / (2 * ES) : uc <= xn ? Vb - QE * p.ND * (xn - uc) * (xn - uc) / (2 * ES) : Vb; });
      const hh = h / 3;
      const mk = (k, ys, yl, col, fmtY) => { const lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo || 1) * 0.12; const pl = new EM.Plot(c, { x: 0, y: k * hh, w, h: hh, xmin: -lim, xmax: lim, ymin: lo - pad, ymax: hi + pad, ml: 70, mr: 14, mt: 10, mb: k === 2 ? 36 : 8, ylabel: yl, xlabel: k === 2 ? 'posición (µm); la unión metalúrgica está en 0' : '', xfmt: k === 2 ? undefined : () => '', yfmt: fmtY }); pl.frame(); pl.xy(x, ys, { color: col, width: 2.6 }); pl.vline(0, { color: '--ink-3', dash: [3, 4] }); return pl; };
      mk(0, rho, 'ρ (C/cm³)', '--c1', (v) => EM.sci(v, 1)); mk(1, E, 'E (V/cm)', '--c2', (v) => EM.sci(v, 1)); mk(2, phi, 'φ (V)', '--c3', (v) => EM.fix(v, 2));
      sim.set('v0', EM.fix(V0, 3) + ' V'); sim.set('w', EM.fix(W * 1e4, 3) + ' µm'); sim.set('x', `${EM.fix(xp * 1e4, 3)} µm  /  ${EM.fix(xn * 1e4, 3)} µm`); sim.set('e', fmt(Em * 100, 'V/m')); sim.set('c', fmt(ES / W, 'F/cm²'));
    });
  });

  /* utilidades del diodo */
  const modelOf = (k) => (k === 'led' ? Object.assign({ name: 'LED rojo' }, MOD.LED.rojo) : MOD.D[k]);
  const IsT = (m, T) => { const n = m.n, vt = K * T; return m.Is * Math.pow(T / 300.15, 3 / n) * Math.exp((T / 300.15 - 1) * 1.11 / (n * vt)); };
  const vOfI = (m, I, T) => m.n * K * T * Math.log(I / IsT(m, T) + 1) + I * m.rs;
  const iOfV = (m, V, T) => { if (V <= 0) return 0; let lo = 0, hi = 10; for (let k = 0; k < 100; k++) { const mid = 0.5 * (lo + hi); if (vOfI(m, mid, T) < V) lo = mid; else hi = mid; } return 0.5 * (lo + hi); };

  /* 12.2 Curva I–V */
  EM.defineSim('c12-iv', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Característica I–V del diodo' });
    sim.group('Diodo');
    sim.select('d', { label: 'Modelo', options: [['1N4148', '1N4148 (señal)'], ['1N4007', '1N4007 (rectificador)'], ['1N5819', '1N5819 (Schottky)'], ['OA91', 'OA91 (germanio)'], ['led', 'LED rojo']], value: '1N4148' });
    sim.seg('s', { label: 'Escala de corriente', options: [['lin', 'Lineal'], ['log', 'Logarítmica']], value: 'log' });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 5, value: 300, unit: 'K' });
    sim.slider('v', { label: 'Tensión del cursor', min: 0.1, max: 1.2, step: 0.01, value: 0.65, unit: 'V' });
    sim.out('i', 'Corriente en el cursor', { hl: true }); sim.out('rd', 'Resistencia dinámica r_d = nV_T/I'); sim.out('v1', 'V a 1 mA'); sim.out('dec', 'Tensión por década (n V_T ln 10)'); sim.out('is', 'Corriente de saturación I_S(T)');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, m = modelOf(p.d);
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const lg = p.s === 'log';
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: 1.2, ymin: lg ? 1e-12 : 0, ymax: lg ? 1 : (m.imax || 0.2) * 1000, ylog: lg, ml: 64, mr: 14, mt: 14, mb: 40, xlabel: 'tensión (V)', ylabel: lg ? 'corriente (A)' : 'corriente (mA)' });
      pl.frame();
      const Is = M.linspace(-12, 0, 300).map((e) => Math.pow(10, e));
      const xs = Is.map((I) => vOfI(m, I, p.T)), ys = Is.map((I) => (lg ? I : I * 1000));
      pl.xy(xs, ys, { color: '--accent', width: 2.8 });
      const Ic = iOfV(m, p.v, p.T);
      if (Ic > 0) pl.dot(p.v, lg ? Math.max(Ic, 1e-12) : Ic * 1000, { color: '--c2', r: 6 });
      pl.vline(p.v, { color: '--ink-3', dash: [3, 4] });
      const vt = K * p.T;
      sim.set('i', fmt(Ic, 'A')); sim.set('rd', Ic > 1e-12 ? fmt(m.n * vt / Ic + m.rs, 'Ω') : '∞'); sim.set('v1', EM.fix(vOfI(m, 1e-3, p.T), 3) + ' V'); sim.set('dec', EM.fix(m.n * vt * Math.LN10 * 1000, 1) + ' mV'); sim.set('is', fmt(IsT(m, p.T), 'A'));
    });
  });

  /* 12.3 El diodo como termómetro */
  EM.defineSim('c12-temperatura', function (sim) {
    const vdAt = (T, model, I) => { const n = new EM.Net({ Ta: T, damage: false }); n.load(EM.Net.fromSpec(CX.ladder({ src: { id: 'I1', t: 'IDC', p: { i: I } }, items: [{ id: 'D1', t: 'D', p: { model }, mode: 'shunt', tap: 'out' }] }))); n.rebuild(); n.cir.solveDC(); return n.v(n.netInfo.labelNet.out); };
    const T = EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: [], hint: 'Corriente constante a través de un diodo; la temperatura ambiente es el parámetro.',
      spec: CX.ladder({ src: { id: 'I1', t: 'IDC', p: { i: 1e-3 } }, items: [{ id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'slider', id: 'T', label: 'Temperatura ambiente', min: -20, max: 150, step: 1, value: 25, unit: '°C', apply: (T, v) => { T.net.cfg.Ta = v; } },
        { type: 'slider', id: 'i', label: 'Corriente del diodo', min: 1e-6, max: 1e-2, value: 1e-3, unit: 'A', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('I1', 'i', v) }
      ],
      outs: [
        { id: 'v', label: 'Tensión del diodo V_D', hl: true, fn: (T) => fmt(T.v('out'), 'V') },
        { id: 's', label: 'Pendiente dV_D/dT a esta T', fn: (T) => { const t = T.net.cfg.Ta, I = T.net.part('I1').p.i; return EM.fix((vdAt(t + 5, '1N4148', I) - vdAt(t - 5, '1N4148', I)) / 10 * 1000, 2) + ' mV/K'; } },
        { id: 'd', label: 'Variación respecto de 25 °C', fn: (T) => { const I = T.net.part('I1').p.i; return EM.fix((T.v('out') - vdAt(25, '1N4148', I)) * 1000, 1) + ' mV'; } }
      ]
    });
  });

  /* 12.4 Capacitancia de la unión y varicap */
  EM.defineSim('c12-capacidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Capacitancia de unión y sintonía' });
    sim.group('Unión (varicap)');
    sim.slider('c0', { label: 'C_j0 a 0 V', min: 5, max: 200, value: 40, unit: 'pF', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0) });
    sim.slider('v0', { label: 'Potencial de contacto V₀', min: 0.4, max: 0.9, step: 0.05, value: 0.7, unit: 'V' });
    sim.slider('m', { label: 'Exponente m (½ abrupta, ⅓ gradual)', min: 0.3, max: 0.5, step: 0.01, value: 0.5 });
    sim.group('Circuito resonante');
    sim.slider('L', { label: 'Inductancia', min: 10, max: 1000, value: 100, unit: 'µH', log: true, fmt: (v) => EM.fix(v, 0) });
    sim.slider('Vr', { label: 'Tensión inversa aplicada', min: 0, max: 20, step: 0.5, value: 4, unit: 'V' });
    sim.out('cj', 'C_j a esa tensión', { hl: true }); sim.out('f', 'Frecuencia de resonancia', { hl: true }); sim.out('r', 'Margen de sintonía (0 → 20 V)');
    const Cj = (p, V) => p.c0 * 1e-12 / Math.pow(1 + V / p.v0, p.m);
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const h1 = h * 0.52;
      const p1 = new EM.Plot(c, { x: 0, y: 0, w, h: h1, xmin: 0, xmax: 20, ymin: 0, ymax: p.c0 * 1.05, ml: 62, mr: 14, mt: 12, mb: 26, ylabel: 'C_j (pF)', xfmt: () => '' });
      p1.frame(); const Vs = M.linspace(0, 20, 200); p1.xy(Vs, Vs.map((v) => Cj(p, v) * 1e12), { color: '--c1', width: 2.6 }); p1.dot(p.Vr, Cj(p, p.Vr) * 1e12, { color: '--c2', r: 6 });
      const fr = (V) => 1 / (2 * Math.PI * Math.sqrt(p.L * 1e-6 * Cj(p, V)));
      const f0 = fr(0), f20 = fr(20);
      const p2 = new EM.Plot(c, { x: 0, y: h1, w, h: h - h1, xmin: 0, xmax: 20, ymin: f0 * 0.9 / 1e6, ymax: f20 * 1.05 / 1e6, ml: 62, mr: 14, mt: 8, mb: 38, xlabel: 'tensión inversa (V)', ylabel: 'f resonancia (MHz)' });
      p2.frame(); p2.xy(Vs, Vs.map((v) => fr(v) / 1e6), { color: '--c3', width: 2.6 }); p2.dot(p.Vr, fr(p.Vr) / 1e6, { color: '--c2', r: 6 });
      sim.set('cj', fmt(Cj(p, p.Vr), 'F')); sim.set('f', fmt(fr(p.Vr), 'Hz')); sim.set('r', `${EM.fix(f0 / 1e6, 2)} → ${EM.fix(f20 / 1e6, 2)} MHz (×${EM.fix(f20 / f0, 2)})`);
    });
  });
})();
