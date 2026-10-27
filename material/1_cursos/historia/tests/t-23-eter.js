module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const [L, v, d] of R.mm) T.rel(S, `Michelson: diferencia de camino c(t∥ − t⊥) con L = ${L} m, v = ${v} m/s (mpmath a 60 cifras)`, C.mmPathDiff(L, v, false), d, 1e-9);
  T.abs(H, 'Michelson y Morley: 0.4 de franja esperada con 11 m y la velocidad orbital (λ = 550 nm)', C.mmFringeShift(11, C.VORB, 550e-9, false), 0.4, 0.01);
  T.abs(H, 'Michelson 1881 (Potsdam): 0.04 de franja esperada con 1.2 m de brazo', C.mmFringeShift(1.2, C.VORB, 570e-9, false), 0.037, 0.01);
  T.rel(N, 'el desplazamiento coincide con la aproximación 2Lv²/(c²λ)', C.mmFringeShift(11, C.VORB, 550e-9, false), C.mmFringeApprox(11, C.VORB, 550e-9), 1e-6);
  T.abs(N, 'con la contracción de FitzGerald–Lorentz los tiempos de ida y vuelta son idénticos', C.mmTimes(11, C.VORB, true).par - C.mmTimes(11, C.VORB, true).perp, 0, 1e-21);
  T.ok(N, 'sin contracción los tiempos difieren (el brazo paralelo tarda más)', C.mmTimes(11, C.VORB, false).par > C.mmTimes(11, C.VORB, false).perp);
  T.abs(H, 'observación < 0.01 de franja equivale a v < 5 km/s (menos de 1/6 de la velocidad orbital)', C.mmVLimit(11, 550e-9, 0.01) / 1000, 4.7, 0.2);
  T.abs(N, 'la variación angular tiene amplitud Lβ²/λ y se anula a 45°', C.mmFringeAngle(11, C.VORB, 550e-9, Math.PI / 4), 0, 1e-12);
  T.abs(N, 'la variación entre 0° y 90° es el doble de la amplitud: 2Lβ²/λ', C.mmFringeAngle(11, C.VORB, 550e-9, 0) - C.mmFringeAngle(11, C.VORB, 550e-9, Math.PI / 2), C.mmFringeApprox(11, C.VORB, 550e-9), 1e-12);
  T.abs(S, 'Fresnel: coeficiente de arrastre 1 − 1/n² con n = 4/3', C.fresnelDrag(4 / 3), R.fresnel_k, 1e-12);
  T.abs(H, 'coeficiente de arrastre del agua: 0.4375', C.fresnelDrag(4 / 3), 0.4375, 1e-4);
  T.abs(S, 'arrastre de Fresnel frente a la composición relativista de velocidades (mpmath)', C.lightInMovingWater(4 / 3, 7) - C.CLIGHT / (4 / 3), R.fizeau_rel, 1e-6);
  T.abs(N, 'Fizeau 1851: con 2.97 m de agua a 7 m/s el desplazamiento es del orden de 0.2 de franja', C.fizeauShift(2.97, 7.06, 526e-9, 4 / 3), 0.2, 0.03);
  T.ok(H, 'una atmósfera totalmente arrastrada (k = 1) daría más del doble de desplazamiento que el observado por Fizeau', C.fizeauShift(2.97, 7.06, 526e-9, 4 / 3, 1) > 2 * C.fizeauShift(2.97, 7.06, 526e-9, 4 / 3));
};
