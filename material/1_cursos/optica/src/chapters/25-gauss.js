/* Capítulo 25 — Haces gaussianos */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, G = OP.gb, C = OP.C;

  /* 25.1 Haz gaussiano */
  EM.defineSim('gauss', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('w0', { label: 'Cintura w₀', min: 0.05, max: 1, step: 0.005, value: 0.4, unit: 'mm', fmt: (v) => v.toFixed(3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 1600, step: 1, value: 632.8, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.seg('q', { label: 'Gráfica', options: [['w', 'w(z)'], ['R', 'R(z)'], ['g', 'Fase de Gouy']], value: 'w' });
    sim.out('zR', 'Longitud de Rayleigh', { hl: true });
    sim.out('th', 'Divergencia λ/πw₀');
    sim.out('w10', 'Radio a 10 m');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, w0 = p.w0 * 1e-3, lam = p.lam * 1e-9, zR = G.zR(w0, lam);
      EM.draw.clear(cv);
      const zmax = 3 * zR, wmax = G.w(zmax, w0, lam) * 1.15;
      const nx = 240, ny = 90, vals = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const z = -zmax + (2 * zmax * (i + 0.5)) / nx, r = wmax - (2 * wmax * (j + 0.5)) / ny, w = G.w(z, w0, lam); vals[j * nx + i] = ((w0 * w0) / (w * w)) * Math.exp((-2 * r * r) / (w * w)); }
      const r0 = { x: 6, y: 6, w: W * 0.55 - 12, h: H - 12 };
      D.paint(ctx, vals, nx, ny, r0, D.tint(OP.lambdaRGB(Math.min(700, Math.max(400, p.lam)), 1, 0.45), 0.6));
      const X = (z) => r0.x + ((z + zmax) / (2 * zmax)) * r0.w, Y = (r) => r0.y + ((wmax - r) / (2 * wmax)) * r0.h;
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
      for (const s of [1, -1]) { ctx.beginPath(); for (let i = 0; i <= 100; i++) { const z = -zmax + (2 * zmax * i) / 100; i ? ctx.lineTo(X(z), Y(s * G.w(z, w0, lam))) : ctx.moveTo(X(z), Y(s * G.w(z, w0, lam))); } ctx.stroke(); }
      ctx.setLineDash([]);
      for (const z of [-zR, zR]) { ctx.strokeStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(X(z), r0.y); ctx.lineTo(X(z), r0.y + r0.h); ctx.stroke(); }
      EM.text(ctx, '±z_R', X(zR) + 4, r0.y + 14, { size: 11, color: '#FFD24A' });
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: -zmax, xmax: zmax, ymin: p.q === 'w' ? 0 : p.q === 'R' ? -10 * zR : -Math.PI / 2, ymax: p.q === 'w' ? wmax * 1000 : p.q === 'R' ? 10 * zR : Math.PI / 2, xlabel: 'z (m)', ylabel: p.q === 'w' ? 'w (mm)' : p.q === 'R' ? 'R (m)' : 'ζ (rad)' });
      pl.frame();
      if (p.q === 'w') pl.fn((z) => G.w(z, w0, lam) * 1000, { color: '--accent', width: 2.2 });
      else if (p.q === 'R') pl.fn((z) => G.R(z, w0, lam), { color: '--accent', width: 2.2, breakJumps: true });
      else pl.fn((z) => G.gouy(z, w0, lam), { color: '--accent', width: 2.2 });
      sim.set('zR', EM.si(zR, 'm', 3));
      sim.set('th', EM.fix(G.divergence(w0, lam) * 1000, 3) + ' mrad');
      sim.set('w10', EM.si(G.w(10, w0, lam), 'm', 3));
    });
  });

  /* 25.2 Enfoque con una lente */
  EM.defineSim('enfoque', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('w0', { label: 'Cintura del haz de entrada', min: 0.05, max: 2, step: 0.01, value: 0.5, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('s', { label: 'Distancia de esa cintura a la lente', min: 0, max: 1000, step: 1, value: 200, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('f', { label: 'Focal de la lente', min: 20, max: 300, step: 1, value: 100, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.out('w', 'Nueva cintura', { hl: true });
    sim.out('z', 'Posición de la nueva cintura (desde la lente)');
    sim.out('geo', 'Imagen geométrica de la cintura (lente delgada)');
    const lam = 1064e-9;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, w0 = p.w0 * 1e-3, s = p.s * 1e-3, f = p.f * 1e-3;
      EM.draw.clear(cv);
      const q0 = G.q(0, w0, lam), qL = G.abcd(OP.M.free(s), q0), q1 = G.abcd(OP.M.lens(f), qL), r = G.fromQ(q1, lam);
      const zEnd = Math.max(r.toWaist * 1.8, f * 1.6);
      const wAt = (z) => (z <= s ? G.w(z, w0, lam) : G.fromQ(C.add(q1, [z - s, 0]), lam).w);
      const zmin = -0.05, zmax = s + zEnd, wmax = Math.max(...[0, 0.25, 0.5, 0.75, 1].map((k) => wAt(zmin + k * (zmax - zmin)))) * 1.2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: zmin * 1000, xmax: zmax * 1000, ymin: -wmax * 1000, ymax: wmax * 1000, xlabel: 'z (mm)', ylabel: 'radio del haz (mm)' });
      pl.frame();
      pl.fn((zm) => wAt(zm / 1000) * 1000, { color: '--accent', width: 2.2, n: 1200, fill: '--accent', fillAlpha: 0.12, base: 0 });
      pl.fn((zm) => -wAt(zm / 1000) * 1000, { color: '--accent', width: 2.2, n: 1200, fill: '--accent', fillAlpha: 0.12, base: 0 });
      pl.vline(p.s, { color: '--glass', dash: [], label: 'lente' });
      pl.vline(p.s + p.f, { color: '--ink-3', label: "F'", labelY: 30 });
      pl.vline(p.s + r.toWaist * 1000, { color: '--c2', label: 'cintura', labelY: 46 });
      const sgeo = s > f ? (s * f) / (s - f) : NaN;
      sim.set('w', EM.fix(r.w0 * 1e6, 2) + ' µm (z_R = ' + EM.si(r.zR, 'm', 3) + ')');
      sim.set('z', EM.fix(r.toWaist * 1000, 2) + ' mm (foco en ' + p.f + ' mm)');
      sim.set('geo', isFinite(sgeo) ? EM.fix(sgeo * 1000, 2) + ' mm' : 'virtual (s < f)');
    });
  });

  /* 25.3 Estabilidad */
  EM.defineSim('estabilidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R1', { label: 'Radio del espejo 1 (grande = plano)', min: -2, max: 5, step: 0.01, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('R2', { label: 'Radio del espejo 2', min: -2, max: 5, step: 0.01, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('L', { label: 'Longitud de la cavidad', min: 0.05, max: 2.5, step: 0.005, value: 0.5, unit: 'm', fmt: (v) => v.toFixed(3) });
    sim.button('Plano + curvo', () => { sim.ctl.R1.set(5, true); sim.ctl.R2.set(0.6, true); sim.ctl.L.set(0.5); });
    sim.out('g', 'g₁, g₂ y g₁g₂', { hl: true });
    sim.out('w', 'Cintura y radios en los espejos (633 nm)');
    sim.out('st', 'Estado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = 633e-9;
      EM.draw.clear(cv);
      const R1 = Math.abs(p.R1) < 0.02 ? 0.02 : p.R1 >= 5 ? 1e9 : p.R1, R2 = Math.abs(p.R2) < 0.02 ? 0.02 : p.R2 >= 5 ? 1e9 : p.R2;
      const cav = OP.cavity(R1, R2, p.L, lam);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: -2, xmax: 2, ymin: -2, ymax: 2, xlabel: 'g₁', ylabel: 'g₂' });
      pl.frame();
      pl.clip((c) => {
        c.fillStyle = EM.alpha('--c3', 0.22);
        for (const sgn of [1, -1]) { c.beginPath(); c.moveTo(pl.X(0), pl.Y(0)); for (let i = 0; i <= 100; i++) { const g1 = sgn * (0.01 + (2 * i) / 100); c.lineTo(pl.X(g1), pl.Y(Math.min(2.2, 1 / g1 * sgn) * sgn)); } c.lineTo(pl.X(sgn * 2), pl.Y(0)); c.closePath(); c.fill(); }
      });
      pl.fn((g1) => 1 / g1, { color: '--ink-3', width: 1, breakJumps: true });
      pl.dot(Math.max(-2, Math.min(2, cav.g1)), Math.max(-2, Math.min(2, cav.g2)), { color: cav.stable ? '--c3' : '--c2', r: 7 });
      /* modo dentro de la cavidad */
      const v = D.view({ x: W * 0.48, y: 20, w: W * 0.5, h: H - 40 }, -0.1 * p.L, 1.1 * p.L, -1, 1, false);
      const ww = cav.stable ? Math.max(cav.w1, cav.w2) * 1.3 : 1e-3;
      ctx.fillStyle = EM.col('--mirror'); ctx.fillRect(v.X(0) - 4, v.Y(0.9), 4, v.Y(-0.9) - v.Y(0.9)); ctx.fillRect(v.X(p.L), v.Y(0.9), 4, v.Y(-0.9) - v.Y(0.9));
      if (cav.stable) {
        const zw = cav.z1, w0 = cav.w0;
        for (const s of [1, -1]) { ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 100; i++) { const z = (p.L * i) / 100, w = G.w(z - zw, w0, lam); const y = v.Y((s * w) / ww); i ? ctx.lineTo(v.X(z), y) : ctx.moveTo(v.X(z), y); } ctx.stroke(); }
        ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.beginPath(); for (let i = 0; i <= 100; i++) { const z = (p.L * i) / 100; ctx.lineTo(v.X(z), v.Y(G.w(z - zw, w0, lam) / ww)); } for (let i = 100; i >= 0; i--) { const z = (p.L * i) / 100; ctx.lineTo(v.X(z), v.Y(-G.w(z - zw, w0, lam) / ww)); } ctx.fill();
      } else EM.text(ctx, 'cavidad inestable: no hay modo gaussiano', v.X(p.L / 2), v.Y(0), { size: 12, color: '--c2', align: 'center' });
      sim.set('g', EM.fix(cav.g1, 3) + ', ' + EM.fix(cav.g2, 3) + ', ' + EM.fix(cav.gg, 3));
      sim.set('w', cav.stable ? EM.fix(cav.w0 * 1e3, 3) + ' mm; ' + EM.fix(cav.w1 * 1e3, 3) + ' y ' + EM.fix(cav.w2 * 1e3, 3) + ' mm' : '—');
      sim.set('st', cav.stable ? 'estable (0 < g₁g₂ < 1)' : 'inestable o en el borde');
    });
  });

  /* 25.4 Modos transversales */
  EM.defineSim('modos-hg', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('fam', { label: 'Familia', options: [['hg', 'Hermite–Gauss TEMₘₙ'], ['lg', 'Laguerre–Gauss LGₚₗ']], value: 'hg' });
    sim.slider('a', { label: 'm (o p)', min: 0, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'n (o l)', min: 0, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('N', 'Orden N y fase de Gouy (N + 1)ζ', { hl: true });
    const N = 160, vals = new Float32Array(N * N);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      let mx = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = ((i + 0.5) / N - 0.5) * 7, y = ((j + 0.5) / N - 0.5) * 7;
        const v = p.fam === 'hg' ? OP.hgI(p.a, p.b, x, y, 1) : OP.lgI(p.a, p.b, Math.hypot(x, y), 1);
        vals[j * N + i] = v; mx = Math.max(mx, v);
      }
      const S = Math.min(H - 10, W * 0.45);
      D.paint(ctx, vals, N, N, { x: W * 0.25 - S / 2, y: (H - S) / 2, w: S, h: S }, (v) => EM.cmap.inferno(Math.pow(v / mx, 0.7)));
      /* perfil a lo largo de x */
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -3.5, xmax: 3.5, ymin: 0, ymax: 1.05, xlabel: 'x / w', ylabel: 'intensidad (y = 0)' });
      pl.frame();
      const prof = (x) => (p.fam === 'hg' ? OP.hgI(p.a, p.b, x, 0, 1) : OP.lgI(p.a, p.b, Math.abs(x), 1)) / mx;
      pl.fn(prof, { color: '--accent', width: 2.2, n: 600 });
      const Nn = p.fam === 'hg' ? p.a + p.b : 2 * p.a + p.b;
      sim.set('N', 'N = ' + Nn + ', fase de Gouy (' + (Nn + 1) + ')ζ(z)' + (p.fam === 'lg' && p.b ? ' · momento angular orbital ' + p.b + 'ħ por fotón' : ''));
    });
  });
})();
