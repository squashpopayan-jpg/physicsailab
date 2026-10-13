/* Capítulo 7 — Potencial eléctrico */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* ======================================================================
     7.1 Paisaje del potencial
     ====================================================================== */
  EM.defineSim('potential-landscape', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const c3 = sim.canvas({ aspect: 1 });
    const view = new EM.View2D(cv, { xmin: -3, xmax: 3, ymin: -3, ymax: 3 });
    const v3 = new EM.View3D(sim, c3, { radius: 3.2, az: rad(-60), el: rad(32), target: [0, 0, 0.2] });
    const Q = [{ x: -1.3, y: 0.6, q: 2 }, { x: 1.2, y: -0.4, q: -1 }, { x: 0.3, y: 1.8, q: 1 }];
    sim.group('Cargas');
    Q.forEach((c, i) => sim.slider('q' + i, { label: `<i>q</i><sub>${i + 1}</sub>`, min: -3, max: 3, step: 0.5, value: c.q, unit: 'q', fmt: (v) => EM.fix(v, 1), onInput: (v) => { c.q = v; } }));
    sim.group('Superficie');
    sim.slider('vc', { label: 'Recorte vertical |<i>V</i>|<sub>máx</sub>', min: 1, max: 8, step: 0.5, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.check('wire', { label: 'Malla de alambre', value: true });
    sim.note('Unidades: <i>V</i> en <i>kq</i>/<i>a</i>, con <i>a</i> la unidad de longitud. La superficie se recorta cerca de las cargas, donde <i>V</i> diverge.');
    sim.hint('Arrastra las cargas', cv);
    const pick = (x, y) => { for (let i = Q.length - 1; i >= 0; i--) if (Math.hypot(view.X(Q[i].x) - x, view.Y(Q[i].y) - y) < 15) return Q[i]; return null; };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (c, x, y) => { c.x = M.clamp(view.wx(x), -2.8, 2.8); c.y = M.clamp(view.wy(y), -2.8, 2.8); sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.onDraw(() => {
      const act = Q.filter((c) => c.q !== 0);
      const Vf = (x, y) => EM.phys2.V(act, x, y);
      const vc = sim.p.vc;
      view.update();
      EM.draw.clear(cv);
      EM.field.heat(view, Vf, (v) => EM.cmap.diverging(M.clamp(v / vc, -1, 1) * 0.85), { res: 4 });
      view.grid({ minorLines: false, xlabel: 'x', ylabel: 'y' });
      const lv = [];
      for (let k = 1; k <= 8; k++) { lv.push((vc * k) / 8, (-vc * k) / 8); }
      lv.push(0);
      EM.field.contours(view, Vf, lv, { color: '--ink', width: 1, alpha: 0.55, res: 4 });
      act.forEach((c) => EM.draw.charge(cv.ctx, view.X(c.x), view.Y(c.y), c.q, { r: 10 }));
      /* 3D */
      v3.begin();
      const zs = 1.5 / vc;
      const n = 44;
      v3.mesh((x, y) => [x, y, M.clamp(Vf(x, y), -vc, vc) * zs], -3, 3, n, -3, 3, n, {
        fillFn: (x, y) => EM.rgbStr(EM.cmap.diverging(M.clamp(Vf(x, y) / vc, -1, 1) * 0.85)), alpha: 0.95, seam: true,
        wire: sim.p.wire ? '--ink' : null, wireAlpha: 0.18, wireEveryU: 2, wireEveryV: 2
      });
      /* ejes cortos */
      v3.arrow([-3.2, -3.2, -1.6], [-2.2, -3.2, -1.6], { color: '--axis', width: 1.4, head: 8 });
      v3.arrow([-3.2, -3.2, -1.6], [-3.2, -2.2, -1.6], { color: '--axis', width: 1.4, head: 8 });
      v3.arrow([-3.2, -3.2, -1.6], [-3.2, -3.2, -0.6], { color: '--axis', width: 1.4, head: 8 });
      v3.text([-2.0, -3.2, -1.6], 'x', { size: 13, italic: true, family: EM.FONT_MATH });
      v3.text([-3.2, -2.0, -1.6], 'y', { size: 13, italic: true, family: EM.FONT_MATH });
      v3.text([-3.2, -3.2, -0.4], 'V', { size: 13, italic: true, family: EM.FONT_MATH });
      v3.render();
    });
  });

  /* ======================================================================
     7.2 V(r) y E(r)
     ====================================================================== */
  EM.defineSim('sphere-potential', function (sim) {
    const cV = sim.canvas({ aspect: 2.4 });
    const cE = sim.canvas({ aspect: 2.4 });
    const G = {
      cond: { n: 'Esfera conductora (radio R)', V: (r) => (r <= 1 ? 1 : 1 / r), E: (r) => (r < 1 ? 0 : 1 / (r * r)), u: 'sph', edges: [1] },
      unif: { n: 'Esfera maciza uniforme', V: (r) => (r <= 1 ? (3 - r * r) / 2 : 1 / r), E: (r) => (r < 1 ? r : 1 / (r * r)), u: 'sph', edges: [1] },
      cap: { n: 'Condensador esférico (a = R/2, b = 3R/2, externo a tierra)', V: (r) => (r <= 0.5 ? 2 - 2 / 3 : r <= 1.5 ? 1 / r - 2 / 3 : 0), E: (r) => (r < 0.5 || r > 1.5 ? 0 : 1 / (r * r)), u: 'sph', edges: [0.5, 1.5] },
      cyl: { n: 'Cilindro conductor (referencia V = 0 en ρ = 3R)', V: (r) => (r <= 1 ? Math.log(3) : -Math.log(r / 3)), E: (r) => (r < 1 ? 0 : 1 / r), u: 'cyl', edges: [1] },
      coax: { n: 'Cable coaxial (a = 0.4R, b = 1.5R, externo a tierra)', V: (r) => (r <= 0.4 ? Math.log(1.5 / 0.4) : r <= 1.5 ? Math.log(1.5 / r) : 0), E: (r) => (r < 0.4 || r > 1.5 ? 0 : 1 / r), u: 'cyl', edges: [0.4, 1.5] }
    };
    sim.group('Geometría');
    sim.select('g', { options: Object.keys(G).map((k) => [k, G[k].n]), value: 'unif' });
    sim.slider('r', { label: 'Posición <i>r</i>/<i>R</i>', min: 0.02, max: 3, step: 0.01, value: 1.6, fmt: f2 });
    sim.check('tan', { label: 'Recta tangente a <i>V</i>(<i>r</i>)', value: true });
    sim.out('V', '<i>V</i>(<i>r</i>)', { hl: true });
    sim.out('E', '<i>E</i>(<i>r</i>)', { hl: true });
    sim.out('dV', '−d<i>V</i>/d<i>r</i> (numérica)');
    const note = sim.note('');
    sim.onDraw(() => {
      const g = G[sim.p.g], r = sim.p.r;
      note.innerHTML = g.u === 'sph' ? 'Unidades: <i>V</i> en <i>Q</i>/(4π<i>ε</i><sub>0</sub><i>R</i>), <i>E</i> en <i>Q</i>/(4π<i>ε</i><sub>0</sub><i>R</i>²).' : 'Unidades: <i>V</i> en <i>λ</i>/(2π<i>ε</i><sub>0</sub>), <i>E</i> en <i>λ</i>/(2π<i>ε</i><sub>0</sub><i>R</i>).';
      const vmax = Math.max(...[0.02, 0.5, 1, 1.5, 2, 3].map(g.V)) * 1.15;
      EM.draw.clear(cV);
      const pv = new EM.Plot(cV.ctx, { x: 0, y: 0, w: cV.w, h: cV.h, xmin: 0, xmax: 3, ymin: 0, ymax: vmax, xlabel: '', ylabel: 'V', title: 'Potencial', mb: 26 });
      pv.frame();
      g.edges.forEach((e) => pv.vline(e, { color: '--ink-3' }));
      pv.fn(g.V, { color: '--c1', width: 2.4 });
      const h = 1e-4;
      const slope = (g.V(Math.min(3, r + h)) - g.V(Math.max(0, r - h))) / (Math.min(3, r + h) - Math.max(0, r - h));
      if (sim.p.tan) pv.fn((x) => g.V(r) + slope * (x - r), { color: '--accent', width: 1.6, dash: [5, 3], from: Math.max(0, r - 0.45), to: Math.min(3, r + 0.45) });
      pv.dot(r, g.V(r), { color: '--accent', r: 5 });
      EM.draw.clear(cE);
      const emax = Math.max(...Array.from({ length: 60 }, (_, i) => g.E(0.05 + (i * 2.95) / 59))) * 1.15;
      const pe = new EM.Plot(cE.ctx, { x: 0, y: 0, w: cE.w, h: cE.h, xmin: 0, xmax: 3, ymin: 0, ymax: Math.min(emax, 8), xlabel: 'r / R', ylabel: 'E', title: 'Campo  E = −dV/dr' });
      pe.frame();
      g.edges.forEach((e) => pe.vline(e, { color: '--ink-3' }));
      pe.fn(g.E, { color: '--efield', width: 2.4, from: 0.01, breakJumps: false });
      pe.dot(r, g.E(r), { color: '--accent', r: 5 });
      sim.set('V', f3(g.V(r)));
      sim.set('E', f3(g.E(r)));
      sim.set('dV', f3(-slope));
    });
  });

  /* ======================================================================
     7.3 Trabajo entre dos puntos
     ====================================================================== */
  EM.defineSim('work-path', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5 });
    const Q = [{ x: -3, y: 0, q: 2 }, { x: 3.5, y: 0.5, q: -1 }];
    const P = { A: [-5, 3.5], B: [5.5, -3], C: [0, 5] };
    sim.group('Cargas fuente');
    Q.forEach((c, i) => sim.slider('q' + i, { label: `<i>q</i><sub>${i + 1}</sub>`, min: -4, max: 4, step: 0.5, value: c.q, unit: 'nC', fmt: (v) => EM.fix(v, 1), onInput: (v) => { c.q = v; } }));
    sim.group('Carga que se mueve');
    sim.slider('q0', { label: '<i>q</i><sub>0</sub>', min: -5, max: 5, step: 0.5, value: 1, unit: 'nC', fmt: (v) => EM.fix(v, 1) });
    sim.out('VA', '<i>V</i><sub>A</sub>');
    sim.out('VB', '<i>V</i><sub>B</sub>');
    sim.out('Wp', 'Trabajo del campo por el camino', { hl: true });
    sim.out('Wv', '<i>q</i><sub>0</sub>(<i>V</i><sub>A</sub> − <i>V</i><sub>B</sub>)', { hl: true });
    sim.hint('Arrastra A, B, el punto de control C y las cargas', cv);
    const kV = K.k * 1e-9 / 1e-2; /* nC, cm → V */
    const Vf = (x, y) => EM.phys2.V(Q.filter((c) => c.q), x, y) * kV;
    const Ef = (x, y) => { const e = EM.phys2.E(Q.filter((c) => c.q), x, y); return [e[0] * kV * 100, e[1] * kV * 100]; }; /* V/m */
    const bez = (t) => { const { A, B, C } = P; const u = 1 - t; return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]; };
    const pick = (x, y) => {
      for (const k of ['A', 'B', 'C']) if (Math.hypot(view.X(P[k][0]) - x, view.Y(P[k][1]) - y) < 14) return { k };
      for (let i = 0; i < Q.length; i++) if (Math.hypot(view.X(Q[i].x) - x, view.Y(Q[i].y) - y) < 15) return { i };
      return null;
    };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (r, x, y) => { const wx = M.clamp(view.wx(x), view.x0 + 0.3, view.x1 - 0.3), wy = M.clamp(view.wy(y), view.y0 + 0.3, view.y1 - 0.3); if (r.k) P[r.k] = [wx, wy]; else { Q[r.i].x = wx; Q[r.i].y = wy; } sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      const vm = 600;
      EM.field.heat(view, Vf, (v) => EM.cmap.diverging(M.clamp(v / vm, -1, 1) * 0.7), { res: 4 });
      view.grid({ minorLines: false, xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const lv = [];
      for (let k = -12; k <= 12; k++) lv.push(k * 60);
      EM.field.contours(view, Vf, lv, { color: '--equip', width: 1.1, alpha: 0.85, res: 4 });
      const ctx = cv.ctx;
      /* camino */
      const pts = [];
      for (let i = 0; i <= 200; i++) pts.push(bez(i / 200));
      EM.draw.poly(ctx, pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--accent', width: 2.6 });
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(view.X(P.A[0]), view.Y(P.A[1])); ctx.lineTo(view.X(P.C[0]), view.Y(P.C[1])); ctx.lineTo(view.X(P.B[0]), view.Y(P.B[1])); ctx.stroke(); ctx.restore();
      const mid = bez(0.5), mid2 = bez(0.52);
      EM.draw.arrow(ctx, view.X(mid[0]), view.Y(mid[1]), view.X(mid2[0]), view.Y(mid2[1]), { color: '--accent', width: 3, head: 12 });
      /* trabajo numérico */
      let W = 0;
      const q0 = sim.p.q0 * 1e-9;
      for (let i = 0; i < 2000; i++) {
        const a = bez(i / 2000), b = bez((i + 1) / 2000), m = bez((i + 0.5) / 2000);
        const e = Ef(m[0], m[1]);
        W += q0 * (e[0] * (b[0] - a[0]) + e[1] * (b[1] - a[1])) * 1e-2;
      }
      Q.forEach((c) => { if (c.q) EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 11 }); });
      for (const k of ['A', 'B', 'C']) {
        const q = P[k];
        ctx.beginPath(); ctx.arc(view.X(q[0]), view.Y(q[1]), k === 'C' ? 5 : 7, 0, 7);
        ctx.fillStyle = EM.col(k === 'C' ? '--ink-3' : '--ink'); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = EM.col('--canvas'); ctx.stroke();
        EM.text(ctx, k, view.X(q[0]) + 10, view.Y(q[1]) - 10, { size: 14, weight: 700, halo: true });
      }
      const VA = Vf(...P.A), VB = Vf(...P.B);
      sim.set('VA', EM.si(VA, 'V'));
      sim.set('VB', EM.si(VB, 'V'));
      sim.set('Wp', EM.si(W, 'J'));
      sim.set('Wv', EM.si(q0 * (VA - VB), 'J'));
    });
  });

  /* ======================================================================
     7.4 Energía de ensamblaje
     ====================================================================== */
  EM.defineSim('energy-assembly', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -8, xmax: 8, ymin: -5.2, ymax: 5.2 });
    const C = [{ x: -3, y: -2, q: 2 }, { x: 3, y: -2, q: -1 }, { x: 3, y: 2.5, q: 1 }, { x: -3, y: 2.5, q: -2 }];
    let placed = 4;
    sim.group('Valores de las cargas');
    C.forEach((c, i) => sim.slider('q' + i, { label: `<i>q</i><sub>${i + 1}</sub>`, min: -3, max: 3, step: 0.5, value: c.q, unit: 'nC', fmt: (v) => EM.fix(v, 1), onInput: (v) => { c.q = v; } }));
    sim.group('Ensamblaje');
    sim.seg('ord', { label: 'Orden', options: [['f', '1 → 4'], ['r', '4 → 1']], value: 'f', onInput: () => { placed = 0; } });
    sim.button('Traer la siguiente carga', () => { placed = Math.min(4, placed + 1); }, { primary: true });
    sim.button('Empezar de nuevo', () => { placed = 0; });
    sim.button('Colocar todas', () => { placed = 4; });
    const stepsBox = sim.note('');
    sim.out('Wt', 'Trabajo acumulado', { hl: true });
    sim.out('Up', 'Σ pares <i>kq<sub>i</sub>q<sub>j</sub></i>/<i>r<sub>ij</sub></i>');
    sim.hint('Arrastra las posiciones · cm', cv);
    const kU = K.k * 1e-18 / 1e-2; /* nC², cm → J */
    const pick = (x, y) => { for (let i = 0; i < 4; i++) if (Math.hypot(view.X(C[i].x) - x, view.Y(C[i].y) - y) < 15) return C[i]; return null; };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (c, x, y) => { c.x = M.clamp(view.wx(x), view.x0 + 0.5, view.x1 - 0.5); c.y = M.clamp(view.wy(y), view.y0 + 0.5, view.y1 - 0.5); sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      const order = sim.p.ord === 'f' ? [0, 1, 2, 3] : [3, 2, 1, 0];
      const inSet = order.slice(0, placed);
      const pair = (i, j) => (kU * C[i].q * C[j].q) / Math.hypot(C[i].x - C[j].x, C[i].y - C[j].y);
      /* pares ya formados */
      for (let a = 0; a < inSet.length; a++) for (let b = a + 1; b < inSet.length; b++) {
        const i = inSet[a], j = inSet[b], U = pair(i, j);
        ctx.save();
        ctx.strokeStyle = EM.col(U > 0 ? '--pos' : '--neg');
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(view.X(C[i].x), view.Y(C[i].y)); ctx.lineTo(view.X(C[j].x), view.Y(C[j].y)); ctx.stroke();
        ctx.restore();
        EM.text(ctx, EM.fix(U * 1e6, 2) + ' µJ', view.X((C[i].x + C[j].x) / 2), view.Y((C[i].y + C[j].y) / 2), { size: 11.5, mono: true, color: U > 0 ? '--pos' : '--neg', halo: true, align: 'center', baseline: 'middle' });
      }
      C.forEach((c, i) => {
        const on = inSet.includes(i);
        if (on) EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 11, label: 'q' + '₁₂₃₄'[i] });
        else { ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(view.X(c.x), view.Y(c.y), 11, 0, 7); ctx.stroke(); ctx.restore(); EM.text(ctx, 'q' + '₁₂₃₄'[i], view.X(c.x) + 14, view.Y(c.y) - 12, { size: 12, color: '--ink-3', halo: true }); }
      });
      /* pasos */
      let Wt = 0;
      const rows = [];
      inSet.forEach((i, s) => {
        let w = 0;
        for (let t = 0; t < s; t++) w += pair(i, inSet[t]);
        Wt += w;
        rows.push(`Paso ${s + 1}: traer <i>q</i><sub>${i + 1}</sub> → <i>W</i> = ${EM.fix(w * 1e6, 3)} µJ`);
      });
      stepsBox.innerHTML = rows.length ? rows.join('<br>') : 'Pulse “Traer la siguiente carga”. La primera no cuesta trabajo.';
      let Up = 0;
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) Up += pair(a, b);
      sim.set('Wt', EM.fix(Wt * 1e6, 3) + ' µJ');
      sim.set('Up', EM.fix(Up * 1e6, 3) + ' µJ (las 4)');
    });
  });

  /* ======================================================================
     7.5 Dispersión de Rutherford
     ====================================================================== */
  EM.defineSim('rutherford', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -260, xmax: 260, ymin: -140, ymax: 220 });
    sim.group('Proyectil y blanco');
    sim.slider('K', { label: 'Energía cinética <i>K</i> de la partícula α', min: 1, max: 12, step: 0.1, value: 5, unit: 'MeV', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Z', { label: 'Número atómico del blanco <i>Z</i>', min: 6, max: 92, step: 1, value: 79, fmt: (v) => v.toFixed(0) });
    sim.group('Trayectorias');
    sim.slider('b', { label: 'Parámetro de impacto <i>b</i> (resaltada)', min: 0, max: 150, step: 0.5, value: 30, unit: 'fm', fmt: (v) => EM.fix(v, 1) });
    sim.check('fam', { label: 'Familia de trayectorias', value: true });
    sim.out('d', 'Distancia de choque frontal <i>d</i>');
    sim.out('rmin', '<i>r</i><sub>mín</sub> de la resaltada');
    sim.out('th', 'Ángulo de desviación Θ (numérico)', { hl: true });
    sim.out('thf', '2 arctan(<i>d</i>/2<i>b</i>)');
    const traj = (b, C, Kmev) => {
      /* Unidades: v∞ = 1, m = 2K (MeV), aceleración = C/(m r²) r̂. Se parte de muy lejos con la energía correcta. */
      const k = C / (2 * Kmev);
      const r0 = 6000;
      let x = -Math.sqrt(r0 * r0 - b * b), y = b;
      const v = Math.sqrt(Math.max(0, 1 - C / (Kmev * r0)));
      let vx = v, vy = 0;
      const pts = [];
      let rmin = 1e9;
      const acc = (px, py) => { const rr = Math.hypot(px, py); const f = k / (rr * rr * rr); return [f * px, f * py]; };
      for (let i = 0; i < 60000; i++) {
        const r = Math.hypot(x, y);
        rmin = Math.min(rmin, r);
        const dt = M.clamp(r * 0.002, 0.01, 25);
        const a1 = acc(x, y);
        const x2 = x + (vx * dt) / 2, y2 = y + (vy * dt) / 2, vx2 = vx + (a1[0] * dt) / 2, vy2 = vy + (a1[1] * dt) / 2;
        const a2 = acc(x2, y2);
        x += vx2 * dt; y += vy2 * dt; vx += a2[0] * dt; vy += a2[1] * dt;
        if (Math.abs(x) < 700 && Math.abs(y) < 500) pts.push([x, y]);
        if (r > r0 && x * vx + y * vy > 0) break;
      }
      return { pts, rmin, ang: Math.atan2(vy, vx) };
    };
    sim.onDraw(() => {
      const p = sim.p;
      const C = 1.44 * 2 * p.Z; /* MeV·fm */
      const d = C / p.K;
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (fm)', ylabel: 'y (fm)' });
      const ctx = cv.ctx;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), d * view.s, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'd', view.X(d * 0.72), view.Y(d * 0.72), { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2', halo: true });
      if (p.fam) {
        for (let b = -140; b <= 140; b += 10) {
          if (b === 0) continue;
          const T = traj(b, C, p.K);
          EM.draw.poly(ctx, T.pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--c1', width: 1, alpha: 0.45 });
        }
      }
      const T = traj(p.b, C, p.K);
      EM.draw.poly(ctx, T.pts.map((q) => [view.X(q[0]), view.Y(q[1])]), { color: '--accent', width: 2.6 });
      const R = 1.2 * Math.pow(2.5 * p.Z, 1 / 3);
      ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), Math.max(4, R * view.s), 0, 7); ctx.fillStyle = EM.col('--pos'); ctx.fill();
      EM.text(ctx, 'núcleo (Z = ' + p.Z + ')', view.X(0) + 10, view.Y(0) + 18, { size: 11.5, color: '--ink-2', halo: true });
      const th = Math.abs(deg(T.ang));
      sim.set('d', EM.fix(d, 1) + ' fm');
      sim.set('rmin', EM.fix(T.rmin, 1) + ' fm');
      sim.set('th', EM.fix(th, 1) + '°');
      sim.set('thf', p.b > 0 ? EM.fix(deg(2 * Math.atan(d / (2 * p.b))), 1) + '°' : '180°');
    });
  });

  /* ======================================================================
     7.6 Desarrollo multipolar axial
     ====================================================================== */
  EM.defineSim('multipole', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const view = new EM.View2D(cv, { xmin: -3.6, xmax: 3.6, ymin: -3.6, ymax: 3.6 });
    const PRE = {
      off: { n: 'Carga desplazada (+q en z = 0.6)', c: [[0.6, 1]] },
      dip: { n: 'Dipolo (±q, d = 1)', c: [[0.5, 1], [-0.5, -1]] },
      quad: { n: 'Cuadrupolo lineal (+q, −2q, +q)', c: [[1, 1], [0, -2], [-1, 1]] },
      asym: { n: 'Tres cargas asimétricas', c: [[0.8, 2], [-0.3, -1], [-1, 0.5]] }
    };
    sim.group('Distribución');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'quad' });
    sim.slider('N', { label: 'Orden máximo del desarrollo <i>n</i>', min: 0, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Dirección <i>θ</i> para la gráfica', min: 0, max: 180, step: 1, value: 20, unit: '°', fmt: (v) => v.toFixed(0) });
    for (let n = 0; n <= 3; n++) sim.out('m' + n, `Momento <i>n</i> = ${n}: Σ<i>q<sub>i</sub>z<sub>i</sub></i><sup>${n}</sup>`);
    sim.note('Unidades: <i>k</i> = 1, longitudes en la unidad de la figura.');
    sim.legend([{ color: '--c1', label: 'exacto' }, { color: '--accent', label: 'desarrollo hasta orden n', kind: 'dash' }]);
    const P = (n, x) => { let p0 = 1, p1 = x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1); p0 = p1; p1 = p2; } return p1; };
    sim.onDraw(() => {
      const ch = PRE[sim.p.pre].c, N = sim.p.N;
      const charges = ch.map(([z, q]) => ({ x: 0, y: z, q }));
      const mom = [0, 1, 2, 3, 4].map((n) => ch.reduce((s, [z, q]) => s + q * Math.pow(z, n), 0));
      const zmax = Math.max(...ch.map(([z]) => Math.abs(z)));
      const exact = (x, y) => EM.phys2.V(charges, x, y);
      const approx = (x, y) => {
        const r = Math.hypot(x, y);
        if (r < zmax * 1.05) return NaN;
        const c = y / r;
        let v = 0;
        for (let n = 0; n <= N; n++) v += (mom[n] * P(n, c)) / Math.pow(r, n + 1);
        return v;
      };
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x', ylabel: 'z' });
      const lv = [];
      [0.02, 0.05, 0.1, 0.2, 0.4, 0.8].forEach((v) => lv.push(v, -v));
      EM.field.contours(view, exact, lv, { color: '--c1', width: 1.3, alpha: 0.85, res: 4 });
      EM.field.contours(view, approx, lv, { color: '--accent', width: 1.3, dash: [5, 4], alpha: 0.9, res: 4 });
      const ctx = cv.ctx;
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), zmax * view.s, 0, 7); ctx.stroke(); ctx.restore();
      const th = rad(sim.p.th);
      ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = EM.col('--ink-2');
      ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(0)); ctx.lineTo(view.X(5 * Math.sin(th)), view.Y(5 * Math.cos(th))); ctx.stroke(); ctx.restore();
      charges.forEach((c) => EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 8 + 2 * Math.sqrt(Math.abs(c.q)) }));
      /* gráfica |V| en escala log */
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.5, xmax: 30, ymin: 1e-6, ymax: 10, xlog: true, ylog: true, xlabel: 'r', ylabel: '|V|', title: 'A lo largo de θ = ' + sim.p.th + '°' });
      pl.frame();
      pl.vline(zmax, { color: '--ink-3', label: 'extensión' });
      pl.fn((r) => Math.abs(exact(r * Math.sin(th), r * Math.cos(th))), { color: '--c1', width: 2.2 });
      pl.fn((r) => Math.abs(approx(r * Math.sin(th), r * Math.cos(th))), { color: '--accent', width: 2, dash: [6, 4], from: zmax * 1.05 });
      for (let n = 0; n <= 3; n++) sim.set('m' + n, f3(mom[n]));
    });
  });
})();
