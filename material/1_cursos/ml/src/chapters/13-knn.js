/* Capítulo 13 — k vecinos más cercanos */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     13.1 Mapa de k-NN
     ====================================================================== */
  ML.defineSim('knn-mapa', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    ML.dataControls(sim, { kind: 'moons', n: 200, noise: 0.45, nmax: 400 });
    sim.group('Modelo');
    sim.slider('k', { label: 'Vecinos k', min: 1, max: 101, step: 2, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.seg('w', { label: 'Votos', options: [['uniform', 'Iguales'], ['distance', 'Por distancia']], value: 'uniform' });
    sim.seg('metric', { label: 'Distancia', options: [['euclid', 'Euclidiana'], ['manhattan', 'Manhattan']], value: 'euclid' });
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.out('q', 'Consulta: votos por clase');
    let q = null, view = null;
    ML.pointer(cv, { down: (px, py) => { if (!view) return null; q = [view.wx(px), view.wy(py)]; sim.redraw(); return 1; }, move: (k, px, py) => { q = [view.wx(px), view.wy(py)]; sim.redraw(); }, hover: () => 'crosshair' });
    sim.onDraw(() => {
      const d = ML.makeData(sim), te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(5000 + sim.p.seed));
      const k = Math.min(Math.round(sim.p.k), d.X.length);
      const m = L.knn.classifier(d.X, d.y, k, { weights: sim.p.w, metric: sim.p.metric });
      view = ML.view2(cv, 2.3);
      ML.draw.clear(cv);
      ML.probMap(view, (a, b) => m.proba([a, b]), { res: 5, alpha: 0.55 });
      ML.labelEdges(view, (a, b) => m.predict1([a, b]), { res: 5, width: 1.6 });
      ML.points(view, d.X, d.y, { r: 3.6 });
      if (q) {
        const nb = L.knn.neighbors(d.X, q, k, sim.p.metric), ctx = cv.ctx;
        ctx.save(); ctx.strokeStyle = ML.alpha('--ink', 0.55); ctx.lineWidth = 1;
        nb.forEach(([, i]) => { ctx.beginPath(); ctx.moveTo(view.X(q[0]), view.Y(q[1])); ctx.lineTo(view.X(d.X[i][0]), view.Y(d.X[i][1])); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(view.X(q[0]), view.Y(q[1]), view.s * nb[nb.length - 1][0], 0, 7); ctx.setLineDash([4, 4]); ctx.stroke(); ctx.restore();
        ML.cross(view, q[0], q[1], { color: '--accent' });
        const v = [0, 0]; nb.forEach(([, i]) => v[d.y[i]]++);
        sim.set('q', `clase 0: ${v[0]} · clase 1: ${v[1]} → P(1) = ${f2(m.proba(q)[1])}`);
      } else sim.set('q', 'haga clic en el mapa');
      sim.set('tr', pct(L.met.accuracy(d.y, m.predict(d.X))));
      sim.set('te', pct(L.met.accuracy(te.y, m.predict(te.X))));
    });
  });

  /* ======================================================================
     13.2 Concentración de las distancias
     ====================================================================== */
  ML.defineSim('maldicion-dimension', function (sim) {
    sim.cols2();
    const ch = sim.canvas({ aspect: 1.1 }), cr = sim.canvas({ aspect: 1.1 });
    sim.group('Experimento');
    sim.slider('d', { label: 'Dimensión d', min: 1, max: 500, step: 1, value: 2, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.out('ratio', 'Distancia mínima / máxima', { hl: true });
    sim.out('cv', 'Coeficiente de variación de las distancias');
    sim.out('side', 'Lado del cubo con el 1 % de los datos');
    const DS = [1, 2, 3, 5, 8, 12, 20, 35, 60, 100, 200, 350, 500];
    const dists = (d, seed) => { const r = L.rng(seed), q = Array.from({ length: d }, () => r()); return Array.from({ length: 1000 }, () => { let s = 0; for (let j = 0; j < d; j++) { const v = r() - q[j]; s += v * v; } return Math.sqrt(s); }); };
    const curve = DS.map((d) => { const a = dists(d, 7 + d); return [d, Math.min(...a) / Math.max(...a)]; });
    sim.onDraw(() => {
      const d = Math.round(sim.p.d), a = dists(d, 7 + d), mx = Math.max(...a), rel = a.map((v) => v / mx);
      ML.draw.clear(ch);
      const h = L.stat.hist(rel, 0, 1, 40);
      const ph = new ML.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(...h.dens) * 1.1, xlabel: 'distancia / distancia máxima', ylabel: 'densidad', title: `d = ${d}: distancias a 1 000 puntos` });
      ph.frame();
      ML.drawHist(ph, h, { color: '--c1', alpha: 0.55 });
      ML.draw.clear(cr);
      const pr = new ML.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 1, xmax: 500, xlog: true, ymin: 0, ymax: 1, xlabel: 'dimensión d (log)', ylabel: 'mínima / máxima', title: 'el vecino más cercano deja de ser cercano' });
      pr.frame();
      pr.path(curve, { color: '--c2', width: 2.4 });
      curve.forEach((c) => pr.dot(c[0], c[1], { color: '--c2', r: 3 }));
      pr.vline(d, { color: '--accent', dash: [] });
      sim.set('ratio', f3(Math.min(...a) / mx));
      sim.set('cv', f3(L.stat.std(a) / L.stat.mean(a)));
      sim.set('side', f3(Math.pow(0.01, 1 / d)));
    });
  });

  /* ======================================================================
     13.3 Regresión k-NN
     ====================================================================== */
  ML.defineSim('knn-regresion', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Modelo');
    sim.slider('k', { label: 'Vecinos k', min: 1, max: 60, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.seg('w', { label: 'Promedio', options: [['uniform', 'Simple'], ['distance', 'Ponderado']], value: 'uniform' });
    sim.button('Nueva muestra', () => { seed++; }, { id: 'new' });
    sim.out('tr', 'MSE de entrenamiento');
    sim.out('te', 'MSE de prueba', { hl: true });
    let seed = 1;
    sim.onDraw(() => {
      const F = (x) => Math.sin(2.2 * x), r = L.rng(90 + seed);
      const X = [], Y = [];
      for (let i = 0; i < 80; i++) { const x = -1.6 + 3.2 * r(); X.push([x]); Y.push(F(x) + 0.3 * r.gauss()); }
      const te = L.data.reg1d(500, F, 0.3, L.rng(3));
      const m = L.knn.regressor(X, Y, Math.round(sim.p.k), { weights: sim.p.w });
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -2.2, xmax: 2.2, ymin: -2, ymax: 2, xlabel: 'x', ylabel: 'y' });
      pl.frame();
      pl.band(-2.2, -1.6, { color: '--ink-3', alpha: 0.08 }); pl.band(1.6, 2.2, { color: '--ink-3', alpha: 0.08 });
      pl.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pl.fn((x) => m.predict1([x]), { color: '--c1', width: 2.4, n: 700 });
      X.forEach((x, i) => pl.dot(x[0], Y[i], { color: '--k1', r: 3.6 }));
      pl.label(1.65, 1.8, 'fuera del rango: no extrapola', { size: 11 });
      sim.set('tr', f3(L.met.mse(Y, m.predict(X))));
      sim.set('te', f3(L.met.mse(te.y, m.predict(te.X))));
    });
  });
})();
