/* Capítulo 12 — Calibración, umbrales y clases desbalanceadas */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), f4 = (v) => ML.fix(v, 4), pct = (v) => ML.fix(100 * v, 1) + ' %';
  const DIST = {
    ok: { n: 'Bien calibrado', f: (p) => p },
    over: { n: 'Sobreconfiado (como Bayes ingenuo)', f: (p) => U.sigmoid(2.6 * U.logit(p)) },
    under: { n: 'Subconfiado (como un bosque)', f: (p) => U.sigmoid(0.45 * U.logit(p)) },
    shift: { n: 'Sobrestima el riesgo', f: (p) => U.sigmoid(U.logit(p) + 1.2) }
  };
  /* Probabilidades verdaderas p = σ(z) con z normal y etiquetas Bernoulli(p) */
  const draw = (n, seed, mu = -1.2, sd = 1.8) => { const r = L.rng(seed), p = [], y = []; for (let i = 0; i < n; i++) { const q = U.sigmoid(mu + sd * r.gauss()); p.push(ML.M.clamp(q, 1e-6, 1 - 1e-6)); y.push(r() < q ? 1 : 0); } return { p, y }; };

  /* ======================================================================
     12.1 Diagrama de fiabilidad y corrección
     ====================================================================== */
  ML.defineSim('fiabilidad', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1 }), ch = sim.canvas({ aspect: 1 });
    sim.group('Modelo');
    sim.select('dist', { label: 'Probabilidades del modelo', options: Object.keys(DIST).map((k) => [k, DIST[k].n]), value: 'over' });
    sim.seg('fix', { label: 'Corrección (ajustada con datos de calibración)', options: [['none', 'Ninguna'], ['platt', 'Platt'], ['iso', 'Isotónica']], value: 'none' });
    sim.slider('ncal', { label: 'Datos de calibración', min: 50, max: 5000, step: 50, value: 1000, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.out('ece', 'ECE (10 bins)', { hl: true });
    sim.out('brier', 'Brier');
    sim.out('auc', 'AUC');
    sim.onDraw(() => {
      const f = DIST[sim.p.dist].f;
      const cal = draw(Math.round(sim.p.ncal), 11), te = draw(6000, 12);
      const qc = cal.p.map(f), qt = te.p.map(f);
      let g = (q) => q;
      if (sim.p.fix === 'platt') { const m = L.lin.logistic(qc.map((q) => [U.logit(q)]), cal.y, { C: 1e6 }); g = (q) => U.sigmoid(m.intercept + m.coef[0] * U.logit(q)); }
      else if (sim.p.fix === 'iso') { const m = L.met.isotonic(qc, cal.y); g = (q) => ML.M.clamp(m.f(q), 1e-6, 1 - 1e-6); }
      const out = qt.map(g);
      const c = L.met.calibration(te.y, out, 10);
      ML.draw.clear(cr);
      const pr = new ML.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'probabilidad predicha (media del bin)', ylabel: 'fracción real de positivos', title: 'diagrama de fiabilidad' });
      pr.frame();
      pr.fn((x) => x, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pr.path(c.pred.map((p, i) => [p, c.true[i]]), { color: '--c2', width: 2.2 });
      c.pred.forEach((p, i) => pr.dot(p, c.true[i], { color: '--c2', r: 2.5 + 7 * Math.sqrt(c.count[i] / 6000) }));
      ML.draw.clear(ch);
      const h = L.stat.hist(out, 0, 1, 20);
      const ph = new ML.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(...h.dens) * 1.1, xlabel: 'probabilidad predicha', ylabel: 'densidad', title: 'distribución de las predicciones' });
      ph.frame();
      ML.drawHist(ph, h, { color: '--c1', alpha: 0.5 });
      sim.set('ece', f4(c.ece));
      sim.set('brier', f4(L.met.brier(te.y, out)));
      sim.set('auc', f3(L.met.auc(te.y, out)));
    });
  });

  /* ======================================================================
     12.2 Umbral de mínimo costo
     ====================================================================== */
  ML.defineSim('umbral-costos', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Costos');
    sim.slider('cfp', { label: 'Costo de un falso positivo', min: 1, max: 50, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.slider('cfn', { label: 'Costo de un falso negativo', min: 1, max: 50, step: 1, value: 10, fmt: (v) => ML.fix(v, 0) });
    sim.check('over', { label: 'Probabilidades sobreconfiadas', value: false });
    sim.out('topt', 'Umbral de mínimo costo (con datos)', { hl: true });
    sim.out('tth', 'Umbral teórico c_FP / (c_FP + c_FN)');
    sim.out('cost', 'Costo medio: umbral 0.5 / óptimo');
    const d = draw(8000, 31);
    sim.onDraw(() => {
      const q = sim.p.over ? d.p.map(DIST.over.f) : d.p;
      const T = Array.from(L.util.linspace(0.005, 0.995, 199));
      const cost = (t) => { let s = 0; for (let i = 0; i < q.length; i++) { const pos = q[i] >= t; if (pos && !d.y[i]) s += sim.p.cfp; if (!pos && d.y[i]) s += sim.p.cfn; } return s / q.length; };
      const C = T.map(cost), k = U.argmin(C), tth = sim.p.cfp / (sim.p.cfp + sim.p.cfn);
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(...C) * 1.08, xlabel: 'umbral de decisión', ylabel: 'costo medio por caso' });
      pl.frame();
      pl.xy(T, C, { color: '--c5', width: 2.4 });
      pl.vline(T[k], { color: '--c5', dash: [], label: 'mínimo con datos' });
      pl.vline(tth, { color: '--c2', label: 'teórico', labelY: 30 });
      pl.vline(0.5, { color: '--ink-3', label: '0.5', labelY: 48 });
      sim.set('topt', f3(T[k]));
      sim.set('tth', f3(tth));
      sim.set('cost', `${f3(cost(0.5))} / ${f3(C[k])}`);
    });
  });

  /* ======================================================================
     12.3 Desbalance: pesos, umbral y sobremuestreo
     ====================================================================== */
  ML.defineSim('desbalance-pesos', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.group('Datos');
    sim.slider('prev', { label: 'Proporción de la clase minoritaria', min: 0.02, max: 0.5, step: 0.01, value: 0.08, fmt: pct });
    sim.group('Estrategias a comparar');
    sim.check('s0', { label: 'Sin ajuste (umbral 0.5)', value: true });
    sim.check('s1', { label: 'Pesos balanceados', value: true });
    sim.check('s2', { label: 'Mover el umbral a la prevalencia', value: true });
    sim.out('tab', 'Resultados en datos de prueba', { wide: true });
    sim.onDraw(() => {
      const make = (n, seed) => { const r = L.rng(seed), X = [], y = []; for (let i = 0; i < n; i++) { const pos = r() < sim.p.prev ? 1 : 0; X.push([(pos ? 0.8 : -0.4) + 0.7 * r.gauss(), (pos ? 0.6 : -0.3) + 0.7 * r.gauss()]); y.push(pos); } return { X, y }; };
      const tr = make(500, 3), te = make(4000, 4);
      const nP = tr.y.filter((v) => v).length, n = tr.y.length;
      const m0 = L.lin.logistic(tr.X, tr.y, { C: 1 });
      const wts = tr.y.map((v) => (v ? n / (2 * Math.max(1, nP)) : n / (2 * (n - nP))));
      const m1 = L.lin.logistic(tr.X, tr.y, { C: 1, weights: wts });
      const t2 = nP / n;
      const S = [
        { on: sim.p.s0, n: 'sin ajuste', p: (X) => m0.proba(X), t: 0.5, col: '--c6' },
        { on: sim.p.s1, n: 'pesos balanceados', p: (X) => m1.proba(X), t: 0.5, col: '--c2' },
        { on: sim.p.s2, n: 'umbral = prevalencia', p: (X) => m0.proba(X), t: t2, col: '--c3' }
      ];
      const view = ML.view2(cv, 2.6);
      ML.draw.clear(cv);
      view.grid({ labels: false });
      ML.points(view, te.X.slice(0, 900), te.y.slice(0, 900), { r: 2.6, alpha: 0.75 });
      const rows = [];
      S.forEach((s) => {
        if (!s.on) return;
        ML.contour(view, (a, b) => s.p([[a, b]])[0] - s.t, 0, { color: s.col, width: 2.6, res: 4 });
        const pr = s.p(te.X), m = L.met.binary(te.y, pr.map((v) => (v >= s.t ? 1 : 0)));
        rows.push(`<tr><td><span style="color:var(${s.col})">━</span> ${s.n}</td><td>${f2(m.rec)}</td><td>${f2(m.prec)}</td><td>${f2(m.f1)}</td><td>${f3(L.stat.mean(pr))}</td></tr>`);
      });
      sim.set('tab', `<table class="sim-tab"><tr><th>estrategia</th><th>exh.</th><th>prec.</th><th>F1</th><th>p̄</th></tr>${rows.join('')}</table><div class="ctrl-note">p̄ = probabilidad media predicha; la prevalencia real es ${f3(te.y.filter((v) => v).length / te.y.length)}.</div>`);
    });
  });
})();
