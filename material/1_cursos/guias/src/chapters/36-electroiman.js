/* Capítulo 36 — Oersted y el electroimán */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('oersted-banco', function (sim) {
    const BH = () => EM.local().B.H * 1e-9;
    EM.banco(sim, {
      nombre: 'electroiman', aspect: [1.1, 1.2],
      cols: [{ k: 'I', t: 'I (A)', d: 3 }, { k: 'phi', t: 'φ (°) o z (cm)', d: 1 }, { k: 'tan', t: 'tan φ', d: 4 }, { k: 'B', t: 'B celular (µT)', d: 2 }],
      controles(sim) {
        sim.group('Experimento');
        sim.seg('modo', { label: 'Parte', options: [['oe', 'Oersted'], ['bo', 'Bobina y celular']], value: 'oe' });
        sim.slider('I', { label: 'Corriente', min: 0, max: 1, step: 0.01, value: 0.4, unit: 'A', fmt: (v) => EM.fix(v, 2) });
        sim.slider('d', { label: 'Distancia del cable a la aguja', min: 0.005, max: 0.05, step: 0.001, value: 0.02, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('N', { label: 'Vueltas de la bobina', min: 25, max: 200, step: 25, value: 100, fmt: (v) => v.toFixed(0) });
        sim.slider('z', { label: 'Distancia del celular al extremo de la bobina', min: 0.01, max: 0.08, step: 0.005, value: 0.03, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h;
        if (p.modo === 'oe') {
          const phi = MO.anguloOersted(p.I, p.d, BH());
          D.brujula(ctx, W * 0.5, H * 0.52, Math.min(W, H) * 0.3, phi);
          D.line(ctx, W * 0.5, H * 0.05, W * 0.5, H * 0.95, { color: '--copper', width: 5 });
          if (p.I > 0) D.arrow(ctx, W * 0.56, H * 0.85, W * 0.56, H * 0.6, { color: '--c2', width: 2 });
          D.label(ctx, 'N', W * 0.5, H * 0.04 + 8, { align: 'center', weight: 700 });
          D.label(ctx, 'φ = ' + EM.fix((phi * 180) / Math.PI, 1) + '° · I = ' + EM.fix(p.I, 2) + ' A', W * 0.05, H * 0.95);
          D.label(ctx, 'B_H = ' + EM.fix(BH() * 1e6, 1) + ' µT (' + EM.local().nombre + ')', W * 0.05, H * 0.08);
        } else {
          const yc = H * 0.5, xc = W * 0.3;
          ctx.save(); ctx.translate(xc, yc); ctx.rotate(Math.PI / 2); D.bobina(ctx, 0, 0, 40, W * 0.35, Math.min(30, p.N / 5)); ctx.restore();
          const B = MO.bSolenoide(p.N, p.I, 0.05, 0.005, 0.025 + p.z) * 1e6;
          D.celular(ctx, xc + W * 0.18 + p.z * W * 3, yc, 46, 82, { ang: Math.PI / 2, screen: (c, x, y, w, h) => EM.text(c, EM.fix(B, 1) + ' µT', x + w / 2, y + h / 2, { size: 11, align: 'center', color: '#FFFFFF', mono: true }) });
          D.label(ctx, p.N + ' vueltas · núcleo de aire', xc, yc + 60, { align: 'center' });
        }
      },
      medir(p, rnd) {
        if (p.modo === 'oe') {
          const phi = (MO.anguloOersted(p.I, p.d, BH()) * 180) / Math.PI, phim = L.quant(phi + rnd.gauss(0, 0.5), 1);
          return { I: L.quant(p.I * (1 + rnd.gauss(0, 0.005)), 0.001), phi: phim, tan: Math.tan((phim * Math.PI) / 180), B: '—' };
        }
        const B = MO.bSolenoide(p.N, p.I, 0.05, 0.005, 0.025 + p.z) * 1e6;
        return { I: L.quant(p.I, 0.001), phi: p.z * 100, tan: '—', B: L.quant(B + rnd.gauss(0, 0.3), 0.01) };
      },
      serie(p, rnd, st) { const out = []; for (const I of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) out.push(this.medir(Object.assign({}, p, { I }), rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'oe') { const r = rows.filter((x) => typeof x.tan === 'number'); return { x: r.map((x) => x.I), y: r.map((x) => x.tan), xl: 'I (A)', yl: 'tan φ', ajuste: 'origen', curva: (i) => (2e-7 * i) / (p.d * BH()), xextra: [0], yextra: [0] }; }
        const r = rows.filter((x) => typeof x.B === 'number');
        return { x: r.map((x) => x.I), y: r.map((x) => x.B), xl: 'I (A)', yl: 'B (µT)', ajuste: 'origen', xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const out = [['bh', 'B_H del IGRF-14 en ' + EM.local().nombre, EM.fix(BH() * 1e6, 2) + ' µT']];
        if (p.modo === 'oe' && fit && rows.length >= 2) {
          const bh = 2e-7 / (p.d * fit.m), ub = (bh * fit.sm) / fit.m;
          out.push(['bm', 'B_H medido = μ₀/(2πd·pendiente)', L.pm(bh * 1e6, ub * 1e6, 'µT'), true]);
          out.push(['z', 'Frente al IGRF', L.compat(bh * 1e6, Math.hypot(ub * 1e6, (bh * 1e6 * 0.5) / (p.d * 1000)), BH() * 1e6, 0.1).html]);
        }
        if (p.modo === 'bo') out.push(['b', 'Campo en el celular (modelo)', EM.fix(MO.bSolenoide(p.N, p.I, 0.05, 0.005, 0.025 + p.z) * 1e6, 2) + ' µT']);
        return out;
      }
    });
  });
})();
