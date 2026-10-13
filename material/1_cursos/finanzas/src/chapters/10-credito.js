/* Capítulo 10 — Créditos y tablas de amortización */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm, K = L.cred;

  /* 10.1 Tabla de amortización */
  CC.defineSim('amortizacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, label: 'Interés y abono a capital de cada año' });
    const tab = sim.html('scroll');
    sim.group('Crédito');
    sim.slider('P', { label: 'Monto', min: 5000000, max: 500000000, step: 5000000, value: 150000000, fmt: CC.copS });
    sim.slider('a', { label: 'Plazo (años)', min: 1, max: 30, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.slider('ea', { label: 'Tasa efectiva anual', min: 0.04, max: 0.3, step: 0.0025, value: 0.125, fmt: (v) => CC.pct(v, 2) });
    sim.seg('sis', { label: 'Sistema', options: [['f', 'Cuota fija'], ['g', 'Abono constante']], value: 'f' });
    sim.out('c1', 'Primera cuota');
    sim.out('cn', 'Última cuota');
    sim.out('ti', 'Total de intereses', { hl: true });
    sim.out('tp', 'Total pagado');
    sim.out('x', 'El abono supera al interés desde la cuota');
    sim.onDraw(() => {
      const n = Math.round(sim.p.a * 12), im = T.eaToPeriodic(sim.p.ea, 12);
      const R = sim.p.sis === 'f' ? K.french(sim.p.P, im, n) : K.german(sim.p.P, im, n);
      const Y = Math.ceil(n / 12), yi = new Array(Y).fill(0), yc = new Array(Y).fill(0);
      R.rows.forEach((r) => { const y = Math.floor((r.k - 1) / 12); yi[y] += r.interes; yc[y] += r.capital; });
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: Y + 0.6, ymin: 0, ymax: Math.max(...yi.map((v, k) => v + yc[k])) * 1.12, xlabel: 'año del crédito', ylabel: 'pagado en el año', yfmt: CC.copAxis, ml: 78 });
      pl.frame();
      const xs = yi.map((_, k) => k + 1);
      pl.stack(xs, [{ ys: yc, color: '--c1' }, { ys: yi, color: '--c2' }], { w: 0.72 });
      pl.legend([{ label: 'abono a capital', color: '--c1', kind: 'sq' }, { label: 'intereses', color: '--c2', kind: 'sq' }], 'tr');
      const cross = R.rows.findIndex((r) => r.capital > r.interes);
      sim.set('c1', CC.cop(R.rows[0].cuota));
      sim.set('cn', CC.cop(R.rows[n - 1].cuota));
      sim.set('ti', CC.copS(R.totalInteres));
      sim.set('tp', CC.copS(R.totalPagado));
      sim.set('x', cross >= 0 ? `${cross + 1} (año ${Math.ceil((cross + 1) / 12)})` : 'nunca');
      const show = R.rows.filter((r) => r.k <= 12 || r.k % 12 === 0 || r.k === n);
      tab.innerHTML = '<p class="ctrl-note" style="margin:0 0 6px">Tabla de amortización (primer año completo y luego una cuota por año)</p>' +
        CC.table(['Cuota', 'Valor', 'Interés', 'Abono a capital', 'Saldo'], show.map((r) => [r.k, CC.cop(r.cuota), CC.cop(r.interes), CC.cop(r.capital), CC.cop(r.saldo)]));
    });
  });

  /* 10.2 Abonos extraordinarios */
  CC.defineSim('abonos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Saldo del crédito con y sin abonos' });
    sim.group('Crédito');
    sim.slider('P', { label: 'Monto', min: 5000000, max: 500000000, step: 5000000, value: 150000000, fmt: CC.copS });
    sim.slider('a', { label: 'Plazo (años)', min: 1, max: 30, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.slider('ea', { label: 'Tasa efectiva anual', min: 0.04, max: 0.3, step: 0.0025, value: 0.125, fmt: (v) => CC.pct(v, 2) });
    sim.group('Abonos');
    sim.slider('x', { label: 'Abono extra mensual', min: 0, max: 3000000, step: 10000, value: 200000, fmt: CC.cop });
    sim.slider('pr', { label: 'Abono extra cada diciembre (prima)', min: 0, max: 20000000, step: 100000, value: 0, fmt: CC.copS });
    sim.seg('modo', { label: 'El abono', options: [['plazo', 'Reduce el plazo'], ['cuota', 'Reduce la cuota']], value: 'plazo' });
    sim.out('m', 'Duración del crédito', { hl: true });
    sim.out('ia', 'Intereses ahorrados', { hl: true });
    sim.out('ab', 'Total abonado extra');
    sim.out('cf', 'Cuota mensual sin el abono extra');
    sim.onDraw(() => {
      const n = Math.round(sim.p.a * 12), im = T.eaToPeriodic(sim.p.ea, 12);
      const base = K.french(sim.p.P, im, n);
      const ex = (k) => sim.p.x + (k % 12 === 0 ? sim.p.pr : 0);
      const R = K.prepay(sim.p.P, im, n, ex, sim.p.modo);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n / 12, ymin: 0, ymax: sim.p.P * 1.05, xlabel: 'años', ylabel: 'saldo', yfmt: CC.copAxis, ml: 78 });
      pl.frame();
      pl.xy([0, ...base.rows.map((r) => r.k / 12)], [sim.p.P, ...base.rows.map((r) => r.saldo)], { color: '--c6', width: 2.2, dash: [6, 4] });
      pl.xy([0, ...R.rows.map((r) => r.k / 12)], [sim.p.P, ...R.rows.map((r) => r.saldo)], { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.08 });
      pl.legend([{ label: 'sin abonos', color: '--c6', dash: [6, 4] }, { label: 'con abonos', color: '--c1' }], 'tr');
      const ah = base.totalInteres - R.totalInteres;
      sim.set('m', `${CC.yrs(R.meses / 12)} (${R.meses} cuotas, ${CC.nf((n - R.meses) / 12, 1)} años menos)`);
      sim.set('ia', `<span class="gain">${CC.copS(ah)}</span>`);
      sim.set('ab', CC.copS(R.totalAbonos));
      sim.set('cf', sim.p.modo === 'plazo' ? `${CC.cop(base.rows[0].cuota)} (no cambia)` : `${CC.cop(R.rows[R.rows.length - 1].cuota)} (baja con cada abono)`);
    });
  });

  /* 10.3 Pesos frente a UVR */
  CC.defineSim('uvr-pesos', function (sim) {
    sim.cols2();
    const cc = sim.canvas({ aspect: 1.15, label: 'Cuota mensual en pesos y en UVR' }), cs = sim.canvas({ aspect: 1.15, label: 'Saldo en pesos' });
    sim.group('Crédito');
    sim.slider('P', { label: 'Monto', min: 20000000, max: 500000000, step: 5000000, value: 150000000, fmt: CC.copS });
    sim.slider('a', { label: 'Plazo (años)', min: 5, max: 30, step: 1, value: 20, fmt: (v) => CC.nf(v) });
    sim.slider('ep', { label: 'Tasa en pesos (E.A.)', min: 0.06, max: 0.25, step: 0.0025, value: 0.125, fmt: (v) => CC.pct(v, 2) });
    sim.slider('er', { label: 'Tasa real en UVR (E.A.)', min: 0.02, max: 0.15, step: 0.0025, value: 0.075, fmt: (v) => CC.pct(v, 2) });
    sim.slider('pi', { label: 'Inflación anual supuesta', min: 0, max: 0.15, step: 0.0025, value: 0.045, fmt: (v) => CC.pct(v, 2) });
    sim.out('c0', 'Cuota inicial: pesos / UVR');
    sim.out('cn', 'Cuota final: pesos / UVR');
    sim.out('tn', 'Total pagado (pesos corrientes): pesos / UVR', { wide: true });
    sim.out('tr', 'Total pagado en pesos de hoy: pesos / UVR', { wide: true, hl: true });
    sim.out('mx', 'Saldo máximo en UVR (en pesos)');
    sim.onDraw(() => {
      const U = K.uvrVsPesos({ P: sim.p.P, realEA: sim.p.er, inflEA: sim.p.pi, pesosEA: sim.p.ep, anos: sim.p.a });
      const n = U.rows.length, xs = U.rows.map((r) => r.k / 12);
      CC.draw.clear(cc);
      const cmax = Math.max(U.cuotaPesos, ...U.rows.map((r) => r.cuotaUVR)) * 1.1;
      const p1 = new CC.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 0, xmax: sim.p.a, ymin: 0, ymax: cmax, xlabel: 'años', title: 'cuota mensual', yfmt: CC.copAxis, ml: 66 });
      p1.frame();
      p1.xy(xs, U.rows.map(() => U.cuotaPesos), { color: '--c1', width: 2.4 });
      p1.xy(xs, U.rows.map((r) => r.cuotaUVR), { color: '--c4', width: 2.4 });
      p1.legend([{ label: 'en pesos', color: '--c1' }, { label: 'en UVR', color: '--c4' }], 'tl');
      CC.draw.clear(cs);
      const smax = Math.max(sim.p.P, ...U.rows.map((r) => r.saldoUVR)) * 1.08;
      const p2 = new CC.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: sim.p.a, ymin: 0, ymax: smax, xlabel: 'años', title: 'saldo de la deuda en pesos', yfmt: CC.copAxis, ml: 66 });
      p2.frame();
      p2.hline(sim.p.P, { color: '--ink-3', label: 'monto prestado', labelRight: true });
      p2.xy([0, ...xs], [sim.p.P, ...U.rows.map((r) => r.saldoPesos)], { color: '--c1', width: 2.4 });
      p2.xy([0, ...xs], [sim.p.P, ...U.rows.map((r) => r.saldoUVR)], { color: '--c4', width: 2.4 });
      const gm = T.eaToPeriodic(sim.p.pi, 12);
      let rp = 0, ru = 0;
      U.rows.forEach((r) => { const d = Math.pow(1 + gm, r.k); rp += U.cuotaPesos / d; ru += r.cuotaUVR / d; });
      sim.set('c0', `${CC.copS(U.cuotaPesos, 2)} / ${CC.copS(U.rows[0].cuotaUVR, 2)}`);
      sim.set('cn', `${CC.copS(U.cuotaPesos, 2)} / ${CC.copS(U.rows[n - 1].cuotaUVR, 2)}`);
      sim.set('tn', `${CC.copS(U.totalPesos)} / ${CC.copS(U.totalUVR)}`);
      sim.set('tr', `${CC.copS(rp)} / ${CC.copS(ru)}`);
      sim.set('mx', CC.copS(Math.max(...U.rows.map((r) => r.saldoUVR))));
    });
  });
})();
