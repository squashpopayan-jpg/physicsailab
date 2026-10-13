/* Capítulo 4 — Evaluación honesta */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     4.1 Diagrama de estrategias de partición
     ====================================================================== */
  ML.defineSim('pliegues', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Estrategia');
    sim.select('st', { label: 'Partición', options: [['hold', 'Partición simple 70/30'], ['kf', 'k pliegues (barajados)'], ['skf', 'k pliegues estratificados'], ['gkf', 'k pliegues por grupos'], ['ts', 'Serie temporal (ventana creciente)']], value: 'kf' });
    sim.slider('k', { label: 'Número de pliegues k', min: 2, max: 10, step: 1, value: 5, fmt: (v) => ML.fix(v, 0) });
    sim.out('note', 'Qué observar', { wide: true });
    sim.out('prop', 'Positivos en cada bloque de evaluación', { wide: true });
    const n = 40, rng0 = L.rng(4);
    const y = U.range(n).map((i) => (rng0() < 0.3 ? 1 : 0));
    const grp = U.range(n).map((i) => Math.floor(i / 4));
    const NOTES = {
      hold: 'Un solo corte: el resultado depende de qué filas cayeron en evaluación.',
      kf: 'Cada dato se evalúa exactamente una vez. Las proporciones de clase varían entre pliegues.',
      skf: 'Cada bloque de evaluación conserva la proporción de positivos del total.',
      gkf: 'Los cuatro datos de cada grupo (paciente) caen siempre juntos en evaluación o en entrenamiento.',
      ts: 'Se entrena con el pasado y se evalúa con el bloque siguiente; el futuro nunca se usa para entrenar.'
    };
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const k = Math.round(sim.p.k), st = sim.p.st, rng = L.rng(9);
      let folds;
      if (st === 'hold') { const s = L.data.split(n, 0.3, rng); folds = [s]; }
      else if (st === 'kf') folds = L.data.kfold(n, k, rng);
      else if (st === 'skf') folds = L.data.stratKfold(y, k, rng);
      else if (st === 'gkf') { const G = U.unique(grp), gf = L.data.kfold(G.length, k, rng); folds = gf.map((f) => { const ts = new Set(f.test); const test = U.range(n).filter((i) => ts.has(grp[i])); return { test, train: U.range(n).filter((i) => !ts.has(grp[i])) }; }); }
      else folds = L.data.timeSplit(n, k);
      const ctx = cv.ctx, ox = 110, top = 46, cw = (cv.w - ox - 14) / n, ch = Math.min(26, (cv.h - top - 10) / folds.length);
      ML.text(ctx, 'clase', ox - 8, 16, { size: 11, color: '--ink-3', align: 'right', baseline: 'middle' });
      ML.text(ctx, st === 'ts' ? 'tiempo →' : 'grupo', ox - 8, 32, { size: 11, color: '--ink-3', align: 'right', baseline: 'middle' });
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = ML.kcol(y[i]); ctx.beginPath(); ctx.arc(ox + (i + 0.5) * cw, 16, Math.min(5, cw * 0.35), 0, 7); ctx.fill();
        if (st === 'ts') { ctx.fillStyle = ML.alpha('--ink-3', 0.15 + 0.6 * (i / n)); ctx.fillRect(ox + i * cw + 1, 27, cw - 2, 10); }
        else { ctx.fillStyle = grp[i] % 2 ? ML.alpha('--c5', 0.5) : ML.alpha('--c4', 0.5); ctx.fillRect(ox + i * cw + 1, 27, cw - 2, 10); }
      }
      const props = [];
      folds.forEach((f, r) => {
        const yy = top + r * ch, te = new Set(f.test), trs = new Set(f.train);
        ML.text(ctx, st === 'hold' ? 'partición' : `iteración ${r + 1}`, ox - 8, yy + ch / 2, { size: 11.5, color: '--ink-2', align: 'right', baseline: 'middle' });
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = te.has(i) ? ML.col('--accent') : trs.has(i) ? ML.alpha('--accent', 0.18) : ML.alpha('--ink-3', 0.06);
          ctx.fillRect(ox + i * cw + 1, yy + 2, cw - 2, ch - 4);
        }
        props.push(f.test.length ? ML.fix(100 * f.test.filter((i) => y[i] === 1).length / f.test.length, 0) + ' %' : '—');
      });
      sim.legend([{ label: 'evaluación', color: '--accent', kind: 'sq' }, { label: 'entrenamiento', color: ML.alpha('--accent', 0.3), kind: 'sq' }, { label: 'sin usar', color: ML.alpha('--ink-3', 0.2), kind: 'sq' }, { label: 'clase 0', color: '--k0', kind: 'dot' }, { label: 'clase 1', color: '--k1', kind: 'dot' }]);
      sim.set('note', NOTES[st]);
      sim.set('prop', props.join(' · ') + ` (total ${pct(y.filter((v) => v).length / n)})`);
    });
  });

  /* ======================================================================
     4.2 Error de estimación: partición simple frente a validación cruzada
     ====================================================================== */
  ML.defineSim('holdout-vs-cv', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Experimento');
    sim.slider('n', { label: 'Tamaño de la muestra n', min: 40, max: 400, step: 10, value: 100, fmt: (v) => ML.fix(v, 0) });
    sim.note('Modelo: k-NN con k = 9 sobre lunas con ruido. Exactitud verdadera medida con 5 000 datos nuevos.');
    sim.out('ho', 'Desv. del error, partición 70/30');
    sim.out('k5', 'Desv. del error, 5 pliegues');
    sim.out('k10', 'Desv. del error, 10 pliegues', { hl: true });
    sim.out('reps', 'Repeticiones');
    const big = L.data.make2d('moons', 5000, 0.45, L.rng(31));
    let res, r;
    const restart = () => { res = { ho: [], k5: [], k10: [] }; r = 0; };
    restart();
    sim.onChange = () => restart();
    const accOf = (tr, te) => { const m = L.knn.classifier(tr.X, tr.y, 9); return L.met.accuracy(te.y, m.predict(te.X)); };
    sim.animate(() => {
      const t0 = performance.now();
      while (r < 200 && performance.now() - t0 < 30) {
        const rng = L.rng(800 + r), n = Math.round(sim.p.n);
        const d = L.data.make2d('moons', n, 0.45, rng);
        const truth = accOf(d, { X: big.X.slice(0, 1500), y: big.y.slice(0, 1500) });
        const s = L.data.split(n, 0.3, rng, d.y);
        res.ho.push(accOf(L.data.subset(d, s.train), L.data.subset(d, s.test)) - truth);
        for (const k of [5, 10]) {
          const f = L.data.stratKfold(d.y, k, rng);
          res['k' + k].push(L.stat.mean(f.map((q) => accOf(L.data.subset(d, q.train), L.data.subset(d, q.test)))) - truth);
        }
        r++;
      }
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const w3 = cv.w / 3;
      [['ho', 'partición 70/30', '--c2'], ['k5', '5 pliegues', '--c4'], ['k10', '10 pliegues', '--c1']].forEach(([key, name, col], j) => {
        const pl = new ML.Plot(cv.ctx, { x: j * w3, y: 0, w: w3, h: cv.h, xmin: -0.25, xmax: 0.25, ymin: 0, ymax: 14, xlabel: 'estimada − verdadera', ylabel: j === 0 ? 'densidad' : '', title: name, ml: j === 0 ? 46 : 26, mr: 8 });
        pl.frame();
        if (res[key].length > 2) ML.drawHist(pl, L.stat.hist(res[key], -0.25, 0.25, 25), { color: col, alpha: 0.5 });
        pl.vline(0, { color: '--ink', dash: [] });
      });
      const sd = (a) => (a.length > 2 ? ML.fix(100 * L.stat.std(a), 1) + ' puntos' : '—');
      sim.set('ho', sd(res.ho)); sim.set('k5', sd(res.k5)); sim.set('k10', sd(res.k10));
      sim.set('reps', `${r} de 200`);
    });
  });

  /* ======================================================================
     4.3 Fuga por selección de variables
     ====================================================================== */
  ML.defineSim('fuga-seleccion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Datos aleatorios');
    sim.slider('p', { label: 'Variables candidatas p', min: 50, max: 4000, step: 50, value: 2000, log: true, fmt: (v) => ML.fix(v, 0) });
    sim.slider('k', { label: 'Variables seleccionadas k', min: 2, max: 50, step: 1, value: 10, fmt: (v) => ML.fix(v, 0) });
    sim.note('n = 60 instancias, etiquetas al azar. Clasificador: centroide más cercano con las k variables. Validación cruzada de 5 pliegues, 30 repeticiones.');
    sim.out('leak', 'Exactitud estimada con fuga', { hl: true });
    sim.out('ok', 'Exactitud estimada sin fuga');
    sim.out('reps', 'Repeticiones');
    const n = 60;
    let res, r;
    const restart = () => { res = { leak: [], ok: [] }; r = 0; };
    restart();
    sim.onChange = () => restart();
    const topK = (X, y, idx, p, k) => {
      const sc = new Float64Array(p);
      const m1 = idx.filter((i) => y[i] === 1), m0 = idx.filter((i) => y[i] === 0);
      for (let j = 0; j < p; j++) { let a = 0, b = 0; for (const i of m1) a += X[i][j]; for (const i of m0) b += X[i][j]; sc[j] = Math.abs(a / m1.length - b / m0.length); }
      return U.argsort(Array.from(sc), true).slice(0, k);
    };
    const centroid = (X, y, tr, te, feats) => {
      const c = [0, 1].map((cl) => feats.map((j) => L.stat.mean(tr.filter((i) => y[i] === cl).map((i) => X[i][j]))));
      return te.filter((i) => { const d0 = feats.reduce((s, j, q) => s + (X[i][j] - c[0][q]) ** 2, 0), d1 = feats.reduce((s, j, q) => s + (X[i][j] - c[1][q]) ** 2, 0); return (d1 < d0 ? 1 : 0) === y[i]; }).length / te.length;
    };
    sim.animate(() => {
      const t0 = performance.now();
      while (r < 30 && performance.now() - t0 < 30) {
        const rng = L.rng(1300 + r), p = Math.round(sim.p.p), k = Math.round(sim.p.k);
        const X = Array.from({ length: n }, () => Array.from({ length: p }, () => rng.gauss()));
        const y = U.range(n).map((i) => i % 2);
        rng.shuffle(y);
        const folds = L.data.stratKfold(y, 5, rng);
        const global = topK(X, y, U.range(n), p, k);
        res.leak.push(L.stat.mean(folds.map((f) => centroid(X, y, f.train, f.test, global))));
        res.ok.push(L.stat.mean(folds.map((f) => centroid(X, y, f.train, f.test, topK(X, y, f.train, p, k)))));
        r++;
      }
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.2, xmax: 1, ymin: 0, ymax: 12, xlabel: 'exactitud estimada por validación cruzada', ylabel: 'densidad', title: 'distribución de la estimación en 30 repeticiones' });
      pl.frame();
      if (res.ok.length > 1) ML.drawHist(pl, L.stat.hist(res.ok, 0.2, 1, 32), { color: '--c1', alpha: 0.5 });
      if (res.leak.length > 1) ML.drawHist(pl, L.stat.hist(res.leak, 0.2, 1, 32), { color: '--c2', alpha: 0.5 });
      pl.vline(0.5, { color: '--ink', dash: [], label: 'azar' });
      pl.legend([{ label: 'selección dentro de cada pliegue', color: '--c1', kind: 'sq' }, { label: 'selección con todos los datos (fuga)', color: '--c2', kind: 'sq' }], 'tl');
      sim.set('leak', res.leak.length ? pct(L.stat.mean(res.leak)) : '—');
      sim.set('ok', res.ok.length ? pct(L.stat.mean(res.ok)) : '—');
      sim.set('reps', `${r} de 30`);
    });
  });
})();
