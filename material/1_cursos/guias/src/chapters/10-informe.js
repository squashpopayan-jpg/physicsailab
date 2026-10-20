/* Capítulo 10 — Del informe a la comunicación */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  EM.defineSim('grafica-buena', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const DEF = [['ejes', 'Ejes sin magnitud ni unidad'], ['unir', 'Puntos unidos con segmentos'], ['trunc', 'Escala vertical truncada'], ['inv', 'Variables invertidas en los ejes'], ['barras', 'Sin barras de incertidumbre'], ['modelo', 'Sin curva del modelo'], ['cifras', 'Rótulos con demasiadas cifras']];
    DEF.forEach(([k, t]) => sim.check(k, { label: t, value: false }));
    sim.out('n', 'Defectos activos', { hl: true });
    const r = L.rng(7);
    const Ls = [0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2], g = 9.776;
    const T = Ls.map((l) => 2 * Math.PI * Math.sqrt(l / g) * 10);
    const tN = T.map((t) => t + Math.SQRT2 * r.gauss(0, 0.09));
    const T2 = tN.map((t) => (t / 10) ** 2), eT2 = tN.map((t) => (2 * (t / 10) * 0.127) / 10);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      const xs = p.inv ? T2 : Ls, ys = p.inv ? Ls : T2;
      const yr = p.trunc ? [Math.min(...ys) * 0.97, Math.max(...ys) * 1.01] : [0, Math.max(...ys) * 1.1];
      const xr = [0, Math.max(...xs) * 1.1];
      const fmt = p.cifras ? (v) => v.toFixed(5).replace('.', ',') : null;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: xr[0], xmax: xr[1], ymin: yr[0], ymax: yr[1], xlabel: p.ejes ? 'x' : p.inv ? 'T² (s²)' : 'L (m)', ylabel: p.ejes ? 'y' : p.inv ? 'L (m)' : 'T² (s²)', xfmt: fmt, yfmt: fmt, ml: p.cifras ? 72 : 58 });
      pl.frame();
      if (!p.modelo) pl.fn((x) => (p.inv ? (x * g) / (4 * Math.PI * Math.PI) : (4 * Math.PI * Math.PI * x) / g), { color: '--c2', width: 2 });
      if (p.unir) { const o = xs.map((x, i) => [x, ys[i]]).sort((a, b) => a[0] - b[0]); pl.path(o, { color: '--c1', width: 1.5 }); }
      L.puntos(pl, xs, ys, { ey: p.barras || p.inv ? null : eT2 });
      const n = DEF.filter(([k]) => p[k]).length;
      sim.set('n', n ? n + ' de ' + DEF.length : '<span class="chip ok">Ninguno: gráfica de informe</span>');
    });
  });
})();
