/* Práctica F2 · Presión hidrostática y densidad de líquidos */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop, P0 = MC.K.pPop;
  const LIQ = { agua: ['Agua dulce', 998, '--water'], sal: ['Agua con 35 g/L de sal', 1025, '--water'], aceite: ['Aceite de cocina', 920, '--lego-yellow'], alcohol: ['Alcohol al 70 %', 870, '--glass'], glic: ['Glicerina', 1260, '--lego-tan'] };
  MC.defineSim('f2-hidro', function (sim) {
    sim.cols2('0.8fr 1.3fr');
    const cs = sim.canvas({ aspect: 0.7, label: 'Recipiente y sensor' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Presión contra profundidad' });
    const tab = MC.results(sim, ['Líquido', '<i>h</i> (m)', 'Δ<i>p</i> (Pa)'], { decimals: [0, 3, 1], title: 'Presión sobre la atmosférica' });
    const off = 0.004 * Math.random();
    sim.group('Líquido');
    sim.select('liq', { options: Object.keys(LIQ).map((k) => [k, LIQ[k][0]]), value: 'agua' });
    sim.group('Sensor');
    sim.seg('met', { label: 'Método', options: [['bolsa', 'Bolsa flexible'], ['mang', 'Manguera con aire']], value: 'bolsa' });
    sim.slider('V0', { label: 'Volumen de aire atrapado', min: 1, max: 60, step: 1, value: 20, unit: 'mL', fmt: (q) => String(Math.round(q)) });
    sim.slider('h', { label: 'Profundidad', min: 0, max: 0.4, step: 0.008, value: 0.08, unit: 'm', fmt: (q) => MC.fix(q * 100, 1) + ' cm' });
    sim.button('Medir y agregar', () => tab.add([LIQ[sim.p.liq][0], sim.p.h, dp(true)]), { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('now', 'Δ<i>p</i> medido', { hl: true });
    sim.out('dh', 'Agua que entra a la manguera');
    sim.out('rho', 'ρ del ajuste');
    const A = Math.PI * 0.002 * 0.002;
    const dh = () => { if (sim.p.met !== 'mang') return 0; const rho = LIQ[sim.p.liq][1], V0 = sim.p.V0 * 1e-6; return (rho * G * sim.p.h) / (rho * G + (P0 * A) / V0); };
    const dp = (noisy) => { const rho = LIQ[sim.p.liq][1]; return rho * G * (sim.p.h + (sim.p.met === 'bolsa' ? off : 0) - dh()) + (noisy ? M.gauss(0, 1.5) : 0); };
    sim.onDraw(() => {
      sim.set('now', MC.fix(dp(true), 1) + ' Pa');
      sim.set('dh', sim.p.met === 'mang' ? MC.fix(dh() * 1000, 1) + ' mm' : '—');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const x0 = W * 0.28, w = W * 0.44, ytop = H * 0.12, sc = (H * 0.78) / 0.45;
      const [, , col] = LIQ[sim.p.liq];
      D.fluid(ctx, x0, ytop + 0.03 * sc, w, 0.42 * sc, { color: col });
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, ytop); ctx.lineTo(x0, ytop + 0.45 * sc); ctx.lineTo(x0 + w, ytop + 0.45 * sc); ctx.lineTo(x0 + w, ytop); ctx.stroke();
      const ys = ytop + 0.03 * sc + sim.p.h * sc;
      if (sim.p.met === 'bolsa') {
        ctx.fillStyle = MC.col('--lego-gray'); ctx.fillRect(x0 + w / 2 - 3, ytop - 10, 6, ys - ytop + 10);
        D.circle(ctx, x0 + w / 2, ys, 12, { fill: '--glass', fillAlpha: 0.7, color: '--ink-3' });
        ctx.fillStyle = MC.col('--pcb-2'); ctx.fillRect(x0 + w / 2 - 6, ys - 5, 12, 10);
        D.line(ctx, x0 + w / 2, ytop - 10, W * 0.9, 10, { color: '--wire-y', width: 2 });
      } else {
        ctx.strokeStyle = MC.col('--ink-3'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 + w / 2, ytop - 20); ctx.lineTo(x0 + w / 2, ys); ctx.stroke();
        ctx.strokeStyle = MC.col(col); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 + w / 2, ys); ctx.lineTo(x0 + w / 2, ys - dh() * sc); ctx.stroke();
        D.module(ctx, x0 + w / 2 - 22, ytop - 48, 44, 26, `${Math.round(sim.p.V0)} mL`, { fill: '--pcb-2', size: 9 });
      }
      for (let k = 0; k <= 40; k += 5) { const y = ytop + 0.03 * sc + (k / 100) * sc; D.line(ctx, x0 + w, y, x0 + w + (k % 10 ? 6 : 12), y, { color: '--ink-3' }); if (k % 10 === 0) MC.text(ctx, `${k}`, x0 + w + 16, y + 4, { size: 10, mono: true, color: '--ink-3' }); }
      MC.text(ctx, 'cm', x0 + w + 16, ytop + 0.45 * sc + 14, { size: 10, color: '--ink-3' });
      const c2 = cg.ctx;
      D.clear(cg);
      const rows = tab.rows.filter((r) => r[0] === LIQ[sim.p.liq][0]);
      const { f } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, rows.map((r) => r[1]), rows.map((r) => r[2]), { xlabel: ['h', 'm'], ylabel: ['Δp', 'Pa'], title: `${LIQ[sim.p.liq][0]}: Δp contra h (referencia ρ = ${LIQ[sim.p.liq][1]} kg/m³)`, zeroX: true, zeroY: true, curve: (x) => LIQ[sim.p.liq][1] * G * x });
      sim.set('rho', f && rows.length >= 3 ? L.pm(f.m / G, f.sm / G, 'kg/m³') : 'mida al menos 3 profundidades');
    });
  });
})();
