/* ===================================================================
   phys/70-hbn.js — La física de hBN-MC (energías en eV).
   · Parámetros de la tesis de M. A. Obando (FIMAT-UFOP, 2019): Tablas 5.1, 5.7 y 5.8.
   · Ajuste por mínimos cuadrados sobre las 20 estructuras BxCyNz de Mazzoni.
   · Reservorio de hidrógeno, energía de borde por H, ventana química, E_form.
   · Motor Monte Carlo compacto en red de panal periódica con el mismo
     Hamiltoniano de enlaces que hBN-MC (intercambios locales y globales).
   Códigos de especie (los de hBN-MC): 0 = vacancia (X), 1 = N, 2 = B, 3 = C.
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const LA = P.la;
  const H = (P.hbn = {});

  H.KB = 8.6173324e-5; /* eV/K, idéntica a core.js de hBN-MC */
  H.D = 1.44; /* Å, distancia B–N usada por la aplicación */
  H.PARAMS = Object.freeze({ NN: -185.29, NB: -128.1626, BB: -67.9148, XN: -109.7987, XB: -50.3121, XX: -15.031, CC: -107.32, CN: -147.02, CB: -88.01, XC: -70.41 });
  H.E_MOL = Object.freeze({ BN: -386.72, NH3: -328.37, BH3: -149.88, H2: -30.062, CC: -324.68 });
  H.SPEC = ['X', 'N', 'B', 'C'];
  H.pairKey = function (a, b) {
    if (a === 0 && b === 0) return 'XX';
    if (a === 0 || b === 0) { const x = a || b; return x === 1 ? 'XN' : x === 2 ? 'XB' : 'XC'; }
    if (a === 3 || b === 3) { const o = a === 3 ? b : a; return o === 3 ? 'CC' : o === 1 ? 'CN' : 'CB'; }
    if (a === 1 && b === 1) return 'NN';
    if (a === 2 && b === 2) return 'BB';
    return 'NB';
  };

  /* ---------- Fórmulas cerradas ---------- */
  /* Intercambio B↔N en h-BN perfecto: se rompen 4 enlaces N–B y aparecen 2 N–N y 2 B–B (cuenta de la subred) */
  H.swapBN = (p = H.PARAMS) => 2 * (p.NN + p.BB) - 4 * p.NB;
  /* Energía de mezcla por par de enlaces mixtos: (ε_CN + ε_CB) − (ε_CC + ε_NB) */
  H.mixBNC = (p = H.PARAMS) => p.CN + p.CB - (p.CC + p.NB);
  /* Desplazamiento por H del reservorio y término vacancia–vacancia */
  H.shift = (res, dmu) => (res === 'H2' ? H.E_MOL.H2 / 2 + dmu : dmu);
  H.epsVV = (res, p = H.PARAMS) => (res === 'H2' ? 0 : p.XX);
  /* Energía de borde por H en h-BN ordenado: e_H = −(ε_NB − ε'_XN − ε'_XB)/2 − ε'_XX/2 */
  H.edgePerH = function (res = 'tesis', dmu = 0, p = H.PARAMS) {
    const s = H.shift(res, dmu);
    return -(p.NB - (p.XN - s) - (p.XB - s)) / 2 - H.epsVV(res, p) / 2;
  };
  /* Identidad de hidrogenación: ε_XY = ΔE_hidrog(Y–H) + E(H₂)/2 + ε_YY/2 */
  H.hydrogenation = function (sp, p = H.PARAMS) {
    const a = { N: p.NN / 2, B: p.BB / 2, C: p.CC / 2 }[sp];
    const e = { N: p.XN, B: p.XB, C: p.XC }[sp];
    return e - H.E_MOL.H2 / 2 - a;
  };
  /* Ventana química del nitrógeno para un Δμ_H (referencia de μ_BN: 'model' = 3ε_NB, 'dft' = E(BN)) */
  H.window = function (dmuH = 0, ref = 'model', p = H.PARAMS) {
    const muH = H.E_MOL.H2 / 2 + dmuH;
    const muBN = ref === 'dft' ? H.E_MOL.BN : 3 * p.NB;
    const muNmax = H.E_MOL.NH3 - 3 * muH, muBmax = H.E_MOL.BH3 - 3 * muH;
    const muNmin = muBN - muBmax;
    const dmuHOpen = (H.E_MOL.NH3 + H.E_MOL.BH3 - muBN) / 6 - H.E_MOL.H2 / 2;
    return { muH, muBN, muNmax, muNmin, muBmax, width: muNmax - muNmin, open: muNmax >= muNmin, dmuHOpen };
  };
  H.envPotentials = function (env = 'Nrich', dmuH = 0, ref = 'model', p = H.PARAMS) {
    const w = H.window(dmuH, ref, p);
    let muN = w.muNmax;
    if (env === 'Brich') muN = w.muNmin; else if (env === 'mid') muN = 0.5 * (w.muNmax + w.muNmin);
    return { muN, muB: w.muBN - muN, muH: w.muH, muC: ref === 'dft' ? H.E_MOL.CC / 2 : 1.5 * p.CC, open: w.open };
  };
  /* E_form de las monovacancias pasivadas (3 H), con μ_BN = 3ε_NB */
  H.EformVB3H = (muN, muH, p = H.PARAMS) => -3 * p.NB + (3 * p.NB - muN) + 3 * p.XN - 3 * muH;
  H.EformVN3H = (muN, muH, p = H.PARAMS) => -3 * p.NB + muN + 3 * p.XB - 3 * muH;

  /* ---------- Datos DFT de la tesis: 20 estructuras de Mazzoni (celdas de 8 átomos) ---------- */
  H.MAZZONI = Object.freeze([
    { id: 'a', n: { CC: 1, CN: 4, CB: 0, NN: 1, NB: 6, BB: 0 }, E: -1649.24 },
    { id: 'b', n: { CC: 2, CN: 2, CB: 0, NN: 2, NB: 6, BB: 0 }, E: -1647.83 },
    { id: 'c', n: { CC: 1, CN: 0, CB: 4, NN: 0, NB: 6, BB: 1 }, E: -1295.23 },
    { id: 'd', n: { CC: 2, CN: 0, CB: 2, NN: 0, NB: 6, BB: 2 }, E: -1296.01 },
    { id: 'e', n: { CC: 2, CN: 4, CB: 4, NN: 0, NB: 2, BB: 0 }, E: -1411.99 },
    { id: 'f', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1411.99 },
    { id: 'g', n: { CC: 2, CN: 4, CB: 4, NN: 0, NB: 2, BB: 0 }, E: -1411.15 },
    { id: 'h', n: { CC: 5, CN: 1, CB: 1, NN: 0, NB: 5, BB: 0 }, E: -1412.55 },
    { id: 'i', n: { CC: 1, CN: 2, CB: 2, NN: 0, NB: 7, BB: 0 }, E: -1475.71 },
    { id: 'j', n: { CC: 2, CN: 1, CB: 1, NN: 0, NB: 8, BB: 0 }, E: -1475.67 },
    { id: 'k', n: { CC: 2, CN: 2, CB: 0, NN: 2, NB: 6, BB: 0 }, E: -1649.08 },
    { id: 'l', n: { CC: 2, CN: 0, CB: 2, NN: 0, NB: 6, BB: 2 }, E: -1295.96 },
    { id: 'm', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1411.17 },
    { id: 'n', n: { CC: 4, CN: 2, CB: 2, NN: 0, NB: 4, BB: 0 }, E: -1412.53 },
    { id: 'o', n: { CC: 5, CN: 0, CB: 2, NN: 1, NB: 4, BB: 0 }, E: -1410.33 },
    { id: 'p', n: { CC: 5, CN: 2, CB: 0, NN: 0, NB: 4, BB: 1 }, E: -1410.67 },
    { id: 'q', n: { CC: 2, CN: 0, CB: 2, NN: 1, NB: 7, BB: 0 }, E: -1472.85 },
    { id: 'r', n: { CC: 2, CN: 2, CB: 0, NN: 0, NB: 7, BB: 1 }, E: -1473.22 },
    { id: 's', n: { CC: 0, CN: 3, CB: 3, NN: 0, NB: 6, BB: 0 }, E: -1473.14 },
    { id: 't', n: { CC: 0, CN: 3, CB: 3, NN: 0, NB: 6, BB: 0 }, E: -1473.81 }
  ]);
  H.FIT_KEYS = ['NN', 'NB', 'BB', 'CC', 'CN', 'CB'];
  /* Átomos implicados por los conteos de enlaces (coordinación 3) */
  H.atomsFromBonds = function (n) {
    const g = (k) => +n[k] || 0;
    return { N: (2 * g('NN') + g('NB') + g('CN') + g('XN')) / 3, B: (2 * g('BB') + g('NB') + g('CB') + g('XB')) / 3, C: (2 * g('CC') + g('CN') + g('CB') + g('XC')) / 3 };
  };
  /* Mínimos cuadrados ordinarios E_i = Σ_k n_ik ε_k: parámetros, errores estándar, R², LOO */
  H.fit = function (rows, keys = H.FIT_KEYS, fixed = {}) {
    const free = keys.filter((k) => fixed[k] === undefined);
    const nObs = rows.length, p = free.length;
    if (nObs <= p) return { ok: false, msg: `se necesitan más estructuras (${nObs}) que parámetros (${p})` };
    const X = rows.map((r) => free.map((k) => +r.n[k] || 0));
    const y = rows.map((r) => r.E - Object.entries(fixed).reduce((s, [k, v]) => s + (+r.n[k] || 0) * v, 0));
    const XtX = free.map((_, a) => free.map((__, b) => X.reduce((s, row) => s + row[a] * row[b], 0)));
    const Xty = free.map((_, a) => X.reduce((s, row, i) => s + row[a] * y[i], 0));
    const inv = LA.inv(XtX, 1e-12);
    if (!inv) return { ok: false, msg: 'XᵀX es singular: con estas estructuras los parámetros no son identificables', XtX };
    const beta = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0));
    const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
    const resid = y.map((v, i) => v - fitted[i]);
    const rss = resid.reduce((s, e) => s + e * e, 0);
    const dof = nObs - p, s2 = rss / dof;
    const sigma = inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * s2)));
    const corr = inv.map((row, i) => row.map((v, j) => (v * s2) / ((sigma[i] * sigma[j]) || 1)));
    const Em = rows.reduce((s, r) => s + r.E, 0) / nObs;
    const sst = rows.reduce((s, r) => s + (r.E - Em) ** 2, 0);
    const loo = X.map((row, i) => {
      const h = row.reduce((s, v, a) => s + v * row.reduce((t, w, b) => t + inv[a][b] * w, 0), 0);
      return resid[i] / (1 - h);
    });
    const params = {}, stderr = {};
    free.forEach((k, i) => { params[k] = beta[i]; stderr[k] = sigma[i]; });
    return {
      ok: true, free, params, stderr, corr, n: nObs, p, dof,
      resid: rows.map((r, i) => ({ id: r.id, E: r.E, Emodel: r.E - resid[i], resid: resid[i], loo: loo[i] })),
      rms: Math.sqrt(rss / nObs), rmsPerAtom: Math.sqrt(rss / nObs) / 8, maxAbs: Math.max(...resid.map(Math.abs)),
      R2: 1 - rss / sst, looRms: Math.sqrt(loo.reduce((s, e) => s + e * e, 0) / nObs), cond: null
    };
  };

  /* ---------- Motor Monte Carlo en el panal ---------- */
  H.Lattice = class {
    constructor(L, o = {}) {
      this.g = P.sm.brick(L);
      this.L = L; this.N = this.g.N;
      this.p = Object.assign({}, H.PARAMS, o.params || {});
      this.res = o.res || 'tesis'; this.dmu = o.dmu || 0;
      this.s = new Uint8Array(this.N);
      this.rng = o.rng || P.rng(1);
      this.perfect();
    }
    /* h-BN perfecto: paridad par → B, impar → N */
    perfect() { for (let k = 0; k < this.N; k++) this.s[k] = this.g.par[k] ? 1 : 2; return this; }
    sub(k) { return this.g.par[k] ? 1 : 2; } /* especie ideal de la subred */
    eps(a, b) { return this.p[H.pairKey(a, b)]; }
    epsEff(a, b) {
      if (a === 0 && b === 0) return H.epsVV(this.res, this.p);
      const base = this.eps(a, b);
      return a === 0 || b === 0 ? base - H.shift(this.res, this.dmu) : base;
    }
    bondCounts() {
      const c = { NN: 0, NB: 0, BB: 0, XN: 0, XB: 0, XX: 0, CC: 0, CN: 0, CB: 0, XC: 0 };
      const nb = this.g.nb, s = this.s;
      for (let k = 0; k < this.N; k++) for (let q = 0; q < 3; q++) { const m = nb[3 * k + q]; if (m > k) c[H.pairKey(s[k], s[m])]++; }
      return c;
    }
    species() { const c = { X: 0, N: 0, B: 0, C: 0 }; for (let k = 0; k < this.N; k++) c[H.SPEC[this.s[k]]]++; return c; }
    /* energía del Monte Carlo (con reservorio) */
    energy() { const c = this.bondCounts(); let E = 0; for (const k in c) E += c[k] * (k === 'XX' ? H.epsVV(this.res, this.p) : k[0] === 'X' ? this.p[k] - H.shift(this.res, this.dmu) : this.p[k]); return E; }
    /* energía «física» (sin término X–X ni desplazamiento de reservorio) */
    physEnergy() { const c = this.bondCounts(); let E = 0; for (const k in c) if (k !== 'XX') E += c[k] * this.p[k]; return E; }
    nH() { const c = this.bondCounts(); return c.XN + c.XB + c.XC; }
    formation(env = 'Nrich', dmuH = 0, ref = 'model') {
      const mu = H.envPotentials(env, dmuH, ref, this.p);
      const sp = this.species(), nH = this.nH();
      const Ephys = this.physEnergy();
      return { Eform: Ephys - sp.B * mu.muB - sp.N * mu.muN - sp.C * mu.muC - nH * mu.muH, nH, mu };
    }
    /* ΔE de intercambiar los sitios k y m (vecinos o no) */
    dE(k, m) {
      const s = this.s, nb = this.g.nb, a = s[k], b = s[m];
      if (a === b) return 0;
      let d = 0;
      for (let q = 0; q < 3; q++) {
        const n1 = nb[3 * k + q];
        if (n1 !== m) d += this.epsEff(b, s[n1]) - this.epsEff(a, s[n1]);
        const n2 = nb[3 * m + q];
        if (n2 !== k) d += this.epsEff(a, s[n2]) - this.epsEff(b, s[n2]);
      }
      return d; /* el enlace directo k–m (si existe) no cambia al intercambiar */
    }
    /* Un paso de Monte Carlo: n intentos; fracción global de intercambios lejanos */
    sweep(T, n = this.N, globalFrac = 0) {
      const rng = this.rng, nb = this.g.nb, s = this.s, kT = H.KB * T;
      let acc = 0, tried = 0;
      for (let a = 0; a < n; a++) {
        const k = (rng() * this.N) | 0;
        const m = rng() < globalFrac ? (rng() * this.N) | 0 : nb[3 * k + ((rng() * 3) | 0)];
        if (m === k || s[k] === s[m]) { tried++; continue; }
        tried++;
        const d = this.dE(k, m);
        if (d <= 0 || rng() < Math.exp(-d / kT)) { const t = s[k]; s[k] = s[m]; s[m] = t; acc++; this.E += d; }
      }
      return { acc, tried };
    }
    /* Racimos de vacancias (poros) por búsqueda en anchura */
    pores() {
      const seen = new Uint8Array(this.N), out = [], nb = this.g.nb, s = this.s;
      for (let k = 0; k < this.N; k++) {
        if (s[k] !== 0 || seen[k]) continue;
        const cl = [k]; seen[k] = 1;
        for (let h = 0; h < cl.length; h++) for (let q = 0; q < 3; q++) { const m = nb[3 * cl[h] + q]; if (s[m] === 0 && !seen[m]) { seen[m] = 1; cl.push(m); } }
        let eN = 0, eB = 0, eC = 0;
        for (const c of cl) for (let q = 0; q < 3; q++) { const m = nb[3 * c + q]; if (s[m] === 1) eN++; else if (s[m] === 2) eB++; else if (s[m] === 3) eC++; }
        out.push({ sites: cl, n: cl.length, nH: eN + eB + eC, eN, eB, eC });
      }
      return out.sort((a, b) => b.n - a.n);
    }
    /* Vector de posición mínima (periódica) de m relativo a k, en unidades de d */
    rel(k, m) {
      const g = this.g;
      let dx = g.x[m] - g.x[k], dy = g.y[m] - g.y[k];
      dx -= g.W * Math.round(dx / g.W); dy -= g.H * Math.round(dy / g.H);
      return [dx, dy];
    }
    nearest(x, y, parity) {
      let best = -1, bd = Infinity;
      for (let k = 0; k < this.N; k++) { if (parity !== undefined && this.g.par[k] !== parity) continue; const d = (this.g.x[k] - x) ** 2 + (this.g.y[k] - y) ** 2; if (d < bd) { bd = d; best = k; } }
      return best;
    }
    /* Poro triangular de orden n (n² vacancias). term = 'N' (bordes de N con H) o 'B' */
    triangle(n, term = 'N', cx, cy) {
      const g = this.g;
      /* subred del triángulo mayor: B (paridad 0) para borde N; N (paridad 1) para borde B */
      const par0 = term === 'N' ? 0 : 1;
      const o = this.nearest(cx === undefined ? g.W / 2 : cx, cy === undefined ? g.H / 2 : cy, par0);
      /* vectores de enlace desde o y vectores de red de su subred */
      const ds = [0, 1, 2].map((q) => this.rel(o, g.nb[3 * o + q]));
      /* con a1 = δj − δi y a2 = δj − δk, el sitio o + δj (subred opuesta) tiene sus tres vecinos en {o, o+a1, o+a2}:
         el triángulo {p, q ≥ 0, p + q ≤ n − 1} contiene entonces n(n−1)/2 sitios interiores de la otra subred */
      const cands = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) { const k3 = 3 - i - j; cands.push([[ds[j][0] - ds[i][0], ds[j][1] - ds[i][1]], [ds[j][0] - ds[k3][0], ds[j][1] - ds[k3][1]]]); }
      for (const [a1, a2] of cands) {
        const det = a1[0] * a2[1] - a1[1] * a2[0];
        const big = [];
        for (let k = 0; k < this.N; k++) {
          if (g.par[k] !== par0) continue;
          const [dx, dy] = this.rel(o, k);
          const p = (dx * a2[1] - dy * a2[0]) / det, q = (-dx * a1[1] + dy * a1[0]) / det;
          const pr = Math.round(p), qr = Math.round(q);
          if (Math.abs(p - pr) > 1e-6 || Math.abs(q - qr) > 1e-6) continue;
          if (pr >= 0 && qr >= 0 && pr + qr <= n - 1) big.push(k);
        }
        const set = new Set(big);
        const small = [];
        for (let k = 0; k < this.N; k++) {
          if (g.par[k] === par0) continue;
          let all = true;
          for (let q = 0; q < 3; q++) if (!set.has(g.nb[3 * k + q])) { all = false; break; }
          if (all) small.push(k);
        }
        if (big.length + small.length === n * n) {
          for (const k of big.concat(small)) this.s[k] = 0;
          return big.concat(small);
        }
      }
      return null;
    }
    /* n monovacancias aleatorias de una especie (1 = V_N, 2 = V_B) separadas entre sí */
    monovacancies(count, sp) {
      let placed = 0, guard = 0;
      while (placed < count && guard++ < 100000) {
        const k = (this.rng() * this.N) | 0;
        if (this.s[k] !== sp) continue;
        let ok = true;
        for (let q = 0; q < 3 && ok; q++) { const m = this.g.nb[3 * k + q]; if (this.s[m] === 0) ok = false; for (let r = 0; r < 3; r++) if (this.s[this.g.nb[3 * m + r]] === 0) ok = false; }
        if (!ok) continue;
        this.s[k] = 0; placed++;
      }
      return placed;
    }
    /* Dominio circular de carbono de radio R (en unidades de d) */
    carbonDisk(R, cx, cy) {
      const g = this.g;
      const x0 = cx === undefined ? g.W / 2 : cx, y0 = cy === undefined ? g.H / 2 : cy;
      for (let k = 0; k < this.N; k++) { let dx = g.x[k] - x0, dy = g.y[k] - y0; dx -= g.W * Math.round(dx / g.W); dy -= g.H * Math.round(dy / g.H); if (dx * dx + dy * dy <= R * R && this.s[k] !== 0) this.s[k] = 3; }
    }
    /* Carbono aleatorio sustitucional en pares C–C (conserva la estequiometría B/N) */
    carbonRandom(frac) {
      const target = Math.round(frac * this.N / 2);
      let placed = 0, guard = 0;
      while (placed < target && guard++ < 200000) {
        const k = (this.rng() * this.N) | 0, m = this.g.nb[3 * k + ((this.rng() * 3) | 0)];
        if (this.s[k] === 3 || this.s[m] === 3 || this.s[k] === 0 || this.s[m] === 0) continue;
        this.s[k] = 3; this.s[m] = 3; placed++;
      }
    }
    /* Parámetro de Warren–Cowley del carbono: α_C = 1 − P(no-C | C)/(1 − x_C) */
    alphaC() {
      const c = this.bondCounts(), sp = this.species();
      const nat = sp.N + sp.B + sp.C, xC = nat ? sp.C / nat : 0;
      const cn = 2 * c.CC + c.CN + c.CB;
      return sp.C > 0 && xC < 1 && cn > 0 ? 1 - (c.CN + c.CB) / cn / (1 - xC) : null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
