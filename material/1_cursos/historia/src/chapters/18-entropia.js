/* Capítulo 18 — Entropía, átomos y probabilidad */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 18.1 Relajación a la distribución de Maxwell */
  EM.defineSim('maxwell-boltzmann', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('ini', { label: 'Condición inicial', options: [['igual', 'Todas con la misma rapidez'], ['dos', 'Dos grupos (lentas y rápidas)'], ['una', 'Una sola muy rápida']], value: 'igual', onInput: () => init() });
    sim.slider('vel', { label: 'Colisiones por fotograma', min: 1, max: 400, step: 1, value: 60, fmt: (v) => v.toFixed(0) });
    sim.button('Revertir las velocidades (Loschmidt)', () => { for (const q of V) { q[0] = -q[0]; q[1] = -q[1]; } });
    sim.out('c', 'Colisiones totales', { hl: true });
    sim.out('H', 'H = ∫ f ln f (decrece hasta un mínimo)');
    sim.out('ks', 'Distancia máxima a la curva de Maxwell (Kolmogórov–Smirnov)');
    sim.out('E', 'Energía y momento totales (conservados)');
    sim.note('Boltzmann (1872): las colisiones al azar entre moléculas llevan cualquier distribución inicial a la de Maxwell, y la magnitud \\(H=\\int f\\ln f\\,\\dd v\\) disminuye. Aquí 800 partículas intercambian velocidades en colisiones elásticas con ángulo al azar (la hipótesis del «caos molecular», <em>Stosszahlansatz</em>). El botón de Loschmidt (1876) invierte todas las velocidades: las mismas leyes mecánicas, reversibles, harían que el sistema «des-relajara». No ocurre en la práctica porque la inversión exigiría una precisión absoluta.');
    const N = 800; let V, t, rng, ncol;
    const init = () => {
      rng = C.rng(77); V = []; ncol = 0;
      for (let i = 0; i < N; i++) { let v = 1, th = rng() * TAU; if (sim.p.ini === 'dos') v = rng() < 0.5 ? 0.4 : 1.6; if (sim.p.ini === 'una') v = i === 0 ? 20 : 0.05; V.push([v * Math.cos(th), v * Math.sin(th)]); }
    };
    sim.p.ini = 'igual'; init(); sim.resetButton(init);
    sim.animate(() => { const n = Math.round(sim.p.vel); for (let k = 0; k < n; k++) { const a = Math.floor(rng() * N); let b = Math.floor(rng() * N); if (a === b) b = (b + 1) % N; const r = C.collide2D(V[a], V[b], rng() * TAU); V[a] = r[0]; V[b] = r[1]; ncol++; } });
    const stats = () => { const sp = V.map((q) => Math.hypot(q[0], q[1])); let e = 0, px = 0, py = 0; V.forEach((q) => { e += 0.5 * (q[0] * q[0] + q[1] * q[1]); px += q[0]; py += q[1]; }); const s2 = (2 * e) / (2 * N); return { sp, e, px, py, s2 }; };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h; EM.draw.clear(cv);
      const { sp, e, px, py, s2 } = stats(), nb = 40, vmax = 4 * Math.sqrt(s2) + 0.5, bins = new Array(nb).fill(0);
      sp.forEach((v) => { const i = Math.min(nb - 1, Math.floor((v / vmax) * nb)); bins[i]++; });
      const dens = bins.map((b) => b / (N * (vmax / nb)));
      const fmax = Math.max(...dens, 0.8 / Math.sqrt(s2));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: vmax, ymin: 0, ymax: fmax * 1.1, xlabel: 'rapidez v', ylabel: 'densidad de probabilidad f(v)' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.45); dens.forEach((d, i) => { const x0 = pl.X((i * vmax) / nb), x1 = pl.X(((i + 1) * vmax) / nb), y = pl.Y(d); ctx.fillRect(x0 + 1, y, x1 - x0 - 1, pl.Y(0) - y); });
      pl.fn((v) => C.maxwell2D(v, s2), { color: '--c2', width: 2.4 });
      let Hn = 0; dens.forEach((d) => { if (d > 0) Hn += d * Math.log(d) * (vmax / nb); });
      const sorted = sp.slice().sort((a, b) => a - b); let ks = 0; sorted.forEach((v, i) => { const F = C.maxwell2Dcdf(v, s2); ks = Math.max(ks, Math.abs((i + 1) / N - F), Math.abs(i / N - F)); });
      sim.set('c', ncol.toLocaleString('es'));
      sim.set('H', EM.fix(Hn, 3));
      sim.set('ks', EM.fix(ks, 3) + (ks < 0.04 ? '  (≈ Maxwell)' : ''));
      sim.set('E', EM.fix(e, 2) + ' ; p = (' + EM.fix(px, 2) + ', ' + EM.fix(py, 2) + ')');
    });
  });

  /* 18.2 Urna de Ehrenfest */
  EM.defineSim('ehrenfest', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de bolas', min: 4, max: 400, step: 2, value: 40, fmt: (v) => v.toFixed(0), onInput: () => init() });
    sim.slider('v', { label: 'Pasos por fotograma', min: 1, max: 200, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Bolas en la caja izquierda', { hl: true });
    sim.out('S', 'Entropía de Boltzmann S/k = ln W');
    sim.out('rec', 'Tiempo de recurrencia típico del estado inicial (todas a la izquierda)');
    sim.note('Ehrenfest (1907): N bolas en dos cajas; en cada paso una bola elegida al azar cambia de caja. Partiendo de todas en una, el sistema se equilibra (≈ N/2 en cada una) y la entropía \\(S=k\\ln W\\), con \\(W=\\binom Nn\\) combinaciones, crece. Pero es un proceso reversible y recurrente: Poincaré (1890) y Zermelo (1896) mostraron que el estado inicial volverá a darse, aunque tras un tiempo de \\(2^N\\) pasos. Para N = 20 son un millón; para un mol de gas, \\(10^{10^{23}}\\) pasos: nunca.');
    let n, N, hist, rng, steps;
    const init = () => { N = Math.round(sim.p.N); n = N; hist = []; rng = C.rng(5); steps = 0; };
    sim.p.N = 40; init(); sim.resetButton(init); sim.onChange = (id) => { if (id === 'N') init(); };
    sim.animate(() => { for (let k = 0; k < Math.round(sim.p.v); k++) { n = C.ehrenfestStep(n, N, rng); steps++; hist.push(n); if (hist.length > 1200) hist.shift(); } });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h; EM.draw.clear(cv);
      const half = W * 0.55;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: half, h: H, xmin: 0, xmax: Math.max(300, hist.length), ymin: 0, ymax: N, xlabel: 'tiempo (pasos recientes)', ylabel: 'bolas en la caja izquierda' });
      pl.frame(); pl.hline(N / 2, { color: '--ink-3' });
      pl.xy(hist.map((_, i) => i), hist, { color: '--c1', width: 1.6 });
      const bw = (W - half - 20) / 2, bx = half + 10, by = 40, bh = H * 0.55;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw - 4, bh); ctx.strokeRect(bx + bw + 4, by, bw - 4, bh);
      const rr = EM.M.clamp(bw / (Math.sqrt(N) * 2.4), 1.5, 7), g = C.rng(9);
      for (let i = 0; i < N; i++) { const left = i < n, x = bx + (left ? 0 : bw + 4) + 6 + g() * (bw - 16), y = by + 6 + g() * (bh - 12); ctx.fillStyle = EM.col(left ? '--c1' : '--c2'); ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
      EM.text(ctx, 'S/k = ' + EM.fix(C.lnBinom(N, n), 1) + '  (máx. ' + EM.fix(C.lnBinom(N, Math.round(N / 2)), 1) + ')', bx, by + bh + 26, { size: 12, color: '--ink-2' });
      sim.set('n', n + ' de ' + N + '  (equilibrio ' + N / 2 + ')');
      sim.set('S', EM.fix(C.lnBinom(N, n), 2) + '  = ' + EM.fix(C.lnBinom(N, n) / Math.LN2, 2) + ' bits');
      sim.set('rec', N <= 60 ? EM.sci(Math.pow(2, N), 2) + ' pasos' : '2^' + N + ' ≈ ' + EM.sci(Math.pow(2, Math.min(N, 1000)), 2) + ' pasos');
    });
  });

  /* 18.3 Perrin y el número de Avogadro */
  EM.defineSim('perrin', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('r', { label: 'Radio de los granos de gutagamba', min: 0.1, max: 0.7, step: 0.005, value: 0.212, fmt: (v) => v.toFixed(3) + ' µm' });
    sim.slider('drho', { label: 'Exceso de densidad respecto del agua', min: 50, max: 500, step: 1, value: 206, fmt: (v) => v.toFixed(0) + ' kg/m³' });
    sim.slider('T', { label: 'Temperatura', min: 273, max: 323, step: 1, value: 293, fmt: (v) => v.toFixed(0) + ' K' });
    sim.slider('err', { label: 'Error de la altura medida', min: 0, max: 30, step: 1, value: 10, fmt: (v) => v.toFixed(0) + ' %' });
    sim.button('Otra tanda', () => { seed++; sim.redraw(); });
    sim.out('hs', 'Altura de escala h_s = kT/(m′g)', { hl: true });
    sim.out('half', 'Altura a la que la concentración se reduce a la mitad');
    sim.out('NA', 'N_A deducido con la altura «medida»');
    sim.note('Perrin (1908-1909) contó al microscopio granos de gutagamba de tamaño uniforme en la columna de agua: su concentración cae con la altura como \\(n(h)=n_0\\ee^{-m\'gh/kT}\\) (la ley de las atmósferas, pero con partículas visibles). Midiendo el tamaño de los granos y la altura de escala, se obtiene \\(k\\) y, con la constante de los gases, \\(N_A=R/k\\): de 6.5 a 7.2 ×10²³, igual por doce métodos distintos. Ostwald y Mach no pudieron seguir negando los átomos.');
    let seed = 1;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, hs = C.perrinScale(p.r, p.drho, p.T), rng = C.rng(300 + seed);
      EM.draw.clear(cv);
      const half = W * 0.4, x0 = 20, y0 = H - 24, y1 = 18, hmax = 4 * hs;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(x0, y1, half - 40, y0 - y1);
      ctx.fillStyle = EM.alpha('--water', 0.12); ctx.fillRect(x0, y1, half - 40, y0 - y1);
      const nP = 700; ctx.fillStyle = EM.alpha('--c4', 0.9);
      for (let i = 0; i < nP; i++) { const h = -hs * Math.log(1 - rng() * (1 - Math.exp(-4))), y = y0 - (h / hmax) * (y0 - y1), x = x0 + 4 + rng() * (half - 48); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
      const pl = new EM.Plot(ctx, { x: half, y: 8, w: W - half - 8, h: H - 16, xmin: 0, xmax: 4, ymin: 0.01, ymax: 1.3, ylog: true, xlabel: 'altura / h_s', ylabel: 'concentración relativa' });
      pl.frame(); pl.fn((x) => Math.exp(-x), { color: '--c2', width: 2.2 });
      for (let k = 0; k <= 8; k++) { const h = k * 0.5; const c = Math.exp(-h) * (1 + 0.06 * rng.gauss() * (1 + 0.5 * h)); pl.dot(h, Math.max(c, 0.011), { color: '--accent', r: 3.5 }); }
      const hMeas = hs * (1 + (p.err / 100) * rng.gauss());
      sim.set('hs', EM.fix(hs * 1e6, 1) + ' µm');
      sim.set('half', EM.fix(hs * 1e6 * Math.LN2, 1) + ' µm  (Perrin: ≈ 30 µm con sus granos)');
      sim.set('NA', EM.sci(C.perrinNA(p.r, p.drho, p.T, hMeas), 3) + ' mol⁻¹  (real: 6.022×10²³)');
    });
  });

  /* 18.4 La edad de la Tierra de Kelvin */
  EM.defineSim('edad-tierra', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('T0', { label: 'Temperatura inicial de la Tierra', min: 1000, max: 6000, step: 50, value: 3900, fmt: (v) => v.toFixed(0) + ' K' });
    sim.slider('G', { label: 'Gradiente geotérmico en la superficie', min: 0.01, max: 0.06, step: 0.0005, value: 0.0365, fmt: (v) => (v * 1000).toFixed(1) + ' K/km' });
    sim.slider('k', { label: 'Difusividad térmica de las rocas', min: 0.5e-6, max: 12e-6, step: 0.1e-6, value: 1.18e-6, fmt: (v) => (v * 1e6).toFixed(2) + ' ×10⁻⁶ m²/s' });
    sim.out('t', 'Edad deducida', { hl: true });
    sim.out('k1', 'Kelvin, 1862: 98 millones (límites 20 a 400)');
    sim.out('real', 'Datación radiactiva (Patterson, 1956): 4 550 millones de años');
    sim.note('Kelvin supuso una Tierra que se enfría solo por conducción desde una temperatura inicial de fusión. El gradiente medido en minas (unos 36 K/km) da la edad \\(t=T_0^2/(\\pi\\kappa G^2)\\): ≈ 100 millones de años, muy poco para Darwin y los geólogos. En 1895 John Perry mostró que si el interior conduce mejor (por convección) la edad sube a miles de millones. La solución real (1903-1905): hay una fuente de calor desconocida para Kelvin, la radiactividad.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, t = C.kelvinAge(p.T0, p.G, p.k) / C.YEAR / 1e6;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.02, xmax: 0.06, ymin: 1, ymax: 10000, xlog: false, ylog: true, xlabel: 'gradiente geotérmico (K/m)', ylabel: 'edad (millones de años)' });
      pl.frame();
      pl.fn((g) => C.kelvinAge(p.T0, g, p.k) / C.YEAR / 1e6, { color: '--c1', width: 2.2, from: 0.02 });
      pl.hline(4550, { color: '--c3', label: 'edad real 4 550 Ma', labelRight: true }); pl.hline(100, { color: '--c2', label: 'Kelvin 1862', labelRight: true }); pl.hline(24, { color: '--ink-3', label: 'Kelvin 1897 (24 Ma)', labelRight: true });
      pl.dot(p.G, t, { color: '--accent', r: 6 });
      sim.set('t', EM.fix(t, 1) + ' millones de años');
      sim.set('k1', 'sus datos: 3900 K, 36.5 K/km, 1.18×10⁻⁶ m²/s');
      sim.set('real', 'Un factor 46 más (con calor radiactivo y convección)');
    });
  });
})();
