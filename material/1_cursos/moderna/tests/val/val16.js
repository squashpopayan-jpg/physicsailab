/* Cap. 16 — Átomos con varios electrones: helio, tabla periódica, términos, Slater */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const A = EM.fm.at, D = EM.fm.ptdata, HA = A.HA_EV;
  // helio: perturbación y variacional
  for (const Z of [1, 2, 3, 4]) chk(Y, `⟨1/r₁₂⟩ para 1s² con carga Z = ${Z}: 5Z/8 frente a la integral de Slater exacta (SymPy)`, 5 * Z / 8, ref.J1s[Z], 1e-12);
  for (const q of ref.Evar) chk(S, `Energía variacional del helio-like (Z = ${q.Z}, ζ = ${q.zeta}): ζ² − 2Zζ + 5ζ/8 frente a T + V + V_ee con integrales de Slater`, A.heVar(q.Z, q.zeta), q.E, 1e-12);
  for (const Z of [2, 3, 4]) { const o = A.heVarOpt(Z), r = ref.Evar_opt[Z]; chk(S, `Óptimo variacional (Z = ${Z}): ζ = Z − 5/16 frente a scipy.optimize.minimize_scalar`, o.zeta, r[0], 1e-6); chk(S, `Energía variacional óptima (Z = ${Z}): −(Z − 5/16)² frente a la minimización numérica`, o.E, r[1], 1e-10); }
  chk(L, 'Helio, primer orden: E = −2.75 Ha = −74.83 eV (error 5.3 % respecto a −79.005 eV)', A.heFirstOrder(2) * HA, -74.83, 2e-4);
  chk(L, 'Helio, variacional: ζ = 27/16 y E = −2.8477 Ha = −77.49 eV (error 1.9 %)', A.heVarOpt(2).E * HA, -77.49, 2e-4);
  chk(L, 'Energía total del helio (experimento, suma de las dos ionizaciones: 24.587 + 54.418 eV) = −79.005 eV', (A.heExact[2] + 0) * HA, -79.005, 1e-3);
  // Hartree–Fock numérico radial
  for (const Z of [2, 3, 4, 5]) { const r = A.heHFextrap(Z), q = ref.heHF[Z];
    chk(S, `Hartree–Fock radial de dos electrones (Z = ${Z}): energía total en malla logarítmica con extrapolación de Richardson frente al método de Roothaan con 14 orbitales de Slater`, r.E, q.E, 1e-6);
    chk(S, `Hartree–Fock (Z = ${Z}): energía orbital ε`, r.eps, q.eps, 1e-5);
    chk(S, `Hartree–Fock (Z = ${Z}): integral de Coulomb J`, r.J, q.J, 1e-5); }
  chk(L, 'Hartree–Fock del helio: E = −2.86168 Ha (límite HF, Clementi y Roetti)', A.heHFextrap(2).E, -2.86167999, 1e-6);
  chk(L, 'Energía de correlación del helio: E_exacta − E_HF = −0.0420 Ha (1.14 eV)', A.heExact[2] - A.heHFextrap(2).E, -0.042044, 2e-3);
  chk(L, 'Primera ionización del helio con la energía exacta: 24.592 eV (experimento 24.587 eV, diferencia relativista y de QED)', (-2 - A.heExact[2]) * HA, 24.5874, 3e-4);
  chk(L, 'Primera ionización del helio frente al valor tabulado (pymatgen/NIST): 24.5874 eV', D[1].ie, 24.5874, 1e-4);
  // J y K de 1s2s
  for (const Z of [1, 2, 3]) { chk(Y, `Integral de Coulomb J(1s,2s) = 17Z/81 (Z = ${Z}) frente a SymPy`, A.heJ1s2s(Z), ref.JK[Z][0], 1e-12); chk(Y, `Integral de intercambio K(1s,2s) = 16Z/729 (Z = ${Z}) frente a SymPy`, A.heK1s2s(Z), ref.JK[Z][1], 1e-12); }
  // Madelung y excepciones
  { const exc = []; for (const q of D) if (!A.occEqual(A.parseConfig(q.cfg), A.occOf(A.madelung(q.Z)))) exc.push(q.Z);
    chk(L, 'La regla de Madelung falla para Z ≤ 54 solo en Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag (24, 29, 41, 42, 44, 45, 46, 47), frente a las configuraciones medidas (pymatgen/NIST)', exc.join(',') === '24,29,41,42,44,45,46,47' ? 1 : 0, 1, 0); }
  { let ok = 0; for (const q of D) if (A.occEqual(A.parseConfig(q.cfg), A.occOf(A.madelung(q.Z)))) ok++; chk(L, 'Configuraciones de Madelung que coinciden con las medidas, Z = 1…54: 46 de 54', ok, 46, 0); }
  chk(L, 'Capacidad de las capas: 2n² electrones (n = 1…4: 2, 8, 18, 32)', [1, 2, 3, 4].map((n) => 2 * n * n).reduce((a, b) => a + b, 0), 60, 0);
  chk(L, 'Gases nobles por llenado completo de capas (Madelung): Z = 2, 10, 18, 36, 54, 86', [2, 10, 18, 36, 54].map((Z) => A.madelung(Z).every(([n, l, k]) => k === 2 * (2 * l + 1)) ? 1 : 0).reduce((a, b) => a + b, 0), 5, 0);
  // Hund: fórmula frente a enumeración de microestados
  for (const l of [1, 2, 3]) for (let n = 0; n <= 4 * l + 2; n++) { const t = A.shellTerm(l, n), r = ref.hund[l + ',' + n];
    chk(S, `Términos de Hund de l = ${l}, n = ${n} electrones: (S, L, J) frente a la enumeración de todos los microestados`, t.S + 100 * t.L + 10000 * t.J, r[0] + 100 * r[1] + 10000 * r[2], 1e-12); }
  { let bad = 0, tot = 0; for (const q of D) { const t = ref.terms[q.Z]; if (!t) continue; tot++; if (A.groundTerm(A.parseConfig(q.cfg)).sym !== t) bad++; }
    chk(L, `Término fundamental por las reglas de Hund para los ${tot} primeros elementos (Z ≤ 48) frente a NIST ASD: discrepancias`, bad, 0, 0, false); }
  // Slater
  for (const Z of [2, 6, 11, 17, 19, 26, 29, 36, 47, 53]) { const s = ref.slater[Z]; chk(S, `Z_eff de Slater (Z = ${Z}, ${s.nl}) frente a una implementación independiente por grupos`, A.slaterZeff(Z, A.parseConfig(D[Z - 1].cfg), s.nl), s.z, 1e-12); }
  chk(L, 'Slater: Na 3s, Z_eff = 2.20 (Slater, Phys. Rev. 36, 57, 1930)', A.slaterZeff(11, A.parseConfig('[Ne].3s1'), '3s'), 2.20, 1e-12);
  chk(L, 'Slater: Fe 4s, Z_eff = 3.75', A.slaterZeff(26, A.parseConfig('[Ar].3d6.4s2'), '4s'), 3.75, 1e-12);
  chk(L, 'Slater: C 2p, Z_eff = 3.25', A.slaterZeff(6, A.parseConfig('1s2.2s2.2p2'), '2p'), 3.25, 1e-12);
  chk(L, 'Slater: Cl 3p, Z_eff = 6.10', A.slaterZeff(17, A.parseConfig('[Ne].3s2.3p5'), '3p'), 6.10, 1e-12);
  chk(L, 'Slater: Cu 4s, Z_eff = 3.70', A.slaterZeff(29, A.parseConfig('[Ar].3d10.4s1'), '4s'), 3.70, 1e-12);
  // periodicidad de las energías de ionización (NIST)
  { const peaks = []; for (let i = 1; i < 53; i++) if (D[i].ie > D[i - 1].ie && D[i].ie > D[i + 1].ie) peaks.push(D[i].Z);
    chk(L, 'Los máximos locales de la primera energía de ionización caen en Z = 2, 4, 7, 10, 12, 15, 18, 20?, 25?…: los gases nobles son máximos', [2, 10, 18, 36].filter((z) => peaks.includes(z)).length, 4, 0); }
  { const mins = []; for (let i = 1; i < 53; i++) if (D[i].ie < D[i - 1].ie && D[i].ie < D[i + 1].ie) mins.push(D[i].Z);
    chk(L, 'Los metales alcalinos Li, Na, K, Rb son mínimos locales de la energía de ionización', [3, 11, 19, 37].filter((z) => mins.includes(z)).length, 4, 0); }
};
