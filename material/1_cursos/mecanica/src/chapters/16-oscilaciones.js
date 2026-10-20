/* ===================================================================
   Capítulo 17 — Oscilaciones
   Simulaciones: mas-resorte, mas-energia, pendulo, amortiguado, forzado
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const sci = (v, d = 3) => MC.sci(v, d);

  /* Gráficas temporales apiladas con cursor sincronizado */
  function stackedGraphs(sim, gc, graphs) {
    const c = gc.el;
    const setAll = (v) => graphs.forEach((g) => { g.hx = v; });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const g = graphs.find((q) => q.plot && q.plot.inside(x, y));
      setAll(g ? g.plot.invX(x) : null);
      sim.redraw();
    });
    c.addEventListener('pointerleave', () => { setAll(null); sim.redraw(); });
    return (ctx, H, t, extra) => {
      const n = graphs.length, hh = gc.h / n;
      graphs.forEach((g, i) => g.draw(ctx, { x: 0, y: i * hh, w: gc.w, h: hh, mb: i === n - 1 ? 34 : 20, ml: 56 }, H, Object.assign({ t }, extra ? extra[i] : {})));
    };
  }

  /* Bloque con resorte horizontal: pared en xw (m), bloque centrado en x (m) */
  function springScene(ctx, view, x, o = {}) {
    const xw = o.xw === undefined ? -0.55 : o.xw, bw = o.bw || 0.1, bh = o.bh || 0.08, y0 = 0;
    D.ground(ctx, view.X(xw), view.Y(y0), view.cv.w, { depth: 10 });
    D.wall(ctx, view.X(xw), view.Y(bh * 2.2), view.Y(y0), 'left');
    if (o.damper) {
      const yd = bh * 0.3, xa = view.X(xw), xb = view.X(x - bw / 2);
      const mid = (xa + xb) / 2;
      D.line(ctx, xa, view.Y(yd), mid - 6, view.Y(yd), { color: '--ink-2', width: 1.6 });
      D.poly(ctx, [[mid - 16, view.Y(yd) - 7], [mid + 14, view.Y(yd) - 7], [mid + 14, view.Y(yd) + 7], [mid - 16, view.Y(yd) + 7]], { color: '--ink-2', width: 1.6 });
      D.line(ctx, mid - 6, view.Y(yd) - 5, mid - 6, view.Y(yd) + 5, { color: '--ink-2', width: 2.4 });
      D.line(ctx, mid - 6, view.Y(yd), xb, view.Y(yd), { color: '--ink-2', width: 1.6 });
      D.spring(ctx, xa, view.Y(bh * 0.72), xb, view.Y(bh * 0.72), { n: 11, amp: 6, color: '--tension', width: 2 });
    } else D.spring(ctx, view.X(xw), view.Y(bh / 2), view.X(x - bw / 2), view.Y(bh / 2), { n: 12, amp: 7, color: '--tension', width: 2 });
    D.block(ctx, view.X(x), view.Y(bh / 2), view.L(bw), view.L(bh), { fill: o.fill || '--body-a', label: o.label || 'm', math: true, size: 14 });
    D.line(ctx, view.X(0), view.Y(y0) + 2, view.X(0), view.Y(bh * 1.9), { color: '--ink-3', dash: [4, 4], width: 1 });
  }
  function ruler(ctx, view, a, b, step, fmt) {
    const y = view.Y(0) + 12;
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) {
      D.line(ctx, view.X(v), view.Y(0) + 1, view.X(v), view.Y(0) + 6, { color: '--ink-3', width: 1 });
      MC.text(ctx, fmt(v), view.X(v), y + 10, { size: 9.5, mono: true, align: 'center', color: '--ink-3' });
    }
  }

  /* ======================================================================
     16.1  MAS: masa y resorte
     ====================================================================== */
  MC.defineSim('mas-resorte', function (sim) {
    const cv = sim.canvas({ aspect: 2.5, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.3 });
    const view = new MC.View2D(cv, { xmin: -0.62, xmax: 0.62, ymin: -0.06, ymax: 0.3, align: 'bottom', padB: 22 });
    const H = new MC.History(['x', 'v', 'a']);
    const mk = (key, lab, unit, col, last) => new MC.TGraph({ xlabel: last ? ['t', 's'] : '', ylabel: [lab, unit], series: [{ key, label: lab, unit, color: col, fmt: f3 }], legend: false, tspan: 4, sym: true, minSpan: 1e-4 });
    const gx = mk('x', 'x', 'm', '--pos'), gv = mk('v', 'v', 'm/s', '--vel'), ga = mk('a', 'a', 'm/s²', '--acc', true);
    const drawGraphs = stackedGraphs(sim, gc, [gx, gv, ga]);
    sim.group('Oscilador');
    sim.slider('k', { label: 'Constante del resorte <i>k</i>', min: 1, max: 200, step: 0.5, value: 20, unit: 'N/m', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 5, step: 0.01, value: 0.5, unit: 'kg', fmt: f2, reset: true });
    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: 'Posición inicial <i>x</i>₀', min: -0.25, max: 0.25, step: 0.005, value: 0.1, unit: 'm', fmt: f3, reset: true });
    sim.slider('v0', { label: 'Velocidad inicial <i>v</i>₀', min: -3, max: 3, step: 0.01, value: 0, unit: 'm/s', fmt: f2, reset: true });
    sim.check('circ', { label: 'Mostrar el círculo de referencia', value: true });
    sim.check('vec', { label: 'Mostrar velocidad y aceleración', value: true });
    sim.out('w', 'ω = √(<i>k</i>/<i>m</i>)');
    sim.out('T', 'Periodo <i>T</i> y frecuencia <i>f</i>', { hl: true });
    sim.out('A', 'Amplitud <i>A</i> y fase inicial φ');
    sim.out('max', 'Rapidez y aceleración máximas');
    sim.out('now', '<i>x</i>, <i>v</i>, <i>a</i> ahora');
    sim.presets([
      { id: 'basico', label: 'Bloque de 0.5 kg, resorte de 20 N/m, A = 10 cm', v: { k: 20, m: 0.5, x0: 0.1, v0: 0 }, play: true },
      { id: 'masa4', label: 'Cuatro veces la masa: el periodo se duplica', v: { k: 20, m: 2, x0: 0.1, v0: 0 }, play: true },
      { id: 'k4', label: 'Resorte cuatro veces más rígido', v: { k: 80, m: 0.5, x0: 0.1, v0: 0 }, play: true },
      { id: 'golpe', label: 'Golpe desde el equilibrio (x₀ = 0)', v: { k: 20, m: 0.5, x0: 0, v0: 0.6 }, play: true, note: 'Empieza en el equilibrio con rapidez máxima: la fase inicial es −90°.' },
      { id: 'amplitud', label: 'Doble amplitud, mismo periodo', v: { k: 20, m: 0.5, x0: 0.2, v0: 0 }, play: true }
    ]);
    const par = () => {
      const p = sim.p, w = Math.sqrt(p.k / p.m), A = Math.hypot(p.x0, p.v0 / w), ph = Math.atan2(-p.v0 / w, p.x0);
      return { w, A, ph, T: (2 * Math.PI) / w };
    };
    const state = (t) => { const q = par(); const c = Math.cos(q.w * t + q.ph), sn = Math.sin(q.w * t + q.ph); return { x: q.A * c, v: -q.A * q.w * sn, a: -q.A * q.w * q.w * c }; };
    sim.run({
      reset() { H.clear(); const q = par(); [gx, gv, ga].forEach((g) => g.set({ tspan: Math.max(3, 3 * q.T) })); H.push(0, state(0), true); },
      step(h) { H.push(sim.t + h, state(sim.t + h)); },
      h: 1 / 240
    });
    sim.onDraw(() => {
      const p = sim.p, q = par(), st = state(sim.t), ctx = cv.ctx;
      view.update();
      D.clear(cv);
      springScene(ctx, view, st.x, { fill: '--body-a' });
      ruler(ctx, view, -0.25, 0.25, 0.05, (v) => (Math.abs(v) < 1e-9 ? '0' : `${f0(v * 100)}`));
      MC.text(ctx, 'cm', view.X(0.3), view.Y(0) + 22, { size: 9.5, mono: true, color: '--ink-3' });
      D.line(ctx, view.X(-q.A), view.Y(0.02), view.X(-q.A), view.Y(0.13), { color: '--pos', dash: [3, 3], width: 1 });
      D.line(ctx, view.X(q.A), view.Y(0.02), view.X(q.A), view.Y(0.13), { color: '--pos', dash: [3, 3], width: 1 });
      if (p.vec) {
        const bx = view.X(st.x), by = view.Y(0.12);
        D.vec(ctx, bx, by, st.v * 45, 0, { color: '--vel', label: 'v', minLen: 3 });
        D.vec(ctx, bx, view.Y(0.155), st.a * 5, 0, { color: '--acc', label: 'a', minLen: 3 });
      }
      if (p.circ) {
        const R = Math.min(cv.h * 0.3, 60), cx = cv.w - R - 18, cy = R + 16;
        const ang = q.w * sim.t + q.ph;
        D.circle(ctx, cx, cy, R, { color: '--ink-3', width: 1.2, dash: [4, 4] });
        D.line(ctx, cx - R - 6, cy, cx + R + 6, cy, { color: '--ink-3', width: 1 });
        const px = cx + R * Math.cos(ang), py = cy - R * Math.sin(ang);
        D.line(ctx, cx, cy, px, py, { color: '--ink-2', width: 1.3 });
        D.line(ctx, px, py, px, cy, { color: '--pos', dash: [3, 3], width: 1.2 });
        D.circle(ctx, px, py, 4.5, { fill: '--c5' });
        D.circle(ctx, px, cy, 4.5, { fill: '--pos' });
        D.angle(ctx, cx, cy, 16, 0, M.wrap2pi(ang), { label: '', color: '--c5' });
        MC.text(ctx, 'círculo de referencia', cx, cy + R + 14, { size: 10, align: 'center', color: '--ink-3' });
      }
      const gctx = gc.ctx;
      D.clear(gc);
      drawGraphs(gctx, H, sim.t, [{ yExtra: [q.A * 1.05, -q.A * 1.05] }, { yExtra: [q.A * q.w * 1.05, -q.A * q.w * 1.05] }, { yExtra: [q.A * q.w * q.w * 1.05, -q.A * q.w * q.w * 1.05] }]);
      sim.set('w', `${f2(q.w)} rad/s`);
      sim.set('T', `${f3(q.T)} s · ${f2(1 / q.T)} Hz`);
      sim.set('A', `${f3(q.A)} m · ${f0(M.deg(q.ph))}°`);
      sim.set('max', `${f3(q.A * q.w)} m/s · ${f2(q.A * q.w * q.w)} m/s²`);
      sim.set('now', `${f3(st.x)} m · ${f3(st.v)} m/s · ${f2(st.a)} m/s²`);
    });
  });

  /* ======================================================================
     16.2  Energía del oscilador: el pozo de potencial
     ====================================================================== */
  MC.defineSim('mas-energia', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.2 });
    const H = new MC.History(['K', 'U', 'E', 'x']);
    const gE = new MC.TGraph({ ylabel: ['E', 'J'], series: [{ key: 'K', label: 'K', unit: 'J', color: '--K', fmt: f3 }, { key: 'U', label: 'U', unit: 'J', color: '--Ue', fmt: f3 }, { key: 'E', label: 'E', unit: 'J', color: '--Etot', fmt: f3 }], legend: 'tr', tspan: 4, minSpan: 1e-5 });
    MC.hover(sim, gc, [gE]);
    const s = { x: 0.1, v: 0, lastX: 0, cross: [], Tm: NaN };
    let GP = null;
    sim.group('Pozo de potencial');
    sim.seg('pot', { options: [['arm', 'Parabólico'], ['duro', 'Más rígido'], ['blando', 'Péndulo']], value: 'arm', reset: true });
    sim.slider('k', { label: 'Rigidez <i>k</i> (cerca del fondo)', min: 1, max: 100, step: 0.5, value: 20, unit: 'N/m', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 5, step: 0.01, value: 0.5, unit: 'kg', fmt: f2, reset: true });
    sim.slider('A', { label: 'Amplitud (punto de retorno)', min: 0.01, max: 0.3, step: 0.005, value: 0.1, unit: 'm', fmt: f3, reset: true });
    sim.out('E', 'Energía total <i>E</i>', { hl: true });
    sim.out('vmax', 'Rapidez máxima');
    sim.out('T0', 'Periodo para amplitudes pequeñas 2π√(<i>m</i>/<i>k</i>)');
    sim.out('Tm', 'Periodo medido', { hl: true });
    sim.out('now', '<i>K</i> y <i>U</i> ahora');
    sim.presets([
      { id: 'basico', label: 'Oscilador de 20 N/m y 0.5 kg, A = 10 cm', v: { pot: 'arm', k: 20, m: 0.5, A: 0.1 }, play: true },
      { id: 'grande', label: 'Parabólico con gran amplitud: mismo periodo', v: { pot: 'arm', k: 20, m: 0.5, A: 0.28 }, play: true },
      { id: 'duro', label: 'Pozo más rígido: el periodo baja con la amplitud', v: { pot: 'duro', k: 20, m: 0.5, A: 0.28 }, play: true },
      { id: 'blando', label: 'Pozo de péndulo: el periodo sube con la amplitud', v: { pot: 'blando', k: 20, m: 0.5, A: 0.28 }, play: true }
    ]);
    /* U(x): parabólico, con término cuártico (se endurece) o de péndulo (se ablanda) */
    const U = (x) => {
      const p = sim.p;
      if (p.pot === 'duro') return 0.5 * p.k * x * x + 12.5 * p.k * x * x * x * x;
      if (p.pot === 'blando') { const L = 0.15; return p.k * L * L * (1 - Math.cos(x / L)); }
      return 0.5 * p.k * x * x;
    };
    const F = (x) => { const p = sim.p; if (p.pot === 'duro') return -p.k * x - 50 * p.k * x * x * x; if (p.pot === 'blando') { const L = 0.15; return -p.k * L * Math.sin(x / L); } return -p.k * x; };
    const XR = 0.32;
    sim.run({
      reset() { s.x = sim.p.A; s.v = 0; s.lastX = s.x; s.cross = []; s.Tm = NaN; H.clear(); push(0); gE.set({ tspan: Math.max(3, 3 * 2 * Math.PI * Math.sqrt(sim.p.m / sim.p.k)) }); },
      step(h) {
        const m = sim.p.m;
        const a0 = F(s.x) / m;
        s.x += s.v * h + 0.5 * a0 * h * h;
        s.v += 0.5 * (a0 + F(s.x) / m) * h;
        if (s.lastX > 0 && s.x <= 0) {
          const tc = sim.t + h * (s.lastX / (s.lastX - s.x));
          s.cross.push(tc);
          if (s.cross.length >= 2) s.Tm = s.cross[s.cross.length - 1] - s.cross[s.cross.length - 2];
        }
        s.lastX = s.x;
        push(sim.t + h);
      },
      h: 1 / 2000
    });
    function push(t) { const K = 0.5 * sim.p.m * s.v * s.v, u = U(s.x); H.push(t, { K, U: u, E: K + u, x: s.x }); }
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h;
      D.clear(cv);
      const E = U(p.A), K = 0.5 * p.m * s.v * s.v, u = U(s.x);
      const bw = W > 480 ? 150 : 0;
      const P = GP || (GP = new MC.Plot(ctx));
      P.ctx = ctx;
      const ymax = MC.niceCeil(E * 2.2);
      P.set({ x: 0, y: 0, w: W - bw - 6, h: Hc, xmin: -XR, xmax: XR, ymin: 0, ymax, xlabel: ['x', 'm'], ylabel: ['U', 'J'], mb: 36, mt: 12, ml: 52, mr: 10 });
      P.frame();
      P.fn(U, { color: '--Ue', width: 2.4, n: 300 });
      if (p.pot !== 'arm') P.fn((x) => 0.5 * p.k * x * x, { color: '--ink-3', width: 1.2, dash: [4, 4], n: 200 });
      P.hline(E, { color: '--Etot', width: 1.6, dash: [6, 4], label: 'energía total E', labelRight: true });
      P.vline(-p.A, { color: '--ink-3', y0: 0, y1: E, dash: [2, 3] });
      P.vline(p.A, { color: '--ink-3', y0: 0, y1: E, dash: [2, 3], label: 'retorno', labelY: 14 });
      /* K como segmento entre U(x) y E */
      P.arrow(s.x, u, s.x, E, { color: '--K', width: 2.2, head: 7 });
      P.label(s.x, (u + E) / 2, 'K', { dx: 6, color: '--K', size: 13, math: true });
      P.dot(s.x, u, { color: '--c1', r: 8 });
      if (bw) D.bars(ctx, [{ label: 'K', value: K, color: '--K' }, { label: 'U', value: u, color: '--Ue' }], { x: W - bw, y: 8, w: bw - 8, h: Hc - 16, max: MC.niceCeil(E * 1.1), title: 'ENERGÍA (J)', total: { label: 'E', value: K + u, color: '--Etot' }, fmt: (v) => MC.fix(v, 3) });
      const gctx = gc.ctx;
      D.clear(gc);
      gE.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, H, { t: sim.t, yExtra: [E * 1.1] });
      const T0 = 2 * Math.PI * Math.sqrt(p.m / p.k);
      sim.set('E', `${MC.fix(E, 4)} J`);
      sim.set('vmax', `${f3(Math.sqrt((2 * E) / p.m))} m/s`);
      sim.set('T0', `${f3(T0)} s`);
      sim.set('Tm', isFinite(s.Tm) ? `${f3(s.Tm)} s (${s.Tm > T0 * 1.002 ? 'mayor' : s.Tm < T0 * 0.998 ? 'menor' : 'igual'})` : 'midiendo…');
      sim.set('now', `${MC.fix(K, 4)} J · ${MC.fix(u, 4)} J`);
    });
  });

  /* ======================================================================
     16.3  El péndulo simple
     ====================================================================== */
  MC.defineSim('pendulo', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.3 });
    const H = new MC.History(['th', 'tl']);
    const gT = new MC.TGraph({ ylabel: ['θ', '°'], series: [{ key: 'th', label: 'exacto', unit: '°', color: '--c4', fmt: f1 }, { key: 'tl', label: 'ángulos pequeños', unit: '°', color: '--ink-3', fmt: f1, dash: [5, 4] }], legend: 'tr', tspan: 8, sym: true });
    MC.hover(sim, gc, [gT]);
    const s = { th: 0, w: 0 };
    sim.group('Péndulo');
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 0.1, max: 10, step: 0.001, value: 1, unit: 'm', fmt: f3, log: true, reset: true });
    sim.slider('th0', { label: 'Amplitud θ₀', min: 1, max: 175, step: 0.5, value: 20, unit: '°', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa (no influye)', min: 0.05, max: 10, step: 0.05, value: 1, unit: 'kg', fmt: f2, reset: true });
    sim.select('pl', { label: 'Lugar', value: 'tierra', options: MC.planetOptions(['tierra', 'luna', 'marte', 'jupiter']), reset: true });
    sim.slider('b', { label: 'Amortiguamiento γ', min: 0, max: 0.5, step: 0.005, value: 0, unit: '1/s', fmt: f3, reset: true });
    sim.check('ghost', { label: 'Mostrar el péndulo de ángulos pequeños', value: true });
    sim.check('fz', { label: 'Mostrar fuerzas', value: false });
    sim.out('T', 'Periodo exacto', { hl: true });
    sim.out('T0', 'Periodo de ángulos pequeños 2π√(<i>L</i>/<i>g</i>)');
    sim.out('r', 'Diferencia');
    sim.out('v', 'Rapidez máxima √(2<i>gL</i>(1 − cos θ₀))');
    sim.out('now', 'θ y rapidez ahora');
    sim.presets([
      { id: 'reloj', label: 'Péndulo de reloj (bate segundos)', v: { L: 0.993, th0: 8, m: 1, pl: 'tierra', b: 0 }, play: true, note: 'Periodo de 2.00 s: cada ida dura un segundo.' },
      { id: 'pequeno', label: 'Oscilación pequeña (10°)', v: { L: 1, th0: 10, pl: 'tierra', b: 0 }, play: true },
      { id: 'grande', label: 'Amplitud grande (80°)', v: { L: 1, th0: 80, pl: 'tierra', b: 0 }, play: true, note: 'El péndulo real se atrasa respecto de la aproximación: su periodo es 14 % mayor.' },
      { id: 'invertido', label: 'Casi invertido (170°)', v: { L: 1, th0: 170, pl: 'tierra', b: 0 }, play: true },
      { id: 'luna', label: 'El mismo péndulo en la Luna', v: { L: 1, th0: 20, pl: 'luna', b: 0 }, play: true },
      { id: 'columpio', label: 'Columpio de 2.5 m que nadie empuja', v: { L: 2.5, th0: 30, m: 30, pl: 'tierra', b: 0.04 }, play: true }
    ]);
    const g = () => MC.gOf(sim.p.pl);
    const small = (t) => { const p = sim.p, w = Math.sqrt(g() / p.L); return M.deg(M.rad(p.th0) * Math.exp(-p.b * t) * Math.cos(Math.sqrt(Math.max(0, w * w - p.b * p.b)) * t)); };
    sim.run({
      reset() { s.th = M.rad(sim.p.th0); s.w = 0; H.clear(); push(0); gT.set({ tspan: Math.max(4, 3 * MC.phys.pendulumT(sim.p.L, g(), M.rad(sim.p.th0))) }); },
      step(h) {
        const p = sim.p, k = g() / p.L;
        const f = (t, y) => [y[1], -k * Math.sin(y[0]) - p.b * y[1]];
        const y = M.rk4(f, [s.th, s.w], 0, h);
        s.th = y[0]; s.w = y[1];
        push(sim.t + h);
      },
      h: 1 / 600
    });
    function push(t) { H.push(t, { th: M.deg(s.th), tl: small(t) }); }
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h;
      D.clear(cv);
      const big = p.th0 > 90;
      const px = W / 2;
      const R = big ? Math.min(W / 2 - 30, Hc * 0.42) : Math.min((W / 2 - 30) / Math.max(Math.sin(M.rad(p.th0)), 0.35), Hc - 62);
      const py = big ? Hc * 0.5 : 30;
      D.ceiling(ctx, px - 40, py - 2, px + 40);
      /* arco de la trayectoria */
      const a0 = M.rad(p.th0);
      ctx.save(); ctx.strokeStyle = MC.col('--ink-3'); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, R, Math.PI / 2 - a0, Math.PI / 2 + a0); ctx.stroke(); ctx.restore();
      D.line(ctx, px, py, px, py + R + 10, { color: '--ink-3', dash: [4, 4], width: 1 });
      const bob = (th) => [px + R * Math.sin(th), py + R * Math.cos(th)];
      const rb = 8 + 6 * Math.cbrt(p.m / 10);
      if (p.ghost) {
        const tl = M.rad(small(sim.t)), gb = bob(tl);
        D.line(ctx, px, py, gb[0], gb[1], { color: '--ink-3', width: 1.2, alpha: 0.7 });
        D.circle(ctx, gb[0], gb[1], rb, { fill: '--ink-3', fillAlpha: 0.35, color: '--ink-3' });
      }
      const B = bob(s.th);
      D.line(ctx, px, py, B[0], B[1], { color: '--rope', width: 1.8 });
      D.ball(ctx, B[0], B[1], rb, { fill: '--c4' });
      D.circle(ctx, px, py, 3, { fill: '--ink' });
      D.angle(ctx, px, py, 34, -Math.PI / 2, -Math.PI / 2 + s.th, { label: 'θ' });
      const v = s.w * p.L;
      if (p.fz) {
        const gg = g(), k = 36 / 9.8;
        D.vec(ctx, B[0], B[1], 0, gg * k, { color: '--weight', label: 'mg', vec: false, size: 12 });
        const Tn = p.m * (gg * Math.cos(s.th) + p.L * s.w * s.w) / p.m;
        D.vec(ctx, B[0], B[1], (px - B[0]) / R * Tn * k, (py - B[1]) / R * Tn * k, { color: '--tension', label: 'T', size: 12 });
        const ft = -gg * Math.sin(s.th) * k;
        D.vec(ctx, B[0], B[1], ft * Math.cos(s.th), -ft * Math.sin(s.th), { color: '--fnet', label: 'mg sen θ', vec: false, size: 11, dash: [4, 3] });
      } else if (Math.abs(v) > 0.01) {
        const Lv = 26 * v / Math.sqrt(g() * p.L);
        D.vec(ctx, B[0], B[1], Lv * Math.cos(s.th), -Lv * Math.sin(s.th), { color: '--vel', label: 'v' });
      }
      MC.text(ctx, `L = ${f2(p.L)} m`, px + 8, py + R * 0.45, { size: 11, mono: true, color: '--ink-3', halo: true });
      const gctx = gc.ctx;
      D.clear(gc);
      gT.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, H, { t: sim.t, yExtra: [p.th0 * 1.05, -p.th0 * 1.05] });
      const T = MC.phys.pendulumT(p.L, g(), a0), T0 = 2 * Math.PI * Math.sqrt(p.L / g());
      sim.set('T', `${f3(T)} s`);
      sim.set('T0', `${f3(T0)} s`);
      sim.set('r', `el exacto es ${f1((T / T0 - 1) * 100)} % mayor`);
      sim.set('v', `${f2(Math.sqrt(2 * g() * p.L * (1 - Math.cos(a0))))} m/s`);
      sim.set('now', `${f1(M.deg(s.th))}° · ${f2(Math.abs(v))} m/s`);
    });
  });

  /* ======================================================================
     16.4  Oscilaciones amortiguadas
     ====================================================================== */
  MC.defineSim('amortiguado', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.9 });
    const view = new MC.View2D(cv, { xmin: -0.62, xmax: 0.62, ymin: -0.06, ymax: 0.24, align: 'bottom', padB: 22 });
    const H = new MC.History(['x']);
    const gX = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--pos', fmt: f3 }], legend: false, tspan: 8, sym: true, minSpan: 1e-4 });
    MC.hover(sim, gc, [gX]);
    const s = { x: 0.1, v: 0 };
    sim.group('Oscilador');
    sim.slider('k', { label: 'Constante del resorte <i>k</i>', min: 1, max: 200, step: 0.5, value: 20, unit: 'N/m', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 5, step: 0.01, value: 0.5, unit: 'kg', fmt: f2, reset: true });
    sim.slider('b', { label: 'Coeficiente de amortiguamiento <i>b</i>', min: 0, max: 30, step: 0.01, value: 0.4, unit: 'kg/s', fmt: f2, reset: true });
    sim.slider('x0', { label: 'Posición inicial', min: -0.25, max: 0.25, step: 0.005, value: 0.2, unit: 'm', fmt: f3, reset: true });
    sim.button('Amortiguamiento crítico', () => { sim.ctl.b.set(+(2 * Math.sqrt(sim.p.k * sim.p.m)).toFixed(2)); });
    sim.check('env', { label: 'Mostrar la envolvente ±A e<sup>−γt</sup>', value: true });
    sim.out('w0', 'Frecuencia natural ω₀ = √(<i>k</i>/<i>m</i>)');
    sim.out('g', 'γ = <i>b</i>/2<i>m</i> y ζ = γ/ω₀');
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('w1', 'Frecuencia amortiguada ω′ y periodo');
    sim.out('Q', 'Factor de calidad <i>Q</i> = ω₀/2γ');
    sim.presets([
      { id: 'sub', label: 'Subamortiguado (poca fricción)', v: { k: 20, m: 0.5, b: 0.4, x0: 0.2 }, play: true },
      { id: 'critico', label: 'Amortiguamiento crítico', v: { k: 20, m: 0.5, b: 6.325, x0: 0.2 }, play: true, note: 'Vuelve al equilibrio lo más rápido posible sin pasarse.' },
      { id: 'sobre', label: 'Sobreamortiguado', v: { k: 20, m: 0.5, b: 20, x0: 0.2 }, play: true },
      { id: 'auto', label: 'Suspensión de un auto (ζ ≈ 0.3)', v: { k: 60, m: 1.5, b: 5.7, x0: 0.2 }, play: true, note: 'Un pequeño rebote y luego queda quieto.' }
    ]);
    const par = () => { const p = sim.p, w0 = Math.sqrt(p.k / p.m), g = p.b / (2 * p.m); return { w0, g, z: g / w0, w1: Math.sqrt(Math.max(0, w0 * w0 - g * g)) }; };
    sim.run({
      reset() { s.x = sim.p.x0; s.v = 0; H.clear(); H.push(0, { x: s.x }, true); const q = par(); gX.set({ tspan: Math.max(4, Math.min(30, 6 / Math.max(q.g, 0.2), 8 * (2 * Math.PI) / q.w0)) }); },
      step(h) {
        const p = sim.p;
        const f = (t, y) => [y[1], (-p.k * y[0] - p.b * y[1]) / p.m];
        const y = M.rk4(f, [s.x, s.v], 0, h);
        s.x = y[0]; s.v = y[1];
        H.push(sim.t + h, { x: s.x });
        if (sim.t > 60) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, q = par(), ctx = cv.ctx;
      view.update();
      D.clear(cv);
      springScene(ctx, view, s.x, { damper: true, fill: '--body-b' });
      ruler(ctx, view, -0.25, 0.25, 0.05, (v) => (Math.abs(v) < 1e-9 ? '0' : `${f0(v * 100)}`));
      MC.text(ctx, 'amortiguador', (view.X(-0.55) + view.X(s.x - 0.05)) / 2 - 2, view.Y(0.024) - 11, { size: 10, align: 'center', color: '--ink-3', halo: true });
      const gctx = gc.ctx;
      D.clear(gc);
      const A0 = Math.abs(p.x0);
      const fns = [];
      if (p.env && q.z < 1) {
        const Aenv = A0 / Math.max(1e-9, Math.abs(Math.cos(Math.atan2(q.g, q.w1))));
        const phi = -Math.atan2(q.g, q.w1);
        const Ae = Math.abs(p.x0 / Math.cos(phi));
        fns.push({ f: (t) => Ae * Math.exp(-q.g * t), color: '--ink-3', dash: [5, 4] }, { f: (t) => -Ae * Math.exp(-q.g * t), color: '--ink-3', dash: [5, 4] });
        void Aenv;
      }
      gX.set({ fns });
      gX.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, H, { t: sim.t, yExtra: [A0 * 1.1, -A0 * 1.1] });
      sim.set('w0', `${f2(q.w0)} rad/s (T₀ = ${f3((2 * Math.PI) / q.w0)} s)`);
      sim.set('g', `${f3(q.g)} s⁻¹ · ζ = ${f3(q.z)}`);
      sim.set('reg', q.z < 0.995 ? 'subamortiguado: oscila' : q.z <= 1.005 ? 'crítico: vuelve sin oscilar' : 'sobreamortiguado: no oscila');
      sim.set('w1', q.z < 0.995 ? `${f2(q.w1)} rad/s · T′ = ${f3((2 * Math.PI) / q.w1)} s` : '— (no oscila)');
      sim.set('Q', q.g > 0 ? f1(q.w0 / (2 * q.g)) : '∞ (sin amortiguamiento)');
    });
  });

  /* ======================================================================
     16.5  Oscilaciones forzadas y resonancia
     ====================================================================== */
  MC.defineSim('forzado', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.2 });
    const view = new MC.View2D(cv, { xmin: -0.62, xmax: 0.62, ymin: -0.06, ymax: 0.24, align: 'bottom', padB: 22 });
    const H = new MC.History(['x', 'F']);
    const gX = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--pos', fmt: f3 }, { key: 'F', label: 'F₀cos ωt / k', unit: 'm', color: '--force', fmt: f3, dash: [4, 3] }], legend: 'tr', tspan: 12, sym: true, minSpan: 1e-4 });
    const s = { x: 0, v: 0, amp: 0, win: [] };
    let GP = null;
    const hov = { plot: null, hx: null };
    sim.group('Oscilador');
    sim.slider('k', { label: 'Constante del resorte <i>k</i>', min: 1, max: 200, step: 0.5, value: 20, unit: 'N/m', fmt: f1, reset: true });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 5, step: 0.01, value: 0.5, unit: 'kg', fmt: f2, reset: true });
    sim.slider('b', { label: 'Amortiguamiento <i>b</i>', min: 0.02, max: 10, step: 0.01, value: 0.5, unit: 'kg/s', fmt: f2, reset: true, log: true });
    sim.group('Fuerza impulsora <span class="nt">F₀ cos ωt</span>');
    sim.slider('r', { label: 'Frecuencia relativa ω/ω₀', min: 0.1, max: 3, step: 0.005, value: 0.5, fmt: f3, reset: true });
    sim.slider('F0', { label: 'Amplitud de la fuerza <i>F</i>₀', min: 0.05, max: 5, step: 0.05, value: 0.4, unit: 'N', fmt: f2, reset: true });
    sim.out('w', 'ω₀ y ω', { hl: true });
    sim.out('At', 'Amplitud estacionaria (teórica)', { hl: true });
    sim.out('Am', 'Amplitud medida (último ciclo)');
    sim.out('ph', 'Desfase entre fuerza y desplazamiento');
    sim.out('Q', 'Factor de calidad y ancho del pico');
    sim.presets([
      { id: 'lejos', label: 'Debajo de la resonancia (ω = ω₀/2)', v: { k: 20, m: 0.5, b: 0.5, r: 0.5, F0: 0.4 }, play: true },
      { id: 'resonancia', label: 'En resonancia (ω = ω₀)', v: { k: 20, m: 0.5, b: 0.5, r: 1, F0: 0.4 }, play: true, note: 'La amplitud crece hasta que la energía perdida por ciclo iguala a la entregada.' },
      { id: 'alta', label: 'Muy por encima (ω = 2ω₀)', v: { k: 20, m: 0.5, b: 0.5, r: 2, F0: 0.4 }, play: true },
      { id: 'poco', label: 'Resonancia con muy poco amortiguamiento', v: { k: 20, m: 0.5, b: 0.1, r: 1, F0: 0.1 }, play: true },
      { id: 'pulsaciones', label: 'Cerca de la resonancia: pulsaciones', v: { k: 20, m: 0.5, b: 0.05, r: 0.9, F0: 0.2 }, play: true, note: 'Durante el transitorio se suman la oscilación natural y la forzada: aparecen pulsaciones.' }
    ]);
    const par = () => {
      const p = sim.p, w0 = Math.sqrt(p.k / p.m), g = p.b / (2 * p.m), w = p.r * w0;
      const Ath = (ww) => (p.F0 / p.m) / Math.sqrt((w0 * w0 - ww * ww) ** 2 + (2 * g * ww) ** 2);
      return { w0, g, w, Ath, ph: Math.atan2(2 * g * w, w0 * w0 - w * w) };
    };
    const c = gc.el;
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; gX.hx = gX.plot && gX.plot.inside(x, y) ? gX.plot.invX(x) : null; hov.hx = GP && GP.inside(x, y) ? GP.invX(x) : null; sim.redraw(); });
    c.addEventListener('pointerleave', () => { gX.hx = null; hov.hx = null; sim.redraw(); });
    sim.run({
      reset() { s.x = 0; s.v = 0; s.win = []; s.amp = 0; H.clear(); H.push(0, { x: 0, F: sim.p.F0 / sim.p.k }, true); const q = par(); gX.set({ tspan: Math.max(8, Math.min(40, 5 / Math.max(q.g, 0.05))) }); },
      step(h) {
        const p = sim.p, q = par();
        const f = (t, y) => [y[1], (-p.k * y[0] - p.b * y[1] + p.F0 * Math.cos(q.w * t)) / p.m];
        const y = M.rk4(f, [s.x, s.v], sim.t, h);
        s.x = y[0]; s.v = y[1];
        const t = sim.t + h;
        s.win.push([t, s.x]);
        const Tf = (2 * Math.PI) / q.w;
        while (s.win.length && s.win[0][0] < t - Tf) s.win.shift();
        s.amp = s.win.reduce((a, r) => Math.max(a, Math.abs(r[1])), 0);
        H.push(t, { x: s.x, F: (p.F0 * Math.cos(q.w * t)) / p.k });
        if (sim.t > 120) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, q = par(), ctx = cv.ctx;
      view.update();
      D.clear(cv);
      const xd = M.clamp(s.x, -0.4, 0.4);
      springScene(ctx, view, xd, { damper: true, fill: '--body-c' });
      const Fn = p.F0 * Math.cos(q.w * sim.t);
      D.vec(ctx, view.X(xd), view.Y(0.14), (Fn / Math.max(p.F0, 1e-9)) * 45, 0, { color: '--force', label: 'F', minLen: 2 });
      if (Math.abs(s.x) > 0.4) MC.text(ctx, '¡amplitud fuera de escala!', cv.w - 10, 18, { size: 11, align: 'right', color: '--warn-ink', weight: 600 });
      /* gráficas: x(t) arriba, curva de resonancia abajo */
      const gctx = gc.ctx;
      D.clear(gc);
      const h1 = gc.h * 0.5;
      const Amax = q.Ath(Math.sqrt(Math.max(1e-9, q.w0 * q.w0 - 2 * q.g * q.g)));
      gX.draw(gctx, { x: 0, y: 0, w: gc.w, h: h1, mb: 30, ml: 56 }, H, { t: sim.t, yExtra: [Math.max(q.Ath(q.w), p.F0 / p.k) * 1.2, -Math.max(q.Ath(q.w), p.F0 / p.k) * 1.2] });
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: h1, w: gc.w, h: gc.h - h1, xmin: 0, xmax: 3, ymin: 0, ymax: MC.niceCeil(Amax * 1.12), xlabel: ['ω/ω₀', ''], ylabel: ['A', 'm'], mb: 36, mt: 14, ml: 56, mr: 14 });
      P.frame();
      P.fn((r) => q.Ath(r * q.w0), { color: '--c5', width: 2.4, n: 600 });
      P.vline(1, { color: '--ink-3', label: 'ω₀', labelY: 12 });
      P.dot(p.r, q.Ath(q.w), { color: '--c5', r: 6, label: 'teórica', dy: -10 });
      if (sim.t > (2 * Math.PI) / q.w) P.dot(p.r, s.amp, { color: '--pos', r: 4.5, label: 'medida', dy: 16 });
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'A', unit: 'm', color: '--c5', y: q.Ath(hov.hx * q.w0), fmt: (v) => sci(v) }], { label: 'ω/ω₀', fmt: f2 });
      sim.set('w', `${f2(q.w0)} rad/s · ${f2(q.w)} rad/s`);
      sim.set('At', `${sci(q.Ath(q.w))} m (${f1(q.Ath(q.w) / (p.F0 / p.k))} veces F₀/k)`);
      sim.set('Am', sim.t > (2 * Math.PI) / q.w ? `${sci(s.amp)} m` : 'midiendo…');
      sim.set('ph', `${f0(M.deg(q.ph))}°${q.ph < 0.3 ? ' (casi en fase)' : q.ph > 2.8 ? ' (casi en oposición)' : Math.abs(q.ph - Math.PI / 2) < 0.2 ? ' (90°: resonancia)' : ''}`);
      sim.set('Q', `${f1(q.w0 / (2 * q.g))} · ancho ≈ ${f3((2 * q.g) / q.w0)} ω₀`);
    });
  });
})();
