/* Capítulo 12 — Flujo a bajo número de Reynolds */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, W = FL.water;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* 12.1 Reversibilidad en el flujo de Couette circular */
  EM.defineSim('reversibilidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '480px' });
    sim.slider('turns', { label: 'Vueltas en cada sentido', min: 1, max: 8, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Difusión de la tinta', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => (v === 0 ? 'ninguna' : v.toFixed(2)) });
    sim.out('th', 'Ángulo girado por el cilindro interior', { hl: true });
    sim.out('err', 'Desplazamiento medio respecto al inicio');
    const r1 = 0.35, r2 = 1, N = 600, f = (r) => (r1 * r1 * (r2 * r2 / (r * r) - 1)) / (r2 * r2 - r1 * r1);
    let R0, P0, R, P, Th = 0, target = 0, phase = 0, hold = 0;
    const reset = () => {
      R0 = new Float64Array(N); P0 = new Float64Array(N);
      for (let i = 0; i < N; i++) { const a = Math.random() * 2 * Math.PI, s = 0.09 * Math.sqrt(Math.random()); const x = 0.67 + s * Math.cos(a), y = s * Math.sin(a); R0[i] = Math.hypot(x, y); P0[i] = Math.atan2(y, x); }
      R = R0.slice(); P = P0.slice(); Th = 0; target = sim.p.turns * 2 * Math.PI; phase = 0;
    };
    reset();
    sim.onChange = (id) => { if (id === 'turns') reset(); };
    sim.resetButton(reset);
    sim.animate((dt) => {
      const w = 2.2 * dt, dTh = Math.sign(target - Th) * Math.min(Math.abs(target - Th), w);
      if (Math.abs(dTh) < 1e-12) { if (phase === 0) { target = 0; phase = 1; } else if (phase === 1) { phase = 2; hold = 0; } else if ((hold += dt) > 2.5) reset(); return; }
      Th += dTh;
      const Dd = sim.p.D * 2e-4;
      for (let i = 0; i < N; i++) {
        P[i] += dTh * f(R[i]);
        if (Dd > 0) { let x = R[i] * Math.cos(P[i]) + gauss() * Math.sqrt(Dd * dt), y = R[i] * Math.sin(P[i]) + gauss() * Math.sqrt(Dd * dt); let r = Math.hypot(x, y); r = Math.min(r2 - 1e-3, Math.max(r1 + 1e-3, r)); R[i] = r; P[i] = Math.atan2(y, x); }
      }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = Wc / 2, cy = H / 2, S = Math.min(Wc, H) / 2 - 10;
      ctx.fillStyle = EM.alpha('--gold', 0.15); ctx.beginPath(); ctx.arc(cx, cy, S * r2, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = EM.col('--solid'); ctx.beginPath(); ctx.arc(cx, cy, S * r1, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + S * r1 * Math.cos(-Th), cy + S * r1 * Math.sin(-Th)); ctx.stroke();
      ctx.fillStyle = EM.alpha('--c2', 0.75);
      for (let i = 0; i < N; i++) ctx.fillRect(cx + S * R[i] * Math.cos(-P[i]) - 1.2, cy + S * R[i] * Math.sin(-P[i]) - 1.2, 2.4, 2.4);
      let e = 0; for (let i = 0; i < N; i++) e += Math.hypot(R[i] * Math.cos(P[i]) - R0[i] * Math.cos(P0[i]), R[i] * Math.sin(P[i]) - R0[i] * Math.sin(P0[i]));
      EM.text(ctx, phase === 0 ? 'girando hacia adelante…' : phase === 1 ? 'regresando…' : 'de vuelta al inicio', 10, 18, { size: 12, color: '--ink-2', halo: true });
      sim.set('th', EM.fix(Th / (2 * Math.PI), 2) + ' vueltas');
      sim.set('err', EM.fix((e / N) * 100, 2) + ' % del radio exterior');
    });
  });

  /* 12.2 Esfera de Stokes y flujo potencial */
  EM.defineSim('stokes-esfera', function (sim) {
    const cv1 = sim.canvas({ aspect: 1.3 }), cv2 = sim.canvas({ aspect: 1.3 });
    sim.cols2();
    sim.check('col', { label: 'Colorear la perturbación |u − U|/U', value: true });
    sim.out('d', 'Distancia a la que la perturbación cae al 1 % (Stokes · potencial)', { hl: true });
    sim.out('F', 'Arrastre de Stokes: presión · fricción');
    const vel = (x, y, kind) => {
      const r = Math.hypot(x, y), c = x / r, s = Math.abs(y) / r;
      let ur, ut;
      if (kind === 's') { ur = c * (1 - 1.5 / r + 0.5 / (r * r * r)); ut = -s * (1 - 0.75 / r - 0.25 / (r * r * r)); }
      else { ur = c * (1 - 1 / (r * r * r)); ut = -s * (1 + 0.5 / (r * r * r)); }
      const sy = y < 0 ? -1 : 1;
      return [ur * c - ut * s, sy * (ur * s + ut * c)];
    };
    const draw = (cv, kind, title) => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 4, y: 22, w: Wc - 8, h: H - 26 }, -4, 4, -3, 3);
      const nx = 120, ny = 90, f = new Float64Array(nx * ny), mask = new Uint8Array(nx * ny), psi = new Float64Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = -4 + (8 * i) / (nx - 1), y = -3 + (6 * j) / (ny - 1), k = j * nx + i, r = Math.hypot(x, y);
        if (r < 1) { mask[k] = 1; continue; }
        const u = vel(x, y, kind); f[k] = Math.hypot(u[0] - 1, u[1]);
        psi[k] = (kind === 's' ? FL.psiStokes(x, y, 1, 1) : FL.psiPotSphere(x, y, 1, 1)) * Math.sign(y || 1);
      }
      const r = { x: v.X(-4), y: v.Y(3), w: v.X(4) - v.X(-4), h: v.Y(-3) - v.Y(3) };
      if (sim.p.col) EM.flow.paint(ctx, f, nx, ny, r, (q) => EM.cmap.seq(Math.min(1, Math.max(0, (Math.log10(q + 1e-9) + 2.5) / 2.5)), '--c1'), { mask });
      else EM.flow.paint(ctx, f, nx, ny, r, () => EM.rgb('--canvas'), { mask });
      const gm = (i, j) => [r.x + (i / (nx - 1)) * r.w, r.y + r.h - (j / (ny - 1)) * r.h];
      for (let k = -11; k <= 11; k++) { if (!k) continue; const yk = 0.27 * k, L = 0.5 * yk * Math.abs(yk); EM.flow.drawSegs(ctx, EM.flow.contour(psi, nx, ny, L, mask), gm, { color: '--ink-2', width: 1 }); }
      ctx.fillStyle = EM.col('--solid'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), v.sx, 0, 7); ctx.fill();
      EM.text(ctx, title, Wc / 2, 16, { size: 12.5, align: 'center', weight: 650, color: '--ink-2' });
    };
    sim.onDraw(() => {
      draw(cv1, 's', 'Stokes (Re → 0)');
      draw(cv2, 'p', 'Flujo potencial');
      /* perturbación al 1 % en el eje lateral (θ = 90°): Stokes ≈ 3a/(4r) → r ≈ 75a; potencial a³/(2r³) → r ≈ 3.7a */
      const rs = FL.bisect((r) => 0.75 / r + 0.25 / (r * r * r) - 0.01, 1, 1e4), rp = FL.bisect((r) => 0.5 / (r * r * r) - 0.01, 1, 100);
      sim.set('d', EM.fix(rs, 1) + ' a · ' + EM.fix(rp, 2) + ' a (de lado)');
      sim.set('F', '2πμaU (1/3) · 4πμaU (2/3)');
    });
  });

  /* 12.3 Sedimentación */
  const SED = [['arcilla', 2e-6, '--c4'], ['limo', 20e-6, '--sand'], ['arena fina', 100e-6, '--c6'], ['arena', 500e-6, '--ink-2']];
  EM.defineSim('sedimentacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 40, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('rs', { label: 'Densidad de las partículas', min: 1050, max: 4000, step: 10, value: 2650, unit: 'kg/m³', fmt: (v) => v.toFixed(0) });
    sim.slider('lt', { label: 'Tiempo (escala logarítmica)', min: -1, max: 5, step: 0.01, value: -1, fmt: (v) => EM.si(Math.pow(10, v), 's', 3) });
    SED.forEach(([n], i) => sim.out('v' + i, n + ': Stokes · real · 10 cm en'));
    const pts = SED.map(() => Array.from({ length: 70 }, () => [Math.random(), Math.random() * 0.12]));
    sim.animate((dt) => { const v = sim.p.lt + dt * 0.3; sim.ctl.lt.set(v > 5 ? -1 : v, true); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, T = p.T + 273.15, mu = W.mu(T), rho = W.rho(T), t = Math.pow(10, p.lt), Hc = 0.1;
      EM.draw.clear(cv);
      const top = 30, bot = H - 30, cw = (Wc - 40) / SED.length;
      SED.forEach(([n, d, col], i) => {
        const vs = FL.vStokes(d / 2, p.rs - rho, mu), vr = FL.vTerminal(d, p.rs, rho, mu), x0 = 20 + i * cw + 8, w = cw - 16;
        EM.flow.waterRect(ctx, x0, top, w, bot - top, { alpha: 0.18 });
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.strokeRect(x0, top, w, bot - top);
        const drop = vr * t;
        ctx.fillStyle = EM.col(col);
        for (const [fx, fy] of pts[i]) { const y = Math.min(Hc, fy * 0.1 + drop); ctx.fillRect(x0 + 4 + fx * (w - 8) - 1.5, top + (y / Hc) * (bot - top - 3), 3, 3); }
        EM.text(ctx, n, x0 + w / 2, 18, { size: 12, align: 'center', weight: 650, color: '--ink-2' });
        EM.text(ctx, (d * 1e6).toFixed(0) + ' µm', x0 + w / 2, bot + 16, { size: 11, align: 'center', color: '--ink-3' });
        sim.set('v' + i, EM.sci(vs * 1000, 3) + ' · ' + EM.sci(vr * 1000, 3) + ' mm/s · ' + EM.si(Hc / vr, 's', 3));
      });
      EM.text(ctx, 't = ' + EM.si(t, 's', 3), Wc - 12, 18, { size: 12, align: 'right', mono: true, color: '--ink', halo: true });
    });
  });

  /* 12.4 Movimiento browniano */
  EM.defineSim('browniano', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('a', { label: 'Radio de las partículas', min: 0.1, max: 5, step: 0.01, value: 0.5, unit: 'µm', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 80, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('D', 'Coeficiente de difusión <i>D</i>', { hl: true });
    sim.out('rms', 'Desplazamiento rms por eje en 1 s');
    sim.out('fit', 'Pendiente medida del DCM / 4<i>D</i>');
    const N = 60, L = 40e-6;
    let X, Y, X0, Y0, tr, t, msd, acc = 0;
    const reset = () => { X = []; Y = []; X0 = []; Y0 = []; tr = []; for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * L * 0.6, y = (Math.random() - 0.5) * L * 0.3; X.push(x); Y.push(y); X0.push(x); Y0.push(y); tr.push([[x, y]]); } t = 0; msd = []; };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    const Dc = () => { const T = sim.p.T + 273.15; return FL.stokesEinstein(T, W.mu(T), sim.p.a * 1e-6); };
    sim.animate((dt) => {
      const D = Dc(), h = 0.05;
      acc += dt;
      while (acc >= h) {
        acc -= h; t += h;
        for (let i = 0; i < N; i++) { X[i] += gauss() * Math.sqrt(2 * D * h); Y[i] += gauss() * Math.sqrt(2 * D * h); tr[i].push([X[i], Y[i]]); if (tr[i].length > 120) tr[i].shift(); }
        let s = 0; for (let i = 0; i < N; i++) s += (X[i] - X0[i]) ** 2 + (Y[i] - Y0[i]) ** 2;
        msd.push([t, s / N]);
        if (t > 30) reset();
      }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, Wc = cv.w, H = cv.h, D = Dc();
      EM.draw.clear(cv);
      const S = Math.min(Wc * 0.5, H) - 10, ox = 6 + S / 2, oy = H / 2, sc = S / L;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.strokeRect(ox - S / 2, oy - S / 2, S, S);
      for (let i = 0; i < N; i++) {
        EM.flow.drawPath(ctx, tr[i], (q) => [ox + q[0] * sc, oy - q[1] * sc], { color: '--c1', width: 1, alpha: 0.5 });
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(ox + X[i] * sc, oy - Y[i] * sc, Math.max(1.5, sim.p.a * 1e-6 * sc), 0, 7); ctx.fill();
      }
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox - S / 2 + 10, oy + S / 2 - 10); ctx.lineTo(ox - S / 2 + 10 + 10e-6 * sc, oy + S / 2 - 10); ctx.stroke();
      EM.text(ctx, '10 µm', ox - S / 2 + 10, oy + S / 2 - 16, { size: 11, color: '--ink' });
      const tm = 30, pl = new EM.Plot(ctx, { x: Wc * 0.52, y: 0, w: Wc * 0.48, h: H, xmin: 0, xmax: tm, ymin: 0, ymax: 4 * D * tm * 1e12 * 1.3, xlabel: 't (s)', ylabel: '⟨r²⟩ (µm²)' });
      pl.frame();
      pl.fn((tt) => 4 * D * tt * 1e12, { color: '--c2', width: 2, dash: [5, 4] });
      pl.path(msd.map((q) => [q[0], q[1] * 1e12]), { color: '--accent', width: 2 });
      pl.legend([{ label: 'medido (60 partículas)', color: '--accent' }, { label: '4Dt (Stokes–Einstein)', color: '--c2', dash: [5, 4] }], 'tl');
      let sxy = 0, sxx = 0; for (const [tt, m] of msd) { sxy += tt * m; sxx += tt * tt; }
      sim.set('D', EM.sci(D, 3) + ' m²/s');
      sim.set('rms', EM.fix(Math.sqrt(2 * D) * 1e6, 3) + ' µm');
      sim.set('fit', msd.length > 20 ? EM.fix(sxy / sxx / (4 * D), 3) : '—');
    });
  });

  /* 12.5 Patín lubricado */
  EM.defineSim('cojinete', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('k', { label: 'Cociente de espesores <i>k</i> = <i>h</i>₁/<i>h</i>₂', min: 0.3, max: 6, step: 0.01, value: 2.2, fmt: (v) => v.toFixed(2) });
    sim.slider('h2', { label: 'Espesor mínimo <i>h</i>₂', min: 5, max: 100, step: 1, value: 20, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('U', { label: 'Velocidad de la superficie', min: 0.5, max: 30, step: 0.5, value: 5, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('mu', { label: 'Viscosidad del aceite', min: 0.005, max: 0.5, step: 0.005, value: 0.05, unit: 'Pa·s', log: true, fmt: (v) => v.toFixed(3) });
    sim.out('W', 'Carga por metro de ancho (analítica)', { hl: true });
    sim.out('Wn', 'Carga por diferencias finitas · error relativo');
    sim.out('pm', 'Presión máxima');
    const L = 0.1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, h2 = p.h2 * 1e-6, h1 = p.k * h2;
      EM.draw.clear(cv);
      const hf = (x) => h1 - ((h1 - h2) * x) / L;
      const num = FL.reynoldsFD(hf, L, p.U, p.mu, 1000);
      let Wa, pa;
      if (Math.abs(p.k - 1) < 1e-6) { Wa = 0; pa = () => 0; } else { const s = FL.slider(h1, h2, L, p.U, p.mu); Wa = s.W; pa = s.p; }
      let pmx = 0, pmn = 0; for (const q of num.p) { pmx = Math.max(pmx, q); pmn = Math.min(pmn, q); }
      const th = H * 0.3;
      /* esquema de la cuña (exagerada) */
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(20, th - 6, Wc - 40, 8);
      ctx.fillStyle = EM.alpha('--gold', 0.4); ctx.beginPath();
      const hm = Math.max(h1, h2), sc = (th - 30) / hm;
      ctx.moveTo(20, th - 6); ctx.lineTo(20, th - 6 - h1 * sc); ctx.lineTo(Wc - 20, th - 6 - h2 * sc); ctx.lineTo(Wc - 20, th - 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, th - 6 - h1 * sc); ctx.lineTo(Wc - 20, th - 6 - h2 * sc); ctx.stroke();
      EM.draw.arrow(ctx, Wc / 2 - 40, th + 14, Wc / 2 + 40, th + 14, { color: '--accent', width: 2 });
      EM.text(ctx, 'U', Wc / 2 + 46, th + 18, { size: 13, italic: true, family: EM.FONT_MATH });
      EM.text(ctx, 'película (espesor exagerado)', 26, 16, { size: 11, color: '--ink-3' });
      const pl = new EM.Plot(ctx, { x: 0, y: th + 22, w: Wc, h: H - th - 22, xmin: 0, xmax: L * 100, ymin: Math.min(0, pmn / 1e6) * 1.1, ymax: Math.max(0.1, pmx / 1e6) * 1.1, xlabel: 'x (cm)', ylabel: 'p (MPa)', mt: 8 });
      pl.frame();
      pl.fn((xc) => pa(xc / 100) / 1e6, { color: '--accent', width: 2.4 });
      for (let i = 0; i <= 1000; i += 40) pl.dot(num.x[i] * 100, num.p[i] / 1e6, { color: '--c1', r: 3 });
      sim.set('W', EM.sci(Wa, 4) + ' N/m (máxima en k = 2.19: ' + EM.sci((0.16024 * p.mu * p.U * L * L) / (h2 * h2), 4) + ')');
      sim.set('Wn', EM.sci(num.W, 4) + ' N/m · ' + (Wa ? EM.sci((num.W - Wa) / Wa, 2) : '—'));
      sim.set('pm', EM.fix(pmx / 1e6, 3) + ' MPa' + (pmn < -1 ? ' (y ' + EM.fix(pmn / 1e6, 3) + ' MPa: cavitaría)' : ''));
    });
  });
})();
