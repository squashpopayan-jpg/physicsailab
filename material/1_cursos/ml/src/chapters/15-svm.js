/* Capítulo 15 — Máquinas de vectores de soporte */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';
  /* Anillos alrededor de los vectores de soporte */
  const rings = (view, X, sv, bounded) => {
    const ctx = view.cv.ctx, bset = new Set(bounded);
    ctx.save();
    for (const i of sv) { ctx.beginPath(); ctx.arc(view.X(X[i][0]), view.Y(X[i][1]), 8, 0, 7); ctx.strokeStyle = ML.col(bset.has(i) ? '--c2' : '--ink'); ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.restore();
  };

  /* ======================================================================
     15.1 Margen máximo con puntos arrastrables
     ====================================================================== */
  ML.defineSim('svm-margen', function (sim) {
    const cv = sim.canvas({ aspect: 1.4 });
    const INIT = [[-1.4, 0.4, 0], [-1.0, -0.6, 0], [-0.4, 0.9, 0], [-1.6, -1.2, 0], [-0.6, -0.1, 0], [-0.2, -1.1, 0], [0.5, 0.6, 1], [1.3, 0.2, 1], [0.9, 1.3, 1], [1.6, -0.7, 1], [0.4, -0.5, 1], [1.1, -1.4, 1]];
    let P = INIT.map((p) => p.slice());
    sim.group('Margen blando');
    sim.slider('C', { label: 'C (castigo por violar el margen)', min: 0.01, max: 1000, value: 10, log: true, step: 0.01, fmt: (v) => ML.sci(v, 2) });
    sim.button('Restablecer puntos', () => { P = INIT.map((p) => p.slice()); }, { id: 'reset' });
    sim.note('Anillo negro: vector de soporte sobre el borde. Anillo rojo: vector de soporte dentro del pasillo o mal clasificado (α = C).');
    sim.out('marg', 'Ancho del pasillo 2/‖w‖', { hl: true });
    sim.out('nsv', 'Vectores de soporte');
    sim.out('err', 'Errores de entrenamiento');
    sim.out('w', 'w y b');
    let view = null, drag = -1;
    const hit = (px, py) => P.findIndex((p) => Math.hypot(view.X(p[0]) - px, view.Y(p[1]) - py) < 11);
    ML.pointer(cv, {
      down: (px, py) => { if (!view) return null; const k = hit(px, py); if (k < 0) return null; drag = k; return k; },
      move: (k, px, py) => { P[k][0] = ML.M.clamp(view.wx(px), -2.3, 2.3); P[k][1] = ML.M.clamp(view.wy(py), -2.3, 2.3); sim.redraw(); },
      up: () => { drag = -1; }, hover: (px, py) => view && hit(px, py) >= 0
    });
    sim.onDraw(() => {
      const X = P.map((p) => [p[0], p[1]]), y = P.map((p) => p[2]);
      const m = L.svm.fit(X, y, { kernel: 'linear', C: sim.p.C, tol: 1e-6 });
      view = ML.view2(cv, 2.4);
      ML.draw.clear(cv);
      view.grid({ labels: false });
      const f = (a, b) => m.decision1([a, b]);
      ML.heatmap(view, (a, b) => { const v = f(a, b); const inside = Math.abs(v) < 1; const c = ML.rgb(v > 0 ? '--k1' : '--k0'); const bg = ML.rgb('--canvas'); const t = inside ? 0.12 : 0.28; return [bg[0] + (c[0] - bg[0]) * t, bg[1] + (c[1] - bg[1]) * t, bg[2] + (c[2] - bg[2]) * t, 1]; }, { res: 4 });
      ML.contour(view, f, 0, { width: 2.6 });
      ML.contour(view, f, [-1, 1], { width: 1.4, dash: [6, 5], color: '--ink-2' });
      ML.points(view, X, y, { r: 5.5, mark: drag });
      rings(view, X, m.sv, m.bounded);
      const nw = Math.hypot(m.w[0], m.w[1]);
      sim.set('marg', f3(2 / nw));
      sim.set('nsv', `${m.sv.length} (${m.bounded.length} con α = C)`);
      sim.set('err', String(y.filter((v, i) => (f(X[i][0], X[i][1]) >= 0 ? 1 : 0) !== v).length));
      sim.set('w', `(${f2(m.w[0])}, ${f2(m.w[1])}), b = ${f2(m.b)}`);
    });
  });

  /* ======================================================================
     15.2 El truco del núcleo en 3D
     ====================================================================== */
  ML.defineSim('truco-kernel', function (sim) {
    sim.cols2();
    const c2 = sim.canvas({ aspect: 1 }), c3 = sim.canvas({ aspect: 1 });
    sim.group('Elevación z = x₁² + x₂²');
    sim.slider('h', { label: 'Altura del plano separador z = h', min: 0.1, max: 2.5, step: 0.01, value: 0.9, fmt: f2 });
    sim.check('lift', { label: 'Elevar los puntos', value: true });
    sim.out('acc', 'Exactitud con el plano z = h', { hl: true });
    sim.out('r', 'Frontera en el plano original');
    const d = L.data.circles(160, 0.08, 0.5, L.rng(4));
    const X = d.X.map(([a, b]) => [1.2 * a, 1.2 * b]), y = d.y;
    const v3 = new ML.View3D(sim, c3, { az: ML.M.rad(-55), el: ML.M.rad(22), radius: 2.5, target: [0, 0, 0.75] });
    sim.onDraw(() => {
      const h = sim.p.h, z = (p) => p[0] * p[0] + p[1] * p[1];
      const view = ML.view2(c2, 1.8);
      ML.draw.clear(c2);
      view.grid({ labels: false });
      const ctx = c2.ctx;
      ctx.save(); ctx.strokeStyle = ML.col('--c3'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), Math.sqrt(h) * view.s, 0, 7); ctx.stroke(); ctx.restore();
      ML.points(view, X, y, { r: 3.6 });
      ML.text(ctx, 'plano original: ninguna recta los separa', 10, 18, { size: 11.5, color: '--ink-2', halo: true });
      v3.begin();
      v3.mesh((u, t) => [u * Math.cos(t), u * Math.sin(t), u * u], 0, 1.4, 10, 0, 2 * Math.PI, 28, { fill: '--c6', alpha: 0.08, seam: false, wire: '--ink-3', wireAlpha: 0.25, wireEveryU: 2, wireEveryV: 4 });
      v3.poly([[-1.8, -1.8, h], [1.8, -1.8, h], [1.8, 1.8, h], [-1.8, 1.8, h]], { fill: '--c3', alpha: 0.22, stroke: '--c3' });
      X.forEach((p, i) => v3.point([p[0], p[1], sim.p.lift ? z(p) : 0], { r: 3.3, color: ML.kvar(y[i]) }));
      v3.axes({ len: 2, neg: 0, names: ['x₁', 'x₂', 'z'] });
      v3.render();
      const acc = L.met.accuracy(y, X.map((p) => (z(p) > h ? 0 : 1)));
      sim.set('acc', pct(Math.max(acc, 1 - acc)));
      sim.set('r', `circunferencia de radio √h = ${f3(Math.sqrt(h))}`);
    });
  });

  /* ======================================================================
     15.3 SVM con núcleo sobre datos 2D
     ====================================================================== */
  ML.defineSim('svm-kernel', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    ML.dataControls(sim, { kind: 'moons', n: 160, noise: 0.35, nmax: 300 });
    sim.group('Núcleo');
    sim.seg('ker', { options: [['rbf', 'RBF'], ['poly', 'Polinómico'], ['linear', 'Lineal']], value: 'rbf' });
    sim.slider('C', { label: 'C', min: 0.01, max: 1000, value: 1, log: true, step: 0.01, fmt: (v) => ML.sci(v, 2) });
    sim.slider('g', { label: 'γ', min: 0.01, max: 100, value: 1, log: true, step: 0.01, fmt: (v) => ML.sci(v, 2) });
    sim.slider('deg', { label: 'Grado (polinómico)', min: 2, max: 6, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.out('nsv', 'Vectores de soporte');
    sim.onDraw(() => {
      const d = ML.makeData(sim), te = L.data.make2d(sim.p.kind, 500, sim.p.noise, L.rng(7000 + sim.p.seed));
      const yy = d.y.map((v) => (v > 0 ? 1 : 0)), yt = te.y.map((v) => (v > 0 ? 1 : 0));
      const m = L.svm.fit(d.X, yy, { kernel: sim.p.ker, C: sim.p.C, gamma: sim.p.ker === 'poly' ? 0.7 : sim.p.g, degree: sim.p.deg, coef0: 1, tol: 1e-3 });
      const view = ML.view2(cv, 2.3);
      ML.draw.clear(cv);
      const f = (a, b) => m.decision1([a, b]);
      ML.probMap(view, (a, b) => U.sigmoid(2 * f(a, b)), { res: 5, alpha: 0.55 });
      ML.contour(view, f, 0, { width: 2.4, res: 4 });
      ML.contour(view, f, [-1, 1], { width: 1.2, dash: [5, 4], color: '--ink-2', res: 4 });
      ML.points(view, d.X, yy, { r: 3.6 });
      rings(view, d.X, m.sv, m.bounded);
      sim.set('tr', pct(L.met.accuracy(yy, m.predict(d.X))));
      sim.set('te', pct(L.met.accuracy(yt, m.predict(te.X))));
      sim.set('nsv', `${m.sv.length} de ${d.X.length}`);
      sim.ctl.g.show(sim.p.ker === 'rbf');
      sim.ctl.deg.show(sim.p.ker === 'poly');
    });
  });
})();
