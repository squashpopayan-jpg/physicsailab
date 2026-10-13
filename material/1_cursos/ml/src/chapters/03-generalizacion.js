/* Capítulo 3 — Generalización: sobreajuste, sesgo y varianza */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L;
  const f3 = (v) => ML.fix(v, 3);
  const F = (x) => Math.sin(2.2 * x);
  const sample = (n, sd, rng) => { const x = [], y = []; for (let i = 0; i < n; i++) { const v = -1.6 + 3.2 * rng(); x.push(v); y.push(F(v) + sd * rng.gauss()); } return { x, y }; };
  const mse = (m, d) => { let s = 0; for (let i = 0; i < d.x.length; i++) s += (m.predict1(d.x[i]) - d.y[i]) ** 2; return s / d.x.length; };

  /* ======================================================================
     3.1 Grado del polinomio: errores de entrenamiento y prueba
     ====================================================================== */
  ML.defineSim('polinomio-grado', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1.05 }), ce = sim.canvas({ aspect: 1.05 });
    sim.group('Datos');
    sim.slider('n', { label: 'Datos de entrenamiento n', min: 8, max: 150, step: 1, value: 15, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sd', { label: 'Ruido σ', min: 0, max: 0.8, step: 0.01, value: 0.3, fmt: (v) => ML.fix(v, 2) });
    sim.button('Nueva muestra', () => { seed++; make(); }, { id: 'new' });
    sim.group('Modelo');
    sim.slider('deg', { label: 'Grado del polinomio', min: 0, max: 20, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('tr', 'MSE de entrenamiento');
    sim.out('te', 'MSE de prueba', { hl: true });
    sim.out('best', 'Grado con menor error de prueba');
    sim.out('noise', 'Ruido irreducible σ²');
    let seed = 1, tr, te, curve = [];
    const make = () => {
      tr = sample(Math.round(sim.p.n), sim.p.sd, L.rng(10 + seed));
      te = sample(600, sim.p.sd, L.rng(999));
      curve = [];
      for (let d = 0; d <= 20; d++) { const m = L.lin.polyFit(tr.x, tr.y, d); curve.push([d, mse(m, tr), mse(m, te)]); }
    };
    make();
    sim.onChange = (id) => { if (id !== 'deg') make(); };
    sim.onDraw(() => {
      const d = Math.round(sim.p.deg), m = L.lin.polyFit(tr.x, tr.y, d);
      ML.draw.clear(cf);
      const pf = new ML.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -1.7, xmax: 1.7, ymin: -2.2, ymax: 2.2, xlabel: 'x', ylabel: 'y', title: `polinomio de grado ${d}` });
      pf.frame();
      pf.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.5 });
      pf.fn((x) => m.predict1(x), { color: '--c1', width: 2.4, n: 500 });
      tr.x.forEach((x, i) => pf.dot(x, tr.y[i], { color: '--k1', r: 4 }));
      ML.draw.clear(ce);
      const emax = Math.max(0.6, 1.4 * Math.max(...curve.slice(0, 4).map((c) => c[2])));
      const pe = new ML.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: 20, ymin: 0, ymax: emax, xlabel: 'grado', ylabel: 'error cuadrático medio', title: 'error frente a complejidad' });
      pe.frame();
      pe.hline(sim.p.sd ** 2, { color: '--ink-3', label: 'σ² (ruido)' });
      pe.path(curve.map((c) => [c[0], c[1]]), { color: '--c3', width: 2.2 });
      pe.path(curve.map((c) => [c[0], Math.min(c[2], emax * 3)]), { color: '--c2', width: 2.4 });
      pe.vline(d, { color: '--accent', dash: [] });
      pe.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'prueba', color: '--c2' }]);
      const best = curve.reduce((a, c) => (c[2] < a[2] ? c : a));
      sim.set('tr', f3(curve[d][1]));
      sim.set('te', f3(curve[d][2]));
      sim.set('best', `${best[0]} (MSE ${f3(best[2])})`);
      sim.set('noise', f3(sim.p.sd ** 2));
    });
  });

  /* ======================================================================
     3.2 Sesgo y varianza por remuestreo
     ====================================================================== */
  ML.defineSim('sesgo-varianza', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1.05 }), cb = sim.canvas({ aspect: 1.05 });
    sim.group('Experimento');
    sim.slider('deg', { label: 'Grado del polinomio', min: 0, max: 14, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.slider('n', { label: 'Datos por muestra', min: 15, max: 120, step: 1, value: 25, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sd', { label: 'Ruido σ', min: 0.05, max: 0.8, step: 0.01, value: 0.3, fmt: (v) => ML.fix(v, 2) });
    sim.out('b2', 'Sesgo² (promedio en x)');
    sim.out('var', 'Varianza (promedio en x)');
    sim.out('tot', 'Sesgo² + varianza + σ²', { hl: true });
    const R = 40, GX = Array.from(L.util.linspace(-1.5, 1.5, 61));
    let tab = [], fits = [];
    const compute = () => {
      const samples = Array.from({ length: R }, (_, r) => sample(Math.round(sim.p.n), sim.p.sd, L.rng(500 + r)));
      tab = [];
      for (let d = 0; d <= 14; d++) {
        const preds = samples.map((s) => { const m = L.lin.polyFit(s.x, s.y, d); return GX.map((x) => m.predict1(x)); });
        let b2 = 0, v = 0;
        GX.forEach((x, k) => { const col = preds.map((p) => p[k]); const mu = L.stat.mean(col); b2 += (mu - F(x)) ** 2; v += L.stat.variance(col, 0); });
        tab.push({ d, b2: b2 / GX.length, v: v / GX.length, preds });
      }
    };
    compute();
    sim.onChange = (id) => { if (id !== 'deg') compute(); };
    sim.onDraw(() => {
      const d = Math.round(sim.p.deg), t = tab[d];
      ML.draw.clear(cf);
      const pf = new ML.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -1.6, xmax: 1.6, ymin: -2.2, ymax: 2.2, xlabel: 'x', ylabel: 'ŷ', title: `${R} ajustes de grado ${d}` });
      pf.frame();
      t.preds.forEach((p) => pf.xy(GX, p.map((v) => ML.M.clamp(v, -5, 5)), { color: '--c1', width: 1, alpha: 0.28 }));
      const avg = GX.map((_, k) => L.stat.mean(t.preds.map((p) => p[k])));
      pf.fn(F, { color: '--ink', dash: [5, 4], width: 1.8 });
      pf.xy(GX, avg, { color: '--c2', width: 3 });
      pf.legend([{ label: 'ajustes individuales', color: '--c1' }, { label: 'promedio de los ajustes', color: '--c2' }, { label: 'función verdadera', color: '--ink', dash: [5, 4] }], 'bl');
      ML.draw.clear(cb);
      const s2 = sim.p.sd ** 2;
      const tot = tab.map((r) => r.b2 + r.v + s2);
      const ymax = Math.min(Math.max(...tot.slice(0, 8)) * 1.25, 3);
      const pb = new ML.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0, xmax: 14, ymin: 0, ymax, xlabel: 'grado', ylabel: 'error esperado', title: 'descomposición del error' });
      pb.frame();
      pb.hline(s2, { color: '--ink-3', label: 'σ²' });
      pb.path(tab.map((r) => [r.d, r.b2]), { color: '--c4', width: 2.2 });
      pb.path(tab.map((r) => [r.d, Math.min(r.v, 10)]), { color: '--c5', width: 2.2 });
      pb.path(tab.map((r, i) => [r.d, Math.min(tot[i], 10)]), { color: '--ink', width: 2.6 });
      pb.vline(d, { color: '--accent', dash: [] });
      pb.legend([{ label: 'sesgo²', color: '--c4' }, { label: 'varianza', color: '--c5' }, { label: 'total', color: '--ink' }]);
      sim.set('b2', f3(t.b2));
      sim.set('var', f3(t.v));
      sim.set('tot', f3(t.b2 + t.v + s2));
    });
  });

  /* ======================================================================
     3.3 Curvas de aprendizaje
     ====================================================================== */
  ML.defineSim('curvas-aprendizaje', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Modelo');
    sim.seg('deg', { label: 'Polinomio', options: [[1, 'Grado 1 (rígido)'], [5, 'Grado 5'], [12, 'Grado 12 (flexible)']], value: 1 });
    sim.slider('sd', { label: 'Ruido σ', min: 0.1, max: 0.6, step: 0.01, value: 0.3, fmt: (v) => ML.fix(v, 2) });
    sim.out('last', 'Con n = 300: entrenamiento / validación', { hl: true });
    sim.out('gap', 'Brecha con n = 300');
    const NS = [15, 20, 30, 45, 70, 100, 150, 220, 300], R = 30;
    let rows = [];
    const compute = () => {
      const val = sample(800, sim.p.sd, L.rng(4242));
      rows = NS.map((n) => {
        let a = 0, b = 0;
        for (let r = 0; r < R; r++) { const s = sample(n, sim.p.sd, L.rng(70000 + 31 * r + n)); const m = L.lin.polyFit(s.x, s.y, sim.p.deg); a += mse(m, s) / R; b += Math.min(mse(m, val), 20) / R; }
        return [n, a, b];
      });
    };
    compute();
    sim.onChange = () => compute();
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 12, xmax: 320, xlog: true, ymin: 0, ymax: 0.7, xlabel: 'número de datos de entrenamiento n', ylabel: 'error cuadrático medio' });
      pl.frame();
      pl.hline(sim.p.sd ** 2, { color: '--ink-3', label: 'ruido σ²', labelRight: true });
      pl.path(rows.map((r) => [r[0], r[1]]), { color: '--c3', width: 2.4 });
      pl.path(rows.map((r) => [r[0], r[2]]), { color: '--c2', width: 2.4 });
      rows.forEach((r) => { pl.dot(r[0], r[1], { color: '--c3', r: 3 }); pl.dot(r[0], Math.min(r[2], 0.7), { color: '--c2', r: 3 }); });
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'validación', color: '--c2' }]);
      const z = rows[rows.length - 1];
      sim.set('last', `${f3(z[1])} / ${f3(z[2])}`);
      sim.set('gap', f3(z[2] - z[1]));
    });
  });

  /* ======================================================================
     3.4 Doble descenso con rasgos ReLU aleatorios
     ====================================================================== */
  ML.defineSim('doble-descenso', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 1.1 }), cf = sim.canvas({ aspect: 1.1 });
    sim.group('Modelo de rasgos aleatorios');
    sim.slider('p', { label: 'Número de rasgos p', min: 1, max: 400, step: 1, value: 20, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.slider('lam', { label: 'Regularización λ', min: 1e-8, max: 1, step: 1e-8, value: 1e-8, log: true, fmt: (v) => ML.sci(v, 1) });
    sim.note('n = 20 datos de entrenamiento, ruido σ = 0.2. Cada punto de la curva promedia 12 sorteos de los rasgos.');
    sim.out('te', 'MSE de prueba con este p', { hl: true });
    sim.out('tr', 'MSE de entrenamiento');
    sim.out('peak', 'Pico de la curva');
    const n = 20, PS = [1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 25, 30, 40, 60, 90, 140, 220, 400];
    const train = sample(n, 0.2, L.rng(8)), test = sample(400, 0.2, L.rng(9));
    const feats = (p, rng) => Array.from({ length: p }, () => { const a = rng.gauss() * 2.2, c = rng.uniform(-1.8, 1.8); return (x) => Math.max(0, a * (x - c)); });
    const fit = (p, lam, r) => {
      const fs = feats(p, L.rng(100 * r + p));
      const Phi = train.x.map((x) => fs.map((f) => f(x)).concat([1]));
      const w = L.lin.minNorm(Phi, train.y, lam);
      return (x) => { let s = w[p]; for (let j = 0; j < p; j++) s += w[j] * fs[j](x); return s; };
    };
    let curve = [];
    const compute = () => { curve = PS.map((p) => { let e = 0; for (let r = 0; r < 12; r++) { const f = fit(p, sim.p.lam, r); let s = 0; test.x.forEach((x, i) => { s += Math.min((f(x) - test.y[i]) ** 2, 50); }); e += s / test.x.length / 12; } return [p, e]; }); };
    compute();
    sim.onChange = (id) => { if (id === 'lam') compute(); };
    sim.onDraw(() => {
      ML.draw.clear(ce);
      const pe = new ML.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 1, xmax: 400, xlog: true, ymin: 0.01, ymax: 20, ylog: true, xlabel: 'número de rasgos p (log)', ylabel: 'MSE de prueba (log)', title: 'doble descenso' });
      pe.frame();
      pe.vline(n, { color: '--ink-3', label: 'p = n' });
      pe.path(curve, { color: '--c2', width: 2.4 });
      curve.forEach((c) => pe.dot(c[0], c[1], { color: '--c2', r: 2.8 }));
      const p = Math.round(sim.p.p), f = fit(p, sim.p.lam, 0);
      let ete = 0, etr = 0;
      test.x.forEach((x, i) => { ete += (f(x) - test.y[i]) ** 2 / test.x.length; });
      train.x.forEach((x, i) => { etr += (f(x) - train.y[i]) ** 2 / n; });
      pe.vline(p, { color: '--accent', dash: [] });
      ML.draw.clear(cf);
      const pf = new ML.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -1.7, xmax: 1.7, ymin: -2.5, ymax: 2.5, xlabel: 'x', ylabel: 'y', title: `ajuste con p = ${p}` });
      pf.frame();
      pf.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.5 });
      pf.fn(f, { color: '--c1', width: 2.2, n: 600 });
      train.x.forEach((x, i) => pf.dot(x, train.y[i], { color: '--k1', r: 4 }));
      const pk = curve.reduce((a, c) => (c[1] > a[1] ? c : a));
      sim.set('te', f3(ete));
      sim.set('tr', ML.sci(etr, 2));
      sim.set('peak', `p = ${pk[0]} (MSE ${f3(pk[1])})`);
    });
  });
})();
