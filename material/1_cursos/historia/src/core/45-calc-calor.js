(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  /* Experimento de Joule de las paletas: ΔT del agua tras n caídas de los pesos (masa total m, altura h), con rendimiento eta */
  C.joulePaddle = (m, h, n, Mwater, eta, cw) => (eta * m * K.g * h * n) / (Mwater * (cw || 4186));
  C.jouleJ = (m, h, n, Mwater, dT, cw) => ((m * K.g * h * n) / (Mwater * (cw || 1000) * dT)); /* J por caloría si cw = 1000 cal/(kg K) */
  /* Ciclo de Carnot con gas ideal (n moles): isoterma a Th de V1 a V2, adiabática hasta Tc, isoterma a Tc, adiabática de vuelta */
  C.carnot = function (Th, Tc, V1, V2, gamma, nmol) {
    const R = 8.314462618, n = nmol || 1, g = gamma || 1.4;
    const V3 = V2 * Math.pow(Th / Tc, 1 / (g - 1)), V4 = V1 * Math.pow(Th / Tc, 1 / (g - 1));
    const Qh = n * R * Th * Math.log(V2 / V1), Qc = n * R * Tc * Math.log(V3 / V4);
    return { V3, V4, Qh, Qc, W: Qh - Qc, eta: (Qh - Qc) / Qh, etaCarnot: 1 - Tc / Th };
  };
  /* Mayer (1842): J = R / (c_p (1 − 1/γ)) con R específica del aire y c_p en cal/(g K) */
  C.mayerJ = (cp, gamma, Rspec) => (Rspec || 0.28706) / (cp * (1 - 1 / gamma));
  /* Eficiencia de máquinas históricas */
  C.engineEfficiency = (W, Q) => W / Q;
})(typeof window !== 'undefined' ? window : global);
