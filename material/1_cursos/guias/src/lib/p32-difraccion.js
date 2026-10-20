/* Práctica F11-05 · Difracción con un CD, un DVD y un cabello */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'difraccion', cod: 'F11-05', titulo: 'Difracción: un CD como red y el grosor de un cabello', grado: 11, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes', nivel: 1,
    dba: ['11.1'], est: ['C3', 'C4', 'C5', 'C10', 'C14', 'T2'], comp: ['exp', 'uso'], temas: ['Ondas'],
    pregunta: '¿Por qué un CD muestra los colores del arcoíris y cómo se puede usar la difracción para medir la distancia entre sus pistas o el grosor de un cabello?',
    contexto: 'Las pistas de un CD están separadas 1,6 micrómetros, una distancia que ninguna regla puede medir. Sin embargo, un láser y una regla bastan: la luz se difracta en las pistas como en una red y los puntos que aparecen en la pared revelan esa distancia. Con el mismo principio se mide el grosor de un cabello.',
    objetivos: [
      'Observar la difracción de un haz láser en un CD y un DVD y medir los ángulos de los máximos.',
      'Calcular la separación entre pistas de cada disco con la ecuación de la red y compararla con la especificación.',
      'Medir el diámetro de un cabello a partir de la separación de las franjas de su patrón de difracción.'
    ],
    prediccion: '¿Los puntos de difracción del DVD aparecerán más cerca o más lejos del centro que los del CD? ¿Por qué el DVD guarda más información?',
    claves: [
      'Una red de difracción con rendijas (o pistas) separadas d desvía la luz a los ángulos que cumplen d sen θ<sub>m</sub> = m λ, con m = 0, 1, 2…',
      'Si la pantalla está a una distancia D del disco y el punto m está a y<sub>m</sub> del central, tan θ<sub>m</sub> = y<sub>m</sub>/D.',
      'Un obstáculo delgado de ancho a (un cabello) produce franjas oscuras separadas Δy = λ D / a en una pantalla lejana.',
      'Cuanto más pequeña la estructura, mayor la desviación: la difracción mide lo que no se ve.'
    ],
    materiales: [
      ['Puntero láser de clase 2 (rojo, 650 nm; o verde, 532 nm) con norma y potencia declaradas', '1', '—', 15000],
      ['CD y DVD viejos; se retira la capa de aluminio de un pedazo con cinta adhesiva para usarlo por transmisión', '1 de cada uno', 'Rejilla de difracción comercial', 0],
      ['Pantalla: pared clara o cartulina blanca grande', '1', 'Tablero', 500],
      ['Flexómetro de 3 m', '1', 'Cinta métrica', 8000],
      ['Cabello y marco de diapositiva o de cartón para tensarlo', '1', 'Alambre muy delgado', 0],
      ['Soporte con plastilina para el láser y para el disco', '1', 'Libros', 1000],
      ['Calibrador o micrómetro (para comparar el cabello, opcional)', '1', '—', 0]
    ],
    montaje: [
      'Fije el láser horizontal, a la altura de la mesa, apuntando a la pantalla a unos 30 cm (CD) o 2 m (cabello).',
      'Para el CD: póngalo vertical frente a la pantalla, perforada en el centro para que pase el haz; el haz incide perpendicular al disco y las manchas difractadas aparecen en la pantalla alrededor del agujero.',
      'Para el cabello: tense el cabello verticalmente en el marco y póngalo en el camino del haz, a 2 m de la pantalla.',
      'Mida la distancia D del disco o del cabello a la pantalla.'
    ],
    seguridad: [
      { p: 'Haz láser y sus reflexiones en el CD', c: 'rad', ef: 'Deslumbramiento; lesión ocular si la clase real es mayor que 2', ctrl: 'Láser de clase 2 verificado; el CD refleja haces en varias direcciones: todos deben terminar en la pantalla, por debajo de los ojos; nadie se ubica entre el disco y la pantalla.', nd: 2, ne: 2, nc: 25 },
      { p: 'Bordes del CD cortado', c: 'mec', ef: 'Cortes', ctrl: 'Cortar el CD con tijeras gruesas antes de la clase y lijar los bordes.', nd: 2, ne: 1, nc: 10 }
    ],
    epp: 'no se requieren con láser de clase 2 verificado.',
    procedimiento: [
      'Con el CD perpendicular al haz, mida en la pantalla las distancias y<sub>1</sub> e y<sub>-1</sub> de los dos puntos de primer orden al punto central. Busque los de segundo orden.',
      'Cambie la distancia D (20, 30 y 40 cm) y repita.',
      'Repita con el DVD (sus puntos de primer orden salen muy desviados: acerque la pantalla).',
      'Con el cabello, marque en la pantalla las franjas oscuras a cada lado del centro (hasta el orden 5) y mida la distancia entre las de orden −5 y +5.',
      'Anote la longitud de onda que declara el fabricante del láser y su tolerancia.'
    ],
    tabla: { cols: ['Objeto', '<i>D</i> (m)', 'orden <i>m</i>', '<i>y</i><sub>m</sub> (m)', 'θ<sub>m</sub> (°)', '<i>d</i> o <i>a</i> calculado (µm)'], filas: 8 },
    analisis: [
      'Calcule θ<sub>m</sub> = arctan(y<sub>m</sub>/D) para cada punto y d = m λ / sen θ<sub>m</sub>.',
      'Promedie los valores de d del CD y del DVD y compárelos con las especificaciones (1,6 µm y 0,74 µm).',
      'Para el cabello, la separación de franjas es Δy = (distancia entre las franjas −5 y +5)/10 y a = λ D/Δy.',
      'Estime cuánto aporta la tolerancia de la longitud de onda del láser a la incertidumbre.'
    ],
    esperado: 'Con láser rojo de 650 nm, el CD desvía el primer orden 23,97° (13,3 cm a D = 30 cm) y el segundo, 54,3°; el DVD, 61,4° en el primer orden y no tiene segundo. Con verde de 532 nm el CD desvía 19,4°. Un cabello de 70 µm a 2 m de la pantalla da franjas oscuras separadas 1,86 cm con luz roja. Los cabellos humanos miden entre unos 50 y 100 µm.',
    errores: [
      ['Disco inclinado respecto al haz.', 'Los órdenes ±1 salen asimétricos; se usa el promedio de y<sub>1</sub> e y<sub>−1</sub> o se corrige la inclinación.'],
      ['Usar la aproximación sen θ ≈ tan θ.', 'Con ángulos de 24° o 61° el error es grande; se calcula θ con arctan(y/D) y luego el seno.'],
      ['Ignorar la tolerancia del láser.', 'Muchos punteros declaran 650 ± 10 nm: esa incertidumbre de 1,5 % pasa directamente a d.'],
      ['Medir la separación de franjas del cabello entre dos franjas vecinas.', 'Son milímetros; se mide entre órdenes lejanos y se divide.']
    ],
    orientadoras: [
      '¿Qué patrón esperan si la luz pasa por (o se refleja en) muchas pistas paralelas muy juntas?',
      '¿Qué deben medir para calcular la separación entre las pistas?',
      '¿Cómo usarán varias distancias a la pantalla para mejorar el resultado?',
      '¿Cómo medirían algo más delgado que la resolución de cualquier regla del colegio?'
    ],
    abierta: 'Una empresa recicladora quiere distinguir rápidamente CD, DVD y Blu-ray sin leerlos. Diseñen un método óptico basado en la difracción, pruébenlo con los discos que tengan y estimen la separación entre pistas de cada uno con su incertidumbre.',
    preguntas: [
      '¿Por qué el DVD, con pistas más juntas, desvía más la luz? ¿Qué relación tiene con la cantidad de información que guarda?',
      '¿Por qué el CD iluminado con luz blanca muestra colores?',
      '¿Cuántos órdenes de difracción se pueden ver con el CD y el láser rojo? ¿Por qué no más?',
      '¿Cómo se usa la difracción para estudiar la estructura de los cristales y del ADN?'
    ],
    saber: {
      comp: 'exp',
      enunciado: 'Un láser rojo ilumina perpendicularmente un CD y luego un DVD. Los puntos de primer orden del DVD aparecen mucho más lejos del centro que los del CD. La explicación es que',
      opciones: ['el DVD refleja más luz que el CD.', 'las pistas del DVD están más juntas, y el ángulo de difracción aumenta al disminuir la separación.', 'el DVD cambia la longitud de onda de la luz.', 'las pistas del DVD están más separadas, y eso aumenta el ángulo.'],
      clave: 'B',
      just: 'Con d sen θ = m λ, para la misma longitud de onda un d menor exige un sen θ mayor. El DVD tiene pistas separadas 0,74 µm frente a 1,6 µm del CD.'
    },
    rubrica: [['Modelo de difracción', 'Describe colores sin relacionarlos con la estructura.', 'Relaciona cualitativamente separación y ángulo.', 'Calcula d y el diámetro del cabello con incertidumbre.', 'Compara con las especificaciones y analiza la tolerancia del láser y el ángulo de incidencia.']],
    referencias: ['IEC 60908, sistema de audio digital en disco compacto (separación de pistas de 1,6 µm).', 'ECMA-267, DVD de 120 mm de solo lectura (separación de pistas de 0,74 µm).']
  });
})();
