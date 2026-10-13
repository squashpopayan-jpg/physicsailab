/* Capítulo 17 — Bagging y bosques aleatorios */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     17.1 Árboles individuales y su voto
     ====================================================================== */
  ML.defineSim('bosque-votacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    ML.dataControls(sim, { kind: 'moons', n: 200, noise: 0.45, nmax: 400 });
    sim.group('Bosque');
    sim.slider('B', { label: 'Número de árboles B', min: 1, max: 150, step: 1, value: 50, fmt: (v) => ML.fix(v, 0) });
    sim.seg('mf', { label: 'Variables candidatas por división', options: [[2, '2 (bagging)'], [1, '1 (bosque aleatorio)']], value: 1 });
    sim.slider('leaf', { label: 'Mínimo de casos por hoja', min: 1, max: 20, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.out('t1', 'Un árbol: entrenamiento / prueba');
    sim.out('f', 'Bosque: entrenamiento / prueba', { hl: true });
    sim.out('oob', 'Estimación OOB del bosque');
    sim.onDraw(() => {
      const d = ML.makeData(sim), te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(8000 + sim.p.seed));
      const B = Math.round(sim.p.B);
      const f = L.ens.forest(d.X, d.y, { nTrees: B, maxFeatures: sim.p.mf, minLeaf: Math.round(sim.p.leaf), rng: L.rng(5 + sim.p.seed) });
      const t1 = L.tree.fit(d.X, d.y, { minLeaf: Math.round(sim.p.leaf) });
      ML.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, mainW = W * 0.64;
      const mv = new ML.View2D({ w: mainW, h: H, ctx, cv }, { xmin: -2.3, xmax: 2.3, ymin: -2.3, ymax: 2.3 });
      mv.cv = { w: mainW, h: H, ctx };
      ML.probMap(mv, (a, b) => f.proba1([a, b]), { res: 5, alpha: 0.6 });
      ML.contour(mv, (a, b) => f.proba1([a, b])[1] - 0.5, 0, { res: 5, width: 2.2 });
      ML.points(mv, d.X, d.y, { r: 3.2 });
      ML.text(ctx, `promedio de ${B} árbol${B > 1 ? 'es' : ''}`, 10, 18, { size: 12, color: '--ink', halo: true, weight: 650 });
      const tw = (W - mainW - 18) / 2, th = (H - 24) / 3;
      for (let k = 0; k < 6; k++) {
        const tr = f.trees[Math.min(k, f.trees.length - 1)];
        const x0 = mainW + 8 + (k % 2) * (tw + 4), y0 = 6 + Math.floor(k / 2) * (th + 6);
        ctx.save(); ctx.translate(x0, y0);
        const sv = new ML.View2D({ w: tw, h: th }, { xmin: -2.3, xmax: 2.3, ymin: -2.3, ymax: 2.3 });
        sv.cv = { w: tw, h: th, ctx };
        ML.probMap(sv, (a, b) => tr.value1([a, b]), { res: 4, alpha: 0.7, hard: true });
        ctx.strokeStyle = ML.col('--rule-strong'); ctx.strokeRect(0.5, 0.5, tw - 1, th - 1);
        ML.text(ctx, `árbol ${k + 1}`, 5, 13, { size: 10.5, color: '--ink-2', halo: true });
        ctx.restore();
        if (k >= f.trees.length - 1 && B < 6) break;
      }
      sim.set('t1', `${pct(L.met.accuracy(d.y, t1.predict(d.X)))} / ${pct(L.met.accuracy(te.y, t1.predict(te.X)))}`);
      sim.set('f', `${pct(L.met.accuracy(d.y, f.predict(d.X)))} / ${pct(L.met.accuracy(te.y, f.predict(te.X)))}`);
      sim.set('oob', B >= 5 ? pct(f.oob()) : 'necesita al menos 5 árboles');
    });
  });

  /* ======================================================================
     17.2 Curvas de error frente al número de árboles
     ====================================================================== */
  ML.defineSim('bosque-varianza', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Experimento');
    sim.slider('noise', { label: 'Ruido en la etiqueta', min: 0, max: 1, step: 0.05, value: 0.6, fmt: (v) => ML.fix(v, 2) });
    sim.button('Repetir con otra semilla', () => { seed++; restart(); }, { id: 'seed' });
    sim.out('e1', 'Error de un árbol');
    sim.out('eb', 'Bagging con 100 árboles');
    sim.out('er', 'Bosque (1 variable por división) con 100', { hl: true });
    sim.out('oob', 'OOB del bosque con 100');
    let seed = 1, state = null;
    const gen = (n, r) => { const X = [], y = []; for (let i = 0; i < n; i++) { const z = Array.from({ length: 8 }, () => r.gauss()); z[6] = z[0] + 0.25 * r.gauss(); z[7] = z[1] + 0.25 * r.gauss(); X.push(z); y.push(z[0] * z[1] + 0.8 * z[2] * z[2] - 0.8 + 0.6 * z[3] + sim.p.noise * r.gauss() > 0 ? 1 : 0); } return { X, y }; };
    const restart = () => {
      const r = L.rng(300 + seed), tr = gen(300, r), te = gen(1500, L.rng(9));
      state = { tr, te, k: 0, bag: [], rf: [], sumB: te.X.map(() => 0), sumR: te.X.map(() => 0), curveB: [], curveR: [], oob: [] };
      state.single = 1 - L.met.accuracy(te.y, L.tree.fit(tr.X, tr.y, {}).predict(te.X));
      state.oobSum = tr.X.map(() => [0, 0]);
    };
    restart();
    sim.onChange = () => restart();
    sim.animate(() => {
      const s = state;
      if (s.k >= 100) return;
      const r = L.rng(1000 * seed + s.k), n = s.tr.X.length;
      const idx = Array.from({ length: n }, () => r.int(n)), inb = new Uint8Array(n);
      idx.forEach((i) => { inb[i] = 1; });
      const tb = L.tree.fit(s.tr.X, s.tr.y, { idx, maxFeatures: 8, rng: r }), trf = L.tree.fit(s.tr.X, s.tr.y, { idx, maxFeatures: 1, rng: r });
      s.k++;
      s.te.X.forEach((x, i) => { s.sumB[i] += tb.value1(x)[1]; s.sumR[i] += trf.value1(x)[1]; });
      s.tr.X.forEach((x, i) => { if (!inb[i]) { const p = trf.value1(x); s.oobSum[i][0] += p[0]; s.oobSum[i][1] += p[1]; } });
      const err = (sum) => U.range(s.te.y.length).filter((i) => (sum[i] / s.k >= 0.5 ? 1 : 0) !== s.te.y[i]).length / s.te.y.length;
      s.curveB.push([s.k, err(s.sumB)]); s.curveR.push([s.k, err(s.sumR)]);
      let ok = 0, cnt = 0;
      s.oobSum.forEach((p, i) => { if (p[0] + p[1] > 0) { cnt++; if ((p[1] > p[0] ? 1 : 0) === s.tr.y[i]) ok++; } });
      s.oob.push([s.k, cnt ? 1 - ok / cnt : NaN]);
    });
    sim.onDraw(() => {
      const s = state;
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 100, ymin: 0, ymax: Math.max(0.3, s.single * 1.25), xlabel: 'número de árboles', ylabel: 'error de clasificación' });
      pl.frame();
      pl.hline(s.single, { color: '--ink-3', label: 'un árbol' });
      if (s.curveB.length > 1) { pl.path(s.curveB, { color: '--c4', width: 2.2 }); pl.path(s.curveR, { color: '--c3', width: 2.4 }); pl.path(s.oob.filter((p) => p[0] >= 5), { color: '--c3', width: 1.5, dash: [5, 4] }); }
      pl.legend([{ label: 'bagging (8 variables candidatas)', color: '--c4' }, { label: 'bosque aleatorio (1 candidata)', color: '--c3' }, { label: 'OOB del bosque', color: '--c3', dash: [5, 4] }]);
      const last = (c) => (c.length ? pct(c[c.length - 1][1]) : '—');
      sim.set('e1', pct(s.single));
      sim.set('eb', s.k >= 100 ? last(s.curveB) : `construyendo… ${s.k}`);
      sim.set('er', s.k >= 100 ? last(s.curveR) : `construyendo… ${s.k}`);
      sim.set('oob', s.k >= 100 ? last(s.oob) : '—');
    });
  });

  /* ======================================================================
     17.3 Sesgo de la importancia por impureza
     ====================================================================== */
  ML.defineSim('importancia-sesgo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Bosque');
    sim.slider('leaf', { label: 'Mínimo de casos por hoja', min: 1, max: 40, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.out('acc', 'Exactitud de entrenamiento / prueba', { hl: true });
    const r = L.rng(3), n = 700, X = [], y = [];
    for (let i = 0; i < n; i++) { const s = r.int(2), c = r.int(3), a = r(); X.push([s, c, a]); y.push(r() < U.sigmoid(-1 + 1.6 * s + 0.8 * c) ? 1 : 0); }
    const tr = { X: X.slice(0, 350), y: y.slice(0, 350) }, te = { X: X.slice(350), y: y.slice(350) };
    sim.onDraw(() => {
      const f = L.ens.forest(tr.X, tr.y, { nTrees: 60, maxFeatures: 2, minLeaf: Math.round(sim.p.leaf), rng: L.rng(4) });
      const mdi = f.importances();
      const score = (Xs, ys) => L.met.accuracy(ys, f.predict(Xs));
      const pi = L.interp.permImportance(score, te.X, te.y, L.rng(5), 8);
      ML.draw.clear(cv);
      const names = ['sexo (binaria)', 'clase (3 valores)', 'azar (continua)'];
      const w2 = cv.w / 2;
      ML.text(cv.ctx, 'MDI (impureza, entrenamiento)', 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.text(cv.ctx, 'permutación (caída de exactitud en prueba)', w2 + 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 30, w: w2 - 16, h: cv.h - 40 }, names.map((nm, j) => ({ label: nm, value: mdi[j], color: j === 2 ? '--c2' : '--c1' })), { labelW: 120, min: 0, max: 1, fmt: f3 });
      ML.hbars(cv.ctx, { x: w2 + 6, y: 30, w: w2 - 16, h: cv.h - 40 }, names.map((nm, j) => ({ label: nm, value: pi[j].mean, err: pi[j].sd, color: j === 2 ? '--c2' : '--c1' })), { labelW: 120, min: Math.min(0, ...pi.map((p) => p.mean - p.sd)), max: Math.max(0.06, ...pi.map((p) => p.mean + p.sd)) * 1.1, fmt: f3 });
      sim.set('acc', `${pct(score(tr.X, tr.y))} / ${pct(score(te.X, te.y))}`);
    });
  });
})();
