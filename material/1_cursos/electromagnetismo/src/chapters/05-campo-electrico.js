/* Capítulo 5 — El campo eléctrico */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const f2 = (v) => EM.fix(v, 2);
  const rad = M.rad, deg = M.deg;

  /* ======================================================================
     5.1 Líneas de campo de cargas puntuales (cm, nC)
     ====================================================================== */
  EM.defineSim('field-lines', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new EM.View2D(cv, { xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5 });
    const PRE = {
      dipole: [[-3, 0, 1], [3, 0, -1]],
      equal: [[-3, 0, 1], [3, 0, 1]],
      twoone: [[-3, 0, 2], [3, 0, -1]],
      quad: [[-3, 3, 1], [3, 3, -1], [3, -3, 1], [-3, -3, -1]],
      three: [[-4, -2, 1], [4, -2, 1], [0, 3, -2]],
      single: [[0, 0, 1]]
    };
    let charges = [];
    let sel = 0;
    const load = (k) => { charges = PRE[k].map(([x, y, q]) => ({ x, y, q })); sel = 0; syncSel(); };
    sim.group('Configuración');
    sim.select('pre', { options: [['dipole', 'Dipolo'], ['equal', 'Dos cargas iguales'], ['twoone', 'Carga +2q y −q'], ['quad', 'Cuadrupolo'], ['three', 'Tres cargas'], ['single', 'Carga aislada']], value: 'dipole', onInput: (v) => load(v) });
    sim.button('Añadir +1 nC', () => { charges.push({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 6, q: 1 }); sel = charges.length - 1; syncSel(); });
    sim.button('Añadir −1 nC', () => { charges.push({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 6, q: -1 }); sel = charges.length - 1; syncSel(); });
    sim.button('Quitar seleccionada', () => { if (charges.length > 1) { charges.splice(sel, 1); sel = 0; syncSel(); } }, { newRow: true });
    sim.group('Carga seleccionada');
    const sq = sim.slider('qsel', { label: 'Valor', min: -4, max: 4, step: 0.5, value: 1, unit: 'nC', fmt: (v) => EM.fix(v, 1), onInput: (v) => { if (charges[sel]) charges[sel].q = v === 0 ? 0.5 * Math.sign(charges[sel].q || 1) : v; } });
    function syncSel() { if (charges[sel]) sq.set(charges[sel].q, true); }
    sim.group('Mostrar');
    sim.check('lines', { label: 'Líneas de campo', value: true });
    sim.check('vec', { label: 'Vectores de dirección', value: false });
    sim.check('eq', { label: 'Equipotenciales', value: true });
    sim.out('E', '|<b>E</b>| en la sonda', { hl: true });
    sim.out('Ea', 'Dirección de <b>E</b>');
    sim.out('V', '<i>V</i> en la sonda');
    sim.out('Q', 'Carga total');
    sim.hint('Arrastra cargas y la sonda (⊕) · clic para seleccionar', cv);
    sim.legend([{ color: '--fline', label: 'líneas de campo' }, { color: '--equip', label: 'equipotenciales', kind: 'dash' }, { color: '--accent', label: '<b>E</b> en la sonda' }]);
    const probe = { x: 0, y: 4 };
    load('dipole');
    const pick = (x, y) => {
      if (Math.hypot(view.X(probe.x) - x, view.Y(probe.y) - y) < 14) return { probe: true };
      for (let i = charges.length - 1; i >= 0; i--) if (Math.hypot(view.X(charges[i].x) - x, view.Y(charges[i].y) - y) < 16) return { i };
      return null;
    };
    EM.pointer(cv, {
      down: (x, y) => { const r = pick(x, y); if (r && r.i !== undefined) { sel = r.i; syncSel(); sim.redraw(); } return r; },
      move: (r, x, y) => {
        const o = r.probe ? probe : charges[r.i];
        o.x = M.clamp(view.wx(x), view.x0 + 0.3, view.x1 - 0.3);
        o.y = M.clamp(view.wy(y), view.y0 + 0.3, view.y1 - 0.3);
        sim.redraw();
      },
      hover: (x, y) => !!pick(x, y)
    });
    const kE = K.k * 1e-9 / 1e-4, kV = K.k * 1e-9 / 1e-2;
    sim.onDraw(() => {
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      const Ef = (x, y) => EM.phys2.E(charges, x, y);
      const Vf = (x, y) => EM.phys2.V(charges, x, y);
      const qm = Math.max(...charges.map((c) => Math.abs(c.q)));
      if (sim.p.eq) {
        const lv = [];
        [0.06, 0.12, 0.2, 0.3, 0.45, 0.7, 1.1, 1.8].forEach((v) => lv.push(v * qm, -v * qm));
        if (charges.some((c) => c.q > 0) && charges.some((c) => c.q < 0)) lv.push(0);
        EM.field.contours(view, Vf, lv, { color: '--equip', width: 1.1, dash: [5, 4], alpha: 0.8, res: 4 });
      }
      if (sim.p.vec) EM.field.arrows(view, Ef, { spacing: 30, mode: 'dir', color: '--c6', width: 1.1, decades: 3, skip: (x, y) => charges.some((c) => Math.hypot(x - c.x, y - c.y) < 0.7) });
      if (sim.p.lines) {
        const lines = EM.field.chargeLines(view, charges, Ef, { perUnit: 10, r0: 0.18 });
        lines.forEach((L) => EM.field.drawLine(view, L, { color: '--fline', width: 1.25 }));
      }
      charges.forEach((c, i) => EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 9 + 2.5 * Math.sqrt(Math.abs(c.q)), selected: i === sel, label: EM.fix(c.q, 1) + ' nC' }));
      /* sonda */
      const E = Ef(probe.x, probe.y), Em = Math.hypot(E[0], E[1]);
      const px = view.X(probe.x), py = view.Y(probe.y);
      if (Em > 0 && isFinite(Em)) EM.draw.arrow(ctx, px, py, px + (E[0] / Em) * 46, py - (E[1] / Em) * 46, { color: '--accent', width: 3, head: 12 });
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.moveTo(px - 11, py); ctx.lineTo(px + 11, py); ctx.moveTo(px, py - 11); ctx.lineTo(px, py + 11); ctx.stroke();
      sim.set('E', EM.si(Em * kE, 'N/C'));
      sim.set('Ea', Em > 0 ? EM.fix(deg(Math.atan2(E[1], E[0])), 1) + '°' : '—');
      sim.set('V', EM.si(Vf(probe.x, probe.y) * kV, 'V'));
      sim.set('Q', EM.fix(charges.reduce((s, c) => s + c.q, 0), 1) + ' nC');
    });
  });

  /* ======================================================================
     5.2 Dipolo: exacto frente a campo lejano (unidades de d y kp/d³)
     ====================================================================== */
  EM.defineSim('dipole-field', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const view = new EM.View2D(cv, { xmin: -2.6, xmax: 2.6, ymin: -2.7, ymax: 2.7 });
    sim.group('Punto de observación');
    sim.slider('r', { label: 'Distancia <i>r</i>/<i>d</i>', min: 0.7, max: 30, value: 2, log: true, step: 0.01, fmt: f2 });
    sim.slider('th', { label: 'Ángulo <i>θ</i> desde <b>p</b>', min: 0, max: 180, step: 1, value: 40, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('lines', { label: 'Líneas de campo', value: true });
    sim.out('Ee', '|<b>E</b>| exacto', { hl: true });
    sim.out('Ef', '|<b>E</b>| dipolo ideal');
    sim.out('err', 'Error relativo');
    sim.out('ang', 'Ángulo entre ambos');
    sim.note('Unidades: distancias en <i>d</i>; campo en <i>kp</i>/<i>d</i>³. El momento <b>p</b> apunta hacia +<i>z</i> (arriba).');
    sim.legend([{ color: '--accent', label: 'exacto' }, { color: '--c5', label: 'dipolo ideal (campo lejano)', kind: 'dash' }]);
    const ch = [{ x: 0, y: 0.5, q: 1 }, { x: 0, y: -0.5, q: -1 }];
    const exact = (x, y) => EM.phys2.E(ch, x, y);
    const far = (x, y) => { const r = Math.hypot(x, y), c = y / r, s = x / r; /* θ desde +y */ const Er = (2 * c) / r ** 3, Et = s / r ** 3; /* uθ = (cosθ en x, −sinθ en y) */ return [Er * s + Et * c, Er * c - Et * s]; };
    sim.onDraw(() => {
      const r = sim.p.r, th = rad(sim.p.th);
      const x = r * Math.sin(th), y = r * Math.cos(th);
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x/d', ylabel: 'z/d' });
      const ctx = cv.ctx;
      if (sim.p.lines) EM.field.chargeLines(view, ch, exact, { perUnit: 14, r0: 0.06 }).forEach((L) => EM.field.drawLine(view, L, { color: '--fline', width: 1.1, alpha: 0.8 }));
      ch.forEach((c) => EM.draw.charge(ctx, view.X(c.x), view.Y(c.y), c.q, { r: 9 }));
      EM.draw.arrow(ctx, view.X(0), view.Y(-0.35), view.X(0), view.Y(0.35), { color: '--gold', width: 2.5, head: 9 });
      EM.text(ctx, 'p', view.X(0) + 8, view.Y(0.1), { size: 14, weight: 700, family: EM.FONT_MATH, color: '--gold', halo: true });
      const Ee = exact(x, y), Efar = far(x, y);
      const me = Math.hypot(...Ee), mf = Math.hypot(...Efar);
      const inView = Math.abs(x) < 2.5 && Math.abs(y) < 2.6;
      if (inView) {
        const px = view.X(x), py = view.Y(y);
        const s = 55 / Math.max(me, mf);
        EM.draw.arrow(ctx, px, py, px + Efar[0] * s, py - Efar[1] * s, { color: '--c5', width: 2.4, head: 10, dash: [5, 3] });
        EM.draw.arrow(ctx, px, py, px + Ee[0] * s, py - Ee[1] * s, { color: '--accent', width: 2.6, head: 11 });
        ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fillStyle = EM.col('--ink'); ctx.fill();
      } else {
        EM.text(ctx, 'punto fuera de la vista (r = ' + f2(r) + ' d)', 10, cv.h - 12, { size: 11.5, color: '--ink-2', halo: true });
      }
      /* gráfica */
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.7, xmax: 30, ymin: 1e-5, ymax: 20, xlog: true, ylog: true, xlabel: 'r / d', ylabel: '|E| (kp/d³)', title: 'En la dirección θ = ' + sim.p.th + '°' });
      pl.frame();
      const fe = (rr) => Math.hypot(...exact(rr * Math.sin(th), rr * Math.cos(th)));
      const ff = (rr) => Math.hypot(...far(rr * Math.sin(th), rr * Math.cos(th)));
      pl.fn(ff, { color: '--c5', width: 2, dash: [6, 4] });
      pl.fn(fe, { color: '--accent', width: 2.2 });
      pl.dot(r, me, { color: '--accent', r: 5 });
      pl.label(8, ff(8) * 3, 'pendiente −3', { color: '--c5' });
      sim.set('Ee', EM.sci(me, 4));
      sim.set('Ef', EM.sci(mf, 4));
      sim.set('err', EM.fix((100 * Math.abs(me - mf)) / me, 3) + ' %');
      const cosang = (Ee[0] * Efar[0] + Ee[1] * Efar[1]) / (me * mf);
      sim.set('ang', EM.fix(deg(Math.acos(M.clamp(cosang, -1, 1))), 2) + '°');
    });
  });

  /* ======================================================================
     5.3 Campo en el eje: anillo, disco, segmento (unidades kQ/a²)
     ====================================================================== */
  EM.defineSim('continuous-axis', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const v3 = new EM.View3D(sim, c3, { radius: 1.75, az: rad(30), el: rad(20), target: [0, 0, 0.75] });
    sim.group('Distribución');
    sim.seg('dist', { options: [['ring', 'Anillo'], ['disk', 'Disco'], ['seg', 'Segmento']], value: 'ring' });
    sim.slider('z', { label: 'Posición de P, <i>z</i>/<i>a</i>', min: 0.05, max: 5, step: 0.01, value: 1.2, fmt: f2 });
    sim.slider('n', { label: 'Elementos dibujados', min: 4, max: 32, step: 1, value: 12, fmt: (v) => v.toFixed(0) });
    sim.check('lines', { label: 'Líneas de cada elemento a P', value: true });
    sim.out('E', '<i>E</i> exacto', { hl: true });
    sim.out('Ep', 'Carga puntual <i>kQ</i>/<i>z</i>²');
    sim.out('El', 'Límite extendido');
    sim.note('Unidades: longitudes en <i>a</i> (radio o semilongitud); campo en <i>kQ</i>/<i>a</i>².');
    sim.legend([{ color: '--accent', label: 'exacto' }, { color: '--c1', label: 'carga puntual', kind: 'dash' }, { color: '--c3', label: 'plano o línea infinita', kind: 'dash' }, { color: '--c5', label: 'd<b>E</b> (ampliadas)' }]);
    const exact = { ring: (z) => z / Math.pow(z * z + 1, 1.5), disk: (z) => 2 * (1 - z / Math.sqrt(z * z + 1)), seg: (z) => 1 / (z * Math.sqrt(z * z + 1)) };
    const limit = { ring: null, disk: () => 2, seg: (z) => 1 / z };
    sim.onDraw(() => {
      const p = sim.p, z = p.z, n = Math.round(p.n), d = p.dist;
      v3.begin();
      v3.axes({ len: 1.7, neg: 1.4 });
      const P = [0, 0, z];
      const els = [];
      if (d === 'ring') {
        const pts = [];
        for (let i = 0; i <= 96; i++) pts.push([Math.cos((2 * Math.PI * i) / 96), Math.sin((2 * Math.PI * i) / 96), 0]);
        v3.polyline(pts, { color: '--pos', width: 4 });
        for (let i = 0; i < n; i++) { const a = (2 * Math.PI * (i + 0.5)) / n; els.push({ r: [Math.cos(a), Math.sin(a), 0], w: 1 / n }); }
      } else if (d === 'disk') {
        v3.mesh((r, a) => [r * Math.cos(a), r * Math.sin(a), 0], 0, 1, 4, 0, 2 * Math.PI, 48, { fill: '--pos', alpha: 0.28, seam: true });
        const pts = [];
        for (let i = 0; i <= 96; i++) pts.push([Math.cos((2 * Math.PI * i) / 96), Math.sin((2 * Math.PI * i) / 96), 0]);
        v3.polyline(pts, { color: '--pos', width: 2 });
        const rings = 3;
        for (let j = 0; j < rings; j++) {
          const rr = (j + 0.5) / rings, m = Math.max(3, Math.round((n * (2 * j + 1)) / (rings * rings)));
          for (let i = 0; i < m; i++) { const a = (2 * Math.PI * (i + 0.5)) / m + j * 0.3; els.push({ r: [rr * Math.cos(a), rr * Math.sin(a), 0], w: ((2 * j + 1) / (rings * rings)) / m }); }
        }
      } else {
        v3.line([-1, 0, 0], [1, 0, 0], { color: '--pos', width: 5, seg: 8 });
        for (let i = 0; i < n; i++) { const x = -1 + (2 * (i + 0.5)) / n; els.push({ r: [x, 0, 0], w: 1 / n }); }
      }
      /* contribuciones */
      const Ex = exact[d](z);
      const s = 1.1 / Math.max(Ex, 0.25);
      const mag = n / 3;
      let net = [0, 0, 0];
      els.forEach((e) => {
        const R = V.sub(P, e.r), r3 = Math.pow(V.norm(R), 3);
        const dE = V.scale(R, e.w / r3);
        net = V.add(net, dE);
        if (p.lines) v3.line(e.r, P, { color: '--c5', width: 0.7, alpha: 0.35, dash: [2, 3] });
        v3.arrow(P, V.add(P, V.scale(dE, s * mag)), { color: '--c5', width: 1.3, head: 7, alpha: 0.85 });
        v3.point(e.r, { r: 3.2, color: '--pos', ring: false });
      });
      v3.arrow(P, V.add(P, [0, 0, Ex * s]), { color: '--accent', width: 3.4, head: 12 });
      v3.point(P, { r: 5, color: '--ink' });
      v3.text(P, 'P', { size: 13, weight: 700, dx: -12, dy: 4 });
      v3.text(V.add(P, [0, 0, Ex * s + 0.18]), 'E', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--accent' });
      v3.render();
      /* gráfica */
      EM.draw.clear(cp);
      const ymax = d === 'ring' ? 0.5 : d === 'disk' ? 2.4 : 3;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 5, ymin: 0, ymax, xlabel: 'z / a', ylabel: 'E  (kQ/a²)' });
      pl.frame();
      pl.fn((zz) => 1 / (zz * zz), { color: '--c1', width: 1.6, dash: [6, 4], from: 0.02 });
      if (limit[d]) pl.fn(limit[d], { color: '--c3', width: 1.6, dash: [6, 4], from: 0.02 });
      pl.fn(exact[d], { color: '--accent', width: 2.4, from: d === 'seg' ? 0.02 : 0 });
      if (d === 'ring') { pl.vline(1 / Math.SQRT2, { color: '--ink-3', label: 'z = a/√2' }); }
      pl.dot(z, Ex, { color: '--accent', r: 5 });
      sim.set('E', EM.fix(Ex, 4));
      sim.set('Ep', EM.fix(1 / (z * z), 4));
      sim.set('El', d === 'disk' ? '2.0000 (plano σ/2ε₀)' : d === 'seg' ? EM.fix(1 / z, 4) + ' (línea λ/2πε₀z)' : '—');
    });
  });

  /* ======================================================================
     5.4 Deflexión entre placas (SI)
     ====================================================================== */
  EM.defineSim('crt-deflection', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.4 });
    const view = new EM.View2D(cv, { xmin: -5, xmax: 40, ymin: -9, ymax: 9 });
    const PART = { e: { n: 'Electrón', q: -K.e, m: K.me }, p: { n: 'Protón', q: K.e, m: K.mp }, a: { n: 'Partícula α', q: 2 * K.e, m: 6.644657e-27 } };
    sim.group('Partícula y cañón');
    sim.select('part', { options: [['e', 'Electrón'], ['p', 'Protón'], ['a', 'Partícula alfa']], value: 'e' });
    sim.slider('Va', { label: 'Voltaje de aceleración <i>V<sub>a</sub></i>', min: 100, max: 5000, value: 1500, log: true, step: 10, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.group('Placas deflectoras');
    sim.slider('Vp', { label: '<i>V<sub>p</sub></i> = <i>V</i><sub>sup</sub> − <i>V</i><sub>inf</sub>', min: -400, max: 400, step: 5, value: 120, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'Longitud ℓ', min: 1, max: 8, step: 0.1, value: 4, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('s', { label: 'Separación <i>s</i>', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 'cm', fmt: f2 });
    sim.slider('D', { label: 'Distancia a la pantalla <i>D</i>', min: 5, max: 30, step: 0.5, value: 20, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.out('v0', 'Rapidez inicial <i>v</i><sub>0</sub>');
    sim.out('E', 'Campo entre placas');
    sim.out('t', 'Tiempo entre placas');
    sim.out('y1', 'Desviación a la salida');
    sim.out('Y', 'Desviación en la pantalla <i>Y</i>', { hl: true });
    sim.out('Yf', 'Fórmula <i>V<sub>p</sub></i>ℓ(ℓ/2+<i>D</i>)/(2<i>sV<sub>a</sub></i>)');
    sim.onDraw(() => {
      const p = sim.p, pt = PART[p.part];
      const l = p.l * 1e-2, s = p.s * 1e-2, D = p.D * 1e-2;
      const v0 = Math.sqrt((2 * Math.abs(pt.q) * p.Va) / pt.m);
      const Ey = -p.Vp / s; /* V/m, dirección y */
      const ay = (pt.q * Ey) / pt.m;
      const tp = l / v0;
      /* ¿choca con una placa? */
      let hit = false, xhit = l;
      if (Math.abs(0.5 * ay * tp * tp) >= s / 2) { hit = true; const th = Math.sqrt(s / Math.abs(ay)); xhit = v0 * th; }
      const y1 = 0.5 * ay * tp * tp, vy = ay * tp;
      const Y = y1 + (vy / v0) * D;
      const Yf = (-Math.sign(pt.q) * p.Vp * l * (l / 2 + D)) / (2 * s * p.Va);
      view.setRange({ xmin: -5, xmax: p.l + p.D + 3, ymin: -Math.max(5, p.s), ymax: Math.max(5, p.s) });
      view.update();
      EM.draw.clear(cv);
      view.grid({ xlabel: 'x (cm)', ylabel: 'y (cm)' });
      const ctx = cv.ctx;
      /* cañón */
      ctx.fillStyle = EM.col('--surface-3');
      ctx.strokeStyle = EM.col('--ink-3');
      ctx.fillRect(view.X(-4.5), view.Y(0.5), view.X(-1.5) - view.X(-4.5), view.Y(-0.5) - view.Y(0.5));
      ctx.strokeRect(view.X(-4.5), view.Y(0.5), view.X(-1.5) - view.X(-4.5), view.Y(-0.5) - view.Y(0.5));
      EM.text(ctx, 'cañón', view.X(-3), view.Y(0.8), { size: 11, color: '--ink-2', align: 'center', halo: true });
      /* placas */
      const top = p.s / 2, bot = -p.s / 2;
      const colTop = p.Vp > 0 ? '--pos' : p.Vp < 0 ? '--neg' : '--ink-3';
      const colBot = p.Vp > 0 ? '--neg' : p.Vp < 0 ? '--pos' : '--ink-3';
      ctx.fillStyle = EM.col(colTop);
      ctx.fillRect(view.X(0), view.Y(top) - 5, view.X(p.l) - view.X(0), 5);
      ctx.fillStyle = EM.col(colBot);
      ctx.fillRect(view.X(0), view.Y(bot), view.X(p.l) - view.X(0), 5);
      /* flechas de campo */
      if (p.Vp !== 0) {
        for (let i = 1; i < 5; i++) {
          const xx = (p.l * i) / 5;
          const a = view.Y(top) + 4, b = view.Y(bot) - 4;
          if (p.Vp > 0) EM.draw.arrow(ctx, view.X(xx), a, view.X(xx), b, { color: '--efield', width: 1.3, head: 7, alpha: 0.8 });
          else EM.draw.arrow(ctx, view.X(xx), b, view.X(xx), a, { color: '--efield', width: 1.3, head: 7, alpha: 0.8 });
        }
        EM.text(ctx, 'E', view.X(p.l) + 8, view.Y(0), { size: 13, weight: 700, family: EM.FONT_MATH, color: '--efield', halo: true, baseline: 'middle' });
      }
      /* pantalla */
      const xs = p.l + p.D;
      ctx.fillStyle = EM.col('--c3');
      ctx.fillRect(view.X(xs), view.Y(view.o.ymax), 6, view.Y(view.o.ymin) - view.Y(view.o.ymax));
      EM.text(ctx, 'pantalla', view.X(xs) - 6, view.Y(view.o.ymax) + 14, { size: 11, color: '--ink-2', align: 'right', halo: true });
      /* trayectoria */
      const pts = [[view.X(-1.5), view.Y(0)], [view.X(0), view.Y(0)]];
      const xe = hit ? xhit : l;
      for (let i = 1; i <= 60; i++) {
        const x = (xe * i) / 60, t = x / v0;
        pts.push([view.X(x * 100), view.Y(0.5 * ay * t * t * 100)]);
      }
      if (!hit) pts.push([view.X(xs), view.Y(Y * 100)]);
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2.4 });
      const last = pts[pts.length - 1];
      ctx.beginPath(); ctx.arc(last[0], last[1], hit ? 5 : 6, 0, 7);
      ctx.fillStyle = EM.col(hit ? '--warn-ink' : '--accent'); ctx.fill();
      if (hit) EM.text(ctx, '¡choca con la placa!', last[0] + 8, last[1] + (ay > 0 ? -10 : 18), { size: 12, weight: 600, color: '--warn-ink', halo: true });
      else EM.text(ctx, 'Y = ' + EM.fix(Y * 100, 2) + ' cm', view.X(xs) - 8, last[1] + (Y >= 0 ? -10 : 18), { size: 12, mono: true, color: '--accent', align: 'right', halo: true });
      sim.set('v0', EM.si(v0, 'm/s'));
      sim.set('E', EM.si(Math.abs(Ey), 'V/m'));
      sim.set('t', EM.si(tp, 's'));
      sim.set('y1', hit ? '—' : EM.fix(y1 * 1000, 2) + ' mm');
      sim.set('Y', hit ? 'no llega' : EM.fix(Y * 100, 3) + ' cm');
      sim.set('Yf', EM.fix(Yf * 100, 3) + ' cm');
    });
  });

  /* ======================================================================
     5.5 Millikan
     ====================================================================== */
  EM.defineSim('millikan', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    const rho = 886, rhoA = 1.2, eta = 1.81e-5, g = 9.81, d = 5e-3;
    let drop = { r: 1.0e-6, n: 3 };
    let y = 0; /* µm respecto al centro */
    const log = [];
    const newDrop = () => { drop = { r: (0.6 + Math.random() * 0.9) * 1e-6, n: 1 + Math.floor(Math.random() * 8) }; y = 0; };
    sim.group('Placas');
    sim.slider('V', { label: 'Voltaje entre placas <i>V</i>', min: 0, max: 1500, step: 1, value: 300, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.note('Separación <i>d</i> = 5.00 mm. Placa superior positiva; la gota tiene carga negativa, así que la fuerza eléctrica es hacia arriba.');
    sim.button('Nueva gota', () => { newDrop(); }, { primary: false });
    sim.button('Registrar medida', () => {
      const m = mass();
      const q = (m * g * d) / sim.p.V;
      log.push({ V: sim.p.V, q, v: vel() });
      if (log.length > 8) log.shift();
      renderLog();
    });
    const logBox = sim.note('');
    const renderLog = () => {
      if (!log.length) { logBox.innerHTML = 'Registre la medida cuando la gota esté quieta.'; return; }
      logBox.innerHTML = '<b>Medidas</b> (q = mgd/V):<br>' + log.map((e, i) => `${i + 1}. V = ${e.V.toFixed(0)} V → q = ${EM.sci(e.q, 3)} C = ${EM.fix(e.q / K.e, 2)} e` + (Math.abs(e.v) > 2 ? ' <span class="warnv">(no estaba en reposo)</span>' : '')).join('<br>');
    };
    renderLog();
    const mass = () => (4 / 3) * Math.PI * drop.r ** 3 * (rho - rhoA);
    const vel = () => { const F = (drop.n * K.e * sim.p.V) / d - mass() * g; return (F / (6 * Math.PI * eta * drop.r)) * 1e6; }; /* µm/s */
    sim.out('r', 'Radio de la gota (medido)');
    sim.out('m', 'Masa efectiva');
    sim.out('v', 'Velocidad (↑ +)', { hl: true });
    sim.animate((dt) => {
      y += vel() * dt;
      if (y > 480 || y < -480) y = 0;
    });
    sim.onDraw(() => {
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.44;
      /* campo del microscopio */
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.fillStyle = EM.isDark() ? '#05080c' : '#101820';
      ctx.fill();
      ctx.clip();
      /* retícula: 1000 µm de alto */
      const pxPerUm = (2 * R) / 1000;
      ctx.strokeStyle = 'rgba(160,200,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let u = -500; u <= 500; u += 50) { const yy = cy - u * pxPerUm; ctx.moveTo(cx - R, yy); ctx.lineTo(cx + R, yy); }
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(160,200,255,0.5)';
      ctx.beginPath();
      for (let u = -500; u <= 500; u += 250) { const yy = cy - u * pxPerUm; ctx.moveTo(cx - 14, yy); ctx.lineTo(cx + 14, yy); }
      ctx.stroke();
      /* gota */
      const gy = cy - y * pxPerUm;
      const gr = ctx.createRadialGradient(cx + 18, gy, 0, cx + 18, gy, 9);
      gr.addColorStop(0, 'rgba(255,245,200,1)');
      gr.addColorStop(0.4, 'rgba(255,220,120,0.8)');
      gr.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx + 18, gy, 9, 0, 7); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3; ctx.stroke();
      EM.text(ctx, '50 µm por división', cx + R - 4, cy + R + 16, { size: 11, color: '--ink-2', align: 'right' });
      EM.text(ctx, '+  placa superior', 12, 22, { size: 12, color: '--pos', weight: 600 });
      EM.text(ctx, '−  placa inferior', 12, h - 12, { size: 12, color: '--neg', weight: 600 });
      const m = mass();
      const Vb = (m * g * d) / (drop.n * K.e);
      sim.set('r', EM.fix(drop.r * 1e6, 3) + ' µm');
      sim.set('m', EM.sci(m, 3) + ' kg');
      sim.set('v', EM.fix(vel(), 1) + ' µm/s');
      void Vb;
    });
  });

  /* ======================================================================
     5.6 Dipolo en campo uniforme
     ====================================================================== */
  EM.defineSim('dipole-torque', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.05 });
    const cp = sim.canvas({ aspect: 1.05 });
    sim.group('Dipolo');
    sim.slider('q', { label: 'Carga ±<i>q</i>', min: 1, max: 20, step: 0.5, value: 10, unit: 'nC', fmt: (v) => EM.fix(v, 1) });
    sim.slider('d', { label: 'Separación <i>d</i>', min: 1, max: 4, step: 0.1, value: 2, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('m', { label: 'Masa en cada extremo', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'g', fmt: (v) => EM.fix(v, 1) });
    sim.group('Campo y movimiento');
    sim.slider('E', { label: 'Campo <i>E</i>', min: 5, max: 200, step: 1, value: 100, unit: 'kN/C', fmt: (v) => v.toFixed(0) });
    sim.slider('th0', { label: 'Ángulo inicial', min: 5, max: 179, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('gam', { label: 'Amortiguamiento γ', min: 0, max: 2, step: 0.05, value: 0, unit: '1/s', fmt: f2 });
    let th = rad(60), w = 0, t = 0, lastCross = null, period = null, prevTh = th;
    const params = () => { const p = sim.p; const pd = p.q * 1e-9 * p.d * 1e-2; const I = 2 * p.m * 1e-3 * Math.pow(p.d * 1e-2 / 2, 2); return { pd, I, w0sq: (pd * p.E * 1e3) / I }; };
    const release = () => { th = rad(sim.p.th0); w = 0; t = 0; lastCross = null; period = null; };
    sim.button('Soltar desde el ángulo inicial', release, { primary: true });
    sim.onChange = (id) => { if (id === 'th0') release(); };
    sim.out('th', 'Ángulo <i>θ</i>');
    sim.out('tau', 'Torque <i>τ</i> = −<i>pE</i> sen <i>θ</i>');
    sim.out('U', 'Energía <i>U</i> = −<i>pE</i> cos <i>θ</i>');
    sim.out('w0', '<i>ω</i><sub>0</sub> = √(<i>pE</i>/<i>I</i>)');
    sim.out('T0', 'Período (pequeñas amplitudes)');
    sim.out('T', 'Período medido', { hl: true });
    sim.animate((dt) => {
      const { w0sq } = params();
      const gam = sim.p.gam;
      const n = 20, h = dt / n;
      for (let i = 0; i < n; i++) {
        const f = (a, b) => [b, -w0sq * Math.sin(a) - gam * b];
        const k1 = f(th, w), k2 = f(th + (h / 2) * k1[0], w + (h / 2) * k1[1]), k3 = f(th + (h / 2) * k2[0], w + (h / 2) * k2[1]), k4 = f(th + h * k3[0], w + h * k3[1]);
        prevTh = th;
        th += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        w += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        t += h;
        if (prevTh < 0 && th >= 0) { if (lastCross !== null) period = t - lastCross; lastCross = t; }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, { pd, I, w0sq } = params();
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      /* líneas de campo uniformes */
      for (let j = 1; j < 8; j++) {
        const yy = (H * j) / 8;
        ctx.strokeStyle = EM.alpha('--efield', 0.35);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(10, yy); ctx.lineTo(W - 10, yy); ctx.stroke();
        EM.draw.arrow(ctx, W * 0.5 - 8, yy, W * 0.5 + 8, yy, { color: EM.alpha('--efield', 0.6), width: 1.2, head: 7 });
      }
      EM.text(ctx, 'E', W - 22, 18, { size: 15, weight: 700, family: EM.FONT_MATH, color: '--efield', halo: true });
      const cx = W / 2, cy = H / 2, L = Math.min(W, H) * 0.3;
      const ux = Math.cos(th), uy = Math.sin(th);
      const xp = cx + ux * L, yp = cy - uy * L, xn = cx - ux * L, yn = cy + uy * L;
      ctx.strokeStyle = EM.col('--ink-2');
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(xn, yn); ctx.lineTo(xp, yp); ctx.stroke();
      /* fuerzas */
      EM.draw.arrow(ctx, xp, yp, xp + 50, yp, { color: '--pos', width: 2.6, head: 10 });
      EM.draw.arrow(ctx, xn, yn, xn - 50, yn, { color: '--neg', width: 2.6, head: 10 });
      EM.text(ctx, 'qE', xp + 30, yp - 8, { size: 12, color: '--pos', halo: true, family: EM.FONT_MATH, italic: true });
      EM.text(ctx, '−qE', xn - 36, yn - 8, { size: 12, color: '--neg', halo: true, family: EM.FONT_MATH, italic: true });
      EM.draw.charge(ctx, xp, yp, 1, { r: 11 });
      EM.draw.charge(ctx, xn, yn, -1, { r: 11 });
      EM.draw.arrow(ctx, cx - ux * L * 0.4, cy + uy * L * 0.4, cx + ux * L * 0.4, cy - uy * L * 0.4, { color: '--gold', width: 2.6, head: 10 });
      EM.text(ctx, 'p', cx + ux * L * 0.4 + 10, cy - uy * L * 0.4 - 6, { size: 14, weight: 700, family: EM.FONT_MATH, color: '--gold', halo: true });
      /* arco θ */
      ctx.strokeStyle = EM.col('--ink-3');
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + L * 1.1, cy); ctx.stroke();
      ctx.setLineDash([]);
      const thw = Math.atan2(Math.sin(th), Math.cos(th));
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, -thw, thw > 0); ctx.stroke();
      EM.text(ctx, 'θ', cx + 34 * Math.cos(thw / 2), cy - 34 * Math.sin(thw / 2), { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2', align: 'center', baseline: 'middle', halo: true });
      /* gráfica U(θ) y τ(θ) en unidades de pE */
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -Math.PI, xmax: Math.PI, ymin: -1.3, ymax: 1.3, xpi: true, xlabel: 'θ (rad)', ylabel: 'en unidades de pE', title: 'Energía y torque' });
      pl.frame();
      pl.fn((x) => -Math.cos(x), { color: '--c1', width: 2.2 });
      pl.fn((x) => -Math.sin(x), { color: '--c2', width: 1.8, dash: [6, 4] });
      const Etot = (0.5 * I * w * w) / (pd * p.E * 1e3) - Math.cos(th);
      pl.hline(Etot, { color: '--c3', dash: [4, 3], label: 'energía total', labelRight: true });
      pl.dot(thw, -Math.cos(thw), { color: '--c1', r: 5.5 });
      pl.legend([{ label: 'U/pE = −cos θ', color: '--c1' }, { label: 'τ/pE = −sen θ', color: '--c2', dash: [6, 4] }], 'bl');
      const w0 = Math.sqrt(w0sq);
      sim.set('th', EM.fix(deg(thw), 1) + '°');
      sim.set('tau', EM.si(-pd * p.E * 1e3 * Math.sin(th), 'N·m'));
      sim.set('U', EM.si(-pd * p.E * 1e3 * Math.cos(th), 'J'));
      sim.set('w0', EM.fix(w0, 2) + ' rad/s');
      sim.set('T0', EM.fix((2 * Math.PI) / w0, 3) + ' s');
      sim.set('T', period ? EM.fix(period, 3) + ' s' : '—');
    });
  });
})();
