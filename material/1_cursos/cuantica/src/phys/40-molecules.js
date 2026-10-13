/* ===================================================================
   phys/40-molecules.js — Moléculas (unidades atómicas salvo indicación).
   · Ion H₂⁺ con combinación lineal de orbitales 1s de Slater (exponente ζ):
     integrales analíticas S, H_AA, H_AB y energías E±(R).
   · Diatómica heteronuclear en el modelo de dos niveles.
   · Hückel / enlace fuerte para moléculas planas (α, β por especie).
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const LA = P.la, U = P.util;
  const MOL = (P.mol = {});

  /* ---------- H₂⁺ (LCAO con 1s de Slater de exponente ζ) ---------- */
  MOL.h2p = function (R, zeta = 1) {
    const r = zeta * R, er = Math.exp(-r), e2 = Math.exp(-2 * r);
    const S = er * (1 + r + (r * r) / 3);
    const HAA = (zeta * zeta) / 2 - zeta - (1 / R - e2 * (zeta + 1 / R));
    const HAB = ((zeta * zeta) / 2) * er * (1 + r - (r * r) / 3) - 2 * zeta * (1 + r) * er;
    const Eg = (HAA + HAB) / (1 + S) + 1 / R;
    const Eu = (HAA - HAB) / (1 - S) + 1 / R;
    /* piezas para explicar: J (Coulomb) y K (resonancia) respecto de un átomo aislado */
    const J = -(1 / R - e2 * (zeta + 1 / R));
    const K = HAB - S * ((zeta * zeta) / 2 - zeta);
    return { R, zeta, S, HAA, HAB, Eg, Eu, J, K };
  };
  /* ζ óptimo para cada R (mínimo de E_g) */
  MOL.h2pOpt = function (R) {
    const m = U.golden((z) => MOL.h2p(R, z).Eg, 0.5, 2.5, 1e-10);
    return { zeta: m.x, E: m.f };
  };
  /* Mínimo de la curva E_g(R) (con ζ fijo o optimizado) */
  MOL.h2pMin = function (opt = false, zeta = 1) {
    const f = (R) => (opt ? MOL.h2pOpt(R).E : MOL.h2p(R, zeta).Eg);
    const m = U.golden(f, 1.0, 4.5, 1e-10);
    return { R: m.x, E: m.f, zeta: opt ? MOL.h2pOpt(m.x).zeta : zeta };
  };
  /* Referencia exacta (Bates, Ledsham y Stewart 1953; Madsen y Peek 1971) */
  MOL.H2P_EXACT = { Re: 1.9972, Ee: -0.6026342, De_eV: 2.793 };
  /* Orbital 1s de Slater normalizado */
  MOL.sto1s = (r, zeta = 1) => Math.sqrt((zeta ** 3) / Math.PI) * Math.exp(-zeta * r);
  /* Orbital molecular ψ± en el punto (x,z) con núcleos en z = ±R/2 */
  MOL.h2pPsi = function (x, y, z, R, zeta, sign = 1) {
    const rA = Math.hypot(x, y, z - R / 2), rB = Math.hypot(x, y, z + R / 2);
    const S = MOL.h2p(R, zeta).S;
    return (MOL.sto1s(rA, zeta) + sign * MOL.sto1s(rB, zeta)) / Math.sqrt(2 * (1 + sign * S));
  };

  /* ---------- Modelo de dos niveles (diatómica A–B) ----------
     H = [[εA, −t],[−t, εB]] con t > 0 (acoplamiento), S = 0. */
  MOL.twoLevel = function (eA, eB, t) {
    const m = (eA + eB) / 2, d = (eA - eB) / 2;
    const w = Math.sqrt(d * d + t * t);
    const Eb = m - w, Ea = m + w;
    /* autovector enlazante: (εA − E_b) c_A − t c_B = 0 → c ∝ (t, εA − E_b); peso sobre A = |c_A|² */
    const q = t * t + (eA - Eb) ** 2;
    const pA = q > 0 ? (t * t) / q : eA <= eB ? 1 : 0;
    return { Eb, Ea, gap: 2 * w, wA: pA, wB: 1 - pA, ionicity: w > 0 ? Math.abs(d) / w : 0 };
  };

  /* ---------- Hückel ----------
     mol = {atoms:[{s, x, y}], bonds:[[i,j],...]}; par = {alpha:{C:0,...}, beta:{'C-C':-1,...}} */
  MOL.huckelMatrix = function (mol, par) {
    const n = mol.atoms.length;
    const H = LA.zeros(n);
    mol.atoms.forEach((a, i) => { H[i][i] = par.alpha[a.s] || 0; });
    for (const [i, j] of mol.bonds) {
      const a = mol.atoms[i].s, b = mol.atoms[j].s;
      const key = par.beta[a + '-' + b] !== undefined ? a + '-' + b : b + '-' + a;
      const bv = par.beta[key] !== undefined ? par.beta[key] : par.beta.default;
      H[i][j] = H[j][i] = bv;
    }
    return H;
  };
  MOL.huckel = function (mol, par) {
    const H = MOL.huckelMatrix(mol, par);
    const r = LA.jacobi(H);
    return { H, E: Array.from(r.values), C: r.vectors };
  };
  /* Moléculas y anillos de ejemplo (coordenadas en unidades de la distancia de enlace) */
  const ring = (n, species) => {
    const atoms = [], bonds = [];
    const R = 1 / (2 * Math.sin(Math.PI / n));
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 + (2 * Math.PI * k) / n;
      atoms.push({ s: species ? species(k) : 'C', x: R * Math.cos(a), y: R * Math.sin(a) });
      bonds.push([k, (k + 1) % n]);
    }
    return { atoms, bonds };
  };
  const chain = (n, species) => {
    const atoms = [], bonds = [];
    for (let k = 0; k < n; k++) {
      atoms.push({ s: species ? species(k) : 'C', x: (k - (n - 1) / 2) * Math.cos(Math.PI / 6), y: (k % 2 ? 0.25 : -0.25) });
      if (k) bonds.push([k - 1, k]);
    }
    return { atoms, bonds };
  };
  MOL.ring = ring;
  MOL.chain = chain;
  MOL.naphthalene = function () {
    const s3 = Math.sqrt(3) / 2;
    const pts = [[-s3, 1], [0, 0.5], [s3, 1], [2 * s3, 0.5], [2 * s3, -0.5], [s3, -1], [0, -0.5], [-s3, -1], [-2 * s3, -0.5], [-2 * s3, 0.5]];
    const atoms = pts.map((p) => ({ s: 'C', x: p[0], y: p[1] }));
    const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0], [1, 6]];
    return { atoms, bonds };
  };
  MOL.LIBRARY = {
    etileno: { name: 'Etileno C₂H₄', make: () => chain(2) },
    alilo: { name: 'Alilo C₃H₅', make: () => chain(3) },
    butadieno: { name: 'Butadieno C₄H₆', make: () => chain(4) },
    hexatrieno: { name: 'Hexatrieno C₆H₈', make: () => chain(6) },
    ciclobutadieno: { name: 'Ciclobutadieno C₄H₄', make: () => ring(4) },
    benceno: { name: 'Benceno C₆H₆', make: () => ring(6) },
    borazina: { name: 'Borazina B₃N₃H₆', make: () => ring(6, (k) => (k % 2 ? 'B' : 'N')) },
    naftaleno: { name: 'Naftaleno C₁₀H₈', make: () => MOL.naphthalene() }
  };
})(typeof window !== 'undefined' ? window : globalThis);
