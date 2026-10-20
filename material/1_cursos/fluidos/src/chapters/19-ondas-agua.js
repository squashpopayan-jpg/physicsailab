/* Capítulo 19 — Ondas en el agua */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;
  const S = 0.0727 / 998.2;

  /* 19.1 Velocidad de fase y de grupo */
  EM.defineSim('dispersion-ondas', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('h', { label: 'Profundidad del agua', min: 0.01, max: 5000, step: 0, value: 10, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.slider('lam', { label: 'Longitud de onda', min: 0.002, max: 2000, step: 0, value: 50, log: true, fmt: (v) => EM.si(v, 'm', 3) });
    sim.check('cap', { label: 'Incluir la tensión superficial', value: true });
    sim.out('T', 'Periodo', { hl: true });
    sim.out('c', 'Velocidad de fase · de grupo');
    sim.out('kh', '<i>kh</i> y régimen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, s = p.cap ? S : 0;
      EM.draw.clear(cv);
      const cf = (l) => { const k = (2 * Math.PI) / l; return FL.waveW(k, p.h, s) / k; }, cgf = (l) => FL.waveCg((2 * Math.PI) / l, p.h, s);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.002, xmax: 2000, ymin: 0.05, ymax: 300, xlog: true, ylog: true, xlabel: 'longitud de onda λ (m)', ylabel: 'velocidad (m/s)' });
      pl.frame();
      pl.fn((l) => Math.sqrt((g * l) / (2 * Math.PI)), { color: '--ink-3', width: 1.1, dash: [4, 4] });
      pl.hline(Math.sqrt(g * p.h), { color: '--c2', label: '√(gh)', labelRight: true });
      pl.fn(cf, { color: '--accent', width: 2.6 });
      pl.fn(cgf, { color: '--c5', width: 2, dash: [6, 3] });
      const l = p.lam, k = (2 * Math.PI) / l, w = FL.waveW(k, p.h, s);
      pl.dot(l, cf(l), { color: '--accent', r: 6 });
      if (p.cap) pl.dot(0.01712, 0.2312, { color: '--ink-3', r: 3.5, label: 'c_min = 23 cm/s', dy: 16 });
      pl.legend([{ label: 'velocidad de fase c', color: '--accent' }, { label: 'velocidad de grupo c_g', color: '--c5', dash: [6, 3] }, { label: 'aguas profundas √(gλ/2π)', color: '--ink-3', dash: [4, 4] }], 'tl');
      const kh = k * p.h;
      sim.set('T', EM.si((2 * Math.PI) / w, 's', 3));
      sim.set('c', EM.fix(w / k, 3) + ' · ' + EM.fix(FL.waveCg(k, p.h, s), 3) + ' m/s');
      sim.set('kh', EM.fix(kh, 3) + ' · ' + (l < 0.01 ? 'capilar' : kh > Math.PI ? 'aguas profundas' : kh < Math.PI / 10 ? 'aguas someras' : 'aguas intermedias'));
    });
  });

  /* 19.2 Paquete de ondas */
  EM.defineSim('paquete-ondas', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('kh', { label: 'Profundidad relativa <i>k</i>₀<i>h</i>', min: 0.2, max: 6, step: 0.05, value: 6, fmt: (v) => v.toFixed(2) });
    sim.slider('nw', { label: 'Ancho del paquete (en longitudes de onda)', min: 2, max: 10, step: 0.5, value: 4, fmt: (v) => v.toFixed(1) });
    sim.out('c', '<i>c</i> · <i>c</i><sub>g</sub> (en unidades de <i>c</i> de aguas profundas)', { hl: true });
    sim.out('r', 'Cociente <i>c</i><sub>g</sub>/<i>c</i>');
    const k0 = 1, L = 60 * Math.PI;
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt * 3; if (t > 60) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, h = p.kh / k0;
      EM.draw.clear(cv);
      const sig = (2 * Math.PI * p.nw) / (k0 * 2.5), nk = 120, ks = [], as = [];
      for (let j = 0; j < nk; j++) { const k = k0 + (-3 + (6 * j) / (nk - 1)) / sig; ks.push(k); as.push(Math.exp(-0.5 * Math.pow((k - k0) * sig, 2))); }
      const ws = ks.map((k) => FL.waveW(k, h, 0) / Math.sqrt(g));
      const norm = as.reduce((a, b) => a + b, 0);
      const x0 = L * 0.12, eta = (x) => { let s = 0; for (let j = 0; j < nk; j++) s += as[j] * Math.cos(ks[j] * (x - x0) - ws[j] * t); return s / norm; };
      const c = FL.waveW(k0, h, 0) / k0 / Math.sqrt(g), cg = FL.waveCg(k0, h, 0) / Math.sqrt(g);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: L, ymin: -1.3, ymax: 1.3, xlabel: 'x k₀', ylabel: 'η', xticks: [] });
      pl.frame();
      pl.fn(eta, { color: '--water', width: 1.8, n: 1400 });
      const env = (x) => Math.exp(-0.5 * Math.pow((x - x0 - cg * t) / sig, 2));
      pl.fn(env, { color: '--c1', width: 1.2, dash: [4, 4] }); pl.fn((x) => -env(x), { color: '--c1', width: 1.2, dash: [4, 4] });
      const xe = x0 + cg * t, xc = x0 + ((c * t) % (L - x0));
      pl.dot(xe, 1.15, { color: '--c1', r: 6, noclip: true });
      pl.dot(xc, Math.max(-1.2, Math.min(1.2, eta(xc))), { color: '--c2', r: 5 });
      pl.legend([{ label: 'cresta: velocidad de fase', color: '--c2', kind: 'dot' }, { label: 'envolvente: velocidad de grupo', color: '--c1', kind: 'dot' }], 'tr');
      sim.set('c', EM.fix(c, 3) + ' · ' + EM.fix(cg, 3));
      sim.set('r', EM.fix(cg / c, 3));
    });
  });

  /* 19.3 Órbitas */
  EM.defineSim('orbitas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('hl', { label: 'Profundidad relativa <i>h</i>/λ', min: 0.04, max: 0.8, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('ka', { label: 'Peralte <i>kA</i>', min: 0.02, max: 0.35, step: 0.01, value: 0.25, fmt: (v) => v.toFixed(2) });
    sim.check('sd', { label: 'Deriva de Stokes', value: false });
    sim.out('r', 'Semiejes horizontal × vertical de la órbita: superficie · fondo (en <i>A</i>)', { hl: true });
    sim.out('us', 'Deriva de Stokes en la superficie (en <i>c</i>)');
    const lam = 1, k = 2 * Math.PI;
    let t = 0, X0 = null;
    const reset = () => { X0 = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) X0.push([0.05 + i * 0.25, j]); };
    reset();
    sim.onChange = reset;
    sim.animate((dt) => {
      const p = sim.p, h = p.hl * lam, A = p.ka / k, w = Math.sqrt(g * k * Math.tanh(k * h));
      t += dt * 0.8;
      if (p.sd) for (const q of X0) { const z0 = -h * (q[1] / 6) * 0.98; q[0] += dt * 0.8 * (w * k * A * A * Math.cosh(2 * k * (z0 + h))) / (2 * Math.pow(Math.sinh(k * h), 2)); }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, h = p.hl * lam, A = p.ka / k, w = Math.sqrt(g * k * Math.tanh(k * h)), sh = Math.sinh(k * h);
      EM.draw.clear(cv);
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, 0, 1.3, -h - 0.05, 0.12);
      const eta = (x) => A * Math.cos(k * x - w * t);
      const surf = []; for (let i = 0; i <= 200; i++) { const x = (1.3 * i) / 200; surf.push(v.map(x, eta(x))); }
      EM.flow.waterFill(ctx, [[v.X(0), v.Y(-h)]].concat(surf, [[v.X(1.3), v.Y(-h)]]), { alpha: 0.3 });
      EM.flow.drawPath(ctx, surf.map((q) => v.inv(q[0], q[1])), v.map, { color: '--water', width: 2.2 });
      ctx.fillStyle = EM.col('--sand'); ctx.fillRect(v.X(0), v.Y(-h), v.X(1.3) - v.X(0), 8);
      for (const q of X0) {
        const z0 = -h * (q[1] / 6) * 0.98, x0 = q[0] % 1.3, a = (A * Math.cosh(k * (z0 + h))) / sh, b = (A * Math.sinh(k * (z0 + h))) / sh;
        ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(v.X(x0), v.Y(z0), Math.max(0.5, a * v.sx), Math.max(0.3, b * v.sy), 0, 0, 2 * Math.PI); ctx.stroke();
        const ph = k * x0 - w * t, xp = x0 - a * Math.sin(ph), zp = z0 + b * Math.cos(ph);
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(xp), v.Y(zp), 3.5, 0, 7); ctx.fill();
      }
      const c = w / k;
      sim.set('r', EM.fix(Math.cosh(k * h) / sh, 3) + '×' + EM.fix(1, 3) + ' · ' + EM.fix(1 / sh, 3) + '×0');
      sim.set('us', EM.fix((w * k * A * A * Math.cosh(2 * k * h)) / (2 * sh * sh) / c, 4));
    });
  });

  /* 19.4 Estela de Kelvin */
  EM.defineSim('kelvin-estela', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('U', { label: 'Velocidad del barco', min: 0.5, max: 20, step: 0.1, value: 5, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('N', { label: 'Número de crestas dibujadas', min: 2, max: 12, step: 1, value: 7, fmt: (v) => v.toFixed(0) });
    sim.out('lam', 'Longitud de onda transversal 2π<i>U</i>²/<i>g</i>', { hl: true });
    sim.out('ang', 'Semiángulo de la cuña');
    let ph = 0;
    sim.animate((dt) => { ph = (ph + dt * 0.25) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = (2 * Math.PI * p.U * p.U) / g;
      EM.draw.clear(cv);
      const L = (p.N + 0.6) * lam;
      const v = EM.flow.view({ x: 6, y: 6, w: W - 12, h: H - 12 }, -L, 0.12 * L, -0.42 * L, 0.42 * L);
      ctx.fillStyle = EM.alpha('--water', 0.12); ctx.fillRect(0, 0, W, H);
      const ta = Math.tan(FL.kelvinAngle);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(-L), v.Y(L * ta)); ctx.moveTo(v.X(0), v.Y(0)); ctx.lineTo(v.X(-L), v.Y(-L * ta)); ctx.stroke(); ctx.setLineDash([]);
      for (let n = 1; n <= p.N; n++) {
        const pts = [];
        for (let i = 0; i <= 300; i++) { const th = -Math.PI / 2 + 0.02 + ((Math.PI - 0.04) * i) / 300; const q = FL.kelvinCrest(th, n - ph, p.U); if (q[0] > -L) pts.push(q); }
        EM.flow.drawPath(ctx, pts, v.map, { color: '--water', width: 2 });
      }
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.moveTo(v.X(0.06 * L), v.Y(0)); ctx.lineTo(v.X(-0.02 * L), v.Y(0.012 * L)); ctx.lineTo(v.X(-0.02 * L), v.Y(-0.012 * L)); ctx.closePath(); ctx.fill();
      EM.draw.arrow(ctx, v.X(0.03 * L), v.Y(0.05 * L), v.X(0.1 * L), v.Y(0.05 * L), { color: '--ink', width: 1.6 });
      EM.text(ctx, '19.47°', v.X(-0.35 * L), v.Y(0.35 * L * ta) - 8, { size: 12, color: '--c2', halo: true });
      sim.set('lam', EM.fix(lam, 2) + ' m');
      sim.set('ang', EM.fix((FL.kelvinAngle * 180) / Math.PI, 3) + '° = arcsen(1/3), sin importar la velocidad');
    });
  });

  /* 19.5 Tsunami */
  EM.defineSim('tsunami', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('A0', { label: 'Elevación inicial del mar', min: 0.2, max: 4, step: 0.1, value: 1, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('hs', { label: 'Profundidad de la plataforma', min: 30, max: 400, step: 5, value: 150, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Tiempo', { hl: true });
    sim.out('c', 'Posición del frente · profundidad local · √(<i>gh</i>)');
    sim.out('A', 'Amplitud del frente · ley de Green');
    const Lx = 420e3, nx = 1400;
    let M, Asea;
    const depth = (x) => { const hs = sim.p.hs; if (x < 280e3) return 4000; if (x < 330e3) return 4000 + (hs - 4000) * ((x - 280e3) / 50e3); if (x < 410e3) return hs + (10 - hs) * ((x - 330e3) / 80e3); return 10; };
    const reset = () => {
      M = new FL.LinSW(nx, Lx, depth); M.sponge = 60;
      for (let i = 0; i < nx; i++) { const x = (i + 0.5) * M.dx; M.eta[i] = sim.p.A0 * Math.exp(-Math.pow((x - 120e3) / 18e3, 2)); }
      Asea = sim.p.A0 / 2;
    };
    reset();
    sim.onChange = reset;
    sim.resetButton(reset);
    sim.animate(() => { const dt = (0.45 * M.dx) / M.cmax; for (let k = 0; k < 40; k++) M.step(dt); if (M.t > 4200) reset(); });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, A0 = sim.p.A0;
      EM.draw.clear(cv);
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.55, xmin: 0, xmax: Lx / 1000, ymin: -1.5 * A0, ymax: 3 * A0, xlabel: '', ylabel: 'η (m)', mb: 16, xticks: [] });
      p1.frame();
      p1.xy(Array.from(M.eta, (_, i) => ((i + 0.5) * M.dx) / 1000), Array.from(M.eta), { color: '--water', width: 2, fill: '--water', fillAlpha: 0.18, base: 0 });
      const p2 = new EM.Plot(ctx, { x: 0, y: H * 0.55, w: W, h: H * 0.45, xmin: 0, xmax: Lx / 1000, ymin: -4300, ymax: 200, xlabel: 'distancia (km) → costa', ylabel: 'fondo (m)', mt: 6 });
      p2.frame();
      p2.fn((xk) => -depth(xk * 1000), { color: '--sand', width: 2, fill: '--sand', fillAlpha: 0.35, base: -4300 });
      /* frente: máximo de η a la derecha del origen de la onda que viaja hacia la costa */
      let im = 0, mx = -1; for (let i = Math.round(nx * 0.3); i < nx; i++) if (M.eta[i] > mx) { mx = M.eta[i]; im = i; }
      const xf = (im + 0.5) * M.dx, hf = depth(xf);
      sim.set('t', EM.fix(M.t / 60, 1) + ' min');
      sim.set('c', EM.fix(xf / 1000, 0) + ' km · ' + EM.fix(hf, 0) + ' m · ' + EM.fix(Math.sqrt(g * hf), 1) + ' m/s');
      sim.set('A', EM.fix(mx, 2) + ' m · ' + EM.fix(FL.greenLaw(Asea, 4000, hf), 2) + ' m');
    });
  });
})();
