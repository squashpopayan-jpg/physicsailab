/* Capítulo 14 — Ondas estacionarias */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     14.1 Dos ondas opuestas
     ====================================================================== */
  EM.defineSim('standing-from-two', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('A2', { label: 'Amplitud de la onda que va hacia −x', min: 0, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.check('parts', { label: 'Mostrar las dos ondas viajeras', value: true });
    sim.check('env', { label: 'Mostrar la envolvente', value: true });
    sim.out('swr', 'Razón de onda estacionaria máx/mín', { hl: true });
    sim.out('r', 'Fracción de la onda que es estacionaria');
    let t = 0;
    sim.animate((dt) => { t += dt * 0.7; });
    sim.onDraw(() => {
      const p = sim.p, k = 2 * Math.PI / 2, w = 2 * Math.PI * 0.5;
      const y1 = (x) => Math.sin(k * x - w * t), y2 = (x) => p.A2 * Math.sin(k * x + w * t);
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: -2.3, ymax: 2.3, xlabel: 'x (m)', ylabel: 'y', ml: 52 });
      pl.frame();
      if (p.env) {
        const e = (x) => Math.sqrt(1 + p.A2 * p.A2 + 2 * p.A2 * Math.cos(2 * k * x));
        /* |sen(kx−ωt) + A₂ sen(kx+ωt)| máx en t: amplitud = √(1 + A₂² − 2A₂ cos 2kx) */
        const env = (x) => Math.sqrt(1 + p.A2 * p.A2 - 2 * p.A2 * Math.cos(2 * k * x));
        void e;
        pl.fn(env, { color: '--ink-3', width: 1.2, dash: [4, 4] });
        pl.fn((x) => -env(x), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      }
      if (p.parts) { pl.fn(y1, { color: '--c1', width: 1.4, alpha: 0.8 }); pl.fn(y2, { color: '--c2', width: 1.4, alpha: 0.8 }); }
      pl.fn((x) => y1(x) + y2(x), { color: '--accent', width: 2.6 });
      if (p.A2 === 1) for (let n = 0; n <= 6; n++) pl.dot(n, 0, { color: '--ink', r: 4 });
      const mx = 1 + p.A2, mn = 1 - p.A2;
      sim.set('swr', mn > 1e-9 ? EM.fix(mx / mn, 3) : '∞ (nodos perfectos)');
      sim.set('r', EM.fix((100 * p.A2), 0) + ' %');
    });
  });

  /* ======================================================================
     14.2 Modos de una cuerda
     ====================================================================== */
  EM.defineSim('string-modes', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.group('Cuerda');
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 0.3, max: 1.5, step: 0.01, value: 0.65, unit: 'm', fmt: f2 });
    sim.slider('T', { label: 'Tensión <i>T</i>', min: 10, max: 200, step: 1, value: 72, unit: 'N', fmt: (v) => v.toFixed(0) });
    sim.slider('mu', { label: 'Densidad <i>μ</i>', min: 0.2, max: 10, step: 0.01, value: 0.39, unit: 'g/m', fmt: f2 });
    sim.seg('bc', { label: 'Extremos', options: [['ff', 'Ambos fijos'], ['fl', 'Uno libre']], value: 'ff' });
    sim.group('Modo');
    sim.slider('n', { label: 'Número de modo <i>n</i>', min: 1, max: 10, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    EM.listenButton(sim, () => { const f = freq(); return { fn: (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 0.8), dur: 2 }; }, { label: '♪ Escuchar el modo' });
    sim.out('f', 'Frecuencia <i>f<sub>n</sub></i>', { hl: true });
    sim.out('lam', 'Longitud de onda <i>λ<sub>n</sub></i>');
    sim.out('f1', 'Fundamental');
    sim.out('nodes', 'Nodos interiores');
    const v = () => Math.sqrt(sim.p.T / (sim.p.mu / 1000));
    const freq = () => { const p = sim.p; return p.bc === 'ff' ? (p.n * v()) / (2 * p.L) : ((2 * p.n - 1) * v()) / (4 * p.L); };
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      const kL = p.bc === 'ff' ? p.n * Math.PI : ((2 * p.n - 1) * Math.PI) / 2;
      EM.draw.clear(cv);
      const x0 = 40, x1 = W - 40, A = H * 0.32, c = Math.cos(2 * Math.PI * 0.6 * Math.sqrt(p.n) * t);
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x0 - 8, H / 2 - 18, 8, 36);
      if (p.bc === 'ff') ctx.fillRect(x1, H / 2 - 18, 8, 36); else ctx.fillRect(x1 + 6, H / 2 - A - 10, 3, 2 * A + 20);
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 400; i++) { const u = i / 400; pts.push([x0 + (x1 - x0) * u, H / 2 - s * A * Math.sin(kL * u)]); } EM.draw.poly(ctx, pts, { color: '--grid-2', width: 1.2, dash: [4, 4] }); }
      const pts = [];
      for (let i = 0; i <= 400; i++) { const u = i / 400; pts.push([x0 + (x1 - x0) * u, H / 2 - A * Math.sin(kL * u) * c]); }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2.6 });
      let nodes = 0;
      for (let m = 1; m < 40; m++) { const u = (m * Math.PI) / kL; if (u < 0.999) { nodes++; EM.draw.bob(ctx, x0 + (x1 - x0) * u, H / 2, 4.5, { color: '--ink' }); } }
      if (p.bc === 'fl') EM.draw.bob(ctx, x1 + 7, H / 2 - A * Math.sin(kL) * c, 6, { color: '--c3' });
      const f = freq();
      sim.set('f', EM.fix(f, 1) + ' Hz');
      sim.set('lam', EM.fix((2 * Math.PI * p.L) / kL, 3) + ' m');
      sim.set('f1', EM.fix(p.bc === 'ff' ? v() / (2 * p.L) : v() / (4 * p.L), 1) + ' Hz');
      sim.set('nodes', String(nodes));
    });
  });

  /* ======================================================================
     14.3 Cuerda pulsada o golpeada
     ====================================================================== */
  EM.defineSim('plucked-string', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    const cs = sim.canvas({ aspect: 3.4 });
    sim.seg('kind', { label: 'Excitación', options: [['pluck', 'Pulsada'], ['hammer', 'Golpeada']], value: 'pluck', onInput: () => { t = 0; } });
    sim.slider('d', { label: 'Punto de excitación <i>d</i>/<i>L</i>', min: 0.02, max: 0.5, step: 0.005, value: 0.2, fmt: (v) => EM.fix(v, 3), onInput: () => { t = 0; } });
    sim.slider('w', { label: 'Ancho del martillo / <i>L</i>', min: 0.005, max: 0.1, step: 0.005, value: 0.02, fmt: (v) => EM.fix(v, 3), onInput: () => { t = 0; } });
    sim.slider('f1', { label: 'Fundamental (sonido)', min: 82, max: 660, step: 1, value: 196, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.button('Centro', () => sim.ctl.d.set(0.5));
    sim.button('L/3', () => sim.ctl.d.set(1 / 3));
    sim.button('Cerca del puente', () => sim.ctl.d.set(0.06));
    EM.listenButton(sim, () => { const a = amps(); const f1 = sim.p.f1; return { fn: (t) => { let s = 0; for (let n = 1; n <= NM; n++) if (n * f1 < 16000) s += a[n - 1] * n * Math.sin(2 * Math.PI * n * f1 * t) * Math.exp(-t * (0.9 + 0.12 * n)); return s; }, dur: 2.6 }; }, { label: '♪ Escuchar' });
    sim.slider('sp', { label: 'Velocidad de la animación', min: 0.02, max: 1, step: 0.01, value: 0.15, fmt: f2 });
    sim.out('miss', 'Armónicos ausentes (de los 12 primeros)', { hl: true });
    sim.out('r21', '<i>a</i><sub>2</sub>/<i>a</i><sub>1</sub>');
    const NM = 60;
    /* amplitudes modales de desplazamiento para L = 1, h = 1 (pulsada) o velocidad máxima equivalente (golpeada) */
    const amps = () => {
      const p = sim.p, out = [];
      for (let n = 1; n <= NM; n++) {
        if (p.kind === 'pluck') out.push((2 / (Math.PI ** 2 * n * n * p.d * (1 - p.d))) * Math.sin(n * Math.PI * p.d));
        else { const sw = n * Math.PI * p.w / 2; out.push(((2 * p.w) / (n * Math.PI)) * Math.sin(n * Math.PI * p.d) * EM.sinc(sw) * 6); }
      }
      return out;
    };
    let t = 0;
    sim.animate((dt) => { t += dt * sim.p.sp; });
    sim.onDraw(() => {
      const p = sim.p, a = amps();
      /* ω_n = nπ (v = 1, L = 1) */
      const y = (x) => { let s = 0; for (let n = 1; n <= NM; n++) { const w = n * Math.PI; s += a[n - 1] * Math.sin(n * Math.PI * x) * (p.kind === 'pluck' ? Math.cos(w * t * 2) : Math.sin(w * t * 2)); } return s; };
      EM.draw.clear(cv);
      const ym = p.kind === 'pluck' ? 1.15 : Math.max(0.05, Math.max(...a.map(Math.abs)) * 3);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: -ym, ymax: ym, xlabel: 'x / L', ylabel: 'y', ml: 52 });
      pl.frame();
      pl.fn(y, { color: '--accent', width: 2.4, n: 400 });
      pl.vline(p.d, { color: '--c3', label: p.kind === 'pluck' ? 'pulsación' : 'martillo' });
      EM.draw.clear(cs);
      const mx = Math.max(...a.map(Math.abs));
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0.3, xmax: 16.7, ymin: 0, ymax: 1.1, xlabel: 'armónico n', ylabel: '|aₙ| relativa', ml: 52, xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] });
      ps.frame();
      for (let n = 1; n <= 16; n++) {
        const v = Math.abs(a[n - 1]) / mx;
        cs.ctx.fillStyle = EM.alpha('--c1', 0.8);
        cs.ctx.fillRect(ps.X(n) - 7, ps.Y(v), 14, ps.Y(0) - ps.Y(v));
      }
      const miss = [];
      for (let n = 1; n <= 12; n++) if (Math.abs(a[n - 1]) / mx < 1e-3) miss.push(n);
      sim.set('miss', miss.length ? miss.join(', ') : 'ninguno');
      sim.set('r21', EM.fix(Math.abs(a[1] / a[0]), 3));
    });
  });

  /* ======================================================================
     14.4 Experimento de Melde
     ====================================================================== */
  EM.defineSim('melde', function (sim) {
    const cv = sim.canvas({ aspect: 2.8 });
    const cp = sim.canvas({ aspect: 3.4 });
    sim.slider('f', { label: 'Frecuencia del vibrador <i>f</i>/<i>f</i><sub>1</sub>', min: 0.1, max: 5.5, step: 0.002, value: 2.95, fmt: (v) => EM.fix(v, 3) });
    sim.slider('eta', { label: 'Pérdidas <i>η</i>', min: 0.002, max: 0.05, step: 0.001, value: 0.01, fmt: (v) => EM.fix(v, 3) });
    sim.button('Barrer', () => { sweep = true; sim.ctl.f.set(0.1); });
    sim.out('A', 'Amplitud máxima / amplitud del vibrador', { hl: true });
    sim.out('n', 'Vientres visibles');
    let t = 0, sweep = false;
    /* k = (ω/v)(1 + iη); y(x) = a sen(k(L−x))/sen(kL) */
    const csin = (re, im) => [Math.sin(re) * Math.cosh(im), Math.cos(re) * Math.sinh(im)];
    const cdiv = (a, b) => { const m = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m]; };
    const shape = (fr, eta, x) => { const k = Math.PI * fr; return cdiv(csin(k * (1 - x), k * eta * (1 - x)), csin(k, k * eta)); };
    const peak = (fr, eta) => { let m = 0; for (let i = 0; i <= 100; i++) { const z = shape(fr, eta, i / 100); m = Math.max(m, Math.hypot(z[0], z[1])); } return m; };
    sim.animate((dt) => { t += dt; if (sweep) { const nf = sim.p.f + dt * 0.25; if (nf >= 5.5) sweep = false; sim.ctl.f.set(Math.min(5.5, nf), true); } });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pk = peak(p.f, p.eta);
      const sc = (H * 0.38) / Math.max(pk, 1);
      const ph = 2 * Math.PI * 1.2 * t;
      const x0 = 50, x1 = W - 30;
      const pts = [];
      for (let i = 0; i <= 300; i++) { const z = shape(p.f, p.eta, i / 300); pts.push([x0 + (x1 - x0) * (i / 300), H / 2 - sc * (z[0] * Math.cos(ph) + z[1] * Math.sin(ph))]); }
      EM.draw.poly(ctx, pts, { color: '--accent', width: 2.2 });
      ctx.fillStyle = EM.col('--c2'); ctx.fillRect(x0 - 26, H / 2 - sc * Math.cos(ph) - 10, 26, 20);
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x1, H / 2 - 18, 8, 36);
      EM.text(ctx, 'vibrador', x0 - 13, H - 10, { size: 11, color: '--c2', align: 'center' });
      EM.draw.clear(cp);
      const pp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0.1, xmax: 5.5, ymin: 0.5, ymax: 200, ylog: true, xlabel: 'f / f₁', ylabel: 'amplitud', ml: 52 });
      pp.frame();
      pp.fn((fr) => peak(fr, p.eta), { color: '--c1', width: 2, n: 500 });
      pp.dot(p.f, pk, { color: '--accent', r: 6 });
      sim.set('A', EM.fix(pk, 1));
      sim.set('n', Math.abs(p.f - Math.round(p.f)) < 0.08 && Math.round(p.f) > 0 ? String(Math.round(p.f)) + ' (resonancia)' : 'patrón poco definido');
    });
  });
})();
