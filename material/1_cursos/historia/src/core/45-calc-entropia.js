(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  const TAU = 2 * Math.PI;
  /* Colisión elástica 2D entre dos partículas de igual masa: se conserva la velocidad del centro de masas y se gira la velocidad relativa un ángulo θ */
  C.collide2D = function (v1, v2, theta) {
    const Vx = (v1[0] + v2[0]) / 2, Vy = (v1[1] + v2[1]) / 2, ux = (v1[0] - v2[0]) / 2, uy = (v1[1] - v2[1]) / 2;
    const c = Math.cos(theta), s = Math.sin(theta), rx = c * ux - s * uy, ry = s * ux + c * uy;
    return [[Vx + rx, Vy + ry], [Vx - rx, Vy - ry]];
  };
  /* Distribución de rapideces de Maxwell en 2D (Rayleigh): f(v) = (m v / kT) exp(−m v² / 2kT), con kT/m = s2 */
  C.maxwell2D = (v, s2) => (v / s2) * Math.exp((-v * v) / (2 * s2));
  C.maxwell2Dcdf = (v, s2) => 1 - Math.exp((-v * v) / (2 * s2));
  /* Paso de la urna de Ehrenfest: de N bolas, n en la caja izquierda; se elige una al azar y cambia de caja */
  C.ehrenfestStep = (n, N, rng) => (rng() < n / N ? n - 1 : n + 1);
  /* ln C(N, n) por suma de logaritmos y entropía de Boltzmann S/k */
  C.lnBinom = function (N, n) { let s = 0; n = Math.min(n, N - n); for (let i = 1; i <= n; i++) s += Math.log((N - n + i) / i); return s; };
  /* Perrin: altura de escala del equilibrio de sedimentación h_s = kT / (m' g); N_A = R T / (m' g h_s) */
  C.perrinScale = (rUm, drho, T) => (K.kB * T) / ((4 / 3) * Math.PI * Math.pow(rUm * 1e-6, 3) * drho * K.g);
  C.perrinNA = (rUm, drho, T, hs) => (8.314462618 * T) / ((4 / 3) * Math.PI * Math.pow(rUm * 1e-6, 3) * drho * K.g * hs);
  /* Kelvin: edad de la Tierra por enfriamiento conductivo: t = T0² / (π κ G²) */
  C.kelvinAge = (T0, G, kappa) => (T0 * T0) / (Math.PI * kappa * G * G);
  C.landauer = (T) => K.kB * T * Math.LN2;
  C.YEAR = 365.25 * 86400;
})(typeof window !== 'undefined' ? window : global);
