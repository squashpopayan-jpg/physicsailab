/* Cap. 7 — Radiación térmica */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const B = EM.fm.bb, O = EM.qm.orig, K = EM.qm.K;
  for (const [k, v] of Object.entries(ref.planck_lambda)) { const [l, T] = k.split('_'); chk(S, `Radiancia de Planck B_λ (λ = ${l} m, T = ${T} K) frente a numpy`, O.planckLambda(+l, +T), v, 1e-9); }
  for (const [k, v] of Object.entries(ref.planck_nu)) { const [n, T] = k.split('_'); chk(S, `Radiancia de Planck B_ν (ν = ${n} Hz, T = ${T} K) frente a numpy`, B.planckNu(+n, +T), v, 1e-9); }
  chk(S, 'σ de la biblioteca frente a scipy.constants', K.sigma, ref.sigma, 1e-9); chk(S, 'Constante de Wien b frente a scipy.constants', K.b_wien, ref.wien_b, 1e-9);
  chk(S, 'Raíz de Wien en frecuencia x = 3(1 − e⁻ˣ) = 2.821439 frente a brentq', B.wienNuX, ref.wien_nu_x, 1e-12);
  chk(S, 'Constante de desplazamiento de Wien en frecuencia: 5.8789×10¹⁰ Hz/K frente a scipy.constants', B.wienNuConst, ref.wien_nu_const, 1e-8);
  chk(M_, 'ζ(3) frente a mpmath', B.ZETA3, ref.zeta3, 1e-15);
  chk(M_, '∫x²/(eˣ − 1)dx = 2ζ(3) (mpmath.quad)', 2 * B.ZETA3, ref.int_x2, 1e-13); chk(M_, '∫x³/(eˣ − 1)dx = π⁴/15 (mpmath.quad)', Math.PI ** 4 / 15, ref.int_x3, 1e-13);
  chk(S, 'Constante de radiación a = 4σ/c frente a scipy.constants', B.a, ref.a_rad, 1e-9);
  for (const T of [2.7255, 300, 5772]) {
    chk(S, `Densidad de energía a T⁴ (T = ${T} K) frente a la integral numérica de u_ν (scipy.quad)`, B.energyDensity(T), ref.u_int[String(T)], 1e-7);
    chk(S, `Densidad numérica de fotones 16πζ(3)(kT/hc)³ (T = ${T} K) frente a la integral numérica (scipy.quad)`, B.photonDensity(T), ref.n_int[String(T)], 1e-7);
  }
  chk(M_, 'Fotones del CMB (T = 2.7255 K): 410.7 por cm³ frente a mpmath', B.photonDensity(2.7255) / 1e6, ref.n_photon_cm3, 1e-12);
  chk(L, 'Energía media por fotón = π⁴/(30ζ(3)) kT = 2.7012 kT', B.meanPhotonEnergy(1000) / (K.kB * 1000), Math.PI ** 4 / (30 * B.ZETA3), 1e-9);
  chk(L, 'Presión de radiación p = u/3 y entropía s = (4/3)aT³ del gas de fotones (T = 1000 K)', B.pressure(1000) / B.energyDensity(1000), 1 / 3, 1e-14);
  chk(L, 'Energía media por modo → kT cuando hν ≪ kT (equipartición)', B.meanModeEnergy(1e9, 300) / (K.kB * 300), 1, 5e-3);
  chk(L, 'Energía media por modo con hν = kT: 1/(e − 1) = 0.58198 kT', B.meanModeEnergy((K.kB * 300) / K.h, 300) / (K.kB * 300), 1 / (Math.E - 1), 1e-12);
  chk(L, 'Luminosidad solar L = 4πR²σT⁴ con T = 5772 K, R = 6.957×10⁸ m: 3.828×10²⁶ W (IAU 2015)', B.luminosity(ref.Rsun, ref.Tsun), ref.L_sun_nominal, 2e-4);
  chk(L, 'Cuerpo negro: u_ν integrada con la densidad de modos: ∫8πν²/c³ · kT dν diverge (Rayleigh–Jeans), pero u_ν(Planck)/u_ν(RJ) → 1 en ν = 10⁹ Hz, T = 300 K', B.uNu(1e9, 300) / (B.modeDensity(1e9) * K.kB * 300), 1, 5e-3);
  for (const [T, xy] of Object.entries(ref.xy_bb)) { const q = B.xy(+T); chk(S, `Cromaticidad x del cuerpo negro a ${T} K frente a colour-science (CIE 1931; ajuste de Wyman et al.)`, q[0], xy[0], 8e-3); chk(S, `Cromaticidad y del cuerpo negro a ${T} K frente a colour-science`, q[1], xy[1], 8e-3); }
};
