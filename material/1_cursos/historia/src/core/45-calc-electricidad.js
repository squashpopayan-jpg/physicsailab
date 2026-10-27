(function (root) {
  'use strict';
  const C = root.EM.calc;
  /* Coulomb (1785): ángulos de la balanza de torsión. [separación entre bolas (°), torsión aplicada (°)] */
  C.coulombData = [[36, 0], [18, 126], [8.5, 567]];
  C.coulombForce = (d) => d[0] + d[1]; /* el par total en grados es proporcional a la fuerza */
  C.coulombExponent = function (useChord) {
    const D = C.coulombData, f = D.map(C.coulombForce), x = D.map((d) => (useChord ? 2 * Math.sin((d[0] * Math.PI) / 360) : d[0]));
    return [Math.log(f[1] / f[0]) / Math.log(x[0] / x[1]), Math.log(f[2] / f[0]) / Math.log(x[0] / x[2])];
  };
  /* Pila de Volta: n celdas en serie, fem E y resistencia interna r cada una, carga R */
  C.pile = function (n, E, r, R) {
    const I = (n * E) / (n * r + R), V = I * R;
    return { I, V, P: V * I, eta: V / (n * E), Pmax: (n * E) * (n * E) / (4 * n * r) };
  };
  /* Ohm (1827): resistencia R = ρ l / A y corriente I = V/(r + R) */
  C.wireResistance = (rho, l, A) => (rho * l) / A;
  /* Campo axial en el interior (x < 1) de una cáscara esférica uniforme para una fuerza 1/r^n (por unidad de carga y densidad) */
  C.shellField = function (x, n, m) {
    m = m || 4000; let s = 0;
    for (let i = 0; i < m; i++) { const u = -1 + ((i + 0.5) * 2) / m, r2 = 1 + x * x - 2 * x * u; s += (x - u) / Math.pow(r2, (n + 1) / 2); }
    return (s * 2) / m / 2;
  };
  /* Condensador (botella de Leiden): C = ε0 ε_r A/d, energía ½ C V² */
  C.capacitance = (er, A, d) => (8.8541878128e-12 * er * A) / d;
  C.capEnergy = (Cap, V) => 0.5 * Cap * V * V;
})(typeof window !== 'undefined' ? window : global);
