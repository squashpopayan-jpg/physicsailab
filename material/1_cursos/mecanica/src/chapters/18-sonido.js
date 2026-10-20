/* ===================================================================
   Capítulo 19 — Sonido
   Simulaciones: sonido-onda, decibeles, doppler, pulsaciones, tubos
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const sci = (v, d = 3) => MC.sci(v, d);
  const I0 = 1e-12, VOL = 0.07;
  const vAir = (T) => 331.3 + 0.606 * T;
  const fHz = (v) => (v >= 1000 ? `${sci(v / 1000)} kHz` : `${sci(v)} Hz`);
  /* dibujo de un parlante mirando a la derecha: centro (x, y), tamaño h, desplazamiento del cono d (px) */
  function speaker(ctx, x, y, h, d = 0, col = '--ink-2') {
    D.block(ctx, x - h * 0.28, y, h * 0.34, h * 0.5, { fill: '--c6', r: 2 });
    D.poly(ctx, [[x - h * 0.11 + d, y - h * 0.25], [x + h * 0.2 + d, y - h * 0.5], [x + h * 0.2 + d, y + h * 0.5], [x - h * 0.11 + d, y + h * 0.25]], { close: true, fill: '--metal', color: col, width: 1.4 });
  }

  /* ======================================================================
     18.1  La onda sonora: desplazamiento y presión
     ====================================================================== */
  const MED = {
    aire: { n: 'Aire', rho: 1.2 },
    helio: { n: 'Helio', rho: 0.166, v: 1007 },
    agua: { n: 'Agua', rho: 1000, v: 1482 },
    acero: { n: 'Acero', rho: 7850, v: 5960 }
  };
  MC.defineSim('sonido-onda', function (sim) {
    const cv = sim.canvas({ aspect: 2.0, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.8 });
    const WV = 2 * Math.PI * 0.5, NL = 2.5;
    const pts = [];
    for (let i = 0; i < 520; i++) pts.push([Math.random(), Math.random()]);
    const PL = [null, null];
    sim.group('Sonido');
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 20, max: 20000, step: 1, value: 440, unit: 'Hz', fmt: f0, log: true });
    sim.slider('dB', { label: 'Nivel sonoro β', min: 0, max: 130, step: 1, value: 60, unit: 'dB', fmt: f0 });
    sim.button('Escuchar', () => MC.phys.tone(sim.p.f, 1.3, VOL), { primary: true, icon: 'sound' });
    sim.note('El volumen del parlante de su equipo no corresponde al nivel elegido: use un volumen moderado.');
    sim.group('Medio');
    sim.select('med', { label: 'Medio', value: 'aire', options: Object.keys(MED).map((k) => [k, MED[k].n]) });
    sim.slider('T', { label: 'Temperatura del aire', min: -20, max: 45, step: 1, value: 20, unit: '°C', fmt: f0 });
    sim.out('v', 'Rapidez del sonido <i>v</i>', { hl: true });
    sim.out('lam', 'Longitud de onda λ = <i>v</i>/<i>f</i>', { hl: true });
    sim.out('T', 'Periodo');
    sim.out('p', 'Amplitud de presión <i>p</i><sub>máx</sub>');
    sim.out('s', 'Amplitud de desplazamiento <i>s</i><sub>máx</sub>');
    sim.out('I', 'Intensidad <i>I</i>');
    sim.presets([
      { id: 'la440', label: 'Nota La (440 Hz) a 60 dB', v: { f: 440, dB: 60, med: 'aire', T: 20 } },
      { id: 'grave', label: 'Sonido grave (50 Hz)', v: { f: 50, dB: 70, med: 'aire', T: 20 } },
      { id: 'agudo', label: 'Sonido agudo (5 kHz)', v: { f: 5000, dB: 60, med: 'aire', T: 20 } },
      { id: 'umbral', label: 'Umbral de audición (0 dB, 1 kHz)', v: { f: 1000, dB: 0, med: 'aire', T: 20 }, note: 'El aire se desplaza apenas 10⁻¹¹ m: menos que el tamaño de un átomo.' },
      { id: 'agua', label: 'La misma nota en el agua', v: { f: 440, dB: 60, med: 'agua' } },
      { id: 'helio', label: 'La misma nota en helio', v: { f: 440, dB: 60, med: 'helio' } }
    ]);
    const par = () => {
      const p = sim.p, m = MED[p.med], v = m.v || vAir(p.T), lam = v / p.f, w = 2 * Math.PI * p.f;
      const I = I0 * Math.pow(10, p.dB / 10), pm = Math.sqrt(2 * m.rho * v * I);
      return { v, lam, w, I, pm, sm: pm / (m.rho * v * w), rho: m.rho };
    };
    sim.onChange = () => sim.ctl.T.show(sim.p.med === 'aire');
    sim.ctl.T.show(true);
    sim.run({ reset() {}, step() {}, h: 1 / 120, autoplay: true, startLabel: 'Animar', speeds: false, timeFmt: () => 'cámara lenta' });
    sim.onDraw(() => {
      const p = sim.p, q = par(), ctx = cv.ctx, W = cv.w, Hc = cv.h, ph = WV * sim.t;
      D.clear(cv);
      const x0 = 70, x1 = W - 12, top = 18, bot = Hc - 30, win = NL * q.lam;
      const X = (x) => x0 + ((x1 - x0) * x) / win;
      const kk = (2 * Math.PI) / q.lam;
      /* sombreado según la presión */
      ctx.save();
      for (let i = 0; i < 160; i++) {
        const xa = (win * i) / 160, xb = (win * (i + 1)) / 160, pr = Math.sin(kk * (xa + xb) / 2 - ph);
        ctx.fillStyle = MC.col(pr > 0 ? '--c1' : '--c4');
        ctx.globalAlpha = Math.abs(pr) * 0.28;
        ctx.fillRect(X(xa), top, X(xb) - X(xa) + 0.5, bot - top);
      }
      ctx.restore();
      /* partículas (desplazamiento muy ampliado) */
      const amp = 0.09 * q.lam;
      for (const [u, vv] of pts) {
        const x = u * win, s = amp * Math.cos(kk * x - ph);
        D.circle(ctx, X(x + s), top + vv * (bot - top), 1.7, { fill: '--ink-2' });
      }
      const xm = q.lam * 0.9, sm = amp * Math.cos(kk * xm - ph);
      D.circle(ctx, X(xm + sm), (top + bot) / 2, 5, { fill: '--c2' });
      D.line(ctx, X(xm), bot + 2, X(xm), bot + 9, { color: '--c2', width: 1.5 });
      speaker(ctx, 34, (top + bot) / 2, Math.min(90, bot - top), amp * Math.cos(-ph) * ((x1 - x0) / win) * 0.6);
      D.dim(ctx, X(0), bot + 18, X(q.lam), bot + 18, `λ = ${q.lam >= 1 ? f2(q.lam) + ' m' : f1(q.lam * 100) + ' cm'}`, { size: 11, labelOff: -9 });
      MC.text(ctx, 'azul: compresión · naranja: rarefacción · desplazamientos muy ampliados', W - 10, 13, { size: 9.5, align: 'right', color: '--ink-3' });
      /* gráficas s(x) y p(x) */
      const gctx = gc.ctx;
      D.clear(gc);
      const hh = gc.h / 2;
      const specs = [
        { f: (x) => q.sm * Math.cos(kk * x - ph), lab: ['s', q.sm < 1e-6 ? 'nm' : q.sm < 1e-3 ? 'µm' : 'mm'], sc: q.sm < 1e-6 ? 1e9 : q.sm < 1e-3 ? 1e6 : 1e3, col: '--pos', amp: q.sm },
        { f: (x) => q.pm * Math.sin(kk * x - ph), lab: ['p', 'Pa'], sc: 1, col: '--c1', amp: q.pm }
      ];
      specs.forEach((sp, i) => {
        const P = PL[i] || (PL[i] = new MC.Plot(gctx));
        P.ctx = gctx;
        const A = sp.amp * sp.sc;
        P.set({ x: 0, y: i * hh, w: gc.w, h: hh, xmin: 0, xmax: win, ymin: -A * 1.25, ymax: A * 1.25, xlabel: i === 1 ? ['x', 'm'] : '', ylabel: sp.lab, mb: i === 1 ? 36 : 20, mt: 10, ml: 60, mr: 14, yfmt: (v) => sci(v, 2) });
        P.frame();
        P.fn((x) => sp.f(x) * sp.sc, { color: sp.col, width: 2.2, n: 400 });
        P.vline(xm, { color: '--c2', dash: [3, 3] });
        P.dot(xm, sp.f(xm) * sp.sc, { color: '--c2', r: 4 });
        MC.text(gctx, i === 0 ? 'desplazamiento del aire' : 'variación de presión', gc.w - 16, i * hh + 22, { size: 10.5, align: 'right', color: sp.col, halo: true });
      });
      sim.set('v', `${f0(q.v)} m/s`);
      sim.set('lam', q.lam >= 1 ? `${f3(q.lam)} m` : `${f2(q.lam * 100)} cm`);
      sim.set('T', MC.si(1 / p.f, 's', 3));
      sim.set('p', `${sci(q.pm)} Pa (${sci(q.pm / 101325)} atm)`);
      sim.set('s', MC.si(q.sm, 'm', 3));
      sim.set('I', `${sci(q.I)} W/m²`);
    });
  });

  /* ======================================================================
     18.2  Intensidad y decibeles
     ====================================================================== */
  const REFS = [[0, 'umbral de audición'], [30, 'susurro'], [60, 'conversación'], [80, 'tráfico intenso'], [100, 'motocicleta'], [110, 'concierto'], [130, 'umbral de dolor']];
  MC.defineSim('decibeles', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.2 });
    const RMIN = 0.5, RMAX = 500;
    let GP = null;
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    const geo = { x0: 0, x1: 1, y: 0 };
    sim.group('Fuente');
    sim.slider('P', { label: 'Potencia sonora de cada fuente <i>P</i>', min: 1e-8, max: 1000, value: 1e-5, unit: 'W', fmt: (v) => sci(v, 2), log: true });
    sim.slider('N', { label: 'Número de fuentes iguales', min: 1, max: 10, step: 1, value: 1, fmt: f0 });
    sim.group('Oyente');
    sim.slider('r', { label: 'Distancia a la fuente <i>r</i>', min: RMIN, max: RMAX, step: 0.01, value: 1, unit: 'm', fmt: (v) => (v < 10 ? f2(v) : f1(v)), log: true });
    sim.out('I', 'Intensidad <i>I</i> = <i>NP</i>/4π<i>r</i>²');
    sim.out('b', 'Nivel sonoro β', { hl: true });
    sim.out('d2', 'Al duplicar la distancia');
    sim.out('dN', 'Aporte de las <i>N</i> fuentes');
    sim.out('safe', 'Tiempo de exposición segura');
    sim.presets([
      { id: 'voz', label: 'Una persona que habla, a 1 m', v: { P: 1e-5, N: 1, r: 1 }, note: 'Unos 10 microvatios bastan para una conversación de 60 dB.' },
      { id: 'dos', label: 'Un parlante a 70 dB… y luego dos', v: { P: 0.01, N: 2, r: 8.92 }, note: 'Con dos parlantes iguales el nivel sube sólo 3 dB: de 70 a 73 dB.' },
      { id: 'lejos', label: 'Alejarse de un parlante', v: { P: 0.01, N: 1, r: 35.7 }, note: 'A cuatro veces la distancia (dos duplicaciones) el nivel bajó 12 dB.' },
      { id: 'concierto', label: 'Frente a los parlantes de un concierto', v: { P: 10, N: 4, r: 5 } },
      { id: 'diez', label: 'Diez fuentes iguales', v: { P: 1e-5, N: 10, r: 1 } }
    ]);
    const lvl = (r) => { const p = sim.p, I = (p.N * p.P) / (4 * Math.PI * r * r); return { I, b: 10 * Math.log10(I / I0) }; };
    const lx = (r) => geo.x0 + ((Math.log10(r) - Math.log10(RMIN)) / (Math.log10(RMAX) - Math.log10(RMIN))) * (geo.x1 - geo.x0);
    const rx = (x) => Math.pow(10, Math.log10(RMIN) + ((x - geo.x0) / (geo.x1 - geo.x0)) * (Math.log10(RMAX) - Math.log10(RMIN)));
    MC.pointer(cv, {
      down: (x, y) => (Math.abs(x - lx(sim.p.r)) < 22 && Math.abs(y - geo.y) < 40 ? 1 : null),
      move: (id, x) => sim.ctl.r.set(M.clamp(rx(x), RMIN, RMAX)),
      hover: (x, y) => Math.abs(x - lx(sim.p.r)) < 22 && Math.abs(y - geo.y) < 40
    });
    sim.hint('Arrastre al oyente', cv);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h, L = lvl(p.r);
      D.clear(cv);
      const meterW = 150;
      Object.assign(geo, { x0: 70, x1: W - meterW - 30, y: Hc * 0.55 });
      /* fuentes */
      for (let i = 0; i < p.N; i++) speaker(ctx, 30 + (i % 2) * 8, geo.y - 18 * (p.N - 1) / 2 + i * 18 * (p.N > 1 ? 1 : 0), 36);
      /* arcos a distancias que se duplican */
      for (let r = 1; r <= RMAX; r *= 2) {
        const x = lx(r);
        if (x < geo.x0 || x > geo.x1) continue;
        ctx.save(); ctx.strokeStyle = MC.col('--c1'); ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x - 60, geo.y, 60, -0.55, 0.55); ctx.stroke(); ctx.restore();
      }
      /* eje logarítmico de distancias */
      D.line(ctx, geo.x0, geo.y + 40, geo.x1, geo.y + 40, { color: '--ink-3', width: 1 });
      for (const r of [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]) {
        const x = lx(r);
        D.line(ctx, x, geo.y + 36, x, geo.y + 44, { color: '--ink-3', width: 1 });
        MC.text(ctx, `${r}`, x, geo.y + 57, { size: 10, mono: true, align: 'center', color: '--ink-3' });
      }
      MC.text(ctx, 'distancia (m, escala logarítmica)', geo.x1, geo.y + 72, { size: 10, align: 'right', color: '--ink-3' });
      /* oyente */
      const xo = lx(p.r);
      D.person(ctx, xo, geo.y + 30, 58, { color: '--c4', arms: 0.3 });
      MC.text(ctx, `${f1(L.b)} dB`, xo, geo.y - 38, { size: 13, weight: 700, align: 'center', color: '--c4', halo: true });
      /* medidor en decibeles */
      const mx = W - meterW + 10, my0 = Hc - 20, my1 = 18, Yb = (b) => my0 - (M.clamp(b, 0, 140) / 140) * (my0 - my1);
      D.panel(ctx, mx - 10, 8, meterW - 4, Hc - 16, {});
      ctx.save();
      const grd = ctx.createLinearGradient(0, my0, 0, my1);
      grd.addColorStop(0, MC.col('--c3')); grd.addColorStop(0.55, MC.col('--marker-solid')); grd.addColorStop(0.85, MC.col('--c4')); grd.addColorStop(1, MC.col('--c2'));
      ctx.fillStyle = grd; ctx.fillRect(mx, Yb(L.b), 14, my0 - Yb(L.b));
      ctx.strokeStyle = MC.col('--ink-3'); ctx.strokeRect(mx + 0.5, my1 + 0.5, 14, my0 - my1);
      ctx.restore();
      REFS.forEach(([b, t]) => { D.line(ctx, mx + 14, Yb(b), mx + 20, Yb(b), { color: '--ink-3', width: 1 }); MC.text(ctx, `${b} ${t}`, mx + 23, Yb(b) + 3.5, { size: 9.5, color: '--ink-2' }); });
      D.line(ctx, mx - 4, Yb(85), mx + 18, Yb(85), { color: '--warn-ink', width: 1.5, dash: [3, 2] });
      /* gráfica β(r) */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      const bmax = lvl(RMIN).b, bmin = lvl(RMAX).b;
      const [ylo, yhi] = MC.niceRange(Math.min(bmin, 0), Math.max(bmax, 20), { zero: false, pad: 0.04 });
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xlog: true, xmin: RMIN, xmax: RMAX, ymin: ylo, ymax: yhi, xlabel: ['r', 'm'], ylabel: ['β', 'dB'], mb: 38, mt: 12, ml: 50, mr: 14 });
      P.frame();
      if (85 > ylo && 85 < yhi) P.hband(85, yhi, { color: '--warn-ink', alpha: 0.07 });
      P.fn((r) => lvl(r).b, { color: '--c1', width: 2.4 });
      const b2 = lvl(Math.min(RMAX, 2 * p.r)).b;
      if (2 * p.r <= RMAX) { P.dot(2 * p.r, b2, { color: '--ink-3', r: 4, label: '−6 dB en 2r', dy: -9 }); }
      P.dot(p.r, L.b, { color: '--c4', r: 6 });
      hov.plot = P;
      if (hov.hx !== null) P.crosshair(hov.hx, [{ label: 'β', unit: 'dB', color: '--c1', y: lvl(hov.hx).b, fmt: f1 }], { label: 'r', unit: 'm', fmt: (v) => sci(v) });
      sim.set('I', `${sci(L.I)} W/m²`);
      sim.set('b', `${f1(L.b)} dB`);
      sim.set('d2', `${f1(lvl(2 * p.r).b - L.b)} dB`);
      sim.set('dN', p.N > 1 ? `+10 log ${p.N} = +${f1(10 * Math.log10(p.N))} dB` : '—');
      const tsafe = L.b <= 85 ? Infinity : 8 * Math.pow(2, -(L.b - 85) / 3);
      sim.set('safe', L.b <= 85 ? 'sin límite práctico (≤ 85 dB)' : tsafe >= 1 ? `${f1(tsafe)} h al día` : tsafe * 60 >= 1 ? `${f0(tsafe * 60)} min al día` : `${f0(tsafe * 3600)} s al día`);
    });
  });

  /* ======================================================================
     18.3  Efecto Doppler
     ====================================================================== */
  MC.defineSim('doppler', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const s = { x: -1.15, fronts: [], lastE: -1 };
    const TE = 0.32, CV = 0.5; /* periodo visual de emisión (s) y rapidez visual del sonido (unidades/s) */
    sim.group('Fuente');
    sim.slider('f', { label: 'Frecuencia emitida <i>f</i>', min: 100, max: 2000, step: 1, value: 800, unit: 'Hz', fmt: f0 });
    sim.slider('vs', { label: 'Rapidez de la fuente <i>v</i><sub>s</sub>', min: 0, max: 600, step: 1, value: 100, unit: 'm/s', fmt: f0, reset: true });
    sim.slider('vo', { label: 'Rapidez del oyente hacia la fuente <i>v</i><sub>o</sub>', min: -60, max: 60, step: 1, value: 0, unit: 'm/s', fmt: f0 });
    sim.button('Escuchar', () => play(), { primary: true, icon: 'sound' });
    sim.note('Se oye la frecuencia emitida, luego la que percibe el oyente de adelante y por último la del oyente de atrás.');
    sim.out('Ma', 'Número de Mach <i>v</i><sub>s</sub>/<i>v</i>');
    sim.out('fa', 'Oyente adelante (se acerca la fuente)', { hl: true });
    sim.out('fb', 'Oyente atrás (se aleja la fuente)', { hl: true });
    sim.out('la', 'Longitud de onda adelante y atrás');
    sim.out('cone', 'Cono de Mach');
    sim.presets([
      { id: 'reposo', label: 'Fuente en reposo', v: { f: 800, vs: 0, vo: 0 }, play: true },
      { id: 'ambulancia', label: 'Ambulancia a 30 m/s (800 Hz)', v: { f: 800, vs: 30, vo: 0 }, play: true, note: 'Adelante se oyen 877 Hz; atrás, 736 Hz.' },
      { id: 'rapida', label: 'Fuente a 200 m/s', v: { f: 800, vs: 200, vo: 0 }, play: true },
      { id: 'mach1', label: 'Rompiendo la barrera del sonido (Mach 1)', v: { f: 800, vs: 343, vo: 0 }, play: true, note: 'Los frentes se amontonan justo delante de la fuente: una pared de presión.' },
      { id: 'supersonico', label: 'Avión supersónico (Mach 1.5)', v: { f: 800, vs: 515, vo: 0 }, play: true },
      { id: 'oyente', label: 'Fuente quieta y oyente que se acerca a 30 m/s', v: { f: 800, vs: 0, vo: 30 }, play: true }
    ]);
    const V = 343;
    const fr = () => {
      const p = sim.p;
      const fa = p.vs < V ? (p.f * (V + p.vo)) / (V - p.vs) : Infinity;
      const fb = (p.f * (V - p.vo)) / (V + p.vs);
      return { fa, fb };
    };
    function play() {
      const q = fr(), p = sim.p;
      MC.phys.tone(p.f, 0.7, VOL);
      if (isFinite(q.fa) && q.fa < 20000) setTimeout(() => MC.phys.tone(q.fa, 0.7, VOL), 850);
      setTimeout(() => MC.phys.tone(q.fb, 0.7, VOL), 1700);
    }
    sim.run({
      reset() { s.x = sim.p.vs > 0 ? -1.15 : 0; s.fronts = []; s.lastE = -1; },
      step(h) {
        const p = sim.p, t = sim.t + h;
        s.x += (p.vs / V) * CV * h;
        if (Math.floor(t / TE) > s.lastE) { s.lastE = Math.floor(t / TE); s.fronts.push([s.x, t]); }
        s.fronts = s.fronts.filter((q) => CV * (t - q[1]) < 3.2);
        if (s.x > 1.3) { s.x = -1.15; }
      },
      h: 1 / 240,
      speeds: false,
      timeFmt: () => 'animación esquemática'
    });
    sim.onDraw(() => {
      const p = sim.p, q = fr(), ctx = cv.ctx, W = cv.w, Hc = cv.h, t = sim.t;
      D.clear(cv);
      const sc = Math.min(W / 2.9, Hc / 1.8), cx = W / 2, cy = Hc * 0.5;
      const X = (x) => cx + x * sc, Y = (y) => cy - y * sc;
      /* frentes de onda */
      s.fronts.forEach(([xe, te]) => {
        const r = CV * (t - te);
        if (r <= 0) return;
        D.circle(ctx, X(xe), cy, r * sc, { color: '--c1', width: 1.4, alpha: Math.max(0.12, 0.8 - r * 0.22) });
      });
      /* cono de Mach */
      const Ma = p.vs / V;
      if (Ma > 1) {
        const th = Math.asin(1 / Ma), Lc = 2.4;
        D.line(ctx, X(s.x), cy, X(s.x - Lc * Math.cos(th)), Y(Lc * Math.sin(th)), { color: '--c2', width: 2 });
        D.line(ctx, X(s.x), cy, X(s.x - Lc * Math.cos(th)), Y(-Lc * Math.sin(th)), { color: '--c2', width: 2 });
        MC.text(ctx, `onda de choque (θ = ${f1(M.deg(th))}°)`, X(s.x) - 12, Y(0.55), { size: 11, align: 'right', color: '--c2', halo: true, weight: 600 });
      }
      /* oyentes */
      const xa = 1.05, xb = -1.05;
      D.person(ctx, X(xa), cy + 30, 50, { color: '--c3', arms: 0.2 });
      D.person(ctx, X(xb), cy + 30, 50, { color: '--c5', arms: 0.2 });
      MC.text(ctx, isFinite(q.fa) ? fHz(q.fa) : 'aún no le llega', Math.min(X(xa), W - 50), cy + 50, { size: 11.5, align: 'center', color: '--c3', weight: 600, halo: true });
      MC.text(ctx, fHz(q.fb), X(xb), cy + 50, { size: 11.5, align: 'center', color: '--c5', weight: 600, halo: true });
      /* fuente */
      D.block(ctx, X(s.x), cy, 30, 16, { fill: '--c2', r: 4 });
      if (p.vs > 0) D.vec(ctx, X(s.x) + 16, cy - 14, Math.min(80, 0.18 * p.vs), 0, { color: '--vel', label: 'v_s', vec: false, size: 12 });
      MC.text(ctx, 'dibujo esquemático: la rapidez del sonido y la de la fuente guardan la proporción real', 10, Hc - 8, { size: 9.5, color: '--ink-3' });
      sim.set('Ma', f2(Ma));
      sim.set('fa', isFinite(q.fa) ? `${fHz(q.fa)}` : 'el sonido no llega antes que la fuente');
      sim.set('fb', fHz(q.fb));
      sim.set('la', `${isFinite(q.fa) ? f3((V - p.vs) / p.f) : '—'} m y ${f3((V + p.vs) / p.f)} m`);
      sim.set('cone', Ma > 1 ? `sen θ = 1/${f2(Ma)} → θ = ${f1(M.deg(Math.asin(1 / Ma)))}°` : '— (subsónico)');
    });
  });

  /* ======================================================================
     18.4  Pulsaciones
     ====================================================================== */
  MC.defineSim('pulsaciones', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    const PL = [null, null, null];
    sim.group('Tonos');
    sim.slider('f1', { label: 'Frecuencia 1', min: 20, max: 1000, step: 0.1, value: 440, unit: 'Hz', fmt: f1 });
    sim.slider('f2', { label: 'Frecuencia 2', min: 20, max: 1000, step: 0.1, value: 437, unit: 'Hz', fmt: f1 });
    sim.slider('win', { label: 'Ventana de tiempo de la gráfica', min: 0.02, max: 3, step: 0.01, value: 1, unit: 's', fmt: f2, log: true });
    sim.button('Escuchar ambos', () => { MC.phys.tone(sim.p.f1, 3, VOL * 0.7); MC.phys.tone(sim.p.f2, 3, VOL * 0.7); }, { primary: true, icon: 'sound' });
    sim.button('Tono 1', () => MC.phys.tone(sim.p.f1, 1.2, VOL), { icon: 'sound' });
    sim.button('Tono 2', () => MC.phys.tone(sim.p.f2, 1.2, VOL), { icon: 'sound' });
    sim.out('fb', 'Frecuencia de pulsación |<i>f</i>₁ − <i>f</i>₂|', { hl: true });
    sim.out('Tb', 'Periodo de las pulsaciones');
    sim.out('fm', 'Tono que se oye (<i>f</i>₁ + <i>f</i>₂)/2');
    sim.presets([
      { id: 'diapason', label: 'Diapasón de 440 Hz y cuerda de 437 Hz', v: { f1: 440, f2: 437, win: 1 }, note: '3 pulsaciones por segundo.' },
      { id: 'lentas', label: 'Casi afinado: 440 y 441 Hz', v: { f1: 440, f2: 441, win: 2.5 } },
      { id: 'rapidas', label: 'Pulsaciones rápidas: 440 y 452 Hz', v: { f1: 440, f2: 452, win: 0.5 } },
      { id: 'afinado', label: 'Afinado: 440 y 440 Hz', v: { f1: 440, f2: 440, win: 1 } },
      { id: 'grafica', label: 'Frecuencias bajas para ver la onda (100 y 110 Hz)', v: { f1: 100, f2: 110, win: 0.3 } }
    ]);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h;
      D.clear(cv);
      const hh = Hc * 0.42;
      const y1 = (t) => Math.sin(2 * Math.PI * p.f1 * t), y2 = (t) => Math.sin(2 * Math.PI * p.f2 * t);
      const n = Math.min(6000, Math.max(800, Math.round(p.win * Math.max(p.f1, p.f2) * 20)));
      const fbeat = Math.abs(p.f1 - p.f2), fav = (p.f1 + p.f2) / 2, zw = 4 / fav;
      const tB = fbeat > 0 ? 1 / (2 * fbeat) : 0;
      const zooms = [[0, 'en t = 0: en fase, se suman'], [Math.max(0, tB - zw / 2), fbeat > 0 ? `en t = ${f3(tB)} s: en oposición, se cancelan` : 'siempre en fase']];
      zooms.forEach(([ta, lab], i) => {
        const P = PL[i] || (PL[i] = new MC.Plot(ctx));
        P.ctx = ctx;
        P.set({ x: (i * W) / 2, y: 0, w: W / 2, h: hh, xmin: ta, xmax: ta + zw, ymin: -1.3, ymax: 1.3, xlabel: ['t', 'ms'], ylabel: i === 0 ? ['y₁, y₂', ''] : '', mb: 34, mt: 26, ml: i === 0 ? 50 : 16, mr: 10, xfmt: (v) => MC.fix(v * 1000, 1), yticks: i === 0 ? null : [] });
        P.frame();
        P.fn(y1, { color: '--c1', width: 1.8, n: 300 });
        P.fn(y2, { color: '--c4', width: 1.8, n: 300, dash: [5, 3] });
        MC.text(ctx, lab, (i * W) / 2 + (i === 0 ? 52 : 18), 16, { size: 10.5, color: '--ink-2', weight: 600 });
      });
      MC.text(ctx, `${f1(p.f1)} Hz`, W - 14, 32, { size: 10.5, align: 'right', color: '--c1', halo: true });
      MC.text(ctx, `${f1(p.f2)} Hz`, W - 14, 45, { size: 10.5, align: 'right', color: '--c4', halo: true });
      const P1 = PL[2] || (PL[2] = new MC.Plot(ctx));
      P1.ctx = ctx;
      P1.set({ x: 0, y: hh, w: W, h: Hc - hh, xmin: 0, xmax: p.win, ymin: -2.4, ymax: 2.4, xlabel: ['t', 's'], ylabel: ['y₁ + y₂', ''], mb: 36, mt: 14, ml: 50, mr: 14 });
      P1.frame();
      P1.fn((t) => y1(t) + y2(t), { color: '--c5', width: 1.3, n });
      const env = (t) => 2 * Math.abs(Math.cos(Math.PI * (p.f1 - p.f2) * t));
      P1.fn(env, { color: '--ink-2', width: 1.6, dash: [5, 4], n: 400 });
      P1.fn((t) => -env(t), { color: '--ink-2', width: 1.6, dash: [5, 4], n: 400 });
      const fb = fbeat;
      if (fb > 0) for (let k = 1; k / fb <= p.win; k++) P1.vline(k / fb, { color: '--ink-3', dash: [2, 4] });
      zooms.forEach(([ta]) => { if (ta + zw <= p.win) P1.band(ta, ta + zw, { color: '--accent', alpha: 0.25 }); });
      MC.text(ctx, 'suma (lo que llega al oído) y su envolvente', W - 18, hh + 28, { size: 11, align: 'right', color: '--c5', halo: true });
      sim.set('fb', fb > 0 ? `${f1(fb)} Hz` : '0: no hay pulsaciones');
      sim.set('Tb', fb > 0 ? `${f3(1 / fb)} s` : '—');
      sim.set('fm', `${f1((p.f1 + p.f2) / 2)} Hz`);
    });
  });

  /* ======================================================================
     18.5  Tubos sonoros
     ====================================================================== */
  MC.defineSim('tubos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.6 });
    const WV = 2 * Math.PI * 0.5;
    const dots = [];
    for (let i = 0; i < 360; i++) dots.push([Math.random(), Math.random()]);
    let GP = null;
    sim.group('Tubo');
    sim.seg('tipo', { options: [['abierto', 'Abierto en ambos extremos'], ['cerrado', 'Cerrado en un extremo']], value: 'abierto' });
    sim.slider('L', { label: 'Longitud del tubo <i>L</i>', min: 0.1, max: 3, step: 0.005, value: 0.66, unit: 'm', fmt: f3, log: true });
    sim.slider('m', { label: 'Modo (1 = fundamental)', min: 1, max: 6, step: 1, value: 1, fmt: f0 });
    sim.slider('T', { label: 'Temperatura del aire', min: -10, max: 40, step: 1, value: 20, unit: '°C', fmt: f0 });
    sim.button('Escuchar', () => MC.phys.tone(freq(), 1.3, VOL), { primary: true, icon: 'sound' });
    sim.out('n', 'Armónico <i>n</i>');
    sim.out('f', 'Frecuencia <i>f</i><sub>n</sub>', { hl: true });
    sim.out('lam', 'Longitud de onda λ<sub>n</sub>');
    sim.out('all', 'Frecuencias permitidas');
    sim.presets([
      { id: 'flauta', label: 'Flauta (tubo abierto de 0.66 m)', v: { tipo: 'abierto', L: 0.66, m: 1, T: 20 }, note: 'Unos 260 Hz: el Do central.' },
      { id: 'clarinete', label: 'Clarinete (cerrado por la boquilla, 0.66 m)', v: { tipo: 'cerrado', L: 0.66, m: 1, T: 20 }, note: 'Una octava más grave que la flauta del mismo largo.' },
      { id: 'organo', label: 'Tubo de órgano abierto de 2.4 m', v: { tipo: 'abierto', L: 2.4, m: 1, T: 20 } },
      { id: 'botella', label: 'Botella (columna de aire de 25 cm)', v: { tipo: 'cerrado', L: 0.25, m: 1, T: 20 } },
      { id: 'voz', label: 'Tracto vocal (17 cm, cerrado en la glotis)', v: { tipo: 'cerrado', L: 0.17, m: 1, T: 35 }, note: 'Resonancias cerca de 500, 1500 y 2500 Hz: los formantes de una vocal neutra.' }
    ]);
    const nOf = () => (sim.p.tipo === 'cerrado' ? 2 * sim.p.m - 1 : sim.p.m);
    const freq = () => { const p = sim.p, v = vAir(p.T); return p.tipo === 'cerrado' ? (nOf() * v) / (4 * p.L) : (nOf() * v) / (2 * p.L); };
    /* patrón de desplazamiento (x/L de 0 a 1; extremo cerrado en x = 0) */
    const sPat = (xl) => (sim.p.tipo === 'cerrado' ? Math.sin((nOf() * Math.PI * xl) / 2) : Math.cos(nOf() * Math.PI * xl));
    const pPat = (xl) => (sim.p.tipo === 'cerrado' ? Math.cos((nOf() * Math.PI * xl) / 2) : Math.sin(nOf() * Math.PI * xl));
    sim.run({ reset() {}, step() {}, h: 1 / 120, autoplay: true, startLabel: 'Animar', speeds: false, timeFmt: () => 'cámara lenta' });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h, ph = WV * sim.t, n = nOf();
      D.clear(cv);
      const xa = 56, xb = W - 40, yt = Hc * 0.22, yb = Hc * 0.72, X = (xl) => xa + (xb - xa) * xl;
      ctx.save(); ctx.fillStyle = MC.alpha('--sky', 0.9); ctx.fillRect(xa, yt, xb - xa, yb - yt); ctx.restore();
      /* partículas de aire */
      const amp = (0.35 * (xb - xa)) / Math.max(2, n * 3);
      for (const [u, v] of dots) {
        const d = amp * sPat(u) * Math.cos(ph);
        D.circle(ctx, M.clamp(X(u) + d, xa + 1, xb - 1), yt + 4 + v * (yb - yt - 8), 1.7, { fill: '--ink-2' });
      }
      /* paredes */
      D.line(ctx, xa, yt, xb, yt, { color: '--ink', width: 3 });
      D.line(ctx, xa, yb, xb, yb, { color: '--ink', width: 3 });
      if (p.tipo === 'cerrado') D.line(ctx, xa, yt - 1, xa, yb + 1, { color: '--ink', width: 6 });
      /* envolventes de desplazamiento y presión */
      const cy = (yt + yb) / 2, A = (yb - yt) * 0.42;
      const sA = [], sB = [], pA = [], pB = [];
      for (let i = 0; i <= 200; i++) { const xl = i / 200; sA.push([X(xl), cy - A * sPat(xl)]); sB.push([X(xl), cy + A * sPat(xl)]); pA.push([X(xl), cy - A * pPat(xl)]); pB.push([X(xl), cy + A * pPat(xl)]); }
      D.poly(ctx, sA, { color: '--pos', width: 2 }); D.poly(ctx, sB, { color: '--pos', width: 2 });
      D.poly(ctx, pA, { color: '--c2', width: 1.6, dash: [5, 4] }); D.poly(ctx, pB, { color: '--c2', width: 1.6, dash: [5, 4] });
      MC.text(ctx, '— desplazamiento del aire', xa, yt - 22, { size: 10.5, color: '--pos', halo: true });
      MC.text(ctx, '- - variación de presión', xa + 160, yt - 22, { size: 10.5, color: '--c2', halo: true });
      MC.text(ctx, p.tipo === 'cerrado' ? 'extremo cerrado' : 'extremo abierto', xa, yb + 18, { size: 10.5, color: '--ink-3' });
      MC.text(ctx, 'extremo abierto', xb, yb + 18, { size: 10.5, color: '--ink-3', align: 'right' });
      D.dim(ctx, xa, yb + 34, xb, yb + 34, `L = ${f3(p.L)} m`, { size: 11, labelOff: -9 });
      /* espectro de frecuencias permitidas */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = GP || (GP = new MC.Plot(gctx));
      P.ctx = gctx;
      const v = vAir(p.T), fo = v / (2 * p.L), fc = v / (4 * p.L);
      const fmax = Math.max(freq() * 1.25, fo * 6.2);
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: fmax, ymin: 0, ymax: 2.6, xlabel: ['f', 'Hz'], ylabel: '', mb: 38, mt: 12, ml: 110, mr: 14, yticks: [] });
      P.frame();
      MC.text(gctx, 'abierto', 100, P.Y(1.8) + 4, { size: 11, align: 'right', color: p.tipo === 'abierto' ? '--accent' : '--ink-3', weight: 600 });
      MC.text(gctx, 'cerrado', 100, P.Y(0.8) + 4, { size: 11, align: 'right', color: p.tipo === 'cerrado' ? '--accent' : '--ink-3', weight: 600 });
      for (let k = 1; k * fo <= fmax; k++) { P.xy([k * fo, k * fo], [1.4, 2.2], { color: p.tipo === 'abierto' && k === n ? '--accent' : '--c1', width: p.tipo === 'abierto' && k === n ? 4 : 2 }); }
      for (let k = 1; k * fc <= fmax; k += 2) { P.xy([k * fc, k * fc], [0.4, 1.2], { color: p.tipo === 'cerrado' && k === n ? '--accent' : '--c4', width: p.tipo === 'cerrado' && k === n ? 4 : 2 }); }
      sim.set('n', `${n}${p.tipo === 'cerrado' ? ' (sólo impares)' : ''}`);
      sim.set('f', `${f1(freq())} Hz`);
      sim.set('lam', `${f3(v / freq())} m`);
      const list = p.tipo === 'cerrado' ? [1, 3, 5, 7].map((k) => f0(k * fc)) : [1, 2, 3, 4].map((k) => f0(k * fo));
      sim.set('all', list.join(', ') + ' … Hz');
    });
  });
})();
