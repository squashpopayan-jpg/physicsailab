/* Capítulo 13 — Reflexión y transmisión */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Lanza en una cuerda un pulso gaussiano centrado en x0 que viaja hacia +x con velocidad local c(x0) */
  function launch(S, x0, w, A = 1) {
    const N = S.n, dt = S.dt(), c = Math.sqrt(S.c2[Math.round(x0 * (N - 1))]);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      S.y[i] = A * Math.exp(-(((x - x0) / w) ** 2));
      S.yp[i] = A * Math.exp(-(((x + c * dt - x0) / w) ** 2));
    }
    S.t = 0;
  }
  EM.launchPulse = launch;

  /* Dibuja el estado de una cuerda; segs: [[x0, x1, color]] para colorear tramos */
  function drawString(pl, S, segs, o = {}) {
    const N = S.n;
    for (const [a, b, col, w] of segs) {
      const xs = [], ys = [];
      for (let i = Math.round(a * (N - 1)); i <= Math.round(b * (N - 1)); i++) { xs.push(i / (N - 1)); ys.push(S.y[i]); }
      pl.xy(xs, ys, { color: col, width: w || 2.4 });
    }
  }

  /* ======================================================================
     13.1 Reflexión en extremos
     ====================================================================== */
  EM.defineSim('pulse-reflection', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.seg('end', { label: 'Extremo derecho', options: [['fixed', 'Fijo'], ['free', 'Libre'], ['open', 'Absorbente']], value: 'fixed', onInput: () => restart() });
    sim.slider('w', { label: 'Ancho del pulso', min: 0.02, max: 0.12, step: 0.005, value: 0.05, fmt: f3, onInput: () => restart() });
    sim.check('img', { label: 'Mostrar el pulso imagen', value: true });
    sim.resetButton(() => restart());
    sim.out('y', 'Desplazamiento del extremo', { hl: true });
    const S = new EM.String1D(500, { left: 'open', right: 'fixed', courant: 0.98 });
    let ymax = 0;
    const restart = () => { S.right = sim.p.end; launch(S, 0.3, sim.p.w); ymax = 0; };
    restart();
    sim.animate((dt) => { for (let i = 0; i < 5; i++) S.step(); if (S.t > 2) restart(); });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.5, ymin: -1.3, ymax: 2.3, xlabel: 'x (la cuerda termina en x = 1)', ylabel: 'y', ml: 52 });
      pl.frame();
      pl.band(1, 1.5, { color: '--ink-3', alpha: 0.08 });
      if (p.img && p.end !== 'open') {
        const sgn = p.end === 'fixed' ? -1 : 1, xc = 2 - (0.3 + S.t);
        pl.fn((x) => sgn * Math.exp(-(((x - xc) / p.w) ** 2)), { color: '--c5', width: 1.5, dash: [5, 4], n: 900 });
        pl.fn((x) => Math.exp(-(((x - 0.3 - S.t) / p.w) ** 2)), { from: 1, color: '--c1', width: 1.2, dash: [2, 3], n: 600 });
      }
      drawString(pl, S, [[0, 1, '--accent']]);
      const ye = S.y[S.n - 1];
      ymax = Math.max(ymax, Math.abs(ye));
      if (p.end === 'free') { pl.dot(1, ye, { color: '--c3', r: 6 }); }
      cv.ctx.fillStyle = EM.col('--ink-2');
      if (p.end === 'fixed') cv.ctx.fillRect(pl.X(1), pl.Y(0.3), 6, pl.Y(-0.3) - pl.Y(0.3));
      if (p.end === 'free') { cv.ctx.fillRect(pl.X(1) + 2, pl.Y(2.2), 3, pl.Y(-1.2) - pl.Y(2.2)); }
      sim.set('y', EM.fix(ye, 3) + ' (máx. ' + EM.fix(ymax, 2) + ')');
    });
  });

  /* ======================================================================
     13.2 Unión de dos cuerdas
     ====================================================================== */
  EM.defineSim('string-junction', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const ce = sim.canvas({ aspect: 4.2 });
    sim.slider('r', { label: 'Razón de densidades <i>μ</i><sub>2</sub>/<i>μ</i><sub>1</sub>', min: 0.1, max: 25, value: 4, log: true, step: 0.01, fmt: f2, onInput: () => restart() });
    sim.button('μ₂ = 4μ₁', () => sim.ctl.r.set(4));
    sim.button('μ₂ = μ₁/4', () => sim.ctl.r.set(0.25));
    sim.button('Iguales', () => sim.ctl.r.set(1));
    sim.resetButton(() => restart());
    sim.out('Z', '<i>Z</i><sub>2</sub>/<i>Z</i><sub>1</sub>');
    sim.out('r', 'Coeficiente <i>r</i> (teórico / medido)', { hl: true });
    sim.out('t', 'Coeficiente <i>τ</i> (teórico / medido)');
    sim.out('E', '<i>R</i> + 𝒯');
    const N = 800;
    const S = new EM.String1D(N, { left: 'open', right: 'open', courant: 0.95 });
    let peakR = 0, peakT = 0, frozen = null;
    const restart = () => {
      const c2 = 1 / Math.sqrt(sim.p.r);
      S.setSpeed((x) => (x < 0.4 ? 1 : c2));
      launch(S, 0.15, 0.035);
      peakR = 0; peakT = 0;
    };
    restart();
    sim.animate(() => {
      for (let i = 0; i < 4; i++) S.step();
      if (S.t > 0.34) {
        const J = Math.round(0.4 * (N - 1));
        for (let i = 0; i < J - 10; i++) if (Math.abs(S.y[i]) > Math.abs(peakR)) peakR = S.y[i];
        for (let i = J + 10; i < N; i++) if (Math.abs(S.y[i]) > Math.abs(peakT)) peakT = S.y[i];
      }
      if (S.t > 1.4) restart();
    });
    sim.onDraw(() => {
      const p = sim.p, zr = Math.sqrt(p.r), rt = (1 - zr) / (1 + zr), tt = 2 / (1 + zr);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: -1.2, ymax: 2.1, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      pl.vline(0.4, { color: '--ink-3', label: 'unión' });
      drawString(pl, S, [[0, 0.4, '--c1', 2.2], [0.4, 1, '--c2', 1.4 + Math.min(4, Math.sqrt(p.r))]]);
      pl.label(0.03, 1.9, 'cuerda 1', { color: '--c1' });
      pl.label(0.7, 1.9, 'cuerda 2', { color: '--c2' });
      /* energía a cada lado (T = 1, μ = 1/c²) */
      let E1 = 0, E2 = 0;
      const dx = 1 / (N - 1), dt = S.dt();
      for (let i = 0; i < N - 1; i++) {
        const v = (S.y[i] - S.yp[i]) / dt, s = (S.y[i + 1] - S.y[i]) / dx;
        const e = (0.5 * v * v) / S.c2[i] * dx + 0.5 * s * s * dx;
        if (i < 0.4 * (N - 1)) E1 += e; else E2 += e;
      }
      if (S.t > 0.36 && !frozen) frozen = [E1, E2];
      if (S.t < 0.05) frozen = null;
      if (frozen) [E1, E2] = frozen;
      EM.draw.clear(ce);
      const ctx = ce.ctx, W = ce.w, H = ce.h, tot = E1 + E2 || 1;
      ctx.fillStyle = EM.alpha('--c1', 0.8); ctx.fillRect(90, H * 0.22, (W - 110) * (E1 / tot), H * 0.24);
      ctx.fillStyle = EM.alpha('--c2', 0.8); ctx.fillRect(90, H * 0.56, (W - 110) * (E2 / tot), H * 0.24);
      EM.text(ctx, frozen ? 'reflejada' : 'energía en 1', 84, H * 0.34, { size: 11.5, color: '--c1', align: 'right', baseline: 'middle' });
      EM.text(ctx, frozen ? 'transmitida' : 'energía en 2', 84, H * 0.68, { size: 11.5, color: '--c2', align: 'right', baseline: 'middle' });
      sim.set('Z', EM.fix(zr, 3));
      sim.set('r', EM.fix(rt, 3) + ' / ' + (S.t > 0.45 ? EM.fix(peakR, 3) : '…'));
      sim.set('t', EM.fix(tt, 3) + ' / ' + (S.t > 0.45 ? EM.fix(peakT, 3) : '…'));
      sim.set('E', EM.fix(rt * rt, 3) + ' + ' + EM.fix(zr * tt * tt, 3) + ' = ' + EM.fix(rt * rt + zr * tt * tt, 3));
    });
  });

  /* ======================================================================
     13.3 Terminación en un amortiguador
     ====================================================================== */
  EM.defineSim('impedance-end', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('b', { label: 'Amortiguador <i>b</i>/<i>Z</i>', min: 0.02, max: 50, value: 1, log: true, step: 0.01, fmt: (v) => EM.fix(v, 2), onInput: () => restart() });
    sim.button('b = Z (acoplado)', () => sim.ctl.b.set(1));
    sim.button('b = Z/3', () => sim.ctl.b.set(1 / 3));
    sim.button('b = 3Z', () => sim.ctl.b.set(3));
    sim.resetButton(() => restart());
    sim.out('r', 'Reflexión teórica (<i>Z</i> − <i>b</i>)/(<i>Z</i> + <i>b</i>)', { hl: true });
    sim.out('m', 'Reflexión medida');
    sim.out('R', 'Potencia reflejada');
    const S = new EM.String1D(500, { left: 'open', right: 'damper', courant: 0.98 });
    let peak = 0;
    const restart = () => { S.rb = sim.p.b; launch(S, 0.3, 0.05); peak = 0; };
    restart();
    sim.animate(() => {
      for (let i = 0; i < 5; i++) S.step();
      if (S.t > 0.95) for (let i = 0; i < S.n - 20; i++) if (Math.abs(S.y[i]) > Math.abs(peak)) peak = S.y[i];
      if (S.t > 1.8) restart();
    });
    sim.onDraw(() => {
      const p = sim.p, r = (1 - p.b) / (1 + p.b);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.1, ymin: -1.2, ymax: 1.3, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      drawString(pl, S, [[0, 1, '--accent']]);
      const ctx = cv.ctx, ye = S.y[S.n - 1];
      EM.draw.damper(ctx, pl.X(1.06), pl.Y(-1.1), pl.X(1.06), pl.Y(ye) + 8, { w: 7 });
      ctx.fillStyle = EM.col('--c3'); ctx.fillRect(pl.X(1) - 2, pl.Y(ye) - 6, pl.X(1.06) - pl.X(1) + 8, 12);
      sim.set('r', EM.fix(r, 3));
      sim.set('m', S.t > 1.05 ? EM.fix(peak, 3) : '…');
      sim.set('R', EM.fix(100 * r * r, 1) + ' %');
    });
  });

  /* ======================================================================
     13.4 Acoplador de cuarto de onda
     ====================================================================== */
  EM.defineSim('quarter-wave', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1.15 });
    const cp = sim.canvas({ aspect: 1.15 });
    sim.slider('z2', { label: '<i>Z</i><sub>2</sub>/<i>Z</i><sub>1</sub>', min: 1, max: 100, value: 9, log: true, step: 0.01, fmt: f2 });
    sim.slider('zm', { label: '<i>Z<sub>m</sub></i>/<i>Z</i><sub>1</sub> (capa)', min: 1, max: 100, value: 3, log: true, step: 0.01, fmt: f2 });
    sim.button('Z_m = √(Z₁Z₂)', () => sim.ctl.zm.set(Math.sqrt(sim.p.z2)));
    sim.slider('d', { label: 'Espesor <i>d</i>/<i>λ<sub>m</sub></i>', min: 0, max: 1, step: 0.005, value: 0.25, fmt: f3 });
    sim.out('T0', 'Transmisión sin capa');
    sim.out('T', 'Transmisión con capa', { hl: true });
    sim.out('Tbest', 'Máximo posible (<i>d</i> = <i>λ<sub>m</sub></i>/4)');
    const Tr = (z2, zm, d) => { const de = 2 * Math.PI * d; return (4 * z2) / ((1 + z2) ** 2 * Math.cos(de) ** 2 + (zm + z2 / zm) ** 2 * Math.sin(de) ** 2); };
    sim.onDraw(() => {
      const p = sim.p;
      const T = Tr(p.z2, p.zm, p.d), T0 = (4 * p.z2) / (1 + p.z2) ** 2;
      EM.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      const xa = W * 0.4, xb = xa + Math.max(6, W * 0.3 * p.d);
      ctx.fillStyle = EM.alpha('--c1', 0.08); ctx.fillRect(0, 0, xa, H);
      ctx.fillStyle = EM.alpha('--c5', 0.08 + 0.08 * Math.log10(p.zm)); ctx.fillRect(xa, 0, xb - xa, H);
      ctx.fillStyle = EM.alpha('--c2', 0.08 + 0.1 * Math.log10(p.z2)); ctx.fillRect(xb, 0, W - xb, H);
      EM.text(ctx, 'Z₁', 14, 22, { size: 13, color: '--c1' });
      EM.text(ctx, 'capa', xa + 3, 22, { size: 11, color: '--c5' });
      EM.text(ctx, 'Z₂', W - 30, 22, { size: 13, color: '--c2' });
      const y = H * 0.45;
      EM.draw.arrow(ctx, 20, y, xa - 8, y, { color: '--accent', width: 5 });
      EM.draw.arrow(ctx, xa - 8, y + 34, xa - 8 - (xa - 40) * Math.sqrt(1 - T), y + 34, { color: '--c1', width: Math.max(1, 5 * (1 - T)) });
      EM.draw.arrow(ctx, xb + 8, y, xb + 8 + (W - xb - 30) * Math.sqrt(T), y, { color: '--c2', width: Math.max(1, 5 * T) });
      EM.text(ctx, 'incidente', 20, y - 12, { size: 11, color: '--accent' });
      EM.text(ctx, 'reflejada ' + EM.fix(100 * (1 - T), 1) + ' %', 20, y + 54, { size: 11, color: '--c1' });
      EM.text(ctx, 'transmitida ' + EM.fix(100 * T, 1) + ' %', xb + 8, y - 12, { size: 11, color: '--c2' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 'd / λ_m', ylabel: 'transmisión de potencia', ml: 52 });
      pl.frame();
      pl.hline(T0, { color: '--ink-3', label: 'sin capa' });
      pl.fn((d) => Tr(p.z2, Math.sqrt(p.z2), d), { color: '--grid-2', width: 1.3 });
      pl.fn((d) => Tr(p.z2, p.zm, d), { color: '--c1', width: 2.3 });
      pl.vline(0.25, { color: '--c3' }); pl.vline(0.75, { color: '--c3' });
      pl.dot(p.d, T, { color: '--accent', r: 6 });
      sim.set('T0', EM.fix(100 * T0, 2) + ' %');
      sim.set('T', EM.fix(100 * T, 2) + ' %');
      sim.set('Tbest', EM.fix(100 * Tr(p.z2, p.zm, 0.25), 2) + ' %');
    });
  });
})();
