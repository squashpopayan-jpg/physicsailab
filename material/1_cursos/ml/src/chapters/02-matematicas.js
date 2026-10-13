/* Capítulo 2 — Las matemáticas que usa el ML */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L;
  const f2 = (v) => ML.fix(v, 2), f3 = (v) => ML.fix(v, 3);

  /* ======================================================================
     2.1 Matriz 2×2 como transformación
     ====================================================================== */
  ML.defineSim('matriz-transformacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const PRE = {
      ident: [1, 0, 0, 1], escala: [2, 0, 0, 0.5], rot: [Math.cos(0.52), -Math.sin(0.52), Math.sin(0.52), Math.cos(0.52)],
      cizalla: [1, 1, 0, 1], sim: [1.6, 0.8, 0.8, 1.1], sing: [1, 2, 0.5, 1], refl: [1, 0, 0, -1]
    };
    sim.group('Matriz A = [[a, b], [c, d]]');
    sim.select('pre', { label: 'Ejemplo', options: [['sim', 'Simétrica (como una covarianza)'], ['ident', 'Identidad'], ['escala', 'Escala por ejes'], ['rot', 'Rotación de 30°'], ['cizalla', 'Cizalla'], ['refl', 'Reflexión'], ['sing', 'Singular (det = 0)']], value: 'sim',
      onInput: (v) => { const m = PRE[v]; ['a', 'b', 'c', 'd'].forEach((k, i) => sim.ctl[k].set(m[i], true)); } });
    ['a', 'b', 'c', 'd'].forEach((k, i) => sim.slider(k, { label: k, min: -2, max: 2, step: 0.05, value: PRE.sim[i], fmt: f2 }));
    sim.check('eig', { label: 'Mostrar autovectores', value: true });
    sim.out('det', 'Determinante', { hl: true });
    sim.out('ev', 'Autovalores');
    sim.out('inv', '¿Invertible?');
    const view = new ML.View2D(cv, { xmin: -3.2, xmax: 3.2, ymin: -3.2, ymax: 3.2 });
    sim.onDraw(() => {
      view.update();
      ML.draw.clear(cv);
      const ctx = cv.ctx, { a, b, c, d } = sim.p;
      const T = (x, y) => [a * x + b * y, c * x + d * y];
      view.grid({ labels: false });
      ctx.save();
      ctx.strokeStyle = ML.alpha('--accent', 0.45); ctx.lineWidth = 1.1;
      for (let k = -4; k <= 4; k++) {
        ctx.beginPath(); for (let t = -4; t <= 4; t += 0.25) { const p = T(k, t); t === -4 ? ctx.moveTo(view.X(p[0]), view.Y(p[1])) : ctx.lineTo(view.X(p[0]), view.Y(p[1])); } ctx.stroke();
        ctx.beginPath(); for (let t = -4; t <= 4; t += 0.25) { const p = T(t, k); t === -4 ? ctx.moveTo(view.X(p[0]), view.Y(p[1])) : ctx.lineTo(view.X(p[0]), view.Y(p[1])); } ctx.stroke();
      }
      ctx.strokeStyle = ML.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), view.s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = ML.col('--c1'); ctx.lineWidth = 2.4; ctx.fillStyle = ML.alpha('--c1', 0.1);
      ctx.beginPath(); for (let t = 0; t <= 96; t++) { const u = (2 * Math.PI * t) / 96; const p = T(Math.cos(u), Math.sin(u)); t ? ctx.lineTo(view.X(p[0]), view.Y(p[1])) : ctx.moveTo(view.X(p[0]), view.Y(p[1])); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      const e1 = T(1, 0), e2 = T(0, 1);
      ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(e1[0]), view.Y(e1[1]), { color: '--ink', width: 2 });
      ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(e2[0]), view.Y(e2[1]), { color: '--ink-2', width: 2 });
      ML.text(ctx, 'Ae₁', view.X(e1[0]) + 6, view.Y(e1[1]) - 6, { size: 12, color: '--ink', halo: true });
      ML.text(ctx, 'Ae₂', view.X(e2[0]) + 6, view.Y(e2[1]) - 6, { size: 12, color: '--ink-2', halo: true });
      const det = a * d - b * c, tr = a + d, disc = (tr * tr) / 4 - det;
      if (disc >= -1e-12) {
        const s = Math.sqrt(Math.max(0, disc)), lam = [tr / 2 + s, tr / 2 - s];
        if (sim.p.eig) lam.forEach((l, k) => {
          let v = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : k === 0 ? (a >= d ? [1, 0] : [0, 1]) : (a >= d ? [0, 1] : [1, 0]);
          const nv = Math.hypot(v[0], v[1]) || 1; v = [v[0] / nv, v[1] / nv];
          const col = k === 0 ? '--c2' : '--c3';
          ML.draw.arrow(ctx, view.X(0), view.Y(0), view.X(l * v[0]), view.Y(l * v[1]), { color: col, width: 3 });
          ctx.save(); ctx.strokeStyle = ML.alpha(col, 0.5); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(view.X(-4 * v[0]), view.Y(-4 * v[1])); ctx.lineTo(view.X(4 * v[0]), view.Y(4 * v[1])); ctx.stroke(); ctx.restore();
          ML.text(ctx, `λ${k ? '₂' : '₁'} = ${f2(l)}`, view.X(l * v[0]) + 8, view.Y(l * v[1]) + 14, { size: 12, color: col, halo: true, weight: 600 });
        });
        sim.set('ev', `${f3(lam[0])}, ${f3(lam[1])}`);
      } else sim.set('ev', `complejos: ${f3(tr / 2)} ± ${f3(Math.sqrt(-disc))}i (hay rotación)`);
      sim.set('det', f3(det) + (Math.abs(det) < 0.02 ? '  (el plano se aplasta)' : det < 0 ? '  (invierte la orientación)' : ''));
      sim.set('inv', Math.abs(det) < 1e-9 ? 'no' : Math.abs(det) < 0.05 ? 'apenas: mal condicionada' : 'sí');
      ML.text(ctx, 'gris: plano original · color: plano transformado · azul: imagen del círculo unidad', 10, cv.h - 10, { size: 11, color: '--ink-2', halo: true });
    });
  });

  /* ======================================================================
     2.2 Curvas de nivel del MSE y gradiente
     ====================================================================== */
  ML.defineSim('gradiente-curvas', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 1 }), cd = sim.canvas({ aspect: 1 });
    const rng = L.rng(21);
    const X = Array.from({ length: 14 }, (_, i) => [-2 + (4 * i) / 13 + 0.15 * rng.gauss()]);
    const Y = X.map(([x]) => 1.2 * x + 0.6 + 0.45 * rng.gauss());
    const n = X.length;
    const Lf = (w, b) => { let s = 0; for (let i = 0; i < n; i++) s += (w * X[i][0] + b - Y[i]) ** 2; return s / n; };
    const G = (w, b) => { let gw = 0, gb = 0; for (let i = 0; i < n; i++) { const e = w * X[i][0] + b - Y[i]; gw += (2 * e * X[i][0]) / n; gb += (2 * e) / n; } return [gw, gb]; };
    const ols = L.lin.ols(X, Y, { stats: false });
    sim.group('Descenso');
    sim.slider('eta', { label: 'Tasa de aprendizaje η', min: 0.01, max: 1.3, step: 0.01, value: 0.15, fmt: f2 });
    sim.button('Dar un paso', () => step(), { primary: true, id: 'step' });
    sim.button('Volver al inicio', () => { cur = [-0.6, 2.6]; path = [cur.slice()]; }, { id: 'back' });
    sim.check('auto', { label: 'Pasos automáticos', value: false });
    sim.note('Haga clic en el mapa de la izquierda para elegir otro punto de partida.');
    sim.out('L', 'Error cuadrático medio L(w, b)', { hl: true });
    sim.out('g', '∇L = (∂L/∂w, ∂L/∂b)');
    sim.out('opt', 'Mínimo (mínimos cuadrados)');
    sim.out('k', 'Pasos dados');
    let cur = [-0.6, 2.6], path = [cur.slice()];
    const step = () => { const g = G(cur[0], cur[1]); cur = [cur[0] - sim.p.eta * g[0], cur[1] - sim.p.eta * g[1]]; if (Math.abs(cur[0]) > 1e3) cur = [Math.sign(cur[0]) * 1e3, cur[1]]; path.push(cur.slice()); if (path.length > 400) path.shift(); };
    let acc = 0;
    sim.animate((dt) => { if (!sim.p.auto) return; acc += dt; if (acc > 0.25) { acc = 0; step(); } }, { autoplay: true });
    let pl = null;
    ML.pointer(cl.el ? cl : cl, { down: (px, py) => { if (!pl || !pl.inside(px, py)) return null; cur = [pl.invX(px), pl.invY(py)]; path = [cur.slice()]; sim.redraw(); return 1; }, move: () => {}, hover: () => 'crosshair' });
    sim.onDraw(() => {
      ML.draw.clear(cl);
      pl = new ML.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: -1.2, xmax: 3.4, ymin: -1.8, ymax: 3.2, xlabel: 'pendiente w', ylabel: 'intercepto b' });
      const lmin = Lf(ols.coef[0], ols.intercept);
      ML.heatmap(pl, (w, b) => { const t = Math.log(Lf(w, b) / lmin) / Math.log(60); return [...ML.cmap.seq(1 - ML.M.clamp(t, 0, 1) * 0.85, '--c1'), 1]; }, { res: 4 });
      ML.contour(pl, (w, b) => Math.log(Lf(w, b)), Array.from({ length: 12 }, (_, k) => Math.log(lmin) + 0.35 * (k + 0.3)), { color: '--ink-3', width: 1, alpha: 0.6 });
      pl.frame();
      pl.clip((ctx) => {
        ctx.strokeStyle = ML.col('--c2'); ctx.lineWidth = 1.8; ctx.beginPath();
        path.forEach((p, i) => (i ? ctx.lineTo(pl.X(p[0]), pl.Y(p[1])) : ctx.moveTo(pl.X(p[0]), pl.Y(p[1]))));
        ctx.stroke();
        path.forEach((p) => { ctx.beginPath(); ctx.arc(pl.X(p[0]), pl.Y(p[1]), 2.6, 0, 7); ctx.fillStyle = ML.col('--c2'); ctx.fill(); });
      });
      const g = G(cur[0], cur[1]);
      const gl = Math.hypot(g[0], g[1]) || 1, al = Math.min(0.9, sim.p.eta * gl);
      pl.arrow(cur[0], cur[1], cur[0] - (g[0] / gl) * Math.max(al, 0.25), cur[1] - (g[1] / gl) * Math.max(al, 0.25), { color: '--ink', width: 2.2 });
      pl.dot(cur[0], cur[1], { color: '--accent', r: 5.5 });
      ML.cross(pl, ols.coef[0], ols.intercept, { color: '--ink' });
      ML.draw.clear(cd);
      const pd = new ML.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -2.5, xmax: 2.5, ymin: -3, ymax: 4.5, xlabel: 'x', ylabel: 'y', title: 'datos y recta actual' });
      pd.frame();
      pd.clip((ctx) => { ctx.strokeStyle = ML.alpha('--c2', 0.55); ctx.lineWidth = 1; X.forEach(([x], i) => { ctx.beginPath(); ctx.moveTo(pd.X(x), pd.Y(Y[i])); ctx.lineTo(pd.X(x), pd.Y(cur[0] * x + cur[1])); ctx.stroke(); }); });
      pd.fn((x) => ols.coef[0] * x + ols.intercept, { color: '--ink-3', dash: [5, 4], width: 1.5 });
      pd.fn((x) => cur[0] * x + cur[1], { color: '--accent', width: 2.4 });
      X.forEach(([x], i) => pd.dot(x, Y[i], { color: '--c1', r: 4 }));
      sim.set('L', f3(Lf(cur[0], cur[1])) + ` (mínimo ${f3(lmin)})`);
      sim.set('g', `(${f3(g[0])}, ${f3(g[1])})`);
      sim.set('opt', `w = ${f3(ols.coef[0])}, b = ${f3(ols.intercept)}`);
      sim.set('k', String(path.length - 1));
    });
  });

  /* ======================================================================
     2.3 Bayes y la prueba diagnóstica
     ====================================================================== */
  ML.defineSim('bayes-prueba', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Prueba y población');
    sim.slider('prev', { label: 'Prevalencia P(enfermo)', min: 0.001, max: 0.5, value: 0.01, log: true, step: 0.001, fmt: (v) => ML.fix(100 * v, 1) + ' %' });
    sim.slider('sens', { label: 'Sensibilidad P(+ | enfermo)', min: 0.5, max: 1, value: 0.95, step: 0.005, fmt: (v) => ML.fix(100 * v, 1) + ' %' });
    sim.slider('spec', { label: 'Especificidad P(− | sano)', min: 0.5, max: 1, value: 0.95, step: 0.005, fmt: (v) => ML.fix(100 * v, 1) + ' %' });
    sim.out('ppv', 'P(enfermo | +)', { hl: true });
    sim.out('npv', 'P(sano | −)');
    sim.out('cnt', 'En 1 000 personas');
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const { prev, sens, spec } = sim.p;
      const nD = Math.round(1000 * prev), TP = Math.round(nD * sens), FN = nD - TP, nH = 1000 - nD, FP = Math.round(nH * (1 - spec)), TN = nH - FP;
      const groups = [[TP, 'tp'], [FN, 'fn'], [FP, 'fp'], [TN, 'tn']];
      const cols = 40, rows = 25, pad = 10, top = 34;
      const cw = Math.min((cv.w - 2 * pad) / cols, (cv.h - top - pad) / rows), ox = (cv.w - cw * cols) / 2;
      const ctx = cv.ctx;
      let k = 0;
      for (const [cnt, kind] of groups) for (let q = 0; q < cnt; q++, k++) {
        const r = Math.floor(k / cols), c = k % cols, x = ox + c * cw, y = top + r * cw;
        ctx.beginPath(); ctx.rect(x + 1, y + 1, cw - 2, cw - 2);
        if (kind === 'tp') { ctx.fillStyle = ML.col('--k1'); ctx.fill(); }
        else if (kind === 'fn') { ctx.lineWidth = 1.8; ctx.strokeStyle = ML.col('--k1'); ctx.stroke(); }
        else if (kind === 'fp') { ctx.fillStyle = ML.col('--k0'); ctx.fill(); }
        else { ctx.fillStyle = ML.alpha('--k0', 0.13); ctx.fill(); }
      }
      const items = [['--k1', 'enfermo y positivo', 'fill'], ['--k1', 'enfermo y negativo', 'line'], ['--k0', 'sano y positivo (falsa alarma)', 'fill'], ['--k0', 'sano y negativo', 'soft']];
      let x = ox;
      items.forEach(([c, t, st]) => { ctx.beginPath(); ctx.rect(x, 12, 12, 12); if (st === 'line') { ctx.strokeStyle = ML.col(c); ctx.lineWidth = 1.8; ctx.stroke(); } else { ctx.fillStyle = st === 'soft' ? ML.alpha(c, 0.13) : ML.col(c); ctx.fill(); } x += 16 + ML.text(ctx, t, x + 16, 22, { size: 11.5, color: '--ink-2' }) + 16; });
      const ppv = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
      const npv = (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev);
      sim.set('ppv', ML.fix(100 * ppv, 1) + ' %');
      sim.set('npv', ML.fix(100 * npv, 2) + ' %');
      sim.set('cnt', `${TP + FP} positivos, de los cuales ${TP} enfermos`);
    });
  });

  /* ======================================================================
     2.4 Máxima verosimilitud de una normal
     ====================================================================== */
  ML.defineSim('verosimilitud', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Datos');
    sim.slider('n', { label: 'Tamaño de la muestra n', min: 5, max: 300, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) });
    sim.button('Nueva muestra', () => { seed++; make(); }, { id: 'new' });
    sim.group('Modelo normal');
    sim.slider('mu', { label: 'Media μ', min: -1, max: 5, step: 0.01, value: 1, fmt: f2 });
    sim.slider('sd', { label: 'Desviación σ', min: 0.3, max: 3, step: 0.01, value: 2, fmt: f2 });
    sim.button('Ir al máximo', () => { sim.ctl.mu.set(L.stat.mean(x), true); sim.ctl.sd.set(L.stat.std(x, 0), true); }, { primary: true, id: 'mle' });
    sim.out('ll', 'log-verosimilitud actual', { hl: true });
    sim.out('llm', 'log-verosimilitud máxima');
    sim.out('mle', 'MLE: media y σ (divisor n)');
    let seed = 3, x = [];
    const make = () => { const r = L.rng(300 + seed); x = Array.from({ length: Math.round(sim.p.n) }, () => 2 + 1.2 * r.gauss()); };
    make();
    sim.onChange = (id) => { if (id === 'n') make(); };
    const ll = (mu, sd) => { let s = 0; for (const v of x) s += -0.5 * Math.log(2 * Math.PI * sd * sd) - ((v - mu) ** 2) / (2 * sd * sd); return s; };
    sim.onDraw(() => {
      ML.draw.clear(cv);
      const h1 = cv.h * 0.55;
      const hh = L.stat.hist(x, -2, 6, Math.round(ML.M.clamp(2 * Math.sqrt(x.length), 8, 32)));
      const pt = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: -2, xmax: 6, ymin: 0, ymax: Math.max(0.6, 1.08 * Math.max(...hh.dens)), xlabel: '', ylabel: 'densidad', mb: 20, title: 'datos (marcas) y normal propuesta' });
      pt.frame();
      ML.drawHist(pt, hh, { color: '--c6', alpha: 0.35 });
      pt.fn((v) => L.stat.normPDF(v, 2, 1.2), { color: '--ink-3', dash: [5, 4], width: 1.4 });
      pt.fn((v) => L.stat.normPDF(v, sim.p.mu, sim.p.sd), { color: '--c1', width: 2.4 });
      pt.clip((ctx) => { ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 1.2; for (const v of x) { ctx.beginPath(); ctx.moveTo(pt.X(v), pt.Y(0)); ctx.lineTo(pt.X(v), pt.Y(0.05)); ctx.stroke(); } });
      pt.legend([{ label: 'propuesta N(μ, σ²)', color: '--c1' }, { label: 'distribución verdadera', color: '--ink-3', dash: [5, 4] }]);
      const m = L.stat.mean(x), s0 = L.stat.std(x, 0), lmax = ll(m, s0);
      const lo = lmax - Math.max(12, 0.04 * x.length * 10);
      const pb = new ML.Plot(cv.ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: -1, xmax: 5, ymin: lo, ymax: lmax + 0.08 * (lmax - lo), xlabel: 'μ', ylabel: 'log L', title: `log-verosimilitud en función de μ con σ = ${f2(sim.p.sd)}` });
      pb.frame();
      pb.fn((mu) => ll(mu, sim.p.sd), { color: '--c3', width: 2.2 });
      pb.vline(sim.p.mu, { color: '--c1', dash: [] });
      pb.dot(m, ll(m, sim.p.sd), { color: '--c2', label: 'máximo en x̄' });
      sim.set('ll', ML.fix(ll(sim.p.mu, sim.p.sd), 2));
      sim.set('llm', ML.fix(lmax, 2));
      sim.set('mle', `${f3(m)}, ${f3(s0)}`);
    });
  });
})();
