module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  const g = C.gaps();
  T.eq(S, 'número de descubrimientos múltiples recogidos', g.length, R.gaps_n);
  T.abs(S, 'mediana del intervalo entre descubrimientos independientes (numpy.median)', C.median(g), R.gaps_median, 1e-12);
  T.abs(S, 'media del intervalo (numpy.mean)', g.reduce((a, b) => a + b, 0) / g.length, R.gaps_mean, 1e-12);
  T.ok(H, 'Merton: en la mitad de los casos los descubrimientos independientes se separan menos de un año', C.median(g) <= 1);
  T.ok(H, 'en más de dos tercios de los casos el intervalo es de 2 años o menos', g.filter((x) => x <= 2).length / g.length > 0.66);
  for (const [n, r, w, p] of R.psim) T.abs(S, `probabilidad de simultaneidad con n = ${n}, r = ${r}, w = ${w} (scipy.stats.expon)`, C.pSimultaneous(n, r, w), p, 1e-12);
  T.abs(S, 'Monte Carlo (numpy, 200 000 ensayos) frente a la fórmula cerrada', C.pSimultaneous(R.mc[0], R.mc[1], R.mc[2]), R.mc[3], 0.005);
  T.abs(N, 'Monte Carlo propio (semilla fija, 100 000 ensayos) frente a la fórmula', C.simSimultaneous(5, 0.2, 2, 100000, 11), C.pSimultaneous(5, 0.2, 2), 0.006);
  T.ok(N, 'cuantos más equipos independientes, más probable que dos coincidan', C.pSimultaneous(10, 0.2, 2) > C.pSimultaneous(3, 0.2, 2));
  T.ok(N, 'con un solo equipo no hay simultaneidad', C.pSimultaneous(1, 0.2, 2) === 0);
  T.eq(H, 'ejemplos de la ley de Stigler recogidos', C.STIGLER.length, 6);
};
