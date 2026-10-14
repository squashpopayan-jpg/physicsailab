/* ===================================================================
   lib/30-aprendizaje.js — Aprendizaje asociativo y por refuerzo,
   memoria y percepción: Rescorla-Wagner, diferencias temporales (TD)
   como modelo de la dopamina, sistema dirigido a metas frente a hábito,
   modelo de activación de Pavlik y Anderson para el espaciado,
   perceptrón e integración óptima de señales (Ernst y Banks).
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const A = (L.learn = {});

  /* ---------- Rescorla-Wagner (1972) ----------
     trials: [{cues: ['A','B'], r: 1}], V: valores iniciales, alpha: saliencia por clave, beta: tasa
     ΔV_i = α_i β (λ − Σ V_presentes). Devuelve la historia de V. */
  A.rw = function (trials, o = {}) {
    const V = Object.assign({}, o.V0 || {}), alpha = o.alpha || {}, beta = o.beta === undefined ? 0.3 : o.beta;
    const hist = [];
    for (const tr of trials) {
      let sum = 0;
      for (const c of tr.cues) sum += V[c] || 0;
      const err = (tr.r === undefined ? 1 : tr.r) - sum;
      for (const c of tr.cues) V[c] = (V[c] || 0) + (alpha[c] === undefined ? 1 : alpha[c]) * beta * err;
      hist.push(Object.assign({ err }, V));
    }
    return hist;
  };
  /* Fórmula cerrada para una sola clave reforzada n veces: V_n = λ (1 − (1 − αβ)^n) */
  A.rwClosed = (n, ab, lam = 1) => lam * (1 - Math.pow(1 - ab, n));
  /* Fases típicas: adquisición, extinción y recuperación espontánea simplificada */
  A.rwPhases = function (o) {
    const tr = [];
    for (let i = 0; i < o.acq; i++) tr.push({ cues: ['A'], r: 1 });
    for (let i = 0; i < o.ext; i++) tr.push({ cues: ['A'], r: 0 });
    return A.rw(tr, { beta: o.beta, alpha: { A: o.alpha || 1 } }).map((h) => h.A);
  };

  /* ---------- Diferencias temporales (Sutton y Barto; Schultz, Dayan y Montague, 1997) ----------
     Un ensayo de T pasos: la clave (CS) aparece en tc y la recompensa en tr.
     Representación de compuesto serial completo: un rasgo por paso transcurrido desde la clave.
     δ_t = r_t + γ V(t+1) − V(t). Devuelve δ por paso para cada ensayo. */
  A.tdRun = function (o) {
    const T = o.T || 25, tc = o.tc || 5, trw = o.tr || 15, nTr = o.trials || 200, a = o.alpha || 0.2, g = o.gamma === undefined ? 0.98 : o.gamma;
    const w = new Float64Array(T + 1);   /* w[k]: valor del rasgo "k pasos desde la clave" */
    const deltas = [], values = [];
    const omit = o.omit || (() => false);
    const rng = L.rng(o.seed || 1);
    for (let n = 0; n < nTr; n++) {
      const rewarded = !omit(n) && (o.prob === undefined || rng() < o.prob);
      const V = (t) => (t >= tc && t <= T ? w[t - tc] : 0);
      const d = new Float64Array(T), vals = new Float64Array(T + 1);
      for (let t = 0; t <= T; t++) vals[t] = V(t);
      for (let t = 0; t < T; t++) {
        const r = t === trw && rewarded ? (o.mag || 1) : 0;
        /* antes de la clave el valor es 0: la clave llega sin aviso, así que el error aparece en tc−1 → tc */
        const delta = r + g * V(t + 1) - V(t);
        d[t] = delta;
        if (t >= tc) w[t - tc] += a * delta;
      }
      deltas.push(d); values.push(vals);
    }
    return { deltas, values, w };
  };
  /* Valor exacto en estado estacionario: V(t) = γ^(tr − t) para tc ≤ t ≤ tr con recompensa 1 */
  A.tdExact = (t, tr, g) => (t <= tr ? Math.pow(g, tr - t) : 0);

  /* ---------- Metas frente a hábitos (inspirado en Miller, Shenhav y Ludvig, 2019) ----------
     Dos acciones: 0 = conducta objetivo (p. ej., palanca / comer el snack), 1 = otra cosa.
     Sistema dirigido a metas: Q aprende el valor de la consecuencia (α_Q).
     Sistema de hábito: H aprende a repetir lo que se hizo (α_H), sin mirar la recompensa.
     Elección: softmax(βg·Q + βh·H). Tras `train` ensayos se devalúa la consecuencia (r = 0).
     Devuelve la probabilidad de elegir la acción 0 en cada ensayo. */
  A.habitModel = function (o) {
    const rng = L.rng(o.seed || 2), aQ = o.aQ || 0.15, aH = o.aH || 0.005, bg = o.bg === undefined ? 10 : o.bg, bh = o.bh === undefined ? 6 : o.bh;
    const train = o.train || 200, test = o.test || 60, r0 = o.r0 === undefined ? 1 : o.r0, rAlt = o.rAlt === undefined ? 0.3 : o.rAlt;
    const Q = [0, rAlt], H = [0.5, 0.5], out = { p: [], Q: [], H: [] };
    for (let n = 0; n < train + test; n++) {
      const dev = n >= train;
      const z0 = bg * Q[0] + bh * H[0], z1 = bg * Q[1] + bh * H[1];
      const p0 = 1 / (1 + Math.exp(z1 - z0));
      const a = rng() < p0 ? 0 : 1;
      const r = a === 0 ? (dev ? 0 : r0) : rAlt;
      /* el modelo dirigido a metas conoce el valor actual de la consecuencia (devaluación instantánea si o.mb) */
      if (o.modelBased && dev) Q[0] = 0;
      Q[a] += aQ * (r - Q[a]);
      for (let k = 0; k < 2; k++) H[k] += aH * ((k === a ? 1 : 0) - H[k]);
      out.p.push(p0); out.Q.push(Q.slice()); out.H.push(H.slice());
    }
    return out;
  };

  /* ---------- Modelo de activación de Pavlik y Anderson (2005) para el efecto de espaciado ----------
     m(t) = ln Σ_j (t − t_j)^(−d_j),  d_j = c·e^{m(t_j)} + α  (d_1 = α): cada repaso decae más rápido
     cuanto más fuerte estaba la memoria en ese momento. P(recordar) = 1 / (1 + e^{(τ − m)/s}).
     Tiempos en minutos. Parámetros ilustrativos: reproducen el patrón cualitativo del espaciado,
     no las cifras de un experimento concreto. */
  A.paParams = { c: 0.217, a: 0.177, tau: -0.704, s: 0.255 };
  A.paActivation = function (times, decays, t) {
    let s = 0;
    for (let j = 0; j < times.length; j++) if (t > times[j]) s += Math.pow(t - times[j], -decays[j]);
    return s > 0 ? Math.log(s) : -Infinity;
  };
  A.paStudy = function (times, p = A.paParams) {
    const decays = [];
    for (let j = 0; j < times.length; j++) {
      const m = j === 0 ? -Infinity : A.paActivation(times.slice(0, j), decays, times[j]);
      decays.push(p.c * Math.exp(m) + p.a);
    }
    return decays;
  };
  A.paRecall = function (times, t, p = A.paParams) {
    const d = A.paStudy(times, p);
    const m = A.paActivation(times, d, t);
    return 1 / (1 + Math.exp((p.tau - m) / p.s));
  };

  /* ---------- Curva de olvido: exponencial y potencial ---------- */
  A.forgetExp = (t, S) => Math.exp(-t / S);
  A.forgetPow = (t, a, b) => a * Math.pow(1 + t, -b);

  /* ---------- Perceptrón (Rosenblatt, 1958) ---------- */
  A.perceptron = function (X, y, o = {}) {
    let w = (o.w0 || [0, 0]).slice(), b = o.b0 || 0;
    const eta = o.eta || 0.1, epochs = o.epochs || 50, hist = [];
    for (let e = 0; e < epochs; e++) {
      let errs = 0;
      for (let i = 0; i < X.length; i++) {
        const out = w[0] * X[i][0] + w[1] * X[i][1] + b > 0 ? 1 : 0;
        const d = y[i] - out;
        if (d !== 0) { errs++; w[0] += eta * d * X[i][0]; w[1] += eta * d * X[i][1]; b += eta * d; }
      }
      hist.push({ w: w.slice(), b, errs });
      if (errs === 0 && !o.full) break;
    }
    return { w, b, hist };
  };

  /* ---------- Integración óptima de señales (Ernst y Banks, 2002) ----------
     Estimación combinada: ŝ = w_V ŝ_V + w_H ŝ_H con w_i ∝ 1/σ_i²; σ_c² = σ_V² σ_H² / (σ_V² + σ_H²) */
  A.cueComb = function (sV, sH) {
    const wV = (1 / (sV * sV)) / (1 / (sV * sV) + 1 / (sH * sH));
    return { wV, wH: 1 - wV, s: Math.sqrt((sV * sV * sH * sH) / (sV * sV + sH * sH)) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
