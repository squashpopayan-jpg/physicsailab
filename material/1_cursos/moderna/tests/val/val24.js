/* Cap. 24 — Reacciones nucleares, fisión y fusión */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const R = EM.fm.rx, N = EM.fm.nuc, K = EM.qm.K;
  const rxn = [['D + T → ⁴He + n', [[1, 2], [1, 3]], [[2, 4], 'n'], 17.589, 1e-3], ['D + D → T + p', [[1, 2], [1, 2]], [[1, 3], [1, 1]], 4.033, 2e-3], ['D + D → ³He + n', [[1, 2], [1, 2]], [[2, 3], 'n'], 3.269, 2e-3], ['D + ³He → ⁴He + p', [[1, 2], [2, 3]], [[2, 4], [1, 1]], 18.354, 1e-3], ['p + ⁷Li → 2 ⁴He', [[1, 1], [3, 7]], [[2, 4], [2, 4]], 17.346, 1e-3],
    ['⁴He + ⁹Be → n + ¹²C (fuente de Chadwick)', [[2, 4], [4, 9]], ['n', [6, 12]], 5.702, 1e-3], ['⁴He + ¹⁴N → p + ¹⁷O (Rutherford)', [[2, 4], [7, 14]], [[1, 1], [8, 17]], -1.192, 2e-3], ['4 ¹H → ⁴He (cadena protón–protón, masas atómicas)', [[1, 1], [1, 1], [1, 1], [1, 1]], [[2, 4]], 26.731, 1e-3]];
  for (const [nm, a, b, Q, tol] of rxn) chk(L, `Valor Q de ${nm} a partir de masas atómicas frente al valor publicado ${Q} MeV`, R.Q(a, b), Q, tol);
  chk(L, 'Umbral de ⁴He + ¹⁴N → p + ¹⁷O: T_th = −Q(m_α + m_N)/m_N = 1.53 MeV (laboratorio)', R.threshold(R.Q([[2, 4], [7, 14]], [[1, 1], [8, 17]]), 4.0026, 14.0031), 1.533, 3e-3);
  // cinemática
  ref.kin.forEach((q, i) => { const r = R.twoBody(q.m1, q.m2, q.E); chk(S, `Cinemática relativista de dos cuerpos (caso ${i + 1}): energía cinética de la partícula 1 frente a la solución numérica de la conservación de energía y momento (scipy.optimize.fsolve)`, r.T1, q.T[0], 1e-9); chk(S, `Cinemática de dos cuerpos (caso ${i + 1}): energía cinética de la partícula 2`, r.T2, q.T[1], 1e-9); });
  chk(L, 'D + T en reposo: el neutrón se lleva 14.03 MeV y la partícula α 3.56 MeV (cociente inverso de las masas)', R.twoBody(939.56542052, 3727.3794066, 939.56542052 + 3727.3794066 + 17.589).T1, 14.03, 2e-3);
  // Gamow
  const mu = { pp: [938.272, 938.272], DT: [1875.613, 2808.921], DD: [1875.613, 1875.613], pB11: [938.272, 10252.55] }, Zs = { pp: [1, 1], DT: [1, 1], DD: [1, 1], pB11: [1, 5] };
  for (const q of ref.gamowfus) { const m = R.reducedMass(...mu[q.name]), EG = R.EG(...Zs[q.name], m), E0 = R.gamowPeak(EG, q.kT);
    chk(S, `Energía de Gamow (${q.name}) frente a la fórmula con scipy.constants`, EG, q.EG, 5e-4);
    chk(S, `Pico de Gamow (${q.name}, kT = ${q.kT * 1e3} keV): E₀ = (E_G(kT)²/4)^{1/3} frente a la maximización numérica del integrando e^{−E/kT − √(E_G/E)} (scipy.optimize.minimize_scalar)`, E0, q.E0, 5e-4);
    chk(S, `Ancho del pico de Gamow (${q.name}): Δ = 4√(E₀kT/3) frente al de la curvatura numérica del integrando en el máximo, con Δ = 2√2 σ...`, R.gamowWidth(E0, q.kT), 2 * Math.SQRT2 * q.sig, 0.02); }
  chk(L, 'Núcleo del Sol (T = 1.5×10⁷ K, kT = 1.29 keV): pico de Gamow de p + p en 5.9 keV, 14 veces la energía térmica kT... y mucho menor que la barrera de Coulomb (≈ 0.5 MeV)', R.gamowPeak(R.EG(1, 1, R.reducedMass(938.272, 938.272)), 1.29e-3) * 1e3, 5.9, 5e-3);
  chk(L, 'Energía de Gamow D–T: E_G = 1.18 MeV, (34.4 keV^{1/2})² (B_G = 34.38 keV^{1/2})', R.EG(1, 1, R.reducedMass(1875.613, 2808.921)) * 1e3, 1182, 2e-3);
  // energética
  chk(L, 'Energía por kilogramo de D–T: 17.589 MeV por 5.030 u = 3.37×10¹⁴ J/kg', 17.589 * 1.602176634e-13 / (5.0301 * 1.66053907e-27), 3.37e14, 3e-3);
  chk(L, 'Energía por kilogramo de ²³⁵U (200 MeV por fisión): 8.2×10¹³ J/kg', 200 * 1.602176634e-13 / (235.0439 * 1.66053907e-27), 8.2e13, 5e-3);
  chk(L, 'Sol: L = 3.828×10²⁶ W con 26.2 MeV por reacción (26.73 MeV menos 0.26 MeV de neutrinos ×2): 9.1×10³⁷ ciclos por segundo, 6.1×10¹¹ kg de H por segundo', R.sunBurnRate(3.828e26, 26.731 - 0.52) * 4 * 1.007276 * 1.66053907e-27, 6.1e11, 2e-2);
  // fisión
  { const c = N.fit(N.nuclides(true), 20);
    chk(L, 'Fisionabilidad x = E_C/2E_S de la gota para ²³⁵U (Z = 92): ≈ 0.70 (valor crítico 1: Z²/A = 2a_S/a_C ≈ 50.7)', R.fissility(92, 236, c), 0.70, 3e-2);
    chk(L, 'Z²/A crítico de la gota con los coeficientes del ajuste: 2a_S/a_C = 50.7 (valor habitual 49–50)', 2 * c[1] / c[2], 50.7, 5e-3);
    chk(L, 'Energía de una fisión ²³⁶U* → ¹⁴⁰Xe + ⁹⁶Sr (sin neutrones) con la fórmula de masas: 170–230 MeV (valor medido: ≈ 200 MeV por fisión, de ellos ≈ 168 MeV cinética de los fragmentos)', R.fissionQsemf(54, 140, 38, 96, 92, 236, c), 200, 0.2); }
  // cadena
  for (const q of ref.ext) chk(S, `Probabilidad de extinción de una cadena con k = ${q.k} (descendencia de Poisson): solución de q = e^{k(q − 1)} frente a scipy.optimize.brentq`, R.extinction(q.k), q.q, 1e-9);
  for (const q of ref.ext_mc) { const runs = 4000; let ext = 0; for (let r = 0; r < runs; r++) { const t = R.chainMC(q.k, 50, 1, 500 + r); if (t.some((x) => x === 0)) ext++; } chk(S, `Probabilidad de extinción simulada (Monte Carlo, ${runs} cadenas, k = ${q.k}) frente al Monte Carlo independiente de NumPy (20 000 cadenas) y la solución exacta`, ext / runs, R.extinction(q.k), 0.03); }
  chk(L, 'Para ²³⁵U con ν = 2.43 neutrones por fisión, un solo neutrón inicia una cadena autosostenida con probabilidad 1 − q = 0.88', 1 - R.extinction(2.43), 0.883, 3e-3);
  // cinética puntual
  for (const q of ref.pk) { const w = R.inhour(q.rho, 0.0065, 1e-4, 0.08); chk(S, `Ecuación de la inversa horaria ρ = Λω + βω/(ω + λ): raíz dominante para ρ = ${q.rho} frente a scipy.optimize.brentq`, w, q.w, 1e-9);
    const tr = R.kinetics(q.rho, 0.0065, 1e-4, 0.08, 2.0, 2e-5), n = tr[tr.length - 1].n; chk(S, `Cinética puntual (ρ = ${q.rho}): n(2 s) integrado (RK4) frente a scipy.integrate.solve_ivp (Radau)`, n, q.n, 2e-4); }
  chk(L, 'Reactor con ρ = 0.001 (0.15 $): el período asintótico 1/ω = 69 s es mucho mayor que el tiempo de generación (0.1 ms) gracias a los neutrones retardados', 1 / R.inhour(0.001, 0.0065, 1e-4, 0.08), 68.9, 3e-3);
  chk(L, 'Criticidad inmediata: para ρ > β = 0.0065 sin retardados el período sería Λ/(ρ − β): ρ = 0.0075 da ω ≈ (ρ − β)/Λ = 10 s⁻¹ (período de 0.1 s)', R.inhour(0.0075, 0.0065, 1e-4, 0.08), 10.49, 5e-3);
};
