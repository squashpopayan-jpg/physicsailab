/* Capítulo 16 — Dispersión y velocidad de grupo */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Relaciones de dispersión adimensionales ω(k) y sus derivadas */
  const DISP = {
    none: { n: 'Sin dispersión (ω = k)', w: (k) => k, w1: () => 1, w2: () => 0 },
    deep: { n: 'Aguas profundas (ω = √k)', w: (k) => Math.sqrt(k), w1: (k) => 0.5 / Math.sqrt(k), w2: (k) => -0.25 * Math.pow(k, -1.5) },
    cap: { n: 'Capilares (ω = k^{3/2})', w: (k) => Math.pow(k, 1.5), w1: (k) => 1.5 * Math.sqrt(k), w2: (k) => 0.75 / Math.sqrt(k) },
    chain: { n: 'Cadena (ω = 2 sen k/2)', w: (k) => 2 * Math.sin(k / 2), w1: (k) => Math.cos(k / 2), w2: (k) => -0.5 * Math.sin(k / 2) },
    plasma: { n: 'Plasma (ω² = 1 + k²)', w: (k) => Math.sqrt(1 + k * k), w1: (k) => k / Math.sqrt(1 + k * k), w2: (k) => Math.pow(1 + k * k, -1.5) },
    schr: { n: 'Partícula cuántica (ω = k²/2)', w: (k) => (k * k) / 2, w1: (k) => k, w2: () => 1 }
  };
  const dispOpts = Object.keys(DISP).map((k) => [k, DISP[k].n]);

  /* ======================================================================
     16.1 Dos ondas: fase y grupo
     ====================================================================== */
  EM.defineSim('group-two-waves', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const cd = sim.canvas({ aspect: 3.4 });
    let mTrack = 0, resetTrack = true;
    sim.select('m', { label: 'Medio', options: dispOpts, value: 'deep', onInput: () => { t = 0; resetTrack = true; } });
    sim.slider('k0', { label: 'Número de onda medio <i>k</i><sub>0</sub>', min: 0.6, max: 3, step: 0.01, value: 1.5, fmt: f2, onInput: () => { t = 0; } });
    sim.slider('dk', { label: 'Separación Δ<i>k</i>', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: f2, onInput: () => { t = 0; } });
    sim.resetButton(() => { t = 0; });
    sim.out('vf', 'Velocidad de fase <i>ω</i>/<i>k</i>', { hl: true });
    sim.out('vg', 'Velocidad del grupo Δ<i>ω</i>/Δ<i>k</i>');
    sim.out('vgd', '<i>dω</i>/<i>dk</i> en <i>k</i><sub>0</sub>');
    sim.out('r', '<i>v<sub>g</sub></i>/<i>v<sub>f</sub></i>');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, D = DISP[p.m];
      const k1 = p.k0 - p.dk / 2, k2 = p.k0 + p.dk / 2, w1 = D.w(k1), w2 = D.w(k2);
      const kb = p.k0, wb = (w1 + w2) / 2, vf = wb / kb, vg = (w2 - w1) / (k2 - k1);
      /* escala de tiempo: la cresta avanza ≈ 3 unidades por segundo */
      const ts = t * (3 / Math.max(vf, 0.2));
      const L = (2 * Math.PI) / p.dk * 1.2;
      const y = (x) => Math.cos(k1 * x - w1 * ts) + Math.cos(k2 * x - w2 * ts);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: L, ymin: -2.4, ymax: 2.4, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      pl.fn((x) => 2 * Math.abs(Math.cos((p.dk / 2) * x - ((w2 - w1) / 2) * ts)), { color: '--c1', width: 1.2, dash: [4, 4] });
      pl.fn(y, { color: '--accent', width: 1.8, n: 1500 });
      /* cresta seguida y máximo de la envolvente */
      const lamE = (2 * Math.PI) / p.dk, lamC = (2 * Math.PI) / kb;
      const lo = 0.1 * lamE;
      const xe = (((vg * ts - lo) % lamE) + lamE) % lamE + lo;
      let xc = vf * ts + lamC * mTrack;
      if (!(xc >= lo && xc <= lo + lamE) || resetTrack) { mTrack = Math.round((xe - vf * ts) / lamC); xc = vf * ts + lamC * mTrack; resetTrack = false; }
      pl.dot(xe, 2 * Math.abs(Math.cos((p.dk / 2) * xe - ((w2 - w1) / 2) * ts)), { color: '--c1', r: 6 });
      pl.dot(xc, y(xc), { color: '--c2', r: 6 });
      EM.draw.clear(cd);
      const pd = new EM.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: 3.5, ymin: 0, ymax: Math.max(3, D.w(3.5) * 1.05), xlabel: 'k', ylabel: 'ω', ml: 52 });
      pd.frame();
      pd.fn(D.w, { color: '--c5', width: 2, from: 0.01 });
      pd.fn((k) => vf * k, { color: '--c2', width: 1, dash: [4, 4] });
      pd.fn((k) => D.w(p.k0) + D.w1(p.k0) * (k - p.k0), { color: '--c1', width: 1, dash: [4, 4] });
      pd.dot(k1, w1, { color: '--accent', r: 4 }); pd.dot(k2, w2, { color: '--accent', r: 4 });
      pd.label(0.1, pd.o.ymax * 0.9, 'pendiente de la recta roja: v_f · tangente azul: v_g', { size: 11 });
      sim.set('vf', EM.fix(vf, 3));
      sim.set('vg', EM.fix(vg, 3));
      sim.set('vgd', EM.fix(D.w1(p.k0), 3));
      sim.set('r', EM.fix(vg / vf, 3));
    });
  });

  /* ======================================================================
     16.2 Paquete de ondas
     ====================================================================== */
  EM.defineSim('wave-packet', function (sim) {
    const cv = sim.canvas({ aspect: 2.5 });
    const cw = sim.canvas({ aspect: 4.2 });
    sim.select('m', { label: 'Medio', options: dispOpts, value: 'deep', onInput: () => restart() });
    sim.slider('k0', { label: 'Número de onda central <i>k</i><sub>0</sub>', min: 0.8, max: 3, step: 0.05, value: 1.5, fmt: f2, onInput: () => restart() });
    sim.slider('s0', { label: 'Ancho inicial <i>σ</i><sub>0</sub>', min: 3, max: 25, step: 0.5, value: 6, fmt: (v) => EM.fix(v, 1), onInput: () => restart() });
    sim.resetButton(() => restart());
    sim.out('vg', 'Velocidad de grupo <i>v<sub>g</sub></i>');
    sim.out('s', 'Ancho actual / inicial (medido)', { hl: true });
    sim.out('sp', 'Predicción gaussiana');
    sim.out('E', 'Energía (relativa)');
    const N = 2048, Lx = 600, dx = Lx / N;
    const kk = new Float64Array(N);
    for (let i = 0; i < N; i++) kk[i] = ((i < N / 2 ? i : i - N) * 2 * Math.PI) / Lx;
    let R0, I0, t, trace, E0;
    const restart = () => {
      const p = sim.p, re = new Float64Array(N), im = new Float64Array(N), x0 = 80;
      for (let i = 0; i < N; i++) { const x = i * dx, g = Math.exp(-((x - x0) ** 2) / (2 * p.s0 * p.s0)); re[i] = g * Math.cos(p.k0 * x); im[i] = g * Math.sin(p.k0 * x); }
      EM.fft(re, im);
      R0 = re; I0 = im; t = 0; trace = new EM.Trace(400); E0 = null;
    };
    restart();
    let cur = null;
    const evolve = () => {
      const D = DISP[sim.p.m], re = new Float64Array(N), im = new Float64Array(N);
      for (let i = 0; i < N; i++) { const k = kk[i], w = k >= 0 ? D.w(k) : -D.w(-k); const c = Math.cos(w * t), s = Math.sin(w * t); re[i] = R0[i] * c + I0[i] * s; im[i] = I0[i] * c - R0[i] * s; }
      EM.fft(re, im, true);
      cur = [re, im];
    };
    sim.animate((dt) => {
      const D = DISP[sim.p.m], vg = Math.abs(D.w1(sim.p.k0));
      t += dt * (40 / Math.max(vg, 0.1));
      evolve();
      let sw = 0, sx = 0, sx2 = 0;
      for (let i = 0; i < N; i++) { const a = cur[0][i] ** 2 + cur[1][i] ** 2; sw += a; sx += a * i * dx; sx2 += a * (i * dx) ** 2; }
      const mx = sx / sw;
      if (mx > Lx * 0.85) restart();
    });
    sim.onDraw(() => {
      const p = sim.p, D = DISP[p.m];
      if (!cur) evolve();
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Lx, ymin: -1.15, ymax: 1.15, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      const xs = [], yr = [], ya = [];
      for (let i = 0; i < N; i++) { xs.push(i * dx); yr.push(cur[0][i]); ya.push(Math.hypot(cur[0][i], cur[1][i])); }
      pl.xy(xs, ya, { color: '--c1', width: 1.2, dash: [4, 4] });
      pl.xy(xs, yr, { color: '--accent', width: 1.4 });
      let sw = 0, sx = 0, sx2 = 0;
      for (let i = 0; i < N; i++) { const a = ya[i] ** 2; sw += a; sx += a * xs[i]; sx2 += a * xs[i] ** 2; }
      const mx = sx / sw, sig = Math.sqrt(sx2 / sw - mx * mx) * Math.SQRT2;
      if (E0 === null) E0 = sw;
      trace.push(t, sig / p.s0);
      EM.draw.clear(cw);
      const w2 = D.w2(p.k0), pred = (tt) => Math.sqrt(1 + ((w2 * tt) / (p.s0 * p.s0)) ** 2);
      const tm = Math.max(t, 1) * 1.05;
      const pw = new EM.Plot(cw.ctx, { x: 0, y: 0, w: cw.w, h: cw.h, xmin: 0, xmax: tm, ymin: 0, ymax: Math.max(2, pred(tm) * 1.1), xlabel: 't', ylabel: 'σ / σ₀', ml: 52 });
      pw.frame();
      pw.fn(pred, { color: '--ink-3', width: 1.3, dash: [5, 4] });
      pw.xy(trace.t, trace.col(0), { color: '--c3', width: 2 });
      sim.set('vg', EM.fix(D.w1(p.k0), 3));
      sim.set('s', EM.fix(sig / p.s0, 3));
      sim.set('sp', EM.fix(pred(t), 3));
      sim.set('E', EM.fix(sw / E0, 4));
    });
  });

  /* ======================================================================
     16.3 Olas en el agua
     ====================================================================== */
  EM.defineSim('water-dispersion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('lam', { label: 'Longitud de onda <i>λ</i>', min: 1e-3, max: 1e5, value: 100, log: true, step: 1e-4, fmt: (v) => EM.si(v, 'm') });
    sim.slider('h', { label: 'Profundidad <i>h</i>', min: 0.01, max: 6000, value: 4000, log: true, step: 0.01, fmt: (v) => EM.si(v, 'm') });
    sim.check('cap', { label: 'Incluir tensión superficial', value: true });
    sim.out('vf', 'Velocidad de fase', { hl: true });
    sim.out('vg', 'Velocidad de grupo');
    sim.out('T', 'Período');
    sim.out('reg', 'Régimen');
    const g = 9.81, sr = 0.0728 / 1000;
    const om = (k) => Math.sqrt((g * k + (sim.p.cap ? sr * k ** 3 : 0)) * Math.tanh(Math.min(50, k * sim.p.h)));
    const vfF = (lam) => { const k = (2 * Math.PI) / lam; return om(k) / k; };
    const vgF = (lam) => { const k = (2 * Math.PI) / lam, h = k * 1e-6; return (om(k + h) - om(k - h)) / (2 * h); };
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-3, xmax: 1e5, xlog: true, ymin: 0.05, ymax: 500, ylog: true, xlabel: 'longitud de onda λ (m)', ylabel: 'velocidad (m/s)', ml: 56 });
      pl.frame();
      pl.fn(vfF, { color: '--c1', width: 2.2, n: 600 });
      pl.fn(vgF, { color: '--c2', width: 2, dash: [6, 4], n: 600 });
      pl.hline(Math.sqrt(g * p.h), { color: '--ink-3', label: '√(gh)' });
      pl.dot(p.lam, vfF(p.lam), { color: '--c1', r: 6 });
      pl.dot(p.lam, vgF(p.lam), { color: '--c2', r: 5 });
      pl.legend([{ label: 'v_f', color: '--c1' }, { label: 'v_g', color: '--c2', dash: [6, 4] }], 'tl');
      const vf = vfF(p.lam), vg = vgF(p.lam), kh = (2 * Math.PI * p.h) / p.lam;
      sim.set('vf', EM.si(vf, 'm/s'));
      sim.set('vg', EM.si(vg, 'm/s') + ' (' + EM.fix(vg / vf, 2) + ' v_f)');
      sim.set('T', EM.si(p.lam / vf, 's'));
      sim.set('reg', p.lam < 0.017 && p.cap ? 'capilar' : kh > 3 ? 'gravedad, aguas profundas' : kh < 0.3 ? 'aguas someras (sin dispersión)' : 'profundidad intermedia');
    });
  });

  /* ======================================================================
     16.4 Cuerda rígida
     ====================================================================== */
  EM.defineSim('stiff-string', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('B', { label: 'Coeficiente de inarmonicidad <i>B</i>', min: 1e-5, max: 2e-2, value: 4e-4, log: true, step: 1e-6, fmt: (v) => EM.sci(v, 2) });
    sim.slider('f1', { label: 'Fundamental', min: 27.5, max: 440, step: 0.5, value: 55, unit: 'Hz', fmt: (v) => EM.fix(v, 1) });
    EM.listenButton(sim, () => ({ fn: tone(0), dur: 3 }), { label: '♪ Cuerda ideal' });
    EM.listenButton(sim, () => ({ fn: tone(sim.p.B), dur: 3 }), { label: '♪ Cuerda rígida' });
    sim.out('f8', 'Armónico 8: <i>f</i><sub>8</sub> / 8<i>f</i><sub>1</sub>', { hl: true });
    sim.out('c10', 'Desviación del armónico 10');
    const tone = (B) => { const f1 = sim.p.f1, f0 = f1 / Math.sqrt(1 + B); const fs = []; for (let n = 1; n <= 30; n++) { const f = n * f0 * Math.sqrt(1 + B * n * n); if (f < 15000) fs.push([f, 1 / n]); } return (t) => fs.reduce((s, [f, a], i) => s + a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * (0.6 + 0.15 * i)), 0); };
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const cents = (n) => 1200 * Math.log2(Math.sqrt(1 + p.B * n * n) / Math.sqrt(1 + p.B));
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.3, xmax: 20.7, ymin: 0, ymax: Math.max(10, cents(20) * 1.1), xlabel: 'armónico n', ylabel: 'desviación (cents)', ml: 56, xticks: [1, 5, 10, 15, 20] });
      pl.frame();
      for (let n = 1; n <= 20; n++) { const c = cents(n); cv.ctx.fillStyle = EM.alpha('--c2', 0.75); cv.ctx.fillRect(pl.X(n) - 6, pl.Y(c), 12, pl.Y(0) - pl.Y(c)); }
      pl.hline(5, { color: '--ink-3', label: '≈ umbral audible (5 cents)', labelRight: true });
      sim.set('f8', EM.fix(Math.sqrt(1 + 64 * p.B) / Math.sqrt(1 + p.B), 5));
      sim.set('c10', EM.fix(cents(10), 1) + ' cents (' + EM.fix(100 * (Math.sqrt(1 + 100 * p.B) / Math.sqrt(1 + p.B) - 1), 2) + ' %)');
    });
  });
})();
