/* Cap. 13 — Oscilador armónico y moléculas diatómicas */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const H = EM.fm.ho;
  ref.ho_fd.forEach((v, n) => chk(S, `Oscilador armónico: E_${n} = n + ½ (ħ = m = ω = 1) frente a la diagonalización de diferencias finitas (8000 puntos, scipy.linalg.eigh_tridiagonal)`, n + 0.5, v, 2e-5));
  for (const r of ref.ho_psi) chk(S, `Oscilador armónico: ψ_${r.n}(ξ = ${r.xi}) por recurrencia frente a scipy.special.eval_hermite`, H.psi(r.n, r.xi), r.psi, 1e-10, Math.abs(r.psi) > 1e-12);
  chk(S, 'Probabilidad fuera de la región clásica para n = 0: erfc(1) = 0.1573 frente a scipy.special.erfc', H.pForbidden(0), ref.erfc1, 1e-8);
  for (const r of ref.ho_forbidden) chk(S, `Probabilidad fuera de la región clásica para n = ${r.n}: Simpson frente a scipy.quad con eval_hermite`, H.pForbidden(r.n), r.P, 1e-6);
  for (const n of [0, 1, 2, 3]) { chk(Y, `⟨x²⟩ = n + ½ (SymPy), n = ${n}`, n + 0.5, ref.ho_x2[String(n)], 1e-12); chk(Y, `⟨p²⟩ = n + ½ (SymPy), n = ${n}`, n + 0.5, ref.ho_p2[String(n)], 1e-12); }
  { const m = ref.morse_fd, w = m.a * Math.sqrt(2 * m.D);
    m.E.forEach((v, n) => chk(S, `Potencial de Morse (D = ${m.D}, a = ${m.a}): E_${n} = ω(n + ½) − ω²(n + ½)²/4D frente a la diagonalización de diferencias finitas (24 000 puntos)`, w * (n + 0.5) - (w * w * (n + 0.5) ** 2) / (4 * m.D), v, 3e-5)); }
  for (const [nm, d] of Object.entries(ref.diat)) {
    chk('Literatura', `${nm}: banda fundamental 1←0 = ωe − 2ωexe (Morse) frente a la observada ${d.fund} cm⁻¹ (NIST WebBook)`, H.morseLine(0, 1, d.we, d.wexe), d.fund, 1e-3);
    chk(L, `${nm}: D_e = ωe²/(4ωexe) y número de estados ligados`, H.morseN(d.we, d.wexe) > 10 ? 1 : 0, 1, 0);
  }
  chk('Literatura', 'CO: primer sobretono 2←0 = 2ωe − 6ωexe = 4259.9 cm⁻¹ frente al observado 4259.7 cm⁻¹', H.morseLine(0, 2, 2169.81, 13.288), 4259.74, 1e-4);
  { const mu = H.reduced(12 * K0(), 15.9949146 * K0()); chk(L, 'Constante de fuerza del CO: k = μ(2πcωe)² = 1902 N/m', H.kForce(2169.81, mu), 1902.3, 2e-3); }
  function K0() { return EM.qm.K.u; }
  chk(L, 'Energía de punto cero del CO: ½ħω = 0.1348 eV (ωe = 2169.81 cm⁻¹)', (0.5 * 2169.81 * 100 * EM.qm.K.h * EM.qm.K.c) / EM.qm.K.e, 0.13451, 1e-3);
  chk(L, 'Incertidumbre del oscilador: ΔxΔp = (n + ½)ħ: n = 0 → ħ/2 (mínima)', H.dxdp(0), 0.5, 0);
};
