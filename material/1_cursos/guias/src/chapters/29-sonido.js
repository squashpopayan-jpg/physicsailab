/* Capítulo 29 — Velocidad del sonido en un tubo de resonancia */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* Respuesta de la columna (cerrada en el agua): amplitud ∝ 1/|cos(k Leff)| amortiguada */
  const resp = (Lc, f, v, r) => { const k = (2 * Math.PI * f) / v, x = k * (Lc + MO.correccionExtremo(r)); return 1 / Math.sqrt(Math.cos(x) ** 2 + 0.012); };
  EM.defineSim('sonido-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'sonido', aspect: [0.85, 1.2],
      cols: [{ k: 'f', t: 'f (Hz)', d: 0 }, { k: 'if', t: '1/f (ms)', d: 3 }, { k: 'L1', t: 'L₁ (m)', d: 3 }, { k: 'L2', t: 'L₂ (m)', d: 3 }, { k: 'v', t: 'v = 2(L₂−L₁)f (m/s)', d: 1 }],
      controles(sim) {
        sim.group('Tubo y tono');
        sim.slider('f', { label: 'Frecuencia del tono', min: 300, max: 1200, step: 10, value: 500, unit: 'Hz', fmt: (v) => v.toFixed(0) });
        sim.slider('th', { label: 'Temperatura del aire', min: 8, max: 34, step: 0.5, value: 20, unit: '°C', fmt: (v) => EM.fix(v, 1) });
        sim.slider('r', { label: 'Radio interior del tubo', min: 0.008, max: 0.035, step: 0.001, value: 0.02, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('Lc', { label: 'Longitud de la columna de aire', min: 0.03, max: 0.7, step: 0.001, value: 0.12, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.seg('modo', { label: 'Gráfica', options: [['res', 'Respuesta del tubo'], ['lin', 'L₁ contra 1/f']], value: 'res' });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, v = EM.LOC.vSonido(p.th), sc = (H * 0.75) / 0.75;
        const yb = H * 0.95, xt = W * 0.42, tw = Math.max(18, p.r * 2 * sc * 1.2), ytop = H * 0.12;
        D.recipiente(ctx, W * 0.2, yb, W * 0.44, H * 0.55, 0.85);
        const ywater = ytop + p.Lc * sc;
        ctx.save(); ctx.fillStyle = EM.col('--water'); ctx.globalAlpha = 0.6; ctx.fillRect(xt - tw / 2, ywater, tw, yb - ywater - 2); ctx.restore();
        ctx.save(); ctx.strokeStyle = EM.col('--plastic-dark'); ctx.lineWidth = 2; ctx.strokeRect(xt - tw / 2, ytop, tw, yb - ytop - 6); ctx.restore();
        /* envolvente del desplazamiento: antinodo en la boca + e, nodo en el agua */
        const k = (2 * Math.PI * p.f) / v, e = MO.correccionExtremo(p.r), A = resp(p.Lc, p.f, v, p.r);
        ctx.save(); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const y = (i / 60) * p.Lc, amp = Math.min(tw * 0.45, 0.04 * A * tw * Math.abs(Math.sin(k * (p.Lc - y)))); ctx.lineTo(xt + amp, ytop + y * sc); }
        ctx.stroke(); ctx.restore();
        D.parlante(ctx, xt, ytop - 18, 18);
        D.cota(ctx, xt + tw / 2 + 16, ytop, xt + tw / 2 + 16, ywater, 'L = ' + EM.fix(p.Lc * 100, 1) + ' cm', { size: 11 });
        D.label(ctx, A > 6 ? 'resonancia: sonido reforzado' : 'sin resonancia', W * 0.05, H * 0.05, { weight: 650, color: A > 6 ? '--c3' : '--ink-3' });
        void e;
      },
      medir(p, rnd) {
        const v = EM.LOC.vSonido(p.th) * (1 + 0.0007);
        const L1 = L.quant(MO.Lresonancia(1, p.f, v, p.r) + rnd.gauss(0, 0.003), 0.001);
        const L2 = L.quant(MO.Lresonancia(2, p.f, v, p.r) + rnd.gauss(0, 0.003), 0.001);
        return { f: p.f, if: 1000 / p.f, L1, L2, v: 2 * (L2 - L1) * p.f };
      },
      serie(p, rnd, st) { const out = []; for (const f of [400, 500, 600, 700, 800, 900, 1000]) out.push(this.medir(Object.assign({}, p, { f }), rnd, st)); return out; },
      grafica(rows, p) {
        const v = EM.LOC.vSonido(p.th);
        if (p.modo === 'res') return { x: rows.length ? [] : [], y: [], xl: 'longitud de la columna (m)', yl: 'intensidad relativa', ajuste: null, sinMensaje: true, curva: (x) => resp(x, p.f, v, p.r), xr: [0.02, 0.7], yr: [0, 10] };
        return { x: rows.map((r) => r.if / 1000), y: rows.map((r) => r.L1), xl: '1/f (s)', yl: 'L₁ (m)', ajuste: 'recta', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const v = EM.LOC.vSonido(p.th), out = [['v', 'Velocidad esperada (aire seco)', EM.fix(v, 1) + ' m/s'], ['e', 'Corrección de extremo 0,6133 r', EM.fix(MO.correccionExtremo(p.r) * 100, 2) + ' cm'], ['L', 'L₁ y L₂ para esta frecuencia', EM.fix(MO.Lresonancia(1, p.f, v, p.r) * 100, 1) + ' cm y ' + EM.fix(MO.Lresonancia(2, p.f, v, p.r) * 100, 1) + ' cm']];
        if (p.modo === 'lin' && fit && rows.length >= 3) {
          out.push(['vm', 'v = 4 × pendiente', L.pm(4 * fit.m, 4 * fit.sm, 'm/s'), true]);
          out.push(['em', 'e = −intercepto', L.pm(-fit.b * 100, fit.sb * 100, 'cm')]);
          out.push(['z', 'Frente a la esperada', L.compat(4 * fit.m, 4 * fit.sm, v, 0.5).html]);
        } else if (rows.length) out.push(['vp', 'Promedio de v = 2(L₂ − L₁)f', L.pm(L.mean(rows.map((r) => r.v)), rows.length > 1 ? L.sem(rows.map((r) => r.v)) : 0, 'm/s'), true]);
        return out;
      }
    });
  });
})();
