/* Capítulo 38 — Riel de aire con fotopuertas */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const W_BAN = 0.05, DIST = 0.5, IE = 0.001;
  const vMed = (v, rnd) => { const dt = L.quant(W_BAN / v + rnd.gauss(0, 4e-6), 4e-6); const w = W_BAN * (1 + rnd.gauss(0, 0.0005)); return w / dt; };
  EM.defineSim('rielaire-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'riel-aire', aspect: [1.7, 1.2],
      cols: [{ k: 'x', t: 'mg (N) o p antes (g·m/s)', d: 4 }, { k: 'v1', t: 'v₁ (m/s)', d: 4 }, { k: 'v2', t: 'v₂ (m/s)', d: 4 }, { k: 'y', t: 'a (m/s²) o p después', d: 4 }, { k: 'K', t: 'K después/antes', d: 3 }],
      controles(sim) {
        sim.group('Experimento');
        sim.seg('modo', { label: 'Parte', options: [['ley', 'Segunda ley'], ['cho', 'Choques']], value: 'ley' });
        sim.slider('n', { label: 'Arandelas de 2 g en el portapesas (de 10)', min: 1, max: 10, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
        sim.slider('inc', { label: 'Desnivel del riel', min: -2, max: 2, step: 0.1, value: 0, unit: 'mm/m', fmt: (v) => EM.fix(v, 1) });
        sim.seg('tipo', { label: 'Choque', options: [['vel', 'Velcro (inelástico)'], ['iman', 'Imanes (casi elástico)']], value: 'vel' });
        sim.slider('m2', { label: 'Masa del deslizador en reposo', min: 0.1, max: 0.4, step: 0.01, value: 0.2, unit: 'g', fmt: (v) => Math.round(v * 1000) });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 3; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, x0 = W * 0.04, x1 = W * 0.9, y = H * 0.5;
        D.rect(ctx, x0, y, x1 - x0, 16, { fill: '--plastic', r: 8 });
        for (let x = x0 + 8; x < x1 - 8; x += 9) { ctx.save(); ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(x, y + 4, 1.1, 0, 7); ctx.fill(); ctx.restore(); }
        const sc = (x1 - x0) / 2;
        for (const xf of [0.6, 1.1]) { const X = x0 + xf * sc; D.rect(ctx, X - 4, y - 50, 8, 40, { fill: '--plastic-dark', r: 2 }); D.haz(ctx, [[X, y - 46], [X, y - 14]], { width: 1, alpha: 0.4 }); }
        const t = st.ta || 0;
        if (p.modo === 'ley') {
          const g = EM.local().g, m = 0.002 * p.n, a = (m * g + 0.22 * g * p.inc * 1e-3) / (0.22 + IE), xg = Math.min(1.7, 0.3 + 0.5 * a * t * t);
          const X = x0 + xg * sc;
          D.rect(ctx, X - 30, y - 8, 60, 10, { fill: '--c1', r: 3 }); D.rect(ctx, X - 2, y - 34, 4, 26, { fill: '--ink' });
          D.polea(ctx, x1 + 12, y, 10); D.hilo(ctx, X + 30, y - 3, x1 + 12, y - 10); D.hilo(ctx, x1 + 22, y, x1 + 22, y + 40 + xg * 30);
          D.rect(ctx, x1 + 16, y + 40 + xg * 30, 12, 8 + p.n * 2, { fill: '--metal-dark' });
        } else {
          const v1 = 0.4, [v1p, v2p] = MO.choque1D(0.2, v1, p.m2, 0, p.tipo === 'vel' ? 0 : 0.95);
          const tc = 1.5, xc = 0.85;
          let xa = xc - 0.16 - v1 * (tc - t), xb = xc;
          if (t > tc) { xa = xc - 0.16 + v1p * (t - tc); xb = xc + v2p * (t - tc); }
          D.rect(ctx, x0 + xa * sc - 30, y - 8, 60, 10, { fill: '--c1', r: 3 });
          D.rect(ctx, x0 + xb * sc - 30, y - 8, 60, 10, { fill: '--c4', r: 3 });
        }
        D.label(ctx, 'fotopuertas separadas 50 cm', x0 + 0.6 * sc, y - 58);
      },
      medir(p, rnd) {
        const g = EM.local().g;
        if (p.modo === 'ley') {
          const m = 0.002 * p.n, a = (m * g + 0.22 * g * p.inc * 1e-3) / (0.22 + IE);
          const v1t = Math.sqrt(2 * a * 0.1), v2t = Math.sqrt(v1t * v1t + 2 * a * DIST);
          const v1 = vMed(v1t, rnd), v2 = vMed(v2t, rnd);
          return { x: m * g, v1, v2, y: (v2 * v2 - v1 * v1) / (2 * DIST), K: '—' };
        }
        const v1 = 0.2 + rnd() * 0.4, e = p.tipo === 'vel' ? 0 : 0.95, [v1p, v2p] = MO.choque1D(0.2, v1, p.m2, 0, e);
        const a = vMed(v1, rnd), b = Math.abs(v1p) > 0.005 ? vMed(Math.abs(v1p), rnd) * Math.sign(v1p) : 0, c = vMed(v2p, rnd);
        const pa = 0.2 * a * 1000, pd = (0.2 * b + p.m2 * c) * 1000, K = (0.2 * b * b + p.m2 * c * c) / (0.2 * a * a);
        return { x: pa, v1: a, v2: c, y: pd, K };
      },
      serie(p, rnd, st) { const out = []; if (p.modo === 'ley') { for (let n = 1; n <= 10; n++) out.push(this.medir(Object.assign({}, p, { n }), rnd, st)); } else for (let k = 0; k < 6; k++) out.push(this.medir(p, rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'ley') return { x: rows.map((r) => r.x), y: rows.map((r) => r.y), xl: 'mg (N)', yl: 'a (m/s²)', ajuste: 'recta', xextra: [0], yextra: [0] };
        return { x: rows.map((r) => r.x), y: rows.map((r) => r.y), xl: 'p antes (g·m/s)', yl: 'p después (g·m/s)', ajuste: 'origen', curva: (x) => x, xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const out = [];
        if (p.modo === 'ley') {
          out.push(['M', 'Masa total efectiva real', EM.fix((0.22 + IE) * 1000, 1) + ' g']);
          if (fit && rows.length >= 3) { out.push(['Mm', 'Masa = 1/pendiente', L.pm(1000 / fit.m, (1000 * fit.sm) / (fit.m * fit.m), 'g'), true]); out.push(['b', 'Intercepto', L.pm(fit.b, fit.sb, 'm/s²')]); }
        } else {
          if (fit && rows.length >= 2) out.push(['pp', 'p después / p antes', L.pm(fit.m, fit.sm), true]);
          if (rows.length) out.push(['K', 'K después / K antes', EM.fix(L.mean(rows.map((r) => r.K)), 3)]);
        }
        return out;
      }
    });
  });
})();
