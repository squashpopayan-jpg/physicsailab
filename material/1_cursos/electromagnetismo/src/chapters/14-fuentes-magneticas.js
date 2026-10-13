/* Capítulo 14 — Biot–Savart y ley de Ampère */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const rad = M.rad;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* Campo exacto de una espira de radio a centrada en z0 (μ0 I = 1) */
  const LOOP = (EM.loopField = {
    psi(rho, z, a) {
      if (rho < 1e-9) return 0;
      const k2 = (4 * a * rho) / ((a + rho) ** 2 + z * z);
      if (k2 >= 0.999999) return NaN;
      const [Kk, Ek] = M.ellipKE(k2), k = Math.sqrt(k2);
      /* ψ = ρ A_φ con A_φ = (1/πk)√(a/ρ)[(1 − k²/2)K − E] */
      return (Math.sqrt(a * rho) / (Math.PI * k)) * ((1 - k2 / 2) * Kk - Ek);
    },
    B(rho, z, a) {
      const p2 = (a + rho) ** 2 + z * z, q2 = (a - rho) ** 2 + z * z;
      const k2 = (4 * a * rho) / p2;
      if (q2 < 1e-12) return [NaN, NaN];
      const [Kk, Ek] = M.ellipKE(Math.min(k2, 0.999999999));
      const c = 1 / (2 * Math.PI * Math.sqrt(p2));
      const Bz = c * (Kk + ((a * a - rho * rho - z * z) / q2) * Ek);
      const Br = rho < 1e-9 ? 0 : ((c * z) / rho) * (-Kk + ((a * a + rho * rho + z * z) / q2) * Ek);
      return [Br, Bz];
    },
    axis: (z, a) => (a * a) / (2 * Math.pow(a * a + z * z, 1.5))
  });

  /* ======================================================================
     14.1 Biot–Savart: segmento y espira
     ====================================================================== */
  EM.defineSim('biot-savart', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.9, az: rad(30), el: rad(20), target: [0.2, 0, 0.1] });
    sim.group('Geometría');
    sim.seg('g', { options: [['seg', 'Segmento recto'], ['loop', 'Espira circular']], value: 'loop', onInput: () => vis() });
    sim.slider('I', { label: 'Corriente <i>I</i>', min: 0.1, max: 20, step: 0.1, value: 5, unit: 'A', fmt: (v) => EM.fix(v, 1) });
    const sL = sim.slider('L', { label: 'Longitud del segmento <i>L</i>', min: 1, max: 40, step: 0.5, value: 10, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    const sa = sim.slider('a', { label: 'Radio de la espira <i>a</i>', min: 1, max: 10, step: 0.5, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.group('Punto P');
    const sx = sim.slider('px', { label: 'Distancia al eje (<i>d</i> o <i>ρ</i>)', min: 0, max: 15, step: 0.1, value: 0, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('pz', { label: 'Altura <i>z</i>', min: -12, max: 12, step: 0.1, value: 4, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('n', { label: 'Elementos dibujados', min: 4, max: 36, step: 1, value: 14, fmt: (v) => v.toFixed(0) });
    function vis() { const s = sim.p.g === 'seg'; sL.show(s); sa.show(!s); if (s && sim.p.px < 0.5) sx.set(4, true); }
    vis();
    sim.out('B', '|<b>B</b>| (suma numérica)', { hl: true });
    sim.out('Bc', '(<i>B<sub>x</sub></i>, <i>B<sub>y</sub></i>, <i>B<sub>z</sub></i>)');
    sim.out('Ban', 'Fórmula analítica');
    sim.out('Bap', 'Aproximación');
    sim.hint('Arrastra para girar la vista', cv);
    sim.legend([{ color: '--cur', label: 'corriente' }, { color: '--c5', label: 'd<b>B</b> (ampliadas)' }, { color: '--accent', label: '<b>B</b> total' }]);
    const mu = K.mu0;
    sim.onDraw(() => {
      const p = sim.p, isSeg = p.g === 'seg';
      const S = 0.1; /* unidades de dibujo por cm */
      const P = [p.px * S, 0, p.pz * S];
      const Pm = [p.px * 1e-2, 0, p.pz * 1e-2];
      /* elementos (en metros) */
      const elem = (N) => {
        const out = [];
        if (isSeg) {
          const L = p.L * 1e-2;
          for (let i = 0; i < N; i++) { const z = -L / 2 + (L * (i + 0.5)) / N; out.push({ r: [0, 0, z], dl: [0, 0, L / N] }); }
        } else {
          const a = p.a * 1e-2;
          for (let i = 0; i < N; i++) { const f = (2 * Math.PI * (i + 0.5)) / N; out.push({ r: [a * Math.cos(f), a * Math.sin(f), 0], dl: [-Math.sin(f) * ((2 * Math.PI * a) / N), Math.cos(f) * ((2 * Math.PI * a) / N), 0] }); }
        }
        return out;
      };
      const dB = (e) => { const R = V.sub(Pm, e.r), r = V.norm(R); if (r < 1e-6) return [0, 0, 0]; return V.scale(V.cross(e.dl, R), (mu * p.I) / (4 * Math.PI * r * r * r)); };
      let B = [0, 0, 0];
      elem(2000).forEach((e) => { B = V.add(B, dB(e)); });
      const Bm = V.norm(B);
      v3.begin();
      v3.axes({ len: 1.3, neg: 1.2 });
      const nd = Math.round(p.n);
      const els = elem(nd);
      if (isSeg) {
        const h = (p.L / 2) * S;
        v3.line([0, 0, -h], [0, 0, h], { color: '--cur', width: 4, seg: 10 });
        v3.arrow([0, 0, -h * 0.2], [0, 0, h * 0.25], { color: '--cur', width: 3, head: 12 });
      } else {
        const a = p.a * S, pts = [];
        for (let i = 0; i <= 96; i++) pts.push([a * Math.cos((2 * Math.PI * i) / 96), a * Math.sin((2 * Math.PI * i) / 96), 0]);
        v3.polyline(pts, { color: '--cur', width: 4 });
        v3.arrow([a, -0.05, 0], [a, 0.12, 0], { color: '--cur', width: 3, head: 12 });
      }
      const sc = 0.9 / Math.max(Bm, 1e-12);
      els.forEach((e) => {
        const r = V.scale(e.r, S * 100);
        const d = dB(e);
        v3.line(r, P, { color: '--c5', width: 0.6, alpha: 0.3, dash: [2, 3] });
        v3.arrow(P, V.add(P, V.scale(d, sc * nd * 0.3)), { color: '--c5', width: 1.3, head: 7, alpha: 0.85 });
        v3.point(r, { r: 3, color: '--cur', ring: false });
      });
      if (Bm > 0) v3.arrow(P, V.add(P, V.scale(B, sc)), { color: '--accent', width: 3.4, head: 13 });
      v3.point(P, { r: 5, color: '--ink' });
      v3.text(P, 'P', { size: 13, weight: 700, dx: -12, dy: 6 });
      v3.render();
      /* analítica */
      let an = '—', ap = '—';
      if (isSeg) {
        const d = p.px * 1e-2, L = p.L * 1e-2, z = p.pz * 1e-2;
        if (d > 1e-4) {
          const s2 = (L / 2 - z) / Math.hypot(d, L / 2 - z), s1 = (-L / 2 - z) / Math.hypot(d, -L / 2 - z);
          an = EM.si((mu * p.I * (s2 - s1)) / (4 * Math.PI * d), 'T');
          ap = EM.si((mu * p.I) / (2 * Math.PI * d), 'T') + ' (hilo infinito)';
        }
      } else {
        const a = p.a * 1e-2, rho = p.px * 1e-2, z = p.pz * 1e-2;
        const b = LOOP.B(rho / a, z / a, 1);
        an = EM.si((Math.hypot(b[0], b[1]) * mu * p.I) / a, 'T') + (rho < 1e-4 ? ' (fórmula del eje)' : ' (integrales elípticas)');
        const r = Math.hypot(rho, z);
        if (r > 0) { const m = p.I * Math.PI * a * a, c = z / r, s = rho / r; ap = EM.si(((mu * m) / (4 * Math.PI * r ** 3)) * Math.sqrt(4 * c * c + s * s), 'T') + ' (dipolo, válida si r ≫ a)'; }
      }
      sim.set('B', EM.si(Bm, 'T'));
      sim.set('Bc', '(' + B.map((c) => (Math.abs(c) < 1e-6 * Bm ? '0' : EM.si(c, 'T', 3))).join(', ') + ')');
      sim.set('Ban', an);
      sim.set('Bap', ap);
    });
  });

  /* Función de flujo 2D de hilos: ψ = −Σ I ln r (sus curvas de nivel son líneas de B) */
  const psiWires = (ws, x, y) => { let s = 0; for (const w of ws) s -= w.I * Math.log(Math.max(Math.hypot(x - w.x, y - w.y), 1e-6)); return s; };
  function wireLines(view, ws, o = {}) {
    const f = (x, y) => psiWires(ws, x, y);
    const vals = [];
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 26; j++) {
      const x = view.x0 + ((view.x1 - view.x0) * i) / 40, y = view.y0 + ((view.y1 - view.y0) * j) / 26;
      if (ws.some((w) => Math.hypot(x - w.x, y - w.y) < 0.5)) continue;
      vals.push(f(x, y));
    }
    vals.sort((a, b) => a - b);
    const lo = vals[Math.floor(vals.length * 0.02)], hi = vals[Math.floor(vals.length * 0.98)];
    const Imax = Math.max(...ws.map((w) => Math.abs(w.I)), 1e-9);
    const step = (o.density || 0.28) * Imax;
    const lv = [];
    for (let v = Math.floor(lo / step) * step - 6 * step; v <= hi + 8 * step; v += step) lv.push(v + step / 2);
    EM.field.contours(view, f, lv, { color: o.color || '--bline', width: 1.2, alpha: 0.85, res: 3 });
  }
  EM.wireLines = wireLines;

  /* ======================================================================
     14.2 Hilos paralelos
     ====================================================================== */
  EM.defineSim('parallel-wires', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5 });
    sim.group('Corrientes (+ saliente, − entrante)');
    sim.slider('I1', { label: '<i>I</i><sub>1</sub>', min: -20, max: 20, step: 1, value: 10, unit: 'A', fmt: (v) => v.toFixed(0) });
    sim.slider('I2', { label: '<i>I</i><sub>2</sub>', min: -20, max: 20, step: 1, value: 10, unit: 'A', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación <i>d</i>', min: 1, max: 12, step: 0.5, value: 6, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.check('arr', { label: 'Flechas de dirección de <b>B</b>', value: true });
    sim.out('F', 'Fuerza por unidad de longitud', { hl: true });
    sim.out('type', 'Tipo');
    sim.out('Bm', '|<b>B</b>| en el punto medio');
    sim.onDraw(() => {
      const p = sim.p;
      const ws = [{ x: -p.d / 2, y: 0, I: p.I1 }, { x: p.d / 2, y: 0, I: p.I2 }].filter((w) => w.I !== 0);
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      if (ws.length) wireLines(view, ws);
      if (p.arr && ws.length) EM.field.arrows(view, (x, y) => EM.phys2.B(ws, x, y), { spacing: 40, mode: 'dir', color: '--bline', width: 1.1, decades: 2, skip: (x, y) => ws.some((w) => Math.hypot(x - w.x, y - w.y) < 0.8) });
      const F = (K.mu0 * p.I1 * p.I2) / (2 * Math.PI * p.d * 1e-2);
      const att = F > 0;
      [[-p.d / 2, p.I1, 1], [p.d / 2, p.I2, -1]].forEach(([x, I, s]) => {
        if (I) EM.draw.current(ctx, view.X(x), view.Y(0), I, { r: 12, label: (I > 0 ? '⊙ ' : '⊗ ') + Math.abs(I) + ' A' });
        if (F !== 0) { const L = M.clamp(20 + Math.abs(F) * 8000, 20, 80); const dir = att ? s : -s; EM.draw.arrow(ctx, view.X(x), view.Y(0) + 28, view.X(x) + dir * L, view.Y(0) + 28, { color: '--accent', width: 3, head: 11 }); }
      });
      const Bmid = EM.phys2.B(ws, 0, 0);
      sim.set('F', EM.si(Math.abs(F), 'N/m'));
      sim.set('type', F > 0 ? 'atracción (mismo sentido)' : F < 0 ? 'repulsión (sentidos opuestos)' : '—');
      sim.set('Bm', EM.si((Math.hypot(...Bmid) * K.mu0) / (2 * Math.PI) / 1e-2, 'T'));
    });
  });

  /* ======================================================================
     14.3 Ley de Ampère con curva deformable
     ====================================================================== */
  EM.defineSim('ampere-loop', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -6, xmax: 6, ymin: -4, ymax: 4 });
    const ws = [{ x: -1.3, y: 0.5, I: 8 }, { x: 1.5, y: -0.6, I: -3 }, { x: 4, y: 2.3, I: 5 }];
    const ctrl = [];
    const resetCurve = () => { ctrl.length = 0; for (let i = 0; i < 9; i++) { const a = (2 * Math.PI * i) / 9; ctrl.push([2.7 * Math.cos(a), 2.2 * Math.sin(a)]); } };
    resetCurve();
    sim.group('Corrientes (+ saliente)');
    ws.forEach((w, i) => sim.slider('I' + i, { label: `<i>I</i><sub>${i + 1}</sub>`, min: -10, max: 10, step: 1, value: w.I, unit: 'A', fmt: (v) => v.toFixed(0), onInput: (v) => { w.I = v; } }));
    sim.group('Curva amperiana');
    sim.button('Restablecer la curva', resetCurve);
    sim.check('lines', { label: 'Líneas de campo', value: true });
    sim.out('circ', '∮ <b>B</b>·d<b>l</b> (antihorario)', { hl: true });
    sim.out('mu', '<i>μ</i><sub>0</sub><i>I</i><sub>enc</sub>', { hl: true });
    sim.out('Ienc', '<i>I</i><sub>enc</sub>');
    sim.hint('Arrastra los puntos de la curva y los hilos · cm', cv);
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
    const inside = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const pick = (x, y) => {
      for (let i = 0; i < ctrl.length; i++) if (Math.hypot(view.X(ctrl[i][0]) - x, view.Y(ctrl[i][1]) - y) < 12) return { c: i };
      for (let i = 0; i < ws.length; i++) if (Math.hypot(view.X(ws[i].x) - x, view.Y(ws[i].y) - y) < 15) return { w: i };
      return null;
    };
    EM.pointer(cv, {
      down: (x, y) => pick(x, y),
      move: (r, x, y) => { const wx = M.clamp(view.wx(x), view.x0 + 0.2, view.x1 - 0.2), wy = M.clamp(view.wy(y), view.y0 + 0.2, view.y1 - 0.2); if (r.c !== undefined) ctrl[r.c] = [wx, wy]; else { ws[r.w].x = wx; ws[r.w].y = wy; } sim.redraw(); },
      hover: (x, y) => !!pick(x, y)
    });
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      const act = ws.filter((w) => w.I !== 0);
      if (sim.p.lines && act.length) wireLines(view, act, { density: 0.35 });
      const pts = curve();
      let area = 0;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1; /* recorrido antihorario */
      const Bsi = (x, y) => { const b = EM.phys2.B(act, x, y); const k = (K.mu0 / (2 * Math.PI)) / 1e-2; return [b[0] * k, b[1] * k]; };
      let circ = 0;
      const marks = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const dx = (b[0] - a[0]) * sgn * 1e-2, dy = (b[1] - a[1]) * sgn * 1e-2;
        const B = Bsi((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        const c = B[0] * dx + B[1] * dy;
        circ += c;
        if (i % 12 === 6) { const L = Math.hypot(dx, dy); marks.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, dx / L, dy / L, c / L]); }
      }
      ctx.save();
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(view.X(q[0]), view.Y(q[1])) : ctx.moveTo(view.X(q[0]), view.Y(q[1]))));
      ctx.closePath();
      ctx.fillStyle = EM.alpha('--c5', 0.07); ctx.fill();
      ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2.4; ctx.stroke();
      ctx.restore();
      let mm = 1e-12;
      marks.forEach((m) => { mm = Math.max(mm, Math.abs(m[4])); });
      marks.forEach(([x, y, tx, ty, c]) => {
        const L = (Math.abs(c) / mm) * 22;
        if (L < 2) return;
        const X = view.X(x), Y = view.Y(y), s = Math.sign(c);
        EM.draw.arrow(ctx, X - (tx * s * L) / 2, Y + (ty * s * L) / 2, X + (tx * s * L) / 2, Y - (ty * s * L) / 2, { color: c > 0 ? '--c3' : '--c2', width: 2, head: 7 });
      });
      ctrl.forEach((c) => { ctx.beginPath(); ctx.arc(view.X(c[0]), view.Y(c[1]), 5, 0, 7); ctx.fillStyle = EM.col('--surface'); ctx.fill(); ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2; ctx.stroke(); });
      let Ienc = 0;
      ws.forEach((w, i) => { const inn = inside(pts, w.x, w.y); if (inn) Ienc += w.I; if (w.I) EM.draw.current(ctx, view.X(w.x), view.Y(w.y), w.I, { r: 11, label: `I${'₁₂₃'[i]} = ${w.I} A${inn ? ' (dentro)' : ''}` }); });
      sim.set('circ', EM.si(circ, 'T·m', 4));
      sim.set('mu', EM.si(K.mu0 * Ienc, 'T·m', 4));
      sim.set('Ienc', Ienc + ' A');
    });
  });

  /* ======================================================================
     14.4 Espira, Helmholtz y solenoide: mapa del campo
     ====================================================================== */
  EM.defineSim('coil-field', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    const cp = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    sim.group('Configuración');
    sim.seg('mode', { options: [['one', 'Espira'], ['hh', 'Dos espiras'], ['sol', 'Solenoide']], value: 'hh', onInput: () => vis() });
    const sd = sim.slider('d', { label: 'Separación <i>d</i>/<i>a</i>', min: 0.2, max: 2.5, step: 0.05, value: 1, fmt: f2 });
    const so = sim.check('opp', { label: 'Corrientes opuestas (anti-Helmholtz)', value: false });
    const sL = sim.slider('L', { label: 'Longitud del solenoide <i>L</i>/<i>a</i>', min: 0.5, max: 10, step: 0.1, value: 4, fmt: (v) => EM.fix(v, 1) });
    const sN = sim.slider('N', { label: 'Número de espiras', min: 4, max: 60, step: 1, value: 24, fmt: (v) => v.toFixed(0) });
    function vis() { const m = sim.p.mode; sd.show(m === 'hh'); so.show(m === 'hh'); sL.show(m === 'sol'); sN.show(m === 'sol'); }
    vis();
    sim.out('Bc', '<i>B</i> en el centro');
    sim.out('u', 'Variación de <i>B<sub>z</sub></i> en |<i>z</i>| < 0.2<i>a</i>', { hl: true });
    sim.out('ext', 'Otra referencia');
    sim.note('Mapa en un plano que contiene al eje (horizontal). Las líneas son curvas de nivel de <i>ρA<sub>φ</sub></i>.');
    let cache = null;
    const loops = () => {
      const p = sim.p;
      if (p.mode === 'one') return [{ z: 0, s: 1 }];
      if (p.mode === 'hh') return [{ z: -p.d / 2, s: 1 }, { z: p.d / 2, s: p.opp ? -1 : 1 }];
      const N = Math.round(p.N), out = [];
      for (let i = 0; i < N; i++) out.push({ z: -p.L / 2 + (p.L * (i + 0.5)) / N, s: 1 });
      return out;
    };
    sim.onDraw(() => {
      const p = sim.p, ls = loops();
      const span = p.mode === 'sol' ? Math.max(3.2, p.L / 2 + 2) : Math.max(3, (p.d || 1) / 2 + 2.2);
      const view = new EM.View2D(cv, { xmin: -span, xmax: span, ymin: -span / 1.6, ymax: span / 1.6 });
      EM.draw.clear(cv);
      view.grid({ labels: false });
      const psi = (x, y) => { let s = 0; const r = Math.abs(y); for (const l of ls) { const v = LOOP.psi(r, x - l.z, 1); if (!isFinite(v)) return NaN; s += l.s * v; } return s; };
      /* niveles */
      let pm = 0;
      for (let i = 0; i <= 30; i++) { const v = Math.abs(psi(view.x0 + ((view.x1 - view.x0) * i) / 30, 0.5)); if (isFinite(v)) pm = Math.max(pm, v); }
      const nl = 22, lv = [];
      for (let k = 1; k <= nl; k++) { lv.push((pm * 1.8 * k) / nl); if (ls.some((l) => l.s < 0)) lv.push((-pm * 1.8 * k) / nl); }
      EM.field.contours(view, psi, lv, { color: '--bline', width: 1.25, alpha: 0.9, res: 3 });
      const ctx = cv.ctx;
      ctx.strokeStyle = EM.col('--axis'); ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, view.Y(0)); ctx.lineTo(cv.w, view.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ls.forEach((l) => {
        EM.draw.current(ctx, view.X(l.z), view.Y(1), l.s, { r: ls.length > 20 ? 4 : 8 });
        EM.draw.current(ctx, view.X(l.z), view.Y(-1), -l.s, { r: ls.length > 20 ? 4 : 8 });
      });
      /* dirección: flechas en el eje */
      const Bax = (z) => ls.reduce((s, l) => s + l.s * LOOP.axis(z - l.z, 1), 0);
      for (let z = -span + 0.5; z < span; z += span / 3) { const b = Bax(z); if (Math.abs(b) > 1e-4) EM.draw.arrow(ctx, view.X(z) - 8 * Math.sign(b), view.Y(0), view.X(z) + 8 * Math.sign(b), view.Y(0), { color: '--bline', width: 2, head: 8 }); }
      EM.text(ctx, 'eje', 10, view.Y(0) - 6, { size: 11, color: '--ink-3' });
      /* gráfica de B en el eje */
      EM.draw.clear(cp);
      let ideal = null, Bref = 1;
      if (p.mode === 'sol') { ideal = Math.round(p.N) / p.L; Bref = ideal; }
      const yl = p.mode === 'sol' ? 'B_{z} / μ₀nI' : 'B_{z}  (μ₀I/a)';
      const vals = [];
      for (let i = 0; i <= 100; i++) vals.push(Bax(-span + (2 * span * i) / 100) / Bref);
      const ymax = Math.max(...vals.map(Math.abs)) * 1.2 || 1;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -span, xmax: span, ymin: ls.some((l) => l.s < 0) ? -ymax : 0, ymax, xlabel: 'z / a', ylabel: yl, mt: 10 });
      pl.frame();
      if (ideal) pl.hline(1, { color: '--ink-3', label: 'solenoide ideal μ₀nI', labelRight: true });
      pl.fn((z) => Bax(z) / Bref, { color: '--bline', width: 2.4 });
      ls.forEach((l) => pl.vline(l.z, { color: '--ink-3', dash: [2, 4], alpha: 0.5 }));
      const b0 = Bax(0);
      let bmin = Infinity, bmax = -Infinity;
      for (let z = -0.2; z <= 0.2001; z += 0.01) { const b = Bax(z); bmin = Math.min(bmin, b); bmax = Math.max(bmax, b); }
      sim.set('Bc', f3(b0 / Bref) + (p.mode === 'sol' ? ' μ₀nI' : ' μ₀I/a'));
      sim.set('u', Math.abs(b0) > 1e-9 ? EM.fix((100 * (bmax - bmin)) / Math.abs(b0), 3) + ' %' : 'B(0) = 0; gradiente ' + EM.fix((Bax(0.01) - Bax(-0.01)) / 0.02, 3));
      if (p.mode === 'sol') sim.set('ext', 'extremo/centro = ' + f3(Bax(p.L / 2) / b0));
      else if (p.mode === 'hh') sim.set('ext', 'Helmholtz ideal: 0.716 μ₀I/a');
      else sim.set('ext', 'centro: μ₀I/2a = 0.5 μ₀I/a');
      void cache;
    });
  });
})();
