/* Cap. 15 — Espín, estructura fina y resonancia magnética */
module.exports = function ({ chk, ref, EM, S, Y, L }) {
  const P = EM.fm.spin, K = EM.qm.K, c = ref.consts;
  chk(S, 'Magnetón de Bohr frente a scipy.constants', P.muB, c.muB, 1e-8); chk(S, 'μ_B en eV/T = 5.7884×10⁻⁵', P.muBeVT, c.muB_eVT, 1e-8); chk(S, 'μ_B/h = 13.996 GHz/T', P.larmorHz(1), c.muB_Hz, 1e-8); chk(S, 'Magnetón nuclear frente a scipy.constants', P.muN, c.muN, 1e-8);
  chk(L, 'Factor de Landé del ²S½ (L = 0, J = ½): g = 2', P.landeG(0.5, 0, 0.5), 2, 1e-14); chk(L, 'Factor de Landé del ²P½: g = 2/3', P.landeG(0.5, 1, 0.5), 2 / 3, 1e-14); chk(L, 'Factor de Landé del ²P3/2: g = 4/3', P.landeG(1.5, 1, 0.5), 4 / 3, 1e-14);
  chk(L, 'Factor de Landé del ³P₂ (L = 1, S = 1, J = 2): g = 3/2', P.landeG(2, 1, 1), 1.5, 1e-14); chk(L, 'Factor de Landé del ¹P₁ (singlete, S = 0): g = 1 (efecto Zeeman normal)', P.landeG(1, 1, 0), 1, 1e-14);
  for (const r of ref.p6) {
    const E = P.pLevels(r.A, r.B).map((q) => q.E);
    E.forEach((v, i) => chk(S, `Estado p con espín–órbita (A = ${(r.A / K.e * 1e3).toFixed(3)} meV) en B = ${r.B} T: energía n.º ${i + 1}, bloques analíticos frente a la diagonalización del hamiltoniano 6×6 (numpy.linalg.eigvalsh)`, v, r.E[i], 1e-7, Math.abs(r.E[i]) > 1e-26));
  }
  { const A = 1.4213e-3 * K.e, E0 = P.pLevels(A, 0), dB = 1e-4, E1 = P.pLevels(A, dB);
    const sl = E1.map((q, i) => (q.E - E0[i].E) / (P.muB * dB)).sort((a, b) => a - b);
    sl.forEach((v, i) => chk(S, `Pendiente Zeeman a campo débil n.º ${i + 1} (g_J m_J) frente a la diferencia finita del hamiltoniano numérico`, v, ref.weak_slopes[i], 1e-9, true));
    chk(L, 'Pendientes a campo débil: {−2, −2/3, −1/3, +1/3, +2/3, +2}... = g_J m_J (4/3·(±3/2, ±1/2) y 2/3·(±1/2))', sl.reduce((a, b) => a + Math.abs(b), 0), 2 * (2 + 2 / 3 + 1 / 3), 1e-6); }
  chk(L, 'A B = 0 la separación entre J = 3/2 y J = 1/2 es 3A/2', P.pLevels(1e-22, 0)[5].E - P.pLevels(1e-22, 0)[0].E, 1.5e-22, 1e-9);
  chk(L, 'Estado extremo m_j = 3/2 (m_l = 1, m_s = ½): E = A/2 + 2μ_B B exactamente, a cualquier campo (B = 400 T)', P.pLevels(1.4213e-3 * K.e, 400).pop().E, 1.4213e-3 * K.e / 2 + 2 * P.muB * 400, 1e-12);
  for (const d of ref.dirac) chk(S, `Energía de Dirac exacta (n = ${d.n}, j = ${d.j}) en mc² frente a mpmath (30 dígitos)`, P.diracExact(d.n, d.j), d.E, 1e-15);
  chk(L, 'Estructura fina de 2p: E(2p3/2) − E(2p1/2) = α²Ry/16 = 4.5329×10⁻⁵ eV (10.969 GHz) por la fórmula de orden α²', P.fineEV(2, 1.5) - P.fineEV(2, 0.5), P.fineSplit2p(), 1e-10) ;
  { const d = (P.diracExact(2, 1.5) - P.diracExact(2, 0.5)) * K.me * K.c * K.c / K.e;
    chk(S, 'La separación 2p3/2 − 2p1/2 con la fórmula de Dirac exacta coincide con α²Ry/16 (error de orden α⁴)', d, P.fineSplit2p(), 2e-4); }
  chk(L, 'Constante hiperfina del 1s del hidrógeno (Fermi): 1418.84 MHz, 0.1 % por debajo del valor medido 1420.4058 MHz', P.hyperfineHz() / 1e6, 1418.84, 2e-4);
  chk('Literatura', 'Hiperfina del hidrógeno: la fórmula de Fermi frente a la frecuencia medida con el máser de hidrógeno (1 420 405 751.768 Hz): diferencia < 0.2 % (anomalía del electrón, correcciones QED y de estructura del protón)', P.hyperfineHz(), ref.hf_exp, 2e-3);
  chk(S, 'Razón giromagnética del electrón: γ_e/2π = g μ_B/h = 28 024.95 MHz/T frente a scipy.constants', (P.ge * P.larmorHz(1)) / 1e6, c.gamma_e, 1e-8);
  chk(S, 'Frecuencia de resonancia del protón: γ_p/2π = 42.5775 MHz/T frente a scipy.constants', (5.5856946893 * P.muN) / K.h / 1e6, c.gamma_p, 1e-8);
  chk(L, 'Polarización térmica del protón a 3 T y 300 K: tanh(γħB/2kT) = 1.02×10⁻⁵', P.polarization(c.gamma_p * 1e6, 3, 300), 1.0217e-5, 2e-3);
  chk(L, 'Stern–Gerlach con plata (1200 K, 1000 T/m, imán de 3.5 cm, 1 cm hasta la pantalla): 0.2116 mm', P.sgDeflection(P.muB, 1000, 107.8682 * K.u, P.vMeanBeam(1200, 107.8682 * K.u), 0.035, 0.01) * 1e3, 0.2116, 2e-3);
};
