/* Capítulo 9 — Efectos anarmónicos y conducción del calor */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI;

  /* 9.1 Dilatación en un pozo de Morse */
  EM.defineSim('dilatacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('kT', { label: 'k_BT/D', min: 0.005, max: 0.15, step: 0.001, value: 0.06, fmt: (v) => v.toFixed(3) });
    sim.check('harm', { label: 'Potencial armónico de igual curvatura', value: false });
    sim.out('x', '⟨x⟩ (en 1/a)', { hl: true });
    sim.out('lin', 'Aproximación 3k_BT/(4Da)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const V = p.harm ? (x) => x * x : (x) => SS.morse(x, 1, 1);
      const mean = (kT) => SS.meanX(V, kT, -3, 6); /* átomo ligado: x < 6/a */
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -1.2, xmax: 3, ymin: 0, ymax: 1.3, xlabel: 'x = r − r₀ (en 1/a)', ylabel: 'U/D' });
      pl.frame();
      pl.fn(V, { color: '--c1', width: 2.4 });
      /* distribución de Boltzmann escalada */
      const Z = L.gl((x) => Math.exp(-V(x) / p.kT), -3, 6, 64, 20);
      pl.fn((x) => (0.35 * Math.exp(-V(x) / p.kT)) / Z * Math.sqrt(p.kT) * 2, { color: '--c2', width: 1.6, fill: '--c2', fillAlpha: 0.15 });
      pl.hline(p.kT, { color: '--ink-3', label: 'k_BT', dash: [4, 4] });
      const m = mean(p.kT);
      pl.vline(m, { color: '--accent', dash: [], width: 2, label: '⟨x⟩' });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 0.15, ymin: -0.01, ymax: 0.2, xlabel: 'k_BT/D', ylabel: '⟨x⟩ (1/a)' });
      p2.frame();
      p2.fn(mean, { color: '--c1', width: 2.4, n: 80 });
      if (!p.harm) p2.fn((t) => (3 * t) / 4, { color: '--ink-3', width: 1.3, dash: [5, 4] });
      p2.dot(p.kT, m, { color: '--accent', r: 5 });
      sim.set('x', EM.fix(m, 4));
      sim.set('lin', p.harm ? '0 (sin anarmonicidad)' : EM.fix((3 * p.kT) / 4, 4));
    });
  });

  /* 9.2 Normal y umklapp */
  EM.defineSim('umklapp', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.out('t', 'Tipo de proceso', { hl: true });
    sim.out('q3', 'q₃ = q₁ + q₂ − G (unidades de π/a)');
    const q = [[0.55, 0.25], [0.6, 0.5]];
    let drag = -1;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -2.1, 2.1, -1.5, 1.5);
      sim._v = v;
      D.polygon(ctx, v, [[-1, -1], [1, -1], [1, 1], [-1, 1]], { fill: '--c3', alpha: 0.1, stroke: '--c3', width: 2 });
      for (const G of [[2, 0], [-2, 0], [0, 2], [0, -2]]) D.polygon(ctx, v, [[-1 + G[0], -1 + G[1]], [1 + G[0], -1 + G[1]], [1 + G[0], 1 + G[1]], [-1 + G[0], 1 + G[1]]], { stroke: '--grid-2', width: 1 });
      const s = [q[0][0] + q[1][0], q[0][1] + q[1][1]];
      const G = [Math.abs(s[0]) > 1 ? 2 * Math.sign(s[0]) : 0, Math.abs(s[1]) > 1 ? 2 * Math.sign(s[1]) : 0];
      const q3 = [s[0] - G[0], s[1] - G[1]];
      D.arrow(ctx, v, [0, 0], q[0], { color: '--c1', width: 2.6 });
      D.arrow(ctx, v, q[0], s, { color: '--c2', width: 2.6 });
      D.arrow(ctx, v, [0, 0], s, { color: '--ink-3', width: 1.6, dash: [5, 4] });
      const um = G[0] || G[1];
      if (um) { D.arrow(ctx, v, s, q3, { color: '--c5', width: 1.6, dash: [3, 3] }); D.arrow(ctx, v, [0, 0], q3, { color: '--accent', width: 3 }); }
      for (const [i, c] of [[0, '--c1'], [1, '--c2']]) { const tip = i ? s : q[0]; ctx.fillStyle = EM.col(c); ctx.beginPath(); ctx.arc(v.X(tip[0]), v.Y(tip[1]), 7, 0, 7); ctx.fill(); }
      EM.text(ctx, 'q₁', v.X(q[0][0] / 2) - 14, v.Y(q[0][1] / 2) - 4, { size: 14, color: '--c1', weight: 700, halo: true });
      EM.text(ctx, 'q₂', v.X((q[0][0] + s[0]) / 2) + 6, v.Y((q[0][1] + s[1]) / 2), { size: 14, color: '--c2', weight: 700, halo: true });
      if (um) EM.text(ctx, 'q₃', v.X(q3[0] / 2) + 6, v.Y(q3[1] / 2) + 14, { size: 14, color: '--accent', weight: 700, halo: true });
      EM.text(ctx, 'primera zona', v.X(-0.95), v.Y(0.92), { size: 11.5, color: '--c3' });
      EM.text(ctx, 'arrastre las puntas de las flechas', 14, H - 12, { size: 11.5, color: '--ink-3' });
      sim.set('t', um ? 'umklapp: G = (' + G.join(', ') + ')·π/a' : 'normal (G = 0)');
      sim.set('q3', '(' + EM.fix(q3[0], 2) + ', ' + EM.fix(q3[1], 2) + ')');
    });
    EM.pointer(cv, {
      down: (x, y) => {
        const v = sim._v; if (!v) return null;
        const s = [q[0][0] + q[1][0], q[0][1] + q[1][1]];
        if (Math.hypot(x - v.X(s[0]), y - v.Y(s[1])) < 14) return 1;
        if (Math.hypot(x - v.X(q[0][0]), y - v.Y(q[0][1])) < 14) return 0;
        return null;
      },
      move: (i, x, y) => {
        const v = sim._v, P = [EM.M.clamp(v.ix(x), -1, 1), EM.M.clamp(v.iy(y), -1, 1)];
        if (i === 0) q[0] = P; else q[1] = [EM.M.clamp(v.ix(x) - q[0][0], -1, 1), EM.M.clamp(v.iy(y) - q[0][1], -1, 1)];
        sim.redraw();
      },
      hover: (x, y) => { const v = sim._v; if (!v) return false; const s = [q[0][0] + q[1][0], q[0][1] + q[1][1]]; return Math.hypot(x - v.X(s[0]), y - v.Y(s[1])) < 14 || Math.hypot(x - v.X(q[0][0]), y - v.Y(q[0][1])) < 14; }
    });
  });

  /* 9.3 κ(T) de Callaway */
  EM.defineSim('kappa-T', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('L', { label: 'Tamaño de la muestra L', min: 1e-6, max: 1e-2, step: 1e-6, log: true, value: 5e-3, fmt: (v) => EM.si(v, 'm', 2) });
    sim.slider('A', { label: 'Desorden isotópico (× silicio natural)', min: 0, max: 20, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) });
    sim.slider('B', { label: 'Intensidad umklapp B (10⁻¹⁹ s/K)', min: 1, max: 8, step: 0.1, value: 3.5, fmt: (v) => v.toFixed(1) });
    sim.out('k3', 'κ a 300 K', { hl: true });
    sim.out('pk', 'Máximo');
    sim.out('l', 'Recorrido libre medio efectivo a 300 K');
    const v = 6400, th = 645, kB = SS.kB, hb = SS.hbar, A0 = 1.3e-45;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const kap = (T, A, Ls) => {
        const f = (x) => { const w = (x * kB * T) / hb; const inv = v / Ls + A * Math.pow(w, 4) + p.B * 1e-19 * w * w * T * Math.exp(-th / (3 * T)); return (Math.pow(x, 4) * Math.exp(x)) / Math.pow(Math.expm1(x), 2) / inv; };
        return (kB / (2 * PI * PI * v)) * Math.pow((kB * T) / hb, 3) * L.gl(f, 1e-6, Math.min(th / T, 60), 32, 6);
      };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 1000, xlog: true, ymin: 1, ymax: 1e5, ylog: true, xlabel: 'T (K)', ylabel: 'κ (W m⁻¹ K⁻¹)' });
      pl.frame();
      pl.fn((T) => kap(T, A0, 5e-3), { color: '--ink-3', width: 1.3, dash: [5, 4], n: 120 });
      let best = [0, 0];
      pl.fn((T) => { const k = kap(T, p.A * A0, p.L); if (k > best[1]) best = [T, k]; return k; }, { color: '--c1', width: 2.6, n: 160 });
      pl.fn((T) => (1 / 3) * 2.07e6 * v * p.L * Math.min(1, Math.pow(T / th, 3) * 77.9), { color: '--c3', width: 1.2, dash: [2, 3], to: 30, n: 60 });
      pl.dot(300, 148, { color: '--accent', r: 5, label: 'Si medido a 300 K' });
      pl.legend([{ label: 'modelo', color: '--c1' }, { label: 'silicio natural, L = 5 mm', color: '--ink-3', dash: [5, 4] }, { label: 'límite de bordes ∝ T³', color: '--c3', dash: [2, 3] }], 'tr');
      const k300 = kap(300, p.A * A0, p.L), Cv = SS.debyeC(300, th) / 12.06e-6;
      sim.set('k3', EM.fix(k300, 1) + ' W/(m·K) (Si natural medido: 148)');
      sim.set('pk', EM.sci(best[1], 3) + ' W/(m·K) hacia ' + EM.fix(best[0], 0) + ' K');
      sim.set('l', EM.si((3 * k300) / (Cv * v), 'm', 3));
    });
  });
})();
