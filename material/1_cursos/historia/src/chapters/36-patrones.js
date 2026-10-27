/* Capítulo 36 — Patrones: simultaneidad, prioridad, error y revolución */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;

  EM.defineSim('descubrimientos-multiples', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Equipos independientes que buscan lo mismo', min: 2, max: 15, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Tasa de hallazgo por equipo (por año, idea madura)', min: 0.02, max: 0.5, step: 0.01, value: 0.2, fmt: (v) => v.toFixed(2) });
    sim.slider('w', { label: 'Ventana de «simultaneidad»', min: 0.5, max: 5, step: 0.5, value: 2, fmt: (v) => v.toFixed(1) + ' años' });
    sim.out('f', 'Probabilidad de que los dos primeros coincidan (fórmula)', { hl: true });
    sim.out('m', 'Monte Carlo (20 000 ensayos)');
    sim.out('d', 'Mediana del intervalo en los 18 casos históricos recogidos');
    sim.note('Si hay \\(n\\) equipos independientes y cada uno llega al resultado a una tasa \\(r\\) cuando la idea está «madura», el intervalo entre los dos primeros es exponencial con tasa \\((n-1)r\\): \\(P=1-e^{-(n-1)rw}\\). Con 5 equipos y \\(r=0.2\\), el 80 % de las veces los dos primeros están a menos de 2 años. Merton (1961) mostró que los descubrimientos múltiples no son la excepción sino la regla; Kuhn añadió que la madurez se debe a una acumulación de datos y técnicas que preparan el salto. A la derecha, los intervalos reales de 18 casos de este curso y de otros.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, g = C.gaps();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 2, xmax: 15, ymin: 0, ymax: 1.02, xlabel: 'número de equipos n', ylabel: 'P(coincidencia en la ventana)' });
      pl.frame(); pl.fn((n) => C.pSimultaneous(Math.round(n), p.r, p.w), { color: '--c1', width: 2.4, n: 13 }); pl.dot(p.n, C.pSimultaneous(p.n, p.r, p.w), { color: '--accent', r: 6 });
      const bins = new Array(8).fill(0); g.forEach((x) => { bins[Math.min(7, x)]++; }); const mx = Math.max(...bins);
      const x0 = W * 0.62, bw = (W * 0.34) / 8, y0 = H * 0.82, hh = H * 0.6;
      bins.forEach((b, i) => { ctx.fillStyle = EM.col('--c3'); ctx.fillRect(x0 + i * bw + 2, y0 - (b / mx) * hh, bw - 4, (b / mx) * hh); EM.text(ctx, String(i === 7 ? '7+' : i), x0 + i * bw + bw / 2, y0 + 14, { size: 10.5, align: 'center', color: '--ink-2' }); });
      EM.text(ctx, 'intervalo entre la 1.ª y la 2.ª comunicación (años)', x0, y0 + 34, { size: 10.5, color: '--ink-2' });
      sim.set('f', EM.fix(C.pSimultaneous(p.n, p.r, p.w), 3)); sim.set('m', EM.fix(C.simSimultaneous(p.n, p.r, p.w, 20000, 5), 3)); sim.set('d', EM.fix(C.median(g), 1) + ' años (' + g.filter((x) => x <= 1).length + ' de ' + g.length + ' con 1 año o menos)');
    });
  });
})();
