/* Capítulo 28 — Ondas en un resorte largo */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  const L0 = 0.06;
  const tRec = (p, Lx) => Math.sqrt((p.M * Lx) / (p.k * (Lx - L0)));
  EM.defineSim('slinky-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'ondas-resorte', aspect: [1.8, 1.2],
      cols: [{ k: 'L', t: 'L (m)', d: 2 }, { k: 'T', t: 'tensión (N)', d: 2 }, { k: 't8', t: 't de 4 idas y vueltas (s)', d: 2 }, { k: 't1', t: 't de un recorrido (s)', d: 3 }, { k: 'v', t: 'v (m/s)', d: 2 }],
      controles(sim) {
        sim.group('Resorte');
        sim.slider('M', { label: 'Masa del resorte', min: 0.05, max: 0.4, step: 0.005, value: 0.215, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('k', { label: 'Constante del resorte completo', min: 0.3, max: 3, step: 0.05, value: 0.9, unit: 'N/m', fmt: (v) => EM.fix(v, 2) });
        sim.slider('L', { label: 'Estiramiento', min: 1, max: 6, step: 0.1, value: 3, unit: 'm', fmt: (v) => EM.fix(v, 1) });
        sim.seg('ext', { label: 'Extremo derecho', options: [['fijo', 'Fijo'], ['libre', 'Libre']], value: 'fijo' });
        sim.seg('modo', { label: 'Gráfica', options: [['t', 'Tiempo de recorrido contra L'], ['T', 'Tensión contra L']], value: 't' });
      },
      paso(dt, st, p) { st.tt = ((st.tt || 0) + dt * 0.35) % (2 * tRec(p, p.L)); },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, x0 = W * 0.06, x1 = W * 0.94, y = H * 0.55, tr = tRec(p, p.L);
        const s = (st.tt || 0) / tr; /* 0–2: ida y vuelta */
        const pos = s <= 1 ? s : 2 - s, signo = s <= 1 ? 1 : p.ext === 'fijo' ? -1 : 1;
        const n = 160, A = H * 0.18, w = 0.06;
        ctx.save(); ctx.strokeStyle = EM.col('--metal-dark'); ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= n * 6; i++) {
          const u = i / (n * 6), dyp = signo * A * Math.exp(-(((u - pos) / w) ** 2));
          const xx = x0 + u * (x1 - x0), yy = y + dyp + 7 * Math.sin(u * n * 2 * Math.PI);
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke(); ctx.restore();
        D.rect(ctx, x0 - 10, y - 18, 10, 36, { fill: '--c1', r: 3 });
        if (p.ext === 'fijo') D.rect(ctx, x1, y - 30, 12, 60, { fill: '--metal-dark' }); else { D.hilo(ctx, x1, y, x1 + 30, y); D.rect(ctx, x1 + 30, y - 30, 10, 60, { fill: '--metal-dark' }); }
        D.cota(ctx, x0, H * 0.88, x1, H * 0.88, 'L = ' + EM.fix(p.L, 1) + ' m', { size: 11 });
        D.label(ctx, 'v = ' + EM.fix(p.L / tr, 2) + ' m/s · recorrido en ' + EM.fix(tr, 3) + ' s (animación lenta)', x0, H * 0.12);
      },
      medir(p, rnd) {
        const tr = tRec(p, p.L), T = L.quant(p.k * (p.L - L0) + rnd.gauss(0, 0.02), 0.05);
        const t8 = L.quant(8 * tr + Math.SQRT2 * rnd.gauss(0, 0.09), 0.01);
        return { L: p.L, T, t8, t1: t8 / 8, v: p.L / (t8 / 8) };
      },
      serie(p, rnd, st) { const out = []; for (const Lx of [2, 3, 4, 5]) for (let k = 0; k < 3; k++) out.push(this.medir(Object.assign({}, p, { L: Lx }), rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'T') return { x: rows.map((r) => r.L), y: rows.map((r) => r.T), xl: 'L (m)', yl: 'tensión (N)', ajuste: 'recta', xextra: [0], yextra: [0] };
        const tr0 = Math.sqrt(p.M / p.k);
        return { x: rows.map((r) => r.L), y: rows.map((r) => r.t1), xl: 'L (m)', yl: 't de un recorrido (s)', ajuste: 'recta', curva: (x) => (x > L0 ? tRec(p, x) : NaN), xextra: [0, 6], yr: [0, tr0 * 1.6] };
      },
      resultado(fit, rows, p) {
        const out = [['mod', '√(M/k) del modelo', EM.fix(Math.sqrt(p.M / p.k), 3) + ' s']];
        if (fit && rows.length >= 3) {
          if (p.modo === 'T') out.push(['k', 'k = pendiente de T–L', L.pm(fit.m, fit.sm, 'N/m'), true]);
          else { out.push(['pen', 'Pendiente de t–L (≈ 0)', L.pm(fit.m, fit.sm, 's/m'), true]); out.push(['tm', 'Tiempo promedio de un recorrido', L.pm(L.mean(rows.map((r) => r.t1)), L.sem(rows.map((r) => r.t1)), 's')]); }
        }
        return out;
      }
    });
  });
})();
