/* Capítulo 23 — Detección de anomalías */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     23.1 Distancia euclidiana frente a Mahalanobis
     ====================================================================== */
  ML.defineSim('mahalanobis', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.group('Datos normales');
    sim.slider('rho', { label: 'Correlación', min: 0, max: 0.97, step: 0.01, value: 0.85, fmt: f2 });
    sim.note('Arrastre el punto rojo (el caso a evaluar).');
    sim.out('de', 'Distancia euclidiana (estandarizada)');
    sim.out('dm', 'Distancia de Mahalanobis', { hl: true });
    sim.out('p', 'P(d² ≥ observado) bajo χ²(2)');
    let q = [0.9, -0.9], view = null;
    ML.pointer(cv, { down: (px, py) => (view && Math.hypot(view.X(q[0]) - px, view.Y(q[1]) - py) < 14 ? 1 : null), move: (k, px, py) => { q = [view.wx(px), view.wy(py)]; sim.redraw(); }, hover: (px, py) => view && Math.hypot(view.X(q[0]) - px, view.Y(q[1]) - py) < 14 });
    sim.onDraw(() => {
      const d = L.data.gauss2([{ n: 400, mean: [0, 0], sd: [0.7, 0.7], rho: sim.p.rho }], L.rng(3));
      const mh = L.anom.mahalanobis(d.X), sd = [L.stat.std(d.X.map((r) => r[0])), L.stat.std(d.X.map((r) => r[1]))];
      view = ML.view2(cv, 2.6);
      ML.draw.clear(cv);
      view.grid({ labels: false });
      ML.contour(view, (a, b) => Math.hypot((a - mh.mean[0]) / sd[0], (b - mh.mean[1]) / sd[1]), [1, 2, 3], { color: '--c6', width: 1.4, dash: [5, 4] });
      ML.contour(view, (a, b) => mh.d1([a, b]), [1, 2, 3], { color: '--c5', width: 2 });
      ML.points(view, d.X, null, { r: 2.6, alpha: 0.7 });
      const ctx = cv.ctx;
      ctx.beginPath(); ctx.arc(view.X(q[0]), view.Y(q[1]), 7, 0, 7); ctx.fillStyle = ML.col('--c2'); ctx.fill(); ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 2; ctx.stroke();
      sim.legend([{ label: 'euclidiana estandarizada = 1, 2, 3', color: '--c6', kind: 'dash' }, { label: 'Mahalanobis = 1, 2, 3', color: '--c5' }]);
      const de = Math.hypot((q[0] - mh.mean[0]) / sd[0], (q[1] - mh.mean[1]) / sd[1]), dm = mh.d1(q);
      sim.set('de', f2(de));
      sim.set('dm', f2(dm));
      sim.set('p', ML.sci(1 - L.stat.chi2CDF(dm * dm, 2), 2));
    });
  });

  /* ======================================================================
     23.2 Bosque de aislamiento, LOF y Mahalanobis
     ====================================================================== */
  ML.defineSim('isoforest-lof', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.group('Detector');
    sim.seg('m', { options: [['iso', 'Bosque de aislamiento'], ['lof', 'LOF'], ['maha', 'Mahalanobis']], value: 'iso' });
    sim.slider('k', { label: 'Vecinos del LOF', min: 3, max: 60, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.slider('top', { label: 'Casos marcados (los de mayor puntaje)', min: 5, max: 60, step: 1, value: 30, fmt: (v) => ML.fix(v, 0) });
    sim.out('ap', 'Precisión promedio (AP)', { hl: true });
    sim.out('hit', 'Aciertos entre los marcados');
    sim.out('kinds', 'Detectadas: sueltas / grupo / rompen la forma');
    const r = L.rng(5), X = [], y = [], kind = [];
    for (let i = 0; i < 360; i++) { const a = 0.75 * r.gauss(); X.push([a, 0.85 * a + 0.3 * r.gauss()]); y.push(0); kind.push(0); }
    for (let i = 0; i < 10; i++) { X.push([r.uniform(-2.3, 2.3), r.uniform(-2.3, 2.3)]); y.push(1); kind.push(1); }
    for (let i = 0; i < 10; i++) { X.push([1.7 + 0.08 * r.gauss(), -1.5 + 0.08 * r.gauss()]); y.push(1); kind.push(2); }
    for (let i = 0; i < 10; i++) { const a = r.uniform(-1, 1); X.push([a, -0.85 * a + 0.1 * r.gauss()]); y.push(1); kind.push(3); }
    const iso = L.ens.isoForest(X, { nTrees: 150, psi: 256, rng: L.rng(2) }), mh = L.anom.mahalanobis(X);
    let lofCache = null;
    sim.onDraw(() => {
      const k = Math.round(sim.p.k);
      if (sim.p.m === 'lof' && (!lofCache || lofCache.k !== k)) lofCache = { k, m: L.anom.lof(X, k) };
      const f1 = sim.p.m === 'iso' ? (x) => iso.score1(x) : sim.p.m === 'lof' ? (x) => lofCache.m.score1(x) : (x) => mh.d1(x);
      const sc = sim.p.m === 'lof' ? lofCache.m.lof : X.map(f1);
      const view = ML.view2(cv, 2.5);
      ML.draw.clear(cv);
      const lo = L.stat.quantile(sc, 0.05), hi = L.stat.quantile(sc, 0.995);
      ML.heatmap(view, (a, b) => { const t = ML.M.clamp((f1([a, b]) - lo) / (hi - lo), 0, 1); return [...ML.cmap.seq(t, '--c2'), 1]; }, { res: sim.p.m === 'lof' ? 8 : 5 });
      const top = U.argsort(sc, true).slice(0, Math.round(sim.p.top)), ts = new Set(top);
      const ctx = cv.ctx;
      X.forEach((x, i) => {
        ctx.beginPath(); ctx.arc(view.X(x[0]), view.Y(x[1]), y[i] ? 4 : 2.8, 0, 7);
        ctx.fillStyle = ML.col(y[i] ? '--k1' : '--k0'); ctx.fill();
        if (ts.has(i)) { ctx.lineWidth = 1.8; ctx.strokeStyle = ML.col('--ink'); ctx.beginPath(); ctx.arc(view.X(x[0]), view.Y(x[1]), 7, 0, 7); ctx.stroke(); }
      });
      ML.text(ctx, 'naranja: anomalía real · anillo: marcada por el detector · fondo: puntaje', 10, cv.h - 10, { size: 11, color: '--ink-2', halo: true });
      const hits = top.filter((i) => y[i]).length;
      sim.set('ap', f3(L.met.ap(y, sc)));
      sim.set('hit', `${hits} de ${top.length}`);
      sim.set('kinds', [1, 2, 3].map((t) => `${top.filter((i) => kind[i] === t).length}/10`).join(' · '));
      sim.ctl.k.show(sim.p.m === 'lof');
    });
  });
})();
