/* Capítulo 8 — Europa medieval */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, DEG = PI / 180;

  /* 8.1 El arcoíris en una gota */
  EM.defineSim('arcoiris', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('k', { label: 'Arco', options: [[1, 'Primario (1 reflexión)'], [2, 'Secundario (2 reflexiones)']], value: 1 });
    sim.slider('b', { label: 'Parámetro de impacto b = sen i', min: 0.05, max: 0.99, step: 0.005, value: 0.86, fmt: (v) => v.toFixed(3) });
    sim.slider('n', { label: 'Índice del agua (rojo 1.331 – violeta 1.344)', min: 1.328, max: 1.346, step: 0.001, value: 1.333, fmt: (v) => v.toFixed(3) });
    sim.out('i', 'Incidencia', { hl: true });
    sim.out('D', 'Desviación total del rayo');
    sim.out('min', 'Desviación mínima (arco)');
    sim.out('ang', 'Ángulo del arco desde el punto antisolar');
    sim.note('Los rayos que entran a la gota con distinto parámetro de impacto salen con desviaciones distintas, pero hay una desviación <em>mínima</em>: cerca de ella salen muchos rayos en la misma dirección, y allí se ve el arco. Theodoric de Freiberg (c. 1304) y Al-Farisi (c. 1309) reprodujeron el recorrido en un frasco de agua; Descartes (1637) calculó los ángulos con la ley de la refracción.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, k = p.k;
      EM.draw.clear(cv);
      const half = W * 0.5, cx = half * 0.52, cy = H * 0.5, R = Math.min(half * 0.4, H * 0.38);
      ctx.strokeStyle = EM.col('--water'); ctx.fillStyle = EM.alpha('--water', 0.12); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.fill(); ctx.stroke();
      const i = Math.asin(p.b), r = Math.asin(p.b / p.n);
      const P = (phi) => [cx + R * Math.cos(phi), cy - R * Math.sin(phi)];
      let phi = PI - i; const verts = [P(phi)];
      for (let j = 0; j <= k; j++) { phi -= PI - 2 * r; verts.push(P(phi)); }
      const Dtot = C.dropDeviation(i, p.n, k);
      ctx.lineWidth = 2; ctx.strokeStyle = EM.col('--ray'); ctx.beginPath(); ctx.moveTo(cx - R * 1.9, cy - R * p.b);
      verts.forEach((v) => ctx.lineTo(v[0], v[1]));
      const exit = verts[verts.length - 1];
      ctx.lineTo(exit[0] + Math.cos(Dtot) * R * 1.7, exit[1] + Math.sin(Dtot) * R * 1.7);
      ctx.stroke();
      EM.text(ctx, 'luz solar →', 10, 20, { size: 12, color: '--ink-3' });
      /* gráfica D(i) */
      const pl = new EM.Plot(ctx, { x: half + 8, y: 6, w: W - half - 14, h: H - 12, xmin: 0, xmax: 90, ymin: k === 1 ? 130 : 220, ymax: k === 1 ? 180 : 330, xlabel: 'incidencia i (°)', ylabel: 'desviación D (°)' });
      pl.frame();
      pl.fn((x) => C.dropDeviation(x * DEG, p.n, k) / DEG, { color: '--c1', width: 2.2, from: 1 });
      const imin = C.rainbowIncidence(p.n, k) / DEG, Dmin = C.dropDeviation(imin * DEG, p.n, k) / DEG;
      pl.dot(imin, Dmin, { color: '--c2', r: 6 }); pl.hline(Dmin, { color: '--c2', label: 'mínimo', labelRight: true });
      pl.dot(i / DEG, C.dropDeviation(i, p.n, k) / DEG, { color: '--accent', r: 5 });
      sim.set('i', EM.fix(i / DEG, 1) + '°');
      sim.set('D', EM.fix(Dtot / DEG, 1) + '°');
      sim.set('min', EM.fix(Dmin, 1) + '° (en i = ' + EM.fix(imin, 1) + '°)');
      sim.set('ang', EM.fix(C.rainbowAngle(p.n, k), 1) + '°  (rojo ' + EM.fix(C.rainbowAngle(1.331, k), 1) + '°, violeta ' + EM.fix(C.rainbowAngle(1.344, k), 1) + '°)');
    });
  });

  /* 8.2 Oresme: velocidad como área */
  EM.defineSim('oresme', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Intervalos de tiempo iguales', min: 2, max: 10, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.seg('modo', { label: 'Movimiento', options: [['uni', 'Uniforme'], ['dif', 'Uniformemente difforme (acelerado)']], value: 'dif' });
    sim.out('area', 'Distancia total (área bajo la línea)', { hl: true });
    sim.out('merton', 'Regla de Merton: velocidad media × tiempo');
    sim.out('ratio', 'Distancias por intervalo (unidades de la primera)');
    sim.note('Oresme (c. 1350) propone representar la <em>intensidad</em> de una cualidad (aquí, la velocidad) con una altura sobre una línea que representa su extensión (el tiempo). La distancia es el área. En un movimiento uniformemente difforme el área es un triángulo, igual a la de un rectángulo con la velocidad del instante medio: es el teorema de Merton (Heytesbury, c. 1335). Faltaba aplicarlo a la caída; Galileo lo hizo en 1604-1638.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, n = Math.round(p.n);
      EM.draw.clear(cv);
      const x0 = 50, x1 = W - 20, y0 = H - 40, hmax = H - 70;
      const v = (t) => (p.modo === 'dif' ? t : 0.6);
      ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, 12); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      EM.text(ctx, 'tiempo (extensión)', x1, y0 + 22, { size: 11.5, align: 'right', color: '--ink-3' });
      EM.text(ctx, 'velocidad (intensidad)', 56, 16, { size: 11.5, color: '--ink-3' });
      const dist = [];
      for (let j = 0; j < n; j++) {
        const t0 = j / n, t1 = (j + 1) / n, xa = x0 + t0 * (x1 - x0), xb = x0 + t1 * (x1 - x0);
        ctx.fillStyle = EM.alpha(j % 2 ? '--c1' : '--c3', 0.45); ctx.beginPath();
        ctx.moveTo(xa, y0); ctx.lineTo(xa, y0 - v(t0) * hmax); ctx.lineTo(xb, y0 - v(t1) * hmax); ctx.lineTo(xb, y0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = EM.col('--ink-3'); ctx.stroke();
        dist.push(0.5 * (v(t0) + v(t1)) / n);
        EM.text(ctx, EM.fix(dist[j] / dist[0], 0), (xa + xb) / 2, y0 - 6 - ((v(t0) + v(t1)) / 4) * hmax * 0.5, { size: 12, align: 'center', weight: 650, color: '--ink' });
      }
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0, y0 - v(0) * hmax); ctx.lineTo(x1, y0 - v(1) * hmax); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = EM.col('--c2'); ctx.beginPath(); ctx.moveTo(x0, y0 - v(0.5) * hmax); ctx.lineTo(x1, y0 - v(0.5) * hmax); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'velocidad media', x1 - 4, y0 - v(0.5) * hmax - 6, { size: 11.5, align: 'right', color: '--c2' });
      const tot = dist.reduce((a, b) => a + b, 0);
      sim.set('area', EM.fix(tot, 4) + (p.modo === 'dif' ? '  (= ½ a t² con a = 1)' : ''));
      sim.set('merton', EM.fix(C.meanSpeedDistance(v(0), v(1), 1), 4));
      sim.set('ratio', dist.map((d) => EM.fix(d / dist[0], 0)).join(' : '));
    });
  });

  /* 8.3 La serie armónica de Oresme */
  EM.defineSim('armonica', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('k', { label: 'Términos: 2 elevado a k', min: 1, max: 20, step: 1, value: 10, fmt: (v) => '2^' + v.toFixed(0) + ' = ' + Math.pow(2, v).toLocaleString('es') });
    sim.out('H', 'Suma parcial', { hl: true });
    sim.out('b', 'Cota de Oresme: 1 + k/2');
    sim.out('l', 'ln n + γ');
    sim.note('Oresme (c. 1360) agrupó los términos: 1/3 + 1/4 > 1/2; 1/5 + … + 1/8 > 1/2; y así siempre. Cada grupo sobrepasa ½, así que la suma no tiene límite. Es la primera demostración de que una serie de términos decrecientes puede divergir; se olvidó y fue redescubierta por Mengoli (1650) y Bernoulli (1689).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, k = Math.round(sim.p.k);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 20, ymin: 0, ymax: 12, xlabel: 'k  (n = 2^k términos)', ylabel: 'suma' });
      pl.frame();
      const ks = [], hs = [], bs = [];
      for (let j = 0; j <= 20; j++) { ks.push(j); hs.push(C.harmonic(Math.pow(2, j))); bs.push(1 + j / 2); }
      pl.xy(ks, hs, { color: '--c1', width: 2.4 });
      pl.xy(ks, bs, { color: '--c2', width: 1.6, dash: [5, 4] });
      pl.dot(k, hs[k], { color: '--accent', r: 6 });
      pl.legend([{ label: 'suma armónica', color: '--c1' }, { label: 'cota de Oresme 1 + k/2', color: '--c2', kind: 'dash' }], 'tl');
      sim.set('H', EM.fix(hs[k], 4));
      sim.set('b', EM.fix(bs[k], 1));
      sim.set('l', EM.fix(Math.log(Math.pow(2, k)) + 0.5772156649, 4));
    });
  });

  /* 8.4 Aristóteles frente a Bradwardine */
  EM.defineSim('bradwardine', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('r', { label: 'Razón fuerza / resistencia (F/R)', min: 0.1, max: 8, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) });
    sim.out('a', 'Aristóteles: v ∝ F/R', { hl: true });
    sim.out('b', 'Bradwardine: v ∝ ln(F/R)');
    sim.out('m', '¿Hay movimiento?');
    sim.note('Se normaliza para que ambas reglas den 1 cuando F/R = 2. Con F < R Aristóteles predice un movimiento lento; Bradwardine, con razón, ninguno. Duplicar la velocidad exige duplicar F/R para Aristóteles y elevarla al cuadrado para Bradwardine.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 8, ymin: -0.1, ymax: 3.2, xlabel: 'F/R', ylabel: 'velocidad (unidades arbitrarias)' });
      pl.frame();
      const A = (x) => x / 2, B = (x) => (x > 1 ? Math.log(x) / Math.log(2) : 0);
      pl.fn(A, { color: '--c2', width: 2.2 });
      pl.fn(B, { color: '--c1', width: 2.2 });
      pl.vline(1, { color: '--ink-3', label: 'F = R' });
      pl.dot(p.r, A(p.r), { color: '--c2', r: 5 }); pl.dot(p.r, B(p.r), { color: '--c1', r: 5 });
      pl.legend([{ label: 'Aristóteles', color: '--c2' }, { label: 'Bradwardine (1328)', color: '--c1' }], 'tl');
      sim.set('a', EM.fix(A(p.r), 3));
      sim.set('b', EM.fix(B(p.r), 3));
      sim.set('m', p.r > 1 ? 'sí (F > R)' : 'no según Bradwardine; sí (¡absurdo!) según Aristóteles');
    });
  });
})();
