/* Capítulo 20 — Polarización */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od, J = OP.J, C = OP.C;
  const DEG = Math.PI / 180;

  /* Dibuja la elipse de un vector de Jones en un círculo de radio R; flecha de sentido de giro (convención e^{−iωt}) */
  function drawEllipse(ctx, cx, cy, R, v, o = {}) {
    const pts = [];
    for (let k = 0; k <= 120; k++) { const t = (2 * Math.PI * k) / 120, e = [C.mul(v[0], C.cis(-t))[0], C.mul(v[1], C.cis(-t))[0]]; pts.push([cx + R * e[0], cy - R * e[1]]); }
    ctx.save();
    ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.strokeStyle = EM.col(o.color || '--accent'); ctx.lineWidth = 2.2; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.stroke();
    if (Math.hypot(pts[0][0] - pts[8][0], pts[0][1] - pts[8][1]) > 3 && C.abs2(v[0]) + C.abs2(v[1]) > 1e-6) EM.draw.arrow(ctx, pts[5][0], pts[5][1], pts[9][0], pts[9][1], { color: o.color || '--accent', width: 2, head: 9 });
    ctx.restore();
    return pts;
  }
  EM.od.polEllipse = drawEllipse;
  const describe = (S) => {
    const e = J.ellipse(S), p = e.p, chi = e.chi / DEG, psi = e.psi / DEG;
    let t;
    if (S[0] < 1e-9) return 'sin luz';
    if (Math.abs(chi) < 0.5) t = 'lineal a ' + EM.fix(((psi % 180) + 180) % 180, 1) + '°';
    else if (Math.abs(Math.abs(chi) - 45) < 0.5) t = 'circular ' + (S[3] > 0 ? 'antihoraria' : 'horaria');
    else t = 'elíptica ' + (S[3] > 0 ? 'antihoraria' : 'horaria') + ', eje a ' + EM.fix(((psi % 180) + 180) % 180, 1) + '°';
    return t + (p < 0.999 ? ' (P = ' + EM.fix(p, 3) + ')' : '');
  };
  EM.od.polDescribe = describe;

  /* 20.1 Elipse de polarización */
  EM.defineSim('elipse', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('ax', { label: 'Amplitud E₀ₓ', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('ay', { label: 'Amplitud E₀ᵧ', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('d', { label: 'Desfase δ', min: -180, max: 180, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('st', 'Estado', { hl: true });
    sim.out('ang', 'Orientación ψ y elipticidad χ');
    sim.out('S', 'Stokes normalizados (S₁, S₂, S₃)');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, dl = p.d * DEG;
      EM.draw.clear(cv);
      const v = [[p.ax, 0], C.scale(C.cis(dl), p.ay)];
      const R = Math.min(H * 0.42, W * 0.22), cx = W * 0.25, cy = H / 2;
      drawEllipse(ctx, cx, cy, R, v);
      const wt = 2 * t, e = [C.mul(v[0], C.cis(-wt))[0], C.mul(v[1], C.cis(-wt))[0]];
      EM.draw.arrow(ctx, cx, cy, cx + R * e[0], cy - R * e[1], { color: '--c2', width: 2.4 });
      EM.text(ctx, 'x', cx + R + 6, cy + 4, { size: 12, italic: true, color: '--ink-3' }); EM.text(ctx, 'y', cx - 4, cy - R - 6, { size: 12, italic: true, color: '--ink-3' });
      EM.text(ctx, 'visto por quien recibe la luz', cx, cy + R + 18, { size: 10.5, color: '--ink-3', align: 'center' });
      /* componentes en el tiempo */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 4 * Math.PI, ymin: -1.1, ymax: 1.1, xpi: true, xlabel: 'ωt', ylabel: 'campo' });
      pl.frame();
      pl.fn((x) => p.ax * Math.cos(x), { color: '--c1', width: 2 });
      pl.fn((x) => p.ay * Math.cos(x - dl), { color: '--c3', width: 2 });
      pl.vline(wt % (4 * Math.PI), { color: '--c2' });
      pl.legend([{ label: 'Eₓ', color: '--c1' }, { label: 'Eᵧ', color: '--c3' }], 'tr');
      const S = J.stokes(v), el = J.ellipse(S);
      sim.set('st', describe(S));
      sim.set('ang', 'ψ = ' + EM.fix(el.psi / DEG, 1) + '°, χ = ' + EM.fix(el.chi / DEG, 1) + '°');
      sim.set('S', S[0] > 0 ? [S[1], S[2], S[3]].map((x) => EM.fix(x / S[0], 3)).join(', ') : '—');
    });
  });

  /* 20.2 Polarizadores en serie */
  EM.defineSim('malus', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.seg('m', { label: 'Montaje', options: [['2', 'Dos'], ['3', 'Tres'], ['N', 'N láminas']], value: '3' });
    sim.slider('t2', { label: 'Ángulo del segundo polarizador', min: 0, max: 180, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('t3', { label: 'Ángulo del tercero', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('N', { label: 'Número de láminas (de 0° a 90°)', min: 2, max: 60, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('I', 'Intensidad final / luz natural incidente', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      sim.ctl.t2.show(p.m !== 'N'); sim.ctl.t3.show(p.m === '3'); sim.ctl.N.show(p.m === 'N');
      let angs;
      if (p.m === '2') angs = [0, p.t2]; else if (p.m === '3') angs = [0, p.t2, p.t3]; else angs = Array.from({ length: p.N + 1 }, (_, i) => (90 * i) / p.N);
      const Is = [1, 0.5]; for (let i = 1; i < angs.length; i++) Is.push(Is[Is.length - 1] * Math.pow(Math.cos((angs[i] - angs[i - 1]) * DEG), 2));
      const n = angs.length, x0 = 30, step = (W - 60) / (n + 0.5), cy = H * 0.45, r = Math.min(H * 0.3, step * 0.42);
      ctx.fillStyle = EM.alpha('--gold', 0.85); ctx.fillRect(10, cy - 4, 12, 8);
      for (let i = 0; i < n; i++) {
        const x = x0 + step * (i + 0.7), a = angs[i] * DEG;
        ctx.strokeStyle = EM.alpha('--gold', Math.max(0.08, Is[i])); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - step * 0.7, cy); ctx.lineTo(x, cy); ctx.stroke();
        ctx.fillStyle = EM.alpha('--glass', 0.25); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, cy, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * Math.cos(a), cy + r * Math.sin(a)); ctx.lineTo(x + r * Math.cos(a), cy - r * Math.sin(a)); ctx.stroke();
        if (n <= 8) EM.text(ctx, EM.fix(angs[i], 0) + '°', x, cy + r + 16, { size: 11, color: '--ink-2', align: 'center' });
        if (n <= 12) EM.text(ctx, EM.fix(100 * Is[i + 1], 1) + ' %', x + step * 0.35, cy - 10, { size: 10.5, color: '--ink-2', align: 'center' });
      }
      const last = x0 + step * (n - 0.3);
      ctx.strokeStyle = EM.alpha('--gold', Math.max(0.08, Is[n])); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(last, cy); ctx.lineTo(W - 10, cy); ctx.stroke();
      sim.set('I', EM.fix(Is[n], 4) + (p.m === 'N' ? ' (fórmula ½cos²ᴺ(π/2N) = ' + EM.fix(0.5 * Math.pow(Math.cos(Math.PI / (2 * p.N)), 2 * p.N), 4) + ')' : ''));
    });
  });

  /* 20.3 Cálculo de Jones */
  EM.defineSim('jones', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.select('in', { label: 'Luz de entrada', options: [['h', 'Lineal horizontal'], ['d', 'Lineal a 45°'], ['r', 'Circular antihoraria'], ['e', 'Elíptica']], value: 'h' });
    sim.select('e1', { label: 'Elemento 1', options: [['none', '—'], ['pol', 'Polarizador'], ['qwp', 'Lámina λ/4'], ['hwp', 'Lámina λ/2']], value: 'qwp' });
    sim.slider('a1', { label: 'Ángulo del elemento 1', min: 0, max: 180, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.select('e2', { label: 'Elemento 2', options: [['none', '—'], ['pol', 'Polarizador'], ['qwp', 'Lámina λ/4'], ['hwp', 'Lámina λ/2']], value: 'none' });
    sim.slider('a2', { label: 'Ángulo del elemento 2', min: 0, max: 180, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('out', 'Salida', { hl: true });
    sim.out('J', 'Vector de Jones de salida');
    sim.out('I', 'Intensidad transmitida');
    const IN = { h: [[1, 0], [0, 0]], d: [[Math.SQRT1_2, 0], [Math.SQRT1_2, 0]], r: [[Math.SQRT1_2, 0], [0, Math.SQRT1_2]], e: [[0.894, 0], [0.2, 0.4]] };
    const M = (t, a) => (t === 'pol' ? J.polarizer(a) : t === 'qwp' ? J.qwp(a) : t === 'hwp' ? J.hwp(a) : null);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      let v = IN[p.in];
      const vin = v;
      const m1 = M(p.e1, p.a1 * DEG), m2 = M(p.e2, p.a2 * DEG);
      let v1 = v; if (m1) v1 = J.apply(m1, v);
      let v2 = v1; if (m2) v2 = J.apply(m2, v1);
      const R = Math.min(H * 0.32, W * 0.12), cy = H * 0.45;
      const xs = [W * 0.14, W * 0.5, W * 0.86];
      drawEllipse(ctx, xs[0], cy, R, vin, { color: '--c1' });
      drawEllipse(ctx, xs[1], cy, R, v1, { color: '--c5' });
      drawEllipse(ctx, xs[2], cy, R, v2, { color: '--accent' });
      const lab = (t, a) => (t === 'none' ? '—' : { pol: 'polarizador', qwp: 'λ/4', hwp: 'λ/2' }[t] + ' a ' + a + '°');
      EM.text(ctx, 'entrada', xs[0], cy + R + 18, { size: 11.5, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'tras ' + lab(p.e1, p.a1), xs[1], cy + R + 18, { size: 11.5, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'tras ' + lab(p.e2, p.a2), xs[2], cy + R + 18, { size: 11.5, color: '--ink-2', align: 'center' });
      for (const x of [(xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2]) EM.draw.arrow(ctx, x - 16, cy, x + 16, cy, { color: '--ink-3', width: 1.6 });
      const S = J.stokes(v2), Sin = J.stokes(vin);
      sim.set('out', describe(S));
      const fz = (z) => EM.fix(z[0], 3) + (z[1] >= 0 ? ' + ' : ' − ') + EM.fix(Math.abs(z[1]), 3) + 'i';
      sim.set('J', '(' + fz(v2[0]) + ', ' + fz(v2[1]) + ')');
      sim.set('I', EM.fix((100 * S[0]) / Sin[0], 2) + ' %');
    });
  });

  /* 20.4 Esfera de Poincaré */
  EM.defineSim('poincare', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('psi', { label: 'Orientación ψ', min: 0, max: 180, step: 1, value: 30, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('chi', { label: 'Elipticidad χ', min: -45, max: 45, step: 1, value: 15, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('ret', { label: 'Pasar por un retardador (arco al variar δ)', value: true });
    sim.slider('th', { label: 'Eje rápido del retardador', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('dl', { label: 'Retardo δ', min: 0, max: 360, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('S', 'Punto (S₁, S₂, S₃)', { hl: true });
    sim.out('st', 'Estado de salida');
    let az = -0.6, el = 0.35;
    EM.pointer(cv, { down: (x, y) => [x, y, az, el], move: (a, x, y) => { az = a[2] + (x - a[0]) * 0.01; el = Math.max(-1.4, Math.min(1.4, a[3] + (y - a[1]) * 0.01)); sim.redraw(); }, hover: () => true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const R = Math.min(W, H) * 0.38, cx = W * 0.4, cy = H / 2;
      /* proyección: S1 hacia el observador-derecha, S2 a la derecha, S3 arriba */
      const P = (s) => { const x = s[1], y = s[2], z = s[3]; const x1 = x * Math.cos(az) - y * Math.sin(az), y1 = x * Math.sin(az) + y * Math.cos(az); const y2 = y1, z2 = z * Math.cos(el) - x1 * Math.sin(el), d = z * Math.sin(el) + x1 * Math.cos(el); return [cx + R * y2, cy - R * z2, d]; };
      ctx.strokeStyle = EM.col('--rule-strong'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const circle = (f, col, w, dash) => { ctx.strokeStyle = EM.col(col); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); for (let k = 0; k <= 120; k++) { const q = P(f((2 * Math.PI * k) / 120)); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); ctx.setLineDash([]); };
      circle((t) => [1, Math.cos(t), Math.sin(t), 0], '--grid-2', 1.2);
      circle((t) => [1, Math.cos(t), 0, Math.sin(t)], '--grid-2', 1);
      circle((t) => [1, 0, Math.cos(t), Math.sin(t)], '--grid-2', 1);
      for (const [s, lab] of [[[1, 1, 0, 0], 'S₁ (H)'], [[1, 0, 1, 0], 'S₂ (+45°)'], [[1, 0, 0, 1], 'S₃ (circ. antihoraria)']]) { const q = P(s), o = P([1, 0, 0, 0]); EM.draw.arrow(ctx, o[0], o[1], q[0], q[1], { color: '--ink-3', width: 1.2 }); EM.text(ctx, lab, q[0] + 5, q[1] - 4, { size: 11, color: '--ink-2', halo: true }); }
      const ps = p.psi * DEG, ch = p.chi * DEG;
      const vin = J.vec(ps, ch), Sin = J.stokes(vin);
      let Sout = Sin;
      if (p.ret) {
        const pts = [];
        for (let k = 0; k <= 90; k++) { const S = J.stokes(J.apply(J.retarder(p.th * DEG, (2 * Math.PI * k) / 90), vin)); pts.push(P(S)); }
        ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
        Sout = J.stokes(J.apply(J.retarder(p.th * DEG, p.dl * DEG), vin));
        const ax = P([1, Math.cos(2 * p.th * DEG), Math.sin(2 * p.th * DEG), 0]);
        ctx.fillStyle = EM.col('--c5'); ctx.beginPath(); ctx.arc(ax[0], ax[1], 4, 0, 7); ctx.fill();
        EM.text(ctx, 'eje rápido', ax[0] + 6, ax[1] + 12, { size: 10.5, color: '--c5', halo: true });
      }
      const qi = P(Sin), qo = P(Sout);
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(qi[0], qi[1], 6, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(qo[0], qo[1], 6, 0, 7); ctx.fill();
      drawEllipse(ctx, W * 0.86, H * 0.3, Math.min(W * 0.1, H * 0.2), vin, { color: '--c1' });
      drawEllipse(ctx, W * 0.86, H * 0.74, Math.min(W * 0.1, H * 0.2), J.apply(p.ret ? J.retarder(p.th * DEG, p.dl * DEG) : [[[1, 0], [0, 0]], [[0, 0], [1, 0]]], vin), { color: '--c2' });
      EM.text(ctx, 'entrada', W * 0.86, H * 0.08, { size: 11, color: '--c1', align: 'center' });
      EM.text(ctx, 'salida', W * 0.86, H * 0.52, { size: 11, color: '--c2', align: 'center' });
      sim.set('S', Sout.slice(1).map((x) => EM.fix(x / Sout[0], 3)).join(', '));
      sim.set('st', describe(Sout));
    });
  });
})();
