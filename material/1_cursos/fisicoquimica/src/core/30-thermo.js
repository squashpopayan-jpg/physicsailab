/* ===================================================================
   30-thermo.js — Biblioteca científica del curso (EM.th)
   Funciones puras, sin DOM: se validan en Node con tests/validar.js
   contra referencias independientes (SciPy y CoolProp, tests/referencias.py)
   y contra datos tabulados de la literatura (NIST-JANAF, CRC, Çengel).
   Unidades SI: T en K, P en Pa, energías específicas en J/kg salvo aviso.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const TAB = EM.tablas || (typeof require !== 'undefined' ? require('./29-tablas.js') : null);
  const kB = 1.380649e-23, NA = 6.02214076e23, R = 8.314462618, h = 6.62607015e-34, c0 = 299792458;
  const hbar = h / (2 * Math.PI), sigma = (2 * Math.PI ** 5 * kB ** 4) / (15 * h ** 3 * c0 ** 2), amu = 1.66053906660e-27, eV = 1.602176634e-19;
  const TH = { R, kB, NA, h, hbar, c0, sigma, amu, eV, g: 9.80665, P0: 101325, T0: 273.15 };

  /* ---------------- Utilidades numéricas ---------------- */
  /* raíz por bisección (f(a), f(b) de signo opuesto) */
  TH.bisect = function (f, a, b, tol = 1e-12, it = 200) {
    let fa = f(a);
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      if (Math.abs(b - a) <= tol * (1 + Math.abs(m))) break;
    }
    return 0.5 * (a + b);
  };
  /* Gauss–Legendre de 20 puntos por subintervalo */
  const GLx = [0.0765265211334973, 0.2277858511416451, 0.3737060887154195, 0.5108670019508271, 0.6360536807265150, 0.7463319064601508, 0.8391169718222188, 0.9122344282513259, 0.9639719272779138, 0.9931285991850949];
  const GLw = [0.1527533871307258, 0.1491729864726037, 0.1420961093183820, 0.1316886384491766, 0.1181945319615184, 0.1019301198172404, 0.0832767415767048, 0.0626720483341091, 0.0406014298003869, 0.0176140071391521];
  TH.quad = function (f, a, b, n = 8) {
    const hh = (b - a) / n;
    let s = 0;
    for (let k = 0; k < n; k++) {
      const c = a + (k + 0.5) * hh, r = hh / 2;
      for (let i = 0; i < 10; i++) s += GLw[i] * r * (f(c - r * GLx[i]) + f(c + r * GLx[i]));
    }
    return s;
  };
  TH.lnGamma = function (z) {
    const g = 7, C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - TH.lnGamma(1 - z);
    z -= 1;
    let x = C[0];
    for (let i = 1; i < g + 2; i++) x += C[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };
  TH.lnChoose = (n, k) => TH.lnGamma(n + 1) - TH.lnGamma(k + 1) - TH.lnGamma(n - k + 1);
  TH.erf = function (x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 3) { let sum = x, term = x; for (let n = 1; n < 200; n++) { term *= (-x * x) / n; const d = term / (2 * n + 1); sum += d; if (Math.abs(d) < 1e-17 * Math.abs(sum)) break; } return (s * 2 * sum) / Math.sqrt(Math.PI); }
    /* fracción continua para erfc */
    let f = 0; for (let n = 60; n >= 1; n--) f = (n / 2) / (x + f);
    return s * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f));
  };
  /* RK4 para y' = f(t, y) con y vector */
  TH.rk4 = function (f, t, y, dt) {
    const add = (a, b, s) => a.map((v, i) => v + s * b[i]);
    const k1 = f(t, y), k2 = f(t + dt / 2, add(y, k1, dt / 2)), k3 = f(t + dt / 2, add(y, k2, dt / 2)), k4 = f(t + dt, add(y, k3, dt));
    return y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  /* interpolación de Catmull–Rom en una malla no uniforme (x creciente) */
  function interp(xs, ys, x) {
    const n = xs.length;
    let i = 0, j = n - 1;
    if (x <= xs[0]) i = 0; else if (x >= xs[n - 1]) i = n - 2;
    else { while (j - i > 1) { const m = (i + j) >> 1; if (xs[m] > x) j = m; else i = m; } }
    const x0 = xs[i], x1 = xs[i + 1], t = (x - x0) / (x1 - x0);
    const y0 = ys[i], y1 = ys[i + 1];
    const m0 = i > 0 ? ((ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])) * (x1 - x0) : y1 - y0;
    const m1 = i < n - 2 ? ((ys[i + 2] - ys[i]) / (xs[i + 2] - xs[i])) * (x1 - x0) : y1 - y0;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
  }
  TH.interp = interp;

  /* ---------------- Fluidos reales tabulados (agua, R-134a) ---------------- */
  function makeFluid(tb) {
    const S = tb.sat, Ts = S.map((r) => r[0]), lnP = S.map((r) => Math.log(r[1]));
    const col = (k) => S.map((r) => r[k]);
    const C = { vf: col(2), hf: col(3), sf: col(4), uf: col(5), vg: col(6), hg: col(7), sg: col(8), ug: col(9) };
    const lvf = C.vf.map(Math.log), lvg = C.vg.map(Math.log);
    const F = { name: tb.name, Tc: tb.Tc, Pc: tb.Pc, M: tb.M, Tt: Ts[0], Tmax: tb.Tmax };
    F.Pmin = tb.sup[0].P; F.Pmax = tb.sup[tb.sup.length - 1].P;
    F.Psat = (T) => Math.exp(interp(Ts, lnP, T));
    F.Tsat = (P) => interp(lnP, Ts, Math.log(P));
    F.sat = function (T) {
      const o = { T, P: F.Psat(T), vf: Math.exp(interp(Ts, lvf, T)), vg: Math.exp(interp(Ts, lvg, T)) };
      for (const k of ['hf', 'sf', 'uf', 'hg', 'sg', 'ug']) o[k] = interp(Ts, C[k], T);
      o.hfg = o.hg - o.hf; o.sfg = o.sg - o.sf;
      return o;
    };
    F.satP = (P) => F.sat(F.Tsat(P));
    /* vapor sobrecalentado: interpolación bicúbica en (ln P, θ), θ = √((T−Tsat)/(Tmax−Tsat)) */
    const lnPs = tb.sup.map((r) => Math.log(r.P)), nth = tb.nth, ths = Array.from({ length: nth }, (_, j) => j / (nth - 1));
    const rowAt = (r, key, th) => interp(ths, r[key], th);
    const supRaw = function (P, th, key) {
      const vals = tb.sup.map((r) => rowAt(r, key, th));
      return interp(lnPs, vals, Math.log(P));
    };
    const thOf = (P, T) => { const Ts0 = F.Tsat(P); return Math.sqrt(Math.max(0, (T - Ts0) / (tb.Tmax - Ts0))); };
    F.sup = function (P, T) {
      const th = thOf(P, T);
      const v = Math.exp(supRaw(P, th, 'lv')), hh = supRaw(P, th, 'h'), s = supRaw(P, th, 's');
      return { P, T, v, h: hh, s, u: hh - P * v, x: null, fase: 'vapor sobrecalentado' };
    };
    /* estado general a partir de P y otra variable: {T}, {h}, {s} o {x} */
    F.state = function (P, o) {
      const st = F.satP(P), Ts0 = st.T;
      const mix = (x) => ({ P, T: Ts0, x, v: st.vf + x * (st.vg - st.vf), h: st.hf + x * st.hfg, s: st.sf + x * st.sfg, u: st.uf + x * (st.ug - st.uf), fase: x <= 0 ? 'líquido saturado' : x >= 1 ? 'vapor saturado' : 'mezcla líquido–vapor' });
      const liq = (T) => { const sl = F.sat(T); return { P, T, x: null, v: sl.vf, u: sl.uf, h: sl.hf + sl.vf * (P - sl.P), s: sl.sf, fase: 'líquido comprimido' }; };
      if (o.x !== undefined) return mix(Math.min(1, Math.max(0, o.x)));
      if (o.T !== undefined) {
        if (Math.abs(o.T - Ts0) < 1e-9) return mix(1);
        return o.T > Ts0 ? F.sup(P, o.T) : liq(Math.max(F.Tt, o.T));
      }
      const key = o.h !== undefined ? 'h' : 's', val = o[key];
      const f0 = st[key + 'f'], g0 = st[key + 'g'];
      if (val >= f0 && val <= g0) return mix((val - f0) / (g0 - f0));
      if (val > g0) {
        const T = TH.bisect((T) => F.sup(P, T)[key] - val, Ts0, tb.Tmax, 1e-10);
        return F.sup(P, T);
      }
      const T = TH.bisect((T) => liq(T)[key] - val, F.Tt, Ts0, 1e-10);
      return liq(T);
    };
    F.domo = function (n = 80) {
      const out = [];
      for (let i = 0; i < n; i++) { const T = F.Tt + (F.Tc - F.Tt) * (1 - Math.pow(1 - i / (n - 1), 1.6)) * 0.99999; out.push(F.sat(T)); }
      return out;
    };
    return F;
  }
  if (TAB) { TH.agua = makeFluid(TAB.agua); TH.r134a = makeFluid(TAB.r134a); }

  /* ---------------- Gas ideal: modelo estadístico RRHO ---------------- */
  /* Rotor rígido + osciladores armónicos. th: temperaturas vibracionales (K) con multiplicidad.
     Hf: entalpía de formación a 298.15 K (J/mol), NIST-JANAF. */
  const SP = {
    Ar: { M: 39.948, at: 1, Hf: 0, vib: [] },
    He: { M: 4.0026, at: 1, Hf: 0, vib: [] },
    N2: { M: 28.0134, lin: true, Hf: 0, vib: [3393.5] },
    O2: { M: 31.9988, lin: true, Hf: 0, vib: [2273.6] },
    H2: { M: 2.01588, lin: true, Hf: 0, vib: [6332] },
    CO: { M: 28.0101, lin: true, Hf: -110530, vib: [3122] },
    NO: { M: 30.006, lin: true, Hf: 90291, vib: [2739] },
    CO2: { M: 44.0095, lin: true, Hf: -393520, vib: [1918, 959.7, 959.7, 3380] },
    H2O: { M: 18.0153, lin: false, Hf: -241826, vib: [5262, 2295, 5404] },
    CH4: { M: 16.0425, lin: false, Hf: -74873, vib: [4197, 2207, 2207, 4344, 4344, 4344, 1879, 1879, 1879] }
  };
  TH.SP = SP;
  const einCv = (x) => (x > 700 ? 0 : (x * x * Math.exp(x)) / Math.pow(Math.expm1(x), 2));
  /* cp molar (J/mol·K) */
  TH.cpMol = function (sp, T) {
    const s = SP[sp];
    let c = s.at ? 2.5 : s.lin ? 3.5 : 4;
    for (const th of s.vib) c += einCv(th / T);
    return c * R;
  };
  /* h(T) − h(298.15) molar, J/mol */
  const hvib = (th, T) => (th / T > 700 ? 0 : (R * th) / Math.expm1(th / T));
  TH.dhMol = function (sp, T) {
    const s = SP[sp];
    let c = (s.at ? 2.5 : s.lin ? 3.5 : 4) * R * (T - 298.15);
    for (const th of s.vib) c += hvib(th, T) - hvib(th, 298.15);
    return c;
  };
  TH.hMol = (sp, T) => SP[sp].Hf + TH.dhMol(sp, T);
  /* aire seco (78.12 % N2, 20.96 % O2, 0.92 % Ar) */
  const AIRf = { N2: 0.7812, O2: 0.2096, Ar: 0.0092 };
  TH.Mair = 28.9647;
  TH.Rair = (R / TH.Mair) * 1000;
  TH.cpAire = (T) => (Object.entries(AIRf).reduce((a, [k, y]) => a + y * TH.cpMol(k, T), 0) / TH.Mair) * 1000;
  TH.dhAire = (T) => (Object.entries(AIRf).reduce((a, [k, y]) => a + y * TH.dhMol(k, T), 0) / TH.Mair) * 1000;
  /* entropía estándar s°(T) − s°(298) sin término de presión, J/kg·K */
  TH.ds0Aire = (T) => TH.quad((t) => TH.cpAire(t) / t, 298.15, T, 6);

  /* ---------------- Combustión ---------------- */
  /* combustibles: [C, H, O, Hf (J/mol) en el estado indicado, M] */
  TH.FUEL = {
    CH4: { n: 'Metano', C: 1, H: 4, O: 0, Hf: -74873, M: 16.043 },
    C3H8: { n: 'Propano', C: 3, H: 8, O: 0, Hf: -103850, M: 44.097 },
    C4H10: { n: 'Butano', C: 4, H: 10, O: 0, Hf: -126150, M: 58.123 },
    C8H18: { n: 'Octano (líquido)', C: 8, H: 18, O: 0, Hf: -249950, M: 114.23 },
    C2H5OH: { n: 'Etanol (líquido)', C: 2, H: 6, O: 1, Hf: -277690, M: 46.069 },
    H2: { n: 'Hidrógeno', C: 0, H: 2, O: 0, Hf: 0, M: 2.016 },
    C: { n: 'Carbono (grafito)', C: 1, H: 0, O: 0, Hf: 0, M: 12.011 }
  };
  /* combustión completa con aire, fracción de aire teórico lam (≥ 1 para pobre; < 1 produce CO) */
  TH.combustion = function (fuel, lam = 1) {
    const f = TH.FUEL[fuel], a0 = f.C + f.H / 4 - f.O / 2, a = lam * a0;
    const prod = { CO2: f.C, H2O: f.H / 2, N2: 3.76 * a, O2: 0, CO: 0 };
    if (lam >= 1) prod.O2 = a - a0;
    else { const def = 2 * (a0 - a); prod.CO = Math.min(f.C, def); prod.CO2 = f.C - prod.CO; }
    const AF = (a * 4.76 * TH.Mair) / f.M;
    return { a0, a, prod, AF };
  };
  /* temperatura de llama adiabática (presión constante, reactivos a Tr, sin disociación) */
  TH.flameT = function (fuel, lam = 1, Tr = 298.15) {
    const f = TH.FUEL[fuel], c = TH.combustion(fuel, lam);
    const Hr = f.Hf + c.a * (TH.dhMol('O2', Tr) + 3.76 * TH.dhMol('N2', Tr));
    const Hp = (T) => Object.entries(c.prod).reduce((s, [k, n]) => s + n * TH.hMol(k, T), 0);
    return TH.bisect((T) => Hp(T) - Hr, 298.15, 5000, 1e-10);
  };
  /* composición de productos con disociación de CO2 y H2O (CO, H2, O2) a T y P (bar) */
  TH.dissProducts = function (prod, T, P) {
    const K1 = Math.exp(TH.lnKp('co2', T)), K2 = Math.exp(TH.lnKp('h2o', T));
    const c0 = prod.CO2 + (prod.CO || 0), h0 = prod.H2O, o0 = prod.O2, n2 = prod.N2, co0 = prod.CO || 0;
    const comp = (a, b) => ({ CO2: c0 - co0 - a, CO: co0 + a, H2O: h0 - b, H2: b, O2: o0 + (a + b) / 2, N2: n2 });
    const tot = (c) => c.CO2 + c.CO + c.H2O + c.H2 + c.O2 + c.N2;
    const solveB = (a) => {
      if (h0 <= 0) return 0;
      return TH.bisect((b) => { const c = comp(a, b), n = tot(c); return (c.H2 * Math.sqrt(c.O2)) / c.H2O * Math.sqrt(P / n) - K2; }, 1e-14, h0 * (1 - 1e-12), 1e-14);
    };
    if (c0 - co0 <= 0) { const b = solveB(0); return comp(0, b); }
    const a = TH.bisect((a) => { const b = solveB(a), c = comp(a, b), n = tot(c); return (c.CO * Math.sqrt(Math.max(1e-300, c.O2))) / c.CO2 * Math.sqrt(P / n) - K1; }, 1e-14, (c0 - co0) * (1 - 1e-12), 1e-14);
    return comp(a, solveB(a));
  };
  TH.flameTdiss = function (fuel, lam = 1, P = 1, Tr = 298.15) {
    if (lam < 1) return NaN; /* mezclas ricas: requieren el equilibrio de desplazamiento CO–H2O, no incluido */
    const f = TH.FUEL[fuel], c = TH.combustion(fuel, lam);
    const Hr = f.Hf + c.a * (TH.dhMol('O2', Tr) + 3.76 * TH.dhMol('N2', Tr));
    const Hp = (T) => { const pr = TH.dissProducts(c.prod, T, P); return Object.entries(pr).reduce((s, [k, n]) => s + n * TH.hMol(k, T), 0); };
    return TH.bisect((T) => Hp(T) - Hr, 1000, 4000, 1e-9);
  };

  /* poder calorífico inferior (agua como vapor), J/kg de combustible */
  TH.PCI = function (fuel) {
    const f = TH.FUEL[fuel];
    return -(f.C * SP.CO2.Hf + (f.H / 2) * SP.H2O.Hf - f.Hf) / (f.M * 1e-3);
  };
  TH.PCS = (fuel) => TH.PCI(fuel) + ((TH.FUEL[fuel].H / 2) * 44004) / (TH.FUEL[fuel].M * 1e-3);

  /* ---------------- Ecuaciones de estado cúbicas ---------------- */
  TH.CRIT = {
    N2: { n: 'Nitrógeno', Tc: 126.19, Pc: 3.3958e6, w: 0.0372, M: 28.013 },
    O2: { n: 'Oxígeno', Tc: 154.58, Pc: 5.043e6, w: 0.0222, M: 31.999 },
    CO2: { n: 'Dióxido de carbono', Tc: 304.13, Pc: 7.3773e6, w: 0.2239, M: 44.01 },
    CH4: { n: 'Metano', Tc: 190.56, Pc: 4.599e6, w: 0.0114, M: 16.043 },
    H2O: { n: 'Agua', Tc: 647.096, Pc: 22.064e6, w: 0.3443, M: 18.015 },
    C3H8: { n: 'Propano', Tc: 369.89, Pc: 4.2512e6, w: 0.1521, M: 44.097 },
    Ar: { n: 'Argón', Tc: 150.687, Pc: 4.863e6, w: -0.0022, M: 39.948 }
  };
  /* raíces reales de z³ + a z² + b z + c */
  TH.cubicRoots = function (a, b, c) {
    const Q = (a * a - 3 * b) / 9, Rr = (2 * a * a * a - 9 * a * b + 27 * c) / 54;
    if (Rr * Rr < Q * Q * Q) {
      const t = Math.acos(Rr / Math.sqrt(Q * Q * Q)), s = -2 * Math.sqrt(Q);
      return [s * Math.cos(t / 3) - a / 3, s * Math.cos((t + 2 * Math.PI) / 3) - a / 3, s * Math.cos((t - 2 * Math.PI) / 3) - a / 3].sort((x, y) => x - y);
    }
    const A = -Math.sign(Rr) * Math.cbrt(Math.abs(Rr) + Math.sqrt(Rr * Rr - Q * Q * Q)), B = A === 0 ? 0 : Q / A;
    return [A + B - a / 3];
  };
  /* parámetros a, b molares (Pa·m⁶/mol², m³/mol) */
  TH.eosAB = function (model, g, T) {
    const { Tc, Pc, w } = TH.CRIT[g];
    if (model === 'vdw') return { a: (27 * R * R * Tc * Tc) / (64 * Pc), b: (R * Tc) / (8 * Pc), u: 0, ww: 0 };
    if (model === 'rk') return { a: (0.42748 * R * R * Math.pow(Tc, 2.5)) / (Pc * Math.sqrt(T)), b: (0.08664 * R * Tc) / Pc, u: 1, ww: 0 };
    const k = 0.37464 + 1.54226 * w - 0.26992 * w * w, al = Math.pow(1 + k * (1 - Math.sqrt(T / Tc)), 2);
    return { a: (0.45724 * R * R * Tc * Tc * al) / Pc, b: (0.0778 * R * Tc) / Pc, u: 2, ww: -1 };
  };
  /* presión P(T, v molar) */
  TH.eosP = function (model, g, T, v) {
    const { a, b, u, ww } = TH.eosAB(model, g, T);
    return (R * T) / (v - b) - a / (v * v + u * b * v + ww * b * b);
  };
  /* factores de compresibilidad (todas las raíces) a T, P */
  TH.eosZ = function (model, g, T, P) {
    const { a, b, u, ww } = TH.eosAB(model, g, T);
    const A = (a * P) / (R * R * T * T), B = (b * P) / (R * T);
    const c2 = -(1 + B - u * B), c1 = A + ww * B * B - u * B - u * B * B, c0 = -(A * B + ww * B * B + ww * B * B * B);
    return TH.cubicRoots(c2, c1, c0).filter((z) => z > B);
  };
  /* entalpía molar real con Peng–Robinson: h_ig(T) (RRHO) + función de alejamiento; raíz de vapor por defecto */
  TH.prH = function (g, T, P, liquid = false) {
    const { Tc, Pc, w } = TH.CRIT[g];
    const ac = (0.45724 * R * R * Tc * Tc) / Pc, b = (0.0778 * R * Tc) / Pc, k = 0.37464 + 1.54226 * w - 0.26992 * w * w;
    const sq = 1 + k * (1 - Math.sqrt(T / Tc)), a = ac * sq * sq, dadT = (-ac * k * sq) / Math.sqrt(T * Tc);
    const zs = TH.eosZ('pr', g, T, P), Z = liquid ? zs[0] : zs[zs.length - 1], B = (b * P) / (R * T), s2 = Math.SQRT2;
    const dep = R * T * (Z - 1) + ((T * dadT - a) / (2 * s2 * b)) * Math.log((Z + (1 + s2) * B) / (Z + (1 - s2) * B));
    return TH.dhMol(g, T) + dep;
  };
  /* temperatura tras una estrangulación isentálpica (Joule–Thomson) */
  TH.jtT2 = function (g, T1, P1, P2) {
    const h1 = TH.prH(g, T1, P1);
    return TH.bisect((T) => TH.prH(g, T, P2) - h1, Math.max(60, 0.3 * T1), 3 * T1, 1e-10);
  };
  /* coeficiente de Joule–Thomson (K/Pa) por diferencias centradas */
  TH.muJT = function (g, T, P) {
    const dP = Math.max(1e3, P * 1e-3);
    return (TH.jtT2(g, T, P, P + dP) - TH.jtT2(g, T, P, P - dP)) / (2 * dP);
  };

  /* van der Waals reducida y construcción de Maxwell */
  TH.vdwPr = (Tr, vr) => (8 * Tr) / (3 * vr - 1) - 3 / (vr * vr);
  TH.vdwMaxwell = function (Tr) {
    /* devuelve {Pr, vl, vg} con áreas iguales */
    const roots = (Pr) => TH.cubicRoots(-(1 / 3) * (1 + (8 * Tr) / Pr), 3 / Pr, -1 / Pr);
    const area = (Pr) => {
      const r = roots(Pr); if (r.length < 3) return NaN;
      const [vl, , vg] = r;
      const I = (8 * Tr / 3) * Math.log((3 * vg - 1) / (3 * vl - 1)) + 3 / vg - 3 / vl;
      return I - Pr * (vg - vl);
    };
    /* rango de presiones con tres raíces: entre el mínimo y el máximo locales de la isoterma */
    let lo = 1e-6, hi = 1;
    const sp = [];
    for (let i = 1; i < 4000; i++) { const v = 0.34 + i * 0.002; const d1 = TH.vdwPr(Tr, v + 1e-6) - TH.vdwPr(Tr, v - 1e-6); sp.push([v, d1]); }
    let vmin = null, vmax = null;
    for (let i = 1; i < sp.length; i++) { if (sp[i - 1][1] < 0 && sp[i][1] >= 0 && vmin === null) vmin = sp[i][0]; if (sp[i - 1][1] > 0 && sp[i][1] <= 0 && vmin !== null) { vmax = sp[i][0]; break; } }
    if (vmin === null || vmax === null) return null;
    lo = Math.max(1e-9, TH.vdwPr(Tr, vmin)) * 1.0000001; hi = TH.vdwPr(Tr, vmax) * 0.9999999;
    /* acotar el cambio de signo en una malla donde el área está definida */
    let a0 = null, b0 = null, prev = null;
    for (let i = 0; i <= 400; i++) {
      const P = lo + ((hi - lo) * i) / 400, f = area(P);
      if (!isFinite(f)) continue;
      if (prev && prev[1] * f <= 0) { a0 = prev[0]; b0 = P; break; }
      prev = [P, f];
    }
    if (a0 === null) return null;
    const Pr = TH.bisect(area, a0, b0, 1e-13);
    const r = roots(Pr);
    return { Pr, vl: r[0], vg: r[2] };
  };

  /* ---------------- Teoría cinética ---------------- */
  TH.maxwell = function (M, T) {
    const m = (M * 1e-3) / NA, a = Math.sqrt((2 * kB * T) / m);
    return {
      vp: a, vm: (2 * a) / Math.sqrt(Math.PI), vrms: a * Math.sqrt(1.5),
      f: (v) => (4 / Math.sqrt(Math.PI)) * (v * v) / (a * a * a) * Math.exp(-(v * v) / (a * a)),
      /* fracción con rapidez mayor que v */
      above: (v) => { const x = v / a; return 1 - TH.erf(x) + (2 / Math.sqrt(Math.PI)) * x * Math.exp(-x * x); }
    };
  };
  /* recorrido libre medio con diámetro de colisión d (m) */
  TH.mfp = (T, P, d) => (kB * T) / (Math.SQRT2 * Math.PI * d * d * P);
  /* viscosidad de esferas duras (Chapman–Enskog de primer orden) */
  TH.viscHS = (M, T, d) => (5 / 16) * Math.sqrt(((M * 1e-3) / NA) * kB * T / Math.PI) / (d * d);

  /* ---------------- Atmósfera y aire húmedo ---------------- */
  /* atmósfera estándar ISA (troposfera) */
  TH.isa = function (z) {
    const T = 288.15 - 0.0065 * z;
    return { T, P: 101325 * Math.pow(T / 288.15, 9.80665 / (0.0065 * 287.05287)), rho: 0 };
  };
  /* presión de saturación del agua: Wagner y Pruss (1993), IAPWS */
  TH.psatW = function (T) {
    const Tc = 647.096, Pc = 22.064e6, t = 1 - T / Tc;
    if (T < 273.16) {
      const th = T / 273.16;
      return 611.657 * Math.exp(-13.928169 * (1 - Math.pow(th, -1.5)) + 34.7078238 * (1 - Math.pow(th, -1.25)));
    }
    const a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
    const e = [1, 1.5, 3, 3.5, 4, 7.5];
    let s = 0; for (let i = 0; i < 6; i++) s += a[i] * Math.pow(t, e[i]);
    return Pc * Math.exp((Tc / T) * s);
  };
  TH.tsatW = (P) => TH.bisect((T) => TH.psatW(T) - P, 190, 647.09, 1e-12);
  /* psicrometría (T en °C, P en Pa); ω kg agua / kg aire seco; h kJ/kg aire seco */
  TH.psy = {
    w: (T, phi, P) => { const pv = phi * TH.psatW(T + 273.15); return (0.621945 * pv) / (P - pv); },
    phi: (T, w, P) => (w * P) / ((0.621945 + w) * TH.psatW(T + 273.15)),
    h: (T, w) => 1.006 * T + w * (2501 + 1.86 * T),
    Tdew: (w, P) => TH.tsatW((w * P) / (0.621945 + w)) - 273.15,
    /* bulbo húmedo termodinámico: saturación adiabática */
    Twb: function (T, w, P) {
      return TH.bisect((Tw) => { const ws = TH.psy.w(Tw, 1, P); return (1.006 * (Tw - T) + ws * (2501 + 1.86 * Tw) - w * (2501 + 1.86 * T)) - (ws - w) * 4.186 * Tw; }, -40, T, 1e-10);
    },
    v: (T, w, P) => (287.055 * (T + 273.15) * (1 + 1.607858 * w)) / P
  };

  /* ---------------- Ciclos ---------------- */
  TH.carnot = (TH_, TC) => 1 - TC / TH_;
  TH.otto = (r, k = 1.4) => 1 - Math.pow(r, 1 - k);
  TH.diesel = (r, rc, k = 1.4) => 1 - (Math.pow(r, 1 - k) * (Math.pow(rc, k) - 1)) / (k * (rc - 1));
  TH.dual = (r, rp, rc, k = 1.4) => 1 - (rp * Math.pow(rc, k) - 1) / (Math.pow(r, k - 1) * (rp - 1 + k * rp * (rc - 1)));
  TH.braytonIdeal = (rp, k = 1.4) => 1 - Math.pow(rp, (1 - k) / k);
  /* Brayton con eficiencias isentrópicas y regenerador; cp, k constantes. T en K */
  TH.brayton = function (o) {
    const { rp, T1, T3, etac = 1, etat = 1, eps = 0, cp = 1005, k = 1.4 } = o;
    const e = (k - 1) / k;
    const T2s = T1 * Math.pow(rp, e), T2 = T1 + (T2s - T1) / etac;
    const T4s = T3 / Math.pow(rp, e), T4 = T3 - etat * (T3 - T4s);
    const wc = cp * (T2 - T1), wt = cp * (T3 - T4), wn = wt - wc;
    const Tx = eps > 0 && T4 > T2 ? T2 + eps * (T4 - T2) : T2;
    const qin = cp * (T3 - Tx);
    return { T2, T4, Tx, wc, wt, wn, qin, eta: wn / qin, bwr: wc / wt };
  };
  /* Rankine con agua: P alta, P baja (Pa), T de entrada a la turbina (K) o null (vapor saturado), eficiencias, recalentamiento */
  TH.rankine = function (o) {
    const W = TH.agua, { Ph, Pl, T3 = null, etat = 1, etap = 1, Prh = null, Trh = null } = o;
    const s1 = W.state(Pl, { x: 0 });
    const wp = (s1.v * (Ph - Pl)) / etap;
    const h2 = s1.h + wp;
    const s3 = T3 ? W.state(Ph, { T: T3 }) : W.state(Ph, { x: 1 });
    let wt = 0, qin = h2 > 0 ? s3.h - h2 : 0, s4;
    const expand = (a, P) => { const is = W.state(P, { s: a.s }); const hh = a.h - etat * (a.h - is.h); return W.state(P, { h: hh }); };
    if (Prh && Trh) {
      const a = expand(s3, Prh); wt += s3.h - a.h;
      const b = W.state(Prh, { T: Trh }); qin += b.h - a.h;
      s4 = expand(b, Pl); wt += b.h - s4.h;
    } else { s4 = expand(s3, Pl); wt = s3.h - s4.h; }
    const qout = s4.h - s1.h;
    return { s1, h2, s3, s4, wp, wt, qin, qout, wn: wt - wp, eta: (wt - wp) / qin, bwr: wp / wt };
  };
  /* Rankine regenerativo con un calentador abierto a la presión Pb (Pa) */
  TH.rankineRegen = function (o) {
    const W = TH.agua, { Ph, Pl, Pb, T5, etat = 1, etap = 1 } = o;
    const s1 = W.state(Pl, { x: 0 }), wp1 = (s1.v * (Pb - Pl)) / etap, h2 = s1.h + wp1;
    const s3 = W.state(Pb, { x: 0 }), wp2 = (s3.v * (Ph - Pb)) / etap, h4 = s3.h + wp2;
    const s5 = W.state(Ph, { T: T5 });
    const exp = (a, P) => { const is = W.state(P, { s: a.s }); return W.state(P, { h: a.h - etat * (a.h - is.h) }); };
    const s6 = exp(s5, Pb), s7 = exp(s6, Pl);
    const y = (s3.h - h2) / (s6.h - h2);
    const wt = s5.h - s6.h + (1 - y) * (s6.h - s7.h), wp = (1 - y) * wp1 + wp2, qin = s5.h - h4;
    return { y, wt, wp, qin, wn: wt - wp, eta: (wt - wp) / qin, s1, s3, s5, s6, s7, h2, h4 };
  };

  /* compresión de vapor con R-134a: T del evaporador y del condensador (K), sobrecalentamiento, subenfriamiento, eficiencia del compresor */
  TH.refrig = function (o) {
    const F = TH.r134a, { Te, Tc, etac = 1, sh = 0, sc = 0 } = o;
    const Pe = F.Psat(Te), Pc = F.Psat(Tc);
    const s1 = sh > 0 ? F.state(Pe, { T: Te + sh }) : F.state(Pe, { x: 1 });
    const s2s = F.state(Pc, { s: s1.s }), h2 = s1.h + (s2s.h - s1.h) / etac, s2 = F.state(Pc, { h: h2 });
    const s3 = sc > 0 ? F.state(Pc, { T: Tc - sc }) : F.state(Pc, { x: 0 });
    const s4 = F.state(Pe, { h: s3.h });
    const qL = s1.h - s4.h, w = h2 - s1.h;
    return { Pe, Pc, s1, s2, s2s, s3, s4, qL, w, qH: qL + w, cop: qL / w, copHP: (qL + w) / w, copCarnot: Te / (Tc - Te) };
  };

  /* ---------------- Transferencia de calor ---------------- */
  TH.planck = (lam, T) => (2 * h * c0 * c0) / Math.pow(lam, 5) / Math.expm1((h * c0) / (lam * kB * T)); /* W/m²·sr·m */
  TH.wienB = 2.897771955e-3;
  /* fracción de la emisión de cuerpo negro entre 0 y λ (serie de Chang y Rhee) */
  TH.bbFrac = function (lam, T) {
    const x = (h * c0) / (lam * kB * T);
    let s = 0;
    for (let n = 1; n <= 60; n++) s += (Math.exp(-n * x) / n) * (x * x * x + (3 * x * x) / n + (6 * x) / (n * n) + 6 / (n * n * n));
    return Math.max(0, Math.min(1, (15 / Math.PI ** 4) * s));
  };
  /* aleta recta de extremo adiabático */
  TH.fin = function (hc, k, D, L) {
    const P = Math.PI * D, A = (Math.PI * D * D) / 4, m = Math.sqrt((hc * P) / (k * A));
    return { m, eta: Math.tanh(m * L) / (m * L), q1: Math.sqrt(hc * P * k * A) * Math.tanh(m * L) };
  };
  /* convección natural en placa vertical (Churchill–Chu) — aire, propiedades a temperatura de película */
  TH.airProps = function (T) {
    /* aproximaciones de Sutherland y polinomios (300–600 K) */
    const mu = (1.716e-5 * Math.pow(T / 273.15, 1.5) * (273.15 + 110.4)) / (T + 110.4);
    const k = (0.0241 * Math.pow(T / 273.15, 1.5) * (273.15 + 194)) / (T + 194);
    const rho = 101325 / (287.05 * T), cp = TH.cpAire(T);
    return { mu, k, rho, cp, nu: mu / rho, Pr: (mu * cp) / k, alpha: k / (rho * cp) };
  };
  TH.nuVertical = (Ra, Pr) => Math.pow(0.825 + (0.387 * Math.pow(Ra, 1 / 6)) / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 8 / 27), 2);
  /* paso explícito de la ecuación del calor 1D con bordes Dirichlet (a, b) o null (aislado) */
  TH.heatStep = function (T, D, dx, dt, a, b) {
    const n = T.length, N = new Float64Array(n), r = (D * dt) / (dx * dx);
    for (let i = 1; i < n - 1; i++) N[i] = T[i] + r * (T[i + 1] - 2 * T[i] + T[i - 1]);
    N[0] = a === null ? T[0] + 2 * r * (T[1] - T[0]) : a;
    N[n - 1] = b === null ? T[n - 1] + 2 * r * (T[n - 2] - T[n - 1]) : b;
    return N;
  };

  /* ---------------- Termodinámica estadística ---------------- */
  /* sólido de Einstein: ln Ω(N, q) */
  TH.lnOmegaE = (N, q) => TH.lnChoose(q + N - 1, q);
  /* dos niveles (Schottky): capacidad calorífica por partícula / kB */
  TH.schottky = (t) => { const x = 1 / t; return (x * x * Math.exp(x)) / Math.pow(1 + Math.exp(x), 2); };
  TH.einsteinCv = (T, th) => einCv(th / T);
  TH.debyeCv = function (T, th) {
    const xD = th / T;
    const f = (x) => (x < 1e-6 ? x * x : x > 700 ? 0 : (Math.pow(x, 4) * Math.exp(x)) / Math.pow(Math.expm1(x), 2));
    return (3 / Math.pow(xD, 3)) * TH.quad(f, 0, Math.min(xD, 60), 16);
  };
  /* entropía de Sackur–Tetrode, J/mol·K */
  TH.sackur = function (M, T, P) {
    const m = (M * 1e-3) / NA, lam = h / Math.sqrt(2 * Math.PI * m * kB * T);
    return R * (Math.log((kB * T) / (P * lam * lam * lam)) + 2.5);
  };
  /* funciones de partición molecular */
  TH.qTrans = (M, T, V) => V * Math.pow((2 * Math.PI * ((M * 1e-3) / NA) * kB * T) / (h * h), 1.5);
  TH.qRot = (T, thr, sym) => T / (sym * thr);
  TH.qVib = (T, thv) => 1 / (1 - Math.exp(-thv / T));
  /* integral de Fermi–Dirac completa F_j(η) = (1/Γ(j+1)) ∫ x^j/(e^{x−η}+1) dx */
  TH.fermiInt = function (j, eta) {
    /* cambio x = u² para suavizar la raíz en el origen */
    const top = Math.sqrt(Math.max(eta, 0) + 60), um = Math.sqrt(Math.max(eta, 0));
    const f = (u) => 2 * Math.pow(u, 2 * j + 1) / (Math.exp(u * u - eta) + 1);
    const I = eta > 0 ? TH.quad(f, 0, um, 24) + TH.quad(f, um, top, 24) : TH.quad(f, 0, top, 24);
    return I / Math.exp(TH.lnGamma(j + 1));
  };
  /* polilogaritmo g_j(z) = Σ z^k/k^j (0 ≤ z ≤ 1), para gases de Bose */
  TH.boseG = function (j, z) {
    let s = 0;
    for (let k = 1; k < 200000; k++) { const t = Math.pow(z, k) / Math.pow(k, j); s += t; if (t < 1e-16 * s) break; }
    return s;
  };
  TH.zeta32 = 2.612375348685488;
  TH.becTc = (M, n) => ((2 * Math.PI * hbar * hbar) / (((M * 1e-3) / NA) * kB)) * Math.pow(n / TH.zeta32, 2 / 3);
  /* energía de Fermi de electrones libres, J */
  TH.fermiE = (n) => ((hbar * hbar) / (2 * 9.1093837015e-31)) * Math.pow(3 * Math.PI * Math.PI * n, 2 / 3);

  /* ---------------- No equilibrio ---------------- */
  /* eficiencia máxima de un generador termoeléctrico con figura de mérito ZT media */
  TH.tegEta = (Th, Tc, ZT) => (1 - Tc / Th) * (Math.sqrt(1 + ZT) - 1) / (Math.sqrt(1 + ZT) + Tc / Th);
  /* eficiencia a potencia máxima de Curzon–Ahlborn */
  TH.curzon = (Th, Tc) => 1 - Math.sqrt(Tc / Th);
  TH.landauer = (T) => kB * T * Math.log(2);

  /* entropía absoluta estándar (1 bar) a 298.15 K, J/mol·K (NIST-JANAF) y s°(T) con c_p estadístico */
  const S298 = { Ar: 154.85, He: 126.15, N2: 191.61, O2: 205.15, H2: 130.68, CO: 197.66, NO: 210.76, CO2: 213.79, H2O: 188.84, CH4: 186.25 };
  TH.S298 = S298;
  TH.s0Mol = (sp, T) => S298[sp] + TH.quad((t) => TH.cpMol(sp, t) / t, 298.15, T, 10);
  TH.g0Mol = (sp, T) => TH.hMol(sp, T) - T * TH.s0Mol(sp, T);
  /* reacciones: coeficientes estequiométricos (productos +, reactivos −) */
  TH.RXN = {
    co2: { n: 'CO₂ ⇌ CO + ½ O₂', nu: { CO2: -1, CO: 1, O2: 0.5 } },
    h2o: { n: 'H₂O ⇌ H₂ + ½ O₂', nu: { H2O: -1, H2: 1, O2: 0.5 } },
    no: { n: '½ N₂ + ½ O₂ ⇌ NO', nu: { N2: -0.5, O2: -0.5, NO: 1 } },
    wgs: { n: 'CO + H₂O ⇌ CO₂ + H₂', nu: { CO: -1, H2O: -1, CO2: 1, H2: 1 } }
  };
  /* ln K_p a T (presión de referencia 1 bar) */
  TH.lnKp = function (rx, T) {
    const nu = TH.RXN[rx].nu;
    let dG = 0; for (const [sp, n] of Object.entries(nu)) dG += n * TH.g0Mol(sp, T);
    return -dG / (R * T);
  };

  /* ---------------- Equilibrio químico ---------------- */
  /* N2O4 ⇌ 2 NO2: ΔH°, ΔS° a 298 K (NIST); grado de disociación a T, P (Pa) */
  TH.n2o4 = function (T, P) {
    const dH = 57200, dS = 175.8;
    const K = Math.exp(-(dH - T * dS) / (R * T)), Pr = P / 1e5;
    const al = Math.sqrt(K / (K + 4 * Pr));
    return { K, alpha: al };
  };
  /* ecuación de Clausius–Clapeyron integrada */
  TH.clausius = (P1, T1, L, T2, Mkg) => P1 * Math.exp(-(L * Mkg / R) * (1 / T2 - 1 / T1));

  EM.th = TH;
  if (typeof module !== 'undefined' && module.exports) module.exports = TH;
})();
