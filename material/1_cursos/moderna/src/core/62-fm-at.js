/* ===================================================================
   62-fm-at.js — Átomos con varios electrones (EM.fm.at): helio (perturbación, variacional, Hartree–Fock radial numérico, integrales J y K),
   configuraciones de Madelung, términos LS por las reglas de Hund, apantallamiento de Slater. Sin DOM; unidades atómicas salvo indicación.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const K = (qm.K = qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const A = (fm.at = {});
  const LAf = () => EM.P.la;
  const HA_EV = 27.211386245988;                                  /* hartree en eV (CODATA 2018) */
  A.HA_EV = HA_EV;

  /* ---- Helio y iones heliodes ---- */
  A.heFirstOrder = (Z) => -Z * Z + (5 * Z) / 8;                    /* E = −Z² + 5Z/8 (perturbación de primer orden, Ha) */
  A.heVar = (Z, zeta) => zeta * zeta - 2 * Z * zeta + (5 * zeta) / 8;   /* ⟨H⟩ con ψ = (ζ³/π)e^{−ζ(r₁+r₂)} */
  A.heVarOpt = (Z) => { const zeta = Z - 5 / 16; return { zeta, E: A.heVar(Z, zeta) }; };   /* ζ = Z − 5/16, E = −(Z − 5/16)² */
  A.heExact = { 1: -0.527751016544, 2: -2.903724377034, 3: -7.279913412669, 4: -13.655566238423, 5: -22.030971580242 };   /* no relativista, Pekeris/Drake (Ha) */
  /* Integrales de Coulomb J y de intercambio K para la configuración 1s2s con orbitales hidrogenoides de carga Z (Ha): J = 17Z/81, K = 16Z/729 */
  A.heJ1s2s = (Z) => (17 * Z) / 81;
  A.heK1s2s = (Z) => (16 * Z) / 729;

  /* Hartree–Fock del estado fundamental de un sistema de dos electrones: un orbital radial u(r) = rR(r) con −u''/2 + (−Z/r + V_H)u = εu,
     V_H(r) = ∫u²(r')/max(r, r')dr' (energía E = 2ε − J, J = ∫u²V_H).  Malla logarítmica r = e^x, u = e^{x/2}f, g = e^x f:
     [−½D² + ⅛ + e^{2x}V] f = ε e^{2x} f  →  problema simétrico tridiagonal en g con ∫u²dr = Σg²Δx (error O(Δx²)). */
  A.heHF = function (Z, o = {}) {
    const dx = o.h || 0.02, x0 = Math.log(o.rmin || 1e-8), x1 = Math.log(o.Rmax || 18 / Math.max(1, Z - 0.5)), N = Math.round((x1 - x0) / dx);
    const x = new Float64Array(N), r = new Float64Array(N), d = new Float64Array(N), e = new Float64Array(N - 1);
    for (let i = 0; i < N; i++) { x[i] = x0 + (i + 1) * dx; r[i] = Math.exp(x[i]); }
    for (let i = 0; i < N - 1; i++) e[i] = -0.5 / (dx * dx) / (r[i] * r[i + 1]);
    let g = r.map((rr) => rr * Math.sqrt(rr) * Math.exp(-(Z - 0.3) * rr));
    const norm = (v) => { let s = 0; for (let i = 0; i < N; i++) s += v[i] * v[i]; s = Math.sqrt(s * dx); return v.map((q) => q / s); };
    g = norm(g);
    const VH = (gg) => {
      const q = new Float64Array(N), w = new Float64Array(N), out = new Float64Array(N);
      let s = 0; for (let i = 0; i < N; i++) { s += gg[i] * gg[i] * dx; q[i] = s - 0.5 * gg[i] * gg[i] * dx; }
      s = 0; for (let i = N - 1; i >= 0; i--) { w[i] = s + 0.5 * gg[i] * gg[i] / r[i] * dx; s += gg[i] * gg[i] / r[i] * dx; }
      for (let i = 0; i < N; i++) out[i] = q[i] / r[i] + w[i];
      return out;
    };
    let eps = 0, J = 0, Ecur = 0, Eold = 0, it;
    for (it = 0; it < 80; it++) {
      const vh = VH(g);
      for (let i = 0; i < N; i++) d[i] = (1 / (dx * dx) + 0.125 + r[i] * r[i] * (-Z / r[i] + vh[i])) / (r[i] * r[i]);
      const sol = LAf().tridiagLowest(d, e, 1);
      eps = sol.values[0]; const gn = norm(sol.vectors[0]);
      let s = 0; for (let i = 0; i < N; i++) s += gn[i] * gn[i] * vh[i]; J = s * dx;
      Ecur = 2 * eps - J;
      const mix = it < 3 ? 0.5 : 0.7; g = norm(g.map((q, i) => (1 - mix) * q + mix * gn[i]));
      if (it > 2 && Math.abs(Ecur - Eold) < 1e-12) break; Eold = Ecur;
    }
    const u = g.map((q, i) => q / Math.sqrt(r[i]));
    return { E: Ecur, eps, J, r, u, iters: it + 1, h: dx };
  };


  /* extrapolación de Richardson en Δx² (el error de la malla logarítmica es O(Δx²)) */
  A.heHFextrap = function (Z) { const a = A.heHF(Z, { h: 0.02 }), b = A.heHF(Z, { h: 0.01 }); return { E: (4 * b.E - a.E) / 3, eps: (4 * b.eps - a.eps) / 3, J: (4 * b.J - a.J) / 3, fine: b }; };

  /* ---- Configuraciones electrónicas: regla de Madelung (n + l creciente; a igual n + l, n creciente) ---- */
  const LET = 'spdfgh';
  A.madelungOrder = function (nmax = 7) {
    const o = []; for (let n = 1; n <= nmax; n++) for (let l = 0; l < n; l++) o.push([n, l]);
    return o.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
  };
  A.madelung = function (Z) {
    const out = []; let left = Z;
    for (const [n, l] of A.madelungOrder()) { if (left <= 0) break; const k = Math.min(left, 2 * (2 * l + 1)); out.push([n, l, k]); left -= k; }
    return out;
  };
  /* subcapas ordenadas por n, l  →  cadena «1s2 2s2 2p6 …» */
  A.configStr = (cfg) => cfg.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([n, l, k]) => n + LET[l] + k).join(' ');
  A.CORES = { '[He]': 2, '[Ne]': 10, '[Ar]': 18, '[Kr]': 36, '[Xe]': 54 };
  /* analiza «[Ar].3d5.4s1» → {nl: k} */
  A.parseConfig = function (str) {
    const occ = {};
    for (const p of str.split('.')) {
      if (A.CORES[p]) { for (const [n, l, k] of A.madelung(A.CORES[p])) occ[n + LET[l]] = k; }
      else { const m = /^(\d)([spdfgh])(\d+)$/.exec(p); if (m) occ[m[1] + m[2]] = +m[3]; }
    }
    return occ;
  };
  A.occOf = (cfg) => { const o = {}; for (const [n, l, k] of cfg) o[n + LET[l]] = k; return o; };
  A.occEqual = (a, b) => { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); for (const k of ks) if ((a[k] || 0) !== (b[k] || 0)) return false; return true; };

  /* ---- Término fundamental por las reglas de Hund para una subcapa l^n abierta ---- */
  A.shellTerm = function (l, n) {
    const cap = 2 * (2 * l + 1), g = 2 * l + 1;
    if (n <= 0 || n >= cap) return { S: 0, L: 0, J: 0 };
    const m = n <= g ? n : cap - n; let L = 0; for (let i = 0; i < m; i++) L += l - i;
    const S = m / 2, J = n < g ? Math.abs(L - S) : L + S;   /* menos de la mitad: J = |L − S|; más: J = L + S; mitad: L = 0, J = S */
    return { S, L, J };
  };
  A.termSymbol = (S, L, J) => `${2 * S + 1}${'SPDFGHIK'[L]}${(J % 1 ? (2 * J) + '/2' : J)}`;
  /* término fundamental de un átomo: subcapas abiertas (a lo más una subcapa l > 0 y una s con un electrón) */
  A.groundTerm = function (occ) {
    const open = Object.entries(occ).filter(([k, v]) => v < 2 * (2 * LET.indexOf(k[1]) + 1));
    let S = 0, L = 0, Jmain = null;
    for (const [k, v] of open) { const l = LET.indexOf(k[1]); const t = A.shellTerm(l, v); S += t.S; L += t.L; if (l > 0) Jmain = { l, v }; }
    let J;
    if (!open.length) { S = 0; L = 0; J = 0; }
    else if (Jmain && open.length === 1) J = A.shellTerm(Jmain.l, Jmain.v).J;
    else if (Jmain) { const g = 2 * Jmain.l + 1; J = Jmain.v < g ? Math.abs(L - S) : (Jmain.v > g ? L + S : S); }   /* una subcapa l > 0 y una s con un electrón */
    else J = S;
    return { S, L, J, sym: A.termSymbol(S, L, J) };
  };

  /* ---- Reglas de Slater para la carga nuclear efectiva ---- */
  /* grupos: (1s)(2s,2p)(3s,3p)(3d)(4s,4p)(4d)(4f)(5s,5p)… ; electrón s o p: 0.35 (0.30 en 1s) en el mismo grupo, 0.85 en n − 1, 1.00 en n − 2 y menores;
     electrón d o f: 0.35 en el mismo grupo y 1.00 en todos los grupos a la izquierda */
  A.slaterZeff = function (Z, occ, nl) {
    const n0 = +nl[0], l0 = LET.indexOf(nl[1]); let sh = 0;
    for (const [k, v] of Object.entries(occ)) {
      const n = +k[0], l = LET.indexOf(k[1]); let cnt = v; if (k === nl) cnt -= 1;
      const same = (l0 <= 1 && l <= 1 && n === n0) || (l0 > 1 && n === n0 && l === l0);
      if (same) sh += cnt * (n0 === 1 ? 0.30 : 0.35);
      else if (l0 <= 1) { if (n === n0 - 1) sh += cnt * 0.85; else if (n < n0 - 1) sh += cnt * 1.0; }
      else if (n < n0 || (n === n0 && l < l0)) sh += cnt * 1.0;
    }
    return Z - sh;
  };
  A.nStar = (n) => [0, 1, 2, 3, 3.7, 4.0, 4.2][n];
  /* energía orbital de Slater del electrón más externo: ε = −Ry Z_eff²/n*²  (eV) */
  A.slaterEnergyEV = (Zeff, n) => (K.Ry_eV || 13.605693122994) * Zeff * Zeff / (A.nStar(n) ** 2);
})(typeof window !== 'undefined' ? window : globalThis);
