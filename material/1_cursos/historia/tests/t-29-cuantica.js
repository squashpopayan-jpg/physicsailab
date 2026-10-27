module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico', K = C.K;
  for (const [E, l] of R.dbl) T.rel(S, `longitud de onda de de Broglie de un electrón de ${E} eV (scipy.constants)`, C.deBroglieNm(E), l, 1e-9);
  T.abs(H, 'Davisson y Germer (1927): 54 eV dan λ = 0.167 nm', C.deBroglieNm(54), 0.167, 0.001);
  T.abs(S, 'Davisson–Germer: ángulo del primer máximo con d = 0.215 nm', C.davissonAngle(54, 0.215), R.dg_theta, 1e-9);
  T.abs(H, 'el pico medido por Davisson y Germer está a 50° (la teoría da 50.0°)', (C.davissonAngle(54, 0.215) * 180) / Math.PI, 50, 1);
  R.box.forEach((e, i) => T.rel(S, 'pozo infinito de 1 nm: E' + (i + 1) + ' = ' + (i + 1) ** 2 + '·0.376 eV', C.boxE(i + 1, 1e-9) / K.e, e, 1e-9));
  const osc = C.schrodinger1D((x) => 0.5 * x * x, -8, 8, 800, 5).E;
  osc.forEach((v, i) => T.abs(S, 'oscilador armónico: nivel ' + i + ' frente a scipy.linalg.eigh_tridiagonal', v, R.osc[i], 1e-9));
  osc.forEach((v, i) => T.abs(N, 'oscilador armónico: nivel ' + i + ' frente a ħω(n + ½)', v, i + 0.5, 1e-3));
  const well = C.schrodinger1D(() => 0, 0, 1, 400, 4).E;
  well.forEach((v, i) => T.abs(S, 'pozo infinito numérico: nivel ' + (i + 1) + ' frente a scipy', v, R.well[i], 1e-8));
  well.forEach((v, i) => T.rel(N, 'pozo infinito: n²π²/2 con ' + (i + 1) + ' frente a la fórmula', v, ((i + 1) ** 2 * Math.PI * Math.PI) / 2, 2e-4));
  const hy = C.hydrogenS(60, 3000, 4);
  hy.forEach((v, i) => T.abs(S, 'hidrógeno (l = 0) numérico: nivel n = ' + (i + 1) + ' frente a scipy', v, R.hyd[i], 1e-9));
  T.abs(H, 'hidrógeno: E₁ = −0.5 hartree (−13.6 eV) con 1 % de error de malla', hy[0], -0.5, 0.005);
  T.abs(H, 'hidrógeno: E₂ = −1/8 hartree', hy[1], -0.125, 0.002);
  const dw = C.schrodinger1D((x) => 2 * Math.pow(x * x - 1, 2), -3, 3, 600, 4).E;
  dw.forEach((v, i) => T.abs(S, 'doble pozo: nivel ' + i + ' frente a scipy', v, R.dw[i], 1e-9));
  T.ok(N, 'doble pozo: los dos primeros niveles forman un doblete (diferencia < 0.3 de la separación al siguiente)', dw[1] - dw[0] < 0.3 * (dw[2] - dw[1]));
  /* incertidumbre */
  const x = Array.from({ length: 4000 }, (_, i) => (i + 0.5) / 4000), psi = x.map((t) => Math.sqrt(2) * Math.sin(Math.PI * t));
  const u = C.uncertainty(x, psi);
  T.abs(S, 'pozo infinito: Δx·Δp del estado fundamental frente a quad', u.dx * u.dp, R.box_unc, 3e-4);
  T.abs(H, 'Δx Δp ≥ ħ/2: en el pozo el producto es 0.568 ħ', u.dx * u.dp, 0.568, 0.001);
  const xs = Array.from({ length: 6000 }, (_, i) => -15 + (i + 0.5) * 0.005), g = xs.map((t) => Math.exp(-t * t / 4));
  const ug = C.uncertainty(xs, g);
  T.abs(N, 'paquete gaussiano: Δx·Δp = ħ/2 (mínimo de incertidumbre)', ug.dx * ug.dp, 0.5, 1e-4);
};
