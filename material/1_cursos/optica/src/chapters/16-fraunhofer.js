/* Capítulo 16 — Difracción de Fraunhofer */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  /* Tabla de 2J₁(x)/x para dibujar rápido (calculada con OP.besselJ) */
  const XM = 60, DX = 0.005, TAB = new Float64Array(Math.round(XM / DX) + 2);
  let tabReady = false;
  const jinc = (x) => {
    if (!tabReady) { for (let i = 0; i < TAB.length; i++) { const v = i * DX; TAB[i] = v < 1e-9 ? 1 : (2 * OP.besselJ(1, v)) / v; } tabReady = true; }
    x = Math.abs(x);
    if (x >= XM) return (2 * OP.besselJ(1, x)) / x;
    const t = x / DX, i = Math.floor(t), f = t - i;
    return TAB[i] + f * (TAB[i + 1] - TAB[i]);
  };
  EM.od.jinc = jinc;

  /* 16.1 Rendija simple */
  EM.defineSim('rendija', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('a', { label: 'Ancho de la rendija', min: 10, max: 300, step: 1, value: 100, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Dirección de observación', min: -40, max: 40, step: 0.05, value: 4, unit: 'mrad', fmt: (v) => v.toFixed(2) });
    sim.out('b', 'β = πa sen θ/λ', { hl: true });
    sim.out('I', 'I/I₀');
    sim.out('w', 'Ancho del máximo central en una pantalla a 1 m');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.a * 1e-6, lam = p.lam * 1e-9, th = p.th * 1e-3;
      EM.draw.clear(cv);
      const beta = (Math.PI * a * Math.sin(th)) / lam;
      /* espiral de fasores: N fasores que cubren una fase total 2β */
      const Nf = 40, v = D.view({ x: 10, y: 10, w: W * 0.32 - 20, h: H * 0.62 }, -0.15, 1.15, -0.75, 0.75);
      let x = 0, y = 0;
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0));
      for (let i = 0; i < Nf; i++) { const ph = -beta + (2 * beta * (i + 0.5)) / Nf; x += Math.cos(ph) / Nf; y += Math.sin(ph) / Nf; ctx.lineTo(v.X(x), v.Y(y)); }
      ctx.stroke();
      EM.draw.arrow(ctx, v.X(0), v.Y(0), v.X(x), v.Y(y), { color: '--c2', width: 2.6 });
      EM.text(ctx, 'fasores de la rendija', v.X(0), v.Y(-0.7), { size: 11, color: '--ink-2' });
      const thmax = 3.5 * lam / a;
      const pl = new EM.Plot(ctx, { x: W * 0.32, y: 0, w: W * 0.68, h: H * 0.7, xmin: -thmax * 1000, xmax: thmax * 1000, ymin: 0, ymax: 1.05, xlabel: 'θ (mrad)', ylabel: 'I/I₀' });
      pl.frame();
      pl.fn((t) => OP.slitI(a, lam, t * 1e-3), { color: D.lamRay(p.lam), width: 2.2, n: 800 });
      pl.dot(p.th, OP.slitI(a, lam, th), { color: '--c2', r: 6 });
      D.screen(ctx, { x: pl.ix, y: H * 0.82, w: pl.iw, h: H * 0.14 }, (s) => OP.slitI(a, lam, s * thmax), OP.lambdaRGB(p.lam, 1, 0.35), { gamma: 0.45 });
      sim.set('b', EM.fix(beta, 3) + ' rad (' + EM.fix(beta / Math.PI, 3) + 'π)');
      sim.set('I', EM.fix(OP.slitI(a, lam, th), 5));
      sim.set('w', EM.fix(((2 * lam) / a) * 1000, 2) + ' mm');
    });
  });

  /* 16.2 Abertura rectangular */
  EM.defineSim('rectangular', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Lado horizontal a', min: 10, max: 200, step: 1, value: 60, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Lado vertical b', min: 10, max: 200, step: 1, value: 120, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.check('log', { label: 'Escala logarítmica', value: true });
    sim.out('ext', 'Primeros ceros (horizontal, vertical)', { hl: true });
    const N = 200, vals = new Float32Array(N * N);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = 633e-9;
      EM.draw.clear(cv);
      const tmax = (4 * lam) / 10e-6 * 0.6; /* ventana angular fija (rad) */
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const tx = ((i + 0.5) / N - 0.5) * 2 * tmax, ty = ((j + 0.5) / N - 0.5) * 2 * tmax;
        const I = Math.pow(OP.sinc((Math.PI * p.a * 1e-6 * tx) / lam), 2) * Math.pow(OP.sinc((Math.PI * p.b * 1e-6 * ty) / lam), 2);
        vals[j * N + i] = p.log ? Math.max(0, 1 + Math.log10(I + 1e-12) / 4) : I;
      }
      const S = Math.min(H - 10, W * 0.48), rgb = OP.lambdaRGB(633, 1, 0.4);
      D.paint(ctx, vals, N, N, { x: W * 0.5, y: (H - S) / 2, w: S, h: S }, D.tint(rgb, p.log ? 1 : 0.5));
      /* abertura */
      const v = D.view({ x: 10, y: 10, w: W * 0.45 - 20, h: H - 20 }, -110, 110, -110, 110);
      ctx.fillStyle = '#111'; ctx.fillRect(v.X(-110), v.Y(110), v.X(110) - v.X(-110), v.Y(-110) - v.Y(110));
      ctx.fillStyle = '#FFF'; ctx.fillRect(v.X(-p.a / 2), v.Y(p.b / 2), v.X(p.a / 2) - v.X(-p.a / 2), v.Y(-p.b / 2) - v.Y(p.b / 2));
      EM.text(ctx, 'abertura', v.X(0), v.Y(-110) + 14, { size: 11, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'patrón (±' + EM.fix(tmax * 1000, 1) + ' mrad)', W * 0.5 + S / 2, (H + S) / 2 - 6, { size: 11, color: '#DDD', align: 'center' });
      sim.set('ext', EM.fix((lam / (p.a * 1e-6)) * 1000, 2) + ' mrad, ' + EM.fix((lam / (p.b * 1e-6)) * 1000, 2) + ' mrad');
    });
  });

  /* 16.3 Disco de Airy */
  EM.defineSim('airy', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N', { label: 'Número f del sistema', min: 1, max: 16, step: 0.1, value: 4, fmt: (v) => 'f/' + v.toFixed(1) });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('eps', { label: 'Obstrucción central (fracción del diámetro)', min: 0, max: 0.6, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('r', 'Radio del disco de Airy 1.22λN', { hl: true });
    sim.out('E', 'Energía dentro del primer anillo oscuro');
    const N = 180, vals = new Float32Array(N * N);
    const amp = (x, e) => (jinc(x) - e * e * jinc(e * x)) / (1 - e * e);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, e = p.eps;
      EM.draw.clear(cv);
      const xmax = 14;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = Math.hypot((i + 0.5) / N - 0.5, (j + 0.5) / N - 0.5) * 2 * xmax; vals[j * N + i] = Math.pow(amp(x, e), 2); }
      const S = Math.min(H - 10, W * 0.42), rgb = OP.lambdaRGB(p.lam, 1, 0.4);
      D.paint(ctx, vals, N, N, { x: 6, y: (H - S) / 2, w: S, h: S }, D.tint(rgb, 0.35));
      const r1 = 1.22 * p.lam * 1e-3 * p.N; /* µm */
      const pl = new EM.Plot(ctx, { x: S + 12, y: 0, w: W - S - 12, h: H, xmin: 0, xmax: xmax, ymin: 0, ymax: 1.05, xlabel: 'x = πD sen θ/λ', ylabel: 'intensidad / energía' });
      pl.frame();
      pl.fn((x) => Math.pow(amp(x, e), 2), { color: D.lamRay(p.lam), width: 2.2, n: 700 });
      /* energía encerrada (integración numérica del perfil, normalizada) */
      const ee = []; let acc = 0; const dx = 0.02; const tot = OP.simpson((x) => Math.pow(amp(x, e), 2) * x, 0, 400, 20000);
      const xs = []; for (let x = 0; x <= xmax; x += dx) { acc += Math.pow(amp(x + dx / 2, e), 2) * (x + dx / 2) * dx; xs.push(x + dx); ee.push(acc / tot); }
      pl.xy(xs, ee, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.vline(3.8317, { color: '--ink-3', label: '3.832', labelY: 14 });
      let e1 = 0; for (let k = 0; k < xs.length; k++) if (xs[k] <= 3.8317) e1 = ee[k];
      sim.set('r', EM.fix(r1, 3) + ' µm');
      sim.set('E', EM.fix(100 * e1, 1) + ' %' + (e === 0 ? ' (teórico 83.8 %)' : ''));
    });
  });

  /* 16.4 Criterio de Rayleigh */
  EM.defineSim('rayleigh', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('s', { label: 'Separación (en unidades de 1.22 λ/D)', min: 0, max: 2.5, step: 0.005, value: 1, fmt: (v) => v.toFixed(3) });
    sim.slider('q', { label: 'Brillo de la segunda estrella', min: 0.1, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.button('Rayleigh', () => sim.ctl.s.set(1)); sim.button('Sparrow', () => sim.ctl.s.set(0.7785));
    sim.out('dip', 'Intensidad en el punto medio / máximo', { hl: true });
    sim.out('res', 'Veredicto');
    const N = 180, vals = new Float32Array(N * 90);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, sep = p.s * 3.8317;
      EM.draw.clear(cv);
      const I = (x, y) => Math.pow(jinc(Math.hypot(x + sep / 2, y)), 2) + p.q * Math.pow(jinc(Math.hypot(x - sep / 2, y)), 2);
      const span = 12;
      for (let j = 0; j < 90; j++) for (let i = 0; i < N; i++) vals[j * N + i] = I(((i + 0.5) / N - 0.5) * span * 2, ((j + 0.5) / 90 - 0.5) * span);
      D.paint(ctx, vals, N, 90, { x: 6, y: 6, w: W * 0.5 - 12, h: (W * 0.5 - 12) / 2 }, D.tint([255, 240, 200], 0.4));
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -10, xmax: 10, ymin: 0, ymax: 1.6, xlabel: 'x = πD sen θ/λ', ylabel: 'intensidad' });
      pl.frame();
      pl.fn((x) => Math.pow(jinc(x + sep / 2), 2), { color: '--ink-3', width: 1, dash: [4, 4], n: 600 });
      pl.fn((x) => p.q * Math.pow(jinc(x - sep / 2), 2), { color: '--ink-3', width: 1, dash: [4, 4], n: 600 });
      pl.fn((x) => I(x, 0), { color: '--accent', width: 2.4, n: 800 });
      let mx = 0; for (let x = -8; x <= 8; x += 0.01) mx = Math.max(mx, I(x, 0));
      const mid = I(0, 0) / mx;
      sim.set('dip', EM.fix(mid, 3));
      sim.set('res', p.s >= 0.999 ? 'resueltas (Rayleigh)' : mid < 0.999 ? 'apenas separadas (entre Sparrow y Rayleigh)' : 'no resueltas: un solo pico');
    });
  });

  /* 16.5 Babinet: un cabello y una rendija */
  EM.defineSim('babinet', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('obj', { label: 'Objeto', options: [['r', 'Rendija'], ['h', 'Cabello (alambre)']], value: 'h' });
    sim.slider('d', { label: 'Ancho del objeto', min: 20, max: 150, step: 1, value: 70, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia a la pared', min: 0.5, max: 4, step: 0.05, value: 2, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('dy', 'Separación de los mínimos', { hl: true });
    sim.out('d', 'Diámetro deducido λL/Δy');
    const lam = 650e-9, wb = 1.2e-3; /* radio del haz láser */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = p.d * 1e-6;
      EM.draw.clear(cv);
      ctx.fillStyle = '#05070A'; ctx.fillRect(0, 0, W, H * 0.36);
      const ymax = 0.12; /* m en la pared */
      const slit = (y) => OP.slitI(d, lam, Math.atan(y / p.L));
      /* el haz directo (gaussiano) en la pared, mucho más intenso que lo difractado */
      const beam = (y) => 1e3 * Math.exp(-2 * Math.pow(y / wb, 2));
      const Iw = (y) => (p.obj === 'r' ? slit(y) * (d / wb) * 0.5 : beam(y) + slit(y) * (d / wb) * 0.5);
      const r = { x: 10, y: 14, w: W - 20, h: H * 0.32 };
      D.screen(ctx, r, (s) => Iw(s * ymax), [230, 40, 40], { max: (d / wb) * 0.5, gamma: 0.45 });
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.38, w: W, h: H * 0.62, xmin: -ymax * 1000, xmax: ymax * 1000, ymin: 0, ymax: 1.1, xlabel: 'posición en la pared (mm)', ylabel: 'I/I₀ (difractada)' });
      pl.frame();
      pl.fn((ymm) => slit(ymm / 1000), { color: '#E8484D', width: 2, n: 900 });
      if (p.obj === 'h') EM.text(ctx, 'en el centro, el haz directo satura el detector', pl.ix + pl.iw / 2, pl.iy + 14, { size: 11, color: '--ink-2', align: 'center', halo: true });
      const dy = (lam * p.L) / d;
      sim.set('dy', EM.fix(dy * 1000, 2) + ' mm');
      sim.set('d', EM.fix(((lam * p.L) / dy) * 1e6, 1) + ' µm');
    });
  });
})();
