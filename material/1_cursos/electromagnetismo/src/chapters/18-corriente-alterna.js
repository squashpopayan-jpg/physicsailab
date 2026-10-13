/* Capítulo 18 — Circuitos de corriente alterna */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, CK = EM.ckt;
  const deg = M.deg, rad = M.rad;
  const f2 = (v) => EM.fix(v, 2);
  /* aritmética compleja mínima */
  const cx = (re, im) => ({ re, im });
  const cadd = (a, b) => cx(a.re + b.re, a.im + b.im);
  const cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cabs = (a) => Math.hypot(a.re, a.im);
  const carg = (a) => Math.atan2(a.im, a.re);
  EM.complex = { cx, cadd, cmul, cdiv, cabs, carg };

  /* ======================================================================
     18.1 Diagrama de fasores RLC serie
     ====================================================================== */
  EM.defineSim('phasors-rlc', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Fuente');
    sim.slider('V', { label: 'Amplitud <i>V</i><sub>0</sub>', min: 1, max: 20, step: 0.5, value: 10, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 10, max: 5000, value: 170, log: true, step: 1, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.group('Elementos');
    sim.slider('R', { label: '<i>R</i>', min: 1, max: 500, step: 1, value: 60, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: '<i>L</i>', min: 1, max: 500, step: 1, value: 80, unit: 'mH', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: '<i>C</i>', min: 0.1, max: 50, step: 0.1, value: 5, unit: 'µF', fmt: (v) => EM.fix(v, 1) });
    sim.out('XL', '<i>X<sub>L</sub></i> = <i>ωL</i>');
    sim.out('XC', '<i>X<sub>C</sub></i> = 1/<i>ωC</i>');
    sim.out('Z', '|<i>Z</i>|', { hl: true });
    sim.out('phi', 'Desfase <i>φ</i> (<i>v</i> respecto de <i>i</i>)');
    sim.out('I', 'Amplitud de corriente <i>I</i><sub>0</sub>');
    sim.out('car', 'Carácter');
    sim.legend([{ color: '--c1', label: '<i>v<sub>R</sub></i>' }, { color: '--bfield', label: '<i>v<sub>L</sub></i>' }, { color: '--efield', label: '<i>v<sub>C</sub></i>' }, { color: '--accent', label: '<i>v</i> (fuente)' }, { color: '--ink-3', label: '<i>i</i>·|<i>Z</i>| (corriente)', kind: 'dash' }]);
    let wt = 0.6;
    sim.animate((dt) => { wt += dt * Math.PI; });
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f;
      const XL = w * p.L * 1e-3, XC = 1 / (w * p.C * 1e-6);
      const Z = Math.hypot(p.R, XL - XC), phi = Math.atan2(XL - XC, p.R), I0 = p.V / Z;
      const VR = I0 * p.R, VL = I0 * XL, VC = I0 * XC;
      const vmax = Math.max(p.V, VR, VL, VC) * 1.1;
      /* diagrama de fasores */
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, ox = W * 0.5, oy = H * 0.5, Rpx = Math.min(W, H) * 0.44, s = Rpx / vmax;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ox, oy, p.V * s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox - Rpx, oy); ctx.lineTo(ox + Rpx, oy); ctx.moveTo(ox, oy - Rpx); ctx.lineTo(ox, oy + Rpx); ctx.stroke();
      const P = (mag, ang) => [ox + mag * s * Math.cos(ang), oy - mag * s * Math.sin(ang)];
      const vR = P(VR, wt), vLend = [vR[0] + VL * s * Math.cos(wt + Math.PI / 2), vR[1] - VL * s * Math.sin(wt + Math.PI / 2)];
      const vCend = [vLend[0] + VC * s * Math.cos(wt - Math.PI / 2), vLend[1] - VC * s * Math.sin(wt - Math.PI / 2)];
      /* construcción punta con cola */
      EM.draw.arrow(ctx, ox, oy, vR[0], vR[1], { color: '--c1', width: 3, head: 11 });
      EM.draw.arrow(ctx, vR[0], vR[1], vLend[0], vLend[1], { color: '--bfield', width: 2.4, head: 10, alpha: 0.9 });
      EM.draw.arrow(ctx, vLend[0], vLend[1], vCend[0], vCend[1], { color: '--efield', width: 2.4, head: 10, alpha: 0.9 });
      /* fasores desde el origen (tenues) */
      const pl = P(VL, wt + Math.PI / 2), pc = P(VC, wt - Math.PI / 2);
      EM.draw.arrow(ctx, ox, oy, pl[0], pl[1], { color: '--bfield', width: 1.3, head: 7, dash: [4, 3], alpha: 0.55 });
      EM.draw.arrow(ctx, ox, oy, pc[0], pc[1], { color: '--efield', width: 1.3, head: 7, dash: [4, 3], alpha: 0.55 });
      const pv = P(p.V, wt + phi);
      EM.draw.arrow(ctx, ox, oy, pv[0], pv[1], { color: '--accent', width: 3.4, head: 13 });
      const pi = P(p.V, wt);
      EM.draw.arrow(ctx, ox, oy, pi[0], pi[1], { color: '--ink-3', width: 1.6, head: 8, dash: [5, 4] });
      EM.text(ctx, 'Ṽ', pv[0] + 8, pv[1] - 6, { size: 14, weight: 700, color: '--accent', halo: true });
      EM.text(ctx, 'Ĩ', pi[0] + 8, pi[1] + 12, { size: 13, weight: 700, color: '--ink-3', halo: true });
      /* proyecciones */
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = EM.alpha('--accent', 0.6);
      ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(W - 4, pv[1]); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'ωt = ' + EM.fix(deg(M.wrap2pi(wt)), 0) + '°', 10, 18, { size: 12, mono: true, color: '--ink-2' });
      /* formas de onda */
      EM.draw.clear(cp);
      const T = 1 / p.f, tNow = (M.wrap2pi(wt) / (2 * Math.PI)) * T;
      const plt = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2 * T, ymin: -vmax, ymax: vmax, xlabel: 't', ylabel: 'tensión (V)', xfmt: (v) => EM.si(v, 's', 2) });
      plt.frame();
      const f = (A, ph) => (t) => A * Math.sin(2 * Math.PI * p.f * t + ph);
      plt.fn(f(VR, 0), { color: '--c1', width: 1.8 });
      plt.fn(f(VL, Math.PI / 2), { color: '--bfield', width: 1.8 });
      plt.fn(f(VC, -Math.PI / 2), { color: '--efield', width: 1.8 });
      plt.fn(f(p.V, phi), { color: '--accent', width: 2.6 });
      plt.fn(f(p.V, 0), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      plt.vline(tNow, { color: '--ink-2' });
      plt.vline(tNow + T, { color: '--ink-2', alpha: 0.4 });
      sim.set('XL', EM.si(XL, 'Ω'));
      sim.set('XC', EM.si(XC, 'Ω'));
      sim.set('Z', EM.si(Z, 'Ω'));
      sim.set('phi', EM.fix(deg(phi), 1) + '°');
      sim.set('I', EM.si(I0, 'A'));
      sim.set('car', Math.abs(XL - XC) < 0.01 * Z ? 'resonancia (resistivo)' : XL > XC ? 'inductivo' : 'capacitivo');
    });
  });

  /* ======================================================================
     18.2 Resonancia
     ====================================================================== */
  EM.defineSim('resonance', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const cp = sim.canvas({ aspect: 3.4, cls: 'fixed' });
    sim.group('Circuito RLC serie');
    sim.slider('R', { label: '<i>R</i>', min: 1, max: 200, step: 1, value: 20, unit: 'Ω', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: '<i>L</i>', min: 1, max: 100, step: 1, value: 10, unit: 'mH', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: '<i>C</i>', min: 0.01, max: 10, value: 1, log: true, step: 0.01, unit: 'µF', fmt: (v) => EM.fix(v, 2) });
    sim.slider('V', { label: 'Tensión eficaz de la fuente', min: 1, max: 20, step: 0.5, value: 5, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.slider('fs', { label: 'Frecuencia de la fuente', min: 50, max: 50000, value: 1500, log: true, step: 1, fmt: (v) => EM.si(v, 'Hz', 3) });
    sim.out('f0', '<i>f</i><sub>0</sub> = 1/2π√(<i>LC</i>)', { hl: true });
    sim.out('Q', 'Factor de calidad <i>Q</i>');
    sim.out('bw', 'Ancho de banda Δ<i>f</i> = <i>R</i>/2π<i>L</i>');
    sim.out('I', '<i>I</i><sub>ef</sub> a la frecuencia elegida');
    sim.out('VL', '<i>V<sub>L</sub></i> en resonancia = <i>QV</i>');
    sim.onDraw(() => {
      const p = sim.p, L = p.L * 1e-3, C = p.C * 1e-6;
      const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C)), Q = (2 * Math.PI * f0 * L) / p.R, bw = p.R / (2 * Math.PI * L);
      const I = (f, R) => { const w = 2 * Math.PI * f; return p.V / Math.hypot(R, w * L - 1 / (w * C)); };
      const ph = (f, R) => { const w = 2 * Math.PI * f; return deg(Math.atan2(w * L - 1 / (w * C), R)); };
      EM.draw.clear(cv);
      const fmin = 50, fmax = 50000;
      const Imax = (p.V / p.R) * 1.12;
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: fmin, xmax: fmax, xlog: true, ymin: 0, ymax: Imax * 1e3, xlabel: 'f (Hz)', ylabel: 'I_{ef} (mA)' });
      pl.frame();
      pl.band(f0 - bw / 2, f0 + bw / 2, { color: '--c1', alpha: 0.1 });
      pl.fn((f) => I(f, p.R * 3) * 1e3, { color: '--c1', width: 1.2, alpha: 0.45 });
      pl.fn((f) => I(f, p.R / 3) * 1e3, { color: '--c1', width: 1.2, alpha: 0.45, n: 1500 });
      pl.fn((f) => I(f, p.R) * 1e3, { color: '--c1', width: 2.6, n: 1500 });
      pl.hline((p.V / p.R / Math.SQRT2) * 1e3, { color: '--ink-3', dash: [3, 3], label: 'I_{máx}/√2', labelRight: true });
      pl.vline(f0, { color: '--accent', label: 'f₀' });
      pl.dot(p.fs, I(p.fs, p.R) * 1e3, { color: '--accent', r: 5.5 });
      pl.label(fmin * 1.2, Imax * 1e3 * 0.9, 'curvas tenues: R/3 y 3R', { color: '--ink-3' });
      EM.draw.clear(cp);
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: fmin, xmax: fmax, xlog: true, ymin: -95, ymax: 95, ylabel: 'φ (°)', xlabel: 'f (Hz)', mt: 10, yticks: [-90, -45, 0, 45, 90] });
      pp.frame();
      pp.fn((f) => ph(f, p.R), { color: '--c5', width: 2.2, n: 1500 });
      pp.vline(f0, { color: '--accent' });
      pp.dot(p.fs, ph(p.fs, p.R), { color: '--accent', r: 5 });
      pp.label(fmin * 1.2, -70, 'capacitivo', { color: '--ink-3' });
      pp.label(fmax / 8, 70, 'inductivo', { color: '--ink-3' });
      sim.set('f0', EM.si(f0, 'Hz'));
      sim.set('Q', EM.fix(Q, 2));
      sim.set('bw', EM.si(bw, 'Hz'));
      sim.set('I', EM.si(I(p.fs, p.R), 'A'));
      sim.set('VL', EM.si(Q * p.V, 'V'));
    });
  });

  /* ======================================================================
     18.3 Potencia en CA
     ====================================================================== */
  EM.defineSim('ac-power', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.1 });
    const ct = sim.canvas({ aspect: 1.1 });
    sim.group('Carga');
    sim.slider('Vef', { label: 'Tensión eficaz', min: 10, max: 240, step: 10, value: 120, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.slider('Ief', { label: 'Corriente eficaz', min: 0.1, max: 10, step: 0.1, value: 5, unit: 'A', fmt: (v) => EM.fix(v, 1) });
    sim.slider('phi', { label: 'Desfase <i>φ</i> (+ inductivo)', min: -90, max: 90, step: 1, value: 40, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('P', 'Potencia activa <i>P</i>', { hl: true });
    sim.out('Qr', 'Potencia reactiva <i>Q</i>');
    sim.out('S', 'Potencia aparente <i>S</i>');
    sim.out('fp', 'Factor de potencia cos <i>φ</i>');
    sim.onDraw(() => {
      const p = sim.p, phi = rad(p.phi);
      const V0 = p.Vef * Math.SQRT2, I0 = p.Ief * Math.SQRT2;
      const P = p.Vef * p.Ief * Math.cos(phi), Qr = p.Vef * p.Ief * Math.sin(phi), S = p.Vef * p.Ief;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 2 * Math.PI * 2, xpi: true, ymin: -1.15, ymax: 2.15, xlabel: 'ωt', ylabel: 'normalizado', title: 'v(t), i(t) y p(t) = v·i' });
      pl.frame();
      pl.fn((x) => Math.sin(x), { color: '--accent', width: 1.8 });
      pl.fn((x) => Math.sin(x - phi), { color: '--c1', width: 1.8 });
      pl.fn((x) => Math.sin(x) * Math.sin(x - phi), { color: '--c3', width: 2.4, fill: '--c3', fillAlpha: 0.12 });
      pl.hline(0.5 * Math.cos(phi), { color: '--c3', dash: [5, 4], label: 'potencia media (÷ V₀I₀)', labelRight: true });
      pl.legend([{ label: 'v/V₀', color: '--accent' }, { label: 'i/I₀', color: '--c1' }, { label: 'p/(V₀I₀)', color: '--c3' }], 'tl');
      /* triángulo de potencias */
      EM.draw.clear(ct);
      const ctx = ct.ctx, w = ct.w, h = ct.h;
      const sc = Math.min(w, h) * 0.62 / Math.max(S, 1e-9);
      const x0 = w * 0.18, y0 = h * 0.52;
      const xP = x0 + P * sc, yQ = y0 - Qr * sc;
      ctx.fillStyle = EM.alpha('--c3', 0.08);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xP, y0); ctx.lineTo(xP, yQ); ctx.closePath(); ctx.fill();
      EM.draw.arrow(ctx, x0, y0, xP, y0, { color: '--c3', width: 3, head: 11 });
      EM.draw.arrow(ctx, xP, y0, xP, yQ, { color: '--c5', width: 3, head: 11 });
      EM.draw.arrow(ctx, x0, y0, xP, yQ, { color: '--accent', width: 3, head: 11 });
      EM.text(ctx, 'P = ' + EM.si(P, 'W'), (x0 + xP) / 2, y0 + (Qr >= 0 ? 20 : -10), { size: 12, color: '--c3', align: 'center', halo: true });
      EM.text(ctx, 'Q = ' + EM.si(Qr, 'var'), xP + 8, (y0 + yQ) / 2, { size: 12, color: '--c5', halo: true, baseline: 'middle' });
      EM.text(ctx, 'S = ' + EM.si(S, 'VA'), (x0 + xP) / 2 - 10, (y0 + yQ) / 2 - 12, { size: 12, color: '--accent', align: 'right', halo: true });
      EM.text(ctx, 'Triángulo de potencias', 12, 20, { size: 12, weight: 650, color: '--ink-2' });
      sim.set('P', EM.si(P, 'W'));
      sim.set('Qr', EM.si(Qr, 'var'));
      sim.set('S', EM.si(S, 'VA'));
      sim.set('fp', EM.fix(Math.cos(phi), 3) + (p.phi > 0 ? ' (inductivo)' : p.phi < 0 ? ' (capacitivo)' : ''));
      void V0; void I0;
    });
  });

  /* ======================================================================
     18.4 Transformador ideal
     ====================================================================== */
  EM.defineSim('transformer', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Devanados');
    sim.slider('N1', { label: 'Espiras del primario <i>N</i><sub>1</sub>', min: 10, max: 2000, step: 10, value: 1000, fmt: (v) => v.toFixed(0) });
    sim.slider('N2', { label: 'Espiras del secundario <i>N</i><sub>2</sub>', min: 10, max: 2000, step: 10, value: 100, fmt: (v) => v.toFixed(0) });
    sim.group('Circuito');
    sim.slider('V1', { label: 'Tensión eficaz del primario', min: 10, max: 240, step: 5, value: 120, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Carga <i>R</i> en el secundario', min: 1, max: 1000, value: 10, log: true, step: 0.5, unit: 'Ω', fmt: (v) => EM.fix(v, 1) });
    sim.out('V2', '<i>V</i><sub>2</sub>', { hl: true });
    sim.out('I2', '<i>I</i><sub>2</sub>');
    sim.out('I1', '<i>I</i><sub>1</sub>');
    sim.out('P', 'Potencia (igual en ambos lados)');
    sim.out('Z', 'Impedancia vista desde el primario');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 2; });
    sim.onDraw(() => {
      const p = sim.p, a = p.N1 / p.N2;
      const V2 = p.V1 / a, I2 = V2 / p.R, I1 = I2 / a;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x0 = w * 0.3, x1 = w * 0.7, y0 = h * 0.14, y1 = h * 0.86, t = Math.min(w, h) * 0.1;
      ctx.fillStyle = EM.alpha('--ink-3', 0.35);
      ctx.fillRect(x0, y0, x1 - x0, t); ctx.fillRect(x0, y1 - t, x1 - x0, t);
      ctx.fillRect(x0, y0, t, y1 - y0); ctx.fillRect(x1 - t, y0, t, y1 - y0);
      for (let i = 0; i < 12; i++) { ctx.strokeStyle = EM.alpha('--ink-2', 0.25); ctx.beginPath(); ctx.moveTo(x0 + (i * (x1 - x0)) / 12, y0); ctx.lineTo(x0 + (i * (x1 - x0)) / 12, y0 + t); ctx.stroke(); }
      const coil = (xc, n, col) => { const k = M.clamp(Math.round(n / 80) + 3, 3, 16); for (let i = 0; i < k; i++) { const y = y0 + t + 8 + (i * (y1 - y0 - 2 * t - 16)) / (k - 1); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(xc, y, t * 0.75, 4, 0, 0, 2 * Math.PI); ctx.stroke(); } };
      coil(x0 + t / 2, p.N1, '--c4');
      coil(x1 - t / 2, p.N2, '--c1');
      /* flujo */
      const Phi = Math.sin(ph);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.lineDashOffset = -ph * 20; ctx.strokeStyle = EM.alpha('--bline', 0.4 + 0.5 * Math.abs(Phi)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(x0 + t / 2, y0 + t / 2, x1 - x0 - t, y1 - y0 - t); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'Φ', (x0 + x1) / 2, y0 + t / 2 + 4, { size: 13, italic: true, family: EM.FONT_MATH, color: '--bline', align: 'center' });
      /* circuitos */
      const xs = w * 0.1, xl = w * 0.9, ym = (y0 + y1) / 2;
      CK.wire(ctx, [[x0 - t * 0.25, y0 + t + 8], [xs, y0 + t + 8], [xs, ym - 18]]);
      CK.wire(ctx, [[x0 - t * 0.25, y1 - t - 8], [xs, y1 - t - 8], [xs, ym + 18]]);
      CK.acsource(ctx, xs, ym + 18, xs, ym - 18, { label: EM.fix(p.V1, 0) + ' V', labelSide: 1, labelOff: 24 });
      CK.wire(ctx, [[x1 + t * 0.25, y0 + t + 8], [xl, y0 + t + 8], [xl, ym - 24]]);
      CK.wire(ctx, [[x1 + t * 0.25, y1 - t - 8], [xl, y1 - t - 8], [xl, ym + 24]]);
      CK.resistor(ctx, xl, ym - 24, xl, ym + 24, { label: 'R', labelSide: -1, labelOff: 14, len: 36 });
      EM.text(ctx, 'N₁ = ' + p.N1, x0 + t / 2, y1 + 16, { size: 12, color: '--c4', align: 'center' });
      EM.text(ctx, 'N₂ = ' + p.N2, x1 - t / 2, y1 + 16, { size: 12, color: '--c1', align: 'center' });
      EM.text(ctx, a > 1 ? 'reductor' : a < 1 ? 'elevador' : 'relación 1:1', (x0 + x1) / 2, (y0 + y1) / 2 + 4, { size: 13, weight: 650, color: '--ink-2', align: 'center' });
      sim.set('V2', EM.si(V2, 'V'));
      sim.set('I2', EM.si(I2, 'A'));
      sim.set('I1', EM.si(I1, 'A'));
      sim.set('P', EM.si(V2 * I2, 'W'));
      sim.set('Z', EM.si(a * a * p.R, 'Ω'));
    });
  });

  /* ======================================================================
     18.5 Filtros y diagrama de Bode
     ====================================================================== */
  EM.defineSim('bode', function (sim) {
    const cm = sim.canvas({ aspect: 2.6 });
    const cph = sim.canvas({ aspect: 4.2, cls: 'fixed' });
    const cs = sim.canvas({ aspect: 4.2, cls: 'fixed' });
    sim.group('Filtro');
    sim.select('type', { options: [['lp', 'RC pasa-bajos (salida en C)'], ['hp', 'RC pasa-altos (salida en R)'], ['bp', 'RLC pasa-banda (salida en R)'], ['bs', 'RLC rechaza-banda (salida en L+C)']], value: 'lp', onInput: () => vis() });
    sim.slider('R', { label: '<i>R</i>', min: 10, max: 10000, value: 1000, log: true, step: 1, fmt: (v) => EM.si(v, 'Ω', 3) });
    sim.slider('C', { label: '<i>C</i>', min: 0.001, max: 10, value: 0.1, log: true, step: 0.001, unit: 'µF', fmt: (v) => EM.sci(v, 3) });
    const sL = sim.slider('L', { label: '<i>L</i>', min: 0.1, max: 1000, value: 10, log: true, step: 0.1, unit: 'mH', fmt: (v) => EM.sci(v, 3) });
    sim.group('Señal de prueba');
    sim.slider('fs', { label: 'Frecuencia de la señal', min: 10, max: 1e6, value: 1000, log: true, step: 1, fmt: (v) => EM.si(v, 'Hz', 3) });
    function vis() { sL.show(sim.p.type === 'bp' || sim.p.type === 'bs'); }
    vis();
    sim.out('fc', 'Frecuencia característica', { hl: true });
    sim.out('g', 'Ganancia a la frecuencia de la señal');
    sim.out('ph', 'Fase a la frecuencia de la señal');
    const H = (f) => {
      const p = sim.p, w = 2 * Math.PI * f, R = p.R, C = p.C * 1e-6, L = p.L * 1e-3;
      const one = cx(1, 0);
      if (p.type === 'lp') return cdiv(one, cx(1, w * R * C));
      if (p.type === 'hp') return cdiv(cx(0, w * R * C), cx(1, w * R * C));
      const X = w * L - 1 / (w * C);
      if (p.type === 'bp') return cdiv(cx(R, 0), cx(R, X));
      return cdiv(cx(0, X), cx(R, X));
    };
    sim.onDraw(() => {
      const p = sim.p;
      const fc = p.type === 'lp' || p.type === 'hp' ? 1 / (2 * Math.PI * p.R * p.C * 1e-6) : 1 / (2 * Math.PI * Math.sqrt(p.L * 1e-3 * p.C * 1e-6));
      const fmin = 10, fmax = 1e6;
      EM.draw.clear(cm);
      const pm = new EM.Plot(cm.ctx, { x: 0, y: 0, w: cm.w, h: cm.h, xmin: fmin, xmax: fmax, xlog: true, ymin: -60, ymax: 6, xlabel: 'f (Hz)', ylabel: 'ganancia (dB)', title: 'Diagrama de Bode: magnitud', yticks: [-60, -50, -40, -30, -20, -10, 0] });
      pm.frame();
      pm.hline(-3, { color: '--ink-3', dash: [3, 3], label: '−3 dB', labelRight: true });
      pm.vline(fc, { color: '--accent', label: p.type === 'lp' || p.type === 'hp' ? 'f_{c}' : 'f₀' });
      pm.fn((f) => 20 * Math.log10(cabs(H(f))), { color: '--c1', width: 2.4, n: 1200 });
      const gs = 20 * Math.log10(cabs(H(p.fs)));
      pm.dot(p.fs, Math.max(-60, gs), { color: '--accent', r: 5 });
      EM.draw.clear(cph);
      const pp = new EM.Plot(cph.ctx, { x: 0, y: 0, w: cph.w, h: cph.h, xmin: fmin, xmax: fmax, xlog: true, ymin: -100, ymax: 100, ylabel: 'fase (°)', mt: 10, mb: 28, yticks: [-90, -45, 0, 45, 90] });
      pp.frame();
      pp.fn((f) => deg(carg(H(f))), { color: '--c5', width: 2.2, n: 1200, breakJumps: true });
      pp.vline(fc, { color: '--accent' });
      pp.dot(p.fs, deg(carg(H(p.fs))), { color: '--accent', r: 5 });
      /* señales */
      EM.draw.clear(cs);
      const T = 1 / p.fs, g = cabs(H(p.fs)), fi = carg(H(p.fs));
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 3 * T, ymin: -1.2, ymax: 1.2, ylabel: 'señal', xlabel: 't', mt: 8, xfmt: (v) => EM.si(v, 's', 2) });
      ps.frame();
      ps.fn((t) => Math.sin(2 * Math.PI * p.fs * t), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      ps.fn((t) => g * Math.sin(2 * Math.PI * p.fs * t + fi), { color: '--c1', width: 2.2 });
      ps.legend([{ label: 'entrada', color: '--ink-3', dash: [5, 4] }, { label: 'salida', color: '--c1' }], 'tr');
      sim.set('fc', EM.si(fc, 'Hz') + (p.type === 'lp' || p.type === 'hp' ? ' (corte 1/2πRC)' : ' (resonancia)'));
      sim.set('g', EM.fix(gs, 2) + ' dB (×' + EM.fix(g, 3) + ')');
      sim.set('ph', EM.fix(deg(fi), 1) + '°');
    });
  });
})();
