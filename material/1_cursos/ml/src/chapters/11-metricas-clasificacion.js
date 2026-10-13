/* Capítulo 11 — Métricas de clasificación */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';
  /* Muestra de puntuaciones: negativos N(0, 1), positivos N(d, 1) */
  const scores = (n, prev, d, seed) => {
    const r = L.rng(seed), y = [], s = [];
    const nP = Math.max(1, Math.round(n * prev));
    for (let i = 0; i < n; i++) { const pos = i < nP ? 1 : 0; y.push(pos); s.push(r.gauss() + (pos ? d : 0)); }
    return { y, s };
  };

  /* ======================================================================
     11.1 Paradoja de la exactitud
     ====================================================================== */
  ML.defineSim('paradoja-exactitud', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Problema');
    sim.slider('prev', { label: 'Prevalencia de positivos', min: 0.005, max: 0.5, value: 0.02, log: true, step: 0.001, fmt: pct });
    sim.slider('d', { label: 'Calidad del modelo real (separación)', min: 0.5, max: 4, step: 0.05, value: 2, fmt: f2 });
    sim.out('triv', 'Trivial «todo negativo»: exactitud / MCC');
    sim.out('real', 'Modelo real: exactitud / MCC', { hl: true });
    sim.onDraw(() => {
      const d = scores(5000, sim.p.prev, sim.p.d, 3);
      let best = null;
      for (let t = -1; t <= 5; t += 0.05) { const m = L.met.binary(d.y, d.s.map((v) => (v >= t ? 1 : 0))); if (!best || m.f1 > best.f1) best = m; }
      const triv = L.met.binary(d.y, d.y.map(() => 0)), real = best;
      ML.draw.clear(cv);
      const keys = [['acc', 'exactitud'], ['bacc', 'exact. balanceada'], ['rec', 'exhaustividad'], ['prec', 'precisión'], ['f1', 'F1'], ['mcc', 'MCC']];
      const w2 = cv.w / 2;
      ML.text(cv.ctx, 'clasificador trivial (siempre «negativo»)', 16, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.text(cv.ctx, 'modelo real (umbral que maximiza F1)', w2 + 16, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 28, w: w2 - 16, h: cv.h - 36 }, keys.map(([k, n]) => ({ label: n, value: triv[k], color: '--c6' })), { labelW: 118, min: 0, max: 1, fmt: f3 });
      ML.hbars(cv.ctx, { x: w2 + 6, y: 28, w: w2 - 16, h: cv.h - 36 }, keys.map(([k, n]) => ({ label: n, value: real[k], color: '--c1' })), { labelW: 118, min: 0, max: 1, fmt: f3 });
      sim.set('triv', `${f3(triv.acc)} / ${f3(triv.mcc)}`);
      sim.set('real', `${f3(real.acc)} / ${f3(real.mcc)}`);
    });
  });

  /* ======================================================================
     11.2 Umbral, matriz de confusión, ROC y PR
     ====================================================================== */
  ML.defineSim('umbral-metricas', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 2.6, cls: 'full' }), cr = sim.canvas({ aspect: 1 }), cp = sim.canvas({ aspect: 1 });
    sim.group('Puntuaciones');
    sim.slider('d', { label: 'Separación entre clases', min: 0, max: 4, step: 0.05, value: 1.6, fmt: f2 });
    sim.slider('prev', { label: 'Prevalencia', min: 0.02, max: 0.5, step: 0.01, value: 0.3, fmt: pct });
    sim.group('Decisión');
    sim.slider('t', { label: 'Umbral', min: -3, max: 6, step: 0.02, value: 0.8, fmt: f2 });
    sim.out('cm', 'Matriz de confusión', { wide: true });
    sim.out('pr', 'Precisión / exhaustividad', { hl: true });
    sim.out('f1', 'F1 · especificidad');
    sim.out('auc', 'AUC · AP');
    sim.onDraw(() => {
      const d = scores(2000, sim.p.prev, sim.p.d, 8), t = sim.p.t;
      const m = L.met.binary(d.y, d.s.map((v) => (v >= t ? 1 : 0)));
      const roc = L.met.roc(d.y, d.s), pr = L.met.pr(d.y, d.s);
      ML.draw.clear(cd);
      const pl = new ML.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -3.5, xmax: 7, ymin: 0, ymax: 0.45, xlabel: 'puntuación del modelo', ylabel: 'densidad', title: 'distribución de las puntuaciones por clase real' });
      pl.frame();
      const neg = d.s.filter((_, i) => !d.y[i]), pos = d.s.filter((_, i) => d.y[i]);
      const pn = 1 - sim.p.prev, pp = sim.p.prev;
      pl.clip((ctx) => {
        const fill = (mu, w, col, from, to) => { ctx.fillStyle = ML.alpha(col, 0.35); ctx.beginPath(); ctx.moveTo(pl.X(from), pl.Y(0)); for (let x = from; x <= to; x += 0.02) ctx.lineTo(pl.X(x), pl.Y(w * L.stat.normPDF(x, mu, 1))); ctx.lineTo(pl.X(to), pl.Y(0)); ctx.fill(); };
        fill(0, pn, '--k0', t, 7); fill(sim.p.d, pp, '--k1', -3.5, t);
      });
      pl.fn((x) => pn * L.stat.normPDF(x, 0, 1), { color: '--k0', width: 2.2 });
      pl.fn((x) => pp * L.stat.normPDF(x, sim.p.d, 1), { color: '--k1', width: 2.2 });
      pl.vline(t, { color: '--ink', dash: [], label: 'umbral' });
      pl.legend([{ label: 'negativos (área a la derecha: FP)', color: '--k0' }, { label: 'positivos (área a la izquierda: FN)', color: '--k1' }]);
      void neg; void pos;
      ML.draw.clear(cr);
      const pr1 = new ML.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'FPR (1 − especificidad)', ylabel: 'exhaustividad (TPR)', title: 'curva ROC' });
      pr1.frame();
      pr1.fn((x) => x, { color: '--ink-3', dash: [4, 4], width: 1.2 });
      pr1.xy(roc.fpr, roc.tpr, { color: '--c1', width: 2.4 });
      pr1.dot(m.fpr, m.rec, { color: '--c2', r: 6 });
      ML.draw.clear(cp);
      const pr2 = new ML.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.02, xlabel: 'exhaustividad', ylabel: 'precisión', title: 'curva precisión–exhaustividad' });
      pr2.frame();
      pr2.hline(sim.p.prev, { color: '--ink-3', label: 'azar = prevalencia' });
      pr2.xy(pr.rec, pr.prec, { color: '--c3', width: 2.4 });
      if (m.tp + m.fp > 0) pr2.dot(m.rec, m.prec, { color: '--c2', r: 6 });
      sim.set('cm', `<table class="sim-tab"><tr><th></th><th>pred. +</th><th>pred. −</th></tr><tr><td>real +</td><td><b>${m.tp}</b> VP</td><td>${m.fn} FN</td></tr><tr><td>real −</td><td>${m.fp} FP</td><td><b>${m.tn}</b> VN</td></tr></table>`);
      sim.set('pr', `${f3(m.prec)} / ${f3(m.rec)}`);
      sim.set('f1', `${f3(m.f1)} · ${f3(m.spec)}`);
      sim.set('auc', `${f3(L.met.trapz(roc.fpr, roc.tpr))} · ${f3(pr.ap)}`);
    });
  });

  /* ======================================================================
     11.3 Prevalencia: ROC estable, PR no
     ====================================================================== */
  ML.defineSim('prevalencia-roc-pr', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1 }), cp = sim.canvas({ aspect: 1 });
    sim.group('Población');
    sim.slider('prev', { label: 'Prevalencia de positivos', min: 0.002, max: 0.5, value: 0.05, log: true, step: 0.001, fmt: pct });
    sim.slider('d', { label: 'Separación (calidad del modelo)', min: 0.5, max: 3.5, step: 0.05, value: 1.8, fmt: f2 });
    sim.out('auc', 'AUC', { hl: true });
    sim.out('ap', 'AP (área PR)', { hl: true });
    sim.out('p80', 'Precisión con exhaustividad 0.8');
    sim.out('fa', 'Falsas alarmas por acierto (con exh. 0.8)');
    sim.onDraw(() => {
      const n = 20000, base = scores(n, 0.5, sim.p.d, 21), d = scores(n, sim.p.prev, sim.p.d, 21);
      const rb = L.met.roc(base.y, base.s), rr = L.met.roc(d.y, d.s), pb = L.met.pr(base.y, base.s), pr = L.met.pr(d.y, d.s);
      ML.draw.clear(cr);
      const a = new ML.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'FPR', ylabel: 'TPR', title: 'ROC' });
      a.frame();
      a.xy(rb.fpr, rb.tpr, { color: '--ink-3', width: 4, alpha: 0.4 });
      a.xy(rr.fpr, rr.tpr, { color: '--c1', width: 2 });
      a.legend([{ label: 'prevalencia 50 %', color: '--ink-3' }, { label: `prevalencia ${pct(sim.p.prev)}`, color: '--c1' }], 'br');
      ML.draw.clear(cp);
      const b = new ML.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.02, xlabel: 'exhaustividad', ylabel: 'precisión', title: 'precisión–exhaustividad' });
      b.frame();
      b.xy(pb.rec, pb.prec, { color: '--ink-3', width: 4, alpha: 0.4 });
      b.xy(pr.rec, pr.prec, { color: '--c3', width: 2 });
      b.hline(sim.p.prev, { color: '--c3', label: 'azar' });
      let k = pr.rec.findIndex((r) => r >= 0.8);
      if (k < 0) k = pr.rec.length - 1;
      b.dot(pr.rec[k], pr.prec[k], { color: '--c2', r: 5 });
      sim.set('auc', `${f3(L.met.trapz(rr.fpr, rr.tpr))} (con 50 %: ${f3(L.met.trapz(rb.fpr, rb.tpr))})`);
      sim.set('ap', `${f3(pr.ap)} (con 50 %: ${f3(pb.ap)})`);
      sim.set('p80', f3(pr.prec[k]));
      sim.set('fa', ML.fix((1 - pr.prec[k]) / pr.prec[k], 1));
    });
  });
})();
