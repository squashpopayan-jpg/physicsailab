/* Capítulo 14 — Newton: los Principia */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI;

  /* 14.1 La prueba de la Luna */
  EM.defineSim('prueba-luna', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('re', { label: 'Radio de la Tierra que usó', options: [['mar', 'Marineros: 60 millas/grado (1666)'], ['pic', 'Picard (1670): 57 060 toesas/grado'], ['mod', 'Valor moderno']], value: 'mar' });
    sim.slider('r', { label: 'Distancia a la Luna (radios terrestres)', min: 55, max: 65, step: 0.01, value: 60, fmt: (v) => v.toFixed(2) });
    sim.out('re', 'Radio terrestre empleado', { hl: true });
    sim.out('am', 'Aceleración centrípeta de la Luna (4π²r/T²)');
    sim.out('gp', 'g / (distancia)²: la gravedad terrestre «diluida»');
    sim.out('q', 'Cociente a_Luna / (g/r²)');
    sim.note('Newton hizo la comparación en 1666: si la fuerza que mantiene a la Luna es la misma gravedad, disminuida como el inverso del cuadrado de la distancia (60 radios), la aceleración de la Luna debe ser g/3600. Con el valor de los marineros (60 millas por grado, un radio de 5 530 km) le salió una diferencia de un sexto, y lo dejó de lado durante veinte años. Cuando conoció la medida de Picard (1670) la discrepancia casi desapareció.');
    const RE = { mar: 5532, pic: 6372, mod: 6371 };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, Re = RE[p.re], t = C.moonTest(Re, p.r, 27.321661);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 55, xmax: 65, ymin: 2.2e-3, ymax: 3.0e-3, xlabel: 'distancia a la Luna (radios terrestres)', ylabel: 'aceleración (m/s²)' });
      pl.frame();
      pl.fn((r) => K.g / (r * r), { color: '--c1', width: 2.2 });
      pl.fn((r) => C.moonTest(Re, r, 27.321661).aMoon, { color: '--c2', width: 2.2 });
      pl.legend([{ label: 'g/r²  (gravedad diluida)', color: '--c1' }, { label: 'aceleración de la Luna observada', color: '--c2' }], 'tr');
      pl.dot(p.r, t.gPred, { color: '--c1', r: 5 }); pl.dot(p.r, t.aMoon, { color: '--c2', r: 5 });
      sim.set('re', EM.fix(Re, 0) + ' km');
      sim.set('am', EM.sci(t.aMoon, 4) + ' m/s²');
      sim.set('gp', EM.sci(t.gPred, 4) + ' m/s²');
      sim.set('q', EM.fix(t.ratio, 3) + (Math.abs(t.ratio - 1) < 0.02 ? '  → coinciden' : '  → no coinciden (' + EM.fix(100 * (t.ratio - 1), 0) + ' %)'));
    });
  });

  /* 14.2 Órbitas bajo fuerzas centrales */
  EM.defineSim('orbita-newton', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('n', { label: 'Exponente de la fuerza: F ∝ 1/rⁿ', min: 1, max: 2.8, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('f', { label: 'Velocidad inicial (1 = circular)', min: 0.45, max: 1.35, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.out('e', 'Excentricidad medida', { hl: true });
    sim.out('L', 'Momento angular final / inicial');
    sim.out('ap', 'Ángulo entre ápsides: medido y teórico (π/√(3−n))');
    sim.out('cl', '¿Órbita cerrada?');
    sim.note('Con una fuerza central, el radio vector barre áreas iguales en tiempos iguales (segunda ley de Kepler) sea cual sea \\(n\\). Con \\(n=2\\) la órbita es una elipse cerrada. Con cualquier otro exponente es una roseta que precede: solo \\(n=2\\) (y \\(n=-1\\), el oscilador) dan órbitas cerradas (teorema de Bertrand, 1873). Newton demostró en los <em>Principia</em> (I, prop. 44-45) que una pequeña desviación de la ley inversa del cuadrado equivale a una precesión del perihelio.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const o = C.centralOrbit(p.n, p.f, 1, 40, 0.002);
      const cx = W / 2, cy = H / 2, sc = Math.min(W, H) * 0.36 / Math.min(Math.max(o.rmax, 1), 3);
      ctx.strokeStyle = EM.alpha('--c1', 0.8); ctx.lineWidth = 1.2; ctx.beginPath();
      o.pts.forEach((q, i) => { const x = cx + q[0] * sc, y = cy - q[1] * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + sc, cy, 4.5, 0, TAU); ctx.fill();
      EM.text(ctx, 'salida', cx + sc + 8, cy - 8, { size: 11, color: '--accent' });
      const mins = o.apsides.filter((a) => a.kind === 'min' || a.kind === 'max');
      let meas = '—';
      if (mins.length >= 2) { const d = []; for (let i = 1; i < mins.length; i++) d.push(mins[i].theta - mins[i - 1].theta); meas = EM.fix(d.reduce((a, b) => a + b, 0) / d.length / PI, 3) + ' π'; }
      const e = (o.rmax - o.rmin) / (o.rmax + o.rmin);
      sim.set('e', EM.fix(e, 3) + '   (rmín = ' + EM.fix(o.rmin, 3) + ', rmáx = ' + EM.fix(o.rmax, 3) + ')');
      sim.set('L', EM.fix(o.L / o.L0, 6));
      sim.set('ap', meas + '  /  ' + EM.fix(C.apsidalAngle(p.n) / PI, 3) + ' π (cerca de la circular)');
      sim.set('cl', Math.abs(p.n - 2) < 0.005 ? 'sí: elipse de Kepler' : 'no: roseta con precesión');
    });
  });

  /* 14.3 El cañón de Newton */
  EM.defineSim('canon-newton', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('v', { label: 'Velocidad horizontal del proyectil', min: 1, max: 12, step: 0.05, value: 7.0, fmt: (v) => v.toFixed(2) + ' km/s' });
    sim.slider('h', { label: 'Altura de la montaña', min: 0.05, max: 300, step: 0.05, value: 100, fmt: (v) => v.toFixed(1) + ' km' });
    sim.out('vc', 'Velocidad circular en esa altura', { hl: true });
    sim.out('ve', 'Velocidad de escape');
    sim.out('res', 'Resultado');
    sim.note('Newton, en <em>El sistema del mundo</em> (1685-1687): «si se dispara un proyectil horizontalmente desde una montaña con velocidad creciente, cada vez llega más lejos; cuando la velocidad es suficiente, no cae nunca: da la vuelta a la Tierra». La caída de una manzana y el movimiento de la Luna son el mismo fenómeno. Con la velocidad exacta el resultado es un círculo (7.9 km/s a nivel del suelo); con más, una elipse; a 11.2 km/s, una parábola: se escapa.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const GM = 398600.4418, R = 6371, r0 = R + p.h;
      const vc = Math.sqrt(GM / r0), ve = Math.sqrt((2 * GM) / r0);
      const T = 2 * PI * Math.sqrt(Math.pow(r0, 3) / GM);
      const o = C.cannon(p.v, p.h, p.v >= ve ? 5 * T : 3 * T);
      const cx = W / 2, cy = H * 0.55, sc = Math.min(W, H) * 0.3 / R * 1.0;
      ctx.fillStyle = EM.alpha('--water', 0.25); ctx.strokeStyle = EM.col('--water'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R * sc, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.8; ctx.beginPath();
      o.pts.forEach((q, i) => { const x = cx + q[0] * sc, y = cy - q[1] * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.moveTo(cx, cy - R * sc); ctx.lineTo(cx - 7, cy - r0 * sc * 1.0); ctx.lineTo(cx + 7, cy - r0 * sc * 1.0); ctx.closePath(); ctx.fillStyle = EM.col('--sand'); ctx.fill();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx, cy - r0 * sc, 4, 0, TAU); ctx.fill();
      let res;
      if (o.hit) res = 'Cae a ' + EM.fix(((Math.atan2(o.hit.x, o.hit.y) * R)), 0) + ' km de la montaña (a los ' + EM.fix(o.hit.t / 60, 1) + ' min)';
      else if (p.v >= ve) res = 'Escapa del campo de la Tierra (parábola o hipérbola)';
      else res = Math.abs(p.v - vc) < 0.02 ? 'Órbita circular' : 'Órbita elíptica: no vuelve a tocar el suelo';
      sim.set('vc', EM.fix(vc, 3) + ' km/s');
      sim.set('ve', EM.fix(ve, 3) + ' km/s  (= √2 × v circular)');
      sim.set('res', res);
    });
  });
})();
