/* Capítulo 30 — El núcleo, la fisión y la guerra */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* 30.1 Energía de enlace */
  EM.defineSim('energia-enlace', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('semf', { label: 'Fórmula semiempírica de masas', value: true });
    sim.slider('A', { label: 'Número másico A del núcleo marcado', min: 4, max: 250, step: 1, value: 235, fmt: (v) => v.toFixed(0) });
    sim.out('b', 'B/A de la fórmula para el núcleo más estable de ese A', { hl: true });
    sim.out('r', 'Energía liberada al partirlo en dos mitades iguales (MeV)');
    sim.note('La energía de enlace por nucleón sube hasta el hierro y el níquel y luego baja suavemente: de ahí que la fusión de núcleos ligeros y la fisión de núcleos pesados liberen energía. La fórmula semiempírica de Weizsäcker (1935), basada en la gota líquida de Bohr y Frenkel, reproduce la curva con cinco términos: volumen, superficie, repulsión de Coulomb, asimetría de neutrones y protones, y apareamiento. Meitner y Frisch la usaron para ver que un núcleo de uranio cargado se deforma y se parte como una gota.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const zst = (A) => { let best = 1, bb = -1e9; for (let Z = 1; Z < A; Z++) { const b = C.bindingSEMF(Z, A); if (b > bb) { bb = b; best = Z; } } return best; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 250, ymin: 0, ymax: 10, xlabel: 'número másico A', ylabel: 'energía de enlace por nucleón (MeV)' });
      pl.frame();
      if (p.semf) { const xs = [], ys = []; for (let A = 8; A <= 250; A += 1) { xs.push(A); ys.push(C.bindingSEMF(zst(A), A) / A); } pl.xy(xs, ys, { color: '--c1', width: 2.2 }); }
      C.BINDING.forEach((d) => { pl.dot(d[2], d[3], { color: '--accent', r: 5 }); EM.text(ctx, d[0], pl.X(d[2]) + 6, pl.Y(d[3]) + 14, { size: 10, color: '--ink-2' }); });
      pl.vline(p.A, { color: '--ink-3' });
      const Z = zst(p.A), a = Math.floor(p.A / 2), b = p.A - a, Za = zst(a), Zb = zst(b);
      const Q = C.bindingSEMF(Za, a) + C.bindingSEMF(Zb, b) - C.bindingSEMF(Z, p.A);
      sim.set('b', EM.fix(C.bindingSEMF(Z, p.A) / p.A, 3) + ' MeV (Z = ' + Z + ')');
      sim.set('r', EM.fix(Q, 1) + ' MeV' + (Q > 0 ? ' (la fisión libera energía)' : ' (la fisión consume energía)'));
    });
  });

  /* 30.2 Reacción en cadena */
  EM.defineSim('cadena-neutrones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('k', { label: 'Neutrones que provocan nueva fisión por fisión (k)', min: 0.5, max: 3, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.slider('g', { label: 'Generaciones', min: 5, max: 40, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.out('q', 'Probabilidad de que una cadena se extinga por azar', { hl: true });
    sim.out('f', 'Cadenas simuladas que crecen más de 1000 neutrones (de 200)');
    sim.note('Si cada fisión provoca en promedio \\(k\\) fisiones nuevas, la población crece como \\(k^n\\): explosiva para \\(k>1\\), apagada para \\(k<1\\), estable si \\(k=1\\) (Fermi, Chicago, 2 de diciembre de 1942: \\(k=1.0006\\) con los neutrones retardados). Pero el proceso es aleatorio: aun con \\(k>1\\), una cadena puede extinguirse al principio. La probabilidad de extinción \\(q\\) cumple \\(q=e^{k(q-1)}\\) (proceso de ramificación de Poisson). Szilárd tuvo la idea en 1933 al cruzar una calle de Londres, antes de que se descubriera la fisión.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, r = rng(99), runs = 200, ymax = 1000, curves = [];
      EM.draw.clear(cv);
      const pois = (lam) => { let L = Math.exp(-lam), k = 0, pp = 1; do { k++; pp *= r(); } while (pp > L && k < 200); return k - 1; };
      let grow = 0;
      for (let i = 0; i < runs; i++) { let n = 1; const c = [1]; for (let g = 0; g < p.g; g++) { let m = 0; for (let j = 0; j < Math.min(n, 400); j++) m += pois(p.k); if (n > 400) m = Math.round(m * (n / 400)); n = m; c.push(n); if (n === 0 || n > 1e7) { for (let h = g + 1; h < p.g; h++) c.push(n); break; } } curves.push(c); if (c[c.length - 1] > ymax) grow++; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: p.g, ymin: 0.5, ymax: 1e7, ylog: true, xlabel: 'generación', ylabel: 'neutrones' });
      pl.frame();
      curves.slice(0, 60).forEach((c) => pl.xy(c.map((_, i) => i), c.map((v) => Math.max(v, 0.6)), { color: '--c1', width: 1, alpha: 0.5 }));
      pl.fn((g) => Math.pow(p.k, g), { color: '--accent', width: 2.4, from: 0, to: p.g });
      sim.set('q', EM.fix(C.extinction(p.k), 4)); sim.set('f', grow + ' de ' + runs);
    });
  });

  /* 30.3 Taylor y Trinity */
  EM.defineSim('trinity-taylor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rho', { label: 'Densidad del aire', min: 1.0, max: 1.3, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) + ' kg/m³' });
    sim.check('fit', { label: 'Ajuste log–log', value: true });
    sim.out('m', 'Pendiente de log R frente a log t (Taylor: 2/5 = 0.4)', { hl: true });
    sim.out('e', 'Energía de la explosión de Taylor (R ∝ (E t²/ρ)^{1/5}, ξ = 1.033)');
    sim.note('En 1947 la revista <em>Life</em> publicó fotografías de la bola de fuego de Trinity (16 de julio de 1945) con una escala de tiempos, pero el rendimiento era secreto. Geoffrey Taylor, que ya había calculado en 1941 la propagación de una explosión puntual por análisis dimensional, lo dedujo de las fotos: solo \\(E\\), \\(\\rho\\) y \\(t\\) pueden formar un radio, de modo que \\(R=\\xi\\,(Et^2/\\rho)^{1/5}\\). Taylor obtuvo unos 17 kt (1950); con el ajuste de esta figura sale una cifra próxima al valor oficial de 21 kt: la cifra «secreta» salió de una fotografía publicada y de papel y lápiz.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, T = C.TRINITY, x = T.map((d) => Math.log10(d[0] * 1e-3)), y = T.map((d) => Math.log10(d[1])), f = C.linfit(x.map((v) => v * Math.LN10), y.map((v) => v * Math.LN10));
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -4.2, xmax: -1.1, ymin: 0.9, ymax: 2.5, xlabel: 'log₁₀ t (s)', ylabel: 'log₁₀ R (m)' });
      pl.frame(); T.forEach((d, i) => pl.dot(x[i], y[i], { color: '--accent', r: 4 }));
      if (p.fit) pl.fn((xx) => (f.b + f.m * xx * Math.LN10) / Math.LN10, { color: '--c1', width: 2.2 });
      const es = T.filter((d) => d[0] >= 1).map((d) => C.taylorYield(d[1], d[0] * 1e-3, p.rho) / C.KT), em = es.reduce((a, b) => a + b, 0) / es.length;
      sim.set('m', EM.fix(f.m, 3)); sim.set('e', EM.fix(em, 1) + ' kt de TNT  (oficial: 21 kt)');
    });
  });
})();
