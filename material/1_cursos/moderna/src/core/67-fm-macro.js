/* ===================================================================
   67-fm-macro.js — Fenómenos cuánticos macroscópicos (EM.fm.mac): superconductividad BCS (brecha Δ(T), densidad de estados, London, cuanto de flujo),
   efecto Josephson (RCSJ sobreamortiguado, Ambegaokar–Baratoff, SQUID, Fraunhofer), superfluidez (criterio de Landau con el espectro de rotones)
   y condensación de Bose–Einstein en una trampa armónica. Sin DOM; SI salvo indicación.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const Mc = (fm.mac = {});
  const { h, hbar, kB, e, me } = K, mu0 = 4e-7 * Math.PI;
  const EULER = 0.5772156649015329;
  /* ---- BCS (acoplamiento débil, unidades de kTc) ---- */
  Mc.delta0 = Math.PI * Math.exp(-EULER);                                  /* Δ(0)/kTc = π e^{−γ} = 1.764 */
  /* ecuación universal de la brecha: ∫₀^∞ [tanh(ξ/2)/ξ − tanh(E/2t)/E] dξ = 0, E = √(ξ² + Δ²), t = T/Tc */
  Mc.gapEq = function (D, t, N = 4000, xm = 80) {
    const f = (x) => { const E = Math.sqrt(x * x + D * D); const a = x < 1e-9 ? 0.5 : Math.tanh(x / 2) / x; return a - Math.tanh(E / (2 * t)) / E; };
    let s = 0; const dx = xm / N; for (let i = 0; i <= N; i++) { const x = i * dx, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * f(x); } return (s * dx) / 3;
  };
  Mc.gap = function (t) {                                                  /* Δ(T) en unidades de kTc */
    if (t >= 1) return 0;
    let a = 1e-6, b = 2.2; if (Mc.gapEq(a, t) > 0) return 0;
    for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b); if (Mc.gapEq(m, t) < 0) a = m; else b = m; } return 0.5 * (a + b);
  };
  Mc.dos = (E, D) => (Math.abs(E) > D ? Math.abs(E) / Math.sqrt(E * E - D * D) : 0);      /* N_s(E)/N_n */
  /* longitud de penetración de London λ_L = √(m/(μ₀ n_s e²)) y cuanto de flujo h/2e */
  Mc.london = (ns, m = me) => Math.sqrt(m / (mu0 * ns * e * e));
  Mc.fluxQuantum = h / (2 * e);
  Mc.coherence = (vF, Delta) => (hbar * vF) / (Math.PI * Delta);           /* ξ₀ = ħ v_F/πΔ(0) */
  /* ---- Josephson ---- */
  Mc.josephsonHz = (V) => (2 * e * V) / h;                                 /* ν = 2eV/h */
  Mc.AB = (Delta_J, T) => ((Math.PI * Delta_J) / (2 * e)) * Math.tanh(Delta_J / (2 * kB * T));    /* I_c R_n (V), Δ en J */
  /* RCSJ sobreamortiguado: dφ/dτ = i − sen φ (τ = t/τ_J con τ_J = ħ/(2e I_c R_n)); tensión media ⟨V⟩/(I_c R_n) = ⟨dφ/dτ⟩ */
  Mc.rcsj = function (i, T = 400, dt = 0.01) {
    let phi = 0, tt = 0; const n = Math.round(T / dt), f = (p) => i - Math.sin(p);
    for (let k = 0; k < n; k++) { const k1 = f(phi), k2 = f(phi + 0.5 * dt * k1), k3 = f(phi + 0.5 * dt * k2), k4 = f(phi + dt * k3); phi += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); tt += dt; }
    return phi / tt;
  };
  Mc.rcsjAnalytic = (i) => (i <= 1 ? 0 : Math.sqrt(i * i - 1));
  Mc.squid = (phiOverPhi0) => Math.abs(Math.cos(Math.PI * phiOverPhi0));      /* I_c(Φ)/2I_c0 de dos uniones idénticas */
  Mc.fraunhofer = (phiOverPhi0) => { const x = Math.PI * phiOverPhi0; return Math.abs(x) < 1e-12 ? 1 : Math.abs(Math.sin(x) / x); };
  /* ---- superfluidez ---- */
  /* espectro de rotones del ⁴He: ε(p) = Δ + (p − p₀)²/(2μ_r); criterio de Landau v_c = min ε/p. Δ/k = 8.65 K, p₀/ħ = 1.91 Å⁻¹, μ_r = 0.16 m(⁴He) */
  Mc.roton = { Delta: 8.65 * kB, p0: 1.91e10 * hbar, mu: 0.16 * 4.002602 * K.u };
  Mc.rotonE = (p, r = Mc.roton) => r.Delta + ((p - r.p0) ** 2) / (2 * r.mu);
  Mc.landau = function (r = Mc.roton) { let best = { v: Infinity, p: 0 }; for (let i = 0; i <= 200000; i++) { const p = r.p0 * (0.5 + 1.0 * i / 200000), v = Mc.rotonE(p, r) / p; if (v < best.v) best = { v, p }; } return best; };
  /* ---- BEC en trampa armónica ---- */
  Mc.zeta3 = 1.2020569031595942;
  Mc.TcTrap = (N, wbar) => ((hbar * wbar) / kB) * Math.pow(N / Mc.zeta3, 1 / 3);
  Mc.TcTrapCorr = (N, wbar, wmean) => Mc.TcTrap(N, wbar) * (1 - 0.73 * (wmean / wbar) * Math.pow(N, -1 / 3));
  Mc.condFracTrap = (t) => (t >= 1 ? 0 : 1 - t ** 3);                      /* N₀/N = 1 − (T/T_c)³ */
  Mc.condFracUniform = (t) => (t >= 1 ? 0 : 1 - Math.pow(t, 1.5));
  Mc.ahO = (m, w) => Math.sqrt(hbar / (m * w));
})(typeof window !== 'undefined' ? window : globalThis);
