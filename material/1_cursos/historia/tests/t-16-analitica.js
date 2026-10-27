module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  const cy = C.cycloidFit(1.5, 0.6);
  T.abs(S, 'cicloide: θ final (brentq)', cy.th, R.cyc.th, 1e-9);
  T.abs(S, 'cicloide: tiempo de descenso', cy.T, R.cyc.T, 1e-9);
  T.abs(S, 'recta: tiempo de descenso', C.timeStraight(1.5, 0.6), R.straight, 1e-12);
  const k = 0.6 / Math.sqrt(1.5), Rc = C.circleThrough(1.5, 0.6);
  T.abs(S, 'parábola: tiempo (quad)', C.timeAlong((x) => k * Math.sqrt(x), (x) => k / (2 * Math.sqrt(Math.max(x, 1e-300))), 1.5), R.parab, 2e-4);
  T.abs(S, 'arco circular: tiempo (quad)', C.timeAlong((x) => Math.sqrt(2 * Rc * x - x * x), (x) => (Rc - x) / Math.sqrt(Math.max(1e-300, 2 * Rc * x - x * x)), 1.5), R.circle, 2e-4);
  T.ok(H, 'braquistócrona: la cicloide es más rápida que el arco circular, la parábola y la recta', cy.T < R.circle && cy.T < R.parab && cy.T < R.straight);
  T.abs(H, 'braquistócrona: ahorro de ≈ 25 % frente a la recta', 100 * (1 - cy.T / R.straight), 25, 1.5);
  T.abs(S, 'Cavendish: G con θ = 1 mrad', C.cavendishG(1.86, 1e-3, 0.2257, 158, 420), R.cav.G, 1e-12);
  T.abs(H, 'Cavendish: ese G está dentro del 5 % del valor actual', C.cavendishG(1.86, 1e-3, 0.2257, 158, 420) / 6.674e-11, 1, 0.05);
  T.rel(S, 'masa de la Tierra con G actual', C.earthMass(6.674e-11), R.earth.M, 1e-12);
  T.abs(H, 'densidad de la Tierra con G de Cavendish (6.74×10⁻¹¹): 5.45 g/cm³', C.earthDensity(6.74e-11) / 1000, 5.45, 0.02);
  T.abs(H, 'densidad de la Tierra: 5.5 g/cm³', R.earth.rho / 1000, 5.5, 0.05);
  let s = [1.0, 0.5, 0, 0]; const e0 = C.doublePendulumEnergy(s, 1, 1, 1, 1);
  for (let i = 0; i < 1000; i++) s = C.rk4((x) => C.doublePendulum(x, 1, 1, 1, 1), s, 0.002);
  s.forEach((v, i) => T.abs(S, 'péndulo doble (solve_ivp), variable ' + i + ' tras 2 s', v, R.dp[i], 1e-6));
  T.abs(N, 'péndulo doble: conservación de la energía', Math.abs((C.doublePendulumEnergy(s, 1, 1, 1, 1) - e0) / e0), 0, 1e-7);
  let a = [2.0, 2.0, 0, 0], b = [2.0 + 1e-6, 2.0, 0, 0];
  for (let i = 0; i < 5000; i++) { a = C.rk4((x) => C.doublePendulum(x, 1, 1, 1, 1), a, 0.002); b = C.rk4((x) => C.doublePendulum(x, 1, 1, 1, 1), b, 0.002); }
  T.ok(H, 'caos: tras 10 s una diferencia inicial de 10⁻⁶ rad se ha amplificado más de 1000 veces', Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-3);
  T.abs(H, 'Neptuno: periodo por la tercera ley ≈ 165 años', R.nep.T, 165.2, 0.3);
  T.abs(H, 'esfera uniforme: la atracción equivale a la masa en el centro (cuadratura)', R.shell.F, R.shell.point, 1e-9);
};
