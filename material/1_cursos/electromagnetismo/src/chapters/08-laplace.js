/* Capítulo 8 — Laplace, unicidad e imágenes */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Dibuja la parte de una línea que satisface keep(x,y) */
  function drawWhere(view, line, keep, st) {
    let seg = [];
    const pieces = [];
    for (const p of line.pts) {
      if (keep(p[0], p[1])) seg.push(p);
      else { if (seg.length > 1) pieces.push(seg); seg = []; }
    }
    if (seg.length > 1) pieces.push(seg);
    for (const pc of pieces) EM.field.drawLine(view, { pts: pc, end: line.end, dir: line.dir }, st);
  }

  /* ======================================================================
     8.1 Imagen en un plano
     ====================================================================== */
  EM.defineSim('image-plane', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const cs = sim.canvas({ aspect: 3.6, cls: 'fixed' });
    const view = new EM.View2D(cv, { xmin: -6, xmax: 6, ymin: -2.6, ymax: 5.4 });
    sim.group('Carga');
    sim.slider('q', { label: 'Carga <i>q</i>', min: -5, max: 5, step: 0.5, value: 2, unit: 'nC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('d', { label: 'Distancia al plano <i>d</i>', min: 0.5, max: 4, step: 0.05, value: 2, unit: 'cm', fmt: f2 });
    sim.group('Mostrar');
    sim.check('img', { label: 'Carga imagen y campo “virtual”', value: false });
    sim.check('eq', { label: 'Equipotenciales', value: true });
    sim.out('F', 'Fuerza sobre <i>q</i> (hacia el plano)', { hl: true });
    sim.out('s0', 'σ justo debajo de <i>q</i>');
    sim.out('W', 'Trabajo para traerla desde ∞');
    sim.out('Up', 'Energía del par carga–imagen');
    sim.onDraw(() => {
      const p = sim.p, q = p.q || 0.5, d = p.d;
      const ch = [{ x: 0, y: d, q }, { x: 0, y: -d, q: -q }];
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'z (cm)' });
      const ctx = cv.ctx;
      const Ef = (x, y) => EM.phys2.E(ch, x, y);
      if (p.eq) {
        const Vf = (x, y) => (y >= 0 ? EM.phys2.V(ch, x, y) : p.img ? EM.phys2.V(ch, x, y) : NaN);
        const lv = [];
        [0.05, 0.1, 0.2, 0.35, 0.55, 0.9, 1.4].forEach((v) => lv.push(v * Math.abs(q), -v * Math.abs(q)));
        EM.field.contours(view, Vf, lv, { color: '--equip', width: 1.1, dash: [5, 4], alpha: 0.8, res: 4 });
      }
      const lines = EM.field.chargeLines(view, ch, Ef, { perUnit: 16 / Math.abs(q), r0: 0.08 });
      lines.forEach((L) => {
        drawWhere(view, L, (x, y) => y >= 0, { color: '--fline', width: 1.3 });
        if (p.img) drawWhere(view, L, (x, y) => y < 0, { color: '--fline', width: 1, alpha: 0.35, dash: [4, 4] });
      });
      /* conductor */
      ctx.save();
      ctx.fillStyle = EM.alpha('--ink-3', p.img ? 0.12 : 0.28);
      ctx.fillRect(0, view.Y(0), cv.w, cv.h - view.Y(0));
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, view.Y(0)); ctx.lineTo(cv.w, view.Y(0)); ctx.stroke();
      /* carga inducida (signos) */
      for (let x = -5.5; x <= 5.5; x += 0.5) {
        const s = -(q * d) / Math.pow(x * x + d * d, 1.5);
        const sm = Math.abs(q) / (d * d);
        const a = Math.abs(s) / sm;
        if (a < 0.03) continue;
        const X = view.X(x), Y = view.Y(0) + 7, L = 2 + 4 * Math.sqrt(a);
        ctx.strokeStyle = EM.col(s > 0 ? '--pos' : '--neg');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X - L, Y); ctx.lineTo(X + L, Y);
        if (s > 0) { ctx.moveTo(X, Y - L); ctx.lineTo(X, Y + L); }
        ctx.stroke();
      }
      ctx.restore();
      EM.text(ctx, 'conductor a tierra (V = 0)', 10, cv.h - 10, { size: 11.5, color: '--ink-2', halo: true });
      EM.draw.charge(ctx, view.X(0), view.Y(d), q, { r: 12, label: 'q' });
      if (p.img) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        EM.draw.charge(ctx, view.X(0), view.Y(-d), -q, { r: 12, label: '−q (imagen)' });
        ctx.restore();
      }
      /* σ(x) */
      EM.draw.clear(cs);
      const qC = q * 1e-9, dm = d * 1e-2;
      const sig = (x) => -(qC * dm) / (2 * Math.PI * Math.pow((x * 1e-2) ** 2 + dm * dm, 1.5)) * 1e9; /* nC/m² */
      const smax = Math.abs(sig(0)) * 1.15;
      const pl = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: -6, xmax: 6, ymin: q > 0 ? -smax : 0, ymax: q > 0 ? 0 : smax, xlabel: 'x (cm)', ylabel: 'σ (nC/m²)', mt: 10, ml: 64 });
      pl.frame();
      pl.fn(sig, { color: q > 0 ? '--neg' : '--pos', width: 2.2, fill: q > 0 ? '--neg' : '--pos', fillAlpha: 0.15 });
      const F = (K.k * qC * qC) / Math.pow(2 * dm, 2);
      sim.set('F', EM.si(F, 'N'));
      sim.set('s0', EM.si(sig(0), 'nC/m²'));
      sim.set('W', EM.si(-(K.k * qC * qC) / (4 * dm), 'J'));
      sim.set('Up', EM.si(-(K.k * qC * qC) / (2 * dm), 'J'));
    });
  });

  /* ======================================================================
     8.2 Imagen en una esfera
     ====================================================================== */
  EM.defineSim('image-sphere', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const cp = sim.canvas({ aspect: 2.8, cls: 'fixed' });
    const view = new EM.View2D(cv, { xmin: -2.2, xmax: 5, ymin: -2.25, ymax: 2.25 });
    sim.group('Esfera');
    sim.seg('mode', { options: [['g', 'A tierra'], ['n', 'Aislada y neutra']], value: 'g' });
    sim.slider('a', { label: 'Distancia de <i>q</i> al centro, <i>a</i>/<i>R</i>', min: 1.1, max: 4.5, step: 0.01, value: 2.2, fmt: f2 });
    sim.group('Gráfica');
    sim.seg('plot', { options: [['s', 'σ(θ)'], ['f', 'Fuerza F(a)']], value: 's' });
    sim.out('qi', 'Imagen <i>q</i>′ = −<i>qR</i>/<i>a</i>');
    sim.out('b', 'Posición <i>b</i> = <i>R</i>²/<i>a</i>');
    sim.out('qs', 'Carga total inducida');
    sim.out('F', 'Fuerza (unidades <i>kq</i>²/<i>R</i>²)', { hl: true });
    sim.note('Carga <i>q</i> > 0; longitudes en unidades del radio <i>R</i>.');
    const force = (a, mode) => -a / Math.pow(a * a - 1, 2) + (mode === 'n' ? 1 / (a * a * a) : 0);
    const sigma = (th, a, mode) => -(a * a - 1) / Math.pow(1 + a * a - 2 * a * Math.cos(th), 1.5) + (mode === 'n' ? 1 / a : 0);
    sim.onDraw(() => {
      const p = sim.p, a = p.a, mode = p.mode;
      const qi = -1 / a, b = 1 / a;
      const ch = [{ x: a, y: 0, q: 1 }, { x: b, y: 0, q: qi }];
      if (mode === 'n') ch.push({ x: 0, y: 0, q: -qi });
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false, axes: false });
      const ctx = cv.ctx;
      const lines = EM.field.chargeLines(view, ch, (x, y) => EM.phys2.E(ch, x, y), { perUnit: 20, minLines: 5, r0: 0.05 });
      lines.forEach((L) => EM.drawClipped(view, L, 0, 0, 1, { color: '--fline', width: 1.2 }));
      const cx = view.X(0), cy = view.Y(0), R = view.s;
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, EM.col('--surface'));
      g.addColorStop(1, EM.col('--surface-3'));
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = g; ctx.fill();
      let smax = 0;
      for (let i = 0; i <= 180; i++) smax = Math.max(smax, Math.abs(sigma((Math.PI * i) / 180, a, mode)));
      for (let i = 0; i < 180; i++) {
        const t0 = (i / 180) * 2 * Math.PI, t1 = ((i + 1) / 180) * 2 * Math.PI;
        const th = Math.abs(Math.atan2(Math.sin((t0 + t1) / 2), Math.cos((t0 + t1) / 2)));
        ctx.beginPath(); ctx.arc(cx, cy, R + 3, -t0, -t1, true);
        ctx.strokeStyle = EM.rgbStr(EM.cmap.diverging(sigma(th, a, mode) / smax));
        ctx.lineWidth = 7; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.2; ctx.stroke();
      EM.draw.charge(ctx, view.X(a), view.Y(0), 1, { r: 11, label: 'q' });
      /* imágenes (fantasma) */
      ctx.save(); ctx.globalAlpha = 0.5;
      EM.draw.charge(ctx, view.X(b), view.Y(0), -1, { r: 7 });
      if (mode === 'n') EM.draw.charge(ctx, cx, cy, 1, { r: 6 });
      ctx.restore();
      EM.text(ctx, "q′", view.X(b), view.Y(0) - 14, { size: 12, italic: true, family: EM.FONT_MATH, color: '--ink-2', align: 'center', halo: true });
      if (mode === 'g') {
        const gy = cy + R, gy2 = view.Y(-2.0);
        ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy2);
        for (let j = 0; j < 3; j++) { const w = 14 - j * 5; ctx.moveTo(cx - w, gy2 + j * 5); ctx.lineTo(cx + w, gy2 + j * 5); }
        ctx.stroke();
      }
      /* gráfica */
      EM.draw.clear(cp);
      if (p.plot === 's') {
        const lo = Math.min(sigma(0, a, 'g'), sigma(0, a, 'n')), hi = Math.max(0.2, sigma(Math.PI, a, 'n'));
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 180, ymin: lo * 1.1, ymax: hi * 1.3, xlabel: 'θ (grados, desde la dirección de q)', ylabel: 'σ (q/4πR²)', mt: 10, xticks: [0, 30, 60, 90, 120, 150, 180] });
        pl.frame();
        pl.fn((t) => sigma(rad(t), a, 'g'), { color: '--c1', width: mode === 'g' ? 2.4 : 1.4, alpha: mode === 'g' ? 1 : 0.5 });
        pl.fn((t) => sigma(rad(t), a, 'n'), { color: '--c3', width: mode === 'n' ? 2.4 : 1.4, alpha: mode === 'n' ? 1 : 0.5 });
        pl.legend([{ label: 'a tierra', color: '--c1' }, { label: 'neutra', color: '--c3' }], 'br');
      } else {
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 1, xmax: 4.5, ymin: 1e-3, ymax: 100, ylog: true, xlabel: 'a / R', ylabel: '|F| (kq²/R²)', mt: 10 });
        pl.frame();
        pl.fn((x) => Math.abs(force(x, 'g')), { color: '--c1', width: 2.2, from: 1.02 });
        pl.fn((x) => Math.abs(force(x, 'n')), { color: '--c3', width: 2.2, from: 1.02 });
        pl.fn((x) => 1 / (4 * (x - 1) ** 2), { color: '--ink-3', width: 1.4, dash: [5, 4], from: 1.02 });
        pl.dot(a, Math.abs(force(a, mode)), { color: '--accent', r: 5 });
        pl.legend([{ label: 'a tierra', color: '--c1' }, { label: 'neutra', color: '--c3' }, { label: 'plano: 1/4(a−R)²', color: '--ink-3', dash: [5, 4] }], 'tr');
      }
      sim.set('qi', f3(qi) + ' q');
      sim.set('b', f3(b) + ' R');
      sim.set('qs', mode === 'g' ? f3(qi) + ' q' : '0 (neutra)');
      sim.set('F', f3(force(a, mode)) + ' (atractiva)');
    });
  });

  /* ======================================================================
     8.3 Cuña conductora (2n − 1 imágenes)
     ====================================================================== */
  EM.defineSim('image-corner', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -4.2, xmax: 4.2, ymin: -2.8, ymax: 2.8 });
    sim.group('Cuña');
    sim.slider('n', { label: 'Ángulo de la cuña π/<i>n</i>', min: 1, max: 6, step: 1, value: 2, fmt: (v) => (180 / v).toFixed(0) + '°  (n = ' + v + ')' });
    sim.check('img', { label: 'Mostrar imágenes', value: true });
    sim.out('ni', 'Número de imágenes 2<i>n</i> − 1');
    sim.out('F', '|<b>F</b>| sobre <i>q</i> (<i>kq</i>²/<i>u</i>²)', { hl: true });
    sim.hint('Arrastra la carga dentro de la cuña', cv);
    const Q = { r: 1.6, phi: rad(30) };
    const alpha = () => Math.PI / sim.p.n;
    EM.pointer(cv, {
      down: (x, y) => { const X = view.X(Q.r * Math.cos(Q.phi)), Y = view.Y(Q.r * Math.sin(Q.phi)); return Math.hypot(X - x, Y - y) < 16 ? 1 : null; },
      move: (_, x, y) => { const wx = view.wx(x), wy = view.wy(y); Q.r = M.clamp(Math.hypot(wx, wy), 0.3, 2.6); Q.phi = M.clamp(M.atan2p(wy, wx), 0.06, alpha() - 0.06); sim.redraw(); },
      hover: (x, y) => { const X = view.X(Q.r * Math.cos(Q.phi)), Y = view.Y(Q.r * Math.sin(Q.phi)); return Math.hypot(X - x, Y - y) < 16; }
    });
    sim.onChange = () => { Q.phi = M.clamp(Q.phi, 0.06, alpha() - 0.06); };
    sim.onDraw(() => {
      const n = sim.p.n, al = alpha();
      const ch = [];
      for (let k = 0; k < n; k++) {
        const a1 = Q.phi + 2 * k * al, a2 = -Q.phi + 2 * k * al;
        ch.push({ x: Q.r * Math.cos(a1), y: Q.r * Math.sin(a1), q: 1, real: k === 0 });
        ch.push({ x: Q.r * Math.cos(a2), y: Q.r * Math.sin(a2), q: -1 });
      }
      const inside = (x, y) => { const a = M.atan2p(y, x); return a <= al + 1e-9 && Math.hypot(x, y) > 1e-9; };
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      /* conductor fuera de la cuña */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(view.X(0), view.Y(0));
      ctx.arc(view.X(0), view.Y(0), 2000, -al, -2 * Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = EM.alpha('--ink-3', 0.22);
      ctx.fill();
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(view.X(6), view.Y(0)); ctx.lineTo(view.X(0), view.Y(0)); ctx.lineTo(view.X(6 * Math.cos(al)), view.Y(6 * Math.sin(al))); ctx.stroke();
      ctx.restore();
      const Ef = (x, y) => EM.phys2.E(ch, x, y);
      const Vf = (x, y) => (inside(x, y) ? EM.phys2.V(ch, x, y) : NaN);
      EM.field.contours(view, Vf, [0.05, 0.1, 0.2, 0.35, 0.6, 1, 1.6], { color: '--equip', width: 1.1, dash: [5, 4], res: 4 });
      const lines = EM.field.chargeLines(view, ch, Ef, { perUnit: 18, r0: 0.05 });
      lines.forEach((L) => drawWhere(view, L, inside, { color: '--fline', width: 1.3 }));
      ch.forEach((c) => {
        if (c.real) EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), 1, { r: 11, label: 'q' });
        else if (sim.p.img) { ctx.save(); ctx.globalAlpha = 0.45; EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 9 }); ctx.restore(); }
      });
      /* fuerza sobre q */
      const r0 = ch[0];
      let fx = 0, fy = 0;
      ch.slice(1).forEach((c) => { const dx = r0.x - c.x, dy = r0.y - c.y, r3 = Math.pow(dx * dx + dy * dy, 1.5); fx += (c.q * dx) / r3; fy += (c.q * dy) / r3; });
      const fm = Math.hypot(fx, fy);
      EM.draw.arrow(ctx, view.X(r0.x), view.Y(r0.y), view.X(r0.x) + (fx / fm) * 50, view.Y(r0.y) - (fy / fm) * 50, { color: '--accent', width: 3, head: 11 });
      sim.set('ni', String(2 * n - 1));
      sim.set('F', f3(fm));
    });
  });

  /* ======================================================================
     8.4 Ranura rectangular: series de Fourier
     ====================================================================== */
  EM.defineSim('separation-slot', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const cp = sim.canvas({ aspect: 2.8, cls: 'fixed' });
    sim.group('Serie');
    sim.slider('N', { label: 'Número de términos (n impares)', min: 1, max: 60, step: 1, value: 5, fmt: (v) => v.toFixed(0) + ' (n ≤ ' + (2 * v - 1) + ')' });
    sim.seg('plot', { label: 'Gráfica inferior', options: [['b', 'Frontera V(0, y)'], ['x', 'Perfil V(x, a/2)']], value: 'b' });
    sim.check('cont', { label: 'Equipotenciales', value: true });
    sim.out('ov', 'Máximo de <i>V</i>(0, <i>y</i>)', { hl: true });
    sim.out('mid', '<i>V</i>(<i>a</i>/2, <i>a</i>/2)');
    sim.note('<i>V</i><sub>0</sub> = 1 en <i>x</i> = 0; <i>V</i> = 0 en <i>y</i> = 0 y <i>y</i> = <i>a</i>.');
    const series = (x, y, N) => {
      let s = 0;
      for (let k = 0; k < N; k++) { const n = 2 * k + 1; s += (Math.exp(-n * Math.PI * x) * Math.sin(n * Math.PI * y)) / n; }
      return (4 / Math.PI) * s;
    };
    sim.onDraw(() => {
      const N = Math.round(sim.p.N);
      EM.draw.clear(cv);
      const view = new EM.View2D(cv, { xmin: -0.1, xmax: 2.1, ymin: -0.08, ymax: 1.08 });
      /* malla precalculada (separable) */
      const nx = 220, ny = 110;
      const ex = [], sy = [];
      for (let k = 0; k < N; k++) {
        const n = 2 * k + 1;
        ex.push(Float64Array.from({ length: nx }, (_, i) => Math.exp((-n * Math.PI * 2 * i) / (nx - 1)) / n));
        sy.push(Float64Array.from({ length: ny }, (_, j) => Math.sin((n * Math.PI * j) / (ny - 1))));
      }
      const G = new Float64Array(nx * ny);
      for (let k = 0; k < N; k++) for (let j = 0; j < ny; j++) { const s = sy[k][j]; if (s === 0) continue; for (let i = 0; i < nx; i++) G[j * nx + i] += ex[k][i] * s; }
      for (let i = 0; i < G.length; i++) G[i] *= 4 / Math.PI;
      const Vg = (x, y) => {
        if (x < 0 || x > 2 || y < 0 || y > 1) return NaN;
        const fx = (x / 2) * (nx - 1), fy = y * (ny - 1);
        const i = Math.min(nx - 2, Math.floor(fx)), j = Math.min(ny - 2, Math.floor(fy));
        const tx = fx - i, ty = fy - j;
        return (G[j * nx + i] * (1 - tx) + G[j * nx + i + 1] * tx) * (1 - ty) + (G[(j + 1) * nx + i] * (1 - tx) + G[(j + 1) * nx + i + 1] * tx) * ty;
      };
      EM.field.heat(view, Vg, (v) => EM.cmap.seq(M.clamp(v, 0, 1.2) * 0.8, '--c2'), { res: 3 });
      if (sim.p.cont) EM.field.contours(view, Vg, [0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], { color: '--ink', width: 1, alpha: 0.6, res: 3 });
      const ctx = cv.ctx;
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(view.X(2.1), view.Y(0)); ctx.lineTo(view.X(0), view.Y(0)); ctx.moveTo(view.X(2.1), view.Y(1)); ctx.lineTo(view.X(0), view.Y(1)); ctx.stroke();
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(0.01)); ctx.lineTo(view.X(0), view.Y(0.99)); ctx.stroke();
      EM.text(ctx, 'V = 0', view.X(1.8), view.Y(1) - 8, { size: 11.5, mono: true, color: '--ink-2', halo: true });
      EM.text(ctx, 'V = 0', view.X(1.8), view.Y(0) + 16, { size: 11.5, mono: true, color: '--ink-2', halo: true });
      EM.text(ctx, 'V₀', view.X(0) - 8, view.Y(0.5), { size: 13, weight: 700, color: '--c2', halo: true, align: 'right', baseline: 'middle' });
      EM.text(ctx, 'x → ∞', view.X(2.05), view.Y(0.5), { size: 11.5, color: '--ink-3', align: 'right', baseline: 'middle', halo: true });
      /* gráfica */
      EM.draw.clear(cp);
      let ov = 0;
      for (let i = 0; i <= 2000; i++) ov = Math.max(ov, series(0, i / 2000, N));
      if (sim.p.plot === 'b') {
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1, ymin: -0.1, ymax: 1.3, xlabel: 'y / a', ylabel: 'V(0, y) / V₀', mt: 10 });
        pl.frame();
        pl.hline(1, { color: '--ink-3', label: 'V₀', labelRight: true });
        pl.fn((y) => series(0, y, N), { color: '--c2', width: 2, n: 1600 });
      } else {
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2, ymin: 1e-4, ymax: 2, ylog: true, xlabel: 'x / a', ylabel: 'V(x, a/2) / V₀', mt: 10 });
        pl.frame();
        pl.fn((x) => series(x, 0.5, N), { color: '--c2', width: 2.2, from: 0.001 });
        pl.fn((x) => (4 / Math.PI) * Math.exp(-Math.PI * x), { color: '--ink-3', width: 1.4, dash: [5, 4] });
        pl.label(1.2, 0.08, 'sólo n = 1', { color: '--ink-3' });
      }
      sim.set('ov', f3(ov) + (N > 3 ? '  (sobrepaso de Gibbs)' : ''));
      sim.set('mid', f3(series(0.5, 0.5, N)));
    });
  });

  /* ======================================================================
     8.5 Esfera conductora en campo uniforme
     ====================================================================== */
  EM.defineSim('sphere-uniform', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -3.2, xmax: 3.2, ymin: -2.3, ymax: 2.3 });
    sim.group('Parámetros');
    sim.slider('E0', { label: 'Campo aplicado <i>E</i><sub>0</sub>', min: 10, max: 300, step: 5, value: 100, unit: 'kV/m', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Radio <i>R</i>', min: 1, max: 20, step: 0.5, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.check('eq', { label: 'Equipotenciales', value: true });
    sim.out('smax', 'σ<sub>máx</sub> = 3<i>ε</i><sub>0</sub><i>E</i><sub>0</sub>', { hl: true });
    sim.out('p', 'Dipolo inducido <i>p</i> = 4π<i>ε</i><sub>0</sub><i>R</i>³<i>E</i><sub>0</sub>');
    sim.out('Ep', 'Campo en los polos');
    sim.note('El campo aplicado apunta hacia arriba (+<i>z</i>). Longitudes de la figura en unidades de <i>R</i>.');
    const E = (x, z) => {
      const r2 = x * x + z * z, r = Math.sqrt(r2);
      if (r < 1) return [0, 0];
      const r5 = r2 * r2 * r;
      /* E = ẑ + (3 z r − ẑ r²)/r⁵ con R = 1, E0 = 1 */
      return [(3 * z * x) / r5, 1 + (3 * z * z) / r5 - 1 / (r2 * r)];
    };
    const Vf = (x, z) => { const r = Math.hypot(x, z); return r < 1 ? 0 : -z * (1 - 1 / (r * r * r)); };
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      if (sim.p.eq) EM.field.contours(view, Vf, [-2, -1.6, -1.2, -0.8, -0.4, 0.4, 0.8, 1.2, 1.6, 2], { color: '--equip', width: 1.1, dash: [5, 4], res: 4 });
      const B = [view.x0 - 0.2, view.x1 + 0.2, view.y0 - 0.2, view.y1 + 0.2];
      const stop = (x, y) => (Math.hypot(x, y) < 1.005 ? 'sph' : null);
      for (let i = 0; i < 25; i++) {
        const x0 = view.x0 + ((i + 0.5) * (view.x1 - view.x0)) / 25;
        const L = EM.field.trace(E, x0, view.y0 + 0.01, 1, { ds: 0.02, maxSteps: 1200, bounds: B, stop });
        EM.field.drawLine(view, L, { color: '--fline', width: 1.2, arrowFirst: 40, arrowGap: 150 });
        if (L.end === 'sph') {
          const mir = { pts: L.pts.map((q) => [q[0], -q[1]]), end: 'out', dir: -1 };
          EM.field.drawLine(view, mir, { color: '--fline', width: 1.2, arrowFirst: 40, arrowGap: 150 });
        }
      }
      const cx = view.X(0), cy = view.Y(0), R = view.s;
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, EM.col('--surface'));
      g.addColorStop(1, EM.col('--surface-3'));
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = g; ctx.fill();
      for (let i = 0; i < 180; i++) {
        const t0 = (i / 180) * 2 * Math.PI, t1 = ((i + 1) / 180) * 2 * Math.PI, tm = (t0 + t1) / 2;
        /* θ desde +z: cos θ = sin(tm) */
        ctx.beginPath(); ctx.arc(cx, cy, R + 3, -t0, -t1, true);
        ctx.strokeStyle = EM.rgbStr(EM.cmap.diverging(Math.sin(tm)));
        ctx.lineWidth = 7; ctx.stroke();
      }
      EM.draw.arrow(ctx, 22, cv.h - 20, 22, cv.h - 80, { color: '--efield', width: 2.4, head: 10 });
      EM.text(ctx, 'E₀', 32, cv.h - 60, { size: 13, weight: 700, family: EM.FONT_MATH, color: '--efield', halo: true });
      const E0 = sim.p.E0 * 1e3, Rm = sim.p.R * 1e-2;
      sim.set('smax', EM.si(3 * K.eps0 * E0, 'C/m²'));
      sim.set('p', EM.si(4 * Math.PI * K.eps0 * Rm ** 3 * E0, 'C·m'));
      sim.set('Ep', EM.si(3 * E0, 'V/m') + ' = 3E₀');
    });
  });

  /* ======================================================================
     8.6 Relajación numérica interactiva
     ====================================================================== */
  EM.defineSim('laplace-solver', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const cr = sim.canvas({ aspect: 4.2, cls: 'fixed' });
    const view = new EM.View2D(cv, { xmin: -4, xmax: 4, ymin: -3, ymax: 3 });
    const PRE = {
      plates: 'Condensador de placas finitas',
      box: 'Electrodo dentro de una caja a tierra',
      cage: 'Jaula de Faraday y carga externa',
      quad: 'Lente cuadrupolar (4 electrodos)',
      tip: 'Punta frente a un plano'
    };
    sim.group('Configuración');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k]]), value: 'plates', onInput: () => reset() });
    sim.slider('V1', { label: 'Potencial <i>V</i><sub>1</sub> (o intensidad de la carga)', min: -100, max: 100, step: 5, value: 100, unit: 'V', fmt: (v) => v.toFixed(0), onInput: () => reset(true) });
    sim.slider('V2', { label: 'Potencial <i>V</i><sub>2</sub>', min: -100, max: 100, step: 5, value: -100, unit: 'V', fmt: (v) => v.toFixed(0), onInput: () => reset(true) });
    sim.group('Método');
    sim.slider('w', { label: 'Factor de sobrerrelajación <i>ω</i>', min: 1, max: 1.98, step: 0.01, value: 1.9, fmt: f2 });
    sim.slider('ipf', { label: 'Iteraciones por cuadro', min: 1, max: 40, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.button('Reiniciar (V = 0 en nodos libres)', () => reset());
    sim.check('arr', { label: 'Flechas de <b>E</b>', value: true });
    sim.out('it', 'Iteraciones');
    sim.out('res', 'Cambio máximo en la última iteración', { hl: true });
    sim.out('Vp', '<i>V</i> en la sonda');
    sim.out('Ep', '|<b>E</b>| en la sonda');
    sim.hint('Arrastra la sonda ⊕', cv);
    let S = null, hist = [];
    const probe = { x: 0, y: 0 };
    function reset(keep) {
      const p = sim.p;
      const old = keep && S ? S.V.slice() : null;
      S = new EM.Laplace(-4, 4, -3, 3, 0.08);
      const pre = p.pre;
      if (pre === 'plates') {
        S.fixRegion((x, y) => Math.abs(x) < 2 && Math.abs(y - 0.8) < 0.09, p.V1, 1);
        S.fixRegion((x, y) => Math.abs(x) < 2 && Math.abs(y + 0.8) < 0.09, p.V2, 2);
      } else if (pre === 'box') {
        S.fixRegion((x, y) => Math.abs(x + 0.8) < 0.5 && Math.abs(y - 0.4) < 0.5, p.V1, 1);
      } else if (pre === 'cage') {
        S.fixRegion((x, y) => Math.max(Math.abs(x - 1), Math.abs(y)) < 1.6 && Math.max(Math.abs(x - 1), Math.abs(y)) > 1.4, 0, 2);
        S.addSource(-2.6, 0, (p.V1 / 100) * 190);
      } else if (pre === 'quad') {
        const r = 0.45, d = 1.5;
        S.fixRegion((x, y) => Math.hypot(x - d, y) < r || Math.hypot(x + d, y) < r, p.V1, 1);
        S.fixRegion((x, y) => Math.hypot(x, y - d) < r || Math.hypot(x, y + d) < r, p.V2, 2);
      } else if (pre === 'tip') {
        S.fixRegion((x, y) => y < -2.2, 0, 2);
        S.fixRegion((x, y) => (y > 0.2 && y < 2.4 && Math.abs(x) < (y - 0.2) * 0.35) || (y >= 2.4 && Math.abs(x) < 0.77), p.V1, 1);
      }
      if (old && old.length === S.V.length) for (let k = 0; k < old.length; k++) if (!S.fixed[k]) S.V[k] = old[k];
      hist = [];
      sim.p.V2 !== undefined && sim.ctl.V2 && sim.ctl.V2.show(pre === 'plates' || pre === 'quad');
    }
    reset();
    EM.pointer(cv, {
      down: (x, y) => (Math.hypot(view.X(probe.x) - x, view.Y(probe.y) - y) < 14 ? 1 : null),
      move: (_, x, y) => { probe.x = M.clamp(view.wx(x), -3.9, 3.9); probe.y = M.clamp(view.wy(y), -2.9, 2.9); sim.redraw(); },
      hover: (x, y) => Math.hypot(view.X(probe.x) - x, view.Y(probe.y) - y) < 14
    });
    sim.animate(() => {
      const d = S.solve(Math.round(sim.p.ipf), sim.p.w);
      hist.push([S.iters, Math.max(d, 1e-9)]);
      if (hist.length > 3000) hist.shift();
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      const Vf = (x, y) => S.at(x, y);
      const vm = 100;
      EM.field.heat(view, Vf, (v) => EM.cmap.diverging(M.clamp(v / vm, -1, 1) * 0.8), { res: 4 });
      const lv = [];
      for (let k = -9; k <= 9; k++) if (k) lv.push(k * 10);
      lv.push(0.5, -0.5);
      EM.field.contours(view, Vf, lv, { color: '--ink', width: 1, alpha: 0.5, res: 4 });
      if (sim.p.arr) EM.field.arrows(view, (x, y) => (S.isFixedAt(x, y) ? [0, 0] : S.E(x, y)), { spacing: 26, mode: 'dir', color: '--fline', width: 1, decades: 2 });
      /* electrodos */
      const ctx = cv.ctx;
      const hp = S.h * view.s + 0.8;
      for (let j = 1; j < S.ny - 1; j++) for (let i = 1; i < S.nx - 1; i++) {
        const k = S.id(i, j);
        if (!S.fixed[k]) continue;
        const v = S.V[k];
        ctx.fillStyle = EM.rgbStr(EM.cmap.diverging(M.clamp(v / vm, -1, 1)));
        ctx.fillRect(view.X(S.xOf(i)) - hp / 2, view.Y(S.yOf(j)) - hp / 2, hp, hp);
        if (v === 0) { ctx.fillStyle = EM.alpha('--ink-3', 0.7); ctx.fillRect(view.X(S.xOf(i)) - hp / 2, view.Y(S.yOf(j)) - hp / 2, hp, hp); }
      }
      if (sim.p.pre === 'cage') EM.draw.charge(ctx, view.X(-2.6), view.Y(0), sim.p.V1 >= 0 ? 1 : -1, { r: 9, label: 'λ' });
      const px = view.X(probe.x), py = view.Y(probe.y);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.moveTo(px - 11, py); ctx.lineTo(px + 11, py); ctx.moveTo(px, py - 11); ctx.lineTo(px, py + 11); ctx.stroke();
      /* residuo */
      EM.draw.clear(cr);
      const itMax = Math.max(50, S.iters);
      const pl = new EM.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: itMax, ymin: 1e-6, ymax: 100, ylog: true, xlabel: 'iteraciones', ylabel: 'cambio máx (V)', mt: 10 });
      pl.frame();
      if (hist.length > 1) pl.path(hist, { color: '--c1', width: 1.8 });
      const E = S.E(probe.x, probe.y);
      sim.set('it', String(S.iters));
      sim.set('res', hist.length ? EM.sci(hist[hist.length - 1][1], 3) + ' V' : '—');
      sim.set('Vp', EM.fix(S.at(probe.x, probe.y), 2) + ' V');
      sim.set('Ep', EM.si(Math.hypot(E[0], E[1]) * 100, 'V/m'));
    });
  });
})();
