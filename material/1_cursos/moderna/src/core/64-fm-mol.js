/* ===================================================================
   64-fm-mol.js — Moléculas (EM.fm.mol): enlace en el ion H₂⁺ por combinación lineal de orbitales atómicos (LCAO, integrales analíticas), rotor rígido,
   poblaciones térmicas y estadística nuclear, espectro de vibración–rotación (constantes de Dunham de un potencial de Morse) y Raman rotacional.
   Sin DOM. Energías de enlace en unidades atómicas (hartree); espectroscopia en cm⁻¹.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const M = (fm.mol = {});
  const { h, c, kB, e } = K;
  const HA = 27.211386245988;
  M.HA_EV = HA;
  /* ---- H₂⁺ con base mínima {1s_A, 1s_B}, R en a₀ ---- */
  M.S = (R) => Math.exp(-R) * (1 + R + (R * R) / 3);                         /* solapamiento ⟨A|B⟩ */
  M.jInt = (R) => 1 / R - Math.exp(-2 * R) * (1 + 1 / R);                    /* ⟨A|1/r_B|A⟩ */
  M.kInt = (R) => Math.exp(-R) * (1 + R);                                    /* ⟨A|1/r_A|B⟩ */
  /* energías total (incluida la repulsión nuclear 1/R): E± = −½ + 1/R − (j ± k)/(1 ± S); «+» = σ_g enlazante, «−» = σ_u antienlazante */
  M.Eplus = (R) => -0.5 + 1 / R - (M.jInt(R) + M.kInt(R)) / (1 + M.S(R));
  M.Eminus = (R) => -0.5 + 1 / R - (M.jInt(R) - M.kInt(R)) / (1 - M.S(R));
  M.bond = function () {
    const U = EM.P.util; let R = U.golden((r) => M.Eplus(r), 1, 5, 1e-10).x;
    return { Re: R, E: M.Eplus(R), De: -0.5 - M.Eplus(R) };
  };
  /* densidad electrónica del orbital molecular σ_g/σ_u en el eje (A en −R/2, B en +R/2): ψ = (φ_A ± φ_B)/√(2(1 ± S)) */
  M.psi = (R, z, rho, sign) => { const a = Math.exp(-Math.hypot(rho, z + R / 2)), b = Math.exp(-Math.hypot(rho, z - R / 2)); return (a + sign * b) / Math.sqrt(2 * Math.PI * (1 + sign * M.S(R))); };
  /* ---- rotación ---- */
  M.amu = K.u;
  M.reducedMass = (m1, m2) => (m1 * m2) / (m1 + m2);               /* en la unidad que se use */
  /* B = h/(8π²cμr²) en cm⁻¹ (μ en u, r en Å) */
  M.rotB = (muAmu, rA) => (h / (8 * Math.PI * Math.PI * c * muAmu * K.u * (rA * 1e-10) ** 2)) / 100;
  M.rotE = (B, J, D = 0) => B * J * (J + 1) - D * J * J * (J + 1) ** 2;      /* cm⁻¹ */
  /* peso estadístico nuclear: [par, impar] */
  M.NS = { none: [1, 1], H2: [1, 3], N2: [6, 3], D2: [6, 3], O2: [0, 1] };
  M.partition = (B, T, ns = [1, 1], Jmax = 200) => { let s = 0; for (let J = 0; J <= Jmax; J++) s += ns[J % 2] * (2 * J + 1) * Math.exp(-(h * c * 100 * B * J * (J + 1)) / (kB * T)); return s; };
  M.pop = (B, T, J, ns = [1, 1]) => ns[J % 2] * (2 * J + 1) * Math.exp(-(h * c * 100 * B * J * (J + 1)) / (kB * T)) / M.partition(B, T, ns);
  M.Jmax = (B, T) => Math.sqrt((kB * T) / (2 * h * c * 100 * B)) - 0.5;     /* J de máxima población */
  /* fracción de ortohidrógeno en equilibrio (J impar con peso nuclear 3) */
  M.orthoFraction = (B, T) => { let o = 0, p = 0; for (let J = 0; J <= 200; J++) { const w = (2 * J + 1) * Math.exp(-(h * c * 100 * B * J * (J + 1)) / (kB * T)); if (J % 2) o += 3 * w; else p += w; } return o / (o + p); };
  /* ---- Morse y constantes de Dunham ---- */
  /* K = ħ²/2μ en cm⁻¹ Å² */
  M.Kcoef = (muAmu) => (K.hbar * K.hbar / (2 * muAmu * K.u)) / (h * c * 100) * 1e20;
  M.morse = (De, re, muAmu, we) => { const Kc = M.Kcoef(muAmu), a = we / (2 * Math.sqrt(Kc * De)); return { De, re, a, Kc, we, wexe: Kc * a * a, Be: Kc / (re * re) }; };
  /* constantes de Pekeris para el oscilador de Morse: α_e, D_e (distorsión centrífuga) y β_e (dependencia de D con v) */
  M.dunham = (m) => { const { we, wexe, Be } = m, alpha = (6 * Math.sqrt(wexe * Be ** 3)) / we - (6 * Be * Be) / we, Dcd = (4 * Be ** 3) / (we * we);
    return { we, wexe, Be, alpha, Dcd, beta: Dcd * ((8 * wexe) / we - (5 * alpha) / Be - (alpha * alpha * we) / (24 * Be ** 3)) }; };
  M.G = (d, v) => d.we * (v + 0.5) - d.wexe * (v + 0.5) ** 2;
  M.Fv = (d, v, J) => (d.Be - d.alpha * (v + 0.5)) * J * (J + 1) - (d.Dcd + (d.beta || 0) * (v + 0.5)) * J * J * (J + 1) ** 2;
  M.band = (d, v0, v1, J) => M.G(d, v1) - M.G(d, v0) + M.Fv(d, v1, J) - M.Fv(d, v0, J);
  /* líneas de la banda fundamental v = 0 → 1: R(J) (J → J + 1) y P(J) (J → J − 1) con intensidades relativas ∝ (J + 1) o J por e^{−F/kT} */
  M.lines = function (d, T, Jm = 25) {
    const out = [], kT = (kB * T) / (h * c * 100);
    for (let J = 0; J <= Jm; J++) {
      const w = Math.exp(-M.Fv(d, 0, J) / kT);
      out.push({ br: 'R', J, nu: M.G(d, 1) - M.G(d, 0) + M.Fv(d, 1, J + 1) - M.Fv(d, 0, J), I: (J + 1) * w });
      if (J >= 1) out.push({ br: 'P', J, nu: M.G(d, 1) - M.G(d, 0) + M.Fv(d, 1, J - 1) - M.Fv(d, 0, J), I: J * w });
    }
    return out;
  };
  /* ---- Raman rotacional (rotor rígido): desplazamiento Stokes B(4J + 6) para J → J + 2, e intensidad de Placzek–Teller con estadística nuclear ---- */
  M.ramanShift = (B, J) => B * (4 * J + 6);
  M.ramanLines = function (B, T, ns = [1, 1], Jm = 20) {
    const out = [];
    for (let J = 0; J <= Jm; J++) { const w = M.pop(B, T, J, ns), pt = (3 * (J + 1) * (J + 2)) / (2 * (2 * J + 1) * (2 * J + 3)); out.push({ J, stokes: -M.ramanShift(B, J), I: w * pt }); if (J >= 2) out.push({ J, antistokes: M.ramanShift(B, J - 2), I: w * ((3 * (J - 1) * J) / (2 * (2 * J - 1) * (2 * J + 1))) }); }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
