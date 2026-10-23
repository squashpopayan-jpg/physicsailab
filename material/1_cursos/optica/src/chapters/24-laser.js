/* Capítulo 24 — El láser */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 24.1 Equilibrio térmico */
  EM.defineSim('einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura', min: 3, max: 10000, log: true, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('ll', { label: 'log₁₀ de la longitud de onda (m)', min: -7, max: -1, step: 0.01, value: Math.log10(632.8e-9), fmt: (v) => v.toFixed(2) });
    sim.out('r', 'Estimulada / espontánea = N₂/N₁', { hl: true });
    sim.out('AB', 'A₂₁/B₂₁ = 8πhν³/c³');
    sim.out('l', 'Longitud de onda');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = Math.pow(10, p.ll), nu = OP.c / lam;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xlog: true, ylog: true, xmin: 1e-7, xmax: 0.1, ymin: 1e-30, ymax: 1e4, xlabel: 'longitud de onda (m)', ylabel: 'emisión estimulada / espontánea' });
      pl.frame();
      pl.band(380e-9, 780e-9, { color: '--gold', alpha: 0.15 });
      for (const [T, c] of [[300, '--c1'], [5772, '--c2']]) pl.fn((l) => OP.stimRatio(OP.c / l, T), { color: c, width: 1.4, dash: [5, 4] });
      pl.fn((l) => OP.stimRatio(OP.c / l, p.T), { color: '--accent', width: 2.4 });
      pl.hline(1, { color: '--ink-3', label: 'iguales', labelRight: true });
      pl.dot(lam, OP.stimRatio(nu, p.T), { color: '--c2', r: 6 });
      pl.legend([{ label: '300 K', color: '--c1', dash: [5, 4] }, { label: 'superficie del Sol', color: '--c2', dash: [5, 4] }, { label: 'temperatura elegida', color: '--accent' }], 'tr');
      sim.set('r', EM.sci(OP.stimRatio(nu, p.T), 3));
      sim.set('AB', EM.sci(OP.einsteinAB(nu), 3) + ' J s m⁻³');
      sim.set('l', EM.si(lam, 'm', 3));
    });
  });

  /* 24.2 Ecuaciones de tasa */
  EM.defineSim('tasas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('r', { label: 'Bombeo relativo al umbral r', min: 0.2, max: 5, step: 0.01, value: 2.5, fmt: (v) => v.toFixed(2) });
    sim.slider('lt', { label: 'log₁₀(τ_c/τ₂)', min: -4, max: -1, step: 0.01, value: -2, fmt: (v) => v.toFixed(2) });
    sim.out('st', 'Estado estacionario', { hl: true });
    sim.out('w', 'Período de las oscilaciones de relajación');
    let key = '', run = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, tau = Math.pow(10, p.lt);
      EM.draw.clear(cv);
      const k = p.r + ',' + p.lt;
      if (k !== key) { key = k; run = OP.rateRun(p.r, tau, 1e-7, 12, Math.min(2e-4, tau / 20)); }
      const o = run.out, smax = Math.max(1e-3, ...o.map((q) => q[2]));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 12, ymin: 0, ymax: Math.max(2, p.r) * 1.1, xlabel: 't / τ₂ (vidas del nivel superior)', ylabel: 'inversión n · fotones s (escalados)' });
      pl.frame();
      pl.path(o.map((q) => [q[0], q[1]]), { color: '--c1', width: 2 });
      pl.path(o.map((q) => [q[0], (q[2] / smax) * Math.max(2, p.r)]), { color: '--c2', width: 1.6 });
      pl.hline(1, { color: '--ink-3', label: 'umbral', labelRight: true });
      pl.legend([{ label: 'inversión n', color: '--c1' }, { label: 'fotones s (normalizados)', color: '--c2' }], 'tr');
      const pp = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: 0, xmax: 5, ymin: 0, ymax: 4.2, xlabel: 'bombeo r', ylabel: 'fotones s (estacionario)' });
      pp.frame();
      pp.fn((r) => OP.rateSteady(r).s, { color: '--accent', width: 2.4 });
      pp.dot(p.r, OP.rateSteady(p.r).s, { color: '--c2', r: 6 });
      const ss = OP.rateSteady(p.r), rel = p.r > 1 ? OP.relaxation(p.r, tau) : null;
      sim.set('st', p.r > 1 ? 'n = 1 (ganancia fija), s = r − 1 = ' + EM.fix(ss.s, 3) : 'por debajo del umbral: s ≈ 0, n = r');
      sim.set('w', rel && isFinite(rel.w) && rel.w > 0 ? EM.fix((2 * Math.PI) / rel.w, 3) + ' τ₂' : '— (sobreamortiguado o bajo el umbral)');
    });
  });

  /* 24.3 Modos longitudinales */
  EM.defineSim('modos-long', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('L', { label: 'Longitud de la cavidad', min: 5, max: 150, step: 0.5, value: 30, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('g0', { label: 'Ganancia del pico / pérdidas', min: 0.5, max: 3, step: 0.01, value: 1.6, fmt: (v) => v.toFixed(2) });
    sim.out('fsr', 'Separación de modos c/2L', { hl: true });
    sim.out('n', 'Modos que oscilan');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const fsr = OP.c / (2 * p.L / 100) / 1e9, dD = 1.51; /* GHz; ancho Doppler del neón */
      const gain = (f) => p.g0 * Math.exp(-4 * Math.LN2 * Math.pow(f / dD, 2));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -2.5, xmax: 2.5, ymin: 0, ymax: Math.max(1.2, p.g0) * 1.15, xlabel: 'desintonía respecto del centro de la línea (GHz)', ylabel: 'ganancia / pérdidas' });
      pl.frame();
      pl.fn(gain, { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.1 });
      pl.hline(1, { color: '--c2', label: 'pérdidas', labelRight: true });
      let n = 0;
      const off = 0.13 * fsr;
      for (let k = -40; k <= 40; k++) { const f = k * fsr + off; if (f < -2.5 || f > 2.5) continue; const on = gain(f) > 1; if (on) n++; pl.ctx.strokeStyle = EM.col(on ? '--c3' : '--ink-3'); pl.ctx.lineWidth = on ? 3 : 1; pl.ctx.beginPath(); pl.ctx.moveTo(pl.X(f), pl.Y(0)); pl.ctx.lineTo(pl.X(f), pl.Y(on ? gain(f) : 0.25)); pl.ctx.stroke(); }
      sim.set('fsr', EM.fix(fsr * 1000, 1) + ' MHz');
      sim.set('n', String(n));
    });
  });

  /* 24.4 Amarre de modos */
  EM.defineSim('amarre', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('N', { label: 'Número de modos', min: 2, max: 60, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.seg('ph', { label: 'Fases', options: [['lock', 'Amarradas'], ['rand', 'Al azar']], value: 'lock' });
    sim.out('w', 'Ancho de los pulsos (≈ T/N)', { hl: true });
    sim.out('pk', 'Pico / intensidad media');
    let phases = null, seed = 1;
    sim.button('Nuevas fases al azar', () => { seed++; phases = null; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = p.N;
      EM.draw.clear(cv);
      if (!phases || phases.length !== 60) { const r = OP.rng(seed); phases = Array.from({ length: 60 }, () => 2 * Math.PI * r()); }
      const I = (t) => { let re = 0, im = 0; for (let k = 0; k < N; k++) { const ph = p.ph === 'lock' ? 0 : phases[k], a = 2 * Math.PI * (k - (N - 1) / 2) * t + ph; re += Math.cos(a); im += Math.sin(a); } return (re * re + im * im) / N; };
      let mx = 0; for (let t = 0; t <= 3; t += 0.0005) mx = Math.max(mx, I(t));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(4, mx) * 1.08, xlabel: 'tiempo (en períodos de ida y vuelta 2L/c)', ylabel: 'intensidad / media' });
      pl.frame();
      pl.fn(I, { color: '--accent', width: 1.8, n: 3000 });
      pl.hline(1, { color: '--ink-3' });
      sim.set('w', p.ph === 'lock' ? EM.fix(1 / N, 3) + ' T' : 'no hay pulsos definidos');
      sim.set('pk', EM.fix(mx, 1) + (p.ph === 'lock' ? ' (= N)' : ''));
    });
  });
})();
