/* Capítulo 46 — Rendimiento de un motor que levanta una masa */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const R = 6, K = 0.27, TF = 0.02, H = 1;
  EM.defineSim('motor-banco', function (sim) {
    const mot = (p, m) => MO.motor(p.V, R, K, m, p.r / 100, EM.local().g, TF);
    EM.banco(sim, {
      nombre: 'motor', aspect: [1.1, 1.1],
      cols: [{ k: 'm', t: 'm (g)', d: 0 }, { k: 'I', t: 'I (A)', d: 3 }, { k: 't', t: 't para 1 m (s)', d: 2 }, { k: 'Pe', t: 'Pe (W)', d: 3 }, { k: 'Pm', t: 'Pm (W)', d: 3 }, { k: 'eta', t: 'η (%)', d: 1 }],
      controles(sim) {
        sim.group('Motor y carga');
        sim.slider('V', { label: 'Tensión en el motor', min: 3, max: 6, step: 0.1, value: 4.5, unit: 'V', fmt: (v) => EM.fix(v, 1) });
        sim.slider('m', { label: 'Masa colgante', min: 0.05, max: 0.8, step: 0.01, value: 0.2, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('r', { label: 'Radio del carrete', min: 0.5, max: 2.5, step: 0.1, value: 1.5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
        sim.seg('graf', { label: 'Gráfica', options: [['eta', 'η contra m'], ['I', 'I contra m']], value: 'eta' });
      },
      paso() {},
      montaje(ctx, cv, p, st) {
        const W = cv.w, Hh = cv.h, o = mot(p, p.m), xm = W * 0.42, ym = Hh * 0.14, y0 = Hh * 0.86, y1 = Hh * 0.26;
        const T = o.v > 0 ? H / o.v : 1e9, tt = (st.t || 0) % (Math.min(T, 30) + 1.5), fr = Math.min(1, tt / T), ymass = y0 - (y0 - y1) * fr;
        D.rect(ctx, W * 0.05, ym - 8, W * 0.32, 16, { fill: '--wood' });
        D.rect(ctx, xm - 30, ym - 14, 30, 28, { fill: '--c4', r: 4 });
        ctx.save(); ctx.fillStyle = EM.col('--metal'); ctx.beginPath(); ctx.arc(xm + 8, ym, 8, 0, 7); ctx.fill(); ctx.restore();
        D.line(ctx, xm + 16, ym, xm + 16, ymass - 14, { width: 1.2 });
        D.rect(ctx, xm + 4, ymass - 14, 24, 28, { fill: '--metal-dark', r: 3 });
        D.label(ctx, Math.round(p.m * 1000) + ' g', xm + 34, ymass + 4, { mono: true });
        D.cota(ctx, W * 0.82, y0, W * 0.82, y1, '1,00 m', { size: 11 });
        D.label(ctx, 'I = ' + EM.fix(o.I, 3) + ' A · v = ' + EM.fix(o.v, 3) + ' m/s', W * 0.04, Hh * 0.97, { mono: true, weight: 650 });
      },
      medir(p, rnd) {
        const o = mot(p, p.m), I = L.quant(o.I * (1 + rnd.gauss(0, 0.005)), 0.001), t = o.v > 0 ? L.quant(H / o.v + rnd.gauss(0, 0.08), 0.01) : Infinity;
        const Pe = p.V * I, Pm = isFinite(t) ? (p.m * EM.local().g * H) / t : 0;
        return { m: Math.round(p.m * 1000), I, t, Pe, Pm, eta: (100 * Pm) / Pe };
      },
      serie(p, rnd, st) { return [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((m) => this.medir(Object.assign({}, p, { m }), rnd, st)); },
      grafica(rows, p) {
        if (p.graf === 'I') return { x: rows.map((q) => q.m / 1000), y: rows.map((q) => q.I), xl: 'm (kg)', yl: 'I (A)', ajuste: 'recta', xextra: [0], yextra: [0] };
        return { x: rows.map((q) => q.m / 1000), y: rows.map((q) => q.eta), xl: 'm (kg)', yl: 'η (%)', ajuste: null, curva: (m) => (m <= 0 ? 0 : 100 * mot(p, m).eta), xr: [0, 0.8], yr: [0, 60] };
      },
      resultado(fit, rows, p) {
        const o = mot(p, p.m), g = EM.local().g, I0 = TF / K, Ib = p.V / R;
        const out = [['eta', 'Rendimiento con la masa elegida', EM.fix(o.eta * 100, 1) + ' %', true], ['max', 'Máximo del modelo (1 − √(I₀/I<sub>b</sub>))²', EM.fix(100 * (1 - Math.sqrt(I0 / Ib)) ** 2, 1) + ' % con I* = ' + EM.fix(Math.sqrt(I0 * Ib), 3) + ' A']];
        if (fit && p.graf === 'I' && rows.length >= 2) { const k = (g * (p.r / 100)) / fit.m; out.push(['k', 'k = g r / pendiente', L.pm(k, (k * fit.sm) / fit.m, 'V·s/rad')]); out.push(['tf', 'τ<sub>f</sub> = k · ordenada', EM.fix(k * fit.b, 4) + ' N·m']); }
        return out;
      }
    });
  });
})();
