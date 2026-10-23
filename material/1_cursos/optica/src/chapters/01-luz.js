/* Capítulo 1 — La naturaleza de la luz */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DAY = 86400, YR = 365.25 * DAY;

  /* 1.1 Rømer: retraso de los eclipses de Ío */
  EM.defineSim('romer', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('t', { label: 'Tiempo desde la oposición', min: 0, max: 399, step: 1, value: 120, unit: 'días', fmt: (v) => v.toFixed(0) });
    sim.slider('c', { label: 'Velocidad de la luz supuesta', min: 1.5e8, max: 3.5e8, step: 1e6, value: OP.c, unit: 'm/s', fmt: (v) => EM.sci(v, 4) });
    sim.out('d', 'Distancia Tierra–Júpiter', { hl: true });
    sim.out('dt', 'Retraso respecto de la oposición');
    sim.out('max', 'Retraso máximo (conjunción)');
    let play = 0;
    sim.animate((dt) => { play += dt * 25; sim.ctl.t.set(Math.floor(play) % 399, true); }, { autoplay: false });
    const TJ = 11.862 * YR, aJ = 5.2026;
    const pos = (t) => {
      /* oposición en t = 0: ambos planetas alineados del mismo lado del Sol */
      const aE = (2 * Math.PI * t) / YR, aJu = (2 * Math.PI * t) / TJ;
      return { E: [Math.cos(aE), Math.sin(aE)], J: [aJ * Math.cos(aJu), aJ * Math.sin(aJu)] };
    };
    const dist = (t) => { const p = pos(t); return Math.hypot(p.J[0] - p.E[0], p.J[1] - p.E[1]); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, t = p.t * DAY;
      EM.draw.clear(cv);
      const v = D.view({ x: 8, y: 8, w: W * 0.42 - 16, h: H - 16 }, -5.8, 5.8, -5.8, 5.8);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1;
      for (const r of [1, aJ]) { ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), r * v.sx, 0, 7); ctx.stroke(); }
      const q = pos(t);
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), 7, 0, 7); ctx.fill();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(...v.map(q.E)); ctx.lineTo(...v.map(q.J)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(...v.map(q.E), 5, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--c4'); ctx.beginPath(); ctx.arc(...v.map(q.J), 7, 0, 7); ctx.fill();
      EM.text(ctx, 'Tierra', v.map(q.E)[0] + 8, v.map(q.E)[1] - 6, { size: 11, color: '--c1', halo: true });
      EM.text(ctx, 'Júpiter', v.map(q.J)[0] + (q.J[0] > 2 ? -9 : 9), v.map(q.J)[1] - 9, { size: 11, color: '--c4', halo: true, align: q.J[0] > 2 ? 'right' : 'left' });
      const d0 = dist(0), d = dist(t), del = ((d - d0) * OP.AU) / p.c;
      const pl = new EM.Plot(ctx, { x: W * 0.42, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: 399, ymin: -1, ymax: Math.max(18, (1.15 * 2 * OP.AU) / p.c / 60), xlabel: 'días desde la oposición', ylabel: 'retraso del eclipse (min)' });
      pl.frame();
      pl.fn((dd) => ((dist(dd * DAY) - d0) * OP.AU) / p.c / 60, { color: '--accent', width: 2.2 });
      if (Math.abs(p.c - OP.c) > 1e6) pl.fn((dd) => ((dist(dd * DAY) - d0) * OP.AU) / OP.c / 60, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.dot(p.t, del / 60, { color: '--c2', r: 6 });
      sim.set('d', EM.fix(d, 3) + ' UA');
      sim.set('dt', EM.fix(del, 0) + ' s = ' + EM.fix(del / 60, 2) + ' min');
      sim.set('max', EM.fix((2 * OP.AU) / p.c / 60, 2) + ' min (2 UA/c)');
    });
  });

  /* 1.2 Rueda de Fizeau */
  EM.defineSim('fizeau', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('nu', { label: 'Velocidad de giro de la rueda', min: 0, max: 60, step: 0.01, value: 6, unit: 'vueltas/s', fmt: (v) => v.toFixed(2) });
    sim.slider('N', { label: 'Número de dientes', min: 100, max: 1000, step: 10, value: 720, fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia al espejo', min: 1000, max: 12000, step: 1, value: 8633, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('T', 'Luz que regresa', { hl: true });
    sim.out('tau', 'Tiempo de ida y vuelta 2L/c');
    sim.out('ext', 'Primera extinción ν₁ = c/4NL');
    let ang = 0;
    sim.animate((dt) => { ang += dt * Math.min(sim.p.nu, 3) * 0.6; });
    const trans = (nu, N, L) => { const s = N * nu * ((2 * L) / OP.c), u = s - Math.floor(s); return Math.max(0, 1 - 2 * Math.min(u, 1 - u)); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* rueda (dientes simbólicos: 36) */
      const cx = W * 0.14, cy = H * 0.5, R = Math.min(W * 0.11, H * 0.36);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = EM.col('--solid');
      for (let k = 0; k < 36; k++) { const a = (k * 2 * Math.PI) / 36; ctx.beginPath(); ctx.arc(0, 0, R, a, a + Math.PI / 36); ctx.arc(0, 0, R * 0.82, a + Math.PI / 36, a, true); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, 7); ctx.fill();
      ctx.restore();
      const T = trans(p.nu, p.N, p.L);
      const yb = cy - R * 0.91;
      ctx.strokeStyle = 'rgba(255,190,60,0.95)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - R * 1.05, yb); ctx.lineTo(W * 0.4, yb); ctx.stroke();
      ctx.strokeStyle = `rgba(255,190,60,${0.15 + 0.8 * T})`; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(W * 0.4, yb + 6); ctx.lineTo(cx - R * 1.05, yb + 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--mirror'); ctx.fillRect(W * 0.4, yb - 18, 5, 36);
      EM.text(ctx, 'espejo a ' + EM.fix(p.L / 1000, 2) + ' km', W * 0.4 - 4, yb - 24, { size: 11, color: '--ink-2', align: 'right' });
      EM.text(ctx, 'observador', cx - R * 1.05, yb + 22, { size: 11, color: '--ink-2' });
      const nu1 = OP.c / (4 * p.N * p.L);
      const pl = new EM.Plot(ctx, { x: W * 0.44, y: 0, w: W * 0.56, h: H, xmin: 0, xmax: 60, ymin: 0, ymax: 1.08, xlabel: 'vueltas por segundo', ylabel: 'intensidad que regresa' });
      pl.frame();
      pl.fn((nu) => trans(nu, p.N, p.L), { color: '--accent', width: 2, n: 1200 });
      for (let k = 1; k < 8; k++) pl.vline((2 * k - 1) * nu1, { color: '--ink-3', dash: [3, 4] });
      pl.dot(p.nu, T, { color: '--c2', r: 6 });
      sim.set('T', EM.fix(100 * T, 1) + ' %');
      sim.set('tau', EM.fix(((2 * p.L) / OP.c) * 1e6, 2) + ' µs');
      sim.set('ext', EM.fix(nu1, 3) + ' vueltas/s');
    });
  });

  /* 1.3 Espectro electromagnético */
  EM.defineSim('espectro', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('lg', { label: 'log₁₀(λ / m)', min: -12.5, max: 3, step: 0.01, value: Math.log10(550e-9), fmt: (v) => v.toFixed(2) });
    sim.out('lam', 'Longitud de onda', { hl: true });
    sim.out('nu', 'Frecuencia');
    sim.out('E', 'Energía del fotón');
    sim.out('reg', 'Región');
    const REG = [[-14, -11, 'Rayos γ', 'núcleos radiactivos'], [-11, -8, 'Rayos X', 'tubo de rayos X, radiografía'], [-8, Math.log10(380e-9), 'Ultravioleta', 'Sol, lámpara germicida'], [Math.log10(380e-9), Math.log10(780e-9), 'Visible', 'ojo humano'], [Math.log10(780e-9), -3, 'Infrarrojo', 'cuerpo humano, fibra óptica'], [-3, 0, 'Microondas', 'horno, Wi-Fi, radar'], [0, 4, 'Radio', 'FM, AM, televisión']];
    const COL = ['--c5', '--c1', '--accent', null, '--c2', '--c4', '--c3'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = Math.pow(10, p.lg);
      EM.draw.clear(cv);
      const x0 = 30, x1 = W - 30, y0 = H * 0.18, hb = H * 0.22, lo = -12.5, hi = 3;
      const X = (l) => x0 + ((l - lo) / (hi - lo)) * (x1 - x0);
      REG.forEach((r, i) => {
        const a = X(Math.max(lo, r[0])), b = X(Math.min(hi, r[1]));
        if (COL[i]) { ctx.fillStyle = EM.alpha(COL[i], 0.22); ctx.fillRect(a, y0, b - a, hb); }
        else D.spectrumBar(ctx, { x: a, y: y0, w: b - a, h: hb }, 380, 780);
        const tw = EM.textWidth(ctx, r[2], { size: 11 });
        EM.text(ctx, r[2], (a + b) / 2, y0 - (b - a < tw + 6 && i % 2 ? 20 : 6), { size: 11, align: 'center', color: '--ink-2' });
      });
      ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1; ctx.strokeRect(x0, y0, x1 - x0, hb);
      for (let e = -12; e <= 3; e += 3) { const xx = X(e); ctx.beginPath(); ctx.moveTo(xx, y0 + hb); ctx.lineTo(xx, y0 + hb + 5); ctx.stroke(); EM.text(ctx, '10^{' + EM.minus(e) + '} m', xx, y0 + hb + 18, { size: 10.5, align: 'center', color: '--ink-3', mono: true }); }
      const mx = X(p.lg);
      EM.draw.arrow(ctx, mx, y0 + hb + 34, mx, y0 + hb + 2, { color: '--ink', width: 2 });
      /* ampliación del visible */
      const yv = H * 0.68, hv = H * 0.14, vx0 = W * 0.15, vx1 = W * 0.85;
      D.spectrumBar(ctx, { x: vx0, y: yv, w: vx1 - vx0, h: hv }, 380, 780);
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(vx0, yv, vx1 - vx0, hv);
      for (let l = 400; l <= 750; l += 50) { const xx = vx0 + ((l - 380) / 400) * (vx1 - vx0); EM.text(ctx, l + ' nm', xx, yv + hv + 14, { size: 10.5, align: 'center', color: '--ink-3', mono: true }); }
      const nm = lam * 1e9;
      if (nm >= 380 && nm <= 780) { const xx = vx0 + ((nm - 380) / 400) * (vx1 - vx0); EM.draw.arrow(ctx, xx, yv - 16, xx, yv - 1, { color: '--ink', width: 2 }); }
      ctx.setLineDash([3, 3]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(X(Math.log10(380e-9)), y0 + hb + 2); ctx.lineTo(vx0, yv); ctx.moveTo(X(Math.log10(780e-9)), y0 + hb + 2); ctx.lineTo(vx1, yv); ctx.stroke(); ctx.setLineDash([]);
      const reg = REG.find((r) => p.lg >= r[0] && p.lg < r[1]) || REG[REG.length - 1];
      const E = (OP.h * OP.c) / lam;
      sim.set('lam', EM.si(lam, 'm', 4));
      sim.set('nu', EM.si(OP.c / lam, 'Hz', 4));
      sim.set('E', EM.si(E / OP.e, 'eV', 4) + ' = ' + EM.sci(E, 3) + ' J');
      sim.set('reg', reg[2] + ' · ' + reg[3] + (nm >= 380 && nm <= 780 ? ` <span style="display:inline-block;width:1.4em;height:.9em;vertical-align:-1px;border-radius:2px;background:${D.lam(nm)}"></span>` : ''));
    });
  });

  /* 1.4 Una onda que entra en un medio */
  EM.defineSim('luz-medio', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('n', { label: 'Índice del medio <i>n</i>', min: 1, max: 2.5, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('lam', { label: 'Longitud de onda en el vacío λ₀', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('l', 'Longitud de onda en el medio', { hl: true });
    sim.out('v', 'Velocidad de fase');
    sim.out('f', 'Frecuencia (igual a ambos lados)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.resetButton(() => { t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const xm = W * 0.45, Lpx = 70 * (p.lam / 633), k0 = (2 * Math.PI) / Lpx, sp = 60; /* px/s en el vacío */
      ctx.fillStyle = EM.alpha('--glass', 0.12 + 0.2 * (p.n - 1)); ctx.fillRect(xm, 0, W - xm, H);
      EM.text(ctx, 'vacío', 14, 18, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'medio, n = ' + EM.fix(p.n, 2), xm + 10, 18, { size: 12, color: '--ink-2' });
      const col = D.lamRay(p.lam), y0 = H * 0.5, A = H * 0.22;
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const ph = x < xm ? k0 * x - k0 * sp * t : k0 * xm + p.n * k0 * (x - xm) - k0 * sp * t;
        const amp = x < xm ? A : A * (2 / (1 + p.n)); /* transmisión de Fresnel a incidencia normal */
        const y = y0 - amp * Math.cos(ph);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      /* marcadores que salen juntos */
      const Tloop = (W - 20) / sp, tt = t % Tloop;
      const xa = 10 + sp * tt, xb = 10 + (10 + sp * tt < xm ? sp * tt : xm - 10 + (sp * tt - (xm - 10)) / p.n);
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(xa, H * 0.88, 6, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(Math.min(xb, W - 6), H * 0.94, 6, 0, 7); ctx.fill();
      EM.text(ctx, 'en el vacío', Math.min(xa + 9, W - 70), H * 0.88 + 4, { size: 10.5, color: '--c1', halo: true });
      EM.text(ctx, 'en el medio', Math.min(xb + 9, W - 70), H * 0.94 + 4, { size: 10.5, color: '--c2', halo: true });
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xm, 0); ctx.lineTo(xm, H); ctx.stroke(); ctx.setLineDash([]);
      sim.set('l', EM.fix(p.lam / p.n, 1) + ' nm');
      sim.set('v', EM.sci(OP.c / p.n, 4) + ' m/s');
      sim.set('f', EM.sci(OP.c / (p.lam * 1e-9), 4) + ' Hz');
    });
  });
})();
