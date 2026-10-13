/* Capítulo 2 — Movimiento armónico simple */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     2.1 Masa y resorte
     ====================================================================== */
  EM.defineSim('mass-spring', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.1 });
    sim.group('Oscilador');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.1, max: 4, step: 0.05, value: 1, unit: 'kg', fmt: f2 });
    sim.slider('k', { label: 'Constante <i>k</i>', min: 5, max: 200, step: 1, value: 40, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.seg('ori', { label: 'Montaje', options: [['h', 'Horizontal'], ['v', 'Vertical']], value: 'h' });
    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: 'Posición <i>x</i><sub>0</sub>', min: -0.2, max: 0.2, step: 0.005, value: 0.15, unit: 'm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('v0', { label: 'Velocidad <i>v</i><sub>0</sub>', min: -2, max: 2, step: 0.02, value: 0, unit: 'm/s', fmt: f2 });
    sim.resetButton(() => { t = 0; });
    sim.out('w', 'Frecuencia angular <i>ω</i><sub>0</sub>');
    sim.out('T', 'Período <i>T</i>', { hl: true });
    sim.out('A', 'Amplitud <i>A</i>');
    sim.out('phi', 'Fase inicial <i>φ</i>');
    sim.out('eq', 'Estiramiento de equilibrio <i>mg</i>/<i>k</i>');
    sim.out('vm', 'Velocidad máxima <i>ω</i><sub>0</sub><i>A</i>');
    let t = 0;
    sim.onChange = (id) => { if (id !== 'ori') t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, w = Math.sqrt(p.k / p.m);
      const A = Math.hypot(p.x0, p.v0 / w), phi = Math.atan2(-p.v0 / w, p.x0);
      const x = (tt) => A * Math.cos(w * tt + phi);
      const xs = x(t);
      /* esquema */
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const sc = (W * 0.32) / 0.25;
      if (p.ori === 'h') {
        const xw = 30, xe = W * 0.5, y = H * 0.55;
        EM.draw.support(ctx, xw, y, H * 0.6, 'right');
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(xw, y + 22); ctx.lineTo(W - 20, y + 22); ctx.stroke();
        const bx = xe + xs * sc;
        EM.draw.spring(ctx, xw, y, bx - 22, y, { coils: 12, r: 9 });
        EM.draw.block(ctx, bx, y, 44, 44, { label: 'm', italic: true });
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3');
        ctx.beginPath(); ctx.moveTo(xe, 10); ctx.lineTo(xe, y + 30); ctx.stroke(); ctx.restore();
        EM.text(ctx, 'x = 0', xe, 14, { size: 11, color: '--ink-3', align: 'center' });
        for (const s of [-1, 1]) { const xa = xe + s * A * sc; ctx.fillStyle = EM.alpha('--accent', 0.5); ctx.fillRect(xa - 1, y + 24, 2, 10); }
        EM.text(ctx, '−A', xe - A * sc, y + 46, { size: 11, color: '--accent', align: 'center' });
        EM.text(ctx, '+A', xe + A * sc, y + 46, { size: 11, color: '--accent', align: 'center' });
      } else {
        /* vertical: girado, resorte cuelga del techo a la izquierda del dibujo */
        const cx = W * 0.5, top = 8;
        const g = 9.81, d = (p.m * g) / p.k;
        const scv = (H * 0.45) / 0.35;
        const y0 = top + H * 0.38 + Math.min(d, 0.25) * scv * 0.4;
        const by = y0 - xs * scv * 0.55;
        EM.draw.support(ctx, cx, top + 4, 70, 'down');
        EM.draw.spring(ctx, cx, top + 4, cx, by - 16, { coils: 10, r: 8 });
        EM.draw.block(ctx, cx, by, 40, 32, { label: 'm', italic: true });
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3');
        ctx.beginPath(); ctx.moveTo(cx + 30, y0); ctx.lineTo(cx + 110, y0); ctx.stroke(); ctx.restore();
        EM.text(ctx, 'equilibrio (estirado mg/k)', cx + 114, y0 + 4, { size: 11, color: '--ink-3' });
        EM.text(ctx, 'x positivo hacia arriba', 16, H - 10, { size: 11, color: '--ink-3' });
      }
      /* gráficas */
      EM.draw.clear(cp);
      const c2 = cp.ctx, hh = cp.h / 3;
      const span = Math.max(3 * (2 * Math.PI) / w, 2);
      const t0 = Math.max(0, t - span * 0.75);
      const vmax = w * A || 1, amax = w * w * A || 1;
      const rows = [['x (m)', (tt) => x(tt), Math.max(A, 0.01) * 1.25, '--accent'], ['v (m/s)', (tt) => -w * A * Math.sin(w * tt + phi), vmax * 1.25, '--c1'], ['a (m/s²)', (tt) => -w * w * x(tt), amax * 1.25, '--c3']];
      rows.forEach(([lab, f, ym, col], i) => {
        const pl = new EM.Plot(c2, { x: 0, y: i * hh, w: cp.w, h: hh, xmin: t0, xmax: t0 + span, ymin: -ym, ymax: ym, ylabel: lab, xlabel: i === 2 ? 't (s)' : '', mb: i === 2 ? 34 : 8, mt: 8, ml: 58 });
        pl.frame();
        pl.fn(f, { color: col, width: 2, to: t });
        pl.dot(t, f(t), { color: col });
      });
      sim.set('w', EM.fix(w, 3) + ' rad/s');
      sim.set('T', EM.fix((2 * Math.PI) / w, 3) + ' s');
      sim.set('A', EM.si(A, 'm'));
      sim.set('phi', EM.fix(phi, 3) + ' rad = ' + EM.fix(M.deg(phi), 1) + '°');
      sim.set('eq', p.ori === 'v' ? EM.si((p.m * 9.81) / p.k, 'm') : '— (horizontal)');
      sim.set('vm', EM.fix(w * A, 3) + ' m/s');
    });
  });

  /* ======================================================================
     2.2 Círculo de referencia
     ====================================================================== */
  EM.defineSim('shm-circle', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('w', { label: 'Frecuencia angular <i>ω</i><sub>0</sub>', min: 0.3, max: 4, step: 0.05, value: 1.2, unit: 'rad/s', fmt: f2 });
    sim.slider('phi', { label: 'Fase inicial <i>φ</i>', min: -180, max: 180, step: 5, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('vel', { label: 'Velocidad del punto (tangente)', value: true });
    sim.check('acc', { label: 'Aceleración centrípeta', value: false });
    sim.out('x', '<i>x</i> = <i>A</i> cos(<i>ω</i><sub>0</sub><i>t</i> + <i>φ</i>)', { hl: true });
    sim.out('v', '<i>v<sub>x</sub></i>');
    sim.out('a', '<i>a<sub>x</sub></i> = −<i>ω</i><sub>0</sub>²<i>x</i>');
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const R = H * 0.32, cx = W * 0.3, cy = H * 0.42;
      const th = p.w * t + M.rad(p.phi);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R * 1.3, cy); ctx.lineTo(cx + R * 1.3, cy); ctx.stroke();
      const Px = cx + R * Math.cos(th), Py = cy - R * Math.sin(th);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Px, Py); ctx.stroke();
      ctx.save(); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(Px, Py); ctx.lineTo(Px, H * 0.88); ctx.stroke(); ctx.restore();
      if (p.vel) {
        const s = R * 0.6;
        EM.draw.arrow(ctx, Px, Py, Px - s * Math.sin(th), Py - s * Math.cos(th), { color: '--c1', width: 2 });
        EM.draw.arrow(ctx, Px, H * 0.88, Px - s * Math.sin(th), H * 0.88, { color: '--c1', width: 2.4 });
      }
      if (p.acc) {
        const s = R * 0.5;
        EM.draw.arrow(ctx, Px, Py, Px - s * Math.cos(th), Py + s * Math.sin(th), { color: '--c3', width: 2 });
        EM.draw.arrow(ctx, Px, H * 0.88 + 8, Px - s * Math.cos(th), H * 0.88 + 8, { color: '--c3', width: 2.4 });
      }
      EM.draw.bob(ctx, Px, Py, 7, { color: '--c5' });
      /* eje del oscilador */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - R * 1.2, H * 0.88); ctx.lineTo(cx + R * 1.2, H * 0.88); ctx.stroke();
      EM.draw.block(ctx, Px, H * 0.88, 18, 14, { fill: '--accent' });
      /* gráfica x(t) vertical a la derecha */
      const x0 = W * 0.56;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: W - x0, h: H, xmin: 0, xmax: 4 * Math.PI, ymin: -1.3, ymax: 1.3, xpi: true, xlabel: 'fase ω₀t + φ', ylabel: 'x/A', ml: 52 });
      pl.frame();
      const ph = th - M.rad(p.phi);
      const off = Math.max(0, ph - 4 * Math.PI);
      pl.fn((u) => Math.cos(u + off + M.rad(p.phi)), { color: '--accent', width: 2.2, to: ph - off });
      if (p.vel) pl.fn((u) => -Math.sin(u + off + M.rad(p.phi)), { color: '--c1', width: 1.4, dash: [5, 3], to: ph - off });
      if (p.acc) pl.fn((u) => -Math.cos(u + off + M.rad(p.phi)), { color: '--c3', width: 1.4, dash: [2, 3], to: ph - off });
      pl.dot(ph - off, Math.cos(th), { color: '--accent' });
      sim.set('x', EM.fix(Math.cos(th), 3) + ' <i>A</i>');
      sim.set('v', EM.fix(-Math.sin(th), 3) + ' <i>ω</i><sub>0</sub><i>A</i>');
      sim.set('a', EM.fix(-Math.cos(th), 3) + ' <i>ω</i><sub>0</sub>²<i>A</i>');
    });
  });

  /* ======================================================================
     2.3 Energía
     ====================================================================== */
  EM.defineSim('shm-energy', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('k', { label: 'Constante <i>k</i>', min: 5, max: 100, step: 1, value: 20, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.2, max: 3, step: 0.05, value: 0.5, unit: 'kg', fmt: f2 });
    sim.slider('A', { label: 'Amplitud <i>A</i>', min: 0.02, max: 0.3, step: 0.005, value: 0.2, unit: 'm', fmt: (v) => EM.fix(v, 3) });
    sim.check('hist', { label: 'Histograma de posiciones', value: true });
    sim.resetButton(() => { t = 0; hist.fill(0); });
    sim.out('E', 'Energía total ½<i>kA</i>²', { hl: true });
    sim.out('K', 'Cinética <i>K</i>');
    sim.out('U', 'Potencial <i>U</i>');
    sim.out('avg', '⟨<i>K</i>⟩ / ⟨<i>U</i>⟩ acumulados');
    const NB = 40, hist = new Float64Array(NB);
    let t = 0, sK = 0, sU = 0;
    sim.onChange = () => { hist.fill(0); sK = 0; sU = 0; };
    sim.animate((dt) => {
      const p = sim.p, w = Math.sqrt(p.k / p.m);
      const n = 20;
      for (let i = 0; i < n; i++) {
        t += dt / n;
        const x = p.A * Math.cos(w * t), v = -w * p.A * Math.sin(w * t);
        const b = Math.min(NB - 1, Math.floor(((x / p.A + 1) / 2) * NB));
        hist[b] += 1;
        sK += 0.5 * p.m * v * v; sU += 0.5 * p.k * x * x;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, w = Math.sqrt(p.k / p.m);
      const x = p.A * Math.cos(w * t), v = -w * p.A * Math.sin(w * t);
      const E = 0.5 * p.k * p.A * p.A, U = 0.5 * p.k * x * x, K = E - U;
      EM.draw.clear(cv);
      const pw = W * 0.7;
      const Emax = 0.5 * 100 * 0.09;
      const ymax = Math.max(E * 1.4, 0.05);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: pw, h: H, xmin: -0.32, xmax: 0.32, ymin: 0, ymax, xlabel: 'x (m)', ylabel: 'energía (J)', ml: 56 });
      pl.frame();
      if (p.hist) {
        const mx = Math.max(1, ...hist);
        for (let b = 0; b < NB; b++) {
          const xa = -p.A + (2 * p.A * b) / NB, xb = xa + (2 * p.A) / NB;
          const hgt = (hist[b] / mx) * ymax * 0.55;
          ctx.fillStyle = EM.alpha('--c5', 0.18);
          ctx.fillRect(pl.X(xa), pl.Y(hgt), pl.X(xb) - pl.X(xa) - 1, pl.Y(0) - pl.Y(hgt));
        }
      }
      pl.fn((xx) => 0.5 * p.k * xx * xx, { color: '--ink-2', width: 2 });
      pl.hline(E, { color: '--accent', dash: [], width: 1.6, label: 'E', labelRight: true });
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(U)); ctx.lineTo(pl.X(x), pl.Y(E)); ctx.stroke();
      ctx.strokeStyle = EM.col('--c3');
      ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(0)); ctx.lineTo(pl.X(x), pl.Y(U)); ctx.stroke();
      pl.dot(x, U, { color: '--accent', r: 6 });
      pl.vline(-p.A, { color: '--accent', alpha: 0.5 });
      pl.vline(p.A, { color: '--accent', alpha: 0.5 });
      /* barras */
      const bx = pw + 30, bw = (W - pw - 60) / 2, by = H - 40, bh = H - 80;
      const bars = [['K', K, '--c1'], ['U', U, '--c3']];
      bars.forEach(([n, val, col], i) => {
        const h = (val / E) * bh;
        ctx.fillStyle = EM.alpha(col, 0.85);
        ctx.fillRect(bx + i * (bw + 10), by - h, bw, h);
        ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(bx + i * (bw + 10) + 0.5, by - bh + 0.5, bw, bh);
        EM.text(ctx, n, bx + i * (bw + 10) + bw / 2, by + 18, { size: 13, italic: true, family: EM.FONT_MATH, align: 'center', color: col });
      });
      EM.text(ctx, 'fracción de E', bx + bw + 5, 22, { size: 11, color: '--ink-3', align: 'center' });
      void Emax; void v;
      sim.set('E', EM.si(E, 'J'));
      sim.set('K', EM.si(K, 'J') + ' (' + EM.fix((100 * K) / E, 0) + ' %)');
      sim.set('U', EM.si(U, 'J') + ' (' + EM.fix((100 * U) / E, 0) + ' %)');
      sim.set('avg', sU > 0 ? EM.fix(sK / sU, 3) : '—');
    });
  });

  /* ======================================================================
     2.4 Espacio de fases
     ====================================================================== */
  EM.defineSim('phase-space', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.05 });
    const cx = sim.canvas({ aspect: 1.05 });
    sim.slider('w', { label: 'Frecuencia <i>ω</i><sub>0</sub>', min: 0.3, max: 2, step: 0.05, value: 1, unit: 'rad/s', fmt: f2 });
    sim.check('cloud', { label: 'Lanzar una nube de estados', value: false, onInput: () => seed() });
    sim.button('Borrar osciladores', () => { pts.length = 0; });
    sim.out('n', 'Osciladores');
    sim.out('area', 'Área de la nube (relativa)', { hl: true });
    sim.hint('Haz clic en el plano para añadir un oscilador', cv);
    const pts = [];
    let cloud = [];
    const L = 2.2;
    const seed = () => {
      cloud = [];
      if (sim.p.cloud) for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) cloud.push([1.0 + 0.4 * (i / 15), 0.2 + 0.4 * (j / 7)]);
    };
    const pl = () => new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -L, xmax: L, ymin: -L, ymax: L, xlabel: 'x', ylabel: 'v / ω₀', ml: 52 });
    EM.pointer(cv, {
      down: (x, y) => { const P = pl(); if (!P.inside(x, y)) return null; pts.push([P.invX(x), P.invY(y)]); if (pts.length > 12) pts.shift(); sim.redraw(); return null; },
      hover: () => 'crosshair'
    });
    pts.push([1.5, 0], [0.6, 0.6]);
    sim.animate((dt) => {
      const a = sim.p.w * dt, c = Math.cos(a), s = Math.sin(a);
      /* rotación horaria en (x, v/ω) */
      const rot = (q) => { const x = q[0] * c + q[1] * s, y = -q[0] * s + q[1] * c; q[0] = x; q[1] = y; };
      pts.forEach(rot); cloud.forEach(rot);
    });
    const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--accent'];
    sim.onDraw(() => {
      EM.draw.clear(cv);
      const P = pl();
      P.frame();
      for (const r of [0.5, 1, 1.5, 2]) P.path(EM.M.linspace(0, 2 * Math.PI, 120).map((a) => [r * Math.cos(a), r * Math.sin(a)]), { color: '--grid-2', width: 1 });
      pts.forEach((q, i) => {
        const r = Math.hypot(q[0], q[1]);
        P.path(EM.M.linspace(0, 2 * Math.PI, 160).map((a) => [r * Math.cos(a), r * Math.sin(a)]), { color: cols[i % cols.length], width: 1.4, alpha: 0.7 });
        P.dot(q[0], q[1], { color: cols[i % cols.length], r: 5.5 });
      });
      cloud.forEach((q) => P.dot(q[0], q[1], { color: '--accent', r: 2.4 }));
      /* gráfica x(t) de cada oscilador */
      EM.draw.clear(cx);
      const pp = new EM.Plot(cx.ctx, { x: 0, y: 0, w: cx.w, h: cx.h, xmin: 0, xmax: 4 * Math.PI, ymin: -L, ymax: L, xpi: true, xlabel: 'ω₀ × (tiempo futuro)', ylabel: 'x', ml: 52 });
      pp.frame();
      pts.forEach((q, i) => {
        const r = Math.hypot(q[0], q[1]), ph = Math.atan2(q[1], q[0]);
        pp.fn((u) => r * Math.cos(u + ph), { color: cols[i % cols.length], width: 1.8 });
      });
      sim.set('n', String(pts.length) + (cloud.length ? ' + nube de ' + cloud.length : ''));
      if (cloud.length) {
        /* área por el método del jacobiano: la rotación conserva distancias, así que el área es la inicial */
        const a = Math.abs((cloud[cloud.length - 1][0] - cloud[0][0]) * (cloud[7][1] - cloud[0][1]) - (cloud[cloud.length - 1][1] - cloud[0][1]) * (cloud[7][0] - cloud[0][0]));
        sim.set('area', EM.fix(a / 0.16, 4));
      } else sim.set('area', '— (active la nube)');
    });
  });

  /* ======================================================================
     2.5 Zoológico de osciladores
     ====================================================================== */
  EM.defineSim('oscillator-zoo', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    const SYS = {
      par: { n: 'Resortes en paralelo', p: [['a', 'k₁ (N/m)', 10, 500, 100], ['b', 'k₂ (N/m)', 10, 500, 50], ['c', 'm (kg)', 0.1, 5, 1]], w: (a, b, c) => Math.sqrt((a + b) / c) },
      ser: { n: 'Resortes en serie', p: [['a', 'k₁ (N/m)', 10, 500, 100], ['b', 'k₂ (N/m)', 10, 500, 50], ['c', 'm (kg)', 0.1, 5, 1]], w: (a, b, c) => Math.sqrt((a * b) / ((a + b) * c)) },
      pend: { n: 'Péndulo simple', p: [['a', 'ℓ (m)', 0.05, 5, 1], ['b', 'g (m/s²)', 1, 25, 9.81]], w: (a, b) => Math.sqrt(b / a) },
      utube: { n: 'Líquido en tubo en U', p: [['a', 'L total (m)', 0.1, 3, 0.6], ['b', 'g (m/s²)', 1, 25, 9.81]], w: (a, b) => Math.sqrt((2 * b) / a) },
      float: { n: 'Flotador cilíndrico', p: [['a', 'ρ cuerpo (kg/m³)', 50, 990, 600], ['b', 'altura h (m)', 0.02, 1, 0.2], ['c', 'ρ líquido (kg/m³)', 600, 13600, 1000]], w: (a, b, c) => Math.sqrt((c * 9.81) / (a * b)) },
      lc: { n: 'Circuito LC', p: [['a', 'L (mH)', 0.01, 1000, 10], ['b', 'C (µF)', 0.001, 1000, 1]], w: (a, b) => 1 / Math.sqrt(a * 1e-3 * b * 1e-6), log: true },
      tors: { n: 'Péndulo de torsión (disco)', p: [['a', 'κ (mN·m/rad)', 0.1, 100, 5], ['b', 'masa del disco (kg)', 0.05, 5, 0.5], ['c', 'radio (cm)', 1, 30, 10]], w: (a, b, c) => Math.sqrt((a * 1e-3) / (0.5 * b * (c / 100) ** 2)) },
      wire: { n: 'Masa en el centro de un hilo tenso', p: [['a', 'tensión T (N)', 1, 500, 50], ['b', 'longitud L (m)', 0.1, 3, 1], ['c', 'm (kg)', 0.01, 2, 0.1]], w: (a, b, c) => Math.sqrt((4 * a) / (b * c)) }
    };
    sim.group('Sistema');
    sim.select('sys', { options: Object.keys(SYS).map((k) => [k, SYS[k].n]), value: 'par', onInput: () => config() });
    sim.group('Parámetros');
    const ctl = {};
    ['a', 'b', 'c'].forEach((id) => { ctl[id] = sim.slider(id, { label: id, min: 0, max: 1, value: 0.5, log: true, step: 0.0001, fmt: (v) => EM.sci(v, 3) }); });
    function config() {
      const S = SYS[sim.p.sys];
      ['a', 'b', 'c'].forEach((id, i) => {
        const q = S.p[i];
        if (!q) { ctl[id].show(false); return; }
        ctl[id].show(true);
        ctl[id].label(q[1]);
        ctl[id].input.min = 0; ctl[id].input.max = 1000;
        ctl[id].range(q[2], q[3]);
        ctl[id].set(q[4], true);
      });
    }
    /* el deslizador logarítmico usa o.min/o.max del objeto original: se reemplazan en range() */
    config();
    sim.out('w', '<i>ω</i><sub>0</sub>', { hl: true });
    sim.out('f', 'Frecuencia <i>f</i>');
    sim.out('T', 'Período <i>T</i>');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const S = SYS[sim.p.sys];
      const args = ['a', 'b', 'c'].map((id) => sim.p[id]);
      const w = S.w(...args);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* animación a velocidad visible: si ω es muy grande, se ralentiza */
      const wv = Math.min(w, 8), slow = w > 8 ? w / 8 : 1;
      const q = Math.cos(wv * t);
      const k = sim.p.sys;
      const cx = W * 0.5, cy = H * 0.5;
      if (k === 'par' || k === 'ser') {
        const bx = cx + 60 * q;
        EM.draw.support(ctx, 40, cy, H * 0.7, 'right');
        if (k === 'par') { EM.draw.spring(ctx, 40, cy - 20, bx - 25, cy - 20, { coils: 10, r: 7 }); EM.draw.spring(ctx, 40, cy + 20, bx - 25, cy + 20, { coils: 6, r: 7, color: '--c3' }); }
        else { const mid = 40 + (bx - 25 - 40) * 0.5; EM.draw.spring(ctx, 40, cy, mid, cy, { coils: 8, r: 7 }); EM.draw.spring(ctx, mid, cy, bx - 25, cy, { coils: 5, r: 7, color: '--c3' }); }
        EM.draw.block(ctx, bx, cy, 50, 60, { label: 'm', italic: true });
      } else if (k === 'pend') {
        const L = H * 0.75, th = 0.35 * q;
        EM.draw.support(ctx, cx, 10, 80, 'down');
        const bx = cx + L * Math.sin(th), by = 10 + L * Math.cos(th);
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(bx, by); ctx.stroke();
        EM.draw.bob(ctx, bx, by, 13);
      } else if (k === 'utube') {
        const w2 = 26, d = 26 * q, base = H * 0.82, left = cx - 70, right = cx + 70;
        ctx.fillStyle = EM.alpha('--c1', 0.55);
        ctx.fillRect(left - w2 / 2, base - 90 - d, w2, 90 + d);
        ctx.fillRect(right - w2 / 2, base - 90 + d, w2, 90 - d);
        ctx.fillRect(left - w2 / 2, base - 4, right - left + w2, w2 - 4);
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left - w2 / 2, base - 150); ctx.lineTo(left - w2 / 2, base + w2 - 8); ctx.lineTo(right + w2 / 2, base + w2 - 8); ctx.lineTo(right + w2 / 2, base - 150);
        ctx.moveTo(left + w2 / 2, base - 150); ctx.lineTo(left + w2 / 2, base - 4); ctx.lineTo(right - w2 / 2, base - 4); ctx.lineTo(right - w2 / 2, base - 150); ctx.stroke();
      } else if (k === 'float') {
        const wl = cy;
        ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.fillRect(0, wl, W, H - wl);
        const sub = (args[0] / args[2]) * 100;
        EM.draw.block(ctx, cx, wl - 50 + sub - 50 + 12 * q + 50, 50, 100, { fill: '--c4' });
      } else if (k === 'lc') {
        EM.text(ctx, 'carga del condensador', cx, 20, { size: 12, color: '--ink-2', align: 'center' });
        const h = 70 * q;
        ctx.fillStyle = EM.alpha(h > 0 ? '--c2' : '--c1', 0.8);
        ctx.fillRect(cx - 60, cy - 8 - Math.abs(h), 120, Math.abs(h));
        ctx.fillStyle = EM.alpha(h > 0 ? '--c1' : '--c2', 0.8);
        ctx.fillRect(cx - 60, cy + 8, 120, Math.abs(h));
        ctx.fillStyle = EM.col('--ink'); ctx.fillRect(cx - 70, cy - 8, 140, 3); ctx.fillRect(cx - 70, cy + 5, 140, 3);
      } else if (k === 'tors') {
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
        EM.draw.support(ctx, cx, 10, 60, 'down');
        ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.save(); ctx.translate(cx, cy + 20);
        ctx.fillStyle = EM.alpha('--c4', 0.8);
        ctx.beginPath(); ctx.ellipse(0, 0, 90, 22, 0, 0, 2 * Math.PI); ctx.fill();
        const a = 1.2 * q;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(85 * Math.cos(a), 20 * Math.sin(a)); ctx.stroke();
        ctx.restore();
      } else if (k === 'wire') {
        const y = cy + 40 * q;
        EM.draw.support(ctx, 30, cy, 60, 'right'); EM.draw.support(ctx, W - 30, cy, 60, 'left');
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(30, cy); ctx.lineTo(cx, y); ctx.lineTo(W - 30, cy); ctx.stroke();
        EM.draw.bob(ctx, cx, y, 11);
      }
      if (slow > 1) EM.text(ctx, 'animación ' + EM.sci(slow, 2) + ' veces más lenta', 10, H - 10, { size: 11, color: '--ink-3' });
      sim.set('w', EM.si(w, 'rad/s'));
      sim.set('f', EM.si(w / (2 * Math.PI), 'Hz'));
      sim.set('T', EM.si((2 * Math.PI) / w, 's'));
    });
  });
})();
