/* Capítulo 17 — Emisión estimulada y láser */
(function () {
  'use strict';
  const EM = window.EM, La = EM.fm.las, K = EM.qm.K, c = K.c, h = K.h, kB = K.kB;

  /* 17.1 Coeficientes de Einstein: ¿cuándo domina la emisión estimulada? */
  const LINES = [['Microondas (maser de NH₃, 1.25 cm)', 1.25e-2], ['CO₂ (10.6 µm)', 10.6e-6], ['Nd:YAG (1064 nm)', 1.064e-6], ['He–Ne (632.8 nm)', 632.8e-9], ['UV (ArF, 193 nm)', 193e-9]];
  EM.defineSim('einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura de la radiación y del gas', min: 100, max: 20000, step: 1, value: 300, log: true, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.select('ln', { label: 'Transición', options: LINES.map((l, i) => [String(i), l[0]]), value: '3' });
    sim.out('r', 'Emisión espontánea / estimulada = e^{hν/kT} − 1', { hl: true });
    sim.out('N', 'Cociente de poblaciones N₂/N₁ en equilibrio (g₂ = g₁)');
    sim.out('AB', 'A/B = 8πhν³/c³ (J·s en el SI) · energía del fotón');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, lam] = LINES[+p.ln], nu = c / lam;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.56, h: H, xmin: 1e-7, xmax: 3e-2, xlog: true, ymin: 1e-6, ymax: 1e8, ylog: true, xlabel: 'longitud de onda (m)', ylabel: 'espontánea / estimulada', ml: 60, mr: 8, title: 'e^{hν/kT} − 1 a la temperatura elegida' });
      pl.frame();
      pl.fn((l) => La.spontOverStim(c / l, p.T), { color: '--accent', width: 2.8, n: 300 });
      pl.hline(1, { color: '--ink-3', dash: [4, 3], label: 'igualdad' });
      for (const [n2, l2] of LINES) pl.vline(l2, { color: '--ink-3', dash: [2, 4] });
      const r = La.spontOverStim(nu, p.T); pl.dot(lam, Math.min(Math.max(r, 1.5e-6), 9e7), { color: '--c3', r: 6 });
      const pr = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 100, xmax: 20000, xlog: true, ymin: 1e-40, ymax: 1, ylog: true, xlabel: 'temperatura (K)', ylabel: 'N₂/N₁', ml: 56, mr: 8, title: 'Población relativa del nivel superior' });
      pr.frame(); pr.fn((T) => Math.max(La.boltzRatio(nu, T), 1e-39), { color: '--c2', width: 2.6, n: 200 }); pr.vline(p.T, { color: '--accent', dash: [] });
      pr.dot(p.T, Math.max(La.boltzRatio(nu, p.T), 1e-39), { color: '--c3', r: 5 });
      sim.set('r', r < 1e-3 ? EM.sci(r, 3) : EM.fix(r, r < 10 ? 3 : 1));
      sim.set('N', EM.sci(La.boltzRatio(nu, p.T), 3));
      sim.set('AB', `${EM.sci(La.AoverB(nu), 3)} · ${EM.fix(h * nu / K.e, 4)} eV`);
    });
  });

  /* 17.2 Ecuaciones de balance */
  EM.defineSim('balance', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('r', { label: 'Bombeo relativo al umbral r = R/R_th', min: 0.5, max: 6, step: 0.01, value: 2.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('tc', { label: 'Tiempo de vida del fotón en la cavidad τ_c', min: 1, max: 20, step: 0.5, value: 1, unit: 'ns', fmt: (v) => EM.fix(v, 1) });
    sim.slider('tau', { label: 'Vida del nivel superior τ (Nd:YAG: 230 µs)', min: 20, max: 400, step: 1, value: 230, unit: 'µs', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Ventana temporal', min: 50, max: 1000, step: 10, value: 200, unit: 'µs', fmt: (v) => v.toFixed(0) });
    sim.out('th', 'Inversión umbral N_th = 1/(Bτ_c) · bombeo umbral R_th = N_th/τ', { hl: true });
    sim.out('f', 'Oscilaciones de relajación: frecuencia · tiempo de amortiguamiento 2τ/r');
    sim.out('ss', 'Estado estacionario: fotones φ = τ_c(R − R_th)');
    sim.out('pk', 'Primer pico de fotones respecto del estacionario · retardo de encendido');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, tauc = p.tc * 1e-9, tau = p.tau * 1e-6, B = 1e-5, beta = 1e-6;
      EM.draw.clear(cv);
      const par = { tau, tauc, B, beta, R: 0 }; par.R = p.r / (B * tauc * tau);
      const T = p.T * 1e-6, dt = Math.min(tauc * 1.2, T / 4000), every = Math.max(1, Math.round(T / dt / 30000)), tr = La.rateIntegrate(par, T, dt, 0, 1e-3, every);
      const th = La.rateThreshold(par), ss = La.rateSteady(par), rf = La.relaxFreq(par);
      const phss = Math.max(ss.phi, 1e-30), t = tr.map((q) => q.t * 1e6), Nn = tr.map((q) => q.N / th.Nth), Pn = tr.map((q) => q.ph / phss);
      let pk = 0, tpk = 0; tr.forEach((q) => { if (q.ph > pk) { pk = q.ph; tpk = q.t; } });
      const tdel = (tr.find((q) => q.ph > 0.5 * phss) || { t: NaN }).t;
      const pmax = p.r > 1 ? Math.min(Math.max(...Pn) * 1.1, 60) : 1;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: p.T, ymin: 0, ymax: Math.max(1.2, Math.max(...Nn) * 1.1), xlabel: 't (µs)', ylabel: 'inversión N/N_th', ml: 56, mr: 8, title: 'Inversión de población' });
      pl.frame(); pl.xy(t, Nn, { color: '--c2', width: 2.6 }); pl.hline(1, { color: '--ink-3', dash: [4, 3], label: 'umbral' });
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: p.T, ymin: 0, ymax: p.r > 1 ? pmax : 1, xlabel: 't (µs)', ylabel: 'fotones φ/φ_estacionario', ml: 56, mr: 8, title: 'Potencia de salida' });
      pr.frame(); pr.xy(t, Pn, { color: '--accent', width: 2.6 }); if (p.r > 1) pr.hline(1, { color: '--ink-3', dash: [4, 3] });
      sim.set('th', `${EM.sci(th.Nth, 3)} · ${EM.sci(th.Rth, 3)} s⁻¹`);
      sim.set('f', p.r > 1 ? `${EM.fix(Math.sqrt(Math.max(rf.w0 ** 2 - rf.damp ** 2, 0)) / (2 * Math.PI) / 1e3, 1)} kHz · ${EM.fix(2 * tau / p.r * 1e6, 1)} µs` : 'bajo el umbral: no hay láser');
      sim.set('ss', p.r > 1 ? `${EM.sci(ss.phi, 3)} fotones` : '0 (solo fluorescencia)');
      sim.set('pk', p.r > 1 ? `${EM.fix(pk / phss, 2)} × · ${EM.fix(tdel * 1e6, 1)} µs` : '—');
    });
  });

  /* 17.3 Cavidad Fabry–Pérot: modos longitudinales y umbral */
  EM.defineSim('cavidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('L', { label: 'Longitud de la cavidad L', min: 0.05, max: 2, step: 0.01, value: 0.3, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('R2', { label: 'Reflectividad del espejo de salida R₂ (el otro, R₁ = 0.999)', min: 0.9, max: 0.9995, step: 0.0005, value: 0.99, fmt: (v) => EM.fix(v, 4) });
    sim.slider('g0', { label: 'Ganancia de pequeña señal en el pico γ₀ (m⁻¹)', min: 0.01, max: 0.3, step: 0.005, value: 0.08, fmt: (v) => EM.fix(v, 3) });
    sim.slider('T', { label: 'Temperatura del gas (ancho Doppler)', min: 300, max: 800, step: 10, value: 400, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('fsr', 'Intervalo espectral libre c/2L · ancho Doppler', { hl: true });
    sim.out('th', 'Umbral de ganancia γ_th = −ln(R₁R₂)/2L · tiempo de vida del fotón τ_c');
    sim.out('n', 'Modos longitudinales por encima del umbral');
    sim.out('Q', 'Factor de calidad Q · ancho de la resonancia pasiva 1/(2πτ_c)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nu0 = c / 632.8e-9, fw = La.dopplerFWHM(nu0, p.T, 20.1797), gth = La.gammaThreshold(p.L, 0.999, p.R2), md = La.modes(nu0, p.L, fw, p.g0, gth), tc = La.photonLifetime(p.L, 0.999, p.R2);
      EM.draw.clear(cv);
      const span = 1.5 * fw, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -span / 1e9, xmax: span / 1e9, ymin: 0, ymax: 0.31, xlabel: 'ν − ν₀ (GHz)', ylabel: 'ganancia γ (m⁻¹)', ml: 56, mr: 10, title: 'Curva de ganancia (Doppler), umbral y modos de la cavidad' });
      pl.frame(); pl.fn((x) => p.g0 * Math.exp(-0.5 * (x * 1e9 / (fw / (2 * Math.sqrt(2 * Math.LN2)))) ** 2), { color: '--accent', width: 2.6, n: 300 });
      pl.hline(gth, { color: '--c3', dash: [6, 3], label: 'umbral' });
      for (const m of md) { const x = (m.nu - nu0) / 1e9; if (Math.abs(x) > span / 1e9) continue; pl.xy([x, x], [0, m.g], { color: m.on ? '--c2' : '--ink-3', width: m.on ? 3 : 1.4 }); }
      const non = md.filter((m) => m.on).length;
      sim.set('fsr', `${EM.fix(La.fsr(p.L) / 1e6, 1)} MHz · ${EM.fix(fw / 1e9, 3)} GHz`);
      sim.set('th', `${EM.fix(gth, 4)} m⁻¹ (${EM.fix(gth * p.L * 100, 2)} % por paso) · ${EM.fix(tc * 1e9, 1)} ns`);
      sim.set('n', p.g0 > gth ? `${non}` : '0 (ganancia menor que el umbral)');
      sim.set('Q', `${EM.sci(La.Qfactor(nu0, tc), 3)} · ${EM.fix(1 / (2 * Math.PI * tc) / 1e6, 2)} MHz`);
    });
  });

  /* 17.4 Resonador y haz gaussiano */
  EM.defineSim('haz', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('L', { label: 'Longitud L', min: 0.1, max: 2, step: 0.01, value: 0.5, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('R1', { label: 'Radio de curvatura R₁', min: 0.2, max: 6, step: 0.01, value: 2, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('R2', { label: 'Radio de curvatura R₂', min: 0.2, max: 6, step: 0.01, value: 3, unit: 'm', fmt: (v) => EM.fix(v, 2) });
    sim.select('lam', { label: 'Longitud de onda', options: [['632.8', 'He–Ne 632.8 nm'], ['1064', 'Nd:YAG 1064 nm'], ['532', 'Nd:YAG doblado 532 nm']], value: '632.8' });
    sim.out('st', 'g₁ = 1 − L/R₁ · g₂ = 1 − L/R₂ · g₁g₂ (estable si 0 ≤ g₁g₂ ≤ 1)', { hl: true });
    sim.out('w', 'Cintura w₀ · posición desde el espejo 1 · alcance de Rayleigh');
    sim.out('wm', 'Radios del haz en los espejos · divergencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = +p.lam * 1e-9, g1 = La.g(p.L, p.R1), g2 = La.g(p.L, p.R2), st = La.stable(p.L, p.R1, p.R2);
      EM.draw.clear(cv);
      const pg = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.4, h: H, xmin: -2, xmax: 2, ymin: -2, ymax: 2, xlabel: 'g₁', ylabel: 'g₂', ml: 50, mr: 8, title: 'Diagrama de estabilidad' });
      pg.frame(); const xs = [], ys = []; for (let i = 1; i <= 200; i++) { const x = 0.005 * i; xs.push(x); ys.push(1 / x); }
      pg.xy(xs, ys, { color: '--ink-3', width: 1.8 }); pg.xy(xs.map((x) => -x), ys.map((y) => -y), { color: '--ink-3', width: 1.8 }); pg.hline(0, { color: '--ink-3', dash: [] }); pg.vline(0, { color: '--ink-3', dash: [] });
      pg.dot(g1, g2, { color: st ? '--c2' : '--c3', r: 6 });
      const pb = new EM.Plot(ctx, { x: W * 0.42, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: p.L, ymin: -1.2, ymax: 1.2, xlabel: 'z (m, del espejo 1 al 2)', ylabel: 'semiancho del haz w (mm)', ml: 56, mr: 8, title: st ? 'Modo fundamental' : 'Resonador inestable: no hay modo' });
      pb.frame();
      if (st) {
        const w0 = La.waist(p.L, p.R1, p.R2, lam), zw = La.waistPos(p.L, p.R1, p.R2), zs = [], up = [], dn = [];
        for (let i = 0; i <= 200; i++) { const z = p.L * i / 200, w = La.beamW(w0, lam, z - zw) * 1e3; zs.push(z); up.push(w); dn.push(-w); }
        pb.xy(zs, up, { color: '--accent', width: 2.6 }); pb.xy(zs, dn, { color: '--accent', width: 2.6 });
        pb.vline(0, { color: '--ink', dash: [] }); pb.vline(p.L, { color: '--ink', dash: [] });
        const zr = La.zR(w0, lam);
        sim.set('w', `${EM.fix(w0 * 1e3, 4)} mm · ${EM.fix(zw, 3)} m · ${EM.fix(zr, 3)} m`);
        sim.set('wm', `${EM.fix(La.beamW(w0, lam, -zw) * 1e3, 4)} mm y ${EM.fix(La.beamW(w0, lam, p.L - zw) * 1e3, 4)} mm · ${EM.fix(La.divergence(w0, lam) * 1e3, 3)} mrad`);
      } else { sim.set('w', '—'); sim.set('wm', '—'); }
      sim.set('st', `${EM.fix(g1, 3)} · ${EM.fix(g2, 3)} · ${EM.fix(g1 * g2, 3)} — ${st ? 'estable' : 'INESTABLE'}`);
    });
  });
})();
