/* Cap. 9 — Ondas de materia e incertidumbre */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const T = EM.fm.mat, K = EM.qm.K;
  for (const [V, v] of Object.entries(ref.lambda_e)) chk(S, `λ de de Broglie del electrón acelerado por ${V} V (relativista exacta) frente a scipy.constants`, T.lambdaK(+V * K.e, K.me), v, 1e-9);
  chk(S, 'λ del neutrón térmico (300 K, K = 3kT/2) frente a scipy.constants: 0.1452 nm', T.lambdaThermal(1.67492749804e-27, 300), ref.lambda_n_thermal, 1e-6);
  for (const r of ref.ds) chk(S, `Doble rendija (λ = ${(r.lam * 1e9).toPrecision(4)} nm, d = ${(r.d * 1e6).toFixed(1)} µm, a = ${(r.a * 1e6).toFixed(1)} µm, θ = ${(r.th * 1e6).toFixed(3)} µrad): cos²β·sinc²α frente a la integral numérica del campo de las dos rendijas (numpy)`, T.doubleSlit(r.th, r.lam, r.d, r.a), r.I, 1e-6, r.I > 1e-4);
  chk(L, 'Doble rendija: la separación angular de franjas es λ/d y el máximo central vale 1', T.doubleSlit(0, 5e-12, 2e-6, 5e-7), 1, 1e-14);
  chk(L, 'Complementariedad de Englert: V² + D² = 1 en el caso límite (D = 0.6 → V = 0.8)', T.visibility(0.6), 0.8, 1e-14);
  for (const g of ref.gauss) {
    chk(S, `Paquete gaussiano libre (m = ${g.m.toExponential(2)} kg, σ₀ = ${g.s0.toExponential(1)} m, t = ${g.t.toExponential(2)} s): σ(t) = σ₀√(1 + (ħt/2mσ₀²)²) frente a la evolución por FFT (numpy)`, T.sigma(g.t, g.s0, g.m), g.sigma, 1e-6);
    chk(S, `Paquete gaussiano libre (m = ${g.m.toExponential(2)} kg, t = ${g.t.toExponential(2)} s): Δp = ħ/(2σ₀) se conserva (FFT)`, T.dp(g.s0), g.dp, 1e-6);
    chk(L, `Paquete gaussiano (t = ${g.t.toExponential(2)} s): ΔxΔp/(ħ/2) = √(1 + (ħt/2mσ₀²)²) ≥ 1`, (g.sigma * g.dp) / (K.hbar / 2), Math.sqrt(1 + (K.hbar * g.t / (2 * g.m * g.s0 * g.s0)) ** 2), 1e-6);
  }
  { const m = T.hEstimateMin(); chk(S, 'Estimación de Heisenberg del hidrógeno: r_mín = ħ²·4πε₀/(m e²) = a₀ frente a la minimización numérica', m.r, ref.hest.r, 1e-6); chk(S, 'Estimación de Heisenberg del hidrógeno: E_mín = −13.6057 eV (con m = m_e) frente a la minimización numérica', m.E / K.e, ref.hest.E, 1e-8); chk(L, 'E_mín = −Ry (scipy.constants)', m.E / K.e, -ref.hest.Ry, 1e-6); chk(L, 'r_mín = a₀ de Bohr', m.r, ref.hest.a0, 1e-6); }
  chk(L, 'Ancho natural de Lyα (A = 6.2649×10⁸ s⁻¹): Γ = ħA = 4.124×10⁻⁷ eV, Δν = 99.7 MHz', T.naturalWidthEV(ref.lya_A), 4.1236e-7, 2e-4);
  chk(L, 'Ancho natural de Lyα: Δν = A/2π = 99.71 MHz', T.naturalWidthHz(ref.lya_A) / 1e6, 99.71, 2e-4);
};
