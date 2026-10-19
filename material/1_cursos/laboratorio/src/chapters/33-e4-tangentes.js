/* Práctica E4 · Campo terrestre y brújula de tangentes */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const MU0 = 4e-7 * Math.PI, BH = 26.7, BZ = 11.7;
  MC.defineSim('e4-tangentes', function (sim) {
    sim.cols2('1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1, label: 'Vista desde arriba' });
    const cg = sim.canvas({ aspect: 0.95, label: 'Gráficas' });
    const tab = MC.results(sim, ['<i>I</i> (A)', 'Δ<i>B</i><sub>x</sub> (µT)', 'θ (°)', 'tan θ'], { decimals: [3, 2, 2, 4], title: 'Mediciones con la bobina' });
    sim.group('Bobina');
    sim.slider('N', { label: 'Número de espiras <i>N</i>', min: 5, max: 50, step: 1, value: 20, fmt: (q) => String(Math.round(q)) });
    sim.slider('R', { label: 'Radio <i>R</i>', min: 0.05, max: 0.15, step: 0.005, value: 0.1, unit: 'm', fmt: (q) => MC.fix(q, 3) });
    sim.slider('I', { label: 'Corriente <i>I</i>', min: -0.5, max: 0.5, step: 0.005, value: 0.2, unit: 'A', fmt: (q) => MC.fix(q, 3) });
    sim.slider('phi', { label: 'Error de orientación respecto al meridiano', min: -30, max: 30, step: 1, value: 0, unit: '°', fmt: (q) => String(Math.round(q)) });
    sim.button('Medir y agregar', () => { const r = read(); tab.add([sim.p.I, r.dBx, M.deg(r.th), Math.tan(r.th)]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('bb', 'Campo de la bobina μ₀NI/2R');
    sim.out('bxy', 'Lectura (B<sub>x</sub>, B<sub>y</sub>, B<sub>z</sub>)');
    sim.out('inc', 'Inclinación del campo terrestre');
    sim.out('res', 'Resultados de los ajustes', { hl: true });
    function read() {
      const bb = (MU0 * sim.p.N * sim.p.I) / (2 * sim.p.R) * 1e6;
      const ph = M.rad(sim.p.phi);
      /* el celular está alineado con la bobina (y en el plano del aro); el aro está girado ph respecto al norte */
      const ey = [Math.sin(ph), Math.cos(ph)], ex = [Math.cos(ph), -Math.sin(ph)];
      const Bw = [bb * ex[0], BH + bb * ex[1]];
      const n = () => M.gauss(0, 0.08);
      const Bx = Bw[0] * ex[0] + Bw[1] * ex[1] + n(), By = Bw[0] * ey[0] + Bw[1] * ey[1] + n();
      const Bx0 = BH * ex[1], By0 = BH * ey[1];
      return { bb, Bx, By, Bz: -BZ + n(), dBx: Bx - Bx0, th: Math.atan2(Bx, By) - Math.atan2(Bx0, By0) };
    }
    sim.onDraw(() => {
      const r = read();
      sim.set('bb', MC.fix(r.bb, 2) + ' µT');
      sim.set('bxy', `(${MC.fix(r.Bx, 1)}, ${MC.fix(r.By, 1)}, ${MC.fix(r.Bz, 1)}) µT`);
      sim.set('inc', MC.fix(M.deg(Math.atan(BZ / BH)), 1) + '° (B_H = 26.7 µT)');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h, cx = W / 2, cy = H / 2;
      const ph = M.rad(sim.p.phi);
      MC.text(ctx, 'N', cx, 16, { size: 14, weight: 700, align: 'center', color: '--ink-2' });
      D.arrow(ctx, cx, 40, cx, 22, { color: '--ink-3', width: 1.5 });
      /* aro visto de canto */
      const Rpx = Math.min(W, H) * 0.42;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ph);
      ctx.fillStyle = MC.col('--copper'); ctx.fillRect(-4, -Rpx, 8, 2 * Rpx);
      ctx.restore();
      D.phone(ctx, cx, cy, Rpx * 0.36, Rpx * 0.74, { ang: -ph, alpha: 0.85 });
      const k = Rpx / 62;
      const bE = [r.bb * Math.cos(ph), r.bb * Math.sin(ph)];
      D.vec(ctx, cx, cy, 0, -BH * k, { color: '--c3', label: 'B_H' });
      D.vec(ctx, cx, cy, bE[0] * k, bE[1] * k, { color: '--Bfield', label: 'B_b' });
      D.vec(ctx, cx, cy, bE[0] * k, (-BH + bE[1]) * k, { color: '--accent', label: 'B', width: 3 });
      D.angle(ctx, cx, cy, 34, Math.PI / 2, Math.atan2(BH - bE[1], bE[0]), { label: 'θ' });
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h / 2;
      const I = tab.col(0);
      const a = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: h1 }, I, tab.col(1), { xlabel: ['I', 'A'], ylabel: ['ΔB_x', 'µT'], title: 'Campo de la bobina contra corriente' });
      const b = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, I, tab.col(3), { xlabel: ['I', 'A'], ylabel: ['tan θ', ''], title: 'Galvanómetro de tangentes' });
      if (a.f && b.f && I.length >= 3) {
        const mu0 = (a.f.m * 1e-6 * 2 * sim.p.R) / sim.p.N, umu = (a.f.sm * 1e-6 * 2 * sim.p.R) / sim.p.N;
        const BHm = (MU0 * sim.p.N) / (2 * sim.p.R * b.f.m) * 1e6, uB = (BHm * b.f.sm) / b.f.m;
        sim.set('res', `μ₀ = ${L.pm(mu0 * 1e7, umu * 1e7)} ×10⁻⁷ T·m/A (4π = 12.566)<br>B_H = ${L.pm(BHm, uB, 'µT')}`);
      } else sim.set('res', 'mida al menos 3 corrientes');
    });
  });
})();
