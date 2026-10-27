/* Capítulo 23 — El éter y Michelson–Morley */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 23.1 El interferómetro de Michelson y Morley */
  EM.defineSim('michelson-morley', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('v', { label: 'Velocidad de la Tierra respecto del éter', min: 0, max: 60, step: 0.5, value: 30, fmt: (v) => v.toFixed(1) + ' km/s' });
    sim.slider('L', { label: 'Longitud efectiva de cada brazo', min: 1.2, max: 11, step: 0.1, value: 11, fmt: (v) => v.toFixed(1) + ' m' });
    sim.check('fg', { label: 'Contracción de FitzGerald–Lorentz', value: false });
    sim.out('t', 'Franjas desplazadas al girar 90° (2Lv²/c²λ)', { hl: true });
    sim.out('d', 'Diferencia de tiempos t∥ − t⊥');
    sim.out('o', 'Observado en 1887: menos de 0.01 de franja, que equivale a v <');
    sim.note('El brazo paralelo al viento de éter tarda \\(\\tfrac{2L}{c}\\tfrac1{1-\\beta^2}\\) en ir y volver; el perpendicular, \\(\\tfrac{2L}{c}\\tfrac1{\\sqrt{1-\\beta^2}}\\). La diferencia, \\(L\\beta^2/c\\), es minúscula (\\(\\beta^2=10^{-8}\\)), pero un interferómetro mide fracciones de longitud de onda. Michelson y Morley montaron el aparato sobre una losa de piedra flotante en mercurio, con espejos que doblaban el camino hasta unos 11 m, y lo giraron lentamente: la franja debía desplazarse 0.4 al pasar de 0° a 90° (un desplazamiento 40 veces mayor que el detectable) y no se movió más de 0.01.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, v = p.v * 1000, lam = 550e-9, L = p.L;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 360, ymin: -0.5, ymax: 0.5, xlabel: 'orientación del aparato (°)', ylabel: 'franjas desplazadas' });
      pl.frame(); pl.hline(0, { color: '--ink-3' });
      pl.hline(0.01, { color: '--c3', label: 'límite 0.01', labelRight: true }); pl.hline(-0.01, { color: '--c3' });
      const amp = (a) => (p.fg ? 0 : C.mmFringeAngle(L, v, lam, (a * PI) / 180));
      pl.fn((a) => amp(a), { color: '--c1', width: 2.4, n: 360 });
      const x0 = W * 0.68, y0 = H * 0.5, s = Math.min(W * 0.14, H * 0.3);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - s, y0); ctx.lineTo(x0 + s, y0); ctx.moveTo(x0, y0 + s); ctx.lineTo(x0, y0 - s); ctx.stroke();
      ctx.fillStyle = EM.col('--c2'); ctx.fillRect(x0 - 4, y0 - 4, 8, 8); EM.text(ctx, 'espejo semiplateado', x0 + 8, y0 + 18, { size: 10.5, color: '--ink-2' });
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + s * 1.1, y0 - s * 1.5); ctx.lineTo(x0 - s * 1.1, y0 - s * 1.5); ctx.stroke();
      EM.text(ctx, '← viento de éter', x0 - s * 1.1, y0 - s * 1.5 - 8, { size: 11, color: '--accent' });
      const tt = C.mmTimes(L, v, p.fg);
      sim.set('t', EM.fix(C.mmFringeShift(L, v, lam, p.fg), 4) + ' franjas' + (p.fg ? '  (con la contracción es exactamente 0)' : ''));
      sim.set('d', EM.fix((tt.par - tt.perp) * 1e18, 3) + ' as (attosegundos, 10⁻¹⁸ s)');
      sim.set('o', EM.fix(C.mmVLimit(L, lam, 0.01) / 1000, 1) + ' km/s  (la Tierra se mueve a 29.8 km/s en su órbita)');
    });
  });

  /* 23.2 Fizeau: el agua en movimiento */
  EM.defineSim('fizeau-agua', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Índice de refracción del medio', min: 1, max: 2, step: 0.01, value: 1.33, fmt: (v) => v.toFixed(2) });
    sim.slider('v', { label: 'Velocidad del agua', min: 1, max: 10, step: 0.1, value: 7, fmt: (v) => v.toFixed(1) + ' m/s' });
    sim.out('k', 'Coeficiente de arrastre de Fresnel 1 − 1/n²', { hl: true });
    sim.out('s', 'Franjas desplazadas al invertir el flujo (2.97 m de agua, 526 nm): con Fresnel, sin arrastre, con arrastre total');
    sim.note('Si el éter estuviera inmóvil, la luz en el agua en movimiento no cambiaría de velocidad (\\(k=0\\)); si el agua lo arrastrara por completo, la luz iría a \\(c/n+v\\) (\\(k=1\\)). Fresnel propuso en 1818 un arrastre parcial \\(k=1-1/n^2\\), con una justificación hecha para que cuadrara con la aberración de las estrellas. Fizeau (1851) hizo circular agua a 7 m/s por dos tubos paralelos y midió el desplazamiento de las franjas: el arrastre parcial, no el total, y con valor cercano al de Fresnel. Michelson y Morley lo repitieron en 1886 con \\(k=0.434\\pm0.02\\).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 2, ymin: 0, ymax: 1.05, xlabel: 'índice de refracción n', ylabel: 'coeficiente de arrastre k' });
      pl.frame();
      pl.hline(0, { color: '--c3', label: 'éter inmóvil (k = 0)', labelRight: true }); pl.hline(1, { color: '--c4', label: 'éter arrastrado (k = 1)', labelRight: true });
      pl.fn((n) => C.fresnelDrag(n), { color: '--c1', width: 2.4, label: 'Fresnel' });
      pl.dot(1.333, 0.434, { color: '--accent', r: 6 }); EM.text(ctx, 'agua: M–M 1886 (0.434)', pl.X(1.333) + 10, pl.Y(0.434) + 18, { size: 10.5, color: '--accent' });
      pl.dot(p.n, C.fresnelDrag(p.n), { color: '--c2', r: 5 });
      const sh = (k) => C.fizeauShift(2.97, p.v, 526e-9, p.n, k);
      sim.set('k', EM.fix(C.fresnelDrag(p.n), 4));
      sim.set('s', EM.fix(sh(), 3) + ' · 0 · ' + EM.fix(sh(1), 3));
    });
  });
})();
