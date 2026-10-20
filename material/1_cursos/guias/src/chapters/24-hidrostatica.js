/* Capítulo 24 — Empuje y presión: Arquímedes en la balanza */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  const LIQ = { agua: ['Agua', 0.998, '--water'], sal: ['Salmuera (≈ 1,12 g/cm³)', 1.12, '#5FA8C9'], alc: ['Alcohol al 70 % (≈ 0,89 g/cm³)', 0.886, '#B9D9EF'], ace: ['Aceite vegetal (≈ 0,92 g/cm³)', 0.92, '#E2C25A'] };
  const A = Math.PI * 1.27 * 1.27, HC = 5, MC = 68.4; /* cm², cm, g */
  EM.defineSim('hidro-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'hidrostatica', aspect: [1.0, 1.2],
      cols: [{ k: 'y', t: 'y o h (cm)', d: 1 }, { k: 'r', t: 'lectura (g) o Δh (cm)', d: 2 }],
      controles(sim) {
        sim.group('Experimento');
        sim.seg('modo', { label: 'Parte', options: [['emp', 'Empuje en la balanza'], ['man', 'Manómetro']], value: 'emp' });
        sim.select('liq', { label: 'Líquido', options: Object.keys(LIQ).map((k) => [k, LIQ[k][0]]), value: 'agua' });
        sim.slider('y', { label: 'Profundidad sumergida del cilindro o del embudo', min: 0, max: 25, step: 0.5, value: 2, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, rho = LIQ[p.liq][1];
        if (p.modo === 'emp') {
          const yb = H * 0.86, vw = W * 0.4, vh = H * 0.45, x = W * 0.5 - vw / 2;
          D.rect(ctx, W * 0.25, yb, W * 0.5, 16, { fill: '--plastic-dark', r: 4 });
          D.rect(ctx, W * 0.42, yb + 3, W * 0.16, 11, { fill: '--lcd', r: 2, stroke: null });
          const ys = Math.min(p.y, HC), lect = rho * A * ys;
          EM.text(ctx, EM.fix(L.quant(lect, 1), 0) + ' g', W * 0.5, yb + 12, { size: 10, align: 'center', mono: true, color: '--lcd-ink' });
          const nivel = 0.6, ysurf = yb - vh * nivel;
          D.recipiente(ctx, x, yb, vw, vh, nivel, { liquido: LIQ[p.liq][2] });
          const sc = vh / 12, cw = 2.54 * sc, ch = HC * sc;
          const ybase = ysurf + Math.min(p.y, 9) * sc;
          D.hilo(ctx, W * 0.5, H * 0.04, W * 0.5, ybase - ch);
          D.rect(ctx, W * 0.5 - cw / 2, ybase - ch, cw, ch, { fill: '--metal', r: 2 });
          for (let k = 1; k < HC; k++) D.line(ctx, W * 0.5 - cw / 2, ybase - k * sc, W * 0.5 - cw / 2 + 6, ybase - k * sc, { color: '--ink', width: 1 });
          D.label(ctx, 'y = ' + EM.fix(Math.min(p.y, 9), 1) + ' cm', W * 0.5 + cw / 2 + 8, ysurf + 4);
        } else {
          const yb = H * 0.9, x0 = W * 0.08, bw = W * 0.42, bh = H * 0.82, ys = yb - bh * 0.92;
          D.recipiente(ctx, x0, yb, bw, bh, 0.92, { liquido: LIQ[p.liq][2] });
          const sc = (bh * 0.85) / 25, ye = ys + p.y * sc;
          D.rect(ctx, x0 + bw * 0.4, ye - 6, bw * 0.2, 12, { fill: '--plastic', r: 3 });
          const dh = (rho / 0.998) * p.y * 0.97;
          const xm = W * 0.72, ymb = H * 0.5;
          ctx.save(); ctx.strokeStyle = EM.col('--glass'); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0 + bw * 0.5, ye); ctx.lineTo(x0 + bw * 0.5, ys - 20); ctx.lineTo(xm - 22, ys - 20); ctx.lineTo(xm - 22, ymb + 90); ctx.arc(xm, ymb + 90, 22, Math.PI, 0, true); ctx.lineTo(xm + 22, ymb - 120); ctx.stroke(); ctx.restore();
          const dpx = (dh * sc) / 2;
          D.rect(ctx, xm - 25, ymb + dpx, 6, 112 - dpx, { fill: '#2E7DD1', stroke: null });
          D.rect(ctx, xm + 19, ymb - dpx, 6, 112 + dpx, { fill: '#2E7DD1', stroke: null });
          D.cota(ctx, xm + 50, ymb - dpx, xm + 50, ymb + dpx, 'Δh', { size: 11 });
          D.label(ctx, 'h = ' + EM.fix(p.y, 1) + ' cm', x0 + bw + 6, ye + 4);
        }
      },
      medir(p, rnd) {
        const rho = LIQ[p.liq][1];
        if (p.modo === 'emp') { const ys = Math.min(p.y, HC); return { y: p.y, r: L.quant(rho * A * ys + rnd.gauss(0, 0.3), 1) }; }
        return { y: p.y, r: L.quant((rho / 0.998) * p.y * 0.97 + rnd.gauss(0, 0.1), 0.1) };
      },
      serie(p, rnd, st) { const out = []; const ys = p.modo === 'emp' ? [0, 1, 2, 3, 4, 5, 6, 7] : [5, 10, 15, 20, 25]; for (const y of ys) out.push(this.medir(Object.assign({}, p, { y }), rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'emp') { const r = rows.filter((x) => x.y <= HC - 0.01); const fit = r.length >= 2 ? L.fitProp(r.map((x) => x.y), r.map((x) => x.r)) : null; return { x: rows.map((x) => x.y), y: rows.map((x) => x.r), xl: 'y sumergido (cm)', yl: 'aumento de la lectura (g)', ajuste: () => fit, xextra: [0, 8], yextra: [0] }; }
        return { x: rows.map((x) => x.y), y: rows.map((x) => x.r), xl: 'h (cm)', yl: 'Δh (cm)', ajuste: 'origen', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const rho = LIQ[p.liq][1], out = [];
        if (p.modo === 'emp') {
          out.push(['mod', 'Modelo: ρ A por centímetro', EM.fix(rho * A, 2) + ' g/cm']);
          if (fit) { out.push(['rho', 'ρ del líquido = pendiente/A', L.pm(fit.m / A, fit.sm / A, 'g/cm³'), true]); }
          const tot = rows.filter((x) => x.y >= HC).map((x) => x.r);
          if (tot.length) { const dm = L.mean(tot); out.push(['rs', 'ρ del cilindro = ρ_f · m / Δm_total', EM.fix((rho * MC) / dm, 3) + ' g/cm³ (real 2,70)']); }
        } else if (fit) out.push(['pen', 'Pendiente Δh/h', L.pm(fit.m, fit.sm), true]);
        return out;
      }
    });
  });
})();
