/* Capítulo 28 — El átomo de Bohr y la vieja teoría cuántica */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 28.1 Niveles y series del hidrógeno */
  EM.defineSim('niveles-bohr', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Z', { label: 'Carga del núcleo Z (ion con un electrón)', min: 1, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('n1', { label: 'Nivel inferior de la serie', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('s', 'Serie', { hl: true });
    sim.out('l', 'Primeras líneas de la serie (nm, vacío)');
    sim.out('r', 'Radio de la órbita n = 1');
    sim.note('Bohr (1913) postuló que el electrón solo puede estar en órbitas con momento angular \\(L=n\\hbar\\), que no irradia en ellas y que emite o absorbe un fotón \\(h\\nu=E_{n_2}-E_{n_1}\\) al saltar. Con la mecánica clásica y esas reglas obtuvo \\(E_n=-13.6\\,Z^2/n^2\\) eV y la constante de Rydberg en términos de \\(m, e, h\\): sin ningún parámetro libre. Con \\(Z=2\\) predijo las líneas que Pickering había atribuido al hidrógeno, y la razón de masas reducida de 1.0004 las separaba: Fowler lo comprobó en el laboratorio.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, Z = p.Z, n1 = p.n1, nmax = 7, mr = 1836.15267343;
      EM.draw.clear(cv);
      const x0 = 50, x1 = W * 0.48, Y = (E) => 30 + ((E + 13.6 * Z * Z * 1.0) / (13.6 * Z * Z)) * 0 + (-E / (13.6 * Z * Z)) * 0, yb = H - 30, yt = 24;
      const yOf = (n) => yb - (1 - 1 / (n * n)) * (yb - yt);
      for (let n = 1; n <= nmax; n++) { ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, yOf(n)); ctx.lineTo(x1, yOf(n)); ctx.stroke(); EM.text(ctx, 'n=' + n + '  ' + EM.fix(C.levelEv(n, Z, mr), 2) + ' eV', x1 + 6, yOf(n) + 4, { size: 10, color: '--ink-2' }); }
      for (let n2 = n1 + 1; n2 <= nmax; n2++) { const x = x0 + 20 + (n2 - n1) * ((x1 - x0 - 40) / (nmax - n1 + 1)); const l = C.lineVacuumNm(n1, n2, Z, mr), c = EM.wavelengthRGB(Math.max(380, Math.min(780, l))); ctx.strokeStyle = l >= 380 && l <= 780 ? EM.rgbStr(c) : EM.col('--ink-3'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, yOf(n2)); ctx.lineTo(x, yOf(n1)); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(x, yOf(n1)); ctx.lineTo(x - 4, yOf(n1) - 8); ctx.lineTo(x + 4, yOf(n1) - 8); ctx.fill(); }
      const sx = W * 0.72, sw = W * 0.26, sy = H * 0.5; ctx.fillStyle = '#111'; ctx.fillRect(sx - 10, sy - 50, sw + 20, 100); EM.text(ctx, 'espectro visible', sx, sy - 58, { size: 10.5, color: '--ink-2' });
      for (let n2 = n1 + 1; n2 <= 30; n2++) { const l = C.lineVacuumNm(n1, n2, Z, mr); if (l < 380 || l > 780) continue; ctx.fillStyle = EM.rgbStr(EM.wavelengthRGB(l)); const x = sx + ((l - 380) / 400) * sw; ctx.fillRect(x - 1, sy - 44, 2, 88); }
      const names = ['Lyman', 'Balmer', 'Paschen', 'Brackett'];
      sim.set('s', names[n1 - 1] + (Z > 1 ? ' (ion con Z = ' + Z + ')' : ''));
      sim.set('l', [n1 + 1, n1 + 2, n1 + 3].map((m) => EM.fix(C.lineVacuumNm(n1, m, Z, mr), 1)).join(' · '));
      sim.set('r', EM.fix((C.bohrRadius(1, Z) * 1e12), 1) + ' pm');
    });
  });

  /* 28.2 Moseley */
  EM.defineSim('moseley-ley', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('par', { label: 'Mostrar √E frente a Z−1 (la recta de Moseley)', value: true });
    sim.out('e', 'Elemento con Kα de 8.05 keV (cobre): Z deducido', { hl: true });
    sim.out('m', 'Desviación máxima de la ley en el rango (apantallamiento y relatividad)');
    sim.note('Moseley (1913), en Mánchester, bombardeó 38 elementos con electrones y midió la longitud de onda de sus rayos X característicos con un cristal. Vio que \\(\\sqrt{\\nu}\\) crece <em>linealmente</em> con un entero \\(Z-1\\), sin los saltos irregulares del peso atómico. Con ello ordenó los elementos, mostró que cobalto y níquel estaban bien ordenados contra sus pesos, y dejó huecos para los elementos 43, 61, 72 y 75, que se descubrirían después (Tc 1937, Pm 1945, Hf 1923, Re 1925). Bohr explicó la ley con su modelo: \\(E=\\tfrac34 Ry\\,(Z-1)^2\\).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const xs = C.KALPHA.map((x) => x[1] - 1), ys = C.KALPHA.map((x) => (p.par ? Math.sqrt(x[2] * 1000) : x[2]));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 80, ymin: 0, ymax: p.par ? 260 : 65, xlabel: 'Z − 1', ylabel: p.par ? '√E (eV^½)' : 'E de Kα (keV)' });
      pl.frame();
      pl.fn((z) => (p.par ? Math.sqrt(C.moseleyKalphaEv(z + 1)) : C.moseleyKalphaEv(z + 1) / 1000), { color: '--c1', width: 2.2 });
      C.KALPHA.forEach((x, i) => { pl.dot(xs[i], ys[i], { color: '--accent', r: 5 }); EM.text(ctx, x[0], pl.X(xs[i]) + 6, pl.Y(ys[i]) + 14, { size: 10, color: '--ink-2' }); });
      const dev = C.KALPHA.map((x) => Math.abs(C.moseleyKalphaEv(x[1]) / 1000 / x[2] - 1));
      sim.set('e', EM.fix(C.moseleyZ(8.0478), 2));
      sim.set('m', EM.fix(100 * Math.max(...dev), 1) + ' % (en el tungsteno)');
    });
  });

  /* 28.3 Franck–Hertz */
  EM.defineSim('franck-hertz', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E1', { label: 'Energía del primer nivel excitado del gas', min: 2, max: 8, step: 0.1, value: 4.9, fmt: (v) => v.toFixed(1) + ' eV' });
    sim.slider('s', { label: 'Dispersión de energías de los electrones', min: 0.1, max: 1, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2) + ' eV' });
    sim.out('p', 'Separación entre picos consecutivos', { hl: true });
    sim.note('Franck y Hertz (1914) aceleraron electrones en vapor de mercurio y midieron la corriente que llegaba a un colector con un pequeño potencial de frenado. La corriente cae cada 4.9 V: un electrón solo puede perder energía en paquetes de 4.9 eV. Al descender, el átomo emite una línea ultravioleta de 253.7 nm, y \\(h\\nu=4.9\\) eV. Fue una prueba directa de niveles de energía discretos, aunque Franck y Hertz mismos interpretaron el resultado como una medida del potencial de ionización, y fue Bohr quien les mostró su verdadero significado.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 40, ymin: 0, ymax: 14, xlabel: 'tensión de aceleración (V)', ylabel: 'corriente en el colector (u.a.)' });
      pl.frame(); pl.fn((v) => C.franckHertz(v, p.E1, 1.5, p.s), { color: '--c1', width: 2.2, n: 800 });
      for (let k = 1; k * p.E1 < 40; k++) pl.vline(k * p.E1, { color: '--ink-3' });
      sim.set('p', EM.fix(p.E1, 2) + ' V  (λ = ' + EM.fix(1239.84 / p.E1, 1) + ' nm)');
    });
  });
})();
