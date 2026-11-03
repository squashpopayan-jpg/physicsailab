/* Cap. 23 — Radiactividad */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const D = EM.fm.dec, N = EM.fm.nuc, K = EM.qm.K, YR = D.YEAR;
  // ley exponencial y actividades
  chk(L, 'Actividad de 1 g de ²²⁶Ra (T½ = 1600 a): λN = 3.66×10¹⁰ Bq = 0.99 Ci (la definición histórica del curie)', D.activity(D.atoms(1, 226.0254), D.lambda(1600 * YR)), 3.66e10, 5e-3);
  chk(L, 'Actividad del ⁴⁰K en el cuerpo humano (140 g de potasio, 0.0117 % de ⁴⁰K, T½ = 1.248×10⁹ a): ≈ 4.3 kBq', D.activity(D.atoms(140 * 1.17e-4, 40), D.lambda(1.248e9 * YR)), 4.34e3, 5e-3);
  chk(L, 'Actividad específica del carbono moderno (¹⁴C/¹²C = 1.2×10⁻¹², T½ = 5730 a): 0.23 Bq por gramo de carbono (valor de referencia 0.226 Bq/g)', D.activity(D.atoms(1, 12.011) * 1.2e-12, D.lambda(5730 * YR)), 0.226, 3e-2);
  chk(L, 'Una desintegración por segundo de ²²⁶Ra equivale a 1 Bq: N(t) = N₀e^{−λt} cae a la mitad en t = T½', D.N(1, D.lambda(100), 100), 0.5, 1e-14);
  chk(L, 'Edad por radiocarbono: una muestra con el 25 % de la actividad inicial tiene dos semividas = 11 460 años', D.carbonAge(0.25), 11460, 1e-12);
  // estadística de Poisson / binomial (Monte Carlo)
  { const N0 = 10000, lam = Math.LN2, runs = 400, fin = []; for (let r = 0; r < runs; r++) fin.push(D.mcDecay(N0, lam, 0.5, 2, 100 + r)[2]);
    const mean = fin.reduce((a, b) => a + b, 0) / runs, va = fin.reduce((a, b) => a + (b - mean) ** 2, 0) / (runs - 1);
    chk(L, 'Monte Carlo (400 corridas, N₀ = 10⁴, t = T½): media de núcleos sin desintegrar = N₀e^{−λt} = 5000 (tolerancia estadística 4σ/√n = 0.4 %)', mean, 5000, 4 * 50 / Math.sqrt(runs) / 5000);
    chk(L, 'Monte Carlo: varianza de los núcleos supervivientes = N₀p(1 − p) = 2500 (error estadístico de la varianza ≈ 7 %: tolerancia 25 %)', va, 2500, 0.25); }
  // Bateman
  for (const k of Object.keys(ref.bate)) { const q = ref.bate[k], n = q.lam.length;
    q.ts.forEach((t, i) => chk(S, `Cadena de Bateman «${k}» (${n} miembros), t = ${t.toExponential(2)} s: población del último miembro frente a la exponencial matricial scipy.linalg.expm`, D.bateman(q.lam, 1e6, t, n), q.N[i][n - 1], 1e-6, true)); }
  { const q = ref.bate.mo99; chk(S, 'Cadena del ⁹⁹Mo: población del ⁹⁹ᵐTc a las 23 h frente a la integración con DOP853', D.bateman(q.lam.slice(0, 2), 1e6, 23 * 3600, 2), ref.bate_ode[0][1], 1e-6); }
  { const l1 = Math.LN2 / (65.94 * 3600), l2 = Math.LN2 / (6.0067 * 3600);
    chk(L, 'Generador ⁹⁹Mo → ⁹⁹ᵐTc: el ⁹⁹ᵐTc alcanza su máximo a t = ln(λ₂/λ₁)/(λ₂ − λ₁) = 22.9 h', D.batemanTmax(l1, l2) / 3600, 22.88, 2e-3);
    chk(L, 'Equilibrio transitorio: A(⁹⁹ᵐTc)/A(⁹⁹Mo) → λ₂/(λ₂ − λ₁) = 1.10', D.transientRatio(l1, l2), 1.1002, 1e-3);
    chk(L, 'En el máximo de la población del hijo, las actividades son iguales A₂ = A₁ (λ₂N₂ = λ₁N₁)', l2 * D.bateman([l1, l2], 1, D.batemanTmax(l1, l2), 2) / (l1 * D.N(1, l1, D.batemanTmax(l1, l2))), 1, 1e-9); }
  // valores Q
  const Q = [['α', () => D.Qalpha(92, 238), 4.270, '²³⁸U → ²³⁴Th', 2e-3], ['α', () => D.Qalpha(88, 226), 4.871, '²²⁶Ra → ²²²Rn', 1e-3], ['α', () => D.Qalpha(84, 210), 5.407, '²¹⁰Po → ²⁰⁶Pb', 2e-3], ['α', () => D.Qalpha(84, 212), 8.954, '²¹²Po → ²⁰⁸Pb', 1e-3], ['α', () => D.Qalpha(90, 232), 4.082, '²³²Th → ²²⁸Ra', 1e-3],
    ['β⁻', () => D.Qbeta(1, 3), 0.01859, '³H → ³He', 2e-3], ['β⁻', () => D.Qbeta(6, 14), 0.1565, '¹⁴C → ¹⁴N', 2e-3], ['β⁻', () => D.Qbeta(15, 32), 1.7107, '³²P → ³²S', 1e-3], ['β⁻', () => D.Qbeta(19, 40), 1.3111, '⁴⁰K → ⁴⁰Ca', 2e-3], ['β⁻', () => D.Qbeta(27, 60), 2.8236, '⁶⁰Co → ⁶⁰Ni', 5e-3], ['β⁻', () => D.Qbeta(55, 137), 1.1756, '¹³⁷Cs → ¹³⁷Ba', 2e-3], ['β⁻', () => D.Qbeta(53, 131), 0.9708, '¹³¹I → ¹³¹Xe', 2e-3],
    ['CE', () => D.QEC(19, 40), 1.5048, '⁴⁰K → ⁴⁰Ar', 2e-3], ['β⁺', () => D.Qbeta_plus(9, 18), 0.6335, '¹⁸F → ¹⁸O', 1e-2], ['CE', () => D.QEC(11, 22), 2.8424, '²²Na → ²²Ne', 1e-3]];
  for (const [t, f, v, nm, tol] of Q) chk(L, `Valor Q de ${nm} (${t}) calculado con masas atómicas frente al valor publicado ${v} MeV`, f(), v, tol);
  chk(L, 'Detalle del cálculo β⁺: Q(β⁺) = Q(CE) − 2m_ec² (1.022 MeV): ²²Na con Q(CE) = 2.843 MeV → 1.821 MeV', D.Qbeta_plus(11, 22), D.QEC(11, 22) - 1.02199790, 1e-9);
  // Gamow
  for (const q of ref.gamow) { const r = D.alphaHalfLife(q.Z, q.A, q.Q), R = r.R;
    chk(S, `Exponente de Gamow 2G (${q.A}, Q = ${q.Q} MeV): fórmula analítica con arccos frente a la integral del WKB (scipy.integrate.quad)`, r.G2, q.G2, 1e-8);
    chk(S, `Exponente de Gamow (${q.A}): integración numérica propia (Simpson con cambio de variable) frente a quad`, D.gamow2Gnum(2, q.Z - 2, 4, q.A - 4, q.Q, R), q.G2, 1e-6); }
  { const m = [[84, 212, 0.299e-6], [84, 210, 138.376 * 86400], [88, 226, 1600 * YR], [92, 238, 4.468e9 * YR], [90, 232, 1.405e10 * YR]];
    for (const [Z, A, T] of m) { const r = D.alphaHalfLife(Z, A, D.Qalpha(Z, A)); chk(L, `Semivida α de ${A} por la teoría de Gamow (r₀ = 1.2 fm, V₀ = 35 MeV) frente a la medida: log₁₀(T_modelo/T_medida) dentro de ±2.1 (24 órdenes de magnitud explicados)`, Math.abs(Math.log10(r.T12 / T)) < 2.1 ? 1 : 0, 1, 0); }
    const lg = m.map(([Z, A, T]) => Math.log10(D.alphaHalfLife(Z, A, D.Qalpha(Z, A)).T12)); chk(L, 'Ley de Geiger–Nuttall: el modelo reproduce el orden y el intervalo de semividas α (²¹²Po ≪ ²¹⁰Po ≪ ²²⁶Ra ≪ ²³⁸U ≪ ²³²Th): crecen monótonamente', lg.every((v, i) => i === 0 || v > lg[i - 1]) ? 1 : 0, 1, 0); }
  // espectro β
  for (const q of ref.betamean) chk(S, `Energía media del espectro β con la función de Fermi (Z_hijo = ${q.Zd}, Q = ${q.Q} MeV): suma numérica frente a scipy.integrate.quad`, D.betaMean(q.Zd, q.Q), q.T, 2e-3);
  chk(L, 'Energía media β del ³H: 5.69 keV (⟨T⟩/Q = 0.31; literatura 5.69 keV)', D.betaMean(2, 0.018591) * 1e3, 5.69, 2e-3);
  chk(L, 'Energía media β del ¹⁴C: 49.5 keV (literatura 49.5 keV)', D.betaMean(7, 0.1565) * 1e3, 49.5, 3e-3);
  chk(L, 'Energía media β del ³²P: 695 keV (literatura 695 keV)', D.betaMean(16, 1.7107) * 1e3, 695, 5e-3);
  chk(L, 'Sin función de Fermi (Z = 0) la media sería ≈ Q/3 por el factor de fase: ⟨T⟩/Q para ³H sin Coulomb = 0.33', D.betaMean(0, 0.018591) / 0.018591, 0.334, 2e-2);
  // datación K–Ar
  chk(L, 'K–Ar: ⁴⁰Ar/⁴⁰K = 0.0107 ⇒ t = (1/λ)ln(1 + Ar/(0.1072 K)) = 1.248×10⁹/ln2 × ln(1.0998) = 1.71×10⁸ años', D.KAr(0.0107) / 1e6, 171.3, 1e-3);
};
