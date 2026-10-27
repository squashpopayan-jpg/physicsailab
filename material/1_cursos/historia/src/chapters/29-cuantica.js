/* Capítulo 29 — La mecánica cuántica (1925-1935) y sus debates */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* 29.1 Schrödinger: pozos */
  EM.defineSim('schrodinger-pozos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('v', { label: 'Potencial', options: [['pozo', 'Pozo infinito'], ['osc', 'Oscilador armónico'], ['dw', 'Doble pozo'], ['h', 'Átomo de hidrógeno (l = 0)']], value: 'osc' });
    sim.slider('n', { label: 'Estado n', min: 0, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.check('prob', { label: 'Mostrar |ψ|² en lugar de ψ', value: false });
    sim.out('E', 'Energía del estado (unidades naturales)', { hl: true });
    sim.out('r', 'Razón con el nivel anterior');
    sim.note('La ecuación independiente del tiempo \\(-\\tfrac12\\psi\'\'+V\\psi=E\\psi\\) (con \\(\\hbar=m=1\\)) solo tiene solución normalizable para ciertos valores de \\(E\\): la cuantización sale de las condiciones de contorno, sin postulados nuevos. Aquí se resuelve numéricamente en una malla; los valores coinciden con la fórmula exacta cuando existe (\\(n^2\\pi^2/2\\) en el pozo, \\(n+1/2\\) en el oscilador, \\(-1/2n^2\\) en el hidrógeno).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const cfg = { pozo: [() => 0, 0, 1, 300, 0, 25], osc: [(x) => 0.5 * x * x, -6, 6, 500, 0, 8], dw: [(x) => 2 * Math.pow(x * x - 1, 2), -3, 3, 500, 0, 6], h: [(r) => -1 / r, 0, 40, 2000, -0.55, 0.05] }[p.v];
      const res = C.schrodinger1D(cfg[0], cfg[1], cfg[2], cfg[3], 6, true), k = Math.min(p.n, 5);
      const x = res.x, E = res.E, psi = Array.from(res.psi[k]);
      const sgn = psi.reduce((a, v) => a + v, 0) < 0 ? -1 : 1, mx = Math.max(...psi.map(Math.abs)) / 1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: p.v === 'h' ? 0 : cfg[1], xmax: p.v === 'h' ? 25 : cfg[2], ymin: cfg[4] - (p.v === 'h' ? 0.02 : 0.1 * cfg[5]), ymax: cfg[5], xlabel: 'posición', ylabel: 'energía y función de onda (escala arbitraria)' });
      pl.frame();
      pl.fn((xx) => Math.min(cfg[5], Math.max(cfg[4] - 0.5, cfg[0](xx))), { color: '--ink-3', width: 1.6, from: p.v === 'h' ? 0.2 : cfg[1] + 0.001, to: cfg[2] - 0.001 });
      E.forEach((e, i) => pl.hline(e, { color: i === k ? '--accent' : '--ink-3' }));
      const amp = 0.45 * (E[Math.min(k + 1, 5)] - E[Math.max(k - 1, 0)] || 1) / 2 + 0.0001, sc = (p.v === 'h' ? 0.12 : 1) * amp / mx;
      pl.xy(x, psi.map((v) => E[k] + (p.prob ? (v * v / mx) * amp * sgn * sgn : sgn * v * sc)), { color: '--c1', width: 2.2 });
      const ratio = k > 0 ? E[k] / E[k - 1] : NaN;
      sim.set('E', EM.fix(E[k], 4) + '  (exacta: ' + (p.v === 'pozo' ? EM.fix(((k + 1) * (k + 1) * PI * PI) / 2, 4) : p.v === 'osc' ? EM.fix(k + 0.5, 4) : p.v === 'h' ? EM.fix(-0.5 / ((k + 1) * (k + 1)), 4) : 'numérica') + ')');
      sim.set('r', isNaN(ratio) ? '—' : EM.fix(ratio, 3));
    });
  });

  /* 29.2 Incertidumbre */
  EM.defineSim('incertidumbre', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('s', { label: 'Anchura del paquete en posición σₓ', min: 0.3, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.select('f', { label: 'Forma del paquete', options: [['g', 'Gaussiano'], ['s', 'Pozo infinito (estado fundamental)'], ['r', 'Rectangular']], value: 'g' });
    sim.out('dx', 'Δx', { hl: true });
    sim.out('dp', 'Δp = ħ·√⟨ψ′²⟩');
    sim.out('pr', 'Producto Δx·Δp (ħ = 1)');
    sim.note('Heisenberg (1927) razonó con un microscopio de rayos γ; Kennard demostró ese mismo año la desigualdad exacta \\(\\Delta x\\,\\Delta p\\ge\\hbar/2\\), una consecuencia matemática de que posición e impulso sean variables conjugadas de Fourier. Solo el gaussiano alcanza el mínimo. Un paquete más estrecho en \\(x\\) debe ser más ancho en \\(p\\): no es un límite del instrumento, sino de lo que significa «estado».');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, n = 4000, L = 20, xs = Array.from({ length: n }, (_, i) => -L + ((i + 0.5) * 2 * L) / n);
      EM.draw.clear(cv);
      const w = p.s * 2;
      const psi = xs.map((x) => (p.f === 'g' ? Math.exp(-x * x / (4 * p.s * p.s)) : p.f === 's' ? (Math.abs(x) < w ? Math.cos((PI * x) / (2 * w)) : 0) : Math.abs(x) < w ? 1 : 0));
      const u = C.uncertainty(xs, psi);
      const mx = Math.max(...psi), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -8, xmax: 8, ymin: 0, ymax: 1.1, xlabel: 'posición x', ylabel: '|ψ(x)|² (normalizada a 1)' });
      pl.frame(); pl.xy(xs, psi.map((v) => (v * v) / (mx * mx)), { color: '--c1', width: 2.2 });
      /* transformada de Fourier numérica (módulo al cuadrado) */
      const ks = Array.from({ length: 160 }, (_, i) => -4 + (i * 8) / 159), ph = ks.map((k) => { let re = 0, im = 0; for (let i = 0; i < n; i += 4) { re += psi[i] * Math.cos(k * xs[i]); im += psi[i] * Math.sin(k * xs[i]); } return re * re + im * im; });
      const pm = Math.max(...ph), p2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.4, h: H, xmin: -4, xmax: 4, ymin: 0, ymax: 1.1, xlabel: 'impulso p/ħ', ylabel: '|φ(p)|²' });
      p2.frame(); p2.xy(ks, ph.map((v) => v / pm), { color: '--c3', width: 2.2 });
      sim.set('dx', EM.fix(u.dx, 4)); sim.set('dp', EM.fix(u.dp, 4)); sim.set('pr', EM.fix(u.dx * u.dp, 4) + (u.dx * u.dp < 0.4999 ? '' : ' ≥ 0.5'));
    });
  });

  /* 29.3 Davisson–Germer */
  EM.defineSim('davisson-germer', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía de los electrones', min: 20, max: 200, step: 1, value: 54, fmt: (v) => v.toFixed(0) + ' eV' });
    sim.out('l', 'Longitud de onda de de Broglie h/√(2mE)', { hl: true });
    sim.out('a', 'Ángulo del máximo con d = 0.215 nm (λ = d sen φ)');
    sim.out('m', 'Ángulo medido por Davisson y Germer a 54 eV');
    sim.note('Davisson y Germer, en los Bell Telephone Laboratories, estudiaban la dispersión de electrones por níquel; un accidente (la rotura del tubo de vacío) cristalizó la muestra y apareció un máximo intenso. En 1927 vieron que el máximo está a 50° con 54 eV, justo donde la fórmula de Bragg con la longitud de onda de de Broglie lo coloca (\\(\\lambda=0.167\\) nm). G. P. Thomson obtuvo la difracción con electrones rápidos en láminas finas el mismo año. Davisson y Thomson compartieron el Nobel de 1937.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, lam = C.deBroglieNm(p.E), a = C.davissonAngle(p.E, 0.215);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 20, xmax: 200, ymin: 0, ymax: 90, xlabel: 'energía de los electrones (eV)', ylabel: 'ángulo del primer máximo (°)' });
      pl.frame(); pl.fn((e) => (C.davissonAngle(e, 0.215) * 180) / PI, { color: '--c1', width: 2.4 }); pl.dot(54, 50, { color: '--accent', r: 7 }); EM.text(ctx, 'medido (54 eV, 50°)', pl.X(54) + 10, pl.Y(50) - 10, { size: 10.5, color: '--accent' });
      pl.dot(p.E, isNaN(a) ? 0 : (a * 180) / PI, { color: '--c2', r: 5 });
      const cx = W * 0.8, cy = H * 0.7; ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 70, cy); ctx.lineTo(cx + 70, cy); ctx.stroke();
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy); ctx.stroke();
      if (!isNaN(a)) { ctx.strokeStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * 150, cy - Math.cos(a) * 150); ctx.stroke(); }
      sim.set('l', EM.fix(lam, 4) + ' nm'); sim.set('a', isNaN(a) ? 'no hay máximo (λ > d)' : EM.fix((a * 180) / PI, 1) + '°'); sim.set('m', '50°');
    });
  });

  /* 29.4 Electrones uno a uno */
  EM.defineSim('electrones-doble', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de electrones detectados', min: 10, max: 20000, step: 10, value: 500, fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda (relativa)', min: 0.5, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.check('cl', { label: 'Mostrar una distribución clásica (sin interferencia)', value: false });
    sim.out('v', 'Visibilidad de las franjas medida', { hl: true });
    sim.note('Cada electrón llega como un punto único (partícula), pero la distribución de muchos sigue \\(|\\psi|^2\\) con franjas (onda). Merli, Missiroli y Pozzi (Bolonia, 1974) y Tonomura (Hitachi, 1989) vieron cómo las franjas aparecen punto a punto. Lo notable es que el patrón se forma incluso si hay un solo electrón en el aparato a la vez: cada uno «interfiere consigo mismo» (Dirac). Los puntos son simulados con el generador de números aleatorios a partir de la fórmula de interferencia.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, r = rng(1234), ymax = 6e-3, lamN = 550e-9 * p.lam, d = 0.25e-3, a = 0.03e-3;
      EM.draw.clear(cv);
      const bins = new Array(120).fill(0), f = (y) => (p.cl ? C.youngCorpuscular(y, lamN, 1, d, a) : C.youngI(y, lamN, 1, d, a));
      let got = 0, tries = 0;
      const px = [], py = [];
      while (got < p.N && tries < p.N * 50) { tries++; const y = (r() * 2 - 1) * ymax; if (r() < f(y)) { got++; bins[Math.min(119, Math.floor(((y + ymax) / (2 * ymax)) * 120))]++; if (got <= 3000) { px.push(y); py.push(r()); } } }
      ctx.fillStyle = '#080808'; ctx.fillRect(30, 20, W - 60, H * 0.45);
      ctx.fillStyle = '#ffd9a0'; for (let i = 0; i < px.length; i++) ctx.fillRect(30 + ((px[i] + ymax) / (2 * ymax)) * (W - 60), 20 + py[i] * H * 0.45, 1.6, 1.6);
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.52, w: W, h: H * 0.48, xmin: -ymax * 1e3, xmax: ymax * 1e3, ymin: 0, ymax: Math.max(...bins) * 1.1 + 1, xlabel: 'posición en la pantalla (mm)', ylabel: 'cuentas' });
      pl.frame(); pl.xy(bins.map((_, i) => (-ymax + ((i + 0.5) * 2 * ymax) / 120) * 1e3), bins, { color: '--c1', width: 1.8 });
      const mxb = Math.max(...bins.slice(50, 70)), mnb = Math.min(...bins.slice(40, 80));
      sim.set('v', EM.fix((mxb - mnb) / (mxb + mnb + 1e-9), 2) + '  (' + got + ' electrones)');
    });
  });
})();
