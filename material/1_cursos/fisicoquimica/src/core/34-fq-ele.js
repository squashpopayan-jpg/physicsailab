/* ===================================================================
   34-fq-ele.js — Cinética de electrodos: Butler–Volmer, doble capa de Gouy–Chapman,
   voltametría cíclica (difusión semi-infinita) y diagramas de Evans de corrosión.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const F = FQ.F, R = FQ.R;

  /* Butler–Volmer: i = i0 [exp(α_a f η) − exp(−α_c f η)], f = F/RT; η = E − E_eq. Convención IUPAC: i > 0 anódica. */
  FQ.bv = (i0, aa, ac, eta, T = 298.15) => { const f = F / (R * T); return i0 * (Math.exp(aa * f * eta) - Math.exp(-ac * f * eta)); };
  /* Con transporte de masa: 1/i = 1/i_cinética + 1/i_L para el rama catódica (aproximación de Koutecký–Levich); devuelve i total para η dado */
  FQ.bvMT = function (i0, a, eta, iLc, iLa, T = 298.15) {
    const f = F / (R * T), ia = i0 * Math.exp((1 - a) * f * eta), ic = i0 * Math.exp(-a * f * eta);
    const ia_ = iLa ? 1 / (1 / ia + 1 / iLa) : ia, ic_ = iLc ? 1 / (1 / ic + 1 / iLc) : ic;
    return ia_ - ic_;
  };
  /* Pendiente de Tafel (V/década) */
  FQ.tafel = (a, T = 298.15) => (Math.LN10 * R * T) / (a * F);

  /* Doble capa de Gouy–Chapman para un electrolito 1:1 de concentración c (mol/L): potencial ψ(x) y capacidad diferencial */
  FQ.gc = function (c, psi0, T = 298.15, er = 78.4) {
    const kappa = Math.sqrt((2 * FQ.NA * FQ.e * FQ.e * c * 1000) / (FQ.eps0 * er * FQ.kB * T)), t = (FQ.e * psi0) / (4 * FQ.kB * T);
    return {
      kappa,
      psi: (x) => ((4 * FQ.kB * T) / FQ.e) * Math.atanh(Math.tanh(t) * Math.exp(-kappa * x)),
      C: FQ.eps0 * er * kappa * Math.cosh((FQ.e * psi0) / (2 * FQ.kB * T)), /* F/m² */
      sigma: Math.sqrt(8 * c * 1000 * FQ.NA * FQ.eps0 * er * FQ.kB * T) * Math.sinh((FQ.e * psi0) / (2 * FQ.kB * T)) /* C/m² */
    };
  };

  /* Voltametría cíclica de O + n e⁻ ⇌ R con difusión lineal semi-infinita (solo O al inicio).
     p = {E0, Ei, Ev, Ef?, v (V/s), D (cm²/s), C (mol/L), A (cm²), n, k0 (cm/s), alpha, T}.
     Devuelve {E:[], i:[]} con i en A (IUPAC: anódica > 0). Método: diferencias finitas explícitas con λ = 0.4 y condición de borde de Butler–Volmer. */
  FQ.cv = function (p) {
    const T = p.T || 298.15, n = p.n || 1, f = (n * F) / (R * T), a = p.alpha === undefined ? 0.5 : p.alpha;
    const D = p.D, C = p.C * 1e-3 /* mol/cm³ */, A = p.A, v = p.v, k0 = p.k0;
    const span = Math.abs(p.Ev - p.Ei), tTotal = (2 * span) / v, N = p.N || 200, lam = 0.4;
    const dx = (6 * Math.sqrt(D * tTotal)) / N, dt = (lam * dx * dx) / D, steps = Math.ceil(tTotal / dt), dir = Math.sign(p.Ev - p.Ei);
    let cO = new Float64Array(N + 1).fill(C), cR = new Float64Array(N + 1);
    const E = [], I = [];
    for (let s = 0; s <= steps; s++) {
      const t = s * dt, Et = p.Ei + dir * v * (t <= tTotal / 2 ? t : tTotal - t);
      /* condición de borde en x = 0 */
      const eta = Et - p.E0, kf = k0 * Math.exp(-a * f * eta), kb = k0 * Math.exp((1 - a) * f * eta);
      let c0O, c0R;
      /* extrapolación de segundo orden en x = 0: dc/dx ≈ (−3c₀ + 4c₁ − c₂)/(2Δx) */
      const sSum = (4 * (cO[1] + cR[1]) - (cO[2] + cR[2])) / 3;
      if (k0 > 1e3) { const th = Math.exp(f * eta); c0O = (sSum * th) / (1 + th); c0R = sSum - c0O; }
      else { const g = D / dx; c0O = (kb * sSum + g * (2 * cO[1] - 0.5 * cO[2])) / (kf + kb + 1.5 * g); c0R = sSum - c0O; }
      cO[0] = c0O; cR[0] = c0R;
      const flux = (D * (-3 * cO[0] + 4 * cO[1] - cO[2])) / (2 * dx); /* mol cm⁻² s⁻¹ hacia el electrodo: reducción */
      if (s % 2 === 0) { E.push(Et); I.push(-n * F * A * flux); } /* i anódica positiva */
      const nO = new Float64Array(N + 1), nR = new Float64Array(N + 1);
      for (let j = 1; j < N; j++) { nO[j] = cO[j] + lam * (cO[j + 1] - 2 * cO[j] + cO[j - 1]); nR[j] = cR[j] + lam * (cR[j + 1] - 2 * cR[j] + cR[j - 1]); }
      nO[N] = C; nR[N] = 0; nO[0] = cO[0]; nR[0] = cR[0];
      cO = nO; cR = nR;
    }
    return { E, I };
  };
  /* Picos de un voltamperograma: devuelve {Epc, ipc, Epa, ipa} */
  FQ.cvPeaks = function (cv) {
    let ic = 0, ia = 0;
    for (let k = 0; k < cv.I.length; k++) { if (cv.I[k] < cv.I[ic]) ic = k; }
    for (let k = ic; k < cv.I.length; k++) { if (cv.I[k] > cv.I[ia] || ia < ic) ia = k; }
    return { Epc: cv.E[ic], ipc: cv.I[ic], Epa: cv.E[ia], ipa: cv.I[ia] };
  };
  /* Randles–Ševčík: i_p = 0.4463 n F A C (n F v D / RT)^½ (A en cm², C en mol/cm³, v en V/s, D en cm²/s) */
  FQ.randlesSevcik = (n, A, C, D, v, T = 298.15) => 0.4463 * n * F * A * C * 1e-3 * Math.sqrt((n * F * v * D) / (R * T));

  /* Diagrama de Evans: rama anódica i_a(E) = i0a·10^((E−Ea)/βa) y catódica (reducción de H⁺ y de O₂ con límite difusional). Devuelve E_corr e i_corr (A/cm²) */
  FQ.evans = function (q) {
    const ia = (E) => q.i0a * Math.pow(10, (E - q.Ea) / q.ba), ic = (E) => { const k = q.i0c * Math.pow(10, -(E - q.Ec) / q.bc); return q.iL ? 1 / (1 / k + 1 / q.iL) : k; };
    const Ecorr = FQ.bisect((E) => Math.log(ia(E)) - Math.log(ic(E)), -2, 2, 1e-12);
    return { Ecorr, icorr: ia(Ecorr), ia, ic, Rp: q.ba * q.bc / (Math.LN10 * ia(Ecorr) * (q.ba + q.bc)) };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
