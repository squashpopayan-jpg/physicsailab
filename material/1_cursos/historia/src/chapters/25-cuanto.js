/* Capítulo 25 — Planck, Einstein y el cuanto */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 25.1 Cuerpo negro */
  EM.defineSim('cuerpo-negro', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 1500, max: 8000, step: 50, value: 5000, fmt: (v) => v.toFixed(0) + ' K' });
    sim.check('rj', { label: 'Mostrar Rayleigh–Jeans (clásica)', value: true });
    sim.check('wi', { label: 'Mostrar la ley de Wien (1896)', value: true });
    sim.out('l', 'Máximo de Planck λ_max = b/T', { hl: true });
    sim.out('p', 'Emitancia total σT⁴ (integral de Planck)');
    sim.note('La curva azul es la ley de Planck. A longitudes de onda largas se parece a Rayleigh–Jeans, que crece sin límite hacia el ultravioleta: integrada daría energía infinita. A longitudes cortas se parece a Wien, que falla en el infrarrojo, donde Rubens y Kurlbaum la contradijeron en octubre de 1900. Planck unió ambos regímenes con una sola fórmula, y solo después buscó su justificación.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, T = p.T;
      EM.draw.clear(cv);
      const ymax = C.planckB(C.wienLambda(T), T) / 1e12 * 1.7;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.1, xmax: 3, ymin: 0, ymax, xlabel: 'longitud de onda (µm)', ylabel: 'radiancia espectral (MW sr⁻¹ m⁻² µm⁻¹)' });
      pl.frame();
      const f = (g) => (x) => g(x * 1e-6, T) / 1e12;
      if (p.rj) pl.fn(f(C.rayleighB), { color: '--c3', width: 1.8, dash: [6, 4] });
      if (p.wi) pl.fn(f(C.wienB), { color: '--c4', width: 1.8, dash: [2, 3] });
      pl.fn(f(C.planckB), { color: '--c1', width: 2.6 });
      pl.vline(C.wienLambda(T) * 1e6, { color: '--accent' });
      sim.set('l', EM.fix(C.wienLambda(T) * 1e9, 0) + ' nm');
      sim.set('p', EM.fix(C.stefanFromPlanck(T) / 1e6, 2) + ' MW/m²');
    });
  });

  /* 25.2 Efecto fotoeléctrico */
  EM.defineSim('fotoelectrico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lam', { label: 'Longitud de onda de la luz', min: 200, max: 700, step: 1, value: 400, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.slider('I', { label: 'Intensidad de la luz', min: 0.1, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) });
    sim.slider('phi', { label: 'Función de trabajo del metal', min: 1.8, max: 5, step: 0.05, value: 2.28, fmt: (v) => v.toFixed(2) + ' eV' });
    sim.out('K', 'Energía máxima de los electrones hν − φ', { hl: true });
    sim.out('n', 'Corriente (número de electrones, ∝ intensidad si hay emisión)');
    sim.out('t', 'Frecuencia umbral del metal');
    sim.note('Lenard (1902) mostró que la energía de los electrones arrancados no depende de la intensidad de la luz sino de su color; la teoría ondulatoria clásica predecía lo contrario. Einstein (1905) lo explicó con cuantos de energía \\(h\\nu\\): cada uno arranca un electrón con la energía que sobra tras pagar \\(\\phi\\). Millikan (1916), que quería refutarlo, midió la recta \\(V_p(\\nu)\\) y obtuvo \\(h\\) con 0.5 % de exactitud.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, nu = K.c / (p.lam * 1e-9), Vp = C.stopV(nu, p.phi);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 1.6, ymin: 0, ymax: 5, xlabel: 'frecuencia (10¹⁵ Hz)', ylabel: 'tensión de frenado (V)' });
      pl.frame(); pl.fn((x) => C.stopV(x * 1e15, p.phi), { color: '--c1', width: 2.4 }); pl.dot(nu / 1e15, Vp, { color: '--accent', r: 6 });
      const x0 = W * 0.64, y0 = H * 0.62, rgb = EM.wavelengthRGB(Math.max(380, Math.min(780, p.lam)));
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(x0, y0, W * 0.3, 8);
      const emit = Vp > 0;
      for (let i = 0; i < 6 * p.I; i++) { const x = x0 + 12 + (i * 37) % (W * 0.28); ctx.strokeStyle = p.lam < 380 ? '#8855cc' : EM.rgbStr(rgb); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y0 - 80 - (i % 3) * 14); ctx.lineTo(x, y0 - 2); ctx.stroke(); if (emit) { ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(x + 8 + Math.min(40, Vp * 10), y0 - 12 - (i % 3) * 10, 3, 0, TAU); ctx.fill(); } }
      EM.text(ctx, 'metal', x0, y0 + 24, { size: 11, color: '--ink-2' });
      sim.set('K', Vp > 0 ? EM.fix(Vp, 3) + ' eV' : 'ninguna: la luz no tiene energía suficiente');
      sim.set('n', emit ? EM.fix(p.I, 1) + ' (relativa)' : '0, con cualquier intensidad');
      sim.set('t', EM.fix(C.threshNu(p.phi) / 1e14, 2) + '×10¹⁴ Hz (' + EM.fix(K.c / C.threshNu(p.phi) * 1e9, 0) + ' nm)');
    });
  });

  /* 25.3 Calor específico de Einstein */
  EM.defineSim('calor-einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('th', { label: 'Temperatura de Einstein θ_E', min: 200, max: 1800, step: 10, value: 1300, fmt: (v) => v.toFixed(0) + ' K' });
    sim.out('c', 'Calor específico a 300 K', { hl: true });
    sim.out('r', 'Fracción de la ley de Dulong y Petit (3R)');
    sim.note('Dulong y Petit (1819) hallaron que el calor específico molar de los sólidos es ≈ 3R = 24.9 J/(mol·K). Pero el diamante, el silicio y el boro a temperatura ambiente tienen mucho menos (H. F. Weber, 1875), y todos tienden a cero al enfriarse. Einstein (1907) trató los átomos como osciladores cuantizados y obtuvo la caída; Nernst, con calorimetría a baja temperatura, la confirmó en 1910 y esto convenció a muchos de que el cuanto no era un artificio.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, R3 = 3 * K.kB * K.NA;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1500, ymin: 0, ymax: 27, xlabel: 'temperatura (K)', ylabel: 'C_V (J mol⁻¹ K⁻¹)' });
      pl.frame(); pl.hline(R3, { color: '--c3', label: '3R (Dulong y Petit)', labelRight: true });
      pl.fn((T) => (T < 1 ? 0 : C.einsteinCV(T, p.th)), { color: '--c1', width: 2.4 });
      pl.dot(300, C.einsteinCV(300, p.th), { color: '--accent', r: 6 });
      sim.set('c', EM.fix(C.einsteinCV(300, p.th), 2) + ' J/(mol·K)');
      sim.set('r', EM.fix((100 * C.einsteinCV(300, p.th)) / R3, 1) + ' %');
    });
  });
})();
