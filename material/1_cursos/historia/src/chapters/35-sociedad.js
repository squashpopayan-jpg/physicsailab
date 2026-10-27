/* Capítulo 35 — Quién hace física: mujeres, guerra, dinero e imprenta */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 35.1 Saha y Payne */
  EM.defineSim('saha-payne', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('ne', { label: 'Densidad electrónica de la atmósfera (log₁₀ m⁻³)', min: 18, max: 22, step: 0.1, value: 20, fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura de la estrella', min: 3000, max: 30000, step: 100, value: 9500, fmt: (v) => v.toFixed(0) + ' K' });
    sim.out('f', 'Fracción de hidrógeno ionizado (Saha)', { hl: true });
    sim.out('s', 'Intensidad relativa de las líneas de Balmer');
    sim.out('p', 'Temperatura del máximo de Balmer');
    sim.note('En 1925, Cecilia Payne aplicó la ecuación de Saha (1920) a los espectros estelares de Harvard. Descubrió que la secuencia espectral (O, B, A, F, G, K, M) es una secuencia de <em>temperatura</em>, no de composición: las líneas de Balmer son máximas a unos 9500 K porque a menos temperatura casi no hay átomos con el nivel \\(n=2\\) poblado, y a más el hidrógeno está ionizado. Y concluyó que las estrellas son en su inmensa mayoría hidrógeno y helio, un millón de veces más hidrógeno que metales. Russell, que dominaba la disciplina, le dijo que era imposible.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, ne = Math.pow(10, p.ne);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 3000, xmax: 30000, ymin: 0, ymax: 1.05, xlabel: 'temperatura (K)', ylabel: 'relativo' });
      pl.frame();
      const mx = Math.max(...Array.from({ length: 270 }, (_, i) => C.balmerStrength(3000 + i * 100, ne)));
      pl.fn((T) => C.ionFraction(T, ne), { color: '--c3', width: 2, label: 'ionización' });
      pl.fn((T) => C.balmerStrength(T, ne) / mx, { color: '--c1', width: 2.6, label: 'Balmer' });
      pl.vline(p.T, { color: '--accent' });
      [['O', 35000], ['B', 20000], ['A', 9500], ['F', 7000], ['G', 5800], ['K', 4500], ['M', 3300]].forEach((c) => { if (c[1] <= 30000) EM.text(ctx, c[0], pl.X(c[1]), pl.Y(1.0) + 14, { size: 12, align: 'center', color: '--ink-2' }); });
      sim.set('f', EM.fix(C.ionFraction(p.T, ne), 4)); sim.set('s', EM.fix(C.balmerStrength(p.T, ne) / mx, 3)); sim.set('p', EM.fix(C.balmerPeakT(ne), 0) + ' K');
    });
  });

  /* 35.2 Noether */
  EM.defineSim('noether-simetria', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('eps', { label: 'Rotura de la simetría rotacional (fuerza uniforme ε)', min: 0, max: 0.1, step: 0.005, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.out('E', 'Variación de la energía (simetría temporal intacta)', { hl: true });
    sim.out('L', 'Variación del momento angular');
    sim.note('Noether (1918) demostró que a cada simetría continua del lagrangiano le corresponde una cantidad conservada: invariancia en el tiempo → energía; en el espacio → impulso; por rotaciones → momento angular. Aquí un planeta orbita bajo \\(V=-1/r\\) (simétrico) más una fuerza uniforme \\(\\varepsilon\\) que rompe la simetría rotacional pero no la temporal: el momento angular deja de conservarse, la energía sigue constante. El teorema, que Einstein elogió como «un monumento al pensamiento matemático», fue trabajo de una mujer a quien Gotinga negaba un puesto.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, o = C.noetherOrbit(p.eps, 20000, 0.0005);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 10, ymin: -0.6, ymax: 1.2, xlabel: 'tiempo', ylabel: 'E (azul) y L (rojo)' });
      pl.frame(); pl.xy(o.t, o.E, { color: '--c1', width: 2.4 }); pl.xy(o.t, o.L, { color: '--c3', width: 2.4 });
      sim.set('E', (Math.max(...o.E) - Math.min(...o.E)).toExponential(2)); sim.set('L', EM.fix(Math.max(...o.L) - Math.min(...o.L), 4));
    });
  });

  /* 35.3 Crecimiento de la ciencia */
  EM.defineSim('crecimiento-ciencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Tiempo de duplicación supuesto', min: 8, max: 30, step: 1, value: 15, fmt: (v) => v.toFixed(0) + ' años' });
    sim.out('t', 'Tiempo de duplicación ajustado al número de revistas', { hl: true });
    sim.out('h', 'Con ese ritmo, ¿cuántas revistas habría en 2100 desde 1950?');
    sim.out('w', 'Mujeres entre los laureados del Nobel de Física hasta 2023');
    sim.note('Price (1963) contó el número de revistas científicas fundadas desde 1665: se multiplica por 10 cada 50 años, un crecimiento exponencial de ≈ 5 % anual, que se mantuvo durante tres siglos y es imposible de sostener indefinidamente: una de las razones del paso de la «pequeña ciencia» a la «gran ciencia» (Manhattan, CERN, LIGO). El Nobel de Física, en cambio, ha premiado a cinco mujeres entre unas 225 personas desde 1901.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, D = C.JOURNALS;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1650, xmax: 2000, ymin: 0.5, ymax: 1e7, ylog: true, xlabel: 'año', ylabel: 'revistas científicas (acumulado)' });
      pl.frame(); D.forEach((d) => pl.dot(d[0], d[1], { color: '--accent', r: 5 }));
      pl.fn((x) => Math.pow(2, (x - 1665) / p.T), { color: '--c3', width: 2, dash: [6, 4], from: 1665 });
      const Tf = C.priceDoubling(), f = C.linfit(D.map((d) => d[0]), D.map((d) => Math.log2(d[1])));
      pl.fn((x) => Math.pow(2, f.b + f.m * x), { color: '--c1', width: 2.4 });
      sim.set('t', EM.fix(Tf, 1) + ' años'); sim.set('h', (100000 * Math.pow(2, 150 / p.T)).toExponential(1)); sim.set('w', C.NOBEL.women + ' de ' + C.NOBEL.total + ' (' + EM.fix((100 * C.NOBEL.women) / C.NOBEL.total, 1) + ' %)');
    });
  });
})();
