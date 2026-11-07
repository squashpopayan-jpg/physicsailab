/* Comprueba las cifras que el curso cita de los documentos del programa */
const fs = require('fs'), path = require('path');

module.exports = function (T, C) {
  const G = 'Programa', A = C.ra;
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'core', '50-herr.js'), 'utf8');
  const cursos = eval(src.match(/H\.CURSOS0 = (\[[\s\S]*?\n  \]);/)[1]);
  const ras = eval(src.match(/H\.RA0 = (\[[\s\S]*?\n  \]);/)[1]);
  /* Plan de estudios: créditos por semestre según la «Tabla 5» del informe de autoevaluación (reforma aplicada desde 2017) */
  const porSem = {};
  cursos.forEach((c) => { porSem[c[1]] = (porSem[c[1]] || 0) + c[3]; });
  T.eq(G, 'Créditos por semestre (plan vigente, Tabla 5)', Object.keys(porSem).sort((a, b) => a - b).map((k) => porSem[k]), [20, 17, 19, 18, 17, 16, 17, 18, 16, 7]);
  T.eq(G, 'Total del plan = 165 créditos', cursos.reduce((a, c) => a + c[3], 0), 165);
  T.eq(G, 'Distribución por área suma 165 créditos (74 + 33 + 37 + 21)', 74 + 33 + 37 + 21, 165);
  T.abs(G, 'Ciencias básicas y de ingeniería = 65 % del plan', (74 + 33) / 165, 0.65, 0.005);
  T.eq(G, '165 créditos = 7 920 horas', A.horasPorCredito(165), 7920);
  T.abs(G, 'Promedio de horas semanales por semestre de 16 semanas ≈ 49,5', (165 / 10 * 48) / 16, 49.5, 1e-9);
  T.eq(G, 'Primer semestre (20 créditos): 60 horas semanales', (20 * 48) / 16, 60);
  /* Créditos y horas según la presentación: 3 créditos → 9 h (6 + 3, 33 %); 4 créditos → 12 h (6 + 6, 50 %) */
  T.eq(G, '3 créditos = 144 h = 9 h semanales en 16 semanas', [A.horasPorCredito(3), A.horasPorCredito(3) / 16], [144, 9]);
  T.abs(G, '3 créditos: 3 h de 9 son autónomas (33 %)', 3 / 9, 0.33, 0.005);
  T.abs(G, '4 créditos: 6 h de 12 son autónomas (50 %)', 6 / 12, 0.5, 1e-12);
  T.eq(G, 'Con 6 h semanales con el profesor: 96 h con profesor y 48 independientes', [6 * 16, A.horasPorCredito(3) - 6 * 16], [96, 48]);
  /* Resultados vigentes */
  T.eq(G, 'El programa declara tres resultados de aprendizaje', ras.length, 3);
  const pts = ras.map((r) => A.analizar(r.t).puntaje);
  T.eq(G, 'Puntaje de forma de los tres resultados vigentes (citado en el cap. 9): 88, 75, 75', pts, [88, 75, 75]);
  T.eq(G, 'RA2 y RA3 vigentes tienen 53 y 49 palabras (citado en el cap. 9)', [A.nPalabras(ras[1].t), A.nPalabras(ras[2].t)], [53, 49]);
  T.eq(G, 'Verbos y niveles: aplicar 3, diseñar 6, liderar 3', ras.map((r) => A.analizar(r.t).nivel), [3, 6, 3]);
  /* PEP (borrador 2023-2024): los resultados de H.RA0 son los del PEP y el PEP contiene lo que el cap. 9 afirma */
  const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase();
  const pep = norm(fs.readFileSync(path.join(__dirname, 'fuentes', 'pep_ingenieria_fisica.txt'), 'utf8'));
  ras.forEach((r, i) => T.ok(G, `RA${i + 1} figura en el PEP con la redacción «Los estudiantes serán capaces de…»`, pep.includes('los estudiantes seran capaces de ' + norm(r.t).replace(/\.$/, '').slice(0, 220))));
  T.ok(G, 'El PEP contiene la sección «Resultados de Aprendizaje»', pep.includes('resultados de aprendizaje teniendo en cuenta el perfil del egresado'));
  T.ok(G, 'El PEP dice «se propone una modificación del Proyecto Educativo del Programa que incluya estos resultados»', pep.includes('se propone una modificacion del proyecto educativo del programa que incluya estos resultados de aprendizaje'));
  T.ok(G, 'El PEP fija evaluación semestral a cargo del comité de programa', pep.includes('sera semestral y esta a cargo del comite de programa'));
  const o4 = 'formar personas con integridad etica, pertinencia e idoneidad profesional';
  T.ok(G, 'El objetivo específico 4 del PEP (ética) existe y ningún resultado menciona ética ni integridad', pep.includes(o4) && ras.every((r) => !/etic|integridad/.test(norm(r.t))));
  T.ok(G, 'El objetivo específico 3 y RA3 comparten la expresión «liderar procesos de desarrollo disciplinar e interdisciplinar»', pep.includes('liderar procesos de desarrollo disciplinar e interdisciplinar, mediante la participacion en actividades de investigacion y pasantias') && norm(ras[2].t).includes('liderar procesos de desarrollo disciplinar e interdisciplinar'));
  T.ok(G, 'El PEP conserva notas pendientes («PEDIR A COORDINADOR»)', pep.includes('pedir a coordinador'));
  T.ok(G, 'El PEP conserva texto de la guía («Escribir en este numeral»)', pep.includes('escribir en este numeral'));
  T.ok(G, 'La portada del PEP dice 2024', /2024proyecto educativo/.test(pep.replace(/ /g, '').replace(/\s/g, '')) || pep.includes('2024proyecto educativo'));
  /* Resumen de la reunión con los pares (notas del audio) */
  const reu = norm(fs.readFileSync(path.join(__dirname, 'fuentes', 'reunion_pares.txt'), 'utf8'));
  T.ok(G, 'La reunión: los pares dicen que el programa no tiene formulados los resultados y es requisito normativo', reu.includes('el programa no los tiene formulados; falta definir como se implementan y se evaluan. es un requisito normativo'));
  T.ok(G, 'La reunión: el programa responde con un formato de evaluación y de organización de las competencias', reu.includes('crear un formato de evaluacion y de organizacion de las competencias'));
  T.ok(G, 'La reunión: es el único punto tratado como carencia normativa', reu.includes('unico punto que los pares trataron como carencia normativa'));
  /* Hallazgos del escaneo de los documentos (tools/escanear_programa.py) */
  const H = JSON.parse(fs.readFileSync(path.join(__dirname, 'fuentes', 'programa_hallazgos.json'), 'utf8'));
  T.eq(G, 'Microcurrículos leídos: 49 (29 Word y 20 PDF)', [H.microcurriculos.archivos_leidos, H.microcurriculos.docx, H.microcurriculos.pdf], [49, 29, 20]);
  T.eq(G, 'Microcurrículos que mencionan «resultados de aprendizaje»: 0', H.microcurriculos.con_menciones_de_RA, 0);
  T.eq(G, 'Archivos .doc antiguos no leídos: 4', H.microcurriculos.doc_antiguos_sin_leer, 4);
  T.eq(G, 'Actas del comité: 8, ninguna menciona resultados de aprendizaje ni microcurrículos', [H.actas.archivos, H.actas.con_RA, H.actas.con_microcurriculos], [8, 0, 0]);
  T.ok(G, 'Las actas tienen menos de 1 100 caracteres (plantilla sin desarrollo)', H.actas.max_caracteres < 1100);
  /* Matriz con los tres resultados: sin alertas de secuencia y sin sobrecarga con las marcas derivadas */
  const LV = { '': 0, I: 1, R: 2, M: 3 }, LN = ['', 'I', 'R', 'M'];
  const mx = (a) => LN[Math.max(0, ...a.map((v) => LV[v || '']))];
  const filas = cursos.map(([n, sem, m]) => {
    const r9 = Array(9).fill('');
    m.split(',').filter(Boolean).forEach((p) => { const [r, v] = p.split(':'); r9[+r.replace('RA', '') - 1] = v; });
    return { n, sem, m: [r9[0], mx(r9.slice(1, 6)), mx(r9.slice(6, 9))] };
  });
  const an = A.analizarMatriz(filas, 3, filas.map((f) => f.m));
  T.eq(G, 'Matriz con tres resultados: cobertura 100 %', an.cobertura, 1);
  /* Ejercicio del cap. 10: quitar las M de RA2 deja a RA2 sin dominio */
  const sin = filas.map((f) => ({ n: f.n, sem: f.sem, m: [f.m[0], f.m[1] === 'M' ? '' : f.m[1], f.m[2]] }));
  const nM = filas.filter((f) => f.m[1] === 'M').map((f) => f.n);
  T.eq(G, 'RA2 se domina en 3 cursos (cap. 10): Diseño de Experimentos, Gestión Tecnológica y Trabajo de Grado II', nM, ['Diseño de Experimentos en Ingeniería', 'Gestión Tecnológica', 'Trabajo de Grado II']);
  T.ok(G, 'Sin las M de RA2 aparece la alerta «nunca se llega a dominio»', A.analizarMatriz(sin, 3, sin.map((f) => f.m)).porRA[1].prob.indexOf('nunca se llega a dominio (M)') >= 0);
  /* Ejercicio del cap. 6: con los tres resultados, ABET deja sin cubrir los elementos 2 y 4 */
  const mapReal = { RA1: [0], RA2: [5, 2], RA3: [4, 6] };
  const cub = new Set(Object.values(mapReal).flat());
  T.eq(G, 'ABET con los tres resultados: sin cubrir los elementos 2 y 4 (índices 1 y 3)', [0, 1, 2, 3, 4, 5, 6].filter((i) => !cub.has(i)), [1, 3]);
};
