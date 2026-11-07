/* Comprueba que cada frase o dato normativo del curso exista en el texto oficial guardado en tests/fuentes/ */
const fs = require('fs'), path = require('path');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s ]+/g, ' ').toLowerCase();
const leer = (f) => norm(fs.readFileSync(path.join(__dirname, 'fuentes', f), 'utf8'));

module.exports = function (T, C) {
  const G = 'Normas';
  const F = {
    d1330: leer('decreto_1330_2019.txt'), d529: leer('decreto_529_2024.txt'), r21795: leer('resolucion_21795_2020.txt'),
    r2265: leer('resolucion_2265_2023.txt'), a25: leer('acuerdo_cesu_01_2025.txt'), a02: leer('acuerdo_cesu_02_2020.txt'), fic: leer('ficha_unicauca_ingenieria_fisica.txt')
  };
  const tiene = (clave, frase, nombre) => T.ok(G, nombre || `${clave}: «${frase.length > 70 ? frase.slice(0, 68) + '…' : frase}»`, F[clave].includes(norm(frase)));
  /* Decreto 1330 de 2019 */
  tiene('d1330', 'DECRETO 1330 DE 2019 (julio 25)');
  tiene('d1330', 'declaraciones expresas de lo que se espera que un estudiante conozca y demuestre en el momento de completar su programa académico');
  tiene('d1330', 'Políticas académicas asociadas a currículo, resultados de aprendizaje, créditos y actividades');
  tiene('d1330', 'Artículo 2.5.3.2.3.1.3 . Estructura administrativa y académica');
  tiene('d1330', 'Artículo 2.5.3.2.3.2.4 . Aspectos curriculares');
  tiene('d1330', 'conforme con los resultados de aprendizaje proyectados');
  tiene('d1330', 'con relación a los resultados de aprendizaje establecidos en el programa');
  tiene('d1330', 'Artículo 2.5.3.2.4.1 . Crédito académico');
  tiene('d1330', 'cuarenta y ocho (48) horas');
  tiene('d1330', 'Artículo 2.5.3.2.4.2 . Número de créditos académicos');
  tiene('d1330', 'será expresado siempre en números enteros');
  tiene('d1330', 'se centra en la evaluación de capacidades y procesos');
  /* Decreto 529 de 2024 */
  tiene('d529', 'DECRETO 529 DE 2024 (abril 29)');
  tiene('d529', 'Diario Oficial No. 52.742 de 29 de abril de 2024');
  tiene('d529', 'deroga el artículo 2.5.3.2.5.4 del Decreto número 1075 de 2015 y las Resoluciones números 15178 de 2022 y 2265 de 2023');
  tiene('d529', 'Artículo 2.5.3.2.3.2.12 . Renovación del registro calificado');
  tiene('d529', 'no menos de doce (12) meses de antelación');
  tiene('d529', 'el avance del programa a partir de la autorregulación, la autoevaluación y/o el diseño, aplicación y resultados de planes de mejoramiento en la última vigencia');
  tiene('d529', 'Artículo 2.5.3.2.9.2 . Registro calificado de los programas académicos acreditados en alta calidad');
  tiene('d529', 'se concederá por siete (7) años');
  T.ok(G, 'Decreto 529: no modifica los artículos curriculares 2.5.3.2.3.2.4 ni 2.5.3.2.4.1', !F.d529.includes('articulo 2.5.3.2.3.2.4 .') && !F.d529.includes('articulo 2.5.3.2.4.1 .'));
  /* Resolución 21795 de 2020 */
  tiene('r21795', 'RESOLUCIÓN 21795 DE 2020 (noviembre 19)');
  tiene('r21795', 'Resolución derogada por el artículo 12 de la Resolución 2265 de 2023');
  tiene('r21795', 'lo que el estudiante sabrá, comprenderá y será capaz de hacer');
  tiene('r21795', 'Incluir su clasificación o taxonomía');
  tiene('r21795', 'Estar alineados con el plan general de estudios y el perfil de egreso');
  tiene('r21795', 'Ser comunicados a los estudiantes');
  tiene('r21795', 'Establecerlos niveles de aprendizaje que reflejen la articulación con el proceso formativo del estudiante, desde que ingresa hasta que termina el programa académico');
  tiene('r21795', 'Resultado de las evaluaciones realizadas por la institución a los resultados de aprendizaje del programa académico');
  tiene('r21795', 'el ser, el saber y el hacer');
  /* Resolución 2265 de 2023 */
  tiene('r2265', 'Rige a partir del 31 de marzo de 2023');
  tiene('r2265', 'Resolución derogada por el artículo 9 del Decreto 529 de 2024');
  tiene('r2265', 'se derogan las Resoluciones 15224 de 24 de agosto de 2020, 21795 de 19 de noviembre de 2020 y 20600 de 5 de noviembre de 2021');
  /* Acuerdo CESU 02 de 2020 */
  tiene('a02', 'Dado en Bogotá D.C., a los (1) días del mes de julio de 2020');
  tiene('a02', 'El presente Acuerdo rige a partir del 1 de julio de 2020');
  tiene('a02', 'las declaraciones expresas de lo que se espera que un estudiante conozca y demuestre en el momento de completar su programa académico');
  tiene('a02', 'Se constituyen en el eje de un proceso de mejoramiento');
  tiene('a02', 'Los resultados de aprendizaje se definirán para un programa académico específico');
  tiene('a02', 'los estándares internacionales');
  tiene('a02', 'Son susceptibles de ser evaluadas mediante resultados de aprendizaje');
  tiene('a02', 'Característica 23. Resultados de aprendizaje.');
  tiene('a02', 'de manera periódica, y en diferentes momentos a lo largo del plan de estudios, el grado en que los estudiantes alcanzan los resultados de aprendizaje');
  tiene('a02', 'se toman acciones de ajuste a los aspectos curriculares y a las metodologías de enseñanza-aprendizaje');
  tiene('a02', 'Característica 24. Competencias.');
  tiene('a02', 'Característica 22. Sistema de evaluación de estudiantes');
  tiene('a02', 'FACTOR 5. ASPECTOS ACADÉMICOS Y RESULTADOS DE APRENDIZAJE');
  tiene('a02', 'Característica 21. Estrategias pedagógicas');
  tiene('a02', 'Característica 25. Evaluación y autorregulación del programa académico');
  /* Acuerdo CESU 01 de 2025 */
  tiene('a25', 'Dado en Bogotá, D. C., a 26 de mayo de 2025');
  tiene('a25', 'Diario Oficial No. 53.131');
  tiene('a25', 'deroga los Acuerdos 02 de 2020 y 04 de 2022');
  tiene('a25', 'a partir del primero (1) de enero de dos mil veintisiete (2027)');
  tiene('a25', 'a partir del primero (1) de junio de dos mil veintisiete (2027)');
  tiene('a25', 'a partir del primero (1) de enero de dos mil veintiséis (2026)');
  tiene('a25', 'ARTÍCULO 67. LINEAMIENTOS Y GUÍAS DEL MODELO DE ACREDITACIÓN EN ALTA CALIDAD');
  tiene('a25', 'dentro de los seis (6) meses siguientes');
  tiene('a25', 'FACTOR 5. Aspectos académicos y evaluación');
  tiene('a25', 'Característica 20. Aportes del sistema de evaluación de los procesos y resultados académicos al mejoramiento curricular del programa');
  tiene('a25', 'Característica 21. Coherencia entre las competencias, capacidades, habilidades y/o destrezas');
  tiene('a25', 'Característica 19. Sistema de evaluación de estudiantes');
  tiene('a25', 'Característica 18. Coherencia de las estrategias pedagógicas');
  tiene('a25', 'Característica 17. Evaluación de la gestión curricular');
  tiene('a25', 'FACTOR 12. Aseguramiento de la alta calidad del programa');
  tiene('a25', 'Procesos y resultados académicos o de la formación');
  tiene('a25', 'fomentar la colaboración y el aprendizaje mutuo');
  /* Ficha del programa */
  tiene('fic', 'Resolución 6518 del 9 de agosto de 2011');
  tiene('fic', 'Código SNIES: 3636');
  tiene('fic', '10 Semestres');
  tiene('fic', 'Facultad de Ciencias Naturales, Exactas y de la Educación');
  tiene('fic', 'instrumentación y control, materiales y óptica');
  tiene('fic', 'Metrología y de la Normalización');
  T.ok(G, 'Ficha: 165 créditos', /165/.test(F.fic));
  /* Plan de estudios cargado en la matriz: créditos suman 165, como la ficha */
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'core', '50-herr.js'), 'utf8');
  const arr = eval(src.match(/H\.CURSOS0 = (\[[\s\S]*?\n  \]);/)[1]);
  T.eq(G, 'El plan de la matriz suma 165 créditos, igual que la ficha', arr.reduce((a, c) => a + c[3], 0), 165);
  T.eq(G, 'El plan de la matriz abarca 10 semestres', Math.max(...arr.map((c) => c[1])), 10);
  /* Cada curso de la matriz aparece por nombre en la ficha (sin el sufijo «con laboratorio») */
  const base = (n) => n.replace(/ \(con laboratorio\)/, '').replace(/ I y II$/, '');
  const noEst = arr.map((c) => base(c[0])).filter((n) => !F.fic.includes(norm(n)) && !['electiva en cultura y estetica'].includes(norm(n)));
  T.eq(G, 'Todo curso de la matriz figura en la ficha del programa', noEst, []);
  /* Estado de las normas en la línea de tiempo */
  const A = C.ra, F2 = A.FECHAS, E = (n, f) => A.estadoEn(F2[n], f)[0];
  T.eq(G, 'Res. 21795 vigente el 15-mar-2022', E('Resolución 21795 de 2020 (MEN)', '2022-03-15'), 'vigente');
  T.eq(G, 'Res. 21795 derogada el 31-mar-2023 (rige la 2265)', E('Resolución 21795 de 2020 (MEN)', '2023-03-31'), 'derogada');
  T.eq(G, 'Res. 2265 vigente el 1-ene-2024', E('Resolución 2265 de 2023 (MEN)', '2024-01-01'), 'vigente');
  T.eq(G, 'Res. 2265 derogada el 29-abr-2024 (Decreto 529)', E('Resolución 2265 de 2023 (MEN)', '2024-04-29'), 'derogada');
  T.eq(G, 'Decreto 1330 aún no existía el 24-jul-2019', E('Decreto 1330 de 2019', '2019-07-24'), 'previa');
  T.eq(G, 'Acuerdo 02 de 2020 vigente el 1-jul-2020', E('Acuerdo CESU 02 de 2020', '2020-07-01'), 'vigente');
  T.eq(G, 'Acuerdo 02 de 2020 en transición el 6-nov-2026', E('Acuerdo CESU 02 de 2020', '2026-11-06'), 'transicion');
  T.eq(G, 'Acuerdo 02 de 2020 derogado en la práctica el 1-ene-2027', E('Acuerdo CESU 02 de 2020', '2027-01-01'), 'derogada');
  T.eq(G, 'Acuerdo 01 de 2025 en transición el 6-nov-2026', E('Acuerdo CESU 01 de 2025', '2026-11-06'), 'transicion');
  T.eq(G, 'Acuerdo 01 de 2025 plenamente vigente el 1-jun-2027', E('Acuerdo CESU 01 de 2025', '2027-06-01'), 'vigente');
  T.eq(G, 'Decreto 529 de 2024 vigente el 6-nov-2026', E('Decreto 529 de 2024', '2026-11-06'), 'vigente');
};
