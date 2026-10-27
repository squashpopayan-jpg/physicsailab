(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const DEG = Math.PI / 180, TAU = 2 * Math.PI;
  /* Dispersión de Cauchy del vidrio BK7: n = A + B/λ² (λ en µm) */
  C.cauchy = (lamNm, A, B) => (A || 1.5046) + (B || 0.0042) / Math.pow(lamNm / 1000, 2);
  /* Refracción vectorial: d (unitario), normal n que apunta hacia el lado de donde viene el rayo, índices n1→n2 */
  C.refractVec = function (d, nrm, n1, n2) {
    const c = -(nrm[0] * d[0] + nrm[1] * d[1]), r = n1 / n2, k = 1 - r * r * (1 - c * c);
    if (k < 0) return null;
    const t = r * c - Math.sqrt(k);
    return [r * d[0] + t * nrm[0], r * d[1] + t * nrm[1]];
  };
  /* Desviación de un rayo en un prisma de ángulo A (grados) con incidencia i1 (grados): devuelve la desviación (grados) */
  C.prismDeviation = function (n, Adeg, i1deg) {
    const A = Adeg * DEG, i1 = i1deg * DEG, r1 = Math.asin(Math.sin(i1) / n), r2 = A - r1, s = n * Math.sin(r2);
    if (Math.abs(s) > 1) return NaN;
    return (i1 + Math.asin(s) - A) / DEG;
  };
  /* Desviación mínima: n = sen((A+δ)/2) / sen(A/2) */
  C.minDeviation = (n, Adeg) => (2 * Math.asin(n * Math.sin((Adeg * DEG) / 2)) - Adeg * DEG) / DEG;
  /* Anillos de Newton: radio del m-ésimo anillo oscuro con luz de longitud de onda λ (nm) y lente de radio R (m) */
  C.ringDark = (m, lamNm, R) => Math.sqrt(m * lamNm * 1e-9 * R);
  C.ringBright = (m, lamNm, R) => Math.sqrt((m + 0.5) * lamNm * 1e-9 * R);
  /* Young (1801): λ a partir del espesor del hueco de aire en el anillo m: d = m λ/2 */
  C.wavelengthFromGap = (gapNm, m) => (2 * gapNm) / m;
  /* Römer: retardo (minutos) en el eclipse de Ío respecto de la oposición, con Tierra a 1 UA y Júpiter a 5.203 UA */
  C.romerDelay = function (tYears, c) {
    const ae = 1, aj = 5.2026, e = TAU * tYears, j = (TAU * tYears) / 11.862;
    const d = (t0) => Math.hypot(aj * Math.cos(TAU * t0 / 11.862) - ae * Math.cos(TAU * t0), aj * Math.sin(TAU * t0 / 11.862) - ae * Math.sin(TAU * t0));
    return ((d(tYears) - d(0)) * K.AU_km) / c / 60;
  };
  C.K.AU_km = 149597870.7;
  C.romerC = (AUkm, delayMin) => (2 * AUkm) / (delayMin * 60);
  /* Aberración estelar: tan α = v/c; devuelve α en segundos de arco */
  C.aberration = (v, c) => (Math.atan(v / c) * 180 * 3600) / Math.PI;
  C.aberrationC = (v, alphaArcsec) => v / Math.tan((alphaArcsec / 3600) * DEG);
  /* Posición aparente (segundos de arco) en el curso del año para una estrella a latitud eclíptica β */
  C.aberrationPos = function (phase, betaDeg, kappa) {
    const b = betaDeg * DEG;
    return [-kappa * Math.cos(phase), -kappa * Math.sin(b) * Math.sin(phase)];
  };
  /* Longitud de onda → color aproximado (Bruton), 380-780 nm */
  C.wavelengthRGB = function (l) {
    let r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else if (l <= 780) { r = 1; }
    let f = l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : l > 700 ? 0.3 + (0.7 * (780 - l)) / 80 : 1;
    return [Math.round(255 * Math.pow(r * f, 0.8)), Math.round(255 * Math.pow(g * f, 0.8)), Math.round(255 * Math.pow(b * f, 0.8))];
  };
})(typeof window !== 'undefined' ? window : global);
