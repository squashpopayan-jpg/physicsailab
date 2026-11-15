/* Capítulo 4 — Indicadores */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng, B = () => ML.L.lab;
  const PIP = 0.1;

  /* ======================================================================
     4.1 Un día de M1 con los instrumentos
     ====================================================================== */
  ML.defineSim('velas-indicadores', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '460px' });
    sim.group('Día y vela');
    sim.slider('dia', { label: 'Día (de 73)', min: 0, max: 72, step: 1, value: 40, fmt: (v) => ML.fix(v + 1, 0) });
    sim.slider('bar', { label: 'Vela (minuto desde las 08:00)', min: 0, max: 359, step: 1, value: 160, fmt: (v) => E().hhmm(480 + Math.round(v)) });
    sim.group('Capas');
    sim.check('l30', { label: 'H30 y L30', value: true });
    sim.check('l120', { label: 'H120 y L120', value: true });
    sim.check('ema', { label: 'EMA20 de M15', value: true });
    sim.check('sig', { label: 'Señales del manual', value: true });
    sim.out('fecha', 'Día', { hl: true });
    sim.out('c', 'Cierre de la vela');
    sim.out('h30', 'H30 · L30');
    sim.out('h120', 'H120 · L120');
    sim.out('ema', 'EMA20 de M15');
    sim.out('atr', 'ATR14 de M15');
    sim.out('bias', 'Sesgo H4 (banda 15 pips)');
    let st = null;
    sim.withData(['m1', 'm5'], (D) => {
      const S = D.m1, X = E().prep(S, D.m5), P = E().params({});
      const r1 = { hmax: E().rollPrior(S.h, 30, true), lmin: E().rollPrior(S.l, 30, false) }, r2 = { hmax: E().rollPrior(S.h, 120, true), lmin: E().rollPrior(S.l, 120, false) };
      const days = [];
      let last = null;
      for (let i = 0; i < S.n; i++) { if (X.wd[i] < 5 && X.mm[i] === 480 && X.day[i] !== last) { last = X.day[i]; days.push(i); } }
      const sc = E().scan(X, P), sig = new Map();
      sc.ci.forEach((i, q) => sig.set(i, sc.cs[q]));
      st = { S, X, r1, r2, days, sig };
      sim.ctl.dia.range(0, days.length - 1, 1);
      sim.ctl.dia.set(Math.min(days.length - 1, 40), true);
      sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!st) return;
      const { S, X, r1, r2, days, sig } = st, p = sim.p;
      const i0 = days[Math.round(p.dia)], N = 360, i1 = Math.min(S.n, i0 + N);
      let lo = Infinity, hi = -Infinity;
      for (let i = i0; i < i1; i++) { lo = Math.min(lo, S.l[i]); hi = Math.max(hi, S.h[i]); }
      const pad = (hi - lo) * 0.06 + 0.3;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: N, ymin: lo - pad, ymax: hi + pad, ml: 60, mb: 40, xlabel: 'Hora de Madrid', ylabel: 'Precio (USD)', xticks: [0, 60, 120, 180, 240, 300, 360], xfmt: (v) => E().hhmm(480 + v), grid: true });
      pl.frame();
      pl.band(57, 300, { color: '--c3', alpha: 0.08 });
      const xs = Array.from({ length: i1 - i0 }, (_, k) => k);
      const ser = (a) => Array.from({ length: i1 - i0 }, (_, k) => a[i0 + k]);
      D_candles(pl, S, i0, i1);
      if (p.l120) { pl.xy(xs, ser(r2.hmax), { color: '--ink-3', width: 1.1, alpha: 0.9 }); pl.xy(xs, ser(r2.lmin), { color: '--ink-3', width: 1.1, alpha: 0.9 }); }
      if (p.l30) { pl.xy(xs, ser(r1.hmax), { color: '--c4', width: 1.5 }); pl.xy(xs, ser(r1.lmin), { color: '--c4', width: 1.5 }); }
      if (p.ema) pl.xy(xs, xs.map((k) => (X.im[i0 + k] >= 19 ? X.ema20[X.im[i0 + k]] : NaN)), { color: '--c1', width: 2 });
      const ctx = cv.ctx;
      if (p.sig) for (let k = 0; k < i1 - i0; k++) { const s = sig.get(i0 + k); if (!s) continue; const x = pl.X(k), y = s === -1 ? pl.Y(S.h[i0 + k]) - 10 : pl.Y(S.l[i0 + k]) + 10; ctx.fillStyle = ML.col(s === -1 ? '--c2' : '--c3'); ctx.beginPath(); if (s === -1) { ctx.moveTo(x, y + 8); ctx.lineTo(x - 6, y - 4); ctx.lineTo(x + 6, y - 4); } else { ctx.moveTo(x, y - 8); ctx.lineTo(x - 6, y + 4); ctx.lineTo(x + 6, y + 4); } ctx.fill(); }
      const kb = Math.min(i1 - i0 - 1, Math.round(p.bar)), ib = i0 + kb;
      pl.vline(kb, { color: '--ink', width: 1.2, dash: [3, 3] });
      /* lecturas */
      const im = X.im[ib], ih = X.ih[ib];
      sim.set('fecha', E().dateStr(S.t[i0]) + ' <small>(' + ['lun', 'mar', 'mié', 'jue', 'vie'][X.wd[i0]] + ')</small>');
      sim.set('c', ML.fix(S.c[ib], 2) + (sig.get(ib) ? ' <small>· señal de ' + (sig.get(ib) === -1 ? 'venta' : 'compra') + '</small>' : ''));
      sim.set('h30', ML.fix(r1.hmax[ib], 2) + ' · ' + ML.fix(r1.lmin[ib], 2));
      sim.set('h120', ML.fix(r2.hmax[ib], 2) + ' · ' + ML.fix(r2.lmin[ib], 2));
      sim.set('ema', ML.fix(X.ema20[im], 2) + ' <small>(precio ' + (S.c[ib] > X.ema20[im] ? 'encima' : 'debajo') + ')</small>');
      sim.set('atr', ML.fix(X.atr14[im] / PIP, 0) + ' pips');
      const diff = X.slow.c[ih] - X.ema50[ih];
      sim.set('bias', (diff < -1.5 ? 'bajista' : diff > 1.5 ? 'alcista' : 'neutro') + ' <small>(cierre H4 − EMA50 = ' + ML.fix(diff, 1) + ' USD)</small>');
    });
    function D_candles(pl, S, i0, i1) {
      const bars = { o: ser2(S.o), h: ser2(S.h), l: ser2(S.l), c: ser2(S.c) };
      function ser2(a) { return a.subarray(i0, i1); }
      ML.draw.candles(pl, bars, 0, i1 - i0);
    }
  });

  /* ======================================================================
     4.2 Sesgo H4
     ====================================================================== */
  ML.defineSim('sesgo-h4', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, maxH: '420px' });
    sim.group('Banda');
    sim.slider('banda', { label: 'Banda neutra (pips)', min: 0, max: 600, step: 5, value: 15, fmt: (v) => ML.fix(v, 0) });
    sim.out('baj', 'Tiempo bajista');
    sim.out('neu', 'Tiempo neutro', { hl: true });
    sim.out('alc', 'Tiempo alcista');
    sim.out('cam', 'Cambios de sesgo por semana');
    sim.out('med', '|Cierre H4 − EMA50| mediano');
    let st = null;
    sim.withData(['m5'], (D) => {
      const X = E().prep(D.m5), sl = X.slow;
      const idx = []; for (let k = 50; k < sl.n; k++) idx.push(k);
      st = { X, sl, idx, d: idx.map((k) => sl.c[k] - X.ema50[k]) };
      sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!st) return;
      const { sl, idx, d } = st, b = sim.p.banda * PIP;
      let nb = 0, nn = 0, na = 0, ch = 0, prev = 0;
      const sg = d.map((v) => (v < -b ? -1 : v > b ? 1 : 0));
      sg.forEach((s) => { if (s < 0) nb++; else if (s > 0) na++; else nn++; });
      for (let i = 1; i < sg.length; i++) if (sg[i] !== 0) { if (prev !== 0 && sg[i] !== prev) ch++; prev = sg[i]; }
      const weeks = (sl.t[sl.n - 1] - sl.t[50]) / (7 * 1440);
      const n = idx.length, lo = Math.min(...idx.map((k) => Math.min(sl.c[k], st.X.ema50[k]))), hi = Math.max(...idx.map((k) => Math.max(sl.c[k], st.X.ema50[k])));
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: lo - 40, ymax: hi + 40, ml: 60, mb: 40, xlabel: 'Velas H4 (may 2025 – oct 2026)', ylabel: 'Precio (USD)' });
      pl.frame();
      const ctx = cv.ctx;
      pl.clip(() => { for (let i = 0; i < n; i++) { if (sg[i] === 0) { ctx.fillStyle = ML.alpha('--ink-3', 0.28); } else ctx.fillStyle = ML.alpha(sg[i] < 0 ? '--c2' : '--c3', 0.12); ctx.fillRect(pl.X(i), pl.iy, Math.max(1, pl.X(i + 1) - pl.X(i)), pl.ih); } });
      pl.xy(idx.map((_, i) => i), idx.map((k) => sl.c[k]), { color: '--c1', width: 1.6 });
      pl.xy(idx.map((_, i) => i), idx.map((k) => st.X.ema50[k]), { color: '--c4', width: 2 });
      pl.legend([{ label: 'cierre H4', color: '--c1' }, { label: 'EMA50 de H4', color: '--c4' }, { label: 'rojo: sesgo bajista · verde: alcista · gris: neutro', color: '--ink-3', kind: 'sq' }], 'tl');
      sim.set('baj', ML.pct(nb / n, 1)); sim.set('neu', ML.pct(nn / n, 1)); sim.set('alc', ML.pct(na / n, 1));
      sim.set('cam', ML.fix(ch / weeks, 1));
      sim.set('med', ML.fix(ML.L.stats.quantile(d.map(Math.abs), 0.5), 1) + ' USD (' + ML.fix(10 * ML.L.stats.quantile(d.map(Math.abs), 0.5), 0) + ' pips)');
    });
  });

  /* ======================================================================
     4.3 ATR y topes
     ====================================================================== */
  ML.defineSim('atr-topes', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Stop y take profit');
    sim.slider('slk', { label: 'Stop = k × ATR', min: 0.3, max: 2, step: 0.05, value: 0.8, fmt: (v) => ML.fix(v, 2) });
    sim.slider('slmin', { label: 'Stop mínimo (pips)', min: 0, max: 120, step: 5, value: 45, fmt: (v) => ML.fix(v, 0) });
    sim.slider('slmax', { label: 'Stop máximo (pips)', min: 30, max: 999, step: 5, value: 60, fmt: (v) => ML.fix(v, 0) });
    sim.slider('tpk', { label: 'Take profit = k × ATR', min: 0.5, max: 4, step: 0.05, value: 1.4, fmt: (v) => ML.fix(v, 2) });
    sim.slider('tpmin', { label: 'TP mínimo (pips)', min: 0, max: 300, step: 5, value: 80, fmt: (v) => ML.fix(v, 0) });
    sim.slider('tpmax', { label: 'TP máximo (pips)', min: 40, max: 999, step: 5, value: 100, fmt: (v) => ML.fix(v, 0) });
    sim.out('sl', 'Stop resultante: mediana (p10–p90)', { hl: true });
    sim.out('tp', 'TP resultante: mediana (p10–p90)');
    sim.out('fl', 'Stop en el piso / en el techo / libre');
    sim.out('pay', 'Payoff TP ÷ SL: mediana');
    sim.out('cost', 'Costo del spread (0.27) con el stop mediano');
    let atr = null;
    sim.withData(['m5'], (D) => {
      const S = D.m5, X = E().prep(S), out = [];
      for (let i = 0; i < S.n; i++) { const mm = X.mm[i]; if (mm >= 537 && mm < 780 && X.wd[i] < 5 && X.im[i] >= 20) { const a = X.atr14[X.im[i]]; if (a === a) out.push(a / PIP); } }
      atr = out;
      sim.redraw();
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!atr) return;
      const p = sim.p, Q = ML.L.stats.quantile;
      const sl = atr.map((a) => Math.min(p.slmax, Math.max(p.slmin, p.slk * a))), tp = atr.map((a) => Math.min(p.tpmax, Math.max(p.tpmin, p.tpk * a)));
      const xmax = 250, bins = 50, w = xmax / bins;
      const h0 = ML.L.stats.histogram(atr, 0, xmax, bins), hs = ML.L.stats.histogram(sl, 0, xmax, bins), ht = ML.L.stats.histogram(tp, 0, xmax, bins);
      const ymax = Math.max(...h0, ...hs, ...ht) * 1.08 / atr.length;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax, ml: 54, mb: 44, xlabel: 'Pips', ylabel: 'Fracción de las velas', yfmt: (v) => ML.fix(100 * v, 0) + ' %' });
      pl.frame();
      const xs = h0.map((_, i) => (i + 0.5) * w);
      ML.draw.bars(pl, xs, h0.map((v) => v / atr.length), w * 0.92, { color: '--ink-3', alpha: 0.35 });
      ML.draw.bars(pl, xs.map((x) => x - w * 0.2), hs.map((v) => v / atr.length), w * 0.4, { color: '--c2', alpha: 0.75 });
      ML.draw.bars(pl, xs.map((x) => x + w * 0.2), ht.map((v) => v / atr.length), w * 0.4, { color: '--c3', alpha: 0.75 });
      pl.legend([{ label: 'ATR14 de M15', color: '--ink-3', kind: 'sq' }, { label: 'stop resultante', color: '--c2', kind: 'sq' }, { label: 'take profit resultante', color: '--c3', kind: 'sq' }]);
      const fl = sl.filter((v, i) => p.slk * atr[i] <= p.slmin).length, ce = sl.filter((v, i) => p.slk * atr[i] >= p.slmax).length;
      sim.set('sl', ML.fix(Q(sl, 0.5), 0) + ' pips (' + ML.fix(Q(sl, 0.1), 0) + '–' + ML.fix(Q(sl, 0.9), 0) + ')');
      sim.set('tp', ML.fix(Q(tp, 0.5), 0) + ' pips (' + ML.fix(Q(tp, 0.1), 0) + '–' + ML.fix(Q(tp, 0.9), 0) + ')');
      sim.set('fl', ML.pct(fl / atr.length, 0) + ' / ' + ML.pct(ce / atr.length, 0) + ' / ' + ML.pct(1 - (fl + ce) / atr.length, 0));
      sim.set('pay', ML.fix(Q(tp.map((v, i) => v / sl[i]), 0.5), 2));
      const D = Q(sl, 0.5) * PIP + 0.27;
      sim.set('cost', ML.pct(0.27 / D, 1) + ' de R');
    });
  });
})();
