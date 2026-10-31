/* ===================================================================
   59-qm-field.js — Campo cuantizado y modelo de Jaynes–Cummings (EM.qm.fld), ħ = 1.
   H_I = (Δ/2)σ_z + g(σ₊a + σ₋a†) en el sistema que gira a la frecuencia del campo (Δ = ω₀ − ω); estados |e,n⟩, |g,n⟩.
   Solución exacta por bloques 2×2 {|e,n⟩, |g,n+1⟩}. Función de Wigner con ξ = x/ℓ, π = pℓ/ħ (vacío: e^{−ξ²−π²}/π).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const F = (qm.fld = {});
  const PI = Math.PI;
  /* amplitudes de un estado coherente |α⟩ (α real) y de Fock |m⟩ hasta N términos; térmico no hace falta */
  F.cohAmps = (nbar, N) => { const c = new Float64Array(N); c[0] = Math.exp(-nbar / 2); for (let n = 1; n < N; n++) c[n] = (c[n - 1] * Math.sqrt(nbar)) / Math.sqrt(n); return c; };
  F.fockAmps = (m, N) => { const c = new Float64Array(N); c[m] = 1; return c; };
  F.Omega = (n, Delta, g) => Math.sqrt(Delta * Delta + 4 * g * g * (n + 1));
  /* energías vestidas de la variedad {|e,n⟩, |g,n+1⟩} en el sistema rotante: ±Ω_n/2 */
  F.dressed = (n, Delta, g) => [-F.Omega(n, Delta, g) / 2, F.Omega(n, Delta, g) / 2];
  /* Evolución: átomo en |e⟩, campo en Σ c_n|n⟩ (c real). Devuelve las amplitudes del campo asociadas a |e⟩ y a |g⟩ (complejas) */
  F.evolve = (c, Delta, g, t) => {
    const N = c.length, er = new Float64Array(N), ei = new Float64Array(N), gr = new Float64Array(N), gi = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const Om = F.Omega(n, Delta, g), s = Math.sin((Om * t) / 2), co = Math.cos((Om * t) / 2);
      er[n] = c[n] * co; ei[n] = -c[n] * (Delta / Om) * s;
      if (n + 1 < N) gi[n + 1] = -c[n] * ((2 * g * Math.sqrt(n + 1)) / Om) * s;
    }
    return { er, ei, gr, gi };
  };
  F.pe = (c, Delta, g, t) => { let p = 0; for (let n = 0; n < c.length; n++) { const Om = F.Omega(n, Delta, g), s = Math.sin((Om * t) / 2); p += c[n] * c[n] * (1 - ((4 * g * g * (n + 1)) / (Om * Om)) * s * s); } return p; };
  /* estado reducido del átomo y entrelazamiento átomo–campo */
  F.atom = (c, Delta, g, t) => {
    const s = F.evolve(c, Delta, g, t); let ee = 0, gg = 0, rr = 0, ri = 0;
    for (let n = 0; n < c.length; n++) { ee += s.er[n] ** 2 + s.ei[n] ** 2; gg += s.gr[n] ** 2 + s.gi[n] ** 2; rr += s.er[n] * s.gr[n] + s.ei[n] * s.gi[n]; ri += s.ei[n] * s.gr[n] - s.er[n] * s.gi[n]; }
    const pur = ee * ee + gg * gg + 2 * (rr * rr + ri * ri), det = Math.max(0, ee * gg - rr * rr - ri * ri), disc = Math.sqrt(Math.max(0, 1 - 4 * det)), l1 = (1 + disc) / 2, l2 = (1 - disc) / 2;
    const S = (x) => (x > 1e-15 ? -x * Math.log2(x) : 0);
    return { ee, gg, reg: [rr, ri], purity: pur, S: S(l1) + S(l2) };
  };
  /* Colapso y revivals: tiempo de colapso y de primer revival (resonancia, n̄ ≫ 1) */
  F.tCollapse = (g) => Math.SQRT2 / g;
  F.tRevival = (nbar, g) => (2 * PI * Math.sqrt(nbar)) / g;
  /* Wigner de una combinación de Fock Σ(cr + i ci)_n|n⟩ sobre una malla M×M: ξ_i = (i − (M−1)/2)δ, π_j = (j − (M−1)/2)δ, δ = 2L/M
     W_ij = (δ/π) Σ_k ψ*(ξ_i + kδ) ψ(ξ_i − kδ) e^{2iπ_j kδ} */
  F.wigner = (cr, ci, L, M) => {
    const N = cr.length, d = (2 * L) / M, J = 3 * M, off = M, pr = new Float64Array(J), pi_ = new Float64Array(J);
    for (let j = 0; j < J; j++) {
      const x = (j - off - (M - 1) / 2) * d; let q0 = Math.pow(PI, -0.25) * Math.exp(-x * x / 2), q1 = Math.SQRT2 * x * q0, sr = 0, si = 0;
      for (let n = 0; n < N; n++) {
        let v;
        if (n === 0) v = q0; else if (n === 1) v = q1; else { v = Math.sqrt(2 / n) * x * q1 - Math.sqrt((n - 1) / n) * q0; q0 = q1; q1 = v; }
        sr += cr[n] * v; si += ci[n] * v;
      }
      pr[j] = sr; pi_[j] = si;
    }
    const W = new Float64Array(M * M), K = M - 1;
    for (let i = 0; i < M; i++) {
      const a = [], b = [];
      for (let k = -K; k <= K; k++) { const u = i + off + k, v = i + off - k; a.push([pr[u] * pr[v] + pi_[u] * pi_[v], pr[u] * pi_[v] - pi_[u] * pr[v], k]); }
      for (let j = 0; j < M; j++) {
        const pj = (j - (M - 1) / 2) * d; let s = 0;
        for (const [re, im, k] of a) { const ph = 2 * pj * k * d; s += re * Math.cos(ph) - im * Math.sin(ph); }
        W[j * M + i] = (d / PI) * s;
      }
    }
    return W;
  };
  /* Wigner del campo tras la interacción: W[φ_e] + W[φ_g] (no normalizadas: suman ρ_F) */
  F.fieldWigner = (c, Delta, g, t, L, M) => {
    const s = F.evolve(c, Delta, g, t), A = F.wigner(s.er, s.ei, L, M), B = F.wigner(s.gr, s.gi, L, M);
    for (let i = 0; i < A.length; i++) A[i] += B[i];
    return A;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : globalThis);
