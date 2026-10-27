(function (root) {
  'use strict';
  const C = root.EM.calc;
  const MU0 = 1.25663706212e-6;
  C.MU0 = MU0;
  /* Campo de un hilo recto largo y de una espira circular en su eje */
  C.bWire = (I, r) => (MU0 * I) / (2 * Math.PI * r);
  C.bLoopAxis = (I, a, z) => (MU0 * I * a * a) / (2 * Math.pow(a * a + z * z, 1.5));
  C.bSolenoid = (n, I) => MU0 * n * I;
  /* Brújula: ángulo de desviación cuando el campo del hilo es perpendicular a la componente horizontal del campo terrestre */
  C.compassDeflection = (B, Bh) => Math.atan(B / (Bh || 2.4e-5)) * 180 / Math.PI;
  /* Flujo de un dipolo (momento m, sobre el eje) a través de una espira de radio a a distancia z, y su fem para velocidad v */
  C.dipoleFlux = (m, a, z) => (MU0 * m * a * a) / (2 * Math.pow(a * a + z * z, 1.5));
  C.dipoleEmf = (m, a, z, v, N) => -(N || 1) * ((MU0 * m * a * a) / 2) * (-1.5) * Math.pow(a * a + z * z, -2.5) * 2 * z * (-v);
  /* Disco de Faraday: ε = ½ B ω R² */
  C.faradayDisc = (B, f, R) => 0.5 * B * 2 * Math.PI * f * R * R;
  /* Ley de Faraday para una espira que gira en un campo uniforme: ε = N B A ω sen ωt */
  C.acEmf = (N, B, A, f, t) => N * B * A * 2 * Math.PI * f * Math.sin(2 * Math.PI * f * t);
})(typeof window !== 'undefined' ? window : global);
