/* Capítulo 25 — Retropropagación */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f3 = (v) => ML.fix(v, 3), f4 = (v) => ML.fix(v, 4);

  /* ======================================================================
     25.1 Grafo de cómputo de una red 2–2–1
     ====================================================================== */
  ML.defineSim('grafo-computo', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.5 });
    sim.group('Ejemplo');
    sim.slider('x1', { label: 'Entrada x₁', min: -2, max: 2, step: 0.05, value: 0.5, fmt: (v) => ML.fix(v, 2) });
    sim.slider('x2', { label: 'Entrada x₂', min: -2, max: 2, step: 0.05, value: -1, fmt: (v) => ML.fix(v, 2) });
    sim.seg('y', { label: 'Etiqueta y', options: [[1, '1'], [0, '0']], value: 1 });
    sim.group('Aprendizaje');
    sim.slider('eta', { label: 'Tasa η', min: 0.1, max: 5, step: 0.1, value: 1, fmt: (v) => ML.fix(v, 1) });
    sim.button('Un paso de descenso', () => step(), { primary: true, id: 'step' });
    sim.button('Pesos iniciales', () => { W = init(); hist = []; }, { id: 'reset' });
    sim.seg('show', { label: 'Mostrar', options: [['fwd', 'Hacia delante'], ['bwd', 'Gradientes']], value: 'bwd' });
    sim.out('L', 'Pérdida (entropía cruzada)', { hl: true });
    sim.out('p', 'Predicción p');
    sim.out('steps', 'Pasos dados');
    const init = () => ({ W1: [[0.3, -0.2], [0.8, 0.4]], b1: [0.1, -0.1], W2: [1.2, -0.7], b2: 0.05 });
    let W = init(), hist = [];
    const sig = U.sigmoid;
    const run = () => {
      const x = [sim.p.x1, sim.p.x2], y = sim.p.y;
      const z1 = [0, 1].map((j) => W.W1[j][0] * x[0] + W.W1[j][1] * x[1] + W.b1[j]), a1 = z1.map(sig);
      const z2 = W.W2[0] * a1[0] + W.W2[1] * a1[1] + W.b2, p = sig(z2);
      const Lv = -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
      const d2 = p - y, gW2 = a1.map((a) => d2 * a), d1 = [0, 1].map((j) => W.W2[j] * d2 * a1[j] * (1 - a1[j]));
      const gW1 = d1.map((d) => [d * x[0], d * x[1]]);
      return { x, y, z1, a1, z2, p, L: Lv, d2, gW2, d1, gW1 };
    };
    const step = () => { const r = run(), e = sim.p.eta; for (let j = 0; j < 2; j++) { W.W2[j] -= e * r.gW2[j]; W.b1[j] -= e * r.d1[j]; for (let i = 0; i < 2; i++) W.W1[j][i] -= e * r.gW1[j][i]; } W.b2 -= e * r.d2; hist.push(r.L); };
    sim.onDraw(() => {
      const r = run(), ctx = cv.ctx, Wd = cv.w, H = cv.h, bwd = sim.p.show === 'bwd';
      ML.draw.clear(cv);
      const col = [0.08, 0.32, 0.56, 0.78, 0.93].map((t) => t * Wd);
      const node = (x, y, title, val, sub, hl) => {
        ctx.save(); ctx.fillStyle = ML.col(hl ? '--accent-soft' : '--surface'); ctx.strokeStyle = ML.col('--rule-strong'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 50, y - 24, 100, 48, 6) : ctx.rect(x - 50, y - 24, 100, 48); ctx.fill(); ctx.stroke(); ctx.restore();
        ML.text(ctx, title, x, y - 8, { size: 11.5, color: '--ink-2', align: 'center' });
        ML.text(ctx, val, x, y + 9, { size: 12.5, mono: true, color: '--ink', align: 'center', weight: 600 });
        if (sub) ML.text(ctx, sub, x, y + 36, { size: 11, mono: true, color: '--c2', align: 'center', halo: true });
      };
      const edge = (x1, y1, x2, y2, lab, glab) => {
        ML.draw.arrow(ctx, x1 + 50, y1, x2 - 52, y2, { color: '--ink-3', width: 1.3 });
        const t = y1 === y2 ? 0.5 : 0.28, mx = x1 + 50 + t * (x2 - x1 - 102), my = y1 + t * (y2 - y1);
        ML.text(ctx, bwd ? glab : lab, mx, my - 6, { size: 10.5, mono: true, color: bwd ? '--c2' : '--ink-2', align: 'center', halo: true });
      };
      const ys = [H * 0.3, H * 0.7];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) edge(col[0], ys[i], col[1], ys[j], `w=${f3(W.W1[j][i])}`, `∂L/∂w=${f4(r.gW1[j][i])}`);
      for (let j = 0; j < 2; j++) edge(col[1], ys[j], col[2], ys[j], 'σ', `σ′=${f3(r.a1[j] * (1 - r.a1[j]))}`);
      for (let j = 0; j < 2; j++) edge(col[2], ys[j], col[3], H / 2, `w=${f3(W.W2[j])}`, `∂L/∂w=${f4(r.gW2[j])}`);
      for (let i = 0; i < 2; i++) node(col[0], ys[i], `entrada x${i ? '₂' : '₁'}`, f3(r.x[i]));
      for (let j = 0; j < 2; j++) node(col[1], ys[j], `z${j ? '₂' : '₁'} = w·x + b`, f3(r.z1[j]), bwd ? `δ = ${f4(r.d1[j])}` : '');
      for (let j = 0; j < 2; j++) node(col[2], ys[j], `a${j ? '₂' : '₁'} = σ(z)`, f3(r.a1[j]));
      node(col[3], H / 2, 'p = σ(w·a + b)', f3(r.p), bwd ? `δ = p − y = ${f4(r.d2)}` : '', true);
      node(col[4], H / 2, `pérdida (y = ${r.y})`, f3(r.L));
      ML.draw.arrow(ctx, col[3] + 50, H / 2, col[4] - 52, H / 2, { color: '--ink-3', width: 1.3 });
      ML.text(ctx, bwd ? 'hacia atrás: cada gradiente = (gradiente que llega) × (derivada local)' : 'hacia delante: cada nodo calcula su valor a partir de los anteriores', 10, 16, { size: 11.5, color: '--ink-2' });
      sim.set('L', f4(r.L));
      sim.set('p', f4(r.p));
      sim.set('steps', `${hist.length}` + (hist.length ? ` (pérdida inicial ${f4(hist[0])})` : ''));
    });
  });

  /* ======================================================================
     25.2 Gradientes por capa: desvanecimiento e inicialización
     ====================================================================== */
  ML.defineSim('gradientes-capas', function (sim) {
    sim.cols2();
    const cg = sim.canvas({ aspect: 1.1 }), ca = sim.canvas({ aspect: 1.1 });
    sim.group('Red profunda');
    sim.slider('depth', { label: 'Capas ocultas', min: 2, max: 20, step: 1, value: 10, fmt: (v) => ML.fix(v, 0) });
    sim.seg('act', { label: 'Activación', options: [['sigmoid', 'sigmoide'], ['tanh', 'tanh'], ['relu', 'ReLU']], value: 'sigmoid' });
    sim.seg('init', { label: 'Inicialización', options: [['small', 'N(0, 0.1²)'], ['xavier', 'Xavier'], ['he', 'He']], value: 'small' });
    sim.out('ratio', 'Gradiente capa 1 / última capa oculta', { hl: true });
    sim.out('sat', 'Desviación de las activaciones: capa 1 / última');
    const r0 = L.rng(2), X = Array.from({ length: 128 }, () => Array.from({ length: 16 }, () => r0.gauss())), Y = X.map((x) => (x[0] * x[1] > 0 ? 1 : 0));
    sim.onDraw(() => {
      const D = Math.round(sim.p.depth), sizes = [16, ...Array(D).fill(32), 1];
      const net = L.nn.mlp({ sizes, act: sim.p.act, rng: L.rng(5), init: sim.p.init === 'small' ? 'he' : sim.p.init, initScale: sim.p.init === 'small' ? 0.1 : undefined });
      const g = net.layerGradNorms(X, Y, L.util.range(128)).slice(0, D);
      const acts = [];
      X.slice(0, 64).forEach((x) => { const f = net.forward(x); for (let l = 1; l <= D; l++) { (acts[l - 1] = acts[l - 1] || []).push(...f.a[l]); } });
      const sat = acts.map((a) => L.stat.std(a, 0));
      ML.draw.clear(cg);
      const gmin = Math.max(1e-14, Math.min(...g)), gmax = Math.max(...g);
      const pl = new ML.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0.5, xmax: D + 0.5, ymin: Math.pow(10, Math.floor(Math.log10(gmin))), ymax: Math.pow(10, Math.ceil(Math.log10(gmax)) + 0.2), ylog: true, xlabel: 'capa (1 = junto a la entrada)', ylabel: 'norma media del gradiente', title: 'gradiente de los pesos de cada capa' });
      pl.frame();
      pl.clip((ctx) => { g.forEach((v, l) => { ctx.fillStyle = ML.alpha('--c5', 0.7); const x0 = pl.X(l + 0.6), x1 = pl.X(l + 1.4); ctx.fillRect(x0, pl.Y(v), x1 - x0, pl.iy + pl.ih - pl.Y(v)); }); });
      ML.draw.clear(ca);
      const pa = new ML.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: 0.5, xmax: D + 0.5, ymin: 0, ymax: Math.max(0.1, ...sat) * 1.15, xlabel: 'capa', ylabel: 'desviación de las activaciones', title: 'cuánta señal llega a cada capa' });
      pa.frame();
      pa.clip((ctx) => { sat.forEach((v, l) => { ctx.fillStyle = ML.alpha('--c2', 0.65); const x0 = pa.X(l + 0.6), x1 = pa.X(l + 1.4); ctx.fillRect(x0, pa.Y(v), x1 - x0, pa.Y(0) - pa.Y(v)); }); });
      sim.set('ratio', ML.sci(g[0] / g[D - 1], 2));
      sim.set('sat', `${f3(sat[0])} / ${f3(sat[D - 1])}`);
    });
  });
})();
