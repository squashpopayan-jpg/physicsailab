/* Capítulo 5 — Alejandría y Siracusa */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, DEG = PI / 180;

  /* 5.1 Eratóstenes */
  EM.defineSim('eratostenes', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('dphi', { label: 'Ángulo de la sombra en Alejandría (Δφ)', min: 5, max: 9, step: 0.05, value: 7.2, fmt: (v) => v.toFixed(2) + '°' });
    sim.slider('d', { label: 'Distancia Alejandría–Siena', min: 4000, max: 6000, step: 50, value: 5000, fmt: (v) => v.toFixed(0) + ' estadios' });
    sim.select('st', { label: 'Longitud del estadio', options: [['157.5', 'Egipcio (157.5 m)'], ['185', 'Ático (185 m)'], ['166.7', 'Itinerario (166.7 m)']], value: '157.5' });
    sim.out('c', 'Circunferencia', { hl: true });
    sim.out('km', 'En kilómetros');
    sim.out('r', 'Radio de la Tierra');
    sim.out('e', 'Error respecto de 40 008 km (meridiano)');
    sim.note('Al mediodía del solsticio de verano, el Sol ilumina el fondo de un pozo en Siena (hoy Asuán), es decir, está en el cenit. Ese día, en Alejandría, un gnomon proyecta una sombra de 1/50 de círculo (7.2°). Si Siena está en el mismo meridiano a 5000 estadios, la circunferencia son 50 × 5000 = 250 000 estadios. Siena no está exactamente en el trópico ni en el mismo meridiano de Alejandría (difiere unos 3°), y el valor del estadio es incierto.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const cx = W * 0.5, cy = H * 0.93, R = H * 0.62;
      const half = (p.dphi * DEG) / 2;
      ctx.fillStyle = EM.alpha('--water', 0.12); ctx.beginPath(); ctx.arc(cx, cy, R, PI, 2 * PI); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, PI, 2 * PI); ctx.stroke();
      const a1 = -PI / 2 - half, a2 = -PI / 2 + half; /* Alejandría (izquierda) y Siena (derecha) */
      const A = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], S = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
      const d = [Math.cos(a2), Math.sin(a2)]; /* el Sol está en el cenit de Siena: los rayos llegan paralelos a esa vertical */
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 1.6;
      for (const q of [A, S]) { ctx.beginPath(); ctx.moveTo(q[0] + d[0] * H * 0.3, q[1] + d[1] * H * 0.3); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
      ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.setLineDash([4, 4]);
      for (const q of [A, S]) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(cx, cy); ctx.stroke(); }
      ctx.setLineDash([]);
      const gdir = [(A[0] - cx) / R, (A[1] - cy) / R];
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0] + gdir[0] * 38, A[1] + gdir[1] * 38); ctx.stroke();
      const sh = 38 * Math.tan(half * 2);
      EM.text(ctx, 'Alejandría', A[0] - 8, A[1] - 8, { size: 12, align: 'right', color: '--accent', weight: 650 });
      EM.text(ctx, 'Siena', S[0] + 8, S[1] - 8, { size: 12, color: '--accent', weight: 650 });
      ctx.fillStyle = EM.col('--ray'); ctx.beginPath(); ctx.arc(S[0] + d[0] * H * 0.36, S[1] + d[1] * H * 0.36, 10, 0, 2 * PI); ctx.fill();
      EM.text(ctx, 'Δφ = ' + p.dphi.toFixed(2) + '°', cx, cy - R * 0.45, { size: 13, align: 'center', color: '--ink', weight: 650 });
      const r = C.eratosthenes(p.dphi, p.d, +p.st);
      sim.set('c', EM.fix(r.circStadia, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' estadios');
      sim.set('km', EM.fix(r.km, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' km');
      sim.set('r', EM.fix(r.R, 0) + ' km  (real: 6 371)');
      sim.set('e', (r.err > 0 ? '+' : '') + EM.fix(100 * r.err, 1) + ' %');
    });
  });

  /* 5.2 Aristarco: distancias relativas */
  EM.defineSim('aristarco', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('th', { label: 'Ángulo Sol–Tierra–Luna con media Luna', min: 80, max: 89.99, step: 0.01, value: 87, fmt: (v) => v.toFixed(2) + '°' });
    sim.button('Aristarco (87°)', () => sim.ctl.th.set(87));
    sim.button('Valor moderno (89.853°)', () => sim.ctl.th.set(89.853));
    sim.out('r', 'Distancia al Sol / distancia a la Luna', { hl: true });
    sim.out('s', 'Sensibilidad: error de 1° en el ángulo');
    sim.note('Cuando la Luna está exactamente en cuarto, el triángulo Tierra–Luna–Sol es rectángulo en la Luna, y \\(\\cos\\theta=d_L/d_S\\). Medir 87° en lugar de 89.85° es un error del 3 %, pero cambia el cociente de 19 a 390: cerca de 90° el coseno es muy sensible.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, th = sim.p.th * DEG;
      EM.draw.clear(cv);
      const tn = Math.tan(th), dL = Math.max(10, Math.min(H * 0.62, (W * 0.74) / tn));
      const T = [W * 0.1, H * 0.88], L = [T[0], T[1] - dL], Sp = [T[0] + dL * tn, L[1]];
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(L[0], L[1]); ctx.lineTo(Sp[0], Sp[1]); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(T[0], T[1], 8, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(L[0], L[1], 5, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(Sp[0], Sp[1], 9, 0, 2 * PI); ctx.fill();
      EM.text(ctx, 'Tierra', T[0] - 10, T[1] + 24, { size: 12, color: '--c1' });
      EM.text(ctx, 'Luna (cuarto)', L[0] + 10, L[1] - 10, { size: 12 });
      EM.text(ctx, 'Sol (no a escala si la razón es grande)', Sp[0] - 10, Sp[1] - 14, { size: 12, align: 'right', color: '--gold' });
      EM.text(ctx, 'θ = ' + sim.p.th.toFixed(2) + '°', T[0] + 40, T[1] + 24, { size: 12.5, weight: 650 });
      const r1 = C.aristarchus(sim.p.th).ratio, r2 = C.aristarchus(Math.min(89.999, sim.p.th - 1)).ratio;
      sim.set('r', EM.fix(r1, 1) + ' veces');
      sim.set('s', 'con θ − 1°: ' + EM.fix(r2, 1) + ' veces');
    });
  });

  /* 5.3 La corona de Hierón */
  EM.defineSim('corona', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('f', { label: 'Fracción de plata fraudulenta (en masa)', min: 0, max: 0.4, step: 0.005, value: 0.2, fmt: (v) => (100 * v).toFixed(1) + ' %' });
    sim.slider('m', { label: 'Masa de la corona', min: 500, max: 1500, step: 10, value: 1000, fmt: (v) => v.toFixed(0) + ' g' });
    sim.slider('res', { label: 'Resolución de la balanza', min: 0.1, max: 5, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + ' g', log: false });
    sim.out('dv', 'Agua desplazada de más', { hl: true });
    sim.out('dw', 'Pérdida de peso en agua, de menos');
    sim.out('det', '¿Se detecta con esa balanza?');
    sim.note('Una corona de oro puro y otra de la misma masa con plata desplazan distinto volumen de agua: la de plata, más voluminosa, pierde más peso al sumergirse (empuje = peso del agua desplazada). Arquímedes lo habría demostrado en <em>Sobre los cuerpos flotantes</em>. La técnica la propuso Galileo en su <em>Bilancetta</em> (1586).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const r = C.crown(p.m, p.f), pure = C.crown(p.m, 0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 0.4, ymin: 0, ymax: Math.max(25, 1.1 * C.crown(p.m, 0.4).dV), xlabel: 'fracción de plata', ylabel: 'agua desplazada de más (cm³ ≈ g)' });
      pl.frame();
      pl.fn((x) => C.crown(p.m, x).dV, { color: '--c1', width: 2.4 });
      pl.hline(p.res, { color: '--c2', label: 'resolución de la balanza', labelRight: true });
      pl.dot(p.f, r.dV, { color: '--accent', r: 6 });
      sim.set('dv', EM.fix(r.dV, 2) + ' cm³');
      sim.set('dw', EM.fix(r.dV, 2) + ' g (1 g por cm³)');
      sim.set('det', r.dV > p.res ? 'Sí (margen ' + EM.fix(r.dV / p.res, 1) + '×)' : 'No');
    });
  });

  /* 5.4 El ecuante de Ptolomeo */
  EM.defineSim('ecuante', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('e', { label: 'Excentricidad e de la órbita (Marte = 0.0934)', min: 0.01, max: 0.25, step: 0.001, value: 0.0934, fmt: (v) => v.toFixed(4) });
    sim.seg('mod', { label: 'Modelo', options: [['exc', 'Excéntrica sin ecuante'], ['bis', 'Ecuante bisecado'], ['lib', 'Ecuante libre']], value: 'bis' });
    sim.slider('qf', { label: 'Posición del ecuante, en unidades de e', min: 0, max: 3, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.out('mx', 'Error máximo en longitud', { hl: true });
    sim.out('arc', 'En minutos de arco');
    sim.note('Se compara la posición angular del planeta según Kepler (elipse, ley de las áreas) con la de Ptolomeo (círculo excéntrico recorrido con velocidad angular uniforme respecto de un punto, el ecuante). Ptolomeo duplicó la distancia al ecuante (la «bisección de la excentricidad») para ajustar mejor Marte.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const qf = p.mod === 'exc' ? 1 : p.mod === 'bis' ? 2 : p.qf;
      const er = C.equantError(p.e, qf, 360);
      const ymax = Math.max(0.5, Math.max(...er.arr.map(Math.abs)) * 1.15);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 360, ymin: -ymax, ymax, xlabel: 'anomalía media M (°)', ylabel: 'longitud Ptolomeo − Kepler (°)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(er.arr.map((_, i) => i), er.arr, { color: '--c2', width: 2.2 });
      const mx = er.max;
      sim.set('mx', EM.fix(mx, 3) + '°');
      sim.set('arc', EM.fix(mx * 60, 1) + '′ (Tycho medía a 1–2′)');
    });
  });
})();
