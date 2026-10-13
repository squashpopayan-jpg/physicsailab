/* Capítulo 10 — Regresión logística */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     10.1 Sigmoide en 1D
     ====================================================================== */
  ML.defineSim('logistica-1d', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Datos');
    sim.slider('sep', { label: 'Separación de las clases', min: 0.3, max: 5, step: 0.05, value: 1, fmt: f2 });
    sim.button('Nueva muestra', () => { seed++; }, { id: 'new' });
    sim.group('Modelo σ(β₀ + β₁x)');
    sim.slider('b0', { label: 'Intercepto β₀', min: -20, max: 5, step: 0.05, value: -2, fmt: f2 });
    sim.slider('b1', { label: 'Pendiente β₁', min: -1, max: 4, step: 0.01, value: 0.3, fmt: f2 });
    sim.button('Ajustar (máxima verosimilitud)', () => { sim.ctl.b0.set(ML.M.clamp(fit.intercept, -20, 5), true); sim.ctl.b1.set(ML.M.clamp(fit.coef[0], -1, 4), true); }, { primary: true, id: 'fit' });
    sim.out('ll', 'Log-loss con sus valores', { hl: true });
    sim.out('llb', 'Log-loss óptima');
    sim.out('fit', 'β₀, β₁ óptimos');
    sim.out('x50', 'Punto con p = 0.5');
    let seed = 1, fit, X, Y;
    sim.onDraw(() => {
      const r = L.rng(70 + seed);
      X = []; Y = [];
      for (let i = 0; i < 50; i++) { const x = 10 * r(); X.push(x); Y.push(r() < U.sigmoid(sim.p.sep * 0.9 * (x - 5)) ? 1 : 0); }
      fit = L.lin.logistic(X.map((v) => [v]), Y, { C: 1e6, maxIt: 200 });
      const ll = (b0, b1) => L.met.logloss(Y, X.map((x) => U.sigmoid(b0 + b1 * x)));
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 10, ymin: -0.1, ymax: 1.1, xlabel: 'x', ylabel: 'P(y = 1 | x)' });
      pl.frame();
      pl.hline(0.5, { color: '--ink-3' });
      pl.fn((x) => U.sigmoid(fit.intercept + fit.coef[0] * x), { color: '--ink-3', dash: [5, 4], width: 1.5 });
      pl.fn((x) => U.sigmoid(sim.p.b0 + sim.p.b1 * x), { color: '--c1', width: 2.6 });
      X.forEach((x, i) => { const p = U.sigmoid(sim.p.b0 + sim.p.b1 * x); pl.clip((ctx) => { ctx.strokeStyle = ML.alpha('--c2', 0.35); ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(Y[i])); ctx.lineTo(pl.X(x), pl.Y(p)); ctx.stroke(); }); pl.dot(x, Y[i] + (Y[i] ? -0.025 : 0.025) * ((i % 3) - 1), { color: ML.kvar(Y[i]), r: 4 }); });
      pl.legend([{ label: 'su curva', color: '--c1' }, { label: 'máxima verosimilitud', color: '--ink-3', dash: [5, 4] }], 'tl');
      sim.set('ll', f3(ll(sim.p.b0, sim.p.b1)));
      sim.set('llb', f3(ll(fit.intercept, fit.coef[0])));
      sim.set('fit', `${f2(fit.intercept)}, ${f2(fit.coef[0])}`);
      sim.set('x50', Math.abs(sim.p.b1) > 1e-6 ? `x = ${f2(-sim.p.b0 / sim.p.b1)}` : '—');
    });
  });

  /* ======================================================================
     10.2 Entrenamiento de una logística 2D
     ====================================================================== */
  ML.defineSim('logistica-2d', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.5, cls: 'full' }), cl = sim.canvas({ aspect: 4, cls: 'full' });
    ML.dataControls(sim, { kind: 'moons', n: 200, noise: 0.3, nmax: 400 });
    sim.group('Modelo');
    sim.seg('deg', { label: 'Grado de los rasgos', options: [[1, '1'], [2, '2'], [3, '3'], [6, '6']], value: 1 });
    sim.slider('C', { label: 'C (inverso de la regularización)', min: 0.001, max: 1000, value: 1, log: true, step: 0.001, fmt: (v) => ML.sci(v, 2) });
    sim.slider('lr', { label: 'Tasa de Adam', min: 0.005, max: 0.5, value: 0.08, log: true, step: 0.001, fmt: f3 });
    sim.out('it', 'Iteraciones');
    sim.out('loss', 'Log-loss de entrenamiento', { hl: true });
    sim.out('acc', 'Exactitud entrenamiento / prueba');
    sim.out('w', '‖w‖');
    let d, te, S, F, Ft, w, opt, it, hist;
    const phi = (X) => S.transform(L.data.poly(X, sim.p.deg));
    const restart = () => {
      d = ML.makeData(sim); te = ML.makeData(sim, 99);
      if (sim.p.n > 0) te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(4000 + sim.p.seed));
      S = L.data.standardizer(L.data.poly(d.X, sim.p.deg));
      F = phi(d.X); Ft = phi(te.X);
      w = new Float64Array(F[0].length + 1); opt = L.opt.make('adam', { lr: sim.p.lr }); it = 0; hist = [];
    };
    restart();
    sim.onData = restart;
    sim.onChange = (id) => { if (id === 'lr') opt.lr = sim.p.lr; else if (id !== 'C') restart(); else hist = []; };
    sim.resetButton(restart);
    const lam = () => 1 / (sim.p.C * F.length);
    sim.animate(() => {
      if (it > 6000) return;
      for (let k = 0; k < 8; k++) { const r = L.lin.logLossGrad(F, d.y, w, lam()); opt.step(w, r.g); it++; if (k === 7) hist.push([it, r.loss]); }
      if (hist.length > 800) hist.shift();
    });
    const z = (f) => { let s = w[0]; for (let j = 0; j < f.length; j++) s += w[j + 1] * f[j]; return s; };
    sim.onDraw(() => {
      const view = ML.view2(cv, 2.2);
      ML.draw.clear(cv);
      ML.probMap(view, (a, b) => U.sigmoid(z(phi([[a, b]])[0])), { res: 5, alpha: 0.6 });
      ML.contour(view, (a, b) => z(phi([[a, b]])[0]), 0, { res: 4, width: 2.2 });
      ML.points(view, d.X, d.y, { r: 3.6 });
      ML.draw.clear(cl);
      const lmax = hist.length ? Math.max(0.75, ...hist.map((h) => h[1])) : 0.8;
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: hist.length ? hist[0][0] : 0, xmax: Math.max(10, it), ymin: 0, ymax: lmax, xlabel: 'iteraciones', ylabel: 'pérdida', mb: 34 });
      pl.frame();
      if (hist.length > 1) pl.path(hist, { color: '--c2', width: 2 });
      const r = L.lin.logLossGrad(F, d.y, w, lam());
      const acc = (FF, y) => L.met.accuracy(y, FF.map((f) => (z(f) >= 0 ? 1 : 0)));
      sim.set('it', String(it));
      sim.set('loss', f3(r.loss));
      sim.set('acc', `${pct(acc(F, d.y))} / ${pct(acc(Ft, te.y))}`);
      sim.set('w', f2(Math.hypot(...Array.from(w).slice(1))));
    });
  });

  /* ======================================================================
     10.3 Softmax con tres clases
     ====================================================================== */
  ML.defineSim('softmax-regiones', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.group('Datos y modelo');
    sim.slider('noise', { label: 'Dispersión de las clases', min: 0.05, max: 1, step: 0.01, value: 0.45, fmt: f2 });
    sim.slider('C', { label: 'C', min: 0.01, max: 100, value: 1, log: true, step: 0.01, fmt: (v) => ML.sci(v, 2) });
    sim.check('hard', { label: 'Colorear solo la clase ganadora', value: false });
    sim.out('acc', 'Exactitud de entrenamiento', { hl: true });
    sim.out('pt', 'Probabilidades en el centro (0, 0)');
    sim.onDraw(() => {
      const d = L.data.make2d('blobs3', 210, sim.p.noise, L.rng(5));
      const m = L.lin.softmax(d.X, d.y, { C: sim.p.C, K: 3 });
      const view = ML.view2(cv, 2.3);
      ML.draw.clear(cv);
      ML.probMap(view, (a, b) => m.proba([[a, b]])[0], { res: 5, alpha: 0.6, hard: sim.p.hard });
      ML.labelEdges(view, (a, b) => m.predict([[a, b]])[0], { res: 3, width: 1.8 });
      ML.points(view, d.X, d.y, { r: 3.8, shapes: true });
      sim.set('acc', pct(L.met.accuracy(d.y, m.predict(d.X))));
      sim.set('pt', m.proba([[0, 0]])[0].map(f3).join(' · '));
    });
  });
})();
