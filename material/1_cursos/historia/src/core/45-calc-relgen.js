(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const PI = Math.PI, ARCSEC = PI / (180 * 3600);
  C.ARCSEC = ARCSEC;
  C.GMSUN = 1.32712440018e20; /* m³/s² */
  C.schwarzschild = (M) => (2 * K.G * M) / (K.c * K.c);
  /* Avance del perihelio por órbita (rad): 6πGM/(c² a (1−e²)) */
  C.perihelionPerOrbit = (GM, a, e) => (6 * PI * GM) / (K.c * K.c * a * (1 - e * e));
  C.perihelionPerCentury = (GM, a, e, Pdays) => C.perihelionPerOrbit(GM, a, e) * ((36525 / Pdays) ) / ARCSEC;
  /* Integración numérica de w'' + w = 1 + 3ε w² (w = p/r, ε = GM/(c²p)), desde el perihelio w = 1 + e.
     Devuelve el avance por órbita (φ_retorno − 2π). */
  C.grPrecession = function (eps, e, h) {
    h = h || 1e-4;
    const f = (w, v) => [v, 1 + 3 * eps * w * w - w];
    let w = 1 + e, v = 0, phi = 0, vprev = 0;
    for (let i = 0; i < 2e6; i++) {
      const [k1w, k1v] = f(w, v), [k2w, k2v] = f(w + 0.5 * h * k1w, v + 0.5 * h * k1v), [k3w, k3v] = f(w + 0.5 * h * k2w, v + 0.5 * h * k2v), [k4w, k4v] = f(w + h * k3w, v + h * k3v);
      vprev = v; w += (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w); v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v); phi += h;
      if (phi > PI && vprev > 0 && v <= 0) { const t = vprev / (vprev - v); return phi - h + t * h - 2 * PI; }
    }
    return NaN;
  };
  /* Deflexión de la luz: u'' + u = 3 m u² con m = GM/c², u'(0) = 1/b; deflexión = φ_final − π (rad) */
  C.lightDeflectionNumeric = function (mOverB, h) {
    h = h || 1e-4;
    const f = (u, v) => [v, 3 * mOverB * u * u - u];
    let u = 0, v = 1, phi = 0, uprev = 0; /* unidades de b = 1 */
    for (let i = 0; i < 4e6; i++) {
      const [k1u, k1v] = f(u, v), [k2u, k2v] = f(u + 0.5 * h * k1u, v + 0.5 * h * k1v), [k3u, k3v] = f(u + 0.5 * h * k2u, v + 0.5 * h * k2v), [k4u, k4v] = f(u + h * k3u, v + h * k3v);
      uprev = u; u += (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u); v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v); phi += h;
      if (phi > 1 && uprev > 0 && u <= 0) { const t = uprev / (uprev - u); return phi - h + t * h - PI; }
    }
    return NaN;
  };
  C.lightDeflection = (GM, b) => (4 * GM) / (K.c * K.c * b);
  C.lightDeflectionNewton = (GM, b) => (2 * GM) / (K.c * K.c * b);
  /* Corrimiento al rojo gravitacional por altura h cerca de la superficie */
  C.gravShift = (g, h) => (g * h) / (K.c * K.c);
  /* Reloj en órbita circular de radio r alrededor de la Tierra: µs/día respecto del reloj en reposo en el suelo */
  C.gpsDaily = function (r) {
    const GM = 3.986004418e14, Re = 6378137, v2 = GM / r, day = 86400;
    const grav = (GM / (K.c * K.c)) * (1 / Re - 1 / r) * day * 1e6;
    const spec = -(v2 / (2 * K.c * K.c)) * day * 1e6;
    return { grav, spec, net: grav + spec };
  };
  /* Ondas gravitacionales: masa de chirrido y frecuencia en función del tiempo hasta la fusión τ */
  C.chirpMass = (m1, m2) => Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
  C.gwFreq = (tau, Mc) => (1 / PI) * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow((K.G * Mc) / Math.pow(K.c, 3), -5 / 8);
  C.gwTimeToMerge = (f, Mc) => (5 / 256) * Math.pow(PI * f, -8 / 3) * Math.pow((K.G * Mc) / Math.pow(K.c, 3), -5 / 3);
  /* Media ponderada e incertidumbre de medidas independientes */
  C.weightedMean = function (vals, sig) { let sw = 0, s = 0; vals.forEach((v, i) => { const w = 1 / (sig[i] * sig[i]); sw += w; s += w * v; }); return { mean: s / sw, sigma: Math.sqrt(1 / sw) }; };
  C.chi2 = (vals, sig, m) => vals.reduce((a, v, i) => a + Math.pow((v - m) / sig[i], 2), 0);
  /* Datos de 1919 (segundos de arco) */
  C.ECLIPSE1919 = [
    { n: 'Sobral, astrográfico', v: 0.86, s: 0.48, used: false },
    { n: 'Sobral, 4 pulgadas', v: 1.98, s: 0.12, used: true },
    { n: 'Príncipe, astrográfico', v: 1.61, s: 0.30, used: true }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
