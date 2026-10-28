/* ===================================================================
   39-fq-bio.js — Bioenergética y membranas: ΔG del ATP y acoplamiento, potenciales redox biológicos (E°′), fuerza protón-motriz,
   potenciales de Nernst y de Goldman–Hodgkin–Katz, trabajo de transporte y el modelo de Hodgkin–Huxley del axón gigante de calamar.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const B = (FQ.bio = {});
  const R = 8.314462618, Fa = 96485.33212;
  B.R = R; B.F = Fa;
  /* ΔG real (J/mol) de ATP + H₂O → ADP + Pi con concentraciones molares: ΔG = ΔG°′ + RT ln([ADP][Pi]/[ATP]) (estado estándar bioquímico 1 M, pH 7) */
  B.dG = (dG0, Q, T) => dG0 + R * (T || 298.15) * Math.log(Q);
  B.K = (dG0, T) => Math.exp(-dG0 / (R * (T || 298.15)));
  /* ΔG°′ (kJ/mol) de hidrólisis o transferencia, Lehninger/Voet, pH 7 y 25 °C */
  B.LADDER = [
    { id: 'pep', nm: 'Fosfoenolpiruvato → piruvato + Pi', g: -61.9 }, { id: 'bpg', nm: '1,3-bisfosfoglicerato → 3-PG + Pi', g: -49.4 }, { id: 'cp', nm: 'Fosfocreatina → creatina + Pi', g: -43.0 },
    { id: 'atp-amp', nm: 'ATP → AMP + PPi', g: -45.6 }, { id: 'atp', nm: 'ATP → ADP + Pi', g: -30.5 }, { id: 'acoa', nm: 'Acetil-CoA → acetato + CoA', g: -31.4 }, { id: 'ppi', nm: 'PPi → 2 Pi', g: -19.2 },
    { id: 'g1p', nm: 'Glucosa-1-P → glucosa + Pi', g: -20.9 }, { id: 'f6p', nm: 'Fructosa-6-P → fructosa + Pi', g: -15.9 }, { id: 'g6p', nm: 'Glucosa-6-P → glucosa + Pi', g: -13.8 }, { id: 'glp', nm: 'Glicerol-3-P → glicerol + Pi', g: -9.2 }
  ];
  /* Potencial de reducción a un pH dado: la semirreacción Ox + m H⁺ + n e⁻ → Red cambia E en −(m/n)(RT ln10/F)·pH; E°′ es el valor a pH 7 */
  B.Epr = (E0, n, m, pH, T) => E0 - ((m / n) * ((R * (T || 298.15) * Math.LN10) / Fa)) * pH;
  B.dGredox = (n, dE) => -n * Fa * dE; /* J/mol */
  /* Cadena respiratoria: E°′ (V) de los pares, pH 7 (Nicholls y Ferguson; Lehninger) */
  B.ETC = [
    { nm: 'NAD⁺/NADH', E: -0.320, n: 2 }, { nm: 'FMN/FMNH₂', E: -0.219, n: 2 }, { nm: 'Fumarato/succinato', E: 0.031, n: 2 }, { nm: 'Ubiquinona/ubiquinol', E: 0.045, n: 2 }, { nm: 'Citocromo b', E: 0.077, n: 1 },
    { nm: 'Citocromo c₁', E: 0.220, n: 1 }, { nm: 'Citocromo c', E: 0.254, n: 1 }, { nm: 'Citocromo a', E: 0.290, n: 1 }, { nm: 'Citocromo a₃', E: 0.385, n: 1 }, { nm: '½ O₂/H₂O', E: 0.815, n: 2 }
  ];
  /* Fuerza protón-motriz (V): Δp = (ψ_P − ψ_N) + (2.303RT/F)(pH_N − pH_P); P = lado positivo (espacio intermembrana) y N = lado negativo (matriz) */
  B.pmf = (dpsi, dpH, T) => dpsi + ((R * (T || 298.15) * Math.LN10) / Fa) * dpH;
  /* Número mínimo de protones por ATP: n ≥ ΔG_ATP/(FΔp) con ΔG_ATP en J/mol (positivo, la síntesis) */
  B.nmin = (dGsint, dp) => dGsint / (Fa * dp);
  /* P/O: ATP por par de electrones del NADH: protones bombeados (4 + 4 + 2 = 10) / (protones por ATP = c/3 + 1 del transportador de fosfato) */
  B.PO = (cring, pumped) => (pumped || 10) / (cring / 3 + 1);
  /* Nernst (V) para un ion de carga z: E = (RT/zF) ln(c_ext/c_int) */
  B.nernst = (z, co, ci, T) => ((R * (T || 298.15)) / (z * Fa)) * Math.log(co / ci);
  /* Goldman–Hodgkin–Katz para iones monovalentes: ions = [{P, z, co, ci}], z = ±1; devuelve el potencial de reposo (V) interior − exterior */
  B.ghk = (ions, T) => { let num = 0, den = 0; for (const q of ions) { if (q.z > 0) { num += q.P * q.co; den += q.P * q.ci; } else { num += q.P * q.ci; den += q.P * q.co; } } return ((R * (T || 298.15)) / Fa) * Math.log(num / den); };
  /* corriente GHK de un ion de carga z (A/m² por unidad de P en m/s: I = P z²F²V/RT · (ci − co e^{−zFV/RT})/(1 − e^{−zFV/RT})); V en voltios */
  B.ghkI = (V, z, P, ci, co, T) => { const u = (z * Fa * V) / (R * (T || 298.15)); return Math.abs(u) < 1e-9 ? P * z * Fa * (ci - co) : P * z * Fa * u * (ci - co * Math.exp(-u)) / (1 - Math.exp(-u)); };
  /* Energía libre (J/mol) para mover un soluto de carga z del lado 1 al 2: ΔG = RT ln(c₂/c₁) + zF(ψ₂ − ψ₁) */
  B.dGmove = (z, c1, c2, psi21, T) => R * (T || 298.15) * Math.log(c2 / c1) + z * Fa * psi21;
  /* Acumulación máxima de un soluto neutro por un simporte con n iones Na⁺: [S]_in/[S]_out = exp(n·(−ΔG_Na)/RT), con ΔG_Na de entrada */
  B.maxAccum = (n, dGNa_in, T) => Math.exp((-n * dGNa_in) / (R * (T || 298.15)));
  /* Hodgkin–Huxley (1952), convención moderna de potencial de reposo −65 mV; unidades mV, ms, mS/cm², µA/cm², µF/cm² */
  const vtrap = (x, y) => (Math.abs(x / y) < 1e-6 ? y * (1 - x / y / 2) : x / (1 - Math.exp(-x / y)));
  const H = (B.HH = { gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387, C: 1 });
  H.an = (V) => 0.01 * vtrap(V + 55, 10); H.bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);
  H.am = (V) => 0.1 * vtrap(V + 40, 10); H.bm = (V) => 4 * Math.exp(-(V + 65) / 18);
  H.ah = (V) => 0.07 * Math.exp(-(V + 65) / 20); H.bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
  H.rest = (V) => [V, H.am(V) / (H.am(V) + H.bm(V)), H.ah(V) / (H.ah(V) + H.bh(V)), H.an(V) / (H.an(V) + H.bn(V))]; /* [V, m, h, n] */
  /* derivadas; Iext puede ser un número o una función del tiempo; Tc en °C con Q₁₀ = 3 */
  H.f = (Iext, Tc, o = {}) => { const phi = Math.pow(3, ((Tc === undefined ? 6.3 : Tc) - 6.3) / 10), gNa = o.gNa === undefined ? H.gNa : o.gNa, gK = o.gK === undefined ? H.gK : o.gK;
    return (t, y) => { const V = y[0], m = y[1], h = y[2], n = y[3], I = typeof Iext === 'function' ? Iext(t) : Iext;
      const iNa = gNa * m * m * m * h * (V - H.ENa), iK = gK * n * n * n * n * (V - H.EK), iL = H.gL * (V - H.EL);
      return [(I - iNa - iK - iL) / H.C, phi * (H.am(V) * (1 - m) - H.bm(V) * m), phi * (H.ah(V) * (1 - h) - H.bh(V) * h), phi * (H.an(V) * (1 - n) - H.bn(V) * n)]; }; };
  /* integra de 0 a tmax (ms) con paso de salida dt y devuelve {t, V, m, h, n} */
  H.run = function (Iext, tmax, dt, Tc, o = {}) {
    const ts = []; for (let t = 0; t <= tmax + 1e-12; t += dt) ts.push(t);
    const sol = FQ.ode(H.f(Iext, Tc, o), o.y0 || H.rest(-65), ts, { rtol: 1e-8, atol: 1e-10, h0: 0.01 }), y = sol.y || sol;
    return { t: ts, V: y.map((r) => r[0]), m: y.map((r) => r[1]), h: y.map((r) => r[2]), n: y.map((r) => r[3]) };
  };
  /* instantes y alturas de los picos: máximo local sobre el umbral y con una prominencia mínima de 20 mV respecto del último valle */
  H.spikes = (r, thr) => { const out = []; let vmin = Infinity; for (let i = 1; i < r.V.length - 1; i++) { vmin = Math.min(vmin, r.V[i]); if (r.V[i] > (thr === undefined ? 0 : thr) && r.V[i] >= r.V[i - 1] && r.V[i] > r.V[i + 1] && r.V[i] - vmin >= 20) { out.push([r.t[i], r.V[i]]); vmin = Infinity; } } return out; };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
