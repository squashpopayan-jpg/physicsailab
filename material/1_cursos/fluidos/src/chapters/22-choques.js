/* Capítulo 22 — Ondas de choque y expansiones */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, CF = FL.cf, d = Math.PI / 180;

  /* 22.1 Choque normal */
  EM.defineSim('choque-normal', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('M', { label: 'Mach de llegada <i>M</i>₁', min: 1, max: 6, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.out('M2', '<i>M</i>₂', { hl: true });
    sim.out('r', '<i>p</i>₂/<i>p</i>₁ · ρ₂/ρ₁ · <i>T</i>₂/<i>T</i>₁');
    sim.out('p0', '<i>p</i>₀₂/<i>p</i>₀₁ · Δ<i>s</i> (aire)');
    sim.out('pit', 'Pitot supersónico <i>p</i>₀₂/<i>p</i>₁ (Rayleigh)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 6, ymin: 0.05, ymax: 50, ylog: true, xlabel: 'M₁', ylabel: 'cociente a través del choque' });
      pl.frame();
      const C = [['p21', '--c2', 'p₂/p₁'], ['r21', '--c3', 'ρ₂/ρ₁'], ['T21', '--c4', 'T₂/T₁'], ['M2', '--c1', 'M₂'], ['p0r', '--c5', 'p₀₂/p₀₁']];
      for (const [k, col] of C) pl.fn((M) => CF.normal(M)[k], { color: col, width: 2.2, from: 1.0001 });
      pl.hline(6, { color: '--c3', label: 'límite (γ+1)/(γ−1) = 6', dash: [3, 3] });
      pl.vline(p.M, { color: '--ink-3' });
      pl.legend(C.map(([, col, n]) => ({ label: n, color: col })), 'tl');
      const n = CF.normal(p.M);
      sim.set('M2', EM.fix(n.M2, 4));
      sim.set('r', EM.fix(n.p21, 3) + ' · ' + EM.fix(n.r21, 3) + ' · ' + EM.fix(n.T21, 3));
      sim.set('p0', EM.fix(n.p0r, 4) + ' · ' + EM.fix(n.ds, 1) + ' J/(kg·K)');
      sim.set('pit', EM.fix(n.p0r * CF.p0p(p.M), 3));
    });
  });

  /* 22.2 Choque oblicuo */
  EM.defineSim('choque-oblicuo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('M', { label: 'Mach de llegada', min: 1.2, max: 8, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('th', { label: 'Semiángulo de la cuña θ', min: 0.5, max: 45, step: 0.1, value: 10, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('b', 'β débil · β fuerte', { hl: true });
    sim.out('M2', '<i>M</i>₂ · <i>p</i>₂/<i>p</i>₁ (débil)');
    sim.out('mx', 'Deflexión máxima para este Mach');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * d;
      EM.draw.clear(cv);
      const mx = CF.thetaMax(p.M), o = CF.oblique(p.M, th), os = CF.oblique(p.M, th, false);
      /* dibujo de la cuña */
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.48 - 12, h: H - 12 }, -0.4, 1.2, -0.1, 1);
      ctx.fillStyle = EM.col('--solid'); ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(1.2), v.Y(1.2 * Math.tan(th))); ctx.lineTo(v.X(1.2), v.Y(0)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(-0.4), v.Y(0)); ctx.lineTo(v.X(1.2), v.Y(0)); ctx.stroke();
      if (o) {
        const b = o.beta;
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(Math.cos(b) * 1.2), v.Y(Math.sin(b) * 1.2)); ctx.stroke();
        for (let k = 1; k <= 7; k++) {
          const y0 = k * 0.11, xs = y0 / Math.tan(b);
          if (xs > 1.2) continue;
          EM.flow.drawPath(ctx, [[-0.4, y0], [xs, y0], [1.2, y0 + (1.2 - xs) * Math.tan(th)]], v.map, { color: '--c1', width: 1.2 });
        }
      } else {
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.6; ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const y = (i / 40) * 1; const x = -0.12 - 0.25 * y * y; i ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y)); }
        ctx.stroke();
        EM.text(ctx, 'choque desprendido', v.X(0.1), v.Y(0.85), { size: 12, color: '--c2', weight: 650 });
      }
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 46, xlabel: 'β (°)', ylabel: 'θ (°)' });
      pl.frame();
      for (const M of [1.5, 2, 3, 5, 10]) pl.fn((bd) => { const t = CF.theta(M, bd * d); return t > 0 ? t / d : NaN; }, { color: '--grid-2', width: 1.2 });
      pl.fn((bd) => { const t = CF.theta(p.M, bd * d); return t > 0 ? t / d : NaN; }, { color: '--accent', width: 2.4 });
      pl.hline(p.th, { color: '--ink-3' });
      if (o) { pl.dot(o.beta / d, p.th, { color: '--c2', r: 6, label: 'débil' }); pl.dot(os.beta / d, p.th, { color: '--c5', r: 5, label: 'fuerte' }); }
      pl.dot(mx.beta / d, mx.theta / d, { color: '--ink', r: 3.5 });
      sim.set('b', o ? EM.fix(o.beta / d, 2) + '° · ' + EM.fix(os.beta / d, 2) + '°' : 'no hay solución adherida');
      sim.set('M2', o ? EM.fix(o.M2, 3) + ' · ' + EM.fix(o.p21, 3) : '—');
      sim.set('mx', EM.fix(mx.theta / d, 2) + '° (con β = ' + EM.fix(mx.beta / d, 1) + '°)');
    });
  });

  /* 22.3 Placa plana supersónica */
  EM.defineSim('prandtl-meyer', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('M', { label: 'Mach de vuelo', min: 1.2, max: 5, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Ángulo de ataque α', min: 0, max: 25, step: 0.1, value: 5, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('p', 'Presión en el extradós · intradós (en <i>p</i>∞)', { hl: true });
    sim.out('cl', '<i>C</i><sub>L</sub> · <i>C</i><sub>D</sub> (choques y expansiones)');
    sim.out('lin', '<i>C</i><sub>L</sub> · <i>C</i><sub>D</sub> (teoría lineal de Ackeret)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, M = p.M, a = p.a * d;
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, -0.6, 1.8, -0.75, 0.75);
      const sh = CF.oblique(M, a), Mu = a > 0 ? CF.Mnu(CF.nu(M) + a) : M;
      const ok = sh && CF.nu(M) + a < (Math.PI / 2) * (Math.sqrt(6) - 1);
      /* placa */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(Math.cos(a)), v.Y(-Math.sin(a))); ctx.stroke();
      for (let k = -5; k <= 5; k++) EM.draw.arrow(ctx, v.X(-0.58), v.Y(k * 0.13), v.X(-0.42), v.Y(k * 0.13), { color: '--ink-3', width: 1 });
      if (ok) {
        /* abanico de expansión en el extradós */
        const mu1 = Math.asin(1 / M), mu2 = Math.asin(1 / Mu);
        ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.2;
        for (let i = 0; i <= 6; i++) { const ang = mu1 + ((mu2 - a - mu1) * i) / 6; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(0.8 * Math.cos(ang)), v.Y(0.8 * Math.sin(ang))); ctx.stroke(); }
        /* choque en el intradós */
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(0.9 * Math.cos(sh.beta)), v.Y(-0.9 * Math.sin(sh.beta))); ctx.stroke();
        EM.text(ctx, 'expansión', v.X(0.55 * Math.cos(mu1)) + 6, v.Y(0.55 * Math.sin(mu1)), { size: 11.5, color: '--c1', halo: true });
        EM.text(ctx, 'choque', v.X(0.7 * Math.cos(sh.beta)) + 6, v.Y(-0.7 * Math.sin(sh.beta)) + 12, { size: 11.5, color: '--c2', halo: true });
      } else EM.text(ctx, 'el choque se desprende: la teoría de choques y expansiones no vale', v.X(0.6), v.Y(0.6), { size: 12, align: 'center', color: '--c2', weight: 650 });
      const pu = CF.p0p(M) / CF.p0p(Mu), plw = sh ? sh.p21 : NaN, q = 0.7 * M * M;
      const CL = ((plw - pu) * Math.cos(a)) / q, CD = ((plw - pu) * Math.sin(a)) / q, b = Math.sqrt(M * M - 1);
      sim.set('p', ok ? EM.fix(pu, 4) + ' · ' + EM.fix(plw, 4) : '—');
      sim.set('cl', ok ? EM.fix(CL, 4) + ' · ' + EM.fix(CD, 5) : '—');
      sim.set('lin', EM.fix((4 * a) / b, 4) + ' · ' + EM.fix((4 * a * a) / b, 5));
    });
  });

  /* 22.4 Tubo de choque de Sod */
  EM.defineSim('tubo-choque', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('pr', { label: 'Relación de presiones <i>p</i><sub>L</sub>/<i>p</i><sub>R</sub>', min: 1.5, max: 100, step: 0.5, value: 10, log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('rr', { label: 'Relación de densidades ρ<sub>L</sub>/ρ<sub>R</sub>', min: 0.5, max: 20, step: 0.1, value: 8, log: true, fmt: (v) => v.toFixed(1) });
    sim.seg('o', { label: 'Método numérico', options: [['2', 'HLLC + MUSCL (2.º orden)'], ['1', 'HLLC (1.er orden)']], value: '2' });
    sim.out('ps', '<i>p</i>* · <i>u</i>* (exactos)', { hl: true });
    sim.out('t', 'Tiempo');
    sim.out('e', 'Error medio de la densidad');
    let E, R;
    const reset = () => {
      const p = sim.p;
      E = new FL.Euler1D(200); E.order = +p.o;
      const WL = [1, 0, 1], WR = [1 / p.rr, 0, 1 / p.pr];
      E.setPrim((x) => (x < 0.5 ? WL : WR));
      R = FL.riemann(WL, WR);
    };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate((dt) => { const tmax = 0.2; if (E.t < tmax) { const tg = Math.min(tmax, E.t + dt * 0.08); while (E.t < tg - 1e-12) E.step(tg - E.t); } });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, t = Math.max(E.t, 1e-9);
      EM.draw.clear(cv);
      const xs = Array.from({ length: 200 }, (_, i) => (i + 0.5) / 200), prim = xs.map((_, i) => E.prim(i));
      const ex = (x) => R.sample((x - 0.5) / t);
      const rows = [['ρ', 0, '--c1', 1.1], ['u', 1, '--c3', Math.max(1, R.u * 1.3)], ['p', 2, '--c2', 1.1]];
      let err = 0;
      rows.forEach(([n, j, col, ymax], r) => {
        const pl = new EM.Plot(ctx, { x: 0, y: (H * r) / 3, w: W, h: H / 3, xmin: 0, xmax: 1, ymin: n === 'u' ? -0.1 : 0, ymax, xlabel: r === 2 ? 'x' : '', ylabel: n, mt: 6, mb: r === 2 ? 34 : 10, xticks: r === 2 ? null : [] });
        pl.frame();
        if (E.t > 0) pl.fn((x) => ex(x)[j], { color: '--ink-2', width: 1.6, n: 800 });
        for (let i = 0; i < 200; i += 2) pl.dot(xs[i], prim[i][j], { color: col, r: 2.4 });
      });
      for (let i = 0; i < 200; i++) err += Math.abs(prim[i][0] - ex(xs[i])[0]) / 200;
      sim.set('ps', EM.fix(R.p, 5) + ' · ' + EM.fix(R.u, 5));
      sim.set('t', EM.fix(E.t, 4));
      sim.set('e', E.t > 0 ? EM.sci(err, 3) : '—');
    });
  });
})();
