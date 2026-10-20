/* Capítulo 24 — Fluidos en rotación */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;
  const PLACES = [['Popayán', 2.44], ['Bogotá', 4.71], ['Cartagena', 10.4], ['París', 48.85], ['Polo', 90]];

  /* 24.1 Oscilaciones inerciales */
  EM.defineSim('coriolis-proyectil', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('lat', { label: 'Latitud (negativa: hemisferio sur)', min: -80, max: 80, step: 0.1, value: 45, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('U', { label: 'Velocidad inicial (hacia el este)', min: 0.05, max: 1, step: 0.01, value: 0.2, unit: 'm/s', fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: 'Rozamiento (en unidades de |<i>f</i>|)', min: 0, max: 0.5, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('f', 'Parámetro de Coriolis <i>f</i>', { hl: true });
    sim.out('T', 'Periodo inercial 2π/|<i>f</i>|');
    sim.out('R', 'Radio del círculo <i>U</i>/|<i>f</i>|');
    let st, t, tr;
    const reset = () => { st = [0, 0, sim.p.U, 0]; t = 0; tr = [[0, 0]]; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate(() => {
      const f = FL.coriolisF(sim.p.lat), af = Math.abs(f), T = af > 1e-7 ? (2 * Math.PI) / af : 86400, rr = sim.p.r * af;
      const h = T / 400;
      for (let k = 0; k < 8; k++) { st = FL.rk4((tt, s) => [s[2], s[3], f * s[3] - rr * s[2], -f * s[2] - rr * s[3]], t, st, h); t += h; tr.push([st[0], st[1]]); }
      if (tr.length > 4000) tr.shift();
      if (t > 3 * T) reset();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = FL.coriolisF(p.lat), af = Math.abs(f);
      EM.draw.clear(cv);
      const Rk = af > 1e-7 ? p.U / af : 1e9, L = af > 1e-7 ? Math.min(2.6 * Rk, 1e7) : Math.max(...tr.map((q) => Math.abs(q[0]))) + 1;
      const v = EM.flow.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -0.3 * L, 1.0 * L, -1.0 * L, 1.0 * L);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(-0.3 * L), v.Y(0)); ctx.lineTo(v.X(L), v.Y(0)); ctx.moveTo(v.X(0), v.Y(-L)); ctx.lineTo(v.X(0), v.Y(L)); ctx.stroke();
      EM.text(ctx, 'N', v.X(0) + 4, v.Y(L) + 14, { size: 12, color: '--ink-3' }); EM.text(ctx, 'E', v.X(L) - 14, v.Y(0) - 6, { size: 12, color: '--ink-3' });
      EM.flow.drawPath(ctx, tr, v.map, { color: '--accent', width: 2 });
      const q = tr[tr.length - 1]; ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(q[0]), v.Y(q[1]), 5, 0, 7); ctx.fill();
      EM.text(ctx, 'escala: ' + EM.si(L, 'm', 2) + ' a cada lado', 14, H - 14, { size: 11, color: '--ink-3' });
      sim.set('f', EM.sci(f, 3) + ' s⁻¹');
      sim.set('T', af > 1e-9 ? EM.fix((2 * Math.PI) / af / 3600, 2) + ' h = ' + EM.fix((2 * Math.PI) / af / 86400, 2) + ' días' : '∞ (ecuador)');
      sim.set('R', af > 1e-9 ? EM.si(p.U / af, 'm', 3) : '∞');
    });
  });

  /* 24.2 Viento geostrófico */
  EM.defineSim('geostrofico', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '520px' });
    sim.slider('lat', { label: 'Latitud', min: -60, max: 60, step: 0.5, value: 45, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('dp', { label: 'Profundidad de la baja presión', min: 2, max: 60, step: 1, value: 20, unit: 'hPa', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Radio característico', min: 50, max: 1500, step: 10, value: 500, unit: 'km', fmt: (v) => v.toFixed(0) });
    sim.out('vg', 'Viento geostrófico máximo', { hl: true });
    sim.out('vgr', 'Viento de gradiente máximo');
    sim.out('Ro', 'Número de Rossby <i>U</i>/(|<i>f</i>|<i>R</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = FL.coriolisF(p.lat), rho = 1.2, R = p.R * 1000, dP = p.dp * 100;
      EM.draw.clear(cv);
      const L = 2.4 * R, v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, -L, L, -L, L);
      const P = (x, y) => -dP * Math.exp(-(x * x + y * y) / (R * R));
      const n = 80, F = new Float64Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) F[j * n + i] = P(-L + (2 * L * i) / (n - 1), -L + (2 * L * j) / (n - 1));
      const r = { x: v.X(-L), y: v.Y(L), w: v.X(L) - v.X(-L), h: v.Y(-L) - v.Y(L) };
      EM.flow.paint(ctx, F, n, n, r, (q) => EM.cmap.seq(-q / dP, '--c1'));
      const gm = (i, j) => [r.x + (i / (n - 1)) * r.w, r.y + r.h - (j / (n - 1)) * r.h];
      for (let k = 1; k < 10; k++) EM.flow.drawSegs(ctx, EM.flow.contour(F, n, n, (-dP * k) / 10), gm, { color: '--ink-2', width: 1 });
      const dPdr = (rr) => ((2 * dP * rr) / (R * R)) * Math.exp(-(rr * rr) / (R * R));
      const vgf = (rr) => dPdr(rr) / (rho * Math.abs(f || 1e-12));
      const vgr = (rr) => { const af = Math.abs(f); return -af * rr / 2 + Math.sqrt((af * af * rr * rr) / 4 + (rr / rho) * dPdr(rr)); };
      const sg = Math.sign(f) || 1;
      for (const rr of [0.5 * R, R, 1.5 * R]) for (let k = 0; k < 12; k++) {
        const a = (2 * Math.PI * k) / 12, x = rr * Math.cos(a), y = rr * Math.sin(a), V = vgr(rr), sc = (0.25 * R) / Math.max(1, vgr(R / Math.SQRT2));
        const ux = -sg * Math.sin(a) * V, uy = sg * Math.cos(a) * V;
        EM.draw.arrow(ctx, v.X(x), v.Y(y), v.X(x + ux * sc), v.Y(y + uy * sc), { color: '--accent', width: 1.8 });
      }
      EM.text(ctx, 'B', v.X(0) - 5, v.Y(0) + 6, { size: 16, weight: 700, color: '--c2' });
      EM.text(ctx, p.lat >= 0 ? 'hemisferio norte: giro antihorario' : 'hemisferio sur: giro horario', 12, 20, { size: 12, color: '--ink', halo: true });
      const rm = R / Math.SQRT2;
      sim.set('vg', Math.abs(f) > 1e-9 ? EM.fix(vgf(rm), 1) + ' m/s' + (vgf(rm) > 80 ? ' <span class="warnv">(imposible: cerca del ecuador no hay equilibrio geostrófico)</span>' : '') : '∞');
      sim.set('vgr', EM.fix(vgr(rm), 1) + ' m/s');
      sim.set('Ro', EM.fix(vgr(rm) / (Math.abs(f) * R), 2));
    });
  });

  /* 24.3 Espiral de Ekman */
  EM.defineSim('ekman', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('lat', { label: 'Latitud', min: -70, max: 70, step: 0.5, value: 45, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('nu', { label: 'Viscosidad turbulenta ν<sub>t</sub>', min: 0.001, max: 0.1, step: 0, value: 0.01, unit: 'm²/s', log: true, fmt: (v) => v.toFixed(3) });
    sim.out('d', 'Espesor de Ekman δ<sub>E</sub> = √(2ν/|<i>f</i>|)', { hl: true });
    sim.out('a', 'Corriente superficial respecto al viento · transporte');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = FL.coriolisF(p.lat), dE = FL.ekmanDepth(p.nu, f);
      EM.draw.clear(cv);
      const zs = EM.M.linspace(0, 3 * Math.PI, 120), vel = zs.map((z) => FL.ekmanSurface(z, 1, f));
      /* hodógrafa (viento hacia +x = este) */
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.5 - 12, h: H - 12 }, -0.5, 1.1, -0.9, 0.7);
      EM.draw.arrow(ctx, v.X(-0.45), v.Y(0.55), v.X(0.2), v.Y(0.55), { color: '--ink', width: 2.4 });
      EM.text(ctx, 'viento', v.X(-0.45), v.Y(0.55) - 8, { size: 12, color: '--ink' });
      for (let i = 0; i < zs.length; i += 6) EM.draw.arrow(ctx, v.X(0), v.Y(0), v.X(vel[i].u), v.Y(vel[i].v), { color: '--water', width: 1.4, alpha: 0.4 + 0.6 * Math.exp(-zs[i]) });
      EM.flow.drawPath(ctx, vel.map((q) => [q.u, q.v]), v.map, { color: '--accent', width: 2 });
      const sg = Math.sign(f) || 1;
      EM.draw.arrow(ctx, v.X(0), v.Y(0), v.X(0), v.Y(-sg * 0.6), { color: '--c2', width: 2.6 });
      EM.text(ctx, 'transporte', v.X(0) + 8, v.Y(-sg * 0.5), { size: 12, color: '--c2', halo: true });
      /* perfiles */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -0.8, xmax: 1, ymin: -3 * dE, ymax: 0, xlabel: 'velocidad / V₀', ylabel: 'profundidad z (m)' });
      pl.frame();
      pl.xy(vel.map((q) => q.u), zs.map((z) => -z * dE), { color: '--c1', width: 2.2 });
      pl.xy(vel.map((q) => q.v), zs.map((z) => -z * dE), { color: '--c3', width: 2.2 });
      pl.hline(-dE, { color: '--ink-3', label: 'δ_E' });
      pl.legend([{ label: 'u (dirección del viento)', color: '--c1' }, { label: 'v (perpendicular)', color: '--c3' }], 'br');
      sim.set('d', isFinite(dE) ? EM.fix(dE, 1) + ' m' : '∞ (ecuador)');
      sim.set('a', (sg > 0 ? '45° a la derecha' : '45° a la izquierda') + ' · 90° ' + (sg > 0 ? 'a la derecha' : 'a la izquierda'));
    });
  });

  /* 24.4 Péndulo de Foucault */
  EM.defineSim('foucault', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('lat', { label: 'Latitud', min: -90, max: 90, step: 0.1, value: 2.44, unit: '°', fmt: (v) => v.toFixed(2) });
    sim.slider('sp', { label: 'Aceleración del tiempo', min: 1000, max: 100000, step: 1000, value: 30000, fmt: (v) => '×' + v.toFixed(0) });
    sim.out('T', 'Periodo de precesión', { hl: true });
    sim.out('w', 'Giro del plano por hora');
    let ang = 0, ph = 0;
    sim.animate((dt) => { const w = FL.Omega * Math.sin((sim.p.lat * Math.PI) / 180); ang -= w * dt * sim.p.sp; ph += dt * 4; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = W * 0.25, cy = H / 2, R = Math.min(W * 0.22, H * 0.42);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let k = 0; k < 24; k++) { const a = (k * Math.PI) / 12; ctx.beginPath(); ctx.moveTo(cx + R * 0.92 * Math.cos(a), cy + R * 0.92 * Math.sin(a)); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke(); }
      const s = Math.sin(ph) * R * 0.85;
      ctx.strokeStyle = EM.alpha('--accent', 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - R * 0.85 * Math.cos(ang), cy - R * 0.85 * Math.sin(ang)); ctx.lineTo(cx + R * 0.85 * Math.cos(ang), cy + R * 0.85 * Math.sin(ang)); ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + s * Math.cos(ang), cy + s * Math.sin(ang), 8, 0, 7); ctx.fill();
      EM.text(ctx, 'vista desde arriba', cx, cy + R + 14, { size: 11, align: 'center', color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 90, ymin: 0.8, ymax: 1000, ylog: true, xlabel: 'latitud (°)', ylabel: 'periodo de precesión (días)' });
      pl.frame();
      pl.fn((l) => FL.foucaultPeriod(Math.max(0.05, l)) / 86400, { color: '--accent', width: 2.2, from: 0.5 });
      for (const [n, l] of PLACES) pl.dot(l, FL.foucaultPeriod(l) / 86400, { color: '--ink-3', r: 3.5, label: n });
      if (Math.abs(p.lat) > 0.05) pl.dot(Math.abs(p.lat), FL.foucaultPeriod(p.lat) / 86400, { color: '--accent', r: 6 });
      const T = FL.foucaultPeriod(p.lat);
      sim.set('T', Math.abs(p.lat) > 0.01 ? EM.fix(T / 3600, 1) + ' h = ' + EM.fix(T / 86400, 2) + ' días' : '∞ (en el ecuador no gira)');
      sim.set('w', EM.fix((15.041 * Math.abs(Math.sin((p.lat * Math.PI) / 180))), 3) + '°/h' + (p.lat > 0 ? ', horario' : p.lat < 0 ? ', antihorario' : ''));
    });
  });
})();
