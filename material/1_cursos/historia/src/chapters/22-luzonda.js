/* Capítulo 22 — La luz es una onda: Young, Fresnel, espectros */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;

  /* 22.1 Las franjas de Young */
  EM.defineSim('young-franjas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 550, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.slider('d', { label: 'Separación de las rendijas d', min: 0.1, max: 1, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) + ' mm' });
    sim.slider('a', { label: 'Ancho de cada rendija a', min: 0.01, max: 0.1, step: 0.005, value: 0.03, fmt: (v) => v.toFixed(3) + ' mm' });
    sim.check('corp', { label: 'Mostrar la predicción corpuscular (suma de dos rendijas sin interferencia)', value: true });
    sim.out('sp', 'Distancia entre franjas λL/d (L = 1 m)', { hl: true });
    sim.out('col', 'Color de la franja central');
    sim.note('Young (1801-1803) hizo pasar luz solar por una pequeña abertura y luego por dos agujeros muy próximos. Si la luz fueran partículas, la pantalla mostraría dos bandas brillantes; si es una onda, las ondas de las dos rendijas se suman o se restan y aparecen franjas alternas. Midió la separación de las franjas y, conocidos \\(d\\) y \\(L\\), estimó \\(\\lambda=y\\,d/(mL)\\): de 1/60 000 de pulgada (violeta, 423 nm) a 1/36 000 (rojo extremo, 706 nm), en las unidades de la época.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, lam = p.lam * 1e-9, d = p.d * 1e-3, a = p.a * 1e-3, L = 1, ymax = 6e-3;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.62, xmin: -ymax * 1e3, xmax: ymax * 1e3, ymin: 0, ymax: 1.1, xlabel: 'posición en la pantalla (mm)', ylabel: 'intensidad relativa' });
      pl.frame();
      pl.fn((x) => C.youngI(x * 1e-3, lam, L, d, a), { color: '--c1', width: 2 });
      if (p.corp) pl.fn((x) => C.youngCorpuscular(x * 1e-3, lam, L, d, a), { color: '--c3', width: 2, dash: [6, 4] });
      const y0 = H * 0.68, hh = H * 0.28, col = EM.wavelengthRGB(p.lam), x0 = 40, wd = W - 60;
      for (let i = 0; i < wd; i += 2) { const y = -ymax + (2 * ymax * i) / wd, I = Math.min(1, C.youngI(y, lam, L, d, a)); ctx.fillStyle = EM.rgbStr([col[0] * I, col[1] * I, col[2] * I]); ctx.fillRect(x0 + i, y0, 2, hh); }
      sim.set('sp', EM.fix(C.fringeSpacing(lam, L, d) * 1e3, 3) + ' mm');
      sim.set('col', EM.fix(p.lam, 0) + ' nm');
    });
  });

  /* 22.2 La mancha de Poisson */
  EM.defineSim('poisson-mancha', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('F', { label: 'Número de Fresnel a²/(λz)', min: 0.3, max: 4, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.out('c', 'Intensidad en el centro de la sombra (relativa a la sin disco)', { hl: true });
    sim.out('sh', 'Predicción de la óptica de rayos para la sombra');
    sim.note('En 1818 la Academia convocó un concurso sobre la difracción. Fresnel presentó su teoría ondulatoria; Poisson, miembro del jurado y partidario de la teoría corpuscular, dedujo de ella una consecuencia que le parecía absurda: en el centro de la sombra de un disco opaco debe haber un punto brillante. Arago hizo el experimento (1819) y el punto estaba allí. La figura calcula la integral de difracción en forma radial para un disco iluminado con un haz gaussiano (cintura 5 veces el radio).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, qmax = 3, n = 90;
      EM.draw.clear(cv);
      const xs = [], ys = [];
      for (let i = 0; i <= n; i++) { const q = (qmax * i) / n; xs.push(q); ys.push(C.poissonI(q, p.F, 5, 0.003)); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: qmax, ymin: 0, ymax: 1.8, xlabel: 'distancia al eje (en radios del disco)', ylabel: 'I / I₀ (sin disco)' });
      pl.frame(); pl.hline(1, { color: '--ink-3', label: 'sin disco', labelRight: true });
      pl.xy(xs, ys, { color: '--c1', width: 2.2 }); pl.dot(0, ys[0], { color: '--accent', r: 6 });
      const cx = W * 0.8, cy = H * 0.5, R = Math.min(W * 0.18, H * 0.42), img = ctx.createImageData ? null : null;
      const ring = (q) => ys[Math.min(n, Math.max(0, Math.round((q / qmax) * n)))];
      for (let r = R; r > 0; r -= 1.5) { const q = (r / R) * qmax, v = Math.min(1, ring(q) / 1.6); ctx.fillStyle = EM.rgbStr([20 + 215 * v, 25 + 215 * v, 40 + 200 * v]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, R / qmax, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'sombra geométrica (borde del disco)', cx, cy + R + 16, { size: 10.5, align: 'center', color: '--ink-2' });
      sim.set('c', EM.fix(ys[0], 3) + ' (la óptica de rayos predice 0)');
      sim.set('sh', 'oscuridad total en el interior del disco');
    });
  });

  /* 22.3 Borde de Fresnel */
  EM.defineSim('borde-fresnel', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 550, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.slider('z', { label: 'Distancia a la pantalla', min: 0.2, max: 5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m' });
    sim.out('m', 'Primer máximo: 1.370 veces la luz incidente, a una distancia del borde', { hl: true });
    sim.out('w', 'Escala de las franjas √(λz/2)');
    sim.note('Fresnel resolvió la difracción de un borde recto dividiendo el frente de onda en zonas y sumando las contribuciones con el principio de Huygens completado con la interferencia. El resultado se expresa con las integrales \\(C(v)=\\int_0^v\\cos(\\pi t^2/2)\\,dt\\) y \\(S(v)\\): franjas fuera de la sombra, intensidad un 37 % mayor que la incidente en la primera, y una caída suave (sin borde nítido) dentro de la sombra, de 1/4 en el borde geométrico.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, lam = p.lam * 1e-9, s = Math.sqrt((lam * p.z) / 2), vmax = 5;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.62, xmin: -vmax * s * 1e3, xmax: vmax * s * 1e3, ymin: 0, ymax: 1.5, xlabel: 'posición respecto del borde geométrico (mm)', ylabel: 'I / I₀' });
      pl.frame(); pl.vline(0, { color: '--ink-3', label: 'borde' }); pl.hline(1, { color: '--ink-3' });
      pl.fn((x) => C.edgeI((x * 1e-3) / s), { color: '--c1', width: 2.2, n: 400 });
      const y0 = H * 0.68, hh = H * 0.28; for (let i = 0; i < W - 60; i += 2) { const v = -vmax + (2 * vmax * i) / (W - 60), I = Math.min(1, C.edgeI(v) / 1.4); ctx.fillStyle = 'rgb(' + Math.round(20 + 235 * I) + ',' + Math.round(20 + 235 * I) + ',' + Math.round(20 + 150 * I) + ')'; ctx.fillRect(40 + i, y0, 2, hh); }
      sim.set('m', EM.fix(1.2172 * s * 1e3, 3) + ' mm');
      sim.set('w', EM.fix(s * 1e3, 3) + ' mm');
    });
  });

  /* 22.4 Foucault: la luz en el agua */
  EM.defineSim('foucault-espejo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rps', { label: 'Giro del espejo', min: 50, max: 1000, step: 10, value: 800, fmt: (v) => v.toFixed(0) + ' rev/s' });
    sim.slider('D', { label: 'Distancia al espejo fijo', min: 5, max: 30, step: 0.5, value: 20, fmt: (v) => v.toFixed(1) + ' m' });
    sim.check('agua', { label: 'Tubo con agua (n = 4/3) en el recorrido', value: false });
    sim.out('s', 'Desviación de la imagen (L = 1 m del espejo)', { hl: true });
    sim.out('c', 'c deducida de la desviación');
    sim.note('Arago propuso en 1838 usar un espejo giratorio: mientras la luz va al espejo lejano y vuelve, el espejo giratorio ha girado un ángulo pequeño y la imagen se desvía. Fizeau y Foucault, aún amigos, se separaron en 1849 y se disputaron la idea. Foucault mostró en 1850 que la imagen se desvía <em>más</em> en el agua: la luz va más lenta en el agua (\\(c/n\\)), como predecía la teoría ondulatoria y contradecía la corpuscular de Newton, que exigía una velocidad mayor en el agua. Fue el «experimento crucial» que dio la razón a Huygens y Fresnel.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, nW = p.agua ? 4 / 3 : 1, c = C.CLIGHT / nW;
      EM.draw.clear(cv);
      const shift = C.foucaultShift(p.rps, p.D, 1, c);
      const x0 = 70, x1 = W - 50, y = H * 0.5;
      ctx.fillStyle = EM.col('--c6'); ctx.fillRect(x1 - 6, y - 40, 6, 80); EM.text(ctx, 'espejo fijo', x1 - 3, y + 60, { size: 11, align: 'center' });
      ctx.save(); ctx.translate(x0, y); ctx.rotate(0.6 * Math.sin(Date.now() / 300)); ctx.fillStyle = EM.col('--c4'); ctx.fillRect(-3, -25, 6, 50); ctx.restore(); EM.text(ctx, 'espejo giratorio', x0, y + 60, { size: 11, align: 'center' });
      if (p.agua) { ctx.fillStyle = 'rgba(60,120,200,0.25)'; ctx.fillRect(x0 + 40, y - 18, x1 - x0 - 90, 36); EM.text(ctx, 'agua', (x0 + x1) / 2, y - 24, { size: 11, align: 'center', color: '--ink-2' }); }
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      const sc = Math.min(shift * 1e3 / 2.2, 1) * 60;
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(x0 - 40, y - 80 - sc, 5, 0, TAU); ctx.fill(); ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(x0 - 40, y - 80, 5, 0, TAU); ctx.fill();
      EM.text(ctx, 'imagen sin giro (gris) y con giro (rojo)', x0 + 20, y - 80, { size: 10.5, color: '--ink-2' });
      sim.set('s', EM.fix(shift * 1e3, 3) + ' mm' + (p.agua ? '  (4/3 de la desviación en el aire)' : ''));
      sim.set('c', EM.fix(C.cFromFoucault(p.rps, p.D, 1, shift) / 1e3, 0) + ' km/s' + (p.agua ? '  (en el agua: c/n)' : '  (en el aire)'));
    });
    sim.animate(() => {});
  });

  /* 22.5 Espectrómetro de rejilla */
  EM.defineSim('espectrometro-red', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lin', { label: 'Líneas por milímetro', min: 100, max: 1200, step: 10, value: 600, fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Líneas iluminadas', min: 100, max: 4000, step: 50, value: 1000, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Orden de difracción', min: 1, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Poder de resolución N·m', { hl: true });
    sim.out('d', '¿Se separa el doblete D del sodio (0.597 nm)?');
    sim.note('Fraunhofer, óptico de Múnich, estudió en 1814 el espectro solar con un prisma de pureza excepcional y encontró cientos de líneas oscuras; usó las más fuertes (A, B, C … H) como marcas. Luego, con una rejilla de hilos finos (1821-1823), midió longitudes de onda absolutas: la ecuación \\(d\\,\\sen\\theta=m\\lambda\\) da el ángulo. Kirchhoff y Bunsen (1859) mostraron que cada elemento emite líneas propias y que las líneas oscuras del Sol son de absorción: la química del cielo era posible.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, dnm = 1e6 / p.lin, R = C.resolvingPower(p.N, p.m);
      EM.draw.clear(cv);
      const x0 = 30, x1 = W - 20, lmin = 400, lmax = 700, rows = ['H', 'Na', 'He', 'Hg'], h = (H - 60) / rows.length;
      rows.forEach((el, k) => {
        const y = 20 + k * h; ctx.fillStyle = '#111'; ctx.fillRect(x0, y, x1 - x0, h - 8); EM.text(ctx, el, x0 + 4, y + 13, { size: 11, color: '#bbb' });
        C.LINES.filter((l) => l[0] === el).forEach((l) => {
          const lam = l[2], th = C.gratingAngle(p.m, lam * 1e-9, dnm * 1e-9); if (isNaN(th)) return;
          const xp = x0 + ((lam - lmin) / (lmax - lmin)) * (x1 - x0), col = EM.rgbStr(EM.wavelengthRGB(lam));
          ctx.fillStyle = col; ctx.fillRect(xp - 1, y + 4, 2, h - 16);
        });
      });
      EM.text(ctx, '400 nm', x0, H - 8, { size: 10.5, color: '--ink-2' }); EM.text(ctx, '700 nm', x1, H - 8, { size: 10.5, align: 'right', color: '--ink-2' });
      const th = C.gratingAngle(p.m, 589.3e-9, dnm * 1e-9);
      sim.set('r', EM.fix(R, 0) + '  (separa líneas a ' + EM.fix(589.3 / R, 3) + ' nm de λ = 589 nm)');
      sim.set('d', R >= 589.3 / 0.597 ? 'sí: dos líneas distintas' + (isNaN(th) ? '' : ' (θ = ' + EM.fix((th * 180) / PI, 1) + '°)') : 'no: se ve una sola línea amarilla');
    });
  });
})();
