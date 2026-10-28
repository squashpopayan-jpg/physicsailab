/* ===================================================================
   32-fq-gas.js — Gases reales: ecuación de Peng–Robinson (puros y mezclas),
   coeficientes de fugacidad y segundo coeficiente virial (Pitzer–Curl/Tsonopoulos).
   Constantes críticas y factores acéntricos de CoolProp (tools/gen_datos.py).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const DAT = EM.dat || (typeof require !== 'undefined' ? require('./29-datos.js') : null);
  const R = FQ.R;
  FQ.crit = DAT.crit;

  /* Raíces reales de x³ + a x² + b x + c = 0, ordenadas */
  FQ.cubic = function (a, b, c) {
    const Q = (a * a - 3 * b) / 9, Rr = (2 * a * a * a - 9 * a * b + 27 * c) / 54, Q3 = Q * Q * Q, out = [];
    if (Rr * Rr < Q3) {
      const t = Math.acos(Rr / Math.sqrt(Q3)), s = -2 * Math.sqrt(Q);
      for (let k = 0; k < 3; k++) out.push(s * Math.cos((t + 2 * Math.PI * k) / 3) - a / 3);
    } else {
      const A = -Math.sign(Rr) * Math.cbrt(Math.abs(Rr) + Math.sqrt(Rr * Rr - Q3)), B = A === 0 ? 0 : Q / A;
      out.push(A + B - a / 3);
    }
    return out.sort((x, y) => x - y);
  };

  const S2 = Math.SQRT2;
  /* Parámetros de Peng–Robinson de la especie sp a la temperatura T: a(T) (Pa·m⁶/mol²) y b (m³/mol) */
  FQ.prParams = function (sp, T) {
    const c = FQ.crit[sp], k = 0.37464 + 1.54226 * c.w - 0.26992 * c.w * c.w, al = Math.pow(1 + k * (1 - Math.sqrt(T / c.Tc)), 2);
    return { a: (0.45724 * R * R * c.Tc * c.Tc * al) / c.Pc, b: (0.0778 * R * c.Tc) / c.Pc };
  };
  /* Mezcla: sp lista de especies, y fracciones molares, kij matriz opcional. phase: 'V' (raíz mayor), 'L' (menor) o 'min' (menor energía de Gibbs).
     Devuelve {Z, v (m³/mol), phi[], lnphi[], a, b} */
  FQ.prMix = function (sp, y, T, P, kij, phase = 'V') {
    const n = sp.length, pr = sp.map((s) => FQ.prParams(s, T));
    const aij = (i, j) => Math.sqrt(pr[i].a * pr[j].a) * (1 - (kij && kij[i] ? kij[i][j] || 0 : 0));
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) { b += y[i] * pr[i].b; for (let j = 0; j < n; j++) a += y[i] * y[j] * aij(i, j); }
    const A = (a * P) / (R * R * T * T), B = (b * P) / (R * T);
    const roots = FQ.cubic(-(1 - B), A - 3 * B * B - 2 * B, -(A * B - B * B - B * B * B)).filter((z) => z > B);
    const lnphiAt = (Z) => {
      const L = Math.log((Z + (1 + S2) * B) / (Z + (1 - S2) * B));
      return sp.map((_, i) => {
        let sa = 0; for (let j = 0; j < n; j++) sa += y[j] * aij(i, j);
        return (pr[i].b / b) * (Z - 1) - Math.log(Z - B) - (A / (2 * S2 * B)) * ((2 * sa) / a - pr[i].b / b) * L;
      });
    };
    let Z;
    if (phase === 'L') Z = roots[0]; else if (phase === 'V' || roots.length === 1) Z = roots[roots.length - 1];
    else { const gz = (z) => lnphiAt(z).reduce((s, v, i) => s + y[i] * v, 0); Z = gz(roots[0]) < gz(roots[roots.length - 1]) ? roots[0] : roots[roots.length - 1]; }
    const lnphi = lnphiAt(Z);
    return { Z, v: (Z * R * T) / P, lnphi, phi: lnphi.map(Math.exp), a, b, roots };
  };
  /* Especie pura */
  FQ.prPure = (sp, T, P, phase) => { const r = FQ.prMix([sp], [1], T, P, null, phase); return { Z: r.Z, phi: r.phi[0], v: r.v }; };
  /* Factor de compresibilidad de Peng–Robinson en variables reducidas (fase vapor/supercrítica) */
  FQ.prZred = function (Tr, Pr, w, phase = 'V') {
    const k = 0.37464 + 1.54226 * w - 0.26992 * w * w, al = Math.pow(1 + k * (1 - Math.sqrt(Tr)), 2);
    const A = (0.45724 * al * Pr) / (Tr * Tr), B = (0.0778 * Pr) / Tr;
    const r = FQ.cubic(-(1 - B), A - 3 * B * B - 2 * B, -(A * B - B * B - B * B * B)).filter((z) => z > B);
    return phase === 'L' ? r[0] : r[r.length - 1];
  };
  /* Presión de saturación de Peng–Robinson (fugacidades iguales), P en Pa; NaN si T ≥ Tc */
  FQ.prPsat = function (sp, T) {
    const c = FQ.crit[sp]; if (T >= c.Tc) return NaN;
    let P = c.Pc * Math.exp(5.373 * (1 + c.w) * (1 - c.Tc / T));
    for (let i = 0; i < 80; i++) {
      const L = FQ.prPure(sp, T, P, 'L'), V = FQ.prPure(sp, T, P, 'V');
      if (!isFinite(L.phi) || !isFinite(V.phi)) { P *= 0.9; continue; }
      const Pn = (P * L.phi) / V.phi;
      if (Math.abs(Pn - P) < 1e-10 * P) return Pn;
      P = Pn;
    }
    return P;
  };
  /* Segundo coeficiente virial de Pitzer–Curl (cm³/mol): B Pc/(R Tc) = B0 + ω B1 */
  FQ.virialB = function (sp, T) {
    const c = FQ.crit[sp], Tr = T / c.Tc;
    const B0 = 0.083 - 0.422 / Math.pow(Tr, 1.6), B1 = 0.139 - 0.172 / Math.pow(Tr, 4.2);
    return ((R * c.Tc) / c.Pc) * (B0 + c.w * B1) * 1e6;
  };
  /* Temperatura de Boyle de la correlación (K), donde B = 0 */
  FQ.boyleT = (sp) => FQ.bisect((T) => FQ.virialB(sp, T), 0.9 * FQ.crit[sp].Tc, 12 * FQ.crit[sp].Tc);
  /* ln φ y Z truncados en el segundo coeficiente virial */
  FQ.virialZ = (sp, T, P) => 1 + (FQ.virialB(sp, T) * 1e-6 * P) / (R * T);
  FQ.virialPhi = (sp, T, P) => Math.exp((FQ.virialB(sp, T) * 1e-6 * P) / (R * T));

  /* Síntesis de amoníaco N₂ + 3H₂ ⇌ 2NH₃ con alimentación 1:3: avance ξ (moles de reacción por mol de N₂) y fracción de NH₃ en el equilibrio.
     real = true usa coeficientes de fugacidad de Peng–Robinson (kij = 0); false, gas ideal. T en K, P en Pa */
  FQ.haber = function (T, P, real) {
    const K = Math.exp(FQ.lnK({ N2: -0.5, H2: -1.5, NH3: 1 }, T));
    const comp = (x) => { const n = 4 - 2 * x; return [(1 - x) / n, (3 - 3 * x) / n, (2 * x) / n]; };
    let xi = 0.3;
    for (let k = 0; k < (real ? 60 : 1); k++) {
      const f = (x) => {
        const y = comp(x); let Kphi = 1;
        if (real) { const r = FQ.prMix(['N2', 'H2', 'NH3'], y, T, P); Kphi = r.phi[2] / (Math.sqrt(r.phi[0]) * Math.pow(r.phi[1], 1.5)); }
        return Math.log(y[2] / (Math.sqrt(y[0]) * Math.pow(y[1], 1.5))) + Math.log(Kphi) - Math.log((K * P) / FQ.P0);
      };
      const nx = FQ.bisect(f, 1e-12, 1 - 1e-12, 1e-13);
      if (Math.abs(nx - xi) < 1e-11) { xi = nx; break; }
      xi = nx;
    }
    return { xi, y: comp(xi), K };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
