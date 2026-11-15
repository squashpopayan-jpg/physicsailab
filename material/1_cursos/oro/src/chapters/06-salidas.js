/* Capítulo 6 — Salidas */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab, St = () => ML.L.stats;
  const dsOptions = [['m1', 'M1 · 3.4 meses'], ['m5', 'M5 · 17 meses']];

  /* ======================================================================
     6.1 Una operación con gestión editable
     ====================================================================== */
  ML.defineSim('una-operacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, maxH: '430px' });
    sim.group('Operación');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.slider('q', { label: 'Operación n.º', min: 1, max: 60, step: 1, value: 9, fmt: (v) => ML.fix(v, 0) });
    sim.group('Gestión');
    sim.check('sld', { label: 'SL defensivo', value: true });
    sim.slider('sldact', { label: '… se activa a +pips', min: 5, max: 80, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sldpips', { label: '… stop pasa a −pips', min: 0, max: 60, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.check('be', { label: 'Break-even proporcional', value: true });
    sim.slider('beratio', { label: '… a la fracción del TP', min: 0.1, max: 0.9, step: 0.02, value: 0.42, fmt: (v) => ML.fix(v, 2) });
    sim.check('stag', { label: 'Estancamiento', value: true });
    sim.check('pess', { label: 'Orden intrabarra pesimista', value: false });
    sim.out('orig', 'Resultado con la gestión del manual', { hl: true });
    sim.out('mod', 'Resultado con su configuración');
    sim.out('lev', 'Niveles iniciales');
    let D = null, cur = null, lastDs = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p;
      if (lastDs !== p.ds) {
        lastDs = p.ds;
        const { S, X } = B().get(D, p.ds), P = E().params({});
        const sc = E().scan(X, P), trs = E().run(S, X, P);
        cur = { S, X, P, sc, trs };
        sim.ctl.q.range(1, trs.length, 1);
        if (sim.p.q > trs.length) sim.ctl.q.set(trs.length, true);
      }
      const { S, X, P, sc, trs } = cur, tr0 = trs[Math.min(trs.length, Math.round(sim.p.q)) - 1];
      const qi = sc.ci.indexOf(tr0.i), atr = sc.ca[qi];
      const P2 = E().params({ sld: p.sld, sldact: p.sldact, sldpips: p.sldpips, be: p.be, beratio: p.beratio, stag: p.stag, pess: p.pess });
      const trace = [];
      const tr = E().simTrade(S, X, tr0.i, tr0.d, atr, P2, trace);
      ML.drawTradeChart(cv, S, X, tr0.i, tr, trace, { before: 40, after: 26 });
      sim.set('orig', ML.usdS(tr0.usd, 0) + ' (' + ML.R(tr0.R, 2) + ') · ' + (ML.REASON[tr0.reason] || tr0.reason));
      sim.set('mod', ML.usdS(tr.usd, 0) + ' (' + ML.R(tr.R, 2) + ') · ' + (ML.REASON[tr.reason] || tr.reason));
      sim.set('lev', 'stop −' + ML.fix(trace[0].slp, 0) + ' pips · TP +' + ML.fix(trace[0].tpp, 0) + ' pips (' + (tr.d === -1 ? 'venta' : 'compra') + ')');
    });
  });

  /* ======================================================================
     6.2 Martingala
     ====================================================================== */
  ML.defineSim('martingala', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Salida fija');
    sim.slider('sl', { label: 'Stop (pips)', min: 15, max: 150, step: 5, value: 55, fmt: (v) => ML.fix(v, 0) });
    sim.slider('tp', { label: 'Take profit (pips)', min: 15, max: 300, step: 5, value: 90, fmt: (v) => ML.fix(v, 0) });
    sim.slider('c', { label: 'Costo por operación (R)', min: 0, max: 0.15, step: 0.005, value: 0, fmt: (v) => ML.fix(v, 3) });
    sim.slider('n', { label: 'Operaciones simuladas', min: 500, max: 6000, step: 500, value: 3000, fmt: (v) => ML.fix(v, 0) });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    sim.out('win', 'Acierto simulado · teórico', { hl: true });
    sim.out('r', 'R medio ± 2 errores estándar');
    sim.out('theo', 'Esperanza teórica');
    let seed = 1;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, n = Math.round(p.n), rng = St().rng(seed * 7919 + 3);
      const a = p.sl, b = p.tp;
      const Rs = new Float64Array(n);
      let wins = 0;
      for (let k = 0; k < n; k++) {
        let pos = 0;
        while (pos > -a && pos < b) pos += rng() < 0.5 ? -5 : 5;
        const win = pos >= b;
        if (win) wins++;
        Rs[k] = (win ? b / a : -1) - p.c;
      }
      const cum = [], lo = [], hi = [], xs = [];
      let s = 0, s2 = 0;
      const stepN = Math.max(1, Math.floor(n / 200));
      for (let k = 0; k < n; k++) {
        s += Rs[k]; s2 += Rs[k] * Rs[k];
        if ((k + 1) % stepN === 0 && k > 20) { const m = s / (k + 1), sd = Math.sqrt(Math.max(0, s2 / (k + 1) - m * m)), se = sd / Math.sqrt(k + 1); xs.push(k + 1); cum.push(m); lo.push(m - 2 * se); hi.push(m + 2 * se); }
      }
      const ymax = Math.max(0.3, ...hi.slice(2)), ymin = Math.min(-0.3, ...lo.slice(2));
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: Math.max(-1.5, ymin), ymax: Math.min(1.5, ymax), ml: 54, mb: 44, xlabel: 'Operaciones', ylabel: 'R medio acumulado' });
      pl.frame();
      const ctx = cv.ctx;
      pl.clip(() => { ctx.fillStyle = ML.alpha('--accent', 0.15); ctx.beginPath(); xs.forEach((x, i) => (i ? ctx.lineTo(pl.X(x), pl.Y(hi[i])) : ctx.moveTo(pl.X(x), pl.Y(hi[i])))); for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(pl.X(xs[i]), pl.Y(lo[i])); ctx.closePath(); ctx.fill(); });
      pl.hline(0, { color: '--ink', width: 1.4, dash: [] });
      pl.hline(-p.c, { color: '--c2', width: 1.2, dash: [5, 4], label: p.c > 0 ? 'esperanza = −costo' : null });
      pl.xy(xs, cum, { color: '--accent', width: 2.6 });
      const m = St().mean(Rs), se = St().sd(Rs) / Math.sqrt(n);
      sim.set('win', ML.pct(wins / n, 1) + ' · ' + ML.pct(a / (a + b), 1));
      sim.set('r', ML.R(m, 3) + ' ± ' + ML.fix(2 * se, 3));
      sim.set('theo', ML.R(-p.c, 3) + ' <small>(acierto teórico × payoff − pérdida)</small>');
    });
  });

  /* ======================================================================
     6.3 Forma del resultado según la gestión
     ====================================================================== */
  const CONF = [
    ['Completa (manual)', {}],
    ['Sin SL defensivo', { sld: false }],
    ['Sin break-even', { be: false }],
    ['Sin estancamiento', { stag: false }],
    ['Sin gestión', { sld: false, be: false, stag: false }]
  ];
  ML.defineSim('gestion-forma', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Datos');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.seg('src', { label: 'Entradas', options: [['sig', 'Regla del manual'], ['nul', 'Al azar (1 réplica)']], value: 'sig' });
    sim.button('Otra réplica', () => { seed++; }, { primary: false });
    CONF.forEach((c, i) => sim.out('c' + i, c[0], { wide: true }));
    let D = null, seed = 1;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, { S, X } = B().get(D, p.ds);
      let cand = null;
      if (p.src === 'nul') {
        const P0 = E().params({}), sc = E().scan(X, P0), un = E().scanBias(X, P0), pr = sc.ci.length / un.ci.length, rng = St().rng(seed * 31 + 11);
        const ci = [], cs = [], ca = [];
        for (let q = 0; q < un.ci.length; q++) if (rng() < pr) { ci.push(un.ci[q]); cs.push(un.cs[q]); ca.push(un.ca[q]); }
        cand = { ci: Int32Array.from(ci), cs: Int8Array.from(cs), ca: Float64Array.from(ca) };
      }
      const rows = CONF.map(([nom, kw]) => { const P = E().params(kw), tr = E().run(S, X, P, cand), st = E().stats(tr, P); return { nom, st }; });
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 5.6, ymin: -0.7, ymax: 0.7, ml: 54, mb: 52, ylabel: 'R medio (IC 95 %)', xticks: [1, 2, 3, 4, 5], xfmt: (v) => ['completa', 'sin SLD', 'sin BE', 'sin estanc.', 'sin gestión'][v - 1] || '' });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.4, dash: [] });
      ML.draw.errbars(pl, rows.map((r, i) => ({ x: i + 1, m: r.st.avgR, lo: r.st.avgR - 1.96 * r.st.seR, hi: r.st.avgR + 1.96 * r.st.seR, color: r.st.avgR >= 0 ? '--c3' : '--c2' })));
      rows.forEach((r, i) => sim.set('c' + i, `n=${r.st.n} · acierto ${ML.pct(r.st.winPct, 0)} · gana ${ML.fix(r.st.avgWin, 2)} R · pierde ${ML.fix(r.st.avgLoss, 2)} R · R medio ${ML.fix(r.st.avgR, 3)}`));
    });
  });
})();
