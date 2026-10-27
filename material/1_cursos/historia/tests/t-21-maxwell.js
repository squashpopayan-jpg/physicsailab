module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  T.rel(S, 'c = 1/√(μ₀ε₀) con scipy.constants', C.cFromConstants(C.MU0, C.EPS0), R.c, 1e-9);
  T.abs(H, 'c = 299 792 458 m/s (el valor exacto a 7 cifras)', C.cFromConstants(C.MU0, C.EPS0), 299792458, 1);
  T.abs(H, 'Weber y Kohlrausch: +3.6 % sobre c', R.c_err.WK, 0.0366, 0.0005);
  T.abs(H, 'Fizeau: +5.2 % sobre c', R.c_err.Fizeau, 0.0517, 0.0005);
  T.ok(H, 'las medidas de c convergen al valor actual con errores decrecientes (1849 a 1983)', C.CMEAS.filter((m) => m[0] >= 1849).every((m, i, a) => i === 0 || m[2] <= a[i - 1][2] || m[0] === 1868));
  for (const n of [1.5, 2, 3]) T.abs(S, 'Fresnel: reflectancia a incidencia normal con n = ' + n, C.fresnelNormal(1, n).R, R.fresnel[n.toFixed(1)], 1e-12);
  T.abs(H, 'vidrio: 4 % de reflexión', C.fresnelNormal(1, 1.5).R, 0.04, 1e-12);
  T.abs(S, 'frecuencia del oscilador LC (300 nH, 95 pF)', C.lcFrequency(300e-9, 95e-12), R.lc, 1e-3);
  T.abs(H, 'longitud de onda del oscilador de Hertz ≈ 10 m', C.CLIGHT / R.lc, 10.06, 0.05);
  const N1 = 900, eps = new Float64Array(N1).fill(1); for (let i = 450; i < N1; i++) eps[i] = 2.25;
  const r = C.fdtd1d(N1, 1001, eps, 100, 30, [1000]), E = r.snaps[0];
  let mt = 0, mr = 0; for (let i = 470; i < 800; i++) mt = Math.max(mt, Math.abs(E[i])); for (let i = 120; i < 430; i++) mr = Math.max(mr, Math.abs(E[i]));
  T.abs(S, 'FDTD frente a una versión independiente en NumPy: amplitud transmitida', mt, R.fdtd.T, 1e-9);
  T.abs(S, 'FDTD frente a NumPy: amplitud reflejada', mr, R.fdtd.R, 1e-9);
  T.abs(N, 'FDTD: la amplitud transmitida coincide con 2n₁/(n₁+n₂) = 0.8 (pulso ancho)', mt, 0.8, 0.03);
  T.abs(N, 'FDTD: la amplitud reflejada coincide con |n₁−n₂|/(n₁+n₂) = 0.2', mr, 0.2, 0.02);
  /* velocidad de un pulso en vacío: c = 1 celda cada 2 pasos con S = 0.5 */
  const epsv = new Float64Array(600).fill(1), a = C.fdtd1d(600, 400, epsv, 50, 10, [250, 350]);
  const pk = (E) => { let m = 0, im = 0; for (let i = 60; i < 600; i++) if (E[i] > m) { m = E[i]; im = i; } return im; };
  T.abs(N, 'FDTD en el vacío: el pulso avanza 50 celdas en 100 pasos (c = 0.5 celda/paso)', pk(a.snaps[1]) - pk(a.snaps[0]), 50, 1);
};
