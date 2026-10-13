/* Capítulo 20 — Agrupamiento por particiones: k-medias y mezclas gaussianas */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);
  const CENT = [[-1.2, -0.8], [1.1, -0.9], [0, 1.1], [1.3, 1.2], [-1.4, 1.0], [0.1, -0.1]];
  const blobs = (k, sd, n, seed) => L.data.blobs(n, CENT.slice(0, k), sd, L.rng(seed));

  /* ======================================================================
     20.1 k-medias paso a paso
     ====================================================================== */
  ML.defineSim('kmeans-pasos', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.45, cls: 'full' }), ci = sim.canvas({ aspect: 4.5, cls: 'full' });
    sim.group('Datos');
    sim.slider('true', { label: 'Grupos verdaderos', min: 2, max: 6, step: 1, value: 4, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sd', { label: 'Dispersión', min: 0.15, max: 0.8, step: 0.01, value: 0.4, fmt: f2 });
    sim.group('k-medias');
    sim.slider('k', { label: 'k', min: 1, max: 8, step: 1, value: 4, fmt: (v) => ML.fix(v, 0) });
    sim.seg('init', { label: 'Inicialización', options: [['random', 'Aleatoria'], ['pp', 'k-means++'], ['bad', 'Amontonada']], value: 'random' });
    sim.button('Paso', () => step(), { primary: true, id: 'step' });
    sim.button('Reiniciar centros', () => { seed++; restart(); }, { id: 'reinit' });
    sim.check('auto', { label: 'Pasos automáticos', value: false });
    sim.out('it', 'Fase');
    sim.out('inertia', 'Inercia (suma de distancias²)', { hl: true });
    sim.out('conv', 'Estado');
    let seed = 1, d, C, lab, phase, hist, trails, conv;
    const restart = () => {
      d = blobs(Math.round(sim.p.true), sim.p.sd, 300, 7);
      const k = Math.round(sim.p.k), r = L.rng(30 + seed);
      C = sim.p.init === 'pp' ? L.clu.initPP(d.X, k, r) : sim.p.init === 'bad' ? Array.from({ length: k }, (_, j) => [-1.6 + 0.12 * j, -1.5 + 0.1 * r()]) : L.clu.initRandom(d.X, k, r);
      lab = null; phase = 0; hist = []; trails = C.map((c) => [c.slice()]); conv = false;
    };
    const step = () => {
      if (conv) return;
      if (phase % 2 === 0) { const a = L.clu.assign(d.X, C); if (lab && a.lab.every((v, i) => v === lab[i])) conv = true; lab = a.lab; hist.push(a.inertia); }
      else { C = L.clu.update(d.X, lab, C.length, C); C.forEach((c, j) => trails[j].push(c.slice())); hist.push(L.clu.assign(d.X, C).inertia); }
      phase++;
    };
    restart();
    sim.onChange = (id) => { if (id !== 'auto') restart(); };
    let acc = 0;
    sim.animate((dt) => { if (!sim.p.auto) return; acc += dt; if (acc > 0.5) { acc = 0; step(); } });
    sim.onDraw(() => {
      const view = ML.view2(cv, 2.6);
      ML.draw.clear(cv);
      const near = (a, b) => { let k = 0, bd = Infinity; C.forEach((c, j) => { const q = (a - c[0]) ** 2 + (b - c[1]) ** 2; if (q < bd) { bd = q; k = j; } }); return k; };
      ML.heatmap(view, (a, b) => { const k = near(a, b), c = ML.rgb(ML.kvar(k)), bg = ML.rgb('--canvas'); return [bg[0] + (c[0] - bg[0]) * 0.16, bg[1] + (c[1] - bg[1]) * 0.16, bg[2] + (c[2] - bg[2]) * 0.16, 1]; }, { res: 4 });
      ML.labelEdges(view, near, { res: 3, width: 1.2, alpha: 0.6 });
      ML.points(view, d.X, lab || d.X.map(() => -1), { r: 3.2 });
      const ctx = cv.ctx;
      trails.forEach((t, j) => { ctx.save(); ctx.strokeStyle = ML.col('--ink'); ctx.setLineDash([3, 3]); ctx.beginPath(); t.forEach((p, i) => (i ? ctx.lineTo(view.X(p[0]), view.Y(p[1])) : ctx.moveTo(view.X(p[0]), view.Y(p[1])))); ctx.stroke(); ctx.restore(); void j; });
      C.forEach((c, j) => { ctx.beginPath(); ctx.arc(view.X(c[0]), view.Y(c[1]), 9, 0, 7); ctx.fillStyle = ML.kcol(j); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ML.col('--ink'); ctx.stroke(); });
      ML.text(ctx, phase % 2 === 0 ? 'siguiente paso: asignar cada punto al centro más cercano' : 'siguiente paso: mover cada centro a la media de sus puntos', 10, 18, { size: 11.5, color: '--ink', halo: true });
      ML.draw.clear(ci);
      const pl = new ML.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: 0, xmax: Math.max(4, hist.length), ymin: 0, ymax: hist.length ? hist[0] * 1.05 : 1, xlabel: 'medio paso', ylabel: 'inercia', mb: 34 });
      pl.frame();
      if (hist.length) { pl.path(hist.map((v, i) => [i + 1, v]), { color: '--c5', width: 2.2 }); hist.forEach((v, i) => pl.dot(i + 1, v, { color: '--c5', r: 3 })); }
      sim.set('it', `${Math.floor(phase / 2)} iteraciones`);
      sim.set('inertia', hist.length ? f2(hist[hist.length - 1]) : '—');
      sim.set('conv', conv ? 'convergió: las asignaciones no cambian' : 'en curso');
    });
  });

  /* ======================================================================
     20.2 Codo y silueta
     ====================================================================== */
  ML.defineSim('codo-silueta', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 1.05 }), cs = sim.canvas({ aspect: 1.05 });
    sim.group('Datos');
    sim.slider('true', { label: 'Grupos verdaderos', min: 2, max: 6, step: 1, value: 4, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sd', { label: 'Dispersión', min: 0.15, max: 0.9, step: 0.01, value: 0.35, fmt: f2 });
    sim.slider('k', { label: 'k para el gráfico de silueta', min: 2, max: 8, step: 1, value: 4, fmt: (v) => ML.fix(v, 0) });
    sim.out('best', 'k con mayor silueta media', { hl: true });
    sim.out('s', 'Silueta media con este k');
    let cache = null;
    sim.onDraw(() => {
      const key = `${sim.p.true}|${sim.p.sd}`;
      if (!cache || cache.key !== key) {
        const d = blobs(Math.round(sim.p.true), sim.p.sd, 240, 11);
        const res = [];
        for (let k = 1; k <= 8; k++) { const km = L.clu.kmeans(d.X, k, { rng: L.rng(k), nInit: 5 }); res.push({ k, inertia: km.inertia, lab: km.lab, sil: k > 1 ? L.met.silhouetteSamples(d.X, km.lab) : null }); }
        cache = { key, d, res };
      }
      const { res } = cache, k = Math.round(sim.p.k);
      ML.draw.clear(ce);
      const h1 = ce.h / 2;
      const pi = new ML.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: h1, xmin: 1, xmax: 8, ymin: 0, ymax: res[0].inertia * 1.05, ylabel: 'inercia', title: 'método del codo', mb: 22 });
      pi.frame();
      pi.path(res.map((r) => [r.k, r.inertia]), { color: '--c5', width: 2.2 });
      res.forEach((r) => pi.dot(r.k, r.inertia, { color: r.k === k ? '--accent' : '--c5', r: 3.5 }));
      const sm = res.slice(1).map((r) => [r.k, L.stat.mean(r.sil)]);
      const ps = new ML.Plot(ce.ctx, { x: 0, y: h1, w: ce.w, h: ce.h - h1, xmin: 1, xmax: 8, ymin: 0, ymax: 1, xlabel: 'k', ylabel: 'silueta media', title: 'silueta media' });
      ps.frame();
      ps.path(sm, { color: '--c3', width: 2.2 });
      sm.forEach((r) => ps.dot(r[0], r[1], { color: r[0] === k ? '--accent' : '--c3', r: 3.5 }));
      ML.draw.clear(cs);
      const r = res[k - 1], ctx = cs.ctx;
      const order = U.range(r.lab.length).sort((a, b) => r.lab[a] - r.lab[b] || r.sil[b] - r.sil[a]);
      const pl = new ML.Plot(ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: -0.3, xmax: 1, ymin: 0, ymax: order.length + 10 * k, xlabel: 'coeficiente de silueta s(i)', ylabel: 'puntos, agrupados por grupo', title: `gráfico de silueta con k = ${k}`, yticks: [] });
      pl.frame();
      let yy = 5, prev = -1;
      pl.clip(() => { order.forEach((i) => { if (r.lab[i] !== prev) { yy += 10; prev = r.lab[i]; } ctx.fillStyle = ML.alpha(ML.kvar(r.lab[i]), 0.8); const x0 = pl.X(0), x1 = pl.X(r.sil[i]); ctx.fillRect(Math.min(x0, x1), pl.Y(yy + 1), Math.abs(x1 - x0), Math.max(1, pl.Y(yy) - pl.Y(yy + 1))); yy++; }); });
      pl.vline(L.stat.mean(r.sil), { color: '--c2', label: 'media' });
      pl.vline(0, { color: '--ink', dash: [] });
      const best = sm.reduce((a, b) => (b[1] > a[1] ? b : a));
      sim.set('best', `k = ${best[0]} (${f3(best[1])})`);
      sim.set('s', f3(L.stat.mean(r.sil)));
    });
  });

  /* ======================================================================
     20.3 Mezcla gaussiana por EM
     ====================================================================== */
  ML.defineSim('gmm-em', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.45, cls: 'full' }), cl = sim.canvas({ aspect: 4.5, cls: 'full' });
    sim.group('Datos');
    sim.seg('kind', { options: [['long', 'Alargados'], ['sizes', 'Tamaños distintos'], ['round', 'Redondos']], value: 'long' });
    sim.group('EM');
    sim.slider('k', { label: 'Componentes', min: 1, max: 5, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.button('Paso EM', () => step(), { primary: true, id: 'step' });
    sim.button('Nueva inicialización', () => { seed++; restart(); }, { id: 'reinit' });
    sim.check('auto', { label: 'Pasos automáticos', value: true });
    sim.check('km', { label: 'Comparar con las etiquetas de k-medias', value: false });
    sim.out('ll', 'Log-verosimilitud media', { hl: true });
    sim.out('it', 'Iteraciones');
    sim.out('w', 'Pesos de los componentes');
    let seed = 1, X, comps, resp, hist, it;
    const make = () => {
      const r = L.rng(5);
      if (sim.p.kind === 'long') return L.data.gauss2([{ n: 200, mean: [0, -0.7], sd: [1.3, 0.18], rho: 0 }, { n: 200, mean: [0, 0.4], sd: [1.3, 0.18], rho: 0 }], r).X;
      if (sim.p.kind === 'sizes') return L.data.gauss2([{ n: 320, mean: [-0.6, 0], sd: [0.9, 0.7], rho: 0.3 }, { n: 60, mean: [1.3, 0.8], sd: [0.18, 0.18], rho: 0 }], r).X;
      return L.data.blobs(300, [[-1, -0.6], [1, -0.4], [0, 1]], 0.35, r).X;
    };
    const restart = () => {
      X = make(); it = 0; hist = [];
      const k = Math.round(sim.p.k), r = L.rng(80 + seed);
      comps = L.clu.initRandom(X, k, r).map((m) => ({ w: 1 / k, m, S: [[0.3, 0], [0, 0.3]] }));
      resp = null;
    };
    const step = () => { const s = L.clu.gmmStep(X, comps, 1e-4); comps = s.comps; resp = s.resp; hist.push(s.ll); it++; };
    restart();
    sim.onChange = (id) => { if (id === 'kind' || id === 'k') restart(); };
    let acc = 0;
    sim.animate((dt) => { if (!sim.p.auto || it > 200) return; acc += dt; if (acc > 0.12) { acc = 0; step(); } });
    sim.onDraw(() => {
      const view = ML.view2(cv, 2.3);
      ML.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      let lab = null;
      if (sim.p.km) { const km = L.clu.kmeans(X, comps.length, { rng: L.rng(3), nInit: 5 }); lab = km.lab; ML.points(view, X, lab, { r: 3.2 }); }
      else X.forEach((x, i) => {
        let c = [0, 0, 0];
        if (resp) resp[i].forEach((p, j) => { const q = ML.rgb(ML.kvar(j)); c = [c[0] + p * q[0], c[1] + p * q[1], c[2] + p * q[2]]; }); else c = ML.rgb('--ink-3');
        ctx.beginPath(); ctx.arc(view.X(x[0]), view.Y(x[1]), 3.2, 0, 7); ctx.fillStyle = ML.rgbStr(c); ctx.fill();
      });
      comps.forEach((c, j) => { ML.ellipse(view, c.m, c.S, { nsd: 2, color: ML.kvar(j), width: 2.4 }); ML.ellipse(view, c.m, c.S, { nsd: 1, color: ML.kvar(j), width: 1.2, dash: [4, 3] }); ML.cross(view, c.m[0], c.m[1], { color: ML.kvar(j) }); });
      ML.text(ctx, sim.p.km ? 'colores: grupos de k-medias (fronteras rectas entre centros)' : 'color de cada punto: mezcla de sus responsabilidades', 10, 18, { size: 11.5, color: '--ink', halo: true });
      ML.draw.clear(cl);
      const pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: Math.max(5, it), ymin: hist.length ? Math.min(...hist) - 0.05 : -3, ymax: hist.length ? Math.max(...hist) + 0.05 : -1, xlabel: 'iteración EM', ylabel: 'log L media', mb: 34 });
      pl.frame();
      if (hist.length > 1) pl.path(hist.map((v, i) => [i + 1, v]), { color: '--c3', width: 2.2 });
      sim.set('ll', hist.length ? f3(hist[hist.length - 1]) : '—');
      sim.set('it', String(it));
      sim.set('w', comps.map((c) => f2(c.w)).join(' · '));
    });
  });
})();
