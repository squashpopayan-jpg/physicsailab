/* Portada: cuerda que se puede pulsar con el puntero */
(function () {
  'use strict';
  const EM = window.EM;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const N = 241;
    const S = new EM.String1D(N, { gamma: 0.15, courant: 0.95 });
    let drag = null;
    const geo = () => ({ x0: 30, x1: cv.w - 30, y0: cv.h * 0.42, A: cv.h * 0.3 });
    const pluck = (xp, yp) => {
      /* forma triangular con vértice en (xp, yp) */
      for (let i = 0; i < N; i++) { const x = i / (N - 1); S.y[i] = x < xp ? (yp * x) / xp : (yp * (1 - x)) / (1 - xp); S.yp[i] = S.y[i]; }
    };
    pluck(0.22, 0.6);
    EM.pointer(cv, {
      down: (x, y) => { const g = geo(); if (x < g.x0 || x > g.x1) return null; drag = 1; return 1; },
      move: (_, x, y) => {
        const g = geo();
        const xp = EM.M.clamp((x - g.x0) / (g.x1 - g.x0), 0.03, 0.97);
        const yp = EM.M.clamp(-(y - g.y0) / g.A, -1, 1);
        pluck(xp, yp);
        sim.redraw();
      },
      up: () => { drag = null; },
      hover: () => true
    });
    sim.hint('Arrastra la cuerda y suéltala', cv);
    const spec = new Float64Array(12);
    sim.animate((dt) => {
      if (drag) return;
      const n = Math.max(1, Math.round(dt / 0.0028));
      for (let k = 0; k < n * 2; k++) S.step();
      const [Kc, Uc] = S.energy();
      if (Kc + Uc < 0.01) pluck(0.08 + 0.4 * Math.random(), (Math.random() < 0.5 ? -1 : 1) * (0.45 + 0.35 * Math.random()));
    });
    sim.onDraw(() => {
      const g = geo(), ctx = cv.ctx;
      EM.draw.clear(cv);
      /* clavijas */
      ctx.fillStyle = EM.col('--ink-2');
      ctx.fillRect(g.x0 - 8, g.y0 - 16, 8, 32);
      ctx.fillRect(g.x1, g.y0 - 16, 8, 32);
      const pts = [];
      for (let i = 0; i < N; i++) pts.push([g.x0 + ((g.x1 - g.x0) * i) / (N - 1), g.y0 - S.y[i] * g.A]);
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2.6 });
      /* espectro de modos: proyección sobre sen(nπx) */
      for (let n = 1; n <= spec.length; n++) {
        let s = 0;
        for (let i = 0; i < N; i++) s += S.y[i] * Math.sin((n * Math.PI * i) / (N - 1));
        spec[n - 1] = Math.abs((2 * s) / (N - 1));
      }
      const bx = g.x0, by = cv.h - 26, bw = (g.x1 - g.x0) / spec.length, H = cv.h * 0.2;
      const mx = Math.max(0.05, ...spec);
      EM.text(ctx, 'amplitud de cada armónico', bx, by - H - 10, { size: 11.5, color: '--ink-3' });
      for (let n = 0; n < spec.length; n++) {
        const h = (spec[n] / mx) * H;
        ctx.fillStyle = EM.alpha('--c1', 0.75);
        ctx.fillRect(bx + n * bw + 3, by - h, bw - 6, h);
        EM.text(ctx, String(n + 1), bx + n * bw + bw / 2, by + 14, { size: 10.5, mono: true, color: '--ink-3', align: 'center' });
      }
    });
  });
})();
