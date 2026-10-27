module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  for (const [k, r] of [['octava', 2], ['quinta', 1.5], ['cuarta', 4 / 3], ['tono', 9 / 8]]) T.abs(S, `intervalo ${k}: cents`, C.cents(r), R.cents[k], 1e-9);
  T.abs(H, 'quinta justa = 701.955 cents', C.cents(1.5), 701.955, 1e-3);
  T.rel(S, 'coma pitagórica 3¹²/2¹⁹', C.pythComma(), R.comma, 1e-14);
  T.abs(H, 'coma pitagórica = 23.46 cents', C.cents(C.pythComma()), 23.46, 0.01);
  const A = C.achilles(10, 1, 100, 60);
  T.rel(S, 'Zenón: suma de 60 etapas = d/(va−vt)', A.steps[59].t, R.zeno_t, 1e-12);
  T.rel(S, 'Zenón: instante exacto', A.tExact, R.zeno_exact, 1e-14);
  T.abs(H, 'Zenón: 100/9 s', A.tExact, 100 / 9, 1e-12);
  T.rel(S, 'cuerda vibrante f₁ = (1/2L)√(T/µ)', C.stringFreq(0.6, 100, 1e-3, 1), R.string_f1, 1e-14);
  T.abs(H, 'cuerda: la mitad de longitud sube una octava', C.stringFreq(0.3, 100, 1e-3, 1) / C.stringFreq(0.6, 100, 1e-3, 1), 2, 1e-12);
  T.abs(H, 'Tales: la sombra de la pirámide de 31.4 m (+115.2) da 146.6 m', C.shadowHeight(1.8, 1.8, 31.4 + 115.2), 146.6, 1e-9);
};
