/* Capítulo 39 — Caída libre de precisión */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('caida-banco', function (sim) {
    const unaCaida = (p, rnd) => {
      const g = EM.local().g, n = p.n, s = p.s / 100, v0 = Math.sqrt(2 * g * 0.05);
      const ts = MO.tiemposValla(n, s * (1 + p.esc / 100), v0, g).map((t, i) => {
        const dx = rnd.gauss(0, 0.00005); /* borde impreso */
        return L.quant(t + dx / (v0 + g * t) + rnd.gauss(0, 1e-6), 4e-6);
      });
      const tm = [], vm = [];
      for (let i = 0; i + 1 < ts.length; i++) { tm.push((ts[i] + ts[i + 1]) / 2); vm.push(s / (ts[i + 1] - ts[i])); }
      const f = L.fitLine(tm, vm);
      return { ts, tm, vm, g: f.m, ug: f.sm };
    };
    let ultima = null;
    EM.banco(sim, {
      nombre: 'caida-libre', aspect: [0.7, 1.2],
      cols: [{ k: 'k', t: 'caída', d: 0 }, { k: 'g', t: 'g (m/s²)', d: 5 }, { k: 'ug', t: 'u(g) (m/s²)', d: 5 }],
      controles(sim) {
        sim.group('Valla');
        sim.slider('s', { label: 'Separación nominal de las franjas', min: 1, max: 4, step: 0.5, value: 2, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
        sim.slider('n', { label: 'Número de franjas', min: 6, max: 20, step: 1, value: 15, fmt: (v) => v.toFixed(0) });
        sim.slider('esc', { label: 'Error de escala de la impresión', min: -1, max: 1, step: 0.05, value: 0, unit: '%', fmt: (v) => EM.fix(v, 2) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, sc = (H * 0.8) / 0.4;
        const xv = W * 0.5, y0 = H * 0.06, wv = W * 0.22;
        D.rect(ctx, xv - wv / 2, y0, wv, p.n * (p.s / 100) * sc + 10, { fill: 'rgba(170,210,230,0.35)', stroke: '--glass' });
        for (let i = 0; i < p.n; i++) D.rect(ctx, xv - wv / 2, y0 + 5 + i * (p.s / 100) * sc, wv, (p.s / 200) * sc, { fill: '--ink', stroke: null });
        const yf = H * 0.88;
        D.rect(ctx, xv - wv / 2 - 30, yf - 6, 22, 12, { fill: '--plastic-dark' }); D.rect(ctx, xv + wv / 2 + 8, yf - 6, 22, 12, { fill: '--plastic-dark' });
        D.haz(ctx, [[xv - wv / 2 - 8, yf], [xv + wv / 2 + 8, yf]], { width: 1.5, alpha: 0.6 });
        D.label(ctx, 'fotopuerta', xv + wv / 2 + 34, yf + 4);
        D.label(ctx, 'g de referencia: ' + EM.fix(EM.local().g, 4) + ' m/s² (' + EM.local().nombre + ')', W * 0.03, H * 0.98, { size: 10.5 });
      },
      medir(p, rnd, st) { const c = unaCaida(p, rnd); ultima = c; st.k = (st.k || 0) + 1; return { k: st.k, g: c.g, ug: c.ug }; },
      serie(p, rnd, st) { st.k = 0; const out = []; for (let k = 0; k < 10; k++) out.push(this.medir(p, rnd, st)); return out; },
      grafica(rows) {
        if (!ultima) return { x: [], y: [], xl: 't medio (s)', yl: 'v media (m/s)', ajuste: null };
        return { x: ultima.tm, y: ultima.vm, xl: 't medio (s) · última caída', yl: 'v media (m/s)', ajuste: 'recta', cero: false };
      },
      resultado(fit, rows) {
        const R = EM.local(), out = [['ref', 'g de referencia', L.pm(R.g, R.ug, 'm/s²')]];
        if (fit) out.push(['g1', 'g de la última caída', L.pm(fit.m, fit.sm, 'm/s²')]);
        if (rows.length >= 2) {
          const gs = rows.map((r) => r.g), m = L.mean(gs), u = L.sem(gs);
          out.push(['gm', 'Promedio de ' + rows.length + ' caídas', L.pm(m, u, 'm/s²') + ' (' + EM.fix((100 * u) / m, 3) + ' %)', true]);
          out.push(['z', 'Compatibilidad (sin incertidumbre de escala)', L.compat(m, u, R.g, R.ug).html]);
        }
        return out;
      }
    });
  });
})();
