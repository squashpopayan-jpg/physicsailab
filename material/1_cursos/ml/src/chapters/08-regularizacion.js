/* Capítulo 8 — Regularización: Ridge, Lasso y Elastic Net */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     8.1 Geometría de L1 y L2
     ====================================================================== */
  ML.defineSim('geometria-l1-l2', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.group('Penalización');
    sim.seg('norm', { options: [['l1', 'L1 (Lasso)'], ['l2', 'L2 (Ridge)']], value: 'l1' });
    sim.slider('t', { label: 'Presupuesto t (‖β‖ ≤ t)', min: 0.1, max: 3.5, step: 0.01, value: 1.2, fmt: f2 });
    sim.group('Error cuadrático');
    sim.slider('b1', { label: 'Solución MCO β̂₁', min: 0.3, max: 3, step: 0.01, value: 2.2, fmt: f2 });
    sim.slider('b2', { label: 'Solución MCO β̂₂', min: -0.5, max: 2.5, step: 0.01, value: 0.9, fmt: f2 });
    sim.slider('rho', { label: 'Correlación entre las variables', min: -0.9, max: 0.9, step: 0.01, value: 0.4, fmt: f2 });
    sim.out('sol', 'Solución penalizada (β₁, β₂)', { hl: true });
    sim.out('zero', '¿Algún coeficiente exactamente cero?');
    sim.onDraw(() => {
      const H = [[1, sim.p.rho], [sim.p.rho, 1]], c = [sim.p.b1, sim.p.b2], t = sim.p.t;
      const Q = (b) => { const d0 = b[0] - c[0], d1 = b[1] - c[1]; return H[0][0] * d0 * d0 + 2 * H[0][1] * d0 * d1 + H[1][1] * d1 * d1; };
      let sol;
      const inside = sim.p.norm === 'l1' ? Math.abs(c[0]) + Math.abs(c[1]) <= t : Math.hypot(c[0], c[1]) <= t;
      if (inside) sol = c.slice();
      else {
        let best = null;
        const N = 4000;
        for (let k = 0; k < N; k++) {
          const a = (2 * Math.PI * k) / N;
          let b;
          if (sim.p.norm === 'l2') b = [t * Math.cos(a), t * Math.sin(a)];
          else { const ca = Math.cos(a), sa = Math.sin(a), s = t / (Math.abs(ca) + Math.abs(sa)); b = [s * ca, s * sa]; }
          const q = Q(b);
          if (!best || q < best.q) best = { q, b };
        }
        sol = best.b;
        if (sim.p.norm === 'l1') sol = sol.map((v) => (Math.abs(v) < 2e-3 * t ? 0 : v));
      }
      const view = new ML.View2D(cv, { xmin: -1.5, xmax: 3.5, ymin: -1.8, ymax: 3 });
      ML.draw.clear(cv);
      view.grid({ labels: true, xlabel: 'β₁', ylabel: 'β₂' });
      const ctx = cv.ctx;
      ctx.save();
      ctx.beginPath();
      if (sim.p.norm === 'l1') { ctx.moveTo(view.X(t), view.Y(0)); ctx.lineTo(view.X(0), view.Y(t)); ctx.lineTo(view.X(-t), view.Y(0)); ctx.lineTo(view.X(0), view.Y(-t)); ctx.closePath(); }
      else ctx.arc(view.X(0), view.Y(0), t * view.s, 0, 7);
      ctx.fillStyle = ML.alpha('--accent', 0.18); ctx.fill(); ctx.strokeStyle = ML.col('--accent'); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      const qs = Q(sol);
      const lv = [0.05, 0.2, 0.45, 0.8, 1.3, 2, 3].map((v) => v * Math.max(qs, 0.3));
      ML.contour(view, (x, y) => Q([x, y]), lv, { color: '--c1', width: 1.1, alpha: 0.6 });
      if (!inside) ML.contour(view, (x, y) => Q([x, y]), qs, { color: '--c2', width: 2.2 });
      ML.cross(view, c[0], c[1], { color: '--c1' });
      ML.text(ctx, 'β̂ MCO', view.X(c[0]) + 9, view.Y(c[1]) - 8, { size: 12, color: '--c1', halo: true });
      ctx.beginPath(); ctx.arc(view.X(sol[0]), view.Y(sol[1]), 6, 0, 7); ctx.fillStyle = ML.col('--c2'); ctx.fill(); ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 2; ctx.stroke();
      ML.text(ctx, 'solución', view.X(sol[0]) + 9, view.Y(sol[1]) + 16, { size: 12, color: '--c2', halo: true, weight: 600 });
      sim.set('sol', `(${f3(sol[0])}, ${f3(sol[1])})`);
      sim.set('zero', inside ? 'no: el presupuesto no restringe (solución = MCO)' : sol.some((v) => v === 0) ? `sí: β${sol[0] === 0 ? '₁' : '₂'} = 0 (la elipse toca una esquina)` : 'no');
    });
  });

  /* ======================================================================
     8.2 Camino de coeficientes y validación cruzada
     ====================================================================== */
  ML.defineSim('camino-coeficientes', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.group('Modelo');
    sim.seg('kind', { options: [[1, 'Lasso'], [0.5, 'Elastic Net'], [0, 'Ridge']], value: 1 });
    sim.slider('la', { label: 'log₁₀ α (posición actual)', min: -3, max: 1, step: 0.01, value: -0.8, fmt: f2 });
    sim.out('cur', 'Coeficientes con el α actual', { wide: true });
    sim.out('best', 'α con menor error de validación', { hl: true });
    sim.out('ose', 'α por la regla de una desviación');
    const p = 8, n = 80, rng = L.rng(12);
    const TRUE = [3, -2, 1.5, 0, 0, 0, 0, 0];
    const X = [], y = [];
    for (let i = 0; i < n; i++) { const z = Array.from({ length: p }, () => rng.gauss()); z[3] = 0.95 * z[0] + 0.31 * z[3]; X.push(z); y.push(L.la.dot(z, TRUE) + 2 * rng.gauss()); }
    const S = L.data.standardizer(X), Xs = S.transform(X);
    const GR = Array.from(L.util.linspace(1, -3, 50));
    let paths = {}, cvc = {};
    const compute = (k) => {
      if (paths[k]) return;
      const al = GR.map((g) => Math.pow(10, g));
      paths[k] = L.lin.path(Xs, y, al, k, { tol: 1e-8 }).map((m) => m.coef);
      const folds = L.data.kfold(n, 5, L.rng(3));
      const errs = folds.map((f) => { const ms = L.lin.path(f.train.map((i) => Xs[i]), f.train.map((i) => y[i]), al, k, { tol: 1e-7 }); return ms.map((m) => L.met.mse(f.test.map((i) => y[i]), m.predict(f.test.map((i) => Xs[i])))); });
      cvc[k] = GR.map((_, j) => { const e = errs.map((r) => r[j]); return { m: L.stat.mean(e), se: L.stat.std(e) / Math.sqrt(e.length) }; });
    };
    sim.onDraw(() => {
      const k = sim.p.kind;
      compute(k);
      const P = paths[k], E = cvc[k];
      ML.draw.clear(cv);
      const h1 = cv.h * 0.62;
      const all = P.flat();
      const pa = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: -3, xmax: 1, ymin: Math.min(-2.6, ...all) - 0.2, ymax: Math.max(3.2, ...all) + 0.2, xlabel: '', ylabel: 'coeficiente', title: 'camino de los coeficientes (variables estandarizadas)', mb: 22 });
      pa.frame();
      pa.hline(0, { color: '--ink-3', dash: [] });
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c6', '--c6', '--c6', '--c6'];
      for (let j = 0; j < p; j++) pa.xy(GR, P.map((c) => c[j]), { color: cols[j], width: j < 4 ? 2.4 : 1.2, alpha: j < 4 ? 1 : 0.7 });
      pa.vline(sim.p.la, { color: '--accent', dash: [] });
      pa.legend([{ label: 'x₁ (β = 3)', color: '--c1' }, { label: 'x₂ (β = −2)', color: '--c2' }, { label: 'x₃ (β = 1.5)', color: '--c3' }, { label: 'x₄ ≈ x₁ (β = 0)', color: '--c4' }, { label: 'x₅…x₈ ruido', color: '--c6' }], 'tr');
      const ms = E.map((e) => e.m), emin = Math.min(...ms), jb = ms.indexOf(emin);
      let j1 = jb;
      for (let j = 0; j < GR.length; j++) if (ms[j] <= emin + E[jb].se && GR[j] > GR[j1]) j1 = j;
      const pb = new ML.Plot(cv.ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: -3, xmax: 1, ymin: Math.max(0, emin * 0.85), ymax: Math.min(Math.max(...ms) * 1.05, emin * 4), xlabel: 'log₁₀ α (más regularización →)', ylabel: 'MSE de val.' });
      pb.frame();
      pb.clip((ctx) => { ctx.fillStyle = ML.alpha('--c5', 0.15); ctx.beginPath(); GR.forEach((g, j) => (j ? ctx.lineTo(pb.X(g), pb.Y(E[j].m + E[j].se)) : ctx.moveTo(pb.X(g), pb.Y(E[j].m + E[j].se)))); for (let j = GR.length - 1; j >= 0; j--) ctx.lineTo(pb.X(GR[j]), pb.Y(E[j].m - E[j].se)); ctx.fill(); });
      pb.xy(GR, ms, { color: '--c5', width: 2.2 });
      pb.vline(GR[jb], { color: '--c5', dash: [] });
      pb.vline(GR[j1], { color: '--c5', dash: [4, 4] });
      pb.vline(sim.p.la, { color: '--accent', dash: [] });
      const mcur = sim.p.kind === 0 ? L.lin.ridge(Xs, y, Math.pow(10, sim.p.la) * n) : L.lin.enet(Xs, y, Math.pow(10, sim.p.la), sim.p.kind);
      sim.set('cur', mcur.coef.map((v, j) => `x${j + 1} ${Math.abs(v) < 1e-10 ? '<b>0</b>' : f2(v)}`).join(' · '));
      sim.set('best', `${ML.sci(Math.pow(10, GR[jb]), 2)} (MSE ${f2(emin)})`);
      sim.set('ose', ML.sci(Math.pow(10, GR[j1]), 2));
    });
  });

  /* ======================================================================
     8.3 Ridge y un polinomio de grado 15
     ====================================================================== */
  ML.defineSim('ridge-polinomio', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1.1 }), ce = sim.canvas({ aspect: 1.1 });
    sim.group('Modelo');
    sim.slider('la', { label: 'log₁₀ α', min: -10, max: 2, step: 0.05, value: -10, fmt: f2 });
    sim.slider('deg', { label: 'Grado', min: 3, max: 18, step: 1, value: 15, fmt: (v) => ML.fix(v, 0) });
    sim.out('tr', 'MSE de entrenamiento');
    sim.out('te', 'MSE de prueba', { hl: true });
    sim.out('w', 'Norma de los coeficientes ‖w‖');
    const F = (x) => Math.sin(2.2 * x), r0 = L.rng(31);
    const tr = { x: [], y: [] }, te = { x: [], y: [] };
    for (let i = 0; i < 20; i++) { const v = -1.6 + 3.2 * r0(); tr.x.push(v); tr.y.push(F(v) + 0.3 * r0.gauss()); }
    for (let i = 0; i < 600; i++) { const v = -1.6 + 3.2 * r0(); te.x.push(v); te.y.push(F(v) + 0.3 * r0.gauss()); }
    const mse = (m, d) => L.stat.mean(d.x.map((x, i) => (m.predict1(x) - d.y[i]) ** 2));
    let curve = [], cdeg = -1;
    sim.onDraw(() => {
      const d = Math.round(sim.p.deg);
      if (cdeg !== d) { cdeg = d; curve = []; for (let g = -10; g <= 2; g += 0.25) { const m = L.lin.polyFit(tr.x, tr.y, d, { alpha: Math.pow(10, g) }); curve.push([g, mse(m, tr), Math.min(mse(m, te), 50)]); } }
      const m = L.lin.polyFit(tr.x, tr.y, d, { alpha: Math.pow(10, sim.p.la) });
      ML.draw.clear(cf);
      const pf = new ML.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -1.7, xmax: 1.7, ymin: -2.2, ymax: 2.2, xlabel: 'x', ylabel: 'y', title: `grado ${d}, α = ${ML.sci(Math.pow(10, sim.p.la), 1)}` });
      pf.frame();
      pf.fn(F, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pf.fn((x) => m.predict1(x), { color: '--c1', width: 2.4, n: 600 });
      tr.x.forEach((x, i) => pf.dot(x, tr.y[i], { color: '--k1', r: 4 }));
      ML.draw.clear(ce);
      const pe = new ML.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: -10, xmax: 2, ymin: 0.005, ymax: 50, ylog: true, xlabel: 'log₁₀ α', ylabel: 'MSE (log)', title: 'entrenamiento y prueba frente a α' });
      pe.frame();
      pe.hline(0.09, { color: '--ink-3', label: 'σ²' });
      pe.path(curve.map((c) => [c[0], c[1]]), { color: '--c3', width: 2.2 });
      pe.path(curve.map((c) => [c[0], c[2]]), { color: '--c2', width: 2.4 });
      pe.vline(sim.p.la, { color: '--accent', dash: [] });
      pe.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'prueba', color: '--c2' }], 'tl');
      sim.set('tr', f3(mse(m, tr)));
      sim.set('te', f3(mse(m, te)));
      sim.set('w', ML.sci(Math.hypot(...m.coef), 3));
    });
  });
})();
