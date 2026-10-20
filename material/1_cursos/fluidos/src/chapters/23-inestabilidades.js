/* Capítulo 23 — Inestabilidades y convección */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, Wt = FL.water;

  /* 23.1 Rayleigh–Taylor */
  const RTF = { aguaAire: ['Agua sobre aire', 998.2, 1.2, 0.0727], mercAgua: ['Mercurio sobre agua', 13546, 998.2, 0.375], aguaAceite: ['Agua sobre aceite', 998.2, 891, 0.03], sinT: ['Sin tensión superficial (Atwood 0.8)', 9, 1, 0] };
  EM.defineSim('rayleigh-taylor', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Fluido pesado sobre fluido liviano', options: Object.entries(RTF).map(([k, v]) => [k, v[0]]), value: 'aguaAire' });
    sim.slider('lam', { label: 'Longitud de onda de la perturbación', min: 2, max: 200, step: 0.5, value: 40, unit: 'mm', log: true, fmt: (v) => v.toFixed(1) });
    sim.out('s', 'Tasa de crecimiento σ', { hl: true });
    sim.out('lc', 'Longitud de onda de corte λ<sub>c</sub> · de máximo crecimiento');
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt * 0.3; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [, r2, r1, gam] = RTF[p.f];
      EM.draw.clear(cv);
      const k = (2 * Math.PI) / (p.lam / 1000), s = FL.rtSigma(k, r1, r2, gam);
      const kc = gam > 0 ? Math.sqrt((g * (r2 - r1)) / gam) : Infinity, km = kc / Math.sqrt(3);
      const lam = p.lam / 1000, a0 = 0.004 * lam;
      let a = s > 0 ? a0 * Math.cosh(s * t) : a0 * Math.cos(Math.sqrt(Math.max(0, -((g * k * (r2 - r1) - gam * k * k * k) / (r1 + r2)))) * t);
      if (Math.abs(a) > 0.6 * lam) { t = 0; a = a0; }
      /* interfaz: dos longitudes de onda */
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.5 - 12, h: H - 12 }, 0, 2 * lam, -lam * 0.8, lam * 0.8);
      const pts = []; for (let i = 0; i <= 200; i++) { const x = (2 * lam * i) / 200, ph = k * x; pts.push([x, -a * Math.cos(ph) * (1 + 0.6 * Math.min(1, Math.abs(a) / lam) * Math.cos(ph))]); }
      EM.flow.waterFill(ctx, [v.map(0, lam * 0.8)].concat(pts.map((q) => v.map(q)), [v.map(2 * lam, lam * 0.8)]), { color: p.f === 'mercAgua' ? '--c6' : '--water', alpha: 0.5 });
      EM.flow.drawPath(ctx, pts, v.map, { color: '--ink', width: 1.6 });
      EM.text(ctx, 'pesado', 12, 22, { size: 11.5, color: '--ink', halo: true }); EM.text(ctx, 'liviano', 12, H - 14, { size: 11.5, color: '--ink', halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 1, xmax: 300, ymin: 0, ymax: Math.max(5, FL.rtSigma(Math.min(km, (2 * Math.PI) / 0.001), r1, r2, gam) * 1.2, FL.rtSigma((2 * Math.PI) / 0.001, r1, r2, gam) * 1.2), xlog: true, xlabel: 'λ (mm)', ylabel: 'σ (1/s)' });
      pl.frame();
      pl.fn((lm) => FL.rtSigma((2 * Math.PI) / (lm / 1000), r1, r2, gam), { color: '--accent', width: 2.4 });
      if (isFinite(kc)) pl.vline(((2 * Math.PI) / kc) * 1000, { color: '--c2', label: 'λ_c' });
      pl.dot(p.lam, s, { color: '--accent', r: 6 });
      sim.set('s', s > 0 ? EM.fix(s, 2) + ' s⁻¹ (se multiplica por e en ' + EM.si(1 / s, 's', 3) + ')' : 'estable: la interfaz oscila');
      sim.set('lc', isFinite(kc) ? EM.fix(((2 * Math.PI) / kc) * 1000, 2) + ' mm · ' + EM.fix(((2 * Math.PI) / km) * 1000, 2) + ' mm' : 'sin corte: crecen todas, más rápido las cortas');
    });
  });

  /* 23.2 Kelvin–Helmholtz: lámina de vórtices */
  EM.defineSim('kelvin-helmholtz', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('m', { label: 'Longitudes de onda iniciales en el periodo', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Amplitud inicial (fracción del periodo)', min: 0.002, max: 0.05, step: 0.001, value: 0.01, fmt: (v) => v.toFixed(3) });
    sim.slider('del', { label: 'Suavizado de Krasny δ', min: 0.02, max: 0.15, step: 0.005, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.out('t', 'Tiempo adimensional <i>t</i>Δ<i>U</i>/<i>L</i>', { hl: true });
    sim.out('s', 'Crecimiento lineal teórico σ = <i>k</i>Δ<i>U</i>/2');
    const N = 160;
    let X, Y, G, t;
    const reset = () => { const p = sim.p; X = []; Y = []; G = []; for (let i = 0; i < N; i++) { const x = i / N; X.push(x + p.A * Math.sin(2 * Math.PI * p.m * x)); Y.push(-p.A * Math.sin(2 * Math.PI * p.m * x)); G.push(1 / N); } t = 0; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate(() => { if (t > 3) return; for (let k = 0; k < 2; k++) { FL.vortexStep(X, Y, G, 0.01, sim.p.del, 1); t += 0.01; } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 0, y: 0, w: W, h: H }, 0, 2, -0.42, 0.42, false);
      ctx.fillStyle = EM.alpha('--c1', 0.08); ctx.fillRect(0, 0, W, H / 2);
      ctx.fillStyle = EM.alpha('--c2', 0.08); ctx.fillRect(0, H / 2, W, H / 2);
      for (const sh of [0, 1]) {
        ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6; ctx.beginPath();
        for (let i = 0; i <= N; i++) { const j = i % N, xx = X[j] + (i === N ? 1 : 0) + sh; i ? ctx.lineTo(v.X(xx), v.Y(Y[j])) : ctx.moveTo(v.X(xx), v.Y(Y[j])); }
        ctx.stroke();
      }
      EM.draw.arrow(ctx, 20, 18, 70, 18, { color: '--c1', width: 2 }); EM.text(ctx, '+ΔU/2', 76, 22, { size: 11.5, color: '--c1' });
      EM.draw.arrow(ctx, 70, H - 18, 20, H - 18, { color: '--c2', width: 2 }); EM.text(ctx, '−ΔU/2', 76, H - 14, { size: 11.5, color: '--c2' });
      sim.set('t', EM.fix(t, 2) + (t > 3 ? ' (fin)' : ''));
      sim.set('s', EM.fix(Math.PI * p.m, 3) + ' (en ΔU/L); amplitud lineal ×' + EM.fix(Math.exp(Math.PI * p.m * t), 1));
    });
  });

  /* 23.3 Plateau–Rayleigh */
  EM.defineSim('plateau-rayleigh', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Radio del chorro de agua', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.slider('x', { label: 'Número de onda adimensional <i>kR</i>', min: 0.1, max: 1.3, step: 0.005, value: 0.697, fmt: (v) => v.toFixed(3) });
    sim.out('s', 'Tasa de crecimiento σ', { hl: true });
    sim.out('lam', 'Longitud de onda · diámetro de las gotas');
    sim.out('t', 'Tiempo de ruptura estimado (ε₀ = 1 %)');
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = p.R / 1000, gam = 0.0727, rho = 998.2;
      EM.draw.clear(cv);
      const s = Math.sqrt(FL.prSigma2(p.x)) * Math.sqrt(gam / (rho * R * R * R)), lam = (2 * Math.PI * R) / p.x;
      const tb = s > 0 ? Math.log(100) / s : Infinity, tau = s > 0 ? (t * tb) / 3 : 0;
      if (s > 0 && tau > tb * 1.25) t = 0;
      const eps = s > 0 ? Math.min(1, 0.01 * Math.exp(s * tau)) : 0.01 * Math.cos(t * 3);
      const Lz = 3 * lam, v = EM.flow.view({ x: 6, y: 6, w: W * 0.55 - 12, h: H - 12 }, -1.6 * R, 1.6 * R, 0, Lz, false);
      if (eps < 1) {
        ctx.fillStyle = EM.alpha('--water', 0.55); ctx.beginPath();
        for (let i = 0; i <= 300; i++) { const z = (Lz * i) / 300, r = R * (1 + eps * Math.cos((2 * Math.PI * z) / lam)); i ? ctx.lineTo(v.X(r), v.Y(z)) : ctx.moveTo(v.X(r), v.Y(z)); }
        for (let i = 300; i >= 0; i--) { const z = (Lz * i) / 300, r = R * (1 + eps * Math.cos((2 * Math.PI * z) / lam)); ctx.lineTo(v.X(-r), v.Y(z)); }
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = EM.col('--water'); ctx.lineWidth = 1.4; ctx.stroke();
      } else {
        const rd = Math.cbrt(0.75 * R * R * lam);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = EM.alpha('--water', 0.55); ctx.beginPath(); ctx.ellipse(v.X(0), v.Y((k + 0.5) * lam), rd * v.sx, rd * v.sy, 0, 0, 7); ctx.fill(); ctx.strokeStyle = EM.col('--water'); ctx.stroke(); }
      }
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 1.3, ymin: 0, ymax: 0.4, xlabel: 'kR', ylabel: 'σ √(ρR³/γ)' });
      pl.frame();
      pl.fn((x) => Math.sqrt(FL.prSigma2(x)), { color: '--accent', width: 2.4 });
      pl.vline(0.697, { color: '--c2', label: 'máximo 0.697' }); pl.vline(1, { color: '--ink-3', label: 'λ = 2πR' });
      pl.dot(p.x, Math.sqrt(FL.prSigma2(p.x)), { color: '--accent', r: 6 });
      const dd = 2 * Math.cbrt(0.75 * R * R * lam);
      sim.set('s', s > 0 ? EM.fix(s, 2) + ' s⁻¹' : 'estable (kR ≥ 1)');
      sim.set('lam', EM.fix(lam * 1000, 2) + ' mm · ' + EM.fix(dd * 1000, 2) + ' mm');
      sim.set('t', s > 0 ? EM.si(tb, 's', 3) : '∞');
    });
  });

  /* 23.4 Rayleigh–Bénard */
  const RBF = { agua: ['Agua a 20 °C', 2.07e-4, 1.0e-6, 1.43e-7], aire: ['Aire a 20 °C', 3.41e-3, 1.51e-5, 2.13e-5], silicona: ['Aceite de silicona (100 cSt)', 9.6e-4, 1.0e-4, 1.1e-7] };
  EM.defineSim('rayleigh-benard', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Fluido', options: Object.entries(RBF).map(([k, v]) => [k, v[0]]), value: 'agua' });
    sim.slider('d', { label: 'Espesor de la capa', min: 1, max: 100, step: 0.5, value: 5, unit: 'mm', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('dT', { label: 'Diferencia de temperatura', min: 0.001, max: 50, step: 0, value: 2, unit: 'K', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('Ra', 'Número de Rayleigh', { hl: true });
    sim.out('dc', 'Δ<i>T</i> crítico (paredes rígidas)');
    sim.out('cr', 'Mínimo numérico de la curva rígida');
    const ks = EM.M.linspace(1.2, 6.5, 24), rig = [];
    sim.animate(() => { if (rig.length < ks.length) rig.push([ks[rig.length], FL.rbRa(ks[rig.length])]); });
    let crit = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [, beta, nu, kap] = RBF[p.f], d = p.d / 1000;
      EM.draw.clear(cv);
      const Ra = (g * beta * p.dT * d * d * d) / (nu * kap), conv = Ra > 1707.76;
      /* rollos */
      const v = EM.flow.view({ x: 6, y: 18, w: W * 0.5 - 12, h: H * 0.5 }, 0, 2 * 2.016, 0, 1, false);
      ctx.fillStyle = EM.col('--c2'); ctx.fillRect(v.X(0), v.Y(0), v.X(4.032) - v.X(0), 5);
      ctx.fillStyle = EM.col('--c1'); ctx.fillRect(v.X(0), v.Y(1) - 5, v.X(4.032) - v.X(0), 5);
      if (conv) {
        const nx = 120, ny = 30, psi = new Float64Array(nx * ny), T = new Float64Array(nx * ny);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = (4.032 * i) / (nx - 1), z = j / (ny - 1); psi[j * nx + i] = Math.sin(3.117 * x) * Math.sin(Math.PI * z); T[j * nx + i] = (1 - z) + 0.3 * Math.min(1, Math.log10(Ra / 1707.76 + 1)) * Math.cos(3.117 * x) * Math.sin(Math.PI * z); }
        EM.flow.paint(ctx, T, nx, ny, { x: v.X(0), y: v.Y(1), w: v.X(4.032) - v.X(0), h: v.Y(0) - v.Y(1) }, (q) => EM.cmap.diverging(2 * (q - 0.5)));
        const gm = (i, j) => [v.X((4.032 * i) / (nx - 1)), v.Y(j / (ny - 1))];
        for (const L of [-0.8, -0.5, -0.2, 0.2, 0.5, 0.8]) EM.flow.drawSegs(ctx, EM.flow.contour(psi, nx, ny, L), gm, { color: '--ink', width: 1.1 });
      } else { const nx = 2, ny = 30, T = new Float64Array(nx * ny); for (let j = 0; j < ny; j++) { T[j * nx] = T[j * nx + 1] = 1 - j / (ny - 1); } EM.flow.paint(ctx, T, nx, ny, { x: v.X(0), y: v.Y(1), w: v.X(4.032) - v.X(0), h: v.Y(0) - v.Y(1) }, (q) => EM.cmap.diverging(2 * (q - 0.5))); }
      EM.text(ctx, conv ? 'convección en rollos (modo crítico)' : 'conducción pura: el fluido está quieto', 8, 12, { size: 11.5, color: '--ink-2', halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 1, xmax: 6.5, ymin: 0, ymax: 5000, xlabel: 'k (número de onda × d)', ylabel: 'Ra' });
      pl.frame();
      pl.fn(FL.rbFree, { color: '--c3', width: 2 });
      if (rig.length > 1) pl.path(rig, { color: '--accent', width: 2.4 });
      for (const q of rig) pl.dot(q[0], q[1], { color: '--accent', r: 2.6 });
      pl.dot(Math.PI / Math.SQRT2, 657.5, { color: '--c3', r: 4, label: '657.5' });
      if (rig.length === ks.length && !crit) { let b = 0; for (let i = 1; i < rig.length; i++) if (rig[i][1] < rig[b][1]) b = i; const k0 = rig[b][0]; crit = [k0, rig[b][1]]; }
      pl.hline(Math.min(4900, Ra), { color: conv ? '--c2' : '--ink-3', label: 'Ra del caso', labelRight: true });
      pl.legend([{ label: 'paredes rígidas (disparo numérico)', color: '--accent' }, { label: 'fronteras libres (analítica)', color: '--c3' }], 'tr');
      sim.set('Ra', EM.sci(Ra, 4) + (conv ? ' > 1708: hay convección' : ' < 1708: conducción'));
      sim.set('dc', EM.sci((1707.76 * nu * kap) / (g * beta * d * d * d), 3) + ' K');
      sim.set('cr', rig.length < ks.length ? 'calculando… ' + rig.length + '/' + ks.length : 'Ra = ' + EM.fix(crit[1], 1) + ' cerca de k = ' + EM.fix(crit[0], 2) + ' (exacto 1707.76 en 3.117)');
    });
  });

  /* 23.5 Atractor de Lorenz */
  EM.defineSim('lorenz', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('r', { label: '<i>r</i> = Ra/Ra<sub>c</sub>', min: 0.5, max: 40, step: 0.1, value: 28, fmt: (v) => v.toFixed(1) });
    sim.out('d', 'Separación entre las dos trayectorias', { hl: true });
    sim.out('reg', 'Régimen');
    const s = 10, b = 8 / 3;
    let A, B, t, trA, trB, hist;
    const reset = () => { A = [1, 1, 20]; B = [1 + 1e-6, 1, 20]; t = 0; trA = []; trB = []; hist = []; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate(() => {
      const f = FL.lorenz(s, sim.p.r, b), h = 0.004;
      for (let k = 0; k < 8; k++) { A = FL.rk4(f, t, A, h); B = FL.rk4(f, t, B, h); t += h; }
      trA.push([A[0], A[2]]); trB.push([B[0], B[2]]); if (trA.length > 2500) { trA.shift(); trB.shift(); }
      const dd = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); hist.push([t, Math.log10(Math.max(1e-12, dd))]); if (t > 60) reset();
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, r = sim.p.r;
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H * 0.62 - 12 }, -25, 25, 0, 50);
      EM.flow.drawPath(ctx, trA, v.map, { color: '--accent', width: 1, alpha: 0.85 });
      EM.flow.drawPath(ctx, trB.slice(-600), v.map, { color: '--c2', width: 1.2, alpha: 0.85 });
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(A[0]), v.Y(A[2]), 4, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(B[0]), v.Y(B[2]), 4, 0, 7); ctx.fill();
      EM.text(ctx, 'proyección x–z', 10, 18, { size: 11, color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.62, w: W, h: H * 0.38, xmin: 0, xmax: 60, ymin: -7, ymax: 2, xlabel: 't', ylabel: 'log₁₀ separación', mt: 8 });
      pl.frame();
      pl.path(hist, { color: '--c5', width: 1.6 });
      pl.fn((tt) => -6 + (0.9056 * tt) / Math.LN10, { color: '--ink-3', width: 1.1, dash: [4, 4] });
      sim.set('d', EM.sci(Math.pow(10, hist.length ? hist[hist.length - 1][1] : -6), 2));
      sim.set('reg', r < 1 ? 'conducción: el estado de reposo es estable' : r < 24.74 ? 'convección estacionaria (puntos fijos estables)' : 'caos: atractor extraño');
    });
  });
})();
