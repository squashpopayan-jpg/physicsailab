/* Capítulo 30 — Cómo elegir el algoritmo */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     30.1 Asistente de elección
     ====================================================================== */
  const ALG = {
    lin: 'Modelo lineal regularizado (logística / Ridge / Lasso)', gb: 'Gradient boosting (HistGB, XGBoost, LightGBM, CatBoost)', rf: 'Bosque aleatorio',
    svm: 'SVM con núcleo RBF', knn: 'k vecinos', tree: 'Árbol poco profundo / reglas', nb: 'Bayes ingenuo', cnn: 'Red convolucional preentrenada (transferencia)',
    tr: 'Transformer preentrenado (ajuste fino o embeddings)', mlp: 'Red densa (MLP)', km: 'k-medias / mezcla gaussiana', db: 'HDBSCAN / DBSCAN', agg: 'Aglomerativo (Ward)',
    iso: 'Bosque de aislamiento', maha: 'Mahalanobis robusta', lof: 'LOF', ae: 'Autocodificador', arima: 'Modelos de series (ETS/ARIMA) como línea base', lag: 'Boosting con rasgos de rezagos y calendario'
  };
  ML.defineSim('asistente-algoritmo', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 3 });
    sim.group('Su problema');
    sim.seg('task', { label: 'Tarea', options: [['clf', 'Clasificar'], ['reg', 'Regresión'], ['clu', 'Agrupar'], ['ano', 'Anomalías']], value: 'clf' });
    sim.seg('data', { label: 'Tipo de datos', options: [['tab', 'Tabla'], ['img', 'Imágenes'], ['txt', 'Texto'], ['ts', 'Serie temporal']], value: 'tab' });
    sim.seg('n', { label: 'Número de filas', options: [['s', '< 1 mil'], ['m', '1 mil – 100 mil'], ['l', '> 100 mil']], value: 'm' });
    sim.check('interp', { label: 'Necesito explicar cada decisión (regulación, medicina)', value: false });
    sim.check('fast', { label: 'Predicción muy rápida o recursos limitados', value: false });
    sim.check('cat', { label: 'Muchas variables categóricas', value: false });
    sim.check('irr', { label: 'Muchas variables, posiblemente irrelevantes', value: false });
    sim.out('rec', 'Por dónde empezar', { wide: true });
    sim.onDraw(() => {
      const p = sim.p, sc = {}, why = {};
      const add = (k, v, r) => { sc[k] = (sc[k] || 0) + v; if (r) (why[k] = why[k] || []).push(r); };
      if (p.task === 'clf' || p.task === 'reg') {
        if (p.data === 'tab') {
          add('gb', 5, 'suele ser el más exacto con datos tabulares'); add('rf', 4, 'robusto con valores por defecto'); add('lin', 3, 'línea base fuerte, rápida e interpretable');
          if (p.n === 's') { add('lin', 2, 'con pocos datos, los modelos simples generalizan mejor'); add('svm', 2, 'funciona bien con pocos datos escalados'); add('gb', -1); add('nb', 1); add('knn', 1); }
          if (p.n === 'l') { add('gb', 1, 'escala bien con histogramas'); add('svm', -4, 'su costo crece como n²–n³'); add('knn', -2, 'predecir es lento con muchos datos'); add('mlp', 1); }
          if (p.cat) { add('gb', 1, 'CatBoost o HistGB manejan categorías de forma nativa'); add('rf', 0.5); add('svm', -1); add('knn', -1); }
          if (p.irr) { add('gb', 1, 'ignora variables inútiles'); add('rf', 1); add('lin', 0.5, 'con Lasso, selecciona variables'); add('knn', -2, 'las variables irrelevantes arruinan las distancias'); add('svm', -1); }
          if (p.interp) { add('lin', 3, 'coeficientes directamente interpretables'); add('tree', 4, 'reglas que se pueden auditar'); add('gb', -1, 'necesitará SHAP para explicarlo'); add('rf', -1); add('mlp', -2); }
          if (p.fast) { add('lin', 2, 'predicción instantánea y modelo diminuto'); add('tree', 1); add('knn', -2); add('svm', -1); add('rf', -1); }
          add('svm', 1); add('knn', 0.5); add('mlp', 0.5); add('tree', 0.5);
        } else if (p.data === 'img') {
          add('cnn', 6, 'la transferencia de aprendizaje es el estándar en visión'); add('tr', 3, 'los Vision Transformers preentrenados compiten con las CNN');
          if (p.n === 's') add('cnn', 1, 'congele la red y entrene solo la cabeza, con aumento de datos');
          if (p.interp) add('cnn', -1, 'explique con mapas de saliencia, con cautela');
          add('svm', p.n === 's' ? 1 : -1, 'sobre embeddings de una red preentrenada');
        } else if (p.data === 'txt') {
          add('tr', 5, 'embeddings o ajuste fino de un modelo preentrenado'); add('lin', 3, 'TF-IDF + logística: línea base sorprendentemente fuerte'); add('nb', 2, 'Bayes multinomial: rapidísimo para texto');
          if (p.n === 's') add('tr', 1, 'pocos ejemplos: use embeddings preentrenados y un clasificador simple');
          if (p.fast) { add('lin', 2, 'TF-IDF + modelo lineal predice en microsegundos'); add('tr', -2); }
          if (p.interp) add('lin', 2, 'los pesos de cada palabra se leen directamente');
        } else {
          add('lag', 5, 'rasgos de rezagos, medias móviles y calendario con boosting'); add('arima', 3, 'línea base estadística obligatoria'); add('lin', 2, 'regresión con rezagos');
          add('tr', p.n === 'l' ? 1 : -1, 'modelos fundacionales de series, con muchos datos');
          (why.lag = why.lag || []).push('valide con TimeSeriesSplit, nunca al azar');
        }
      } else if (p.task === 'clu') {
        add('km', 4, 'rápido y simple; grupos compactos'); add('db', 3, 'formas arbitrarias y ruido, sin fijar k'); add('agg', 2, 'jerarquía a varias escalas');
        if (p.n === 'l') { add('agg', -3, 'memoria cuadrática'); add('km', 1, 'MiniBatchKMeans escala a millones'); }
        if (p.data !== 'tab') add('tr', 3, 'agrupe sobre embeddings de un modelo preentrenado');
      } else {
        add('iso', 4, 'rápido, muchas variables, anomalías globales'); add('maha', p.n === 's' ? 3 : 2, 'datos elípticos; captura correlaciones'); add('lof', 2, 'anomalías locales con densidades distintas');
        if (p.data !== 'tab') add('ae', 4, 'error de reconstrucción en imágenes, audio o series');
        if (p.irr) add('iso', 1);
      }
      const ranked = Object.keys(sc).filter((k) => sc[k] > 0).sort((a, b) => sc[b] - sc[a]).slice(0, 5);
      ML.draw.clear(cv);
      const mx = Math.max(...ranked.map((k) => sc[k]), 1);
      ML.text(cv.ctx, 'puntaje heurístico de adecuación (no sustituye a la validación cruzada)', 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 28, w: cv.w - 12, h: cv.h - 36 }, ranked.map((k, i) => ({ label: ALG[k].split(' (')[0], value: sc[k] / mx, color: i === 0 ? '--c3' : '--c1' })), { labelW: 230, min: 0, max: 1, fmt: () => '', barH: 22 });
      sim.set('rec', '<ol style="margin:0;padding-left:1.2em">' + ranked.map((k) => `<li><b>${ALG[k]}</b>${why[k] ? ': ' + why[k].join('; ') : ''}</li>`).join('') + '</ol><div class="ctrl-note">Siempre: una línea base, validación cruzada con el mismo protocolo para todos y la métrica del negocio.</div>');
    });
  });

  /* ======================================================================
     30.2 Arena: ocho algoritmos, los mismos datos
     ====================================================================== */
  ML.defineSim('arena', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.05 });
    sim.group('Datos');
    sim.select('kind', { label: 'Conjunto', options: L.data.KINDS.filter((k) => k[0] !== 'blobs3'), value: 'moons' });
    sim.slider('n', { label: 'Puntos de entrenamiento', min: 40, max: 400, step: 10, value: 150, fmt: (v) => ML.fix(v, 0) });
    sim.slider('noise', { label: 'Ruido', min: 0, max: 1, step: 0.01, value: 0.4, fmt: (v) => ML.fix(v, 2) });
    sim.button('Nueva muestra', () => { seed++; cache = null; }, { id: 'new' });
    sim.out('rank', 'Clasificación por exactitud de prueba', { wide: true });
    let seed = 1, cache = null;
    const MODELS = [
      ['Logística', (d) => { const m = L.lin.logistic(d.X, d.y, { C: 1 }); return (x) => m.proba([x])[0]; }],
      ['Bayes ingenuo', (d) => { const m = L.gen.gaussianNB(d.X, d.y); return (x) => m.proba1(x)[1]; }],
      ['k-NN (k = 9)', (d) => { const m = L.knn.classifier(d.X, d.y, 9); return (x) => m.proba(x)[1]; }],
      ['SVM RBF', (d) => { const m = L.svm.fit(d.X, d.y, { kernel: 'rbf', C: 2, gamma: 1.5 }); return (x) => U.sigmoid(2 * m.decision1(x)); }],
      ['Árbol (prof. 5)', (d) => { const t = L.tree.fit(d.X, d.y, { maxDepth: 5 }); return (x) => t.value1(x)[1]; }],
      ['Bosque (60)', (d) => { const f = L.ens.forest(d.X, d.y, { nTrees: 60, maxFeatures: 1, rng: L.rng(2) }); return (x) => f.proba1(x)[1]; }],
      ['Gradient boosting', (d) => { const g = L.ens.gboost(d.X, d.y, { loss: 'log', nEst: 120, lr: 0.1, depth: 3 }); return (x) => U.sigmoid(g.raw1(x)); }],
      ['Red 2–16–16–1', (d) => { const net = L.nn.mlp({ sizes: [2, 16, 16, 1], act: 'tanh', rng: L.rng(3), init: 'xavier' }), o = L.opt.make('adam', { lr: 0.02 }); for (let e = 0; e < 300; e++) net.epoch(d.X, d.y, o, { batch: 32, rng: L.rng(e) }); return (x) => net.predict1(x)[0]; }]
    ];
    sim.onChange = () => { cache = null; };
    sim.onDraw(() => {
      if (!cache) {
        const d = L.data.make2d(sim.p.kind, Math.round(sim.p.n), sim.p.noise, L.rng(100 + seed)), te = L.data.make2d(sim.p.kind, 800, sim.p.noise, L.rng(900 + seed));
        cache = { d, res: MODELS.map(([name, fit]) => { const t0 = performance.now(), f = fit(d), ms = performance.now() - t0; return { name, f, ms, acc: L.met.accuracy(te.y, te.X.map((x) => (f(x) >= 0.5 ? 1 : 0))) }; }) };
      }
      const { d, res } = cache, ctx = cv.ctx;
      ML.draw.clear(cv);
      const cols = 4, rows = 2, gw = cv.w / cols, gh = cv.h / rows;
      const best = Math.max(...res.map((r) => r.acc));
      res.forEach((r, k) => {
        const x0 = (k % cols) * gw, y0 = Math.floor(k / cols) * gh;
        ctx.save(); ctx.translate(x0 + 3, y0 + 3);
        const v = new ML.View2D({ w: gw - 6, h: gh - 6 }, { xmin: -2.3, xmax: 2.3, ymin: -2.3, ymax: 2.3 });
        v.cv = { w: gw - 6, h: gh - 6, ctx };
        ML.probMap(v, (a, b) => r.f([a, b]), { res: 6, alpha: 0.6 });
        ML.points(v, d.X, d.y, { r: 2.2 });
        ctx.strokeStyle = ML.col(r.acc === best ? '--c3' : '--rule-strong'); ctx.lineWidth = r.acc === best ? 2.5 : 1; ctx.strokeRect(0.5, 0.5, gw - 7, gh - 7);
        ML.text(ctx, `${r.name} · ${pct(r.acc)}`, 6, 15, { size: 11.5, color: '--ink', halo: true, weight: 650 });
        ctx.restore();
      });
      sim.set('rank', res.slice().sort((a, b) => b.acc - a.acc).map((r, i) => `${i + 1}. ${r.name} ${pct(r.acc)} (${ML.fix(r.ms, 0)} ms)`).join(' · '));
    });
  });
})();
