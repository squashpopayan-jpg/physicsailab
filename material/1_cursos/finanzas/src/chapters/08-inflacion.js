/* Capítulo 8 — Inflación y poder adquisitivo */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;

  /* 8.1 Historia de la inflación colombiana */
  CC.defineSim('historia-ipc', function (sim) {
    const ci = sim.canvas({ aspect: 2.6, label: 'Inflación anual de Colombia 1960-2025' });
    const cx = sim.canvas({ aspect: 2.6, label: 'Índice de precios y tasa de cambio desde el año base' });
    const co = L.DATA.co, Y = co.years, y1 = Y[Y.length - 1];
    sim.group('Comparar precios');
    sim.slider('y0', { label: 'Año de partida', min: Y[0], max: y1 - 1, step: 1, value: 1990, fmt: (v) => String(v) });
    sim.num('m', { label: 'Precio en ese año', value: 1000, min: 1, money: true });
    sim.check('usd', { label: 'Mostrar el dólar (pesos por dólar)', value: true });
    sim.out('mult', `Los precios se multiplicaron (hasta ${y1})`, { hl: true });
    sim.out('hoy', `Ese precio en pesos de ${y1}`);
    sim.out('pg', 'Inflación promedio geométrica');
    sim.out('dol', 'El dólar se multiplicó');
    sim.note('Fuente: Banco Mundial (WDI, julio de 2026), a partir de datos del DANE. Inflación promedio anual; la cifra a diciembre puede diferir.');
    sim.onDraw(() => {
      const y0 = Math.round(sim.p.y0), i0 = Y.indexOf(y0), i1 = Y.length - 1;
      CC.draw.clear(ci);
      const p1 = new CC.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: Y[0] - 0.7, xmax: y1 + 0.7, ymin: 0, ymax: 36, ylabel: 'inflación anual', yfmt: (v) => CC.nf(v) + '%', xfmt: (v) => String(Math.round(v)) });
      p1.frame();
      p1.band(y0 - 0.5, y1 + 0.5, { color: '--accent', alpha: 0.06 });
      p1.bars(Y, co.infl, { colors: co.infl.map((v, k) => (k > i0 ? (v > 10 ? '--c2' : '--c1') : '--c6')), w: 0.75 });
      p1.hline(3, { color: '--gain', label: 'meta 3 %', dash: [4, 3] });
      p1.vline(1991, { color: '--ink-3', label: 'Constitución 1991', labelY: 14, width: 1 });
      CC.draw.clear(cx);
      const idx = Y.slice(i0).map((_, k) => co.ipc[i0 + k] / co.ipc[i0]);
      const dol = Y.slice(i0).map((_, k) => co.usdcop[i0 + k] / co.usdcop[i0]);
      const ymax = Math.max(...idx, sim.p.usd ? Math.max(...dol) : 1) * 1.3;
      const p2 = new CC.Plot(cx.ctx, { x: 0, y: 0, w: cx.w, h: cx.h, xmin: y0, xmax: y1, ymin: 0.8, ymax: Math.max(2, ymax), ylog: true, ylabel: `veces respecto a ${y0}`, xfmt: (v) => String(Math.round(v)) });
      p2.frame();
      p2.xy(Y.slice(i0), idx, { color: '--c2', width: 2.6 });
      if (sim.p.usd) p2.xy(Y.slice(i0), dol, { color: '--c3', width: 2.2 });
      p2.legend([{ label: 'precios (IPC)', color: '--c2' }].concat(sim.p.usd ? [{ label: 'dólar (COP por USD)', color: '--c3' }] : []), 'tl');
      const mult = idx[idx.length - 1];
      sim.set('mult', CC.nf(mult, 2) + ' veces');
      sim.set('hoy', CC.cop(sim.p.m * mult));
      sim.set('pg', CC.pct(Math.pow(mult, 1 / (y1 - y0)) - 1));
      sim.set('dol', `${CC.nf(dol[dol.length - 1], 2)} veces (de ${CC.cop(co.usdcop[i0], co.usdcop[i0] < 100 ? 1 : 0)} a ${CC.cop(co.usdcop[i1])})`);
    });
  });

  /* 8.2 El colchón pierde */
  CC.defineSim('colchon', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Poder de compra de cuatro formas de guardar dinero' });
    sim.group('Supuestos');
    sim.slider('P', { label: 'Monto guardado', min: 1000000, max: 100000000, step: 1000000, value: 10000000, fmt: CC.copS });
    sim.slider('pi', { label: 'Inflación anual', min: 0, max: 0.2, step: 0.0025, value: 0.051, fmt: (v) => CC.pct(v, 2) });
    sim.slider('n', { label: 'Años', min: 1, max: 30, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.group('Tasas nominales');
    sim.slider('ic', { label: 'Cuenta de ahorros', min: 0, max: 0.08, step: 0.0025, value: 0.01, fmt: (v) => CC.pct(v, 2) });
    sim.slider('id', { label: 'CDT', min: 0, max: 0.2, step: 0.0025, value: 0.09, fmt: (v) => CC.pct(v, 2) });
    sim.slider('ir', { label: 'Portafolio de largo plazo (real)', min: 0, max: 0.08, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.out('e', 'Efectivo: poder de compra final');
    sim.out('c', 'Cuenta de ahorros');
    sim.out('d', 'CDT');
    sim.out('l', 'Portafolio de largo plazo', { hl: true });
    sim.onDraw(() => {
      const { P, pi, n, ic, id, ir } = sim.p;
      const xs = L.util.linspace(0, n, 121);
      const real = (i) => xs.map((t) => (P * Math.pow(1 + i, t)) / Math.pow(1 + pi, t));
      const s = [['efectivo', 0, '--c2'], ['cuenta de ahorros', ic, '--c4'], ['CDT', id, '--c1'], ['portafolio', (1 + ir) * (1 + pi) - 1, '--c3']].map(([nm, i, col]) => ({ nm, col, ys: real(i) }));
      CC.draw.clear(cv);
      const ymax = Math.max(P * 1.05, ...s.map((x) => x.ys[120])) * 1.05;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax, xlabel: 'años', ylabel: 'en pesos de hoy', yfmt: CC.copAxis, ml: 80 });
      pl.frame();
      pl.hline(P, { color: '--ink-3', label: 'monto inicial', labelRight: true });
      s.forEach((x) => pl.xy(xs, x.ys, { color: x.col, width: 2.4 }));
      pl.legend(s.map((x) => ({ label: x.nm, color: x.col })), 'bl');
      const f = (k) => { const v = s[k].ys[120]; return `<span class="${v >= P ? 'gain' : 'loss'}">${CC.copS(v)} (${v >= P ? '+' : ''}${CC.pct(v / P - 1, 1)})</span>`; };
      ['e', 'c', 'd', 'l'].forEach((id_, k) => sim.set(id_, f(k)));
    });
  });

  /* 8.3 Salario real */
  CC.defineSim('salario-real', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Salario nominal y real año a año' });
    sim.group('Salario');
    sim.slider('S', { label: 'Salario inicial', min: 1000000, max: 20000000, step: 100000, value: 3000000, fmt: CC.copS });
    sim.slider('a', { label: 'Aumento anual', min: 0, max: 0.25, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.slider('pi', { label: 'Inflación anual', min: 0, max: 0.2, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.slider('n', { label: 'Años', min: 1, max: 30, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.out('nom', 'Salario final en pesos corrientes');
    sim.out('real', 'Salario final en pesos de hoy', { hl: true });
    sim.out('ar', 'Aumento real por año');
    sim.out('tot', 'Cambio del poder de compra');
    sim.onDraw(() => {
      const { S, a, pi, n } = sim.p;
      const xs = L.util.range(n + 1);
      const nom = xs.map((t) => S * Math.pow(1 + a, t)), re = xs.map((t) => (S * Math.pow(1 + a, t)) / Math.pow(1 + pi, t));
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: Math.min(...re) * 0.85, ymax: Math.max(...nom) * 1.08, xlabel: 'años', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.hline(S, { color: '--ink-3', dash: [3, 3] });
      pl.xy(xs, nom, { color: '--c6', width: 2.2 });
      pl.xy(xs, re, { color: re[n] >= S ? '--c1' : '--c2', width: 2.6 });
      pl.legend([{ label: 'en pesos corrientes', color: '--c6' }, { label: 'en pesos de hoy (real)', color: re[n] >= S ? '--c1' : '--c2' }], 'tl');
      const ar = T.real(a, pi);
      sim.set('nom', CC.copS(nom[n], 2));
      sim.set('real', CC.copS(re[n], 2));
      sim.set('ar', `<span class="${ar >= 0 ? 'gain' : 'loss'}">${CC.pct(ar, 2)}</span>`);
      sim.set('tot', `<span class="${re[n] >= S ? 'gain' : 'loss'}">${CC.pct(re[n] / S - 1)}</span>`);
    });
  });
})();
