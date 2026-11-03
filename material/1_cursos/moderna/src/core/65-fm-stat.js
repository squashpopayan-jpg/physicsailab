/* ===================================================================
   65-fm-stat.js — Estadística cuántica (EM.fm.st): distribuciones de Maxwell–Boltzmann, Fermi–Dirac y Bose–Einstein, gas de electrones libres
   (energía, temperatura y velocidad de Fermi, densidad de estados, potencial químico, calor específico electrónico), calores específicos de redes
   (Dulong–Petit, Einstein, Debye) y temperatura de condensación de un gas de Bose ideal. Sin DOM; SI salvo indicación.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const St = (fm.st = {});
  const { h, hbar, kB, me, e } = K;
  const NA = K.NA, R = NA * kB;
  St.R = R;
  /* ocupación media en función de x = (ε − μ)/kT */
  St.mb = (x) => Math.exp(-x);
  St.fd = (x) => (x > 700 ? 0 : x < -700 ? 1 : 1 / (Math.exp(x) + 1));
  St.be = (x) => 1 / Math.expm1(x);
  /* ---- gas de electrones libres (3D, con espín) ---- */
  St.fermiEnergy = (n, m = me) => (hbar * hbar * Math.pow(3 * Math.PI * Math.PI * n, 2 / 3)) / (2 * m);
  St.fermiK = (n) => Math.pow(3 * Math.PI * Math.PI * n, 1 / 3);
  St.fermiV = (n, m = me) => (hbar * St.fermiK(n)) / m;
  St.fermiT = (n, m = me) => St.fermiEnergy(n, m) / kB;
  St.dos = (eps, m = me) => (Math.pow((2 * m) / (hbar * hbar), 1.5) / (2 * Math.PI * Math.PI)) * Math.sqrt(eps);   /* estados por unidad de energía y volumen */
  /* integral de Fermi–Dirac F_j(η) = ∫₀^∞ x^j/(e^{x−η} + 1) dx (cuadratura de Simpson con cambio x = t²) */
  St.fdIntegral = function (j, eta) {
    const tmax = Math.sqrt(Math.max(eta, 0) + 50), N = 2 * Math.max(2000, Math.round(tmax * 400)), dt = tmax / N; let s = 0;
    for (let i = 1; i <= N; i++) { const t = i * dt, x = t * t, w = i === N ? 1 : i % 2 ? 4 : 2; s += w * 2 * t * Math.pow(x, j) / (Math.exp(x - eta) + 1); }
    return (s * dt) / 3;
  };
  /* potencial químico μ(T) con n fijo: n = (1/2π²)(2m/ħ²)^{3/2}(kT)^{3/2} F_{1/2}(μ/kT)  (resuelto por bisección en η = μ/kT) */
  St.mu = function (n, T, m = me) {
    const c0 = (Math.pow((2 * m) / (hbar * hbar), 1.5) / (2 * Math.PI * Math.PI)) * Math.pow(kB * T, 1.5);
    const f = (eta) => c0 * St.fdIntegral(0.5, eta) - n; let a = -30, b = St.fermiEnergy(n, m) / (kB * T) * 1.5 + 5;
    for (let i = 0; i < 100; i++) { const mid = 0.5 * (a + b); if (f(mid) > 0) b = mid; else a = mid; }
    return 0.5 * (a + b) * kB * T;
  };
  St.muSommerfeld = (n, T, m = me) => { const EF = St.fermiEnergy(n, m); return EF * (1 - (Math.PI * Math.PI / 12) * Math.pow((kB * T) / EF, 2)); };
  /* calor específico electrónico C = γT por mol de átomos con z electrones de valencia: γ = (π²/2) z R/T_F  (J/(mol K²)) */
  St.gammaFree = (n, z = 1, m = me) => (Math.PI * Math.PI / 2) * z * R / St.fermiT(n, m);
  /* ---- calores específicos de la red (por mol de átomos, J/(mol K)) ---- */
  St.dulongPetit = 3 * R;
  St.einstein = (T, th) => { const x = th / T; if (x > 600) return 0; const ex = Math.exp(x); return 3 * R * x * x * ex / ((ex - 1) * (ex - 1)); };
  St.debye = function (T, th, N = 2000) {
    const xm = th / T, dx = xm / N; let s = 0;
    const g = (x) => (x < 1e-8 ? x * x : (x ** 4 * Math.exp(x)) / ((Math.exp(x) - 1) ** 2));
    for (let i = 0; i <= N; i++) { const x = i * dx, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * (i === 0 ? 0 : g(x)); }
    return 9 * R * Math.pow(T / th, 3) * (s * dx / 3);
  };
  St.debyeT3 = (T, th) => ((12 * Math.PI ** 4) / 5) * R * Math.pow(T / th, 3);
  /* energía interna de Debye (J/mol) sin la energía del punto cero */
  St.debyeU = function (T, th, N = 2000) { const xm = th / T, dx = xm / N; let s = 0; for (let i = 1; i <= N; i++) { const x = i * dx, w = i === N ? 1 : i % 2 ? 4 : 2; s += w * x ** 3 / Math.expm1(x); } return 9 * R * T * Math.pow(T / th, 3) * (s * dx / 3); };
  /* ---- gas de Bose ideal ---- */
  St.zeta32 = 2.612375348685488;
  St.bec = (n, m) => ((2 * Math.PI * hbar * hbar) / (m * kB)) * Math.pow(n / St.zeta32, 2 / 3);
  St.lambdaT = (m, T) => h / Math.sqrt(2 * Math.PI * m * kB * T);
})(typeof window !== 'undefined' ? window : globalThis);
