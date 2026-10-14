/* Capítulo 10 — Fractura */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     10.1 Inglis
     ====================================================================== */
  EM.defineSim('inglis', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Semieje mayor <i>a</i>', min: 0.1, max: 5, step: 0.05, value: 2, unit: 'mm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('b', { label: 'Semieje menor <i>b</i>', min: 0.02, max: 5, step: 0.01, value: 0.6, unit: 'mm', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('s', { label: 'Esfuerzo remoto σ<sub>0</sub>', min: 10, max: 300, step: 5, value: 100, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.out('rho', 'Radio de punta ρ<sub>t</sub> = <i>b</i>²/<i>a</i>');
    sim.out('Kt', 'Factor <i>K<sub>t</sub></i> = 1 + 2√(<i>a</i>/ρ<sub>t</sub>) = 1 + 2<i>a</i>/<i>b</i>', { hl: true });
    sim.out('sm', 'Esfuerzo en la punta');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const a = p.a, b = Math.min(p.b, 5), rho = (b * b) / a, Kt = MAT.inglis(a, rho);
      /* placa y elipse */
      const x0 = W * 0.04, w = W * 0.42, cx = x0 + w / 2, cy = H * 0.5, sc = (w * 0.36) / 5;
      ctx.fillStyle = EM.alpha('--c6', 0.18); ctx.fillRect(x0, 16, w, H - 32);
      ctx.fillStyle = EM.col('--canvas'); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, a * sc, b * sc, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      for (let k = 0; k < 7; k++) { const x = x0 + ((k + 0.5) * w) / 7; EM.draw.arrow(ctx, x, 16, x, 2, { color: '--c1', width: 1.4 }); EM.draw.arrow(ctx, x, H - 16, x, H - 2, { color: '--c1', width: 1.4 }); }
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + a * sc, cy, 4, 0, 7); ctx.fill();
      /* σ_yy delante de la punta: aproximación de Creager y Paris (1967), válida para r ≪ a,
         con K = σ0√(πa) y origen ρ/2 detrás de la punta */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 0.5, ymin: 0, ymax: Math.max(4, Kt * 1.15), xlabel: 'distancia a la punta (x − a)/a', ylabel: 'σ_yy/σ_0', ml: 46 });
      pl.frame();
      const f = (xr) => { const rp = xr * a + rho / 2; return 1 + Math.sqrt(a / (2 * rp)) * (1 + rho / (2 * rp)); };
      pl.fn(f, { color: '--accent', width: 2.4 });
      pl.hline(1, { color: '--ink-3', label: 'σ_0' });
      pl.dot(0, Kt, { color: '--accent', label: 'K_t = ' + EM.fix(Kt, 2) });
      EM.text(ctx, 'campo cercano: Creager y Paris (1967)', W * 0.5 + 54, H - 48, { size: 10.5, color: '--ink-3' });
      sim.set('rho', EM.si(rho * 1e-3, 'm'));
      sim.set('Kt', EM.fix(Kt, 2));
      sim.set('sm', EM.fix(Kt * p.s, 0) + ' MPa');
    });
  });

  /* ======================================================================
     10.2 Griffith
     ====================================================================== */
  const GR = { glass: ['Vidrio (γ_s = 0.3 J/m²)', 69e9, 0.3], al2o3: ['Alúmina (γ = 1 J/m²)', 380e9, 1.0], steelp: ['Acero con plasticidad (γ_s + γ_p ≈ 2500 J/m²)', 207e9, 2500] };
  EM.defineSim('griffith', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.entries(GR).map(([k, v]) => [k, v[0]]), value: 'glass' });
    sim.slider('s', { label: 'Esfuerzo σ', min: 5, max: 500, step: 1, value: 40, unit: 'MPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('ac', 'Semilongitud crítica <i>a<sub>c</sub></i>', { hl: true });
    sim.out('Ub', 'Barrera de energía (por m de espesor)');
    sim.out('Kc', 'Tenacidad equivalente √(2<i>E</i>γ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, E, g] = GR[p.m], s = p.s * 1e6;
      const ac = (2 * E * g) / (Math.PI * s * s);
      const U = (a) => 4 * a * g - (Math.PI * s * s * a * a) / E;
      const Umax = U(ac);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 3 * ac * 1e6, ymin: -2 * Umax, ymax: 1.6 * Umax, xlabel: 'semilongitud de la grieta a (µm)', ylabel: 'ΔU (J/m)', ml: 64 });
      pl.frame();
      pl.fn((x) => 4 * x * 1e-6 * g, { color: '--c3', width: 1.4, dash: [5, 4] });
      pl.fn((x) => -(Math.PI * s * s * (x * 1e-6) ** 2) / E, { color: '--c1', width: 1.4, dash: [5, 4] });
      pl.fn((x) => U(x * 1e-6), { color: '--accent', width: 2.6 });
      pl.vline(ac * 1e6, { label: 'a_c', color: '--ink-2' });
      pl.dot(ac * 1e6, Umax, { color: '--accent' });
      pl.label(ac * 1e6 * 0.35, Umax * 0.4, 'estable: la grieta no crece', { size: 11, color: '--c3' });
      pl.label(ac * 1e6 * 1.6, -Umax * 0.6, 'inestable: crece sin límite', { size: 11, color: '--c2' });
      pl.legend([{ label: 'energía de superficie 4aγ', color: '--c3', dash: [5, 4] }, { label: 'energía elástica liberada', color: '--c1', dash: [5, 4] }, { label: 'total', color: '--accent' }], 'bl');
      sim.set('ac', EM.si(ac, 'm'));
      sim.set('Ub', EM.sci(Umax, 3) + ' J/m');
      sim.set('Kc', EM.fix(Math.sqrt(2 * E * g) / 1e6, 2) + ' MPa√m');
    });
  });

  /* ======================================================================
     10.3 Diseño con K_Ic
     ====================================================================== */
  const KM = { al2024: ['Aluminio 2024-T3', 345, 44], al7075: ['Aluminio 7075-T651', 495, 24], s4340a: ['Acero 4340 revenido a 260 °C', 1640, 50], s4340b: ['Acero 4340 revenido a 425 °C', 1420, 87.4], ti: ['Ti-6Al-4V', 910, 60], pmma: ['PMMA', 60, 1.2] };
  EM.defineSim('kic-design', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('m', { label: 'Material', options: Object.entries(KM).map(([k, v]) => [k, v[0]]), value: 'al2024' });
    sim.seg('Y', { label: 'Geometría', options: [['1', 'Grieta interna (Y = 1)'], ['1.12', 'Grieta de borde (Y = 1.12)']], value: '1' });
    sim.slider('a', { label: 'Semilongitud de grieta <i>a</i>', min: 0.05, max: 50, step: 0.05, value: 3, unit: 'mm', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('s', { label: 'Esfuerzo de servicio σ', min: 10, max: 1800, step: 5, value: 200, unit: 'MPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('K', '<i>K<sub>I</sub></i> = <i>Y</i>σ√(π<i>a</i>)', { hl: true });
    sim.out('st', 'Estado');
    sim.out('ac', 'Grieta crítica a este esfuerzo');
    sim.out('at', 'Grieta de transición fluencia/fractura');
    sim.out('B', 'Espesor mínimo para deformación plana');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, sy, Kc] = KM[p.m], Y = +p.Y;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.05, xmax: 50, ymin: 10, ymax: 2000, xlog: true, ylog: true, xlabel: 'semilongitud de grieta a (mm)', ylabel: 'esfuerzo (MPa)', ml: 56 });
      pl.frame();
      const sc = (amm) => Kc / (Y * Math.sqrt(Math.PI * amm * 1e-3));
      /* regiones */
      const xs = M.linspace(Math.log10(0.05), Math.log10(50), 120).map((q) => Math.pow(10, q));
      ctx.save(); ctx.beginPath(); ctx.moveTo(pl.X(0.05), pl.Y(10));
      xs.forEach((x) => ctx.lineTo(pl.X(x), pl.Y(Math.max(10, Math.min(2000, Math.min(sy, sc(x)))))));
      ctx.lineTo(pl.X(50), pl.Y(10)); ctx.closePath(); ctx.fillStyle = EM.alpha('--c3', 0.12); ctx.fill(); ctx.restore();
      pl.fn((x) => sc(x), { color: '--c2', width: 2.2 });
      pl.hline(sy, { color: '--c1', dash: [], width: 2 });
      const at = Math.pow(Kc / (Y * sy), 2) / Math.PI * 1e3;
      pl.vline(at, { color: '--ink-3', label: 'a_t' });
      pl.label(0.07, 14, 'zona segura', { size: 12, color: '--c3' });
      pl.label(Math.min(30, at * 3), Math.min(1700, sc(Math.min(30, at * 3)) * 1.35), 'fractura: K_I > K_Ic', { size: 11.5, color: '--c2' });
      pl.label(Math.max(0.06, at * 0.08), Math.min(1800, sy * 1.35), 'fluencia: σ > σ_y', { size: 11.5, color: '--c1' });
      pl.dot(p.a, p.s, { color: '--accent', r: 6 });
      const K = Y * p.s * Math.sqrt(Math.PI * p.a * 1e-3);
      const st = p.s >= sy && K < Kc ? 'falla por fluencia' : K >= Kc ? (p.s >= sy ? 'fluye y se fractura' : 'fractura frágil sin fluencia') : 'seguro (factor ' + EM.fix(Math.min(sy / p.s, Kc / K), 2) + ')';
      sim.set('K', EM.fix(K, 2) + ' MPa√m (K<sub>Ic</sub> = ' + Kc + ')');
      sim.set('st', st);
      sim.set('ac', EM.fix(MAT.critCrack(Kc, Y, p.s) * 1e3, 2) + ' mm');
      sim.set('at', EM.fix(at, 2) + ' mm');
      sim.set('B', EM.fix(MAT.planeStrainB(Kc, sy) * 1e3, 1) + ' mm');
    });
  });

  /* ======================================================================
     10.4 Charpy
     ====================================================================== */
  EM.defineSim('charpy', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Acero', options: [['f', 'Ferrítico (BCC)'], ['a', 'Austenítico 304 (FCC)']], value: 'f' });
    sim.slider('C', { label: 'Carbono', min: 0.05, max: 0.8, step: 0.01, value: 0.2, unit: '% peso', fmt: (v) => EM.fix(v, 2) });
    sim.slider('d', { label: 'Tamaño de grano', min: 5, max: 100, step: 1, value: 25, unit: 'µm', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura del ensayo', min: -150, max: 150, step: 1, value: 0, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energía absorbida', { hl: true });
    sim.out('Tt', 'Temperatura de transición (mitad de la meseta)');
    sim.out('frac', 'Aspecto de la fractura');
    sim.out('h', 'Altura final del péndulo (m = 30 kg, h<sub>0</sub> = 1.5 m)');
    let swing = 0;
    sim.animate((dt) => { swing = (swing + dt * 0.6) % 2; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* modelo ilustrativo: T_t sube ~ 1.5 °C por 0.01 %C y con √d; meseta superior baja con C */
      const fcc = p.m === 'a';
      const Tt = fcc ? NaN : -60 + 160 * p.C + 4 * (Math.sqrt(p.d) - 5);
      const Eup = fcc ? 160 : Math.max(30, 240 - 230 * p.C), Elow = fcc ? 150 : 5;
      const Ef = (T) => (fcc ? 150 - 0.04 * T : MAT.dbtt(T, Tt, Elow, Eup, 18));
      const E = Ef(p.T);
      /* péndulo */
      const px = W * 0.17, py = H * 0.14, Lp = Math.min(H * 0.55, W * 0.14);
      const h0 = 1.5, hf = Math.max(0, h0 - E / (30 * 9.81));
      const th0 = Math.acos(1 - h0 / 1.6), thf = Math.acos(Math.max(-1, 1 - hf / 1.6));
      const th = swing < 1 ? th0 * Math.cos(Math.PI * swing) : -thf * Math.sin((Math.PI / 2) * (swing - 1)) ;
      const bx = px + Lp * Math.sin(th), by = py + Lp * Math.cos(th);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      EM.draw.bob(ctx, bx, by, 14, { color: '--c6' });
      ctx.fillStyle = EM.col('--accent'); ctx.fillRect(px - 4, py + Lp + 16, 8, 18);
      EM.text(ctx, 'probeta', px, py + Lp + 50, { size: 10.5, align: 'center', color: '--ink-3' });
      /* curva */
      const pl = new EM.Plot(ctx, { x: W * 0.36, y: 0, w: W * 0.64, h: H, xmin: -150, xmax: 150, ymin: 0, ymax: 280, xlabel: 'temperatura (°C)', ylabel: 'energía Charpy (J)', ml: 50 });
      pl.frame();
      pl.fn(Ef, { color: '--accent', width: 2.6 });
      pl.hline(27, { color: '--ink-3', label: '27 J' });
      if (!fcc) pl.vline(Tt, { color: '--ink-3', label: 'T_t' });
      pl.dot(p.T, E, { color: '--accent' });
      const shear = fcc ? 100 : 100 * (E - Elow) / (Eup - Elow);
      sim.set('E', EM.fix(E, 0) + ' J');
      sim.set('Tt', fcc ? 'no hay transición (FCC)' : EM.fix(Tt, 0) + ' °C');
      sim.set('frac', EM.fix(shear, 0) + ' % dúctil (fibrosa), ' + EM.fix(100 - shear, 0) + ' % clivaje (brillante)');
      sim.set('h', EM.fix(hf, 2) + ' m');
    });
    sim.note('Curva de transición modelada con tanh; la dependencia con el carbono y el grano reproduce las tendencias de Callister (fig. 8.15), no un acero específico.');
  });
})();
