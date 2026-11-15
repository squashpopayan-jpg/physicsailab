/* Capítulo 1 — El oro como instrumento */
(function () {
  'use strict';
  const ML = window.ML;
  const PIP = 0.1;

  /* ======================================================================
     1.1 Calculadora de una operación
     ====================================================================== */
  ML.defineSim('calculadora', function (sim) {
    const cv = sim.canvas({ aspect: 1.55, maxH: '430px' });
    sim.group('Operación');
    sim.seg('lado', { label: 'Lado', options: [['compra', 'Compra'], ['venta', 'Venta']], value: 'compra' });
    sim.slider('precio', { label: 'Precio Bid (USD/onza)', min: 2500, max: 5500, step: 10, value: 4250, fmt: (v) => ML.fix(v, 0) });
    sim.slider('risk', { label: 'Riesgo (USD)', min: 25, max: 500, step: 5, value: 125, fmt: (v) => ML.usd(v) });
    sim.slider('sl', { label: 'Stop (pips)', min: 15, max: 150, step: 1, value: 55, fmt: (v) => ML.fix(v, 0) });
    sim.slider('tp', { label: 'Take profit (pips)', min: 20, max: 300, step: 1, value: 90, fmt: (v) => ML.fix(v, 0) });
    sim.group('Costos');
    sim.slider('spread', { label: 'Spread (USD)', min: 0, max: 1.5, step: 0.01, value: 0.27, fmt: (v) => ML.fix(v, 2) });
    sim.slider('comm', { label: 'Comisión (USD por lote, ida y vuelta)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.check('comp', { label: 'Compensar el spread en el stop', value: true });
    sim.out('lots', 'Lote operado', { hl: true });
    sim.out('oz', 'Onzas');
    sim.out('lossr', 'Pérdida real al stop');
    sim.out('gain', 'Ganancia al take profit');
    sim.out('marg', 'Margen retenido (1:100)');
    sim.out('cost', 'Costo fijo por intento');
    sim.out('be', 'Acierto de equilibrio', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, buy = p.lado === 'compra';
      const d = (p.sl * PIP) + (p.comp ? p.spread : 0);
      const lots = Math.floor((100 * p.risk) / (d * 100 + p.comm)) / 100;
      const ent = buy ? p.precio + p.spread : p.precio;
      const slL = buy ? ent - d : ent + d, tpL = buy ? ent + p.tp * PIP : ent - p.tp * PIP;
      const lossReal = lots * (d * 100 + p.comm), gain = lots * (p.tp * PIP * 100 - p.comm);
      const c = (100 * p.spread + p.comm) / (100 * d + p.comm);
      const pay = (p.tp * PIP * 100 - p.comm) / (d * 100 + p.comm);
      const be = (1 + c) / (1 + pay + c);
      sim.set('lots', lots > 0 ? ML.fix(lots, 2) + ' lotes <small>(ideal ' + ML.fix(p.risk / (d * 100 + p.comm) , 4) + ')</small>' : 'menor a 0.01: no se puede operar');
      sim.set('oz', ML.fix(lots * 100, 0) + ' onzas');
      sim.set('lossr', ML.usd(lossReal, 1) + ' <small>(' + ML.pct(lossReal / p.risk, 1) + ' del riesgo)</small>');
      sim.set('gain', ML.usd(gain, 1) + ' <small>(payoff ' + ML.fix(pay, 2) + ' : 1)</small>');
      sim.set('marg', ML.usd(lots * 100 * p.precio / 100) );
      sim.set('cost', ML.pct(c, 1) + ' de R <small>(' + ML.usd(lots * (100 * p.spread + p.comm), 1) + ')</small>');
      sim.set('be', ML.pct(be, 1));
      /* Dibujo: escalera de precios (en la serie en que se cierra: Bid para compra, Ask para venta) */
      ML.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const lo = Math.min(slL, tpL, p.precio) - 0.6, hi = Math.max(slL, tpL, p.precio + p.spread) + 0.6;
      const Y = (v) => 30 + (H - 60) * (1 - (v - lo) / (hi - lo));
      const xL = 110, xR = W - 30;
      const band = (a, b, col, al) => { ctx.fillStyle = ML.alpha(col, al); ctx.fillRect(xL, Math.min(Y(a), Y(b)), xR - xL, Math.abs(Y(a) - Y(b))); };
      band(ent, slL, '--c2', 0.16); band(ent, tpL, '--c3', 0.16);
      /* Bid y Ask */
      const line = (v, col, lab, dash, w, right, dy) => {
        ctx.save(); ctx.strokeStyle = ML.col(col); ctx.lineWidth = w || 1.6; ctx.setLineDash(dash || []);
        ctx.beginPath(); ctx.moveTo(xL, Math.round(Y(v)) + 0.5); ctx.lineTo(xR, Math.round(Y(v)) + 0.5); ctx.stroke(); ctx.restore();
        if (right) ML.text(ctx, lab, xR - 6, Y(v) + (dy || 0), { size: 11, color: col, align: 'right', baseline: 'middle', halo: true });
        else ML.text(ctx, lab, xL - 8, Y(v), { size: 11.5, color: col, align: 'right', baseline: 'middle', weight: 600 });
      };
      line(p.precio, '--ink-3', 'Bid ' + ML.fix(p.precio, 2), [4, 3], 1.2, true, 9);
      line(p.precio + p.spread, '--ink-3', 'Ask ' + ML.fix(p.precio + p.spread, 2), [4, 3], 1.2, true, -9);
      line(ent, '--accent', 'Entrada ' + ML.fix(ent, 2), null, 2.2);
      line(slL, '--c2', 'Stop ' + ML.fix(slL, 2), null, 2);
      line(tpL, '--c3', 'TP ' + ML.fix(tpL, 2), null, 2);
      ML.text(ctx, (buy ? 'La compra se cierra al Bid: el Bid debe tocar estos niveles' : 'La venta se cierra al Ask: el Ask debe tocar estos niveles'), xR, 14, { size: 11.5, color: '--ink-2', align: 'right' });
      ML.text(ctx, '−' + ML.usd(lossReal, 0), (xL + xR) / 2, (Y(ent) + Y(slL)) / 2, { size: 15, color: '--c2', align: 'center', baseline: 'middle', weight: 700 });
      ML.text(ctx, '+' + ML.usd(gain, 0), (xL + xR) / 2, (Y(ent) + Y(tpL)) / 2, { size: 15, color: '--c3', align: 'center', baseline: 'middle', weight: 700 });
    });
  });

  /* ======================================================================
     1.2 Costo en R según el stop y el spread
     ====================================================================== */
  ML.defineSim('costo-r', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, maxH: '400px' });
    sim.group('Costos');
    sim.slider('spread', { label: 'Spread de la cuenta (USD)', min: 0.05, max: 1.5, step: 0.01, value: 0.27, fmt: (v) => ML.fix(v, 2) });
    sim.slider('comm', { label: 'Comisión (USD por lote)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.slider('pay', { label: 'Payoff del manual (TP ÷ SL)', min: 0.8, max: 3, step: 0.01, value: 1.64, fmt: (v) => ML.fix(v, 2) });
    sim.out('c45', 'Costo con stop de 45 pips');
    sim.out('c55', 'Costo con stop de 55 pips');
    sim.out('c60', 'Costo con stop de 60 pips');
    sim.out('be0', 'Acierto de equilibrio sin costos');
    sim.out('be1', 'Acierto de equilibrio con stop de 55 pips', { hl: true });
    const cost = (s, k, pips) => { const D = pips * PIP + s; return (100 * s + k) / (100 * D + k); };
    sim.onDraw(() => {
      const p = sim.p;
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 150, ymin: 0, ymax: 30, ml: 52, mb: 44, xlabel: 'Distancia del stop (pips)', ylabel: 'Costo por intento (% de R)' });
      pl.frame();
      pl.band(45, 60, { color: '--accent', alpha: 0.13 });
      pl.label(52.5, 28, 'stops del manual', { align: 'center', color: '--accent' });
      const ref = [[0.15, '--ink-3', [5, 4]], [0.5, '--c4', [5, 4]], [1.0, '--c2', [5, 4]]];
      for (const [s, col, dash] of ref) pl.fn((x) => 100 * cost(s, p.comm, x), { color: col, width: 1.5, dash, n: 140 });
      pl.fn((x) => 100 * cost(p.spread, p.comm, x), { color: '--accent', width: 2.8, n: 140 });
      pl.legend([{ label: 'su spread (' + ML.fix(p.spread, 2) + ')', color: '--accent' }, { label: 'spread 0.15', color: '--ink-3', dash: [5, 4] }, { label: 'spread 0.50', color: '--c4', dash: [5, 4] }, { label: 'spread 1.00', color: '--c2', dash: [5, 4] }]);
      for (const x of [45, 55, 60]) pl.dot(x, 100 * cost(p.spread, p.comm, x), { r: 4, color: '--accent' });
    });
    sim.onChange = () => {
      const p = sim.p;
      for (const x of [45, 55, 60]) sim.set('c' + x, ML.pct(cost(p.spread, p.comm, x), 1) + ' de R');
      const c = cost(p.spread, p.comm, 55);
      sim.set('be0', ML.pct(1 / (1 + p.pay), 1));
      sim.set('be1', ML.pct((1 + c) / (1 + p.pay + c), 1));
    };
    sim.onChange();
  });
})();
