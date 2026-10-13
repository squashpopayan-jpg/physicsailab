/* Capítulo 29 — Interpretar modelos */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     29.1 Importancia por permutación y variables correlacionadas
     ====================================================================== */
  ML.defineSim('permutacion-correlacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Datos: y = 2x₁ + x₂ + ruido');
    sim.slider('rho', { label: 'Correlación de x₃ con x₁ (x₃ no entra en y)', min: 0, max: 0.99, step: 0.01, value: 0.95, fmt: f2 });
    sim.check('drop', { label: 'Quitar x₃ del modelo', value: false });
    sim.out('r2', 'R² de prueba del bosque', { hl: true });
    sim.out('note', 'Lectura', { wide: true });
    let cache = null;
    sim.onDraw(() => {
      const key = `${sim.p.rho}|${sim.p.drop}`;
      if (!cache || cache.key !== key) {
        const r = L.rng(3), gen = (n) => { const X = [], y = []; for (let i = 0; i < n; i++) { const a = r.gauss(), b = r.gauss(), c = sim.p.rho * a + Math.sqrt(1 - sim.p.rho ** 2) * r.gauss(), d = r.gauss(); X.push(sim.p.drop ? [a, b, d] : [a, b, c, d]); y.push(2 * a + b + 0.5 * r.gauss()); } return { X, y }; };
        const tr = gen(300), te = gen(300);
        const f = L.ens.forest(tr.X, tr.y, { task: 'reg', nTrees: 40, maxFeatures: 2, minLeaf: 3, rng: L.rng(4) });
        const score = (X, y) => L.met.r2(y, f.predict(X));
        cache = { key, r2: score(te.X, te.y), pi: L.interp.permImportance(score, te.X, te.y, L.rng(5), 5) };
      }
      const names = sim.p.drop ? ['x₁ (efecto 2)', 'x₂ (efecto 1)', 'x₄ (ruido)'] : ['x₁ (efecto 2)', 'x₂ (efecto 1)', 'x₃ (copia de x₁)', 'x₄ (ruido)'];
      ML.draw.clear(cv);
      ML.text(cv.ctx, 'importancia por permutación: caída de R² en prueba al barajar cada variable', 14, 18, { size: 12, color: '--ink-2', weight: 650 });
      ML.hbars(cv.ctx, { x: 6, y: 30, w: cv.w - 12, h: cv.h - 40 }, cache.pi.map((p, j) => ({ label: names[j], value: p.mean, err: p.sd, color: j === 2 && !sim.p.drop ? '--c4' : '--c1' })), { labelW: 130, min: 0, max: Math.max(0.2, ...cache.pi.map((p) => p.mean + p.sd)) * 1.1, fmt: f3, barH: 22 });
      sim.set('r2', f3(cache.r2));
      sim.set('note', sim.p.drop ? 'Sin la copia, x₁ recupera toda su importancia.' : sim.p.rho > 0.8 ? 'Con una copia casi perfecta, el bosque reparte el uso entre x₁ y x₃: al barajar una, la otra conserva la información, y ambas parecen menos importantes de lo que es x₁.' : 'Con poca correlación, x₃ no aporta y su importancia es casi cero.');
    });
  });

  /* ======================================================================
     29.2 Dependencia parcial e ICE
     ====================================================================== */
  ML.defineSim('pdp-ice', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Modelo con interacción');
    sim.note('Datos: y = x₁² si x₂ > 0, y = −x₁ si x₂ ≤ 0 (más ruido). Modelo: gradient boosting.');
    sim.check('ice', { label: 'Curvas ICE (una por caso)', value: true });
    sim.check('color', { label: 'Colorear las ICE por el signo de x₂', value: true });
    sim.check('pdp', { label: 'Dependencia parcial (promedio)', value: true });
    sim.out('msg', 'Lectura', { wide: true });
    const r = L.rng(8), X = [], y = [];
    for (let i = 0; i < 500; i++) { const a = r.uniform(-2, 2), b = r.uniform(-1, 1), c = r.gauss(); X.push([a, b, c]); y.push((b > 0 ? a * a : -a) + 0.3 * r.gauss()); }
    const gb = L.ens.gboost(X, y, { loss: 'sq', nEst: 150, lr: 0.1, depth: 3 });
    const f1 = (x) => gb.raw1(x);
    const grid = Array.from(L.util.linspace(-2, 2, 41)), sample = U.range(40).map((i) => X[i * 12]);
    const ice = sample.map((x) => L.interp.ice(f1, x, 0, grid)), pdp = L.interp.pdp(f1, X.slice(0, 200), 0, grid);
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -2, xmax: 2, ymin: -3, ymax: 5, xlabel: 'x₁', ylabel: 'predicción del modelo' });
      pl.frame();
      if (sim.p.ice) ice.forEach((c, k) => pl.xy(grid, c, { color: sim.p.color ? (sample[k][1] > 0 ? '--k1' : '--k0') : '--c6', width: 1, alpha: 0.5 }));
      if (sim.p.pdp) pl.xy(grid, pdp, { color: '--ink', width: 3.2 });
      pl.legend([{ label: 'dependencia parcial (promedio)', color: '--ink' }, { label: 'ICE con x₂ > 0', color: '--k1' }, { label: 'ICE con x₂ ≤ 0', color: '--k0' }], 'tl');
      sim.set('msg', 'El promedio (negro) sugiere un efecto suave en forma de U asimétrica; las curvas ICE revelan que en realidad hay dos comportamientos opuestos según x₂. La dependencia parcial esconde las interacciones.');
    });
  });

  /* ======================================================================
     29.3 Valores de Shapley exactos para un caso
     ====================================================================== */
  ML.defineSim('shapley', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const NAMES = ['ingreso', 'deuda/ingreso', 'edad', 'atrasos previos'];
    sim.group('Modelo de riesgo de impago (sintético)');
    sim.slider('idx', { label: 'Solicitante', min: 0, max: 59, step: 1, value: 7, fmt: (v) => ML.fix(v, 0) });
    sim.out('fx', 'Probabilidad de impago predicha', { hl: true });
    sim.out('base', 'Valor base (promedio del fondo)');
    sim.out('vals', 'Valores del solicitante', { wide: true });
    const r = L.rng(21), X = [], y = [];
    for (let i = 0; i < 600; i++) { const inc = r.uniform(1, 10), dti = r.uniform(0, 0.8), age = r.uniform(20, 70), late = r() < 0.25 ? 1 + r.int(4) : 0; X.push([inc, dti, age, late]); y.push(r() < U.sigmoid(-1.5 - 0.3 * (inc - 5) + 4 * (dti - 0.35) - 0.02 * (age - 45) + 0.7 * late) ? 1 : 0); }
    const gb = L.ens.gboost(X, y, { loss: 'log', nEst: 80, lr: 0.1, depth: 3 });
    const f1 = (x) => U.sigmoid(gb.raw1(x));
    const bg = U.range(40).map((i) => X[200 + i * 5]);
    sim.onDraw(() => {
      const x = X[Math.round(sim.p.idx)], sh = L.interp.shapley(f1, x, bg);
      ML.draw.clear(cv);
      const ctx = cv.ctx, pl = new ML.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 5.5, xlabel: 'probabilidad de impago', ml: 140, yticks: [], title: 'cascada de Shapley: del valor base a la predicción' });
      pl.frame();
      let cur = sh.base;
      const order = U.argsort(sh.phi.map(Math.abs), true);
      order.forEach((j, k) => {
        const v = sh.phi[j], y0 = 4.6 - k;
        pl.clip(() => { ctx.fillStyle = ML.alpha(v > 0 ? '--c2' : '--c1', 0.8); const a = pl.X(Math.min(cur, cur + v)), b = pl.X(Math.max(cur, cur + v)); ctx.fillRect(a, pl.Y(y0 + 0.35), Math.max(2, b - a), pl.Y(y0 - 0.35) - pl.Y(y0 + 0.35)); });
        ML.text(ctx, `${NAMES[j]} = ${ML.fix(x[j], j === 1 ? 2 : j === 3 ? 0 : 1)}`, pl.ix - 8, pl.Y(y0), { size: 11.5, color: '--ink-2', align: 'right', baseline: 'middle' });
        ML.text(ctx, (v >= 0 ? '+' : '') + f3(v), pl.X(Math.max(cur, cur + v)) + 6, pl.Y(y0), { size: 11, mono: true, color: '--ink', baseline: 'middle', halo: true });
        cur += v;
      });
      pl.vline(sh.base, { color: '--ink-3', label: 'base' });
      pl.vline(sh.fx, { color: '--ink', dash: [], label: 'predicción', labelY: 30 });
      sim.set('fx', f3(sh.fx));
      sim.set('base', f3(sh.base) + ` (suma de las contribuciones: ${f3(U.sum(sh.phi))})`);
      sim.set('vals', NAMES.map((n, j) => `${n}: ${ML.fix(x[j], 2)}`).join(' · '));
    });
  });
})();
