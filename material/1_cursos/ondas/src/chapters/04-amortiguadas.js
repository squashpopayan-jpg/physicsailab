/* Capítulo 4 — Oscilaciones amortiguadas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Solución analítica de ẍ + γẋ + ω0²x = 0 con x(0)=x0, ẋ(0)=v0 → {x(t), v(t)} */
  function dampedSol(w0, g, x0, v0) {
    const a = -g / 2, disc = (g * g) / 4 - w0 * w0;
    if (Math.abs(disc) < 1e-10) {
      const c2 = v0 - a * x0;
      return { x: (t) => (x0 + c2 * t) * Math.exp(a * t), v: (t) => (c2 + a * (x0 + c2 * t)) * Math.exp(a * t) };
    }
    if (disc > 0) {
      const r = Math.sqrt(disc), s1 = a + r, s2 = a - r;
      const c2 = (v0 - s1 * x0) / (s2 - s1), c1 = x0 - c2;
      return { x: (t) => c1 * Math.exp(s1 * t) + c2 * Math.exp(s2 * t), v: (t) => c1 * s1 * Math.exp(s1 * t) + c2 * s2 * Math.exp(s2 * t) };
    }
    const wd = Math.sqrt(-disc), B = (v0 - a * x0) / wd;
    return {
      x: (t) => Math.exp(a * t) * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t)),
      v: (t) => Math.exp(a * t) * (a * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t)) + wd * (-x0 * Math.sin(wd * t) + B * Math.cos(wd * t))),
      env: Math.hypot(x0, B), wd
    };
  }
  EM.dampedSol = dampedSol;

  /* Dibujo de bloque con resorte y amortiguador */
  function drawMSD(ctx, W, H, x, sc, o = {}) {
    const xw = 30, xe = W * 0.5, y = H * 0.5;
    EM.draw.support(ctx, xw, y, H * 0.8, 'right');
    const bx = xe + x * sc;
    if (o.damper === false) {
      EM.draw.spring(ctx, xw, y, bx - 24, y, { coils: 10, r: 7 });
      ctx.fillStyle = EM.alpha('--c4', 0.25);
      ctx.fillRect(xw, y + 26, W - xw - 10, 8);
    } else {
      EM.draw.spring(ctx, xw, y - 14, bx - 24, y - 14, { coils: 10, r: 7 });
      EM.draw.damper(ctx, xw, y + 16, bx - 24, y + 16, { w: 8 });
    }
    EM.draw.block(ctx, bx, y, 48, 52, { label: 'm', italic: true, fill: o.fill });
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3');
    ctx.beginPath(); ctx.moveTo(xe, 6); ctx.lineTo(xe, H - 6); ctx.stroke(); ctx.restore();
  }
  EM.drawMSD = drawMSD;

  /* ======================================================================
     4.1 Los tres regímenes
     ====================================================================== */
  EM.defineSim('damped-regimes', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 4, cls: 'full fixed' });
    const cv = sim.canvas({ aspect: 1.25 });
    const cp = sim.canvas({ aspect: 1.25 });
    sim.group('Oscilador');
    sim.slider('w0', { label: 'Frecuencia natural <i>ω</i><sub>0</sub>', min: 0.5, max: 6, step: 0.05, value: 3, unit: 'rad/s', fmt: f2 });
    sim.slider('z', { label: 'Razón de amortiguamiento <i>ζ</i> = <i>γ</i>/2<i>ω</i><sub>0</sub>', min: 0, max: 3, step: 0.01, value: 0.15, fmt: f2 });
    sim.button('ζ = 0.1', () => sim.ctl.z.set(0.1));
    sim.button('Crítico', () => sim.ctl.z.set(1));
    sim.button('ζ = 2.5', () => sim.ctl.z.set(2.5));
    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: '<i>x</i><sub>0</sub>', min: -1, max: 1, step: 0.02, value: 1, fmt: f2 });
    sim.slider('v0', { label: '<i>v</i><sub>0</sub>', min: -10, max: 10, step: 0.1, value: 0, fmt: (v) => EM.fix(v, 1) });
    sim.resetButton(() => { t = 0; });
    sim.out('g', '<i>γ</i>');
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('wd', '<i>ω<sub>d</sub></i>');
    sim.out('Q', '<i>Q</i> = <i>ω</i><sub>0</sub>/<i>γ</i>');
    sim.out('roots', 'Raíces características');
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; if (t > 14) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, g = 2 * p.z * p.w0;
      const S = dampedSol(p.w0, g, p.x0, p.v0);
      EM.draw.clear(cs);
      drawMSD(cs.ctx, cs.w, cs.h, S.x(t), cs.w * 0.25);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 14, ymin: -1.4, ymax: 1.4, xlabel: 't (s)', ylabel: 'x', ml: 52 });
      pl.frame();
      if (S.env) { pl.fn((tt) => S.env * Math.exp(-g * tt / 2), { color: '--ink-3', width: 1, dash: [4, 4] }); pl.fn((tt) => -S.env * Math.exp(-g * tt / 2), { color: '--ink-3', width: 1, dash: [4, 4] }); }
      pl.fn(S.x, { color: '--grid-2', width: 1.5 });
      pl.fn(S.x, { color: '--accent', width: 2.2, to: t });
      pl.dot(t, S.x(t), { color: '--accent' });
      EM.draw.clear(cp);
      const vm = Math.max(1.5, p.w0 * 1.4);
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -1.4, xmax: 1.4, ymin: -vm, ymax: vm, xlabel: 'x', ylabel: 'v', ml: 52 });
      pp.frame();
      const ts = EM.M.linspace(0, 14, 700);
      pp.xy(ts.map(S.x), ts.map(S.v), { color: '--grid-2', width: 1.5 });
      const ts2 = ts.filter((u) => u <= t);
      pp.xy(ts2.map(S.x), ts2.map(S.v), { color: '--c1', width: 2 });
      pp.dot(S.x(t), S.v(t), { color: '--accent', r: 5 });
      const disc = (g * g) / 4 - p.w0 * p.w0;
      sim.set('g', EM.fix(g, 3) + ' s⁻¹');
      sim.set('reg', p.z === 0 ? 'sin amortiguamiento' : Math.abs(p.z - 1) < 1e-9 ? 'crítico' : p.z < 1 ? 'subamortiguado' : 'sobreamortiguado');
      sim.set('wd', disc < 0 ? EM.fix(Math.sqrt(-disc), 3) + ' rad/s (' + EM.fix((100 * Math.sqrt(-disc)) / p.w0, 2) + ' % de ω₀)' : '— (no oscila)');
      sim.set('Q', p.z > 0 ? EM.fix(1 / (2 * p.z), 3) : '∞');
      sim.set('roots', disc < 0 ? EM.fix(-g / 2, 3) + ' ± ' + EM.fix(Math.sqrt(-disc), 3) + ' i' : EM.fix(-g / 2 + Math.sqrt(disc), 3) + ' y ' + EM.fix(-g / 2 - Math.sqrt(disc), 3));
    });
  });

  /* ======================================================================
     4.3 Energía y Q
     ====================================================================== */
  EM.defineSim('damped-energy', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('f', { label: 'Frecuencia <i>f</i><sub>0</sub>', min: 100, max: 1000, step: 1, value: 440, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Factor de calidad <i>Q</i>', min: 1, max: 3000, value: 30, log: true, step: 0.1, fmt: (v) => EM.sci(v, 3) });
    sim.seg('scale', { label: 'Escala vertical', options: [['lin', 'Lineal'], ['log', 'Logarítmica']], value: 'log' });
    EM.listenButton(sim, () => { const w = 2 * Math.PI * sim.p.f, g = w / sim.p.Q; return { fn: (t) => Math.exp((-g * t) / 2) * Math.sin(w * t), dur: Math.min(6, Math.max(0.5, (2 * 6.9) / g)) }; });
    sim.out('g', '<i>γ</i> = <i>ω</i><sub>0</sub>/<i>Q</i>');
    sim.out('tauE', 'Tiempo de vida de la energía 1/<i>γ</i>', { hl: true });
    sim.out('ncyc', 'Oscilaciones hasta <i>A</i>/e');
    sim.out('loss', 'Energía perdida por ciclo');
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f, g = w / p.Q;
      EM.draw.clear(cv);
      /* se grafica en unidades de ciclos para que se vea la oscilación */
      const ncyc = Math.min(60, Math.max(6, (3 * p.Q) / Math.PI));
      const E = (c) => { const tt = c / p.f; const wd = Math.sqrt(Math.max(0, w * w - (g * g) / 4)); const x = Math.exp((-g * tt) / 2) * Math.cos(wd * tt); const v = Math.exp((-g * tt) / 2) * (-(g / 2) * Math.cos(wd * tt) - wd * Math.sin(wd * tt)); return 0.5 * (v * v) / (w * w) + 0.5 * x * x; };
      const log = p.scale === 'log';
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: ncyc, ymin: log ? 1e-4 : 0, ymax: log ? 1.2 : 1.05, ylog: log, xlabel: 'número de ciclos', ylabel: 'E / E₀', ml: 56 });
      pl.frame();
      pl.fn((c) => E(c) / 0.5, { color: '--c1', width: 1.8, n: 2400 });
      pl.fn((c) => Math.exp(-g * (c / p.f)), { color: '--accent', width: 1.6, dash: [6, 4] });
      pl.vline(p.Q / (2 * Math.PI), { color: '--c3', label: 'E₀/e' });
      pl.legend([{ label: 'energía total', color: '--c1' }, { label: 'e^{−γt}', color: '--accent', dash: [6, 4] }], 'tr');
      sim.set('g', EM.si(g, 's⁻¹'));
      sim.set('tauE', EM.si(1 / g, 's'));
      sim.set('ncyc', EM.fix(p.Q / Math.PI, 2));
      sim.set('loss', EM.fix(100 * (1 - Math.exp((-2 * Math.PI) / p.Q)), 3) + ' % ≈ 2π/Q');
    });
  });

  /* ======================================================================
     4.4 Tiempo de asentamiento
     ====================================================================== */
  EM.defineSim('settling-time', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.2 });
    const cp = sim.canvas({ aspect: 1.2 });
    sim.slider('z', { label: 'Razón de amortiguamiento <i>ζ</i>', min: 0.05, max: 3, step: 0.01, value: 0.7, fmt: f2 });
    sim.slider('tol', { label: 'Banda de tolerancia', min: 1, max: 20, step: 0.5, value: 5, unit: '%', fmt: (v) => EM.fix(v, 1) });
    sim.out('ts', 'Tiempo de asentamiento ω₀<i>t<sub>s</sub></i>', { hl: true });
    sim.out('os', 'Sobrepaso máximo');
    sim.out('opt', 'ζ óptimo para esta tolerancia');
    sim.note('El oscilador parte de <i>x</i> = 1 en reposo (ω₀ = 1). El tiempo de asentamiento es el último instante en que |<i>x</i>| sale de la banda.');
    const settle = (z, tol) => {
      const S = dampedSol(1, 2 * z, 1, 0);
      let last = 0;
      for (let t = 0; t < 80; t += 0.005) if (Math.abs(S.x(t)) > tol) last = t;
      return last;
    };
    let cacheTol = null, curve = null;
    sim.onDraw(() => {
      const p = sim.p, tol = p.tol / 100;
      const S = dampedSol(1, 2 * p.z, 1, 0);
      const ts = settle(p.z, tol);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 20, ymin: -1, ymax: 1.1, xlabel: 'ω₀ t', ylabel: 'x', ml: 52 });
      pl.frame();
      cv.ctx.fillStyle = EM.alpha('--c3', 0.12);
      cv.ctx.fillRect(pl.ix, pl.Y(tol), pl.iw, pl.Y(-tol) - pl.Y(tol));
      pl.fn(S.x, { color: '--accent', width: 2.2, n: 600 });
      pl.vline(ts, { color: '--c3', label: 't_s' });
      if (cacheTol !== p.tol) {
        cacheTol = p.tol;
        const zs = EM.M.linspace(0.05, 3, 150);
        curve = [zs, zs.map((z) => settle(z, tol))];
      }
      EM.draw.clear(cp);
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 3, ymin: 0, ymax: 30, xlabel: 'ζ', ylabel: 'ω₀ t_s', ml: 52 });
      pp.frame();
      pp.xy(curve[0], curve[1], { color: '--c1', width: 2 });
      pp.vline(1, { color: '--ink-3', label: 'crítico' });
      pp.dot(p.z, ts, { color: '--accent', r: 6 });
      let best = 0;
      curve[1].forEach((v, i) => { if (v < curve[1][best]) best = i; });
      pp.dot(curve[0][best], curve[1][best], { color: '--c3', r: 4 });
      let mn = 0;
      for (let t = 0; t < 40; t += 0.01) mn = Math.min(mn, S.x(t));
      sim.set('ts', EM.fix(ts, 2));
      sim.set('os', EM.fix(-100 * mn, 2) + ' %');
      sim.set('opt', 'ζ ≈ ' + EM.fix(curve[0][best], 2) + ' (ω₀t_s = ' + EM.fix(curve[1][best], 2) + ')');
    });
  });

  /* ======================================================================
     4.5 Fricción seca
     ====================================================================== */
  EM.defineSim('coulomb-friction', function (sim) {
    const cs = sim.canvas({ aspect: 4, cls: 'fixed' });
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('w0', { label: '<i>ω</i><sub>0</sub>', min: 2, max: 20, step: 0.1, value: 6, unit: 'rad/s', fmt: (v) => EM.fix(v, 1) });
    sim.slider('mu', { label: 'Coeficiente <i>μ</i> (estático = cinético)', min: 0, max: 0.3, step: 0.005, value: 0.08, fmt: (v) => EM.fix(v, 3) });
    sim.slider('A0', { label: 'Elongación inicial', min: 0.05, max: 0.5, step: 0.01, value: 0.4, unit: 'm', fmt: f2 });
    sim.check('visc', { label: 'Comparar con viscoso de igual pérdida inicial', value: true });
    sim.resetButton(() => restart());
    sim.out('dA', 'Pérdida de amplitud por ciclo 4<i>μg</i>/<i>ω</i><sub>0</sub>²', { hl: true });
    sim.out('band', 'Zona muerta ±<i>μg</i>/<i>ω</i><sub>0</sub>²');
    sim.out('xf', 'Posición final');
    sim.out('nh', 'Medios ciclos hasta detenerse');
    let st, t, tr;
    const g = 9.81;
    const restart = () => { st = [sim.p.A0, 0]; t = 0; tr = new EM.Trace(4000); stuck = false; };
    let stuck = false;
    restart();
    sim.onChange = () => restart();
    const step = (dt) => {
      const p = sim.p, w2 = p.w0 * p.w0, f = p.mu * g;
      const n = 40, h = dt / n;
      for (let i = 0; i < n; i++) {
        if (stuck) break;
        let [x, v] = st;
        const spring = -w2 * x;
        if (Math.abs(v) < 1e-6 && Math.abs(spring) <= f) { stuck = true; st = [x, 0]; break; }
        const dir = Math.abs(v) < 1e-6 ? -Math.sign(spring) : Math.sign(v);
        let a = spring - f * dir;
        let vn = v + a * h;
        if (v !== 0 && Math.sign(vn) !== Math.sign(v)) vn = 0;
        x += 0.5 * (v + vn) * h;
        st = [x, vn];
      }
    };
    sim.animate((dt) => { step(dt); t += dt; if (t < 30) tr.push(t, st[0]); });
    sim.onDraw(() => {
      const p = sim.p, band = (p.mu * g) / (p.w0 * p.w0), dA = 4 * band;
      EM.draw.clear(cs);
      drawMSD(cs.ctx, cs.w, cs.h, st[0], cs.w * 0.3 / 0.5, { fill: '--c4', damper: false });
      EM.draw.clear(cv);
      const T = (2 * Math.PI) / p.w0, span = Math.max(T * 8, 6);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: span, ymin: -p.A0 * 1.15, ymax: p.A0 * 1.15, xlabel: 't (s)', ylabel: 'x (m)', ml: 56 });
      pl.frame();
      cv.ctx.fillStyle = EM.alpha('--c2', 0.1);
      cv.ctx.fillRect(pl.ix, pl.Y(band), pl.iw, pl.Y(-band) - pl.Y(band));
      /* envolvente lineal */
      const tz = dA > 0 ? (p.A0 * T) / dA : span;
      pl.fn((tt) => p.A0 - (dA * tt) / T, { color: '--c2', width: 1, dash: [4, 4], to: tz });
      pl.fn((tt) => -(p.A0 - (dA * tt) / T), { color: '--c2', width: 1, dash: [4, 4], to: tz });
      if (p.visc && p.mu > 0) {
        /* viscoso con igual pérdida relativa en el primer ciclo */
        const r = Math.max(1e-3, (p.A0 - dA) / p.A0), gam = (-2 * Math.log(r)) / T;
        const S = dampedSol(p.w0, Math.min(gam, 2 * p.w0 * 0.999), p.A0, 0);
        pl.fn(S.x, { color: '--c1', width: 1.4, alpha: 0.7, n: 900 });
      }
      pl.xy(tr.t, tr.col(0), { color: '--accent', width: 2.2 });
      if (p.visc && p.mu > 0) pl.legend([{ label: 'fricción seca', color: '--accent' }, { label: 'viscosa equivalente', color: '--c1' }], 'tr');
      sim.set('dA', EM.si(dA, 'm'));
      sim.set('band', EM.si(band, 'm'));
      sim.set('xf', stuck ? EM.si(st[0], 'm') : 'en movimiento…');
      sim.set('nh', p.mu > 0 ? String(Math.max(0, Math.ceil((p.A0 - band) / (2 * band)))) : '∞');
    });
  });
})();
