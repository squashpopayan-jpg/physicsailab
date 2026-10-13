/* Capítulo 4 — Carga eléctrica y ley de Coulomb */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const k = K.k;
  const uC = 1e-6, cm = 1e-2;
  const f2 = (v) => EM.fix(v, 2);

  /* Dibuja una línea de campo recortada fuera de un círculo (cx, cy, R) */
  function drawClipped(view, line, cx, cy, R, st) {
    let seg = [];
    const pieces = [];
    for (const p of line.pts) {
      if (Math.hypot(p[0] - cx, p[1] - cy) >= R) seg.push(p);
      else { if (seg.length > 1) pieces.push(seg); seg = []; }
    }
    if (seg.length > 1) pieces.push(seg);
    for (const pc of pieces) EM.field.drawLine(view, { pts: pc, end: line.end, dir: line.dir }, st);
  }
  EM.drawClipped = drawClipped;

  /* ======================================================================
     4.1 Inducción en una esfera conductora
     ====================================================================== */
  EM.defineSim('induction-sphere', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const view = new EM.View2D(cv, { xmin: -2.3, xmax: 4.9, ymin: -2.3, ymax: 2.3 });
    sim.group('Proceso');
    sim.seg('step', { options: [[1, '1 · Aislada'], [2, '2 · A tierra'], [3, '3 · Resultado']], value: 1 });
    sim.group('Varilla cargada');
    sim.slider('Q', { label: 'Carga de la varilla <i>Q</i>', min: -20, max: 20, step: 1, value: 10, unit: 'nC', fmt: (v) => EM.fix(v, 0) });
    sim.slider('D', { label: 'Distancia al centro <i>D</i> / <i>a</i>', min: 1.35, max: 4.2, step: 0.01, value: 2.2, fmt: f2 });
    sim.check('lines', { label: 'Líneas de campo', value: true });
    sim.note('Esfera conductora de radio <i>a</i>. El campo exterior se calcula exactamente con el método de imágenes (capítulo 8).');
    sim.out('st', 'Estado');
    sim.out('qs', 'Carga neta de la esfera', { hl: true });
    sim.out('qn', 'Carga inducida negativa');
    sim.out('qp', 'Carga inducida positiva');
    sim.legend([{ color: '--pos', label: 'σ > 0' }, { color: '--neg', label: 'σ < 0' }, { color: '--fline', label: 'líneas de campo' }]);
    sim.onDraw(() => {
      const p = sim.p, a = 1, D = p.D, Q = p.Q, step = p.step;
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false, axes: false });
      const ctx = cv.ctx;
      const qImg = (-Q * a) / D, b = (a * a) / D;
      const charges = [];
      let qc = 0;
      if (step === 1) { charges.push({ x: D, y: 0, q: Q }, { x: b, y: 0, q: qImg }); qc = -qImg; }
      else if (step === 2) { charges.push({ x: D, y: 0, q: Q }, { x: b, y: 0, q: qImg }); qc = 0; }
      else { qc = qImg; }
      if (Math.abs(qc) > 1e-9) charges.push({ x: 0, y: 0, q: qc });
      /* densidad superficial σ(θ) (en unidades de Q/(4π a²)) */
      const sig = (th) => {
        if (step === 3) return qc / a / a;
        const g = (-Q * a * (D * D - a * a)) / Math.pow(a * a + D * D - 2 * a * D * Math.cos(th), 1.5);
        return g + (step === 1 ? -qImg / (a * a) : 0);
      };
      let smax = 1e-12;
      for (let i = 0; i < 360; i++) smax = Math.max(smax, Math.abs(sig((i / 360) * 2 * Math.PI)));
      if (p.lines && charges.length) {
        const Ef = (x, y) => EM.phys2.E(charges, x, y);
        const lines = EM.field.chargeLines(view, charges.filter((c) => Math.abs(c.q) > 1e-9), Ef, { perUnit: 1.5, minLines: 6, r0: 0.05 });
        lines.forEach((L) => drawClipped(view, L, 0, 0, a, { color: '--fline', width: 1.2, alpha: 0.85 }));
      }
      /* esfera metálica */
      const cx = view.X(0), cy = view.Y(0), R = a * view.s;
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, EM.col('--surface'));
      g.addColorStop(1, EM.col('--surface-3'));
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.fillStyle = g;
      ctx.fill();
      /* banda de carga inducida */
      const N = 180;
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * 2 * Math.PI, t1 = ((i + 1) / N) * 2 * Math.PI;
        const s = sig((t0 + t1) / 2) / smax;
        ctx.beginPath();
        ctx.arc(cx, cy, R + 3, -t0, -t1, true);
        ctx.strokeStyle = EM.rgbStr(EM.cmap.diverging(s));
        ctx.lineWidth = 7;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.strokeStyle = EM.col('--ink-2');
      ctx.lineWidth = 1.2;
      ctx.stroke();
      /* signos */
      for (let i = 0; i < 28; i++) {
        const th = (i / 28) * 2 * Math.PI;
        const s = sig(th) / smax;
        if (Math.abs(s) < 0.12) continue;
        const rr = R - 12;
        const x = cx + rr * Math.cos(th), y = cy - rr * Math.sin(th);
        const L = 3 + 3.5 * Math.sqrt(Math.abs(s));
        ctx.strokeStyle = EM.col(s > 0 ? '--pos' : '--neg');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
        if (s > 0) { ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); }
        ctx.stroke();
      }
      /* tierra */
      if (step === 2) {
        const gx = cx, gy = cy + R, gy2 = view.Y(-2.0);
        ctx.strokeStyle = EM.col('--ink');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy); ctx.lineTo(gx, gy2);
        for (let j = 0; j < 3; j++) { const w = 16 - j * 5; ctx.moveTo(gx - w, gy2 + j * 5); ctx.lineTo(gx + w, gy2 + j * 5); }
        ctx.stroke();
        EM.text(ctx, 'tierra', gx + 20, gy2 + 4, { size: 11.5, color: '--ink-2', halo: true });
      }
      /* varilla */
      if (step !== 3) {
        const X = view.X(D), Y = view.Y(0);
        ctx.strokeStyle = EM.col('--c4');
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(X + 10, Y + 4);
        ctx.lineTo(view.X(D + 1.6), view.Y(-1.1));
        ctx.stroke();
        EM.draw.charge(ctx, X, Y, Q, { r: 12, label: 'Q' });
      }
      EM.text(ctx, 'a', cx + 6, cy - 6, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * 0.7, cy - R * 0.7); ctx.stroke(); ctx.restore();
      /* integrales 3D sobre la esfera: Q_neg y Q_pos (en nC) */
      let qn = 0, qp = 0;
      const n = 800;
      for (let i = 0; i < n; i++) {
        const th = ((i + 0.5) / n) * Math.PI;
        /* σ en nC/a², con 4π incluido: carga del anillo = σ/(4π)·2π a² sinθ dθ */
        const dq = (sig(th) / (4 * Math.PI)) * 2 * Math.PI * a * a * Math.sin(th) * (Math.PI / n);
        if (dq < 0) qn += dq; else qp += dq;
      }
      const stTxt = ['', 'Varilla cerca; esfera aislada', 'Varilla cerca; esfera conectada a tierra', 'Tierra desconectada; varilla retirada'][step];
      sim.set('st', stTxt);
      sim.set('qs', EM.fix(qn + qp, 2) + ' nC');
      sim.set('qn', EM.fix(qn, 2) + ' nC');
      sim.set('qp', EM.fix(qp, 2) + ' nC');
    });
  });

  /* ======================================================================
     4.2 Fuerza entre dos cargas
     ====================================================================== */
  EM.defineSim('coulomb-two', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 1.9 });
    sim.group('Cargas');
    sim.slider('q1', { label: '<i>q</i><sub>1</sub>', min: -10, max: 10, step: 0.5, value: 4, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('q2', { label: '<i>q</i><sub>2</sub>', min: -10, max: 10, step: 0.5, value: -2, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('r', { label: 'Separación <i>r</i>', min: 1, max: 100, value: 20, log: true, step: 0.1, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.check('log', { label: 'Gráfica en escala logarítmica', value: true });
    sim.out('F', '|<b>F</b>|', { hl: true });
    sim.out('type', 'Tipo');
    sim.out('F21', '<b>F</b><sub>21</sub> (sobre <i>q</i><sub>2</sub>)');
    sim.out('F12', '<b>F</b><sub>12</sub> (sobre <i>q</i><sub>1</sub>)');
    sim.out('ratio', '<i>F</i>(<i>r</i>) / <i>F</i>(2<i>r</i>)');
    sim.onDraw(() => {
      const { q1, q2, r } = sim.p;
      const F = (k * q1 * uC * q2 * uC) / Math.pow(r * cm, 2);
      /* esquema */
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x1 = w * 0.28, x2 = w * 0.72, y = h * 0.52;
      ctx.strokeStyle = EM.col('--grid-2');
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke();
      ctx.setLineDash([]);
      EM.text(ctx, 'r = ' + EM.fix(r, 1) + ' cm', (x1 + x2) / 2, y - 16, { size: 12, mono: true, color: '--ink-2', align: 'center', halo: true });
      const Fa = Math.abs(F);
      const L = F === 0 ? 0 : M.clamp(34 * (Math.log10(Fa / 1e-4) + 0.3), 10, w * 0.2);
      const dir = Math.sign(F); /* + repulsión */
      if (L > 0) {
        EM.draw.arrow(ctx, x2, y, x2 + dir * L, y, { color: '--accent', width: 3.2, head: 12 });
        EM.draw.arrow(ctx, x1, y, x1 - dir * L, y, { color: '--accent', width: 3.2, head: 12 });
        EM.text(ctx, 'F₂₁', x2 + dir * L * 0.55, y + 26, { size: 13, weight: 700, color: '--accent', align: 'center', halo: true });
        EM.text(ctx, 'F₁₂', x1 - dir * L * 0.55, y + 26, { size: 13, weight: 700, color: '--accent', align: 'center', halo: true });
      }
      EM.draw.charge(ctx, x1, y, q1, { r: 9 + 1.3 * Math.sqrt(Math.abs(q1)) * 2 });
      EM.draw.charge(ctx, x2, y, q2, { r: 9 + 1.3 * Math.sqrt(Math.abs(q2)) * 2 });
      EM.text(ctx, 'q₁', x1, y - 28, { size: 13, italic: true, family: EM.FONT_MATH, align: 'center', halo: true });
      EM.text(ctx, 'q₂', x2, y - 28, { size: 13, italic: true, family: EM.FONT_MATH, align: 'center', halo: true });
      EM.text(ctx, 'longitud de flechas en escala logarítmica', w - 10, h - 8, { size: 10.5, color: '--ink-3', align: 'right' });
      /* gráfica */
      EM.draw.clear(cp);
      const c = Math.abs(k * q1 * uC * q2 * uC);
      const lg = sim.p.log;
      let o;
      if (lg) {
        const Fmin = c > 0 ? c / 1 : 1e-3, Fmax = c > 0 ? c / 1e-4 : 1;
        o = { xmin: 1, xmax: 100, ymin: Math.max(1e-6, Fmin * 0.5), ymax: Fmax * 2, xlog: true, ylog: true };
      } else {
        o = { xmin: 0, xmax: 100, ymin: 0, ymax: c > 0 ? c / Math.pow(0.05, 2) : 1 };
      }
      const pl = new EM.Plot(cp.ctx, Object.assign({ x: 0, y: 0, w: cp.w, h: cp.h, xlabel: 'r (cm)', ylabel: '|F| (N)', ml: 62 }, o));
      pl.frame();
      if (c > 0) {
        pl.fn((rr) => c / Math.pow(rr * cm, 2), { color: '--c1', width: 2.2, from: lg ? 1 : 0.5 });
        pl.dot(r, Math.abs(F), { color: '--accent', r: 5.5, label: EM.si(Math.abs(F), 'N'), mono: true });
        if (r * 2 <= 100) pl.dot(2 * r, Math.abs(F) / 4, { color: '--c3', r: 4.5, label: '2r → F/4', mono: false });
        if (lg) pl.label(3, c / Math.pow(3 * cm, 2) * 3, 'pendiente −2', { color: '--c1' });
      } else pl.label(40, lg ? 0.01 : 0.5, 'Una de las cargas es nula: F = 0', { color: '--ink-2' });
      sim.set('F', EM.si(Math.abs(F), 'N'));
      sim.set('type', F > 0 ? 'repulsión' : F < 0 ? 'atracción' : '—');
      sim.set('F21', EM.si(F, 'N') + ' x̂');
      sim.set('F12', EM.si(-F, 'N') + ' x̂');
      sim.set('ratio', F !== 0 ? '4.00' : '—');
    });
  });

  /* ======================================================================
     4.3 Superposición de fuerzas
     ====================================================================== */
  EM.defineSim('coulomb-superposition', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -12, xmax: 12, ymin: -8, ymax: 8 });
    const src = [{ x: -5, y: 0, q: 3, c: '--c1' }, { x: 5, y: 2, q: -2, c: '--c3' }, { x: 1, y: -5, q: 1, c: '--c5' }];
    const test = { x: 0, y: 3.5, q: 1 };
    sim.group('Cargas fuente');
    src.forEach((s, i) => sim.slider('q' + (i + 1), { label: `<i>q</i><sub>${i + 1}</sub>`, min: -5, max: 5, step: 0.5, value: s.q, unit: 'µC', fmt: (v) => EM.fix(v, 1), onInput: (v) => { s.q = v; } }));
    sim.group('Carga de prueba');
    sim.slider('q0', { label: '<i>q</i><sub>0</sub>', min: -2, max: 2, step: 0.1, value: 1, unit: 'µC', fmt: (v) => EM.fix(v, 1), onInput: (v) => { test.q = v; } });
    sim.check('tip', { label: 'Construcción punta con cola', value: true });
    sim.check('fld', { label: 'Dirección del campo de fondo', value: false });
    for (let i = 0; i < 3; i++) sim.out('F' + i, `|<b>F</b><sub>0${i + 1}</sub>|`);
    sim.outSep();
    sim.out('Fx', '<i>F<sub>x</sub></i>');
    sim.out('Fy', '<i>F<sub>y</sub></i>');
    sim.out('Fm', '|<b>F</b>| neta', { hl: true });
    sim.out('Fa', 'Ángulo');
    sim.hint('Arrastra cualquier carga · posiciones en cm', cv);
    const all = () => [...src, test];
    const pick = (x, y) => { const a = all(); for (let i = a.length - 1; i >= 0; i--) if (Math.hypot(view.X(a[i].x) - x, view.Y(a[i].y) - y) < 16) return a[i]; return null; };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (o, x, y) => { o.x = M.clamp(view.wx(x), view.x0 + 0.5, view.x1 - 0.5); o.y = M.clamp(view.wy(y), view.y0 + 0.5, view.y1 - 0.5); sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.legend([{ color: '--c1', label: '<b>F</b><sub>01</sub>' }, { color: '--c3', label: '<b>F</b><sub>02</sub>' }, { color: '--c5', label: '<b>F</b><sub>03</sub>' }, { color: '--accent', label: 'fuerza neta' }]);
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      if (sim.p.fld) {
        const ch = src.filter((s) => s.q !== 0);
        EM.field.arrows(view, (x, y) => EM.phys2.E(ch, x, y), { spacing: 30, mode: 'dir', color: '--c6', width: 1, decades: 2, skip: (x, y) => ch.some((c) => Math.hypot(x - c.x, y - c.y) < 0.8) });
      }
      const Fs = src.map((s) => {
        if (s.q === 0) return [0, 0];
        const dx = (test.x - s.x) * cm, dy = (test.y - s.y) * cm, r = Math.hypot(dx, dy);
        const f = (k * s.q * uC * test.q * uC) / (r * r * r);
        return [f * dx, f * dy];
      });
      const Fn = Fs.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      const mags = Fs.map((f) => Math.hypot(f[0], f[1]));
      const scale = 120 / Math.max(1e-30, ...mags, Math.hypot(Fn[0], Fn[1]));
      const X0 = view.X(test.x), Y0 = view.Y(test.y);
      let tx = X0, ty = Y0;
      Fs.forEach((f, i) => {
        if (mags[i] === 0) return;
        EM.draw.arrow(ctx, X0, Y0, X0 + f[0] * scale, Y0 - f[1] * scale, { color: src[i].c, width: 2.2, head: 10 });
        if (sim.p.tip) {
          EM.draw.arrow(ctx, tx, ty, tx + f[0] * scale, ty - f[1] * scale, { color: src[i].c, width: 1.4, head: 8, dash: [5, 3], alpha: 0.75 });
          tx += f[0] * scale; ty -= f[1] * scale;
        }
      });
      EM.draw.arrow(ctx, X0, Y0, X0 + Fn[0] * scale, Y0 - Fn[1] * scale, { color: '--accent', width: 4, head: 14 });
      src.forEach((s, i) => { if (s.q !== 0) EM.draw.charge(ctx, view.X(s.x), view.Y(s.y), s.q, { r: 11, label: `q${'₁₂₃'[i]}` }); else { ctx.beginPath(); ctx.arc(view.X(s.x), view.Y(s.y), 8, 0, 7); ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]); } });
      ctx.beginPath();
      ctx.arc(X0, Y0, 9, 0, 7);
      ctx.fillStyle = EM.col('--gold');
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = EM.col('--canvas'); ctx.stroke();
      EM.text(ctx, 'q₀', X0 + 12, Y0 + 18, { size: 13, italic: true, family: EM.FONT_MATH, halo: true });
      mags.forEach((m, i) => sim.set('F' + i, EM.si(m, 'N')));
      sim.set('Fx', EM.si(Fn[0], 'N'));
      sim.set('Fy', EM.si(Fn[1], 'N'));
      sim.set('Fm', EM.si(Math.hypot(Fn[0], Fn[1]), 'N'));
      sim.set('Fa', EM.fix(M.deg(Math.atan2(Fn[1], Fn[0])), 1) + '°');
    });
  });

  /* ======================================================================
     4.4 Equilibrio en una recta
     ====================================================================== */
  EM.defineSim('line-equilibrium', function (sim) {
    const cv = sim.canvas({ aspect: 4.2, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 1.9 });
    sim.group('Cargas fijas');
    sim.slider('q1', { label: '<i>q</i><sub>1</sub> en <i>x</i> = 0', min: -8, max: 8, step: 0.5, value: 4, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('q2', { label: '<i>q</i><sub>2</sub> en <i>x</i> = <i>d</i>', min: -8, max: 8, step: 0.5, value: 1, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('d', { label: 'Separación <i>d</i>', min: 10, max: 50, step: 1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.group('Carga de prueba');
    sim.seg('s0', { label: 'Signo de <i>q</i><sub>0</sub> (|<i>q</i><sub>0</sub>| = 1 µC)', options: [[1, 'Positiva'], [-1, 'Negativa']], value: 1 });
    sim.slider('x0', { label: 'Posición <i>x</i><sub>0</sub>', min: -30, max: 90, step: 0.5, value: 12, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.out('F', '<i>F<sub>x</sub></i> en <i>x</i><sub>0</sub>', { hl: true });
    sim.out('eq', 'Equilibrio(s)');
    sim.out('stab', 'Estabilidad en la recta');
    const Fx = (x, p) => {
      const d = p.d, q0 = p.s0;
      let f = 0;
      const r1 = x * cm, r2 = (x - d) * cm;
      if (p.q1) f += (k * p.q1 * uC * q0 * uC * Math.sign(r1)) / (r1 * r1);
      if (p.q2) f += (k * p.q2 * uC * q0 * uC * Math.sign(r2)) / (r2 * r2);
      return f;
    };
    const roots = (p) => {
      const d = p.d, res = [];
      const regions = [[-40 * d, -1e-4 * d], [1e-4 * d, d - 1e-4 * d], [d + 1e-4 * d, 40 * d]];
      for (const [a, b] of regions) {
        const n = 4000;
        let xa = a, fa = Fx(a, p);
        for (let i = 1; i <= n; i++) {
          /* muestreo más denso cerca de las cargas */
          const t = i / n;
          const xb = a + (b - a) * (a < 0 ? 1 - Math.pow(1 - t, 3) : b > d ? Math.pow(t, 3) : t);
          const fb = Fx(xb, p);
          if (fa * fb < 0) {
            const x = M.bisect((x) => Fx(x, p), xa, xb, 1e-9);
            const h = 1e-4 * d;
            const slope = (Fx(x + h, p) - Fx(x - h, p)) / (2 * h);
            res.push({ x, stable: slope < 0 });
          }
          xa = xb; fa = fb;
        }
      }
      return res;
    };
    sim.onDraw(() => {
      const p = sim.p, d = p.d;
      const xmin = -30, xmax = 90;
      /* esquema */
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const X = (x) => 54 + ((x - xmin) / (xmax - xmin)) * (w - 70);
      const y = h * 0.55;
      ctx.strokeStyle = EM.col('--axis');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(xmin), y); ctx.lineTo(X(xmax), y); ctx.stroke();
      ctx.fillStyle = EM.col('--ink-3');
      ctx.font = `10.5px ${EM.FONT_MONO}`;
      ctx.textAlign = 'center';
      for (let t = -30; t <= 90; t += 10) { ctx.fillRect(X(t) - 0.5, y - 3, 1, 6); ctx.fillText(String(t).replace('-', '−'), X(t), y + 16); }
      EM.text(ctx, 'x (cm)', X(xmax), y - 10, { size: 11, color: '--ink-3', align: 'right' });
      const eqs = roots(p);
      eqs.forEach((e) => {
        if (e.x < xmin || e.x > xmax) return;
        ctx.beginPath(); ctx.arc(X(e.x), y, 5, 0, 7);
        ctx.fillStyle = EM.col(e.stable ? '--c3' : '--c2'); ctx.fill();
      });
      if (p.q1) EM.draw.charge(ctx, X(0), y, p.q1, { r: 11 });
      if (p.q2) EM.draw.charge(ctx, X(d), y, p.q2, { r: 11 });
      EM.text(ctx, 'q₁', X(0), y - 18, { size: 12, italic: true, family: EM.FONT_MATH, align: 'center' });
      EM.text(ctx, 'q₂', X(d), y - 18, { size: 12, italic: true, family: EM.FONT_MATH, align: 'center' });
      const F0 = Fx(p.x0, p);
      const Lf = M.clamp(30 * (Math.log10(Math.abs(F0) / 1e-3) + 0.2), 6, 90) * Math.sign(F0);
      if (isFinite(F0) && F0 !== 0) EM.draw.arrow(ctx, X(p.x0), y, X(p.x0) + Lf, y, { color: '--accent', width: 3, head: 11 });
      ctx.beginPath(); ctx.arc(X(p.x0), y, 7, 0, 7);
      ctx.fillStyle = EM.col('--gold'); ctx.fill();
      EM.text(ctx, 'q₀', X(p.x0), y - 14, { size: 12, italic: true, family: EM.FONT_MATH, align: 'center', halo: true });
      /* gráfica */
      EM.draw.clear(cp);
      const Fref = Math.max(Math.abs(Fx(-0.5 * d, p)), Math.abs(Fx(0.5 * d, p)), Math.abs(Fx(1.5 * d, p)), 1e-3);
      const ym = Fref * 3;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin, xmax, ymin: -ym, ymax: ym, xlabel: 'x (cm)', ylabel: 'F_{x} (N)' });
      pl.frame();
      pl.vline(0, { color: '--ink-3', dash: [2, 3] });
      pl.vline(d, { color: '--ink-3', dash: [2, 3] });
      pl.fn((x) => Fx(x, p), { color: '--c1', width: 2.2, breakJumps: true, n: 1600 });
      eqs.forEach((e) => { if (e.x > xmin && e.x < xmax) pl.dot(e.x, 0, { color: e.stable ? '--c3' : '--c2', r: 5.5, label: e.stable ? 'estable' : 'inestable', dy: -10 }); });
      if (isFinite(F0)) pl.dot(p.x0, M.clamp(F0, -ym, ym), { color: '--gold', r: 5 });
      pl.label(xmax - 2, ym * 0.85, 'F_{x} > 0: hacia +x', { align: 'right', color: '--ink-3' });
      sim.set('F', isFinite(F0) ? EM.si(F0, 'N') : '—');
      sim.set('eq', eqs.length ? eqs.map((e) => EM.fix(e.x, 2) + ' cm').join(', ') : 'ninguno');
      sim.set('stab', eqs.length ? eqs.map((e) => (e.stable ? 'estable' : 'inestable')).join(', ') : '—');
    });
  });

  /* ======================================================================
     4.5 Fuerza de una varilla cargada
     ====================================================================== */
  EM.defineSim('rod-force', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -30, xmax: 30, ymin: -14, ymax: 26 });
    sim.group('Varilla');
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 4, max: 40, step: 1, value: 24, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Carga total <i>Q</i>', min: -5, max: 5, step: 0.5, value: 3, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.group('Carga puntual');
    sim.slider('q', { label: '<i>q</i>', min: -2, max: 2, step: 0.1, value: 1, unit: 'µC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('nseg', { label: 'Elementos mostrados', min: 2, max: 20, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('F', '|<b>F</b>| (integral)', { hl: true });
    sim.out('Fc', '(<i>F<sub>x</sub></i>, <i>F<sub>y</sub></i>)');
    sim.out('Fp', '|<b>F</b>| si <i>Q</i> fuera puntual');
    sim.out('rat', 'Cociente');
    sim.hint('Arrastra la carga q', cv);
    const P = { x: 6, y: 9 };
    EM.pointer(cv, {
      down: (x, y) => (Math.hypot(view.X(P.x) - x, view.Y(P.y) - y) < 16 ? 1 : null),
      move: (_, x, y) => { P.x = M.clamp(view.wx(x), view.x0 + 1, view.x1 - 1); P.y = M.clamp(view.wy(y), view.y0 + 1, view.y1 - 1); if (Math.abs(P.y) < 1.2 && Math.abs(P.x) < sim.p.L / 2 + 1.2) P.y = P.y >= 0 ? 1.2 : -1.2; sim.redraw(); },
      hover: (x, y) => Math.hypot(view.X(P.x) - x, view.Y(P.y) - y) < 16
    });
    const force = (x0, x1, Qseg) => {
      /* fuerza de un tramo uniforme [x0,x1] con carga Qseg sobre q en P (N) */
      const n = 200, lam = Qseg / (x1 - x0);
      let fx = 0, fy = 0;
      for (let i = 0; i < n; i++) {
        const xs = x0 + ((x1 - x0) * (i + 0.5)) / n;
        const dx = (P.x - xs) * cm, dy = P.y * cm, r = Math.hypot(dx, dy);
        const dq = lam * ((x1 - x0) / n);
        const f = (k * dq * uC * sim.p.q * uC) / (r * r * r);
        fx += f * dx; fy += f * dy;
      }
      return [fx, fy];
    };
    sim.onDraw(() => {
      const p = sim.p, L = p.L, n = Math.round(p.nseg);
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      const cols = ['--c1', '--c3', '--c5', '--c4', '--c2', '--c6'];
      const parts = [];
      for (let i = 0; i < n; i++) {
        const a = -L / 2 + (L * i) / n, b = a + L / n;
        parts.push({ a, b, F: force(a, b, p.Q / n), c: cols[i % cols.length] });
      }
      const Ft = parts.reduce((s, q) => [s[0] + q.F[0], s[1] + q.F[1]], [0, 0]);
      /* varilla */
      parts.forEach((q) => {
        ctx.strokeStyle = EM.col(q.c);
        ctx.lineWidth = 9;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(view.X(q.a) + 1, view.Y(0));
        ctx.lineTo(view.X(q.b) - 1, view.Y(0));
        ctx.stroke();
        /* línea desde el centro del elemento a q */
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = EM.alpha(q.c, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(view.X((q.a + q.b) / 2), view.Y(0)); ctx.lineTo(view.X(P.x), view.Y(P.y)); ctx.stroke();
        ctx.restore();
      });
      const sg = p.Q >= 0 ? '+' : '−';
      for (let i = 0; i < Math.min(n * 2, 24); i++) {
        const xx = -L / 2 + (L * (i + 0.5)) / Math.min(n * 2, 24);
        EM.text(ctx, p.Q === 0 ? '' : sg, view.X(xx), view.Y(0) + 1, { size: 11, weight: 700, color: '#ffffff', align: 'center', baseline: 'middle' });
      }
      const X0 = view.X(P.x), Y0 = view.Y(P.y);
      const sc = 150 / (Math.hypot(...Ft) || 1);
      EM.draw.arrow(ctx, X0, Y0, X0 + Ft[0] * sc, Y0 - Ft[1] * sc, { color: '--accent', width: 5, head: 15, alpha: 0.9 });
      let cx0 = X0, cy0 = Y0;
      parts.forEach((q) => {
        const nx = cx0 + q.F[0] * sc, ny = cy0 - q.F[1] * sc;
        EM.draw.arrow(ctx, cx0, cy0, nx, ny, { color: q.c, width: 2, head: 8 });
        cx0 = nx; cy0 = ny;
      });
      ctx.beginPath(); ctx.arc(X0, Y0, 8, 0, 7);
      ctx.fillStyle = EM.col('--gold'); ctx.fill();
      EM.text(ctx, 'q', X0 + 10, Y0 + 16, { size: 13, italic: true, family: EM.FONT_MATH, halo: true });
      const r = Math.hypot(P.x, P.y) * cm;
      const Fp = Math.abs((k * p.Q * uC * p.q * uC) / (r * r));
      const Fm = Math.hypot(...Ft);
      sim.set('F', EM.si(Fm, 'N'));
      sim.set('Fc', `(${EM.si(Ft[0], 'N')}, ${EM.si(Ft[1], 'N')})`);
      sim.set('Fp', EM.si(Fp, 'N'));
      sim.set('rat', Fp > 0 ? EM.fix(Fm / Fp, 4) : '—');
    });
  });
})();
