/* ===================================================================
   30-optics.js — Biblioteca científica del curso (EM.op)
   Constantes, números complejos, materiales (Sellmeier de catálogo),
   Fresnel y multicapas (matrices de transferencia), difracción
   (Bessel, integrales de Fresnel), radiación de cuerpo negro y
   colorimetría CIE, óptica paraxial (ABCD), haces gaussianos y
   cavidades, polarización (Jones y Stokes), dispersión de Mie,
   guías y fibras, óptica no lineal y estadística de fotones.
   Todo funciona en Node para las pruebas de tests/validar.js.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const CIE = EM.CIE || (typeof require !== 'undefined' ? require('./29-cie.js') : null);
  const METALS = EM.METALS || (typeof require !== 'undefined' ? require('./29-metals.js') : null);
  const OP = (EM.op = {});
  const PI = Math.PI;

  /* ---------- Constantes (SI 2019 exactas y CODATA 2018) ---------- */
  OP.c = 299792458;
  OP.h = 6.62607015e-34;
  OP.hbar = OP.h / (2 * PI);
  OP.kB = 1.380649e-23;
  OP.e = 1.602176634e-19;
  OP.eps0 = 8.8541878128e-12;
  OP.mu0 = 1.25663706212e-6;
  OP.me = 9.1093837015e-31;
  OP.Z0 = 376.730313668;
  OP.NA = 6.02214076e23;
  OP.AU = 149597870700;
  OP.sigmaSB = (2 * Math.pow(PI, 5) * Math.pow(OP.kB, 4)) / (15 * OP.c * OP.c * Math.pow(OP.h, 3));
  /* x = 5(1 − e^{−x}) → constante de Wien b = hc/(k x) */
  OP.WIEN_X = (function () { let x = 5; for (let i = 0; i < 60; i++) x = 5 * (1 - Math.exp(-x)); return x; })();
  OP.wienB = (OP.h * OP.c) / (OP.kB * OP.WIEN_X);
  OP.KM = 683; /* lm/W, eficacia luminosa máxima (definición de la candela) */
  OP.eV = (lamNm) => (OP.h * OP.c) / (lamNm * 1e-9) / OP.e;

  /* ---------- Números complejos como [re, im] ---------- */
  const C = (OP.C = {
    of: (a, b = 0) => [a, b],
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div(a, b) { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    scale: (a, s) => [a[0] * s, a[1] * s],
    conj: (a) => [a[0], -a[1]],
    abs2: (a) => a[0] * a[0] + a[1] * a[1],
    abs: (a) => Math.hypot(a[0], a[1]),
    arg: (a) => Math.atan2(a[1], a[0]),
    exp(a) { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
    cis: (t) => [Math.cos(t), Math.sin(t)],
    inv(a) { const d = a[0] * a[0] + a[1] * a[1]; return [a[0] / d, -a[1] / d]; },
    /* raíz principal (parte real ≥ 0; en el eje real negativo, parte imaginaria > 0) */
    sqrt(a) {
      const r = Math.hypot(a[0], a[1]);
      const re = Math.sqrt(Math.max(0, (r + a[0]) / 2));
      let im = Math.sqrt(Math.max(0, (r - a[0]) / 2));
      if (a[1] < 0) im = -im;
      return [re, im];
    }
  });
  const cx = (n) => (Array.isArray(n) ? n : [n, 0]);
  OP.cx = cx;
  const m2 = (A, B) => [
    [C.add(C.mul(A[0][0], B[0][0]), C.mul(A[0][1], B[1][0])), C.add(C.mul(A[0][0], B[0][1]), C.mul(A[0][1], B[1][1]))],
    [C.add(C.mul(A[1][0], B[0][0]), C.mul(A[1][1], B[1][0])), C.add(C.mul(A[1][0], B[0][1]), C.mul(A[1][1], B[1][1]))]
  ];
  OP.cmat2 = m2;

  /* ---------- Matemática ---------- */
  OP.sinc = (x) => (Math.abs(x) < 1e-8 ? 1 - (x * x) / 6 : Math.sin(x) / x);
  OP.bisect = function (f, a, b, tol = 1e-13, it = 300) {
    let fa = f(a);
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      if (Math.abs(b - a) < tol * Math.max(1, Math.abs(a))) break;
    }
    return 0.5 * (a + b);
  };
  /* Mínimo de una función unimodal (sección áurea) */
  OP.golden = function (f, a, b, tol = 1e-12) {
    const r = (Math.sqrt(5) - 1) / 2;
    let c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d);
    for (let i = 0; i < 200 && Math.abs(b - a) > tol; i++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); }
      else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); }
    }
    return 0.5 * (a + b);
  };
  OP.simpson = function (f, a, b, n = 400) {
    if (n % 2) n++;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return (s * h) / 3;
  };
  OP.rk4 = function (f, t, y, h) {
    const n = y.length, k1 = f(t, y), y2 = new Array(n), y3 = new Array(n), y4 = new Array(n), out = new Array(n);
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k1[i];
    const k2 = f(t + 0.5 * h, y2);
    for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * h * k2[i];
    const k3 = f(t + 0.5 * h, y3);
    for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
    const k4 = f(t + h, y4);
    for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  };

  /* Bessel J_n(x), n entero: J_n(x) = (1/2π)∮ cos(nτ − x sen τ) dτ. La regla del trapecio
     sobre un período converge exponencialmente: con N > |x| + n + 40 el error es de redondeo. */
  OP.besselJ = function (n, x) {
    if (n < 0) return (n % 2 ? -1 : 1) * OP.besselJ(-n, x);
    const N = 2 * (Math.max(24, Math.ceil(0.6 * Math.abs(x) + 0.5 * n) + 30));
    let s = 0;
    for (let k = 0; k < N; k++) { const t = (2 * PI * k) / N; s += Math.cos(n * t - x * Math.sin(t)); }
    return s / N;
  };
  /* Bessel modificada K_n(x) = ∫₀^∞ e^{−x cosh t} cosh(nt) dt (trapecio, integrando entero y par) */
  OP.besselK = function (n, x) {
    const h = 0.05;
    let s = 0.5 * Math.exp(-x);
    for (let k = 1; k < 20000; k++) {
      const t = k * h, e = -x * Math.cosh(t) + Math.abs(n) * t;
      if (e < -745 && x * Math.cosh(t) > Math.abs(n) * t + 745) break;
      s += 0.5 * (Math.exp(-x * Math.cosh(t) + n * t) + Math.exp(-x * Math.cosh(t) - n * t));
    }
    return s * h;
  };
  /* Ceros de J_n (aproximación de McMahon y Newton) */
  OP.besselJzero = function (n, k) {
    const b = (k + n / 2 - 0.25) * PI, mu = 4 * n * n;
    let x = b - (mu - 1) / (8 * b) - (4 * (mu - 1) * (7 * mu - 31)) / (3 * Math.pow(8 * b, 3));
    for (let i = 0; i < 50; i++) {
      const j = OP.besselJ(n, x), dj = 0.5 * (OP.besselJ(n - 1, x) - OP.besselJ(n + 1, x));
      const dx = j / dj;
      x -= dx;
      if (Math.abs(dx) < 1e-15 * x) break;
    }
    return x;
  };
  /* Integrales de Fresnel C(x) = ∫₀ˣ cos(πt²/2)dt, S(x) = ∫₀ˣ sen(πt²/2)dt
     (serie de potencias para |x| ≤ 1.8; fracción continua de Lentz para |x| > 1.8, como en Numerical Recipes) */
  OP.fresnelCS = function (x) {
    const ax = Math.abs(x);
    let c = 0, s = 0;
    if (ax < 1e-300) return [0, 0];
    if (ax <= 1.8) {
      const u = (PI * ax * ax) / 2;
      let p = ax;
      for (let n = 0; n < 80; n++) {
        const term = p / (2 * n + 1);
        if (n % 2 === 0) c += ((n / 2) % 2 ? -1 : 1) * term;
        else s += (((n - 1) / 2) % 2 ? -1 : 1) * term;
        p *= u / (n + 1);
        if (n > u && term < 1e-18) break;
      }
    } else {
      const pix2 = PI * ax * ax;
      let b = [1, -pix2], cc = [1e300, 0], d = C.inv(b), h = d, n = -1;
      for (let k = 2; k <= 500; k++) {
        n += 2;
        const a = -n * (n + 1);
        b = C.add(b, [4, 0]);
        d = C.inv(C.add(C.scale(d, a), b));
        cc = C.add(b, C.div([a, 0], cc));
        const del = C.mul(cc, d);
        h = C.mul(h, del);
        if (Math.abs(del[0] - 1) + Math.abs(del[1]) < 1e-16) break;
      }
      h = C.mul([ax, -ax], h);
      const cs = C.mul([0.5, 0.5], C.sub([1, 0], C.mul([Math.cos(0.5 * pix2), Math.sin(0.5 * pix2)], h)));
      c = cs[0]; s = cs[1];
    }
    return x < 0 ? [-c, -s] : [c, s];
  };
  /* Polinomios de Hermite (físicos) y de Laguerre generalizados */
  OP.hermite = function (n, x) {
    if (n === 0) return 1;
    let h0 = 1, h1 = 2 * x;
    for (let k = 1; k < n; k++) { const h2 = 2 * x * h1 - 2 * k * h0; h0 = h1; h1 = h2; }
    return h1;
  };
  OP.laguerre = function (p, l, x) {
    if (p === 0) return 1;
    let L0 = 1, L1 = 1 + l - x;
    for (let k = 1; k < p; k++) { const L2 = ((2 * k + 1 + l - x) * L1 - (k + l) * L0) / (k + 1); L0 = L1; L1 = L2; }
    return L1;
  };
  OP.factorial = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

  /* ================= Materiales ================= */
  /* Líneas de Fraunhofer y de laboratorio (nm, en aire) */
  OP.LINES = { i: 365.0146, h: 404.6561, g: 435.8343, F1: 479.9914, F: 486.1327, e: 546.0740, d: 587.5618, D: 589.2938, C1: 643.8469, C: 656.2725, r: 706.5188, s: 852.11, t: 1013.98 };
  /* Sellmeier: n² − 1 = Σ Bᵢλ²/(λ² − Cᵢ), λ en µm */
  const SELL = {
    'N-BK7': { name: 'N-BK7 (crown de borosilicato)', B: [1.03961212, 0.231792344, 1.01046945], C: [0.00600069867, 0.0200179144, 103.560653], src: 'Schott' },
    'N-K5': { name: 'N-K5 (crown)', B: [1.08511833, 0.199562005, 0.930511663], C: [0.00661099503, 0.024110866, 111.982777], src: 'Schott' },
    'N-F2': { name: 'N-F2 (flint)', B: [1.39757037, 0.159201403, 1.2686543], C: [0.00995906143, 0.0546931752, 119.248346], src: 'Schott' },
    'N-SF11': { name: 'N-SF11 (flint denso)', B: [1.73759695, 0.313747346, 1.89878101], C: [0.013188707, 0.0623068142, 155.23629], src: 'Schott' },
    silica: { name: 'Sílice fundida', B: [0.6961663, 0.4079426, 0.8974794], C: [0.0684043 * 0.0684043, 0.1162414 * 0.1162414, 9.896161 * 9.896161], src: 'Malitson 1965' },
    CaF2: { name: 'Fluorita (CaF₂)', B: [0.5675888, 0.4710914, 3.8484723], C: [0.050263605 * 0.050263605, 0.1003909 * 0.1003909, 34.649040 * 34.649040], src: 'Malitson 1963' },
    zafiro: { name: 'Zafiro (rayo ordinario)', B: [1.4313493, 0.65054713, 5.3414021], C: [0.0726631 * 0.0726631, 0.1193242 * 0.1193242, 18.028251 * 18.028251], src: 'Malitson 1962' },
    agua: { name: 'Agua a 20 °C', B: [5.684027565e-1, 1.726177391e-1, 2.086189578e-2, 1.130748688e-1], C: [5.101829712e-3, 1.821153936e-2, 2.620722293e-2, 1.069792721e1], src: 'Daimon y Masumura 2007' },
    diamante: { name: 'Diamante', B: [0.3306, 4.3356], C: [0.175 * 0.175, 0.106 * 0.106], src: 'Peter 1923' }
  };
  OP.SELL = SELL;
  OP.nSell = function (m, lamUm) {
    const l2 = lamUm * lamUm;
    let s = m.A || 1;
    for (let i = 0; i < m.B.length; i++) s += (m.B[i] * l2) / (l2 - m.C[i]);
    return Math.sqrt(s);
  };
  /* Derivadas analíticas de n(λ) para Sellmeier (λ en µm): [n, dn/dλ, d²n/dλ²] */
  OP.nSellD = function (m, lamUm) {
    const L = lamUm, l2 = L * L;
    let n2 = m.A || 1, d1 = 0, d2 = 0;
    for (let i = 0; i < m.B.length; i++) {
      const B = m.B[i], c = m.C[i], q = l2 - c;
      n2 += (B * l2) / q;
      d1 += (-2 * B * c * L) / (q * q);
      d2 += (2 * B * c * (3 * l2 + c)) / (q * q * q);
    }
    const n = Math.sqrt(n2), dn = d1 / (2 * n), ddn = (d2 - 2 * dn * dn) / (2 * n);
    return [n, dn, ddn];
  };
  /* Aire seco normal (15 °C, 101 325 Pa): Peck y Reeder 1972, σ = 1/λ en µm⁻¹ */
  OP.nAir = function (lamUm) {
    const s2 = 1 / (lamUm * lamUm);
    return 1 + 1e-8 * (8060.51 + 2480990 / (132.274 - s2) + 17455.7 / (39.32957 - s2));
  };
  /* Cristales uniaxiales [nₒ, nₑ](λ µm) */
  OP.UNI = {
    calcita: { name: 'Calcita', sign: -1, src: 'Ghosh 1999', f: (L) => { const l2 = L * L; return [Math.sqrt(1.73358749 + (0.96464345 * l2) / (l2 - 1.94325203e-2) + (1.82831454 * l2) / (l2 - 120)), Math.sqrt(1.35859695 + (0.82427830 * l2) / (l2 - 1.06689543e-2) + (0.14429128 * l2) / (l2 - 120))]; } },
    cuarzo: { name: 'Cuarzo cristalino', sign: 1, src: 'Ghosh 1999', f: (L) => { const l2 = L * L; return [Math.sqrt(1.28604141 + (1.07044083 * l2) / (l2 - 1.00585997e-2) + (1.10202242 * l2) / (l2 - 100)), Math.sqrt(1.28851804 + (1.09509924 * l2) / (l2 - 1.02101864e-2) + (1.15662475 * l2) / (l2 - 100))]; } },
    BBO: { name: 'β-borato de bario (BBO)', sign: -1, src: 'Eimerl et al. 1987', f: (L) => { const l2 = L * L; return [Math.sqrt(2.7359 + 0.01878 / (l2 - 0.01822) - 0.01354 * l2), Math.sqrt(2.3753 + 0.01224 / (l2 - 0.01667) - 0.01516 * l2)]; } }
  };
  /* Metales: índice complejo n + iκ interpolado de la tabla (Johnson y Christy; Rakić) */
  OP.metal = function (name, lamNm) {
    const m = METALS.data[name], t = Math.max(0, Math.min(METALS.n - 1.000001, (lamNm - METALS.l0) / METALS.dl)), i = Math.floor(t), f = t - i;
    return [m.n[i] + f * (m.n[i + 1] - m.n[i]), m.k[i] + f * (m.k[i + 1] - m.k[i])];
  };
  OP.METALS = METALS;
  /* Índice extraordinario efectivo para propagación a un ángulo θ del eje óptico */
  OP.nTheta = (no, ne, th) => 1 / Math.sqrt((Math.cos(th) * Math.cos(th)) / (no * no) + (Math.sin(th) * Math.sin(th)) / (ne * ne));
  /* Ángulo de desplazamiento (walk-off) entre el vector de onda y el de Poynting */
  OP.walkoff = (no, ne, th) => Math.atan(((no * no) / (ne * ne)) * Math.tan(th)) - th;
  /* Índice de un material por nombre */
  OP.n = function (name, lamNm) {
    const L = lamNm / 1000;
    if (SELL[name]) return OP.nSell(SELL[name], L);
    if (name === 'aire') return OP.nAir(L);
    if (OP.UNI[name]) return OP.UNI[name].f(L)[0];
    if (name === 'hielo') return 1.3015 + 0.0029 / (L * L); /* Cauchy ajustado a Warren y Brandt 2008 en el visible */
    return 1;
  };
  OP.abbe = function (name) {
    const L = OP.LINES;
    return (OP.n(name, L.d) - 1) / (OP.n(name, L.F) - OP.n(name, L.C));
  };
  /* Índice de grupo, dispersión de la velocidad de grupo y parámetro de dispersión del material */
  OP.groupIndex = function (m, lamUm) { const [n, dn] = OP.nSellD(m, lamUm); return n - lamUm * dn; };
  /* D = −(λ/c) d²n/dλ² en ps/(nm·km) */
  OP.matDispersion = function (m, lamUm) {
    const [, , ddn] = OP.nSellD(m, lamUm); /* µm⁻² */
    const lam = lamUm * 1e-6, d2 = ddn * 1e12; /* m⁻² */
    return ((-lam / OP.c) * d2) * 1e6; /* s/m² → ps/(nm·km): 1 s/m² = 1e12 ps / (1e9 nm · 1e-3 km) = 1e6 */
  };
  /* GVD β₂ = λ³/(2πc²) d²n/dλ² en ps²/km */
  OP.beta2 = function (m, lamUm) {
    const [, , ddn] = OP.nSellD(m, lamUm);
    const lam = lamUm * 1e-6, d2 = ddn * 1e12;
    return ((lam * lam * lam) / (2 * PI * OP.c * OP.c)) * d2 * 1e27; /* s²/m → ps²/km */
  };

  /* ================= Reflexión y refracción ================= */
  OP.snell = (n1, n2, th) => { const s = (n1 * Math.sin(th)) / n2; return Math.abs(s) > 1 ? NaN : Math.asin(s); };
  OP.critical = (n1, n2) => (n2 < n1 ? Math.asin(n2 / n1) : NaN);
  OP.brewster = (n1, n2) => Math.atan(n2 / n1);
  /* Fresnel en una interfaz (n₂ puede ser complejo n + iκ). Convención de Hecht y de tmm:
     r_s = (n₁cosθ₁ − n₂cosθ₂)/(n₁cosθ₁ + n₂cosθ₂),  r_p = (n₂cosθ₁ − n₁cosθ₂)/(n₂cosθ₁ + n₁cosθ₂). */
  OP.fresnel = function (n1, n2, th) {
    n1 = cx(n1); n2 = cx(n2);
    const s = C.scale(n1, Math.sin(th)), s2 = C.mul(s, s);
    const n1s = C.mul(n1, n1), n2s = C.mul(n2, n2);
    const nc1 = C.sqrt(C.sub(n1s, s2)), nc2 = C.sqrt(C.sub(n2s, s2));
    const rs = C.div(C.sub(nc1, nc2), C.add(nc1, nc2));
    const ts = C.div(C.scale(nc1, 2), C.add(nc1, nc2));
    const a = C.mul(n2s, nc1), b = C.mul(n1s, nc2), dp = C.add(a, b);
    const rp = C.div(C.sub(a, b), dp);
    const tp = C.div(C.scale(C.mul(C.mul(n1, n2), nc1), 2), dp);
    const Rs = C.abs2(rs), Rp = C.abs2(rp);
    const Ts = (C.abs2(ts) * nc2[0]) / nc1[0];
    const cf = C.div(nc2, n2), ci = C.div(nc1, n1);
    const Tp = (C.abs2(tp) * C.mul(n2, C.conj(cf))[0]) / C.mul(n1, C.conj(ci))[0];
    return { rs, rp, ts, tp, Rs, Rp, Ts, Tp, R: (Rs + Rp) / 2, T: (Ts + Tp) / 2, nc1, nc2 };
  };
  /* Profundidad de penetración (1/e de la amplitud) de la onda evanescente en reflexión total */
  OP.evanescentDepth = (n1, n2, th, lam) => lam / (2 * PI * Math.sqrt(n1 * n1 * Math.sin(th) * Math.sin(th) - n2 * n2));
  /* Desfases de reflexión total interna: δ = arg r */
  OP.tirPhase = function (n1, n2, th) { const f = OP.fresnel(n1, n2, th); return [C.arg(f.rs), C.arg(f.rp)]; };

  /* Multicapas por matrices de transferencia (algoritmo de Byrnes, idéntico a tmm.coh_tmm).
     ns: índices [ambiente, capa1, …, sustrato]; ds: espesores (los extremos se ignoran); λ y d en las mismas unidades. */
  OP.tmm = function (pol, ns, ds, th0, lam) {
    const N = ns.length;
    ns = ns.map(cx);
    const s = C.scale(ns[0], Math.sin(th0)), s2 = C.mul(s, s);
    const nc = ns.map((n) => {
      let v = C.sqrt(C.sub(C.mul(n, n), s2));
      if (v[1] < -1e-14 || (Math.abs(v[1]) <= 1e-14 && v[0] < 0)) v = C.scale(v, -1);
      return v;
    });
    const rI = (i, j) => {
      if (pol === 's') return C.div(C.sub(nc[i], nc[j]), C.add(nc[i], nc[j]));
      const a = C.mul(C.mul(ns[j], ns[j]), nc[i]), b = C.mul(C.mul(ns[i], ns[i]), nc[j]);
      return C.div(C.sub(a, b), C.add(a, b));
    };
    const tI = (i, j) => {
      if (pol === 's') return C.div(C.scale(nc[i], 2), C.add(nc[i], nc[j]));
      const a = C.mul(C.mul(ns[j], ns[j]), nc[i]), b = C.mul(C.mul(ns[i], ns[i]), nc[j]);
      return C.div(C.scale(C.mul(C.mul(ns[i], ns[j]), nc[i]), 2), C.add(a, b));
    };
    const r01 = rI(0, 1), t01 = tI(0, 1), it01 = C.inv(t01);
    let M = [[it01, C.mul(r01, it01)], [C.mul(r01, it01), it01]];
    for (let i = 1; i < N - 1; i++) {
      const dl = C.scale(nc[i], (2 * PI * ds[i]) / lam);
      const dlim = Math.min(dl[1], 35); /* capas opacas: igual que tmm */
      const em = C.exp([dlim, -dl[0]]), ep = C.exp([-dlim, dl[0]]);
      const r = rI(i, i + 1), it = C.inv(tI(i, i + 1));
      M = m2(M, [[C.mul(em, it), C.mul(C.mul(em, r), it)], [C.mul(C.mul(ep, r), it), C.mul(ep, it)]]);
    }
    const t = C.inv(M[0][0]), r = C.div(M[1][0], M[0][0]);
    const R = C.abs2(r);
    let T;
    if (pol === 's') T = (C.abs2(t) * nc[N - 1][0]) / nc[0][0];
    else {
      const cf = C.div(nc[N - 1], ns[N - 1]), ci = C.div(nc[0], ns[0]);
      T = (C.abs2(t) * C.mul(ns[N - 1], C.conj(cf))[0]) / C.mul(ns[0], C.conj(ci))[0];
    }
    return { r, t, R, T, A: 1 - R - T };
  };
  OP.tmmU = function (ns, ds, th0, lam) {
    const a = OP.tmm('s', ns, ds, th0, lam), b = OP.tmm('p', ns, ds, th0, lam);
    return { R: (a.R + b.R) / 2, T: (a.T + b.T) / 2, Rs: a.R, Rp: b.R, Ts: a.T, Tp: b.T };
  };
  /* Pila de Bragg (HL)^N H a incidencia normal: reflectancia máxima y ancho relativo de la banda */
  OP.braggPeak = function (n0, nH, nL, ns, N) {
    const Y = (Math.pow(nH / nL, 2 * N) * nH * nH) / ns; /* admitancia de la pila (HL)^N H sobre el sustrato (Macleod) */
    return Math.pow((n0 - Y) / (n0 + Y), 2);
  };
  OP.braggWidth = (nH, nL) => (4 / PI) * Math.asin((nH - nL) / (nH + nL)); /* Δλ/λ₀ en unidades de frecuencia (Δg) */
  /* Fabry–Pérot sin pérdidas: T = 1/(1 + F sen²(δ/2)) */
  OP.fpT = (R, delta) => 1 / (1 + ((4 * R) / ((1 - R) * (1 - R))) * Math.pow(Math.sin(delta / 2), 2));
  OP.finesse = (R) => (PI * Math.sqrt(R)) / (1 - R);

  /* ================= Difracción ================= */
  OP.slitI = (a, lam, th) => Math.pow(OP.sinc((PI * a * Math.sin(th)) / lam), 2);
  /* Factor de interferencia de N rendijas normalizado a 1 en los máximos principales */
  OP.gratingFactor = function (N, alpha) {
    const s = Math.sin(alpha);
    if (Math.abs(s) < 1e-9) return 1;
    const v = Math.sin(N * alpha) / (N * s);
    return v * v;
  };
  OP.nSlitI = (N, a, d, lam, th) => OP.slitI(a, lam, th) * OP.gratingFactor(N, (PI * d * Math.sin(th)) / lam);
  OP.airy = (x) => { if (Math.abs(x) < 1e-6) return 1; const v = (2 * OP.besselJ(1, x)) / x; return v * v; };
  /* Energía encerrada en un círculo de radio x del patrón de Airy: 1 − J₀² − J₁² */
  OP.airyEncircled = (x) => 1 - Math.pow(OP.besselJ(0, x), 2) - Math.pow(OP.besselJ(1, x), 2);
  OP.RAYLEIGH = 3.831705970207512 / PI; /* 1.21967 */
  /* Borde recto (Fresnel): v = y√(2/(λz)) */
  OP.edgeI = function (v) {
    const [c, s] = OP.fresnelCS(v);
    return 0.5 * (Math.pow(c + 0.5, 2) + Math.pow(s + 0.5, 2));
  };
  /* Rendija de anchura a a distancia z (Fresnel 1D), x posición en la pantalla */
  OP.slitFresnelI = function (x, a, lam, z) {
    const k = Math.sqrt(2 / (lam * z));
    const [c1, s1] = OP.fresnelCS(k * (x + a / 2)), [c2, s2] = OP.fresnelCS(k * (x - a / 2));
    return 0.5 * (Math.pow(c1 - c2, 2) + Math.pow(s1 - s2, 2));
  };
  /* Intensidad en el eje detrás de una abertura circular de radio a (Fresnel): 4 sen²(πa²/2λz) */
  OP.circOnAxis = (a, lam, z) => 4 * Math.pow(Math.sin((PI * a * a) / (2 * lam * z)), 2);
  OP.fresnelNumber = (a, lam, z) => (a * a) / (lam * z);
  /* Placa zonal: radio de la zona m y focos */
  OP.zoneRadius = (m, f, lam) => Math.sqrt(m * lam * f + Math.pow((m * lam) / 2, 2));
  /* Visibilidad de franjas para una fuente circular uniforme (van Cittert–Zernike) */
  OP.vczDisk = (d, theta, lam) => { const x = (PI * d * theta) / lam; return Math.abs(x) < 1e-9 ? 1 : Math.abs((2 * OP.besselJ(1, x)) / x); };
  /* MTF de un sistema limitado por difracción con pupila circular, ν normalizada a la frecuencia de corte */
  OP.mtfCirc = (v) => (v >= 1 ? 0 : v <= 0 ? 1 : (2 / PI) * (Math.acos(v) - v * Math.sqrt(1 - v * v)));

  /* ================= Radiación y colorimetría ================= */
  /* Radiancia espectral de Planck B_λ (W m⁻² sr⁻¹ m⁻¹), λ en m */
  OP.planck = function (lam, T) {
    const x = (OP.h * OP.c) / (lam * OP.kB * T);
    if (x > 700) return 0;
    return (2 * OP.h * OP.c * OP.c) / Math.pow(lam, 5) / Math.expm1(x);
  };
  OP.wienPeak = (T) => OP.wienB / T;
  /* Fracción de la emitancia de un cuerpo negro entre 0 y λ (serie de Planck, exacta) */
  OP.bbFraction = function (lam, T) {
    const x = (OP.h * OP.c) / (lam * OP.kB * T);
    let s = 0;
    for (let n = 1; n < 400; n++) {
      const nx = n * x, t = (Math.exp(-nx) / n) * (nx * nx * nx + 3 * nx * nx + 6 * nx + 6) / (n * n * n);
      s += t;
      if (t < 1e-17 * s) break;
    }
    return (15 / Math.pow(PI, 4)) * s;
  };
  /* Funciones de igualación de color CIE 1931 (interpolación lineal de la tabla cada 5 nm) */
  OP.cmf = function (lamNm) {
    if (!CIE || lamNm < CIE.l0 || lamNm > CIE.l0 + CIE.dl * (CIE.n - 1)) return [0, 0, 0];
    const t = (lamNm - CIE.l0) / CIE.dl, i = Math.min(CIE.n - 2, Math.floor(t)), f = t - i;
    return [CIE.x[i] + f * (CIE.x[i + 1] - CIE.x[i]), CIE.y[i] + f * (CIE.y[i + 1] - CIE.y[i]), CIE.z[i] + f * (CIE.z[i + 1] - CIE.z[i])];
  };
  OP.V = (lamNm) => OP.cmf(lamNm)[1];
  OP.d65 = function (lamNm) {
    if (lamNm < CIE.l0 || lamNm > CIE.l0 + CIE.dl * (CIE.n - 1)) return 0;
    const t = (lamNm - CIE.l0) / CIE.dl, i = Math.min(CIE.n - 2, Math.floor(t)), f = t - i;
    return CIE.d65[i] + f * (CIE.d65[i + 1] - CIE.d65[i]);
  };
  /* XYZ de un espectro S(λ nm) en la rejilla de la tabla (suma de rectángulos, Δλ = 5 nm) */
  OP.specXYZ = function (S) {
    let X = 0, Y = 0, Z = 0;
    for (let i = 0; i < CIE.n; i++) {
      const l = CIE.l0 + i * CIE.dl, s = S(l);
      X += s * CIE.x[i]; Y += s * CIE.y[i]; Z += s * CIE.z[i];
    }
    return [X * CIE.dl, Y * CIE.dl, Z * CIE.dl];
  };
  /* Color de un objeto con reflectancia o transmitancia ρ(λ) bajo el iluminante D65 (Y = 1 para ρ ≡ 1) */
  OP.reflXYZ = function (rho, illum) {
    const I = illum || OP.d65;
    let X = 0, Y = 0, Z = 0, N = 0;
    for (let i = 0; i < CIE.n; i++) {
      const l = CIE.l0 + i * CIE.dl, e = I(l), r = rho(l);
      X += e * r * CIE.x[i]; Y += e * r * CIE.y[i]; Z += e * r * CIE.z[i]; N += e * CIE.y[i];
    }
    return [X / N, Y / N, Z / N];
  };
  OP.xy = (XYZ) => { const s = XYZ[0] + XYZ[1] + XYZ[2]; return [XYZ[0] / s, XYZ[1] / s]; };
  /* sRGB (IEC 61966-2-1): XYZ (Y = 1 blanco) → RGB lineal → con gamma, en [0, 1] */
  OP.xyz2lin = (X, Y, Z) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
  OP.gammaS = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
  OP.xyz2srgb = function (X, Y, Z, o = {}) {
    let rgb = OP.xyz2lin(X, Y, Z);
    let out = false;
    if (Math.min(rgb[0], rgb[1], rgb[2]) < 0) {
      out = true;
      if (o.desat !== false) { const w = -Math.min(rgb[0], rgb[1], rgb[2]); rgb = rgb.map((v) => v + w); }
    }
    const mx = Math.max(rgb[0], rgb[1], rgb[2]);
    if (mx > 1) { out = true; if (o.scale !== false) rgb = rgb.map((v) => v / mx); }
    const g = rgb.map((v) => Math.max(0, Math.min(1, OP.gammaS(Math.max(0, v)))));
    g.outOfGamut = out;
    return g;
  };
  OP.rgb255 = (g) => g.map((v) => Math.round(255 * v));
  /* Color de presentación de una luz monocromática de λ nm (desaturada al gamut sRGB, brillo normalizado) */
  OP.lambdaRGB = function (lamNm, bright = 1, floor = 0) {
    const [x, y, z] = OP.cmf(lamNm);
    let rgb = OP.xyz2lin(x, y, z);
    const w = -Math.min(0, rgb[0], rgb[1], rgb[2]);
    rgb = rgb.map((v) => v + w);
    const mx = Math.max(rgb[0], rgb[1], rgb[2], 1e-12);
    /* el brillo sigue a la luminancia relativa para que los extremos del espectro se oscurezcan */
    const lum = y <= 0 ? 0 : Math.min(1, floor + (1 - floor) * Math.pow(y / 0.25, 0.5));
    return rgb.map((v) => Math.round(255 * OP.gammaS(Math.max(0, (v / mx) * lum * bright))));
  };
  /* Temperatura de color correlacionada (McCamy 1992) */
  OP.mcCamy = function (x, y) { const n = (x - 0.332) / (0.1858 - y); return 449 * n * n * n + 3525 * n * n + 6823.3 * n + 5520.33; };
  /* xy de un cuerpo negro (integración sobre la tabla CIE) */
  OP.planckXY = (T) => OP.xy(OP.specXYZ((l) => OP.planck(l * 1e-9, T)));
  /* Eficacia luminosa de la radiación (lm/W) de un espectro S(λ nm) dado su flujo radiante total */
  OP.efficacyBB = function (T) {
    /* Integral fotópica fina (1 nm, Simpson) sobre la tabla interpolada / emitancia total σT⁴/π */
    const f = (l) => OP.planck(l * 1e-9, T) * OP.V(l);
    const Iv = OP.simpson(f, 380, 780, 400) * 1e-9;
    const tot = (OP.sigmaSB * Math.pow(T, 4)) / PI;
    return (OP.KM * Iv) / tot;
  };
  /* Ley inversa del cuadrado y del coseno: E = I cos θ / r² */
  OP.illuminance = (I, r, th) => (I * Math.cos(th)) / (r * r);
  /* Intensidad (irradiancia) de una onda plana: I = ½ c n ε₀ E₀² */
  OP.irradiance = (E0, n = 1) => 0.5 * OP.c * n * OP.eps0 * E0 * E0;
  OP.E0fromI = (I, n = 1) => Math.sqrt((2 * I) / (OP.c * n * OP.eps0));

  /* ================= Óptica geométrica ================= */
  /* Prisma: desviación para incidencia θ₁ con ángulo de vértice A */
  OP.prismDev = function (n, A, th1) {
    const t1 = Math.asin(Math.sin(th1) / n), t2 = A - t1, s = n * Math.sin(t2);
    if (Math.abs(s) > 1) return NaN;
    return th1 + Math.asin(s) - A;
  };
  OP.prismMin = (n, A) => 2 * Math.asin(n * Math.sin(A / 2)) - A;
  OP.prismNfromMin = (A, dmin) => Math.sin((A + dmin) / 2) / Math.sin(A / 2);
  /* Arcoíris: desviación total tras k reflexiones internas y ángulo de Descartes */
  OP.rainbowD = function (n, th, k) { const t = Math.asin(Math.sin(th) / n); return 2 * (th - t) + k * (PI - 2 * t); };
  OP.rainbowTh = (n, k) => Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2))));
  /* Ángulo del arco medido desde el punto antisolar */
  OP.rainbowAngle = function (n, k) {
    const D = OP.rainbowD(n, OP.rainbowTh(n, k), k);
    let a = (D % (2 * PI)) - PI;
    return Math.abs(a);
  };
  /* Lente gruesa o delgada en un medio nm: devuelve la distancia focal efectiva (radios con signo cartesiano) */
  OP.lensmaker = function (n, R1, R2, d = 0, nm = 1) {
    const c1 = isFinite(R1) ? 1 / R1 : 0, c2 = isFinite(R2) ? 1 / R2 : 0;
    const P1 = (n - nm) * c1, P2 = (nm - n) * c2;
    const P = P1 + P2 - (d / n) * P1 * P2;
    return nm / P;
  };
  /* Lente delgada (convención de Hecht: s_o > 0 objeto real, s_i > 0 imagen real) */
  OP.thinImage = (f, so) => (so * f) / (so - f);
  /* Superficie refractora: n₁/s_o + n₂/s_i = (n₂ − n₁)/R */
  OP.surfImage = (n1, n2, R, so) => n2 / ((n2 - n1) / R - n1 / so);
  /* Matrices ABCD (rayo [y, θ], igual que sympy.physics.optics) */
  OP.M = {
    free: (d) => [[1, d], [0, 1]],
    lens: (f) => [[1, 0], [-1 / f, 1]],
    flat: (n1, n2) => [[1, 0], [0, n1 / n2]],
    curved: (R, n1, n2) => [[1, 0], [(n1 - n2) / (R * n2), n1 / n2]],
    mirror: (R) => [[1, 0], [-2 / R, 1]],
    mul: (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]],
    /* producto en orden de recorrido: chain([M1, M2, M3]) = M3·M2·M1 */
    chain(list) { let M = [[1, 0], [0, 1]]; for (const E of list) M = OP.M.mul(E, M); return M; },
    det: (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0]
  };
  /* Puntos cardinales de un sistema con matriz M del plano de entrada al de salida (posiciones con + hacia la derecha) */
  OP.cardinal = function (M) {
    const A = M[0][0], B = M[0][1], Cc = M[1][0], D = M[1][1], det = A * D - B * Cc;
    if (Math.abs(Cc) < 1e-15) return { afocal: true, f: Infinity, fp: Infinity };
    return {
      fp: -1 / Cc, /* distancia focal imagen (H' → F') */
      f: -det / Cc, /* distancia focal objeto (F → H) */
      BFD: -A / Cc, /* F' respecto del plano de salida */
      FFD: D / Cc, /* F respecto del plano de entrada (negativo: a la izquierda) */
      Hp: (1 - A) / Cc, /* H' respecto del plano de salida */
      H: (D - det) / Cc /* H respecto del plano de entrada */
    };
  };
  /* Profundidad de campo: hiperfocal y límites (f, N, c, s en las mismas unidades) */
  OP.hyperfocal = (f, N, c) => (f * f) / (N * c) + f;
  OP.dof = function (f, N, c, s) {
    const H = OP.hyperfocal(f, N, c);
    const near = (s * (H - f)) / (H + s - 2 * f);
    const far = s >= H ? Infinity : (s * (H - f)) / (H - s);
    return { H, near, far };
  };
  /* Aberración esférica de tercer orden de una lente delgada (Coddington; Jenkins y White):
     1/s'_h − 1/s'_p = h²/(8f³n(n−1)) [ (n+2)/(n−1) q² + 4(n+1)pq + (3n+2)(n−1)p² + n³/(n−1) ] */
  OP.seidelSA = function (n, f, q, p, h) {
    return ((h * h) / (8 * f * f * f * n * (n - 1))) * (((n + 2) / (n - 1)) * q * q + 4 * (n + 1) * p * q + (3 * n + 2) * (n - 1) * p * p + (n * n * n) / (n - 1));
  };
  OP.bestShape = (n, p) => (-2 * (n * n - 1) * p) / (n + 2);
  /* Doblete acromático delgado en contacto: potencias de cada elemento */
  OP.achromat = (f, V1, V2) => ({ f1: (f * (V1 - V2)) / V1, f2: (-f * (V1 - V2)) / V2 });

  /* ================= Haces gaussianos y cavidades ================= */
  OP.gb = {
    zR: (w0, lam, n = 1) => (PI * w0 * w0 * n) / lam,
    w: (z, w0, lam, n = 1) => w0 * Math.sqrt(1 + Math.pow(z / OP.gb.zR(w0, lam, n), 2)),
    R: (z, w0, lam, n = 1) => (z === 0 ? Infinity : z * (1 + Math.pow(OP.gb.zR(w0, lam, n) / z, 2))),
    gouy: (z, w0, lam, n = 1) => Math.atan(z / OP.gb.zR(w0, lam, n)),
    q: (z, w0, lam, n = 1) => [z, OP.gb.zR(w0, lam, n)],
    /* q' = (Aq + B)/(Cq + D) */
    abcd: (M, q) => C.div(C.add(C.scale(q, M[0][0]), [M[0][1], 0]), C.add(C.scale(q, M[1][0]), [M[1][1], 0])),
    /* a partir de q: w, R, cintura w₀ y distancia a la cintura (positiva si está adelante) */
    fromQ(q, lam, n = 1) {
      const iq = C.inv(q); /* 1/q = 1/R − iλ/(πnw²) */
      const w = Math.sqrt(-lam / (PI * n * iq[1]));
      const zR = q[1], w0 = Math.sqrt((lam * zR) / (PI * n));
      return { w, R: iq[0] === 0 ? Infinity : 1 / iq[0], w0, zR, toWaist: -q[0] };
    },
    divergence: (w0, lam, n = 1) => lam / (PI * n * w0)
  };
  /* Cavidad de dos espejos: g₁, g₂, estabilidad, cinturas y espaciado de modos */
  OP.cavity = function (R1, R2, L, lam) {
    const g1 = 1 - L / R1, g2 = 1 - L / R2, gg = g1 * g2;
    const stable = gg > 0 && gg < 1;
    const out = { g1, g2, gg, stable, FSR: OP.c / (2 * L) };
    if (stable) {
      const den = g1 + g2 - 2 * gg;
      out.w0 = Math.sqrt(((lam * L) / PI) * Math.sqrt((gg * (1 - gg)) / (den * den)));
      out.w1 = Math.sqrt(((lam * L) / PI) * Math.sqrt(g2 / (g1 * (1 - gg))));
      out.w2 = Math.sqrt(((lam * L) / PI) * Math.sqrt(g1 / (g2 * (1 - gg))));
      out.z1 = (L * g2 * (1 - g1)) / den; /* cintura medida desde el espejo 1 */
      out.zeta = Math.acos((g1 >= 0 ? 1 : -1) * Math.sqrt(gg)); /* fase de Gouy de ida */
      out.dTrans = (OP.c / (2 * L)) * (out.zeta / PI);
    }
    return out;
  };
  /* Perfiles de modos transversales */
  OP.hgI = (m, n, x, y, w) => { const X = (Math.SQRT2 * x) / w, Y = (Math.SQRT2 * y) / w; const u = OP.hermite(m, X) * OP.hermite(n, Y) * Math.exp(-(x * x + y * y) / (w * w)); return u * u; };
  OP.lgI = (p, l, r, w) => { const s = (2 * r * r) / (w * w); const u = Math.pow(s, Math.abs(l) / 2) * OP.laguerre(p, Math.abs(l), s) * Math.exp(-s / 2); return u * u; };

  /* ================= Láser ================= */
  /* A₂₁/B₂₁ = 8πhν³/c³; cociente estimulada/espontánea en equilibrio térmico 1/(e^{hν/kT} − 1) */
  OP.einsteinAB = (nu) => (8 * PI * OP.h * Math.pow(nu, 3)) / Math.pow(OP.c, 3);
  OP.stimRatio = (nu, T) => 1 / Math.expm1((OP.h * nu) / (OP.kB * T));
  /* Ecuaciones de tasa adimensionales de un láser de cuatro niveles:
     dn/dt = r − n − n·s ;  ds/dt = (s·(n − 1) + β n)/τ  (n = N₂/N_umbral, s = fotones normalizados, tiempo en τ₂, τ = τ_c/τ₂) */
  OP.rateRHS = (r, tau, beta) => (t, y) => [r - y[0] - y[0] * y[1], (y[1] * (y[0] - 1) + beta * y[0]) / tau];
  OP.rateSteady = (r) => (r > 1 ? { n: 1, s: r - 1 } : { n: r, s: 0 });
  /* Oscilaciones de relajación: ω_R ≈ √((r − 1)/τ) y amortiguamiento γ_R = r/2 (en unidades de 1/τ₂) */
  OP.relaxation = (r, tau) => ({ w: Math.sqrt((r - 1) / tau - Math.pow(r / 2, 2)), g: r / 2 });

  /* ================= Polarización (convención de sympy.physics.optics) ================= */
  OP.J = {
    vec: (psi, chi) => [[Math.cos(chi) * Math.cos(psi), -Math.sin(chi) * Math.sin(psi)], [Math.sin(psi) * Math.cos(chi), Math.sin(chi) * Math.cos(psi)]],
    polarizer: (th) => { const c = Math.cos(th), s = Math.sin(th); return [[[c * c, 0], [c * s, 0]], [[c * s, 0], [s * s, 0]]]; },
    /* retardador de fase δ con eje rápido a θ */
    retarder(th, d) {
      const c = Math.cos(th), s = Math.sin(th), e = C.cis(d), ph = C.cis(-d / 2);
      const a = C.add([c * c, 0], C.scale(e, s * s)), b = C.scale(C.sub([1, 0], e), c * s), dd = C.add([s * s, 0], C.scale(e, c * c));
      return [[C.mul(a, ph), C.mul(b, ph)], [C.mul(b, ph), C.mul(dd, ph)]];
    },
    qwp: (th) => OP.J.retarder(th, PI / 2),
    hwp: (th) => OP.J.retarder(th, PI),
    rotator: (a) => [[[Math.cos(a), 0], [-Math.sin(a), 0]], [[Math.sin(a), 0], [Math.cos(a), 0]]],
    apply: (M, v) => [C.add(C.mul(M[0][0], v[0]), C.mul(M[0][1], v[1])), C.add(C.mul(M[1][0], v[0]), C.mul(M[1][1], v[1]))],
    stokes: (v) => {
      const ex = v[0], ey = v[1], p = C.mul(ex, C.conj(ey));
      return [C.abs2(ex) + C.abs2(ey), C.abs2(ex) - C.abs2(ey), 2 * p[0], -2 * p[1]];
    },
    /* elipse: orientación ψ y elipticidad χ (tan χ = b/a, signo de S₃) */
    ellipse: (S) => ({ psi: 0.5 * Math.atan2(S[2], S[1]), chi: 0.5 * Math.asin(Math.max(-1, Math.min(1, S[3] / Math.hypot(S[1], S[2], S[3])))) , p: Math.hypot(S[1], S[2], S[3]) / S[0] })
  };
  /* Matriz de Mueller M = A (J ⊗ J*) A⁻¹, con A coherente con la definición de Stokes de arriba (S₃ = −2 Im ExEy*) */
  OP.mueller = function (J) {
    const kron = [];
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const row = [];
      for (let c = 0; c < 2; c++) for (let d = 0; d < 2; d++) row.push(C.mul(J[a][c], C.conj(J[b][d])));
      kron.push(row);
    }
    const A = [[[1, 0], [0, 0], [0, 0], [1, 0]], [[1, 0], [0, 0], [0, 0], [-1, 0]], [[0, 0], [1, 0], [1, 0], [0, 0]], [[0, 0], [0, 1], [0, -1], [0, 0]]];
    const Ai = [[[0.5, 0], [0.5, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0.5, 0], [0, -0.5]], [[0, 0], [0, 0], [0.5, 0], [0, 0.5]], [[0.5, 0], [-0.5, 0], [0, 0], [0, 0]]];
    const mm = (X, Y) => X.map((r) => Y[0].map((_, c) => r.reduce((s, x, k) => C.add(s, C.mul(x, Y[k][c])), [0, 0])));
    return mm(mm(A, kron), Ai).map((r) => r.map((z) => z[0]));
  };
  /* Poder rotatorio del cuarzo (°/mm) a lo largo del eje óptico */
  OP.quartzRotation = (lamNm) => { const L = lamNm / 1000; return 7.267 / (L * L - 0.0127); }; /* Drude de un término, ajustado a 21.72 °/mm en 589.3 nm */
  /* Retardo de una lámina: Γ = 2π Δn d / λ */
  OP.retardance = (dn, d, lam) => (2 * PI * dn * d) / lam;
  /* Transmitancia entre polarizadores cruzados (lámina a 45°): sen²(Γ/2) */
  OP.crossedT = (G) => Math.pow(Math.sin(G / 2), 2);

  /* ================= Luz en la materia ================= */
  /* Oscilador de Lorentz: ε(ω) = ε∞ + ω_p²/(ω₀² − ω² − iγω)  (convención e^{−iωt}: Im ε > 0 absorbe) */
  OP.lorentzEps = function (w, w0, wp, g, einf = 1) {
    const d = C.div([wp * wp, 0], [w0 * w0 - w * w, -g * w]);
    return [einf + d[0], d[1]];
  };
  OP.nFromEps = (eps) => C.sqrt(eps); /* n + iκ */
  OP.drudeEps = (w, wp, g, einf = 1) => OP.lorentzEps(w, 0, wp, g, einf);
  /* Frecuencia de plasma (rad/s) para densidad electrónica Ne (m⁻³) */
  OP.plasmaW = (Ne) => Math.sqrt((Ne * OP.e * OP.e) / (OP.eps0 * OP.me));
  /* Absorción: coeficiente α = 4πκ/λ; Beer–Lambert T = 10^(−εcl) */
  OP.alphaAbs = (kappa, lam) => (4 * PI * kappa) / lam;
  /* Sección eficaz de Rayleigh de una esfera de radio a: σ = (8π/3) k⁴ a⁶ |(m²−1)/(m²+2)|² */
  OP.rayleighSigma = function (a, lam, m) {
    m = cx(m);
    const m2v = C.mul(m, m), K = C.div(C.sub(m2v, [1, 0]), C.add(m2v, [2, 0]));
    const k = (2 * PI) / lam;
    return ((8 * PI) / 3) * Math.pow(k, 4) * Math.pow(a, 6) * C.abs2(K);
  };
  /* Espesor óptico de Rayleigh de la atmósfera al nivel del mar (Bodhaine et al. 1999), λ en µm */
  OP.tauRayleigh = function (lamUm, P = 101325) {
    const l2 = lamUm * lamUm;
    return (P / 101325) * 0.0021520 * ((1.0455996 - 341.29061 / l2 - 0.90230850 * l2) / (1 + 0.0027059889 / l2 - 85.968563 * l2));
  };
  /* Masa de aire (Kasten y Young 1989), elevación solar h en grados */
  OP.airMass = (h) => 1 / (Math.sin((h * PI) / 180) + 0.50572 * Math.pow(h + 6.07995, -1.6364));

  /* Dispersión de Mie (algoritmo BHMIE de Bohren y Huffman; m = n + iκ, x = 2πa/λ_medio) */
  OP.mie = function (m, x, angles) {
    m = cx(m);
    const mx = C.scale(m, x);
    const nstop = Math.round(x + 4.05 * Math.cbrt(x) + 2);
    const nmx = Math.round(1.1 * Math.max(nstop, C.abs(mx)) + 60);
    /* derivada logarítmica D_n(mx) por recurrencia descendente */
    const D = new Array(nmx + 1).fill(null).map(() => [0, 0]);
    for (let n = nmx; n >= 1; n--) {
      const nm = C.div([n, 0], mx);
      D[n - 1] = C.sub(nm, C.inv(C.add(D[n], nm)));
    }
    /* ψ_n(x) por cocientes r_n = ψ_n/ψ_{n−1} en recurrencia descendente (estable para n > x, como en Wiscombe);
       χ_n por recurrencia ascendente (estable) */
    const NS = nstop + Math.round(Math.sqrt(x)) + 40, r = new Float64Array(NS + 2);
    for (let n = NS; n >= 1; n--) r[n] = 1 / ((2 * n + 1) / x - r[n + 1]);
    const PS = new Float64Array(nstop + 1);
    const p0 = Math.sin(x), p1 = Math.sin(x) / x - Math.cos(x);
    if (Math.abs(p0) >= Math.abs(p1)) { PS[0] = p0; for (let n = 1; n <= nstop; n++) PS[n] = r[n] * PS[n - 1]; }
    else { PS[1] = p1; PS[0] = p1 / r[1]; for (let n = 2; n <= nstop; n++) PS[n] = r[n] * PS[n - 1]; }
    let psi0 = Math.cos(x), psi1 = PS[0], chi0 = -Math.sin(x), chi1 = Math.cos(x);
    let xi1 = [psi1, -chi1];
    let qext = 0, qsca = 0, gsum = 0, an1 = null, bn1 = null;
    let back = [0, 0];
    const ab = [];
    for (let n = 1; n <= nstop; n++) {
      const fn = (2 * n + 1) / (n * (n + 1));
      const psi = PS[n];
      const chi = ((2 * n - 1) * chi1) / x - chi0;
      const xi = [psi, -chi];
      const t1 = C.add(C.div(D[n], m), [n / x, 0]);
      const an = C.div(C.sub(C.scale(t1, psi), [psi1, 0]), C.sub(C.mul(t1, xi), xi1));
      const t2 = C.add(C.mul(m, D[n]), [n / x, 0]);
      const bn = C.div(C.sub(C.scale(t2, psi), [psi1, 0]), C.sub(C.mul(t2, xi), xi1));
      ab.push([an, bn]);
      qext += (2 * n + 1) * (an[0] + bn[0]);
      qsca += (2 * n + 1) * (C.abs2(an) + C.abs2(bn));
      gsum += fn * C.mul(an, C.conj(bn))[0];
      if (n > 1) gsum += (((n - 1) * (n + 1)) / n) * (C.mul(an1, C.conj(an))[0] + C.mul(bn1, C.conj(bn))[0]);
      back = C.add(back, C.scale(C.sub(an, bn), (2 * n + 1) * (n % 2 ? -1 : 1)));
      an1 = an; bn1 = bn;
      psi0 = psi1; psi1 = psi; chi0 = chi1; chi1 = chi; xi1 = [psi1, -chi1];
    }
    const Qext = (2 / (x * x)) * qext, Qsca = (2 / (x * x)) * qsca;
    const g = ((4 / (x * x)) * gsum) / Qsca;
    const Qback = C.abs2(back) / (x * x);
    const out = { Qext, Qsca, Qabs: Qext - Qsca, g, Qback, ab };
    if (angles) {
      /* amplitudes S₁, S₂ para cada ángulo de dispersión */
      out.S = angles.map((th) => {
        const mu = Math.cos(th);
        let p0 = 0, p1 = 1, S1 = [0, 0], S2 = [0, 0];
        for (let n = 1; n <= ab.length; n++) {
          const pin = p1, tau = n * mu * pin - (n + 1) * p0;
          const fn = (2 * n + 1) / (n * (n + 1));
          const [an, bn] = ab[n - 1];
          S1 = C.add(S1, C.scale(C.add(C.scale(an, pin), C.scale(bn, tau)), fn));
          S2 = C.add(S2, C.scale(C.add(C.scale(an, tau), C.scale(bn, pin)), fn));
          const p2 = (((2 * n + 1) * mu * p1) - (n + 1) * p0) / n;
          p0 = p1; p1 = p2;
        }
        return [S1, S2];
      });
    }
    return out;
  };

  /* ================= Guías de onda y fibras ================= */
  /* Guía plana simétrica (núcleo n1, espesor d; revestimiento n2), modos TE.
     Ecuación: κd/2 − mπ/2 = atan(γ/κ). Devuelve los índices efectivos. */
  OP.slabTE = function (n1, n2, d, lam) {
    const k0 = (2 * PI) / lam, V = (k0 * d) / 2 * Math.sqrt(n1 * n1 - n2 * n2);
    const out = [];
    for (let m = 0; m < 200; m++) {
      if ((m * PI) / 2 >= V) break;
      const f = (u) => u - (m * PI) / 2 - Math.atan(Math.sqrt(V * V - u * u) / u);
      const lo = Math.max(1e-12, (m * PI) / 2), hi = Math.min(V, ((m + 1) * PI) / 2) - 1e-13;
      if (f(lo) * f(hi) > 0) continue;
      const u = OP.bisect(f, lo, hi, 1e-15);
      const kap = (2 * u) / d, neff = Math.sqrt(n1 * n1 - Math.pow(kap / k0, 2));
      out.push({ m, u, neff, kappa: kap, gamma: (2 * Math.sqrt(V * V - u * u)) / d });
    }
    return { V, modes: out };
  };
  OP.fiberV = (a, lam, n1, n2) => ((2 * PI * a) / lam) * Math.sqrt(n1 * n1 - n2 * n2);
  OP.NA = (n1, n2) => Math.sqrt(n1 * n1 - n2 * n2);
  /* Modo LP_l1 en una fibra de salto débilmente guiante: resuelve u J_{l−1}(u)/J_l(u) = −w K_{l−1}(w)/K_l(w), devuelve b = w²/V² */
  OP.lpB = function (l, V, mOrder = 1) {
    const Jl = (n, u) => OP.besselJ(n, u), Kl = (n, w) => OP.besselK(n, w);
    const f = (u) => {
      const w = Math.sqrt(Math.max(V * V - u * u, 1e-30));
      return (u * Jl(l - 1, u)) / Jl(l, u) + (w * Kl(l - 1, w)) / Kl(l, w);
    };
    /* la raíz está entre el corte u = j_{l−1,m} (j_{1,m−1} para l = 0) y el cero j_{l,m} */
    const lo = (l === 0 ? (mOrder === 1 ? 0 : OP.besselJzero(1, mOrder - 1)) : OP.besselJzero(l - 1, mOrder)) + 1e-9;
    const hi = Math.min(OP.besselJzero(l, mOrder) - 1e-9, V - 1e-12);
    if (!(hi > lo)) return null;
    const flo = f(lo), fhi = f(hi);
    if (!(isFinite(flo) && isFinite(fhi)) || flo * fhi > 0) return null;
    const u = OP.bisect(f, lo, hi, 1e-15);
    return 1 - (u * u) / (V * V);
  };
  /* Diámetro de campo modal (Marcuse 1977): w/a = 0.65 + 1.619 V^−3/2 + 2.879 V^−6 */
  OP.marcuse = (V) => 0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6);
  /* Atenuación ilustrativa de la sílice (dB/km): Rayleigh + infrarrojo + pico OH + ultravioleta */
  OP.fiberLoss = function (lamUm, oh = 1) {
    const ray = 0.75 / Math.pow(lamUm, 4);
    const ir = 6e11 * Math.exp(-48.48 / lamUm);
    const uv = 1.1e-4 * Math.exp(4.67 / lamUm) * 1e-2;
    const peak = oh * (0.5 * Math.exp(-Math.pow((lamUm - 1.383) / 0.012, 2)) + 0.08 * Math.exp(-Math.pow((lamUm - 1.24) / 0.015, 2)));
    return ray + ir + uv + peak + 0.01;
  };

  /* ================= Óptica no lineal ================= */
  /* Ángulo de ajuste de fase tipo I (o + o → e) para generación de segundo armónico en un cristal uniaxial negativo */
  OP.pmTypeI = function (crystal, lamFundNm) {
    const f = OP.UNI[crystal].f;
    const [no1] = f(lamFundNm / 1000), [no2, ne2] = f(lamFundNm / 2000);
    const s2 = (Math.pow(no1, -2) - Math.pow(no2, -2)) / (Math.pow(ne2, -2) - Math.pow(no2, -2));
    return s2 >= 0 && s2 <= 1 ? Math.asin(Math.sqrt(s2)) : NaN;
  };
  /* Desajuste Δk = k(2ω) − 2k(ω) para ondas o + o → e a un ángulo θ */
  OP.dkTypeI = function (crystal, lamFundNm, th) {
    const f = OP.UNI[crystal].f;
    const [no1] = f(lamFundNm / 1000), [no2, ne2] = f(lamFundNm / 2000);
    const n2 = OP.nTheta(no2, ne2, th), lam = lamFundNm * 1e-9;
    return (4 * PI / lam) * (n2 - no1);
  };
  /* Eficiencia relativa del segundo armónico: L² sinc²(ΔkL/2) */
  OP.shg = (dk, L) => L * L * Math.pow(OP.sinc((dk * L) / 2), 2);

  /* ================= Fotones ================= */
  OP.photonE = (lam) => (OP.h * OP.c) / lam;
  OP.poisson = function (n, m) { let p = Math.exp(-m); for (let k = 1; k <= n; k++) p *= m / k; return p; };
  OP.boseEinstein = (n, m) => Math.pow(m, n) / Math.pow(1 + m, n + 1);
  /* Efecto fotoeléctrico: energía cinética máxima y potencial de frenado */
  OP.photoKmax = (lamNm, W) => OP.eV(lamNm) - W;
  OP.WORK = { Cs: 2.14, K: 2.30, Na: 2.36, Ca: 2.87, Zn: 4.33, Cu: 4.65, Ag: 4.26, Pt: 5.65 };

  if (typeof module !== 'undefined' && module.exports) module.exports = OP;
})();
