/* Capítulo 10 — El motor de backtest */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;
  const dsOptions = [['m1', 'M1 · 3.4 meses'], ['m5', 'M5 · 17 meses']];
  const SHORT = { slk: 0.5, slmin: 15, slmax: 60, tpk: 0.5, tpmin: 15, tpmax: 60 };

  /* ======================================================================
     10.1 Orden intrabarra
     ====================================================================== */
  ML.defineSim('intrabarra', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, maxH: '380px' });
    sim.group('Datos');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.seg('pre', { label: 'Niveles', options: [['man', 'Del manual (45–60 / 80–100)'], ['cor', 'Cortos (15–60 pips)']], value: 'cor' });
    sim.out('dif', 'Operaciones que cambian', { hl: true });
    sim.out('a', 'R medio · orden normal');
    sim.out('b', 'R medio · orden pesimista');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      /* izquierda: una vela con stop y TP en su rango */
      const x0 = 40, wC = W * 0.38, cx = x0 + wC * 0.5;
      const Yp = (v) => 28 + (H - 80) * (1 - v);
      ctx.strokeStyle = ML.col('--c2'); ctx.fillStyle = ML.col('--c2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, Yp(0.92)); ctx.lineTo(cx, Yp(0.08)); ctx.stroke();
      ctx.fillRect(cx - 18, Yp(0.7), 36, Yp(0.3) - Yp(0.7));
      const lines = [[0.92, 'TP', '--c3'], [0.55, 'entrada', '--accent'], [0.08, 'SL', '--c2']];
      lines.forEach(([v, lab, col]) => { ctx.strokeStyle = ML.col(col); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, Yp(v)); ctx.lineTo(x0 + wC, Yp(v)); ctx.stroke(); ctx.setLineDash([]); ML.text(ctx, lab, x0 + wC + 6, Yp(v), { size: 11.5, color: col, baseline: 'middle', weight: 700 }); });
      ML.text(ctx, 'Una vela que contiene el SL y el TP', x0, 14, { size: 12, color: '--ink-2', weight: 600 });
      ML.text(ctx, 'normal (barra bajista): máx → mín', x0, H - 30, { size: 11.5, color: '--ink-2' });
      ML.text(ctx, 'para una compra: TP primero → +1.64 R', x0, H - 14, { size: 11.5, color: '--c3', weight: 600 });
      ML.text(ctx, 'pesimista: SL primero → −1 R', x0 + wC * 0.62, H - 14, { size: 11.5, color: '--c2', weight: 600 });
      if (!D) return;
      const { S, X } = B().get(D, sim.p.ds), kw = sim.p.pre === 'cor' ? SHORT : {};
      const Pa = E().params(kw), Pb = E().params(Object.assign({ pess: true }, kw));
      const ta = E().run(S, X, Pa), tb = E().run(S, X, Pb);
      let dif = 0;
      if (ta.length === tb.length) ta.forEach((t, i) => { if (t.k !== tb[i].k || t.reason !== tb[i].reason) dif++; }); else dif = Math.abs(ta.length - tb.length);
      const sa = E().stats(ta, Pa), sb = E().stats(tb, Pb);
      const pl = new ML.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0.4, xmax: 2.6, ymin: Math.min(-0.15, sa.avgR - 0.2, sb.avgR - 0.2), ymax: Math.max(0.2, sa.avgR + 0.2, sb.avgR + 0.2), ml: 54, mb: 44, ylabel: 'R medio (IC 95 %)', xticks: [1, 2], xfmt: (v) => ['orden normal', 'pesimista'][v - 1] || '' });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      ML.draw.errbars(pl, [{ x: 1, m: sa.avgR, lo: sa.avgR - 1.96 * sa.seR, hi: sa.avgR + 1.96 * sa.seR, color: '--accent' }, { x: 2, m: sb.avgR, lo: sb.avgR - 1.96 * sb.seR, hi: sb.avgR + 1.96 * sb.seR, color: '--c2' }]);
      sim.set('dif', dif + ' de ' + ta.length);
      sim.set('a', ML.R(sa.avgR, 3));
      sim.set('b', ML.R(sb.avgR, 3));
    });
  });

  /* ======================================================================
     10.2 Costos realistas
     ====================================================================== */
  ML.defineSim('costos-realistas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Datos y costos');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.slider('mult', { label: 'Spread × factor', min: 0.5, max: 4, step: 0.1, value: 1, fmt: (v) => ML.fix(v, 1) });
    sim.slider('comm', { label: 'Comisión (USD por lote)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.slider('slip', { label: 'Deslizamiento (pips)', min: 0, max: 5, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.out('r0', 'R medio sin costos extra');
    sim.out('r1', 'R medio con sus costos', { hl: true });
    sim.out('d', 'Costo adicional por operación');
    sim.out('u', 'Resultado total: sin extra → con sus costos');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    const cache = {};
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, base = B().get(D, p.ds);
      let S2 = base.S;
      if (Math.abs(p.mult - 1) > 1e-9) {
        const key = p.ds + '|' + p.mult;
        if (!cache[key]) { const sp = Float64Array.from(base.S.sp, (v) => v * p.mult); cache[key] = Object.assign({}, base.S, { sp, _prep: undefined, name: 'x' + key }); }
        S2 = cache[key];
      }
      const X2 = S2 === base.S ? base.X : E().prep(S2, base.ctx);
      const P0 = E().params({}), P1 = E().params({ comm: p.comm, slip: p.slip });
      const t0 = E().run(base.S, base.X, P0), t1 = E().run(S2, X2, P1);
      const s0 = E().stats(t0, P0), s1 = E().stats(t1, P1);
      const e0 = B().equity(t0, P0), e1 = B().equity(t1, P1);
      const n = Math.max(e0.xs.length, e1.xs.length);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n - 1, ymin: Math.min(...e0.yU, ...e1.yU) - 200, ymax: Math.max(...e0.yU, ...e1.yU) + 300, ml: 60, mb: 44, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (USD)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', width: 1, dash: [4, 3] });
      pl.xy(e0.xs, e0.yU, { color: '--ink-3', width: 2, dash: [6, 4] });
      pl.xy(e1.xs, e1.yU, { color: '--accent', width: 2.8 });
      pl.legend([{ label: 'sin costos extra', color: '--ink-3', dash: [6, 4] }, { label: 'con sus costos', color: '--accent' }], 'tl');
      sim.set('r0', ML.R(s0.avgR, 3) + ' <small>(n = ' + s0.n + ')</small>');
      sim.set('r1', ML.R(s1.avgR, 3) + ' ± ' + ML.fix(1.96 * s1.seR, 3) + ' <small>(n = ' + s1.n + ')</small>');
      sim.set('d', ML.R(s1.avgR - s0.avgR, 3));
      sim.set('u', ML.usdS(s0.usd) + ' → ' + ML.usdS(s1.usd));
    });
  });

  /* ======================================================================
     10.3 La regla tramposa
     ====================================================================== */
  ML.defineSim('tramposa', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Datos y trampa');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.seg('leak', { label: 'Información del futuro', options: [['no', 'Honesta'], ['uno', 'Vela siguiente a favor'], ['tres', 'Tres velas siguientes (neto a favor)']], value: 'uno' });
    sim.out('n', 'Operaciones');
    sim.out('r', 'R medio', { hl: true });
    sim.out('w', 'Aciertos');
    sim.out('pf', 'Factor de beneficio');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, { S, X } = B().get(D, p.ds), P = E().params({ modo: 'zona', dema: 40 });
      const sc = E().scan(X, P);
      const hon = E().run(S, X, P, sc);
      let cand = sc;
      if (p.leak !== 'no') {
        const ci = [], cs = [], ca = [], nf = p.leak === 'uno' ? 1 : 3;
        sc.ci.forEach((i, q) => { const d = sc.cs[q]; let nt = 0; for (let k = 1; k <= nf; k++) nt += (S.c[i + k] - S.o[i + k]) * d; if (i + nf < S.n && nt > 0) { ci.push(i); cs.push(d); ca.push(sc.ca[q]); } });
        cand = { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) };
      }
      const tr = E().run(S, X, P, cand), st = E().stats(tr, P), eh = B().equity(hon, P), el = B().equity(tr, P);
      const sh = E().stats(hon, P);
      const n = Math.max(eh.xs.length, el.xs.length);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n - 1, ymin: Math.min(...eh.yR, ...el.yR) - 2, ymax: Math.max(...eh.yR, ...el.yR) + 2, ml: 54, mb: 44, xlabel: 'Operaciones', ylabel: 'Resultado acumulado (R)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', width: 1, dash: [4, 3] });
      pl.xy(eh.xs, eh.yR, { color: '--ink-3', width: 2, dash: [6, 4] });
      pl.xy(el.xs, el.yR, { color: p.leak === 'no' ? '--ink-3' : '--c2', width: 2.8 });
      pl.legend([{ label: 'honesta', color: '--ink-3', dash: [6, 4] }, { label: p.leak === 'no' ? 'honesta' : 'con información del futuro', color: '--c2' }], 'tl');
      sim.set('n', st.n + ' <small>(honesta: ' + sh.n + ')</small>');
      sim.set('r', ML.R(st.avgR, 3) + ' ± ' + ML.fix(1.96 * st.seR, 3));
      sim.set('w', ML.pct(st.winPct, 0));
      sim.set('pf', ML.fix(st.pf, 2));
    });
  });
})();
