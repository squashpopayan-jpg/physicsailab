/* Capítulo 7 — Superposición de oscilaciones */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     7.1 Batimientos
     ====================================================================== */
  EM.defineSim('beats', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1 });
    const cv = sim.canvas({ aspect: 1 });
    sim.slider('f1', { label: 'Frecuencia <i>f</i><sub>1</sub>', min: 200, max: 600, step: 0.5, value: 440, unit: 'Hz', fmt: (v) => EM.fix(v, 1) });
    sim.slider('f2', { label: 'Frecuencia <i>f</i><sub>2</sub>', min: 200, max: 600, step: 0.5, value: 443, unit: 'Hz', fmt: (v) => EM.fix(v, 1) });
    sim.slider('A2', { label: 'Amplitud relativa <i>A</i><sub>2</sub>/<i>A</i><sub>1</sub>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    EM.listenButton(sim, () => ({ fn: (t) => Math.sin(2 * Math.PI * sim.p.f1 * t) + sim.p.A2 * Math.sin(2 * Math.PI * sim.p.f2 * t), dur: 4 }), { label: '♪ Escuchar ambos' });
    EM.listenButton(sim, () => ({ fn: (t) => Math.sin(2 * Math.PI * sim.p.f1 * t), dur: 1.2 }), { label: '♪ Sólo f₁' });
    sim.out('fb', 'Frecuencia de batimiento |<i>f</i><sub>1</sub> − <i>f</i><sub>2</sub>|', { hl: true });
    sim.out('Tb', 'Período de batimiento');
    sim.out('fm', 'Frecuencia media');
    sim.out('perc', 'Percepción');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, fb = Math.abs(p.f1 - p.f2);
      /* fasores: en el marco que gira con f1, el fasor 2 gira con f2 − f1 (ralentizado si es rápido) */
      const slow = fb > 3 ? 3 / fb : 1;
      const dphi = 2 * Math.PI * (p.f2 - p.f1) * t * slow;
      EM.draw.clear(cf);
      const ctx = cf.ctx, W = cf.w, H = cf.h, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.2;
      EM.complexAxes(ctx, cx, cy, R * 2.3);
      const a = [cx + R, cy], b = [a[0] + p.A2 * R * Math.cos(dphi), a[1] - p.A2 * R * Math.sin(dphi)];
      EM.draw.arrow(ctx, cx, cy, a[0], a[1], { color: '--c1', width: 2.4 });
      EM.draw.arrow(ctx, a[0], a[1], b[0], b[1], { color: '--c2', width: 2.4 });
      EM.draw.arrow(ctx, cx, cy, b[0], b[1], { color: '--accent', width: 3 });
      ctx.strokeStyle = EM.col('--grid-2'); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(a[0], a[1], p.A2 * R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'marco que gira con f₁' + (slow < 1 ? ' (ralentizado)' : ''), 10, H - 10, { size: 11, color: '--ink-3' });
      EM.draw.clear(cv);
      const span = fb > 0.3 ? Math.min(2.5 / fb, 1) : 1;
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: span * 1000, ymin: -2.2, ymax: 2.2, xlabel: 't (ms)', ylabel: 'x / A₁', ml: 52 });
      pl.frame();
      const x = (tm) => Math.cos(2 * Math.PI * p.f1 * tm / 1000) + p.A2 * Math.cos(2 * Math.PI * p.f2 * tm / 1000);
      pl.fn(x, { color: '--accent', width: 1, n: 3000 });
      const env = (tm) => Math.sqrt(1 + p.A2 * p.A2 + 2 * p.A2 * Math.cos(2 * Math.PI * (p.f1 - p.f2) * tm / 1000));
      pl.fn(env, { color: '--c1', width: 1.6, dash: [5, 4] });
      pl.fn((tm) => -env(tm), { color: '--c1', width: 1.6, dash: [5, 4] });
      sim.set('fb', EM.fix(fb, 2) + ' Hz');
      sim.set('Tb', fb > 0 ? EM.si(1 / fb, 's') : '∞');
      sim.set('fm', EM.fix((p.f1 + p.f2) / 2, 2) + ' Hz');
      sim.set('perc', fb < 0.1 ? 'un solo tono estable' : fb < 15 ? 'un tono que late (batimientos)' : fb < 40 ? 'aspereza (rugosidad)' : 'dos tonos distintos');
    });
  });

  /* ======================================================================
     7.2 Modulación de amplitud
     ====================================================================== */
  EM.defineSim('am-modulation', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.15 });
    const cs = sim.canvas({ aspect: 1.15 });
    sim.slider('fc', { label: 'Portadora <i>f<sub>c</sub></i>', min: 200, max: 2000, step: 10, value: 800, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('fm', { label: 'Moduladora <i>f<sub>m</sub></i>', min: 1, max: 200, step: 1, value: 40, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('mu', { label: 'Índice de modulación <i>μ</i>', min: 0, max: 1.5, step: 0.01, value: 0.7, fmt: f2 });
    EM.listenButton(sim, () => ({ fn: (t) => (1 + sim.p.mu * Math.cos(2 * Math.PI * sim.p.fm * t)) * Math.cos(2 * Math.PI * sim.p.fc * t), dur: 2 }));
    sim.out('sb', 'Bandas laterales', { hl: true });
    sim.out('bw', 'Ancho de banda 2<i>f<sub>m</sub></i>');
    sim.out('ov', 'Estado');
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(ct);
      const T = 2 / p.fm;
      const pl = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: T * 1000, ymin: -2.7, ymax: 2.7, xlabel: 't (ms)', ylabel: 'señal', ml: 52 });
      pl.frame();
      pl.fn((tm) => (1 + p.mu * Math.cos(2 * Math.PI * p.fm * tm / 1000)) * Math.cos(2 * Math.PI * p.fc * tm / 1000), { color: '--accent', width: 1, n: 3000 });
      pl.fn((tm) => 1 + p.mu * Math.cos(2 * Math.PI * p.fm * tm / 1000), { color: '--c1', width: 1.6, dash: [5, 4] });
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: p.fc - 250, xmax: p.fc + 250, ymin: 0, ymax: 1.2, xlabel: 'frecuencia (Hz)', ylabel: 'amplitud', ml: 52 });
      ps.frame();
      const lines = [[p.fc, 1, '--c1'], [p.fc - p.fm, p.mu / 2, '--accent'], [p.fc + p.fm, p.mu / 2, '--accent']];
      lines.forEach(([f, a, c]) => { cs.ctx.strokeStyle = EM.col(c); cs.ctx.lineWidth = 3; cs.ctx.beginPath(); cs.ctx.moveTo(ps.X(f), ps.Y(0)); cs.ctx.lineTo(ps.X(f), ps.Y(a)); cs.ctx.stroke(); ps.dot(f, a, { color: c, r: 4 }); });
      ps.label(p.fc, 1.08, 'portadora', { align: 'center', color: '--c1' });
      sim.set('sb', EM.fix(p.fc - p.fm, 0) + ' Hz y ' + EM.fix(p.fc + p.fm, 0) + ' Hz');
      sim.set('bw', EM.fix(2 * p.fm, 0) + ' Hz');
      sim.set('ov', p.mu > 1 ? 'sobremodulación: la envolvente se invierte' : 'modulación correcta');
    });
  });

  /* ======================================================================
     7.3 Suma de N fasores
     ====================================================================== */
  EM.defineSim('n-phasors', function (sim) {
    sim.cols2();
    const cf = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.slider('N', { label: 'Número de oscilaciones <i>N</i>', min: 2, max: 30, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Desfase entre vecinas <i>δ</i>', min: -360, max: 360, step: 0.5, value: 20, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.seg('y', { label: 'Gráfica', options: [['A', 'Amplitud'], ['I', 'Intensidad']], value: 'I' });
    sim.out('A', 'Amplitud resultante / <i>A</i>', { hl: true });
    sim.out('I', 'Intensidad / intensidad de una');
    sim.out('z', 'Primer cero en <i>δ</i> = 360°/<i>N</i>');
    sim.onDraw(() => {
      const p = sim.p, d = M.rad(p.d), N = p.N;
      EM.draw.clear(cf);
      const ctx = cf.ctx, W = cf.w, H = cf.h;
      const R = (Math.min(W, H) * 0.8) / N;
      let x = 0, y = 0;
      const pts = [[0, 0]];
      for (let n = 0; n < N; n++) { x += Math.cos(n * d); y += Math.sin(n * d); pts.push([x, y]); }
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
      const S = (q) => [W / 2 + (q[0] - mx) * R, H / 2 - (q[1] - my) * R];
      for (let n = 0; n < N; n++) { const a = S(pts[n]), b = S(pts[n + 1]); EM.draw.arrow(ctx, a[0], a[1], b[0], b[1], { color: EM.mix('--c1', '--c5', n / Math.max(1, N - 1)), width: 2, head: Math.min(10, R * 0.35) }); }
      const a = S(pts[0]), b = S(pts[N]);
      EM.draw.arrow(ctx, a[0], a[1], b[0], b[1], { color: '--accent', width: 3 });
      const amp = Math.hypot(x, y);
      EM.draw.clear(cp);
      const isI = p.y === 'I';
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -360, xmax: 360, ymin: 0, ymax: isI ? N * N * 1.08 : N * 1.08, xlabel: 'δ (°)', ylabel: isI ? 'I / I₁' : 'A / A₁', ml: 52, xticks: [-360, -180, 0, 180, 360] });
      pl.frame();
      const f = (dd) => { const r = M.rad(dd); const s = Math.abs(Math.sin(r / 2)) < 1e-9 ? N : Math.abs(Math.sin((N * r) / 2) / Math.sin(r / 2)); return isI ? s * s : s; };
      pl.fn(f, { color: '--c1', width: 2, n: 1600 });
      pl.dot(p.d, isI ? amp * amp : amp, { color: '--accent', r: 6 });
      sim.set('A', EM.fix(amp, 3));
      sim.set('I', EM.fix(amp * amp, 3) + ' (máximo N² = ' + N * N + ')');
      sim.set('z', EM.fix(360 / N, 2) + '°');
    });
  });

  /* ======================================================================
     7.4 Lissajous
     ====================================================================== */
  EM.defineSim('lissajous', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cs = sim.canvas({ aspect: 1 });
    sim.group('Frecuencias');
    sim.slider('wx', { label: '<i>ω<sub>x</sub></i> (relativa)', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('wy', { label: '<i>ω<sub>y</sub></i> (relativa)', min: 1, max: 6, step: 0.005, value: 2, fmt: (v) => EM.fix(v, 3) });
    sim.group('Fase y amplitudes');
    sim.slider('phi', { label: 'Desfase <i>ϕ</i>', min: 0, max: 360, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('Ay', { label: '<i>A<sub>y</sub></i>/<i>A<sub>x</sub></i>', min: 0.2, max: 1.5, step: 0.05, value: 1, fmt: f2 });
    sim.button('1:1', () => { sim.ctl.wx.set(1, true); sim.ctl.wy.set(1); });
    sim.button('1:2', () => { sim.ctl.wx.set(1, true); sim.ctl.wy.set(2); });
    sim.button('2:3', () => { sim.ctl.wx.set(2, true); sim.ctl.wy.set(3); });
    sim.button('3:4', () => { sim.ctl.wx.set(3, true); sim.ctl.wy.set(4); });
    sim.button('Desafinar', () => sim.ctl.wy.set(sim.p.wy + 0.01));
    sim.out('r', 'Razón <i>ω<sub>y</sub></i>/<i>ω<sub>x</sub></i>', { hl: true });
    sim.out('cl', 'Curva');
    let t = 0;
    sim.animate((dt) => { t += dt * 1.2; });
    sim.onDraw(() => {
      const p = sim.p, ph = M.rad(p.phi);
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, R = Math.min(W, H) * 0.4 / Math.max(1, p.Ay);
      const cx = W / 2, cy = H / 2;
      ctx.strokeStyle = EM.col('--grid-2');
      ctx.strokeRect(cx - R, cy - R * p.Ay, 2 * R, 2 * R * p.Ay);
      const pts = [];
      const tt = (2 * Math.PI * 1) / 1;
      const closed = Math.abs(p.wy - Math.round(p.wy * 4) / 4) < 1e-9;
      const span = closed ? 8 * Math.PI : 20 * Math.PI;
      const t0 = t - span;
      for (let i = 0; i <= 2000; i++) { const u = t0 + (span * i) / 2000; pts.push([cx + R * Math.cos(p.wx * u), cy - R * p.Ay * Math.cos(p.wy * u + ph)]); }
      EM.draw.poly(ctx, pts, { color: '--c1', width: 1.6, alpha: 0.85 });
      EM.draw.bob(ctx, cx + R * Math.cos(p.wx * t), cy - R * p.Ay * Math.cos(p.wy * t + ph), 6, { color: '--accent' });
      void tt;
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 4 * Math.PI, ymin: -2.6, ymax: 2.6, xpi: true, xlabel: 'ω t', ylabel: 'señales', ml: 52 });
      ps.frame();
      ps.fn((u) => 1.2 + Math.cos(p.wx * u), { color: '--c3', width: 1.8 });
      ps.fn((u) => -1.2 + p.Ay * Math.cos(p.wy * u + ph), { color: '--c5', width: 1.8 });
      ps.label(0.2, 2.35, 'x(t)', { color: '--c3' });
      ps.label(0.2, -0.05, 'y(t)', { color: '--c5' });
      const r = p.wy / p.wx;
      sim.set('r', EM.fix(r, 4));
      sim.set('cl', closed ? 'cerrada (razón racional sencilla)' : 'no se cierra: la figura gira lentamente');
    });
  });

  /* ======================================================================
     7.5 Armonógrafo
     ====================================================================== */
  EM.defineSim('harmonograph', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.group('Péndulo x');
    sim.slider('f1', { label: 'Frecuencia', min: 1, max: 4, step: 0.001, value: 2, fmt: (v) => EM.fix(v, 3) });
    sim.slider('p1', { label: 'Fase', min: 0, max: 360, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Péndulo y');
    sim.slider('f2', { label: 'Frecuencia', min: 1, max: 4, step: 0.001, value: 3.006, fmt: (v) => EM.fix(v, 3) });
    sim.slider('p2', { label: 'Fase', min: 0, max: 360, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Péndulo rotatorio');
    sim.slider('f3', { label: 'Frecuencia', min: 0, max: 4, step: 0.001, value: 1.002, fmt: (v) => EM.fix(v, 3) });
    sim.slider('a3', { label: 'Amplitud', min: 0, max: 1, step: 0.01, value: 0.35, fmt: f2 });
    sim.group('Amortiguamiento');
    sim.slider('g', { label: 'γ', min: 0.0005, max: 0.02, step: 0.0005, value: 0.004, fmt: (v) => EM.fix(v, 4) });
    sim.button('Aleatorio', () => {
      const r = (a, b) => a + Math.random() * (b - a);
      const base = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
      sim.ctl.f1.set(base, true);
      sim.ctl.f2.set([1, 2, 3, 4][Math.floor(Math.random() * 4)] + r(-0.01, 0.01), true);
      sim.ctl.f3.set(r(0, 1) < 0.5 ? 0 : base + r(-0.01, 0.01), true);
      sim.ctl.p1.set(Math.round(r(0, 360)), true); sim.ctl.p2.set(Math.round(r(0, 360)), true);
      sim.ctl.a3.set(r(0, 0.6), true); sim.ctl.g.set(r(0.002, 0.008));
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const R = Math.min(W, H) * 0.32, cx = W / 2, cy = H / 2;
      const pts = [];
      const n = 9000, T = 600;
      for (let i = 0; i <= n; i++) {
        const t = (T * i) / n, e = Math.exp(-p.g * t), w = 2 * Math.PI * 0.05;
        const x = e * (Math.sin(w * p.f1 * t + M.rad(p.p1)) + p.a3 * Math.sin(w * p.f3 * t));
        const y = e * (Math.sin(w * p.f2 * t + M.rad(p.p2)) + p.a3 * Math.cos(w * p.f3 * t));
        pts.push([cx + R * x, cy - R * y]);
      }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 0.7, alpha: 0.75 });
    });
  });
})();
