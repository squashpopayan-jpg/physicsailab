/* ===================================================================
   lib/80-tendencia.js — Separar la señal del ruido en medidas diarias:
   serie de peso simulada (tendencia real + agua + ruido), media móvil
   exponencial, filtro de Kalman de nivel y pendiente, regresión lineal
   con intervalo de confianza y días necesarios para detectar un cambio.
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const T = (L.tend = {});
  T._tq = {};

  /* Serie diaria: peso real que baja `ritmo` kg/semana, fluctuación de agua AR(1) (sdAgua, φ),
     ruido de báscula/ropa/comida (sdDia), ciclo opcional de 28 días de amplitud `ciclo` kg,
     y días sin medición con probabilidad `faltan`. Devuelve {t, real, y} (y = null si falta). */
  T.simPeso = function (o) {
    const rng = L.rng(o.seed || 12), n = o.dias || 120, ph = o.phi === undefined ? 0.7 : o.phi;
    let agua = 0;
    const t = [], real = [], y = [];
    for (let d = 0; d < n; d++) {
      const tr = o.peso0 - ((o.ritmo || 0) * d) / 7;
      agua = ph * agua + (o.sdAgua === undefined ? 0.5 : o.sdAgua) * Math.sqrt(1 - ph * ph) * rng.gauss();
      const ciclo = (o.ciclo || 0) * Math.max(0, Math.sin((2 * Math.PI * (d + 7)) / 28)) ** 2;
      const obs = tr + agua + ciclo + (o.sdDia === undefined ? 0.3 : o.sdDia) * rng.gauss();
      t.push(d); real.push(tr);
      y.push(rng() < (o.faltan || 0) ? null : obs);
    }
    return { t, real, y };
  };
  /* Media móvil exponencial: m_t = m_{t−1} + α (y_t − m_{t−1}); salta los días sin dato */
  T.ema = function (y, alpha = 0.1) {
    const out = [];
    let m = null;
    for (const v of y) {
      if (v !== null && v !== undefined) m = m === null ? v : m + alpha * (v - m);
      out.push(m);
    }
    return out;
  };
  /* Filtro de Kalman de tendencia lineal local. Estado x = [nivel, pendiente/día].
     x_{t+1} = F x_t + w, F = [[1,1],[0,1]], Q = diag(qN, qP); y_t = nivel + v, R = r */
  T.kalman = function (y, o = {}) {
    const qN = o.qN === undefined ? 0.01 : o.qN, qP = o.qP === undefined ? 1e-5 : o.qP, R = o.r === undefined ? 0.36 : o.r;
    const first = y.findIndex((v) => v !== null && v !== undefined);
    let x = [first >= 0 ? y[first] : 0, 0];
    let P = [[1, 0], [0, 0.01]];
    const lvl = [], slope = [], sdSlope = [];
    for (let t = 0; t < y.length; t++) {
      if (t > 0) {
        /* predicción */
        x = [x[0] + x[1], x[1]];
        P = [[P[0][0] + 2 * P[0][1] + P[1][1] + qN, P[0][1] + P[1][1]], [P[0][1] + P[1][1], P[1][1] + qP]];
      }
      const v = y[t];
      if (v !== null && v !== undefined && t >= first) {
        const S = P[0][0] + R, K = [P[0][0] / S, P[1][0] / S], e = v - x[0];
        x = [x[0] + K[0] * e, x[1] + K[1] * e];
        P = [[(1 - K[0]) * P[0][0], (1 - K[0]) * P[0][1]], [P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]]];
      }
      lvl.push(x[0]); slope.push(x[1]); sdSlope.push(Math.sqrt(Math.max(0, P[1][1])));
    }
    return { lvl, slope, sdSlope };
  };
  /* Regresión lineal por mínimos cuadrados de y contra t (omite nulos): pendiente, IC 95 % (t de Student) */
  T.ols = function (t, y) {
    const tt = [], yy = [];
    for (let i = 0; i < y.length; i++) if (y[i] !== null && y[i] !== undefined) { tt.push(t[i]); yy.push(y[i]); }
    const n = tt.length;
    if (n < 3) return null;
    const mt = L.stat.mean(tt), my = L.stat.mean(yy);
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (tt[i] - mt) * (yy[i] - my); sxx += (tt[i] - mt) * (tt[i] - mt); }
    const b = sxy / sxx, a = my - b * mt;
    let rss = 0;
    for (let i = 0; i < n; i++) { const e = yy[i] - a - b * tt[i]; rss += e * e; }
    const se = Math.sqrt(rss / (n - 2) / sxx);
    /* cuantil t(0,975; n−2) por bisección sobre la CDF (se guarda por grados de libertad) */
    const tq = T._tq[n - 2] || (T._tq[n - 2] = L.util.bisect((q) => L.ev.tCDF(q, n - 2) - 0.975, 0, 50));
    return { a, b, se, lo: b - tq * se, hi: b + tq * se, n };
  };
  /* Primer día en que la regresión sobre los datos acumulados da una pendiente negativa con IC 95 % por debajo de 0 */
  T.diasDeteccion = function (t, y, desde = 7) {
    for (let d = desde; d < y.length; d++) {
      const r = T.ols(t.slice(0, d + 1), y.slice(0, d + 1));
      if (r && r.hi < 0) return d;
    }
    return Infinity;
  };
})(typeof window !== 'undefined' ? window : globalThis);
