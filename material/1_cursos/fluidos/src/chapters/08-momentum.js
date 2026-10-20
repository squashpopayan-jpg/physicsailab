/* Capítulo 8 — Cantidad de movimiento en volúmenes de control */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, RW = 998.2;

  /* 8.1 Chorro sobre un álabe */
  EM.defineSim('chorro-placa', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V', { label: 'Velocidad del chorro <i>V</i>', min: 5, max: 40, step: 0.5, value: 20, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('d', { label: 'Diámetro del chorro', min: 1, max: 10, step: 0.1, value: 5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('th', { label: 'Ángulo de desviación θ', min: 30, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('u', { label: 'Velocidad del álabe <i>u</i>', min: 0, max: 40, step: 0.5, value: 0, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.seg('m', { label: 'Caudal que recibe', options: [['uno', 'Álabe aislado'], ['rueda', 'Rueda de álabes']], value: 'uno' });
    sim.out('F', 'Fuerza <i>F</i><sub>x</sub> · <i>F</i><sub>y</sub> sobre el álabe', { hl: true });
    sim.out('P', 'Potencia <i>F</i><sub>x</sub><i>u</i>');
    sim.out('eta', 'Eficiencia <i>P</i>/(½ρ<i>QV</i>²)');
    let ph = 0;
    sim.animate((dt) => { ph = (ph + dt * 2) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const u = Math.min(p.u, p.V), A = (Math.PI * Math.pow(p.d / 100, 2)) / 4, th = (p.th * Math.PI) / 180, Vr = p.V - u;
      const Qr = p.m === 'uno' ? A * Vr : A * p.V;
      const Fx = RW * Qr * Vr * (1 - Math.cos(th)), Fy = -RW * Qr * Vr * Math.sin(th), P = Fx * u;
      /* dibujo */
      const cx = W * 0.32, cy = H * 0.55, R = Math.min(W, H) * 0.18, jw = Math.max(4, p.d * 2.2);
      ctx.fillStyle = EM.alpha('--water', 0.5); ctx.fillRect(20, cy - jw / 2, cx - R - 20, jw);
      for (let k = 0; k < 4; k++) { const x = 20 + ((ph + k / 4) % 1) * (cx - R - 30); EM.draw.arrow(ctx, x, cy, x + 18, cy, { color: '--water', width: 1.6 }); }
      /* álabe: arco que desvía θ hacia arriba */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.arc(cx - R, cy - R, R, Math.PI / 2, Math.PI / 2 - th, true); ctx.stroke();
      /* chorro de salida (en el sistema fijo, dirección aproximada por la relativa) */
      /* salida: punto del arco a θ y dirección (cos θ, −sen θ) en pantalla */
      const ex = cx - R + R * Math.sin(th), ey = cy - R + R * Math.cos(th);
      ctx.strokeStyle = EM.alpha('--water', 0.6); ctx.lineWidth = jw; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + 70 * Math.cos(th), ey - 70 * Math.sin(th)); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.strokeRect(cx - 2.4 * R, cy - 2.3 * R, 2.6 * R, 2.8 * R); ctx.setLineDash([]);
      EM.text(ctx, 'volumen de control', cx - 2.4 * R + 4, cy + 0.5 * R + 14, { size: 11, color: '--ink-3' });
      const sc = 90 / Math.max(1, 2 * RW * A * p.V * p.V);
      EM.draw.arrow(ctx, cx + 20, cy - R * 0.6, cx + 20 + Fx * sc, cy - R * 0.6, { color: '--accent', width: 3 });
      EM.draw.arrow(ctx, cx + 20, cy - R * 0.6, cx + 20, cy - R * 0.6 - Fy * sc, { color: '--c5', width: 2.2 });
      EM.text(ctx, 'F_x', cx + 24 + Fx * sc, cy - R * 0.6 - 6, { size: 12, color: '--accent', weight: 650 });
      if (u > 0) EM.draw.arrow(ctx, cx - R, cy + 0.6 * R, cx - R + 50, cy + 0.6 * R, { color: '--ink', width: 1.6 });
      if (u > 0) EM.text(ctx, 'u', cx - R + 54, cy + 0.6 * R + 4, { size: 13, italic: true, family: EM.FONT_MATH });
      /* potencia contra u/V */
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 'u/V', ylabel: 'P/(½ρAV³)' });
      pl.frame();
      const c = 1 - Math.cos(th);
      pl.fn((r) => 2 * c * r * (1 - r) * (1 - r), { color: '--c1', width: 2 });
      pl.fn((r) => 2 * c * r * (1 - r), { color: '--c3', width: 2 });
      pl.dot(u / p.V, P / (0.5 * RW * A * Math.pow(p.V, 3)), { color: '--accent', r: 6 });
      pl.legend([{ label: 'álabe aislado ∝ u(V−u)²', color: '--c1' }, { label: 'rueda ∝ u(V−u)', color: '--c3' }], 'tr');
      sim.set('F', EM.fix(Fx, 1) + ' N · ' + EM.fix(Fy, 1) + ' N (negativa: hacia abajo)');
      sim.set('P', EM.fix(P / 1000, 3) + ' kW');
      sim.set('eta', EM.fix((100 * P) / (0.5 * RW * A * p.V * p.V * p.V), 1) + ' %');
    });
  });

  /* 8.2 Codo con reducción */
  EM.defineSim('codo', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('th', { label: 'Ángulo del codo', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('D1', { label: 'Diámetro de entrada', min: 5, max: 60, step: 1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('D2', { label: 'Diámetro de salida', min: 5, max: 60, step: 1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Caudal', min: 1, max: 600, step: 1, value: 212, unit: 'L/s', fmt: (v) => v.toFixed(0) });
    sim.slider('p1', { label: 'Presión manométrica de entrada', min: 0, max: 1000, step: 5, value: 200, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.out('R', 'Fuerza del anclaje |<i>R</i>|', { hl: true });
    sim.out('Rc', '<i>R</i><sub>x</sub> · <i>R</i><sub>y</sub>');
    sim.out('V', 'Velocidades · presión de salida');
    sim.out('part', 'Aporte de la presión · de la cantidad de movimiento');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = (p.th * Math.PI) / 180;
      EM.draw.clear(cv);
      const A1 = (Math.PI * Math.pow(p.D1 / 100, 2)) / 4, A2 = (Math.PI * Math.pow(p.D2 / 100, 2)) / 4, Q = p.Q / 1000, md = RW * Q;
      const V1 = Q / A1, V2 = Q / A2, p2 = p.p1 * 1000 + 0.5 * RW * (V1 * V1 - V2 * V2);
      const e2 = [Math.cos(th), Math.sin(th)];
      /* fuerza del tubo sobre el fluido: R = ṁ(V2 e2 − V1 e1) − p1A1 e1 + p2A2 e2 … con normales exteriores n1 = −e1, n2 = e2 */
      const R = [md * (V2 * e2[0] - V1) - p.p1 * 1000 * A1 + p2 * A2 * e2[0], md * V2 * e2[1] + p2 * A2 * e2[1]];
      const Rm = Math.hypot(R[0], R[1]);
      /* dibujo: eje del codo */
      const cx = W * 0.5, cy = H * 0.66, rb = Math.min(W, H) * 0.15, sc = (Math.min(W, H) * 0.25) / Math.max(1, Rm, p.p1 * 1000 * A1 + md * V1);
      const w1 = Math.max(6, p.D1 * 0.9), w2 = Math.max(6, p.D2 * 0.9);
      ctx.strokeStyle = EM.alpha('--water', 0.55); ctx.lineCap = 'butt';
      ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(cx - 1.5 * rb, cy); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.lineWidth = (w1 + w2) / 2; ctx.beginPath(); ctx.arc(cx, cy - rb, rb, Math.PI / 2, Math.PI / 2 - th, true); ctx.stroke();
      const ox = cx + rb * Math.sin(th), oy = cy - rb + rb * Math.cos(th);
      ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + e2[0] * 1.2 * rb, oy - e2[1] * 1.2 * rb); ctx.stroke();
      /* fuerzas de presión sobre el VC (entran al VC) */
      EM.draw.arrow(ctx, cx - 1.5 * rb - 55, cy, cx - 1.5 * rb - 4, cy, { color: '--c1', width: 2.2 });
      EM.text(ctx, 'p₁A₁', cx - 1.5 * rb - 55, cy - 10, { size: 11.5, color: '--c1' });
      const ex = ox + e2[0] * 1.2 * rb, ey = oy - e2[1] * 1.2 * rb;
      EM.draw.arrow(ctx, ex + e2[0] * 50, ey - e2[1] * 50, ex + e2[0] * 4, ey - e2[1] * 4, { color: '--c1', width: 2.2 });
      EM.text(ctx, 'p₂A₂', ex + e2[0] * 54 + 6, ey - e2[1] * 54 + 4, { size: 11.5, color: '--c1', halo: true });
      /* anclaje */
      EM.draw.arrow(ctx, cx + 10, cy - rb * 0.3, cx + 10 + R[0] * sc, cy - rb * 0.3 - R[1] * sc, { color: '--accent', width: 3.4, head: 12 });
      EM.text(ctx, 'R (anclaje)', cx + 16 + R[0] * sc, cy - rb * 0.3 - R[1] * sc, { size: 12, color: '--accent', weight: 650, halo: true });
      sim.set('R', EM.fix(Rm / 1000, 2) + ' kN a ' + EM.fix((Math.atan2(R[1], R[0]) * 180) / Math.PI, 1) + '°');
      sim.set('Rc', EM.fix(R[0] / 1000, 2) + ' · ' + EM.fix(R[1] / 1000, 2) + ' kN');
      sim.set('V', EM.fix(V1, 2) + ' · ' + EM.fix(V2, 2) + ' m/s · ' + EM.fix(p2 / 1000, 1) + ' kPa');
      const Rp = [-p.p1 * 1000 * A1 + p2 * A2 * e2[0], p2 * A2 * e2[1]], Rmom = [md * (V2 * e2[0] - V1), md * V2 * e2[1]];
      sim.set('part', EM.fix(Math.hypot(...Rp) / 1000, 2) + ' · ' + EM.fix(Math.hypot(...Rmom) / 1000, 2) + ' kN');
    });
  });

  /* 8.3 Rueda Pelton */
  EM.defineSim('pelton', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('H', { label: 'Salto neto', min: 50, max: 1200, step: 5, value: 300, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Caudal', min: 0.05, max: 5, step: 0.01, value: 0.5, unit: 'm³/s', fmt: (v) => v.toFixed(2) });
    sim.slider('Cv', { label: 'Coeficiente de velocidad de la tobera', min: 0.9, max: 0.995, step: 0.005, value: 0.98, fmt: (v) => v.toFixed(3) });
    sim.slider('b', { label: 'Desviación de la cazoleta β', min: 120, max: 180, step: 1, value: 165, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'Factor de velocidad relativa a la salida <i>k</i>', min: 0.8, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('D', { label: 'Diámetro de la rueda', min: 0.5, max: 4, step: 0.05, value: 1.5, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: 'Cociente <i>u</i>/<i>V</i>', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('P', 'Potencia al eje', { hl: true });
    sim.out('V', 'Velocidad del chorro');
    sim.out('n', 'Velocidad de giro');
    sim.out('eta', 'Eficiencia hidráulica (respecto a ρ<i>gQH</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, b = (p.b * Math.PI) / 180;
      EM.draw.clear(cv);
      const V = p.Cv * Math.sqrt(2 * g * p.H), Pav = RW * g * p.Q * p.H, c = 1 - p.k * Math.cos(b);
      const Pf = (r) => RW * p.Q * r * V * (V - r * V) * c;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: (Pav / 1e6) * 1.05, xlabel: 'u/V', ylabel: 'P (MW)' });
      pl.frame();
      pl.hline(Pav / 1e6, { label: 'potencia del agua ρgQH', color: '--c2' });
      pl.fn((r) => Pf(r) / 1e6, { color: '--accent', width: 2.6 });
      pl.vline(0.5, { color: '--ink-3', label: 'u = V/2' });
      pl.dot(p.r, Pf(p.r) / 1e6, { color: '--accent', r: 6 });
      const u = p.r * V, n = (u / (p.D / 2)) * (60 / (2 * Math.PI));
      sim.set('P', EM.fix(Pf(p.r) / 1e6, 3) + ' MW (máxima ' + EM.fix(Pf(0.5) / 1e6, 3) + ' MW)');
      sim.set('V', EM.fix(V, 2) + ' m/s');
      sim.set('n', EM.fix(n, 0) + ' rpm (óptimo ' + EM.fix(((V / 2) / (p.D / 2)) * (60 / (2 * Math.PI)), 0) + ' rpm)');
      sim.set('eta', EM.fix((100 * Pf(p.r)) / Pav, 1) + ' %');
    });
  });

  /* 8.4 Disco actuador y límite de Betz */
  EM.defineSim('betz', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('a', { label: 'Factor de inducción axial <i>a</i>', min: 0, max: 0.5, step: 0.005, value: 1 / 3, fmt: (v) => v.toFixed(3) });
    sim.slider('V0', { label: 'Velocidad del viento', min: 2, max: 25, step: 0.5, value: 10, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('D', { label: 'Diámetro del rotor', min: 10, max: 160, step: 1, value: 80, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.seg('site', { label: 'Lugar', options: [['mar', 'Nivel del mar (15 °C)'], ['pop', 'Popayán (19 °C)']], value: 'mar' });
    sim.out('Cp', '<i>C</i><sub>P</sub> · <i>C</i><sub>T</sub>', { hl: true });
    sim.out('P', 'Potencia extraída');
    sim.out('T', 'Empuje sobre el rotor');
    sim.out('V', 'Velocidad en el disco · en la estela');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const rho = p.site === 'mar' ? 1.225 : FL.POP.rho, A = (Math.PI * p.D * p.D) / 4, b = FL.betz(p.a);
      /* tubo de corriente: radio relativo r(x) */
      const th = H * 0.52, cy = th / 2 + 6, R0 = th * 0.22, xd = W * 0.42;
      const rUp = R0 * Math.sqrt(1 - p.a), rW = R0 * Math.sqrt((1 - p.a) / Math.max(1e-3, 1 - 2 * p.a));
      const rr = (x) => { const s = (x - xd) / (W * 0.12); const t = 0.5 * (1 + Math.tanh(s)); return x < xd ? rUp + (R0 - rUp) * (2 * t) : R0 + (Math.min(rW, th * 0.48) - R0) * (2 * t - 1); };
      ctx.fillStyle = EM.alpha('--c1', 0.1); ctx.beginPath();
      for (let x = 10; x <= W - 10; x += 4) ctx.lineTo(x, cy - rr(x));
      for (let x = W - 10; x >= 10; x -= 4) ctx.lineTo(x, cy + rr(x));
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = EM.col('--ink'); ctx.fillRect(xd - 3, cy - R0, 6, 2 * R0);
      const vs = [[W * 0.1, 1], [xd, 1 - p.a], [W * 0.88, 1 - 2 * p.a]];
      for (const [x, f] of vs) { EM.draw.arrow(ctx, x - 25 * f, cy, x + 25 * f, cy, { color: '--accent', width: 2.2 }); EM.text(ctx, EM.fix(f * p.V0, 2) + ' m/s', x, cy + 18, { size: 11.5, align: 'center', color: '--ink', halo: true }); }
      const pl = new EM.Plot(ctx, { x: 0, y: th, w: W, h: H - th, xmin: 0, xmax: 0.5, ymin: 0, ymax: 1.05, xlabel: 'factor de inducción a', ylabel: 'coeficiente', mt: 8 });
      pl.frame();
      pl.fn((a) => FL.betz(a).Cp, { color: '--accent', width: 2.4 });
      pl.fn((a) => FL.betz(a).Ct, { color: '--c5', width: 2 });
      pl.vline(1 / 3, { color: '--ink-3', label: 'Betz: a = 1/3' });
      pl.dot(p.a, b.Cp, { color: '--accent', r: 5 }); pl.dot(p.a, b.Ct, { color: '--c5', r: 5 });
      pl.legend([{ label: 'C_P = 4a(1−a)²', color: '--accent' }, { label: 'C_T = 4a(1−a)', color: '--c5' }], 'tl');
      const P = b.Cp * 0.5 * rho * A * Math.pow(p.V0, 3), T = b.Ct * 0.5 * rho * A * p.V0 * p.V0;
      sim.set('Cp', EM.fix(b.Cp, 4) + ' · ' + EM.fix(b.Ct, 4));
      sim.set('P', EM.fix(P / 1e6, 3) + ' MW (disponible ' + EM.fix((0.5 * rho * A * Math.pow(p.V0, 3)) / 1e6, 3) + ' MW)');
      sim.set('T', EM.fix(T / 1000, 1) + ' kN');
      sim.set('V', EM.fix(p.V0 * (1 - p.a), 2) + ' · ' + EM.fix(p.V0 * (1 - 2 * p.a), 2) + ' m/s');
    });
  });
})();
