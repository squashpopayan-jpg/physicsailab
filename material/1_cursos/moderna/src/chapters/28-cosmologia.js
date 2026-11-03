/* Capítulo 28 — Cosmología */
(function () {
  'use strict';
  const EM = window.EM, Co = EM.fm.cos, K = EM.qm.K, c = 299792458, kpc = 3.0856775814913673e19, Ms = 1.98840987e30;

  /* 28.1 Friedmann: factor de escala y diagrama de Hubble */
  EM.defineSim('friedmann', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('H0', { label: 'Constante de Hubble H₀', min: 60, max: 80, step: 0.1, value: 67.4, unit: 'km/s/Mpc', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Om', { label: 'Densidad de materia Ω_m (Ω_Λ = 1 − Ω_m, universo plano)', min: 0.05, max: 1, step: 0.005, value: 0.315, fmt: (v) => EM.fix(v, 3) });
    sim.out('t', 'Edad del universo · tiempo de Hubble 1/H₀ · densidad crítica', { hl: true });
    sim.out('q', 'Parámetro de desaceleración q₀ = Ω_m/2 − Ω_Λ · el universo ¿se acelera?');
    sim.out('d', 'En z = 1: D_L (Mpc) · módulo de distancia μ · edad del universo (Gyr)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, P = Co.params(p.H0, p.Om, true), EdS = { H0: p.H0, Om: 1, Or: 0, OL: 0, Ok: 0 };
      EM.draw.clear(cv);
      const as = [], tt = [], tE = []; for (let a = 0.02; a <= 3; a += 0.02) { as.push(a); tt.push(Co.age(P, 1 / a - 1)); tE.push(Co.age(EdS, 1 / a - 1)); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -15, xmax: 40, ymin: 0, ymax: 4, xlabel: 'tiempo t − t₀ (Gyr)', ylabel: 'factor de escala a(t)', ml: 52, mr: 8, title: 'Historia de la expansión' });
      const t0 = Co.age(P, 0), t0E = Co.age(EdS, 0); pl.frame(); pl.xy(tt.map((v) => v - t0), as, { color: '--accent', width: 3 }); pl.xy(tE.map((v) => v - t0E), as, { color: '--ink-3', width: 1.6, dash: [4, 3] }); pl.hline(1, { color: '--ink-3', dash: [2, 4] }); pl.vline(0, { color: '--ink-3', dash: [2, 4], label: 'hoy' });
      pl.legend([{ label: 'ΛCDM (con radiación)', color: '--accent' }, { label: 'sólo materia (EdS)', color: '--ink-3' }], 'tl');
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.01, xmax: 2, xlog: true, ymin: 33, ymax: 47, xlabel: 'corrimiento al rojo z', ylabel: 'módulo de distancia μ', ml: 52, mr: 8, title: 'Diagrama de Hubble de supernovas Ia' });
      pr.frame(); pr.fn((z) => Co.mu(P, z), { color: '--accent', width: 3, n: 100 }); pr.fn((z) => Co.mu(EdS, z), { color: '--ink-3', width: 1.6, dash: [4, 3], n: 100 }); pr.fn((z) => Co.mu({ H0: p.H0, Om: 0, Or: 0, OL: 0, Ok: 1 }, z), { color: '--c3', width: 1.4, dash: [2, 3], n: 100 });
      pr.legend([{ label: `Ω_m = ${EM.fix(p.Om, 2)}`, color: '--accent' }, { label: 'EdS', color: '--ink-3' }, { label: 'vacío', color: '--c3' }], 'br');
      sim.set('t', `${EM.fix(t0, 3)} Gyr · ${EM.fix(Co.hubbleTime(P), 3)} Gyr · ${EM.sci(Co.rhoCrit(p.H0), 3)} kg/m³`);
      sim.set('q', `${EM.fix(Co.q0(P), 3)} · ${Co.q0(P) < 0 ? 'sí: la constante cosmológica domina' : 'no'}`);
      sim.set('d', `${EM.fix(Co.DL(P, 1), 1)} · ${EM.fix(Co.mu(P, 1), 3)} · ${EM.fix(Co.age(P, 1), 3)}`);
    });
  });

  /* 28.2 Fondo cósmico de microondas y recombinación */
  EM.defineSim('fondo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura del fondo T₀', min: 2.7, max: 2.75, step: 0.0005, value: 2.7255, unit: 'K', fmt: (v) => EM.fix(v, 4) });
    sim.slider('eta', { label: 'Razón bariones/fotones η = n_b/n_γ', min: 1, max: 20, step: 0.1, value: 6.1, unit: '×10⁻¹⁰', fmt: (v) => EM.fix(v, 1) });
    sim.out('n', 'Densidad numérica de fotones n_γ (cm⁻³) · energía por fotón ⟨E⟩ = 2.70 kT (eV) · pico en frecuencia (GHz)', { hl: true });
    sim.out('r', 'Saha: T a la que el hidrógeno está ionizado a la mitad (K) · corrimiento al rojo 1 + z = T/T₀');
    sim.out('a', 'Horizonte sonoro r_s (Mpc) · distancia comóvil a la recombinación D_M (Mpc) · ángulo θ* (°)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T, eta = p.eta * 1e-10, h = 6.62607015e-34, kB = 1.380649e-23;
      EM.draw.clear(cv);
      const Bn = (nu) => (2 * h * nu ** 3 / (c * c)) / Math.expm1((h * nu) / (kB * T)), nus = [], Is = []; for (let i = 1; i <= 300; i++) { const nu = i * 1e9; nus.push(nu / 1e9); Is.push(Bn(nu) * 1e20); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 300, ymin: 0, ymax: Math.max(...Is) * 1.1, xlabel: 'frecuencia ν (GHz)', ylabel: 'I_ν (MJy/sr)', ml: 56, mr: 8, title: 'Espectro del CMB: el cuerpo negro más perfecto' });
      pl.frame(); pl.xy(nus, Is, { color: '--accent', width: 3, fill: '--accent', fillAlpha: 0.13 });
      const Ts = [], xe = []; for (let z = 400; z <= 2200; z += 10) { Ts.push(z); xe.push(Co.saha(T * (1 + z), eta)); }
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 400, xmax: 2200, ymin: 0, ymax: 1.05, xlabel: 'corrimiento al rojo z', ylabel: 'fracción ionizada x_e (Saha)', ml: 52, mr: 8, title: 'Recombinación del hidrógeno' });
      pr.frame(); pr.xy(Ts, xe, { color: '--c2', width: 3 }); pr.vline(1089.9, { color: '--c3', dash: [4, 3], label: 'última dispersión (z = 1090)' });
      const T50 = Co.TrecombHalf(eta), P = Co.params(67.4, 0.315, true), rs = Co.soundHorizon(P, 1089.9, 0.02237), Dm = Co.Dm(P, 1089.9);
      sim.set('n', `${EM.fix(Co.nPhoton(T) * 1e-6, 1)} · ${EM.sci(2.701 * kB * T / 1.602176634e-19, 3)} eV · ${EM.fix(Co.wienPeakGHz(T), 1)}`);
      sim.set('r', `${EM.fix(T50, 0)} K · 1 + z = ${EM.fix(T50 / T, 0)}`);
      sim.set('a', `${EM.fix(rs, 2)} · ${EM.fix(Dm, 0)} · ${EM.fix(100 * rs / Dm * 180 / Math.PI / 100, 4)}°`);
    });
  });

  /* 28.3 Curvas de rotación y materia oscura */
  EM.defineSim('galaxias', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Md', { label: 'Masa del disco estelar M_d', min: 1, max: 15, step: 0.1, value: 5, unit: '×10¹⁰ M☉', fmt: (v) => EM.fix(v, 1) });
    sim.slider('Rd', { label: 'Longitud de escala del disco R_d', min: 1.5, max: 5, step: 0.05, value: 3, unit: 'kpc', fmt: (v) => EM.fix(v, 2) });
    sim.slider('rhos', { label: 'Densidad del halo de materia oscura ρ_s (NFW, r_s = 15 kpc)', min: 0, max: 5, step: 0.05, value: 1.5, unit: '×10⁷ M☉/kpc³', fmt: (v) => EM.fix(v, 2) });
    sim.out('v', 'Velocidad circular a 8 kpc (disco solo · halo solo · total) (km/s)', { hl: true });
    sim.out('m', 'Masa total dentro de 30 kpc: v²R/G (10¹¹ M☉) · parte oscura');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Md = p.Md * 1e10 * Ms, Rd = p.Rd * kpc, rhos = p.rhos * 1e7 * Ms / kpc ** 3, rs = 15 * kpc;
      EM.draw.clear(cv);
      const Rs = [], vd = [], vh = [], vt = [], vk = []; for (let R = 0.5; R <= 40; R += 0.5) { const r = R * kpc, d = Co.vDisk(r, Md, Rd), hh = p.rhos > 0 ? Co.vNFW(r, rhos, rs) : 0; Rs.push(R); vd.push(d / 1e3); vh.push(hh / 1e3); vt.push(Math.hypot(d, hh) / 1e3); vk.push(Co.vKepler(r, Md) / 1e3); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 40, ymin: 0, ymax: 300, xlabel: 'radio R (kpc)', ylabel: 'velocidad circular (km/s)', ml: 56, mr: 10, title: 'Curva de rotación: disco estelar + halo de materia oscura' });
      pl.frame(); pl.xy(Rs, vd, { color: '--c1', width: 2.4 }); pl.xy(Rs, vh, { color: '--c3', width: 2.4 }); pl.xy(Rs, vt, { color: '--accent', width: 3.4 }); pl.xy(Rs, vk, { color: '--ink-3', width: 1.4, dash: [4, 3] });
      pl.legend([{ label: 'disco', color: '--c1' }, { label: 'halo NFW', color: '--c3' }, { label: 'total', color: '--accent' }, { label: 'sólo masa visible (Kepler)', color: '--ink-3' }], 'br');
      const r8 = 8 * kpc, d8 = Co.vDisk(r8, Md, Rd), h8 = p.rhos > 0 ? Co.vNFW(r8, rhos, rs) : 0, t8 = Math.hypot(d8, h8), r30 = 30 * kpc, tt = Math.hypot(Co.vDisk(r30, Md, Rd), p.rhos > 0 ? Co.vNFW(r30, rhos, rs) : 0), Mtot = tt * tt * r30 / Co.G / Ms;
      sim.set('v', `${EM.fix(d8 / 1e3, 1)} · ${EM.fix(h8 / 1e3, 1)} · ${EM.fix(t8 / 1e3, 1)} km/s (Vía Láctea: ≈ 230)`);
      const Mvis = Md / Ms; sim.set('m', `${EM.fix(Mtot / 1e11, 2)} · ${EM.fix(100 * (1 - Mvis / Mtot), 0)} % no visible (M_d = ${EM.fix(Mvis / 1e11, 2)}×10¹¹)`);
    });
  });
})();
