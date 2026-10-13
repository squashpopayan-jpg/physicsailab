/* Capítulo 9 — Osciladores acoplados */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Autovalores generalizados 2×2: K a = ω² M a con M diagonal */
  function modes2(m1, m2, k11, k12, k22) {
    /* det(K − λM) = m1 m2 λ² − (k11 m2 + k22 m1) λ + (k11 k22 − k12²) = 0 */
    const a = m1 * m2, b = -(k11 * m2 + k22 * m1), c = k11 * k22 - k12 * k12;
    const D = Math.sqrt(Math.max(0, b * b - 4 * a * c));
    const l1 = (-b - D) / (2 * a), l2 = (-b + D) / (2 * a);
    /* vector: (k11 − λ m1) a1 + k12 a2 = 0 → a2/a1 = −(k11 − λ m1)/k12 */
    const r = (l) => (Math.abs(k12) < 1e-12 ? (Math.abs(k11 - l * m1) < 1e-9 ? 0 : 1e9) : -(k11 - l * m1) / k12);
    return [[Math.sqrt(Math.max(0, l1)), r(l1)], [Math.sqrt(Math.max(0, l2)), r(l2)]];
  }
  EM.modes2 = modes2;

  /* Dibuja una fila de masas y resortes entre paredes; xs: posiciones de equilibrio (px), ds: desplazamientos (px) */
  function drawChain(ctx, xL, xR, y, xs, ds, o = {}) {
    EM.draw.support(ctx, xL, y, 70, 'right');
    EM.draw.support(ctx, xR, y, 70, 'left');
    const w = o.w || 40;
    const pos = xs.map((x, i) => x + ds[i]);
    const ends = [xL].concat(pos).concat([xR]);
    for (let i = 0; i < ends.length - 1; i++) {
      const a = i === 0 ? ends[i] : ends[i] + w / 2, b = i === ends.length - 2 ? ends[i + 1] : ends[i + 1] - w / 2;
      const col = o.springCols ? o.springCols[i] : '--ink-2';
      if ((o.walls === false) && (i === 0 || i === ends.length - 2)) continue;
      EM.draw.spring(ctx, a, y, b, y, { coils: o.coils || 8, r: 7, color: col, lead: 6 });
    }
    pos.forEach((x, i) => EM.draw.block(ctx, x, y, o.ws ? o.ws[i] : w, o.hs ? o.hs[i] : 40, { fill: o.fills ? o.fills[i] : '--c1', label: o.labels ? o.labels[i] : null, italic: true }));
  }
  EM.drawChain = drawChain;

  /* ======================================================================
     9.1 Dos masas acopladas
     ====================================================================== */
  EM.defineSim('two-masses', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 4.4, cls: 'full fixed' });
    const cx = sim.canvas({ aspect: 1.25 });
    const cq = sim.canvas({ aspect: 1.25 });
    sim.group('Resortes y masa');
    sim.slider('k', { label: 'Resortes externos <i>k</i>', min: 5, max: 100, step: 1, value: 40, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.slider('kc', { label: 'Acoplamiento <i>κ</i>', min: 0, max: 100, step: 0.5, value: 10, unit: 'N/m', fmt: (v) => EM.fix(v, 1) });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'kg', fmt: f2 });
    sim.group('Estado inicial');
    sim.seg('ic', { options: [['m1', 'Modo 1'], ['m2', 'Modo 2'], ['one', 'Sólo masa 1'], ['mix', 'Mezcla']], value: 'one', onInput: () => { t = 0; } });
    sim.resetButton(() => { t = 0; });
    sim.out('w1', '<i>ω</i><sub>1</sub> (en fase)', { hl: true });
    sim.out('w2', '<i>ω</i><sub>2</sub> (en oposición)');
    sim.out('tt', 'Tiempo de transferencia <i>π</i>/(<i>ω</i><sub>2</sub> − <i>ω</i><sub>1</sub>)');
    let t = 0;
    sim.onChange = (id) => { if (id !== 'ic') t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, w1 = Math.sqrt(p.k / p.m), w2 = Math.sqrt((p.k + 2 * p.kc) / p.m);
      const IC = { m1: [1, 0], m2: [0, 1], one: [1, 1], mix: [1, 0.4] }[p.ic];
      const A = 0.5;
      const q1 = (tt) => A * IC[0] * Math.cos(w1 * tt), q2 = (tt) => A * IC[1] * Math.cos(w2 * tt);
      const x1 = (tt) => 0.5 * (q1(tt) + q2(tt)), x2 = (tt) => 0.5 * (q1(tt) - q2(tt));
      EM.draw.clear(cs);
      const W = cs.w, H = cs.h, sc = W * 0.16;
      drawChain(cs.ctx, 20, W - 20, H * 0.55, [W * 0.36, W * 0.64], [x1(t) * sc, x2(t) * sc], { labels: ['1', '2'], springCols: ['--ink-2', '--c3', '--ink-2'] });
      const span = Math.max(16, (4 * Math.PI) / Math.max(1e-3, w2 - w1));
      const t0 = Math.max(0, t - Math.min(span, 30));
      const S = Math.min(span, 30);
      EM.draw.clear(cx);
      const px = new EM.Plot(cx.ctx, { x: 0, y: 0, w: cx.w, h: cx.h, xmin: t0, xmax: t0 + S, ymin: -0.6, ymax: 0.6, xlabel: 't (s)', ylabel: 'x₁, x₂ (m)', ml: 52 });
      px.frame();
      px.fn(x1, { color: '--c1', width: 1.8, to: t, n: 1500 });
      px.fn(x2, { color: '--c2', width: 1.8, to: t, n: 1500 });
      px.legend([{ label: 'x₁', color: '--c1' }, { label: 'x₂', color: '--c2' }], 'tr');
      EM.draw.clear(cq);
      const pq = new EM.Plot(cq.ctx, { x: 0, y: 0, w: cq.w, h: cq.h, xmin: t0, xmax: t0 + S, ymin: -0.6, ymax: 0.6, xlabel: 't (s)', ylabel: 'coordenadas normales', ml: 52 });
      pq.frame();
      pq.fn((tt) => 0.5 * q1(tt), { color: '--c3', width: 1.8, to: t, n: 1500 });
      pq.fn((tt) => 0.5 * q2(tt), { color: '--c5', width: 1.8, to: t, n: 1500 });
      pq.legend([{ label: '(x₁ + x₂)/2', color: '--c3' }, { label: '(x₁ − x₂)/2', color: '--c5' }], 'tr');
      sim.set('w1', EM.fix(w1, 3) + ' rad/s');
      sim.set('w2', EM.fix(w2, 3) + ' rad/s');
      sim.set('tt', p.kc > 0 ? EM.fix(Math.PI / (w2 - w1), 3) + ' s' : '∞ (sin acoplamiento)');
    });
  });

  /* ======================================================================
     9.2 Péndulos acoplados
     ====================================================================== */
  EM.defineSim('coupled-pendulums', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.1 });
    const ce = sim.canvas({ aspect: 1.1 });
    sim.slider('L1', { label: 'Longitud del péndulo 1', min: 0.5, max: 1.5, step: 0.01, value: 1, unit: 'm', fmt: f2, onInput: () => restart() });
    sim.slider('L2', { label: 'Longitud del péndulo 2', min: 0.5, max: 1.5, step: 0.01, value: 1, unit: 'm', fmt: f2, onInput: () => restart() });
    sim.slider('kc', { label: 'Acoplamiento <i>κ</i>/<i>m</i>', min: 0, max: 3, step: 0.01, value: 0.3, unit: 's⁻²', fmt: f2, onInput: () => restart() });
    sim.slider('sp', { label: 'Velocidad', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v + '×' });
    sim.resetButton(() => restart());
    sim.note('El péndulo 1 se suelta desde 10°; el 2 parte en reposo. El resorte está a la mitad de la altura.');
    sim.out('tt', 'Tiempo de transferencia', { hl: true });
    sim.out('max', 'Fracción máxima de energía transferida');
    const g = 9.81;
    let y, t, tr, maxE2;
    const restart = () => { y = [M.rad(10), 0, 0, 0]; t = 0; tr = new EM.Trace(3000); maxE2 = 0; };
    restart();
    /* coordenadas: θ1, ω1, θ2, ω2 con lineal; resorte a mitad de longitud del más corto */
    const f = (tt, s) => {
      const p = sim.p, h = 0.5 * Math.min(p.L1, p.L2);
      const d = h * (s[2] - s[0]);
      return [s[1], -(g / p.L1) * s[0] + (p.kc * h * d) / (p.L1 * p.L1), s[3], -(g / p.L2) * s[2] - (p.kc * h * d) / (p.L2 * p.L2)];
    };
    const energies = (s) => { const p = sim.p, h = 0.5 * Math.min(p.L1, p.L2); const E1 = 0.5 * p.L1 * p.L1 * s[1] * s[1] + 0.5 * g * p.L1 * s[0] * s[0]; const E2 = 0.5 * p.L2 * p.L2 * s[3] * s[3] + 0.5 * g * p.L2 * s[2] * s[2]; const Ec = 0.5 * p.kc * (h * (s[2] - s[0])) ** 2; return [E1, E2, Ec]; };
    sim.animate((dt) => {
      const T = dt * sim.p.sp;
      y = EM.integrate(f, t, y, t + T, 12);
      t += T;
      const [E1, E2] = energies(y);
      tr.push(t, E1, E2);
      const E0 = 0.5 * g * sim.p.L1 * M.rad(10) ** 2;
      maxE2 = Math.max(maxE2, E2 / E0);
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = (H * 0.75) / 1.5, x1 = W * 0.33, x2 = W * 0.67, top = 14;
      EM.draw.support(ctx, W / 2, top, W * 0.7, 'down');
      const b1 = [x1 + p.L1 * sc * Math.sin(y[0]), top + p.L1 * sc * Math.cos(y[0])];
      const b2 = [x2 + p.L2 * sc * Math.sin(y[2]), top + p.L2 * sc * Math.cos(y[2])];
      const h = 0.5 * Math.min(p.L1, p.L2);
      const s1 = [x1 + h * sc * Math.sin(y[0]), top + h * sc * Math.cos(y[0])], s2 = [x2 + h * sc * Math.sin(y[2]), top + h * sc * Math.cos(y[2])];
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x1, top); ctx.lineTo(b1[0], b1[1]); ctx.moveTo(x2, top); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
      if (p.kc > 0) EM.draw.spring(ctx, s1[0], s1[1], s2[0], s2[1], { coils: 9, r: 5, color: '--c3', lead: 4 });
      EM.draw.bob(ctx, b1[0], b1[1], 12, { color: '--c1' });
      EM.draw.bob(ctx, b2[0], b2[1], 12, { color: '--c2' });
      EM.draw.clear(ce);
      const E0 = 0.5 * g * p.L1 * M.rad(10) ** 2;
      const span = 40, t0 = Math.max(0, t - span);
      const pe = new EM.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: t0, xmax: t0 + span, ymin: 0, ymax: 1.1, xlabel: 't (s)', ylabel: 'energía / E₀', ml: 52 });
      pe.frame();
      pe.xy(tr.t, tr.col(0).map((e) => e / E0), { color: '--c1', width: 1.8 });
      pe.xy(tr.t, tr.col(1).map((e) => e / E0), { color: '--c2', width: 1.8 });
      pe.legend([{ label: 'péndulo 1', color: '--c1' }, { label: 'péndulo 2', color: '--c2' }], 'tr');
      /* frecuencias normales del sistema linealizado */
      const kk = p.kc * h * h;
      const md = modes2(p.L1 * p.L1, p.L2 * p.L2, g * p.L1 + kk, -kk, g * p.L2 + kk);
      sim.set('tt', p.kc > 0 ? EM.fix(Math.PI / (md[1][0] - md[0][0]), 2) + ' s' : '∞');
      sim.set('max', EM.fix(100 * Math.min(1, maxE2), 1) + ' %');
    });
  });

  /* ======================================================================
     9.3 Calculadora de modos normales
     ====================================================================== */
  EM.defineSim('normal-modes', function (sim) {
    sim.cols2();
    const c1 = sim.canvas({ aspect: 3, cls: 'full fixed' });
    const c2 = sim.canvas({ aspect: 3, cls: 'full fixed' });
    sim.group('Masas');
    sim.slider('m1', { label: '<i>m</i><sub>1</sub>', min: 0.2, max: 5, step: 0.05, value: 1, unit: 'kg', fmt: f2 });
    sim.slider('m2', { label: '<i>m</i><sub>2</sub>', min: 0.2, max: 5, step: 0.05, value: 2, unit: 'kg', fmt: f2 });
    sim.group('Resortes');
    sim.slider('k1', { label: '<i>k</i><sub>1</sub> (pared–1)', min: 0, max: 100, step: 1, value: 40, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.slider('k2', { label: '<i>k</i><sub>2</sub> (1–2)', min: 1, max: 100, step: 1, value: 40, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.slider('k3', { label: '<i>k</i><sub>3</sub> (2–pared)', min: 0, max: 100, step: 1, value: 40, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.out('w1', 'Modo 1: <i>ω</i>, <i>a</i><sub>2</sub>/<i>a</i><sub>1</sub>', { hl: true });
    sim.out('w2', 'Modo 2: <i>ω</i>, <i>a</i><sub>2</sub>/<i>a</i><sub>1</sub>');
    sim.out('orth', 'Ortogonalidad <b>a</b>₁ᵀ M <b>a</b>₂');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p;
      const md = modes2(p.m1, p.m2, p.k1 + p.k2, -p.k2, p.k2 + p.k3);
      [[c1, md[0], 'Modo 1'], [c2, md[1], 'Modo 2']].forEach(([cv, [w, r], name]) => {
        EM.draw.clear(cv);
        const W = cv.w, H = cv.h;
        let a1 = 1, a2 = r;
        if (Math.abs(r) > 1) { a1 = 1 / Math.abs(r); a2 = Math.sign(r); }
        const ph = Math.cos((w > 0 ? (w / md[1][0]) * 2.6 : 0) * t * 2);
        const sc = W * 0.1;
        drawChain(cv.ctx, 20, W - 20, H * 0.55, [W * 0.36, W * 0.64], [a1 * ph * sc, a2 * ph * sc], { ws: [30 + 8 * Math.sqrt(p.m1), 30 + 8 * Math.sqrt(p.m2)], hs: [26 + 8 * Math.sqrt(p.m1), 26 + 8 * Math.sqrt(p.m2)], fills: ['--c1', '--c2'], walls: true });
        EM.text(cv.ctx, name + ' · ω = ' + EM.fix(w, 3) + ' rad/s (animación con frecuencia relativa)', 10, 16, { size: 11.5, color: '--ink-2' });
      });
      const fr = (r) => (Math.abs(r) > 1e6 ? '∞ (sólo se mueve la 2)' : EM.fix(r, 3));
      sim.set('w1', EM.fix(md[0][0], 3) + ' rad/s · ' + fr(md[0][1]));
      sim.set('w2', EM.fix(md[1][0], 3) + ' rad/s · ' + fr(md[1][1]));
      const o = Math.abs(md[0][1]) < 1e6 && Math.abs(md[1][1]) < 1e6 ? p.m1 + p.m2 * md[0][1] * md[1][1] : 0;
      sim.set('orth', EM.fix(o, 6));
    });
  });

  /* ======================================================================
     9.4 Absorbedor dinámico
     ====================================================================== */
  EM.defineSim('vibration-absorber', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.85 });
    const cp = sim.canvas({ aspect: 0.85 });
    sim.group('Máquina');
    sim.note('<i>M</i> = 1, <i>K</i> = 1 (frecuencia propia 1), amortiguamiento propio 0.02.');
    sim.slider('w', { label: 'Frecuencia de excitación <i>ω</i>', min: 0.3, max: 2, step: 0.002, value: 1, fmt: f3 });
    sim.group('Absorbedor');
    sim.check('on', { label: 'Instalar absorbedor', value: true });
    sim.slider('mu', { label: 'Razón de masas <i>m</i><sub>a</sub>/<i>M</i>', min: 0.01, max: 0.5, step: 0.01, value: 0.1, fmt: f2 });
    sim.slider('wa', { label: 'Sintonía √(<i>k<sub>a</sub></i>/<i>m<sub>a</sub></i>)', min: 0.5, max: 1.5, step: 0.005, value: 1, fmt: f3 });
    sim.slider('za', { label: 'Amortiguamiento del absorbedor <i>ζ<sub>a</sub></i>', min: 0, max: 0.3, step: 0.005, value: 0.01, fmt: f3 });
    sim.out('X', 'Amplitud de la máquina / (<i>F</i><sub>0</sub>/<i>K</i>)', { hl: true });
    sim.out('Xa', 'Amplitud del absorbedor');
    /* respuesta compleja del sistema 2 GDL */
    const solve = (w) => {
      const p = sim.p;
      const c1 = 0.04; /* 2ζω₀ con ζ = 0.02 */
      if (!p.on) { const d = [1 - w * w, c1 * w]; const m = d[0] * d[0] + d[1] * d[1]; return [[d[0] / m, -d[1] / m], [0, 0]]; }
      const ma = p.mu, ka = ma * p.wa * p.wa, ca = 2 * p.za * ma * p.wa;
      /* [K1+ka − w² + i w(c1+ca), −(ka + i w ca); −(ka + i w ca), ka − ma w² + i w ca] [X;Xa] = [1;0] */
      const A = [1 + ka - w * w, w * (c1 + ca)], B = [-ka, -w * ca], D = [ka - ma * w * w, w * ca];
      const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
      const div = (a, b) => { const m = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m]; };
      const det = sub(mul(A, D), mul(B, B));
      const X = div(D, det), Xa = div([-B[0], -B[1]], det);
      return [X, Xa];
    };
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p;
      const [X, Xa] = solve(p.w);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      EM.draw.clear(cs);
      const ph = 2 * Math.PI * 0.7 * t;
      const sc = 7;
      const xm = sc * Math.min(4, Math.hypot(X[0], X[1])) * Math.cos(ph + Math.atan2(X[1], X[0]));
      const xa = sc * Math.min(6, Math.hypot(Xa[0], Xa[1])) * Math.cos(ph + Math.atan2(Xa[1], Xa[0]));
      const yM = H * 0.38 - xm, yA = H * 0.74 - xa;
      ctx.fillStyle = EM.alpha('--ink-3', 0.4); ctx.fillRect(W * 0.15, 8, W * 0.7, 8);
      EM.draw.spring(ctx, W * 0.5, 16, W * 0.5, yM - 30, { coils: 7, r: 9 });
      EM.draw.block(ctx, W * 0.5, yM, W * 0.5, 56, { label: 'máquina', fill: '--c1' });
      EM.draw.arrow(ctx, W * 0.82, yM, W * 0.82, yM - 26 * Math.cos(ph), { color: '--c2', width: 2.4 });
      if (p.on) {
        EM.draw.spring(ctx, W * 0.5, yM + 28, W * 0.5, yA - 16, { coils: 6, r: 7, color: '--c3' });
        EM.draw.block(ctx, W * 0.5, yA, 60 + 80 * p.mu, 30, { label: 'absorbedor', fill: '--c3', size: 11 });
      }
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.3, xmax: 2, ymin: 0.01, ymax: 40, ylog: true, xlabel: 'ω / ω₀', ylabel: 'X / (F₀/K)', ml: 52 });
      pl.frame();
      const on = p.on;
      p.on = false; pl.fn((w) => { const r = solve(w)[0]; return Math.hypot(r[0], r[1]); }, { color: '--grid-2', width: 1.4, n: 600 }); p.on = on;
      pl.fn((w) => { const r = solve(w)[0]; return Math.hypot(r[0], r[1]); }, { color: '--c1', width: 2.2, n: 900 });
      if (p.on) pl.vline(p.wa, { color: '--c3', label: 'sintonía' });
      pl.dot(p.w, Math.hypot(X[0], X[1]), { color: '--accent', r: 6 });
      sim.set('X', EM.fix(Math.hypot(X[0], X[1]), 4));
      sim.set('Xa', p.on ? EM.fix(Math.hypot(Xa[0], Xa[1]), 3) : '—');
    });
  });

  /* ======================================================================
     9.5 Molécula triatómica lineal
     ====================================================================== */
  EM.defineSim('triatomic', function (sim) {
    const cv = sim.canvas({ aspect: 3, cls: 'fixed' });
    sim.slider('mo', { label: 'Masa de los extremos', min: 1, max: 40, step: 1, value: 16, unit: 'u', fmt: (v) => v.toFixed(0) });
    sim.slider('mc', { label: 'Masa central', min: 1, max: 40, step: 1, value: 12, unit: 'u', fmt: (v) => v.toFixed(0) });
    sim.seg('mode', { label: 'Modo', options: [['tr', 'Traslación'], ['s', 'Simétrico'], ['a', 'Asimétrico'], ['mix', 'Mezcla']], value: 'a' });
    sim.out('r', '<i>ω<sub>a</sub></i>/<i>ω<sub>s</sub></i>', { hl: true });
    sim.out('ir', 'Momento dipolar oscilante');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ws = 1, wa = Math.sqrt(1 + (2 * p.mo) / p.mc);
      const ctx = cv.ctx, W = cv.w, H = cv.h, y = H / 2;
      EM.draw.clear(cv);
      const A = 18;
      let d;
      const cs = Math.cos(2.4 * ws * t), ca = Math.cos(2.4 * wa * t);
      if (p.mode === 'tr') d = [1, 1, 1].map((v) => v * 0.8 * A * Math.sin(1.5 * t));
      else if (p.mode === 's') d = [-A * cs, 0, A * cs];
      else if (p.mode === 'a') { const r = (-2 * p.mo) / p.mc; d = [A * ca, A * r * ca, A * ca]; }
      else { const r = (-2 * p.mo) / p.mc; d = [-A * cs + A * 0.6 * ca, A * 0.6 * r * ca, A * cs + A * 0.6 * ca]; }
      const xs = [W * 0.3, W * 0.5, W * 0.7];
      const pos = xs.map((x, i) => x + d[i]);
      EM.draw.spring(ctx, pos[0] + 16, y, pos[1] - 18, y, { coils: 6, r: 6, lead: 3 });
      EM.draw.spring(ctx, pos[1] + 18, y, pos[2] - 16, y, { coils: 6, r: 6, lead: 3 });
      const rad = (m) => 10 + 2.2 * Math.sqrt(m);
      EM.draw.bob(ctx, pos[0], y, rad(p.mo), { color: '--c2', label: 'O' });
      EM.draw.bob(ctx, pos[1], y, rad(p.mc), { color: '--ink-2', label: 'C' });
      EM.draw.bob(ctx, pos[2], y, rad(p.mo), { color: '--c2', label: 'O' });
      xs.forEach((x) => { ctx.strokeStyle = EM.col('--grid-2'); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, y - 50); ctx.lineTo(x, y + 50); ctx.stroke(); ctx.setLineDash([]); });
      sim.set('r', EM.fix(wa, 4) + (p.mo === 16 && p.mc === 12 ? ' (medido en CO₂: 1.69)' : ''));
      sim.set('ir', p.mode === 'a' || p.mode === 'mix' ? 'sí: absorbe infrarrojo' : p.mode === 's' ? 'no (simétrico)' : 'no');
    });
  });
})();
