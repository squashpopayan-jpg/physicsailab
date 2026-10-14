/* ===================================================================
   30-mat.js — Biblioteca científica del curso (EM.mat)
   Funciones puras, sin DOM: se validan en Node con tests/validar.js
   contra referencias calculadas con SciPy (tests/referencias.py) y
   contra datos tabulados de la literatura.
   Unidades SI salvo que se indique (T en K, energías en J o eV).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const kB = 1.380649e-23, eV = 1.602176634e-19, NA = 6.02214076e23, R = 8.314462618, h = 6.62607015e-34, c0 = 299792458;
  const kBeV = kB / eV; // 8.617e-5 eV/K
  const MAT = (EM.mat = { kB, eV, NA, R, h, c: c0, kBeV });

  /* ---------------- Funciones especiales ---------------- */
  /* erf con precisión ~1e-15 (serie para |x|<3, fracción continua de erfc) */
  MAT.erf = function (x) {
    if (x < 0) return -MAT.erf(-x);
    if (x < 3) {
      let sum = x, term = x, x2 = x * x;
      for (let n = 1; n < 200; n++) {
        term *= -x2 / n;
        const add = term / (2 * n + 1);
        sum += add;
        if (Math.abs(add) < 1e-17 * Math.abs(sum)) break;
      }
      return (2 / Math.sqrt(Math.PI)) * sum;
    }
    return 1 - MAT.erfc(x);
  };
  MAT.erfc = function (x) {
    if (x < 3) return 1 - MAT.erf(x);
    /* fracción continua de Lentz */
    let f = x, C = x, D = 0;
    const tiny = 1e-300;
    for (let n = 1; n < 300; n++) {
      const an = n / 2;
      D = x + an * D; if (Math.abs(D) < tiny) D = tiny; D = 1 / D;
      C = x + an / C; if (Math.abs(C) < tiny) C = tiny;
      const d = C * D; f *= d;
      if (Math.abs(d - 1) < 1e-16) break;
    }
    return Math.exp(-x * x) / (f * Math.sqrt(Math.PI));
  };
  MAT.erfinv = function (y) {
    if (y <= -1) return -Infinity;
    if (y >= 1) return Infinity;
    let a = -6, b = 6;
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (MAT.erf(m) < y) a = m; else b = m; }
    return (a + b) / 2;
  };
  MAT.bisect = function (f, a, b, tol = 1e-13, it = 300) {
    let fa = f(a);
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fm === 0 || (b - a) / 2 < tol) return m;
      if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
    }
    return 0.5 * (a + b);
  };
  /* Simpson compuesto */
  MAT.integrate = function (f, a, b, n = 400) {
    if (n % 2) n++;
    const hh = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * hh);
    return (s * hh) / 3;
  };
  MAT.gamma = function (z) {
    /* Lanczos g=7 */
    const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * MAT.gamma(1 - z));
    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  };

  /* ---------------- Enlace: potenciales interatómicos ---------------- */
  /* Lennard-Jones: U = 4ε[(σ/r)^12 − (σ/r)^6] */
  MAT.lj = {
    U: (r, eps, sig) => 4 * eps * (Math.pow(sig / r, 12) - Math.pow(sig / r, 6)),
    F: (r, eps, sig) => (24 * eps / r) * (2 * Math.pow(sig / r, 12) - Math.pow(sig / r, 6)),
    r0: (sig) => Math.pow(2, 1 / 6) * sig,
    k: (eps, sig) => (72 * eps) / Math.pow(Math.pow(2, 1 / 6) * sig, 2) // U''(r0)
  };
  /* Morse: U = D[(1−e^{−a(r−r0)})² − 1] */
  MAT.morse = {
    U: (r, D, a, r0) => D * (Math.pow(1 - Math.exp(-a * (r - r0)), 2) - 1),
    F: (r, D, a, r0) => -2 * D * a * (1 - Math.exp(-a * (r - r0))) * Math.exp(-a * (r - r0)),
    k: (D, a) => 2 * D * a * a,
    /* fuerza máxima (resistencia teórica del enlace) en r0 + ln2/a */
    Fmax: (D, a) => (D * a) / 2,
    /* expansión térmica clásica de un oscilador de Morse: <x> ≈ (3 a kT)/(2 k) */
    alphaLin: (D, a, r0) => (3 * a * kB) / (2 * 2 * D * a * a * r0)
  };
  /* Iónico: U = −A/r + B/r^n (Born–Mayer simplificado) */
  MAT.ionic = {
    U: (r, A, B, n) => -A / r + B / Math.pow(r, n),
    r0: (A, B, n) => Math.pow((n * B) / A, 1 / (n - 1)),
    U0: (A, B, n) => { const r0 = Math.pow((n * B) / A, 1 / (n - 1)); return -A / r0 * (1 - 1 / n); }
  };
  /* Pauling: % carácter iónico */
  MAT.ionicPct = (xa, xb) => 100 * (1 - Math.exp(-0.25 * (xa - xb) * (xa - xb)));

  /* ---------------- Cristales ---------------- */
  /* Bases en coordenadas fraccionarias (celda convencional) */
  const FCC = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
  MAT.cells = {
    sc: { name: 'Cúbica simple', n: 1, basis: [[[0, 0, 0], 0]], cn: 6, aR: (r) => 2 * r },
    bcc: { name: 'Cúbica centrada en el cuerpo (BCC)', n: 2, basis: [[[0, 0, 0], 0], [[0.5, 0.5, 0.5], 0]], cn: 8, aR: (r) => (4 * r) / Math.sqrt(3) },
    fcc: { name: 'Cúbica centrada en las caras (FCC)', n: 4, basis: FCC.map((p) => [p, 0]), cn: 12, aR: (r) => 2 * Math.SQRT2 * r },
    diamond: { name: 'Diamante', n: 8, basis: FCC.map((p) => [p, 0]).concat(FCC.map((p) => [[p[0] + 0.25, p[1] + 0.25, p[2] + 0.25], 0])), cn: 4, aR: (r) => (8 * r) / Math.sqrt(3) },
    nacl: { name: 'Sal gema (NaCl)', n: 8, basis: FCC.map((p) => [p, 0]).concat(FCC.map((p) => [[p[0] + 0.5, p[1], p[2]], 1])), cn: 6 },
    cscl: { name: 'Cloruro de cesio (CsCl)', n: 2, basis: [[[0, 0, 0], 0], [[0.5, 0.5, 0.5], 1]], cn: 8 },
    zns: { name: 'Blenda de zinc (ZnS)', n: 8, basis: FCC.map((p) => [p, 0]).concat(FCC.map((p) => [[p[0] + 0.25, p[1] + 0.25, p[2] + 0.25], 1])), cn: 4 },
    caf2: { name: 'Fluorita (CaF₂)', n: 12, basis: FCC.map((p) => [p, 0]).concat([0.25, 0.75].flatMap((x) => [0.25, 0.75].flatMap((y) => [0.25, 0.75].map((z) => [[x, y, z], 1])))), cn: 8 },
    perov: { name: 'Perovskita (CaTiO₃)', n: 5, basis: [[[0, 0, 0], 0], [[0.5, 0.5, 0.5], 1], [[0.5, 0.5, 0], 2], [[0.5, 0, 0.5], 2], [[0, 0.5, 0.5], 2]], cn: 6 }
  };
  /* Factor de empaquetamiento de cúbicas monoatómicas con esferas en contacto */
  MAT.apf = function (type) {
    const C = MAT.cells[type];
    const a = C.aR(1);
    return (C.n * (4 / 3) * Math.PI) / (a * a * a);
  };
  MAT.apfHCP = (ca = Math.sqrt(8 / 3)) => (6 * (4 / 3) * Math.PI) / ((3 * Math.sqrt(3) / 2) * 4 * (2 * ca)); // r=1, a=2
  /* Densidad teórica: ρ = nA/(V_c N_A); A en g/mol, V en m³ → kg/m³ */
  MAT.density = (n, A, Vc) => (n * A * 1e-3) / (Vc * NA);
  /* Átomos de una red cúbica que caen dentro de la caja [0,N]^3 (incluye caras) */
  MAT.latticePoints = function (type, N = 1) {
    const C = MAT.cells[type], pts = [], eps = 1e-9;
    for (let i = -1; i <= N; i++) for (let j = -1; j <= N; j++) for (let k = -1; k <= N; k++)
      for (const [b, s] of C.basis) {
        const p = [i + b[0], j + b[1], k + b[2]];
        if (p.every((v) => v > -eps && v < N + eps)) pts.push({ p, s });
      }
    return pts;
  };
  /* Celda hexagonal compacta (prisma de 3 celdas primitivas) */
  MAT.hcpPoints = function (ca = Math.sqrt(8 / 3)) {
    const pts = [], a = 1, cc = ca * a;
    const hex = [[0, 0]];
    for (let k = 0; k < 6; k++) hex.push([Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)]);
    for (const z of [0, cc]) for (const [x, y] of hex) pts.push({ p: [x, y, z], s: 0 });
    for (let k = 0; k < 3; k++) {
      const ang = (Math.PI / 6) + (k * 2 * Math.PI) / 3, rr = 1 / Math.sqrt(3);
      pts.push({ p: [rr * Math.cos(ang), rr * Math.sin(ang), cc / 2], s: 1 });
    }
    return pts;
  };


  /* Metales (Callister, tabla 3.1; para Ti se usa R = a/2 con a = 0.2951 nm medido): estructura, radio atómico R (nm), masa A (g/mol), densidad medida (g/cm³), c/a si HCP */
  MAT.elements = {
    Al: ['fcc', 0.1431, 26.98, 2.71], Cu: ['fcc', 0.1278, 63.55, 8.94], Ni: ['fcc', 0.1246, 58.69, 8.90], Au: ['fcc', 0.1442, 196.97, 19.32],
    Ag: ['fcc', 0.1445, 107.87, 10.49], Pb: ['fcc', 0.1750, 207.2, 11.35], Pt: ['fcc', 0.1387, 195.08, 21.45],
    'Fe-α': ['bcc', 0.1241, 55.85, 7.87], Cr: ['bcc', 0.1249, 52.00, 7.19], Mo: ['bcc', 0.1363, 95.94, 10.22], W: ['bcc', 0.1371, 183.84, 19.3], Ta: ['bcc', 0.1430, 180.95, 16.6],
    Mg: ['hcp', 0.1604, 24.31, 1.74, 1.624], Ti: ['hcp', 0.1475, 47.87, 4.51, 1.588], Zn: ['hcp', 0.1332, 65.41, 7.13, 1.856], Co: ['hcp', 0.1253, 58.93, 8.9, 1.623], Cd: ['hcp', 0.1490, 112.41, 8.65, 1.886]
  };
  /* Densidad teórica (g/cm³) de un elemento de la tabla */
  MAT.elementDensity = function (sym) {
    const [st, Rn, A, , ca] = MAT.elements[sym];
    const R_ = Rn * 1e-9;
    let n, V;
    if (st === 'hcp') { const a = 2 * R_; n = 6; V = ((3 * Math.sqrt(3)) / 2) * a * a * (ca * a); }
    else { const a = MAT.cells[st].aR(R_); n = MAT.cells[st].n; V = a * a * a; }
    return MAT.density(n, A, V) / 1000;
  };
  /* Radios iónicos (nm, NC 6; Callister tabla 12.3) */
  MAT.ionR = { 'Al³⁺': 0.053, 'Ba²⁺': 0.136, 'Ca²⁺': 0.100, 'Cs⁺': 0.170, 'Fe²⁺': 0.077, 'Fe³⁺': 0.069, 'K⁺': 0.138, 'Mg²⁺': 0.072, 'Mn²⁺': 0.067, 'Na⁺': 0.102, 'Ni²⁺': 0.069, 'Si⁴⁺': 0.040, 'Ti⁴⁺': 0.061, 'Zn²⁺': 0.074, 'Br⁻': 0.196, 'Cl⁻': 0.181, 'F⁻': 0.133, 'I⁻': 0.220, 'O²⁻': 0.140, 'S²⁻': 0.184 };
  /* Número de coordinación por cociente de radios */
  MAT.cnFromRatio = (q) => (q < 0.155 ? 2 : q < 0.225 ? 3 : q < 0.414 ? 4 : q < 0.732 ? 6 : q < 1 ? 8 : 12);
  MAT.ratioLimits = { 3: 2 / Math.sqrt(3) - 1, 4: Math.sqrt(1.5) - 1, 6: Math.SQRT2 - 1, 8: Math.sqrt(3) - 1 };

  /* ---------------- Cristalografía cúbica ---------------- */
  MAT.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  MAT.dCubic = (a, h, k, l) => a / Math.sqrt(h * h + k * k + l * l);
  MAT.angleDir = (u, v) => Math.acos((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v)));
  /* Índices de Miller a partir de intersecciones (Infinity = paralelo) */
  MAT.miller = function (ix, iy, iz) {
    const inv = [ix, iy, iz].map((v) => (isFinite(v) ? 1 / v : 0));
    /* escalar a enteros mínimos con denominador ≤ 12 */
    for (let m = 1; m <= 60; m++) {
      const s = inv.map((v) => v * m);
      if (s.every((v) => Math.abs(v - Math.round(v)) < 1e-9)) {
        let r = s.map(Math.round);
        const g = r.reduce((a, b) => MAT.gcd(a, b), 0) || 1;
        return r.map((v) => v / g);
      }
    }
    return inv;
  };
  /* Densidad planar y lineal de FCC y BCC (átomos por unidad de área/longitud, en unidades de R) */
  MAT.planarDensity = {
    fcc: { '100': (R_) => 1 / (4 * R_ * R_), '110': (R_) => 1 / (4 * Math.SQRT2 * R_ * R_), '111': (R_) => 1 / (2 * Math.sqrt(3) * R_ * R_) },
    bcc: { '100': (R_) => 3 / (16 * R_ * R_), '110': (R_) => 3 / (8 * Math.SQRT2 * R_ * R_), '111': (R_) => Math.sqrt(3) / (16 * R_ * R_) }
  };
  MAT.linearDensity = {
    fcc: { '100': (R_) => 1 / (2 * Math.SQRT2 * R_), '110': (R_) => 1 / (2 * R_), '111': (R_) => 1 / (2 * Math.sqrt(6) * R_) },
    bcc: { '100': (R_) => Math.sqrt(3) / (4 * R_), '110': (R_) => Math.sqrt(6) / (8 * R_), '111': (R_) => 1 / (2 * R_) }
  };

  /* ---------------- Difracción ---------------- */
  MAT.lambda = { CuKa: 1.5406e-10, CuKa2: 1.5444e-10, MoKa: 0.70930e-10, CoKa: 1.78897e-10, CrKa: 2.28970e-10 };
  /* 2θ en grados para d (m) y λ (m); NaN si no hay reflexión */
  MAT.twoTheta = (d, lam) => { const s = lam / (2 * d); return s > 1 ? NaN : (2 * Math.asin(s) * 180) / Math.PI; };
  /* Factor de estructura con factores atómicos f (uno por especie) */
  MAT.structureFactor = function (type, hkl, f = [1, 1, 1]) {
    const C = MAT.cells[type];
    let re = 0, im = 0;
    for (const [b, s] of C.basis) {
      const ph = 2 * Math.PI * (hkl[0] * b[0] + hkl[1] * b[1] + hkl[2] * b[2]);
      re += f[s] * Math.cos(ph); im += f[s] * Math.sin(ph);
    }
    return Math.hypot(re, im);
  };
  /* Lista de reflexiones permitidas de una red cúbica, ordenadas por 2θ */
  MAT.reflections = function (type, a, lam, f, maxH = 6, tthMax = 150) {
    const seen = new Map();
    for (let hh = 0; hh <= maxH; hh++) for (let k = 0; k <= hh; k++) for (let l = 0; l <= k; l++) {
      if (hh + k + l === 0) continue;
      const N = hh * hh + k * k + l * l;
      const F = MAT.structureFactor(type, [hh, k, l], f);
      if (F < 1e-6) continue;
      const tth = MAT.twoTheta(a / Math.sqrt(N), lam);
      if (!(tth < tthMax)) continue;
      const key = hh + '' + k + l;
      /* multiplicidad cúbica de {hkl} */
      const perms = new Set();
      const v = [hh, k, l];
      const P = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      for (const p of P) for (let sx = -1; sx <= 1; sx += 2) for (let sy = -1; sy <= 1; sy += 2) for (let sz = -1; sz <= 1; sz += 2)
        perms.add([v[p[0]] * sx, v[p[1]] * sy, v[p[2]] * sz].join(','));
      seen.set(key, { hkl: v, N, F, d: a / Math.sqrt(N), tth, mult: perms.size });
    }
    return Array.from(seen.values()).sort((x, y) => x.tth - y.tth);
  };

  /* Factores de dispersión atómica (Cromer–Mann, International Tables for Crystallography, vol. C, tabla 6.1.1.4):
     f(s) = Σ a_i exp(−b_i s²) + c, con s = sen θ / λ en Å⁻¹ */
  MAT.cromerMann = {
    Al: [[6.4202, 3.0387], [1.9002, 0.7426], [1.5936, 31.5472], [1.9646, 85.0886], 1.1151],
    Cu: [[13.338, 3.5828], [7.1676, 0.247], [5.6158, 11.3966], [1.6735, 64.8126], 1.191],
    Fe: [[11.7695, 4.7611], [7.3573, 0.3072], [3.5222, 15.3535], [2.3045, 76.8805], 1.0369],
    Si: [[6.2915, 2.4386], [3.0353, 32.3337], [1.9891, 0.6785], [1.541, 81.6937], 1.1407],
    Na: [[4.7626, 3.285], [3.1736, 8.8422], [1.2674, 0.3136], [1.1128, 129.424], 0.676],
    Cl: [[11.4604, 0.0104], [7.1964, 1.1662], [6.2556, 18.5194], [1.6455, 47.7784], -9.5574]
  };
  /* Factores de Debye–Waller B (Å²) a temperatura ambiente (Peng et al., Acta Cryst. A52, 1996; valores redondeados) */
  MAT.debyeB = { Al: 0.86, Cu: 0.55, Fe: 0.35, Si: 0.46, Na: 1.6, Cl: 1.2 };
  MAT.fAtom = function (el, s) {
    const C = MAT.cromerMann[el];
    let f = C[4];
    for (let i = 0; i < 4; i++) f += C[i][0] * Math.exp(-C[i][1] * s * s);
    return f;
  };
  /* Difractograma de polvo: picos {hkl, tth, I (relativa a 100)} con |F|², multiplicidad y Lorentz-polarización.
     els: elemento por especie de la base (o números constantes) */
  MAT.powderPattern = function (type, a, lam, els, tthMax = 150, useDW = true) {
    const refl = MAT.reflections(type, a, lam, els.map((_, i) => 1 + 0.618 * i), 7, tthMax);
    const lamA = lam * 1e10;
    const out = [];
    for (const r of refl) {
      const s = Math.sin((r.tth * Math.PI) / 360) / lamA;
      const f = els.map((e) => (typeof e === 'number' ? e : MAT.fAtom(e, s) * (useDW ? Math.exp(-(MAT.debyeB[e] || 0.5) * s * s) : 1)));
      const F = MAT.structureFactor(type, r.hkl, f);
      if (F < 1e-6) continue;
      out.push(Object.assign({}, r, { F, I: F * F * r.mult * MAT.lorentzPol(r.tth) }));
    }
    const mx = Math.max(...out.map((o) => o.I));
    out.forEach((o) => (o.I = (100 * o.I) / mx));
    return out;
  };
  /* Factor de Lorentz-polarización (difractómetro sin monocromador) */
  MAT.lorentzPol = (tthDeg) => { const t = (tthDeg * Math.PI) / 360; return (1 + Math.cos(2 * t) ** 2) / (Math.sin(t) ** 2 * Math.cos(t)); };
  /* Ecuación de Scherrer: tamaño de cristalito (m) */
  MAT.scherrer = (lam, betaRad, tthDeg, K = 0.9) => (K * lam) / (betaRad * Math.cos((tthDeg * Math.PI) / 360));

  /* ---------------- Defectos y difusión ---------------- */
  MAT.arrhenius = (A0, Q, T) => A0 * Math.exp(-Q / (R * T)); // Q en J/mol
  MAT.arrheniusEV = (A0, QeV, T) => A0 * Math.exp(-QeV / (kBeV * T));
  /* Fracción de vacancias en equilibrio */
  MAT.vacancyFraction = (QveV, T) => Math.exp(-QveV / (kBeV * T));
  /* Tamaño de grano ASTM: N = 2^(G−1) granos/in² a 100× */
  MAT.astmN = (G) => Math.pow(2, G - 1);
  MAT.astmG = (N) => 1 + Math.log2(N);
  /* ASTM E112: G a partir de granos por mm² a 1× y de la longitud media de intercepto (mm) */
  MAT.astmFromNA = (NA_mm2) => 3.321928 * Math.log10(NA_mm2) - 2.954;
  MAT.astmFromL = (l_mm) => -6.643856 * Math.log10(l_mm) - 3.288;
  /* Energías de formación de vacancias (eV): Ehrhart, Landolt-Börnstein III/25 (1991) */
  MAT.vacEf = { Al: 0.67, Cu: 1.28, Ag: 1.11, Au: 0.93, Ni: 1.79, Pt: 1.35, W: 3.67 };
  /* Huecos intersticiales (radio del hueco / R del átomo de la red) */
  MAT.holes = { fcc: { oct: Math.SQRT2 - 1, tet: Math.sqrt(1.5) - 1 }, bcc: { oct: 2 / Math.sqrt(3) - 1, tet: Math.sqrt(5 / 3) - 1 } };
  /* Segunda ley de Fick, fuente constante en superficie (sólido semiinfinito) */
  MAT.fickConst = (x, t, D, C0, Cs) => Cs - (Cs - C0) * MAT.erf(x / (2 * Math.sqrt(D * t)));
  /* Fuente delgada (cantidad fija Q por área) */
  MAT.fickThin = (x, t, D, Q) => (Q / Math.sqrt(Math.PI * D * t)) * Math.exp(-(x * x) / (4 * D * t));
  /* Tiempo para alcanzar concentración Cx a profundidad x */
  MAT.fickTime = (x, D, C0, Cs, Cx) => { const z = MAT.erfinv((Cs - Cx) / (Cs - C0)); return Math.pow(x / (2 * z), 2) / D; };
  /* Diferencias finitas explícitas para Fick 1D; devuelve nuevo arreglo */
  MAT.fickStep = function (C, D, dx, dt, left = null, right = null) {
    const n = C.length, out = new Float64Array(n), r = (D * dt) / (dx * dx);
    for (let i = 1; i < n - 1; i++) out[i] = C[i] + r * (C[i + 1] - 2 * C[i] + C[i - 1]);
    out[0] = left === null ? out[1] : left;
    out[n - 1] = right === null ? out[n - 2] : right;
    return out;
  };
  /* Datos de difusión (Callister, 10.ª ed., tabla 5.2): D0 (m²/s), Qd (J/mol) */
  MAT.diffData = [
    { sp: 'Fe', host: 'Fe-α (BCC)', D0: 2.8e-4, Q: 251e3 },
    { sp: 'Fe', host: 'Fe-γ (FCC)', D0: 5.0e-5, Q: 284e3 },
    { sp: 'C', host: 'Fe-α (BCC)', D0: 1.1e-6, Q: 87.4e3 },
    { sp: 'C', host: 'Fe-γ (FCC)', D0: 2.3e-5, Q: 148e3 },
    { sp: 'Cu', host: 'Cu', D0: 7.8e-5, Q: 211e3 },
    { sp: 'Zn', host: 'Cu', D0: 2.4e-5, Q: 189e3 },
    { sp: 'Al', host: 'Al', D0: 2.3e-4, Q: 144e3 },
    { sp: 'Cu', host: 'Al', D0: 6.5e-5, Q: 136e3 },
    { sp: 'Mg', host: 'Al', D0: 1.2e-4, Q: 130e3 },
    { sp: 'Cu', host: 'Ni', D0: 2.7e-5, Q: 256e3 }
  ];

  /* ---------------- Mecánica: tracción ---------------- */
  /* Curva de tracción modelo: elástica + flujo plástico σ_v = max(σ_y, K ε_p^n) (Hollomon con meseta de fluencia),
     estricción por el criterio de Considère (dσ_v/dε_v = σ_v) y caída de la carga hasta la fractura en ε = efrac.
     Devuelve puntos de ingeniería [ε, σ] (σ en Pa). */
  MAT.tensile = function (o) {
    const E = o.E, sy = o.sy, n = o.n, K = o.K !== undefined ? o.K : sy / Math.pow(0.002, n), efrac = o.efrac || 0.4;
    const sTrue = (ep) => Math.max(sy, K * Math.pow(Math.max(ep, 1e-12), n));
    const pts = [], tru = [];
    let necked = false, sU = 0, eU = efrac, prevS = 0, prevT = 0;
    const N = o.N || 2000;
    for (let i = 0; i <= N; i++) {
      const eEng = (i / N) * efrac, eT = Math.log(1 + eEng);
      let sEng;
      if (!necked) {
        const sel = E * eT;
        const s = sel <= sy ? sel : MAT.bisect((ss) => ss - sTrue(eT - ss / E), sy * 0.999, Math.max(sy, K) * 4);
        sEng = s / (1 + eEng);
        /* Considère en la curva verdadera: dσ/dε ≤ σ, solo en régimen plástico */
        if (i > 0 && K * Math.pow(Math.max(eT - s / E, 1e-12), n) >= sy && (s - prevS) / (eT - prevT) <= s) { necked = true; sU = sEng; eU = eEng; }
        tru.push([eT, s]);
        prevS = s; prevT = eT;
      }
      if (necked) { const u = (eEng - eU) / Math.max(1e-9, efrac - eU); sEng = sU * (1 - 0.3 * Math.pow(u, 1.8)); }
      pts.push([eEng, sEng]);
    }
    if (!necked) { sU = Math.max(...pts.map((q) => q[1])); }
    return { pts, tru, uts: sU, eu: eU, K };
  };
  /* Resistencia a la tracción predicha por Considère con Hollomon puro: σ_u = K nⁿ e^{−n} */
  MAT.utsHollomon = (K, n) => K * Math.pow(n, n) * Math.exp(-n);
  /* Callister, tabla 6.4: K (MPa) y n de Hollomon */
  MAT.hollomonData = { 'Acero de bajo carbono recocido': [600, 0.21], 'Acero 4340 revenido a 315 °C': [2650, 0.12], 'Acero inoxidable 304 recocido': [1400, 0.44], 'Cobre recocido': [530, 0.44], 'Latón naval recocido': [585, 0.21], 'Aluminio 2024-T3': [780, 0.17], 'Magnesio AZ-31B recocido': [450, 0.16] };
  MAT.engToTrue = (eEng, sEng) => [Math.log(1 + eEng), sEng * (1 + eEng)];
  MAT.resilience = (sy, E) => (sy * sy) / (2 * E);
  /* Tenacidad = área bajo la curva (trapecio) */
  MAT.areaUnder = (pts) => { let a = 0; for (let i = 1; i < pts.length; i++) a += 0.5 * (pts[i][1] + pts[i - 1][1]) * (pts[i][0] - pts[i - 1][0]); return a; };
  /* Elasticidad isótropa */
  MAT.G = (E, nu) => E / (2 * (1 + nu));
  MAT.Kbulk = (E, nu) => E / (3 * (1 - 2 * nu));
  /* Dureza Brinell → resistencia (aceros): TS(MPa) ≈ 3.45 HB */
  MAT.hbToTS = (HB) => 3.45 * HB;
  MAT.brinell = (P_kg, D, d) => (2 * P_kg) / (Math.PI * D * (D - Math.sqrt(D * D - d * d)));
  MAT.vickers = (P_kg, d1) => (1.8544 * P_kg) / (d1 * d1);

  /* ---------------- Plasticidad ---------------- */
  MAT.schmid = (phiDeg, lamDeg) => Math.cos((phiDeg * Math.PI) / 180) * Math.cos((lamDeg * Math.PI) / 180);
  MAT.hallPetch = (s0, ky, d) => s0 + ky / Math.sqrt(d);
  /* Esfuerzo de Taylor: τ = α G b √ρ */
  MAT.taylor = (alpha, G, b, rho) => alpha * G * b * Math.sqrt(rho);
  MAT.coldWork = (A0, Ad) => (100 * (A0 - Ad)) / A0;
  /* Los 12 sistemas {111}<110> del FCC: [plano, dirección] */
  MAT.fccSlip = (function () {
    const planes = [[1, 1, 1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]];
    const dirs = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [1, 1, 0], [1, 0, 1], [0, 1, 1]];
    const out = [];
    for (const p of planes) for (const d of dirs) if (p[0] * d[0] + p[1] * d[1] + p[2] * d[2] === 0) out.push([p, d]);
    return out;
  })();
  /* Factor de Schmid máximo para eje de carga t entre los 12 sistemas */
  MAT.maxSchmidFCC = function (t) {
    const tn = Math.hypot(...t);
    let best = { m: 0 };
    for (const [p, d] of MAT.fccSlip) {
      const cp = Math.abs(p[0] * t[0] + p[1] * t[1] + p[2] * t[2]) / (Math.hypot(...p) * tn);
      const cd = Math.abs(d[0] * t[0] + d[1] * t[1] + d[2] * t[2]) / (Math.hypot(...d) * tn);
      if (cp * cd > best.m + 1e-12) best = { m: cp * cd, p, d };
    }
    return best;
  };
  /* JMAK (Avrami) */
  MAT.jmak = (k, n, t) => 1 - Math.exp(-k * Math.pow(t, n));
  MAT.jmakT50 = (k, n) => Math.pow(Math.LN2 / k, 1 / n);

  /* ---------------- Fractura, fatiga, fluencia ---------------- */
  MAT.griffith = (E, gs, a, plane = 'stress', nu = 0.3) => Math.sqrt((2 * E * gs) / (Math.PI * a * (plane === 'strain' ? 1 - nu * nu : 1)));
  MAT.KI = (Y, s, a) => Y * s * Math.sqrt(Math.PI * a);
  MAT.critCrack = (KIc, Y, s) => Math.pow(KIc / (Y * s), 2) / Math.PI;
  /* Concentración de esfuerzos de Inglis */
  MAT.inglis = (a, rho) => 1 + 2 * Math.sqrt(a / rho);
  /* Zona plástica de Irwin (tensión plana) */
  MAT.plasticZone = (K, sy) => (1 / (2 * Math.PI)) * Math.pow(K / sy, 2);
  /* Espesor mínimo para deformación plana (ASTM E399) */
  MAT.planeStrainB = (K, sy) => 2.5 * Math.pow(K / sy, 2);
  /* Curva de transición dúctil-frágil (tanh) */
  MAT.dbtt = (T, Tt, Elow, Eup, w) => Elow + ((Eup - Elow) / 2) * (1 + Math.tanh((T - Tt) / w));
  /* Basquin: σ_a = σ'_f (2N)^b */
  MAT.basquinN = (sa, sf, b) => 0.5 * Math.pow(sa / sf, 1 / b);
  /* Goodman */
  MAT.goodman = (sa, sm, Su) => sa / (1 - sm / Su);
  /* Paris: ciclos de a0 a af con Y constante */
  MAT.parisN = function (C, m, Y, ds, a0, af) {
    if (Math.abs(m - 2) < 1e-9) return Math.log(af / a0) / (C * Math.pow(Y * ds * Math.sqrt(Math.PI), 2));
    const p = 1 - m / 2;
    return (Math.pow(af, p) - Math.pow(a0, p)) / (C * Math.pow(Y * ds * Math.sqrt(Math.PI), m) * p);
  };
  /* Larson–Miller: LMP = T (C + log10 t_r) */
  MAT.lmp = (T, tr, C = 20) => T * (C + Math.log10(tr));
  MAT.lmpTime = (LMP, T, C = 20) => Math.pow(10, LMP / T - C);
  /* Norton: ε̇ = A σ^n exp(−Q/RT) */
  MAT.norton = (A, s, n, Q, T) => A * Math.pow(s, n) * Math.exp(-Q / (R * T));
  /* Weibull: probabilidad de falla */
  MAT.weibull = (s, s0, m, VV0 = 1) => 1 - Math.exp(-VV0 * Math.pow(s / s0, m));
  /* Estimador de Bernard para rangos medianos */
  MAT.medianRank = (i, N) => (i - 0.3) / (N + 0.4);

  /* ---------------- Diagramas de fase ---------------- */
  MAT.lever = (C0, Ca, Cb) => { const Wb = (C0 - Ca) / (Cb - Ca); return [1 - Wb, Wb]; };
  /* Isomorfo ideal (solución ideal en líquido y sólido): dados T_A, T_B (K) y entalpías de fusión (J/mol),
     devuelve [xS, xL] fracción molar de B a temperatura T (ecuaciones de van Laar ideales). */
  MAT.idealLens = function (T, TA, TB, HA, HB) {
    const kA = Math.exp((HA / R) * (1 / TA - 1 / T)); // x_L,A / x_S,A ... con convención xL/xS
    const kB_ = Math.exp((HB / R) * (1 / TB - 1 / T));
    /* (1−xL) = kA (1−xS),  xL = kB xS */
    /* xS = (1 − kA)/(kB − kA) */
    const xS = (1 - kA) / (kB_ - kA);
    const xL = kB_ * xS;
    return [xS, xL];
  };
  /* Datos Cu–Ni */
  MAT.CuNi = { TA: 1358, TB: 1728, HA: 13.26e3, HB: 17.48e3,
    /* Diagrama experimental digitalizado (%peso Ni, °C; ASM / Callister fig. 9.3a, ±10 °C) */
    liq: [[0, 1085], [10, 1140], [20, 1195], [30, 1245], [40, 1280], [50, 1310], [60, 1345], [70, 1375], [80, 1405], [90, 1430], [100, 1455]],
    sol: [[0, 1085], [10, 1110], [20, 1160], [30, 1200], [40, 1240], [50, 1275], [60, 1310], [70, 1345], [80, 1380], [90, 1420], [100, 1455]] };
  /* Composición (%Ni) de una curva monótona C→T a temperatura T */
  MAT.curveC = (pts, T) => { for (let i = 1; i < pts.length; i++) if (T <= pts[i][1]) { const [c1, t1] = pts[i - 1], [c2, t2] = pts[i]; return c1 + ((c2 - c1) * (T - t1)) / (t2 - t1); } return pts[pts.length - 1][0]; };
  MAT.curveT = (pts, C) => { for (let i = 1; i < pts.length; i++) if (C <= pts[i][0]) { const [c1, t1] = pts[i - 1], [c2, t2] = pts[i]; return t1 + ((t2 - t1) * (C - c1)) / (c2 - c1); } return pts[pts.length - 1][1]; };
  /* Estado de una aleación Cu–Ni (C %Ni, T °C) con el diagrama experimental */
  MAT.cuniState = function (C, T) {
    const D = MAT.CuNi, TL = MAT.curveT(D.liq, C), TS = MAT.curveT(D.sol, C);
    if (T >= TL) return { region: 'L', phases: [{ name: 'L', C, W: 1 }] };
    if (T <= TS) return { region: 'α', phases: [{ name: 'α', C, W: 1 }] };
    const CL = MAT.curveC(D.liq, T), Ca = MAT.curveC(D.sol, T), [WL, Wa] = MAT.lever(C, CL, Ca);
    return { region: 'α + L', phases: [{ name: 'L', C: CL, W: WL }, { name: 'α', C: Ca, W: Wa }] };
  };
  /* Diagrama Pb–Sn (Callister fig. 9.8), lineal por tramos en %peso Sn y °C */
  MAT.PbSn = {
    TA: 327, TB: 232, TE: 183, CE: 61.9, Ca: 18.3, Cb: 97.8,
    /* solvus α: (0, ~0 a 0 °C)… usamos puntos de la figura */
    solvusA: [[2, 0], [3.2, 50], [5, 100], [10, 150], [18.3, 183]],
    solvusB: [[99.8, 0], [99.5, 100], [99, 150], [97.8, 183]],
    liq: (C) => (C <= 61.9 ? 327 - ((327 - 183) * C) / 61.9 : 183 + ((232 - 183) * (C - 61.9)) / (100 - 61.9)),
    solA: (C) => 327 - ((327 - 183) * C) / 18.3, // sólidus α
    solB: (C) => 232 - ((232 - 183) * (100 - C)) / (100 - 97.8)
  };
  const interpT = (pts, T) => { // pts [[C,T]] T ascendente
    for (let i = 1; i < pts.length; i++) if (T <= pts[i][1]) { const [c1, t1] = pts[i - 1], [c2, t2] = pts[i]; return c1 + ((c2 - c1) * (T - t1)) / (t2 - t1); }
    return pts[pts.length - 1][0];
  };
  /* Fases presentes en Pb–Sn a (C %Sn, T °C): {phases:[{name,C,W}]} */
  MAT.pbsnState = function (C, T) {
    const P = MAT.PbSn;
    if (T >= P.liq(C)) return { region: 'L', phases: [{ name: 'L', C, W: 1 }] };
    if (T > P.TE) {
      if (C < P.CE) {
        const Cs = (P.TA - T) * P.Ca / (P.TA - P.TE), Cl = (P.TA - T) * P.CE / (P.TA - P.TE);
        if (C <= Cs) { if (C > interpT(P.solvusA, T)) return { region: 'α + β', phases: [] }; return { region: 'α', phases: [{ name: 'α', C, W: 1 }] }; }
        const [wa, wl] = MAT.lever(C, Cs, Cl);
        return { region: 'α + L', phases: [{ name: 'α', C: Cs, W: wa }, { name: 'L', C: Cl, W: wl }] };
      } else {
        const Cl = P.CE + ((T - P.TE) * (100 - P.CE)) / (P.TB - P.TE), Cs = P.Cb + ((T - P.TE) * (100 - P.Cb)) / (P.TB - P.TE);
        if (C >= Cs) return { region: 'β', phases: [{ name: 'β', C, W: 1 }] };
        const [wl, wb] = MAT.lever(C, Cl, Cs);
        return { region: 'β + L', phases: [{ name: 'L', C: Cl, W: wl }, { name: 'β', C: Cs, W: wb }] };
      }
    }
    const Ca = interpT(P.solvusA, Math.max(0, T)), Cb = interpT(P.solvusB, Math.max(0, T));
    if (C <= Ca) return { region: 'α', phases: [{ name: 'α', C, W: 1 }] };
    if (C >= Cb) return { region: 'β', phases: [{ name: 'β', C, W: 1 }] };
    const [wa, wb] = MAT.lever(C, Ca, Cb);
    return { region: 'α + β', phases: [{ name: 'α', C: Ca, W: wa }, { name: 'β', C: Cb, W: wb }] };
  };
  /* Microconstituyentes de Pb–Sn justo bajo la eutéctica */
  MAT.pbsnMicro = function (C) {
    const P = MAT.PbSn;
    if (C <= P.Ca || C >= P.Cb) return null;
    if (C <= P.CE) { const We = (C - P.Ca) / (P.CE - P.Ca); return { primary: 'α', Wp: 1 - We, We }; }
    const We = (P.Cb - C) / (P.Cb - P.CE); return { primary: 'β', Wp: 1 - We, We };
  };
  /* Fe–Fe3C (Callister): puntos clave %peso C, °C */
  MAT.FeC = { A1: 727, eut: 1147, Ceut: 4.30, Ceutd: 0.76, Calpha: 0.022, Cgamma: 2.14, Ccem: 6.70, A3_0: 912, delta: 1493 };
  MAT.feA3 = (C) => 912 - ((912 - 727) * C) / 0.76; // línea A3 aproximada lineal
  MAT.feAcm = (C) => 727 + ((1147 - 727) * (C - 0.76)) / (2.14 - 0.76);
  /* Fracciones a temperatura justo bajo 727 °C */
  MAT.feMicro = function (C) {
    const F = MAT.FeC;
    const [Wa, Wfe3c] = MAT.lever(C, F.Calpha, F.Ccem);
    let pro = null, Wpro = 0, Wp;
    if (C < F.Ceutd) { Wp = (C - F.Calpha) / (F.Ceutd - F.Calpha); pro = 'ferrita proeutectoide'; Wpro = 1 - Wp; }
    else { Wp = (F.Ccem - C) / (F.Ccem - F.Ceutd); pro = 'cementita proeutectoide'; Wpro = 1 - Wp; }
    return { Walpha: Wa, Wcem: Wfe3c, Wpearlite: Wp, proName: pro, Wpro };
  };

  /* Diagrama Fe–Fe3C completo (Callister fig. 9.24; %peso C, °C), líneas digitalizadas */
  MAT.FeCD = {
    liq: [[0, 1538], [0.53, 1493], [4.30, 1147], [6.70, 1227]],
    solGamma: [[0.17, 1493], [2.14, 1147]],
    acm: [[0.76, 727], [1.0, 800], [1.4, 920], [1.8, 1040], [2.14, 1147]],
    a3: [[0, 912], [0.2, 860], [0.4, 810], [0.6, 762], [0.76, 727]],
    alphaMax: [[0, 912], [0.022, 727]],
    solvusA: [[0.005, 400], [0.012, 600], [0.022, 727]],
    deltaG: [[0, 1394], [0.09, 1493]],
    gammaD: [[0, 1394], [0.17, 1493]]
  };
  const lineT = (pts, C) => MAT.curveT(pts, C); // T(C) por tramos (C creciente)
  const lineC = (pts, T) => { // C(T) por tramos (cualquier monotonía)
    for (let i = 1; i < pts.length; i++) { const [c1, t1] = pts[i - 1], [c2, t2] = pts[i]; if ((T - t1) * (T - t2) <= 0 && t1 !== t2) return c1 + ((c2 - c1) * (T - t1)) / (t2 - t1); }
    return NaN;
  };
  MAT.feState = function (C, T) {
    const D = MAT.FeCD, F = MAT.FeC;
    const two = (n1, c1, n2, c2) => { const [w1, w2] = MAT.lever(C, c1, c2); return { region: n1 + ' + ' + n2, phases: [{ name: n1, C: c1, W: w1 }, { name: n2, C: c2, W: w2 }] }; };
    const one = (n) => ({ region: n, phases: [{ name: n, C, W: 1 }] });
    const TL = lineT(D.liq, Math.min(C, 6.7));
    if (T >= TL) return one('L');
    if (T >= 1493) {
      /* zona δ y δ + L */
      const cd = lineC([[0, 1538], [0.09, 1493]], T), cl = lineC([[0, 1538], [0.53, 1493]], T);
      if (C <= cd) return one('δ');
      if (C <= cl) return two('δ', cd, 'L', cl);
    }
    if (T >= 1147) {
      if (T >= 1394 && T < 1493) {
        const cd = lineC(D.deltaG, T), cg = lineC(D.gammaD, T);
        if (C <= cd) return one('δ');
        if (C <= cg) return two('δ', cd, 'γ', cg);
      }
      const cs = lineC(D.solGamma, T), cl = lineC(D.liq.slice(1, 3), T);
      if (C <= 4.30) {
        if (C <= cs || isNaN(cs)) return one('γ');
        if (C <= cl) return two('γ', cs, 'L', cl);
      }
      const cl2 = lineC(D.liq.slice(2), T);
      if (C >= cl2) return two('L', cl2, 'Fe₃C', F.Ccem);
      return one('L');
    }
    if (T >= 727) {
      const cacm = lineC(D.acm, T), ca3 = T <= 912 ? lineC(D.a3, T) : NaN, cam = T <= 912 ? lineC(D.alphaMax, T) : NaN;
      if (C >= cacm) return two('γ', cacm, 'Fe₃C', F.Ccem);
      if (T > 912 || C >= ca3) return one('γ');
      if (C <= cam) return one('α');
      return two('α', cam, 'γ', ca3);
    }
    const ca = T >= 400 ? lineC(D.solvusA, T) : 0.005;
    if (C <= ca) return one('α');
    return two('α', ca, 'Fe₃C', F.Ccem);
  };
  /* Regla de fases de Gibbs */
  MAT.gibbsF = (C, P, fixedP = true) => C - P + (fixedP ? 1 : 2);
  /* Energía libre de mezcla regular: ΔG = Ω x(1−x) + RT[x ln x + (1−x) ln(1−x)] */
  MAT.Gmix = (x, Om, T) => Om * x * (1 - x) + R * T * (x > 0 && x < 1 ? x * Math.log(x) + (1 - x) * Math.log(1 - x) : 0);
  MAT.Tcrit = (Om) => Om / (2 * R);
  /* Binodal simétrica (solución regular): x tal que ln(x/(1−x)) = −Ω(1−2x)/(RT) */
  MAT.binodal = function (Om, T) {
    if (T >= Om / (2 * R)) return null;
    const x = MAT.bisect((xx) => Math.log(xx / (1 - xx)) + (Om * (1 - 2 * xx)) / (R * T), 1e-14, 0.5 - 1e-12);
    return [x, 1 - x];
  };
  MAT.spinodal = (Om, T) => { const d = 1 - (2 * R * T) / Om; return d <= 0 ? null : [(1 - Math.sqrt(d)) / 2, (1 + Math.sqrt(d)) / 2]; };

  /* ---------------- Nucleación ---------------- */
  /* Homogénea: ΔGv = ΔHf ΔT/Tm (J/m³), r* = −2γ/ΔGv, ΔG* = 16πγ³/(3ΔGv²) */
  MAT.nucleation = function (gamma, Hv, Tm, dT) {
    const dGv = -(Hv * dT) / Tm;
    return { dGv, rStar: (-2 * gamma) / dGv, Gstar: (16 * Math.PI * gamma ** 3) / (3 * dGv * dGv) };
  };
  MAT.hetFactor = (thetaDeg) => { const t = (thetaDeg * Math.PI) / 180, c = Math.cos(t); return ((2 + c) * (1 - c) * (1 - c)) / 4; };
  /* Curva TTT ilustrativa en C: t50(T) a partir de nucleación (∝ exp(ΔG* ÷ kT)) y difusión (∝ exp(Q/RT)) */
  MAT.cCurve = function (T, Te, Q, A, Bn) {
    const dT = Te - T;
    if (dT <= 0) return Infinity;
    return A * Math.exp(Bn / (T * dT * dT)) * Math.exp(Q / (R * T));
  };

  /* ---------------- Aceros ---------------- */

  /* Curva de inicio (1 %) del diagrama TTT del acero eutectoide, aproximada de Callister fig. 10.22: [T °C, t s] */
  MAT.tttStart = [[720, 3000], [715, 300], [700, 25], [675, 5], [650, 2], [600, 0.9], [560, 0.7], [540, 0.7], [500, 1.2], [450, 3], [400, 8], [350, 30], [300, 120], [250, 500], [220, 1000], [150, 8000]];
  MAT.tStartTTT = function (T) {
    const D = MAT.tttStart;
    if (T >= 727) return Infinity;
    for (let i = 1; i < D.length; i++) if (T >= D[i][0]) { const [T1, t1] = D[i - 1], [T2, t2] = D[i]; const u = (T - T2) / (T1 - T2); return Math.pow(10, Math.log10(t2) + u * (Math.log10(t1) - Math.log10(t2))); }
    return 8000;
  };
  /* Regla de aditividad de Scheil: Σ Δt/t_s(T) = 1 marca el inicio en enfriamiento continuo (solo perlita, T > 540 °C) */
  MAT.scheilSum = (rate, factor = 1, Tlow = 540) => { let s = 0; for (let T = 726.95; T > Tlow; T -= 0.1) s += 0.1 / rate / (factor * MAT.tStartTTT(T)); return s; };
  MAT.criticalRate = (factor = 1) => { let lo = 0.01, hi = 5000; for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (MAT.scheilSum(m, factor) > 1) lo = m; else hi = m; } return Math.sqrt(lo * hi); };
  /* Ms (Andrews 1965, lineal), °C, composición en %peso */
  MAT.MsAndrews = (C, Mn = 0, Ni = 0, Cr = 0, Mo = 0) => 539 - 423 * C - 30.4 * Mn - 17.7 * Ni - 12.1 * Cr - 7.5 * Mo;
  /* Koistinen–Marburger: fracción de martensita */
  MAT.koistinen = (Ms, T, a = 0.011) => (T >= Ms ? 0 : 1 - Math.exp(-a * (Ms - T)));
  /* Carbono equivalente IIW */
  MAT.CE_IIW = (C, Mn = 0, Cr = 0, Mo = 0, V = 0, Ni = 0, Cu = 0) => C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;
  /* Parámetro de Hollomon–Jaffe para revenido: P = T(C + log t), T en K, t en h */
  MAT.hollomonJaffe = (T, t_h, C = 20) => T * (C + Math.log10(t_h));

  /* ---------------- Polímeros ---------------- */
  /* Distribución más probable (Flory–Schulz) para grado de avance p */
  MAT.flory = (N, p) => (1 - p) * (1 - p) * N * Math.pow(p, N - 1); // fracción en peso
  MAT.floryMn = (p) => 1 / (1 - p);
  MAT.floryMw = (p) => (1 + p) / (1 - p);
  /* Mn y Mw a partir de pares (M_i, x_i ó w_i) */
  MAT.mnFromX = (Ms, xs) => Ms.reduce((s, M, i) => s + M * xs[i], 0) / xs.reduce((a, b) => a + b, 0);
  MAT.mwFromW = (Ms, ws) => Ms.reduce((s, M, i) => s + M * ws[i], 0) / ws.reduce((a, b) => a + b, 0);
  /* Cristalinidad por densidad */
  MAT.crystallinity = (rs, rc, ra) => (rc * (rs - ra)) / (rs * (rc - ra));
  /* Viscoelasticidad lineal */
  MAT.maxwellRelax = (E, tau, t) => E * Math.exp(-t / tau);
  MAT.maxwellCreep = (s0, E, eta, t) => s0 / E + (s0 * t) / eta;
  MAT.kelvinCreep = (s0, E, tau, t) => (s0 / E) * (1 - Math.exp(-t / tau));
  /* Sólido lineal estándar (Zener): Er en paralelo con Maxwell(E1, eta) */
  MAT.slsRelax = (Er, E1, tau, t) => Er + E1 * Math.exp(-t / tau);
  MAT.dynamic = (Er, E1, tau, w) => { const wt = w * tau; return { Ep: Er + (E1 * wt * wt) / (1 + wt * wt), Epp: (E1 * wt) / (1 + wt * wt) }; };
  /* WLF */
  MAT.wlf = (T, Tg, C1 = 17.44, C2 = 51.6) => Math.pow(10, (-C1 * (T - Tg)) / (C2 + T - Tg)); // a_T
  /* Elasticidad del caucho: σ = N kT (λ − 1/λ²) */
  MAT.rubber = (G, lam) => G * (lam - 1 / (lam * lam));
  /* Radio de giro de una cadena libremente unida */
  MAT.chainR = (n, l) => Math.sqrt(n) * l;

  /* ---------------- Compuestos ---------------- */
  MAT.voigt = (Ef, Em, Vf) => Ef * Vf + Em * (1 - Vf);
  MAT.reuss = (Ef, Em, Vf) => (Ef * Em) / (Ef * (1 - Vf) + Em * Vf);
  MAT.halpinTsai = (Ef, Em, Vf, xi) => { const eta = (Ef / Em - 1) / (Ef / Em + xi); return (Em * (1 + xi * eta * Vf)) / (1 - eta * Vf); };
  MAT.critLength = (sf, d, tauc) => (sf * d) / (2 * tauc);
  /* Resistencia longitudinal de fibras discontinuas alineadas */
  MAT.discStrength = (sf, l, lc, Vf, smp, d, tauc) => (l >= lc ? sf * Vf * (1 - lc / (2 * l)) : ((l * tauc) / d) * Vf) + smp * (1 - Vf);
  /* Cox shear-lag: factor de eficiencia de longitud */
  MAT.coxEta = (beta_l) => 1 - Math.tanh(beta_l / 2) / (beta_l / 2);
  /* Laminado: rigidez fuera de eje E_x(θ) de una lámina ortótropa */
  MAT.offAxisE = (E1, E2, G12, nu12, thDeg) => {
    const t = (thDeg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
    return 1 / (Math.pow(c, 4) / E1 + (1 / G12 - (2 * nu12) / E1) * c * c * s * s + Math.pow(s, 4) / E2);
  };

  /* Teoría clásica de laminados (solo membrana): módulo E_x(φ) de un laminado simétrico con láminas a ángulos θ_i (°) */
  MAT.qbar = function (E1, E2, G12, nu12, thDeg) {
    const nu21 = (nu12 * E2) / E1, d = 1 - nu12 * nu21;
    const Q11 = E1 / d, Q22 = E2 / d, Q12 = (nu12 * E2) / d, Q66 = G12;
    const t = (thDeg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
    const c2 = c * c, s2 = s * s;
    return [
      [Q11 * c2 * c2 + 2 * (Q12 + 2 * Q66) * s2 * c2 + Q22 * s2 * s2, (Q11 + Q22 - 4 * Q66) * s2 * c2 + Q12 * (s2 * s2 + c2 * c2), (Q11 - Q12 - 2 * Q66) * s * c2 * c + (Q12 - Q22 + 2 * Q66) * s2 * s * c],
      [0, Q11 * s2 * s2 + 2 * (Q12 + 2 * Q66) * s2 * c2 + Q22 * c2 * c2, (Q11 - Q12 - 2 * Q66) * s2 * s * c + (Q12 - Q22 + 2 * Q66) * s * c2 * c],
      [0, 0, (Q11 + Q22 - 2 * Q12 - 2 * Q66) * s2 * c2 + Q66 * (s2 * s2 + c2 * c2)]
    ].map((r, i, a) => r.map((v, j) => (j < i ? a[j][i] : v)));
  };
  MAT.laminateEx = function (E1, E2, G12, nu12, plies, phiDeg = 0) {
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const th of plies) { const q = MAT.qbar(E1, E2, G12, nu12, th - phiDeg); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] += q[i][j] / plies.length; }
    for (let i = 0; i < 3; i++) for (let j = 0; j < i; j++) A[i][j] = A[j][i];
    const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    const inv11 = (A[1][1] * A[2][2] - A[1][2] * A[2][1]) / det;
    return 1 / inv11;
  };

  /* ---------------- Propiedades eléctricas ---------------- */
  MAT.fermi = (E, mu, T) => 1 / (1 + Math.exp((E - mu) / (kBeV * Math.max(T, 1e-9))));
  /* Semiconductor: Nc, Nv (m⁻³) ∝ T^{3/2} desde valores a 300 K */
  MAT.semi = {
    Si: { Eg0: 1.170, alpha: 4.73e-4, beta: 636, Nc300: 2.86e25, Nv300: 3.10e25, mun: 0.145, mup: 0.050, eps: 11.7 },
    Ge: { Eg0: 0.7437, alpha: 4.774e-4, beta: 235, Nc300: 1.04e25, Nv300: 6.0e24, mun: 0.39, mup: 0.19, eps: 16.0 },
    GaAs: { Eg0: 1.519, alpha: 5.405e-4, beta: 204, Nc300: 4.7e23, Nv300: 7.0e24, mun: 0.85, mup: 0.04, eps: 12.9 }
  };
  MAT.Eg = (m, T) => m.Eg0 - (m.alpha * T * T) / (T + m.beta); // Varshni
  MAT.ni = (m, T) => Math.sqrt(m.Nc300 * m.Nv300 * Math.pow(T / 300, 3)) * Math.exp(-MAT.Eg(m, T) / (2 * kBeV * T));
  /* Electrones en material tipo n con donadores Nd (energía de ionización Ed, eV), resolviendo neutralidad */
  MAT.nType = function (m, T, Nd, Ed = 0.045, Na = 0) {
    const Nc = m.Nc300 * Math.pow(T / 300, 1.5), Nv = m.Nv300 * Math.pow(T / 300, 1.5), Eg = MAT.Eg(m, T), kT = kBeV * T;
    /* E referidas a Ev = 0; buscar EF */
    const fn = (EF) => {
      const n = Nc * Math.exp((EF - Eg) / kT), p = Nv * Math.exp(-EF / kT);
      const Ndp = Nd / (1 + 2 * Math.exp((EF - (Eg - Ed)) / kT));
      return p + Ndp - n - Na;
    };
    const EF = MAT.bisect(fn, -0.5 - 40 * kT, Eg + 0.5 + 40 * kT, 1e-14);
    const n = Nc * Math.exp((EF - Eg) / kT), p = Nv * Math.exp(-EF / kT);
    return { EF, n, p, Eg };
  };
  MAT.conductivity = (n, mun, p, mup) => MAT.eV * (n * mun + p * mup);
  /* Movilidad dependiente del dopaje en Si (Caughey–Thomas, Arora), m²/(V·s) */
  MAT.mobilitySi = (N, carrier = 'n') => {
    const P = carrier === 'n' ? { mmin: 0.0068, mmax: 0.1414, Nr: 9.2e22, a: 0.711 } : { mmin: 0.0444, mmax: 0.0470 + 0.0444, Nr: 2.23e23, a: 0.719 };
    return P.mmin + (P.mmax - P.mmin) / (1 + Math.pow(N / P.Nr, P.a));
  };
  /* Metales: Drude y Matthiessen */
  MAT.drudeSigma = (n, tau, m = 9.1093837015e-31) => (n * MAT.eV * MAT.eV * tau) / m;
  MAT.matthiessen = (rhoT, rhoI, rhoD) => rhoT + rhoI + rhoD;
  /* Bloch–Grüneisen normalizado: ρ(T)/ρ(Θ) */
  MAT.blochGruneisen = function (T, theta) {
    const f = (t) => { const I = MAT.integrate((x) => (x < 1e-8 ? 0 : (Math.pow(x, 5) / ((Math.exp(x) - 1) * (1 - Math.exp(-x))))), 0, theta / t, 600); return Math.pow(t / theta, 5) * I; };
    return f(T) / f(theta);
  };
  /* Nordheim: ρ_i = A x(1−x) */
  MAT.nordheim = (A, x) => A * x * (1 - x);
  /* Diodo ideal (Shockley) */
  MAT.diode = (V, Is, T = 300, n = 1) => Is * (Math.exp(V / (n * kBeV * T)) - 1);
  /* Efecto Hall: R_H = −1/(n e) */
  MAT.hall = (n) => -1 / (n * MAT.eV);

  /* ---------------- Dieléctricos ---------------- */
  MAT.clausiusMossotti = (N, alpha) => { const x = (N * alpha) / (3 * 8.8541878128e-12); return (1 + 2 * x) / (1 - x); };
  /* Relajación de Debye */
  MAT.debyeRelax = (es, einf, w, tau) => { const d = 1 + w * w * tau * tau; return { er1: einf + (es - einf) / d, er2: ((es - einf) * w * tau) / d }; };
  /* Landau ferroeléctrico (segundo orden): P_s² = a0 (Tc − T)/b */
  MAT.landauPs = (a0, b, T, Tc) => (T >= Tc ? 0 : Math.sqrt((a0 * (Tc - T)) / b));

  /* ---------------- Térmicas ---------------- */
  MAT.debyeCv = function (T, thetaD) {
    /* C_v / (3 N k) */
    if (T <= 0) return 0;
    const xD = thetaD / T;
    const I = MAT.integrate((x) => (x < 1e-8 ? x * x : (Math.pow(x, 4) * Math.exp(x)) / Math.pow(Math.exp(x) - 1, 2)), 0, xD, 800);
    return 3 * Math.pow(T / thetaD, 3) * I;
  };
  MAT.einsteinCv = (T, thetaE) => { const x = thetaE / T; return (x * x * Math.exp(x)) / Math.pow(Math.exp(x) - 1, 2); };
  /* Resistencia al choque térmico: ΔT_c = σ_f (1−ν)/(E α) */
  MAT.thermalShock = (sf, E, alpha, nu = 0.25) => (sf * (1 - nu)) / (E * alpha);
  MAT.thermalStress = (E, alpha, dT) => -E * alpha * dT;
  /* Wiedemann–Franz */
  MAT.lorenz = 2.44e-8;
  MAT.wfK = (sigma, T) => MAT.lorenz * sigma * T;
  /* Difusividad térmica */
  MAT.diffusivity = (k, rho, cp) => k / (rho * cp);

  /* ---------------- Magnéticas ---------------- */
  MAT.langevin = (x) => (Math.abs(x) < 1e-4 ? x / 3 - (x * x * x) / 45 : 1 / Math.tanh(x) - 1 / x);
  MAT.brillouin = (J, x) => {
    if (Math.abs(x) < 1e-6) return ((J + 1) / (3 * J)) * x;
    const a = (2 * J + 1) / (2 * J), b = 1 / (2 * J);
    return a / Math.tanh(a * x) - b / Math.tanh(b * x);
  };
  /* Magnetización espontánea de campo medio (J=1/2): m = tanh(m Tc/T) */
  MAT.meanFieldM = function (T, Tc, J = 0.5) {
    if (T >= Tc) return 0;
    const t = T / Tc;
    const f = (m) => m - MAT.brillouin(J, (3 * J / (J + 1)) * m / t);
    return MAT.bisect(f, 1e-9, 1);
  };
  MAT.curieWeiss = (C, T, theta) => C / (T - theta);
  /* Histéresis: modelo de Jiles–Atherton (integración en H) */
  MAT.jilesAtherton = function (Hpath, p) {
    const { Ms, a, alpha, k, cr } = p;
    let M = 0, Mirr = 0, Hprev = Hpath[0];
    const out = [];
    const Lang = (x) => MAT.langevin(x);
    for (const H of Hpath) {
      const dH = H - Hprev;
      const nsub = Math.max(1, Math.ceil(Math.abs(dH) / (a * 0.02)));
      for (let s = 0; s < nsub; s++) {
        const Hh = Hprev + (dH * (s + 1)) / nsub, dh = dH / nsub;
        const He = Hh + alpha * M;
        const Man = Ms * Lang(He / a);
        const delta = dh >= 0 ? 1 : -1;
        let dMirr = (Man - Mirr) / (k * delta - alpha * (Man - Mirr));
        if ((Man - Mirr) * dh < 0) dMirr = 0;
        Mirr += dMirr * dh;
        M = cr * Man + (1 - cr) * Mirr;
      }
      Hprev = H;
      out.push([H, M]);
    }
    return out;
  };
  /* Stoner–Wohlfarth: campo de conmutación reducido h_sw(ψ) */
  MAT.stonerSwitch = (psiDeg) => { const p = (psiDeg * Math.PI) / 180, c = Math.pow(Math.abs(Math.cos(p)), 2 / 3), s = Math.pow(Math.abs(Math.sin(p)), 2 / 3); return 1 / Math.pow(c + s, 1.5); };
  /* Momento magnético de espín de iones 3d: μ = 2√(S(S+1)) μ_B con S = n_desap/2 */
  MAT.spinOnly = (nUnp) => Math.sqrt(nUnp * (nUnp + 2));

  /* ---------------- Ópticas ---------------- */
  MAT.fresnelR = (n1, n2) => Math.pow((n2 - n1) / (n2 + n1), 2);
  MAT.fresnel = function (n1, n2, thDeg) {
    const ti = (thDeg * Math.PI) / 180, st = (n1 / n2) * Math.sin(ti);
    if (Math.abs(st) > 1) return { Rs: 1, Rp: 1, tir: true };
    const tt = Math.asin(st), ci = Math.cos(ti), ct = Math.cos(tt);
    const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
    return { Rs: rs * rs, Rp: rp * rp, tir: false, tt: (tt * 180) / Math.PI };
  };
  MAT.beer = (I0, alpha, x) => I0 * Math.exp(-alpha * x);
  /* Transmitancia de una placa con reflexiones múltiples incoherentes */
  MAT.slabT = (R_, alpha, l) => { const a = Math.exp(-alpha * l); return (Math.pow(1 - R_, 2) * a) / (1 - R_ * R_ * a * a); };
  MAT.gapToNm = (EgeV) => (h * c0) / (EgeV * MAT.eV) * 1e9;
  MAT.nmToEV = (nm) => (h * c0) / (nm * 1e-9 * MAT.eV);
  /* Cauchy */
  MAT.cauchy = (A, B, lam_um) => A + B / (lam_um * lam_um);
  /* Sellmeier BK7 (Schott) */
  MAT.sellmeierBK7 = (lam_um) => { const l2 = lam_um * lam_um; return Math.sqrt(1 + (1.03961212 * l2) / (l2 - 0.00600069867) + (0.231792344 * l2) / (l2 - 0.0200179144) + (1.01046945 * l2) / (l2 - 103.560653)); };
  /* Sílice fundida (Malitson 1965) */
  MAT.sellmeierSiO2 = (lam_um) => { const l2 = lam_um * lam_um; return Math.sqrt(1 + (0.6961663 * l2) / (l2 - 0.0684043 ** 2) + (0.4079426 * l2) / (l2 - 0.1162414 ** 2) + (0.8974794 * l2) / (l2 - 9.896161 ** 2)); };

  /* Ajuste de Vogel–Fulcher–Tammann por tres puntos [T °C, log10 η (Pa·s)] → {A, B, T0} */
  MAT.vftFit = function (pts) {
    const [a, b, c] = pts;
    const BB = (T0) => (b[1] - a[1]) / (1 / (b[0] - T0) - 1 / (a[0] - T0));
    const res = (T0) => { const B = BB(T0), A = a[1] - B / (a[0] - T0); return A + B / (c[0] - T0) - c[1]; };
    const T0 = MAT.bisect(res, -200, Math.min(a[0], b[0], c[0]) - 1);
    const B = BB(T0);
    return { A: a[1] - B / (a[0] - T0), B, T0 };
  };
  MAT.vftLog = (f, T) => f.A + f.B / (T - f.T0);
  MAT.vftT = (f, logEta) => f.T0 + f.B / (logEta - f.A);
  /* Vidrios: puntos de trabajo, ablandamiento, recocido y deformación (°C); sílice-sosa-cal según Callister fig. 13.7,
     borosilicato y vidrio al plomo según las fichas de Corning 7740 y 0010 */
  MAT.glasses = { sodalime: ['Sílice-sosa-cal', 1000, 700, 510, 470], borosil: ['Borosilicato (tipo Pyrex)', 1252, 821, 560, 510], lead: ['Vidrio al plomo', 983, 626, 435, 395] };

  /* ---------------- Corrosión ---------------- */
  MAT.F = 96485.33212;
  MAT.nernst = (E0, n, Q, T = 298.15) => E0 - ((R * T) / (n * MAT.F)) * Math.log(Q);
  MAT.E0 = { 'Au³⁺/Au': 1.50, 'O₂/H₂O (ácido)': 1.229, 'Pt²⁺/Pt': 1.18, 'Ag⁺/Ag': 0.800, 'Fe³⁺/Fe²⁺': 0.771, 'O₂/OH⁻ (básico)': 0.401, 'Cu²⁺/Cu': 0.340, 'H⁺/H₂': 0.000, 'Pb²⁺/Pb': -0.126, 'Sn²⁺/Sn': -0.136, 'Ni²⁺/Ni': -0.250, 'Co²⁺/Co': -0.277, 'Cd²⁺/Cd': -0.403, 'Fe²⁺/Fe': -0.440, 'Cr³⁺/Cr': -0.744, 'Zn²⁺/Zn': -0.763, 'Al³⁺/Al': -1.662, 'Mg²⁺/Mg': -2.363, 'Na⁺/Na': -2.714, 'K⁺/K': -2.924 };
  /* Butler–Volmer: i = i0 [exp(αa F η/RT) − exp(−αc F η/RT)] */
  MAT.butlerVolmer = (i0, eta, aa = 0.5, ac = 0.5, T = 298.15) => i0 * (Math.exp((aa * MAT.F * eta) / (R * T)) - Math.exp((-ac * MAT.F * eta) / (R * T)));
  /* Potencial mixto de dos reacciones con cinética de Tafel; b en V/década */
  MAT.mixedPotential = function (Ea, i0a, ba, Ec, i0c, bc) {
    /* ia = i0a 10^{(E−Ea)/ba}, ic = i0c 10^{−(E−Ec)/bc}; igualar */
    const Ecorr = (ba * bc * Math.log10(i0c / i0a) + bc * Ea + ba * Ec) / (ba + bc);
    const icorr = i0a * Math.pow(10, (Ecorr - Ea) / ba);
    return { Ecorr, icorr };
  };
  /* Velocidad de corrosión (Faraday): CPR (mm/año) = K i M/(n F ρ) */
  MAT.corrRate = (i_Am2, Mgmol, n, rho_kgm3) => ((i_Am2 * Mgmol * 1e-3) / (n * MAT.F * rho_kgm3)) * 3.15576e7 * 1e3;
  /* Pilling–Bedworth */
  MAT.pillingBedworth = (Mox, rhoOx, Mm, rhoM, nAtoms) => (Mox * rhoM) / (nAtoms * Mm * rhoOx);
  /* Oxidación parabólica */
  MAT.parabolic = (kp, t) => Math.sqrt(kp * t);

  /* ---------------- Base de datos de materiales (valores típicos a 20 °C) ----------------
     E (GPa), ρ (kg/m³), σy (MPa; resistencia a la fractura en cerámicos y vidrios), KIc (MPa√m),
     k (W/m·K), α (10⁻⁶/K), costo (USD/kg aproximado), Tmax (°C). Fuentes: Ashby (2011) y Callister (2018), apéndices. */
  MAT.db = [
    ['Acero al carbono 1020', 'metal', 207, 7850, 210, 50, 52, 11.7, 0.8, 400],
    ['Acero 4340 templado y revenido', 'metal', 207, 7850, 1100, 50, 45, 12.3, 1.5, 450],
    ['Acero inoxidable 304', 'metal', 193, 8000, 215, 120, 16, 17.3, 4, 750],
    ['Fundición gris', 'metal', 100, 7150, 150, 15, 46, 11.4, 0.6, 350],
    ['Aluminio 6061-T6', 'metal', 69, 2700, 276, 29, 167, 23.6, 2.5, 150],
    ['Aluminio 7075-T6', 'metal', 71, 2800, 505, 24, 130, 23.4, 4, 130],
    ['Titanio Ti-6Al-4V', 'metal', 114, 4430, 830, 55, 6.7, 8.6, 25, 400],
    ['Cobre C11000', 'metal', 115, 8890, 69, 100, 388, 17.0, 8, 200],
    ['Latón 70/30', 'metal', 110, 8530, 75, 80, 120, 19.9, 7, 200],
    ['Magnesio AZ31B', 'metal', 45, 1770, 200, 22, 96, 26.0, 4, 120],
    ['Níquel Inconel 718', 'metal', 200, 8190, 1035, 100, 11.4, 13.0, 40, 700],
    ['Tungsteno', 'metal', 400, 19300, 750, 20, 173, 4.5, 40, 1500],
    ['Plomo', 'metal', 14, 11350, 10, 20, 35, 29, 2.5, 100],
    ['Alúmina Al₂O₃', 'cerámico', 380, 3980, 350, 4.2, 30, 7.4, 20, 1500],
    ['Circonia (PSZ)', 'cerámico', 205, 6000, 800, 8, 2.5, 10.5, 40, 1200],
    ['Carburo de silicio SiC', 'cerámico', 410, 3200, 400, 4.0, 120, 4.3, 30, 1500],
    ['Nitruro de silicio Si₃N₄', 'cerámico', 300, 3300, 700, 5.0, 25, 3.3, 40, 1300],
    ['Vidrio de sílice-sosa-cal', 'cerámico', 69, 2500, 69, 0.75, 1.0, 9.0, 1.5, 450],
    ['Vidrio borosilicato', 'cerámico', 64, 2230, 69, 0.77, 1.4, 3.3, 3, 500],
    ['Concreto', 'cerámico', 30, 2400, 4, 0.5, 1.5, 11, 0.08, 400],
    ['Diamante', 'cerámico', 1000, 3510, 1050, 5, 2000, 1.0, 2e6, 1000],
    ['Polietileno de alta densidad', 'polímero', 1.08, 960, 28, 2, 0.48, 106, 1.8, 90],
    ['Polipropileno', 'polímero', 1.5, 905, 32, 3, 0.12, 100, 1.8, 100],
    ['PVC rígido', 'polímero', 3.1, 1400, 45, 2.5, 0.18, 70, 1.5, 70],
    ['Poliestireno', 'polímero', 3.0, 1050, 40, 1.0, 0.13, 70, 2, 70],
    ['PMMA (acrílico)', 'polímero', 3.0, 1190, 60, 1.2, 0.19, 75, 3, 80],
    ['Policarbonato', 'polímero', 2.4, 1200, 62, 2.5, 0.20, 68, 4, 120],
    ['Nailon 6,6', 'polímero', 2.8, 1140, 60, 3, 0.24, 80, 4, 110],
    ['PTFE (teflón)', 'polímero', 0.5, 2170, 15, 1.5, 0.25, 130, 15, 250],
    ['PEEK', 'polímero', 3.9, 1310, 95, 4, 0.25, 50, 90, 250],
    ['Epoxi', 'polímero', 2.4, 1200, 60, 0.6, 0.19, 60, 6, 130],
    ['Caucho natural (vulcanizado)', 'polímero', 0.003, 920, 20, 0.1, 0.13, 220, 2.5, 80],
    ['CFRP (carbono/epoxi, cuasiisótropo)', 'compuesto', 70, 1550, 600, 25, 5, 2, 40, 140],
    ['GFRP (vidrio/epoxi, cuasiisótropo)', 'compuesto', 25, 1900, 200, 20, 0.4, 15, 8, 140],
    ['Madera de pino (a la fibra)', 'natural', 10, 500, 40, 4, 0.14, 4, 0.8, 100],
    ['Bambú', 'natural', 18, 700, 60, 5, 0.15, 3, 0.8, 100],
    ['Hueso cortical', 'natural', 18, 1900, 120, 5, 0.4, 10, 0, 50],
    ['Espuma de poliuretano rígida', 'espuma', 0.02, 70, 0.6, 0.02, 0.025, 80, 5, 100]
  ].map((r) => ({ name: r[0], cls: r[1], E: r[2], rho: r[3], sy: r[4], KIc: r[5], k: r[6], alpha: r[7], cost: r[8], Tmax: r[9] }));

  if (typeof module !== 'undefined' && module.exports) module.exports = MAT;
})();
