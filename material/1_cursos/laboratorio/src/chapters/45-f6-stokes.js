/* Práctica F6 · Viscosidad: la ley de Stokes */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const FL = { gli: ['Glicerina', 1260, (T) => 1.41 * Math.exp(-0.083 * (T - 20))], miel: ['Miel', 1420, (T) => 8.0 * Math.exp(-0.11 * (T - 20))], ace: ['Aceite de motor SAE 40', 875, (T) => 0.32 * Math.exp(-0.055 * (T - 20))] };
  MC.defineSim('f6-stokes', function (sim) {
    sim.cols2('0.6fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.45, label: 'Tubo con dos fotocompuertas' });
    const cg = sim.canvas({ aspect: 1.15, label: 'Análisis' });
    const tab = MC.results(sim, ['Líquido', '<i>d</i> (mm)', 'Δ<i>t</i> (s)', '<i>v</i> (m/s)', '<i>v</i><sub>∞</sub> (m/s)', 'Re'], { decimals: [0, 2, 3, 5, 5, 3], title: 'Caídas medidas' });
    const Dg = 0.2, zA = 0.08;
    let z = 0, v = 0, tA = NaN, tB = NaN;
    sim.group('Líquido');
    sim.select('fl', { options: Object.keys(FL).map((k) => [k, FL[k][0]]), value: 'gli', reset: true });
    sim.slider('T', { label: 'Temperatura del líquido', min: 15, max: 35, step: 0.5, value: 21, unit: '°C', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('Rt', { label: 'Diámetro interior del tubo', min: 20, max: 80, step: 1, value: 40, unit: 'mm', fmt: (q) => String(Math.round(q)), reset: true });
    sim.group('Esfera de acero');
    sim.select('d', { label: 'Diámetro', options: [[2, '2 mm'], [3, '3 mm'], [4, '4 mm'], [5, '5 mm'], [6, '6 mm']], value: 4, reset: true });
    sim.button('Agregar a la tabla', () => {
      if (!isFinite(tB)) return;
      const dt = tB - tA, vm = Dg / dt, r = +sim.p.d / 2000, vi = vm * (1 + 2.4 * r / (sim.p.Rt / 2000));
      const [, rf, eta] = FL[sim.p.fl];
      tab.add([FL[sim.p.fl][0], +sim.p.d, dt, vm, vi, (rf * vi * 2 * r) / eta(sim.p.T)]);
    }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('eta', 'η real a esta temperatura');
    sim.out('dt', 'Tiempo entre compuertas', { hl: true });
    sim.out('fit', 'η del ajuste (con / sin corrección)');
    const vterm = () => { const [, rf, eta] = FL[sim.p.fl]; const r = +sim.p.d / 2000; const vinf = (2 / 9) * (7800 - rf) * G * r * r / eta(sim.p.T); const Re = (rf * vinf * 2 * r) / eta(sim.p.T); const fRe = 1 / (1 + (3 / 16) * Re); return (vinf * fRe) / (1 + 2.4 * r / (sim.p.Rt / 2000)); };
    sim.run({
      h: 0.002, startLabel: 'Soltar la esfera',
      reset() { z = 0; v = 0; tA = NaN; tB = NaN; },
      step(h) {
        const vt = vterm(), tau = vt / G;
        v += (vt - v) * (1 - Math.exp(-h / Math.max(tau, 1e-4)));
        z += v * h;
        if (!isFinite(tA) && z >= zA) tA = sim.t + M.gauss(0, 0.002);
        if (!isFinite(tB) && z >= zA + Dg) tB = sim.t + M.gauss(0, 0.002);
        if (z > zA + Dg + 0.04 || sim.t > 600) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 2) + ' s'
    });
    sim.onDraw(() => {
      const [nm, rf, eta] = FL[sim.p.fl];
      sim.set('eta', MC.fix(eta(sim.p.T), 3) + ' Pa·s');
      sim.set('dt', isFinite(tB) ? MC.fix(tB - tA, 3) + ' s' : isFinite(tA) ? 'pasó la compuerta A…' : 'suelte la esfera');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = (H - 30) / 0.34, tw = Math.min(W * 0.5, (sim.p.Rt / 1000) * sc * 1.2);
      const x0 = W / 2 - tw / 2, y0 = 14;
      D.fluid(ctx, x0, y0 + 0.01 * sc, tw, 0.32 * sc, { color: FL[sim.p.fl][0] === 'Glicerina' ? '--glass' : '--lego-yellow' });
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(x0, y0, tw, 0.33 * sc);
      for (const [zz, lab] of [[zA, 'A'], [zA + Dg, 'B']]) { const y = y0 + 0.01 * sc + zz * sc; D.line(ctx, x0 - 14, y, x0 + tw + 14, y, { color: '--c2', dash: [3, 2], width: 1.5 }); MC.text(ctx, lab, x0 + tw + 18, y + 4, { size: 12, weight: 700, color: '--c2' }); }
      const rpx = Math.max(2.5, (+sim.p.d / 2000) * sc * 1.2);
      D.ball(ctx, W / 2, y0 + 0.01 * sc + z * sc, rpx, { fill: '--metal' });
      const c2 = cg.ctx;
      D.clear(cg);
      const rows = tab.rows.filter((q) => q[0] === nm);
      const r2 = rows.map((q) => (q[1] / 2000) ** 2 * 1e6), vi = rows.map((q) => q[4]), vm = rows.map((q) => q[3]);
      const { f, P } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, r2, vi, { xlabel: ['r²', 'mm²'], ylabel: ['v', 'm/s'], title: `${nm}: velocidad terminal contra r² (corregida ● y sin corregir ●)`, zeroX: true, zeroY: true, prop: true });
      if (rows.length) P.scatter(r2, vm, { color: '--c4', r: 3 });
      if (f && rows.length >= 2) {
        const fs = L.fitProp(r2, vm);
        const etaC = (2 / 9) * (7800 - rf) * G * 1e-6 / f.m, etaS = (2 / 9) * (7800 - rf) * G * 1e-6 / fs.m;
        sim.set('fit', `${MC.fix(etaC, 3)} / ${MC.fix(etaS, 3)} Pa·s`);
      } else sim.set('fit', 'mida al menos 2 diámetros');
    });
  });
})();
