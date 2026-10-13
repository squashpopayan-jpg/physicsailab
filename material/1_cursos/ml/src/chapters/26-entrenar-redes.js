/* Capítulo 26 — Entrenar redes en la práctica */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     26.1 Diagnosticar curvas de entrenamiento
     ====================================================================== */
  const SCEN = {
    good: { n: 'Bien ajustado', d: 'Ambas pérdidas bajan y se estabilizan juntas, cerca una de otra.', cfg: { lr: 0.02, sizes: [2, 16, 16, 1], n: 300, noise: 0.25, batch: 16 } },
    high: { n: 'Tasa de aprendizaje demasiado alta', d: 'La pérdida salta, oscila o se dispara; puede quedar estancada en un valor alto.', cfg: { lr: 0.6, sizes: [2, 16, 16, 1], n: 300, noise: 0.25, batch: 16 } },
    low: { n: 'Tasa de aprendizaje demasiado baja', d: 'La pérdida baja muy despacio y casi en línea recta; falta entrenar o subir la tasa.', cfg: { lr: 0.0004, sizes: [2, 16, 16, 1], n: 300, noise: 0.25, batch: 16 } },
    over: { n: 'Sobreajuste', d: 'La de entrenamiento sigue bajando mientras la de validación toca un mínimo y sube.', cfg: { lr: 0.02, sizes: [2, 64, 64, 1], n: 40, noise: 0.45, batch: 8 } },
    under: { n: 'Subajuste (capacidad insuficiente)', d: 'Ambas pérdidas se estancan juntas en un valor alto.', cfg: { lr: 0.02, sizes: [2, 1, 1], n: 300, noise: 0.25, batch: 16 } },
    noisy: { n: 'Lotes muy pequeños', d: 'La tendencia es buena pero la curva es muy ruidosa; suba el lote o baje la tasa.', cfg: { lr: 0.05, sizes: [2, 16, 16, 1], n: 300, noise: 0.25, batch: 1 } }
  };
  ML.defineSim('diagnostico-curvas', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Escenario');
    sim.select('sc', { label: 'Entrenamiento a mostrar', options: Object.keys(SCEN).map((k) => [k, SCEN[k].n]), value: 'over' });
    sim.check('quiz', { label: 'Modo adivinanza (ocultar el nombre)', value: false });
    sim.button('Escenario al azar', () => { const ks = Object.keys(SCEN); sim.ctl.sc.set(ks[Math.floor(Math.random() * ks.length)], true); sim.ctl.quiz.set(true, true); guess = null; restart(); }, { id: 'rnd' });
    const box = ML.el('div', 'ctrl-row');
    Object.keys(SCEN).forEach((k) => { const b = ML.el('button', 'btn', SCEN[k].n); b.type = 'button'; b.addEventListener('click', () => { guess = k; sim.redraw(); }); box.append(b); });
    sim._group.append(box);
    sim.out('diag', 'Diagnóstico', { wide: true, hl: true });
    sim.out('ep', 'Épocas');
    let st, guess = null;
    const restart = () => {
      const c = SCEN[sim.p.sc].cfg, r = L.rng(3);
      st = { c, tr: L.data.make2d('moons', c.n, c.noise, r), va: L.data.make2d('moons', 400, c.noise, L.rng(4)), ep: 0, hist: [] };
      st.net = L.nn.mlp({ sizes: c.sizes, act: 'tanh', rng: L.rng(5), init: 'xavier' });
      st.opt = L.opt.make('adam', { lr: c.lr });
    };
    restart();
    sim.onChange = (id) => { if (id === 'sc') { guess = null; restart(); } };
    sim.animate(() => {
      if (st.ep >= 400) return;
      for (let k = 0; k < 2; k++) {
        const lt = st.net.epoch(st.tr.X, st.tr.y, st.opt, { batch: st.c.batch, rng: L.rng(st.ep + 1) });
        st.ep++;
        st.hist.push([st.ep, st.c.batch === 1 ? lt : st.net.loss(st.tr.X, st.tr.y), st.net.loss(st.va.X, st.va.y)]);
      }
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const H = st.hist, ymax = Math.min(2, Math.max(0.8, ...H.map((h) => Math.max(h[1], h[2])))) * 1.05;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 400, ymin: 0, ymax, xlabel: 'época', ylabel: 'log-loss' });
      pl.frame();
      if (H.length > 1) { pl.path(H.map((h) => [h[0], Math.min(h[1], ymax)]), { color: '--c3', width: 2 }); pl.path(H.map((h) => [h[0], Math.min(h[2], ymax)]), { color: '--c2', width: 2.2 }); }
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'validación', color: '--c2' }]);
      const s = SCEN[sim.p.sc];
      if (sim.p.quiz && !guess) sim.set('diag', 'Elija un diagnóstico con los botones.');
      else if (sim.p.quiz && guess) sim.set('diag', (guess === sim.p.sc ? '✔ Correcto: ' : `✘ No: era «${s.n}». `) + s.d);
      else sim.set('diag', `<b>${s.n}</b>: ${s.d}`);
      sim.set('ep', String(st.ep));
    });
  });

  /* ======================================================================
     26.2 Regularizar una red sobreajustada
     ====================================================================== */
  ML.defineSim('regularizar-red', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 }), cl = sim.canvas({ aspect: 1 });
    sim.group('Regularización (red 2–64–64–1, 50 datos con ruido)');
    sim.slider('l2', { label: 'Penalización L2 (weight decay)', min: 0, max: 0.03, step: 0.0005, value: 0, fmt: (v) => ML.fix(v, 4) });
    sim.slider('drop', { label: 'Dropout', min: 0, max: 0.7, step: 0.05, value: 0, fmt: (v) => ML.fix(v, 2) });
    sim.check('early', { label: 'Mostrar la red en el punto de parada temprana', value: false });
    sim.out('best', 'Mínimo de la validación', { hl: true });
    sim.out('acc', 'Exactitud de prueba: final / en el mínimo');
    let st;
    const restart = () => {
      st = { tr: L.data.make2d('moons', 50, 0.5, L.rng(8)), va: L.data.make2d('moons', 500, 0.5, L.rng(9)), ep: 0, hist: [], best: null };
      st.net = L.nn.mlp({ sizes: [2, 64, 64, 1], act: 'relu', rng: L.rng(2), init: 'he' });
      st.opt = L.opt.make('adam', { lr: 0.01 });
    };
    restart();
    sim.onChange = (id) => { if (id !== 'early') restart(); };
    sim.resetButton(restart);
    sim.animate(() => {
      if (st.ep >= 600) return;
      for (let k = 0; k < 3; k++) { st.net.epoch(st.tr.X, st.tr.y, st.opt, { batch: 10, l2: sim.p.l2, dropout: sim.p.drop, rng: L.rng(st.ep + 7) }); st.ep++; }
      const lv = st.net.loss(st.va.X, st.va.y);
      st.hist.push([st.ep, st.net.loss(st.tr.X, st.tr.y), lv]);
      if (!st.best || lv < st.best.lv) st.best = { lv, ep: st.ep, params: Float64Array.from(st.net.params) };
    });
    sim.onDraw(() => {
      const net = st.net, saved = sim.p.early && st.best ? Float64Array.from(net.params) : null;
      if (saved) net.params.set(st.best.params);
      const view = ML.view2(cm, 2.2);
      ML.draw.clear(cm);
      ML.probMap(view, (a, b) => net.predict1([a, b])[0], { res: 5, alpha: 0.6 });
      ML.contour(view, (a, b) => net.predict1([a, b])[0] - 0.5, 0, { res: 4, width: 2 });
      ML.points(view, st.tr.X, st.tr.y, { r: 4 });
      const accNow = L.met.accuracy(st.va.y, st.va.X.map((x) => (net.predict1(x)[0] >= 0.5 ? 1 : 0)));
      if (saved) net.params.set(saved);
      ML.draw.clear(cl);
      const H = st.hist, ymax = Math.min(2.5, Math.max(0.8, ...H.map((h) => h[2]))) * 1.05;
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 600, ymin: 0, ymax, xlabel: 'época', ylabel: 'log-loss', title: 'entrenamiento y validación' });
      pl.frame();
      if (H.length > 1) { pl.path(H.map((h) => [h[0], h[1]]), { color: '--c3', width: 2 }); pl.path(H.map((h) => [h[0], Math.min(h[2], ymax)]), { color: '--c2', width: 2.2 }); }
      if (st.best) pl.vline(st.best.ep, { color: '--c2', label: 'mínimo' });
      pl.legend([{ label: 'entrenamiento', color: '--c3' }, { label: 'validación', color: '--c2' }], 'tl');
      let accBest = '—';
      if (st.best) { const cur = Float64Array.from(net.params); net.params.set(st.best.params); accBest = pct(L.met.accuracy(st.va.y, st.va.X.map((x) => (net.predict1(x)[0] >= 0.5 ? 1 : 0)))); net.params.set(cur); }
      const accFinal = pct(L.met.accuracy(st.va.y, st.va.X.map((x) => (net.predict1(x)[0] >= 0.5 ? 1 : 0))));
      sim.set('best', st.best ? `${f3(st.best.lv)} en la época ${st.best.ep}` : '—');
      sim.set('acc', `${accFinal} / ${accBest}`);
      void accNow;
    });
  });

  /* ======================================================================
     26.3 Programas de tasa de aprendizaje
     ====================================================================== */
  ML.defineSim('programa-tasa', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1.05 }), cl = sim.canvas({ aspect: 1.05 });
    sim.group('Tasa base');
    sim.slider('lr', { label: 'Tasa máxima de Adam', min: 0.003, max: 0.3, value: 0.08, log: true, step: 0.001, fmt: f3 });
    sim.out('fin', 'Pérdida final (constante / escalones / coseno / calentamiento + coseno)', { wide: true });
    const E = 150;
    const SCH = {
      const: { n: 'constante', f: () => 1, c: '--c6' },
      step: { n: 'escalones (÷10 en 50 % y 75 %)', f: (e) => (e < 0.5 * E ? 1 : e < 0.75 * E ? 0.1 : 0.01), c: '--c4' },
      cos: { n: 'coseno', f: (e) => 0.5 * (1 + Math.cos((Math.PI * e) / E)), c: '--c1' },
      warm: { n: 'calentamiento + coseno', f: (e) => (e < 10 ? (e + 1) / 10 : 0.5 * (1 + Math.cos((Math.PI * (e - 10)) / (E - 10)))), c: '--c3' }
    };
    let st;
    const restart = () => {
      const tr = L.data.make2d('spiral', 300, 0.2, L.rng(3));
      st = { tr, ep: 0, runs: Object.keys(SCH).map((k) => ({ k, net: L.nn.mlp({ sizes: [2, 16, 16, 1], act: 'tanh', rng: L.rng(5), init: 'xavier' }), opt: L.opt.make('adam', { lr: sim.p.lr }), hist: [] })) };
    };
    restart();
    sim.onChange = () => restart();
    sim.animate(() => {
      if (st.ep >= E) return;
      for (const r of st.runs) { r.opt.lr = sim.p.lr * SCH[r.k].f(st.ep); r.net.epoch(st.tr.X, st.tr.y, r.opt, { batch: 32, rng: L.rng(st.ep + 3) }); r.hist.push([st.ep + 1, r.net.loss(st.tr.X, st.tr.y)]); }
      st.ep++;
    });
    sim.onDraw(() => {
      ML.draw.clear(cs);
      const ps = new ML.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: E, ymin: 0, ymax: 1.08, xlabel: 'época', ylabel: 'tasa / tasa máxima', title: 'programas de tasa' });
      ps.frame();
      Object.values(SCH).forEach((s) => ps.fn(s.f, { color: s.c, width: 2.2, n: 300 }));
      ps.legend(Object.values(SCH).map((s) => ({ label: s.n, color: s.c })), 'bl');
      ML.draw.clear(cl);
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: E, ymin: 0.005, ymax: 1, ylog: true, xlabel: 'época', ylabel: 'pérdida de entrenamiento (log)', title: 'espirales, red 2–16–16–1' });
      pl.frame();
      st.runs.forEach((r) => { if (r.hist.length > 1) pl.path(r.hist.map((h) => [h[0], Math.max(0.005, h[1])]), { color: SCH[r.k].c, width: 2 }); });
      sim.set('fin', st.runs.map((r) => (r.hist.length ? f3(r.hist[r.hist.length - 1][1]) : '—')).join(' / '));
    });
  });
})();
