/* Capítulo 25 — Torricelli: chorro y vaciado */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('torricelli-banco', function (sim) {
    const geo = (p) => ({ A: Math.PI * (p.Db / 2) ** 2, a: Math.PI * (p.d / 2) ** 2 });
    EM.banco(sim, {
      nombre: 'torricelli', aspect: [1.1, 1.2],
      cols: [{ k: 'h', t: 'h (m)', d: 3 }, { k: 'x', t: 'x (m)', d: 3 }, { k: 'x2', t: 'x² (m²)', d: 4 }, { k: 't', t: 't (s)', d: 1 }, { k: 'rh', t: '√h (m½)', d: 4 }],
      controles(sim) {
        sim.group('Botella y orificio');
        sim.slider('Db', { label: 'Diámetro interior de la botella', min: 0.06, max: 0.15, step: 0.002, value: 0.1, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('d', { label: 'Diámetro del orificio', min: 0.002, max: 0.008, step: 0.0005, value: 0.004, unit: 'mm', fmt: (v) => EM.fix(v * 1000, 1) });
        sim.slider('y', { label: 'Altura del orificio sobre la bandeja', min: 0.1, max: 0.5, step: 0.01, value: 0.25, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
        sim.slider('Cv', { label: 'Coeficiente de velocidad C<sub>v</sub>', min: 0.9, max: 1, step: 0.005, value: 0.97, fmt: (v) => EM.fix(v, 3) });
        sim.slider('Cd', { label: 'Coeficiente de descarga C<sub>d</sub>', min: 0.5, max: 1, step: 0.01, value: 0.62, fmt: (v) => EM.fix(v, 2) });
        sim.seg('modo', { label: 'Gráfica', options: [['x', 'x² contra h'], ['t', '√h contra t']], value: 'x' });
      },
      paso(dt, st, p) { const g = EM.local().g, { A, a } = geo(p), T = MO.tVaciado(0.25, p.Cd, a, A, g); st.tv = ((st.tv || 0) + dt * 20) % (T + 10); },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g, { A, a } = geo(p);
        const h = MO.hVaciado(st.tv || 0, 0.25, p.Cd, a, A, g);
        const sc = (H * 0.75) / 0.6, yb = H * 0.92, yo = yb - p.y * sc, bw = p.Db * sc * 1.4, bx = W * 0.12;
        D.rect(ctx, W * 0.02, yb, W * 0.96, 8, { fill: '--surface-3' });
        D.rect(ctx, bx, yo + 0.05 * sc, bw, yb - yo - 0.05 * sc, { fill: '--wood' });
        D.recipiente(ctx, bx, yo + 0.05 * sc, bw, 0.33 * sc, (h + 0.05) / 0.33);
        const v = p.Cv * Math.sqrt(2 * g * h), tf = Math.sqrt((2 * p.y) / g);
        if (h > 0.002) {
          ctx.save(); ctx.strokeStyle = EM.col('--water'); ctx.lineWidth = Math.max(2, p.d * sc * 1.3); ctx.beginPath();
          for (let k = 0; k <= 30; k++) { const t = (k / 30) * tf; ctx.lineTo(bx + bw + v * t * sc, yo + 0.5 * g * t * t * sc); } ctx.stroke(); ctx.restore();
          D.cota(ctx, bx + bw, yb + 18, bx + bw + v * tf * sc, yb + 18, 'x = ' + EM.fix(v * tf * 100, 1) + ' cm', { size: 11 });
        }
        D.label(ctx, 'h = ' + EM.fix(h * 100, 1) + ' cm · t = ' + EM.fix((st.tv || 0), 0) + ' s', W * 0.05, H * 0.08);
        D.cota(ctx, bx - 14, yo, bx - 14, yb, 'y', { size: 11 });
      },
      medir(p, rnd) {
        const g = EM.local().g, { A, a } = geo(p), rows = [];
        const T = MO.tVaciado(0.25, p.Cd, a, A, g);
        for (const h of [0.25, 0.2, 0.15, 0.1, 0.05]) {
          const t = (A / (p.Cd * a)) * Math.sqrt(2 / g) * (Math.sqrt(0.25) - Math.sqrt(h));
          const x = L.quant(MO.alcanceChorro(h, p.y, p.Cv) * (1 + rnd.gauss(0, 0.008)) + rnd.gauss(0, 0.002), 0.001);
          const tm = L.quant(t + Math.SQRT2 * rnd.gauss(0, 0.2), 0.1);
          rows.push({ h, x, x2: x * x, t: tm, rh: Math.sqrt(h) });
        }
        void T;
        return rows;
      },
      serie(p, rnd, st) { let out = []; for (let k = 0; k < 3; k++) out = out.concat(this.medir(p, rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'x') return { x: rows.map((r) => r.h), y: rows.map((r) => r.x2), xl: 'h (m)', yl: 'x² (m²)', ajuste: 'origen', curva: (h) => 4 * h * p.y, xextra: [0], yextra: [0] };
        return { x: rows.map((r) => r.t), y: rows.map((r) => r.rh), xl: 't (s)', yl: '√h (m^{1/2})', ajuste: 'recta', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const g = EM.local().g, { A, a } = geo(p);
        const out = [['tv', 'Vaciado desde 25 cm: ideal / con C_d', EM.fix(MO.tVaciado(0.25, 1, a, A, g), 0) + ' s / ' + EM.fix(MO.tVaciado(0.25, p.Cd, a, A, g), 0) + ' s']];
        if (fit && rows.length >= 3) {
          if (p.modo === 'x') { const cv = Math.sqrt(fit.m / (4 * p.y)); out.push(['cv', 'C_v = √(pendiente/4y)', L.pm(cv, fit.sm / (8 * p.y * cv)), true]); }
          else { const k = (a / A) * Math.sqrt(g / 2), cd = -fit.m / k; out.push(['cd', 'C_d = −pendiente·A/(a√(g/2))', L.pm(cd, fit.sm / k), true]); }
        }
        return out;
      }
    });
  });
})();
