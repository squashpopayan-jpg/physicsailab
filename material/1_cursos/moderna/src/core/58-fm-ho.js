/* ===================================================================
   58-fm-ho.js — Oscilador armónico cuántico y moléculas diatómicas (EM.fm.ho): funciones de onda de Hermite, valores esperados,
   región clásicamente prohibida, potencial de Morse. Sin DOM; SI salvo aviso (números de onda en cm⁻¹ donde se indica).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const H = (fm.ho = {});
  const { h, hbar, c, e, u } = K;
  /* Función de onda en la variable adimensional ξ = x/x₀, x₀ = √(ħ/mω): ψ_n(ξ) = (π^{1/4}√(2ⁿ n!))⁻¹ H_n(ξ) e^{−ξ²/2} (recurrencia estable) */
  H.psi = (n, xi) => {
    let p0 = Math.pow(Math.PI, -0.25) * Math.exp(-xi * xi / 2), p1 = Math.SQRT2 * xi * p0;
    if (n === 0) return p0; if (n === 1) return p1;
    for (let k = 2; k <= n; k++) { const p2 = Math.sqrt(2 / k) * xi * p1 - Math.sqrt((k - 1) / k) * p0; p0 = p1; p1 = p2; }
    return p1;
  };
  H.E = (n, omega) => hbar * omega * (n + 0.5);                                     /* J */
  H.turning = (n) => Math.sqrt(2 * n + 1);                                          /* ξ del punto de retorno clásico */
  /* Probabilidad de encontrar la partícula fuera de la región permitida clásicamente (|ξ| > √(2n+1)), por Simpson */
  H.pForbidden = (n) => {
    const xt = H.turning(n), L = xt + 12, N = 4000, dx = (L - xt) / N; let s = 0;
    for (let i = 0; i <= N; i++) { const x = xt + i * dx, f = H.psi(n, x) ** 2; s += f * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2); }
    return 2 * (s * dx) / 3;
  };
  /* Valores esperados (en unidades de x₀ y ħ/x₀): ⟨x²⟩ = n + ½, ⟨p²⟩ = n + ½, ⟨V⟩ = ⟨K⟩ = E/2; Δx Δp = (n + ½)ħ */
  H.dxdp = (n) => n + 0.5;
  /* Probabilidad clásica de un oscilador con amplitud A: p(ξ) = 1/(π√(A² − ξ²)) */
  H.classical = (xi, n) => { const A2 = 2 * n + 1; return Math.abs(xi) < Math.sqrt(A2) ? 1 / (Math.PI * Math.sqrt(A2 - xi * xi)) : 0; };
  /* ---------- Moléculas diatómicas ---------- */
  H.CM = 100 * c;                                                                    /* 1 cm⁻¹ en Hz */
  H.kForce = (we, mu) => mu * (2 * Math.PI * H.CM * we) ** 2;                        /* constante de fuerza (N/m) con ωe en cm⁻¹ y μ en kg */
  H.reduced = (m1, m2) => (m1 * m2) / (m1 + m2);
  /* Morse: E(n) = ωe(n + ½) − ωe xe (n + ½)² (cm⁻¹), D_e = ωe²/(4 ωe xe); número de estados ligados ⌊ωe/(2ωexe) − ½⌋ + 1 */
  H.morseE = (n, we, wexe) => we * (n + 0.5) - wexe * (n + 0.5) ** 2;
  H.morseDe = (we, wexe) => (we * we) / (4 * wexe);
  H.morseN = (we, wexe) => Math.floor(we / (2 * wexe) - 0.5) + 1;
  /* Transiciones vibracionales n → n′ (cm⁻¹) */
  H.morseLine = (n0, n1, we, wexe) => H.morseE(n1, we, wexe) - H.morseE(n0, we, wexe);
  /* Potencial de Morse V(r) = D_e(1 − e^{−a(r − r_e)})² con a = ωe √(2π²cμ/(D_e h))·… → a = √(k/2D_e) */
  H.morseA = (we, wexe, mu) => Math.sqrt(H.kForce(we, mu) / (2 * H.morseDe(we, wexe) * 100 * h * c));
  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(typeof window !== 'undefined' ? window : globalThis);
