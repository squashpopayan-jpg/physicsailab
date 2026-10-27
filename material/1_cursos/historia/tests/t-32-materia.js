module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const [P, e] of R.kp) { const b = C.kpBands(P, 3 * Math.PI + 0.3), flat = []; b.forEach((x) => flat.push(x[0], x[1])); const ref = e.filter((v) => v < Math.pow(3 * Math.PI + 0.3, 2) - 1e-9);
    ref.forEach((v, i) => { if (flat[i] !== undefined) T.abs(S, `Kronig–Penney (P = ${P.toFixed(2)}): borde ${i + 1} (brentq)`, flat[i], v, 5e-3); }); }
  T.ok(H, 'Kronig–Penney: con P → 0 los bordes de banda son los de los electrones libres (nπ)²', Math.abs(C.kpBands(1e-3, 7)[0][1] - Math.PI * Math.PI) < 0.1);
  T.ok(N, 'Kronig–Penney: la primera banda se estrecha al aumentar P (barreras más opacas)', (() => { const w = (P) => { const b = C.kpBands(P, 3.5)[0]; return b[1] - b[0]; }; return w(1) > w(3) && w(3) > w(8); })());
  T.ok(N, 'Kronig–Penney: hay al menos dos bandas separadas por una brecha prohibida con P = 3π/2', C.kpBands(3 * Math.PI / 2, 7).length >= 2);
  T.abs(S, 'tensión térmica kT/e a 300 K = 25.85 mV', C.VT(300), R.vt300, 1e-9);
  for (const [v, i] of R.diode) T.rel(S, `ecuación del diodo de Shockley a ${v} V (numpy)`, C.diodeI(v, 1e-12, 1, 300), i, 1e-9);
  T.ok(H, 'un diodo de silicio rectifica: I(+0.6 V)/|I(−0.6 V)| > 10⁸', C.diodeI(0.6, 1e-12, 1, 300) / Math.abs(C.diodeI(-0.6, 1e-12, 1, 300)) > 1e8);
  T.abs(S, 'ley de Moore: tiempo de duplicación por regresión log₂ (numpy.polyfit)', C.doublingTime(C.MOORE.filter((d) => d[0] <= 2020)), R.moore_T2, 1e-6);
  T.abs(H, 'Moore (1965, revisada 1975): los transistores se duplican cada ≈ 2 años', C.doublingTime(C.MOORE), 2, 0.4);
  for (const [g, d0, tc] of R.bcs) { T.rel(S, `BCS: Δ(0) = ħω/senh(1/NV), g = ${g}`, C.bcsDelta0(g), d0, 1e-12); T.rel(S, `BCS: temperatura crítica (quad + brentq), g = ${g}`, C.bcsTc(g), tc, 2e-3); }
  T.abs(H, 'BCS (1957): la razón Δ(0)/k_BT_c tiende a 1.764 (acoplamiento débil)', C.bcsDelta0(0.2) / C.bcsTc(0.2), 1.764, 0.03);
  T.abs(S, 'límite π/e^γ = 1.7639 de la razón', R.bcs_ratio_limit, 1.7639, 1e-4);
  const [tau, G, tauc, beta, Rp, n, p] = R.laser, ss = C.laserSS(Rp, tau, G, tauc, beta);
  T.rel(S, 'láser: inversión estacionaria (integración Radau frente al balance)', ss.n, n, 2e-3);
  T.rel(S, 'láser: número de fotones estacionario', ss.phi, p, 2e-3);
  T.abs(N, 'por encima del umbral la inversión se «ancla» en n_th = 1/(Gτ_c)', ss.n / ss.nth, 1, 1e-3);
  T.ok(N, 'la salida crece más de 100 veces entre justo por debajo y justo por encima del umbral', C.laserSS(1.5 * C.laserSS(0, 1, 1, 0.01, 1e-4).nth, 1, 1, 0.01, 1e-4).phi / C.laserSS(0.5 * 100, 1, 1, 0.01, 1e-4).phi > 100);
  T.rel(S, 'relación de Einstein A₂₁/B₂₁ = 8πhν³/c³ a 500 nm', C.einsteinRatio(C.K.c / 500e-9), R.A_over_B_500nm, 1e-9);
  T.abs(H, 'Maiman (1960): láser de rubí a 694.3 nm = 1.786 eV', 1239.84 / 694.3, 1.786, 0.001);
};
