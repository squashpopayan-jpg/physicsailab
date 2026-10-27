module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  T.abs(S, 'energía de fisión Q (U-235 + n → Ba-141 + Kr-92 + 3n) con las masas atómicas', C.fissionQ(), R.fissionQ, 1e-9);
  T.abs(H, 'la fisión libera unos 173–200 MeV por núcleo (≈ 3×10⁻¹¹ J)', C.fissionQ(), 173, 5);
  T.abs(H, 'un kilogramo de U-235 fisionado equivale a 17–20 kt de TNT', (C.fissionQ() * 1e6 * C.K.e * (1000 / 235.0439) * C.K.NA) / C.KT, 18, 2);
  for (const [nm, Z, A, b] of C.BINDING) if (A >= 40) T.abs(H, `fórmula semiempírica de Weizsäcker: B/A de ${nm} frente a la medida`, C.bindingSEMF(Z, A) / A, b, 0.12);
  T.abs(H, 'el máximo de B/A está en la región del hierro y el níquel (8.8 MeV)', Math.max(...C.BINDING.map((x) => x[3])), 8.7945, 1e-12);
  T.ok(N, 'el uranio está en la rama descendente: B/A menor que el hierro en más de 1 MeV', C.BINDING[4][3] - C.BINDING[9][3] > 1.1);
  for (const [Zd, E, Rf, g] of R.gamow) { T.rel(S, `Gamow: exponente 2G de la barrera frente a la cuadratura (quad) para Z = ${Zd}, E = ${E} MeV`, C.gamowExact(Zd, E, Rf), g, 1e-4); }
  const g1 = C.gamowExact(90, 4.27, 9.0), g2 = C.gamowExact(82, 8.95, 8.5);
  T.ok(H, 'Gamow (1928): la vida media varía unos 24 órdenes entre Po-212 (8.95 MeV) y U-238 (4.27 MeV): el exponente da > 20 órdenes', (g1 - g2) / Math.LN10 > 18 && (g1 - g2) / Math.LN10 < 30);
  for (const [k, q] of R.extinct) T.abs(S, 'probabilidad de extinción de la cadena (brentq) para k = ' + k, C.extinction(k), q, 1e-9);
  T.abs(N, 'una cadena subcrítica (k ≤ 1) siempre se extingue', C.extinction(0.9), 1, 0);
  const x = C.TRINITY.map((p) => Math.log(p[0] * 1e-3)), y = C.TRINITY.map((p) => Math.log(p[1])), f = C.linfit(x, y);
  T.abs(S, 'Taylor: pendiente de log R frente a log t (numpy.polyfit)', f.m, R.taylor_fit[0], 1e-9);
  T.abs(H, 'Taylor (1941-1950): R ∝ t^{2/5}, la pendiente medida es 0.40 ± 0.03', f.m, 0.4, 0.03);
  const yields = C.TRINITY.filter((p) => p[0] >= 1).map((p) => C.taylorYield(p[1], p[0] * 1e-3, 1.2) / C.KT);
  const mean = yields.reduce((a, b) => a + b, 0) / yields.length;
  T.abs(H, 'rendimiento de Trinity por análisis dimensional: 17–24 kt (oficial: 21 kt)', mean, 20.5, 4);
  T.abs(S, 'rendimiento medio de todos los puntos frente a numpy', C.TRINITY.map((p) => C.taylorYield(p[1], p[0] * 1e-3, 1.2) / C.KT).reduce((a, b) => a + b, 0) / C.TRINITY.length, R.taylor_E_mean_kt, 1e-9);
};
