/* Capítulo 1 — El problema del éter y los postulados de Einstein */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rel, K = EM.qm.K, c = K.c;
  const rad = (d) => (d * Math.PI) / 180;

  /* 1.1 Interferómetro de Michelson–Morley */
  EM.defineSim('michelson', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('v', { label: 'Velocidad del aparato respecto al éter v', min: 0, max: 400, step: 0.5, value: 29.78, unit: 'km/s', fmt: (v) => EM.fix(v, 2) });
    sim.slider('L', { label: 'Longitud efectiva de cada brazo L', min: 1, max: 20, step: 0.5, value: 11, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('lam', { label: 'Longitud de onda λ', min: 400, max: 700, step: 5, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Orientación del aparato θ (brazo 1 respecto al movimiento)', min: 0, max: 360, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('con', { label: 'Contracción de FitzGerald–Lorentz (los brazos se acortan en √(1 − β²) a lo largo del movimiento)', value: false });
    sim.out('N', 'Posición de las franjas N(θ) = c[T(θ) − T(θ + 90°)]/λ', { hl: true });
    sim.out('rot', 'Corrimiento esperado al girar 90° (2Lβ²/λ) · exacto');
    sim.out('obs', 'Cota observada en 1887 (≈ 0.01 franja) → velocidad máxima del éter');
    sim.out('b', 'β = v/c · fracción de la velocidad orbital terrestre (29.78 km/s)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = (p.v * 1e3) / c, L = p.L, lam = p.lam * 1e-9, th = rad(p.th);
      EM.draw.clear(cv);
      /* Esquema del interferómetro girado un ángulo θ */
      const cx = W * 0.25, cy = H * 0.52, A = Math.min(W * 0.17, H * 0.36);
      EM.text(ctx, 'Interferómetro y «viento de éter» ←', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      for (let k = 0; k < 4; k++) { const y = H * (0.2 + 0.2 * k); EM.draw.arrow(ctx, cx + A * 1.5, y, cx + A * 0.95, y, { color: '--ink-3', width: 1.2, head: 6 }); }
      const u1 = [Math.cos(th), -Math.sin(th)], u2 = [Math.cos(th + Math.PI / 2), -Math.sin(th + Math.PI / 2)];
      const ln = (a, b2, col, w, dash) => { ctx.save(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); ctx.restore(); };
      const P = (u, s) => [cx + u[0] * s, cy + u[1] * s];
      ln(P(u2, -A * 0.9), P(u2, A), '--c1', 2.4); /* haz fuente → espejo 2 */
      ln(P(u1, -A * 0.9), P(u1, A), '--c2', 2.4); /* brazo 1 y detector */
      const mirror = (u, s, col) => { const q = P(u, s), n = [-u[1], u[0]]; ln([q[0] - n[0] * 9, q[1] - n[1] * 9], [q[0] + n[0] * 9, q[1] + n[1] * 9], col, 5); };
      mirror(u1, A, '--ink'); mirror(u2, A, '--ink');
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-th - Math.PI / 4); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.restore();
      const S = P(u2, -A * 0.9); ctx.save(); ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(S[0], S[1], 5, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, 'fuente', S[0] + 8, S[1], { size: 11, color: '--c3' });
      const E = P(u1, -A * 0.9); EM.text(ctx, 'ojo', E[0] - 6, E[1] - 8, { size: 11, color: '--ink-2', align: 'right' });
      EM.text(ctx, 'espejo 1', P(u1, A)[0] + 8, P(u1, A)[1] - 4, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'espejo 2', P(u2, A)[0] + 8, P(u2, A)[1] - 4, { size: 11, color: '--ink-2' });
      /* Franjas frente al ángulo */
      const Nmax = Math.max(0.02, Math.abs(R.mmFringe(L, lam, b, 0, false))), sc = Nmax * 1.2;
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 360, ymin: -sc, ymax: sc, xlabel: 'orientación θ del aparato (°)', ylabel: 'posición de las franjas N (franjas)', ml: 54, mr: 10, title: 'Corrimiento de franjas al girar el aparato' });
      pl.frame();
      const f = (t) => R.mmFringe(L, lam, b, rad(t), p.con);
      pl.fn(f, { color: p.con ? '--c3' : '--accent', width: 2.8, n: 360 });
      pl.hline(0.01, { color: '--c2', dash: [3, 3] }); pl.hline(-0.01, { color: '--c2', dash: [3, 3], label: 'cota de 1887: ±0.01 franja', labelRight: true });
      pl.dot(p.th, f(p.th), { color: '--c2', label: EM.fix(f(p.th), 3) });
      sim.set('N', `${EM.fix(f(p.th), 4)} franjas`);
      sim.set('rot', `${EM.fix(R.mmRotationShiftApprox(L, lam, b), 4)} · ${EM.fix(p.con ? 0 : R.mmRotationShift(L, lam, b), 4)} franjas`);
      const bb = R.mmBeta(L, lam, 0.01);
      sim.set('obs', `v < ${EM.fix((bb * c) / 1e3, 2)} km/s (${EM.fix((bb * c) / 29.78e3, 3)} de la velocidad orbital)`);
      sim.set('b', `${EM.sci(b, 4)} · ${EM.fix(p.v / 29.78, 3)}`);
    });
  });

  /* 1.2 Reloj de luz */
  EM.defineSim('relojluz', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad del reloj β = v/c', min: 0, max: 0.99, step: 0.005, value: 0.6, fmt: (v) => EM.fix(v, 3) });
    sim.slider('L', { label: 'Distancia entre espejos L (propia)', min: 0.05, max: 1.5, step: 0.05, value: 0.3, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.out('g', 'Factor de Lorentz γ = 1/√(1 − β²)', { hl: true });
    sim.out('T0', 'Periodo propio T₀ = 2L/c');
    sim.out('T', 'Periodo en el sistema donde el reloj se mueve T = γT₀');
    sim.out('hip', 'Trayecto de la luz por tic: cT frente a 2L (recorrido en el sistema S)');
    sim.out('n', 'Tics contados en el tiempo de S: reloj en reposo · reloj en movimiento');
    let t = 0;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b, g = R.gamma(b), T0 = (2 * p.L) / c, T = g * T0;
      EM.draw.clear(cv);
      const yb = H * 0.82, hgt = H * 0.5, secs = 2.6; /* un tic del reloj en reposo cada 2.6 s de pantalla */
      const tauS = t / secs; /* tics del reloj en reposo (medidos en S) */
      /* Panel izquierdo: reloj en reposo */
      const x0 = W * 0.17;
      EM.text(ctx, 'Reloj en reposo (observador S)', W * 0.25, 16, { size: 12, align: 'center', color: '--ink-2' });
      const mirrors = (x, y1, y2) => { ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 20, y1); ctx.lineTo(x + 20, y1); ctx.moveTo(x - 20, y2); ctx.lineTo(x + 20, y2); ctx.stroke(); ctx.restore(); };
      mirrors(x0, yb - hgt, yb);
      const ph0 = tauS % 1, yy0 = ph0 < 0.5 ? yb - hgt * 2 * ph0 : yb - hgt * (2 - 2 * ph0);
      ctx.save(); ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(x0, yy0, 6, 0, 7); ctx.fill(); ctx.restore();
      EM.draw.arrow(ctx, x0 - 30, yb - 4, x0 - 30, yb - hgt + 4, { color: '--ink-3', width: 1.2, head: 5 }); EM.draw.arrow(ctx, x0 - 30, yb - hgt + 4, x0 - 30, yb - 4, { color: '--ink-3', width: 1.2, head: 5 });
      EM.text(ctx, 'L', x0 - 38, yb - hgt / 2, { size: 12, color: '--ink-2', align: 'right' });
      EM.text(ctx, `tics: ${Math.floor(tauS)}`, x0 + 34, yb - hgt / 2, { size: 12, color: '--ink' });
      /* Panel derecho: reloj en movimiento visto desde S, con la trayectoria en zigzag */
      const xs = W * 0.46, span = W * 0.5, nT = 3; /* se muestran 3 tics en el ancho */
      EM.text(ctx, `Reloj en movimiento (β = ${EM.fix(b, 3)}) visto desde S`, W * 0.72, 16, { size: 12, align: 'center', color: '--ink-2' });
      const dxTic = (span / nT) * Math.min(1, 0.35 + 2.2 * b);
      const tT = (tauS / g) % 1e9; /* tiempo de S en unidades de T: tauS tics del reposo = tauS·T0; T = γ T0 ⇒ tiempo/T = tauS/γ */
      const x = (n) => xs + n * dxTic;
      ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xs - 10, yb); ctx.lineTo(xs + span + 20, yb); ctx.moveTo(xs - 10, yb - hgt); ctx.lineTo(xs + span + 20, yb - hgt); ctx.stroke(); ctx.restore();
      const cycle = tT % nT, nFull = Math.floor(cycle);
      for (let k = 0; k <= nFull; k++) {
        const fr = k < nFull ? 1 : cycle - nFull, xa = x(k), xb = x(k + 1);
        const half = fr <= 0.5;
        const pts = [[xa, yb]];
        if (fr > 0) { if (half) pts.push([xa + (xb - xa) * fr, yb - hgt * 2 * fr]); else { pts.push([xa + (xb - xa) * 0.5, yb - hgt]); pts.push([xa + (xb - xa) * fr, yb - hgt * (2 - 2 * fr)]); } }
        ctx.save(); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
      }
      const fr = cycle - nFull, xc = x(nFull) + dxTic * fr, yc = fr < 0.5 ? yb - hgt * 2 * fr : yb - hgt * (2 - 2 * fr);
      mirrors(xc, yb - hgt, yb);
      ctx.save(); ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(xc, yc, 6, 0, 7); ctx.fill(); ctx.restore();
      EM.draw.arrow(ctx, xc + 28, yb + 18, xc + 28 + Math.max(12, 70 * b), yb + 18, { color: '--accent', width: 2, head: 7 });
      EM.text(ctx, 'v', xc + 28 + Math.max(12, 70 * b) + 6, yb + 18, { size: 12, color: '--accent' });
      EM.text(ctx, `tics: ${Math.floor(tT)}`, W * 0.72, H - 8, { size: 12, color: '--ink', align: 'center' });
      /* Triángulo de la deducción */
      const L = p.L, hyp = g * 2 * L, leg = b * g * 2 * L;
      sim.set('g', EM.fix(g, 4));
      sim.set('T0', `${EM.sci(T0, 4)} s (${EM.fix(T0 * 1e9, 4)} ns)`);
      sim.set('T', `${EM.sci(T, 4)} s (${EM.fix(T * 1e9, 4)} ns)`);
      sim.set('hip', `${EM.fix(hyp, 4)} m frente a ${EM.fix(2 * L, 4)} m (el cateto horizontal es ${EM.fix(leg, 4)} m = vT)`);
      sim.set('n', `${EM.fix(tauS, 2)} · ${EM.fix(tauS / g, 2)}`);
    });
  });

  /* 1.3 El tren de Einstein: simultaneidad relativa */
  EM.defineSim('tren', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('b', { label: 'Velocidad del tren β = v/c', min: 0, max: 0.95, step: 0.005, value: 0.6, fmt: (v) => EM.fix(v, 3) });
    sim.slider('L0', { label: 'Longitud propia del tren L₀', min: 50, max: 400, step: 5, value: 200, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('Lp', 'Longitud del tren en el andén L = L₀/γ (los rayos caen en sus extremos)', { hl: true });
    sim.out('dt', 'Desfase entre los rayos en el tren: Δt′ = γvL/c² = vL₀/c² · primero cae el de…');
    sim.out('rec', 'El pasajero del centro recibe los destellos con una diferencia de');
    sim.out('ds', 'Intervalo en el andén: Δt = 0 · Δx = L. Invariante: c²Δt² − Δx²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = p.b, g = R.gamma(b), Lp = p.L0 / g;
      EM.draw.clear(cv);
      /* Izquierda: el andén en t = 0 */
      const x0 = W * 0.25, sx = (W * 0.42) / (p.L0 * 1.05), yT = H * 0.55;
      EM.text(ctx, 'Andén (S): los rayos caen a la vez, t = 0', x0, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - W * 0.23, yT + 28); ctx.lineTo(x0 + W * 0.23, yT + 28); ctx.stroke(); ctx.restore();
      const hw = Lp * sx / 2;
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.fillRect(x0 - hw, yT - 24, 2 * hw, 48); ctx.strokeRect(x0 - hw, yT - 24, 2 * hw, 48); ctx.restore();
      EM.draw.arrow(ctx, x0 + hw + 8, yT - 40, x0 + hw + 40, yT - 40, { color: '--accent', width: 2, head: 7 });
      EM.text(ctx, 'v', x0 + hw + 46, yT - 40, { size: 12, color: '--accent' });
      const bolt = (x, lab) => { ctx.save(); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - 7, yT - 90); ctx.lineTo(x + 3, yT - 62); ctx.lineTo(x - 5, yT - 62); ctx.lineTo(x + 4, yT - 28); ctx.stroke(); ctx.restore(); EM.text(ctx, lab, x, yT - 100, { size: 12, color: '--c3', align: 'center' }); };
      bolt(x0 + hw, 'A'); bolt(x0 - hw, 'B');
      ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(x0, yT, 5, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, 'pasajero M', x0, yT + 17, { size: 11, align: 'center', color: '--ink-2' });
      EM.text(ctx, `L = ${EM.fix(Lp, 1)} m  (L₀ = ${p.L0.toFixed(0)} m)`, x0, yT + 52, { size: 12, align: 'center', color: '--ink-2' });
      /* Derecha: diagrama espacio–tiempo (x, ct) */
      const xm = p.L0 * 0.75, ymax = p.L0 * 1.15;
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -xm, xmax: xm, ymin: -p.L0 * 0.3, ymax, xlabel: 'x (m)', ylabel: 'ct (m)', ml: 52, mr: 10, title: 'Diagrama espacio–tiempo en el andén' });
      pl.frame();
      pl.path([[-xm, 0], [xm, 0]], { color: '--c1', width: 1.6, dash: [6, 4] }); /* t = 0 */
      const t0line = (cc) => [[-xm, -b * xm + cc], [xm, b * xm + cc]]; /* ct = βx + cc  ⇒  t′ constante */
      pl.path(t0line(0), { color: '--c2', width: 1.6, dash: [6, 4] }); /* t′ = 0 */
      /* líneas de universo de los extremos y del centro del tren */
      const wl = (x0m, col, w) => pl.path([[x0m - b * p.L0 * 0.3, -p.L0 * 0.3], [x0m + b * ymax, ymax]], { color: col, width: w });
      wl(Lp / 2, '--ink-3', 1.6); wl(-Lp / 2, '--ink-3', 1.6); wl(0, '--accent', 2.2);
      /* sucesos A, B y rayos de luz hacia M */
      const A = [Lp / 2, 0], B = [-Lp / 2, 0];
      pl.path([A, [A[0] - ymax, ymax]], { color: '--c3', width: 1.8 });
      pl.path([B, [B[0] + ymax, ymax]], { color: '--c3', width: 1.8 });
      const ctA = Lp / (2 * (1 + b)), ctB = Lp / (2 * (1 - b));
      pl.dot(A[0], 0, { color: '--c3', label: 'A', dy: 14 }); pl.dot(B[0], 0, { color: '--c3', label: 'B', dy: 14 });
      pl.dot(b * ctA, ctA, { color: '--accent', r: 4, label: 'luz de A', dx: -8, dy: 4, align: 'right' }); pl.dot(b * ctB, ctB, { color: '--accent', r: 4, label: 'luz de B', dx: -8, dy: 4, align: 'right' });
      pl.legend([{ label: 't = 0 (simultáneos en S)', color: '--c1', dash: [6, 4] }, { label: 't′ = 0 (simultáneos en S′)', color: '--c2', dash: [6, 4] }, { label: 'pasajero M (x′ = 0)', color: '--accent' }], 'tl');
      const dtp = (g * b * Lp) / c;
      sim.set('Lp', `${EM.fix(Lp, 3)} m (γ = ${EM.fix(g, 4)})`);
      sim.set('dt', `${EM.fix(dtp * 1e9, 2)} ns · en el tren cae primero el rayo A (delantero)`);
      sim.set('rec', `${EM.fix(((ctB - ctA) / c / g) * 1e9, 2)} ns (A primero, luego B)`);
      sim.set('ds', `${EM.sci(-Lp * Lp, 4)} m² (tipo espacio)`);
    });
  });
})();
