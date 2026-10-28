/* ===================================================================
   33-fq-sol.js — Disoluciones: equilibrios ácido–base, solubilidad y sistema del carbono
   Constantes de ácidos: CRC Handbook (25 °C). Agua de mar: Lueker et al. (2000), Dickson (1990), Weiss (1974),
   Mucci (1983) a 25 °C y S = 35, escala total del pH (valores de PyCO2SYS).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const KW = 1e-14;
  FQ.KW = KW;

  /* Ácidos y bases: pKa por etapa (de la forma más protonada hacia la menos) y carga z0 de la forma más protonada */
  FQ.ACIDS = {
    acetico: { n: 'Ácido acético', f: 'CH₃COOH', pKa: [4.76], z0: 0 },
    formico: { n: 'Ácido fórmico', f: 'HCOOH', pKa: [3.75], z0: 0 },
    benzoico: { n: 'Ácido benzoico', f: 'C₆H₅COOH', pKa: [4.20], z0: 0 },
    lactico: { n: 'Ácido láctico', f: 'CH₃CH(OH)COOH', pKa: [3.86], z0: 0 },
    HF: { n: 'Ácido fluorhídrico', f: 'HF', pKa: [3.17], z0: 0 },
    HCN: { n: 'Ácido cianhídrico', f: 'HCN', pKa: [9.21], z0: 0 },
    fenol: { n: 'Fenol', f: 'C₆H₅OH', pKa: [9.99], z0: 0 },
    boric: { n: 'Ácido bórico', f: 'B(OH)₃', pKa: [9.24], z0: 0 },
    NH4: { n: 'Amonio / amoníaco', f: 'NH₄⁺', pKa: [9.25], z0: 1 },
    carbonico: { n: 'Ácido carbónico', f: 'H₂CO₃', pKa: [6.35, 10.33], z0: 0 },
    fosforico: { n: 'Ácido fosfórico', f: 'H₃PO₄', pKa: [2.15, 7.20, 12.35], z0: 0 },
    citrico: { n: 'Ácido cítrico', f: 'H₃Cit', pKa: [3.13, 4.76, 6.40], z0: 0 },
    oxalico: { n: 'Ácido oxálico', f: 'H₂C₂O₄', pKa: [1.25, 4.27], z0: 0 },
    glicina: { n: 'Glicina', f: 'H₂Gly⁺', pKa: [2.35, 9.78], z0: 1 }
  };
  /* Fracciones α_k de la especie con k protones perdidos, k = 0..n, a un pH dado */
  FQ.alpha = function (pKa, pH) {
    const h = Math.pow(10, -pH), n = pKa.length, terms = [1];
    let prod = 1;
    for (let k = 0; k < n; k++) { prod *= Math.pow(10, -pKa[k]) / h; terms.push(prod); }
    const s = terms.reduce((a, b) => a + b, 0);
    return terms.map((t) => t / s);
  };
  /* Carga media por molécula del sistema ácido–base a un pH: z0 − Σ k α_k */
  FQ.meanCharge = (acid, pH) => FQ.alpha(acid.pKa, pH).reduce((s, a, k) => s + (acid.z0 - k) * a, 0);
  /* pH de una disolución con sistemas ácido–base [{C (mol/L), pKa[], z0}] y carga neta S de iones fuertes (mol/L: cationes − aniones).
     Balance de carga: [H⁺] − K_w/[H⁺] + S + Σ C·(carga media) = 0. */
  FQ.pHsolve = function (systems, S) {
    const f = (pH) => { const h = Math.pow(10, -pH); let q = h - KW / h + S; for (const a of systems) q += a.C * FQ.meanCharge(a, pH); return q; };
    return FQ.bisect(f, -2, 16, 1e-13);
  };
  /* Curva de valoración: analito (ácido libre, o base libre con z0 = 1 para su ácido conjugado) de concentración Ca y volumen Va (mL);
     titulante fuerte de concentración Ct (mol/L), con signo: base fuerte (+1) o ácido fuerte (−1). S0 es la carga fija del analito (por mol): p. ej. +2 para Na₂CO₃. */
  FQ.titration = function (acid, Ca, Va, Ct, sign, Vt, S0 = 0) {
    const V = Va + Vt, C = (Ca * Va) / V, S = (S0 * Ca * Va + sign * Ct * Vt) / V;
    return FQ.pHsolve([{ C, pKa: acid.pKa, z0: acid.z0 }], S);
  };
  /* Disolución tampón (Henderson–Hasselbalch) */
  FQ.hh = (pKa, ratio) => pKa + Math.log10(ratio);

  /* ------------------ Solubilidad ------------------ */
  FQ.KSP = { AgCl: 1.77e-10, 'Mg(OH)2': 5.61e-12, CaF2: 3.45e-11, CaCO3: 3.36e-9, BaSO4: 1.08e-10 };
  /* AgCl en NaCl: Ag⁺ libre, AgCl(aq) (log β1 = 3.04) y AgCl₂⁻ (log β2 = 5.04); [Cl⁻] en mol/L. Devuelve la solubilidad total de plata */
  FQ.agclSol = function (cl) {
    const K = FQ.KSP.AgCl, b1 = Math.pow(10, 3.04), b2 = Math.pow(10, 5.04);
    const ag = K / cl, a1 = K * b1, a2 = K * b2 * cl;
    return { ag, agcl: a1, agcl2: a2, total: ag + a1 + a2 };
  };
  FQ.mgOH2Sol = (pH) => FQ.KSP['Mg(OH)2'] / Math.pow(Math.pow(10, pH - 14), 2);
  FQ.caF2Sol = function (pH) { const a = FQ.alpha(FQ.ACIDS.HF.pKa, pH)[1]; return Math.cbrt(FQ.KSP.CaF2 / (4 * a * a)); };
  FQ.caCO3Sol = function (pH) { const a = FQ.alpha(FQ.ACIDS.carbonico.pKa, pH)[2]; return Math.sqrt(FQ.KSP.CaCO3 / a); };

  /* ------------------ Sistema del carbono en agua de mar (25 °C, S = 35, escala total) ------------------ */
  FQ.SW = { K0: 0.0283918818, K1: 1.4218281371e-6, K2: 1.0815547472e-9, KB: 2.5265729902e-9, Kw: 6.155507249e-14, BT: 416.0e-6, Ca: 0.010282, KspCal: 4.27e-7 };
  /* Dado fCO₂ (µatm) y la alcalinidad total TA (µmol/kg), calcula pH, DIC y [CO₃²⁻] (µmol/kg) y Ω de la calcita */
  FQ.seawater = function (fco2, TA) {
    const c = FQ.SW, co2 = c.K0 * fco2 * 1e-6;
    const ta = (h) => co2 * (c.K1 / h + (2 * c.K1 * c.K2) / (h * h)) + (c.BT * c.KB) / (c.KB + h) + c.Kw / h - h;
    const h = Math.pow(10, -FQ.bisect((pH) => ta(Math.pow(10, -pH)) - TA * 1e-6, 5, 10.5, 1e-13));
    const hco3 = (co2 * c.K1) / h, co3 = (co2 * c.K1 * c.K2) / (h * h);
    return { pH: -Math.log10(h), dic: (co2 + hco3 + co3) * 1e6, co2: co2 * 1e6, hco3: hco3 * 1e6, co3: co3 * 1e6, omega: (c.Ca * co3) / c.KspCal };
  };
  /* Factor de Revelle a TA fija: (dfCO₂/fCO₂)/(dDIC/DIC) */
  FQ.revelle = function (fco2, TA) {
    const a = FQ.seawater(fco2 * 0.999, TA), b = FQ.seawater(fco2 * 1.001, TA);
    return (Math.log(1.001 / 0.999)) / Math.log(b.dic / a.dic);
  };
  /* Agua pura en equilibrio con CO₂ atmosférico (KH = 0.0339 mol/L/atm, pK1 = 6.35, 25 °C) */
  FQ.rainPH = function (ppm) { const KH = 0.0339, c = KH * ppm * 1e-6; return FQ.pHsolve([{ C: c, pKa: [6.35, 10.33], z0: 0 }], 0); };

  /* ------------------ Fases puras: agua y CO₂ ------------------ */
  const DAT = EM.dat || (typeof require !== 'undefined' ? require('./29-datos.js') : null);
  const lerp = (xs, ys, x) => { // interpolación lineal en tablas ordenadas
    let lo = 0, hi = xs.length - 1; if (x <= xs[0]) return ys[0]; if (x >= xs[hi]) return ys[hi];
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return ys[lo] + ((ys[hi] - ys[lo]) * (x - xs[lo])) / (xs[hi] - xs[lo]);
  };
  /* Curva de sublimación: agua (IAPWS R14-08) y CO₂ (Span y Wagner 1996), P en Pa */
  FQ.Psub = function (g, T) {
    const d = DAT.ph[g];
    if (g === 'H2O') { const th = T / d.Tt; return d.Pt * Math.exp((-21.2144006 * Math.pow(th, 0.00333333333) + 27.3203819 * Math.pow(th, 1.20666667) - 6.1059813 * Math.pow(th, 1.70333333)) / th); }
    const ts = 1 - T / d.Tt; return d.Pt * Math.exp((d.Tt / T) * (-14.740846 * ts + 2.4327015 * Math.pow(ts, 1.9) - 5.3061778 * Math.pow(ts, 2.9)));
  };
  /* Presión de vapor (curva de vaporización) entre el punto triple y el crítico */
  FQ.Pvap = function (g, T) { const s = DAT.ph[g].sat; return Math.exp(lerp(s.map((q) => q[0]), s.map((q) => Math.log(q[1])), T)); };
  /* Temperatura de fusión a la presión P (tabla de CoolProp; agua: IAPWS R14, CO₂: Span y Wagner) */
  FQ.Tmelt = function (g, P) { const m = DAT.ph[g].mel; return lerp(m.map((q) => Math.log(q[0])), m.map((q) => q[1]), Math.log(P)); };
  /* Fase estable a (T, P) */
  FQ.phaseAt = function (g, T, P) {
    const d = DAT.ph[g];
    if (T >= d.Tc && P >= d.Pc) return 'fluido supercrítico';
    const Pe = T >= d.Tt ? (T < d.Tc ? FQ.Pvap(g, T) : Infinity) : FQ.Psub(g, T);
    if (P < Pe) return 'gas';
    return T < FQ.Tmelt(g, Math.max(P, d.Pt)) ? 'sólido' : T >= d.Tc ? 'fluido denso' : 'líquido';
  };
  /* Atmósfera estándar internacional (troposfera): presión (Pa) a la altitud h (m) */
  FQ.isaP = (h) => 101325 * Math.pow(1 - 2.25577e-5 * h, 5.25588);

  /* ------------------ Equilibrio líquido–vapor: Antoine, Raoult, NRTL, destilación ------------------ */
  FQ.LIQ = DAT.liq;
  FQ.Pi = (n, T) => Math.pow(10, FQ.LIQ[n].A - FQ.LIQ[n].B / (T + FQ.LIQ[n].C)); /* Pa */
  FQ.Ti = (n, P) => { const q = FQ.LIQ[n]; return q.B / (q.A - Math.log10(P)) - q.C; };
  /* Coeficientes de actividad NRTL de ChemSep (τ = b/T con b en K) para el par a|b (en cualquier orden) a la temperatura T; x1 es la fracción de a */
  FQ.nrtl = function (a, b, x1, T) {
    let key = a + '|' + b, rev = false, d = DAT.nrtl[key];
    if (!d) { key = b + '|' + a; d = DAT.nrtl[key]; rev = true; }
    if (!d) return [1, 1];
    const al = d.alpha;
    const t12 = d.b12 / T, t21 = d.b21 / T, G12 = Math.exp(-al * t12), G21 = Math.exp(-al * t21);
    const xa = rev ? 1 - x1 : x1, xb = 1 - xa;  /* a, b del orden del diccionario */
    const lnA = xb * xb * (t21 * Math.pow(G21 / (xa + xb * G21), 2) + (t12 * G12) / Math.pow(xb + xa * G12, 2));
    const lnB = xa * xa * (t12 * Math.pow(G12 / (xb + xa * G12), 2) + (t21 * G21) / Math.pow(xa + xb * G21, 2));
    return rev ? [Math.exp(lnB), Math.exp(lnA)] : [Math.exp(lnA), Math.exp(lnB)];
  };
  /* Coeficientes de actividad: modelo 'ideal' o 'nrtl' */
  FQ.gamma = (a, b, x1, T, model) => (model === 'nrtl' ? FQ.nrtl(a, b, x1, T) : [1, 1]);
  /* Presión de burbuja y composición del vapor a T, x1: P = Σ xi γi Pi(sat), yi = xi γi Pi(sat) / P */
  FQ.bubbleP = function (a, b, x1, T, model) {
    const g = FQ.gamma(a, b, x1, T, model), p1 = x1 * g[0] * FQ.Pi(a, T), p2 = (1 - x1) * g[1] * FQ.Pi(b, T), P = p1 + p2;
    return { P, y1: p1 / P, g };
  };
  /* Temperatura de burbuja a P y x1 */
  FQ.bubbleT = function (a, b, x1, P, model) {
    const lo = Math.min(FQ.Ti(a, P), FQ.Ti(b, P)) - 40, hi = Math.max(FQ.Ti(a, P), FQ.Ti(b, P)) + 40;
    const T = FQ.bisect((t) => FQ.bubbleP(a, b, x1, t, model).P - P, lo, hi, 1e-12);
    const r = FQ.bubbleP(a, b, x1, T, model); return { T, y1: r.y1, g: r.g };
  };
  /* Azeótropo a P (si existe): composición donde x1 = y1; devuelve {x, T} o null */
  FQ.azeotropeP = function (a, b, P, model) {
    const f = (x) => FQ.bubbleT(a, b, x, P, model).y1 - x;
    let prev = f(0.002), xp = 0.002;
    for (let x = 0.01; x <= 0.998; x += 0.01) { const v = f(x); if (prev * v < 0) { const xe = FQ.bisect(f, xp, x, 1e-10); return { x: xe, T: FQ.bubbleT(a, b, xe, P, model).T }; } prev = v; xp = x; }
    return null;
  };
  /* Constantes de Henry de gases en agua: ln(H/Pa) = A + B/T, con H = P/x (fracción molar disuelta) */
  FQ.henryH = (g, T) => Math.exp(DAT.henry[g].A + DAT.henry[g].B / T);
  /* Solubilidad molar (mol/L de disolución) de un gas con presión parcial p (Pa) en agua a T (aproximación diluida) */
  FQ.henryC = function (g, p, T) { const x = p / FQ.henryH(g, T), rho = 997 / 18.015 * 1; return (x * 55.343 * (1 - 0.0 * x)) * (997 / 997); };
  /* McCabe–Thiele con volatilidad relativa α constante: devuelve etapas y reflujo mínimo.
     F: composición de alimentación zF, q (calidad), R reflujo, xD, xB */
  FQ.mccabe = function (alpha, zF, q, Rr, xD, xB) {
    const eq = (x) => (alpha * x) / (1 + (alpha - 1) * x), inv = (y) => y / (alpha - (alpha - 1) * y);
    /* intersección de las rectas de operación */
    const sR = Rr / (Rr + 1), bR = xD / (Rr + 1);
    let xi, yi;
    if (Math.abs(q - 1) < 1e-9) { xi = zF; yi = sR * xi + bR; } else { const sq = q / (q - 1), bq = -zF / (q - 1); xi = (bq - bR) / (sR - sq); yi = sR * xi + bR; }
    const sS = (yi - xB) / (xi - xB), bS = xB - sS * xB;
    const stages = []; let x = xD, y = xD, n = 0, feed = 0;
    for (let k = 0; k < 200; k++) {
      x = inv(y); stages.push([x, y, 'h']); n++;
      if (x <= xB) break;
      const yn = x > xi ? sR * x + bR : sS * x + bS; if (x <= xi && !feed) feed = n;
      stages.push([x, yn, 'v']); y = yn;
    }
    /* reflujo mínimo: la recta de operación pasa por la intersección de la recta q con la curva de equilibrio */
    let xq, yq;
    if (Math.abs(q - 1) < 1e-9) { xq = zF; yq = eq(xq); } else { const sq = q / (q - 1), bq = -zF / (q - 1); xq = FQ.bisect((x_) => eq(x_) - (sq * x_ + bq), 1e-9, 1 - 1e-9); yq = eq(xq); }
    const Rmin = (xD - yq) / (yq - xq);
    return { stages, n, feed, xi, yi, Rmin, eq, Nmin: Math.log((xD / (1 - xD)) * ((1 - xB) / xB)) / Math.log(alpha) };
  };

  /* ------------------ Modelos de energía de Gibbs de exceso (binarios) ------------------
     Todas devuelven [ln γ₁, ln γ₂]; G^E/(RT) = x₁ ln γ₁ + x₂ ln γ₂ */
  FQ.act = {
    margules: (A12, A21, x1) => { const x2 = 1 - x1; return [x2 * x2 * (A12 + 2 * (A21 - A12) * x1), x1 * x1 * (A21 + 2 * (A12 - A21) * x2)]; },
    vanlaar: (A12, A21, x1) => { const x2 = 1 - x1, d = A12 * x1 + A21 * x2; return [A12 * Math.pow((A21 * x2) / d, 2), A21 * Math.pow((A12 * x1) / d, 2)]; },
    wilson: (L12, L21, x1) => { const x2 = 1 - x1, a = x1 + L12 * x2, b = x2 + L21 * x1; return [-Math.log(a) + x2 * (L12 / a - L21 / b), -Math.log(b) - x1 * (L12 / a - L21 / b)]; },
    nrtl: (t12, t21, al, x1) => {
      const x2 = 1 - x1, G12 = Math.exp(-al * t12), G21 = Math.exp(-al * t21);
      return [x2 * x2 * (t21 * Math.pow(G21 / (x1 + x2 * G21), 2) + (t12 * G12) / Math.pow(x2 + x1 * G12, 2)), x1 * x1 * (t12 * Math.pow(G12 / (x2 + x1 * G12), 2) + (t21 * G21) / Math.pow(x1 + x2 * G21, 2))];
    },
    regular: (chi, x1) => { const x2 = 1 - x1; return [chi * x2 * x2, chi * x1 * x1]; }
  };
  FQ.gEoverRT = (lng, x1) => x1 * lng[0] + (1 - x1) * lng[1];
  /* Equilibrio líquido–líquido de un binario: lng(x1) → [ln γ₁, ln γ₂]. Devuelve {xa, xb} (x₁ de las dos fases, xa < xb) o null */
  FQ.lle = function (lng) {
    const N = 600, xs = [], g = [];
    for (let i = 1; i < N; i++) { const x = i / N; xs.push(x); g.push(x * Math.log(x) + (1 - x) * Math.log(1 - x) + FQ.gEoverRT(lng(x), x)); }
    /* envolvente convexa inferior */
    const hull = [];
    for (let i = 0; i < xs.length; i++) { while (hull.length >= 2) { const a = hull[hull.length - 2], b = hull[hull.length - 1]; if ((xs[b] - xs[a]) * (g[i] - g[a]) - (g[b] - g[a]) * (xs[i] - xs[a]) <= 0) hull.pop(); else break; } hull.push(i); }
    let best = null;
    for (let k = 0; k + 1 < hull.length; k++) { const gap = hull[k + 1] - hull[k]; if (gap > 8 && (!best || gap > best[1] - best[0])) best = [hull[k], hull[k + 1]]; }
    if (!best) return null;
    let xa = xs[best[0]], xb = xs[best[1]];
    for (let it = 0; it < 60; it++) {
      const la = lng(xa), lb = lng(xb);
      const F = [Math.log(xa) + la[0] - Math.log(xb) - lb[0], Math.log(1 - xa) + la[1] - Math.log(1 - xb) - lb[1]];
      const h = 1e-7, J = [[0, 0], [0, 0]];
      const fa = lng(xa + h), fb = lng(xb + h);
      J[0][0] = (Math.log(xa + h) + fa[0] - Math.log(xa) - la[0]) / h; J[1][0] = (Math.log(1 - xa - h) + lng(xa + h)[1] - Math.log(1 - xa) - la[1]) / h;
      J[0][1] = -(Math.log(xb + h) + fb[0] - Math.log(xb) - lb[0]) / h; J[1][1] = -(Math.log(1 - xb - h) + fb[1] - Math.log(1 - xb) - lb[1]) / h;
      const d = FQ.solve(J, [-F[0], -F[1]]); if (!d) break;
      const na = xa + d[0], nb = xb + d[1];
      if (!(na > 0 && na < 1 && nb > 0 && nb < 1)) break;
      xa = na; xb = nb; if (Math.abs(d[0]) + Math.abs(d[1]) < 1e-13) break;
    }
    return xb - xa > 1e-4 ? { xa, xb } : null;
  };
  /* ln γ de NRTL (ChemSep) del par a|b a la temperatura T, en función de x₁ de a */
  FQ.nrtlPair = function (a, b, T) { return (x1) => { const g = FQ.nrtl(a, b, x1, T); return [Math.log(g[0]), Math.log(g[1])]; }; };

  /* ------------------ Propiedades coligativas y disoluciones de NaCl (Pitzer) ------------------ */
  const MW = 0.018015268; /* kg/mol del agua */
  FQ.Kf = (R_ => (R_ * 273.15 * 273.15 * MW) / 6010)(FQ.R);      /* K·kg/mol */
  FQ.Kb = (R_ => (R_ * 373.15 * 373.15 * MW) / 40660)(FQ.R);
  /* Modelo de Pitzer del NaCl a 25 °C (Pitzer y Mayorga 1973; parámetros de Pitzer 1991): coeficiente osmótico φ y coeficiente de actividad medio γ± */
  FQ.pitzerNaCl = function (m) {
    const Aphi = 0.3915, b = 1.2, B0 = 0.0765, B1 = 0.2664, C = 0.00127, al = 2.0, I = m, sI = Math.sqrt(I);
    const phi = 1 - (Aphi * sI) / (1 + b * sI) + m * (B0 + B1 * Math.exp(-al * sI)) + m * m * C;
    const f = -Aphi * (sI / (1 + b * sI) + (2 / b) * Math.log(1 + b * sI));
    const g = 2 * (B0 + (B1 / (al * al * I)) * (1 - (1 + al * sI - 0.5 * al * al * I) * Math.exp(-al * sI)));
    const lng = f + m * g + (1.5 * m * m * C);
    return { phi, gamma: Math.exp(lng), aw: Math.exp(-2 * m * MW * phi), pi: (2 * m * phi * FQ.R * 298.15 * 997) / 1e6 /* MPa aprox: Π = ν m φ ρ_w RT (ρ_w ≈ 997 kg/m³, m en mol/kg) */ };
  };
  /* Descenso crioscópico exacto para una actividad de agua a_w (ΔH_fus = 6010 J/mol; ΔC_p de fusión despreciado) */
  FQ.freezeT = (aw) => 1 / (1 / 273.15 - (FQ.R * Math.log(aw)) / 6010);

  /* ------------------ Electrolitos: Debye–Hückel, Davies, Pitzer y conductividad ------------------ */
  /* Constante de Debye–Hückel A (base 10, kg^½·mol^-½) a T: A = (2π N_A ρ_w)^½ (e²/(4π ε₀ ε_r k_B T))^(3/2) / ln 10, con ε_r(T) del agua (Malmberg y Maryott) */
  FQ.epsW = (T) => { const t = T - 273.15; return 87.740 - 0.40008 * t + 9.398e-4 * t * t - 1.410e-6 * t * t * t; };
  FQ.rhoW = (T) => { const t = T - 273.15; return 999.83952 + 16.945176 * t - 7.9870401e-3 * t * t - 46.170461e-6 * t * t * t + 105.56302e-9 * t * t * t * t - 280.54253e-12 * Math.pow(t, 5); /* /(1+16.897850e-3 t) */ };
  FQ.rhoWater = (T) => FQ.rhoW(T) / (1 + 16.89785e-3 * (T - 273.15));
  FQ.Adh = function (T = 298.15) {
    const lB = (FQ.e * FQ.e) / (4 * Math.PI * FQ.eps0 * FQ.epsW(T) * FQ.kB * T), rho = FQ.rhoWater(T);
    return Math.sqrt(2 * Math.PI * FQ.NA * rho) * Math.pow(lB, 1.5) / Math.LN10;
  };
  /* Longitud de Debye (m) para un electrolito simétrico con fuerza iónica I (mol/kg ≈ mol/L) en agua a T */
  FQ.debyeLength = (I, T = 298.15) => Math.sqrt((FQ.eps0 * FQ.epsW(T) * FQ.kB * T) / (2 * FQ.NA * FQ.e * FQ.e * I * 1000));
  /* Leyes de γ± para un electrolito de cargas |z+|, |z−|: límite, extendida (a: parámetro de tamaño en Å) y Davies */
  FQ.dh = {
    limit: (zz, I, A = 0.509) => Math.pow(10, -A * zz * Math.sqrt(I)),
    ext: (zz, I, B = 0.3291 * 1, a = 4, A = 0.509) => Math.pow(10, (-A * zz * Math.sqrt(I)) / (1 + B * a * Math.sqrt(I))),
    davies: (zz, I, A = 0.509) => Math.pow(10, -A * zz * (Math.sqrt(I) / (1 + Math.sqrt(I)) - 0.3 * I))
  };
  /* Parámetros de Pitzer a 25 °C (Pitzer 1991): β⁰, β¹, β², C^φ; cargas y números estequiométricos */
  FQ.ELEC = {
    NaCl: { n: 'NaCl', zM: 1, zX: 1, nM: 1, nX: 1, b0: 0.0765, b1: 0.2664, b2: 0, C: 0.00127 },
    KCl: { n: 'KCl', zM: 1, zX: 1, nM: 1, nX: 1, b0: 0.04835, b1: 0.2122, b2: 0, C: -0.00084 },
    HCl: { n: 'HCl', zM: 1, zX: 1, nM: 1, nX: 1, b0: 0.1775, b1: 0.2945, b2: 0, C: 0.0008 },
    CaCl2: { n: 'CaCl₂', zM: 2, zX: 1, nM: 1, nX: 2, b0: 0.3159, b1: 1.614, b2: 0, C: -0.00034 },
    Na2SO4: { n: 'Na₂SO₄', zM: 1, zX: 2, nM: 2, nX: 1, b0: 0.01869, b1: 1.099, b2: 0, C: 0.00569 },
    MgSO4: { n: 'MgSO₄', zM: 2, zX: 2, nM: 1, nX: 1, b0: 0.2210, b1: 3.343, b2: -37.23, C: 0.025 }
  };
  FQ.pitzer = function (key, m) {
    const e = FQ.ELEC[key], nu = e.nM + e.nX, zz = e.zM * e.zX, I = 0.5 * (e.nM * e.zM * e.zM + e.nX * e.zX * e.zX) * m, sI = Math.sqrt(I), Aphi = 0.3915, b = 1.2;
    const a1 = zz === 4 ? 1.4 : 2.0, a2 = 12.0, nn = (2 * e.nM * e.nX) / nu, cc = (2 * Math.pow(e.nM * e.nX, 1.5)) / nu;
    const g = (x) => (2 * (1 - (1 + x - (x * x) / 2) * Math.exp(-x))) / (x * x);
    const Bphi = e.b0 + e.b1 * Math.exp(-a1 * sI) + e.b2 * Math.exp(-a2 * sI);
    const Bgam = 2 * e.b0 + e.b1 * g(a1 * sI) + e.b2 * g(a2 * sI);
    const fphi = -Aphi * sI / (1 + b * sI), fgam = -Aphi * (sI / (1 + b * sI) + (2 / b) * Math.log(1 + b * sI));
    const phi = 1 + zz * fphi + m * nn * Bphi + m * m * cc * e.C;
    const lng = zz * fgam + m * nn * Bgam + (1.5) * m * m * cc * e.C;
    return { phi, gamma: Math.exp(lng), I };
  };
  /* Conductividades molares iónicas límite a 25 °C (S·cm²/mol, por carga) — CRC */
  FQ.LAM = { 'H+': 349.8, 'Li+': 38.7, 'Na+': 50.1, 'K+': 73.5, 'Ag+': 61.9, 'NH4+': 73.5, 'Ca2+': 59.5, 'Mg2+': 53.1, 'OH-': 198.0, 'F-': 55.4, 'Cl-': 76.3, 'Br-': 78.1, 'I-': 76.8, 'NO3-': 71.4, 'CH3COO-': 40.9, 'HCO3-': 44.5, 'SO4_2-': 80.0 };
  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
