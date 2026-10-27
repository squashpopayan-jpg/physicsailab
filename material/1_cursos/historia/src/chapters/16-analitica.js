/* Capítulo 16 — La mecánica se vuelve análisis */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 16.1 Braquistócrona: la carrera */
  EM.defineSim('braquistocrona', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('yf', { label: 'Desnivel entre salida y llegada (m)', min: 0.2, max: 2, step: 0.05, value: 0.6, fmt: (v) => v.toFixed(2) + ' m' });
    sim.slider('xf', { label: 'Distancia horizontal (m)', min: 0.5, max: 3, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) + ' m' });
    sim.out('r', 'Tiempos: recta / arco circular / parábola / cicloide', { hl: true });
    sim.out('g', 'Ventaja de la cicloide sobre la recta');
    sim.note('El reto de Johann Bernoulli (junio de 1696): «¿qué curva une dos puntos de modo que un cuerpo que cae por ella bajo la gravedad llegue en el menor tiempo?». No es la recta: conviene bajar rápido al principio para ganar velocidad. Resolvieron el problema Leibniz, Jakob y Johann Bernoulli, L’Hôpital y Newton, anónimamente: Bernoulli dijo «reconozco al león por su zarpa». La solución es un arco de cicloide.');
    let t = 0;
    sim.animate((dt) => { t += dt * 0.7; if (t > 1.8) t = 0; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, xf = p.xf, yf = p.yf;
      EM.draw.clear(cv);
      const sc = Math.min((W - 60) / xf, (H - 70) / yf), x0 = 30, y0 = 28;
      const X = (x) => x0 + x * sc, Y = (y) => y0 + y * sc;
      const cyc = C.cycloidFit(xf, yf), R = C.circleThrough(xf, yf), kpar = yf / Math.sqrt(xf);
      const curves = [
        ['recta', '--ink-3', (x) => (yf / xf) * x, () => yf / xf, C.timeStraight(xf, yf)],
        ['circulo', '--c3', (x) => Math.sqrt(Math.max(0, 2 * R * x - x * x)), (x) => (R - x) / Math.sqrt(Math.max(1e-300, 2 * R * x - x * x)), 0],
        ['parabola', '--c1', (x) => kpar * Math.sqrt(x), (x) => kpar / (2 * Math.sqrt(Math.max(x, 1e-300))), 0],
        ['cicloide', '--c2', null, null, cyc.T]
      ];
      curves[1][4] = C.timeAlong(curves[1][2], curves[1][3], xf);
      curves[2][4] = C.timeAlong(curves[2][2], curves[2][3], xf);
      const pts = (c, n) => { const out = []; for (let i = 0; i <= n; i++) { if (c[0] === 'cicloide') { const th = (cyc.th * i) / n; out.push([cyc.a * (th - Math.sin(th)), cyc.a * (1 - Math.cos(th))]); } else { const x = xf * (i / n); out.push([x, c[2](x)]); } } return out; };
      curves.forEach((c) => { const P = pts(c, 120); ctx.strokeStyle = EM.col(c[1]); ctx.lineWidth = c[0] === 'cicloide' ? 2.8 : 1.8; ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.stroke(); });
      /* bolas en carrera: la posición en el tiempo t para cada curva se obtiene integrando la energía a lo largo del trazado */
      curves.forEach((c) => {
        const P = pts(c, 400); let tt = 0, k = 0, pos = P[0];
        for (let i = 1; i < P.length && tt < t * (curves[3][4] / 0.9) ; i++) { const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], ds = Math.hypot(dx, dy), ym = Math.max((P[i][1] + P[i - 1][1]) / 2, 1e-6), v = Math.sqrt(2 * K.g * ym); tt += ds / v; pos = P[i]; }
        ctx.fillStyle = EM.col(c[1]); ctx.beginPath(); ctx.arc(X(pos[0]), Y(pos[1]), 6, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(X(0), Y(0), 3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(X(xf), Y(yf), 3, 0, TAU); ctx.fill();
      sim.set('r', curves.map((c) => EM.fix(c[4], 3)).join(' · ') + ' s');
      sim.set('g', EM.fix(100 * (1 - cyc.T / curves[0][4]), 1) + ' % menos tiempo');
    });
  });

  /* 16.2 Cavendish: pesar la Tierra */
  EM.defineSim('cavendish', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('M', { label: 'Masa de cada bola grande', min: 50, max: 300, step: 1, value: 158, fmt: (v) => v.toFixed(0) + ' kg' });
    sim.slider('r', { label: 'Distancia centro a centro (grande–pequeña)', min: 0.15, max: 0.4, step: 0.005, value: 0.2257, fmt: (v) => (v * 100).toFixed(1) + ' cm' });
    sim.slider('T', { label: 'Periodo de oscilación de la balanza', min: 200, max: 900, step: 5, value: 420, fmt: (v) => v.toFixed(0) + ' s' });
    sim.slider('th', { label: 'Desviación medida (ángulo de la barra)', min: 0.0002, max: 0.005, step: 0.00002, value: 0.001, fmt: (v) => (v * 1000).toFixed(2) + ' mrad' });
    sim.out('G', 'Constante G deducida', { hl: true });
    sim.out('ME', 'Masa de la Tierra g R²/G');
    sim.out('rho', 'Densidad media de la Tierra');
    sim.note('Cavendish (1797-1798) usó la balanza de torsión que había diseñado John Michell (m. 1793): dos bolas de plomo pequeñas (0.73 kg) en los extremos de una barra de 1.86 m colgada de un hilo; dos bolas grandes (158 kg) las atraen. La desviación (apenas un milímetro en los extremos) y el periodo (≈ 7 min) dan \\(G=2\\pi^2L\\theta r^2/(MT^2)\\). Cavendish no calculó G sino la <em>densidad de la Tierra</em>: 5.448 veces la del agua (el valor actual es 5.514).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, L = 1.86;
      EM.draw.clear(cv);
      const G = C.cavendishG(L, p.th, p.r, p.M, p.T);
      const cx = W * 0.3, cy = H * 0.5, sc = Math.min(W * 0.25, H * 0.4) / 1.0;
      /* vista desde arriba */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3; const a = p.th * 25; ctx.beginPath(); ctx.moveTo(cx - (L / 2) * sc * Math.cos(a), cy - (L / 2) * sc * Math.sin(a) * 1); ctx.lineTo(cx + (L / 2) * sc * Math.cos(a), cy + (L / 2) * sc * Math.sin(a)); ctx.stroke();
      ctx.fillStyle = EM.col('--c6'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * (L / 2) * sc * Math.cos(a), cy + s * (L / 2) * sc * Math.sin(a), 7, 0, TAU); ctx.fill(); }
      ctx.fillStyle = EM.col('--c4'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * (L / 2) * sc, cy - p.r * sc * 2, 22, 0, TAU); ctx.fill(); }
      EM.text(ctx, 'bolas grandes', cx, cy - p.r * sc * 2 - 30, { size: 11, align: 'center', color: '--ink-3' }); EM.text(ctx, 'bolas pequeñas', cx, cy + 40, { size: 11, align: 'center', color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 8, w: W * 0.4, h: H - 16, xmin: 0, xmax: 0.005, ymin: 0, ymax: 14e-11, xlabel: 'desviación θ (rad)', ylabel: 'G deducida (m³ kg⁻¹ s⁻²)' });
      pl.frame(); pl.fn((x) => C.cavendishG(L, x, p.r, p.M, p.T), { color: '--c1', width: 2 }); pl.hline(6.674e-11, { color: '--c3', label: 'G actual', labelRight: true }); pl.dot(p.th, G, { color: '--accent', r: 6 });
      sim.set('G', EM.sci(G, 3) + ' m³/(kg·s²)  (CODATA: 6.674×10⁻¹¹)');
      sim.set('ME', EM.sci(C.earthMass(G), 3) + ' kg  (real: 5.972×10²⁴)');
      sim.set('rho', EM.fix(C.earthDensity(G), 3) + ' g/cm³  (Cavendish: 5.448)');
    });
  });

  /* 16.3 Péndulo doble: el determinismo de Laplace y su límite */
  EM.defineSim('pendulo-doble', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('a', { label: 'Ángulo inicial de las dos barras', min: 20, max: 170, step: 1, value: 120, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('eps', { label: 'Diferencia inicial entre los dos péndulos', min: 0, max: 0.01, step: 0.0001, value: 0.001, fmt: (v) => v.toExponential(1) + ' rad' });
    sim.out('t', 'Tiempo transcurrido', { hl: true });
    sim.out('d', 'Separación de los dos péndulos');
    sim.out('E', 'Energía (deriva relativa)');
    sim.note('Laplace (1814): «una inteligencia que conociera en un instante todas las fuerzas y las posiciones de todos los cuerpos podría predecir el futuro». Con ecuaciones deterministas, los dos péndulos (azul y rojo) parten con una diferencia de una milésima de radián. Para amplitudes grandes se separan de forma exponencial: el determinismo existe, pero la predicción a largo plazo exige una precisión infinita. Poincaré lo vio en 1890 con tres cuerpos.');
    let s1, s2, t, E0;
    const init = () => { const a = (sim.p.a * PI) / 180; s1 = [a, a, 0, 0]; s2 = [a + sim.p.eps, a, 0, 0]; t = 0; E0 = C.doublePendulumEnergy(s1, 1, 1, 1, 1); };
    init(); sim.onChange = init; sim.resetButton(init);
    sim.animate((dt) => { const n = Math.max(1, Math.round(dt / 0.002)); for (let i = 0; i < n; i++) { s1 = C.rk4((x) => C.doublePendulum(x, 1, 1, 1, 1), s1, 0.002); s2 = C.rk4((x) => C.doublePendulum(x, 1, 1, 1, 1), s2, 0.002); t += 0.002; } });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, l = Math.min(W, H) * 0.22, cx = W / 2, cy = H * 0.4;
      EM.draw.clear(cv);
      [[s1, '--c1'], [s2, '--c2']].forEach(([s, col]) => {
        const x1 = cx + l * Math.sin(s[0]), y1 = cy + l * Math.cos(s[0]), x2 = x1 + l * Math.sin(s[1]), y2 = y1 + l * Math.cos(s[1]);
        ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(x1, y1, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x2, y2, 7, 0, TAU); ctx.fill();
      });
      const d = Math.hypot(s1[0] - s2[0], s1[1] - s2[1]);
      sim.set('t', EM.fix(t, 2) + ' s');
      sim.set('d', EM.sci(d, 2) + ' rad');
      sim.set('E', EM.sci(Math.abs((C.doublePendulumEnergy(s1, 1, 1, 1, 1) - E0) / E0), 2));
    });
  });
})();
