/* Capítulo 17 — Ley de Hooke y oscilador masa–resorte */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('resorte-banco', function (sim) {
    const k = () => sim.p.k, mr = () => sim.p.mr / 1000;
    let kEst = null, kDin = null;
    EM.banco(sim, {
      nombre: 'resorte', aspect: [0.85, 1.2],
      cols: [{ k: 'm', t: 'm (kg)', d: 3 }, { k: 'F', t: 'F (N)', d: 3 }, { k: 'x', t: 'x (m)', d: 3 }, { k: 't20', t: 't₂₀ (s)', d: 2 }, { k: 'T2', t: 'T² (s²)', d: 4 }],
      controles(sim) {
        sim.group('Resorte');
        sim.slider('k', { label: 'Constante real k', min: 5, max: 60, step: 0.5, value: 20, unit: 'N/m', fmt: (v) => EM.fix(v, 1) });
        sim.slider('mr', { label: 'Masa del resorte', min: 0, max: 40, step: 1, value: 12, unit: 'g', fmt: (v) => v.toFixed(0) });
        sim.slider('F0', { label: 'Tensión inicial', min: 0, max: 0.5, step: 0.01, value: 0, unit: 'N', fmt: (v) => EM.fix(v, 2) });
        sim.seg('modo', { label: 'Método', options: [['est', 'Estático: x contra F'], ['din', 'Dinámico: T² contra m']], value: 'est' });
        sim.slider('m', { label: 'Masa colgada (medida individual)', min: 0.02, max: 0.25, step: 0.01, value: 0.1, unit: 'g', fmt: (v) => Math.round(v * 1000) });
      },
      estado: () => ({ y: 0.02, v: 0, key: '' }),
      paso(dt, st, p) {
        const key = p.k + '|' + p.m + '|' + p.mr;
        if (key !== st.key) { st.key = key; st.y = 0.02; st.v = 0; }
        const meff = p.m + p.mr / 3000, n = Math.ceil(dt / 0.002), h = dt / n;
        for (let i = 0; i < n; i++) { st.v += (-p.k / meff) * st.y * h - 0.05 * st.v * h; st.y += st.v * h; }
      },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g;
        const [px, py] = D.soporte(ctx, W * 0.2, H * 0.94, H * 0.9, { brazo: W * 0.45 });
        const sc = H * 1.6;
        const ext = Math.max(0, (p.m * g - p.F0) / p.k) + (p.modo === 'din' ? st.y : 0);
        const L0 = H * 0.18, yEnd = py + L0 + ext * sc;
        D.spring(ctx, px, py, px, yEnd, { coils: 16, r: 9, color: '--metal-dark', width: 1.6 });
        const s = Math.max(16, Math.cbrt(p.m) * 60);
        D.hilo(ctx, px, yEnd, px, yEnd + 8);
        D.block(ctx, px, yEnd + 8 + s / 2, s, s, { fill: '--c1', label: Math.round(p.m * 1000) + ' g', size: 10 });
        D.regla(ctx, px + 46, py + L0, px + 46, Math.min(H * 0.92, py + L0 + 0.3 * sc), sc / 100, { ancho: 13 });
        D.line(ctx, px + 6, yEnd, px + 40, yEnd, { color: '--c2', width: 1.2, dash: [3, 3] });
      },
      medir(p, rnd) {
        const g = EM.local().g, F = p.m * g;
        const x = L.quant(Math.max(0, (F - p.F0) / p.k) + rnd.gauss(0, 0.0005), 0.001);
        const T = MO.Tresorte(p.m, p.mr / 1000, p.k), t20 = L.quant(20 * T + Math.SQRT2 * rnd.gauss(0, 0.09), 0.01);
        return { m: p.m, F, x, t20, T2: (t20 / 20) ** 2 };
      },
      serie(p, rnd, st) { const out = []; for (let m = 0.02; m <= 0.2001; m += 0.02) out.push(this.medir(Object.assign({}, p, { m }), rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'est') {
          const sel = rows.filter((r) => r.x > 0.0015);
          return { x: sel.map((r) => r.F), y: sel.map((r) => r.x), xl: 'F (N)', yl: 'x (m)', ajuste: 'recta', xextra: [0], yextra: [0] };
        }
        return { x: rows.map((r) => r.m), y: rows.map((r) => r.T2), xl: 'm (kg)', yl: 'T² (s²)', ajuste: 'recta', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const out = [['tr', 'Periodo teórico con esta masa', EM.fix(MO.Tresorte(p.m, p.mr / 1000, p.k), 4) + ' s']];
        if (fit && rows.length >= 3) {
          if (p.modo === 'est') { const kk = 1 / fit.m, uk = fit.sm / (fit.m * fit.m); kEst = [kk, uk]; out.push(['ke', 'k estático = 1/pendiente', L.pm(kk, uk, 'N/m'), true]); out.push(['F0', 'Tensión inicial −b/m', EM.fix(-fit.b / fit.m, 3) + ' N']); }
          else {
            const kk = (4 * Math.PI * Math.PI) / fit.m, uk = (kk * fit.sm) / fit.m; kDin = [kk, uk];
            out.push(['kd', 'k dinámico = 4π²/pendiente', L.pm(kk, uk, 'N/m'), true]);
            out.push(['me', 'Masa del resorte = 3·b·k/4π²', L.pm((3 * fit.b * kk) / (4 * Math.PI * Math.PI) * 1000, (3 * fit.sb * kk) / (4 * Math.PI * Math.PI) * 1000, 'g')]);
          }
        }
        if (kEst && kDin) out.push(['cmp', 'Estático frente a dinámico', L.compat(kEst[0], kEst[1], kDin[0], kDin[1]).html]);
        return out;
      }
    });
  });
})();
