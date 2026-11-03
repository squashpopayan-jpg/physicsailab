/* ===================================================================
   69-fm-nuc.js — Física nuclear I (EM.fm.nuc): masas y energías de ligadura desde masas atómicas, radio y densidad nucleares, fórmula semiempírica
   de masas (ajuste por mínimos cuadrados), valle de estabilidad, y modelo de capas (pozo de Woods–Saxon con espín–órbita, ecuación radial
   resuelta numéricamente). Sin DOM. Energías en MeV, longitudes en fm.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const N = (fm.nuc = {});
  const ND = fm.nucdata;
  const LAf = () => EM.P.la;
  N.u_MeV = 931.49410242;                       /* u c² en MeV (CODATA 2018) */
  N.hbarc = 197.3269804;                        /* MeV fm */
  N.mnMeV = 939.56542052;                       /* m_n c² */
  N.mpMeV = 938.27208816;                       /* m_p c² */
  N.meMeV = 0.51099895;
  const table = new Map(); for (const r of ND.rows) table.set(r[0] + ',' + r[1], r);
  N.has = (Z, A) => table.has(Z + ',' + A);
  N.mass = (Z, A) => table.get(Z + ',' + A)[2];                                    /* masa atómica (u) */
  N.nuclides = (stableOnly = true) => ND.rows.filter((r) => !stableOnly || r[3] === 1).map((r) => ({ Z: r[0], A: r[1], M: r[2], stable: r[3] === 1 }));
  /* energía de ligadura total: B = [Z m(¹H) + (A − Z) m_n − M(Z, A)] c² (las masas atómicas ya incluyen los electrones) */
  N.binding = (Z, A) => (Z * ND.mH + (A - Z) * ND.mn - N.mass(Z, A)) * N.u_MeV;
  N.bindingPerA = (Z, A) => N.binding(Z, A) / A;
  N.radius = (A, r0 = 1.2) => r0 * Math.cbrt(A);                                   /* fm */
  N.density = (r0 = 1.2) => (3 * K.u) / (4 * Math.PI * Math.pow(r0 * 1e-15, 3));   /* kg/m³ */
  N.numberDensity = (r0 = 1.2) => 3 / (4 * Math.PI * Math.pow(r0, 3));              /* fm⁻³ */
  /* ---- fórmula semiempírica de masas ---- */
  N.pairSign = (Z, A) => (A % 2 ? 0 : Z % 2 ? -1 : 1);
  N.features = (Z, A) => [A, -Math.pow(A, 2 / 3), -(Z * (Z - 1)) / Math.cbrt(A), -((A - 2 * Z) ** 2) / A, N.pairSign(Z, A) / Math.sqrt(A)];   /* coeficientes a_V, a_S, a_C, a_A, a_P */
  N.semf = (Z, A, c) => { const f = N.features(Z, A); let s = 0; for (let i = 0; i < 5; i++) s += c[i] * f[i]; return s; };
  N.fit = function (rows, Amin = 20) {
    const M = LAf().zeros(5, 5), b = new Float64Array(5);
    for (const q of rows) { if (q.A < Amin) continue; const f = N.features(q.Z, q.A), B = N.binding(q.Z, q.A); for (let i = 0; i < 5; i++) { b[i] += f[i] * B; for (let j = 0; j < 5; j++) M[i][j] += f[i] * f[j]; } }
    return Array.from(LAf().solve(M, b));
  };
  N.rms = (rows, c, Amin = 20) => { let s = 0, n = 0; for (const q of rows) { if (q.A < Amin) continue; const d = N.binding(q.Z, q.A) - N.semf(q.Z, q.A, c); s += d * d; n++; } return Math.sqrt(s / n); };
  /* Z más estable para un A dado: mínimo de M(Z) = Z m_H + (A − Z) m_n − B(Z, A)/c² (energía de masa) */
  N.bestZ = (A, c) => { let best = 1, e0 = Infinity; for (let Z = 1; Z < A; Z++) { const e = Z * N.mpMeV + (A - Z) * N.mnMeV + Z * N.meMeV - N.semf(Z, A, c); if (e < e0) { e0 = e; best = Z; } } return best; };
  /* Z de la línea de estabilidad (Evans): Z = A/(1.98 + 0.0155 A^{2/3}) */
  N.zEvans = (A) => A / (1.98 + 0.0155 * Math.pow(A, 2 / 3));
  /* ---- modelo de capas: pozo de Woods–Saxon + espín–órbita ---- */
  /* V(r) = −V0 f(r) + λ (1/r)(df/dr)⟨l·s⟩ + ħ²l(l + 1)/(2m r²), f = 1/(1 + e^{(r − R)/a}); ⟨l·s⟩ = l/2 (j = l + ½) o −(l + 1)/2 (j = l − ½) */
  N.shellLevels = function (p) {
    const { V0, R, a, lambda } = p, mc2 = p.mc2 || 938.918, hb2m = (N.hbarc * N.hbarc) / (2 * mc2), h = p.h || 0.05, Rmax = p.Rmax || R + 12, Np = Math.round(Rmax / h), lmax = p.lmax || 9, out = [];
    const r = new Float64Array(Np), d = new Float64Array(Np), e = new Float64Array(Np - 1).fill(-hb2m / (h * h));
    for (let i = 0; i < Np; i++) r[i] = (i + 1) * h;
    for (let l = 0; l <= lmax; l++) for (const jj of l === 0 ? [1] : [1, -1]) {
      const ls = jj === 1 ? l / 2 : -(l + 1) / 2, j = jj === 1 ? l + 0.5 : l - 0.5;
      for (let i = 0; i < Np; i++) { const x = Math.exp((r[i] - R) / a), f = 1 / (1 + x), dfdr = -x / (a * (1 + x) ** 2); d[i] = 2 * hb2m / (h * h) - V0 * f + hb2m * l * (l + 1) / (r[i] * r[i]) + lambda * dfdr / r[i] * ls; }
      const sol = LAf().tridiagLowest(d, e, 8, { vectors: false });
      let n = 0; for (const E of sol.values) { if (E >= -0.05) break; n++; out.push({ E, n, l, j, deg: Math.round(2 * j + 1) }); }
    }
    return out.sort((x, y) => x.E - y.E);
  };
  /* acumula los números de nucleones y devuelve los huecos (gaps) mayores entre capas consecutivas */
  N.shellGaps = function (levels, ntot = 140) { let cum = 0; const out = []; for (let i = 0; i < levels.length - 1; i++) { cum += levels[i].deg; out.push({ N: cum, gap: levels[i + 1].E - levels[i].E }); } return out.filter((q) => q.N <= ntot); };
  N.LETTERS = 'spdfghik';
})(typeof window !== 'undefined' ? window : globalThis);
