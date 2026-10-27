(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  C.U_MEV = 931.49410242; /* MeV por u */
  /* Fórmula semiempírica de masas (Weizsäcker 1935; constantes de Rohlf): B en MeV */
  C.bindingSEMF = function (Z, A) {
    const N = A - Z, aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
    let d = 0; if (Z % 2 === 0 && N % 2 === 0) d = aP / Math.sqrt(A); else if (Z % 2 === 1 && N % 2 === 1) d = -aP / Math.sqrt(A);
    return aV * A - aS * Math.pow(A, 2 / 3) - (aC * Z * (Z - 1)) / Math.pow(A, 1 / 3) - (aA * (A - 2 * Z) * (A - 2 * Z)) / A + d;
  };
  /* Datos: [nombre, Z, A, B/A (MeV)] */
  C.BINDING = [['⁴He', 2, 4, 7.0739], ['¹²C', 6, 12, 7.6801], ['¹⁶O', 8, 16, 7.9762], ['⁴⁰Ca', 20, 40, 8.5513], ['⁵⁶Fe', 26, 56, 8.7903], ['⁶²Ni', 28, 62, 8.7945], ['¹⁰⁷Ag', 47, 107, 8.5543], ['¹²⁰Sn', 50, 120, 8.5045], ['²⁰⁸Pb', 82, 208, 7.8675], ['²³⁵U', 92, 235, 7.5909], ['²³⁸U', 92, 238, 7.5701]];
  /* Masas atómicas (u) */
  C.MASS = { n: 1.00866491595, H1: 1.00782503223, U235: 235.0439299, Ba141: 140.914411, Kr92: 91.926156 };
  C.fissionQ = () => (C.MASS.U235 + C.MASS.n - C.MASS.Ba141 - C.MASS.Kr92 - 3 * C.MASS.n) * C.U_MEV;
  /* Exponente de Gamow 2G = 2∫√(2μ(V−E))/ħ dr entre R y b, en forma cerrada con x = R/b */
  C.gamowExact = function (Zd, EMeV, RfmIn) {
    const mu = 4.001506179127 * 1.66053906660e-27, hbar = K.h / (2 * PI), Ej = EMeV * 1e6 * K.e, k = 8.9875517923e9 * 2 * Zd * K.e * K.e, b = k / Ej, R = RfmIn * 1e-15, x = R / b;
    return ((2 * Math.sqrt(2 * mu * Ej) * b) / hbar) * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
  };
  /* Reacción en cadena: probabilidad de extinción de un proceso ramificado de Poisson con media k */
  C.extinction = function (k) { if (k <= 1) return 1; let q = 0.5; for (let i = 0; i < 400; i++) q = Math.exp(k * (q - 1)); return q; };
  /* Taylor: radio de la bola de fuego R = ξ (E t²/ρ)^(1/5); devuelve E con ξ = 1.033 */
  C.taylorYield = (R, t, rho, xi) => (rho * Math.pow(R, 5)) / (Math.pow(xi || 1.033, 5) * t * t);
  /* Datos de Trinity (t en ms, R en m) tomados de las fotografías publicadas en 1947 */
  C.TRINITY = [[0.1, 11.1], [0.24, 19.9], [0.38, 25.4], [0.52, 28.8], [0.66, 31.9], [0.8, 34.2], [0.94, 36.3], [1.08, 38.9], [1.22, 41.0], [1.36, 42.8], [1.5, 44.4], [1.65, 46.0], [1.79, 46.9], [1.93, 48.7], [3.26, 59.0], [3.53, 61.1], [3.8, 62.9], [4.07, 64.3], [4.34, 65.6], [4.61, 67.3], [15.0, 106.5], [25.0, 130.0], [34.0, 145.0], [53.0, 175.0], [62.0, 185.0]];
  C.linfit = function (xs, ys) { const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); } const m = sxy / sxx; return { m, b: my - m * mx }; };
  C.KT = 4.184e12; /* J por kilotón */
})(typeof window !== 'undefined' ? window : globalThis);
