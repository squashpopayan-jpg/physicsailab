/* Capítulo 17 — Diversificación y portafolios */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, I = L.inv, S = L.stat;

  /* 17.1 Volatilidad con n activos */
  CC.defineSim('n-activos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Volatilidad del portafolio según el número de activos' });
    sim.group('Activos');
    sim.slider('s', { label: 'Volatilidad de cada acción', min: 0.1, max: 0.8, step: 0.01, value: 0.35, fmt: (v) => CC.pct(v, 0) });
    sim.slider('rho', { label: 'Correlación entre acciones', min: 0, max: 1, step: 0.01, value: 0.3, fmt: (v) => CC.nf(v, 2) });
    sim.slider('n', { label: 'Número de acciones', min: 1, max: 100, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.out('sp', 'Volatilidad del portafolio', { hl: true });
    sim.out('piso', 'Piso (riesgo de mercado) √ρ·σ');
    sim.out('fr', 'Riesgo idiosincrático eliminado');
    sim.onDraw(() => {
      const { s, rho } = sim.p, n = Math.round(sim.p.n);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 100, xlog: true, ymin: 0, ymax: s * 1.1, xlabel: 'número de acciones (escala logarítmica)', ylabel: 'volatilidad', yfmt: CC.pctAxis });
      pl.frame();
      const piso = Math.sqrt(rho) * s;
      pl.between([1, 100], [0, 0], [piso, piso], { color: '--c2', alpha: 0.12 });
      pl.fn((k) => I.sigmaN(s, rho, k), { color: '--c1', width: 2.6, from: 1 });
      pl.hline(piso, { color: '--c2', label: 'riesgo sistemático (no se diversifica)', dash: [5, 4] });
      pl.dot(n, I.sigmaN(s, rho, n), { color: '--accent', label: CC.pct(I.sigmaN(s, rho, n), 1) });
      const sp = I.sigmaN(s, rho, n);
      sim.set('sp', CC.pct(sp, 1));
      sim.set('piso', CC.pct(piso, 1));
      sim.set('fr', s > piso ? CC.pct((s * s - sp * sp) / (s * s - piso * piso), 0) : '—');
    });
  });

  /* 17.2 Frontera eficiente de dos activos */
  CC.defineSim('frontera', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Frontera eficiente de acciones y bonos' });
    const sp = I.series('sp500'), bo = I.series('tbond');
    sim.group('Acciones');
    sim.slider('m1', { label: 'Rentabilidad esperada', min: 0, max: 0.2, step: 0.0025, value: +S.mean(sp).toFixed(4), fmt: (v) => CC.pct(v, 2) });
    sim.slider('s1', { label: 'Volatilidad', min: 0.02, max: 0.5, step: 0.0025, value: +S.sd(sp).toFixed(4), fmt: (v) => CC.pct(v, 1) });
    sim.group('Bonos');
    sim.slider('m2', { label: 'Rentabilidad esperada', min: 0, max: 0.15, step: 0.0025, value: +S.mean(bo).toFixed(4), fmt: (v) => CC.pct(v, 2) });
    sim.slider('s2', { label: 'Volatilidad', min: 0.01, max: 0.3, step: 0.0025, value: +S.sd(bo).toFixed(4), fmt: (v) => CC.pct(v, 1) });
    sim.group('Mezcla');
    sim.slider('rho', { label: 'Correlación', min: -1, max: 1, step: 0.01, value: +S.corr(sp, bo).toFixed(2), fmt: (v) => CC.nf(v, 2) });
    sim.slider('w', { label: 'Peso en acciones', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => CC.pct(v, 0) });
    sim.note('Valores iniciales: S&P 500 y bonos del Tesoro a 10 años, 1928-2025 (Damodaran).');
    sim.out('p', 'Portafolio elegido: media / volatilidad', { hl: true });
    sim.out('mv', 'Mínima varianza: peso en acciones');
    sim.out('mvs', 'Mínima varianza: media / volatilidad');
    sim.onDraw(() => {
      const { m1, s1, m2, s2, rho, w } = sim.p;
      const pts = L.util.linspace(0, 1, 101).map((x) => I.two(x, m1, s1, m2, s2, rho));
      const wm = Math.min(1, Math.max(0, I.minVarW(s1, s2, rho))), pm = I.two(wm, m1, s1, m2, s2, rho), pw = I.two(w, m1, s1, m2, s2, rho);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(s1, s2) * 1.15, ymin: Math.min(m1, m2) * 0.8, ymax: Math.max(m1, m2) * 1.12, xlabel: 'volatilidad (riesgo)', ylabel: 'rentabilidad esperada', xfmt: CC.pctAxis, yfmt: CC.pctAxis });
      pl.frame();
      const ineff = pts.filter((_, k) => k / 100 <= wm), eff = pts.filter((_, k) => k / 100 >= wm);
      pl.path(ineff.map((p) => [p.s, p.m]), { color: '--c6', width: 2, dash: [5, 4] });
      pl.path(eff.map((p) => [p.s, p.m]), { color: '--c1', width: 2.8 });
      pl.dot(s2, m2, { color: '--c3', label: 'bonos', dx: 8 });
      pl.dot(s1, m1, { color: '--c2', label: 'acciones', dx: -60 });
      pl.dot(pm.s, pm.m, { color: '--gold', label: 'mínima varianza', dy: 16 });
      pl.dot(pw.s, pw.m, { color: '--accent', r: 6, label: `${CC.pct(w, 0)} acciones` });
      pl.legend([{ label: 'frontera eficiente', color: '--c1' }, { label: 'portafolios ineficientes', color: '--c6', dash: [5, 4] }], 'br');
      sim.set('p', `${CC.pct(pw.m, 2)} / ${CC.pct(pw.s, 1)}`);
      sim.set('mv', CC.pct(wm, 1));
      sim.set('mvs', `${CC.pct(pm.m, 2)} / ${CC.pct(pm.s, 1)}`);
    });
  });

  /* 17.3 Rebalanceo con datos reales */
  CC.defineSim('rebalanceo', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.15, label: 'Valor de 1 dólar con y sin rebalanceo' }), cw = sim.canvas({ aspect: 1.15, label: 'Peso de las acciones a lo largo del tiempo' });
    const Y = L.DATA.us.years, y1 = Y[Y.length - 1];
    sim.group('Portafolio');
    sim.slider('y0', { label: 'Año inicial', min: 1928, max: 2015, step: 1, value: 1970, fmt: String });
    sim.slider('ws', { label: 'Peso objetivo en acciones', min: 0.1, max: 0.9, step: 0.05, value: 0.6, fmt: (v) => CC.pct(v, 0) });
    sim.out('fr', 'Valor final de $1: rebalanceado / sin tocar', { wide: true });
    sim.out('dd', 'Caída máxima: rebalanceado / sin tocar');
    sim.out('wf', 'Peso final en acciones sin rebalancear', { hl: true });
    sim.onDraw(() => {
      const y0 = Math.round(sim.p.y0), ws = sim.p.ws;
      const rb = I.growth(I.mixRebal({ sp500: ws, tbond: 1 - ws }, y0, y1));
      const a = I.series('sp500', y0, y1), b = I.series('tbond', y0, y1);
      let vs = ws, vb = 1 - ws;
      const hd = [1], wt = [ws];
      for (let t = 0; t < a.length; t++) { vs *= 1 + a[t]; vb *= 1 + b[t]; hd.push(vs + vb); wt.push(vs / (vs + vb)); }
      const xs = [y0 - 1].concat(Y.slice(Y.indexOf(y0)));
      CC.draw.clear(cv);
      const p1 = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: y0 - 1, xmax: y1, ymin: 0.5, ymax: Math.max(...rb, ...hd) * 1.5, ylog: true, title: 'valor de 1 dólar', xfmt: (v) => String(Math.round(v)), yfmt: (v) => CC.nf(v, v < 10 ? 1 : 0) });
      p1.frame();
      p1.xy(xs, hd, { color: '--c4', width: 2.4 });
      p1.xy(xs, rb, { color: '--c1', width: 2.4 });
      p1.legend([{ label: 'rebalanceado cada año', color: '--c1' }, { label: 'sin tocar', color: '--c4' }], 'tl');
      CC.draw.clear(cw);
      const p2 = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: y0 - 1, xmax: y1, ymin: 0, ymax: 1, title: 'peso de las acciones', xfmt: (v) => String(Math.round(v)), yfmt: CC.pctAxis });
      p2.frame();
      p2.xy(xs, xs.map(() => ws), { color: '--c1', width: 2.4 });
      p2.xy(xs, wt, { color: '--c4', width: 2.4, fill: '--c4', fillAlpha: 0.08 });
      sim.set('fr', `${CC.nf(rb[rb.length - 1], 1)} / ${CC.nf(hd[hd.length - 1], 1)}`);
      sim.set('dd', `${CC.pct(I.maxDrawdown(rb).dd, 0)} / ${CC.pct(I.maxDrawdown(hd).dd, 0)}`);
      sim.set('wf', CC.pct(wt[wt.length - 1], 0));
    });
  });
})();
