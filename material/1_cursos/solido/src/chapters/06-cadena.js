/* Capítulo 6 — La cadena lineal */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;
  const PI = Math.PI;

  /* 6.1 Cadena monoatómica */
  EM.defineSim('cadena1', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('k', { label: 'Número de onda k (unidades de π/a)', min: -2, max: 2, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.check('cont', { label: 'Onda continua y su alias', value: true });
    sim.slider('sp', { label: 'Velocidad de la animación', min: 0.1, max: 2, step: 0.05, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.out('w', 'ω/ω_{máx}', { hl: true });
    sim.out('kr', 'k reducido a la primera zona');
    sim.out('v', 'Velocidad de fase y de grupo (en v_s)');
    let t = 0;
    sim.animate((dt) => { t += dt * sim.p.sp; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.k * PI, w = Math.abs(Math.sin(k / 2)); /* ω/ωmax con a = 1 */
      const kr = Math.atan2(Math.sin(k), Math.cos(k));
      const hTop = H * 0.45, n = 22, x0 = 30, dx = (W - 60) / (n - 1), y0 = hTop / 2 + 6, A = hTop * 0.32;
      const ph = 2 * PI * t;
      if (p.cont) {
        for (const [kk, col, dash] of [[k, '--c2', []], [kr, '--c3', [5, 4]]]) {
          if (kk === k && Math.abs(kr - k) < 1e-9 && dash.length) continue;
          ctx.save(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 1.3; ctx.setLineDash(dash); ctx.beginPath();
          for (let i = 0; i <= 600; i++) { const xx = (i / 600) * (n - 1), y = y0 - A * Math.cos(kk * xx - ph * w); i ? ctx.lineTo(x0 + xx * dx, y) : ctx.moveTo(x0 + xx * dx, y); }
          ctx.stroke(); ctx.restore();
        }
      }
      ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.lineWidth = 1;
      let prev = null;
      for (let j = 0; j < n; j++) {
        const y = y0 - A * Math.cos(k * j - ph * w), x = x0 + j * dx;
        if (prev) D.spring(ctx, prev[0], prev[1], x, y, { amp: 3, n: 4 });
        prev = [x, y];
      }
      for (let j = 0; j < n; j++) D.ball(ctx, x0 + j * dx, y0 - A * Math.cos(k * j - ph * w), 7, '--c1');
      const pl = new EM.Plot(ctx, { x: 0, y: hTop, w: W, h: H - hTop, xmin: -2, xmax: 2, ymin: 0, ymax: 1.15, xlabel: 'k (unidades de π/a)', ylabel: 'ω/ω_{máx}' });
      pl.frame();
      pl.band(-1, 1, { color: '--accent', alpha: 0.07 });
      pl.fn((x) => Math.abs(Math.sin((x * PI) / 2)), { color: '--c1', width: 2.4 });
      pl.fn((x) => Math.abs(x * PI) / 2, { color: '--ink-3', width: 1.2, dash: [4, 4], to: 0.73, from: -0.73 });
      pl.vline(-1, { color: '--ink-3' }); pl.vline(1, { color: '--ink-3' });
      pl.dot(p.k, w, { color: '--c2', r: 6 });
      if (Math.abs(kr - k) > 1e-9) pl.dot(kr / PI, w, { color: '--c3', r: 5 });
      pl.label(-0.98, 1.08, 'primera zona de Brillouin', { size: 11, color: '--accent' });
      sim.set('w', EM.fix(w, 4));
      sim.set('kr', EM.fix(kr / PI, 3) + ' π/a' + (Math.abs(kr - k) > 1e-9 ? ' (alias de ' + EM.fix(p.k, 2) + ' π/a)' : ''));
      const vph = Math.abs(k) > 1e-6 ? (2 * w) / Math.abs(k) : 1;
      sim.set('v', EM.fix(vph, 3) + ' y ' + EM.fix(Math.abs(Math.cos(kr / 2)), 3));
    });
  });

  /* 6.2 Paquete de ondas */
  EM.defineSim('paquete-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('k0', { label: 'Número de onda central k₀ (π/a)', min: 0.05, max: 0.98, step: 0.01, value: 0.35, fmt: (v) => v.toFixed(2) });
    sim.slider('s', { label: 'Anchura inicial (átomos)', min: 6, max: 40, step: 1, value: 18, fmt: (v) => v.toFixed(0) });
    sim.out('vg', 'v_g teórica (a√(K/m))', { hl: true });
    sim.out('vm', 'Velocidad medida del centro de energía');
    sim.out('t', 'Tiempo (unidades de √(m/K))');
    const N = 400, dt = 0.05;
    let u, v, t, hist;
    const init = () => {
      const k0 = sim.p.k0 * PI, s = sim.p.s, n0 = 90, w0 = 2 * Math.abs(Math.sin(k0 / 2));
      u = new Float64Array(N); v = new Float64Array(N); t = 0; hist = [];
      for (let n = 0; n < N; n++) { const g = Math.exp(-Math.pow((n - n0) / s, 2) / 2); u[n] = g * Math.cos(k0 * n); v[n] = g * w0 * Math.sin(k0 * n); }
    };
    const acc = (i) => (i > 0 ? u[i - 1] : 0) + (i < N - 1 ? u[i + 1] : 0) - 2 * u[i];
    const center = () => { let s = 0, w = 0; for (let i = 0; i < N - 1; i++) { const e = 0.5 * v[i] * v[i] + 0.5 * Math.pow(u[i + 1] - u[i], 2); s += i * e; w += e; } return s / w; };
    init();
    sim.onChange = () => init();
    sim.resetButton(init);
    sim.animate((ft) => {
      const steps = Math.round((ft * 60) / 3);
      for (let s = 0; s < Math.max(1, steps) * 4; s++) {
        if (t > 2000) break;
        const a = new Float64Array(N);
        for (let i = 0; i < N; i++) a[i] = acc(i);
        for (let i = 0; i < N; i++) { v[i] += 0.5 * dt * a[i]; u[i] += dt * v[i]; }
        for (let i = 0; i < N; i++) v[i] += 0.5 * dt * acc(i);
        t += dt;
      }
      hist.push([t, center()]);
      if (hist.length > 4000) hist.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k0 = p.k0 * PI;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: N, ymin: -1.3, ymax: 1.3, xlabel: 'átomo n', ylabel: 'desplazamiento u_n' });
      pl.frame();
      pl.xy(Array.from({ length: N }, (_, i) => i), Array.from(u), { color: '--c1', width: 1.3 });
      const c = center();
      pl.vline(c, { color: '--c2', dash: [], width: 1.6, label: 'centro de energía' });
      const vg = Math.cos(k0 / 2);
      let vm = NaN;
      if (hist.length > 10) {
        const a = hist[Math.floor(hist.length / 5)], b = hist[hist.length - 1];
        if (b[0] - a[0] > 5) vm = (b[1] - a[1]) / (b[0] - a[0]);
      }
      sim.set('vg', EM.fix(vg, 4));
      sim.set('vm', isFinite(vm) ? EM.fix(vm, 4) : 'midiendo…');
      sim.set('t', EM.fix(t, 1));
    });
  });

  /* 6.3 Cadena diatómica */
  EM.defineSim('cadena2', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('m2', { label: 'Razón de masas m₂/m₁', min: 0.2, max: 1, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('K2', { label: 'Razón de resortes K₂/K₁', min: 0.2, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('k', { label: 'Número de onda k (π/a)', min: 0, max: 1, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.seg('br', { label: 'Rama', options: [['a', 'Acústica'], ['o', 'Óptica']], value: 'o' });
    sim.out('w', 'Frecuencia (√(K₁/m₁))', { hl: true });
    sim.out('gap', 'Brecha en el borde de zona');
    sim.out('r', 'Amplitudes u₂/u₁');
    let t = 0;
    sim.animate((dt) => { t += dt * 0.5; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const K1 = 1, K2 = p.K2, m1 = 1, m2 = p.m2, k = p.k * PI;
      const [wa, wo] = SS.chain2(k, K1, K2, m1, m2);
      const w = p.br === 'a' ? wa : wo;
      /* autovector */
      const c = { re: K1 + K2 * Math.cos(k), im: -K2 * Math.sin(k) }, A = K1 + K2 - m1 * w * w;
      let r;
      if (Math.hypot(c.re, c.im) < 1e-9) r = Math.abs(K1 + K2 - m1 * w * w) < 1e-9 ? { re: 0, im: 0, one: 1 } : { re: 1e9, im: 0, zero1: true };
      else { const d = c.re * c.re + c.im * c.im; r = { re: (A * c.re) / d, im: (-A * c.im) / d }; }
      let a1 = 1, a2 = Math.hypot(r.re, r.im), ph2 = Math.atan2(r.im, r.re);
      if (r.zero1) { a1 = 0; a2 = 1; ph2 = 0; }
      const mx = Math.max(a1, a2);
      a1 /= mx; a2 /= mx;
      const hTop = H * 0.42, nc = 9, dx = (W - 60) / nc, y0 = hTop / 2 + 4, amp = dx * 0.22;
      const om = w > 0 ? w : 0;
      const pos = [];
      for (let j = 0; j < nc; j++) {
        pos.push([30 + j * dx + amp * a1 * Math.cos(k * j - 2 * PI * om * t), 1]);
        pos.push([30 + (j + 0.5) * dx + amp * a2 * Math.cos(k * j + ph2 - 2 * PI * om * t), 2]);
      }
      for (let i = 1; i < pos.length; i++) D.spring(ctx, pos[i - 1][0], y0, pos[i][0], y0, { amp: 4, n: 4, color: i % 2 ? '--ink-3' : '--c5' });
      for (const [x, s] of pos) D.ball(ctx, x, y0, s === 1 ? 11 : 11 * Math.cbrt(m2), s === 1 ? '--c1' : '--c2');
      EM.text(ctx, 'm₁', 30, y0 + 28, { size: 12, color: '--c1', align: 'center' });
      EM.text(ctx, 'm₂', 30 + dx / 2, y0 + 28, { size: 12, color: '--c2', align: 'center' });
      const pl = new EM.Plot(ctx, { x: 0, y: hTop, w: W, h: H - hTop, xmin: 0, xmax: 1, ymin: 0, ymax: Math.sqrt((K1 + K2) * (1 / m1 + 1 / m2)) * 1.12, xlabel: 'k (π/a)', ylabel: 'ω (√(K₁/m₁))' });
      pl.frame();
      pl.fn((x) => SS.chain2(x * PI, K1, K2, m1, m2)[0], { color: '--c1', width: 2.4 });
      pl.fn((x) => SS.chain2(x * PI, K1, K2, m1, m2)[1], { color: '--c2', width: 2.4 });
      const [ga, go] = SS.chain2(PI, K1, K2, m1, m2);
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.1); ctx.fillRect(pl.ix, pl.Y(go), pl.iw, pl.Y(ga) - pl.Y(go)); ctx.restore();
      pl.dot(p.k, w, { color: '--accent', r: 6 });
      sim.set('w', EM.fix(w, 4));
      sim.set('gap', go - ga > 1e-6 ? 'de ' + EM.fix(ga, 3) + ' a ' + EM.fix(go, 3) : 'cerrada');
      sim.set('r', r.zero1 ? 'solo se mueve m₂' : EM.fix(Math.hypot(r.re, r.im), 3) + ' con desfase ' + EM.fix((ph2 * 180) / PI, 1) + '°');
    });
  });

  /* 6.4 Vecinos lejanos */
  EM.defineSim('cadenaN', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('K2', { label: 'K₂/K₁ (segundos vecinos)', min: -0.5, max: 1, step: 0.01, value: 0.2, fmt: (v) => v.toFixed(2) });
    sim.slider('K3', { label: 'K₃/K₁ (terceros vecinos)', min: -0.5, max: 1, step: 0.01, value: -0.05, fmt: (v) => v.toFixed(2) });
    sim.out('vs', 'Velocidad del sonido (a√(K₁/m))', { hl: true });
    sim.out('st', 'Estabilidad');
    sim.out('fit', 'K_p recuperados por Fourier');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Ks = [1, p.K2, p.K3];
      const w2 = (k) => { let s = 0; Ks.forEach((K, i) => { s += 2 * K * (1 - Math.cos((i + 1) * k)); }); return s; };
      const wl = W * 0.68;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1, ymin: -1, ymax: 3.6, xlabel: 'k (π/a)', ylabel: 'ω (√(K₁/m)); negativo: imaginaria' });
      pl.frame();
      pl.fn((x) => { const v = w2(x * PI); return v >= 0 ? Math.sqrt(v) : NaN; }, { color: '--c1', width: 2.4 });
      pl.fn((x) => { const v = w2(x * PI); return v < 0 ? -Math.sqrt(-v) : NaN; }, { color: '--c2', width: 2, dash: [5, 4] });
      pl.fn((x) => 2 * Math.sin((x * PI) / 2), { color: '--ink-3', width: 1.2, dash: [3, 3] });
      pl.legend([{ label: 'con K₂, K₃', color: '--c1' }, { label: 'solo K₁', color: '--ink-3', dash: [3, 3] }], 'tl');
      /* recuperación por Fourier: K_p = −(1/2π)∫ ω² cos(pk) dk (m = a = 1) */
      const rec = [1, 2, 3, 4].map((pp) => -EM.lin.gl((k) => w2(k) * Math.cos(pp * k), -PI, PI, 48, 4) / (2 * PI));
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0.4, xmax: 4.6, ymin: -0.6, ymax: 1.15, xticks: [1, 2, 3, 4], xlabel: 'vecino p', ylabel: 'K_p/K₁', ml: 44 });
      p2.frame();
      rec.forEach((K, i) => { const x0 = p2.X(i + 1 - 0.25), x1 = p2.X(i + 1 + 0.25); ctx.fillStyle = EM.alpha('--c3', 0.8); ctx.fillRect(x0, Math.min(p2.Y(0), p2.Y(K)), x1 - x0, Math.abs(p2.Y(K) - p2.Y(0))); });
      const vs = Math.sqrt(Ks.reduce((s, K, i) => s + (i + 1) * (i + 1) * K, 0));
      let neg = false;
      for (let i = 1; i <= 200; i++) if (w2((i / 200) * PI) < 0) neg = true;
      sim.set('vs', isFinite(vs) ? EM.fix(vs, 4) : 'imaginaria');
      sim.set('st', neg ? 'inestable: ω² < 0 en parte de la zona' : 'estable');
      sim.set('fit', rec.map((x) => EM.fix(x, 3)).join(', '));
    });
  });
})();
