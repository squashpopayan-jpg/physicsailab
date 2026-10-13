/* Capítulo 12 — Circuitos de corriente continua */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, CK = EM.ckt;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const ohm = (v) => EM.si(v, 'Ω');

  /* Dibuja puntos de corriente en un tramo; I>0 va de pts[0] a pts[fin] */
  function flowOn(ctx, pts, I, phase, o = {}) {
    if (Math.abs(I) < 1e-9) return;
    const path = I > 0 ? pts : pts.slice().reverse();
    CK.flow(ctx, path, phase, Object.assign({ color: '--accent', r: 3, spacing: 24 }, o));
  }

  /* ======================================================================
     12.1 Fuente con resistencia interna
     ====================================================================== */
  EM.defineSim('battery-internal', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 1.9 });
    sim.group('Fuente');
    sim.slider('E', { label: 'Fem ℰ', min: 1, max: 24, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('r', { label: 'Resistencia interna <i>r</i>', min: 0.1, max: 10, step: 0.1, value: 2, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.group('Carga');
    sim.slider('R', { label: 'Resistencia de carga <i>R</i>', min: 0.01, max: 200, value: 5, log: true, step: 0.01, unit: 'Ω', fmt: (v) => EM.sci(v, 3) });
    sim.seg('plot', { label: 'Gráfica', options: [['P', 'Potencia P(R)'], ['V', 'Característica V(I)']], value: 'P' });
    sim.out('I', 'Corriente <i>I</i>', { hl: true });
    sim.out('Vab', 'Tensión en bornes <i>V<sub>ab</sub></i>');
    sim.out('PL', 'Potencia en la carga');
    sim.out('Pr', 'Potencia perdida en <i>r</i>');
    sim.out('eta', 'Rendimiento <i>R</i>/(<i>R</i>+<i>r</i>)');
    let ph = 0;
    sim.animate((dt) => { const p = sim.p; ph += dt * 60 * (p.E / (p.R + p.r)); });
    sim.onDraw(() => {
      const p = sim.p, I = p.E / (p.R + p.r), Vab = p.E - I * p.r;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L = w * 0.2, Rx = w * 0.72, T = h * 0.2, B = h * 0.82;
      /* fuente real (recuadro punteado) */
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(L - 42, T + 4, 84, B - T - 8); ctx.restore();
      EM.text(ctx, 'fuente real', L, T - 2, { size: 11, color: '--ink-3', align: 'center' });
      CK.battery(ctx, L, B, L, (T + B) / 2 + 4, { label: 'ℰ', labelSide: -1, labelOff: 18 });
      CK.resistor(ctx, L, (T + B) / 2 + 4, L, T, { label: 'r', labelSide: -1, labelOff: 16, len: 30 });
      CK.wire(ctx, [[L, T], [Rx, T]]);
      CK.resistor(ctx, Rx, T, Rx, B, { label: 'R = ' + ohm(p.R), labelSide: 1, labelOff: 16 });
      CK.wire(ctx, [[Rx, B], [L, B]]);
      CK.node(ctx, L + 50, T); CK.node(ctx, L + 50, B);
      EM.text(ctx, 'a', L + 50, T - 10, { size: 12, italic: true, family: EM.FONT_MATH, align: 'center' });
      EM.text(ctx, 'b', L + 50, B + 18, { size: 12, italic: true, family: EM.FONT_MATH, align: 'center' });
      flowOn(ctx, [[L, B], [L, T], [Rx, T], [Rx, B], [L, B]], I, ph, {});
      EM.text(ctx, 'V_{ab} = ' + f2(Vab) + ' V', (L + Rx) / 2, (T + B) / 2, { size: 13, mono: true, color: '--c1', align: 'center', halo: true });
      /* gráfica */
      EM.draw.clear(cp);
      if (p.plot === 'P') {
        const Pmax = (p.E * p.E) / (4 * p.r);
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.01, xmax: 200, xlog: true, ymin: 0, ymax: Pmax * 1.2, xlabel: 'R (Ω)', ylabel: 'P (W)' });
        pl.frame();
        pl.fn((R) => (p.E * p.E * R) / (R + p.r) ** 2, { color: '--c1', width: 2.4, fill: '--c1', fillAlpha: 0.08 });
        pl.fn((R) => (Pmax * 1.2 * R) / (R + p.r), { color: '--c3', width: 1.5, dash: [5, 4] });
        pl.vline(p.r, { color: '--ink-3', label: 'R = r' });
        pl.dot(p.R, I * I * p.R, { color: '--accent', r: 5.5 });
        pl.legend([{ label: 'potencia en la carga', color: '--c1' }, { label: 'rendimiento (escala: 100 % arriba)', color: '--c3', dash: [5, 4] }], 'tl');
      } else {
        const Imax = p.E / p.r;
        const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: Imax * 1.05, ymin: 0, ymax: p.E * 1.15, xlabel: 'I (A)', ylabel: 'V_{ab} (V)' });
        pl.frame();
        pl.fn((i) => p.E - i * p.r, { color: '--c1', width: 2.4 });
        pl.fn((i) => i * p.R, { color: '--c4', width: 1.6, dash: [5, 4] });
        pl.hline(p.E, { color: '--ink-3', label: 'ℰ (circuito abierto)' });
        pl.dot(I, Vab, { color: '--accent', r: 5.5, label: 'punto de operación' });
        pl.legend([{ label: 'fuente: V = ℰ − Ir', color: '--c1' }, { label: 'carga: V = IR', color: '--c4', dash: [5, 4] }], 'tr');
      }
      sim.set('I', EM.si(I, 'A'));
      sim.set('Vab', EM.si(Vab, 'V'));
      sim.set('PL', EM.si(I * I * p.R, 'W'));
      sim.set('Pr', EM.si(I * I * p.r, 'W'));
      sim.set('eta', EM.fix((100 * p.R) / (p.R + p.r), 1) + ' %');
    });
  });

  /* ======================================================================
     12.2 Circuito de dos mallas (Kirchhoff)
     ====================================================================== */
  EM.defineSim('kirchhoff', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.group('Fuentes');
    sim.slider('E1', { label: 'ℰ<sub>1</sub> (izquierda)', min: 0, max: 24, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('E2', { label: 'ℰ<sub>2</sub> (derecha)', min: 0, max: 24, step: 0.5, value: 6, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.group('Resistores');
    sim.slider('R1', { label: '<i>R</i><sub>1</sub>', min: 0.5, max: 20, step: 0.5, value: 4, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R2', { label: '<i>R</i><sub>2</sub>', min: 0.5, max: 20, step: 0.5, value: 6, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R3', { label: '<i>R</i><sub>3</sub>', min: 0.5, max: 20, step: 0.5, value: 3, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.out('Va', 'Potencial del nodo <i>a</i>', { hl: true });
    sim.out('I1', '<i>I</i><sub>1</sub> (↑ rama izquierda)');
    sim.out('I2', '<i>I</i><sub>2</sub> (↓ rama central)');
    sim.out('I3', '<i>I</i><sub>3</sub> (↑ rama derecha)');
    sim.outSep();
    sim.out('Pin', 'Potencia entregada por las fuentes');
    sim.out('Pout', 'Potencia en resistores');
    const ph = [0, 0, 0];
    const solve = (p) => {
      const Va = (p.E1 / p.R1 + p.E2 / p.R3) / (1 / p.R1 + 1 / p.R2 + 1 / p.R3);
      return { Va, I1: (p.E1 - Va) / p.R1, I2: Va / p.R2, I3: (p.E2 - Va) / p.R3 };
    };
    sim.animate((dt) => { const s = solve(sim.p); ph[0] += 40 * s.I1 * dt; ph[1] += 40 * s.I2 * dt; ph[2] += 40 * s.I3 * dt; });
    sim.onDraw(() => {
      const p = sim.p, s = solve(p);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L = w * 0.16, Mx = w * 0.5, Rx = w * 0.84, T = h * 0.18, B = h * 0.85, Y = (T + B) / 2;
      CK.wire(ctx, [[L, T], [Rx, T]]);
      CK.wire(ctx, [[L, B], [Rx, B]]);
      CK.battery(ctx, L, B, L, Y + 10, { label: 'ℰ₁ = ' + EM.fix(p.E1, 1) + ' V', labelSide: -1, labelOff: 20 });
      CK.resistor(ctx, L, Y + 10, L, T, { label: 'R₁ = ' + EM.fix(p.R1, 1) + ' Ω', labelSide: -1, labelOff: 16 });
      CK.resistor(ctx, Mx, T, Mx, B, { label: 'R₂ = ' + EM.fix(p.R2, 1) + ' Ω', labelSide: -1, labelOff: 16 });
      CK.battery(ctx, Rx, B, Rx, Y + 10, { label: 'ℰ₂ = ' + EM.fix(p.E2, 1) + ' V', labelSide: 1, labelOff: 20 });
      CK.resistor(ctx, Rx, Y + 10, Rx, T, { label: 'R₃ = ' + EM.fix(p.R3, 1) + ' Ω', labelSide: 1, labelOff: 16 });
      CK.node(ctx, Mx, T); CK.node(ctx, Mx, B);
      CK.ground(ctx, Mx, B + 2);
      EM.text(ctx, 'a  (' + EM.fix(s.Va, 2) + ' V)', Mx, T - 12, { size: 12.5, weight: 600, align: 'center', color: '--ink' });
      EM.text(ctx, 'b  (0 V)', Mx + 16, B - 10, { size: 12, color: '--ink-2' });
      /* corrientes */
      flowOn(ctx, [[L, B], [L, T], [Mx, T]], s.I1, ph[0]);
      flowOn(ctx, [[Mx, B], [L, B]], s.I1, ph[0]);
      flowOn(ctx, [[Mx, T], [Mx, B]], s.I2, ph[1]);
      flowOn(ctx, [[Rx, B], [Rx, T], [Mx, T]], s.I3, ph[2]);
      flowOn(ctx, [[Mx, B], [Rx, B]], s.I3, ph[2]);
      const lab = (x, y, t, I) => EM.text(ctx, t + ' = ' + EM.fix(I, 3) + ' A', x, y, { size: 12, mono: true, color: I >= 0 ? '--accent' : '--warn-ink', halo: true, align: 'center' });
      lab((L + Mx) / 2, T + 20, 'I₁', s.I1);
      lab(Mx + 78, Y + 56, 'I₂', s.I2);
      lab((Mx + Rx) / 2, T + 20, 'I₃', s.I3);
      const Pin = p.E1 * s.I1 + p.E2 * s.I3;
      const Pout = s.I1 * s.I1 * p.R1 + s.I2 * s.I2 * p.R2 + s.I3 * s.I3 * p.R3;
      sim.set('Va', f3(s.Va) + ' V');
      sim.set('I1', f3(s.I1) + ' A');
      sim.set('I2', f3(s.I2) + ' A');
      sim.set('I3', f3(s.I3) + ' A' + (s.I3 < 0 ? ' (ℰ₂ se carga)' : ''));
      sim.set('Pin', f3(Pin) + ' W');
      sim.set('Pout', f3(Pout) + ' W');
    });
  });

  /* ======================================================================
     12.3 Puente de Wheatstone
     ====================================================================== */
  EM.defineSim('wheatstone', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Brazos de referencia');
    sim.slider('R1', { label: '<i>R</i><sub>1</sub>', min: 10, max: 1000, step: 10, value: 100, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('R2', { label: '<i>R</i><sub>2</sub>', min: 10, max: 1000, step: 10, value: 250, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('R3', { label: '<i>R</i><sub>3</sub> (ajustable)', min: 1, max: 1000, value: 60, log: true, step: 0.5, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.group('Resistencia desconocida');
    sim.slider('Rx', { label: '<i>R<sub>x</sub></i>', min: 10, max: 1000, step: 1, value: 100, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.check('hide', { label: 'Ocultar <i>R<sub>x</sub></i> (práctica)', value: false });
    sim.group('Fuente y galvanómetro');
    sim.slider('V', { label: 'Fem de la fuente', min: 1, max: 12, step: 0.5, value: 6, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Rg', { label: 'Resistencia del galvanómetro', min: 10, max: 1000, step: 10, value: 50, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.out('Ig', 'Corriente en el galvanómetro', { hl: true });
    sim.out('Vcd', '<i>V<sub>C</sub></i> − <i>V<sub>D</sub></i>');
    sim.out('est', '<i>R</i><sub>2</sub><i>R</i><sub>3</sub>/<i>R</i><sub>1</sub>');
    const solve = (p) => {
      /* nodos C y D; A a V, B a 0 */
      const a11 = 1 / p.R1 + 1 / p.R2 + 1 / p.Rg, a12 = -1 / p.Rg, b1 = p.V / p.R1;
      const a21 = -1 / p.Rg, a22 = 1 / p.R3 + 1 / p.Rx + 1 / p.Rg, b2 = p.V / p.R3;
      const det = a11 * a22 - a12 * a21;
      const Vc = (b1 * a22 - a12 * b2) / det, Vd = (a11 * b2 - a21 * b1) / det;
      return { Vc, Vd, Ig: (Vc - Vd) / p.Rg };
    };
    sim.onDraw(() => {
      const p = sim.p, s = solve(p);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const cx = w * 0.46, T = h * 0.14, Bm = h * 0.86, Y = (T + Bm) / 2, dx = w * 0.22, x0 = w * 0.08;
      const A = [cx, T], Bn = [cx, Bm], C = [cx - dx, Y], D = [cx + dx, Y];
      CK.resistor(ctx, ...A, ...C, { label: 'R₁ = ' + p.R1 + ' Ω', labelSide: 1, labelOff: 22 });
      CK.resistor(ctx, ...C, ...Bn, { label: 'R₂ = ' + p.R2 + ' Ω', labelSide: 1, labelOff: 22 });
      CK.resistor(ctx, ...A, ...D, { label: 'R₃ = ' + EM.fix(p.R3, 1) + ' Ω', labelSide: -1, labelOff: 22 });
      CK.resistor(ctx, ...D, ...Bn, { label: p.hide ? 'Rₓ = ?' : 'Rₓ = ' + p.Rx + ' Ω', labelSide: -1, labelOff: 22, color: '--c5' });
      CK.meter(ctx, ...C, ...D, { letter: 'G', len: 34 });
      CK.wire(ctx, [A, [x0, T], [x0, Y - 16]]);
      CK.wire(ctx, [Bn, [x0, Bm], [x0, Y + 16]]);
      CK.battery(ctx, x0, Y + 16, x0, Y - 16, { label: EM.fix(p.V, 1) + ' V', labelSide: 1, labelOff: 20 });
      [A, Bn, C, D].forEach((q) => CK.node(ctx, q[0], q[1]));
      EM.text(ctx, 'C', C[0] - 14, C[1] + 4, { size: 13, weight: 700, align: 'center' });
      EM.text(ctx, 'D', D[0] + 14, D[1] + 4, { size: 13, weight: 700, align: 'center' });
      /* aguja del galvanómetro */
      const gr = Math.min(52, w * 0.07), gx = w - gr - 18, gy = T + gr + 16;
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + (k * Math.PI * 0.35) / 4; ctx.beginPath(); ctx.moveTo(gx + gr * Math.cos(a), gy + gr * Math.sin(a)); ctx.lineTo(gx + (gr - (k === 0 ? 10 : 6)) * Math.cos(a), gy + (gr - (k === 0 ? 10 : 6)) * Math.sin(a)); ctx.stroke(); }
      const defl = M.clamp(s.Ig / 2e-3, -1, 1) * Math.PI * 0.35;
      ctx.strokeStyle = EM.col(Math.abs(s.Ig) < 2e-6 ? '--c3' : '--warn-ink'); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (gr - 4) * Math.sin(defl), gy - (gr - 4) * Math.cos(defl)); ctx.stroke();
      ctx.restore();
      EM.text(ctx, Math.abs(s.Ig) < 2e-6 ? 'equilibrio' : 'escala ±2 mA', gx, gy + 16, { size: 11, color: '--ink-2', align: 'center' });
      sim.set('Ig', EM.si(s.Ig, 'A'));
      sim.set('Vcd', EM.si(s.Vc - s.Vd, 'V'));
      sim.set('est', EM.fix((p.R2 * p.R3) / p.R1, 1) + ' Ω' + (Math.abs(s.Ig) < 2e-6 ? ' = Rₓ' : ''));
    });
  });

  /* ======================================================================
     12.4 Circuito RC
     ====================================================================== */
  EM.defineSim('rc-circuit', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.1 });
    sim.group('Componentes');
    sim.slider('E', { label: 'Fem ℰ', min: 1, max: 24, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('R', { label: '<i>R</i>', min: 1, max: 100, step: 1, value: 20, unit: 'kΩ', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: '<i>C</i>', min: 10, max: 1000, step: 10, value: 100, unit: 'µF', fmt: (v) => v.toFixed(0) });
    sim.group('Interruptor');
    sim.seg('sw', { options: [['c', 'Cargar (a)'], ['d', 'Descargar (b)']], value: 'c', onInput: () => flip() });
    sim.button('Descargar por completo y reiniciar', () => { q = 0; t = 0; t0 = 0; q0 = 0; hist = []; Wb = 0; Wr = 0; sim.ctl.sw.set('c', true); mode = 'c'; });
    sim.note('Reproducción: una constante de tiempo por segundo.');
    sim.out('tau', '<i>τ</i> = <i>RC</i>');
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('vc', '<i>v<sub>C</sub></i>', { hl: true });
    sim.out('i', 'Corriente <i>i</i>');
    sim.outSep('Energía');
    sim.out('Wb', 'Entregada por la fuente');
    sim.out('Uc', 'Almacenada en <i>C</i>');
    sim.out('Wr', 'Disipada en <i>R</i>');
    let t = 0, t0 = 0, q0 = 0, q = 0, mode = 'c', hist = [], Wb = 0, Wr = 0, ph = 0;
    const tau = () => sim.p.R * 1e3 * sim.p.C * 1e-6;
    const Cf = () => sim.p.C * 1e-6;
    const qAt = (tt) => { const T = tau(); const qf = mode === 'c' ? Cf() * sim.p.E : 0; return qf + (q0 - qf) * Math.exp(-(tt - t0) / T); };
    const cur = () => { const T = tau(); const qf = mode === 'c' ? Cf() * sim.p.E : 0; return (-(q0 - qf) / T) * Math.exp(-(t - t0) / T); };
    function flip() { q0 = qAt(t); t0 = t; mode = sim.p.sw; }
    sim.onChange = (id) => { if (id === 'R' || id === 'C' || id === 'E') { q0 = q; t0 = t; } };
    sim.animate((dt) => {
      const T = tau(), n = 10;
      for (let k = 0; k < n; k++) {
        const h = (dt * T) / n;
        t += h;
        q = qAt(t);
        const i = cur();
        if (mode === 'c') Wb += sim.p.E * i * h;
        Wr += i * i * sim.p.R * 1e3 * h;
      }
      ph += dt * 90 * Math.abs(cur()) / (sim.p.E / (sim.p.R * 1e3));
      hist.push([t, q / Cf(), cur() * sim.p.R * 1e3]);
      while (hist.length && hist[0][0] < t - 6 * T) hist.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, T = tau(), i = cur(), vc = q / Cf();
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L = w * 0.1, xa = w * 0.26, xs = w * 0.34, Rx = w * 0.62, Cx = w * 0.8, T0 = h * 0.22, B = h * 0.84, yb = T0 + 36;
      CK.battery(ctx, L, B, L, T0, { label: 'ℰ', labelSide: -1, labelOff: 18 });
      CK.wire(ctx, [[L, T0], [xa, T0]]);
      CK.wire(ctx, [[xa, yb], [xa, B]]);
      CK.node(ctx, xa, T0); CK.node(ctx, xa, yb);
      EM.text(ctx, 'a', xa - 10, T0 - 8, { size: 12, italic: true, family: EM.FONT_MATH });
      EM.text(ctx, 'b', xa - 14, yb + 4, { size: 12, italic: true, family: EM.FONT_MATH });
      /* cuchilla */
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xs, T0); ctx.lineTo(mode === 'c' ? xa + 3 : xa + 3, mode === 'c' ? T0 : yb); ctx.stroke(); ctx.restore();
      CK.node(ctx, xs, T0);
      CK.resistor(ctx, xs, T0, Cx, T0, { label: 'R = ' + p.R + ' kΩ', labelSide: -1, labelOff: 18, len: 60 });
      CK.capacitor(ctx, Cx, T0, Cx, B, { label: 'C = ' + p.C + ' µF', labelSide: 1, labelOff: 20, charge: vc > 0.05 ? 1 : 0 });
      CK.wire(ctx, [[Cx, B], [L, B]]);
      CK.node(ctx, xa, B);
      const rel = Math.abs(i) / (p.E / (p.R * 1e3));
      if (rel > 0.01) {
        if (mode === 'c') {
          flowOn(ctx, [[L, B], [L, T0], [xa, T0], [xs, T0], [Cx, T0], [Cx, B - (B - T0) * 0.55]], 1, ph);
          flowOn(ctx, [[Cx, B - (B - T0) * 0.4], [Cx, B], [L, B]], 1, ph);
        } else {
          flowOn(ctx, [[Cx, B - (B - T0) * 0.55], [Cx, T0], [xs, T0], [xa, yb], [xa, B], [Cx, B], [Cx, B - (B - T0) * 0.4]], 1, ph);
        }
      }
      void Rx;
      /* gráfica */
      EM.draw.clear(cp);
      const tmin = Math.max(0, t - 6 * T), tmax = Math.max(6 * T, t);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: tmax - 6 * T, xmax: tmax, ymin: -p.E * 1.1, ymax: p.E * 1.15, xlabel: 't (s)', ylabel: 'tensión (V)' });
      pl.frame();
      pl.hline(p.E, { color: '--ink-3', label: 'ℰ', labelRight: true });
      pl.hline(p.E * (1 - Math.exp(-1)), { color: '--ink-3', dash: [2, 3], label: '63.2 % de ℰ', labelRight: true });
      if (hist.length > 1) {
        pl.path(hist.map((r) => [r[0], r[1]]), { color: '--c1', width: 2.4 });
        pl.path(hist.map((r) => [r[0], r[2]]), { color: '--c2', width: 2, dash: [6, 3] });
      }
      pl.legend([{ label: 'v_{C}', color: '--c1' }, { label: 'v_{R} = iR', color: '--c2', dash: [6, 3] }], 'bl');
      void tmin;
      sim.set('tau', EM.si(T, 's'));
      sim.set('t', EM.fix(t, 2) + ' s = ' + EM.fix(t / T, 2) + ' τ');
      sim.set('vc', EM.fix(vc, 3) + ' V');
      sim.set('i', EM.si(i, 'A'));
      sim.set('Wb', EM.si(Wb, 'J'));
      sim.set('Uc', EM.si(0.5 * Cf() * vc * vc, 'J'));
      sim.set('Wr', EM.si(Wr, 'J'));
    });
  });

  /* ======================================================================
     12.5 Efecto de carga de los instrumentos
     ====================================================================== */
  EM.defineSim('meter-loading', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.2 });
    sim.group('Instrumento');
    sim.seg('m', { options: [['v', 'Voltímetro'], ['a', 'Amperímetro']], value: 'v', onInput: () => vis() });
    const sR = sim.slider('Rdiv', { label: 'Resistores del divisor (iguales)', min: 100, max: 1e7, value: 1e5, log: true, step: 1, fmt: (v) => EM.si(v, 'Ω') });
    const sRv = sim.slider('Rv', { label: 'Resistencia interna del voltímetro', min: 1e3, max: 1e8, value: 1e6, log: true, step: 1, fmt: (v) => EM.si(v, 'Ω') });
    const sRL = sim.slider('RL', { label: 'Resistencia de carga', min: 1, max: 1e4, value: 10, log: true, step: 0.1, fmt: (v) => EM.si(v, 'Ω') });
    const sRa = sim.slider('Ra', { label: 'Resistencia interna del amperímetro', min: 1e-3, max: 100, value: 0.5, log: true, step: 0.001, fmt: (v) => EM.si(v, 'Ω') });
    function vis() { const v = sim.p.m === 'v'; sR.show(v); sRv.show(v); sRL.show(!v); sRa.show(!v); }
    vis();
    sim.out('true', 'Valor sin instrumento');
    sim.out('meas', 'Valor medido', { hl: true });
    sim.out('err', 'Error relativo');
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L = w * 0.14, Rx = w * 0.62, T = h * 0.18, B = h * 0.85, Y = (T + B) / 2;
      let tv, mv, unit, curve, xr, xlab, cx;
      if (p.m === 'v') {
        const V = 10, R = p.Rdiv;
        CK.battery(ctx, L, B, L, T, { label: '10 V', labelSide: -1, labelOff: 20 });
        CK.wire(ctx, [[L, T], [Rx, T]]);
        CK.resistor(ctx, Rx, T, Rx, Y, { label: 'R₁', labelSide: -1, labelOff: 14, len: 30 });
        CK.resistor(ctx, Rx, Y, Rx, B, { label: 'R₂', labelSide: -1, labelOff: 14, len: 30 });
        CK.wire(ctx, [[Rx, B], [L, B]]);
        const vx = w * 0.84;
        CK.wire(ctx, [[Rx, Y], [vx, Y]]); CK.wire(ctx, [[Rx, B], [vx, B]]);
        CK.meter(ctx, vx, Y, vx, B, { letter: 'V', label: 'R_{V}', labelSide: 1, labelOff: 22 });
        CK.node(ctx, Rx, Y); CK.node(ctx, Rx, B);
        tv = V / 2;
        const par = (R * p.Rv) / (R + p.Rv);
        mv = (V * par) / (R + par);
        unit = 'V';
        curve = (Rv) => { const pr = (R * Rv) / (R + Rv); return (100 * (tv - (V * pr) / (R + pr))) / tv; };
        xr = [1e3, 1e8]; xlab = 'resistencia del voltímetro (Ω)'; cx = p.Rv;
      } else {
        const V = 1.5;
        CK.battery(ctx, L, B, L, T, { label: '1.5 V', labelSide: -1, labelOff: 20 });
        CK.meter(ctx, L, T, Rx * 0.6, T, { letter: 'A', label: 'R_{A}', labelSide: -1, labelOff: 20 });
        CK.wire(ctx, [[Rx * 0.6, T], [Rx, T]]);
        CK.resistor(ctx, Rx, T, Rx, B, { label: 'R_{L}', labelSide: 1, labelOff: 16 });
        CK.wire(ctx, [[Rx, B], [L, B]]);
        tv = V / p.RL; mv = V / (p.RL + p.Ra); unit = 'A';
        curve = (Ra) => (100 * (tv - V / (p.RL + Ra))) / tv;
        xr = [1e-3, 100]; xlab = 'resistencia del amperímetro (Ω)'; cx = p.Ra;
      }
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: xr[0], xmax: xr[1], ymin: 1e-4, ymax: 100, xlog: true, ylog: true, xlabel: xlab, ylabel: 'error (%)' });
      pl.frame();
      pl.fn(curve, { color: '--c1', width: 2.2 });
      pl.hline(1, { color: '--ink-3', label: '1 %', labelRight: true });
      pl.dot(cx, Math.max(1e-4, curve(cx)), { color: '--accent', r: 5.5 });
      sim.set('true', EM.si(tv, unit, 4));
      sim.set('meas', EM.si(mv, unit, 4));
      sim.set('err', EM.fix((100 * (tv - mv)) / tv, 3) + ' %');
    });
  });
})();
