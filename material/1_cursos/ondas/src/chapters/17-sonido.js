/* Capítulo 17 — Ondas sonoras */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     17.1 Onda sonora: moléculas, desplazamiento y presión
     ====================================================================== */
  EM.defineSim('sound-wave', function (sim) {
    const cv = sim.canvas({ aspect: 3, cls: 'fixed' });
    const cg = sim.canvas({ aspect: 2.6 });
    sim.slider('f', { label: 'Frecuencia', min: 20, max: 5000, value: 1000, log: true, step: 1, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Nivel sonoro', min: 0, max: 130, step: 1, value: 60, unit: 'dB', fmt: (v) => v.toFixed(0) });
    sim.check('vel', { label: 'Mostrar la velocidad de las partículas', value: false });
    sim.out('lam', 'Longitud de onda', { hl: true });
    sim.out('p0', 'Amplitud de presión <i>p</i><sub>0</sub>');
    sim.out('s0', 'Amplitud de desplazamiento <i>s</i><sub>0</sub>');
    sim.out('u0', 'Velocidad máxima de las partículas');
    sim.note('El dibujo exagera el desplazamiento enormemente para que se vea; la escala horizontal es de dos longitudes de onda.');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, Z = 413, v = 343, w = 2 * Math.PI * p.f;
      const I = 1e-12 * Math.pow(10, p.L / 10), p0 = Math.sqrt(2 * Z * I), s0 = p0 / (Z * w);
      const ph = 2 * Math.PI * 0.5 * t;
      const k = 2 * Math.PI / 1; /* dibujo en unidades de λ */
      const sd = (x) => 0.12 * Math.cos(k * x - ph);
      const ctx = cv.ctx, W = cv.w, H = cv.h, Lx = 2;
      EM.draw.clear(cv);
      /* fondo de presión */
      for (let i = 0; i < W; i += 2) { const x = (i / W) * Lx, pr = Math.sin(k * x - ph); ctx.fillStyle = EM.alpha(pr > 0 ? '--c2' : '--c1', 0.18 * Math.abs(pr)); ctx.fillRect(i, 0, 2, H); }
      for (let j = 0; j < 10; j++) for (let i = 0; i < 90; i++) {
        const x0 = (i / 90) * Lx + ((j * 37) % 10) * 0.002;
        const xx = ((x0 + sd(x0)) / Lx) * W, yy = 10 + (j * (H - 20)) / 9;
        ctx.fillStyle = EM.alpha('--ink-2', 0.75); ctx.beginPath(); ctx.arc(xx, yy, 2, 0, 7); ctx.fill();
      }
      EM.draw.clear(cg);
      const pl = new EM.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: 2, ymin: -1.3, ymax: 1.3, xlabel: 'x / λ', ylabel: 'relativo', ml: 52 });
      pl.frame();
      pl.fn((x) => Math.cos(k * x - ph), { color: '--accent', width: 2.2 });
      pl.fn((x) => Math.sin(k * x - ph), { color: '--c2', width: 2, dash: [6, 4] });
      if (p.vel) pl.fn((x) => Math.sin(k * x - ph), { color: '--c3', width: 1.2, dash: [2, 3] });
      pl.legend([{ label: 'desplazamiento s', color: '--accent' }, { label: 'presión p', color: '--c2', dash: [6, 4] }].concat(p.vel ? [{ label: 'velocidad u (∝ p)', color: '--c3', dash: [2, 3] }] : []), 'tr');
      sim.set('lam', EM.si(v / p.f, 'm'));
      sim.set('p0', EM.si(p0, 'Pa') + ' (' + EM.sci(p0 / 101325, 2) + ' atm)');
      sim.set('s0', EM.si(s0, 'm'));
      sim.set('u0', EM.si(w * s0, 'm/s'));
    });
  });

  /* ======================================================================
     17.2 Velocidad del sonido en gases
     ====================================================================== */
  EM.defineSim('sound-speed', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    const GAS = { air: ['Aire', 28.97, 1.4], he: ['Helio', 4.003, 1.667], co2: ['Dióxido de carbono', 44.01, 1.29], h2: ['Hidrógeno', 2.016, 1.41], ar: ['Argón', 39.95, 1.667], sf6: ['Hexafluoruro de azufre', 146.06, 1.09] };
    sim.select('gas', { label: 'Gas', options: Object.keys(GAS).map((k) => [k, GAS[k][0]]), value: 'air' });
    sim.slider('T', { label: 'Temperatura', min: -50, max: 200, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('iso', { label: 'Mostrar la predicción isotérmica (Newton)', value: true });
    EM.listenButton(sim, () => { const r = vel() / 343; return { fn: (t) => { let s = 0; [700, 1220, 2600].forEach((F, i) => { s += Math.sin(2 * Math.PI * F * r * t) * [1, 0.6, 0.3][i]; }); return s * (0.6 + 0.4 * Math.sin(2 * Math.PI * 140 * t)); }, dur: 1.3 }; }, { label: '♪ Resonancias de la voz en este gas' });
    sim.out('v', 'Velocidad adiabática √(<i>γRT</i>/<i>M</i>)', { hl: true });
    sim.out('vi', 'Isotérmica √(<i>RT</i>/<i>M</i>)');
    sim.out('r', 'Respecto al aire a la misma temperatura');
    const R = 8.314462618;
    const vel = () => { const g = GAS[sim.p.gas]; return Math.sqrt((g[2] * R * (sim.p.T + 273.15)) / (g[1] / 1000)); };
    sim.onDraw(() => {
      const p = sim.p, g = GAS[p.gas];
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -50, xmax: 200, ymin: 0, ymax: 1700, xlabel: 'temperatura (°C)', ylabel: 'v (m/s)', ml: 56 });
      pl.frame();
      Object.keys(GAS).forEach((k) => { const q = GAS[k]; pl.fn((T) => Math.sqrt((q[2] * R * (T + 273.15)) / (q[1] / 1000)), { color: k === p.gas ? '--c1' : '--grid-2', width: k === p.gas ? 2.4 : 1.2 }); });
      if (p.iso) pl.fn((T) => Math.sqrt((R * (T + 273.15)) / (g[1] / 1000)), { color: '--c2', width: 1.6, dash: [5, 4] });
      const v = vel();
      pl.dot(p.T, v, { color: '--accent', r: 6 });
      sim.set('v', EM.fix(v, 1) + ' m/s');
      sim.set('vi', EM.fix(v / Math.sqrt(g[2]), 1) + ' m/s');
      sim.set('r', EM.fix(v / Math.sqrt((1.4 * R * (p.T + 273.15)) / 0.02897), 3) + ' × (las resonancias de la voz se escalan igual)');
    });
  });

  /* ======================================================================
     17.3 Decibeles y distancia
     ====================================================================== */
  EM.defineSim('decibels', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('P', { label: 'Potencia acústica de cada fuente', min: 1e-6, max: 10, value: 0.01, log: true, step: 1e-7, fmt: (v) => EM.si(v, 'W') });
    sim.slider('n', { label: 'Número de fuentes (incoherentes)', min: 1, max: 10, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.hint('Arrastra el micrófono', cv);
    sim.out('L', 'Nivel en el micrófono', { hl: true });
    sim.out('I', 'Intensidad');
    sim.out('ref', 'Comparable a');
    const mic = { x: 6, y: 0 };
    const Lx = 20;
    const src = (i, n) => ({ x: -6, y: (i - (n - 1) / 2) * 0.6 });
    let view = null;
    EM.pointer(cv, {
      down: (x, y) => { if (!view) return null; const px = view.X(mic.x), py = view.Y(mic.y); return Math.hypot(px - x, py - y) < 20 ? 1 : null; },
      move: (_, x, y) => { mic.x = M.clamp(view.ix(x), -9.5, 9.5); mic.y = M.clamp(view.iy(y), -5, 5); sim.redraw(); },
      hover: (x, y) => view && Math.hypot(view.X(mic.x) - x, view.Y(mic.y) - y) < 20
    });
    const refs = [[0, 'umbral de audición'], [20, 'hojas al viento'], [40, 'biblioteca'], [60, 'conversación'], [70, 'aspiradora'], [85, 'tráfico intenso (límite laboral)'], [100, 'motocicleta'], [110, 'concierto de rock'], [120, 'umbral de dolor'], [140, 'avión a reacción']];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = W / Lx, cx = W / 2, cy = H / 2;
      view = { X: (x) => cx + x * sc, Y: (y) => cy - y * sc, ix: (px) => (px - cx) / sc, iy: (py) => (cy - py) / sc };
      /* mapa de nivel */
      const step = 6;
      for (let py = 0; py < H; py += step) for (let px = 0; px < W; px += step) {
        const x = view.ix(px + step / 2), y = view.iy(py + step / 2);
        let I = 0;
        for (let i = 0; i < p.n; i++) { const s = src(i, p.n); I += p.P / (4 * Math.PI * Math.max(0.05, (x - s.x) ** 2 + (y - s.y) ** 2)); }
        const L = 10 * Math.log10(I / 1e-12);
        const c = EM.cmap.inferno(M.clamp((L - 20) / 120, 0, 1));
        ctx.fillStyle = EM.rgbStr(c, 0.55); ctx.fillRect(px, py, step, step);
      }
      for (let i = 0; i < p.n; i++) { const s = src(i, p.n); EM.draw.bob(ctx, view.X(s.x), view.Y(s.y), 7, { color: '--c2' }); }
      let I = 0;
      for (let i = 0; i < p.n; i++) { const s = src(i, p.n); I += p.P / (4 * Math.PI * Math.max(0.05, (mic.x - s.x) ** 2 + (mic.y - s.y) ** 2)); }
      const L = 10 * Math.log10(I / 1e-12);
      const mx = view.X(mic.x), my = view.Y(mic.y);
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fill();
      ctx.fillStyle = EM.col('--canvas'); ctx.beginPath(); ctx.arc(mx, my, 4, 0, 7); ctx.fill();
      EM.text(ctx, EM.fix(L, 1) + ' dB', mx + 12, my - 10, { size: 13, weight: 700, halo: true, color: '--ink' });
      /* escala */
      for (let d = 1; d <= 16; d *= 2) { ctx.strokeStyle = EM.alpha('#ffffff', 0.25); ctx.beginPath(); ctx.arc(view.X(-6), view.Y(0), d * sc, 0, 7); ctx.stroke(); }
      EM.text(ctx, 'círculos: 1, 2, 4, 8 y 16 m de la fuente central', 10, H - 8, { size: 11, color: '--ink-2', halo: true });
      let ref = refs[0][1];
      refs.forEach(([v, n]) => { if (L >= v - 5) ref = n; });
      sim.set('L', EM.fix(L, 1) + ' dB');
      sim.set('I', EM.si(I, 'W/m²'));
      sim.set('ref', ref);
    });
  });

  /* ======================================================================
     17.4 Generador de tonos
     ====================================================================== */
  EM.defineSim('hearing', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('f', { label: 'Frecuencia del tono', min: 20, max: 20000, value: 1000, log: true, step: 1, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Volumen relativo', min: -60, max: 0, step: 1, value: -20, unit: 'dB', fmt: (v) => v.toFixed(0) });
    const amp = () => Math.pow(10, sim.p.g / 20);
    if (EM.audio.ok()) {
      sim.button('♪ Reproducir tono', () => EM.audio.play((t) => amp() * Math.sin(2 * Math.PI * sim.p.f * t), 1.5, 0.3, false));
      sim.button('Barrido 20 Hz → 20 kHz', () => { const T = 10, a = Math.log(1000) / T; EM.audio.play((t) => amp() * Math.sin((2 * Math.PI * 20 * (Math.exp(a * t) - 1)) / a), T, 0.3, false); });
      sim.button('Detener', () => EM.audio.stop());
    }
    sim.out('lam', 'Longitud de onda en el aire', { hl: true });
    sim.out('th', 'Umbral típico de audición a esta frecuencia');
    sim.note('El sonido no se normaliza: un volumen de −20 dB suena 20 dB más bajo que 0 dB. Ajuste primero el volumen de su equipo.');
    /* umbral aproximado (ISO 226, curva de 0 fon) en dB SPL */
    const thr = (f) => { const k = f / 1000; return 3.64 * Math.pow(k, -0.8) - 6.5 * Math.exp(-0.6 * (k - 3.3) ** 2) + 1e-3 * k ** 4; };
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 20, xmax: 20000, xlog: true, ymin: -10, ymax: 130, xlabel: 'frecuencia (Hz)', ylabel: 'nivel (dB)', ml: 52 });
      pl.frame();
      pl.fn(thr, { color: '--c1', width: 2.2, n: 400 });
      pl.fn((f) => Math.min(130, thr(f) + 120 - 10 * Math.log10(1 + (f / 15000) ** 4)), { color: '--c2', width: 1.6, dash: [5, 4], n: 400 });
      pl.label(25, thr(25) + 6, 'umbral de audición', { color: '--c1', size: 11 });
      pl.label(25, 125, 'umbral de dolor', { color: '--c2', size: 11 });
      pl.band(2000, 5000, { color: '--c3', alpha: 0.08 });
      pl.vline(p.f, { color: '--accent' });
      pl.dot(p.f, thr(p.f), { color: '--accent', r: 6 });
      sim.set('lam', EM.si(343 / p.f, 'm'));
      sim.set('th', EM.fix(thr(p.f), 1) + ' dB SPL');
    });
  });
})();
