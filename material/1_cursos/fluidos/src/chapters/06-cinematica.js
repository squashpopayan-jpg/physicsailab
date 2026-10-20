/* Capítulo 6 — Cinemática y conservación de la masa */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;

  /* 6.1 Derivada material en una tobera */
  EM.defineSim('derivada-material', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('r', { label: 'Diámetro de salida / diámetro de entrada', min: 0.25, max: 1, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('amp', { label: 'Oscilación del caudal (fracción)', min: 0, max: 0.8, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.slider('f', { label: 'Frecuencia de la oscilación', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'Hz', fmt: (v) => v.toFixed(1) });
    sim.out('a', 'Aceleración de la partícula', { hl: true });
    sim.out('al', 'Local ∂<i>u</i>/∂<i>t</i> · convectiva <i>u</i>∂<i>u</i>/∂<i>x</i>');
    sim.out('u', 'Velocidad de la partícula');
    const L = 0.1, D0 = 0.02, U0 = 1, slow = 0.08;
    const D = (x, r) => { const s = Math.min(1, Math.max(0, (x - 0.3 * L) / (0.4 * L))), sm = s * s * (3 - 2 * s); return D0 * (1 - (1 - r) * sm); };
    const Ar = (x, r) => (Math.PI * D(x, r) * D(x, r)) / 4;
    let t = 0, xp = 0, hist = [];
    sim.onChange = () => { xp = 0; hist = []; };
    sim.animate((dt) => {
      const p = sim.p, w = 2 * Math.PI * p.f, n = 20, h = (dt * slow) / n;
      for (let i = 0; i < n; i++) {
        const Q = U0 * Ar(0, 1) * (1 + p.amp * Math.sin(w * t)), u = Q / Ar(xp, p.r);
        xp += u * h; t += h;
        if (xp > L) { xp = 0; hist = []; }
      }
      const Q = U0 * Ar(0, 1) * (1 + p.amp * Math.sin(w * t)), dQ = U0 * Ar(0, 1) * p.amp * w * Math.cos(w * t);
      const u = Q / Ar(xp, p.r), dx = 1e-5, dudx = (Q / Ar(xp + dx, p.r) - Q / Ar(xp - dx, p.r)) / (2 * dx);
      hist.push([xp, dQ / Ar(xp, p.r), u * dudx]);
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const th = H * 0.36, sx = (W - 40) / L, cy = th / 2 + 4, sy = (th * 0.8) / D0;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const x = (L * i) / 100; ctx.lineTo(20 + x * sx, cy - (D(x, p.r) / 2) * sy); }
      for (let i = 100; i >= 0; i--) { const x = (L * i) / 100; ctx.lineTo(20 + x * sx, cy + (D(x, p.r) / 2) * sy); }
      ctx.closePath(); ctx.fillStyle = EM.alpha('--water', 0.25); ctx.fill(); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(20 + xp * sx, cy, 6, 0, 7); ctx.fill();
      const pl = new EM.Plot(ctx, { x: 0, y: th + 6, w: W, h: H - th - 6, xmin: 0, xmax: L * 100, ymin: Math.min(-50, ...hist.map((q) => Math.min(q[1], q[2], q[1] + q[2]))) * 1.1, ymax: Math.max(50, ...hist.map((q) => Math.max(q[1], q[2], q[1] + q[2]))) * 1.1, xlabel: 'posición de la partícula x (cm)', ylabel: 'a (m/s²)' });
      pl.frame();
      pl.path(hist.map((q) => [q[0] * 100, q[1]]), { color: '--c1', width: 1.8 });
      pl.path(hist.map((q) => [q[0] * 100, q[2]]), { color: '--c2', width: 1.8 });
      pl.path(hist.map((q) => [q[0] * 100, q[1] + q[2]]), { color: '--accent', width: 2.6 });
      pl.legend([{ label: 'local ∂u/∂t', color: '--c1' }, { label: 'convectiva u ∂u/∂x', color: '--c2' }, { label: 'total Du/Dt', color: '--accent' }], 'tl');
      const q = hist[hist.length - 1] || [0, 0, 0];
      sim.set('a', EM.fix(q[1] + q[2], 1) + ' m/s² (' + EM.fix((q[1] + q[2]) / FL.g, 1) + ' g)');
      sim.set('al', EM.fix(q[1], 1) + ' · ' + EM.fix(q[2], 1) + ' m/s²');
      const Q = U0 * Ar(0, 1) * (1 + p.amp * Math.sin(2 * Math.PI * p.f * t));
      sim.set('u', EM.fix(Q / Ar(xp, p.r), 2) + ' m/s');
    });
  });

  /* 6.2 Líneas de corriente, trayectorias y trazas */
  EM.defineSim('lineas-trazas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V0', { label: 'Amplitud transversal <i>V</i><sub>0</sub>/<i>U</i><sub>0</sub>', min: 0, max: 1.5, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2) });
    sim.slider('w', { label: 'Frecuencia angular ω (con <i>U</i><sub>0</sub> = 1)', min: 0.5, max: 6, step: 0.1, value: 2.5, unit: 'rad/s', fmt: (v) => v.toFixed(1) });
    sim.check('sl', { label: 'Líneas de corriente', value: true });
    sim.check('pl', { label: 'Trayectorias', value: true });
    sim.check('st', { label: 'Traza desde el emisor', value: true });
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, 0, 6, -1.6, 1.6, false);
      const V0 = p.V0, w = p.w, x0 = 0.4;
      /* rejilla tenue */
      ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      for (let x = 0; x <= 6; x++) { ctx.beginPath(); ctx.moveTo(v.X(x), v.Y(-1.6)); ctx.lineTo(v.X(x), v.Y(1.6)); ctx.stroke(); }
      if (p.sl) { const s = V0 * Math.sin(w * t); for (let k = -6; k <= 6; k++) { const yy = k * 0.4; EM.flow.drawPath(ctx, [[0, yy - s * 3], [6, yy + s * 3]], v.map, { color: '--c1', width: 1, alpha: 0.6 }); } }
      if (p.pl) {
        for (let k = 0; k < 4; k++) {
          const t0 = t - k * 1.2 - (t % 1.2);
          if (t0 < 0) continue;
          const pts = [];
          for (let s = t0; s <= t; s += 0.02) pts.push([x0 + (s - t0), (V0 / w) * (Math.cos(w * t0) - Math.cos(w * s))]);
          EM.flow.drawPath(ctx, pts, v.map, { color: '--c3', width: 1.8 });
          const q = pts[pts.length - 1]; if (q) { ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(v.X(q[0]), v.Y(q[1]), 4, 0, 7); ctx.fill(); }
        }
      }
      if (p.st) {
        const pts = [];
        for (let tau = Math.max(0, t - 6); tau <= t; tau += 0.01) pts.push([x0 + (t - tau), (V0 / w) * (Math.cos(w * tau) - Math.cos(w * t))]);
        EM.flow.drawPath(ctx, pts, v.map, { color: '--c2', width: 2.4 });
      }
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(x0), v.Y(0), 5, 0, 7); ctx.fill();
      EM.text(ctx, 'emisor', v.X(x0) + 8, v.Y(0) + 16, { size: 11, color: '--ink-2', halo: true });
      sim.legend([{ label: 'líneas de corriente en t', color: '--c1' }, { label: 'trayectorias', color: '--c3' }, { label: 'traza (humo)', color: '--c2' }]);
      EM.text(ctx, 't = ' + EM.fix(t, 2) + ' s', W - 12, 20, { size: 12, align: 'right', color: '--ink-2', mono: true });
    });
  });

  /* 6.3 Elemento en un flujo lineal */
  const PRE = { cortante: [0, 1, 0, 0], pura: [0.6, 0, 0, -0.6], rotacion: [0, -0.8, 0.8, 0], expansion: [0.4, 0, 0, 0.4], general: [0.3, 0.8, -0.2, -0.3] };
  EM.defineSim('elemento-deforma', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.select('pre', { label: 'Flujo lineal', options: [['cortante', 'Cortante simple u = y'], ['pura', 'Deformación pura'], ['rotacion', 'Rotación rígida'], ['expansion', 'Expansión'], ['general', 'General']], value: 'cortante' });
    sim.slider('a', { label: '∂<i>u</i>/∂<i>x</i>', min: -1, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: '∂<i>u</i>/∂<i>y</i>', min: -1, max: 1, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('c', { label: '∂<i>v</i>/∂<i>x</i>', min: -1, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2) });
    sim.slider('d', { label: '∂<i>v</i>/∂<i>y</i>', min: -1, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('w', 'Vorticidad ω<sub>z</sub> = ∂<i>v</i>/∂<i>x</i> − ∂<i>u</i>/∂<i>y</i>', { hl: true });
    sim.out('div', 'Divergencia (cambio de volumen)');
    sim.out('S', 'Rapidez de deformación <i>S</i> = [[<i>S</i><sub>xx</sub>, <i>S</i><sub>xy</sub>], [·, <i>S</i><sub>yy</sub>]]');
    let t = 0;
    sim.onChange = (id) => { if (id === 'pre') { const q = PRE[sim.p.pre]; ['a', 'b', 'c', 'd'].forEach((k, i) => sim.ctl[k].set(q[i], true)); } t = 0; };
    sim.animate((dt) => { t += dt * 0.6; if (t > 2.2) t = 0; });
    const mapPt = (x, y, A, T) => {
      let s = [x, y];
      const n = 40, h = T / n, f = (tt, q) => [A[0] * q[0] + A[1] * q[1], A[2] * q[0] + A[3] * q[1]];
      for (let i = 0; i < n; i++) s = FL.rk4(f, 0, s, h);
      return s;
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = [p.a, p.b, p.c, p.d];
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, -2.4, 2.4, -1.6, 1.6);
      /* campo de velocidad de fondo */
      const xs = EM.M.linspace(-2.2, 2.2, 12), ys = EM.M.linspace(-1.4, 1.4, 8);
      EM.flow.arrows(ctx, (x, y) => [A[0] * x + A[1] * y, A[2] * x + A[3] * y], xs, ys, v.map, 18, { color: '--grid-2', width: 1 });
      /* cuadrado deformado (rejilla 6×6) */
      const n = 6, s0 = 0.5, grid = [];
      for (let i = 0; i <= n; i++) { grid.push([]); for (let j = 0; j <= n; j++) grid[i].push(mapPt(-s0 + (2 * s0 * i) / n, -s0 + (2 * s0 * j) / n, A, t)); }
      ctx.fillStyle = EM.alpha('--water', 0.25);
      ctx.beginPath(); ctx.moveTo(...v.map(grid[0][0]));
      for (let i = 0; i <= n; i++) ctx.lineTo(...v.map(grid[i][0]));
      for (let j = 0; j <= n; j++) ctx.lineTo(...v.map(grid[n][j]));
      for (let i = n; i >= 0; i--) ctx.lineTo(...v.map(grid[i][n]));
      for (let j = n; j >= 0; j--) ctx.lineTo(...v.map(grid[0][j]));
      ctx.fill();
      ctx.strokeStyle = EM.alpha('--water', 0.9); ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) { ctx.beginPath(); for (let j = 0; j <= n; j++) { const q = v.map(grid[i][j]); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
      for (let j = 0; j <= n; j++) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const q = v.map(grid[i][j]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
      /* marca de rotación: una cruz material corta */
      const c = mapPt(0, 0, A, t), e1 = mapPt(0.25, 0, A, t), e2 = mapPt(0, 0.25, A, t);
      EM.draw.arrow(ctx, ...v.map(c), ...v.map(e1), { color: '--accent', width: 2 });
      EM.draw.arrow(ctx, ...v.map(c), ...v.map(e2), { color: '--accent', width: 2 });
      /* ejes principales de S */
      const Sxx = A[0], Syy = A[3], Sxy = 0.5 * (A[1] + A[2]), ang = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);
      const l1 = (Sxx + Syy) / 2 + Math.hypot((Sxx - Syy) / 2, Sxy), l2 = (Sxx + Syy) / 2 - Math.hypot((Sxx - Syy) / 2, Sxy);
      for (const [a, l] of [[ang, l1], [ang + Math.PI / 2, l2]]) {
        if (Math.abs(l) < 1e-6) continue;
        const L = 1.15, dx = Math.cos(a) * L, dy = Math.sin(a) * L;
        ctx.setLineDash([5, 4]); EM.flow.drawPath(ctx, [[-dx, -dy], [dx, dy]], v.map, { color: '--ink', width: 1.2 }); ctx.setLineDash([]);
        const sg = l > 0 ? 1 : -1;
        EM.draw.arrow(ctx, ...v.map([dx * (sg > 0 ? 0.8 : 1.15), dy * (sg > 0 ? 0.8 : 1.15)]), ...v.map([dx * (sg > 0 ? 1.15 : 0.8), dy * (sg > 0 ? 1.15 : 0.8)]), { color: '--ink', width: 1.6 });
      }
      sim.set('w', EM.fix(A[2] - A[1], 3) + ' s⁻¹ (el elemento gira a ' + EM.fix((A[2] - A[1]) / 2, 3) + ' rad/s)');
      sim.set('div', EM.fix(A[0] + A[3], 3) + ' s⁻¹');
      sim.set('S', '[[' + EM.fix(Sxx, 2) + ', ' + EM.fix(Sxy, 2) + '], [·, ' + EM.fix(Syy, 2) + ']]');
    });
  });

  /* 6.4 Función de corriente */
  const PSI = {
    semicuerpo: { n: 'Uniforme + fuente (semicuerpo de Rankine)', box: [-2, 4, -2, 2], psi: (x, y) => y + (1 / (2 * Math.PI)) * ((Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI)) - 0.5, vel: (x, y) => { const r2 = x * x + y * y; return [1 + x / (2 * Math.PI * r2), y / (2 * Math.PI * r2)]; }, inside: (x, y) => { const th = Math.atan2(Math.abs(y), x); return th < 1e-9 ? x > 0 : Math.hypot(x, y) < (Math.PI - th) / (2 * Math.PI * Math.sin(th)); } },
    cilindro: { n: 'Uniforme + doblete (cilindro)', box: [-3, 3, -2, 2], psi: (x, y) => y * (1 - 1 / (x * x + y * y)), vel: (x, y) => { const r2 = x * x + y * y; return [1 - (x * x - y * y) / (r2 * r2), (-2 * x * y) / (r2 * r2)]; }, inside: (x, y) => x * x + y * y < 1 },
    estancamiento: { n: 'Punto de estancamiento ψ = xy', box: [-2, 2, 0, 2], psi: (x, y) => x * y, vel: (x, y) => [x, -y], inside: (x, y) => y < 0 },
    esquina: { n: 'Esquina ψ = rⁿ sen nθ', box: [-2, 2, -2, 2], psi: null, vel: null, inside: null },
    vortice: { n: 'Vórtice irrotacional', box: [-2, 2, -2, 2], psi: (x, y) => -Math.log(Math.hypot(x, y)) / (2 * Math.PI), vel: (x, y) => { const r2 = x * x + y * y; return [-y / (2 * Math.PI * r2), x / (2 * Math.PI * r2)]; }, inside: (x, y) => x * x + y * y < 0.01 }
  };
  EM.defineSim('funcion-corriente', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('f', { label: 'Flujo', options: Object.entries(PSI).map(([k, v]) => [k, v.n]), value: 'semicuerpo' });
    sim.slider('n', { label: 'Exponente <i>n</i> (flujo de esquina)', min: 0.55, max: 4, step: 0.01, value: 2 / 3, fmt: (v) => v.toFixed(2) });
    sim.check('col', { label: 'Colorear la rapidez', value: true });
    sim.out('A', 'ψ en A · ψ en B (clic para mover A y B)');
    sim.out('q', 'Caudal entre A y B (por unidad de profundidad)', { hl: true });
    sim.hint('Haga clic en el campo para colocar los puntos A y B.', cv);
    const sync = () => sim.ctl.n.show(sim.p.f === 'esquina');
    let tr = null, pts = [[0, 1], [0, 0.6]], which = 0;
    const get = () => {
      const P = PSI[sim.p.f];
      if (sim.p.f !== 'esquina') return P;
      const n = sim.p.n, th = (x, y) => { let a = Math.atan2(y, x); if (a < 0) a += 2 * Math.PI; return a; };
      return {
        box: P.box, psi: (x, y) => { const r = Math.hypot(x, y), a = th(x, y); return a <= Math.PI / n ? Math.pow(r, n) * Math.sin(n * a) : NaN; },
        vel: (x, y) => { const r = Math.hypot(x, y) || 1e-9, a = th(x, y); if (a > Math.PI / n) return [0, 0]; const ur = n * Math.pow(r, n - 1) * Math.cos(n * a), ut = -n * Math.pow(r, n - 1) * Math.sin(n * a); return [ur * Math.cos(a) - ut * Math.sin(a), ur * Math.sin(a) + ut * Math.cos(a)]; },
        inside: (x, y) => th(x, y) > Math.PI / n
      };
    };
    const reset = () => {
      const P = get(), b = P.box;
      tr = new EM.flow.Tracers(260, () => { for (let k = 0; k < 30; k++) { const x = b[0] + Math.random() * (b[1] - b[0]), y = b[2] + Math.random() * (b[3] - b[2]); if (!P.inside(x, y)) return [x, y]; } return [b[0], b[3]]; }, { life: 4, trail: 8 });
    };
    sim.onChange = () => { sync(); reset(); };
    sync(); reset();
    let view = null;
    EM.pointer(cv, { down: (x, y) => { if (!view) return null; pts[which] = view.inv(x, y); which = 1 - which; sim.redraw(); return null; } });
    sim.animate((dt) => {
      const P = get(), b = P.box;
      tr.step((x, y) => { const q = P.vel(x, y), s = Math.hypot(q[0], q[1]), lim = 4; return s > lim ? [(q[0] * lim) / s, (q[1] * lim) / s] : q; }, dt * 0.5, (x, y) => x > b[0] && x < b[1] && y > b[2] && y < b[3] && !P.inside(x, y));
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = get(), b = P.box;
      EM.draw.clear(cv);
      const v = (view = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, b[0], b[1], b[2], b[3]));
      const nx = 160, ny = Math.round((nx * (b[3] - b[2])) / (b[1] - b[0])), psi = new Float64Array(nx * ny), sp = new Float64Array(nx * ny), mask = new Uint8Array(nx * ny);
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = b[0] + ((b[1] - b[0]) * i) / (nx - 1), y = b[2] + ((b[3] - b[2]) * j) / (ny - 1), k = j * nx + i;
        const ins = P.inside(x, y);
        mask[k] = ins ? 1 : 0;
        psi[k] = P.psi(x, y); const q = P.vel(x, y); sp[k] = Math.hypot(q[0], q[1]);
        if (!ins && isFinite(psi[k])) { lo = Math.min(lo, psi[k]); hi = Math.max(hi, psi[k]); }
      }
      const r = { x: v.X(b[0]), y: v.Y(b[3]), w: v.X(b[1]) - v.X(b[0]), h: v.Y(b[2]) - v.Y(b[3]) };
      if (p.col) EM.flow.paint(ctx, sp, nx, ny, r, (s) => EM.cmap.seq(Math.min(1, s / 2.2), '--c1'), { mask });
      else EM.flow.paint(ctx, sp, nx, ny, r, () => EM.rgb('--canvas'), { mask });
      const dpsi = (hi - lo) / 24;
      const gm = (i, j) => [r.x + (i / (nx - 1)) * r.w, r.y + r.h - (j / (ny - 1)) * r.h];
      for (let L = Math.ceil(lo / dpsi) * dpsi; L <= hi; L += dpsi) EM.flow.drawSegs(ctx, EM.flow.contour(psi, nx, ny, L, mask), gm, { color: '--ink-2', width: 1 });
      tr.draw(ctx, (x, y) => v.map(x, y), { color: '--accent', alpha: 0.7, width: 1.2 });
      const pa = P.psi(...pts[0]), pb = P.psi(...pts[1]);
      for (const [k, q] of pts.entries()) { ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(...v.map(q), 5, 0, 7); ctx.fill(); EM.text(ctx, k ? 'B' : 'A', v.X(q[0]) + 7, v.Y(q[1]) - 7, { size: 13, weight: 700, color: '--c2', halo: true }); }
      sim.set('A', EM.fix(pa, 4) + ' · ' + EM.fix(pb, 4));
      sim.set('q', isFinite(pa - pb) ? EM.fix(Math.abs(pa - pb), 4) + ' (unidades del flujo)' : '—');
    });
  });
})();
