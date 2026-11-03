/* Cap. 14 — Hidrógeno */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const Hy = EM.qm.hyd, T = EM.fm.hyd;
  for (const r of ref.hyd_R) chk(S, `R_${r.n}${'spdfg'[r.l]}(r = ${r.r} a₀) frente a sympy.physics.hydrogen.R_nl`, Hy.R(r.n, r.l, r.r), r.R, 1e-10, Math.abs(r.R) > 1e-12);
  for (const r of ref.hyd_rad) chk(Y, `Integral dipolar ⟨${r.n}${'spdfg'[r.l]}|r|${r.n2}${'spdfg'[r.l2]}⟩ (Simpson) frente a la integral exacta de SymPy`, T.radial(r.n, r.l, r.n2, r.l2), r.I, 1e-8);
  for (const r of ref.hyd_r) chk(Y, `⟨r⟩ del estado ${r.n}${'spdfg'[r.l]}: [3n² − l(l+1)]/2 frente a SymPy`, Hy.rMean(r.n, r.l), r.v, 1e-12);
  chk(L, '⟨1s|r|2p⟩ = 128√6/243 = 1.2903 a₀', T.radial(1, 0, 2, 1), (128 * Math.sqrt(6)) / 243, 1e-8);
  /* Tasas de transición frente a NIST */
  const mu = EM.qm.K.mp ? EM.qm.K.mp / (EM.qm.K.mp + EM.qm.K.me) : 1;  /* μ en unidades de m_e */
  const names = { '2p-1s': [2, 1, 1, 0], '3p-1s': [3, 1, 1, 0], '3p-2s': [3, 1, 2, 0], '3s-2p': [3, 0, 2, 1], '3d-2p': [3, 2, 2, 1], '4p-1s': [4, 1, 1, 0] };
  for (const [k, v] of Object.entries(ref.nist_A)) { const q = names[k]; chk('Literatura', `Coeficiente de Einstein A(${k}) frente a NIST Atomic Spectra Database (H I): ${v.toExponential(4)} s⁻¹ (se promedia la estructura fina; masa reducida)`, T.A(q[0], q[1], q[2], q[3], mu), v, 4e-3); }
  chk(L, 'Vida media del 2p: 1.596 ns', T.decay(2, 1, mu).tau * 1e9, 1.5961, 4e-3);
  chk(L, 'Vida media del 3p: 5.27 ns', T.decay(3, 1, mu).tau * 1e9, 5.27, 5e-3);
  chk(L, 'Vida media del 3d: 15.5 ns (solo 3d → 2p)', T.decay(3, 2, mu).tau * 1e9, 15.47, 5e-3);
  chk(L, 'Vida media del 3s: 158 ns (solo 3s → 2p)', T.decay(3, 0, mu).tau * 1e9, 158.4, 5e-3);
  chk(L, 'Regla de selección: A(2s → 1s) = 0 en la aproximación dipolar (Δl = 0 prohibida)', T.A(2, 0, 1, 0), 0, 0, false);
  chk(L, 'Línea Lyα del hidrógeno con masa reducida: 121.568 nm', T.lineNm(2, 1, mu), 121.568, 1e-4);
  chk(L, 'Línea Hα del hidrógeno con masa reducida: 656.47 nm (vacío)', T.lineNm(3, 2, mu), 656.470, 1e-5);
};
