/* Capítulo 14 — Deudas */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm, K = L.cred;

  /* 14.1 Diferir a cuotas y pago mínimo */
  CC.defineSim('pago-minimo', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1.1, label: 'Intereses según el número de cuotas' }), cm = sim.canvas({ aspect: 1.1, label: 'Saldo pagando solo el mínimo' });
    sim.group('Compra');
    sim.slider('P', { label: 'Valor de la compra o deuda', min: 200000, max: 20000000, step: 100000, value: 3000000, fmt: CC.copS });
    sim.slider('im', { label: 'Tasa mensual', min: 0.005, max: 0.03, step: 0.0005, value: 0.021, fmt: (v) => CC.pct(v, 2) });
    sim.check('uno', { label: 'A una cuota no cobran interés', value: true });
    sim.slider('n', { label: 'Cuotas elegidas', min: 1, max: 48, step: 1, value: 12, fmt: (v) => CC.nf(v) });
    sim.group('Pago mínimo porcentual');
    sim.slider('q', { label: 'Mínimo (% del saldo)', min: 0.02, max: 0.15, step: 0.005, value: 0.05, fmt: (v) => CC.pct(v, 1) });
    sim.slider('piso', { label: 'Piso del mínimo', min: 0, max: 200000, step: 5000, value: 50000, fmt: CC.cop });
    sim.out('i', 'Intereses con las cuotas elegidas', { hl: true });
    sim.out('c1', 'Primera cuota / última');
    sim.out('pm', 'Solo mínimo: meses');
    sim.out('pmi', 'Solo mínimo: intereses');
    sim.onDraw(() => {
      const { P, im } = sim.p, n = Math.round(sim.p.n);
      const ns = [1, 2, 3, 6, 9, 12, 18, 24, 36, 48];
      const ints = ns.map((k) => (k === 1 && sim.p.uno ? 0 : K.german(P, im, k).totalInteres));
      CC.draw.clear(cd);
      const p1 = new CC.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -0.6, xmax: ns.length - 0.4, ymin: 0, ymax: Math.max(...ints) * 1.18 + 1, xticks: [], title: 'intereses totales según las cuotas', yfmt: CC.copAxis, ml: 62, mb: 30 });
      p1.frame();
      p1.bars(ns.map((_, k) => k), ints, { colors: ns.map((k) => (k === n ? '--accent' : '--c2')), w: 0.65 });
      ns.forEach((k, j) => CC.text(cd.ctx, String(k), p1.X(j), p1.iy + p1.ih + 15, { size: 11.5, align: 'center', color: '--ink-2' }));
      CC.text(cd.ctx, 'número de cuotas', p1.ix + p1.iw / 2, cd.h - 4, { size: 11.5, align: 'center', color: '--ink-3' });
      const R = n === 1 && sim.p.uno ? { totalInteres: 0, rows: [{ cuota: P }] } : K.german(P, im, n);
      const M = K.minPayment(P, im, sim.p.q, sim.p.piso);
      CC.draw.clear(cm);
      const xs = M.serie.map((_, k) => k), mmax = Math.min(xs.length - 1, 240);
      const p2 = new CC.Plot(cm.ctx, { x: 0, y: 0, w: cm.w, h: cm.h, xmin: 0, xmax: Math.max(12, mmax), ymin: 0, ymax: Math.max(...M.serie) * 1.08, xlabel: 'meses', title: 'saldo pagando solo el mínimo', yfmt: CC.copAxis, ml: 62 });
      p2.frame();
      p2.xy(xs, M.serie, { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.1 });
      sim.set('i', CC.cop(R.totalInteres));
      sim.set('c1', `${CC.cop(R.rows[0].cuota)} / ${CC.cop(R.rows[R.rows.length - 1].cuota)}`);
      sim.set('pm', isFinite(M.meses) ? `${M.meses} (${CC.nf(M.meses / 12, 1)} años)` : '<span class="loss">nunca</span>');
      sim.set('pmi', CC.cop(M.totalInteres));
    });
  });

  /* 14.2 Avalancha y bola de nieve */
  const DEU = [['Tarjeta A', 4500000, 0.026, 180000, '--c2'], ['Tarjeta B', 1200000, 0.019, 60000, '--c4'], ['Libranza', 9000000, 0.014, 310000, '--c1'], ['Almacén', 600000, 0.03, 40000, '--c5']];
  CC.defineSim('avalancha-bola', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.4, label: 'Saldo total de las deudas mes a mes con tres estrategias' });
    DEU.forEach(([nm, s, i, m], k) => {
      sim.group(nm);
      sim.num('s' + k, { label: 'Saldo', value: s, min: 0, money: true });
      sim.slider('i' + k, { label: 'Tasa mensual', min: 0.005, max: 0.035, step: 0.0005, value: i, fmt: (v) => CC.pct(v, 2) });
      sim.num('m' + k, { label: 'Pago mínimo', value: m, min: 0, money: true });
    });
    sim.group('Presupuesto');
    sim.slider('B', { label: 'Disponible al mes para deudas', min: 300000, max: 5000000, step: 10000, value: 1000000, fmt: CC.cop });
    sim.out('av', 'Avalancha: meses / intereses');
    sim.out('bo', 'Bola de nieve: meses / intereses');
    sim.out('mi', 'Solo mínimos: meses / intereses');
    sim.out('ord', 'Mes en que se cierra cada deuda (avalancha · bola)', { wide: true });
    sim.onDraw(() => {
      const D = DEU.map(([nm], k) => ({ nombre: nm, saldo: sim.p['s' + k], im: sim.p['i' + k], minimo: sim.p['m' + k] }));
      const sumMin = D.reduce((s, d) => s + (d.saldo > 0 ? d.minimo : 0), 0);
      const R = ['avalancha', 'bola', 'minimos'].map((e) => K.debtPlan(D, e === 'minimos' ? sumMin : sim.p.B, e));
      CC.draw.clear(cv);
      const T0 = Math.max(...R.map((r) => (isFinite(r.meses) ? r.meses : r.serie.length - 1)), 6);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.min(T0, 240), ymin: 0, ymax: Math.max(...R.map((r) => Math.max(...r.serie))) * 1.05, xlabel: 'meses', ylabel: 'deuda total', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      const cols = ['--c1', '--c3', '--c2'];
      R.forEach((r, k) => pl.xy(r.serie.map((_, m) => m), r.serie, { color: cols[k], width: k === 2 ? 2 : 2.6, dash: k === 2 ? [6, 4] : [] }));
      pl.legend([{ label: 'avalancha (mayor tasa primero)', color: '--c1' }, { label: 'bola de nieve (menor saldo primero)', color: '--c3' }, { label: 'solo pagos mínimos', color: '--c2', dash: [6, 4] }], 'tr');
      const f = (r) => (isFinite(r.meses) ? `${r.meses} / ${CC.copS(r.totalInteres)}` : '<span class="loss">no alcanza</span>');
      sim.set('av', f(R[0]));
      sim.set('bo', f(R[1]));
      sim.set('mi', f(R[2]));
      sim.set('ord', D.map((d, k) => `${d.nombre}: ${R[0].deudas[k].fin ?? '—'} · ${R[1].deudas[k].fin ?? '—'}`).join('; '));
      if (sim.p.B < sumMin) sim.set('ord', `<span class="loss">El presupuesto (${CC.cop(sim.p.B)}) no cubre la suma de los mínimos (${CC.cop(sumMin)}).</span>`);
    });
  });

  /* 14.3 El mismo millón de cuatro maneras */
  CC.defineSim('gota-a-gota', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Costo efectivo anual de cuatro préstamos (escala logarítmica)' });
    sim.group('Gota a gota');
    sim.slider('P', { label: 'Monto prestado', min: 100000, max: 5000000, step: 50000, value: 1000000, fmt: CC.cop });
    sim.slider('rec', { label: 'Recargo', min: 0.05, max: 0.5, step: 0.01, value: 0.2, fmt: (v) => CC.pct(v, 0) });
    sim.slider('d', { label: 'Cuotas diarias', min: 10, max: 60, step: 1, value: 30, fmt: (v) => CC.nf(v) });
    sim.group('Alternativas formales (tasa mensual)');
    sim.slider('av', { label: 'Avance de tarjeta', min: 0.01, max: 0.03, step: 0.0005, value: 0.021, fmt: (v) => CC.pct(v, 2) });
    sim.slider('co', { label: 'Cooperativa o fondo de empleados', min: 0.005, max: 0.025, step: 0.0005, value: 0.013, fmt: (v) => CC.pct(v, 2) });
    sim.out('cu', 'Cuota diaria del gota a gota');
    sim.out('td', 'Tasa diaria implícita');
    sim.out('tm', 'Equivalente mensual');
    sim.out('ea', 'Equivalente efectivo anual', { hl: true });
    sim.out('x', 'Veces la tasa de usura');
    sim.onDraw(() => {
      const g = K.gotaAGota(sim.p.P, sim.p.rec, Math.round(sim.p.d));
      const u = L.tax.CO.usuraOct2026;
      const items = [['cooperativa', T.periodicToEa(sim.p.co, 12), '--c3'], ['avance de tarjeta', T.periodicToEa(sim.p.av, 12), '--c4'], ['usura (techo legal)', u, '--ink-3'], ['gota a gota', g.ea, '--loss']];
      CC.draw.clear(cv);
      const ctx = cv.ctx;
      const pl = new CC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.05, xmax: Math.max(200, g.ea * 5), xlog: true, ymin: 0, ymax: items.length, yticks: [], ml: 150, xlabel: 'tasa efectiva anual (escala logarítmica)', xfmt: (v) => CC.nf(100 * v, 0) + '%' });
      pl.frame();
      items.forEach(([nm, v, col], k) => {
        const yc = items.length - k - 0.5, y0 = pl.Y(yc + 0.3), y1 = pl.Y(yc - 0.3);
        ctx.fillStyle = CC.col(col); ctx.globalAlpha = 0.85; ctx.fillRect(pl.ix, y0, pl.X(v) - pl.ix, y1 - y0); ctx.globalAlpha = 1;
        CC.text(ctx, nm, pl.ix - 8, (y0 + y1) / 2, { size: 12.5, align: 'right', baseline: 'middle', weight: 650 });
        CC.text(ctx, CC.pct(v, 0) + ' E.A.', pl.X(v) + 6, (y0 + y1) / 2, { size: 12, baseline: 'middle', weight: 700, halo: true });
      });
      sim.set('cu', CC.cop(g.cuota));
      sim.set('td', CC.pct(g.tasaDiaria, 2));
      sim.set('tm', CC.pct(g.mensual, 1));
      sim.set('ea', CC.pct(g.ea, 0));
      sim.set('x', CC.nf(g.ea / u, 0) + ' veces');
    });
  });
})();
