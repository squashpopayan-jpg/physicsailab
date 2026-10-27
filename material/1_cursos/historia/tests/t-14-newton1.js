module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  const mt = C.moonTest(6371, 384400 / 6371, 27.321661);
  T.rel(S, 'prueba de la Luna: aceleración centrípeta (m/s²)', mt.aMoon, R.moon.a, 1e-12);
  T.abs(S, 'prueba de la Luna con r = 60.27 R: cociente a_Luna / (g/r²)', C.moonTest(6371, 60.27, 27.321661).ratio, R.moon.ratio, 1e-9);
  T.abs(H, 'prueba de la Luna con datos modernos: coincide dentro del 1 %', R.moon.ratio, 1, 0.01);
  T.abs(H, 'prueba de 1666 con 60 millas/grado: desacuerdo de ≈ 1/7 (0.86)', C.moonTest(5532, 60, 27.321661).ratio, R.ratio_mar, 5e-3);
  T.ok(H, 'con 60 millas/grado el desacuerdo es mayor que 10 %', Math.abs(R.ratio_mar - 1) > 0.1);
  T.abs(S, 'velocidad circular en la superficie (km/s)', C.circularSpeed(398600.4418, 6371), R.vc, 1e-9);
  T.abs(S, 'velocidad de escape en la superficie (km/s)', C.escapeSpeed(398600.4418, 6371), R.ve, 1e-9);
  T.abs(H, 'velocidad circular 7.9 km/s y de escape 11.2 km/s', C.escapeSpeed(398600.4418, 6371) / C.circularSpeed(398600.4418, 6371), Math.SQRT2, 1e-12);
  const o = C.centralOrbit(2, 1.2, 1, 40, 0.002);
  T.abs(S, 'órbita kepleriana (leapfrog frente a solve_ivp): radio mínimo', o.rmin, R.orbit.rmin, 1e-6);
  T.abs(S, 'órbita kepleriana: radio máximo', o.rmax, R.orbit.rmax, 1e-4);
  T.abs(N, 'conservación del momento angular (segunda ley de Kepler)', o.L / o.L0, 1, 1e-10);
  T.abs(H, 'órbita con v = 1.2: semieje de la fórmula vis-viva', (o.rmax + o.rmin) / 2, R.orbit.a, 1e-4);
  const per = o.apsides.filter((a) => a.kind === 'min');
  T.abs(H, 'tercera ley: periodo del leapfrog = 2π a^{3/2}', per[1].t - per[0].t, R.orbit.T, 0.01);
  T.ok(N, 'n = 2: la órbita es cerrada (ángulo entre mínimos = 2π)', Math.abs(per[1].theta - per[0].theta - 2 * Math.PI) < 5e-3);
  for (const n of [1.9, 2.1]) {
    const q = C.centralOrbit(n, 1.01, 1, 30, 0.002), m = q.apsides.filter((a) => a.kind === 'min');
    T.abs(S, 'ángulo entre perihelios con F ∝ r^-' + n + ' (solve_ivp)', m[1].theta - m[0].theta, R.apsidal[String(n)], 5e-3);
    T.abs(H, 'teorema de Newton (Principia I.44-45): 2π/√(3−n) para n = ' + n, m[1].theta - m[0].theta, R.apsidal_theory[String(n)], 0.02);
  }
  const hitLow = C.cannon(5, 100, 6000).hit, orbit = C.cannon(7.84, 100, 6000).hit;
  T.ok(H, 'cañón: a 5 km/s desde 100 km el proyectil cae', !!hitLow);
  T.ok(H, 'cañón: a 7.84 km/s desde 100 km (≈ velocidad circular) no toca el suelo en 1.5 vueltas', !orbit);
  T.ok(H, 'cañón: a 12 km/s escapa sin caer', !C.cannon(12, 100, 20000).hit);
};
