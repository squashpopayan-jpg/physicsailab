/* ===================================================================
   76-fm-cosmo.js — Cosmología (EM.fm.cos): ecuaciones de Friedmann (ΛCDM con radiación y curvatura), edad, distancias, módulo de distancia, densidad
   crítica, igualdad materia–radiación, fondo cósmico de microondas (fotones, Saha de la recombinación, horizonte sonoro y ángulo acústico),
   tiempo de la era de radiación (nucleosíntesis) y curvas de rotación de galaxias (disco exponencial + halo NFW). Sin DOM; SI.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const Co = (fm.cos = {});
  const { c, kB, hbar, me, e } = K;
  const G = 6.6743e-11, MPC = 3.0856775814913673e22, GYR = 3.15576e16, PC10 = 10 * 3.0856775814913673e16;
  Co.MPC = MPC; Co.GYR = GYR; Co.G = G;
  Co.planck18 = { H0: 67.4, Om: 0.315, Or: 0, OL: 0.685 };
  Co.H0si = (H0) => (H0 * 1e3) / MPC;
  /* radiación: Ω_r h² = 4.1837×10⁻⁵ para T = 2.7255 K con N_eff = 3.046 (fotones + neutrinos sin masa) */
  Co.omegaRad = (h, T = 2.7255, Neff = 3.046) => (2.4729753e-5 * Math.pow(T / 2.7255, 4) * (1 + 0.22710731766 * Neff)) / (h * h);
  Co.params = (H0, Om, withRad = false, Ok = 0) => { const h = H0 / 100, Or = withRad ? Co.omegaRad(h) : 0; return { H0, Om, Or, OL: 1 - Om - Or - Ok, Ok }; };
  Co.E2 = (p, z) => { const a = 1 / (1 + z); return p.Or / Math.pow(a, 4) + p.Om / Math.pow(a, 3) + (p.Ok || 0) / (a * a) + p.OL; };
  Co.E = (p, z) => Math.sqrt(Co.E2(p, z));
  const simpson = (f, a, b, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; };
  /* edad (Gyr) en el corrimiento z: t = (1/H₀)∫₀^a da/√(Ω_r/a² + Ω_m/a + Ω_k + Ω_Λ a²) */
  Co.age = (p, z = 0) => { const a1 = 1 / (1 + z), f = (a) => (a <= 0 ? 0 : 1 / Math.sqrt(p.Or / (a * a) + p.Om / a + (p.Ok || 0) + p.OL * a * a)); return simpson(f, 0, a1, 4000) / Co.H0si(p.H0) / GYR; };
  Co.lookback = (p, z) => Co.age(p, 0) - Co.age(p, z);
  Co.hubbleTime = (p) => 1 / Co.H0si(p.H0) / GYR;
  /* distancia comóvil (Mpc) = (c/H₀)∫ dz/E */
  Co.Dc = (p, z, n = 6000) => ((c / 1e3) / p.H0) * simpson((u) => Math.exp(u) / Co.E(p, Math.exp(u) - 1), 0, Math.log(1 + z), n);   /* ∫dz/E con u = ln(1 + z) */
  Co.Dm = (p, z) => { const Dc = Co.Dc(p, z), Ok = p.Ok || 0; if (Math.abs(Ok) < 1e-9) return Dc; const DH = (c / 1e3) / p.H0, s = Math.sqrt(Math.abs(Ok)); return Ok > 0 ? (DH / s) * Math.sinh((s * Dc) / DH) : (DH / s) * Math.sin((s * Dc) / DH); };
  Co.DL = (p, z) => (1 + z) * Co.Dm(p, z);
  Co.DA = (p, z) => Co.Dm(p, z) / (1 + z);
  Co.mu = (p, z) => 5 * Math.log10((Co.DL(p, z) * MPC) / PC10);
  Co.rhoCrit = (H0) => (3 * Math.pow(Co.H0si(H0), 2)) / (8 * Math.PI * G);                        /* kg/m³ */
  Co.q0 = (p) => p.Om / 2 + p.Or - p.OL;                                                           /* parámetro de desaceleración */
  Co.zEq = (p) => p.Om / p.Or - 1;
  /* ---- fondo cósmico de microondas ---- */
  Co.zeta3 = 1.2020569031595942;
  Co.nPhoton = (T) => ((2 * Co.zeta3) / (Math.PI * Math.PI)) * Math.pow((kB * T) / (hbar * c), 3);              /* m⁻³ */
  Co.rhoPhotonEnergy = (T) => ((Math.PI * Math.PI) / 15) * Math.pow(kB * T, 4) / (Math.pow(hbar * c, 3));                /* J/m³ */
  Co.wienPeakGHz = (T) => 58.789 * T;                                                                        /* máximo de ν en GHz (Iν) */
  /* ecuación de Saha de la recombinación del hidrógeno: x²/(1 − x) = (1/n_b)(m_ekT/2πħ²)^{3/2}e^{−B/kT}; n_b = η n_γ */
  Co.saha = function (T, eta = 6.1e-10) {
    const nb = eta * Co.nPhoton(T), S = (1 / nb) * Math.pow((me * kB * T) / (2 * Math.PI * hbar * hbar), 1.5) * Math.exp(-(13.605693 * e) / (kB * T));
    return (-S + Math.sqrt(S * S + 4 * S)) / 2;                                                       /* fracción ionizada */
  };
  Co.TrecombHalf = (eta = 6.1e-10) => { let lo = 2500, hi = 6000; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (Co.saha(m, eta) > 0.5) hi = m; else lo = m; } return 0.5 * (lo + hi); };
  /* horizonte sonoro r_s(z) (Mpc) con c_s = c/√(3(1 + R)), R = 3ρ_b/4ρ_γ, e integral en ln a */
  Co.soundHorizon = (p, zstar, Ob_h2 = 0.02237, Og = null) => {
    const h = p.H0 / 100, Og_ = Og !== null ? Og : 2.4729753e-5 / (h * h), Ob = Ob_h2 / (h * h), amin = 1e-8, a1 = 1 / (1 + zstar);
    const f = (la) => { const a = Math.exp(la), R = (3 * Ob) / (4 * Og_) * a, cs = (c / 1e3) / Math.sqrt(3 * (1 + R)), z = 1 / a - 1; return cs / (p.H0 * Co.E(p, z) * a); };   /* r_s = ∫ c_s dz/H = ∫ c_s dln a/(aH) */
    return simpson(f, Math.log(amin), Math.log(a1), 8000);
  };
  Co.acousticAngle = (p, zstar, Ob_h2) => Co.soundHorizon(p, zstar, Ob_h2) / Co.Dm(p, zstar);
  /* ---- era de radiación: t = 1/2H, H² = (8πG/3)ρ, ρ = (π²/30) g* (kT)⁴/(ħc)³/c² ---- */
  Co.radTime = (T_MeV, gstar = 10.75) => { const kT = T_MeV * 1e6 * e, rho = ((Math.PI * Math.PI) / 30) * gstar * Math.pow(kT, 4) / (Math.pow(hbar * c, 3) * c * c), H = Math.sqrt((8 * Math.PI * G * rho) / 3); return 1 / (2 * H); };
  Co.npEq = (dm_MeV, kT_MeV) => Math.exp(-dm_MeV / kT_MeV);
  Co.heliumFraction = (np) => (2 * np) / (1 + np);
  /* ---- curvas de rotación ---- */
  const bessI0 = (x) => { const t = x / 3.75; if (Math.abs(x) < 3.75) { const y = t * t; return 1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813))))); } const y = 3.75 / Math.abs(x); return (Math.exp(Math.abs(x)) / Math.sqrt(Math.abs(x))) * (0.39894228 + y * (0.01328592 + y * (0.00225319 + y * (-0.00157565 + y * (0.00916281 + y * (-0.02057706 + y * (0.02635537 + y * (-0.01647633 + y * 0.00392377)))))))); };
  const bessI1 = (x) => { const ax = Math.abs(x); let r; if (ax < 3.75) { const y = (x / 3.75) ** 2; r = ax * (0.5 + y * (0.87890594 + y * (0.51498869 + y * (0.15084934 + y * (0.02658733 + y * (0.00301532 + y * 0.00032411)))))); } else { const y = 3.75 / ax; r = (Math.exp(ax) / Math.sqrt(ax)) * (0.39894228 + y * (-0.03988024 + y * (-0.00362018 + y * (0.00163801 + y * (-0.01031555 + y * (0.02282967 + y * (-0.02895312 + y * (0.01787654 - y * 0.00420059)))))))); } return x < 0 ? -r : r; };
  const bessK0 = (x) => { if (x <= 2) { const y = (x * x) / 4; return -Math.log(x / 2) * bessI0(x) + (-0.57721566 + y * (0.42278420 + y * (0.23069756 + y * (0.03488590 + y * (0.00262698 + y * (0.00010750 + y * 0.00000740)))))); } const y = 2 / x; return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + y * (-0.07832358 + y * (0.02189568 + y * (-0.01062446 + y * (0.00587872 + y * (-0.00251540 + y * 0.00053208)))))); };
  const bessK1 = (x) => { if (x <= 2) { const y = (x * x) / 4; return Math.log(x / 2) * bessI1(x) + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * -0.00004686)))))); } const y = 2 / x; return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + y * (0.23498619 + y * (-0.03655620 + y * (0.01504268 + y * (-0.00780353 + y * (0.00325614 + y * -0.00068245)))))); };
  Co.bessel = { I0: bessI0, I1: bessI1, K0: bessK0, K1: bessK1 };
  /* disco exponencial de Freeman: v² = 4πGΣ₀R_d y²[I₀(y)K₀(y) − I₁(y)K₁(y)], y = R/2R_d; Σ₀ = M_d/(2πR_d²) */
  Co.vDisk = (R, Md, Rd) => { const y = R / (2 * Rd), S0 = Md / (2 * Math.PI * Rd * Rd); return Math.sqrt(Math.max(0, 4 * Math.PI * G * S0 * Rd * y * y * (bessI0(y) * bessK0(y) - bessI1(y) * bessK1(y)))); };
  /* halo NFW: M(r) = 4πρ_s r_s³[ln(1 + x) − x/(1 + x)] */
  Co.vNFW = (R, rhos, rs) => { const x = R / rs; return Math.sqrt((4 * Math.PI * G * rhos * rs ** 3 * (Math.log(1 + x) - x / (1 + x))) / R); };
  Co.vKepler = (R, M) => Math.sqrt((G * M) / R);
})(typeof window !== 'undefined' ? window : globalThis);
