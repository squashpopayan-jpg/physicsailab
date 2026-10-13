/* Capítulo 18 — Boosting */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     18.1 Gradient boosting paso a paso (regresión)
     ====================================================================== */
  ML.defineSim('gboost-pasos', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.group('Boosting');
    sim.slider('lr', { label: 'Tasa de aprendizaje η', min: 0.05, max: 1, step: 0.05, value: 0.3, fmt: f2 });
    sim.slider('depth', { label: 'Profundidad de cada árbol', min: 1, max: 4, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.button('Siguiente árbol', () => add(), { primary: true, id: 'next' });
    sim.button('+10 árboles', () => { for (let i = 0; i < 10; i++) add(); }, { id: 'ten' });
    sim.button('Empezar de nuevo', () => restart(), { id: 'restart' });
    sim.out('m', 'Árboles');
    sim.out('tr', 'MSE de entrenamiento');
    sim.out('te', 'MSE de prueba', { hl: true });
    const F = (x) => Math.sin(2.2 * x) + 0.3 * x, d = L.data.reg1d(80, F, 0.3, L.rng(4)), te = L.data.reg1d(500, F, 0.3, L.rng(5));
    let F0, trees, last;
    const pred = (x, k = trees.length) => { let s = F0; for (let i = 0; i < k; i++) s += sim.p.lr * trees[i].value1([x]); return s; };
    const restart = () => { F0 = L.stat.mean(d.y); trees = []; last = null; };
    const add = () => {
      const r = d.X.map((x, i) => d.y[i] - pred(x[0]));
      const t = L.tree.fit(d.X, r, { task: 'reg', maxDepth: Math.round(sim.p.depth) });
      trees.push(t); last = { t, r };
    };
    restart();
    sim.onChange = (id) => { if (id === 'lr' || id === 'depth') restart(); };
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const h1 = cv.h * 0.58;
      const pa = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: -1.7, xmax: 1.7, ymin: -2.2, ymax: 2.2, ylabel: 'y', title: `modelo acumulado F(x) con ${trees.length} árbol${trees.length === 1 ? '' : 'es'}`, mb: 20 });
      pa.frame();
      pa.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      if (trees.length > 1) pa.fn((x) => pred(x, trees.length - 1), { color: '--c1', width: 1.4, alpha: 0.45, n: 500 });
      pa.fn((x) => pred(x), { color: '--c1', width: 2.6, n: 600 });
      d.X.forEach((x, i) => pa.dot(x[0], d.y[i], { color: '--k1', r: 3.2 }));
      const pb = new ML.Plot(cv.ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: -1.7, xmax: 1.7, ymin: -1.6, ymax: 1.6, xlabel: 'x', ylabel: 'residuo', title: 'residuos antes del último árbol y lo que ese árbol aprendió' });
      pb.frame();
      pb.hline(0, { color: '--ink-3', dash: [] });
      if (last) {
        d.X.forEach((x, i) => pb.dot(x[0], last.r[i], { color: '--c6', r: 2.8 }));
        pb.fn((x) => last.t.value1([x]), { color: '--c2', width: 2.4, n: 600 });
        pb.fn((x) => sim.p.lr * last.t.value1([x]), { color: '--c2', width: 1.4, dash: [4, 3], n: 600 });
      } else ML.text(cv.ctx, 'pulse «Siguiente árbol»: el primer árbol aprende los residuos de la media', pb.ix + 10, pb.iy + 20, { size: 12, color: '--ink-2' });
      sim.set('m', String(trees.length));
      sim.set('tr', f3(L.met.mse(d.y, d.X.map((x) => pred(x[0])))));
      sim.set('te', f3(L.met.mse(te.y, te.X.map((x) => pred(x[0])))));
    });
  });

  /* ======================================================================
     18.2 AdaBoost: pesos de los datos ronda a ronda
     ====================================================================== */
  ML.defineSim('adaboost-pesos', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    ML.dataControls(sim, { kind: 'circles', n: 150, noise: 0.3, nmax: 300 });
    sim.group('AdaBoost con tocones');
    sim.slider('m', { label: 'Ronda m', min: 1, max: 60, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.check('stump', { label: 'Mostrar el tocón de esta ronda', value: true });
    sim.out('err', 'Error ponderado del tocón m', { hl: true });
    sim.out('alpha', 'Peso α del tocón');
    sim.out('acc', 'Exactitud del conjunto (entrenamiento / prueba)');
    let cache = null;
    sim.onDraw(() => {
      const key = `${sim.p.kind}|${sim.p.n}|${sim.p.noise}|${sim.p.seed}`;
      if (!cache || cache.key !== key) { const d = ML.makeData(sim), te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(9000 + sim.p.seed)); cache = { key, d, te, ada: L.ens.adaboost(d.X, d.y, { nEst: 60 }) }; }
      const { d, te, ada } = cache, m = Math.min(Math.round(sim.p.m), ada.learners.length);
      const view = ML.view2(cv, 2.2);
      ML.draw.clear(cv);
      ML.probMap(view, (a, b) => { const s = ada.score1([a, b], m); const tot = s[0] + s[1] || 1; return s[1] / tot; }, { res: 5, alpha: 0.55 });
      ML.labelEdges(view, (a, b) => ada.predict([[a, b]], m)[0], { res: 4, width: 2 });
      const w = ada.weightsHist[m - 1], wm = Math.max(...w);
      ML.points(view, d.X, d.y, { size: Array.from(w, (v) => 0.45 + 2.2 * Math.sqrt(v / wm)), r: 4 });
      if (sim.p.stump) { const st = ada.learners[m - 1]; ML.labelEdges(view, (a, b) => st.predict([[a, b]])[0], { res: 3, width: 2.6, color: '--c2' }); }
      ML.text(cv.ctx, 'tamaño de cada punto ∝ su peso en esta ronda · rojo: tocón de la ronda', 10, cv.h - 10, { size: 11, color: '--ink-2', halo: true });
      sim.set('err', f3(ada.errs[m - 1]));
      sim.set('alpha', f3(ada.alphas[m - 1]));
      sim.set('acc', `${pct(L.met.accuracy(d.y, ada.predict(d.X, m)))} / ${pct(L.met.accuracy(te.y, ada.predict(te.X, m)))}`);
    });
  });

  /* ======================================================================
     18.3 Parada temprana: pérdida de entrenamiento y validación
     ====================================================================== */
  ML.defineSim('parada-temprana', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 1.05 }), cm = sim.canvas({ aspect: 1.05 });
    sim.group('Gradient boosting (log-loss)');
    sim.seg('lr', { label: 'Tasa de aprendizaje', options: [[1, '1'], [0.3, '0.3'], [0.1, '0.1'], [0.03, '0.03']], value: 0.3 });
    sim.slider('depth', { label: 'Profundidad', min: 1, max: 6, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.slider('k', { label: 'Árboles usados para el mapa', min: 1, max: 300, step: 1, value: 60, fmt: (v) => ML.fix(v, 0) });
    sim.out('best', 'Mínimo de la pérdida de validación', { hl: true });
    sim.out('last', 'Validación con 300 árboles');
    let cache = null;
    sim.onDraw(() => {
      const key = `${sim.p.lr}|${sim.p.depth}`;
      if (!cache || cache.key !== key) {
        const tr = L.data.make2d('moons', 250, 0.45, L.rng(3)), va = L.data.make2d('moons', 800, 0.45, L.rng(4));
        cache = { key, tr, gb: L.ens.gboost(tr.X, tr.y, { loss: 'log', nEst: 300, lr: sim.p.lr, depth: Math.round(sim.p.depth), Xval: va.X, yval: va.y }) };
      }
      const { tr, gb } = cache, k = Math.round(sim.p.k);
      const kb = U.argmin(gb.valLoss);
      ML.draw.clear(cl);
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 300, ymin: 0, ymax: 0.8, xlabel: 'número de árboles', ylabel: 'log-loss', title: 'entrenamiento y validación' });
      pl.frame();
      pl.path(gb.trainLoss.map((v, i) => [i + 1, v]), { color: '--c3', width: 2.2 });
      pl.path(gb.valLoss.map((v, i) => [i + 1, Math.min(v, 0.8)]), { color: '--c2', width: 2.4 });
      pl.vline(kb + 1, { color: '--c2', label: 'mínimo' });
      pl.vline(k, { color: '--accent', dash: [] });
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'validación', color: '--c2' }]);
      const view = ML.view2(cm, 2.2);
      ML.draw.clear(cm);
      ML.probMap(view, (a, b) => U.sigmoid(gb.raw1([a, b], k)), { res: 5, alpha: 0.55 });
      ML.contour(view, (a, b) => gb.raw1([a, b], k), 0, { res: 4, width: 2 });
      ML.points(view, tr.X, tr.y, { r: 3.2 });
      sim.set('best', `${f3(gb.valLoss[kb])} con ${kb + 1} árboles`);
      sim.set('last', f3(gb.valLoss[299]));
    });
  });
})();
