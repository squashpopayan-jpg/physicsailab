/* Capítulo 11 — La ecuación de onda */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* Formas de pulso de ancho w centradas en 0 (altura 1) */
  const SHAPES = {
    gauss: (x, w) => Math.exp(-((x / w) ** 2)),
    tri: (x, w) => Math.max(0, 1 - Math.abs(x) / w),
    saw: (x, w) => (x > -w && x < w * 0.25 ? (x + w) / (1.25 * w) : x >= w * 0.25 && x < w * 0.5 ? (w * 0.5 - x) / (0.25 * w) : 0),
    sq: (x, w) => (Math.abs(x) < w * 0.6 ? 1 : 0),
    sin: (x, w) => (Math.abs(x) < w ? Math.sin((Math.PI * x) / w) : 0)
  };
  EM.SHAPES = SHAPES;
  const shapeOpts = [['gauss', 'Gaussiano'], ['tri', 'Triangular'], ['saw', 'Diente de sierra'], ['sq', 'Rectangular'], ['sin', 'Un ciclo de seno']];

  /* ======================================================================
     11.1 Pulso viajero
     ====================================================================== */
  EM.defineSim('traveling-pulse', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const cr = sim.canvas({ aspect: 3.4 });
    sim.select('shape', { label: 'Forma del pulso', options: shapeOpts, value: 'saw' });
    sim.slider('v', { label: 'Velocidad <i>v</i>', min: 0.5, max: 4, step: 0.05, value: 1.5, unit: 'm/s', fmt: f2 });
    sim.slider('w', { label: 'Ancho del pulso', min: 0.2, max: 1.5, step: 0.05, value: 0.6, unit: 'm', fmt: f2 });
    sim.seg('dir', { label: 'Sentido', options: [[1, '→ +x'], [-1, '← −x']], value: 1, onInput: () => { t = 0; tr = new EM.Trace(2000); } });
    sim.slider('xp', { label: 'Posición del detector <i>x<sub>P</sub></i>', min: -4, max: 4, step: 0.1, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 1) });
    sim.check('vel', { label: 'Mostrar la velocidad del medio ∂y/∂t', value: true });
    sim.resetButton(() => { t = 0; tr = new EM.Trace(2000); });
    sim.out('y', 'Desplazamiento en <i>x<sub>P</sub></i>', { hl: true });
    sim.out('arr', 'Llegada del centro del pulso');
    let t = 0, tr = new EM.Trace(2000);
    const L = 5;
    sim.animate((dt) => {
      t += dt;
      const p = sim.p, x0 = -p.dir * 4;
      if (Math.abs(x0 + p.dir * p.v * t) > L + 2) { t = 0; tr = new EM.Trace(2000); }
      tr.push(t, SHAPES[p.shape](p.xp - x0 - p.dir * p.v * t, p.w));
    });
    sim.onDraw(() => {
      const p = sim.p, x0 = -p.dir * 4, f = SHAPES[p.shape];
      const y = (x, tt) => f(x - x0 - p.dir * p.v * tt, p.w);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -L, xmax: L, ymin: -0.4, ymax: 1.35, xlabel: 'x (m)', ylabel: 'y', title: 'Fotografía en t = ' + EM.fix(t, 2) + ' s', ml: 52 });
      pl.frame();
      pl.fn((x) => y(x, t), { color: '--accent', width: 2.4, n: 800 });
      if (p.vel) {
        for (let x = -L + 0.25; x < L; x += 0.25) {
          const h = 1e-3, vy = (y(x, t + h) - y(x, t - h)) / (2 * h);
          if (Math.abs(vy) > 0.02) pl.arrow(x, y(x, t), x, y(x, t) + M.clamp(vy * 0.18, -0.6, 0.6), { color: '--c1', width: 1.6, head: 6 });
        }
      }
      pl.vline(p.xp, { color: '--c3', label: 'detector' });
      pl.dot(p.xp, y(p.xp, t), { color: '--c3', r: 5 });
      pl.arrow(x0 + p.dir * p.v * t - p.dir * 0.4, 1.22, x0 + p.dir * p.v * t + p.dir * 0.4, 1.22, { color: '--ink-2', width: 1.8 });
      EM.draw.clear(cr);
      const tmax = (2 * L + 4) / p.v;
      const pr = new EM.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: tmax, ymin: -0.2, ymax: 1.2, xlabel: 't (s)', ylabel: 'y(x_P, t)', title: 'Registro del detector', ml: 52 });
      pr.frame();
      pr.xy(tr.t, tr.col(0), { color: '--c3', width: 2.2 });
      sim.set('y', EM.fix(y(p.xp, t), 3));
      sim.set('arr', 't = ' + EM.fix((p.xp - x0) * p.dir / p.v, 2) + ' s');
    });
  });

  /* ======================================================================
     11.2 Fuerzas en la cuerda: aceleración ∝ curvatura
     ====================================================================== */
  EM.defineSim('string-forces', function (sim) {
    const cv = sim.canvas({ aspect: 2.5 });
    sim.select('shape', { label: 'Forma', options: [['two', 'Dos pulsos que se cruzan'], ['gauss', 'Pulso gaussiano'], ['tri', 'Pulso triangular (suavizado)'], ['sin', 'Onda armónica']], value: 'gauss' });
    sim.check('acc', { label: 'Flechas de aceleración', value: true });
    sim.check('vel', { label: 'Flechas de velocidad', value: false });
    sim.out('note', 'Lectura');
    let t = 0;
    sim.animate((dt) => { t += dt * 0.8; if (t > 8) t = -2; });
    sim.onDraw(() => {
      const p = sim.p;
      let y;
      if (p.shape === 'gauss') y = (x, tt) => Math.exp(-(((x + 3 - tt) / 0.6) ** 2));
      else if (p.shape === 'tri') y = (x, tt) => { let s = 0; for (let k = -4; k <= 4; k++) s += Math.max(0, 1 - Math.abs(x + 3 - tt + k * 0.03) / 0.7); return s / 9; };
      else if (p.shape === 'sin') y = (x, tt) => 0.7 * Math.sin(1.6 * (x - tt));
      else y = (x, tt) => Math.exp(-(((x + 3 - tt) / 0.5) ** 2)) - 0.7 * Math.exp(-(((x - 3 + tt) / 0.7) ** 2));
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -5, xmax: 5, ymin: -1.4, ymax: 1.6, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      pl.fn((x) => y(x, t), { color: '--accent', width: 2.4, n: 800 });
      for (let x = -4.8; x <= 4.8; x += 0.2) {
        const h = 0.01, yy = y(x, t);
        const a = (y(x + h, t) - 2 * yy + y(x - h, t)) / (h * h);
        const v = (y(x, t + h) - y(x, t - h)) / (2 * h);
        if (p.acc && Math.abs(a) > 0.05) pl.arrow(x, yy, x, yy + M.clamp(a * 0.12, -0.9, 0.9), { color: '--c2', width: 1.6, head: 6 });
        if (p.vel && Math.abs(v) > 0.03) pl.arrow(x + 0.04, yy, x + 0.04, yy + v * 0.35, { color: '--c1', width: 1.6, head: 6 });
      }
      sim.set('note', 'rojo: aceleración ∝ ∂²y/∂x²' + (p.vel ? ' · azul: velocidad' : ''));
    });
  });

  /* ======================================================================
     11.3 Velocidad en cuerdas reales
     ====================================================================== */
  EM.defineSim('string-speed', function (sim) {
    const cv = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    const MAT = { steel: ['Acero', 7850], nylon: ['Nailon', 1140], bronze: ['Bronce entorchado (efectivo)', 12000], gut: ['Tripa', 1300], cu: ['Cobre', 8960] };
    sim.select('mat', { label: 'Material', options: Object.keys(MAT).map((k) => [k, MAT[k][0]]), value: 'steel' });
    sim.slider('d', { label: 'Diámetro', min: 0.1, max: 2, step: 0.01, value: 0.25, unit: 'mm', fmt: f2 });
    sim.slider('T', { label: 'Tensión <i>T</i>', min: 5, max: 1000, value: 72, log: true, step: 0.5, unit: 'N', fmt: (v) => EM.fix(v, 1) });
    sim.slider('L', { label: 'Longitud vibrante <i>L</i>', min: 0.2, max: 2, step: 0.01, value: 0.65, unit: 'm', fmt: f2 });
    EM.listenButton(sim, () => { const v = Math.sqrt(sim.p.T / mu()), f1 = v / (2 * sim.p.L); return { fn: (t) => { let s = 0; for (let n = 1; n <= 12; n++) s += (Math.sin(n * 0.7) / (n * n)) * Math.sin(2 * Math.PI * n * f1 * t) * Math.exp(-t * (1.2 + 0.5 * n)); return s; }, dur: 2.5 }; }, { label: '♪ Pulsar la cuerda' });
    sim.out('mu', 'Densidad lineal <i>μ</i>');
    sim.out('v', 'Velocidad <i>v</i> = √(<i>T</i>/<i>μ</i>)', { hl: true });
    sim.out('f1', 'Frecuencia fundamental <i>v</i>/2<i>L</i>');
    sim.out('st', 'Esfuerzo <i>T</i>/<i>A</i>');
    const mu = () => MAT[sim.p.mat][1] * Math.PI * (sim.p.d * 5e-4) ** 2;
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, m = mu(), v = Math.sqrt(p.T / m), f1 = v / (2 * p.L);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const x0 = 30, x1 = W - 30, y0 = H / 2, A = H * 0.25 * Math.cos(2 * Math.PI * Math.min(f1, 3) * t * 0.3);
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x0 - 8, y0 - 16, 8, 32); ctx.fillRect(x1, y0 - 16, 8, 32);
      const pts = [];
      for (let i = 0; i <= 100; i++) pts.push([x0 + ((x1 - x0) * i) / 100, y0 - A * Math.sin((Math.PI * i) / 100)]);
      EM.draw.poly(ctx, pts, { color: '--accent', width: 1 + Math.min(5, p.d * 3) });
      EM.text(ctx, 'modo fundamental (animación lenta)', 10, H - 8, { size: 11, color: '--ink-3' });
      sim.set('mu', EM.si(m * 1000, 'g/m'));
      sim.set('v', EM.fix(v, 1) + ' m/s');
      sim.set('f1', EM.fix(f1, 1) + ' Hz');
      const st = p.T / (Math.PI * (p.d * 5e-4) ** 2);
      sim.set('st', EM.si(st, 'Pa') + (p.mat === 'steel' && st > 2e9 ? ' (¡rompe!)' : ''));
    });
  });

  /* ======================================================================
     11.4 D'Alembert
     ====================================================================== */
  EM.defineSim('dalembert', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.seg('ic', { label: 'Condición inicial', options: [['y', 'Deformación'], ['u', 'Golpe'], ['both', 'Pulso → +x']], value: 'y', onInput: () => { t = 0; } });
    sim.select('shape', { label: 'Forma', options: shapeOpts.slice(0, 4), value: 'tri', onInput: () => { t = 0; } });
    sim.slider('w', { label: 'Ancho', min: 0.3, max: 1.5, step: 0.05, value: 0.8, unit: 'm', fmt: f2 });
    sim.check('parts', { label: 'Mostrar las dos componentes f y g', value: true });
    sim.resetButton(() => { t = 0; });
    sim.out('t', 'Tiempo (<i>v</i> = 1 m/s)');
    let t = 0, gtab = null;
    sim.animate((dt) => { t += dt * 0.8; if (t > 5) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, f0 = (x) => SHAPES[p.shape](x, p.w);
      /* integral acumulada de la velocidad inicial (u0 = f0): G(x) = ∫_{-∞}^x u0 */
      const key = p.shape + p.w;
      if (!gtab || gtab.key !== key) {
        const n = 1201, arr = new Float64Array(n);
        for (let i = 1; i < n; i++) { const xa = -3 + (6 * (i - 1)) / (n - 1), xb = -3 + (6 * i) / (n - 1); arr[i] = arr[i - 1] + 0.5 * (f0(xa) + f0(xb)) * (xb - xa); }
        gtab = { key, arr, n };
      }
      const G = (x) => { const u = ((M.clamp(x, -3, 3) + 3) / 6) * (gtab.n - 1); const i = Math.min(gtab.n - 2, Math.floor(u)); return gtab.arr[i] + (gtab.arr[i + 1] - gtab.arr[i]) * (u - i); };
      let fR, fL;
      if (p.ic === 'y') { fR = (x) => 0.5 * f0(x - t); fL = (x) => 0.5 * f0(x + t); }
      else if (p.ic === 'u') { fR = (x) => -0.5 * G(x - t) * 0.7; fL = (x) => 0.5 * G(x + t) * 0.7; }
      else { fR = (x) => f0(x - t); fL = () => 0; }
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -5, xmax: 5, ymin: p.ic === 'u' ? -0.5 : -0.3, ymax: 1.2, xlabel: 'x (m)', ylabel: 'y', ml: 52 });
      pl.frame();
      if (p.ic !== 'u') pl.fn(f0, { color: '--grid-2', width: 1.4, dash: [4, 4] });
      if (p.parts && p.ic !== 'both') {
        pl.fn(fR, { color: '--c1', width: 1.4, dash: [6, 4], n: 400 });
        pl.fn(fL, { color: '--c2', width: 1.4, dash: [6, 4], n: 400 });
      }
      pl.fn((x) => fR(x) + fL(x), { color: '--accent', width: 2.6, n: 400 });
      if (p.parts && p.ic !== 'both') pl.legend([{ label: 'f(x − vt)', color: '--c1', dash: [6, 4] }, { label: 'g(x + vt)', color: '--c2', dash: [6, 4] }, { label: 'y = f + g', color: '--accent' }], 'tr');
      sim.set('t', EM.fix(t, 2) + ' s');
    });
  });

  /* ======================================================================
     11.5 Choque de pulsos
     ====================================================================== */
  EM.defineSim('pulse-collision', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    const ce = sim.canvas({ aspect: 4.5 });
    sim.slider('A2', { label: 'Amplitud del pulso que viene por la derecha', min: -1, max: 1, step: 0.05, value: -1, fmt: f2 });
    sim.slider('w2', { label: 'Ancho del pulso derecho', min: 0.3, max: 1.2, step: 0.05, value: 0.6, unit: 'm', fmt: f2 });
    sim.check('parts', { label: 'Mostrar cada pulso por separado', value: true });
    sim.out('K', 'Energía cinética / total', { hl: true });
    let t = 0;
    sim.animate((dt) => { t += dt * 0.7; if (t > 8) t = 0; });
    sim.onDraw(() => {
      const p = sim.p;
      const f = (x, tt) => Math.exp(-(((x + 4 - tt) / 0.6) ** 2));
      const g = (x, tt) => p.A2 * Math.exp(-(((x - 4 + tt) / p.w2) ** 2));
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -5, xmax: 5, ymin: -2.1, ymax: 2.1, xlabel: 'x', ylabel: 'y', ml: 52 });
      pl.frame();
      if (p.parts) { pl.fn((x) => f(x, t), { color: '--c1', width: 1.3, dash: [5, 4] }); pl.fn((x) => g(x, t), { color: '--c2', width: 1.3, dash: [5, 4] }); }
      pl.fn((x) => f(x, t) + g(x, t), { color: '--accent', width: 2.6, n: 600 });
      /* energías (v = 1, μ = T = 1) */
      let K = 0, U = 0;
      const h = 0.02, e = 1e-3;
      for (let x = -6; x <= 6; x += h) {
        const y = (xx, tt) => f(xx, tt) + g(xx, tt);
        const vy = (y(x, t + e) - y(x, t - e)) / (2 * e), sl = (y(x + e, t) - y(x - e, t)) / (2 * e);
        K += 0.5 * vy * vy * h; U += 0.5 * sl * sl * h;
      }
      EM.draw.clear(ce);
      const ctx = ce.ctx, W = ce.w, H = ce.h, tot = K + U || 1;
      ctx.fillStyle = EM.alpha('--c1', 0.8); ctx.fillRect(60, H * 0.25, (W - 80) * (K / tot), H * 0.22);
      ctx.fillStyle = EM.alpha('--c3', 0.8); ctx.fillRect(60, H * 0.55, (W - 80) * (U / tot), H * 0.22);
      EM.text(ctx, 'cinética', 54, H * 0.36, { size: 11.5, color: '--c1', align: 'right', baseline: 'middle' });
      EM.text(ctx, 'potencial', 54, H * 0.66, { size: 11.5, color: '--c3', align: 'right', baseline: 'middle' });
      sim.set('K', EM.fix((100 * K) / tot, 1) + ' %');
    });
  });
})();
