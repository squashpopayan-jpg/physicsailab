/* Capítulo 6 — Ley de Gauss */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* ======================================================================
     6.1 Flujo de un campo uniforme
     ====================================================================== */
  EM.defineSim('flux-surface', function (sim) {
    const c3 = sim.canvas({ aspect: 1.35 });
    const cp = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    const v3 = new EM.View3D(sim, c3, { radius: 2.3, az: rad(28), el: rad(18) });
    sim.group('Superficie');
    sim.seg('mode', { options: [['plane', 'Plana abierta'], ['cube', 'Cubo cerrado']], value: 'plane' });
    sim.slider('th', { label: 'Inclinación <i>θ</i> de <b>n̂</b> respecto a <b>E</b>', min: 0, max: 180, step: 1, value: 40, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('a', { label: 'Lado <i>a</i>', min: 5, max: 20, step: 0.5, value: 14, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: 'Lado <i>b</i> (superficie plana)', min: 5, max: 20, step: 0.5, value: 10, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.group('Campo');
    sim.slider('E', { label: 'Magnitud <i>E</i> (dirección +<i>z</i>)', min: 0, max: 1000, step: 10, value: 500, unit: 'N/C', fmt: (v) => v.toFixed(0) });
    sim.out('A', 'Área');
    sim.out('Ap', 'Área proyectada <i>A</i> cos <i>θ</i>');
    sim.out('phi', 'Flujo Φ', { hl: true });
    sim.hint('Arrastra para girar la vista', c3);
    sim.onDraw(() => {
      const p = sim.p, th = rad(p.th), E = p.E;
      const s = 0.1; /* unidades de mundo por cm */
      v3.begin();
      v3.axes({ len: 2, neg: 1.6 });
      /* flechas del campo */
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
        const x = i * 0.55, y = j * 0.55;
        v3.arrow([x, y, -1.6], [x, y, 1.7], { color: '--efield', width: 1.1, head: 8, alpha: 0.55, seg: 8 });
      }
      v3.text([1.35, 1.35, 1.75], 'E', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--efield' });
      const n = [Math.sin(th), 0, Math.cos(th)], u = [Math.cos(th), 0, -Math.sin(th)], w = [0, 1, 0];
      if (p.mode === 'plane') {
        const A = p.a * s, B = p.b * s;
        const P = (su, sw) => V.comb(su * A / 2, u, sw * B / 2, w);
        const q = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)];
        v3.poly(q, { fill: '--c1', alpha: 0.38, stroke: '--c1', strokeAlpha: 0.9, strokeWidth: 1.4 });
        /* sombra proyectada en z = −1.6 */
        const sh = q.map((pt) => [pt[0], pt[1], -1.6]);
        v3.poly(sh, { fill: '--ink-3', alpha: 0.2, stroke: '--ink-3', strokeAlpha: 0.6, shade: false });
        q.forEach((pt, i) => v3.line(pt, sh[i], { color: '--ink-3', width: 0.8, dash: [2, 3], alpha: 0.6, seg: 4 }));
        v3.arrow([0, 0, 0], V.scale(n, 0.9), { color: '--c1', width: 3, head: 11 });
        v3.text(V.scale(n, 1.08), 'n', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--c1', hat: true });
        if (th > 0.02) {
          v3.arc([0, 0, 0], [0, 0, 1], [1, 0, 0], 0.5, 0, th, { color: '--accent', width: 1.6 });
          v3.text(V.scale([Math.sin(th / 2), 0, Math.cos(th / 2)], 0.66), 'θ', { size: 14, italic: true, family: EM.FONT_MATH, color: '--accent' });
        }
        v3.render();
        const Am = p.a * p.b * 1e-4, phi = E * Am * Math.cos(th);
        sim.set('A', EM.fix(Am * 1e4, 1) + ' cm²');
        sim.set('Ap', EM.fix(Am * Math.cos(th) * 1e4, 1) + ' cm²');
        sim.set('phi', EM.fix(phi, 3) + ' N·m²/C');
        EM.draw.clear(cp);
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 180, ymin: -Math.max(0.1, E * Am) * 1.15, ymax: Math.max(0.1, E * Am) * 1.15, xlabel: 'θ (grados)', ylabel: 'Φ (N·m²/C)', mt: 10, xticks: [0, 30, 60, 90, 120, 150, 180] });
        pl.frame();
        pl.fn((t) => E * Am * Math.cos(rad(t)), { color: '--c1', width: 2.2 });
        pl.dot(p.th, phi, { color: '--accent', r: 5 });
      } else {
        const L = p.a * s;
        const R = (vv) => V.comb(vv[0], u, vv[1], w, vv[2], n);
        const faces = [
          { nrm: [1, 0, 0], name: '+u' }, { nrm: [-1, 0, 0], name: '−u' },
          { nrm: [0, 1, 0], name: '+y' }, { nrm: [0, -1, 0], name: '−y' },
          { nrm: [0, 0, 1], name: '+n' }, { nrm: [0, 0, -1], name: '−n' }
        ];
        let net = 0;
        const fl = [];
        faces.forEach((f) => {
          const nw = R(f.nrm);
          const flux = E * L * L * 1e-2 * (1 / (s * s)) * 1e-2 * nw[2];
          /* área real = (a cm)² */
          const phi = E * Math.pow(p.a * 1e-2, 2) * nw[2];
          net += phi;
          fl.push(phi);
          const c = V.scale(nw, L / 2);
          /* dos vectores tangentes */
          const t1 = Math.abs(f.nrm[0]) ? [0, 1, 0] : [1, 0, 0];
          const t2 = V.cross(f.nrm, t1);
          const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a1, a2]) => V.add(c, R(V.comb(a1 * L / 2, t1, a2 * L / 2, t2))));
          const col = Math.abs(phi) < 1e-9 ? '--ink-3' : phi > 0 ? '--pos' : '--neg';
          v3.poly(q, { fill: col, alpha: 0.28, stroke: col, strokeAlpha: 0.8, strokeWidth: 1.2 });
          v3.arrow(c, V.add(c, V.scale(nw, 0.45)), { color: col, width: 1.6, head: 7 });
          void flux;
        });
        v3.render();
        sim.set('A', EM.fix(6 * p.a * p.a, 1) + ' cm² (6 caras)');
        sim.set('Ap', '—');
        sim.set('phi', 'neto = ' + EM.fix(Math.abs(net) < 1e-12 ? 0 : net, 4) + ' N·m²/C');
        EM.draw.clear(cp);
        const mx = Math.max(0.05, E * Math.pow(p.a * 1e-2, 2)) * 1.2;
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 7, ymin: -mx, ymax: mx, ylabel: 'Φ por cara', mt: 10, xticks: [1, 2, 3, 4, 5, 6], xfmt: (v) => ['', 'cara 1', 'cara 2', 'cara 3', 'cara 4', 'cara 5', 'cara 6'][v] || '' });
        pl.frame();
        fl.forEach((phi, i) => {
          const x0 = pl.X(i + 1 - 0.3), x1 = pl.X(i + 1 + 0.3), y0 = pl.Y(0), y1 = pl.Y(phi);
          cp.ctx.fillStyle = EM.alpha(phi > 0 ? '--pos' : '--neg', 0.7);
          cp.ctx.fillRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
        });
        pl.label(6.8, mx * 0.8, 'suma = 0', { align: 'right', color: '--ink' });
      }
    });
  });

  /* ======================================================================
     6.2 Ley de Gauss con una curva deformable (cargas lineales)
     ====================================================================== */
  EM.defineSim('gauss-2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -6, xmax: 6, ymin: -4, ymax: 4 });
    const lines = [{ x: -1.4, y: 0.6, q: 2 }, { x: 1.6, y: -0.5, q: -1 }, { x: 3.9, y: 2.3, q: 1.5 }];
    const ctrl = [];
    const resetCurve = () => { ctrl.length = 0; for (let i = 0; i < 9; i++) { const a = (2 * Math.PI * i) / 9; ctrl.push([2.6 * Math.cos(a), 2.2 * Math.sin(a)]); } };
    resetCurve();
    sim.group('Densidades lineales de carga');
    lines.forEach((c, i) => sim.slider('l' + i, { label: `<i>λ</i><sub>${i + 1}</sub>`, min: -3, max: 3, step: 0.5, value: c.q, unit: 'nC/m', fmt: (v) => EM.fix(v, 1), onInput: (v) => { c.q = v; } }));
    sim.group('Mostrar');
    sim.check('fl', { label: 'Líneas de campo', value: true });
    sim.check('arr', { label: 'Flujo local sobre la curva', value: true });
    sim.button('Restablecer la curva', resetCurve);
    sim.out('flux', '∮ <b>E</b>·<b>n̂</b> d<i>l</i>', { hl: true });
    sim.out('qenc', '<i>λ</i><sub>enc</sub> / <i>ε</i><sub>0</sub>', { hl: true });
    sim.out('lenc', '<i>λ</i><sub>enc</sub>');
    sim.note('Flujo por unidad de longitud del cilindro gaussiano, en N·m/C (equivale a N·m²/C por metro).');
    sim.hint('Arrastra los puntos de la curva y las cargas', cv);
    const E = (x, y) => { const e = EM.phys2.Eline(lines.filter((c) => c.q !== 0), x, y); return [e[0] * 2 * K.k * 1e-9, e[1] * 2 * K.k * 1e-9]; };
    const curve = () => {
      const n = ctrl.length, out = [];
      for (let i = 0; i < n; i++) {
        const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
        for (let k = 0; k < 40; k++) {
          const t = k / 40, t2 = t * t, t3 = t2 * t;
          out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
        }
      }
      return out;
    };
    const inside = (pts, x, y) => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const pick = (x, y) => {
      for (let i = 0; i < ctrl.length; i++) if (Math.hypot(view.X(ctrl[i][0]) - x, view.Y(ctrl[i][1]) - y) < 12) return { c: i };
      for (let i = 0; i < lines.length; i++) if (Math.hypot(view.X(lines[i].x) - x, view.Y(lines[i].y) - y) < 15) return { l: i };
      return null;
    };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (r, x, y) => {
        const wx = M.clamp(view.wx(x), view.x0 + 0.2, view.x1 - 0.2), wy = M.clamp(view.wy(y), view.y0 + 0.2, view.y1 - 0.2);
        if (r.c !== undefined) ctrl[r.c] = [wx, wy]; else { lines[r.l].x = wx; lines[r.l].y = wy; }
        sim.redraw();
      },
      hover: (x, y) => !!pick(x, y)
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (m)', ylabel: 'y (m)' });
      const ctx = cv.ctx;
      const act = lines.filter((c) => c.q !== 0);
      if (sim.p.fl && act.length) {
        const L = EM.field.chargeLines(view, act, (x, y) => EM.phys2.Eline(act, x, y), { perUnit: 7, r0: 0.08 });
        L.forEach((l) => EM.field.drawLine(view, l, { color: '--fline', width: 1.1, alpha: 0.75 }));
      }
      const pts = curve();
      /* orientación */
      let area = 0;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1;
      let flux = 0;
      const marks = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const nx = sgn * dy, ny = -sgn * dx; /* normal saliente × dl */
        const e = E(mx, my);
        const f = e[0] * nx + e[1] * ny;
        flux += f;
        if (i % 12 === 6) { const L = Math.hypot(dx, dy); marks.push([mx, my, nx / L, ny / L, f / L]); }
      }
      ctx.save();
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(view.X(q[0]), view.Y(q[1])) : ctx.moveTo(view.X(q[0]), view.Y(q[1]))));
      ctx.closePath();
      ctx.fillStyle = EM.alpha('--c1', 0.08);
      ctx.fill();
      ctx.strokeStyle = EM.col('--c1');
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
      if (sim.p.arr) {
        let mm = 1e-12;
        marks.forEach((m) => { mm = Math.max(mm, Math.abs(m[4])); });
        marks.forEach(([x, y, nx, ny, f]) => {
          const L = (Math.abs(f) / mm) * 26;
          if (L < 2) return;
          const X = view.X(x), Y = view.Y(y);
          if (f > 0) EM.draw.arrow(ctx, X, Y, X + nx * L, Y - ny * L, { color: '--pos', width: 2, head: 7 });
          else EM.draw.arrow(ctx, X + nx * L, Y - ny * L, X, Y, { color: '--neg', width: 2, head: 7 });
        });
      }
      ctrl.forEach((c) => { ctx.beginPath(); ctx.arc(view.X(c[0]), view.Y(c[1]), 5, 0, 7); ctx.fillStyle = EM.col('--surface'); ctx.fill(); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.stroke(); });
      let lenc = 0;
      lines.forEach((c, i) => {
        const inn = inside(pts, c.x, c.y);
        if (inn) lenc += c.q;
        if (c.q !== 0) EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 10 + 2 * Math.sqrt(Math.abs(c.q)), label: `λ${'₁₂₃'[i]}${inn ? ' (dentro)' : ''}` });
      });
      sim.set('flux', EM.si(flux, 'N·m/C', 4));
      sim.set('qenc', EM.si((lenc * 1e-9) / K.eps0, 'N·m/C', 4));
      sim.set('lenc', EM.fix(lenc, 1) + ' nC/m');
    });
  });

  /* ======================================================================
     6.3 Superficies gaussianas y E(r)
     ====================================================================== */
  EM.defineSim('gauss-symmetry', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const v3 = new EM.View3D(sim, c3, { radius: 2.1, az: rad(32), el: rad(18) });
    const G = {
      'sph-point': { n: 'Carga puntual', t: 'sph', q: (r) => 1 },
      'sph-shell': { n: 'Cascarón esférico (o esfera conductora)', t: 'sph', q: (r) => (r < 1 ? 0 : 1) },
      'sph-solid': { n: 'Esfera maciza uniforme', t: 'sph', q: (r) => Math.min(r ** 3, 1) },
      'sph-rho': { n: 'Esfera con ρ ∝ r', t: 'sph', q: (r) => Math.min(r ** 4, 1) },
      'sph-thick': { n: 'Cascarón grueso uniforme (R₁ = R/2)', t: 'sph', q: (r) => (r < 0.5 ? 0 : r < 1 ? (r ** 3 - 0.125) / 0.875 : 1) },
      'cyl-line': { n: 'Línea infinita', t: 'cyl', q: (r) => 1 },
      'cyl-solid': { n: 'Cilindro macizo uniforme', t: 'cyl', q: (r) => Math.min(r * r, 1) },
      'cyl-coax': { n: 'Cable coaxial (+λ dentro, −λ fuera)', t: 'cyl', q: (r) => (r < 0.35 ? 0 : r < 1 ? 1 : 0) },
      'pl-plane': { n: 'Plano infinito', t: 'pl', sym: true, E: (x) => Math.sign(x) },
      'pl-slab': { n: 'Lámina gruesa uniforme', t: 'pl', sym: true, E: (x) => (Math.abs(x) < 0.5 ? x / 0.5 : Math.sign(x)) },
      'pl-two': { n: 'Dos planos ±σ (condensador)', t: 'pl', sym: false, E: (x) => (Math.abs(x) < 0.5 ? 2 : 0) }
    };
    sim.group('Distribución de carga');
    sim.select('g', { options: Object.keys(G).map((k) => [k, G[k].n]), value: 'sph-solid', onInput: () => { const t = G[sim.p.g].t; sr.range(t === 'pl' ? -3 : 0.02, 3); if (t !== 'pl' && sim.p.r < 0.02) sr.set(0.6, true); } });
    const sr = sim.slider('r', { label: 'Superficie gaussiana: <i>r</i>/<i>R</i> (o <i>x</i>/<i>d</i>)', min: 0.02, max: 3, step: 0.01, value: 0.6, fmt: f2 });
    sim.out('qenc', 'Carga encerrada', { hl: true });
    sim.out('flux', 'Flujo');
    sim.out('E', 'Campo <i>E</i>', { hl: true });
    sim.note('Unidades: esférica, <i>E</i> en <i>Q</i>/(4π<i>ε</i><sub>0</sub><i>R</i>²); cilíndrica, en <i>λ</i>/(2π<i>ε</i><sub>0</sub><i>R</i>); plana, en <i>σ</i>/(2<i>ε</i><sub>0</sub>).');
    sim.hint('Arrastra para girar', c3);
    const Eof = (g, r) => (g.t === 'pl' ? g.E(r) : g.t === 'sph' ? g.q(r) / (r * r) : g.q(r) / r);
    sim.onDraw(() => {
      const g = G[sim.p.g], r = sim.p.r;
      v3.begin();
      const gw = { color: '--c1', width: 0.9, alpha: 0.75 };
      if (g.t === 'sph') {
        v3.axes({ len: 2.4, neg: 2.0 });
        const k = sim.p.g;
        const sphereMesh = (R, st) => v3.mesh((t, f) => EM.coords.sph2cart(R, t, f), 0, Math.PI, 14, 0, 2 * Math.PI, 28, st);
        if (k === 'sph-point') v3.point([0, 0, 0], { r: 7, color: '--pos', glow: true });
        else if (k === 'sph-shell') sphereMesh(1, { fill: '--pos', alpha: 0.16, wire: '--pos', wireAlpha: 0.35, wireEveryU: 2, wireEveryV: 2 });
        else if (k === 'sph-thick') { sphereMesh(1, { fill: '--pos', alpha: 0.16 }); sphereMesh(0.5, { fill: '--pos', alpha: 0.05, wire: '--pos', wireAlpha: 0.5, wireEveryU: 2, wireEveryV: 2 }); }
        else if (k === 'sph-rho') { sphereMesh(1, { fill: '--pos', alpha: 0.12 }); sphereMesh(0.75, { fill: '--pos', alpha: 0.12 }); sphereMesh(0.45, { fill: '--pos', alpha: 0.06 }); }
        else sphereMesh(1, { fill: '--pos', alpha: 0.22 });
        /* superficie gaussiana (alambre) */
        for (let i = 1; i < 6; i++) { const pts = []; for (let j = 0; j <= 48; j++) pts.push(EM.coords.sph2cart(r, (Math.PI * i) / 6, (2 * Math.PI * j) / 48)); v3.polyline(pts, gw); }
        for (let i = 0; i < 8; i++) { const pts = []; for (let j = 0; j <= 24; j++) pts.push(EM.coords.sph2cart(r, (Math.PI * j) / 24, (Math.PI * i) / 4)); v3.polyline(pts, gw); }
        const E = Eof(g, r), L = M.clamp(E * 0.5, 0, 1.2);
        if (L > 0.02) for (const [t, f] of [[0.001, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [Math.PI / 2, Math.PI], [Math.PI / 2, 1.5 * Math.PI], [Math.PI - 0.001, 0], [Math.PI / 4, Math.PI / 4], [Math.PI / 4, 1.25 * Math.PI], [0.75 * Math.PI, 0.75 * Math.PI], [0.75 * Math.PI, 1.75 * Math.PI]]) {
          const pnt = EM.coords.sph2cart(r, t, f);
          v3.arrow(pnt, V.scale(pnt, 1 + L / r), { color: '--efield', width: 2, head: 8 });
        }
      } else if (g.t === 'cyl') {
        v3.axes({ len: 2.4, neg: 2.0 });
        const k = sim.p.g;
        const cyl = (R, z0, z1, st) => v3.mesh((f, z) => [R * Math.cos(f), R * Math.sin(f), z], 0, 2 * Math.PI, 32, z0, z1, 3, st);
        if (k === 'cyl-line') v3.line([0, 0, -2.2], [0, 0, 2.2], { color: '--pos', width: 4, seg: 10 });
        else if (k === 'cyl-solid') cyl(1, -2.2, 2.2, { fill: '--pos', alpha: 0.2 });
        else { cyl(0.35, -2.2, 2.2, { fill: '--pos', alpha: 0.35 }); cyl(1, -2.2, 2.2, { fill: '--neg', alpha: 0.12 }); }
        for (let i = 0; i <= 2; i++) { const z = -0.8 + 0.8 * i; const pts = []; for (let j = 0; j <= 48; j++) pts.push([r * Math.cos((2 * Math.PI * j) / 48), r * Math.sin((2 * Math.PI * j) / 48), z]); v3.polyline(pts, gw); }
        for (let j = 0; j < 12; j++) { const f = (2 * Math.PI * j) / 12; v3.line([r * Math.cos(f), r * Math.sin(f), -0.8], [r * Math.cos(f), r * Math.sin(f), 0.8], gw); }
        const E = Eof(g, r), L = M.clamp(E * 0.5, 0, 1.2);
        if (L > 0.02) for (let j = 0; j < 8; j++) { const f = (2 * Math.PI * j) / 8; const pnt = [r * Math.cos(f), r * Math.sin(f), 0]; v3.arrow(pnt, V.add(pnt, [L * Math.cos(f), L * Math.sin(f), 0]), { color: '--efield', width: 2, head: 8 }); }
      } else {
        v3.axes({ len: 2.4, neg: 2.0 });
        const k = sim.p.g;
        const plane = (x, col, al) => v3.poly([[x, -1.4, -1.4], [x, 1.4, -1.4], [x, 1.4, 1.4], [x, -1.4, 1.4]], { fill: col, alpha: al, stroke: col, strokeAlpha: 0.7 });
        if (k === 'pl-plane') plane(0, '--pos', 0.3);
        else if (k === 'pl-slab') { plane(-0.5, '--pos', 0.18); plane(0.5, '--pos', 0.18); }
        else { plane(-0.5, '--pos', 0.3); plane(0.5, '--neg', 0.3); }
        const xa = g.sym ? -Math.abs(r) : -2.4, xb = g.sym ? Math.abs(r) : r;
        const rc = 0.55;
        for (const x of [xa, xb]) { const pts = []; for (let j = 0; j <= 40; j++) pts.push([x, rc * Math.cos((2 * Math.PI * j) / 40), rc * Math.sin((2 * Math.PI * j) / 40)]); v3.polyline(pts, gw); }
        for (let j = 0; j < 10; j++) { const f = (2 * Math.PI * j) / 10; v3.line([xa, rc * Math.cos(f), rc * Math.sin(f)], [xb, rc * Math.cos(f), rc * Math.sin(f)], gw); }
        for (const x of [xa, xb]) { const E = g.E(x); if (Math.abs(E) > 0.01) v3.arrow([x, 0, 0], [x + E * 0.5, 0, 0], { color: '--efield', width: 2.2, head: 8 }); }
      }
      v3.render();
      /* gráfica */
      EM.draw.clear(cp);
      const pl = g.t === 'pl';
      const xs = pl ? [-3, 3] : [0, 3];
      const ymax = pl ? 2.4 : g.t === 'sph' ? (sim.p.g === 'sph-point' ? 4 : 1.3) : sim.p.g === 'cyl-line' ? 4 : 3.2;
      const plt = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: xs[0], xmax: xs[1], ymin: pl ? -ymax : 0, ymax, xlabel: pl ? 'x / d' : 'r / R', ylabel: 'E' });
      plt.frame();
      if (!pl && sim.p.g !== 'sph-point' && sim.p.g !== 'cyl-line') plt.vline(1, { color: '--ink-3', label: 'R' });
      plt.fn((x) => Eof(g, x), { color: '--efield', width: 2.4, from: pl ? -3 : 0.02, n: 900, breakJumps: false });
      const E = Eof(g, r);
      plt.dot(r, M.clamp(E, -ymax, ymax), { color: '--c1', r: 5.5, label: 'superficie gaussiana' });
      /* lecturas */
      if (g.t === 'sph') {
        const q = g.q(r);
        sim.set('qenc', f3(q) + ' Q');
        sim.set('flux', f3(q) + ' Q/ε₀');
        sim.set('E', f3(E));
      } else if (g.t === 'cyl') {
        const q = g.q(r);
        sim.set('qenc', f3(q) + ' λℓ');
        sim.set('flux', f3(q) + ' λℓ/ε₀');
        sim.set('E', f3(E));
      } else {
        const xa = g.sym ? -Math.abs(r) : -2.4, xb = g.sym ? Math.abs(r) : r;
        /* flujo = (E(xb) − E(xa))·A en unidades de σA/(2ε₀) → q_enc en σA */
        const fl = g.E(xb) - g.E(xa);
        sim.set('qenc', f3(fl / 2) + ' σA');
        sim.set('flux', f3(fl / 2) + ' σA/ε₀');
        sim.set('E', f3(E) + (g.sym ? '' : ' (tapa izquierda en x = −2.4d, E = 0)'));
      }
    });
  });

  /* ======================================================================
     6.4 Conductores: efecto de las puntas (Laplace numérico)
     ====================================================================== */
  EM.defineSim('conductor-tip', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -4, xmax: 4, ymin: -2.8, ymax: 2.8 });
    const SH = {
      drop: { n: 'Gota (punta a la derecha)', f: (x, y) => Math.hypot(x + 0.6, y) < 0.95 || (x > -0.6 && x < 1.7 && Math.abs(y) < (0.95 * (1.7 - x)) / 2.3), c: [[-0.3, 0]] },
      ellipse: { n: 'Elipse alargada', f: (x, y) => (x / 2.1) ** 2 + (y / 0.55) ** 2 < 1, c: [[0, 0]] },
      two: { n: 'Dos esferas unidas por un hilo', f: (x, y) => Math.hypot(x + 1.4, y) < 1.0 || Math.hypot(x - 2.0, y) < 0.35 || (x > -0.5 && x < 1.7 && Math.abs(y) < 0.05), c: [[-1.4, 0], [2.0, 0]] },
      rect: { n: 'Rectángulo (esquinas)', f: (x, y) => Math.abs(x) < 1.4 && Math.abs(y) < 0.7, c: [[0, 0]] }
    };
    sim.group('Forma del conductor');
    sim.select('sh', { options: Object.keys(SH).map((k) => [k, SH[k].n]), value: 'drop', onInput: () => { solver = null; } });
    sim.group('Mostrar');
    sim.check('fl', { label: 'Líneas de campo', value: true });
    sim.check('eq', { label: 'Equipotenciales', value: true });
    sim.check('band', { label: 'Densidad superficial σ', value: true });
    sim.out('it', 'Iteraciones de relajación');
    sim.out('ratio', 'σ<sub>máx</sub> / σ<sub>mín</sub>', { hl: true });
    sim.out('two', 'σ̄ esfera pequeña / σ̄ grande');
    sim.note('Conductor (cilindro infinito de esta sección) a potencial <i>V</i><sub>0</sub>; el borde de la región está a tierra. Se resuelve ∇²<i>V</i> = 0 numéricamente.');
    sim.legend([{ color: '--pos', label: 'σ alta', kind: 'sq' }, { color: '--fline', label: 'líneas de campo' }, { color: '--equip', label: 'equipotenciales', kind: 'dash' }]);
    let solver = null, bnd = null;
    const build = () => {
      const s = new EM.Laplace(-4.4, 4.4, -3.2, 3.2, 0.04);
      const sh = SH[sim.p.sh];
      s.fixRegion(sh.f, 1, 0);
      /* arranque rápido: multiplicar iteraciones */
      s.solve(900, 1.94);
      solver = s;
      bnd = s.boundary(0);
    };
    sim.onDraw(() => {
      if (!solver) build();
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false, axes: false });
      const ctx = cv.ctx;
      const sh = SH[sim.p.sh];
      const Vf = (x, y) => solver.at(x, y);
      if (sim.p.eq) EM.field.contours(view, Vf, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], { color: '--equip', width: 1, dash: [4, 4], alpha: 0.8, res: 4 });
      /* σ por celda y semillas proporcionales */
      let smax = 0, smin = Infinity;
      bnd.forEach((b) => { smax = Math.max(smax, b.s); if (b.s > 0) smin = Math.min(smin, b.s); });
      if (sim.p.fl) {
        const groups = sh.c.map(() => []);
        bnd.forEach((b) => { let best = 0, bd = 1e9; sh.c.forEach((c, i) => { const d = Math.hypot(b.x - c[0], b.y - c[1]); if (d < bd) { bd = d; best = i; } }); groups[best].push(b); });
        const total = bnd.reduce((s, b) => s + b.s, 0);
        const nLines = 46, dq = total / nLines;
        const Ef = (x, y) => solver.E(x, y);
        groups.forEach((gr, gi) => {
          const c = sh.c[gi];
          gr.sort((a, b) => Math.atan2(a.y - c[1], a.x - c[0]) - Math.atan2(b.y - c[1], b.x - c[0]));
          let acc = dq / 2;
          gr.forEach((b) => {
            acc += b.s;
            while (acc >= dq) {
              acc -= dq;
              const nn = Math.hypot(b.nx, b.ny) || 1;
              const x0 = b.x + (b.nx / nn) * 0.06, y0 = b.y + (b.ny / nn) * 0.06;
              const L = EM.field.trace(Ef, x0, y0, 1, { ds: 0.03, maxSteps: 700, bounds: [-4.3, 4.3, -3.1, 3.1] });
              EM.field.drawLine(view, L, { color: '--fline', width: 1.1, alpha: 0.85, arrowFirst: 60, arrowGap: 140 });
            }
          });
        });
      }
      /* conductor */
      ctx.save();
      ctx.fillStyle = EM.col('--surface-3');
      const hpx = solver.h * view.s + 0.6;
      for (let j = 0; j < solver.ny; j++) for (let i = 0; i < solver.nx; i++) {
        const k = solver.id(i, j);
        if (solver.tag[k] === 0) ctx.fillRect(view.X(solver.xOf(i)) - hpx / 2, view.Y(solver.yOf(j)) - hpx / 2, hpx, hpx);
      }
      if (sim.p.band) {
        bnd.forEach((b) => {
          const t = b.s / smax;
          ctx.fillStyle = EM.rgbStr(EM.cmap.diverging(0.15 + 0.85 * t));
          ctx.fillRect(view.X(b.x) - hpx * 0.9, view.Y(b.y) - hpx * 0.9, hpx * 1.8, hpx * 1.8);
        });
      }
      ctx.restore();
      EM.text(ctx, 'V = V₀', view.X(sh.c[0][0]), view.Y(sh.c[0][1]), { size: 12, mono: true, color: '--ink', align: 'center', baseline: 'middle' });
      sim.set('it', String(solver.iters));
      sim.set('ratio', smin > 0 ? EM.fix(smax / smin, 2) : '—');
      if (sim.p.sh === 'two') {
        const g = [[0, 0], [0, 0]];
        bnd.forEach((b) => { if (Math.abs(b.y) < 0.1 && b.x > -0.45 && b.x < 1.62) return; const i = b.x < 0.3 ? 0 : 1; g[i][0] += b.s; g[i][1]++; });
        const sb = g[0][0] / g[0][1], ss = g[1][0] / g[1][1];
        sim.set('two', EM.fix(ss / sb, 2) + ' (esferas 3D: ' + EM.fix(1 / 0.35, 2) + ')');
      } else sim.set('two', '—');
    });
  });
})();
