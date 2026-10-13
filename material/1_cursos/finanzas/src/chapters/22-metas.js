/* Capítulo 22 — Metas y plan financiero */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, T = L.tvm, I = L.inv;

  /* 22.1 Plan mes a mes por etapas */
  CC.defineSim('priorizar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Saldos de cada etapa del plan mes a mes' });
    sim.group('Hogar');
    sim.slider('ex', { label: 'Excedente mensual', min: 100000, max: 5000000, step: 50000, value: 600000, fmt: CC.cop });
    sim.slider('g', { label: 'Gasto mensual total', min: 1000000, max: 20000000, step: 100000, value: 5900000, fmt: CC.copS });
    sim.slider('c0', { label: 'Colchón actual', min: 0, max: 50000000, step: 500000, value: 5000000, fmt: CC.copS });
    sim.slider('d0', { label: 'Deuda cara', min: 0, max: 50000000, step: 500000, value: 6000000, fmt: CC.copS });
    sim.slider('td', { label: 'Tasa mensual de la deuda cara', min: 0.005, max: 0.03, step: 0.0005, value: 0.024, fmt: (v) => CC.pct(v, 2) });
    sim.slider('mc', { label: 'Meta de colchón (meses)', min: 1, max: 12, step: 0.5, value: 3, fmt: (v) => CC.nf(v, 1) });
    sim.slider('pr', { label: 'Después: parte para el retiro', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => CC.pct(v, 0) });
    sim.out('e1', 'Colchón mínimo (1 mes) listo en');
    sim.out('e2', 'Deuda cara pagada en', { hl: true });
    sim.out('e3', 'Colchón completo en');
    sim.out('it', 'Intereses pagados por la deuda');
    sim.out('r5', 'Al mes 60: retiro / otras metas');
    sim.onDraw(() => {
      const p = sim.p, M = 72, im = 0.003;
      let col = p.c0, deu = p.d0, ret = 0, otr = 0, it = 0;
      const S = { col: [], deu: [], ret: [], otr: [] };
      let m1 = col >= p.g ? 0 : -1, m2 = deu <= 0 ? 0 : -1, m3 = col >= p.mc * p.g ? 0 : -1;
      for (let m = 1; m <= M; m++) {
        if (deu > 0) { const i = deu * p.td; deu += i; it += i; }
        col *= 1 + im; ret *= 1.005; otr *= 1.004;
        let caja = p.ex;
        if (col < p.g) { const u = Math.min(caja, p.g - col); col += u; caja -= u; }
        if (caja > 0 && deu > 0) { const u = Math.min(caja, deu); deu -= u; caja -= u; }
        if (caja > 0 && col < p.mc * p.g) { const u = Math.min(caja, p.mc * p.g - col); col += u; caja -= u; }
        if (caja > 0) { ret += caja * p.pr; otr += caja * (1 - p.pr); }
        if (m1 < 0 && col >= p.g - 0.5) m1 = m;
        if (m2 < 0 && deu <= 0.5) m2 = m;
        if (m3 < 0 && col >= p.mc * p.g - 0.5) m3 = m;
        S.col.push(col); S.deu.push(deu); S.ret.push(ret); S.otr.push(otr);
      }
      const xs = S.col.map((_, k) => k + 1);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: M, ymin: 0, ymax: Math.max(...S.col, ...S.deu, ...S.ret, ...S.otr, p.d0) * 1.1, xlabel: 'meses', yfmt: CC.copAxis, ml: 66 });
      pl.frame();
      pl.xy([0, ...xs], [p.d0, ...S.deu], { color: '--c2', width: 2.4 });
      pl.xy([0, ...xs], [p.c0, ...S.col], { color: '--c3', width: 2.4 });
      pl.xy([0, ...xs], [0, ...S.ret], { color: '--c1', width: 2.4 });
      pl.xy([0, ...xs], [0, ...S.otr], { color: '--c4', width: 2.4 });
      [[m1, 'colchón mínimo'], [m2, 'deuda pagada'], [m3, 'colchón completo']].forEach(([m, t], k) => { if (m > 0) pl.vline(m, { color: '--ink-3', label: t, labelY: 14 + 16 * k, width: 1 }); });
      pl.legend([{ label: 'deuda cara', color: '--c2' }, { label: 'colchón', color: '--c3' }, { label: 'retiro', color: '--c1' }, { label: 'otras metas', color: '--c4' }], 'tr');
      const f = (m) => (m === 0 ? 'ya está' : m > 0 ? `mes ${m}` : 'más de 6 años');
      sim.set('e1', f(m1));
      sim.set('e2', f(m2));
      sim.set('e3', f(m3));
      sim.set('it', CC.cop(it));
      sim.set('r5', `${CC.copS(S.ret[59])} / ${CC.copS(S.otr[59])}`);
    });
  });

  /* 22.2 Cuota para una meta y probabilidad */
  CC.defineSim('meta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, label: 'Trayectorias del ahorro hacia la meta' });
    sim.group('Meta (en pesos de hoy)');
    sim.slider('F', { label: 'Valor de la meta', min: 2e6, max: 1000e6, step: 1e6, value: 40e6, fmt: CC.copS });
    sim.slider('n', { label: 'Años', min: 1, max: 40, step: 1, value: 5, fmt: (v) => CC.nf(v) });
    sim.slider('W0', { label: 'Ahorro actual', min: 0, max: 500e6, step: 1e6, value: 0, fmt: CC.copS });
    sim.group('Instrumento');
    sim.slider('r', { label: 'Rentabilidad real esperada', min: 0, max: 0.08, step: 0.0025, value: 0.03, fmt: (v) => CC.pct(v, 2) });
    sim.slider('s', { label: 'Volatilidad anual', min: 0, max: 0.3, step: 0.01, value: 0.06, fmt: (v) => CC.pct(v, 0) });
    sim.slider('x', { label: 'Ahorro mensual frente a la cuota calculada', min: 0.5, max: 2, step: 0.05, value: 1, fmt: (v) => CC.pct(v, 0) });
    sim.out('cuota', 'Cuota calculada (rentabilidad esperada)');
    sim.out('ah', 'Ahorro mensual usado', { hl: true });
    sim.out('p', 'Probabilidad de alcanzar la meta', { hl: true });
    sim.out('p10', 'En el 10 % de peores casos se llega a');
    sim.onDraw(() => {
      const n = Math.round(sim.p.n), im = T.eaToPeriodic(sim.p.r, 12);
      const cuota = Math.max(0, -T.pmt(im, n * 12, -sim.p.W0, sim.p.F));
      const A = cuota * sim.p.x;
      const P = I.paths({ mu: sim.p.r, sigma: Math.max(1e-6, sim.p.s), anos: n, aporte: A, p0: sim.p.W0, n: 1500, seed: 5 }).paths;
      const q = I.fan(P, [0.1, 0.25, 0.5, 0.75, 0.9]);
      const xs = L.util.range(n + 1);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax: Math.max(sim.p.F, q[4][n]) * 1.12, xlabel: 'años', ylabel: 'en pesos de hoy', yfmt: CC.copAxis, ml: 78 });
      pl.frame();
      pl.between(xs, q[0], q[4], { color: '--c1', alpha: 0.12 });
      pl.between(xs, q[1], q[3], { color: '--c1', alpha: 0.2 });
      pl.xy(xs, q[2], { color: '--c1', width: 2.6 });
      pl.hline(sim.p.F, { color: '--gold', label: 'meta', labelRight: true, dash: [] });
      const ok = P.filter((p) => p[n] >= sim.p.F).length / P.length;
      sim.set('cuota', CC.cop(cuota));
      sim.set('ah', CC.cop(A));
      sim.set('p', CC.pct(ok, 0));
      sim.set('p10', `${CC.copS(q[0][n])} (${CC.pct(q[0][n] / sim.p.F, 0)} de la meta)`);
    });
  });

  /* 22.3 Probabilidad de pérdida real por horizonte */
  CC.defineSim('cubetas', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1.1, label: 'Fracción de ventanas con pérdida real' }), cw = sim.canvas({ aspect: 1.1, label: 'Peor rentabilidad real anualizada' });
    sim.group('Horizonte');
    sim.slider('N', { label: 'Años hasta la meta', min: 1, max: 30, step: 1, value: 5, fmt: (v) => CC.nf(v) });
    sim.out('t', 'Recomendación habitual', { wide: true, hl: true });
    const Y1 = L.DATA.us.years[L.DATA.us.years.length - 1];
    const P = [['Letras', I.series('tbill', 1928, Y1, true), '--c6'], ['Bonos', I.series('tbond', 1928, Y1, true), '--c3'], ['60/40', I.mixRebal({ sp500: 0.6, tbond: 0.4 }, 1928, Y1, true), '--accent'], ['Acciones', I.series('sp500', 1928, Y1, true), '--c1']];
    sim.onDraw(() => {
      const N = Math.round(sim.p.N);
      const st = P.map(([n, r, c]) => { const w = I.rolling(r, N); return { n, c, neg: w.filter((x) => x < 0).length / w.length, min: Math.min(...w) }; });
      CC.draw.clear(cp);
      const p1 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -0.6, xmax: 3.6, ymin: 0, ymax: 0.6, xticks: [], title: `ventanas de ${N} años con pérdida real`, yfmt: CC.pctAxis, mb: 30 });
      p1.frame();
      p1.bars([0, 1, 2, 3], st.map((s) => s.neg), { colors: st.map((s) => s.c), w: 0.6, labels: true, fmt: (v) => CC.pct(v, 0) });
      st.forEach((s, k) => CC.text(cp.ctx, s.n, p1.X(k), p1.iy + p1.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      CC.draw.clear(cw);
      const lo = Math.min(-0.05, ...st.map((s) => s.min)) * 1.2;
      const p2 = new CC.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: -0.6, xmax: 3.6, ymin: lo, ymax: 0.03, xticks: [], title: 'peor rentabilidad real anualizada', yfmt: CC.pctAxis, mb: 30 });
      p2.frame();
      p2.bars([0, 1, 2, 3], st.map((s) => s.min), { colors: st.map((s) => s.c), w: 0.6, labels: true, fmt: (v) => CC.pct(v, 1) });
      st.forEach((s, k) => CC.text(cw.ctx, s.n, p2.X(k), p2.iy + p2.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      sim.set('t', N < 2 ? 'Liquidez: cuenta de ahorros, CDT cortos, FIC a la vista.' : N < 5 ? 'Renta fija de corto plazo: escalera de CDT, FIC de renta fija.' : N < 10 ? 'Mezcla de renta fija y acciones, bajando el riesgo al acercarse la fecha.' : 'Portafolio diversificado con proporción importante de acciones, a bajo costo.');
    });
  });
})();
