/* Capítulo 21 — Las ecuaciones de Fresnel */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, C = OP.C;
  const DEG = Math.PI / 180;

  /* 21.1 Reflectancia y fase */
  EM.defineSim('fresnel', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('n1', { label: 'Índice del medio de incidencia n₁', min: 1, max: 2.5, step: 0.001, value: 1, fmt: (v) => v.toFixed(3) });
    sim.slider('n2', { label: 'Índice del segundo medio n₂', min: 1, max: 2.5, step: 0.001, value: 1.5, fmt: (v) => v.toFixed(3) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 89.9, step: 0.1, value: 45, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.seg('q', { label: 'Mostrar', options: [['R', 'Reflectancias'], ['ph', 'Fases de r']], value: 'R' });
    sim.out('R', 'R_s, R_p, promedio', { hl: true });
    sim.out('T', 'T_s, T_p');
    sim.out('B', 'Brewster y crítico');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f = (t) => OP.fresnel(p.n1, p.n2, t * DEG);
      const B = OP.brewster(p.n1, p.n2) / DEG, cr = OP.critical(p.n1, p.n2) / DEG;
      if (p.q === 'R') {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 1.05, xlabel: 'ángulo de incidencia (°)', ylabel: 'reflectancia' });
        pl.frame();
        pl.fn((t) => f(t).Rs, { color: '--c1', width: 2.2, n: 900 });
        pl.fn((t) => f(t).Rp, { color: '--c2', width: 2.2, n: 900 });
        pl.fn((t) => f(t).R, { color: '--ink-3', width: 1.4, dash: [5, 4], n: 900 });
        pl.vline(B, { color: '--c2', label: 'Brewster ' + EM.fix(B, 1) + '°', labelY: 14 });
        if (isFinite(cr)) pl.vline(cr, { color: '--ink-2', label: 'crítico ' + EM.fix(cr, 1) + '°', labelY: 30 });
        pl.vline(p.th, { color: '--accent', dash: [] });
        pl.legend([{ label: 'R_s', color: '--c1' }, { label: 'R_p', color: '--c2' }, { label: 'luz natural', color: '--ink-3', dash: [5, 4] }], 'tl');
      } else {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 90, ymin: -Math.PI, ymax: Math.PI, xlabel: 'ángulo de incidencia (°)', ylabel: 'fase de r (rad)', yticks: [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI], yfmt: EM.piFmt });
        pl.frame();
        pl.fn((t) => C.arg(f(t).rs), { color: '--c1', width: 2.2, n: 900, breakJumps: true });
        pl.fn((t) => C.arg(f(t).rp), { color: '--c2', width: 2.2, n: 900, breakJumps: true });
        pl.vline(p.th, { color: '--accent', dash: [] });
        pl.legend([{ label: 'arg r_s', color: '--c1' }, { label: 'arg r_p', color: '--c2' }], 'tl');
      }
      const v = f(p.th);
      const tir = p.n1 * Math.sin(p.th * DEG) > p.n2;
      sim.set('R', EM.fix(v.Rs, 4) + ', ' + EM.fix(v.Rp, 4) + ', ' + EM.fix(v.R, 4));
      sim.set('T', tir ? '0 (reflexión total)' : EM.fix(v.Ts, 4) + ', ' + EM.fix(v.Tp, 4));
      sim.set('B', EM.fix(B, 2) + '°' + (isFinite(cr) ? ', ' + EM.fix(cr, 2) + '°' : ', no hay ángulo crítico'));
    });
  });

  /* 21.2 Pila de placas */
  EM.defineSim('pila-placas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('m', { label: 'Número de placas', min: 1, max: 30, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 85, step: 0.1, value: 56.3, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('n', { label: 'Índice del vidrio', min: 1.3, max: 1.9, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.out('P', 'Grado de polarización de la luz transmitida', { hl: true });
    sim.out('T', 'Transmisión de s y de p');
    /* Reflexiones múltiples sumadas sin coherencia (Stokes): T = (1 − R)/(1 + (2m − 1)R) para 2m superficies iguales */
    const Tstack = (R, m) => (1 - R) / (1 + (2 * m - 1) * R);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG;
      EM.draw.clear(cv);
      const f = OP.fresnel(1, p.n, th);
      const P = (m, Rs, Rp) => { const Ts = Tstack(Rs, m), Tp = Tstack(Rp, m); return (Tp - Ts) / (Tp + Ts); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 30, ymin: 0, ymax: 1.05, xlabel: 'número de placas', ylabel: 'grado de polarización' });
      pl.frame();
      pl.fn((m) => P(m, f.Rs, f.Rp), { color: '--accent', width: 2.2 });
      const fb = OP.fresnel(1, p.n, OP.brewster(1, p.n));
      pl.fn((m) => P(m, fb.Rs, 0), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.dot(p.m, P(p.m, f.Rs, f.Rp), { color: '--c2', r: 6 });
      pl.legend([{ label: 'ángulo elegido', color: '--accent' }, { label: 'ángulo de Brewster', color: '--ink-3', dash: [5, 4] }], 'br');
      /* dibujo de la pila */
      const v = D.view({ x: W * 0.62, y: 10, w: W * 0.36, h: H - 20 }, -1, 1, -1, 1);
      for (let i = 0; i < Math.min(p.m, 12); i++) { const x = -0.6 + (1.2 * i) / Math.max(1, Math.min(p.m, 12) - 1 || 1); ctx.save(); ctx.translate(v.X(x), v.Y(0)); ctx.rotate(-(Math.PI / 2 - th)); ctx.fillStyle = EM.alpha('--glass', 0.35); ctx.fillRect(-3, -v.sx * 0.6, 6, v.sx * 1.2); ctx.restore(); }
      D.ray(ctx, v, [[-1, 0], [1, 0]], { color: '--ray', width: 2 });
      sim.set('P', EM.fix(P(p.m, f.Rs, f.Rp), 4));
      sim.set('T', EM.fix(Tstack(f.Rs, p.m), 4) + ' y ' + EM.fix(Tstack(f.Rp, p.m), 4) + ' (ángulo de Brewster: ' + EM.fix(OP.brewster(1, p.n) / DEG, 1) + '°)');
    });
  });

  /* 21.3 Onda evanescente */
  EM.defineSim('evanescente', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 30, max: 85, step: 0.1, value: 50, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('n1', { label: 'Índice del vidrio', min: 1.3, max: 2, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.out('d', 'Profundidad de penetración δ (633 nm)', { hl: true });
    sim.out('c', 'Ángulo crítico');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    const nx = 200, ny = 120, vals = new Float32Array(nx * ny);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG, n1 = p.n1, n2 = 1, lam = 0.633;
      EM.draw.clear(cv);
      const f = OP.fresnel(n1, n2, th), k0 = (2 * Math.PI) / lam, kx = k0 * n1 * Math.sin(th), kz1 = k0 * n1 * Math.cos(th);
      const s2 = Math.pow(n1 * Math.sin(th), 2) - n2 * n2;
      const tir = s2 > 0, kap = tir ? k0 * Math.sqrt(s2) : 0, kz2 = tir ? 0 : k0 * Math.sqrt(-s2);
      const X = 6, Z = 3; /* µm */
      const wt = 2 * t;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = (i / nx) * X, z = Z / 2 - (j / ny) * Z; /* z > 0: vidrio (arriba), z < 0: aire */
        let re;
        if (z > 0) { const a = C.add(C.cis(kx * x - kz1 * z - wt), C.mul(f.rs, C.cis(kx * x + kz1 * z - wt))); re = a[0]; }
        else { const tt = C.add([1, 0], f.rs); const e = tir ? Math.exp(kap * z) : 1; const a = C.scale(C.mul(tt, C.cis(kx * x + (tir ? 0 : -kz2 * z) - wt)), e); re = a[0]; }
        vals[j * nx + i] = re / 2;
      }
      const mw = W * 0.55;
      D.paint(ctx, vals, nx, ny, { x: 0, y: 0, w: mw, h: H }, (v) => EM.cmap.diverging(Math.max(-1, Math.min(1, v))));
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(mw, H / 2); ctx.stroke();
      EM.text(ctx, 'vidrio n = ' + EM.fix(n1, 2), 8, 16, { size: 11, color: '--ink', halo: true });
      EM.text(ctx, 'aire', 8, H / 2 + 16, { size: 11, color: '--ink', halo: true });
      const cr = OP.critical(n1, n2);
      const pl = new EM.Plot(ctx, { x: mw + 8, y: 0, w: W - mw - 8, h: H, xmin: cr / DEG, xmax: 90, ymin: 0, ymax: 1000, xlabel: 'ángulo (°)', ylabel: 'δ (nm)', ml: 46 });
      pl.frame();
      pl.fn((a) => OP.evanescentDepth(n1, n2, a * DEG, 633e-9) * 1e9, { color: '--accent', width: 2.2, from: cr / DEG + 0.05 });
      if (tir) pl.dot(p.th, OP.evanescentDepth(n1, n2, th, 633e-9) * 1e9, { color: '--c2', r: 6 });
      sim.set('d', tir ? EM.fix(OP.evanescentDepth(n1, n2, th, 633e-9) * 1e9, 1) + ' nm' : 'no hay reflexión total: la luz se transmite');
      sim.set('c', EM.fix(cr / DEG, 2) + '°');
    });
  });

  /* 21.4 Reflexión total frustrada */
  EM.defineSim('ftir', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('g', { label: 'Ancho del hueco de aire', min: 0, max: 1000, step: 1, value: 100, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 42, max: 80, step: 0.1, value: 45, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('T', 'Transmisión s / p / natural', { hl: true });
    sim.out('d', 'Profundidad de penetración δ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG, n = 1.5168, lam = 633;
      EM.draw.clear(cv);
      const T = (g, pol) => OP.tmm(pol, [n, 1, n], [Infinity, g, Infinity], th, lam).T;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 1000, ymin: 0, ymax: 1.05, xlabel: 'ancho del hueco (nm)', ylabel: 'transmisión' });
      pl.frame();
      pl.fn((g) => T(g, 's'), { color: '--c1', width: 2 });
      pl.fn((g) => T(g, 'p'), { color: '--c2', width: 2 });
      const dpen = OP.evanescentDepth(n, 1, th, lam * 1e-9) * 1e9;
      pl.fn((g) => Math.exp(-2 * g / dpen), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.vline(p.g, { color: '--accent', dash: [] });
      pl.legend([{ label: 's', color: '--c1' }, { label: 'p', color: '--c2' }, { label: 'e^{−2d/δ}', color: '--ink-3', dash: [5, 4] }], 'tr');
      /* prismas */
      const v = D.view({ x: W * 0.64, y: 10, w: W * 0.34, h: H - 20 }, -1.1, 1.1, -1.1, 1.1);
      const gap = 0.04 + (0.5 * p.g) / 1000;
      ctx.fillStyle = EM.alpha('--glass', 0.35);
      ctx.beginPath(); ctx.moveTo(...v.map([-1, -1])); ctx.lineTo(...v.map([1 - gap, 1])); ctx.lineTo(...v.map([-1, 1])); ctx.fill();
      ctx.beginPath(); ctx.moveTo(...v.map([-1 + gap, -1])); ctx.lineTo(...v.map([1, -1])); ctx.lineTo(...v.map([1, 1])); ctx.fill();
      const Tn = 0.5 * (T(p.g, 's') + T(p.g, 'p'));
      D.ray(ctx, v, [[-1.1, -0.0], [-gap / 2, 0], [-1, 1.1 - 0.1]], { color: '--ray', width: 2, alpha: 1 });
      D.ray(ctx, v, [[gap / 2, 0], [1.1, 0]], { color: '--ray', width: 2, alpha: Math.max(0.05, Tn), arrow: false });
      sim.set('T', EM.fix(T(p.g, 's'), 4) + ' / ' + EM.fix(T(p.g, 'p'), 4) + ' / ' + EM.fix(Tn, 4));
      sim.set('d', EM.fix(dpen, 1) + ' nm');
    });
  });

  /* 21.5 Metales */
  EM.defineSim('metales', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 89, step: 0.5, value: 0, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('lam', { label: 'Longitud de onda (para el detalle)', min: 380, max: 800, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('nk', 'n + iκ a esa longitud de onda', { hl: true });
    const MS = [['Ag', '--ink-3'], ['Al', '--c1'], ['Au', '--gold'], ['Cu', '--c4']];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.72, h: H, xmin: 380, xmax: 800, ymin: 0, ymax: 1.02, xlabel: 'λ (nm)', ylabel: 'reflectancia (luz natural)' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 4 }, 380, 800);
      pl.frame();
      for (const [m, c] of MS) pl.fn((l) => OP.fresnel(1, OP.metal(m, l), th).R, { color: c, width: 2.2, n: 300 });
      pl.vline(p.lam, { color: '--ink-3' });
      pl.legend(MS.map(([m, c]) => ({ label: OP.METALS.data[m].name, color: c })), 'br');
      /* muestras de color */
      MS.forEach(([m], i) => {
        const xyz = OP.reflXYZ((l) => OP.fresnel(1, OP.metal(m, l), th).R), g = OP.xyz2srgb(...xyz);
        D.swatch(ctx, W * 0.75 + (i % 2) * W * 0.12, H * 0.08 + Math.floor(i / 2) * H * 0.45, W * 0.1, H * 0.3, OP.rgb255(g), OP.METALS.data[m].name);
      });
      sim.set('nk', MS.map(([m]) => { const z = OP.metal(m, p.lam); return m + ': ' + EM.fix(z[0], 3) + ' + ' + EM.fix(z[1], 3) + 'i'; }).join(' · '));
    });
  });
})();
