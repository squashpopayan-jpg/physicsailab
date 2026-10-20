/* Capítulo 41 — Ondas estacionarias: experimento de Melde */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* Amplitud relativa de la cuerda forzada con amortiguamiento ζ */
  const amp = (f, f1) => { const x = f / f1; let A = 0; for (let n = 1; n <= 12; n++) A = Math.max(A, 1 / Math.sqrt((x * x - n * n) ** 2 + (0.03 * n * x) ** 2)); return Math.min(30, A); };
  EM.defineSim('melde-banco', function (sim) {
    const f1 = (p) => MO.fMelde(1, p.L, p.M * EM.local().g, p.mu / 1000);
    EM.banco(sim, {
      nombre: 'melde', aspect: [1.8, 1.2],
      cols: [{ k: 'M', t: 'M (kg)', d: 3 }, { k: 'n', t: 'n vientres', d: 0 }, { k: 'f', t: 'f (Hz)', d: 1 }, { k: 'rT', t: '√T (N½)', d: 4 }],
      controles(sim) {
        sim.group('Cuerda y vibrador');
        sim.slider('mu', { label: 'Densidad lineal μ', min: 0.1, max: 2, step: 0.01, value: 0.226, unit: 'g/m', fmt: (v) => EM.fix(v, 3) });
        sim.slider('L', { label: 'Longitud entre nodos', min: 0.5, max: 2, step: 0.01, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('M', { label: 'Masa colgante', min: 0.05, max: 0.4, step: 0.01, value: 0.1, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('f', { label: 'Frecuencia del generador', min: 5, max: 250, step: 0.1, value: 30, unit: 'Hz', fmt: (v) => EM.fix(v, 1) });
        sim.seg('modo', { label: 'Gráfica', options: [['n', 'f contra n'], ['T', 'f₂ contra √T']], value: 'n' });
      },
      paso(dt, st) { st.t = (st.t || 0) + dt; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, x0 = W * 0.1, x1 = W * 0.88, y = H * 0.45, F1 = f1(p), A = amp(p.f, F1);
        D.parlante(ctx, x0 - 18, y, 28);
        D.polea(ctx, x1 + 10, y + 10, 10);
        D.hilo(ctx, x1 + 20, y + 10, x1 + 20, y + 70);
        D.rect(ctx, x1 + 13, y + 70, 14, 10 + p.M * 60, { fill: '--metal-dark' });
        const nv = Math.max(1, Math.round(p.f / F1)), Ap = Math.min(H * 0.3, 2 + A * 2.2);
        ctx.save(); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.6;
        for (const s of [1, -1]) { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const u = i / 200; ctx.lineTo(x0 + u * (x1 - x0), y + s * Ap * Math.sin(nv * Math.PI * u) * Math.cos(2 * Math.PI * 1.3 * (st.t || 0))); } ctx.stroke(); }
        ctx.restore();
        D.cota(ctx, x0, H * 0.88, x1, H * 0.88, 'L = ' + EM.fix(p.L, 2) + ' m', { size: 11 });
        D.label(ctx, A > 8 ? 'resonancia con ' + nv + ' vientre' + (nv > 1 ? 's' : '') : 'fuera de resonancia', W * 0.05, H * 0.1, { weight: 650, color: A > 8 ? '--c3' : '--ink-3' });
      },
      medir(p, rnd) {
        const F1 = f1(p), n = Math.max(1, Math.round(p.f / F1));
        return { M: p.M, n, f: L.quant(n * F1 + rnd.gauss(0, 0.3), 0.1), rT: Math.sqrt(p.M * EM.local().g) };
      },
      serie(p, rnd, st) {
        const out = [];
        if (p.modo === 'n') { const F1 = f1(p); for (let n = 1; n <= 6; n++) out.push(this.medir(Object.assign({}, p, { f: n * F1 }), rnd, st)); }
        else for (const M of [0.05, 0.1, 0.2, 0.3, 0.4]) { const q = Object.assign({}, p, { M }); out.push(this.medir(Object.assign(q, { f: 2 * f1(q) }), rnd, st)); }
        return out;
      },
      grafica(rows, p) {
        if (p.modo === 'T') { const r = rows.filter((x) => x.n === 2); return { x: r.map((x) => x.rT), y: r.map((x) => x.f), xl: '√T (N^{1/2})', yl: 'f₂ (Hz)', ajuste: 'origen', xextra: [0], yextra: [0] }; }
        const r = rows.filter((x) => Math.abs(x.M - p.M) < 1e-9);
        return { x: r.map((x) => x.n), y: r.map((x) => x.f), xl: 'número de vientres n', yl: 'f (Hz)', ajuste: 'origen', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const T = p.M * EM.local().g, v = Math.sqrt(T / (p.mu / 1000));
        const out = [['v', 'Rapidez del modelo √(T/μ)', EM.fix(v, 2) + ' m/s'], ['f1', 'Fundamental del modelo', EM.fix(f1(p), 2) + ' Hz']];
        if (fit && rows.length >= 2) {
          if (p.modo === 'n') out.push(['vm', 'v = 2L × pendiente', L.pm(2 * p.L * fit.m, 2 * p.L * fit.sm, 'm/s'), true]);
          else { const mu = (2 / (2 * p.L * fit.m)) ** 2; out.push(['mu', 'μ = (n/(2L·pendiente))²', L.pm(mu * 1000, (2 * mu * fit.sm) / fit.m * 1000, 'g/m'), true]); }
        }
        return out;
      }
    });
  });
})();
