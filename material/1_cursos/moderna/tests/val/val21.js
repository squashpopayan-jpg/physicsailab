/* Cap. 21 — Superconductividad, Josephson, superfluidez y BEC en trampa */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const Mc = EM.fm.mac, K = EM.qm.K, kB = K.kB, e = K.e, h = K.h;
  chk(L, 'BCS: Δ(0) = π e^{−γ} k_BT_c = 1.764 k_BT_c (γ = constante de Euler)', Mc.delta0, 1.7639, 1e-4);
  for (const q of ref.bcs) chk(S, `BCS: brecha Δ(T = ${q.t} T_c)/k_BT_c por la ecuación universal frente a la ecuación con corte ħω_D = 300 k_BT_c (scipy.quad + brentq)`, Mc.gap(q.t), q.D, 5e-4);
  chk(L, 'BCS cerca de T_c: Δ² ≈ 9.38 (k_BT_c)²(1 − T/T_c) (Δ ≈ 3.06 k_BT_c √(1 − T/T_c)); frente a la derivada numérica de la ecuación con corte', Mc.gap(0.9999) ** 2 / (1 - 0.9999), ref.dD2dt, 3e-3);
  chk(L, 'BCS: 3.06 = √9.38', Math.sqrt(9.38), 3.063, 1e-3);
  chk(L, 'Densidad de estados de los cuasi-partículas N_s(E)/N_n = E/√(E² − Δ²): diverge en la brecha, vale 1 lejos de ella (E = 100 Δ)', Mc.dos(100, 1), 1.00005, 1e-5);
  chk(L, 'Dentro de la brecha |E| < Δ no hay estados', Mc.dos(0.5, 1), 0, 1e-12, false);
  chk(S, 'Cuanto de flujo Φ₀ = h/2e frente a scipy.constants (2.067834×10⁻¹⁵ Wb)', Mc.fluxQuantum, ref.mac_consts.Phi0, 1e-9);
  chk(S, 'Constante de Josephson K_J = 2e/h = 483597.85 GHz/V frente a scipy.constants', Mc.josephsonHz(1), ref.mac_consts.KJ, 1e-9);
  chk(L, 'Efecto Josephson alterno: 1 µV corresponde a 483.598 MHz', Mc.josephsonHz(1e-6) / 1e6, 483.5978, 5e-7);
  chk(L, 'London: aluminio con n_s = n = 18.1×10²⁸ m⁻³ da λ_L = 12.5 nm; el valor medido es 16 nm (Kittel): mismo orden, la diferencia se debe a n_s < n y a la masa efectiva', Mc.london(18.1e28) * 1e9, 16, 0.25);
  chk(L, 'Brecha del aluminio con T_c = 1.175 K: Δ = 1.764 k_BT_c = 0.179 meV (medida 0.17–0.18 meV)', Mc.delta0 * kB * 1.175 / e * 1e3, 0.179, 5e-3);
  chk(L, 'Ambegaokar–Baratoff a T = 0 para Al: I_cR_n = πΔ/2e = 0.2805 mV', Mc.AB(Mc.delta0 * kB * 1.175, 1e-3) * 1e3, 0.2805, 1e-3);
  for (const q of ref.rcsj) { chk(S, `RCSJ sobreamortiguado, I/I_c = ${q.i}: tensión media ⟨V⟩/(I_cR_n) integrando φ̇ = i − sen φ (RK4) frente a scipy.integrate.solve_ivp (DOP853)`, Mc.rcsj(q.i, 600, 0.01), q.v, 3e-3); chk(Y, `RCSJ, I/I_c = ${q.i}: ⟨V⟩ = R_n √(I² − I_c²) (la media sobre 600 τ_J incluye una fracción de periodo: error ≲ 1 % cerca de I_c)`, Mc.rcsjAnalytic(q.i), q.v, 1.2e-2); }
  for (const q of ref.fraunhofer) chk(S, `Fraunhofer de una unión larga: I_c(Φ/Φ₀ = ${q.f})/I_c0 = |sen πf/πf| frente a la maximización de la integral de la corriente (scipy.quad + minimize_scalar)`, Mc.fraunhofer(q.f), q.I, 1e-7, true);
  chk(L, 'SQUID de dos uniones: I_c ∝ |cos(πΦ/Φ₀)|, nulo en Φ = Φ₀/2 y máximo en Φ = nΦ₀', Mc.squid(0.5) + Mc.squid(1) - 1, 0, 1e-12, false);
  { const l = Mc.landau(); chk(S, 'Criterio de Landau del ⁴He con rotones (Δ/k = 8.65 K, p₀/ħ = 1.91 Å⁻¹, μ = 0.16 m): v_c = min ε/p frente a scipy.optimize.minimize_scalar', l.v, ref.landau.v, 1e-6); chk(L, 'v_c ≈ 58 m/s (Landau; el valor medido en capilares finos es menor por los vórtices)', l.v, 58.4, 3e-3); }
  chk(L, 'Fonones: c = 238 m/s, el criterio de Landau con rotones es más restrictivo (58 m/s < 238 m/s)', Mc.landau().v < 238 ? 1 : 0, 1, 0);
  for (const q of ref.trap) { const Tc0 = Mc.TcTrap(q.N, q.w), Tcc = Mc.TcTrapCorr(q.N, q.w, q.w);
    chk(S, `BEC en trampa armónica (N = ${q.N}, ν = ${(q.w / 2 / Math.PI).toFixed(0)} Hz): T_c = (ħω/k)(N/ζ(3))^{1/3} con la corrección de tamaño finito −0.73 N^{−1/3} frente a la suma exacta sobre los niveles (numpy)`, Tcc, q.Tc, 4e-3);
    chk(L, `BEC en trampa (N = ${q.N}): la fórmula termodinámica sobreestima el valor exacto 1–3 % (efecto de tamaño finito)`, Tc0 / q.Tc, 1.0 + 0.73 * Math.pow(q.N, -1 / 3) * 1.0, 6e-3); }
  chk(L, 'Fracción condensada: 1 − (T/T_c)³ en la trampa y 1 − (T/T_c)^{3/2} en el gas uniforme; ambas valen 0 en T_c y 1 en T = 0', Mc.condFracTrap(0) + Mc.condFracUniform(0) + Mc.condFracTrap(1) + Mc.condFracUniform(1), 2, 1e-12);
};
