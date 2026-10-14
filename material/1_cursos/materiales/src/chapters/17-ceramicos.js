/* Capítulo 17 — Cerámicos y vidrios */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const rnd = (k, s) => { const x = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };

  /* ======================================================================
     17.1 Flexión en tres puntos
     ====================================================================== */
  EM.defineSim('flexural-test', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('sec', { label: 'Sección', options: [['circ', 'Circular'], ['rect', 'Rectangular']], value: 'circ' });
    sim.slider('F', { label: 'Carga de fractura <i>F<sub>f</sub></i>', min: 50, max: 6000, step: 10, value: 3000, unit: 'N', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia entre apoyos <i>L</i>', min: 10, max: 80, step: 1, value: 40, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Radio <i>R</i> (o espesor <i>d</i>)', min: 1, max: 10, step: 0.1, value: 5, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: 'Ancho <i>b</i> (rectangular)', min: 2, max: 20, step: 0.5, value: 10, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('P', { label: 'Porosidad <i>P</i>', min: 0, max: 0.4, step: 0.005, value: 0, fmt: (v) => EM.fix(100 * v, 1) + ' %' });
    sim.out('s', 'Resistencia a la flexión σ<sub>fs</sub>', { hl: true });
    sim.out('E', 'Módulo de la alúmina con esa porosidad');
    sim.out('sp', 'Resistencia relativa e<sup>−nP</sup> (n = 5)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = p.L * 1e-3;
      const s = p.sec === 'circ' ? (p.F * L) / (Math.PI * Math.pow(p.R * 1e-3, 3)) : (3 * p.F * L) / (2 * p.b * 1e-3 * Math.pow(p.R * 1e-3, 2));
      /* esquema con la viga flexada y el diagrama de esfuerzos */
      const x0 = W * 0.06, x1 = W * 0.5, y0 = H * 0.42, th = Math.max(10, p.R * 4);
      const dfl = 14;
      ctx.fillStyle = EM.alpha('--c6', 0.35); ctx.strokeStyle = EM.col('--ink-2');
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, x = x0 + (x1 - x0) * u, y = y0 - th / 2 + dfl * Math.sin(Math.PI * u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      for (let i = 40; i >= 0; i--) { const u = i / 40, x = x0 + (x1 - x0) * u, y = y0 + th / 2 + dfl * Math.sin(Math.PI * u); ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const xx of [x0 + 10, x1 - 10]) { ctx.fillStyle = EM.col('--ink-2'); ctx.beginPath(); ctx.moveTo(xx, y0 + th / 2 + 4); ctx.lineTo(xx - 9, y0 + th / 2 + 20); ctx.lineTo(xx + 9, y0 + th / 2 + 20); ctx.closePath(); ctx.fill(); }
      EM.draw.arrow(ctx, (x0 + x1) / 2, y0 - th / 2 - 50, (x0 + x1) / 2, y0 - th / 2 + dfl - 4, { color: '--accent', width: 2.4 });
      EM.text(ctx, 'F', (x0 + x1) / 2 + 8, y0 - th / 2 - 40, { size: 14, italic: true, color: '--accent' });
      EM.text(ctx, 'tracción máxima en la cara inferior, al centro', (x0 + x1) / 2, y0 + th / 2 + dfl + 40, { size: 11, align: 'center', color: '--c2' });
      /* porosidad */
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 0.4, ymin: 0, ymax: 1.05, xlabel: 'porosidad P', ylabel: 'E/E₀ · σ/σ₀', ml: 46 });
      pl.frame();
      pl.fn((P) => 1 - 1.9 * P + 0.9 * P * P, { color: '--c1', width: 2.2 });
      pl.fn((P) => Math.exp(-5 * P), { color: '--c2', width: 2.2 });
      pl.dot(p.P, 1 - 1.9 * p.P + 0.9 * p.P * p.P, { color: '--c1' });
      pl.dot(p.P, Math.exp(-5 * p.P), { color: '--c2' });
      pl.legend([{ label: 'módulo', color: '--c1' }, { label: 'resistencia (n = 5)', color: '--c2' }], 'tr');
      sim.set('s', EM.fix(s / 1e6, 1) + ' MPa');
      sim.set('E', EM.fix(393 * (1 - 1.9 * p.P + 0.9 * p.P * p.P), 0) + ' GPa');
      sim.set('sp', EM.fix(Math.exp(-5 * p.P), 3));
    });
  });

  /* ======================================================================
     17.2 Weibull
     ====================================================================== */
  EM.defineSim('weibull', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('m', { label: 'Módulo de Weibull <i>m</i> (verdadero)', min: 2, max: 30, step: 0.5, value: 10, fmt: (v) => EM.fix(v, 1) });
    sim.slider('s0', { label: 'Resistencia característica σ<sub>0</sub>', min: 100, max: 800, step: 10, value: 300, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Probetas del lote', min: 5, max: 60, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('V', { label: 'Volumen relativo <i>V</i>/<i>V</i><sub>0</sub>', min: 0.1, max: 100, step: 0.1, value: 1, log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('Pf', { label: 'Probabilidad de falla de diseño', min: -8, max: -1, step: 0.5, value: -4, fmt: (v) => '10^' + v });
    sim.button('Ensayar otro lote', () => { seed++; sim.redraw(); });
    sim.out('mfit', '<i>m</i> ajustado', { hl: true });
    sim.out('s0fit', 'σ<sub>0</sub> ajustado (del volumen ensayado)');
    sim.out('mean', 'Media del lote');
    sim.out('sd', 'Esfuerzo de diseño para esa <i>P<sub>f</sub></i>');
    let seed = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const N = Math.round(p.N), sV = p.s0 * Math.pow(1 / p.V, 1 / p.m);
      const xs = Array.from({ length: N }, (_, i) => sV * Math.pow(-Math.log(1 - rnd(i + 1, seed)), 1 / p.m)).sort((a, b) => a - b);
      const F = xs.map((_, i) => MAT.medianRank(i + 1, N));
      const X = xs.map(Math.log), Y = F.map((f) => Math.log(-Math.log(1 - f)));
      const mx = X.reduce((s, v) => s + v, 0) / N, my = Y.reduce((s, v) => s + v, 0) / N;
      const m = X.reduce((s, v, i) => s + (v - mx) * (Y[i] - my), 0) / X.reduce((s, v) => s + (v - mx) ** 2, 0);
      const s0f = Math.exp(mx - my / m);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: p.s0 * 1.6, ymin: 0, ymax: 1, xlabel: 'σ (MPa)', ylabel: 'P_f', ml: 46 });
      pl.frame();
      pl.fn((s) => MAT.weibull(s, p.s0, p.m, p.V), { color: '--accent', width: 2.4 });
      pl.fn((s) => MAT.weibull(s, p.s0, p.m, 1), { color: '--grid-2', width: 1.2, dash: [4, 3] });
      xs.forEach((x, i) => pl.dot(x, F[i], { color: '--c1', r: 3.5 }));
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: Math.min(...X) - 0.15, xmax: Math.max(...X) + 0.15, ymin: Math.min(...Y) - 0.6, ymax: Math.max(...Y) + 0.6, xlabel: 'ln σ', ylabel: 'ln ln[1/(1 − P_f)]', ml: 50 });
      pr.frame();
      X.forEach((x, i) => pr.dot(x, Y[i], { color: '--c1', r: 3.5 }));
      pr.fn((x) => my + m * (x - mx), { color: '--accent', width: 2 });
      const sd = sV * Math.pow(-Math.log(1 - Math.pow(10, p.Pf)), 1 / p.m);
      sim.set('mfit', EM.fix(m, 2) + ' (verdadero ' + p.m + ')');
      sim.set('s0fit', EM.fix(s0f, 0) + ' MPa (esperado ' + EM.fix(sV, 0) + ')');
      sim.set('mean', EM.fix(xs.reduce((a, b) => a + b, 0) / N, 0) + ' MPa');
      sim.set('sd', EM.fix(sd, 0) + ' MPa = ' + EM.fix((100 * sd) / sV, 0) + ' % de σ<sub>0</sub>');
    });
  });

  /* ======================================================================
     17.3 Viscosidad de vidrios
     ====================================================================== */
  EM.defineSim('glass-viscosity', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('g', { label: 'Vidrio resaltado', options: Object.entries(MAT.glasses).map(([k, v]) => [k, v[0]]), value: 'sodalime' });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 1600, step: 5, value: 800, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('eta', 'Viscosidad a esa temperatura', { hl: true });
    sim.out('pts', 'Temperaturas de los puntos fijos (VFT)');
    sim.out('fit', 'Parámetros VFT: log η = A + B/(T − T₀)');
    const fits = {};
    for (const [k, g] of Object.entries(MAT.glasses)) fits[k] = MAT.vftFit([[g[1], 3], [g[2], Math.log10(4e6)], [g[3], 12]]);
    const cols = { sodalime: '--c1', borosil: '--c3', lead: '--c5' };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 300, xmax: 1600, ymin: 0, ymax: 18, xlabel: 'temperatura (°C)', ylabel: 'log₁₀ η (Pa·s)', ml: 50 });
      pl.frame();
      const fixed = [[1, 'fusión'], [3, 'trabajo'], [Math.log10(4e6), 'ablandamiento'], [12, 'recocido'], [Math.log10(3e13), 'deformación']];
      for (const [v, t] of fixed) pl.hline(v, { color: '--grid-2', label: t, labelRight: true });
      for (const [k, f] of Object.entries(fits)) {
        pl.fn((T) => (T > f.T0 + 5 ? MAT.vftLog(f, T) : NaN), { color: cols[k], width: k === p.g ? 2.8 : 1.4 });
        const g = MAT.glasses[k];
        pl.dot(g[4], Math.log10(3e13), { color: cols[k], r: 3.5 });
      }
      const f = fits[p.g];
      const le = MAT.vftLog(f, p.T);
      pl.dot(p.T, Math.min(17.8, le), { color: '--accent', r: 6 });
      pl.legend(Object.keys(fits).map((k) => ({ label: MAT.glasses[k][0], color: cols[k] })), 'tr');
      sim.set('eta', p.T > f.T0 ? '10^' + EM.fix(le, 2) + ' Pa·s' : 'sólido (T < T₀)');
      sim.set('pts', fixed.map(([v, t]) => t + ' ' + EM.fix(MAT.vftT(f, v), 0) + ' °C').join(' · '));
      sim.set('fit', 'A = ' + EM.fix(f.A, 3) + ', B = ' + EM.fix(f.B, 0) + ' K, T₀ = ' + EM.fix(f.T0, 0) + ' °C');
    });
  });

  /* ======================================================================
     17.4 Vidrio templado
     ====================================================================== */
  EM.defineSim('tempered-glass', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('ss', { label: 'Compresión superficial residual σ<sub>s</sub>', min: 0, max: 200, step: 5, value: 100, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sb', { label: 'Esfuerzo de flexión en la superficie', min: 0, max: 300, step: 5, value: 120, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('sf', { label: 'Resistencia de la superficie (con defectos)', min: 20, max: 100, step: 5, value: 50, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.out('tot', 'Tensión neta en la cara traccionada', { hl: true });
    sim.out('st', 'Estado');
    sim.out('max', 'Carga de flexión máxima admisible');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const res = (u) => (-p.ss * (3 * u * u - 1)) / 2, bend = (u) => p.sb * u;
      const lim = Math.max(250, p.ss + p.sb + 20);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -lim, xmax: lim, ymin: -1.1, ymax: 1.1, xlabel: 'esfuerzo (MPa) — tracción positiva', ylabel: 'posición en el espesor u', ml: 50 });
      pl.frame();
      const us = M.linspace(-1, 1, 101);
      pl.xy(us.map(res), us, { color: '--c1', width: 2, dash: [5, 4] });
      pl.xy(us.map(bend), us, { color: '--c3', width: 2, dash: [5, 4] });
      pl.xy(us.map((u) => res(u) + bend(u)), us, { color: '--accent', width: 2.8 });
      pl.vline(p.sf, { color: '--c2', label: 'resistencia superficial', dash: [] });
      pl.vline(0, { color: '--ink-3', dash: [] });
      pl.legend([{ label: 'residual (templado)', color: '--c1', dash: [5, 4] }, { label: 'flexión', color: '--c3', dash: [5, 4] }, { label: 'total', color: '--accent' }], 'tl');
      const tot = res(1) + bend(1);
      sim.set('tot', EM.fix(tot, 0) + ' MPa');
      sim.set('st', tot > p.sf ? 'se rompe' : 'resiste');
      sim.set('max', EM.fix(p.sf + p.ss, 0) + ' MPa (sin templar: ' + p.sf + ' MPa)');
    });
  });
})();
