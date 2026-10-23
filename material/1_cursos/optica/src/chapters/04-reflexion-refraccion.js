/* Capítulo 4 — Reflexión y refracción */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;

  /* 4.1 El salvavidas (Fermat) */
  EM.defineSim('fermat', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('x', { label: 'Punto de entrada al agua', min: 0, max: 40, step: 0.05, value: 18, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('v1', { label: 'Velocidad corriendo', min: 1, max: 10, step: 0.1, value: 7, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('v2', { label: 'Velocidad nadando', min: 0.5, max: 10, step: 0.1, value: 1.5, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.button('Ir al mínimo', () => { sim.ctl.x.set(best()); }, { icon: 'step' });
    sim.out('t', 'Tiempo total', { hl: true });
    sim.out('tmin', 'Tiempo mínimo (en x óptimo)');
    sim.out('r', 'sen θ₁ / sen θ₂  frente a  v₁/v₂');
    const A = [0, 20], B = [30, -15];
    const T = (x) => Math.hypot(x - A[0], A[1]) / sim.p.v1 + Math.hypot(B[0] - x, B[1]) / sim.p.v2;
    const best = () => OP.golden(T, 0, 40);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 8, y: 8, w: W * 0.5 - 16, h: H - 16 }, -3, 40, -18, 23);
      ctx.fillStyle = EM.alpha('--sand', 0.3); ctx.fillRect(v.X(-3), v.Y(23), v.X(40) - v.X(-3), v.Y(0) - v.Y(23));
      ctx.fillStyle = EM.alpha('--water', 0.3); ctx.fillRect(v.X(-3), v.Y(0), v.X(40) - v.X(-3), v.Y(-18) - v.Y(0));
      const xb = best();
      D.ray(ctx, v, [A, [xb, 0], B], { color: '--c3', width: 1.4, dash: [5, 4] });
      D.ray(ctx, v, [A, [p.x, 0], B], { color: '--c2', width: 2.4 });
      ctx.fillStyle = EM.col('--ink'); for (const q of [A, B]) { ctx.beginPath(); ctx.arc(...v.map(q), 5, 0, 7); ctx.fill(); }
      EM.text(ctx, 'salvavidas', v.X(A[0]) + 8, v.Y(A[1]) + 4, { size: 11, color: '--ink-2', halo: true });
      EM.text(ctx, 'bañista', v.X(B[0]) - 8, v.Y(B[1]) + 4, { size: 11, color: '--ink-2', halo: true, align: 'right' });
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 40, ymin: T(xb) * 0.95, ymax: Math.max(T(0), T(40)) * 1.02, xlabel: 'punto de entrada x (m)', ylabel: 'tiempo (s)' });
      pl.frame();
      pl.fn(T, { color: '--accent', width: 2.2 });
      pl.dot(xb, T(xb), { color: '--c3', r: 5 });
      pl.dot(p.x, T(p.x), { color: '--c2', r: 6 });
      const s1 = p.x / Math.hypot(p.x, A[1]), s2 = (B[0] - p.x) / Math.hypot(B[0] - p.x, B[1]);
      sim.set('t', EM.fix(T(p.x), 3) + ' s');
      sim.set('tmin', EM.fix(T(xb), 3) + ' s en x = ' + EM.fix(xb, 2) + ' m');
      sim.set('r', EM.fix(s1 / s2, 3) + ' frente a ' + EM.fix(p.v1 / p.v2, 3));
    });
  });

  /* 4.2 Ley de Snell con Huygens */
  EM.defineSim('snell', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('th', { label: 'Ángulo de incidencia θ₁', min: 0, max: 89, step: 0.5, value: 40, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('n1', { label: 'Índice del medio de arriba n₁', min: 1, max: 2.5, step: 0.001, value: 1, fmt: (v) => v.toFixed(3) });
    sim.slider('n2', { label: 'Índice del medio de abajo n₂', min: 1, max: 2.5, step: 0.001, value: 1.5168, fmt: (v) => v.toFixed(3) });
    sim.check('wf', { label: 'Frentes de onda (Huygens)', value: false });
    sim.button('Agua → aire', () => { sim.ctl.n1.set(1.333, true); sim.ctl.n2.set(1, true); sim.ctl.th.set(45); });
    sim.button('Aire → vidrio', () => { sim.ctl.n1.set(1, true); sim.ctl.n2.set(1.5168, true); sim.ctl.th.set(40); });
    sim.out('t2', 'Ángulo de refracción θ₂', { hl: true });
    sim.out('crit', 'Ángulo crítico');
    sim.out('R', 'Reflectancia (luz no polarizada)');
    sim.out('T', 'Transmitancia');
    let t = 0;
    sim.animate((dt) => { t += dt; }, { autoplay: false });
    EM.pointer(cv, {
      down: (x, y) => { const c = [cv.w / 2, cv.h / 2]; if (y < c[1]) { sim.ctl.th.set(Math.min(89, Math.max(0, (Math.abs(Math.atan2(c[0] - x, c[1] - y)) * 180) / Math.PI))); return 1; } return null; },
      move: (a, x, y) => { const c = [cv.w / 2, cv.h / 2]; sim.ctl.th.set(Math.min(89, Math.max(0, (Math.abs(Math.atan2(c[0] - x, c[1] - y)) * 180) / Math.PI))); },
      hover: (x, y) => y < cv.h / 2
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG;
      EM.draw.clear(cv);
      const cx = W / 2, cy = H / 2, L = Math.hypot(W, H);
      ctx.fillStyle = EM.alpha('--glass', 0.05 + 0.3 * (p.n1 - 1)); ctx.fillRect(0, 0, W, cy);
      ctx.fillStyle = EM.alpha('--glass', 0.05 + 0.3 * (p.n2 - 1)); ctx.fillRect(0, cy, W, H - cy);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 8); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'n₁ = ' + EM.fix(p.n1, 3), 12, 20, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'n₂ = ' + EM.fix(p.n2, 3), 12, H - 12, { size: 12, color: '--ink-2' });
      const f = OP.fresnel(p.n1, p.n2, th), s2 = (p.n1 * Math.sin(th)) / p.n2, tir = s2 > 1;
      const th2 = tir ? NaN : Math.asin(s2);
      const R = tir ? 1 : f.R, T = tir ? 0 : f.T;
      const inc = [cx - L * Math.sin(th), cy - L * Math.cos(th)];
      /* frentes de onda */
      if (p.wf) {
        const lam = 34, ph = (t * 30) % lam;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cy); ctx.clip();
        ctx.strokeStyle = EM.alpha('--accent', 0.45); ctx.lineWidth = 1.2;
        const k1 = [Math.sin(th), Math.cos(th)];
        for (let s = -40; s < 40; s++) { const d = s * lam + ph; const px = cx + k1[0] * d, py = cy + k1[1] * d; ctx.beginPath(); ctx.moveTo(px - k1[1] * L, py + k1[0] * L); ctx.lineTo(px + k1[1] * L, py - k1[0] * L); ctx.stroke(); }
        ctx.restore();
        if (!tir) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, cy, W, H - cy); ctx.clip();
          ctx.strokeStyle = EM.alpha('--accent', 0.45);
          const k2 = [Math.sin(th2), Math.cos(th2)], lam2 = (lam * p.n1) / p.n2;
          for (let s = -60; s < 60; s++) { const d = s * lam2 + (ph * p.n1) / p.n2; const px = cx + k2[0] * d, py = cy + k2[1] * d; ctx.beginPath(); ctx.moveTo(px - k2[1] * L, py + k2[0] * L); ctx.lineTo(px + k2[1] * L, py - k2[0] * L); ctx.stroke(); }
          ctx.restore();
        }
      }
      const ray = (x1, y1, x2, y2, w, col) => { ctx.strokeStyle = EM.col(col); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      ray(inc[0], inc[1], cx, cy, 4, '--ray');
      EM.draw.arrow(ctx, cx - 0.45 * H * Math.sin(th), cy - 0.45 * H * Math.cos(th), cx - 0.3 * H * Math.sin(th), cy - 0.3 * H * Math.cos(th), { color: '--ray', width: 3, head: 11 });
      if (R > 0.002) ray(cx, cy, cx + L * Math.sin(th), cy - L * Math.cos(th), Math.max(0.8, 4 * R), '--ray');
      if (!tir) ray(cx, cy, cx + L * Math.sin(th2), cy + L * Math.cos(th2), Math.max(0.8, 4 * T), '--ray');
      /* arcos de ángulos */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 46, -Math.PI / 2 - th, -Math.PI / 2); ctx.stroke();
      EM.text(ctx, 'θ₁', cx - 60 * Math.sin(th / 2) - 6, cy - 60 * Math.cos(th / 2), { size: 13, color: '--ink' });
      if (!tir) { ctx.beginPath(); ctx.arc(cx, cy, 46, Math.PI / 2 - th2, Math.PI / 2); ctx.stroke(); EM.text(ctx, 'θ₂', cx + 62 * Math.sin(th2 / 2) - 4, cy + 62 * Math.cos(th2 / 2) + 6, { size: 13, color: '--ink' }); }
      else EM.text(ctx, 'reflexión total interna', cx + 12, cy + 30, { size: 13, color: '--c2', weight: 600 });
      const crit = OP.critical(p.n1, p.n2);
      sim.set('t2', tir ? '— (no hay rayo refractado)' : EM.fix(th2 / DEG, 2) + '°');
      sim.set('crit', isFinite(crit) ? EM.fix(crit / DEG, 2) + '°' : 'no existe (n₂ ≥ n₁)');
      sim.set('R', EM.fix(100 * R, 2) + ' %');
      sim.set('T', EM.fix(100 * T, 2) + ' %');
    });
  });

  /* 4.3 Guía de luz */
  EM.defineSim('fibra-rti', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.slider('a', { label: 'Ángulo del rayo en el aire, antes de entrar', min: 0, max: 80, step: 0.5, value: 25, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('n1', { label: 'Índice del núcleo', min: 1.40, max: 1.80, step: 0.001, value: 1.62, fmt: (v) => v.toFixed(3) });
    sim.slider('n2', { label: 'Índice del revestimiento', min: 1.0, max: 1.79, step: 0.001, value: 1.52, fmt: (v) => v.toFixed(3) });
    sim.out('NA', 'Apertura numérica', { hl: true });
    sim.out('acc', 'Ángulo de aceptación');
    sim.out('inc', 'Ángulo de incidencia en la pared');
    sim.out('P', 'Potencia que queda al final');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const n2 = Math.min(p.n2, p.n1 - 0.001), x0 = W * 0.12, x1 = W - 10, y0 = H * 0.32, y1 = H * 0.68;
      ctx.fillStyle = EM.alpha('--glass', 0.12); ctx.fillRect(x0, y0 - H * 0.16, x1 - x0, H * 0.16); ctx.fillRect(x0, y1, x1 - x0, H * 0.16);
      ctx.fillStyle = EM.alpha('--glass', 0.35); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      EM.text(ctx, 'revestimiento n₂', x0 + 8, y0 - H * 0.16 + 14, { size: 11, color: '--ink-2' });
      EM.text(ctx, 'núcleo n₁', x0 + 8, y0 + 14, { size: 11, color: '--ink-2' });
      const a = p.a * DEG, inside = Math.asin(Math.sin(a) / p.n1), phi = Math.PI / 2 - inside, crit = Math.asin(n2 / p.n1);
      const yc = (y0 + y1) / 2;
      /* rayo en el aire */
      const L0 = Math.min(x0 - 6, 90);
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0 - L0, yc + L0 * Math.tan(a)); ctx.lineTo(x0, yc); ctx.stroke();
      let x = x0, y = yc, dir = -1, P = 1, bounces = 0;
      const dx = (y1 - y0) / Math.tan(Math.max(inside, 1e-3));
      const R = phi > crit ? 1 : OP.fresnel(p.n1, n2, phi).R;
      while (x < x1 && bounces < 400) {
        const ty = dir < 0 ? y0 : y1, dist = Math.abs(ty - y) / ((y1 - y0) / dx);
        const xn = Math.min(x1, x + (inside < 1e-3 ? x1 : dist)), yn = inside < 1e-3 ? y : y + ((xn - x) / dx) * (y1 - y0) * dir;
        ctx.strokeStyle = EM.alpha('--ray', Math.max(0.05, P)); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xn, yn); ctx.stroke();
        if (xn >= x1) break;
        if (R < 1) { /* rayo que escapa */ const out = Math.asin(Math.min(1, (p.n1 * Math.sin(phi)) / n2)); ctx.strokeStyle = EM.alpha('--ray', Math.max(0.05, P * (1 - R))); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xn, yn); ctx.lineTo(xn + 30 * Math.sin(out), yn + 30 * Math.cos(out) * dir); ctx.stroke(); }
        P *= R; x = xn; y = yn; dir = -dir; bounces++;
      }
      const NA = OP.NA(p.n1, n2);
      sim.set('NA', EM.fix(Math.min(1, NA), 3) + (NA >= 1 ? ' (acepta cualquier ángulo)' : ''));
      sim.set('acc', NA >= 1 ? '90°' : EM.fix(Math.asin(NA) / DEG, 2) + '°');
      sim.set('inc', EM.fix(phi / DEG, 2) + '° (crítico ' + EM.fix(crit / DEG, 2) + '°)');
      sim.set('P', R === 1 ? '100 % (reflexión total)' : EM.fix(100 * P, 2) + ' % tras ' + bounces + ' rebotes');
    });
  });

  /* 4.4 Profundidad aparente */
  EM.defineSim('profundidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('ex', { label: 'Posición horizontal del ojo', min: 0, max: 3, step: 0.01, value: 1.2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('d', { label: 'Profundidad del agua', min: 0.3, max: 3, step: 0.01, value: 2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('n', { label: 'Índice del líquido', min: 1, max: 1.8, step: 0.001, value: 1.333, fmt: (v) => v.toFixed(3) });
    sim.out('dap', 'Profundidad aparente', { hl: true });
    sim.out('dn', 'd/n (vista vertical)');
    sim.out('ang', 'Ángulo de la mirada con la vertical');
    const eye = [0, 1.6];
    /* punto de la superficie por donde pasa el rayo de la moneda (0, −d) al ojo (ex, 1.6) */
    const cross = (ex, d, n) => OP.bisect((x) => n * (x / Math.hypot(x, d)) - (ex - x) / Math.hypot(ex - x, 1.6), 0, ex);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ex = Math.max(1e-3, p.ex);
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -0.6, 3.4, -3.2, 1.9);
      ctx.fillStyle = EM.alpha('--water', 0.25); ctx.fillRect(v.X(-0.6), v.Y(0), v.X(3.4) - v.X(-0.6), v.Y(-p.d) - v.Y(0));
      ctx.fillStyle = EM.col('--sand'); ctx.fillRect(v.X(-0.6), v.Y(-p.d), v.X(3.4) - v.X(-0.6), 5);
      /* dos rayos vecinos para localizar la imagen */
      const x1 = cross(ex, p.d, p.n), x2 = cross(ex * 0.97, p.d, p.n);
      const eye1 = [ex, eye[1]], dir = (xs) => { const s = (p.n * xs) / Math.hypot(xs, p.d); const a = Math.asin(Math.min(1, s)); return [Math.sin(a), Math.cos(a)]; };
      const d1 = dir(x1), d2 = dir(x2);
      /* intersección de las prolongaciones hacia atrás de los dos rayos */
      const t1 = ((x2 - x1) * d2[1]) / (d1[1] * d2[0] - d1[0] * d2[1]);
      const ix = x1 - t1 * d1[0], iy = -t1 * d1[1];
      D.ray(ctx, v, [[0, -p.d], [x1, 0], eye1], { color: '--ray', width: 2 });
      D.ray(ctx, v, [[x1, 0], [ix, iy]], { color: '--ray', width: 1.2, dash: [5, 4] });
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(-p.d), 7, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(v.X(ix), v.Y(iy), 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      EM.text(ctx, 'moneda', v.X(0) + 10, v.Y(-p.d) - 6, { size: 11, color: '--ink-2', halo: true });
      EM.text(ctx, 'imagen', v.X(ix) - 10, v.Y(iy) - 8, { size: 11, color: '--ink-2', halo: true, align: 'right' });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(ex), v.Y(eye[1]), 6, 0, 7); ctx.fill();
      EM.text(ctx, 'ojo', v.X(ex) + 9, v.Y(eye[1]) + 4, { size: 11, color: '--ink-2', halo: true });
      sim.set('dap', EM.fix(-iy, 3) + ' m');
      sim.set('dn', EM.fix(p.d / p.n, 3) + ' m');
      sim.set('ang', EM.fix(Math.atan2(ex - x1, eye[1]) / DEG, 1) + '°');
    });
  });

  /* 4.5 Espejismo inferior */
  EM.defineSim('espejismo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('Ts', { label: 'Temperatura del asfalto', min: 30, max: 70, step: 0.5, value: 50, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Ta', { label: 'Temperatura del aire', min: 10, max: 35, step: 0.5, value: 30, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('he', { label: 'Altura de los ojos', min: 0.3, max: 3, step: 0.01, value: 1.5, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('dn', 'Diferencia de índice Δn', { hl: true });
    sim.out('amax', 'Ángulo máximo del espejismo √(2Δn)');
    sim.out('dist', 'Distancia mínima del «charco»');
    const hl = 0.15; /* espesor de la capa caliente (m) */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const T = (y) => p.Ta + (p.Ts - p.Ta) * Math.exp(-Math.max(0, y) / hl) + 273.15;
      const nf = (x, y) => 1 + (2.7713e-4 * 288.15) / T(y);
      const gf = (x, y) => { const e = 1e-4; return [0, (nf(0, y + e) - nf(0, y - e)) / (2 * e)]; };
      const xmax = 600, ymax = 3.2;
      const v = D.view({ x: 40, y: 10, w: W - 50, h: H - 40 }, 0, xmax, -0.1, ymax, false);
      const grd = ctx.createLinearGradient(0, v.Y(ymax), 0, v.Y(0));
      grd.addColorStop(0, EM.alpha('--c1', 0.08)); grd.addColorStop(1, EM.alpha('--c1', 0.02)); ctx.fillStyle = grd; ctx.fillRect(v.X(0), v.Y(ymax), v.X(xmax) - v.X(0), v.Y(0) - v.Y(ymax));
      ctx.fillStyle = EM.alpha('--c2', 0.18); ctx.fillRect(v.X(0), v.Y(hl * 2), v.X(xmax) - v.X(0), v.Y(0) - v.Y(hl * 2));
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(v.X(0), v.Y(0), v.X(xmax) - v.X(0), 5);
      const dn = nf(0, 50) - nf(0, 0), amax = Math.sqrt(2 * dn);
      let first = null;
      for (let k = 0; k <= 26; k++) {
        const a = -amax * 1.8 * (k / 26) + amax * 0.25;
        const r = OP.gradRay(nf, gf, [0, p.he], [Math.cos(a), Math.sin(a)], 1.0, 700, (x, y) => y < 0 || x > xmax || y > ymax);
        const pts = r.pts, last = pts[pts.length - 1], hitsRoad = last[1] < 0.001;
        let ymin = Infinity, xmin = 0; for (const q of pts) if (q[1] < ymin) { ymin = q[1]; xmin = q[0]; }
        const turned = !hitsRoad && ymin < p.he - 0.05 && last[1] > ymin + 0.01;
        if (turned && (!first || xmin < first)) first = xmin;
        ctx.strokeStyle = hitsRoad ? EM.alpha('--ink-3', 0.6) : turned ? EM.col('--c1') : EM.alpha('--accent', 0.7);
        ctx.lineWidth = turned ? 1.8 : 1.1; ctx.beginPath();
        pts.forEach((q, i) => { const m = v.map(q); i ? ctx.lineTo(m[0], m[1]) : ctx.moveTo(m[0], m[1]); });
        ctx.stroke();
      }
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(p.he), 6, 0, 7); ctx.fill();
      EM.text(ctx, 'ojo', v.X(0) + 9, v.Y(p.he) - 8, { size: 11, color: '--ink-2', halo: true });
      for (let x = 0; x <= xmax; x += 100) EM.text(ctx, x + ' m', v.X(x), v.Y(0) + 18, { size: 10.5, color: '--ink-3', align: 'center', mono: true });
      EM.text(ctx, 'rayos que vuelven a subir: el ojo ve el cielo en el suelo', W - 12, 22, { size: 11.5, color: '--c1', align: 'right', halo: true });
      sim.set('dn', EM.sci(dn, 3));
      sim.set('amax', EM.fix(amax * 1000, 2) + ' mrad = ' + EM.fix(amax / DEG, 3) + '°');
      sim.set('dist', first ? '≈ ' + EM.fix(first, 0) + ' m' : 'más allá de ' + xmax + ' m');
    });
  });
})();
