/* ===================================================================
   lib/90-checks.js — Catálogo de validaciones del núcleo de cálculo.
   Cada prueba compara un cálculo en JavaScript con una implementación
   independiente en Python (NumPy/SciPy, valores en 85-ref.js generados
   por tests/referencias.py), con resultados publicados o con una
   identidad matemática exacta.
   Formato: {cap, id, what, ref, src, tol, rel, fn() → valor}.
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const C = [];
  const add = (cap, id, what, ref, src, tol, fn, o = {}) => C.push(Object.assign({ cap, id, what, ref, src, tol, fn }, o));
  L.CHECKS = C;
  const R = () => L.REF.ref, Dt = () => L.REF.data;
  const SP = () => 'SciPy ' + L.REF.versions.scipy;
  const NP = () => 'NumPy ' + L.REF.versions.numpy;

  /* ---------- 1 · Evidencia ---------- */
  add(1, 'trunc', 'Media de una normal truncada E[X | X > 7], μ = 5, σ = 1,8', () => R().truncmean, SP() + ' truncnorm', 1e-6, () => L.ev.truncMean(5, 1.8, 7));
  add(1, 'tcdf1', 'Distribución t: F(2,0; 10 gl)', () => R().tcdf_2_10, SP() + ' t.cdf', 1e-10, () => L.ev.tCDF(2, 10));
  add(1, 'tcdf2', 'Distribución t con grados de libertad fraccionarios: F(−1,3; 4,5 gl)', () => R().tcdf_m13_45, SP() + ' t.cdf', 1e-10, () => L.ev.tCDF(-1.3, 4.5));
  add(1, 'welch', 'Prueba t de Welch: valor p', () => R().welch_p, SP() + ' ttest_ind(equal_var=False)', 1e-9, () => L.ev.welch(Dt().welch_a, Dt().welch_b).p);
  add(1, 'power', 'Potencia para d = 0,5 con 64 por grupo (aproximación normal frente a t no central exacta)', () => R().power_exact, SP() + ' nct', 0.01, () => L.ev.power(0.5, 64));
  add(1, 'dlmu', 'Metaanálisis DerSimonian-Laird de los 13 ensayos de la vacuna BCG: log RR combinado', () => R().dl_mu, 'NumPy; metafor publica −0,7141', 1e-9, () => L.ev.metaDL(Dt().bcg_y, Dt().bcg_v).mu);
  add(1, 'dltau', 'BCG: heterogeneidad τ²', () => R().dl_tau2, 'NumPy; metafor publica 0,3088', 1e-9, () => L.ev.metaDL(Dt().bcg_y, Dt().bcg_v).tau2);
  add(1, 'dlQ', 'BCG: estadístico Q de Cochran', () => R().dl_Q, 'NumPy; metafor publica 152,2330', 1e-7, () => L.ev.metaDL(Dt().bcg_y, Dt().bcg_v).Q);
  add(1, 'egger', 'Prueba de Egger (BCG): intercepto', () => R().egger_int, SP() + ' linregress', 1e-9, () => L.ev.egger(Dt().bcg_y, Dt().bcg_v).intercept);
  add(1, 'nnt', 'NNT para d = 0,5 (Kraemer y Kupfer)', () => R().nnt05, SP() + ' norm.cdf', 1e-6, () => L.ev.nnt(0.5));
  add(1, 'dprime', 'Sensibilidad d′ con aciertos 0,8 y falsas alarmas 0,3', () => R().dprime, SP() + ' norm.ppf', 1e-7, () => L.ev.dprime(0.8, 0.3).d);
  add(1, 'binom1', 'Prueba binomial exacta: 60 de 100', () => R().binom_60_100, SP() + ' binomtest', 1e-9, () => L.ev.binomTest(60, 100));
  add(1, 'binom2', 'Prueba binomial exacta: 9 de 12', () => R().binom_9_12, SP() + ' binomtest', 1e-9, () => L.ev.binomTest(9, 12));
  add(1, 'rtmsim', 'Regresión a la media: ensayo simulado sin efecto ni placebo; la mejora media del control coincide con la del grupo tratado', 0, 'propiedad (diferencia < 0,25 puntos con 1.500 por brazo)', 0.25, () => Math.abs(L.ev.trial({ n: 1500, seed: 3 }).diff));

  /* ---------- 2 · Neurona ---------- */
  add(2, 'nerK', 'Potencial de Nernst del K⁺ a 37 °C (5 mM fuera, 140 mM dentro)', () => R().nernst_K, SP() + ' constants (CODATA)', 1e-6, () => L.neuro.nernst(1, 5, 140), { unit: 'mV' });
  add(2, 'nerNa', 'Potencial de Nernst del Na⁺ a 37 °C (145 / 12 mM)', () => R().nernst_Na, SP() + ' constants (CODATA)', 1e-6, () => L.neuro.nernst(1, 145, 12), { unit: 'mV' });
  add(2, 'ghk', 'Potencial de reposo de Goldman-Hodgkin-Katz (pK : pNa : pCl = 1 : 0,05 : 0,45)', () => R().ghk, SP() + ' constants (CODATA)', 1e-6, () => L.neuro.ghk(Object.assign({ pK: 1, pNa: 0.05, pCl: 0.45 }, L.neuro.CONC)), { unit: 'mV' });
  add(2, 'hh10', 'Hodgkin-Huxley: frecuencia sostenida con 10 µA/cm²', () => R().hh_rate10, SP() + ' solve_ivp (RK45, tol 1e-9)', 0.02, () => L.neuro.hhRate(10), { unit: 'Hz' });
  add(2, 'hh20', 'Hodgkin-Huxley: frecuencia con 20 µA/cm²', () => R().hh_rate20, SP() + ' solve_ivp', 0.02, () => L.neuro.hhRate(20), { unit: 'Hz' });
  add(2, 'hhpulse', 'Hodgkin-Huxley: instante de la espiga tras un pulso de 1 ms', () => R().hh_pulse, SP() + ' solve_ivp con eventos', 0.002, () => L.neuro.hhSim({ T: 50, dt: 0.005, I: (t) => (t > 5 - 1e-9 && t < 6 - 1e-9 ? 20 : 0) }).spikes[0], { unit: 'ms' });
  add(2, 'hhonset', 'Hodgkin-Huxley: umbral de disparo repetitivo (reobase del tren)', () => R().hh_onset, SP() + ' + bisección', 0.01, () => { let lo = 5.5, hi = 7; for (let k = 0; k < 14; k++) { const m = 0.5 * (lo + hi); if (L.neuro.hhRate(m, { T: 600, tA: 300 }) > 0) hi = m; else lo = m; } return 0.5 * (lo + hi); }, { unit: 'µA/cm²' });
  add(2, 'lif', 'Integrar y disparar: frecuencia simulada frente a la fórmula exacta (I = 2 nA)', () => R().lif_rate2, 'fórmula analítica (Python)', 0.6, () => { const s = L.neuro.lifSim({ I: 2, T: 2000, dt: 0.005 }); return (1000 * (s.spikes.length - 1)) / (s.spikes[s.spikes.length - 1] - s.spikes[0]); }, { unit: 'Hz' });

  /* ---------- 4 · Plasticidad ---------- */
  add(4, 'oja', 'Regla de Oja: coseno entre el peso aprendido y el vector propio principal', 1, NP() + ' linalg.eigh', 2e-3, () => { const r = L.plast.oja({ n: 20000, eta: 0.002, seed: 4 }); const v = R().oja_v1; return Math.abs(r.w[0] * v[0] + r.w[1] * v[1]) / Math.hypot(r.w[0], r.w[1]); });
  add(4, 'ojan', 'Regla de Oja: norma del peso aprendido', 1, 'propiedad (‖w‖ → 1)', 0.02, () => { const r = L.plast.oja({ n: 20000, eta: 0.002, seed: 4 }); return Math.hypot(r.w[0], r.w[1]); });
  add(4, 'pc1', 'Vector propio principal 2×2 por fórmula cerrada', () => R().oja_v1[0], NP() + ' linalg.eigh', 1e-12, () => Math.abs(L.plast.pc1(1, 0.3, 0.25).v[0]));

  /* ---------- 5 · Memoria ---------- */
  add(5, 'hop1', 'Hopfield: probabilidad teórica de bit inestable, N = 100, P = 14', () => R().hop_err_100_14, SP() + ' special.erf', 1e-7, () => L.plast.hopErr(100, 14));
  add(5, 'hop2', 'Hopfield: fracción de bits inestables medida (N = 200, P = 30) frente a la teoría', () => R().hop_err_200_30, SP() + ' special.erf', 0.004, () => L.plast.hopErrMC(200, 30, 6));
  add(5, 'pa1', 'Modelo de espaciado: recuerdo a la semana tras 4 repasos masivos', () => R().pa_masivo, 'reimplementación en Python', 1e-12, () => L.learn.paRecall([0, 10, 20, 30], 30 + 86400 * 7));
  add(5, 'pa2', 'Modelo de espaciado: recuerdo a la semana tras 4 repasos espaciados', () => R().pa_espaciado, 'reimplementación en Python', 1e-12, () => L.learn.paRecall([0, 86400, 172800, 259200], 259200 + 86400 * 7));

  /* ---------- 7 · Aprendizaje por refuerzo ---------- */
  add(7, 'rw', 'Rescorla-Wagner: 10 ensayos con αβ = 0,3 (simulación frente a fórmula cerrada)', () => R().rw10, 'fórmula 1 − (1 − αβ)ⁿ', 1e-12, () => L.learn.rw(Array.from({ length: 10 }, () => ({ cues: ['A'], r: 1 })), { beta: 0.3 }).pop().A);
  add(7, 'block', 'Rescorla-Wagner: bloqueo de Kamin (la clave B aprende menos de 0,05)', 1, 'propiedad del modelo', 0, () => { const tr = []; for (let i = 0; i < 40; i++) tr.push({ cues: ['A'], r: 1 }); for (let i = 0; i < 40; i++) tr.push({ cues: ['A', 'B'], r: 1 }); return L.learn.rw(tr, { beta: 0.3 }).pop().B < 0.05 ? 1 : 0; });
  add(7, 'td', 'Diferencias temporales: valor aprendido en el instante de la clave = γ^(tr − tc)', () => R().td_exact[0], 'valor exacto (Python)', 2e-3, () => L.learn.tdRun({ trials: 3000 }).w[0]);
  add(7, 'tdshift', 'Diferencias temporales: tras el aprendizaje el error de predicción pasa de la recompensa a la clave', 1, 'propiedad (Schultz y otros, 1997)', 0, () => { const r = L.learn.tdRun({ trials: 400 }); const a = r.deltas[0], b = r.deltas[399]; return a[15] > 0.9 && Math.abs(b[15]) < 0.02 && b[4] > 0.7 ? 1 : 0; });

  /* ---------- 8 · Programar neuronas ---------- */
  add(8, 'cue', 'Integración óptima: desviación combinada con σV = 2 y σH = 1', () => R().cue_s, 'fórmula (Python)', 1e-12, () => L.learn.cueComb(2, 1).s);
  add(8, 'cuew', 'Integración óptima: peso de la vista', () => R().cue_wV, 'fórmula (Python)', 1e-12, () => L.learn.cueComb(2, 1).wV);
  add(8, 'perc', 'Perceptrón: converge en un problema linealmente separable (AND)', 0, 'teorema de convergencia', 0, () => L.learn.perceptron([[0, 0], [0, 1], [1, 0], [1, 1]], [0, 0, 0, 1], { epochs: 100 }).hist.pop().errs);

  /* ---------- 15 · Hábitos ---------- */
  add(15, 'lallyA', 'Curva de automaticidad: asíntota a (Levenberg-Marquardt frente a curve_fit)', () => R().lally_p[0], SP() + ' optimize.curve_fit', 1e-5, () => L.hab.fitLally(Dt().lally_t, Dt().lally_y).a);
  add(15, 'lallyC', 'Curva de automaticidad: tasa c', () => R().lally_p[2], SP() + ' optimize.curve_fit', 1e-6, () => L.hab.fitLally(Dt().lally_t, Dt().lally_y).c);
  add(15, 'lally95', 'Días hasta el 95 % de la asíntota', () => R().lally_t95, SP() + ' optimize.curve_fit', 1e-3, () => L.hab.fitLally(Dt().lally_t, Dt().lally_y).t95, { unit: 'días' });

  /* ---------- 18 · Medir ---------- */
  add(18, 'ols', 'Regresión lineal: pendiente del peso (kg/día)', () => R().ols_b, SP() + ' stats.linregress', 1e-10, () => L.tend.ols(Dt().tend_y.map((_, i) => i), Dt().tend_y).b);
  add(18, 'olshi', 'Regresión lineal: extremo superior del IC 95 % de la pendiente', () => R().ols_hi, SP() + ' linregress + t.ppf', 1e-8, () => L.tend.ols(Dt().tend_y.map((_, i) => i), Dt().tend_y).hi);
  add(18, 'kal', 'Filtro de Kalman de tendencia: nivel final', () => R().kal_lvl, NP() + ' (mismas matrices)', 1e-9, () => { const k = L.tend.kalman(Dt().tend_y); return k.lvl[k.lvl.length - 1]; });
  add(18, 'kals', 'Filtro de Kalman de tendencia: pendiente final', () => R().kal_slope, NP() + ' (mismas matrices)', 1e-10, () => { const k = L.tend.kalman(Dt().tend_y); return k.slope[k.slope.length - 1]; });

  /* ---------- 19 · Aprendizaje motor ---------- */
  add(19, 'lcpow', 'Curva potencial: exponente ajustado', () => R().lc_pow[2], SP() + ' optimize.curve_fit', 1e-4, () => L.dep.fit(Dt().lc_N, Dt().lc_T, 'pow').p[2]);
  add(19, 'lcexp', 'Curva exponencial: tasa ajustada', () => R().lc_exp[2], SP() + ' optimize.curve_fit', 1e-4, () => L.dep.fit(Dt().lc_N, Dt().lc_T, 'exp').p[2]);

  add(19, 'ts1', 'Adaptación de dos estados: salida tras 200 ensayos de perturbación', () => R().ts_200, 'recursión en Python', 1e-12, () => L.dep.twoState(L.dep.protocolo(200, 6, 100)).X[199]);
  add(19, 'ts2', 'Adaptación de dos estados: tras la perturbación opuesta la salida vuelve cerca de cero', () => R().ts_206, 'recursión en Python', 1e-12, () => L.dep.twoState(L.dep.protocolo(200, 6, 100)).X[205]);
  add(19, 'ts3', 'Recuperación espontánea en la pinza de error (40 ensayos después)', () => R().ts_246, 'recursión en Python', 1e-12, () => L.dep.twoState(L.dep.protocolo(200, 6, 100)).X[245]);

  /* ---------- 21 · Carga de entrenamiento ---------- */
  add(21, 'ban', 'Banister: forma en el día 70 (recursión frente a suma de convolución)', () => R().ban_p70, NP() + ' (suma directa)', 1e-7, () => L.dep.banister(Dt().ban_loads).p[70], { rel: true });
  add(21, 'bang', 'Banister: estado físico en el día 70', () => R().ban_g70, NP() + ' (suma directa)', 1e-9, () => L.dep.banister(Dt().ban_loads).g[70], { rel: true });
  add(21, 'mono', 'Foster: monotonía de una semana', () => R().foster_mono, NP(), 1e-12, () => L.dep.foster([300, 420, 0, 380, 300, 520, 0]).monotonia);
  add(21, 'strain', 'Foster: tensión de la semana', () => R().foster_strain, NP(), 1e-9, () => L.dep.foster([300, 420, 0, 380, 300, 520, 0]).tension);
  add(21, 'acwrc', 'Cociente agudo:crónico acoplado con cargas semanales independientes: correlación espuria agudo–crónico', 0.5, 'identidad: 1/√4 (Lolli y otros, 2019)', 0.01, () => L.dep.acwrSim({ n: 60000, seed: 5 }).rC);
  add(21, 'acwru', 'Cociente desacoplado con las mismas cargas: correlación agudo–crónico', 0, 'identidad: 0', 0.01, () => L.dep.acwrSim({ n: 60000, seed: 5 }).rU);

  /* ---------- 23 · Energía ---------- */
  add(23, 'mifh', 'Mifflin-St Jeor, hombre de 40 años, 175 cm, 95 kg', () => R().mifflin_h, 'fórmula publicada', 1e-9, () => L.en.mifflin('h', 95, 175, 40), { unit: 'kcal/día' });
  add(23, 'mifm', 'Mifflin-St Jeor, mujer de 33 años, 162 cm, 68 kg', () => R().mifflin_m, 'fórmula publicada', 1e-9, () => L.en.mifflin('m', 68, 162, 33), { unit: 'kcal/día' });
  add(23, 'deur', 'Deurenberg: % de grasa estimado por IMC', () => R().deur_h, 'fórmula publicada', 1e-9, () => L.en.deurenberg('h', L.en.imc(95, 1.75), 40), { unit: '%' });
  add(23, 'hall30', 'Modelo de Hall: peso al día 30 con −500 kcal/día', () => R().hall_30, SP() + ' solve_ivp (LSODA, tol 1e-10)', 2e-3, () => L.en.hallSim({ sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, (t, s) => ({ kcal: s.EI0 / 4.184 - 500 }), 30).BW[30], { unit: 'kg' });
  add(23, 'hall365', 'Modelo de Hall: peso al año', () => R().hall_365, SP() + ' solve_ivp', 2e-3, () => L.en.hallSim({ sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, (t, s) => ({ kcal: s.EI0 / 4.184 - 500 }), 365).BW[365], { unit: 'kg' });
  add(23, 'hall3y', 'Modelo de Hall: peso a los tres años', () => R().hall_1095, SP() + ' solve_ivp', 3e-3, () => L.en.hallSim({ sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, (t, s) => ({ kcal: s.EI0 / 4.184 - 500 }), 1095).BW[1095], { unit: 'kg' });
  add(23, 'hallLC', 'Modelo de Hall: peso a la semana con dieta baja en carbohidratos (glucógeno y agua)', () => R().hall_lowcarb_7, SP() + ' solve_ivp', 2e-3, () => L.en.hallSim({ sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, (t, s) => ({ kcal: s.EI0 / 4.184 - 500, carbFrac: 0.1 }), 7).BW[7], { unit: 'kg' });
  add(23, 'hallSS', 'Regla de Hall y otros (2011): cada 100 kJ/día de cambio sostenido llevan a ≈ 1 kg (cambio final simulado)', -1, 'Lancet 2011 (regla aproximada)', 0.15, () => { const r = L.en.hallSim({ sexo: 'h', edad: 40, talla: 175, peso: 95, pal: 1.6 }, (t, s) => ({ kcal: s.EI0 / 4.184 - 100 / 4.184 }), 4000, 1); return r.BW[4000] - 95; }, { unit: 'kg' });
  add(23, 'frayn', 'Frayn: oxidación de grasa con VO₂ = 3,0 y VCO₂ = 2,8 L/min', () => R().frayn[1], 'fórmula publicada', 1e-12, () => L.en.frayn(3.0, 2.8).grasa, { unit: 'g/min' });

  /* ---------- 30 · Extinción ---------- */
  add(30, 'ext1', 'Extinción con un contexto: error tras 24 ensayos = V (1 − αg − αc)^24', () => { const r = L.ter.extincion({ nExt: 24 }); return r.V * Math.pow(1 - 0.04 - 0.2, 24); }, 'identidad de la regla delta', 1e-12, () => L.ter.extincion({ nExt: 25 }).curva[12 + 24]);
  add(30, 'ext2', 'Extinción con un contexto: inhibición general = αg/(αg+αc) · (V − error final)', () => { const r = L.ter.extincion({ nExt: 24 }); return (0.04 / 0.24) * (r.V - r.V * Math.pow(0.76, 24)); }, 'identidad de la regla delta', 1e-12, () => L.ter.extincion({ nExt: 24 }).Ig);

  /* ---------- 29 · Cable y anestésicos locales ---------- */
  add(29, 'cable', 'Cable de Hodgkin-Huxley: velocidad de conducción (6,3 °C)', () => R().cable_v, NP() + ' (mismo esquema)', 0.01, () => L.neuro.cableRun({}).v, { unit: 'm/s' });
  add(29, 'block', 'Bloqueo total de 1 cm de axón: el impulso no lo atraviesa', 20, 'propiedad del modelo', 0, () => L.neuro.cableRun({ T: 15, block: (i) => (i >= 20 && i < 30 ? 1 : 0) }).reach);

  /* Ejecuta una prueba y devuelve {ok, v, ref, err, msg} */
  L.runCheck = function (c) {
    try {
      const v = c.fn();
      const ref = typeof c.ref === 'function' ? c.ref() : c.ref;
      const err = c.rel ? Math.abs(v - ref) / Math.max(1e-300, Math.abs(ref)) : Math.abs(v - ref);
      return { ok: isFinite(v) && err <= c.tol, v, ref, err };
    } catch (e) {
      return { ok: false, v: NaN, ref: NaN, err: Infinity, msg: String(e && e.message ? e.message : e) };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
