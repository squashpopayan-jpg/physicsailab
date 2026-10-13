/* Capítulo 5 — Oscilaciones forzadas y resonancia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  /* amplitud (por unidad de F0/m) y fase del régimen estacionario */
  const resp = (w0, g, w) => { const re = w0 * w0 - w * w, im = g * w; return [1 / Math.hypot(re, im), Math.atan2(im, re)]; };
  EM.resp = resp;

  /* ======================================================================
     5.1 Transitorio y régimen estacionario
     ====================================================================== */
  EM.defineSim('forced-transient', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 4.2, cls: 'full fixed' });
    const cv = sim.canvas({ aspect: 2.6, cls: 'full' });
    sim.group('Oscilador');
    sim.note('Frecuencia natural fija: <i>ω</i><sub>0</sub> = 2π rad/s (<i>f</i><sub>0</sub> = 1 Hz).');
    sim.slider('Q', { label: 'Factor de calidad <i>Q</i>', min: 0.5, max: 200, value: 20, log: true, step: 0.1, fmt: (v) => EM.fix(v, 1), onInput: () => restart() });
    sim.group('Fuerza');
    sim.slider('r', { label: 'Frecuencia relativa <i>ω</i>/<i>ω</i><sub>0</sub>', min: 0.2, max: 3, step: 0.005, value: 0.9, fmt: f3, onInput: () => restart() });
    sim.slider('F', { label: 'Amplitud <i>F</i><sub>0</sub>/<i>m</i>', min: 0, max: 10, step: 0.1, value: 4, unit: 'm/s²', fmt: (v) => EM.fix(v, 1), onInput: () => restart() });
    sim.group('Condiciones iniciales');
    sim.slider('x0', { label: '<i>x</i><sub>0</sub>', min: -0.5, max: 0.5, step: 0.01, value: 0, unit: 'm', fmt: f2, onInput: () => restart() });
    sim.check('steady', { label: 'Mostrar sólo la solución estacionaria (punteada)', value: true });
    sim.resetButton(() => restart());
    sim.out('A', 'Amplitud estacionaria <i>A</i>(<i>ω</i>)', { hl: true });
    sim.out('d', 'Desfase <i>δ</i>');
    sim.out('tr', 'Duración del transitorio 2/<i>γ</i>');
    const w0 = 2 * Math.PI;
    let y, t, tr;
    const restart = () => { y = [sim.p.x0, 0]; t = 0; tr = new EM.Trace(3000); };
    restart();
    sim.animate((dt) => {
      const p = sim.p, g = w0 / p.Q, w = p.r * w0;
      const f = (tt, s) => [s[1], p.F * Math.cos(w * tt) - g * s[1] - w0 * w0 * s[0]];
      y = EM.integrate(f, t, y, t + dt, 20);
      t += dt;
      tr.push(t, y[0]);
    });
    sim.onDraw(() => {
      const p = sim.p, g = w0 / p.Q, w = p.r * w0;
      const [a, d] = resp(w0, g, w);
      const A = p.F * a;
      const Amax = p.F / (g * w0) * 1.05;
      const ym = Math.max(0.05, Math.min(Amax * 1.3, Math.max(A * 2.2, Math.abs(p.x0) * 1.2, 0.1)));
      EM.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      const sc = (W * 0.32) / ym;
      EM.drawMSD(ctx, W, H, y[0], sc);
      /* flecha de fuerza */
      const Fx = Math.cos(w * t);
      EM.draw.arrow(ctx, W * 0.5 + y[0] * sc, H * 0.12, W * 0.5 + y[0] * sc + Fx * 50, H * 0.12, { color: '--c2', width: 2.4 });
      EM.text(ctx, 'F(t)', W * 0.5 + y[0] * sc + Fx * 50 + (Fx > 0 ? 6 : -30), H * 0.12 + 4, { size: 12, color: '--c2', italic: true });
      EM.draw.clear(cv);
      const span = 12;
      const t0 = Math.max(0, t - span);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: t0, xmax: t0 + span, ymin: -ym, ymax: ym, xlabel: 't (s)', ylabel: 'x (m)', ml: 58 });
      pl.frame();
      if (p.steady) pl.fn((tt) => A * Math.cos(w * tt - d), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.xy(tr.t, tr.col(0), { color: '--accent', width: 2 });
      sim.set('A', EM.si(A, 'm') + ' (' + EM.fix(A / (p.F / (w0 * w0)), 2) + ' × estática)');
      sim.set('d', EM.fix(M.deg(d), 1) + '°');
      sim.set('tr', EM.si(2 / g, 's'));
    });
  });

  /* ======================================================================
     5.2 Curvas de resonancia
     ====================================================================== */
  EM.defineSim('resonance-curves', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 4.2, cls: 'full fixed' });
    const ca = sim.canvas({ aspect: 1.25 });
    const cf = sim.canvas({ aspect: 1.25 });
    sim.slider('r', { label: 'Frecuencia de la fuerza <i>ω</i>/<i>ω</i><sub>0</sub>', min: 0.05, max: 2.5, step: 0.005, value: 0.6, fmt: f3 });
    sim.slider('Q', { label: 'Factor de calidad <i>Q</i>', min: 0.3, max: 50, value: 5, log: true, step: 0.05, fmt: (v) => EM.fix(v, 2) });
    sim.check('fam', { label: 'Mostrar curvas para Q = 0.5, 1, 2, 10', value: true });
    sim.seg('lg', { label: 'Escala de la amplitud', options: [['lin', 'Lineal'], ['log', 'Log']], value: 'lin' });
    sim.out('A', '<i>A</i> / (<i>F</i><sub>0</sub>/<i>k</i>)', { hl: true });
    sim.out('d', 'Desfase <i>δ</i>');
    sim.out('wr', 'Pico de amplitud <i>ω<sub>r</sub></i>/<i>ω</i><sub>0</sub>');
    sim.out('zone', 'Zona');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, g = 1 / p.Q;
      const [a, d] = resp(1, g, p.r);
      EM.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      const ph = 2 * Math.PI * 0.6 * t;
      const xx = a * Math.cos(ph - d), Amax = Math.max(p.Q * 1.05, 1.2);
      EM.drawMSD(ctx, W, H, xx / Amax, W * 0.3);
      EM.draw.arrow(ctx, W * 0.5 + (xx / Amax) * W * 0.3, H * 0.1, W * 0.5 + (xx / Amax) * W * 0.3 + Math.cos(ph) * 45, H * 0.1, { color: '--c2', width: 2.4 });
      EM.text(ctx, 'animación a ritmo fijo; fuerza en rojo', 10, H - 8, { size: 10.5, color: '--ink-3' });
      const log = p.lg === 'log';
      EM.draw.clear(ca);
      const ymax = log ? Math.max(10, p.Q * 3) : Math.max(p.Q * 1.15, 2.5);
      const pa = new EM.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: 0, xmax: 2.5, ymin: log ? 0.05 : 0, ymax, ylog: log, xlabel: 'ω / ω₀', ylabel: 'A / (F₀/k)', ml: 52 });
      pa.frame();
      if (p.fam) [0.5, 1, 2, 10].forEach((q) => pa.fn((r) => resp(1, 1 / q, r)[0], { color: '--grid-2', width: 1.3, n: 500 }));
      pa.fn((r) => resp(1, g, r)[0], { color: '--c1', width: 2.3, n: 800 });
      pa.vline(1, { color: '--ink-3' });
      pa.dot(p.r, a, { color: '--accent', r: 6 });
      EM.draw.clear(cf);
      const pf = new EM.Plot(cf.ctx, { x: 0, y: 0, w: cf.w, h: cf.h, xmin: 0, xmax: 2.5, ymin: 0, ymax: Math.PI, xlabel: 'ω / ω₀', ylabel: 'δ (retraso)', ml: 52, yticks: [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI], yfmt: EM.piFmt });
      pf.frame();
      if (p.fam) [0.5, 1, 2, 10].forEach((q) => pf.fn((r) => resp(1, 1 / q, r)[1], { color: '--grid-2', width: 1.3, n: 500 }));
      pf.fn((r) => resp(1, g, r)[1], { color: '--c3', width: 2.3, n: 800 });
      pf.hline(Math.PI / 2, { color: '--ink-3' });
      pf.dot(p.r, d, { color: '--accent', r: 6 });
      sim.set('A', EM.fix(a, 3));
      sim.set('d', EM.fix(M.deg(d), 1) + '°');
      sim.set('wr', p.Q > 1 / Math.SQRT2 ? EM.fix(Math.sqrt(1 - (g * g) / 2), 4) : '— (sin pico: Q < 0.707)');
      sim.set('zone', p.r < 0.7 ? 'elástica (sigue a la fuerza)' : p.r > 1.4 ? 'inercial (en oposición)' : 'resonante');
    });
  });

  /* ======================================================================
     5.3 Potencia absorbida
     ====================================================================== */
  EM.defineSim('power-resonance', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('f0', { label: 'Frecuencia natural <i>f</i><sub>0</sub>', min: 100, max: 2000, step: 1, value: 1000, unit: 'kHz', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Factor de calidad <i>Q</i>', min: 2, max: 500, value: 50, log: true, step: 0.1, fmt: (v) => EM.fix(v, 1) });
    sim.slider('f', { label: 'Frecuencia de la señal <i>f</i>', min: 50, max: 2500, step: 0.5, value: 1010, unit: 'kHz', fmt: (v) => EM.fix(v, 1) });
    sim.check('lor', { label: 'Superponer la lorentziana aproximada', value: true });
    sim.out('bw', 'Ancho de banda Δ<i>f</i> = <i>f</i><sub>0</sub>/<i>Q</i>', { hl: true });
    sim.out('P', '<i>P</i>/<i>P</i><sub>máx</sub> a la frecuencia elegida');
    sim.out('dB', 'Atenuación');
    sim.out('tau', 'Tiempo de respuesta 1/<i>γ</i>');
    sim.note('Piense en un receptor de radio de AM: el circuito resonante sintoniza la emisora en <i>f</i><sub>0</sub>, y una emisora vecina en <i>f</i> llega atenuada.');
    sim.onDraw(() => {
      const p = sim.p, g = p.f0 / p.Q;
      const P = (f) => (g * g * f * f) / ((p.f0 * p.f0 - f * f) ** 2 + g * g * f * f);
      const L = (f) => (g * g / 4) / ((f - p.f0) ** 2 + (g * g) / 4);
      EM.draw.clear(cv);
      const span = Math.min(p.f0 * 0.98, Math.max(6 * g, p.f0 * 0.05, Math.abs(p.f - p.f0) * 1.3));
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: p.f0 - span, xmax: p.f0 + span, ymin: 0, ymax: 1.12, xlabel: 'frecuencia (kHz)', ylabel: 'P / P_{máx}', ml: 52 });
      pl.frame();
      pl.band(p.f0 - g / 2, p.f0 + g / 2, { color: '--c3', alpha: 0.12 });
      pl.hline(0.5, { color: '--c3', label: '½ P_{máx}' });
      if (p.lor) pl.fn(L, { color: '--accent', width: 1.4, dash: [5, 4], n: 800 });
      pl.fn(P, { color: '--c1', width: 2.4, n: 800 });
      pl.dot(p.f, P(p.f), { color: '--c2', r: 6 });
      pl.vline(p.f, { color: '--c2' });
      sim.set('bw', EM.fix(g, 2) + ' kHz');
      sim.set('P', EM.fix(P(p.f), 4));
      sim.set('dB', EM.fix(10 * Math.log10(P(p.f)), 1) + ' dB');
      sim.set('tau', EM.si(1 / (2 * Math.PI * g * 1e3), 's'));
    });
  });

  /* ======================================================================
     5.4 Aislamiento de vibraciones
     ====================================================================== */
  EM.defineSim('vibration-isolation', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.9 });
    const cp = sim.canvas({ aspect: 0.9 });
    sim.slider('r', { label: 'Frecuencia de la base <i>ω</i>/<i>ω</i><sub>0</sub>', min: 0.1, max: 5, step: 0.01, value: 3, fmt: f2 });
    sim.slider('z', { label: 'Razón de amortiguamiento <i>ζ</i>', min: 0.01, max: 1, step: 0.01, value: 0.1, fmt: f2 });
    sim.out('Tr', 'Transmisibilidad <i>X</i>/<i>Y</i>', { hl: true });
    sim.out('dB', 'En decibeles');
    sim.out('state', 'Efecto');
    const TR = (r, z) => Math.sqrt((1 + (2 * z * r) ** 2) / ((1 - r * r) ** 2 + (2 * z * r) ** 2));
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, T = TR(p.r, p.z);
      const re = 1 - p.r * p.r, im = 2 * p.z * p.r;
      const ph = Math.atan2(im, re) - Math.atan2(2 * p.z * p.r, 1);
      EM.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      const w = 2 * Math.PI * 0.8, Y = 14;
      const yb = Y * Math.cos(w * t), xm = Math.min(T, 6) * Y * Math.cos(w * t - ph);
      const baseY = H * 0.8 - yb, massY = H * 0.35 - xm;
      ctx.fillStyle = EM.alpha('--ink-3', 0.35);
      ctx.fillRect(W * 0.2, baseY, W * 0.6, 14);
      EM.draw.spring(ctx, W * 0.42, baseY, W * 0.42, massY + 24, { coils: 7, r: 9 });
      EM.draw.damper(ctx, W * 0.58, baseY, W * 0.58, massY + 24, { w: 8 });
      EM.draw.block(ctx, W * 0.5, massY, W * 0.4, 48, { label: 'm', italic: true });
      EM.text(ctx, 'base: Y cos ωt', W * 0.5, H - 10, { size: 11.5, color: '--ink-3', align: 'center' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 5, ymin: 0.01, ymax: 60, ylog: true, xlabel: 'ω / ω₀', ylabel: 'X / Y', ml: 52 });
      pl.frame();
      pl.band(Math.SQRT2, 5, { color: '--c3', alpha: 0.08 });
      pl.hline(1, { color: '--ink-3' });
      pl.vline(Math.SQRT2, { color: '--c3', label: '√2' });
      [0.05, 0.2, 0.5].forEach((z) => pl.fn((r) => TR(r, z), { color: '--grid-2', width: 1.2, n: 600 }));
      pl.fn((r) => TR(r, p.z), { color: '--c1', width: 2.3, n: 800 });
      pl.dot(p.r, T, { color: '--accent', r: 6 });
      sim.set('Tr', EM.fix(T, 3));
      sim.set('dB', EM.fix(20 * Math.log10(T), 1) + ' dB');
      sim.set('state', T > 1 ? 'amplifica la vibración' : 'aísla (atenúa) la vibración');
    });
  });
})();
