module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const k of Object.keys(R.fres)) { const v = parseFloat(k), f = C.fresnelCS(v); T.abs(S, 'integral de Fresnel C(' + k + ') frente a scipy.special.fresnel', f.C, R.fres[k][0], 1e-8); T.abs(S, 'integral de Fresnel S(' + k + ')', f.S, R.fres[k][1], 1e-8); }
  for (const k of Object.keys(R.edge)) T.abs(S, 'borde recto: I/I₀ en v = ' + k, C.edgeI(parseFloat(k)), R.edge[k], 1e-8);
  let mx = 0, vm = 0; for (let v = 0.5; v <= 2; v += 0.001) { const i = C.edgeI(v); if (i > mx) { mx = i; vm = v; } }
  T.abs(S, 'borde recto: máximo de intensidad (1.3704) frente a scipy', mx, R.edge_max, 1e-5);
  T.abs(S, 'borde recto: posición del primer máximo v = 1.2172', vm, R.edge_vmax, 2e-3);
  T.abs(H, 'primer máximo de la difracción de un borde: 1.37 veces la luz incidente', mx, 1.37, 0.001);
  T.abs(N, 'borde recto: en el borde geométrico la intensidad es 1/4', C.edgeI(0), 0.25, 1e-12);
  T.abs(N, 'borde recto: lejos en la zona iluminada tiende a 1', C.edgeI(8), 1, 0.04);
  for (const [x, j] of R.j0) T.abs(S, 'J₀(' + x + ') frente a scipy.special.j0', C.bessJ0(x), j, 1e-7);
  for (const [q, F, wr, I] of R.poisson) T.rel(S, `disco de Poisson, q = ${q}, F = ${F}: integral radial frente a scipy`, C.poissonI(q, F, wr), I, 2e-3);
  for (const F of [0.8, 1.5, 3]) T.rel(N, 'mancha de Arago–Poisson en el eje: integral numérica frente a la expresión cerrada, F = ' + F, C.poissonI(0, F, 5), C.poissonAxisExact(F, 5), 2e-3);
  T.ok(H, 'la mancha de Poisson: en el eje la intensidad es casi la misma que sin disco (> 90 %)', C.poissonI(0, 1.5, 5) > 0.9 * Math.exp(0));
  T.abs(S, 'Young: longitud de onda del rojo extremo (1/36 000 pulgada)', C.youngNm(C.YOUNG_RED_IN), R.young_nm.red, 1e-9);
  T.abs(H, 'Young estimó el rojo extremo en ≈ 706 nm', C.youngNm(C.YOUNG_RED_IN), 706, 1);
  T.abs(H, 'Young estimó el violeta extremo en ≈ 423 nm', C.youngNm(C.YOUNG_VIOLET_IN), 423, 1);
  /* franjas de Young: posición del segundo máximo = λL/d */
  const lam = 550e-9, L = 1, d = 0.25e-3, a = 0.03e-3;
  let best = 0, ib = 0; for (let y = 0.5 * lam * L / d; y < 1.5 * lam * L / d; y += 1e-7) { const i = C.youngI(y, lam, L, d, a); if (i > best) { best = i; ib = y; } }
  T.abs(N, 'franjas de Young: el primer máximo lateral está a λL/d', ib, C.fringeSpacing(lam, L, d), 2e-5);
  T.abs(N, 'franjas de Young: en el centro la intensidad es 1', C.youngI(0, lam, L, d, a), 1, 1e-12);
  T.abs(N, 'franjas de Young: en el punto medio entre máximos es nula', C.youngI(0.5 * lam * L / d, lam, L, d, 1e-9), 0, 1e-9);
  T.ok(N, 'la predicción corpuscular no tiene franja oscura en el centro ni intensidad nula entre las bandas', C.youngCorpuscular(0, lam, L, d, a) > 0.5 * C.youngCorpuscular(d / 2, lam, L, d, a));
  T.abs(S, 'Hα desde la fórmula de Rydberg con masa reducida (nm, vacío)', C.halphaVacuum(R.rinf, R.me_mp), R.halpha_vac, 1e-6);
  T.abs(H, 'Hα en el aire (656.279 nm) = vacío / 1.000277', C.halphaVacuum(R.rinf, R.me_mp) / 1.000277, 656.279, 0.03);
  T.abs(S, 'Foucault: desviación de 1.3 mm con 800 rev/s, 20 m y 1 m (scipy.constants.c)', C.foucaultShift(800, 20, 1), R.foucault, 1e-9);
  T.rel(N, 'Foucault: la desviación devuelve la velocidad c', C.cFromFoucault(800, 20, 1, C.foucaultShift(800, 20, 1)), C.CLIGHT, 1e-12);
  T.abs(H, 'Foucault 1850: la luz va más lenta en el agua, c/n con n = 4/3', 1 / (4 / 3), 0.75, 1e-12);
  for (const [m, lam2, d2, th] of R.grating) T.abs(S, `rejilla: arcsen(mλ/d) con m = ${m}, λ = ${(lam2 * 1e9).toFixed(1)} nm`, C.gratingAngle(m, lam2, d2), th, 1e-12);
  T.abs(N, 'resolver el doblete D del sodio exige N·m ≈ 982', 589.3 / (589.592 - 588.995), 987, 5);
  T.ok(H, 'una rejilla de 1000 líneas en primer orden separa el doblete D (0.6 nm)', C.dMinResolved(589.3, 1000, 1) < 0.6);
  T.ok(H, 'el prisma de Newton (sin rendija) no separa el doblete D: la rejilla de 200 líneas tampoco', C.dMinResolved(589.3, 200, 1) > 0.6);
};
