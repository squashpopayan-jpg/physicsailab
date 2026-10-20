/* ===================================================================
   30-fluid.js — Biblioteca científica del curso (EM.fl)
   Propiedades de fluidos reales, atmósfera estándar, hidrostática, flotación,
   capilaridad, flujos viscosos exactos, análisis dimensional, tuberías, arrastre,
   flujo potencial, vórtices, ondas de agua, canales, flujo compresible,
   inestabilidades, fluidos en rotación y reología.
   Se valida en Node con tests/validar.js contra CoolProp, la biblioteca fluids,
   SciPy y datos publicados. Unidades SI (T en K, P en Pa) salvo aviso.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const TAB = EM.props || (typeof require !== 'undefined' ? require('./29-props.js') : null);
  const FL = {};
  const g = 9.80665, R = 8.314462618, kB = 1.380649e-23;
  FL.g = g; FL.R = R; FL.kB = kB; FL.Rair = 287.05; FL.gam = 1.4; FL.Omega = 7.2921159e-5;

  /* ================= Numérica ================= */
  FL.bisect = function (f, a, b, tol = 1e-12, it = 300) {
    let fa = f(a);
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      if (Math.abs(b - a) <= tol * (1 + Math.abs(m))) break;
    }
    return 0.5 * (a + b);
  };
  /* Newton con derivada numérica; cae a la secante si la derivada es nula */
  FL.newton = function (f, x, tol = 1e-13, it = 100) {
    for (let i = 0; i < it; i++) {
      const fx = f(x), h = 1e-7 * (Math.abs(x) + 1e-7), d = (f(x + h) - f(x - h)) / (2 * h);
      if (!(d !== 0 && isFinite(d))) break;
      const dx = fx / d;
      x -= dx;
      if (Math.abs(dx) <= tol * (1 + Math.abs(x))) break;
    }
    return x;
  };
  const GLx = [0.0765265211334973, 0.2277858511416451, 0.3737060887154195, 0.5108670019508271, 0.6360536807265150, 0.7463319064601508, 0.8391169718222188, 0.9122344282513259, 0.9639719272779138, 0.9931285991850949];
  const GLw = [0.1527533871307258, 0.1491729864726037, 0.1420961093183820, 0.1316886384491766, 0.1181945319615184, 0.1019301198172404, 0.0832767415767048, 0.0626720483341091, 0.0406014298003869, 0.0176140071391521];
  /* Gauss–Legendre de 20 puntos en n subintervalos */
  FL.quad = function (f, a, b, n = 8) {
    const hh = (b - a) / n;
    let s = 0;
    for (let k = 0; k < n; k++) {
      const c = a + (k + 0.5) * hh, r = hh / 2;
      for (let i = 0; i < 10; i++) s += GLw[i] * r * (f(c - r * GLx[i]) + f(c + r * GLx[i]));
    }
    return s;
  };
  /* RK4 para y' = f(t, y), y arreglo */
  FL.rk4 = function (f, t, y, dt) {
    const n = y.length, a = new Array(n), b = new Array(n), c = new Array(n);
    const k1 = f(t, y);
    for (let i = 0; i < n; i++) a[i] = y[i] + 0.5 * dt * k1[i];
    const k2 = f(t + dt / 2, a);
    for (let i = 0; i < n; i++) b[i] = y[i] + 0.5 * dt * k2[i];
    const k3 = f(t + dt / 2, b);
    for (let i = 0; i < n; i++) c[i] = y[i] + dt * k3[i];
    const k4 = f(t + dt, c), out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  };
  /* Spline cúbico natural; fuera del rango extrapola con la pendiente del extremo */
  FL.spline = function (xs, ys) {
    const n = xs.length, M = new Float64Array(n), h = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i];
    const cp = new Float64Array(n), dp = new Float64Array(n);
    for (let i = 1; i < n - 1; i++) {
      const a = h[i - 1], b = 2 * (h[i - 1] + h[i]), c = h[i];
      const d = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
      const den = b - a * cp[i - 1];
      cp[i] = c / den; dp[i] = (d - a * dp[i - 1]) / den;
    }
    for (let i = n - 2; i >= 1; i--) M[i] = dp[i] - cp[i] * M[i + 1];
    const s0 = (ys[1] - ys[0]) / h[0] - (h[0] * (2 * M[0] + M[1])) / 6;
    const s1 = (ys[n - 1] - ys[n - 2]) / h[n - 2] + (h[n - 2] * (M[n - 2] + 2 * M[n - 1])) / 6;
    return function (x) {
      if (x <= xs[0]) return ys[0] + s0 * (x - xs[0]);
      if (x >= xs[n - 1]) return ys[n - 1] + s1 * (x - xs[n - 1]);
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
      const H = h[lo], A = (xs[hi] - x) / H, B = 1 - A;
      return A * ys[lo] + B * ys[hi] + (((A * A * A - A) * M[lo] + (B * B * B - B) * M[hi]) * H * H) / 6;
    };
  };
  FL.erf = function (x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 3) { let sum = x, term = x; for (let n = 1; n < 200; n++) { term *= (-x * x) / n; const d = term / (2 * n + 1); sum += d; if (Math.abs(d) < 1e-17 * Math.abs(sum)) break; } return (s * 2 * sum) / Math.sqrt(Math.PI); }
    return s * (1 - FL.erfc(x));
  };
  FL.erfc = function (x) {
    if (x < 3) return 1 - FL.erf(x);
    let f = 0; for (let n = 60; n >= 1; n--) f = (n / 2) / (x + f);
    return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
  };

  /* ---------- Funciones de Bessel ---------- */
  /* J_n(x) real, n = 0 o 1: serie para |x| < 20, desarrollo asintótico de Hankel para |x| ≥ 20 */
  FL.besselJ = function (n, x) {
    const ax = Math.abs(x), sg = n === 1 && x < 0 ? -1 : 1;
    if (ax < 20) {
      let term = n === 0 ? 1 : ax / 2, sum = term;
      const q = -(ax * ax) / 4;
      for (let k = 1; k < 120; k++) { term *= q / (k * (k + n)); sum += term; if (Math.abs(term) < 1e-17 * Math.abs(sum) && k > 5) break; }
      return sg * sum;
    }
    const mu = 4 * n * n, z8 = 8 * ax;
    let P = 1, Q = 0, t = 1, k = 1, last = Infinity;
    for (; k < 40; k++) {
      t *= (mu - (2 * k - 1) * (2 * k - 1)) / (k * z8);
      if (Math.abs(t) > last) break;
      last = Math.abs(t);
      if (k % 2 === 1) Q += (k % 4 === 1 ? 1 : -1) * t; else P += (k % 4 === 2 ? -1 : 1) * t;
      if (Math.abs(t) < 1e-17) break;
    }
    const chi = ax - (n * Math.PI) / 2 - Math.PI / 4;
    return sg * Math.sqrt(2 / (Math.PI * ax)) * (P * Math.cos(chi) - Q * Math.sin(chi));
  };
  /* Ceros de J0 (McMahon + Newton) */
  FL.j0zero = function (m) {
    const b = (m - 0.25) * Math.PI;
    let x = b + 1 / (8 * b) - 124 / (3 * Math.pow(8 * b, 3));
    for (let i = 0; i < 20; i++) { const dx = FL.besselJ(0, x) / FL.besselJ(1, x); x += dx; if (Math.abs(dx) < 1e-15 * x) break; }
    return x;
  };
  /* I_n(x) modificada, n = 0 o 1 (serie de términos positivos) */
  FL.besselI = function (n, x) {
    let term = n === 0 ? 1 : x / 2, sum = term;
    const q = (x * x) / 4;
    for (let k = 1; k < 400; k++) { term *= q / (k * (k + n)); sum += term; if (term < 1e-17 * sum) break; }
    return sum;
  };
  /* Aritmética compleja con pares [re, im] */
  const C = (FL.C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    scale: (a, s) => [a[0] * s, a[1] * s],
    abs: (a) => Math.hypot(a[0], a[1]),
    arg: (a) => Math.atan2(a[1], a[0]),
    exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
    log: (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])],
    sqrt: (a) => { const r = Math.hypot(a[0], a[1]), s = Math.sqrt((r + a[0]) / 2), t = Math.sqrt(Math.max(0, (r - a[0]) / 2)); return [s, a[1] < 0 ? -t : t]; },
    inv: (a) => { const d = a[0] * a[0] + a[1] * a[1]; return [a[0] / d, -a[1] / d]; }
  });
  /* J_n(z) complejo por serie (n = 0, 1); suficiente para |z| ≲ 30 */
  FL.besselJc = function (n, z) {
    const q = C.scale(C.mul(z, z), -0.25);
    let term = n === 0 ? [1, 0] : C.scale(z, 0.5), sum = term.slice();
    for (let k = 1; k < 200; k++) {
      term = C.scale(C.mul(term, q), 1 / (k * (k + n)));
      sum = C.add(sum, term);
      if (C.abs(term) < 1e-17 * C.abs(sum) && k > 5) break;
    }
    return sum;
  };

  /* ================= Propiedades ================= */
  function fromTable(t) {
    const o = { Tmin: t.T[0], Tmax: t.T[t.T.length - 1] };
    for (const key of Object.keys(t)) {
      if (!Array.isArray(t[key]) || key === 'T') continue;
      const lg = key === 'mu' || key === 'psat';
      const sp = FL.spline(t.T, lg ? t[key].map(Math.log) : t[key]);
      o[key] = lg ? (T) => Math.exp(sp(T)) : sp;
    }
    if (o.mu && o.rho) o.nu = (T) => o.mu(T) / o.rho(T);
    if (t.Tb) o.Tb = t.Tb;
    return o;
  }
  if (TAB) {
    FL.water = fromTable(TAB.water);
    FL.air = fromTable(TAB.air);
    FL.liq = {};
    for (const k of ['etanol', 'metanol', 'tolueno', 'heptano']) FL.liq[k] = fromTable(TAB[k]);
  } else { FL.water = {}; FL.air = {}; FL.liq = {}; }
  const W = FL.water, A = FL.air;
  W.Tc = 647.096; W.Pc = 22.064e6;
  /* Tensión superficial del agua: IAPWS (1994) */
  W.sigmaTab = W.sigma;
  W.sigma = (T) => { const t = 1 - T / 647.096; return 0.2358 * Math.pow(t, 1.256) * (1 - 0.625 * t); };
  /* Presión de vapor: Wagner y Pruß (IAPWS) */
  W.psatTab = W.psat;
  W.psat = function (T) {
    const t = 1 - T / 647.096, a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502], e = [1, 1.5, 3, 3.5, 4, 7.5];
    let s = 0; for (let i = 0; i < 6; i++) s += a[i] * Math.pow(t, e[i]);
    return 22.064e6 * Math.exp((647.096 / T) * s);
  };
  W.tsat = (P) => FL.bisect((T) => W.psat(T) - P, 273.16, 647.09, 1e-13);
  /* Módulo volumétrico isentrópico K = ρc² */
  W.K = (T) => W.rho(T) * W.c(T) * W.c(T);
  /* Aire: gas ideal con R = 287.05 J/kg·K; viscosidad de Lemmon et al. (tabla) y de Sutherland */
  A.rhoP = (T, P = 101325) => P / (FL.Rair * T);
  A.sutherland = (T) => 1.716e-5 * Math.pow(T / 273.15, 1.5) * (273.15 + 110.4) / (T + 110.4);
  A.cIdeal = (T) => Math.sqrt(1.4 * FL.Rair * T);
  /* Recorrido libre medio del aire a partir de la viscosidad (Chapman): λ = (μ/p)·√(πRT/2) */
  FL.mfp = (T, P) => (A.mu(T) / P) * Math.sqrt((Math.PI * FL.Rair * T) / 2);
  /* Otros fluidos a 20 °C (White, Fluid Mechanics, 7.ª ed., tablas 1.4 y A.3; CRC). μ en Pa·s, σ en N/m */
  FL.LIT = {
    agua: { n: 'Agua', rho: 998.2, mu: 1.002e-3, sigma: 0.0727 },
    mar: { n: 'Agua de mar', rho: 1025, mu: 1.07e-3, sigma: 0.0735 },
    aire: { n: 'Aire (1 atm)', rho: 1.204, mu: 1.81e-5, sigma: 0 },
    mercurio: { n: 'Mercurio', rho: 13546, mu: 1.55e-3, sigma: 0.485 },
    glicerina: { n: 'Glicerina', rho: 1261, mu: 1.41, sigma: 0.0634 },
    aceite: { n: 'Aceite SAE 30', rho: 891, mu: 0.29, sigma: 0.035 },
    gasolina: { n: 'Gasolina', rho: 680, mu: 2.92e-4, sigma: 0.0216 },
    queroseno: { n: 'Queroseno', rho: 804, mu: 1.92e-3, sigma: 0.028 },
    etanol: { n: 'Etanol', rho: 789.4, mu: 1.194e-3, sigma: 0.0224 },
    miel: { n: 'Miel', rho: 1420, mu: 10, sigma: 0.05 },
    sangre: { n: 'Sangre (37 °C, cizalla alta)', rho: 1060, mu: 3.5e-3, sigma: 0.058 }
  };
  /* Viscosidad de la glicerina pura (Segur y Oberstar, 1951), interpolación en ln μ */
  const GLY_T = [273.15, 283.15, 293.15, 303.15, 313.15, 323.15, 333.15, 343.15, 353.15, 363.15, 373.15];
  const GLY_MU = [12.07, 3.9, 1.41, 0.612, 0.284, 0.142, 0.0813, 0.0506, 0.0319, 0.0213, 0.0148];
  const glySp = FL.spline(GLY_T, GLY_MU.map(Math.log));
  FL.glycerinMu = (T) => Math.exp(glySp(T));
  FL.GLY = { T: GLY_T, mu: GLY_MU };

  /* ================= Atmósfera estándar de EE. UU. 1976 ================= */
  const R76 = 8.31432, M76 = 0.0289644, r0 = 6356766;
  const LAY = [[0, 288.15, -0.0065], [11000, 216.65, 0], [20000, 216.65, 0.001], [32000, 228.65, 0.0028], [47000, 270.65, 0], [51000, 270.65, -0.0028], [71000, 214.65, -0.002], [84852, 186.946, 0]];
  const PB = [101325];
  const gmr = (g * M76) / R76;
  for (let i = 0; i < LAY.length - 1; i++) {
    const [Hb, Tb, L] = LAY[i], dH = LAY[i + 1][0] - Hb;
    PB.push(L === 0 ? PB[i] * Math.exp((-gmr * dH) / Tb) : PB[i] * Math.pow(Tb / (Tb + L * dH), gmr / L));
  }
  FL.atm = function (Z) {
    const H = (r0 * Z) / (r0 + Z);
    let i = 0;
    while (i < LAY.length - 1 && H >= LAY[i + 1][0]) i++;
    const [Hb, Tb, L] = LAY[i], dH = H - Hb, T = Tb + L * dH;
    const P = L === 0 ? PB[i] * Math.exp((-gmr * dH) / Tb) : PB[i] * Math.pow(Tb / T, gmr / L);
    const rho = (P * M76) / (R76 * T);
    return { T, P, rho, a: Math.sqrt((1.4 * R76 * T) / M76), mu: (1.458e-6 * Math.pow(T, 1.5)) / (T + 110.4), g: g * Math.pow(r0 / (r0 + Z), 2), H };
  };
  /* Atmósfera isotérmica */
  FL.atmIso = (z, T = 288.15, P0 = 101325) => P0 * Math.exp((-g * z) / (FL.Rair * T));
  /* Popayán: 1760 m, 2.44° N; temperatura media de 19 °C */
  (function () {
    const P = FL.atm(1760).P, T = 292.15;
    FL.POP = { z: 1760, lat: 2.44, P, T, rho: P / (FL.Rair * T), Tb: W.tsat ? W.tsat(P) : 367.2 };
  })();

  /* ================= Hidrostática ================= */
  /* Presión manométrica en el mar con módulo volumétrico constante: ρ = ρ0 e^{p/K} */
  FL.oceanP = (h, rho0 = 1025, K = 2.34e9) => -K * Math.log(1 - (rho0 * g * h) / K);
  /* Superficies planas: área, centroide (desde el borde superior) e inercia centroidal */
  FL.SHAPES = {
    rect: (b, L) => ({ A: b * L, yc: L / 2, I: (b * L * L * L) / 12 }),
    circ: (D) => ({ A: (Math.PI * D * D) / 4, yc: D / 2, I: (Math.PI * Math.pow(D, 4)) / 64 }),
    tri: (b, L) => ({ A: (b * L) / 2, yc: L / 3, I: (b * L * L * L) / 36 }) /* vértice abajo, base arriba */
  };
  /* Compuerta plana inclinada un ángulo th respecto a la horizontal, con su borde superior a profundidad h0 */
  FL.gate = function (shape, h0, th, rho = 998.2) {
    const s = Math.sin(th), y0 = h0 / s; /* distancia a lo largo de la placa desde la superficie */
    const yc = y0 + shape.yc, hc = yc * s, F = rho * g * hc * shape.A;
    const ycp = yc + shape.I / (yc * shape.A);
    return { F, hc, yc, ycp, hcp: ycp * s, dy: ycp - yc };
  };

  /* ---------- Polígonos (flotación y estabilidad) ---------- */
  FL.polyProps = function (pts) {
    let A2 = 0, cx = 0, cy = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n], c = x1 * y2 - x2 * y1;
      A2 += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c;
    }
    const Ar = A2 / 2;
    return Math.abs(Ar) < 1e-300 ? { A: 0, cx: 0, cy: 0 } : { A: Math.abs(Ar), cx: cx / (6 * Ar), cy: cy / (6 * Ar) };
  };
  /* Parte del polígono con y ≤ yw (Sutherland–Hodgman) */
  FL.clipBelow = function (pts, yw) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const P = pts[i], Q = pts[(i + 1) % n], pin = P[1] <= yw, qin = Q[1] <= yw;
      if (pin) out.push(P);
      if (pin !== qin) { const t = (yw - P[1]) / (Q[1] - P[1]); out.push([P[0] + t * (Q[0] - P[0]), yw]); }
    }
    return out;
  };
  FL.rotate = (pts, ang, c = [0, 0]) => { const co = Math.cos(ang), si = Math.sin(ang); return pts.map(([x, y]) => [c[0] + (x - c[0]) * co - (y - c[1]) * si, c[1] + (x - c[0]) * si + (y - c[1]) * co]); };
  /* Línea de flotación de un casco 2D con fracción sumergida frac (= ρ_cuerpo/ρ_agua) */
  FL.waterline = function (pts, frac) {
    const A = FL.polyProps(pts).A, ys = pts.map((p) => p[1]);
    return FL.bisect((yw) => FL.polyProps(FL.clipBelow(pts, yw)).A - frac * A, Math.min(...ys), Math.max(...ys), 1e-12);
  };
  /* Brazo adrizante GZ para escora phi (positiva: el costado derecho baja); G en coordenadas del casco */
  FL.gz = function (pts, frac, G, phi) {
    const P = FL.rotate(pts, -phi, G), yw = FL.waterline(P, frac), sub = FL.clipBelow(P, yw), B = FL.polyProps(sub);
    return { GZ: B.cx - G[0], B: [B.cx, B.cy], yw, poly: P, sub };
  };

  /* ================= Tensión superficial y capilaridad ================= */
  FL.jurin = (gam, th, rho, r) => (2 * gam * Math.cos(th)) / (rho * g * r);
  FL.lcap = (gam, rho) => Math.sqrt(gam / (rho * g));
  /* Menisco junto a una pared vertical (solución exacta). Devuelve altura y x(z) */
  FL.meniscusPlate = function (th, lc) {
    const h = lc * Math.sqrt(2 * (1 - Math.sin(th)));
    const F = (z) => Math.acosh((2 * lc) / z) - Math.sqrt(4 - (z * z) / (lc * lc));
    const x0 = F(h);
    return { h, x: (z) => lc * (F(z) - x0) };
  };
  /* Gota sésil: Young–Laplace en longitud de arco, adimensional con la longitud capilar.
     b = radio de curvatura en el ápice; th = ángulo de contacto. Devuelve perfil, altura, radio y volumen. */
  FL.sessile = function (b, th, ds) {
    ds = ds || Math.min(0.002, b / 400);
    let x = 0, z = 0, ph = 0, s = 0;
    const pts = [[0, 0]];
    let V = 0;
    const f = (y) => { const [X, Z, P] = y; const curv = X > 1e-12 ? 2 / b + Z - Math.sin(P) / X : 1 / b; return [Math.cos(P), Math.sin(P), curv]; };
    let y = [0, 0, 0];
    /* primer paso con la serie de la esfera para evitar 0/0 */
    const s0 = Math.min(ds, b * 1e-3);
    y = [b * Math.sin(s0 / b), b * (1 - Math.cos(s0 / b)), s0 / b];
    s = s0;
    for (let i = 0; i < 2e6 && y[2] < th; i++) {
      const yn = FL.rk4((t, q) => f(q), s, y, ds);
      if (yn[2] > th) {
        /* interpolación lineal al ángulo exacto */
        const t = (th - y[2]) / (yn[2] - y[2]);
        const yi = y.map((v, j) => v + t * (yn[j] - v));
        V += Math.PI * 0.5 * (y[0] * y[0] + yi[0] * yi[0]) * (yi[1] - y[1]);
        y = yi; pts.push([y[0], y[1]]);
        break;
      }
      V += Math.PI * 0.5 * (y[0] * y[0] + yn[0] * yn[0]) * (yn[1] - y[1]);
      y = yn; s += ds;
      if (i % 4 === 0) pts.push([y[0], y[1]]);
      if (y[0] < 0) break;
    }
    x = y[0]; z = y[1]; ph = y[2];
    return { pts, H: z, Rb: x, V, phi: ph };
  };
  /* Gota sésil de volumen dado (en lc³) */
  FL.sessileV = function (Vt, th, o = {}) {
    const ds = (b) => (o.ds ? Math.min(o.ds, b / 100) : undefined);
    const lb = FL.bisect((l) => FL.sessile(Math.exp(l), th, ds(Math.exp(l))).V - Vt, Math.log(1e-3), Math.log(o.bmax || 200), o.tol || 1e-9, o.it || 80);
    return FL.sessile(Math.exp(lb), th, ds(Math.exp(lb)));
  };

  /* ================= Bernoulli, cantidad de movimiento, máquinas ================= */
  FL.drainTime = (Atank, aHole, Cd, h0) => (Atank / (Cd * aHole)) * Math.sqrt((2 * h0) / g);
  FL.venturiQ = (Cd, A2, beta, dp, rho) => Cd * A2 * Math.sqrt((2 * dp) / (rho * (1 - Math.pow(beta, 4))));
  FL.pitotV = (dp, rho) => Math.sqrt((2 * dp) / rho);
  /* Disco actuador (Rankine–Froude): coeficientes de potencia y empuje con factor de inducción a */
  FL.betz = (a) => ({ Cp: 4 * a * (1 - a) * (1 - a), Ct: 4 * a * (1 - a) });
  /* Rueda Pelton ideal: potencia por unidad de caudal y eficiencia */
  FL.pelton = (V, u, beta, rho = 998.2, Q = 1, k = 1) => { const P = rho * Q * u * (V - u) * (1 - k * Math.cos(beta)); return { P, eta: P / (0.5 * rho * Q * V * V) }; };
  /* Bomba: H = r²·H0 − a·Q² (leyes de afinidad con r = N/N0) y sistema H = Hs + K·Q² */
  FL.pumpPoint = function (H0, a, r, Hs, K) {
    const Q = Math.sqrt(Math.max(0, (r * r * H0 - Hs) / (a + K)));
    return { Q, H: Hs + K * Q * Q };
  };
  FL.npshA = (Patm, pv, rho, zs, hL) => (Patm - pv) / (rho * g) + zs - hL;

  /* ================= Flujo viscoso: soluciones exactas ================= */
  /* Couette–Poiseuille plano: pared inferior fija, superior a U; G = −dp/dx */
  FL.couettePois = (y, h, U, G, mu) => (U * y) / h + ((G / (2 * mu)) * y * (h - y));
  FL.hpQ = (R, G, mu) => (Math.PI * Math.pow(R, 4) * G) / (8 * mu);
  /* Película sobre un plano inclinado ángulo th, espesor h */
  FL.film = (y, h, th, rho, mu) => ((rho * g * Math.sin(th)) / mu) * (h * y - (y * y) / 2);
  /* Primer y segundo problema de Stokes */
  FL.stokes1 = (y, t, U, nu) => (t <= 0 ? (y === 0 ? U : 0) : U * FL.erfc(y / (2 * Math.sqrt(nu * t))));
  FL.stokes2 = (y, t, U, w, nu) => { const k = Math.sqrt(w / (2 * nu)); return U * Math.exp(-k * y) * Math.cos(w * t - k * y); };
  /* Arranque del flujo en un tubo (Szymanski): u/u_max en r/R = s y τ = νt/R² */
  const J0Z = [];
  FL.pipeStart = function (s, tau, N = 60) {
    if (tau <= 0) return 0;
    while (J0Z.length < N) J0Z.push(FL.j0zero(J0Z.length + 1));
    let sum = 0;
    for (let n = 0; n < N; n++) { const l = J0Z[n]; sum += (FL.besselJ(0, l * s) / (l * l * l * FL.besselJ(1, l))) * Math.exp(-l * l * tau); }
    return 1 - s * s - 8 * sum;
  };
  /* Flujo pulsátil de Womersley: gradiente −∂p/∂x = Ap·cos(ωt); devuelve u(s = r/R, t) */
  FL.womersley = function (s, t, Ap, w, rho, alpha) {
    const i32 = [-Math.SQRT1_2, Math.SQRT1_2]; /* i^{3/2} */
    const zR = C.scale(i32, alpha), zr = C.scale(i32, alpha * s);
    const ratio = C.div(FL.besselJc(0, zr), FL.besselJc(0, zR));
    const brk = C.sub([1, 0], ratio);
    const pre = C.div([Ap, 0], [0, rho * w]); /* Ap/(iρω) */
    const u = C.mul(C.mul(pre, brk), [Math.cos(w * t), Math.sin(w * t)]);
    return u[0];
  };

  /* ================= Análisis dimensional (aritmética racional) ================= */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const q = gcd(n, d); return [n / q, d / q]; };
  const fsub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
  const fdiv = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  /* Rango de una matriz entera */
  FL.rank = function (M) {
    const A = M.map((r) => r.map((v) => fr(v))), rows = A.length, cols = A[0].length;
    let rk = 0;
    for (let c = 0; c < cols && rk < rows; c++) {
      let p = -1;
      for (let r = rk; r < rows; r++) if (A[r][c][0] !== 0) { p = r; break; }
      if (p < 0) continue;
      [A[rk], A[p]] = [A[p], A[rk]];
      for (let r = 0; r < rows; r++) if (r !== rk && A[r][c][0] !== 0) { const f = fdiv(A[r][c], A[rk][c]); for (let k = 0; k < cols; k++) A[r][k] = fsub(A[r][k], fmul(f, A[rk][k])); }
      rk++;
    }
    return rk;
  };
  /* Grupos Π de Buckingham. dims: vector [M, L, T, Θ] de cada variable; rep: índices de las variables repetidas.
     Devuelve, para cada variable no repetida q, los exponentes enteros de Π = q·∏ rep^a */
  FL.piGroups = function (dims, rep) {
    const k = dims[0].length, n = dims.length;
    const rk = FL.rank(dims[0].map((_, i) => dims.map((d) => d[i])));
    if (rep.length !== rk || FL.rank(dims[0].map((_, i) => rep.map((j) => dims[j][i]))) !== rk) return { ok: false, rank: rk, groups: [] };
    const groups = [];
    for (let q = 0; q < n; q++) {
      if (rep.includes(q)) continue;
      /* sistema [D_rep | −D_q] */
      const Mx = [];
      for (let i = 0; i < k; i++) Mx.push(rep.map((j) => fr(dims[j][i])).concat([fr(-dims[q][i])]));
      const rows = k, cols = rep.length;
      let r0 = 0; const piv = [];
      for (let c = 0; c < cols && r0 < rows; c++) {
        let p = -1;
        for (let r = r0; r < rows; r++) if (Mx[r][c][0] !== 0) { p = r; break; }
        if (p < 0) continue;
        [Mx[r0], Mx[p]] = [Mx[p], Mx[r0]];
        const pv = Mx[r0][c];
        for (let kk = 0; kk <= cols; kk++) Mx[r0][kk] = fdiv(Mx[r0][kk], pv);
        for (let r = 0; r < rows; r++) if (r !== r0 && Mx[r][c][0] !== 0) { const f = Mx[r][c]; for (let kk = 0; kk <= cols; kk++) Mx[r][kk] = fsub(Mx[r][kk], fmul(f, Mx[r0][kk])); }
        piv.push(c); r0++;
      }
      const sol = new Array(cols).fill(null).map(() => fr(0));
      piv.forEach((c, r) => { sol[c] = Mx[r][cols]; });
      const ex = new Array(n).fill(null).map(() => fr(0));
      ex[q] = fr(1);
      rep.forEach((j, idx) => { ex[j] = sol[idx]; });
      let L = 1; for (const e of ex) L = (L * e[1]) / gcd(L, e[1]);
      groups.push({ q, exp: ex.map((e) => (e[0] * L) / e[1]) });
    }
    return { ok: true, rank: rk, groups };
  };

  /* ================= Flujo de Stokes y lubricación ================= */
  /* Función de corriente de Stokes alrededor de una esfera fija de radio a (flujo U en +x), coordenadas (x, ρ) */
  FL.psiStokes = (x, rr, a, U) => { const r = Math.hypot(x, rr), s2 = (rr * rr) / (r * r); return 0.5 * U * s2 * (r * r - 1.5 * a * r + (0.5 * a * a * a) / r); };
  FL.psiPotSphere = (x, rr, a, U) => { const r = Math.hypot(x, rr), s2 = (rr * rr) / (r * r); return 0.5 * U * s2 * (r * r - (a * a * a) / r); };
  FL.stokesDrag = (mu, a, U) => 6 * Math.PI * mu * a * U;
  FL.oseenCd = (Re) => (24 / Re) * (1 + (3 * Re) / 16);
  /* Hadamard–Rybczynski: arrastre de una gota de viscosidad κμ relativo al de Stokes */
  FL.hadamard = (kap) => (2 + 3 * kap) / (3 * (1 + kap));
  FL.vStokes = (a, drho, mu) => (2 * drho * g * a * a) / (9 * mu);
  FL.stokesEinstein = (T, mu, a) => (kB * T) / (6 * Math.PI * mu * a);
  /* Cojinete de patín de cuña lineal: espesores h1 (entrada) y h2 (salida), longitud L, velocidad U */
  FL.slider = function (h1, h2, L, U, mu) {
    const m = (h1 - h2) / L, hs = (2 * h1 * h2) / (h1 + h2);
    const p = (x) => { const h = h1 - m * x; return ((6 * mu * U) / m) * (1 / h - 1 / h1 - (hs / 2) * (1 / (h * h) - 1 / (h1 * h1))); };
    const k = h1 / h2;
    const Wa = ((6 * mu * U * L * L) / (h2 * h2)) * (1 / ((k - 1) * (k - 1))) * (Math.log(k) - (2 * (k - 1)) / (k + 1));
    return { p, W: Wa, hs, xmax: (h1 - hs) / m };
  };

  /* ================= Capa límite (correlaciones) ================= */
  FL.BL = {
    lam: (Re) => ({ d99: 4.91 / Math.sqrt(Re), dstar: 1.7208 / Math.sqrt(Re), theta: 0.664 / Math.sqrt(Re), cf: 0.664 / Math.sqrt(Re), CD: 1.328 / Math.sqrt(Re) }),
    turb: (Re) => ({ d99: 0.37 * Math.pow(Re, -0.2), cf: 0.0592 * Math.pow(Re, -0.2), CD: 0.074 * Math.pow(Re, -0.2) }),
    schlichting: (Re) => 0.455 / Math.pow(Math.log10(Re), 2.58),
    mixed: (Re, Rec = 5e5) => (Re < Rec ? 1.328 / Math.sqrt(Re) : 0.455 / Math.pow(Math.log10(Re), 2.58) - (0.455 / Math.pow(Math.log10(Rec), 2.58) - 1.328 / Math.sqrt(Rec)) * (Rec / Re))
  };
  /* Perfiles aproximados de Kármán–Pohlhausen: δ√Re/x = √(2β/α), c_f√Re = √(2αβ) */
  FL.profileBL = function (f) {
    const al = FL.quad((e) => f(e) * (1 - f(e)), 0, 1, 16), be = (f(1e-6) - f(0)) / 1e-6, ds = FL.quad((e) => 1 - f(e), 0, 1, 16);
    const d = Math.sqrt((2 * be) / al);
    return { alpha: al, beta: be, delta: d, dstar: ds * d, theta: al * d, cf: Math.sqrt(2 * al * be), H: ds / al };
  };

  /* ================= Turbulencia de pared ================= */
  FL.KAPPA = 0.41; FL.BLOG = 5.0;
  FL.spaldingY = (u) => { const k = FL.KAPPA, ku = k * u; return u + Math.exp(-k * FL.BLOG) * (Math.exp(ku) - 1 - ku - (ku * ku) / 2 - (ku * ku * ku) / 6); };
  FL.spaldingU = (yp) => FL.bisect((u) => FL.spaldingY(u) - yp, 0, 60, 1e-13);
  FL.logLaw = (yp) => Math.log(yp) / FL.KAPPA + FL.BLOG;
  FL.kolmogorov = (nu, eps) => ({ eta: Math.pow((nu * nu * nu) / eps, 0.25), tau: Math.sqrt(nu / eps), u: Math.pow(nu * eps, 0.25) });
  /* Espectro modelo de Pope (2000): E(k) = C ε^{2/3} k^{-5/3} f_L(kL) f_η(kη) */
  FL.pope = function (k, eps, L, eta, o = {}) {
    const Ck = 1.5, p0 = 2, beta = 5.2, cL = o.cL === undefined ? 6.78 : o.cL, ce = o.ce === undefined ? 0.4 : o.ce;
    const kl = k * L, ke = k * eta;
    const fL = Math.pow(kl / Math.sqrt(kl * kl + cL), 5 / 3 + p0), fe = Math.exp(-beta * (Math.pow(Math.pow(ke, 4) + Math.pow(ce, 4), 0.25) - ce));
    return Ck * Math.pow(eps, 2 / 3) * Math.pow(k, -5 / 3) * fL * fe;
  };

  /* ================= Tuberías ================= */
  FL.fLam = (Re) => 64 / Re;
  FL.haaland = (Re, eD) => { const t = -1.8 * Math.log10(6.9 / Re + Math.pow(eD / 3.7, 1.11)); return 1 / (t * t); };
  FL.swameeJain = (Re, eD) => 0.25 / Math.pow(Math.log10(eD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  FL.colebrook = function (Re, eD) {
    let x = 1 / Math.sqrt(FL.haaland(Re, eD));
    for (let i = 0; i < 50; i++) {
      const arg = eD / 3.7 + (2.51 * x) / Re, F = x + 2 * Math.log10(arg), dF = 1 + (2 / Math.LN10) * (2.51 / Re) / arg;
      const dx = F / dF; x -= dx;
      if (Math.abs(dx) < 1e-15 * x) break;
    }
    return 1 / (x * x);
  };
  FL.churchill = function (Re, eD) {
    const A = Math.pow(-2.457 * Math.log(Math.pow(7 / Re, 0.9) + 0.27 * eD), 16), B = Math.pow(37530 / Re, 16);
    return 8 * Math.pow(Math.pow(8 / Re, 12) + 1 / Math.pow(A + B, 1.5), 1 / 12);
  };
  /* Factor de fricción por régimen: laminar < 2300, Colebrook > 4000, transición interpolada */
  FL.friction = function (Re, eD) {
    if (Re < 2300) return 64 / Re;
    if (Re > 4000) return FL.colebrook(Re, eD);
    const t = (Re - 2300) / 1700;
    return (1 - t) * (64 / 2300) + t * FL.colebrook(4000, eD);
  };
  /* Rugosidad absoluta típica (m) — Moody (1944), White tabla 6.1 */
  FL.ROUGH = {
    vidrio: ['Vidrio, tubo estirado', 1.5e-6], pvc: ['PVC, plástico', 1.5e-6], cobre: ['Cobre, latón', 1.5e-6],
    acero: ['Acero comercial', 4.5e-5], galv: ['Hierro galvanizado', 1.5e-4], fundido: ['Hierro fundido', 2.6e-4],
    concreto: ['Concreto', 1.0e-3], remachado: ['Acero remachado', 3.0e-3]
  };
  /* Coeficientes de pérdida típicos (Çengel y Cimbala; White tabla 6.5) */
  FL.KMIN = {
    entrada: ['Entrada de borde vivo', 0.5], entradaR: ['Entrada redondeada', 0.04], salida: ['Salida a un tanque', 1.0],
    codo90: ['Codo de 90° roscado', 0.9], codo90b: ['Codo de 90° bridado de radio largo', 0.3], codo45: ['Codo de 45°', 0.4],
    te: ['Te, flujo por el ramal', 2.0], compuerta: ['Válvula de compuerta abierta', 0.2], globo: ['Válvula de globo abierta', 10],
    bola: ['Válvula de bola abierta', 0.05], cheque: ['Válvula de cheque', 2.0]
  };
  FL.Kexp = (d, D) => Math.pow(1 - (d * d) / (D * D), 2);
  FL.Kcon = (d, D) => 0.42 * (1 - (d * d) / (D * D));
  /* Pérdida de carga total para caudal Q */
  FL.pipeLoss = function (Q, D, L, eps, nu, Ksum = 0) {
    const V = Q / ((Math.PI * D * D) / 4), Re = (V * D) / nu, f = FL.friction(Re, eps / D);
    return { V, Re, f, hf: (f * (L / D) * V * V) / (2 * g), hm: (Ksum * V * V) / (2 * g), h: ((f * L) / D + Ksum) * (V * V) / (2 * g) };
  };
  FL.pipeQ = (h, D, L, eps, nu, Ksum = 0) => FL.bisect((Q) => FL.pipeLoss(Q, D, L, eps, nu, Ksum).h - h, 1e-12, 100, 1e-12);
  FL.pipeD = (h, Q, L, eps, nu, Ksum = 0) => Math.exp(FL.bisect((lD) => FL.pipeLoss(Q, Math.exp(lD), L, eps, nu, Ksum).h - h, Math.log(1e-4), Math.log(20), 1e-12));
  /* Celeridad de las ondas de presión en un tubo elástico (Korteweg) */
  FL.waveSpeed = (K, rho, D, E, e) => Math.sqrt(K / rho / (1 + (K * D) / (E * e)));

  /* ================= Arrastre y sustentación ================= */
  FL.cdSphere = function (Re, m = 'morrison') {
    if (m === 'stokes') return 24 / Re;
    if (m === 'oseen') return FL.oseenCd(Re);
    if (m === 'white') return 24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4;
    if (m === 'clift') return (24 / Re) * (1 + 0.152 * Math.pow(Re, 0.677)) + 0.417 / (1 + 5070 * Math.pow(Re, -0.94));
    return 24 / Re + (2.6 * (Re / 5)) / (1 + Math.pow(Re / 5, 1.52)) + (0.411 * Math.pow(Re / 263000, -7.94)) / (1 + Math.pow(Re / 263000, -8)) + Math.pow(Re, 0.8) / 461000;
  };
  /* Cilindro circular (White, ajuste válido 1 ≤ Re ≤ 2×10⁵) */
  FL.cdCyl = (Re) => 1 + 10 * Math.pow(Re, -2 / 3);
  /* Velocidad terminal de una esfera de diámetro d */
  FL.vTerminal = function (d, rhop, rho, mu, m = 'morrison') {
    const Vol = (Math.PI * d * d * d) / 6, Ar = (Math.PI * d * d) / 4, Fw = (rhop - rho) * g * Vol;
    return FL.bisect((v) => Fw - 0.5 * rho * v * v * Ar * FL.cdSphere(Math.max(1e-12, (rho * v * d) / mu), m), 1e-12, 2000, 1e-13);
  };
  /* Sustentación por giro (efecto Magnus): ajuste de Sawicki, Hubbard y Stronge (2003) */
  FL.clSpin = (S) => (S < 0.1 ? 1.5 * S : 0.09 + 0.6 * S);
  /* Trayectoria 2D de una pelota con arrastre y Magnus (giro: >0 retroceso, eleva) */
  FL.trajectory = function (o) {
    const m = o.m, d = o.d, Ar = (Math.PI * d * d) / 4, rho = o.rho, mu = o.mu, w = o.spin || 0, dt = o.dt || 1e-3;
    let y = [0, o.h0 || 0, o.v0 * Math.cos(o.ang), o.v0 * Math.sin(o.ang)];
    const pts = [[y[0], y[1], 0]];
    const f = (t, s) => {
      const vx = s[2] - (o.wind || 0), vy = s[3], V = Math.hypot(vx, vy) || 1e-9;
      const Re = (rho * V * d) / mu, cd = o.drag === false ? 0 : (o.cd || FL.cdSphere(Re));
      const S = (Math.abs(w) * d) / 2 / V, cl = o.magnus === false ? 0 : Math.sign(w) * FL.clSpin(S);
      const q = (0.5 * rho * Ar * V) / m;
      return [s[2], s[3], -q * cd * vx - q * cl * vy, -q * cd * vy + q * cl * vx - g];
    };
    let t = 0;
    for (let i = 0; i < 200000; i++) {
      const yn = FL.rk4(f, t, y, dt); t += dt;
      if (yn[1] < 0 && (o.stop === undefined || o.stop)) { const s = y[1] / (y[1] - yn[1]); pts.push([y[0] + s * (yn[0] - y[0]), 0, t - dt + s * dt]); break; }
      y = yn;
      if (i % 5 === 0) pts.push([y[0], y[1], t]);
      if (o.tmax && t > o.tmax) break;
    }
    return pts;
  };
  /* Ala finita (teoría de la línea sustentadora) */
  FL.wing = function (alphaDeg, AR, e = 0.85, a0 = 2 * Math.PI, alpha0Deg = 0) {
    const a = a0 / (1 + a0 / (Math.PI * e * AR)), CL = (a * (alphaDeg - alpha0Deg) * Math.PI) / 180;
    return { CL, CDi: (CL * CL) / (Math.PI * e * AR), a };
  };

  /* ================= Flujo potencial ================= */
  /* elementos: {t:'U', U, a} uniforme; {t:'src', m, z} fuente; {t:'vor', G, z} vórtice; {t:'dip', k, z, b} doblete */
  FL.potW = function (els, z) {
    let W = [0, 0], dW = [0, 0];
    for (const e of els) {
      if (e.t === 'U') { const c = [e.U * Math.cos(e.a || 0), -e.U * Math.sin(e.a || 0)]; W = C.add(W, C.mul(c, z)); dW = C.add(dW, c); continue; }
      const dz = C.sub(z, e.z);
      if (e.t === 'src') { W = C.add(W, C.scale(C.log(dz), e.m / (2 * Math.PI))); dW = C.add(dW, C.scale(C.inv(dz), e.m / (2 * Math.PI))); }
      else if (e.t === 'vor') { const c = [0, -e.G / (2 * Math.PI)]; W = C.add(W, C.mul(c, C.log(dz))); dW = C.add(dW, C.mul(c, C.inv(dz))); }
      else if (e.t === 'dip') { const c = [(e.k * Math.cos(e.b || 0)) / (2 * Math.PI), (e.k * Math.sin(e.b || 0)) / (2 * Math.PI)]; const iz = C.inv(dz); W = C.add(W, C.mul(c, iz)); dW = C.sub(dW, C.mul(c, C.mul(iz, iz))); }
    }
    return { W, u: dW[0], v: -dW[1] };
  };
  /* Cilindro de radio a con circulación Γ (positiva antihoraria) en flujo U.
     En la superficie u_θ = −2U sen θ + Γ/(2πa); la sustentación por unidad de largo es −ρUΓ */
  FL.cylinder = function (a, U, G, rho = 1) {
    const els = [{ t: 'U', U }, { t: 'dip', k: 2 * Math.PI * U * a * a, z: [0, 0] }, { t: 'vor', G, z: [0, 0] }];
    const s = G / (4 * Math.PI * U * a);
    return { els, Cp: (th) => 1 - Math.pow(-2 * Math.sin(th) + G / (2 * Math.PI * a * U), 2), stag: Math.abs(s) <= 1 ? [Math.asin(s), Math.PI - Math.asin(s)] : null, L: -rho * U * G };
  };
  /* Perfil de Joukowski: círculo de centro s = (−m, n)·c que pasa por z = c; ζ = z + c²/z */
  FL.joukowski = function (o) {
    const c = o.c || 1, s = [-o.m * c, o.n * c], dcs = C.sub([c, 0], s), a = C.abs(dcs), beta = -C.arg(dcs);
    const al = o.alpha, U = o.U || 1;
    const G = o.G !== undefined ? o.G : 4 * Math.PI * U * a * Math.sin(al + beta); /* horario positivo; por defecto, condición de Kutta */
    const prof = [];
    for (let i = 0; i <= 360; i++) { const th = (2 * Math.PI * i) / 360, z = C.add(s, [a * Math.cos(th), a * Math.sin(th)]); prof.push(C.add(z, C.scale(C.inv(z), c * c))); }
    let xmin = Infinity, xmax = -Infinity;
    for (const p of prof) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); }
    const chord = xmax - xmin, CL = (2 * G) / (U * chord);
    /* potencial complejo en el plano z */
    const ea = [Math.cos(al), -Math.sin(al)], eai = [Math.cos(al), Math.sin(al)];
    const Wz = (z) => { const d = C.sub(z, s); return C.add(C.add(C.mul(C.scale(ea, U), d), C.mul(C.scale(eai, U * a * a), C.inv(d))), C.mul([0, G / (2 * Math.PI)], C.log(d))); };
    const dWz = (z) => { const d = C.sub(z, s), id = C.inv(d); return C.add(C.sub(C.scale(ea, U), C.mul(C.scale(eai, U * a * a), C.mul(id, id))), C.mul([0, G / (2 * Math.PI)], id)); };
    const map = (z) => C.add(z, C.scale(C.inv(z), c * c));
    const vel = (z) => { const dz = C.sub([1, 0], C.scale(C.inv(C.mul(z, z)), c * c)); const w = C.div(dWz(z), dz); return [w[0], -w[1]]; };
    return { s, a, beta, G, prof, chord, CL, Wz, map, vel, c };
  };

  /* ================= Vórtices ================= */
  FL.rankine = (r, G, a) => (r < a ? (G * r) / (2 * Math.PI * a * a) : G / (2 * Math.PI * r));
  /* Depresión de presión en el centro de un vórtice de Rankine: Δp = ρ v_max² */
  FL.rankineP = (r, G, a, rho) => { const vm = G / (2 * Math.PI * a); return r < a ? -rho * vm * vm * (1 - (0.5 * r * r) / (a * a)) : (-0.5 * rho * G * G) / (4 * Math.PI * Math.PI * r * r); };
  FL.lambOseen = (r, t, G, nu) => (r === 0 ? 0 : (G / (2 * Math.PI * r)) * (1 - Math.exp((-r * r) / (4 * nu * t))));
  FL.lambOseenW = (r, t, G, nu) => (G / (4 * Math.PI * nu * t)) * Math.exp((-r * r) / (4 * nu * t));
  FL.LO_RMAX = 1.1209; /* r_max/√(4νt): raíz de e^{x²} = 1 + 2x² */
  FL.ringSpeed = (G, Rr, a) => (G / (4 * Math.PI * Rr)) * (Math.log((8 * Rr) / a) - 0.25);

  /* ================= Ondas en el agua ================= */
  /* ω²(k) = (g k + s k³) tanh(k h), s = γ/ρ */
  FL.waveW = (k, h, s = 0) => Math.sqrt((g * k + s * k * k * k) * Math.tanh(k * h));
  FL.waveCg = function (k, h, s = 0) {
    const T = Math.tanh(k * h), w = FL.waveW(k, h, s);
    return ((g + 3 * s * k * k) * T + (g * k + s * k * k * k) * h * (1 - T * T)) / (2 * w);
  };
  FL.waveK = (w, h, s = 0) => Math.exp(FL.bisect((lk) => FL.waveW(Math.exp(lk), h, s) - w, Math.log(1e-9), Math.log(1e7), 1e-14));
  FL.kelvinAngle = Math.asin(1 / 3);
  /* Cresta n de la estela de Kelvin (barco en el origen moviéndose hacia +x): parámetro θ ∈ (−π/2, π/2) */
  FL.kelvinCrest = (th, n, U) => { const a = (2 * Math.PI * n * U * U) / g, c = Math.cos(th), s = Math.sin(th); return [-a * c * (1 + s * s), a * c * c * s]; };
  FL.greenLaw = (A0, h0, h) => A0 * Math.pow(h0 / h, 0.25);

  /* ================= Canales abiertos ================= */
  FL.ch = {
    E: (y, q) => y + (q * q) / (2 * g * y * y),
    yc: (q) => Math.cbrt((q * q) / g),
    Fr: (y, q) => q / (y * Math.sqrt(g * y)),
    alternate(E, q) {
      const yc = Math.cbrt((q * q) / g);
      if (E < 1.5 * yc) return null;
      const f = (y) => y + (q * q) / (2 * g * y * y) - E;
      return { sub: FL.bisect(f, yc, E + 1e-9, 1e-14), sup: FL.bisect(f, 1e-9, yc, 1e-14) };
    },
    jump(y1, q) { const F1 = q / (y1 * Math.sqrt(g * y1)), y2 = 0.5 * y1 * (Math.sqrt(1 + 8 * F1 * F1) - 1); return { y2, F1, dE: Math.pow(y2 - y1, 3) / (4 * y1 * y2) }; },
    /* sección trapezoidal: fondo b, talud z (horizontal por vertical) */
    geo(y, b, z) { const A = (b + z * y) * y, P = b + 2 * y * Math.sqrt(1 + z * z), T = b + 2 * z * y; return { A, P, T, Rh: A / P }; },
    manningQ(y, b, z, n, S) { const s = FL.ch.geo(y, b, z); return (s.A * Math.pow(s.Rh, 2 / 3) * Math.sqrt(S)) / n; },
    yn(Q, b, z, n, S) { return FL.bisect((y) => FL.ch.manningQ(y, b, z, n, S) - Q, 1e-6, 100, 1e-13); },
    ycTrap(Q, b, z) { return FL.bisect((y) => { const s = FL.ch.geo(y, b, z); return (Q * Q * s.T) / (g * s.A * s.A * s.A) - 1; }, 1e-6, 100, 1e-13); },
    /* pendiente del perfil gradualmente variado dy/dx */
    gvf(y, Q, b, z, n, S0) { const s = FL.ch.geo(y, b, z), Sf = Math.pow((n * Q) / (s.A * Math.pow(s.Rh, 2 / 3)), 2), Fr2 = (Q * Q * s.T) / (g * s.A * s.A * s.A); return (S0 - Sf) / (1 - Fr2); },
    /* Rotura de presa sobre lecho seco (Ritter, 1892): profundidad y velocidad en ξ = x/t */
    ritter(xi, h0) { const c0 = Math.sqrt(g * h0); if (xi <= -c0) return { h: h0, u: 0 }; if (xi >= 2 * c0) return { h: 0, u: 0 }; return { h: Math.pow(2 * c0 - xi, 2) / (9 * g), u: (2 / 3) * (c0 + xi) }; }
  };
  /* Coeficientes de Manning típicos (Chow, 1959) */
  FL.MANNING = { concreto: ['Concreto liso', 0.013], tierra: ['Tierra limpia, recto', 0.022], grava: ['Grava', 0.025], rio: ['Río natural limpio', 0.03], maleza: ['Río con piedras y maleza', 0.045], pvc: ['PVC o vidrio', 0.010] };

  /* ================= Flujo compresible ================= */
  const CF = (FL.cf = {});
  CF.T0T = (M, k = 1.4) => 1 + ((k - 1) / 2) * M * M;
  CF.p0p = (M, k = 1.4) => Math.pow(CF.T0T(M, k), k / (k - 1));
  CF.r0r = (M, k = 1.4) => Math.pow(CF.T0T(M, k), 1 / (k - 1));
  CF.AAs = (M, k = 1.4) => (1 / M) * Math.pow((2 / (k + 1)) * CF.T0T(M, k), (k + 1) / (2 * (k - 1)));
  CF.MfromA = (Ar, sup, k = 1.4) => (Ar <= 1 ? 1 : sup ? FL.bisect((M) => CF.AAs(M, k) - Ar, 1, 100, 1e-14) : FL.bisect((M) => CF.AAs(M, k) - Ar, 1e-9, 1, 1e-14));
  CF.MfromP = (pr, k = 1.4) => Math.sqrt((2 / (k - 1)) * (Math.pow(1 / pr, (k - 1) / k) - 1)); /* pr = p/p0 */
  CF.pStar = (k = 1.4) => Math.pow(2 / (k + 1), k / (k - 1));
  /* caudal máximo (ahogado) por unidad de área de garganta */
  CF.mdotA = (p0, T0, k = 1.4, Rg = 287.05) => (p0 / Math.sqrt(Rg * T0)) * Math.sqrt(k) * Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1)));
  CF.normal = function (M1, k = 1.4) {
    const m2 = M1 * M1, M2 = Math.sqrt((1 + ((k - 1) / 2) * m2) / (k * m2 - (k - 1) / 2));
    const p21 = 1 + ((2 * k) / (k + 1)) * (m2 - 1), r21 = ((k + 1) * m2) / ((k - 1) * m2 + 2), T21 = p21 / r21;
    const p0r = Math.pow(r21, k / (k - 1)) * Math.pow(1 / p21, 1 / (k - 1));
    return { M2, p21, r21, T21, p0r, ds: -287.05 * Math.log(p0r) };
  };
  /* Choque oblicuo: θ(β) y β(θ) */
  CF.theta = (M, b, k = 1.4) => Math.atan((2 / Math.tan(b)) * ((M * M * Math.sin(b) * Math.sin(b) - 1) / (M * M * (k + Math.cos(2 * b)) + 2)));
  CF.thetaMax = function (M, k = 1.4) {
    const mu = Math.asin(1 / M);
    let lo = mu, hi = Math.PI / 2;
    for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (CF.theta(M, m1, k) < CF.theta(M, m2, k)) lo = m1; else hi = m2; }
    const bm = (lo + hi) / 2;
    return { theta: CF.theta(M, bm, k), beta: bm };
  };
  CF.beta = function (M, th, weak = true, k = 1.4) {
    const mx = CF.thetaMax(M, k);
    if (th > mx.theta) return null;
    const mu = Math.asin(1 / M);
    return weak ? FL.bisect((b) => CF.theta(M, b, k) - th, mu, mx.beta, 1e-14) : FL.bisect((b) => CF.theta(M, b, k) - th, mx.beta, Math.PI / 2, 1e-14);
  };
  CF.oblique = function (M1, th, weak = true, k = 1.4) {
    const b = CF.beta(M1, th, weak, k);
    if (b === null) return null;
    const n = CF.normal(M1 * Math.sin(b), k);
    return { beta: b, M2: n.M2 / Math.sin(b - th), p21: n.p21, T21: n.T21, r21: n.r21, p0r: n.p0r };
  };
  /* Prandtl–Meyer */
  CF.nu = (M, k = 1.4) => { const a = Math.sqrt((k + 1) / (k - 1)); return a * Math.atan(Math.sqrt(((k - 1) / (k + 1)) * (M * M - 1))) - Math.atan(Math.sqrt(M * M - 1)); };
  CF.Mnu = (n, k = 1.4) => FL.bisect((M) => CF.nu(M, k) - n, 1, 200, 1e-14);
  /* Fanno y Rayleigh (cantidades relativas al estado sónico) */
  CF.fanno = (M, k = 1.4) => ({ fL: (1 - M * M) / (k * M * M) + ((k + 1) / (2 * k)) * Math.log(((k + 1) * M * M) / (2 + (k - 1) * M * M)), pp: (1 / M) * Math.sqrt((k + 1) / (2 + (k - 1) * M * M)), TT: (k + 1) / (2 + (k - 1) * M * M), p0p0: (1 / M) * Math.pow((2 + (k - 1) * M * M) / (k + 1), (k + 1) / (2 * (k - 1))) });
  CF.rayleigh = (M, k = 1.4) => ({ T0T0: ((k + 1) * M * M * (2 + (k - 1) * M * M)) / Math.pow(1 + k * M * M, 2), pp: (1 + k) / (1 + k * M * M), TT: Math.pow((1 + k) * M, 2) / Math.pow(1 + k * M * M, 2) });
  /* Tobera de De Laval con contrapresión pb/p0 y relación de áreas Ae/At: régimen y posición del choque */
  CF.nozzle = function (AeAt, pb, k = 1.4) {
    const Msub = CF.MfromA(AeAt, false, k), Msup = CF.MfromA(AeAt, true, k);
    const p1 = 1 / CF.p0p(Msub, k), p3 = 1 / CF.p0p(Msup, k);
    const nE = CF.normal(Msup, k), p2 = p3 * nE.p21; /* choque normal justo a la salida */
    if (pb >= 1) return { regime: 'sin flujo', pe: 1 };
    if (pb >= p1) { const Me = CF.MfromP(pb, k); return { regime: 'subsónico', Me, pe: pb, choked: false, AsAt: CF.AAs(Me, k) * AeAt }; }
    if (pb >= p2) {
      /* choque normal dentro de la sección divergente en As: pe(As) = pb */
      /* As en unidades de At; tras el choque A*₂ = As/(A/A*)(M₂) y la salida es subsónica */
      const solve = (As) => { const Ms = CF.MfromA(As, true, k), n = CF.normal(Ms, k), Astar2 = As / CF.AAs(n.M2, k), Me = CF.MfromA(AeAt / Astar2, false, k); return { Ms, Me, pe: n.p0r / CF.p0p(Me, k), p0r: n.p0r }; };
      const As = FL.bisect((x) => solve(x).pe - pb, 1 + 1e-9, AeAt, 1e-13);
      const r = solve(As);
      return { regime: 'choque en la tobera', As, Ms: r.Ms, Me: r.Me, pe: pb, p0r: r.p0r, choked: true };
    }
    if (Math.abs(pb - p3) < 1e-9) return { regime: 'diseño', Me: Msup, pe: p3, choked: true };
    return { regime: pb > p3 ? 'sobreexpandida' : 'subexpandida', Me: Msup, pe: p3, choked: true };
  };
  CF.nozzleLimits = function (AeAt, k = 1.4) {
    const Msub = CF.MfromA(AeAt, false, k), Msup = CF.MfromA(AeAt, true, k), p3 = 1 / CF.p0p(Msup, k);
    return { p1: 1 / CF.p0p(Msub, k), p2: p3 * CF.normal(Msup, k).p21, p3 };
  };

  /* ================= Inestabilidades ================= */
  /* Rayleigh–Taylor: fluido pesado ρ2 sobre liviano ρ1, tensión γ */
  FL.rtSigma = (k, r1, r2, gam = 0) => { const s2 = (g * k * (r2 - r1) - gam * k * k * k) / (r1 + r2); return s2 > 0 ? Math.sqrt(s2) : 0; };
  /* Kelvin–Helmholtz con gravedad y tensión: fluido 1 (denso) abajo con U1, fluido 2 arriba con U2. Devuelve σ² */
  FL.khS2 = (k, r1, r2, U1, U2, gam = 0) => (r1 * r2 * k * k * (U1 - U2) * (U1 - U2)) / ((r1 + r2) * (r1 + r2)) - (g * k * (r1 - r2) + gam * k * k * k) / (r1 + r2);
  FL.khUmin = (r1, r2, gam) => Math.sqrt((2 * (r1 + r2) * Math.sqrt(gam * g * (r1 - r2))) / (r1 * r2));
  /* Plateau–Rayleigh (chorro no viscoso): σ²·ρR³/γ = x I1(x)/I0(x) (1 − x²) */
  FL.prSigma2 = (x) => (x >= 1 || x <= 0 ? 0 : (x * FL.besselI(1, x) / FL.besselI(0, x)) * (1 - x * x));
  /* Rayleigh–Bénard con fronteras libres: Ra(k) = (k² + π²)³/k² */
  FL.rbFree = (k) => Math.pow(k * k + Math.PI * Math.PI, 3) / (k * k);
  FL.lorenz = (s, r, b) => (t, y) => [s * (y[1] - y[0]), y[0] * (r - y[2]) - y[1], y[0] * y[1] - b * y[2]];

  /* ================= Fluidos en rotación ================= */
  FL.coriolisF = (latDeg) => 2 * FL.Omega * Math.sin((latDeg * Math.PI) / 180);
  FL.inertialPeriod = (latDeg) => (2 * Math.PI) / Math.abs(FL.coriolisF(latDeg));
  FL.foucaultPeriod = (latDeg) => 86164.0905 / Math.abs(Math.sin((latDeg * Math.PI) / 180));
  FL.ekmanDepth = (nu, f) => Math.sqrt((2 * nu) / Math.abs(f));
  /* Capa de Ekman de fondo bajo un flujo geostrófico Ug en x (hemisferio norte si f>0) */
  FL.ekmanBottom = (zeta, Ug, f) => ({ u: Ug * (1 - Math.exp(-zeta) * Math.cos(zeta)), v: Math.sign(f) * Ug * Math.exp(-zeta) * Math.sin(zeta) });
  /* Capa de Ekman de superficie con viento en +x: zeta = profundidad/δ ≥ 0 */
  FL.ekmanSurface = (zeta, V0, f) => { const s = Math.sign(f) || 1, ang = -s * (Math.PI / 4 + zeta); return { u: V0 * Math.exp(-zeta) * Math.cos(ang), v: V0 * Math.exp(-zeta) * Math.sin(ang) }; };

  /* ================= Reología y biofluidos ================= */
  /* Ley de potencia τ = K γ̇ⁿ en tubo: perfil y caudal (G = −dp/dx) */
  FL.powerPipe = function (r, R, G, K, n) {
    const c = Math.pow(G / (2 * K), 1 / n), e = (n + 1) / n;
    return (n / (n + 1)) * c * (Math.pow(R, e) - Math.pow(r, e));
  };
  FL.powerPipeQ = (R, G, K, n) => ((Math.PI * n) / (3 * n + 1)) * Math.pow(G / (2 * K), 1 / n) * Math.pow(R, (3 * n + 1) / n);
  /* Plástico de Bingham en tubo (Buckingham–Reiner) */
  FL.binghamPipe = function (r, R, G, mup, ty) {
    const rp = (2 * ty) / G;
    if (rp >= R) return 0;
    const rr = Math.max(r, rp);
    return (G / (4 * mup)) * (R * R - rr * rr) - (ty / mup) * (R - rr);
  };
  FL.binghamQ = function (R, G, mup, ty) {
    const tw = (G * R) / 2, x = ty / tw;
    if (x >= 1) return 0;
    return ((Math.PI * Math.pow(R, 4) * G) / (8 * mup)) * (1 - (4 / 3) * x + Math.pow(x, 4) / 3);
  };
  /* Modelos reológicos: esfuerzo τ(γ̇) */
  FL.rheo = {
    newton: (gd, p) => p.mu * gd,
    power: (gd, p) => p.K * Math.pow(gd, p.n),
    bingham: (gd, p) => (gd > 0 ? p.ty + p.mu * gd : 0),
    hb: (gd, p) => (gd > 0 ? p.ty + p.K * Math.pow(gd, p.n) : 0),
    casson: (gd, p) => Math.pow(Math.sqrt(p.ty) + Math.sqrt(p.mu * gd), 2)
  };
  /* Ley de Murray: costo de transporte + mantenimiento por unidad de longitud */
  FL.murrayCost = (r, Q, mu, b) => (8 * mu * Q * Q) / (Math.PI * Math.pow(r, 4)) + b * Math.PI * r * r;
  FL.murrayR = (Q, mu, b) => Math.pow((16 * mu * Q * Q) / (Math.PI * Math.PI * b), 1 / 6);

  /* ================= Explosión de Taylor (1950) ================= */
  /* Radio de la bola de fuego de la prueba Trinity medido en las fotografías (t en ms, R en m) */
  FL.TAYLOR = [[0.10, 11.1], [0.24, 19.9], [0.38, 25.4], [0.52, 28.8], [0.66, 31.9], [0.80, 34.2], [0.94, 36.3], [1.08, 38.9], [1.22, 41.0], [1.36, 42.8], [1.50, 44.4], [1.65, 46.0], [1.79, 46.9], [1.93, 48.7], [3.26, 59.0], [3.53, 61.1], [3.80, 62.9], [4.07, 64.3], [4.34, 65.6], [4.61, 67.3], [15.0, 106.5], [25.0, 130.0], [34.0, 145.0], [53.0, 175.0], [62.0, 185.0]];

  EM.fl = FL;
  if (typeof module !== 'undefined' && module.exports) module.exports = FL;
})();
