/* Capítulo 20 — Especulación, trading y apalancamiento */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, I = L.inv, S = L.stat;

  /* Histograma simple en escala de capital final */
  const histo = (vals, lo, hi, nb) => { const w = (hi - lo) / nb, b = new Array(nb).fill(0); vals.forEach((v) => { b[Math.max(0, Math.min(nb - 1, Math.floor((v - lo) / w)))]++; }); return { b, w }; };

  /* 20.1 Cuentas de trading */
  CC.defineSim('trader', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1.1, label: 'Trayectorias de cuarenta cuentas' }), chh = sim.canvas({ aspect: 1.1, label: 'Distribución del capital final de dos mil cuentas' });
    sim.group('Estrategia');
    sim.slider('p', { label: 'Probabilidad de acierto', min: 0.3, max: 0.7, step: 0.01, value: 0.5, fmt: (v) => CC.pct(v, 0) });
    sim.slider('b', { label: 'Beneficio por acierto (en R)', min: 0.5, max: 3, step: 0.05, value: 1, fmt: (v) => CC.nf(v, 2) + ' R' });
    sim.slider('c', { label: 'Costo por operación (en R)', min: 0, max: 0.3, step: 0.01, value: 0.08, fmt: (v) => CC.nf(v, 2) + ' R' });
    sim.group('Gestión');
    sim.slider('q', { label: 'Riesgo por operación (% del capital)', min: 0.005, max: 0.1, step: 0.005, value: 0.02, fmt: (v) => CC.pct(v, 1) });
    sim.slider('k', { label: 'Operaciones por año', min: 10, max: 1000, step: 10, value: 200, fmt: (v) => CC.nf(v) });
    sim.slider('Y', { label: 'Años', min: 1, max: 5, step: 1, value: 2, fmt: (v) => CC.nf(v) });
    sim.out('E', 'Expectativa por operación', { hl: true });
    sim.out('lose', 'Cuentas que terminan perdiendo', { hl: true });
    sim.out('med', 'Capital final mediano (de 1)');
    sim.out('blown', 'Cuentas quemadas');
    sim.out('top', 'El 10 % de mejores termina con más de');
    sim.onDraw(() => {
      const r = I.traders({ N: 2000, k: sim.p.k, Y: sim.p.Y, p: sim.p.p, R: sim.p.b, q: sim.p.q, c: sim.p.c, seed: 11 });
      CC.draw.clear(cp);
      const mx = Math.max(2, ...r.muestra.flat()) * 1.05;
      const p1 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: Math.max(...r.muestra.map((t) => t.length)) - 1, ymin: 0, ymax: mx, xticks: [], xlabel: 'tiempo →', title: 'capital de 40 cuentas (inicio = 1)', yfmt: (v) => CC.nf(v, 1) });
      p1.frame();
      p1.hline(1, { color: '--ink-3', dash: [4, 3] });
      r.muestra.forEach((tr) => p1.xy(tr.map((_, i) => i), tr, { color: tr[tr.length - 1] >= 1 ? '--gain' : '--loss', width: 1.2, alpha: 0.6 }));
      CC.draw.clear(chh);
      const hi = Math.max(2, S.quantile(r.fin, 0.99)), H = histo(r.fin, 0, hi, 40);
      const p2 = new CC.Plot(chh.ctx, { x: 0, y: 0, w: chh.w, h: chh.h, xmin: 0, xmax: hi, ymin: 0, ymax: Math.max(...H.b) * 1.15, xlabel: 'capital final (inicio = 1)', title: '2.000 cuentas', yfmt: (v) => CC.nf(v), xfmt: (v) => CC.nf(v, 1) });
      p2.frame();
      p2.bars(H.b.map((_, i) => (i + 0.5) * H.w), H.b, { colors: H.b.map((_, i) => ((i + 0.5) * H.w >= 1 ? '--gain' : '--loss')), w: H.w * 0.92 });
      p2.vline(1, { color: '--ink', label: 'capital inicial', dash: [] });
      sim.set('E', `<span class="${r.expectativaR > 0 ? 'gain' : 'loss'}">${CC.nf(r.expectativaR, 3)} R</span>`);
      sim.set('lose', CC.pct(r.fin.filter((v) => v < 1).length / r.fin.length, 1));
      sim.set('med', CC.nf(S.quantile(r.fin, 0.5), 2));
      sim.set('blown', CC.pct(r.fin.filter((v) => v === 0).length / r.fin.length, 1));
      sim.set('top', CC.nf(S.quantile(r.fin, 0.9), 2));
    });
  });

  /* 20.2 Apalancamiento */
  CC.defineSim('apalancamiento', function (sim) {
    sim.cols2();
    const cpaths = sim.canvas({ aspect: 1.1, label: 'Capital de treinta cuentas apalancadas' }), cl = sim.canvas({ aspect: 1.1, label: 'Probabilidad de liquidación según el apalancamiento' });
    sim.group('Subyacente');
    sim.slider('s', { label: 'Volatilidad anual', min: 0.05, max: 0.9, step: 0.01, value: 0.16, fmt: (v) => CC.pct(v, 0) });
    sim.slider('mu', { label: 'Tendencia anual', min: -0.2, max: 0.3, step: 0.01, value: 0.05, fmt: (v) => CC.pct(v, 0) });
    sim.group('Posición');
    sim.slider('x', { label: 'Apalancamiento', min: 1, max: 50, step: 1, value: 10, fmt: (v) => CC.nf(v) + '×' });
    sim.slider('m', { label: 'Liquidación si el capital cae a', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => CC.pct(v, 0) + ' del inicial' });
    sim.slider('a', { label: 'Horizonte (años)', min: 0.25, max: 3, step: 0.25, value: 1, fmt: (v) => CC.nf(v, 2) });
    sim.slider('cd', { label: 'Costo de financiación diario', min: 0, max: 0.0005, step: 0.00005, value: 0.0002, fmt: (v) => CC.pct(v, 3) });
    sim.out('pl', 'Cuentas liquidadas', { hl: true });
    sim.out('md', 'Capital final mediano');
    let curve = [];
    const o = (x, N) => ({ N, anos: sim.p.a, sigma: sim.p.s, mu: sim.p.mu, x, m: sim.p.m, costoDiario: sim.p.cd, seed: 5 });
    const compute = () => { curve = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50].map((x) => [x, I.leverage(o(x, 500)).pLiq]); };
    compute();
    sim.onChange = (id) => { if (id !== 'x') compute(); };
    sim.onDraw(() => {
      const r = I.leverage(o(sim.p.x, 1500));
      CC.draw.clear(cpaths);
      const mx = Math.max(2, ...r.muestra.flat()) * 1.05;
      const p1 = new CC.Plot(cpaths.ctx, { x: 0, y: 0, w: cpaths.w, h: cpaths.h, xmin: 0, xmax: Math.round(252 * sim.p.a / 5), ymin: 0, ymax: mx, xticks: [], xlabel: 'semanas →', title: `30 cuentas con ${sim.p.x}× (inicio = 1)`, yfmt: (v) => CC.nf(v, 1) });
      p1.frame();
      p1.hline(sim.p.m, { color: '--loss', label: 'liquidación', dash: [4, 3] });
      r.muestra.forEach((tr) => p1.xy(tr.map((_, i) => i), tr, { color: tr[tr.length - 1] <= sim.p.m + 1e-9 ? '--loss' : '--c1', width: 1.2, alpha: 0.65 }));
      CC.draw.clear(cl);
      const p2 = new CC.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 1, xmax: 50, xlog: true, ymin: 0, ymax: 1, xlabel: 'apalancamiento (escala logarítmica)', title: 'probabilidad de liquidación', yfmt: CC.pctAxis, xfmt: (v) => CC.nf(v) + '×' });
      p2.frame();
      p2.path(curve, { color: '--c2', width: 2.6 });
      p2.dot(sim.p.x, r.pLiq, { color: '--accent', label: CC.pct(r.pLiq, 0) });
      sim.set('pl', CC.pct(r.pLiq, 1));
      sim.set('md', CC.nf(S.quantile(r.fin, 0.5), 2));
    });
  });

  /* 20.3 Kelly */
  CC.defineSim('kelly', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Crecimiento logarítmico esperado según la fracción apostada' });
    sim.group('Juego');
    sim.slider('p', { label: 'Probabilidad de ganar', min: 0.3, max: 0.8, step: 0.01, value: 0.55, fmt: (v) => CC.pct(v, 0) });
    sim.slider('b', { label: 'Pago por unidad arriesgada', min: 0.5, max: 4, step: 0.05, value: 1.5, fmt: (v) => CC.nf(v, 2) + ' a 1' });
    sim.slider('f', { label: 'Fracción arriesgada', min: 0, max: 0.9, step: 0.01, value: 0.25, fmt: (v) => CC.pct(v, 0) });
    sim.out('fs', 'Fracción de Kelly f*', { hl: true });
    sim.out('g', 'Crecimiento por apuesta con su fracción');
    sim.out('gs', 'Crecimiento con f* / con f*/2');
    sim.out('x', 'Tras 100 apuestas, capital típico');
    sim.onDraw(() => {
      const { p, b, f } = sim.p, fs = I.kellyOpt(p, b);
      CC.draw.clear(cv);
      const G = (x) => I.kellyGrowth(x, p, b);
      const gmax = Math.max(0.01, fs > 0 ? G(fs) : 0.01);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.9, ymin: -gmax * 2.5, ymax: gmax * 1.4, xlabel: 'fracción del capital arriesgada en cada apuesta', ylabel: 'crecimiento logarítmico por apuesta', xfmt: CC.pctAxis, yfmt: (v) => CC.nf(v, 3), ml: 78 });
      pl.frame();
      pl.fn(G, { color: '--c1', width: 2.6, to: 0.89 });
      if (fs > 0) { pl.vline(fs, { color: '--gold', label: 'Kelly', dash: [] }); pl.vline(fs / 2, { color: '--c3', label: 'medio Kelly', labelY: 30 }); pl.vline(Math.min(0.89, 2 * fs), { color: '--c2', label: '2 × Kelly', labelY: 46 }); }
      pl.dot(f, G(f), { color: '--accent', r: 6 });
      sim.set('fs', fs > 0 ? CC.pct(fs, 1) : '0 (no hay ventaja: no apostar)');
      sim.set('g', CC.nf(G(f), 4));
      sim.set('gs', fs > 0 ? `${CC.nf(G(fs), 4)} / ${CC.nf(G(fs / 2), 4)}` : '—');
      sim.set('x', CC.nf(Math.exp(100 * G(f)), 2) + ' veces');
    });
  });
})();
