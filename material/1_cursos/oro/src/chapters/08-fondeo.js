/* Capítulo 8 — La cuenta de fondeo */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats, E = () => ML.L.eng, B = () => ML.L.lab;
  const ACC = 100000;

  /* ======================================================================
     8.1 Pisos
     ====================================================================== */
  ML.defineSim('pisos-ftmo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Secuencia');
    sim.slider('risk', { label: 'Riesgo por operación (% de la cuenta)', min: 0.125, max: 3, step: 0.125, value: 0.5, fmt: (v) => ML.fix(v, 3) + ' %' });
    sim.slider('ndays', { label: 'Días simulados', min: 20, max: 250, step: 10, value: 120, fmt: (v) => ML.fix(v, 0) });
    sim.slider('edge', { label: 'Ventaja por operación (R)', min: -0.1, max: 0.3, step: 0.01, value: 0, fmt: (v) => ML.R(v, 2) });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    sim.out('min', 'Distancia mínima a un piso (USD)', { hl: true });
    sim.out('fin', 'Equidad final');
    sim.out('hit', 'Resultado');
    let D = null, seed = 1, Rs = null;
    sim.withData(['m5'], (d) => {
      D = d;
      const { S, X } = B().get(d, 'm5'), P = E().params({ modo: 'ema', maxdist: 12, rechazo: false });
      const tr = E().run(S, X, P), m = tr.reduce((a, t) => a + t.R, 0) / tr.length;
      Rs = tr.map((t) => t.R - m);
      sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!Rs) return;
      const p = sim.p, rng = St().rng(seed * 4219 + 5), nd = Math.round(p.ndays), risk = ACC * p.risk / 100;
      let bal = ACC, minDist = Infinity, status = 'dentro de los límites';
      const xs = [0], eq = [ACC], floorD = [ACC - 4500];
      let dayStart = ACC, tradeX = 0, hitAt = -1;
      const dayFloors = [];
      for (let d = 0; d < nd; d++) {
        dayStart = bal;
        const k = Math.min(2, rng.poisson(0.8));
        let dp = 0, locked = false;
        dayFloors.push({ x0: tradeX, y: dayStart - 5000, yb: dayStart - 4500 });
        for (let q = 0; q < k && !locked; q++) {
          const r = Rs[rng.int(Rs.length)] + p.edge, pnl = r * risk;
          bal += pnl; dp += pnl; tradeX++;
          xs.push(tradeX); eq.push(bal);
          const dist = Math.min(bal - (dayStart - 5000), bal - 90000);
          if (dist < minDist) minDist = dist;
          if (bal <= dayStart - 5000 || bal <= 90000) { status = 'LÍMITE DE LA FIRMA TOCADO'; hitAt = tradeX; locked = true; d = nd; }
          if (dp <= -250 * (p.risk / 0.125) || dp >= 180 * (p.risk / 0.125)) locked = true;
        }
        dayFloors[dayFloors.length - 1].x1 = tradeX;
      }
      const n = Math.max(2, tradeX);
      const ymin = Math.min(88000, ...eq) - 500, ymax = Math.max(...eq, ACC + 500) + 800;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin, ymax, ml: 66, mb: 44, xlabel: 'Operaciones', ylabel: 'Equidad (USD)', yfmt: (v) => ML.fix(v / 1000, 1) + ' k' });
      pl.frame();
      pl.hline(90000, { color: '--c2', width: 2, dash: [], label: 'piso total de la firma (90 000)' });
      pl.hline(91000, { color: '--c4', width: 1.4, dash: [5, 4], label: 'piso total del bot (91 000)', labelRight: true });
      dayFloors.forEach((f) => { if (f.x1 === undefined || f.x1 === f.x0) return; pl.xy([f.x0, f.x1], [f.y, f.y], { color: '--c2', width: 1.2, alpha: 0.55 }); pl.xy([f.x0, f.x1], [f.yb, f.yb], { color: '--c4', width: 1, dash: [3, 3], alpha: 0.6 }); });
      pl.xy(xs, eq, { color: '--accent', width: 2.2 });
      sim.set('min', ML.usd(minDist, 0));
      sim.set('fin', ML.usd(eq[eq.length - 1], 0) + ' <small>(' + ML.pct(eq[eq.length - 1] / ACC - 1, 2) + ')</small>');
      sim.set('hit', status);
    });
  });

  /* ======================================================================
     8.2 Stops necesarios para tocar cada límite
     ====================================================================== */
  ML.defineSim('margen-stops', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, maxH: '380px' });
    sim.group('Riesgo');
    sim.slider('mine', { label: 'Su riesgo por operación (%)', min: 0.05, max: 3, step: 0.025, value: 0.125, fmt: (v) => ML.fix(v, 3) + ' %' });
    sim.out('d', 'Stops para el límite diario (5 %)', { hl: true });
    sim.out('t', 'Stops para el límite total (10 %)', { hl: true });
    sim.out('cap', 'Pérdida máxima diaria con 2 balas');
    const levels = [0.125, 0.25, 0.5, 1, 2];
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const mine = sim.p.mine, vals = levels.concat([mine]).sort((a, b) => a - b).filter((v, i, a) => a.indexOf(v) === i);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: vals.length + 0.5, ymin: 1, ymax: 1000, ylog: true, ml: 54, mb: 52, ylabel: 'Stops completos necesarios', xticks: vals.map((_, i) => i + 1), xfmt: (v) => ML.fix(vals[v - 1], vals[v - 1] < 0.2 || vals[v - 1] % 0.125 !== 0 ? 3 : 3) + ' %' });
      pl.frame();
      pl.hline(2, { color: '--ink-3', dash: [4, 3], label: '2 balas por día' });
      vals.forEach((v, i) => {
        const dd = 5 / v, tt = 10 / v, hl = Math.abs(v - mine) < 1e-9;
        ML.draw.bars(pl, [i + 1 - 0.18], [dd], 0.32, { color: hl ? '--c4' : '--accent', alpha: 0.85 });
        ML.draw.bars(pl, [i + 1 + 0.18], [tt], 0.32, { color: hl ? '--c2' : '--c1', alpha: 0.85 });
        ML.text(cv.ctx, ML.fix(dd, dd < 10 ? 1 : 0), pl.X(i + 1 - 0.18), pl.Y(dd) - 5, { size: 10.5, mono: true, color: '--ink-2', align: 'center' });
        ML.text(cv.ctx, ML.fix(tt, tt < 10 ? 1 : 0), pl.X(i + 1 + 0.18), pl.Y(tt) - 5, { size: 10.5, mono: true, color: '--ink-2', align: 'center' });
      });
      pl.legend([{ label: 'límite diario 5 %', color: '--accent', kind: 'sq' }, { label: 'límite total 10 %', color: '--c1', kind: 'sq' }], 'tr');
      sim.set('d', ML.fix(5 / mine, 1));
      sim.set('t', ML.fix(10 / mine, 1));
      sim.set('cap', ML.usd(2 * 1000 * mine) + ' = ' + ML.pct(2 * mine / 100, 2) + ' de la cuenta');
    });
  });
})();
