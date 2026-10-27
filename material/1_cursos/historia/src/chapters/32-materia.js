/* Capítulo 32 — Materia condensada, transistor y láser */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 32.1 Kronig–Penney */
  EM.defineSim('kronig-penney', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P', { label: 'Opacidad de las barreras P', min: 0.1, max: 15, step: 0.1, value: 4.7, fmt: (v) => v.toFixed(1) });
    sim.out('b1', 'Ancho de la primera banda permitida', { hl: true });
    sim.out('g1', 'Brecha prohibida entre la primera y la segunda banda');
    sim.note('Un electrón en un potencial periódico (una cadena de barreras delgadas) tiene energías permitidas solo cuando \\(|\\cos\\alpha a+P\\sen\\alpha a/\\alpha a|\\le1\\). Esas zonas (azul) son las <em>bandas</em>; entre ellas hay brechas prohibidas. Si \\(P\\to0\\) se recuperan los electrones libres; si \\(P\\to\\infty\\) las bandas se estrechan hasta ser los niveles de un solo pozo. Si la última banda ocupada está llena, el cristal es aislante (o semiconductor, si la brecha es pequeña); si está a medias, es metal. Eso es lo que Wilson explicó en 1931.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, amax = 4 * PI;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: amax, ymin: -4, ymax: 4, xlabel: 'α a', ylabel: 'cos αa + P sen αa/αa' });
      pl.frame(); pl.hline(1, { color: '--c3' }); pl.hline(-1, { color: '--c3' });
      const bands = C.kpBands(p.P, amax);
      bands.forEach((b) => pl.band(Math.sqrt(b[0]), Math.sqrt(b[1]), { color: '--c1', alpha: 0.2 }));
      pl.fn((a) => C.kpF(a, p.P), { color: '--c1', width: 2.2, from: 0.001 });
      const x0 = W * 0.66, y0 = 20, hh = H - 50, E = amax * amax;
      EM.text(ctx, 'bandas de energía', x0, y0 - 4, { size: 11, color: '--ink-2' });
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(x0, y0, 2, hh);
      bands.forEach((b) => { const ya = y0 + hh - (b[1] / E) * hh, yb = y0 + hh - (b[0] / E) * hh; ctx.fillStyle = EM.col('--c1'); ctx.fillRect(x0 + 6, ya, 60, Math.max(2, yb - ya)); });
      EM.text(ctx, 'energía', x0 + 70, y0 + hh * 0.5, { size: 10.5, color: '--ink-2' });
      const g = bands.length > 1 ? bands[1][0] - bands[0][1] : NaN;
      sim.set('b1', bands.length ? EM.fix(bands[0][1] - bands[0][0], 3) + ' (unidades de ħ²/2ma²)' : '—'); sim.set('g1', isNaN(g) ? '—' : EM.fix(g, 3));
    });
  });

  /* 32.2 Ley de Moore */
  EM.defineSim('ley-moore', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Tiempo de duplicación supuesto', min: 1, max: 3, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) + ' años' });
    sim.check('fit', { label: 'Mostrar la regresión a los datos', value: true });
    sim.out('t', 'Tiempo de duplicación ajustado a los datos', { hl: true });
    sim.out('p', 'Transistores previstos en 2030 con el tiempo supuesto');
    sim.note('Moore, jefe de investigación de Fairchild y luego cofundador de Intel, observó en 1965 con cuatro puntos que el número de componentes por circuito integrado se duplicaba cada año, y propuso que seguiría diez años; en 1975 corrigió a cada dos. Cincuenta años después, el ajuste a los procesadores comerciales da una duplicación cada 2 años (algo menos hoy). Es una regla económica y tecnológica: depende de que la industria lo tome como objetivo.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, D = C.MOORE;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1970, xmax: 2030, ymin: 1e3, ymax: 1e11, ylog: true, xlabel: 'año', ylabel: 'transistores por chip' });
      pl.frame(); D.forEach((d) => { pl.dot(d[0], d[1], { color: '--accent', r: 4.5 }); EM.text(ctx, d[2], pl.X(d[0]) + 5, pl.Y(d[1]) + 14, { size: 9.5, color: '--ink-2' }); });
      const Tfit = C.doublingTime(D), b = Math.log2(D[0][1]) - D[0][0] / Tfit;
      if (p.fit) pl.fn((x) => Math.pow(2, b + x / Tfit), { color: '--c1', width: 2.2 });
      pl.fn((x) => 2300 * Math.pow(2, (x - 1971) / p.T), { color: '--c3', width: 1.8, dash: [5, 4] });
      sim.set('t', EM.fix(Tfit, 2) + ' años'); sim.set('p', (2300 * Math.pow(2, (2030 - 1971) / p.T)).toExponential(2));
    });
  });

  /* 32.3 Umbral del láser */
  EM.defineSim('laser-umbral', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('beta', { label: 'Fracción de emisión espontánea acoplada al modo β', min: -6, max: -1, step: 0.1, value: -4, fmt: (v) => '10^' + v.toFixed(1) });
    sim.slider('R', { label: 'Bombeo relativo al umbral', min: 0.1, max: 5, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.out('f', 'Fotones en el modo (relativo al umbral)', { hl: true });
    sim.out('n', 'Inversión de población frente a la de umbral');
    sim.note('En un láser, la luz estimulada crece con el número de fotones: por encima de un bombeo umbral la ganancia iguala a las pérdidas, la inversión de población queda «anclada» y cada átomo extra que se bombea se convierte en un fotón coherente. Einstein (1917) había descubierto la emisión estimulada al deducir la ley de Planck con transiciones; Townes realizó el máser (1954) y Maiman el láser de rubí (1960). Cuanto menor es \\(\\beta\\), más abrupto es el umbral.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, beta = Math.pow(10, p.beta), tau = 1, G = 1, tauc = 0.01, nth = 1 / (G * tauc), Rth = nth / tau;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.1, xmax: 5, ymin: 1e-6, ymax: 1e3, xlog: true, ylog: true, xlabel: 'bombeo / bombeo umbral', ylabel: 'fotones en el modo (relativo al umbral)' });
      pl.frame(); pl.vline(1, { color: '--ink-3', label: 'umbral' });
      const ph = (r) => C.laserSS(r * Rth, tau, G, tauc, beta).phi / (nth * tauc);
      pl.fn((r) => Math.max(ph(r), 1e-9), { color: '--c1', width: 2.4, n: 300 }); pl.dot(p.R, Math.max(ph(p.R), 1e-9), { color: '--accent', r: 6 });
      const s = C.laserSS(p.R * Rth, tau, G, tauc, beta);
      sim.set('f', ph(p.R).toExponential(2)); sim.set('n', EM.fix(s.n / s.nth, 4));
    });
  });
})();
