/* Capítulo 33 — Polarización y ley de Malus */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const lect = (p, th) => MO.malus(p.I0, (th * Math.PI) / 180, p.If) + p.fuga * p.I0;
  EM.defineSim('malus-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'polarizacion', aspect: [1.2, 1.2],
      cols: [{ k: 'th', t: 'θ (°)', d: 0 }, { k: 'c2', t: 'cos²θ', d: 3 }, { k: 'I', t: 'I (lx)', d: 0 }],
      controles(sim) {
        sim.group('Fuente, filtro y sensor');
        sim.slider('I0', { label: 'Iluminancia máxima transmitida', min: 50, max: 800, step: 10, value: 300, unit: 'lx', fmt: (v) => v.toFixed(0) });
        sim.slider('If', { label: 'Luz de fondo', min: 0, max: 50, step: 1, value: 5, unit: 'lx', fmt: (v) => v.toFixed(0) });
        sim.slider('fuga', { label: 'Fuga del polarizador cruzado', min: 0, max: 0.05, step: 0.001, value: 0.005, fmt: (v) => EM.fix(v * 100, 1) + ' %' });
        sim.slider('th', { label: 'Ángulo del polarizador', min: 0, max: 180, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, I = lect(p, p.th);
        D.rect(ctx, W * 0.04, H * 0.2, W * 0.22, H * 0.6, { fill: '#F8F8F8', r: 4, stroke: '--ink-2', width: 2 });
        D.label(ctx, 'pantalla LCD', W * 0.15, H * 0.86, { align: 'center' });
        for (let k = 0; k < 5; k++) D.line(ctx, W * 0.1 + k * W * 0.03, H * 0.35, W * 0.1 + k * W * 0.03, H * 0.65, { color: '--c1', width: 1.4 });
        const cx = W * 0.52, cy = H * 0.5, R = Math.min(W, H) * 0.22;
        ctx.save(); ctx.fillStyle = EM.alpha(EM.col('--ink-3'), 0.25); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.restore();
        const a = (p.th * Math.PI) / 180;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip(); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1;
        const ux = Math.sin(a), uy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
        for (let k = -6; k <= 6; k++) { const ox = cx + nx * k * R * 0.16, oy = cy + ny * k * R * 0.16; ctx.beginPath(); ctx.moveTo(ox - ux * R, oy - uy * R); ctx.lineTo(ox + ux * R, oy + uy * R); ctx.stroke(); }
        ctx.restore();
        D.line(ctx, cx, cy - R * 1.1, cx, cy + R * 1.1, { color: '--c1', dash: [3, 3], width: 1 });
        D.label(ctx, 'polarizador a ' + p.th.toFixed(0) + '°', cx, cy + R + 22, { align: 'center' });
        D.celular(ctx, W * 0.85, cy, 56, 100, { screen: (c, x, y, w, h) => { EM.text(c, EM.fix(L.quant(I, 1), 0), x + w / 2, y + h * 0.45, { size: 16, align: 'center', color: '#FFFFFF', mono: true, weight: 700 }); EM.text(c, 'lx', x + w / 2, y + h * 0.65, { size: 11, align: 'center', color: '#B0BEC5' }); } });
        ctx.save(); ctx.fillStyle = `rgba(255,236,170,${Math.min(0.9, I / p.I0)})`; ctx.fillRect(W * 0.66, cy - 10, W * 0.1, 20); ctx.restore();
      },
      medir(p, rnd) { const I = lect(p, p.th); return { th: p.th, c2: Math.cos((p.th * Math.PI) / 180) ** 2, I: L.quant(I * (1 + rnd.gauss(0, 0.01)) + rnd.gauss(0, 0.5), 1) }; },
      serie(p, rnd, st) { const out = []; for (let th = 0; th <= 180; th += 15) out.push(this.medir(Object.assign({}, p, { th: th + rnd.gauss(0, 1) }), rnd, st)); return out.map((r) => Object.assign(r, { th: Math.round(r.th) })); },
      grafica(rows) { return { x: rows.map((r) => r.c2), y: rows.map((r) => r.I), xl: 'cos²θ', yl: 'I (lx)', ajuste: 'recta', xextra: [0, 1], yextra: [0] }; },
      resultado(fit, rows, p) {
        const out = [['I', 'Lectura a este ángulo', EM.fix(lect(p, p.th), 0) + ' lx']];
        if (fit && rows.length >= 3) {
          out.push(['I0', 'I₀ = pendiente', L.pm(fit.m, fit.sm, 'lx'), true]);
          out.push(['If', 'Fondo + fuga = intercepto', L.pm(fit.b, fit.sb, 'lx')]);
          const mx = Math.max(...rows.map((r) => r.I)), mn = Math.min(...rows.map((r) => r.I));
          out.push(['ex', 'Razón I_mín/I_máx', EM.fix((100 * mn) / mx, 2) + ' %']);
        }
        return out;
      }
    });
  });
})();
