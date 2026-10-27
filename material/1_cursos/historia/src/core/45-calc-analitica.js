(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  /* Braquistócrona: tiempo de descenso de (0,0) a (xf, yf) (y hacia abajo) por distintas curvas, con v = √(2 g y) */
  C.timeStraight = (xf, yf) => Math.sqrt((2 * (xf * xf + yf * yf)) / (K.g * yf));
  C.cycloidFit = function (xf, yf) {
    /* x = a(θ − sen θ), y = a(1 − cos θ): se resuelve (θ − sen θ)/(1 − cos θ) = xf/yf */
    const f = (t) => (t - Math.sin(t)) / (1 - Math.cos(t)) - xf / yf;
    let lo = 1e-6, hi = 2 * Math.PI - 1e-6;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; (f(m) < 0 ? (lo = m) : (hi = m)); }
    const th = (lo + hi) / 2, a = yf / (1 - Math.cos(th));
    return { th, a, T: th * Math.sqrt(a / K.g) };
  };
  /* Tiempo a lo largo de una curva y(x) dada, con integral por cuadratura de Gauss-Legendre tras sustitución x = xf s⁴ */
  C.timeAlong = function (yOf, dyOf, xf, n) {
    n = n || 4000; let T = 0;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n, x = xf * Math.pow(s, 4), dx = 4 * xf * Math.pow(s, 3) / n;
      const y = yOf(x), yp = dyOf(x);
      T += (Math.sqrt(1 + yp * yp) / Math.sqrt(2 * K.g * y)) * dx;
    }
    return T;
  };
  /* Arco circular por (0,0) y (xf,yf), tangente vertical en el origen: centro (R, 0): (x−R)² + y² = R² */
  C.circleThrough = (xf, yf) => (xf * xf + yf * yf) / (2 * xf);
  /* Balanza de Cavendish: G = 2π² L θ r² / (M T²) */
  C.cavendishG = (L, theta, r, M, T) => (2 * Math.PI * Math.PI * L * theta * r * r) / (M * T * T);
  C.earthMass = (G) => (K.g * Math.pow(6.371e6, 2)) / G;
  C.earthDensity = (G) => C.earthMass(G) / ((4 / 3) * Math.PI * Math.pow(6.371e6, 3));
  /* Péndulo doble (masas y longitudes unidad): derivadas de (θ1, θ2, ω1, ω2) a partir de las ecuaciones de Lagrange */
  C.doublePendulum = function (s, m1, m2, l1, l2) {
    const [t1, t2, w1, w2] = s, g = K.g, d = t1 - t2, den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
    const a1 = (-g * (2 * m1 + m2) * Math.sin(t1) - m2 * g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d))) / (l1 * den);
    const a2 = (2 * Math.sin(d) * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(t1) + w2 * w2 * l2 * m2 * Math.cos(d))) / (l2 * den);
    return [w1, w2, a1, a2];
  };
  C.rk4 = function (f, s, dt) {
    const k1 = f(s), s2 = s.map((v, i) => v + 0.5 * dt * k1[i]), k2 = f(s2), s3 = s.map((v, i) => v + 0.5 * dt * k2[i]), k3 = f(s3), s4 = s.map((v, i) => v + dt * k3[i]), k4 = f(s4);
    return s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  C.doublePendulumEnergy = function (s, m1, m2, l1, l2) {
    const [t1, t2, w1, w2] = s, g = K.g;
    const T = 0.5 * m1 * l1 * l1 * w1 * w1 + 0.5 * m2 * (l1 * l1 * w1 * w1 + l2 * l2 * w2 * w2 + 2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2));
    const V = -(m1 + m2) * g * l1 * Math.cos(t1) - m2 * g * l2 * Math.cos(t2);
    return T + V;
  };
})(typeof window !== 'undefined' ? window : global);
