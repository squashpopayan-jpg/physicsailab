/* Capítulo 22 — Gases cuánticos y radiación */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 22.1 Distribuciones */
  EM.defineSim('distribuciones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('x', { label: 'Valor de (ε − μ)/<i>k<sub>B</sub>T</i> para la lectura', min: -4, max: 6, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('fd', 'Fermi–Dirac', { hl: true });
    sim.out('be', 'Bose–Einstein');
    sim.out('mb', 'Maxwell–Boltzmann');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const fd = (x) => 1 / (Math.exp(x) + 1), be = (x) => (x > 0 ? 1 / Math.expm1(x) : NaN), mb = (x) => Math.exp(-x);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -4, xmax: 6, ymin: 0, ymax: 2.2, xlabel: '(ε − μ)/k_BT', ylabel: 'ocupación media n̄' });
      pl.frame();
      pl.fn(mb, { color: '--c6', width: 1.8, dash: [6, 4] });
      pl.fn(be, { color: '--c2', width: 2.4, from: 0.02 });
      pl.fn(fd, { color: '--c1', width: 2.4 });
      pl.hline(1, { color: '--ink-3', label: 'n̄ = 1 (límite de Pauli)' });
      pl.vline(p.x, { color: '--accent' });
      pl.legend([{ label: 'Fermi–Dirac', color: '--c1' }, { label: 'Bose–Einstein', color: '--c2' }, { label: 'Maxwell–Boltzmann', color: '--c6', dash: [6, 4] }], 'tr');
      sim.set('fd', EM.fix(fd(p.x), 5));
      sim.set('be', p.x > 0 ? EM.fix(be(p.x), 5) : 'no definida (ε ≤ μ)');
      sim.set('mb', EM.fix(mb(p.x), 5));
    });
  });

  /* 22.2 Gas de fotones */
  EM.defineSim('foton-gas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 10000, step: 0.0001, value: 2.7255, unit: 'K', log: true, fmt: (v) => (v < 10 ? v.toFixed(4) : v.toFixed(0)) });
    sim.out('nu', 'Máximo de <i>u<sub>ν</sub></i>', { hl: true });
    sim.out('u', 'Densidad de energía · presión');
    sim.out('n', 'Fotones por cm³ · energía media');
    sim.out('s', 'Entropía por unidad de volumen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T;
      EM.draw.clear(cv);
      const a = (4 * TH.sigma) / TH.c0, numax = (2.821439 * TH.kB * T) / TH.h;
      const unu = (nu) => ((8 * Math.PI * TH.h * nu * nu * nu) / Math.pow(TH.c0, 3)) / Math.expm1((TH.h * nu) / (TH.kB * T));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: numax / 30, xmax: numax * 8, xlog: true, ymin: 0, ymax: 1.15, xlabel: 'frecuencia ν (Hz)', ylabel: 'u_ν / u_ν(máximo)' });
      const u0 = unu(numax);
      pl.frame();
      pl.fn((nu) => unu(nu) / u0, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.1 });
      pl.fn((nu) => (8 * Math.PI * nu * nu * TH.kB * T) / Math.pow(TH.c0, 3) / u0, { color: '--c1', width: 1.4, dash: [5, 4] });
      pl.vline(numax, { color: '--c3', label: 'máximo' });
      pl.legend([{ label: 'Planck', color: '--accent' }, { label: 'Rayleigh–Jeans (clásico)', color: '--c1', dash: [5, 4] }], 'tr');
      const u = a * Math.pow(T, 4), n = 0.2436 * Math.pow((TH.kB * T) / (TH.hbar * TH.c0), 3);
      sim.set('nu', EM.si(numax, 'Hz') + ' (c/ν = ' + EM.si(TH.c0 / numax, 'm') + '; el máximo en longitud de onda está en ' + EM.si(TH.wienB / T, 'm') + ')');
      sim.set('u', EM.sci(u, 4) + ' J/m³ · ' + EM.sci(u / 3, 4) + ' Pa');
      sim.set('n', EM.sci(n / 1e6, 4) + ' · ' + EM.fix(u / n / (TH.kB * T), 3) + ' k_BT');
      sim.set('s', EM.sci((4 * u) / (3 * T), 4) + ' J/K·m³');
    });
  });

  /* 22.3 Electrones en un metal */
  const MET = { cu: ['Cobre', 8.47e28, 0.695], al: ['Aluminio', 18.1e28, 1.35], na: ['Sodio', 2.65e28, 1.38], ag: ['Plata', 5.86e28, 0.646], au: ['Oro', 5.9e28, 0.729] };
  EM.defineSim('fermi', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: Object.entries(MET).map(([k, v]) => [k, v[0]]), value: 'cu' });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 100000, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('ef', 'Energía y temperatura de Fermi', { hl: true });
    sim.out('w', 'Ancho térmico <i>k<sub>B</sub>T</i>/<i>E<sub>F</sub></i>');
    sim.out('g', 'γ electrones libres · medido (mJ/mol·K²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [, n, gm] = MET[p.m];
      EM.draw.clear(cv);
      const EF = TH.fermiE(n) / TH.eV, kT = (TH.kB * p.T) / TH.eV, TF = (EF * TH.eV) / TH.kB;
      /* potencial químico aproximado (Sommerfeld) para T ≪ T_F */
      const mu = p.T < 0.3 * TF ? EF * (1 - (Math.PI * Math.PI / 12) * Math.pow(p.T / TF, 2)) : EF * (1 - (Math.PI * Math.PI / 12) * 0.09);
      const fd = (e) => 1 / (Math.exp((e - mu) / kT) + 1);
      const emax = Math.max(EF * 1.5, mu + 8 * kT);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: emax, ymin: 0, ymax: 1.25, xlabel: 'energía ε (eV)', ylabel: 'n̄(ε) · g(ε)n̄(ε) relativa' });
      pl.frame();
      pl.fn((e) => (Math.sqrt(e / EF) * fd(e)), { color: '--c1', width: 0, fill: '--c1', fillAlpha: 0.2 });
      pl.fn(fd, { color: '--accent', width: 2.6 });
      pl.fn((e) => (e < EF ? 1 : 0), { color: '--ink-3', width: 1, dash: [4, 3] });
      pl.vline(EF, { label: 'E_F' });
      sim.set('ef', EM.fix(EF, 3) + ' eV · ' + EM.fix(TF, 0) + ' K');
      sim.set('w', EM.fix(kT / EF, 6) + (p.T > 0.3 * TF ? ' (el gas deja de ser degenerado; μ es aproximado)' : ''));
      sim.set('g', EM.fix(((Math.PI * Math.PI) / 2) * (TH.R / TF) * 1000, 3) + ' · ' + gm + ' (Kittel, tabla 6.3)');
    });
  });

  /* 22.4 Condensado de Bose–Einstein */
  EM.defineSim('bec', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('a', { label: 'Átomo', options: [['86.909', 'Rubidio-87'], ['22.99', 'Sodio-23'], ['6.015', 'Litio-6 (fermión: no condensa)'], ['4.0026', 'Helio-4']], value: '86.909' });
    sim.slider('n', { label: 'Densidad', min: 1e18, max: 1e21, step: 1e17, value: 2.5e19, unit: 'm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 2000, step: 1, value: 100, unit: 'nK', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('tc', 'Temperatura crítica', { hl: true });
    sim.out('f', 'Fracción condensada');
    sim.out('l', '<i>n</i>λ³ (≥ 2.612 para condensar)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, M = +p.a;
      EM.draw.clear(cv);
      const ferm = p.a === '6.015';
      const Tc = TH.becTc(M, p.n) * 1e9, f = !ferm && p.T < Tc ? 1 - Math.pow(p.T / Tc, 1.5) : 0;
      const lam = TH.h / Math.sqrt(2 * Math.PI * ((M * 1e-3) / TH.NA) * TH.kB * p.T * 1e-9);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 1.5, ymin: 0, ymax: 1.05, xlabel: 'T/T_c', ylabel: 'N₀/N' });
      pl.frame();
      if (!ferm) pl.fn((t) => (t < 1 ? 1 - Math.pow(t, 1.5) : 0), { color: '--accent', width: 2.6 });
      pl.dot(p.T / Tc, f, { color: '--c1', r: 6 });
      /* nube: térmica (gaussiana ancha) + condensado (pico central) */
      const cx = W * 0.78, cy = H * 0.5, R = Math.min(W * 0.2, H * 0.42);
      let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const g = () => { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const Nd = 900;
      for (let i = 0; i < Nd; i++) { const cond = i < Nd * f; const s = cond ? 0.08 : 0.38; ctx.fillStyle = EM.alpha(cond ? '--c2' : '--c1', cond ? 0.6 : 0.35); ctx.beginPath(); ctx.arc(cx + g() * s * R, cy + g() * s * R, 1.6, 0, 7); ctx.fill(); }
      EM.text(ctx, 'distribución de velocidades', cx, H - 8, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('tc', ferm ? 'el litio-6 es un fermión: no hay condensación de Bose' : EM.fix(Tc, 1) + ' nK');
      sim.set('f', EM.fix(100 * f, 1) + ' %');
      sim.set('l', EM.fix(p.n * lam * lam * lam, 3));
    });
  });

  /* 22.5 Debye y electrones */
  EM.defineSim('debye', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('th', { label: 'Temperatura de Debye Θ<sub>D</sub>', min: 90, max: 2300, step: 1, value: 343, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Coeficiente electrónico γ', min: 0, max: 3, step: 0.005, value: 0.695, unit: 'mJ/mol·K²', fmt: (v) => v.toFixed(3) });
    sim.seg('v', { label: 'Gráfica', options: [['c', 'C(T)'], ['ct', 'C/T contra T² (baja T)']], value: 'c' });
    sim.out('c3', 'Pendiente de la ley T³ (mJ/mol·K⁴)', { hl: true });
    sim.out('x', 'Temperatura de cruce electrones = fonones');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, R = TH.R;
      EM.draw.clear(cv);
      const b = (12 * Math.PI ** 4 * R) / (5 * Math.pow(p.th, 3)), g = p.g * 1e-3;
      if (p.v === 'c') {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.5 * p.th, ymin: 0, ymax: 28, xlabel: 'T (K)', ylabel: 'C_V (J/mol·K)' });
        pl.frame();
        pl.fn((T) => (T > 0 ? 3 * R * TH.debyeCv(T, p.th) : 0), { color: '--accent', width: 2.6 });
        pl.fn((T) => (T > 0 ? 3 * R * TH.einsteinCv(T, 0.806 * p.th) : 0), { color: '--c1', width: 1.6, dash: [6, 4] });
        pl.hline(3 * R, { label: 'Dulong–Petit 3R' });
        pl.legend([{ label: 'Debye', color: '--accent' }, { label: 'Einstein (Θ_E = 0.806 Θ_D)', color: '--c1', dash: [6, 4] }], 'br');
      } else {
        const Tm = Math.min(0.08 * p.th, 30);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Tm * Tm, ymin: 0, ymax: (g + b * Tm * Tm) * 1000 * 1.15, xlabel: 'T² (K²)', ylabel: 'C/T (mJ/mol·K²)' });
        pl.frame();
        pl.fn((T2) => { const T = Math.sqrt(T2); return T > 0 ? (1000 * (3 * R * TH.debyeCv(T, p.th) + g * T)) / T : g * 1000; }, { color: '--accent', width: 2.6 });
        pl.fn((T2) => 1000 * (g + b * T2), { color: '--c1', width: 1.4, dash: [5, 4] });
        pl.hline(p.g, { color: '--c3', label: 'γ' });
      }
      sim.set('c3', EM.fix(b * 1000, 5));
      sim.set('x', g > 0 ? EM.fix(Math.sqrt(g / b), 2) + ' K' : '—');
    });
  });
})();
