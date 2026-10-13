/* Capítulo 1 — Álgebra vectorial */
(function () {
  'use strict';
  const EM = window.EM, V = EM.V, M = EM.M;
  const vlab = (ctx, s, x, y, col, o = {}) => EM.text(ctx, s, x, y, Object.assign({ size: 15, weight: 700, family: EM.FONT_MATH, color: col, halo: true, align: 'center', baseline: 'middle' }, o));
  const fmtVec = (v, d = 2) => '(' + v.map((c) => EM.fix(c, d)).join(', ') + ')';

  /* ---------- 1.1 Suma y resta en el plano ---------- */
  EM.defineSim('vec-sum2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -6, xmax: 6, ymin: -4, ymax: 4 });
    const A = [3, 1.5], B = [1, 2.5];
    sim.group('Operación');
    sim.seg('op', { options: [['sum', 'A + B'], ['dif', 'A − B']], value: 'sum' });
    sim.check('par', { label: 'Construcción del paralelogramo', value: true });
    sim.check('comp', { label: 'Mostrar componentes del resultado', value: true });
    sim.check('snap', { label: 'Ajustar a la cuadrícula (0.5)', value: true });
    sim.out('A', '<b>A</b>');
    sim.out('B', '<b>B</b>');
    sim.out('R', 'Resultado', { hl: true });
    sim.out('Rm', '|Resultado|');
    sim.out('Rang', 'Ángulo con +x');
    sim.outSep();
    sim.out('dot', '<b>A</b>·<b>B</b>');
    sim.out('crz', '(<b>A</b>×<b>B</b>)<sub>z</sub>');
    sim.hint('Arrastra los extremos de A y B', cv);
    let drag = null;
    const tip = (v) => [view.X(v[0]), view.Y(v[1])];
    EM.pointer(cv, {
      down: (x, y) => {
        for (const v of [A, B]) { const t = tip(v); if (Math.hypot(t[0] - x, t[1] - y) < 16) return v; }
        return null;
      },
      move: (v, x, y) => {
        let wx = M.clamp(view.wx(x), view.x0 + 0.2, view.x1 - 0.2), wy = M.clamp(view.wy(y), view.y0 + 0.2, view.y1 - 0.2);
        if (sim.p.snap) { wx = Math.round(wx * 2) / 2; wy = Math.round(wy * 2) / 2; }
        v[0] = wx; v[1] = wy;
        drag = v;
        sim.redraw();
      },
      up: () => { drag = null; },
      hover: (x, y) => [A, B].some((v) => { const t = tip(v); return Math.hypot(t[0] - x, t[1] - y) < 16; })
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x', ylabel: 'y' });
      const ctx = cv.ctx;
      const O = [view.X(0), view.Y(0)];
      const dif = sim.p.op === 'dif';
      const R = dif ? [A[0] - B[0], A[1] - B[1]] : [A[0] + B[0], A[1] + B[1]];
      const cA = EM.col('--c1'), cB = EM.col('--c2'), cR = EM.col('--accent');
      if (sim.p.par) {
        if (!dif) {
          EM.draw.arrow(ctx, view.X(A[0]), view.Y(A[1]), view.X(R[0]), view.Y(R[1]), { color: cB, width: 1.4, dash: [5, 4], alpha: 0.7 });
          EM.draw.arrow(ctx, view.X(B[0]), view.Y(B[1]), view.X(R[0]), view.Y(R[1]), { color: cA, width: 1.4, dash: [5, 4], alpha: 0.7 });
        } else {
          /* −B desde el extremo de A y A−B trasladado desde el extremo de B */
          EM.draw.arrow(ctx, O[0], O[1], view.X(-B[0]), view.Y(-B[1]), { color: cB, width: 1.4, dash: [5, 4], alpha: 0.7 });
          EM.text(ctx, '−B', view.X(-B[0] * 1.08), view.Y(-B[1] * 1.08) - 10, { size: 13, weight: 700, family: EM.FONT_MATH, color: cB, halo: true, align: 'center' });
          EM.draw.arrow(ctx, view.X(B[0]), view.Y(B[1]), view.X(A[0]), view.Y(A[1]), { color: cR, width: 1.6, dash: [5, 4], alpha: 0.8 });
          EM.draw.arrow(ctx, view.X(A[0]), view.Y(A[1]), view.X(R[0]), view.Y(R[1]), { color: cB, width: 1.2, dash: [3, 4], alpha: 0.55 });
        }
      }
      if (sim.p.comp) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = cR;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(view.X(R[0]), view.Y(R[1])); ctx.lineTo(view.X(R[0]), view.Y(0));
        ctx.moveTo(view.X(R[0]), view.Y(R[1])); ctx.lineTo(view.X(0), view.Y(R[1]));
        ctx.stroke();
        ctx.restore();
        EM.draw.arrow(ctx, O[0], O[1], view.X(R[0]), O[1], { color: cR, width: 3, alpha: 0.45 });
        EM.draw.arrow(ctx, O[0], O[1], O[0], view.Y(R[1]), { color: cR, width: 3, alpha: 0.45 });
        EM.text(ctx, 'R_x = ' + EM.fix(R[0], 1), view.X(R[0] / 2), O[1] + (R[1] >= 0 ? 16 : -10), { size: 11.5, mono: true, color: cR, halo: true, align: 'center' });
        EM.text(ctx, 'R_y = ' + EM.fix(R[1], 1), O[0] + (R[0] >= 0 ? -8 : 8), view.Y(R[1] / 2), { size: 11.5, mono: true, color: cR, halo: true, align: R[0] >= 0 ? 'right' : 'left', baseline: 'middle' });
      }
      EM.draw.arrow(ctx, O[0], O[1], view.X(R[0]), view.Y(R[1]), { color: cR, width: 3.2, head: 13 });
      EM.draw.arrow(ctx, O[0], O[1], view.X(A[0]), view.Y(A[1]), { color: cA, width: 2.6, head: 12 });
      EM.draw.arrow(ctx, O[0], O[1], view.X(B[0]), view.Y(B[1]), { color: cB, width: 2.6, head: 12 });
      const lab = (v, s, c) => { const L = Math.hypot(v[0], v[1]) || 1; vlab(ctx, s, view.X(v[0]) + (v[0] / L) * 16, view.Y(v[1]) - (v[1] / L) * 16, c); };
      lab(A, 'A', cA); lab(B, 'B', cB); lab(R, dif ? 'A−B' : 'A+B', cR);
      for (const v of [A, B]) {
        ctx.beginPath();
        ctx.arc(view.X(v[0]), view.Y(v[1]), drag === v ? 7 : 5, 0, 7);
        ctx.fillStyle = EM.alpha(v === A ? cA : cB, 0.25);
        ctx.fill();
      }
      const ang = (v) => EM.fix(M.deg(Math.atan2(v[1], v[0])), 1) + '°';
      sim.set('A', fmtVec(A, 1));
      sim.set('B', fmtVec(B, 1));
      sim.set('R', fmtVec(R, 1));
      sim.set('Rm', EM.fix(Math.hypot(R[0], R[1]), 3));
      sim.set('Rang', ang(R));
      sim.set('dot', EM.fix(A[0] * B[0] + A[1] * B[1], 2));
      sim.set('crz', EM.fix(A[0] * B[1] - A[1] * B[0], 2));
    });
  });

  /* ---------- 1.2 Productos escalar y vectorial en 3D ---------- */
  EM.defineSim('vec-products3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new EM.View3D(sim, cv, { radius: 4.2, az: M.rad(30), el: M.rad(22) });
    sim.group('Vector A');
    sim.slider('ax', { label: '<i>A<sub>x</sub></i>', min: -3, max: 3, step: 0.1, value: 2.2, fmt: (v) => EM.fix(v, 1) });
    sim.slider('ay', { label: '<i>A<sub>y</sub></i>', min: -3, max: 3, step: 0.1, value: 0.4, fmt: (v) => EM.fix(v, 1) });
    sim.slider('az', { label: '<i>A<sub>z</sub></i>', min: -3, max: 3, step: 0.1, value: 0.6, fmt: (v) => EM.fix(v, 1) });
    sim.group('Vector B');
    sim.slider('bx', { label: '<i>B<sub>x</sub></i>', min: -3, max: 3, step: 0.1, value: 0.8, fmt: (v) => EM.fix(v, 1) });
    sim.slider('by', { label: '<i>B<sub>y</sub></i>', min: -3, max: 3, step: 0.1, value: 1.8, fmt: (v) => EM.fix(v, 1) });
    sim.slider('bz', { label: '<i>B<sub>z</sub></i>', min: -3, max: 3, step: 0.1, value: 0, fmt: (v) => EM.fix(v, 1) });
    sim.group('Mostrar');
    sim.check('cross', { label: 'Producto vectorial', value: true });
    sim.check('swap', { label: 'Intercambiar orden (<b>B</b>×<b>A</b>)', value: false });
    sim.check('par', { label: 'Paralelogramo (área = |<b>A</b>×<b>B</b>|)', value: true });
    sim.check('proj', { label: 'Proyección de <b>A</b> sobre <b>B</b>', value: true });
    sim.out('dot', '<b>A</b>·<b>B</b>', { hl: true });
    sim.out('ang', 'Ángulo θ');
    sim.out('AB', '<i>AB</i> cos θ');
    sim.out('proj', 'Componente de <b>A</b> sobre <b>B</b>');
    sim.outSep();
    sim.out('cr', '<b>A</b>×<b>B</b>', { hl: true });
    sim.out('crm', '|<b>A</b>×<b>B</b>| = área');
    sim.out('ABs', '<i>AB</i> sen θ');
    sim.out('perp', '(<b>A</b>×<b>B</b>)·<b>A</b>');
    sim.hint('Arrastra para girar la vista', cv);
    sim.legend([{ color: '--c1', label: '<b>A</b>' }, { color: '--c2', label: '<b>B</b>' }, { color: '--c3', label: '<b>A</b>×<b>B</b>' }, { color: '--c4', label: 'proyección' }]);
    sim.onDraw(() => {
      const p = sim.p;
      const A = [p.ax, p.ay, p.az], B = [p.bx, p.by, p.bz];
      const Cx = p.swap ? V.cross(B, A) : V.cross(A, B);
      const a = V.norm(A), b = V.norm(B);
      const dot = V.dot(A, B);
      const th = a > 0 && b > 0 ? Math.acos(M.clamp(dot / (a * b), -1, 1)) : NaN;
      v3.R = M.clamp(Math.max(a, b, V.norm(Cx)) * 1.08, 2.6, 8);
      v3.target = [0, 0, Cx[2] * (p.cross ? 0.35 : 0)];
      v3.begin();
      v3.axes({ len: v3.R * 0.82, neg: v3.R * 0.45 });
      if (p.par && V.norm(V.cross(A, B)) > 1e-6) {
        v3.poly([[0, 0, 0], A, V.add(A, B), B], { fill: '--c3', alpha: 0.22, stroke: '--c3', strokeAlpha: 0.5 });
        v3.line(A, V.add(A, B), { color: '--c2', dash: [4, 4], width: 1, alpha: 0.7 });
        v3.line(B, V.add(A, B), { color: '--c1', dash: [4, 4], width: 1, alpha: 0.7 });
      }
      if (p.proj && b > 1e-9) {
        const ub = V.scale(B, 1 / b);
        const pr = V.scale(ub, V.dot(A, ub));
        v3.line(A, pr, { color: '--c4', dash: [3, 3], width: 1.2, seg: 3 });
        v3.arrow([0, 0, 0], pr, { color: '--c4', width: 4, head: 10, alpha: 0.85 });
      }
      if (a > 0 && b > 0 && isFinite(th) && th > 0.02) {
        /* Arco del ángulo entre A y B */
        const ua = V.scale(A, 1 / a);
        let w = V.sub(V.scale(B, 1 / b), V.scale(ua, Math.cos(th)));
        const wn = V.norm(w);
        if (wn > 1e-6) {
          w = V.scale(w, 1 / wn);
          const r = Math.min(a, b) * 0.32;
          v3.arc([0, 0, 0], ua, w, r, 0, th, { color: '--ink-2', width: 1.3 });
          v3.text(V.comb(r * 1.3 * Math.cos(th / 2), ua, r * 1.3 * Math.sin(th / 2), w), 'θ', { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
        }
      }
      v3.arrow([0, 0, 0], A, { color: '--c1', width: 3, head: 13 });
      v3.arrow([0, 0, 0], B, { color: '--c2', width: 3, head: 13 });
      if (p.cross && V.norm(Cx) > 1e-6) v3.arrow([0, 0, 0], Cx, { color: '--c3', width: 3, head: 13 });
      const lbl = (v, s, c) => { const n = V.norm(v); if (n > 1e-6) v3.text(V.scale(v, 1 + 0.35 / n), s, { size: 15, weight: 700, family: EM.FONT_MATH, color: c }); };
      lbl(A, 'A', '--c1');
      lbl(B, 'B', '--c2');
      if (p.cross) lbl(Cx, p.swap ? 'B×A' : 'A×B', '--c3');
      v3.render();
      const cr = V.cross(A, B);
      sim.set('dot', EM.fix(dot, 3));
      sim.set('ang', isFinite(th) ? EM.fix(M.deg(th), 1) + '°' : '—');
      sim.set('AB', isFinite(th) ? EM.fix(a * b * Math.cos(th), 3) : '—');
      sim.set('proj', b > 0 ? EM.fix(dot / b, 3) : '—');
      sim.set('cr', fmtVec(Cx, 2));
      sim.set('crm', EM.fix(V.norm(cr), 3));
      sim.set('ABs', isFinite(th) ? EM.fix(a * b * Math.sin(th), 3) : '—');
      sim.set('perp', EM.fix(V.dot(cr, A), 3));
    });
  });

  /* ---------- 1.3 Producto triple escalar ---------- */
  EM.defineSim('vec-triple', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new EM.View3D(sim, cv, { radius: 3.6, az: M.rad(28), el: M.rad(24), target: [0.8, 0.8, 0.6] });
    sim.group('A y B en el plano xy');
    sim.slider('a', { label: '|<b>A</b>| (sobre +x)', min: 0.5, max: 3, step: 0.1, value: 2.4, fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: '|<b>B</b>|', min: 0.5, max: 3, step: 0.1, value: 2, fmt: (v) => EM.fix(v, 1) });
    sim.slider('beta', { label: 'Ángulo de <b>B</b> con +x', min: 0, max: 180, step: 1, value: 70, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.group('Vector C');
    sim.slider('cx', { label: '<i>C<sub>x</sub></i>', min: -2.5, max: 2.5, step: 0.1, value: 0.6, fmt: (v) => EM.fix(v, 1) });
    sim.slider('cy', { label: '<i>C<sub>y</sub></i>', min: -2.5, max: 2.5, step: 0.1, value: 0.5, fmt: (v) => EM.fix(v, 1) });
    sim.slider('cz', { label: '<i>C<sub>z</sub></i>', min: -2.5, max: 2.5, step: 0.1, value: 1.6, fmt: (v) => EM.fix(v, 1) });
    sim.check('bxc', { label: 'Mostrar <b>A</b>×<b>B</b>', value: true });
    sim.out('tri', '<b>C</b>·(<b>A</b>×<b>B</b>)', { hl: true });
    sim.out('vol', 'Volumen');
    sim.out('base', 'Área de la base |<b>A</b>×<b>B</b>|');
    sim.out('h', 'Altura (componente de <b>C</b> normal a la base)');
    sim.out('hand', 'Terna (A, B, C)');
    sim.hint('Arrastra para girar la vista', cv);
    sim.onDraw(() => {
      const p = sim.p;
      const A = [p.a, 0, 0];
      const B = [p.b * Math.cos(M.rad(p.beta)), p.b * Math.sin(M.rad(p.beta)), 0];
      const Cv = [p.cx, p.cy, p.cz];
      const AxB = V.cross(A, B);
      const tri = V.dot(Cv, AxB);
      v3.begin();
      v3.axes({ len: 3, neg: 1.2 });
      /* Paralelepípedo: vértices */
      const O = [0, 0, 0];
      const P = (i, j, k) => V.comb(i, A, j, B, k, Cv);
      const faces = [
        [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)],
        [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)],
        [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)],
        [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)],
        [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)],
        [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)]
      ];
      const fc = tri >= 0 ? '--c3' : '--c2';
      faces.forEach((f, i) => v3.poly(f, { fill: i === 0 ? '--c4' : fc, alpha: i === 0 ? 0.3 : 0.14, stroke: fc, strokeAlpha: 0.55 }));
      v3.arrow(O, A, { color: '--c1', width: 3, head: 12 });
      v3.arrow(O, B, { color: '--c2', width: 3, head: 12 });
      v3.arrow(O, Cv, { color: '--c5', width: 3, head: 12 });
      if (p.bxc) {
        const n = V.norm(AxB);
        const s = n > 0 ? Math.min(1, 2.2 / n) : 1;
        v3.arrow(O, V.scale(AxB, s), { color: '--c3', width: 2, head: 10, dash: [5, 3] });
        v3.text(V.scale(AxB, s * 1.12), 'A×B', { size: 13, weight: 700, family: EM.FONT_MATH, color: '--c3' });
        /* Altura */
        if (n > 0) {
          const u = V.scale(AxB, 1 / n);
          const h = V.dot(Cv, u);
          const foot = V.sub(Cv, V.scale(u, h));
          v3.line(foot, Cv, { color: '--ink-2', dash: [3, 3], width: 1.2 });
          v3.text(V.lerp(foot, Cv, 0.5), 'h', { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2', dx: 10 });
        }
      }
      v3.text(V.scale(A, 1.12), 'A', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--c1' });
      v3.text(V.scale(B, 1.14), 'B', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--c2' });
      v3.text(V.scale(Cv, 1.12), 'C', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--c5' });
      v3.render();
      const n = V.norm(AxB);
      sim.set('tri', EM.fix(tri, 3));
      sim.set('vol', EM.fix(Math.abs(tri), 3));
      sim.set('base', EM.fix(n, 3));
      sim.set('h', n > 0 ? EM.fix(tri / n, 3) : '—');
      sim.set('hand', Math.abs(tri) < 1e-6 ? 'coplanares' : tri > 0 ? 'dextrógira' : 'levógira');
    });
  });
})();
