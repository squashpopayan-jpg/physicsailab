(function (root) {
  'use strict';
  const C = root.EM.calc;
  /* Interferómetro de Michelson con viento de éter v. Tiempos de ida y vuelta de un brazo de longitud L.
     Paralelo: 2L/c · 1/(1−β²); perpendicular: 2L/c · 1/√(1−β²). */
  C.mmTimes = function (L, v, contraction) {
    const c = C.CLIGHT, b2 = (v * v) / (c * c), g = contraction ? Math.sqrt(1 - b2) : 1;
    return { par: ((2 * L * g) / c) / (1 - b2), perp: (2 * L) / c / Math.sqrt(1 - b2) };
  };
  /* Diferencia de camino entre los brazos (m): c·(t∥ − t⊥) = 2L·β²/((1+s)(1−β²)), con s = √(1−β²), sin cancelación */
  C.mmPathDiff = function (L, v, contraction) {
    if (contraction) return 0;
    const c = C.CLIGHT, b2 = (v * v) / (c * c), s = Math.sqrt(1 - b2);
    return (2 * L * b2) / ((1 + s) * (1 - b2));
  };
  /* Desplazamiento de franjas al girar el aparato 90° (la diferencia cambia de signo): 2Δ/λ */
  C.mmFringeShift = (L, v, lam, contraction) => (2 * C.mmPathDiff(L, v, contraction)) / lam;
  /* Aproximación de segundo orden */
  C.mmFringeApprox = (L, v, lam) => (2 * L * v * v) / (C.CLIGHT * C.CLIGHT * lam);
  /* Variación con el ángulo φ del brazo respecto del viento (segundo orden en β): L β² cos 2φ / λ */
  C.mmFringeAngle = (L, v, lam, phi) => (L * v * v * Math.cos(2 * phi)) / (C.CLIGHT * C.CLIGHT * lam);
  /* Velocidad máxima compatible con un desplazamiento observado menor que s */
  C.mmVLimit = (L, lam, s) => C.CLIGHT * Math.sqrt((s * lam) / (2 * L));
  /* Arrastre de Fresnel */
  C.fresnelDrag = (n) => 1 - 1 / (n * n);
  C.lightInMovingWater = (n, v) => C.CLIGHT / n + C.fresnelDrag(n) * v;
  C.lightRelativistic = (n, v) => (C.CLIGHT / n + v) / (1 + v / (n * C.CLIGHT));
  /* Fizeau 1851: desplazamiento (franjas) al invertir el flujo; Ltot = longitud de agua total recorrida */
  C.fizeauShift = (Ltot, v, lam, n, k) => (2 * Ltot * v * n * n * (k === undefined ? C.fresnelDrag(n) : k)) / (C.CLIGHT * lam);
  /* Velocidad orbital de la Tierra */
  C.VORB = 29780;
})(typeof window !== 'undefined' ? window : globalThis);
