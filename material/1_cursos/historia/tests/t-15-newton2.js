module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  for (const lam of [656, 405]) {
    const n = C.cauchy(lam), r = R.prism[String(lam)];
    T.abs(S, 'dispersión de Cauchy a ' + lam + ' nm', n, r.n, 1e-12);
    T.abs(S, 'desviación mínima a ' + lam + ' nm (minimize_scalar), °', C.minDeviation(n, 60), r.delta, 1e-6);
    T.abs(S, 'desviación mínima a ' + lam + ' nm: la fórmula cerrada coincide con el barrido numérico del ángulo', C.prismDeviation(n, 60, r.i), r.delta, 1e-6);
  }
  T.abs(H, 'el violeta se desvía más que el rojo (abanico ≈ 1.4°)', C.minDeviation(C.cauchy(405), 60) - C.minDeviation(C.cauchy(656), 60), 1.4, 0.05);
  T.abs(S, 'anillo oscuro m = 1 (589 nm, R = 1 m), m', C.ringDark(1, 589, 1), R.ring.r1_589_1m, 1e-15);
  T.abs(S, 'anillo oscuro m = 10', C.ringDark(10, 589, 1), R.ring.r10, 1e-15);
  T.abs(H, 'Newton: 1/178 000 de pulgada corresponde a λ/4 → λ = 571 nm', R.newton_gap_lambda * 1e9, 571, 1);
  T.abs(H, 'Young (1801): rojo extremo 1/36 000 pulgada = 706 nm', R.young.rojo * 1e9, 706, 1);
  T.abs(H, 'Young (1801): violeta extremo 1/60 000 pulgada = 423 nm', R.young.violeta * 1e9, 423, 1);
  T.abs(H, 'Young: λ = 2d/m con d = λ/2 y m = 1', C.wavelengthFromGap(285.5, 1), 571, 1e-9);
  let mx = 0; for (let k = 0; k <= 30000; k++) mx = Math.max(mx, C.romerDelay((1.5 * k) / 30000, 299792.458));
  T.abs(S, 'retraso máximo del eclipse de Ío (círculos), minutos', mx, R.romer_max, 0.01);
  T.abs(H, '2 UA / c = 16.6 minutos', R.romer_2au, 16.65, 0.02);
  T.abs(H, 'Römer: 22 min y 138 millones de km dan 2.09×10⁵ km/s', C.romerC(138e6, 22), R.romer_c, 1e-6);
  T.ok(H, 'Römer subestimó c en ~30 %', Math.abs(C.romerC(138e6, 22) / 299792.458 - 0.70) < 0.01);
  T.abs(S, 'aberración: κ = arctan(v/c) en segundos de arco', C.aberration(29.78, 299792.458), R.aberr.kappa, 1e-9);
  T.abs(H, 'aberración: 20.5″', R.aberr.kappa, 20.5, 0.05);
  T.abs(S, 'c a partir de κ = 20.5″', C.aberrationC(29.78, 20.5), R.aberr.c_from_20_5, 1e-3);
  T.abs(H, 'tiempo de la luz del Sol a la Tierra: 499 s', R.aberr.t_sun, 499, 0.5);
  T.abs(H, 'elipse de aberración a 51.5° de latitud eclíptica: semieje menor ≈ 16″', Math.abs(C.aberrationPos(Math.PI / 2, 51.5, 20.49)[1]), R.aberr_ellipse_b, 1e-9);
};
