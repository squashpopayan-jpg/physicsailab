/* Práctica F11-03 · Reflexión, refracción y reflexión total con un láser */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'refraccion', cod: 'F11-03', titulo: 'Reflexión, refracción y reflexión total con un láser', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.1'], est: ['C3', 'C5', 'C6', 'C10', 'C14', 'F2'], comp: ['uso', 'ind'], temas: ['Ondas'],
    pregunta: '¿Cómo cambia la dirección de la luz al pasar del aire al agua o al acrílico, y a partir de qué ángulo la luz ya no puede salir?',
    contexto: 'Una cuchara parece quebrada dentro de un vaso de agua, el fondo de un río parece menos profundo de lo que es y las fibras ópticas llevan internet por debajo del mar sin que la luz escape. Todo se explica con la ley de Snell y la reflexión total, que se miden con un láser de baja potencia y un transportador.',
    objetivos: [
      'Comprobar la ley de reflexión y medir el índice de refracción del agua y del acrílico con la ley de Snell.',
      'Linealizar la relación entre los ángulos de incidencia y de refracción.',
      'Medir el ángulo crítico de la reflexión total y compararlo con el predicho por el índice.'
    ],
    prediccion: 'Cuando el haz pasa del aire al agua, ¿se acerca o se aleja de la normal? ¿Ocurre lo mismo al pasar del agua al aire? ¿Podría la luz quedar atrapada dentro del agua?',
    claves: [
      'La normal es la recta perpendicular a la superficie en el punto donde llega el haz; los ángulos se miden desde ella.',
      'Ley de reflexión: el ángulo reflejado es igual al incidente.',
      'Ley de Snell: n₁ sen θ₁ = n₂ sen θ₂. El agua (n ≈ 1,33) y el acrílico (n ≈ 1,49) desvían la luz hacia la normal al entrar desde el aire.',
      'Al pasar de un medio de mayor índice a uno de menor, si sen θ₁ > n₂/n₁ la luz no sale: reflexión total, con ángulo crítico θ<sub>c</sub> = arcsen(n₂/n₁).'
    ],
    materiales: [
      ['Puntero láser de clase 2 (≤ 1 mW) con norma y potencia declaradas', '1', 'Linterna con una rendija de cartón (haz más ancho)', 15000],
      ['Recipiente plástico transparente rectangular o semicilíndrico', '1', 'Bloque semicircular de acrílico del laboratorio', 5000],
      ['Transportador de 360° impreso en cartulina', '1', 'Transportador escolar', 500],
      ['Agua con una gota de leche (para ver el haz)', '—', 'Agua con una pizca de talco', 0],
      ['Bloque de acrílico de 2 cm de espesor', '1', 'Vaso de vidrio de paredes planas', 10000],
      ['Pantalla de cartulina blanca mate', '1', '—', 500],
      ['Plastilina para fijar el láser', '1', '—', 1000]
    ],
    montaje: [
      'Pegue el transportador detrás del recipiente, con su centro en el punto donde el haz llegará a la superficie y su línea de 0° perpendicular a ella (la normal).',
      'Llene el recipiente con agua y agregue una gota de leche para que el haz sea visible dentro del agua.',
      'Fije el láser con plastilina sobre un soporte que permita girarlo alrededor del centro del transportador, con el haz por debajo de la altura de los ojos.',
      'Oscurezca un poco el salón, sin dejarlo a oscuras, y ubique la pantalla mate donde terminan los haces.'
    ],
    seguridad: [
      { p: 'Haz láser en los ojos (directo o reflejado)', c: 'rad', ef: 'Deslumbramiento; lesión ocular si la clase real es mayor que 2', ctrl: 'Solo clase 1 o 2 verificada; haz bajo la altura de los ojos y terminado en pantalla mate; nadie mira el haz ni sus reflejos; sin relojes ni espejos en el camino.', nd: 2, ne: 2, nc: 25 },
      { p: 'Agua cerca del láser y del celular', c: 'loc', ef: 'Daño de equipos, resbalones', ctrl: 'Bandeja bajo el recipiente; secar de inmediato.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren con láser de clase 2 verificado; la protección es el control del haz.',
    procedimiento: [
      'Haga incidir el haz en la superficie del agua desde el aire con ángulos de 10° a 70°, de 10° en 10°. Para cada uno, lea el ángulo del haz reflejado y el del refractado.',
      'Repita cada lectura dos veces moviendo el láser y volviéndolo a ubicar.',
      'Cambie el agua por el bloque de acrílico y repita.',
      'Haga ahora que el haz viaje dentro del agua (o del acrílico) hacia la superficie con el aire. Aumente el ángulo hasta que el haz refractado desaparezca y anote el ángulo crítico.'
    ],
    tabla: { cols: ['θ₁ incidente (°)', 'θ reflejado (°)', 'θ₂ refractado (°)', 'sen θ₁', 'sen θ₂'], filas: 8 },
    analisis: [
      'Verifique la ley de reflexión comparando θ₁ con el ángulo reflejado.',
      'Grafique sen θ₁ contra sen θ₂ y ajuste una recta por el origen: la pendiente es el índice n del medio.',
      'Calcule el ángulo crítico predicho, arcsen(1/n), y compárelo con el medido.',
      'Propague la incertidumbre de lectura del transportador (1° de resolución) al índice.'
    ],
    esperado: 'Para el agua a 20 °C, n ≈ 1,331 con láser rojo de 650 nm y 1,334 con verde de 532 nm; para el acrílico, cerca de 1,49. Con incidencia de 50° desde el aire, el haz se desvía a 35,1° en el agua y a 30,9° en el acrílico. El ángulo crítico es 48,7° para el agua y 42,2° para el acrílico. Con un transportador de 1° se obtiene n con 1 % a 2 % de incertidumbre.',
    errores: [
      ['Medir los ángulos desde la superficie y no desde la normal.', 'Se trazan desde la línea perpendicular a la superficie; confundirlos cambia todos los resultados.'],
      ['Centro del transportador mal ubicado.', 'El haz debe llegar a la superficie justo en el centro del transportador; si no, las lecturas tienen paralaje.'],
      ['Grafique θ₁ contra θ₂.', 'La relación es lineal en los senos, no en los ángulos; la curva se aparta mucho a ángulos grandes.'],
      ['Buscar la reflexión total pasando del aire al agua.', 'Solo ocurre al pasar de mayor a menor índice: el haz debe ir dentro del agua hacia el aire.']
    ],
    orientadoras: [
      '¿Qué ángulos medirán y desde qué línea de referencia?',
      '¿Qué gráfica de sus datos debería ser una recta según la ley de Snell?',
      '¿Cómo harán visible el haz dentro del agua sin afectar la medida?',
      '¿Cómo pondrán a prueba si la luz puede quedar atrapada dentro de un medio?'
    ],
    abierta: 'Los pescadores con arpón del Pacífico apuntan «más abajo» de donde ven el pez. Diseñen una investigación con un láser y un recipiente con agua para explicar por qué y para cuantificar cuánto deben corregir según el ángulo de visión.',
    preguntas: [
      '¿Por qué el fondo de una piscina parece menos profundo de lo que es?',
      '¿En qué se diferencia la reflexión total de la reflexión en un espejo?',
      '¿Cómo funciona una fibra óptica? ¿Qué condición deben cumplir los índices del núcleo y del recubrimiento?',
      '¿Por qué el índice del agua es un poco distinto para la luz roja y la verde? Relacione con el arcoíris.'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Un haz de luz pasa del aire (n = 1,00) al agua (n = 1,33) con un ángulo de incidencia de 30°. Sobre el ángulo de refracción se puede afirmar que',
      opciones: ['es mayor de 30°, porque la luz se aleja de la normal.', 'es menor de 30°, porque la luz se acerca a la normal al entrar en un medio de mayor índice.', 'es igual a 30°, porque la frecuencia no cambia.', 'no existe, porque ocurre reflexión total.'],
      clave: 'B',
      just: 'Con n₁ sen θ₁ = n₂ sen θ₂, sen θ₂ = sen 30°/1,33 = 0,376 y θ₂ ≈ 22°: la luz se acerca a la normal. La reflexión total solo ocurre al pasar de mayor a menor índice.'
    },
    rubrica: [['Modelo de refracción', 'No identifica la normal.', 'Describe cualitativamente la desviación.', 'Obtiene n por linealización con incertidumbre y predice el ángulo crítico.', 'Compara el ángulo crítico medido y predicho con z y explica la dispersión por color.']],
    referencias: ['IEC 60825-1, seguridad de los productos láser.', 'M. Daimon y A. Masumura, «Measurement of the refractive index of distilled water from the near-infrared region to the ultraviolet region», <i>Applied Optics</i> 46, 3811–3820, 2007.']
  });
})();
