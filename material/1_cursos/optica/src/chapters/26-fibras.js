/* Capítulo 26 — Fibras ópticas y guías de onda */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 26.1 Guía plana */
  EM.defineSim('guia-plana', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('d', { label: 'Espesor del núcleo', min: 0.5, max: 12, step: 0.05, value: 4, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.slider('n1', { label: 'Índice del núcleo', min: 1.45, max: 1.6, step: 0.001, value: 1.5, fmt: (v) => v.toFixed(3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 0.6, max: 1.8, step: 0.01, value: 1.55, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.out('V', 'Número V', { hl: true });
    sim.out('m', 'Índices efectivos de los modos TE');
    const n2 = 1.45;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = p.d * 1e-6, lam = p.lam * 1e-6;
      EM.draw.clear(cv);
      const r = OP.slabTE(p.n1, n2, d, lam), V = r.V;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: Math.max(V * 1.1, 2), ymin: 0, ymax: Math.max(V * 1.1, 2), xlabel: 'u = κd/2', ylabel: 'w = γd/2' });
      pl.frame();
      pl.fn((u) => (V * V - u * u > 0 ? Math.sqrt(V * V - u * u) : NaN), { color: '--c2', width: 2 });
      for (let m = 0; m < 10; m++) pl.fn((u) => { const t = Math.tan(u - (m * Math.PI) / 2); return u > (m * Math.PI) / 2 && u < ((m + 1) * Math.PI) / 2 && t > 0 ? u * t : NaN; }, { color: '--accent', width: 1.6, breakJumps: true });
      r.modes.forEach((md) => pl.dot(md.u, Math.sqrt(V * V - md.u * md.u), { color: '--c3', r: 5 }));
      /* perfiles */
      const pp = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -1.6 * p.d, xmax: 1.6 * p.d, ymin: -1.1, ymax: 1.1, xlabel: 'x (µm)', ylabel: 'campo E_y' });
      pp.frame();
      pp.band(-p.d / 2, p.d / 2, { color: '--glass', alpha: 0.18 });
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      r.modes.slice(0, 5).forEach((md, i) => {
        const kx = md.kappa, g = md.gamma, h = d / 2, even = md.m % 2 === 0;
        const core = (x) => (even ? Math.cos(kx * x) : Math.sin(kx * x));
        pp.fn((xu) => { const x = xu * 1e-6; return Math.abs(x) <= h ? core(x) : (even ? 1 : Math.sign(x)) * core(h) * Math.exp(-g * (Math.abs(x) - h)); }, { color: cols[i], width: 2, n: 600 });
      });
      sim.set('V', EM.fix(V, 3) + ' → ' + r.modes.length + ' modo' + (r.modes.length === 1 ? ' (monomodo)' : 's'));
      sim.set('m', r.modes.map((md) => 'TE' + md.m + ': ' + EM.fix(md.neff, 5)).join(' · '));
    });
  });

  /* 26.2 Modos LP */
  EM.defineSim('fibra-lp', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Radio del núcleo', min: 1, max: 12, step: 0.05, value: 4.1, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.slider('NA', { label: 'Apertura numérica', min: 0.05, max: 0.3, step: 0.001, value: 0.12, fmt: (v) => v.toFixed(3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 0.6, max: 1.7, step: 0.005, value: 1.55, unit: 'µm', fmt: (v) => v.toFixed(3) });
    sim.out('V', 'Número V', { hl: true });
    sim.out('md', 'Modos guiados');
    sim.out('mfd', 'Diámetro de campo modal (Marcuse)');
    const MODES = [[0, 1, 'LP₀₁', '--accent'], [1, 1, 'LP₁₁', '--c2'], [2, 1, 'LP₂₁', '--c3'], [0, 2, 'LP₀₂', '--c4'], [3, 1, 'LP₃₁', '--c5'], [1, 2, 'LP₁₂', '--c1']];
    let curves = null;
    const build = () => { curves = MODES.map(([l, m]) => { const pts = []; for (let V = 0.05; V <= 7; V += 0.05) { const b = OP.lpB(l, V, m); if (b !== null && isFinite(b)) pts.push([V, b]); } return pts; }); };
    sim.onDraw(() => {
      if (!curves) build();
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const V = (2 * Math.PI * p.a) / p.lam * p.NA;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 7, ymin: 0, ymax: 1, xlabel: 'V', ylabel: 'b (índice efectivo normalizado)' });
      pl.frame();
      curves.forEach((c, i) => { if (c.length) { pl.path(c, { color: MODES[i][3], width: 2 }); const q = c[Math.min(c.length - 1, 8)]; pl.label(q[0], q[1], MODES[i][2], { dx: 2, dy: -6, size: 11, color: MODES[i][3] }); } });
      pl.vline(2.405, { color: '--ink-3', label: '2.405', labelY: 14 });
      pl.vline(Math.min(V, 7), { color: '--ink', dash: [] });
      const guided = MODES.filter(([l, m]) => { const b = OP.lpB(l, V, m); return b !== null && b > 0; }).map((x) => x[2]);
      sim.set('V', EM.fix(V, 3));
      sim.set('md', guided.join(', ') + (V < 2.405 ? ' (monomodo)' : ''));
      sim.set('mfd', EM.fix(2 * p.a * OP.marcuse(V), 2) + ' µm' + (V < 0.8 || V > 2.5 ? ' (fórmula válida para 0.8 < V < 2.5)' : ''));
    });
  });

  /* 26.3 Atenuación */
  EM.defineSim('atenuacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.check('oh', { label: 'Pico de absorción del OH', value: true });
    sim.slider('lam', { label: 'Longitud de onda', min: 0.7, max: 1.7, step: 0.005, value: 1.55, unit: 'µm', fmt: (v) => v.toFixed(3) });
    sim.slider('L', { label: 'Longitud del enlace', min: 1, max: 200, step: 1, value: 80, unit: 'km', fmt: (v) => v.toFixed(0) });
    sim.out('a', 'Atenuación', { hl: true });
    sim.out('P', 'Fracción que llega');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, oh = p.oh ? 1 : 0;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.7, xmax: 1.7, ylog: true, ymin: 0.08, ymax: 10, xlabel: 'λ (µm)', ylabel: 'atenuación (dB/km)' });
      pl.frame();
      for (const [l, lab] of [[0.85, '850'], [1.31, '1310'], [1.55, '1550']]) pl.vline(l, { color: '--gold', label: lab, labelY: 14 });
      pl.fn((l) => 0.75 / Math.pow(l, 4), { color: '--c1', width: 1.2, dash: [5, 4] });
      pl.fn((l) => 6e11 * Math.exp(-48.48 / l), { color: '--c2', width: 1.2, dash: [5, 4] });
      pl.fn((l) => OP.fiberLoss(l, oh), { color: '--accent', width: 2.4, n: 800 });
      pl.dot(p.lam, OP.fiberLoss(p.lam, oh), { color: '--c2', r: 6 });
      pl.legend([{ label: 'total (modelo)', color: '--accent' }, { label: 'Rayleigh ∝ λ⁻⁴', color: '--c1', dash: [5, 4] }, { label: 'absorción infrarroja', color: '--c2', dash: [5, 4] }], 'tr');
      const a = OP.fiberLoss(p.lam, oh);
      sim.set('a', EM.fix(a, 3) + ' dB/km');
      sim.set('P', EM.sci(Math.pow(10, (-a * p.L) / 10), 3) + ' (' + EM.fix(a * p.L, 1) + ' dB)');
    });
  });

  /* 26.4 Dispersión cromática */
  EM.defineSim('dispersion-fibra', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('lam', { label: 'Longitud de onda', min: 1.1, max: 1.7, step: 0.001, value: 1.55, unit: 'µm', fmt: (v) => v.toFixed(3) });
    sim.slider('dl', { label: 'Ancho espectral de la fuente', min: 0.01, max: 2, step: 0.01, value: 0.1, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.slider('L', { label: 'Distancia', min: 1, max: 200, step: 1, value: 100, unit: 'km', fmt: (v) => v.toFixed(0) });
    sim.slider('T0', { label: 'Ancho inicial del pulso (FWHM)', min: 10, max: 500, step: 5, value: 100, unit: 'ps', fmt: (v) => v.toFixed(0) });
    sim.out('D', 'D del material (sílice)', { hl: true });
    sim.out('dt', 'Ensanchamiento |D| L Δλ');
    sim.out('Tf', 'Ancho final √(T₀² + Δτ²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Dm = (l) => OP.matDispersion(OP.SELL.silica, l);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 1.1, xmax: 1.7, ymin: -25, ymax: 35, xlabel: 'λ (µm)', ylabel: 'D (ps/(nm·km))' });
      pl.frame();
      pl.fn(Dm, { color: '--accent', width: 2.4 });
      pl.vline(1.2727, { color: '--ink-3', label: 'D = 0', labelY: 14 });
      pl.dot(p.lam, Dm(p.lam), { color: '--c2', r: 6 });
      const dt = Math.abs(Dm(p.lam)) * p.L * p.dl, Tf = Math.hypot(p.T0, dt);
      const tmax = Math.max(3 * Tf, 3 * p.T0);
      const pp = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: -tmax, xmax: tmax, ymin: 0, ymax: 1.05, xlabel: 't (ps)', ylabel: 'potencia' });
      pp.frame();
      const gss = (t, F) => Math.exp((-4 * Math.LN2 * t * t) / (F * F));
      pp.fn((t) => gss(t, p.T0), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pp.fn((t) => (p.T0 / Tf) * gss(t, Tf), { color: '--accent', width: 2.2 });
      pp.legend([{ label: 'entrada', color: '--ink-3', dash: [5, 4] }, { label: 'salida', color: '--accent' }], 'tr');
      sim.set('D', EM.fix(Dm(p.lam), 2) + ' ps/(nm·km)');
      sim.set('dt', EM.fix(dt, 1) + ' ps');
      sim.set('Tf', EM.fix(Tf, 1) + ' ps');
    });
  });
})();
