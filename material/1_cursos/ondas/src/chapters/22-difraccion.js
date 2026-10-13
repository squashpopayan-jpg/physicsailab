/* Capítulo 22 — Difracción */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);
  const colorOf = (nm) => EM.rgbStr(EM.wavelengthRGB(nm));

  /* Franja de pantalla coloreada con intensidad I(x), x ∈ [−1, 1] */
  function screenStrip(cv, nm, I, o = {}) {
    const ctx = cv.ctx, W = cv.w, H = o.h || cv.h, y0 = o.y || 0;
    const q = EM.wavelengthRGB(nm);
    for (let i = 0; i < W; i++) { const v = Math.min(1, I((2 * i) / W - 1) * (o.gain || 1)); ctx.fillStyle = `rgb(${q[0] * v},${q[1] * v},${q[2] * v})`; ctx.fillRect(i, y0, 1.5, H); }
  }
  EM.screenStrip = screenStrip;

  /* ======================================================================
     22.1 Rendija simple y arco de fasores
     ====================================================================== */
  EM.defineSim('single-slit', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 5, cls: 'full fixed' });
    const cp = sim.canvas({ aspect: 1.1 });
    const cf = sim.canvas({ aspect: 1.1 });
    sim.slider('a', { label: 'Ancho de la rendija <i>a</i>/<i>λ</i>', min: 0.5, max: 12, step: 0.05, value: 4, fmt: f2 });
    sim.slider('th', { label: 'Ángulo de observación <i>θ</i>', min: -60, max: 60, step: 0.1, value: 10, unit: '°', fmt: (v) => EM.fix(v, 1) });
    sim.slider('lam', { label: 'Color (para la pantalla)', min: 400, max: 700, step: 1, value: 532, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.seg('scale', { label: 'Escala', options: [['lin', 'Lineal'], ['log', 'Log']], value: 'lin' });
    sim.out('b', '<i>β</i> = <i>πa</i> sen<i>θ</i>/<i>λ</i>', { hl: true });
    sim.out('I', '<i>I</i>/<i>I</i><sub>0</sub>');
    sim.out('m1', 'Primer mínimo');
    const I = (thd) => { const b = Math.PI * sim.p.a * Math.sin(M.rad(thd)); return EM.sinc(b) ** 2; };
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cs);
      screenStrip(cs, p.lam, (u) => I(u * 60), { gain: 1.4 });
      cs.ctx.strokeStyle = '#fff'; cs.ctx.lineWidth = 2; const xm = ((p.th / 60 + 1) / 2) * cs.w;
      cs.ctx.beginPath(); cs.ctx.moveTo(xm, 0); cs.ctx.lineTo(xm, 8); cs.ctx.moveTo(xm, cs.h - 8); cs.ctx.lineTo(xm, cs.h); cs.ctx.stroke();
      EM.draw.clear(cp);
      const log = p.scale === 'log';
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -60, xmax: 60, ymin: log ? 1e-4 : 0, ymax: log ? 1.5 : 1.08, ylog: log, xlabel: 'θ (°)', ylabel: 'I / I₀', ml: 52 });
      pl.frame();
      pl.fn(I, { color: colorOf(p.lam), width: 2.2, n: 1200 });
      pl.dot(p.th, Math.max(I(p.th), log ? 1.2e-4 : 0), { color: '--accent', r: 6 });
      /* arco de fasores: N fasores cuyo desfase total es 2β */
      EM.draw.clear(cf);
      const ctx = cf.ctx, W = cf.w, H = cf.h, N = 40;
      const b = Math.PI * p.a * Math.sin(M.rad(p.th));
      const L = (Math.min(W, H) * 0.7) / N;
      let x = 0, y = 0;
      const pts = [[0, 0]];
      for (let n = 0; n < N; n++) { const ph = -b + (2 * b * (n + 0.5)) / N; x += L * Math.cos(ph); y += L * Math.sin(ph); pts.push([x, y]); }
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const ox = W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, oy = H / 2 + (Math.min(...ys) + Math.max(...ys)) / 2;
      for (let n = 0; n < N; n++) EM.draw.arrow(ctx, ox + pts[n][0], oy - pts[n][1], ox + pts[n + 1][0], oy - pts[n + 1][1], { color: EM.mix('--c1', '--c5', n / N), width: 1.4, head: 4 });
      EM.draw.arrow(ctx, ox, oy, ox + x, oy - y, { color: '--accent', width: 3 });
      EM.text(ctx, 'fasores de 40 franjas de la rendija', 10, H - 10, { size: 11, color: '--ink-3' });
      sim.set('b', EM.fix(b, 3) + ' rad');
      sim.set('I', EM.fix(I(p.th), 4));
      sim.set('m1', p.a >= 1 ? '±' + EM.fix(M.deg(Math.asin(1 / p.a)), 2) + '°' : 'no hay (a < λ)');
    });
  });

  /* ======================================================================
     22.2 Fresnel → Fraunhofer
     ====================================================================== */
  EM.defineSim('fresnel-slit', function (sim) {
    const cs = sim.canvas({ aspect: 5, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.5 });
    sim.slider('NF', { label: 'Número de Fresnel <i>a</i>²/<i>λz</i>', min: 0.05, max: 60, value: 6, log: true, step: 0.01, fmt: f2 });
    sim.slider('lam', { label: 'Color', min: 400, max: 700, step: 1, value: 633, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('reg', 'Régimen', { hl: true });
    sim.out('z', 'Distancia para <i>a</i> = 0.5 mm');
    let cache = null;
    /* campo en x (en unidades de a) a distancia z: ∫ e^{iπ(x − x′)²/(λz)} dx′, con a = 1 → fase π NF (x − x′)² */
    const field = (NF) => {
      const n = 500, xs = [], Is = [];
      const span = Math.max(1.5, 3 / Math.sqrt(NF) + 0.8, 2.5 / NF);
      for (let i = 0; i <= n; i++) {
        const x = -span + (2 * span * i) / n;
        let re = 0, im = 0;
        const K = 600;
        for (let k = 0; k < K; k++) { const xp = -0.5 + (k + 0.5) / K, ph = Math.PI * NF * (x - xp) ** 2; re += Math.cos(ph); im += Math.sin(ph); }
        re /= K; im /= K;
        xs.push(x); Is.push((re * re + im * im) * 2 * NF);
      }
      return { xs, Is, span };
    };
    sim.onDraw(() => {
      const p = sim.p;
      if (!cache || cache.NF !== p.NF) cache = Object.assign({ NF: p.NF }, field(p.NF));
      const C = cache, mx = Math.max(...C.Is);
      EM.draw.clear(cs);
      screenStrip(cs, p.lam, (u) => { const x = u * C.span, i = Math.round(((x + C.span) / (2 * C.span)) * (C.xs.length - 1)); return C.Is[M.clamp(i, 0, C.Is.length - 1)] / mx; }, { gain: 1.2 });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -C.span, xmax: C.span, ymin: 0, ymax: 1.1, xlabel: 'posición en la pantalla / a', ylabel: 'I (normalizada)', ml: 52 });
      pl.frame();
      pl.band(-0.5, 0.5, { color: '--ink-3', alpha: 0.08 });
      pl.xy(C.xs, C.Is.map((v) => v / mx), { color: colorOf(p.lam), width: 2 });
      pl.label(-0.45, 1.03, 'sombra geométrica', { size: 11, color: '--ink-3' });
      sim.set('reg', p.NF > 5 ? 'Fresnel: casi la sombra geométrica, con franjas en los bordes' : p.NF < 0.3 ? 'Fraunhofer: patrón sinc² del campo lejano' : 'transición');
      sim.set('z', EM.si((0.5e-3) ** 2 / (p.lam * 1e-9 * p.NF), 'm'));
    });
  });

  /* ======================================================================
     22.3 Red de difracción
     ====================================================================== */
  EM.defineSim('grating', function (sim) {
    const cs = sim.canvas({ aspect: 5, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.4 });
    sim.slider('N', { label: 'Número de rendijas <i>N</i>', min: 1, max: 2000, value: 6, log: true, step: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación <i>d</i>', min: 1, max: 10, step: 0.05, value: 2, unit: 'µm', fmt: f2 });
    sim.slider('a', { label: 'Ancho de cada rendija <i>a</i>', min: 0.2, max: 5, step: 0.05, value: 0.6, unit: 'µm', fmt: f2 });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 0.1, value: 589, unit: 'nm', fmt: (v) => EM.fix(v, 1) });
    sim.check('na', { label: 'Doblete del sodio (589.0 y 589.6 nm)', value: false });
    sim.seg('zoom', { label: 'Vista', options: [['all', 'Todos los órdenes'], [1, 'Zoom orden 1'], [2, 'Zoom orden 2']], value: 'all' });
    sim.out('R', 'Poder de resolución <i>mN</i>', { hl: true });
    sim.out('th', 'Ángulos de los órdenes');
    sim.out('res', 'Doblete del sodio');
    const I = (s, nm) => { const p = sim.p, lam = nm * 1e-3; const b = (Math.PI * p.a * s) / lam, al = (Math.PI * p.d * s) / lam; const sn = Math.sin(al); const g = Math.abs(sn) < 1e-9 ? 1 : Math.sin(p.N * al) / (p.N * sn); return EM.sinc(b) ** 2 * g * g; };
    sim.onDraw(() => {
      const p = sim.p;
      const lams = p.na ? [589.0, 589.6] : [p.lam];
      let s0 = -1, s1 = 1;
      if (p.zoom !== 'all') { const m = +p.zoom, sc = (m * 589.3e-3) / p.d; if (sc < 1) { const w = Math.max(2.5e-4 * m, (4 * m * 589.3e-3) / (p.d * Math.max(p.N, 1) * m) * 1.2); s0 = sc - w; s1 = sc + w; } }
      const Itot = (s) => lams.reduce((acc, nm) => acc + I(s, nm), 0) / lams.length;
      EM.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      lams.forEach((nm, k) => screenStrip(cs, nm, (u) => I(s0 + ((u + 1) / 2) * (s1 - s0), nm), { gain: 1.2, y: (k * H) / lams.length, h: H / lams.length }));
      void ctx; void W;
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: s0, xmax: s1, ymin: 0, ymax: 1.08, xlabel: 'sen θ', ylabel: 'I / I_{máx}', ml: 52 });
      pl.frame();
      if (p.zoom === 'all') pl.fn((s) => EM.sinc((Math.PI * p.a * s) / (p.lam * 1e-3)) ** 2, { color: '--ink-3', width: 1.2, dash: [5, 4], n: 800 });
      pl.fn(Itot, { color: p.na ? '--accent' : colorOf(p.lam), width: 1.8, n: 4000 });
      const ths = [];
      for (let m = 1; m <= 5; m++) { const s = (m * p.lam * 1e-3) / p.d; if (s <= 1) ths.push('m=' + m + ': ' + EM.fix(M.deg(Math.asin(s)), 2) + '°'); }
      const m = p.zoom === 'all' ? 1 : +p.zoom;
      sim.set('R', String(Math.round(m * p.N)) + ' (orden ' + m + ')');
      sim.set('th', ths.join(' · ') || 'sólo el orden 0');
      sim.set('res', m * p.N >= 982 ? 'resuelto en el orden ' + m : 'no resuelto (se necesita mN ≥ 982)');
    });
  });

  /* ======================================================================
     22.4 Criterio de Rayleigh
     ====================================================================== */
  EM.defineSim('rayleigh', function (sim) {
    sim.cols2();
    const ci = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.slider('sep', { label: 'Separación angular / <i>θ</i><sub>Rayleigh</sub>', min: 0.2, max: 3, step: 0.01, value: 1, fmt: f2 });
    sim.slider('D', { label: 'Diámetro de la abertura <i>D</i>', min: 1, max: 10000, value: 3, log: true, step: 0.1, fmt: (v) => EM.si(v / 1000, 'm') });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('ratio', { label: 'Brillo de la segunda fuente', min: 0.1, max: 1, step: 0.05, value: 1, fmt: f2 });
    sim.out('th', 'Límite de Rayleigh 1.22<i>λ</i>/<i>D</i>', { hl: true });
    sim.out('as', 'En segundos de arco');
    sim.out('dip', 'Caída de intensidad entre los picos');
    const airy = (x) => (Math.abs(x) < 1e-6 ? 1 : (2 * EM.besselJn(1, x) / x) ** 2);
    const X1 = 3.8317;
    sim.onDraw(() => {
      const p = sim.p, s = p.sep * X1;
      const I = (x, y) => airy(Math.hypot(x + s / 2, y)) + p.ratio * airy(Math.hypot(x - s / 2, y));
      EM.draw.clear(ci);
      const ctx = ci.ctx, W = ci.w, H = ci.h, N = 140, span = 2.2 * X1 + s / 2;
      const img = ctx.createImageData(N, N), q = EM.wavelengthRGB(p.lam);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = Math.min(1, Math.pow(I((i / N - 0.5) * 2 * span, (j / N - 0.5) * 2 * span), 0.6)), k = 4 * (j * N + i); img.data[k] = q[0] * v; img.data[k + 1] = q[1] * v; img.data[k + 2] = q[2] * v; img.data[k + 3] = 255; }
      const off = document.createElement('canvas'); off.width = N; off.height = N; off.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -span / X1, xmax: span / X1, ymin: 0, ymax: 1.35, xlabel: 'ángulo / θ_R', ylabel: 'intensidad', ml: 52 });
      pl.frame();
      pl.fn((u) => airy(u * X1 + s / 2), { color: '--c1', width: 1.2, dash: [4, 4], n: 600 });
      pl.fn((u) => p.ratio * airy(u * X1 - s / 2), { color: '--c2', width: 1.2, dash: [4, 4], n: 600 });
      pl.fn((u) => I(u * X1, 0), { color: colorOf(p.lam), width: 2.4, n: 600 });
      const th = (1.22 * p.lam * 1e-9) / (p.D / 1000);
      const mid = I(0, 0), pk = Math.max(I(-s / 2, 0), I(s / 2, 0));
      sim.set('th', EM.sci(th, 3) + ' rad');
      sim.set('as', EM.sci(M.deg(th) * 3600, 3) + '″');
      sim.set('dip', mid < pk ? EM.fix(100 * (1 - mid / pk), 1) + ' % (se distinguen dos picos)' : 'un solo pico (no resueltas)');
    });
  });
})();
