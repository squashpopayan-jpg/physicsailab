/* Práctica F8 · Tensión superficial con la celda de carga */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const LQ = { agua: ['Agua destilada', 0.0728], jabon: ['Agua con detergente', 0.030], alcohol: ['Alcohol al 70 %', 0.025], leche: ['Leche', 0.045] };
  MC.defineSim('f8-tension', function (sim) {
    sim.cols2('0.8fr 1.3fr');
    const cs = sim.canvas({ aspect: 0.9, label: 'Anillo y película' });
    const cg = sim.canvas({ aspect: 1.15, label: 'Lectura de la celda' });
    const tab = MC.results(sim, ['Líquido', '<i>R</i> (mm)', '<i>m</i><sub>mín</sub> (g)', '<i>F</i><sub>máx</sub> (mN)', 'γ (N/m)'], { decimals: [0, 1, 3, 2, 4], title: 'Desprendimientos' });
    const hist = new MC.History(['m'], { minDt: 0.05, max: 6000 });
    /* kf: variación de una repetición a otra (limpieza, nivelación del anillo) */
    const f = 0.93;
    let x = -0.003, broken = false, mmin = 0, rupt = 0, kf = 1, nS = -1;
    sim.group('Líquido y anillo');
    sim.select('lq', { options: Object.keys(LQ).map((k) => [k, LQ[k][0]]), value: 'agua', reset: true });
    sim.slider('R', { label: 'Radio del anillo', min: 8, max: 25, step: 0.5, value: 15, unit: 'mm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('vel', { label: 'Rapidez con que baja el vaso', min: 0.2, max: 3, step: 0.1, value: 1, unit: 'mm/s', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.button('Agregar a la tabla', () => { if (broken) { const F = -mmin / 1000 * G; tab.add([LQ[sim.p.lq][0], sim.p.R, mmin, F * 1000, F / (4 * Math.PI * sim.p.R / 1000 * f)]); } }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('m', 'Lectura de la celda', { hl: true });
    sim.out('fmax', 'Fuerza máxima esperada');
    sim.out('res', 'γ promedio de este líquido');
    sim.run({
      h: 0.01, startLabel: 'Bajar el vaso',
      reset() { x = -0.003; broken = false; mmin = 0; hist.clear(); kf = 1 + M.gauss(0, 0.006); nS = -1; rupt = (0.0028 + 0.0004 * Math.random()) * Math.sqrt(LQ[sim.p.lq][1] / 0.0728); },
      step(h) {
        x += (sim.p.vel / 1000) * h;
        const Fmax = 4 * Math.PI * (sim.p.R / 1000) * LQ[sim.p.lq][1] * f * kf;
        let F = 0;
        if (x < 0) F = -0.0005 * (-x / 0.003);
        else if (!broken) { F = Fmax * Math.sin(Math.min(1, x / rupt) * Math.PI / 2); if (x > rupt * 1.02) broken = true; }
        /* el HX711 entrega 10 lecturas por segundo */
        const k = Math.floor(sim.t * 10);
        if (k !== nS) {
          nS = k;
          const m = (-F / G) * 1000 + M.gauss(0, 0.004);
          if (!broken) mmin = Math.min(mmin, m);
          hist.push(sim.t, { m }, true);
        }
        if (broken && x > rupt + 0.002) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 1) + ' s'
    });
    sim.onDraw(() => {
      const last = hist.n ? hist.last('m') : 0;
      sim.set('m', MC.fix(last, 3) + ' g' + (broken ? ' (se rompió la película)' : ''));
      sim.set('fmax', MC.fix(4 * Math.PI * (sim.p.R / 1000) * LQ[sim.p.lq][1] * f * 1000, 2) + ' mN');
      const rows = tab.rows.filter((r) => r[0] === LQ[sim.p.lq][0]);
      sim.set('res', rows.length ? L.pm(M.mean(rows.map((r) => r[4])), rows.length > 1 ? M.std(rows.map((r) => r[4])) / Math.sqrt(rows.length) : 0, 'N/m') + ` (ref. ${LQ[sim.p.lq][1]})` : '—');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = (W * 0.7) / 0.06;
      const yr = H * 0.4, rpx = (sim.p.R / 1000) * sc;
      const ywater = yr + x * sc * 4;
      D.fluid(ctx, W * 0.05, ywater, W * 0.9, H - ywater - 10, {});
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.05, ywater - 30); ctx.lineTo(W * 0.05, H - 10); ctx.lineTo(W * 0.95, H - 10); ctx.lineTo(W * 0.95, ywater - 30); ctx.stroke();
      if (x > 0 && !broken) { ctx.fillStyle = MC.alpha('--water', 0.35); ctx.beginPath(); ctx.moveTo(W / 2 - rpx - 6, yr); ctx.quadraticCurveTo(W / 2 - rpx - 14, ywater, W / 2 - rpx - 30, ywater); ctx.lineTo(W / 2 + rpx + 30, ywater); ctx.quadraticCurveTo(W / 2 + rpx + 14, ywater, W / 2 + rpx + 6, yr); ctx.closePath(); ctx.fill(); }
      ctx.save(); ctx.strokeStyle = MC.col('--copper'); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, yr, rpx, rpx * 0.18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      for (const dx of [-rpx, 0, rpx]) D.line(ctx, W / 2 + dx, yr, W / 2, 20, { color: '--rope', width: 1 });
      ctx.fillStyle = MC.col('--metal'); ctx.fillRect(W / 2 - 40, 8, 80, 12);
      const c2 = cg.ctx;
      D.clear(cg);
      const T = hist.d.t;
      const ymin = Math.min(-1.6, ...hist.d.m) * 1.1;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: Math.max(10, T.length ? T[T.length - 1] : 0), ymin, ymax: 0.3, xlabel: ['t', 's'], ylabel: ['m', 'g'], mt: 22, title: 'Celda de carga (tarada con el anillo en el aire)' });
      P.frame();
      P.hline(0, { color: '--ink-3' });
      P.xy(T, hist.d.m, { color: '--c5', width: 1.6 });
      if (broken) P.hline(mmin, { color: '--accent', label: `mínimo ${MC.fix(mmin, 3)} g`, below: true });
    });
  });
})();
