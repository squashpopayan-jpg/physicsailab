/* Capítulo 24 — Independencia financiera */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, R = L.ret;

  /* 24.1 Años según la tasa de ahorro */
  CC.defineSim('anos-fi', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Años hasta la independencia según la tasa de ahorro' });
    sim.group('Supuestos');
    sim.slider('s', { label: 'Su tasa de ahorro', min: 0.02, max: 0.9, step: 0.01, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.slider('r', { label: 'Rentabilidad real', min: 0, max: 0.08, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.slider('w', { label: 'Tasa de retiro', min: 0.025, max: 0.06, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.slider('W0', { label: 'Patrimonio actual (años de ingreso)', min: 0, max: 10, step: 0.25, value: 0, fmt: (v) => CC.nf(v, 2) });
    sim.out('n', 'Años hasta la independencia', { hl: true });
    sim.out('meta', 'Meta (años de ingreso)');
    sim.out('s10', 'Con 10 puntos más de ahorro');
    sim.onDraw(() => {
      const { s, r, w, W0 } = sim.p;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.02, xmax: 0.9, ymin: 0, ymax: 70, xlabel: 'tasa de ahorro', ylabel: 'años hasta la independencia', xfmt: CC.pctAxis, yfmt: (v) => CC.nf(v) });
      pl.frame();
      pl.fn((x) => Math.min(80, R.fiYears(x, r, w, W0)), { color: '--c1', width: 2.6, from: 0.02 });
      pl.fn((x) => Math.min(80, R.fiYears(x, 0, w, W0)), { color: '--c6', width: 1.6, dash: [5, 4], from: 0.02 });
      const n = R.fiYears(s, r, w, W0);
      pl.dot(s, Math.min(69, n), { color: '--accent', r: 6, label: `${CC.nf(n, 1)} años` });
      pl.legend([{ label: `con ${CC.pct(r, 1)} real`, color: '--c1' }, { label: 'sin rendimientos', color: '--c6', dash: [5, 4] }], 'tr');
      sim.set('n', CC.yrs(n));
      sim.set('meta', CC.nf((1 - s) / w, 1) + ' años de ingreso');
      sim.set('s10', s + 0.1 < 1 ? CC.yrs(R.fiYears(s + 0.1, r, w, W0)) : '—');
    });
  });

  /* 24.2 El gasto pesa doble */
  CC.defineSim('gasto-doble', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, label: 'Años hasta la independencia en tres escenarios' });
    sim.group('Hogar');
    sim.slider('Y', { label: 'Ingreso neto mensual', min: 1500000, max: 30000000, step: 100000, value: 5000000, fmt: CC.copS });
    sim.slider('G', { label: 'Gasto mensual', min: 1000000, max: 30000000, step: 100000, value: 4000000, fmt: CC.copS });
    sim.slider('d', { label: 'Cambio a evaluar', min: 0.02, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => CC.pct(v, 0) });
    sim.slider('r', { label: 'Rentabilidad real', min: 0, max: 0.08, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.out('b', 'Hoy');
    sim.out('i', 'Ingreso más alto, mismo gasto');
    sim.out('g', 'Gasto más bajo, mismo ingreso', { hl: true });
    sim.out('ig', 'Ingreso más alto y el aumento se gasta');
    sim.onDraw(() => {
      const { Y, G, d, r } = sim.p;
      const yrs = (inc, gas) => (inc > gas ? R.fiYears((inc - gas) / inc, r, 0.04) : Infinity);
      const v = [['hoy', yrs(Y, G), '--c6'], [`ingreso +${CC.pct(d, 0)}`, yrs(Y * (1 + d), G), '--c1'], [`gasto −${CC.pct(d, 0)}`, yrs(Y, G * (1 - d)), '--c3'], ['aumento gastado', yrs(Y * (1 + d), G + Y * d), '--c2']];
      CC.draw.clear(cv);
      const fin = v.map((x) => (isFinite(x[1]) ? x[1] : 0));
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: 3.6, ymin: 0, ymax: Math.max(10, ...fin) * 1.2, xticks: [], ylabel: 'años', yfmt: (x) => CC.nf(x), mb: 30 });
      pl.frame();
      pl.bars([0, 1, 2, 3], fin, { colors: v.map((x) => x[2]), w: 0.6, labels: true, fmt: (x) => (x > 0 ? CC.nf(x, 1) : 'nunca') });
      v.forEach(([n], k) => CC.text(cv.ctx, n, pl.X(k), pl.iy + pl.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      const f = (x) => (isFinite(x) ? CC.yrs(x) : 'nunca (gasta todo)');
      sim.set('b', f(v[0][1]));
      sim.set('i', f(v[1][1]));
      sim.set('g', f(v[2][1]));
      sim.set('ig', f(v[3][1]));
    });
  });

  /* 24.3 Independencia por inercia */
  CC.defineSim('coast-fi', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Capital necesario hoy según los años hasta el retiro' });
    sim.group('Meta');
    sim.slider('G', { label: 'Gasto mensual en el retiro (pesos de hoy)', min: 1e6, max: 30e6, step: 100000, value: 3333333, fmt: CC.copS });
    sim.slider('w', { label: 'Tasa de retiro', min: 0.025, max: 0.06, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.slider('n', { label: 'Años hasta el retiro', min: 1, max: 45, step: 1, value: 25, fmt: (v) => CC.nf(v) });
    sim.slider('r', { label: 'Rentabilidad real', min: 0, max: 0.08, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.slider('W', { label: 'Su ahorro actual', min: 0, max: 2000e6, step: 5e6, value: 100e6, fmt: CC.copS });
    sim.out('m', 'Meta al retirarse');
    sim.out('c', 'Necesario hoy para llegar por inercia', { hl: true });
    sim.out('f', 'Le falta');
    sim.onDraw(() => {
      const meta = (12 * sim.p.G) / sim.p.w, n = Math.round(sim.p.n);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 45, ymin: 0, ymax: meta * 1.08, xlabel: 'años hasta el retiro', ylabel: 'capital necesario hoy', yfmt: CC.copAxis, ml: 80 });
      pl.frame();
      pl.fn((t) => R.coast(meta, sim.p.r, t), { color: '--c1', width: 2.6 });
      pl.hline(sim.p.W, { color: '--c3', label: 'su ahorro actual', dash: [5, 4] });
      pl.dot(n, R.coast(meta, sim.p.r, n), { color: '--accent', r: 6 });
      const c = R.coast(meta, sim.p.r, n);
      sim.set('m', CC.copS(meta));
      sim.set('c', CC.copS(c));
      sim.set('f', sim.p.W >= c ? '<span class="gain">ya llegó: puede dejar de aportar</span>' : CC.copS(c - sim.p.W));
    });
  });
})();
