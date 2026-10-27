/* Capítulo 24 — Rayos X, radiactividad, electrón y núcleo */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI;
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* 24.1 Thomson: campos cruzados */
  EM.defineSim('thomson-cruzados', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V', { label: 'Tensión de aceleración', min: 100, max: 2000, step: 10, value: 500, fmt: (v) => v.toFixed(0) + ' V' });
    sim.slider('E', { label: 'Campo eléctrico entre las placas', min: 5000, max: 80000, step: 500, value: 30000, fmt: (v) => (v / 1000).toFixed(1) + ' kV/m' });
    sim.slider('B', { label: 'Campo magnético', min: 0, max: 3, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) + ' mT' });
    sim.out('v', 'Velocidad de los rayos catódicos (calculada del equilibrio)', { hl: true });
    sim.out('bal', 'B que anula la desviación: E/v');
    sim.out('em', 'e/m deducida con solo B (θ = eBL/mv)');
    sim.note('Thomson (1897) hizo pasar rayos catódicos por una región con campos eléctrico y magnético perpendiculares. Ajustó \\(B\\) hasta que el haz volvía a la posición sin desviar: entonces \\(eE=evB\\) y \\(v=E/B\\). Quitó el campo eléctrico y midió la desviación magnética \\(\\theta=eBL/(mv)\\): de ahí \\(e/m\\). Resultó 1000 veces mayor que la del ion hidrógeno (el menor conocido) y no dependía del gas ni del metal del cátodo: una partícula universal, más ligera que cualquier átomo.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, L = 0.05, Dscr = 0.25, em = C.QE / C.ME, v = Math.sqrt(2 * em * p.V), B = p.B * 1e-3;
      EM.draw.clear(cv);
      const bal = p.E / v, y = (Bt) => (em * (p.E - v * Bt) * L / (v * v)) * (L / 2 + Dscr) / 1; /* desviación en la pantalla (m) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 3, ymin: -0.1, ymax: 0.1, xlabel: 'campo magnético B (mT)', ylabel: 'posición del punto en la pantalla (m)' });
      pl.frame(); pl.hline(0, { color: '--ink-3' });
      pl.fn((b) => y(b * 1e-3), { color: '--c1', width: 2.2 }); pl.vline(bal * 1e3, { color: '--accent', label: 'equilibrio' });
      pl.dot(p.B, Math.max(-0.1, Math.min(0.1, y(B))), { color: '--accent', r: 6 });
      const x0 = W * 0.66, y0 = H * 0.5, x1 = W - 30;
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(x0 + 40, y0 - 40, 70, 4); ctx.fillRect(x0 + 40, y0 + 36, 70, 4);
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0);
      const sy = Math.max(-0.1, Math.min(0.1, y(B))) * 700;
      ctx.lineTo(x0 + 110, y0 - (sy * 0.18)); ctx.lineTo(x1, y0 - sy); ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(x1, y0 - sy, 5, 0, TAU); ctx.fill();
      EM.text(ctx, 'cátodo', x0, y0 + 22, { size: 10.5, color: '--ink-2' }); EM.text(ctx, 'pantalla', x1, y0 + 56, { size: 10.5, align: 'right', color: '--ink-2' });
      const thB = C.thomsonDeflection(em, p.E, bal, L), emd = C.thomsonEm(thB, p.E, bal, L);
      sim.set('v', EM.fix(v / 1e6, 2) + ' ×10⁶ m/s (' + EM.fix(v / 299792458, 3) + ' c)');
      sim.set('bal', EM.fix(bal * 1e3, 3) + ' mT');
      sim.set('em', EM.fix(emd / 1e11, 4) + ' ×10¹¹ C/kg  (el ion H⁺: 9.6×10⁷ C/kg)');
    });
  });

  /* 24.2 Millikan: gotas */
  EM.defineSim('millikan-gotas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Número de gotas medidas', min: 10, max: 200, step: 5, value: 60, fmt: (v) => v.toFixed(0) });
    sim.slider('ru', { label: 'Error de medida de cada carga', min: 0.1, max: 4, step: 0.1, value: 0.8, fmt: (v) => v.toFixed(1) + ' %' });
    sim.slider('s', { label: 'Semilla', min: 1, max: 30, step: 1, value: 7, fmt: (v) => v.toFixed(0) });
    sim.out('e', 'Carga elemental ajustada', { hl: true });
    sim.out('d', 'Diferencia con 1.602×10⁻¹⁹ C');
    sim.note('Cada punto es una gota de aceite: carga medida con la ley de Stokes (\\(q=6\\pi\\eta a(v_f+v_r)/E\\)). Si la carga es discreta, los puntos se agrupan en niveles equiespaciados, múltiplos enteros de \\(e\\). Con pocas gotas o mucho error los niveles se confunden: Millikan necesitó miles de mediciones y elegir aquellas gotas cuya medida era fiable (y fue acusado después de haber descartado datos). Ehrenhaft, en Viena, aseguraba haber visto cargas menores que \\(e\\) con partículas metálicas.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, r = rng(p.s * 977);
      EM.draw.clear(cv);
      const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(TAU * r());
      const qs = []; for (let i = 0; i < p.n; i++) { const k = 1 + Math.floor(r() * r() * 8); qs.push(k * C.QE * (1 + (p.ru / 100) * gauss())); }
      qs.sort((a, b) => a - b);
      const ef = C.fitElementary(qs, 1.0e-19, 2.6e-19, 3000);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.97, h: H, xmin: 0, xmax: qs.length + 1, ymin: 0, ymax: 14, xlabel: 'gotas ordenadas por carga', ylabel: 'carga q (10⁻¹⁹ C)' });
      pl.frame();
      for (let k = 1; k <= 8; k++) pl.hline((k * ef) * 1e19, { color: '--c3' });
      qs.forEach((q, i) => pl.dot(i + 1, q * 1e19, { color: '--c1', r: 3.5 }));
      sim.set('e', EM.fix(ef * 1e19, 4) + ' ×10⁻¹⁹ C');
      sim.set('d', EM.fix((100 * (ef - C.QE)) / C.QE, 2) + ' %');
    });
  });

  /* 24.3 Rutherford: el núcleo */
  EM.defineSim('rutherford-nucleo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía de la partícula α', min: 2, max: 9, step: 0.1, value: 5.3, fmt: (v) => v.toFixed(1) + ' MeV' });
    sim.slider('Z', { label: 'Número atómico del blanco', min: 13, max: 82, step: 1, value: 79, fmt: (v) => v.toFixed(0) });
    sim.check('pud', { label: 'Mostrar el modelo del pudín de Thomson', value: true });
    sim.out('d', 'Distancia de máximo acercamiento (choque frontal)', { hl: true });
    sim.out('p', 'Desviación máxima con el pudín (átomo de 10⁻¹⁰ m)');
    sim.out('f', 'Fracción desviada más de 90° en una lámina de 0.4 µm');
    sim.note('Geiger y Marsden (1909), a petición de Rutherford, buscaron α desviadas más de 90° por una lámina de oro: una de cada ~8000 rebotaba. En el modelo del pudín de Thomson (carga positiva repartida por todo el átomo) la deflexión máxima por átomo es de 0.0002 rad y es imposible el rebote; con una carga puntual, una α que llegue de frente se detiene a 43 fm del núcleo y rebota. Rutherford (1911) dedujo \\(\\tan(\\theta/2)=d/(2b)\\) y la distribución \\(1/\\sen^4(\\theta/2)\\), que Geiger y Marsden confirmaron en 1913.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, d = C.rutherfordD(2, p.Z, p.E * 1e6);
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.5, s = Math.min(W * 0.2, H * 0.4), bmax = 3 * d;
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
      const dp = (d * (s * 0.9)) / bmax;
      for (let k = -9; k <= 9; k++) {
        if (k === 0) continue;
        const bp = (Math.sign(k) * (Math.abs(k) - 0.5) * (s * 0.9)) / 4.5 / 1.6;
        let x = -cx + 10, y = bp, vx = 1, vy = 0;
        ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + x, cy + y);
        for (let i = 0; i < 4000; i++) {
          const r2 = x * x + y * y, r = Math.sqrt(r2), a = dp / (2 * r2), ax = (a * x) / r, ay = (a * y) / r, dt = 1.5;
          vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
          ctx.lineTo(cx + x, cy + y);
          if (x < -cx || x > W * 0.5 - cx || Math.abs(y) > cy - 6) break;
        }
        ctx.stroke();
      }
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 10, w: W * 0.4, h: H - 20, xmin: 0.0, xmax: 3, ymin: 0, ymax: 180, xlabel: 'b (en unidades de d)', ylabel: 'ángulo de dispersión (°)' });
      pl.frame(); pl.fn((b) => (C.rutherfordAngle(b, 1) * 180) / PI, { color: '--c1', width: 2.2, from: 0.02 });
      if (p.pud) { const th = (C.pudingMax(p.Z, p.E * 1e6, 1e-10) * 180) / PI; pl.hline(Math.min(th, 180), { color: '--c3', label: 'pudín: ' + EM.fix(th, 3) + '°' }); }
      const sg = C.rutherfordXSAbove(PI / 2, d) * 5.9e28 * 4e-7;
      sim.set('d', EM.fix(d * 1e15, 1) + ' fm  (núcleo de oro ≈ 7 fm)');
      sim.set('p', EM.fix(C.pudingMax(p.Z, p.E * 1e6, 1e-10), 5) + ' rad (' + EM.fix((C.pudingMax(p.Z, p.E * 1e6, 1e-10) * 180) / PI, 3) + '°)');
      sim.set('f', EM.fix(sg, 7) + '  (1 de cada ' + EM.fix(1 / sg, 0) + ')');
    });
  });

  /* 24.4 Rutherford y Soddy: la cadena radiactiva */
  EM.defineSim('decaimiento-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Vida media del hijo / vida media del padre', min: 0.05, max: 5, step: 0.05, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.check('log', { label: 'Escala logarítmica', value: false });
    sim.out('t', 'Instante en que el hijo es más abundante', { hl: true });
    sim.out('eq', 'Cociente hijo/padre en el equilibrio secular o transitorio');
    sim.note('Rutherford y Soddy (1902) mostraron en Montreal que el torio emite un gas (la «emanación», radón) y que su actividad decae a la mitad en cada intervalo fijo de tiempo: los elementos se transforman, uno en otro. La actividad de un padre decae como \\(2^{-t/T}\\); la del hijo crece y luego decrece siguiendo la ecuación de Bateman. Si el hijo vive mucho menos que el padre, ambos se igualan en actividad (equilibrio secular): así los Curie hallaron el radio junto al uranio en la pechblenda.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, l1 = Math.LN2, l2 = Math.LN2 / p.r, tmax = 8;
      EM.draw.clear(cv);
      const f1 = (t) => C.bateman2(1, l1, l2, t).n1, f2 = (t) => C.bateman2(1, l1, l2, t).n2;
      const g = (f) => (t) => (p.log ? Math.log10(Math.max(f(t), 1e-6)) : f(t));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: tmax, ymin: p.log ? -4 : 0, ymax: p.log ? 0.2 : 1.05, xlabel: 'tiempo (en vidas medias del padre)', ylabel: p.log ? 'log₁₀ N' : 'átomos (relativo)' });
      pl.frame(); pl.fn(g(f1), { color: '--c1', width: 2.2, label: 'padre' }); pl.fn(g(f2), { color: '--c3', width: 2.2, label: 'hijo' });
      const tm = l1 === l2 ? 1 / l1 : Math.log(l2 / l1) / (l2 - l1);
      sim.set('t', EM.fix(tm / (1 / l1) * 1, 3) + ' (en unidades de 1/λ₁), es decir ' + EM.fix(tm * l1 / Math.LN2, 2) + ' vidas medias del padre');
      sim.set('eq', l2 > l1 ? EM.fix(l1 / (l2 - l1), 4) + '  (N₂/N₁ = λ₁/(λ₂−λ₁))' : 'el hijo se acumula: no hay equilibrio');
    });
  });
})();
