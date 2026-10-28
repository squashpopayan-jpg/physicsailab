/* ===================================================================
   39-fq-pol.js — Macromoléculas: cadenas ideales (libremente articulada y de rotación libre), elasticidad entrópica (Langevin, Marko–Siggia),
   termodinámica de disoluciones de polímeros (Flory–Huggins), distribuciones de masa molar (Flory) y transición hélice–ovillo (Zimm–Bragg).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const P = (FQ.pol = {});
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  /* Cadena de N enlaces de longitud 1 con ángulo de enlace fijo (cos θ = c; c = 0 → ni correlación en promedio: libremente articulada si c = 0).
     Se genera por rotación aleatoria alrededor del enlace anterior. Devuelve R² medio, R_g² medio y el histograma de |R| */
  P.mc = function (N, c, ncad, seed) {
    const r = rng(seed || 1), sn = Math.sqrt(Math.max(0, 1 - c * c)); let sR2 = 0, sRg2 = 0; const Rs = [];
    for (let k = 0; k < ncad; k++) {
      let t = (() => { const u = 2 * r() - 1, ph = 2 * Math.PI * r(), s = Math.sqrt(1 - u * u); return [s * Math.cos(ph), s * Math.sin(ph), u]; })(), x = [0, 0, 0], pts = [[0, 0, 0]];
      for (let i = 0; i < N; i++) {
        if (i > 0 || true) { /* nuevo enlace: ángulo polar fijo respecto de t y azimut aleatorio (c = 0 sería un ángulo de 90°: usar libre si c ≡ null) */
          if (c === null) { const u = 2 * r() - 1, ph = 2 * Math.PI * r(), s = Math.sqrt(1 - u * u); t = [s * Math.cos(ph), s * Math.sin(ph), u]; }
          else { const a = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], d = a[0] * t[0] + a[1] * t[1] + a[2] * t[2], e1 = [a[0] - d * t[0], a[1] - d * t[1], a[2] - d * t[2]], n1 = Math.hypot(...e1), u1 = e1.map((v) => v / n1), u2 = [t[1] * u1[2] - t[2] * u1[1], t[2] * u1[0] - t[0] * u1[2], t[0] * u1[1] - t[1] * u1[0]], ph = 2 * Math.PI * r(); t = [0, 1, 2].map((q) => c * t[q] + sn * (Math.cos(ph) * u1[q] + Math.sin(ph) * u2[q])); }
        }
        x = [x[0] + t[0], x[1] + t[1], x[2] + t[2]]; pts.push(x.slice());
      }
      const R2 = x[0] * x[0] + x[1] * x[1] + x[2] * x[2]; sR2 += R2; Rs.push(Math.sqrt(R2));
      const cm = [0, 1, 2].map((q) => pts.reduce((a, p) => a + p[q], 0) / pts.length); sRg2 += pts.reduce((a, p) => a + (p[0] - cm[0]) ** 2 + (p[1] - cm[1]) ** 2 + (p[2] - cm[2]) ** 2, 0) / pts.length;
    }
    return { R2: sR2 / ncad, Rg2: sRg2 / ncad, Rs };
  };
  /* Cadena de rotación libre con cos θ = c (analítico): ⟨R²⟩ = N[(1 + c)/(1 − c) − 2c(1 − c^N)/(N(1 − c)²)] (longitud de enlace 1) */
  P.R2frc = (N, c) => (c === null || c === 0 ? N : N * ((1 + c) / (1 - c) - (2 * c * (1 - Math.pow(c, N))) / (N * (1 - c) * (1 - c))));
  /* Cadena tipo gusano (Kratky–Porod): ⟨R²⟩ = 2PL[1 − (P/L)(1 − e^{−L/P})] */
  P.R2wlc = (L, Pp) => 2 * Pp * L * (1 - (Pp / L) * (1 - Math.exp(-L / Pp)));
  P.Rg2gauss = (N, b) => (N * b * b) / 6;
  /* Distribución de extremos de una cadena gaussiana: P(R) = 4π R² (3/2πNb²)^{3/2} exp(−3R²/2Nb²) */
  P.pR = (R, N, b) => 4 * Math.PI * R * R * Math.pow(3 / (2 * Math.PI * N * b * b), 1.5) * Math.exp((-3 * R * R) / (2 * N * b * b));
  /* Elasticidad entrópica: FJC (Langevin): x/L = coth(β) − 1/β con β = f b/kT; WLC (Marko–Siggia 1995): fP/kT = 1/[4(1 − x/L)²] − 1/4 + x/L */
  P.langevin = (b) => (Math.abs(b) < 1e-3 ? b / 3 : 1 / Math.tanh(b) - 1 / b);
  P.fjcForce = (xL, kTb) => { let lo = 0, hi = 1e4; for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (P.langevin(m) < xL) lo = m; else hi = m; } return 0.5 * (lo + hi) * kTb; }; /* kTb = k_BT/b */
  P.wlcForce = (xL, Pp, kT) => (kT / Pp) * (1 / (4 * (1 - xL) * (1 - xL)) - 0.25 + xL);
  /* Flory–Huggins por sitio de red: f = φ ln φ/N + (1 − φ) ln(1 − φ) + χ φ(1 − φ) */
  P.fFH = (phi, N, chi) => (phi * Math.log(phi)) / N + (1 - phi) * Math.log(1 - phi) + chi * phi * (1 - phi);
  P.dfFH = (phi, N, chi) => (Math.log(phi) + 1) / N - Math.log(1 - phi) - 1 + chi * (1 - 2 * phi);
  P.chiSpin = (phi, N) => 0.5 * (1 / (N * phi) + 1 / (1 - phi)); /* condición espinodal */
  P.critical = (N) => ({ phi: 1 / (1 + Math.sqrt(N)), chi: 0.5 * Math.pow(1 + 1 / Math.sqrt(N), 2) });
  /* μ del disolvente y del polímero (por sitio) y presión osmótica del polímero en el disolvente (Π V₁/RT) */
  P.mu1 = (phi, N, chi) => Math.log(1 - phi) + (1 - 1 / N) * phi + chi * phi * phi;
  P.mu2 = (phi, N, chi) => Math.log(phi) - (N - 1) * (1 - phi) + chi * N * (1 - phi) * (1 - phi);
  P.osmotic = (phi, N, chi) => -P.mu1(phi, N, chi);
  /* Binodal por igualdad de μ₁ y μ₂ (tangente común); devuelve [φ_a, φ_b] a χ dado, o null */
  P.binodal = function (N, chi) {
    const c = P.critical(N); if (chi <= c.chi) return null; const sp = (() => { let lo = 1e-9, hi = c.phi; for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (P.chiSpin(m, N) > chi) lo = m; else hi = m; } let lo2 = c.phi, hi2 = 1 - 1e-9; for (let i = 0; i < 100; i++) { const m = 0.5 * (lo2 + hi2); if (P.chiSpin(m, N) < chi) lo2 = m; else hi2 = m; } return [0.5 * (lo + hi), 0.5 * (lo2 + hi2)]; })();
    let a = sp[0] * 0.5, b = (1 + sp[1]) / 2; if (N > 1) a = Math.max(1e-9, sp[0] * 0.3); let x = [a, b];
    for (let it = 0; it < 200; it++) { const F = [P.mu1(x[0], N, chi) - P.mu1(x[1], N, chi), P.mu2(x[0], N, chi) - P.mu2(x[1], N, chi)], h = 1e-7, J = [[0, 0], [0, 0]]; for (let j = 0; j < 2; j++) { const xp = x.slice(); xp[j] += h * Math.max(1e-3, x[j]); const Fp = [P.mu1(xp[0], N, chi) - P.mu1(xp[1], N, chi), P.mu2(xp[0], N, chi) - P.mu2(xp[1], N, chi)]; J[0][j] = (Fp[0] - F[0]) / (xp[j] - x[j]); J[1][j] = (Fp[1] - F[1]) / (xp[j] - x[j]); } const d = FQ.solve(J, [-F[0], -F[1]]); if (!d) return null; let nx = [x[0] + d[0], x[1] + d[1]]; nx = nx.map((v) => Math.min(1 - 1e-12, Math.max(1e-12, v))); const err = Math.abs(nx[0] - x[0]) + Math.abs(nx[1] - x[1]); x = nx; if (err < 1e-13) break; }
    return x[0] < x[1] ? x : [x[1], x[0]];
  };
  /* Distribución de Flory (policondensación, p = grado de conversión): fracción en número x_n = (1 − p)p^{n−1}; Xn = 1/(1 − p), Xw = (1 + p)/(1 − p), PDI = 1 + p */
  P.flory = (p) => ({ Xn: 1 / (1 - p), Xw: (1 + p) / (1 - p), pdi: 1 + p });
  /* Zimm–Bragg: transferencia en la matriz M; Z = (1,0) M^N (1,1)ᵀ; θ_H = (1/N) s ∂ln Z/∂s */
  P.zbZ = function (N, sigma, s) { let v = [1, 0]; for (let i = 0; i < N; i++) v = [v[0] * 1 + v[1] * 1, v[0] * sigma * s + v[1] * s]; return v[0] + v[1]; };
  P.zbTheta = (N, sigma, s) => { const d = 1e-6 * s; return (s * (Math.log(P.zbZ(N, sigma, s + d)) - Math.log(P.zbZ(N, sigma, s - d)))) / (2 * d) / N; };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
