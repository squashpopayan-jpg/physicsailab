/* Capítulo 21 — Flujo compresible unidimensional */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, CF = FL.cf;

  /* 21.1 Cono de Mach */
  EM.defineSim('cono-mach', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('M', { label: 'Número de Mach de la fuente', min: 0.2, max: 3, step: 0.01, value: 1.6, fmt: (v) => v.toFixed(2) });
    sim.out('mu', 'Semiángulo del cono μ = arcsen(1/<i>M</i>)', { hl: true });
    sim.out('r', 'Régimen');
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, M = p.M, c = 1;
      EM.draw.clear(cv);
      const L = 14, v = EM.flow.view({ x: 0, y: 0, w: W, h: H }, 0, L, -L / 4, L / 4);
      const per = (L * 0.85) / M, tt = t % per, xs = 0.6 + M * tt;
      ctx.strokeStyle = EM.alpha('--c1', 0.7); ctx.lineWidth = 1.2;
      for (let k = 0; k * 0.35 <= tt; k++) { const te = tt - k * 0.35, xe = 0.6 + M * te, r = c * (tt - te); ctx.beginPath(); ctx.arc(v.X(xe), v.Y(0), r * v.sx, 0, 2 * Math.PI); ctx.stroke(); }
      if (M > 1) { const mu = Math.asin(1 / M), Lt = tt * Math.sqrt(M * M - 1); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); for (const sg of [1, -1]) { ctx.moveTo(v.X(xs), v.Y(0)); ctx.lineTo(v.X(xs - Lt * Math.cos(mu)), v.Y(sg * Lt * Math.sin(mu))); } ctx.stroke(); }
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(xs), v.Y(0), 6, 0, 7); ctx.fill();
      sim.set('mu', M > 1 ? EM.fix((Math.asin(1 / M) * 180) / Math.PI, 2) + '°' : '— (no hay cono)');
      sim.set('r', M < 0.8 ? 'subsónico' : M < 1.2 ? 'transónico' : M < 5 ? 'supersónico' : 'hipersónico');
    });
  });

  /* 21.2 Tabla isentrópica */
  EM.defineSim('isentropico', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('M', { label: 'Número de Mach', min: 0.02, max: 5, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.select('k', { label: 'Gas', options: [['1.4', 'Aire, N₂, O₂ (γ = 1.4)'], ['1.667', 'Helio, argón (γ = 5/3)'], ['1.3', 'Vapor, CO₂ (γ ≈ 1.3)']], value: '1.4' });
    sim.out('T', '<i>T</i>/<i>T</i>₀ · <i>p</i>/<i>p</i>₀ · ρ/ρ₀', { hl: true });
    sim.out('A', '<i>A</i>/<i>A</i>*');
    sim.out('alt', 'Mach con la misma <i>A</i>/<i>A</i>* en la otra rama');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, k = +p.k;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 5, ymin: 0.001, ymax: 30, ylog: true, xlabel: 'M', ylabel: 'cociente' });
      pl.frame();
      pl.fn((M) => 1 / CF.T0T(M, k), { color: '--c2', width: 2 });
      pl.fn((M) => 1 / CF.p0p(M, k), { color: '--c1', width: 2 });
      pl.fn((M) => 1 / CF.r0r(M, k), { color: '--c3', width: 2 });
      pl.fn((M) => CF.AAs(M, k), { color: '--accent', width: 2.6, from: 0.05 });
      pl.vline(1, { color: '--ink-3' }); pl.vline(p.M, { color: '--ink-3', dash: [2, 3] });
      pl.legend([{ label: 'T/T₀', color: '--c2' }, { label: 'p/p₀', color: '--c1' }, { label: 'ρ/ρ₀', color: '--c3' }, { label: 'A/A*', color: '--accent' }], 'tr');
      const ar = CF.AAs(p.M, k), other = CF.MfromA(ar, p.M < 1, k);
      sim.set('T', EM.fix(1 / CF.T0T(p.M, k), 5) + ' · ' + EM.fix(1 / CF.p0p(p.M, k), 5) + ' · ' + EM.fix(1 / CF.r0r(p.M, k), 5));
      sim.set('A', EM.fix(ar, 5));
      sim.set('alt', EM.fix(other, 4));
    });
  });

  /* 21.3 Tobera de De Laval */
  EM.defineSim('laval', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('AR', { label: 'Relación de áreas <i>A</i><sub>e</sub>/<i>A</i><sub>t</sub>', min: 1.1, max: 20, step: 0.05, value: 2, log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('pb', { label: 'Contrapresión <i>p</i><sub>b</sub>/<i>p</i>₀', min: 0, max: 0.999, step: 0.001, value: 0.8, fmt: (v) => v.toFixed(3) });
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('lim', 'Presiones límite: subsónica · choque en la salida · diseño');
    sim.out('Me', 'Mach a la salida · posición del choque');
    const Ai = 3;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, AR = p.AR;
      EM.draw.clear(cv);
      const A = (x) => (x < 1 ? 1 + (Ai - 1) * Math.pow(Math.cos((Math.PI * x) / 2), 2) : 1 + (AR - 1) * Math.pow((x - 1) / 2, 1.2)); /* x ∈ [0, 3], garganta en x = 1 */
      const r = CF.nozzle(AR, p.pb), lim = CF.nozzleLimits(AR);
      const xs = EM.M.linspace(0, 3, 300), Ms = [], Ps = [];
      let xsh = null;
      if (r.regime === 'subsónico') { const Astar = AR / CF.AAs(r.Me); for (const x of xs) { const M = CF.MfromA(A(x) / Astar, false); Ms.push(M); Ps.push(1 / CF.p0p(M)); } }
      else {
        if (r.As) xsh = 1 + 2 * Math.pow((r.As - 1) / (AR - 1), 1 / 1.2);
        const p0r = r.p0r || 1, Astar2 = r.As ? r.As / CF.AAs(CF.normal(r.Ms).M2) : 1;
        for (const x of xs) {
          let M, pp;
          if (x <= 1) M = CF.MfromA(A(x), false), pp = 1 / CF.p0p(M);
          else if (xsh === null || x < xsh) M = CF.MfromA(A(x), true), pp = 1 / CF.p0p(M);
          else { M = CF.MfromA(A(x) / Astar2, false); pp = p0r / CF.p0p(M); }
          Ms.push(M); Ps.push(pp);
        }
      }
      /* dibujo de la tobera coloreada por Mach */
      const th = H * 0.36, cy = th / 2 + 4, sx = (W - 40) / 3, sy = (th * 0.45) / Math.sqrt(Math.max(Ai, AR));
      for (let i = 0; i < xs.length - 1; i++) {
        const x = xs[i], hh = Math.sqrt(A(x)) * sy, col = EM.cmap.viridis(Math.min(1, Ms[i] / Math.max(1.5, CF.MfromA(AR, true))));
        ctx.fillStyle = EM.rgbStr(col); ctx.fillRect(20 + x * sx, cy - hh, sx * (xs[1] - xs[0]) + 1, 2 * hh);
      }
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2;
      for (const sg of [-1, 1]) { ctx.beginPath(); xs.forEach((x, i) => { const yy = cy + sg * Math.sqrt(A(x)) * sy; i ? ctx.lineTo(20 + x * sx, yy) : ctx.moveTo(20 + x * sx, yy); }); ctx.stroke(); }
      if (xsh !== null && r.regime === 'choque en la tobera') { ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20 + xsh * sx, cy - Math.sqrt(A(xsh)) * sy); ctx.lineTo(20 + xsh * sx, cy + Math.sqrt(A(xsh)) * sy); ctx.stroke(); }
      const pl = new EM.Plot(ctx, { x: 0, y: th + 4, w: W, h: H - th - 4, xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(1.05, Math.max(...Ms) * 1.05), xlabel: 'posición (garganta en x = 1)', ylabel: 'M  ·  p/p₀', mt: 8 });
      pl.frame();
      pl.xy(xs, Ms, { color: '--accent', width: 2.6 });
      pl.xy(xs, Ps, { color: '--c1', width: 2.2, dash: [6, 3] });
      pl.hline(p.pb, { color: '--c2', label: 'p_b/p₀' });
      pl.legend([{ label: 'número de Mach', color: '--accent' }, { label: 'p/p₀', color: '--c1', dash: [6, 3] }], 'tl');
      sim.set('reg', r.regime + (r.choked ? ' · tobera ahogada' : ''));
      sim.set('lim', EM.fix(lim.p1, 4) + ' · ' + EM.fix(lim.p2, 4) + ' · ' + EM.fix(lim.p3, 4));
      sim.set('Me', EM.fix(Ms[Ms.length - 1], 3) + (r.As ? ' · A/A_t = ' + EM.fix(r.As, 3) + ' (M antes del choque ' + EM.fix(r.Ms, 3) + ')' : ''));
    });
  });

  /* 21.4 Fanno y Rayleigh */
  EM.defineSim('fanno-rayleigh', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('M1', { label: 'Mach a la entrada', min: 0.1, max: 4, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('fl', { label: 'Parámetro de fricción del tubo <i>fL</i>/<i>D</i>', min: 0, max: 20, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.out('fs', '<i>fL</i>*/<i>D</i> a la entrada', { hl: true });
    sim.out('M2', 'Mach a la salida');
    sim.out('p', '<i>p</i>₂/<i>p</i>₁ · <i>T</i>₂/<i>T</i>₁');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f1 = CF.fanno(p.M1).fL, sup = p.M1 > 1, f2 = f1 - p.fl;
      let M2 = null;
      if (f2 >= 0) M2 = sup ? FL.bisect((M) => CF.fanno(M).fL - f2, 1, p.M1, 1e-12) : FL.bisect((M) => CF.fanno(M).fL - f2, p.M1, 1, 1e-12);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0.1, xmax: 4, ymin: 0.01, ymax: 100, ylog: true, xlabel: 'M', ylabel: 'fL*/D (Fanno)' });
      pl.frame();
      pl.fn((M) => CF.fanno(M).fL, { color: '--accent', width: 2.4, from: 0.1 });
      pl.dot(p.M1, f1, { color: '--c1', r: 6, label: '1' });
      if (M2 !== null) pl.dot(M2, Math.max(0.0101, f2), { color: '--c2', r: 6, label: '2' });
      pl.vline(1, { color: '--ink-3' });
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 1.05, xlabel: 'M', ylabel: 'T₀/T₀* (Rayleigh)' });
      p2.frame();
      p2.fn((M) => CF.rayleigh(M).T0T0, { color: '--c5', width: 2.4 });
      p2.vline(1, { color: '--ink-3', label: 'máximo calor añadible' });
      p2.dot(p.M1, CF.rayleigh(p.M1).T0T0, { color: '--c1', r: 6 });
      sim.set('fs', EM.fix(f1, 4) + (p.fl > f1 ? ' <span class="warnv">(el tubo es más largo: se ahoga y baja el caudal)</span>' : ''));
      sim.set('M2', M2 === null ? '1 (ahogado)' : EM.fix(M2, 4));
      if (M2 !== null) { const a = CF.fanno(p.M1), b = CF.fanno(M2); sim.set('p', EM.fix(b.pp / a.pp, 4) + ' · ' + EM.fix(b.TT / a.TT, 4)); } else sim.set('p', '—');
    });
  });
})();
