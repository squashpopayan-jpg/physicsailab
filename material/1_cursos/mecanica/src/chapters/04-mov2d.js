/* Capítulo 4 — Movimiento en dos dimensiones */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2);
  const RHO = 1.2;

  /* ======================================================================
     4.2  Proyectiles con y sin aire
     ====================================================================== */
  const OBJ = {
    ideal: { label: 'Partícula ideal (sin aire)', m: 1, d: 10, cd: 0.47 },
    futbol: { label: 'Balón de fútbol', m: 0.43, d: 22, cd: 0.25 },
    beisbol: { label: 'Pelota de béisbol', m: 0.145, d: 7.4, cd: 0.35 },
    golf: { label: 'Pelota de golf', m: 0.046, d: 4.3, cd: 0.25 },
    pingpong: { label: 'Pelota de ping-pong', m: 0.0027, d: 4.0, cd: 0.5 },
    bala: { label: 'Bala de atletismo (7.26 kg)', m: 7.26, d: 12, cd: 0.47 }
  };
  const TRAIL_COLS = ['--c1', '--c4', '--c5', '--c3', '--c8', '--c7'];

  MC.defineSim('proyectil', function (sim) {
    const cv = sim.canvas({ aspect: 1.85 });
    const gc = sim.canvas({ aspect: 3.3, cls: 'fixed' });
    const view = new MC.View2D(cv, { xmin: -3, xmax: 45, ymin: -1, ymax: 20, align: 'bottom left', padL: 8, padB: 8, padT: 10, padR: 10 });
    const H = new MC.History(['x', 'y', 'vx', 'vy'], { minDt: 1 / 60 });
    const gP = new MC.TGraph({ ylabel: ['x, y', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--c1', fmt: f2 }, { key: 'y', label: 'y', unit: 'm', color: '--c4', fmt: f2 }], legend: 'tl' });
    const gV = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'vx', label: 'v_x', unit: 'm/s', color: '--c1', fmt: f2 }, { key: 'vy', label: 'v_y', unit: 'm/s', color: '--c4', fmt: f2 }], legend: 'tr' });
    MC.hover(sim, gc, [gP, gV]);
    const s = { x: 0, y: 0, vx: 0, vy: 0, apex: null };
    let pred = null, noair = null, strobe = [], trails = [], tc = 0;

    sim.group('Lanzamiento');
    sim.slider('v0', { label: 'Rapidez inicial <i>v</i>₀', min: 0, max: 60, step: 0.5, value: 20, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('ang', { label: 'Ángulo de lanzamiento θ', min: -30, max: 90, step: 0.5, value: 45, unit: '°', fmt: f1, reset: true });
    sim.slider('h0', { label: 'Altura inicial <i>h</i>₀', min: 0, max: 60, step: 0.1, value: 0, unit: 'm', fmt: f1, reset: true });
    sim.select('pl', { label: 'Lugar', value: 'tierra', options: MC.planetOptions(['tierra', 'luna', 'marte', 'jupiter']), reset: true });
    sim.group('Resistencia del aire');
    sim.check('aire', { label: 'Incluir resistencia del aire', value: false, reset: true });
    sim.select('obj', {
      label: 'Objeto', value: 'futbol', options: Object.keys(OBJ).filter((k) => k !== 'ideal').map((k) => [k, OBJ[k].label]), reset: true,
      onInput: (k) => { const o = OBJ[k]; sim.ctl.m.set(o.m, true); sim.ctl.d.set(o.d, true); sim.ctl.cd.set(o.cd, true); }
    });
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.002, max: 10, step: 0.001, value: 0.43, unit: 'kg', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.slider('d', { label: 'Diámetro', min: 2, max: 30, step: 0.1, value: 22, unit: 'cm', fmt: f1, reset: true });
    sim.slider('cd', { label: 'Coeficiente de arrastre <i>C</i><sub>D</sub>', min: 0.05, max: 1.2, step: 0.01, value: 0.25, fmt: f2, reset: true });
    sim.check('comp', { label: 'Mostrar trayectoria sin aire para comparar', value: true });
    sim.group('Mostrar');
    sim.check('vec', { label: 'Vectores <i>v</i> (con componentes) y <i>a</i>', value: true });
    sim.check('st', { label: 'Imágenes estroboscópicas', value: true });
    sim.slider('dts', { label: 'Intervalo entre imágenes', min: 0.05, max: 1, step: 0.05, value: 0.25, unit: 's', fmt: f2 });
    sim.check('vst', { label: 'Velocidad en cada imagen', value: false });
    sim.check('pred', { label: 'Trayectoria prevista (antes de lanzar)', value: false });
    sim.button('Ángulo complementario', () => {
      if (sim.p.ang > 0 && sim.p.ang < 90) { sim.ctl.ang.set(90 - sim.p.ang); sim.play(); }
    }, { newRow: true });
    sim.button('Borrar trayectorias', () => { trails = []; fitView(); });
    const setAirVis = () => { ['obj', 'm', 'd', 'cd', 'comp'].forEach((k) => sim.ctl[k].show(sim.p.aire)); };
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('xy', 'Posición (<i>x</i>, <i>y</i>)');
    sim.out('v', 'Velocidad (<i>v<sub>x</sub></i>, <i>v<sub>y</sub></i>)');
    sim.out('sp', 'Rapidez |<i>v</i>|');
    sim.outSep('Resultados del lanzamiento');
    sim.out('T', 'Tiempo de vuelo', { hl: true });
    sim.out('R', 'Alcance horizontal', { hl: true });
    sim.out('Hm', 'Altura máxima', { hl: true });
    sim.out('imp', 'Llega al suelo con');
    sim.legend([{ color: '--vel', label: 'velocidad y sus componentes', kind: 'arrow' }, { color: '--acc', label: 'aceleración', kind: 'arrow' }, { color: '--ink-3', label: 'sin aire (comparación)', kind: 'dash' }]);

    const g = () => MC.gOf(sim.p.pl);
    const kdrag = () => {
      if (!sim.p.aire) return 0;
      const r = sim.p.d / 200;
      return (0.5 * RHO * sim.p.cd * Math.PI * r * r) / sim.p.m;
    };
    const deriv = (k, G) => (t, y) => {
      const sp = Math.hypot(y[2], y[3]);
      return [y[2], y[3], -k * sp * y[2], -G - k * sp * y[3]];
    };
    /* integra toda la trayectoria: devuelve puntos, tiempo de vuelo, alcance, altura máxima e impacto */
    function simulate(k) {
      const G = g(), th = M.rad(sim.p.ang);
      let y = [0, sim.p.h0, sim.p.v0 * Math.cos(th), sim.p.v0 * Math.sin(th)];
      const pts = [[y[0], y[1]]];
      let t = 0, hmax = y[1], apex = [y[0], y[1]];
      const h = 1 / 300, f = deriv(k, G);
      if (sim.p.h0 <= 0 && y[3] <= 0) return { pts, T: 0, R: 0, H: sim.p.h0, apex, vimp: [y[2], y[3]] };
      for (let i = 0; i < 400000; i++) {
        const yn = M.rk4(f, y, t, h);
        if (yn[1] < 0 && t > 0) {
          const fr = y[1] / (y[1] - yn[1]);
          const last = y.map((v, j) => v + (yn[j] - v) * fr);
          t += h * fr;
          pts.push([last[0], 0]);
          return { pts, T: t, R: last[0], H: hmax, apex, vimp: [last[2], last[3]] };
        }
        y = yn; t += h;
        if (y[1] > hmax) { hmax = y[1]; apex = [y[0], y[1]]; }
        if (i % 6 === 0) pts.push([y[0], y[1]]);
      }
      return { pts, T: t, R: y[0], H: hmax, apex, vimp: [y[2], y[3]] };
    }
    function fitView() {
      let xm = 10, ym = 5;
      const acc = (p) => { xm = Math.max(xm, p[0]); ym = Math.max(ym, p[1]); };
      if (pred) pred.pts.forEach(acc);
      if (noair && sim.p.aire && sim.p.comp) noair.pts.forEach(acc);
      trails.forEach((tr) => tr.pts.forEach(acc));
      ym = Math.max(ym, sim.p.h0 * 1.05);
      view.setRange({ xmin: -0.07 * xm, xmax: xm * 1.05, ymin: -0.04 * ym, ymax: ym * 1.12 });
    }
    function addTrail(pts, label) {
      trails.push({ pts, color: TRAIL_COLS[tc++ % TRAIL_COLS.length], label });
      while (trails.length > 6) trails.shift();
    }
    sim.run({
      startLabel: 'Lanzar',
      reset() {
        const th = M.rad(sim.p.ang);
        s.x = 0; s.y = sim.p.h0; s.vx = sim.p.v0 * Math.cos(th); s.vy = sim.p.v0 * Math.sin(th);
        pred = simulate(kdrag());
        noair = sim.p.aire ? simulate(0) : null;
        strobe = [{ x: s.x, y: s.y, vx: s.vx, vy: s.vy }];
        H.clear(); H.push(0, s, true);
        setAirVis();
        fitView();
        const T = Math.max(1, MC.niceCeil((pred.T || 1) * 1.02));
        gP.set({ tmax: T }); gV.set({ tmax: T });
      },
      step(h) {
        const G = g(), k = kdrag();
        const y0 = [s.x, s.y, s.vx, s.vy];
        const y = M.rk4(deriv(k, G), y0, sim.t, h);
        const t = sim.t + h;
        if (y[1] < 0) {
          const fr = y0[1] / (y0[1] - y[1]);
          s.x = y0[0] + (y[0] - y0[0]) * fr; s.y = 0; s.vx = y0[2] + (y[2] - y0[2]) * fr; s.vy = y0[3] + (y[3] - y0[3]) * fr;
          H.push(sim.t + h * fr, s, true);
          addTrail(pred.pts.slice(), `${f1(sim.p.ang)}° · ${f1(sim.p.v0)} m/s`);
          sim.end();
          return;
        }
        s.x = y[0]; s.y = y[1]; s.vx = y[2]; s.vy = y[3];
        H.push(t, s);
        if (Math.floor((t + 1e-9) / sim.p.dts) > Math.floor((sim.t + 1e-9) / sim.p.dts)) strobe.push({ x: s.x, y: s.y, vx: s.vx, vy: s.vy });
      }
    });
    sim.presets([
      { id: 'saque', label: 'Saque de arco a 20 m/s y 36.9°', v: { v0: 20, ang: 36.87, h0: 0, pl: 'tierra', aire: false }, note: 'Sin aire: vuela 2.45 s, sube 7.35 m y cae a 39.2 m.' },
      { id: 'familia', label: 'Familia de parábolas (v₀ = 20 m/s)', v: { v0: 20, ang: 45, h0: 0, pl: 'tierra', aire: false }, fn: () => familia(), note: 'Mismo v₀: 45° llega más lejos; 15° y 75°, y también 30° y 60°, caen en el mismo punto.' },
      { id: 'manguera', label: 'Chorro de una manguera', v: { v0: 10, ang: 45, h0: 1, pl: 'tierra', aire: false } },
      { id: 'bala', label: 'Lanzamiento de bala (atletismo)', v: { v0: 13.7, ang: 38, h0: 2.1, pl: 'tierra', aire: false }, note: 'Sale a 2.1 m de altura: el alcance es de unos 21 m.' },
      { id: 'salto', label: 'Salto de longitud (centro de masa)', v: { v0: 9.5, ang: 20, h0: 0.7, pl: 'tierra', aire: false }, note: 'El centro de masa despega unos 0.7 m por encima de su altura al aterrizar y vuela unos 7.4 m; los pies agregan el resto hasta los 8 m.' },
      { id: 'horizontal', label: 'Lanzamiento horizontal desde un acantilado', v: { v0: 8, ang: 0, h0: 30, pl: 'tierra', aire: false }, note: 'Cae 30 m en 2.47 s, igual que si se soltara; mientras tanto avanza 19.8 m.' },
      { id: 'luna', label: 'Golf en la Luna', v: { v0: 30, ang: 45, h0: 0, pl: 'luna', aire: false }, note: 'Con g = 1.62 m/s²: 26 s de vuelo, 139 m de altura y 556 m de alcance.' },
      { id: 'beisbol', label: 'Batazo de béisbol con resistencia del aire', v: { v0: 45, ang: 35, h0: 1, pl: 'tierra', aire: true, obj: 'beisbol', m: 0.145, d: 7.4, cd: 0.35, comp: true }, note: 'Compare con la trayectoria punteada sin aire: el aire le quita casi la mitad del alcance.' },
      { id: 'futbol', label: 'Tiro libre de fútbol con aire', v: { v0: 28, ang: 25, h0: 0, pl: 'tierra', aire: true, obj: 'futbol', m: 0.43, d: 22, cd: 0.25, comp: true } },
      { id: 'pingpong', label: 'Pelota de ping-pong lanzada fuerte', v: { v0: 25, ang: 40, h0: 1, pl: 'tierra', aire: true, obj: 'pingpong', m: 0.0027, d: 4, cd: 0.5, comp: true }, note: 'Muy liviana para su tamaño: su velocidad terminal es de unos 8 m/s y cae casi en vertical.' }
    ]);
    function familia() {
      trails = [];
      const G = 9.8;
      for (const a of [15, 30, 45, 60, 75]) {
        const th = M.rad(a), vx = 20 * Math.cos(th), vy = 20 * Math.sin(th), T = (2 * vy) / G;
        const pts = [];
        for (let i = 0; i <= 80; i++) { const t = (T * i) / 80; pts.push([vx * t, vy * t - 0.5 * G * t * t]); }
        addTrail(pts, `${a}°`);
      }
    }
    sim.onChange = (id) => { if (id === 'aire' || id === 'preset') setAirVis(); };

    sim.onDraw(() => {
      const p = sim.p, G = g();
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: true, unit: 'm' });
      D.ground(ctx, 0, view.Y(0), cv.w, { depth: 12 });
      /* plataforma */
      if (p.h0 > 0.05) {
        const px = view.X(0), py = view.Y(p.h0);
        ctx.save();
        ctx.fillStyle = MC.col('--ground-fill');
        ctx.fillRect(0, py, px + 4, view.Y(0) - py);
        ctx.strokeStyle = MC.col('--ink-2');
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, py + 0.5); ctx.lineTo(px + 4, py + 0.5); ctx.lineTo(px + 4, view.Y(0)); ctx.stroke();
        ctx.restore();
        D.dim(ctx, px + 16, view.Y(0), px + 16, py, `h₀ = ${f1(p.h0)} m`, { labelOff: 0, dx: 38 });
      }
      /* trayectorias previas */
      trails.forEach((tr, i) => {
        D.poly(ctx, tr.pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: tr.color, width: 1.8, alpha: 0.75 });
        const e = tr.pts[tr.pts.length - 1];
        MC.text(ctx, tr.label, view.X(e[0]), view.Y(e[1]) - 8 - (i % 3) * 13, { size: 10.5, align: 'center', color: tr.color, halo: true, mono: true });
      });
      if (noair && p.aire && p.comp) D.poly(ctx, noair.pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      if (p.pred && pred && sim.t === 0) D.poly(ctx, pred.pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--c1', width: 1.4, dash: [3, 4], alpha: 0.8 });
      /* trayectoria recorrida */
      const T = H.d.t;
      if (T.length > 1) {
        const pts = [];
        for (let i = 0; i < T.length; i++) pts.push([view.X(H.d.x[i]), view.Y(H.d.y[i])]);
        D.poly(ctx, pts, { color: '--c1', width: 2.4 });
      }
      const kv = Math.min(0.2 * cv.w / Math.max(8, p.v0), 0.4 * view.s * Math.max(2, view.x1 - view.x0) / Math.max(8, p.v0) * 0.3);
      if (p.st) strobe.forEach((q) => {
        D.circle(ctx, view.X(q.x), view.Y(q.y), 3.2, { fill: '--c1', color: '--canvas', width: 1 });
        if (p.vst) D.vec(ctx, view.X(q.x), view.Y(q.y), q.vx * kv * 0.7, -q.vy * kv * 0.7, { color: '--vel', width: 1.6, alpha: 0.75, minLen: 3 });
      });
      /* cañón */
      const th = M.rad(p.ang), cx = view.X(0), cy = view.Y(p.h0);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-th);
      ctx.fillStyle = MC.col('--ink-2');
      ctx.fillRect(-6, -5, 30, 10);
      ctx.restore();
      D.circle(ctx, cx, cy, 7, { fill: '--metal', color: '--ink-2' });
      if (sim.t === 0) D.angle(ctx, cx, cy, 40, 0, th, { label: `θ = ${f1(p.ang)}°`, labelR: 30 });
      /* resultados sobre el dibujo */
      if (pred && pred.T > 0) {
        if (pred.H > p.h0 + 0.05) {
          D.line(ctx, view.X(pred.apex[0]), view.Y(pred.apex[1]), view.X(pred.apex[0]), view.Y(0), { color: '--ink-3', dash: [3, 4], width: 1 });
          MC.text(ctx, `H = ${f2(pred.H)} m`, view.X(pred.apex[0]), view.Y(pred.apex[1]) - 10, { size: 11.5, align: 'center', mono: true, color: '--ink-2', halo: true });
        }
        MC.text(ctx, `R = ${f2(pred.R)} m`, view.X(pred.R), view.Y(0) + 26, { size: 11.5, align: 'center', mono: true, color: '--ink-2', halo: true });
        D.line(ctx, view.X(pred.R), view.Y(0) - 5, view.X(pred.R), view.Y(0) + 12, { color: '--ink-2', width: 1.5 });
      }
      /* proyectil */
      const X = view.X(s.x), Y = view.Y(s.y);
      if (p.vec) {
        const sp = Math.hypot(s.vx, s.vy), k = kdrag();
        D.vec(ctx, X, Y, s.vx * kv, 0, { color: '--vel', width: 1.5, dash: [4, 3], minLen: 3 });
        D.vec(ctx, X, Y, 0, -s.vy * kv, { color: '--vel', width: 1.5, dash: [4, 3], minLen: 3 });
        D.vec(ctx, X, Y, s.vx * kv, -s.vy * kv, { color: '--vel', label: 'v', minLen: 3 });
        const ax = -k * sp * s.vx, ay = -G - k * sp * s.vy;
        const ka = (0.09 * cv.h) / Math.max(G, 1);
        D.vec(ctx, X, Y, ax * ka, -ay * ka, { color: '--acc', label: 'a', width: 2.2, minLen: 3 });
      }
      D.ball(ctx, X, Y, 6.5, { fill: '--body-a' });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      const vx0 = p.v0 * Math.cos(th), vy0 = p.v0 * Math.sin(th);
      if (!p.aire && pred) {
        gP.set({ fns: [{ f: (t) => vx0 * t, to: pred.T, color: '--c1', alpha: 0.5 }, { f: (t) => p.h0 + vy0 * t - 0.5 * G * t * t, to: pred.T, color: '--c4', alpha: 0.5 }] });
        gV.set({ fns: [{ f: () => vx0, to: pred.T, color: '--c1', alpha: 0.5 }, { f: (t) => vy0 - G * t, to: pred.T, color: '--c4', alpha: 0.5 }] });
      } else { gP.set({ fns: [] }); gV.set({ fns: [] }); }
      gP.draw(gctx, { x: 0, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      gV.draw(gctx, { x: gc.w / 2, y: 0, w: gc.w / 2, h: gc.h, mb: 34 }, H, { t: sim.t });
      /* lecturas */
      sim.set('t', `${f2(sim.t)} s`);
      sim.set('xy', `(${f2(s.x)}, ${f2(s.y)}) m`);
      sim.set('v', `(${f2(s.vx)}, ${f2(s.vy)}) m/s`);
      sim.set('sp', `${f2(Math.hypot(s.vx, s.vy))} m/s`);
      if (pred) {
        sim.set('T', `${f2(pred.T)} s`);
        sim.set('R', `${f2(pred.R)} m`);
        sim.set('Hm', `${f2(pred.H)} m`);
        const vi = Math.hypot(pred.vimp[0], pred.vimp[1]);
        sim.set('imp', `${f1(vi)} m/s a ${f1(M.deg(Math.atan2(-pred.vimp[1], pred.vimp[0])))}° bajo la horizontal`);
      }
    });
    setAirVis();
  });

  /* ======================================================================
     4.2b  El mono y el cazador
     ====================================================================== */
  MC.defineSim('mono-cazador', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const view = new MC.View2D(cv, { xmin: -1.5, xmax: 23, ymin: -0.6, ymax: 13, align: 'bottom left', padL: 6, padB: 8, padR: 8, padT: 8 });
    const d = { x: 0, y: 1, vx: 0, vy: 0 }, mk = { y: 10, v: 0 };
    let res = '', trail = [], mtrail = [];
    const st = sim.status(cv);
    sim.group('Situación');
    sim.slider('v0', { label: 'Rapidez del dardo <i>v</i>₀', min: 4, max: 40, step: 0.5, value: 16, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('D', { label: 'Distancia al árbol', min: 5, max: 30, step: 0.5, value: 18, unit: 'm', fmt: f1, reset: true });
    sim.slider('Hm', { label: 'Altura del mono', min: 3, max: 18, step: 0.5, value: 10, unit: 'm', fmt: f1, reset: true });
    sim.select('gg', { label: 'Gravedad', value: 'tierra', options: [['tierra', 'Tierra (9.8 m/s²)'], ['luna', 'Luna (1.62 m/s²)'], ['jupiter', 'Júpiter (24.79 m/s²)'], ['cero', 'Sin gravedad (0 m/s²)']], reset: true });
    sim.check('suelta', { label: 'El mono se suelta al oír el disparo', value: true, reset: true });
    sim.out('ang', 'Ángulo de tiro (apunta al mono)');
    sim.out('t', 'Tiempo hasta llegar al árbol');
    sim.out('drop', 'Caída ½<i>gt</i>² en ese tiempo');
    sim.out('res', 'Resultado', { hl: true });
    const G = () => (sim.p.gg === 'cero' ? 0 : MC.gOf(sim.p.gg));
    const aim = () => Math.atan2(sim.p.Hm - 1, sim.p.D);
    sim.run({
      startLabel: 'Disparar',
      reset() {
        const th = aim();
        d.x = 0; d.y = 1; d.vx = sim.p.v0 * Math.cos(th); d.vy = sim.p.v0 * Math.sin(th);
        mk.y = sim.p.Hm; mk.v = 0; res = ''; trail = [[0, 1]]; mtrail = [];
        st.hide();
        view.setRange({ xmax: sim.p.D + 3.5, ymax: sim.p.Hm + 2.5 });
      },
      step(h) {
        const g = G();
        const px = d.x;
        d.x += d.vx * h; d.y += d.vy * h - 0.5 * g * h * h; d.vy -= g * h;
        if (sim.p.suelta) { mk.y = Math.max(0.35, mk.y + mk.v * h - 0.5 * g * h * h); mk.v -= g * h; if (mk.y <= 0.35) mk.v = 0; }
        const t = sim.t + h;
        if (Math.floor(t / 0.1) > Math.floor(sim.t / 0.1)) { trail.push([d.x, d.y]); mtrail.push(mk.y); }
        if (d.y <= 0) { res = 'no alcanzó el árbol'; st.show('El dardo tocó el suelo antes de llegar', 'bad'); sim.end(); return; }
        if (px < sim.p.D - 0.3 && d.x >= sim.p.D - 0.3) {
          const miss = d.y - mk.y;
          if (Math.abs(miss) < 0.45) { res = '¡impacto!'; st.show('¡Impacto! El dardo y el mono cayeron lo mismo', 'good'); }
          else { res = `falló por ${f2(Math.abs(miss))} m (${miss < 0 ? 'por debajo' : 'por encima'})`; st.show(`Falló: pasó ${f2(Math.abs(miss))} m ${miss < 0 ? 'por debajo' : 'por encima'} del mono`, 'bad'); }
          sim.end();
        }
      }
    });
    sim.presets([
      { id: 'clasico', label: 'Experimento clásico', v: { v0: 16, D: 18, Hm: 10, gg: 'tierra', suelta: true } },
      { id: 'lento', label: 'Dardo lento (pero alcanza)', v: { v0: 11, D: 12, Hm: 8, gg: 'tierra', suelta: true } },
      { id: 'agarrado', label: 'El mono no se suelta', v: { v0: 16, D: 18, Hm: 10, gg: 'tierra', suelta: false }, note: 'El dardo pasa por debajo exactamente ½gt².' },
      { id: 'sin-g', label: 'Sin gravedad: línea recta', v: { v0: 12, D: 18, Hm: 10, gg: 'cero', suelta: true } }
    ]);
    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx, p = sim.p, g = G();
      D.clear(cv);
      view.grid({ labels: true, unit: 'm' });
      D.ground(ctx, 0, view.Y(0), cv.w, { depth: 12 });
      /* árbol */
      const tx = view.X(p.D + 0.9);
      ctx.save();
      ctx.fillStyle = MC.col('--wood');
      ctx.fillRect(tx - 7, view.Y(p.Hm + 1.6), 14, view.Y(0) - view.Y(p.Hm + 1.6));
      ctx.strokeStyle = MC.col('--wood');
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, view.Y(p.Hm + 0.75)); ctx.lineTo(view.X(p.D - 0.8), view.Y(p.Hm + 0.75)); ctx.stroke();
      ctx.fillStyle = MC.alpha('--body-d', 0.55);
      ctx.beginPath(); ctx.arc(tx, view.Y(p.Hm + 2.2), view.L(1.8), 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
      /* línea de mira */
      D.line(ctx, view.X(0), view.Y(1), view.X(p.D), view.Y(p.Hm), { color: '--ink-3', dash: [6, 5], width: 1.2 });
      MC.text(ctx, 'línea de mira', view.X(p.D * 0.45), view.Y(1 + (p.Hm - 1) * 0.45) - 10, { size: 11, color: '--ink-3', halo: true, align: 'center' });
      /* cazador */
      D.person(ctx, view.X(-0.5), view.Y(0), view.L(1.7), { arms: 0.9 });
      const th = aim();
      D.line(ctx, view.X(0), view.Y(1), view.X(0) + 26 * Math.cos(th), view.Y(1) - 26 * Math.sin(th), { color: '--ink', width: 4 });
      /* estelas */
      D.poly(ctx, trail.map((q) => [view.X(q[0]), view.Y(q[1])]).concat([[view.X(d.x), view.Y(d.y)]]), { color: '--c4', width: 1.8 });
      trail.forEach((q, i) => { if (i % 2 === 0) D.circle(ctx, view.X(q[0]), view.Y(q[1]), 2.4, { fill: '--c4' }); });
      mtrail.forEach((y, i) => { if (i % 2 === 0) D.circle(ctx, view.X(p.D), view.Y(y), 2.4, { fill: '--wood' }); });
      /* caída respecto a la línea de mira */
      if (sim.t > 0 && g > 0) {
        const yl = 1 + Math.tan(th) * d.x;
        if (yl - d.y > 0.25) D.dim(ctx, view.X(d.x) - 12, view.Y(yl), view.X(d.x) - 12, view.Y(d.y), '½gt²', { labelOff: 0, dx: -22, size: 11 });
        if (p.suelta && p.Hm - mk.y > 0.25) D.dim(ctx, view.X(p.D) + 30, view.Y(p.Hm), view.X(p.D) + 30, view.Y(mk.y), '½gt²', { labelOff: 0, dx: 24, size: 11 });
      }
      /* mono */
      const mx = view.X(p.D), my = view.Y(mk.y), r = Math.max(8, view.L(0.38));
      ctx.save();
      ctx.strokeStyle = MC.col('--wood');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx - r * 0.7, my - r * 0.5); ctx.lineTo(mx - r * 0.9, my - r * 1.7); ctx.moveTo(mx + r * 0.7, my - r * 0.5); ctx.lineTo(mx + r * 0.9, my - r * 1.7); ctx.stroke();
      ctx.restore();
      D.circle(ctx, mx - r * 0.75, my - r * 0.75, r * 0.35, { fill: '--wood' });
      D.circle(ctx, mx + r * 0.75, my - r * 0.75, r * 0.35, { fill: '--wood' });
      D.circle(ctx, mx, my, r, { fill: '--wood', color: '--ink-2', width: 1 });
      D.circle(ctx, mx, my + r * 0.2, r * 0.55, { fill: '--body-a' });
      /* dardo */
      const ang = Math.atan2(d.vy, d.vx);
      ctx.save();
      ctx.translate(view.X(d.x), view.Y(d.y));
      ctx.rotate(-ang);
      ctx.fillStyle = MC.col('--ink');
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -3); ctx.lineTo(-7, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
      const tt = p.D / (p.v0 * Math.cos(th));
      sim.set('ang', `${f1(M.deg(th))}°`);
      sim.set('t', `${f2(tt)} s`);
      sim.set('drop', `${f2(0.5 * g * tt * tt)} m`);
      sim.set('res', res || '—');
    });
  });

  /* ======================================================================
     4.3  Movimiento circular
     ====================================================================== */
  MC.defineSim('circular', function (sim) {
    sim.cols2('1fr 1fr');
    const cv = sim.canvas({ aspect: 1 });
    const gc = sim.canvas({ aspect: 1 });
    const view = new MC.View2D(cv, { xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4 });
    const H = new MC.History(['x', 'y', 'v'], { minDt: 1 / 60 });
    const gXY = new MC.TGraph({ ylabel: ['x, y', 'm'], series: [{ key: 'x', label: 'x', unit: 'm', color: '--c1', fmt: f2 }, { key: 'y', label: 'y', unit: 'm', color: '--c4', fmt: f2 }], legend: 'tr' });
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f2 }], legend: false });
    MC.hover(sim, gc, [gXY, gv]);
    const s = { th: 0, v: 0, stopped: false };
    let kv = 1, ka = 1;
    sim.group('Movimiento');
    sim.slider('R', { label: 'Radio <i>r</i>', min: 0.2, max: 30, step: 0.05, value: 4, unit: 'm', log: true, fmt: f2, reset: true });
    sim.slider('v0', { label: 'Rapidez inicial <i>v</i>₀', min: 0, max: 40, step: 0.1, value: 2.5, unit: 'm/s', fmt: f2, reset: true });
    sim.slider('at', { label: 'Aceleración tangencial <i>a<sub>t</sub></i>', min: -3, max: 3, step: 0.05, value: 0, unit: 'm/s²', fmt: f2, reset: true });
    sim.group('Mostrar');
    sim.check('vecs', { label: 'Vectores <i>v</i>, <i>a<sub>c</sub></i>, <i>a<sub>t</sub></i> y <i>a</i>', value: true });
    sim.check('rv', { label: 'Vector posición <i>r</i>', value: true });
    sim.check('proy', { label: 'Proyecciones sobre los ejes', value: false });
    sim.out('v', 'Rapidez <i>v</i>');
    sim.out('w', 'Rapidez angular ω = <i>v</i>/<i>r</i>');
    sim.out('T', 'Periodo <i>T</i> = 2π<i>r</i>/<i>v</i>');
    sim.out('f', 'Frecuencia');
    sim.out('ac', 'Aceleración centrípeta <i>v</i>²/<i>r</i>', { hl: true });
    sim.out('at', 'Aceleración tangencial');
    sim.out('a', 'Aceleración total |<i>a</i>|');
    sim.out('ang', 'Ángulo entre <i>a</i> y <i>v</i>');
    sim.presets([
      { id: 'carrusel', label: 'Carrusel (r = 4 m, una vuelta cada 10 s)', v: { R: 4, v0: 2.51, at: 0 }, fn: (s2) => s2.setSpeed(1) },
      { id: 'glorieta', label: 'Auto en una glorieta a 36 km/h', v: { R: 15, v0: 10, at: 0 }, fn: (s2) => s2.setSpeed(1) },
      { id: 'lavadora', label: 'Centrifugado de lavadora (1200 rpm)', v: { R: 0.25, v0: 31.4, at: 0 }, fn: (s2) => s2.setSpeed(0.1), note: 'Se muestra a ×0.1: en realidad da 20 vueltas por segundo. La aceleración es unas 400 veces g.' },
      { id: 'acelera', label: 'Auto que acelera en una curva', v: { R: 20, v0: 4, at: 1.5 }, fn: (s2) => s2.setSpeed(1) },
      { id: 'frena', label: 'Auto que frena en una curva', v: { R: 20, v0: 15, at: -2 }, fn: (s2) => s2.setSpeed(1) }
    ]);
    const scales = () => {
      const R = sim.p.R;
      const vmax = Math.max(sim.p.v0, sim.p.v0 + 8 * sim.p.at, 0.5);
      kv = (0.55 * R) / vmax;
      const amax = Math.max((vmax * vmax) / R, Math.abs(sim.p.at), 0.05);
      ka = (0.5 * R) / amax;
    };
    sim.run({
      reset() {
        s.th = 0; s.v = sim.p.v0; s.stopped = false;
        H.clear(); H.push(0, { x: sim.p.R, y: 0, v: s.v }, true);
        view.setRange({ xmin: -1.45 * sim.p.R, xmax: 1.45 * sim.p.R, ymin: -1.45 * sim.p.R, ymax: 1.45 * sim.p.R });
        scales();
        const w = sim.p.v0 / sim.p.R;
        const T = w > 0 ? (2 * Math.PI) / w : 10;
        gXY.set({ tspan: M.clamp(T * 2, 2, 30), ymin: -sim.p.R * 1.1, ymax: sim.p.R * 1.1 });
        gv.set({ tspan: M.clamp(T * 2, 2, 30) });
      },
      step(h) {
        const R = sim.p.R;
        let at = s.stopped ? 0 : sim.p.at;
        let vn = s.v + at * h;
        if (vn <= 0 && at < 0) { vn = 0; s.stopped = true; }
        s.th += ((s.v + vn) / 2 / R) * h;
        s.v = vn;
        const t = sim.t + h;
        H.push(t, { x: R * Math.cos(s.th), y: R * Math.sin(s.th), v: s.v });
        if (s.stopped) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p, R = p.R;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: true, axes: true, unit: 'm' });
      D.circle(ctx, view.X(0), view.Y(0), R * view.s, { color: '--ink-3', width: 1.5, dash: [5, 4] });
      D.circle(ctx, view.X(0), view.Y(0), 3.5, { fill: '--ink-2' });
      const x = R * Math.cos(s.th), y = R * Math.sin(s.th);
      const X = view.X(x), Y = view.Y(y);
      if (p.proy) {
        D.line(ctx, X, Y, X, view.Y(0), { color: '--c1', dash: [3, 3], width: 1 });
        D.line(ctx, X, Y, view.X(0), Y, { color: '--c4', dash: [3, 3], width: 1 });
        D.circle(ctx, X, view.Y(0), 6, { fill: '--c1' });
        D.circle(ctx, view.X(0), Y, 6, { fill: '--c4' });
      }
      if (p.rv) D.vec(ctx, view.X(0), view.Y(0), X - view.X(0), Y - view.Y(0), { color: '--pos', label: 'r', width: 1.8, size: 13 });
      const at = s.stopped ? 0 : p.at;
      const ac = (s.v * s.v) / R;
      if (p.vecs) {
        const ux = -Math.sin(s.th), uy = Math.cos(s.th);
        const nx = -Math.cos(s.th), ny = -Math.sin(s.th);
        const S = view.s;
        D.vec(ctx, X, Y, ux * s.v * kv * S, -uy * s.v * kv * S, { color: '--vel', label: 'v', minLen: 2 });
        const acx = nx * ac * ka * S, acy = -ny * ac * ka * S, atx = ux * at * ka * S, aty = -uy * at * ka * S;
        if (Math.abs(at) > 1e-6) {
          D.vec(ctx, X, Y, acx, acy, { color: '--acc', label: 'a_c', width: 1.6, dash: [5, 3], minLen: 2 });
          D.vec(ctx, X, Y, atx, aty, { color: '--acc', label: 'a_t', width: 1.6, dash: [5, 3], minLen: 2 });
          D.vec(ctx, X, Y, acx + atx, acy + aty, { color: '--acc', label: 'a', minLen: 2 });
        } else D.vec(ctx, X, Y, acx, acy, { color: '--acc', label: 'a_c', minLen: 2 });
      }
      D.ball(ctx, X, Y, 8, { fill: '--body-c' });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      gXY.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h * 0.58, mb: 30 }, H, { t: sim.t });
      gv.draw(gctx, { x: 0, y: gc.h * 0.58, w: gc.w, h: gc.h * 0.42, mb: 34 }, H, { t: sim.t });
      const w = s.v / R;
      const a = Math.hypot(ac, at);
      sim.set('v', `${f2(s.v)} m/s`);
      sim.set('w', `${f2(w)} rad/s`);
      sim.set('T', w > 1e-9 ? `${MC.sci((2 * Math.PI) / w, 3)} s` : '∞');
      sim.set('f', `${MC.sci(w / (2 * Math.PI), 3)} Hz = ${MC.sci((w / (2 * Math.PI)) * 60, 3)} rpm`);
      sim.set('ac', `${MC.sci(ac, 3)} m/s²` + (ac > 9.8 ? ` (${f1(ac / 9.8)} g)` : ''));
      sim.set('at', `${f2(at)} m/s²`);
      sim.set('a', `${MC.sci(a, 3)} m/s²`);
      sim.set('ang', a > 1e-9 ? `${f1(M.deg(Math.atan2(ac, at)))}°` : '—');
    });
  });

  /* ======================================================================
     4.4  Movimiento relativo: bote en un río y lluvia vista desde un auto
     ====================================================================== */
  MC.defineSim('relativo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const view = new MC.View2D(cv, { xmin: -10, xmax: 100, ymin: -12, ymax: 72 });
    const b = { x: 0, y: 0 }, drops = [];
    let path = [], carX = 0, flowPh = 0, done = false;
    const st = sim.status(cv);
    sim.group('Situación');
    sim.seg('mode', { options: [['rio', 'Bote en un río'], ['lluvia', 'Lluvia y auto']], value: 'rio', reset: true });
    const gR = sim.group('Río');
    sim.slider('W', { label: 'Ancho del río', min: 20, max: 200, step: 5, value: 60, unit: 'm', fmt: (v) => MC.fix(v, 0), reset: true });
    sim.slider('u', { label: 'Corriente <i>v</i><sub>agua</sub>', min: 0, max: 5, step: 0.1, value: 1.5, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('vb', { label: 'Bote respecto al agua <i>v</i><sub>bote/agua</sub>', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('phi', { label: 'Rumbo φ (aguas arriba +)', min: -80, max: 80, step: 0.5, value: 0, unit: '°', fmt: f1, reset: true });
    sim.button('Rumbo para llegar enfrente', () => {
      if (sim.p.u < sim.p.vb) sim.ctl.phi.set(M.deg(Math.asin(sim.p.u / sim.p.vb)));
      else st.show('Imposible: la corriente es más rápida que el bote', 'bad');
    });
    const gL = sim.group('Lluvia');
    sim.slider('vr', { label: 'Rapidez de la lluvia (vertical)', min: 1, max: 12, step: 0.1, value: 8, unit: 'm/s', fmt: f1 });
    sim.slider('vc', { label: 'Rapidez del auto', min: 0, max: 30, step: 0.5, value: 12, unit: 'm/s', fmt: f1 });
    sim.seg('frame', { label: 'Observador', options: [['suelo', 'Desde el suelo'], ['auto', 'Desde el auto']], value: 'auto' });
    sim.out('o1', '—'); sim.out('o2', '—'); sim.out('o3', '—'); sim.out('o4', '—');
    const outs = ['o1', 'o2', 'o3', 'o4'];
    const setOut = (i, lab, val, hl) => { sim._outs[outs[i]].label(lab); sim.set(outs[i], val); sim._outs[outs[i]].dd.classList.toggle('hl', !!hl); };
    sim.presets([
      { id: 'recto', label: 'Río: apuntar perpendicular a la orilla', v: { mode: 'rio', W: 60, u: 1.5, vb: 3, phi: 0 }, note: 'Cruza en 20 s y la corriente lo arrastra 30 m.' },
      { id: 'enfrente', label: 'Río: llegar justo enfrente', v: { mode: 'rio', W: 60, u: 1.5, vb: 3, phi: 30 }, note: 'Apuntando 30° aguas arriba, la corriente queda cancelada; tarda 23.1 s.' },
      { id: 'imposible', label: 'Río: corriente más rápida que el bote', v: { mode: 'rio', W: 60, u: 3, vb: 2, phi: 30 }, note: 'Ningún rumbo permite llegar enfrente: siempre termina río abajo.' },
      { id: 'lluvia', label: 'Lluvia vista desde un auto', v: { mode: 'lluvia', vr: 8, vc: 13.9, frame: 'auto' }, note: 'A 50 km/h, la lluvia vertical de 8 m/s se ve inclinada 60° respecto a la vertical.' },
      { id: 'quieto', label: 'Auto detenido bajo la lluvia', v: { mode: 'lluvia', vr: 8, vc: 0, frame: 'auto' } }
    ]);
    const vis = () => { gR.hidden = sim.p.mode !== 'rio'; gL.hidden = sim.p.mode !== 'lluvia'; };
    sim.onChange = (id) => { vis(); if (id === 'frame' || id === 'vr' || id === 'vc') spawnAll(); };
    function spawnAll() {
      drops.length = 0;
      const camX = sim.p.frame === 'auto' ? carX : 0;
      for (let i = 0; i < 120; i++) drops.push({ gx: camX + Math.random() * 24 - 12, y: Math.random() * 10.5 - 0.5 });
    }
    spawnAll();
    const velBG = () => {
      const ph = M.rad(sim.p.phi);
      return [sim.p.u - sim.p.vb * Math.sin(ph), sim.p.vb * Math.cos(ph)];
    };
    sim.run({
      reset() {
        vis();
        st.hide();
        done = false;
        b.x = 0; b.y = 0; path = [[0, 0]];
        if (sim.p.mode === 'rio') {
          const W = sim.p.W, v = velBG();
          const T = v[1] > 0 ? W / v[1] : Infinity;
          const drift = isFinite(T) ? v[0] * T : 0;
          const lo = Math.min(0, drift) - W * 0.35, hi = Math.max(0, drift) + W * 0.35;
          view.setRange({ xmin: lo, xmax: hi, ymin: -W * 0.22, ymax: W * 1.22 });
        } else { carX = 0; view.setRange({ xmin: -10, xmax: 10, ymin: -1.5, ymax: 9 }); }
      },
      step(h) {
        flowPh += h;
        if (sim.p.mode === 'rio') {
          if (done) return;
          const v = velBG();
          b.x += v[0] * h; b.y += v[1] * h;
          if (Math.floor((sim.t + h) / 0.25) > Math.floor(sim.t / 0.25)) path.push([b.x, b.y]);
          if (b.y >= sim.p.W) { b.y = sim.p.W; path.push([b.x, b.y]); done = true; sim.end(); }
          if (sim.t > 600) sim.end();
        } else {
          carX += sim.p.vc * h;
          const camX = sim.p.frame === 'auto' ? carX : 0;
          for (const d of drops) {
            d.y -= sim.p.vr * h;
            if (d.y < -0.5) { d.y += 10.5; d.gx = camX + Math.random() * 24 - 12; }
            if (d.gx - camX < -12) d.gx += 24;
            if (d.gx - camX > 12) d.gx -= 24;
          }
        }
      }
    });
    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx, p = sim.p;
      D.clear(cv);
      if (p.mode === 'rio') {
        const W = p.W;
        /* orillas y agua */
        ctx.fillStyle = MC.col('--ground-fill');
        ctx.fillRect(0, 0, cv.w, view.Y(W));
        ctx.fillRect(0, view.Y(0), cv.w, cv.h - view.Y(0));
        ctx.fillStyle = MC.alpha('--water', 0.28);
        ctx.fillRect(0, view.Y(W), cv.w, view.Y(0) - view.Y(W));
        /* flechas de corriente animadas */
        if (p.u > 0) {
          const sp = W / 5;
          for (let yy = sp / 2; yy < W; yy += sp) {
            for (let xx = Math.floor(view.x0 / (W / 2)) * (W / 2) + ((flowPh * p.u) % (W / 2)); xx < view.x1; xx += W / 2) {
              D.arrow(ctx, view.X(xx), view.Y(yy), view.X(xx) + 18, view.Y(yy), { color: '--water', width: 1.4, alpha: 0.7 });
            }
          }
        }
        /* destino enfrente */
        D.line(ctx, view.X(0), view.Y(0), view.X(0), view.Y(W), { color: '--ink-3', dash: [4, 4], width: 1 });
        D.circle(ctx, view.X(0), view.Y(W), 5, { fill: '--accent' });
        MC.text(ctx, 'punto de enfrente', view.X(0) + 8, view.Y(W) - 8, { size: 11, color: '--ink-2', halo: true });
        D.dim(ctx, view.X(view.x0) + 30, view.Y(0), view.X(view.x0) + 30, view.Y(W), `${MC.fix(W, 0)} m`, { labelOff: 0, dx: 22 });
        /* trayectoria */
        D.poly(ctx, path.map((q) => [view.X(q[0]), view.Y(q[1])]).concat([[view.X(b.x), view.Y(b.y)]]), { color: '--ink', width: 1.8, dash: [2, 3] });
        /* bote orientado según su rumbo respecto al agua */
        const ph = M.rad(p.phi);
        const hx = -Math.sin(ph), hy = Math.cos(ph);
        const bx = view.X(b.x), by = view.Y(b.y);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.atan2(-hy, hx));
        ctx.fillStyle = MC.col('--body-c');
        ctx.strokeStyle = MC.shade(MC.col('--body-c'), 0.5);
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.quadraticCurveTo(4, -8, -12, -6); ctx.lineTo(-12, 6); ctx.quadraticCurveTo(4, 8, 16, 0); ctx.fill(); ctx.stroke();
        ctx.restore();
        /* triángulo de velocidades */
        const v = velBG();
        const k = (0.16 * Math.min(cv.w, cv.h)) / Math.max(p.vb, p.u, 1);
        D.vec(ctx, bx, by, -p.vb * Math.sin(ph) * k, -p.vb * Math.cos(ph) * k, { color: '--c1', label: 'v_{B/A}', size: 12 });
        D.vec(ctx, bx - p.vb * Math.sin(ph) * k, by - p.vb * Math.cos(ph) * k, p.u * k, 0, { color: '--c7', label: 'v_{A/T}', size: 12 });
        D.vec(ctx, bx, by, v[0] * k, -v[1] * k, { color: '--ink', label: 'v_{B/T}', size: 12, width: 2.8 });
        const T = v[1] > 0 ? W / v[1] : Infinity;
        setOut(0, 'Velocidad del bote respecto a tierra', `${f2(Math.hypot(v[0], v[1]))} m/s`, true);
        setOut(1, 'Dirección (respecto a la perpendicular)', `${f1(M.deg(Math.atan2(v[0], v[1])))}° ${v[0] >= 0 ? 'río abajo' : 'río arriba'}`);
        setOut(2, 'Tiempo de cruce <i>W</i>/(<i>v</i> cos φ)', isFinite(T) ? `${f2(T)} s` : 'no cruza');
        setOut(3, 'Deriva a lo largo del río', isFinite(T) ? `${f1(v[0] * T)} m` : '—', true);
        MC.text(ctx, 'B: bote · A: agua · T: tierra', 10, cv.h - 10, { size: 11, color: '--ink-3' });
      } else {
        /* lluvia */
        const auto = p.frame === 'auto';
        const camX = auto ? carX : 0;
        const ground = view.Y(0);
        ctx.fillStyle = MC.col('--sky');
        ctx.fillRect(0, 0, cv.w, ground);
        ctx.fillStyle = MC.col('--road');
        ctx.fillRect(0, ground, cv.w, cv.h - ground);
        /* postes de referencia en el suelo */
        for (let k = Math.floor((camX - 12) / 6); k <= Math.ceil((camX + 12) / 6); k++) {
          const X = view.X(k * 6 - camX);
          ctx.fillStyle = MC.col('--ink-3');
          ctx.fillRect(X - 2, view.Y(3.2), 4, view.Y(0) - view.Y(3.2));
        }
        /* gotas */
        const relx = auto ? -p.vc : 0, rely = -p.vr;
        const exp = 0.06;
        ctx.save();
        ctx.strokeStyle = MC.alpha('--water', 0.85);
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const d of drops) {
          if (d.y < 0) continue;
          const X = view.X(d.gx - camX), Y = view.Y(d.y);
          ctx.moveTo(X, Y);
          ctx.lineTo(X - relx * exp * view.s, Y + rely * exp * view.s);
        }
        ctx.stroke();
        ctx.restore();
        /* auto */
        let cx = auto ? 0 : ((carX + 12) % 24) - 12;
        D.car(ctx, view.X(cx), view.Y(0), view.L(4.4), { color: '--body-c', dir: 1, wheel: carX / 0.33 });
        /* triángulo de velocidades */
        const px = cv.w - 150, py = 30, k = 90 / Math.max(p.vr, p.vc, 1);
        D.panel(ctx, px - 14, py - 16, 158, 140, { title: 'VELOCIDADES' });
        D.vec(ctx, px + 70, py + 8, 0, p.vr * k * 0.9, { color: '--c1', label: 'v_{g/T}', size: 11 });
        if (p.vc > 0.1) D.vec(ctx, px + 70, py + 8 + p.vr * k * 0.9, -p.vc * k * 0.9, 0, { color: '--c7', label: '−v_{A/T}', size: 11 });
        D.vec(ctx, px + 70, py + 8, -p.vc * k * 0.9, p.vr * k * 0.9, { color: '--ink', label: 'v_{g/A}', size: 11, width: 2.6 });
        const ang = M.deg(Math.atan2(p.vc, p.vr));
        setOut(0, 'Gotas respecto al suelo', `${f1(p.vr)} m/s, verticales`);
        setOut(1, 'Gotas respecto al auto', `${f2(Math.hypot(p.vr, p.vc))} m/s`, true);
        setOut(2, 'Inclinación vista desde el auto', `${f1(ang)}° respecto a la vertical`, true);
        setOut(3, 'Rapidez del auto', `${f1(p.vc)} m/s = ${f1(p.vc * 3.6)} km/h`);
      }
    });
  });
})();
