/* ===================================================================
   71-fm-react.js — Reacciones nucleares (EM.fm.rx): valores Q desde masas atómicas, umbrales y cinemática de dos cuerpos, pico de Gamow de la fusión,
   fisionabilidad (modelo de la gota), energética solar, probabilidad de extinción de una cadena de neutrones (proceso de ramificación) y cinética
   puntual de un reactor con un grupo de neutrones retardados (ecuación de la inversa horaria). Sin DOM; MeV, fm, s.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const R = (fm.rx = {});
  const NU = () => fm.nuc;
  const uMeV = 931.49410242, ALPHA = 1 / 137.035999084, kBMeV = 8.617333262e-11;      /* MeV/K */
  R.kBMeV = kBMeV;
  /* masa atómica en u: [Z, A] o 'n' para el neutrón */
  R.m = (x) => (x === 'n' ? fm.nucdata.mn : NU().mass(x[0], x[1]));
  R.Q = (inn, out) => (inn.reduce((s, x) => s + R.m(x), 0) - out.reduce((s, x) => s + R.m(x), 0)) * uMeV;
  /* umbral (no relativista) de una reacción endotérmica a + X → …: T_th = −Q (m_a + m_X)/m_X */
  R.threshold = (Q, ma, mX) => (Q >= 0 ? 0 : (-Q * (ma + mX)) / mX);
  /* reacción a + b en reposo → 1 + 2 (exacta, relativista): T₁ = [(M² + m₁² − m₂²)/(2M)] − m₁ con M = (m_a + m_b)c² + Q... masas en MeV */
  R.twoBody = function (m1, m2, Etot) { const E1 = (Etot * Etot + m1 * m1 - m2 * m2) / (2 * Etot); const E2 = Etot - E1; return { T1: E1 - m1, T2: E2 - m2, p: Math.sqrt(E1 * E1 - m1 * m1) }; };
  /* ---- fusión: energía de Gamow y pico ---- */
  R.reducedMass = (m1, m2) => (m1 * m2) / (m1 + m2);
  R.EG = (Z1, Z2, mu_MeV) => 2 * mu_MeV * Math.pow(Math.PI * ALPHA * Z1 * Z2, 2);          /* MeV */
  R.gamowPeak = (EG, kT) => Math.cbrt((EG * kT * kT) / 4);                                    /* E₀ */
  R.gamowWidth = (E0, kT) => 4 * Math.sqrt((E0 * kT) / 3);                                    /* Δ (ancho 1/e total) */
  R.integrand = (E, EG, kT) => Math.exp(-E / kT - Math.sqrt(EG / E));                         /* ∝ σ(E)·f_MB sin S(E) ni factores */
  R.coulombBarrierMeV = (Z1, Z2, Rfm) => (1.43996448 * Z1 * Z2) / Rfm;
  /* ---- fisión ---- */
  R.fissility = (Z, A, c) => { const ES = c[1] * Math.pow(A, 2 / 3), EC = c[2] * Z * (Z - 1) / Math.cbrt(A); return EC / (2 * ES); };
  R.fissionQsemf = (Z1, A1, Z2, A2, ZA, AA, c) => NU().semf(Z1, A1, c) + NU().semf(Z2, A2, c) - NU().semf(ZA, AA, c);
  /* ---- Sol ---- */
  R.sunBurnRate = (L, Qeff_MeV) => L / (Qeff_MeV * 1.602176634e-13);                          /* reacciones/s */
  /* ---- cadena de neutrones: proceso de ramificación de Galton–Watson con descendencia de Poisson(k): extinción q = e^{k(q − 1)} ---- */
  R.extinction = function (k) { if (k <= 1) return 1; let a = 0, b = 1 - 1e-12; for (let i = 0; i < 200; i++) { const m = 0.5 * (a + b), f = m - Math.exp(k * (m - 1)); if (f < 0) a = m; else b = m; } return 0.5 * (a + b); };
  R.chainMC = function (k, gens, N0, seed = 1, cap = 5e5) {
    const rng = EM.P.rng(seed), out = [N0]; let n = N0;
    const poisson = (lam) => { if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * rng.gauss())); const L = Math.exp(-lam); let kk = 0, p = 1; do { kk++; p *= rng(); } while (p > L); return kk - 1; };
    for (let g = 0; g < gens; g++) { let m = 0; if (n > 200) m = Math.max(0, Math.round(n * k + Math.sqrt(n * k) * rng.gauss())); else for (let i = 0; i < n; i++) m += poisson(k); n = Math.min(m, cap); out.push(n); }
    return out;
  };
  /* ---- cinética puntual con un grupo retardado: dn/dt = [(ρ − β)/Λ] n + λ C,  dC/dt = (β/Λ) n − λ C ---- */
  R.kinetics = function (rho, beta, Lam, lam, T, dt, n0 = 1) {
    let n = n0, C = (beta / (Lam * lam)) * n0, t = 0; const out = [{ t, n }], steps = Math.round(T / dt);
    const f = (n_, C_) => [((rho - beta) / Lam) * n_ + lam * C_, (beta / Lam) * n_ - lam * C_];
    for (let i = 1; i <= steps; i++) { const k1 = f(n, C), k2 = f(n + 0.5 * dt * k1[0], C + 0.5 * dt * k1[1]), k3 = f(n + 0.5 * dt * k2[0], C + 0.5 * dt * k2[1]), k4 = f(n + dt * k3[0], C + dt * k3[1]); n += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); C += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t = i * dt; out.push({ t, n }); }
    return out;
  };
  /* ecuación de la inversa horaria (un grupo): ρ = Λω + βω/(ω + λ);  raíz dominante ω (s⁻¹) */
  R.inhour = function (rho, beta, Lam, lam) {
    const f = (w) => Lam * w + (beta * w) / (w + lam) - rho; let a, b;
    if (rho > 0) { a = 1e-9; b = 1e7; } else { a = -lam + 1e-9; b = -1e-12; }
    for (let i = 0; i < 300; i++) { const m = 0.5 * (a + b); if (f(m) * f(a) > 0) a = m; else b = m; }
    return 0.5 * (a + b);
  };
})(typeof window !== 'undefined' ? window : globalThis);
