/* Montaje elaborado FE-05 · Cubeta de ondas casera */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'cubeta', cod: 'FE-05', titulo: 'Cubeta de ondas casera: reflexión, refracción, difracción e interferencia', grado: 11, tipo: 'elaborada',
    tiempo: 165, grupo: '4 estudiantes', nivel: 2,
    dba: ['11.1'], est: ['C1', 'C3', 'C6', 'C8', 'C12', 'F2', 'F6'], comp: ['exp', 'ind'], temas: ['Ondas'],
    pregunta: '¿Cómo se comportan las ondas en el agua al reflejarse, al cambiar de profundidad, al pasar por una rendija y al encontrarse dos de ellas, y de qué depende su rapidez?',
    contexto: 'Antes de aceptar que la luz es una onda, Young y Fresnel pensaron en las ondas del agua. Una refractaria de vidrio con medio centímetro de agua, una linterna y una hoja blanca muestran en sombra los frentes de onda, y permiten ver la reflexión, la refracción, la difracción y la interferencia que el DBA pide explicar en la luz y el sonido.',
    objetivos: [
      'Construir una cubeta de ondas y proyectar los frentes de onda sobre una pantalla.',
      'Medir la longitud de onda a varias frecuencias y profundidades y compararla con la relación de dispersión de las ondas en agua.',
      'Observar y describir la reflexión, la refracción al cambiar de profundidad, la difracción en una rendija y la interferencia de dos fuentes.'
    ],
    prediccion: 'Si las ondas pasan de una zona profunda a una poco profunda, ¿su longitud de onda aumenta o disminuye? ¿Y su frecuencia? ¿Qué pasará cuando un frente plano atraviese una rendija más angosta que la longitud de onda?',
    claves: [
      'La rapidez de una onda es v = λ f. La frecuencia la fija la fuente y no cambia al pasar de un medio a otro.',
      'En aguas poco profundas (λ mucho mayor que la profundidad h), v ≈ √(g h): las ondas son más lentas donde el agua es menos profunda.',
      'Con unos 5 mm de agua las ondas casi no se dispersan: la tensión superficial compensa el efecto de la profundidad finita y todas las frecuencias viajan con v ≈ √(g h).',
      'Al cambiar de rapidez, el frente de onda cambia de dirección: refracción, con sen θ₁ / sen θ₂ = v₁ / v₂.',
      'Dos fuentes en fase producen zonas de interferencia constructiva y destructiva; una rendija angosta curva los frentes (difracción).'
    ],
    materiales: [
      ['Refractaria de vidrio transparente de 30 × 20 cm o más', '1', 'Bandeja de acrílico', 25000],
      ['Cuatro soportes para elevarla 15 cm (vasos o tacos)', '4', 'Libros', 0],
      ['Linterna LED pequeña o la luz del celular, colocada 50 cm arriba', '1', '—', 0],
      ['Hoja blanca grande debajo como pantalla', '1', '—', 0],
      ['Parlante de 8 Ω con amplificador de 5 V, generador de tonos del celular y una regla pegada al cono como generador de frentes planos', '1', 'Motor vibrador de celular con pila', 16000],
      ['Placa de acrílico de 3 mm (unos 10 × 15 cm) para crear una zona poco profunda', '1', 'Vidrio de portarretrato', 5000],
      ['Barreras de plastilina o de madera para rendijas y obstáculos', '—', '—', 2000],
      ['Esponja o trapo en los bordes para amortiguar reflexiones', '1', '—', 0],
      ['Regla y celular para fotografiar la sombra con escala', '1', '—', 0]
    ],
    montaje: [
      'Ubique la refractaria sobre los cuatro soportes, nivelada, con la hoja blanca debajo y la linterna 50 cm arriba: las crestas actúan como lentes y se ven como líneas claras.',
      'Agregue agua hasta 5 mm de profundidad, medidos con una regla en las cuatro esquinas, y ponga trapos húmedos en los bordes para que las ondas no se reflejen.',
      'Pegue una regla al cono del parlante y apóyela horizontal sobre el agua, sin hundirla: es el generador de frentes planos.',
      'Ponga una regla de referencia sobre la hoja para fotografiar la sombra con escala; la sombra está algo ampliada respecto al agua, por eso la escala se toma en el mismo plano.'
    ],
    seguridad: [
      { p: 'Agua cerca del amplificador y del celular', c: 'elec', ef: 'Daño de equipos; ningún riesgo eléctrico a 5 V', ctrl: 'Amplificador alimentado por USB, fuera de la zona húmeda; celular en bolsa plástica.', nd: 2, ne: 2, nc: 10 },
      { p: 'Refractaria de vidrio sobre soportes', c: 'mec', ef: 'Rotura y cortes', ctrl: 'Soportes estables y nivelados; no apoyarse en la mesa; vidrio templado de cocina.', nd: 2, ne: 1, nc: 25 },
      { p: 'Agua en el piso', c: 'loc', ef: 'Resbalones', ctrl: 'Bandeja grande debajo; secar de inmediato.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Con 5 mm de agua y el generador a 5 Hz, observe los frentes planos. Fotografíe la sombra con la regla de referencia y mida la longitud de cinco ondas.',
      'Repita a 4, 6, 8, 10, 15 y 20 Hz. Luego suba el agua a 10 mm y repita.',
      'Vuelva a 5 mm de agua y coloque la placa de acrílico de 3 mm en el fondo, con su borde inclinado unos 40° respecto a los frentes: sobre ella quedan 2 mm de agua. A 5 Hz, observe y fotografíe la refracción.',
      'Ponga una barrera con una rendija de 1 cm y luego de 4 cm; observe la difracción.',
      'Reemplace la regla por dos puntas (dos palillos) separadas 4 cm que toquen el agua y observe el patrón de interferencia.'
    ],
    tabla: { cols: ['<i>h</i> (mm)', '<i>f</i> (Hz)', '5λ medido (mm)', 'λ (mm)', '<i>v</i> = λ<i>f</i> (m/s)', '√(<i>gh</i>) (m/s)'], filas: 10 },
    analisis: [
      'Calcule λ y v para cada frecuencia y profundidad.',
      'Grafique v contra f para cada profundidad junto con la curva del modelo de dispersión: ¿en qué rango vale v ≈ √(g h)?',
      'En la refracción, mida los ángulos de los frentes y las longitudes de onda a cada lado; compare sen θ₁/sen θ₂ con λ₁/λ₂.',
      'Describa con dibujos la difracción en las dos rendijas y las líneas nodales de la interferencia.'
    ],
    esperado: 'Con 5 mm de agua la rapidez casi no cambia entre 4 y 10 Hz (0,220 a 0,221 m/s) y coincide con √(g h) = 0,221 m/s; a 5 Hz, λ = 44,0 mm. A 20 Hz, λ = 11,9 mm y la tensión superficial sube la rapidez a 0,238 m/s. Con 10 mm de agua la rapidez baja de 0,289 m/s a 4 Hz a 0,232 m/s a 15 Hz: ya no son aguas poco profundas. Sobre la placa (2 mm de agua) a 5 Hz, λ pasa de 44,0 a 31,1 mm, y con incidencia de 40° el frente refractado sale a 27°.',
    errores: [
      ['Medir la longitud de onda en la sombra sin escala en el mismo plano.', 'La sombra está ampliada; la regla de referencia debe estar sobre la hoja y la ampliación se corrige.'],
      ['Agua demasiado profunda.', 'Las ondas dejan de ser de aguas poco profundas: la rapidez depende de la frecuencia, los pulsos se deforman y la refracción se ve menos.'],
      ['Reflexiones en los bordes.', 'Se superponen a las ondas incidentes; se amortiguan con trapos húmedos.'],
      ['Generador demasiado hundido o con mucha amplitud.', 'Produce ondas no lineales y salpicaduras; basta un contacto leve.']
    ],
    orientadoras: [
      '¿Cómo harán visibles los frentes de onda y cómo medirán su separación?',
      '¿Qué variables podrían cambiar la rapidez de las ondas en el agua?',
      '¿Cómo podrían producir un cambio de rapidez dentro de la misma cubeta?',
      '¿Qué esperan ver cuando dos fuentes producen ondas a la vez?'
    ],
    abierta: 'Las olas que llegan a una playa del Pacífico cambian de dirección y se acercan paralelas a la orilla. Usen la cubeta para investigar por qué ocurre y de qué depende, y relacionen sus resultados con la refracción de la luz.',
    preguntas: [
      '¿Por qué la frecuencia no cambia al pasar de una profundidad a otra, pero la longitud de onda sí?',
      '¿Por qué las olas llegan casi paralelas a la playa?',
      '¿Qué tienen en común la difracción del agua en la rendija y la de la luz en el CD (práctica F11-05)?',
      '¿Cómo usaría la interferencia de dos fuentes para medir la longitud de onda?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'En una cubeta de ondas, un frente plano pasa de una zona profunda a una poco profunda. Se observa que la separación entre frentes disminuye. La explicación es que',
      opciones: ['la frecuencia disminuye en la zona poco profunda.', 'la rapidez de la onda disminuye en la zona poco profunda y la frecuencia se mantiene.', 'la amplitud de la onda aumenta.', 'la onda se refleja en el borde de la zona.'],
      clave: 'B',
      just: 'La frecuencia la fija la fuente. Como v = λ f y en aguas poco profundas la rapidez disminuye con la profundidad, la longitud de onda disminuye en la misma proporción.'
    },
    rubrica: [['Fenómenos ondulatorios', 'Describe sin distinguir los fenómenos.', 'Identifica reflexión, refracción, difracción e interferencia.', 'Mide λ y v y los compara con el modelo de dispersión.', 'Explica cuantitativamente la refracción y relaciona los resultados con la luz y el sonido.']],
    referencias: ['H. Lamb, <i>Hydrodynamics</i>, 6.ª ed., Cambridge, 1932: relación de dispersión de ondas capilares y de gravedad.', 'MEN, DBA de Ciencias Naturales V.1, grado 11.°, DBA 1.']
  });
})();
