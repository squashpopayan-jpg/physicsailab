/* Capítulo 7 — Tamaño de posición, escalera y dos balas */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats;

  /* ======================================================================
     7.1 Riesgo nominal contra riesgo real
     ====================================================================== */
  ML.defineSim('redondeo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Riesgo y costos');
    sim.slider('risk', { label: 'Riesgo nominal (USD)', min: 2, max: 300, step: 1, value: 125, fmt: (v) => ML.usd(v) });
    sim.slider('spread', { label: 'Spread (USD)', min: 0, max: 1, step: 0.01, value: 0.27, fmt: (v) => ML.fix(v, 2) });
    sim.slider('comm', { label: 'Comisión (USD por lote)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) });
    sim.slider('step', { label: 'Lote mínimo y paso', min: 0.01, max: 0.1, step: 0.01, value: 0.01, fmt: (v) => ML.fix(v, 2) });
    sim.out('r55', 'Riesgo real con stop de 55 pips', { hl: true });
    sim.out('over', 'Mayor exceso sobre el nominal (stops 20–100 pips)');
    sim.out('under', 'Mayor defecto sobre el nominal');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p;
      const real = (pips) => { const D = pips * 0.1 + p.spread; const lots = Math.max(p.step, Math.floor((p.risk / (D * 100 + p.comm)) / p.step + 1e-9) * p.step); return lots * (D * 100 + p.comm); };
      let ex = 0, de = 0;
      for (let x = 20; x <= 100; x++) { const r = real(x) / p.risk - 1; if (r > ex) ex = r; if (r < de) de = r; }
      const ymax = Math.max(p.risk * 1.5, ...[20, 40, 60, 80, 100].map(real)) * 1.05;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 20, xmax: 100, ymin: 0, ymax, ml: 54, mb: 44, xlabel: 'Distancia del stop (pips)', ylabel: 'Pérdida si toca el stop (USD)' });
      pl.frame();
      pl.hline(p.risk, { color: '--ink-3', dash: [6, 4], width: 1.6, label: 'riesgo nominal' });
      pl.band(45, 60, { color: '--accent', alpha: 0.12 });
      const xs = [], ys = [];
      for (let x = 20; x <= 100; x += 0.25) { xs.push(x); ys.push(real(x)); }
      pl.xy(xs, ys, { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'riesgo real con el lote permitido', color: '--accent' }, { label: 'riesgo nominal', color: '--ink-3', dash: [6, 4] }], 'tr');
      sim.set('r55', ML.usd(real(55), 1) + ' <small>(' + ML.pct(real(55) / p.risk, 0) + ' del nominal)</small>');
      sim.set('over', '+' + ML.pct(ex, 0));
      sim.set('under', ML.pct(de, 0));
    });
  });

  /* ======================================================================
     7.2 Escalera (promediar) en un mercado sin ventaja
     ====================================================================== */
  ML.defineSim('escalera', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Escalera');
    sim.slider('L', { label: 'Niveles de promedio', min: 1, max: 5, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.slider('step', { label: 'Paso entre niveles (pips)', min: 10, max: 60, step: 5, value: 30, fmt: (v) => ML.fix(v, 0) });
    sim.slider('tp', { label: 'Take profit sobre el precio medio (pips)', min: 5, max: 60, step: 5, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.slider('hard', { label: 'Stop duro bajo el último nivel (pips)', min: 20, max: 120, step: 5, value: 60, fmt: (v) => ML.fix(v, 0) });
    sim.slider('c', { label: 'Costo por intento (R)', min: 0, max: 0.1, step: 0.005, value: 0.03, fmt: (v) => ML.fix(v, 3) });
    sim.button('Otro sorteo', () => { seed++; }, { primary: true });
    sim.out('win', 'Acierto', { hl: true });
    sim.out('gain', 'Ganancia media por acierto');
    sim.out('loss', 'Pérdida cuando falla');
    sim.out('e', 'Esperanza por intento');
    let seed = 1;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, L = Math.round(p.L), N = 3000, rng = St().rng(seed * 5099 + 9);
      /* compra: niveles de entrada en 0, −step, −2step ...; stop duro en −((L−1)step + hard) */
      const stopP = (L - 1) * p.step + p.hard;
      let denom = 0;
      for (let k = 0; k < L; k++) denom += stopP - k * p.step;   /* pips perdidos por lote si se toca el stop duro */
      const lot = 1 / denom;                                     /* cada lote: la pérdida total al stop duro vale 1 R */
      const Rs = new Float64Array(N);
      let wins = 0;
      for (let t = 0; t < N; t++) {
        let pos = 0, open = 1, sumE = 0;
        const entries = [0];
        let done = false;
        while (!done) {
          pos += rng() < 0.5 ? -5 : 5;
          if (open < L && pos <= -open * p.step) { entries.push(-open * p.step); open++; }
          const avg = entries.reduce((a, b) => a + b, 0) / entries.length;
          if (pos >= avg + p.tp) { Rs[t] = open * lot * p.tp - p.c; wins++; done = true; }
          else if (pos <= -stopP) { Rs[t] = -1 - p.c; done = true; }
        }
      }
      const gainSum = Array.from(Rs).filter((v) => v > 0);
      const wr = wins / N, avgGain = gainSum.length ? St().mean(gainSum) : 0;
      /* curva de una secuencia */
      const eq = [0]; for (let i = 0; i < 400; i++) eq.push(eq[i] + Rs[i]);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 400, ymin: Math.min(...eq) - 1, ymax: Math.max(...eq) + 1, ml: 54, mb: 44, xlabel: 'Intentos (una secuencia de 400)', ylabel: 'Resultado acumulado (R)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.xy(eq.map((_, i) => i), eq, { color: '--c2', width: 2.2 });
      sim.set('win', ML.pct(wr, 1));
      sim.set('gain', ML.R(avgGain, 2));
      sim.set('loss', ML.R(-1 - p.c, 2));
      sim.set('e', ML.R(St().mean(Rs), 3) + ' <small>(teoría ≈ ' + ML.fix(-p.c, 3) + ')</small>');
    });
  });

  /* ======================================================================
     7.3 Árbol de un día con dos balas
     ====================================================================== */
  ML.defineSim('arbol-dia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, maxH: '400px' });
    sim.group('Señales y desenlaces');
    sim.slider('lam', { label: 'Señales por día (Poisson)', min: 0.2, max: 3, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) });
    sim.slider('tp', { label: 'P(take profit) %', min: 0, max: 60, step: 1, value: 24, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sl', { label: 'P(stop inicial) %', min: 0, max: 60, step: 1, value: 18, fmt: (v) => ML.fix(v, 0) });
    sim.slider('sld', { label: 'P(SL defensivo) %', min: 0, max: 60, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.slider('be', { label: 'P(break-even) %', min: 0, max: 60, step: 1, value: 23, fmt: (v) => ML.fix(v, 0) });
    sim.note('El resto (hasta 100 %) es estancamiento, −0.32 R.');
    sim.group('Reglas del día');
    sim.slider('balas', { label: 'Balas por día', min: 1, max: 4, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) });
    sim.check('one', { label: 'One and Done tras el primer TP', value: true });
    sim.slider('cap', { label: 'Tope de pérdida diaria (R)', min: 1, max: 6, step: 0.5, value: 2, fmt: (v) => ML.fix(v, 1) });
    sim.out('mean', 'Resultado medio del día', { hl: true });
    sim.out('green', 'Días verdes · rojos · sin operar');
    sim.out('worst', 'Peor día posible · P');
    const R = { tp: 1.64, sl: -0.98, sld: -0.39, be: 0.09, stag: -0.32 };
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p;
      const pr = { tp: p.tp / 100, sl: p.sl / 100, sld: p.sld / 100, be: p.be / 100 };
      pr.stag = Math.max(0, 1 - pr.tp - pr.sl - pr.sld - pr.be);
      const tot = pr.tp + pr.sl + pr.sld + pr.be + pr.stag;
      Object.keys(pr).forEach((k) => (pr[k] /= tot));
      /* distribución de la cantidad de señales: Poisson truncada a las balas */
      const nb = Math.round(p.balas);
      const pois = []; let acc = 0;
      for (let k = 0; k < nb; k++) { const v = Math.exp(-p.lam) * Math.pow(p.lam, k) / [1, 1, 2, 6, 24][k]; pois.push(v); acc += v; }
      pois.push(1 - acc);   /* nb o más */
      /* enumerar caminos */
      const leaves = new Map();
      const add = (v, pb) => { const key = Math.round(v * 100) / 100; leaves.set(key, (leaves.get(key) || 0) + pb); };
      /* cantidad objetivo de intentos n (0..nb) con prob pois[n]; en cada intento, si ya cerrado por candado, se detiene */
      for (let n = 0; n <= nb; n++) {
        const walk = (k, pnl, pb) => {
          if (k === n) { add(pnl, pb); return; }
          for (const key of Object.keys(pr)) {
            const pnl2 = pnl + R[key], pb2 = pb * pr[key];
            if (pb2 === 0) continue;
            const lock = (p.one && key === 'tp') || pnl2 <= -p.cap;
            if (lock) add(pnl2, pb2); else walk(k + 1, pnl2, pb2);
          }
        };
        walk(0, 0, pois[n]);
      }
      const arr = Array.from(leaves.entries()).sort((a, b) => a[0] - b[0]);
      let mean = 0, green = 0, red = 0, flat = 0;
      arr.forEach(([v, pb]) => { mean += v * pb; if (v > 0) green += pb; else if (v < 0) red += pb; else flat += pb; });
      /* agrupa en barras de 0.25 R */
      const lo = -p.cap - 1.2, hi = 2.6, bw = 0.2, nbins = Math.ceil((hi - lo) / bw), h = new Float64Array(nbins);
      arr.forEach(([v, pb]) => { const k = Math.min(nbins - 1, Math.max(0, Math.floor((v - lo) / bw))); h[k] += pb; });
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...h) * 1.1, ml: 54, mb: 44, xlabel: 'Resultado del día (R; 1 R = 125 USD)', ylabel: 'Probabilidad', yfmt: (v) => ML.fix(100 * v, 0) + ' %' });
      pl.frame();
      pl.vline(0, { color: '--ink', width: 1.4, dash: [] });
      const xs = Array.from(h, (_, k) => lo + (k + 0.5) * bw);
      ML.draw.bars(pl, xs, Array.from(h), bw * 0.9, { colors: xs.map((x) => (x > 0.001 ? '--c3' : x < -0.001 ? '--c2' : '--ink-3')), alpha: 0.85 });
      pl.vline(mean, { color: '--accent', width: 2, label: 'media ' + ML.fix(mean, 2) + ' R', dash: [4, 3] });
      sim.set('mean', ML.R(mean, 3) + ' = ' + ML.usdS(mean * 125, 0) + ' por día');
      sim.set('green', ML.pct(green, 0) + ' · ' + ML.pct(red, 0) + ' · ' + ML.pct(flat, 0));
      sim.set('worst', ML.R(arr[0][0], 2) + ' · ' + ML.pct(arr[0][1], 1));
    });
  });
})();
