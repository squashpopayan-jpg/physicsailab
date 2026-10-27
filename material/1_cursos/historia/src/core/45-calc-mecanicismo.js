(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  /* Fermat: tiempo de recorrido de un rayo que va de A(0, a) a B(d, −b) cruzando la interfaz y = 0 en x */
  C.fermatTime = (x, a, b, d, v1, v2) => Math.hypot(x, a) / v1 + Math.hypot(d - x, b) / v2;
  /* Mínimo por sección áurea */
  C.fermatMin = function (a, b, d, v1, v2) {
    const f = (x) => C.fermatTime(x, a, b, d, v1, v2), g = (Math.sqrt(5) - 1) / 2;
    let lo = 0, hi = d, c = hi - g * (hi - lo), e = lo + g * (hi - lo);
    for (let i = 0; i < 200; i++) { if (f(c) < f(e)) hi = e; else lo = c; c = hi - g * (hi - lo); e = lo + g * (hi - lo); }
    const x = (lo + hi) / 2, s1 = x / Math.hypot(x, a), s2 = (d - x) / Math.hypot(d - x, b);
    return { x, t: f(x), s1, s2 };
  };
  /* Choque elástico unidimensional (Huygens, Wren, Wallis) */
  C.elastic = function (m1, v1, m2, v2) {
    return { u1: ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2), u2: ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2) };
  };
  /* Regla 4 de Descartes (Principios II, 49): B choca con C en reposo y mayor: B rebota con la misma rapidez y C no se mueve */
  C.descartesRule4 = (m1, v1, m2) => ({ u1: -v1, u2: 0 });
  /* Cicloide con el punto más bajo en el origen: x = a(φ + sen φ), y = a(1 − cos φ) */
  C.cycloid = (phi, a) => [a * (phi + Math.sin(phi)), a * (1 - Math.cos(phi))];
  /* Tautócrona: φ(t) para una cuenta soltada desde φ0: sen(φ/2) = sen(φ0/2) cos(ωt), ω = √(g/4a) */
  C.tautoPhi = (t, phi0, a) => 2 * Math.asin(Math.sin(phi0 / 2) * Math.cos(Math.sqrt(K.g / (4 * a)) * t));
  C.tautoPeriod = (a) => 4 * Math.PI * Math.sqrt(a / K.g);
  /* Longitud del péndulo cicloidal equivalente: L = 4a */
  C.huygensPendulum = (L) => 2 * Math.PI * Math.sqrt(L / K.g);
  /* Principio de Huygens: ángulo refractado de una onda plana (velocidades v1, v2) */
  C.huygensRefraction = (th1, v1, v2) => Math.asin((v2 / v1) * Math.sin(th1));
  /* Fuerza centrífuga de Huygens: a = v²/r */
  C.centripetal = (v, r) => (v * v) / r;
})(typeof window !== 'undefined' ? window : global);
