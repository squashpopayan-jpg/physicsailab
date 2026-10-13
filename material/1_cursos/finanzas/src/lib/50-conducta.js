/* ===================================================================
   lib/50-conducta.js — Economía del comportamiento: teoría prospectiva,
   descuento temporal, adaptación hedónica, comparación social y sesgo
   de supervivencia.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const B = (L.beh = {});

  /* Función de valor de Tversky y Kahneman (1992): x^α si x ≥ 0, −λ(−x)^β si x < 0 */
  B.value = (x, a = 0.88, b = 0.88, lam = 2.25) => (x >= 0 ? Math.pow(x, a) : -lam * Math.pow(-x, b));
  /* Ponderación de probabilidades w(p) = p^γ / (p^γ + (1−p)^γ)^(1/γ) */
  B.weight = (p, g = 0.61) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(p, g) / Math.pow(Math.pow(p, g) + Math.pow(1 - p, g), 1 / g));
  /* Valor de una apuesta mixta: ganar G con probabilidad p o perder Pd con probabilidad 1−p
     (γ = 0.61 para ganancias, δ = 0.69 para pérdidas, como en Tversky y Kahneman, 1992) */
  B.gamble = (G, Pd, p, o = {}) => {
    const a = o.a ?? 0.88, b = o.b ?? 0.88, lam = o.lam ?? 2.25, g = o.g ?? 0.61, d = o.d ?? 0.69;
    return B.weight(p, g) * B.value(G, a, b, lam) + B.weight(1 - p, d) * B.value(-Pd, a, b, lam);
  };
  /* Ganancia mínima que hace aceptable lanzar una moneda en la que se puede perder Pd */
  B.minGain = (Pd, o = {}) => L.util.bisect((G) => B.gamble(G, Pd, 0.5, o), 0, Pd * 50);

  /* Descuento temporal: factor de un pago a t periodos */
  B.discExp = (t, delta) => Math.pow(delta, t);
  B.discHyp = (t, k) => 1 / (1 + k * t);
  B.discQH = (t, beta, delta) => (t === 0 ? 1 : beta * Math.pow(delta, t));
  /* Elección entre A (a pesos en s días) y B (b pesos en s+d días) con un descuento dado:
     devuelve 'A' o 'B' según cuál vale más hoy */
  B.choose = (a, b, s, d, disc) => (a * disc(s) >= b * disc(s + d) ? 'A' : 'B');

  /* Adaptación hedónica: el punto de referencia r persigue al consumo c con velocidad a por periodo.
     Bienestar = ln(c) − κ·ln(r) (κ = peso de la comparación con lo habitual). */
  B.adapt = function (consumo, a = 0.25, kappa = 0.8) {
    let r = consumo[0];
    return consumo.map((c) => { const u = Math.log(c) - kappa * Math.log(r); r += a * (c - r); return u; });
  };
  /* Comparación social: utilidad = ln(y) − θ·ln(ȳ) */
  B.relUtil = (y, ybar, theta) => Math.log(y) - theta * Math.log(ybar);

  /* Sesgo de supervivencia: N «expertos» aciertan cada predicción con probabilidad p.
     Devuelve cuántos conservan un historial perfecto tras cada ronda (simulación con semilla). */
  B.gurus = function (N, rondas, p = 0.5, seed = 1) {
    const rng = L.rng(seed);
    let vivos = N;
    const serie = [N];
    for (let k = 0; k < rondas; k++) {
      let s = 0;
      for (let i = 0; i < vivos; i++) if (rng() < p) s++;
      vivos = s; serie.push(vivos);
    }
    return serie;
  };

  /* Automatización del ahorro: quien ahorra «a mano» omite cada mes con probabilidad q;
     el ahorro automático se ejecuta siempre. Devuelve saldos finales de N personas. */
  B.manualVsAuto = function (o) {
    const rng = L.rng(o.seed || 9), M = Math.round(o.anos * 12), im = L.tvm.eaToPeriodic(o.r, 12), fin = [];
    for (let i = 0; i < o.N; i++) {
      let w = 0, racha = 0;
      for (let m = 0; m < M; m++) {
        /* tras omitir, la probabilidad de volver a omitir sube (inercia) */
        const q = Math.min(0.98, o.q + (racha > 0 ? o.inercia : 0));
        const ahorra = rng() >= q;
        racha = ahorra ? 0 : racha + 1;
        w = w * (1 + im) + (ahorra ? o.aporte : 0);
      }
      fin.push(w);
    }
    return fin;
  };
  /* Ahorra Más Mañana (Thaler y Benartzi): la tasa de ahorro sube «inc» puntos con cada aumento salarial
     hasta un tope. Devuelve por año: salario, tasa, ahorro y salario neto disponible. */
  B.smart = function (o) {
    const rows = [];
    let sal = o.salario, tasa = o.tasa0;
    for (let y = 0; y <= o.anos; y++) {
      rows.push({ y, salario: sal, tasa, ahorro: sal * tasa, disponible: sal * (1 - tasa) });
      sal *= 1 + o.aumento;
      tasa = Math.min(o.tope, tasa + o.inc);
    }
    return rows;
  };
  /* Curva de automaticidad de un hábito (Lally y otros, 2010): A(t) = A∞(1 − e^(−t/τ)) */
  B.habit = (t, tau, Amax = 1) => Amax * (1 - Math.exp(-t / tau));
})(typeof window !== 'undefined' ? window : globalThis);
