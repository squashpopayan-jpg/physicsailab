/* Capítulo 16 — Arrastre y sustentación */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;
  const AIR = { mar: ['Nivel del mar (15 °C)', 1.225, 1.789e-5], pop: ['Popayán (19 °C)', FL.POP.rho, 1.81e-5] };

  /* 16.1 Curva de arrastre */
  EM.defineSim('cd-esfera', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('Re', { label: 'Número de Reynolds', min: 0.05, max: 1e6, step: 0, value: 1e4, log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('cd', '<i>C</i><sub>D</sub> esfera (Morrison)', { hl: true });
    sim.out('cmp', 'White · Clift–Gauvin · Stokes');
    sim.out('cy', '<i>C</i><sub>D</sub> cilindro (White)');
    sim.out('reg', 'Régimen de la esfera');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.05, xmax: 1e6, ymin: 0.05, ymax: 600, xlog: true, ylog: true, xlabel: 'Re = ρVD/μ', ylabel: 'C_D' });
      pl.frame();
      pl.band(2e5, 1e6, { color: '--c2', alpha: 0.06 });
      pl.fn((r) => 24 / r, { color: '--ink-3', width: 1.2, dash: [5, 4], to: 30 });
      pl.fn((r) => FL.cdSphere(r, 'white'), { color: '--c3', width: 1.4, dash: [6, 3], to: 2e5 });
      pl.fn((r) => FL.cdSphere(r, 'clift'), { color: '--c5', width: 1.4, dash: [2, 3], to: 3e5 });
      pl.fn((r) => FL.cdCyl(r), { color: '--c4', width: 2, from: 1, to: 2e5 });
      pl.fn((r) => FL.cdSphere(r), { color: '--accent', width: 2.6 });
      pl.dot(p.Re, FL.cdSphere(p.Re), { color: '--accent', r: 6 });
      pl.legend([{ label: 'esfera: Morrison (2013)', color: '--accent' }, { label: 'esfera: White', color: '--c3', dash: [6, 3] }, { label: 'esfera: Clift–Gauvin', color: '--c5', dash: [2, 3] }, { label: 'Stokes 24/Re', color: '--ink-3', dash: [5, 4] }, { label: 'cilindro: White', color: '--c4' }], 'tr');
      pl.label(3e5, 0.3, 'crisis', { size: 11, color: '--c2', align: 'center' });
      const R = p.Re;
      sim.set('cd', EM.fix(FL.cdSphere(R), 4));
      sim.set('cmp', (R <= 2e5 ? EM.fix(FL.cdSphere(R, 'white'), 4) : '—') + ' · ' + EM.fix(FL.cdSphere(R, 'clift'), 4) + ' · ' + EM.fix(24 / R, 4));
      sim.set('cy', R >= 1 && R <= 2e5 ? EM.fix(FL.cdCyl(R), 4) : 'fuera del rango del ajuste');
      sim.set('reg', R < 1 ? 'Stokes: sin separación' : R < 20 ? 'flujo adherido, estela simétrica' : R < 400 ? 'anillo de recirculación estacionario detrás' : R < 2e5 ? 'separación laminar, desprendimiento de vórtices' : R < 6e5 ? 'crisis de arrastre: la capa límite transita' : 'supercrítico');
    });
  });

  /* 16.2 Velocidad terminal */
  const OBJ = {
    gota1: ['Gota de lluvia 1 mm', 0.001, 998.2, null, 4.03], gota2: ['Gota de lluvia 2 mm', 0.002, 998.2, null, 6.49], gota4: ['Gota de lluvia 4 mm', 0.004, 998.2, null, 8.83],
    gran1: ['Granizo 1 cm', 0.01, 900, null, null], gran2: ['Granizo 2 cm', 0.02, 900, null, null], squash: ['Pelota de squash', 0.04, 0.024 / ((Math.PI * 0.04 ** 3) / 6), null, null],
    ping: ['Pelota de ping-pong', 0.04, 0.0027 / ((Math.PI * 0.04 ** 3) / 6), null, null], futbol: ['Balón de fútbol', 0.22, 0.43 / ((Math.PI * 0.22 ** 3) / 6), null, null],
    para: ['Paracaidista en caída libre (80 kg, C_DA = 0.7 m²)', null, null, [80, 0.7], null], parac: ['Paracaídas abierto (80 kg, C_DA = 35 m²)', null, null, [80, 35], null]
  };
  EM.defineSim('velocidad-terminal', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('o', { label: 'Objeto', options: Object.entries(OBJ).map(([k, v]) => [k, v[0]]), value: 'gota2' });
    sim.seg('s', { label: 'Lugar', options: Object.entries(AIR).map(([k, v]) => [k, v[0]]), value: 'mar' });
    sim.out('vt', 'Velocidad terminal', { hl: true });
    sim.out('t95', 'Tiempo y distancia para llegar al 95 %');
    sim.out('Re', 'Reynolds terminal · <i>C</i><sub>D</sub>');
    sim.out('gk', 'Medición de Gunn y Kinzer (1949)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, o = OBJ[p.o], [, rho, mu] = AIR[p.s];
      EM.draw.clear(cv);
      let acc, vt, Re = null, cd = null;
      if (o[3]) { const [m, CdA] = o[3]; acc = (v) => g - (0.5 * rho * CdA * v * v) / m; vt = Math.sqrt((2 * m * g) / (rho * CdA)); }
      else {
        const d = o[1], rp = o[2], V = (Math.PI * d * d * d) / 6, A = (Math.PI * d * d) / 4, m = rp * V;
        acc = (v) => ((rp - rho) * g * V - 0.5 * rho * v * v * A * FL.cdSphere(Math.max(1e-9, (rho * v * d) / mu))) / m;
        vt = FL.vTerminal(d, rp, rho, mu); Re = (rho * vt * d) / mu; cd = FL.cdSphere(Re);
      }
      let y = [0, 0], t = 0; const pts = [[0, 0]]; let t95 = null, x95 = null;
      const dt = Math.max(1e-4, vt / g / 400);
      for (let i = 0; i < 4000; i++) { y = FL.rk4((tt, q) => [acc(q[0]), q[0]], t, y, dt); t += dt; pts.push([t, y[0]]); if (t95 === null && y[0] >= 0.95 * vt) { t95 = t; x95 = y[1]; } if (t > 6 * (vt / g) + 0.5 && t95 !== null) break; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: t, ymin: 0, ymax: vt * 1.15, xlabel: 't (s)', ylabel: 'v (m/s)' });
      pl.frame();
      pl.fn((tt) => g * tt, { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.path(pts, { color: '--accent', width: 2.6 });
      pl.hline(vt, { color: '--c2', label: 'terminal' });
      if (o[4]) pl.hline(o[4], { color: '--c3', label: 'Gunn y Kinzer', labelRight: true });
      sim.set('vt', EM.fix(vt, 2) + ' m/s = ' + EM.fix(vt * 3.6, 1) + ' km/h');
      sim.set('t95', EM.fix(t95, 2) + ' s · ' + EM.fix(x95, 2) + ' m');
      sim.set('Re', Re ? EM.sci(Re, 3) + ' · ' + EM.fix(cd, 3) : '—');
      sim.set('gk', o[4] ? EM.fix(o[4], 2) + ' m/s al nivel del mar' + (p.o === 'gota4' ? ' (la gota se aplasta)' : '') : '—');
    });
  });

  /* 16.3 Estela de un cilindro con Lattice Boltzmann */
  EM.defineSim('estela-cilindro', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Re', { label: 'Número de Reynolds', min: 20, max: 200, step: 5, value: 100, fmt: (v) => v.toFixed(0) });
    sim.seg('v', { label: 'Mostrar', options: [['w', 'Vorticidad'], ['s', 'Rapidez']], value: 'w' });
    sim.out('St', 'Número de Strouhal medido', { hl: true });
    sim.out('st', 'Estado de la estela');
    sim.out('n', 'Pasos de la red');
    const nx = 200, ny = 70, D = 10, U = 0.1, cx = 40, cy = 35;
    let L, w, sp, probe;
    const reset = () => {
      L = new FL.LBM(nx, ny, { mode: 'tunnel', U, nu: (U * D) / sim.p.Re, Cs: sim.p.Re > 120 ? 0.06 : 0 });
      L.addDisk(cx, cy + 0.5, D / 2);
      L.init(U, 0, (i, j) => [U, i > cx && i < cx + 4 * D ? 0.015 * Math.sin((Math.PI * (i - cx)) / (2 * D)) : 0]);
      w = new Float32Array(nx * ny); sp = new Float32Array(nx * ny); probe = [];
    };
    reset();
    sim.onChange = (id) => { if (id === 'Re') reset(); };
    sim.resetButton(reset);
    sim.animate(() => {
      const t0 = performance.now(); let k = 0;
      do { L.step(); k++; probe.push(L.uy[cy * nx + cx + 3 * D] / U); if (probe.length > 6000) probe.shift(); } while (performance.now() - t0 < 10 && k < 16);
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = { x: 0, y: 0, w: Wc, h: H * 0.72 };
      if (sim.p.v === 'w') { L.curl(w); EM.flow.paint(ctx, w, nx, ny, r, EM.flow.vortMap((2 * U) / D), { mask: L.solid }); }
      else { for (let k = 0; k < nx * ny; k++) sp[k] = Math.hypot(L.ux[k], L.uy[k]); EM.flow.paint(ctx, sp, nx, ny, r, EM.flow.speedMap(1.6 * U), { mask: L.solid }); }
      const pr = [(cx + 3 * D) * (Wc / nx), r.h - cy * (r.h / ny)];
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(pr[0], pr[1], 3, 0, 7); ctx.stroke();
      const n = probe.length, last = probe.slice(-3000);
      const pl = new EM.Plot(ctx, { x: 0, y: r.h + 2, w: Wc, h: H - r.h - 2, xmin: 0, xmax: 3000, ymin: -0.8, ymax: 0.8, xlabel: '', ylabel: 'v/U', mb: 14, mt: 6, xticks: [] });
      pl.frame();
      pl.xy(last.map((_, i) => i), last, { color: '--accent', width: 1.4 });
      /* solo la ventana final, después del transitorio inicial */
      const cr = []; for (let i = 1; i < last.length; i++) if (last[i - 1] < 0 && last[i] >= 0) cr.push(i);
      let amp = 0; for (const v of last) amp = Math.max(amp, Math.abs(v));
      const St = L.steps > 5000 && cr.length >= 3 && amp > 0.02 ? D / (U * ((cr[cr.length - 1] - cr[0]) / (cr.length - 1))) : null;
      sim.set('St', St ? EM.fix(St, 3) : L.steps <= 5000 ? '— (esperando el régimen periódico)' : '— (sin oscilación)');
      sim.set('st', amp > 0.02 ? 'desprendimiento periódico de vórtices' : L.steps < 3000 ? 'transitorio inicial…' : 'estela estacionaria con dos remolinos');
      sim.set('n', String(L.steps));
    });
  });

  /* 16.4 Polar de un ala */
  EM.defineSim('perfil-alar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('al', { label: 'Ángulo de ataque α', min: -6, max: 22, step: 0.1, value: 5, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('AR', { label: 'Alargamiento <i>AR</i> = <i>b</i>²/<i>S</i>', min: 3, max: 30, step: 0.5, value: 7.5, fmt: (v) => v.toFixed(1) });
    sim.slider('a0', { label: 'Ángulo de sustentación nula α₀ (curvatura)', min: -5, max: 0, step: 0.1, value: -2, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('cd0', { label: 'Arrastre parásito <i>C</i><sub>D0</sub>', min: 0.006, max: 0.05, step: 0.001, value: 0.027, fmt: (v) => v.toFixed(3) });
    sim.slider('m', { label: 'Masa del avión', min: 300, max: 5000, step: 10, value: 1100, unit: 'kg', fmt: (v) => v.toFixed(0) });
    sim.slider('S', { label: 'Área alar', min: 8, max: 60, step: 0.1, value: 16.2, unit: 'm²', fmt: (v) => v.toFixed(1) });
    sim.seg('s', { label: 'Aeropuerto', options: Object.entries(AIR).map(([k, v]) => [k, v[0]]), value: 'mar' });
    sim.out('cl', '<i>C</i><sub>L</sub> · <i>C</i><sub>D</sub> · <i>L</i>/<i>D</i>', { hl: true });
    sim.out('ld', 'Eficiencia máxima <i>L</i>/<i>D</i>');
    sim.out('vs', 'Velocidad de pérdida');
    const e = 0.85, as = 14;
    const model = (al, p) => {
      const a = (2 * Math.PI) / (1 + (2 * Math.PI) / (Math.PI * e * p.AR)), rad = Math.PI / 180;
      const clmax = a * (as - p.a0) * rad;
      let cl = a * (al - p.a0) * rad, post = 0;
      if (al > as) { const d = al - as; cl = clmax * (1 - 0.45 * (1 - Math.exp(-d / 3))); post = 0.025 * d; }
      return { cl, cd: p.cd0 + (cl * cl) / (Math.PI * e * p.AR) + post, clmax };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, rho = AIR[p.s][1];
      EM.draw.clear(cv);
      const M = model(p.al, p);
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: Wc / 2, h: H, xmin: -6, xmax: 22, ymin: -0.6, ymax: 2.0, xlabel: 'α (°)', ylabel: 'C_L' });
      p1.frame();
      p1.fn((a) => 2 * Math.PI * (a - p.a0) * (Math.PI / 180), { color: '--ink-3', width: 1.2, dash: [4, 4], to: 18 });
      p1.fn((a) => model(a, p).cl, { color: '--accent', width: 2.6 });
      p1.dot(p.al, M.cl, { color: '--accent', r: 6 });
      p1.vline(as, { color: '--c2', label: 'pérdida (ilustrativa)' });
      const p2 = new EM.Plot(ctx, { x: Wc / 2, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: 0.4, ymin: -0.6, ymax: 2.0, xlabel: 'C_D', ylabel: 'C_L' });
      p2.frame();
      const as_ = EM.M.linspace(-6, 22, 200);
      p2.xy(as_.map((a) => model(a, p).cd), as_.map((a) => model(a, p).cl), { color: '--c1', width: 2.4 });
      p2.dot(M.cd, M.cl, { color: '--accent', r: 6 });
      let best = 0, ab = 0; for (const a of as_) { const q = model(a, p); if (q.cl / q.cd > best) { best = q.cl / q.cd; ab = a; } }
      const qb = model(ab, p); p2.arrow(0, 0, qb.cd * 1.0, qb.cl * 1.0, { color: '--c3', width: 1.2, dash: [4, 3] });
      const vs = Math.sqrt((2 * p.m * g) / (rho * p.S * M.clmax));
      sim.set('cl', EM.fix(M.cl, 3) + ' · ' + EM.fix(M.cd, 4) + ' · ' + EM.fix(M.cl / M.cd, 1));
      sim.set('ld', EM.fix(best, 1) + ' a α = ' + EM.fix(ab, 1) + '°');
      sim.set('vs', EM.fix(vs, 1) + ' m/s = ' + EM.fix(vs * 3.6, 0) + ' km/h (C_L,max = ' + EM.fix(M.clmax, 2) + ')');
    });
  });

  /* 16.5 Efecto Magnus */
  const BALL = { squash: ['Pelota de squash', 0.024, 0.04], tenis: ['Pelota de tenis', 0.057, 0.067], futbol: ['Balón de fútbol', 0.43, 0.22], golf: ['Pelota de golf (lisa)', 0.0459, 0.0427], beisbol: ['Pelota de béisbol', 0.145, 0.0737] };
  EM.defineSim('magnus', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('b', { label: 'Pelota', options: Object.entries(BALL).map(([k, v]) => [k, v[0]]), value: 'squash' });
    sim.slider('v0', { label: 'Velocidad inicial', min: 5, max: 60, step: 0.5, value: 30, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('ang', { label: 'Ángulo de lanzamiento', min: 0, max: 60, step: 0.5, value: 20, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('spin', { label: 'Giro (positivo: retroceso o cortado; negativo: liftado)', min: -6000, max: 6000, step: 50, value: 0, unit: 'rpm', fmt: (v) => v.toFixed(0) });
    sim.seg('s', { label: 'Lugar', options: Object.entries(AIR).map(([k, v]) => [k, v[0]]), value: 'mar' });
    sim.out('R', 'Alcance (con giro · sin giro · vacío)', { hl: true });
    sim.out('h', 'Altura máxima · tiempo de vuelo');
    sim.out('S', 'Parámetro de giro inicial ω<i>r</i>/<i>V</i> · <i>C</i><sub>L</sub>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, [, m, d] = BALL[p.b], [, rho, mu] = AIR[p.s];
      EM.draw.clear(cv);
      const base = { m, d, rho, mu, v0: p.v0, ang: (p.ang * Math.PI) / 180, h0: 0.5 };
      const w = (p.spin * 2 * Math.PI) / 60;
      const T1 = FL.trajectory(Object.assign({}, base, { spin: w })), T0 = FL.trajectory(Object.assign({}, base, { spin: 0 })), Tv = FL.trajectory(Object.assign({}, base, { drag: false, magnus: false }));
      const xm = Math.max(...[T1, T0, Tv].map((T) => T[T.length - 1][0])) * 1.05, ym = Math.max(...[T1, T0, Tv].flat().map((q) => q[1])) * 1.15 + 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: xm, ymin: 0, ymax: ym, xlabel: 'x (m)', ylabel: 'y (m)' });
      pl.frame();
      pl.path(Tv.map((q) => [q[0], q[1]]), { color: '--ink-3', width: 1.2, dash: [2, 3] });
      pl.path(T0.map((q) => [q[0], q[1]]), { color: '--c1', width: 1.8, dash: [6, 4] });
      pl.path(T1.map((q) => [q[0], q[1]]), { color: '--accent', width: 2.6 });
      pl.legend([{ label: 'con giro', color: '--accent' }, { label: 'sin giro', color: '--c1', dash: [6, 4] }, { label: 'en el vacío', color: '--ink-3', dash: [2, 3] }], 'tr');
      const end = (T) => T[T.length - 1];
      const S = (Math.abs(w) * d) / 2 / p.v0;
      sim.set('R', EM.fix(end(T1)[0], 2) + ' · ' + EM.fix(end(T0)[0], 2) + ' · ' + EM.fix(end(Tv)[0], 2) + ' m');
      sim.set('h', EM.fix(Math.max(...T1.map((q) => q[1])), 2) + ' m · ' + EM.fix(end(T1)[2], 2) + ' s');
      sim.set('S', EM.fix(S, 3) + ' · ' + EM.fix(FL.clSpin(S), 3));
    });
  });
})();
