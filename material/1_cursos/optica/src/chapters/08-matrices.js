/* Capítulo 8 — Óptica matricial y sistemas */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const Mx = OP.M;

  /* 8.1 Sistema de dos lentes: matriz y puntos cardinales */
  EM.defineSim('abcd', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const PRE = { tele: [100, -50, 60], retro: [-60, 40, 30], tel: [100, 25, 125], dob: [80, 80, 20] };
    sim.seg('pre', { label: 'Ejemplo', options: [['tele', 'Tele'], ['retro', 'Retrofoco'], ['tel', 'Telescopio'], ['dob', 'Doblete']], value: 'tele' });
    sim.slider('f1', { label: 'Focal de la lente 1', min: -150, max: 150, step: 1, value: 100, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('f2', { label: 'Focal de la lente 2', min: -150, max: 150, step: 1, value: -50, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación', min: 0, max: 200, step: 1, value: 60, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.onChange = (id) => { if (id === 'pre') { const q = PRE[sim.p.pre]; sim.ctl.f1.set(q[0], true); sim.ctl.f2.set(q[1], true); sim.ctl.d.set(q[2], true); } };
    sim.out('M', 'Matriz de L1 a L2  [A B; C D]', { hl: true });
    sim.out('f', 'Focal equivalente f′ = −1/C');
    sim.out('bfd', 'Distancia focal posterior (desde L2)');
    sim.out('H', 'Plano principal H′ (desde L2)');
    sim.out('len', 'Longitud total (L1 → F′)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f1 = Math.abs(p.f1) < 2 ? 2 : p.f1, f2 = Math.abs(p.f2) < 2 ? 2 : p.f2;
      const M = Mx.chain([Mx.lens(f1), Mx.free(p.d), Mx.lens(f2)]), cd = OP.cardinal(M);
      const zF = p.d + cd.BFD, zHp = p.d + cd.Hp, zH = cd.H, zFo = cd.FFD;
      const pts = [0, p.d, isFinite(zF) ? zF : p.d + 100, isFinite(zHp) ? zHp : 0].filter((z) => Math.abs(z) < 900);
      const z0 = Math.min(-60, ...pts) - 30, z1 = Math.max(p.d + 80, ...pts) + 30;
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, z0, z1, -30, 30, false);
      D.axis(ctx, v);
      D.thinLens(ctx, v, 0, 24, f1, { label: 'L1' }); D.thinLens(ctx, v, p.d, 24, f2, { label: 'L2' });
      for (const h of [-12, 12]) {
        const y1 = h, u1 = -h / f1, y2 = y1 + u1 * p.d, u2 = u1 - y2 / f2;
        D.ray(ctx, v, [[z0, h], [0, y1], [p.d, y2], [z1, y2 + u2 * (z1 - p.d)]], { color: '--ray', width: 1.6 });
        if (!cd.afocal && isFinite(zHp)) {
          D.ray(ctx, v, [[0, h], [zHp, h]], { color: '--ink-3', width: 1, dash: [3, 3] });
          D.ray(ctx, v, [[p.d, y2], [zHp, y2 + u2 * (zHp - p.d)]], { color: '--ink-3', width: 1, dash: [3, 3] });
        }
      }
      if (!cd.afocal) {
        for (const [z, lab] of [[zH, 'H'], [zHp, "H'"]]) {
          if (!isFinite(z) || z < z0 || z > z1) continue;
          ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(v.X(z), v.Y(26)); ctx.lineTo(v.X(z), v.Y(-26)); ctx.stroke();
          EM.text(ctx, lab, v.X(z) + 3, v.Y(26) + 12, { size: 12, color: '--accent', italic: true, family: EM.FONT_MATH });
        }
        if (zF > z0 && zF < z1) D.focus(ctx, v, zF, "F'");
        if (zFo > z0 && zFo < z1) D.focus(ctx, v, zFo, 'F');
      }
      const f = (x) => EM.fix(x, 4);
      sim.set('M', `[${f(M[0][0])} ${f(M[0][1])}; ${f(M[1][0])} ${f(M[1][1])}] · det = ${EM.fix(Mx.det(M), 6)}`);
      sim.set('f', cd.afocal ? '∞ (afocal: aumento angular ' + EM.fix(-f1 / f2, 2) + ')' : EM.fix(cd.fp, 2) + ' mm');
      sim.set('bfd', cd.afocal ? '—' : EM.fix(cd.BFD, 2) + ' mm');
      sim.set('H', cd.afocal ? '—' : EM.fix(cd.Hp, 2) + ' mm');
      sim.set('len', cd.afocal ? '—' : EM.fix(p.d + cd.BFD, 2) + ' mm (cociente con f′: ' + EM.fix((p.d + cd.BFD) / cd.fp, 3) + ')');
    });
  });

  /* 8.2 Diafragma y pupilas */
  EM.defineSim('pupilas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('xs', { label: 'Posición del diafragma (respecto de la lente)', min: -40, max: 40, step: 0.5, value: -20, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('rs', { label: 'Radio del diafragma', min: 2, max: 12, step: 0.1, value: 6, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('ho', { label: 'Altura del objeto', min: 0, max: 60, step: 0.5, value: 30, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.out('ep', 'Pupila de entrada', { hl: true });
    sim.out('xp', 'Pupila de salida');
    sim.out('N', 'Número f (objeto lejano)');
    sim.out('vig', 'Viñeteo del haz del borde (plano meridional)');
    const f = 50, aL = 12, so = 160;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const xs = Math.abs(p.xs) < 0.5 ? 0.5 * Math.sign(p.xs || 1) : p.xs;
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -so - 10, 140, -45, 65, false);
      D.axis(ctx, v);
      /* pupila de entrada: el diafragma visto desde el objeto */
      let xEP, rEP, xXP, rXP;
      if (xs < 0) { xEP = xs; rEP = p.rs; const d = -xs, si = (d * f) / (d - f); xXP = si; rXP = Math.abs((p.rs * si) / d); }
      else { const d = xs; xEP = (d * f) / (f - d); rEP = Math.abs((p.rs * f) / (f - d)); xXP = xs; rXP = p.rs; }
      D.thinLens(ctx, v, 0, aL, f, { label: 'lente' });
      /* diafragma */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(v.X(xs), v.Y(p.rs)); ctx.lineTo(v.X(xs), v.Y(p.rs + 10)); ctx.moveTo(v.X(xs), v.Y(-p.rs)); ctx.lineTo(v.X(xs), v.Y(-p.rs - 10)); ctx.stroke();
      EM.text(ctx, 'diafragma', v.X(xs), v.Y(p.rs + 10) - 6, { size: 11, color: '--ink-2', align: 'center', halo: true });
      /* pupilas */
      const drawPup = (x, r, col, lab) => { if (!isFinite(x) || Math.abs(x) > 400) return; ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(v.X(x), v.Y(r)); ctx.lineTo(v.X(x), v.Y(r + 6)); ctx.moveTo(v.X(x), v.Y(-r)); ctx.lineTo(v.X(x), v.Y(-r - 6)); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, lab, v.X(x), v.Y(-r - 6) + 13, { size: 10.5, color: col, align: 'center', halo: true }); };
      drawPup(xEP, rEP, '--c5', 'pupila de entrada');
      drawPup(xXP, rXP, '--c3', 'pupila de salida');
      /* trazado paraxial: lente delgada en 0; comprueba diafragma y borde de lente */
      const trace = (y0, xo, ytarget, xt) => {
        const u = (ytarget - y0) / (xt - xo);
        const yL = y0 + u * (0 - xo), u2 = u - yL / f;
        const yS = xs < 0 ? y0 + u * (xs - xo) : yL + u2 * xs;
        return { yL, u2, ok: Math.abs(yS) <= p.rs + 1e-9 && Math.abs(yL) <= aL + 1e-9, yS };
      };
      const xo = -so, si = (so * f) / (so - f), xi = si;
      const drawR = (y0, r, col, w) => { const pts = [[xo, y0], [0, r.yL], [140, r.yL + r.u2 * 140]]; D.ray(ctx, v, pts, { color: col, width: w, alpha: r.ok ? 1 : 0.25 }); };
      for (const s of [-1, 1]) drawR(0, trace(0, xo, s * rEP, xEP), '--ray', 1.6);
      if (p.ho > 0) {
        drawR(p.ho, trace(p.ho, xo, 0, xEP), '--c1', 2);
        for (const s of [-1, 1]) drawR(p.ho, trace(p.ho, xo, s * rEP, xEP), '--c1', 1);
        D.object(ctx, v, xo, p.ho, { label: 'objeto' });
      }
      let pass = 0, Nn = 200;
      for (let i = 0; i <= Nn; i++) { const yt = -rEP + (2 * rEP * i) / Nn; if (trace(p.ho, xo, yt, xEP).ok) pass++; }
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(xi), v.Y((-p.ho * si) / so), 3, 0, 7); ctx.fill();
      sim.set('ep', 'en ' + EM.fix(xEP, 1) + ' mm, radio ' + EM.fix(rEP, 2) + ' mm' + (xs > 0 ? ' (imagen virtual del diafragma)' : ' (el propio diafragma)'));
      sim.set('xp', 'en ' + EM.fix(xXP, 1) + ' mm, radio ' + EM.fix(rXP, 2) + ' mm');
      sim.set('N', 'f/' + EM.fix(f / (2 * rEP), 2));
      sim.set('vig', EM.fix(100 * (1 - pass / (Nn + 1)), 1) + ' %');
    });
  });

  /* 8.3 Iluminación relativa cos⁴θ */
  EM.defineSim('cos4', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('f', { label: 'Focal del objetivo (sensor de 36 × 24 mm)', min: 12, max: 200, step: 1, value: 24, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Número f', min: 1.4, max: 16, step: 0.1, value: 4, fmt: (v) => 'f/' + v.toFixed(1) });
    sim.out('w', 'Semicampo en la esquina', { hl: true });
    sim.out('E', 'Iluminación en la esquina');
    sim.out('ev', 'Exposición relativa a f/1');
    const nx = 180, ny = 120, vals = new Float32Array(nx * ny);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = ((i + 0.5) / nx - 0.5) * 36, y = ((j + 0.5) / ny - 0.5) * 24, th = Math.atan(Math.hypot(x, y) / p.f);
        vals[j * nx + i] = Math.pow(Math.cos(th), 4);
      }
      const sw = Math.min(W * 0.5, (H - 30) * 1.5), r = { x: 10, y: (H - sw / 1.5) / 2, w: sw, h: sw / 1.5 };
      const k = 4 / (p.N * p.N);
      D.paint(ctx, vals, nx, ny, r, (val) => { const t = Math.min(1, val * Math.min(1, k * 4)); const g = 255 * Math.pow(t, 1 / 2.2); return [g, g * 0.97, g * 0.9]; });
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(r.x, r.y, r.w, r.h);
      const dmax = Math.hypot(18, 12);
      const pl = new EM.Plot(ctx, { x: sw + 20, y: 0, w: W - sw - 20, h: H, xmin: 0, xmax: dmax, ymin: 0, ymax: 1.05, xlabel: 'distancia al centro del sensor (mm)', ylabel: 'iluminación relativa' });
      pl.frame();
      pl.fn((d) => Math.pow(Math.cos(Math.atan(d / p.f)), 4), { color: '--accent', width: 2.2 });
      pl.fn((d) => Math.pow(Math.cos(Math.atan(d / p.f)), 2), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.legend([{ label: 'cos⁴θ', color: '--accent' }, { label: 'cos²θ', color: '--ink-3', dash: [4, 4] }], 'bl');
      const wc = Math.atan(dmax / p.f);
      sim.set('w', EM.fix((wc * 180) / Math.PI, 1) + '°');
      sim.set('E', EM.fix(100 * Math.pow(Math.cos(wc), 4), 1) + ' % del centro');
      sim.set('ev', EM.fix(1 / (p.N * p.N), 4) + ' (' + EM.fix(Math.log2(p.N * p.N), 2) + ' pasos menos)');
    });
  });

  /* 8.4 Profundidad de campo */
  EM.defineSim('profundidad-campo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('f', { label: 'Focal', min: 4, max: 200, step: 0.5, value: 50, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('N', { label: 'Número f', min: 1.2, max: 22, step: 0.1, value: 8, fmt: (v) => 'f/' + v.toFixed(1) });
    sim.slider('s', { label: 'Distancia de enfoque', min: 0.3, max: 50, log: true, value: 3, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('c', { label: 'Círculo de confusión', min: 1, max: 50, step: 0.5, value: 30, unit: 'µm', fmt: (v) => v.toFixed(1) });
    sim.button('Enfocar a la hiperfocal', () => { const p = sim.p; sim.ctl.s.set(Math.min(50, OP.hyperfocal(p.f, p.N, p.c / 1000) / 1000)); });
    sim.out('dof', 'Zona nítida', { hl: true });
    sim.out('H', 'Distancia hiperfocal');
    sim.out('tot', 'Profundidad total');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f = p.f, Dap = f / p.N, s = p.s * 1000, vs = (s * f) / (s - f);
      const blur = (xm) => { const x = xm * 1000; if (x <= f) return NaN; const vx = (x * f) / (x - f); return (Dap * Math.abs(vx - vs)) / vx * 1000; };
      const r = OP.dof(f, p.N, p.c / 1000, s);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xlog: true, xmin: 0.2, xmax: 200, ymin: 0, ymax: p.c * 6, xlabel: 'distancia del objeto (m)', ylabel: 'círculo de desenfoque (µm)' });
      pl.frame();
      const far = isFinite(r.far) && r.far > 0 ? r.far / 1000 : 200;
      pl.band(r.near / 1000, far, { color: '--c3', alpha: 0.14 });
      pl.hline(p.c, { color: '--c2', label: 'c = ' + EM.fix(p.c, 1) + ' µm', labelRight: true });
      pl.fn(blur, { color: '--accent', width: 2.2, n: 800 });
      pl.vline(p.s, { color: '--ink-2', label: 'enfoque', labelY: 14 });
      sim.set('dof', EM.fix(r.near / 1000, 2) + ' m a ' + (isFinite(r.far) && r.far > 0 ? EM.fix(r.far / 1000, 2) + ' m' : '∞'));
      sim.set('H', EM.fix(r.H / 1000, 2) + ' m');
      sim.set('tot', isFinite(r.far) && r.far > 0 ? EM.fix((r.far - r.near) / 1000, 2) + ' m' : '∞');
    });
  });
})();
