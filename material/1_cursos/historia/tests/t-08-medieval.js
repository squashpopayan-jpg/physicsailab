module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', DEG = Math.PI / 180;
  for (const [key, v] of Object.entries(R.rainbow)) {
    const [n, k] = key.split('_').map(Number);
    T.abs(S, 'arcoíris n=' + n + ', ' + k + ' reflexión(es): incidencia mínima (minimize_scalar), °', C.rainbowIncidence(n, k) / DEG, v.i, 1e-5);
    T.abs(S, 'arcoíris n=' + n + ', k=' + k + ': ángulo del arco (°)', C.rainbowAngle(n, k), v.ang, 1e-5);
  }
  T.abs(H, 'arcoíris primario ≈ 42° (Descartes)', C.rainbowAngle(1.333, 1), 42.0, 0.2);
  T.abs(H, 'arcoíris secundario ≈ 51° (Descartes)', C.rainbowAngle(1.333, 2), 51.0, 0.3);
  T.ok(H, 'el rojo está más lejos del punto antisolar que el violeta (arco primario)', C.rainbowAngle(1.331, 1) > C.rainbowAngle(1.344, 1));
  T.ok(H, 'en el arco secundario el orden de colores se invierte', C.rainbowAngle(1.331, 2) < C.rainbowAngle(1.344, 2));
  T.rel(S, 'regla de Merton frente a la integral (quad)', C.mertonDistance(5, 4), R.merton_s, 1e-12);
  T.rel(H, 'velocidad media × tiempo = ½ a t²', C.meanSpeedDistance(0, 20, 4), R.merton_mean, 1e-12);
  T.eq(H, 'distancias por intervalo: números impares (Galileo)', C.oddDistances(7), R.odd);
  for (const k of [4, 10, 16]) T.rel(S, 'serie armónica con 2^' + k + ' términos', C.harmonic(Math.pow(2, k)), R.harm[String(k)], 1e-11);
  T.ok(H, 'cota de Oresme: H(2^k) ≥ 1 + k/2 para k = 0..20', [...Array(21).keys()].every((k) => C.harmonic(Math.pow(2, k)) >= C.oresmeBound(Math.pow(2, k)) - 1e-12));
  T.ok(H, 'la serie armónica supera 10 en el término 12 367 (y no en el 12 366)', R.harm_12367[0] < 10 && R.harm_12367[1] > 10);
  T.abs(H, 'Bradwardine: doblar v exige elevar al cuadrado F/R', Math.log(4) / Math.log(2), 2 * (Math.log(2) / Math.log(2)), 1e-12);
};
