module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  T.abs(S, 'tiempo oposición–cuadratura de Marte (brentq), días', C.quadratureTime(1.52368, 365.256, 686.98), R.quad_t, 1e-6);
  T.abs(H, 'Marte: unos 106 días de la oposición a la cuadratura', C.quadratureTime(1.52368, 365.256, 686.98), 106, 1);
  T.abs(H, 'periodo sinódico de Marte = 779.9 d', C.synodic(365.256, 686.98), R.syn_mars, 1e-9);
  T.abs(H, 'periodo sinódico de Marte: 780 d', C.synodic(365.256, 686.98), 780, 0.5);
  T.rel(H, 'Copérnico: a = 1/cos φ recupera el semieje de Marte', C.copernicusSuperior(C.quadratureTime(1.52368, 365.256, 686.98), 365.256, 686.98).a, 1.52368, 1e-9);
  T.abs(H, 'Venus: sen ε = 0.723 con ε = 46.3°', C.copernicusInferior(R.venus_eps), 0.72333, 1e-9);
  T.abs(H, 'Mercurio: a = sen 23° = 0.391 (moderno 0.387, con excentricidad)', R.merc_a, 0.387, 0.005);
  T.rel(S, 'paralaje de la Luna (57′): distancia en radios terrestres', C.parallaxDistance(6371, 57 * 60) / 6371, R.par.luna, 1e-12);
  T.abs(H, 'la Luna está a ≈ 60 radios terrestres', C.parallaxDistance(6371, 57 * 60) / 6371, 60.3, 0.1);
  T.rel(S, 'nova de 1572: paralaje < 1′ ⇒ > 3438 radios terrestres', C.parallaxDistance(6371, 60) / 6371, R.par.nova, 1e-12);
  T.abs(H, '61 Cygni (0.314″): 10.4 años luz', C.parallaxDistance(C.KM.AU, 0.314) / C.KM.lightYear, R.par.cygni_ly, 1e-9);
  T.abs(H, '61 Cygni: unos 10.4 años luz (Bessel: 10.3)', R.par.cygni_ly, 10.4, 0.2);
  T.abs(H, 'paralaje 0.1″ = 10 pársecs', C.parallaxDistance(C.KM.AU, 0.1) / C.KM.parsec, R.par.pc, 1e-3);
  let dmax = 0;
  for (let i = 0; i <= 22; i++) { const t = (2.2 * i) / 22, m = C.marsModels(t, 1.524, 1.881); for (const k of ['tyc', 'pto']) dmax = Math.max(dmax, Math.abs(m.cop[0] - m[k][0]), Math.abs(m.cop[1] - m[k][1])); }
  T.abs(S, 'equivalencia Copérnico–Tycho–Ptolomeo: máxima diferencia del vector Tierra→Marte', dmax, R.equiv_max, 1e-12);
  T.abs(H, 'los tres sistemas coinciden (diferencia < 1e-12 UA)', dmax, 0, 1e-12);
};
