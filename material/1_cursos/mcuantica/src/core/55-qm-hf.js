/* ===================================================================
   55-qm-hf.js — Átomos de varios electrones (EM.qm.hf), unidades atómicas.
   Hartree–Fock restringido (Roothaan) para sistemas de dos electrones 1s² con una base de gaussianas s; reglas de Slater;
   configuraciones electrónicas de Madelung. Requiere EM.P.la (30-linalg.js).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const qm = (EM.qm = EM.qm || {});
  const Hf = (qm.hf = {});
  /* (ij|kl) para gaussianas s sin normalizar exp(−a r²): 2π^{5/2}/[p q √(p + q)], p = a_i + a_j, q = a_k + a_l */
  Hf.eri = (p, q) => (2 * Math.pow(Math.PI, 2.5)) / (p * q * Math.sqrt(p + q));
  /* HF restringido de dos electrones en un orbital 1s = Σ c_i exp(−a_i r²); devuelve {E, eps, c, iter, Eone, Ecoul} (hartree) */
  Hf.rhf = function (exps, Z = 2, o = {}) {
    const n = exps.length, LA = EM.P.la, S = LA.zeros(n), h = LA.zeros(n), G = []; let c = null;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = exps[i], b = exps[j], p = a + b, s = Math.pow(Math.PI / p, 1.5); S[i][j] = s; h[i][j] = ((3 * a * b) / p) * s - (Z * 2 * Math.PI) / p; }
    for (let i = 0; i < n; i++) { G.push([]); for (let j = 0; j < n; j++) { G[i].push([]); for (let k = 0; k < n; k++) { G[i][j].push(new Float64Array(n)); for (let l = 0; l < n; l++) G[i][j][k][l] = Hf.eri(exps[i] + exps[j], exps[k] + exps[l]); } } }
    /* arranque: solución hidrogenoide de carga Z − 5/16 */
    const g0 = LA.geneig(h, S); c = Array.from({ length: n }, (_, i) => g0.vectors[i][0]); let E = 0, eps = 0, it = 0;
    for (it = 0; it < (o.maxit || 200); it++) {
      const F = LA.zeros(n);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = h[i][j]; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) s += c[k] * c[l] * (2 * G[i][j][k][l] - G[i][k][j][l]); F[i][j] = s; }
      const r = LA.geneig(F, S), cn = Array.from({ length: n }, (_, i) => r.vectors[i][0]); eps = r.values[0];
      let e1 = 0, e2 = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { e1 += 2 * cn[i] * cn[j] * h[i][j]; for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) e2 += cn[i] * cn[j] * cn[k] * cn[l] * G[i][j][k][l]; }
      const En = e1 + e2, sgn = cn.reduce((s, v, i) => s + v * c[i], 0) < 0 ? -1 : 1, d = Math.max(...cn.map((v, i) => Math.abs(sgn * v - c[i])));
      c = cn.map((v, i) => 0.5 * (sgn * v + c[i]) * (it < 30 ? 1 : 1)); E = En;
      /* renormalizar */ let nn = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) nn += c[i] * c[j] * S[i][j]; c = c.map((v) => v / Math.sqrt(nn));
      if (d < 1e-10) break;
    }
    return { E, eps, c, iter: it };
  };
  /* Exponentes «even-tempered»: a_i = a₁ β^{i−1} */
  Hf.eventemp = (n, a1, beta) => Array.from({ length: n }, (_, i) => a1 * Math.pow(beta, i));
  /* Constante de apantallamiento de Slater para un electrón en el subnivel dado dentro de la configuración conf (lista de [n, l, ocupación]) */
  Hf.slaterZeff = function (Z, conf, n, l) {
    const grp = (nn, ll) => (ll <= 1 ? nn + 'sp' : nn + 'd' + (ll === 2 ? 'd' : 'f')); /* clasificación: (ns,np), (nd), (nf) */
    let s = 0; const isSP = l <= 1;
    for (const [nn, ll, occ] of conf) {
      let k = occ; if (nn === n && ll === l) k = occ - 1;
      if (nn > n) continue;
      if (isSP) { if (nn === n && ll <= 1) s += 0.35 * k; else if (nn === n - 1) s += 0.85 * k; else if (nn < n - 1) s += 1.0 * k; else if (nn === n && ll >= 2) s += 0 * k; }
      else { if (nn === n && ll === l) s += 0.35 * k; else if (nn < n || (nn === n && ll < l)) s += 1.0 * k; }
    }
    if (n === 1 && l === 0) { let t = 0; for (const [nn, ll, occ] of conf) if (nn === 1) t += occ - 1; return Z - 0.30 * t; }
    return Z - s;
  };
  /* Efectiva n* de Slater: n → n* (1, 2, 3, 3.7, 4.0, 4.2) */
  Hf.nstar = (n) => [0, 1, 2, 3, 3.7, 4.0, 4.2][n];
  /* Configuración de Madelung hasta Z = 118 (sin excepciones): lista de [n, l, ocupación] y cadena */
  const ORD = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [7, 0], [5, 3], [6, 2], [7, 1]];
  Hf.madelung = function (Z) { const conf = []; let left = Z; for (const [n, l] of ORD) { if (left <= 0) break; const k = Math.min(left, 2 * (2 * l + 1)); conf.push([n, l, k]); left -= k; } return conf; };
  Hf.confString = (conf) => conf.map(([n, l, k]) => n + 'spdfg'[l] + k).join(' ');
  if (typeof module !== 'undefined' && module.exports) module.exports = Hf;
})(typeof window !== 'undefined' ? window : globalThis);
