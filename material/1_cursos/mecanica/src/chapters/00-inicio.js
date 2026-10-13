/* Portada: lanzador de proyectiles interactivo */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;

  MC.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.42 });
    const view = new MC.View2D(cv, { xmin: -3, xmax: 63, ymin: -2.5, ymax: 30, align: 'bottom left', padL: 6, padB: 6, padR: 6, padT: 6 });
    const g = 9.8;
    const COLS = ['--c1', '--c4', '--c5', '--c3', '--c8', '--c7'];
    let ci = 0;
    const shots = [];
    let aim = null;
    const vmax = 24.5;

    function mk(v0, thDeg, done) {
      const th = M.rad(thDeg), vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
      const T = (2 * vy) / g;
      const s = { v0, th, vx, vy, T, t: done ? T : 0, done: !!done, color: COLS[ci++ % COLS.length] };
      shots.push(s);
      while (shots.length > 5) shots.shift();
      return s;
    }
    mk(20, 30, true); mk(20, 45, true); mk(20, 60, true);

    const pos = (s, t) => [s.vx * t, s.vy * t - 0.5 * g * t * t];

    function step(dt) {
      let any = false;
      for (const s of shots) {
        if (s.done) continue;
        s.t = Math.min(s.T, s.t + dt);
        if (s.t >= s.T) s.done = true; else any = true;
      }
      if (!any) sim.pause();
    }
    sim.animate(step, { button: false, autoplay: false });

    const toAim = (px, py) => {
      const wx = view.wx(px), wy = view.wy(py);
      let dx = wx, dy = Math.max(0, wy);
      let v = Math.hypot(dx, dy) * 0.62;
      v = M.clamp(v, 3, vmax);
      let th = Math.atan2(dy, dx);
      th = M.clamp(th, M.rad(5), M.rad(85));
      return { v, th };
    };
    MC.pointer(cv, {
      down: (x, y) => { aim = toAim(x, y); sim.redraw(); return 1; },
      move: (_, x, y) => { aim = toAim(x, y); sim.redraw(); },
      up: () => {
        if (aim) { mk(Math.round(aim.v * 10) / 10, Math.round(M.deg(aim.th)), false); aim = null; sim.play(); }
      },
      hover: () => 'crosshair'
    });
    sim.hint('Arrastra para apuntar: la longitud fija la rapidez inicial', cv);

    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      view.grid({ labels: true, unit: 'm' });
      D.ground(ctx, 0, view.Y(0), cv.w, { depth: 12 });
      /* trayectorias */
      shots.forEach((s, k) => {
        const col = s.color;
        const pts = [];
        const n = 90;
        for (let i = 0; i <= n; i++) { const t = (s.t * i) / n; const p = pos(s, t); pts.push([view.X(p[0]), view.Y(p[1])]); }
        D.poly(ctx, pts, { color: col, width: 2, alpha: s.done ? 0.85 : 1 });
        /* estroboscopio cada 0.25 s */
        for (let t = 0.25; t < s.t; t += 0.25) { const p = pos(s, t); D.circle(ctx, view.X(p[0]), view.Y(p[1]), 2.2, { fill: col }); }
        if (s.done) {
          const R = s.vx * s.T, H = (s.vy * s.vy) / (2 * g);
          D.circle(ctx, view.X(R), view.Y(0), 3.5, { fill: col });
          MC.text(ctx, `${Math.round(M.deg(s.th))}°`, view.X(R), view.Y(0) + 24 + (k % 2) * 12, { size: 11, align: 'center', mono: true, color: col, halo: true });
          const ta = s.vy / g, pa = pos(s, ta);
          MC.text(ctx, `H = ${MC.fix(H, 1)} m`, view.X(pa[0]), view.Y(pa[1]) - 8, { size: 11, align: 'center', mono: true, color: col, halo: true });
        } else {
          const p = pos(s, s.t), vy = s.vy - g * s.t;
          const X = view.X(p[0]), Y = view.Y(p[1]);
          const k2 = 2.2;
          D.vec(ctx, X, Y, s.vx * k2, 0, { color: '--vel', width: 1.4, dash: [4, 3], minLen: 3 });
          D.vec(ctx, X, Y, 0, -vy * k2, { color: '--vel', width: 1.4, dash: [4, 3], minLen: 3 });
          D.vec(ctx, X, Y, s.vx * k2, -vy * k2, { color: '--vel', label: 'v' });
          D.vec(ctx, X, Y, 0, g * 3, { color: '--acc', label: 'g', width: 2 });
          D.ball(ctx, X, Y, 6, { fill: '--body-a' });
        }
      });
      /* alcances iguales 30°/60° */
      const demo = shots.filter((s) => s.done && Math.abs(s.v0 - 20) < 1e-9);
      if (demo.length >= 3) {
        const R = (20 * 20 * Math.sin(M.rad(60))) / g;
        MC.text(ctx, '30° y 60°: igual alcance', view.X(R), view.Y(0) - 12, { size: 11.5, align: 'center', color: '--ink-2', halo: true });
      }
      /* cañón */
      const last = shots[shots.length - 1];
      const th = aim ? aim.th : last ? last.th : M.rad(45);
      const cx = view.X(0), cy = view.Y(0);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-th);
      ctx.fillStyle = MC.col('--ink-2');
      ctx.fillRect(-6, -5, 30, 10);
      ctx.restore();
      D.circle(ctx, cx, cy, 8, { fill: '--metal', color: '--ink-2' });
      /* puntería */
      if (aim) {
        const vx = aim.v * Math.cos(aim.th), vy = aim.v * Math.sin(aim.th);
        const pts = [];
        const T = (2 * vy) / g;
        for (let i = 0; i <= 80; i++) { const t = (T * i) / 80; pts.push([view.X(vx * t), view.Y(vy * t - 0.5 * g * t * t)]); }
        D.poly(ctx, pts, { color: '--ink-3', width: 1.3, dash: [4, 4] });
        D.vec(ctx, cx, cy, vx * 3.2, -vy * 3.2, { color: '--vel', label: 'v_0', width: 2.6 });
        D.angle(ctx, cx, cy, 34, 0, aim.th, { label: 'θ' });
        const R = (aim.v * aim.v * Math.sin(2 * aim.th)) / g;
        D.panel(ctx, cv.w - 196, 10, 186, 64);
        MC.text(ctx, `v₀ = ${MC.fix(aim.v, 1)} m/s`, cv.w - 184, 30, { size: 13, mono: true });
        MC.text(ctx, `θ = ${MC.fix(M.deg(aim.th), 0)}°`, cv.w - 184, 48, { size: 13, mono: true });
        MC.text(ctx, `alcance = ${MC.fix(R, 1)} m`, cv.w - 184, 66, { size: 13, mono: true, color: '--accent' });
      }
    });
  });
})();
