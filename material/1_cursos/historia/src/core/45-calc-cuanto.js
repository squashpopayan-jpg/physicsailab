(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI;
  /* Radiancia espectral de cuerpo negro por unidad de longitud de onda (W sr⁻¹ m⁻³) */
  C.planckB = function (lam, T) {
    const x = (K.h * K.c) / (lam * K.kB * T);
    return ((2 * K.h * K.c * K.c) / Math.pow(lam, 5)) / Math.expm1(x);
  };
  C.rayleighB = (lam, T) => (2 * K.c * K.kB * T) / Math.pow(lam, 4);
  C.wienB = function (lam, T) {
    const x = (K.h * K.c) / (lam * K.kB * T);
    return ((2 * K.h * K.c * K.c) / Math.pow(lam, 5)) * Math.exp(-x);
  };
  /* Máximo de Planck: λ_max T = b, con x = hc/(λkT) solución de x = 5(1 − e^{-x}) */
  C.wienX = function () { let x = 5; for (let i = 0; i < 60; i++) x = 5 * (1 - Math.exp(-x)); return x; };
  C.wienB0 = () => (K.h * K.c) / (K.kB * C.wienX());
  C.wienLambda = (T) => C.wienB0() / T;
  /* Emitancia total πB integrada en λ (Simpson en x = hc/λkT): σT⁴ */
  C.stefanFromPlanck = function (T) {
    const n = 4000, xmax = 60; let s = 0;
    const f = (x) => (x < 1e-12 ? 0 : (x * x * x) / Math.expm1(x));
    for (let i = 0; i <= n; i++) { const x = (xmax * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * f(x); }
    s *= xmax / n / 3;
    return (2 * PI * Math.pow(K.kB * T, 4) * s) / (K.h * K.h * K.h * K.c * K.c);
  };
  /* Constantes de Planck de 1900 (obtenidas ajustando a Rubens y Kurlbaum) */
  C.PLANCK1900 = { h: 6.55e-34, k: 1.346e-23 };
  /* Efecto fotoeléctrico de Einstein */
  C.photoK = (nu, phiEv) => K.h * nu - phiEv * K.e; /* J; negativo → no hay emisión */
  C.stopV = (nu, phiEv) => Math.max(0, (K.h * nu) / K.e - phiEv);
  C.threshNu = (phiEv) => (phiEv * K.e) / K.h;
  /* Compton: Δλ = (h/mc)(1 − cos θ) */
  C.comptonShift = (theta) => (K.h / (K.me * K.c)) * (1 - Math.cos(theta));
  /* Calor específico de Einstein por mol de átomos */
  C.einsteinCV = function (T, thetaE) {
    const x = thetaE / T, ex = Math.exp(x);
    return 3 * K.kB * K.NA * x * x * ex / ((ex - 1) * (ex - 1));
  };
})(typeof window !== 'undefined' ? window : globalThis);
