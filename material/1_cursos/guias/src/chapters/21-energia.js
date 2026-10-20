/* Capítulo 21 — Energía: rampa y lanzamiento horizontal */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const OBJ = { esf: ['Esfera de 19 mm en canal de 11 mm', 0.0095, 0.011], can: ['Canica de 16 mm en riel de cortina de 8 mm', 0.008, 0.008], pla: ['Esfera sobre un plano', 0.0095, 0] };
  const beta = (p) => MO.betaEsfera(OBJ[p.obj][1], OBJ[p.obj][2]);
  EM.defineSim('energia-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'energia', aspect: [1.3, 1.2],
      cols: [{ k: 'h', t: 'h (m)', d: 3 }, { k: 'D', t: 'D (m)', d: 3 }, { k: 'D2', t: 'D² (m²)', d: 4 }],
      controles(sim) {
        sim.group('Montaje');
        sim.select('obj', { label: 'Objeto', options: Object.keys(OBJ).map((k) => [k, OBJ[k][0]]), value: 'esf' });
        sim.slider('H', { label: 'Altura de la mesa H', min: 0.6, max: 1.1, step: 0.01, value: 0.8, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('h', { label: 'Altura de partida h', min: 0.03, max: 0.35, step: 0.01, value: 0.2, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
        sim.slider('eta', { label: 'Pérdidas en la rampa', min: 0, max: 0.15, step: 0.01, value: 0.04, fmt: (v) => Math.round(v * 100) + ' %' });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 2.2; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, b = beta(p), g = EM.local().g;
        const sc = (H * 0.7) / 1.1, xm = W * 0.36, ym = H * 0.95 - p.H * sc;
        D.piso(ctx, W * 0.02, W * 0.98, H * 0.95);
        D.rect(ctx, W * 0.03, ym, xm - W * 0.03, 10, { fill: '--wood' });
        D.rect(ctx, W * 0.05, ym + 10, 10, H * 0.95 - ym - 10, { fill: '--wood' });
        D.rect(ctx, xm - 18, ym + 10, 10, H * 0.95 - ym - 10, { fill: '--wood' });
        /* rampa: curva desde (xm - 0.5 m, ym - h) hasta (xm, ym) */
        const hp = p.h * sc, x0 = xm - 0.45 * sc;
        ctx.save(); ctx.strokeStyle = EM.col('--rail'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, ym - hp - 4); ctx.quadraticCurveTo(xm - 0.15 * sc, ym - 4, xm, ym - 4); ctx.stroke(); ctx.restore();
        const v = Math.sqrt((2 * g * p.h * (1 - p.eta)) / (1 + b)), tf = Math.sqrt((2 * p.H) / g), Dx = v * tf;
        const t = Math.min(tf, Math.max(0, (st.ta || 0) - 0.3));
        D.bob(ctx, xm + v * t * sc, ym - 10 + 0.5 * g * t * t * sc, 8, { color: '--metal-dark' });
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([3, 4]); ctx.beginPath();
        for (let k = 0; k <= 30; k++) { const tt = (k / 30) * tf; ctx.lineTo(xm + v * tt * sc, ym - 10 + 0.5 * g * tt * tt * sc); } ctx.stroke(); ctx.restore();
        D.cota(ctx, xm, H * 0.95 + 14, xm + Dx * sc, H * 0.95 + 14, 'D = ' + EM.fix(Dx * 100, 1) + ' cm', { size: 11 });
        D.cota(ctx, xm - 30, ym, xm - 30, H * 0.95, 'H', { size: 11 });
        D.cota(ctx, x0 - 14, ym - hp - 4, x0 - 14, ym - 4, 'h', { size: 11 });
        D.line(ctx, xm, ym, xm, H * 0.95, { color: '--ink-3', width: 0.8, dash: [2, 3] });
      },
      medir(p, rnd) {
        const b = beta(p), D0 = MO.alcanceRampa(p.h * (1 - p.eta), p.H, b);
        const Dm = L.quant(D0 * (1 + rnd.gauss(0, 0.012)) + rnd.gauss(0, 0.002), 0.001);
        return { h: p.h, D: Dm, D2: Dm * Dm };
      },
      serie(p, rnd, st) { const out = []; for (const h of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]) for (let k = 0; k < 5; k++) out.push(this.medir(Object.assign({}, p, { h }), rnd, st)); return out; },
      grafica(rows, p) {
        const b = beta(p);
        return {
          x: rows.map((r) => r.h), y: rows.map((r) => r.D2), xl: 'h (m)', yl: 'D² (m²)', ajuste: 'origen', xextra: [0, 0.32], yextra: [0, 3.2 * p.H * 0.32],
          curva: (h) => (4 * p.H * h) / (1 + b),
          leyenda: [{ label: 'datos', color: '--accent', kind: 'dot' }, { label: 'ajuste', color: '--c2' }, { label: 'modelo con rotación', color: '--ink-3', kind: 'dash' }]
        };
      },
      resultado(fit, rows, p) {
        const b = beta(p), out = [['pred', 'D predicho (sin rotación / con rotación)', EM.fix(MO.alcanceRampa(p.h, p.H, 0) * 100, 1) + ' cm / ' + EM.fix(MO.alcanceRampa(p.h, p.H, b) * 100, 1) + ' cm'], ['b', 'β del modelo', EM.fix(b, 3)]];
        if (fit && rows.length >= 3) {
          const be = (4 * p.H) / fit.m - 1, ube = ((4 * p.H) / (fit.m * fit.m)) * fit.sm;
          out.push(['pen', 'Pendiente de D²–h', L.pm(fit.m, fit.sm, 'm')]);
          out.push(['be', 'β experimental = 4H/pendiente − 1', L.pm(be, ube), true]);
          out.push(['per', 'Energía perdida frente al modelo', EM.fix(100 * (1 - (fit.m * (1 + b)) / (4 * p.H)), 1) + ' %']);
        }
        return out;
      }
    });
  });
})();
