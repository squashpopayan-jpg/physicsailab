/* Capítulo 34 — Electrostática */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const k = 8.9875517923e9;
  /* Ángulo de equilibrio de cada hilo para carga q */
  const angulo = (q, m, Lh, g) => { let lo = 1e-7, hi = 1.5; for (let i = 0; i < 80; i++) { const t = (lo + hi) / 2, d = 2 * Lh * Math.sin(t); if (m * g * Math.tan(t) - (k * q * q) / (d * d) > 0) hi = t; else lo = t; } return (lo + hi) / 2; };
  EM.defineSim('electro-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'electrostatica', aspect: [1.0, 1.2],
      cols: [{ k: 'qr', t: 'q real (nC)', d: 1 }, { k: 'd', t: 'd medida (cm)', d: 1 }, { k: 'th', t: 'θ (°)', d: 2 }, { k: 'q', t: 'q estimada (nC)', d: 2 }],
      controles(sim) {
        sim.group('Esferas');
        sim.slider('q', { label: 'Carga de cada esfera', min: 0.5, max: 25, step: 0.5, value: 5, unit: 'nC', fmt: (v) => EM.fix(v, 1) });
        sim.slider('m', { label: 'Masa de cada esfera', min: 0.05, max: 0.5, step: 0.01, value: 0.15, unit: 'g', fmt: (v) => EM.fix(v, 2) });
        sim.slider('Lh', { label: 'Longitud de los hilos', min: 0.1, max: 0.5, step: 0.01, value: 0.3, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
        sim.slider('hum', { label: 'Humedad relativa del aire', min: 30, max: 95, step: 1, value: 60, unit: '%', fmt: (v) => v.toFixed(0) });
      },
      estado: () => ({ t: 0, key: '' }),
      paso(dt, st, p) { const key = p.q + '|' + p.hum; if (key !== st.key) { st.key = key; st.tq = 0; } st.tq = (st.tq || 0) + dt; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g;
        const tau = 600 * Math.exp(-(p.hum - 30) / 10); /* constante de descarga ilustrativa */
        const q = p.q * 1e-9 * Math.exp(-(st.tq || 0) / tau);
        const th = angulo(q, p.m * 1e-3, p.Lh, g);
        const px = W / 2, py = H * 0.1, sc = (H * 0.7) / 0.5;
        D.rect(ctx, W * 0.2, py - 6, W * 0.6, 6, { fill: '--wood' });
        for (const s of [-1, 1]) {
          const bx = px + s * p.Lh * Math.sin(th) * sc, by = py + p.Lh * Math.cos(th) * sc;
          D.hilo(ctx, px, py, bx, by);
          D.bob(ctx, bx, by, 9, { color: '--metal' });
          EM.text(ctx, '−', bx, by + 4, { size: 13, align: 'center', weight: 700, color: '--neg' });
        }
        const d = 2 * p.Lh * Math.sin(th);
        D.cota(ctx, px - (d / 2) * sc, py + p.Lh * Math.cos(th) * sc + 30, px + (d / 2) * sc, py + p.Lh * Math.cos(th) * sc + 30, 'd = ' + EM.fix(d * 100, 1) + ' cm', { size: 11 });
        D.label(ctx, 'carga actual: ' + EM.fix(q * 1e9, 2) + ' nC' + (p.hum > 75 ? ' (se descarga rápido)' : ''), 10, H * 0.95);
      },
      medir(p, rnd) {
        const g = EM.local().g, th = angulo(p.q * 1e-9, p.m * 1e-3, p.Lh, g), d = 2 * p.Lh * Math.sin(th);
        const dm = L.quant(d + rnd.gauss(0, 0.002), 0.001), thm = Math.asin(Math.min(1, dm / (2 * p.Lh)));
        const qm = MO.cargaPendulos(p.m * 1e-3, p.Lh, thm, g);
        return { qr: p.q, d: dm * 100, th: (thm * 180) / Math.PI, q: qm * 1e9 };
      },
      serie(p, rnd, st) { const out = []; for (const q of [2, 4, 6, 8, 10, 15, 20]) out.push(this.medir(Object.assign({}, p, { q }), rnd, st)); return out; },
      grafica(rows) { return { x: rows.map((r) => r.qr), y: rows.map((r) => r.q), xl: 'q real (nC)', yl: 'q estimada (nC)', ajuste: 'origen', curva: (x) => x, xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const g = EM.local().g, th = angulo(p.q * 1e-9, p.m * 1e-3, p.Lh, g), d = 2 * p.Lh * Math.sin(th);
        const Fe = (k * (p.q * 1e-9) ** 2) / (d * d), Fg = (6.674e-11 * (p.m * 1e-3) ** 2) / (d * d);
        const out = [['d', 'Separación de equilibrio', EM.fix(d * 100, 2) + ' cm (θ = ' + EM.fix((th * 180) / Math.PI, 2) + '°)'], ['F', 'Fuerza eléctrica / peso de una esfera', EM.fix(Fe / (p.m * 1e-3 * g), 3)], ['G', 'Fuerza eléctrica / atracción gravitacional', EM.sci(Fe / Fg, 2)]];
        if (fit && rows.length >= 2) out.push(['m', 'Pendiente q estimada / q real', L.pm(fit.m, fit.sm), true]);
        return out;
      }
    });
  });
})();
