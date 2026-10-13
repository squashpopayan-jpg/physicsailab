/* ===================================================================
   lib/10-tvm.js — Valor del dinero en el tiempo y tasas de interés.
   Las funciones VF, VA, PAGO, NPER y TASA siguen la convención de signos
   de Excel, Google Sheets y numpy-financial: el dinero que sale del
   bolsillo es negativo y el que entra es positivo; tipo = 0 si los pagos
   son al final de cada periodo (vencidos) y 1 si son al inicio (anticipados).
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const T = (L.tvm = {});

  T.fv = function (rate, nper, pmt, pv = 0, type = 0) {
    if (rate === 0) return -(pv + pmt * nper);
    const g = Math.pow(1 + rate, nper);
    return -(pv * g + (pmt * (1 + rate * type) * (g - 1)) / rate);
  };
  T.pv = function (rate, nper, pmt, fv = 0, type = 0) {
    if (rate === 0) return -(fv + pmt * nper);
    const g = Math.pow(1 + rate, nper);
    return -(fv + (pmt * (1 + rate * type) * (g - 1)) / rate) / g;
  };
  T.pmt = function (rate, nper, pv, fv = 0, type = 0) {
    if (rate === 0) return -(pv + fv) / nper;
    const g = Math.pow(1 + rate, nper);
    return (-(fv + pv * g) * rate) / ((1 + rate * type) * (g - 1));
  };
  T.nper = function (rate, pmt, pv, fv = 0, type = 0) {
    if (rate === 0) return -(pv + fv) / pmt;
    const z = (pmt * (1 + rate * type)) / rate;
    return Math.log((z - fv) / (pv + z)) / Math.log(1 + rate);
  };
  /* TASA: resuelve pv·g + pmt(1+r·tipo)(g−1)/r + fv = 0 (Newton con respaldo de bisección) */
  T.rate = function (nper, pmt, pv, fv = 0, type = 0, guess = 0.01) {
    const f = (r) => {
      if (Math.abs(r) < 1e-12) return pv + pmt * nper + fv;
      const g = Math.pow(1 + r, nper);
      return pv * g + (pmt * (1 + r * type) * (g - 1)) / r + fv;
    };
    let r = guess;
    for (let i = 0; i < 100; i++) {
      const h = 1e-7 * Math.max(1, Math.abs(r));
      const y = f(r), d = (f(r + h) - f(r - h)) / (2 * h);
      if (!isFinite(y) || !isFinite(d) || d === 0) break;
      const nr = r - y / d;
      if (!isFinite(nr) || nr <= -0.999999) break;
      if (Math.abs(nr - r) < 1e-14 * Math.max(1, Math.abs(r))) return nr;
      r = nr;
    }
    /* Respaldo: busca un cambio de signo y biseca */
    const grid = [-0.99, -0.5, -0.2, -0.05, 0, 0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
    for (let k = 0; k < grid.length - 1; k++) {
      const a = grid[k] === 0 ? 1e-9 : grid[k], b = grid[k + 1] === 0 ? -1e-9 : grid[k + 1];
      if (f(a) * f(b) <= 0) return L.util.bisect(f, a, b);
    }
    return NaN;
  };
  /* VNA de Excel: el primer flujo se descuenta un periodo */
  T.npvExcel = (rate, values) => values.reduce((s, v, k) => s + v / Math.pow(1 + rate, k + 1), 0);
  /* VPN con el primer flujo en t = 0 (convención de los textos de finanzas) */
  T.npv = (rate, values) => values.reduce((s, v, k) => s + v / Math.pow(1 + rate, k), 0);
  /* TIR: raíz de VPN(r) = 0 buscando el primer cambio de signo desde r ≈ −99 % */
  T.irr = function (values) {
    const f = (r) => T.npv(r, values);
    let a = -0.99, fa = f(a);
    const steps = [];
    for (let r = -0.98; r <= 0.5; r += 0.01) steps.push(r);
    for (let r = 0.55; r <= 10; r += 0.05) steps.push(r);
    for (const b of steps) {
      const fb = f(b);
      if (fa * fb <= 0) return L.util.bisect(f, a, b, 1e-15);
      a = b; fa = fb;
    }
    return NaN;
  };

  /* ---------- Conversión de tasas ---------- */
  /* EA → tasa periódica equivalente con m periodos por año */
  T.eaToPeriodic = (i, m) => Math.pow(1 + i, 1 / m) - 1;
  T.periodicToEa = (ip, m) => Math.pow(1 + ip, m) - 1;
  /* Nominal capitalizable m veces (por ejemplo «24 % nominal mes vencido», m = 12) → EA */
  T.nominalToEa = (j, m) => Math.pow(1 + j / m, m) - 1;
  T.eaToNominal = (i, m) => m * (Math.pow(1 + i, 1 / m) - 1);
  /* Tasa periódica anticipada ↔ vencida */
  T.antToVenc = (ia) => ia / (1 - ia);
  T.vencToAnt = (iv) => iv / (1 + iv);
  /* Nominal anticipada (m periodos) → EA */
  T.nominalAntToEa = (j, m) => Math.pow(1 - j / m, -m) - 1;
  T.continuousToEa = (r) => Math.expm1(r);
  T.eaToContinuous = (i) => Math.log1p(i);
  /* Ecuación de Fisher: tasa real exacta y aproximada */
  T.real = (i, pi) => (1 + i) / (1 + pi) - 1;
  T.realApprox = (i, pi) => i - pi;
  /* Tiempo de duplicación exacto y por la regla del 72 (r como fracción por periodo) */
  T.doubling = (r) => Math.log(2) / Math.log1p(r);
  T.rule72 = (r) => 0.72 / r;
  T.rule70 = (r) => 0.7 / r;

  /* ---------- Trayectorias de ahorro ----------
     o = {p0, aporte, im (tasa mensual), meses, crecAporte (crecimiento anual del aporte), tipo}
     Devuelve arreglos mes a mes: saldo, aportado acumulado (incluye p0) e intereses acumulados. */
  T.savingsPath = function (o) {
    const n = Math.round(o.meses), im = o.im || 0, tipo = o.tipo || 0;
    let saldo = o.p0 || 0, aportado = o.p0 || 0, ap = o.aporte || 0;
    const S = [saldo], A = [aportado];
    for (let k = 1; k <= n; k++) {
      if (tipo) { saldo += ap; aportado += ap; }
      saldo *= 1 + im;
      if (!tipo) { saldo += ap; aportado += ap; }
      S.push(saldo); A.push(aportado);
      if (k % 12 === 0 && o.crecAporte) ap *= 1 + o.crecAporte;
    }
    return { saldo: S, aportado: A, interes: S.map((s, k) => s - A[k]) };
  };
  /* Interés simple sobre el capital inicial */
  T.simple = (p0, r, n) => p0 * (1 + r * n);
  T.compound = (p0, r, n) => p0 * Math.pow(1 + r, n);
})(typeof window !== 'undefined' ? window : globalThis);
