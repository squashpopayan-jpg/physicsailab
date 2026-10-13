/* Capítulo 1 — Herramientas matemáticas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* Dibuja ejes del plano complejo centrados en (cx, cy) */
  function complexAxes(ctx, cx, cy, R, labels) {
    const lb = labels || ['Re', 'Im'];
    ctx.save();
    ctx.strokeStyle = EM.col('--grid-2');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.stroke();
    ctx.restore();
    EM.text(ctx, lb[0], cx + R - 4, cy + 14, { size: 11, color: '--ink-3', align: 'right' });
    EM.text(ctx, lb[1], cx + 6, cy - R + 12, { size: 11, color: '--ink-3' });
  }
  EM.complexAxes = complexAxes;

  /* ======================================================================
     1.2 Fórmula de Euler
     ====================================================================== */
  EM.defineSim('euler-circle', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Exponente');
    sim.slider('w', { label: 'Frecuencia angular <i>ω</i>', min: 0.2, max: 4, step: 0.05, value: 1, unit: 'rad/s', fmt: f2 });
    sim.slider('s', { label: 'Parte real <i>σ</i>', min: -0.5, max: 0.2, step: 0.01, value: 0, unit: 's⁻¹', fmt: f2 });
    sim.check('der', { label: 'Mostrar la derivada <i>dz/dt</i>', value: false });
    sim.check('sin', { label: 'Mostrar también la parte imaginaria', value: true });
    sim.resetButton(() => { t = 0; });
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('z', '<i>z</i> = e<sup>(σ+iω)t</sup>', { hl: true });
    sim.out('r', 'Módulo |<i>z</i>|');
    sim.out('th', 'Argumento <i>ωt</i> (mód 2π)');
    let t = 0;
    sim.animate((dt) => { t += dt; if (Math.exp(sim.p.s * t) < 0.02 || Math.exp(sim.p.s * t) > 3) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, w = cv.w, h = cv.h;
      EM.draw.clear(cv);
      const R = Math.min(h * 0.36, w * 0.17), cx = R * 1.35, cy = h / 2;
      complexAxes(ctx, cx, cy, R * 1.3);
      ctx.strokeStyle = EM.col('--grid-2');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
      const z = (tt) => { const r = Math.exp(p.s * tt); return [r * Math.cos(p.w * tt), r * Math.sin(p.w * tt)]; };
      /* trayectoria pasada */
      const tr = [];
      for (let k = 0; k <= 200; k++) { const tt = (t * k) / 200; const q = z(tt); tr.push([cx + q[0] * R, cy - q[1] * R]); }
      EM.draw.poly(ctx, tr, { color: '--c5', width: 1.3, alpha: 0.5 });
      const q = z(t), P = [cx + q[0] * R, cy - q[1] * R];
      EM.draw.arrow(ctx, cx, cy, P[0], P[1], { color: '--accent', width: 2.6 });
      /* proyecciones */
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0], cy); ctx.stroke();
      ctx.restore();
      if (p.der) {
        const d = [p.s * q[0] - p.w * q[1], p.s * q[1] + p.w * q[0]];
        const sc = R * 0.45;
        EM.draw.arrow(ctx, P[0], P[1], P[0] + d[0] * sc, P[1] - d[1] * sc, { color: '--c3', width: 2 });
        EM.text(ctx, 'dz/dt', P[0] + d[0] * sc + 4, P[1] - d[1] * sc - 4, { size: 12, color: '--c3', halo: true });
      }
      /* gráfica temporal */
      const x0 = cx + R * 1.5;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: w - x0, h, xmin: 0, xmax: 4 * Math.PI, ymin: -1.3, ymax: 1.3, xpi: true, xlabel: 'fase ωt (rad)', ml: 40 });
      pl.frame();
      const ph = p.w * t;
      const off = Math.max(0, ph - 4 * Math.PI);
      const fx = (u) => Math.exp((p.s * (u + off)) / p.w) * Math.cos(u + off);
      const fy = (u) => Math.exp((p.s * (u + off)) / p.w) * Math.sin(u + off);
      pl.fn(fx, { color: '--accent', width: 2, to: ph - off });
      if (p.sin) pl.fn(fy, { color: '--c1', width: 1.6, dash: [5, 3], to: ph - off });
      pl.dot(ph - off, q[0], { color: '--accent' });
      if (p.sin) pl.dot(ph - off, q[1], { color: '--c1' });
      pl.legend([{ label: 'Re z = e^{σt} cos ωt', color: '--accent' }].concat(p.sin ? [{ label: 'Im z = e^{σt} sen ωt', color: '--c1', dash: [5, 3] }] : []), 'tr');
      sim.set('t', EM.fix(t, 2) + ' s');
      sim.set('z', EM.fix(q[0], 3) + (q[1] < 0 ? ' − ' : ' + ') + EM.fix(Math.abs(q[1]), 3) + ' i');
      sim.set('r', EM.fix(Math.hypot(q[0], q[1]), 3));
      sim.set('th', EM.fix(M.wrap2pi(ph), 3) + ' rad = ' + EM.fix(M.deg(M.wrap2pi(ph)), 1) + '°');
    });
  });

  /* ======================================================================
     1.3 Suma de fasores
     ====================================================================== */
  EM.defineSim('phasor-sum', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Fasor 1');
    sim.slider('A1', { label: '<i>A</i><sub>1</sub>', min: 0, max: 2, step: 0.05, value: 1, fmt: f2 });
    sim.slider('p1', { label: '<i>φ</i><sub>1</sub>', min: -180, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Fasor 2');
    sim.slider('A2', { label: '<i>A</i><sub>2</sub>', min: 0, max: 2, step: 0.05, value: 0.8, fmt: f2 });
    sim.slider('p2', { label: '<i>φ</i><sub>2</sub>', min: -180, max: 180, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Fasor 3');
    sim.check('on3', { label: 'Incluir un tercer fasor', value: false });
    sim.slider('A3', { label: '<i>A</i><sub>3</sub>', min: 0, max: 2, step: 0.05, value: 1, fmt: f2 });
    sim.slider('p3', { label: '<i>φ</i><sub>3</sub>', min: -180, max: 180, step: 1, value: -120, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('A', 'Amplitud resultante <i>A</i>', { hl: true });
    sim.out('phi', 'Fase resultante <i>φ</i>');
    sim.out('frm', '<i>A</i>² por la fórmula de dos fasores');
    let t = 0;
    sim.animate((dt) => { t += dt * 1.2; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, w = cv.w, h = cv.h;
      EM.draw.clear(cv);
      const list = [[p.A1, p.p1, '--c1'], [p.A2, p.p2, '--c2']];
      if (p.on3) list.push([p.A3, p.p3, '--c3']);
      const R = Math.min(h * 0.2, w * 0.09), cx = w * 0.2, cy = h / 2;
      complexAxes(ctx, cx, cy, R * 3.2);
      let x = 0, y = 0;
      const pts = [];
      list.forEach(([A, ph, col]) => {
        const a = M.rad(ph) + t;
        const nx = x + A * Math.cos(a), ny = y + A * Math.sin(a);
        EM.draw.arrow(ctx, cx + x * R, cy - y * R, cx + nx * R, cy - ny * R, { color: col, width: 2.2 });
        x = nx; y = ny;
        pts.push(A * Math.cos(a));
      });
      EM.draw.arrow(ctx, cx, cy, cx + x * R, cy - y * R, { color: '--accent', width: 3 });
      ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(cx + x * R, cy - y * R); ctx.lineTo(cx + x * R, cy); ctx.stroke(); ctx.restore();
      /* señales en el tiempo */
      const x0 = w * 0.42;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: w - x0, h, xmin: 0, xmax: 4 * Math.PI, ymin: -4.2, ymax: 4.2, xpi: true, xlabel: 'ωt (rad)', ml: 40 });
      pl.frame();
      list.forEach(([A, ph, col]) => pl.fn((u) => A * Math.cos(u + M.rad(ph)), { color: col, width: 1.4, alpha: 0.8 }));
      const tot = (u) => list.reduce((s, [A, ph]) => s + A * Math.cos(u + M.rad(ph)), 0);
      pl.fn(tot, { color: '--accent', width: 2.6 });
      const u0 = M.wrap2pi(t);
      pl.vline(u0, { color: '--ink-3' });
      let X = 0, Y = 0;
      list.forEach(([A, ph]) => { X += A * Math.cos(M.rad(ph)); Y += A * Math.sin(M.rad(ph)); });
      sim.set('A', EM.fix(Math.hypot(X, Y), 3));
      sim.set('phi', Math.hypot(X, Y) < 1e-9 ? '— (amplitud nula)' : EM.fix(M.deg(Math.atan2(Y, X)), 1) + '°');
      const f2s = p.A1 * p.A1 + p.A2 * p.A2 + 2 * p.A1 * p.A2 * Math.cos(M.rad(p.p2 - p.p1));
      sim.set('frm', p.on3 ? '— (hay tres fasores)' : EM.fix(f2s, 3));
      sim.ctl.A3.show(p.on3); sim.ctl.p3.show(p.on3);
    });
  });

  /* ======================================================================
     1.4 Raíces de la ecuación característica
     ====================================================================== */
  EM.defineSim('char-roots', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 1.1 });
    const cs = sim.canvas({ aspect: 1.1 });
    sim.group('Coeficientes');
    sim.slider('g', { label: 'Coeficiente <i>γ</i>', min: -0.6, max: 6, step: 0.02, value: 0.4, unit: 's⁻¹', fmt: f2 });
    sim.slider('w2', { label: '<i>ω</i><sub>0</sub>²', min: -2, max: 4, step: 0.02, value: 1, unit: 's⁻²', fmt: f2 });
    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: '<i>x</i>(0)', min: -1, max: 1, step: 0.05, value: 1, fmt: f2 });
    sim.slider('v0', { label: '<i>ẋ</i>(0)', min: -2, max: 2, step: 0.05, value: 0, fmt: f2 });
    sim.out('s1', 'Raíz <i>s</i><sub>+</sub>', { hl: true });
    sim.out('s2', 'Raíz <i>s</i><sub>−</sub>');
    sim.out('kind', 'Comportamiento');
    sim.onDraw(() => {
      const p = sim.p;
      const disc = (p.g * p.g) / 4 - p.w2;
      let r1, r2;
      if (disc >= 0) { r1 = [-p.g / 2 + Math.sqrt(disc), 0]; r2 = [-p.g / 2 - Math.sqrt(disc), 0]; }
      else { r1 = [-p.g / 2, Math.sqrt(-disc)]; r2 = [-p.g / 2, -Math.sqrt(-disc)]; }
      /* plano s */
      EM.draw.clear(cr);
      const pl = new EM.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: -4, xmax: 2, ymin: -2.5, ymax: 2.5, xlabel: 'Re s (s⁻¹)', ylabel: 'Im s (s⁻¹)', ml: 52 });
      pl.frame();
      pl.band(0, 2, { color: '--warn-ink', alpha: 0.07 });
      pl.label(0.15, 2.2, 'inestable', { color: '--warn-ink', size: 11 });
      if (p.w2 > 0) { const R = Math.sqrt(p.w2); pl.fn((x) => Math.sqrt(Math.max(0, R * R - x * x)), { from: -R, to: 0, color: '--grid-2', width: 1, dash: [3, 3] }); pl.fn((x) => -Math.sqrt(Math.max(0, R * R - x * x)), { from: -R, to: 0, color: '--grid-2', width: 1, dash: [3, 3] }); }
      pl.dot(r1[0], r1[1], { color: '--accent', r: 6, label: 's₊' });
      pl.dot(r2[0], r2[1], { color: '--c1', r: 6, label: 's₋', dy: 14 });
      /* solución */
      let x;
      if (Math.abs(disc) < 1e-9) { const a = -p.g / 2; x = (t) => (p.x0 + (p.v0 - a * p.x0) * t) * Math.exp(a * t); }
      else if (disc > 0) { const a = r1[0], b = r2[0]; const c2 = (p.v0 - a * p.x0) / (b - a), c1 = p.x0 - c2; x = (t) => c1 * Math.exp(a * t) + c2 * Math.exp(b * t); }
      else { const a = r1[0], wd = r1[1]; x = (t) => Math.exp(a * t) * (p.x0 * Math.cos(wd * t) + ((p.v0 - a * p.x0) / wd) * Math.sin(wd * t)); }
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 20, ymin: -2, ymax: 2, xlabel: 't (s)', ylabel: 'x(t)', ml: 52 });
      ps.frame();
      ps.fn(x, { color: '--accent', width: 2.2 });
      if (disc < 0 && p.g > 0) { ps.fn((t) => Math.hypot(p.x0, (p.v0 - r1[0] * p.x0) / r1[1]) * Math.exp(r1[0] * t), { color: '--ink-3', width: 1, dash: [4, 4] }); }
      const fmt = (r) => EM.fix(r[0], 3) + (Math.abs(r[1]) < 1e-12 ? '' : (r[1] < 0 ? ' − ' : ' + ') + EM.fix(Math.abs(r[1]), 3) + ' i');
      sim.set('s1', fmt(r1) + ' s⁻¹');
      sim.set('s2', fmt(r2) + ' s⁻¹');
      let kind;
      if (Math.max(r1[0], r2[0]) > 1e-9) kind = 'crece sin límite (inestable)';
      else if (disc < 0 && Math.abs(p.g) < 1e-9) kind = 'oscila sin perder amplitud';
      else if (disc < 0) kind = 'oscilación amortiguada (subamortiguado)';
      else if (Math.abs(disc) < 1e-9) kind = 'amortiguamiento crítico';
      else kind = 'decae sin oscilar (sobreamortiguado)';
      sim.set('kind', kind);
    });
  });
})();
