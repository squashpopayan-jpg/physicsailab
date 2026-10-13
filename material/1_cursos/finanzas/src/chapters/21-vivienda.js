/* Capítulo 21 — Vivienda: comprar o arrendar */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, V = L.viv, T = L.tvm;

  /* 21.1 Comprar o arrendar e invertir */
  CC.defineSim('comprar-arrendar', function (sim) {
    sim.below();
    sim.cols2();
    const cw = sim.canvas({ aspect: 1.15, label: 'Patrimonio de quien compra y de quien arrienda' }), cm = sim.canvas({ aspect: 1.15, label: 'Pago mensual de cada uno' });
    sim.group('Vivienda y crédito');
    sim.slider('precio', { label: 'Precio de la vivienda', min: 80e6, max: 1500e6, step: 5e6, value: 300e6, fmt: CC.copS });
    sim.slider('inicial', { label: 'Cuota inicial', min: 0.1, max: 1, step: 0.05, value: 0.3, fmt: (v) => CC.pct(v, 0) });
    sim.slider('tasa', { label: 'Tasa del crédito (E.A.)', min: 0.05, max: 0.2, step: 0.0025, value: 0.125, fmt: (v) => CC.pct(v, 2) });
    sim.slider('plazo', { label: 'Plazo del crédito (años)', min: 5, max: 30, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.group('Mercado');
    sim.slider('val', { label: 'Valorización anual', min: 0, max: 0.12, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.slider('canon', { label: 'Arriendo mensual (% del valor)', min: 0.002, max: 0.01, step: 0.0001, value: 0.0045, fmt: (v) => CC.pct(v, 2) });
    sim.slider('aum', { label: 'Aumento anual del arriendo', min: 0, max: 0.12, step: 0.0025, value: 0.045, fmt: (v) => CC.pct(v, 2) });
    sim.group('Costos e inversión');
    sim.slider('poseer', { label: 'Costos anuales de poseer (% del valor)', min: 0, max: 0.04, step: 0.001, value: 0.012, fmt: (v) => CC.pct(v, 1) });
    sim.slider('compra', { label: 'Costos de compra', min: 0, max: 0.06, step: 0.0025, value: 0.025, fmt: (v) => CC.pct(v, 2) });
    sim.slider('venta', { label: 'Costos de venta', min: 0, max: 0.08, step: 0.0025, value: 0.03, fmt: (v) => CC.pct(v, 2) });
    sim.slider('rinv', { label: 'Rentabilidad de las inversiones', min: 0, max: 0.15, step: 0.0025, value: 0.09, fmt: (v) => CC.pct(v, 2) });
    sim.slider('anos', { label: 'Horizonte (años)', min: 2, max: 30, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.out('cuota', 'Cuota del crédito');
    sim.out('pc', 'Patrimonio final: compra', { hl: true });
    sim.out('pa', 'Patrimonio final: arrienda e invierte', { hl: true });
    sim.out('gan', 'Resultado');
    sim.out('be', 'Rentabilidad de inversión que empata');
    sim.onDraw(() => {
      const o = { precio: sim.p.precio, inicial: sim.p.inicial, tasaEA: sim.p.tasa, plazo: sim.p.plazo, valorizacion: sim.p.val, canon: sim.p.canon, aumentoArriendo: sim.p.aum, poseer: sim.p.poseer, compra: sim.p.compra, venta: sim.p.venta, rInv: sim.p.rinv, anos: sim.p.anos };
      const R = V.comparar(o);
      const xs = R.serie.map((s) => s.m / 12);
      CC.draw.clear(cw);
      const p1 = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: o.anos, ymin: Math.min(0, ...R.serie.map((s) => Math.min(s.compra, s.arrienda))), ymax: Math.max(...R.serie.map((s) => Math.max(s.compra, s.arrienda))) * 1.08, xlabel: 'años', title: 'patrimonio', yfmt: CC.copAxis, ml: 66 });
      p1.frame();
      p1.xy(xs, R.serie.map((s) => s.compra), { color: '--c4', width: 2.6 });
      p1.xy(xs, R.serie.map((s) => s.arrienda), { color: '--c1', width: 2.6 });
      p1.legend([{ label: 'compra', color: '--c4' }, { label: 'arrienda e invierte', color: '--c1' }], 'tl');
      CC.draw.clear(cm);
      const p2 = new CC.Plot(cm.ctx, { x: 0, y: 0, w: cm.w, h: cm.h, xmin: 0, xmax: o.anos, ymin: 0, ymax: Math.max(...R.serie.map((s) => Math.max(s.costoC, s.canon))) * 1.12, xlabel: 'años', title: 'pago mensual', yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.xy(xs.slice(1), R.serie.slice(1).map((s) => s.costoC), { color: '--c4', width: 2.4 });
      p2.xy(xs.slice(1), R.serie.slice(1).map((s) => s.canon), { color: '--c1', width: 2.4 });
      p2.legend([{ label: 'cuota + costos de poseer', color: '--c4' }, { label: 'arriendo', color: '--c1' }], 'tr');
      sim.set('cuota', CC.cop(R.cuota));
      sim.set('pc', CC.copS(R.compra));
      sim.set('pa', CC.copS(R.arrienda));
      const d = R.arrienda - R.compra;
      sim.set('gan', `${d > 0 ? 'arrendar' : 'comprar'} por ${CC.copS(Math.abs(d))}`);
      const f = (r) => { const q = V.comparar(Object.assign({}, o, { rInv: r })); return q.arrienda - q.compra; };
      sim.set('be', f(0) < 0 && f(0.3) > 0 ? CC.pct(L.util.bisect(f, 0, 0.3, 1e-5), 2) : '—');
    });
  });

  /* 21.2 Ahorrar la cuota inicial */
  CC.defineSim('cuota-inicial', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Ahorro acumulado frente a la cuota inicial necesaria' });
    sim.group('Meta');
    sim.slider('P', { label: 'Precio hoy de la vivienda', min: 80e6, max: 1000e6, step: 5e6, value: 250e6, fmt: CC.copS });
    sim.slider('ci', { label: 'Cuota inicial', min: 0.1, max: 0.5, step: 0.05, value: 0.3, fmt: (v) => CC.pct(v, 0) });
    sim.slider('val', { label: 'Valorización anual', min: 0, max: 0.12, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.group('Ahorro');
    sim.slider('A', { label: 'Ahorro mensual', min: 100000, max: 10000000, step: 50000, value: 1500000, fmt: CC.copS });
    sim.slider('W0', { label: 'Ahorro que ya tiene', min: 0, max: 200e6, step: 1e6, value: 0, fmt: CC.copS });
    sim.slider('r', { label: 'Rentabilidad del ahorro', min: 0, max: 0.14, step: 0.0025, value: 0.09, fmt: (v) => CC.pct(v, 2) });
    sim.out('t', 'Tiempo para reunirla', { hl: true });
    sim.out('pf', 'Precio de la vivienda en ese momento');
    sim.out('cf', 'Cuota inicial en ese momento');
    sim.onDraw(() => {
      const ri = T.eaToPeriodic(sim.p.r, 12), gv = T.eaToPeriodic(sim.p.val, 12);
      let W = sim.p.W0, price = sim.p.P, m = 0;
      const ws = [[0, W]], need = [[0, sim.p.ci * price]];
      let hit = -1;
      for (m = 1; m <= 360; m++) {
        W = W * (1 + ri) + sim.p.A; price *= 1 + gv;
        ws.push([m / 12, W]); need.push([m / 12, sim.p.ci * price]);
        if (hit < 0 && W >= sim.p.ci * price) hit = m;
        if (hit > 0 && m >= hit + 24) break;
      }
      const xmax = ws[ws.length - 1][0];
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax: Math.max(...need.map((p) => p[1]), ...ws.map((p) => p[1])) * 1.08, xlabel: 'años', yfmt: CC.copAxis, ml: 66 });
      pl.frame();
      pl.path(need, { color: '--gold', width: 2.6 });
      pl.path(ws, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.08 });
      if (hit > 0) pl.vline(hit / 12, { color: '--gain', label: 'meta alcanzada', dash: [] });
      pl.legend([{ label: 'cuota inicial necesaria', color: '--gold' }, { label: 'ahorro acumulado', color: '--c1' }], 'tl');
      sim.set('t', hit > 0 ? `${CC.nf(hit / 12, 1)} años (${hit} meses)` : '<span class="loss">más de 30 años</span>');
      sim.set('pf', hit > 0 ? CC.copS(sim.p.P * Math.pow(1 + gv, hit)) : '—');
      sim.set('cf', hit > 0 ? CC.copS(sim.p.ci * sim.p.P * Math.pow(1 + gv, hit)) : '—');
    });
  });

  /* 21.3 Inmueble para arrendar */
  CC.defineSim('precio-arriendo', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, label: 'Composición de la rentabilidad del inmueble' });
    sim.group('Inmueble');
    sim.slider('P', { label: 'Precio', min: 80e6, max: 1500e6, step: 5e6, value: 300e6, fmt: CC.copS });
    sim.slider('c', { label: 'Arriendo mensual', min: 300000, max: 15e6, step: 50000, value: 1350000, fmt: CC.cop });
    sim.slider('cost', { label: 'Costos anuales (% del precio)', min: 0, max: 0.04, step: 0.001, value: 0.012, fmt: (v) => CC.pct(v, 1) });
    sim.slider('vac', { label: 'Meses vacío al año', min: 0, max: 4, step: 0.5, value: 1, fmt: (v) => CC.nf(v, 1) });
    sim.slider('val', { label: 'Valorización anual', min: -0.02, max: 0.12, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.out('b', 'Rentabilidad bruta por arriendo');
    sim.out('n', 'Rentabilidad neta por arriendo');
    sim.out('t', 'Rentabilidad total (con valorización)', { hl: true });
    sim.out('a', 'Años de arriendo que vale el inmueble');
    sim.out('ley', 'Límite de la Ley 820 (1 % mensual)');
    sim.onDraw(() => {
      const r = V.rentaInmueble(sim.p.P, sim.p.c, sim.p.cost * sim.p.P, sim.p.vac, sim.p.val);
      const items = [['bruta', r.bruta, '--c3'], ['vacancia y costos', r.neta - r.bruta, '--loss'], ['neta', r.neta, '--c1'], ['valorización', sim.p.val, '--gold'], ['total', r.total, '--accent']];
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: 4.6, ymin: Math.min(0, ...items.map((x) => x[1])) * 1.3 - 0.005, ymax: Math.max(...items.map((x) => x[1])) * 1.25, xticks: [], yfmt: CC.pctAxis, mb: 30 });
      pl.frame();
      pl.bars([0, 1, 2, 3, 4], items.map((x) => x[1]), { colors: items.map((x) => x[2]), w: 0.6, labels: true, fmt: (v) => CC.pct(v, 2) });
      items.forEach(([n], k) => CC.text(cv.ctx, n, pl.X(k), pl.iy + pl.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      sim.set('b', CC.pct(r.bruta, 2));
      sim.set('n', CC.pct(r.neta, 2));
      sim.set('t', CC.pct(r.total, 2));
      sim.set('a', CC.nf(r.anosArriendo, 1));
      sim.set('ley', sim.p.c > 0.01 * sim.p.P ? '<span class="loss">el canon supera el límite</span>' : `máximo ${CC.cop(0.01 * sim.p.P)}`);
    });
  });
})();
