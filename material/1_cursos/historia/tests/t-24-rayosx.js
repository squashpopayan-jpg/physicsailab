module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const [l1, l2, N0, t, a, b] of R.bateman) { const r = C.bateman2(N0, l1, l2, t); T.rel(S, 'Bateman (solve_ivp DOP853): padre en t = ' + t, r.n1, a, 1e-8); T.rel(S, 'Bateman: hijo en t = ' + t, r.n2, b, 1e-8); }
  T.abs(S, 'e/m del electrón (scipy.constants)', C.QE / C.ME, R.em, 1e4);
  T.rel(H, 'e/m = 1.759×10¹¹ C/kg; Thomson obtuvo 1.7×10¹¹ con ±25 %', C.QE / C.ME, 1.7588e11, 1e-3);
  T.rel(N, 'campos cruzados: la deflexión devuelve e/m', C.thomsonEm(C.thomsonDeflection(R.em, 3e4, 1e-3, 0.05), 3e4, 1e-3, 0.05), R.em, 1e-12);
  T.abs(H, 'Thomson: el electrón es ≈ 1/1836 del átomo de hidrógeno', C.ME / 1.6735575e-27, 1 / 1836.15, 1e-6);
  const o = R.oil;
  T.rel(S, 'Millikan: el radio de la gota por Stokes', C.millikanRadius(o.eta, o.vf, o.drho), o.a, 1e-10);
  T.rel(S, 'Millikan: la carga se recupera de las velocidades de caída y subida', C.millikanCharge(o.eta, o.vf, o.vr, o.E, o.drho), o.q, 1e-9);
  T.rel(N, 'Millikan: velocidad de subida inversa', C.millikanRise(o.eta, o.vf, o.q, o.E, o.drho), o.vr, 1e-9);
  T.abs(N, 'Millikan: ajuste de la carga elemental a 60 gotas con 0.4 % de ruido', C.fitElementary(R.millikan_q, 1.2e-19, 2.4e-19, 4000) / R.qe, 1, 0.003);
  T.abs(H, 'Millikan: e ∝ η^{3/2}; un η un 0.54 % bajo reduce e un 0.8 %', Math.pow(1 - 0.0054, 1.5), 0.992, 0.0005);
  for (const [b, th] of R.coul2) T.abs(S, 'Coulomb: ángulo de dispersión integrado (RK4 vs DOP853), b = ' + b, C.coulombTrajectory(b, 1, 40000), th, 2e-3);
  for (const [b, th] of R.coul2) T.abs(N, 'Rutherford: ángulo analítico 2·arctan(d/2b), b = ' + b, C.rutherfordAngle(b, 1), th, 2e-3);
  T.rel(S, 'distancia de máximo acercamiento α de 5.3 MeV a oro', C.rutherfordD(2, 79, 5.3e6), R.d_au, 1e-9);
  T.abs(H, 'una α de 5.3 MeV llega a ≈ 43 fm del núcleo de oro (el núcleo mide ≈ 7 fm)', C.rutherfordD(2, 79, 5.3e6) * 1e15, 43, 1);
  for (const [th, s] of R.xs_above) T.rel(S, 'sección eficaz integrada (quad) para θ > ' + th.toFixed(2), C.rutherfordXSAbove(th, R.d_au), s, 1e-6);
  const nt = 5.9e28 * 4e-7;
  T.abs(H, 'fracción desviada más de 90° en una lámina de oro de 0.4 µm: del orden de 10⁻⁵', C.rutherfordXSAbove(Math.PI / 2, R.d_au) * nt * 1e5, 3.4, 0.3);
  T.abs(H, 'modelo del pudín: deflexión máxima por átomo ≈ 2×10⁻⁴ rad', C.pudingMax(79, 5.3e6, 1e-10), 2.1e-4, 0.2e-4);
  T.ok(H, 'el pudín no puede dar 90° ni con 10⁴ átomos en fila (√N·θ ≈ 0.02 rad)', Math.sqrt(1e4) * C.pudingMax(79, 5.3e6, 1e-10) < 0.05);
  T.abs(N, 'la intensidad dispersada cae un factor 16 al duplicar sen(θ/2)', C.rutherfordXS(0.5, 1) / C.rutherfordXS(2 * Math.asin(2 * Math.sin(0.25)), 1), 16, 1e-9);
  T.abs(H, 'vida media del Ra-226: 1600 años → 1/2 a 1600 años, 1/4 a 3200', C.decayN(1, 3200, 1600), 0.25, 1e-12);
  T.abs(S, 'Po-210: constante de desintegración ln2/138.376 d', C.decayConst(138.376), 0.0050092, 1e-6);
};
