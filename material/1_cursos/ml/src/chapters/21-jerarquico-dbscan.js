/* Capítulo 21 — Agrupamiento jerárquico y por densidad */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);
  const DATA = {
    blobs: { n: 'Tres nubes', f: (r) => L.data.blobs(60, [[-1, -0.7], [1, -0.6], [0, 1]], 0.3, r).X },
    moons: { n: 'Lunas', f: (r) => L.data.moons(60, 0.06, r).X.map(([a, b]) => [1.3 * (a - 0.5), 1.6 * (b - 0.25)]) },
    chain: { n: 'Dos nubes y un puente', f: (r) => [...L.data.blobs(50, [[-1.1, 0], [1.1, 0]], 0.3, r).X, ...Array.from({ length: 10 }, (_, i) => [-0.6 + 0.12 * i, 0.05 * r.gauss()])] }
  };

  /* ======================================================================
     21.1 Dendrograma y cortes
     ====================================================================== */
  ML.defineSim('dendrograma', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 }), cd = sim.canvas({ aspect: 1 });
    sim.group('Datos');
    sim.select('kind', { label: 'Conjunto', options: Object.keys(DATA).map((k) => [k, DATA[k].n]), value: 'blobs' });
    sim.group('Aglomerativo');
    sim.seg('link', { label: 'Enlace', options: [['ward', 'Ward'], ['average', 'Promedio'], ['complete', 'Completo'], ['single', 'Simple']], value: 'ward' });
    sim.slider('k', { label: 'Número de grupos (corte)', min: 1, max: 8, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('h', 'Altura del corte', { hl: true });
    sim.out('sizes', 'Tamaños de los grupos');
    sim.onDraw(() => {
      const X = DATA[sim.p.kind].f(L.rng(4)), n = X.length;
      const merges = L.clu.agglo(X, sim.p.link), k = Math.round(sim.p.k);
      const lab = L.clu.cutK(merges, n, k);
      const hcut = k <= 1 ? merges[n - 2][2] * 1.02 : (merges[n - k - 1][2] + merges[n - k][2]) / 2;
      const view = ML.view2(cs, 2.2);
      ML.draw.clear(cs);
      view.grid({ labels: false });
      ML.points(view, X, lab, { r: 4.2 });
      ML.draw.clear(cd);
      const box = { x: 40, y: 16, w: cd.w - 50, h: cd.h - 40 };
      const leafCol = new Map(); U.range(n).forEach((i) => leafCol.set(i, lab[i]));
      const memb = new Map();
      merges.forEach((m, s) => { const a = m[0] < n ? [m[0]] : memb.get(m[0]), b = m[1] < n ? [m[1]] : memb.get(m[1]); memb.set(n + s, a.concat(b)); });
      const colorOf = (id) => { const ms = memb.get(id); const c = lab[ms[0]]; return ms.every((i) => lab[i] === c) ? ML.kcol(c) : ML.col('--ink-3'); };
      const r = ML.drawDendro(cd.ctx, box, merges, n, { cut: k > 1 ? hcut : undefined, colorOf });
      const pl = new ML.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: 1, ymin: 0, ymax: r.hmax, ml: 40, mr: 10, mt: 16, mb: 24, xticks: [], frame: true, grid: false, ylabel: 'distancia de fusión', zero: false });
      pl.frame();
      const sizes = U.range(k).map((c) => lab.filter((v) => v === c).length);
      sim.set('h', k > 1 ? f3(hcut) : '—');
      sim.set('sizes', sizes.join(' · '));
    });
  });

  /* ======================================================================
     21.2 DBSCAN: núcleos, bordes y ruido
     ====================================================================== */
  ML.defineSim('dbscan', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 }), ck = sim.canvas({ aspect: 1 });
    sim.group('Datos');
    sim.seg('kind', { options: [['moons', 'Lunas + ruido'], ['dens', 'Densidades distintas'], ['circ', 'Círculos']], value: 'moons' });
    sim.group('DBSCAN');
    sim.slider('eps', { label: 'Radio ε', min: 0.03, max: 0.6, step: 0.005, value: 0.25, fmt: f3 });
    sim.slider('mp', { label: 'Vecinos mínimos (minPts)', min: 2, max: 20, step: 1, value: 5, fmt: (v) => ML.fix(v, 0) });
    sim.check('circles', { label: 'Dibujar el radio ε de cada núcleo', value: false });
    sim.out('ng', 'Grupos encontrados', { hl: true });
    sim.out('noise', 'Puntos de ruido');
    sim.out('kinds', 'Núcleos / bordes');
    const make = (kind) => {
      const r = L.rng(8);
      if (kind === 'moons') { const d = L.data.moons(260, 0.06, r).X.map(([a, b]) => [1.3 * (a - 0.5), 1.6 * (b - 0.25)]); for (let i = 0; i < 18; i++) d.push([r.uniform(-2, 2), r.uniform(-1.6, 1.8)]); return d; }
      if (kind === 'dens') return L.data.blobs(280, [[-1, 0], [1, 0.2]], [0.15, 0.55], r).X;
      return L.data.circles(260, 0.05, 0.45, r).X.map(([a, b]) => [1.5 * a, 1.5 * b]);
    };
    let cache = null;
    sim.onDraw(() => {
      if (!cache || cache.kind !== sim.p.kind) cache = { kind: sim.p.kind, X: make(sim.p.kind) };
      const X = cache.X, mp = Math.round(sim.p.mp);
      const db = L.clu.dbscan(X, sim.p.eps, mp);
      const view = ML.view2(cs, 2.2);
      ML.draw.clear(cs);
      view.grid({ labels: false });
      const ctx = cs.ctx;
      if (sim.p.circles) X.forEach((x, i) => { if (db.core[i]) { ctx.beginPath(); ctx.arc(view.X(x[0]), view.Y(x[1]), sim.p.eps * view.s, 0, 7); ctx.strokeStyle = ML.alpha(ML.kvar(db.lab[i]), 0.25); ctx.stroke(); } });
      X.forEach((x, i) => {
        const l = db.lab[i], px = view.X(x[0]), py = view.Y(x[1]);
        ctx.beginPath();
        if (l < 0) { ctx.moveTo(px - 3.5, py - 3.5); ctx.lineTo(px + 3.5, py + 3.5); ctx.moveTo(px + 3.5, py - 3.5); ctx.lineTo(px - 3.5, py + 3.5); ctx.strokeStyle = ML.col('--ink-3'); ctx.lineWidth = 1.5; ctx.stroke(); return; }
        ctx.arc(px, py, db.core[i] ? 4.2 : 3, 0, 7);
        if (db.core[i]) { ctx.fillStyle = ML.kcol(l); ctx.fill(); } else { ctx.fillStyle = ML.col('--canvas'); ctx.fill(); ctx.strokeStyle = ML.kcol(l); ctx.lineWidth = 1.6; ctx.stroke(); }
      });
      ML.text(ctx, 'relleno: núcleo · hueco: borde · ×: ruido', 10, cs.h - 10, { size: 11, color: '--ink-2', halo: true });
      ML.draw.clear(ck);
      const kd = L.clu.kdist(X, mp).sort((a, b) => a - b);
      const pk = new ML.Plot(ck.ctx, { x: 0, y: 0, w: ck.w, h: ck.h, xmin: 0, xmax: kd.length, ymin: 0, ymax: Math.min(1, kd[kd.length - 1] * 1.05), xlabel: 'puntos ordenados', ylabel: `distancia al ${mp}.º vecino`, title: 'gráfica de distancias k (elegir ε en el codo)' });
      pk.frame();
      pk.path(kd.map((v, i) => [i, v]), { color: '--c5', width: 2.2 });
      pk.hline(sim.p.eps, { color: '--c2', label: 'ε actual' });
      sim.set('ng', String(db.nClusters));
      sim.set('noise', String(db.lab.filter((v) => v < 0).length));
      sim.set('kinds', `${db.core.filter(Boolean).length} / ${db.lab.filter((v, i) => v >= 0 && !db.core[i]).length}`);
    });
  });
})();
