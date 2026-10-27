/* Capítulo 21 — Maxwell y Hertz */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 21.1 Doscientos años de medidas de c */
  EM.defineSim('medidas-c', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('hasta', { label: 'Medidas hasta el año', min: 1676, max: 1983, step: 1, value: 1983, fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Medidas mostradas', { hl: true });
    sim.out('mx', 'Maxwell: c = 1/√(μ₀ε₀) con los valores de Weber y Kohlrausch (1855)');
    sim.out('d', 'Última medida frente a la definición actual (299 792.458 km/s)');
    sim.note('Cuando Maxwell calculó en 1862 la velocidad de propagación de las ondas de su teoría con las constantes eléctricas medidas por Weber y Kohlrausch (310 740 km/s), la comparó con la velocidad de la luz de Fizeau (314 858 km/s) y escribió: «casi no podemos evitar la inferencia de que la luz consiste en las ondulaciones transversales del mismo medio que es la causa de los fenómenos eléctricos y magnéticos». Dos números de campos distintos (la electricidad y la óptica) coincidían.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1660, xmax: 2000, ymin: 2.0e5, ymax: 3.3e5, xlabel: 'año', ylabel: 'velocidad de la luz (km/s)' });
      pl.frame(); pl.hline(299792.458, { color: '--c3', label: '299 792.458 km/s', labelRight: true });
      const sel = C.CMEAS.filter((m) => m[0] <= p.hasta);
      sel.forEach((m) => {
        const x = pl.X(m[0]), y = pl.Y(m[1]), e = Math.max(2, Math.abs(pl.Y(m[1] + m[2]) - y));
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y - e); ctx.lineTo(x, y + e); ctx.stroke();
        pl.dot(m[0], m[1], { color: m[0] === 1855 || m[0] === 1868 ? '--accent' : '--c1', r: 5 });
        EM.text(ctx, m[4] + ' ' + m[0], x + 7, y - 7, { size: 10.5, color: '--ink-2' });
      });
      const last = sel[sel.length - 1];
      sim.set('n', sel.length + ' de ' + C.CMEAS.length);
      sim.set('mx', EM.fix(310740, 0) + ' km/s (más próxima a la luz que a cualquier otra)');
      sim.set('d', last ? EM.fix(last[1] - 299792.458, 3) + ' km/s' + (last[2] ? '  (' + EM.fix((100 * (last[1] - 299792.458)) / 299792.458, 3) + ' %)' : '') : '—');
    });
  });

  /* 21.2 Ondas de Maxwell en una dimensión (FDTD) */
  EM.defineSim('fdtd-maxwell', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('n', { label: 'Índice de refracción del medio de la derecha', min: 1, max: 3, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('w', { label: 'Anchura del pulso', min: 6, max: 40, step: 1, value: 16, fmt: (v) => v.toFixed(0) });
    sim.out('v', 'Velocidad en cada medio: 1/√(μ₀ε), en unidades de c', { hl: true });
    sim.out('r', 'Reflexión: amplitud medida y de Fresnel (n₁ − n₂)/(n₁ + n₂)');
    sim.out('t', 'Transmisión: amplitud medida y de Fresnel 2n₁/(n₁ + n₂)');
    sim.note('Se integran directamente las ecuaciones de Maxwell en una dimensión, con el método de diferencias finitas de Yee (1966). Un pulso de campo eléctrico avanza a \\(c\\) en el vacío y a \\(c/n\\) en el medio con \\(\\varepsilon_r=n^2\\); en la frontera se divide en una onda reflejada y otra transmitida. Esas amplitudes salen de las ecuaciones, sin añadir nada más, y coinciden con las fórmulas de Fresnel (1823).');
    const N = 700, bound = 380;
    let state, t = 0;
    const run = () => { const eps = new Float64Array(N).fill(1); for (let i = bound; i < N; i++) eps[i] = sim.p.n * sim.p.n; state = { eps, E: new Float64Array(N), H: new Float64Array(N) }; t = 0; };
    run(); sim.onChange = run; sim.resetButton(run);
    sim.animate(() => {
      for (let k = 0; k < 4; k++) { C.fdtdStep(state.E, state.H, state.eps, t, 80, sim.p.w); t++; }
      if (t > 1500) run();
    });
    let refl = 0, trans = 0;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const { E } = state;
      const n1 = 1, n2 = p.n, fr = C.fresnelNormal(n1, n2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: N, ymin: -1.2, ymax: 1.2, xlabel: 'posición (celdas)', ylabel: 'campo eléctrico E' });
      pl.frame();
      pl.band(bound, N, { color: '--glass', alpha: 0.25 });
      pl.vline(bound, { color: '--ink-3', label: 'frontera' });
      pl.xy(Array.from(E, (_, i) => i), Array.from(E), { color: '--c1', width: 2 });
      let mr = 0, mt = 0; for (let i = 100; i < bound - 5; i++) mr = Math.max(mr, Math.abs(E[i])); for (let i = bound + 5; i < N - 2; i++) mt = Math.max(mt, Math.abs(E[i]));
      if (t > 1100 && t < 1300) { refl = mr; trans = mt; }
      sim.set('v', '1 en el vacío; ' + EM.fix(1 / p.n, 3) + ' en el medio');
      sim.set('r', (refl ? EM.fix(refl, 3) : '(espere a que el pulso llegue)') + '  /  ' + EM.fix(Math.abs(fr.r), 3));
      sim.set('t', (trans ? EM.fix(trans, 3) : '—') + '  /  ' + EM.fix(fr.t, 3));
    });
  });

  /* 21.3 Hertz: ondas estacionarias */
  EM.defineSim('hertz-ondas', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('L', { label: 'Inductancia del oscilador', min: 20, max: 400, step: 1, value: 300, fmt: (v) => v.toFixed(0) + ' nH' });
    sim.slider('Cc', { label: 'Capacidad del oscilador', min: 5, max: 100, step: 1, value: 95, fmt: (v) => v.toFixed(0) + ' pF' });
    sim.slider('d', { label: 'Distancia al reflector de cinc', min: 1, max: 15, step: 0.05, value: 13, fmt: (v) => v.toFixed(2) + ' m' });
    sim.out('f', 'Frecuencia del oscilador 1/(2π√LC)', { hl: true });
    sim.out('lam', 'Longitud de onda medida (distancia entre nodos × 2)');
    sim.out('c', 'c = λf');
    sim.note('Hertz (1887-1888) generó ondas con una chispa entre dos esferas (un circuito LC) y las detectó con un lazo de cable con un pequeño entrehierro, en el que saltaba una chispa. Con un reflector de cinc a 13 m obtuvo ondas estacionarias: la distancia entre los nodos, \\(\\lambda/2\\), y la frecuencia, que conocía por el circuito, dan \\(c=\\lambda f\\). Resultó la velocidad de la luz: la teoría de Maxwell se confirmaba.');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 3; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, f = C.lcFrequency(p.L * 1e-9, p.Cc * 1e-12), lam = C.CLIGHT / f;
      EM.draw.clear(cv);
      const x0 = 40, x1 = W - 40, y = H * 0.5, sc = (x1 - x0) / 15;
      ctx.fillStyle = EM.col('--c4'); ctx.beginPath(); ctx.arc(x0, y, 8, 0, TAU); ctx.fill(); EM.text(ctx, 'oscilador', x0, y + 26, { size: 11, align: 'center' });
      const xr = x0 + p.d * sc; ctx.fillStyle = EM.col('--c6'); ctx.fillRect(xr - 3, y - 70, 6, 140); EM.text(ctx, 'reflector', xr, y + 86, { size: 11, align: 'center' });
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2.2; ctx.beginPath();
      for (let i = 0; i <= 600; i++) { const xx = (p.d * i) / 600, A = 2 * Math.sin((TAU * (p.d - xx)) / lam) * Math.cos(ph); const px = x0 + xx * sc, py = y - A * 45; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); for (let k = 0; ; k++) { const xx = p.d - (k * lam) / 2; if (xx < 0) break; ctx.beginPath(); ctx.arc(x0 + xx * sc, y, 4, 0, TAU); ctx.fill(); }
      sim.set('f', EM.fix(f / 1e6, 1) + ' MHz');
      sim.set('lam', EM.fix(lam, 2) + ' m  (nodos cada ' + EM.fix(lam / 2, 2) + ' m)');
      sim.set('c', EM.fix(lam * f / 1e3, 0) + ' km/s  (la luz: 299 792 km/s)');
    });
  });
})();
