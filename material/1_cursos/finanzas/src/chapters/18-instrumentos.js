/* Capítulo 18 — Instrumentos */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, I = L.inv, S = L.stat, T = L.tvm;

  /* 18.1 Mapa histórico de riesgo y rentabilidad */
  const ACT = [['tbill', 'Letras del Tesoro', '--c6'], ['tbond', 'Bonos Tesoro 10 años', '--c3'], ['baa', 'Bonos corporativos Baa', '--c7'], ['realestate', 'Vivienda (precio)', '--c4'], ['gold', 'Oro', '--gold'], ['sp500', 'Acciones grandes', '--c1'], ['smallcap', 'Acciones pequeñas', '--c5']];
  CC.defineSim('mapa-riesgo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Volatilidad frente a rentabilidad real de cada activo' });
    sim.group('Periodo');
    sim.select('per', { label: 'Años', value: '1928-2025', options: [['1928-2025', '1928-2025 (todo)'], ['1966-1981', '1966-1981 (inflación alta)'], ['1982-1999', '1982-1999 (gran auge)'], ['2000-2025', '2000-2025'], ['2010-2025', '2010-2025']] });
    sim.check('mix', { label: 'Mostrar portafolio 60/40', value: true });
    sim.out('tab', 'Rentabilidad real geométrica / volatilidad', { wide: true });
    sim.onDraw(() => {
      const [a, b] = sim.p.per.split('-').map(Number);
      const pts = ACT.map(([k, n, c]) => { const r = I.series(k, a, b, true); return { n, c, m: S.geoMean(r), s: S.sd(I.series(k, a, b)) }; });
      if (sim.p.mix) { const r = I.mixRebal({ sp500: 0.6, tbond: 0.4 }, a, b, true), rn = I.mixRebal({ sp500: 0.6, tbond: 0.4 }, a, b); pts.push({ n: 'Portafolio 60/40', c: '--accent', m: S.geoMean(r), s: S.sd(rn) }); }
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(...pts.map((p) => p.s)) * 1.45, ymin: Math.min(-0.02, ...pts.map((p) => p.m)) - 0.01, ymax: Math.max(...pts.map((p) => p.m)) + 0.02, xlabel: 'volatilidad anual (nominal)', ylabel: 'rentabilidad real geométrica', xfmt: CC.pctAxis, yfmt: CC.pctAxis });
      pl.frame();
      pl.hline(0, { color: '--loss', dash: [3, 3] });
      pts.forEach((p) => pl.dot(p.s, p.m, { color: p.c, r: 6, label: p.n }));
      sim.set('tab', CC.table(['Activo', 'Real', 'Volatilidad'], pts.map((p) => [p.n, CC.pct(p.m, 2), CC.pct(p.s, 1)])));
    });
  });

  /* 18.2 Escalera de CDT */
  CC.defineSim('escalera-cdt', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Vencimientos de una escalera de CDT' });
    sim.group('Escalera');
    sim.slider('M', { label: 'Monto total', min: 4000000, max: 200000000, step: 1000000, value: 12000000, fmt: CC.copS });
    sim.slider('k', { label: 'Número de peldaños', min: 2, max: 12, step: 1, value: 4, fmt: (v) => CC.nf(v) });
    sim.group('Tasas E.A. según el plazo');
    sim.slider('r3', { label: 'CDT a 90 días', min: 0.02, max: 0.15, step: 0.0025, value: 0.08, fmt: (v) => CC.pct(v, 2) });
    sim.slider('r12', { label: 'CDT a 360 días', min: 0.02, max: 0.18, step: 0.0025, value: 0.095, fmt: (v) => CC.pct(v, 2) });
    sim.out('liq', 'Dinero disponible cada');
    sim.out('te', 'Tasa de la escalera (desde el segundo año)', { hl: true });
    sim.out('cmp', 'Todo a 90 días / todo a 360 días');
    sim.onDraw(() => {
      const k = Math.round(sim.p.k), M = sim.p.M, cada = 12 / k;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 30, ymin: 0, ymax: k + 0.5, xlabel: 'meses', yticks: [], ml: 160 });
      pl.frame();
      const ctx = cv.ctx;
      for (let j = 0; j < k; j++) {
        const y = k - j - 0.5, first = cada * (j + 1);
        let t0 = 0, t1 = first;
        while (t0 < 30) {
          const y0 = pl.Y(y + 0.3), y1 = pl.Y(y - 0.3);
          ctx.fillStyle = CC.alpha(t0 === 0 ? '--c4' : '--c1', 0.75);
          ctx.fillRect(pl.X(t0), y0, Math.max(1, pl.X(Math.min(t1, 30)) - pl.X(t0) - 2), y1 - y0);
          if (t1 <= 30) { ctx.fillStyle = CC.col('--gold'); ctx.beginPath(); ctx.arc(pl.X(t1), (y0 + y1) / 2, 4, 0, 7); ctx.fill(); }
          t0 = t1; t1 = t0 + 12;
        }
        CC.text(ctx, `CDT ${j + 1} · ${CC.copS(M / k)}`, pl.ix - 8, pl.Y(y) + 4, { size: 11.5, align: 'right', color: '--ink-2' });
      }
      CC.text(ctx, 'naranja: plazo inicial escalonado · azul: renovado a 12 meses · punto: vencimiento disponible', pl.ix + 6, pl.iy + 12, { size: 11, color: '--ink-3', halo: true });
      sim.set('liq', `${CC.nf(cada, cada % 1 ? 1 : 0)} meses (${CC.copS(M / k)})`);
      sim.set('te', CC.pct(sim.p.r12, 2));
      sim.set('cmp', `${CC.pct(sim.p.r3, 2)} / ${CC.pct(sim.p.r12, 2)} (liquidez solo una vez al año)`);
    });
  });

  /* 18.3 Precio de un bono */
  CC.defineSim('precio-bono', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Precio del bono según la tasa de mercado' });
    sim.group('Bono');
    sim.slider('c', { label: 'Cupón anual', min: 0, max: 0.15, step: 0.0025, value: 0.09, fmt: (v) => CC.pct(v, 2) });
    sim.slider('n', { label: 'Años al vencimiento', min: 1, max: 30, step: 1, value: 10, fmt: (v) => CC.nf(v) });
    sim.seg('f', { label: 'Pagos por año', options: [[1, 'anual'], [2, 'semestral']], value: 2 });
    sim.slider('y', { label: 'Tasa de mercado (rendimiento)', min: 0.01, max: 0.2, step: 0.0025, value: 0.11, fmt: (v) => CC.pct(v, 2) });
    sim.out('p', 'Precio por cada $1.000 de nominal', { hl: true });
    sim.out('dm', 'Duración de Macaulay / modificada');
    sim.out('d1', 'Si la tasa sube 1 punto: exacto / aproximado');
    sim.onDraw(() => {
      const { c, y } = sim.p, n = Math.round(sim.p.n), f = +sim.p.f;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.01, xmax: 0.2, ymin: 0, ymax: Math.max(1600, I.bondPrice(1000, c, 0.01, n, f) * 1.05), xlabel: 'tasa de mercado', ylabel: 'precio', xfmt: CC.pctAxis, yfmt: (v) => CC.nf(v, 0) });
      pl.frame();
      pl.hline(1000, { color: '--ink-3', label: 'valor nominal', labelRight: true });
      pl.fn((yy) => I.bondPrice(1000, c, yy, n, f), { color: '--c1', width: 2.6 });
      const D = I.duration(1000, c, y, n, f), P = D.price;
      pl.fn((yy) => P * (1 - D.modified * (yy - y)), { color: '--c4', width: 1.6, dash: [5, 4], from: Math.max(0.01, y - 0.05), to: Math.min(0.2, y + 0.05) });
      pl.vline(c, { color: '--ink-3', label: 'cupón', labelY: 14, width: 1 });
      pl.dot(y, P, { color: '--accent', label: CC.nf(P, 2) });
      pl.legend([{ label: 'precio exacto', color: '--c1' }, { label: 'aproximación por duración', color: '--c4', dash: [5, 4] }], 'tr');
      const P1 = I.bondPrice(1000, c, y + 0.01, n, f);
      sim.set('p', CC.nf(P, 2));
      sim.set('dm', `${CC.nf(D.macaulay, 2)} / ${CC.nf(D.modified, 2)} años`);
      sim.set('d1', `${CC.pct(P1 / P - 1, 2)} / ${CC.pct(-D.modified * 0.01, 2)}`);
      void T;
    });
  });
})();
