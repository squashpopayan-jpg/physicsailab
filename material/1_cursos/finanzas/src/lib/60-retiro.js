/* ===================================================================
   lib/60-retiro.js — Retiro e independencia financiera: tasa de ahorro,
   regla del 4 % con datos históricos, riesgo de secuencia y simulación
   de acumulación y retiros.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const R = (L.ret = {});

  /* Años hasta la independencia financiera con tasa de ahorro s, rentabilidad real r y tasa de retiro w.
     Supone que el gasto (1−s)·ingreso se mantiene y que se empieza desde cero:
     s·((1+r)^n − 1)/r = (1−s)/w  →  n = ln(1 + r(1−s)/(s w)) / ln(1+r). */
  R.fiYears = function (s, r, w, p0 = 0) {
    if (s <= 0) return Infinity;
    if (s >= 1) return 0;
    const meta = (1 - s) / w; /* en múltiplos del ingreso anual */
    if (p0 >= meta) return 0;
    if (Math.abs(r) < 1e-12) return (meta - p0) / s;
    /* p0(1+r)^n + s((1+r)^n − 1)/r = meta */
    const g = (meta + s / r) / (p0 + s / r);
    return Math.log(g) / Math.log1p(r);
  };
  /* Capital necesario hoy para «llegar por inercia» (Coast FI) a la meta en n años sin aportar más */
  R.coast = (meta, r, n) => meta / Math.pow(1 + r, n);

  /* Retiros con datos históricos de EE. UU. (estilo «estudio Trinity»).
     Portafolio con fracción ws en acciones (S&P 500) y el resto en bonos del Tesoro a 10 años, rebalanceado
     cada año. Retiro inicial = w·W₀, ajustado por inflación; se retira al inicio de cada año.
     Devuelve, para cada año de inicio con N años completos de datos, si el dinero alcanzó y la riqueza final real. */
  R.historico = function (w, ws, N, y0 = 1928, y1 = 2025, bono = 'tbond') {
    const D = L.DATA.us, out = [];
    const ia = D.years.indexOf(y0), ib = D.years.indexOf(y1);
    for (let s = ia; s + N - 1 <= ib; s++) {
      let W = 1, ret = w, real = 1, ok = true, minW = 1, anos = N;
      for (let k = 0; k < N; k++) {
        const t = s + k;
        W -= ret;
        if (W <= 0) { ok = false; anos = k; W = 0; break; }
        W *= 1 + ws * D.sp500[t] + (1 - ws) * D[bono][t];
        real *= 1 + D.inflation[t];
        ret *= 1 + D.inflation[t];
        minW = Math.min(minW, W / real);
      }
      out.push({ inicio: D.years[s], ok, finalReal: W / real, minReal: minW, anos });
    }
    return out;
  };
  /* Trayectoria de un retiro con una secuencia de rentabilidades dada (riesgo de secuencia) */
  R.withdrawPath = function (W0, retiro, rs, infl = 0) {
    let W = W0, ret = retiro;
    const path = [W];
    for (const r of rs) { W = Math.max(0, W - ret) * (1 + r); ret *= 1 + infl; path.push(W); }
    return path;
  };
  /* Monte Carlo de ciclo de vida en términos reales.
     o = {edad, retiroEdad, finEdad, ahorroAnual, p0, gastoRetiro, pension (ingreso anual en el retiro),
          muAcc, sdAcc, muRet, sdRet, N, seed}. Devuelve probabilidad de no agotar el dinero y percentiles. */
  R.lifecycle = function (o) {
    const rng = L.rng(o.seed || 21), Y = o.finEdad - o.edad, paths = [];
    let ok = 0;
    const pa = L.inv.lognormParams(o.muAcc, o.sdAcc), pr = L.inv.lognormParams(o.muRet, o.sdRet);
    for (let i = 0; i < o.N; i++) {
      let W = o.p0;
      const row = [W];
      let quebro = false;
      for (let y = 0; y < Y; y++) {
        const edad = o.edad + y;
        if (edad < o.retiroEdad) W = W * Math.exp(pa.m + pa.s * rng.gauss()) + o.ahorroAnual;
        else {
          W -= Math.max(0, o.gastoRetiro - (o.pension || 0));
          if (W < 0) { W = 0; quebro = true; }
          W *= Math.exp(pr.m + pr.s * rng.gauss());
        }
        row.push(W);
      }
      if (!quebro) ok++;
      paths.push(row);
    }
    return { pExito: ok / o.N, paths };
  };
})(typeof window !== 'undefined' ? window : globalThis);
