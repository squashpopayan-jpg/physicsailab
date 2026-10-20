/* Capítulo 16 — Péndulo simple y gravedad local */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;

  /* Errores de cronometraje: desviación por pulsación (s) y resolución (s) */
  const CRONO = {
    manual: { s: 0.09, res: 0.01, n: 'Cronómetro manual (reacción ≈ 0,09 s por pulsación)' },
    video: { s: 0.0096, res: 1 / 30, n: 'Video a 30 cuadros por segundo' },
    foto: { s: 0.0002, res: 0.0001, n: 'Fotopuerta con Arduino (0,1 ms)' }
  };
  EM.CRONO = CRONO;
  /* Tiempo de N periodos medido con el método m */
  const cronometrar = (Tn, m, rnd) => { const c = CRONO[m]; return L.quant(Tn + Math.SQRT2 * rnd.gauss(0, c.s), c.res); };

  EM.defineSim('pendulo-banco', function (sim) {
    const RHO = 7850; /* tuerca de acero aproximada por una esfera */
    const radio = (m) => Math.cbrt((3 * m) / (4 * Math.PI * RHO));
    const ref = () => EM.local();
    const st = EM.banco(sim, {
      nombre: 'pendulo', aspect: [0.95, 1.2],
      cols: [{ k: 'L', t: 'L (m)', d: 3 }, { k: 'N', t: 'N', d: 0 }, { k: 'tN', t: 't_N (s)', d: 2 }, { k: 'T', t: 'T (s)', d: 4 }, { k: 'T2', t: 'T² (s²)', d: 4 }],
      estado: () => ({ th: 0, w: 0, key: '' }),
      controles(sim) {
        sim.group('Péndulo');
        sim.slider('L', { label: 'Longitud hasta el centro de la masa', min: 0.2, max: 1.5, step: 0.01, value: 0.8, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('A', { label: 'Amplitud inicial', min: 2, max: 60, step: 1, value: 10, unit: '°', fmt: (v) => v.toFixed(0) });
        sim.slider('m', { label: 'Masa', min: 0.02, max: 0.2, step: 0.005, value: 0.05, fmt: (v) => Math.round(v * 1000) + ' g' });
        sim.group('Cronometraje');
        sim.select('cr', { label: 'Instrumento', options: Object.keys(CRONO).map((k) => [k, CRONO[k].n]), value: 'manual' });
        sim.seg('N', { label: 'Oscilaciones por medida', options: [[1, '1'], [5, '5'], [10, '10'], [20, '20']], value: 10 });
        sim.check('borde', { label: 'Error: medir L hasta el borde superior de la masa', value: false });
        sim.seg('modo', { label: 'Gráfica', options: [['T2', 'T² contra L'], ['T', 'T contra L']], value: 'T2' });
      },
      paso(dt, st, p) {
        const key = p.L + '|' + p.A;
        if (key !== st.key) { st.key = key; st.th = (p.A * Math.PI) / 180; st.w = 0; }
        const g = ref().g, r = radio(p.m), Leq = (p.L * p.L + 0.4 * r * r) / p.L;
        const f = (th, w) => [w, -(g / Leq) * Math.sin(th) - 0.004 * w];
        const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
        for (let i = 0; i < n; i++) {
          const k1 = f(st.th, st.w), k2 = f(st.th + h * k1[0] / 2, st.w + h * k1[1] / 2), k3 = f(st.th + h * k2[0] / 2, st.w + h * k2[1] / 2), k4 = f(st.th + h * k3[0], st.w + h * k3[1]);
          st.th += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
          st.w += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        }
      },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, ymesa = H * 0.9, sc = (H * 0.66) / 1.5;
        D.mesa(ctx, W * 0.04, W * 0.56, ymesa, { alto: H * 0.08 });
        const [px, py] = D.soporte(ctx, W * 0.16, ymesa, H * 0.82, { brazo: W * 0.42 });
        const r = radio(p.m), Lpx = p.L * sc, rpx = Math.max(4, r * sc * 1.6);
        const bx = px + Lpx * Math.sin(st.th), by = py + Lpx * Math.cos(st.th);
        /* transportador */
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + Lpx + rpx + 10); ctx.stroke(); ctx.setLineDash([]);
        const A = (p.A * Math.PI) / 180;
        ctx.beginPath(); ctx.arc(px, py, Math.min(Lpx * 0.35, 60), Math.PI / 2 - A, Math.PI / 2 + A); ctx.stroke(); ctx.restore();
        D.label(ctx, p.A.toFixed(0) + '°', px - Math.min(Lpx * 0.35, 60) * Math.sin(A) - 4, py + Math.min(Lpx * 0.35, 60) * Math.cos(A) + 4, { size: 11, align: 'right' });
        D.rect(ctx, px - 7, py - 9, 14, 11, { fill: '--wood', r: 2 });
        D.hilo(ctx, px, py, bx, by);
        D.bob(ctx, bx, by, rpx, { color: '--metal-dark' });
        const xc = px + Math.max(Lpx * Math.sin(A), 30) + 14;
        D.cota(ctx, xc, py, xc, py + Lpx, '', {});
        D.label(ctx, 'L = ' + EM.fix(p.L, 2) + ' m', xc + 6, py + Lpx / 2 + 4, { align: 'left' });
        if (p.borde) D.callout(ctx, 'se mide hasta aquí', W * 0.78, py + Lpx - rpx - 18, px + 2, py + Lpx - rpx, { size: 10.5, tcolor: '--c2' });
        const T = MO.Tpendulo(p.L, A, ref().g, r);
        D.cronometro(ctx, W * 0.82, H * 0.16, Math.min(W, H) * 0.08, EM.fix((st.t % 100), 2), { label: 'T = ' + EM.fix(T, 3) + ' s' });
      },
      medir(p, rnd) {
        const g = ref().g, r = radio(p.m), A = (p.A * Math.PI) / 180;
        const T = MO.Tpendulo(p.L, A, g, r);
        const Lmed = L.quant(p.L - (p.borde ? r : 0) + rnd.gauss(0, 0.0007), 0.001);
        const tN = cronometrar(p.N * T, p.cr, rnd);
        return { L: Lmed, N: p.N, tN, T: tN / p.N, T2: (tN / p.N) ** 2 };
      },
      serie(p, rnd, st) {
        const out = [];
        for (const Lx of [0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2]) for (let k = 0; k < 3; k++) out.push(this.medir(Object.assign({}, p, { L: Lx }), rnd, st));
        return out;
      },
      grafica(rows, p) {
        const g = ref().g;
        const x = rows.map((r) => r.L), y = rows.map((r) => (p.modo === 'T2' ? r.T2 : r.T));
        return p.modo === 'T2'
          ? { x, y, xl: 'L (m)', yl: 'T² (s²)', ajuste: 'recta', curva: (l) => (4 * Math.PI * Math.PI * l) / g, xextra: [0, 1.3], yextra: [0] }
          : { x, y, xl: 'L (m)', yl: 'T (s)', ajuste: null, curva: (l) => MO.Tpequeno(l, g), xextra: [0, 1.3], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const R = ref(), A = (p.A * Math.PI) / 180, r = radio(p.m);
        const T0 = MO.Tpequeno(p.L, R.g), T = MO.Tpendulo(p.L, A, R.g, r);
        const out = [
          ['t0', 'Periodo, ángulos pequeños', EM.fix(T0, 4) + ' s'],
          ['te', 'Periodo exacto a esta amplitud', EM.fix(T, 4) + ' s (+' + EM.fix((100 * (T - T0)) / T0, 2) + ' %)'],
          ['ref', 'Gravedad de referencia', L.pm(R.g, R.ug, 'm/s²') + ' · ' + R.nombre]
        ];
        if (p.modo === 'T2' && fit && rows.length >= 3) {
          const g = (4 * Math.PI * Math.PI) / fit.m, ug = (g * fit.sm) / fit.m;
          out.push(['pend', 'Pendiente del ajuste', L.pm(fit.m, fit.sm, 's²/m')]);
          out.push(['cort', 'Intercepto', L.pm(fit.b, fit.sb, 's²')]);
          out.push(['g', 'g medida = 4π²/pendiente', L.pm(g, ug, 'm/s²'), true]);
          out.push(['z', 'Compatibilidad con la referencia', L.compat(g, ug, R.g, R.ug).html]);
        } else {
          out.push(['g', 'g medida', p.modo === 'T2' ? 'tome al menos 3 medidas' : 'cambie a la gráfica T² contra L', true]);
        }
        return out;
      }
    });
    return st;
  });
})();
