/* Capítulo 19 — Ajuste de hiperparámetros y selección de modelos */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     19.1 Rejilla frente a búsqueda aleatoria
     ====================================================================== */
  ML.defineSim('grid-vs-random', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 }), ch = sim.canvas({ aspect: 1 });
    sim.group('Presupuesto');
    sim.seg('N', { label: 'Evaluaciones', options: [[9, '9'], [16, '16'], [25, '25'], [49, '49']], value: 16 });
    sim.button('Otro sorteo aleatorio', () => { seed++; }, { id: 'seed' });
    sim.note('Puntaje ficticio: depende mucho de log C (eje horizontal, pico estrecho) y casi nada de log γ.');
    sim.out('g', 'Mejor puntaje con rejilla', { hl: true });
    sim.out('r', 'Mejor puntaje con búsqueda aleatoria', { hl: true });
    sim.out('avg', 'Promedio en 300 repeticiones: rejilla / aleatoria');
    sim.out('dv', 'Valores distintos de log C probados');
    let seed = 1;
    const S = (a, b) => 0.70 + 0.28 * Math.exp(-((a - 0.63) ** 2) / (2 * 0.06 ** 2)) + 0.015 * Math.sin(5 * b);
    const gridPts = (N) => { const k = Math.round(Math.sqrt(N)), out = []; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out.push([(i + 0.5) / k, (j + 0.5) / k]); return out; };
    const rndPts = (N, r) => Array.from({ length: N }, () => [r(), r()]);
    sim.onDraw(() => {
      const N = sim.p.N, G = gridPts(N), R = rndPts(N, L.rng(100 + seed));
      const bestG = Math.max(...G.map((p) => S(p[0], p[1]))), bestR = Math.max(...R.map((p) => S(p[0], p[1])));
      let ag = 0, ar = 0;
      for (let t = 0; t < 300; t++) { const r = L.rng(5000 + t), off = r(); const Gs = G.map((p) => [(p[0] + off / Math.sqrt(N)) % 1, p[1]]); ag += Math.max(...Gs.map((p) => S(p[0], p[1]))) / 300; ar += Math.max(...rndPts(N, r).map((p) => S(p[0], p[1]))) / 300; }
      ML.draw.clear(cs);
      const pl = new ML.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'log C (normalizado)', ylabel: 'log γ (normalizado)', title: 'espacio de búsqueda' });
      ML.heatmap(pl, (a, b) => [...ML.cmap.seq((S(a, b) - 0.68) / 0.32, '--c3'), 1], { res: 4 });
      pl.frame();
      G.forEach((p) => pl.dot(p[0], p[1], { color: '--c1', r: 4.5 }));
      R.forEach((p) => pl.dot(p[0], p[1], { color: '--c2', r: 4 }));
      pl.legend([{ label: 'rejilla', color: '--c1', kind: 'dot' }, { label: 'aleatoria', color: '--c2', kind: 'dot' }], 'tl');
      ML.draw.clear(ch);
      const pp = new ML.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 1, ymin: 0.68, ymax: 1, xlabel: 'log C (normalizado)', ylabel: 'puntaje', title: 'proyección sobre el hiperparámetro importante' });
      pp.frame();
      pp.fn((a) => S(a, 0.5), { color: '--c3', width: 2.2 });
      G.forEach((p) => pp.dot(p[0], S(p[0], p[1]), { color: '--c1', r: 4.5 }));
      R.forEach((p) => pp.dot(p[0], S(p[0], p[1]), { color: '--c2', r: 4 }));
      sim.set('g', f3(bestG)); sim.set('r', f3(bestR));
      sim.set('avg', `${f3(ag)} / ${f3(ar)} (máximo posible ${f3(S(0.63, 0.31))})`);
      sim.set('dv', `rejilla ${Math.round(Math.sqrt(N))} · aleatoria ${N}`);
    });
  });

  /* ======================================================================
     19.2 La maldición del ganador
     ====================================================================== */
  ML.defineSim('maldicion-ganador', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Experimento');
    sim.slider('K', { label: 'Modelos comparados', min: 1, max: 200, step: 1, value: 50, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.slider('n', { label: 'Tamaño del conjunto de validación', min: 30, max: 3000, step: 10, value: 100, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.slider('spread', { label: 'Diferencia real entre modelos (puntos)', min: 0, max: 5, step: 0.1, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.out('best', 'Puntaje medio del ganador en validación', { hl: true });
    sim.out('true', 'Exactitud real media del ganador');
    sim.out('opt', 'Optimismo');
    sim.onDraw(() => {
      const K = Math.round(sim.p.K), n = Math.round(sim.p.n), R = 400, r = L.rng(7);
      const wins = [], reals = [];
      for (let t = 0; t < R; t++) {
        let best = -1, real = 0;
        for (let k = 0; k < K; k++) {
          const p = 0.8 + (sim.p.spread / 100) * (k / Math.max(1, K - 1) - 0.5);
          const s = Math.min(1, Math.max(0, p + Math.sqrt((p * (1 - p)) / n) * r.gauss()));
          if (s > best) { best = s; real = p; }
        }
        wins.push(best); reals.push(real);
      }
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.7, xmax: 1, ymin: 0, ymax: 1, xlabel: 'exactitud', ylabel: 'densidad (relativa)', title: `${R} repeticiones: puntaje de validación del ganador frente a su exactitud real` });
      pl.frame();
      const hw = L.stat.hist(wins, 0.7, 1, 60), hr = L.stat.hist(reals, 0.7, 1, 60);
      const mx = Math.max(...hw.dens, ...hr.dens);
      ML.drawHist(pl, hr, { color: '--c3', alpha: 0.45, scale: 1 / mx });
      ML.drawHist(pl, hw, { color: '--c2', alpha: 0.5, scale: 1 / mx });
      pl.vline(L.stat.mean(reals), { color: '--c3', dash: [], label: 'real' });
      pl.vline(L.stat.mean(wins), { color: '--c2', dash: [], label: 'validación', labelY: 30 });
      pl.legend([{ label: 'puntaje del ganador en validación', color: '--c2', kind: 'sq' }, { label: 'exactitud real del ganador', color: '--c3', kind: 'sq' }], 'tl');
      sim.set('best', pct(L.stat.mean(wins)));
      sim.set('true', pct(L.stat.mean(reals)));
      sim.set('opt', ML.fix(100 * (L.stat.mean(wins) - L.stat.mean(reals)), 1) + ' puntos');
    });
  });

  /* ======================================================================
     19.3 Curva de validación de una SVM
     ====================================================================== */
  ML.defineSim('curva-validacion', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 1.05 }), cm = sim.canvas({ aspect: 1.05 });
    sim.group('SVM RBF sobre lunas');
    sim.slider('C', { label: 'C', min: 0.1, max: 100, value: 1, log: true, step: 0.1, fmt: (v) => ML.sci(v, 2) });
    sim.slider('lg', { label: 'log₁₀ γ para el mapa', min: -2, max: 2, step: 0.05, value: 0, fmt: f2 });
    sim.out('best', 'γ con mayor exactitud de validación cruzada', { hl: true });
    sim.out('cur', 'Con el γ del mapa: entrenamiento / validación');
    const d = L.data.make2d('moons', 150, 0.45, L.rng(21)), folds = L.data.stratKfold(d.y, 5, L.rng(2));
    const GS = Array.from(L.util.linspace(-2, 2, 17));
    let cache = null;
    const fit = (X, y, g) => L.svm.fit(X, y, { kernel: 'rbf', C: sim.p.C, gamma: Math.pow(10, g), tol: 1e-3 });
    sim.onDraw(() => {
      if (!cache || cache.C !== sim.p.C) {
        const rows = GS.map((g) => {
          const sc = folds.map((f) => { const m = fit(f.train.map((i) => d.X[i]), f.train.map((i) => d.y[i]), g); return [L.met.accuracy(f.test.map((i) => d.y[i]), m.predict(f.test.map((i) => d.X[i]))), L.met.accuracy(f.train.map((i) => d.y[i]), m.predict(f.train.map((i) => d.X[i])))]; });
          return { g, va: L.stat.mean(sc.map((s) => s[0])), sd: L.stat.std(sc.map((s) => s[0]), 0), tr: L.stat.mean(sc.map((s) => s[1])) };
        });
        cache = { C: sim.p.C, rows };
      }
      const rows = cache.rows, kb = U.argmax(rows.map((r) => r.va));
      ML.draw.clear(cc);
      const pl = new ML.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: -2, xmax: 2, ymin: 0.5, ymax: 1.02, xlabel: 'log₁₀ γ', ylabel: 'exactitud', title: 'curva de validación (5 pliegues)' });
      pl.frame();
      pl.clip((ctx) => { ctx.fillStyle = ML.alpha('--c2', 0.15); ctx.beginPath(); rows.forEach((r, i) => (i ? ctx.lineTo(pl.X(r.g), pl.Y(r.va + r.sd)) : ctx.moveTo(pl.X(r.g), pl.Y(r.va + r.sd)))); for (let i = rows.length - 1; i >= 0; i--) ctx.lineTo(pl.X(rows[i].g), pl.Y(rows[i].va - rows[i].sd)); ctx.fill(); });
      pl.path(rows.map((r) => [r.g, r.tr]), { color: '--c3', width: 2.2 });
      pl.path(rows.map((r) => [r.g, r.va]), { color: '--c2', width: 2.4 });
      pl.vline(rows[kb].g, { color: '--c2', label: 'mejor' });
      pl.vline(sim.p.lg, { color: '--accent', dash: [] });
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'validación (± desv.)', color: '--c2' }], 'bl');
      const m = fit(d.X, d.y, sim.p.lg), view = ML.view2(cm, 2.2);
      ML.draw.clear(cm);
      ML.probMap(view, (a, b) => U.sigmoid(2 * m.decision1([a, b])), { res: 5, alpha: 0.55 });
      ML.contour(view, (a, b) => m.decision1([a, b]), 0, { res: 4, width: 2 });
      ML.points(view, d.X, d.y, { r: 3.2 });
      const near = rows.reduce((a, r) => (Math.abs(r.g - sim.p.lg) < Math.abs(a.g - sim.p.lg) ? r : a));
      sim.set('best', `γ = ${ML.sci(Math.pow(10, rows[kb].g), 2)} (${pct(rows[kb].va)} ± ${ML.fix(100 * rows[kb].sd, 1)})`);
      sim.set('cur', `${pct(near.tr)} / ${pct(near.va)}`);
    });
  });
})();
