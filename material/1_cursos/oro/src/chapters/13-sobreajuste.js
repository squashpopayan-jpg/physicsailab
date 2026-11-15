/* Capítulo 13 — Sobreajuste */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, Y = () => ML.L.synth, B = () => ML.L.lab, St = () => ML.L.stats;
  const SLK = [0.5, 0.8, 1.2, 1.6, 2.0], TPK = [0.8, 1.4, 2.0, 3.0, 4.0], W1 = [15, 30, 60];
  const GRID = []; SLK.forEach((a) => TPK.forEach((b) => W1.forEach((c) => GRID.push([a, b, c]))));
  const KW = { modo: 'ema', maxdist: 12, rechazo: false, slmin: 0, slmax: 999, tpmin: 0, tpmax: 999 };
  ML.GRID75 = GRID;
  /* R medio de cada combinación (NaN si hay menos de minN operaciones) */
  ML.evalGrid = function (S, X, minN) {
    return GRID.map(([a, b, c]) => { const P = E().params(Object.assign({}, KW, { slk: a, tpk: b, w1m: c })), tr = E().run(S, X, P); if (tr.length < (minN || 8)) return NaN; let s = 0; for (const t of tr) s += t.R; return s / tr.length; });
  };

  /* ======================================================================
     13.1 Optimizar sobre ruido
     ====================================================================== */
  ML.defineSim('optimizador', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, maxH: '420px' });
    sim.group('Experimento');
    sim.slider('np', { label: 'Parejas de mundos', min: 10, max: 60, step: 5, value: 30, fmt: (v) => ML.fix(v, 0) });
    sim.button('Ejecutar', () => { run(); }, { primary: true });
    sim.out('st', 'Estado', { wide: true });
    sim.out('is', 'R del mejor ajuste dentro de muestra', { hl: true });
    sim.out('os', 'R de ese ajuste fuera de muestra');
    sim.out('all', 'R medio de las 75 combinaciones fuera de muestra');
    sim.out('pos', 'Positivo dentro · fuera de muestra');
    let pts = null, busy = false;
    async function run() {
      if (busy) return;
      busy = true; pts = [];
      const np = Math.round(sim.p.np);
      for (let s = 0; s < np; s++) {
        sim.set('st', 'Calculando pareja ' + (s + 1) + ' de ' + np + '…');
        await new Promise((r) => setTimeout(r, 5));
        const A = Y().gen({ seed: 300 + s, days: 60 }), Bw = Y().gen({ seed: 900 + s, days: 60 });
        const ga = ML.evalGrid(A, E().prep(A)), gb = ML.evalGrid(Bw, E().prep(Bw));
        let k = -1, best = -9;
        ga.forEach((v, i) => { if (v === v && v > best) { best = v; k = i; } });
        const meanB = St().mean(gb.filter((v) => v === v));
        pts.push({ a: ga[k], b: gb[k], all: meanB });
        if (s % 3 === 2) sim.redraw();
      }
      busy = false;
      sim.set('st', 'Listo: ' + np + ' parejas × 75 combinaciones × 2 mundos');
      sim.redraw();
    }
    sim.set('st', 'Pulse «Ejecutar» (unos 5–10 s)');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.3, xmax: 0.7, ymin: -0.7, ymax: 0.5, ml: 56, mb: 46, xlabel: 'R del mejor ajuste en el mundo 1 (dentro de muestra)', ylabel: 'R de ese ajuste en el mundo 2' });
      pl.frame();
      pl.xy([-0.3, 0.5], [-0.3, 0.5], { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.label(0.3, 0.37, 'se mantendría', { color: '--ink-3' });
      if (!pts || !pts.length) return;
      pts.forEach((q) => { if (q.a === q.a && q.b === q.b) pl.dot(q.a, q.b, { r: 4.2, color: q.b > 0 ? '--c3' : '--c2' }); });
      const ok = pts.filter((q) => q.a === q.a && q.b === q.b);
      sim.set('is', ML.R(St().mean(ok.map((q) => q.a)), 3));
      sim.set('os', ML.R(St().mean(ok.map((q) => q.b)), 3));
      sim.set('all', ML.R(St().mean(pts.map((q) => q.all)), 3));
      sim.set('pos', ok.filter((q) => q.a > 0).length + ' · ' + ok.filter((q) => q.b > 0).length + ' de ' + ok.length);
    });
  });

  /* ======================================================================
     13.2 Mitades del oro real
     ====================================================================== */
  ML.defineSim('real-mitades', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, maxH: '420px' });
    sim.out('cor', 'Correlación entre mitades', { hl: true });
    sim.out('pos', 'Combinaciones > 0: 1.ª mitad · 2.ª mitad');
    sim.out('best', 'Mejor de la 1.ª mitad → en la 2.ª', { wide: true });
    sim.out('avg', 'R medio de todas: 1.ª · 2.ª mitad');
    let res = null;
    sim.withData(['m5'], (D) => {
      const S = D.m5, [A, Bh] = B().halves(S);
      const ga = ML.evalGrid(A, E().prep(A, S)), gb = ML.evalGrid(Bh, E().prep(Bh, S));
      res = { ga, gb }; sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.15, xmax: 0.4, ymin: -0.35, ymax: 0.3, ml: 56, mb: 46, xlabel: 'R medio en la 1.ª mitad (8.5 meses)', ylabel: 'R medio en la 2.ª mitad' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [4, 3] }); pl.vline(0, { color: '--ink-3', dash: [4, 3] });
      if (!res) return;
      const ok = res.ga.map((a, i) => [a, res.gb[i], i]).filter((q) => q[0] === q[0] && q[1] === q[1]);
      ok.forEach((q) => pl.dot(q[0], q[1], { r: 3.8, color: '--ink-3' }));
      const bi = ok.reduce((m, q) => (q[0] > m[0] ? q : m), ok[0]);
      pl.dot(bi[0], bi[1], { r: 8, color: '--c4', label: 'mejor de la 1.ª mitad', dx: 10 });
      sim.set('cor', ML.fix(St().corr(ok.map((q) => q[0]), ok.map((q) => q[1])), 2));
      sim.set('pos', ok.filter((q) => q[0] > 0).length + ' · ' + ok.filter((q) => q[1] > 0).length + ' de ' + ok.length);
      sim.set('best', ML.R(bi[0], 3) + ' → ' + ML.R(bi[1], 3) + ' <small>(stop ' + ML.GRID75[bi[2]][0] + ' ATR, TP ' + ML.GRID75[bi[2]][1] + ' ATR, ventana ' + ML.GRID75[bi[2]][2] + ' min)</small>');
      sim.set('avg', ML.R(St().mean(ok.map((q) => q[0])), 3) + ' · ' + ML.R(St().mean(ok.map((q) => q[1])), 3));
    });
  });

  /* ======================================================================
     13.3 Máximo de K pruebas
     ====================================================================== */
  ML.defineSim('cuantos-intentos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '380px' });
    sim.group('Pruebas');
    sim.slider('K', { label: 'Variantes probadas K', min: 1, max: 500, step: 1, value: 20, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.slider('t', { label: 'Su mejor t observado', min: 1, max: 4, step: 0.05, value: 2.4, fmt: (v) => ML.fix(v, 2) });
    sim.out('ex', 'Mejor t esperado en puro ruido', { hl: true });
    sim.out('fp', 'P(al menos un |t| > 1.96)');
    sim.out('pv', 'P(alguna prueba ≥ su t en puro ruido)');
    sim.out('bon', 'Umbral de Bonferroni');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, K = Math.max(1, Math.round(p.K));
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 500, xlog: true, ymin: 0, ymax: 4.5, ml: 50, mb: 44, xlabel: 'Variantes probadas K', ylabel: 'Mejor |t| esperado en ruido' });
      pl.frame();
      pl.fn((k) => St().normInv(1 - 0.5 / (k + 0.5) / 1) , { color: '--c2', width: 2.6, from: 1, to: 500 });
      pl.fn((k) => St().normInv(1 - 0.025 / Math.max(k, 1)), { color: '--ink-3', width: 1.6, dash: [5, 4], from: 1, to: 500 });
      pl.hline(p.t, { color: '--accent', width: 2, label: 'su t = ' + ML.fix(p.t, 2) });
      pl.vline(K, { color: '--ink-2', dash: [3, 3] });
      pl.legend([{ label: 'máximo esperado (azar)', color: '--c2' }, { label: 'umbral de Bonferroni', color: '--ink-3', dash: [5, 4] }, { label: 'su t', color: '--accent' }], 'br');
      const pOne = 2 * St().normSf(p.t);
      sim.set('ex', ML.fix(St().normInv(1 - 0.5 / (K + 0.5)), 2));
      sim.set('fp', ML.pct(1 - Math.pow(1 - 0.05, K), 0));
      sim.set('pv', ML.pct(1 - Math.pow(1 - pOne, K), 1) + ' <small>(una sola prueba: ' + ML.pct(pOne, 1) + ')</small>');
      sim.set('bon', '|t| > ' + ML.fix(St().normInv(1 - 0.05 / (2 * K)), 2));
    });
  });
})();
