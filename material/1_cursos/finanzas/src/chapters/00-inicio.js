/* Portada: abanico de trayectorias de un ahorro mensual que se construye en vivo */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L;
  CC.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    const Y = 30, N = 120;
    let run = 0, sim0, fan, t = 0, hold = 0;
    const xs = Array.from({ length: Y + 1 }, (_, k) => k);
    const reset = () => {
      run++;
      sim0 = L.inv.paths({ mu: 0.06, sigma: 0.12, anos: Y, aporte: 300000, p0: 0, n: N, seed: 100 + run });
      fan = L.inv.fan(sim0.paths);
      t = 0; hold = 0;
    };
    reset();
    sim.animate((dt) => {
      if (t < Y) t = Math.min(Y, t + dt * 5.5);
      else if ((hold += dt) > 3.2) reset();
    });
    sim.onDraw(() => {
      paint();
    });
    function paint() {
      CC.draw.clear(cv);
      const k = Math.floor(t), f = t - k;
      const ymax = Math.ceil((fan[4][Y] * 1.06) / 50e6) * 50e6;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Y, ymin: 0, ymax, xlabel: 'años ahorrando', ylabel: 'saldo en pesos de hoy', yfmt: CC.copAxis, ml: 84 });
      pl.frame();
      const cut = (arr) => { const o = arr.slice(0, k + 1); if (k < Y) o.push(arr[k] + (arr[k + 1] - arr[k]) * f); return o; };
      const xc = cut(xs);
      for (const p of sim0.paths) pl.xy(xc, cut(p), { color: '--c1', width: 1, alpha: 0.16 });
      pl.between(xc, cut(fan[0]), cut(fan[4]), { color: '--c1', alpha: 0.1 });
      pl.between(xc, cut(fan[1]), cut(fan[3]), { color: '--c1', alpha: 0.18 });
      pl.xy(xc, cut(fan[2]), { color: '--c1', width: 2.6 });
      pl.xy(xc, cut(sim0.aportado), { color: '--ink', width: 2, dash: [6, 4] });
      const yr = Math.min(Y, Math.round(t));
      const med = fan[2][yr], ap = sim0.aportado[yr];
      CC.text(cv.ctx, `Año ${yr}`, pl.ix + 10, pl.iy + 18, { size: 15, weight: 700, color: '--ink' });
      CC.text(cv.ctx, `aportado ${CC.copS(ap)}`, pl.ix + 10, pl.iy + 38, { size: 12, color: '--ink-2', halo: true });
      CC.text(cv.ctx, `mediana ${CC.copS(med)}`, pl.ix + 10, pl.iy + 55, { size: 12, color: '--c1', halo: true, weight: 650 });
      if (yr > 0) CC.text(cv.ctx, `rango probable ${CC.copAxis(fan[1][yr])} a ${CC.copAxis(fan[3][yr])}`, pl.ix + 10, pl.iy + 72, { size: 11.5, color: '--ink-3', halo: true });
    }
  });
})();
