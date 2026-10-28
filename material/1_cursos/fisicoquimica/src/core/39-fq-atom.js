/* ===================================================================
   39-fq-atom.js — Átomos: hidrogenoides, helio variacional, reglas de Slater, términos de Russell–Saunders.
   Unidades atómicas.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const A = (FQ.atom = {});
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const lag = (n, al, x) => { if (n === 0) return 1; let l0 = 1, l1 = 1 + al - x; for (let k = 1; k < n; k++) { const l2 = ((2 * k + 1 + al - x) * l1 - (k + al) * l0) / (k + 1); l0 = l1; l1 = l2; } return l1; };

  /* Parte radial normalizada (∫R² r² dr = 1) de un hidrogenoide de carga Z */
  A.hydR = (n, l, Z, r) => { const rho = (2 * Z * r) / n, N = Math.sqrt(Math.pow((2 * Z) / n, 3) * fact(n - l - 1) / (2 * n * fact(n + l))); return N * Math.pow(rho, l) * Math.exp(-rho / 2) * lag(n - l - 1, 2 * l + 1, rho); };
  A.hydE = (n, Z) => (-Z * Z) / (2 * n * n);
  A.hydRmean = (n, l, Z) => (3 * n * n - l * (l + 1)) / (2 * Z);
  /* Helio y sistemas de dos electrones, función de prueba e^{−ζ(r₁+r₂)}: E(ζ) = ζ² − 2Zζ + 5ζ/8 */
  A.heE = (zeta, Z) => zeta * zeta - 2 * Z * zeta + (5 * zeta) / 8;
  A.heZeta = (Z) => Z - 5 / 16;
  A.heEmin = (Z) => -Math.pow(Z - 5 / 16, 2);
  /* Energías exactas no relativistas (Pekeris, hartree) */
  A.HE_EXACT = { 1: -0.527751, 2: -2.903724, 3: -7.279913, 4: -13.655566, 5: -22.030972, 6: -32.406247 };

  /* Reglas de Slater para el electrón más externo (Z ≤ 18) */
  A.config = (Z) => { const sh = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6]], out = []; let rem = Z; for (const [n, c] of sh) { const k = Math.min(c, rem); if (k > 0) out.push([n, k]); rem -= k; if (rem <= 0) break; } return out; };
  A.slaterZ = function (Z) {
    const cfg = A.config(Z), last = cfg[cfg.length - 1], n = +last[0][0]; let S = 0;
    for (const [orb, k] of cfg) {
      const m = +orb[0], same = orb === last[0] || (m === n && (orb[1] === 's' || orb[1] === 'p') && (last[0][1] === 's' || last[0][1] === 'p'));
      if (same) S += (orb === last[0] ? k - 1 : k) * (n === 1 ? 0.30 : 0.35); else if (m === n - 1) S += 0.85 * k; else if (m < n - 1) S += 1.0 * k;
    }
    if (cfg.length === 1 && n === 1) S = (cfg[0][1] - 1) * 0.30;
    return { Zeff: Z - S, n, S };
  };
  /* Energía total de Slater de una configuración (cfg = [[orbital, nº de electrones]]) con carga nuclear Z: E = −Σ Z*²/(2n²) */
  A.slaterE = function (Z, cfg) {
    let E = 0;
    for (const [orb, k] of cfg) {
      if (!k) continue; const n = +orb[0], sp = orb[1] === 's' || orb[1] === 'p'; let S = 0;
      for (const [o2, k2] of cfg) { const m = +o2[0], same = o2 === orb || (m === n && sp && (o2[1] === 's' || o2[1] === 'p')); if (same) S += (o2 === orb ? k - 1 : k2) * (n === 1 ? 0.30 : 0.35); else if (m === n - 1) S += 0.85 * k2; else if (m < n - 1) S += k2; }
      const Zs = Z - S; E += -k * (Zs * Zs) / (2 * n * n);
    }
    return E;
  };
  /* Energía de ionización de Slater: E(catión) − E(neutro), quitando un electrón del último orbital ocupado */
  A.slaterIE = function (Z) { const cfg = A.config(Z), cat = cfg.map(([o, k], i) => [o, i === cfg.length - 1 ? k - 1 : k]); return (A.slaterE(Z, cat) - A.slaterE(Z, cfg)) * 27.211386; };
  /* Energías de ionización experimentales (NIST, eV), Z = 1–18 */
  A.IE = [13.598, 24.587, 5.392, 9.323, 8.298, 11.260, 14.534, 13.618, 17.423, 21.565, 5.139, 7.646, 5.986, 8.152, 10.487, 10.360, 12.968, 15.760];

  /* Términos de Russell–Saunders de la configuración l^n por enumeración de microestados; devuelve [{S, L, deg}] */
  A.terms = function (l, n) {
    const orb = []; for (let ml = -l; ml <= l; ml++) for (const ms of [1, -1]) orb.push([ml, ms]);
    const tab = {}; const rec = (start, k, ML, MS) => { if (k === n) { const key = ML + ',' + MS; tab[key] = (tab[key] || 0) + 1; return; } for (let i = start; i < orb.length; i++) rec(i + 1, k + 1, ML + orb[i][0], MS + orb[i][1]); };
    rec(0, 0, 0, 0);
    const terms = [];
    for (;;) {
      let best = null; for (const key of Object.keys(tab)) { const [ML, MS] = key.split(',').map(Number); if (tab[key] > 0 && MS >= 0 && ML >= 0) if (!best || MS > best[1] || (MS === best[1] && ML > best[0])) best = [ML, MS]; }
      if (!best) break; const [L, S2] = best; terms.push({ S: S2 / 2, L, deg: (2 * L + 1) * (S2 + 1) });
      for (let ML = -L; ML <= L; ML++) for (let MS = -S2; MS <= S2; MS += 2) tab[ML + ',' + MS]--;
    }
    return terms;
  };
  A.LET = 'SPDFGHI';
  /* Término fundamental de Hund: máximo S, luego máximo L */
  A.hund = (terms) => terms.slice().sort((a, b) => b.S - a.S || b.L - a.L)[0];

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
