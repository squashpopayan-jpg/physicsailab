/* Cap. 1 — Relatividad: Michelson–Morley y reloj de luz */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const R = EM.fm.rel, c = EM.qm.K.c;
  for (const r of ref.mm) {
    for (const t of Object.keys(r.T)) {
      const th = +t * Math.PI / 180;
      chk(S, `Michelson–Morley: tiempo de ida y vuelta (L = ${r.L} m, β = ${r.b.toExponential(3)}, θ = ${t}°) frente a la solución numérica de la trayectoria (brentq)`, R.mmTime(r.L, r.b, th), r.T[t], 1e-12);
      chk(S, `Con contracción de FitzGerald–Lorentz (L = ${r.L} m, β = ${r.b.toExponential(3)}, θ = ${t}°): tiempo frente a la solución numérica`, R.mmTimeContracted(r.L, r.b, th), r.Tc[t], 1e-12);
    }
    chk(L, `Con contracción el desplazamiento de franjas es nulo para todo ángulo (L = ${r.L} m, β = ${r.b.toExponential(3)}); cota 1e-9 franjas`, Math.max(...[0, 20, 55, 90, 140].map((d) => Math.abs(R.mmFringe(r.L, r.lam, r.b, d * Math.PI / 180, true)))), 0, 1e-8, false);
  }
  /* aproximación 2Lβ²/λ */
  chk(L, 'Desplazamiento de Michelson–Morley 2Lβ²/λ con L = 11 m, λ = 550 nm, v = 29.78 km/s: 0.395 franjas', R.mmRotationShift(11, 550e-9, 29.78e3 / c), 0.3947, 2e-3);
  chk(L, 'Exacto frente a 2Lβ²/λ a primer orden (β = 10⁻⁴): coinciden a 10⁻⁴', R.mmRotationShift(11, 550e-9, 1e-4), R.mmRotationShiftApprox(11, 550e-9, 1e-4), 1e-4);
  for (const r of ref.lightclock) chk(S, `Reloj de luz (L = ${r.L} m, β = ${r.b}): periodo 2L/(c√(1−β²)) frente a la solución numérica del zigzag`, R.lightClockPeriod(r.L, r.b), r.T, 1e-12);
  /* γ */
  chk(Y, 'γ(β = 0.6) = 5/4 exacto', R.gamma(0.6), 1.25, 1e-15);
  chk(Y, 'γ(β = 0.8) = 5/3 exacto', R.gamma(0.8), 5 / 3, 1e-15);
  chk(L, 'β(γ) y γ(β) son inversas (γ = 7.0888)', R.gamma(R.betaFromGamma(7.0888)), 7.0888, 1e-13);
  chk(L, '1 − β estable para γ = 10⁶ frente a mpmath: 5×10⁻¹³', R.oneMinusBeta(1e6), ref.omb_1e6, 1e-9);
  /* simultaneidad: Δt′ = −γ v Δx/c² */
  chk(L, 'Δt′ = −γvΔx/c² con β = 0.6 y Δx = 160 m: −4.0028×10⁻⁷ s', R.simultaneityShift(160, 0.6), -1.25 * 0.6 * 160 / (c * 1), 1e-12);
  { const b = 0.6, g = R.gamma(b); const [x1, t1] = R.boost(80, 0, b), [x2, t2] = R.boost(-80, 0, b);
    chk(L, 'Los dos rayos simultáneos en S (±80 m) llegan con Δt′ = γvΔx/c² entre ellos', t1 - t2, R.simultaneityShift(160, b), 1e-12);
    chk(L, 'La separación en S′ de los dos sucesos es γΔx = 200 m (longitud propia del tren)', x1 - x2, g * 160, 1e-12); }
};
