/* Capítulo 24 — Panel integral */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats, Rk = () => ML.L.risk;
  const CAND = { slk: 0.5, slmin: 20, slmax: 80, tpk: 2.5, tpmin: 100, tpmax: 300, sld: false, beratio: 0.2, bemargin: 5, stag: false };
  ML.CAND = CAND;
  const f = (st) => (st.n ? ML.R(st.avgR, 3) + ' ± ' + ML.fix(1.96 * st.seR, 2) + ' (n=' + st.n + ')' : 'sin operaciones');

  ML.defineSim('hoja', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '340px' });
    sim.group('Panel');
    sim.seg('ds', { label: 'Serie', options: [['m1', 'M1 · 3.4 m'], ['m5', 'M5 · 17 m'], ['m15', 'M15 · 4.2 a']], value: 'm5' });
    sim.slider('f', { label: 'Riesgo del reto (% por operación)', min: 0.125, max: 2, step: 0.125, value: 0.5, fmt: (v) => ML.fix(v, 3) + ' %' });
    sim.outSep('Manual v1.3');
    sim.out('m1', 'Resultado', { wide: true, hl: true });
    sim.out('m2', 'Frente al azar · mitades', { wide: true });
    sim.out('m3', 'Pesimista · estrés de costos', { wide: true });
    sim.outSep('Candidata v1.4');
    sim.out('c1', 'Resultado', { wide: true, hl: true });
    sim.out('c2', 'Frente al azar · mitades', { wide: true });
    sim.out('c3', 'Pesimista · estrés de costos', { wide: true });
    sim.out('c4', 'Salidas', { wide: true });
    sim.outSep('Probabilidad de aprobar un reto con la candidata (ritmo de señales de la serie, 365 días)');
    sim.out('r1', 'Si la ventaja fuera el límite inferior', { wide: true });
    sim.out('r2', 'Si fuera la estimación puntual', { wide: true });
    sim.out('r3', 'Si fuera el límite superior', { wide: true });
    let D = null;
    sim.withData(['m1', 'm5', 'm15'], (d) => { D = d; sim.redraw(); });
    const cache = {};
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, ds = p.ds, { S, ctx, X } = B().get(D, ds);
      if (!cache[ds]) {
        const calc = (over) => {
          const P = B().paramsFor(ds, over), tr = E().run(S, X, P), st = E().stats(tr, P);
          const nu = B().nullRuns(S, X, P, 60, 24), beat = nu.length ? nu.filter((v) => v < st.avgR).length / nu.length : NaN;
          const [A, Bh] = B().halves(S), XA = E().prep(A, ctx || S), XB = E().prep(Bh, ctx || S);
          const sa = E().stats(E().run(A, XA, P), P), sb = E().stats(E().run(Bh, XB, P), P);
          const pe = E().stats(E().run(S, X, B().paramsFor(ds, Object.assign({}, over, { pess: true }))), P);
          const co = E().stats(E().run(S, X, B().paramsFor(ds, Object.assign({}, over, { comm: 7, slip: 1 }))), P);
          return { P, tr, st, nu: St().mean(nu), beat, sa, sb, pe, co };
        };
        cache[ds] = { man: calc({}), can: calc(CAND) };
      }
      const { man, can } = cache[ds];
      const eqm = B().equity(man.tr, man.P), eqc = B().equity(can.tr, can.P);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(eqm.xs.length, eqc.xs.length, 5) - 1, ymin: Math.min(0, ...eqm.yR, ...eqc.yR) - 1, ymax: Math.max(1, ...eqm.yR, ...eqc.yR) + 1, ml: 50, mb: 40, xlabel: 'Operaciones', ylabel: 'R acumulados' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      pl.xy(eqm.xs, eqm.yR, { color: '--ink-3', width: 2.2 }); pl.xy(eqc.xs, eqc.yR, { color: '--accent', width: 2.6 });
      pl.legend([{ label: 'manual v1.3', color: '--ink-3' }, { label: 'candidata v1.4', color: '--accent' }], 'tl');
      const set = (pre, o) => {
        sim.set(pre + '1', f(o.st) + ' · acierto ' + ML.pct(o.st.winPct, 0) + ' · ' + ML.usdS(o.st.usd));
        sim.set(pre + '2', 'azar ' + ML.R(o.nu, 3) + ' (supera al ' + ML.pct(o.beat, 0) + ') · 1.ª mitad ' + ML.R(o.sa.avgR, 2) + ' (' + o.sa.n + ') · 2.ª ' + ML.R(o.sb.avgR, 2) + ' (' + o.sb.n + ')');
        sim.set(pre + '3', ML.R(o.pe.avgR, 3) + ' · ' + ML.R(o.co.avgR, 3));
      };
      set('m', man); set('c', can);
      sim.set('c4', Object.keys(can.st.reasons).map((k) => k + ' ' + can.st.reasons[k]).join(' · '));
      /* reto con la candidata: forma de R de sus propias operaciones */
      const R = can.tr.map((t) => t.R), m = St().mean(R), shape = { R: R.map((v) => v - m), tp: can.tr.map((t) => t.reason === 'TP') };
      const lo = m - 1.96 * can.st.seR, hi = m + 1.96 * can.st.seR;
      const run = (e) => { if (shape.R.length < 5) return null; const rng = St().rng(5); const esc = p.f / 0.125; const smp = () => { const i = rng.int(shape.R.length); return { R: shape.R[i] + e, tp: shape.tp[i] }; }; return Rk().challenge({ sampler: smp, lambda: Math.max(0.05, can.st.n / (((S.t[S.n - 1] - S.t[0]) / 1440) * 5 / 7)), balas: 2, onedone: true, meta: 180 * esc, maxloss: 250 * esc, riskPct: p.f / 100, target: 0.1, maxDays: 365, nsim: 600, seed: 3 }); };
      [['r1', lo], ['r2', m], ['r3', hi]].forEach(([id, e]) => { const r = run(e); sim.set(id, r ? 'ventaja ' + ML.R(e, 2) + ' → aprueba ' + ML.pct(r.pass, 0) + ' · falla ' + ML.pct(r.fail, 0) : '—'); });
    });
  });
})();
