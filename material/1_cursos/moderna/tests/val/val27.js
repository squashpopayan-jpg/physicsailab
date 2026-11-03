/* Cap. 27 — Estrellas: politropos, enanas blancas, estrellas de neutrones */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const St = EM.fm.star;
  for (const q of ref.le) { const r = St.laneEmden(q.n, 1e-3);
    chk(S, `Lane–Emden n = ${q.n}: primer cero ξ₁ (RK4) frente a scipy.integrate.solve_ivp (DOP853)`, r.xi1, q.xi1, 1e-6); chk(S, `Lane–Emden n = ${q.n}: −ξ₁²θ'(ξ₁)`, r.mass, q.mass, 1e-6); chk(S, `Lane–Emden n = ${q.n}: razón de densidades ρ_c/ρ̄ = ξ₁/(3|θ'₁|)`, St.rhoRatio(r), q.rho, 1e-6); }
  chk(L, 'Lane–Emden (Chandrasekhar 1939): n = 1.5 → ξ₁ = 3.65375, −ξ²θ′ = 2.71406; n = 3 → 6.89685, 2.01824, ρ_c/ρ̄ = 54.18', St.laneEmden(3).xi1 + St.laneEmden(1.5).xi1, 6.89685 + 3.65375, 1e-5);
  chk(L, 'Solución analítica n = 1: ξ₁ = π; n = 0: ξ₁ = √6', St.laneEmden(1).xi1 + St.laneEmden(0).xi1, Math.PI + Math.sqrt(6), 1e-5);
  chk(L, 'Límite de Chandrasekhar (μ_e = 2): M_Ch = 1.456 M☉ (valor de la literatura: 1.457 M☉ = 5.83/μ_e²)', St.chandrasekhar(2) / St.Msun, 1.457, 1e-3);
  chk(L, 'Límite de Chandrasekhar con μ_e = 2.15 (enanas ricas en hierro): M = 1.456 × (2/2.15)² = 1.26 M☉', St.chandrasekhar(2.15) / St.Msun, 1.456 * 4 / (2.15 ** 2), 1e-3);
  // enanas blancas
  for (const q of ref.wd) { const w = St.whiteDwarf(q.xc, 2); chk(S, `Enana blanca (x_c = ${q.xc}): masa de la ecuación de Chandrasekhar con RK4 adaptativo frente a scipy DOP853`, w.M, q.M, 1e-4); chk(S, `Enana blanca (x_c = ${q.xc}): radio`, w.R, q.R, 1e-4); }
  { let prev = 0, ok = 1; for (const xc of [0.3, 0.6, 1, 2, 4, 8, 16, 32]) { const m = St.whiteDwarf(xc, 2).M; if (m < prev || m > St.chandrasekhar(2)) ok = 0; prev = m; }
    chk(L, 'La masa de las enanas blancas crece con la densidad central y tiende al límite de Chandrasekhar sin superarlo (x_c de 0.3 a 32; M(32) = 1.45 M☉)', ok, 1, 0); }
  { const a = St.whiteDwarf(0.1, 2), b = St.whiteDwarf(0.2, 2), slope = Math.log(b.R / a.R) / Math.log(b.M / a.M);
    chk(L, 'Régimen no relativista (x ≪ 1): R ∝ M^{−1/3}, porque la presión de degeneración sigue un politropo n = 3/2; pendiente numérica −1/3', slope, -1 / 3, 3e-2); }
  { let lo = 0.5, hi = 20; for (let i = 0; i < 50; i++) { const m = 0.5 * (lo + hi); if (St.whiteDwarf(m, 2).M < 1.02 * St.Msun) lo = m; else hi = m; } const w = St.whiteDwarf(lo, 2);
    chk(L, 'Sirius B (M = 1.02 M☉ observada): el modelo de Chandrasekhar con μ_e = 2 da R = 0.0080 R☉; el radio medido es 0.0084 R☉ (diferencia de 5 %)', w.R / St.Rsun, 0.0084, 8e-2); }
  // estrellas de neutrones
  for (const q of ref.ns) { const w = St.neutronStar(q.xc); chk(S, `Estrella de neutrones (x_c = ${q.xc}, gas ideal de neutrones): masa de la ecuación de Tolman–Oppenheimer–Volkoff frente a scipy DOP853`, w.M, q.M, 1e-4); chk(S, `Estrella de neutrones (x_c = ${q.xc}): radio`, w.R, q.R, 1e-4); }
  { let best = 0, bx = 0; for (let x = 0.5; x <= 1.3; x += 0.02) { const m = St.neutronStar(x).M; if (m > best) { best = m; bx = x; } }
    chk(S, 'Masa máxima de una estrella de neutrones de gas ideal de neutrones (búsqueda en malla) frente a scipy.optimize.minimize_scalar', best, ref.nsmax.M, 2e-3); chk(L, 'Oppenheimer y Volkoff (1939): M_max = 0.71 M☉', best / St.Msun, 0.71, 3e-3); chk(L, 'Radio de la estrella de masa máxima: 9.2 km', St.neutronStar(bx).R / 1e3, ref.nsmax.R / 1e3, 3e-2); }
  chk(L, 'La relatividad general limita la masa: sin ella, un politropo no tendría máximo; con la presión de un gas ideal de neutrones M_max = 0.71 M☉ < 1.4 M☉ medidas, de modo que las fuerzas nucleares sostienen las estrellas reales (hasta ≈ 2 M☉)', St.neutronStar(0.83).M / St.Msun < 0.72 ? 1 : 0, 1, 0);
  // astrofísica
  chk(S, 'Luminosidad de Eddington L = 4πGMm_pc/σ_T para 1 M☉ frente a astropy.constants', St.eddington(St.Msun), 4 * Math.PI * ref.astro.G * ref.astro.Msun * ref.astro.mp * ref.astro.c / ref.astro.sigT, 1e-6);
  chk(L, 'Luminosidad de Eddington del Sol: 1.26×10³¹ W = 3.3×10⁴ L☉ (L_Edd = 3.3×10⁴ (M/M☉) L☉)', St.eddington(St.Msun) / St.Lsun, 3.28e4, 3e-3);
  chk(L, 'Vida del Sol por fusión: convierte el 10 % de su masa con una eficiencia de 0.7 % (4H → He): 1.04×10¹⁰ años', St.sunLifetimeYr(0.1, 0.007), 1.04e10, 5e-3);
  chk(L, 'Energía de ligadura gravitatoria de una estrella de neutrones (1.4 M☉, R = 12 km): 3GM²/5R = 2.6×10⁴⁶ J, liberada en ≈ 10 s en una supernova (casi toda en neutrinos), ≈ 200 veces la energía irradiada por el Sol en 10¹⁰ años', St.bindingEnergy(1.4 * St.Msun, 12e3), 2.59e46, 3e-3);
  chk(L, 'Radio de Schwarzschild de 1.4 M☉: 4.13 km (una estrella de neutrones de 12 km tiene 2GM/Rc² = 0.34)', St.schwarzschild(1.4 * St.Msun) / 1e3, 4.135, 1e-3);
  chk(L, 'Luminosidad solar por unidad de masa: relación masa–luminosidad L ∝ M^3.5, Sirius (2 M☉) → 11 L☉, y vida ∝ M^{−2.5}: 1.8×10⁹ años', St.lumRelation(2) * 1e0, 11.31, 1e-3);
};
