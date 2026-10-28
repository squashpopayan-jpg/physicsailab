/* ===================================================================
   39-fq-cat.js — Catálisis: cinética enzimática (Michaelis–Menten, inhibición, cooperatividad) y catálisis heterogénea (volcán de Sabatier).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const R = FQ.R, kB = FQ.kB, h = FQ.hPlanck;
  const C = (FQ.cat = {});

  /* W(e^L) de Lambert (rama principal) por Newton en w + ln w = L; sirve incluso cuando e^L desborda */
  C.lambertWexp = function (L) {
    let w = L > 1 ? L - Math.log(L) : Math.exp(L) / (1 + Math.exp(L)); /* arranque */
    if (L < -30) return Math.exp(L);
    for (let i = 0; i < 60; i++) { const f = w + Math.log(w) - L, d = 1 + 1 / w, dw = f / d; w -= dw; if (w <= 0) w = 1e-300; if (Math.abs(dw) < 1e-15 * Math.max(1, w)) break; }
    return w;
  };
  C.lambertW = (x) => (x <= 0 ? 0 : C.lambertWexp(Math.log(x)));

  /* Michaelis–Menten */
  C.mm = (S, Vmax, Km) => (Vmax * S) / (Km + S);
  C.mmKm = (k1, km1, kcat) => (km1 + kcat) / k1;
  /* Curva de progreso integrada (Schnell y Mendoza, 1997): S(t) = Km W[(S0/Km) exp((S0 − Vmax t)/Km)] */
  C.mmS = (t, S0, Km, Vmax) => Km * C.lambertWexp(Math.log(S0 / Km) + (S0 - Vmax * t) / Km);
  /* Mecanismo completo E + S ⇌ ES → E + P: derivadas de y = [S, E, ES, P] */
  C.mmRHS = (k1, km1, kcat) => (t, y) => { const v1 = k1 * y[0] * y[1] - km1 * y[2], v2 = kcat * y[2]; return [-v1, -v1 + v2, v1 - v2, v2]; };
  /* Parámetro de validez de la aproximación de cuasi-estado estacionario (Segel y Slemrod, 1989) */
  C.mmEps = (E0, S0, Km) => E0 / (Km + S0);

  /* Inhibición: v = Vmax S / (Km(1 + I/Ki) + S(1 + I/Ki')); Ki → ∞ no hay unión a E, Ki' → ∞ no hay unión a ES */
  C.inhib = (S, I, Vmax, Km, Ki, Kip) => (Vmax * S) / (Km * (1 + I / Ki) + S * (1 + I / Kip));
  C.inhibApp = (I, Vmax, Km, Ki, Kip) => ({ Vmax: Vmax / (1 + I / Kip), Km: (Km * (1 + I / Ki)) / (1 + I / Kip) });
  /* CI50 a concentración S del sustrato (Cheng y Prusoff, 1973, generalizada): v(I)/v(0) = 1/2 */
  C.ic50 = (S, Km, Ki, Kip) => { /* 1 + I/Ki' + (Km/S)(I/Ki)... resolviendo v(I) = v(0)/2: Km(1+I/Ki)+S(1+I/Kip) = 2(Km+S) */
    const a = Km / Ki + S / Kip; return (Km + S) / a;
  };

  /* Cooperatividad: ecuación de Hill y modelo MWC de dos estados (Monod, Wyman y Changeux, 1965) */
  C.hill = (x, K50, n) => Math.pow(x, n) / (Math.pow(K50, n) + Math.pow(x, n));
  C.mwc = (x, n, KR, c, L) => { const a = x / KR; return (a * Math.pow(1 + a, n - 1) + L * c * a * Math.pow(1 + c * a, n - 1)) / (Math.pow(1 + a, n) + L * Math.pow(1 + c * a, n)); };
  /* x(Y) por bisección y pendiente de Hill n_H = d ln[Y/(1−Y)]/d ln x en el punto medio */
  C.half = function (Y, lo, hi) { let a = Math.log(lo), b = Math.log(hi); for (let i = 0; i < 100; i++) { const m = 0.5 * (a + b); if (Y(Math.exp(m)) < 0.5) a = m; else b = m; } return Math.exp(0.5 * (a + b)); };
  C.hillSlope = (Y, x) => { const e = 1e-4, f = (z) => { const y = Y(z); return Math.log(y / (1 - y)); }; return (f(x * (1 + e)) - f(x / (1 + e))) / (Math.log(1 + e) - Math.log(1 / (1 + e))); };

  /* Volcán de Sabatier para un ciclo A(g) + * ⇌ A* → P(g) + * (reacción global exotérmica, −Etot, en kJ/mol).
     Energía de unión E (kJ/mol, >0). Entropía de adsorción: se pierde la del gas, Sg (J/mol·K), en el paso 1 y se recupera en el 2.
     Barreras de energía libre por la relación de Brønsted–Evans–Polanyi: ΔG‡ = max(ΔG, 0, G0 + α ΔG). */
  C.volcano = function (E, o) {
    const T = o.T, RT = (R * T) / 1e3, Sg = (o.Sg == null ? 130 : o.Sg) / 1e3, G0 = o.G0, a = o.alpha, p = o.p;
    const dG1 = -E + T * Sg, dG2 = E - o.Etot - T * Sg, bar = (dG) => Math.max(dG, 0, G0 + a * dG);
    const nu = (kB * T) / h, k1 = nu * Math.exp(-bar(dG1) / RT) * p, km1 = nu * Math.exp(-(bar(dG1) - dG1) / RT), k2 = nu * Math.exp(-bar(dG2) / RT);
    const th = k1 / (k1 + km1 + k2); /* cobertura de A*, con p_P = 0 */
    return { tof: k2 * th, theta: th, dG1, dG2, b1: bar(dG1), b2: bar(dG2), k1, km1, k2 };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
