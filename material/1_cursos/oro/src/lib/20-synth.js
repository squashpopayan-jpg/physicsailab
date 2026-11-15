/* ===================================================================
   20-synth.js — Mercado sintético de oro: caminata aleatoria con volatilidad intradía,
   agrupamiento de volatilidad y saltos; con perillas opcionales de tendencia y reversión.
   Con trend = 0 y rev = 0 el precio es una martingala: NO hay ventaja posible (antes de costos).
   =================================================================== */
(function () {
  'use strict';
  const ML = (window.ML = window.ML || {});
  const L = (ML.L = ML.L || {});
  const Y = (L.synth = {});

  /* Rango medio de una vela M5 por hora UTC en el oro real (VT, mayo 2025 – octubre 2026) */
  Y.HOUR_RANGE = [5.3, 6.64, 5.04, 3.96, 3.25, 4.66, 4.88, 4.68, 4.72, 4.34, 4.06, 4.48, 5.77, 7.38, 7.65, 6.62, 5.26, 4.58, 4.53, 4.21, 3.47, 4.24, 4.15, 4.53];
  const MEAN_RANGE = Y.HOUR_RANGE.reduce((a, b) => a + b, 0) / 24;

  Y.DEFAULTS = { days: 60, bm: 5, sigma: 3.1, volVol: 0.35, volPersist: 0.995, jumpP: 0.002, jumpMult: 4, trend: 0, trendPersist: 0.98, rev: 0, spread: 0.27, seed: 1, p0: 4000, start: Date.UTC(2026, 0, 5) / 60000 };

  Y.gen = function (over) {
    const o = Object.assign({}, Y.DEFAULTS, over || {});
    const rng = L.stats.rng(o.seed), bm = o.bm;
    const perDay = 1440 / bm, n = o.days * perDay;
    /* solo días hábiles consecutivos (lunes a viernes) */
    const t = new Float64Array(n), op = new Float64Array(n), hi = new Float64Array(n), lo = new Float64Array(n), cl = new Float64Array(n), sp = new Float64Array(n);
    let day0 = Math.floor(o.start / 1440), made = 0, di = 0;
    let p = o.p0, x = 0, m = 0, anchor = p;
    const sdV = o.volVol * Math.sqrt(1 - o.volPersist * o.volPersist);
    const aA = 1 / 48;
    while (made < o.days) {
      const d = day0 + di++;
      const wd = (d + 3) % 7;
      if (wd >= 5) continue;
      for (let b = 0; b < perDay; b++) {
        const idx = made * perDay + b;
        const tm = d * 1440 + b * bm;
        const hour = Math.floor((b * bm) / 60);
        x = o.volPersist * x + sdV * rng.normal();
        let sig = o.sigma * (Y.HOUR_RANGE[hour] / MEAN_RANGE) * Math.exp(x - (o.volVol * o.volVol) / 2) * Math.sqrt(bm / 5);
        if (rng() < o.jumpP) sig *= o.jumpMult;
        if (o.trend > 0) m = o.trendPersist * m + Math.sqrt(1 - o.trendPersist * o.trendPersist) * o.trend * sig * rng.normal();
        let drift = m;
        if (o.rev > 0) drift -= (o.rev * (p - anchor)) * aA;
        const open = p;
        /* Extremos de un puente browniano entre apertura y cierre: máx/mín con la distribución exacta */
        const close = open + drift + sig * rng.normal();
        const hMax = 0.5 * (open + close + Math.sqrt((close - open) ** 2 - 2 * sig * sig * Math.log(1 - rng())));
        const lMin = 0.5 * (open + close - Math.sqrt((close - open) ** 2 - 2 * sig * sig * Math.log(1 - rng())));
        p = close;
        anchor += aA * (p - anchor);
        t[idx] = tm;
        op[idx] = Math.round(open * 100) / 100; cl[idx] = Math.round(p * 100) / 100;
        hi[idx] = Math.max(Math.round(hMax * 100) / 100, op[idx], cl[idx]); lo[idx] = Math.min(Math.round(lMin * 100) / 100, op[idx], cl[idx]);
        sp[idx] = o.spread;
        p = cl[idx];
      }
      made++;
    }
    return { n, t, o: op, h: hi, l: lo, c: cl, sp, bm, name: 'synth' + o.seed, synthetic: true };
  };
})();
