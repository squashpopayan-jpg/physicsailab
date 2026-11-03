/* Cap. 20 — Bandas, semiconductores, unión pn y celda solar */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const So = EM.fm.sol, K = EM.qm.K, kB = K.kB, e = K.e;
  // Kronig–Penney frente a ondas planas
  for (const P of [0.5, 2, 5]) { const b = So.kpBands(P, 4 * Math.PI), r = ref.kp[P.toFixed(1)];
    for (let i = 0; i < 4; i++) { chk(S, `Kronig–Penney (P = ${P}), banda ${i + 1}: borde inferior β = qa frente a la diagonalización por ondas planas (numpy.linalg.eigvalsh, 601 ondas)`, b[i][0], r[i][0], 2e-3); chk(S, `Kronig–Penney (P = ${P}), banda ${i + 1}: borde superior`, b[i][1], r[i][1], 2e-3); } }
  chk(L, 'Límite P → 0: electrón libre, la primera banda comienza en β = 0 y no hay brechas (las bandas se tocan en β = nπ)', So.kpBands(1e-6, 4 * Math.PI).length, 1, 0);
  chk(L, 'Los bordes superiores de las bandas de Kronig–Penney son β = nπ (el borde de la zona de Brillouin: sen β = 0 con |cos β| = 1)', So.kpBands(2, 4 * Math.PI)[0][1], Math.PI, 1e-6);
  chk(L, 'Brecha de la primera banda para P = 2: β ∈ (π, 4.058): anchura en energía (4.058² − π²)(ħ²/2ma²) ≈ 6.6 unidades', Math.pow(So.kpBands(2, 4 * Math.PI)[1][0], 2) - Math.PI ** 2, 6.600, 5e-3);
  chk(L, 'Enlace fuerte: ancho de banda 4t (E(0) = −2t, E(π/a) = +2t)', So.bohmBand(1, 1, Math.PI) - So.bohmBand(1, 1, 0), 4, 1e-12);
  { const t = 1.5 * e, a = 3e-10, dk = 1e7, Epp = (So.bohmBand(t, a, dk) + So.bohmBand(t, a, -dk) - 2 * So.bohmBand(t, a, 0)) / (dk * dk); chk(L, 'Enlace fuerte: masa efectiva m* = ħ²/(2ta²) coincide con ħ²/E″(0) calculada con diferencias finitas', K.hbar ** 2 / Epp, So.tbMass(t, a), 1e-5); }
  // semiconductores
  chk(L, 'Densidad efectiva de estados de la banda de conducción del silicio (m* = 1.08 m_e, 300 K): N_c = 2.8×10¹⁹ cm⁻³ (Sze)', So.Nc(1.08, 300) * 1e-6, 2.8e19, 1e-2);
  for (const q of ref.carr) { const c0 = So.carriers(q.ND, q.NA, q.ND + q.NA > 0 || true ? So.ni(q.Nc, q.Nv, 1.12, q.T) : 0);
    chk(S, `Densidad de electrones (N_D = ${q.ND}, N_A = ${q.NA}, T = ${q.T} K) por neutralidad de carga (Boltzmann) frente a la solución con integrales de Fermi–Dirac completas (scipy.quad + brentq)`, c0.n, q.n, 5e-3);
    chk(S, `Densidad de huecos (N_D = ${q.ND}, N_A = ${q.NA}, T = ${q.T} K)`, c0.p, q.p, 5e-3); }
  chk(L, 'Ley de acción de masas n·p = n_i² (silicio dopado con 10¹⁶ cm⁻³ de donadores, 300 K)', (() => { const ni = So.ni(So.Nc(1.08, 300), So.Nc(0.56, 300), 1.12, 300), c0 = So.carriers(1e22, 0, ni); return c0.n * c0.p / (ni * ni); })(), 1, 1e-9);
  chk(L, 'n_i del silicio a 300 K con N_c = 2.8×10¹⁹ y N_v = 1.04×10¹⁹ cm⁻³, E_g = 1.12 eV: del orden de 7×10⁹ cm⁻³ (el valor aceptado, 1.0×10¹⁰, depende de las masas de densidad de estados)', So.ni(So.Nc(1.08, 300), So.Nc(0.56, 300), 1.12, 300) * 1e-6, 7.0e9, 0.1);
  chk(L, 'Dependencia de n_i con T: d ln(n_i/T^{3/2})/d(1/T) = −E_g/2k (silicio, 1.12 eV, entre 300 y 400 K)', (Math.log(So.ni(So.Nc(1.08, 400), So.Nc(0.56, 400), 1.12, 400) / Math.pow(400, 1.5)) - Math.log(So.ni(So.Nc(1.08, 300), So.Nc(0.56, 300), 1.12, 300) / Math.pow(300, 1.5))) / (1 / 400 - 1 / 300), -1.12 * e / (2 * kB), 1e-9);
  chk(L, 'Varshni para el silicio (E_g0 = 1.17 eV, α = 4.73×10⁻⁴ eV/K, β = 636 K): E_g(300 K) = 1.12 eV', So.varshni(1.17, 4.73e-4, 636, 300), 1.1245, 1e-3);
  // unión pn
  for (const q of ref.pn) { const Vbi = So.Vbi(q.NA, q.ND, q.ni, 300), W = So.width(q.NA, q.ND, q.epsr, Vbi), xn = So.xn(q.NA, q.ND, W);
    chk(S, `Unión pn (N_A = ${q.NA}, N_D = ${q.ND} m⁻³): potencial de contacto V_bi = (kT/e) ln(N_AN_D/n_i²) frente a la solución numérica de la ecuación de Poisson–Boltzmann (scipy.integrate.solve_bvp)`, Vbi, q.Vbi, 1e-6);
    chk(S, `Unión pn (N_A = ${q.NA}, N_D = ${q.ND} m⁻³): campo máximo e N_D x_n/ε de la aproximación de vaciamiento frente al máximo de la solución numérica completa (no lineal)${q.NA / q.ND >= 99 ? ' — unión p⁺n 100 : 1, donde el lado muy dopado (≈ 10 nm) es del orden de la longitud de Debye y la aproximación subestima el campo un 24 %' : ''}`, So.Emax(q.ND, xn, q.epsr), q.Emax, q.NA / q.ND >= 99 ? 0.26 : 0.06); }
  chk(L, 'Silicio simétrico con 10¹⁶ cm⁻³ a cada lado (n_i = 10¹⁶ m⁻³): V_bi = 0.714 V, W = 0.43 µm en equilibrio', So.width(1e22, 1e22, 11.7, So.Vbi(1e22, 1e22, 1e16, 300)) * 1e6, 0.4298, 1e-3);
  chk(L, 'Condensador de vaciamiento por unidad de área C = ε/W y su variación con la polarización inversa: C ∝ (V_bi − V)^{−1/2}', So.Cj(11.7, So.width(1e22, 1e22, 11.7, 0.714, -4)) / So.Cj(11.7, So.width(1e22, 1e22, 11.7, 0.714, 0)), Math.sqrt(0.714 / (0.714 + 4)), 1e-9);
  for (const q of ref.diode) { const Lp = q.Lp, J = q.p0 * q.D / Lp * Math.expm1(q.V / So.Vt(300)); chk(S, `Diodo de base larga: flujo de minoritarios p₀(D/L)(e^{V/V_t} − 1) para V = ${q.V} V frente a la solución numérica de la ecuación de difusión (solve_bvp)`, J, q.flux, 1e-5); }
  chk(L, 'Shockley: la corriente crece un factor 10 cada 2.303 V_t = 59.5 mV a 300 K', Math.log(10) * So.Vt(300) * 1e3, 59.5, 2e-3);
  // celda solar
  for (const q of ref.sq) { chk(S, `Eficiencia última de una celda con E_g = ${q.Eg} eV y un Sol de cuerpo negro a ${q.Ts} K frente a scipy.integrate.quad`, So.ultimate(q.Eg, q.Ts), q.ult, 1e-6);
    const r = So.cellEff(q.Eg, q.Ts); chk(S, `Límite de balance detallado (Shockley–Queisser, E_g = ${q.Eg} eV, ${q.Ts} K) frente a quad + minimize_scalar`, r.eta, q.eta, 3e-3); }
  chk(L, 'Shockley y Queisser (1961): para E_g = 1.1 eV y un cuerpo negro a 6000 K el límite es 30 % y la eficiencia última 44 %', So.cellEff(1.1, 6000).eta, 0.30, 5e-3);
  chk(L, 'Eficiencia última a 1.1 eV y 6000 K: 43.9 % (Shockley y Queisser: 44 %)', So.ultimate(1.1, 6000), 0.44, 5e-3);
};
