/* Capítulo 5 — Preparar los datos */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const pct = (v) => ML.fix(100 * v, 1) + ' %', f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     5.1 Escalado y k vecinos
     ====================================================================== */
  ML.defineSim('escalado-knn', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.group('Preprocesamiento');
    sim.seg('sc', { label: 'Escalado', options: [['none', 'Ninguno'], ['std', 'Estándar'], ['mm', 'Min–max'], ['rob', 'Robusto']], value: 'none' });
    sim.slider('k', { label: 'Vecinos k', min: 1, max: 25, step: 2, value: 7, fmt: (v) => ML.fix(v, 0) });
    sim.check('out', { label: 'Agregar un cliente con ingreso extremo', value: false });
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.out('sp', 'Rango de ingreso tras escalar');
    /* clase: compra si edad joven e ingreso alto, en una combinación diagonal */
    const gen = (n, seed) => {
      const r = L.rng(seed), X = [], y = [];
      for (let i = 0; i < n; i++) {
        const age = 20 + 50 * r(), inc = 800 + 5200 * r();
        const s = -(age - 45) / 12 + (inc - 3400) / 1300 + 0.7 * r.gauss();
        X.push([age, inc]); y.push(s > 0 ? 1 : 0);
      }
      return { X, y };
    };
    const tr0 = gen(160, 3), te = gen(600, 4);
    sim.onDraw(() => {
      const tr = { X: tr0.X.slice(), y: tr0.y.slice() };
      if (sim.p.out) { tr.X.push([40, 60000]); tr.y.push(1); }
      let S = { transform: (Z) => Z.map((r) => r.slice()) };
      if (sim.p.sc === 'std') S = L.data.standardizer(tr.X);
      else if (sim.p.sc === 'mm') S = L.data.minmax(tr.X);
      else if (sim.p.sc === 'rob') S = L.data.robust(tr.X);
      const Xs = S.transform(tr.X), m = L.knn.classifier(Xs, tr.y, Math.round(sim.p.k));
      const pred = (X) => m.predict(S.transform(X));
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 18, xmax: 72, ymin: 500, ymax: 6400, xlabel: 'edad (años)', ylabel: 'ingreso (miles de pesos)' });
      ML.probMap(pl, (a, b) => m.proba(S.transform([[a, b]])[0])[1], { res: 5, alpha: 0.5 });
      pl.frame();
      ML.points(pl, te.X.slice(0, 200), te.y.slice(0, 200), { r: 2.6, hollow: U.range(200), alpha: 0.7 });
      ML.points(pl, tr0.X, tr0.y, { r: 4 });
      if (sim.p.out) ML.text(cv.ctx, '↑ cliente con ingreso 60 000 (fuera del gráfico)', pl.X(40), pl.iy + 14, { size: 11, color: '--ink', halo: true });
      sim.set('tr', pct(L.met.accuracy(tr0.y, pred(tr0.X))));
      sim.set('te', pct(L.met.accuracy(te.y, pred(te.X))));
      const col = Xs.slice(0, 160).map((r) => r[1]);
      sim.set('sp', sim.p.sc === 'none' ? '800 a 6 000 (sin escalar)' : `${f3(Math.min(...col))} a ${f3(Math.max(...col))}`);
    });
  });

  /* ======================================================================
     5.2 Imputación de faltantes
     ====================================================================== */
  ML.defineSim('imputacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.group('Faltantes en x₂');
    sim.seg('mech', { label: 'Mecanismo', options: [['mcar', 'Al azar (MCAR)'], ['mar', 'Dependen de x₁ (MAR)']], value: 'mar' });
    sim.slider('frac', { label: 'Fracción faltante', min: 0.05, max: 0.6, step: 0.01, value: 0.35, fmt: pct });
    sim.select('meth', { label: 'Método', options: [['drop', 'Eliminar filas'], ['mean', 'Media'], ['median', 'Mediana'], ['reg', 'Regresión sobre x₁'], ['knn', 'k vecinos (k = 5)']], value: 'mean' });
    sim.out('mu', 'Media de x₂: estimada / verdadera', { hl: true });
    sim.out('sd', 'Desviación de x₂: estimada / verdadera');
    sim.out('r', 'Correlación x₁–x₂: estimada / verdadera');
    const n = 260, r0 = L.rng(17);
    const x1 = [], x2 = [];
    for (let i = 0; i < n; i++) { const a = r0.gauss(); x1.push(a); x2.push(0.75 * a + 0.66 * r0.gauss()); }
    const u = U.range(n).map(() => r0());
    sim.onDraw(() => {
      const f = sim.p.frac;
      const miss = U.range(n).map((i) => (sim.p.mech === 'mcar' ? u[i] < f : u[i] < f * 2 * L.stat.normCDF(1.3 * x1[i]) / (2 * 0.5)));
      const obs = U.range(n).filter((i) => !miss[i]);
      let X = [], imp = [];
      const mo = L.stat.mean(obs.map((i) => x2[i])), me = L.stat.median(obs.map((i) => x2[i]));
      const reg = L.lin.ols(obs.map((i) => [x1[i]]), obs.map((i) => x2[i]), { stats: false });
      for (let i = 0; i < n; i++) {
        if (!miss[i]) { X.push([x1[i], x2[i]]); continue; }
        let v;
        if (sim.p.meth === 'drop') continue;
        if (sim.p.meth === 'mean') v = mo;
        else if (sim.p.meth === 'median') v = me;
        else if (sim.p.meth === 'reg') v = reg.intercept + reg.coef[0] * x1[i];
        else { const nb = obs.map((j) => [Math.abs(x1[j] - x1[i]), j]).sort((a, b) => a[0] - b[0]).slice(0, 5); v = L.stat.mean(nb.map(([, j]) => x2[j])); }
        X.push([x1[i], v]); imp.push(X.length - 1);
      }
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -3, xmax: 3, ymin: -3, ymax: 3, xlabel: 'x₁ (siempre observada)', ylabel: 'x₂' });
      pl.frame();
      pl.clip((ctx) => { ctx.fillStyle = ML.alpha('--ink-3', 0.25); U.range(n).filter((i) => miss[i]).forEach((i) => { ctx.beginPath(); ctx.arc(pl.X(x1[i]), pl.Y(x2[i]), 2.2, 0, 7); ctx.fill(); }); });
      const lab = X.map((_, i) => (imp.includes(i) ? 1 : 0));
      ML.points(pl, X, lab, { r: 3.6, hollow: imp });
      pl.legend([{ label: 'observado', color: '--k0', kind: 'dot' }, { label: 'imputado', color: '--k1', kind: 'dot' }, { label: 'valor real que faltaba', color: '--ink-3', kind: 'dot' }], 'tl');
      const c2 = X.map((r) => r[1]), c1 = X.map((r) => r[0]);
      sim.set('mu', `${f3(L.stat.mean(c2))} / ${f3(L.stat.mean(x2))}`);
      sim.set('sd', `${f3(L.stat.std(c2))} / ${f3(L.stat.std(x2))}`);
      sim.set('r', `${f3(L.stat.corr(c1, c2))} / ${f3(L.stat.corr(x1, x2))}`);
    });
  });

  /* ======================================================================
     5.3 Ingeniería de características para una logística
     ====================================================================== */
  ML.defineSim('ingenieria-rasgos', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.group('Datos');
    sim.seg('kind', { options: [['circles', 'Círculos'], ['xor', 'XOR'], ['moons', 'Lunas']], value: 'circles' });
    sim.group('Características que recibe la logística');
    const FEATS = [['x1', 'x₁', (a) => a], ['x2', 'x₂', (a, b) => b], ['x1s', 'x₁²', (a) => a * a], ['x2s', 'x₂²', (a, b) => b * b], ['x12', 'x₁·x₂', (a, b) => a * b], ['r2', 'r² = x₁² + x₂²', (a, b) => a * a + b * b], ['x13', 'x₁³', (a) => a * a * a]];
    FEATS.forEach(([id, lab], i) => sim.check(id, { label: lab, value: i < 2 }));
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.out('coef', 'Coeficientes', { wide: true });
    sim.onDraw(() => {
      const tr = L.data.make2d(sim.p.kind, 200, 0.3, L.rng(5)), te = L.data.make2d(sim.p.kind, 600, 0.3, L.rng(6));
      const act = FEATS.filter(([id]) => sim.p[id]);
      const phi = (x) => act.map((f) => f[2](x[0], x[1]));
      ML.draw.clear(cv);
      const view = ML.view2(cv, 2.2);
      if (!act.length) { sim.set('coef', 'elija al menos una característica'); return; }
      const m = L.lin.logistic(tr.X.map(phi), tr.y, { C: 10 });
      const p1 = (a, b) => m.proba([phi([a, b])])[0];
      ML.probMap(view, p1, { res: 5, alpha: 0.55 });
      ML.contour(view, (a, b) => p1(a, b) - 0.5, 0, { res: 4, width: 2.2 });
      ML.points(view, tr.X, tr.y, { r: 3.8 });
      sim.set('tr', pct(L.met.accuracy(tr.y, m.predict(tr.X.map(phi)))));
      sim.set('te', pct(L.met.accuracy(te.y, m.predict(te.X.map(phi)))));
      sim.set('coef', `<table class="sim-tab"><tr><th>término</th><th>coeficiente</th></tr><tr><td>intercepto</td><td>${f3(m.intercept)}</td></tr>` + act.map((f, j) => `<tr><td>${f[1]}</td><td>${f3(m.coef[j])}</td></tr>`).join('') + '</table>');
    });
  });
})();
