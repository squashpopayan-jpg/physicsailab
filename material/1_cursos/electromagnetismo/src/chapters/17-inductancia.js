/* Capítulo 17 — Inductancia y circuitos RL, LC, RLC */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, CK = EM.ckt;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* ======================================================================
     17.1 Inductancia mutua de dos espiras coaxiales
     ====================================================================== */
  EM.defineSim('mutual-coils', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.5 });
    sim.group('Geometría');
    sim.slider('a', { label: 'Radio de la espira 1', min: 1, max: 10, step: 0.1, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: 'Radio de la espira 2', min: 1, max: 10, step: 0.1, value: 4, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('d', { label: 'Separación entre planos <i>d</i>', min: 0.2, max: 20, step: 0.1, value: 4, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.group('Espiras');
    sim.slider('N1', { label: '<i>N</i><sub>1</sub>', min: 1, max: 200, step: 1, value: 50, fmt: (v) => v.toFixed(0) });
    sim.slider('N2', { label: '<i>N</i><sub>2</sub>', min: 1, max: 200, step: 1, value: 50, fmt: (v) => v.toFixed(0) });
    sim.out('M', 'Inductancia mutua <i>M</i>', { hl: true });
    sim.out('L1', '<i>L</i><sub>1</sub> (hilo de 0.5 mm)');
    sim.out('L2', '<i>L</i><sub>2</sub>');
    sim.out('k', 'Coeficiente de acoplamiento <i>k</i>');
    const Mloop = (a, b, d) => {
      const k2 = (4 * a * b) / ((a + b) ** 2 + d * d);
      const [Kk, Ek] = M.ellipKE(Math.min(k2, 0.9999999));
      const k = Math.sqrt(k2);
      return K.mu0 * Math.sqrt(a * b) * ((2 / k - k) * Kk - (2 / k) * Ek);
    };
    const Lself = (R, N) => K.mu0 * N * N * R * (Math.log((8 * R) / 5e-4) - 2);
    sim.onDraw(() => {
      const p = sim.p, a = p.a / 100, b = p.b / 100, d = p.d / 100;
      const Mv = p.N1 * p.N2 * Mloop(a, b, d);
      const L1 = Lself(a, p.N1), L2 = Lself(b, p.N2);
      /* mapa de líneas de la espira 1 */
      EM.draw.clear(cv);
      const span = Math.max(12, p.d / 2 + 9);
      const view = new EM.View2D(cv, { xmin: -span, xmax: span, ymin: -span / 1.9, ymax: span / 1.9 });
      view.grid({ labels: false });
      const z1 = -p.d / 2, z2 = p.d / 2;
      const psi = (x, y) => EM.loopField.psi(Math.abs(y), x - z1, p.a);
      const lv = [];
      for (let i = 1; i <= 16; i++) lv.push(0.05 * p.a * i * i * 0.25);
      EM.field.contours(view, psi, lv, { color: '--bline', width: 1.1, alpha: 0.8, res: 3 });
      const ctx = cv.ctx;
      EM.draw.current(ctx, view.X(z1), view.Y(p.a), 1, { r: 7 });
      EM.draw.current(ctx, view.X(z1), view.Y(-p.a), -1, { r: 7 });
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(view.X(z2), view.Y(p.b)); ctx.lineTo(view.X(z2), view.Y(-p.b)); ctx.stroke();
      ctx.fillStyle = EM.alpha('--c4', 0.15);
      ctx.fillRect(view.X(z2) - 3, view.Y(p.b), 6, view.Y(-p.b) - view.Y(p.b));
      EM.text(ctx, 'espira 1 (con corriente)', view.X(z1), view.Y(p.a) - 14, { size: 11.5, color: '--ink-2', align: 'center', halo: true });
      EM.text(ctx, 'espira 2 (flujo Φ₂₁)', view.X(z2), view.Y(-p.b) + 22, { size: 11.5, color: '--c4', align: 'center', halo: true });
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--axis'); ctx.beginPath(); ctx.moveTo(0, view.Y(0)); ctx.lineTo(cv.w, view.Y(0)); ctx.stroke(); ctx.restore();
      /* gráfica M(d) */
      EM.draw.clear(cp);
      const f = (dd) => p.N1 * p.N2 * Mloop(a, b, dd / 100) * 1e6;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.2, xmax: 20, ymin: Math.max(1e-6, f(20) * 0.5), ymax: f(0.2) * 2, xlog: true, ylog: true, xlabel: 'd (cm)', ylabel: 'M (µH)' });
      pl.frame();
      pl.fn(f, { color: '--c1', width: 2.2 });
      pl.fn((dd) => ((p.N1 * p.N2 * K.mu0 * Math.PI * a * a * b * b) / (2 * Math.pow(dd / 100, 3))) * 1e6, { color: '--ink-3', width: 1.4, dash: [5, 4], from: 3 });
      pl.dot(p.d, Mv * 1e6, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'fórmula exacta (Neumann)', color: '--c1' }, { label: 'dipolar: μ₀πN₁N₂a²b²/2d³', color: '--ink-3', dash: [5, 4] }], 'bl');
      sim.set('M', EM.si(Mv, 'H'));
      sim.set('L1', EM.si(L1, 'H'));
      sim.set('L2', EM.si(L2, 'H'));
      sim.set('k', f3(Mv / Math.sqrt(L1 * L2)));
    });
  });

  /* ======================================================================
     17.2 Circuito RL
     ====================================================================== */
  EM.defineSim('rl-circuit', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.2 });
    sim.group('Componentes');
    sim.slider('E', { label: 'Fem ℰ', min: 1, max: 24, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R', { label: '<i>R</i>', min: 1, max: 100, step: 1, value: 20, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: '<i>L</i>', min: 10, max: 2000, step: 10, value: 400, unit: 'mH', fmt: (v) => v.toFixed(0) });
    sim.group('Interruptor');
    sim.seg('sw', { options: [['on', 'Conectar la fuente'], ['off', 'Cortocircuitar (extinción)']], value: 'on', onInput: () => flip() });
    sim.note('Reproducción: una constante de tiempo por segundo.');
    sim.out('tau', '<i>τ</i> = <i>L</i>/<i>R</i>');
    sim.out('t', 'Tiempo');
    sim.out('i', 'Corriente <i>i</i>', { hl: true });
    sim.out('vl', '<i>v<sub>L</sub></i> = <i>L</i> d<i>i</i>/d<i>t</i>');
    sim.out('UB', 'Energía en la bobina ½<i>Li</i>²');
    let t = 0, t0 = 0, i0 = 0, mode = 'on', hist = [], ph = 0;
    const tau = () => (sim.p.L * 1e-3) / sim.p.R;
    const iF = () => (mode === 'on' ? sim.p.E / sim.p.R : 0);
    const iAt = (tt) => iF() + (i0 - iF()) * Math.exp(-(tt - t0) / tau());
    function flip() { i0 = iAt(t); t0 = t; mode = sim.p.sw; }
    sim.onChange = (id) => { if (id === 'R' || id === 'L' || id === 'E') { i0 = iAt(t); t0 = t; } };
    sim.animate((dt) => {
      t += dt * tau();
      const i = iAt(t);
      ph += dt * 80 * (i / (sim.p.E / sim.p.R));
      hist.push([t, i, (mode === 'on' ? sim.p.E : 0) - i * sim.p.R]);
      while (hist.length && hist[0][0] < t - 6 * tau()) hist.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, T = tau(), i = iAt(t), vL = (mode === 'on' ? p.E : 0) - i * p.R;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L0 = w * 0.1, xa = w * 0.26, xs = w * 0.34, Cx = w * 0.82, T0 = h * 0.22, B = h * 0.84, yb = T0 + 36;
      CK.battery(ctx, L0, B, L0, T0, { label: 'ℰ', labelSide: -1, labelOff: 18 });
      CK.wire(ctx, [[L0, T0], [xa, T0]]);
      CK.wire(ctx, [[xa, yb], [xa, B]]);
      CK.node(ctx, xa, T0); CK.node(ctx, xa, yb); CK.node(ctx, xs, T0);
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xs, T0); ctx.lineTo(xa + 3, mode === 'on' ? T0 : yb); ctx.stroke(); ctx.restore();
      CK.resistor(ctx, xs, T0, Cx, T0, { label: 'R = ' + p.R + ' Ω', labelSide: -1, labelOff: 18, len: 60 });
      CK.inductor(ctx, Cx, T0, Cx, B, { label: 'L = ' + p.L + ' mH', labelSide: 1, labelOff: 20, turns: 5, len: 60 });
      CK.wire(ctx, [[Cx, B], [L0, B]]);
      CK.node(ctx, xa, B);
      if (i / (p.E / p.R) > 0.01) {
        if (mode === 'on') CK.flow(ctx, [[L0, B], [L0, T0], [xa, T0], [xs, T0], [Cx, T0], [Cx, B], [L0, B]], ph, { spacing: 24 });
        else CK.flow(ctx, [[xs, T0], [Cx, T0], [Cx, B], [xa, B], [xa, yb], [xs, T0]], ph, { spacing: 24 });
      }
      EM.draw.clear(cp);
      const tmax = Math.max(6 * T, t);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: tmax - 6 * T, xmax: tmax, ymin: -p.E * 1.1, ymax: p.E * 1.15, xlabel: 't (s)', ylabel: 'tensión (V)' });
      pl.frame();
      pl.hline(p.E * (1 - Math.exp(-1)), { color: '--ink-3', dash: [2, 3], label: '63.2 %', labelRight: true });
      if (hist.length > 1) {
        pl.path(hist.map((r) => [r[0], r[1] * p.R]), { color: '--c1', width: 2.4 });
        pl.path(hist.map((r) => [r[0], r[2]]), { color: '--c5', width: 2, dash: [6, 3] });
      }
      pl.legend([{ label: 'v_{R} = iR', color: '--c1' }, { label: 'v_{L}', color: '--c5', dash: [6, 3] }], 'bl');
      sim.set('tau', EM.si(T, 's'));
      sim.set('t', EM.fix(t, 3) + ' s = ' + EM.fix(t / T, 2) + ' τ');
      sim.set('i', EM.si(i, 'A'));
      sim.set('vl', EM.si(vL, 'V'));
      sim.set('UB', EM.si(0.5 * p.L * 1e-3 * i * i, 'J'));
    });
  });

  /* ======================================================================
     17.3 Oscilador LC
     ====================================================================== */
  EM.defineSim('lc-oscillator', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.4 });
    sim.group('Componentes');
    sim.slider('L', { label: '<i>L</i>', min: 1, max: 100, step: 1, value: 20, unit: 'mH', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: '<i>C</i>', min: 0.1, max: 20, step: 0.1, value: 5, unit: 'µF', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Q0', { label: 'Carga inicial <i>Q</i><sub>0</sub>', min: 1, max: 100, step: 1, value: 50, unit: 'µC', fmt: (v) => v.toFixed(0) });
    sim.note('Reproducción: un período cada 3 s.');
    sim.out('f', 'Frecuencia <i>f</i><sub>0</sub> = 1/2π√(<i>LC</i>)', { hl: true });
    sim.out('T', 'Período');
    sim.out('q', 'Carga <i>q</i>');
    sim.out('i', 'Corriente <i>i</i>');
    sim.out('U', 'Energía total');
    let ph = 4 * Math.PI, flowPh = 0, hist = [];
    const fill = () => { hist = []; for (let k = 0; k <= 240; k++) { const f = ph - 4 * Math.PI + (4 * Math.PI * k) / 240; hist.push([f, Math.cos(f), -Math.sin(f)]); } };
    fill();
    sim.animate((dt) => { ph += (dt * 2 * Math.PI) / 3; flowPh += dt * 70 * Math.sin(ph); hist.push([ph, Math.cos(ph), -Math.sin(ph)]); while (hist.length && hist[0][0] < ph - 4 * Math.PI) hist.shift(); });
    sim.onDraw(() => {
      const p = sim.p, L = p.L * 1e-3, C = p.C * 1e-6, Q0 = p.Q0 * 1e-6;
      const w0 = 1 / Math.sqrt(L * C);
      const q = Q0 * Math.cos(ph), i = -Q0 * w0 * Math.sin(ph);
      const UE = (q * q) / (2 * C), UB = 0.5 * L * i * i, U = (Q0 * Q0) / (2 * C);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const xl = w * 0.12, xr = w * 0.5, T0 = h * 0.18, B = h * 0.86;
      CK.wire(ctx, [[xl, T0], [xr, T0]]);
      CK.wire(ctx, [[xl, B], [xr, B]]);
      CK.capacitor(ctx, xl, B, xl, T0, { label: 'C', labelSide: 1, labelOff: 20, charge: q >= 0 ? -1 : 1, plate: 14 });
      CK.inductor(ctx, xr, T0, xr, B, { label: 'L', labelSide: 1, labelOff: 20, turns: 5, len: 70 });
      if (Math.abs(i) > 0.02 * Q0 * w0) CK.flow(ctx, [[xl, T0], [xr, T0], [xr, B], [xl, B], [xl, (T0 + B) / 2 + 12]], flowPh, { spacing: 24 });
      /* barras de energía */
      const bx = w * 0.66, bw = w * 0.1, bh = h * 0.62, by = h * 0.18;
      const bar = (x, frac, col, lab) => {
        ctx.fillStyle = EM.alpha(col, 0.18); ctx.fillRect(x, by, bw, bh);
        ctx.fillStyle = EM.col(col); ctx.fillRect(x, by + bh * (1 - frac), bw, bh * frac);
        EM.text(ctx, lab, x + bw / 2, by + bh + 16, { size: 12, color: '--ink-2', align: 'center' });
      };
      bar(bx, UE / U, '--efield', 'U_{E}');
      bar(bx + bw * 1.5, UB / U, '--bfield', 'U_{B}');
      EM.text(ctx, 'energía', bx + bw * 1.25, by - 8, { size: 11, color: '--ink-3', align: 'center' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: ph - 4 * Math.PI, xmax: ph, ymin: -1.2, ymax: 1.2, xlabel: 'fase ω₀t', ylabel: 'normalizados', xpi: true });
      pl.frame();
      if (hist.length > 1) { pl.path(hist.map((r) => [r[0], r[1]]), { color: '--efield', width: 2.2 }); pl.path(hist.map((r) => [r[0], r[2]]), { color: '--bfield', width: 2.2, dash: [6, 3] }); }
      pl.legend([{ label: 'q / Q₀', color: '--efield' }, { label: 'i / (ω₀Q₀)', color: '--bfield', dash: [6, 3] }], 'bl');
      sim.set('f', EM.si(w0 / (2 * Math.PI), 'Hz'));
      sim.set('T', EM.si((2 * Math.PI) / w0, 's'));
      sim.set('q', EM.si(q, 'C'));
      sim.set('i', EM.si(i, 'A'));
      sim.set('U', EM.si(U, 'J') + ' (constante)');
    });
  });

  /* ======================================================================
     17.4 RLC amortiguado
     ====================================================================== */
  EM.defineSim('rlc-damped', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.05 });
    const cp = sim.canvas({ aspect: 1.05 });
    sim.group('Componentes');
    sim.slider('R', { label: 'Resistencia <i>R</i>', min: 0, max: 3000, step: 5, value: 200, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: '<i>L</i>', min: 1, max: 50, step: 0.5, value: 10, unit: 'mH', fmt: (v) => EM.fix(v, 1) });
    sim.slider('C', { label: '<i>C</i>', min: 1, max: 100, step: 1, value: 10, unit: 'nF', fmt: (v) => v.toFixed(0) });
    sim.check('ref', { label: 'Mostrar el caso crítico como referencia', value: true });
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('a', '<i>α</i> = <i>R</i>/2<i>L</i>');
    sim.out('w0', '<i>ω</i><sub>0</sub> = 1/√(<i>LC</i>)');
    sim.out('wd', '<i>ω<sub>d</sub></i>');
    sim.out('Rc', '<i>R</i> crítica 2√(<i>L</i>/<i>C</i>)');
    sim.out('Q', 'Factor de calidad <i>Q</i>');
    const sol = (R, L, C, t) => {
      const a = R / (2 * L), w0 = 1 / Math.sqrt(L * C);
      if (Math.abs(a - w0) < 1e-9 * w0) return Math.exp(-a * t) * (1 + a * t);
      if (a < w0) { const wd = Math.sqrt(w0 * w0 - a * a); return Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t)); }
      const b = Math.sqrt(a * a - w0 * w0), s1 = -a + b, s2 = -a - b;
      return (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
    };
    sim.onDraw(() => {
      const p = sim.p, L = p.L * 1e-3, C = p.C * 1e-9, R = p.R;
      const a = R / (2 * L), w0 = 1 / Math.sqrt(L * C), Rc = 2 * Math.sqrt(L / C);
      const T0 = (2 * Math.PI) / w0, tmax = 8 * T0;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax * 1e6, ymin: -1.1, ymax: 1.1, xlabel: 't (µs)', ylabel: 'q / Q₀', title: 'Carga del condensador' });
      pl.frame();
      if (p.ref) pl.fn((t) => sol(Rc, L, C, t * 1e-6), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      if (a < w0) { pl.fn((t) => Math.exp(-a * t * 1e-6), { color: '--c1', width: 1, alpha: 0.4, dash: [2, 3] }); pl.fn((t) => -Math.exp(-a * t * 1e-6), { color: '--c1', width: 1, alpha: 0.4, dash: [2, 3] }); }
      pl.fn((t) => sol(R, L, C, t * 1e-6), { color: '--c1', width: 2.4, n: 1200 });
      if (p.ref) pl.legend([{ label: 'R actual', color: '--c1' }, { label: 'R crítica', color: '--ink-3', dash: [5, 4] }], 'tr');
      /* retrato de fase */
      EM.draw.clear(cp);
      const pts = [];
      let imax = 0;
      for (let k = 0; k <= 1500; k++) {
        const t = (tmax * k) / 1500, h = tmax * 1e-5;
        const q = sol(R, L, C, t), i = (sol(R, L, C, t + h) - sol(R, L, C, Math.max(0, t - h))) / (t > h ? 2 * h : h);
        pts.push([q, i / w0]);
        imax = Math.max(imax, Math.abs(i / w0));
      }
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -1.1, xmax: 1.1, ymin: -1.1, ymax: 1.1, xlabel: 'q / Q₀', ylabel: 'i / (ω₀Q₀)', title: 'Retrato de fase' });
      pp.frame();
      pp.path(pts, { color: '--c5', width: 2 });
      pp.dot(1, 0, { color: '--accent', r: 5, label: 'inicio' });
      const reg = Math.abs(R - Rc) < 0.01 * Rc ? 'crítico' : a < w0 ? 'subamortiguado' : 'sobreamortiguado';
      sim.set('reg', reg);
      sim.set('a', EM.si(a, 's⁻¹'));
      sim.set('w0', EM.si(w0, 'rad/s'));
      sim.set('wd', a < w0 ? EM.si(Math.sqrt(w0 * w0 - a * a), 'rad/s') : '— (no oscila)');
      sim.set('Rc', EM.si(Rc, 'Ω'));
      sim.set('Q', R > 0 ? EM.fix((w0 * L) / R, 2) : '∞');
    });
  });
})();
