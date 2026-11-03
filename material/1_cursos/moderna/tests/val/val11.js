/* Cap. 11 — Pozo infinito */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const X = EM.fm.box, K = EM.qm.K;
  for (const r of ref.box_fd) chk(S, `Pozo infinito: E_${r.n} = n²π²ħ²/2mL² (L = ħ = m = 1) frente a la diagonalización de diferencias finitas (4000 puntos, scipy.linalg.eigh_tridiagonal)`, (r.n * r.n * Math.PI * Math.PI) / 2, r.E, 1e-5);
  chk(S, 'Esfera infinita (l = 0): E = π²ħ²/2mR² frente a la ecuación radial u″ = −2Eu discretizada', (Math.PI * Math.PI) / 2, ref.sphere_fd, 2e-6);
  chk(L, 'E₁ de un electrón en 1 nm: 0.3760 eV', X.E(1, 1e-9) / K.e, 0.376030, 1e-5);
  for (const r of ref.box_prob) chk(S, `Probabilidad en [${r.a.toFixed(2)}L, ${r.b.toFixed(2)}L] para n = ${r.n}: forma cerrada frente a scipy.quad`, X.prob(r.n, r.a, r.b), r.P, 1e-10);
  for (const [n, v] of Object.entries(ref.box_x2)) chk(Y, `⟨x²⟩ = L²(1/3 − 1/2n²π²), n = ${n}, frente a SymPy`, X.x2(+n), v, 1e-12);
  for (const [n, v] of Object.entries(ref.box_p2)) chk(Y, `⟨p²⟩ = n²π²ħ²/L², n = ${n}, frente a SymPy`, X.dpL(+n) ** 2, v, 1e-12);
  for (const n of [1, 2, 3, 10, 100]) chk(L, `ΔxΔp/(ħ/2) = √(n²π²/3 − 2) para n = ${n}`, 2 * X.uncertainty(n), Math.sqrt((n * n * Math.PI * Math.PI) / 3 - 2), 1e-12);
  chk(L, 'Límite clásico n → ∞: Δx → L/√12 = 0.2887 L', X.dx(1000), 1 / Math.sqrt(12), 1e-6);
  /* dinámica */
  for (const g of ref.gauss_evol) {
    const co = X.gaussCoeffs(g.u0, g.s, g.k0, 120, 6000);
    g.pts.forEach((p, i) => chk(S, `Paquete gaussiano en el pozo (t = ${g.tt} ħ/E₁, u = ${p}): densidad de la serie de autofunciones frente a la evolución del hamiltoniano discretizado (4000 puntos, descomposición espectral)`, X.density(co, p, g.tt), g.dens[i], 5e-3, g.dens[i] > 1e-2));
  }
  { const co = X.gaussCoeffs(0.3, 0.05, 40, 120, 6000); let nrm = 0; for (let n = 0; n < co.N; n++) nrm += co.cr[n] ** 2 + co.ci[n] ** 2; chk(L, 'Normalización: Σ|c_n|² = 1 para el paquete gaussiano (120 modos)', nrm, 1, 1e-5);
    const d0 = X.density(co, 0.3, 0), d1 = X.density(co, 0.3, 2 * Math.PI); chk(L, 'Revival total: ψ(t = 4mL²/πħ) = ψ(0) en todos los puntos (densidad en u = 0.3)', d1, d0, 1e-9);
    const dh = X.density(co, 0.7, Math.PI), dr = X.density(co, 0.3, 0); void dh; void dr; }
  chk(L, 'Tiempo de revival de un electrón en 1 nm: 4mL²/(πħ) = 11.0 fs', X.revivalTime(1e-9) * 1e15, 11.0, 5e-3);
  chk(L, 'Periodo de la superposición de n = 1 y n = 2 (1 nm): T = h/(3E₁) = 3.667 fs', X.beatPeriod(1, 2, 1e-9) * 1e15, 3.667, 5e-4);
  /* Brus */
  { const cd = { Eg: 1.74, me: 0.13, mh: 0.45, eps: 10.6 }; const R = 2e-9;
    const conf = (Math.PI * Math.PI * K.hbar * K.hbar) / (2 * K.me * R * R) * (1 / 0.13 + 1 / 0.45) / K.e;
    chk(L, 'Fórmula de Brus: el término de confinamiento es la suma de las energías del electrón y del hueco en una esfera infinita (R = 2 nm)', conf, X.sphereE0(R, 0.13 * K.me) / K.e + X.sphereE0(R, 0.45 * K.me) / K.e, 1e-12);
    chk(L, 'Brus para CdSe (R = 2 nm): energía de la transición 2.55 eV', X.brus(R, cd), 2.5505, 2e-3); }
};
