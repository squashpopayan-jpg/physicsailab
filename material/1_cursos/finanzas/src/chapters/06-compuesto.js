/* Capítulo 6 — Interés compuesto */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;

  /* 6.1 Simple frente a compuesto */
  CC.defineSim('simple-compuesto', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Crecimiento con interés simple y compuesto' });
    sim.group('Inversión');
    sim.slider('P', { label: 'Capital inicial', min: 1000000, max: 100000000, step: 1000000, value: 10000000, fmt: CC.copS });
    sim.slider('i', { label: 'Tasa efectiva anual', min: 0.01, max: 0.3, step: 0.005, value: 0.1, fmt: (v) => CC.pct(v) });
    sim.slider('n', { label: 'Años', min: 1, max: 40, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.out('s', 'Con interés simple');
    sim.out('c', 'Con interés compuesto', { hl: true });
    sim.out('ii', 'Intereses sobre intereses');
    sim.out('x', 'El capital se multiplicó por');
    sim.onDraw(() => {
      const { P, i, n } = sim.p;
      const xs = L.util.linspace(0, n, 200);
      const sim_ = xs.map((t) => T.simple(P, i, t)), com = xs.map((t) => T.compound(P, i, t));
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax: com[199] * 1.06, xlabel: 'años', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.between(xs, xs.map(() => 0), xs.map(() => P), { color: '--c6', alpha: 0.18 });
      pl.between(xs, xs.map(() => P), sim_, { color: '--c1', alpha: 0.2 });
      pl.between(xs, sim_, com, { color: '--gold', alpha: 0.35 });
      pl.xy(xs, sim_, { color: '--c1', width: 2.2 });
      pl.xy(xs, com, { color: '--gold', width: 2.6 });
      pl.legend([{ label: 'capital', color: '--c6', kind: 'sq' }, { label: 'intereses simples', color: '--c1', kind: 'sq' }, { label: 'intereses sobre intereses', color: '--gold', kind: 'sq' }], 'tl');
      const S = T.simple(P, i, n), Cc = T.compound(P, i, n);
      sim.set('s', CC.copS(S));
      sim.set('c', CC.copS(Cc));
      sim.set('ii', CC.copS(Cc - S));
      sim.set('x', CC.nf(Cc / P, 2) + ' veces');
    });
  });

  /* 6.2 Regla del 72 */
  CC.defineSim('regla72', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Tiempo de duplicación exacto y aproximado' });
    sim.group('Tasa');
    sim.slider('i', { label: 'Tasa por periodo', min: 0.005, max: 0.3, step: 0.0025, value: 0.08, fmt: (v) => CC.pct(v, 2) });
    sim.out('ex', 'Duplicación exacta ln 2 / ln(1+i)', { hl: true });
    sim.out('r72', 'Regla del 72');
    sim.out('r70', 'Regla del 70');
    sim.out('e', 'Error de la regla del 72');
    sim.onDraw(() => {
      const i = sim.p.i;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.005, xmax: 0.3, ymin: 2, ymax: 150, ylog: true, xlabel: 'tasa por periodo', ylabel: 'periodos para duplicar', xfmt: CC.pctAxis });
      pl.frame();
      pl.fn((x) => T.doubling(x), { color: '--ink', width: 2.6, from: 0.005 });
      pl.fn((x) => T.rule72(x), { color: '--c2', width: 2, dash: [6, 4], from: 0.005 });
      pl.fn((x) => T.rule70(x), { color: '--c1', width: 2, dash: [2, 3], from: 0.005 });
      pl.vline(i, { color: '--accent', dash: [] });
      pl.dot(i, T.doubling(i), { color: '--ink', label: CC.nf(T.doubling(i), 2) });
      pl.legend([{ label: 'exacta', color: '--ink' }, { label: 'regla del 72', color: '--c2', dash: [6, 4] }, { label: 'regla del 70', color: '--c1', dash: [2, 3] }], 'tr');
      const ex = T.doubling(i);
      sim.set('ex', CC.nf(ex, 2) + ' periodos');
      sim.set('r72', CC.nf(T.rule72(i), 2));
      sim.set('r70', CC.nf(T.rule70(i), 2));
      sim.set('e', CC.pct((T.rule72(i) - ex) / ex));
    });
  });

  /* 6.3 Ana y Beto */
  CC.defineSim('ana-beto', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Saldo de Ana y de Beto por edad' });
    sim.group('Supuestos');
    sim.slider('A', { label: 'Ahorro mensual', min: 100000, max: 2000000, step: 50000, value: 300000, fmt: CC.cop });
    sim.slider('r', { label: 'Rentabilidad real anual', min: 0, max: 0.12, step: 0.0025, value: 0.06, fmt: (v) => CC.pct(v, 2) });
    sim.group('Edades');
    sim.slider('a0', { label: 'Ana empieza a los', min: 18, max: 40, step: 1, value: 25, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('an', { label: 'Ana ahorra durante', min: 1, max: 20, step: 1, value: 10, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('b0', { label: 'Beto empieza a los', min: 20, max: 55, step: 1, value: 35, fmt: (v) => CC.nf(v) + ' años' });
    sim.out('ap', 'Aportes: Ana / Beto');
    sim.out('fa', 'Ana a los 65', { hl: true });
    sim.out('fb', 'Beto a los 65', { hl: true });
    sim.out('cr', 'Tasa desde la que Ana gana');
    const run = (r, a0, an, b0, A) => {
      const im = T.eaToPeriodic(r, 12), ana = [], beto = [];
      let wa = 0, wb = 0;
      for (let m = 0; m <= (65 - 18) * 12; m++) {
        const edad = 18 + m / 12;
        if (m > 0) {
          wa = wa * (1 + im) + (edad > a0 && edad <= a0 + an ? A : 0);
          wb = wb * (1 + im) + (edad > b0 && edad <= 65 ? A : 0);
        }
        if (m % 3 === 0) { ana.push([edad, wa]); beto.push([edad, wb]); }
      }
      return { ana, beto, fa: wa, fb: wb };
    };
    sim.onDraw(() => {
      const { A, r, a0, an, b0 } = sim.p;
      const R = run(r, a0, an, b0, A);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 18, xmax: 65, ymin: 0, ymax: Math.max(R.fa, R.fb, 1) * 1.1, xlabel: 'edad', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.band(a0, a0 + an, { color: '--c4', alpha: 0.1 });
      pl.band(b0, 65, { color: '--c1', alpha: 0.06 });
      pl.path(R.ana, { color: '--c4', width: 2.6 });
      pl.path(R.beto, { color: '--c1', width: 2.6 });
      pl.legend([{ label: `Ana: ahorra de ${a0} a ${a0 + an}`, color: '--c4' }, { label: `Beto: ahorra de ${b0} a 65`, color: '--c1' }], 'tl');
      sim.set('ap', `${CC.copS(A * 12 * an)} / ${CC.copS(A * 12 * Math.max(0, 65 - b0))}`);
      sim.set('fa', CC.copS(R.fa));
      sim.set('fb', CC.copS(R.fb));
      const g = (x) => { const q = run(x, a0, an, b0, A); return q.fa - q.fb; };
      let cr = NaN;
      if (g(0.0001) < 0 && g(0.3) > 0) cr = L.util.bisect(g, 0.0001, 0.3, 1e-6);
      sim.set('cr', isFinite(cr) ? CC.pct(cr, 2) + ' real anual' : g(0.0001) >= 0 ? 'cualquiera' : 'ninguna razonable');
    });
  });
})();
