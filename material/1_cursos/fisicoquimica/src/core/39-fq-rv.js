/* ===================================================================
   39-fq-rv.js — Espectros de rotación y vibración-rotación de diatómicas: niveles, líneas P/R, intensidades, isótopos,
   Raman rotacional con estadística de espín nuclear, y efecto isotópico cinético por energía de punto cero.
   Energías en cm⁻¹.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const V = (FQ.rv = {});
  const KB_CM = 0.6950348; /* cm⁻¹ por K */
  /* Constantes espectroscópicas (Huber y Herzberg, NIST WebBook): ωe, ωexe, Be, αe, De (cm⁻¹) y masas atómicas (u) */
  V.MASS = { H: 1.00782503, D: 2.01410178, C12: 12.0, O16: 15.99491462, Cl35: 34.96885268, Cl37: 36.96590259, F: 18.99840316, N14: 14.0030740, Br79: 78.9183376, Br81: 80.9162897 };
  V.MOL = {
    HCl: { nm: 'HCl', a: 'H', b: 'Cl35', we: 2990.946, wx: 52.8186, wy: 0.2244, Be: 10.5934, ae: 0.3072, De: 5.3194e-4 },
    CO: { nm: 'CO', a: 'C12', b: 'O16', we: 2169.814, wx: 13.2883, wy: 0.01051, Be: 1.93128, ae: 0.01750, De: 6.12e-6 },
    HF: { nm: 'HF', a: 'H', b: 'F', we: 4138.32, wx: 89.88, Be: 20.9557, ae: 0.7933, De: 2.15e-3 },
    NO: { nm: 'NO (² Π₁/₂, sin estructura fina)', a: 'N14', b: 'O16', we: 1904.20, wx: 14.075, Be: 1.6720, ae: 0.0178, De: 5.4e-6 }
  };
  const mu = (a, b) => (V.MASS[a] * V.MASS[b]) / (V.MASS[a] + V.MASS[b]);
  /* Escala las constantes de la especie isotópica (a', b') a partir de las de (a, b): ω ∝ μ^−½, ωx ∝ μ^−1, B ∝ μ^−1, α ∝ μ^−3/2, D ∝ μ^−2 */
  V.isotopologue = (m, a2, b2) => { const r = mu(m.a, m.b) / mu(a2, b2); return { ...m, a: a2, b: b2, we: m.we * Math.sqrt(r), wx: m.wx * r, wy: (m.wy || 0) * Math.pow(r, 1.5), Be: m.Be * r, ae: m.ae * Math.pow(r, 1.5), De: m.De * r * r }; };
  /* Energía del nivel (v, J) */
  V.E = (m, v, J) => { const x = v + 0.5, Bv = m.Be - m.ae * x; return m.we * x - m.wx * x * x + (m.wy || 0) * x * x * x + Bv * J * (J + 1) - m.De * J * J * (J + 1) * (J + 1); };
  V.nu0 = (m) => V.E(m, 1, 0) - V.E(m, 0, 0);
  /* Líneas de la banda fundamental 0 → 1: R(J): J → J+1; P(J): J → J−1 */
  V.R = (m, J) => V.E(m, 1, J + 1) - V.E(m, 0, J);
  V.P = (m, J) => V.E(m, 1, J - 1) - V.E(m, 0, J);
  /* Intensidades relativas (Boltzmann × factor de Hönl–London) */
  V.IR = (m, J, T) => (J + 1) * Math.exp((-V.E(m, 0, J) + V.E(m, 0, 0)) / (KB_CM * T));
  V.IP = (m, J, T) => J * Math.exp((-V.E(m, 0, J) + V.E(m, 0, 0)) / (KB_CM * T));
  /* Diferencias de combinación: R(J − 1) − P(J + 1) = Δ₂F″(J) = 4B″(J + ½) (sin distorsión centrífuga) */
  V.combo = (m, J) => V.R(m, J - 1) - V.P(m, J + 1);
  /* Raman rotacional (rama S, J → J + 2): ν = B(4J + 6) − D(…) ; peso de espín nuclear de una homonuclear de espín I */
  V.ramanS = (B, D, J) => (4 * J + 6) * (B - D * (2 * J * J + 6 * J + 6)); /* E(J+2) − E(J) con DJ²(J+1)² */
  V.spinW = (I, J, fermion) => { const s = (I + 1) * (2 * I + 1), a = I * (2 * I + 1); /* el par nuclear simétrico acompaña a J par para bosones; antisimétrico a J par para fermiones */ const symEven = !fermion; return (J % 2 === 0) === symEven ? s : a; };
  /* Efecto isotópico cinético máximo por energía de punto cero: exp[(ν_H − ν_D)·hc/2 /(k_B T)] */
  V.zpeKIE = (nuH, nuD, T) => Math.exp((0.5 * (nuH - nuD)) / (KB_CM * T));
  /* αe del oscilador de Morse (Pekeris, 1934): αe = 6√(ωexe·Be³)/ωe − 6Be²/ωe */
  V.alphaPekeris = (m) => (6 * Math.sqrt(m.wx * Math.pow(m.Be, 3))) / m.we - (6 * m.Be * m.Be) / m.we;
  V.redMass = mu;

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
