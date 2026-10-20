/* Portada — péndulo animado con la gravedad del municipio elegido */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, D = EM.draw;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.05 });
    sim.body.classList.add('below');
    const st = { th: 0.35, w: 0, t: 0 };
    const Lm = 0.75;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, loc = EM.local();
      D.clear(cv);
      const ymesa = H * 0.86;
      D.mesa(ctx, W * 0.06, W * 0.94, ymesa, { alto: H * 0.1 });
      const [px, py] = D.soporte(ctx, W * 0.22, ymesa, H * 0.7, { brazo: W * 0.4 });
      const Lpx = H * 0.46, bx = px + Lpx * Math.sin(st.th), by = py + Lpx * Math.cos(st.th);
      D.rect(ctx, px - 7, py - 9, 14, 11, { fill: '--wood', r: 2 });
      D.hilo(ctx, px, py, bx, by);
      D.bob(ctx, bx, by, 13, { color: '--accent' });
      D.regla(ctx, W * 0.86, ymesa - 4, W * 0.86, ymesa - H * 0.66, (H * 0.66) / 100 * 1.4, { ancho: 14 });
      const T = MO.Tpendulo(Lm, 0.35, loc.g);
      EM.text(ctx, loc.nombre + ' · ' + EM.fix(loc.h, 0) + ' m s. n. m.', W * 0.5, H * 0.07, { size: 13, align: 'center', weight: 650, color: '--ink' });
      EM.text(ctx, 'g = ' + EM.fix(loc.g, 3) + ' m/s²   ·   T = ' + EM.fix(T, 3) + ' s con L = 0,75 m', W * 0.5, H * 0.07 + 18, { size: 12, align: 'center', color: '--ink-2', mono: true });
    });
    sim.animate((dt) => {
      const g = EM.local().g, n = Math.max(1, Math.ceil(dt / 0.005)), h = dt / n;
      for (let i = 0; i < n; i++) { const a = -(g / Lm) * Math.sin(st.th); st.w += a * h; st.th += st.w * h; }
    });
    EM.onLocal.push(() => sim.redraw());
  });
})();
