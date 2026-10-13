/* Capítulo 9 — Métricas de regresión y pérdidas robustas */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     9.1 Sensibilidad de las métricas a un error grande
     ====================================================================== */
  ML.defineSim('metricas-sensibilidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Predicciones');
    sim.slider('big', { label: 'Error Δ de una predicción', min: 0, max: 60, step: 0.5, value: 0, fmt: f2 });
    sim.check('zero', { label: 'Un valor real cercano a cero (y = 0.5)', value: false });
    sim.out('rmse', 'RMSE', { hl: true });
    sim.out('mae', 'MAE');
    sim.out('med', 'MedAE');
    sim.out('mape', 'MAPE');
    sim.out('ratio', 'RMSE / MAE');
    const r = L.rng(2), base = U.range(20).map(() => 20 + 10 * r()), e0 = U.range(20).map(() => 1.5 * r.gauss());
    sim.onDraw(() => {
      const y = base.slice(), e = e0.slice();
      e[0] += sim.p.big;
      if (sim.p.zero) { y[5] = 0.5; e[5] = 1.2; }
      const p = y.map((v, i) => v - e[i]);
      const M = { rmse: L.met.rmse(y, p), mae: L.met.mae(y, p), med: L.met.medae(y, p), mape: 100 * L.met.mape(y, p) };
      ML.draw.clear(cv);
      const w2 = cv.w * 0.5;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: w2, h: cv.h, xmin: 0, xmax: 21, ymin: -10, ymax: 62, xlabel: 'predicción', ylabel: 'error y − ŷ', title: 'los 20 errores' });
      pl.frame();
      pl.clip((ctx) => { e.forEach((v, i) => { ctx.fillStyle = ML.col(i === 0 ? '--c2' : i === 5 && sim.p.zero ? '--c4' : '--c1'); const a = pl.Y(Math.max(0, v)), b = pl.Y(Math.min(0, v)); ctx.fillRect(pl.X(i + 1) - 6, a, 12, Math.max(1, b - a)); }); });
      const items = [
        { label: 'RMSE', value: M.rmse, color: '--c2' }, { label: 'MAE', value: M.mae, color: '--c1' },
        { label: 'MedAE', value: M.med, color: '--c3' }, { label: 'MAPE (%)', value: M.mape, color: '--c4' }
      ];
      ML.text(cv.ctx, 'valor de cada métrica', w2 + 20, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: w2 + 10, y: 30, w: w2 - 20, h: cv.h - 46 }, items, { labelW: 80, max: Math.max(20, ...items.map((i) => i.value)) * 1.05, fmt: f2 });
      sim.set('rmse', f3(M.rmse)); sim.set('mae', f3(M.mae)); sim.set('med', f3(M.med)); sim.set('mape', f2(M.mape) + ' %');
      sim.set('ratio', f2(M.rmse / M.mae) + (M.rmse / M.mae > 1.5 ? '  (colas pesadas)' : ''));
    });
  });

  /* ======================================================================
     9.2 MCO, Huber y mediana con atípicos
     ====================================================================== */
  ML.defineSim('robusta-atipicos', function (sim) {
    const cv = sim.canvas({ aspect: 1.65 });
    sim.group('Atípicos');
    sim.slider('k', { label: 'Número de atípicos', min: 0, max: 12, step: 1, value: 5, fmt: (v) => ML.fix(v, 0) });
    sim.slider('mag', { label: 'Tamaño de los atípicos', min: 2, max: 25, step: 0.5, value: 12, fmt: f2 });
    sim.check('lever', { label: 'Atípicos con x extremo (alta palanca)', value: false });
    sim.group('Huber');
    sim.slider('eps', { label: 'Umbral ε (en desviaciones)', min: 1, max: 6, step: 0.05, value: 1.35, fmt: f2 });
    sim.out('ols', 'MCO: pendiente / intercepto', { hl: true });
    sim.out('hub', 'Huber: pendiente / intercepto');
    sim.out('lad', 'Mediana: pendiente / intercepto');
    sim.out('tru', 'Verdadero');
    const r = L.rng(7), base = U.range(50).map(() => { const x = 10 * r(); return [x, 1 + 0.6 * x + 0.8 * r.gauss()]; });
    const extra = U.range(12).map(() => [r(), r()]);
    sim.onDraw(() => {
      const pts = base.slice();
      for (let k = 0; k < sim.p.k; k++) { const x = sim.p.lever ? 11.5 + 2 * extra[k][0] : 2 + 6 * extra[k][0]; pts.push([x, 1 + 0.6 * x + sim.p.mag * (sim.p.lever ? -1 : 1) * (0.8 + 0.4 * extra[k][1])]); }
      const X = pts.map((p) => [p[0]]), Y = pts.map((p) => p[1]);
      const o = L.lin.ols(X, Y, { stats: false }), h = L.lin.huber(X, Y, sim.p.eps), q = L.lin.quantile(X, Y, 0.5);
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 14, ymin: -25, ymax: 35, xlabel: 'x', ylabel: 'y' });
      pl.frame();
      pl.fn((x) => 1 + 0.6 * x, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pl.fn((x) => o.intercept + o.coef[0] * x, { color: '--c2', width: 2.4 });
      pl.fn((x) => h.intercept + h.coef[0] * x, { color: '--c1', width: 2.4 });
      pl.fn((x) => q.intercept + q.coef[0] * x, { color: '--c3', width: 2.2, dash: [7, 4] });
      pts.forEach((p, i) => pl.dot(p[0], p[1], { color: i >= 50 ? '--c2' : '--k0', r: i >= 50 ? 5 : 3.6 }));
      pl.legend([{ label: 'mínimos cuadrados', color: '--c2' }, { label: 'Huber', color: '--c1' }, { label: 'mediana (pérdida absoluta)', color: '--c3', dash: [7, 4] }, { label: 'verdadera', color: '--ink-3', dash: [5, 4] }], 'tl');
      sim.set('ols', `${f3(o.coef[0])} / ${f3(o.intercept)}`);
      sim.set('hub', `${f3(h.coef[0])} / ${f3(h.intercept)}`);
      sim.set('lad', `${f3(q.coef[0])} / ${f3(q.intercept)}`);
      sim.set('tru', '0.600 / 1.000');
    });
  });

  /* ======================================================================
     9.3 Regresión cuantílica e intervalos
     ====================================================================== */
  ML.defineSim('cuantilica', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.group('Intervalo');
    sim.slider('tau', { label: 'Cuantil inferior τ (el superior es 1 − τ)', min: 0.02, max: 0.45, step: 0.01, value: 0.1, fmt: f2 });
    sim.check('het', { label: 'Ruido heterocedástico', value: true });
    sim.check('cst', { label: 'Mostrar intervalo constante ŷ ± zσ̂', value: true });
    sim.out('nom', 'Cobertura nominal', { hl: true });
    sim.out('cq', 'Cobertura cuantílica: izq. / der. / total');
    sim.out('cc', 'Cobertura constante: izq. / der. / total');
    sim.onDraw(() => {
      const r = L.rng(11), n = 300, X = [], Y = [];
      for (let i = 0; i < n; i++) { const x = 10 * r(); X.push([x]); Y.push(2 + 1.2 * x + (sim.p.het ? 0.3 + 0.5 * x : 2.5) * r.gauss()); }
      const tau = sim.p.tau, lo = L.lin.quantile(X, Y, tau), hi = L.lin.quantile(X, Y, 1 - tau), o = L.lin.ols(X, Y, { stats: false });
      const z = L.stat.normQuantile(1 - tau), s = o.sigma;
      const cover = (f1, f2, sel) => { const I = U.range(n).filter(sel); return I.filter((i) => Y[i] >= f1(X[i][0]) && Y[i] <= f2(X[i][0])).length / I.length; };
      const ql = (x) => lo.intercept + lo.coef[0] * x, qh = (x) => hi.intercept + hi.coef[0] * x, cl = (x) => o.intercept + o.coef[0] * x - z * s, ch = (x) => o.intercept + o.coef[0] * x + z * s;
      ML.draw.clear(cv);
      const h1 = cv.h * 0.7;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: 0, xmax: 10, ymin: -8, ymax: 28, xlabel: 'x', ylabel: 'y', mb: 30 });
      pl.frame();
      pl.clip((ctx) => { ctx.fillStyle = ML.alpha('--c1', 0.13); ctx.beginPath(); for (let k = 0; k <= 50; k++) { const x = (10 * k) / 50; k ? ctx.lineTo(pl.X(x), pl.Y(qh(x))) : ctx.moveTo(pl.X(x), pl.Y(qh(x))); } for (let k = 50; k >= 0; k--) { const x = (10 * k) / 50; ctx.lineTo(pl.X(x), pl.Y(ql(x))); } ctx.fill(); });
      X.forEach((x, i) => pl.dot(x[0], Y[i], { color: '--k0', r: 2.6 }));
      pl.fn(ql, { color: '--c1', width: 2.2 }); pl.fn(qh, { color: '--c1', width: 2.2 });
      if (sim.p.cst) { pl.fn(cl, { color: '--c2', width: 1.8, dash: [6, 4] }); pl.fn(ch, { color: '--c2', width: 1.8, dash: [6, 4] }); }
      pl.legend([{ label: `cuantiles ${f2(tau)} y ${f2(1 - tau)}`, color: '--c1' }, { label: 'ŷ ± z σ̂ (constante)', color: '--c2', dash: [6, 4] }], 'tl');
      const pp = new ML.Plot(cv.ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: -3, xmax: 3, ymin: 0, ymax: 3, xlabel: 'residuo e = y − q', ylabel: 'pérdida', title: `pérdida pinball para τ = ${f2(1 - tau)}` });
      pp.frame();
      pp.fn((e) => L.lin.pinball(e, 1 - tau), { color: '--c5', width: 2.4 });
      pp.fn((e) => Math.abs(e) * 0.5, { color: '--ink-3', dash: [4, 4], width: 1.2 });
      const left = (i) => X[i][0] < 5, right = (i) => X[i][0] >= 5, all = () => true;
      const pc = (v) => ML.fix(100 * v, 1) + ' %';
      sim.set('nom', pc(1 - 2 * tau));
      sim.set('cq', `${pc(cover(ql, qh, left))} / ${pc(cover(ql, qh, right))} / ${pc(cover(ql, qh, all))}`);
      sim.set('cc', `${pc(cover(cl, ch, left))} / ${pc(cover(cl, ch, right))} / ${pc(cover(cl, ch, all))}`);
    });
  });
})();
