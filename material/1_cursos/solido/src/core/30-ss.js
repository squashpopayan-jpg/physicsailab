/* ===================================================================
   30-ss.js — Biblioteca científica del curso (EM.ss), parte 1
   Constantes, números complejos, integrales de Fermi–Dirac; estructuras
   cristalinas, red recíproca y zonas de Brillouin; difracción de rayos X;
   enlace (Lennard-Jones, Madelung por Ewald, Born–Mayer); fonones y
   propiedades térmicas; electrones libres (Drude y Sommerfeld); bandas
   (Kronig–Penney, ecuación central, enlace fuerte, pseudopotencial
   empírico); dinámica semiclásica y electrones en campo magnético.
   Todo funciona en Node para las pruebas de tests/validar.js.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const req = (n) => (typeof require !== 'undefined' ? require(n) : null);
  const L = EM.lin || req('./29-lin.js');
  const DATA = EM.data || req('./29-data.js');
  const XRDF = EM.XRDF || req('./29-xrd.js');
  const SS = (EM.ss = EM.ss || {});
  const PI = Math.PI, TAU = 2 * PI;

  /* ================= Constantes (SI 2019 exactas y CODATA 2018) ================= */
  Object.assign(SS, {
    e: 1.602176634e-19, me: 9.1093837015e-31, h: 6.62607015e-34, hbar: 6.62607015e-34 / TAU,
    kB: 1.380649e-23, eps0: 8.8541878128e-12, mu0: 1.25663706212e-6, c: 299792458,
    NA: 6.02214076e23, u: 1.66053906660e-27, a0: 5.29177210903e-11, Ry: 13.605693122994,
    muB: 9.2740100783e-24, mn: 1.67492749804e-27
  });
  SS.R = SS.NA * SS.kB;
  SS.kBeV = SS.kB / SS.e; /* 8.617333×10⁻⁵ eV/K */
  SS.COUL = SS.e / (4 * PI * SS.eps0) * 1e10; /* e²/(4πε₀) en eV·Å = 14.3996 */
  SS.HB2M = (SS.hbar * SS.hbar) / (2 * SS.me) / SS.e * 1e18; /* ħ²/2m en eV·nm² = 0.0380998 */
  SS.PHI0 = SS.h / (2 * SS.e);
  SS.RK = SS.h / (SS.e * SS.e);
  SS.L0 = (PI * PI / 3) * Math.pow(SS.kB / SS.e, 2);
  SS.cm1meV = 0.1239841984; /* 1 cm⁻¹ en meV */
  SS.THzmeV = 4.135667696; /* 1 THz en meV */

  /* ================= Complejos ================= */
  const C = (SS.C = {
    of: (re, im = 0) => ({ re, im }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    div(a, b) { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; },
    abs: (a) => Math.hypot(a.re, a.im),
    sqrt(a) {
      const r = Math.hypot(a.re, a.im);
      let re = Math.sqrt(Math.max(0, (r + a.re) / 2)), im = Math.sqrt(Math.max(0, (r - a.re) / 2));
      if (a.im < 0) im = -im;
      return { re, im };
    },
    exp: (a) => { const m = Math.exp(a.re); return { re: m * Math.cos(a.im), im: m * Math.sin(a.im) }; },
    scale: (a, s) => ({ re: a.re * s, im: a.im * s })
  });

  /* ================= Estadística ================= */
  SS.fermi = (E, mu, kT) => (kT <= 0 ? (E < mu ? 1 : E > mu ? 0 : 0.5) : 1 / (1 + Math.exp((E - mu) / kT)));
  SS.bose = (E, kT) => 1 / Math.expm1(E / kT);
  /* Integral de Fermi–Dirac normalizada F_j(η) = (1/Γ(j+1)) ∫₀^∞ x^j/(1+e^{x−η}) dx, j > −1 */
  SS.fdInt = function (j, eta) {
    if (eta < -2) {
      /* serie Σ (−1)^{k+1} e^{kη}/k^{j+1} */
      let s = 0, z = Math.exp(eta), zk = z;
      for (let k = 1; k < 200; k++) { const t = zk / Math.pow(k, j + 1); s += k % 2 ? t : -t; if (t < 1e-17 * Math.abs(s)) break; zk *= z; }
      return s;
    }
    /* x = u², dx = 2u du: integrando 2 u^{2j+1}/(1+e^{u²−η}) suave para j ≥ −1/2 */
    const f = (u) => { const x = u * u - eta; const p = 2 * Math.pow(u, 2 * j + 1); return x > 0 ? (p * Math.exp(-x)) / (1 + Math.exp(-x)) : p / (1 + Math.exp(x)); };
    const u0 = Math.sqrt(Math.max(eta, 0)), u1 = Math.sqrt(Math.max(eta, 0) + 60);
    let s = 0;
    if (u0 > 0) s += L.gl(f, 0, u0, 48, Math.max(2, Math.ceil(u0)));
    s += L.gl(f, u0, u1, 48, 12);
    return s / L.gamma(j + 1);
  };
  /* Inversa de F_{1/2} (Joyce–Dixon como semilla y Newton) */
  SS.fdInvHalf = function (F) {
    if (F <= 0) return -Infinity;
    let eta = F < 5 ? Math.log(F) + 0.35355 * F - 4.95009e-3 * F * F + 1.48386e-4 * F * F * F : Math.pow(0.75 * Math.sqrt(PI) * F, 2 / 3) * 1.0;
    for (let i = 0; i < 60; i++) {
      const f = SS.fdInt(0.5, eta) - F, d = SS.fdInt(-0.5, eta);
      const step = f / d;
      eta -= step;
      if (Math.abs(step) < 1e-14 * Math.max(1, Math.abs(eta))) break;
    }
    return eta;
  };

  /* ================= Estructuras cristalinas ================= */
  const S3 = Math.sqrt(3);
  const FCC = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
  const shift = (list, d) => list.map((p) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]].map((x) => x - Math.floor(x + 1e-12)));
  SS.STRUCT_NAMES = {
    sc: 'Cúbica simple', bcc: 'Cúbica centrada en el cuerpo', fcc: 'Cúbica centrada en las caras', hcp: 'Hexagonal compacta',
    diamond: 'Diamante', zincblende: 'Blenda de zinc', NaCl: 'Cloruro de sodio', CsCl: 'Cloruro de cesio', fluorite: 'Fluorita',
    perovskite: 'Perovskita', wurtzite: 'Wurtzita', graphite: 'Grafito'
  };
  /* Celda convencional (filas = vectores, Å) y átomos en coordenadas fraccionarias.
     s: especie (0 = A, 1 = B, 2 = X) */
  SS.structure = function (name, a = 1, c, u) {
    const cub = [[a, 0, 0], [0, a, 0], [0, 0, a]];
    const hex = (cc) => [[a, 0, 0], [-a / 2, (a * S3) / 2, 0], [0, 0, cc]];
    const at = (list, s) => list.map((f) => ({ f, s }));
    let cell, atoms;
    switch (name) {
      case 'sc': cell = cub; atoms = at([[0, 0, 0]], 0); break;
      case 'bcc': cell = cub; atoms = at([[0, 0, 0], [0.5, 0.5, 0.5]], 0); break;
      case 'fcc': cell = cub; atoms = at(FCC, 0); break;
      case 'diamond': cell = cub; atoms = at(FCC, 0).concat(at(shift(FCC, [0.25, 0.25, 0.25]), 0)); break;
      case 'zincblende': cell = cub; atoms = at(FCC, 0).concat(at(shift(FCC, [0.25, 0.25, 0.25]), 1)); break;
      case 'NaCl': cell = cub; atoms = at(FCC, 0).concat(at(shift(FCC, [0.5, 0, 0]), 1)); break;
      case 'CsCl': cell = cub; atoms = at([[0, 0, 0]], 0).concat(at([[0.5, 0.5, 0.5]], 1)); break;
      case 'fluorite': cell = cub; atoms = at(FCC, 0).concat(at(shift(FCC, [0.25, 0.25, 0.25]), 1), at(shift(FCC, [0.75, 0.75, 0.75]), 1)); break;
      case 'perovskite': cell = cub; atoms = at([[0, 0, 0]], 0).concat(at([[0.5, 0.5, 0.5]], 1), at([[0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]], 2)); break;
      case 'hcp': cell = hex(c || a * Math.sqrt(8 / 3)); atoms = at([[1 / 3, 2 / 3, 0.25], [2 / 3, 1 / 3, 0.75]], 0); break;
      case 'wurtzite': {
        const uu = u === undefined ? 0.375 : u;
        cell = hex(c || a * Math.sqrt(8 / 3));
        atoms = at([[1 / 3, 2 / 3, 0], [2 / 3, 1 / 3, 0.5]], 0).concat(at([[1 / 3, 2 / 3, uu], [2 / 3, 1 / 3, 0.5 + uu]], 1));
        break;
      }
      case 'graphite': cell = hex(c || 2.725 * a); atoms = at([[0, 0, 0.25], [0, 0, 0.75], [1 / 3, 2 / 3, 0.25], [2 / 3, 1 / 3, 0.75]], 0); break;
      default: throw new Error('estructura desconocida: ' + name);
    }
    return { name, cell, atoms, a, c: cell[2][2] };
  };
  SS.frac2cart = (cell, f) => [0, 1, 2].map((j) => f[0] * cell[0][j] + f[1] * cell[1][j] + f[2] * cell[2][j]);
  SS.cellVolume = (cell) => Math.abs(L.det3(cell));
  /* Capas de vecinos alrededor del átomo i: [{d, n, species:{s: n}}] */
  SS.neighbors = function (st, i = 0, maxShells = 4, nImg = 3) {
    const p0 = SS.frac2cart(st.cell, st.atoms[i].f), ds = [], tiny = 1e-9 * Math.hypot(...st.cell[0]);
    for (let a = -nImg; a <= nImg; a++) for (let b = -nImg; b <= nImg; b++) for (let cc = -nImg; cc <= nImg; cc++) {
      for (const at of st.atoms) {
        const p = SS.frac2cart(st.cell, [at.f[0] + a, at.f[1] + b, at.f[2] + cc]);
        const d = Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]);
        if (d > tiny) ds.push([d, at.s]);
      }
    }
    ds.sort((x, y) => x[0] - y[0]);
    const shells = [];
    for (const [d, s] of ds) {
      const last = shells[shells.length - 1];
      if (last && Math.abs(d - last.d) < 1e-7 * d) { last.n++; last.species[s] = (last.species[s] || 0) + 1; }
      else { if (shells.length >= maxShells) break; shells.push({ d, n: 1, species: { [s]: 1 } }); }
    }
    return shells;
  };
  /* Fracción de empaquetamiento con esferas que se tocan a primeros vecinos (una sola especie) */
  SS.packing = function (st) {
    const r = SS.neighbors(st, 0, 1)[0].d / 2;
    return (st.atoms.length * (4 / 3) * PI * r * r * r) / SS.cellVolume(st.cell);
  };
  /* Densidad (g/cm³) de un cristal de la tabla de datos */
  SS.density = function (key) {
    const d = DATA.crystals[key];
    const st = SS.structure(d.s, d.a, d.c);
    const perFormula = { sc: 1, bcc: 2, fcc: 4, diamond: 8, hcp: 2, zincblende: 4, NaCl: 4, CsCl: 1, fluorite: 4, perovskite: 1, wurtzite: 2, graphite: 4 }[d.s];
    const V = SS.cellVolume(st.cell) * 1e-24;
    return (perFormula * d.M) / (SS.NA * V);
  };
  /* Vectores primitivos (filas, Å) */
  SS.primitive = function (type, a = 1, c) {
    switch (type) {
      case 'sc': return [[a, 0, 0], [0, a, 0], [0, 0, a]];
      case 'bcc': return [[-a / 2, a / 2, a / 2], [a / 2, -a / 2, a / 2], [a / 2, a / 2, -a / 2]];
      case 'fcc': return [[0, a / 2, a / 2], [a / 2, 0, a / 2], [a / 2, a / 2, 0]];
      case 'hex': return [[a, 0, 0], [-a / 2, (a * S3) / 2, 0], [0, 0, c || a * Math.sqrt(8 / 3)]];
      default: throw new Error('red desconocida: ' + type);
    }
  };

  /* ================= Red recíproca ================= */
  SS.recip = function (A) {
    const V = L.det3(A);
    const cr = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    return [cr(A[1], A[2]), cr(A[2], A[0]), cr(A[0], A[1])].map((b) => b.map((x) => (TAU * x) / V));
  };
  /* Distancia interplanar d_hkl = 2π/|G_hkl| a partir de la celda (filas) */
  SS.dhkl = function (cell, h, k, l) {
    const B = SS.recip(cell);
    const G = [0, 1, 2].map((j) => h * B[0][j] + k * B[1][j] + l * B[2][j]);
    return TAU / Math.hypot(G[0], G[1], G[2]);
  };
  /* Ángulo entre las normales de dos familias de planos */
  SS.planeAngle = function (cell, p1, p2) {
    const B = SS.recip(cell);
    const g = (p) => [0, 1, 2].map((j) => p[0] * B[0][j] + p[1] * B[1][j] + p[2] * B[2][j]);
    const a = g(p1), b = g(p2);
    return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(...a) * Math.hypot(...b)))));
  };
  /* Puntos de alta simetría en coordenadas cartesianas, unidades de 2π/a (hex: además c/a) */
  SS.special = function (type, ca = Math.sqrt(8 / 3)) {
    switch (type) {
      case 'sc': return { Γ: [0, 0, 0], X: [0, 0.5, 0], M: [0.5, 0.5, 0], R: [0.5, 0.5, 0.5] };
      case 'bcc': return { Γ: [0, 0, 0], H: [0, 1, 0], N: [0.5, 0.5, 0], P: [0.5, 0.5, 0.5] };
      case 'fcc': return { Γ: [0, 0, 0], X: [0, 1, 0], L: [0.5, 0.5, 0.5], W: [0.5, 1, 0], K: [0.75, 0.75, 0], U: [0.25, 1, 0.25] };
      case 'hex': return { Γ: [0, 0, 0], M: [0.5, 0.5 / S3, 0], K: [2 / 3, 0, 0], A: [0, 0, 0.5 / ca], L: [0.5, 0.5 / S3, 0.5 / ca], H: [2 / 3, 0, 0.5 / ca] };
      default: return { Γ: [0, 0, 0] };
    }
  };
  /* Recorrido por puntos especiales: devuelve [{k:[...], s, label}] con s la distancia acumulada */
  SS.kpath = function (pts, labels, n = 40) {
    const out = [];
    let s = 0;
    for (let i = 0; i < labels.length - 1; i++) {
      const a = pts[labels[i]], b = pts[labels[i + 1]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const m = Math.max(2, Math.round(n * len));
      for (let j = i === 0 ? 0 : 1; j <= m; j++) {
        const t = j / m;
        out.push({ k: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], s: s + len * t, label: j === 0 ? labels[i] : j === m ? labels[i + 1] : null });
      }
      s += len;
    }
    return out;
  };
  /* Índice de zona de Brillouin de k (2D o 3D): 1 + número de G con |k − G| < |k| */
  SS.zoneIndex = function (k, Gs) {
    const k2 = k[0] * k[0] + k[1] * k[1] + (k[2] || 0) * (k[2] || 0);
    let n = 1;
    for (const G of Gs) {
      const d0 = k[0] - G[0], d1 = k[1] - G[1], d2 = (k[2] || 0) - (G[2] || 0);
      if (d0 * d0 + d1 * d1 + d2 * d2 < k2 - 1e-12) n++;
    }
    return n;
  };
  /* Vectores G = m b1 + n b2 (2D) con |m|,|n| ≤ N */
  SS.gvecs2d = function (b1, b2, N = 4) {
    const out = [];
    for (let m = -N; m <= N; m++) for (let n = -N; n <= N; n++) if (m || n) out.push([m * b1[0] + n * b2[0], m * b1[1] + n * b2[1]]);
    return out;
  };
  /* Celda de Wigner–Seitz 2D de la red generada por a1, a2 (recorte de semiplanos) */
  SS.wignerSeitz2d = function (a1, a2) {
    const R = 4 * Math.max(Math.hypot(...a1), Math.hypot(...a2));
    let poly = [[-R, -R], [R, -R], [R, R], [-R, R]];
    for (const G of SS.gvecs2d(a1, a2, 3)) {
      const h = (G[0] * G[0] + G[1] * G[1]) / 2, out = [];
      for (let i = 0; i < poly.length; i++) {
        const P = poly[i], Q = poly[(i + 1) % poly.length];
        const fp = P[0] * G[0] + P[1] * G[1] - h, fq = Q[0] * G[0] + Q[1] * G[1] - h;
        if (fp <= 0) out.push(P);
        if (fp * fq < 0) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
      }
      poly = out;
    }
    return poly;
  };
  /* Zona de Brillouin 3D (celda de Wigner–Seitz de la red recíproca B, filas): {verts, faces} */
  SS.bz3d = function (B) {
    const Gs = [];
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
      if (!i && !j && !k) continue;
      Gs.push([0, 1, 2].map((m) => i * B[0][m] + j * B[1][m] + k * B[2][m]));
    }
    Gs.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
    const planes = Gs.slice(0, 26).map((G) => ({ n: G, h: (G[0] * G[0] + G[1] * G[1] + G[2] * G[2]) / 2 }));
    const ok = (p) => planes.every((q) => p[0] * q.n[0] + p[1] * q.n[1] + p[2] * q.n[2] <= q.h * (1 + 1e-9) + 1e-12);
    const verts = [];
    for (let a = 0; a < planes.length; a++) for (let b = a + 1; b < planes.length; b++) for (let c = b + 1; c < planes.length; c++) {
      const M = [planes[a].n, planes[b].n, planes[c].n];
      if (Math.abs(L.det3(M)) < 1e-12) continue;
      const p = L.solve(M, [planes[a].h, planes[b].h, planes[c].h]);
      if (ok(p) && !verts.some((v) => Math.hypot(v[0] - p[0], v[1] - p[1], v[2] - p[2]) < 1e-8)) verts.push(p);
    }
    const faces = [];
    for (const q of planes) {
      const idx = verts.map((v, i) => [v, i]).filter(([v]) => Math.abs(v[0] * q.n[0] + v[1] * q.n[1] + v[2] * q.n[2] - q.h) < 1e-7 * q.h).map((x) => x[1]);
      if (idx.length < 3) continue;
      const c = [0, 1, 2].map((m) => idx.reduce((s, i) => s + verts[i][m], 0) / idx.length);
      const nn = q.n.map((x) => x / Math.hypot(...q.n));
      const u0 = [verts[idx[0]][0] - c[0], verts[idx[0]][1] - c[1], verts[idx[0]][2] - c[2]];
      const v0 = [nn[1] * u0[2] - nn[2] * u0[1], nn[2] * u0[0] - nn[0] * u0[2], nn[0] * u0[1] - nn[1] * u0[0]];
      idx.sort((i, j) => {
        const ang = (k) => { const d = [verts[k][0] - c[0], verts[k][1] - c[1], verts[k][2] - c[2]]; return Math.atan2(d[0] * v0[0] + d[1] * v0[1] + d[2] * v0[2], d[0] * u0[0] + d[1] * u0[1] + d[2] * u0[2]); };
        return ang(i) - ang(j);
      });
      faces.push(idx);
    }
    return { verts, faces };
  };

  /* ================= Difracción de rayos X ================= */
  SS.lambdaCuKa = 1.54184;
  /* Factor de dispersión atómica f(s), s = sen θ/λ (Å⁻¹), con los coeficientes de pymatgen */
  SS.fAtom = function (el, s) {
    const p = XRDF[el];
    if (!p) throw new Error('sin factor atómico para ' + el);
    const s2 = s * s;
    let sum = 0;
    for (const [a, b] of p.c) sum += a * Math.exp(-b * s2);
    return p.Z - 41.78214 * s2 * sum;
  };
  /* Factor de estructura F_hkl; els: nombres de elemento por especie; B: factores de Debye–Waller (Å²) */
  SS.structureFactor = function (st, els, h, k, l, lam = SS.lambdaCuKa, B) {
    const d = SS.dhkl(st.cell, h, k, l), s = 1 / (2 * d);
    let re = 0, im = 0;
    for (const at of st.atoms) {
      let f = SS.fAtom(els[at.s], s);
      if (B && B[at.s]) f *= Math.exp(-B[at.s] * s * s);
      const ph = TAU * (h * at.f[0] + k * at.f[1] + l * at.f[2]);
      re += f * Math.cos(ph); im += f * Math.sin(ph);
    }
    return { re, im, d, s };
  };
  /* Factor de estructura con factores de forma iguales a 1 (reglas de extinción) */
  SS.geomFactor = function (st, h, k, l, fs) {
    let re = 0, im = 0;
    for (const at of st.atoms) {
      const f = fs ? fs[at.s] : 1, ph = TAU * (h * at.f[0] + k * at.f[1] + l * at.f[2]);
      re += f * Math.cos(ph); im += f * Math.sin(ph);
    }
    return { re, im, abs: Math.hypot(re, im) };
  };
  /* Patrón de polvo como pymatgen: [{tt (2θ °), I (máx = 100), d, hkl:[...], mult}] */
  SS.powder = function (st, els, lam = SS.lambdaCuKa, ttMax = 90, B) {
    const Bc = SS.recip(st.cell).map((r) => r.map((x) => x / TAU)); /* recíproca cristalográfica (1/Å) */
    const gmax = (2 * Math.sin(((ttMax / 2) * PI) / 180)) / lam;
    const N = [0, 1, 2].map((i) => Math.ceil(gmax * Math.hypot(...st.cell[i])) + 1);
    const bins = new Map();
    for (let h = -N[0]; h <= N[0]; h++) for (let k = -N[1]; k <= N[1]; k++) for (let l = -N[2]; l <= N[2]; l++) {
      if (!h && !k && !l) continue;
      const g = [0, 1, 2].map((j) => h * Bc[0][j] + k * Bc[1][j] + l * Bc[2][j]);
      const gm = Math.hypot(...g);
      if (gm > gmax) continue;
      const th = Math.asin(Math.min(1, (lam * gm) / 2)), s = gm / 2;
      let re = 0, im = 0;
      for (const at of st.atoms) {
        let f = SS.fAtom(els[at.s], s);
        if (B && B[at.s]) f *= Math.exp(-B[at.s] * s * s);
        const ph = TAU * (h * at.f[0] + k * at.f[1] + l * at.f[2]);
        re += f * Math.cos(ph); im += f * Math.sin(ph);
      }
      const c2 = Math.cos(2 * th), lp = (1 + c2 * c2) / (Math.sin(th) * Math.sin(th) * Math.cos(th));
      const I = (re * re + im * im) * lp, tt = (2 * th * 180) / PI;
      const key = Math.round(tt / 1e-5);
      const b = bins.get(key);
      if (b) { b.I += I; b.mult++; } else bins.set(key, { tt, I, d: 1 / gm, hkl: [h, k, l], mult: 1 });
    }
    const arr = Array.from(bins.values()).sort((a, b) => a.tt - b.tt);
    const mx = Math.max(...arr.map((p) => p.I));
    /* índices representativos: los no negativos más grandes en orden */
    for (const p of arr) { p.I = (100 * p.I) / mx; p.hkl = p.hkl.map(Math.abs).sort((x, y) => y - x); }
    return arr.filter((p) => p.I > 1e-3);
  };
  SS.bragg = (d, lam = SS.lambdaCuKa, n = 1) => { const s = (n * lam) / (2 * d); return s <= 1 ? 2 * Math.asin(s) : NaN; };

  /* ================= Enlace ================= */
  /* Sumas de red de Lennard-Jones A_n = Σ' (R₀/r_j)^n (R₀ = primeros vecinos) */
  SS.ljSums = function (name, Rc = 16) {
    const st = SS.structure(name, 1);
    const p0 = SS.frac2cart(st.cell, st.atoms[0].f);
    const r0 = SS.neighbors(st, 0, 1)[0].d;
    const V = SS.cellVolume(st.cell), rho = (st.atoms.length / V) * r0 * r0 * r0; /* puntos por r0³ */
    let A6 = 0, A12 = 0;
    const N = Math.ceil((Rc * r0) / Math.min(...st.cell.map((r) => Math.hypot(...r)))) + 2;
    for (let a = -N; a <= N; a++) for (let b = -N; b <= N; b++) for (let c = -N; c <= N; c++) for (const at of st.atoms) {
      const p = SS.frac2cart(st.cell, [at.f[0] + a, at.f[1] + b, at.f[2] + c]);
      const r = Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) / r0;
      if (r < 1e-9 || r > Rc) continue;
      const r6 = Math.pow(r, -6);
      A6 += r6; A12 += r6 * r6;
    }
    /* cola continua más allá de Rc */
    A6 += (4 * PI * rho) / (3 * Math.pow(Rc, 3));
    A12 += (4 * PI * rho) / (9 * Math.pow(Rc, 9));
    return { A6, A12, rho };
  };
  /* Cristal de Lennard-Jones: R₀/σ, energía por átomo (en ε) y módulo de compresibilidad (en ε/σ³) */
  SS.ljCrystal = function (name, Rc) {
    const { A6, A12, rho } = SS.ljSums(name, Rc);
    const x = Math.pow((2 * A12) / A6, 1 / 6);
    const U = -(A6 * A6) / (2 * A12); /* u = 2ε[A12 (σ/R)^12 − A6 (σ/R)^6] en el mínimo */
    /* B = (R²/9v) d²u/dR², v = R³/rho (volumen por átomo) */
    const R = x, d2u = 2 * (156 * A12 * Math.pow(R, -14) - 42 * A6 * Math.pow(R, -8));
    const v = (R * R * R) / rho;
    return { r0: x, U, B: (R * R * d2u) / (9 * v), A6, A12 };
  };
  SS.lj = (r, eps, sig) => 4 * eps * (Math.pow(sig / r, 12) - Math.pow(sig / r, 6));
  /* Energía electrostática de Ewald por celda en unidades de e²/(4πε₀Å) (posiciones en Å, cargas en e) */
  SS.ewald = function (cell, pos, q, eta) {
    const V = SS.cellVolume(cell);
    if (!eta) eta = Math.sqrt(PI) / Math.cbrt(V);
    const rc = 6 / eta, gc = 12 * eta;
    const lens = cell.map((r) => Math.hypot(...r));
    const N = lens.map((l) => Math.ceil(rc / l) + 1);
    let Er = 0;
    for (let i = 0; i < pos.length; i++) for (let j = 0; j < pos.length; j++) {
      for (let a = -N[0]; a <= N[0]; a++) for (let b = -N[1]; b <= N[1]; b++) for (let c = -N[2]; c <= N[2]; c++) {
        if (i === j && !a && !b && !c) continue;
        const d = [0, 1, 2].map((m) => pos[j][m] + a * cell[0][m] + b * cell[1][m] + c * cell[2][m] - pos[i][m]);
        const r = Math.hypot(...d);
        if (r > rc) continue;
        Er += (q[i] * q[j] * L.erfc(eta * r)) / r;
      }
    }
    Er *= 0.5;
    const B = SS.recip(cell), M = B.map((b) => Math.ceil(gc / Math.hypot(...b)) + 1);
    let Eg = 0;
    for (let a = -M[0]; a <= M[0]; a++) for (let b = -M[1]; b <= M[1]; b++) for (let c = -M[2]; c <= M[2]; c++) {
      if (!a && !b && !c) continue;
      const G = [0, 1, 2].map((m) => a * B[0][m] + b * B[1][m] + c * B[2][m]);
      const G2 = G[0] * G[0] + G[1] * G[1] + G[2] * G[2];
      if (G2 > gc * gc) continue;
      let sr = 0, si = 0;
      for (let j = 0; j < pos.length; j++) { const ph = G[0] * pos[j][0] + G[1] * pos[j][1] + G[2] * pos[j][2]; sr += q[j] * Math.cos(ph); si += q[j] * Math.sin(ph); }
      Eg += (Math.exp(-G2 / (4 * eta * eta)) / G2) * (sr * sr + si * si);
    }
    Eg *= (2 * PI) / V;
    let Es = 0;
    for (const qi of q) Es += qi * qi;
    Es *= -eta / Math.sqrt(PI);
    return Er + Eg + Es;
  };
  /* Constante de Madelung (referida a la distancia entre primeros vecinos de distinto signo).
     Devuelve {alpha (por par de iones, cargas unitarias), perFormula (con las cargas reales)} */
  SS.madelung = function (name, ca, u) {
    const st = SS.structure(name, 1, ca, u);
    const charges = { NaCl: [1, -1], CsCl: [1, -1], zincblende: [1, -1], wurtzite: [1, -1], fluorite: [2, -1] }[name];
    const pos = st.atoms.map((a) => SS.frac2cart(st.cell, a.f)), q = st.atoms.map((a) => charges[a.s]);
    const E = SS.ewald(st.cell, pos, q);
    let rnn = Infinity;
    const iA = st.atoms.findIndex((a) => a.s === 0);
    for (const sh of SS.neighbors(st, iA, 3)) if (sh.species[1]) { rnn = sh.d; break; }
    const nf = st.atoms.filter((a) => a.s === 0).length;
    const perFormula = (-E * rnn) / nf;
    return { alpha: perFormula / (charges[0] * -charges[1]), perFormula, rnn, E };
  };
  /* Cristal iónico de Born–Mayer (por par): U(R) = −α e²/(4πε₀R) + zλ e^{−R/ρ}; U₀ en eV */
  SS.bornMayerU0 = (alpha, R0, rho) => -((alpha * SS.COUL) / R0) * (1 - rho / R0);

  /* ================= Fonones ================= */
  SS.chain1 = (k, K, m, a = 1) => 2 * Math.sqrt(K / m) * Math.abs(Math.sin((k * a) / 2));
  /* Cadena diatómica con masas m1, m2 y resortes K1 (dentro de la celda), K2 (entre celdas): [ω−, ω+] */
  SS.chain2 = function (k, K1, K2, m1, m2, a = 1) {
    const s = (K1 + K2) * (1 / m1 + 1 / m2) / 2;
    const r = Math.sqrt(Math.max(0, s * s - (4 * (K1 * K2) * Math.pow(Math.sin((k * a) / 2), 2)) / (m1 * m2)));
    return [Math.sqrt(Math.max(0, s - r)), Math.sqrt(s + r)];
  };
  /* Cadena monoatómica con constantes K_p hasta el vecino p */
  SS.chainN = function (k, Ks, m, a = 1) {
    let w2 = 0;
    Ks.forEach((K, i) => { w2 += (2 * K * (1 - Math.cos((i + 1) * k * a))) / m; });
    return Math.sqrt(Math.max(0, w2));
  };
  /* Matriz dinámica de fuerzas centrales: neigh = [{d:[x,y,z], C}], masa m → 3 frecuencias ω (ascendentes) */
  SS.dynCentral = function (neigh, m, k) {
    const D = new Float64Array(9);
    for (const nb of neigh) {
      const d = nb.d, r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
      const f = (nb.C * (1 - Math.cos(k[0] * d[0] + k[1] * d[1] + k[2] * d[2]))) / (m * r2);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) D[a * 3 + b] += f * d[a] * d[b];
    }
    return L.symEig(D, 3).val.map((w2) => Math.sqrt(Math.max(0, w2)));
  };
  /* Vecinos de una red cúbica de constante a: shell 1 (y 2) con constantes C1, C2 */
  SS.cubicNeighbors = function (type, a = 1, C1 = 1, C2 = 0) {
    const st = SS.structure(type, a);
    const p0 = SS.frac2cart(st.cell, st.atoms[0].f), out = [];
    const shells = SS.neighbors(st, 0, 2).map((s) => s.d);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) for (const at of st.atoms) {
      const p = SS.frac2cart(st.cell, [at.f[0] + i, at.f[1] + j, at.f[2] + k]);
      const d = [p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]], r = Math.hypot(...d);
      if (Math.abs(r - shells[0]) < 1e-9 * shells[0]) out.push({ d, C: C1 });
      else if (C2 && Math.abs(r - shells[1]) < 1e-9 * shells[1]) out.push({ d, C: C2 });
    }
    return out;
  };
  /* Densidad de estados por histograma en una malla uniforme de la celda recíproca primitiva */
  SS.dosHistogram = function (freqFn, B, nk, nb, wmax) {
    const h = new Float64Array(nb);
    let cnt = 0;
    for (let i = 0; i < nk; i++) for (let j = 0; j < nk; j++) for (let l = 0; l < nk; l++) {
      const f = [(i + 0.5) / nk, (j + 0.5) / nk, (l + 0.5) / nk];
      const k = [0, 1, 2].map((m) => f[0] * B[0][m] + f[1] * B[1][m] + f[2] * B[2][m]);
      for (const w of freqFn(k)) { const b = Math.floor((w / wmax) * nb); if (b >= 0 && b < nb) h[b]++; cnt++; }
    }
    const dw = wmax / nb;
    for (let b = 0; b < nb; b++) h[b] /= cnt * dw;
    return h; /* normalizada a 1 por modo */
  };

  /* ================= Calor específico ================= */
  /* Integral de Debye ∫₀^x t⁴eᵗ/(eᵗ−1)² dt */
  SS.debyeInt = function (x) {
    if (x <= 0) return 0;
    const f = (t) => (t < 1e-6 ? t * t : (Math.pow(t, 4) * Math.exp(-t)) / Math.pow(-Math.expm1(-t), 2));
    const xm = Math.min(x, 60);
    return L.gl(f, 0, xm, 48, Math.max(2, Math.ceil(xm / 3)));
  };
  /* Calor específico molar de Debye (J mol⁻¹ K⁻¹), r átomos por fórmula */
  SS.debyeC = (T, th, r = 1) => (T <= 0 ? 0 : 9 * r * SS.R * Math.pow(T / th, 3) * SS.debyeInt(th / T));
  SS.einsteinC = (T, th, r = 1) => { if (T <= 0) return 0; const x = th / T; return x > 700 ? 0 : (3 * r * SS.R * x * x * Math.exp(-x)) / Math.pow(-Math.expm1(-x), 2); };
  /* Energía térmica de Debye por mol (sin punto cero) */
  SS.debyeU = function (T, th, r = 1) {
    if (T <= 0) return 0;
    const x = Math.min(th / T, 60);
    const I = L.gl((t) => (t < 1e-8 ? t * t : (t * t * t) / Math.expm1(t)), 0, x, 48, Math.max(2, Math.ceil(x / 3)));
    return 9 * r * SS.R * T * Math.pow(T / th, 3) * I;
  };
  SS.debyeT3 = (T, th, r = 1) => ((12 * Math.pow(PI, 4)) / 5) * r * SS.R * Math.pow(T / th, 3);
  /* θ_D que reproduce un calor específico medido C a temperatura T */
  SS.debyeThetaFrom = (T, Cv, r = 1) => L.brent((th) => SS.debyeC(T, th, r) - Cv, 1e-3 * T, 1e3 * T);
  /* θ_D a partir de las velocidades del sonido y la densidad de átomos n (m⁻³) */
  SS.debyeFromSound = function (vL, vT, n) {
    const vm = Math.cbrt(3 / (1 / Math.pow(vL, 3) + 2 / Math.pow(vT, 3)));
    return { vm, theta: ((SS.hbar * vm) / SS.kB) * Math.cbrt(6 * PI * PI * n) };
  };
  SS.atomDensity = function (key) {
    const d = DATA.crystals[key];
    const per = { fcc: 4, bcc: 2, diamond: 8, hcp: 2 }[d.s];
    const st = SS.structure(d.s, d.a, d.c);
    return per / (SS.cellVolume(st.cell) * 1e-30);
  };

  /* ================= Anarmonicidad ================= */
  SS.morse = (x, D, a) => D * Math.pow(1 - Math.exp(-a * x), 2);
  /* Desplazamiento térmico medio clásico ⟨x⟩ en un potencial V(x) (kT en las mismas unidades que V) */
  SS.meanX = function (V, kT, xmin, xmax) {
    const w = (x) => Math.exp(-V(x) / kT);
    const n = 64, m = 40;
    const Z = L.gl(w, xmin, xmax, n, m), X = L.gl((x) => x * w(x), xmin, xmax, n, m);
    return X / Z;
  };
  /* Recorrido libre medio de fonones con Umklapp: ℓ ∝ exp(θ_D/(bT)) */
  SS.kappaKinetic = (Cvol, v, ell) => (Cvol * v * ell) / 3;

  /* ================= Drude ================= */
  SS.drudeSigma = (n, tau, m = SS.me) => (n * SS.e * SS.e * tau) / m;
  SS.drudeTau = (rho, n, m = SS.me) => m / (rho * n * SS.e * SS.e);
  SS.plasmaW = (n, m = SS.me, epsInf = 1) => Math.sqrt((n * SS.e * SS.e) / (SS.eps0 * m * epsInf));
  /* ε(ω) de Drude con fondo ε∞ */
  SS.drudeEps = function (w, wp, tau, epsInf = 1) {
    const g = 1 / tau;
    const d = w * w + g * g;
    return { re: epsInf - (wp * wp) / d, im: (wp * wp * g) / (w * d) };
  };
  /* Reflectividad a incidencia normal desde ε complejo */
  SS.reflect = function (eps) {
    const n = C.sqrt(eps);
    const r = C.div(C.sub(C.of(1), n), C.add(C.of(1), n));
    return r.re * r.re + r.im * r.im;
  };
  SS.hallR = (n, q = -SS.e) => 1 / (n * q);

  /* ================= Gas de Fermi (Sommerfeld) ================= */
  SS.fermiGas = function (n, m = SS.me) {
    const kF = Math.cbrt(3 * PI * PI * n), EF = (SS.hbar * SS.hbar * kF * kF) / (2 * m);
    const vF = (SS.hbar * kF) / m, TF = EF / SS.kB;
    const rs = Math.cbrt(3 / (4 * PI * n));
    return { kF, EF, EFeV: EF / SS.e, vF, TF, rs, rsa0: rs / SS.a0, gEF: (3 * n) / (2 * EF), B: (2 / 3) * n * EF };
  };
  /* n (m⁻³) a partir de la valencia y el cristal de la tabla */
  SS.electronDensity = (key, Z) => Z * SS.atomDensity(key);
  /* Densidad de estados 3D por volumen (m⁻³ J⁻¹), dos espines */
  SS.g3d = (E, m = SS.me) => (E <= 0 ? 0 : (1 / (2 * PI * PI)) * Math.pow((2 * m) / (SS.hbar * SS.hbar), 1.5) * Math.sqrt(E));
  SS.Nc = (T, m = SS.me) => 2 * Math.pow((m * SS.kB * T) / (TAU * SS.hbar * SS.hbar), 1.5);
  /* Potencial químico del gas de electrones libres a temperatura T (J) */
  SS.muFree = function (n, T, m = SS.me) {
    if (T <= 0) return SS.fermiGas(n, m).EF;
    return SS.fdInvHalf(n / SS.Nc(T, m)) * SS.kB * T;
  };
  /* Energía interna por volumen (J/m³) */
  SS.uFree = function (n, T, m = SS.me) {
    if (T <= 0) return 0.6 * n * SS.fermiGas(n, m).EF;
    const eta = SS.muFree(n, T, m) / (SS.kB * T);
    return 1.5 * SS.kB * T * SS.Nc(T, m) * SS.fdInt(1.5, eta);
  };
  /* Calor específico electrónico por volumen (derivada numérica) */
  SS.cFree = function (n, T, m = SS.me) {
    const h = Math.max(1e-3, 1e-4 * T);
    return (SS.uFree(n, T + h, m) - SS.uFree(n, T - h, m)) / (2 * h);
  };
  /* γ molar del electrón libre (J mol⁻¹ K⁻²) con Z electrones por átomo y T_F */
  SS.gammaFree = (Z, TF) => ((PI * PI) / 2) * ((Z * SS.R) / TF);
  /* Richardson–Dushman */
  SS.richardsonA = (4 * PI * SS.me * SS.e * SS.kB * SS.kB) / Math.pow(SS.h, 3);
  SS.richardson = (T, W) => SS.richardsonA * T * T * Math.exp(-W / (SS.kBeV * T));

  /* ================= Kronig–Penney ================= */
  /* Pozo de ancho a (V = 0) y barrera de ancho b (altura V0), E en eV, longitudes en nm, masa relativa mr.
     Devuelve el lado derecho f(E) de cos(k(a+b)) = f(E) */
  SS.kpF = function (E, V0, a, b, mr = 1) {
    const c2 = SS.HB2M / mr;
    if (E <= 0) {
      const q = Math.sqrt(-E / c2), be = Math.sqrt((V0 - E) / c2);
      return Math.cosh(q * a) * Math.cosh(be * b) + ((q * q + be * be) / (2 * q * be)) * Math.sinh(q * a) * Math.sinh(be * b);
    }
    const al = Math.sqrt(E / c2);
    if (Math.abs(E - V0) < 1e-12) return Math.cos(al * a) - (al * b / 2) * Math.sin(al * a);
    if (E < V0) {
      const be = Math.sqrt((V0 - E) / c2);
      return Math.cos(al * a) * Math.cosh(be * b) + ((be * be - al * al) / (2 * al * be)) * Math.sin(al * a) * Math.sinh(be * b);
    }
    const ga = Math.sqrt((E - V0) / c2);
    return Math.cos(al * a) * Math.cos(ga * b) - ((al * al + ga * ga) / (2 * al * ga)) * Math.sin(al * a) * Math.sin(ga * b);
  };
  /* Bandas permitidas [Emin, Emax] hasta Emax */
  SS.kpEdges = function (V0, a, b, Emax, mr = 1, n = 4000) {
    const g1 = (E) => SS.kpF(E, V0, a, b, mr) - 1, g2 = (E) => SS.kpF(E, V0, a, b, mr) + 1;
    return L.roots(g1, 1e-9, Emax, n).concat(L.roots(g2, 1e-9, Emax, n)).sort((x, y) => x - y);
  };
  SS.kpBands = function (V0, a, b, Emax, mr = 1, n = 4000) {
    const r = SS.kpEdges(V0, a, b, Emax, mr, n);
    const bands = [];
    for (let i = 0; i + 1 < r.length; i += 2) bands.push([r[i], r[i + 1]]);
    return bands;
  };
  /* Energías E(k) por bisección dentro de cada banda */
  SS.kpE = function (k, V0, a, b, bands, mr = 1) {
    const ck = Math.cos(k * (a + b));
    return bands.map(([e0, e1]) => {
      const g = (E) => SS.kpF(E, V0, a, b, mr) - ck, g0 = g(e0), g1 = g(e1);
      if (g0 * g1 > 0) return Math.abs(g0) < Math.abs(g1) ? e0 : e1;
      return L.brent(g, e0, e1, 1e-13);
    });
  };
  /* Hamiltoniano de diferencias finitas de una celda con condición de Bloch; devuelve autovalores (eV) */
  SS.kpFD = function (k, V0, a, b, mr = 1, N = 200, nev = 6) {
    const d = (a + b) / N, t = SS.HB2M / mr / (d * d);
    const Re = new Float64Array(N * N), Im = new Float64Array(N * N);
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) * d;
      Re[i * N + i] = 2 * t + (x > a ? V0 : 0);
      const j = (i + 1) % N;
      if (j > i) { Re[i * N + j] = -t; Re[j * N + i] = -t; }
    }
    /* enlace periódico con fase e^{ik(a+b)} */
    const ph = k * (a + b);
    Re[(N - 1) * N] += -t * Math.cos(ph); Im[(N - 1) * N] += -t * Math.sin(ph);
    Re[N - 1] += -t * Math.cos(ph); Im[N - 1] += t * Math.sin(ph);
    const real = Math.abs(Math.sin(ph)) < 1e-14;
    const val = real ? L.symEig(Re, N).val : L.hermEig(Re, Im, N).val;
    return val.slice(0, nev);
  };

  /* ================= Ecuación central en 1D ================= */
  /* U(x) = Σ_{n≥1} 2 U_n cos(2πnx/a); devuelve autovalores (unidades: ħ²/2m = 1, a = 1 → E en (2π/a)²) */
  SS.central1d = function (k, U, nG = 7) {
    const N = 2 * nG + 1, H = new Float64Array(N * N);
    for (let i = 0; i < N; i++) {
      const Gi = i - nG;
      H[i * N + i] = Math.pow(k / TAU + Gi, 2);
      for (let j = 0; j < N; j++) {
        const dn = Math.abs(i - j);
        if (dn > 0 && dn <= U.length) H[i * N + j] = U[dn - 1];
      }
    }
    return L.symEig(H, N).val;
  };
  /* Red vacía fcc: energías ħ²|k+G|²/2m en unidades de (ħ²/2m)(2π/a)², k en 2π/a */
  SS.emptyFcc = function (k, nmax = 2) {
    const out = [];
    for (let h = -nmax; h <= nmax; h++) for (let kk = -nmax; kk <= nmax; kk++) for (let l = -nmax; l <= nmax; l++) {
      const allEven = h % 2 === 0 && kk % 2 === 0 && l % 2 === 0, allOdd = Math.abs(h % 2) === 1 && Math.abs(kk % 2) === 1 && Math.abs(l % 2) === 1;
      if (!allEven && !allOdd) continue;
      out.push(Math.pow(k[0] + h, 2) + Math.pow(k[1] + kk, 2) + Math.pow(k[2] + l, 2));
    }
    return out.sort((a, b) => a - b);
  };

  /* ================= Enlace fuerte ================= */
  SS.tb1d = (k, t = 1, eps = 0, a = 1) => eps - 2 * t * Math.cos(k * a);
  SS.tbSquare = (kx, ky, t = 1, tp = 0) => -2 * t * (Math.cos(kx) + Math.cos(ky)) - 4 * tp * Math.cos(kx) * Math.cos(ky);
  SS.tbCubic = (k, t = 1) => -2 * t * (Math.cos(k[0]) + Math.cos(k[1]) + Math.cos(k[2]));
  SS.tbFcc = (k, t = 1) => -4 * t * (Math.cos(k[0] / 2) * Math.cos(k[1] / 2) + Math.cos(k[1] / 2) * Math.cos(k[2] / 2) + Math.cos(k[2] / 2) * Math.cos(k[0] / 2));
  /* DOS exacta de la red cuadrada por sitio y espín (t = 1): g(E) = K(1 − E²/16)/(2π² t) */
  SS.dosSquare = (E, t = 1) => (Math.abs(E) >= 4 * t ? 0 : L.ellipK(1 - (E * E) / (16 * t * t)) / (2 * PI * PI * t));
  /* Grafeno: a = distancia C–C = 1; devuelve |f(k)| (E = ±t|f|) */
  SS.grapheneF = function (kx, ky) {
    /* vecinos de la subred A: δ1 = (0,1), δ2 = (√3/2, −1/2), δ3 = (−√3/2, −1/2) */
    const re = Math.cos(ky) + 2 * Math.cos((S3 / 2) * kx) * Math.cos(ky / 2);
    const im = Math.sin(ky) - 2 * Math.cos((S3 / 2) * kx) * Math.sin(ky / 2);
    return Math.hypot(re, im);
  };
  /* Modelo SSH: espectro de una cadena abierta de Nc celdas con saltos v (intra) y w (inter) */
  SS.sshOpen = function (Nc, v, w) {
    const n = 2 * Nc, a = new Float64Array(n), b = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) b[i] = i % 2 === 0 ? -v : -w;
    return L.triEig(a, b);
  };
  SS.sshBulk = (k, v, w) => Math.sqrt(v * v + w * w + 2 * v * w * Math.cos(k));

  /* ================= Pseudopotencial empírico (Cohen–Bergstresser) ================= */
  const epmCache = new Map();
  SS.epmGlist = function (nmax = 5) {
    if (epmCache.has(nmax)) return epmCache.get(nmax);
    const out = [];
    for (let h = -nmax; h <= nmax; h++) for (let k = -nmax; k <= nmax; k++) for (let l = -nmax; l <= nmax; l++) {
      const pe = [h, k, l].every((x) => x % 2 === 0), po = [h, k, l].every((x) => Math.abs(x % 2) === 1);
      if (pe || po) out.push([h, k, l]);
    }
    epmCache.set(nmax, out);
    return out;
  };
  /* Autovalores (eV) en k (unidades 2π/a), corte de energía cinética ecut en (2π/a)² */
  SS.epm = function (mat, k, ecut = 14, nbands = 8) {
    const p = typeof mat === 'string' ? DATA.epm[mat] : mat;
    const ab = p.a / (SS.a0 * 1e10), kin = Math.pow(TAU / ab, 2); /* Ry por unidad de (2π/a)² */
    const Gs = SS.epmGlist(5).filter((G) => Math.pow(k[0] + G[0], 2) + Math.pow(k[1] + G[1], 2) + Math.pow(k[2] + G[2], 2) <= ecut);
    const n = Gs.length, Re = new Float64Array(n * n), Im = new Float64Array(n * n);
    const anti = p.A.some((x) => x !== 0);
    for (let i = 0; i < n; i++) {
      const Gi = Gs[i];
      Re[i * n + i] = kin * (Math.pow(k[0] + Gi[0], 2) + Math.pow(k[1] + Gi[1], 2) + Math.pow(k[2] + Gi[2], 2));
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = [Gi[0] - Gs[j][0], Gi[1] - Gs[j][1], Gi[2] - Gs[j][2]];
        const g2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
        /* simétricos en |G|² = 3, 8, 11; antisimétricos en |G|² = 3, 4, 11 */
        const iS = g2 === 3 ? 0 : g2 === 8 ? 1 : g2 === 11 ? 2 : -1;
        const iA = g2 === 3 ? 0 : g2 === 4 ? 1 : g2 === 11 ? 2 : -1;
        if (iS < 0 && iA < 0) continue;
        const ph = (PI / 4) * (d[0] + d[1] + d[2]);
        Re[i * n + j] = iS >= 0 ? p.S[iS] * Math.cos(ph) : 0;
        Im[i * n + j] = iA >= 0 ? p.A[iA] * Math.sin(ph) : 0;
      }
    }
    const val = anti ? L.hermEig(Re, Im, n).val : L.symEig(Re, n).val;
    return { E: val.slice(0, nbands).map((x) => x * SS.Ry), n };
  };

  /* ================= Dinámica semiclásica ================= */
  /* Paso de Crank–Nicolson para la cadena de enlace fuerte (ħ = 1, t = 1): H = −Σ(c†c + h.c.) + V_i */
  SS.cnStep = function (re, im, V, dt) {
    const n = re.length, h = dt / 2;
    /* (1 + iHh) ψ' = (1 − iHh) ψ ; H_ii = V_i, H_i,i±1 = −1 */
    const rr = new Float64Array(n), ri = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      /* (Hψ)_i */
      let hr = V[i] * re[i], hi = V[i] * im[i];
      if (i > 0) { hr -= re[i - 1]; hi -= im[i - 1]; }
      if (i < n - 1) { hr -= re[i + 1]; hi -= im[i + 1]; }
      /* (1 − iHh)ψ = ψ − i h Hψ */
      rr[i] = re[i] + h * hi; ri[i] = im[i] - h * hr;
    }
    /* tridiagonal compleja: diag 1 + i h V_i, fuera de la diagonal −i h */
    const cr = new Float64Array(n), ci = new Float64Array(n), xr = new Float64Array(n), xi = new Float64Array(n);
    const offR = 0, offI = -h;
    let dr = 1, di = h * V[0];
    let den = dr * dr + di * di;
    cr[0] = (offR * dr + offI * di) / den; ci[0] = (offI * dr - offR * di) / den;
    xr[0] = (rr[0] * dr + ri[0] * di) / den; xi[0] = (ri[0] * dr - rr[0] * di) / den;
    for (let i = 1; i < n; i++) {
      /* den = d_i − l_i c_{i−1} con l = off */
      const lcR = offR * cr[i - 1] - offI * ci[i - 1], lcI = offR * ci[i - 1] + offI * cr[i - 1];
      dr = 1 - lcR; di = h * V[i] - lcI;
      den = dr * dr + di * di;
      cr[i] = (offR * dr + offI * di) / den; ci[i] = (offI * dr - offR * di) / den;
      const lxR = offR * xr[i - 1] - offI * xi[i - 1], lxI = offR * xi[i - 1] + offI * xr[i - 1];
      const nr = rr[i] - lxR, ni = ri[i] - lxI;
      xr[i] = (nr * dr + ni * di) / den; xi[i] = (ni * dr - nr * di) / den;
    }
    for (let i = n - 2; i >= 0; i--) {
      const pr = cr[i] * xr[i + 1] - ci[i] * xi[i + 1], pi = cr[i] * xi[i + 1] + ci[i] * xr[i + 1];
      xr[i] -= pr; xi[i] -= pi;
    }
    re.set(xr); im.set(xi);
  };
  /* Paquete gaussiano en la cadena centrado en x0 con número de onda k0 y anchura s */
  SS.packet = function (n, x0, k0, s) {
    const re = new Float64Array(n), im = new Float64Array(n);
    let nn = 0;
    for (let i = 0; i < n; i++) { const g = Math.exp(-Math.pow((i - x0) / s, 2) / 2); re[i] = g * Math.cos(k0 * i); im[i] = g * Math.sin(k0 * i); nn += g * g; }
    nn = Math.sqrt(nn);
    for (let i = 0; i < n; i++) { re[i] /= nn; im[i] /= nn; }
    return { re, im };
  };
  SS.meanPos = function (re, im) { let s = 0, w = 0; for (let i = 0; i < re.length; i++) { const p = re[i] * re[i] + im[i] * im[i]; s += i * p; w += p; } return s / w; };
  /* Masa efectiva de la banda de enlace fuerte en k (unidades ħ = a = 1): m* = 1/(2t cos ka) */
  SS.mEffTB = (k, t = 1) => 1 / (2 * t * Math.cos(k));
  SS.blochPeriod = (Efield, a) => SS.h / (SS.e * Efield * a);

  /* ================= Campo magnético ================= */
  SS.cyclotron = (B, mr = 1) => (SS.e * B) / (mr * SS.me);
  SS.landauDeg = (B) => (SS.e * B) / SS.h; /* estados por m² y por espín */
  SS.fillingFactor = (n2d, B) => (n2d * SS.h) / (SS.e * B);
  /* Período de de Haas–van Alphen Δ(1/B) = 2πe/(ħ A) con A el área extrema (m⁻²) */
  SS.dhvaPeriod = (A) => (TAU * SS.e) / (SS.hbar * A);
  /* Ecuación de Harper (mariposa de Hofstadter): flujo α = p/q, hoja de saltos t = 1 */
  SS.harper = function (p, q, kx = 0, ky = 0) {
    const n = q;
    if (n === 1) return [2 * Math.cos(kx) + 2 * Math.cos(ky)];
    const Re = new Float64Array(n * n), Im = new Float64Array(n * n);
    for (let m = 0; m < n; m++) {
      Re[m * n + m] = 2 * Math.cos(ky + (TAU * p * m) / q);
      const j = (m + 1) % n;
      if (n === 2) { Re[m * n + j] += 1; continue; }
      if (j > m) { Re[m * n + j] += 1; Re[j * n + m] += 1; }
    }
    if (n === 2) {
      /* para q = 2 los dos enlaces unen los mismos sitios: 1 + e^{2ikx} */
      Re[1] = 1 + Math.cos(2 * kx); Im[1] = Math.sin(2 * kx); Re[2] = Re[1]; Im[2] = -Im[1];
    } else {
      Re[(n - 1) * n] += Math.cos(q * kx); Im[(n - 1) * n] += Math.sin(q * kx);
      Re[n - 1] += Math.cos(q * kx); Im[n - 1] -= Math.sin(q * kx);
    }
    const real = Im.every((x) => Math.abs(x) < 1e-15);
    return real ? L.symEig(Re, n).val : L.hermEig(Re, Im, n).val;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SS;
})();
