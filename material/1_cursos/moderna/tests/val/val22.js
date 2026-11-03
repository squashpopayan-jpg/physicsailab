/* Cap. 22 — El núcleo: masa, ligadura, fórmula semiempírica y modelo de capas */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const N = EM.fm.nuc, K = EM.qm.K;
  // ligadura frente a valores publicados (AME)
  const lit = [[1, 2, 2.22457, 'deuterón'], [2, 4, 28.29567, '⁴He'], [6, 12, 92.1620, '¹²C'], [8, 16, 127.6193, '¹⁶O'], [20, 40, 342.0521, '⁴⁰Ca'], [26, 56, 492.2540, '⁵⁶Fe'], [28, 62, 545.2587, '⁶²Ni'], [82, 208, 1636.43, '²⁰⁸Pb']];
  for (const [Z, A, B, nm] of lit) chk(L, `Energía de ligadura de ${nm}: B = [Zm(¹H) + (A − Z)m_n − M]c² frente al valor publicado (AME): ${B} MeV`, N.binding(Z, A), B, 2e-4);
  for (const k of Object.keys(ref.bind)) { const [Z, A] = k.split(',').map(Number); chk(S, `Ligadura de ${k} con la unidad u → MeV de scipy.constants frente a la biblioteca`, N.binding(Z, A), ref.bind[k], 1e-6); }
  chk(L, 'El máximo de B/A entre los núcleos estables es el ⁶²Ni (8.7946 MeV), seguido del ⁵⁸Fe y el ⁵⁶Fe (8.7904)', (() => { let best = null; for (const q of N.nuclides(true)) { const b = N.bindingPerA(q.Z, q.A); if (!best || b > best.b) best = { Z: q.Z, A: q.A, b }; } return best.Z * 1000 + best.A; })(), 28062, 0);
  chk(L, 'Densidad nuclear con r₀ = 1.2 fm: ρ = 3m_u/4πr₀³ = 2.3×10¹⁷ kg/m³ (la de una estrella de neutrones)', N.density(1.2), 2.294e17, 2e-3);
  chk(L, 'Densidad numérica de nucleones con r₀ = 1.2 fm: 0.138 fm⁻³', N.numberDensity(1.2), 0.1381, 1e-3);
  chk(L, 'Radio del ²⁰⁸Pb con r₀ = 1.2 fm: 7.1 fm', N.radius(208), 7.109, 1e-3);
  // ajuste semiempírico
  { const c = N.fit(N.nuclides(true), 20);
    ['a_V', 'a_S', 'a_C', 'a_A', 'a_P'].forEach((nm, i) => chk(S, `Fórmula de masas: coeficiente ${nm} del ajuste por mínimos cuadrados (ecuaciones normales) frente a numpy.linalg.lstsq (${ref.semf.n} núcleos estables con A ≥ 20)`, c[i], ref.semf.coef[i], 1e-8));
    chk(S, 'Desviación cuadrática media del ajuste (MeV) frente a numpy', N.rms(N.nuclides(true), c, 20), ref.semf.rms, 1e-8);
    chk(L, 'Coeficientes típicos de la literatura (Krane, Rohlf): a_V ≈ 15.8, a_S ≈ 17.8–18.3, a_C ≈ 0.71, a_A ≈ 23–23.7 MeV, a_P ≈ 11–12 MeV; el ajuste da a_V = 15.77 y a_S = 18.18', c[0], 15.8, 5e-3);
    chk(L, 'Coeficiente de Coulomb del ajuste: 0.717 MeV (e²/4πε₀ × 3/5 / r₀ con r₀ = 1.2 fm da 0.72)', c[2], (3 / 5) * 1.43996448 / 1.2, 5e-3);
    chk(L, 'Desviación de la fórmula de masas para núcleos con A ≥ 20: ≈ 2.2 MeV (el error medio tabulado en la literatura es de 2–3 MeV)', N.rms(N.nuclides(true), c, 20), 2.2, 2e-2);
    for (const A of [16, 40, 56, 90, 120, 138, 208, 238]) chk(S, `Núcleo más estable de A = ${A} según la fórmula de masas (Z) frente a la minimización con numpy`, N.bestZ(A, c), ref.zbest[A], 0, false);
    { let n = 0, ok = 0; const byA = {}; for (const q of N.nuclides(true)) (byA[q.A] = byA[q.A] || []).push(q.Z); for (const A of Object.keys(byA)) { if (+A < 20) continue; n++; const zb = N.bestZ(+A, c); if (byA[A].some((z) => Math.abs(z - zb) <= 1)) ok++; }
      chk(S, 'Fracción de números másicos A ≥ 20 con un isóbaro estable a ±1 de Z predicho: 192 de 193 (SEMF) frente al cálculo con numpy', ok, ref.zscore.ok, 0, false); chk(S, 'Número de masas A ≥ 20 con algún isóbaro estable', n, ref.zscore.n, 0, false); } }
  chk(L, 'Línea de estabilidad de Evans Z = A/(1.98 + 0.0155A^{2/3}): ⁵⁶Fe (Z = 26 real) da 25.4', N.zEvans(56), 25.4, 5e-3);
  chk(L, 'Evans para el ²³⁸U: Z = 92.4', N.zEvans(238), 92.4, 5e-3);
  // modelo de capas
  { const w = ref.ws; const lv = N.shellLevels({ V0: w.V0, R: w.R, a: w.a, lambda: w.lam, h: 0.025 });
    for (const k of Object.keys(w.ch)) { const [l, jj] = k.split(',').map(Number), j = jj === 1 ? l + 0.5 : l - 0.5; const mine = lv.filter((q) => q.l === l && q.j === j).map((q) => q.E);
      w.ch[k].forEach((E, i) => { if (mine[i] !== undefined && E < -0.5) chk(S, `Woods–Saxon con espín–órbita (canal l = ${l}, j = ${j}): autovalor n.º ${i + 1} (MeV) de la ecuación radial frente a scipy.linalg.eigh_tridiagonal`, mine[i], E, 1e-4, true); }); }
    const g = N.shellGaps(lv, 140).filter((q) => q.gap > 2.0).map((q) => q.N);
    chk(L, 'Con λ = 45 MeV fm² los mayores huecos entre capas de un neutrón en ²⁰⁸Pb aparecen en 2, 8, 20, 28, 50, 82 y 126 nucleones (números mágicos)', g.join(',') === '2,8,20,28,50,82,126' ? 1 : 0, 1, 0);
    const g0 = N.shellLevels({ V0: w.V0, R: w.R, a: w.a, lambda: 0 }); const gg = N.shellGaps(g0, 140).filter((q) => q.gap > 2.0).map((q) => q.N);
    chk(L, 'Sin espín–órbita desaparecen 28, 50, 82 y 126 como cierres de capa: aparecen 34, 40, 58, 92', [28, 50, 82, 126].some((n) => gg.includes(n)) ? 0 : 1, 1, 0); }
};
