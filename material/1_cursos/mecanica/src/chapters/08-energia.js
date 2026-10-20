/* Capítulo 9 — Energía potencial y conservación de la energía */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0);
  const G = 9.8;

  /* Longitud y punto a una distancia s a lo largo de una polilínea */
  function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  function polyAt(pts, s) {
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (s <= l || i === pts.length - 1) { const t = l > 0 ? M.clamp(s / l, 0, 1) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
      s -= l;
    }
    return pts[pts.length - 1];
  }

  /* ======================================================================
     8.1  ¿Depende el trabajo del camino?
     ====================================================================== */
  MC.defineSim('trayectorias', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const s = { u: 0 };
    sim.group('Camino');
    sim.seg('path', { options: [['0', 'Recto'], ['1', 'Escalera / en L'], ['2', 'Curvo con rodeo']], value: '0', reset: true });
    sim.group('Parámetros');
    sim.slider('m', { label: 'Masa de la caja <i>m</i>', min: 1, max: 50, step: 1, value: 10, unit: 'kg', fmt: f0, reset: true });
    sim.slider('H', { label: 'Desnivel <i>H</i> (plano vertical)', min: 0.5, max: 4, step: 0.1, value: 3, unit: 'm', fmt: f1, reset: true });
    sim.slider('L', { label: 'Separación horizontal <i>L</i>', min: 1, max: 6, step: 0.1, value: 4, unit: 'm', fmt: f1, reset: true });
    sim.slider('mk', { label: 'Fricción cinética del piso μ<sub>k</sub>', min: 0, max: 0.6, step: 0.01, value: 0.3, fmt: f2, reset: true });
    sim.out('Wg', 'Trabajo del peso (plano vertical)', { hl: true });
    sim.out('Wf', 'Trabajo de la fricción (piso)', { hl: true });
    sim.out('Lv', 'Longitud del camino vertical');
    sim.out('Lh', 'Longitud del camino en el piso');
    const pathsV = () => {
      const { H, L } = sim.p;
      const stair = [[0, 0]];
      const n = 4;
      for (let i = 1; i <= n; i++) { stair.push([(L * (i - 1)) / n, (H * i) / n]); stair.push([(L * i) / n, (H * i) / n]); }
      const curve = [];
      for (let i = 0; i <= 60; i++) { const t = i / 60; curve.push([L * t + 1.2 * Math.sin(Math.PI * t), H * t * t + 0.9 * Math.sin(Math.PI * t)]); }
      return [[[0, 0], [L, H]], stair, curve];
    };
    const pathsH = () => {
      const { L } = sim.p;
      const Dd = L, Dy = L * 0.55;
      const curve = [];
      for (let i = 0; i <= 60; i++) { const t = i / 60; curve.push([Dd * t + 1.0 * Math.sin(Math.PI * t), Dy * t - 1.3 * Math.sin(Math.PI * t)]); }
      return [[[0, 0], [Dd, Dy]], [[0, 0], [Dd, 0], [Dd, Dy]], curve];
    };
    sim.run({
      startLabel: 'Mover la caja',
      reset() { s.u = 0; },
      step(h) { s.u = Math.min(1, s.u + h / 3); if (s.u >= 1) sim.end(); }
    });
    sim.onDraw(() => {
      const p = sim.p, idx = +p.path;
      const ctx = cv.ctx, w = cv.w, hh = cv.h;
      D.clear(cv);
      const PV = pathsV(), PH = pathsH();
      /* panel izquierdo: plano vertical */
      const half = w / 2;
      const vL = { cv: { w: half, h: hh, ctx } };
      const viewV = new MC.View2D({ w: half, h: hh }, { xmin: -0.8, xmax: 7.2, ymin: -0.9, ymax: 5.3 });
      const viewH = new MC.View2D({ w: half, h: hh }, { xmin: -0.8, xmax: 7.2, ymin: -2.4, ymax: 4.2 });
      void vL;
      MC.text(ctx, 'Plano vertical: trabajo del peso', 12, 20, { size: 12, weight: 700, color: '--ink-2' });
      D.ground(ctx, 0, viewV.Y(0), half - 6, { depth: 10 });
      PV.forEach((pts, i) => D.poly(ctx, pts.map((q) => [viewV.X(q[0]), viewV.Y(q[1])]), { color: i === idx ? '--c1' : '--ink-3', width: i === idx ? 3 : 1.4, dash: i === idx ? [] : [5, 4] }));
      D.circle(ctx, viewV.X(0), viewV.Y(0), 5, { fill: '--ink' });
      D.circle(ctx, viewV.X(p.L), viewV.Y(p.H), 5, { fill: '--ink' });
      MC.text(ctx, 'A', viewV.X(0) - 14, viewV.Y(0) - 6, { size: 14, weight: 700 });
      MC.text(ctx, 'B', viewV.X(p.L) + 8, viewV.Y(p.H) - 6, { size: 14, weight: 700 });
      D.dim(ctx, viewV.X(p.L) + 26, viewV.Y(0), viewV.X(p.L) + 26, viewV.Y(p.H), `H = ${f1(p.H)} m`, { labelOff: 0, dx: 30 });
      const lv = polyLen(PV[idx]);
      const qv = polyAt(PV[idx], s.u * lv);
      D.block(ctx, viewV.X(qv[0]), viewV.Y(qv[1]) - 9, 22, 18, { fill: '--body-a' });
      D.vec(ctx, viewV.X(qv[0]) + 16, viewV.Y(qv[1]) - 9, 0, 34, { color: '--weight', label: 'mg', size: 12 });
      /* panel derecho: piso visto desde arriba */
      ctx.save();
      ctx.translate(half, 0);
      D.line(ctx, 0, 8, 0, hh - 8, { color: '--rule', width: 1 });
      MC.text(ctx, 'Piso visto desde arriba: trabajo de la fricción', 12, 20, { size: 12, weight: 700, color: '--ink-2' });
      ctx.fillStyle = MC.alpha('--wood', 0.18);
      ctx.fillRect(8, 30, half - 16, hh - 38);
      PH.forEach((pts, i) => D.poly(ctx, pts.map((q) => [viewH.X(q[0]), viewH.Y(q[1])]), { color: i === idx ? '--fric' : '--ink-3', width: i === idx ? 3 : 1.4, dash: i === idx ? [] : [5, 4] }));
      const E = PH[0][1];
      D.circle(ctx, viewH.X(0), viewH.Y(0), 5, { fill: '--ink' });
      D.circle(ctx, viewH.X(E[0]), viewH.Y(E[1]), 5, { fill: '--ink' });
      MC.text(ctx, 'C', viewH.X(0) - 14, viewH.Y(0) + 4, { size: 14, weight: 700 });
      MC.text(ctx, 'D', viewH.X(E[0]) + 8, viewH.Y(E[1]) - 6, { size: 14, weight: 700 });
      const lh = polyLen(PH[idx]);
      const qh = polyAt(PH[idx], s.u * lh);
      D.block(ctx, viewH.X(qh[0]), viewH.Y(qh[1]), 20, 20, { fill: '--body-a' });
      ctx.restore();
      /* tabla comparativa */
      const Wg = -p.m * G * p.H;
      const rows = PV.map((pv, i) => [polyLen(pv), -p.mk * p.m * G * polyLen(PH[i])]);
      const tx = 12, ty = hh - 74;
      D.panel(ctx, tx - 4, ty - 16, 250, 76);
      MC.text(ctx, 'camino   W_peso     W_fricción', tx + 4, ty, { size: 11, mono: true, color: '--ink-3' });
      ['recto', 'en L', 'curvo'].forEach((nm, i) => MC.text(ctx, `${nm.padEnd(8, ' ')} ${MC.fix(Wg, 0).padStart(7, ' ')} J ${MC.fix(rows[i][1], 0).padStart(8, ' ')} J`, tx + 4, ty + 16 + i * 15, { size: 11, mono: true, color: i === idx ? '--ink' : '--ink-2', weight: i === idx ? 600 : 400 }));
      sim.set('Wg', `${f1(Wg * s.u)} J (al final ${f1(Wg)} J)`);
      sim.set('Wf', `${f1(-p.mk * p.m * G * lh * s.u)} J (al final ${f1(-p.mk * p.m * G * lh)} J)`);
      sim.set('Lv', `${f2(lv)} m`);
      sim.set('Lh', `${f2(lh)} m`);
    });
  });

  /* ======================================================================
     8.3  Pista de patinaje
     ====================================================================== */
  const TRACKS = {
    valle: { label: 'Valle (parábola)', f: (x) => 0.18 * x * x },
    doble: { label: 'Doble valle', f: (x) => 0.0125 * x ** 4 - 0.3 * x * x + 2.2 },
    montana: { label: 'Montaña rusa', f: (x) => 0.16 * x * x + 1.1 + 1.1 * Math.cos(1.35 * x) },
    rampa: { label: 'Medio tubo (fondo plano)', f: (x) => (Math.abs(x) < 2 ? 0 : 0.5 * (Math.abs(x) - 2) ** 2) }
  };
  MC.defineSim('pista-patinaje', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const gc = sim.canvas({ aspect: 2.9, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -6.4, xmax: 6.4, ymin: -0.6, ymax: 8.6 });
    const s = { x: -4, v: 0, Eth: 0 };
    const H = new MC.History(['K', 'U', 'Th'], { minDt: 1 / 30 });
    let EP = null;
    sim.group('Pista');
    sim.select('tr', { label: 'Forma de la pista', value: 'valle', options: Object.keys(TRACKS).map((k) => [k, TRACKS[k].label]), reset: true });
    sim.slider('mu', { label: 'Fricción μ', min: 0, max: 0.2, step: 0.005, value: 0, fmt: (v) => MC.fix(v, 3) });
    sim.select('pl', { label: 'Lugar', value: 'tierra', options: MC.planetOptions(['tierra', 'luna', 'marte', 'jupiter']) });
    sim.group('Patinador');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 20, max: 100, step: 1, value: 60, unit: 'kg', fmt: f0 });
    sim.slider('x0', { label: 'Posición inicial <i>x</i>₀ (o arrástrelo)', min: -5.9, max: 5.9, step: 0.05, value: -4.5, unit: 'm', fmt: f2, reset: true });
    sim.check('vec', { label: 'Vector velocidad', value: true });
    sim.out('v', 'Rapidez <i>v</i>', { hl: true });
    sim.out('y', 'Altura <i>y</i>');
    sim.out('K', 'Energía cinética <i>K</i>');
    sim.out('U', 'Energía potencial <i>U</i> = <i>mgy</i>');
    sim.out('Th', 'Energía térmica');
    sim.out('E', 'Energía total', { hl: true });
    sim.presets([
      { id: 'valle', label: 'Valle sin fricción', v: { tr: 'valle', mu: 0, pl: 'tierra', x0: -5 } },
      { id: 'montana', label: 'Montaña rusa (sale desde lo alto)', v: { tr: 'montana', mu: 0, pl: 'tierra', x0: -5.9 } },
      { id: 'doble', label: 'Doble valle: ¿pasa la colina central?', v: { tr: 'doble', mu: 0, pl: 'tierra', x0: -3.2 }, note: 'Si parte por debajo de la cima central (2.2 m) queda atrapado en un valle.' },
      { id: 'friccion', label: 'Medio tubo con fricción', v: { tr: 'rampa', mu: 0.04, pl: 'tierra', x0: -5 } },
      { id: 'luna', label: 'La misma pista en la Luna', v: { tr: 'valle', mu: 0, pl: 'luna', x0: -5 }, note: 'Todo ocurre más despacio, pero sube a la misma altura.' }
    ]);
    const F = () => TRACKS[sim.p.tr].f;
    const d1 = (f, x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
    const d2 = (f, x) => (f(x + 1e-3) - 2 * f(x) + f(x - 1e-3)) / 1e-6;
    const g = () => MC.gOf(sim.p.pl);
    let dragging = false;
    MC.handles(sim, cv, view, () => [{ id: 's', x: s.x, y: F()(s.x) + 0.35, r: 22 }], (id, wx) => {
      dragging = true;
      sim.pause();
      const x = M.clamp(wx, -5.9, 5.9);
      sim.ctl.x0.set(Math.round(x * 20) / 20, true);
      sim.reset();
    }, { up: () => { dragging = false; } });
    sim.hint('Arrastre al patinador y presione Iniciar', cv);
    sim.run({
      reset() { s.x = sim.p.x0; s.v = 0; s.Eth = 0; H.clear(); pushE(0); },
      step(h) {
        const f = F(), G2 = g(), mu = sim.p.mu;
        const der = (t, y) => {
          const d = d1(f, y[0]), c = 1 / Math.sqrt(1 + d * d), sn = d * c;
          const kap = d2(f, y[0]) * c * c * c;
          const n = G2 * c + kap * y[1] * y[1];
          let a = -G2 * sn;
          if (mu > 0 && Math.abs(y[1]) > 1e-6) a -= Math.sign(y[1]) * mu * Math.abs(n);
          return [y[1] * c, a];
        };
        const y = M.rk4(der, [s.x, s.v], 0, h);
        /* energía térmica por diferencia de energía mecánica */
        const E0 = 0.5 * s.v * s.v + G2 * f(s.x);
        let E1 = 0.5 * y[1] * y[1] + G2 * f(y[0]);
        if (mu > 0 && E1 > E0) E1 = E0;
        s.Eth += mu > 0 ? Math.max(0, E0 - E1) : 0;
        if (mu > 0 && Math.sign(y[1]) !== Math.sign(s.v) && s.v !== 0) {
          /* ¿queda en reposo por fricción estática? */
          const d = d1(f, y[0]);
          if (Math.abs(d) <= mu) { s.x = y[0]; s.v = 0; pushE(sim.t + h); sim.end(); return; }
        }
        s.x = M.clamp(y[0], -6.2, 6.2); s.v = y[1];
        if (mu > 0 && 0.5 * s.v * s.v < 1e-5 && Math.abs(d1(f, s.x)) < 0.02) { s.v = 0; pushE(sim.t + h); sim.end(); return; }
        pushE(sim.t + h);
        if (sim.t > 300) sim.end();
      },
      h: 1 / 800
    });
    function pushE(t) {
      const m = sim.p.m, G2 = g();
      H.push(t, { K: 0.5 * m * s.v * s.v, U: m * G2 * F()(s.x), Th: m * s.Eth }, true);
    }
    sim.onChange = (id) => { if (id === 'm' || id === 'pl') { if (!sim.playing) sim.reset(); } };
    sim.onDraw(() => {
      const p = sim.p, f = F(), m = p.m, G2 = g();
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: 'y', unit: 'm' });
      /* pista */
      const pts = [];
      for (let x = -6.2; x <= 6.2; x += 0.05) pts.push([view.X(x), view.Y(f(x))]);
      ctx.save();
      ctx.fillStyle = MC.alpha('--ground-fill', 0.9);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], cv.h);
      pts.forEach((q) => ctx.lineTo(q[0], q[1]));
      ctx.lineTo(pts[pts.length - 1][0], cv.h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      D.poly(ctx, pts, { color: '--ink-2', width: 4 });
      /* patinador */
      const d = d1(f, s.x), c = 1 / Math.sqrt(1 + d * d);
      const nx = -d * c, ny = c;
      const X = view.X(s.x + nx * 0.32), Y = view.Y(f(s.x) + ny * 0.32);
      D.ball(ctx, X, Y, view.L(0.3), { fill: '--body-c', mark: -Math.atan(d) + s.x * 3 });
      if (p.vec && Math.abs(s.v) > 0.05) D.vec(ctx, X, Y, s.v * c * view.L(0.25), -s.v * d * c * view.L(0.25), { color: '--vel', label: 'v' });
      /* altura */
      D.line(ctx, X, Y, X, view.Y(0), { color: '--ink-3', dash: [2, 4], width: 1 });
      /* barras de energía */
      const K = 0.5 * m * s.v * s.v, U = m * G2 * f(s.x), Th = m * s.Eth;
      const Etot = K + U + Th;
      const Emax = MC.niceCeil(Math.max(m * G2 * 8, Etot) * 1.02);
      D.bars(ctx, [{ label: 'K', value: K, color: '--K' }, { label: 'U_g', value: U, color: '--Ug' }, { label: 'E_{tér}', value: Th, color: '--Eth' }], { x: cv.w / 2 - 85, y: 8, w: 170, h: Math.min(170, cv.h * 0.45), max: Emax, title: 'ENERGÍA (J)', total: { label: 'E', value: Etot, color: '--Etot' }, fmt: (v) => MC.fix(v, 0) });
      /* gráfica de energía contra posición */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = EP || (EP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: -6.2, xmax: 6.2, ymin: 0, ymax: Emax, xlabel: ['x', 'm'], ylabel: ['E', 'J'], mb: 34, mt: 10, ml: 58 });
      P.frame();
      const Emec = K + U;
      P.fn((x) => m * G2 * f(x), { color: '--Ug', width: 2.4, fill: '--Ug', fillAlpha: 0.08 });
      P.hline(Emec, { color: '--Etot', dash: [6, 4], width: 1.6, label: 'E mecánica = K + U', labelRight: true });
      P.xy([s.x, s.x], [U, Emec], { color: '--K', width: 5 });
      P.dot(s.x, U, { color: '--c8', r: 4.5 });
      P.legend([{ label: 'U(x)', color: '--Ug' }, { label: 'K (barra)', color: '--K' }], 'tl');
      sim.set('v', `${f2(Math.abs(s.v))} m/s`);
      sim.set('y', `${f2(f(s.x))} m`);
      sim.set('K', `${f0(K)} J`);
      sim.set('U', `${f0(U)} J`);
      sim.set('Th', `${f0(Th)} J`);
      sim.set('E', `${f0(Etot)} J`);
      void dragging;
    });
  });

  /* ======================================================================
     8.4  Bloque lanzado por un resorte
     ====================================================================== */
  MC.defineSim('resorte-bloque', function (sim) {
    const cv = sim.canvas({ aspect: 2.7, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const view = new MC.View2D(cv, { xmin: -1, xmax: 5, ymin: -0.5, ymax: 1.6 });
    const H = new MC.History(['Ue', 'K', 'Ug', 'Th']);
    const gE = new MC.TGraph({ ylabel: ['E', 'J'], series: [{ key: 'Ue', label: 'U_e', unit: 'J', color: '--Ue', fmt: f2 }, { key: 'K', label: 'K', unit: 'J', color: '--K', fmt: f2 }, { key: 'Ug', label: 'U_g', unit: 'J', color: '--Ug', fmt: f2 }, { key: 'Th', label: 'E_tér', unit: 'J', color: '--Eth', fmt: f2 }], legend: 'tr', tspan: 3 });
    MC.hover(sim, gc, [gE]);
    const s = { x: -0.1, v: 0, Th: 0, maxx: 0 };
    const XR = 1.0;
    sim.group('Resorte');
    sim.slider('k', { label: 'Constante <i>k</i>', min: 50, max: 2000, step: 10, value: 200, unit: 'N/m', fmt: f0, reset: true });
    sim.slider('x0', { label: 'Compresión inicial', min: 0.02, max: 0.3, step: 0.005, value: 0.1, unit: 'm', fmt: (v) => MC.fix(v, 3), reset: true });
    sim.group('Bloque y superficie');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.05, max: 5, step: 0.01, value: 0.1, unit: 'kg', fmt: f2, reset: true });
    sim.slider('mu', { label: 'Fricción μ<sub>k</sub> (a partir de x = 0)', min: 0, max: 0.6, step: 0.01, value: 0.3, fmt: f2, reset: true });
    sim.slider('th', { label: 'Rampa después de 1 m (0 = sin rampa)', min: 0, max: 60, step: 1, value: 0, unit: '°', fmt: f0, reset: true });
    sim.out('Ue0', 'Energía elástica inicial ½<i>kx</i>₀²');
    sim.out('v1', 'Rapidez al soltarse del resorte');
    sim.out('d', 'Distancia máxima alcanzada', { hl: true });
    sim.out('Th', 'Energía térmica generada');
    sim.out('E', 'Energía total (constante)', { hl: true });
    sim.presets([
      { id: 'juguete', label: 'Juguete de resorte sobre una mesa', v: { k: 200, x0: 0.1, m: 0.1, mu: 0.3, th: 0 }, note: 'Los 1.0 J elásticos se convierten en calor a lo largo de 3.4 m.' },
      { id: 'rampa', label: 'Lanzador con rampa de 30°', v: { k: 500, x0: 0.15, m: 0.5, mu: 0.2, th: 30 } },
      { id: 'ideal', label: 'Sin fricción: ida y vuelta para siempre', v: { k: 200, x0: 0.1, m: 0.2, mu: 0, th: 20 }, note: 'La energía oscila entre elástica, cinética y potencial gravitacional sin perderse.' },
      { id: 'pinball', label: 'Lanzador de pinball (mesa inclinada 7°)', v: { k: 300, x0: 0.08, m: 0.08, mu: 0.05, th: 7 } }
    ]);
    const geo = (x) => {
      const th = M.rad(sim.p.th);
      if (x <= XR || th === 0) return { X: x, Y: 0, h: 0, slope: 0 };
      const sl = x - XR;
      return { X: XR + sl * Math.cos(th), Y: sl * Math.sin(th), h: sl * Math.sin(th), slope: th };
    };
    sim.run({
      reset() { s.x = -sim.p.x0; s.v = 0; s.Th = 0; s.maxx = 0; H.clear(); push(0); },
      step(h) {
        const p = sim.p, th = M.rad(p.th);
        /* aceleración en x con velocidad v (Verlet de velocidad: conserva bien la energía) */
        const acc = (x, v) => {
          if (x < 0) return (-p.k * x) / p.m;
          const onR = x > XR && th > 0;
          const sn = onR ? Math.sin(th) : 0, cs = onR ? Math.cos(th) : 1;
          const fr = p.mu * G * cs;
          if (Math.abs(v) < 1e-6) return G * sn <= fr ? 0 : -G * sn + fr;
          return -G * sn - Math.sign(v) * fr;
        };
        if (s.x >= 0 && Math.abs(s.v) < 1e-6 && acc(s.x, 0) === 0 && sim.t > 0) { s.v = 0; push(sim.t + h); sim.end(); return; }
        const x0 = s.x, v0 = s.v;
        const a0 = acc(x0, v0);
        s.x = x0 + v0 * h + 0.5 * a0 * h * h;
        const a1 = acc(s.x, v0 + a0 * h);
        let vn = v0 + 0.5 * (a0 + a1) * h;
        if (x0 >= 0 && s.x >= 0 && v0 !== 0 && Math.sign(vn) !== Math.sign(v0) && p.mu > 0) vn = 0;
        s.v = vn;
        /* energía térmica: fricción sólo en la parte x ≥ 0 del recorrido */
        const dist = Math.abs(Math.max(s.x, 0) - Math.max(x0, 0));
        if (dist > 0) s.Th += p.mu * p.m * G * (s.x > XR && th > 0 ? Math.cos(th) : 1) * dist;
        s.maxx = Math.max(s.maxx, s.x);
        push(sim.t + h);
        if (sim.t > 60) sim.end();
      },
      h: 1 / 2000
    });
    function push(t) {
      const p = sim.p;
      const Ue = s.x < 0 ? 0.5 * p.k * s.x * s.x : 0;
      H.push(t, { Ue, K: 0.5 * p.m * s.v * s.v, Ug: p.m * G * geo(s.x).h, Th: s.Th });
    }
    sim.onDraw(() => {
      const p = sim.p, th = M.rad(p.th);
      const E0 = 0.5 * p.k * p.x0 * p.x0;
      const d = (E0 / (p.m * G * Math.max(1e-6, p.mu))) || 0;
      const gq = geo(s.x);
      const span = Math.max(3, Math.min(12, (p.mu > 0 ? Math.min(d, 12) : 6) + 1.5));
      view.setRange({ xmin: Math.min(-0.6, gq.X - span * 0.5), xmax: Math.max(span, gq.X + span * 0.5), ymin: -0.4, ymax: Math.max(1.2, gq.Y + 0.8) });
      const ctx = cv.ctx;
      D.clear(cv);
      /* suelo y rampa */
      ctx.save();
      ctx.fillStyle = MC.col('--ground-fill');
      ctx.beginPath();
      ctx.moveTo(view.X(-2), view.Y(0)); ctx.lineTo(view.X(XR), view.Y(0));
      if (th > 0) ctx.lineTo(view.X(XR + 30 * Math.cos(th)), view.Y(30 * Math.sin(th)));
      else ctx.lineTo(view.X(100), view.Y(0));
      ctx.lineTo(view.X(100), cv.h); ctx.lineTo(view.X(-2), cv.h); ctx.closePath(); ctx.fill();
      ctx.restore();
      D.line(ctx, view.X(-2), view.Y(0), view.X(0), view.Y(0), { color: '--ink-2', width: 1.5 });
      D.line(ctx, view.X(0), view.Y(0), view.X(XR), view.Y(0), { color: '--fric', width: 3 });
      if (th > 0) D.line(ctx, view.X(XR), view.Y(0), view.X(XR + 30 * Math.cos(th)), view.Y(30 * Math.sin(th)), { color: '--fric', width: 3 });
      else D.line(ctx, view.X(XR), view.Y(0), view.X(100), view.Y(0), { color: '--fric', width: 3 });
      MC.text(ctx, 'zona con fricción', view.X(0.1), view.Y(0) + 16, { size: 10.5, color: '--fric' });
      for (let x = Math.ceil(view.x0); x <= view.x1; x += 1) if (x >= 0) { D.line(ctx, view.X(x), view.Y(0) + 2, view.X(x), view.Y(0) + 7, { color: '--ink-3', width: 1 }); MC.text(ctx, `${x} m`, view.X(x), view.Y(0) + 28, { size: 10, mono: true, align: 'center', color: '--ink-3' }); }
      /* pared y resorte */
      const wallX = -0.6;
      D.wall(ctx, view.X(wallX), view.Y(0.35), view.Y(0), 'left');
      const bw = 0.16, bh = 0.14;
      const sEnd = Math.min(s.x, 0);
      D.spring(ctx, view.X(wallX), view.Y(bh / 2), view.X(sEnd), view.Y(bh / 2), { n: 10, amp: 7, color: '--tension', width: 2 });
      /* bloque: x es la posición de su cara trasera */
      const cp = geo(s.x + bw / 2);
      const cxw = cp.X - (bh / 2) * Math.sin(cp.slope), cyw = cp.Y + (bh / 2) * Math.cos(cp.slope);
      D.block(ctx, view.X(cxw), view.Y(cyw), view.L(bw), view.L(bh), { fill: '--body-a', ang: cp.slope });
      if (Math.abs(s.v) > 0.02) D.vec(ctx, view.X(gq.X), view.Y(gq.Y + 0.35), s.v * Math.cos(gq.slope) * 22, -s.v * Math.sin(gq.slope) * 22, { color: '--vel', label: 'v' });
      /* barras */
      const Ue = s.x < 0 ? 0.5 * p.k * s.x * s.x : 0, K = 0.5 * p.m * s.v * s.v, Ug = p.m * G * gq.h;
      D.bars(ctx, [{ label: 'U_e', value: Ue, color: '--Ue' }, { label: 'K', value: K, color: '--K' }, { label: 'U_g', value: Ug, color: '--Ug' }, { label: 'E_{tér}', value: s.Th, color: '--Eth' }], { x: cv.w - 214, y: 6, w: 208, h: cv.h - 12, max: MC.niceCeil(E0 * 1.05), title: 'ENERGÍA (J)', total: { label: 'E', value: Ue + K + Ug + s.Th, color: '--Etot' }, fmt: (v) => MC.fix(v, 2) });
      /* gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      gE.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h, mb: 34 }, H, { t: sim.t, yExtra: [E0 * 1.05], after: (P) => P.hline(E0, { color: '--Etot', dash: [6, 4], label: 'energía total', labelRight: true }) });
      const v1 = p.x0 * Math.sqrt(p.k / p.m);
      sim.set('Ue0', `${MC.fix(E0, 3)} J`);
      sim.set('v1', `${f2(v1)} m/s`);
      sim.set('d', th > 0 && s.maxx > XR ? `${f2(s.maxx)} m (altura ${f2(geo(s.maxx).h)} m)` : `${f2(Math.max(0, s.maxx))} m`);
      sim.set('Th', `${MC.fix(s.Th, 3)} J`);
      sim.set('E', `${MC.fix(Ue + K + Ug + s.Th, 3)} J`);
    });
  });

  /* ======================================================================
     8.5  Diagrama de energía potencial
     ====================================================================== */
  const POT = {
    resorte: { label: 'Resorte: U = ½kx²', U: (x) => x * x, xr: [-3.2, 3.2], Er: [0.1, 9], E: 4, x0: 0 },
    doble: { label: 'Doble pozo: U = x⁴/4 − 2x² + 4', U: (x) => x ** 4 / 4 - 2 * x * x + 4, xr: [-3.2, 3.2], Er: [0.1, 9], E: 3, x0: -2 },
    molecula: { label: 'Molécula diatómica (Lennard-Jones)', U: (x) => 4 * (Math.pow(1 / x, 12) - Math.pow(1 / x, 6)), xr: [0.95, 3.5], Er: [-0.98, 1.2], E: -0.5, x0: 1.12 },
    paisaje: { label: 'Paisaje de colinas', U: (x) => 2.2 + 1.4 * Math.sin(1.3 * x) + 0.09 * x * x, xr: [-5.5, 5.5], Er: [0.3, 6], E: 3, x0: -1.2 }
  };
  MC.defineSim('diagrama-energia', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const gc = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const s = { x: 0, v: 0 };
    let UP = null, FP = null;
    sim.group('Energía potencial');
    sim.select('pot', {
      label: 'Función U(x)', value: 'doble', options: Object.keys(POT).map((k) => [k, POT[k].label]), reset: true,
      onInput: (k) => { const q = POT[k]; sim.ctl.E.range(q.Er[0], q.Er[1], 0.01); sim.ctl.E.set(q.E, true); sim.ctl.x0.range(q.xr[0] + 0.05, q.xr[1] - 0.05, 0.01); sim.ctl.x0.set(q.x0, true); }
    });
    sim.slider('E', { label: 'Energía total <i>E</i>', min: 0.1, max: 9, step: 0.01, value: 3, unit: 'J', fmt: f2, reset: true });
    sim.slider('x0', { label: 'Posición inicial <i>x</i>₀', min: -3.15, max: 3.15, step: 0.01, value: -2, unit: 'm', fmt: f2, reset: true });
    sim.check('fr', { label: 'Con fricción (la energía se disipa)', value: false });
    sim.out('E', 'Energía mecánica <i>E</i>', { hl: true });
    sim.out('U', 'Energía potencial <i>U</i>(<i>x</i>)');
    sim.out('K', 'Energía cinética <i>K</i> = <i>E</i> − <i>U</i>');
    sim.out('F', 'Fuerza <i>F</i> = −<i>dU</i>/<i>dx</i>');
    sim.out('tp', 'Puntos de retorno');
    sim.out('eq', 'Equilibrios');
    sim.presets([
      { id: 'dobleBajo', label: 'Doble pozo con poca energía', v: { pot: 'doble', E: 2.5, x0: -2 }, fn: (q) => q.ctl.pot.set('doble', true) },
      { id: 'dobleAlto', label: 'Doble pozo con energía suficiente para cruzar', v: { pot: 'doble', E: 5, x0: -2 } },
      { id: 'cima', label: 'Energía igual a la cima: equilibrio inestable', v: { pot: 'doble', E: 4.0, x0: -2.8 } },
      { id: 'molecula', label: 'Vibración de una molécula', v: { pot: 'molecula', E: -0.6, x0: 1.12 } },
      { id: 'disocia', label: 'La molécula se disocia (E > 0)', v: { pot: 'molecula', E: 0.3, x0: 1.12 } }
    ]);
    sim.onChange = (id) => {
      if (id === 'preset') { const q = POT[sim.p.pot]; sim.ctl.E.range(q.Er[0], q.Er[1], 0.01); sim.ctl.x0.range(q.xr[0] + 0.05, q.xr[1] - 0.05, 0.01); }
    };
    const U = (x) => POT[sim.p.pot].U(x);
    const dU = (x) => (U(x + 1e-5) - U(x - 1e-5)) / 2e-5;
    sim.run({
      reset() {
        s.x = sim.p.x0;
        let E = sim.p.E;
        if (E < U(s.x)) { E = U(s.x); sim.ctl.E.set(Math.min(E, sim.ctl.E.input.max * 1), true); }
        s.v = Math.sqrt(Math.max(0, 2 * (E - U(s.x))));
      },
      step(h) {
        const b = sim.p.fr ? 0.25 : 0;
        const f = (t, y) => [y[1], -dU(y[0]) - b * y[1]];
        const y = M.rk4(f, [s.x, s.v], 0, h);
        s.x = y[0]; s.v = y[1];
        const q = POT[sim.p.pot];
        if (s.x > q.xr[1] + 0.5 || s.x < q.xr[0] - 0.5) sim.end();
        if (sim.t > 200) sim.end();
      },
      h: 1 / 1000
    });
    function roots(fn, a, b, n = 800) {
      const out = [];
      let xp = a, fp = fn(a);
      for (let i = 1; i <= n; i++) {
        const x = a + ((b - a) * i) / n, fx = fn(x);
        if (fp === 0) out.push(xp);
        else if (fp * fx < 0) out.push(M.bisect(fn, xp, x, 1e-9));
        xp = x; fp = fx;
      }
      return out;
    }
    sim.onDraw(() => {
      const q = POT[sim.p.pot];
      const [xa, xb] = q.xr;
      const ctx = cv.ctx;
      D.clear(cv);
      const E = 0.5 * s.v * s.v + U(s.x);
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i <= 200; i++) { const x = xa + ((xb - xa) * i) / 200; const u = U(x); ymin = Math.min(ymin, u); ymax = Math.max(ymax, Math.min(u, q.Er[1] * 1.3)); }
      ymax = Math.max(ymax, E);
      const [ya, yb] = MC.niceRange(ymin, ymax, { zero: false, pad: 0.08 });
      const P = UP || (UP = new MC.Plot(ctx));
      P.ctx = ctx;
      P.set({ x: 0, y: 0, w: cv.w, h: cv.h, xmin: xa, xmax: xb, ymin: ya, ymax: yb, xlabel: ['x', 'm'], ylabel: ['E', 'J'], mb: 34, mt: 12 });
      P.frame();
      /* regiones prohibidas */
      const n = 300;
      P.clip(() => {
        ctx.fillStyle = MC.alpha('--weight', 0.1);
        for (let i = 0; i < n; i++) { const x = xa + ((xb - xa) * (i + 0.5)) / n; if (U(x) > E) ctx.fillRect(P.X(xa + ((xb - xa) * i) / n), P.iy, P.iw / n + 1, P.ih); }
      });
      P.fn(U, { color: '--Ug', width: 2.6 });
      P.hline(E, { color: '--Etot', dash: [7, 4], width: 1.8, label: `E = ${f2(E)} J`, labelRight: true });
      const tps = roots((x) => U(x) - E, xa, xb);
      tps.forEach((x) => P.vline(x, { color: '--c8', dash: [3, 3], y1: E, y0: ya }));
      const eqs = roots(dU, xa + 0.01, xb - 0.01).filter((x) => U(x) < yb);
      eqs.forEach((x) => {
        const c2 = (U(x + 1e-3) - 2 * U(x) + U(x - 1e-3)) / 1e-6;
        P.dot(x, U(x), { color: c2 > 0 ? '--vel' : '--weight', r: 5.5, label: c2 > 0 ? 'estable' : 'inestable', dy: c2 > 0 ? 18 : -9, align: 'center', dx: 0 });
      });
      /* partícula y su energía cinética */
      P.xy([s.x, s.x], [U(s.x), E], { color: '--K', width: 6 });
      P.dot(s.x, U(s.x), { color: '--c8', r: 7 });
      /* fuerza */
      const gctx = gc.ctx;
      D.clear(gc);
      const Fp = FP || (FP = new MC.Plot(gctx));
      Fp.ctx = gctx;
      let fm = 0;
      for (let i = 0; i <= 200; i++) { const x = xa + ((xb - xa) * i) / 200; if (U(x) < yb) fm = Math.max(fm, Math.abs(dU(x))); }
      fm = MC.niceCeil(Math.min(fm, 40) || 1);
      Fp.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: xa, xmax: xb, ymin: -fm, ymax: fm, xlabel: ['x', 'm'], ylabel: ['F', 'N'], mb: 34, mt: 10 });
      Fp.frame();
      Fp.fn((x) => -dU(x), { color: '--force', width: 2.2 });
      Fp.dot(s.x, -dU(s.x), { color: '--force', r: 5 });
      eqs.forEach((x) => Fp.vline(x, { color: '--ink-3', dash: [2, 3] }));
      sim.set('E', `${f2(E)} J`);
      sim.set('U', `${f2(U(s.x))} J`);
      sim.set('K', `${f2(E - U(s.x))} J`);
      sim.set('F', `${f2(-dU(s.x))} N`);
      sim.set('tp', tps.length ? tps.map((x) => f2(x)).join(', ') + ' m' : 'ninguno (no está ligada)');
      sim.set('eq', eqs.length ? eqs.map((x) => f2(x)).join(', ') + ' m' : '—');
    });
  });
})();
