/* Cap. 19 — Estadística cuántica, gas de electrones y calores específicos */
module.exports = function ({ chk, ref, EM, S, M_, Y, L }) {
  const St = EM.fm.st, K = EM.qm.K, kB = K.kB;
  for (const q of ref.occ) { chk(S, `Ocupación media Fermi–Dirac 1/(e^x + 1) para x = ${q.x} frente a la suma directa de los pesos de Boltzmann con n = 0, 1`, St.fd(q.x), q.fd, 1e-12); if (q.be !== null) chk(S, `Ocupación media Bose–Einstein 1/(e^x − 1) para x = ${q.x} frente a la suma directa con n = 0…3000`, St.be(q.x), q.be, 1e-9); }
  chk(L, 'Límite clásico: para x ≫ 1 (ε − μ ≫ kT), FD, BE y MB coinciden (x = 12, diferencia relativa < 10⁻⁵)', Math.abs(St.fd(12) - St.mb(12)) / St.mb(12) + Math.abs(St.be(12) - St.mb(12)) / St.mb(12), 0, 3e-5, false);
  chk(L, 'Ocupación FD en ε = μ: 1/2 (para cualquier T)', St.fd(0), 0.5, 1e-14);
  for (const q of ref.fdint) chk(M_, `Integral de Fermi–Dirac F_${q.j}(η = ${q.eta}) = −Γ(j + 1) Li_{j+1}(−e^η) (mpmath, 30 dígitos) frente a la cuadratura`, St.fdIntegral(q.j, q.eta), q.F, 2e-6);
  const E = ref.EF;
  chk(S, 'Energía de Fermi del cobre (n = 8.47×10²⁸ m⁻³) frente a scipy.constants', St.fermiEnergy(E.n), E.EF, 1e-8); chk(S, 'Temperatura de Fermi del cobre', St.fermiT(E.n), E.TF, 1e-8); chk(S, 'Velocidad de Fermi del cobre', St.fermiV(E.n), E.vF, 1e-8);
  chk(L, 'Cobre: E_F = 7.0 eV, T_F = 8.16×10⁴ K, v_F = 1.57×10⁶ m/s (Kittel)', St.fermiEnergy(E.n) / K.e, 7.00, 6e-3); chk(L, 'Cobre: T_F = 8.16×10⁴ K (Kittel)', St.fermiT(E.n), 8.16e4, 2e-3); chk(L, 'Cobre: v_F = 1.57×10⁶ m/s (Kittel)', St.fermiV(E.n), 1.57e6, 2e-3);
  for (const q of ref.mu19) chk(S, `Potencial químico del gas de electrones del cobre a ${q.T} K con n fijo: bisección sobre las integrales de FD frente a la cuadratura de scipy (brentq + quad)`, St.mu(q.n, q.T), q.mu, 2e-6, true);
  { const n = ref.EF.n, EF = St.fermiEnergy(n); const mu = St.mu(n, 300), som = St.muSommerfeld(n, 300);
    chk(L, 'Sommerfeld: μ(T) = E_F[1 − (π²/12)(kT/E_F)²] a 300 K difiere de la solución exacta en < 10⁻⁹ (relativa)', Math.abs(mu - som) / EF, 0, 1e-9, false);
    chk(L, 'A 300 K el potencial químico del cobre se desvía de E_F solo en 2.6×10⁻⁶ eV: (π²/12)(kT/E_F)² E_F', (EF - mu) / K.e, (Math.PI ** 2 / 12) * (kB * 300 / EF) ** 2 * EF / K.e, 1e-3); }
  // calor específico electrónico (Kittel)
  { const T = [['Na', 2.65e28, 1.0, 1.094, 1.38], ['K', 1.40e28, 1.0, 1.668, 2.08], ['Cu', 8.47e28, 1.0, 0.505, 0.695], ['Ag', 5.86e28, 1.0, 0.645, 0.646], ['Al', 18.1e28, 3.0, 0.912, 1.35]];
    for (const [nm, n, z, fre, obs] of T) chk(L, `Calor específico electrónico γ de ${nm}: electrones libres frente a la tabla de Kittel (mJ mol⁻¹ K⁻²)`, St.gammaFree(n, z) * 1e3, fre, 0.012); }
  // Debye y Einstein
  for (const q of ref.debye) chk(S, `Calor específico de Debye (T = ${q.T} K, θ_D = ${q.th} K) frente a scipy.integrate.quad`, St.debye(q.T, q.th), q.C, 1e-7);
  for (const q of ref.einstein) chk(Y, `Calor específico de Einstein (T = ${q.T} K, θ_E = ${q.th} K) frente a la fórmula cerrada`, St.einstein(q.T, q.th), q.C, 1e-9);
  chk(L, 'Dulong–Petit: 3R = 24.94 J/(mol K)', St.dulongPetit, 24.9434, 1e-4); chk(L, 'Debye a T ≫ θ_D: C → 3R (T = 20 θ_D, 1.0×10⁻³)', St.debye(20 * 343, 343) / St.dulongPetit, 1, 1e-3);
  chk(L, 'Ley T³ de Debye: C = (12π⁴/5)R(T/θ)³ para T = θ/50, coincide con la integral completa (1 %)', St.debye(343 / 50, 343), St.debyeT3(343 / 50, 343), 1e-2);
  chk(L, 'Cobre a 300 K con θ_D = 343 K: C_V = 23.4 J/(mol K); el C_P medido es 24.4 (incluye dilatación y electrones)', St.debye(300, 343), 23.39, 1e-3);
  chk(L, 'Silicio a 300 K con θ_D = 645 K: C_V = 20.0 J/(mol K) (C_P medido 19.8 J/(mol K))', St.debye(300, 645), 20.01, 1e-3);
  chk(L, 'Einstein subestima la red a baja T (exponencial en lugar de T³): a T = θ/15 la razón E/D es ≪ 1', St.einstein(343 / 15, 343) / St.debye(343 / 15, 343) < 0.01 ? 1 : 0, 1, 0);
  chk(L, 'ζ(3/2) = 2.6124 (mpmath)', St.zeta32, ref.zeta32, 1e-14);
  chk(L, 'Temperatura crítica del condensado ideal con la densidad del ⁴He líquido (ρ = 145 kg/m³): T_c = 3.13 K (el punto λ está en 2.17 K)', St.bec(145 / (4.002602 * K.u), 4.002602 * K.u), 3.13, 3e-3);
};
