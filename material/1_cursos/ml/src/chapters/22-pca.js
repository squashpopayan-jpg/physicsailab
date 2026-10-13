/* Capítulo 22 — Reducción de dimensionalidad: PCA, t-SNE y UMAP */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3), pct = (v) => ML.fix(100 * v, 1) + ' %';

  /* ======================================================================
     22.1 Proyectar sobre una recta: la dirección de máxima varianza
     ====================================================================== */
  ML.defineSim('pca-2d', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 }), cc = sim.canvas({ aspect: 1 });
    sim.group('Datos');
    sim.slider('rho', { label: 'Correlación', min: -0.95, max: 0.95, step: 0.01, value: 0.8, fmt: f2 });
    sim.slider('ratio', { label: 'Desviación de x₂ / x₁', min: 0.3, max: 2, step: 0.01, value: 0.8, fmt: f2 });
    sim.group('Proyección');
    sim.slider('ang', { label: 'Ángulo de la recta (grados)', min: 0, max: 180, step: 1, value: 0, fmt: (v) => ML.fix(v, 0) + '°' });
    sim.button('Ir a la primera componente', () => sim.ctl.ang.set(Math.round(cur.pcAng), true), { primary: true, id: 'pc1' });
    sim.out('var', 'Varianza de la proyección', { hl: true });
    sim.out('frac', 'Fracción de la varianza total');
    sim.out('pc', 'Autovalores de la covarianza');
    let cur = {};
    sim.onDraw(() => {
      const d = L.data.gauss2([{ n: 220, mean: [0, 0], sd: [0.8, 0.8 * sim.p.ratio], rho: sim.p.rho }], L.rng(6));
      const p = L.dr.pca(d.X), a = ML.M.rad(sim.p.ang), u = [Math.cos(a), Math.sin(a)];
      let pcAng = ML.M.deg(Math.atan2(p.comps[0][1], p.comps[0][0])); if (pcAng < 0) pcAng += 180; if (pcAng > 180) pcAng -= 180;
      cur.pcAng = pcAng;
      const proj = d.X.map((x) => (x[0] - p.mean[0]) * u[0] + (x[1] - p.mean[1]) * u[1]);
      const v = L.stat.variance(proj), tot = p.var[0] + p.var[1];
      const view = ML.view2(cv, 2.6);
      ML.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      ctx.save(); ctx.strokeStyle = ML.alpha('--c2', 0.35); ctx.lineWidth = 1;
      d.X.forEach((x, i) => { const q = [p.mean[0] + proj[i] * u[0], p.mean[1] + proj[i] * u[1]]; ctx.beginPath(); ctx.moveTo(view.X(x[0]), view.Y(x[1])); ctx.lineTo(view.X(q[0]), view.Y(q[1])); ctx.stroke(); });
      ctx.strokeStyle = ML.col('--c2'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(view.X(-4 * u[0]), view.Y(-4 * u[1])); ctx.lineTo(view.X(4 * u[0]), view.Y(4 * u[1])); ctx.stroke(); ctx.restore();
      ML.points(view, d.X, null, { r: 3 });
      proj.forEach((t) => { ctx.beginPath(); ctx.arc(view.X(t * u[0]), view.Y(t * u[1]), 2.2, 0, 7); ctx.fillStyle = ML.col('--c2'); ctx.fill(); });
      p.comps.forEach((c, j) => ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(2 * Math.sqrt(p.var[j]) * c[0]), view.Y(2 * Math.sqrt(p.var[j]) * c[1]), { color: j ? '--c3' : '--ink', width: 2.6 }));
      ML.text(ctx, 'flechas: componentes principales (largo = 2 desviaciones)', 10, cv.h - 10, { size: 11, color: '--ink-2', halo: true });
      ML.draw.clear(cc);
      const pl = new ML.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: 180, ymin: 0, ymax: p.var[0] * 1.15, xlabel: 'ángulo de la recta (grados)', ylabel: 'varianza proyectada', title: 'la CP1 maximiza la varianza' });
      pl.frame();
      pl.fn((g) => { const b = ML.M.rad(g), w = [Math.cos(b), Math.sin(b)]; return w[0] * w[0] * p.cov[0][0] + 2 * w[0] * w[1] * p.cov[0][1] + w[1] * w[1] * p.cov[1][1]; }, { color: '--c5', width: 2.2 });
      pl.vline(pcAng, { color: '--ink', label: 'CP1' });
      pl.dot(sim.p.ang, v, { color: '--c2', r: 5 });
      sim.set('var', f3(v));
      sim.set('frac', pct(v / tot));
      sim.set('pc', `${f3(p.var[0])}, ${f3(p.var[1])} (CP1 explica ${pct(p.ratio[0])})`);
    });
  });

  /* ======================================================================
     22.2 PCA de iris: puntuaciones y cargas
     ====================================================================== */
  ML.defineSim('pca-iris', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 1 }), cs = sim.canvas({ aspect: 1 });
    sim.group('PCA');
    sim.check('std', { label: 'Estandarizar las variables', value: true });
    sim.check('load', { label: 'Mostrar las cargas (biplot)', value: true });
    sim.out('ratio', 'Varianza explicada por componente', { hl: true });
    sim.out('c1', 'CP1 = combinación de');
    const names = ['largo sépalo', 'ancho sépalo', 'largo pétalo', 'ancho pétalo'];
    sim.onDraw(() => {
      let X = L.ds.iris.X;
      if (sim.p.std) X = L.data.standardizer(X).transform(X);
      const p = L.dr.pca(X), T = p.transform(X, 2);
      const r = Math.max(...T.map((t) => Math.max(Math.abs(t[0]), Math.abs(t[1])))) * 1.1;
      const view = new ML.View2D(cb, { xmin: -r, xmax: r, ymin: -r, ymax: r });
      ML.draw.clear(cb);
      view.grid({ labels: true, xlabel: 'CP1', ylabel: 'CP2' });
      ML.points(view, T, L.ds.iris.y, { r: 3.4, shapes: true });
      if (sim.p.load) {
        const ctx = cb.ctx, sc = r * 0.8;
        names.forEach((nm, j) => { const x = p.comps[0][j] * sc, y = p.comps[1][j] * sc; ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(x), view.Y(y), { color: '--c2', width: 2 }); ML.text(ctx, nm, view.X(x) + 4, view.Y(y) - 4, { size: 11, color: '--c2', halo: true, weight: 600 }); });
      }
      sim.legend(L.ds.iris.classes.map((c, k) => ({ label: c, color: ML.kvar(k), kind: 'dot' })));
      ML.draw.clear(cs);
      const pl = new ML.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0.4, xmax: 4.6, ymin: 0, ymax: 1, xlabel: 'componente', ylabel: 'fracción de varianza', title: 'gráfico de sedimentación', xticks: [1, 2, 3, 4] });
      pl.frame();
      let acc = 0;
      pl.clip((ctx) => { p.ratio.forEach((v, j) => { ctx.fillStyle = ML.alpha('--c1', 0.6); ctx.fillRect(pl.X(j + 1 - 0.3), pl.Y(v), pl.X(j + 1.3) - pl.X(j + 0.7), pl.Y(0) - pl.Y(v)); }); });
      pl.path(p.ratio.map((v, j) => { acc += v; return [j + 1, acc]; }), { color: '--c2', width: 2.2 });
      pl.legend([{ label: 'por componente', color: '--c1', kind: 'sq' }, { label: 'acumulada', color: '--c2' }], 'tr');
      sim.set('ratio', p.ratio.map((v) => pct(v)).join(' · '));
      sim.set('c1', names.map((nm, j) => `${f2(p.comps[0][j])} ${nm}`).join(', '));
    });
  });

  /* ======================================================================
     22.3 PCA de dígitos: reconstrucción con k componentes
     ====================================================================== */
  ML.defineSim('pca-digitos', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.group('Reconstrucción');
    sim.slider('k', { label: 'Componentes usados k', min: 0, max: 64, step: 1, value: 8, fmt: (v) => ML.fix(v, 0) });
    sim.slider('idx', { label: 'Imagen', min: 0, max: 699, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('ev', 'Varianza explicada con k componentes', { hl: true });
    sim.out('err', 'Error cuadrático medio de esta imagen');
    let p = null;
    sim.onDraw(() => {
      const X = L.ds.digits.X;
      if (!p) p = L.dr.pca(X);
      const k = Math.round(sim.p.k), x = X[Math.round(sim.p.idx)];
      const rec = k ? p.inverse(p.transform([x], k))[0] : p.mean.slice();
      const ctx = cv.ctx;
      ML.draw.clear(cv);
      const S = Math.min(cv.h - 40, cv.w * 0.18);
      ML.drawImage(ctx, { x: 14, y: 24, w: S, h: S }, x, 8, 8, { vmin: 0, vmax: 16 });
      ML.drawImage(ctx, { x: 24 + S, y: 24, w: S, h: S }, rec, 8, 8, { vmin: 0, vmax: 16 });
      ML.text(ctx, `original (dígito ${L.ds.digits.y[Math.round(sim.p.idx)]})`, 14, 16, { size: 11.5, color: '--ink-2' });
      ML.text(ctx, `con ${k} componentes`, 24 + S, 16, { size: 11.5, color: '--ink-2' });
      const x0 = 44 + 2 * S, cw = (cv.w - x0 - 10) / 4, ch = (cv.h - 40) / 2, s2 = Math.min(cw, ch) - 16;
      ML.text(ctx, 'las 8 primeras componentes («dígitos propios»)', x0, 16, { size: 11.5, color: '--ink-2' });
      for (let j = 0; j < 8; j++) {
        const bx = x0 + (j % 4) * cw, by = 24 + Math.floor(j / 4) * ch;
        ML.drawImage(ctx, { x: bx, y: by, w: s2, h: s2 }, p.comps[j], 8, 8, { diverging: true });
        ML.text(ctx, `CP${j + 1} · ${pct(p.ratio[j])}`, bx, by + s2 + 11, { size: 10, color: j < k ? '--ink' : '--ink-3', mono: true });
      }
      const ev = U.sum(p.ratio.slice(0, k));
      sim.set('ev', pct(ev));
      sim.set('err', f2(L.met.mse(x, rec)));
    });
  });

  /* ======================================================================
     22.4 t-SNE en vivo sobre dígitos
     ====================================================================== */
  ML.defineSim('tsne', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.group('t-SNE');
    sim.slider('perp', { label: 'Perplejidad', min: 2, max: 80, step: 1, value: 30, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otra semilla', () => { seed++; restart(); }, { id: 'seed' });
    sim.check('pca', { label: 'Comparar con PCA en 2D', value: false });
    sim.out('it', 'Iteración');
    sim.out('kl', 'Divergencia KL', { hl: true });
    let seed = 1, ts, X, y;
    const pick = () => { const idx = []; for (let c = 0; c < 10; c++) { let k = 0; L.ds.digits.y.forEach((v, i) => { if (v === c && k < 26) { idx.push(i); k++; } }); } X = idx.map((i) => L.ds.digits.X[i]); y = idx.map((i) => L.ds.digits.y[i]); };
    pick();
    const restart = () => { ts = L.dr.tsne(X, { perplexity: sim.p.perp, rng: L.rng(seed), lr: 100 }); };
    restart();
    sim.onChange = (id) => { if (id === 'perp') restart(); };
    sim.animate(() => { if (ts.it < 900) ts.step(4); });
    let pcaY = null;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      let Y = ts.Y;
      if (sim.p.pca) { if (!pcaY) pcaY = L.dr.pca(X).transform(X, 2); Y = pcaY; }
      const r = Math.max(1e-6, ...Y.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))) * 1.1;
      const view = new ML.View2D(cv, { xmin: -r, xmax: r, ymin: -r, ymax: r });
      const ctx = cv.ctx;
      const COLS = ['--k0', '--k1', '--k2', '--k3', '--k4', '--k5', '--c2', '--c6', '--c4', '--ink'];
      Y.forEach((p, i) => { const px = view.X(p[0]), py = view.Y(p[1]); ML.text(ctx, String(y[i]), px, py, { size: 12, mono: true, weight: 700, color: COLS[y[i]], align: 'center', baseline: 'middle' }); });
      ML.text(ctx, sim.p.pca ? 'PCA: las dos direcciones de máxima varianza' : 't-SNE: cada número es una imagen, en su posición del mapa', 10, 18, { size: 11.5, color: '--ink-2', halo: true });
      sim.set('it', `${ts.it}${ts.it < 100 ? ' (exageración temprana)' : ''}`);
      sim.set('kl', ts.it >= 100 ? f3(ts.kl) : '—');
    });
  });
})();
