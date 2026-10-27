/* Capítulo 13 — Descartes, Huygens, Fermat: la filosofía mecánica */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;

  /* 13.1 Fermat: el tiempo mínimo */
  EM.defineSim('fermat', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Índice del segundo medio (n = c/v₂ respecto del primero)', min: 1, max: 2.4, step: 0.01, value: 1.333, fmt: (v) => v.toFixed(3) });
    sim.slider('x', { label: 'Punto donde el rayo cruza la superficie', min: 0.02, max: 1.98, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.button('Ir al mínimo de tiempo', () => { sim.ctl.x.set(C.fermatMin(1, 1, 2, 1, 1 / sim.p.n).x); });
    sim.out('t', 'Tiempo de recorrido', { hl: true });
    sim.out('tm', 'Tiempo mínimo (Fermat)');
    sim.out('s', 'sen θ₁ / sen θ₂ en el camino mínimo');
    sim.out('d', 'Predicción de la velocidad en el medio denso');
    sim.note('Fermat (1657-1662): la luz sigue el camino de menor tiempo; para ir de A a B a través de dos medios, el mínimo cumple \\(\\operatorname{sen}\\theta_1/\\operatorname{sen}\\theta_2=v_1/v_2\\), es decir, <em>la luz va más despacio en el medio denso</em>. Descartes, con la analogía de una pelota de tenis, suponía lo contrario (más rápida en el medio denso) y llegaba a la misma ley de los senos. La velocidad se midió en 1850 (Foucault): en el agua es 3/4 de c.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, v1 = 1, v2 = 1 / p.n, a = 1, b = 1, d = 2;
      EM.draw.clear(cv);
      const half = W * 0.52, sx = (half - 50) / d, sy = (H * 0.38) / 1.2, x0 = 25, y0 = H * 0.5;
      ctx.fillStyle = EM.alpha('--glass', 0.28); ctx.fillRect(0, y0, half, H - y0);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(half, y0); ctx.stroke();
      const A = [x0, y0 - a * sy], B = [x0 + d * sx, y0 + b * sy], X = [x0 + p.x * sx, y0];
      const best = C.fermatMin(a, b, d, v1, v2), Xb = [x0 + best.x * sx, y0];
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Xb[0], Xb[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(X[0], X[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(A[0], A[1], 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(B[0], B[1], 5, 0, TAU); ctx.fill();
      EM.text(ctx, 'A (aire)', A[0] + 8, A[1] - 6, { size: 11.5 }); EM.text(ctx, 'B (agua/vidrio)', B[0] - 6, B[1] + 16, { size: 11.5, align: 'right' });
      const pl = new EM.Plot(ctx, { x: half + 6, y: 6, w: W - half - 12, h: H - 12, xmin: 0, xmax: 2, ymin: Math.min(best.t * 0.98, 2.2), ymax: 3.6 * Math.max(1, p.n * 0.9), xlabel: 'punto de cruce x', ylabel: 'tiempo (u. arb.)' });
      pl.frame(); pl.fn((x) => C.fermatTime(x, a, b, d, v1, v2), { color: '--c1', width: 2.2, from: 0.001, to: 1.999 });
      pl.dot(best.x, best.t, { color: '--c3', r: 6 }); pl.dot(p.x, C.fermatTime(p.x, a, b, d, v1, v2), { color: '--accent', r: 5 });
      sim.set('t', EM.fix(C.fermatTime(p.x, a, b, d, v1, v2), 4));
      sim.set('tm', EM.fix(best.t, 4) + ' en x = ' + EM.fix(best.x, 3));
      sim.set('s', EM.fix(best.s1 / best.s2, 4) + ' (= n = ' + EM.fix(p.n, 3) + ')');
      sim.set('d', 'Fermat: v₂ = c/' + EM.fix(p.n, 2) + '; Descartes: v₂ = ' + EM.fix(p.n, 2) + ' c');
    });
  });

  /* 13.2 Huygens: ondículas y refracción */
  EM.defineSim('huygens-onda', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 5, max: 80, step: 1, value: 45, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('n', { label: 'Índice del segundo medio', min: 1.05, max: 2.2, step: 0.01, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Instante', min: 0.1, max: 1, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.out('th2', 'Ángulo de refracción', { hl: true });
    sim.out('sn', 'Comprobación de Snell: sen θ₁ / sen θ₂');
    sim.note('Huygens (1678, publicado en 1690): cada punto de un frente de onda emite ondículas esféricas; el nuevo frente es la envolvente. Al entrar en un medio más lento las ondículas son más pequeñas y el frente se inclina hacia la normal. La construcción reproduce la ley de Snell sin suponer rayos ni corpúsculos.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, th1 = p.th * DEG, v1 = 1, v2 = 1 / p.n, th2 = C.huygensRefraction(th1, v1, v2);
      EM.draw.clear(cv);
      const y0 = H * 0.42, x0 = W * 0.12, sc = Math.min(W, H) * 0.5;
      ctx.fillStyle = EM.alpha('--glass', 0.25); ctx.fillRect(0, y0, W, H - y0); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke();
      const T = p.T; const L = 0.9; /* anchura del haz sobre la interfaz */
      /* frente incidente (línea perpendicular al rayo): pasa por el punto x=L·T... */
      const n1 = [Math.sin(th1), Math.cos(th1)]; /* dirección de propagación hacia abajo-derecha: (sen, -cos) en coordenadas matemáticas */
      const toX = (x) => x0 + x * sc, toY = (y) => y0 - y * sc;
      /* ondículas: puntos de la interfaz alcanzados antes de T */
      const N = 9;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < N; i++) {
        const xi = (i / (N - 1)) * L, ti = (xi * Math.sin(th1)) / v1;
        if (ti >= T) continue;
        const r = v2 * (T - ti);
        ctx.strokeStyle = EM.alpha('--c1', 0.7); ctx.beginPath(); ctx.arc(toX(xi), y0, r * sc, 0, PI); ctx.stroke();
        ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(toX(xi), y0, 2.5, 0, TAU); ctx.fill();
      }
      /* frente refractado: p·d2 = v2 T, con d2 = (sen θ2, −cos θ2) */
      const d2 = [Math.sin(th2), -Math.cos(th2)], c = v2 * T;
      const tang = [Math.cos(th2), Math.sin(th2)]; /* tangente al frente */
      /* un punto del frente: p0 = c·d2 */
      const p0 = [c * d2[0], c * d2[1]];
      const s0 = -0.6, s1 = 1.2;
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 2.4; ctx.beginPath();
      let started = false;
      for (let s = -1.2; s <= 1.2; s += 0.01) { const x = p0[0] + s * tang[0], y = p0[1] + s * tang[1]; if (y > 0) continue; const X = toX(x), Y = toY(y); if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y); }
      ctx.stroke();
      /* frente incidente en el aire: p·d1 = v1 T, con d1 = (sen θ1, −cos θ1) y tangencia análoga */
      const d1 = [Math.sin(th1), -Math.cos(th1)], tg1 = [Math.cos(th1), Math.sin(th1)], c1 = v1 * T, q0 = [c1 * d1[0], c1 * d1[1]];
      ctx.strokeStyle = EM.col('--ray'); ctx.setLineDash([5, 4]); ctx.beginPath(); started = false;
      for (let s = -1.2; s <= 1.2; s += 0.01) { const x = q0[0] + s * tg1[0], y = q0[1] + s * tg1[1]; if (y < 0) continue; const X = toX(x), Y = toY(y); if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y); }
      ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'aire (v₁ = 1)', 10, y0 - 10, { size: 11.5, color: '--ink-3' }); EM.text(ctx, 'vidrio (v₂ = ' + (1 / p.n).toFixed(2) + ')', 10, y0 + 20, { size: 11.5, color: '--ink-3' });
      sim.set('th2', EM.fix(th2 / DEG, 2) + '°');
      sim.set('sn', EM.fix(Math.sin(th1) / Math.sin(th2), 4) + '  (n = ' + EM.fix(p.n, 2) + ')');
    });
  });

  /* 13.3 Choques: Descartes frente a Huygens */
  EM.defineSim('colisiones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('m1', { label: 'Masa del cuerpo B (se mueve)', min: 1, max: 10, step: 0.5, value: 2, fmt: (v) => v.toFixed(1) });
    sim.slider('v1', { label: 'Velocidad de B', min: 1, max: 10, step: 0.5, value: 4, fmt: (v) => v.toFixed(1) });
    sim.slider('m2', { label: 'Masa del cuerpo C (en reposo)', min: 1, max: 20, step: 0.5, value: 6, fmt: (v) => v.toFixed(1) });
    sim.out('hu', 'Huygens/Wren (choque elástico): velocidades finales', { hl: true });
    sim.out('de', 'Descartes (regla 4 si C es mayor): velocidades finales');
    sim.out('p', 'Cantidad de movimiento antes y después');
    sim.out('e', 'Fuerza viva (Σ ½mv²) antes y después');
    sim.note('En <em>Principia Philosophiae</em> (1644) Descartes enunció siete reglas del choque, que son casi todas incorrectas: por ejemplo, un cuerpo pequeño que choca con otro mayor en reposo «rebota con la misma rapidez y el otro no se mueve». Para Descartes lo que se conserva es la <em>cantidad de movimiento</em> en valor absoluto, \\(\\sum m|v|\\). En 1668 la Royal Society pidió a Wallis, Wren y Huygens que resolvieran el problema; Huygens (1656, publicado en 1703) lo resolvió con la conservación de \\(\\sum mv\\) y de \\(\\sum mv^2\\).');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const e = C.elastic(p.m1, p.v1, p.m2, 0), d = p.m2 > p.m1 ? C.descartesRule4(p.m1, p.v1, p.m2) : null;
      const row = (y, title, a, b, col) => {
        EM.text(ctx, title, 14, y - 30, { size: 12, color: '--ink-2', weight: 650 });
        const r1 = 8 + 4 * Math.sqrt(p.m1), r2 = 8 + 4 * Math.sqrt(p.m2), x1 = W * 0.25, x2 = W * 0.55;
        ctx.fillStyle = EM.alpha('--c1', 0.8); ctx.beginPath(); ctx.arc(x1, y, r1, 0, TAU); ctx.fill();
        ctx.fillStyle = EM.alpha('--c2', 0.8); ctx.beginPath(); ctx.arc(x2, y, r2, 0, TAU); ctx.fill();
        EM.text(ctx, 'B', x1, y + 4, { size: 11, align: 'center', color: '--surface' }); EM.text(ctx, 'C', x2, y + 4, { size: 11, align: 'center', color: '--surface' });
        const arr = (x, v) => { if (Math.abs(v) < 1e-9) { EM.text(ctx, '0', x, y - 38 - 8, { size: 11, align: 'center', color: '--ink-3' }); return; } EM.draw.arrow(ctx, x, y - 40, x + v * 12, y - 40, { color: col, width: 2.4 }); EM.text(ctx, EM.fix(v, 2), x + v * 6, y - 48, { size: 11, align: 'center', color: col }); };
        arr(x1, a); arr(x2, b);
      };
      row(H * 0.28, 'Antes del choque', p.v1, 0, '--ink-2');
      row(H * 0.62, 'Después (elástico)', e.u1, e.u2, '--c3');
      if (d) row(H * 0.92, 'Después (regla 4 de Descartes)', d.u1, d.u2, '--c2');
      const pb = p.m1 * p.v1, pa = p.m1 * e.u1 + p.m2 * e.u2, eb = 0.5 * p.m1 * p.v1 * p.v1, ea = 0.5 * p.m1 * e.u1 * e.u1 + 0.5 * p.m2 * e.u2 * e.u2;
      sim.set('hu', 'u₁ = ' + EM.fix(e.u1, 3) + ',  u₂ = ' + EM.fix(e.u2, 3));
      sim.set('de', d ? 'u₁ = ' + EM.fix(d.u1, 3) + ',  u₂ = 0  (la cantidad de movimiento no se conserva: ' + EM.fix(p.m1 * d.u1, 2) + ')' : 'no aplica (B ≥ C)');
      sim.set('p', EM.fix(pb, 3) + ' → ' + EM.fix(pa, 3));
      sim.set('e', EM.fix(eb, 3) + ' → ' + EM.fix(ea, 3));
    });
  });

  /* 13.4 La cicloide: el péndulo isócrono de Huygens */
  EM.defineSim('tautocrona', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Parámetro a de la cicloide', min: 0.1, max: 1, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) + ' m' });
    sim.slider('f1', { label: 'Altura de salida de la cuenta A (fracción)', min: 0.1, max: 1, step: 0.01, value: 0.95, fmt: (v) => (100 * v).toFixed(0) + ' %' });
    sim.slider('f2', { label: 'Altura de salida de la cuenta B (fracción)', min: 0.1, max: 1, step: 0.01, value: 0.35, fmt: (v) => (100 * v).toFixed(0) + ' %' });
    sim.out('T', 'Periodo en la cicloide (4π√(a/g))', { hl: true });
    sim.out('t', 'Tiempo de llegada al fondo, A y B');
    sim.out('c', 'Lo mismo en un arco circular de igual longitud 4a');
    sim.note('Huygens (1659, publicado en el <em>Horologium oscillatorium</em> de 1673) halló que sobre una cicloide el tiempo de descenso no depende del punto de partida: es la <em>tautócrona</em>. Con dos «mejillas» cicloidales que obligan al hilo del péndulo a seguir esa curva, el reloj sería isócrono para cualquier amplitud. El mismo problema, cambiando la pregunta («¿qué curva da el descenso más rápido?», la <em>braquistócrona</em>), llevó al cálculo de variaciones (capítulo 16).');
    let t = 0;
    sim.animate((dt) => { t += dt * 0.5; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, a = p.a;
      EM.draw.clear(cv);
      const phi0 = (f) => 2 * Math.acos(1 - f); /* altura y0 = f·2a  ⇒ 1 − cos φ0 = 2f */
      const phiOf = (f) => Math.acos(1 - 2 * f);
      const sc = Math.min((W * 0.4) / (a * PI * 1.1), (H * 0.7) / (2 * a)), cx = W * 0.25, by = H * 0.88;
      const X = (v) => cx + v * sc, Y = (v) => by - v * sc;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = -100; i <= 100; i++) { const ph = (i / 100) * PI, q = C.cycloid(ph, a); i > -100 ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])); } ctx.stroke();
      const T = C.tautoPeriod(a), tt = t % (T / 2 + 0.6), cols = ['--c1', '--c2'];
      [p.f1, p.f2].forEach((f, i) => {
        const ph0 = -phiOf(f); /* se suelta desde la izquierda */
        const tm = Math.min(tt, T / 4), ph = C.tautoPhi(tm, ph0, a) , q = C.cycloid(ph, a);
        ctx.fillStyle = EM.col(cols[i]); ctx.beginPath(); ctx.arc(X(q[0]), Y(q[1]), 6, 0, TAU); ctx.fill();
      });
      /* Mismo con un péndulo circular de radio 4a, soltado a las mismas alturas */
      const Rc = 4 * a, cx2 = W * 0.75, T0c = 2 * PI * Math.sqrt(Rc / K.g);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = -60; i <= 60; i++) { const th = (i / 60) * 1.15; const x = cx2 + Rc * Math.sin(th) * sc, y = by - Rc * (1 - Math.cos(th)) * sc; i > -60 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      const circTime = (f) => (T0c / 4) * C.pendulumRatio((Math.acos(1 - (f * 2 * a) / Rc) / DEG));
      const tc1 = circTime(p.f1), tc2 = circTime(p.f2);
      [p.f1, p.f2].forEach((f, i) => {
        let th = -Math.acos(1 - (f * 2 * a) / Rc), om = 0; const dt2 = 5e-4, n = Math.floor(Math.min(tt, i ? tc2 : tc1) / dt2);
        for (let k = 0; k < n; k++) { om += -(K.g / Rc) * Math.sin(th) * dt2; th += om * dt2; }
        ctx.fillStyle = EM.col(cols[i]); ctx.beginPath(); ctx.arc(cx2 + Rc * Math.sin(th) * sc, by - Rc * (1 - Math.cos(th)) * sc, 6, 0, TAU); ctx.fill();
      });
      EM.text(ctx, 'cicloide: llegan juntas', cx, 18, { size: 11.5, align: 'center', color: '--ink-2', weight: 650 });
      EM.text(ctx, 'arco circular: llegan a distinto tiempo', cx2, 18, { size: 11.5, align: 'center', color: '--ink-2', weight: 650 });
      sim.set('T', EM.fix(T, 4) + ' s  (cuarto: ' + EM.fix(T / 4, 4) + ' s)');
      sim.set('t', EM.fix(T / 4, 4) + ' s  y  ' + EM.fix(T / 4, 4) + ' s');
      sim.set('c', EM.fix(tc1, 4) + ' s  y  ' + EM.fix(tc2, 4) + ' s');
    });
  });
})();
