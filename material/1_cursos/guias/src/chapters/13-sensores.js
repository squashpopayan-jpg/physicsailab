/* Capítulo 13 — Fotopuertas y adquisición con microcontroladores */
(function () {
  'use strict';
  const EM = window.EM, D = EM.draw;
  EM.defineSim('fotopuerta', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.seg('modo', { label: 'Objeto', options: [['bandera', 'Bandera'], ['valla', 'Valla de franjas']], value: 'bandera' });
    sim.slider('v', { label: 'Velocidad', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'm/s', fmt: (v) => EM.fix(v, 2) });
    sim.slider('w', { label: 'Ancho de la bandera (o paso de la valla)', min: 0.005, max: 0.05, step: 0.001, value: 0.01, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 0) });
    sim.slider('d', { label: 'Diámetro efectivo del haz', min: 0.0005, max: 0.004, step: 0.0001, value: 0.0015, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 1) });
    sim.slider('f', { label: 'Umbral: fracción del haz cubierta para cambiar', min: 0.1, max: 0.9, step: 0.05, value: 0.1, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.out('dt', 'Tiempo medido', { hl: true });
    sim.out('vc', 'Velocidad calculada');
    sim.out('e', 'Error');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      /* Fracción del haz (uniforme, de ancho d centrado en 0) cubierta por un objeto opaco entre a y b */
      const cub = (a, b) => Math.max(0, Math.min(b, p.d / 2) - Math.max(a, -p.d / 2)) / p.d;
      const franjas = p.modo === 'bandera' ? [[0, p.w]] : [0, 1, 2, 3].map((k) => [k * p.w, k * p.w + p.w / 2]);
      const largo = franjas[franjas.length - 1][1];
      const T = (largo + 2 * p.d) / p.v, N = 1600;
      const ts = [], sen = [], bloq = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * T, x = -p.d + p.v * t; /* posición del borde delantero del objeto respecto del haz */
        let c = 0;
        for (const [a, b] of franjas) c += cub(x - b, x - a);
        ts.push(t); sen.push(c); bloq.push(c >= p.f ? 1 : 0);
      }
      /* flancos */
      const sub = [], baj = [];
      for (let i = 1; i <= N; i++) { if (bloq[i] && !bloq[i - 1]) sub.push(ts[i]); if (!bloq[i] && bloq[i - 1]) baj.push(ts[i]); }
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.38, w: W, h: H * 0.62, xmin: 0, xmax: T * 1000, ymin: -0.1, ymax: 1.25, xlabel: 't (ms)', ylabel: 'haz cubierto' });
      pl.frame();
      pl.xy(ts.map((t) => t * 1000), sen, { color: '--c1', width: 2 });
      pl.xy(ts.map((t) => t * 1000), bloq.map((b) => b * 1.1), { color: '--c2', width: 1.6 });
      pl.hline(p.f, { color: '--ink-3', label: 'umbral' });
      /* dibujo del objeto y el haz */
      const sc = (W * 0.7) / (largo + 2 * p.d), x0 = W * 0.08, yh = H * 0.18, xb = x0 + (largo + 1.5 * p.d) * sc;
      ctx.save(); ctx.fillStyle = 'rgba(229,57,53,0.25)'; ctx.fillRect(xb - (p.d * sc) / 2, H * 0.03, p.d * sc, H * 0.3); ctx.restore();
      for (const [a, b] of franjas) D.rect(ctx, x0 + a * sc, yh - 14, (b - a) * sc, 28, { fill: '--ink-2' });
      D.label(ctx, 'haz', xb, H * 0.03 + 10, { align: 'center', size: 10.5 });
      D.arrow(ctx, x0 + largo * sc + 6, yh, x0 + largo * sc + 6 + Math.min(40, p.d * sc), yh, { color: '--c2', width: 1.6 });
      D.label(ctx, p.modo === 'bandera' ? 'bandera' : 'valla', x0, yh - 20, { size: 11 });
      let dt, vc;
      if (p.modo === 'bandera') { dt = baj[0] - sub[0]; vc = p.w / dt; }
      else { dt = sub[1] - sub[0]; vc = p.w / dt; }
      sim.set('dt', EM.fix(dt * 1000, 3) + ' ms' + (p.modo === 'valla' ? ' entre dos bloqueos' : ' de bloqueo'));
      sim.set('vc', EM.fix(vc, 4) + ' m/s');
      sim.set('e', EM.fix((100 * (vc - p.v)) / p.v, 2) + ' %' + (p.modo === 'bandera' ? ' · ancho efectivo ' + EM.fix(1000 * (p.w + p.d * (1 - 2 * p.f)), 2) + ' mm' : ''));
    });
  });
})();
