/* ===================================================================
   41-herr-norma.js — línea normativa, lector de norma, escalera conceptual, ciclo de mejora
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const H = EM.H;
  const A = EM.calc.ra;

  /* ---------- Línea normativa: qué norma rige en una fecha dada ---------- */
  const NORMAS = [
    { n: 'Ley 30 de 1992', aporta: 'Organiza la educación superior y crea el Sistema Nacional de Acreditación. No habla de resultados de aprendizaje, pero es la base legal de todo lo demás.' },
    { n: 'Ley 1188 de 2008', aporta: 'Regula el registro calificado, obligatorio para ofrecer un programa. Fija la lógica de condiciones de calidad.' },
    { n: 'Decreto 1075 de 2015', aporta: 'Decreto Único Reglamentario del Sector Educación. Los decretos posteriores sobre registro calificado modifican su Título 3, Parte 5, Libro 2.' },
    { n: 'Decreto 1330 de 2019', aporta: 'Introduce los resultados de aprendizaje en el registro calificado: política académica (art. 2.5.3.2.3.1.3), aspectos curriculares (2.5.3.2.3.2.4) y crédito académico (2.5.3.2.4.1).' },
    { n: 'Acuerdo CESU 02 de 2020', aporta: 'Modelo de acreditación vigente en la visita de pares de 2026. Factor 5 «Aspectos académicos y resultados de aprendizaje», características 18 a 25.' },
    { n: 'Resolución 21795 de 2020 (MEN)', aporta: 'Su art. 12 enumeraba diez requisitos para formular los resultados de aprendizaje. Está derogada, pero sigue siendo el mejor referente técnico.' },
    { n: 'Decreto 1649 de 2021', aporta: 'Adopta el Marco Nacional de Cualificaciones, de ocho niveles, con descriptores de conocimientos, destrezas y autonomía. Sirve para calibrar el nivel de los resultados.' },
    { n: 'Resolución 2265 de 2023 (MEN)', aporta: 'Derogó la Resolución 21795 de 2020. Vigente entre el 31-mar-2023 y el 29-abr-2024.' },
    { n: 'Decreto 529 de 2024', aporta: 'Modifica parcialmente el Capítulo 2 (registro calificado), sobre todo el trámite; no toca los artículos curriculares del Decreto 1330. Deroga las Resoluciones 15178 de 2022 y 2265 de 2023. Para la renovación exige evidenciar el avance a partir de la autoevaluación y los planes de mejoramiento.' },
    { n: 'Acuerdo CESU 01 de 2025', aporta: 'Nuevo modelo de acreditación. El Factor 5 pasa a llamarse «Aspectos académicos y evaluación» y habla de «procesos y resultados académicos». La característica 20 conserva la exigencia de evaluar periódicamente el logro y ajustar el currículo.' }
  ];
  NORMAS.forEach((n) => { n.hit = A.FECHAS[n.n]; });
  const ESTADO = { previa: ['Aún no existía', 'est-prev'], vigente: ['Vigente', 'est-ok'], transicion: ['En transición', 'est-tr'], derogada: ['Derogada', 'est-der'] };
  const estadoEn = A.estadoEn;

  EM.defineSim('linea-normativa', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    const d0 = new Date();
    const hoy = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
    let fecha = hoy < '2019-01-01' ? '2019-01-01' : hoy > '2028-12-31' ? '2028-12-31' : hoy;
    const bar = el('div', 'h-bar');
    const inp = H.input(bar, { label: 'Fecha de consulta', type: 'date', value: fecha, min: '1992-12-28', max: '2030-12-31', onInput: (v) => { if (v) { fecha = v; draw(); } } });
    const pre = el('div', 'ctrl-row');
    [['Hoy', hoy], ['Cuando se expidió el Decreto 1330', '2019-07-25'], ['Visita de pares (nov. 2026)', '2026-11-06'], ['Autoevaluación bajo el nuevo modelo', '2027-01-01'], ['Renovaciones bajo el nuevo modelo', '2027-06-01']].forEach(([t, d]) => H.btn(pre, t, () => { fecha = d; inp.value = d; draw(); }));
    bar.append(pre);
    panel.append(bar);
    const out = el('div', 'tablewrap');
    panel.append(out);
    function draw() {
      let h = '<table class="norma"><tr><th>Norma</th><th>Estado en la fecha</th><th>Qué aporta sobre los resultados de aprendizaje</th></tr>';
      NORMAS.forEach((n) => {
        const [s, nota] = estadoEn(n.hit, fecha);
        const [lab, cls] = ESTADO[s];
        h += `<tr class="${s === 'previa' ? 'dim' : ''}"><td><b>${H.esc(n.n)}</b></td><td><span class="est ${cls}">${lab}</span>${nota ? `<small class="est-n">${H.esc(nota)}</small>` : ''}</td><td>${H.esc(n.aporta)}</td></tr>`;
      });
      out.innerHTML = h + '</table>';
    }
    draw();
  });

  /* ---------- Lector de norma: qué dice, dónde ---------- */
  const TEXTOS = [
    { f: 'Decreto 1330 de 2019 (considerandos)', ref: 'Considerandos', tag: 'Definición', est: 'vigente', t: 'Define los resultados de aprendizaje como «las declaraciones expresas de lo que se espera que un estudiante conozca y demuestre en el momento de completar su programa académico». Añade que deben ser coherentes con la formación integral y la formación a lo largo de la vida, y estar alineados con el perfil de egreso del programa.', p: 'Un resultado de aprendizaje es una promesa pública y verificable sobre el egresado, no una lista de temas.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 1330 de 2019', ref: 'Art. 2.5.3.2.3.1.3, lit. b', tag: 'Registro calificado', est: 'vigente', t: 'Entre las políticas institucionales que la institución debe demostrar (existencia, implementación, aplicación y resultados) figuran las políticas académicas asociadas a currículo, resultados de aprendizaje, créditos y actividades.', p: 'Antes de hablar del programa, la Universidad debe tener una política de resultados de aprendizaje. El programa se apoya en ella.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 1330 de 2019', ref: 'Art. 2.5.3.2.3.2.4, lit. a', tag: 'Registro calificado', est: 'vigente', t: 'Los componentes formativos incluyen el plan general de estudios, que debe estar representado en créditos académicos «conforme con los resultados de aprendizaje proyectados», la formación integral, la flexibilidad curricular y los perfiles de egreso.', p: 'Los créditos y el plan de estudios se justifican por los resultados de aprendizaje, no al revés.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 1330 de 2019', ref: 'Art. 2.5.3.2.3.2.4, lit. e', tag: 'Evaluación', est: 'vigente', t: 'Los mecanismos de evaluación son los instrumentos de medición y seguimiento que permiten hacer los análisis necesarios para tomar decisiones oportunas con el fin de mejorar el desempeño de profesores y estudiantes con relación a los resultados de aprendizaje establecidos en el programa.', p: 'No basta con calificar: hay que poder decir cuánto del resultado se logra y usar esa información.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 1330 de 2019', ref: 'Art. 2.5.3.2.4.1', tag: 'Créditos', est: 'vigente', t: 'El crédito académico es la unidad de medida del trabajo académico del estudiante y expresa el esfuerzo para alcanzar los resultados de aprendizaje previstos. Equivale a 48 horas por periodo académico; la institución determina y justifica la proporción entre horas con el profesor y trabajo independiente.', p: 'Cada asignatura debe poder explicar por qué 3 o 4 créditos son los necesarios para lograr sus resultados.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 529 de 2024', ref: 'Art. 2.5.3.2.3.2.12', tag: 'Registro calificado', est: 'vigente', t: 'La solicitud de renovación del registro calificado se presenta con no menos de doce meses de antelación al vencimiento. La institución debe evidenciar el cumplimiento de cada condición de calidad de programa y el avance del programa a partir de la autorregulación, la autoevaluación y/o el diseño, aplicación y resultados de planes de mejoramiento en la última vigencia.', p: 'Los planes de mejoramiento deben tener resultados. El Ministerio quiere ver la historia, no solo el plan.' },
    { f: 'Decreto 1075 de 2015, modificado por el Decreto 529 de 2024', ref: 'Art. 2.5.3.2.9.2', tag: 'Acreditación', est: 'vigente', t: 'Cuando se otorga o renueva la acreditación en alta calidad de un programa, el acto administrativo ordena de oficio la renovación del registro calificado: por siete años, o por el tiempo de la acreditación si este es mayor.', p: 'Acreditarse simplifica el registro calificado: es una razón práctica más para hacerlo bien.' },
    { f: 'Resolución 21795 de 2020 (derogada)', ref: 'Art. 12, lit. b', tag: 'Definición', est: 'derogada', t: 'Pedía que los resultados de aprendizaje hicieran referencia a lo que el estudiante sabrá, comprenderá y será capaz de hacer. Entre los diez requisitos: favorecer procesos centrados en lo que el estudiante aprenderá; ser claros para estudiantes y profesores; ser claros, concretos y verificables; establecer niveles de aprendizaje desde el ingreso hasta el egreso; incluir una clasificación o taxonomía; estar alineados con el plan general de estudios y el perfil de egreso; y ser comunicados a los estudiantes.', p: 'Aunque esté derogada, es la mejor lista de control disponible para redactar y revisar resultados. Úsela como guía, no como obligación legal.' },
    { f: 'Resolución 21795 de 2020 (derogada)', ref: 'Art. 13 y art. 58', tag: 'Evidencias', est: 'derogada', t: 'Como evidencias pedía: el proceso de definición y análisis de los resultados con sus referentes conceptuales, los resultados expresados en lo que el estudiante sabrá y será capaz de hacer, su articulación con el plan de estudios, el perfil de egreso y los medios de comunicación a los estudiantes. En la renovación pedía además los resultados de las evaluaciones realizadas a los resultados de aprendizaje del programa.', p: 'Dice con claridad qué documentos prepara un programa serio. Esa lista sigue siendo útil.' },
    { f: 'Acuerdo CESU 02 de 2020', ref: 'Numeral 2.2, lit. a', tag: 'Definición', est: 'transicion', t: 'Los resultados de aprendizaje son «el eje de un proceso de mejoramiento» en el que se evalúa el grado en que el estudiante se acerca a los resultados definidos y, a partir de ello, se ajustan los aspectos curriculares. Se establecen teniendo en cuenta las tendencias de las disciplinas, el perfil de formación, la naturaleza, el nivel y la modalidad del programa, y los estándares internacionales. Se definen para un programa académico específico.', p: 'Dos ideas clave: son de cada programa (no de la Facultad ni de la Universidad) y sirven para mejorar, no para decorar un documento.' },
    { f: 'Acuerdo CESU 02 de 2020', ref: 'Numeral 2.2, lit. b', tag: 'Definición', est: 'transicion', t: 'Las competencias son conjuntos articulados de conocimientos, capacidades, habilidades, disposiciones, actitudes y aptitudes que permiten comprender y analizar problemas y actuar de forma coherente y eficaz; son susceptibles de ser evaluadas mediante resultados de aprendizaje y le pertenecen al individuo, que las sigue desarrollando.', p: 'La competencia es la capacidad; el resultado de aprendizaje es la forma de evaluarla.' },
    { f: 'Acuerdo CESU 02 de 2020', ref: 'Factor 5, características 18 y 22', tag: 'Evaluación', est: 'transicion', t: 'El desempeño de los estudiantes se hace evidente mediante el logro de resultados de aprendizaje definidos previamente, que responden a las competencias necesarias para el desempeño laboral. El sistema de evaluación debe valorar periódica o permanentemente el logro de los resultados, según los aspectos curriculares, el nivel y la modalidad.', p: 'La evaluación en cada asignatura debe poder conectarse con un resultado del programa.' },
    { f: 'Acuerdo CESU 02 de 2020', ref: 'Factor 5, característica 23 «Resultados de aprendizaje»', tag: 'Mejora', est: 'transicion', t: 'El programa debe demostrar un proceso de mejoramiento continuo en el que se evalúa, de manera periódica y en diferentes momentos a lo largo del plan de estudios, el grado en que los estudiantes alcanzan los resultados de aprendizaje y, con base en esa evaluación, se toman acciones de ajuste a los aspectos curriculares y a las metodologías de enseñanza-aprendizaje.', p: 'Esta es la característica que más pesa en la conversación con los pares: periódica, en varios momentos del plan, con acciones de ajuste.' },
    { f: 'Acuerdo CESU 02 de 2020', ref: 'Factor 5, características 24 y 25', tag: 'Mejora', est: 'transicion', t: 'El programa define de forma explícita las competencias que pretende desarrollar y demuestra coherencia entre ellas, el nivel de formación, los resultados de aprendizaje y los demás aspectos curriculares (24). Evalúa periódicamente, entre otros aspectos, el grado en que los estudiantes alcanzan los resultados de aprendizaje y la pertinencia de los contenidos (25).', p: 'Coherencia: competencias, resultados, currículo y evaluación deben contarse como una sola historia.' },
    { f: 'Acuerdo CESU 01 de 2025', ref: 'Numeral 2.2, lit. a, y art. 12', tag: 'Acreditación', est: 'transicion', t: 'Habla de «procesos y resultados académicos o de la formación»: independientemente del enfoque pedagógico que cada institución adopte, los resultados académicos declarados deben evidenciarse a través de los procesos de enseñanza y aprendizaje, y dar cuenta de la mejora continua, la actualización curricular y el grado de desarrollo de las competencias, capacidades, habilidades y/o destrezas esperadas.', p: 'El nuevo modelo amplía el foco: no solo resultados al final, también los procesos que llevan a ellos.' },
    { f: 'Acuerdo CESU 01 de 2025', ref: 'Factor 5, características 19 a 21', tag: 'Mejora', est: 'transicion', t: 'La característica 20 exige un proceso de mejoramiento permanente en el que se evalúe periódicamente, y en diferentes momentos del plan de estudios, el grado de logro de los procesos y resultados académicos previstos y se tomen acciones de ajuste curricular y metodológico. La 21 pide coherencia entre las competencias, capacidades, habilidades y/o destrezas, los procesos y resultados académicos y los demás aspectos curriculares definidos en el proyecto educativo.', p: 'Es el mismo ciclo de siempre con vocabulario nuevo. Un programa que ya cierra el ciclo está listo para ambos modelos.' },
    { f: 'Acuerdo CESU 01 de 2025', ref: 'Art. 68 y art. 73', tag: 'Acreditación', est: 'transicion', t: 'Aplicación gradual: para apreciación de condiciones iniciales, desde el 1-ene-2026; para informes de autoevaluación con fines de acreditación de programas, desde el 1-ene-2027; para renovaciones de acreditación, desde el 1-jun-2027. El art. 73 deroga los Acuerdos 02 de 2020 y 04 de 2022.', p: 'Para su programa en 2026 se aplica el modelo anterior; las renovaciones futuras serán con el nuevo.' }
  ];
  EM.defineSim('lector-norma', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    const tags = ['Todas'].concat(Array.from(new Set(TEXTOS.map((x) => x.tag))));
    let tag = 'Todas', q = '';
    const bar = el('div', 'h-bar');
    H.select(bar, { label: 'Tema', options: tags.map((t) => [t, t]), value: 'Todas', onInput: (v) => { tag = v; draw(); } });
    H.input(bar, { label: 'Buscar', type: 'search', ph: 'p. ej. periódica, crédito, taxonomía…', onInput: (v) => { q = A.norm(v); draw(); } });
    panel.append(bar);
    const list = el('div', 'h-cards');
    panel.append(list);
    function draw() {
      const rows = TEXTOS.filter((x) => (tag === 'Todas' || x.tag === tag) && (!q || A.norm(x.f + ' ' + x.ref + ' ' + x.t + ' ' + x.p).includes(q)));
      list.innerHTML = rows.length ? rows.map((x) => {
        const [lab, cls] = ESTADO[x.est];
        return `<article class="h-card"><header><b>${H.esc(x.f)}</b><span class="est ${cls}">${lab}</span></header><div class="h-ref">${H.esc(x.ref)} · ${H.esc(x.tag)}</div><p>${H.esc(x.t)}</p><p class="h-prac"><b>En la práctica:</b> ${H.esc(x.p)}</p></article>`;
      }).join('') : '<p class="ctrl-note">Sin coincidencias.</p>';
    }
    draw();
  });

  /* ---------- Escalera conceptual: ¿qué es cada enunciado? ---------- */
  const CAT = [['obj', 'Objetivo'], ['comp', 'Competencia'], ['rap', 'RA del programa'], ['rac', 'RA de la asignatura'], ['ind', 'Indicador de desempeño'], ['evi', 'Evidencia'], ['niv', 'Descriptor de nivel']];
  const ITEMS = [
    { t: 'Formar profesionales idóneos y con integridad ética que desarrollen y apliquen los conocimientos científicos en el campo de la Ingeniería Física.', a: 'obj', e: 'Dice lo que se propone el programa, desde el punto de vista institucional. No describe lo que el estudiante demuestra, y no se puede calificar a un estudiante con él.' },
    { t: 'Capacidad de plantear y resolver problemas de ingeniería movilizando conocimientos, habilidades y actitudes, que la persona sigue desarrollando a lo largo de su vida.', a: 'comp', e: 'Es una capacidad amplia y duradera, que «le pertenece al individuo» (Acuerdo 02 de 2020). No se evalúa directamente: se evalúa a través de resultados.' },
    { t: 'Diseña, ejecuta y analiza experimentos y mediciones, estimando incertidumbres con criterios metrológicos y documentando los resultados con trazabilidad.', a: 'rap', e: 'Es observable, está en lenguaje de egresado, es amplio (se desarrolla en varios cursos) y pertenece al programa.' },
    { t: 'Al finalizar Instrumentación, el estudiante calibra un sensor de temperatura con patrones trazables y reporta la incertidumbre de la calibración.', a: 'rac', e: 'Es específico de una asignatura, evaluable en un semestre y contribuye al resultado del programa sobre medición.' },
    { t: 'Calcula la incertidumbre combinada de la medición incluyendo al menos tres fuentes.', a: 'ind', e: 'Describe una conducta puntual dentro del resultado, con un criterio claro («al menos tres fuentes»). Es lo que se mira en la rúbrica.' },
    { t: 'Informe del laboratorio 4 con la hoja de cálculo de incertidumbres, calificado con la rúbrica de medición.', a: 'evi', e: 'Es un producto concreto del estudiante (más su valoración) del que se infiere el logro. Es lo que se guarda y se muestra a los pares.' },
    { t: 'Sobresaliente: identifica y cuantifica todas las fuentes relevantes de incertidumbre y justifica las que descarta.', a: 'niv', e: 'Describe un grado de calidad dentro de un criterio de la rúbrica. Es lo que permite distinguir un desempeño de otro.' },
    { t: 'Presentar los fundamentos de la metrología y de la teoría de errores.', a: 'obj', e: 'Describe lo que hace el docente (presentar), no lo que el estudiante logra. Es un objetivo de enseñanza, no un resultado de aprendizaje.' },
    { t: 'Comunica resultados técnicos de forma oral y escrita, en español y en una segunda lengua, y participa o lidera equipos disciplinares e interdisciplinares con responsabilidad.', a: 'rap', e: 'Se desarrolla a lo largo de todo el plan de estudios y reúne varias conductas: por eso es del programa, no de una asignatura.' }
  ];
  EM.defineSim('escalera', function (sim) {
    sim.below();
    const panel = H.panel(sim);
    let i = 0, ok = 0, ans = 0, fb = null;
    const card = el('div', 'h-quiz');
    panel.append(card);
    function draw() {
      if (i >= ITEMS.length) {
        card.innerHTML = `<h4>Resultado</h4><p class="h-big">${ok} de ${ITEMS.length}</p><p>${ok >= 8 ? 'Dominas la escalera conceptual.' : ok >= 5 ? 'Vas bien. Repasa las diferencias entre objetivo, resultado e indicador.' : 'Conviene releer el capítulo y volver a intentarlo.'}</p>`;
        H.btn(card, 'Volver a empezar', () => { i = 0; ok = 0; fb = null; draw(); }, 'primary');
        return;
      }
      const it = ITEMS[i];
      card.innerHTML = `<div class="h-q-n">Enunciado ${i + 1} de ${ITEMS.length}</div><blockquote class="h-q">${H.esc(it.t)}</blockquote><div class="h-q-opts"></div><div class="h-fb"></div>`;
      const opts = card.querySelector('.h-q-opts'), fbEl = card.querySelector('.h-fb');
      CAT.forEach(([k, lab]) => {
        const b = H.btn(opts, lab, () => {
          if (fb !== null) return;
          const good = k === it.a;
          fb = good; if (good) ok++;
          opts.querySelectorAll('button').forEach((x) => (x.disabled = true));
          b.classList.add(good ? 'good' : 'bad');
          if (!good) { const gb = Array.from(opts.children).find((x) => x.textContent === CAT.find((c) => c[0] === it.a)[1]); if (gb) gb.classList.add('good'); }
          fbEl.innerHTML = `<p><b>${good ? 'Correcto.' : 'No exactamente.'}</b> Es: ${CAT.find((c) => c[0] === it.a)[1].toLowerCase()}. ${H.esc(it.e)}</p>`;
          H.btn(fbEl, i === ITEMS.length - 1 ? 'Ver resultado' : 'Siguiente', () => { i++; fb = null; draw(); }, 'primary');
        });
      });
    }
    draw();
  });

  /* ---------- El ciclo de mejora: qué se hace, qué queda, qué preguntan ---------- */
  const PASOS = [
    { n: 'Definir', d: 'El programa fija sus resultados de aprendizaje a partir del perfil de egreso, los referentes y los grupos de interés.', ev: 'Documento de resultados con su proceso de construcción y actas de participación.', q: '¿Cómo definieron estos resultados y quién participó?' },
    { n: 'Alinear', d: 'Cada asignatura declara a qué resultados contribuye y en qué nivel (introduce, refuerza, domina).', ev: 'Matriz curricular y sílabos con resultados de asignatura.', q: '¿Dónde se desarrolla este resultado en el plan de estudios?' },
    { n: 'Enseñar y evaluar', d: 'Las actividades y los instrumentos (rúbricas, proyectos, exámenes) están diseñados para producir evidencia del resultado.', ev: 'Instrumentos de evaluación, rúbricas, guías de laboratorio.', q: '¿Cómo saben que un estudiante alcanzó el resultado?' },
    { n: 'Recoger evidencia', d: 'Se guardan muestras de trabajo evaluado y los datos de logro, en momentos definidos del plan de estudios.', ev: 'Muestras de trabajos, reportes de logro por cohorte.', q: '¿Puedo ver trabajos de estudiantes y los datos de las últimas cohortes?' },
    { n: 'Analizar', d: 'Se compara el logro con metas previas, se buscan brechas y causas, y se discuten en el comité curricular.', ev: 'Informe de análisis y actas del comité curricular.', q: '¿Qué encontraron y qué hicieron con ello?' },
    { n: 'Actuar', d: 'Se ajustan currículo, metodologías o recursos, y se vuelve a medir el efecto en el siguiente ciclo.', ev: 'Plan de mejoramiento con responsables, fechas y verificación de resultados.', q: '¿Qué cambió en el programa a raíz de esos resultados?' }
  ];
  EM.defineSim('ciclo-mejora', function (sim) {
    const cv = sim.canvas({ aspect: 1.35, label: 'Ciclo de mejora continua de los resultados de aprendizaje' });
    let sel = 0, cerrado = true;
    sim.group('Paso');
    sim.select('paso', { label: '', options: PASOS.map((p, i) => [i, (i + 1) + '. ' + p.n]), value: 0, onInput: (v) => { sel = +v; show(); } });
    sim.check('cerrado', { label: 'El ciclo se cierra (el último paso retroalimenta al primero)', value: true, onInput: (v) => { cerrado = v; show(); } });
    sim.out('que', 'Qué se hace', {}); sim.out('ev', 'Qué evidencia queda', {}); sim.out('q', 'Lo que pregunta el par', { hl: true }); sim.out('estado', 'Estado del ciclo', {});
    function show() {
      const p = PASOS[sel];
      sim.set('que', H.esc(p.d)); sim.set('ev', H.esc(p.ev)); sim.set('q', '«' + H.esc(p.q) + '»');
      sim.set('estado', cerrado ? 'Ciclo cerrado: lo aprendido cambia lo que se define y enseña.' : 'Ciclo abierto: se mide y se archiva, pero nada cambia. Es lo que más reprochan los pares.');
      sim.redraw();
    }
    const pos = (i, w, h) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / PASOS.length; return [w / 2 + Math.cos(a) * w * 0.32, h / 2 + Math.sin(a) * h * 0.34]; };
    sim.onDraw(() => {
      const { ctx, w, h } = cv;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(0, 0, w, h);
      const r = Math.min(w, h) * 0.085;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < PASOS.length; i++) {
        const j = (i + 1) % PASOS.length;
        if (j === 0 && !cerrado) continue;
        const [x1, y1] = pos(i, w, h), [x2, y2] = pos(j, w, h);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const sx = x1 + Math.cos(ang) * (r + 4), sy = y1 + Math.sin(ang) * (r + 4), ex = x2 - Math.cos(ang) * (r + 8), ey = y2 - Math.sin(ang) * (r + 8);
        ctx.strokeStyle = EM.col('--axis'); ctx.fillStyle = EM.col('--axis');
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.45) * 10, ey - Math.sin(ang - 0.45) * 10); ctx.lineTo(ex - Math.cos(ang + 0.45) * 10, ey - Math.sin(ang + 0.45) * 10); ctx.closePath(); ctx.fill();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      PASOS.forEach((p, i) => {
        const [x, y] = pos(i, w, h), on = i === sel;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = on ? EM.col('--accent') : EM.col('--surface'); ctx.fill();
        ctx.lineWidth = on ? 3 : 1.6; ctx.strokeStyle = on ? EM.col('--accent') : EM.col('--rule-strong'); ctx.stroke();
        ctx.fillStyle = on ? EM.col('--accent-ink') : EM.col('--ink'); ctx.font = H.fontUI(Math.max(11, r * 0.34), 700);
        ctx.fillText(String(i + 1), x, y - r * 0.18);
        ctx.font = H.fontUI(Math.max(10, r * 0.27), 600);
        ctx.fillText(p.n.length > 12 ? p.n.split(' ')[0] : p.n, x, y + r * 0.28);
      });
      ctx.fillStyle = EM.col('--ink-3'); ctx.font = H.fontUI(Math.max(11, w * 0.022), 500);
      ctx.fillText(cerrado ? 'Mejora continua' : 'Ciclo abierto', w / 2, h / 2);
    });
    cv.el.addEventListener('click', (e) => {
      const b = cv.el.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      let best = -1, bd = 1e9;
      PASOS.forEach((_, i) => { const [px, py] = pos(i, cv.w, cv.h); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } });
      if (bd < Math.min(cv.w, cv.h) * 0.12) { sel = best; sim.ctl.paso.set(best, true); show(); }
    });
    show();
  });
})();
