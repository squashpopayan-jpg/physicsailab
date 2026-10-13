/* Capítulo 28 — Secuencias, embeddings y atención */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     28.1 Embeddings y analogías (espacio de juguete)
     ====================================================================== */
  const EMB = {
    rey: [2.0, 1.6], reina: [2.0, -1.6], hombre: [0.4, 1.5], mujer: [0.4, -1.5], príncipe: [1.5, 1.2], princesa: [1.5, -1.2],
    niño: [-0.2, 1.1], niña: [-0.2, -1.1], gato: [-1.8, 0.3], gata: [-1.8, -0.4], perro: [-2.1, 0.5], perra: [-2.1, -0.3]
  };
  ML.defineSim('embeddings', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const W = Object.keys(EMB);
    sim.group('Analogía: a − b + c');
    sim.select('a', { label: 'a', options: W.map((w) => [w, w]), value: 'rey' });
    sim.select('b', { label: 'b', options: W.map((w) => [w, w]), value: 'hombre' });
    sim.select('c', { label: 'c', options: W.map((w) => [w, w]), value: 'mujer' });
    sim.out('res', 'Vecino más cercano por coseno', { hl: true });
    sim.out('sim', 'Similitud coseno con las palabras más parecidas', { wide: true });
    const cos = (u, v) => (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
    sim.onDraw(() => {
      const a = EMB[sim.p.a], b = EMB[sim.p.b], c = EMB[sim.p.c], t = [a[0] - b[0] + c[0], a[1] - b[1] + c[1]];
      const view = new ML.View2D(cv, { xmin: -3, xmax: 3.2, ymin: -2.2, ymax: 2.2 });
      ML.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      W.forEach((w) => { const p = EMB[w]; ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(p[0]), view.Y(p[1]), { color: '--c6', width: 1, alpha: 0.5 }); ctx.beginPath(); ctx.arc(view.X(p[0]), view.Y(p[1]), 4, 0, 7); ctx.fillStyle = ML.col('--c1'); ctx.fill(); ML.text(ctx, w, view.X(p[0]) + 6, view.Y(p[1]) - 6, { size: 12, color: '--ink', halo: true }); });
      ML.draw.arrow(ctx, view.X(b[0]), view.Y(b[1]), view.X(a[0]), view.Y(a[1]), { color: '--c4', width: 2.4, dash: [5, 3] });
      ML.draw.arrow(ctx, view.X(c[0]), view.Y(c[1]), view.X(t[0]), view.Y(t[1]), { color: '--c2', width: 2.6 });
      ML.cross(view, t[0], t[1], { color: '--c2' });
      ML.text(ctx, 'a − b + c', view.X(t[0]) + 8, view.Y(t[1]) + 16, { size: 12, color: '--c2', halo: true, weight: 650 });
      ML.text(ctx, 'eje horizontal ≈ «humano/realeza frente a animal» · eje vertical ≈ «masculino frente a femenino»', 10, cv.h - 10, { size: 11, color: '--ink-2', halo: true });
      const cand = W.filter((w) => ![sim.p.a, sim.p.b, sim.p.c].includes(w)).map((w) => [w, cos(t, EMB[w])]).sort((x, y) => y[1] - x[1]);
      sim.set('res', `${cand[0][0]} (coseno ${f3(cand[0][1])})`);
      sim.set('sim', cand.slice(0, 5).map(([w, v]) => `${w} ${f2(v)}`).join(' · '));
    });
  });

  /* ======================================================================
     28.2 Calculadora de autoatención
     ====================================================================== */
  ML.defineSim('atencion', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 }), cb = sim.canvas({ aspect: 1 });
    const TOK = ['el', 'gato', 'que', 'vi', 'ayer', 'duerme'];
    sim.group('Autoatención (d = 8)');
    sim.select('q', { label: 'Token que pregunta (fila)', options: TOK.map((t, i) => [i, t]), value: 5 });
    sim.slider('T', { label: 'Temperatura del softmax', min: 0.1, max: 3, step: 0.05, value: 1, fmt: f2 });
    sim.check('scale', { label: 'Dividir por √d', value: true });
    sim.check('causal', { label: 'Máscara causal (solo mira hacia atrás)', value: false });
    sim.check('pos', { label: 'Sumar codificación posicional', value: true });
    sim.button('Otras matrices Q, K, V', () => { seed++; }, { id: 'seed' });
    sim.out('ent', 'Entropía de la fila elegida', { hl: true });
    sim.out('top', 'Token más atendido');
    let seed = 1;
    const d = 8;
    sim.onDraw(() => {
      const r = L.rng(10 + seed), rq = L.rng(1);
      const E = TOK.map(() => Array.from({ length: d }, () => rq.gauss()));
      E[1] = E[1].map((v, j) => v + (j < 2 ? 1.5 : 0)); E[5] = E[5].map((v, j) => v + (j < 2 ? 1.2 : 0));
      const Xin = E.map((e, i) => (sim.p.pos ? e.map((v, j) => v + (j % 2 ? Math.cos(i / Math.pow(100, (j - 1) / d)) : Math.sin(i / Math.pow(100, j / d)))) : e));
      const M = () => Array.from({ length: d }, () => Array.from({ length: d }, () => r.gauss() / Math.sqrt(d)));
      const Wq = M(), Wk = M(), Wv = M();
      const mul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
      const Q = mul(Xin, Wq), K = mul(Xin, Wk), V = mul(Xin, Wv);
      const at = L.nn.attention(Q, K, V, { scale: sim.p.scale, causal: sim.p.causal, T: sim.p.T });
      ML.draw.clear(cm);
      ML.matrix(cm.ctx, { x: 4, y: 4, w: cm.w - 8, h: cm.h - 8 }, at.A, { rows: TOK, cols: TOK, fmt: (v) => ML.fix(v, 2), max: 1, color: '--c5', rowW: 56, colH: 30 });
      const q = +sim.p.q, row = at.A[q];
      ML.draw.clear(cb);
      ML.text(cb.ctx, `pesos con los que «${TOK[q]}» combina los valores`, 10, 16, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cb.ctx, { x: 6, y: 28, w: cb.w - 12, h: cb.h - 36 }, row.map((v, j) => ({ label: TOK[j], value: v, color: j === U.argmax(row) ? '--c5' : '--c6' })), { labelW: 64, min: 0, max: 1, fmt: f3, barH: 20 });
      const H = -row.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0);
      sim.set('ent', `${f3(H)} nats (máximo ${f3(Math.log(sim.p.causal ? q + 1 : TOK.length))})`);
      sim.set('top', TOK[U.argmax(row)]);
    });
  });

  /* ======================================================================
     28.3 Temperatura y muestreo del siguiente token
     ====================================================================== */
  ML.defineSim('temperatura', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const CAND = ['pescado', 'croquetas', 'ratones', 'atún', 'pasto', 'papel', 'piedras'];
    const LOG = [3.1, 2.6, 2.0, 1.7, 0.2, -0.6, -2.0];
    sim.group('«El gato come …»');
    sim.slider('T', { label: 'Temperatura T', min: 0.05, max: 3, step: 0.05, value: 1, fmt: f2 });
    sim.slider('topk', { label: 'Top-k (0 = sin límite)', min: 0, max: 7, step: 1, value: 0, fmt: (v) => ML.fix(v, 0) });
    sim.slider('topp', { label: 'Top-p (núcleo)', min: 0.1, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.button('Muestrear 200 continuaciones', () => { seed++; }, { primary: true, id: 'samp' });
    sim.out('H', 'Entropía de la distribución', { hl: true });
    sim.out('cand', 'Candidatos permitidos');
    let seed = 1;
    sim.onDraw(() => {
      let p = U.softmax(LOG, sim.p.T);
      const ord = U.argsort(p, true), keep = new Set();
      let acc = 0;
      for (const i of ord) { if (sim.p.topk && keep.size >= sim.p.topk) break; if (acc >= sim.p.topp && keep.size) break; keep.add(i); acc += p[i]; }
      p = p.map((v, i) => (keep.has(i) ? v : 0)); const s = U.sum(p); p = p.map((v) => v / s);
      const r = L.rng(seed), cnt = new Array(CAND.length).fill(0);
      for (let t = 0; t < 200; t++) { let u = r(), k = 0; while (k < p.length - 1 && u > p[k]) { u -= p[k]; k++; } cnt[k]++; }
      ML.draw.clear(cv);
      const w2 = cv.w / 2;
      ML.text(cv.ctx, 'probabilidad de cada continuación', 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.text(cv.ctx, 'frecuencia en 200 muestras', w2 + 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 28, w: w2 - 12, h: cv.h - 36 }, p.map((v, i) => ({ label: CAND[i], value: v, color: keep.has(i) ? '--c1' : '--c6', alpha: keep.has(i) ? 0.85 : 0.3 })), { labelW: 80, min: 0, max: 1, fmt: f3, barH: 18 });
      ML.hbars(cv.ctx, { x: w2 + 6, y: 28, w: w2 - 12, h: cv.h - 36 }, cnt.map((v, i) => ({ label: CAND[i], value: v, color: '--c3' })), { labelW: 80, min: 0, max: 200, fmt: (v) => String(v), barH: 18 });
      const H = -p.reduce((a, v) => a + (v > 0 ? v * Math.log(v) : 0), 0);
      sim.set('H', `${f3(H)} nats`);
      sim.set('cand', CAND.filter((_, i) => keep.has(i)).join(', '));
    });
  });
})();
