/* Cap. 28 — Cosmología */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const Co = EM.fm.cos, K = EM.qm.K, c = ref.cos;
  const cases = [['flat0', Co.params(67.4, 0.315, false)], ['flat1', Co.params(67.4, 0.315, true)], ['open', { H0: 70, Om: 0.3, Or: 0, OL: 0.8, Ok: -0.1 }], ['eds', { H0: 70, Om: 1, Or: 0, OL: 0, Ok: 0 }]];
  for (const [k, p] of cases) { const r = c[k];
    chk(S, `Edad del universo (${r.name}) por integración de Friedmann frente a astropy.cosmology (Gyr)`, Co.age(p, 0), r.age, 2e-5);
    chk(S, `Edad en z = 1 (${r.name})`, Co.age(p, 1), r.age_z1, 2e-5);
    c.zs.forEach((z, i) => { chk(S, `Distancia de luminosidad D_L(z = ${z}) (${r.name}) frente a astropy.cosmology`, Co.DL(p, z), r.dl[i], 2e-6); chk(S, `Distancia comóvil D_C(z = ${z}) (${r.name})`, Co.Dc(p, z), r.dc[i], 2e-6); chk(S, `Distancia de diámetro angular D_A(z = ${z}) (${r.name})`, Co.DA(p, z), r.da[i], 2e-6); chk(S, `Módulo de distancia μ(z = ${z}) (${r.name}) = 5 log₁₀(D_L/10 pc)`, Co.mu(p, z), r.mu[i], 2e-6); chk(S, `Tiempo de retrospección (z = ${z}) (${r.name}) (Gyr)`, Co.lookback(p, z), r.lb[i], 2e-5); });
    if (k !== 'eds') chk(S, `Densidad crítica ρ_c = 3H₀²/8πG (${r.name}) frente a astropy (kg/m³)`, Co.rhoCrit(p.H0), r.rhoc, 1e-5); }
  chk(S, 'Densidad de radiación Ω_r = Ω_γ + Ω_ν (T = 2.7255 K, N_eff = 3.046, h = 0.674) frente a astropy', Co.omegaRad(0.674), c.Or, 1e-3);
  chk(L, 'Edad del universo (Planck 2018, ΛCDM plano): 13.80 Gyr; con H₀ = 67.4 y Ω_m = 0.315 resulta 13.79', Co.age(Co.params(67.4, 0.315, true), 0), 13.79, 1e-3);
  chk(L, 'Tiempo de Hubble 1/H₀ para H₀ = 67.4 km/s/Mpc: 14.51 Gyr; para 73.0, 13.40 Gyr (la «tensión de Hubble»)', Co.hubbleTime(Co.params(67.4, 0.315)), 14.51, 1e-3);
  chk(L, 'Densidad crítica con H₀ = 67.4: 8.53×10⁻²⁷ kg/m³ (≈ 5 átomos de hidrógeno por metro cúbico)', Co.rhoCrit(67.4), 8.533e-27, 1e-3);
  chk(L, 'Universo de Einstein–de Sitter: edad = 2/(3H₀) (para H₀ = 70: 9.31 Gyr)', Co.age(cases[3][1], 0), (2 / 3) * Co.hubbleTime(cases[3][1]), 1e-4);
  chk(L, 'Parámetro de desaceleración q₀ = Ω_m/2 − Ω_Λ = −0.53 (expansión acelerada)', Co.q0(Co.params(67.4, 0.315)), -0.5275, 1e-3);
  chk(L, 'Igualdad materia–radiación: 1 + z_eq = Ω_m/Ω_r ≈ 3420', Co.zEq(Co.params(67.4, 0.315, true)) + 1, 0.315 / c.Or, 1e-3);
  chk(L, 'Las supernovas Ia a z = 0.5 son más débiles que en un universo de materia: Δμ = μ(ΛCDM) − μ(Einstein–de Sitter) = +0.40 mag a z = 0.5 (Perlmutter, Riess, 1998)', Co.mu(Co.params(70, 0.3), 0.5) - Co.mu({ H0: 70, Om: 1, Or: 0, OL: 0, Ok: 0 }, 0.5), 0.3987, 2e-3);
  // Bessel y disco
  for (const q of ref.bessel) { const b = Co.bessel; chk(S, `Funciones de Bessel I₀(${q.x}) (aprox. polinómica de Abramowitz–Stegun) frente a scipy.special.i0`, b.I0(q.x), q.I0, 1e-6); chk(S, `I₁(${q.x}) frente a scipy.special.i1`, b.I1(q.x), q.I1, 1e-6); chk(S, `K₀(${q.x}) frente a scipy.special.k0`, b.K0(q.x), q.K0, 1e-6); chk(S, `K₁(${q.x}) frente a scipy.special.k1`, b.K1(q.x), q.K1, 1e-6); }
  for (const q of ref.disk) chk(S, `Velocidad circular de un disco exponencial de Freeman (M_d = 5×10¹⁰ M☉, R_d = 3 kpc) en R = ${q.R} kpc con Bessel de scipy`, Co.vDisk(q.R * 3.0856775814913673e19, q.Md, q.Rd), q.v, 2e-5);
  chk(L, 'Disco de Freeman: la velocidad circular máxima ocurre en R = 2.15 R_d', (() => { let best = 0, rb = 0; const Md = 5e10 * 1.98840987e30, Rd = 3 * 3.0856775814913673e19; for (let R = 1; R < 6 * Rd / 3.0856775814913673e19; R += 0.01) { const v = Co.vDisk(R * 3.0856775814913673e19, Md, Rd); if (v > best) { best = v; rb = R; } } return rb / 3; })(), 2.15, 5e-3);
  // CMB
  chk(L, 'Densidad numérica de fotones del CMB (T = 2.7255 K): 410.7 cm⁻³', Co.nPhoton(2.7255) * 1e-6, 410.7, 1e-3);
  chk(L, 'Densidad de energía de los fotones del CMB: 0.2606 eV/cm³', Co.rhoPhotonEnergy(2.7255) / K.e * 1e-6, 0.2606e6 * 0 + 0.2606, 1e-3);
  chk(L, 'Máximo de la emisión del CMB (en frecuencia): 58.79 GHz/K × 2.7255 K = 160.2 GHz', Co.wienPeakGHz(2.7255), 160.23, 1e-4);
  chk(S, 'Saha: temperatura a la que el hidrógeno está ionizado a la mitad (η = 6.1×10⁻¹⁰) por bisección frente a scipy.optimize.brentq', Co.TrecombHalf(6.1e-10), ref.saha.T50, 1e-6);
  for (const [T, x] of ref.saha.x) chk(S, `Saha: fracción ionizada a T = ${T} K frente a la solución con scipy.constants`, Co.saha(T, 6.1e-10), x, 1e-6);
  chk(L, 'Recombinación: x_e = ½ cerca de T = 3760 K (z ≈ 1380) en la aproximación de Saha; el valor real (con la dinámica del desacoplo) es la última dispersión en z = 1090, T = 2970 K', Co.TrecombHalf(6.1e-10), 3762, 2e-3);
  chk(S, 'Horizonte sonoro r_s(z* = 1089.9) con Ω_b h² = 0.02237 por integral en ln a frente a scipy.integrate.quad', Co.soundHorizon(Co.params(67.4, 0.315, true), 1089.9), ref.rs.rs, 2e-4);
  chk(L, 'Horizonte sonoro del Planck 2018 en la recombinación: r_* = 144.4 Mpc', Co.soundHorizon(Co.params(67.4, 0.315, true), 1089.9), 144.4, 2e-3);
  chk(S, 'Distancia comóvil a la última dispersión: 13.86 Gpc frente a astropy', Co.Dm(Co.params(67.4, 0.315, true), 1089.9), ref.rs.Dm, 1e-5);
  chk(L, 'Ángulo acústico θ* = r_*/D_M = 0.010405 rad = 0.596° (Planck 2018: 100θ* = 1.0411)', 100 * Co.acousticAngle(Co.params(67.4, 0.315, true), 1089.9, 0.02237), 1.0411, 1.5e-3);
  // era de radiación
  chk(L, 'Era de radiación: t = 0.738 s (MeV/kT)² con g* = 10.75 (T > m_e) y 1.32 s con g* = 3.36 (después de la aniquilación e⁺e⁻)', Co.radTime(1, 10.75), 0.738, 2e-3);
  chk(L, 'Era de radiación después de la aniquilación e⁺e⁻ (g* = 3.36): t = 1.32 s (MeV/kT)²', Co.radTime(1, 3.36), 1.32, 2e-3);
  chk(L, 'Congelación de n/p: con kT = 0.72 MeV, n/p = e^{−Δmc²/kT} con Δm = 1.2933 MeV → 1/6', Co.npEq(1.2933, 0.72), 1 / 6, 5e-2);
  chk(L, 'Fracción de helio: Y_p = 2(n/p)/(1 + n/p) con n/p = 1/7 → 0.25 (observado: 0.245 ± 0.003)', Co.heliumFraction(1 / 7), 0.25, 1e-12);
};
