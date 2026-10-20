/* Capítulo 20 — Equilibrio, centro de masa y estabilidad */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  EM.defineSim('torque-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'torque', aspect: [1.6, 1.2],
      cols: [{ k: 'mk', t: 'm_k (kg)', d: 3 }, { k: 'dk', t: 'd_k (m)', d: 3 }, { k: 'inv', t: '1/m_k (kg⁻¹)', d: 2 }, { k: 'mx', t: 'resultado (kg)', d: 4 }],
      controles(sim) {
        sim.group('Montaje');
        sim.seg('modo', { label: 'Modo', options: [['pal', 'Masa desconocida'], ['reg', 'Masa de la regla']], value: 'pal' });
        sim.slider('mx', { label: 'Masa desconocida (oculta en la práctica real)', min: 0.03, max: 0.2, step: 0.001, value: 0.085, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('mr', { label: 'Masa de la regla', min: 0.05, max: 0.25, step: 0.005, value: 0.12, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.select('mk', { label: 'Masa conocida', options: [[0.05, '50 g'], [0.1, '100 g'], [0.15, '150 g'], [0.2, '200 g']], value: 0.1 });
        sim.slider('dk', { label: 'Posición de la masa conocida desde el apoyo', min: 0.02, max: 0.5, step: 0.001, value: 0.2, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, sc = W * 0.86, x0 = W * 0.07, yp = H * 0.42;
        const piv = p.modo === 'pal' ? 0.5 : 0.3;
        const mk = +p.mk;
        /* momento neto (positivo: horario) para el ángulo de inclinación */
        let M;
        if (p.modo === 'pal') M = mk * p.dk - p.mx * 0.3;
        else M = p.mr * (0.5 - piv) - mk * p.dk;
        const ang = Math.max(-0.25, Math.min(0.25, M * 3));
        const px = x0 + piv * sc;
        D.rect(ctx, px - 6, yp, 12, H * 0.45, { fill: '--metal-dark' });
        D.rect(ctx, px - 40, yp + H * 0.45, 80, 8, { fill: '--metal-dark' });
        ctx.save(); ctx.translate(px, yp); ctx.rotate(ang);
        D.regla(ctx, -piv * sc, 0, (1 - piv) * sc, 0, sc / 100, { ancho: 16 });
        const colgar = (d, m, col, lab) => {
          const xx = d * sc;
          D.hilo(ctx, xx, 8, xx, 8 + 30);
          D.block(ctx, xx, 8 + 30 + 12, 14 + m * 80, 22, { fill: col, label: lab, size: 9.5 });
        };
        if (p.modo === 'pal') { colgar(-0.3, p.mx, '--c4', '?'); colgar(p.dk, mk, '--c1', Math.round(mk * 1000) + ' g'); }
        else colgar(-p.dk, mk, '--c1', Math.round(mk * 1000) + ' g');
        ctx.restore();
        ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(px, yp, 4, 0, 7); ctx.fill(); ctx.restore();
        D.label(ctx, Math.abs(M) < 0.0004 ? 'en equilibrio' : M > 0 ? 'gira en sentido horario' : 'gira en sentido antihorario', W / 2, H * 0.12, { align: 'center', weight: 650, color: Math.abs(M) < 0.0004 ? '--c3' : '--c2' });
        if (p.modo === 'reg') D.label(ctx, 'centro de la regla (peso de la regla)', x0 + 0.5 * sc, yp + 50, { align: 'center', size: 10.5, color: '--ink-3' });
      },
      medir(p, rnd) {
        const mk = +p.mk;
        if (p.modo === 'pal') {
          const d = L.quant((p.mx * 0.3) / mk + rnd.gauss(0, 0.002), 0.001);
          return { mk, dk: d, inv: 1 / mk, mx: (mk * d) / 0.3 };
        }
        const d = L.quant((p.mr * 0.2) / mk + rnd.gauss(0, 0.002), 0.001);
        return { mk, dk: d, inv: 1 / mk, mx: (mk * d) / 0.2 };
      },
      serie(p, rnd, st) { const out = []; for (const mk of [0.05, 0.1, 0.15, 0.2]) for (let k = 0; k < 2; k++) out.push(this.medir(Object.assign({}, p, { mk }), rnd, st)); return out; },
      grafica(rows, p) { return { x: rows.map((r) => r.inv), y: rows.map((r) => r.dk), xl: '1/m_k (kg⁻¹)', yl: 'd_k (m)', ajuste: 'origen', xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const out = [];
        if (p.modo === 'pal') {
          out.push(['eq', 'Posición de equilibrio para esta masa', EM.fix(((p.mx * 0.3) / +p.mk) * 100, 2) + ' cm']);
          if (fit && rows.length >= 2) out.push(['mx', 'm_x = pendiente / 0,30 m', L.pm(fit.m / 0.3, fit.sm / 0.3, 'kg'), true]);
        } else {
          out.push(['eq', 'Posición de equilibrio (desde el apoyo)', EM.fix(((p.mr * 0.2) / +p.mk) * 100, 2) + ' cm']);
          if (fit && rows.length >= 2) out.push(['mr', 'Masa de la regla = pendiente / 0,20 m', L.pm(fit.m / 0.2, fit.sm / 0.2, 'kg'), true]);
        }
        return out;
      }
    });
  });
})();
