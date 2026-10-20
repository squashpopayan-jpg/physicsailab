/* Portada: estela de von Kármán detrás de un cilindro con Lattice Boltzmann */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    const nx = 168, ny = 70, D = 10, U = 0.1, Re = 100;
    const cx = Math.round(nx * 0.2), cy = ny / 2;
    let L, w, tr, probe, t;
    const reset = () => {
      L = new FL.LBM(nx, ny, { mode: 'tunnel', U, nu: (U * D) / Re, Cs: 0.05 });
      L.addDisk(cx, cy + 0.6, D / 2);
      /* perturbación asimétrica para que el desprendimiento empiece pronto */
      L.init(U, 0, (i, j) => [U, i > cx && i < cx + 4 * D ? 0.02 * Math.sin((Math.PI * (i - cx)) / (2 * D)) * Math.exp(-Math.pow((j - cy) / D, 2)) : 0]);
      w = new Float32Array(nx * ny);
      tr = new EM.flow.Tracers(240, (i, init) => [init ? Math.random() * nx * 0.9 : 0.5 + Math.random() * 2, 1 + Math.random() * (ny - 2)], { life: 2400, trail: 9 });
      probe = []; t = 0;
    };
    reset();
    const alive = (x, y) => x > 0 && x < nx - 1 && y > 0 && y < ny - 1 && !L.solid[Math.round(y) * nx + Math.round(x)];
    sim.animate(() => {
      const t0 = performance.now();
      let k = 0;
      do {
        L.step(); k++; t++;
        const v = L.uy[(cy | 0) * nx + cx + 3 * D];
        probe.push(v / U);
        if (probe.length > 4000) probe.shift();
      } while (performance.now() - t0 < 10 && k < 14);
      tr.step((x, y) => L.vel(x, y), k, alive);
    });
    /* número de Strouhal: cruces ascendentes con histéresis en la ventana final, pasado el transitorio */
    const strouhal = () => {
      if (t < 3500) return null;
      const last = probe.slice(-2500);
      let m = 0; for (const v of last) m += v; m /= last.length;
      let amp = 0; for (const v of last) amp = Math.max(amp, Math.abs(v - m));
      if (amp < 0.05) return null;
      const cr = []; let lo = false;
      for (let i = 0; i < last.length; i++) { if (last[i] < m - 0.3 * amp) lo = true; else if (lo && last[i] > m + 0.3 * amp) { cr.push(i); lo = false; } }
      if (cr.length < 3) return null;
      const T = (cr[cr.length - 1] - cr[0]) / (cr.length - 1);
      return D / (U * T);
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, Hc = cv.h;
      EM.draw.clear(cv);
      const th = Math.min(Hc * 0.58, (Wc * ny) / nx), r = { x: 0, y: 0, w: Wc, h: th };
      L.curl(w);
      EM.flow.paint(ctx, w, nx, ny, r, EM.flow.vortMap((2.2 * U) / D), { mask: L.solid });
      const sx = Wc / nx, sy = th / ny, map = (x, y) => [x * sx, th - y * sy];
      tr.draw(ctx, map, { color: '--ink', alpha: 0.45, width: 1 });
      ctx.fillStyle = EM.col('--solid');
      ctx.beginPath(); ctx.ellipse(cx * sx, th - (cy + 0.6) * sy, (D / 2) * sx, (D / 2) * sy, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1; ctx.stroke();
      const pp = map(cx + 3 * D, cy);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(pp[0], pp[1], 3, 0, 7); ctx.stroke();
      EM.text(ctx, 'Re = ' + Re + ' · color: vorticidad (rojo antihoraria, azul horaria)', 8, th - 8, { size: 11, color: '--ink-2', halo: true });
      let am = 0.2; for (const v of probe) am = Math.max(am, Math.abs(v));
      am = Math.ceil(am * 5) / 5;
      const n = probe.length, pl = new EM.Plot(ctx, { x: 0, y: th + 4, w: Wc, h: Hc - th - 4, xmin: 0, xmax: 4000 * U / D, ymin: -am, ymax: am, xlabel: 'tiempo adimensional tU/D (ventana móvil)', ylabel: 'v/U en la sonda', ml: 46, mb: 36, mt: 10 });
      pl.frame();
      if (n > 1) { const xs = new Array(n), ys = new Array(n); for (let i = 0; i < n; i++) { xs[i] = ((4000 - n + i) * U) / D; ys[i] = probe[i]; } pl.xy(xs, ys, { color: '--accent', width: 1.6 }); }
      const St = strouhal();
      EM.text(ctx, St ? 'número de Strouhal St = fD/U ≈ ' + EM.fix(St, 3) : 'esperando el desprendimiento de vórtices…', pl.ix + 6, pl.iy + 14, { size: 11.5, color: '--ink', halo: true });
    });
  });
})();
