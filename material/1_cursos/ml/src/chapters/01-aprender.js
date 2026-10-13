/* Capítulo 1 — ¿Qué es aprender de datos? */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L;
  const pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     1.1 Frontera a mano frente a logística y 1-NN
     ====================================================================== */
  ML.defineSim('aprender-a-mano', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.group('Datos');
    sim.select('kind', { label: 'Conjunto de datos', options: [['linear', 'Dos nubes solapadas'], ['moons', 'Lunas']], value: 'linear' });
    sim.slider('noise', { label: 'Solapamiento (ruido)', min: 0, max: 1, step: 0.01, value: 0.55, fmt: (v) => ML.fix(v, 2) });
    sim.button('Nueva muestra', () => { seed++; build(); }, { id: 'new' });
    sim.group('Modelo');
    sim.seg('m', { options: [['hand', 'Mi recta'], ['logit', 'Logística'], ['nn1', '1 vecino']], value: 'hand' });
    sim.check('test', { label: 'Mostrar datos de prueba (huecos)', value: false });
    sim.out('tr', 'Exactitud de entrenamiento');
    sim.out('te', 'Exactitud de prueba', { hl: true });
    sim.outSep();
    sim.out('tab', 'Comparación', { wide: true });
    let seed = 1, tr, te, logit, nn1;
    let P = [[-1.6, 1.2], [1.4, -1.5]];
    const build = () => {
      tr = L.data.make2d(sim.p.kind, 60, sim.p.noise, L.rng(100 + seed));
      te = L.data.make2d(sim.p.kind, 300, sim.p.noise, L.rng(900 + seed));
      logit = L.lin.logistic(tr.X, tr.y, { C: 100 });
      nn1 = L.knn.classifier(tr.X, tr.y, 1);
    };
    build();
    sim.onChange = (id) => { if (id === 'kind' || id === 'noise') build(); };
    const side = (x) => (P[1][0] - P[0][0]) * (x[1] - P[0][1]) - (P[1][1] - P[0][1]) * (x[0] - P[0][0]);
    const handSign = () => { let a = 0; tr.X.forEach((x, i) => { if ((side(x) > 0 ? 1 : 0) === tr.y[i]) a++; }); return a >= tr.X.length / 2 ? 1 : -1; };
    const predHand = (x) => (handSign() * side(x) > 0 ? 1 : 0);
    const model = (m) => (m === 'hand' ? predHand : m === 'logit' ? (x) => (logit.decision([x])[0] >= 0 ? 1 : 0) : (x) => nn1.predict1(x));
    const acc = (d, f) => L.met.accuracy(d.y, d.X.map(f));
    const view = ML.view2(cv, 2.3);
    let drag = -1;
    ML.pointer(cv, {
      down: (px, py) => { if (sim.p.m !== 'hand') return null; for (let k = 0; k < 2; k++) if (Math.hypot(view.X(P[k][0]) - px, view.Y(P[k][1]) - py) < 16) { drag = k; return k; } return null; },
      move: (k, px, py) => { P[k] = [ML.M.clamp(view.wx(px), -2.2, 2.2), ML.M.clamp(view.wy(py), -2.2, 2.2)]; sim.redraw(); },
      up: () => { drag = -1; },
      hover: (px, py) => sim.p.m === 'hand' && P.some((q) => Math.hypot(view.X(q[0]) - px, view.Y(q[1]) - py) < 16)
    });
    sim.onDraw(() => {
      view.update();
      ML.draw.clear(cv);
      const f = model(sim.p.m);
      ML.probMap(view, (x, y) => (f([x, y]) ? 0.85 : 0.15), { res: 5, alpha: 0.32, hard: false });
      if (sim.p.m === 'hand') {
        const ctx = cv.ctx, dx = P[1][0] - P[0][0], dy = P[1][1] - P[0][1];
        ctx.save(); ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(view.X(P[0][0] - 10 * dx), view.Y(P[0][1] - 10 * dy)); ctx.lineTo(view.X(P[0][0] + 10 * dx), view.Y(P[0][1] + 10 * dy)); ctx.stroke(); ctx.restore();
      } else if (sim.p.m === 'logit') ML.contour(view, (x, y) => logit.decision([[x, y]])[0], 0, { res: 4, width: 2.2 });
      else ML.labelEdges(view, (x, y) => nn1.predict1([x, y]), { res: 3, width: 1.4 });
      if (sim.p.test) ML.points(view, te.X, te.y, { r: 3.2, hollow: L.util.range(te.X.length), alpha: 0.85 });
      ML.points(view, tr.X, tr.y, { r: 4.6 });
      if (sim.p.m === 'hand') P.forEach((q) => { const c = cv.ctx; c.beginPath(); c.arc(view.X(q[0]), view.Y(q[1]), 8, 0, 7); c.fillStyle = ML.col('--accent'); c.fill(); c.lineWidth = 2; c.strokeStyle = ML.col('--canvas'); c.stroke(); });
      ML.text(cv.ctx, sim.p.m === 'hand' ? 'arrastre los dos círculos para mover la recta' : sim.p.m === 'logit' ? 'frontera aprendida por regresión logística' : '1-NN: cada punto nuevo copia la clase del más cercano', 10, 18, { size: 11.5, color: '--ink-2', halo: true });
      sim.set('tr', pct(acc(tr, f)));
      sim.set('te', pct(acc(te, f)));
      const rows = [['hand', 'Mi recta'], ['logit', 'Logística'], ['nn1', '1 vecino']].map(([k, n]) => `<tr><td>${n}</td><td>${pct(acc(tr, model(k)))}</td><td>${pct(acc(te, model(k)))}</td></tr>`).join('');
      sim.set('tab', `<table class="sim-tab"><tr><th>modelo</th><th>entren.</th><th>prueba</th></tr>${rows}</table>`);
    });
  });

  /* ======================================================================
     1.2 Curva de experiencia: error de prueba frente a n
     ====================================================================== */
  ML.defineSim('curva-experiencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.group('Experimento');
    sim.select('kind', { label: 'Conjunto de datos', options: [['moons', 'Lunas'], ['linear', 'Dos nubes'], ['circles', 'Círculos']], value: 'moons' });
    sim.select('model', { label: 'Algoritmo', options: [['logit', 'Logística lineal'], ['knn', 'k-NN (k = 5)'], ['tree', 'Árbol (profundidad 6)']], value: 'knn' });
    sim.check('both', { label: 'Superponer la logística lineal', value: true });
    sim.note('Cada punto promedia 12 entrenamientos con muestras independientes, evaluados en 1 000 datos de prueba fijos. La banda va del percentil 10 al 90.');
    sim.out('err', 'Error de prueba con n = 500', { hl: true });
    sim.out('err20', 'Error de prueba con n = 20');
    const NS = [10, 15, 20, 30, 45, 70, 100, 150, 230, 350, 500], REP = 12;
    let res = {}, queue = [], test;
    const fitPred = (model, d) => {
      if (model === 'logit') { const m = L.lin.logistic(d.X, d.y, { C: 100 }); return (X) => m.predict(X); }
      if (model === 'knn') { const m = L.knn.classifier(d.X, d.y, Math.min(5, d.X.length)); return (X) => m.predict(X); }
      const t = L.tree.fit(d.X, d.y, { maxDepth: 6 }); return (X) => t.predict(X);
    };
    const restart = () => {
      test = L.data.make2d(sim.p.kind, 1000, 0.35, L.rng(77));
      res = {}; queue = [];
      const models = Array.from(new Set([sim.p.model, ...(sim.p.both ? ['logit'] : [])]));
      for (const m of models) { res[m] = NS.map(() => []); for (let r = 0; r < REP; r++) NS.forEach((n, k) => queue.push([m, k, r])); }
    };
    restart();
    sim.onChange = () => restart();
    sim.animate(() => {
      const t0 = performance.now();
      while (queue.length && performance.now() - t0 < 25) {
        const [m, k, r] = queue.shift();
        const d = L.data.make2d(sim.p.kind, NS[k], 0.35, L.rng(5000 + 97 * r + 13 * k));
        if (new Set(d.y).size < 2) { res[m][k].push(0.5); continue; }
        const pred = fitPred(m, d)(test.X);
        res[m][k].push(1 - L.met.accuracy(test.y, pred));
      }
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 8, xmax: 600, xlog: true, ymin: 0, ymax: 0.5, xlabel: 'número de datos de entrenamiento n', ylabel: 'error de prueba' });
      pl.frame();
      const colors = { logit: '--c2', knn: '--c1', tree: '--c3' };
      const names = { logit: 'logística lineal', knn: 'k-NN (k = 5)', tree: 'árbol (prof. 6)' };
      const leg = [];
      for (const m in res) {
        const pts = [], lo = [], hi = [];
        res[m].forEach((a, k) => { if (a.length >= 3) { pts.push([NS[k], L.stat.mean(a)]); lo.push([NS[k], L.stat.quantile(a, 0.1)]); hi.push([NS[k], L.stat.quantile(a, 0.9)]); } });
        if (pts.length > 1) {
          pl.clip((ctx) => {
            ctx.fillStyle = ML.alpha(colors[m], 0.15);
            ctx.beginPath();
            lo.forEach((p, i) => (i ? ctx.lineTo(pl.X(p[0]), pl.Y(p[1])) : ctx.moveTo(pl.X(p[0]), pl.Y(p[1]))));
            for (let i = hi.length - 1; i >= 0; i--) ctx.lineTo(pl.X(hi[i][0]), pl.Y(hi[i][1]));
            ctx.closePath(); ctx.fill();
          });
          pl.path(pts, { color: colors[m], width: 2.4 });
          pts.forEach((p) => pl.dot(p[0], p[1], { color: colors[m], r: 3.2 }));
        }
        leg.push({ label: names[m], color: colors[m] });
      }
      pl.legend(leg);
      const a = res[sim.p.model];
      sim.set('err', a[NS.length - 1].length ? `${pct(L.stat.mean(a[NS.length - 1]))}` : 'calculando…');
      sim.set('err20', a[2].length ? `${pct(L.stat.mean(a[2]))}` : 'calculando…');
    });
  });
})();
