/* Quizzes de cada parte: 10 preguntas por parte, con retroalimentación inmediata. */
(function (Q) {
  const q = (r, enun, ok, no, e) => ({ r, q: enun, ok, no, e });

  /* ===== Parte I ===== */
  Q.quiz['quiz-1'] = [
    q('pec', '¿Qué significan las siglas PEC?', 'Proceso Educativo Comunitario', ['Plan Escolar Colombiano', 'Programa de Educación Campesina', 'Proyecto Educativo Cultural'],
      'PEC es el Proceso Educativo Comunitario del resguardo Nasa de Novirao.'),
    q('pec', 'En la lengua y cosmovisión Nasa de la cartilla, ¿qué es Uma Kiwe?', 'La madre tierra', ['El fogón de la tulpa', 'La lengua Nasa', 'La casa del Cabildo'],
      'Uma Kiwe es la madre tierra. El PEC busca que el pueblo siga perviviendo en armonía con ella.'),
    q('novirao', '¿Cómo llama la comunidad a su territorio de Novirao?', 'Yat Wala, la Casa grande', ['Kxaw dxi, el sueño a caminar', 'Wët wët fxi\'zenxi, el Buen vivir', 'Nasa Yuwe, la lengua'],
      'Yat Wala significa Casa grande. Kxaw dxi es el sueño a caminar y wët wët fxi\'zenxi el Buen vivir.'),
    q('novirao', '¿En qué municipio y departamento está Novirao?', 'Totoró, Cauca', ['Popayán, Cauca', 'Totoró, Nariño', 'Silvia, Cauca'],
      'Novirao está en el municipio de Totoró, en la vertiente occidental de la cordillera central, en el departamento del Cauca.'),
    q('novirao', '¿Cuántas juntas y cuántos sectores tiene el territorio?', '5 juntas que agrupan 17 sectores', ['17 juntas que agrupan 5 sectores', '3 juntas que agrupan 17 sectores', '5 juntas que agrupan 12 sectores'],
      'Hay cinco juntas, que agrupan los 17 sectores del territorio.'),
    q('novirao', '¿Qué competencias ejerce el Cabildo Indígena?', 'Administrativas, legislativas y judiciales', ['Solo funciones religiosas y ceremoniales', 'Solo funciones educativas dentro de la escuela', 'Solo funciones económicas y de comercio del café'],
      'El Cabildo es la estructura de gobierno que ejerce competencias administrativas, legislativas y judiciales, bajo la tutela de la asamblea general.'),
    q('novirao', '¿Cuántos estudiantes tiene la Institución Educativa Novirao?', '208', ['2.229', '703', '23'],
      'La Institución tiene 208 estudiantes. 2.229 es el total de personas del censo y 703 el de familias.'),
    q('pec', '¿Quiénes participan en la construcción del PEC?', 'Niñez, juventud, familias, autoridades y mayores', ['Solo los docentes, el rector y el coordinador', 'Solo las autoridades del Cabildo y de la guardia', 'Solo funcionarios del Ministerio de Educación Nacional'],
      'Es un proceso participativo y colectivo: están presentes la voz y el sentir de toda la comunidad.'),
    q('pec', '¿Dónde dice la cartilla que está la educación propia?', 'En la minga, la tulpa, la palabra compartida y el territorio', ['Solo dentro del aula, con el maestro como autoridad', 'Únicamente en el currículo oficial del Ministerio', 'En los resultados de los exámenes de Estado'],
      'La educación propia no está solo en los escritos: se vive en la minga, la tulpa, la palabra compartida, el trabajo comunitario y el territorio.'),
    q('novirao', 'Que muchas familias completen sus ingresos trabajando en Popayán refleja…', 'la tensión entre la economía propia y la dependencia externa', ['la tensión entre las ideas de jóvenes y mayores', 'la tensión entre cultivar café o cultivar maíz', 'la tensión entre las cinco juntas y el Cabildo'],
      'La cartilla lo explica como herencia de un proceso histórico de despojo, desfinanciación del campo y debilitamiento de las identidades culturales.'),
  ];

  /* ===== Parte II ===== */
  Q.quiz['quiz-2'] = [
    q('tierra', '¿De dónde llegaron las familias hace unos 300 años, según los mayores?', 'De Tierradentro', ['De la ciudad de Popayán', 'De la vereda de Belén', 'Del casco urbano de Totoró'],
      'Los mayores cuentan que las familias llegaron desde Tierradentro buscando un lugar para vivir y sembrar.'),
    q('tierra', '¿Qué mayor recuerda: «El patrón decía: tenga un lotecito»?', 'Rosalino Vainas', ['Julio Cucuñame', 'Wenceslao León', 'Freiman Salazar'],
      'Es una cita del mayor Rosalino Vainas sobre cómo funcionaba el terraje.'),
    q('tierra', '¿Qué empresa llegó en la década de 1970 con cultivos de pino?', 'La empresa Reforestadora S.A.', ['El INCODER, entidad de tierras', 'El CRIC, organización regional', 'El Banco Mundial, entidad financiera'],
      'La Reforestadora S.A. sembró pinos en El Carmen, El Molino y La Aurora, y obligó a muchas familias a irse.'),
    q('tierra', '¿Qué ocurrió con el comunero Wenceslao León en 1980?', 'Fue asesinado en El Molino, tras ser retenido y torturado', ['Fue elegido primer gobernador del Cabildo de Novirao', 'Fundó la primera escuela del territorio en Belén', 'Fue nombrado primer director de la escuela oficial'],
      'Su muerte dolió profundamente, pero también dio más fuerza a la comunidad para seguir resistiendo.'),
    q('tierra', '¿Cuáles fueron las primeras tierras entregadas oficialmente en 1995-1996?', 'El Molino, El Carmen y La Canoa', ['La Aurora, Belén y Totoró', 'Santa Ana, Santa Teresa y Alto Novirao', 'Tierradentro, Popayán y Silvia'],
      'El INCODER entregó oficialmente las primeras tierras del resguardo, incluyendo El Molino, El Carmen y La Canoa.'),
    q('tierra', '¿Quién fue el primer gobernador del Cabildo Indígena de Novirao (1991)?', 'El mayor Julio Cucuñame', ['El dinamizador Faustino Cometa', 'El líder Manuel Quintín Lame', 'El comunero Wenceslao León'],
      'En 1991 se conformó el Cabildo con el mayor Julio Cucuñame como primer gobernador.'),
    q('escuela', '¿Qué enseñaban en la escuela-iglesia de Belén?', 'Religión católica y castellano, y prohibían las prácticas propias', ['Nasa Yuwe, rituales y danzas propias del territorio', 'Agroecología, mecánica y producción audiovisual', 'Matemáticas y ciencias con currículo por competencias'],
      'Por miedo a ser señalados de brujos o hechiceros, muchos mayores dejaron de compartir sus conocimientos.'),
    q('escuela', '¿Qué familia tenía el control de la primera escuela oficial de Belén (hacia 1940)?', 'La familia Mosquera', ['La familia Angulo', 'La familia Cucuñame', 'La familia Vainas'],
      'La escuela estaba bajo el control de la familia Mosquera, antiguos terratenientes del territorio.'),
    q('escuela', '¿Qué es el «kxaw dxi»?', 'El sueño a caminar', ['El Buen vivir', 'La Casa grande', 'La madre tierra'],
      'El kxaw dxi (sueño a caminar) es el horizonte del PEC: defender la tierra, revitalizar la lengua y garantizar la vida colectiva.'),
    q('escuela', 'La lucha por la tierra nos enseña que…', 'no hay autonomía educativa sin autonomía política y territorial', ['la educación no tiene relación con la tierra', 'la autonomía educativa depende solo del Ministerio', 'la lucha terminó cuando se conformó el Cabildo en 1991'],
      'Por eso el PEC se fundamenta en esa memoria de resistencia.'),
  ];

  /* ===== Parte III ===== */
  Q.quiz['quiz-3'] = [
    q('tejidos', '¿Cuáles son los dos tejidos que orientan el PEC?', 'El tejido de vida y el de sabidurías y conocimientos', ['El tejido de lana y el tejido de algodón', 'El tejido político y el tejido económico', 'El tejido de la tulpa y el tejido del Cabildo'],
      'Son las dos comprensiones que nacieron al ponerse de acuerdo sobre lo que significa educar en el territorio.'),
    q('hilos', '¿Cuántos hilos dinamizadores tiene el PEC?', 'Cinco', ['Tres', 'Cuatro', 'Siete'],
      'Agroambiental, Derecho Mayor y Gobernanza, Artes y Culturas, Bienestar y Deporte, y Comunicación y Lenguajes.'),
    q('hilos', '¿Qué hilo se orienta al cuidado de Uma Kiwe y a la soberanía alimentaria?', 'Agroambiental', ['Artes y Culturas', 'Bienestar y Deporte', 'Comunicación y Lenguajes'],
      'El hilo Agroambiental fomenta los procesos productivos y se articula con el programa de Territorio, Ambiente y Producción.'),
    q('hilos', '¿Qué hilo fortalece la identidad, la memoria y las expresiones artísticas, y se articula con el programa de familia y los jóvenes?', 'Artes y Culturas', ['Derecho Mayor y Gobernanza', 'Agroambiental', 'Bienestar y Deporte'],
      'Artes y Culturas fortalece la identidad, la memoria, la estética, el arte y la espiritualidad.'),
    q('hilos', 'En el diagrama de los hilos, ¿qué atraviesa a todos?', 'La espiritualidad', ['La prueba del ICFES', 'La economía del café', 'El deporte escolar'],
      'Cada hilo está atravesado por la espiritualidad y se conecta con los programas del cabildo, las familias y las autoridades espirituales.'),
    q('hilos', '¿En qué se basa el hilo de Derecho Mayor y Gobernanza?', 'En la Ley de Origen y el gobierno propio', ['En las competencias del currículo oficial', 'En la producción y venta de café', 'En el calendario deportivo del colegio'],
      'Además busca una comprensión crítica de la realidad social local, regional, nacional y mundial.'),
    q('tejidos', '¿Cuál de estas es una dimensión del tejido de vida del pueblo Nasa?', 'La espiritual', ['La tributaria', 'La militar', 'La industrial'],
      'Entre las dimensiones están la espiritual, histórica, política, cultural, económica, material, las expresiones artísticas y la lengua.'),
    q('practicas', '¿Qué son las vivencias?', 'Expresiones ancestrales que han garantizado la pervivencia de los pueblos', ['Ejercicios planificados para memorizar datos y fechas históricas', 'Notas que se ponen en el boletín de cada periodo', 'Talleres tipo laboratorio en la escuela de Novirao'],
      'Se incorporan en las personas (las semillas) y se realizan en la vida cotidiana individual, familiar y colectiva.'),
    q('practicas', '¿Qué momento de la espiral viene justo después de la germinación?', 'El crecimiento', ['La siembra', 'La floración', 'La fructificación'],
      'El orden es siembra, germinación, crecimiento, floración, fructificación y nueva semilla.'),
    q('practicas', '¿Cuál es el último momento de la espiral de maduración?', 'La nueva semilla', ['La fructificación', 'La floración', 'La siembra'],
      'La semilla se proyecta en nuevas semillas que transforman el territorio: por eso la espiral siempre se abre.'),
  ];

  /* ===== Parte IV ===== */
  Q.quiz['quiz-4'] = [
    q('pedagogia', '¿Qué son las «mediaciones» en la pedagogía propia?', 'Señales que orientan nuestras relaciones con el mundo y con los otros', ['Reuniones para resolver peleas entre vecinos del sector', 'Cada una de las materias del plan de estudios del colegio', 'Los intermediarios que compran y venden el café'],
      'Algunas se sienten más en lo político, otras en lo espiritual, lo intelectual o lo emocional, pero todas conviven en la integralidad del ser.'),
    q('tiempo', '¿En cuántos grupos heterogéneos se organizaron los 200 estudiantes del jueves comunitario?', 'Cinco', ['Tres', 'Diez', 'Diecisiete'],
      'Cinco grupos de unos 40 estudiantes, desde transición hasta grado once, con tres dinamizadores cada uno.'),
    q('tiempo', 'En el jueves comunitario, ¿qué trabaja el hilo de Derecho Mayor y Gobernanza?', 'Trabajo específico con la Guardia Escolar y el Cabildo Escolar', ['Los proyectos productivos escolares de la huerta', 'El entrenamiento deportivo y la recreación', 'La revitalización del idioma y la emisora'],
      'Mientras tanto, Comunicación y Lenguajes quedó como eje transversal que acompaña todos los hilos.'),
    q('estructura', '¿A qué espacio se dedica el segundo periodo del año escolar?', 'A la comunidad', ['A la familia', 'Al territorio', 'A la asamblea'],
      'La comunidad es el espacio colectivo de aprendizaje, participación y trabajo compartido.'),
    q('estructura', '¿Qué proyecto transversal tiene como vivencia colectiva el Carnaval de la Paz?', 'Convivencia y Cultura de Paz', ['Agricultura y Espiritualidad', 'Identidad y Racismo', 'Sexualidad y Género'],
      'Agricultura y Espiritualidad tiene el Trueque y la Feria Agroindustrial; Identidad y Racismo, los días de la Mujer Indígena y de la Identidad y la Diversidad.'),
    q('estructura', '¿Qué proyecto transversal sigue «en proceso de construcción colectiva»?', 'Sexualidad y Género', ['Identidad y Racismo', 'Agricultura y Espiritualidad', 'Convivencia y Cultura de Paz'],
      'Es el único cuyas vivencias colectivas aún se están construyendo, según la cartilla.'),
    q('planeacion', '¿Qué dimensión del don incluye lo actitudinal, estético, ético, espiritual y emocional?', 'El Ser', ['El Saber', 'El Hacer', 'El Tener'],
      'El Saber es lo comprensivo y la reflexión crítica; el Hacer, lo práctico, el trabajo y el servicio.'),
    q('planeacion', 'Las formas de valorar el aprendizaje desde la palabra, la práctica, la participación y la reflexión comunitaria responden a la pregunta…', '¿Con qué?', ['¿Para qué?', '¿Cómo?', '¿Qué?'],
      'Los instrumentos de evaluación responden a ¿con qué?; la intención pedagógica, a ¿para qué?; las estrategias, a ¿cómo?; los saberes, a ¿qué?'),
    q('planeacion', 'Según la cartilla, un dinamizador que no planea…', 'pierde fuerza en su palabra y en su acción educativa', ['gana tiempo para dedicarlo a otras actividades', 'enseña mejor porque improvisa con los estudiantes', 'no necesita observador ni plan de formación'],
      'Con esa convicción lo primero fue organizar el plan de formación de cada grado.'),
    q('planeacion', 'Cada maestro prioriza estrategias y actividades según…', 'las capacidades que se identifican en la maduración', ['el libro de texto más reciente del mercado', 'el promedio de notas que trae el grupo', 'el orden alfabético de las materias'],
      'Esas capacidades se convierten en hilos de formación que se concretan con las cuatro preguntas orientadoras.'),
  ];
})(window.PEC.Q);
