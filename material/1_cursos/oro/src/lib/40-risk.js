/* ===================================================================
   40-risk.js — Riesgo: Monte Carlo de la curva de capital, reglas de una cuenta de fondeo,
   probabilidad de alcanzar una meta antes que un límite, Kelly y caídas máximas.
   (sin DOM; validado contra fórmulas cerradas en tests/validar.js)
   =================================================================== */
(function () {
  'use strict';
  const ML = (window.ML = window.ML || {});
  const L = (ML.L = ML.L || {});
  const R = (L.risk = {});

  /* ---------- Generadores de resultados por operación ---------- */
  /* Operación binaria: gana `win` R con probabilidad p; pierde `loss` R (positivo) en caso contrario */
  R.binary = (p, win, loss, rng) => () => (rng() < p ? { R: win, tp: true } : { R: -loss, tp: false });
  /* Remuestreo de operaciones reales [{R, tp}] */
  R.empirical = (trades, rng) => () => trades[rng.int(trades.length)];
  /* R gaussiano con media y desviación dadas (aproximación) */
  R.gauss = (mu, sd, rng) => () => { const r = mu + sd * rng.normal(); return { R: r, tp: r > 0.8 }; };

  /* ---------- Curva de capital de n operaciones ---------- */
  R.equityPath = function (sampler, n, riskUsd, start = 0) {
    const e = new Float64Array(n + 1);
    e[0] = start;
    for (let i = 0; i < n; i++) e[i + 1] = e[i] + sampler().R * riskUsd;
    return e;
  };
  R.maxDrawdown = function (e) {
    let peak = -Infinity, dd = 0;
    for (let i = 0; i < e.length; i++) { if (e[i] > peak) peak = e[i]; if (peak - e[i] > dd) dd = peak - e[i]; }
    return dd;
  };

  /* ---------- Teoría del movimiento browniano con deriva ---------- */
  /* Probabilidad de tocar +a antes que −b con deriva mu y desviación sigma por paso */
  R.pHitUp = function (a, b, mu, sigma) {
    if (Math.abs(mu) < 1e-12) return b / (a + b);
    const k = (-2 * mu) / (sigma * sigma);
    return (1 - Math.exp(k * -b)) / (Math.exp(k * a) - Math.exp(k * -b));
  };
  /* Tiempo esperado (en pasos) hasta tocar +a o −b */
  R.expTimeHit = function (a, b, mu, sigma) {
    if (Math.abs(mu) < 1e-12) return (a * b) / (sigma * sigma);
    const p = R.pHitUp(a, b, mu, sigma);
    return (p * a - (1 - p) * b) / mu;
  };
  /* Kelly para resultado binario: ganar b veces lo arriesgado con prob. p */
  R.kelly = (p, b) => p - (1 - p) / b;
  /* Fracción de Kelly continua con media mu y varianza s2 por operación (en fracciones de R=1) */
  R.kellyGauss = (mu, sd) => mu / (sd * sd);

  /* ---------- Reto de fondeo (FTMO 2 pasos): simulación Monte Carlo ----------
     o = { sampler, lambda (operaciones por día), balas, onedone, meta, maxloss (USD),
           account, riskPct, target, dailyLim, totalLim, maxDays, minDays, nsim, seed } */
  R.challenge = function (o) {
    const d = Object.assign({ lambda: 0.8, balas: 2, onedone: true, meta: 180, maxloss: 250, account: 100000, riskPct: 0.00125, target: 0.10, dailyLim: 0.05, totalLim: 0.10, maxDays: 365, minDays: 4, nsim: 2000, seed: 1 }, o);
    const rng = L.stats.rng(d.seed);
    const risk = d.account * d.riskPct;
    let pass = 0, fail = 0, tout = 0;
    const days = [], finals = [];
    for (let s = 0; s < d.nsim; s++) {
      let eq = 0, status = 0, day = 0;
      while (day < d.maxDays) {
        day++;
        let dpnl = 0, cnt = 0, locked = false;
        const k = Math.min(d.balas, rng.poisson(d.lambda));
        for (let q = 0; q < k && !locked; q++) {
          const t = d.sampler();
          const pnl = t.R * risk;
          dpnl += pnl; eq += pnl; cnt++;
          if (-dpnl >= d.dailyLim * d.account || -eq >= d.totalLim * d.account) { status = -1; break; }
          if ((t.tp && pnl > 0 && d.onedone) || dpnl >= d.meta || dpnl <= -d.maxloss) locked = true;
        }
        if (status === -1) break;
        if (eq >= d.target * d.account && day >= d.minDays) { status = 1; break; }
      }
      if (status === 1) { pass++; days.push(day); } else if (status === -1) fail++; else tout++;
      finals.push(eq / d.account);
    }
    const q = (a, p) => (a.length ? L.stats.quantile(a, p) : NaN);
    return { pass: pass / d.nsim, fail: fail / d.nsim, timeout: tout / d.nsim, medDays: q(days, 0.5), p25: q(days, 0.25), p75: q(days, 0.75), finals };
  };

  /* ---------- Distribución de la ganancia diaria con reglas de candado ---------- */
  R.dayStats = function (o) {
    const d = Object.assign({ lambda: 0.8, balas: 2, onedone: true, meta: 180, maxloss: 250, risk: 125, ndays: 20000, seed: 2 }, o);
    const rng = L.stats.rng(d.seed);
    const out = new Float64Array(d.ndays);
    for (let s = 0; s < d.ndays; s++) {
      let dpnl = 0, locked = false;
      const k = Math.min(d.balas, rng.poisson(d.lambda));
      for (let q = 0; q < k && !locked; q++) {
        const t = d.sampler();
        const pnl = t.R * d.risk;
        dpnl += pnl;
        if ((t.tp && pnl > 0 && d.onedone) || dpnl >= d.meta || dpnl <= -d.maxloss) locked = true;
      }
      out[s] = dpnl;
    }
    let pos = 0, neg = 0, zero = 0, sum = 0, worst = Infinity;
    for (const v of out) { sum += v; if (v > 0) pos++; else if (v < 0) neg++; else zero++; if (v < worst) worst = v; }
    return { mean: sum / d.ndays, pGreen: pos / d.ndays, pRed: neg / d.ndays, pFlat: zero / d.ndays, worst, sd: L.stats.sd(out), values: out };
  };
})();
