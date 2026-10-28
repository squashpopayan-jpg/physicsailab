/* Capítulo 17 — Temperatura, colisiones y estado de transición */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, K = FQ.kin, R = FQ.R, kB = FQ.kB, h = FQ.hPlanck, NA = FQ.NA;
  const kmod = (r, T) => r.A * Math.pow(T, r.b) * Math.exp(-(r.Ea * 1e0) / (R * T)); /* Ea en J/mol; A en cm³/(mol·s) */

  const HO = DAT.gri.find((r) => r.eq === 'H + O2 <=> O + OH');
  /* 17.1 Arrhenius con datos de reacciones reales (GRI-Mech 3.0) */
  EM.defineSim('arrhenius-gri', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('r', { label: 'Reacción elemental (GRI-Mech 3.0)', options: DAT.gri.map((r, i) => [i, r.eq.replace(/<=>/g, '⇌')]), value: DAT.gri.findIndex((r) => r.eq === 'H + O2 <=> O + OH') });
    sim.slider('T', { label: 'Temperatura de lectura', min: 300, max: 3000, step: 10, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Constante de velocidad <i>k</i>(<i>T</i>)', { hl: true });
    sim.out('Ea', 'Energía de activación aparente <i>E</i><sub>a</sub> = −<i>R</i> d ln<i>k</i>/d(1/<i>T</i>) = <i>E</i><sub>0</sub> + <i>bRT</i>');
    sim.out('par', 'Parámetros de la ecuación de Arrhenius modificada: <i>A</i> · <i>b</i> · <i>E</i><sub>0</sub>');
    sim.out('q', 'Cociente <i>k</i>(<i>T</i> + 10 K)/<i>k</i>(<i>T</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, r = DAT.gri[+p.r], T = p.T;
      EM.draw.clear(cv);
      const xs = [], ys = [];
      for (let t = 300; t <= 3000; t += 20) { xs.push(1000 / t); ys.push(Math.log10(kmod(r, t))); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.3, xmax: 3.4, ymin: Math.min(...ys) - 0.4, ymax: Math.max(...ys) + 0.4, xlabel: '1000/T (K⁻¹)', ylabel: 'log₁₀ k  (cm³/mol·s)', ml: 54 });
      pl.frame();
      pl.xy(xs, ys, { color: '--c1', width: 2.6 });
      const Ea = r.Ea + r.b * R * T, y0 = Math.log10(kmod(r, T)), x0 = 1000 / T, m = -Ea / (R * Math.LN10) / 1000, ds = 0.7;
      pl.path([[x0 - ds, y0 - m * ds], [x0 + ds, y0 + m * ds]], { color: '--c4', width: 2, dash: [6, 4] });
      pl.dot(x0, y0, { color: '--accent' });
      pl.legend([{ label: 'k(T) del mecanismo', color: '--c1' }, { label: 'recta de Arrhenius tangente: pendiente −Ea/(R ln 10)', color: '--c4', dash: [6, 4] }], 'tr');
      sim.set('k', EM.sci(kmod(r, T), 3) + ' cm³/mol·s');
      sim.set('Ea', EM.fix(Ea / 1e3, 1) + ' kJ/mol' + (Ea < 0 ? ' (¡negativa!: la reacción es más lenta al calentar)' : ''));
      sim.set('par', EM.sci(r.A, 2) + ' · ' + EM.fix(r.b, 2) + ' · ' + EM.fix(r.Ea / 1e3, 1) + ' kJ/mol');
      sim.set('q', EM.fix(kmod(r, T + 10) / kmod(r, T), 3));
    });
  });

  /* 17.2 Distribución de energías y teoría de colisiones */
  EM.defineSim('colisiones', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 3000, step: 10, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('E0', { label: 'Energía umbral E₀ (a lo largo de la línea de centros)', min: 5, max: 200, step: 1, value: 71, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.out('f', 'Fracción de colisiones con energía ≥ <i>E</i><sub>0</sub>: exp(−<i>E</i><sub>0</sub>/<i>RT</i>)', { hl: true });
    sim.out('q', 'Aumento de la fracción al subir 10 K');
    sim.out('kc', 'H + O₂ → OH + O: <i>k</i> de colisiones (σ = 0.21 nm²; <i>P</i> = 1) · <i>k</i> experimental (GRI) · factor estérico <i>P</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, RT = R * p.T, E0 = p.E0 * 1e3;
      EM.draw.clear(cv);
      const Emax = Math.max(E0 * 1.5, 6 * RT) / 1e3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Emax, ymin: 0, ymax: 1.05, xlabel: 'energía relativa a lo largo de la línea de centros (kJ/mol)', ylabel: 'densidad f(E)/f(0)', ml: 48 });
      pl.frame();
      const f = (T) => (E) => Math.exp(-(E * 1e3) / (R * T));
      pl.fn(f(p.T), { color: '--c1', width: 2.6, n: 200 }); pl.fn(f(p.T + 10), { color: '--c2', width: 1.8, dash: [5, 4], n: 200 });
      const xs = [], ys = []; for (let E = p.E0; E <= Emax; E += Emax / 200) { xs.push(E); ys.push(Math.exp(-(E * 1e3) / RT)); }
      pl.xy(xs, ys, { color: '--c1', width: 0, fill: '--c1', fillAlpha: 0.25 });
      pl.vline(p.E0, { color: '--accent', label: 'E₀' });
      pl.legend([{ label: 'f(E) a T', color: '--c1' }, { label: 'f(E) a T + 10 K', color: '--c2', dash: [5, 4] }], 'tr');
      const fr = Math.exp(-E0 / RT), fr2 = Math.exp(-E0 / (R * (p.T + 10)));
      sim.set('f', EM.sci(fr, 3));
      sim.set('q', EM.fix(fr2 / fr, 3) + '× (' + EM.fix(100 * (fr2 / fr - 1), 1) + ' %): ' + (fr2 / fr > 2 ? 'más del doble' : 'regla de «duplicar cada 10 K» solo vale para E₀ ≈ 50–60 kJ/mol a 300 K'));
      const mu = (1.00794 * 31.998) / (1.00794 + 31.998) * 1.66054e-27, c = Math.sqrt((8 * kB * p.T) / (Math.PI * mu)), kc = 0.21e-18 * c * NA * 1e6 * Math.exp(-71.3e3 / RT), kg = kmod(HO, p.T);
      sim.set('kc', EM.sci(kc, 2) + ' · ' + EM.sci(kg, 2) + ' cm³/mol·s · P = ' + EM.fix(kg / kc, 2) + ' (a 1000 K)');
    });
  });

  /* 17.3 Teoría del estado de transición: Eyring */
  EM.defineSim('eyring', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('dH', { label: 'Entalpía de activación ΔH‡', min: 10, max: 200, step: 1, value: 80, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('dS', { label: 'Entropía de activación ΔS‡', min: -150, max: 100, step: 1, value: -40, unit: 'J/mol·K', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('k', 'Constante unimolecular <i>k</i> = (<i>k</i><sub>B</sub><i>T</i>/<i>h</i>) exp(−Δ<i>G</i>‡/<i>RT</i>)', { hl: true });
    sim.out('G', 'Δ<i>G</i>‡ = Δ<i>H</i>‡ − <i>T</i>Δ<i>S</i>‡ · vida media');
    sim.out('Ea', 'Energía de activación de Arrhenius <i>E</i><sub>a</sub> = Δ<i>H</i>‡ + <i>RT</i> · factor preexponencial <i>A</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = (T) => ((kB * T) / h) * Math.exp(p.dS / R) * Math.exp(-(p.dH * 1e3) / (R * T));
      EM.draw.clear(cv);
      const Ts = []; for (let T = 250; T <= 400; T += 5) Ts.push(T);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 1000 / 400, xmax: 1000 / 250, ymin: Math.min(...Ts.map((t) => Math.log(k(t) / t))) - 0.5, ymax: Math.max(...Ts.map((t) => Math.log(k(t) / t))) + 0.5, xlabel: '1000/T (K⁻¹)', ylabel: 'ln(k/T)', ml: 50, title: 'Gráfica de Eyring' });
      pl.frame(); pl.xy(Ts.map((t) => 1000 / t), Ts.map((t) => Math.log(k(t) / t)), { color: '--c1', width: 2.6 }); pl.dot(1000 / p.T, Math.log(k(p.T) / p.T), { color: '--accent' });
      const pl2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 160, ymin: -14, ymax: 14, xlabel: 'ΔG‡ (kJ/mol)', ylabel: 'log₁₀ k (s⁻¹)', ml: 44, mr: 8, title: 'k frente a ΔG‡ (298 K)' });
      pl2.frame(); pl2.fn((g) => Math.log10(((kB * 298.15) / h) * Math.exp(-(g * 1e3) / (R * 298.15))), { color: '--c3', width: 2.4 });
      const dG = p.dH - (p.T * p.dS) / 1e3; pl2.dot(dG, Math.log10(k(p.T)), { color: '--accent' });
      const kk = k(p.T), t12 = Math.LN2 / kk;
      const fmtT = (s) => (s < 1e-3 ? EM.sci(s, 2) + ' s' : s < 60 ? EM.fix(s, 3) + ' s' : s < 3600 ? EM.fix(s / 60, 2) + ' min' : s < 86400 ? EM.fix(s / 3600, 2) + ' h' : s < 3.156e7 ? EM.fix(s / 86400, 2) + ' días' : EM.sci(s / 3.156e7, 2) + ' años');
      sim.set('k', EM.sci(kk, 3) + ' s⁻¹');
      sim.set('G', EM.fix(dG, 1) + ' kJ/mol · t½ = ' + fmtT(t12));
      sim.set('Ea', EM.fix(p.dH + (R * p.T) / 1e3, 2) + ' kJ/mol · ' + EM.sci(((Math.E * kB * p.T) / h) * Math.exp(p.dS / R), 2) + ' s⁻¹');
    });
  });
})();
