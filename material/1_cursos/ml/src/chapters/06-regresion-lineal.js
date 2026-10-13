/* Capítulo 6 — Regresión lineal */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     6.1 Mínimos cuadrados con puntos arrastrables
     ====================================================================== */
  ML.defineSim('mco-arrastrar', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const INIT = [[1, 2.2], [2, 2.6], [3, 3.9], [3.8, 3.4], [4.6, 5.1], [5.5, 4.6], [6.3, 6.2], [7, 5.6], [7.8, 7.4], [8.8, 7.1]];
    let P = INIT.map((p) => p.slice());
    sim.group('Puntos');
    sim.check('sq', { label: 'Mostrar los cuadrados de los residuos', value: true });
    sim.check('mean', { label: 'Mostrar la recta ȳ (modelo nulo)', value: false });
    sim.button('Quitar el último', () => { if (P.length > 3) P.pop(); }, { id: 'pop' });
    sim.button('Restablecer', () => { P = INIT.map((p) => p.slice()); }, { id: 'reset' });
    sim.out('eq', 'Recta ajustada', { hl: true });
    sim.out('r2', 'R²');
    sim.out('sse', 'SSE (suma de cuadrados)');
    sim.out('rmse', 'RMSE');
    sim.out('cook', 'Punto más influyente (Cook)');
    let pl = null, drag = -1;
    const hit = (px, py) => P.findIndex((p) => Math.hypot(pl.X(p[0]) - px, pl.Y(p[1]) - py) < 11);
    ML.pointer(cv, {
      down: (px, py) => { if (!pl) return null; let k = hit(px, py); if (k < 0 && pl.inside(px, py)) { P.push([pl.invX(px), pl.invY(py)]); k = P.length - 1; } if (k < 0) return null; drag = k; return k; },
      move: (k, px, py) => { P[k] = [ML.M.clamp(pl.invX(px), 0, 10), ML.M.clamp(pl.invY(py), 0, 10)]; sim.redraw(); },
      up: () => { drag = -1; },
      hover: (px, py) => (pl && hit(px, py) >= 0 ? true : pl && pl.inside(px, py) ? 'copy' : false)
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 10, ymin: 0, ymax: 10, xlabel: 'x', ylabel: 'y' });
      pl.frame();
      const m = L.lin.ols(P.map((p) => [p[0]]), P.map((p) => p[1]));
      const b0 = m.intercept, b1 = m.coef[0], ym = L.stat.mean(P.map((p) => p[1]));
      const ctx = cv.ctx;
      pl.clip(() => {
        P.forEach((p, i) => {
          const yh = b0 + b1 * p[0], h = Math.abs(pl.Y(p[1]) - pl.Y(yh));
          if (sim.p.sq) { ctx.fillStyle = ML.alpha('--c2', 0.14); ctx.strokeStyle = ML.alpha('--c2', 0.6); ctx.lineWidth = 1; const x0 = pl.X(p[0]) + (p[0] > 8 ? -h : 0); ctx.fillRect(x0, Math.min(pl.Y(p[1]), pl.Y(yh)), h, h); ctx.strokeRect(x0, Math.min(pl.Y(p[1]), pl.Y(yh)), h, h); }
          ctx.strokeStyle = ML.col('--c2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pl.X(p[0]), pl.Y(p[1])); ctx.lineTo(pl.X(p[0]), pl.Y(yh)); ctx.stroke();
          void i;
        });
      });
      if (sim.p.mean) pl.hline(ym, { color: '--ink-3', label: 'ȳ' });
      pl.fn((x) => b0 + b1 * x, { color: '--c1', width: 2.6 });
      const ci = m.cook ? U.argmax(m.cook) : -1;
      P.forEach((p, i) => pl.dot(p[0], p[1], { color: i === drag ? '--accent' : '--k1', r: i === ci ? 6 : 5 }));
      ML.text(ctx, 'arrastre un punto · clic en un lugar vacío para agregar', pl.ix + 6, pl.iy + 14, { size: 11, color: '--ink-2', halo: true });
      sim.set('eq', `ŷ = ${f2(b0)} + ${f2(b1)} x`);
      sim.set('r2', f3(m.r2));
      sim.set('sse', f2(m.sse) + ` (SST ${f2(m.sst)})`);
      sim.set('rmse', f3(Math.sqrt(m.sse / P.length)));
      sim.set('cook', m.cook ? `D = ${f2(m.cook[ci])} en x = ${f2(P[ci][0])}` : '—');
    });
  });

  /* ======================================================================
     6.2 Diagnóstico de residuos
     ====================================================================== */
  ML.defineSim('diagnostico-residuos', function (sim) {
    sim.cols2();
    const ca = sim.canvas({ aspect: 1.25 }), cb = sim.canvas({ aspect: 1.25 }), cc = sim.canvas({ aspect: 1.25 }), cd = sim.canvas({ aspect: 1.25 });
    sim.group('Situación');
    sim.select('sc', { label: 'Datos', options: [['ok', 'Correcto: lineal y homocedástico'], ['curve', 'No lineal (curvatura)'], ['hetero', 'Heterocedástico (embudo)'], ['outlier', 'Un atípico en y'], ['lever', 'Un punto de alta palanca']], value: 'ok' });
    sim.button('Nueva muestra', () => { seed++; }, { id: 'new' });
    sim.out('slope', 'Pendiente estimada (verdadera 0.8)', { hl: true });
    sim.out('r2', 'R²');
    sim.out('cook', 'Distancia de Cook máxima');
    sim.out('lev', 'Palanca máxima (promedio 2/n)');
    let seed = 1;
    sim.onDraw(() => {
      const rng = L.rng(60 + seed), n = 60, X = [], Y = [];
      for (let i = 0; i < n; i++) {
        const x = 10 * rng();
        let e = rng.gauss();
        if (sim.p.sc === 'hetero') e *= 0.15 + 0.35 * x;
        let y = 2 + 0.8 * x + e;
        if (sim.p.sc === 'curve') y = 2 + 0.8 * x + 0.12 * (x - 5) ** 2 - 1 + 0.8 * e;
        X.push(x); Y.push(y);
      }
      if (sim.p.sc === 'outlier') { X[0] = 5; Y[0] = 2 + 0.8 * 5 + 11; }
      if (sim.p.sc === 'lever') { X[0] = 24; Y[0] = 2 + 0.8 * 24 - 12; }
      const m = L.lin.ols(X.map((v) => [v]), Y);
      const fit = m.yhat, res = m.res, sres = m.stud;
      const xmax = sim.p.sc === 'lever' ? 26 : 10.5;
      const mk = (c, o) => { ML.draw.clear(c); const p = new ML.Plot(c.ctx, Object.assign({ x: 0, y: 0, w: c.w, h: c.h }, o)); p.frame(); return p; };
      const ymin = Math.min(...Y) - 1, ymax = Math.max(...Y) + 1;
      const pa = mk(ca, { xmin: 0, xmax, ymin, ymax, xlabel: 'x', ylabel: 'y', title: 'datos y recta ajustada' });
      pa.fn((x) => 2 + 0.8 * x, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pa.fn((x) => m.intercept + m.coef[0] * x, { color: '--c1', width: 2.4 });
      X.forEach((x, i) => pa.dot(x, Y[i], { color: i === 0 && (sim.p.sc === 'outlier' || sim.p.sc === 'lever') ? '--c2' : '--k1', r: 3.6 }));
      const rr = Math.max(...res.map(Math.abs)) * 1.15;
      const pb = mk(cb, { xmin: Math.min(...fit) - 0.5, xmax: Math.max(...fit) + 0.5, ymin: -rr, ymax: rr, xlabel: 'valor ajustado ŷ', ylabel: 'residuo', title: 'residuos frente a ajustados' });
      pb.hline(0, { color: '--ink', dash: [] });
      const ord = U.argsort(fit), win = 15, smooth = [];
      for (let k = 0; k < n; k++) { const a = Math.max(0, k - win), b = Math.min(n, k + win + 1); smooth.push([fit[ord[k]], L.stat.mean(ord.slice(a, b).map((i) => res[i]))]); }
      pb.path(smooth, { color: '--c2', width: 2 });
      fit.forEach((f, i) => pb.dot(f, res[i], { color: '--k0', r: 3.2 }));
      const zs = sres.slice().sort((a, b) => a - b), th = zs.map((_, i) => L.stat.normQuantile((i + 0.5) / n));
      const qr = Math.max(3, Math.max(...zs.map(Math.abs)) * 1.1);
      const pc = mk(cc, { xmin: -3, xmax: 3, ymin: -qr, ymax: qr, xlabel: 'cuantil teórico normal', ylabel: 'residuo estudentizado', title: 'gráfico cuantil–cuantil' });
      pc.fn((v) => v, { color: '--ink-3', dash: [5, 4], width: 1.4 });
      zs.forEach((z, i) => pc.dot(th[i], z, { color: '--k0', r: 3 }));
      const lmax = Math.max(...m.lev) * 1.15;
      const pd = mk(cd, { xmin: 0, xmax: Math.max(0.12, lmax), ymin: -qr, ymax: qr, xlabel: 'palanca h_ii', ylabel: 'residuo estudentizado', title: 'influencia (tamaño ∝ distancia de Cook)' });
      pd.hline(0, { color: '--ink-3' });
      m.lev.forEach((h, i) => pd.dot(h, sres[i], { color: m.cook[i] > 0.5 ? '--c2' : m.cook[i] > 4 / n ? '--k1' : '--k0', r: 2.5 + Math.min(10, 14 * Math.sqrt(m.cook[i])) }));
      sim.set('slope', f3(m.coef[0]) + ` ± ${f3(m.se[1])}`);
      sim.set('r2', f3(m.r2));
      const cm = Math.max(...m.cook);
      sim.set('cook', f3(cm) + (cm > 0.5 ? '  (> 0.5: muy influyente)' : cm > 4 / n ? '  (> 4/n: mírelo)' : ''));
      sim.set('lev', `${f3(Math.max(...m.lev))} (${f3(2 / n)})`);
    });
  });

  /* ======================================================================
     6.3 Multicolinealidad
     ====================================================================== */
  ML.defineSim('multicolinealidad', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 }), ct = sim.canvas({ aspect: 1 });
    sim.group('Diseño');
    sim.slider('rho', { label: 'Correlación entre x₁ y x₂ (ρ)', min: 0, max: 0.99, step: 0.01, value: 0.9, fmt: f2 });
    sim.slider('n', { label: 'Datos por muestra n', min: 20, max: 300, step: 10, value: 50, fmt: (v) => ML.fix(v, 0) });
    sim.out('vif', 'VIF teórico 1/(1 − ρ²)', { hl: true });
    sim.out('sd', 'Desviación de β̂₁ entre muestras');
    sim.out('cor', 'Correlación entre β̂₁ y β̂₂');
    sim.out('rmse', 'RMSE de prueba promedio');
    let est = [], rm = [];
    const compute = () => {
      est = []; rm = [];
      const n = Math.round(sim.p.n), rho = sim.p.rho;
      const te = L.data.regLinear(500, [1, 1], 1, L.rng(5), rho, 1);
      for (let r = 0; r < 200; r++) {
        const d = L.data.regLinear(n, [1, 1], 1, L.rng(900 + r), rho, 1);
        const m = L.lin.ols(d.X, d.y, { stats: false });
        est.push([m.coef[0], m.coef[1]]);
        rm.push(L.met.rmse(te.y, m.predict(te.X)));
      }
    };
    compute();
    sim.onChange = () => compute();
    sim.onDraw(() => {
      ML.draw.clear(cs);
      const ps = new ML.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: -1.5, xmax: 3.5, ymin: -1.5, ymax: 3.5, xlabel: 'β̂₁', ylabel: 'β̂₂', title: 'estimaciones en 200 muestras' });
      ps.frame();
      ps.fn((b) => 2 - b, { color: '--ink-3', dash: [4, 4], width: 1.2 });
      est.forEach((e) => ps.dot(e[0], e[1], { color: '--c1', r: 2.4 }));
      ps.dot(1, 1, { color: '--c2', r: 5.5, label: 'verdadero (1, 1)' });
      const b1 = est.map((e) => e[0]), b2 = est.map((e) => e[1]);
      ML.draw.clear(ct);
      const RH = [0, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99];
      const n = Math.round(sim.p.n);
      const pt = new ML.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(1, 1.2 * Math.sqrt(1 / ((1 - 0.99 * 0.99) * (n - 3)))), xlabel: 'ρ', ylabel: 'desviación de β̂₁', title: 'teoría: σ / √((1 − ρ²)(n − 3))' });
      pt.frame();
      pt.fn((r) => Math.sqrt(1 / ((1 - r * r) * (n - 3))), { color: '--c5', width: 2.2, to: 0.995 });
      pt.dot(sim.p.rho, L.stat.std(b1), { color: '--c2', r: 5, label: 'observada', align: 'right', dx: -8 });
      void RH;
      sim.set('vif', ML.fix(1 / (1 - sim.p.rho ** 2), 1));
      sim.set('sd', f3(L.stat.std(b1)));
      sim.set('cor', f3(L.stat.corr(b1, b2)));
      sim.set('rmse', f3(L.stat.mean(rm)) + ' (σ = 1)');
    });
  });
})();
