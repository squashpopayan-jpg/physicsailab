/* Cap. 8 — Fotones: Compton, Klein–Nishina, rayos X, pares */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const P = EM.fm.ph, O = EM.qm.orig, K = EM.qm.K;
  for (const [k, v] of Object.entries(ref.compton_KE)) { const [l, t] = k.split('_'); chk(S, `Energía cinética Compton (λ = ${(+l * 1e12).toPrecision(5)} pm, θ = ${t}°) frente a numpy`, O.comptonKE(+l, +t * Math.PI / 180), v, 1e-8); }
  chk(S, 'Longitud de onda Compton h/(m_e c) frente a scipy.constants', O.comptonWavelength(), ref.compton_lambda, 1e-9);
  chk(S, 'Pendiente de Millikan h/e = 4.1357×10⁻¹⁵ V·s frente a scipy.constants', K.h / K.e, ref.Millikan, 1e-8);
  chk(S, 'Radio clásico del electrón r_e = αħ/(m_e c) frente a scipy.constants', P.re, ref.re, 1e-8);
  chk(S, 'Sección de Thomson 8πr_e²/3 frente a scipy.constants', P.thomson(), ref.thomson, 1e-8);
  chk(S, 'm_e c² = 510.999 keV frente a scipy.constants', P.mc2keV, ref.mc2keV, 1e-9);
  for (const [E, v] of Object.entries(ref.kn_total)) chk(S, `Klein–Nishina total (E = ${E} keV): forma cerrada frente a la integración numérica de dσ/dΩ (scipy.quad)`, P.knTotal(+E / P.mc2keV), v, 1e-9);
  for (const d of ref.kn_diff) chk(S, `Klein–Nishina diferencial (E = ${d.E} keV, θ = ${d.th.toFixed(2)}) frente al cálculo independiente`, P.kn(d.E / P.mc2keV, d.th), d.d, 1e-12);
  chk(L, 'Límite de Thomson: σ_KN(E → 0) = σ_T (E = 1 eV)', P.knTotal(1e-3 / P.mc2keV / 1e3), P.thomson(), 1e-5);
  chk(L, 'La sección total decrece con la energía: σ_KN(1 MeV) < σ_KN(100 keV) < σ_T', P.knTotal(1000 / P.mc2keV) < P.knTotal(100 / P.mc2keV) && P.knTotal(100 / P.mc2keV) < P.thomson() ? 1 : 0, 1, 0);
  for (const r of ref.mass_att) if (r.mu !== null) chk(S, `Coeficiente másico Compton de ${r.el} a ${(r.E / 1e3).toFixed(0)} keV: N_A(Z/A)σ_KN frente al incoherente de Elam et al. (xraydb; ligaduras ignoradas)`, P.massAtt(r.E / 1e3 / P.mc2keV, r.ZA), r.mu, 3e-2);
  for (const r of ref.edge) { chk(S, `Borde Compton (E = ${r.E} keV): T_máx = 2E²/(mc² + 2E) frente a la maximización numérica sobre el ángulo`, P.comptonEdge(r.E), r.T, 1e-7); chk(S, `Fotón retrodispersado (E = ${r.E} keV): E/(1 + 2E/mc²) frente a la maximización numérica`, P.backscatter(r.E), r.Eb, 1e-7); }
  chk(L, 'Cs-137 (661.657 keV): borde Compton 477.3 keV y retrodispersión 184.3 keV', P.comptonEdge(661.657), 477.34, 1e-3);
  chk(L, 'Duane–Hunt: λ_min = hc/(eV) = 1.2398/V[kV] nm (V = 35 kV: 0.03542 nm)', P.lambdaMin(35e3) * 1e9, 0.0354240, 1e-5);
  for (const r of ref.kramers_peak) chk(S, `Espectro de Kramers (V = ${r.V / 1e3} kV): el máximo está en λ = 2λ_min (maximización numérica)`, 2, r.peak_ratio, 1e-6);
  for (const [s, d] of Object.entries(ref.xray)) { const L_ = P.KLINES[s]; chk(S, `Tabla de líneas K de ${s}: Kα1 frente a xraydb (Elam, Ravel y Sieber 2002)`, L_[1], d.Ka, 2e-4); chk(S, `Tabla de líneas K de ${s}: borde K frente a xraydb`, L_[3], d.edge, 2e-4); chk(L, `Moseley: Kα ≈ ¾Ry(Z−1)² reproduce Kα1 de ${s} (Z = ${d.Z}) con error < ${s === 'W' ? '9' : s === 'Ag' ? '3' : '2.5'} % (la fórmula pierde precisión para Z grande: apantallamiento y efectos relativistas)`, P.moseleyKa(d.Z), d.Ka, s === 'W' ? 9e-2 : s === 'Ag' ? 3e-2 : 2.5e-2); }
  for (const r of ref.xray_all_Z) chk(L, `Moseley: Kα ≈ ¾Ry(Z−1)² reproduce Kα1 de ${r.s} (Z = ${r.Z}) con error < 10 %`, P.moseleyKa(r.Z), r.Ka, 1e-1);
  chk(S, 'Umbral de producción de pares en el campo de un protón: 2mc²(1 + m/M) = 1022.4 keV frente a la búsqueda numérica de √s = M + 2m', 2 * P.mc2keV * (1 + P.mc2keV / (938272.08816)), ref.pair.proton, 1e-9);
  chk(S, 'Umbral de producción de pares en el campo de un electrón (triplete): 4mc² = 2044 keV frente a la búsqueda numérica', P.pairThresholdElectron(), ref.pair.electron, 1e-9);
};
