/* Capítulo 28 — Ondas de espín, antiferromagnetismo y dominios */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;
  const PI = Math.PI;

  /* 28.1 Onda de espín */
  EM.defineSim('magnon-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('k', { label: 'k (π/a)', min: 0, max: 1, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.slider('th', { label: 'Ángulo de precesión', min: 5, max: 50, step: 1, value: 25, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('w', 'ħω/(4JS)', { hl: true });
    sim.out('l', 'Longitud de onda');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = p.k * PI;
      EM.draw.clear(cv);
      const w = 1 - Math.cos(k), h1 = H * 0.58, n = 16, dx = (W - 60) / (n - 1), y0 = h1 * 0.72, Lr = h1 * 0.5, th = (p.th * PI) / 180;
      const ph0 = 2 * PI * 0.35 * t * Math.max(0.15, w);
      const tips = [];
      for (let j = 0; j < n; j++) {
        const x = 30 + j * dx, ph = k * j - ph0;
        /* proyección oblicua: componente transversal en el plano (x horizontal, y en profundidad) */
        const sx = Math.sin(th) * Math.cos(ph), sy = Math.sin(th) * Math.sin(ph), sz = Math.cos(th);
        const tx = x + Lr * (sx + 0.35 * sy), ty = y0 - Lr * (sz - 0.25 * sy);
        ctx.strokeStyle = EM.alpha('--ink-3', 0.4); ctx.beginPath(); ctx.ellipse(x, y0 - Lr * Math.cos(th), Lr * Math.sin(th) * 1.05, Lr * Math.sin(th) * 0.27, 0, 0, 2 * PI); ctx.stroke();
        EM.draw.arrow(ctx, x, y0, tx, ty, { color: '--c1', width: 2.2 });
        tips.push([tx, ty]);
      }
      ctx.strokeStyle = EM.alpha('--c2', 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); tips.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      const pl = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: 1, ymin: 0, ymax: 2.1, xlabel: 'k (π/a)', ylabel: 'ħω/(4JS)' });
      pl.frame();
      pl.fn((x) => 1 - Math.cos(x * PI), { color: '--c1', width: 2.4 });
      pl.fn((x) => Math.pow(x * PI, 2) / 2, { color: '--ink-3', width: 1.2, dash: [5, 4], to: 0.6 });
      pl.dot(p.k, w, { color: '--accent', r: 5 });
      sim.set('w', EM.fix(w, 4));
      sim.set('l', p.k > 0 ? EM.fix(2 / p.k, 2) + ' a' : '∞ (precesión uniforme)');
    });
  });

  /* 28.2 Ley de Bloch */
  EM.defineSim('bloch-t32', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('Q', { label: 'Red', options: [[1, 'sc'], [2, 'bcc'], [4, 'fcc']], value: 2 });
    sim.slider('S', { label: 'Espín S', min: 0.5, max: 3.5, step: 0.5, value: 1, fmt: (v) => v.toFixed(1) });
    sim.out('d', 'ΔM/M₀ a k_BT = 0.5·2JS', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Q = +p.Q, S = p.S;
      EM.draw.clear(cv);
      /* en campo medio T_C = 2JS(S+1)z/(3k_B) con z = 6, 8, 12 */
      const z = { 1: 6, 2: 8, 4: 12 }[Q], tc = (z * (S + 1)) / 3; /* en unidades de 2JS/k_B, con S·2J·... */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.01, xmax: 1, xlog: true, ymin: 1e-6, ymax: 1, ylog: true, xlabel: 'k_BT/(2JS)', ylabel: 'ΔM/M₀' });
      pl.frame();
      pl.fn((x) => SS.blochDM(x, S, Q), { color: '--c1', width: 2.4 });
      pl.fn((x) => 1 - SS.weiss(S, x / tc), { color: '--c2', width: 2.2, n: 300 });
      pl.legend([{ label: 'ondas de espín (Bloch, ∝ T^{3/2})', color: '--c1' }, { label: 'campo medio (caída exponencial)', color: '--c2' }], 'br');
      sim.set('d', EM.sci(SS.blochDM(0.5, S, Q), 3) + ' (campo medio: ' + EM.sci(1 - SS.weiss(S, 0.5 / tc), 3) + ')');
    });
  });

  /* 28.3 Antiferromagneto */
  EM.defineSim('antiferro', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.out('perp', 'χ_⊥ por debajo de T_N', { hl: true });
    sim.out('cw', 'Curie–Weiss arriba de T_N');
    const m = (t) => (t >= 1 ? 0 : SS.weiss(0.5, t));
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const chiPar = (t) => (t >= 1 ? 1 / (t + 1) : (1 / t) * (1 - m(t) ** 2) / (1 + (1 - m(t) ** 2) / t));
      const chiPerp = (t) => (t >= 1 ? 1 / (t + 1) : 0.5);
      const wl = W * 0.55;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: 0.6, xlabel: 'T/T_N', ylabel: 'χ (unidades de C/T_N)' });
      pl.frame();
      pl.fn(chiPar, { color: '--c1', width: 2.4, n: 400 });
      pl.fn(chiPerp, { color: '--c2', width: 2.4, n: 400 });
      pl.fn((t) => chiPar(t) / 3 + (2 * chiPerp(t)) / 3, { color: '--c3', width: 1.8, dash: [5, 4], n: 400 });
      pl.legend([{ label: 'χ_∥', color: '--c1' }, { label: 'χ_⊥', color: '--c2' }, { label: 'polvo', color: '--c3', dash: [5, 4] }], 'tr');
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: -1.5, xmax: 3, ymin: 0, ymax: 5, xlabel: 'T/T_N', ylabel: '1/χ' });
      p2.frame();
      p2.fn((t) => 1 / (chiPar(t) / 3 + (2 * chiPerp(t)) / 3), { color: '--c3', width: 2.2, from: 0.05, n: 400 });
      p2.fn((t) => t + 1, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      p2.vline(-1, { color: '--ink-3', label: '−θ' });
      sim.set('perp', 'C/(2T_N), constante');
      sim.set('cw', 'χ = C/(T + θ), con θ = T_N en el modelo de dos subredes');
    });
  });

  /* 28.4 Pared de Bloch */
  EM.defineSim('pared', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('A', { label: 'Rigidez de intercambio A', min: 0.5, max: 4, step: 0.05, value: 2.1, unit: '×10⁻¹¹ J/m', fmt: (v) => v.toFixed(2) });
    sim.slider('K', { label: 'Anisotropía K', min: 1e3, max: 5e6, step: 1e3, log: true, value: 4.8e4, unit: 'J/m³', fmt: (v) => EM.sci(v, 2) });
    sim.out('d', 'Anchura π√(A/K)', { hl: true });
    sim.out('s', 'Energía por área 4√(AK)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const w = SS.wall(p.A * 1e-11, p.K), d0 = w.delta / PI * 1e9; /* nm */
      const X = Math.max(4 * w.delta * 1e9, 20);
      const h1 = H * 0.42;
      const pl = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: -X, xmax: X, ymin: 0, ymax: 180, xlabel: 'x (nm)', ylabel: 'θ (°)', yticks: [0, 45, 90, 135, 180] });
      pl.frame();
      pl.fn((x) => (2 * Math.atan(Math.exp(x / d0)) * 180) / PI, { color: '--c1', width: 2.6 });
      pl.band(-w.delta * 0.5e9, w.delta * 0.5e9, { color: '--accent', alpha: 0.1 });
      /* flechas que giran en el plano de la pared (vista superior) */
      const n = 25;
      for (let i = 0; i < n; i++) {
        const x = -X + (2 * X * (i + 0.5)) / n, th = 2 * Math.atan(Math.exp(x / d0));
        const px = pl.X(x), py = h1 / 2, Lr = h1 * 0.35;
        EM.draw.arrow(ctx, px - 0.0 * Math.sin(th) * Lr, py + Math.cos(th) * Lr * 0.9 * 0.5, px + 0.35 * Math.sin(th) * Lr, py - Math.cos(th) * Lr * 0.9 * 0.5, { color: Math.abs(x) < w.delta * 0.5e9 ? '--c2' : '--c1', width: 2 });
      }
      sim.set('d', EM.fix(w.delta * 1e9, 2) + ' nm');
      sim.set('s', EM.fix(w.sigma * 1e3, 3) + ' mJ/m²');
    });
  });

  /* 28.5 Stoner–Wohlfarth */
  EM.defineSim('stoner-wohlfarth', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('psi', { label: 'Ángulo del campo con el eje fácil ψ', min: 0, max: 89, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('hsw', 'Campo de inversión (astroide)', { hl: true });
    sim.out('hc', 'Coercitividad (m = 0)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, psi = (p.psi * PI) / 180;
      EM.draw.clear(cv);
      const loop = SS.swLoop(psi, 1.5, 800);
      const wl = W * 0.55;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -1.5, xmax: 1.5, ymin: -1.1, ymax: 1.1, xlabel: 'h = µ₀M_sH/2K', ylabel: 'm = M·ĥ/M_s' });
      pl.frame();
      pl.xy(loop.map((q) => q.h), loop.map((q) => q.m), { color: '--c1', width: 2.4 });
      const hs = SS.swSwitch(psi);
      pl.vline(-hs, { color: '--c2', label: 'h_{sw}' }); pl.vline(hs, { color: '--c2' });
      let hc = NaN;
      for (let i = 1; i < loop.length / 2; i++) if (loop[i - 1].m > 0 && loop[i].m <= 0) { hc = -loop[i].h; break; }
      /* astroide */
      const v = D.view({ x: wl + 10, y: 10, w: W - wl - 20, h: H - 20 }, -1.2, 1.2, -1.2, 1.2);
      const ast = []; for (let i = 0; i <= 200; i++) { const a = (2 * PI * i) / 200; ast.push([Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 3), Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 3)]); }
      D.polygon(ctx, v, ast, { stroke: '--c2', width: 2, fill: '--c2', alpha: 0.08 });
      ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(v.X(-1.2), v.Y(0)); ctx.lineTo(v.X(1.2), v.Y(0)); ctx.moveTo(v.X(0), v.Y(-1.2)); ctx.lineTo(v.X(0), v.Y(1.2)); ctx.stroke();
      D.arrow(ctx, v, [0, 0], [hs * Math.cos(psi), hs * Math.sin(psi)], { color: '--accent', width: 2.2 });
      EM.text(ctx, 'h_∥ (eje fácil)', v.X(1.15), v.Y(0) + 14, { size: 11, align: 'right', color: '--ink-3' });
      EM.text(ctx, 'h_⊥', v.X(0) + 6, v.Y(1.12), { size: 11, color: '--ink-3' });
      sim.set('hsw', EM.fix(hs, 4) + ' H_K');
      sim.set('hc', isFinite(hc) ? EM.fix(hc, 4) + ' H_K' : '—');
    });
  });
})();
