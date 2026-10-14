/* ===================================================================
   lib/70-energia.js — Balance energético y composición corporal:
   gasto en reposo (Mifflin-St Jeor, 1990), grasa inicial estimada por
   IMC (Deurenberg, 1991), modelo dinámico de peso de Hall y otros
   (Lancet 2011, apéndice web) con glucógeno, líquido extracelular y
   termogénesis adaptativa, la «regla de 7.700 kcal por kg», oxidación
   de sustratos por calorimetría indirecta (Frayn, 1983), gasto total
   restringido (Pontzer) y retroalimentación del apetito (Polidori, 2016).
   Internamente el modelo de Hall trabaja en kJ; la interfaz usa kcal.
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const En = (L.en = {});
  const KJ = 4.184;
  En.KJ = KJ;

  /* Mifflin-St Jeor (kcal/día): 10 P + 6,25 T − 5 E + 5 (hombres) o − 161 (mujeres); P kg, T cm, E años */
  En.mifflin = (sexo, peso, tallaCm, edad) => 10 * peso + 6.25 * tallaCm - 5 * edad + (sexo === 'h' ? 5 : -161);
  En.imc = (peso, tallaM) => peso / (tallaM * tallaM);
  /* Deurenberg, Weststrate y Seidell (1991): %grasa = 1,20 IMC + 0,23 edad − 10,8 S − 5,4 (S = 1 hombre, 0 mujer) */
  En.deurenberg = (sexo, imc, edad) => 1.2 * imc + 0.23 * edad - 10.8 * (sexo === 'h' ? 1 : 0) - 5.4;

  /* Parámetros del modelo de Hall y otros (2011), apéndice web */
  En.HALL = {
    rhoF: 39.5e3, rhoL: 7.6e3, rhoG: 17.6e3,      /* kJ/kg */
    gammaF: 13, gammaL: 92,                       /* kJ/kg/día */
    etaF: 750, etaL: 960,                         /* kJ/kg */
    betaTEF: 0.1, betaAT: 0.14, tauAT: 14,        /* adimensional, adimensional, días */
    G0: 0.5, aguaG: 2.7,                          /* kg de glucógeno inicial, g de agua por g de glucógeno */
    Na: 3.22, xiNa: 3000, xiCI: 4000,             /* mg/ml (= g/L), mg/L/día, mg/día */
    Cforbes: 10.4                                 /* kg */
  };

  /* Estado inicial a partir de datos personales.
     o = {sexo:'h'|'m', edad, talla (cm), peso (kg), grasaPct?, pal (1,4–2,2), carbFrac (fracción de la energía en carbohidratos)} */
  En.hallInit = function (o) {
    const P = En.HALL, BW = o.peso, H = o.talla / 100;
    const imc = En.imc(BW, H);
    const pct = o.grasaPct > 0 ? o.grasaPct : Math.max(5, En.deurenberg(o.sexo, imc, o.edad));
    const F = (BW * pct) / 100;
    const ECF = 0.235 * BW;              /* aproximado; en el modelo solo importan sus cambios */
    const Lm = BW - F - ECF - P.G0 * (1 + P.aguaG);
    const RMR = En.mifflin(o.sexo, BW, o.talla, o.edad) * KJ;
    const pal = o.pal || 1.6;
    const EE0 = pal * RMR;
    const delta = (((1 - P.betaTEF) * pal - 1) * RMR) / BW;
    const K = EE0 - P.gammaF * F - P.gammaL * Lm - delta * BW;
    const CF = o.carbFrac === undefined ? 0.5 : o.carbFrac;
    return { BW0: BW, F0: F, L0: Lm, ECF0: ECF, G0: P.G0, RMR0: RMR, EI0: EE0, delta, K, CF0: CF, CIb: CF * EE0, pct, imc };
  };

  /* Derivadas del modelo. y = [F, L, G, ECF, AT]; u = {EI (kJ/día), CF, dNa (mg/día), dDelta (kJ/kg/día)} */
  En.hallDeriv = function (y, u, s) {
    const P = En.HALL;
    const F = y[0], Lm = y[1], G = y[2], ECF = y[3], AT = y[4];
    const EI = u.EI, CI = (u.CF === undefined ? s.CF0 : u.CF) * EI;
    const kG = s.CIb / (s.G0 * s.G0);
    const dG = (CI - kG * G * G) / P.rhoG;
    const dECF = ((u.dNa || 0) - P.xiNa * (ECF - s.ECF0) - P.xiCI * (1 - CI / s.CIb)) / (P.Na * 1000);
    const BW = F + Lm + G * (1 + P.aguaG) + ECF;
    const C = (P.Cforbes * P.rhoL) / P.rhoF;
    const p = C / (C + F);
    const dEI = EI - s.EI0;
    const TEF = P.betaTEF * dEI;
    const a = (P.etaF / P.rhoF) * (1 - p) + (P.etaL / P.rhoL) * p;
    const delta = s.delta + (u.dDelta || 0);
    const EE = (s.K + P.gammaF * F + P.gammaL * Lm + delta * BW + TEF + AT + a * (EI - P.rhoG * dG)) / (1 + a);
    const bal = EI - EE - P.rhoG * dG;
    return { d: [((1 - p) * bal) / P.rhoF, (p * bal) / P.rhoL, dG, dECF, (P.betaAT * dEI - AT) / P.tauAT], EE, BW, p };
  };

  /* Simulación día a día con Runge-Kutta 4 (paso dt en días).
     plan(t, s, pesoActual) → {kcal, carbFrac, dNa, ejercicioKcal} ; ejercicioKcal se convierte en Δδ = kcal·4,184 / peso inicial */
  En.hallSim = function (o, plan, dias = 365, dt = 0.25) {
    const s = En.hallInit(o);
    let y = [s.F0, s.L0, s.G0, s.ECF0, 0];
    const out = { t: [0], BW: [o.peso], F: [s.F0], L: [s.L0], EE: [s.EI0 / KJ], EI: [s.EI0 / KJ], s };
    const P = En.HALL, bwOf = (yy) => yy[0] + yy[1] + yy[2] * (1 + P.aguaG) + yy[3];
    const U = (t, yy) => {
      const q = plan(t, s, bwOf(yy)) || {};
      return { EI: (q.kcal === undefined ? s.EI0 / KJ : q.kcal) * KJ, CF: q.carbFrac, dNa: q.dNa || 0, dDelta: ((q.ejercicioKcal || 0) * KJ) / o.peso };
    };
    const steps = Math.round(1 / dt);
    for (let day = 0; day < dias; day++) {
      let last;
      for (let k = 0; k < steps; k++) {
        const t = day + k * dt, u = U(t, y);
        const f = (yy) => En.hallDeriv(yy, u, s).d;
        const k1 = f(y), y2 = y.map((v, i) => v + 0.5 * dt * k1[i]);
        const k2 = f(y2), y3 = y.map((v, i) => v + 0.5 * dt * k2[i]);
        const k3 = f(y3), y4 = y.map((v, i) => v + dt * k3[i]);
        const k4 = f(y4);
        y = y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
        last = u;
      }
      const r = En.hallDeriv(y, last, s);
      out.t.push(day + 1); out.BW.push(r.BW); out.F.push(y[0]); out.L.push(y[1]); out.EE.push(r.EE / KJ); out.EI.push(last.EI / KJ);
    }
    out.y = y;
    return out;
  };
  /* Regla estática: 7.700 kcal por kg (≈ 3.500 kcal por libra) */
  En.rule7700 = (deficitKcal, dias) => (deficitKcal * dias) / 7700;
  /* Densidad energética efectiva del cambio de peso (kcal/kg) según la partición de Forbes */
  En.rhoEff = function (F) {
    const P = En.HALL, C = (P.Cforbes * P.rhoL) / P.rhoF, p = C / (C + F);
    /* fracción de masa magra en el cambio: dL/(dL+dF) */
    const dL = p / P.rhoL, dF = (1 - p) / P.rhoF;
    return { kcalKg: 1 / (dL + dF) / KJ, fracMagra: dL / (dL + dF) };
  };

  /* ---------- Oxidación de sustratos (Frayn, 1983), sin corrección por proteína ----------
     VO2 y VCO2 en L/min → g/min de carbohidrato y grasa */
  En.frayn = function (vo2, vco2) {
    return { cho: Math.max(0, 4.55 * vco2 - 3.21 * vo2), grasa: Math.max(0, 1.67 * vo2 - 1.67 * vco2) };
  };
  /* Cociente respiratorio típico según la intensidad (fracción del VO2máx): curva suave de 0,80 a 1,0.
     Valores ilustrativos coherentes con el concepto de cruce (Brooks y Mercier, 1994) y el FatMax (~64 %, Achten y otros, 2002). */
  En.rerTipico = (x, entrenado = 0) => Math.min(1.0, 0.8 + (0.2 - 0.03 * entrenado) * Math.pow(Math.max(0, x - 0.1) / 0.85, 1.6 - 0.25 * entrenado));
  /* Gasto y sustratos de una sesión: vo2max (L/min), intensidad x, minutos */
  En.sesion = function (vo2max, x, min, entrenado = 0) {
    const vo2 = vo2max * x, rer = En.rerTipico(x, entrenado), vco2 = vo2 * rer;
    const ox = En.frayn(vo2, vco2);
    const kcalMin = 3.941 * vo2 + 1.106 * vco2;   /* ecuación de Weir (1949) sin nitrógeno urinario */
    return { rer, grasaG: ox.grasa * min, choG: ox.cho * min, kcal: kcalMin * min, grasaGmin: ox.grasa, kcalMin };
  };

  /* ---------- Gasto total: modelo aditivo frente a restringido (Pontzer y otros, 2016) ----------
     act ∈ [0, 1] nivel de actividad. Aditivo: TEE = BMR (1,3 + 0,9 act). Restringido: crece y se aplana. */
  En.tee = function (bmr, act, modo) {
    if (modo === 'aditivo') return bmr * (1.3 + 0.9 * act);
    return bmr * (1.3 + 0.9 * (1 - Math.exp(-act / 0.35)) * 0.42);
  };

  /* ---------- Apetito que contrarresta la pérdida (Polidori y otros, 2016) ----------
     La ingesta sube ≈ k kcal/día por cada kg perdido (k ≈ 100), con un retardo τ (días). */
  En.appetite = function (o) {
    const k = o.k === undefined ? 100 : o.k, tau = o.tau || 14;
    let extra = 0;
    return (perdidaKg) => { extra += (k * Math.max(0, perdidaKg) - extra) / tau; return extra; };
  };
})(typeof window !== 'undefined' ? window : globalThis);
