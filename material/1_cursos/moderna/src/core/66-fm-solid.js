/* ===================================================================
   66-fm-solid.js — Bandas, semiconductores, unión pn y celda solar (EM.fm.sol). Sin DOM; SI salvo indicación.
   · Kronig–Penney (peine de deltas): cos ka = cos β + (P/β) sen β, β = qa, E = (ħ²/2ma²)β².  · Enlace fuerte: E = ε − 2t cos ka.
   · Semiconductores: Nc, Nv, n_i, neutralidad de carga; unión pn en la aproximación de vaciamiento y diodo de Shockley.
   · Celda solar: eficiencia última y límite de balance detallado (Shockley–Queisser) con una fuente de cuerpo negro.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const So = (fm.sol = {});
  const { h, hbar, kB, me, e, c } = K, eps0 = K.eps0;
  /* ---- Kronig–Penney ---- */
  So.kpF = (beta, P) => Math.cos(beta) + (beta === 0 ? P : (P / beta) * Math.sin(beta));
  /* bordes de las bandas permitidas en β = qa (|f| ≤ 1) entre β = 0 y βmax */
  So.kpBands = function (P, bmax = 4 * Math.PI, N = 40000) {
    const bands = []; let inside = false, lo = 0;
    const root = (g, a, b) => { let fa = g(a); for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b), fm_ = g(m); if ((fm_ > 0) === (fa > 0)) { a = m; fa = fm_; } else b = m; } return 0.5 * (a + b); };
    for (let i = 0; i <= N; i++) {
      const b = (bmax * i) / N, ok = Math.abs(So.kpF(Math.max(b, 1e-12), P)) <= 1;
      if (ok && !inside) { lo = i === 0 ? 0 : root((x) => Math.abs(So.kpF(Math.max(x, 1e-12), P)) - 1, (bmax * (i - 1)) / N, b); inside = true; }
      if (!ok && inside) { bands.push([lo, root((x) => Math.abs(So.kpF(Math.max(x, 1e-12), P)) - 1, (bmax * (i - 1)) / N, b)]); inside = false; }
    }
    if (inside) bands.push([lo, bmax]);
    return bands;
  };
  /* k a ∈ [0, π] para un β dado dentro de una banda: ka = arccos f(β) */
  So.kpK = (beta, P) => Math.acos(Math.max(-1, Math.min(1, So.kpF(beta, P))));
  So.bohmBand = (t, a, k) => -2 * t * Math.cos(k * a);              /* energía relativa a ε₀ */
  So.tbMass = (t, a) => (hbar * hbar) / (2 * t * a * a);            /* masa efectiva en el fondo de la banda */
  /* ---- semiconductores ---- */
  So.Nc = (mstar, T) => 2 * Math.pow((2 * Math.PI * mstar * me * kB * T) / (h * h), 1.5);   /* m⁻³ */
  So.varshni = (Eg0, a, b, T) => Eg0 - (a * T * T) / (T + b);       /* eV */
  So.ni = (Nc, Nv, Eg_eV, T) => Math.sqrt(Nc * Nv) * Math.exp(-(Eg_eV * e) / (2 * kB * T));
  /* neutralidad de carga con ionización completa y estadística de Boltzmann: n = N/2 + √(N²/4 + n_i²) con N = N_D − N_A */
  So.carriers = function (ND, NA, ni) { const N = ND - NA, half = N / 2, r = Math.sqrt(half * half + ni * ni); const n = N >= 0 ? half + r : ni * ni / (-half + r); return { n, p: ni * ni / n }; };
  /* nivel de Fermi respecto del nivel intrínseco (aprox. de simetría): E_F − E_i = kT ln(n/n_i) */
  So.fermiLevel = (n, ni, T) => kB * T * Math.log(n / ni);
  /* ---- unión pn (aproximación de vaciamiento, V > 0 en directa) ---- */
  So.Vt = (T) => (kB * T) / e;
  So.Vbi = (NA, ND, ni, T) => So.Vt(T) * Math.log((NA * ND) / (ni * ni));
  So.width = (NA, ND, epsr, Vbi, V = 0) => Math.sqrt(((2 * epsr * eps0 * (Vbi - V)) / e) * (1 / NA + 1 / ND));
  So.xn = (NA, ND, W) => (W * NA) / (NA + ND);
  So.xp = (NA, ND, W) => (W * ND) / (NA + ND);
  So.Emax = (ND, xn, epsr) => (e * ND * xn) / (epsr * eps0);
  So.Cj = (epsr, W) => (epsr * eps0) / W;                          /* F/m² */
  /* corriente de saturación de un diodo de base larga: J_s = e (D_p p_n0/L_p + D_n n_p0/L_n) */
  So.Js = (ni, NA, ND, Dn, Dp, Ln, Lp) => e * ni * ni * (Dp / (Lp * ND) + Dn / (Ln * NA));
  So.shockley = (Js, V, T) => Js * Math.expm1(V / So.Vt(T));
  So.diffusionLength = (D, tau) => Math.sqrt(D * tau);
  /* ---- celda solar ---- */
  /* flujo de fotones (m⁻² s⁻¹) por encima de E_g de un cuerpo negro a T, por estereorradián-equivalente (integral de Bose): Φ = (2π/h³c²)(kT)³ ∫_{x_g}^∞ x²/(e^x − 1) dx */
  So.photonFluxAbove = function (EgJ, T, N = 4000) { const xg = EgJ / (kB * T); let s = 0;  const xm = xg + 60, dx = (xm - xg) / N; for (let i = 0; i <= N; i++) { const x = xg + i * dx, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * (x < 1e-9 ? 0 : x * x / Math.expm1(x)); } return ((2 * Math.PI) / (h ** 3 * c ** 2)) * Math.pow(kB * T, 3) * (s * dx / 3); };
  So.powerBB = (T) => K.sigma * Math.pow(T, 4);
  /* eficiencia última: cada fotón con E ≥ E_g produce E_g */
  So.ultimate = (EgeV, Tsun, N = 4000) => (EgeV * e * So.photonFluxAbove(EgeV * e, Tsun, N)) / So.powerBB(Tsun);
  /* balance detallado: J(V) = e[f_ω Φ_sol(E_g) − Φ_cel(E_g, V)], con el factor geométrico f_ω = (R_sol/d)² = 2.1625×10⁻⁵ (sol de 6000 K sobre una celda a 300 K) */
  So.fOmega = 2.1625e-5;
  So.cellJ = function (EgeV, V, Tsun, Tc = 300, f = So.fOmega, N = 4000) {
    const Eg = EgeV * e, phiS = f * So.photonFluxAbove(Eg, Tsun, N), xg = Eg / (kB * Tc), xv = (e * V) / (kB * Tc);
    /* Φ_cel(V) = (2π/h³c²)(kTc)³ ∫_{xg}^∞ x²/(e^{x−xv} − 1) dx */
    let s = 0; const xm = xg + 60, dx = (xm - xg) / N; for (let i = 0; i <= N; i++) { const x = xg + i * dx, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * x * x / Math.expm1(x - xv); }
    const phiC = ((2 * Math.PI) / (h ** 3 * c ** 2)) * Math.pow(kB * Tc, 3) * (s * dx / 3);
    return e * (phiS - phiC);
  };
  So.cellEff = function (EgeV, Tsun, Tc = 300, f = So.fOmega, N = 4000) {
    let best = { P: 0, V: 0 }; const Voc0 = EgeV * 0.95;
    for (let V = 0.05; V < Voc0 + 0.3; V += 0.005) { const J = So.cellJ(EgeV, V, Tsun, Tc, f, N); if (J <= 0) break; const P = J * V; if (P > best.P) best = { P, V, J }; }
    const Pin = f * So.powerBB(Tsun); return { eta: best.P / Pin, V: best.V, J: best.J };
  };
})(typeof window !== 'undefined' ? window : globalThis);
