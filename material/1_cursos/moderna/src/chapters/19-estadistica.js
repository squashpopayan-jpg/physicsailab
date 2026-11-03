/* Capítulo 19 — Estadística cuántica y calores específicos */
(function () {
  'use strict';
  const EM = window.EM, St = EM.fm.st, K = EM.qm.K, kB = K.kB, e = K.e;

  /* 19.1 Las tres distribuciones */
  EM.defineSim('distribuciones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura relativa T/T_F del gas de fermiones', min: 0.005, max: 1, step: 0.001, value: 0.05, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.check('mb', { label: 'Mostrar Maxwell–Boltzmann', value: true });
    sim.out('w', 'Anchura de la transición de Fermi ≈ 4kT (en unidades de E_F) · potencial químico', { hl: true });
    sim.out('f', 'Fracción de electrones con energía mayor que E_F (integral exacta)');
    sim.out('b', 'Bose–Einstein: ocupación de ε = μ + kT · divergencia cuando ε → μ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -5, xmax: 5, ymin: 0, ymax: 2.2, xlabel: '(ε − μ)/kT', ylabel: 'ocupación media ⟨n⟩', ml: 56, mr: 8, title: 'Tres estadísticas' });
      pl.frame(); pl.fn((x) => St.fd(x), { color: '--c1', width: 2.8, n: 300 });
      pl.fn((x) => (x > 0.12 ? Math.min(St.be(x), 2.3) : NaN), { color: '--c3', width: 2.8, n: 300 });
      if (p.mb) pl.fn((x) => Math.min(St.mb(x), 2.3), { color: '--ink-3', width: 2, n: 300, dash: [5, 3] });
      pl.legend([{ label: 'Fermi–Dirac', color: '--c1' }, { label: 'Bose–Einstein', color: '--c3' }, { label: 'Maxwell–Boltzmann', color: '--ink-3' }], 'tr');
      // FD de electrones libres con T/T_F
      const t = p.T, mu = (() => { const EF = 1, kT = t; let a = 0, b = 1.5; const f = (m) => { let s = 0; const N = 4000, em = 3; for (let i = 1; i <= N; i++) { const x = em * i / N; s += Math.sqrt(x) / (Math.exp(Math.min((x - m) / kT, 700)) + 1); } return s * em / N - (2 / 3) * Math.pow(EF, 1.5); }; for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b); if (f(m) > 0) b = m; else a = m; } return 0.5 * (a + b); })();
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 2, ymin: 0, ymax: 1.1, xlabel: 'ε/E_F', ylabel: 'f(ε)', ml: 56, mr: 8, title: 'Electrones libres a T/T_F elegida' });
      pr.frame(); pr.fn((x) => (x <= 1 ? 1 : 0), { color: '--ink-3', width: 1.6, dash: [4, 3], n: 400 }); pr.fn((x) => 1 / (Math.exp(Math.min((x - mu) / t, 700)) + 1), { color: '--accent', width: 3, n: 400 });
      pr.vline(1, { color: '--ink-3', dash: [2, 4], label: 'E_F' });
      // fracción excitada: ∫_1^∞ √x f dx / ∫ √x f dx
      let tot = 0, ex = 0; const N = 6000, em = 6; for (let i = 1; i <= N; i++) { const x = em * i / N, v = Math.sqrt(x) / (Math.exp(Math.min((x - mu) / t, 700)) + 1); tot += v; if (x > 1) ex += v; }
      sim.set('w', `${EM.fix(4 * t, 3)} E_F · μ = ${EM.fix(mu, 4)} E_F`);
      sim.set('f', `${EM.fix(100 * ex / tot, 3)} % de los electrones tiene ε > E_F`);
      sim.set('b', `${EM.fix(St.be(1), 4)} (frente a e⁻¹ = ${EM.fix(St.mb(1), 4)})`);
    });
  });

  /* 19.2 Gas de electrones libres en metales */
  const METAL = { Li: ['Litio', 4.70e28, 1, 0.749, 1.63], Na: ['Sodio', 2.65e28, 1, 1.094, 1.38], K: ['Potasio', 1.40e28, 1, 1.668, 2.08], Cu: ['Cobre', 8.47e28, 1, 0.505, 0.695], Ag: ['Plata', 5.86e28, 1, 0.645, 0.646], Au: ['Oro', 5.90e28, 1, 0.642, 0.729], Al: ['Aluminio', 18.1e28, 3, 0.912, 1.35] };
  EM.defineSim('fermi', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Metal (densidad electrónica de Kittel)', options: Object.entries(METAL).map(([k, v]) => [k, `${v[0]} (${v[2]} e⁻/átomo, n = ${v[1].toExponential(2)} m⁻³)`]), value: 'Cu' });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 30000, step: 1, value: 300, log: true, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('EF', 'Energía de Fermi · temperatura de Fermi · velocidad de Fermi', { hl: true });
    sim.out('mu', 'Potencial químico μ(T) (exacto) · desviación respecto de E_F');
    sim.out('g', 'γ de electrones libres (mJ mol⁻¹K⁻²) · γ medido · m*/m = γ_exp/γ_libre');
    sim.out('C', 'C_el/(3R/2) por electrón = (π²/3)·T/T_F (válido para T ≪ T_F)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, n, z, gfree, gexp] = METAL[p.m], EF = St.fermiEnergy(n), mu = St.mu(n, p.T), kT = kB * p.T;
      EM.draw.clear(cv);
      const emax = EF / e * 1.7, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: emax, ymin: 0, ymax: 1.15, xlabel: 'energía ε (eV)', ylabel: 'g(ε) f(ε) (normalizado a g(E_F))', ml: 56, mr: 8, title: 'Estados ocupados del gas de electrones' });
      pl.frame(); const gF = St.dos(EF);
      pl.fn((x) => St.dos(x * e) / gF, { color: '--ink-3', width: 1.8, n: 200, dash: [4, 3] });
      pl.fn((x) => (St.dos(x * e) / gF) * St.fd((x * e - mu) / kT), { color: '--accent', width: 3, n: 300 });
      pl.vline(EF / e, { color: '--c3', dash: [3, 3], label: 'E_F' });
      const pr = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 1, xmax: 30000, xlog: true, ymin: 0, ymax: 1.7, xlabel: 'T (K)', ylabel: 'C_el/(3R/2) por electrón', ml: 50, mr: 8, title: 'Calor específico electrónico' });
      pr.frame(); pr.fn((T) => Math.min((Math.PI * Math.PI / 3) * T / St.fermiT(n), 1.6), { color: '--c2', width: 2.6, n: 200 }); pr.hline(1, { color: '--ink-3', dash: [4, 3], label: 'clásico' }); pr.vline(p.T, { color: '--accent', dash: [] });
      sim.set('EF', `${EM.fix(EF / e, 3)} eV · ${EM.sci(St.fermiT(n), 3)} K · ${EM.sci(St.fermiV(n), 3)} m/s`);
      sim.set('mu', `${EM.fix(mu / e, 5)} eV · ${EM.sci((mu - EF) / EF, 2)} (relativa)`);
      sim.set('g', `${EM.fix(St.gammaFree(n, z) * 1e3, 3)} · ${gexp} · ${EM.fix(gexp / (St.gammaFree(n, z) * 1e3), 2)}`);
      sim.set('C', `${EM.fix((Math.PI * Math.PI / 3) * p.T / St.fermiT(n), 4)}`);
    });
  });

  /* 19.3 Calor específico de la red */
  const SOL = { Cu: ['Cobre', 343, 'Cu'], Ag: ['Plata', 225], Au: ['Oro', 165], Al: ['Aluminio', 428], Pb: ['Plomo', 105], Si: ['Silicio', 645], C: ['Diamante (θ_D ≈ 2230 K)', 2230] };
  EM.defineSim('calorico', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('s', { label: 'Sólido (temperatura de Debye de Kittel)', options: Object.entries(SOL).map(([k, v]) => [k, `${v[0]} — θ_D = ${v[1]} K`]), value: 'Cu' });
    sim.slider('T', { label: 'Temperatura', min: 2, max: 1000, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.seg('sc', { label: 'Escala', options: [['lin', 'Lineal'], ['log', 'Logarítmica']], value: 'lin' });
    sim.out('D', 'C_V de Debye · de Einstein (θ_E = 0.75 θ_D) · de Dulong–Petit (J mol⁻¹K⁻¹)', { hl: true });
    sim.out('r', 'T/θ_D · fracción del valor clásico C_Debye/3R');
    sim.out('t3', 'Ley T³ (12π⁴/5)R(T/θ_D)³ · diferencia con la integral completa');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = SOL[p.s][1], thE = 0.75 * th, lg = p.sc === 'log';
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: lg ? 1 : 0, xmax: lg ? 1000 : 1000, xlog: lg, ymin: lg ? 1e-4 : 0, ymax: lg ? 40 : 28, ylog: lg, xlabel: 'T (K)', ylabel: 'C_V (J mol⁻¹ K⁻¹)', ml: 60, mr: 10, title: 'Modelos de calor específico de la red' });
      pl.frame(); pl.hline(St.dulongPetit, { color: '--ink-3', dash: [4, 3], label: '3R (Dulong–Petit)' });
      pl.fn((T) => St.debye(Math.max(T, 0.5), th, 600), { color: '--accent', width: 3, n: 240 }); pl.fn((T) => St.einstein(Math.max(T, 0.5), thE), { color: '--c2', width: 2.4, n: 240 });
      if (lg) pl.fn((T) => St.debyeT3(T, th), { color: '--c2', width: 1.8, dash: [3, 3], n: 120 });
      pl.vline(th, { color: '--ink-3', dash: [2, 4], label: 'θ_D' }); pl.dot(p.T, Math.max(St.debye(p.T, th, 600), 1e-4), { color: '--accent', r: 6 });
      pl.legend([{ label: 'Debye', color: '--accent' }, { label: 'Einstein', color: '--c2' }].concat(lg ? [{ label: 'T³', color: '--c2' }] : []), 'br');
      const D = St.debye(p.T, th, 800);
      sim.set('D', `${EM.fix(D, 3)} · ${EM.fix(St.einstein(p.T, thE), 3)} · ${EM.fix(St.dulongPetit, 3)}`);
      sim.set('r', `${EM.fix(p.T / th, 3)} · ${EM.fix(D / St.dulongPetit, 4)}`);
      sim.set('t3', p.T < th / 10 ? `${EM.sci(St.debyeT3(p.T, th), 3)} · ${EM.fix((St.debyeT3(p.T, th) / D - 1) * 100, 2)} %` : `${EM.sci(St.debyeT3(p.T, th), 3)} · fuera de su rango de validez (T < θ_D/10)`);
    });
  });
})();
