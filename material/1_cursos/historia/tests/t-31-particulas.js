module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  T.abs(S, 'ħc = 197.327 MeV·fm', C.HBARC, R.hbarc, 1e-6);
  T.abs(H, 'Yukawa (1935): un alcance de 1.4 fm exige una partícula de ≈ 140 MeV', C.yukawaMassMeV(1.4), 141, 2);
  T.abs(H, 'el pión (139.57 MeV) tiene un alcance de 1.41 fm', C.yukawaRangeFm(139.57039), 1.414, 0.005);
  T.abs(N, 'el electrón (0.511 MeV) tendría un alcance de 386 fm (la longitud de Compton reducida)', C.yukawaRangeFm(0.51099895), 386.16, 0.05);
  T.ok(N, 'el potencial de Yukawa cae más rápido que el de Coulomb a distancias mayores que el alcance', C.yukawaV(5, 1.4) / (1 / 5) < 0.05);
  for (const [M, a, b, p] of R.twobody) T.rel(S, `momento de desintegración de dos cuerpos M = ${M}, m₁ = ${a}, m₂ = ${b} (mpmath)`, C.twoBodyP(M, a, b), p, 1e-9);
  T.abs(H, 'π⁺ → μ⁺ν: el muón sale con 29.8 MeV/c', C.twoBodyP(139.57039, 105.6583755, 0), 29.79, 0.02);
  T.abs(H, 'Gell-Mann (1962): del espaciado ≈ 148 MeV del decuplete, la masa del Ω⁻ es 1680 MeV', C.omegaPredict(), 1679.5, 1);
  T.abs(H, 'Barnes et al. (1964): el Ω⁻ medido tiene 1672 MeV, a menos de 0.5 % de la predicción', C.omegaPredict() / 1672.45 - 1, 0, 0.005);
  T.abs(S, 'pico del Z en e⁺e⁻ → hadrones: 41.5 nb', C.sigmaHad(C.Z.M, C.Z), R.bw_peak, 1e-6);
  T.abs(H, 'LEP: el pico hadrónico del Z mide 41.5 nb', C.sigmaHad(C.Z.M, C.Z), 41.5, 0.1);
  let lo = 0, hi = 0; for (let e = 80000; e < C.Z.M; e += 1) if (C.sigmaHad(e, C.Z) >= 0.5 * C.sigmaHad(C.Z.M, C.Z)) { lo = e; break; } for (let e = 100000; e > C.Z.M; e -= 1) if (C.sigmaHad(e, C.Z) >= 0.5 * C.sigmaHad(C.Z.M, C.Z)) { hi = e; break; }
  T.abs(S, 'anchura a media altura de la resonancia (brentq)', hi - lo, R.bw_fwhm, 3);
  T.abs(H, 'la anchura a media altura es ≈ Γ = 2.495 GeV', hi - lo, 2495, 40);
  T.abs(S, 'ajuste de Breit–Wigner (curve_fit): masa recuperada', R.bw_fit[0], 91187.6, 1e-3);
  T.abs(S, 'ajuste de Breit–Wigner (curve_fit): anchura recuperada', R.bw_fit[1], 2495.2, 1e-3);
  T.abs(S, 'número de familias de neutrinos a partir de la anchura invisible', C.nNu(C.Z), R.nnu, 1e-9);
  T.abs(H, 'LEP: N_ν = 2.984 ± 0.008 (tres familias)', C.nNu(C.Z), 2.984, 0.01);
  T.ok(N, 'con 4 familias el pico hadrónico sería más bajo y ancho que el medido', C.sigmaHad(C.Z.M, C.Z, C.widthWithN(C.Z, 4)) < 0.93 * C.sigmaHad(C.Z.M, C.Z));
};
