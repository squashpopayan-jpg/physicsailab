/* Capítulo 40 — Péndulo físico: la regla oscilante */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  const T = (Lr, b, d, g) => 2 * Math.PI * Math.sqrt(((Lr * Lr + b * b) / 12 + d * d) / (g * d));
  EM.defineSim('fisico-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'pendulo-fisico', aspect: [0.8, 1.2],
      cols: [{ k: 'd', t: 'd (m)', d: 3 }, { k: 't10', t: 't₁₀ (s)', d: 3 }, { k: 'T', t: 'T (s)', d: 4 }, { k: 'y', t: 'T²d (s²·m)', d: 4 }, { k: 'x', t: 'd² (m²)', d: 4 }],
      controles(sim) {
        sim.group('Regla');
        sim.slider('L', { label: 'Longitud', min: 0.5, max: 1.2, step: 0.01, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('b', { label: 'Ancho', min: 0.01, max: 0.08, step: 0.005, value: 0.03, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('d', { label: 'Distancia del eje al centro', min: 0.02, max: 0.48, step: 0.01, value: 0.2, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
        sim.select('ins', { label: 'Cronometraje', options: [['foto', 'Fotopuerta'], ['man', 'Manual, 10 oscilaciones']], value: 'foto' });
        sim.seg('modo', { label: 'Gráfica', options: [['lin', 'T²d contra d²'], ['T', 'T contra d']], value: 'lin' });
      },
      paso(dt, st, p) { const g = EM.local().g, w = (2 * Math.PI) / T(p.L, p.b, Math.min(p.d, p.L / 2 - 0.01), g); st.ph = ((st.ph || 0) + w * dt) % (2 * Math.PI); },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, sc = (H * 0.85) / 1.2, px = W * 0.5, py = H * 0.08, ang = 0.12 * Math.sin(st.ph || 0);
        D.rect(ctx, px - 30, py - 10, 60, 14, { fill: '--wood' });
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
        const top = -(p.L / 2 - p.d) * sc;
        D.rect(ctx, -p.b * sc * 2, top, p.b * sc * 4, p.L * sc, { fill: '--ruler', stroke: '--ink-3' });
        for (let k = 1; k <= 9; k++) { const y = top + (p.L / 2 - k * 0.05) * sc; if (y > top) { ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(0, y, 2.5, 0, 7); ctx.fill(); } }
        ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(0, top + (p.L / 2) * sc, 4, 0, 7); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.fillStyle = EM.col('--metal-dark'); ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill(); ctx.restore();
        D.label(ctx, 'eje a ' + EM.fix(p.d * 100, 0) + ' cm del centro (punto rojo)', W * 0.05, H * 0.98, { size: 10.5 });
      },
      medir(p, rnd) {
        const g = EM.local().g, Tt = T(p.L, p.b, p.d, g);
        const t10 = p.ins === 'foto' ? L.quant(10 * Tt + rnd.gauss(0, 0.0005), 1e-4) : L.quant(10 * Tt + Math.SQRT2 * rnd.gauss(0, 0.09), 0.01);
        const d = L.quant(p.d + rnd.gauss(0, 0.0003), 0.001), Tm = t10 / 10;
        return { d, t10, T: Tm, y: Tm * Tm * d, x: d * d };
      },
      serie(p, rnd, st) { const out = []; for (let k = 1; k <= 9; k++) out.push(this.medir(Object.assign({}, p, { d: Math.min(p.L / 2 - 0.01, 0.05 * k) }), rnd, st)); return out; },
      grafica(rows, p) {
        const g = EM.local().g;
        if (p.modo === 'T') return { x: rows.map((r) => r.d), y: rows.map((r) => r.T), xl: 'd (m)', yl: 'T (s)', ajuste: null, curva: (d) => (d > 0.005 ? T(p.L, p.b, d, g) : NaN), cero: false, xr: [0, p.L / 2], yr: [1, 3.2] };
        return { x: rows.map((r) => r.x), y: rows.map((r) => r.y), xl: 'd² (m²)', yl: 'T²d (s²·m)', ajuste: 'recta', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const g = EM.local().g, dm = Math.sqrt((p.L * p.L + p.b * p.b) / 12);
        const out = [['dm', 'Mínimo del modelo', 'd = ' + EM.fix(dm * 100, 1) + ' cm, T = ' + EM.fix(T(p.L, p.b, dm, g), 4) + ' s']];
        if (p.modo === 'lin' && fit && rows.length >= 3) {
          const gm = (4 * Math.PI * Math.PI) / fit.m, ug = (gm * fit.sm) / fit.m;
          out.push(['g', 'g = 4π²/pendiente', L.pm(gm, ug, 'm/s²'), true]);
          out.push(['L', 'L = √(12·b/m − b²)', EM.fix(Math.sqrt(Math.max(0, (12 * fit.b) / fit.m - p.b * p.b)), 3) + ' m']);
          out.push(['z', 'Frente a la g del municipio', L.compat(gm, ug, g, EM.local().ug).html]);
        }
        return out;
      }
    });
  });
})();
