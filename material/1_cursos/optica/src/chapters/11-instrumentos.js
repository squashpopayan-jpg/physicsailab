/* Capítulo 11 — Instrumentos ópticos */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;

  /* 11.1 Lupa */
  EM.defineSim('lupa', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('f', { label: 'Focal de la lupa', min: 2, max: 12, step: 0.1, value: 5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('so', { label: 'Distancia del objeto a la lupa', min: 1, max: 12, step: 0.05, value: 4.2, unit: 'cm', fmt: (v) => v.toFixed(2) });
    sim.out('si', 'Imagen virtual a', { hl: true });
    sim.out('M', 'Aumento angular (ojo junto a la lupa)');
    sim.out('ref', 'Referencias: 25/f y 1 + 25/f');
    const ho = 0.6;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const so = Math.min(p.so, p.f * 0.999);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -30, 4, -2.2, 3.4, false);
      D.axis(ctx, v);
      D.thinLens(ctx, v, 0, 2, p.f, { label: 'lupa' });
      D.focus(ctx, v, -p.f, 'F');
      const im = D.lensRays(ctx, v, 0, p.f, { x: -so, h: ho }, { xend: 4, only: 2 });
      D.object(ctx, v, -so, ho, { label: 'objeto' });
      if (isFinite(im.x) && im.x > -30) D.object(ctx, v, im.x, im.h, { color: '--c1', dash: [4, 3], label: 'imagen virtual' });
      /* ojo */
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(1.2), v.Y(0), 6, 0, 7); ctx.fill();
      /* referencia a simple vista a 25 cm */
      D.object(ctx, v, -25, ho, { color: '--ink-3', label: '25 cm' });
      D.ray(ctx, v, [[-25, ho], [1.2, 0]], { color: '--ink-3', width: 1, dash: [3, 4] });
      const angLupa = Math.abs(im.h) / Math.abs(im.x - 1.2), ang0 = ho / 25;
      sim.set('si', isFinite(im.si) ? EM.fix(-im.si, 1) + ' cm delante de la lupa' : '∞');
      sim.set('M', EM.fix(angLupa / ang0, 2) + '×');
      sim.set('ref', EM.fix(25 / p.f, 2) + '× y ' + EM.fix(1 + 25 / p.f, 2) + '×');
    });
  });

  /* 11.2 Microscopio */
  EM.defineSim('microscopio', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('fo', { label: 'Focal del objetivo', min: 2, max: 32, step: 0.5, value: 16, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('fe', { label: 'Focal del ocular', min: 10, max: 50, step: 1, value: 25, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('NA', { label: 'Apertura numérica del objetivo', min: 0.05, max: 1.4, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.out('M', 'Aumento total', { hl: true });
    sim.out('mo', 'Objetivo × ocular');
    sim.out('res', 'Resolución 0.61λ/AN (550 nm)');
    sim.out('vac', 'Aumento útil máximo (≈ 1000 AN)');
    const L = 160;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* objeto a s_o tal que la imagen del objetivo quede a f_o + L */
      const si1 = p.fo + L, so = (si1 * p.fo) / (si1 - p.fo), xOc = si1 + p.fe;
      const ho = 0.8 * (p.fo / 16);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -so - 8, xOc + 40, -16, 10, false);
      D.axis(ctx, v);
      D.thinLens(ctx, v, 0, 6, p.fo, { label: 'objetivo' });
      D.thinLens(ctx, v, xOc, 9, p.fe, { label: 'ocular' });
      const xi = si1, hi = (-ho * si1) / so;
      for (const [u0, c] of [[0, '--ray'], [-ho / so, '--c3']]) {
        const y1 = ho + u0 * so, u1 = u0 - y1 / p.fo, y2 = y1 + u1 * xOc, u2 = u1 - y2 / p.fe;
        D.ray(ctx, v, [[-so, ho], [0, y1], [xOc, y2], [xOc + 40, y2 + u2 * 40]], { color: c, width: 1.5 });
      }
      D.object(ctx, v, -so, ho, { label: 'muestra' });
      D.object(ctx, v, xi, hi, { color: '--ink-3', label: 'imagen intermedia' });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(xOc + 18), v.Y(0), 6, 0, 7); ctx.fill();
      const mo = L / p.fo, me = 250 / p.fe;
      sim.set('M', EM.fix(mo * me, 0) + '× (imagen invertida)');
      sim.set('mo', EM.fix(mo, 1) + '× · ' + EM.fix(me, 1) + '×');
      sim.set('res', EM.fix((0.61 * 0.55) / p.NA, 3) + ' µm');
      sim.set('vac', EM.fix(1000 * p.NA, 0) + '×' + (mo * me > 1000 * p.NA ? ' · <span class="warnv">aumento vacío</span>' : ''));
    });
  });

  /* 11.3 Telescopios */
  EM.defineSim('telescopio', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('tipo', { label: 'Tipo', options: [['k', 'Kepler'], ['g', 'Galileo']], value: 'k' });
    sim.slider('fo', { label: 'Focal del objetivo', min: 200, max: 1200, step: 10, value: 600, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('fe', { label: '|Focal| del ocular', min: 10, max: 100, step: 1, value: 40, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Diámetro del objetivo', min: 30, max: 200, step: 1, value: 80, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('w', { label: 'Ángulo del objeto', min: 0, max: 1.5, step: 0.01, value: 0.6, unit: '°', fmt: (v) => v.toFixed(2) });
    sim.out('M', 'Aumento angular', { hl: true });
    sim.out('ep', 'Pupila de salida');
    sim.out('ang', 'Ángulo de salida');
    sim.out('res', 'Resolución 1.22λ/D (550 nm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, fe = p.tipo === 'k' ? p.fe : -p.fe;
      EM.draw.clear(cv);
      const d = p.fo + fe, w = p.w * DEG, M = -p.fo / fe;
      const xEP = p.tipo === 'k' ? d + (fe * (p.fo + fe)) / p.fo : d + (fe * (p.fo + fe)) / p.fo;
      const span = Math.max(d, 1) + Math.max(80, Math.abs(xEP - d) + 40);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -120, span, -p.D * 0.75, p.D * 0.75, false);
      D.axis(ctx, v);
      D.thinLens(ctx, v, 0, p.D / 2, p.fo, { label: 'objetivo' });
      D.thinLens(ctx, v, d, Math.max(10, p.fe * 0.5), fe, { label: 'ocular' });
      for (const h of [-0.45, 0, 0.45]) {
        const y0 = h * p.D, u0 = Math.tan(w);
        const y1 = y0, u1 = u0 - y1 / p.fo, y2 = y1 + u1 * d, u2 = u1 - y2 / fe;
        D.ray(ctx, v, [[-120, y0 - u0 * 120], [0, y1], [d, y2], [span, y2 + u2 * (span - d)]], { color: h ? '--ray' : '--c3', width: 1.5 });
      }
      if (isFinite(xEP)) { ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2; ctx.setLineDash([4, 3]); const r = p.D / Math.abs(M) / 2; ctx.beginPath(); ctx.moveTo(v.X(xEP), v.Y(r)); ctx.lineTo(v.X(xEP), v.Y(-r)); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, 'pupila de salida', v.X(xEP), v.Y(-r) + 14, { size: 10.5, color: '--c5', align: 'center', halo: true }); }
      sim.set('M', EM.fix(M, 2) + '×' + (M < 0 ? ' (invertida)' : ' (derecha)'));
      sim.set('ep', EM.fix(p.D / Math.abs(M), 2) + ' mm, a ' + EM.fix(xEP - d, 1) + ' mm del ocular' + (xEP - d < 0 ? ' (virtual: el ojo no puede llegar a ella)' : ''));
      sim.set('ang', EM.fix((Math.atan(Math.abs(M) * Math.tan(w)) / DEG), 2) + '°');
      sim.set('res', EM.fix(((1.22 * 550e-9) / (p.D / 1000)) * 206265, 2) + '″');
    });
  });

  /* 11.4 Cámara: campo de visión y difracción */
  EM.defineSim('camara', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const SENS = { ff: [36, 24, 'completo 36 × 24'], apsc: [23.5, 15.6, 'APS-C'], m43: [17.3, 13, 'Micro 4/3'], cel: [9.8, 7.4, 'celular 1/1.3″'] };
    sim.select('s', { label: 'Sensor', options: Object.entries(SENS).map(([k, v]) => [k, v[2]]), value: 'ff' });
    sim.slider('f', { label: 'Focal', min: 4, max: 400, log: true, value: 50, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('pix', { label: 'Tamaño de píxel', min: 0.7, max: 8, step: 0.05, value: 4.3, unit: 'µm', fmt: (v) => v.toFixed(2) });
    sim.slider('N', { label: 'Número f', min: 1.4, max: 22, step: 0.1, value: 8, fmt: (v) => 'f/' + v.toFixed(1) });
    sim.out('fov', 'Campo de visión (diagonal)', { hl: true });
    sim.out('eq', 'Focal equivalente en 35 mm');
    sim.out('airy', 'Disco de Airy 2.44λN (550 nm)');
    sim.out('lim', 'Número f límite (Airy = 2 píxeles)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, s = SENS[p.s];
      EM.draw.clear(cv);
      const diag = Math.hypot(s[0], s[1]), fov = 2 * Math.atan(diag / (2 * p.f));
      const fovH = 2 * Math.atan(s[0] / (2 * p.f)), fovV = 2 * Math.atan(s[1] / (2 * p.f));
      /* escena: paisaje esquemático de 120° × 80° */
      const sx = W * 0.58, sy = H, A0 = 120 * DEG, B0 = 80 * DEG;
      const skyg = ctx.createLinearGradient(0, 0, 0, sy * 0.6); skyg.addColorStop(0, '#6E9CCB'); skyg.addColorStop(1, '#BBD3EA');
      ctx.fillStyle = skyg; ctx.fillRect(0, 0, sx, sy * 0.6);
      ctx.fillStyle = '#6C8F5A'; ctx.fillRect(0, sy * 0.6, sx, sy * 0.4);
      ctx.fillStyle = '#4E6B44'; ctx.beginPath(); ctx.moveTo(0, sy * 0.6); for (let i = 0; i <= 12; i++) ctx.lineTo((i / 12) * sx, sy * 0.6 - (Math.sin(i * 1.7) * 0.5 + 0.6) * sy * 0.12); ctx.lineTo(sx, sy * 0.6); ctx.fill();
      ctx.fillStyle = '#F2F2EE'; ctx.fillRect(sx * 0.47, sy * 0.42, sx * 0.06, sy * 0.18); ctx.fillStyle = '#B84A3A'; ctx.beginPath(); ctx.moveTo(sx * 0.46, sy * 0.42); ctx.lineTo(sx * 0.5, sy * 0.36); ctx.lineTo(sx * 0.54, sy * 0.42); ctx.fill();
      const rw = Math.min(sx, (Math.tan(fovH / 2) / Math.tan(A0 / 2)) * sx), rh = Math.min(sy, (Math.tan(fovV / 2) / Math.tan(B0 / 2)) * sy);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.strokeRect(sx / 2 - rw / 2, sy / 2 - rh / 2, rw, rh);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(sx / 2 - rw / 2 - 1.5, sy / 2 - rh / 2 - 1.5, rw + 3, rh + 3);
      /* gráfica Airy frente a número f */
      const pl = new EM.Plot(ctx, { x: sx + 6, y: 0, w: W - sx - 6, h: H, xmin: 1.4, xmax: 22, ymin: 0, ymax: 30, xlabel: 'número f', ylabel: 'diámetro (µm)' });
      pl.frame();
      pl.fn((N) => 2.44 * 0.55 * N, { color: '--accent', width: 2.2 });
      pl.hline(2 * p.pix, { color: '--c2', label: '2 píxeles', labelRight: true });
      pl.dot(p.N, 2.44 * 0.55 * p.N, { color: '--accent', r: 6 });
      sim.set('fov', EM.fix(fov / DEG, 1) + '° (' + EM.fix(fovH / DEG, 1) + '° × ' + EM.fix(fovV / DEG, 1) + '°)');
      sim.set('eq', EM.fix((p.f * 43.27) / diag, 1) + ' mm');
      sim.set('airy', EM.fix(2.44 * 0.55 * p.N, 2) + ' µm = ' + EM.fix((2.44 * 0.55 * p.N) / p.pix, 2) + ' píxeles');
      sim.set('lim', 'f/' + EM.fix((2 * p.pix) / (2.44 * 0.55), 1));
    });
  });
})();
