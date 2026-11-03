/* Cap. 10 — Modelos atómicos */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const A = EM.fm.atom, K = EM.qm.K;
  /* Rutherford en unidades d₀ = 1 */
  for (const r of ref.ruth) chk(S, `Dispersión de Rutherford (b = ${r.b} d₀): θ = 2 arctan(d₀/2b) frente a la integración numérica de la órbita de Coulomb (DOP853)`, A.scatterAngle(r.b, 1), r.theta, 2e-5);
  for (const r of ref.rmin) chk(S, `Rutherford: distancia mínima (b = ${r.b} d₀) frente a la raíz numérica de la energía (brentq)`, A.closestApproach(r.b, 1), r.rmin, 1e-9);
  chk(L, 'Rutherford: b(θ) y θ(b) son inversas', A.scatterAngle(A.impactParameter(2.1, 1), 1), 2.1, 1e-14);
  chk(L, 'Rutherford: choque frontal (b → 0) llega hasta d₀: r_mín(b = 10⁻⁶ d₀) = d₀', A.closestApproach(1e-6, 1), 1, 1e-5);
  chk(L, 'Rutherford: α de 7.69 MeV sobre oro: d₀ = 2·79·1.44 MeV·fm/7.69 MeV = 29.6 fm', A.d0(2, 79, 7.69) / 1e-15, 29.58, 1e-3);
  { const th = 0.9; const num = (() => { let s = 0; const N = 200000; for (let i = 0; i < N; i++) { const t = th + ((i + 0.5) * (Math.PI - th)) / N; s += A.rutherford(t, 1) * 2 * Math.PI * Math.sin(t) * ((Math.PI - th) / N); } return s; })();
    chk(L, 'La integral de dσ/dΩ de θ₀ a π reproduce π(d₀/2)²cot²(θ₀/2) (cuadratura propia, θ₀ = 0.9 rad)', num, A.sigmaAbove(th, 1), 1e-7); }
  /* Bohr de dos cuerpos */
  const b2 = ref.bohr2, mp = K.mp;
  chk(S, 'Energía de ionización del hidrógeno (μ = m_e, núcleo infinito): −13.6057 eV frente a scipy.constants', A.levelEV(1, K.me), -b2.Ry, 1e-6);
  chk(S, 'Hidrógeno con masa reducida: −13.5984 eV frente al cálculo con scipy.constants', A.levelEV(1, A.reduced(K.me, mp)), b2.H, 1e-6);
  chk(S, 'Positronio (μ = m_e/2): −6.8028 eV frente a scipy.constants', A.levelEV(1, K.me / 2), b2.pos, 1e-6);
  chk(S, 'Hidrógeno muónico (μ = m_μ m_p/(m_μ + m_p) = 185.84 m_e): −2528.5 eV frente a scipy.constants', A.levelEV(1, A.reduced(b2.mmu, mp)), b2.mup, 1e-6);
  chk(S, 'Radio de Bohr del hidrógeno (μ = m_e) frente a scipy.constants', A.radius(1, K.me), b2.a0, 1e-6);
  chk(L, 'Radio de Bohr del muónico: 285 fm = a₀ m_e/μ', A.radius(1, A.reduced(b2.mmu, mp)) / 1e-15, 284.8, 2e-3);
  chk(L, 'Radio de Bohr del positronio: 2a₀ = 105.8 pm', A.radius(1, K.me / 2) / 1e-12, 105.835, 1e-5);
  /* Franck–Hertz: determinista con semilla */
  { let st = 12345; const rng = () => { st = (st * 1664525 + 1013904223) % 4294967296; return st / 4294967296; };
    const V1 = A.franckHertz(4.0, { n: 4000 }, rng).frac, V2 = A.franckHertz(8.0, { n: 4000 }, rng).frac, V3 = A.franckHertz(9.0, { n: 4000 }, rng).frac, V4 = A.franckHertz(6.0, { n: 4000 }, rng).frac;
    chk(L, 'Franck–Hertz: por debajo de 4.887 V casi todos los electrones llegan al ánodo (V = 4 V: fracción > 0.95)', V1 > 0.95 ? 1 : 0, 1, 0);
    chk(L, 'Franck–Hertz: la corriente cae tras 4.9 V (V = 6 V < V = 4 V) y vuelve a subir (V = 9 V > 6 V)', V4 < V1 && V3 > V4 ? 1 : 0, 1, 0); void V2; }
  /* Moseley */
  { const m = ref.moseley, f = A.moseleyFit(m.Z, m.E);
    chk(S, 'Ajuste de Moseley √E = a(Z − σ): pendiente a frente a numpy.polyfit', f.a, m.a, 1e-9); chk(S, 'Ajuste de Moseley: constante de apantallamiento σ frente a numpy.polyfit', f.sigma, m.sigma, 1e-8);
    chk(L, 'Pendiente de Moseley de Mg a Zn (Z = 12–30) frente a √(¾Ry) = 3.194 eV^½ (error < 0.2 %)', f.a, m.a_theory, 2e-3); chk(L, 'Constante de apantallamiento de las líneas Kα (Z = 12–30): σ ≈ 0.95', f.sigma, 0.95, 0.05);
    for (const [s, v] of Object.entries(ref.moseley_kalpha)) chk(S, `Tabla de Kα1 de ${s} (Z = ${A.KALPHA[s][0]}) frente a xraydb`, A.KALPHA[s][1], v, 2e-4); }
};
