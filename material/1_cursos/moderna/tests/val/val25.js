/* Cap. 25 — Partículas elementales y Modelo Estándar */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const P = EM.fm.pa;
  // modelo de quarks frente al PDG (paquete particle)
  for (const k of Object.keys(ref.pdgq)) { const r = P.get(+k); chk(S, `Carga de ${r.name} (${r.quarks}) como suma de las cargas de los quarks (⅔, −⅓) frente a la carga del PDG`, P.chargeFromQuarks(r.quarks), ref.pdgq[k], 0, false); }
  chk(L, 'Número bariónico: protón, neutrón, Λ, Σ, Ξ, Ω⁻, Δ tienen B = 1 (tres quarks); π y K tienen B = 0', [2212, 2112, 3122, 3222, 3312, 3334, 2224].every((i) => P.baryonFromQuarks(P.get(i).quarks) === 3) && [211, 321].every((i) => P.baryonFromQuarks(P.get(i).quarks) === 0) ? 1 : 0, 1, 0);
  chk(L, 'Extrañeza S = −(n_s − n_s̄): Λ, Σ⁺ → −1; Ξ⁻ → −2; Ω⁻ → −3; K⁺ (u s̄) → +1; p, π⁺ → 0 (suma ponderada de comprobación)', [3122, 3222, 3312, 3334, 321, 2212, 211].reduce((s, i, k) => s + P.strangeness(P.get(i).quarks) * (k + 1), 0), -1 * 1 - 1 * 2 - 2 * 3 - 3 * 4 + 1 * 5, 0, false);
  chk(L, 'El Δ⁺⁺ (uuu) y el Ω⁻ (sss) existen gracias al color: tres quarks idénticos con espines paralelos; ambos tienen J = 3/2', P.get(2224).J + P.get(3334).J, 3, 0, false);
  // leyes de conservación
  const ok = [['n → p + e⁻ + ν̄ₑ', ['n'], ['p', 'e-', '~nu_e'], false], ['π⁺ → μ⁺ + νμ', ['pi+'], ['mu+', 'nu_mu'], false], ['μ⁻ → e⁻ + ν̄ₑ + νμ', ['mu-'], ['e-', '~nu_e', 'nu_mu'], false], ['K⁺ → μ⁺ + νμ (débil, ΔS ≠ 0)', ['K+'], ['mu+', 'nu_mu'], false], ['Λ → p + π⁻ (débil)', ['Lambda'], ['p', 'pi-'], false], ['π⁻ + p → K⁰ + Λ (fuerte)', ['pi-', 'p'], ['K0', 'Lambda'], true], ['Σ⁰ → Λ + γ', ['Sigma0'], ['Lambda', 'gamma'], true], ['Ω⁻ → Λ + K⁻ (débil)', ['Omega-'], ['Lambda', 'K-'], false]];
  for (const [nm, a, b, strong] of ok) { const r = P.check(a, b); chk(L, `Reacción permitida ${nm}: se conservan carga, B y los números leptónicos${strong ? ' y la extrañeza' : ''}`, (strong ? r.strongAllowed : r.weakAllowed) ? 1 : 0, 1, 0); }
  const bad = [['p → e⁺ + π⁰ (número bariónico)', ['p'], ['e+', 'pi0'], 'número bariónico'], ['μ⁻ → e⁻ + γ (sabor leptónico)', ['mu-'], ['e-', 'gamma'], 'L_μ'], ['n → p + e⁻ (sin neutrino)', ['n'], ['p', 'e-'], 'L_e'], ['n + p → p + Λ (extrañeza)', ['n', 'p'], ['p', 'Lambda'], 'extrañeza'], ['p + p → p + Λ (carga)', ['p', 'p'], ['p', 'Lambda'], 'carga'], ['e⁻ → ν_e + γ (carga)', ['e-'], ['nu_e', 'gamma'], 'carga']];
  for (const [nm, a, b, why] of bad) { const r = P.check(a, b); chk(L, `Reacción prohibida ${nm}: viola ${why}`, r.violated.includes(why) ? 1 : 0, 1, 0); }
  // cinemática
  for (const q of ref.p2) chk(S, `Desintegración de dos cuerpos M = ${q.M.toFixed(2)} MeV → ${q.m1.toFixed(2)} + ${q.m2.toFixed(2)} MeV: momento p* frente a la conservación de energía resuelta con scipy.optimize.fsolve`, P.pStar(q.M, q.m1, q.m2), q.p, 1e-9);
  chk(L, 'π⁺ → μ⁺ν: momento del muón 29.79 MeV/c (valor del PDG)', P.pStar(139.57039, 105.6583755, 0), 29.79, 2e-4); chk(L, 'π⁺ → μ⁺ν: T_μ = 4.12 MeV', P.T1(139.57039, 105.6583755, 0), 4.12, 1e-3);
  chk(L, 'K⁺ → μ⁺ν: p = 235.5 MeV/c (PDG)', P.pStar(493.677, 105.6583755, 0), 235.5, 1e-3); chk(L, 'Z → e⁺e⁻: p = M_Z/2 = 45.594 GeV/c', P.pStar(91187.6, 0.511, 0.511) / 1000, 45.594, 1e-4);
  // interacción débil
  chk(L, 'Vida media del muón τ = 192π³ħ/(G_F²m_μ⁵) = 2.187 µs frente a la medida 2.196981 µs (0.44 % de diferencia: correcciones radiativas)', P.muonLifetime(P.GF, 0.1056583755) * 1e6, 2.196981, 6e-3);
  chk(L, 'Constante de Fermi G_F = 1.1663788×10⁻⁵ GeV⁻² (PDG)', P.GF * 1e5, 1.1663788, 1e-7);
  chk(L, 'Supresión de helicidad: Γ(π→eν)/Γ(π→μν) = (mₑ/m_μ)²[(m_π² − mₑ²)/(m_π² − m_μ²)]² = 1.283×10⁻⁴ (nivel árbol) frente a 1.2327×10⁻⁴ medido (−3.9 % por correcciones radiativas)', P.pionRatio(139.57039, 0.51099895, 105.6583755), 1.2327e-4, 5e-2);
  chk(L, 'Anchura Z → νν̄ (nivel árbol, por familia) = G_F M_Z³/(12√2π) = 165.9 MeV frente a 167.2 MeV del Modelo Estándar con correcciones', P.GammaZnunu(P.GF, 91.1876) * 1e3, 167.2, 1e-2);
  chk(L, 'Número de neutrinos ligeros N_ν = (Γ_Z − Γ_had − 3Γ_ℓℓ)/Γ_νν(SM) = (2495.2 − 1744.4 − 3×83.984)/167.2 = 2.984 (tres familias)', (2495.2 - 1744.4 - 3 * 83.984) / 167.2, 2.984, 2e-3);
  chk(L, 'Masa de W en el nivel árbol: M_W = (πα/√2G_F)^{1/2}/sen θ_W = 77.5 GeV (sen²θ_W = 0.2312) frente a 80.36 GeV medidos (3.5 % de diferencia por correcciones radiativas)', P.MWtree(P.GF, 0.2312), 80.36, 4e-2);
  chk(L, 'Constante (πα/√2G_F)^{1/2} = 37.28 GeV', P.MWtree(P.GF, 1), 37.28, 1e-3);
  // línea del Z
  chk(L, 'Sección eficaz hadrónica en el polo del Z: 12πΓ_eeΓ_had/(M_Z²Γ_Z²) = 41.53 nb frente a σ⁰_had = 41.48 nb medida', P.sigmaPeak(91.1876, 2.4955, 0.083985, 1.7444), 41.48, 2e-3);
  ref.zline.forEach((q) => { let pk = 0; for (let x = 91.0; x <= 91.4; x += 0.0001) { const v = P.sigmaZ(x, 91.1876, q.GZ, 0.083985, 1.7444); if (v > pk) pk = v; }
    chk(S, `Línea de forma del Z (Γ_Z = ${q.GZ.toFixed(4)} GeV): máximo de σ_had(√s) frente a la búsqueda numérica`, pk, q.peak, 1e-4);
    chk(L, `Anchura a media altura de la resonancia (Γ_Z = ${q.GZ.toFixed(4)} GeV) coincide con Γ_Z a 10⁻³`, q.fwhm, q.GZ, 1e-3); });
  chk(L, 'Cada familia adicional de neutrinos ligeros aumenta Γ_Z en 166 MeV y reduce el máximo de σ_had en 12 %: con N_ν = 4, σ⁰ = 36.5 nb frente a 41.5 nb', ref.zline[1].peak / ref.zline[0].peak, 0.879, 2e-3);
  // oscilaciones
  for (const q of ref.osc) chk(S, `Oscilación de dos sabores (θ = ${q.th}, Δm² = ${q.dm2} eV², L = ${q.L} km, E = ${q.E} GeV): P = sen²2θ sen²(1.267 Δm² L/E) frente a la evolución exacta con la exponencial matricial (scipy.linalg.expm)`, P.osc2(q.th, q.dm2, q.L, q.E), q.P, 1e-5);
  chk(L, 'Primer máximo de las oscilaciones atmosféricas (Δm² = 2.5×10⁻³ eV², E = 0.6 GeV): L = πE/(2·1.267 Δm²) = 297.6 km (T2K: 295 km)', P.oscLength(2.5e-3, 0.6), 297.6, 1e-3);
  // CKM, PMNS
  { const U = P.mixing(Math.asin(0.2250), Math.asin(0.04182), Math.asin(0.003732), 1.144), A = P.absMatrix(U);
    chk(L, 'CKM: la matriz de la parametrización estándar es unitaria a 10⁻¹⁵ (comprobada con NumPy en ref: máx|V†V − 1| ≈ 2×10⁻¹⁶)', P.unitarityDev(U) < 1e-14 && ref.ckm.dev < 1e-14 ? 1 : 0, 1, 0);
    const ex = [[0.97435, 0.22500, 0.003732], [0.22486, 0.97349, 0.04183], [0.00858, 0.04111, 0.999118]], nm = [['ud', 'us', 'ub'], ['cd', 'cs', 'cb'], ['td', 'ts', 'tb']];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) chk(L, `Elemento |V_${nm[i][j]}| de la matriz CKM frente al ajuste global del PDG: ${ex[i][j]}`, A[i][j], ex[i][j], 3e-3); }
  chk(L, 'PMNS (θ₁₂ = 33.4°, θ₂₃ = 49°, θ₁₃ = 8.6°, δ = −1.2 rad): unitaria a 10⁻¹⁵', P.unitarityDev(P.mixing(33.4 * Math.PI / 180, 49 * Math.PI / 180, 8.6 * Math.PI / 180, -1.2)) < 1e-14 ? 1 : 0, 1, 0);
  // Gell-Mann–Okubo y decuplete
  { const g = P.gmo(); chk(S, 'GMO: (m_N + m_Ξ)/2 con las masas del PDG frente al cálculo de referencia', g.left, ref.gmo.left, 1e-12); chk(S, 'GMO: (3m_Λ + m_Σ)/4', g.right, ref.gmo.right, 1e-12);
    chk(L, 'Gell-Mann–Okubo del octete bariónico: (m_N + m_Ξ)/2 = 1128.6 MeV frente a (3m_Λ + m_Σ)/4 = 1135.1 MeV: acuerdo del 0.6 %', g.left, g.right, 8e-3); }
  { const m = P.decupletMasses(); chk(L, 'Decuplete: espaciado casi constante entre Δ, Σ*, Ξ* y Ω⁻ (152.6, 148.8 y 139.1 MeV)', (m[1] - m[0]) / (m[2] - m[1]), 1.0255, 2e-2);
    chk(L, 'Predicción del Ω⁻ por espaciado igual: m_Ξ* + (m_Ξ* − m_Σ*) = 1682 MeV (Gell-Mann, 1962: 1685 MeV) frente a la medida 1672.45 MeV (0.6 %)', m[2] + (m[2] - m[1]), m[3], 1e-2); }
  chk(L, 'Masas del PDG (paquete particle): bosón de Higgs 125.13 GeV', P.get(25).m / 1000, 125.13, 1e-4); chk(L, 'Masa del bosón W: 80.362 GeV', P.get(24).m / 1000, 80.362, 1e-4); chk(L, 'Masa del Z: 91.188 GeV', P.get(23).m / 1000, 91.188, 1e-4); chk(L, 'Masa del quark top: 172.6 GeV', P.get(6).m / 1000, 172.6, 1e-4);
};
