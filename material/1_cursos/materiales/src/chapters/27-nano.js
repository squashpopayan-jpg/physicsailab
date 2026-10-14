/* Capítulo 27 — Nanomateriales y caracterización */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const hb = 1.054571817e-34, me = 9.1093837015e-31, e = 1.602176634e-19, e0 = 8.8541878128e-12, h = 6.62607015e-34, c = 299792458;

  EM.defineSim('nano-size', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('d', { label: 'Diámetro de la partícula de oro', min: 1.5, max: 100, step: 0.1, value: 5, unit: 'nm', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.out('fs', 'Fracción de átomos superficiales', { hl: true });
    sim.out('Tm', 'Temperatura de fusión estimada');
    sim.out('N', 'Átomos en la partícula');
    const Tm = (d) => 1337 * (1 - (4 * 0.27) / (63.7 * 19.3e6 * d * 1e-9));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 1, xmax: 100, ymin: 0, ymax: 1, xlog: true, xlabel: 'd (nm)', ylabel: 'fracción superficial', ml: 46 });
      pl.frame();
      pl.fn((d) => Math.min(1, (6 * 0.288) / d), { color: '--c1', width: 2.4 });
      pl.dot(p.d, Math.min(1, (6 * 0.288) / p.d), { color: '--accent' });
      const pt = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 1, xmax: 100, ymin: 400, ymax: 1400, xlog: true, xlabel: 'd (nm)', ylabel: 'T_f (K)', ml: 46 });
      pt.frame();
      pt.fn(Tm, { color: '--accent', width: 2.4 });
      pt.hline(1337, { color: '--ink-3', label: 'oro macizo 1337 K' });
      /* puntos aproximados de Buffat y Borel (1976) */
      for (const [d, T] of [[2.5, 900], [3, 950], [4, 1050], [5, 1100], [8, 1200], [15, 1290]]) pt.dot(d, T, { color: '--c3', r: 3.5 });
      pt.dot(p.d, Tm(p.d), { color: '--accent' });
      pt.legend([{ label: 'Pawlow simplificado', color: '--accent' }, { label: 'medidas (aprox.)', color: '--c3', kind: 'dot' }], 'br');
      sim.set('fs', EM.fix(100 * Math.min(1, (6 * 0.288) / p.d), 1) + ' %');
      sim.set('Tm', EM.fix(Tm(p.d), 0) + ' K');
      sim.set('N', EM.sci((Math.PI / 6) * Math.pow(p.d * 1e-9, 3) * 5.9e28, 2));
    });
    sim.note('Puntos verdes leídos aproximadamente de la figura de Buffat y Borel (1976); sirven de referencia visual, no como validación precisa.');
  });

  EM.defineSim('quantum-dot', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Radio del punto cuántico', min: 1.5, max: 6, step: 0.05, value: 2.5, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.out('E', 'Energía de emisión', { hl: true });
    sim.out('l', 'Longitud de onda');
    sim.out('t', 'Términos: confinamiento y Coulomb');
    const brus = (r) => { const conf = (hb ** 2 * Math.PI ** 2) / (2 * r * r * me) * (1 / 0.13 + 1 / 0.45) / e, coul = (1.8 * e) / (4 * Math.PI * 10.6 * e0 * r); return [1.74 + conf - coul, conf, coul]; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 1.5, xmax: 6, ymin: 1.6, ymax: 3.5, xlabel: 'radio (nm)', ylabel: 'E (eV)', ml: 46 });
      pl.frame();
      pl.fn((r) => brus(r * 1e-9)[0], { color: '--accent', width: 2.4 });
      pl.hline(1.74, { color: '--ink-3', label: 'E_g macizo 1.74 eV' });
      const [E, cf, cl] = brus(p.r * 1e-9), lam = 1239.84 / E;
      pl.dot(p.r, E, { color: '--accent' });
      const col = EM.wavelengthRGB(lam);
      for (let i = 0; i < 6; i++) { const rr = 1.5 + i * 0.8, [Ei] = brus(rr * 1e-9), ci = EM.wavelengthRGB(1239.84 / Ei); EM.draw.bob(ctx, W * 0.68 + i * W * 0.05, H * 0.82, 6 + rr * 2, { color: `rgb(${ci[0]},${ci[1]},${ci[2]})` }); }
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.38, 12 + p.r * 10, 0, 7); ctx.fill();
      EM.text(ctx, 'color de emisión', W * 0.82, H * 0.08, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('E', EM.fix(E, 3) + ' eV');
      sim.set('l', EM.fix(lam, 0) + ' nm');
      sim.set('t', '+' + EM.fix(cf, 3) + ' eV y −' + EM.fix(cl, 3) + ' eV');
    });
  });

  EM.defineSim('resolution', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('V', { label: 'Voltaje de aceleración de electrones', min: 1, max: 300, step: 1, value: 200, unit: 'kV', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda de la luz', min: 350, max: 700, step: 5, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('NA', { label: 'Apertura numérica del objetivo', min: 0.1, max: 1.45, step: 0.01, value: 1.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('lo', 'Resolución óptica 0.61λ/AN', { hl: true });
    sim.out('le', 'λ de los electrones (relativista)');
    sim.out('rat', 'Cociente de longitudes de onda');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const V = p.V * 1e3, le = h / Math.sqrt(2 * me * e * V * (1 + (e * V) / (2 * me * c * c)));
      const dopt = (0.61 * p.lam) / p.NA;
      const scale = [['átomo', 2e-10], ['celda unitaria', 4e-10], ['dislocación (núcleo)', 1e-9], ['precipitado GP', 5e-9], ['perlita', 2e-7], ['grano', 2e-5]];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e-12, xmax: 1e-4, ymin: 0, ymax: 4, xlog: true, xlabel: 'tamaño (m)', yticks: [], ml: 20 });
      pl.frame();
      scale.forEach(([t, s], i) => pl.label(s, 3.5 - (i % 2) * 0.4, t, { size: 10.5, align: 'center', color: '--ink-2' }));
      pl.band(dopt * 1e-9, 1e-4, { color: '--c3', alpha: 0.12 });
      pl.vline(dopt * 1e-9, { color: '--c3', dash: [], width: 2, label: 'óptico' });
      pl.vline(le, { color: '--c1', dash: [], width: 2, label: 'λ electrones' });
      pl.vline(7e-11, { color: '--c5', label: 'TEM real ≈ 70 pm', labelY: 40 });
      sim.set('lo', EM.fix(dopt, 0) + ' nm');
      sim.set('le', EM.fix(le * 1e12, 3) + ' pm');
      sim.set('rat', EM.sci((p.lam * 1e-9) / le, 2));
    });
  });
})();
