/* Cap. 4 — Dinámica relativista */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const R = EM.fm.rel, M = R.MASS;
  /* constantes de masa del código frente a PDG (paquete particle) y CODATA (scipy.constants) */
  for (const k of ['mu', 'pi', 'pi0', 'K', 'Z', 'tau']) chk('Literatura', `Masa de ${k} en la biblioteca (PDG 2022) frente al paquete particle: ${ref.pdg_mass[k]} MeV/c²`, M[k], ref.pdg_mass[k], 1e-4);
  for (const k of ['W', 'H', 'top']) chk('Literatura', `Masa de ${k} en la biblioteca (PDG 2022) frente al paquete particle (PDG 2020): ${ref.pdg_mass[k]} MeV/c²: coinciden a 0.1 %`, M[k], ref.pdg_mass[k], 2e-3);
  for (const k of ['e', 'p', 'n', 'd']) chk(S, `Masa de ${k} en la biblioteca frente a scipy.constants (CODATA 2018)`, M[k], ref.codata_mass[k], 1e-9);
  chk(S, 'u·c² = 931.494 MeV (scipy.constants)', R.U_MEV, ref.codata_mass.u, 1e-10);
  /* trabajo-energía */
  for (const w of ref.work) chk(S, `Trabajo de una fuerza constante F = ${w.F}, recorrido ${w.x} (unidades m = c = 1): K = Fx frente a (γ − 1) por integración de F = dp/dt (DOP853)`, w.K_work, w.K_formula, 1e-9);
  /* umbral */
  for (const t of ref.threshold) chk(S, `Umbral ${t.name}: K frente a la búsqueda numérica de √s = Σm (brentq)`, R.thresholdFixedK(t.m1, t.m2, t.Mf), t.K, 1e-9);
  chk(L, 'Umbral p p → p p p p̄ = 6 mc² (Bevatron, 5.63 GeV)', R.thresholdFixedK(M.p, M.p, 4 * M.p) / M.p, 6, 1e-12);
  chk(L, 'Fórmula del umbral para un blanco fijo: √s(K) = Mf cuando K = K_umbral', R.sqrtsFixed(M.p, M.p + R.thresholdFixedK(M.p, M.p, 4 * M.p), M.p), 4 * M.p, 1e-12);
  /* colisionador frente a blanco fijo */
  chk(L, 'LHC: √s = 2E = 13.6 TeV con haces de 6.8 TeV', R.sqrtsCollider(M.p, 6.8e6, M.p, 6.8e6), 13.6e6, 1e-8);
  chk(L, 'LHC: energía del haz de blanco fijo equivalente: 9.856×10⁷ GeV', R.fixedEquivalentE(M.p, 6.8e6) / 1e3, 9.8564159e7, 1e-6);
  chk(L, 'Blanco fijo equivalente da el mismo √s: √s(E_eq, blanco fijo) = √s(colisionador)', R.sqrtsFixed(M.p, R.fixedEquivalentE(M.p, 6.8e6), M.p), 13.6e6, 1e-8);
  /* desintegración */
  for (const t of ref.twobody) chk(S, `Desintegración ${t.name}: p* frente a la búsqueda numérica de √(m₁²+p²) + √(m₂²+p²) = M (brentq)`, R.twoBodyP(t.M, t.m1, t.m2), t.p, 1e-10);
  /* π⁰ → γγ */
  for (const t of ref.pi0gg) {
    const r = R.pi0Photons(t.m, t.E);
    chk(S, `π⁰ → γγ (E = ${t.E} MeV): energía mínima del fotón frente al boost numérico de la emisión isotrópica`, r.Emin, t.Emin, 1e-6);
    chk(S, `π⁰ → γγ (E = ${t.E} MeV): energía máxima del fotón frente al boost numérico`, r.Emax, t.Emax, 1e-9);
    chk(S, `π⁰ → γγ (E = ${t.E} MeV): ángulo mínimo de apertura 2·arcsen(1/γ) frente al boost numérico`, (r.thetaMin * 180) / Math.PI, t.thetaMin, 1e-6);
    chk(L, `π⁰ → γγ (E = ${t.E} MeV): la masa invariante de los dos fotones recupera m_π⁰`, t.mass_check, t.m, 1e-9);
  }
  /* Q de Cockcroft–Walton */
  chk(S, 'Q de 7Li(p,α)α con masas atómicas (periodictable, AME): 17.346 MeV', R.qValue([ref.mass_u.Li7, ref.mass_u.H1], [ref.mass_u.He4, ref.mass_u.He4]), ref.qCW, 1e-12);
  /* colisión elástica */
  const e = ref.elastic;
  chk(S, 'Colisión elástica: Σγmv (x) se conserva en el sistema del laboratorio', e.rel_after[0], e.rel_before[0], 1e-12);
  chk(S, 'Colisión elástica: Σγmv (y) se conserva en el sistema del laboratorio', e.rel_after[1], e.rel_before[1], 1e-12, false);
  chk(L, 'Colisión elástica: Σmv (Newton) NO se conserva en el sistema del laboratorio (cambia en 0.03 en unidades mc)', Math.abs(e.new_after[0] - e.new_before[0]) > 1e-3 || Math.abs(e.new_after[1] - e.new_before[1]) > 1e-3 ? 1 : 0, 1, 0);
  /* energía–momento y límites */
  for (const [m, K] of [[M.e, 1], [M.mu, 50], [M.p, 1000], [M.e, 1e-3]]) {
    const E = K + m, p = R.momentumFromK(K, m);
    chk(Y, `E² = (pc)² + (mc²)² para m = ${m} MeV, K = ${K} MeV`, E * E, p * p + m * m, 1e-12);
  }
  { const bb = R.betaFromK(1e-3, M.e); chk(L, 'Límite clásico: K/(½mv²) = 1 + (3/4)β² + … (electrón de 1 keV)', R.kinetic(M.e, R.gammaFromK(1e-3, M.e)) / R.classicalK(M.e, bb), 1 + 0.75 * bb * bb, 2e-5); }
  chk(L, 'Cota de la luz: β < 1 para K = 15 MeV (electrón): β = 0.999457', R.betaFromK(15, M.e), 0.99945719, 1e-8);
  chk(L, 'Una partícula sin masa: pc = E (fotón de 2 eV)', R.momentumFromK(2e-6, 0), 2e-6, 1e-14);
};
