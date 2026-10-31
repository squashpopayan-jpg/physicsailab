/* ===================================================================
   49-qm-fina.js — Estructura fina e hiperfina del hidrógeno (EM.qm.fine). Unidades atómicas: energías en hartree.
   Correcciones de orden α²: cinética relativista, espín–órbita y Darwin; energía exacta de Dirac; diagrama de Breit–Rabi.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Fn = (qm.fine = {});
  Fn.alpha = 7.2973525693e-3;
  Fn.hartreeGHz = 6579683.920502; /* 1 hartree en GHz (E/h) */
  /* Bohr: E = −Z²/2n² */
  Fn.bohr = (n, Z = 1) => -(Z * Z) / (2 * n * n);
  /* Corrección cinética relativista −p⁴/8m³c²: −(Z⁴α²/2n⁴)[n/(l + ½) − 3/4] */
  Fn.kin = (n, l, Z = 1) => -((Z ** 4) * Fn.alpha ** 2 / (2 * n ** 4)) * (n / (l + 0.5) - 0.75);
  /* Espín–órbita: (Z⁴α²/2n³) [j(j + 1) − l(l + 1) − 3/4] / [2 l (l + ½)(l + 1)]  (l ≥ 1; para l = 0 vale 0) */
  Fn.so = (n, l, j, Z = 1) => (l === 0 ? 0 : ((Z ** 4) * Fn.alpha ** 2 / (2 * n ** 3)) * (j * (j + 1) - l * (l + 1) - 0.75) / (2 * l * (l + 0.5) * (l + 1)));
  /* Darwin: (Z⁴α²/2n³) δ_{l0} */
  Fn.darwin = (n, l, Z = 1) => (l === 0 ? (Z ** 4) * Fn.alpha ** 2 / (2 * n ** 3) : 0);
  /* Suma de las tres: = −(Z⁴α²/2n⁴)[n/(j + ½) − 3/4] */
  Fn.fine = (n, l, j, Z = 1) => Fn.kin(n, l, Z) + Fn.so(n, l, j, Z) + Fn.darwin(n, l, Z);
  Fn.fineJ = (n, j, Z = 1) => -((Z ** 4) * Fn.alpha ** 2 / (2 * n ** 4)) * (n / (j + 0.5) - 0.75);
  /* Energía exacta de Dirac (sin la energía en reposo), en hartree: [(1 + (Zα)²/(n − δ)²)^{-1/2} − 1]/α² con δ = j + ½ − √((j + ½)² − (Zα)²) */
  Fn.dirac = function (n, j, Z = 1) {
    const a = Fn.alpha, za = Z * a, d = j + 0.5 - Math.sqrt((j + 0.5) ** 2 - za * za);
    return (1 / Math.sqrt(1 + (za * za) / ((n - d) ** 2)) - 1) / (a * a);
  };
  /* Hiperfino del 1s del hidrógeno (energía de Fermi): (4/3) g_p (mₑ/m_p) α⁴ mₑc² (hartree: dividir por mₑc²α² = 1 hartree·…) en eV */
  Fn.hfFermi = (gp = 5.5856946893, mr = 1 / 1836.15267343) => (4 / 3) * gp * mr * Fn.alpha ** 4 * 510998.95;
  /* Breit–Rabi del 1s del hidrógeno: H = a S·I + b_e S_z − b_p I_z con a = ΔE_hf; devuelve [E(F=1,m=1), E(F=1,m=0), E(F=1,m=−1), E(F=0,m=0)] según el nivel continuo */
  Fn.breitRabi = function (a, be, bp) {
    const r = Math.sqrt((a / 2) ** 2 + ((be + bp) / 2) ** 2);
    return { up: a / 4 + (be - bp) / 2, dn: a / 4 - (be - bp) / 2, m0hi: -a / 4 + r, m0lo: -a / 4 - r };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
})(typeof window !== 'undefined' ? window : globalThis);
