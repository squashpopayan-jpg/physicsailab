/* Capítulo 5 — Reglas de entrada */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab;
  const PIP = 0.1;
  const dsOptions = [['m1', 'M1 · 3.4 meses'], ['m5', 'M5 · 17 meses']];

  /* ======================================================================
     5.1 Embudo
     ====================================================================== */
  ML.defineSim('embudo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, maxH: '400px' });
    sim.group('Datos y parámetros');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm1' });
    sim.slider('w1m', { label: 'Extremo corto (min)', min: 10, max: 90, step: 5, value: 30, fmt: (v) => ML.fix(v, 0) });
    sim.slider('banda', { label: 'Banda neutra H4 (pips)', min: 0, max: 400, step: 5, value: 15, fmt: (v) => ML.fix(v, 0) });
    sim.slider('maxdist', { label: 'Anti-persecución (pips)', min: 2, max: 40, step: 1, value: 8, fmt: (v) => ML.fix(v, 0) });
    sim.slider('techo', { label: 'Límite sobre H120 (pips)', min: 0, max: 200, step: 5, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.check('rech', { label: 'Exigir vela de rechazo', value: true });
    sim.out('fin', 'Señales de venta al final del embudo', { hl: true });
    sim.out('dia', 'Una señal cada … velas');
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    const cache = {};
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const p = sim.p, { S, ctx, X } = B().get(D, p.ds), bm = S.bm;
      const W1 = Math.max(1, Math.round(p.w1m / bm)), W2 = Math.max(1, Math.round(120 / bm));
      const key = p.ds;
      cache[key] = cache[key] || {};
      const r1 = cache[key]['r' + W1] || (cache[key]['r' + W1] = E().rollPrior(S.h, W1, true)), r2 = cache[key]['r' + W2] || (cache[key]['r' + W2] = E().rollPrior(S.h, W2, true));
      const steps = ['Velas con historia', 'Dentro de la ventana 08:57–13:00', 'Sesgo H4 bajista', 'El máximo toca H30', 'Vela de rechazo', 'Cierre a ≤ ' + p.maxdist + ' pips de H30', 'Cierre sobre la EMA20 de M15', 'No más de ' + p.techo + ' pips sobre H120'];
      const cnt = new Array(steps.length).fill(0), band = p.banda * PIP, maxd = p.maxdist * PIP, techo = p.techo * PIP;
      for (let i = Math.max(W1, W2) + 1; i < S.n; i++) {
        const im = X.im[i], ih = X.ih[i];
        if (im < 20 || ih < 50) continue;
        cnt[0]++;
        const mm = X.mm[i];
        if (!(mm >= 537 && mm < 780) || X.wd[i] >= 5) continue;
        cnt[1]++;
        if (!(X.slow.c[ih] - X.ema50[ih] < -band)) continue;
        cnt[2]++;
        if (!(S.h[i] >= r1[i])) continue;
        cnt[3]++;
        if (p.rech && !(S.c[i] <= S.o[i])) continue;
        cnt[4]++;
        if (!(Math.abs(r1[i] - S.c[i]) <= maxd)) continue;
        cnt[5]++;
        if (!(S.c[i] > X.ema20[im])) continue;
        cnt[6]++;
        if (!(S.c[i] <= r2[i] + techo)) continue;
        cnt[7]++;
      }
      const ctx2 = cv.ctx, W = cv.w, H = cv.h, x0 = 230, x1 = W - 90, rowH = (H - 20) / steps.length;
      const lmax = Math.log10(cnt[0] + 1);
      steps.forEach((s, k) => {
        const y = 10 + k * rowH, w = (x1 - x0) * (Math.log10(cnt[k] + 1) / lmax);
        ctx2.fillStyle = ML.alpha(k === steps.length - 1 ? '--c2' : '--accent', k === steps.length - 1 ? 0.8 : 0.55);
        ctx2.fillRect(x0, y + 4, Math.max(2, w), rowH - 10);
        ML.text(ctx2, s, x0 - 8, y + rowH / 2 - 1, { size: 11.5, color: '--ink-2', align: 'right', baseline: 'middle' });
        ML.text(ctx2, ML.fix(cnt[k], 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (k > 0 && cnt[k - 1] ? '  (' + ML.fix(100 * cnt[k] / cnt[k - 1], 0) + ' %)' : ''), x0 + Math.max(2, w) + 8, y + rowH / 2 - 1, { size: 11.5, mono: true, color: '--ink', baseline: 'middle', weight: 600 });
      });
      sim.set('fin', ML.fix(cnt[7], 0));
      sim.set('dia', cnt[7] ? ML.fix(cnt[0] / cnt[7], 0) : '—');
    });
  });

  /* ======================================================================
     5.2 Cuatro familias
     ====================================================================== */
  const FAM = [
    { id: 'tocar', nom: 'Tocar y rechazar (manual)', kw: { modo: 'tocar' } },
    { id: 'zona', nom: 'Zona H120 + EMA 40 (v1.2)', kw: { modo: 'zona', dema: 40 } },
    { id: 'ema', nom: 'Rechazo en EMA20', kw: { modo: 'ema', maxdist: 12 } },
    { id: 'ruptura', nom: 'Ruptura (momento)', kw: { modo: 'ruptura', maxdist: 15 } }
  ];
  ML.defineSim('modos-entrada', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Datos');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    FAM.forEach((f, i) => sim.out('f' + i, f.nom, { wide: true }));
    let D = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      const { S, X } = B().get(D, sim.p.ds);
      const rows = FAM.map((f) => { const P = E().params(f.kw), sc = E().scan(X, P), tr = E().run(S, X, P), st = E().stats(tr, P); return { f, raw: sc.ci.length, st }; });
      const ymax = Math.max(...rows.map((r) => r.raw)) * 1.1;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w * 0.52, h: cv.h, xmin: 0.4, xmax: 4.6, ymin: 0, ymax, ml: 50, mb: 44, ylabel: 'Señales', xticks: [1, 2, 3, 4], xfmt: (v) => ['tocar', 'zona', 'ema', 'ruptura'][v - 1] || '' });
      pl.frame();
      ML.draw.bars(pl, rows.map((_, i) => i + 1 - 0.18), rows.map((r) => r.raw), 0.34, { color: '--ink-3', alpha: 0.45 });
      ML.draw.bars(pl, rows.map((_, i) => i + 1 + 0.18), rows.map((r) => r.st.n), 0.34, { color: '--accent', alpha: 0.85 });
      pl.legend([{ label: 'señales crudas', color: '--ink-3', kind: 'sq' }, { label: 'operaciones', color: '--accent', kind: 'sq' }]);
      const pr = new ML.Plot(cv.ctx, { x: cv.w * 0.52, y: 0, w: cv.w * 0.48, h: cv.h, xmin: 0.4, xmax: 4.6, ymin: -0.45, ymax: 0.55, ml: 50, mb: 44, ylabel: 'R medio (IC 95 %)', xticks: [1, 2, 3, 4], xfmt: (v) => ['tocar', 'zona', 'ema', 'ruptura'][v - 1] || '' });
      pr.frame();
      ML.draw.errbars(pr, rows.map((r, i) => ({ x: i + 1, m: r.st.avgR, lo: r.st.avgR - 1.96 * r.st.seR, hi: r.st.avgR + 1.96 * r.st.seR, color: r.st.avgR >= 0 ? '--c3' : '--c2' })));
      rows.forEach((r, i) => sim.set('f' + i, `${r.raw} señales · ${r.st.n} operaciones · R ${ML.R(r.st.avgR, 3)} ± ${ML.fix(1.96 * r.st.seR, 3)} · acierto ${ML.pct(r.st.winPct, 0)}`));
    });
  });

  /* ======================================================================
     5.3 Anatomía de una señal
     ====================================================================== */
  ML.defineSim('anatomia-senal', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, maxH: '430px' });
    sim.group('Operación');
    sim.seg('ds', { label: 'Serie', options: dsOptions, value: 'm5' });
    sim.slider('q', { label: 'Operación n.º', min: 1, max: 60, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('cuando', 'Señal (hora de Madrid)', { hl: true });
    sim.out('lado', 'Dirección');
    sim.out('niv', 'Entrada · stop · take profit');
    sim.out('lote', 'Lote y riesgo real');
    sim.out('res', 'Resultado');
    let D = null, cur = null;
    sim.withData(['m1', 'm5'], (d) => { D = d; sim.redraw(); });
    const refresh = () => {
      const p = sim.p, { S, X } = B().get(D, p.ds), P = E().params({});
      const sc = E().scan(X, P), trs = E().run(S, X, P);
      cur = { S, X, P, sc, trs };
      sim.ctl.q.range(1, trs.length, 1);
      if (sim.p.q > trs.length) sim.ctl.q.set(trs.length, true);
    };
    let lastDs = null;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!D) return;
      if (lastDs !== sim.p.ds) { lastDs = sim.p.ds; refresh(); }
      const { S, X, P, sc, trs } = cur, tr = trs[Math.min(trs.length, Math.round(sim.p.q)) - 1];
      const q = sc.ci.indexOf(tr.i), trace = [];
      const rep = E().simTrade(S, X, tr.i, tr.d, sc.ca[q], P, trace);
      ML.drawTradeChart(cv, S, X, tr.i, rep, trace);
      const t0 = trace[0];
      sim.set('cuando', E().dateStr(X.mad[tr.i]) + ' ' + E().hhmm(X.mm[tr.i]));
      sim.set('lado', tr.d === -1 ? 'Venta (sesgo bajista)' : 'Compra (sesgo alcista)');
      sim.set('niv', ML.fix(t0.ent, 2) + ' · −' + ML.fix(t0.slp, 0) + ' pips · +' + ML.fix(t0.tpp, 0) + ' pips');
      sim.set('lote', ML.fix(rep.lots, 2) + ' lotes · ' + ML.usd(rep.lots * t0.D * 100, 1));
      sim.set('res', ML.usdS(rep.usd, 0) + ' (' + ML.R(rep.R, 2) + ') · ' + (ML.REASON[rep.reason] || rep.reason));
    });
  });
})();
