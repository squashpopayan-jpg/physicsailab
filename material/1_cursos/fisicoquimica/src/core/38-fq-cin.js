/* ===================================================================
   38-fq-cin.js — Cinética química: leyes integradas, mecanismos y teoría de velocidades.
   Soluciones analíticas (para pruebas) y generadores de mecanismos para el integrador FQ.ode.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const R = FQ.R;
  const K = (FQ.kin = {});

  /* Leyes integradas para A → productos */
  K.zero = (A0, k, t) => Math.max(0, A0 - k * t);
  K.first = (A0, k, t) => A0 * Math.exp(-k * t);
  K.second = (A0, k, t) => A0 / (1 + A0 * k * t); /* 2A → P con v = k[A]² */
  K.half = (order, A0, k) => (order === 0 ? A0 / (2 * k) : order === 1 ? Math.LN2 / k : 1 / (k * A0));
  /* A + B → P con v = k[A][B]: concentración de A */
  K.abExact = (A0, B0, k, t) => { const d = A0 - B0; if (Math.abs(d) < 1e-12 * A0) return A0 / (1 + A0 * k * t); return (-d * A0) / (B0 * Math.exp(-d * k * t) - A0); };
  /* A → B → C (primer orden en ambas): ecuaciones de Bateman */
  K.bateman = function (A0, k1, k2, t) {
    const A = A0 * Math.exp(-k1 * t);
    const B = Math.abs(k1 - k2) < 1e-12 ? A0 * k1 * t * Math.exp(-k1 * t) : (A0 * k1 / (k2 - k1)) * (Math.exp(-k1 * t) - Math.exp(-k2 * t));
    return { A, B, C: A0 - A - B };
  };
  K.tmaxB = (k1, k2) => (Math.abs(k1 - k2) < 1e-12 ? 1 / k1 : Math.log(k1 / k2) / (k1 - k2));
  /* A ⇌ B: relajación hacia el equilibrio, [A](t) con k_f, k_b */
  K.reversible = (A0, B0, kf, kb, t) => { const tot = A0 + B0, Ae = (kb * tot) / (kf + kb); return Ae + (A0 - Ae) * Math.exp(-(kf + kb) * t); };
  /* Arrhenius */
  K.arrhenius = (A, Ea, T) => A * Math.exp(-Ea / (R * T));
  K.eaFromTwo = (k1, T1, k2, T2) => (R * Math.log(k2 / k1)) / (1 / T1 - 1 / T2);

  /* ------------------ Mecanismos de reacción en fase gaseosa (isotérmicos, volumen constante) ------------------
     Implementa el formato de Cantera: reacciones elementales, de tres cuerpos y de caída de presión (Troe), con constantes inversas
     de las constantes de equilibrio calculadas de los polinomios NASA-7. Unidades de Cantera: kmol, m³, s, J/kmol. */
  const DAT = EM.dat || (typeof require !== 'undefined' ? require('./29-datos.js') : null);
  const RU = 8314.462618, P0 = 101325;
  K.mechBuild = function (data) {
    const names = Object.keys(data.species), ns = names.length, idx = {}; names.forEach((n, i) => (idx[n] = i));
    const nasa = (sp, T) => { const d = data.species[sp], a = T < d.T[1] ? d.a[0] : d.a[1]; return { h: a[0] + T * (a[1] / 2 + T * (a[2] / 3 + T * (a[3] / 4 + (T * a[4]) / 5))) + a[5] / T, s: a[0] * Math.log(T) + T * (a[1] + T * (a[2] / 2 + T * (a[3] / 3 + (T * a[4]) / 4))) + a[6] }; };
    const rx = data.reactions.map((r) => ({ r, nu: names.map((n) => (r.P[n] || 0) - (r.R[n] || 0)), re: Object.entries(r.R).map(([n, v]) => [idx[n], v]), pr: Object.entries(r.P).map(([n, v]) => [idx[n], v]) }));
    const eff = (r) => { const e = new Float64Array(ns).fill(r.def); for (const [n, v] of Object.entries(r.eff || {})) e[idx[n]] = v; return e; };
    rx.forEach((q) => { if (q.r.t !== 'el') q.eff = eff(q.r); });
    const arr = (k, T) => k[0] * Math.pow(T, k[1]) * Math.exp(-k[2] / (RU * T));
    const gRT = (T) => names.map((n) => { const z = nasa(n, T); return z.h - z.s; });
    const kfOf = (q, T, C) => {
      const r = q.r; if (r.t === 'el') return arr(r.k, T);
      let M = 0; for (let i = 0; i < ns; i++) M += q.eff[i] * C[i];
      if (r.t === 'tb') return arr(r.k, T) * M;
      const k0 = arr(r.lo, T), kinf = arr(r.hi, T), Pr = (k0 * M) / kinf, [a, T3, T1, T2] = r.troe, Fc = (1 - a) * Math.exp(-T / T3) + a * Math.exp(-T / T1) + Math.exp(-T2 / T), lf = Math.log10(Fc), cc = -0.4 - 0.67 * lf, nn = 0.75 - 1.27 * lf, lp = Math.log10(Math.max(Pr, 1e-300)) + cc;
      return kinf * (Pr / (1 + Pr)) * Math.pow(10, lf / (1 + (lp / (nn - 0.14 * lp)) ** 2));
    };
    const kcOf = (q, T, g) => { let dn = 0, dg = 0; for (let i = 0; i < ns; i++) { dn += q.nu[i]; dg += q.nu[i] * g[i]; } return Math.exp(-dg) * Math.pow(P0 / (RU * T), dn); };
    return {
      names, idx, ns, rx, W: names.map((n) => data.species[n].M),
      kf: (T, C, j) => kfOf(rx[j], T, C), Kc: (T, j) => kcOf(rx[j], T, gRT(T)),
      /* información de una reacción de caída de presión: k₀, k∞, F de Troe y k efectiva a la concentración total de terceros cuerpos M */
      falloff(j, T, M) { const r = rx[j].r, k0 = arr(r.lo, T), kinf = arr(r.hi, T), Pr = (k0 * M) / kinf, [a, T3, T1, T2] = r.troe, Fc = (1 - a) * Math.exp(-T / T3) + a * Math.exp(-T / T1) + Math.exp(-T2 / T), lf = Math.log10(Fc), cc = -0.4 - 0.67 * lf, nn = 0.75 - 1.27 * lf, lp = Math.log10(Pr) + cc, F = Math.pow(10, lf / (1 + (lp / (nn - 0.14 * lp)) ** 2)); return { k0, kinf, Pr, F, Fc, k: kinf * (Pr / (1 + Pr)) * F, kLind: kinf * (Pr / (1 + Pr)) }; },
      rates(T, C) {
        const g = gRT(T), dC = new Float64Array(ns);
        for (const q of rx) {
          const r = q.r, kf = kfOf(q, T, C), kr = r.rev ? kf / kcOf(q, T, g) : 0;
          let fwd = kf, rev = kr;
          for (const [i, v] of q.re) fwd *= Math.pow(C[i], v); for (const [i, v] of q.pr) rev *= Math.pow(C[i], v);
          const qr = fwd - rev; for (let i = 0; i < ns; i++) if (q.nu[i]) dC[i] += q.nu[i] * qr;
        }
        return dC;
      }
    };
  };
  /* Integra a T fija y P inicial. X: fracciones molares {especie: x}; devuelve {t:[], X:[{especie: x}]} (X en fracciones molares) */
  K.mechRun = function (mech, T, P, X, times, rt) {
    const C0 = new Array(mech.ns).fill(0); let tot = 0; for (const v of Object.values(X)) tot += v;
    for (const [n, v] of Object.entries(X)) C0[mech.idx[n]] = ((v / tot) * P) / (RU * T);
    const sol = FQ.odeStiff((t, y) => Array.from(mech.rates(T, y.map((v) => Math.max(v, 0)))), C0, times, { rtol: rt || 1e-7, atol: 1e-14, h0: 1e-12 });
    return { t: times, C: sol.y, X: sol.y.map((y) => { const s = y.reduce((a, b) => a + b, 0), o = {}; mech.names.forEach((n, i) => (o[n] = y[i] / s)); return o; }) };
  };
  /* Segundo límite de explosión (criterio de la cadena): presión en que 2k(H + O₂ → O + OH) = k(H + O₂ + M → HO₂ + M) con la mezcla X, en atm */
  K.critP = function (mech, T, X) {
    const jb = mech.rx.findIndex((q) => q.r.eq === 'H + O2 <=> O + OH'), tb = mech.rx.map((q, i) => i).filter((i) => /^H \+ O2( \+ \S+)? <=> HO2/.test(mech.rx[i].r.eq));
    let tot = 0; for (const v of Object.values(X)) tot += v;
    const f = (P) => { const Ct = (P * 101325) / (RU * T), C = new Array(mech.ns).fill(0); for (const [n, v] of Object.entries(X)) C[mech.idx[n]] = (v / tot) * Ct; let k5 = 0; for (const i of tb) k5 += mech.kf(T, C, i); return 2 * mech.kf(T, C, jb) - k5; };
    let lo = 1e-4, hi = 1e3; for (let i = 0; i < 100; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; } return lo;
  };
  /* Tiempo en que el H₂ cae a la fracción f de su valor inicial (búsqueda por integración con paso creciente) */
  K.mechTime = function (mech, T, P, X, sp, f, tmax) {
    const times = [0]; for (let t = 1e-6; t < tmax; t *= 1.3) times.push(t); times.push(tmax);
    const r = K.mechRun(mech, T, P, X, times, 1e-5), c0 = r.C[0][mech.idx[sp]];
    for (let k = 1; k < times.length; k++) { const c = r.C[k][mech.idx[sp]]; if (c <= f * c0) { const c1 = r.C[k - 1][mech.idx[sp]]; return times[k - 1] + ((times[k] - times[k - 1]) * (c1 - f * c0)) / (c1 - c); } }
    return Infinity;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
