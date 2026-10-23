/* Capítulo 2 — Ondas electromagnéticas */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* 2.1 Onda plana en 3D */
  EM.defineSim('onda-em3d', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.seg('pol', { label: 'Polarización', options: [['x', 'Lineal'], ['45', 'Lineal 45°'], ['c', 'Circular'], ['e', 'Elíptica']], value: 'x' });
    sim.slider('az', { label: 'Ángulo de vista', min: -60, max: 60, step: 1, value: 28, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('B', { label: 'Mostrar el campo magnético', value: true });
    sim.out('E', '|E| en el origen', { hl: true });
    sim.out('rel', 'Relación entre los campos');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const az = (p.az * Math.PI) / 180, s = H * 0.26, L = 3 * 2 * Math.PI, Wd = W * 0.8, tilt = 0.3;
      const Y0 = H * 0.5 + 0.5 * tilt * Wd * Math.sin(az);
      const proj = (x, y, z) => { const zn = z / L; return [W * 0.08 + zn * Wd * Math.cos(az) + y * s * Math.sin(az) * 0.9, Y0 - x * s + (y * s * Math.cos(az) - zn * Wd * Math.sin(az)) * tilt]; };
      /* amplitudes y desfase de cada polarización */
      const P = { x: [1, 0, 0], 45: [Math.SQRT1_2, Math.SQRT1_2, 0], c: [Math.SQRT1_2, Math.SQRT1_2, Math.PI / 2], e: [0.9, 0.45, Math.PI / 2] }[p.pol];
      const Ef = (z) => [P[0] * Math.cos(z - 2 * t), P[1] * Math.cos(z - 2 * t + P[2])];
      /* ejes */
      ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1;
      const a0 = proj(0, 0, 0), a1 = proj(0, 0, L);
      EM.draw.arrow(ctx, a0[0], a0[1], a1[0] + 20, a1[1] - 20 * Math.tan(az) * tilt, { color: '--ink-2', width: 1.4 });
      EM.text(ctx, 'k', a1[0] + 26, a1[1] - 6, { size: 14, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      const xa = proj(1.25, 0, 0), ya = proj(0, 1.4, 0);
      EM.draw.arrow(ctx, a0[0], a0[1], xa[0], xa[1], { color: '--ink-3', width: 1 });
      EM.draw.arrow(ctx, a0[0], a0[1], ya[0], ya[1], { color: '--ink-3', width: 1 });
      EM.text(ctx, 'x', xa[0] + 5, xa[1], { size: 12, italic: true, color: '--ink-3' });
      EM.text(ctx, 'y', ya[0] + 5, ya[1] + 4, { size: 12, italic: true, color: '--ink-3' });
      const N = 60;
      const draw = (field, col) => {
        ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 300; i++) { const z = (L * i) / 300, f = field(z), q = proj(f[0], f[1], z); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
        ctx.stroke();
        ctx.globalAlpha = 0.55;
        for (let i = 0; i <= N; i++) {
          const z = (L * i) / N, f = field(z), b = proj(0, 0, z), q = proj(f[0], f[1], z);
          ctx.strokeStyle = EM.col(col); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      if (p.B) draw((z) => { const e = Ef(z); return [-e[1], e[0]]; }, '--c1');
      draw(Ef, '--c2');
      EM.text(ctx, 'E', W * 0.06, H * 0.12, { size: 14, color: '--c2', weight: 700, family: EM.FONT_MATH });
      if (p.B) EM.text(ctx, 'B (×c)', W * 0.06 + 18, H * 0.12, { size: 13, color: '--c1', weight: 600 });
      const e0 = Ef(0);
      sim.set('E', EM.fix(Math.hypot(e0[0], e0[1]), 3) + ' E₀');
      sim.set('rel', '|B| = |E|/c, B ⊥ E ⊥ k');
    });
  });

  /* 2.2 Irradiancia y campo de fuentes reales */
  EM.defineSim('poynting', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('src', { label: 'Fuente', options: [['sol', 'Sol'], ['bulbo', 'Lámpara'], ['laser', 'Láser']], value: 'sol' });
    sim.slider('P', { label: 'Potencia emitida (lámpara o láser)', min: 1e-3, max: 1000, log: true, value: 1, unit: 'W', fmt: (v) => EM.sci(v, 3) });
    sim.slider('r', { label: 'Distancia', min: 0.1, max: 1e12, log: true, value: OP.AU, unit: 'm', fmt: (v) => EM.si(v, 'm', 3).replace(' m', '') });
    sim.slider('d', { label: 'Diámetro del haz láser', min: 0.2, max: 10, step: 0.1, value: 1, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.out('I', 'Irradiancia', { hl: true });
    sim.out('E', 'Amplitud del campo eléctrico E₀');
    sim.out('B', 'Amplitud del campo magnético B₀');
    sim.out('Pr', 'Presión de radiación (absorción)');
    sim.out('N', 'Fotones por s y mm² (550 nm)');
    const Lsun = 3.828e26;
    sim.onChange = (id) => { if (id === 'src') { if (sim.p.src === 'sol') sim.ctl.r.set(OP.AU, true); else if (sim.p.src === 'bulbo') { sim.ctl.r.set(2, true); sim.ctl.P.set(100, true); } else { sim.ctl.r.set(5, true); sim.ctl.P.set(1e-3, true); } } };
    const Ifun = (r) => { const p = sim.p; if (p.src === 'sol') return Lsun / (4 * Math.PI * r * r); if (p.src === 'bulbo') return p.P / (4 * Math.PI * r * r); const w0 = (p.d / 2) * 1e-3, w = OP.gb.w(r, w0, 633e-9); return (2 * p.P) / (Math.PI * w * w) / 2; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.P.show(p.src !== 'sol'); sim.ctl.d.show(p.src === 'laser');
      const I = Ifun(p.r), E0 = OP.E0fromI(I);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xlog: true, ylog: true, xmin: 0.1, xmax: 1e12, ymin: 1e-12, ymax: 1e14, xlabel: 'distancia (m)', ylabel: 'irradiancia (W/m²)' });
      pl.frame();
      pl.fn(Ifun, { color: '--accent', width: 2.2 });
      pl.hline(1361, { color: '--gold', label: 'constante solar 1361 W/m²', labelRight: true });
      for (const [x, lab] of [[3.844e8, 'Luna'], [OP.AU, '1 UA'], [5.2 * OP.AU, 'Júpiter']]) pl.vline(x, { color: '--ink-3', label: lab, labelY: 14 });
      pl.dot(p.r, I, { color: '--c2', r: 6 });
      sim.set('I', EM.sci(I, 3) + ' W/m²');
      sim.set('E', EM.sci(E0, 3) + ' V/m');
      sim.set('B', EM.si(E0 / OP.c, 'T', 3));
      sim.set('Pr', EM.si(I / OP.c, 'Pa', 3));
      sim.set('N', EM.sci((I * 1e-6) / OP.photonE(550e-9), 3));
    });
  });

  /* 2.3 Vela solar */
  EM.defineSim('vela-solar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('sig', { label: 'Masa por unidad de área de la vela', min: 0.5, max: 100, log: true, value: 10, unit: 'g/m²', fmt: (v) => EM.sci(v, 3) });
    sim.slider('R', { label: 'Reflectancia de la vela', min: 0, max: 1, step: 0.01, value: 0.9, fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: 'Distancia al Sol', min: 0.2, max: 5, step: 0.01, value: 1, unit: 'UA', fmt: (v) => v.toFixed(2) });
    sim.out('beta', 'Número de ligereza β', { hl: true });
    sim.out('ar', 'Aceleración por radiación');
    sim.out('ag', 'Aceleración gravitatoria del Sol');
    sim.out('dv', 'Δv en un año (radiación, a esta distancia)');
    const Lsun = 3.828e26, GM = 1.32712440018e20;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sig = p.sig / 1000, ar = (r) => ((1 + p.R) * Lsun) / (4 * Math.PI * r * r * OP.c * sig), ag = (r) => GM / (r * r);
      const rm = p.r * OP.AU;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xlog: true, ylog: true, xmin: 0.2, xmax: 5, ymin: 1e-5, ymax: 1, xlabel: 'distancia al Sol (UA)', ylabel: 'aceleración (m/s²)' });
      pl.frame();
      pl.fn((x) => ag(x * OP.AU), { color: '--ink-2', width: 2 });
      pl.fn((x) => ar(x * OP.AU), { color: '--accent', width: 2.4 });
      pl.dot(p.r, ar(rm), { color: '--accent', r: 6 }); pl.dot(p.r, ag(rm), { color: '--ink-2', r: 5 });
      pl.legend([{ label: 'gravedad GM/r²', color: '--ink-2' }, { label: 'radiación (1+R)I/(cσ)', color: '--accent' }], 'tr');
      const beta = ar(rm) / ag(rm);
      sim.set('beta', EM.fix(beta, 3) + (beta > 1 ? ' (la vela se aleja del Sol)' : ''));
      sim.set('ar', EM.sci(ar(rm), 3) + ' m/s²');
      sim.set('ag', EM.sci(ag(rm), 3) + ' m/s²');
      sim.set('dv', EM.fix((ar(rm) * 3.156e7) / 1000, 2) + ' km/s');
    });
  });

  /* 2.4 Radiación de un dipolo */
  EM.defineSim('dipolo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lam', { label: 'Longitud de onda (en unidades del recuadro)', min: 0.08, max: 0.4, step: 0.005, value: 0.18, fmt: (v) => v.toFixed(3) });
    sim.out('pat', 'Patrón de intensidad', { hl: true });
    let t = 0;
    sim.animate((dt) => { t += dt; });
    const nx = 150, ny = 150, vals = new Float32Array(nx * ny);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const S = Math.min(H - 12, W * 0.55), k = (2 * Math.PI) / p.lam, wt = 2.2 * Math.PI * t;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = (i / (nx - 1)) * 2 - 1, z = 1 - (j / (ny - 1)) * 2, r = Math.hypot(x, z);
        const st = r > 0 ? Math.abs(x) / r : 0;
        vals[j * nx + i] = r < 0.04 ? 0 : (st * Math.cos(k * r - wt)) / Math.max(r, 0.12) * 0.12;
      }
      const r0 = { x: 6, y: (H - S) / 2, w: S, h: S };
      D.paint(ctx, vals, nx, ny, r0, (v) => EM.cmap.diverging(Math.max(-1, Math.min(1, v * 1.4))));
      const cx = r0.x + S / 2, cy = r0.y + S / 2, amp = 10 * Math.cos(wt);
      EM.draw.arrow(ctx, cx, cy + amp, cx, cy - amp, { color: '--ink', width: 2.4 });
      EM.text(ctx, 'dipolo', cx + 8, cy + 24, { size: 11, color: '--ink-2', halo: true });
      const pol = new EM.Polar(ctx, { cx: S + 12 + (W - S - 12) / 2, cy: H / 2, R: Math.min((W - S - 30) / 2.6, H * 0.36), zero: 'top', spokes: 30 });
      pol.frame();
      pol.curve((th) => Math.pow(Math.sin(th), 2), { color: '--accent' });
      sim.set('pat', 'I ∝ sen²θ / r²; máxima a 90° del eje, nula a lo largo de él');
    });
  });
})();
