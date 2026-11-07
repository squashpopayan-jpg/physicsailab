/* Pausas de repaso: una pregunta dentro de cada lección.
   Formato: q = enunciado; ok = respuesta correcta; no = tres distractores; e = explicación; r = lección para repasar.
   El orden de las opciones se baraja al mostrarlas. */
window.PEC = window.PEC || {};
window.PEC.Q = { checks: {}, quiz: {}, exam: [] };
(function (C) {
  /* ===== Lección 1 · ¿Qué es el PEC? ===== */
  C.c01a = { r: 'pec', q: '¿Con qué universidad se hizo en 2025 el Diplomado en Fundamentación del PEC?',
    ok: 'Universidad del Valle', no: ['Universidad del Cauca', 'Universidad Nacional', 'Universidad de Antioquia'],
    e: 'El diplomado se hizo con la Universidad del Valle. Participaron maestros, autoridades y el programa Raíz y Retoño.' };
  C.c01b = { r: 'pec', q: 'Según la cartilla, el PEC es…',
    ok: 'un proceso de construcción participativa y colectiva', no: ['un reglamento escrito por el Ministerio de Educación', 'un horario de clases que no cambia', 'un papel guardado en un cajón'],
    e: 'La cartilla dice que el PEC es un proceso de construcción participativa y colectiva, y que no es «un papel guardado en un cajón» sino el modo de enseñar y aprender siendo Nasa.' };
  C.c01c = { r: 'pec', q: 'La palabra «Nasa» significa…',
    ok: 'Ser en general: la persona, la gente y los demás seres', no: ['solo las personas que viven en el resguardo', 'solo las personas de una misma familia', 'el nombre de la lengua que se habla en la escuela'],
    e: '«Nasa» significa Ser en general. Involucra a las personas y también a plantas, animales, minerales y elementos del cosmos.' };
  C.c01d = { r: 'pec', q: 'Además de las formas propias de aprender y enseñar, el PEC también es…',
    ok: 'diálogo intercultural con otros pueblos, la sociedad mayoritaria y la ciencia', no: ['un rechazo a los saberes de otras culturas y a la ciencia moderna', 'una copia del currículo oficial que envía el Ministerio', 'un proyecto pensado solo para los adultos de la comunidad'],
    e: 'El PEC incluye el diálogo intercultural: el intercambio de saberes y vivencias con otras culturas y pueblos, incluida la sociedad mayoritaria y la ciencia.' };

  /* ===== Lección 2 · Novirao ===== */
  C.c02a = { r: 'novirao', q: '¿Cuál es la máxima autoridad en el territorio de Novirao?',
    ok: 'La asamblea general de la comunidad', no: ['El Cabildo Indígena, sin tutela de nadie', 'Cada una de las cinco juntas por separado', 'El rector de la Institución Educativa'],
    e: 'El Cabildo gobierna, pero lo hace bajo la tutela de la asamblea general, que es la máxima autoridad.' };
  C.c02b = { r: 'novirao', q: '¿Qué grupo de edad es el más numeroso en Novirao, según el censo de 2024?',
    ok: 'Niños, niñas y adolescentes (48,4 %)', no: ['Adultos jóvenes de 20 a 44 años (33,8 %)', 'Adultos de 45 a 64 años (12 %)', 'Adultos mayores de 65 a 90 años (5,6 %)'],
    e: 'Casi la mitad de la población (48,4 %) es menor de 19 años. Por eso la cartilla dice que la educación es fundamental para la pervivencia.' };
  C.c02c = { r: 'novirao', q: 'Raíz y Retoño de Vida acompaña la formación de…',
    ok: 'las semillas: niños y niñas de 0 a 5 años', no: ['los jóvenes de décimo y grado once del colegio', 'los adultos mayores de 65 años de las cinco juntas', 'las autoridades y los sabedores del Cabildo'],
    e: 'Raíz y Retoño de Vida es el proceso de primera infancia: acompaña a las «semillas», niños y niñas de 0 a 5 años.' };
  C.c02d = { r: 'novirao', q: '¿Cuál es el producto principal que las familias llevan al mercado?',
    ok: 'El café', no: ['El maíz', 'La yuca', 'El plátano'],
    e: 'El café es el producto principal para el mercado. La yuca, el plátano, el maíz y el fríjol acompañan, y gallinas y cerdos son para el consumo.' };

  /* ===== Lección 3 · La lucha por la tierra ===== */
  C.c03a = { r: 'tierra', q: 'El terraje fue…',
    ok: 'trabajo gratuito en las haciendas por un pedazo de tierra', no: ['un impuesto en dinero que se pagaba al Cabildo cada año', 'un tipo de cultivo de café para el mercado', 'una ley que repartía tierras gratis a todas las familias'],
    e: 'La cartilla lo llama «una esclavitud disfrazada»: las familias cultivaban un pedacito de tierra pero pagaban con trabajo gratuito varias lunas al año.' };
  C.c03b = { r: 'tierra', q: '¿Qué hizo la comunidad entre 1974 y 1976?',
    ok: 'Se organizó en mingas nocturnas y arrancó las pineras', no: ['Compró las tierras a la empresa Reforestadora S.A.', 'Fundó el Cabildo Indígena y eligió gobernador', 'Construyó la primera escuela oficial en Belén'],
    e: 'Entre 1974 y 1976 hubo mingas nocturnas para arrancar las pineras que la Reforestadora S.A. había sembrado.' };
  C.c03c = { r: 'tierra', q: '¿A qué luchas más amplias se unió la lucha de Novirao?',
    ok: 'A las de los Misak, a Quintín Lame y al proceso del CRIC', no: ['Solo a las luchas de otros resguardos de Tierradentro', 'A los planes de reforestación de la Reforestadora S.A.', 'A ninguna otra: fue una lucha solitaria de Novirao'],
    e: 'La cartilla subraya que las luchas «no fueron solas»: se unieron a los Misak, a Manuel Quintín Lame y al proceso que dio origen al CRIC.' };
  C.c03d = { r: 'tierra', q: 'Según el mayor Julio Cucuñame, educar es también…',
    ok: 'recordar a los que lucharon', no: ['preparar solo para trabajar en la ciudad', 'olvidar el pasado para mirar adelante', 'enseñar únicamente en castellano'],
    e: '«Cada tierra que pisamos en Novirao fue recuperada con trabajo, con sudor y sangre. Educar es también recordar a los que lucharon.»' };

  /* ===== Lección 4 · La historia de la escuela ===== */
  C.c04a = { r: 'escuela', q: '¿Cuál fue la primera forma de escuela en el territorio?',
    ok: 'La iglesia levantada en Belén en 1727', no: ['La primera escuela oficial de 1940', 'La Institución Educativa Indígena de 2005', 'El programa Raíz y Retoño de Vida'],
    e: 'La primera «escuela» no fue un aula sino una iglesia, en Belén, en 1727. Allí enseñaban religión católica y castellano y prohibían las prácticas propias.' };
  C.c04b = { r: 'escuela', q: 'En 2004-2005 se fundó la Institución Educativa Indígena de Novirao con…',
    ok: 'la profesora Magnolia Mosquera y 23 estudiantes de sexto grado', no: ['208 estudiantes de todos los grados, de transición a once', 'el rector Jeann Nilton Campo Ángel y 15 dinamizadores', 'estudiantes de transición hasta grado once y un rector'],
    e: 'Empezó con una primera docente, Magnolia Mosquera, y 23 estudiantes de sexto grado, por gestión del mayor Julio Cucuñame y Faustino Cometa.' };
  C.c04c = { r: 'escuela', q: 'En 2013 ya había colegio propio hasta la media. ¿Qué problema veía la comunidad?',
    ok: 'Seguía siendo un currículo por competencias, ajeno a la cosmovisión', no: ['No había ningún docente de la comunidad en el colegio', 'Solo se enseñaba en Nasa Yuwe y se prohibía el castellano', 'La escuela llegaba únicamente hasta cuarto grado de primaria'],
    e: 'Aunque había colegio propio, seguía bajo los lineamientos del MEN: un currículo por competencias desconectado de la cosmovisión y de la vida comunitaria.' };
  C.c04d = { r: 'escuela', q: '¿Qué paso decisivo hacia la autonomía educativa se dio en 2024-2025?',
    ok: 'La administración de la escuela pasó oficialmente al cabildo', no: ['Se fundó la primera escuela oficial en Belén, bajo los Mosquera', 'Se amplió la cobertura hasta la media vocacional', 'El INCODER entregó las primeras tierras a las familias'],
    e: 'Gracias al diálogo entre el rector, el cabildo y la Junta de Padres de Familia, la administración pasó a manos del cabildo.' };

  /* ===== Lección 5 · Los dos tejidos ===== */
  C.c05a = { r: 'tejidos', q: 'Antes de pensar el PEC, ¿cómo sentía la comunidad su trabajo educativo?',
    ok: 'Un poco suelto, como actividades aisladas', no: ['Completamente centralizado en el Cabildo', 'Sin ningún proyecto productivo', 'Totalmente separado de la escuela'],
    e: 'Ya había proyectos productivos y transversales, pero «todo estaba un poco suelto». Por eso decidieron ponerse de acuerdo y tejerlos.' };
  C.c05b = { r: 'tejidos', q: '¿Qué es el tejido de vida?',
    ok: 'La red de relaciones que une a los ancestros, la gente, el territorio y el universo', no: ['El conjunto de contenidos y competencias del currículo oficial del Ministerio', 'El horario semanal de actividades y descansos de la escuela', 'Una artesanía de lana que se vende en el mercado de Popayán'],
    e: 'El tejido de vida es la red de relaciones que sostiene la vida del pueblo y se expresa en la vida diaria: la tulpa, los rituales, el trabajo y la memoria.' };
  C.c05c = { r: 'tejidos', q: 'El tejido de sabidurías y conocimientos busca…',
    ok: 'organizar los saberes que deben aprender las nuevas generaciones, para pervivir', no: ['reemplazar al tejido de vida con contenidos que vienen de afuera', 'evitar el diálogo con otros pueblos para proteger la cultura propia', 'preparar únicamente a los estudiantes para presentar la prueba del ICFES'],
    e: 'Nace para fortalecer el tejido de vida: organiza saberes, vivencias y prácticas, y dialoga con los conocimientos de la humanidad.' };

  /* ===== Lección 6 · Los cinco hilos ===== */
  C.c06a = { r: 'hilos', q: '¿Qué hilo busca revitalizar el Nasa Yuwe y se articula con la emisora comunitaria?',
    ok: 'Comunicación y Lenguajes', no: ['Derecho Mayor y Gobernanza', 'Bienestar y Deporte', 'Agroambiental'],
    e: 'El hilo de Comunicación y Lenguajes revitaliza el Nasa Yuwe, fortalece la comunicación comunitaria y dialoga con otros idiomas. Se articula con la emisora comunitaria.' };
  C.c06b = { r: 'hilos', q: '¿Con qué programa del cabildo se articula el hilo de Bienestar y Deporte?',
    ok: 'El programa de salud', no: ['Territorio, Ambiente y Producción', 'Familia y jóvenes', 'La emisora comunitaria'],
    e: 'Bienestar y Deporte cuida el cuerpo, la salud y la armonía, y se articula con el programa de salud.' };
  C.c06c = { r: 'hilos', q: '¿Cómo deben relacionarse los hilos con los programas del cabildo?',
    ok: 'En diálogo permanente entre todos, sin ligarse rígidamente a uno solo', no: ['Cada hilo con un único programa, sin mezclarse', 'Los hilos reemplazan a los programas del cabildo', 'Solo el hilo de gobernanza se relaciona con el cabildo'],
    e: 'La cartilla aclara que no se trata de articular cada hilo con un solo programa, sino de propiciar un diálogo permanente entre todos los hilos y programas.' };
  C.c06d = { r: 'hilos', q: '¿Qué son los ambientes de aprendizaje que propone el PEC?',
    ok: 'Talleres tipo laboratorio, como biocultura o mecánica', no: ['Aulas tradicionales con filas de pupitres', 'Viajes de estudio a otras ciudades del país', 'Exámenes de Estado que se presentan en grado once'],
    e: 'Son espacios pedagógicos propios, talleres tipo laboratorio, que facilitan la apropiación de conocimientos, saberes, técnicas y prácticas.' };

  /* ===== Lección 7 · Prácticas, vivencias y semilla ===== */
  C.c07a = { r: 'practicas', q: '¿Cuál de estas frases describe mejor una práctica?',
    ok: 'Un ejercicio planificado para adquirir una habilidad específica', no: ['Una expresión ancestral ya incorporada para toda la vida', 'Una fiesta que se celebra una vez al año en la tulpa', 'Un reglamento escrito por el Cabildo para la escuela'],
    e: 'Las prácticas son actividades organizadas, con participación activa, constancia y esfuerzo, para generar aprendizajes.' };
  C.c07b = { r: 'practicas', q: '¿Cuál es una característica de las vivencias?',
    ok: 'Son más permanentes y colectivas, y se manifiestan a largo plazo', no: ['Son ejercicios cortos para aprender una habilidad específica', 'Solo se planean dentro del aula con un horario', 'Se califican con una nota al final de cada periodo escolar'],
    e: 'Las vivencias son expresiones ancestrales ya incorporadas en las personas; generan identidad y sirven para afrontar los desafíos de toda la vida.' };
  C.c07c = { r: 'practicas', q: '¿Cuál es el orden correcto de los momentos de la espiral, de adentro hacia afuera?',
    ok: 'Siembra, germinación, crecimiento, floración, fructificación, nueva semilla', no: ['Germinación, siembra, floración, crecimiento, nueva semilla, fructificación', 'Crecimiento, siembra, germinación, fructificación, floración, nueva semilla', 'Siembra, crecimiento, germinación, nueva semilla, floración, fructificación'],
    e: 'La semilla se siembra, germina, crece, florece, da fruto y se proyecta en una nueva semilla.' };
  C.c07d = { r: 'practicas', q: '¿Por qué los momentos de maduración se representan en espiral y no en círculo?',
    ok: 'Porque la vida nunca se cierra: siempre se abre a nuevas oportunidades', no: ['Porque el círculo es un símbolo prohibido por los mayores', 'Porque la espiral es más fácil de dibujar en el tablero', 'Porque el tiempo siempre vuelve al mismo punto de partida'],
    e: 'La espiral recuerda el movimiento del sol y de la tierra: la vida no se cierra en un círculo, sino que se abre a nuevas oportunidades de florecer y pervivir.' };
  C.c07e = { r: 'practicas', q: '¿En qué estado está el calendario propio, según la cartilla?',
    ok: 'Está pendiente: se proyecta elaborarlo en 2026', no: ['Ya está terminado y se usa en la escuela desde 2013', 'Es el calendario oficial que fija el Ministerio', 'Solo marca las fechas de vacaciones y de exámenes'],
    e: 'El calendario propio ordenará el proceso educativo según los ciclos de la naturaleza y de la vida comunitaria, pero todavía está por elaborar.' };

  /* ===== Lección 8 · La pedagogía como camino ===== */
  C.c08a = { r: 'pedagogia', q: '¿Cuál es la «tensión permanente» que reconoce la comunidad?',
    ok: 'Educación pertinente para el resguardo y para los retos del mundo', no: ['Escoger entre enseñar en castellano o dejar de enseñar', 'Decidir si los jueves se estudia o se descansa en la comunidad', 'Elegir entre la autoridad del Cabildo y la de la asamblea'],
    e: 'La comunidad busca una educación muy pertinente para el resguardo y que, a la vez, permita responder a los desafíos del mundo de hoy.' };
  C.c08b = { r: 'pedagogia', q: '¿Cuál es el orden para aprender que proponen los mayores?',
    ok: 'Primero el territorio, luego el diálogo con otros saberes y al final el servicio', no: ['Primero el diálogo con otras culturas, luego el territorio', 'Primero los contenidos universales, luego la identidad', 'Primero el servicio, luego el diálogo y al final el territorio'],
    e: 'Se parte del conocimiento del territorio (intraculturalidad), se dialoga con otros lugares (interculturalidad) y lo aprendido se pone al servicio de la comunidad.' };
  C.c08c = { r: 'pedagogia', q: '¿Qué es el «significado», en contraste con el «sentido»?',
    ok: 'Lo compartido, lo que se teje en el diálogo', no: ['Lo íntimo, lo que brota del corazón de cada persona', 'La nota final de una materia en el boletín', 'El nombre de una vivencia ancestral'],
    e: 'El sentido es íntimo y personal; el significado es colectivo y comunitario. La educación propia entrelaza los dos.' };
  C.c08d = { r: 'pedagogia', q: 'El «sentido pedagógico» es…',
    ok: 'articular lo que cada quien siente con lo que como pueblo se decide significar', no: ['un método de enseñanza que se aplica igual en todas las clases', 'el orden de los temas que se enseñan durante el año', 'una prueba de comprensión de lectura al final del periodo'],
    e: 'No se trata solo de enseñar: es dar sentido a la vida en comunidad y orientar las prácticas hacia el buen vivir.' };
  C.c08e = { r: 'pedagogia', q: 'El principio del «movimiento» nos recuerda que…',
    ok: 'todo conocimiento, práctica y vivencia está en transformación', no: ['el conocimiento se queda igual durante toda la vida de la persona', 'los estudiantes deben cambiar de colegio cada año', 'la escuela debe permanecer siempre cerrada a los visitantes'],
    e: 'Nada permanece quieto: así como la semilla germina, crece y da fruto, la educación propia avanza en espiral renovando su fuerza.' };

  /* ===== Lección 9 · El tiempo escolar ===== */
  C.c09a = { r: 'tiempo', q: '¿Qué día de la semana se transformó en «escuela comunitaria»?',
    ok: 'El jueves', no: ['El lunes', 'El miércoles', 'El viernes'],
    e: 'Los jueves se transformaron en jueves de escuela comunitaria: 200 estudiantes en cinco grupos heterogéneos de unos 40.' };
  C.c09b = { r: 'tiempo', q: '¿Cuál de estas era una de las cuatro perspectivas por armonizar?',
    ok: 'Las expectativas de madres y padres, a veces centradas en el ICFES', no: ['Las órdenes de la empresa Reforestadora S.A. sobre el colegio', 'Las indicaciones del Banco Mundial para el colegio', 'El calendario académico de las universidades de la región'],
    e: 'Las cuatro miradas son: las semillas, las familias, el cabildo y los mayores, y los maestros y maestras.' };
  C.c09c = { r: 'tiempo', q: 'En la organización actual del jueves, ¿qué hilo ocupa las últimas dos horas?',
    ok: 'Bienestar y Deporte', no: ['Agroambiental', 'Artes y Culturas', 'Comunicación y Lenguajes'],
    e: 'Las dos primeras horas son del hilo Agroambiental, las dos siguientes de Artes y Culturas y las últimas de Bienestar y Deporte, una de las actividades más queridas.' };
  C.c09d = { r: 'tiempo', q: '¿Cómo quedó el hilo de Comunicación y Lenguajes en esa organización?',
    ok: 'Como eje transversal que acompaña a todos los hilos', no: ['Solo ocupa las dos primeras horas de la jornada', 'Se eliminó del plan del jueves comunitario', 'Trabaja únicamente con la Guardia Escolar'],
    e: 'Comunicación y Lenguajes acompaña todos los hilos y promueve la lengua materna y el acercamiento a otros idiomas.' };
  C.c09e = { r: 'tiempo', q: '¿Cómo se llegó al acuerdo nuevo de que toda la institución pase por todos los hilos a la vez?',
    ok: 'Con un diagnóstico con los estudiantes, a partir de sus voces', no: ['Por una decisión del Ministerio de Educación Nacional', 'Por una orden del Banco Mundial para el colegio', 'Por votación entre los rectores de la región'],
    e: 'Hicieron un diagnóstico con los estudiantes para conocer sus intereses y resignificar la jornada desde sus voces.' };

  /* ===== Lección 10 · Armonizar la estructura ===== */
  C.c10a = { r: 'estructura', q: '¿Cuáles son los tres espacios que sostienen la educación propia?',
    ok: 'La familia, la comunidad y el territorio', no: ['La escuela, la iglesia y el mercado', 'El Cabildo, la guardia y la asamblea', 'El aula, el patio y la cafetería'],
    e: 'La armonización parte de tres dimensiones o espacios: la familia, la comunidad y el territorio.' };
  C.c10b = { r: 'estructura', q: '¿A qué espacio se dedica el primer periodo del año?',
    ok: 'A la familia, la primera escuela', no: ['A la comunidad y su trabajo compartido', 'Al territorio y su horizonte espiritual', 'Al Cabildo y a la asamblea general'],
    e: 'Primer periodo: la familia; segundo: la comunidad; tercero: el territorio.' };
  C.c10c = { r: 'estructura', q: '¿Qué vivencias colectivas orientan el proyecto de Agricultura y Espiritualidad?',
    ok: 'El Trueque y la Feria Agroindustrial', no: ['El Carnaval de la Paz', 'El Día de la Mujer Indígena', 'El Día de la Identidad y la Diversidad'],
    e: 'El Carnaval de la Paz es de Convivencia y Cultura de Paz; los días de la Mujer Indígena y de la Identidad son de Identidad y Racismo.' };
  C.c10d = { r: 'estructura', q: '¿Qué significa que la educación propia «no se encierra en los muros de la institución»?',
    ok: 'Que camina junto a la gente, al ritmo de la vida', no: ['Que la escuela no tiene paredes ni techo en el territorio', 'Que ya no hay clases dentro de la institución', 'Que solo se aprende en la ciudad, fuera del resguardo'],
    e: 'Cada vivencia se nutre de actividades que conectan a la institución con la familia, la comunidad y el territorio.' };

  /* ===== Lección 11 · Unificar la planeación ===== */
  C.c11a = { r: 'planeacion', q: '¿Cuáles son los tres instrumentos unificados?',
    ok: 'Plan de formación, planeador diario y observador', no: ['Cuaderno, texto guía y examen de periodo', 'Calendario, boletín y manual de convivencia', 'Plan de área, boletín de ICFES y horario'],
    e: 'Con ellos buscan que la práctica educativa sea coherente con el PEC y que el trabajo docente refleje el movimiento y la integralidad.' };
  C.c11b = { r: 'planeacion', q: '¿Qué es lo central en el plan de área?',
    ok: 'El estudiante como semilla, con sus dones y capacidades', no: ['Los contenidos del currículo oficial por competencias', 'Las exigencias externas de las pruebas y los rankings', 'El calendario de las empresas de la región'],
    e: 'No son los contenidos ni las exigencias externas: cuidar una semilla (un estudiante) es cuidar el plan de vida.' };
  C.c11c = { r: 'planeacion', q: 'El Ser, el Saber y el Hacer son…',
    ok: 'las tres dimensiones del don que la clase siembra o fortalece', no: ['tres áreas obligatorias de la prueba del ICFES', 'los tres periodos del año escolar y de la planeación', 'tres autoridades del Cabildo escolar'],
    e: 'Ser = lo actitudinal, estético, ético, espiritual y emocional; Saber = lo comprensivo y la reflexión crítica; Hacer = lo práctico, el trabajo y el servicio.' };
  C.c11d = { r: 'planeacion', q: '¿A qué pregunta orientadora responden las prácticas vivenciales como la minga, la chagra o la danza?',
    ok: '¿Cómo?', no: ['¿Para qué?', '¿Qué?', '¿Con qué?'],
    e: '«Actividades y estrategias» responde a ¿cómo?; la intención pedagógica a ¿para qué?; los saberes a ¿qué?; y la evaluación a ¿con qué?' };
  C.c11e = { r: 'planeacion', q: 'Con la planeación unificada, las clases dejan de ser «islas» y pasan a ser…',
    ok: 'parte de un río mayor conectado con los hilos dinamizadores', no: ['un requisito burocrático más que se entrega a la rectoría', 'actividades independientes que cada maestro hace por su lado', 'un tema que solo le corresponde decidir a la rectoría'],
    e: 'Así la planeación deja de ser un requisito burocrático y se convierte en un verdadero tejido de vida.' };
})(window.PEC.Q.checks);
