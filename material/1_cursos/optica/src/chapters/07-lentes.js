/* Capítulo 7 — Lentes */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const sag = (R, y) => (isFinite(R) ? R - Math.sign(R) * Math.sqrt(Math.max(0, R * R - y * y)) : 0);
  const fmtR = (c) => (Math.abs(c) < 1e-6 ? '∞' : EM.fix(1 / c, 1) + ' mm');

  /* Trazado de una lente real (dos superficies esféricas) con rayos paralelos; dibuja y devuelve los rayos */
  function drawLensTrace(ctx, v, sys, heights, lam, zEnd, o = {}) {
    const out = [];
    for (const h of heights) {
      const r = OP.traceRay(sys, [0, h, v.x0], [0, 0, 1], lam);
      if (r.lost) continue;
      const pts = r.path.map((q) => [q[2], q[1]]);
      const t = (zEnd - r.p[2]) / r.d[2];
      pts.push([r.p[2] + t * r.d[2], r.p[1] + t * r.d[1]]);
      D.ray(ctx, v, pts, { color: o.color || '--ray', width: o.width || 1.3, alpha: o.alpha || 0.9, arrow: false });
      out.push(r);
    }
    return out;
  }

  /* 7.1 Fabricante de lentes */
  EM.defineSim('fabricante', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('c1', { label: 'Curvatura de la 1.ª cara 1/R₁', min: -0.05, max: 0.05, step: 0.0005, value: 0.02, unit: 'mm⁻¹', fmt: (v) => v.toFixed(4) });
    sim.slider('c2', { label: 'Curvatura de la 2.ª cara 1/R₂', min: -0.05, max: 0.05, step: 0.0005, value: -0.02, unit: 'mm⁻¹', fmt: (v) => v.toFixed(4) });
    sim.select('g', { label: 'Vidrio', options: [['N-BK7', 'N-BK7'], ['N-F2', 'N-F2'], ['N-SF11', 'N-SF11'], ['silica', 'Sílice']], value: 'N-BK7' });
    sim.button('Doblar ⟲', () => { sim.ctl.c1.set(+(sim.p.c1 - 0.004).toFixed(4), true); sim.ctl.c2.set(+(sim.p.c2 - 0.004).toFixed(4)); });
    sim.button('Doblar ⟳', () => { sim.ctl.c1.set(+(sim.p.c1 + 0.004).toFixed(4), true); sim.ctl.c2.set(+(sim.p.c2 + 0.004).toFixed(4)); });
    sim.out('f', 'Distancia focal (lente gruesa)', { hl: true });
    sim.out('P', 'Potencia');
    sim.out('R', 'Radios y factor de forma q');
    sim.out('t', 'Espesor en el centro');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ap = 12, n = OP.n(p.g, 587.56);
      EM.draw.clear(cv);
      const R1 = p.c1 ? 1 / p.c1 : Infinity, R2 = p.c2 ? 1 / p.c2 : Infinity;
      const t = Math.max(1.5, 1.5 + sag(R1, ap) - sag(R2, ap));
      const f = OP.lensmaker(n, R1, R2, t);
      const sys = [{ z: 0, c: p.c1, n, ap: ap * 1.02 }, { z: t, c: p.c2, n: 1, ap: ap * 1.02 }];
      const M = OP.sysMatrix(sys, 587.56, 1, 0, t), cd = OP.cardinal(M);
      const zF = t + cd.BFD;
      const span = Math.min(260, Math.max(60, Math.abs(f) * 1.5));
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -40, span, -26, 26, false);
      D.axis(ctx, v);
      D.realLens(ctx, v, 0, t, R1, R2, ap);
      const hs = []; for (let i = -5; i <= 5; i++) if (i) hs.push((i / 5) * ap * 0.95);
      drawLensTrace(ctx, v, sys, hs, 587.56, span);
      if (isFinite(zF) && zF < span && zF > -40) D.focus(ctx, v, zF, "F'");
      const q = Math.abs(R2 - R1) < 1e-9 ? NaN : isFinite(R1) && isFinite(R2) ? (R2 + R1) / (R2 - R1) : !isFinite(R2) ? 1 : -1;
      sim.set('f', isFinite(f) ? EM.fix(f, 2) + ' mm' + (f > 0 ? ' (convergente)' : ' (divergente)') : '∞ (sin potencia)');
      sim.set('P', EM.fix(1000 / f, 2) + ' D');
      sim.set('R', 'R₁ = ' + fmtR(p.c1) + ', R₂ = ' + fmtR(p.c2) + ', q = ' + EM.fix(q, 2));
      sim.set('t', EM.fix(t, 2) + ' mm');
    });
  });

  /* 7.2 Lente delgada */
  EM.defineSim('lente-delgada', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('tipo', { label: 'Lente', options: [['c', 'Convergente'], ['d', 'Divergente']], value: 'c' });
    sim.slider('f', { label: 'Distancia focal |f|', min: 4, max: 25, step: 0.5, value: 10, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('so', { label: 'Distancia del objeto s_o', min: 1, max: 60, step: 0.1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('ho', { label: 'Altura del objeto', min: 1, max: 6, step: 0.1, value: 3, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.out('si', 'Posición de la imagen s_i', { hl: true });
    sim.out('m', 'Aumento m');
    sim.out('car', 'Carácter');
    sim.out('nw', 'Newton x_o·x_i = f²');
    EM.pointer(cv, {
      down: (x) => (sim._v && Math.abs(x - sim._v.X(-sim.p.so)) < 14 ? 1 : null),
      move: (a, x) => { const so = Math.max(1, Math.min(60, -sim._v.ix(x))); sim.ctl.so.set(+so.toFixed(1)); },
      hover: (x) => sim._v && Math.abs(x - sim._v.X(-sim.p.so)) < 14
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = p.tipo === 'c' ? p.f : -p.f;
      EM.draw.clear(cv);
      const v = (sim._v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -64, 64, -14, 14, false));
      D.axis(ctx, v);
      D.thinLens(ctx, v, 0, 11, f);
      D.focus(ctx, v, -f, 'F'); D.focus(ctx, v, f, "F'");
      const im = D.lensRays(ctx, v, 0, f, { x: -p.so, h: p.ho }, { xend: 64 });
      D.object(ctx, v, -p.so, p.ho, { label: 'objeto' });
      if (isFinite(im.x) && Math.abs(im.x) < 300) D.object(ctx, v, im.x, im.h, { color: '--c1', dash: im.real ? null : [4, 3], label: 'imagen' });
      sim.set('si', isFinite(im.si) && Math.abs(im.si) < 1e6 ? EM.fix(im.si, 2) + ' cm' + (im.real ? ' (real, a la derecha)' : ' (virtual, a la izquierda)') : '∞ (rayos paralelos)');
      sim.set('m', EM.fix(im.m, 3));
      sim.set('car', (im.real ? 'real' : 'virtual') + ', ' + (im.m < 0 ? 'invertida' : 'derecha') + ', ' + (Math.abs(im.m) > 1 ? 'aumentada' : 'reducida'));
      sim.set('nw', EM.fix((p.so - f) * (im.si - f), 2) + ' = ' + EM.fix(f * f, 2) + ' cm²');
    });
  });

  /* 7.3 Dos lentes (trazado paraxial de rayos) */
  EM.defineSim('dos-lentes', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('f1', { label: 'Focal de la lente 1', min: -20, max: 25, step: 0.5, value: 10, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('f2', { label: 'Focal de la lente 2', min: -20, max: 25, step: 0.5, value: 15, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('d', { label: 'Separación entre lentes', min: 2, max: 60, step: 0.5, value: 40, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('so', { label: 'Objeto antes de la lente 1', min: 3, max: 40, step: 0.5, value: 20, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.out('i1', 'Imagen intermedia (desde L1)', { hl: true });
    sim.out('i2', 'Imagen final (desde L2)');
    sim.out('m', 'Aumento total m₁·m₂');
    sim.out('feq', 'Focal equivalente del par');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f1 = Math.abs(p.f1) < 0.5 ? 0.5 : p.f1, f2 = Math.abs(p.f2) < 0.5 ? 0.5 : p.f2;
      const xo = -p.so, ho = 2.5, x1 = 0, x2 = p.d;
      const s1 = OP.thinImage(f1, p.so), xi1 = x1 + s1, hi1 = (-ho * s1) / p.so;
      const so2 = x2 - xi1, s2 = OP.thinImage(f2, so2), xi2 = x2 + s2, hi2 = (-hi1 * s2) / so2;
      const xmax = Math.max(x2 + 50, 80, s2 > 0 && s2 < 200 ? xi2 + 10 : 0);
      const ylim = Math.max(12, Math.min(40, Math.abs(hi2) * 1.2, Math.abs(hi1) * 1.2 > 12 ? Math.abs(hi1) * 1.2 : 12));
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, xo - 4, xmax, -ylim, ylim, false);
      D.axis(ctx, v);
      D.thinLens(ctx, v, x1, 9, f1, { label: 'L1' }); D.thinLens(ctx, v, x2, 9, f2, { label: 'L2' });
      /* rayos desde la punta del objeto: por el centro de L1, paralelo, y hacia F1 */
      const starts = [-ho / p.so, 0, ho / (f1 - p.so) * 1];
      const cols = ['--c3', '--ray', '--c5'];
      starts.forEach((u0, k) => {
        let y = ho + u0 * (x1 - xo), u = u0;
        const pts = [[xo, ho], [x1, y]];
        u = u - y / f1;
        const y2 = y + u * (x2 - x1); pts.push([x2, y2]);
        const u2 = u - y2 / f2; pts.push([xmax, y2 + u2 * (xmax - x2)]);
        D.ray(ctx, v, pts, { color: cols[k], width: 1.5 });
        if (s2 < 0 && isFinite(xi2)) D.ray(ctx, v, [[x2, y2], [xi2, y2 + u2 * (xi2 - x2)]], { color: cols[k], width: 1, dash: [4, 4], alpha: 0.7 });
      });
      D.object(ctx, v, xo, ho, { label: 'objeto' });
      if (isFinite(xi1) && Math.abs(xi1) < 400) D.object(ctx, v, xi1, hi1, { color: '--ink-3', dash: s1 > 0 ? null : [4, 3], label: 'intermedia' });
      if (isFinite(xi2) && Math.abs(xi2) < 400) D.object(ctx, v, xi2, hi2, { color: '--c1', dash: s2 > 0 ? null : [4, 3], label: 'final' });
      const m1 = -s1 / p.so, m2 = -s2 / so2, feq = 1 / (1 / f1 + 1 / f2 - p.d / (f1 * f2));
      sim.set('i1', EM.fix(s1, 2) + ' cm' + (so2 < 0 ? ' → objeto virtual para L2 (s_o = ' + EM.fix(so2, 2) + ' cm)' : ''));
      sim.set('i2', EM.fix(s2, 2) + ' cm ' + (s2 > 0 ? '(real)' : '(virtual)'));
      sim.set('m', EM.fix(m1, 3) + ' × ' + EM.fix(m2, 3) + ' = ' + EM.fix(m1 * m2, 3));
      sim.set('feq', isFinite(feq) ? EM.fix(feq, 2) + ' cm' : '∞ (sistema afocal)');
    });
  });

  /* 7.4 Lente gruesa */
  EM.defineSim('lente-gruesa', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R1', { label: 'Radio R₁', min: -200, max: 200, step: 1, value: 50, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('R2', { label: 'Radio R₂', min: -200, max: 200, step: 1, value: -50, unit: 'mm', fmt: (v) => v.toFixed(0) });
    sim.slider('t', { label: 'Espesor en el centro', min: 2, max: 40, step: 0.5, value: 8, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.select('g', { label: 'Vidrio', options: [['N-BK7', 'N-BK7'], ['N-SF11', 'N-SF11'], ['silica', 'Sílice']], value: 'N-BK7' });
    sim.out('f', 'Focal efectiva f (desde H′)', { hl: true });
    sim.out('bfd', 'Distancia focal posterior (desde la cara de salida)');
    sim.out('H', 'Planos principales');
    sim.out('thin', 'Focal si fuera delgada');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = OP.n(p.g, 587.56);
      EM.draw.clear(cv);
      const R1 = Math.abs(p.R1) < 8 ? (p.R1 < 0 ? -8 : 8) : p.R1, R2 = Math.abs(p.R2) < 8 ? (p.R2 < 0 ? -8 : 8) : p.R2;
      const ap = Math.min(14, Math.abs(R1) * 0.9, Math.abs(R2) * 0.9);
      const sys = [{ z: 0, c: 1 / R1, n, ap }, { z: p.t, c: 1 / R2, n: 1, ap }];
      const M = OP.sysMatrix(sys, 587.56, 1, 0, p.t), cd = OP.cardinal(M);
      const zHp = p.t + cd.Hp, zF = p.t + cd.BFD, zH = cd.H;
      const span = Math.min(300, Math.max(80, Math.abs(cd.fp) * 1.6));
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -40, span, -20, 20, false);
      D.axis(ctx, v);
      D.realLens(ctx, v, 0, p.t, R1, R2, ap);
      const hs = [-0.5, -0.3, 0.3, 0.5].map((k) => k * ap);
      const rs = drawLensTrace(ctx, v, sys, hs, 587.56, span, { width: 1.5 });
      /* prolongaciones: entrada horizontal y salida hacia atrás hasta H′ */
      rs.forEach((r) => {
        const y0 = r.path[0][1], tb = (zHp - r.p[2]) / r.d[2];
        D.ray(ctx, v, [[0, y0], [zHp, y0]], { color: '--ink-3', width: 1, dash: [3, 3] });
        D.ray(ctx, v, [[r.p[2], r.p[1]], [r.p[2] + tb * r.d[2], r.p[1] + tb * r.d[1]]], { color: '--ink-3', width: 1, dash: [3, 3] });
      });
      for (const [z, lab] of [[zH, 'H'], [zHp, "H'"]]) {
        if (!isFinite(z)) continue;
        ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(v.X(z), v.Y(17)); ctx.lineTo(v.X(z), v.Y(-17)); ctx.stroke();
        EM.text(ctx, lab, v.X(z), v.Y(17) - 5, { size: 12, color: '--accent', align: 'center', italic: true, family: EM.FONT_MATH });
      }
      if (isFinite(zF) && zF < span) D.focus(ctx, v, zF, "F'");
      const thin = OP.lensmaker(n, R1, R2, 0);
      sim.set('f', EM.fix(cd.fp, 2) + ' mm');
      sim.set('bfd', EM.fix(cd.BFD, 2) + ' mm');
      sim.set('H', 'H a ' + EM.fix(cd.H, 2) + ' mm del 1.er vértice, H′ a ' + EM.fix(cd.Hp, 2) + ' mm del 2.º');
      sim.set('thin', EM.fix(thin, 2) + ' mm');
    });
  });
})();
