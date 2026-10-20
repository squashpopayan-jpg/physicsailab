/* Capítulo 8 — Trabajo y energía cinética */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0);
  const G = 9.8;

  /* ======================================================================
     7.1  Trabajo de cada fuerza al arrastrar un trineo
     ====================================================================== */
  MC.defineSim('trabajo-fuerza', function (sim) {
    const cv = sim.canvas({ aspect: 3.0, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.4 });
    const view = new MC.View2D(cv, { xmin: -1.5, xmax: 22, ymin: -1.2, ymax: 3.2 });
    const H = new MC.History(['x', 'K', 'W'], { minDt: 1 / 60 });
    const s = { x: 0, v: 0, WF: 0, Wf: 0, stuck: false };
    let KP = null;
    const st = sim.status(cv);
    sim.group('Fuerza aplicada');
    sim.slider('F', { label: 'Magnitud <i>F</i>', min: 0, max: 300, step: 1, value: 80, unit: 'N', fmt: f0, reset: true });
    sim.slider('th', { label: 'Ángulo con la horizontal θ', min: -60, max: 80, step: 1, value: 25, unit: '°', fmt: f0, reset: true });
    sim.group('Trineo y superficie');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 5, max: 100, step: 1, value: 20, unit: 'kg', fmt: f0, reset: true });
    sim.slider('mk', { label: 'Fricción cinética μ<sub>k</sub> (μ<sub>s</sub> = 1.2 μ<sub>k</sub>)', min: 0, max: 0.8, step: 0.01, value: 0.1, fmt: f2, reset: true });
    sim.slider('d', { label: 'Distancia recorrida <i>d</i>', min: 1, max: 20, step: 0.5, value: 10, unit: 'm', fmt: f1, reset: true });
    sim.out('n', 'Normal <i>n</i> = <i>mg</i> − <i>F</i> sen θ');
    sim.out('f', 'Fricción <i>f</i> = μ<sub>k</sub><i>n</i>');
    sim.out('WF', 'Trabajo de <i>F</i>: <i>Fd</i> cos θ');
    sim.out('Wf', 'Trabajo de la fricción: −<i>fd</i>');
    sim.out('Wn', 'Trabajo neto', { hl: true });
    sim.out('K', 'Energía cinética <i>K</i> = ½<i>mv</i>²', { hl: true });
    sim.out('v', 'Rapidez');
    sim.presets([
      { id: 'trineo', label: 'Niño que tira de un trineo en la nieve', v: { F: 80, th: 25, m: 20, mk: 0.1, d: 10 }, note: 'W_F = 725 J, W_f = −162 J, W_neto = 563 J → v = 7.5 m/s.' },
      { id: 'maleta', label: 'Maleta con ruedas tirada a 30°', v: { F: 50, th: 30, m: 15, mk: 0.03, d: 20 } },
      { id: 'abajo', label: 'Empujar un carro inclinando la fuerza hacia abajo', v: { F: 150, th: -30, m: 30, mk: 0.4, d: 5 }, note: 'Empujar hacia abajo aumenta la normal y, con ella, la fricción.' },
      { id: 'optimo', label: 'Ángulo óptimo con mucha fricción (μk = 0.5)', v: { F: 150, th: 27, m: 20, mk: 0.5, d: 5 }, note: 'La aceleración es máxima cuando tan θ = μk: unos 27°.' }
    ]);
    const forces = () => {
      const p = sim.p, th = M.rad(p.th);
      const n = Math.max(0, p.m * G - p.F * Math.sin(th));
      return { th, n, fk: p.mk * n, fs: 1.2 * p.mk * n, Fx: p.F * Math.cos(th) };
    };
    sim.run({
      reset() {
        s.x = 0; s.v = 0; s.WF = 0; s.Wf = 0; st.hide();
        const q = forces();
        s.stuck = q.Fx <= q.fs;
        H.clear(); H.push(0, { x: 0, K: 0, W: 0 }, true);
        if (s.stuck) st.show('No se mueve: F cos θ no supera la fricción estática máxima', 'bad');
      },
      step(h) {
        if (s.stuck) { sim.end(); return; }
        const p = sim.p, q = forces();
        const a = (q.Fx - q.fk) / p.m;
        let vn = s.v + a * h;
        if (vn < 0) vn = 0;
        let dx = 0.5 * (s.v + vn) * h;
        if (s.x + dx >= p.d) dx = p.d - s.x;
        s.x += dx; s.v = vn;
        s.WF += q.Fx * dx; s.Wf -= q.fk * dx;
        H.push(sim.t + h, { x: s.x, K: 0.5 * p.m * s.v * s.v, W: s.WF + s.Wf });
        if (s.x >= p.d - 1e-9) { H.push(sim.t + h, { x: s.x, K: 0.5 * p.m * s.v * s.v, W: s.WF + s.Wf }, true); sim.end(); }
        if (vn === 0 && a <= 0) sim.end();
      },
      h: 1 / 500
    });
    sim.onDraw(() => {
      const p = sim.p, q = forces();
      view.setRange({ xmax: Math.max(p.d + 3, 8) });
      const ctx = cv.ctx;
      D.clear(cv);
      ctx.fillStyle = MC.alpha('--sky', 1);
      ctx.fillRect(0, 0, cv.w, view.Y(0));
      MC.floorRuler(ctx, view, cv, 0, { fill: '--surface-2' });
      D.line(ctx, view.X(p.d), view.Y(0), view.X(p.d), view.Y(2.6), { color: '--accent', dash: [4, 4], width: 1.5 });
      MC.text(ctx, 'meta', view.X(p.d) + 4, view.Y(2.4), { size: 11, color: '--accent' });
      const X = view.X(s.x), Y = view.Y(0);
      const bw = view.L(1.3), bh = view.L(0.5);
      /* trineo */
      ctx.save();
      ctx.strokeStyle = MC.col('--wood');
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X - bw / 2, Y - 2); ctx.lineTo(X + bw / 2, Y - 2); ctx.quadraticCurveTo(X + bw / 2 + 12, Y - 2, X + bw / 2 + 10, Y - 12); ctx.stroke();
      ctx.restore();
      D.block(ctx, X, Y - bh / 2 - 6, bw, bh, { fill: '--body-c', label: `${f0(p.m)} kg` });
      /* cuerda y fuerza */
      const hx = X + bw / 2, hy = Y - bh / 2 - 6;
      const k = view.L(1.4) / Math.max(p.m * G, p.F, 1);
      D.line(ctx, hx, hy, hx + 60 * Math.cos(q.th), hy - 60 * Math.sin(q.th), { color: '--rope', width: 2 });
      if (p.F > 0) D.vec(ctx, hx, hy, p.F * k * Math.cos(q.th), -p.F * k * Math.sin(q.th), { color: '--force', label: 'F' });
      D.vec(ctx, X, hy, 0, p.m * G * k, { color: '--weight', label: 'mg', labelSide: -1 });
      if (q.n > 0.5) D.vec(ctx, X - 12, hy, 0, -q.n * k, { color: '--normal', label: 'n', labelSide: -1 });
      if (!s.stuck && q.fk > 0.5) D.vec(ctx, X - bw / 2, Y - 3, -q.fk * k, 0, { color: '--fric', label: 'f' });
      if (s.v > 0.01) D.vec(ctx, X, Y - bh - 34, s.v * 10, 0, { color: '--vel', label: 'v' });
      /* barras y gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      const Wn = s.WF + s.Wf, K = 0.5 * p.m * s.v * s.v;
      const mx = Math.max(10, p.F * p.d, q.fk * p.d);
      D.bars(gctx, [
        { label: 'W_F', value: s.WF, color: '--force' },
        { label: 'W_f', value: s.Wf, color: '--fric' },
        { label: 'W_{mg}', value: 0, color: '--weight' },
        { label: 'W_n', value: 0, color: '--normal' },
        { label: 'W_{neto}', value: Wn, color: '--fnet' },
        { label: 'ΔK', value: K, color: '--K' }
      ], { x: 4, y: 4, w: gc.w * 0.46 - 8, h: gc.h - 8, max: MC.niceCeil(mx), min: -MC.niceCeil(Math.max(1, q.fk * p.d)), title: 'TRABAJOS (J)', fmt: (v) => MC.fix(v, 0) });
      const P = KP || (KP = new MC.Plot(gctx));
      P.ctx = gctx;
      const Kmax = MC.niceCeil(Math.max(10, (q.Fx - q.fk) * p.d * 1.1));
      P.set({ x: gc.w * 0.46, y: 0, w: gc.w * 0.54, h: gc.h, xmin: 0, xmax: p.d, ymin: 0, ymax: Kmax, xlabel: ['x', 'm'], ylabel: ['E', 'J'], title: 'K(x) y trabajo neto acumulado', mt: 22, mb: 34 });
      P.frame();
      P.xy(H.d.x, H.d.W, { color: '--fnet', width: 2, dash: [6, 4] });
      P.xy(H.d.x, H.d.K, { color: '--K', width: 2.4 });
      P.legend([{ label: 'K', color: '--K' }, { label: 'W_neto', color: '--fnet', dash: [6, 4] }], 'tl');
      sim.set('n', `${f1(q.n)} N`);
      sim.set('f', `${f1(q.fk)} N`);
      sim.set('WF', `${f1(s.WF)} J`);
      sim.set('Wf', `${f1(s.Wf)} J`);
      sim.set('Wn', `${f1(Wn)} J`);
      sim.set('K', `${f1(K)} J`);
      sim.set('v', `${f2(s.v)} m/s`);
    });
  });

  /* ======================================================================
     7.2  Ley de Hooke y trabajo como área
     ====================================================================== */
  MC.defineSim('hooke-trabajo', function (sim) {
    const cv = sim.canvas({ aspect: 3.3, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.2 });
    const view = new MC.View2D(cv, { xmin: -0.12, xmax: 1.45, ymin: -0.22, ymax: 0.25 });
    const X0 = 0.6;
    let FP = null;
    sim.group('Resorte');
    sim.slider('k', { label: 'Constante elástica <i>k</i>', min: 10, max: 50000, step: 1, value: 400, unit: 'N/m', log: true, fmt: (v) => MC.sci(v, 3) });
    sim.check('nl', { label: 'Resorte no lineal: <i>F</i> = <i>kx</i> + β<i>x</i>³', value: false });
    sim.slider('beta', { label: 'Coeficiente no lineal β', min: 0, max: 50000, step: 100, value: 8000, unit: 'N/m³', fmt: (v) => MC.sci(v, 2) });
    sim.group('Estiramiento');
    sim.slider('x1', { label: 'Inicio del intervalo <i>x</i>₁', min: -0.4, max: 0.6, step: 0.005, value: 0, unit: 'm', fmt: (v) => MC.fix(v, 3) });
    sim.slider('x', { label: 'Posición del extremo <i>x</i> (también se arrastra)', min: -0.4, max: 0.6, step: 0.005, value: 0.1, unit: 'm', fmt: (v) => MC.fix(v, 3) });
    sim.out('Fs', 'Fuerza del resorte <i>F</i><sub>res</sub>');
    sim.out('Fa', 'Fuerza aplicada <i>F</i><sub>ap</sub>');
    sim.out('W', 'Trabajo de <i>x</i>₁ a <i>x</i> (área)', { hl: true });
    sim.out('U', 'Trabajo desde <i>x</i> = 0: ½<i>kx</i>²', { hl: true });
    sim.presets([
      { id: 'dinamometro', label: 'Dinamómetro (k = 100 N/m)', v: { k: 100, nl: false, x1: 0, x: 0.2 } },
      { id: 'triple', label: 'Los segundos 10 cm cuestan el triple', v: { k: 400, nl: false, x1: 0.1, x: 0.2 }, note: 'De 0 a 10 cm: 2 J. De 10 a 20 cm: 6 J.' },
      { id: 'suspension', label: 'Suspensión de un auto (k = 20 000 N/m)', v: { k: 20000, nl: false, x1: 0, x: -0.05 }, note: 'Comprimir 5 cm exige 1000 N y 25 J.' },
      { id: 'banda', label: 'Banda elástica muy estirada (no lineal)', v: { k: 60, nl: true, beta: 3000, x1: 0, x: 0.45 } }
    ]);
    const Fap = (x) => sim.p.k * x + (sim.p.nl ? sim.p.beta * x * x * x : 0);
    const Wint = (a, b) => {
      const k = sim.p.k, bt = sim.p.nl ? sim.p.beta : 0;
      const F = (x) => 0.5 * k * x * x + 0.25 * bt * x * x * x * x;
      return F(b) - F(a);
    };
    const vis = () => sim.ctl.beta.show(sim.p.nl);
    sim.onChange = () => vis();
    vis();
    MC.handles(sim, cv, view, () => [{ id: 'h', x: X0 + sim.p.x, y: 0, r: 22 }], (id, wx) => {
      sim.ctl.x.set(M.clamp(Math.round((wx - X0) / 0.005) * 0.005, -0.4, 0.6), true);
      sim.changed('drag');
    });
    sim.hint('Arrastre la mano para estirar o comprimir', cv);
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: false });
      D.wall(ctx, view.X(0), view.Y(0.2), view.Y(-0.2), 'left');
      const ex = X0 + p.x;
      D.spring(ctx, view.X(0), view.Y(0), view.X(ex) - 8, view.Y(0), { n: 14, amp: 12, color: '--ink-2', width: 2 });
      D.block(ctx, view.X(ex), view.Y(0), 16, 34, { fill: '--metal', r: 3 });
      /* mano */
      D.circle(ctx, view.X(ex) + 18, view.Y(0), 12, { fill: '--body-c', color: '--ink-2', width: 1 });
      /* regla de x */
      D.line(ctx, view.X(X0), view.Y(-0.13), view.X(X0), view.Y(0.15), { color: '--ink-3', dash: [3, 3], width: 1 });
      MC.text(ctx, 'x = 0', view.X(X0), view.Y(0.17), { size: 11, align: 'center', mono: true, color: '--ink-3' });
      for (let x = -0.4; x <= 0.6001; x += 0.1) { D.line(ctx, view.X(X0 + x), view.Y(-0.16), view.X(X0 + x), view.Y(-0.13), { color: '--ink-3', width: 1 }); MC.text(ctx, MC.fix(x, 1), view.X(X0 + x), view.Y(-0.2), { size: 10, align: 'center', mono: true, color: '--ink-3' }); }
      if (Math.abs(p.x) > 1e-4) D.dim(ctx, view.X(X0), view.Y(-0.1), view.X(ex), view.Y(-0.1), `x = ${MC.fix(p.x * 100, 1)} cm`, { labelOff: -10 });
      const F = Fap(p.x);
      const kf = 110 / Math.max(Math.abs(Fap(0.6)), Math.abs(Fap(-0.4)), 1);
      if (Math.abs(F) > 1e-6) {
        D.vec(ctx, view.X(ex) + 30, view.Y(0) - 22, F * kf, 0, { color: '--force', label: 'F_{ap}' });
        D.vec(ctx, view.X(ex) - 10, view.Y(0) + 26, -F * kf, 0, { color: '--tension', label: 'F_{res}' });
      }
      /* gráfica F contra x */
      const gctx = gc.ctx;
      D.clear(gc);
      const Fm = MC.niceCeil(Math.max(Math.abs(Fap(0.6)), Math.abs(Fap(-0.4))) * 1.05);
      const P = FP || (FP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: -0.4, xmax: 0.6, ymin: -Fm, ymax: Fm, xlabel: ['x', 'm'], ylabel: ['F_{ap}', 'N'], mb: 34, mt: 12, ml: 58 });
      P.frame();
      const a = Math.min(p.x1, p.x), b = Math.max(p.x1, p.x);
      P.fn(Fap, { color: '--force', width: 2.4, fill: '--K', fillAlpha: 0.28, fillFrom: a, fillTo: b });
      P.vline(p.x1, { color: '--ink-3', dash: [3, 3], label: 'x₁', labelY: 14 });
      P.dot(p.x, F, { color: '--force', r: 5 });
      const W = Wint(p.x1, p.x);
      P.label((a + b) / 2, Fap((a + b) / 2) / 2, `W = ${MC.sci(W, 3)} J`, { align: 'center', color: '--ink', size: 12, mono: true });
      sim.set('Fs', `${MC.sci(-F, 3)} N`);
      sim.set('Fa', `${MC.sci(F, 3)} N`);
      sim.set('W', `${MC.sci(W, 3)} J`);
      sim.set('U', `${MC.sci(Wint(0, p.x), 3)} J`);
    });
  });

  /* ======================================================================
     7.3  Distancia de detención de un auto
     ====================================================================== */
  const ROADS = { seco: ['Asfalto seco (μ = 0.8)', 0.8], mojado: ['Asfalto mojado (μ = 0.5)', 0.5], grava: ['Grava suelta (μ = 0.4)', 0.4], hielo: ['Hielo (μ = 0.1)', 0.1] };
  MC.defineSim('frenado', function (sim) {
    const cv = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.3 });
    const view = new MC.View2D(cv, { xmin: -6, xmax: 60, ymin: -4.5, ymax: 3.5 });
    const s = { x: 0, v: 0, phase: 'reac', tb: 0, hit: false, vimp: 0 };
    const st = sim.status(cv);
    let GP = null;
    sim.group('Conductor y camino');
    sim.slider('v0', { label: 'Rapidez inicial', min: 10, max: 150, step: 1, value: 50, unit: 'km/h', fmt: f0, reset: true });
    sim.slider('tr', { label: 'Tiempo de reacción <i>t<sub>r</sub></i>', min: 0.3, max: 3, step: 0.1, value: 1, unit: 's', fmt: f1, reset: true });
    sim.select('road', { label: 'Superficie', value: 'seco', options: Object.keys(ROADS).map((k) => [k, ROADS[k][0]]), reset: true });
    sim.slider('D', { label: 'Obstáculo a una distancia', min: 5, max: 200, step: 1, value: 30, unit: 'm', fmt: f0, reset: true });
    sim.out('dr', 'Distancia de reacción <i>vt<sub>r</sub></i>');
    sim.out('df', 'Distancia de frenado <i>v</i>²/(2μ<i>g</i>)');
    sim.out('dt', 'Distancia total de detención', { hl: true });
    sim.out('tt', 'Tiempo total');
    sim.out('res', 'Resultado', { hl: true });
    sim.out('K', 'Energía cinética inicial (auto de 1200 kg)');
    sim.presets([
      { id: 'ciudad50', label: 'Ciudad a 50 km/h, obstáculo a 30 m', v: { v0: 50, tr: 1, road: 'seco', D: 30 } },
      { id: 'ciudad60', label: 'Ciudad a 60 km/h, obstáculo a 30 m', v: { v0: 60, tr: 1, road: 'seco', D: 30 }, note: 'Con sólo 10 km/h más, no alcanza a detenerse: choca a unos 30 km/h.' },
      { id: 'celular', label: 'Conductor mirando el celular (tᵣ = 2 s)', v: { v0: 60, tr: 2, road: 'seco', D: 40 } },
      { id: 'autopista', label: 'Autopista mojada a 100 km/h', v: { v0: 100, tr: 1, road: 'mojado', D: 100 } },
      { id: 'hielo', label: 'Hielo a 40 km/h', v: { v0: 40, tr: 1, road: 'hielo', D: 40 } }
    ]);
    const mu = () => ROADS[sim.p.road][1];
    const dist = (vk, tr, m) => { const v = vk / 3.6; return v * tr + (v * v) / (2 * m * G); };
    sim.run({
      reset() { s.x = 0; s.v = sim.p.v0 / 3.6; s.phase = 'reac'; s.hit = false; s.vimp = 0; st.hide(); view.setRange({ xmax: Math.max(sim.p.D, dist(sim.p.v0, sim.p.tr, mu())) * 1.12 + 6 }); },
      step(h) {
        const p = sim.p;
        if (s.phase === 'reac' && sim.t >= p.tr) s.phase = 'freno';
        const a = s.phase === 'freno' ? -mu() * G : 0;
        let vn = Math.max(0, s.v + a * h);
        s.x += 0.5 * (s.v + vn) * h;
        s.v = vn;
        if (s.x >= p.D - 2.2) { s.hit = true; s.vimp = s.v; st.show(`¡Choca a ${f0(s.v * 3.6)} km/h!`, 'bad'); sim.end(); return; }
        if (s.v === 0) { st.show(`Se detiene a ${f1(p.D - 2.2 - s.x)} m del obstáculo`, 'good'); sim.end(); }
      },
      h: 1 / 500
    });
    sim.onDraw(() => {
      const p = sim.p, v = p.v0 / 3.6, m = mu();
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      MC.road(ctx, view, cv);
      const dr = v * p.tr, df = (v * v) / (2 * m * G);
      const yb = view.Y(-1.4) + 30;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = MC.col('--c4');
      ctx.fillRect(view.X(2.2), view.Y(0) - 6, view.X(dr + 2.2) - view.X(2.2), 6);
      ctx.fillStyle = MC.col('--weight');
      ctx.fillRect(view.X(dr + 2.2), view.Y(0) - 6, view.X(dr + df + 2.2) - view.X(dr + 2.2), 6);
      ctx.restore();
      void yb;
      MC.text(ctx, 'reacción', view.X(2.2 + dr / 2), view.Y(0) - 12, { size: 11, align: 'center', color: '--c4', halo: true, weight: 600 });
      MC.text(ctx, 'frenado', view.X(2.2 + dr + df / 2), view.Y(0) - 12, { size: 11, align: 'center', color: '--weight', halo: true, weight: 600 });
      /* obstáculo */
      const ox = view.X(p.D);
      D.block(ctx, ox + 6, view.Y(0.45), 12, view.L(0.9), { fill: '--c8', r: 2 });
      D.ball(ctx, ox - 10, view.Y(0) - 8, 8, { fill: '--body-a' });
      D.car(ctx, view.X(s.x), view.Y(0) - 1, Math.max(26, view.L(4.4)), { color: '--body-b', dir: 1, wheel: s.x / 0.33 });
      /* gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      const ymax = MC.niceCeil(Math.max(dist(150, p.tr, m) * 0.6, p.D * 1.2, 50));
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: 150, ymin: 0, ymax, xlabel: ['v₀', 'km/h'], ylabel: ['d', 'm'], mb: 34, mt: 12 });
      P.frame();
      for (const [k, [lab, mm]] of Object.entries(ROADS)) {
        const on = k === p.road;
        P.fn((vk) => dist(vk, p.tr, mm), { color: on ? '--weight' : '--ink-3', width: on ? 2.6 : 1.2, dash: on ? [] : [4, 4], alpha: on ? 1 : 0.7 });
        if (!on) { const vx = Math.min(140, Math.sqrt(ymax * 2 * mm * G) * 3.6 * 0.8); P.label(vx, dist(vx, p.tr, mm), lab.split(' (')[0], { size: 10.5, color: '--ink-3', dy: -4 }); }
      }
      P.fn((vk) => (vk / 3.6) * p.tr, { color: '--c4', width: 1.6, dash: [6, 4] });
      P.hline(p.D, { color: '--c8', dash: [5, 4], label: 'obstáculo', labelRight: true });
      P.dot(p.v0, dist(p.v0, p.tr, m), { color: '--weight', r: 5.5, label: `${f1(dist(p.v0, p.tr, m))} m`, mono: true });
      P.legend([{ label: 'detención total', color: '--weight' }, { label: 'sólo reacción', color: '--c4', dash: [6, 4] }], 'tl');
      sim.set('dr', `${f1(dr)} m`);
      sim.set('df', `${f1(df)} m`);
      sim.set('dt', `${f1(dr + df)} m`);
      sim.set('tt', `${f2(p.tr + v / (m * G))} s`);
      if (sim.ended) sim.set('res', s.hit ? `<span class="warnv">choca a ${f0(s.vimp * 3.6)} km/h</span>` : '<span class="goodv">se detiene a tiempo</span>');
      else sim.set('res', dr + df <= p.D - 2.2 ? 'alcanza a detenerse' : '<span class="warnv">no alcanza a detenerse</span>');
      sim.set('K', `${MC.sci(0.5 * 1200 * v * v, 3)} J`);
    });
  });

  /* ======================================================================
     7.4  Potencia: grúa y auto
     ====================================================================== */
  MC.defineSim('potencia', function (sim) {
    sim.cols2('1fr 1.3fr');
    const cv = sim.canvas({ aspect: 0.85 });
    const gc = sim.canvas({ aspect: 1.1 });
    const view = new MC.View2D(cv, { xmin: -3, xmax: 3, ymin: -1, ymax: 12 });
    const H = new MC.History(['v', 'P', 'W', 'E']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false, tspan: 5 });
    const gP = new MC.TGraph({ ylabel: ['P', 'kW'], series: [{ key: 'P', label: 'P', unit: 'kW', color: '--force', fmt: f2 }], legend: false, tspan: 5 });
    MC.hover(sim, gc, [gv, gP]);
    const s = { y: 0, v: 0, W: 0, x: 0, t100: null };
    const st = sim.status(cv);
    sim.group('Situación');
    sim.seg('mode', { options: [['grua', 'Grúa que eleva una carga'], ['auto', 'Auto que acelera']], value: 'grua', reset: true });
    sim.slider('P', { label: 'Potencia del motor <i>P</i>', min: 0.1, max: 300, step: 0.1, value: 10, unit: 'kW', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.slider('m', { label: 'Masa', min: 10, max: 2500, step: 10, value: 500, unit: 'kg', log: true, fmt: f0, reset: true });
    const gG = sim.group('Grúa');
    sim.slider('h', { label: 'Altura a subir', min: 2, max: 60, step: 1, value: 10, unit: 'm', fmt: f0, reset: true });
    const gA = sim.group('Auto');
    sim.slider('cda', { label: 'Área × coeficiente de arrastre <i>C</i><sub>D</sub><i>A</i>', min: 0.3, max: 1.5, step: 0.01, value: 0.65, unit: 'm²', fmt: f2, reset: true });
    sim.slider('crr', { label: 'Resistencia a la rodadura <i>c</i><sub>rr</sub>', min: 0.005, max: 0.03, step: 0.001, value: 0.012, fmt: (v) => MC.fix(v, 3), reset: true });
    sim.out('o1', '—'); sim.out('o2', '—'); sim.out('o3', '—'); sim.out('o4', '—'); sim.out('o5', '—');
    const O = ['o1', 'o2', 'o3', 'o4', 'o5'];
    const setO = (i, lab, val, hl) => { sim._outs[O[i]].label(lab); sim.set(O[i], val); sim._outs[O[i]].dd.classList.toggle('hl', !!hl); };
    sim.presets([
      { id: 'grua', label: 'Grúa de obra: 500 kg con 10 kW', v: { mode: 'grua', P: 10, m: 500, h: 10 }, fn: (q) => q.setSpeed(1), note: 'Rapidez de régimen v = P/(mg) = 2.0 m/s.' },
      { id: 'ascensor', label: 'Ascensor de 800 kg con 15 kW', v: { mode: 'grua', P: 15, m: 800, h: 20 }, fn: (q) => q.setSpeed(1) },
      { id: 'escalera', label: 'Persona de 70 kg subiendo escaleras (515 W)', v: { mode: 'grua', P: 0.515, m: 70, h: 3 }, fn: (q) => q.setSpeed(1), note: 'Sube 3 m en unos 4 s: 0.7 hp.' },
      { id: 'compacto', label: 'Auto compacto: 1100 kg y 70 kW', v: { mode: 'auto', P: 70, m: 1100, cda: 0.65, crr: 0.012 }, fn: (q) => q.setSpeed(2) },
      { id: 'deportivo', label: 'Auto deportivo: 1400 kg y 300 kW', v: { mode: 'auto', P: 300, m: 1400, cda: 0.6, crr: 0.012 }, fn: (q) => q.setSpeed(2) }
    ]);
    const vis = () => { gG.hidden = sim.p.mode !== 'grua'; gA.hidden = sim.p.mode !== 'auto'; };
    sim.onChange = () => vis();
    vis();
    const vmaxAuto = () => {
      const p = sim.p, P = p.P * 1000, fr = p.crr * p.m * G, c = 0.5 * 1.2 * p.cda;
      return M.bisect((v) => (fr + c * v * v) * v - P, 0.01, 200);
    };
    sim.run({
      reset() {
        vis(); st.hide();
        s.y = 0; s.v = 0; s.W = 0; s.x = 0; s.t100 = null;
        H.clear(); H.push(0, { v: 0, P: 0, W: 0, E: 0 }, true);
        if (sim.p.mode === 'grua') {
          const vt = (sim.p.P * 1000) / (sim.p.m * G);
          const T = MC.niceCeil(sim.p.h / vt + vt / G + 1);
          gv.set({ tspan: T, tmax: undefined }); gP.set({ tspan: T });
          view.setRange({ xmin: -3, xmax: 3, ymin: -1, ymax: sim.p.h + 3 });
        } else { gv.set({ tspan: 20 }); gP.set({ tspan: 20 }); }
      },
      step(h) {
        const p = sim.p, P = p.P * 1000;
        if (p.mode === 'grua') {
          const Fmax = 1.5 * p.m * G;
          const F = Math.min(Fmax, P / Math.max(s.v, 1e-3));
          const a = (F - p.m * G) / p.m;
          const vn = Math.max(0, s.v + a * h);
          const dy = 0.5 * (s.v + vn) * h;
          s.y += dy; s.W += F * dy; s.v = vn;
          H.push(sim.t + h, { v: s.v, P: (F * s.v) / 1000, W: s.W, E: 0.5 * p.m * s.v * s.v + p.m * G * s.y });
          if (s.y >= p.h) { st.show(`Subió ${f0(p.h)} m en ${f1(sim.t)} s`, 'good'); sim.end(); }
          if (sim.t > 600) sim.end();
        } else {
          const Fg = 0.8 * p.m * G;
          const F = Math.min(Fg, P / Math.max(s.v, 1e-3));
          const R = p.crr * p.m * G + 0.5 * 1.2 * p.cda * s.v * s.v;
          const a = (F - R) / p.m;
          const vn = Math.max(0, s.v + a * h);
          s.x += 0.5 * (s.v + vn) * h; s.W += F * 0.5 * (s.v + vn) * h; s.v = vn;
          if (s.t100 === null && s.v >= 100 / 3.6) s.t100 = sim.t + h;
          H.push(sim.t + h, { v: s.v, P: (F * s.v) / 1000, W: s.W, E: 0.5 * p.m * s.v * s.v });
          if (sim.t > 90) sim.end();
        }
      },
      h: 1 / 400
    });
    sim.onDraw(() => {
      const p = sim.p;
      const ctx = cv.ctx;
      D.clear(cv);
      const gctx = gc.ctx;
      D.clear(gc);
      if (p.mode === 'grua') {
        view.update();
        view.grid({ labels: 'y', unit: 'm' });
        D.ground(ctx, 0, view.Y(0), cv.w, { depth: 12 });
        /* torre y pluma */
        const tx = view.X(-1.8), top = view.Y(p.h + 2);
        ctx.save();
        ctx.strokeStyle = MC.col('--c4');
        ctx.lineWidth = 3;
        ctx.strokeRect(tx - 8, top, 16, view.Y(0) - top);
        ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(view.X(1.2), top); ctx.stroke();
        ctx.restore();
        D.block(ctx, tx, view.Y(0.8), 30, view.L(0.6), { fill: '--metal', label: 'M' });
        const lx = view.X(0.8), ly = view.Y(s.y + 0.6);
        D.line(ctx, lx, top, lx, ly - view.L(0.35), { color: '--rope', width: 2 });
        D.block(ctx, lx, ly, view.L(1.1), view.L(0.7), { fill: '--body-a', label: `${f0(p.m)} kg`, size: 11 });
        D.line(ctx, view.X(-0.4), view.Y(p.h), view.X(2.4), view.Y(p.h), { color: '--accent', dash: [4, 4], width: 1.5 });
        MC.text(ctx, 'meta', view.X(2.4), view.Y(p.h) - 5, { size: 11, align: 'right', color: '--accent' });
        const K = 0.5 * p.m * s.v * s.v, Ug = p.m * G * s.y;
        D.bars(ctx, [{ label: 'W_{motor}', value: s.W, color: '--force' }, { label: 'K', value: K, color: '--K' }, { label: 'mgh', value: Ug, color: '--Ug' }], { x: cv.w - 150, y: 8, w: 142, h: 150, title: 'ENERGÍA (kJ)', max: MC.niceCeil(Math.max(1, p.m * G * p.h * 1.05)), fmt: (v) => MC.fix(v / 1000, 1) });
        const vt = (p.P * 1000) / (p.m * G);
        gv.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h / 2, mb: 30 }, H, { t: sim.t, yExtra: [vt * 1.1], after: (P) => P.hline(vt, { color: '--vel', dash: [5, 4], label: `P/(mg) = ${f2(vt)} m/s`, labelRight: true }) });
        gP.draw(gctx, { x: 0, y: gc.h / 2, w: gc.w, h: gc.h / 2, mb: 34 }, H, { t: sim.t, yExtra: [p.P * 1.1] });
        setO(0, 'Rapidez de régimen <i>P</i>/(<i>mg</i>)', `${f2(vt)} m/s`, true);
        setO(1, 'Rapidez actual', `${f2(s.v)} m/s`);
        setO(2, 'Altura', `${f2(s.y)} m`);
        setO(3, 'Trabajo del motor', `${MC.sci(s.W, 3)} J`);
        setO(4, 'Potencia', `${MC.sci(p.P * 1000, 3)} W = ${f2((p.P * 1000) / 746)} hp`, true);
      } else {
        const vm = vmaxAuto();
        const cam = s.x;
        const vw = new MC.View2D(cv, { xmin: cam - 8, xmax: cam + 8, ymin: -8, ymax: 10 });
        MC.road(ctx, vw, cv);
        D.car(ctx, vw.X(s.x), vw.Y(0) - 1, vw.L(4.4), { color: '--body-c', dir: 1, wheel: s.x / 0.3 });
        D.gauge(ctx, cv.w / 2, cv.h * 0.3, Math.min(cv.w, cv.h) * 0.2, s.v * 3.6, 300, { label: `${f0(s.v * 3.6)} km/h`, title: 'velocímetro', color: '--vel' });
        gv.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h / 2, mb: 30 }, H, { t: sim.t, yExtra: [vm * 1.1], after: (P) => { P.hline(vm, { color: '--vel', dash: [5, 4], label: `v máx = ${f0(vm * 3.6)} km/h`, labelRight: true }); P.hline(100 / 3.6, { color: '--ink-3', dash: [2, 3], label: '100 km/h' }); } });
        gP.draw(gctx, { x: 0, y: gc.h / 2, w: gc.w, h: gc.h / 2, mb: 34 }, H, { t: sim.t, yExtra: [p.P * 1.1] });
        setO(0, 'Rapidez máxima (<i>P</i> = <i>F</i><sub>resist</sub><i>v</i>)', `${f1(vm * 3.6)} km/h`, true);
        setO(1, 'Rapidez actual', `${f1(s.v * 3.6)} km/h`);
        setO(2, 'De 0 a 100 km/h', s.t100 !== null ? `${f1(s.t100)} s` : vm * 3.6 < 100 ? 'no llega' : 'en curso…', true);
        setO(3, 'Potencia contra el aire a v máx', `${f1((0.5 * 1.2 * p.cda * vm * vm * vm) / 1000)} kW`);
        setO(4, 'Potencia del motor', `${f0(p.P)} kW = ${f0((p.P * 1000) / 746)} hp`);
      }
    });
  });
})();
