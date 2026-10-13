/* Capítulo 3 — Cálculo vectorial */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const rad = M.rad, deg = M.deg;
  const f3 = (v) => EM.fix(v, 3);

  /* Campos 2D de referencia (compartidos con otros capítulos) */
  const F2 = (EM.fields2d = {
    source: { name: 'Fuente  F = (x, y)', F: (x, y) => [x, y], div: () => 2, curl: () => 0 },
    rot: { name: 'Rotación rígida  F = (−y, x)', F: (x, y) => [-y, x], div: () => 0, curl: () => 2 },
    shear: { name: 'Cizalla  F = (y, 0)', F: (x, y) => [y, 0], div: () => 0, curl: () => -1 },
    saddle: { name: 'Silla  F = (x, −y)', F: (x, y) => [x, -y], div: () => 0, curl: () => 0 },
    spiral: { name: 'Sumidero con giro  F = (−x−y, x−y)', F: (x, y) => [-x - y, x - y], div: () => -2, curl: () => 2 },
    mixed: { name: 'Variable  F = (x², xy)', F: (x, y) => [x * x, x * y], div: (x) => 3 * x, curl: (x, y) => y },
    wavy: { name: 'Ondulante  F = (sen y, sen x)', F: (x, y) => [Math.sin(y), Math.sin(x)], div: () => 0, curl: (x, y) => Math.cos(x) - Math.cos(y) },
    point: { name: 'Fuente puntual  F = ρ̂/ρ', F: (x, y) => { const r2 = x * x + y * y; return [x / r2, y / r2]; }, div: () => 0, curl: () => 0, sing: 'div' },
    vortex: { name: 'Vórtice  F = φ̂/ρ', F: (x, y) => { const r2 = x * x + y * y; return [-y / r2, x / r2]; }, div: () => 0, curl: () => 0, sing: 'curl' }
  });
  const fieldOptions = (keys) => keys.map((k) => [k, F2[k].name]);

  /* ======================================================================
     3.1 Gradiente
     ====================================================================== */
  EM.defineSim('grad-explorer', function (sim) {
    const cv = sim.canvas({ aspect: 1.4 });
    const cp = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const view = new EM.View2D(cv, { xmin: -3, xmax: 3, ymin: -2.2, ymax: 2.2 });
    const s = 0.18;
    const PRE = {
      bowl: { name: 'Paraboloide  f = (x² + y²)/2', f: (x, y) => (x * x + y * y) / 2, cm: 'seq' },
      saddle: { name: 'Silla  f = (x² − y²)/2', f: (x, y) => (x * x - y * y) / 2, cm: 'div' },
      wave: { name: 'Ondulado  f = sen x · cos y', f: (x, y) => Math.sin(x) * Math.cos(y), cm: 'div' },
      point: { name: 'Potencial de carga  f = 1/r', f: (x, y) => 1 / Math.sqrt(x * x + y * y + s * s), cm: 'seq' },
      dipole: { name: 'Potencial de dipolo', f: (x, y) => 1 / Math.sqrt((x - 0.8) ** 2 + y * y + s * s) - 1 / Math.sqrt((x + 0.8) ** 2 + y * y + s * s), cm: 'div' },
      gauss: { name: 'Colina gaussiana  f = e^(−r²/2)', f: (x, y) => Math.exp(-(x * x + y * y) / 2), cm: 'seq' }
    };
    sim.group('Campo escalar');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].name]), value: 'wave' });
    sim.group('Dirección de la derivada');
    sim.slider('alpha', { label: 'Dirección de <b>û</b> (desde +x)', min: 0, max: 360, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Mostrar');
    sim.check('heat', { label: 'Mapa de color de <i>f</i>', value: true });
    sim.check('cont', { label: 'Curvas de nivel', value: true });
    sim.check('arr', { label: 'Campo ∇<i>f</i>', value: true });
    sim.out('f', '<i>f</i>(P)');
    sim.out('g', '∇<i>f</i>(P)', { hl: true });
    sim.out('gm', '|∇<i>f</i>|');
    sim.out('ga', 'Dirección de ∇<i>f</i>');
    sim.out('d', '<i>D</i><sub>û</sub><i>f</i> = ∇<i>f</i>·<b>û</b>', { hl: true });
    sim.hint('Arrastra la sonda P', cv);
    sim.legend([{ color: '--accent', label: '∇<i>f</i> en P' }, { color: '--c5', label: 'dirección <b>û</b>' }, { color: '--ink-2', label: 'curvas de nivel', kind: 'dash' }]);
    const P = [0.9, 0.6];
    const grad = (f, x, y) => { const h = 1e-4; return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]; };
    EM.pointer(cv, {
      down: (x, y) => (Math.hypot(view.X(P[0]) - x, view.Y(P[1]) - y) < 18 ? 1 : null),
      move: (_, x, y) => { P[0] = M.clamp(view.wx(x), view.x0 + 0.1, view.x1 - 0.1); P[1] = M.clamp(view.wy(y), view.y0 + 0.1, view.y1 - 0.1); sim.redraw(); },
      hover: (x, y) => Math.hypot(view.X(P[0]) - x, view.Y(P[1]) - y) < 18
    });
    sim.onDraw(() => {
      const pre = PRE[sim.p.pre], f = pre.f;
      view.update();
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      /* rango de f */
      let fmin = Infinity, fmax = -Infinity;
      for (let i = 0; i <= 40; i++) for (let j = 0; j <= 30; j++) {
        const v = f(view.x0 + ((view.x1 - view.x0) * i) / 40, view.y0 + ((view.y1 - view.y0) * j) / 30);
        if (v < fmin) fmin = v; if (v > fmax) fmax = v;
      }
      const amax = Math.max(Math.abs(fmin), Math.abs(fmax)) || 1;
      if (sim.p.heat) {
        if (pre.cm === 'div') EM.field.heat(view, f, (v) => EM.cmap.diverging((v / amax) * 0.8), { res: 4 });
        else EM.field.heat(view, f, (v) => EM.cmap.seq(((v - fmin) / (fmax - fmin || 1)) * 0.75, '--c1'), { res: 4 });
      }
      view.grid({ minorLines: false, xlabel: 'x', ylabel: 'y' });
      if (sim.p.cont) {
        const lv = [];
        const n = 16;
        for (let k = 1; k < n; k++) lv.push(fmin + ((fmax - fmin) * k) / n);
        EM.field.contours(view, f, lv, { color: '--ink-2', width: 1, alpha: 0.7, res: 4 });
      }
      let gmax = 0;
      for (let i = 0; i <= 24; i++) for (let j = 0; j <= 18; j++) {
        const g = grad(f, view.x0 + ((view.x1 - view.x0) * i) / 24, view.y0 + ((view.y1 - view.y0) * j) / 18);
        gmax = Math.max(gmax, Math.hypot(g[0], g[1]));
      }
      if (sim.p.arr) EM.field.arrows(view, (x, y) => grad(f, x, y), { spacing: 34, mode: 'len', ref: gmax * 0.6, maxLen: 28, color: '--ink', width: 1.2 });
      /* sonda */
      const g = grad(f, P[0], P[1]);
      const gm = Math.hypot(g[0], g[1]);
      const px = view.X(P[0]), py = view.Y(P[1]);
      const k = gm > 0 ? Math.min(90, (60 * gm) / (gmax * 0.6 || 1)) / gm : 0;
      const a = rad(sim.p.alpha), u = [Math.cos(a), Math.sin(a)];
      EM.draw.arrow(ctx, px, py, px + u[0] * 55, py - u[1] * 55, { color: '--c5', width: 2.4, head: 10 });
      EM.text(ctx, 'u', px + u[0] * 68, py - u[1] * 68, { size: 15, weight: 700, family: EM.FONT_MATH, color: '--c5', hat: true, halo: true, align: 'center', baseline: 'middle' });
      if (gm > 1e-9) {
        EM.draw.arrow(ctx, px, py, px + g[0] * k, py - g[1] * k, { color: '--accent', width: 3.4, head: 13 });
        EM.text(ctx, '∇f', px + g[0] * k * 1.15 + 6, py - g[1] * k * 1.15, { size: 14, weight: 700, color: '--accent', halo: true, align: 'center', baseline: 'middle', family: EM.FONT_MATH });
      }
      ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fillStyle = EM.col('--ink'); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = EM.col('--canvas'); ctx.stroke();
      EM.text(ctx, 'P', px - 12, py + 16, { size: 13, weight: 700, color: '--ink', halo: true });
      /* Gráfica D(α) */
      EM.draw.clear(cp);
      const beta = Math.atan2(g[1], g[0]);
      const ymax = Math.max(gm * 1.25, 0.05);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2 * Math.PI, ymin: -ymax, ymax, xpi: true, xlabel: 'ángulo α de û (rad)', ylabel: 'D_{û}f', mt: 10, mb: 38 });
      pl.frame();
      pl.fn((t) => gm * Math.cos(t - beta), { color: '--c5', width: 2 });
      pl.hline(gm, { color: '--accent', dash: [2, 3] });
      pl.vline(M.wrap2pi(beta), { color: '--accent', dash: [4, 3] });
      pl.label(M.wrap2pi(beta), -ymax * 0.82, 'dirección de ∇f', { color: '--accent', dx: M.wrap2pi(beta) > 4.2 ? -6 : 6, align: M.wrap2pi(beta) > 4.2 ? 'right' : 'left' });
      pl.label(0.05, gm, '|∇f|', { color: '--accent', dy: -5 });
      pl.dot(a, gm * Math.cos(a - beta), { color: '--c5', r: 5 });
      sim.set('f', f3(f(P[0], P[1])));
      sim.set('g', `(${f3(g[0])}, ${f3(g[1])})`);
      sim.set('gm', f3(gm));
      sim.set('ga', gm > 1e-9 ? EM.fix(deg(M.wrap2pi(beta)), 1) + '°' : '— (punto crítico)');
      sim.set('d', f3(g[0] * u[0] + g[1] * u[1]));
    });
  });

  /* ======================================================================
     3.2 Integral de línea y dependencia del camino
     ====================================================================== */
  EM.defineSim('line-integral', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -3.2, xmax: 3.2, ymin: -2.2, ymax: 2.2 });
    const FL = {
      grad: { name: 'Conservativo  F = ∇(xy) = (y, x)', F: (x, y) => [y, x], curl: 0, kind: 'cons' },
      point: { name: 'Conservativo  F = ρ̂/ρ', F: F2.point.F, curl: 0, kind: 'cons' },
      rot: { name: 'No conservativo  F = (−y, x)', F: F2.rot.F, curl: 2, kind: 'uni' },
      shear: { name: 'No conservativo  F = (y, 0)', F: F2.shear.F, curl: -1, kind: 'uni' },
      vortex: { name: 'Vórtice  F = φ̂/ρ', F: F2.vortex.F, curl: 0, kind: 'vortex' }
    };
    sim.group('Campo');
    sim.select('fld', { options: Object.keys(FL).map((k) => [k, FL[k].name]), value: 'rot' });
    sim.check('arr', { label: 'Mostrar el campo', value: true });
    sim.note('Arrastra A, B y el punto intermedio C. Camino 1: recta A→B. Camino 2: A→C→B.');
    sim.out('w1', '∫<sub>1</sub> <b>F</b>·d<b>l</b>');
    sim.out('w2', '∫<sub>2</sub> <b>F</b>·d<b>l</b>');
    sim.out('circ', '∮ (A→C→B→A) = ∫<sub>2</sub> − ∫<sub>1</sub>', { hl: true });
    sim.out('stk', '∬ (∇×<b>F</b>)<sub>z</sub> d<i>S</i>');
    const pts = { A: [-2.2, -1.1], B: [2.3, 0.9], C: [-0.6, 1.5] };
    const integ = (F, a, b, n = 800) => {
      let s = 0;
      const dx = (b[0] - a[0]) / n, dy = (b[1] - a[1]) / n;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const v = F(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
        s += v[0] * dx + v[1] * dy;
      }
      return s;
    };
    const pick = (x, y) => { for (const k of ['A', 'B', 'C']) if (Math.hypot(view.X(pts[k][0]) - x, view.Y(pts[k][1]) - y) < 16) return k; return null; };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (k, x, y) => { pts[k][0] = M.clamp(view.wx(x), view.x0 + 0.1, view.x1 - 0.1); pts[k][1] = M.clamp(view.wy(y), view.y0 + 0.1, view.y1 - 0.1); sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.legend([{ color: '--c1', label: 'camino 1 (recta)' }, { color: '--c2', label: 'camino 2 (por C)' }]);
    const pathArrow = (ctx, a, b, col) => {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]) || 1;
      EM.draw.arrow(ctx, view.X(m[0] - (d[0] / L) * 0.12), view.Y(m[1] - (d[1] / L) * 0.12), view.X(m[0] + (d[0] / L) * 0.12), view.Y(m[1] + (d[1] / L) * 0.12), { color: col, width: 3, head: 12 });
    };
    sim.onDraw(() => {
      const fl = FL[sim.p.fld], F = fl.F;
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x', ylabel: 'y' });
      const ctx = cv.ctx;
      if (sim.p.arr) EM.field.arrows(view, F, { spacing: 32, mode: 'len', ref: fl.kind === 'vortex' || fl.name.includes('ρ̂') ? 1.2 : 2.5, maxLen: 24, color: EM.alpha('--c6', 0.6), width: 1.1, skip: (x, y) => Math.hypot(x, y) < 0.25 });
      const { A, B, C } = pts;
      const tri = [A, C, B];
      ctx.save();
      ctx.beginPath();
      tri.forEach((p, i) => (i ? ctx.lineTo(view.X(p[0]), view.Y(p[1])) : ctx.moveTo(view.X(p[0]), view.Y(p[1]))));
      ctx.closePath();
      ctx.fillStyle = EM.alpha('--accent', 0.08);
      ctx.fill();
      ctx.restore();
      EM.draw.poly(ctx, [[view.X(A[0]), view.Y(A[1])], [view.X(B[0]), view.Y(B[1])]], { color: '--c1', width: 3 });
      EM.draw.poly(ctx, [[view.X(A[0]), view.Y(A[1])], [view.X(C[0]), view.Y(C[1])], [view.X(B[0]), view.Y(B[1])]], { color: '--c2', width: 3 });
      pathArrow(ctx, A, B, EM.col('--c1'));
      pathArrow(ctx, A, C, EM.col('--c2'));
      pathArrow(ctx, C, B, EM.col('--c2'));
      if (fl.kind === 'vortex' || sim.p.fld === 'point') {
        ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), 4, 0, 7); ctx.fillStyle = EM.col('--warn-ink'); ctx.fill();
        EM.text(ctx, 'singularidad', view.X(0) + 8, view.Y(0) - 8, { size: 11, color: '--warn-ink', halo: true });
      }
      for (const k of ['A', 'B', 'C']) {
        const p = pts[k];
        ctx.beginPath(); ctx.arc(view.X(p[0]), view.Y(p[1]), 7, 0, 7);
        ctx.fillStyle = EM.col(k === 'C' ? '--c2' : '--ink'); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = EM.col('--canvas'); ctx.stroke();
        EM.text(ctx, k, view.X(p[0]) + 10, view.Y(p[1]) - 10, { size: 14, weight: 700, color: '--ink', halo: true });
      }
      const w1 = integ(F, A, B), w2 = integ(F, A, C) + integ(F, C, B);
      const circ = w2 - w1;
      /* área orientada del triángulo A→C→B */
      const sArea = 0.5 * ((C[0] - A[0]) * (B[1] - A[1]) - (B[0] - A[0]) * (C[1] - A[1]));
      let stk, stkTxt;
      if (fl.kind === 'cons') { stk = 0; stkTxt = '0 (irrotacional)'; }
      else if (fl.kind === 'uni') { stk = fl.curl * sArea; stkTxt = f3(stk); }
      else {
        /* ¿el origen está dentro del triángulo? */
        const sg = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1]);
        const O = [0, 0];
        const d1 = sg(A, C, O), d2 = sg(C, B, O), d3 = sg(B, A, O);
        const inside = (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
        stk = inside ? Math.sign(sArea) * 2 * Math.PI : 0;
        stkTxt = inside ? (stk > 0 ? '+2π' : '−2π') + ' (δ en el origen)' : '0';
      }
      sim.set('w1', f3(w1));
      sim.set('w2', f3(w2));
      sim.set('circ', f3(circ));
      sim.set('stk', stkTxt);
    });
  });

  /* ======================================================================
     3.3 Divergencia y rotacional con sonda, trazadores y rueda de paletas
     ====================================================================== */
  EM.defineSim('divcurl-explorer', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -3, xmax: 3, ymin: -2.1, ymax: 2.1 });
    sim.group('Campo');
    sim.select('fld', { options: fieldOptions(['source', 'rot', 'shear', 'saddle', 'spiral', 'mixed', 'wavy', 'point', 'vortex']), value: 'shear', onInput: () => seed() });
    sim.group('Sonda');
    sim.slider('h', { label: 'Lado del cuadrado <i>h</i>', min: 0.1, max: 1.6, step: 0.02, value: 0.8, fmt: (v) => EM.fix(v, 2) });
    sim.check('trace', { label: 'Partículas trazadoras', value: true });
    sim.check('arr', { label: 'Flechas del campo', value: true });
    sim.out('flux', 'Flujo neto Φ');
    sim.out('dest', 'Φ / <i>h</i>²', { hl: true });
    sim.out('div', '∇·<b>F</b> exacta en el centro');
    sim.outSep();
    sim.out('circ', 'Circulación Γ');
    sim.out('cest', 'Γ / <i>h</i>²', { hl: true });
    sim.out('curl', '(∇×<b>F</b>)<sub>z</sub> exacto');
    sim.hint('Arrastra la sonda', cv);
    sim.legend([{ color: '--pos', label: 'flujo saliente' }, { color: '--neg', label: 'flujo entrante' }, { color: '--accent', label: 'rueda de paletas (gira con ω = ½ ∇×F)' }]);
    const P = [0.6, 0.4];
    let wheel = 0;
    let parts = [];
    const seed = () => {
      parts = [];
      for (let i = 0; i < 260; i++) parts.push({ x: view.x0 + Math.random() * (view.x1 - view.x0), y: view.y0 + Math.random() * (view.y1 - view.y0), age: Math.random() * 3 });
    };
    EM.pointer(cv, {
      down: (x, y) => { const hpx = (sim.p.h * view.s) / 2 + 8; return Math.abs(view.X(P[0]) - x) < hpx && Math.abs(view.Y(P[1]) - y) < hpx ? 1 : null; },
      move: (_, x, y) => { P[0] = M.clamp(view.wx(x), view.x0 + 0.2, view.x1 - 0.2); P[1] = M.clamp(view.wy(y), view.y0 + 0.2, view.y1 - 0.2); sim.redraw(); },
      hover: (x, y) => { const hpx = (sim.p.h * view.s) / 2 + 8; return Math.abs(view.X(P[0]) - x) < hpx && Math.abs(view.Y(P[1]) - y) < hpx; }
    });
    const edgeInts = (F, cx, cy, h, n = 60) => {
      let flux = 0, circ = 0;
      const sides = [
        { a: [cx - h / 2, cy - h / 2], b: [cx + h / 2, cy - h / 2], n: [0, -1] },
        { a: [cx + h / 2, cy - h / 2], b: [cx + h / 2, cy + h / 2], n: [1, 0] },
        { a: [cx + h / 2, cy + h / 2], b: [cx - h / 2, cy + h / 2], n: [0, 1] },
        { a: [cx - h / 2, cy + h / 2], b: [cx - h / 2, cy - h / 2], n: [-1, 0] }
      ];
      for (const s of sides) {
        const t = [(s.b[0] - s.a[0]) / h, (s.b[1] - s.a[1]) / h];
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const v = F(s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u);
          flux += (v[0] * s.n[0] + v[1] * s.n[1]) * (h / n);
          circ += (v[0] * t[0] + v[1] * t[1]) * (h / n);
        }
      }
      return { flux, circ, sides };
    };
    sim.animate((dt) => {
      const fd = F2[sim.p.fld];
      wheel += 0.5 * fd.curl(P[0], P[1]) * dt;
      if (sim.p.trace) {
        const k = 0.45;
        for (const q of parts) {
          const v = fd.F(q.x, q.y);
          let vx = v[0], vy = v[1];
          const m = Math.hypot(vx, vy);
          if (m > 4) { vx *= 4 / m; vy *= 4 / m; }
          q.px = q.x; q.py = q.y;
          q.x += vx * dt * k; q.y += vy * dt * k;
          q.age += dt;
          if (q.x < view.x0 || q.x > view.x1 || q.y < view.y0 || q.y > view.y1 || q.age > 4 || Math.hypot(q.x, q.y) < 0.05) {
            q.x = view.x0 + Math.random() * (view.x1 - view.x0);
            q.y = view.y0 + Math.random() * (view.y1 - view.y0);
            q.px = q.x; q.py = q.y; q.age = 0;
          }
        }
      }
    });
    sim.onDraw(() => {
      const fd = F2[sim.p.fld], F = fd.F;
      view.update();
      if (!parts.length) seed();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x', ylabel: 'y' });
      const ctx = cv.ctx;
      const refm = sim.p.fld === 'point' || sim.p.fld === 'vortex' ? 1.2 : sim.p.fld === 'wavy' ? 1.2 : 2.5;
      if (sim.p.arr) EM.field.arrows(view, F, { spacing: 32, mode: 'len', ref: refm, maxLen: 24, color: EM.alpha('--c6', 0.55), width: 1.1, skip: (x, y) => Math.hypot(x, y) < 0.2 });
      if (sim.p.trace) {
        ctx.save();
        ctx.fillStyle = EM.alpha('--c1', 0.75);
        for (const q of parts) {
          ctx.beginPath();
          ctx.arc(view.X(q.x), view.Y(q.y), 1.8, 0, 7);
          ctx.fill();
        }
        ctx.restore();
      }
      const h = sim.p.h;
      const r = edgeInts(F, P[0], P[1], h);
      /* cuadrado */
      const x0 = view.X(P[0] - h / 2), y0 = view.Y(P[1] + h / 2), sz = h * view.s;
      ctx.save();
      ctx.fillStyle = EM.alpha('--accent', 0.08);
      ctx.fillRect(x0, y0, sz, sz);
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x0, y0, sz, sz);
      ctx.restore();
      /* flechas de flujo en cada lado (3 por lado) */
      let fmax = 1e-9;
      const samples = [];
      for (const s of r.sides) for (let i = 0; i < 3; i++) {
        const u = (i + 0.5) / 3;
        const px = s.a[0] + (s.b[0] - s.a[0]) * u, py = s.a[1] + (s.b[1] - s.a[1]) * u;
        const v = F(px, py);
        const fn = v[0] * s.n[0] + v[1] * s.n[1];
        samples.push([px, py, s.n, fn]);
        fmax = Math.max(fmax, Math.abs(fn));
      }
      for (const [px, py, n, fn] of samples) {
        const L = (Math.abs(fn) / fmax) * Math.min(26, sz * 0.45);
        if (L < 2) continue;
        const X = view.X(px), Y = view.Y(py);
        const sgn = Math.sign(fn);
        const col = sgn > 0 ? '--pos' : '--neg';
        if (sgn > 0) EM.draw.arrow(ctx, X, Y, X + n[0] * L, Y - n[1] * L, { color: col, width: 2, head: 7 });
        else EM.draw.arrow(ctx, X + n[0] * L, Y - n[1] * L, X, Y, { color: col, width: 2, head: 7 });
      }
      /* rueda de paletas */
      const R = Math.min(sz * 0.32, 22);
      const cx = view.X(P[0]), cy = view.Y(P[1]);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-wheel);
      ctx.strokeStyle = EM.col('--accent');
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(a), R * Math.sin(a)); }
      ctx.stroke();
      ctx.fillStyle = EM.col('--accent');
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; ctx.beginPath(); ctx.arc(R * Math.cos(a), R * Math.sin(a), 3.2, 0, 7); ctx.fill(); }
      ctx.restore();
      if (fd.sing) {
        ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), 4, 0, 7); ctx.fillStyle = EM.col('--warn-ink'); ctx.fill();
      }
      const inside = fd.sing && Math.abs(P[0]) < h / 2 && Math.abs(P[1]) < h / 2;
      sim.set('flux', f3(r.flux));
      sim.set('dest', f3(r.flux / (h * h)));
      sim.set('div', fd.sing === 'div' && inside ? 'singular (δ en el origen)' : f3(fd.div(P[0], P[1])));
      sim.set('circ', f3(r.circ));
      sim.set('cest', f3(r.circ / (h * h)));
      sim.set('curl', fd.sing === 'curl' && inside ? 'singular (δ en el origen)' : f3(fd.curl(P[0], P[1])));
    });
  });

  /* ======================================================================
     3.4 Teoremas de Gauss y Stokes en el plano
     ====================================================================== */
  EM.defineSim('theorems-2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -3, xmax: 3, ymin: -2.1, ymax: 2.1 });
    sim.group('Teorema');
    sim.seg('mode', { options: [['div', 'Divergencia (flujo)'], ['curl', 'Stokes (circulación)']], value: 'div' });
    sim.group('Campo');
    sim.select('fld', { options: fieldOptions(['mixed', 'wavy', 'source', 'rot', 'spiral', 'shear', 'point', 'vortex']), value: 'mixed' });
    sim.group('Región circular');
    sim.slider('R', { label: 'Radio de la región', min: 0.2, max: 1.8, step: 0.02, value: 1.0, fmt: (v) => EM.fix(v, 2) });
    sim.check('arr', { label: 'Flechas del campo', value: true });
    sim.out('bnd', 'Integral de borde', { hl: true });
    sim.out('area', 'Integral de área', { hl: true });
    sim.out('diff', 'Diferencia');
    const noteS = sim.note('');
    sim.hint('Arrastra el centro de la región', cv);
    const Cc = [0.5, 0.2];
    EM.pointer(cv, {
      down: (x, y) => (Math.hypot(view.X(Cc[0]) - x, view.Y(Cc[1]) - y) < 16 ? 1 : null),
      move: (_, x, y) => { Cc[0] = M.clamp(view.wx(x), view.x0, view.x1); Cc[1] = M.clamp(view.wy(y), view.y0, view.y1); sim.redraw(); },
      hover: (x, y) => Math.hypot(view.X(Cc[0]) - x, view.Y(Cc[1]) - y) < 16
    });
    sim.onDraw(() => {
      const fd = F2[sim.p.fld], F = fd.F, isDiv = sim.p.mode === 'div';
      const g = isDiv ? fd.div : fd.curl;
      view.update();
      EM.draw.clear(cv);
      /* mapa de la densidad (div o rot) */
      let gm = 0;
      for (let i = 0; i <= 30; i++) for (let j = 0; j <= 20; j++) gm = Math.max(gm, Math.abs(g(view.x0 + ((view.x1 - view.x0) * i) / 30, view.y0 + ((view.y1 - view.y0) * j) / 20)));
      if (gm > 1e-9) EM.field.heat(view, g, (v) => EM.cmap.diverging((v / gm) * 0.85), { res: 4 });
      view.grid({ minorLines: false, xlabel: 'x', ylabel: 'y' });
      const ctx = cv.ctx;
      const refm = sim.p.fld === 'point' || sim.p.fld === 'vortex' || sim.p.fld === 'wavy' ? 1.2 : 2.5;
      if (sim.p.arr) EM.field.arrows(view, F, { spacing: 32, mode: 'len', ref: refm, maxLen: 24, color: EM.alpha('--ink', 0.45), width: 1.1, skip: (x, y) => Math.hypot(x, y) < 0.2 });
      const R = sim.p.R;
      /* integral de borde */
      const N = 1440;
      let bnd = 0;
      const marks = [];
      for (let i = 0; i < N; i++) {
        const t = ((i + 0.5) / N) * 2 * Math.PI;
        const x = Cc[0] + R * Math.cos(t), y = Cc[1] + R * Math.sin(t);
        const v = F(x, y);
        const val = isDiv ? v[0] * Math.cos(t) + v[1] * Math.sin(t) : -v[0] * Math.sin(t) + v[1] * Math.cos(t);
        bnd += val * R * ((2 * Math.PI) / N);
        if (i % 40 === 20) marks.push([x, y, t, val]);
      }
      /* integral de área (polar) */
      let area = 0;
      const nr = 140, nt = 280;
      for (let i = 0; i < nr; i++) {
        const rr = ((i + 0.5) / nr) * R;
        for (let j = 0; j < nt; j++) {
          const t = ((j + 0.5) / nt) * 2 * Math.PI;
          area += g(Cc[0] + rr * Math.cos(t), Cc[1] + rr * Math.sin(t)) * rr * (R / nr) * ((2 * Math.PI) / nt);
        }
      }
      /* dibujar región */
      ctx.save();
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(view.X(Cc[0]), view.Y(Cc[1]), R * view.s, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
      let mm = 1e-9;
      for (const m of marks) mm = Math.max(mm, Math.abs(m[3]));
      for (const [x, y, t, val] of marks) {
        const L = (Math.abs(val) / mm) * 26;
        if (L < 2) continue;
        const X = view.X(x), Y = view.Y(y);
        const d = isDiv ? [Math.cos(t), Math.sin(t)] : [-Math.sin(t), Math.cos(t)];
        const sgn = Math.sign(val);
        const col = sgn > 0 ? '--pos' : '--neg';
        if (isDiv) {
          if (sgn > 0) EM.draw.arrow(ctx, X, Y, X + d[0] * L, Y - d[1] * L, { color: col, width: 2, head: 7 });
          else EM.draw.arrow(ctx, X + d[0] * L, Y - d[1] * L, X, Y, { color: col, width: 2, head: 7 });
        } else {
          EM.draw.arrow(ctx, X - d[0] * sgn * L / 2, Y + d[1] * sgn * L / 2, X + d[0] * sgn * L / 2, Y - d[1] * sgn * L / 2, { color: col, width: 2, head: 7 });
        }
      }
      ctx.beginPath(); ctx.arc(view.X(Cc[0]), view.Y(Cc[1]), 5, 0, 7); ctx.fillStyle = EM.col('--ink'); ctx.fill();
      if (fd.sing) {
        ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), 4.5, 0, 7); ctx.fillStyle = EM.col('--warn-ink'); ctx.fill();
        EM.text(ctx, 'singularidad', view.X(0) + 8, view.Y(0) + 16, { size: 11, color: '--warn-ink', halo: true });
      }
      if (gm > 1e-9) EM.field.colorbar(ctx, cv.w - 62, 34, 12, Math.min(160, cv.h - 60), (v) => EM.cmap.diverging((v / gm) * 0.85), -gm, gm, { label: isDiv ? '∇·F' : '(∇×F)_{z}', fmt: (v) => EM.fix(v, 2) });
      const encl = Math.hypot(Cc[0], Cc[1]) < R;
      sim._outs.bnd.dt.innerHTML = isDiv ? '∮ <b>F</b>·<b>n̂</b> d<i>l</i>' : '∮ <b>F</b>·d<b>l</b>';
      sim._outs.area.dt.innerHTML = isDiv ? '∬ ∇·<b>F</b> d<i>S</i>' : '∬ (∇×<b>F</b>)<sub>z</sub> d<i>S</i>';
      sim.set('bnd', EM.fix(bnd, 4));
      sim.set('area', EM.fix(area, 4));
      sim.set('diff', EM.fix(bnd - area, 4));
      const matters = (isDiv && fd.sing === 'div') || (!isDiv && fd.sing === 'curl');
      noteS.innerHTML = matters && encl ? 'La región encierra la singularidad: la integral de borde vale 2π = 6.2832, que es la “carga” concentrada en el origen (una delta de Dirac) que el cálculo punto a punto no ve.' : matters ? 'La región no encierra la singularidad: ambos lados valen cero.' : '';
    });
  });

  /* ======================================================================
     3.5 Delta de Dirac
     ====================================================================== */
  EM.defineSim('dirac-delta', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const cf = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    sim.group('Sucesión de funciones');
    sim.select('shape', { options: [['rect', 'Rectángulo'], ['gauss', 'Gaussiana'], ['lor', 'Lorentziana']], value: 'gauss' });
    sim.slider('eps', { label: 'Ancho ε', min: 0.02, max: 1, value: 0.3, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('a', { label: 'Posición <i>a</i>', min: -2, max: 2, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.group('Función de prueba');
    const FF = { cos: { n: 'f(x) = cos 2x', f: (x) => Math.cos(2 * x) }, lor: { n: 'f(x) = 1/(1 + x²)', f: (x) => 1 / (1 + x * x) }, gau: { n: 'f(x) = e^{−(x−1)²}', f: (x) => Math.exp(-((x - 1) ** 2)) } };
    sim.select('tf', { options: [['cos', 'f(x) = cos 2x'], ['lor', 'f(x) = 1/(1 + x²)'], ['gau', 'f(x) = exp(−(x−1)²)']], value: 'cos' });
    sim.out('area', '∫ δ<sub>ε</sub>(<i>x</i>−<i>a</i>) d<i>x</i>');
    sim.out('peak', 'Altura del pico');
    sim.out('int', '∫ <i>f</i>(<i>x</i>) δ<sub>ε</sub>(<i>x</i>−<i>a</i>) d<i>x</i>', { hl: true });
    sim.out('fa', '<i>f</i>(<i>a</i>)', { hl: true });
    const dfn = (shape, eps) => {
      if (shape === 'rect') return (u) => (Math.abs(u) <= eps / 2 ? 1 / eps : 0);
      if (shape === 'gauss') return (u) => Math.exp(-(u * u) / (2 * eps * eps)) / (eps * Math.sqrt(2 * Math.PI));
      return (u) => eps / Math.PI / (u * u + eps * eps);
    };
    sim.onDraw(() => {
      const { shape, eps, a } = sim.p;
      const d = dfn(shape, eps), f = FF[sim.p.tf].f;
      const peak = d(0);
      EM.draw.clear(cv);
      const ymax = Math.max(2, peak * 1.12);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -3, xmax: 3, ymin: 0, ymax, xlabel: 'x', ylabel: 'δ_{ε}(x − a)', title: 'Función de la sucesión' });
      pl.frame();
      pl.fn((x) => d(x - a), { color: '--c1', width: 2.2, fill: '--c1', fillAlpha: 0.2, n: 2400 });
      pl.vline(a, { color: '--accent', label: 'x = a' });
      /* integrales */
      let area, integ;
      if (shape === 'rect') {
        area = 1;
        integ = M.simpson(f, a - eps / 2, a + eps / 2, 400) / eps;
      } else if (shape === 'gauss') {
        area = M.simpson((x) => d(x), -9 * eps, 9 * eps, 2000);
        integ = M.simpson((x) => f(x) * d(x - a), a - 9 * eps, a + 9 * eps, 2000);
      } else {
        area = M.simpson(() => 1 / Math.PI, -Math.PI / 2, Math.PI / 2, 10);
        /* sustitución x = a + ε tan u */
        integ = M.simpson((u) => f(a + eps * Math.tan(u)) / Math.PI, -Math.PI / 2 + 1e-9, Math.PI / 2 - 1e-9, 4000);
      }
      EM.draw.clear(cf);
      const pf = new EM.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: -3, xmax: 3, ymin: -1.2, ymax: 1.2, xlabel: 'x', ylabel: 'f(x)', mt: 10 });
      pf.frame();
      pf.fn(f, { color: '--c3', width: 2 });
      pf.vline(a, { color: '--accent' });
      pf.hline(integ, { color: '--c1', dash: [5, 3], label: '∫ f δ_{ε}', labelRight: true });
      pf.dot(a, f(a), { color: '--accent', r: 5, label: 'f(a)' });
      sim.set('area', EM.fix(area, 4));
      sim.set('peak', EM.fix(peak, 3));
      sim.set('int', EM.fix(integ, 5));
      sim.set('fa', EM.fix(f(a), 5));
    });
  });
})();
