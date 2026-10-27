/* Capítulo 27 — Relatividad general */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 27.1 Rosetón de Mercurio */
  EM.defineSim('roseton-precesion', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('eps', { label: 'Intensidad relativista ε = GM/(c²p) (exagerada)', min: 0.002, max: 0.03, step: 0.001, value: 0.015, fmt: (v) => v.toFixed(3) });
    sim.slider('e', { label: 'Excentricidad', min: 0.1, max: 0.8, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.out('a', 'Avance por órbita (integrado)', { hl: true });
    sim.out('f', 'Aproximación 6πε');
    sim.out('m', 'Mercurio real: ε = 2.7×10⁻⁸, avance por siglo');
    sim.note('Le Verrier (1859) mostró que las perturbaciones de los planetas explican casi todo el avance del perihelio de Mercurio (5600″ por siglo medido en un sistema móvil), pero que quedan 38″ de sobra (hoy, 43″). Se propuso un planeta, Vulcano (visto por Lescarbault en 1859 y buscado en todos los eclipses hasta 1915), o un achatamiento del Sol, o una modificación de la ley de Newton. Einstein calculó el 18 de noviembre de 1915 que su teoría daba 43″: «estuve fuera de mí de alegría durante días». Aquí el efecto está multiplicado por cien millones para que se vea el rosetón.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, e = p.e, eps = p.eps, cx = W * 0.5, cy = H * 0.5, s = Math.min(W, H) * 0.3;
      EM.draw.clear(cv);
      /* integración de w'' + w = 1 + 3εw² con RK4 para 12 órbitas */
      let w = 1 + e, v = 0, phi = 0, h = 0.002; const pts = [];
      for (let i = 0; i < 12 * 3200; i++) {
        const f = (w, v) => [v, 1 + 3 * eps * w * w - w];
        const [a1, b1] = f(w, v), [a2, b2] = f(w + 0.5 * h * a1, v + 0.5 * h * b1), [a3, b3] = f(w + 0.5 * h * a2, v + 0.5 * h * b2), [a4, b4] = f(w + h * a3, v + h * b3);
        w += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4); v += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4); phi += h;
        if (i % 4 === 0) { const r = 1 / w; pts.push([cx + s * r * Math.cos(phi) * 1.0, cy - s * r * Math.sin(phi) * 1.0]); }
      }
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      const dphi = C.grPrecession(eps, e, 1e-3);
      sim.set('a', EM.fix((dphi * 180) / PI, 3) + '°');
      sim.set('f', EM.fix((6 * PI * eps * 180) / PI, 3) + '°');
      sim.set('m', EM.fix(C.perihelionPerCentury(C.GMSUN, 5.7909e10, 0.2056, 87.969), 2) + '″');
    });
  });

  /* 27.2 Eclipse de 1919 */
  EM.defineSim('eclipse-1919', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('a', { label: 'Incluir el astrográfico de Sobral (0.86″ ± 0.48)', value: false });
    sim.out('m', 'Media ponderada de las placas incluidas', { hl: true });
    sim.out('g', 'χ² frente a Einstein (1.75″)');
    sim.out('n', 'χ² frente a la predicción newtoniana (0.87″)');
    sim.note('Eddington y Dyson enviaron dos expediciones para observar el eclipse total del 29 de mayo de 1919: a Sobral (Brasil) y a la isla de Príncipe (golfo de Guinea). Eddington anunció que los resultados favorecían a Einstein (1.75″) frente a Newton (0.87″) y a la ausencia de deflexión (0). En los datos, dos grupos de placas (el cuatro pulgadas de Sobral y el astrográfico de Príncipe) coinciden; el astrográfico de Sobral dio 0.86″ y fue descartado por Eddington por mala calidad (el espejo se deformó con el calor del Sol).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, E = C.ECLIPSE1919, sel = E.filter((x) => x.used || p.a);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 3, xlabel: 'medida', ylabel: 'deflexión (segundos de arco)' });
      pl.frame(); pl.hline(0.87, { color: '--c3', label: 'Newton 0.87″', labelRight: true }); pl.hline(1.75, { color: '--c1', label: 'Einstein 1.75″', labelRight: true });
      E.forEach((x, i) => { const on = x.used || p.a, xx = pl.X(i + 0.8), y1 = pl.Y(x.v - x.s), y2 = pl.Y(x.v + x.s); ctx.globalAlpha = on ? 1 : 0.3; ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xx, y1); ctx.lineTo(xx, y2); ctx.stroke(); ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(xx, pl.Y(x.v), 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; EM.text(ctx, x.n, xx, pl.Y(0) - 18 - i * 12, { size: 10, align: 'center', color: '--ink-2' }); });
      const vals = sel.map((x) => x.v), sg = sel.map((x) => x.s), wm = C.weightedMean(vals, sg);
      pl.hline(wm.mean, { color: '--accent' });
      sim.set('m', EM.fix(wm.mean, 2) + '″ ± ' + EM.fix(wm.sigma, 2));
      sim.set('g', EM.fix(C.chi2(vals, sg, 1.75), 1) + ' (' + sel.length + ' medidas)');
      sim.set('n', EM.fix(C.chi2(vals, sg, 0.87), 1));
    });
  });

  /* 27.3 Ondas gravitacionales: chirrido */
  EM.defineSim('chirrido-gw', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('m1', { label: 'Masa del agujero negro 1', min: 5, max: 80, step: 1, value: 36, fmt: (v) => v.toFixed(0) + ' M☉' });
    sim.slider('m2', { label: 'Masa del agujero negro 2', min: 5, max: 80, step: 1, value: 29, fmt: (v) => v.toFixed(0) + ' M☉' });
    sim.out('M', 'Masa de chirrido', { hl: true });
    sim.out('f', 'Frecuencia 0.2 s antes de la fusión');
    sim.out('t', 'Tiempo desde 35 Hz hasta la fusión');
    sim.note('Dos agujeros negros que se acercan emiten ondas gravitacionales; al perder energía la órbita se acorta y la frecuencia sube («chirrido»). LIGO la detectó el 14 de septiembre de 2015 (GW150914), con 36 + 29 masas solares, a 1.3 mil millones de años luz. La forma del chirrido depende de la masa de chirrido \\(\\mathcal M=(m_1m_2)^{3/5}/(m_1+m_2)^{1/5}\\).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, Mc = C.chirpMass(p.m1, p.m2) * 1.98847e30;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -0.4, xmax: 0, ymin: 0, ymax: 300, xlabel: 'tiempo hasta la fusión (s)', ylabel: 'frecuencia de la onda (Hz)' });
      pl.frame(); pl.fn((t) => (t > -0.0015 ? 300 : C.gwFreq(-t, Mc)), { color: '--c1', width: 2.4, n: 500 });
      pl.hline(35, { color: '--ink-3', label: '35 Hz (LIGO)' });
      sim.set('M', EM.fix(C.chirpMass(p.m1, p.m2), 2) + ' M☉');
      sim.set('f', EM.fix(C.gwFreq(0.2, Mc), 1) + ' Hz');
      sim.set('t', EM.fix(C.gwTimeToMerge(35, Mc), 3) + ' s');
    });
  });

  /* 27.4 GPS */
  EM.defineSim('reloj-gps', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('h', { label: 'Altura de la órbita sobre el suelo', min: 300, max: 40000, step: 100, value: 20200, fmt: (v) => v.toFixed(0) + ' km' });
    sim.out('g', 'Efecto gravitacional (reloj más rápido arriba)', { hl: true });
    sim.out('v', 'Efecto de la velocidad (reloj más lento)');
    sim.out('n', 'Neto por día y error de posición acumulado sin corrección');
    sim.note('Un reloj en un satélite GPS avanza 45.7 µs por día más rápido por estar menos hundido en el pozo de gravedad, y 7.2 µs menos por su velocidad (3.9 km/s): neto +38.5 µs/día. Sin corregirlo, el error de posición crecería 11 km por día. A unos 3000 km de altura los dos efectos se compensan.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, Re = 6378137, r = Re + p.h * 1000, g = C.gpsDaily(r);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 300, xmax: 40000, ymin: -30, ymax: 60, xlabel: 'altura (km)', ylabel: 'µs por día' });
      pl.frame(); pl.hline(0, { color: '--ink-3' });
      pl.fn((x) => C.gpsDaily(Re + x * 1000).grav, { color: '--c1', width: 2, label: 'gravitacional' });
      pl.fn((x) => C.gpsDaily(Re + x * 1000).spec, { color: '--c3', width: 2, label: 'velocidad' });
      pl.fn((x) => C.gpsDaily(Re + x * 1000).net, { color: '--accent', width: 2.6, label: 'neto' });
      pl.vline(p.h, { color: '--ink-3' });
      sim.set('g', '+' + EM.fix(g.grav, 2) + ' µs/día'); sim.set('v', EM.fix(g.spec, 2) + ' µs/día'); sim.set('n', EM.fix(g.net, 2) + ' µs/día → ' + EM.fix((g.net * 1e-6 * K.c) / 1e3, 2) + ' km por día');
    });
  });
})();
