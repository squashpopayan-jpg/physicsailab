/* Capítulo 31 — Lentes convergentes */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('lentes-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'lentes', aspect: [1.7, 1.2],
      cols: [{ k: 'so', t: 'sₒ (m)', d: 3 }, { k: 'si', t: 'sᵢ (m)', d: 3 }, { k: 'u', t: 'rango ± (m)', d: 3 }, { k: 'x', t: '1/sₒ (m⁻¹)', d: 3 }, { k: 'y', t: '1/sᵢ (m⁻¹)', d: 3 }],
      controles(sim) {
        sim.group('Banco óptico');
        sim.slider('f', { label: 'Distancia focal real de la lupa', min: 0.05, max: 0.25, step: 0.005, value: 0.1, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('so', { label: 'Distancia objeto–lente', min: 0.03, max: 0.6, step: 0.005, value: 0.15, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('sp', { label: 'Distancia lente–pantalla', min: 0.05, max: 0.9, step: 0.005, value: 0.3, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('dl', { label: 'Diámetro de la lupa', min: 0.02, max: 0.08, step: 0.005, value: 0.05, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, sc = (W * 0.86) / 1.0, x0 = W * 0.05, y0 = H * 0.55, xl = x0 + p.so * sc;
        D.regla(ctx, x0, H * 0.9, x0 + sc, H * 0.9, sc / 100, { ancho: 12 });
        D.line(ctx, 0, y0, W, y0, { color: '--ink-3', dash: [4, 4], width: 0.8 });
        const ho = H * 0.16;
        D.arrow(ctx, x0, y0, x0, y0 - ho, { color: '--c4', width: 3 });
        D.lente(ctx, xl, y0, Math.max(40, p.dl * sc * 1.6), true);
        ctx.save(); ctx.fillStyle = EM.col('--ink'); [-1, 1].forEach((s) => { ctx.beginPath(); ctx.arc(xl + s * p.f * sc, y0, 3, 0, 7); ctx.fill(); }); ctx.restore();
        D.label(ctx, 'F', xl - p.f * sc, y0 + 16, { align: 'center' }); D.label(ctx, 'F', xl + p.f * sc, y0 + 16, { align: 'center' });
        const si = MO.imagen(p.f, p.so), M = -si / p.so;
        /* rayos principales */
        const xo = x0, yo = y0 - ho;
        if (si > 0 && isFinite(si)) {
          const xi = xl + si * sc, yi = y0 - M * ho;
          D.haz(ctx, [[xo, yo], [xl, yo], [xi, yi]], { color: '#F2A900', width: 1.4 });
          D.haz(ctx, [[xo, yo], [xi, yi]], { color: '#F2A900', width: 1.4 });
          if (xi < W) D.arrow(ctx, xi, y0, xi, yi, { color: '--c4', width: 2, alpha: 0.5 });
        } else {
          D.haz(ctx, [[xo, yo], [xl, yo], [W, yo + (W - xl) * (ho / (p.f * sc))]], { color: '#F2A900', width: 1.4 });
          D.label(ctx, si < 0 ? 'imagen virtual: mire a través de la lente' : 'imagen en el infinito', W * 0.55, H * 0.12, { weight: 650 });
        }
        const xs = xl + p.sp * sc, dof = 0.002 + (0.04 * si * si) / Math.max(0.02, p.dl * Math.max(0.05, si));
        const nitida = si > 0 && Math.abs(p.sp - si) < Math.min(0.03, dof);
        D.rect(ctx, xs, y0 - H * 0.35, 6, H * 0.6, { fill: nitida ? '--c3' : '--surface-3' });
        D.label(ctx, nitida ? 'nítida' : 'borrosa', xs + 10, y0 - H * 0.3, { color: nitida ? '--c3' : '--ink-3', weight: 650 });
      },
      medir(p, rnd) {
        const si = MO.imagen(p.f, p.so);
        if (!(si > 0) || si > 1.5) return { so: p.so, si: '—', u: '—', x: 1 / p.so, y: NaN };
        const u = Math.min(0.02, 0.002 + (0.02 * si * si) / Math.max(0.01, p.dl * si));
        const sm = L.quant(si + rnd.gauss(0, u / 2), 0.001), so = L.quant(p.so + rnd.gauss(0, 0.001), 0.001);
        return { so, si: sm, u, x: 1 / so, y: 1 / sm };
      },
      serie(p, rnd, st) { const out = []; for (const so of [0.15, 0.18, 0.2, 0.25, 0.3, 0.4, 0.5].map((x) => x * (p.f / 0.1))) out.push(this.medir(Object.assign({}, p, { so }), rnd, st)); return out; },
      grafica(rows) { const r = rows.filter((x) => isFinite(x.y)); return { x: r.map((x) => x.x), y: r.map((x) => x.y), ey: r.map((x) => x.u / (x.si * x.si)), xl: '1/sₒ (m⁻¹)', yl: '1/sᵢ (m⁻¹)', ajuste: 'recta', xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const si = MO.imagen(p.f, p.so), out = [['si', 'Imagen teórica sᵢ', isFinite(si) && si > 0 ? EM.fix(si * 100, 1) + ' cm · aumento ' + EM.fix(-si / p.so, 2) : 'virtual o en el infinito']];
        const Db = 0.6, dB = Math.sqrt(Db * Db - 4 * p.f * Db);
        if (isFinite(dB)) out.push(['bes', 'Bessel con D = 60 cm: d', EM.fix(dB * 100, 1) + ' cm → f = ' + EM.fix(MO.fBessel(Db, dB) * 100, 2) + ' cm']);
        if (fit && rows.length >= 3) {
          const f = 1 / fit.b, uf = fit.sb / (fit.b * fit.b);
          out.push(['pen', 'Pendiente (debe ser −1)', L.pm(fit.m, fit.sm)]);
          out.push(['f', 'f = 1/intercepto', L.pm(f * 100, uf * 100, 'cm'), true]);
          out.push(['z', 'Frente a la f real', L.compat(f, uf, p.f, 0).html]);
        }
        return out;
      }
    });
  });
})();
