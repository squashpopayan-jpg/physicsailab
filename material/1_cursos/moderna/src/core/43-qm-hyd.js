/* ===================================================================
   43-qm-hyd.js — Átomo de hidrógeno e hidrogenoides (EM.qm.hyd). Unidades atómicas (ħ = m = e = 4πε₀ = 1):
   longitudes en a₀, energías en hartree; Z = carga nuclear y μ = masa reducida en unidades de mₑ (por defecto 1).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Hy = (qm.hyd = {});
  /* E_n = −μ Z²/(2n²) (hartree) */
  Hy.E = (n, Z = 1, mu = 1) => (-mu * Z * Z) / (2 * n * n);
  /* Función radial normalizada R_nl(r) (∫ R² r² dr = 1) con a = a₀/(Zμ): R = N ρ^l e^{−ρ/2} L_{n−l−1}^{2l+1}(ρ), ρ = 2Zμ r/n */
  Hy.R = function (n, l, r, Z = 1, mu = 1) {
    const S = EM.P.sf, a = 1 / (Z * mu), rho = (2 * r) / (n * a);
    const N = Math.sqrt(Math.pow(2 / (n * a), 3) * (S.fact(n - l - 1) / (2 * n * S.fact(n + l))));
    return N * Math.pow(rho, l) * Math.exp(-rho / 2) * S.laguerre(n - l - 1, 2 * l + 1, rho);
  };
  /* Valores esperados ⟨r^k⟩ por cuadratura numérica de Simpson */
  Hy.rk = function (n, l, k, Z = 1, mu = 1) {
    const a = 1 / (Z * mu), rmax = 60 * n * a, N = 6000, h = rmax / N; let s = 0;
    for (let i = 0; i <= N; i++) { const r = Math.max(i * h, 1e-12), R = Hy.R(n, l, r, Z, mu), w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * Math.pow(r, k + 2) * R * R; }
    return (s * h) / 3;
  };
  /* Fórmulas exactas: ⟨r⟩ = [3n² − l(l+1)]/(2Zμ) ; ⟨1/r⟩ = Zμ/n² ; ⟨r²⟩ = n²[5n² + 1 − 3l(l+1)]/(2(Zμ)²) ; ⟨1/r²⟩ = (Zμ)²/(n³(l + ½)) */
  Hy.rMean = (n, l, Z = 1, mu = 1) => (3 * n * n - l * (l + 1)) / (2 * Z * mu);
  Hy.rInv = (n, Z = 1, mu = 1) => (Z * mu) / (n * n);
  Hy.r2Mean = (n, l, Z = 1, mu = 1) => (n * n * (5 * n * n + 1 - 3 * l * (l + 1))) / (2 * (Z * mu) ** 2);
  Hy.rInv2 = (n, l, Z = 1, mu = 1) => ((Z * mu) ** 2) / (n ** 3 * (l + 0.5));
  /* Orbital real ψ_{nlm}(r, θ, φ) = R_nl(r) Y_lm^{real}(θ, φ) */
  Hy.psiReal = (n, l, m, r, th, ph, Z = 1, mu = 1) => Hy.R(n, l, r, Z, mu) * EM.P.sf.Ylm(l, m, th, ph);
  if (typeof module !== 'undefined' && module.exports) module.exports = Hy;
})(typeof window !== 'undefined' ? window : globalThis);
