/* Capítulo 10 — Las ecuaciones de Navier–Stokes */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, W = FL.water;

  /* 10.1 Couette–Poiseuille */
  EM.defineSim('couette-poiseuille', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('P', { label: 'Parámetro de presión <i>P</i> = <i>Gh</i>²/(2μ<i>U</i>)', min: -4, max: 4, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.check('fam', { label: 'Mostrar la familia de perfiles', value: true });
    sim.out('q', 'Caudal adimensional <i>q</i>/(<i>Uh</i>)', { hl: true });
    sim.out('tw', 'Esfuerzo en la pared fija · móvil (en μ<i>U</i>/<i>h</i>)');
    sim.out('rev', 'Retroceso junto a la pared fija');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const u = (y, P) => y + P * y * (1 - y);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.62, h: H, xmin: -1, xmax: 2.2, ymin: 0, ymax: 1, xlabel: 'u/U', ylabel: 'y/h' });
      pl.frame();
      if (p.fam) for (const P of [-3, -2, -1, 0, 1, 2, 3]) pl.xy(EM.M.linspace(0, 1, 60).map((y) => u(y, P)), EM.M.linspace(0, 1, 60), { color: '--grid-2', width: 1.2 });
      const ys = EM.M.linspace(0, 1, 120);
      pl.xy(ys.map((y) => u(y, p.P)), ys, { color: '--accent', width: 2.8 });
      for (let k = 1; k < 10; k++) { const y = k / 10; pl.arrow(0, y, u(y, p.P), y, { color: '--accent', width: 1.2, head: 5 }); }
      pl.vline(0, { color: '--ink-3' });
      /* esfuerzo */
      const p2 = new EM.Plot(ctx, { x: Wc * 0.62, y: 0, w: Wc * 0.38, h: H, xmin: -5, xmax: 5, ymin: 0, ymax: 1, xlabel: 'τ/(μU/h)', ylabel: '' , ml: 30 });
      p2.frame();
      p2.xy(ys.map((y) => 1 + p.P * (1 - 2 * y)), ys, { color: '--c5', width: 2.2 });
      const q = 0.5 + p.P / 6, t0 = 1 + p.P, t1 = 1 - p.P;
      sim.set('q', EM.fix(q, 4));
      sim.set('tw', EM.fix(t0, 3) + ' · ' + EM.fix(t1, 3));
      sim.set('rev', p.P < -1 ? 'sí, hasta y/h = ' + EM.fix(1 + 1 / p.P, 3) : 'no');
    });
  });

  /* 10.2 Hagen–Poiseuille */
  const HPF = { agua: ['Agua (20 °C)', 998.2, 1.002e-3], sangre: ['Sangre (37 °C, newtoniana aprox.)', 1060, 3.5e-3], aceite: ['Aceite SAE 30', 891, 0.29], glicerina: ['Glicerina', 1261, 1.41], aire: ['Aire', 1.204, 1.82e-5] };
  EM.defineSim('hagen-poiseuille', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Fluido', options: Object.entries(HPF).map(([k, v]) => [k, v[0]]), value: 'agua' });
    sim.slider('R', { label: 'Radio del tubo', min: 0.05, max: 20, step: 0, value: 0.5, unit: 'mm', log: true, fmt: (v) => v.toFixed(v < 1 ? 3 : 2) });
    sim.slider('L', { label: 'Longitud', min: 0.01, max: 10, step: 0, value: 1, unit: 'm', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('dp', { label: 'Diferencia de presión', min: 1, max: 1e6, step: 0, value: 1000, unit: 'Pa', log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('Q', 'Caudal', { hl: true });
    sim.out('V', 'Velocidad media · máxima');
    sim.out('Re', 'Número de Reynolds');
    sim.out('tw', 'Esfuerzo en la pared');
    const N = 120, pr = new Float32Array(N), px = new Float32Array(N);
    for (let i = 0; i < N; i++) { pr[i] = 2 * Math.random() - 1; px[i] = Math.random(); }
    sim.animate((dt) => { for (let i = 0; i < N; i++) { px[i] += 0.25 * dt * (1 - pr[i] * pr[i]); if (px[i] > 1) px[i] -= 1; } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, f = HPF[p.f], R = p.R / 1000, G = p.dp / p.L;
      EM.draw.clear(cv);
      const Q = FL.hpQ(R, G, f[2]), Vm = Q / (Math.PI * R * R), Re = (f[1] * Vm * 2 * R) / f[2];
      const cy = H / 2, hr = H * 0.32, x0 = 20, x1 = Wc - 20;
      ctx.fillStyle = EM.alpha(p.f === 'aire' ? '--c6' : p.f === 'sangre' ? '--c2' : p.f === 'agua' ? '--water' : '--gold', 0.16);
      ctx.fillRect(x0, cy - hr, x1 - x0, 2 * hr);
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(x0, cy - hr - 8, x1 - x0, 8); ctx.fillRect(x0, cy + hr, x1 - x0, 8);
      ctx.fillStyle = EM.col('--ink-2');
      for (let i = 0; i < N; i++) ctx.fillRect(x0 + px[i] * (x1 - x0) - 1.5, cy - pr[i] * hr - 1.5, 3, 3);
      const xp = x0 + 60, Lp = (x1 - x0) * 0.35;
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.4; ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const s = -1 + (2 * k) / 60; const x = xp + Lp * (1 - s * s), y = cy - s * hr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      for (let k = -4; k <= 4; k++) { const s = k / 5; EM.draw.arrow(ctx, xp, cy - s * hr, xp + Lp * (1 - s * s), cy - s * hr, { color: '--accent', width: 1.2, head: 5 }); }
      EM.text(ctx, 'u(r) = (G/4μ)(R² − r²)', xp + Lp + 12, cy - hr * 0.6, { size: 12, color: '--accent', halo: true });
      sim.set('Q', EM.sci(Q * 1e6, 4) + ' mL/s = ' + EM.sci(Q * 60000, 4) + ' L/min');
      sim.set('V', EM.sci(Vm, 3) + ' · ' + EM.sci(2 * Vm, 3) + ' m/s');
      sim.set('Re', EM.sci(Re, 3) + (Re > 2300 ? ' <span class="warnv">(turbulento: la fórmula no vale)</span>' : ' (laminar)'));
      sim.set('tw', EM.sci((G * R) / 2, 3) + ' Pa');
    });
  });

  /* 10.3 Problemas de Stokes */
  const SNU = { agua: ['Agua', 1.004e-6], aire: ['Aire', 1.51e-5], glicerina: ['Glicerina', 1.12e-3] };
  EM.defineSim('stokes-problema', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.seg('m', { label: 'Problema', options: [['s', 'Placa que arranca'], ['o', 'Placa oscilante']], value: 's' });
    sim.select('f', { label: 'Fluido', options: Object.entries(SNU).map(([k, v]) => [k, v[0] + ' (ν = ' + EM.sci(v[1], 3) + ' m²/s)']), value: 'agua' });
    sim.slider('fr', { label: 'Frecuencia de oscilación', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'Hz', fmt: (v) => v.toFixed(1) });
    sim.out('t', 'Tiempo', { hl: true });
    sim.out('d', 'Espesor de la capa (δ₉₉ o √(2ν/ω))');
    sim.out('e', 'Error máximo numérico');
    let D = null, t = 0, Y = 1;
    const reset = () => {
      const p = sim.p, nu = SNU[p.f][1];
      if (p.m === 's') { Y = 3.64 * Math.sqrt(nu * 10) * 1.6; D = new FL.Diffusion1D(201, Y, nu, { bc0: () => 1 }); }
      else { const w = 2 * Math.PI * p.fr, dl = Math.sqrt((2 * nu) / w); Y = 7 * dl; D = new FL.Diffusion1D(201, Y, nu, { bc0: (tt) => Math.cos(w * tt) }); D.u[0] = 1; }
      t = 0;
    };
    sim.onChange = () => { sim.ctl.fr.show(sim.p.m === 'o'); reset(); };
    sim.resetButton(reset);
    reset(); sim.ctl.fr.show(false);
    sim.animate((dt) => {
      const p = sim.p, T = p.m === 's' ? 10 : 1e9, h = p.m === 's' ? 0.01 : 1 / (p.fr * 400);
      const tg = Math.min(T, t + dt * (p.m === 's' ? 1 : 0.25));
      while (D.t + h <= tg + 1e-12) D.step(h);
      t = tg;
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, nu = SNU[p.f][1];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: p.m === 's' ? 0 : -1.05, xmax: 1.05, ymin: 0, ymax: Y * 1000, xlabel: 'u/U', ylabel: 'y (mm)' });
      pl.frame();
      let err = 0;
      if (p.m === 's') {
        const tt = Math.max(D.t, 1e-9);
        const ys = EM.M.linspace(0, Y, 200);
        for (const ts of [0.25, 1, 4]) if (ts <= tt) pl.xy(ys.map((y) => FL.stokes1(y, ts, 1, nu)), ys.map((y) => y * 1000), { color: '--grid-2', width: 1.2 });
        pl.xy(ys.map((y) => FL.stokes1(y, tt, 1, nu)), ys.map((y) => y * 1000), { color: '--accent', width: 2.4 });
        for (let i = 0; i < D.n; i += 8) { pl.dot(D.u[i], D.y[i] * 1000, { color: '--c1', r: 3 }); err = Math.max(err, Math.abs(D.u[i] - FL.stokes1(D.y[i], tt, 1, nu))); }
        pl.hline(3.64 * Math.sqrt(nu * tt) * 1000, { color: '--c2', label: 'δ₉₉ = 3.64√(νt)' });
        sim.set('d', EM.fix(3.64 * Math.sqrt(nu * tt) * 1000, 2) + ' mm');
      } else {
        const w = 2 * Math.PI * p.fr, dl = Math.sqrt((2 * nu) / w), ys = EM.M.linspace(0, Y, 200);
        pl.xy(ys.map((y) => Math.exp(-y / dl)), ys.map((y) => y * 1000), { color: '--grid-2', width: 1.2, dash: [4, 4] });
        pl.xy(ys.map((y) => -Math.exp(-y / dl)), ys.map((y) => y * 1000), { color: '--grid-2', width: 1.2, dash: [4, 4] });
        pl.xy(ys.map((y) => FL.stokes2(y, D.t, 1, w, nu)), ys.map((y) => y * 1000), { color: '--accent', width: 2.4 });
        for (let i = 0; i < D.n; i += 8) pl.dot(D.u[i], D.y[i] * 1000, { color: '--c1', r: 3 });
        if (D.t > 3 / p.fr) for (let i = 0; i < D.n; i++) err = Math.max(err, Math.abs(D.u[i] - FL.stokes2(D.y[i], D.t, 1, w, nu)));
        pl.hline(dl * 1000, { color: '--c2', label: 'δ = √(2ν/ω)' });
        sim.set('d', EM.fix(dl * 1000, 3) + ' mm');
      }
      pl.legend([{ label: 'exacta', color: '--accent' }, { label: 'diferencias finitas', color: '--c1', kind: 'dot' }], 'tr');
      sim.set('t', EM.fix(D.t, 2) + ' s');
      sim.set('e', p.m === 'o' && D.t <= 3 / p.fr ? 'esperando a que pase el transitorio' : EM.sci(err, 2));
    });
  });

  /* 10.4 Arranque del flujo en un tubo */
  EM.defineSim('arranque-tubo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('sp', { label: 'Rapidez de la animación (τ por segundo)', min: 0.02, max: 0.3, step: 0.01, value: 0.08, fmt: (v) => v.toFixed(2) });
    sim.out('tau', 'Tiempo adimensional τ = ν<i>t</i>/<i>R</i>²', { hl: true });
    sim.out('uc', 'Velocidad en el eje / final');
    sim.out('e', 'Diferencia serie − diferencias finitas');
    let D, hist;
    const reset = () => { D = new FL.Diffusion1D(101, 1, 1, { cyl: true, src: () => 4 }); hist = []; };
    reset();
    sim.resetButton(reset);
    sim.animate((dt) => {
      const tg = Math.min(1.5, D.t + dt * sim.p.sp), h = 0.0005;
      while (D.t + h <= tg + 1e-12) D.step(h);
      hist.push([D.t, D.u[0]]);
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h, tau = D.t;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.55, h: H, xmin: 0, xmax: 1.05, ymin: -1, ymax: 1, xlabel: 'u/u_{max}', ylabel: 'r/R' });
      pl.frame();
      const rs = EM.M.linspace(0, 1, 80);
      pl.xy(rs.map((r) => 1 - r * r), rs, { color: '--grid-2', width: 1.2, dash: [4, 4] });
      pl.xy(rs.map((r) => 1 - r * r), rs.map((r) => -r), { color: '--grid-2', width: 1.2, dash: [4, 4] });
      pl.xy(rs.map((r) => FL.pipeStart(r, tau)), rs, { color: '--accent', width: 2.4 });
      pl.xy(rs.map((r) => FL.pipeStart(r, tau)), rs.map((r) => -r), { color: '--accent', width: 2.4 });
      let err = 0;
      for (let i = 0; i < D.n; i += 5) { pl.dot(D.u[i], D.y[i], { color: '--c1', r: 3 }); pl.dot(D.u[i], -D.y[i], { color: '--c1', r: 3 }); err = Math.max(err, Math.abs(D.u[i] - FL.pipeStart(D.y[i], tau))); }
      const p2 = new EM.Plot(ctx, { x: Wc * 0.55, y: 0, w: Wc * 0.45, h: H, xmin: 0, xmax: 1.5, ymin: 0, ymax: 1.05, xlabel: 'τ = νt/R²', ylabel: 'u_{eje}/u_{max}' });
      p2.frame();
      p2.fn((tt) => FL.pipeStart(0, tt), { color: '--accent', width: 2 });
      for (let i = 0; i < hist.length; i += 6) p2.dot(hist[i][0], hist[i][1], { color: '--c1', r: 2.5 });
      p2.hline(0.99, { color: '--c2', label: '99 % en τ = 0.814' });
      sim.set('tau', EM.fix(tau, 3));
      sim.set('uc', EM.fix(FL.pipeStart(0, tau), 4));
      sim.set('e', EM.sci(err, 2));
    });
  });
})();
