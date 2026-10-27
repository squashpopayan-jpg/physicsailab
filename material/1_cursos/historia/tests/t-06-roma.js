module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  T.abs(H, 'calendario juliano: 9.8 días de adelanto entre 325 y 1582 (reforma de 10 días)', C.calendarDrift('juliano', 1257), R.juliano_drift_1257, 1e-9);
  T.abs(H, 'el desfase juliano acumulado en 1257 años redondea a 10 días', Math.round(C.calendarDrift('juliano', 1257)), 10, 0);
  T.abs(H, 'año gregoriano medio = 365.2425 d', C.yearLength.gregoriano, R.greg_mean, 1e-12);
  T.eq(H, '97 bisiestos en 400 años (2000-2399)', [...Array(400).keys()].filter((i) => C.gregorianLeap(2000 + i)).length, R.greg_leap_count_400);
  T.abs(H, 'gregoriano: un día de error cada ~3 200 años', 1 / Math.abs(C.calendarDrift('gregoriano', 1)), 3226, 5);
  const m = C.randomWalkMSD(2000, 100, 1, 7)[100];
  T.rel(S, 'caminata aleatoria 2D: MSD tras 100 pasos = 2σ²t (esperado, 4 % estadístico)', m, 200, 0.06);
  T.rel(S, 'caminata aleatoria: JS frente a NumPy (20 000 partículas)', m, R.msd_np_100, 0.07);
  const msd = C.randomWalkMSD(2000, 200, 1, 3);
  T.rel('Numérico', 'MSD lineal en el tiempo: MSD(200)/MSD(100) = 2', msd[200] / msd[100], 2, 0.1);
};
