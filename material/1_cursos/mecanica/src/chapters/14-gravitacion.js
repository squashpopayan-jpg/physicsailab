/* ===================================================================
   Capítulo 15 — Gravitación universal
   Simulaciones: gravitacion-ley, campo-g, canon-newton, kepler
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const G = MC.K.G, UA = MC.K.UA;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const sci = (v, d = 3) => MC.sci(v, d);

  /* ======================================================================
     14.1  La ley de la gravitación universal
     ====================================================================== */
  const SYS = {
    personas: { lab: 'Dos estudiantes a 1 m', n: ['Estudiante 1', 'Estudiante 2'], m1: 60, m2: 70, r: 1, rmin: 0.4, rmax: 4, u: [1, 'm'], kind: 'person' },
    cavendish: { lab: 'Balanza de Cavendish (esferas de plomo)', n: ['Esfera grande', 'Esfera pequeña'], m1: 158, m2: 0.73, r: 0.225, rmin: 0.18, rmax: 1.2, u: [1, 'm'], kind: 'lead' },
    peso: { lab: 'Una persona y la Tierra: el peso', n: ['Tierra', 'Persona'], m1: 5.97e24, m2: 70, r: 6.371e6, rmin: 6.371e6, rmax: 4e7, u: [1e6, 'mil km'], kind: 'earth' },
    'tierra-luna': { lab: 'La Tierra y la Luna', n: ['Tierra', 'Luna'], m1: 5.97e24, m2: 7.35e22, r: 3.844e8, rmin: 1.28e8, rmax: 1e9, u: [1e6, 'mil km'], kind: 'moon' },
    'sol-tierra': { lab: 'El Sol y la Tierra', n: ['Sol', 'Tierra'], m1: 1.989e30, m2: 5.97e24, r: 1.496e11, rmin: 5e10, rmax: 8e11, u: [UA, 'UA'], kind: 'sun' }
  };
  const leadR = (m) => Math.cbrt((3 * m) / (4 * Math.PI * 11340));

  MC.defineSim('gravitacion-ley', function (sim) {
    const cv = sim.canvas({ aspect: 2.3, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.9 });
    const st = { sys: 'personas', r0: 1 };
    const geo = { x1: 0, x2: 0, cy: 0, sc: 1, R2px: 10 };
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    const S = () => SYS[st.sys];
    const fmtR = (r) => { const u = S().u[1]; return u === 'm' ? `${sci(r)} m` : u === 'UA' ? `${sci(r / UA)} UA` : `${sci(r / 1000)} km`; };
    sim.group('Cuerpos');
    sim.slider('m1', { label: 'Masa 1', min: 0.6, max: 6000, value: 60, unit: 'kg', fmt: (v) => sci(v), log: true });
    sim.slider('m2', { label: 'Masa 2', min: 0.7, max: 7000, value: 70, unit: 'kg', fmt: (v) => sci(v), log: true });
    sim.group('Separación');
    sim.slider('r', { label: 'Distancia entre centros <i>r</i>', min: 0.4, max: 6, value: 1, fmt: fmtR, log: true });
    sim.note('La longitud de las flechas es proporcional a 1/<i>r</i>²: se comparan fuerzas dentro de un mismo sistema, no entre sistemas.');
    sim.out('F', 'Fuerza gravitacional <i>F</i> = <i>Gm</i>₁<i>m</i>₂/<i>r</i>²', { hl: true });
    sim.out('a1', 'Aceleración del cuerpo 1 (<i>F</i>/<i>m</i>₁)');
    sim.out('a2', 'Aceleración del cuerpo 2 (<i>F</i>/<i>m</i>₂)');
    sim.out('g', 'Campo del cuerpo 1 donde está el 2 (<i>Gm</i>₁/<i>r</i>²)');
    sim.out('cmp', 'Comparación');
    const setSys = (id) => {
      const q = SYS[id];
      st.sys = id; st.r0 = q.r;
      sim.ctl.m1.range(q.m1 / 100, q.m1 * 100); sim.ctl.m1.set(q.m1, true);
      sim.ctl.m2.range(q.m2 / 100, q.m2 * 100); sim.ctl.m2.set(q.m2, true);
      sim.ctl.r.range(q.rmin, q.rmax); sim.ctl.r.set(q.r, true);
      sim.ctl.m1.label(`Masa 1 (${q.n[0].toLowerCase()})`);
      sim.ctl.m2.label(`Masa 2 (${q.n[1].toLowerCase()})`);
    };
    sim.presets(Object.keys(SYS).map((id) => ({ id, label: SYS[id].lab, fn: () => setSys(id) })));
    setSys('personas');
    MC.pointer(cv, {
      down: (x, y) => (Math.hypot(x - geo.x2, y - geo.cy) < Math.max(20, geo.R2px + 8) ? 1 : null),
      move: (id, x) => { const q = S(); sim.ctl.r.set(M.clamp((x - geo.x1) / geo.sc, q.rmin, q.rmax)); },
      hover: (x, y) => Math.hypot(x - geo.x2, y - geo.cy) < Math.max(20, geo.R2px + 8)
    });
    sim.hint('Arrastre el cuerpo 2 para cambiar la distancia', cv);
    const radii = () => {
      const q = S(), p = sim.p;
      if (q.kind === 'person') return [0.22, 0.22];
      if (q.kind === 'lead') return [leadR(p.m1), leadR(p.m2)];
      if (q.kind === 'earth') return [6.371e6, 0];
      if (q.kind === 'moon') return [6.371e6, 1.737e6];
      return [6.957e8, 6.371e6];
    };
    sim.onDraw(() => {
      const p = sim.p, q = S(), ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const F = (G * p.m1 * p.m2) / (p.r * p.r);
      const [R1, R2] = radii();
      const sc = (W - 90) / (q.rmax + R1 + R2);
      const minPx = q.kind === 'sun' ? [18, 7] : q.kind === 'moon' ? [13, 7] : q.kind === 'earth' ? [9, 5] : [4, 4];
      const R1px = Math.max(R1 * sc, minPx[0]), R2px = Math.max(R2 * sc, minPx[1]);
      const enlarged = R1 * sc < minPx[0] - 0.5 || (R2 > 0 && R2 * sc < minPx[1] - 0.5);
      const person = q.kind === 'person';
      const cy = person ? H - 30 - 0.95 * sc : H * 0.5;
      const x1 = 36 + (person ? 20 : R1px), x2 = x1 + p.r * sc;
      Object.assign(geo, { x1, x2, cy, sc, R2px: person ? 24 : R2px });
      if (person) {
        D.ground(ctx, 0, H - 30, W, { depth: 10 });
        D.person(ctx, x1, H - 30, 1.7 * sc, { color: '--c1', arms: 0.2 });
        D.person(ctx, x2, H - 30, 1.7 * sc, { color: '--c4', arms: 0.2 });
      } else {
        const fills = { lead: ['--metal', '--metal'], earth: ['--body-b', '--c4'], moon: ['--body-b', '--metal'], sun: ['--marker-solid', '--body-b'] }[q.kind];
        D.ball(ctx, x1, cy, R1px, { fill: fills[0] });
        D.ball(ctx, x2, cy, R2px, { fill: fills[1] });
      }
      const topY = person ? H - 30 - 1.7 * sc : cy - Math.max(R1px, R2px);
      MC.text(ctx, q.n[0], x1, Math.max(14, topY - 8), { size: 11.5, align: 'center', weight: 600, color: '--ink-2', halo: true });
      MC.text(ctx, q.n[1], x2, Math.max(14, (person ? topY : cy - R2px) - 8), { size: 11.5, align: 'center', weight: 600, color: '--ink-2', halo: true });
      /* fuerzas iguales y opuestas */
      const La = M.clamp(60 * Math.pow(st.r0 / p.r, 2), 10, W * 0.35);
      const dy = 8;
      D.vec(ctx, x1, cy - dy, La, 0, { color: '--force', label: 'F', width: 2.6, labelSide: -1 });
      D.vec(ctx, x2, cy + dy, -La, 0, { color: '--force', label: 'F', width: 2.6, labelSide: -1 });
      MC.text(ctx, 'fuerza sobre 1', x1 + 4, cy - dy - 22, { size: 10.5, color: '--force', halo: true });
      MC.text(ctx, 'fuerza sobre 2', x2 - 4, cy + dy + 20, { size: 10.5, align: 'right', color: '--force', halo: true });
      const yd = person ? H - 12 : Math.min(H - 12, cy + Math.max(R1px, R2px, dy + 20) + 22);
      D.dim(ctx, x1, yd, x2, yd, `r = ${fmtR(p.r)}`, { size: 11, labelOff: -9 });
      if (enlarged) MC.text(ctx, 'tamaños de los cuerpos ampliados; distancia a escala', W - 8, 16, { size: 10.5, align: 'right', color: '--ink-3' });
      /* gráfica F(r) */
      const gctx = gc.ctx;
      D.clear(gc);
      const ux = q.u[0];
      const Fmax = (G * p.m1 * p.m2) / (q.rmin * q.rmin);
      const k = Math.floor(Math.log10(Fmax)), sk = Math.pow(10, k);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: q.rmin / ux, xmax: q.rmax / ux, ymin: 0, ymax: MC.niceCeil((Fmax / sk) * 1.02), xlabel: ['r', q.u[1]], ylabel: ['F', k === 0 ? 'N' : `10${MC.sup(k)} N`], mb: 38, mt: 12, ml: 54, mr: 16 });
      P.frame();
      const Fr = (xr) => (G * p.m1 * p.m2) / Math.pow(xr * ux, 2) / sk;
      P.fn(Fr, { color: '--force', width: 2.2 });
      const xr = p.r / ux;
      [[2, 'F/4'], [3, 'F/9'], [0.5, '4F']].forEach(([m, t]) => {
        const xx = xr * m;
        if (xx < P.o.xmin || xx > P.o.xmax) return;
        P.vline(xx, { y0: 0, y1: Fr(xx), color: '--ink-3' });
        P.dot(xx, Fr(xx), { color: '--ink-3', r: 3.5, label: `${t} en ${m === 0.5 ? 'r/2' : m + 'r'}`, dy: -9 });
      });
      P.vline(xr, { y0: 0, y1: Fr(xr), color: '--force' });
      P.dot(xr, Fr(xr), { color: '--force', r: 6, label: 'F', dy: -10, math: true });
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'F', unit: 'N', color: '--force', y: Fr(hov.hx), value: Fr(hov.hx) * sk, fmt: (v) => sci(v) }], { label: 'r', unit: q.u[1], fmt: (v) => sci(v) });
      /* lecturas */
      sim.set('F', `${sci(F)} N`);
      sim.set('a1', `${sci(F / p.m1)} m/s²`);
      sim.set('a2', `${sci(F / p.m2)} m/s²`);
      sim.set('g', `${sci((G * p.m1) / (p.r * p.r))} m/s²`);
      if (q.kind === 'earth') { const Fs = (G * p.m1 * p.m2) / (6.371e6 * 6.371e6); sim.set('cmp', `en la superficie (r = R) la fuerza es ${f0(Fs)} N; aquí es el ${f1((100 * F) / Fs)} % de ese valor`); }
      else sim.set('cmp', `F es ${sci(F / (p.m2 * 9.8))} veces el peso de 2 en la Tierra`);
    });
  });

  /* ======================================================================
     14.2  El campo gravitacional de un planeta
     ====================================================================== */
  const BOD = {
    tierra: { n: 'Tierra', M: 5.972e24, R: 6.371e6, fill: '--body-b' },
    luna: { n: 'Luna', M: 7.342e22, R: 1.7374e6, fill: '--metal' },
    marte: { n: 'Marte', M: 6.417e23, R: 3.3895e6, fill: '--body-c' },
    venus: { n: 'Venus', M: 4.867e24, R: 6.0518e6, fill: '--body-a' },
    jupiter: { n: 'Júpiter', M: 1.898e27, R: 6.9911e7, fill: '--wood' }
  };
  const SATS = [['EEI', 6.771e6], ['GPS', 2.6571e7], ['geoestacionario', 4.2164e7]];

  MC.defineSim('campo-g', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.2 });
    const view = new MC.View2D(cv, { xmin: -1, xmax: 1, ymin: -1, ymax: 1, pad: 8 });
    const s = { t: 0 };
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    sim.group('Planeta');
    sim.select('pl', { label: 'Cuerpo central', value: 'tierra', options: Object.keys(BOD).map((k) => [k, BOD[k].n]), reset: true });
    sim.seg('modo', { options: [['campo', 'Campo g(r)'], ['tunel', 'Túnel por el centro']], value: 'campo', reset: true });
    const gPos = sim.group('Posición del objeto');
    sim.slider('rr', { label: 'Distancia al centro <i>r</i>/<i>R</i>', min: 0, max: 10, step: 0.0005, value: 1.0628, fmt: f3 });
    sim.check('orb', { label: 'Mostrar órbitas de satélites (Tierra)', value: true });
    sim.out('r', 'Distancia al centro <i>r</i>');
    sim.out('h', 'Altura sobre la superficie');
    sim.out('g', 'Gravedad <i>g</i>', { hl: true });
    sim.out('pct', '<i>g</i>/<i>g</i>₀');
    sim.out('w', 'Peso de una persona de 70 kg');
    sim.out('orbv', 'Órbita circular a esa distancia');
    sim.presets([
      { id: 'superficie', label: 'En la superficie', v: { modo: 'campo', rr: 1 } },
      { id: 'everest', label: 'Cima del Everest (8.8 km)', v: { pl: 'tierra', modo: 'campo', rr: 1 + 8.849e3 / 6.371e6 } },
      { id: 'eei', label: 'Estación Espacial Internacional (400 km)', v: { pl: 'tierra', modo: 'campo', rr: 1 + 4e5 / 6.371e6 } },
      { id: 'gps', label: 'Satélites GPS (20 200 km)', v: { pl: 'tierra', modo: 'campo', rr: 1 + 2.02e7 / 6.371e6 } },
      { id: 'geo', label: 'Órbita geoestacionaria (35 786 km)', v: { pl: 'tierra', modo: 'campo', rr: 4.2164e7 / 6.371e6 } },
      { id: 'mitad', label: 'A mitad de camino hacia el centro', v: { modo: 'campo', rr: 0.5 } },
      { id: 'tunel', label: 'Túnel a través de la Tierra', v: { pl: 'tierra', modo: 'tunel' } },
      { id: 'luna', label: 'En la superficie de la Luna', v: { pl: 'luna', modo: 'campo', rr: 1 } }
    ]);
    const B = () => BOD[sim.p.pl];
    const g0 = () => (G * B().M) / (B().R * B().R);
    const gAt = (r) => { const b = B(); return r >= b.R ? (G * b.M) / (r * r) : (g0() * r) / b.R; };
    const Ttun = () => 2 * Math.PI * Math.sqrt(B().R / g0());
    const pos = () => (sim.p.modo === 'tunel' ? B().R * Math.cos((2 * Math.PI * s.t) / Ttun()) : sim.p.rr * B().R);
    const sync = () => {
      const tun = sim.p.modo === 'tunel';
      gPos.hidden = tun;
      sim.actions.hidden = !tun;
      sim.ts = Ttun() / 12;
    };
    sim.run({
      startLabel: 'Soltar en el túnel',
      h: 1,
      timeScale: 420,
      timeFmt: (t) => `t = ${MC.fix(t / 60, 1)} min`,
      reset() { s.t = 0; },
      step(h) { if (sim.p.modo !== 'tunel') { sim.end(); return; } s.t += h; }
    });
    sim.onChange = sync;
    sync();
    sim.onDraw(() => {
      const p = sim.p, b = B(), ctx = cv.ctx, tun = p.modo === 'tunel';
      const x = pos(), r = Math.abs(x), gg = gAt(r), G0 = g0();
      const E = tun ? 1.3 * b.R : Math.max(1.32 * b.R, 1.16 * r);
      view.setRange({ xmin: -E, xmax: E, ymin: -E, ymax: E });
      D.clear(cv);
      /* flechas del campo alrededor del planeta */
      const radii = [1.25, 1.6, 2.1, 3, 4.5, 6.5, 9, 12].map((k) => k * b.R).filter((q) => q < E * 0.97);
      for (const rk of radii) {
        const len = Math.max(3, (36 * gAt(rk)) / G0);
        for (let j = 0; j < 12; j++) {
          const a = (j * Math.PI) / 6 + Math.PI / 12;
          const px = view.X(rk * Math.cos(a)), py = view.Y(rk * Math.sin(a));
          D.arrow(ctx, px, py, px - len * Math.cos(a), py + len * Math.sin(a), { color: '--c7', width: 1.3, alpha: 0.55, head: 6 });
        }
      }
      if (p.pl === 'tierra' && p.orb && !tun) {
        for (const [n, rs] of SATS) {
          if (rs > E * 0.98) continue;
          D.circle(ctx, view.X(0), view.Y(0), view.L(rs), { color: '--ink-3', dash: [4, 5], width: 1 });
          MC.text(ctx, n, view.X(rs * Math.cos(2.2)), view.Y(rs * Math.sin(2.2)) - 4, { size: 10.5, color: '--ink-3', align: 'center', halo: true });
        }
      }
      D.ball(ctx, view.X(0), view.Y(0), view.L(b.R), { fill: b.fill });
      if (p.pl === 'tierra') D.circle(ctx, view.X(0), view.Y(0), view.L(b.R * 1.012), { color: '--c7', width: 1.5, alpha: 0.5 });
      if (tun || r < b.R) {
        const tw = Math.max(5, view.L(b.R * 0.06));
        ctx.save(); ctx.fillStyle = MC.col('--canvas'); ctx.globalAlpha = 0.85;
        ctx.fillRect(view.X(-b.R), view.Y(0) - tw / 2, view.L(2 * b.R), tw);
        ctx.restore();
        D.line(ctx, view.X(-b.R), view.Y(0) - tw / 2, view.X(b.R), view.Y(0) - tw / 2, { color: '--ink-3', width: 1 });
        D.line(ctx, view.X(-b.R), view.Y(0) + tw / 2, view.X(b.R), view.Y(0) + tw / 2, { color: '--ink-3', width: 1 });
      }
      D.circle(ctx, view.X(0), view.Y(0), 2.5, { fill: '--ink' });
      /* objeto y su vector g */
      const ox = view.X(x), oy = view.Y(0);
      const Lg = Math.max(4, (70 * gg) / G0);
      if (r > 1) D.vec(ctx, ox, oy, -Math.sign(x) * Lg, 0, { color: '--weight', label: 'g', width: 2.4, labelSide: -1 });
      if (tun) {
        const w = (2 * Math.PI) / Ttun(), vx = -b.R * w * Math.sin(w * s.t), Lv = (60 * vx) / (b.R * w);
        if (Math.abs(Lv) > 2) D.vec(ctx, ox, oy - 14, Lv, 0, { color: '--vel', label: 'v', width: 2.2 });
      }
      D.ball(ctx, ox, oy, 6, { fill: '--c4' });
      if (!tun && r > b.R * 0.15) D.dim(ctx, view.X(0), oy + 26, ox, oy + 26, 'r', { color: '--ink-3', math: true, size: 13, labelOff: 11 });
      /* barra de escala */
      const nice = MC.niceStep(E * 0.6, 1);
      view.scaleBar(nice, nice >= 1e6 ? `${MC.fix(nice / 1e3, 0)} km` : `${MC.fix(nice / 1e3, 0)} km`);
      MC.text(ctx, b.n, view.X(0), view.Y(-b.R) + 16, { size: 12, align: 'center', weight: 600, color: '--ink-2', halo: true });
      if (tun) MC.text(ctx, `vuelta completa: ${MC.fix(Ttun() / 60, 1)} min`, 10, cv.h - 12, { size: 11, color: '--ink-2', halo: true });
      /* gráfica g(r) */
      const gctx = gc.ctx;
      D.clear(gc);
      const rr = r / b.R;
      const xmax = tun || rr <= 3.2 ? 4 : 10;
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax, ymin: 0, ymax: G0 * 1.16, xlabel: ['r/R', ''], ylabel: ['g', 'm/s²'], mb: 38, mt: 12, ml: 50, mr: 16 });
      P.frame();
      P.band(0, 1, { color: b.fill, alpha: 0.12 });
      P.label(0.5, G0 * 1.04, 'dentro', { align: 'center', size: 10.5, color: '--ink-3' });
      P.fn((q) => gAt(q * b.R), { color: '--weight', width: 2.4, n: 500 });
      P.hline(G0, { color: '--ink-3', label: `g₀ = ${f2(G0)} m/s²`, labelRight: true, below: false });
      P.vline(1, { color: '--ink-3', label: 'superficie', labelY: 26 });
      if (p.pl === 'tierra' && !tun) SATS.forEach(([n, rs]) => { const q = rs / b.R; if (q <= xmax) P.dot(q, gAt(rs), { color: '--ink-3', r: 3, label: n, dy: -8 }); });
      P.dot(rr, gg, { color: '--c4', r: 6 });
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'g', unit: 'm/s²', color: '--weight', y: gAt(hov.hx * b.R), fmt: f3 }], { label: 'r/R', fmt: f3 });
      /* lecturas */
      sim.set('r', `${sci(r / 1000, 4)} km (${f3(rr)} R)`);
      sim._outs.h.label(r >= b.R ? 'Altura sobre la superficie' : 'Profundidad bajo la superficie');
      sim._outs.orbv.label(tun ? 'Movimiento en el túnel' : 'Órbita circular a esa distancia');
      sim.set('h', `${sci(Math.abs(r - b.R) / 1000, 4)} km`);
      sim.set('g', `${f3(gg)} m/s²`);
      sim.set('pct', `${f1((100 * gg) / G0)} %`);
      sim.set('w', `${f1(70 * gg)} N`);
      if (tun) {
        const w = (2 * Math.PI) / Ttun();
        sim.set('orbv', `rapidez ${f2((b.R * w * Math.abs(Math.sin(w * s.t))) / 1000)} km/s (máx. ${f2((b.R * w) / 1000)} km/s); cruza el planeta en ${MC.fix(Ttun() / 120, 1)} min`);
      } else if (r >= b.R) sim.set('orbv', `v = ${f2(Math.sqrt((G * b.M) / r) / 1000)} km/s, T = ${MC.time(2 * Math.PI * Math.sqrt((r * r * r) / (G * b.M)))}`);
      else sim.set('orbv', '— (dentro del planeta)');
    });
  });

  /* ======================================================================
     14.3  El cañón de Newton
     ====================================================================== */
  const PLN = {
    tierra: { n: 'Tierra', GM: 3.986e14, R: 6.371e6, fill: '--body-b' },
    luna: { n: 'Luna', GM: 4.905e12, R: 1.7374e6, fill: '--metal' },
    marte: { n: 'Marte', GM: 4.283e13, R: 3.3895e6, fill: '--body-c' }
  };

  MC.defineSim('canon-newton', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    const view = new MC.View2D(cv, { xmin: -1, xmax: 1, ymin: -1, ymax: 1, pad: 10 });
    const s = { x: 0, y: 0, vx: 0, vy: 0, t: 0, trail: [], state: 'listo', ang: 0, prevA: Math.PI / 2, range: 0 };
    const old = [];
    const st = sim.status(cv);
    sim.group('Lanzamiento');
    sim.select('pl', { label: 'Planeta', value: 'tierra', options: Object.keys(PLN).map((k) => [k, PLN[k].n]), reset: true });
    sim.slider('v0', { label: 'Rapidez de lanzamiento <i>v</i>₀', min: 0.2, max: 14, step: 0.01, value: 7.67, unit: 'km/s', fmt: f2, reset: true });
    sim.slider('h0', { label: 'Altura del cañón', min: 0, max: 3000, step: 5, value: 400, unit: 'km', fmt: f0, reset: true });
    sim.slider('ang', { label: 'Ángulo sobre la horizontal', min: -30, max: 60, step: 1, value: 0, unit: '°', fmt: f0, reset: true });
    sim.group('Trayectorias');
    sim.check('keep', { label: 'Conservar las trayectorias anteriores', value: true });
    sim.button('Borrar trayectorias', () => { old.length = 0; });
    sim.note('Sin atmósfera. La montaña se dibuja a escala (mínimo unos píxeles).');
    sim.out('vc', 'Rapidez para órbita circular a esa altura');
    sim.out('ve', 'Velocidad de escape a esa altura');
    sim.out('E', 'Energía total por kilogramo <i>E</i>/<i>m</i>');
    sim.out('kind', 'Tipo de trayectoria', { hl: true });
    sim.out('T', 'Periodo orbital');
    sim.out('alt', 'Perigeo y apogeo (alturas)');
    sim.out('res', 'Resultado del disparo');
    sim.presets([
      { id: 'cae', label: 'Disparo lento: la bala cae', v: { pl: 'tierra', v0: 3, h0: 100, ang: 0 } },
      { id: 'lejos', label: 'Más rápido: cae mucho más lejos', v: { pl: 'tierra', v0: 7, h0: 100, ang: 0 } },
      { id: 'circular', label: 'Órbita circular de la Estación Espacial', v: { pl: 'tierra', v0: 7.67, h0: 400, ang: 0 }, note: 'A 400 km, 7.67 km/s: una vuelta cada 92 minutos.' },
      { id: 'eliptica', label: 'Órbita elíptica (9 km/s)', v: { pl: 'tierra', v0: 9, h0: 400, ang: 0 } },
      { id: 'escape', label: 'Rapidez de escape: la bala no regresa', v: { pl: 'tierra', v0: 11, h0: 400, ang: 0 }, note: 'A 400 km la velocidad de escape es 10.85 km/s.' },
      { id: 'luna', label: 'Órbita rasante en la Luna', v: { pl: 'luna', v0: 1.67, h0: 20, ang: 0 }, note: 'En la Luna basta 1.7 km/s para orbitar: la velocidad de un fusil potente.' }
    ]);
    const P = () => PLN[sim.p.pl];
    const elem = () => {
      const q = P(), p = sim.p, r0 = q.R + p.h0 * 1000, v0 = p.v0 * 1000, al = M.rad(p.ang);
      const E = (v0 * v0) / 2 - q.GM / r0, Lm = r0 * v0 * Math.cos(al);
      const e = Math.sqrt(Math.max(0, 1 + (2 * E * Lm * Lm) / (q.GM * q.GM)));
      const rp = (Lm * Lm) / (q.GM * (1 + e));
      const a = E < 0 ? -q.GM / (2 * E) : Infinity;
      const ra = E < 0 ? a * (1 + e) : Infinity;
      let kind;
      if (E >= 0) kind = al < 0 && rp < q.R ? 'cae (choca antes de escapar)' : Math.abs(e - 1) < 0.01 ? 'escapa (trayectoria parabólica)' : 'escapa (trayectoria hiperbólica)';
      else kind = rp < q.R ? 'cae: trayectoria balística' : e < 0.01 ? 'órbita circular' : 'órbita elíptica';
      /* vector excentricidad → centro de la elipse */
      const rx = 0, ry = r0, vx = v0 * Math.cos(al), vy = v0 * Math.sin(al);
      const k1 = v0 * v0 - q.GM / r0, rv = rx * vx + ry * vy;
      const ex = (k1 * rx - rv * vx) / q.GM, ey = (k1 * ry - rv * vy) / q.GM;
      return { r0, v0, E, e, rp, ra, a, kind, ex, ey, hits: kind.startsWith('cae'), vc: Math.sqrt(q.GM / r0), ve: Math.sqrt((2 * q.GM) / r0), T: E < 0 ? 2 * Math.PI * Math.sqrt((a * a * a) / q.GM) : Infinity };
    };
    const init = () => {
      const q = P(), p = sim.p, al = M.rad(p.ang);
      s.x = 0; s.y = q.R + p.h0 * 1000; s.vx = p.v0 * 1000 * Math.cos(al); s.vy = p.v0 * 1000 * Math.sin(al);
      s.t = 0; s.trail = [[s.x, s.y]]; s.state = 'listo'; s.ang = 0; s.prevA = Math.PI / 2; s.range = 0;
      st.hide();
    };
    sim.run({
      startLabel: 'Disparar',
      h: 2,
      timeScale: 300,
      timeFmt: (t) => (t < 7200 ? `t = ${MC.fix(t / 60, 1)} min` : `t = ${MC.fix(t / 3600, 2)} h`),
      reset() {
        if (s.t > 0 && s.trail.length > 2 && sim.p.keep) { old.push(s.trail); if (old.length > 6) old.shift(); }
        init();
      },
      step(h) {
        const q = P();
        const f = (t, y) => { const r2 = y[0] * y[0] + y[1] * y[1], r = Math.sqrt(r2), a = -q.GM / (r2 * r); return [y[2], y[3], a * y[0], a * y[1]]; };
        const y = M.rk4(f, [s.x, s.y, s.vx, s.vy], 0, h);
        s.x = y[0]; s.y = y[1]; s.vx = y[2]; s.vy = y[3]; s.t += h;
        s.state = 'vuelo';
        const a = Math.atan2(s.y, s.x);
        let da = a - s.prevA;
        if (da > Math.PI) da -= 2 * Math.PI;
        if (da < -Math.PI) da += 2 * Math.PI;
        s.ang += da; s.prevA = a;
        const r = Math.hypot(s.x, s.y);
        const last = s.trail[s.trail.length - 1];
        if (Math.hypot(s.x - last[0], s.y - last[1]) > q.R / 150 && s.trail.length < 6000) s.trail.push([s.x, s.y]);
        if (r <= q.R) {
          s.x *= q.R / r; s.y *= q.R / r; s.trail.push([s.x, s.y]);
          s.state = 'impacto'; s.range = Math.abs(s.ang) * q.R;
          st.show(`Impacto a ${f0(s.range / 1000)} km del cañón (medidos sobre la superficie), tras ${MC.time(s.t)}`, 'bad');
          sim.end();
        } else if (r > 6 * q.R && (s.vx * s.vx + s.vy * s.vy) / 2 - q.GM / r >= 0) { s.state = 'escape'; st.show('La bala escapó: se aleja para siempre', 'good'); sim.end(); }
        else if (r > 40 * q.R) { s.state = 'escape'; sim.end(); }
        else if (Math.abs(s.ang) >= 4 * Math.PI) { s.state = 'orbita'; st.show('Dos vueltas completas: está en órbita', 'good'); sim.end(); }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, q = P(), el = elem(), ctx = cv.ctx;
      /* vista: la elipse completa si es ligada; si no, el planeta y alrededores */
      let cx = 0, cy = 0, ext;
      if (!el.hits && el.E < 0) { cx = -el.a * el.ex; cy = -el.a * el.ey; ext = el.a * 1.08; }
      else if (el.E < 0) ext = Math.max(1.3 * q.R, Math.min(el.ra, 5 * q.R) * 1.12);
      else ext = 4.5 * q.R;
      ext = Math.max(ext, el.r0 * 1.12);
      view.setRange({ xmin: cx - ext, xmax: cx + ext, ymin: cy - ext, ymax: cy + ext });
      D.clear(cv);
      D.circle(ctx, view.X(0), view.Y(0), view.L(el.r0), { color: '--ink-3', dash: [3, 6], width: 1 });
      D.ball(ctx, view.X(0), view.Y(0), view.L(q.R), { fill: q.fill });
      if (p.pl === 'tierra') D.circle(ctx, view.X(0), view.Y(0), view.L(q.R * 1.012), { color: '--c7', width: 1.5, alpha: 0.5 });
      MC.text(ctx, q.n, view.X(0), view.Y(0) + 4, { size: 13, align: 'center', weight: 600, color: '--body-ink' });
      /* montaña (torre) y cañón */
      const mh = Math.max(8, view.L(p.h0 * 1000)), mw = Math.max(5, view.L(q.R * 0.03));
      const base = view.Y(q.R);
      D.poly(ctx, [[view.X(0) - mw, base + 3], [view.X(0), base - mh], [view.X(0) + mw, base + 3]], { close: true, fill: '--ink-3', color: '--ink-2', width: 1 });
      D.block(ctx, view.X(0), base - mh - 3, 16, 6, { fill: '--ink-2', ang: M.rad(p.ang), r: 1 });
      /* trayectorias */
      old.forEach((tr, i) => D.poly(ctx, tr.map((pt) => view.P(pt)), { color: '--ink-3', width: 1.4, alpha: 0.35 + (0.4 * (i + 1)) / old.length }));
      if (s.trail.length > 1) D.poly(ctx, s.trail.concat([[s.x, s.y]]).map((pt) => view.P(pt)), { color: '--c4', width: 2.2 });
      /* bala con velocidad y gravedad */
      const bx = view.X(s.x), by = view.Y(s.y), r = Math.hypot(s.x, s.y), v = Math.hypot(s.vx, s.vy);
      if (s.state !== 'impacto') {
        const Lv = (70 * v) / el.ve;
        if (v > 1) D.vec(ctx, bx, by, (s.vx / v) * Lv, (-s.vy / v) * Lv, { color: '--vel', label: 'v', width: 2.2 });
        const g = q.GM / (r * r), g0 = q.GM / (q.R * q.R), Lg = Math.max(6, (40 * g) / g0);
        D.vec(ctx, bx, by, (-s.x / r) * Lg, (s.y / r) * Lg, { color: '--weight', label: 'g', width: 2, labelSide: -1 });
      }
      D.ball(ctx, bx, by, 5, { fill: '--c2' });
      /* energía por unidad de masa */
      const K = (v * v) / 2e6, U = -q.GM / r / 1e6;
      const mx = MC.niceCeil(Math.max((el.v0 * el.v0) / 2e6, q.GM / el.r0 / 1e6) * 1.05);
      const bh = Math.min(230, cv.h * 0.42);
      D.bars(ctx, [{ label: 'K', value: K, color: '--K' }, { label: 'U', value: U, color: '--Ug' }], { x: 8, y: cv.h - bh - 8, w: 150, h: bh, max: mx, min: -mx, title: 'ENERGÍA (MJ/kg)', total: { label: 'E', value: K + U, color: '--Etot' }, fmt: f1 });
      /* lecturas */
      sim.set('vc', `${f2(el.vc / 1000)} km/s`);
      sim.set('ve', `${f2(el.ve / 1000)} km/s`);
      sim.set('E', `${MC.fix(el.E / 1e6, 2)} MJ/kg ${el.E < 0 ? '(ligada)' : '(no ligada)'}`);
      sim.set('kind', el.kind);
      sim.set('T', !el.hits && el.E < 0 ? MC.time(el.T) : '—');
      sim.set('alt', !el.hits && el.E < 0 ? `${f0((el.rp - q.R) / 1000)} km y ${f0((el.ra - q.R) / 1000)} km` : el.E < 0 ? `altura máxima ${f0((el.ra - q.R) / 1000)} km` : '—');
      sim.set('res', s.state === 'impacto' ? `choca a ${f0(s.range / 1000)} km, tras ${MC.time(s.t)}` : s.state === 'escape' ? 'escapó' : s.state === 'orbita' ? '2 vueltas completas' : s.state === 'vuelo' ? 'en vuelo' : 'listo para disparar');
    });
  });

  /* ======================================================================
     14.5  Las tres leyes de Kepler
     ====================================================================== */
  /* [nombre, a (UA), e, posición del rótulo: 1 = arriba a la izquierda, −1 = abajo a la derecha] */
  const PLANETS = [['Mercurio', 0.387, 0.2056, -1], ['Venus', 0.723, 0.0068, 1], ['Tierra', 1, 0.0167, -1], ['Marte', 1.524, 0.0934, 1], ['Júpiter', 5.203, 0.0489, -1], ['Saturno', 9.537, 0.0565, 1], ['Urano', 19.19, 0.0457, -1], ['Neptuno', 30.07, 0.0113, 1], ['Plutón', 39.48, 0.2488, -1]];
  const VUA = UA / 3.15576e7 / 1000; /* 1 UA/año en km/s */

  MC.defineSim('kepler', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.9 });
    const view = new MC.View2D(cv, { xmin: -1, xmax: 1, ymin: -1, ymax: 1, pad: 26 });
    const TANIM = 10;
    const s = { Mn: 0, yrs: 0 };
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    sim.group('Órbita');
    sim.slider('a', { label: 'Semieje mayor <i>a</i>', min: 0.2, max: 50, value: 2, unit: 'UA', fmt: (v) => sci(v), log: true });
    sim.slider('e', { label: 'Excentricidad <i>e</i>', min: 0, max: 0.97, step: 0.001, value: 0.6, fmt: f3 });
    sim.slider('Ms', { label: 'Masa de la estrella', min: 0.1, max: 10, value: 1, unit: 'masas solares', fmt: f2, log: true });
    sim.group('Visualización');
    sim.check('areas', { label: 'Sombrear las áreas barridas en tiempos iguales', value: true });
    sim.slider('ns', { label: 'Intervalos iguales por vuelta', min: 4, max: 16, step: 1, value: 8, fmt: f0 });
    sim.check('vel', { label: 'Mostrar el vector velocidad', value: true });
    sim.seg('graf', { label: 'Gráfica', options: [['k3', 'Tercera ley'], ['vt', 'Rapidez en una vuelta']], value: 'k3' });
    sim.button('Reiniciar la vuelta', () => { s.Mn = 0; s.yrs = 0; });
    sim.out('T', 'Periodo <i>T</i> = <i>a</i><sup>3/2</sup>/√<i>M</i>', { hl: true });
    sim.out('rp', 'Perihelio <i>r</i><sub>p</sub> = <i>a</i>(1 − <i>e</i>)');
    sim.out('ra', 'Afelio <i>r</i><sub>a</sub> = <i>a</i>(1 + <i>e</i>)');
    sim.out('v', 'Rapidez en el perihelio / en el afelio');
    sim.out('rat', '<i>v</i><sub>p</sub>/<i>v</i><sub>a</sub> = <i>r</i><sub>a</sub>/<i>r</i><sub>p</sub>');
    sim.out('A', 'Área barrida en cada intervalo');
    sim.out('t', 'Tiempo transcurrido');
    sim.presets([
      { id: 'tierra', label: 'La Tierra', v: { a: 1, e: 0.0167, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; }, note: 'Casi un círculo: la distancia al Sol varía sólo un 3.4 %.' },
      { id: 'mercurio', label: 'Mercurio', v: { a: 0.387, e: 0.2056, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; } },
      { id: 'marte', label: 'Marte', v: { a: 1.524, e: 0.0934, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; } },
      { id: 'halley', label: 'El cometa Halley', v: { a: 17.83, e: 0.967, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; }, note: 'Pasa casi todo su periodo de 75 años lejos del Sol y cruza el perihelio en pocos meses.' },
      { id: 'pluton', label: 'Plutón', v: { a: 39.48, e: 0.2488, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; } },
      { id: 'excentrica', label: 'Órbita muy excéntrica (e = 0.75)', v: { a: 2, e: 0.75, Ms: 1 }, fn: () => { s.Mn = 0; s.yrs = 0; } },
      { id: 'estrella', label: 'Estrella de 4 masas solares', v: { a: 1, e: 0.3, Ms: 4 }, fn: () => { s.Mn = 0; s.yrs = 0; }, note: 'Con 4 veces más masa, el mismo tamaño de órbita se recorre en la mitad del tiempo.' }
    ]);
    const per = () => Math.pow(sim.p.a, 1.5) / Math.sqrt(sim.p.Ms);
    const posAt = (E) => { const p = sim.p, b = p.a * Math.sqrt(1 - p.e * p.e); return [p.a * (Math.cos(E) - p.e), b * Math.sin(E)]; };
    const speedAt = (E) => { const p = sim.p, n = (2 * Math.PI) / per(), b = p.a * Math.sqrt(1 - p.e * p.e), Ed = n / (1 - p.e * Math.cos(E)); return [-p.a * Math.sin(E) * Ed, b * Math.cos(E) * Ed]; };
    sim.animate((dt) => {
      s.Mn += (2 * Math.PI * dt) / TANIM;
      if (s.Mn >= 2 * Math.PI) s.Mn -= 2 * Math.PI;
      s.yrs += (per() * dt) / TANIM;
    }, { button: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = per();
      const b = p.a * Math.sqrt(1 - p.e * p.e);
      view.setRange({ xmin: -p.a * (1 + p.e), xmax: p.a * (1 - p.e), ymin: -b, ymax: b });
      D.clear(cv);
      /* sectores de igual tiempo */
      const ns = Math.round(p.ns);
      const Ecur = MC.phys.keplerE(s.Mn, p.e);
      if (p.areas) {
        const kcur = Math.floor((s.Mn / (2 * Math.PI)) * ns) % ns;
        for (let k = 0; k < ns; k++) {
          const E0 = MC.phys.keplerE((2 * Math.PI * k) / ns, p.e);
          const E1 = k === ns - 1 ? 2 * Math.PI : MC.phys.keplerE((2 * Math.PI * (k + 1)) / ns, p.e);
          const pts = [view.P([0, 0])];
          for (let j = 0; j <= 40; j++) pts.push(view.P(posAt(E0 + ((E1 - E0) * j) / 40)));
          D.poly(ctx, pts, { close: true, fill: k % 2 ? '--c4' : '--c1', fillAlpha: k === kcur ? 0.38 : 0.16, color: k % 2 ? '--c4' : '--c1', width: 0.8, alpha: 0.6 });
        }
      }
      /* elipse, ejes y focos */
      const ell = [];
      for (let j = 0; j <= 240; j++) ell.push(view.P(posAt((2 * Math.PI * j) / 240)));
      D.poly(ctx, ell, { color: '--ink-2', width: 1.6 });
      D.line(ctx, view.X(-p.a * (1 + p.e)), view.Y(0), view.X(p.a * (1 - p.e)), view.Y(0), { color: '--ink-3', dash: [5, 5], width: 1 });
      const F2 = view.P([-2 * p.a * p.e, 0]);
      if (p.e > 0.02) { D.line(ctx, F2[0] - 4, F2[1] - 4, F2[0] + 4, F2[1] + 4, { color: '--ink-3', width: 1.4 }); D.line(ctx, F2[0] - 4, F2[1] + 4, F2[0] + 4, F2[1] - 4, { color: '--ink-3', width: 1.4 }); MC.text(ctx, 'foco vacío', F2[0], F2[1] + 18, { size: 10, align: 'center', color: '--ink-3', halo: true }); }
      const Pp = view.P([p.a * (1 - p.e), 0]), Pa = view.P([-p.a * (1 + p.e), 0]);
      D.circle(ctx, Pp[0], Pp[1], 3, { fill: '--ink-2' });
      D.circle(ctx, Pa[0], Pa[1], 3, { fill: '--ink-2' });
      MC.text(ctx, 'perihelio', Pp[0] - 4, Pp[1] - 10, { size: 10.5, align: 'right', color: '--ink-2', halo: true });
      MC.text(ctx, 'afelio', Pa[0] + 4, Pa[1] - 10, { size: 10.5, color: '--ink-2', halo: true });
      /* estrella y planeta */
      D.ball(ctx, view.X(0), view.Y(0), 9 + 2 * Math.log10(p.Ms * 10), { fill: '--marker-solid' });
      const pl = posAt(Ecur), PP = view.P(pl);
      D.line(ctx, view.X(0), view.Y(0), PP[0], PP[1], { color: '--ink-3', width: 1.2 });
      if (p.vel) {
        const [vx, vy] = speedAt(Ecur), v = Math.hypot(vx, vy), vm = (2 * Math.PI * p.a) / T;
        const Lv = Math.min(120, (55 * v) / vm);
        D.vec(ctx, PP[0], PP[1], (vx / v) * Lv, (-vy / v) * Lv, { color: '--vel', label: 'v', width: 2.2 });
      }
      D.ball(ctx, PP[0], PP[1], 6.5, { fill: '--c1' });
      MC.text(ctx, `t = ${MC.fix(s.yrs, 2)} años (${MC.fix(s.yrs / T, 2)} vueltas)`, 10, cv.h - 10, { size: 11, mono: true, color: '--ink-2', halo: true });
      /* gráfica */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      if (p.graf === 'k3') {
        P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xlog: true, ylog: true, xmin: 0.1, xmax: 100, ymin: 0.01, ymax: 1000, xlabel: ['a', 'UA'], ylabel: ['T', 'años'], mb: 38, mt: 12, ml: 54, mr: 16, xfmt: null, yfmt: null });
        P.frame();
        P.fn((a) => Math.pow(a, 1.5), { color: '--ink-3', width: 1.4, dash: p.Ms !== 1 ? [5, 4] : null, n: 200 });
        if (Math.abs(p.Ms - 1) > 1e-6) P.fn((a) => Math.pow(a, 1.5) / Math.sqrt(p.Ms), { color: '--c4', width: 1.8, n: 200 });
        PLANETS.forEach(([n, a, , side]) => P.dot(a, Math.pow(a, 1.5), side > 0 ? { color: '--c7', r: 3.5, label: n, dy: -8, dx: -7, align: 'right' } : { color: '--c7', r: 3.5, label: n, dy: 15, dx: 7 }));
        P.dot(p.a, T, { color: '--c4', r: 6.5, label: 'órbita actual', dx: -10, align: 'right', dy: -10 });
        P.label(0.13, 400, 'T² = a³/M (pendiente 3/2 en escala log–log)', { size: 11, color: '--ink-2' });
        hov.plot = P;
        if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'T', unit: 'años', color: '--ink-2', y: Math.pow(hov.hx, 1.5) / Math.sqrt(p.Ms), fmt: (v) => sci(v) }], { label: 'a', unit: 'UA', fmt: (v) => sci(v) });
      } else {
        const xs = [], ys = [];
        for (let j = 0; j <= 400; j++) { const Mn = (2 * Math.PI * j) / 400, E = MC.phys.keplerE(Mn, p.e), [vx, vy] = speedAt(E); xs.push((T * j) / 400); ys.push(Math.hypot(vx, vy) * VUA); }
        const vmax = Math.max(...ys);
        P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xlog: false, ylog: false, xmin: 0, xmax: T, ymin: 0, ymax: MC.niceCeil(vmax * 1.08), xlabel: ['t', 'años'], ylabel: ['v', 'km/s'], mb: 38, mt: 12, ml: 54, mr: 16 });
        P.frame();
        P.xy(xs, ys, { color: '--vel', width: 2.2, fill: '--vel', fillAlpha: 0.08 });
        const tc = (s.Mn / (2 * Math.PI)) * T;
        const [cvx, cvy] = speedAt(Ecur);
        P.vline(tc, { color: '--c4' });
        P.dot(tc, Math.hypot(cvx, cvy) * VUA, { color: '--c4', r: 6 });
        P.label(0, vmax, ' perihelio', { size: 10.5, dy: -4 });
        P.label(T / 2, ys[200], 'afelio', { size: 10.5, align: 'center', dy: -8 });
        hov.plot = P;
        if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'v', unit: 'km/s', color: '--vel', y: M.interp(xs, ys, hov.hx), fmt: f2 }], { label: 't', unit: 'años', fmt: (v) => sci(v) });
      }
      /* lecturas */
      const rp = p.a * (1 - p.e), ra = p.a * (1 + p.e);
      const GMs = 4 * Math.PI * Math.PI * p.Ms; /* UA³/año² */
      const vp = Math.sqrt(GMs * (2 / rp - 1 / p.a)) * VUA, va = Math.sqrt(GMs * (2 / ra - 1 / p.a)) * VUA;
      sim.set('T', `${sci(T)} años`);
      sim.set('rp', `${sci(rp)} UA`);
      sim.set('ra', `${sci(ra)} UA`);
      sim.set('v', `${f2(vp)} km/s / ${f2(va)} km/s`);
      sim.set('rat', f2(ra / rp));
      sim.set('A', `π<i>ab</i>/${ns} = ${sci((Math.PI * p.a * b) / ns)} UA²`);
      sim.set('t', `${MC.fix(s.yrs, 2)} años`);
    });
  });
})();
