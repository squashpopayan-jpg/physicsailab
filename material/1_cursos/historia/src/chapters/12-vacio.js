/* Capítulo 12 — Gilbert, Torricelli, Pascal, Guericke, Boyle: el vacío y el aire */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;

  /* 12.1 Torricelli y el Puy de Dôme */
  EM.defineSim('torricelli', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('liq', { label: 'Líquido del tubo', options: [['mercurio', 'Mercurio'], ['agua', 'Agua'], ['aceite', 'Aceite'], ['vino', 'Vino']], value: 'mercurio' });
    sim.slider('h', { label: 'Altitud sobre el nivel del mar', min: 0, max: 5000, step: 10, value: 400, fmt: (v) => v.toFixed(0) + ' m' });
    sim.seg('pre', { label: 'Lugar', options: [['cl', 'Clermont (1648)'], ['pd', 'Puy de Dôme'], ['bog', 'Bogotá']], value: 'cl', onInput: (v) => { sim.ctl.h.set({ cl: 400, pd: 1465, bog: 2640 }[v], true); sim.redraw(); } });
    sim.out('P', 'Presión del aire (Pa)', { hl: true });
    sim.out('H', 'Altura de la columna');
    sim.out('pd', 'Pascal (1648): Clermont 711.7 mm, cima 627.1 mm');
    sim.out('alt', 'Diferencia de altitud deducida de las dos lecturas');
    sim.note('Torricelli (1643) invirtió un tubo de vidrio de un metro lleno de mercurio en una cubeta: la columna bajó hasta ≈ 76 cm y dejó arriba un espacio sin aire, el «vacío torricelliano». Interpretó el resultado como el peso del aire sobre la cubeta («vivimos en el fondo de un océano de aire»). Pascal predijo que, subiendo a una montaña, la columna bajaría; su cuñado Périer lo comprobó el 19 de septiembre de 1648.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, P = C.pressureAt(p.h), rho = C.RHO[p.liq], col = C.columnHeight(P, rho);
      EM.draw.clear(cv);
      const half = W * 0.42, base = H * 0.88, sc = Math.min((H * 0.72) / Math.max(col, 0.8), (H * 0.72) / 11);
      const x0 = half * 0.5;
      ctx.fillStyle = EM.alpha(p.liq === 'mercurio' ? '--c6' : '--water', 0.5); ctx.fillRect(x0 - 60, base, 120, H - base);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(x0 - 12, base - H * 0.78, 24, H * 0.78);
      ctx.fillStyle = EM.alpha(p.liq === 'mercurio' ? '--c6' : '--water', 0.9); const hh = Math.min(col * sc, H * 0.78); ctx.fillRect(x0 - 10, base - hh, 20, hh);
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + 18, base - hh); ctx.lineTo(x0 + 60, base - hh); ctx.stroke();
      EM.text(ctx, EM.fix(col, col < 2 ? 3 : 2) + ' m', x0 + 64, base - hh + 4, { size: 12, weight: 650, color: '--accent' });
      EM.text(ctx, 'vacío', x0 + 28, base - H * 0.78 + 16, { size: 11, color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: half + 10, y: 6, w: W - half - 16, h: H - 12, xmin: 0, xmax: 5000, ymin: 0, ymax: 105, xlabel: 'altitud (m)', ylabel: 'presión (kPa)' });
      pl.frame(); pl.fn((x) => C.pressureAt(x) / 1000, { color: '--c1', width: 2.2 });
      pl.dot(400, C.pressureAt(400) / 1000, { color: '--c3', r: 5, label: 'Clermont' }); pl.dot(1465, C.pressureAt(1465) / 1000, { color: '--c3', r: 5, label: 'Puy de Dôme', dy: 14 });
      pl.dot(p.h, P / 1000, { color: '--accent', r: 6 });
      const rec = C.altitudeDiff(711.7, 627.1);
      sim.set('P', EM.fix(P, 0));
      sim.set('H', EM.fix(col, 3) + ' m' + (p.liq === 'mercurio' ? ' (' + EM.fix(col * 1000, 0) + ' mm)' : ''));
      sim.set('pd', 'razón 627.1/711.7 = 0.881');
      sim.set('alt', EM.fix(rec, 0) + ' m (real ≈ 1 070 m)');
    });
  });

  /* 12.2 Los hemisferios de Magdeburgo */
  EM.defineSim('hemisferios', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R', { label: 'Radio de los hemisferios', min: 0.1, max: 0.4, step: 0.005, value: 0.255, fmt: (v) => (v * 100).toFixed(1) + ' cm' });
    sim.slider('p', { label: 'Presión que queda dentro (fracción de la atmosférica)', min: 0, max: 0.9, step: 0.01, value: 0.1, fmt: (v) => (100 * v).toFixed(0) + ' %' });
    sim.slider('n', { label: 'Caballos tirando (con 700 N cada uno)', min: 2, max: 40, step: 2, value: 16, fmt: (v) => v.toFixed(0) });
    sim.out('F', 'Fuerza que los mantiene unidos', { hl: true });
    sim.out('kg', 'Equivalente en toneladas fuerza');
    sim.out('res', '¿Se separan?');
    sim.note('Guericke mostró en Ratisbona (1654) ante el emperador Fernando III que dos hemisferios de cobre, unidos con una junta de cuero, no podían separarse con dos tiros de ocho caballos. La fuerza es \\(F=(P_{ext}-P_{int})\\pi R^2\\); con un vacío imperfecto la fuerza es menor, lo que explica que 16 caballos bastaran con una bomba mediocre.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, F = C.hemisphereForce(p.R, C.ATM, p.p * C.ATM), pull = p.n * 700;
      EM.draw.clear(cv);
      const cx = W * 0.5, cy = H * 0.5, r = Math.min(W * 0.15, H * 0.33), sep = pull > F ? Math.min(60, (pull - F) / 300 + 6) : 0;
      ctx.fillStyle = EM.alpha('--c4', 0.55); ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx - sep, cy, r, PI / 2, 3 * PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + sep, cy, r, -PI / 2, PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      const nn = Math.round(p.n / 2);
      for (let i = 0; i < nn; i++) { const y = cy + (i - (nn - 1) / 2) * Math.min(14, (H * 0.8) / nn); for (const s of [-1, 1]) { const x = cx + s * (r + sep + 30 + 90); ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + s * (r + sep), cy); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x - 8, y - 3, 16, 6); } }
      EM.text(ctx, 'hemisferios de cobre', cx, 18, { size: 12, align: 'center', color: '--ink-3' });
      sim.set('F', EM.fix(F / 1000, 1) + ' kN  (tiro de los caballos: ' + EM.fix(pull / 1000, 1) + ' kN)');
      sim.set('kg', EM.fix(F / 9806.65, 2) + ' tf');
      sim.set('res', pull > F ? 'Sí: se separan' : 'No: ' + EM.fix(F / 700, 0) + ' caballos serían necesarios');
    });
  });

  /* 12.3 Boyle y el tubo en J */
  EM.defineSim('boyle-jtube', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('B', { label: 'Mercurio añadido en el brazo abierto', min: 0, max: 90, step: 0.5, value: 30, fmt: (v) => v.toFixed(1) + ' pulg' });
    sim.check('dat', { label: 'Mostrar los datos de la tabla de Boyle (1662)', value: true });
    sim.out('V', 'Columna de aire atrapada', { hl: true });
    sim.out('P', 'Presión total (pulgadas de mercurio)');
    sim.out('PV', 'Producto P·V');
    sim.out('fit', 'Recta P frente a 1/V (datos de Boyle)');
    sim.note('Boyle (1662) atrapó aire en el brazo corto cerrado de un tubo en forma de J y fue añadiendo mercurio por el largo. La presión total es la atmosférica (29 2/16 pulgadas de mercurio en su día) más la altura del mercurio añadido, y la columna de aire se comprime. Concluyó que «la presión y la extensión están en razón recíproca». Richard Towneley y Henry Power habían tenido la hipótesis antes, y Mariotte la redescubrió en 1676.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, P0 = C.BOYLE.P0;
      EM.draw.clear(cv);
      const k = C.boyleFit(), Vm = (P) => k.m / (P - k.b), Pt = P0 + p.B, V = 48 * P0 / Pt;
      /* tubo en J esquemático (alturas en pulgadas sobre el fondo) */
      const x0 = W * 0.1, yb = H * 0.92, sc = (H * 0.84) / 135, xs = x0, xl = x0 + 46;
      const hs = 50 - V, hl = hs + p.B;
      ctx.fillStyle = EM.alpha('--water', 0.25); ctx.fillRect(xs - 7, yb - 50 * sc, 14, V * sc);
      ctx.fillStyle = EM.alpha('--c6', 0.95); ctx.fillRect(xs - 7, yb - hs * sc, 14, hs * sc); ctx.fillRect(xl - 7, yb - hl * sc, 14, hl * sc); ctx.fillRect(xs - 7, yb - 4, xl - xs + 14, 4);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xs - 7, yb - 50 * sc); ctx.lineTo(xs - 7, yb); ctx.lineTo(xl + 7, yb); ctx.lineTo(xl + 7, yb - 134 * sc); ctx.moveTo(xs + 7, yb - 50 * sc); ctx.lineTo(xs + 7, yb - 4); ctx.moveTo(xl - 7, yb - 134 * sc); ctx.lineTo(xl - 7, yb - 4); ctx.moveTo(xs - 7, yb - 50 * sc); ctx.lineTo(xs + 7, yb - 50 * sc); ctx.stroke();
      EM.text(ctx, 'aire: ' + V.toFixed(1) + ' pulg', xl + 18, yb - (50 - V / 2) * sc, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'Δh = ' + p.B.toFixed(1) + ' pulg', xl + 18, yb - (hs + hl) / 2 * sc, { size: 11, color: '--ink-2' });
      /* gráfica P frente a 1/V */
      const gx = W * 0.4;
      const pl = new EM.Plot(ctx, { x: gx, y: 6, w: W - gx - 8, h: H - 12, xmin: 0.015, xmax: 0.095, ymin: 20, ymax: 125, xlabel: '1/V  (1/pulgadas)', ylabel: 'presión total (pulg. Hg)' });
      pl.frame();
      pl.fn((x) => k.m * x + k.b, { color: '--c2', width: 1.4, dash: [5, 4] });
      if (p.dat) C.BOYLE.A.forEach((a, i) => pl.dot(1 / a, C.BOYLE.B[i] + P0, { color: '--c1', r: 3.6 }));
      pl.dot(1 / V, Pt, { color: '--accent', r: 6 });
      sim.set('V', EM.fix(V, 2) + ' pulg  (inicial 48)');
      sim.set('P', EM.fix(Pt, 2));
      sim.set('PV', EM.fix(V * Pt, 0) + '  (media de Boyle: ' + EM.fix(k.PV.reduce((a, b) => a + b, 0) / k.PV.length, 0) + ')');
      sim.set('fit', 'P = ' + EM.fix(k.m, 0) + '/V + ' + EM.fix(k.b, 2) + '  (ordenada ≈ 0)');
    });
  });

  /* 12.4 La prensa de Pascal */
  EM.defineSim('prensa-pascal', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('F', { label: 'Fuerza sobre el émbolo pequeño', min: 10, max: 500, step: 5, value: 100, fmt: (v) => v.toFixed(0) + ' N' });
    sim.slider('r1', { label: 'Diámetro del émbolo pequeño', min: 1, max: 6, step: 0.1, value: 2, fmt: (v) => v.toFixed(1) + ' cm' });
    sim.slider('r2', { label: 'Diámetro del émbolo grande', min: 6, max: 40, step: 1, value: 20, fmt: (v) => v.toFixed(0) + ' cm' });
    sim.out('F2', 'Fuerza sobre el émbolo grande', { hl: true });
    sim.out('P', 'Presión transmitida');
    sim.out('W', 'Trabajo: entra = sale');
    sim.note('Principio de Pascal (<em>Traité de l’équilibre des liqueurs</em>, escrito en 1651-1654, publicado en 1663): la presión aplicada a un líquido encerrado se transmite sin cambio a todos sus puntos. Con áreas distintas se multiplica la fuerza, pero se divide el recorrido: el trabajo se conserva.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, A1 = PI * Math.pow(p.r1 / 200, 2), A2 = PI * Math.pow(p.r2 / 200, 2), F2 = C.hydraulic(p.F, A1, A2), P = p.F / A1;
      EM.draw.clear(cv);
      const y0 = H * 0.7, w1 = p.r1 * 5 + 8, w2 = p.r2 * 3.4 + 8, xa = W * 0.22, xb = W * 0.66;
      ctx.fillStyle = EM.alpha('--water', 0.35); ctx.fillRect(xa - w1 / 2, y0, xb - xa + (w1 + w2) / 2 + 0, 36);
      ctx.fillStyle = EM.alpha('--c6', 0.9); ctx.fillRect(xa - w1 / 2, y0 - 16, w1, 14); ctx.fillRect(xb - w2 / 2, y0 - 16, w2, 14);
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xa, y0 - 70); ctx.lineTo(xa, y0 - 20); ctx.stroke();
      EM.text(ctx, p.F + ' N', xa + 8, y0 - 56, { size: 12, color: '--accent', weight: 650 });
      ctx.strokeStyle = EM.col('--c3'); ctx.beginPath(); ctx.moveTo(xb, y0 - 20); ctx.lineTo(xb, y0 - 20 - Math.min(80, F2 / 80)); ctx.stroke();
      EM.text(ctx, EM.fix(F2, 0) + ' N', xb + 8, y0 - 40, { size: 12, color: '--c3', weight: 650 });
      sim.set('F2', EM.fix(F2, 0) + ' N  (×' + EM.fix(A2 / A1, 1) + ')');
      sim.set('P', EM.fix(P / 1000, 1) + ' kPa');
      sim.set('W', 'recorridos 1 cm ↔ ' + EM.fix(10 * A1 / A2, 3) + ' cm: F₁d₁ = F₂d₂');
    });
  });

  /* 12.5 La terrella de Gilbert */
  EM.defineSim('terrella', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('lat', { label: 'Latitud magnética', min: -90, max: 90, step: 1, value: 51.5, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('I', 'Inclinación de la aguja (tan I = 2 tan φ)', { hl: true });
    sim.out('obs', 'Norman (Londres, 1576)');
    sim.note('Gilbert (<em>De magnete</em>, 1600) llevó una piedra imán esférica, la <em>terrella</em>, y una aguja pequeña: la aguja se inclina igual que sobre la Tierra. Concluyó que la Tierra es un gran imán. El ángulo de inclinación sigue la ley de un dipolo, \\(\\tan I=2\\tan\\varphi\\). Con la latitud geográfica de Londres (51.5°) da 68°; la medida de Robert Norman (1581) fue 71° 50′: la diferencia mide cuánto se aparta el campo terrestre de un dipolo simple.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, lat = sim.p.lat;
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.5, R = Math.min(W * 0.2, H * 0.36);
      ctx.fillStyle = EM.alpha('--c6', 0.5); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.stroke();
      /* líneas de campo dipolar */
      ctx.strokeStyle = EM.alpha('--c1', 0.5); ctx.lineWidth = 1.2;
      for (const L of [1.5, 2, 3, 4.5]) { ctx.beginPath(); let first = true; for (let t = -85; t <= 85; t += 2) { const th = t * DEG, r = L * R * Math.cos(th) * Math.cos(th); const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th); if (r < R) continue; first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y); } ctx.stroke(); ctx.beginPath(); first = true; for (let t = -85; t <= 85; t += 2) { const th = t * DEG, r = L * R * Math.cos(th) * Math.cos(th); const x = cx - r * Math.cos(th), y = cy - r * Math.sin(th); if (r < R) continue; first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y); } ctx.stroke(); }
      const phi = lat * DEG, px = cx + R * Math.cos(phi), py = cy - R * Math.sin(phi);
      const I = Math.atan(2 * Math.tan(phi));
      /* aguja: tangente al campo; dirección (cos I hacia el norte, -sen I hacia abajo) en el plano local */
      const tx = -Math.sin(phi), ty = -Math.cos(phi); /* norte local en pantalla (hacia el polo norte) */
      const nx = Math.cos(phi), ny = -Math.sin(phi); /* vertical local hacia arriba */
      const dx = tx * Math.cos(I) - nx * Math.sin(I) * (lat >= 0 ? 1 : -1) * -1, dy = ty * Math.cos(I) - ny * Math.sin(I) * (lat >= 0 ? 1 : -1) * -1;
      const len = 36; ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - dx * len / 2, py - dy * len / 2); ctx.lineTo(px + dx * len / 2, py + dy * len / 2); ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
      EM.text(ctx, 'N', cx, cy - R - 8, { size: 12, align: 'center', color: '--pos', weight: 650 }); EM.text(ctx, 'S', cx, cy + R + 16, { size: 12, align: 'center', color: '--neg', weight: 650 });
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 6, w: W * 0.4, h: H - 12, xmin: -90, xmax: 90, ymin: -90, ymax: 90, xlabel: 'latitud magnética (°)', ylabel: 'inclinación I (°)' });
      pl.frame(); pl.fn((x) => C.dipAngle(x), { color: '--c1', width: 2.2, n: 360 }); pl.dot(lat, C.dipAngle(lat), { color: '--accent', r: 5 });
      pl.dot(51.5, 71.83, { color: '--c2', r: 4, label: 'Norman 1576', dy: 14 });
      sim.set('I', EM.fix(C.dipAngle(lat), 1) + '°');
      sim.set('obs', 'I = 71° 50′ = 71.8°; dipolo en 51.5°N: ' + EM.fix(C.dipAngle(51.5), 1) + '°');
    });
  });
})();
