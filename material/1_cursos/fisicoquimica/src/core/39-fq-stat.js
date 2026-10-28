/* ===================================================================
   39-fq-stat.js — Mecánica estadística de gases ideales: funciones de partición molecular y propiedades termodinámicas.
   Aproximación de rotor rígido y oscilador armónico (RRHO). Energías en cm⁻¹ (espectroscópicas), resultados en J/(mol·K) y J/mol.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const St = (FQ.stat = {});
  const R = 8.314462618, kB = 1.380649e-23, h = 6.62607015e-34, c = 2.99792458e10 /* cm/s */, NA = 6.02214076e23, u = 1.66053906660e-27, KCM = 0.6950348004 /* kB/hc en cm⁻¹/K */;
  St.R = R;

  /* Datos moleculares (constantes de Huber y Herzberg / NIST CCCBDB / Shimanouchi): M (u), tipo, σ, rotación, vibraciones (cm⁻¹) y electrónica [[g, E(cm⁻¹)]] */
  St.MOL = {
    AR: { nm: 'Ar', M: 39.948, type: 'atom', el: [[1, 0]] },
    HE: { nm: 'He', M: 4.002602, type: 'atom', el: [[1, 0]] },
    N2: { nm: 'N₂', M: 28.0134, type: 'lin', sigma: 2, B: 1.99824, vib: [2358.57], el: [[1, 0]] },
    O2: { nm: 'O₂', M: 31.9988, type: 'lin', sigma: 2, B: 1.4456, vib: [1580.19], el: [[3, 0], [2, 7918.1], [1, 13195.1]] },
    CO: { nm: 'CO', M: 28.0101, type: 'lin', sigma: 1, B: 1.93128, vib: [2169.81], el: [[1, 0]] },
    NO: { nm: 'NO', M: 30.0061, type: 'lin', sigma: 1, B: 1.6720, vib: [1904.20], el: [[2, 0], [2, 121.1]] },
    H2: { nm: 'H₂ (normal, 3 : 1)', M: 2.01588, type: 'h2', sigma: 2, B: 60.853, vib: [4401.21], el: [[1, 0]] },
    H2O: { nm: 'H₂O', M: 18.0153, type: 'nl', sigma: 2, ABC: [27.8806, 14.5216, 9.2778], vib: [3657.05, 1594.75, 3755.93], el: [[1, 0]] },
    CO2: { nm: 'CO₂', M: 44.0095, type: 'lin', sigma: 2, B: 0.39022, vib: [1388.2, 667.4, 667.4, 2349.2], el: [[1, 0]] },
    CH4: { nm: 'CH₄', M: 16.0425, type: 'nl', sigma: 12, ABC: [5.2412, 5.2412, 5.2412], vib: [2916.5, 1534, 1534, 3019, 3019, 3019, 1306, 1306, 1306], el: [[1, 0]] },
    NH3: { nm: 'NH₃', M: 17.0305, type: 'nl', sigma: 3, ABC: [6.196, 9.944, 9.944], vib: [3336.7, 950.4, 3443.6, 3443.6, 1626.8, 1626.8], el: [[1, 0]] },
    C2H2: { nm: 'C₂H₂', M: 26.0373, type: 'lin', sigma: 2, B: 1.1766, vib: [3374, 1974, 3289, 612, 612, 729, 729], el: [[1, 0]] }
  };
  /* Contribuciones a S (J/mol·K a P°), U − U₀ y C_v (J/mol·K) a la temperatura T */
  St.parts = function (m, T, P) {
    P = P || 1e5; const kT = kB * T, out = { S: {}, U: {}, Cv: {} };
    /* traslación (Sackur–Tetrode) */
    const lam3 = Math.pow((2 * Math.PI * m.M * u * kT) / (h * h), 1.5), qt = (lam3 * kT) / P; out.S.trans = R * (Math.log(qt) + 2.5); out.U.trans = 1.5 * R * T; out.Cv.trans = 1.5 * R;
    /* rotación */
    if (m.type === 'lin') { const q = T / (m.sigma * (m.B / KCM)); out.S.rot = R * (Math.log(q) + 1); out.U.rot = R * T; out.Cv.rot = R; out.q_rot = q; }
    else if (m.type === 'nl') { const A = m.ABC[0], B = m.ABC[1], C = m.ABC[2], q = (Math.sqrt(Math.PI) / m.sigma) * Math.pow(KCM * T, 1.5) / Math.sqrt(A * B * C); out.S.rot = R * (Math.log(q) + 1.5); out.U.rot = 1.5 * R * T; out.Cv.rot = 1.5 * R; out.q_rot = q; }
    else if (m.type === 'h2') { /* suma explícita con peso de espín 1 (J par) y 3 (J impar) menos el factor nuclear (2I+1)² = 4 */ const th = m.B / KCM; let q = 0, e1 = 0, e2 = 0; for (let J = 0; J < 60; J++) { const g = (J % 2 ? 3 : 1) * (2 * J + 1), x = Math.exp((-th * J * (J + 1)) / T); q += g * x; e1 += g * x * J * (J + 1) * th; e2 += g * x * Math.pow(J * (J + 1) * th, 2); } const U = (e1 / q) * R, Cv = R * (e2 / q - Math.pow(e1 / q, 2)) / (T * T); out.S.rot = R * (Math.log(q / 4) + e1 / q / T); out.U.rot = U; out.Cv.rot = Cv; out.q_rot = q / 4; }
    else { out.S.rot = 0; out.U.rot = 0; out.Cv.rot = 0; }
    /* vibración (cero en el fondo del pozo: energías medidas desde el punto cero) */
    let Sv = 0, Uv = 0, Cv = 0; for (const w of m.vib || []) { const x = w / (KCM * T), ex = Math.exp(x); Sv += R * (x / (ex - 1) - Math.log(1 - Math.exp(-x))); Uv += (R * T * x) / (ex - 1); Cv += R * x * x * ex / ((ex - 1) * (ex - 1)); }
    out.S.vib = Sv; out.U.vib = Uv; out.Cv.vib = Cv;
    /* electrónica */
    let q = 0, e = 0, e2 = 0; for (const [g, E] of m.el) { const x = Math.exp(-E / (KCM * T)); q += g * x; e += g * x * E; e2 += g * x * E * E; } const Eav = e / q;
    out.S.elec = R * (Math.log(q) + Eav / (KCM * T)); out.U.elec = (Eav / KCM) * R; out.Cv.elec = (R * (e2 / q - Eav * Eav)) / Math.pow(KCM * T, 2);
    const sum = (k) => Object.values(out[k]).reduce((a, b) => a + b, 0);
    out.S.total = sum('S'); out.U.total = sum('U'); out.Cv.total = sum('Cv');
    return out;
  };
  /* S° (1 bar), Cp (J/mol·K), H(T) − H(0) (J/mol) */
  St.thermo = function (m, T) { const p = St.parts(m, T), Cp = p.Cv.total + R; return { S: p.S.total, Cp, dH0: p.U.total + R * T, p }; };

  /* Anomalía de Schottky: sistema de dos niveles (degeneraciones g0, g1; separación Δ en cm⁻¹) */
  St.schottky = function (g0, g1, D, T) { const x = D / (KCM * T), r = (g1 / g0) * Math.exp(-x); const Cv = R * x * x * r / Math.pow(1 + r, 2), U = (R * T * x * r) / (1 + r), S = R * (Math.log(1 + r) + (x * r) / (1 + r)) + R * Math.log(g0); return { Cv, U, S }; };



  /* Especies adicionales para equilibrios (átomos y diatómicas isotópicas) */
  Object.assign(St.MOL, {
    HD: { nm: 'HD', M: 3.02196, type: 'rs', ws: [1, 1, 1], B: 44.66, vib: [3813.15], el: [[1, 0]] },
    D2: { nm: 'D₂', M: 4.02820, type: 'rs', ws: [6, 3, 9], B: 29.907, vib: [3115.50], el: [[1, 0]] },
    Hat: { nm: 'H', M: 1.007825, type: 'atom', el: [[2, 0]] },
    Oat: { nm: 'O', M: 15.9994, type: 'atom', el: [[5, 0], [3, 158.265], [1, 226.977], [5, 15867.862]] },
    Nat: { nm: 'N', M: 14.0067, type: 'atom', el: [[4, 0], [10, 19224.46], [6, 28838.92]] }
  });
  /* Energías de disociación D₀ (cm⁻¹): del nivel v = 0 a los átomos separados (NIST, Huber–Herzberg, Ruscic) */
  St.D0 = { H2: 36118.06, D2: 36748.36, HD: 36405.78, N2: 78715, O2: 41268, NO: 52397 };
  /* Función de partición interna (rot × vib × elec), con el cero en el nivel fundamental */
  St.qint = function (m, T) {
    let q = 1; if (m.type === 'lin') q *= T / (m.sigma * (m.B / KCM)); else if (m.type === 'nl') q *= (Math.sqrt(Math.PI) / m.sigma) * Math.pow(KCM * T, 1.5) / Math.sqrt(m.ABC[0] * m.ABC[1] * m.ABC[2]);
    else if (m.type === 'h2') { const th = m.B / KCM; let s = 0; for (let J = 0; J < 80; J++) s += (J % 2 ? 3 : 1) * (2 * J + 1) * Math.exp((-th * J * (J + 1)) / T); q *= s / 4; }
    else if (m.type === 'rs') { const th = m.B / KCM; let s = 0; for (let J = 0; J < 80; J++) s += (J % 2 ? m.ws[1] : m.ws[0]) * (2 * J + 1) * Math.exp((-th * J * (J + 1)) / T); q *= s / m.ws[2]; }
    for (const w of m.vib || []) q /= 1 - Math.exp(-w / (KCM * T));
    let qe = 0; for (const [g, E] of m.el) qe += g * Math.exp(-E / (KCM * T)); return q * qe;
  };
  /* Constante de equilibrio K_p° de una reacción {especie: ν} con ΔE₀ (cm⁻¹, de fondo a fondo de los niveles v = 0) */
  St.Kp = function (nu, dE0, T, mols) {
    let ln = -dE0 / (KCM * T) * 1; const kT = kB * T; /* −ΔE₀/kT en cm⁻¹/(cm⁻¹/K·T) */
    for (const [sp, v] of Object.entries(nu)) { const m = (mols || St.MOL)[sp], lam3 = Math.pow((2 * Math.PI * m.M * u * kT) / (h * h), 1.5); ln += v * Math.log((lam3 * kT / 1e5) * St.qint(m, T)); }
    return Math.exp(ln);
  };
  /* Ecuación de Saha: n_e n_i / n_0 = (2π m_e k T/h²)^{3/2} (2 g_i/g_0) e^{−I/kT}; I en eV */
  St.saha = function (T, I, g0, gi) { const me = 9.1093837015e-31, kT = kB * T; return Math.pow((2 * Math.PI * me * kT) / (h * h), 1.5) * ((2 * gi) / g0) * Math.exp(-(I * 1.602176634e-19) / kT); };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
