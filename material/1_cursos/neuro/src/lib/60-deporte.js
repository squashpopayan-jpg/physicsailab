/* ===================================================================
   lib/60-deporte.js — Entrenamiento y aprendizaje motor:
   modelo de impulso-respuesta de Banister (forma = estado físico − fatiga),
   carga por RPE de sesión con monotonía y tensión (Foster), cociente de
   carga aguda:crónica (con su acoplamiento matemático), curvas de
   aprendizaje potencial y exponencial (Heathcote y otros, 2000).
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const D = (L.dep = {});

  /* ---------- Banister (1975): p(t) = p0 + k1·g(t) − k2·h(t) ----------
     g(t) = Σ_{s<t} w(s) e^{−(t−s)/τ1} (estado físico), h(t) igual con τ2 (fatiga). Carga w en UA/día. */
  D.banister = function (loads, o = {}) {
    const t1 = o.tau1 || 42, t2 = o.tau2 || 7, k1 = o.k1 === undefined ? 1 : o.k1, k2 = o.k2 === undefined ? 2 : o.k2, p0 = o.p0 || 0;
    const e1 = Math.exp(-1 / t1), e2 = Math.exp(-1 / t2);
    const g = [0], h = [0], p = [p0];
    for (let t = 1; t <= loads.length; t++) {
      g.push(g[t - 1] * e1 + loads[t - 1] * e1);
      h.push(h[t - 1] * e2 + loads[t - 1] * e2);
      p.push(p0 + k1 * g[t] - k2 * h[t]);
    }
    return { g, h, p };
  };
  /* Plan de carga: `semanas` de entrenamiento con microciclo semanal y una puesta a punto (taper) final */
  D.plan = function (o) {
    const week = o.week || [1, 0.6, 1, 0, 1, 0.8, 0];
    const out = [];
    for (let w = 0; w < o.semanas; w++) {
      const prog = 1 + (o.prog || 0) * w;
      const descarga = o.descargaCada && (w + 1) % o.descargaCada === 0 ? o.descarga || 0.6 : 1;
      for (const f of week) out.push(o.carga * f * prog * descarga);
    }
    for (let d = 0; d < (o.taperDias || 0); d++) out.push(o.carga * (o.taperFrac === undefined ? 0.4 : o.taperFrac) * (week[d % 7] > 0 ? 1 : 0));
    return out;
  };

  /* ---------- Foster (1998, 2001): carga = RPE (0–10) × minutos ---------- */
  D.srpe = (rpe, min) => rpe * min;
  /* Para una semana de 7 cargas diarias (0 en descanso): carga total, monotonía = media/DE, tensión = total × monotonía */
  D.foster = function (week) {
    const m = L.stat.mean(week), sd = L.stat.sd(week, 0);
    const mono = sd > 0 ? m / sd : Infinity;
    const tot = week.reduce((a, b) => a + b, 0);
    return { total: tot, monotonia: mono, tension: tot * mono };
  };
  /* Cociente agudo:crónico con promedios móviles (7 y 28 días, acoplado: la semana aguda está dentro de las 4 crónicas)
     o desacoplado (crónica = días 8 a 35 anteriores) */
  D.acwr = function (loads, t, coupled = true) {
    const avg = (a, b) => { let s = 0, n = 0; for (let i = a; i <= b; i++) if (i >= 0) { s += loads[i]; n++; } return n ? s / n : NaN; };
    const ac = avg(t - 6, t);
    const ch = coupled ? avg(t - 27, t) : avg(t - 34, t - 7);
    return ac / ch;
  };

  /* Acoplamiento matemático (Lolli y otros, 2019): n atletas con 5 semanas de carga. Cada atleta tiene un nivel
     propio (variación entre atletas sb) y semanas que fluctúan al azar (cv) sin relación con las anteriores.
     Agudo = última semana; crónico acoplado = media de las 4 últimas (incluye la aguda);
     desacoplado = media de las 4 anteriores. Devuelve las correlaciones agudo–crónico rC y rU. */
  D.acwrSim = function (o = {}) {
    const n = o.n || 300, sb = o.sb || 0, cv = o.cv === undefined ? 0.3 : o.cv, rng = L.rng(o.seed || 1);
    const A = [], Cc = [], Cu = [];
    for (let i = 0; i < n; i++) {
      const mu = Math.max(0.2, 1 + sb * rng.gauss());
      const W = []; for (let k = 0; k < 5; k++) W.push(mu * Math.max(0.05, 1 + cv * rng.gauss()));
      A.push(W[4]);
      Cc.push((W[1] + W[2] + W[3] + W[4]) / 4);
      Cu.push((W[0] + W[1] + W[2] + W[3]) / 4);
    }
    return { A, Cc, Cu, rC: L.stat.corr(A, Cc), rU: L.stat.corr(A, Cu) };
  };
  /* Energía disponible (Mountjoy y otros, 2023): (ingesta − gasto del ejercicio) / masa libre de grasa, kcal/kg MLG/día */
  D.energiaDisp = (ingesta, ejercicio, peso, grasaPct) => (ingesta - ejercicio) / (peso * (1 - grasaPct / 100));

  /* ---------- Adaptación motora de dos estados (Smith, Ghazizadeh y Shadmehr, 2006) ----------
     x = x_rápido + x_lento; error e = f − x (f = perturbación); en «pinza de error» e = 0.
     x_r ← A_r x_r + B_r e ; x_l ← A_l x_l + B_l e. Valores típicos: A_r 0,92, B_r 0,1, A_l 0,996, B_l 0,02 */
  D.twoState = function (pert, o = {}) {
    const Af = o.Af || 0.92, Bf = o.Bf || 0.1, As = o.As || 0.996, Bs = o.Bs || 0.02;
    let xf = 0, xs = 0;
    const X = [], Xf = [], Xs = [];
    for (let n = 0; n < pert.length; n++) {
      const x = xf + xs;
      X.push(x); Xf.push(xf); Xs.push(xs);
      const e = pert[n] === null ? 0 : pert[n] - x;   /* null = pinza de error */
      xf = Af * xf + Bf * e;
      xs = As * xs + Bs * e;
    }
    return { X, Xf, Xs };
  };
  /* Protocolo clásico: nA ensayos con perturbación +1, nB con −1, nC en pinza de error */
  D.protocolo = (nA, nB, nC) => Array(nA).fill(1).concat(Array(nB).fill(-1), Array(nC).fill(null));

  /* ---------- Curvas de aprendizaje ----------
     potencial: T(N) = a + b N^(−c) ; exponencial: T(N) = a + b e^{−c N} */
  D.powF = (N, p) => p[0] + p[1] * Math.pow(N, -p[2]);
  D.powJ = (N, p) => { const q = Math.pow(N, -p[2]); return [1, q, -p[1] * q * Math.log(N)]; };
  D.expF = (N, p) => p[0] + p[1] * Math.exp(-p[2] * N);
  D.expJ = (N, p) => { const e = Math.exp(-p[2] * N); return [1, e, -p[1] * N * e]; };
  D.fit = function (Ns, Ts, kind) {
    const f = kind === 'pow' ? D.powF : D.expF, J = kind === 'pow' ? D.powJ : D.expJ;
    const tmin = Math.min(...Ts), tmax = Math.max(...Ts);
    const p0 = kind === 'pow' ? [tmin * 0.8, tmax - tmin * 0.8, 0.5] : [tmin * 0.95, tmax - tmin * 0.95, 0.05];
    const r = L.levmar(Ns, Ts, f, J, p0, { constrain: (q) => { q[2] = Math.max(1e-4, Math.min(5, q[2])); } });
    const m = L.stat.mean(Ts), sst = Ts.reduce((s, v) => s + (v - m) * (v - m), 0);
    return { p: r.p, sse: r.sse, r2: 1 - r.sse / sst };
  };
  /* Promedio de aprendices que mejoran exponencialmente con tasas distintas (log-normales) */
  D.groupCurve = function (o) {
    const rng = L.rng(o.seed || 31), n = o.n || 30, trials = o.trials || 200;
    const indiv = [];
    for (let i = 0; i < n; i++) {
      const c = Math.exp(Math.log(o.cMed || 0.03) + (o.cSd || 0.8) * rng.gauss());
      const a = (o.a || 2) * (1 + 0.15 * rng.gauss()), b = (o.b || 6) * (1 + 0.2 * rng.gauss());
      indiv.push(Array.from({ length: trials }, (_, k) => a + b * Math.exp(-c * (k + 1))));
    }
    const mean = Array.from({ length: trials }, (_, k) => indiv.reduce((s, r) => s + r[k], 0) / n);
    return { indiv, mean };
  };

  /* ---------- Interferencia contextual vista como espaciado ----------
     Tres tareas (A, B, C), 3 × nPorTarea ensayos de práctica separados `dt` minutos.
     Bloqueada: AAA…BBB…CCC; aleatoria: orden mezclado sin repetir dos veces seguidas.
     Desempeño en la práctica = probabilidad de una ejecución fluida justo antes de cada ensayo, con un
     umbral de activación más exigente que el del simple recuerdo (τ + 1,5); retención = P(recuerdo). */
  D.ciSchedule = function (kind, nPer, seed = 5) {
    const seq = [];
    if (kind === 'bloq') { for (const c of [0, 1, 2]) for (let i = 0; i < nPer; i++) seq.push(c); return seq; }
    const rng = L.rng(seed), left = [nPer, nPer, nPer];
    let prev = -1;
    for (let i = 0; i < 3 * nPer; i++) {
      let opts = [0, 1, 2].filter((c) => left[c] > 0 && c !== prev);
      if (!opts.length) opts = [0, 1, 2].filter((c) => left[c] > 0);
      const c = opts[Math.floor(rng() * opts.length)];
      seq.push(c); left[c]--; prev = c;
    }
    return seq;
  };
  D.ciRun = function (kind, o = {}) {
    const nPer = o.nPer || 12, dt = o.dt || 0.5, seq = D.ciSchedule(kind, nPer, o.seed);
    const times = [[], [], []], acq = [], pFluida = Object.assign({}, L.learn.paParams, { tau: L.learn.paParams.tau + 1.5 });
    seq.forEach((c, i) => {
      const t = (i + 1) * dt;
      acq.push(times[c].length ? L.learn.paRecall(times[c], t, pFluida) : 0);
      times[c].push(t);
    });
    const end = seq.length * dt;
    const ret = (delay) => [0, 1, 2].reduce((s, c) => s + L.learn.paRecall(times[c], end + delay), 0) / 3;
    return { seq, acq, ret, end };
  };
})(typeof window !== 'undefined' ? window : globalThis);
