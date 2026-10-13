/* ===================================================================
   lib/40-inversion.js — Riesgo y rentabilidad: estadística de series
   históricas, portafolios, simulación de trayectorias, bonos, costos,
   gestión activa, especulación y apalancamiento.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const I = (L.inv = {});
  const S = () => L.stat;

  /* ---------- Series históricas (L.DATA.us) ---------- */
  I.ASSETS = [
    ['sp500', 'Acciones grandes EE. UU. (S&P 500)'],
    ['smallcap', 'Acciones pequeñas EE. UU.'],
    ['tbond', 'Bonos del Tesoro a 10 años'],
    ['baa', 'Bonos corporativos Baa'],
    ['tbill', 'Letras del Tesoro a 3 meses'],
    ['realestate', 'Vivienda (índice de precios)'],
    ['gold', 'Oro'],
    ['inflation', 'Inflación (IPC)']
  ];
  /* Rentabilidades de un activo entre dos años (inclusive), nominales o reales */
  I.series = function (key, y0 = 1928, y1 = 2025, real = false) {
    const D = L.DATA.us, a = D.years.indexOf(y0), b = D.years.indexOf(y1);
    const r = D[key].slice(a, b + 1);
    if (!real) return r;
    const inf = D.inflation.slice(a, b + 1);
    return r.map((v, k) => (1 + v) / (1 + inf[k]) - 1);
  };
  /* Índice acumulado partiendo de v0: [v0, v0(1+r1), ...] */
  I.growth = (r, v0 = 1) => { const out = [v0]; let v = v0; for (const x of r) { v *= 1 + x; out.push(v); } return out; };
  /* Caída máxima (desde un máximo previo) de un índice de valor */
  I.maxDrawdown = function (values) {
    let peak = values[0], dd = 0, from = 0, to = 0, pk = 0;
    values.forEach((v, k) => {
      if (v > peak) { peak = v; pk = k; }
      const d = v / peak - 1;
      if (d < dd) { dd = d; from = pk; to = k; }
    });
    return { dd, from, to };
  };
  I.summary = function (r) {
    return { mean: S().mean(r), geo: S().geoMean(r), sd: S().sd(r), min: Math.min(...r), max: Math.max(...r), neg: r.filter((x) => x < 0).length / r.length, mdd: I.maxDrawdown(I.growth(r)).dd };
  };
  /* Rentabilidad anualizada (geométrica) de todas las ventanas de N años consecutivos */
  I.rolling = function (r, N) {
    const out = [];
    for (let s = 0; s + N <= r.length; s++) { let p = 0; for (let k = s; k < s + N; k++) p += Math.log1p(r[k]); out.push(Math.expm1(p / N)); }
    return out;
  };
  /* Portafolio con pesos w = {clave: peso} rebalanceado cada año → rentabilidades anuales */
  I.mixRebal = function (w, y0 = 1928, y1 = 2025, real = false) {
    const keys = Object.keys(w), sers = keys.map((k) => I.series(k, y0, y1, real));
    return sers[0].map((_, t) => keys.reduce((s, k, j) => s + w[k] * sers[j][t], 0));
  };
  /* Mismo portafolio sin rebalancear (comprar y mantener) → índice de valor */
  I.mixHold = function (w, y0 = 1928, y1 = 2025, real = false) {
    const keys = Object.keys(w), sers = keys.map((k) => I.series(k, y0, y1, real));
    const val = keys.map((k) => w[k]);
    const out = [1];
    for (let t = 0; t < sers[0].length; t++) { keys.forEach((k, j) => { val[j] *= 1 + sers[j][t]; }); out.push(val.reduce((s, v) => s + v, 0)); }
    return out;
  };

  /* ---------- Portafolios teóricos ---------- */
  /* Volatilidad de n activos iguales (σ cada uno, correlación ρ entre todos) en partes iguales */
  I.sigmaN = (sigma, rho, n) => Math.sqrt((sigma * sigma) / n + (1 - 1 / n) * rho * sigma * sigma);
  /* Dos activos: media y volatilidad con peso w en el primero */
  I.two = (w, m1, s1, m2, s2, rho) => ({ m: w * m1 + (1 - w) * m2, s: Math.sqrt(w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2) });
  /* Peso de mínima varianza en el primer activo */
  I.minVarW = (s1, s2, rho) => (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2);

  /* ---------- Trayectorias aleatorias (lognormales) ----------
     μ y σ: media aritmética y desviación anual de la rentabilidad simple. Se ajusta una lognormal con
     E[1+R] = 1+μ y Var[R] = σ². Devuelve los parámetros del logaritmo por año. */
  I.lognormParams = function (mu, sigma) {
    const s2 = Math.log(1 + (sigma * sigma) / ((1 + mu) * (1 + mu)));
    return { m: Math.log(1 + mu) - s2 / 2, s: Math.sqrt(s2) };
  };
  /* Simula trayectorias mensuales de ahorro: o = {mu, sigma, anos, aporte, p0, n, seed, crecAporte}
     Devuelve, por año, la matriz de saldos [trayectoria][año] y lo aportado. */
  I.paths = function (o) {
    const { m, s } = I.lognormParams(o.mu, o.sigma);
    const mm = m / 12, sm = s / Math.sqrt(12), rng = L.rng(o.seed || 1);
    const Y = Math.round(o.anos), out = [], aport = [o.p0 || 0];
    let ap = o.aporte || 0, tot = o.p0 || 0;
    for (let y = 1; y <= Y; y++) { tot += 12 * ap; aport.push(tot); ap *= 1 + (o.crecAporte || 0); }
    for (let i = 0; i < o.n; i++) {
      let w = o.p0 || 0, a = o.aporte || 0;
      const row = [w];
      for (let y = 1; y <= Y; y++) {
        for (let k = 0; k < 12; k++) { w = w * Math.exp(mm + sm * rng.gauss()) + a; }
        row.push(w);
        a *= 1 + (o.crecAporte || 0);
      }
      out.push(row);
    }
    return { paths: out, aportado: aport };
  };
  /* Percentiles por columna de una matriz de trayectorias */
  I.fan = function (paths, qs = [0.05, 0.25, 0.5, 0.75, 0.95]) {
    const T = paths[0].length, out = qs.map(() => new Array(T));
    for (let t = 0; t < T; t++) {
      const col = Float64Array.from(paths, (p) => p[t]).sort();
      S().quantilesSorted(col, qs).forEach((v, j) => { out[j][t] = v; });
    }
    return out;
  };
  /* Remuestreo (bootstrap) por bloques de rentabilidades históricas anuales */
  I.bootstrap = function (r, anos, rng, bloque = 1) {
    const out = [];
    while (out.length < anos) { const s = rng.int(r.length - bloque + 1); for (let k = 0; k < bloque && out.length < anos; k++) out.push(r[s + k]); }
    return out;
  };

  /* ---------- Bonos ---------- */
  /* Precio de un bono de valor nominal F, cupón anual c (fracción), rendimiento y, n años, f pagos por año */
  I.bondPrice = function (F, c, y, n, f = 1) {
    const N = Math.round(n * f), cp = (F * c) / f, yp = y / f;
    if (Math.abs(yp) < 1e-12) return cp * N + F;
    return (cp * (1 - Math.pow(1 + yp, -N))) / yp + F * Math.pow(1 + yp, -N);
  };
  /* Duración de Macaulay (años) y modificada */
  I.duration = function (F, c, y, n, f = 1) {
    const N = Math.round(n * f), cp = (F * c) / f, yp = y / f;
    let pv = 0, tpv = 0;
    for (let k = 1; k <= N; k++) { const cf = cp + (k === N ? F : 0), d = cf / Math.pow(1 + yp, k); pv += d; tpv += (k / f) * d; }
    const mac = tpv / pv;
    return { macaulay: mac, modified: mac / (1 + yp), price: pv };
  };

  /* ---------- Costos ---------- */
  /* Saldo final aportando A al año (al final) durante n años con rentabilidad r y comisión anual f sobre el saldo */
  I.feeFinal = function (p0, A, r, f, n) {
    let w = p0;
    for (let k = 0; k < n; k++) w = w * (1 + r) * (1 - f) + A;
    return w;
  };

  /* ---------- Gestión activa: suerte frente a habilidad ----------
     M gestores, T años. Cada uno tiene una habilidad α_i ~ N(0, sa) antes de costos, error de seguimiento te
     y comisión f. Exceso anual sobre el índice: α_i − f + te·Z. */
  I.managers = function (o) {
    const rng = L.rng(o.seed || 7), res = [];
    for (let i = 0; i < o.M; i++) {
      const alpha = o.sa * rng.gauss();
      const ex = [];
      for (let t = 0; t < o.T; t++) ex.push(alpha - o.fee + o.te * rng.gauss());
      let acc = 0; for (const e of ex) acc += Math.log1p(e);
      res.push({ alpha, ex, cum: Math.expm1(acc) });
    }
    return res;
  };
  /* Años necesarios para distinguir una habilidad α de la suerte con error de seguimiento te (prueba t con z) */
  I.yearsToDetect = (alpha, te, z = 1.96) => Math.pow((z * te) / alpha, 2);

  /* ---------- Especulación ---------- */
  /* Kelly: crecimiento logarítmico esperado apostando la fracción f con probabilidad p de ganar b por cada 1 arriesgado */
  I.kellyGrowth = (f, p, b) => p * Math.log1p(b * f) + (1 - p) * Math.log1p(-f);
  I.kellyOpt = (p, b) => p - (1 - p) / b;
  /* Operadores minoristas: N cuentas, k operaciones por año durante Y años, probabilidad de acierto p,
     relación beneficio/riesgo R, riesgo por operación q (fracción del capital) y costo c por operación (en
     unidades de riesgo). Devuelve el capital final relativo de cada cuenta y trayectorias de muestra. */
  I.traders = function (o) {
    const rng = L.rng(o.seed || 11), fin = [], muestra = [];
    const n = Math.round(o.k * o.Y);
    for (let i = 0; i < o.N; i++) {
      let w = 1;
      const tr = i < 40 ? [1] : null;
      for (let t = 0; t < n; t++) {
        const g = rng() < o.p ? o.R : -1;
        w *= 1 + o.q * (g - o.c);
        if (w <= 0.02) { w = 0; if (tr) tr.push(0); break; } /* cuenta quemada */
        if (tr && (t + 1) % Math.max(1, Math.round(n / 120)) === 0) tr.push(w);
      }
      fin.push(w);
      if (tr) muestra.push(tr);
    }
    return { fin, muestra, expectativaR: o.p * o.R - (1 - o.p) - o.c };
  };
  /* Posición apalancada de tamaño fijo (como un CFD): capital propio 1, exposición x sobre un subyacente con
     deriva anual μ y volatilidad σ. Capital = 1 + x(P/P₀ − 1) − costo financiero diario acumulado.
     El bróker liquida si el capital cae a m (fracción del capital inicial). Simula días hábiles. */
  I.leverage = function (o) {
    const rng = L.rng(o.seed || 5), D = Math.round(252 * o.anos);
    const sd = o.sigma / Math.sqrt(252), md = o.mu / 252 - (o.sigma * o.sigma) / 504;
    let liq = 0;
    const fin = [], muestra = [];
    for (let i = 0; i < o.N; i++) {
      let lp = 0, eq = 1, dead = false;
      const tr = i < 30 ? [1] : null;
      for (let d = 1; d <= D; d++) {
        lp += md + sd * rng.gauss();
        eq = 1 + o.x * Math.expm1(lp) - (o.costoDiario || 0) * o.x * d;
        if (tr && d % 5 === 0) tr.push(Math.max(0, eq));
        if (eq <= o.m) { dead = true; break; }
      }
      if (dead) { liq++; fin.push(Math.max(0, eq)); if (tr) tr.push(Math.max(0, eq)); } else fin.push(eq);
      if (tr) muestra.push(tr);
    }
    return { pLiq: liq / o.N, fin, muestra };
  };
})(typeof window !== 'undefined' ? window : globalThis);
