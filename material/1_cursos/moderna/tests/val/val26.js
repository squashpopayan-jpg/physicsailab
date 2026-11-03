/* Cap. 26 — Aceleradores, interacciones y detectores */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const A = EM.fm.acc, K = EM.qm.K;
  // ciclotrón y sincrotrón
  for (const q of ref.cyc) chk(S, `Ciclotrón relativista (protón, B = 1.5 T, γ = ${q.gamma}): periodo 2πγm/(eB) frente a la integración de la fuerza de Lorentz relativista (scipy DOP853)`, 1 / A.cyclotronFreq(1.5, 938.27208816, 1, q.gamma), q.T, 1e-6);
  chk(L, 'LHC: p = 0.2998·B·ρ = 0.2998 × 8.33 T × 2803.95 m = 7.00 TeV/c', A.pFromB(8.33, 2803.95), 7000, 5e-4);
  chk(L, 'LHC: frecuencia de revolución c/L con L = 26658.883 m: 11245.5 Hz', A.revFreq(26658.883), 11245.5, 1e-6);
  chk(L, 'LHC: radiación de sincrotrón de un protón de 7 TeV: 6.7 keV por vuelta (ρ = 2803.95 m)', A.syncLoss(7000, 0.93827208816, 2803.95) * 1e6, 6.7, 1e-2);
  chk(L, 'LEP: radiación de sincrotrón de un electrón de 100 GeV (ρ = 3026 m): 2.92 GeV por vuelta; a 104.5 GeV, 3.49 GeV', A.syncLoss(104.5, 0.00051099895, 3026), 3.486, 2e-3);
  chk(L, 'Cociente de pérdidas protón/electrón a la misma energía y radio: (m_e/m_p)⁴ = 8.8×10⁻¹⁴', A.syncLoss(100, 0.93827208816, 3026) / A.syncLoss(100, 0.00051099895, 3026), Math.pow(0.00051099895 / 0.93827208816, 4), 3e-4);
  // cinemática
  chk(S, 'Colisionador de 6.8 + 6.8 TeV: s = 4E₁E₂ = (13.6 TeV)² frente al invariante del cuadrivector total con NumPy', A.sqrtsCollider(6800, 6800) ** 2, ref.inv.coll, 1e-3);
  chk(S, 'Blanco fijo: la energía de un protón que daría √s = 13.6 TeV es (s − 2m²)/2m = 9.86×10⁷ GeV; el invariante numérico del cuadrivector lo confirma', A.sqrtsFixed(9.8564e7, 0.938272, 0.938272) ** 2, ref.inv.fix, 1e-6);
  chk(L, 'Energía de un rayo cósmico (blanco fijo) equivalente a las colisiones del LHC a 13.6 TeV: 9.86×10⁷ GeV = 98.6 PeV', A.fixedEnergyForSqrts(13600, 0.938272, 0.938272), 9.8564e7, 1e-4);
  chk(S, 'Umbral de producción de antiprotones p + p → p + p + p + p̄ en blanco fijo: T_th = 6m_p = 5.63 GeV frente a brentq sobre el invariante', A.thresholdKinetic(0.938272, 0.938272, 4 * 0.938272), ref.inv.thr, 1e-9);
  chk(L, 'Bevatrón (1955): el umbral de producción de antiprotones, T_th = 6m_pc² = 5.63 GeV, motivó un acelerador de 6.2 GeV', A.thresholdKinetic(0.938272, 0.938272, 4 * 0.938272), 5.63, 1e-3);
  // luminosidad
  for (const q of ref.lumi) chk(S, `Luminosidad de dos haces gaussianos (N = ${q.N}, n_b = ${q.nb}, σ = ${(q.sx * 1e6).toFixed(1)} × ${(q.sy * 1e6).toFixed(1)} µm): L = N²f n_b/(4πσ_xσ_y) frente a la integral del solapamiento (scipy.integrate.dblquad)`, A.luminosity(q.N, q.N, q.f, q.nb, q.sx, q.sy), q.L, 1e-6);
  chk(L, 'LHC: con 1.15×10¹¹ protones por paquete, 2808 paquetes y σ = 16.6 µm, L = 1.2×10³⁴ cm⁻²s⁻¹ (valor de diseño: 10³⁴)', A.luminosity(1.15e11, 1.15e11, 11245.5, 2808, 16.6e-6, 16.6e-6), 1.2e34, 1e-2);
  chk(L, 'Ritmo de producción de bosones de Higgs: σ(pp → H) ≈ 55 pb a 13 TeV con L = 2×10³⁴ cm⁻²s⁻¹: 1.1 por segundo', A.eventRate(55, 2e34), 1.1, 1e-9);
  // Bethe–Bloch
  for (const q of ref.range) chk(S, `Rango CSDA de un protón de ${q.T} MeV en agua (Z/A = 0.5551, I = 75 eV): integral de 1/S(T) con Simpson frente a scipy.integrate.quad`, A.range(q.T, 938.272, 0.5551, 75), q.R, 1e-6);
  const nist = [[10, 0.1230], [50, 2.227], [100, 7.718], [150, 15.77], [200, 25.96]];
  for (const [T, R] of nist) chk(L, `Rango de un protón de ${T} MeV en agua: ${R} g/cm² (NIST PSTAR)`, A.range(T, 938.272, 0.5551, 75), R, T === 10 ? 2e-2 : 4e-3);
  chk(L, 'Poder de frenado de un protón de 100 MeV en agua: 7.289 MeV cm²/g (NIST PSTAR)', A.bethe(100, 938.272, 0.5551, 75), 7.289, 1e-3);
  { const mi = (ZA, I) => { let best = 1e9; for (let bg = 2; bg < 6; bg += 0.01) { const g = Math.sqrt(1 + bg * bg), T = (g - 1) * 105.6583755, v = A.bethe(T, 105.6583755, ZA, I); if (v < best) best = v; } return best; };
    for (const [nm, ZA, I, v] of [['agua', 0.5551, 75, 1.992], ['Si', 0.4985, 173, 1.664], ['Fe', 0.4656, 286, 1.451], ['Cu', 0.4564, 322, 1.403], ['Pb', 0.3959, 823, 1.123], ['Al', 0.4818, 166, 1.615]]) chk(L, `Ionización mínima de un muón en ${nm}: ${v} MeV cm²/g (PDG, con corrección de densidad); Bethe–Bloch sin ella da un 1–4 % más`, mi(ZA, I), v, 4.5e-2); }
  // e+ e- → μ+ μ-
  for (const q of ref.mumu) chk(S, `σ(e⁺e⁻ → μ⁺μ⁻) a √s = ${q.rs} GeV: 4πα²/3s frente a la integral de dσ/dΩ = α²(1 + cos²θ)/4s en todos los ángulos (scipy.integrate.quad)`, A.sigmaMuMu(q.rs), q.nb, 1e-9);
  chk(L, 'σ(e⁺e⁻ → μ⁺μ⁻) = 86.8 nb/s[GeV²]: a √s = 10 GeV, 0.869 nb', A.sigmaMuMu(10), 0.8685, 1e-3);
  chk(L, 'R por debajo del charm (u, d, s): 3(4/9 + 1/9 + 1/9) = 2', A.Rratio(2), 2, 1e-12); chk(L, 'R con el charm (√s ≈ 4 GeV): 10/3', A.Rratio(4), 10 / 3, 1e-12); chk(L, 'R con el b (√s ≈ 40 GeV): 11/3', A.Rratio(40), 11 / 3, 1e-12);
  // α(Q)
  for (const q of ref.arun) chk(S, `Constante de estructura fina α(${q.Q} GeV) con un lazo: solución cerrada con umbrales frente a la integración de la ecuación del grupo de renormalización (scipy.integrate.solve_ivp)`, A.alphaRun(q.Q), q.a, 1e-9);
  chk(L, 'α(M_Z): 1/128.4 con un lazo y masas constituyentes de los quarks ligeros (valor del PDG: 1/127.95, 0.4 % de diferencia; el estudio de los lazos hadrónicos usa datos de e⁺e⁻)', 1 / A.alphaRun(91.1876), 127.95, 5e-3);
  chk(L, 'α crece con la energía: α(M_Z)/α(0) = 1.067 (la carga efectiva aumenta al acercarse a la carga desnuda)', A.alphaRun(91.1876) * 137.035999084, 1.0674, 3e-3);
};
