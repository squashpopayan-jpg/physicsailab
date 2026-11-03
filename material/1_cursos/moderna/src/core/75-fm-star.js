/* ===================================================================
   75-fm-star.js — Estrellas (EM.fm.star): politropos de Lane–Emden, estrellas enanas blancas con la ecuación de estado de Chandrasekhar (límite de
   Chandrasekhar), estrellas de neutrones con el gas ideal de neutrones (Oppenheimer–Volkoff), secuencia principal, luminosidad de Eddington y
   energía de las supernovas. Sin DOM; SI.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const St = (fm.star = {});
  const { h, hbar, c, me, mp } = K, u = K.u;
  const G = 6.6743e-11, Msun = 1.98840987e30, Rsun = 6.957e8, Lsun = 3.828e26, sigmaT = 6.6524587051e-29;
  St.G = G; St.Msun = Msun; St.Rsun = Rsun; St.Lsun = Lsun;
  /* ---- politropos de Lane–Emden: θ'' + (2/ξ)θ' + θⁿ = 0, θ(0) = 1, θ'(0) = 0 ---- */
  St.laneEmden = function (n, dxi = 1e-3, keep = false) {
    let xi = dxi, th = 1 - (xi * xi) / 6, dth = -xi / 3; const out = [[0, 1, 0]]; const f = (x, y, z) => [z, -Math.pow(Math.max(y, 0), n) - (2 / x) * z];
    while (th > 0 && xi < 50) {
      const k1 = f(xi, th, dth), k2 = f(xi + dxi / 2, th + (dxi / 2) * k1[0], dth + (dxi / 2) * k1[1]), k3 = f(xi + dxi / 2, th + (dxi / 2) * k2[0], dth + (dxi / 2) * k2[1]), k4 = f(xi + dxi, th + dxi * k3[0], dth + dxi * k3[1]);
      const thn = th + (dxi / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dn = dth + (dxi / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (thn <= 0) { const t = th / (th - thn); xi += t * dxi; dth = dth + t * (dn - dth); th = 0; break; }
      xi += dxi; th = thn; dth = dn; if (keep) out.push([xi, th, dth]);
    }
    return { xi1: xi, dth1: dth, mass: -xi * xi * dth, profile: out };       /* −ξ²θ' en ξ₁ */
  };
  /* relación ρ_c/ρ̄ = ξ₁/(3(−θ'₁)) */
  St.rhoRatio = (r) => r.xi1 / (3 * -r.dth1);
  /* ---- enanas blancas con presión de Chandrasekhar ---- */
  const lamC = h / (me * c);
  St.wdConst = { Pk: (Math.PI * Math.pow(me, 4) * Math.pow(c, 5)) / (3 * Math.pow(h, 3)) };                 /* P = Pk f(x) */
  St.fx = (x) => x * (2 * x * x - 3) * Math.sqrt(x * x + 1) + 3 * Math.asinh(x);
  St.wdRho = (x, mue) => mue * u * (8 * Math.PI / 3) * Math.pow(me * c / h, 3) * x ** 3;                  /* kg/m³ */
  St.wdPressure = (x) => St.wdConst.Pk * St.fx(x);
  /* integra dm/dr = 4πr²ρ, dx/dr = −Gmρ/(r² dP/dx) hasta x → x_s */
  St.whiteDwarf = function (xc, mue = 2, xs = 2e-3, nsteps = 6000) {
    const dPdx = (x) => St.wdConst.Pk * (8 * x ** 4) / Math.sqrt(x * x + 1);
    const rho = (x) => St.wdRho(x, mue); const rc = 1e4;           /* pequeño paso de partida */
    let r = 1e3, x = xc, m = (4 * Math.PI / 3) * Math.pow(r, 3) * rho(xc); const rhoC = rho(xc);
    const f = (r_, x_, m_) => [(4 * Math.PI * r_ * r_ * rho(x_)), -(G * m_ * rho(x_)) / (r_ * r_ * dPdx(x_))];
    let dr = 2e3; const out = [[r, x, m]];
    while (x > xs && r < 5e7) {
      dr = Math.min(Math.max(r * 0.004, 1e2), 4e4); { const g = f(r, x, m); dr = Math.min(dr, Math.max(0.02 * x / Math.abs(g[1]), 1)); }
      const k1 = f(r, x, m), k2 = f(r + dr / 2, x + (dr / 2) * k1[1], m + (dr / 2) * k1[0]), k3 = f(r + dr / 2, x + (dr / 2) * k2[1], m + (dr / 2) * k2[0]), k4 = f(r + dr, x + dr * k3[1], m + dr * k3[0]);
      const xn = x + (dr / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), mn_ = m + (dr / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      if (xn <= xs) { const t = (x - xs) / (x - xn); r += t * dr; m += t * (mn_ - m); x = xs; out.push([r, x, m]); break; }
      x = xn; m = mn_; r += dr; out.push([r, x, m]);
    }
    return { R: r, M: m, rhoC, profile: out };
  };
  /* límite de Chandrasekhar: M = 4π (K/πG)^{3/2}(−ξ²θ')₍ₙ₌₃₎ con P = Kρ^{4/3}, K = (ħc/4)(3π²)^{1/3}/(μ_e m_u)^{4/3} */
  St.chandrasekhar = (mue = 2) => { const Kc = (hbar * c / 4) * Math.cbrt(3 * Math.PI * Math.PI) / Math.pow(mue * u, 4 / 3), r3 = St.laneEmden(3, 1e-3); return 4 * Math.PI * Math.pow(Kc / (Math.PI * G), 1.5) * r3.mass; };
  /* ---- estrellas de neutrones (gas ideal de neutrones, Oppenheimer–Volkoff) ---- */
  St.mn = 1.67492749804e-27;
  St.nsConst = () => { const mn = St.mn; return { A: (Math.pow(mn, 4) * Math.pow(c, 5)) / (8 * Math.PI ** 2 * Math.pow(hbar, 3)) }; };
  St.nsEps = (x) => St.nsConst().A * (x * (2 * x * x + 1) * Math.sqrt(1 + x * x) - Math.asinh(x));
  St.nsP = (x) => (St.nsConst().A / 3) * (x * (2 * x * x - 3) * Math.sqrt(1 + x * x) + 3 * Math.asinh(x));
  St.neutronStar = function (xc, xs = 1e-3) {
    const A = St.nsConst().A, dPdx = (x) => (A / 3) * 8 * x ** 4 / Math.sqrt(1 + x * x), c2 = c * c;
    let r = 10, x = xc, m = (4 * Math.PI / 3) * Math.pow(r, 3) * St.nsEps(xc) / c2; const epsC = St.nsEps(xc);
    const f = (r_, x_, m_) => { const eps = St.nsEps(x_), P = St.nsP(x_), den = r_ * r_ * (1 - (2 * G * m_) / (r_ * c2)); return [4 * Math.PI * r_ * r_ * eps / c2, -(G * (eps + P) / c2 * (m_ + (4 * Math.PI * r_ ** 3 * P) / c2)) / (den * dPdx(x_))]; };
    while (x > xs && r < 1e5) {
      let dr = Math.min(Math.max(r * 0.003, 0.5), 20); { const g = f(r, x, m); dr = Math.min(dr, Math.max(0.02 * x / Math.abs(g[1]), 0.01)); }
      const k1 = f(r, x, m), k2 = f(r + dr / 2, x + (dr / 2) * k1[1], m + (dr / 2) * k1[0]), k3 = f(r + dr / 2, x + (dr / 2) * k2[1], m + (dr / 2) * k2[0]), k4 = f(r + dr, x + dr * k3[1], m + dr * k3[0]);
      const xn = x + (dr / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), mn_ = m + (dr / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      if (xn <= xs) { const t = (x - xs) / (x - xn); r += t * dr; m += t * (mn_ - m); x = xs; break; }
      x = xn; m = mn_; r += dr;
    }
    return { R: r, M: m, epsC, rhoC: epsC / c2 };
  };
  /* ---- secuencia principal y energética ---- */
  St.eddington = (M) => (4 * Math.PI * G * M * mp * c) / sigmaT;                                   /* W */
  St.sunLifetimeYr = (frac = 0.1, eff = 0.007) => (frac * eff * Msun * c * c) / Lsun / (365.25 * 86400);
  St.lumRelation = (Mrel) => Math.pow(Mrel, 3.5);                                                   /* L/L☉ */
  St.lifeRelation = (Mrel) => 1e10 * Math.pow(Mrel, -2.5);                                           /* años */
  St.bindingEnergy = (M, R) => (3 * G * M * M) / (5 * R);                                            /* esfera uniforme */
  St.schwarzschild = (M) => (2 * G * M) / (c * c);
  St.virialT = (M, R, mu = 0.6) => (G * M * mu * u) / (2 * K.kB * R * 1.0) * 1.0;
})(typeof window !== 'undefined' ? window : globalThis);
