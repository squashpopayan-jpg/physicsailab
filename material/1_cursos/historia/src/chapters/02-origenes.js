/* Capítulo 2 — Los remotos comienzos */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI;

  /* 2.1 El ciclo de Saros */
  EM.defineSim('saros', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de lunaciones N', min: 1, max: 400, step: 1, value: 223, fmt: (v) => v.toFixed(0) });
    sim.button('Saros (223)', () => sim.ctl.N.set(223));
    sim.button('Metón (235)', () => sim.ctl.N.set(235));
    sim.out('T', 'N lunaciones', { hl: true });
    sim.out('dr', 'Meses dracónicos más cercanos');
    sim.out('an', 'Meses anomalísticos más cercanos');
    sim.out('yr', 'Años tropicales (¿regresa la estación?)');
    sim.note('Un eclipse exige que la Luna llegue de nuevo al mismo nodo (mes dracónico) con la misma fase (mes sinódico). Que además repita su distancia (mes anomalístico) hace que se parezca al anterior.');
    const Nmax = 400;
    const xs = [], dr = [], an = [];
    for (let n = 1; n <= Nmax; n++) { xs.push(n); dr.push(Math.max(0.02, Math.abs(C.cycleMismatch(n, K.draconic).dev))); an.push(Math.max(0.02, Math.abs(C.cycleMismatch(n, K.anomalistic).dev))); }
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(sim.p.N);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Nmax, ymin: 0.02, ymax: 20, ylog: true, xlabel: 'N lunaciones (meses sinódicos)', ylabel: 'desfase (días)' });
      pl.frame();
      pl.xy(xs, dr, { color: '--c2', width: 1, alpha: 0.55 });
      pl.xy(xs, an, { color: '--c1', width: 1, alpha: 0.55 });
      pl.vline(223, { color: '--accent', label: '223', labelY: 14 });
      pl.vline(N, { color: '--ink', dash: [] });
      pl.dot(N, dr[N - 1], { color: '--c2', r: 5 });
      pl.dot(N, an[N - 1], { color: '--c1', r: 5 });
      pl.hline(1, { color: '--ink-3', label: 'un día', labelRight: true });
      pl.legend([{ label: 'desfase con el mes dracónico (27.2122 d)', color: '--c2' }, { label: 'desfase con el mes anomalístico (27.5545 d)', color: '--c1' }], 'tr');
      const md = C.cycleMismatch(N, K.draconic), ma = C.cycleMismatch(N, K.anomalistic);
      const ky = Math.round(md.T / K.tropicalYear);
      sim.set('T', EM.fix(md.T, 3) + ' d  (' + EM.fix(md.T / 365.2422, 3) + ' años)');
      sim.set('dr', md.k + '  (desfase ' + EM.fix(md.dev, 2) + ' d)');
      sim.set('an', ma.k + '  (desfase ' + EM.fix(ma.dev, 2) + ' d)');
      sim.set('yr', ky + '  (desfase ' + EM.fix(md.T - ky * K.tropicalYear, 2) + ' d)');
    });
  });

  /* 2.2 Raíz de 2 en una tablilla babilónica */
  EM.defineSim('babsqrt', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, minH: '250px' });
    sim.slider('x0', { label: 'Primera estimación x₀', min: 1, max: 2, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('n', { label: 'Iteraciones', min: 0, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('tab', 'Tablilla YBC 7289', { hl: true });
    sim.out('err', 'Error de la tablilla respecto de √2');
    sim.note('Cada iteración promedia la estimación x con 2/x: si x es muy grande, 2/x es muy pequeño y el promedio queda más cerca. Es el método de Herón, que ya aparece en tablillas babilonias.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const xs = C.babSqrt(2, p.x0, Math.round(p.n));
      EM.text(ctx, 'Iteración', 14, 24, { size: 11.5, color: '--ink-3', weight: 650 });
      EM.text(ctx, 'Decimal', W * 0.2, 24, { size: 11.5, color: '--ink-3', weight: 650 });
      EM.text(ctx, 'Sexagesimal  (1 ; 24, 51, 10 …)', W * 0.52, 24, { size: 11.5, color: '--ink-3', weight: 650 });
      EM.text(ctx, 'Error', W - 14, 24, { size: 11.5, color: '--ink-3', weight: 650, align: 'right' });
      xs.forEach((x, i) => {
        const y = 50 + i * 26;
        const sx = C.sexagesimal(x, 5);
        EM.text(ctx, String(i), 14, y, { size: 14, mono: true });
        EM.text(ctx, x.toFixed(9), W * 0.2, y, { size: 14, mono: true });
        EM.text(ctx, sx[0] + ' ; ' + sx.slice(1).join(', '), W * 0.52, y, { size: 14, mono: true });
        EM.text(ctx, EM.sci(Math.abs(x - Math.SQRT2), 2), W - 14, y, { size: 14, mono: true, align: 'right', color: Math.abs(x - Math.SQRT2) < 1e-6 ? '--c3' : '--ink' });
      });
      const tab = C.sexToNumber([1, 24, 51, 10]);
      sim.set('tab', EM.fix(tab, 8) + '  = 1 ; 24, 51, 10');
      sim.set('err', EM.sci(Math.abs(tab - Math.SQRT2), 2) + ' (menos de una millonésima)');
    });
  });

  /* 2.3 Plimpton 322 */
  EM.defineSim('plimpton', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('row', { label: 'Fila de la tablilla', min: 1, max: 15, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('tri', 'Terna (anchura, altura, diagonal)', { hl: true });
    sim.out('chk', 'Comprobación de Pitágoras');
    sim.out('ang', 'Ángulo del triángulo');
    sim.out('rat', 'Cociente (diagonal/altura)²');
    sim.note('Las filas están ordenadas por ese cociente, de mayor a menor. Neugebauer (1945) vio teoría de números; Robson (2001), un recurso para maestros de escriba; Mansfield y Wildberger (2017), una tabla trigonométrica. La tablilla no dice para qué servía.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, r = Math.round(sim.p.row) - 1;
      EM.draw.clear(cv);
      const rows = C.plimpton, ang = rows.map(([b, d, h]) => (Math.atan(b / h) * 180) / PI);
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 6, w: W * 0.48, h: H - 12, xmin: 0.5, xmax: 15.5, ymin: 30, ymax: 46, xlabel: 'fila', ylabel: 'ángulo (°)' });
      pl.frame();
      pl.xy(rows.map((_, i) => i + 1), ang, { color: '--ink-3', width: 1.2 });
      rows.forEach((_, i) => pl.dot(i + 1, ang[i], { color: i === r ? '--accent' : '--c1', r: i === r ? 6 : 3.5 }));
      /* triángulo a escala */
      const [b, d, h] = rows[r];
      const bx = W * 0.05, by = H * 0.85, sc = Math.min((W * 0.4) / h, (H * 0.7) / b);
      ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + h * sc, by); ctx.lineTo(bx + h * sc, by - b * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
      EM.text(ctx, 'altura ' + h, bx + (h * sc) / 2, by + 16, { size: 11.5, align: 'center', color: '--ink-2' });
      EM.text(ctx, 'anchura ' + b, bx + h * sc + 6, by - (b * sc) / 2, { size: 11.5, color: '--ink-2' });
      EM.text(ctx, 'diagonal ' + d, bx + (h * sc) / 2 - 20, by - (b * sc) / 2 - 8, { size: 11.5, color: '--accent', weight: 650, align: 'center' });
      sim.set('tri', b + ', ' + h + ', ' + d);
      sim.set('chk', b + '² + ' + h + '² = ' + (b * b + h * h) + ' = ' + d + '²' + (b * b + h * h === d * d ? '  ✓' : '  ✗'));
      sim.set('ang', EM.fix(ang[r], 2) + '°');
      sim.set('rat', EM.fix((d * d) / (h * h), 5));
    });
  });
})();
