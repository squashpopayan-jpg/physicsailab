/* Capítulo 7 — La luz y el método: la ciencia del Islam */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, DEG = PI / 180;

  /* 7.1 Al-Biruni: el radio de la Tierra desde una montaña */
  EM.defineSim('biruni', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('h', { label: 'Altura de la montaña', min: 100, max: 1500, step: 10, value: 305, fmt: (v) => v.toFixed(0) + ' m' });
    sim.slider('dip', { label: 'Depresión del horizonte', min: 0.2, max: 2, step: 0.005, value: 0.567, fmt: (v) => (v * 60).toFixed(1) + '′' });
    sim.slider('err', { label: 'Error de lectura del astrolabio', min: -3, max: 3, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + '′' });
    sim.out('R', 'Radio calculado de la Tierra', { hl: true });
    sim.out('e', 'Error respecto de 6 371 km');
    sim.out('hb', 'Dip esperado a esa altura (real)');
    sim.note('Desde la cima se mide con un astrolabio el ángulo θ por debajo de la horizontal al que se ve el horizonte. Con la geometría de la tangente: \\(\\cos\\theta=R/(R+h)\\), de donde \\(R=h\\cos\\theta/(1-\\cos\\theta)\\). Biruni (c. 1025) obtuvo unos 6 340 km según la literatura. Un error de un minuto de arco en θ cambia el resultado un 5-6 %; por eso eligió una gran altura.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const th = (p.dip + p.err / 60) * DEG, R = C.biruniRadius(p.h, Math.max(1e-4, th)) / 1000;
      /* Esquema exagerado */
      const cx = W * 0.5, Rpx = H * 1.4, cy = H * 0.98 + Rpx - H * 0.2, hpx = H * 0.35;
      ctx.fillStyle = EM.alpha('--water', 0.15); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * PI); ctx.fill(); ctx.stroke();
      const top = [cx - 0.22 * W, cy - Rpx - hpx];
      const base = [top[0], cy - Rpx * 0.995];
      ctx.strokeStyle = EM.col('--sand'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(top[0] - 8, base[1] + 4); ctx.lineTo(top[0], top[1]); ctx.stroke();
      ctx.strokeStyle = EM.alpha('--ink-3', 0.8); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0] + W * 0.55, top[1]); ctx.stroke(); ctx.setLineDash([]);
      /* tangente al horizonte */
      const d = Math.sqrt(Math.pow(Rpx + hpx, 2) - Rpx * Rpx), a0 = Math.asin(Rpx / (Rpx + hpx));
      const ang = Math.atan2(cy - top[1], cx - top[0]);
      const dirA = ang - a0;
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0] + d * Math.cos(dirA), top[1] + d * Math.sin(dirA)); ctx.stroke();
      EM.text(ctx, 'θ', top[0] + 52, top[1] + 22, { size: 13, color: '--ray', weight: 650 });
      EM.text(ctx, 'cima, h = ' + p.h + ' m', top[0] - 12, top[1] - 10, { size: 12, align: 'right', color: '--ink-2' });
      EM.text(ctx, 'horizonte', top[0] + d * Math.cos(dirA) - 10, top[1] + d * Math.sin(dirA) - 8, { size: 12, align: 'right', color: '--ray' });
      EM.text(ctx, '(dibujo muy exagerado)', W - 12, H - 10, { size: 11, align: 'right', color: '--ink-3' });
      sim.set('R', EM.fix(R, 0) + ' km');
      sim.set('e', (R > 6371 ? '+' : '') + EM.fix((100 * (R - 6371)) / 6371, 1) + ' %');
      sim.set('hb', EM.fix((Math.acos(6371000 / (6371000 + p.h)) * 60) / DEG, 1) + '′');
    });
  });

  /* 7.2 Cámara oscura: tamaño óptimo del orificio */
  EM.defineSim('camara-oscura', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('d', { label: 'Diámetro del orificio', min: 0.05, max: 4, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) + ' mm', log: true });
    sim.slider('f', { label: 'Distancia del orificio a la pantalla', min: 10, max: 200, step: 5, value: 50, fmt: (v) => v.toFixed(0) + ' cm' });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 10, value: 550, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.out('opt', 'Orificio óptimo', { hl: true });
    sim.out('b', 'Borrosidad total con el orificio elegido');
    sim.out('q', 'Dominante');
    sim.note('Al-Haytham vio que un orificio más pequeño da una imagen más nítida, hasta cierto punto. Hoy sabemos por qué: un orificio grande borra por geometría (la mancha es del tamaño del orificio) y uno muy pequeño por difracción (la mancha crece como \\(2.44\\lambda f/d\\)). El mínimo está en \\(d=\\sqrt{2.44\\lambda f}\\), unos 0.8 mm con una pantalla a 50 cm.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, f = p.f / 100, lam = p.lam * 1e-9, d = p.d * 1e-3;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.05, xmax: 4, ymin: 0.2, ymax: 20, xlog: true, ylog: true, xlabel: 'diámetro del orificio (mm)', ylabel: 'borrosidad en la pantalla (mm)' });
      pl.frame();
      const g = (x) => C.pinholeBlur(x * 1e-3, f, lam);
      pl.fn((x) => g(x).geo * 1e3, { color: '--c2', width: 1.6, dash: [5, 4] });
      pl.fn((x) => g(x).dif * 1e3, { color: '--c1', width: 1.6, dash: [5, 4] });
      pl.fn((x) => g(x).tot * 1e3, { color: '--ink', width: 2.6 });
      const opt = C.pinholeOptimum(f, lam) * 1e3;
      pl.vline(opt, { color: '--accent', label: 'óptimo' });
      const b = C.pinholeBlur(d, f, lam);
      pl.dot(p.d, b.tot * 1e3, { color: '--accent', r: 6 });
      pl.legend([{ label: 'geométrica (≈ d)', color: '--c2', kind: 'dash' }, { label: 'difracción (2.44 λf/d)', color: '--c1', kind: 'dash' }, { label: 'total', color: '--ink' }], 'tr');
      sim.set('opt', EM.fix(opt, 2) + ' mm');
      sim.set('b', EM.fix(b.tot * 1e3, 2) + ' mm');
      sim.set('q', b.geo > b.dif ? 'geometría (orificio grande)' : 'difracción (orificio pequeño)');
    });
  });

  /* 7.3 Ibn Sahl: razón de longitudes en la refracción */
  EM.defineSim('sahl', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('n', { label: 'Índice de refracción del segundo medio', min: 1, max: 2.4, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 5, max: 85, step: 1, value: 50, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('l', 'Cociente de longitudes L₂/L₁ (Ibn Sahl)', { hl: true });
    sim.out('s', 'sen θ₁ / sen θ₂ (Snell)');
    sim.out('t2', 'Ángulo refractado');
    sim.note('Ibn Sahl (984) demuestra que, para un cristal dado, el cociente entre las longitudes de los rayos incidente y refractado medidas hasta una misma recta paralela a la normal es constante. Es la ley de Snell en forma geométrica, 637 años antes de Snell (1621) y 653 antes de la publicación de Descartes (1637).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const y0 = H * 0.5, x0 = W * 0.4;
      ctx.fillStyle = EM.alpha('--glass', 0.35); ctx.fillRect(0, y0, W, H - y0);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, 6); ctx.lineTo(x0, H - 6); ctx.stroke(); ctx.setLineDash([]);
      const th1 = p.th * DEG, r = C.refract(1, p.n, th1), x1 = x0 + W * 0.24; /* recta paralela a la normal a distancia fija */
      const L1 = (x1 - x0) / Math.sin(th1), L2 = (x1 - x0) / Math.sin(r.th2);
      const A = [x0 - L1 * Math.sin(th1), y0 - L1 * Math.cos(th1)], B = [x1, y0 - L1 * Math.cos(th1)], Cc = [x1, y0 + L2 * Math.cos(r.th2)];
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(x0, y0); ctx.lineTo(Cc[0], Cc[1]); ctx.stroke();
      ctx.strokeStyle = EM.alpha('--ink-2', 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1, 6); ctx.lineTo(x1, H - 6); ctx.stroke();
      ctx.strokeStyle = EM.alpha('--c2', 0.8); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'L₁', (x0 + B[0]) / 2 + 6, (y0 + B[1]) / 2 - 6, { size: 13, color: '--ray', weight: 650 });
      EM.text(ctx, 'L₂', (x0 + Cc[0]) / 2 + 6, (y0 + Cc[1]) / 2 + 14, { size: 13, color: '--ray', weight: 650 });
      EM.text(ctx, 'aire', 12, y0 - 10, { size: 12, color: '--ink-3' });
      EM.text(ctx, 'vidrio', 12, y0 + 20, { size: 12, color: '--ink-3' });
      sim.set('l', EM.fix(L2 / L1, 4) + '  (= n = ' + EM.fix(p.n, 2) + ')');
      sim.set('s', EM.fix(Math.sin(th1) / Math.sin(r.th2), 4));
      sim.set('t2', EM.fix(r.th2 / DEG, 2) + '°');
    });
  });

  /* 7.4 El par de Tusi */
  EM.defineSim('tusi', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('k', { label: 'Razón R/r de los círculos', min: 1.5, max: 3.5, step: 0.01, value: 2, fmt: (v) => v.toFixed(2) });
    sim.check('tr', { label: 'Traza del punto', value: true });
    sim.out('y', 'Máxima desviación respecto de una recta (en r)', { hl: true });
    sim.out('a', 'Amplitud del movimiento lineal (en r)');
    sim.note('Si el círculo pequeño tiene la mitad de radio que el grande y rueda por dentro, un punto de su circunferencia oscila sobre una recta (un diámetro): se convierte un movimiento circular uniforme en uno lineal. Al-Tusi (1247) lo usó para evitar el ecuante, y Copérnico, tres siglos después, lo emplea en el <em>De revolutionibus</em> con un dibujo casi idéntico.');
    let t = 0;
    sim.animate((dt) => { t += dt * 1.2; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const r = Math.min(W, H) * 0.17, R = p.k * r, cx = W / 2, cy = H / 2;
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.stroke();
      const cc = [(R - r) * Math.cos(t), (R - r) * Math.sin(t)];
      ctx.strokeStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(cx + cc[0], cy - cc[1], r, 0, 2 * PI); ctx.stroke();
      const q = C.tusi(t, R, r);
      if (p.tr) {
        ctx.strokeStyle = EM.alpha('--c2', 0.8); ctx.lineWidth = 1.4; ctx.beginPath();
        for (let i = 0; i <= 600; i++) { const tt = (i / 600) * 2 * PI * 2; const z = C.tusi(tt, R, r); i ? ctx.lineTo(cx + z[0], cy - z[1]) : ctx.moveTo(cx + z[0], cy - z[1]); }
        ctx.stroke();
      }
      ctx.strokeStyle = EM.alpha('--ink-2', 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + cc[0], cy - cc[1]); ctx.lineTo(cx + q[0], cy - q[1]); ctx.stroke();
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(cx + q[0], cy - q[1], 5.5, 0, 2 * PI); ctx.fill();
      let mx = 0, amp = 0; for (let i = 0; i < 720; i++) { const z = C.tusi((i / 720) * 4 * PI, R, r); mx = Math.max(mx, Math.abs(z[1])); amp = Math.max(amp, Math.abs(z[0])); }
      sim.set('y', EM.fix(mx / r, 3));
      sim.set('a', EM.fix(amp / r, 3));
    });
  });
})();
