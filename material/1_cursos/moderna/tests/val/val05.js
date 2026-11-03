/* Cap. 5 — Doppler, aberración, Cherenkov, campos en movimiento */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const R = EM.fm.rel, K = EM.qm.K, c = K.c;
  for (const r of ref.doppler) {
    /* r.th es el ángulo del fotón en el sistema del observador; r.th_star el de emisión en el sistema de la fuente */
    chk(S, `Doppler (β = ${r.b}, θ* = ${r.th_star.toFixed(2)}): f_obs/f₀ frente al boost explícito del cuadrivector del fotón`, R.doppler(r.b, r.th), r.f, 1e-12);
    chk(S, `Efecto faro / aberración (β = ${r.b}, θ* = ${r.th_star.toFixed(2)}): ángulo en el laboratorio frente al boost del fotón`, R.headlight(r.b, r.th_star), Math.abs(r.th), 1e-12, Math.abs(r.th) > 1e-6);
  }
  chk(L, 'Doppler longitudinal: alejamiento √((1−β)/(1+β)) = 1/(γ(1+β))', R.dopplerRecede(0.6), R.doppler(0.6, Math.PI), 1e-14);
  chk(L, 'Doppler longitudinal: acercamiento √((1+β)/(1−β)) = 2 para β = 0.6', R.dopplerApproach(0.6), 2, 1e-14);
  chk(L, 'Doppler transversal: la luz que llega perpendicular a la velocidad en el sistema del observador tiene f = f₀/γ = 0.8 f₀ (β = 0.6)', R.doppler(0.6, Math.PI / 2), 0.8, 1e-14);
  chk(L, 'Doppler: la luz emitida perpendicularmente en el sistema de la fuente llega con f = γf₀ = 1.25 f₀ (β = 0.6)', R.doppler(0.6, Math.acos(0.6)), 1.25, 1e-14);
  chk(L, 'Corrimiento al rojo z = 0.1 ↔ β = 0.0950 y viceversa', R.betaRedshift(R.redshiftBeta(0.1)), 0.1, 1e-13);
  chk(L, 'z = 1 corresponde a β = 0.6 (λ doble)', R.redshiftBeta(1), 0.6, 1e-14);
  /* Normalización de la densidad de fotones del efecto faro */
  for (const r of ref.beam_norm) chk(S, `∫ D² dΩ = 4π (β = ${r.b}, scipy.integrate.quad)`, r.I, 4 * Math.PI, 1e-10);
  { const b = 0.9, N = 40000; let I = 0; for (let i = 0; i < N; i++) { const th = ((i + 0.5) * Math.PI) / N; I += R.beamDensity(b, th) * 2 * Math.PI * Math.sin(th) * (Math.PI / N); } chk(L, 'La densidad de fotones del efecto faro está normalizada a 1 (cuadratura propia, β = 0.9)', I, 1, 1e-8); }
  chk(L, 'Efecto faro: la mitad de los fotones queda dentro del cono cos θ = β (β = 0.9: 25.84°)', (R.headlight(0.9, Math.PI / 2) * 180) / Math.PI, 25.8419, 1e-5);
  chk(L, 'Aberración estelar de una estrella a 90°: Δα = β rad al primer orden (v = 29.78 km/s: 20.49″)', (Math.PI / 2 - R.aberrate(29.78e3 / c, Math.PI / 2)) * 206264.806, 20.4894, 1e-4);
  /* Cherenkov */
  for (const r of ref.cherenkov) {
    const th = R.cherenkovAngle(r.n, r.beta);
    chk(S, `Cherenkov (m = ${r.m.toFixed(1)} MeV, K = ${r.K} MeV, n = ${r.n}): cos θ = 1/(nβ) frente a la conservación exacta de E y p con un fotón de 2.5 eV (difiere en el retroceso, 10⁻⁶ relativo)`, Math.cos(th), r.cos_exact, 2e-6);
  }
  chk(L, 'Umbral de Cherenkov en agua para el electrón: K = 0.2618 MeV', R.cherenkovThresholdK(1.333, R.MASS.e), 0.261807, 1e-5);
  chk(L, 'Umbral de Cherenkov en agua para el muón: K = 54.1 MeV', R.cherenkovThresholdK(1.333, R.MASS.mu), 54.1335, 1e-5);
  chk(L, 'Ángulo máximo de Cherenkov en agua (β → 1): arccos(1/1.333) = 41.4°', (R.cherenkovAngle(1.333, 1) * 180) / Math.PI, 41.4, 2e-3);
  chk(L, 'Fotones de Cherenkov por cm en agua, 300–600 nm (β = 1): 334 (Frank–Tamm)', R.cherenkovYield(1.333, 1, 300e-9, 600e-9) / 100, 334.112, 1e-5);
  chk(L, 'Sin umbral no hay luz: β = 0.74 en agua', R.cherenkovYield(1.333, 0.74, 300e-9, 600e-9), 0, 0, false);
  /* Campos */
  for (const r of ref.fields) {
    const Bsi = r.B.map((v) => v / c), f = R.fieldBoost(r.E, Bsi, r.b);   /* la referencia usa c = 1: B_ref = c·B_SI */
    for (let i = 0; i < 3; i++) {
      chk(S, `Transformación de campos (β = ${r.b}): E′${'xyz'[i]} frente a Λ F Λᵀ (numpy)`, f.E[i], r.Ep[i], 1e-12);
      chk(S, `Transformación de campos (β = ${r.b}): cB′${'xyz'[i]} frente a Λ F Λᵀ (numpy)`, f.B[i] * c, r.Bp[i], 1e-12);
    }
    const inv = R.fieldInvariants(r.E, Bsi), inv2 = R.fieldInvariants(f.E, f.B);
    chk(Y, `Invariante E² − c²B² (β = ${r.b}) conservado por el impulso y igual al de la referencia`, inv2[0], r.inv1, 1e-11);
    chk(Y, `Invariante E·B (β = ${r.b}) conservado por el impulso`, inv2[1] * c, r.inv2, 1e-11);
    void inv;
  }
  /* Carga en movimiento */
  for (const r of ref.lw) {
    const E0 = 1 / (r.r * r.r);
    chk(S, `Carga en movimiento (β = ${r.b}, θ = ${r.th.toFixed(2)}): |E| = (1 − β²)/(1 − β² sen²θ)^(3/2)/r² con r desde la posición presente, frente a Liénard–Wiechert (tiempo retardado, brentq)`, R.movingChargeE(r.b, r.th) * E0, r.E, 1e-10);
    chk(S, `Carga en movimiento (β = ${r.b}, θ = ${r.th.toFixed(2)}): el campo es radial desde la posición presente (ángulo de E igual al del vector r)`, r.ang, r.th, 1e-10, Math.abs(r.th) > 1e-9);
  }
  chk(Y, 'Alambre de Purcell: la fuerza magnética sale de la electrostática, cociente 1 (SymPy)', ref.purcell_ratio, 1, 1e-12);
};
