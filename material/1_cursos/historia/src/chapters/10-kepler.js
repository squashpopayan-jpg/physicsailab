/* Capítulo 10 — Kepler */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;

  /* 10.1 Triangular la órbita de Marte */
  EM.defineSim('triangulacion-marte', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.slider('N', { label: 'Número de determinaciones de la posición de Marte', min: 8, max: 400, step: 1, value: 60, fmt: (v) => v.toFixed(0) });
    sim.slider('sig', { label: 'Error de cada visual (minutos de arco)', min: 0, max: 8, step: 0.1, value: 2, fmt: (v) => v.toFixed(1) + '′' });
    sim.button('Nueva tanda de errores', () => { seed++; sim.redraw(); });
    sim.out('c', 'Círculo con centro libre: residuo (RMS)', { hl: true });
    sim.out('e', 'Elipse con el Sol en un foco: residuo (RMS)');
    sim.out('ee', 'Excentricidad y semieje ajustados');
    sim.out('dchi', 'Δχ² (círculo − elipse)');
    sim.note('Kepler partió de pares de observaciones de Marte separadas por un periodo sideral de Marte (687 días): Marte está en el mismo punto de su órbita y la Tierra en otro, así que las dos visuales lo <em>triangulan</em>. Aquí se simulan con órbitas modernas y errores gaussianos. Con pocas medidas imprecisas, círculo y elipse son indistinguibles; con muchas, el círculo se descarta (Δχ² > 25).');
    let seed = 1;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, N = Math.round(p.N), rng = C.rng(1000 + seed);
      EM.draw.clear(cv);
      const pts = [];
      for (let i = 0; i < N; i++) { const f = C.marsFix(30000 + (i * C.ELEM.marte.P) / N, (p.sig / 60) * DEG, rng); if (f && f.r > 1.1 && f.r < 2.0) pts.push(f); }
      const cf = C.fitCircle(pts), ef = C.fitFocalConic(pts);
      const sc = Math.min(W, H) * 0.3, cx = W * 0.46, cy = H * 0.52;
      const X = (x) => cx + x * sc, Y = (y) => cy - y * sc;
      const orb = (el, col, dash) => { ctx.strokeStyle = EM.alpha(col, 0.7); ctx.lineWidth = 1.2; ctx.setLineDash(dash || []); ctx.beginPath(); for (let i = 0; i <= 360; i++) { const q = C.helio(el, (i / 360) * el.P); i ? ctx.lineTo(X(q.x), Y(q.y)) : ctx.moveTo(X(q.x), Y(q.y)); } ctx.stroke(); ctx.setLineDash([]); };
      orb(C.ELEM.tierra, '--c1'); orb(C.ELEM.marte, '--ink-3');
      /* ajustes */
      ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(X(cf.cx), Y(cf.cy), cf.R * sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 0; i <= 360; i++) { const th = (i / 360) * TAU, A = 1 / ef.p, r = 1 / (A + (ef.e / ef.p) * Math.cos(th - ef.omega)); const x = r * Math.cos(th), y = r * Math.sin(th); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
      ctx.stroke();
      ctx.fillStyle = EM.alpha('--accent', 0.85); for (const q of pts) { ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 2.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      EM.text(ctx, 'Sol', cx + 9, cy + 4, { size: 11, color: '--gold' });
      EM.text(ctx, 'órbita de la Tierra', X(0), Y(-1) + 14, { size: 11, align: 'center', color: '--c1' });
      EM.text(ctx, 'Marte (verdadera)', X(0), Y(-1.52) + 14, { size: 11, align: 'center', color: '--ink-3' });
      EM.text(ctx, '- - ajuste circular    — ajuste elíptico    • puntos triangulados', 10, 16, { size: 11, color: '--ink-2' });
      const dchi = (pts.length * (cf.rms * cf.rms - ef.rms * ef.rms)) / Math.max(ef.rms * ef.rms, 1e-12);
      sim.set('c', EM.sci(cf.rms, 2) + ' UA');
      sim.set('e', EM.sci(ef.rms, 2) + ' UA');
      sim.set('ee', 'e = ' + EM.fix(ef.e, 4) + ',  a = ' + EM.fix(ef.a, 4) + ' UA  (verdad: 0.0934; 1.5237)');
      sim.set('dchi', EM.fix(dchi, 0) + (dchi > 25 ? '  → el círculo se descarta' : '  → no se distinguen'));
    });
  });

  /* 10.2 Segunda ley: áreas iguales en tiempos iguales */
  EM.defineSim('areas-kepler', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('e', { label: 'Excentricidad e', min: 0, max: 0.95, step: 0.01, value: 0.55, fmt: (v) => v.toFixed(2) });
    sim.seg('sec', { label: 'Sectores de igual tiempo', options: [[6, '6'], [8, '8'], [12, '12']], value: 8 });
    sim.button('Marte (0.093)', () => sim.ctl.e.set(0.0934));
    sim.button('Halley (0.967→0.95)', () => sim.ctl.e.set(0.95));
    sim.out('a', 'Área de cada sector (πab/N)', { hl: true });
    sim.out('r', 'Cociente de velocidades perihelio/afelio');
    sim.out('r2', 'Distancias perihelio y afelio (a = 1)');
    sim.note('Kepler llegó a la ley de las áreas antes que a la elipse, con una aproximación aritmética (sumó distancias). La velocidad se obtiene de la conservación del momento angular: \\(v_{peri}/v_{af}=(1+e)/(1-e)\\).');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 0.25; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, e = sim.p.e, n = sim.p.sec;
      EM.draw.clear(cv);
      const a = Math.min(W * 0.36, H * 0.6), b = a * Math.sqrt(1 - e * e), cx = W * 0.5 - a * e * 0.0, cy = H * 0.52, fx = cx + a * e * 0 + 0;
      const sunx = cx + a * e, X = (ex, ey) => [cx + a * ex, cy - b * ey / Math.sqrt(1) / 1];
      const P = (E) => [cx - a * 0 + a * Math.cos(E) * -1 * -1, cy - b * Math.sin(E)];
      /* elipse centrada en (cx, cy); el Sol a la derecha del centro (foco) */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, TAU); ctx.stroke();
      const cols = ['--c1', '--c3'];
      for (let k = 0; k < n; k++) {
        const M1 = (TAU * k) / n, M2 = (TAU * (k + 1)) / n;
        const E1 = C.keplerE(M1, e), E2 = C.keplerE(M2, e);
        ctx.fillStyle = EM.alpha(cols[k % 2], 0.28); ctx.beginPath(); ctx.moveTo(sunx, cy);
        for (let j = 0; j <= 20; j++) { const E = E1 + ((E2 - E1) * j) / 20; ctx.lineTo(cx + a * Math.cos(E), cy - b * Math.sin(E)); }
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(sunx, cy, 7, 0, TAU); ctx.fill();
      const M = (ph * TAU) % TAU, E = C.keplerE(M, e);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + a * Math.cos(E), cy - b * Math.sin(E), 6, 0, TAU); ctx.fill();
      EM.text(ctx, 'perihelio', cx + a + 6, cy - 8, { size: 11, color: '--ink-3' });
      EM.text(ctx, 'afelio', cx - a - 6, cy - 8, { size: 11, color: '--ink-3', align: 'right' });
      const A1 = C.sweptArea(e, 0, TAU / n), A2 = C.sweptArea(e, PI, PI + TAU / n);
      sim.set('a', EM.fix(A1, 5) + '  (en el afelio: ' + EM.fix(A2, 5) + ')');
      sim.set('r', EM.fix((1 + e) / (1 - e), 2));
      sim.set('r2', EM.fix(1 - e, 3) + ' y ' + EM.fix(1 + e, 3));
    });
  });

  /* 10.3 Tercera ley en el Sol y en Júpiter */
  EM.defineSim('tercera-ley', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('sis', { label: 'Sistema', options: [['sol', 'Planetas (Sol)'], ['jup', 'Lunas de Júpiter']], value: 'sol' });
    sim.out('p', 'Pendiente de la recta log–log', { hl: true });
    sim.out('k', 'T²/a³ (media)');
    sim.out('M', 'Masa central de la fórmula de Newton');
    sim.note('En 1619 Kepler halló que el cuadrado del periodo es proporcional al cubo del semieje. Newton (1687) mostró que la constante de proporcionalidad es \\(4\\pi^2/GM\\), de modo que la ley sirve para <em>pesar</em> el cuerpo central.');
    const SOL = [['Mercurio', 0.38709927, 87.9691], ['Venus', 0.72333566, 224.701], ['Tierra', 1.00000261, 365.256], ['Marte', 1.52371034, 686.980], ['Júpiter', 5.202887, 4332.589], ['Saturno', 9.53667594, 10759.22]];
    const JUP = [['Ío', 421.77e3, 1.769138], ['Europa', 671.08e3, 3.551181], ['Ganímedes', 1070.4e3, 7.154553], ['Calisto', 1882.7e3, 16.689018]];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, sol = sim.p.sis === 'sol', D = sol ? SOL : JUP;
      EM.draw.clear(cv);
      const xs = D.map((d) => Math.log10(d[1])), ys = D.map((d) => Math.log10(d[2]));
      const x0 = Math.min(...xs) - 0.2, x1 = Math.max(...xs) + 0.2, y0 = Math.min(...ys) - 0.2, y1 = Math.max(...ys) + 0.2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: x0, xmax: x1, ymin: y0, ymax: y1, xlabel: sol ? 'log₁₀ a (UA)' : 'log₁₀ a (km)', ylabel: 'log₁₀ T (días)' });
      pl.frame();
      let sx = 0, sy = 0, sxx = 0, sxy = 0; const n = D.length;
      xs.forEach((x, i) => { sx += x; sy += ys[i]; sxx += x * x; sxy += x * ys[i]; });
      const m = (n * sxy - sx * sy) / (n * sxx - sx * sx), c = (sy - m * sx) / n;
      pl.fn((x) => m * x + c, { color: '--c2', width: 1.6, dash: [5, 4] });
      D.forEach((d, i) => pl.dot(xs[i], ys[i], { color: '--accent', r: 5, label: d[0] }));
      const kk = D.map((d) => (sol ? Math.pow(d[2], 2) / Math.pow(d[1], 3) : Math.pow(d[2], 2) / Math.pow(d[1] / 1e3, 3)));
      const km = kk.reduce((a, b) => a + b, 0) / kk.length;
      const GM = sol ? C.centralGM(D[3][1] * 1.495978707e11, D[3][2] * 86400) : C.centralGM(D[0][1] * 1e3, D[0][2] * 86400);
      sim.set('p', EM.fix(m, 4) + '  (Kepler: 3/2 = 1.5)');
      sim.set('k', sol ? EM.fix(km, 1) + ' d²/UA³' : EM.fix(km, 4) + ' d²/(10³ km)³');
      sim.set('M', sol ? EM.sci(GM / 6.6743e-11, 4) + ' kg (Sol: 1.989×10³⁰)' : EM.sci(GM / 6.6743e-11, 4) + ' kg (Júpiter: 1.898×10²⁷)');
    });
  });
})();
