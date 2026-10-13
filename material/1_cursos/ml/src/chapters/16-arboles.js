/* Capítulo 16 — Árboles de decisión */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';
  const gini = (a, b) => { const n = a + b; return n ? 1 - (a / n) ** 2 - (b / n) ** 2 : 0; };

  /* ======================================================================
     16.1 Elegir el umbral de una división
     ====================================================================== */
  ML.defineSim('elegir-corte', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1.1 }), cg = sim.canvas({ aspect: 1.1 });
    sim.group('División');
    sim.seg('f', { label: 'Variable', options: [[0, 'x₁'], [1, 'x₂']], value: 0 });
    sim.slider('t', { label: 'Umbral t', min: -2, max: 2, step: 0.01, value: 0.2, fmt: f2 });
    sim.button('Ir al mejor umbral', () => sim.ctl.t.set(best.t, true), { primary: true, id: 'best' });
    sim.out('kids', 'Izquierda / derecha (azul:naranja)');
    sim.out('g', 'Gini: padre → ponderado de los hijos');
    sim.out('gain', 'Ganancia', { hl: true });
    sim.out('bt', 'Mejor umbral de esta variable');
    const d = L.data.make2d('moons', 160, 0.3, L.rng(12));
    let best = { t: 0, g: 0 };
    sim.onDraw(() => {
      const f = sim.p.f, xs = d.X.map((r) => r[f]);
      const n0 = d.y.filter((v) => !v).length, n1 = d.y.length - n0, gp = gini(n0, n1);
      const split = (t) => { let a0 = 0, a1 = 0, b0 = 0, b1 = 0; xs.forEach((x, i) => { if (x <= t) d.y[i] ? a1++ : a0++; else d.y[i] ? b1++ : b0++; }); const nl = a0 + a1, nr = b0 + b1; return { a0, a1, b0, b1, g: (nl * gini(a0, a1) + nr * gini(b0, b1)) / (nl + nr) }; };
      const T = Array.from(L.util.linspace(-2, 2, 201)), G = T.map((t) => gp - split(t).g);
      const k = U.argmax(G); best = { t: T[k], g: G[k] };
      const s = split(sim.p.t);
      const view = ML.view2(cd, 2.1);
      ML.draw.clear(cd);
      ML.heatmap(view, (a, b) => { const v = f === 0 ? a : b, left = v <= sim.p.t; const p = left ? s.a1 / Math.max(1, s.a0 + s.a1) : s.b1 / Math.max(1, s.b0 + s.b1); const c = ML.rgb(p >= 0.5 ? '--k1' : '--k0'), bg = ML.rgb('--canvas'), tt = 0.15 + 0.35 * Math.abs(p - 0.5) * 2; return [bg[0] + (c[0] - bg[0]) * tt, bg[1] + (c[1] - bg[1]) * tt, bg[2] + (c[2] - bg[2]) * tt, 1]; }, { res: 5 });
      const ctx = cd.ctx;
      ctx.save(); ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 2.4; ctx.beginPath();
      if (f === 0) { ctx.moveTo(view.X(sim.p.t), 0); ctx.lineTo(view.X(sim.p.t), cd.h); } else { ctx.moveTo(0, view.Y(sim.p.t)); ctx.lineTo(cd.w, view.Y(sim.p.t)); }
      ctx.stroke(); ctx.restore();
      ML.points(view, d.X, d.y, { r: 3.6 });
      ML.draw.clear(cg);
      const pl = new ML.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: -2, xmax: 2, ymin: 0, ymax: Math.max(0.05, ...G) * 1.15, xlabel: `umbral sobre x${f ? '₂' : '₁'}`, ylabel: 'ganancia de Gini', title: 'ganancia para cada umbral' });
      pl.frame();
      pl.xy(T, G, { color: '--c5', width: 2.2 });
      pl.vline(best.t, { color: '--c3', dash: [], label: 'máximo' });
      pl.vline(sim.p.t, { color: '--ink', dash: [4, 3] });
      pl.dot(sim.p.t, gp - s.g, { color: '--ink', r: 5 });
      sim.set('kids', `${s.a0}:${s.a1}  |  ${s.b0}:${s.b1}`);
      sim.set('g', `${f3(gp)} → ${f3(s.g)}`);
      sim.set('gain', f3(gp - s.g));
      sim.set('bt', `t = ${f2(best.t)} (ganancia ${f3(best.g)})`);
    });
  });

  /* ======================================================================
     16.2 Árbol que crece: partición y diagrama
     ====================================================================== */
  ML.defineSim('arbol-crece', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 }), ct = sim.canvas({ aspect: 1 });
    ML.dataControls(sim, { kind: 'moons', n: 200, noise: 0.35, nmax: 400, multi: true });
    sim.group('Árbol');
    sim.slider('depth', { label: 'Profundidad máxima', min: 1, max: 12, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.slider('leaf', { label: 'Mínimo de casos por hoja', min: 1, max: 30, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.seg('crit', { label: 'Criterio', options: [['gini', 'Gini'], ['entropy', 'Entropía']], value: 'gini' });
    sim.slider('alpha', { label: 'Poda: α de costo–complejidad', min: 0, max: 0.05, step: 0.0005, value: 0, fmt: (v) => ML.fix(v, 4) });
    sim.out('leaves', 'Hojas / profundidad real');
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.onDraw(() => {
      const d = ML.makeData(sim), te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(7100 + sim.p.seed));
      const K = Math.max(...d.y) + 1;
      let t = L.tree.fit(d.X, d.y, { K, maxDepth: Math.round(sim.p.depth), minLeaf: Math.round(sim.p.leaf), criterion: sim.p.crit });
      if (sim.p.alpha > 0) t = L.tree.prune(t, sim.p.alpha);
      const view = ML.view2(cm, 2.3);
      ML.draw.clear(cm);
      ML.probMap(view, (a, b) => t.value1([a, b]), { res: 4, alpha: 0.6 });
      ML.labelEdges(view, (a, b) => t.leafOf([a, b]).id, { res: 3, width: 1, alpha: 0.35, color: '--ink-2' });
      ML.labelEdges(view, (a, b) => U.argmax(t.value1([a, b])), { res: 3, width: 1.8 });
      ML.points(view, d.X, d.y, { r: 3.3, shapes: K > 2 });
      ML.draw.clear(ct);
      ML.drawTree(ct.ctx, { x: 10, y: 8, w: ct.w - 20, h: ct.h - 22 }, t, { maxDepth: 6, leafText: (nd) => String(nd.n) });
      if (t.depth() > 6) ML.text(ct.ctx, 'diagrama recortado a 6 niveles', 10, ct.h - 8, { size: 11, color: '--ink-3' });
      sim.set('leaves', `${t.leaves().length} / ${t.depth()}`);
      sim.set('tr', pct(L.met.accuracy(d.y, t.predict(d.X))));
      sim.set('te', pct(L.met.accuracy(te.y, t.predict(te.X))));
    });
  });

  /* ======================================================================
     16.3 Árbol de regresión e inestabilidad
     ====================================================================== */
  ML.defineSim('arbol-regresion', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Árbol de regresión');
    sim.slider('depth', { label: 'Profundidad máxima', min: 1, max: 10, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.check('boot', { label: 'Diez muestras bootstrap y su promedio', value: false });
    sim.button('Nueva muestra', () => { seed++; }, { id: 'new' });
    sim.out('leaves', 'Hojas (escalones)');
    sim.out('te', 'MSE de prueba del árbol', { hl: true });
    sim.out('bag', 'MSE de prueba del promedio de 10');
    let seed = 1;
    sim.onDraw(() => {
      const F = (x) => Math.sin(2.2 * x), d = L.data.reg1d(70, F, 0.3, L.rng(200 + seed)), te = L.data.reg1d(500, F, 0.3, L.rng(5));
      const dep = Math.round(sim.p.depth), t = L.tree.fit(d.X, d.y, { task: 'reg', maxDepth: dep });
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -2, xmax: 2, ymin: -2, ymax: 2, xlabel: 'x', ylabel: 'y' });
      pl.frame();
      pl.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      let bagMSE = '—';
      if (sim.p.boot) {
        const r = L.rng(77 + seed), trees = [];
        for (let b = 0; b < 10; b++) { const idx = Array.from({ length: 70 }, () => r.int(70)); trees.push(L.tree.fit(d.X, d.y, { task: 'reg', maxDepth: dep, idx })); }
        trees.forEach((tb) => pl.fn((x) => tb.value1([x]), { color: '--c1', width: 1.1, alpha: 0.45, n: 600 }));
        const avg = (x) => L.stat.mean(trees.map((tb) => tb.value1([x])));
        pl.fn(avg, { color: '--ink', width: 2.6, n: 600 });
        bagMSE = f3(L.met.mse(te.y, te.X.map((x) => avg(x[0]))));
      } else pl.fn((x) => t.value1([x]), { color: '--c1', width: 2.6, n: 800 });
      d.X.forEach((x, i) => pl.dot(x[0], d.y[i], { color: '--k1', r: 3.4 }));
      sim.set('leaves', String(t.leaves().length));
      sim.set('te', f3(L.met.mse(te.y, t.predict(te.X))));
      sim.set('bag', bagMSE);
    });
  });
})();
