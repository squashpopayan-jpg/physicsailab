/* Capítulo 23 — Fuerza centrípeta: el tapón que gira */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('circular-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'circular', aspect: [1.15, 1.2],
      cols: [{ k: 'M', t: 'M (kg)', d: 3 }, { k: 'iM', t: '1/M (kg⁻¹)', d: 2 }, { k: 't20', t: 't₂₀ (s)', d: 2 }, { k: 'P', t: 'P (s)', d: 4 }, { k: 'P2', t: 'P² (s²)', d: 4 }],
      controles(sim) {
        sim.group('Montaje');
        sim.slider('m', { label: 'Masa del tapón', min: 0.005, max: 0.03, step: 0.001, value: 0.012, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('L', { label: 'Longitud de cuerda L', min: 0.3, max: 0.9, step: 0.01, value: 0.5, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('M', { label: 'Masa colgante M', min: 0.03, max: 0.15, step: 0.01, value: 0.05, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('fr', { label: 'Fricción del hilo en el tubo', min: 0, max: 0.2, step: 0.01, value: 0, fmt: (v) => Math.round(v * 100) + ' % de la tensión' });
      },
      paso(dt, st, p) { const g = EM.local().g, P = MO.periodoTapon(p.m, p.M * (1 - p.fr), p.L, g); st.ph = ((st.ph || 0) + (2 * Math.PI * dt) / P) % (2 * Math.PI); },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, al = MO.anguloTapon(p.m, p.M * (1 - p.fr));
        const cx = W * 0.5, cy = H * 0.3, R = W * 0.36 * (p.L / 0.9) * Math.cos(al), ry = R * 0.28;
        const ph = st.ph || 0;
        /* trayectoria en perspectiva */
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(cx, cy + W * 0.36 * (p.L / 0.9) * Math.sin(al), R, ry, 0, 0, 7); ctx.stroke(); ctx.restore();
        const tx = cx + R * Math.cos(ph), ty = cy + W * 0.36 * (p.L / 0.9) * Math.sin(al) + ry * Math.sin(ph);
        D.hilo(ctx, cx, cy, tx, ty);
        D.rect(ctx, cx - 4, cy - 2, 8, H * 0.28, { fill: '--plastic', r: 2 });
        D.bob(ctx, tx, ty, 8 + p.m * 300, { color: '--rubber' });
        const yM = cy + H * 0.36;
        D.hilo(ctx, cx, cy + H * 0.28, cx, yM);
        D.rect(ctx, cx - 10, yM, 20, 6 + p.M * 120, { fill: '--metal-dark' });
        D.label(ctx, Math.round(p.M * 1000) + ' g', cx + 16, yM + 12);
        D.label(ctx, 'α = ' + EM.fix((al * 180) / Math.PI, 1) + '° bajo la horizontal', W * 0.05, H * 0.08);
        D.label(ctx, 'vista en perspectiva', W * 0.05, H * 0.95, { size: 10.5, color: '--ink-3' });
      },
      medir(p, rnd) {
        const g = EM.local().g, P = MO.periodoTapon(p.m, p.M * (1 - p.fr), p.L * (1 + rnd.gauss(0, 0.01)), g);
        const t20 = L.quant(20 * P + Math.SQRT2 * rnd.gauss(0, 0.09), 0.01);
        return { M: p.M, iM: 1 / p.M, t20, P: t20 / 20, P2: (t20 / 20) ** 2 };
      },
      serie(p, rnd, st) { const out = []; for (const M of [0.03, 0.05, 0.07, 0.09, 0.12, 0.15]) for (let k = 0; k < 2; k++) out.push(this.medir(Object.assign({}, p, { M }), rnd, st)); return out; },
      grafica(rows, p) { const g = EM.local().g; return { x: rows.map((r) => r.iM), y: rows.map((r) => r.P2), xl: '1/M (kg⁻¹)', yl: 'P² (s²)', ajuste: 'origen', curva: (x) => (4 * Math.PI * Math.PI * p.m * p.L * x) / g, xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const g = EM.local().g, k = (4 * Math.PI * Math.PI * p.m * p.L) / g;
        const out = [['P', 'Periodo con la masa colgante actual', EM.fix(MO.periodoTapon(p.m, p.M * (1 - p.fr), p.L, g), 4) + ' s'], ['k', 'Pendiente del modelo 4π²mL/g', EM.fix(k, 5) + ' kg·s²']];
        if (fit && rows.length >= 2) {
          out.push(['pen', 'Pendiente medida', L.pm(fit.m, fit.sm, 'kg·s²'), true]);
          out.push(['mt', 'Masa del tapón = pendiente·g/(4π²L)', L.pm((fit.m * g) / (4 * Math.PI * Math.PI * p.L) * 1000, (fit.sm * g) / (4 * Math.PI * Math.PI * p.L) * 1000, 'g')]);
          out.push(['z', 'Compatibilidad con el modelo', L.compat(fit.m, fit.sm, k, k * 0.01).html]);
        }
        return out;
      }
    });
  });
})();
