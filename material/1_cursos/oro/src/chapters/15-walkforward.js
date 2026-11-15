/* Capítulo 15 — Walk-forward */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, Y = () => ML.L.synth, B = () => ML.L.lab, St = () => ML.L.stats;
  const G = []; [0.5, 0.8, 1.2].forEach((a) => [1.0, 1.4, 2.0, 3.0].forEach((b) => G.push([a, b])));
  const VAR = { ema: { modo: 'ema', maxdist: 12, rechazo: false }, tocar: {} };
  const LIBRE = { slmin: 0, slmax: 999, tpmin: 0, tpmax: 999 };
  const gp = (v, g) => E().params(Object.assign({}, VAR[v], LIBRE, { slk: g[0], tpk: g[1] }));
  const lb = (S, d0, d1) => { let a = 0, b = S.n; const days = (i) => S.t[i] / 1440; let lo = 0, hi = S.n; while (lo < hi) { const m = (lo + hi) >> 1; if (days(m) < d0) lo = m + 1; else hi = m; } a = lo; lo = 0; hi = S.n; while (lo < hi) { const m = (lo + hi) >> 1; if (days(m) < d1) lo = m + 1; else hi = m; } b = lo; return [a, b]; };
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  /* Ejecuta un walk-forward sobre S con contexto ctx; devuelve tramos y R agregados */
  function walk(S, ctx, variant, train, test, minN, fixedG) {
    const d0 = Math.floor(S.t[0] / 1440), d1 = Math.floor(S.t[S.n - 1] / 1440);
    const folds = []; const oos = [], fixed = [];
    for (let ini = d0; ini + train + test <= d1; ini += test) {
      const [a, b] = lb(S, ini, ini + train), [c, d] = lb(S, ini + train, ini + train + test);
      if (b - a < 500 || d - c < 100) continue;
      const tr = E().slice(S, a, b), te = E().slice(S, c, d);
      const Xt = E().prep(tr, ctx || S), Xe = E().prep(te, ctx || S);
      let best = -1, bm = -9, bn = 0;
      G.forEach((g, k) => { const P = gp(variant, g), t = E().run(tr, Xt, P), m = t.length >= minN ? mean(t.map((x) => x.R)) : -9; if (m > bm) { bm = m; best = k; bn = t.length; } });
      if (best < 0) continue;
      const tOut = E().run(te, Xe, gp(variant, G[best])), tFix = E().run(te, Xe, gp(variant, fixedG));
      folds.push({ date: E().dateStr(te.t[0] ), g: G[best], is: bm, isn: bn, oos: mean(tOut.map((x) => x.R)), on: tOut.length, fix: mean(tFix.map((x) => x.R)), fn: tFix.length });
      tOut.forEach((x) => oos.push(x.R)); tFix.forEach((x) => fixed.push(x.R));
    }
    return { folds, oos, fixed };
  }
  const ci = (a) => { const m = mean(a), se = St().sd(a) / Math.sqrt(a.length); return ML.R(m, 3) + ' [' + ML.fix(m - 1.96 * se, 2) + ', ' + ML.fix(m + 1.96 * se, 2) + '] n=' + a.length; };

  ML.defineSim('walkforward', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Ventanas');
    sim.slider('train', { label: 'Entrenamiento (días)', min: 60, max: 300, step: 10, value: 180, fmt: (v) => ML.fix(v, 0) });
    sim.slider('test', { label: 'Prueba y avance (días)', min: 30, max: 120, step: 10, value: 60, fmt: (v) => ML.fix(v, 0) });
    sim.slider('minN', { label: 'Mínimo de operaciones para elegir', min: 5, max: 60, step: 5, value: 10, fmt: (v) => ML.fix(v, 0) });
    sim.seg('v', { label: 'Regla de entrada', options: [['ema', 'EMA sin rechazo'], ['tocar', 'Manual (tocar)']], value: 'ema' });
    sim.out('is', 'R de los ganadores en entrenamiento', { hl: true });
    sim.out('oos', 'Fuera de muestra, re-optimizando', { wide: true });
    sim.out('fix', 'Fuera de muestra, parámetros fijos del manual', { wide: true });
    let D = null;
    sim.withData(['m5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, S = D.m5;
      const w = walk(S, S, p.v, Math.round(p.train), Math.round(p.test), Math.round(p.minN), [0.8, 1.4]);
      if (!w.folds.length) { ML.text(cv.ctx, 'Ventanas demasiado largas para los datos', cv.w / 2, cv.h / 2, { size: 13, color: '--ink-3', align: 'center' }); return; }
      const nf = w.folds.length;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: nf + 0.6, ymin: -0.5, ymax: 0.7, ml: 54, mb: 52, ylabel: 'R medio del tramo', xticks: w.folds.map((_, i) => i + 1), xfmt: (v) => (w.folds[v - 1] ? w.folds[v - 1].date.slice(2, 7) : '') });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      ML.draw.bars(pl, w.folds.map((_, i) => i + 1 - 0.2), w.folds.map((f) => Math.max(-0.5, Math.min(0.7, f.is))), 0.34, { color: '--accent', alpha: 0.35 });
      ML.draw.bars(pl, w.folds.map((_, i) => i + 1 + 0.2), w.folds.map((f) => f.oos || 0), 0.34, { colors: w.folds.map((f) => (f.oos >= 0 ? '--c3' : '--c2')), alpha: 0.9 });
      pl.legend([{ label: 'ganador en entrenamiento', color: '--accent', kind: 'sq' }, { label: 'ese ganador en la prueba', color: '--c3', kind: 'sq' }], 'tr');
      sim.set('is', ML.R(mean(w.folds.map((f) => f.is)), 3));
      sim.set('oos', ci(w.oos));
      sim.set('fix', ci(w.fixed));
    });
  });

  ML.defineSim('wf-azar', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, maxH: '420px' });
    sim.group('Experimento');
    sim.slider('nw', { label: 'Mundos', min: 10, max: 50, step: 5, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.button('Ejecutar', () => { run(); }, { primary: true });
    sim.out('st', 'Estado', { wide: true });
    sim.out('is', 'R de los ganadores en entrenamiento', { hl: true });
    sim.out('oos', 'R de esos ganadores en la prueba');
    let pts = null, busy = false;
    async function run() {
      if (busy) return; busy = true; pts = [];
      const nw = Math.round(sim.p.nw);
      for (let w = 0; w < nw; w++) {
        sim.set('st', 'Mundo ' + (w + 1) + ' de ' + nw + '…');
        await new Promise((r) => setTimeout(r, 5));
        const S = Y().gen({ seed: 2000 + w, days: 150 }), r = walk(S, S, 'ema', 80, 35, 8, [0.8, 1.4]);
        if (r.folds.length) pts.push({ a: mean(r.folds.map((f) => f.is)), b: mean(r.oos) });
        if (w % 4 === 3) sim.redraw();
      }
      busy = false; sim.set('st', 'Listo'); sim.redraw();
    }
    sim.set('st', 'Pulse «Ejecutar» (unos 5–10 s)');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.1, xmax: 0.6, ymin: -0.5, ymax: 0.4, ml: 56, mb: 46, xlabel: 'R de los ganadores en entrenamiento', ylabel: 'R de esos ganadores en la prueba' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      pl.xy([-0.1, 0.4], [-0.1, 0.4], { color: '--ink-3', width: 1.2, dash: [5, 4] });
      if (!pts) return;
      pts.forEach((q) => pl.dot(q.a, q.b, { r: 4.5, color: q.b > 0 ? '--c3' : '--c2' }));
      sim.set('is', ML.R(mean(pts.map((q) => q.a)), 3));
      sim.set('oos', ML.R(mean(pts.map((q) => q.b)), 3));
    });
  });
})();
