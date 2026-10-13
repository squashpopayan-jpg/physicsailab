/* Capítulo 12 — Ondas armónicas, energía e impedancia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     12.1 Onda armónica
     ====================================================================== */
  EM.defineSim('harmonic-wave', function (sim) {
    const cv = sim.canvas({ aspect: 2.5 });
    const cp = sim.canvas({ aspect: 4 });
    sim.slider('A', { label: 'Amplitud <i>A</i>', min: 0.1, max: 1, step: 0.01, value: 0.6, unit: 'cm', fmt: f2 });
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 0.2, max: 2, step: 0.01, value: 0.5, unit: 'Hz', fmt: f2 });
    sim.slider('v', { label: 'Velocidad <i>v</i> (fijada por el medio)', min: 0.5, max: 4, step: 0.05, value: 1.5, unit: 'm/s', fmt: f2 });
    sim.slider('phi', { label: 'Fase inicial <i>φ</i>', min: -180, max: 180, step: 5, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.seg('dir', { label: 'Sentido', options: [[1, '→ +x'], [-1, '← −x']], value: 1 });
    sim.check('vel', { label: 'Velocidad del medio', value: true });
    sim.slider('xp', { label: 'Punto observado <i>x<sub>P</sub></i>', min: 0, max: 6, step: 0.05, value: 1.5, unit: 'm', fmt: f2 });
    sim.out('lam', 'Longitud de onda <i>λ</i> = <i>v</i>/<i>f</i>', { hl: true });
    sim.out('k', 'Número de onda <i>k</i>');
    sim.out('w', 'Frecuencia angular <i>ω</i>');
    sim.out('T', 'Período <i>T</i>');
    sim.out('vm', 'Velocidad máxima del medio <i>ωA</i>');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f, k = w / p.v, ph = M.rad(p.phi);
      const y = (x, tt) => p.A * Math.cos(k * x - p.dir * w * tt + ph);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: -1.3, ymax: 1.3, xlabel: 'x (m)', ylabel: 'y (cm)', ml: 52 });
      pl.frame();
      pl.fn((x) => y(x, t), { color: '--accent', width: 2.4, n: 600 });
      /* medida de λ */
      const lam = p.v / p.f;
      const xc = (((p.dir * w * t - ph) / k) % lam + lam) % lam;
      if (xc + lam <= 6) { pl.arrow(xc, 1.15, xc + lam, 1.15, { color: '--c3', width: 1.4, head: 7 }); pl.arrow(xc + lam, 1.15, xc, 1.15, { color: '--c3', width: 1.4, head: 7 }); pl.label(xc + lam / 2, 1.18, 'λ', { color: '--c3', align: 'center', dy: -4, italic: true }); }
      if (p.vel) for (let x = 0.15; x < 6; x += 0.3) { const vy = (y(x, t + 1e-3) - y(x, t - 1e-3)) / 2e-3; pl.arrow(x, y(x, t), x, y(x, t) + vy * 0.15, { color: '--c1', width: 1.5, head: 6 }); }
      pl.vline(p.xp, { color: '--c5' });
      pl.dot(p.xp, y(p.xp, t), { color: '--c5', r: 7 });
      EM.draw.clear(cp);
      const T = 1 / p.f;
      const pt = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: Math.max(0, t - 3 * T), xmax: Math.max(3 * T, t), ymin: -1.3, ymax: 1.3, xlabel: 't (s)', ylabel: 'y(x_P,t)', ml: 52 });
      pt.frame();
      pt.fn((tt) => y(p.xp, tt), { color: '--c5', width: 2, to: t });
      sim.set('lam', EM.fix(lam, 3) + ' m');
      sim.set('k', EM.fix(k, 3) + ' rad/m');
      sim.set('w', EM.fix(w, 3) + ' rad/s');
      sim.set('T', EM.fix(T, 3) + ' s');
      sim.set('vm', EM.fix(w * p.A, 3) + ' cm/s');
    });
  });

  /* ======================================================================
     12.2 Densidad de energía
     ====================================================================== */
  EM.defineSim('wave-energy', function (sim) {
    const cv = sim.canvas({ aspect: 2.8 });
    const ce = sim.canvas({ aspect: 2.8 });
    sim.seg('kind', { label: 'Tipo de onda', options: [['trav', 'Viajera'], ['stand', 'Estacionaria']], value: 'trav' });
    sim.check('sep', { label: 'Separar cinética y potencial', value: true });
    sim.out('Kt', 'Energía cinética total (relativa)');
    sim.out('Ut', 'Energía potencial total (relativa)', { hl: true });
    let t = 0;
    sim.animate((dt) => { t += dt * 0.8; });
    sim.onDraw(() => {
      const p = sim.p, k = 2 * Math.PI / 2, w = 2 * Math.PI * 0.5;
      const y = p.kind === 'trav' ? (x, tt) => Math.cos(k * x - w * tt) : (x, tt) => Math.sin(k * x) * Math.cos(w * tt);
      const yt = p.kind === 'trav' ? (x, tt) => w * Math.sin(k * x - w * tt) : (x, tt) => -w * Math.sin(k * x) * Math.sin(w * tt);
      const yx = p.kind === 'trav' ? (x, tt) => -k * Math.sin(k * x - w * tt) : (x, tt) => k * Math.cos(k * x) * Math.cos(w * tt);
      /* μ = 1, v = w/k = 1 → T = 1 */
      const uK = (x) => 0.5 * yt(x, t) ** 2, uU = (x) => 0.5 * yx(x, t) ** 2;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: -1.3, ymax: 1.3, xlabel: '', ylabel: 'y', ml: 52, mb: 22 });
      pl.frame();
      pl.fn((x) => y(x, t), { color: '--accent', width: 2.4 });
      EM.draw.clear(ce);
      const pe = new EM.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: 6, ymin: 0, ymax: 10.5, xlabel: 'x (m)', ylabel: 'densidad de energía', ml: 52 });
      pe.frame();
      if (p.sep) {
        pe.fn(uK, { color: '--c1', width: 1.8, fill: '--c1', fillAlpha: 0.12 });
        pe.fn(uU, { color: '--c3', width: 1.8, dash: [5, 3] });
        pe.legend([{ label: 'cinética ½μ(∂y/∂t)²', color: '--c1' }, { label: 'potencial ½T(∂y/∂x)²', color: '--c3', dash: [5, 3] }], 'tr');
      } else pe.fn((x) => uK(x) + uU(x), { color: '--c5', width: 2, fill: '--c5', fillAlpha: 0.15 });
      const K = M.simpson(uK, 0, 6, 200), U = M.simpson(uU, 0, 6, 200);
      sim.set('Kt', EM.fix(K / (K + U), 3));
      sim.set('Ut', EM.fix(U / (K + U), 3));
    });
  });

  /* ======================================================================
     12.3 Potencia transmitida
     ====================================================================== */
  EM.defineSim('wave-power', function (sim) {
    const cv = sim.canvas({ aspect: 2.8 });
    const cp = sim.canvas({ aspect: 3.2 });
    sim.slider('mu', { label: 'Densidad lineal <i>μ</i>', min: 0.5, max: 50, value: 5, log: true, step: 0.1, unit: 'g/m', fmt: (v) => EM.fix(v, 1) });
    sim.slider('T', { label: 'Tensión <i>T</i>', min: 5, max: 300, value: 80, log: true, step: 1, unit: 'N', fmt: (v) => v.toFixed(0) });
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 5, max: 200, step: 1, value: 60, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Amplitud <i>A</i>', min: 0.5, max: 20, step: 0.5, value: 10, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.out('v', 'Velocidad <i>v</i>');
    sim.out('Z', 'Impedancia <i>Z</i> = √(<i>Tμ</i>)');
    sim.out('lam', 'Longitud de onda');
    sim.out('P', 'Potencia media ½<i>Zω</i>²<i>A</i>²', { hl: true });
    sim.out('F', 'Fuerza máxima en el extremo <i>Zω A</i>');
    let t = 0, tr = new EM.Trace(800);
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, mu = p.mu / 1000, v = Math.sqrt(p.T / mu), Z = Math.sqrt(p.T * mu), w = 2 * Math.PI * p.f, A = p.A / 1000;
      const lam = v / p.f;
      /* animación lenta: se muestra la forma en unidades de λ */
      const ts = t * 0.6;
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const nl = 3;
      const pts = [];
      for (let i = 0; i <= 400; i++) { const u = i / 400; pts.push([40 + (W - 60) * u, H / 2 - (H * 0.3) * (p.A / 20) * Math.sin(2 * Math.PI * (nl * u - ts))]); }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2.2 });
      const yh = H / 2 - (H * 0.3) * (p.A / 20) * Math.sin(-2 * Math.PI * ts);
      ctx.fillStyle = EM.col('--c2'); ctx.fillRect(28, yh - 10, 12, 20);
      EM.draw.arrow(ctx, 34, H * 0.9, 34, H * 0.9 - 20 * Math.cos(-2 * Math.PI * ts) * Math.sign(1), { color: '--c2', width: 2 });
      EM.text(ctx, 'se muestran 3 longitudes de onda = ' + EM.fix(3 * lam, 2) + ' m · animación lenta', W - 10, H - 8, { size: 11, color: '--ink-3', align: 'right' });
      /* potencia instantánea */
      EM.draw.clear(cp);
      const Pm = 0.5 * Z * w * w * A * A;
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2, ymin: 0, ymax: 2.2, xlabel: 't / T', ylabel: 'P / ⟨P⟩', ml: 52 });
      pp.frame();
      pp.fn((u) => 2 * Math.sin(2 * Math.PI * u) ** 2, { color: '--c1', width: 2 });
      pp.hline(1, { color: '--accent', label: '⟨P⟩', labelRight: true });
      sim.set('v', EM.fix(v, 1) + ' m/s');
      sim.set('Z', EM.fix(Z, 3) + ' kg/s');
      sim.set('lam', EM.si(lam, 'm'));
      sim.set('P', EM.si(Pm, 'W'));
      sim.set('F', EM.si(Z * w * A, 'N'));
      void tr;
    });
  });

  /* ======================================================================
     12.4 Onda longitudinal
     ====================================================================== */
  EM.defineSim('longitudinal-wave', function (sim) {
    const cv = sim.canvas({ aspect: 3, cls: 'fixed' });
    const cg = sim.canvas({ aspect: 2.6 });
    sim.slider('A', { label: 'Amplitud del desplazamiento <i>kA</i>', min: 0.05, max: 0.8, step: 0.01, value: 0.45, fmt: f2 });
    sim.slider('f', { label: 'Frecuencia (animación)', min: 0.1, max: 1.5, step: 0.05, value: 0.5, unit: 'Hz', fmt: f2 });
    sim.check('trans', { label: 'Mostrar el desplazamiento como si fuera transversal', value: true });
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, k = 2 * Math.PI / 2, w = 2 * Math.PI * p.f, A = p.A / k;
      const xi = (x) => A * Math.cos(k * x - w * t);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = 6, sx = (W - 20) / L;
      /* partículas en una cuadrícula */
      for (let j = 0; j < 9; j++) for (let i = 0; i <= 120; i++) {
        const x0 = (i / 120) * L;
        const xx = 10 + (x0 + xi(x0)) * sx, yy = 12 + (j * (H - 24)) / 8 + (((i * 7 + j * 13) % 5) - 2) * 1.5;
        ctx.fillStyle = (i === 40 && j === 4) ? EM.col('--c2') : EM.alpha('--c1', 0.7);
        ctx.beginPath(); ctx.arc(xx, yy, i === 40 && j === 4 ? 4.5 : 2, 0, 7); ctx.fill();
      }
      EM.draw.clear(cg);
      const pl = new EM.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: L, ymin: -1.4, ymax: 1.4, xlabel: 'posición de equilibrio x (m)', ylabel: 'relativo', ml: 52 });
      pl.frame();
      if (p.trans) pl.fn((x) => xi(x) / A, { color: '--accent', width: 2.2 });
      pl.fn((x) => k * A * Math.sin(k * x - w * t) / (k * A), { color: '--c1', width: 2, dash: [6, 4] });
      pl.legend([{ label: 'desplazamiento ξ', color: '--accent' }, { label: 'compresión −∂ξ/∂x (densidad)', color: '--c1', dash: [6, 4] }], 'tr');
    });
  });
})();
