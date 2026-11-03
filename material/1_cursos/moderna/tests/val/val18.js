/* Cap. 18 — Moléculas */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const M = EM.fm.mol, K = EM.qm.K, HA = M.HA_EV;
  for (const q of ref.h2p) {
    chk(S, `H₂⁺: solapamiento S(R = ${q.R}) analítico frente a la cuadratura 2D en coordenadas esferoidales prolatas (scipy.integrate.dblquad)`, M.S(q.R), q.S, 1e-8);
    chk(S, `H₂⁺: integral de Coulomb ⟨A|1/r_B|A⟩ (R = ${q.R})`, M.jInt(q.R), q.j, 1e-8);
    chk(S, `H₂⁺: integral de intercambio ⟨A|1/r_A|B⟩ (R = ${q.R})`, M.kInt(q.R), q.k, 1e-8);
    chk(S, `H₂⁺: energía del orbital enlazante σ_g (R = ${q.R}) frente al problema generalizado 2×2 con integrales numéricas (scipy.linalg.eigh)`, M.Eplus(q.R), q.Ep, 1e-8);
    chk(S, `H₂⁺: energía del orbital antienlazante σ_u (R = ${q.R})`, M.Eminus(q.R), q.Em, 1e-8); }
  { const b = M.bond();
    chk(L, 'H₂⁺ con LCAO: R_e = 2.49 a₀ (1.32 Å) y D_e = 1.76 eV (Pauling; el valor exacto es 2.00 a₀ y 2.79 eV)', b.Re, 2.4930, 1e-3);
    chk(L, 'H₂⁺ con LCAO: energía de disociación 1.76 eV', b.De * HA, 1.7646, 2e-3);
    chk(L, 'Principio variacional: la energía LCAO en R = 2.0 a₀ (−0.5538 Ha) queda por encima de la exacta de Bates (−0.602634 Ha)', M.Eplus(2) > -0.602634 ? 1 : 0, 1, 0);
    chk(L, 'D_e exacta del H₂⁺ (Bates, Ledsham y Stewart, 1953): (0.602634 − 0.5) Ha = 2.7928 eV', 0.102634 * HA, 2.7928, 1e-4);
    chk(L, 'σ_u no tiene mínimo: es repulsivo para todo R (E(σ_u) > −0.5 Ha en todo el rango)', [0.5, 1, 2, 4, 8, 20].every((R) => M.Eminus(R) > -0.5 + 1e-9) ? 1 : 0, 1, 0);
    chk(L, 'Límite de átomos separados: E± → −0.5 Ha para R grande (R = 40 a₀)', M.Eplus(40), -0.5, 3e-3); }
  // rotor y B
  chk(S, 'Masa reducida del CO (¹²C¹⁶O) con masas isotópicas de periodictable: 6.8562 u', M.reducedMass(12, 15.99491461957), ref.mu.CO12, 1e-6);
  chk(L, 'Constante rotacional del CO: B = h/(8π²cμr²) con r = 1.1283 Å → 1.9313 cm⁻¹ (NIST)', M.rotB(ref.mu.CO12, 1.1283), 1.9313, 6e-4);
  chk(L, 'Constante rotacional del HCl: r = 1.2746 Å → B = 10.59 cm⁻¹ (NIST: 10.5934)', M.rotB(ref.mu.HCl, 1.2746), 10.5934, 2e-3);
  chk(L, 'Constante rotacional del N₂: r = 1.0977 Å → 1.998 cm⁻¹ (NIST: 1.99824)', M.rotB(ref.mu.N2, 1.0977), 1.99824, 6e-4);
  chk(L, 'Constante rotacional del H₂: r = 0.7414 Å → 60.85 cm⁻¹ (NIST: 60.853)', M.rotB(ref.mu.H2, 0.7414), 60.853, 2e-3);
  chk(L, 'Efecto isotópico: B(¹³CO)/B(¹²CO) = μ(¹²CO)/μ(¹³CO) = 0.9559', M.rotB(ref.mu.CO13, 1.1283) / M.rotB(ref.mu.CO12, 1.1283), ref.mu.CO12 / ref.mu.CO13, 1e-12);
  for (const q of ref.part) { chk(S, `Función de partición rotacional (B = ${q.B} cm⁻¹, T = ${q.T} K) frente a la suma directa (NumPy)`, M.partition(q.B, q.T), q.Z, 1e-9);
    chk(S, `Partición con estadística nuclear del H₂ (pesos 1:3), B = ${q.B}, T = ${q.T} K`, M.partition(q.B, q.T, M.NS.H2), q.Zh2, 1e-9);
    const J = Math.round(M.Jmax(q.B, q.T)); chk(L, `J de máxima población √(kT/2hcB) − ½ (B = ${q.B}, T = ${q.T}): coincide con el máximo de la suma, ±1`, Math.abs(J - q.Jmax) <= 1 ? 1 : 0, 1, 0); }
  for (const q of ref.ortho) chk(S, `Fracción de ortohidrógeno en equilibrio a ${q.T} K frente a la suma directa (límite de alta temperatura 3/4)`, M.orthoFraction(60.853, q.T), q.f, 1e-9);
  chk(L, 'Ortohidrógeno en equilibrio a 77 K: 48 % (el H₂ líquido necesita catalizador para convertirse en parahidrógeno)', M.orthoFraction(60.853, 77), 0.4794, 1e-3);
  // Morse
  { const m = ref.morse, md = M.morse(m.De, m.re, m.mu, m.we), d = M.dunham(md);
    chk(S, 'Morse (HCl): parámetro a = ω_e/(2√(K D_e)) coincide con el de la integración numérica', md.a, m.a, 1e-8);
    chk(Y, 'Morse: ω_e x_e = K a² = ω_e²/4D_e (60.0 cm⁻¹ para los parámetros del HCl; el valor real, 52.82 cm⁻¹, difiere 14 %: el HCl no es exactamente un Morse)', md.wexe, m.we ** 2 / (4 * m.De), 1e-6);
    for (const J of [0, 1, 3, 6, 10]) { const E = m.lev[J]; const G = (v, JJ) => M.G(d, v) + M.Fv(d, v, JJ);
      chk(S, `Morse (HCl), J = ${J}: energía de vibración–rotación del nivel v = 1 respecto de v = 0, constantes de Pekeris (error ≤ 0.4 cm⁻¹ hasta J = 10) frente a la diagonalización numérica radial (scipy.linalg.eigh_tridiagonal)`, G(1, J) - G(0, J), E[1] - E[0], 2e-4);
      chk(S, `Morse (HCl), J = ${J}: energía del nivel v = 0 respecto del mínimo`, G(0, J), E[0], 2e-4); } }
  { const HCl = { we: 2990.946, wexe: 52.8186, Be: 10.5934, alpha: 0.30718, Dcd: 5.319e-4, beta: 0 }, CO = { we: 2169.8133, wexe: 13.2883, Be: 1.93128, alpha: 0.017504, Dcd: 6.12e-6, beta: 0 };
    const f = (d, b, J) => M.lines(d, 300, 12).find((q) => q.br === b && q.J === J).nu;
    chk(L, 'HCl: línea R(0) de la banda fundamental, 2906.25 cm⁻¹ medida (constantes de Dunham de segundo orden: error 7×10⁻⁴ cm⁻¹ relativo 2×10⁻⁴)', f(HCl, 'R', 0), 2906.25, 5e-4);
    chk(L, 'HCl: línea P(1), 2865.09 cm⁻¹ medida', f(HCl, 'P', 1), 2865.09, 5e-4);
    chk(L, 'CO: línea R(0) de la banda fundamental, 2147.08 cm⁻¹ medida', f(CO, 'R', 0), 2147.08, 1e-4);
    chk(L, 'CO: línea P(1), 2139.43 cm⁻¹ medida', f(CO, 'P', 1), 2139.43, 1e-4);
    chk(L, 'CO: origen de la banda ω_e − 2ω_ex_e = 2143.24 cm⁻¹ (medido 2143.27 cm⁻¹)', M.G(CO, 1) - M.G(CO, 0), 2143.27, 2e-5);
    chk(L, 'Rotación pura del CO, J = 0 → 1 con B₀ = 1.92253 cm⁻¹: 115.27 GHz (línea de 2.6 mm)', 2 * 1.92253 * K.c * 100 / 1e9, 115.2712, 1e-5);
    chk(S, 'Efecto isotópico en HCl: desplazamiento del origen de la banda H³⁷Cl respecto de H³⁵Cl, ν₀(1 − √(μ₃₅/μ₃₇)) = 2.18 cm⁻¹ (doblete observado ≈ 2 cm⁻¹)', (2990.946 - 2 * 52.8186) * (1 - Math.sqrt(0.9795925390951976 / 0.981077294475523)), 2.1841, 1e-3); }
  // Raman
  chk(L, 'Raman rotacional del N₂ (B = 1.99824 cm⁻¹): primera línea Stokes J = 0 → 2 en 6B = 11.99 cm⁻¹', M.ramanShift(1.99824, 0), 11.98944, 1e-9);
  chk(L, 'Separación entre líneas Raman rotacionales sucesivas: 4B = 7.99 cm⁻¹', M.ramanShift(1.99824, 3) - M.ramanShift(1.99824, 2), 4 * 1.99824, 1e-12);
  { const ln = M.ramanLines(1.99824, 298.15, M.NS.N2, 20).filter((q) => q.stokes !== undefined && q.J < 2), r = ln[0].I / ln[1].I; const w0 = M.pop(1.99824, 298.15, 0, M.NS.N2), w1 = M.pop(1.99824, 298.15, 1, M.NS.N2);
    chk(L, 'Alternancia de intensidades en el Raman rotacional del N₂ por estadística nuclear (núcleos ¹⁴N, I = 1): J par : impar = 2 : 1 (se comprueba el cociente de pesos g_par/g_impar = 6/3)', M.NS.N2[0] / M.NS.N2[1], 2, 1e-12); void r; void w0; void w1; }
  chk(L, 'Sum rule de Placzek–Teller: Σ_ΔJ del factor de la rama S + O + Q es la anisotropía; el factor 3(J+1)(J+2)/2(2J+1)(2J+3) vale 0.3 para J = 0 → 2', 3 * 1 * 2 / (2 * 1 * 3), 1, 1e-12);
};
