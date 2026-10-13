/* Capítulo 4 — Dinero y bienestar */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L;

  /* ======================================================================
     4.1 Curva logarítmica: el mismo aumento en dos personas
     ====================================================================== */
  CC.defineSim('log-ingreso', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Bienestar frente a ingreso con escala logarítmica' });
    sim.group('Las dos personas');
    sim.slider('y1', { label: 'Ingreso mensual de la persona A', min: 1000000, max: 30000000, step: 100000, value: 1750905, fmt: CC.copS });
    sim.slider('y2', { label: 'Ingreso mensual de la persona B', min: 1000000, max: 30000000, step: 100000, value: 15000000, fmt: CC.copS });
    sim.slider('d', { label: 'Aumento que recibe cada una', min: 100000, max: 5000000, step: 50000, value: 500000, fmt: CC.cop });
    sim.check('dup', { label: 'Mostrar escalones de duplicación', value: false });
    sim.out('ga', 'Ganancia de bienestar de A');
    sim.out('gb', 'Ganancia de bienestar de B');
    sim.out('ratio', 'A gana más que B', { hl: true });
    sim.out('eq', 'Aumento que B necesitaría para igualar a A');
    sim.onDraw(() => {
      const F = (y) => Math.log(y / 1e6);
      const { y1, y2, d } = sim.p;
      CC.draw.clear(cv);
      const xmax = 35e6;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: -0.2, ymax: F(xmax) * 1.05, xlabel: 'ingreso mensual', ylabel: 'bienestar (b · ln y)', xfmt: CC.copAxis, yfmt: (v) => CC.nf(v, 1) });
      pl.frame();
      pl.fn((y) => (y > 0 ? F(y) : NaN), { color: '--accent', width: 2.6, from: 0.9e6, n: 600 });
      if (sim.p.dup) {
        let y = 1e6;
        while (y * 2 <= xmax) {
          pl.path([[y, F(y)], [2 * y, F(y)], [2 * y, F(2 * y)]], { color: '--c6', width: 1.4, dash: [4, 3] });
          y *= 2;
        }
      }
      const arr = (y, col, name) => {
        pl.dot(y, F(y), { color: col });
        pl.dot(y + d, F(y + d), { color: col });
        pl.path([[y, F(y)], [y + d, F(y)]], { color: col, width: 2 });
        pl.arrow(y + d, F(y), y + d, F(y + d), { color: col, width: 2.2 });
        pl.label(y + d, F(y + d), `${name}: +${CC.nf(F(y + d) - F(y), 3)}`, { dx: 8, dy: 14, color: col, weight: 700 });
      };
      arr(y1, '--c2', 'A');
      arr(y2, '--c1', 'B');
      const ga = F(y1 + d) - F(y1), gb = F(y2 + d) - F(y2);
      sim.set('ga', CC.nf(ga, 3));
      sim.set('gb', CC.nf(gb, 3));
      sim.set('ratio', gb > 0 ? CC.nf(ga / gb, 1) + ' veces' : '—');
      sim.set('eq', CC.copS(y2 * ((y1 + d) / y1) - y2));
    });
  });

  /* ======================================================================
     4.2 Adaptación hedónica ante un aumento
     ====================================================================== */
  CC.defineSim('adaptacion', function (sim) {
    sim.cols2();
    const cu = sim.canvas({ aspect: 1.1, label: 'Bienestar mes a mes' }), cw = sim.canvas({ aspect: 1.1, label: 'Patrimonio acumulado' });
    sim.group('El aumento');
    sim.slider('y', { label: 'Ingreso inicial', min: 1500000, max: 15000000, step: 100000, value: 4000000, fmt: CC.copS });
    sim.slider('inc', { label: 'Aumento en el mes 12', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.slider('s0', { label: 'Ahorro antes del aumento', min: 0, max: 0.3, step: 0.01, value: 0.05, fmt: (v) => CC.pct(v, 0) });
    sim.group('Psicología');
    sim.slider('a', { label: 'Velocidad de adaptación por mes', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.slider('k', { label: 'Peso del hábito κ', min: 0.3, max: 1, step: 0.05, value: 0.85, fmt: (v) => CC.nf(v, 2) });
    sim.out('pico', 'Salto de bienestar al gastar todo');
    sim.out('pico12', 'Lo que queda un año después');
    sim.out('wa', 'Patrimonio extra a los 4 años: gasta todo / mitad / ahorra todo', { wide: true });
    sim.onDraw(() => {
      const M = 48, y0 = sim.p.y, y1 = y0 * (1 + sim.p.inc), c0 = y0 * (1 - sim.p.s0);
      const esc = [['gasta todo el aumento', '--c2', 1], ['gasta la mitad', '--c4', 0.5], ['ahorra todo el aumento', '--c1', 0]];
      const res = esc.map(([n, col, f]) => {
        const c = [], w = [];
        let W = 0;
        for (let m = 0; m < M; m++) {
          const ci = m < 12 ? c0 : c0 + f * (y1 - y0);
          c.push(ci);
          const ing = m < 12 ? y0 : y1;
          W = W * (1 + 0.004) + (ing - ci);
          w.push(W);
        }
        return { n, col, u: L.beh.adapt(c, sim.p.a, sim.p.k), w };
      });
      const base = res[2].u[0];
      CC.draw.clear(cu);
      const all = res.flatMap((r) => r.u.map((v) => v - base));
      const pu = new CC.Plot(cu.ctx, { x: 0, y: 0, w: cu.w, h: cu.h, xmin: 0, xmax: M - 1, ymin: Math.min(-0.01, ...all), ymax: Math.max(...all) * 1.15 + 0.01, xlabel: 'mes', ylabel: 'bienestar respecto al inicio', title: 'bienestar mes a mes', yfmt: (v) => CC.nf(v, 2) });
      pu.frame();
      pu.vline(12, { color: '--ink-3', label: 'aumento' });
      res.forEach((r) => pu.xy(r.u.map((_, m) => m), r.u.map((v) => v - base), { color: r.col, width: 2.3 }));
      pu.legend(res.map((r) => ({ label: r.n, color: r.col })), 'tr');
      CC.draw.clear(cw);
      const ws = res.map((r) => r.w[M - 1] - 0);
      const wsBase = (() => { let W = 0; for (let m = 0; m < M; m++) W = W * 1.004 + (y0 - c0); return W; })();
      const extra = ws.map((v) => v - wsBase);
      const pw = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: -0.6, xmax: 2.6, ymin: 0, ymax: Math.max(1e6, ...ws) * 1.2, xticks: [], title: 'patrimonio acumulado al mes 48', yfmt: CC.copAxis, ml: 66 });
      pw.frame();
      pw.bars([0, 1, 2], ws, { colors: res.map((r) => r.col), w: 0.6, labels: true, fmt: CC.copAxis });
      ['gasta todo', 'gasta mitad', 'ahorra todo'].forEach((t, i) => CC.text(cw.ctx, t, pw.X(i), pw.iy + pw.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      const u0 = res[0].u, pk = Math.max(...u0.slice(12)) - u0[11];
      sim.set('pico', CC.nf(pk, 3));
      sim.set('pico12', `${CC.nf(u0[23] - u0[11], 3)} (${CC.pct(pk > 0 ? (u0[23] - u0[11]) / pk : 0, 0)} del salto)`);
      sim.set('wa', extra.map((v) => CC.copS(v)).join(' / '));
    });
  });

  /* ======================================================================
     4.3 Comparación social
     ====================================================================== */
  CC.defineSim('comparacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Cambio de bienestar en cuatro escenarios' });
    sim.group('Modelo');
    sim.slider('th', { label: 'Peso de la comparación θ', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => CC.nf(v, 2) });
    sim.slider('g', { label: 'Aumento de ingresos', min: 0.05, max: 1, step: 0.05, value: 0.3, fmt: (v) => CC.pct(v, 0) });
    sim.out('a', 'Sube solo usted');
    sim.out('b', 'Suben todos por igual');
    sim.out('c', 'Suben todos menos usted', { hl: true });
    sim.out('d', 'Usted sube la mitad que los demás');
    sim.onDraw(() => {
      const th = sim.p.th, g = Math.log1p(sim.p.g), g2 = Math.log1p(sim.p.g / 2);
      const vals = [g, g - th * g, -th * g, g2 - th * g];
      const names = ['sube solo usted', 'suben todos', 'todos menos usted', 'usted sube la mitad'];
      CC.draw.clear(cv);
      const m = Math.max(0.05, ...vals.map(Math.abs)) * 1.25;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: 3.6, ymin: -m, ymax: m, xticks: [], ylabel: 'cambio de bienestar', yfmt: (v) => CC.nf(v, 2), mb: 30 });
      pl.frame();
      pl.bars([0, 1, 2, 3], vals, { signed: true, w: 0.55, labels: true, fmt: (v) => (v >= 0 ? '+' : '') + CC.nf(v, 3) });
      names.forEach((t, i) => CC.text(cv.ctx, t, pl.X(i), pl.iy + pl.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      sim.set('a', CC.nf(vals[0], 3));
      sim.set('b', CC.nf(vals[1], 3));
      sim.set('c', CC.nf(vals[2], 3));
      sim.set('d', CC.nf(vals[3], 3));
    });
  });
})();
