(function (root) {
  'use strict';
  const C = root.EM.calc;
  /* Al-Biruni: radio terrestre a partir de la altura h de una montaña y la depresión del horizonte (rad) */
  C.biruniRadius = (h, dip) => (h * Math.cos(dip)) / (1 - Math.cos(dip));
  /* Cámara oscura: desenfoque geométrico (≈ d) y de difracción (2.44 λ f / d); total en cuadratura */
  C.pinholeBlur = function (d, f, lam) {
    const geo = d, dif = (2.44 * lam * f) / d;
    return { geo, dif, tot: Math.hypot(geo, dif) };
  };
  C.pinholeOptimum = (f, lam) => Math.sqrt(2.44 * lam * f);
  /* Par de Tusi: círculo de radio r rodando por dentro de uno de radio R; punto del círculo pequeño */
  C.tusi = function (t, R, r) {
    return [(R - r) * Math.cos(t) + r * Math.cos(((R - r) * t) / r), (R - r) * Math.sin(t) - r * Math.sin(((R - r) * t) / r)];
  };
  /* Ibn Sahl / Snell: seno del ángulo refractado y razón de longitudes a igual desplazamiento lateral */
  C.refract = function (n1, n2, th1) {
    const s = (n1 * Math.sin(th1)) / n2;
    if (Math.abs(s) > 1) return { th2: NaN, ratio: NaN, tir: true };
    const th2 = Math.asin(s);
    return { th2, ratio: Math.sin(th2) / Math.sin(th1), tir: false };
  };
  /* Diferencia entre dos cálculos del radio terrestre: error relativo del método de Biruni para un error de ángulo */
  C.biruniSensitivity = (h, dip, dDip) => C.biruniRadius(h, dip + dDip) / C.biruniRadius(h, dip) - 1;
})(typeof window !== 'undefined' ? window : global);
