/* ===================================================================
   61-trade-chart.js — Gráfico de una operación: velas, señal, entrada, niveles de stop y take profit
   (con sus cambios de etapa), y salida.
   =================================================================== */
(function () {
  'use strict';
  const ML = window.ML;
  const PIP = 0.1;
  const REASON = { TP: 'Take profit', SL: 'Stop inicial', SLD: 'SL defensivo', BE: 'Break-even', STAG: 'Estancamiento', TIME: 'Cierre horario', END: 'Fin de datos' };
  ML.REASON = REASON;
  /* cv: lienzo del Sim; S: serie; i: barra de señal; tr: operación; trace: eventos de etapa.
     o = {before, after, labelMadrid} */
  ML.drawTradeChart = function (cv, S, X, i, tr, trace, o = {}) {
    ML.draw.clear(cv);
    const b0 = o.before || 50, a0 = o.after || 24;
    const i0 = Math.max(0, i - b0), i1 = Math.min(S.n, tr.k + a0), n = i1 - i0;
    const d = tr.d, sp = S.sp[tr.j];
    const shift = d === -1 ? -sp : 0;                /* niveles de venta: pasan a términos de Bid para compararlos con las velas */
    const t0 = trace[0];
    let lo = Infinity, hi = -Infinity;
    for (let k = i0; k < i1; k++) { if (S.l[k] < lo) lo = S.l[k]; if (S.h[k] > hi) hi = S.h[k]; }
    const lv = [t0.sl + shift, t0.tp + shift, tr.px + shift];
    trace.forEach((e) => lv.push(e.sl + shift));
    lv.forEach((v) => { if (v < lo) lo = v; if (v > hi) hi = v; });
    const pad = (hi - lo) * 0.06 + 0.2;
    const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: i0 - 0.5, xmax: i1 - 0.5, ymin: lo - pad, ymax: hi + pad, ml: 60, mb: 40, xlabel: 'Velas (' + S.bm + ' min)', ylabel: 'Precio Bid (USD)', xticks: null, xfmt: (v) => (X ? E_hhmm(X.mm[Math.min(S.n - 1, Math.max(0, Math.round(v)))]) : String(Math.round(v))) });
    function E_hhmm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    pl.frame();
    ML.draw.candles(pl, S, i0, i1);
    const ctx = cv.ctx;
    /* niveles escalonados */
    const stepped = (getLevel, color, dash, width) => {
      const xs = [], ys = [];
      let cur = null;
      for (let k = tr.j; k <= tr.k; k++) {
        let lev = null;
        for (const e of trace) if (e.k <= k) lev = getLevel(e);
        if (lev === null) continue;
        xs.push(k - 0.5); ys.push(lev + shift); xs.push(k + 0.5); ys.push(lev + shift);
      }
      pl.xy(xs, ys, { color, width, dash });
    };
    stepped((e) => e.sl, '--c2', [6, 3], 2);
    pl.xy([tr.j - 0.5, tr.k + 0.5], [t0.tp + shift, t0.tp + shift], { color: '--c3', width: 2, dash: [6, 3] });
    const entBid = t0.ent + (d === 1 ? -sp : 0);
    pl.xy([tr.j - 0.5, tr.k + 0.5], [entBid, entBid], { color: '--accent', width: 1.4, dash: [2, 3] });
    /* marcas */
    const tri = (k, y, up, col) => { const x = pl.X(k), yy = pl.Y(y) + (up ? 12 : -12); ctx.fillStyle = ML.col(col); ctx.beginPath(); if (up) { ctx.moveTo(x, yy - 8); ctx.lineTo(x - 6, yy + 4); ctx.lineTo(x + 6, yy + 4); } else { ctx.moveTo(x, yy + 8); ctx.lineTo(x - 6, yy - 4); ctx.lineTo(x + 6, yy - 4); } ctx.fill(); };
    tri(i, d === -1 ? S.h[i] : S.l[i], d === 1, d === -1 ? '--c2' : '--c3');
    pl.dot(tr.j, t0.ent + (d === 1 ? -sp : 0), { r: 5, color: '--accent' });
    const win = tr.usd > 0;
    pl.dot(tr.k, tr.px + shift, { r: 6, color: win ? '--c3' : '--c2', label: (REASON[tr.reason] || tr.reason) + ' · ' + ML.R(tr.R, 2), dx: 9, dy: -9 });
    return pl;
  };
})();
