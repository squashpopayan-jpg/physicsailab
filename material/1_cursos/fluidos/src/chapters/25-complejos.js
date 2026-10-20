/* Capítulo 25 — Fluidos complejos y biofluidos */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;

  /* 25.1 Reogramas */
  const PRE = {
    sangre: ['Sangre (Casson)', { mu: 0.0035, ty: 0.005, K: 0.01, n: 0.75 }],
    pasta: ['Pasta de dientes (Bingham)', { mu: 5, ty: 150, K: 30, n: 0.4 }],
    salsa: ['Salsa de tomate (Herschel–Bulkley)', { mu: 0.5, ty: 15, K: 8, n: 0.35 }],
    maicena: ['Maicena en agua (espesante)', { mu: 0.5, ty: 0, K: 0.05, n: 1.8 }]
  };
  EM.defineSim('reograma', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('pre', { label: 'Material de referencia', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'salsa' });
    sim.slider('n', { label: 'Índice de flujo <i>n</i>', min: 0.1, max: 2, step: 0.01, value: 0.35, fmt: (v) => v.toFixed(2) });
    sim.slider('K', { label: 'Consistencia <i>K</i>', min: 0.001, max: 100, step: 0, value: 8, unit: 'Pa·sⁿ', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.slider('ty', { label: 'Esfuerzo de fluencia τ<sub>y</sub>', min: 0, max: 200, step: 0.5, value: 15, unit: 'Pa', fmt: (v) => v.toFixed(1) });
    sim.slider('mu', { label: 'Viscosidad plástica μ<sub>p</sub> (o μ∞)', min: 0.001, max: 10, step: 0, value: 0.5, unit: 'Pa·s', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('eta', 'Viscosidad aparente a 1 s⁻¹ · 100 s⁻¹ (Herschel–Bulkley)', { hl: true });
    const load = () => { const q = PRE[sim.p.pre][1]; sim.ctl.n.set(q.n, true); sim.ctl.K.set(q.K, true); sim.ctl.ty.set(q.ty, true); sim.ctl.mu.set(q.mu, true); };
    sim.onChange = (id) => { if (id === 'pre') load(); };
    load();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = FL.rheo;
      EM.draw.clear(cv);
      const M = [['Newton (μ_p)', (g) => R.newton(g, p), '--ink-3'], ['ley de potencia', (g) => R.power(g, p), '--c1'], ['Bingham', (g) => R.bingham(g, p), '--c2'], ['Herschel–Bulkley', (g) => R.hb(g, p), '--accent'], ['Casson', (g) => R.casson(g, p), '--c5']];
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0.01, xmax: 1000, ymin: 1e-3, ymax: 1e4, xlog: true, ylog: true, xlabel: 'γ̇ (1/s)', ylabel: 'τ (Pa)' });
      p1.frame();
      for (const [, f, col] of M) p1.fn(f, { color: col, width: 2 });
      if (p.ty > 0) p1.hline(p.ty, { color: '--ink-3', label: 'τ_y' });
      p1.legend(M.map(([n, , c]) => ({ label: n, color: c })), 'tl');
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 0.01, xmax: 1000, ymin: 1e-4, ymax: 1e5, xlog: true, ylog: true, xlabel: 'γ̇ (1/s)', ylabel: 'η = τ/γ̇ (Pa·s)' });
      p2.frame();
      for (const [, f, col] of M) p2.fn((g) => f(g) / g, { color: col, width: 2 });
      sim.set('eta', EM.sci(R.hb(1, p), 3) + ' · ' + EM.sci(R.hb(100, p) / 100, 3) + ' Pa·s');
    });
  });

  /* 25.2 Perfiles no newtonianos en un tubo */
  EM.defineSim('ley-potencia-tubo', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('n', { label: 'Índice de la ley de potencia <i>n</i>', min: 0.1, max: 2, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.slider('ty', { label: 'Bingham: τ<sub>y</sub>/τ<sub>w</sub>', min: 0, max: 0.99, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.out('pl', '<i>u</i><sub>max</sub>/<i>u</i><sub>media</sub> (Newton · potencia · Bingham)', { hl: true });
    sim.out('rp', 'Radio del tapón de Bingham');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = 1, G = 2, mup = 1;
      EM.draw.clear(cv);
      const rs = EM.M.linspace(0, R, 200);
      const prof = (f) => { let q = 0; for (const r of rs) q += f(r) * 2 * Math.PI * r * (R / 200); const um = q / (Math.PI * R * R); return rs.map((r) => f(r) / um); };
      const N = prof((r) => 1 - r * r), P = prof((r) => FL.powerPipe(r, R, G, 1, p.n)), ty = p.ty * ((G * R) / 2), B = p.ty < 0.99 ? prof((r) => FL.binghamPipe(r, R, G, mup, ty)) : rs.map(() => 0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 2.5, ymin: -1, ymax: 1, xlabel: 'u / u_media', ylabel: 'r/R' });
      pl.frame();
      for (const [a, col, w] of [[N, '--ink-3', 1.6], [P, '--c1', 2.4], [B, '--accent', 2.4]]) { pl.xy(a, rs, { color: col, width: w }); pl.xy(a, rs.map((r) => -r), { color: col, width: w }); }
      const rp = Math.min(1, p.ty);
      if (rp > 0) pl.band(0, 2.5, { alpha: 0 });
      if (rp > 0) { pl.hline(rp, { color: '--accent', dash: [3, 3] }); pl.hline(-rp, { color: '--accent', dash: [3, 3] }); }
      pl.legend([{ label: 'newtoniano', color: '--ink-3' }, { label: 'ley de potencia', color: '--c1' }, { label: 'Bingham (tapón central)', color: '--accent' }], 'tr');
      sim.set('pl', '2 · ' + EM.fix(P[0], 3) + ' · ' + EM.fix(B[0], 3));
      sim.set('rp', EM.fix(rp, 3) + ' R');
    });
  });

  /* 25.3 Flujo de Womersley */
  EM.defineSim('womersley', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('al', { label: 'Número de Womersley α', min: 0.5, max: 25, step: 0.1, value: 6, fmt: (v) => v.toFixed(1) });
    sim.out('a', 'Ejemplos', { hl: true });
    sim.out('lag', 'Retraso de la velocidad en el eje respecto al gradiente');
    sim.out('e', 'Diferencia Bessel − diferencias finitas');
    let D, w, T;
    const reset = () => { const a = sim.p.al; w = a * a; T = (2 * Math.PI) / w; D = new FL.Diffusion1D(161, 1, 1, { cyl: true, src: (t) => Math.cos(w * t) }); };
    reset();
    sim.onChange = reset;
    sim.animate((dt) => { const h = T / 300, tg = D.t + dt * T * 0.35; while (D.t < tg) D.step(h); });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h, a = sim.p.al, t = D.t;
      EM.draw.clear(cv);
      const U = (s, tt) => FL.womersley(s, tt, 1, w, 1, a);
      let um = 0; for (let k = 0; k < 40; k++) um = Math.max(um, Math.abs(U(0, (k * T) / 40)));
      const rs = EM.M.linspace(0, 1, 80);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.55, h: H, xmin: -1.1, xmax: 1.1, ymin: -1, ymax: 1, xlabel: 'u / u_{max}', ylabel: 'r/R' });
      pl.frame();
      for (let k = 1; k <= 4; k++) { const tt = t - (k * T) / 16; pl.xy(rs.map((s) => U(s, tt) / um), rs, { color: '--grid-2', width: 1 }); pl.xy(rs.map((s) => U(s, tt) / um), rs.map((s) => -s), { color: '--grid-2', width: 1 }); }
      pl.xy(rs.map((s) => U(s, t) / um), rs, { color: '--accent', width: 2.6 }); pl.xy(rs.map((s) => U(s, t) / um), rs.map((s) => -s), { color: '--accent', width: 2.6 });
      let err = 0; const ready = t > 4 * T;
      for (let i = 0; i < D.n; i += 8) { pl.dot(D.u[i] / um, D.y[i], { color: '--c1', r: 2.6 }); if (ready) err = Math.max(err, Math.abs(D.u[i] - U(D.y[i], t)) / um); }
      const p2 = new EM.Plot(ctx, { x: Wc * 0.55, y: 0, w: Wc * 0.45, h: H, xmin: 0, xmax: 2, ymin: -1.1, ymax: 1.1, xlabel: 'fase (ciclos)', ylabel: 'normalizado' });
      p2.frame();
      p2.fn((c) => Math.cos(2 * Math.PI * c), { color: '--c2', width: 1.6, dash: [5, 4] });
      p2.fn((c) => U(0, c * T) / um, { color: '--accent', width: 2.2 });
      p2.vline(((t / T) % 1) + 1, { color: '--ink-3' });
      p2.legend([{ label: '−∂p/∂x', color: '--c2', dash: [5, 4] }, { label: 'u en el eje', color: '--accent' }], 'bl');
      /* desfase: fase del máximo de u(0, t) */
      let best = -Infinity, cb = 0; for (let k = 0; k < 400; k++) { const c = k / 400, v = U(0, c * T); if (v > best) { best = v; cb = c; } }
      sim.set('a', 'aorta ≈ 19 · carótida ≈ 4.5 · arteriola ≈ 0.08');
      sim.set('lag', EM.fix(cb * 360, 1) + '° (0° casi estacionario, 90° inercial)');
      sim.set('e', ready ? EM.sci(err, 2) + ' (relativa)' : 'esperando el régimen periódico');
    });
  });

  /* 25.4 Ley de Murray */
  EM.defineSim('murray', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Q', { label: 'Caudal del vaso', min: 0.1, max: 100, step: 0, value: 5, unit: 'mL/s', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.slider('s', { label: 'Fracción del caudal en la rama mayor', min: 0.5, max: 0.95, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.out('r', 'Radio óptimo', { hl: true });
    sim.out('tw', 'Esfuerzo en la pared en cada generación');
    const mu = 3.5e-3, b = 1500; /* b: costo metabólico por unidad de volumen, W/m³ (orden de magnitud) */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Q = p.Q * 1e-6;
      EM.draw.clear(cv);
      const r0 = FL.murrayR(Q, mu, b), cost = (r) => FL.murrayCost(r, Q, mu, b);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: r0 * 300, xmax: r0 * 3000, ymin: 0, ymax: cost(r0) * 4, xlabel: 'radio (mm)', ylabel: 'potencia por metro (W/m)' });
      pl.frame();
      pl.fn((rm) => (8 * mu * Q * Q) / (Math.PI * Math.pow(rm / 1000, 4)), { color: '--c1', width: 1.4, dash: [5, 4] });
      pl.fn((rm) => b * Math.PI * Math.pow(rm / 1000, 2), { color: '--c3', width: 1.4, dash: [5, 4] });
      pl.fn((rm) => cost(rm / 1000), { color: '--accent', width: 2.6 });
      pl.dot(r0 * 1000, cost(r0), { color: '--accent', r: 6, label: 'óptimo' });
      pl.legend([{ label: 'bombeo 8μQ²/πr⁴', color: '--c1', dash: [5, 4] }, { label: 'mantenimiento bπr²', color: '--c3', dash: [5, 4] }, { label: 'total', color: '--accent' }], 'tr');
      /* árbol */
      const x0 = W * 0.55, segs = [];
      const grow = (x, y, ang, r, q, gen) => { const L = 46 * Math.pow(0.82, gen), x2 = x + L * Math.cos(ang), y2 = y - L * Math.sin(ang); segs.push([x, y, x2, y2, r, q]); if (gen < 4) { grow(x2, y2, ang + 0.45, r * Math.cbrt(p.s), q * p.s, gen + 1); grow(x2, y2, ang - 0.55, r * Math.cbrt(1 - p.s), q * (1 - p.s), gen + 1); } };
      grow(x0 + 10, H / 2, 0, 9, 1, 0);
      for (const [a, b2, c, d, r] of segs) { ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = Math.max(0.8, r); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a, b2); ctx.lineTo(c, d); ctx.stroke(); }
      const tw = segs.slice(0, 5).map((sg) => (4 * mu * (sg[5] * Q)) / (Math.PI * Math.pow((sg[4] / 9) * r0, 3)));
      sim.set('r', EM.fix(r0 * 1000, 3) + ' mm (Q ∝ r³)');
      sim.set('tw', tw.map((v) => EM.fix(v, 3)).join(' · ') + ' Pa');
    });
  });
})();
