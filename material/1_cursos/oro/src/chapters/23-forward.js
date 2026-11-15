/* Capítulo 23 — Prueba hacia adelante */
(function () {
  'use strict';
  const ML = window.ML, St = () => ML.L.stats;

  /* ======================================================================
     23.1 Regla secuencial
     ====================================================================== */
  ML.defineSim('prueba-adelante', function (sim) {
    const cv = sim.canvas({ aspect: 1.55, maxH: '430px' });
    sim.group('Mundo verdadero');
    sim.slider('e', { label: 'Ventaja verdadera (R por operación)', min: -0.1, max: 0.3, step: 0.01, value: 0.1, fmt: (v) => ML.R(v, 2) });
    sim.slider('sd', { label: 'Desviación de R', min: 0.6, max: 1.5, step: 0.02, value: 0.88, fmt: (v) => ML.fix(v, 2) });
    sim.button('+50 operaciones', () => { add(50); }, { primary: true });
    sim.button('+10', () => { add(10); });
    sim.button('Reiniciar', () => { seed++; xs = []; });
    sim.out('now', 'Ahora', { hl: true, wide: true });
    sim.out('dec', 'Decisión de la regla', { wide: true });
    sim.out('mc', 'Con 1 000 historiales de esa ventaja (hasta 800 operaciones)', { wide: true });
    let seed = 1, xs = [], rng = St().rng(11);
    const decide = (n, m, se) => { const t = m / se; if (n >= 100 && t > 2.5) return 'APROBAR'; if (n >= 100 && t < -1.5) return 'DESCARTAR'; if (n >= 200 && m + 1.96 * se < 0.05) return 'DESCARTAR'; return 'seguir'; };
    function add(k) { if (!xs.length) rng = St().rng(seed * 313 + 11); const p = sim.p; for (let i = 0; i < k && xs.length < 800; i++) xs.push(p.e + p.sd * rng.normal()); sim.redraw(); }
    sim.onChange = () => { xs = []; rng = St().rng(seed * 313 + 11); };
    let mcKey = null, mcRes = null;
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const p = sim.p, n = xs.length;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 800, ymin: -0.6, ymax: 0.8, ml: 54, mb: 44, xlabel: 'Operaciones cerradas en vivo', ylabel: 'R medio acumulado (IC 95 %)' });
      pl.frame();
      pl.hline(0, { color: '--ink', width: 1.3, dash: [] });
      pl.hline(0.05, { color: '--c4', dash: [4, 3], label: '+0.05 (mínimo útil)', labelRight: true });
      pl.band(0, 100, { color: '--ink-3', alpha: 0.1 });
      pl.label(50, 0.72, 'n < 100: no se decide', { align: 'center', color: '--ink-3' });
      let s = 0, s2 = 0; const X = [], M = [], L = [], U = [];
      for (let i = 0; i < n; i++) { s += xs[i]; s2 += xs[i] * xs[i]; if (i >= 9 && ((i + 1) % 5 === 0 || i === n - 1)) { const m = s / (i + 1), sd = Math.sqrt(Math.max(1e-9, (s2 - (i + 1) * m * m) / i)), se = sd / Math.sqrt(i + 1); X.push(i + 1); M.push(m); L.push(m - 1.96 * se); U.push(m + 1.96 * se); } }
      const ctx = cv.ctx;
      if (X.length) { pl.clip(() => { ctx.fillStyle = ML.alpha('--accent', 0.18); ctx.beginPath(); X.forEach((x, i) => (i ? ctx.lineTo(pl.X(x), pl.Y(U[i])) : ctx.moveTo(pl.X(x), pl.Y(U[i])))); for (let i = X.length - 1; i >= 0; i--) ctx.lineTo(pl.X(X[i]), pl.Y(L[i])); ctx.closePath(); ctx.fill(); }); pl.xy(X, M, { color: '--accent', width: 2.6 }); }
      pl.hline(p.e, { color: '--c3', dash: [6, 4], label: 'verdad = ' + ML.fix(p.e, 2) });
      if (n >= 10) {
        const m = s / n, sd = Math.sqrt((s2 - n * m * m) / (n - 1)), se = sd / Math.sqrt(n), d = decide(n, m, se);
        sim.set('now', n + ' operaciones · R medio ' + ML.R(m, 3) + ' ± ' + ML.fix(1.96 * se, 3) + ' · t = ' + ML.fix(m / se, 2));
        sim.set('dec', d === 'APROBAR' ? '✔ APROBAR (t > 2.5, n ≥ 100)' : d === 'DESCARTAR' ? '✘ DESCARTAR' : 'seguir operando');
      } else { sim.set('now', n + ' operaciones'); sim.set('dec', 'pulse «+50 operaciones»'); }
      const key = p.e + '|' + p.sd;
      if (mcKey !== key) {
        mcKey = key; const r2 = St().rng(99); let ap = 0, de = 0, ns = [];
        for (let h = 0; h < 1000; h++) { let ss = 0, ss2 = 0, res = null; for (let i = 0; i < 800; i++) { const v = p.e + p.sd * r2.normal(); ss += v; ss2 += v * v; const k = i + 1; if (k >= 100 && k % 10 === 0) { const m = ss / k, se = Math.sqrt((ss2 - k * m * m) / (k - 1)) / Math.sqrt(k), d = decide(k, m, se); if (d !== 'seguir') { res = d; ns.push(k); break; } } } if (res === 'APROBAR') ap++; else if (res === 'DESCARTAR') de++; }
        mcRes = { ap: ap / 1000, de: de / 1000, nd: 1 - (ap + de) / 1000, n: ns.length ? St().mean(ns) : NaN };
      }
      sim.set('mc', 'aprueba ' + ML.pct(mcRes.ap, 0) + ' · descarta ' + ML.pct(mcRes.de, 0) + ' · sin decidir ' + ML.pct(mcRes.nd, 0) + (mcRes.n === mcRes.n ? ' · operaciones medias al decidir ' + ML.fix(mcRes.n, 0) : ''));
    });
  });

  /* ======================================================================
     23.2 Historial de la cuenta de prueba (versión de escalera)
     ====================================================================== */
  const PROFITS = [14.1, 13.3, 15.2, 15.8, 12.5, 32.0, 19.7, -10.7, -36.3, -85.0, -26.3, -36.3, 14.7, 13.3, 15.8, 14.6, 13.1, 14.9, 15.4, 13.2, 15.7, 15.7, 13.4, 15.8, 10.1, 0.3, 0.1, 10.9, 0.5, 0.5, 9.3, -0.5, -0.4, 10.0, 0.4, 0.2, 11.6, 12.4, 10.1, 10.1, 11.9, 9.9, 11.1, 10.1, 12.4, 10.0, 13.3, 10.5, 11.8, 12.3, 10.0, -77.2, -45.9, -116.9, -38.6, -30.9, -57.8, 9.2, 12.0, 14.7, 14.6, 11.7, 9.9, 10.5, 12.0, 9.5, 10.4, 0.0, 0.3, 10.3, 8.2, 10.1, 10.2, 8.0, 10.2, 11.7, 8.3, 10.4, 6.9, 4.1, 0.1, 6.0, 0.1, 0.1, 5.6, 3.9, -7.0, -45.8, -15.2, -21.0, -7.0, -11.3, -15.3, 14.9, -19.9, -13.2, 6.2, 4.1, 5.1, 6.4, 4.2, 5.1];
  ML.defineSim('historial-escalera', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, maxH: '430px' });
    sim.out('acc', 'Aciertos', { hl: true });
    sim.out('avg', 'Ganancia media · pérdida media');
    sim.out('pf', 'Factor de beneficio · total');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const n = PROFITS.length, eq = [0];
      PROFITS.forEach((v, i) => eq.push(eq[i] + v));
      const h1 = cv.h * 0.56;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: 0, xmax: n, ymin: Math.min(...eq) - 30, ymax: Math.max(...eq) + 50, ml: 54, mb: 34, xlabel: 'Cierre parcial n.º', ylabel: 'USD acumulados' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [4, 3] });
      pl.xy(eq.map((_, i) => i), eq, { color: '--accent', width: 2.4 });
      const lo = -125, hi = 40, bins = 33, h = St().histogram(PROFITS, lo, hi, bins), bw = (hi - lo) / bins;
      const p2 = new ML.Plot(cv.ctx, { x: 0, y: cv.h * 0.58, w: cv.w, h: cv.h * 0.42, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...h) * 1.1, ml: 54, mb: 36, xlabel: 'Resultado de un cierre parcial (USD)', ylabel: 'Cierres' });
      p2.frame();
      p2.vline(0, { color: '--ink', width: 1.2, dash: [] });
      const xs = h.map((_, i) => lo + (i + 0.5) * bw);
      ML.draw.bars(p2, xs, h, bw * 0.92, { colors: xs.map((x) => (x > 0 ? '--c3' : '--c2')), alpha: 0.85 });
      const g = PROFITS.filter((v) => v > 0), l = PROFITS.filter((v) => v <= 0);
      sim.set('acc', ML.pct(g.length / n, 1) + ' de ' + n + ' cierres');
      sim.set('avg', ML.usdS(St().mean(g), 1) + ' · ' + ML.usd(St().mean(l), 1));
      sim.set('pf', ML.fix(g.reduce((a, b) => a + b, 0) / -l.reduce((a, b) => a + b, 0), 2) + ' · ' + ML.usdS(eq[n], 1));
    });
  });
})();
