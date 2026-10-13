/* Capítulo 10 — La cadena de osciladores */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Dibuja cuentas sobre un hilo: ys en unidades de amplitud (±1 → ±A píxeles) */
  function drawBeads(ctx, x0, x1, y0, A, ys, o = {}) {
    const N = ys.length, dx = (x1 - x0) / (N + 1);
    const pts = [[x0, y0]];
    ys.forEach((y, i) => pts.push([x0 + dx * (i + 1), y0 - y * A]));
    pts.push([x1, y0]);
    if (o.ends !== false) { ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x0 - 6, y0 - 14, 6, 28); ctx.fillRect(x1, y0 - 14, 6, 28); }
    EM.draw.poly(ctx, pts, { color: '--ink-3', width: 1.3 });
    const r = Math.max(3, Math.min(9, dx * 0.28));
    pts.slice(1, -1).forEach(([x, y]) => EM.draw.bob(ctx, x, y, r, { color: o.color || '--c1' }));
    return dx;
  }
  EM.drawBeads = drawBeads;

  /* ======================================================================
     10.1 Modos de N cuentas
     ====================================================================== */
  EM.defineSim('bead-modes', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('N', { label: 'Número de cuentas <i>N</i>', min: 1, max: 30, step: 1, value: 5, fmt: (v) => v.toFixed(0), onInput: () => { sim.ctl.p.range(1, sim.p.N, 1); if (sim.p.p > sim.p.N) sim.ctl.p.set(sim.p.N, true); t = 0; } });
    sim.slider('p', { label: 'Modo <i>p</i>', min: 1, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0), onInput: () => { t = 0; } });
    sim.seg('ic', { label: 'Movimiento', options: [['mode', 'Un modo'], ['two', 'Modos 1 + p'], ['pluck', 'Pulsar']], value: 'mode', onInput: () => { t = 0; } });
    sim.check('env', { label: 'Mostrar la sinusoide del modo', value: true });
    sim.out('w', '<i>ω<sub>p</sub></i>/<i>ω</i><sub>0</sub>', { hl: true });
    sim.out('lam', 'Longitud de onda / <i>a</i>');
    sim.out('r', '<i>ω<sub>p</sub></i>/<i>ω</i><sub>1</sub> (cuerda continua: <i>p</i>)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, N = p.N, P = p.p;
      const w = (q) => 2 * Math.sin((q * Math.PI) / (2 * (N + 1)));
      const shape = (q, n) => Math.sin((n * q * Math.PI) / (N + 1));
      const sp = 2.2;
      let amps;
      if (p.ic === 'mode') { amps = new Array(N).fill(0); amps[P - 1] = 0.9; }
      else if (p.ic === 'two') { amps = new Array(N).fill(0); amps[0] = 0.55; if (P > 1) amps[P - 1] += 0.35; }
      else {
        /* triángulo con vértice en la cuenta más cercana a 1/4: proyección modal */
        const j = Math.max(1, Math.round((N + 1) / 4));
        const y0 = []; for (let n = 1; n <= N; n++) y0.push(n <= j ? n / j : (N + 1 - n) / (N + 1 - j));
        amps = []; for (let q = 1; q <= N; q++) { let s = 0; for (let n = 1; n <= N; n++) s += y0[n - 1] * shape(q, n); amps.push((0.9 * 2 * s) / (N + 1)); }
      }
      const ys = [];
      for (let n = 1; n <= N; n++) { let y = 0; for (let q = 1; q <= N; q++) if (amps[q - 1]) y += amps[q - 1] * shape(q, n) * Math.cos(w(q) * sp * t); ys.push(y); }
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, A = H * 0.36;
      const x0 = 30, x1 = W - 30;
      if (p.env && p.ic === 'mode') {
        const c = Math.cos(w(P) * sp * t);
        const pts = [];
        for (let i = 0; i <= 300; i++) { const u = i / 300; pts.push([x0 + (x1 - x0) * u, H / 2 - 0.9 * A * Math.sin(u * (N + 1) * (P * Math.PI) / (N + 1)) * c]); }
        EM.draw.poly(ctx, pts, { color: '--accent', width: 1.4, dash: [5, 4], alpha: 0.8 });
      }
      drawBeads(ctx, x0, x1, H / 2, A, ys);
      sim.set('w', EM.fix(w(P), 4));
      sim.set('lam', EM.fix((2 * (N + 1)) / P, 3));
      sim.set('r', EM.fix(w(P) / w(1), 4) + ' (vs ' + P + ')');
    });
  });

  /* ======================================================================
     10.2 Relación de dispersión y aliasing
     ====================================================================== */
  EM.defineSim('chain-dispersion', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1.2 });
    const cw = sim.canvas({ aspect: 1.2 });
    sim.slider('k', { label: 'Número de onda <i>ka</i>', min: -9.4, max: 9.4, step: 0.01, value: 1.2, unit: 'rad', fmt: f2 });
    sim.check('alias', { label: 'Mostrar la onda equivalente de la primera zona', value: true });
    sim.out('w', '<i>ω</i>/<i>ω</i><sub>0</sub>', { hl: true });
    sim.out('kr', '<i>ka</i> reducido a (−π, π]');
    sim.out('vp', 'Velocidad de fase / (<i>ω</i><sub>0</sub><i>a</i>)');
    sim.out('vg', 'Velocidad de grupo / (<i>ω</i><sub>0</sub><i>a</i>)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ka = p.k;
      const w = 2 * Math.abs(Math.sin(ka / 2));
      const kr = ka - 2 * Math.PI * Math.round(ka / (2 * Math.PI));
      EM.draw.clear(cd);
      const pd = new EM.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -3 * Math.PI, xmax: 3 * Math.PI, ymin: 0, ymax: 2.4, xpi: true, xlabel: 'ka', ylabel: 'ω / ω₀', ml: 52 });
      pd.frame();
      pd.band(-Math.PI, Math.PI, { color: '--c3', alpha: 0.08 });
      pd.fn((x) => Math.abs(x), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pd.fn((x) => 2 * Math.abs(Math.sin(x / 2)), { color: '--c1', width: 2.2, n: 900 });
      pd.hline(2, { color: '--c2', label: 'corte 2ω₀', labelRight: true });
      pd.dot(ka, w, { color: '--accent', r: 6 });
      if (p.alias && Math.abs(kr - ka) > 1e-6) pd.dot(kr, w, { color: '--c3', r: 5 });
      EM.draw.clear(cw);
      const ctx = cw.ctx, W = cw.w, H = cw.h;
      const N = 12, x0 = 20, x1 = W - 20, dx = (x1 - x0) / N, A = H * 0.3;
      const sgn = Math.sin(ka / 2) >= 0 ? 1 : -1;
      const ph = sgn * w * 1.6 * t;
      /* onda continua con k original */
      const pts = [], pr = [];
      for (let i = 0; i <= 600; i++) { const xn = (N * i) / 600; pts.push([x0 + xn * dx, H / 2 - A * Math.cos(ka * xn - ph)]); pr.push([x0 + xn * dx, H / 2 - A * Math.cos(kr * xn - ph)]); }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 1.4, alpha: 0.7 });
      if (p.alias) EM.draw.poly(ctx, pr, { color: '--c3', width: 1.4, dash: [5, 4] });
      for (let n = 0; n <= N; n++) EM.draw.bob(ctx, x0 + n * dx, H / 2 - A * Math.cos(ka * n - ph), 6, { color: '--c1' });
      EM.text(ctx, 'las cuentas sólo «ven» la onda en x = na', 10, H - 10, { size: 11, color: '--ink-3' });
      sim.set('w', EM.fix(w, 4));
      sim.set('kr', EM.fix(kr, 3));
      sim.set('vp', Math.abs(ka) > 1e-6 ? EM.fix(w / Math.abs(ka), 4) : '1');
      sim.set('vg', EM.fix(Math.cos(ka / 2) * Math.sign(Math.sin(ka / 2) || 1), 4));
    });
  });

  /* ======================================================================
     10.3 Cadena excitada en un extremo
     ====================================================================== */
  EM.defineSim('chain-driven', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('w', { label: 'Frecuencia de excitación <i>ω</i>/<i>ω</i><sub>0</sub>', min: 0.1, max: 3, step: 0.01, value: 0.8, fmt: f2, onInput: () => restart() });
    sim.resetButton(() => restart());
    sim.note('70 cuentas; las últimas 25 tienen un amortiguamiento creciente que imita una cadena infinita.');
    sim.out('kind', 'Régimen', { hl: true });
    sim.out('k', 'Número de onda <i>ka</i> o decaimiento <i>κa</i>');
    sim.out('lam', 'Longitud de onda (en cuentas)');
    const N = 70;
    let y, v, t;
    const gam = new Float64Array(N + 2);
    for (let n = 0; n < N + 2; n++) gam[n] = n > N - 25 ? 0.6 * ((n - (N - 25)) / 25) ** 2 : 0;
    const restart = () => { y = new Float64Array(N + 2); v = new Float64Array(N + 2); t = 0; };
    restart();
    sim.animate((dt) => {
      const W = sim.p.w, steps = 60, h = (dt * 8) / steps;
      for (let s = 0; s < steps; s++) {
        t += h;
        y[0] = Math.sin(W * t) * Math.min(1, t / 6);
        for (let n = 1; n <= N; n++) v[n] += h * ((y[n + 1] - 2 * y[n] + y[n - 1]) - gam[n] * v[n]);
        for (let n = 1; n <= N; n++) y[n] += h * v[n];
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const x0 = 26, x1 = W - 10, dx = (x1 - x0) / (N + 1), A = H * 0.28;
      ctx.fillStyle = EM.alpha('--c2', 0.08);
      ctx.fillRect(x0 + dx * (N - 25), 0, dx * 26, H);
      EM.text(ctx, 'zona absorbente', x0 + dx * (N - 12), 16, { size: 11, color: '--c2', align: 'center' });
      const pts = [];
      for (let n = 0; n <= N; n++) pts.push([x0 + n * dx, H / 2 - y[n] * A]);
      EM.draw.poly(ctx, pts, { color: '--ink-3', width: 1 });
      pts.forEach(([x, yy], i) => EM.draw.bob(ctx, x, yy, i === 0 ? 6 : 3.4, { color: i === 0 ? '--accent' : '--c1' }));
      if (p.w > 2) {
        const ka = Math.acosh((p.w * p.w) / 2 - 1);
        const env = [];
        for (let n = 0; n <= 20; n++) env.push([x0 + n * dx, H / 2 - A * Math.exp(-n * ka)]);
        EM.draw.poly(ctx, env, { color: '--c2', width: 1.2, dash: [4, 4] });
      }
      if (p.w <= 2) {
        const ka = 2 * Math.asin(p.w / 2);
        sim.set('kind', 'propagación');
        sim.set('k', 'ka = ' + EM.fix(ka, 3));
        sim.set('lam', EM.fix((2 * Math.PI) / ka, 2));
      } else {
        const ka = Math.acosh((p.w * p.w) / 2 - 1);
        sim.set('kind', 'evanescente (por encima del corte)');
        sim.set('k', 'κa = ' + EM.fix(ka, 3));
        sim.set('lam', '— (alterna de signo, decae)');
      }
    });
  });

  /* ======================================================================
     10.4 Discreto frente a continuo
     ====================================================================== */
  EM.defineSim('discrete-continuum', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('N', { label: 'Número de cuentas <i>N</i>', min: 1, max: 60, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('w1', '<i>ω</i><sub>1</sub> (cadena) / <i>ω</i><sub>1</sub> (cuerda)', { hl: true });
    sim.out('wN', '<i>ω<sub>N</sub></i>/<i>ω</i><sub>1</sub> (cuerda: <i>N</i>)');
    sim.note('Masa total, longitud y tensión fijas: al aumentar <i>N</i> las cuentas son más livianas y más próximas.');
    sim.onDraw(() => {
      const N = sim.p.N;
      /* frecuencias en unidades de v π / L: cuerda → p; cadena → (2(N+1)/π) sen(pπ/2(N+1)) */
      const wc = (p) => ((2 * (N + 1)) / Math.PI) * Math.sin((p * Math.PI) / (2 * (N + 1)));
      EM.draw.clear(cv);
      const pmax = Math.max(N, 10);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: pmax + 1, ymin: 0, ymax: pmax + 1, xlabel: 'número de modo p', ylabel: 'ω_p / (πv/L)', ml: 52 });
      pl.frame();
      pl.fn((p) => p, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.label(pmax * 0.7, pmax * 0.82, 'cuerda continua ω = pπv/L', { color: '--ink-3' });
      for (let p = 1; p <= N; p++) pl.dot(p, wc(p), { color: '--c1', r: 4 });
      sim.set('w1', EM.fix(wc(1), 5));
      sim.set('wN', EM.fix(wc(N) / wc(1), 3) + ' (vs ' + N + ')');
    });
  });

  /* ======================================================================
     10.5 Cadena diatómica
     ====================================================================== */
  EM.defineSim('diatomic', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1.2 });
    const cw = sim.canvas({ aspect: 1.2 });
    sim.slider('r', { label: 'Razón de masas <i>m</i><sub>2</sub>/<i>m</i><sub>1</sub>', min: 1, max: 6, step: 0.05, value: 2.5, fmt: f2 });
    sim.slider('k', { label: 'Número de onda <i>ka</i>', min: -Math.PI, max: Math.PI, step: 0.01, value: 0.6, fmt: f2 });
    sim.seg('br', { label: 'Rama', options: [['ac', 'Acústica'], ['op', 'Óptica']], value: 'ac' });
    sim.out('w', '<i>ω</i> / √(<i>κ</i>/<i>m</i><sub>1</sub>)', { hl: true });
    sim.out('gap', 'Banda prohibida');
    sim.out('ratio', 'Amplitud masa 2 / masa 1');
    sim.note('El movimiento real es longitudinal; aquí se dibuja hacia arriba para que se vea mejor.');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    const disp = (ka, r, s) => { const S = 1 + 1 / r; const D = Math.sqrt(Math.max(0, S * S - (4 * Math.sin(ka / 2) ** 2) / r)); return Math.sqrt(Math.max(0, S + s * D)); };
    sim.onDraw(() => {
      const p = sim.p, r = p.r, s = p.br === 'op' ? 1 : -1;
      const w = disp(p.k, r, s);
      EM.draw.clear(cd);
      const ymax = Math.sqrt(2 * (1 + 1 / r)) * 1.1;
      const pd = new EM.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -Math.PI, xmax: Math.PI, ymin: 0, ymax: Math.max(ymax, 1.6), xpi: true, xlabel: 'ka (a = longitud de la celda)', ylabel: 'ω / √(κ/m₁)', ml: 52 });
      pd.frame();
      const wa = Math.sqrt(2 / r), wo = Math.sqrt(2);
      if (r > 1.0001) cd.ctx.fillStyle = EM.alpha('--c2', 0.08), cd.ctx.fillRect(pd.ix, pd.Y(Math.max(wa, wo)), pd.iw, pd.Y(Math.min(wa, wo)) - pd.Y(Math.max(wa, wo)));
      pd.fn((x) => disp(x, r, -1), { color: '--c1', width: 2.2, n: 600 });
      pd.fn((x) => disp(x, r, 1), { color: '--c2', width: 2.2, n: 600 });
      pd.dot(p.k, w, { color: '--accent', r: 6 });
      pd.label(-2.9, disp(-2.9, r, -1) * 0.5, 'acústica', { color: '--c1' });
      pd.label(-2.9, disp(-2.9, r, 1) + 0.12, 'óptica', { color: '--c2' });
      /* amplitudes: −m1 ω² u = κ(v(1 + e^{−ika}) − 2u) → v/u = (2 − ω²)/(1 + e^{−ika}) (m1 = κ = 1) */
      const den = [1 + Math.cos(p.k), -Math.sin(p.k)], num = 2 - w * w;
      const dm = den[0] * den[0] + den[1] * den[1];
      const vr = dm > 1e-12 ? [(num * den[0]) / dm, (-num * den[1]) / dm] : [0, 0];
      EM.draw.clear(cw);
      const ctx = cw.ctx, W = cw.w, H = cw.h;
      const cells = 6, x0 = 20, x1 = W - 20, dx = (x1 - x0) / (2 * cells), A = H * 0.16;
      const nrm = Math.max(1, Math.hypot(vr[0], vr[1]));
      const pts = [];
      for (let n = 0; n < cells; n++) {
        const ph = p.k * n - w * 1.5 * t;
        const u = Math.cos(ph) / nrm;
        const v = (vr[0] * Math.cos(ph) - vr[1] * Math.sin(ph)) / nrm;
        pts.push([x0 + 2 * n * dx, H / 2 - u * A, 1], [x0 + (2 * n + 1) * dx, H / 2 - v * A, 2]);
      }
      EM.draw.poly(ctx, pts.map((q) => [q[0], q[1]]), { color: '--ink-3', width: 1 });
      pts.forEach(([x, y, k]) => EM.draw.bob(ctx, x, y, k === 1 ? 7 : 7 + 2 * Math.sqrt(r), { color: k === 1 ? '--c4' : '--c5' }));
      sim.set('w', EM.fix(w, 4));
      sim.set('gap', r > 1.0001 ? 'entre ' + EM.fix(Math.min(wa, wo), 3) + ' y ' + EM.fix(Math.max(wa, wo), 3) : 'no hay (masas iguales)');
      sim.set('ratio', dm > 1e-12 ? EM.fix(Math.hypot(vr[0], vr[1]), 3) + (num * den[0] < 0 ? ' (en oposición)' : ' (en fase)') : '—');
    });
  });
})();
