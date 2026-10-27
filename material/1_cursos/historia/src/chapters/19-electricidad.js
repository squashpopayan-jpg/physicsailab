/* Capítulo 19 — Ámbar, botellas y pilas */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 19.1 La balanza de torsión de Coulomb */
  EM.defineSim('coulomb-balanza', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Exponente supuesto de la ley de fuerza: F ∝ 1/dⁿ', min: 1, max: 3, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.check('chord', { label: 'Usar la cuerda 2 sen(θ/2) en lugar del ángulo como distancia', value: false });
    sim.out('e', 'Exponente que dan las medidas de Coulomb (1.º-2.º y 1.º-3.º)', { hl: true });
    sim.out('t', 'Torsiones que predice el exponente elegido');
    sim.out('obs', 'Torsiones observadas por Coulomb');
    sim.note('Coulomb (1785) mantuvo dos bolitas con carga del mismo signo a una distancia medida por el ángulo de separación (36°, 18° y 8.5°) y giró la cabeza de la balanza (un hilo de plata) lo necesario para acercarlas. El par total, suma del ángulo de separación y la torsión, mide la fuerza: 36°, 144° y 575.5°. Entre 36° y 18° la fuerza se cuadruplica y entre 36° y 8.5° se multiplica por 16: ley del inverso del cuadrado.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, D = C.coulombData;
      EM.draw.clear(cv);
      const x = D.map((d) => (p.chord ? 2 * Math.sin((d[0] * PI) / 360) : d[0])), f = D.map(C.coulombForce);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 5, xmax: 40, ymin: 10, ymax: 1500, xlog: true, ylog: true, xlabel: p.chord ? 'distancia (cuerda, unidades arbitrarias)' : 'separación angular (°)', ylabel: 'par total (°)' });
      const xs0 = p.chord ? 2 * Math.sin((36 * PI) / 360) : 36;
      pl.o.xmin = p.chord ? 0.12 : 5; pl.o.xmax = p.chord ? 0.7 : 40; pl.frame();
      pl.fn((d) => f[0] * Math.pow(xs0 / d, p.n), { color: '--c1', width: 2.2, from: pl.o.xmin });
      D.forEach((d, i) => pl.dot(x[i], f[i], { color: '--accent', r: 6, label: d[0] + '° + ' + d[1] + '°', dy: -10 }));
      const e = C.coulombExponent(p.chord);
      sim.set('e', EM.fix(e[0], 3) + ' y ' + EM.fix(e[1], 3));
      sim.set('t', x.map((xx, i) => EM.fix(f[0] * Math.pow(x[0] / xx, p.n), 0)).join('° · ') + '°');
      sim.set('obs', f.map((v) => EM.fix(v, 1)).join('° · ') + '°');
    });
  });

  /* 19.2 La pila de Volta */
  EM.defineSim('pila-volta', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Número de pares cinc–cobre', min: 1, max: 60, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('E', { label: 'Fem de cada par', min: 0.5, max: 1.2, step: 0.01, value: 0.76, fmt: (v) => v.toFixed(2) + ' V' });
    sim.slider('r', { label: 'Resistencia interna de cada par', min: 0.2, max: 5, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) + ' Ω' });
    sim.slider('R', { label: 'Resistencia externa (el cuerpo, un hilo, el agua)', min: 1, max: 5000, step: 1, value: 200, fmt: (v) => v.toFixed(0) + ' Ω', log: true });
    sim.out('V', 'Tensión en bornes', { hl: true });
    sim.out('I', 'Corriente (ley de Ohm: I = nE/(nr + R))');
    sim.out('P', 'Potencia útil y rendimiento');
    sim.out('Pm', 'Potencia máxima (cuando R = n r)');
    sim.note('Volta (1799-1800) apiló discos de cinc y de cobre separados por paños mojados en salmuera: la <em>pila</em>. La tensión crece con el número de pares, y también la resistencia interna; por eso con un circuito exterior de poca resistencia la pila grande no rinde más que una pequeña. Ohm (1827) dio la ley que lo describe: \\(I=V/R\\). Un cuerpo humano seco (~ 100 kΩ) sentía un cosquilleo; mojado (~ 1 kΩ), un golpe.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, s = C.pile(p.n, p.E, p.r, p.R);
      EM.draw.clear(cv);
      const half = W * 0.3, cx = half * 0.5, y0 = H * 0.85, hh = Math.min(4, (H * 0.65) / p.n);
      for (let i = 0; i < p.n; i++) { ctx.fillStyle = EM.col('--c6'); ctx.fillRect(cx - 30, y0 - (2 * i) * hh, 60, hh * 0.9); ctx.fillStyle = EM.col('--c4'); ctx.fillRect(cx - 30, y0 - (2 * i + 1) * hh, 60, hh * 0.9); }
      EM.text(ctx, p.n + ' pares', cx, 18, { size: 12, align: 'center', weight: 650 });
      const pl = new EM.Plot(ctx, { x: half + 10, y: 8, w: W - half - 16, h: H - 16, xmin: 1, xmax: 5000, ymin: 0, ymax: Math.max(p.n * p.E * 1.05, 2), xlog: true, xlabel: 'resistencia externa R (Ω)', ylabel: 'tensión en bornes (V)' });
      pl.frame(); pl.fn((R) => C.pile(p.n, p.E, p.r, R).V, { color: '--c1', width: 2.2 }); pl.dot(p.R, s.V, { color: '--accent', r: 6 });
      pl.vline(p.n * p.r, { color: '--ink-3', label: 'R = n r' });
      sim.set('V', EM.fix(s.V, 3) + ' V  (en vacío: ' + EM.fix(p.n * p.E, 2) + ' V)');
      sim.set('I', EM.sci(s.I, 3) + ' A');
      sim.set('P', EM.sci(s.P, 3) + ' W  (' + EM.fix(100 * s.eta, 0) + ' %)');
      sim.set('Pm', EM.sci(s.Pmax, 3) + ' W');
    });
  });

  /* 19.3 La prueba de la esfera: Priestley y Cavendish */
  EM.defineSim('prueba-esfera', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Exponente de la fuerza entre cargas: F ∝ 1/rⁿ', min: 1.6, max: 2.6, step: 0.005, value: 2, fmt: (v) => v.toFixed(3) });
    sim.slider('x', { label: 'Posición de la carga de prueba dentro de la esfera (en radios)', min: 0.05, max: 0.95, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('F', 'Fuerza neta sobre la carga de prueba', { hl: true });
    sim.out('lim', 'Cavendish (1773): |n − 2| < 0.02 · Maxwell (1873): < 5×10⁻⁵ · Williams (1971): < 3×10⁻¹⁶');
    sim.note('Franklin observó (1755) que un corcho dentro de una copa metálica electrizada no era atraído ni repelido por las paredes. Priestley (1767) reconoció, por analogía con el teorema de Newton para la gravedad (capítulo 14), que eso solo ocurre si la fuerza es inversa al cuadrado. Cavendish lo hizo cuantitativo en 1773 con dos esferas concéntricas (sin publicar); Maxwell publicó sus papeles en 1879.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const half = W * 0.38, cx = half * 0.5, cy = H * 0.5, R = Math.min(half * 0.42, H * 0.38);
      ctx.fillStyle = EM.alpha('--pos', 0.1); ctx.strokeStyle = EM.col('--pos'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
      const F = C.shellField(p.x, p.n);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + p.x * R, cy, 6, 0, TAU); ctx.fill();
      if (Math.abs(F) > 1e-4) EM.draw.arrow(ctx, cx + p.x * R, cy - 20, cx + p.x * R + Math.sign(F) * Math.min(60, 400 * Math.abs(F)), cy - 20, { color: '--c2', width: 2.4 });
      EM.text(ctx, 'carga de prueba', cx + p.x * R, cy + 22, { size: 11, align: 'center', color: '--accent' });
      const pl = new EM.Plot(ctx, { x: half + 8, y: 8, w: W - half - 14, h: H - 16, xmin: 0, xmax: 0.95, ymin: -0.2, ymax: 0.2, xlabel: 'posición dentro de la esfera (radios)', ylabel: 'fuerza neta' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      for (const [n, col] of [[1.9, '--c3'], [2.0, '--c1'], [2.1, '--c2']]) pl.fn((x) => C.shellField(x, n, 600), { color: col, width: 1.6, from: 0.02, n: 60 });
      pl.fn((x) => C.shellField(x, p.n, 600), { color: '--accent', width: 2.6, from: 0.02, n: 60 }); pl.dot(p.x, F, { color: '--accent', r: 5 });
      pl.legend([{ label: 'n = 1.9', color: '--c3' }, { label: 'n = 2', color: '--c1' }, { label: 'n = 2.1', color: '--c2' }], 'tl');
      sim.set('F', EM.sci(F, 2) + (Math.abs(F) < 1e-5 ? '  = 0 (solo con n = 2)' : ''));
      sim.set('lim', 'el cero exacto del campo interior es la prueba más sensible de una ley');
    });
  });
})();
