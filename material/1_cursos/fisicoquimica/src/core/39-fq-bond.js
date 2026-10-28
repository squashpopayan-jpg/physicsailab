/* ===================================================================
   39-fq-bond.js — Enlace químico: H₂⁺ con LCAO de orbitales 1s de Slater, teoría de Hückel y orbitales moleculares de diatómicas homonucleares.
   Unidades atómicas.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const B = (FQ.bond = {});

  /* H₂⁺: base {1s_a, 1s_b} con exponente ζ (Slater). x = ζR. Devuelve integrales y las energías totales (con 1/R) de σg y σu */
  B.h2p = function (R, z) {
    z = z || 1; const x = z * R, ex = Math.exp(-x), S = ex * (1 + x + (x * x) / 3), K = z * ex * (1 + x), J = 1 / R - Math.exp(-2 * x) * (z + 1 / R);
    const Haa = (z * z) / 2 - z - J, Hab = (-z * z * S) / 2 - (2 - z) * K;
    return { S, J, K, Haa, Hab, Eg: (Haa + Hab) / (1 + S) + 1 / R, Eu: (Haa - Hab) / (1 - S) + 1 / R };
  };
  /* Mínimo de E_g(R, ζ) respecto de R (y de ζ si opt) por búsquedas sucesivas de sección áurea */
  const gold = (f, a, b) => { const g = 0.6180339887498949; let c = b - g * (b - a), d = a + g * (b - a); for (let i = 0; i < 120; i++) { if (f(c) < f(d)) b = d; else a = c; c = b - g * (b - a); d = a + g * (b - a); } return 0.5 * (a + b); };
  B.h2pMin = function (opt) {
    if (!opt) { const R = gold((R) => B.h2p(R, 1).Eg, 0.8, 8); return { R, z: 1, E: B.h2p(R, 1).Eg }; }
    const zOf = (R) => gold((z) => B.h2p(R, z).Eg, 0.5, 2.5), R = gold((R) => B.h2p(R, zOf(R)).Eg, 0.8, 8), z = zOf(R); return { R, z, E: B.h2p(R, z).Eg };
  };
  /* Orbital σg/σu a lo largo del eje (normalizado) en el punto x (bohr), con los núcleos en ±R/2 */
  B.h2pPsi = function (R, z, sign, x) {
    const h = B.h2p(R, z), N = 1 / Math.sqrt(2 * (1 + sign * h.S)), s = (z ** 3 / Math.PI) ** 0.5;
    return N * s * (Math.exp(-z * Math.abs(x + R / 2)) + sign * Math.exp(-z * Math.abs(x - R / 2)));
  };

  /* Hückel: A = matriz de adyacencia; N electrones π. E_i = α + x_i β (β < 0), x_i = valores propios de A */
  B.huckel = function (adj, N) {
    const n = adj.length, e = FQ.eigSym(adj), idx = e.val.map((_, i) => n - 1 - i), x = idx.map((i) => e.val[i]), C = idx.map((i) => e.vec[i]); /* orden decreciente de x: de más ligado a más antiligado */
    const occ = new Array(n).fill(0); let rem = N, i = 0; while (rem > 0 && i < n) { /* grupos degenerados: reparto igual (capa abierta) */ let j = i; while (j + 1 < n && Math.abs(x[j + 1] - x[i]) < 1e-8) j++; const cap = 2 * (j - i + 1), k = Math.min(cap, rem); for (let q = i; q <= j; q++) occ[q] = k / (j - i + 1); rem -= k; i = j + 1; }
    const q = new Array(n).fill(0); for (let k = 0; k < n; k++) for (let r = 0; r < n; r++) q[r] += occ[k] * C[k][r] * C[k][r];
    const bo = (r, s) => { let p = 0; for (let k = 0; k < n; k++) p += occ[k] * C[k][r] * C[k][s]; return p; };
    const Epi = occ.reduce((a, o, k) => a + o * x[k], 0), homo = occ.reduce((h, o, k) => (o > 0 ? k : h), -1);
    return { x, C, occ, q, bo, Epi, homo, lumo: homo + 1 < n ? homo + 1 : -1 };
  };
  const chain = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (Math.abs(i - j) === 1 ? 1 : 0)));
  const ring = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => ((i - j + n) % n === 1 || (j - i + n) % n === 1 ? 1 : 0)));
  B.chain = chain; B.ring = ring;
  B.naphthalene = () => { const e = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6], [6, 7], [7, 8], [8, 9], [9, 4]], A = Array.from({ length: 10 }, () => new Array(10).fill(0)); e.forEach(([i, j]) => { A[i][j] = A[j][i] = 1; }); return A; };

  /* Orbitales moleculares de diatómicas homonucleares del 2.º período. Orden de energía: σ2s, σ*2s, [π2p, σ2p] o [σ2p, π2p], π*2p, σ*2p */
  B.dia = function (N, swap) {
    const lv = swap ? [['σ2s', 1], ['σ*2s', 1], ['σ2p', 1], ['π2p', 2], ['π*2p', 2], ['σ*2p', 1]] : [['σ2s', 1], ['σ*2s', 1], ['π2p', 2], ['σ2p', 1], ['π*2p', 2], ['σ*2p', 1]], out = []; let rem = N;
    for (const [nm, g] of lv) { const cap = 2 * g, k = Math.min(cap, rem); /* Hund: llenar cada orbital degenerado con un electrón antes de aparear */ const occ = new Array(g).fill(0); for (let e = 0; e < k; e++) occ[e % g]++; out.push({ nm, g, occ }); rem -= k; if (rem <= 0 && out.length < lv.length) { /* niveles vacíos restantes */ } }
    for (const [nm, g] of lv.slice(out.length)) out.push({ nm, g, occ: new Array(g).fill(0) });
    const nb = out.filter((l) => !l.nm.includes('*')).reduce((a, l) => a + l.occ.reduce((s, o) => s + o, 0), 0), na = out.filter((l) => l.nm.includes('*')).reduce((a, l) => a + l.occ.reduce((s, o) => s + o, 0), 0);
    const unp = out.reduce((a, l) => a + l.occ.filter((o) => o === 1).length, 0);
    return { levels: out, bondOrder: (nb - na) / 2, unpaired: unp };
  };
  /* Datos espectroscópicos (NIST/Huber–Herzberg): r_e (Å) y D₀ (eV) */
  B.DIA = { Li2: [2, 2.673, 1.046], B2: [6, 1.590, 2.9], C2: [8, 1.243, 6.21], N2: [10, 1.098, 9.759], O2: [12, 1.208, 5.116], F2: [14, 1.412, 1.602] };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
