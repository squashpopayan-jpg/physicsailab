/* Portada: gas de partículas en un cilindro con pistón */
(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    sim.seg('pr', { label: 'Pared izquierda', options: [['ad', 'Aislada (adiabático)'], ['iso', 'A temperatura fija (isotérmico)']], value: 'ad' });
    const g = new EM.GasBox({ N: 160, r: 0.011, W: 0.75, H: 1, T: 1 });
    let t = 0;
    const trail = [];
    sim.onChange = () => { g.thermal = sim.p.pr === 'iso' ? 1 : null; g.W = 0.75; g.vw = 0; g.reset(1); trail.length = 0; t = 0; };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const sub = 6;
      for (let s = 0; s < sub; s++) {
        const h = Math.min(dt, 0.03) / sub * 0.6;
        t += h;
        const W = 0.75 + 0.35 * Math.sin(0.5 * t);
        g.vw = (W - g.W) / h; g.W = W;
        g.step(h);
      }
      const P = g.pressure(0.8);
      if (P !== null) { trail.push([g.W * g.H, P]); if (trail.length > 900) trail.shift(); }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, Hc = cv.h;
      EM.draw.clear(cv);
      const bx = 18, by = 16, bh = Hc * 0.48, bw = (Wc - 36) / 1.1;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw * 1.1, bh);
      if (g.thermal) { ctx.fillStyle = EM.alpha('--c2', 0.5); ctx.fillRect(bx - 6, by, 6, bh); }
      g.draw(ctx, bx, by, bw * g.W, bh, { speedColor: true, Tref: 1 });
      const px = bx + bw * g.W;
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(px, by + 2, 8, bh - 4); ctx.fillRect(px + 8, by + bh / 2 - 3, bw * 1.1 - bw * g.W, 6);
      const pl = new EM.Plot(ctx, { x: 0, y: by + bh + 6, w: Wc, h: Hc - bh - by - 6, xmin: 0.35, xmax: 1.15, ymin: 0, ymax: 420, xlabel: 'volumen (área de la caja)', ylabel: 'P', ml: 44, mb: 34, yticks: [] });
      pl.frame();
      pl.fn((V) => (g.N * 1) / V, { color: '--c3', width: 1.2, dash: [5, 4] });
      pl.fn((V) => (g.N * 1 / 0.75) * Math.pow(0.75 / V, 2), { color: '--c5', width: 1.2, dash: [2, 3] });
      pl.path(trail, { color: '--accent', width: 1.6 });
      if (trail.length) pl.dot(...trail[trail.length - 1]);
      pl.legend([{ label: 'isoterma PV = NkT', color: '--c3', dash: [5, 4] }, { label: 'adiabática PV² = cte (2D)', color: '--c5', dash: [2, 3] }], 'tr');
      EM.text(ctx, 'T cinética = ' + EM.fix(g.Tkin(), 2) + ' (unidades reducidas)', Wc / 2, by + bh + 2 + 0, { size: 11, align: 'center', color: '--ink-3', baseline: 'top' });
    });
  });
})();
