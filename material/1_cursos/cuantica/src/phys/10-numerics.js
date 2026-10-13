/* ===================================================================
   phys/10-numerics.js — Constantes, funciones especiales, integración,
   generador pseudoaleatorio con semilla y estadística (sin DOM).
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});

  /* ---------- Constantes (CODATA 2018) y unidades ---------- */
  P.K = {
    h: 6.62607015e-34, hbar: 1.054571817e-34, e: 1.602176634e-19, me: 9.1093837015e-31,
    mp: 1.67262192369e-27, u: 1.66053906660e-27, c: 299792458, kB: 1.380649e-23, NA: 6.02214076e23,
    eps0: 8.8541878128e-12, a0: 5.29177210903e-11, Ha: 4.3597447222071e-18,
    Ha_eV: 27.211386245988, Ry_eV: 13.605693122994, kB_eV: 8.617333262e-5, bohr_A: 0.529177210903,
    hc_eVnm: 1239.84198, hbarc_eVnm: 197.3269804, me_c2_eV: 510998.95, sigmaSB: 5.670374419e-8,
    b_wien: 2.897771955e-3, alpha: 7.2973525693e-3
  };
  /* kB tal como lo usa hBN-MC (core.js: KB = 8.6173324e-5 eV/K) */
  P.K.kB_hbn = 8.6173324e-5;

  /* ---------- Utilidades ---------- */
  const U = (P.util = {});
  U.linspace = (a, b, n) => { const o = new Float64Array(n); for (let i = 0; i < n; i++) o[i] = n === 1 ? a : a + ((b - a) * i) / (n - 1); return o; };
  U.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  U.sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  U.bisect = function (f, a, b, tol = 1e-13, it = 300) {
    let fa = f(a), fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) return NaN;
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fm === 0) return m;
      if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
      if (Math.abs(b - a) < tol * Math.max(1, Math.abs(m))) break;
    }
    return 0.5 * (a + b);
  };
  /* Mínimo por sección áurea en [a,b] */
  U.golden = function (f, a, b, tol = 1e-10) {
    const g = (Math.sqrt(5) - 1) / 2;
    let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
    for (let i = 0; i < 200 && Math.abs(b - a) > tol * (Math.abs(c) + Math.abs(d) + 1e-12); i++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); }
      else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
    }
    const x = 0.5 * (a + b);
    return { x, f: f(x) };
  };

  /* ---------- Integración ---------- */
  const I = (P.integ = {});
  /* Simpson compuesto sobre malla uniforme de paso h (n impar de puntos; si es par, cierra con 3/8) */
  I.simpson = function (y, h) {
    const n = y.length;
    if (n < 2) return 0;
    if (n === 2) return 0.5 * h * (y[0] + y[1]);
    let m = n % 2 === 1 ? n : n - 3;
    let s = y[0] + y[m - 1];
    for (let i = 1; i < m - 1; i++) s += (i % 2 ? 4 : 2) * y[i];
    s *= h / 3;
    if (m !== n) s += (3 * h / 8) * (y[n - 4] + 3 * y[n - 3] + 3 * y[n - 2] + y[n - 1]);
    return s;
  };
  I.trapz = function (y, h) { let s = 0.5 * (y[0] + y[y.length - 1]); for (let i = 1; i < y.length - 1; i++) s += y[i]; return s * h; };
  /* Integral acumulada ∫_0^{x_i} con fórmula de tercer orden (5, 8, −1)/12 */
  I.cumulative = function (y, h) {
    const n = y.length, c = new Float64Array(n);
    if (n < 2) return c;
    c[1] = h * (5 * y[0] + 8 * y[1] - y[2 < n ? 2 : 1]) / 12;
    for (let i = 2; i < n; i++) c[i] = c[i - 1] + h * (-y[i - 2] + 8 * y[i - 1] + 5 * y[i]) / 12;
    return c;
  };
  I.fn = function (f, a, b, n = 400) {
    if (n % 2) n++;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return (s * h) / 3;
  };

  /* ---------- Funciones especiales ---------- */
  const S = (P.sf = {});
  S.fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  S.logGamma = function (x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  };
  S.gamma = (x) => Math.exp(S.logGamma(x));
  S.binom = (n, k) => (k < 0 || k > n ? 0 : Math.round(Math.exp(S.logGamma(n + 1) - S.logGamma(k + 1) - S.logGamma(n - k + 1))));
  S.logBinom = (n, k) => S.logGamma(n + 1) - S.logGamma(k + 1) - S.logGamma(n - k + 1);
  /* Laguerre generalizado L_n^{(α)}(x) por recurrencia */
  S.laguerre = function (n, a, x) {
    if (n === 0) return 1;
    let L0 = 1, L1 = 1 + a - x;
    for (let k = 1; k < n; k++) { const L2 = ((2 * k + 1 + a - x) * L1 - (k + a) * L0) / (k + 1); L0 = L1; L1 = L2; }
    return L1;
  };
  /* Legendre asociado P_l^m(x), m ≥ 0, con fase de Condon–Shortley */
  S.legendre = function (l, m, x) {
    let pmm = 1;
    if (m > 0) { const s = Math.sqrt(Math.max(0, (1 - x) * (1 + x))); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
    if (l === m) return pmm;
    let pmmp1 = x * (2 * m + 1) * pmm;
    if (l === m + 1) return pmmp1;
    let pll = 0;
    for (let ll = m + 2; ll <= l; ll++) { pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m); pmm = pmmp1; pmmp1 = pll; }
    return pll;
  };
  /* Armónico esférico real normalizado: m>0 → cos(mφ), m<0 → sen(|m|φ) */
  S.Ylm = function (l, m, th, ph) {
    const am = Math.abs(m);
    const N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (S.fact(l - am) / S.fact(l + am)));
    const P0 = S.legendre(l, am, Math.cos(th));
    if (m === 0) return N * P0;
    return Math.SQRT2 * N * P0 * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph)) * (am % 2 ? -1 : 1);
  };
  /* Módulo al cuadrado del armónico esférico complejo |Y_l^m|² (independiente de φ) */
  S.Ylm2 = function (l, m, th) {
    const am = Math.abs(m);
    const N = ((2 * l + 1) / (4 * Math.PI)) * (S.fact(l - am) / S.fact(l + am));
    const p = S.legendre(l, am, Math.cos(th));
    return N * p * p;
  };
  /* Función del oscilador armónico normalizada ψ_n(ξ), ξ = x/ℓ, con recurrencia estable (ℓ=1) */
  S.hoPsi = function (n, x) {
    let p0 = Math.pow(Math.PI, -0.25) * Math.exp(-0.5 * x * x);
    if (n === 0) return p0;
    let p1 = Math.SQRT2 * x * p0;
    for (let k = 1; k < n; k++) { const p2 = Math.sqrt(2 / (k + 1)) * x * p1 - Math.sqrt(k / (k + 1)) * p0; p0 = p1; p1 = p2; }
    return p1;
  };
  /* Polinomio de Hermite físico H_n(x) */
  S.hermite = function (n, x) {
    if (n === 0) return 1;
    let h0 = 1, h1 = 2 * x;
    for (let k = 1; k < n; k++) { const h2 = 2 * x * h1 - 2 * k * h0; h0 = h1; h1 = h2; }
    return h1;
  };
  S.erf = function (x) {
    /* Abramowitz–Stegun 7.1.26 mejorada con serie para |x| pequeño */
    const ax = Math.abs(x);
    if (ax < 2) {
      let sum = x, term = x, x2 = x * x;
      for (let n = 1; n < 60; n++) { term *= -x2 / n; const t = term / (2 * n + 1); sum += t; if (Math.abs(t) < 1e-17) break; }
      return (2 / Math.sqrt(Math.PI)) * sum;
    }
    /* fracción continua para erfc */
    let f = 0;
    for (let k = 60; k >= 1; k--) f = (k / 2) / (ax + f);
    const erfc = Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f);
    return Math.sign(x) * (1 - erfc);
  };
  /* Integrales elípticas completas K(m), E(m) con m = k² */
  S.ellipKE = function (m) {
    if (m >= 1) return [Infinity, 1];
    let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m);
    let sum = 0.5 * c * c, pw = 0.5;
    for (let i = 0; i < 40 && Math.abs(c) > 1e-16; i++) {
      const an = (a + b) / 2, bn = Math.sqrt(a * b);
      c = (a - b) / 2; pw *= 2; sum += pw * c * c; a = an; b = bn;
    }
    const K = Math.PI / (2 * a);
    return [K, K * (1 - sum)];
  };
  /* Beta incompleta regularizada I_x(a,b) (fracción continua de Lentz) */
  S.betaInc = function (x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbt = S.logGamma(a + b) - S.logGamma(a) - S.logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    const cf = (x2, a2, b2) => {
      const tiny = 1e-300;
      let c = 1, d = 1 - ((a2 + b2) * x2) / (a2 + 1);
      if (Math.abs(d) < tiny) d = tiny;
      d = 1 / d;
      let h = d;
      for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b2 - m) * x2) / ((a2 + m2 - 1) * (a2 + m2));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; h *= d * c;
        aa = (-(a2 + m) * (a2 + b2 + m) * x2) / ((a2 + m2) * (a2 + m2 + 1));
        d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d;
        const del = d * c; h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
      }
      return h;
    };
    if (x < (a + 1) / (a + b + 2)) return (Math.exp(lbt) * cf(x, a, b)) / a;
    return 1 - (Math.exp(lbt) * cf(1 - x, b, a)) / b;
  };

  /* ---------- Generador pseudoaleatorio Mulberry32 (el mismo de hBN-MC) ---------- */
  P.rng = function (seed) {
    let s = seed >>> 0;
    const r = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.gauss = function () {
      let u = 0;
      while (u === 0) u = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
    };
    r.int = (n) => Math.floor(r() * n);
    r.state = () => s;
    return r;
  };
  /* Generador congruencial lineal (para mostrar sus defectos; RANDU: a=65539, m=2^31) */
  P.lcg = function (seed, a = 65539, c = 0, m = 2147483648) {
    let s = seed % m;
    return () => { s = (a * s + c) % m; return s / m; };
  };

  /* ---------- Estadística ---------- */
  const ST = (P.stat = {});
  ST.mean = (a) => { let s = 0; for (const v of a) s += v; return a.length ? s / a.length : NaN; };
  ST.variance = (a) => { const m = ST.mean(a); let s = 0; for (const v of a) s += (v - m) * (v - m); return a.length > 1 ? s / (a.length - 1) : 0; };
  ST.std = (a) => Math.sqrt(ST.variance(a));
  /* CDF de la t de Student con ν grados de libertad */
  ST.tCDF = function (t, nu) {
    const x = nu / (nu + t * t);
    const p = 0.5 * S.betaInc(x, nu / 2, 0.5);
    return t >= 0 ? 1 - p : p;
  };
  /* Cuantil de la t de Student: t tal que CDF = p */
  ST.tQuantile = function (p, nu) {
    if (!(nu > 0)) return NaN;
    return U.bisect((t) => ST.tCDF(t, nu) - p, -1e3, 1e3, 1e-14);
  };
  ST.normCDF = (z) => 0.5 * (1 + S.erf(z / Math.SQRT2));
  /* Intervalo de confianza de la media con t de Student */
  ST.ci = function (a, level = 0.95) {
    const n = a.length, m = ST.mean(a), s = ST.std(a);
    const t = n > 1 ? ST.tQuantile(0.5 + level / 2, n - 1) : NaN;
    return { n, mean: m, std: s, sem: s / Math.sqrt(n), t, half: (t * s) / Math.sqrt(n) };
  };
  /* Función de autocorrelación normalizada y tiempo integrado (ventana automática de Sokal) */
  ST.autocorr = function (a, maxLag) {
    const n = a.length, m = ST.mean(a);
    let v = 0;
    for (const x of a) v += (x - m) * (x - m);
    v /= n;
    const L = Math.min(maxLag || Math.floor(n / 4), n - 1);
    const rho = new Float64Array(L + 1);
    for (let k = 0; k <= L; k++) {
      let s = 0;
      for (let i = 0; i + k < n; i++) s += (a[i] - m) * (a[i + k] - m);
      rho[k] = v > 0 ? s / (n - k) / v : 0;
    }
    let tau = 0.5;
    for (let k = 1; k <= L; k++) { tau += rho[k]; if (k >= 6 * tau) break; }
    return { rho, tau: Math.max(0.5, tau) };
  };
  /* Análisis por bloques: error de la media para bloques de tamaño 2^k */
  ST.blocking = function (a) {
    const out = [];
    let x = Array.from(a);
    let bs = 1;
    while (x.length >= 8) {
      const n = x.length;
      out.push({ block: bs, n, err: Math.sqrt(ST.variance(x) / n) });
      const y = [];
      for (let i = 0; i + 1 < n; i += 2) y.push(0.5 * (x[i] + x[i + 1]));
      x = y; bs *= 2;
    }
    return out;
  };
  /* Histograma: devuelve {edges, counts, dens} */
  ST.hist = function (a, lo, hi, nb) {
    const counts = new Float64Array(nb);
    const w = (hi - lo) / nb;
    let n = 0;
    for (const v of a) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) { counts[k]++; n++; } }
    const dens = counts.map((c) => (a.length ? c / (a.length * w) : 0));
    return { lo, hi, nb, w, counts, dens, n };
  };
})(typeof window !== 'undefined' ? window : globalThis);
