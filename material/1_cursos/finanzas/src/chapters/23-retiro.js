/* Capítulo 23 — Pensión, retiro y la regla del 4 % */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, R = L.ret, I = L.inv, S = L.stat;

  /* 23.1 Regla del 4 % con datos históricos */
  CC.defineSim('regla-4', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Capital real final de cada retiro histórico' });
    sim.group('Retiro');
    sim.slider('w', { label: 'Tasa de retiro inicial', min: 0.02, max: 0.08, step: 0.0025, value: 0.04, fmt: (v) => CC.pct(v, 2) });
    sim.slider('ws', { label: 'Peso en acciones', min: 0, max: 1, step: 0.05, value: 0.6, fmt: (v) => CC.pct(v, 0) });
    sim.slider('N', { label: 'Duración del retiro (años)', min: 10, max: 50, step: 1, value: 30, fmt: (v) => CC.nf(v) });
    sim.seg('b', { label: 'Renta fija', options: [['tbond', 'Bonos 10 años'], ['tbill', 'Letras 3 meses']], value: 'tbond' });
    sim.out('ok', 'Retiros en los que el dinero alcanzó', { hl: true });
    sim.out('fail', 'Años de inicio que fallaron', { wide: true });
    sim.out('med', 'Capital real final mediano');
    sim.out('cap', 'Capital necesario por cada $1.000.000 de gasto anual');
    sim.onDraw(() => {
      const N = Math.round(sim.p.N);
      const h = R.historico(sim.p.w, sim.p.ws, N, 1928, L.DATA.us.years[L.DATA.us.years.length - 1], sim.p.b);
      CC.draw.clear(cv);
      const vals = h.map((x) => (x.ok ? x.finalReal : -0.15));
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1927, xmax: h[h.length - 1].inicio + 1, ymin: -0.25, ymax: Math.max(2, ...vals) * 1.1, xlabel: 'año en que empieza el retiro', ylabel: 'capital real final (inicio = 1)', xfmt: (v) => String(Math.round(v)), yfmt: (v) => CC.nf(v, 1) });
      pl.frame();
      pl.bars(h.map((x) => x.inicio), vals, { colors: h.map((x) => (x.ok ? '--c3' : '--loss')), w: 0.8 });
      pl.hline(1, { color: '--ink-3', label: 'capital inicial', labelRight: true });
      const ok = h.filter((x) => x.ok).length / h.length;
      const f = h.filter((x) => !x.ok);
      sim.set('ok', `${CC.pct(ok, 1)} (${h.length} periodos)`);
      sim.set('fail', f.length ? f.map((x) => `${x.inicio} (año ${x.anos + 1})`).join(', ') : 'ninguno');
      sim.set('med', CC.nf(S.quantile(h.map((x) => x.finalReal), 0.5), 2) + ' veces');
      sim.set('cap', CC.copS(1e6 / sim.p.w));
    });
  });

  /* 23.2 Riesgo de secuencia */
  CC.defineSim('secuencia', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1.1, label: 'Capital con las rentabilidades en orden real e inverso' }), cr = sim.canvas({ aspect: 1.1, label: 'Rentabilidades reales de cada año' });
    sim.group('Retiro');
    sim.slider('y0', { label: 'Año de inicio', min: 1928, max: 1996, step: 1, value: 1966, fmt: String });
    sim.slider('w', { label: 'Retiro anual (% del capital inicial)', min: 0.02, max: 0.08, step: 0.0025, value: 0.045, fmt: (v) => CC.pct(v, 2) });
    sim.slider('ws', { label: 'Peso en acciones', min: 0, max: 1, step: 0.05, value: 0.6, fmt: (v) => CC.pct(v, 0) });
    sim.out('g', 'Rentabilidad real geométrica (igual en ambos)');
    sim.out('f', 'Orden real: capital final', { hl: true });
    sim.out('r', 'Orden inverso: capital final', { hl: true });
    sim.onDraw(() => {
      const y0 = Math.round(sim.p.y0);
      const rs = I.mixRebal({ sp500: sim.p.ws, tbond: 1 - sim.p.ws }, y0, y0 + 29, true);
      const fw = R.withdrawPath(1, sim.p.w, rs), bw = R.withdrawPath(1, sim.p.w, [...rs].reverse());
      const xs = fw.map((_, k) => k);
      CC.draw.clear(cp);
      const p1 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 30, ymin: 0, ymax: Math.max(...fw, ...bw) * 1.1, xlabel: 'años de retiro', title: 'capital real (inicio = 1)', yfmt: (v) => CC.nf(v, 1) });
      p1.frame();
      p1.xy(xs, fw, { color: '--c2', width: 2.6 });
      p1.xy(xs, bw, { color: '--c3', width: 2.6 });
      p1.legend([{ label: `orden real desde ${y0}`, color: '--c2' }, { label: 'mismos años al revés', color: '--c3' }], 'tl');
      CC.draw.clear(cr);
      const m = Math.max(...rs.map(Math.abs)) * 1.15;
      const p2 = new CC.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: -0.5, xmax: 29.5, ymin: -m, ymax: m, xlabel: 'año de retiro (orden real)', title: 'rentabilidad real de cada año', yfmt: CC.pctAxis });
      p2.frame();
      p2.bars(rs.map((_, k) => k), rs, { signed: true, w: 0.75 });
      const z = (p) => { const k = p.findIndex((v) => v <= 0); return k > 0 ? `se agota en el año ${k}` : CC.nf(p[p.length - 1], 2) + ' veces el inicial'; };
      sim.set('g', CC.pct(S.geoMean(rs), 2));
      sim.set('f', z(fw));
      sim.set('r', z(bw));
    });
  });

  /* 23.3 Ciclo de vida */
  CC.defineSim('ciclo-vida', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Patrimonio a lo largo de la vida en 2.000 simulaciones' });
    sim.group('Hoy');
    sim.slider('e', { label: 'Edad actual', min: 20, max: 60, step: 1, value: 35, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('W0', { label: 'Ahorro para el retiro hoy', min: 0, max: 1000e6, step: 1e6, value: 20e6, fmt: CC.copS });
    sim.slider('A', { label: 'Ahorro mensual hasta el retiro', min: 0, max: 10e6, step: 50000, value: 600000, fmt: CC.cop });
    sim.group('Retiro (en pesos de hoy)');
    sim.slider('R', { label: 'Edad de retiro', min: 50, max: 75, step: 1, value: 62, fmt: (v) => CC.nf(v) + ' años' });
    sim.slider('G', { label: 'Gasto mensual deseado', min: 1e6, max: 30e6, step: 100000, value: 3.5e6, fmt: CC.copS });
    sim.slider('P', { label: 'Pensión mensual esperada', min: 0, max: 20e6, step: 100000, value: 2e6, fmt: CC.copS });
    sim.group('Mercado (real)');
    sim.slider('ma', { label: 'Rentabilidad antes del retiro', min: 0, max: 0.08, step: 0.0025, value: 0.05, fmt: (v) => CC.pct(v, 2) });
    sim.slider('mr', { label: 'Rentabilidad en el retiro', min: 0, max: 0.06, step: 0.0025, value: 0.035, fmt: (v) => CC.pct(v, 2) });
    sim.out('p', 'Probabilidad de que alcance hasta los 95', { hl: true });
    sim.out('w', 'Capital mediano al retirarse');
    sim.out('n', 'Capital necesario con la regla del 4 %');
    sim.onDraw(() => {
      const o = { edad: sim.p.e, retiroEdad: sim.p.R, finEdad: 95, ahorroAnual: 12 * sim.p.A, p0: sim.p.W0, gastoRetiro: 12 * sim.p.G, pension: 12 * sim.p.P, muAcc: sim.p.ma, sdAcc: 0.12, muRet: sim.p.mr, sdRet: 0.08, N: 2000, seed: 21 };
      const r = R.lifecycle(o);
      const q = I.fan(r.paths);
      const xs = r.paths[0].map((_, k) => o.edad + k);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: o.edad, xmax: 95, ymin: 0, ymax: Math.max(...q[3]) * 1.15 + 1, xlabel: 'edad', ylabel: 'patrimonio en pesos de hoy', yfmt: CC.copAxis, ml: 80 });
      pl.frame();
      pl.band(o.retiroEdad, 95, { color: '--gold', alpha: 0.06 });
      pl.between(xs, q[0], q[4], { color: '--c1', alpha: 0.1 });
      pl.between(xs, q[1], q[3], { color: '--c1', alpha: 0.2 });
      pl.xy(xs, q[2], { color: '--c1', width: 2.6 });
      pl.vline(o.retiroEdad, { color: '--gold', label: 'retiro', dash: [] });
      const k = o.retiroEdad - o.edad;
      sim.set('p', CC.pct(r.pExito, 0));
      sim.set('w', CC.copS(q[2][k]));
      sim.set('n', CC.copS(Math.max(0, o.gastoRetiro - o.pension) / 0.04));
    });
  });
})();
