/* Capítulo 26 — Dinámica de fluidos computacional */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl;

  /* 26.1 Advección de un pulso con varios esquemas */
  EM.defineSim('advection-esquemas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('C', { label: 'Número de Courant <i>C</i> = <i>c</i>Δ<i>t</i>/Δ<i>x</i>', min: 0.05, max: 1.1, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.seg('f', { label: 'Perfil inicial', options: [['sq', 'Escalón'], ['g', 'Gaussiana'], ['mx', 'Ambos']], value: 'mx' });
    sim.check('up', { label: 'Contra el viento (1.er orden)', value: true });
    sim.check('lw', { label: 'Lax–Wendroff (2.º orden)', value: true });
    sim.check('mm', { label: 'Limitador minmod (TVD)', value: true });
    sim.check('ce', { label: 'Centrado explícito (FTCS)', value: false });
    sim.out('rev', 'Vueltas completadas', { hl: true });
    sim.out('e', 'Error medio |<i>u</i> − <i>u</i><sub>exacta</sub>|');
    sim.out('os', 'Máximo y mínimo (exacto: 1 y 0)');
    sim.out('nu', 'Difusión numérica contra el viento');
    const N = 200, dx = 1 / N;
    const S = [
      { id: 'up', k: 'upwind', name: 'contra el viento', sh: 'viento', col: '--c2' },
      { id: 'lw', k: 'lw', name: 'Lax–Wendroff', sh: 'LW', col: '--c3' },
      { id: 'mm', k: 'minmod', name: 'minmod', sh: 'minmod', col: '--c5' },
      { id: 'ce', k: 'central', name: 'centrado', sh: 'FTCS', col: '--c1' }
    ];
    const prof = (x) => {
      const f = sim.p.f, xx = ((x % 1) + 1) % 1;
      let v = 0;
      if (f !== 'g' && xx >= 0.1 && xx < 0.3) v = 1;
      if (f !== 'sq') { const c = f === 'g' ? 0.3 : 0.65; v = Math.max(v, Math.exp(-(((xx - c) / 0.05) ** 2))); }
      return v;
    };
    let U, steps;
    const reset = () => {
      steps = 0; U = {};
      for (const s of S) { U[s.k] = new Float64Array(N); for (let i = 0; i < N; i++) U[s.k][i] = prof((i + 0.5) * dx); }
    };
    reset();
    sim.onChange = (id) => { if (id === 'C' || id === 'f') reset(); };
    sim.resetButton(reset);
    sim.animate(() => {
      const C = sim.p.C, n = Math.max(1, Math.round(1 / C));
      for (let k = 0; k < n; k++) {
        for (const s of S) { const u = U[s.k]; if (u.blown) continue; const v = FL.advectStep(u, C, s.k); let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, Math.abs(v[i])); if (!(mx < 50)) { u.blown = true; continue; } U[s.k] = v; }
        steps++;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, shift = steps * p.C * dx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1, ymin: -0.45, ymax: 1.45, xlabel: 'x / L', ylabel: 'u' });
      pl.frame();
      pl.fn((x) => prof(x - shift), { color: '--ink-3', width: 1.6, dash: [5, 4], n: 800 });
      const xs = Array.from({ length: N }, (_, i) => (i + 0.5) * dx), leg = [{ label: 'exacta', color: '--ink-3', kind: 'dash' }];
      const err = [], os = [];
      for (const s of S) {
        if (!p[s.id]) continue;
        const u = U[s.k];
        leg.push({ label: s.name, color: s.col });
        if (u.blown) { err.push(s.sh + ': inestable'); continue; }
        pl.xy(xs, Array.from(u), { color: s.col, width: 1.8 });
        let e = 0, mx = -Infinity, mn = Infinity;
        for (let i = 0; i < N; i++) { e += Math.abs(u[i] - prof(xs[i] - shift)); mx = Math.max(mx, u[i]); mn = Math.min(mn, u[i]); }
        err.push(s.sh + ' ' + EM.fix(e / N, 4));
        os.push(s.sh + ' ' + EM.fix(mx, 2) + ' / ' + EM.fix(mn, 2));
      }
      sim.legend(leg);
      sim.set('rev', EM.fix(shift, 2) + ' · ' + steps + ' pasos' + (p.C > 1 ? ' — <b>CFL violada</b>' : ''));
      sim.set('e', err.join('<br>') || '—');
      sim.set('os', os.join('<br>') || '—');
      const nn = 0.5 * (1 - p.C);
      sim.set('nu', p.C <= 1 ? 'ν<sub>num</sub> = ' + EM.fix(nn, 3) + ' <i>c</i>Δ<i>x</i>' + (p.C === 1 ? ' (exacto)' : '') : 'negativa: el esquema es inestable');
    });
  });

  /* 26.2 Cavidad con tapa móvil */
  const GHIA_C = { 100: [0.6172, 0.7344], 400: [0.5547, 0.6055], 1000: [0.5313, 0.5625] };
  EM.defineSim('cavidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('Re', { label: 'Número de Reynolds <i>UL</i>/ν', options: [[100, '100'], [400, '400'], [1000, '1000']], value: 100 });
    sim.seg('N', { label: 'Malla', options: [[41, '41 × 41'], [65, '65 × 65']], value: 41 });
    sim.seg('v', { label: 'Fondo', options: [['w', 'Vorticidad'], ['s', 'Rapidez']], value: 'w' });
    sim.out('st', 'Estado', { hl: true });
    sim.out('ps', 'ψ<sub>min</sub> y centro del remolino (Ghia)');
    sim.out('er', 'Diferencia máxima con Ghia en <i>u</i>(0.5, <i>y</i>)');
    let C, dt, done, img, sp;
    const reset = () => {
      C = new FL.Cavity(sim.p.N, sim.p.Re); dt = C.dtMax(); done = false;
      img = new Float64Array(sim.p.N * sim.p.N); sp = img;
      if (!sim.playing && sim.playBtn) sim.toggle(true);
    };
    reset();
    sim.onChange = (id) => { if (id === 'Re' || id === 'N') reset(); };
    sim.resetButton(reset);
    sim.animate(() => {
      if (done) return;
      const t0 = performance.now();
      do { const r = C.step(dt); if (r < 1e-4 && C.t > 1) { done = true; break; } } while (performance.now() - t0 < 14);
      if (done) sim.toggle(false);
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = C.N, h = C.h;
      EM.draw.clear(cv);
      const s = Math.min(H - 30, W * 0.5 - 20), r = { x: 14, y: 16, w: s, h: s };
      const v = EM.flow.view(r, 0, 1, 0, 1);
      if (p.v === 'w') { for (let k = 0; k < N * N; k++) img[k] = C.w[k]; EM.flow.paint(ctx, img, N, N, r, EM.flow.vortMap(6)); }
      else {
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sp[j * N + i] = Math.hypot(C.field('u', i * h, j * h), C.field('v', i * h, j * h));
        EM.flow.paint(ctx, sp, N, N, r, EM.flow.speedMap(1));
      }
      const map = (i, j) => [v.X(i * h), v.Y(j * h)];
      for (const L of [-0.1, -0.09, -0.07, -0.05, -0.03, -0.01, -3e-3, -1e-3, -1e-4]) EM.flow.drawSegs(ctx, EM.flow.contour(C.psi, N, N, L), map, { color: '--ink', width: 1 });
      for (const L of [1e-6, 1e-5, 1e-4, 5e-4, 1e-3]) EM.flow.drawSegs(ctx, EM.flow.contour(C.psi, N, N, L), map, { color: '--c5', width: 1 });
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      EM.draw.arrow(ctx, r.x + 0.3 * s, r.y - 7, r.x + 0.7 * s, r.y - 7, { color: '--accent', width: 2, head: 6 });
      EM.text(ctx, 'U', r.x + 0.75 * s, r.y - 7, { size: 12, color: '--accent', align: 'left' });
      const m = C.psiMin(), g = GHIA_C[p.Re];
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(m.x), v.Y(m.y), 4, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(v.X(g[0]), v.Y(g[1]), 7, 0, 7); ctx.stroke();
      /* perfil u(0.5, y) contra Ghia */
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(0.5), r.y); ctx.lineTo(v.X(0.5), r.y + s); ctx.stroke(); ctx.setLineDash([]);
      const pl = new EM.Plot(ctx, { x: r.x + s + 10, y: 0, w: W - r.x - s - 10, h: H, xmin: -0.5, xmax: 1, ymin: 0, ymax: 1, xlabel: 'u(0.5, y) / U', ylabel: 'y / L' });
      pl.frame();
      pl.vline(0, { color: '--ink-3', dash: [3, 3] });
      const ys = Array.from({ length: 101 }, (_, i) => i / 100);
      pl.xy(ys.map((y) => C.field('u', 0.5, y)), ys, { color: '--accent', width: 2 });
      let e = 0;
      FL.GHIA.y.forEach((y, i) => { const gu = FL.GHIA['u' + p.Re][i]; pl.dot(gu, y, { color: '--c2', r: 3.5 }); e = Math.max(e, Math.abs(C.field('u', 0.5, y) - gu)); });
      pl.legend([{ label: 'cálculo ' + N + ' × ' + N, color: '--accent' }, { label: 'Ghia et al. (1982)', color: '--c2', kind: 'dot' }], 'br');
      sim.set('st', (done ? 'estacionario' : 'iterando') + ' · <i>tU</i>/<i>L</i> = ' + EM.fix(C.t, 1) + ' · residuo ' + EM.sci(C.res, 2));
      sim.set('ps', EM.fix(m.psi, 4) + ' en (' + EM.fix(m.x, 3) + ', ' + EM.fix(m.y, 3) + ') · Ghia ' + EM.fix(FL.GHIA.psiMin[p.Re], 4) + ' en (' + g[0] + ', ' + g[1] + ')');
      sim.set('er', EM.fix(e, 4));
    });
  });

  /* 26.3 Túnel de viento con Lattice Boltzmann */
  const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1], EY = [0, 0, 1, 0, -1, 1, 1, -1, -1], OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];
  const WQ = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
  /* geometrías: devuelven [máscara, longitud característica, nombre de la longitud] */
  const naca = (x, t = 0.12) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
  const GEO = {
    cil: (nx, ny, set) => { const D = 10, cx = 45, cy = ny / 2; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if ((i - cx) ** 2 + (j + 0.5 - cy) ** 2 <= (D / 2) ** 2) set(i, j); return [D, 'diámetro']; },
    placa: (nx, ny, set) => { const D = 10, cy = Math.floor(ny / 2); for (let j = cy - D / 2; j < cy + D / 2; j++) for (let i = 45; i < 47; i++) set(i, j); return [D, 'altura']; },
    perfil: (nx, ny, set) => {
      const c = 40, al = (10 * Math.PI) / 180, x0 = 35, y0 = ny / 2 + 4, ca = Math.cos(al), sa = Math.sin(al);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const dx = i - x0, dy = j + 0.5 - y0, xs = (dx * ca - dy * sa) / c, ys = (dx * sa + dy * ca) / c;
        if (xs >= 0 && xs <= 1 && Math.abs(ys) <= naca(xs)) set(i, j);
      }
      return [c, 'cuerda'];
    },
    tandem: (nx, ny, set) => { const D = 8, cy = ny / 2; for (const cx of [40, 40 + 3 * D]) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if ((i - cx) ** 2 + (j + 0.5 - cy) ** 2 <= (D / 2) ** 2) set(i, j); return [D, 'diámetro']; },
    libre: () => [0, 'altura proyectada']
  };
  EM.defineSim('tunel-lbm', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.seg('g', { label: 'Obstáculo', options: [['cil', 'Cilindro'], ['placa', 'Placa'], ['perfil', 'Perfil 10°'], ['tandem', 'Tándem'], ['libre', 'Dibujar']], value: 'cil' });
    sim.slider('Re', { label: 'Número de Reynolds', min: 20, max: 600, step: 10, value: 150, fmt: (v) => v.toFixed(0) });
    sim.seg('b', { label: 'Pincel del ratón', options: [['add', 'Añadir sólido'], ['del', 'Borrar']], value: 'add' });
    sim.seg('v', { label: 'Mostrar', options: [['w', 'Vorticidad'], ['s', 'Rapidez']], value: 'w' });
    sim.out('re', 'Reynolds y longitud de referencia', { hl: true });
    sim.out('cd', '<i>C</i><sub>D</sub> y <i>C</i><sub>L</sub> medios');
    sim.out('St', 'Número de Strouhal (de <i>C</i><sub>L</sub>)');
    sim.out('tau', 'Tiempo de relajación τ y modelo');
    sim.hint('Arrastre sobre el túnel para añadir o borrar obstáculos', cv);
    const nx = 200, ny = 75, U = 0.1, NN = nx * ny;
    let L, w, sp, Lc = 10, Lname = 'diámetro', hist = [], box = null;
    const charLen = () => {
      /* altura proyectada de los sólidos y su caja */
      let j0 = ny, j1 = -1, i0 = nx, i1 = -1;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (L.solid[j * nx + i]) { j0 = Math.min(j0, j); j1 = Math.max(j1, j); i0 = Math.min(i0, i); i1 = Math.max(i1, i); }
      box = j1 < 0 ? null : [Math.max(1, i0 - 1), Math.min(nx - 2, i1 + 1), Math.max(1, j0 - 1), Math.min(ny - 2, j1 + 1)];
      return j1 < 0 ? 0 : j1 - j0 + 1;
    };
    const setVisc = () => {
      const Lr = Lc || 10;
      L.nu = (U * Lr) / sim.p.Re;
      L.Cs = sim.p.Re > 150 ? 0.1 : 0;
    };
    const reset = () => {
      L = new FL.LBM(nx, ny, { mode: 'tunnel', U, nu: 0.02 });
      const [lc, nm] = GEO[sim.p.g](nx, ny, (i, j) => { L.solid[j * nx + i] = 1; });
      const hp = charLen();
      Lc = sim.p.g === 'libre' ? hp : lc; Lname = nm;
      setVisc();
      L.init(U, 0, (i, j) => [U, i > 35 && i < 85 ? 0.01 * Math.sin((Math.PI * (i - 35)) / 25) : 0]);
      w = new Float32Array(NN); sp = new Float32Array(NN); hist = [];
    };
    reset();
    sim.onChange = (id) => { if (id === 'g') reset(); if (id === 'Re') { setVisc(); hist = []; } };
    sim.resetButton(reset);
    /* fuerza por intercambio de momento restringida a la caja de los sólidos */
    const force = () => {
      if (!box) return [0, 0];
      const f = L.f, s = L.solid;
      let Fx = 0, Fy = 0;
      for (let j = box[2]; j <= box[3]; j++) for (let i = box[0]; i <= box[1]; i++) {
        const k = j * nx + i;
        if (s[k]) continue;
        for (let q = 1; q < 9; q++) if (s[(j + EY[q]) * nx + i + EX[q]]) { const fb = f[OPP[q] * NN + k]; Fx += 2 * EX[q] * fb; Fy += 2 * EY[q] * fb; }
      }
      return [Fx, Fy];
    };
    /* pincel */
    const paint = (x, y) => {
      const ci = Math.round((x / cv.w) * nx), cj = Math.round(((cv.h * 0.8 - y) / (cv.h * 0.8)) * ny), add = sim.p.b === 'add', R = 2.2;
      for (let j = cj - 3; j <= cj + 3; j++) for (let i = ci - 3; i <= ci + 3; i++) {
        if (i < 3 || i >= nx - 3 || j < 1 || j >= ny - 1 || (i - ci) ** 2 + (j - cj) ** 2 > R * R) continue;
        const k = j * nx + i;
        if (add && !L.solid[k]) L.solid[k] = 1;
        else if (!add && L.solid[k]) { L.solid[k] = 0; L.ux[k] = 0; L.uy[k] = 0; for (let q = 0; q < 9; q++) L.f[q * NN + k] = WQ[q]; }
      }
      const hp = charLen();
      if (sim.p.g === 'libre') { Lc = hp; setVisc(); }
      hist = [];
      sim.redraw();
    };
    EM.pointer(cv, {
      down: (x, y) => { if (y > cv.h * 0.8) return null; paint(x, y); return true; },
      move: (_, x, y) => paint(x, y),
      hover: (x, y) => (y <= cv.h * 0.8 ? 'crosshair' : false)
    });
    sim.animate(() => {
      const t0 = performance.now(); let k = 0;
      do {
        L.step(); k++;
        if (Lc > 0) { const F = force(), q = 0.5 * U * U * Lc; hist.push([F[0] / q, F[1] / q]); if (hist.length > 4000) hist.shift(); }
        /* un dibujo muy viscoso a Re alto puede volverse inestable: se reinicia el campo */
        if (L.steps % 200 === 0) { const r = L.rho[(ny >> 1) * nx + nx - 5]; if (!(r > 0.5 && r < 1.5)) { L.init(U, 0); hist = []; } }
      } while (performance.now() - t0 < 12 && k < 20);
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = { x: 0, y: 0, w: W, h: H * 0.8 };
      const Lr = Lc || 10;
      if (p.v === 'w') { L.curl(w); EM.flow.paint(ctx, w, nx, ny, r, EM.flow.vortMap((2 * U) / Math.min(Lr, 16)), { mask: L.solid }); }
      else { for (let k = 0; k < NN; k++) sp[k] = Math.hypot(L.ux[k], L.uy[k]); EM.flow.paint(ctx, sp, nx, ny, r, EM.flow.speedMap(1.7 * U), { mask: L.solid }); }
      const n = hist.length, last = hist.slice(-Math.min(n, 2500));
      let cd = 0, cl = 0;
      for (const h of last) { cd += h[0]; cl += h[1]; }
      cd /= last.length || 1; cl /= last.length || 1;
      const pl = new EM.Plot(ctx, { x: 0, y: r.h + 2, w: W, h: H - r.h - 2, xmin: 0, xmax: 4000, ymin: -1.5, ymax: 3, xlabel: '', ylabel: 'C', mb: 12, mt: 4, xticks: [] });
      pl.frame();
      pl.xy(hist.map((_, i) => i), hist.map((h) => h[0]), { color: '--c1', width: 1.3 });
      pl.xy(hist.map((_, i) => i), hist.map((h) => h[1]), { color: '--c3', width: 1.3 });
      sim.legend([{ label: 'C_D (arrastre)', color: '--c1' }, { label: 'C_L (sustentación)', color: '--c3' }]);
      /* Strouhal: C_L suavizado con una media móvil de 121 pasos (quita las ondas acústicas de la red)
         y cruces con histéresis alrededor de su media */
      const Wm = 60, sm = [];
      let acc = 0;
      for (let i = 0; i < last.length; i++) { acc += last[i][1]; if (i >= 2 * Wm + 1) acc -= last[i - 2 * Wm - 1][1]; if (i >= 2 * Wm) sm.push(acc / (2 * Wm + 1)); }
      let ms = 0; for (const v of sm) ms += v; ms /= sm.length || 1;
      let amp = 0; for (const v of sm) amp = Math.max(amp, Math.abs(v - ms));
      const cr = []; let lo = false;
      for (let i = 0; i < sm.length; i++) { if (sm[i] < ms - 0.3 * amp) lo = true; else if (lo && sm[i] > ms + 0.3 * amp) { cr.push(i); lo = false; } }
      const St = L.steps > 4000 && cr.length >= 3 && amp > 0.03 ? Lr / (U * ((cr[cr.length - 1] - cr[0]) / (cr.length - 1))) : null;
      sim.set('re', Lc > 0 ? EM.fix(p.Re, 0) + ' con la ' + Lname + ' (' + Lc + ' celdas)' : 'dibuje un obstáculo');
      sim.set('cd', Lc > 0 && L.steps > 2500 ? EM.fix(cd, 2) + ' · ' + EM.fix(cl, 2) + (p.g === 'cil' || p.g === 'placa' ? ' (el bloqueo del 13 % del túnel eleva el arrastre)' : '') : '— (transitorio)');
      sim.set('St', St ? EM.fix(St, 3) + ' (con la ' + Lname + ')' : L.steps <= 4000 ? '— (esperando el régimen periódico)' : '— (sin oscilación)');
      sim.set('tau', EM.fix(L.tau, 4) + (L.Cs > 0 ? ' · Smagorinsky C<sub>s</sub> = 0.1 (LES)' : ' · BGK sin modelo') + ' · ' + L.steps + ' pasos');
    });
  });

  /* 26.4 Convergencia de malla en un ducto cuadrado */
  EM.defineSim('convergencia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('N', { label: 'Celdas por lado', options: [[4, '4'], [8, '8'], [16, '16'], [32, '32'], [64, '64'], [128, '128']], value: 16 });
    sim.seg('q', { label: 'Magnitud', options: [['Q', 'Caudal'], ['u', 'Velocidad central']], value: 'Q' });
    sim.out('v', 'Valor numérico y exacto', { hl: true });
    sim.out('e', 'Error relativo');
    sim.out('p', 'Orden observado <i>p</i>');
    sim.out('r', 'Extrapolación de Richardson');
    /* soluciones exactas en serie (lado 1, ∇²u = −1) */
    let s1 = 0, s2 = 0;
    for (let n = 1; n < 200; n += 2) { s1 += Math.tanh((n * Math.PI) / 2) / n ** 5; s2 += (4 * Math.sin((n * Math.PI) / 2)) / (Math.PI ** 3 * n ** 3 * Math.cosh((n * Math.PI) / 2)); }
    const EXA = { Q: ((4 / 3) * (1 - (192 / Math.PI ** 5) * s1)) / 16, u: 1 / 8 - s2 };
    const sols = {};
    const solve = (N) => {
      const h = 1 / N, n = N + 1, u = new Float64Array(n * n), om = 2 / (1 + Math.sin(Math.PI * h));
      for (let it = 0; it < 20000; it++) {
        let mx = 0;
        for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) { const k = j * n + i, d = om * (0.25 * (u[k + 1] + u[k - 1] + u[k + n] + u[k - n] + h * h) - u[k]); u[k] += d; if (Math.abs(d) > mx) mx = Math.abs(d); }
        if (mx < 1e-14) break;
      }
      let Q = 0; for (let k = 0; k < n * n; k++) Q += u[k] * h * h;
      return { u, n, Q, uc: u[(N / 2) * n + N / 2] };
    };
    for (const N of [4, 8, 16, 32, 64, 128]) sols[N] = solve(N);
    const val = (N, q) => (q === 'Q' ? sols[N].Q : sols[N].uc);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = +p.N, S = sols[N], ex = EXA[p.q];
      EM.draw.clear(cv);
      const s = Math.min(H - 20, W * 0.42), r = { x: 10, y: (H - s) / 2, w: s, h: s };
      /* campo u en las celdas (valores nodales) */
      const n = S.n, vals = new Float64Array(n * n);
      for (let k = 0; k < n * n; k++) vals[k] = S.u[k];
      EM.flow.paint(ctx, vals, n, n, r, (v) => EM.cmap.viridis(Math.min(1, v / 0.0737)), { smooth: N > 16 });
      if (N <= 16) {
        ctx.strokeStyle = EM.alpha('--canvas', 0.6); ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) { const x = r.x + (i * r.w) / n; ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); const y = r.y + (i * r.h) / n; ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); }
        ctx.stroke();
      }
      const map = (i, j) => [r.x + ((i + 0.5) * r.w) / n, r.y + r.h - ((j + 0.5) * r.h) / n];
      for (const L of [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]) EM.flow.drawSegs(ctx, EM.flow.contour(vals, n, n, L), map, { color: '--canvas', width: 1, alpha: 0.8 });
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      /* error contra h */
      const Ns = [4, 8, 16, 32, 64, 128];
      const pl = new EM.Plot(ctx, { x: r.x + s + 14, y: 0, w: W - r.x - s - 14, h: H, xmin: 0.005, xmax: 0.4, ymin: 1e-7, ymax: 0.5, xlog: true, ylog: true, xlabel: 'h / a', ylabel: '|error relativo|' });
      pl.frame();
      const e0 = Math.abs((val(4, p.q) - ex) / ex);
      pl.fn((h) => e0 * (h / 0.25) ** 2, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.label(0.03, e0 * (0.03 / 0.25) ** 2 * 3, 'pendiente 2', { color: '--ink-3' });
      pl.xy(Ns.map((m) => 1 / m), Ns.map((m) => Math.abs((val(m, p.q) - ex) / ex)), { color: '--accent', width: 1.6 });
      for (const m of Ns) pl.dot(1 / m, Math.abs((val(m, p.q) - ex) / ex), { color: m === N ? '--c2' : '--accent', r: m === N ? 5.5 : 3.5 });
      const rich = (m) => val(m, p.q) + (val(m, p.q) - val(m / 2, p.q)) / 3;
      for (const m of Ns.slice(1)) pl.dot(1 / m, Math.max(1.2e-7, Math.abs((rich(m) - ex) / ex)), { color: '--c3', r: 3.5 });
      pl.legend([{ label: 'malla', color: '--accent', kind: 'dot' }, { label: 'Richardson', color: '--c3', kind: 'dot' }], 'br');
      const v = val(N, p.q), e = (v - ex) / ex;
      sim.set('v', EM.fix(v, 7) + ' · exacto ' + EM.fix(ex, 7) + (p.q === 'Q' ? ' (·<i>Ga</i>⁴/μ) · <i>f</i>Re = ' + EM.fix(2 / v, 2) : ' (·<i>Ga</i>²/μ)'));
      sim.set('e', EM.sci(e, 2));
      sim.set('p', N >= 16 ? EM.fix(Math.log2((val(N / 2, p.q) - val(N / 4, p.q)) / (val(N, p.q) - val(N / 2, p.q))), 3) + ' (con ' + N / 4 + ', ' + N / 2 + ' y ' + N + ' celdas)' : '— (se necesitan tres mallas)');
      sim.set('r', N >= 8 ? EM.fix(rich(N), 8) + ' · error ' + EM.sci((rich(N) - ex) / ex, 2) + ' (con ' + N / 2 + ' y ' + N + ')' : '—');
    });
  });
})();
