/* Cap. 2 — Transformación de Lorentz */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const R = EM.fm.rel, c = EM.qm.K.c;
  for (const r of ref.boost_chain) {
    /* composición de impulsos frente a producto de matrices; se comprueba con el suceso (x = 1 m, ct = 2 m) */
    const [xp, tp] = R.boostChain(1, 2 / c, r.betas), x0 = r.M[0][0] * 2 + r.M[0][1] * 1, xx = r.M[1][0] * 2 + r.M[1][1] * 1;
    chk(S, `Composición de impulsos β = (${r.betas.join(', ')}): ct′ frente al producto de matrices (numpy)`, c * tp, x0, 1e-12);
    chk(S, `Composición de impulsos β = (${r.betas.join(', ')}): x′ frente al producto de matrices (numpy)`, xp, xx, 1e-12);
    chk(Y, `Composición de impulsos β = (${r.betas.join(', ')}): el intervalo es invariante`, R.interval(xp, tp), R.interval(1, 2 / c), 1e-11);
    chk(L, `Composición de velocidades β = (${r.betas.join(', ')}): suma de rapideces frente a la fórmula (u + v)/(1 + uv) aplicada en cadena`, r.betas.reduce((a, b) => R.velAdd(a, b)), r.w, 1e-12);
  }
  for (const r of ref.fizeau) chk(S, `Arrastre de Fizeau (n = ${r.n}, v = ${r.v} m/s): (c/n + v)/(1 + v/nc) frente al impulso de Lorentz del par de sucesos`, R.fizeauU(r.n, r.v), r.u, 1e-12);
  chk(Y, 'Coeficiente de arrastre de Fresnel 1 − 1/n² = derivada de u(v) en v = 0 (SymPy, n = 1.333)', R.fizeauCoef(1.333), ref.fizeau_series_coef, 1e-12);
  chk(L, 'Aparato de Fizeau (L = 1.4871 m, v = 7.059 m/s, 526 nm, n = 1.333): 0.207 franjas', R.fizeauFringes(1.4871, 526e-9, 1.333, 7.059), 0.20687, 1e-4);
  chk(L, 'La luz en el vacío: c es invariante, (1 + c)/(1 + c) → velAdd(1, v) = 1 para cualquier v', R.velAdd(1, 0.77), 1, 1e-15);
  chk(L, 'Velocidades pequeñas: velAdd(1e-4, 2e-4) ≈ suma galileana con error de orden uv', R.velAdd(1e-4, 2e-4), 3e-4, 1e-7);
  chk(L, 'La rapidez de N impulsos: velAddN(3, 0.5) = 13/14', R.velAddN(3, 0.5), 13 / 14, 1e-13);
  /* muones */
  const mu = ref.muon;
  chk(L, 'Vida media del muón (PDG, paquete `particle`): 2.19698 µs', mu.tau, 2.196981e-6, 1e-6);
  for (const r of ref.muon_surv) {
    chk(S, `Supervivencia de muones (h = ${r.h} m, γ = ${r.g}) con dilatación: frente a exp(−t′/τ) calculada en el sistema del muón`, R.survival(r.h, r.g, mu.tau, true), r.S, 1e-12);
  }
  chk(L, 'Longitud de desintegración β γ c τ (γ = 15.8193): 10.398 km', R.decayLength(15.819299929, mu.tau) / 1e3, 10.3984, 1e-5);
  chk(L, 'Sin dilatación, la supervivencia en 15 km a β = 0.998 es 1.2×10⁻¹⁰', R.survival(15e3, 15.819299929, mu.tau, false), 1.2287e-10, 1e-4);
  chk(L, 'Contracción de longitudes L = L₀/γ (β = 0.8): 60 m', R.lengthContraction(100, 0.8), 60, 1e-14);
};
