module.exports = function (T, C, R) {
  const A = C.ra, S = 'SciPy', L = 'Lógica';
  ['m1', 'm2'].forEach((k) => {
    const M = R[k === 'm1' ? 'M1' : 'M2'];
    T.abs(S, `kappa de Cohen (${k}) frente a scikit-learn`, A.kappa(M), R['kappa_' + k], 1e-12);
    T.abs(S, `kappa ponderado lineal (${k})`, A.kappaPonderado(M, 'lineal'), R['kappa_lin_' + k], 1e-12);
    T.abs(S, `kappa ponderado cuadrático (${k})`, A.kappaPonderado(M, 'cuadratico'), R['kappa_cuad_' + k], 1e-12);
    T.abs(S, `acuerdo observado (${k})`, A.acuerdo(M), R['acuerdo_' + k], 1e-12);
  });
  T.abs(S, 'alfa de Cronbach (25 estudiantes × 5 criterios) frente a NumPy', A.alfaCronbach(R.alfa_X), R.alfa, 1e-12);
  [80, 85, 90, 95, 99].forEach((c) => T.abs(S, `z de confianza ${c} % frente a scipy.stats.norm.ppf`, A.Z[c / 100], R['z_' + c], 1e-9));
  R.muestra.forEach(([N, e, c, n]) => T.eq(S, `tamaño de muestra N=${N}, e=${e}, conf=${c}`, A.tamMuestra(N, e, c), n));
  R.wilson.forEach(([x, n, c, lo, hi]) => {
    const w = A.wilson(x, n, c);
    T.abs(S, `Wilson ${x}/${n}: límite inferior`, w[0], lo, 1e-9);
    T.abs(S, `Wilson ${x}/${n}: límite superior`, w[1], hi, 1e-9);
  });
  R.cp.forEach(([x, n, lo, hi]) => {
    const w = A.wilson(x, n, 0.95);
    T.ok(S, `Wilson ${x}/${n} dentro de ±0.04 del intervalo exacto de Clopper-Pearson`, Math.abs(w[0] - lo) < 0.04 && Math.abs(w[1] - hi) < 0.04);
  });
  /* créditos (Decreto 1330 de 2019: 1 crédito = 48 h) */
  T.eq(L, '64 h directas + 128 h independientes = 192 h = 4 créditos', A.creditos(64, 128), 4);
  T.eq(L, '165 créditos = 7920 horas', A.horasPorCredito(165), 7920);
  T.abs(L, 'proporción directa 1:2 = 1/3', A.proporcion(64, 128), 1 / 3, 1e-12);
  /* analizador de resultados de aprendizaje */
  const buenos = [
    'Diseña y valida un sistema de medición de una magnitud física, estimando su incertidumbre y justificando la selección de sensores según normas técnicas.',
    'Formula modelos matemáticos de fenómenos físicos en contextos de ingeniería y contrasta sus predicciones con datos experimentales documentando las limitaciones.'
  ];
  const malos = ['Conocer la física clásica y moderna.', 'Entender los principios de la óptica.', 'El programa pretende ofrecer formación en instrumentación.'];
  buenos.forEach((t, i) => {
    const r = A.analizar(t);
    T.ok(L, `RA bien formulado ${i + 1}: puntaje ≥ 75`, r.puntaje >= 75);
    T.ok(L, `RA bien formulado ${i + 1}: verbo reconocido`, !!r.verbo);
  });
  malos.forEach((t, i) => T.ok(L, `RA deficiente ${i + 1}: puntaje < 60`, A.analizar(t).puntaje < 60));
  const d1 = A.analizar('Diseña un circuito para medir temperatura en un horno industrial con criterios de seguridad.');
  T.eq(L, '«Diseña» → diseñar, nivel Crear (6)', [d1.verbo, d1.nivel], ['diseñar', 6]);
  T.eq(L, '«será capaz de analizar» → nivel Analizar (4)', A.analizar('El estudiante será capaz de analizar señales ruidosas mediante transformada de Fourier para caracterizar su espectro.').nivel, 4);
  T.eq(L, 'detecta verbo vago «entender»', !!A.esVago('Entender los principios de la óptica'), true);
  T.eq(L, 'detecta giro centrado en el docente', !!A.centradoDocente('El docente enseñará óptica geométrica'), true);
  T.eq(L, 'ningún verbo se repite entre niveles', Object.values(A.VERBOS).flat().length, new Set(Object.values(A.VERBOS).flat()).size);
  /* matriz curricular */
  const cursos = [{ n: 'A', sem: 1 }, { n: 'B', sem: 3 }, { n: 'C', sem: 6 }, { n: 'D', sem: 9 }];
  const M = [['I', ''], ['R', 'M'], ['R', ''], ['M', 'I']];
  const mat = A.analizarMatriz(cursos, 2, M);
  T.ok(L, 'matriz: RA1 (I, R, R, M) sin problema de orden', mat.porRA[0].prob.indexOf('se domina antes de introducirse') < 0);
  T.ok(L, 'matriz: RA2 se domina (sem. 3) antes de introducirse (sem. 9)', mat.porRA[1].prob.indexOf('se domina antes de introducirse') >= 0);
  T.eq(L, 'matriz: cobertura 100 %', mat.cobertura, 1);
  /* ciclo de mejora */
  const c1 = A.simCiclo(0.5, 0.8, 0.5, 4, true), c0 = A.simCiclo(0.5, 0.8, 0.5, 4, false);
  T.abs(L, 'ciclo cerrado: primera iteración 0.5 → 0.65', c1[1], 0.65, 1e-12);
  T.ok(L, 'ciclo abierto: el logro no cambia', c0.every((v) => v === 0.5));
  T.ok(L, 'ciclo cerrado: converge a la meta sin superarla', c1[4] < 0.8 && c1[4] > c1[3]);
  /* fechas */
  T.eq(L, 'suma de días cruza fin de año', A.sumaDias('2026-12-30', 5), '2027-01-04');
  T.eq(L, 'diferencia de días 6-nov-2026 a 1-ene-2027', A.difDias('2026-11-06', '2027-01-01'), 56);
  const pa = A.programaAtras([{ n: 'a', dur: 10, dep: [] }, { n: 'b', dur: 5, dep: [0] }], '2027-01-31');
  T.eq(L, 'programación hacia atrás: b termina en el límite y a termina cuando empieza b', [pa[1].fin, pa[0].fin], ['2027-01-31', '2027-01-26']);
};
