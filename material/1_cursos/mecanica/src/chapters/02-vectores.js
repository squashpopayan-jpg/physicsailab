/* Capítulo 2 — Vectores */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2);

  function sceneGrid(ctx, view, cv) {
    D.clear(cv);
    view.grid({ major: 1, minor: 0.5, labels: true, axes: false });
    MC.axes(ctx, view);
  }

  /* ======================================================================
     2.2  Componentes de un vector
     ====================================================================== */
  MC.defineSim('vector-comp', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new MC.View2D(cv, { xmin: -7.2, xmax: 7.2, ymin: -5.2, ymax: 5.2 });
    const A = { x: 3, y: 4 };
    sim.group('Componentes cartesianas');
    sim.slider('ax', { label: 'Componente <i>A<sub>x</sub></i>', min: -6.5, max: 6.5, step: 0.1, value: 3, fmt: f2 });
    sim.slider('ay', { label: 'Componente <i>A<sub>y</sub></i>', min: -4.8, max: 4.8, step: 0.1, value: 4, fmt: f2 });
    sim.group('Forma polar');
    sim.slider('mag', { label: 'Magnitud <i>A</i>', min: 0, max: 8, step: 0.05, value: 5, fmt: f2 });
    sim.slider('ang', { label: 'Ángulo θ (desde +x, antihorario)', min: 0, max: 359.9, step: 0.1, value: 53.13, unit: '°', fmt: f1 });
    sim.group('Mostrar');
    sim.check('snap', { label: 'Ajustar a la cuadrícula al arrastrar', value: true });
    sim.check('unit', { label: 'Vector unitario <i>Â</i>', value: true });
    sim.check('ij', { label: 'Vectores unitarios <i>î</i> y <i>ĵ</i>', value: true });
    sim.out('comp', 'Componentes (<i>A<sub>x</sub></i>, <i>A<sub>y</sub></i>)');
    sim.out('mag', 'Magnitud <i>A</i> = √(<i>A<sub>x</sub></i>² + <i>A<sub>y</sub></i>²)', { hl: true });
    sim.out('ang', 'Ángulo θ verdadero', { hl: true });
    sim.out('calc', 'Calculadora: tan⁻¹(<i>A<sub>y</sub></i>/<i>A<sub>x</sub></i>)');
    sim.out('quad', 'Cuadrante');
    sim.out('unit', 'Unitario <i>Â</i> = (cos θ, sen θ)');
    sim.presets([
      { id: 'p345', label: 'El triángulo 3-4-5', v: { ax: 3, ay: 4 } },
      { id: 'q2', label: 'Segundo cuadrante: (−3, 4)', v: { ax: -3, ay: 4 }, note: 'tan⁻¹(4/−3) = −53.1°, pero el vector apunta a 126.9°.' },
      { id: 'q3', label: 'Tercer cuadrante: (−4, −2)', v: { ax: -4, ay: -2 }, note: 'La calculadora da +26.6° (primer cuadrante); el ángulo real es 206.6°.' },
      { id: 'dron', label: 'Dron: 250 m a 30° al norte del oeste', v: { ax: -4.33, ay: 2.5 }, note: 'Escala: 1 unidad = 50 m. Componentes: −217 m (oeste) y +125 m (norte).' },
      { id: 'eje', label: 'Sobre el eje y: (0, −4)', v: { ax: 0, ay: -4 } }
    ]);
    const fromCart = () => {
      sim.ctl.mag.set(Math.hypot(A.x, A.y), true);
      sim.ctl.ang.set(MC.angDeg(A.x, A.y), true);
    };
    const fromPolar = () => {
      const t = M.rad(sim.p.ang);
      A.x = sim.p.mag * Math.cos(t); A.y = sim.p.mag * Math.sin(t);
      sim.ctl.ax.set(A.x, true); sim.ctl.ay.set(A.y, true);
    };
    sim.onChange = (id) => {
      if (id === 'ax' || id === 'ay' || id === 'preset') { A.x = sim.p.ax; A.y = sim.p.ay; fromCart(); }
      else if (id === 'mag' || id === 'ang') fromPolar();
    };
    MC.handles(sim, cv, view, () => [{ id: 'A', x: A.x, y: A.y }], (id, x, y) => {
      if (sim.p.snap) { x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; }
      A.x = M.clamp(x, -6.5, 6.5); A.y = M.clamp(y, -4.8, 4.8);
      sim.ctl.ax.set(A.x, true); sim.ctl.ay.set(A.y, true);
      fromCart();
      sim.changed('drag');
    });
    sim.hint('Arrastre la punta del vector', cv);
    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx;
      sceneGrid(ctx, view, cv);
      const O = [view.X(0), view.Y(0)], T = [view.X(A.x), view.Y(A.y)];
      const mag = Math.hypot(A.x, A.y), th = Math.atan2(A.y, A.x);
      /* proyecciones */
      D.line(ctx, T[0], T[1], T[0], O[1], { color: '--c1', dash: [4, 4], width: 1.2, alpha: 0.8 });
      D.line(ctx, T[0], T[1], O[0], T[1], { color: '--c1', dash: [4, 4], width: 1.2, alpha: 0.8 });
      /* componentes */
      if (Math.abs(A.x) > 0.05) {
        D.arrow(ctx, O[0], O[1], T[0], O[1], { color: '--c4', width: 3, halo: true });
        MC.text(ctx, `A_x = ${f2(A.x)}`, (O[0] + T[0]) / 2, O[1] + (A.y >= 0 ? 20 : -10), { size: 13, align: 'center', color: '--c4', halo: true, weight: 600 });
      }
      if (Math.abs(A.y) > 0.05) {
        D.arrow(ctx, O[0], O[1], O[0], T[1], { color: '--c5', width: 3, halo: true });
        MC.text(ctx, `A_y = ${f2(A.y)}`, O[0] + (A.x >= 0 ? -8 : 8), (O[1] + T[1]) / 2, { size: 13, align: A.x >= 0 ? 'right' : 'left', color: '--c5', halo: true, weight: 600 });
      }
      /* ángulo */
      if (mag > 0.2) {
        const a1 = th < 0 ? th + 2 * Math.PI : th;
        D.angle(ctx, O[0], O[1], Math.min(46, mag * view.s * 0.45), 0, a1, { label: 'θ', color: '--ink-2' });
      }
      /* î, ĵ */
      if (sim.p.ij) {
        D.arrow(ctx, O[0], O[1], view.X(1), O[1], { color: '--ink', width: 2.2 });
        D.arrow(ctx, O[0], O[1], O[0], view.Y(1), { color: '--ink', width: 2.2 });
        MC.text(ctx, 'î', view.X(1) - 2, O[1] + 16, { size: 15, math: true, align: 'center' });
        MC.text(ctx, 'ĵ', O[0] - 12, view.Y(1) + 4, { size: 15, math: true, align: 'center' });
      }
      /* vector principal */
      if (mag > 0.01) D.vec(ctx, O[0], O[1], T[0] - O[0], T[1] - O[1], { color: '--c1', label: 'A', width: 3.2, size: 16 });
      if (sim.p.unit && mag > 0.01) {
        const ux = A.x / mag, uy = A.y / mag;
        D.arrow(ctx, O[0], O[1], view.X(ux), view.Y(uy), { color: '--ink-3', width: 2.6 });
        MC.text(ctx, 'A', view.X(ux * 1.15) + 8, view.Y(uy * 1.15) + 4, { size: 14, math: true, hat: true, color: '--ink-3', halo: true });
      }
      D.circle(ctx, T[0], T[1], 6, { fill: '--c1', color: '--canvas', width: 2 });
      /* lecturas */
      const deg = MC.angDeg(A.x, A.y);
      const naive = A.x !== 0 ? M.deg(Math.atan(A.y / A.x)) : (A.y >= 0 ? 90 : -90);
      const quad = mag < 1e-9 ? '—' : A.x > 0 && A.y > 0 ? 'I' : A.x < 0 && A.y > 0 ? 'II' : A.x < 0 && A.y < 0 ? 'III' : A.x > 0 && A.y < 0 ? 'IV' : 'sobre un eje';
      sim.set('comp', `(${f2(A.x)}, ${f2(A.y)})`);
      sim.set('mag', f2(mag));
      sim.set('ang', `${f1(deg)}°`);
      const bad = Math.abs(((naive + 360) % 360) - deg) > 0.2;
      sim.set('calc', `${f1(naive)}°` + (bad && mag > 1e-9 ? ' <span class="warnv">(¡otro cuadrante!)</span>' : ''));
      sim.set('quad', quad);
      sim.set('unit', mag > 1e-9 ? `(${MC.fix(A.x / mag, 3)}, ${MC.fix(A.y / mag, 3)})` : '—');
    });
  });

  /* ======================================================================
     2.3  Suma y resta de vectores
     ====================================================================== */
  MC.defineSim('vector-suma', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new MC.View2D(cv, { xmin: -8.2, xmax: 8.2, ymin: -6, ymax: 6 });
    const V = { A: { x: 3, y: 1 }, B: { x: 1, y: 3 }, C: { x: -2, y: -1 } };
    const COL = { A: '--c1', B: '--c4', C: '--c5', R: '--ink' };
    sim.group('Operación y método');
    sim.seg('op', { label: 'Operación', options: [['suma', 'A + B'], ['resta', 'A − B'], ['tres', 'A + B + C']], value: 'suma' });
    sim.seg('met', { label: 'Método', options: [['cola', 'Punta con cola'], ['para', 'Paralelogramo'], ['comp', 'Componentes']], value: 'cola' });
    sim.group('Vectores (también se arrastran)');
    sim.slider('Ax', { label: '<i>A<sub>x</sub></i>', min: -8, max: 8, step: 0.1, value: 3, fmt: f1 });
    sim.slider('Ay', { label: '<i>A<sub>y</sub></i>', min: -6, max: 6, step: 0.1, value: 1, fmt: f1 });
    sim.slider('Bx', { label: '<i>B<sub>x</sub></i>', min: -8, max: 8, step: 0.1, value: 1, fmt: f1 });
    sim.slider('By', { label: '<i>B<sub>y</sub></i>', min: -6, max: 6, step: 0.1, value: 3, fmt: f1 });
    sim.slider('Cx', { label: '<i>C<sub>x</sub></i>', min: -8, max: 8, step: 0.1, value: -2, fmt: f1 });
    sim.slider('Cy', { label: '<i>C<sub>y</sub></i>', min: -6, max: 6, step: 0.1, value: -1, fmt: f1 });
    sim.check('snap', { label: 'Ajustar a la cuadrícula al arrastrar', value: true });
    sim.out('A', '<i>A</i> (magnitud, ángulo)');
    sim.out('B', '<i>B</i> (magnitud, ángulo)');
    sim.out('C', '<i>C</i> (magnitud, ángulo)');
    sim.out('Rc', 'Resultante (<i>R<sub>x</sub></i>, <i>R<sub>y</sub></i>)', { hl: true });
    sim.out('R', 'Magnitud <i>R</i>', { hl: true });
    sim.out('Ra', 'Ángulo de <i>R</i>');
    sim.presets([
      { id: 'caminata', label: 'Caminata: 3 cuadras al este y 4 al norte', v: { op: 'suma', met: 'cola', Ax: 3, Ay: 0, Bx: 0, By: 4 }, note: 'La resultante mide 5 cuadras a 53.1° al norte del este, aunque se caminaron 7.' },
      { id: 'tiraafloja', label: 'Tira y afloja: 800 N contra 650 N', v: { op: 'suma', met: 'comp', Ax: -4, Ay: 0, Bx: 3.25, By: 0 }, note: 'Escala: 1 unidad = 200 N. La resultante vale 0.75 unidades = 150 N hacia la izquierda.' },
      { id: 'avion', label: 'Avión (220 km/h al norte) con viento de 60 km/h al este', v: { op: 'suma', met: 'cola', Ax: 0, Ay: 5.5, Bx: 1.5, By: 0 }, note: 'Escala: 1 unidad = 40 km/h. Velocidad respecto al suelo: 228 km/h a 15.3° al este del norte.' },
      { id: 'cerrado', label: 'Tres fuerzas en equilibrio (polígono cerrado)', v: { op: 'tres', met: 'cola', Ax: -2.5, Ay: 3, Bx: 2.5, By: 2, Cx: 0, Cy: -5 }, note: 'Dos tensiones y el peso: al encadenarlas se vuelve al punto de partida, R = 0.' },
      { id: 'resta', label: 'Resta: cambio de velocidad Δv = v₂ − v₁', v: { op: 'resta', met: 'cola', Ax: 1, Ay: 4, Bx: 4, By: 1 }, note: 'A − B va de la punta de B a la punta de A cuando ambos salen del mismo origen.' }
    ]);
    const sync = () => {
      V.A.x = sim.p.Ax; V.A.y = sim.p.Ay; V.B.x = sim.p.Bx; V.B.y = sim.p.By; V.C.x = sim.p.Cx; V.C.y = sim.p.Cy;
      const three = sim.p.op === 'tres';
      sim.ctl.Cx.show(three); sim.ctl.Cy.show(three);
    };
    sim.onChange = () => sync();
    sync();
    const setV = (k, x, y) => {
      if (sim.p.snap) { x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; }
      x = M.clamp(x, -8, 8); y = M.clamp(y, -6, 6);
      V[k].x = x; V[k].y = y;
      sim.ctl[k + 'x'].set(x, true); sim.ctl[k + 'y'].set(y, true);
    };
    const bEff = () => (sim.p.op === 'resta' ? { x: -V.B.x, y: -V.B.y } : V.B);
    MC.handles(sim, cv, view, () => {
      const L = [{ id: 'A', x: V.A.x, y: V.A.y }];
      const be = bEff();
      if (sim.p.met === 'cola' || sim.p.op === 'tres') {
        L.push({ id: 'B', x: V.A.x + be.x, y: V.A.y + be.y });
        if (sim.p.op === 'tres') L.push({ id: 'C', x: V.A.x + be.x + V.C.x, y: V.A.y + be.y + V.C.y });
      } else L.push({ id: 'B', x: be.x, y: be.y });
      return L;
    }, (id, x, y) => {
      const s = sim.p.op === 'resta' ? -1 : 1;
      if (id === 'A') setV('A', x, y);
      else if (id === 'B') {
        if (sim.p.met === 'cola' || sim.p.op === 'tres') setV('B', s * (x - V.A.x), s * (y - V.A.y));
        else setV('B', s * x, s * y);
      } else if (id === 'C') { const be = bEff(); setV('C', x - V.A.x - be.x, y - V.A.y - be.y); }
      sim.changed('drag');
    });
    sim.hint('Arrastre las puntas de los vectores', cv);
    const vtxt = (v) => `${f2(Math.hypot(v.x, v.y))} a ${f1(MC.angDeg(v.x, v.y))}°`;
    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx;
      sceneGrid(ctx, view, cv);
      const op = sim.p.op, met = sim.p.met;
      const A = V.A, B = V.B, C = V.C, be = bEff();
      const R = { x: A.x + be.x + (op === 'tres' ? C.x : 0), y: A.y + be.y + (op === 'tres' ? C.y : 0) };
      const P = (x, y) => [view.X(x), view.Y(y)];
      const O = P(0, 0);
      const arrowW = (x0, y0, x1, y1, col, label, o = {}) => {
        const a = P(x0, y0), b = P(x1, y1);
        D.vec(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], Object.assign({ color: col, label, width: 3, size: 15 }, o));
      };
      const bl = op === 'resta' ? '−B' : 'B';
      if (met === 'cola' || (met === 'para' && op === 'tres')) {
        /* copias fantasma en el origen */
        arrowW(0, 0, be.x, be.y, COL.B, '', { alpha: 0.28, dash: [5, 4], width: 2 });
        if (op === 'resta') arrowW(0, 0, B.x, B.y, COL.B, 'B', { alpha: 0.5, width: 2 });
        if (op === 'tres') arrowW(0, 0, C.x, C.y, COL.C, '', { alpha: 0.28, dash: [5, 4], width: 2 });
        arrowW(0, 0, A.x, A.y, COL.A, 'A');
        arrowW(A.x, A.y, A.x + be.x, A.y + be.y, COL.B, bl);
        if (op === 'tres') arrowW(A.x + be.x, A.y + be.y, R.x, R.y, COL.C, 'C');
      } else if (met === 'para') {
        const S = P(A.x + be.x, A.y + be.y), a = P(A.x, A.y), b = P(be.x, be.y);
        D.poly(ctx, [O, a, S, b], { close: true, color: 'none', fill: '--c1', fillAlpha: 0.07 });
        D.line(ctx, a[0], a[1], S[0], S[1], { color: COL.B, dash: [5, 4], width: 1.5 });
        D.line(ctx, b[0], b[1], S[0], S[1], { color: COL.A, dash: [5, 4], width: 1.5 });
        if (op === 'resta') arrowW(0, 0, B.x, B.y, COL.B, 'B', { alpha: 0.45, width: 2 });
        arrowW(0, 0, A.x, A.y, COL.A, 'A');
        arrowW(0, 0, be.x, be.y, COL.B, bl);
      } else {
        /* componentes apiladas junto a los ejes */
        const list = [['A', A], ['B', be]].concat(op === 'tres' ? [['C', C]] : []);
        let sx = 0, sy = 0;
        list.forEach(([k, v], i) => {
          const yx = -0.35 - 0.3 * i, xy = -0.35 - 0.3 * i;
          if (Math.abs(v.x) > 0.02) D.arrow(ctx, view.X(sx), view.Y(yx), view.X(sx + v.x), view.Y(yx), { color: COL[k], width: 3.5, head: 8 });
          if (Math.abs(v.y) > 0.02) D.arrow(ctx, view.X(xy), view.Y(sy), view.X(xy), view.Y(sy + v.y), { color: COL[k], width: 3.5, head: 8 });
          sx += v.x; sy += v.y;
        });
        const yr = -0.35 - 0.3 * list.length - 0.15, xr = yr;
        if (Math.abs(R.x) > 0.02) D.arrow(ctx, view.X(0), view.Y(yr), view.X(R.x), view.Y(yr), { color: COL.R, width: 3.5, head: 8 });
        if (Math.abs(R.y) > 0.02) D.arrow(ctx, view.X(xr), view.Y(0), view.X(xr), view.Y(R.y), { color: COL.R, width: 3.5, head: 8 });
        MC.text(ctx, `R_x = ${f2(R.x)}`, view.X(R.x / 2), view.Y(yr) + 16, { size: 12, align: 'center', mono: true, halo: true });
        MC.text(ctx, `R_y = ${f2(R.y)}`, view.X(xr) - 6, view.Y(R.y / 2), { size: 12, align: 'right', mono: true, halo: true });
        D.line(ctx, view.X(R.x), view.Y(R.y), view.X(R.x), view.Y(yr), { color: '--ink-3', dash: [3, 3], width: 1 });
        D.line(ctx, view.X(R.x), view.Y(R.y), view.X(xr), view.Y(R.y), { color: '--ink-3', dash: [3, 3], width: 1 });
        arrowW(0, 0, A.x, A.y, COL.A, 'A', { width: 2.2 });
        arrowW(0, 0, be.x, be.y, COL.B, bl, { width: 2.2 });
        if (op === 'tres') arrowW(0, 0, C.x, C.y, COL.C, 'C', { width: 2.2 });
      }
      /* resultante */
      if (Math.hypot(R.x, R.y) > 0.03) arrowW(0, 0, R.x, R.y, COL.R, 'R', { width: 4.2, size: 16 });
      else { D.circle(ctx, O[0], O[1], 9, { color: '--ink', width: 2 }); MC.text(ctx, 'R = 0', O[0] + 12, O[1] - 12, { size: 13, weight: 600, halo: true }); }
      /* manijas */
      const hs = [];
      hs.push(P(A.x, A.y));
      if (met === 'cola' || op === 'tres') { hs.push(P(A.x + be.x, A.y + be.y)); if (op === 'tres') hs.push(P(R.x, R.y)); } else hs.push(P(be.x, be.y));
      hs.forEach((h) => D.circle(ctx, h[0], h[1], 5, { fill: '--canvas', color: '--ink-2', width: 1.5 }));
      sim.set('A', vtxt(A));
      sim.set('B', vtxt(B));
      sim.set('C', op === 'tres' ? vtxt(C) : '—');
      sim.set('Rc', `(${f2(R.x)}, ${f2(R.y)})`);
      sim.set('R', f2(Math.hypot(R.x, R.y)));
      sim.set('Ra', Math.hypot(R.x, R.y) > 1e-9 ? `${f1(MC.angDeg(R.x, R.y))}°` : '—');
    });
  });

  /* ======================================================================
     2.4  Productos escalar y vectorial
     ====================================================================== */
  MC.defineSim('vector-productos', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    const view = new MC.View2D(cv, { xmin: -7.2, xmax: 7.2, ymin: -5.2, ymax: 5.2 });
    const A = { x: 4, y: 1 }, B = { x: 1.5, y: 3 };
    sim.group('Producto');
    sim.seg('mode', { options: [['dot', 'Escalar A · B'], ['cross', 'Vectorial A × B']], value: 'dot' });
    sim.group('Vectores (también se arrastran)');
    sim.slider('Ax', { label: '<i>A<sub>x</sub></i>', min: -6.5, max: 6.5, step: 0.1, value: 4, fmt: f1 });
    sim.slider('Ay', { label: '<i>A<sub>y</sub></i>', min: -4.8, max: 4.8, step: 0.1, value: 1, fmt: f1 });
    sim.slider('Bx', { label: '<i>B<sub>x</sub></i>', min: -6.5, max: 6.5, step: 0.1, value: 1.5, fmt: f1 });
    sim.slider('By', { label: '<i>B<sub>y</sub></i>', min: -4.8, max: 4.8, step: 0.1, value: 3, fmt: f1 });
    sim.check('snap', { label: 'Ajustar a la cuadrícula al arrastrar', value: false });
    sim.out('th', 'Ángulo θ entre <i>A</i> y <i>B</i>');
    sim.out('d1', '<i>A<sub>x</sub>B<sub>x</sub></i> + <i>A<sub>y</sub>B<sub>y</sub></i>');
    sim.out('d2', '<i>AB</i> cos θ');
    sim.out('dot', '<i>A</i> · <i>B</i>', { hl: true });
    sim.outSep();
    sim.out('c1', '<i>A<sub>x</sub>B<sub>y</sub></i> − <i>A<sub>y</sub>B<sub>x</sub></i>');
    sim.out('c2', '|<i>A</i> × <i>B</i>| = <i>AB</i> sen θ');
    sim.out('cross', '<i>A</i> × <i>B</i>', { hl: true });
    sim.presets([
      { id: 'perp', label: 'Vectores perpendiculares', v: { Ax: 4, Ay: 0, Bx: 0, By: 3 }, note: 'A · B = 0 y |A × B| es máximo: 12.' },
      { id: 'paral', label: 'Vectores paralelos', v: { Ax: 3, Ay: 1, Bx: 4.5, By: 1.5 }, note: 'A × B = 0: no hay paralelogramo.' },
      { id: 'obtuso', label: 'Ángulo obtuso', v: { Ax: 4, Ay: 1, Bx: -3, By: 2, mode: 'dot' }, note: 'La proyección de B cae detrás del origen: el producto escalar es negativo.' },
      { id: 'trabajo', label: 'Trabajo: fuerza inclinada 30° sobre un desplazamiento', v: { Ax: 5, Ay: 0, Bx: 3.46, By: 2, mode: 'dot' }, note: 'A = d (5 m), B = F (4 N a 30°). W = F · d = 4·5·cos 30° = 17.3 J.' },
      { id: 'puerta', label: 'Torque al abrir una puerta', v: { Ax: 4, Ay: 0, Bx: 0.8, By: 3, mode: 'cross' }, note: 'A = r (de la bisagra al punto donde se empuja), B = F. El torque τ = r × F sale de la pantalla: la puerta gira en sentido antihorario.' }
    ]);
    const sync = () => { A.x = sim.p.Ax; A.y = sim.p.Ay; B.x = sim.p.Bx; B.y = sim.p.By; };
    sim.onChange = () => sync();
    MC.handles(sim, cv, view, () => [{ id: 'A', x: A.x, y: A.y }, { id: 'B', x: B.x, y: B.y }], (id, x, y) => {
      if (sim.p.snap) { x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; }
      x = M.clamp(x, -6.5, 6.5); y = M.clamp(y, -4.8, 4.8);
      if (id === 'A') { A.x = x; A.y = y; sim.ctl.Ax.set(x, true); sim.ctl.Ay.set(y, true); }
      else { B.x = x; B.y = y; sim.ctl.Bx.set(x, true); sim.ctl.By.set(y, true); }
      sim.changed('drag');
    });
    sim.hint('Arrastre las puntas de A y B', cv);
    sim.onDraw(() => {
      view.update();
      const ctx = cv.ctx;
      sceneGrid(ctx, view, cv);
      const O = [view.X(0), view.Y(0)];
      const a = Math.hypot(A.x, A.y), b = Math.hypot(B.x, B.y);
      const dot = A.x * B.x + A.y * B.y, cz = A.x * B.y - A.y * B.x;
      const th = a > 1e-9 && b > 1e-9 ? Math.acos(M.clamp(dot / (a * b), -1, 1)) : 0;
      const tA = Math.atan2(A.y, A.x), tB = Math.atan2(B.y, B.x);
      if (sim.p.mode === 'dot') {
        if (a > 1e-9) {
          /* recta de A */
          const ux = A.x / a, uy = A.y / a;
          D.line(ctx, view.X(-8 * ux), view.Y(-8 * uy), view.X(8 * ux), view.Y(8 * uy), { color: '--c1', alpha: 0.25, width: 1 });
          const pr = dot / a;
          const Px = ux * pr, Py = uy * pr;
          D.line(ctx, view.X(B.x), view.Y(B.y), view.X(Px), view.Y(Py), { color: '--ink-3', dash: [4, 3], width: 1.3 });
          const col = dot >= 0 ? '--vel' : '--weight';
          ctx.save();
          ctx.strokeStyle = MC.col(col);
          ctx.lineWidth = 7;
          ctx.globalAlpha = 0.55;
          ctx.lineCap = 'butt';
          ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(view.X(Px), view.Y(Py)); ctx.stroke();
          ctx.restore();
          MC.text(ctx, `B cos θ = ${f2(pr)}`, view.X(Px / 2) + uy * 22, view.Y(Py / 2) + ux * 22, { size: 12.5, align: 'center', color: col, halo: true, weight: 600 });
          /* marca de ángulo recto en el pie de la perpendicular */
          if (Math.abs(pr) > 0.3 && b * Math.sin(th) > 0.3) {
            const s = 0.25, nx = B.x - Px, ny = B.y - Py, nn = Math.hypot(nx, ny);
            const px2 = (nx / nn) * s, py2 = (ny / nn) * s, qx = -Math.sign(pr) * ux * s, qy = -Math.sign(pr) * uy * s;
            D.poly(ctx, [[view.X(Px + px2), view.Y(Py + py2)], [view.X(Px + px2 + qx), view.Y(Py + py2 + qy)], [view.X(Px + qx), view.Y(Py + qy)]], { color: '--ink-3', width: 1 });
          }
        }
      } else if (a > 1e-9 && b > 1e-9) {
        const pts = [O, [view.X(A.x), view.Y(A.y)], [view.X(A.x + B.x), view.Y(A.y + B.y)], [view.X(B.x), view.Y(B.y)]];
        const col = cz >= 0 ? '--c7' : '--c8';
        D.poly(ctx, pts, { close: true, color: col, width: 1.2, fill: col, fillAlpha: 0.16 });
        const cx = view.X((A.x + B.x) / 2), cy = view.Y((A.y + B.y) / 2);
        const r = M.clamp(Math.sqrt(Math.abs(cz)) * 5, 8, 24);
        if (Math.abs(cz) > 0.05) D.outIn(ctx, cx, cy, r, cz, { color: col });
        MC.text(ctx, `área = ${f2(Math.abs(cz))}`, cx, cy + r + 16, { size: 12.5, align: 'center', color: col, halo: true, weight: 600 });
        /* sentido de giro de A hacia B */
        let d = tB - tA;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) > 0.12) D.arcArrow(ctx, O[0], O[1], Math.min(a, b) * view.s * 0.45, tA, tA + d * 0.85, { color: col, width: 1.8 });
      }
      if (a > 1e-9 && b > 1e-9 && sim.p.mode === 'dot') {
        let d = tB - tA;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        D.angle(ctx, O[0], O[1], Math.min(40, Math.min(a, b) * view.s * 0.35), tA, tA + d, { label: 'θ' });
      }
      if (a > 1e-9) D.vec(ctx, O[0], O[1], view.X(A.x) - O[0], view.Y(A.y) - O[1], { color: '--c1', label: 'A', width: 3.2, size: 16 });
      if (b > 1e-9) D.vec(ctx, O[0], O[1], view.X(B.x) - O[0], view.Y(B.y) - O[1], { color: '--c4', label: 'B', width: 3.2, size: 16 });
      D.circle(ctx, view.X(A.x), view.Y(A.y), 5, { fill: '--canvas', color: '--c1', width: 1.5 });
      D.circle(ctx, view.X(B.x), view.Y(B.y), 5, { fill: '--canvas', color: '--c4', width: 1.5 });
      sim.set('th', `${f1(M.deg(th))}°`);
      sim.set('d1', `${f2(A.x * B.x)} + ${f2(A.y * B.y)}`);
      sim.set('d2', `${f2(a)}·${f2(b)}·${MC.fix(Math.cos(th), 3)}`);
      sim.set('dot', `${f2(dot)}` + (Math.abs(dot) < 1e-6 ? ' (perpendiculares)' : dot > 0 ? ' (agudo)' : ' (obtuso)'));
      sim.set('c1', `${f2(A.x * B.y)} − ${f2(A.y * B.x)}`);
      sim.set('c2', f2(a * b * Math.sin(th)));
      sim.set('cross', Math.abs(cz) < 1e-6 ? '0 (paralelos)' : `${f2(cz)} k̂ ${cz > 0 ? '⊙ sale' : '⊗ entra'}`);
    });
  });
})();
