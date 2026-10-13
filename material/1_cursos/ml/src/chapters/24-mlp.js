/* Capítulo 24 — Del perceptrón a la red multicapa */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     24.1 La regla del perceptrón
     ====================================================================== */
  ML.defineSim('perceptron', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.group('Datos');
    sim.seg('kind', { options: [['lin', 'Separables'], ['xor', 'XOR']], value: 'lin' });
    sim.group('Perceptrón');
    sim.slider('eta', { label: 'Tasa η', min: 0.01, max: 1, step: 0.01, value: 0.2, fmt: f2 });
    sim.button('Una época', () => epoch(), { primary: true, id: 'ep' });
    sim.check('auto', { label: 'Épocas automáticas', value: true });
    sim.out('ep', 'Épocas');
    sim.out('err', 'Errores en la última época', { hl: true });
    sim.out('w', 'w₀, w₁, w₂');
    let d, w, ep, errs;
    const restart = () => {
      const r = L.rng(4);
      d = sim.p.kind === 'xor' ? L.data.make2d('xor', 80, 0.3, r) : L.data.blobs(80, [[-0.8, -0.6], [0.8, 0.7]], 0.4, r);
      w = [0, 0.1, -0.1]; ep = 0; errs = [];
    };
    const epoch = () => { errs.push(L.nn.perceptronEpoch(d.X, d.y, w, sim.p.eta, L.rng(ep).perm(d.X.length))); ep++; };
    restart();
    sim.onChange = (id) => { if (id === 'kind') restart(); };
    let acc = 0;
    sim.animate((dt) => { if (!sim.p.auto || ep >= 60 || (errs.length && errs[errs.length - 1] === 0)) return; acc += dt; if (acc > 0.35) { acc = 0; epoch(); } });
    sim.onDraw(() => {
      const view = ML.view2(cv, 2.3);
      ML.draw.clear(cv);
      ML.heatmap(view, (a, b) => { const z = w[0] + w[1] * a + w[2] * b, c = ML.rgb(z >= 0 ? '--k1' : '--k0'), bg = ML.rgb('--canvas'); return [bg[0] + (c[0] - bg[0]) * 0.2, bg[1] + (c[1] - bg[1]) * 0.2, bg[2] + (c[2] - bg[2]) * 0.2, 1]; }, { res: 5 });
      ML.contour(view, (a, b) => w[0] + w[1] * a + w[2] * b, 0, { width: 2.4 });
      const wrong = U.range(d.X.length).filter((i) => (w[0] + w[1] * d.X[i][0] + w[2] * d.X[i][1] >= 0 ? 1 : 0) !== d.y[i]);
      ML.points(view, d.X, d.y, { r: 4, wrong });
      sim.set('ep', String(ep));
      sim.set('err', errs.length ? String(errs[errs.length - 1]) + (errs[errs.length - 1] === 0 ? ' (convergió)' : '') : '—');
      sim.set('w', w.map(f2).join(', '));
    });
  });

  /* ======================================================================
     24.2 Aproximación universal con unidades ReLU
     ====================================================================== */
  ML.defineSim('aproximador-relu', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Objetivo');
    sim.seg('f', { options: [['sin', 'Seno'], ['step', 'Escalón'], ['abs', 'Valor absoluto'], ['bump', 'Dos picos']], value: 'sin' });
    sim.group('Red 1–N–1 (ReLU)');
    sim.slider('N', { label: 'Neuronas ocultas N', min: 1, max: 40, step: 1, value: 6, fmt: (v) => ML.fix(v, 0) });
    sim.check('units', { label: 'Dibujar la contribución de cada neurona', value: true });
    sim.out('mse', 'Error cuadrático medio', { hl: true });
    sim.out('ep', 'Épocas de Adam');
    const FN = { sin: (x) => Math.sin(2.5 * x), step: (x) => (x < 0 ? -0.6 : 0.8), abs: (x) => Math.abs(x) - 0.6, bump: (x) => Math.exp(-8 * (x + 0.8) ** 2) - 0.8 * Math.exp(-10 * (x - 0.7) ** 2) };
    let net, opt, X, Y, ep;
    const restart = () => {
      X = Array.from(L.util.linspace(-1.6, 1.6, 120), (v) => [v]); Y = X.map(([x]) => [FN[sim.p.f](x)]);
      net = L.nn.mlp({ sizes: [1, Math.round(sim.p.N), 1], act: 'relu', out: 'linear', rng: L.rng(3), init: 'he' });
      opt = L.opt.make('adam', { lr: 0.02 }); ep = 0;
    };
    restart();
    sim.onChange = () => restart();
    sim.animate(() => { if (ep < 3000) for (let k = 0; k < 15; k++) { net.epoch(X, Y, opt, { batch: 120 }); ep++; } });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1.6, xmax: 1.6, ymin: -1.6, ymax: 1.6, xlabel: 'x', ylabel: 'y' });
      pl.frame();
      if (sim.p.units) {
        const N = net.sizes[1];
        for (let j = 0; j < N; j++) {
          const w1 = net.W(0, j, 0), b1 = net.params[net.off[0].b + j], w2 = net.W(1, 0, j);
          pl.fn((x) => w2 * Math.max(0, w1 * x + b1), { color: '--c6', width: 1, alpha: 0.5 });
          if (Math.abs(w1) > 1e-6) { const k = -b1 / w1; if (k > -1.6 && k < 1.6) pl.dot(k, 0, { color: '--c5', r: 2.6 }); }
        }
      }
      pl.fn(FN[sim.p.f], { color: '--ink-3', dash: [5, 4], width: 1.6 });
      pl.fn((x) => net.predict1([x])[0], { color: '--c1', width: 2.6, n: 600 });
      pl.legend([{ label: 'objetivo', color: '--ink-3', dash: [5, 4] }, { label: 'red', color: '--c1' }, { label: 'neuronas (w₂·ReLU)', color: '--c6' }]);
      sim.set('mse', ML.sci(2 * net.loss(X, Y), 3));
      sim.set('ep', String(ep));
    });
  });

  /* ======================================================================
     24.3 Laboratorio de redes neuronales (al estilo de TensorFlow Playground)
     ====================================================================== */
  ML.defineSim('playground', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 }), cn = sim.canvas({ aspect: 1 }), cl = sim.canvas({ aspect: 4.2, cls: 'full' });
    ML.dataControls(sim, { kind: 'spiral', n: 300, noise: 0.25, nmax: 500 });
    sim.group('Arquitectura');
    sim.slider('layers', { label: 'Capas ocultas', min: 1, max: 3, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.slider('width', { label: 'Neuronas por capa', min: 1, max: 16, step: 1, value: 8, fmt: (v) => ML.fix(v, 0) });
    sim.seg('act', { label: 'Activación', options: [['relu', 'ReLU'], ['tanh', 'tanh'], ['sigmoid', 'sigmoide']], value: 'tanh' });
    sim.group('Entrenamiento');
    sim.slider('lr', { label: 'Tasa de Adam', min: 0.001, max: 0.3, value: 0.03, log: true, step: 0.001, fmt: f3 });
    sim.slider('l2', { label: 'Regularización L2', min: 0, max: 0.05, step: 0.0005, value: 0, fmt: (v) => ML.fix(v, 4) });
    sim.out('ep', 'Épocas');
    sim.out('loss', 'Pérdida entrenamiento / prueba', { hl: true });
    sim.out('acc', 'Exactitud entrenamiento / prueba');
    sim.out('np', 'Parámetros');
    let d, te, net, opt, ep, hist;
    const restart = () => {
      d = ML.makeData(sim); te = L.data.make2d(sim.p.kind, 600, sim.p.noise, L.rng(9100 + sim.p.seed));
      const W = Math.round(sim.p.width), sizes = [2, ...Array.from({ length: Math.round(sim.p.layers) }, () => W), 1];
      net = L.nn.mlp({ sizes, act: sim.p.act, rng: L.rng(7 + sim.p.seed), init: sim.p.act === 'relu' ? 'he' : 'xavier' });
      opt = L.opt.make('adam', { lr: sim.p.lr }); ep = 0; hist = [];
    };
    restart();
    sim.onData = restart;
    sim.onChange = (id) => { if (id === 'lr') opt.lr = sim.p.lr; else if (id !== 'l2') restart(); };
    sim.resetButton(restart);
    sim.animate(() => {
      if (ep >= 2000) return;
      for (let k = 0; k < 2; k++) { net.epoch(d.X, d.y, opt, { batch: 16, l2: sim.p.l2, rng: L.rng(ep * 31 + 1) }); ep++; }
      if (ep % 4 === 0) { hist.push([ep, net.loss(d.X, d.y), net.loss(te.X, te.y)]); if (hist.length > 500) hist.shift(); }
    });
    sim.onDraw(() => {
      const view = ML.view2(cm, 2.2);
      ML.draw.clear(cm);
      ML.probMap(view, (a, b) => net.predict1([a, b])[0], { res: 5, alpha: 0.6 });
      ML.contour(view, (a, b) => net.predict1([a, b])[0] - 0.5, 0, { res: 5, width: 1.8 });
      ML.points(view, d.X, d.y, { r: 3 });
      ML.draw.clear(cn);
      const labels = ['entrada', ...Array.from({ length: net.nl - 1 }, (_, l) => `oculta ${l + 1}`), 'salida'];
      ML.drawNet(cn.ctx, { x: 6, y: 10, w: cn.w - 12, h: cn.h - 36 }, net, { labels });
      ML.text(cn.ctx, 'grosor ∝ |peso| · naranja positivo, azul negativo', 8, cn.h - 6, { size: 10.5, color: '--ink-3' });
      ML.draw.clear(cl);
      const lmax = Math.max(0.8, ...hist.map((h) => Math.min(h[2], 3)));
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: hist.length ? hist[0][0] : 0, xmax: Math.max(10, ep), ymin: 0, ymax: lmax, xlabel: 'épocas', ylabel: 'log-loss', mb: 34 });
      pl.frame();
      if (hist.length > 1) { pl.path(hist.map((h) => [h[0], h[1]]), { color: '--c3', width: 2 }); pl.path(hist.map((h) => [h[0], Math.min(h[2], lmax)]), { color: '--c2', width: 2 }); }
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'prueba', color: '--c2' }]);
      const acc = (D) => L.met.accuracy(D.y, D.X.map((x) => (net.predict1(x)[0] >= 0.5 ? 1 : 0)));
      const last = hist[hist.length - 1];
      sim.set('ep', String(ep));
      sim.set('loss', last ? `${f3(last[1])} / ${f3(last[2])}` : '—');
      sim.set('acc', `${pct(acc(d))} / ${pct(acc(te))}`);
      sim.set('np', String(net.P));
    });
  });
})();
