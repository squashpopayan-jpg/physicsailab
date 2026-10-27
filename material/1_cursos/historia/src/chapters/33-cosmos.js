/* Capítulo 33 — Cosmología y universo */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 33.1 Hubble 1929 */
  EM.defineSim('hubble-1929', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('fit', { label: 'Ajuste lineal de Hubble (con ordenada)', value: true });
    sim.check('mod', { label: 'Mostrar la ley con H₀ = 70 km/s/Mpc (valor actual)', value: false });
    sim.out('H', 'Pendiente de Hubble 1929', { hl: true });
    sim.out('t', 'Edad 1/H₀ del universo con esa pendiente');
    sim.out('d', 'Edad de la Tierra por datación radiactiva (Holmes, 1927)');
    sim.note('Los 24 puntos de Hubble (1929): velocidad frente a distancia (de la luminosidad de estrellas variables y de las galaxias más brillantes). Hay mucha dispersión y los movimientos propios (hacia nosotros, Andrómeda) no se distinguen de la expansión en las más próximas, pero la tendencia es clara. Su pendiente (≈ 500 km/s/Mpc) implica una edad de 2 Gyr, menor que la de la Tierra: la «crisis de la edad». Se resolvió en 1952, cuando Baade mostró que había dos tipos de cefeidas y que las distancias estaban subestimadas por un factor 5-10.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, D = C.HUBBLE1929, xs = D.map((d) => d[1]), ys = D.map((d) => d[2]), f = C.linfit(xs, ys);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 2.2, ymin: -400, ymax: 1200, xlabel: 'distancia (Mpc, según Hubble 1929)', ylabel: 'velocidad (km/s)' });
      pl.frame(); pl.hline(0, { color: '--ink-3' });
      D.forEach((d) => pl.dot(d[1], d[2], { color: '--accent', r: 4.5 }));
      if (p.fit) pl.fn((x) => f.b + f.m * x, { color: '--c1', width: 2.4 });
      if (p.mod) pl.fn((x) => 70 * x, { color: '--c3', width: 2, dash: [6, 4] });
      sim.set('H', EM.fix(f.m, 0) + ' km/s/Mpc'); sim.set('t', EM.fix(C.hubbleAgeGyr(f.m), 2) + ' Gyr'); sim.set('d', '≥ 3-4.5 Gyr (Holmes), 4.54 Gyr hoy');
    });
  });

  /* 33.2 Curvas de rotación */
  EM.defineSim('curvas-rotacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('M', { label: 'Masa visible (10¹⁰ M☉)', min: 1, max: 12, step: 0.5, value: 6, fmt: (v) => v.toFixed(1) });
    sim.slider('vh', { label: 'Velocidad asintótica del halo', min: 0, max: 250, step: 5, value: 200, fmt: (v) => v.toFixed(0) + ' km/s' });
    sim.out('f', 'Razón v(30 kpc)/v(10 kpc) total', { hl: true });
    sim.out('m', 'Masa total dentro de 30 kpc / masa visible');
    sim.note('Si toda la masa estuviera en las estrellas, la velocidad orbital caería como \\(r^{-1/2}\\) lejos del centro, igual que en el sistema solar (capítulo 10). Zwicky (1933) notó en el cúmulo de Coma que las galaxias se mueven demasiado rápido para la masa visible; Rubin y Ford (1970) midieron la rotación de Andrómeda hasta 24 kpc y hallaron una curva <em>plana</em>: la velocidad no decae. Con \\(v^2=GM(<r)/r\\), eso implica masa que crece con \\(r\\) en regiones donde no se ve luz.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, M = p.M * 1e10;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.5, xmax: 40, ymin: 0, ymax: 300, xlabel: 'distancia al centro (kpc)', ylabel: 'velocidad de rotación (km/s)' });
      pl.frame();
      pl.fn((r) => C.vPlummer(r, M, 3), { color: '--c3', width: 2, dash: [6, 4] });
      pl.fn((r) => C.vHalo(r, p.vh, 5), { color: '--c4', width: 2, dash: [2, 4] });
      pl.fn((r) => C.vTotal(r, M, 3, p.vh, 5), { color: '--c1', width: 2.6 });
      const mt = (M + C.haloMass(30, Math.max(p.vh, 1e-9), 5));
      sim.set('f', EM.fix(C.vTotal(30, M, 3, p.vh, 5) / C.vTotal(10, M, 3, p.vh, 5), 3));
      sim.set('m', EM.fix(mt / M, 2));
    });
  });

  /* 33.3 Supernovas y aceleración */
  EM.defineSim('supernovas-ia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Om', { label: 'Densidad de materia Ωm', min: 0.05, max: 1.0, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.slider('OL', { label: 'Energía oscura ΩΛ', min: 0, max: 1.0, step: 0.01, value: 0.7, fmt: (v) => v.toFixed(2) });
    sim.out('t', 'Edad del universo (H₀ = 70)', { hl: true });
    sim.out('q', 'Parámetro de deceleración hoy q₀ = Ωm/2 − ΩΛ');
    sim.out('d', 'A z = 0.5, magnitud frente a un universo vacío');
    sim.note('Una supernova Ia tiene casi siempre la misma luminosidad máxima, de modo que su brillo da la distancia de luminosidad. Si la expansión se frenara, las supernovas lejanas serían más brillantes que en un universo vacío; si se acelera, más débiles. En 1998 los equipos de Perlmutter y de Schmidt y Riess hallaron que las supernovas a \\(z\\sim0.5\\) son unas 0.25 magnitudes más débiles que en un universo abierto sin \\(\\Lambda\\): la expansión se acelera, con \\(\\Omega_\\Lambda\\approx0.7\\) (Nobel 2011).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, H0 = 70;
      EM.draw.clear(cv);
      const mu = (z, Om, OL) => C.distMod(C.lumDistMpc(z, H0, Om, OL)), ref = (z) => mu(z, 0.0001, 0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.01, xmax: 1.2, ymin: -0.6, ymax: 0.6, xlabel: 'corrimiento al rojo z', ylabel: 'módulo de distancia − universo vacío (mag)' });
      pl.frame(); pl.hline(0, { color: '--ink-3', label: 'universo vacío', labelRight: true });
      pl.fn((z) => mu(z, 1, 0) - ref(z), { color: '--c3', width: 2, label: 'Einstein–de Sitter', from: 0.01 });
      pl.fn((z) => mu(z, 0.3, 0.7) - ref(z), { color: '--c1', width: 2.2, label: 'Ωm = 0.3, ΩΛ = 0.7', from: 0.01 });
      pl.fn((z) => mu(z, p.Om, p.OL) - ref(z), { color: '--accent', width: 2.8, from: 0.01 });
      sim.set('t', EM.fix(C.ageGyr(H0, p.Om, p.OL), 2) + ' Gyr'); sim.set('q', EM.fix(C.q0(p.Om, p.OL), 3) + (C.q0(p.Om, p.OL) < 0 ? ' (acelera)' : ' (frena)')); sim.set('d', EM.fix(mu(0.5, p.Om, p.OL) - ref(0.5), 3) + ' mag');
    });
  });
})();
