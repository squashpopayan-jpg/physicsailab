(function (root) {
  'use strict';
  const C = root.EM.calc;
  const PI = Math.PI;
  C.HBARC = 197.3269804; /* MeV·fm */
  C.GEVMB = 0.389379372; /* mb·GeV² */
  /* Yukawa: alcance R = ħc/(mc²) */
  C.yukawaRangeFm = (mMeV) => C.HBARC / mMeV;
  C.yukawaMassMeV = (Rfm) => C.HBARC / Rfm;
  /* Potencial de Yukawa frente a Coulomb (unidades arbitrarias): e^{-r/R}/r */
  C.yukawaV = (r, R) => Math.exp(-r / R) / r;
  /* Momento en la desintegración de dos cuerpos M → m1 + m2 */
  C.twoBodyP = (M, m1, m2) => Math.sqrt(Math.max(0, (M * M - (m1 + m2) * (m1 + m2)) * (M * M - (m1 - m2) * (m1 - m2)))) / (2 * M);
  /* Decuplete bariónico: espaciado igual en extrañeza (Gell-Mann 1962, Okubo) */
  C.DECUPLET = [['Δ', 0, 1232], ['Σ*', -1, 1385], ['Ξ*', -2, 1530]];
  C.omegaPredict = () => { const d = [C.DECUPLET[1][2] - C.DECUPLET[0][2], C.DECUPLET[2][2] - C.DECUPLET[1][2]]; return C.DECUPLET[2][2] + (d[0] + d[1]) / 2; };
  /* Breit–Wigner relativista para la producción de una resonancia en e⁺e⁻ (σ en nb) */
  C.Z = { M: 91187.6, G: 2495.2, Gee: 83.984, Ghad: 1744.4, Gll: 83.984, Ginv: 499.0, GnuSM: 167.2 };
  C.NB_PER_MEV2 = 3.89379372e11; /* 1 MeV⁻² en nb */
  C.sigmaHad = function (Ecm, Z, G) {
    G = G === undefined ? Z.G : G;
    const s = Ecm * Ecm, M = Z.M, br = (Z.Gee * Z.Ghad) / (G * G);
    return ((12 * PI) / (M * M)) * br * ((s * G * G) / ((s - M * M) * (s - M * M) + (s * s * G * G) / (M * M))) * C.NB_PER_MEV2;
  };
  /* Número de familias de neutrinos desde la anchura invisible */
  C.nNu = (Z) => (Z.G - Z.Ghad - 3 * Z.Gll) / Z.GnuSM;
  /* Anchura total con N familias */
  C.widthWithN = (Z, N) => Z.Ghad + 3 * Z.Gll + N * Z.GnuSM;
})(typeof window !== 'undefined' ? window : globalThis);
