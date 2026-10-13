/* Capítulo 7 — Tasas de interés */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm;

  /* 7.1 Conversor de tasas */
  CC.defineSim('conversor-tasas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Nominal equivalente según la frecuencia de capitalización' });
    sim.group('Tasa anunciada');
    sim.select('tipo', { label: 'Tipo', value: 'ea', options: [['ea', 'Efectiva anual (E.A.)'], ['nmv', 'Nominal mes vencido (N.M.V.)'], ['ntv', 'Nominal trimestre vencido (N.T.V.)'], ['nsv', 'Nominal semestre vencido (N.S.V.)'], ['nma', 'Nominal mes anticipado (N.M.A.)'], ['nta', 'Nominal trimestre anticipado (N.T.A.)'], ['mv', 'Mensual vencida (periódica)'], ['dv', 'Diaria (periódica, 365 días)']] });
    sim.slider('v', { label: 'Valor', min: 0.001, max: 0.6, step: 0.0005, value: 0.18, fmt: (v) => CC.pct(v, 2) });
    sim.out('tab', 'Equivalencias', { wide: true });
    const toEA = (t, v) => ({ ea: v, nmv: T.nominalToEa(v, 12), ntv: T.nominalToEa(v, 4), nsv: T.nominalToEa(v, 2), nma: T.nominalAntToEa(v, 12), nta: T.nominalAntToEa(v, 4), mv: T.periodicToEa(v, 12), dv: T.periodicToEa(v, 365) }[t]);
    sim.onChange = (id) => {
      if (id === 'tipo') { const t = sim.p.tipo; sim.ctl.v.range(0.0001, t === 'mv' ? 0.1 : t === 'dv' ? 0.005 : 0.6, t === 'dv' ? 0.00001 : 0.0001); sim.ctl.v.set(t === 'mv' ? 0.015 : t === 'dv' ? 0.0005 : 0.18, true); }
    };
    sim.onDraw(() => {
      const ea = toEA(sim.p.tipo, sim.p.v);
      const ims = T.eaToPeriodic(ea, 12), its = T.eaToPeriodic(ea, 4);
      const rows = [
        ['Efectiva anual (E.A.)', CC.pct(ea, 3)],
        ['Mensual vencida', CC.pct(ims, 4)],
        ['Nominal mes vencido (N.M.V.)', CC.pct(12 * ims, 3)],
        ['Trimestral vencida', CC.pct(its, 4)],
        ['Nominal trimestre vencido (N.T.V.)', CC.pct(4 * its, 3)],
        ['Nominal semestre vencido (N.S.V.)', CC.pct(T.eaToNominal(ea, 2), 3)],
        ['Mensual anticipada', CC.pct(T.vencToAnt(ims), 4)],
        ['Nominal mes anticipado (N.M.A.)', CC.pct(12 * T.vencToAnt(ims), 3)],
        ['Nominal trimestre anticipado (N.T.A.)', CC.pct(4 * T.vencToAnt(its), 3)],
        ['Diaria (365)', CC.pct(T.eaToPeriodic(ea, 365), 5)],
        ['Continua', CC.pct(T.eaToContinuous(ea), 3)]
      ];
      sim.set('tab', CC.table(['Forma', 'Tasa'], rows));
      CC.draw.clear(cv);
      const items = [['anual', T.eaToNominal(ea, 1)], ['semestral', T.eaToNominal(ea, 2)], ['trimestral', T.eaToNominal(ea, 4)], ['mensual', T.eaToNominal(ea, 12)], ['diaria', T.eaToNominal(ea, 365)], ['continua', T.eaToContinuous(ea)], ['mes anticipado', 12 * T.vencToAnt(ims)]];
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.6, xmax: items.length - 0.4, ymin: 0, ymax: ea * 1.18, xticks: [], ylabel: 'tasa nominal anual', yfmt: CC.pctAxis, title: `nominales equivalentes a ${CC.pct(ea, 2)} E.A.` });
      pl.frame();
      pl.bars(items.map((_, k) => k), items.map((x) => x[1]), { colors: items.map((_, k) => (k === 6 ? '--c4' : k === 0 ? '--ink-3' : '--c1')), w: 0.62, labels: true, fmt: (v) => CC.pct(v, 2) });
      items.forEach(([n], k) => CC.text(cv.ctx, n, pl.X(k), pl.iy + pl.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
    });
  });

  /* 7.2 Tasa real */
  CC.defineSim('tasa-real', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Tasa real frente a inflación' });
    sim.group('El ahorro');
    sim.slider('i', { label: 'Tasa nominal E.A.', min: 0, max: 0.25, step: 0.0025, value: 0.09, fmt: (v) => CC.pct(v, 2) });
    sim.slider('pi', { label: 'Inflación', min: -0.02, max: 0.3, step: 0.0025, value: 0.051, fmt: (v) => CC.pct(v, 2) });
    sim.slider('tx', { label: 'Impuesto sobre los intereses', min: 0, max: 0.35, step: 0.01, value: 0, fmt: (v) => CC.pct(v, 0) });
    sim.out('r', 'Tasa real exacta', { hl: true });
    sim.out('ra', 'Aproximación i − π');
    sim.out('rt', 'Tasa real después de impuestos');
    sim.out('be', 'Inflación que deja la tasa real en cero');
    sim.onDraw(() => {
      const { i, pi, tx } = sim.p, inet = i * (1 - tx);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.02, xmax: 0.3, ymin: -0.25, ymax: 0.25, xlabel: 'inflación', ylabel: 'tasa real', xfmt: CC.pctAxis, yfmt: CC.pctAxis });
      pl.frame();
      pl.between([-0.02, 0.3], [-0.25, -0.25], [0, 0], { color: '--loss', alpha: 0.06 });
      pl.fn((p) => T.real(i, p), { color: '--c1', width: 2.6 });
      pl.fn((p) => i - p, { color: '--c6', width: 1.5, dash: [5, 4] });
      if (tx > 0) pl.fn((p) => T.real(inet, p), { color: '--c2', width: 2.2 });
      pl.dot(pi, T.real(i, pi), { color: '--c1', label: CC.pct(T.real(i, pi), 2) });
      Object.entries(L.tax.CO.inflacion).forEach(([y, v]) => pl.vline(v, { color: '--ink-3', label: y, labelY: 12 + 14 * (y % 2), width: 1, dash: [2, 3] }));
      pl.legend([{ label: 'real exacta (Fisher)', color: '--c1' }, { label: 'aproximación i − π', color: '--c6', dash: [5, 4] }].concat(tx > 0 ? [{ label: 'real después de impuestos', color: '--c2' }] : []), 'tr');
      sim.set('r', CC.pct(T.real(i, pi), 2));
      sim.set('ra', CC.pct(i - pi, 2));
      sim.set('rt', CC.pct(T.real(inet, pi), 2));
      sim.set('be', CC.pct(inet, 2));
    });
  });

  /* 7.3 Costo efectivo de un crédito */
  CC.defineSim('costo-total', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Composición de todo lo pagado' });
    sim.group('Crédito');
    sim.slider('P', { label: 'Monto', min: 1000000, max: 60000000, step: 500000, value: 10000000, fmt: CC.copS });
    sim.slider('n', { label: 'Plazo (meses)', min: 6, max: 84, step: 1, value: 36, fmt: (v) => CC.nf(v) });
    sim.slider('im', { label: 'Tasa mensual anunciada', min: 0.005, max: 0.025, step: 0.0005, value: 0.018, fmt: (v) => CC.pct(v, 2) });
    sim.group('Cobros adicionales');
    sim.slider('com', { label: 'Comisión inicial (del monto)', min: 0, max: 0.06, step: 0.0025, value: 0.02, fmt: (v) => CC.pct(v, 2) });
    sim.slider('seg', { label: 'Seguro mensual sobre el saldo', min: 0, max: 0.003, step: 0.0001, value: 0.001, fmt: (v) => CC.pct(v, 2) });
    sim.slider('cm', { label: 'Cuota de manejo mensual', min: 0, max: 50000, step: 1000, value: 15000, fmt: CC.cop });
    sim.out('cb', 'Cuota sin cobros');
    sim.out('ct', 'Pago mensual promedio con cobros');
    sim.out('ea', 'Tasa E.A. anunciada');
    sim.out('ef', 'Costo efectivo E.A. (TIR)', { hl: true });
    sim.out('us', 'Frente a la usura (octubre de 2026)');
    sim.onDraw(() => {
      const { P, n, im, com, seg, cm } = sim.p;
      const c = L.cred.costoTotal({ P, im, n: Math.round(n), comisionInicial: com * P, seguroTasa: seg, cuotaManejo: cm });
      const fr = L.cred.french(P, im, Math.round(n));
      const totSeg = fr.rows.reduce((s, r) => s + seg * (r.saldo + r.capital), 0);
      const parts = [['capital', P, '--c6'], ['intereses', fr.totalInteres, '--c1'], ['seguros', totSeg, '--c4'], ['cuotas de manejo', cm * n, '--c5'], ['comisión', com * P, '--c2']];
      CC.draw.clear(cv);
      const tot = parts.reduce((s, x) => s + x[1], 0);
      const ctx = cv.ctx, x0 = 24, x1 = cv.w - 24, yb = 44, hb = Math.min(60, cv.h * 0.2);
      let x = x0;
      parts.forEach(([, v, col]) => {
        const w = ((x1 - x0) * v) / tot;
        ctx.fillStyle = CC.col(col); ctx.globalAlpha = 0.85;
        ctx.fillRect(x, yb, Math.max(0, w - 1), hb);
        ctx.globalAlpha = 1;
        x += w;
      });
      /* leyenda en filas: color, concepto, monto y porcentaje del total */
      const rowH = Math.min(26, (cv.h - yb - hb - 20) / parts.length);
      parts.forEach(([nm, v, col], k) => {
        const y = yb + hb + 22 + k * rowH;
        ctx.fillStyle = CC.col(col); ctx.fillRect(x0, y - 9, 14, 14);
        CC.text(ctx, nm, x0 + 22, y + 2, { size: 13, color: '--ink', weight: 600 });
        CC.text(ctx, CC.cop(v), x0 + 220, y + 2, { size: 12.5, color: '--ink-2', mono: true, align: 'right' });
        CC.text(ctx, CC.pct(v / tot, 1), x0 + 290, y + 2, { size: 12.5, color: '--ink-3', mono: true, align: 'right' });
      });
      CC.text(ctx, `Total pagado ${CC.copS(c.totalPagado + com * P)} por un crédito de ${CC.copS(P)}`, x0, yb - 14, { size: 14, weight: 700 });
      sim.set('cb', CC.cop(c.cuota));
      sim.set('ct', CC.cop(-c.flujos.slice(1).reduce((s, v) => s + v, 0) / n));
      sim.set('ea', CC.pct(c.eaAnunciada, 2));
      sim.set('ef', CC.pct(c.ea, 2));
      const u = L.tax.CO.usuraOct2026;
      sim.set('us', c.ea > u ? `<span class="loss">${CC.pct(c.ea - u, 2)} por encima</span>` : `${CC.pct(u - c.ea, 2)} por debajo`);
    });
  });
})();
