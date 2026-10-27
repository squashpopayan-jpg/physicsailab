/* Capítulo 26 — Relatividad especial */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 26.1 Diagrama de Minkowski */
  EM.defineSim('minkowski-boost', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('b', { label: 'Velocidad del segundo observador β = v/c', min: -0.95, max: 0.95, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('xe', { label: 'Posición del suceso B (años luz)', min: 0.5, max: 4, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) });
    sim.out('t', 'Tiempo de B para el observador en reposo: t = 0 (simultáneo con A)', { hl: true });
    sim.out('tp', 'Tiempo de B para el observador en movimiento t′ = −γβx/c');
    sim.out('i', 'Intervalo t² − x² (invariante)');
    sim.note('El suceso A está en el origen y B ocurre en el mismo instante que A para el observador negro (eje horizontal). El observador en movimiento tiene ejes inclinados: su eje \\(x\'\\) (simultaneidad) gira hacia la luz. B queda en el futuro o en el pasado de A según su velocidad: la <em>simultaneidad es relativa</em>. El intervalo no cambia porque las líneas de luz (45°) son las mismas para todos.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, cx = W / 2, cy = H / 2, s = Math.min(W, H) / 10, b = p.b;
      EM.draw.clear(cv);
      const P = (x, t) => [cx + x * s, cy - t * s];
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
      for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(...P(-5 * sg, -5)); ctx.lineTo(...P(5 * sg, 5)); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(...P(-5, 0)); ctx.lineTo(...P(5, 0)); ctx.moveTo(...P(0, -5)); ctx.lineTo(...P(0, 5)); ctx.stroke();
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(-5, -5 * b)); ctx.lineTo(...P(5, 5 * b)); ctx.moveTo(...P(-5 * b, -5)); ctx.lineTo(...P(5 * b, 5)); ctx.stroke();
      EM.text(ctx, "x′", ...P(4.7, 4.7 * b - 0.4), { size: 12, color: '--c1' }); EM.text(ctx, "ct′", ...P(4.7 * b + 0.2, 4.7), { size: 12, color: '--c1' });
      EM.text(ctx, 'x', ...P(4.7, -0.4), { size: 12 }); EM.text(ctx, 'ct', ...P(0.2, 4.7), { size: 12 });
      const [ax, ay] = P(0, 0), [bx, by] = P(p.xe, 0);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(ax, ay, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill();
      EM.text(ctx, 'A', ax + 8, ay - 8, { size: 12 }); EM.text(ctx, 'B', bx + 8, by - 8, { size: 12 });
      const bb = C.boost(p.xe, 0, b);
      ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(...P(p.xe, 0)); ctx.lineTo(...P(p.xe * 1, p.xe * b * 1)); ctx.stroke(); ctx.setLineDash([]);
      sim.set('t', '0 años');
      sim.set('tp', EM.fix(bb.t, 3) + ' años  (' + (bb.t < 0 ? 'B es anterior a A' : bb.t > 0 ? 'B es posterior a A' : 'simultáneos') + ')');
      sim.set('i', EM.fix(C.interval2(bb.x, bb.t), 4) + ' = ' + EM.fix(C.interval2(p.xe, 0), 4));
    });
  });

  /* 26.2 Gemelos */
  EM.defineSim('gemelos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('b', { label: 'Velocidad del viajero β', min: 0.1, max: 0.99, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('L', { label: 'Distancia a la estrella (años luz)', min: 1, max: 20, step: 0.5, value: 4, fmt: (v) => v.toFixed(1) });
    sim.out('e', 'Años transcurridos para el gemelo de la Tierra', { hl: true });
    sim.out('v', 'Años transcurridos para el viajero');
    sim.out('d', 'Diferencia de edad al reencontrarse');
    sim.note('Langevin (1911) planteó la paradoja: cada gemelo ve que el otro envejece más lento. Pero la situación no es simétrica: solo el viajero cambia de sistema inercial al dar la vuelta. En el diagrama, el camino del viajero (rojo) es más corto en tiempo propio que el de la Tierra (azul): en la geometría de Minkowski la línea recta es la de <em>mayor</em> tiempo propio.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, tE = C.twinEarth(p.L, p.b), tV = C.twinProper(p.L, p.b);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 22, ymin: 0, ymax: 45, xlabel: 'distancia a la estrella (años luz)', ylabel: 'tiempo de la Tierra (años)' });
      pl.frame(); pl.xy([0, 0], [0, 0]); pl.xy([0, p.L, 0], [0, tE / 2, tE], { color: '--c3', width: 2.6 }); pl.xy([0, 0], [0, tE], { color: '--c1', width: 2.6 });
      const bx = W * 0.62, bw = W * 0.34, my = Math.max(tE, 1);
      ctx.fillStyle = EM.col('--c1'); ctx.fillRect(bx, H * 0.15, bw * (tE / 45), 26); EM.text(ctx, 'Tierra', bx, H * 0.15 - 6, { size: 11 });
      ctx.fillStyle = EM.col('--c3'); ctx.fillRect(bx, H * 0.45, bw * (tV / 45), 26); EM.text(ctx, 'viajero', bx, H * 0.45 - 6, { size: 11 });
      sim.set('e', EM.fix(tE, 2) + ' años'); sim.set('v', EM.fix(tV, 2) + ' años (γ = ' + EM.fix(C.gamma(p.b), 3) + ')'); sim.set('d', EM.fix(tE - tV, 2) + ' años');
    });
  });

  /* 26.3 Muones */
  EM.defineSim('muones-cosmicos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('h', { label: 'Altura de producción', min: 5, max: 25, step: 0.5, value: 15, fmt: (v) => v.toFixed(1) + ' km' });
    sim.slider('b', { label: 'Velocidad de los muones β', min: 0.9, max: 0.9999, step: 0.0001, value: 0.9952, fmt: (v) => v.toFixed(4) });
    sim.out('a', 'Sin relatividad: fracción que llega al suelo', { hl: true });
    sim.out('r', 'Con dilatación del tiempo: fracción que llega al suelo');
    sim.out('g', 'Cociente (relatividad / clásica)');
    sim.note('Los muones de los rayos cósmicos nacen a unos 15 km y viven 2.2 µs en reposo: con \\(\\beta\\approx0.995\\) recorrerían 650 m. Rossi y Hall (1941) midieron en Echo Lake (3240 m) y en Denver (1616 m) que llegaban muchos más de lo esperado, y que la tasa de desintegración, referida al reposo del muón, era la que corresponde a su dilatación del tiempo. En el sistema del muón la explicación es otra: la atmósfera se contrae en un factor \\(\\gamma\\).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, h = p.h * 1000, tau = 2.1969811e-6;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 25, ymin: 0, ymax: 1, xlabel: 'altura de producción (km)', ylabel: 'fracción que llega al suelo' });
      pl.frame();
      pl.fn((x) => C.muonSurvive(x * 1000, p.b, tau, true), { color: '--c1', width: 2.4, label: 'con dilatación' });
      pl.fn((x) => C.muonSurvive(x * 1000, p.b, tau, false), { color: '--c3', width: 2.4, label: 'sin relatividad' });
      pl.vline(p.h, { color: '--accent' });
      const a = C.muonSurvive(h, p.b, tau, false), r = C.muonSurvive(h, p.b, tau, true);
      sim.set('a', a.toExponential(2)); sim.set('r', EM.fix(r, 4)); sim.set('g', EM.fix(r / a, 1) + ' veces más');
    });
  });

  /* 26.4 Masa del electrón: Kaufmann, Abraham, Lorentz */
  EM.defineSim('masa-electron', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('b', { label: 'Velocidad del electrón β', min: 0.3, max: 0.98, step: 0.01, value: 0.9, fmt: (v) => v.toFixed(2) });
    sim.out('e', 'Masa transversal de Lorentz–Einstein γm₀', { hl: true });
    sim.out('a', 'Masa transversal de Abraham (esfera rígida)');
    sim.out('d', 'Diferencia relativa');
    sim.note('Kaufmann (1902-1906) midió con rayos β del radio (hasta 0.97c) cómo aumenta la masa con la velocidad. Abraham, con su electrón rígido, y Lorentz–Einstein predecían curvas parecidas: a \\(\\beta=0.9\\) difieren en un 10 %. Los datos de Kaufmann favorecían a Abraham (y a Bucherer, 1908, a Lorentz–Einstein); Planck y Einstein criticaron la exactitud de Kaufmann, y la cuestión no se zanjó hasta 1910-1916 con experimentos mejorados.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.3, xmax: 0.98, ymin: 1, ymax: 5, xlabel: 'velocidad β = v/c', ylabel: 'masa transversal (m₀)' });
      pl.frame(); pl.fn((b) => C.gamma(b), { color: '--c1', width: 2.4, label: 'Lorentz–Einstein' }); pl.fn((b) => C.massAbraham(b), { color: '--c3', width: 2.4, label: 'Abraham' });
      pl.vline(p.b, { color: '--accent' });
      const e = C.gamma(p.b), a = C.massAbraham(p.b);
      sim.set('e', EM.fix(e, 4) + ' m₀'); sim.set('a', EM.fix(a, 4) + ' m₀'); sim.set('d', EM.fix((100 * (a - e)) / e, 2) + ' %');
    });
  });
})();
