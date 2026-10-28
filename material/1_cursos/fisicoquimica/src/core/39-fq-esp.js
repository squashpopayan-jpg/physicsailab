/* ===================================================================
   39-fq-esp.js — Espectroscopía electrónica (Beer–Lambert, Franck–Condon) y de resonancia magnética nuclear (Larmor, multipletes, sistema AB exacto).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const E = (FQ.esp = {});
  const hPl = 6.62607015e-34, kB = 1.380649e-23, mu_n = 5.0507837461e-27; /* magnetón nuclear (J/T) */
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

  /* Beer–Lambert: A = ε c l; transmitancia T = 10^−A (con luz parásita s: T = (10^−A + s)/(1 + s)) */
  E.absorbance = (eps, c, l) => eps * c * l;
  E.transmit = (A, stray) => (Math.pow(10, -A) + (stray || 0)) / (1 + (stray || 0));

  /* Franck–Condon de dos osciladores armónicos de igual frecuencia desplazados: |⟨0|v⟩|² = e^{−S}S^v/v! (S = factor de Huang–Rhys) */
  E.fc = (S, v) => Math.exp(-S) * Math.pow(S, v) / fact(v);
  /* Espectro vibrónico: líneas (v) a energías E00 ± vħω con intensidades FC; absorción hacia arriba, emisión hacia abajo (imagen especular) */
  E.vibronic = (S, w, E00, nmax) => { const abs = [], emi = []; for (let v = 0; v <= nmax; v++) { abs.push([E00 + v * w, E.fc(S, v), v]); emi.push([E00 - v * w, E.fc(S, v), v]); } return { abs, emi }; };
  E.stokes = (S, w) => 2 * S * w; /* desplazamiento de Stokes entre los máximos de absorción y emisión (para S grande) = 2·λ, con λ = Sħω la energía de reorganización */

  /* RMN: frecuencia de Larmor ν = γB₀/2π = g_N μ_N B₀/h; ΔN/N = hν/(2k_BT) (alta temperatura) */
  E.NUC = { H1: ['¹H', 5.5856946893], C13: ['¹³C', 1.4048236], F19: ['¹⁹F', 5.257736], P31: ['³¹P', 2.2632], N15: ['¹⁵N', -0.5663826] };
  E.larmor = (g, B0) => (Math.abs(g) * mu_n * B0) / hPl; /* Hz */
  E.boltzDiff = (nu, T) => (hPl * nu) / (2 * kB * T);
  /* Multiplete de primer orden para n vecinos equivalentes de espín ½: coeficientes de Pascal */
  E.pascal = (n) => { let row = [1]; for (let i = 0; i < n; i++) { const nx = [1]; for (let j = 1; j < row.length; j++) nx.push(row[j - 1] + row[j]); nx.push(1); row = nx; } return row; };
  /* Sistema AB (dos espines ½, desplazamientos νA, νB y acoplamiento J, en Hz) por diagonalización del hamiltoniano de 4 niveles. Devuelve las cuatro líneas {f, I} */
  E.ab = function (nuA, nuB, J) {
    /* base |αα⟩, |αβ⟩, |βα⟩, |ββ⟩ ; H = νA Iz1 + νB Iz2 + J I1·I2 */
    const H = [[(nuA + nuB) / 2 + J / 4, 0, 0, 0], [0, (nuA - nuB) / 2 - J / 4, J / 2, 0], [0, J / 2, (nuB - nuA) / 2 - J / 4, 0], [0, 0, 0, -(nuA + nuB) / 2 + J / 4]];
    const eg = FQ.eigSym(H), val = eg.val, vec = eg.vec; const Fx = [[0, 1, 1, 0], [1, 0, 0, 1], [1, 0, 0, 1], [0, 1, 1, 0]].map((r) => r.map((v) => v / 2)); /* Ix total = (I+ + I−)/2 en esta base */
    const lines = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { let m = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) m += vec[i][a] * Fx[a][b] * vec[j][b]; const I = m * m; if (I > 1e-9) lines.push({ f: Math.abs(val[j] - val[i]), I }); }
    return lines.sort((x, y) => x.f - y.f);
  };
  /* Fórmulas analíticas del AB: D = √(Δν² + J²); líneas en ν̄ ± (D ± J)/2 con intensidades 1 ∓ J/D */
  E.abAnalytic = (nuA, nuB, J) => { const D = Math.hypot(nuA - nuB, J), c = (nuA + nuB) / 2; return [{ f: c - (D + J) / 2, I: 1 - J / D }, { f: c - (D - J) / 2, I: 1 + J / D }, { f: c + (D - J) / 2, I: 1 + J / D }, { f: c + (D + J) / 2, I: 1 - J / D }].sort((a, b) => a.f - b.f); };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
