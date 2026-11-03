/* Cap. 12 — Efecto túnel y pozo finito */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const U = EM.fm.tun;
  chk(L, 'ħ²/2m_e = 0.0380998 eV·nm²', U.hb2m(), 0.0380998, 1e-6);
  for (const r of ref.barrier) {
    chk(S, `Transmisión de una barrera (E = ${r.E} eV, V₀ = ${r.V0} eV, a = ${r.a} nm): fórmula exacta frente a la integración numérica de la ecuación de Schrödinger (DOP853)`, U.T(r.E, r.V0, r.a), r.T, 1e-6);
    const sc = U.scatter(r.E, r.V0, r.a);
    chk(L, `Solución de dispersión (E = ${r.E} eV, V₀ = ${r.V0} eV, a = ${r.a} nm): T + R = 1 (conservación de la corriente)`, sc.T + sc.R, 1, 1e-9);
    chk(S, `Solución de dispersión (E = ${r.E} eV, V₀ = ${r.V0} eV, a = ${r.a} nm): T frente a la integración numérica`, sc.T, r.T, 1e-6);
  }
  { const sc = U.scatter(1.0, 5.0, 0.3), h = 1e-5;     /* continuidad de ψ y ψ′ en las dos interfaces */
    for (const x0 of [0, 0.3]) { const a1 = sc.psi(x0 - 1e-12), b1 = sc.psi(x0 + 1e-12); chk(L, `ψ continua en x = ${x0} nm`, Math.hypot(a1[0] - b1[0], a1[1] - b1[1]), 0, 1e-8, false); }
    const d = (x) => { const p = sc.psi(x + h), m = sc.psi(x - h); return [(p[0] - m[0]) / (2 * h), (p[1] - m[1]) / (2 * h)]; };
    for (const x0 of [0, 0.3]) { const a1 = d(x0 - 2 * h), b1 = d(x0 + 2 * h); chk(L, `ψ′ continua en x = ${x0} nm (derivada numérica)`, Math.hypot(a1[0] - b1[0], a1[1] - b1[1]), 0, 2e-3, false); } }
  chk(L, 'Barrera gruesa: T ≈ 16E(V₀ − E)/V₀² e^{−2κa} (E = 1 eV, V₀ = 5 eV, a = 2 nm) con error < 1 %', U.Tthick(1, 5, 2), U.T(1, 5, 2), 1e-2);
  chk(L, 'E = V₀: T = 1/(1 + mV₀a²/2ħ²) (V₀ = 5 eV, a = 0.4 nm)', U.T(5, 5, 0.4), 1 / (1 + (5 * 0.16) / (4 * U.hb2m())), 1e-12);
  chk(L, 'Resonancia sobre la barrera: T = 1 cuando k₂a = π (E > V₀)', U.T(5 + U.hb2m() * (Math.PI / 0.4) ** 2, 5, 0.4), 1, 1e-12);
  for (const r of ref.well) {
    const lv = U.wellLevels(r.V0, r.a);
    chk(L, `Pozo finito (V₀ = ${r.V0} eV, a = ${r.a} nm): el número de estados ligados ⌈2z₀/π⌉ coincide con el de la diagonalización`, lv.length, r.E.length, 0, false);
    lv.forEach((s, i) => chk(S, `Pozo finito (V₀ = ${r.V0} eV, 2a = ${2 * r.a} nm): E_${s.n} (${s.parity}) por bisección frente a la diagonalización de diferencias finitas (dx = 2a/2000, scipy.linalg.eigh_tridiagonal)`, s.E, r.E[i], 5e-5));
  }
  chk(L, 'Pozo infinito como límite: z₀ → ∞ da E_n → n²π²ħ²/(2m(2a)²) (V₀ = 10⁶ eV, a = 0.5 nm)', U.wellLevels(1e6, 0.5)[0].E, (Math.PI ** 2 * U.hb2m()) / 1, 1e-3);
  chk(S, 'STM: κ = √(2mφ)/ħ para φ = 4.5 eV: 10.87 nm⁻¹ frente a scipy.constants', U.kappaStm(4.5), ref.stm.kappa, 1e-6);
  chk(S, 'STM: I(d)/I(d + 0.1 nm) = e^{2κ·0.1 nm}: 8.8', U.stmRatio(4.5, 0.1), ref.stm.ratio_1A, 1e-6);
};
