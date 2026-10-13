/* Capítulo 7 — Descenso de gradiente y optimización */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     7.1 Regímenes de la tasa de aprendizaje en 1D
     ====================================================================== */
  ML.defineSim('tasa-aprendizaje', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1.1 }), cl = sim.canvas({ aspect: 1.1 });
    sim.group('Pérdida L(w) = ½ a (w − 1)²');
    sim.slider('a', { label: 'Curvatura a', min: 0.5, max: 4, step: 0.05, value: 2, fmt: f2 });
    sim.slider('ea', { label: 'Tasa relativa η·a', min: 0.05, max: 2.2, step: 0.01, value: 0.2, fmt: f2 });
    sim.slider('steps', { label: 'Pasos', min: 1, max: 30, step: 1, value: 12, fmt: (v) => ML.fix(v, 0) });
    sim.out('eta', 'Tasa η');
    sim.out('fac', 'Factor por paso |1 − η a|', { hl: true });
    sim.out('reg', 'Régimen');
    sim.onDraw(() => {
      const a = sim.p.a, eta = sim.p.ea / a, N = Math.round(sim.p.steps);
      const Lf = (w) => 0.5 * a * (w - 1) ** 2;
      const ws = [-2.2];
      for (let k = 0; k < N; k++) ws.push(ws[k] - eta * a * (ws[k] - 1));
      ML.draw.clear(cf);
      const pf = new ML.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -3, xmax: 5, ymin: 0, ymax: 0.5 * a * 16, xlabel: 'w', ylabel: 'L(w)', title: 'iteraciones sobre la parábola' });
      pf.frame();
      pf.fn(Lf, { color: '--c1', width: 2.2 });
      pf.clip((ctx) => {
        ctx.strokeStyle = ML.col('--c2'); ctx.lineWidth = 1.4; ctx.beginPath();
        ws.forEach((w, k) => { const x = pf.X(ML.M.clamp(w, -50, 50)), y = pf.Y(Math.min(Lf(w), 1e4)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      });
      ws.forEach((w, k) => pf.dot(w, Lf(w), { color: k === 0 ? '--ink' : '--c2', r: k === 0 ? 5 : 3.5 }));
      ML.draw.clear(cl);
      const vals = ws.map((w) => Math.max(1e-12, Lf(w)));
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: N, ymin: 1e-6, ymax: Math.max(1e3, Math.max(...vals) * 2), ylog: true, xlabel: 'iteración', ylabel: 'L (escala log)', title: 'curva de entrenamiento' });
      pl.frame();
      pl.path(vals.map((v, k) => [k, Math.min(v, 1e30)]), { color: '--c2', width: 2.2 });
      vals.forEach((v, k) => pl.dot(k, v, { color: '--c2', r: 2.6 }));
      const fac = Math.abs(1 - sim.p.ea);
      sim.set('eta', f3(eta));
      sim.set('fac', f3(fac));
      sim.set('reg', sim.p.ea < 0.98 ? 'converge sin oscilar' : sim.p.ea <= 1.02 ? 'paso de Newton: llega en un paso' : sim.p.ea < 2 ? 'converge oscilando' : 'diverge');
    });
  });

  /* ======================================================================
     7.2 SGD con mini-lotes sobre una regresión lineal
     ====================================================================== */
  ML.defineSim('sgd-lotes', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 1 }), cl = sim.canvas({ aspect: 1 });
    sim.group('Descenso');
    sim.seg('B', { label: 'Tamaño de lote B', options: [[1, '1'], [8, '8'], [32, '32'], [200, 'completo']], value: 8 });
    sim.slider('eta', { label: 'Tasa η', min: 0.005, max: 0.5, step: 0.005, value: 0.05, log: true, fmt: f3 });
    sim.check('decay', { label: 'Tasa decreciente η/(1 + época/2)', value: false });
    sim.slider('ep', { label: 'Épocas', min: 1, max: 30, step: 1, value: 6, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otra semilla', () => { seed++; }, { id: 'seed' });
    sim.out('w', 'Parámetros finales (w, b)', { hl: true });
    sim.out('opt', 'Solución exacta');
    sim.out('upd', 'Actualizaciones realizadas');
    const n = 200, r0 = L.rng(3), X = [], Y = [];
    for (let i = 0; i < n; i++) { const x = r0.gauss(); X.push(x); Y.push(2 * x + 1 + 0.6 * r0.gauss()); }
    const ols = L.lin.ols(X.map((v) => [v]), Y, { stats: false });
    const Lf = (w, b) => { let s = 0; for (let i = 0; i < n; i++) s += (w * X[i] + b - Y[i]) ** 2; return s / n; };
    let seed = 1;
    sim.onDraw(() => {
      const B = sim.p.B, rng = L.rng(40 + seed), path = [[-1.5, -1.5]], losses = [[0, Lf(-1.5, -1.5)]];
      let w = -1.5, b = -1.5, upd = 0;
      for (let e = 0; e < sim.p.ep; e++) {
        const order = rng.perm(n), eta = sim.p.decay ? sim.p.eta / (1 + e / 2) : sim.p.eta;
        for (let s = 0; s < n; s += B) {
          let gw = 0, gb = 0;
          const idx = order.slice(s, s + B);
          for (const i of idx) { const r = w * X[i] + b - Y[i]; gw += (2 * r * X[i]) / idx.length; gb += (2 * r) / idx.length; }
          w -= eta * gw; b -= eta * gb; upd++;
          if (Math.abs(w) > 1e3) break;
          if (path.length < 3000) path.push([w, b]);
          losses.push([upd, Lf(w, b)]);
        }
      }
      ML.draw.clear(cc);
      const pc = new ML.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: -2, xmax: 3.5, ymin: -2, ymax: 3, xlabel: 'w', ylabel: 'b', title: 'trayectoria sobre el MSE' });
      const lmin = Lf(ols.coef[0], ols.intercept);
      ML.contour(pc, (a, c) => Math.log(Lf(a, c) - lmin + 1e-3), Array.from({ length: 10 }, (_, k) => -1.5 + 0.7 * k), { color: '--c1', width: 1, alpha: 0.55 });
      pc.frame();
      pc.path(path, { color: '--c2', width: 1.2 });
      pc.dot(w, b, { color: '--c2', r: 5 });
      ML.cross(pc, ols.coef[0], ols.intercept);
      ML.draw.clear(cl);
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: Math.max(1, upd), ymin: 0.2, ymax: 30, ylog: true, xlabel: 'actualizaciones', ylabel: 'MSE (log)', title: 'pérdida de entrenamiento' });
      pl.frame();
      pl.hline(lmin, { color: '--ink-3', label: 'mínimo', labelRight: true });
      pl.path(losses, { color: '--c2', width: 1.6 });
      sim.set('w', `(${f3(w)}, ${f3(b)})`);
      sim.set('opt', `(${f3(ols.coef[0])}, ${f3(ols.intercept)})`);
      sim.set('upd', `${upd} (${Math.ceil(n / B)} por época)`);
    });
  });

  /* ======================================================================
     7.3 Carrera de optimizadores
     ====================================================================== */
  ML.defineSim('carrera-optimizadores', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const DEF = { gd: 0.05, momentum: 0.02, nesterov: 0.02, adagrad: 0.4, rmsprop: 0.03, adam: 0.08 };
    const COL = { gd: '--c1', momentum: '--c2', nesterov: '--c4', adagrad: '--c6', rmsprop: '--c5', adam: '--c3' };
    sim.group('Superficie');
    sim.select('surf', { label: 'Función', options: Object.keys(L.opt.SURF).map((k) => [k, L.opt.SURF[k].n]), value: 'bowl' });
    sim.slider('mult', { label: 'Multiplicador de las tasas', min: 0.1, max: 3, step: 0.05, value: 1, log: true, fmt: f2 });
    sim.group('Optimizadores');
    L.opt.KINDS.forEach(([k, n]) => sim.check(k, { label: `${n} (η = ${DEF[k]})`, value: ['gd', 'momentum', 'adam'].includes(k) }));
    sim.out('tab', 'Pérdida tras los pasos dados', { wide: true });
    let paths = {}, t = 0;
    const restart = () => { t = 0; paths = {}; };
    restart();
    sim.onChange = () => restart();
    sim.resetButton(restart);
    const MAXS = 400;
    sim.animate((dt) => { t = Math.min(MAXS, t + dt * 60); });
    let view = null;
    ML.pointer(cv, { down: (px, py) => { if (!view) return null; const S = L.opt.SURF[sim.p.surf]; S.start = [view.wx(px), view.wy(py)]; restart(); return 1; }, move: () => {}, hover: () => 'crosshair' });
    sim.onDraw(() => {
      const S = L.opt.SURF[sim.p.surf], [x0, x1, y0, y1] = S.box;
      view = new ML.View2D(cv, { xmin: x0, xmax: x1, ymin: y0, ymax: y1 });
      ML.draw.clear(cv);
      const vals = [];
      for (let k = 0; k < 14; k++) vals.push(S.levels(k));
      ML.heatmap(view, (x, y) => { const v = S.f(x, y); const tt = ML.M.clamp((Math.log(Math.max(1e-6, v - vals[0] + 1e-3)) + 4) / 9, 0, 1); return [...ML.cmap.seq(1 - 0.75 * tt, '--c1'), 0.6]; }, { res: 5 });
      ML.contour(view, S.f, vals, { color: '--ink-3', width: 1, alpha: 0.5, res: 4 });
      view.grid({ labels: true, minorLines: false });
      const ctx = cv.ctx, rows = [];
      for (const [k, name] of L.opt.KINDS) {
        if (!sim.p[k]) continue;
        if (!paths[k]) paths[k] = L.opt.path(S, k, { lr: DEF[k] * sim.p.mult, start: S.start }, MAXS);
        const P = paths[k].slice(0, Math.max(1, Math.round(t) + 1));
        ctx.save(); ctx.strokeStyle = ML.col(COL[k]); ctx.lineWidth = 2; ctx.beginPath();
        P.forEach((p, i) => { const x = view.X(ML.M.clamp(p[0], -1e4, 1e4)), y = view.Y(ML.M.clamp(p[1], -1e4, 1e4)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke(); ctx.restore();
        const e = P[P.length - 1];
        ctx.beginPath(); ctx.arc(view.X(e[0]), view.Y(e[1]), 5, 0, 7); ctx.fillStyle = ML.col(COL[k]); ctx.fill(); ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 1.5; ctx.stroke();
        rows.push(`<tr><td><span style="color:var(${COL[k]})">●</span> ${name}</td><td>${paths[k].length - 1 < MAXS && Math.round(t) >= paths[k].length - 1 ? 'divergió' : ML.sci(S.f(e[0], e[1]), 3)}</td></tr>`);
      }
      ML.cross(view, S.min[0], S.min[1], { color: '--ink' });
      ML.text(ctx, `paso ${Math.round(t)} de ${MAXS} · clic para cambiar el punto de partida`, 10, cv.h - 10, { size: 11.5, color: '--ink-2', halo: true });
      sim.set('tab', `<table class="sim-tab"><tr><th>método</th><th>L</th></tr>${rows.join('')}</table>`);
    });
  });
})();
