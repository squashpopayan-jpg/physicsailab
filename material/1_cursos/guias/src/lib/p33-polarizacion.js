/* Práctica F11-06 · Polarización de la luz y ley de Malus */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'polarizacion', cod: 'F11-06', titulo: 'Polarización de la luz y ley de Malus con una pantalla y el celular', grado: 11, tipo: 'simple',
    tiempo: 55, grupo: '3 estudiantes', nivel: 2,
    dba: ['11.1'], est: ['C3', 'C4', 'C5', 'C10', 'C12', 'T2'], comp: ['ind', 'exp'], temas: ['Ondas', 'Electromagnetismo'],
    pregunta: '¿Por qué una pantalla de computador se oscurece al mirarla con gafas polarizadas inclinadas, y cómo depende la luz que pasa del ángulo entre el filtro y la pantalla?',
    contexto: 'Las pantallas de cristal líquido de los computadores y de muchos celulares emiten luz polarizada: su campo eléctrico oscila en una sola dirección. Unas gafas de sol polarizadas o una lámina polarizadora la bloquean o la dejan pasar según cómo se giren. Con el sensor de luz del celular se mide esa dependencia, que Étienne Malus describió en 1809.',
    objetivos: [
      'Comprobar que la luz de una pantalla LCD está polarizada linealmente.',
      'Medir la intensidad transmitida por un polarizador en función del ángulo con el sensor de luz del celular.',
      'Linealizar la ley de Malus para obtener la intensidad máxima y el fondo, y explicar la polarización como prueba del carácter transversal de la luz.'
    ],
    prediccion: 'Si el polarizador se gira 45° desde la posición de máxima transmisión, ¿pasará la mitad de la luz, tres cuartas partes o casi nada? ¿Y a 90°?',
    claves: [
      'La luz es una onda electromagnética transversal: su campo eléctrico oscila perpendicular a la dirección de propagación.',
      'Un polarizador solo deja pasar la componente del campo paralela a su eje de transmisión.',
      'Ley de Malus: la intensidad transmitida es I = I₀ cos²θ, con θ el ángulo entre la dirección de polarización de la luz y el eje del polarizador.',
      'Graficando I contra cos²θ se obtiene una recta: la pendiente es I₀ y el intercepto, la luz de fondo que llega al sensor.'
    ],
    materiales: [
      ['Pantalla LCD de computador portátil o monitor con una imagen blanca', '1', 'Pantalla LCD de calculadora o celular con LCD (no OLED)', 0],
      ['Lámina polarizadora lineal de 5 × 5 cm', '1', 'Gafas de sol polarizadas (no gafas de cine 3D)', 8000],
      ['Celular con sensor de luz y phyphox («Luz»)', '1', 'Fotorresistencia con multímetro', 0],
      ['Transportador impreso y cartón para montar el polarizador girable', '1', '—', 500],
      ['Tubo de cartón negro de 10 cm para cubrir el sensor', '1', 'Rollo de papel higiénico pintado', 0],
      ['Cinta y plastilina', '—', '—', 1000]
    ],
    montaje: [
      'Ponga la pantalla con una imagen completamente blanca y el brillo fijo; apague el ajuste automático de brillo.',
      'Monte el polarizador en un disco de cartón con el transportador, de modo que gire sobre un eje perpendicular a la pantalla.',
      'Ubique el celular frente a la pantalla con el sensor de luz detrás del polarizador; cubra el espacio entre ambos con el tubo negro.',
      'Abra en phyphox el experimento «Luz» y verifique que la lectura cambia al girar el polarizador.'
    ],
    seguridad: [
      { p: 'Pantalla con brillo alto por tiempo prolongado', c: 'rad', ef: 'Fatiga visual', ctrl: 'Sesiones cortas; no mirar fijamente la pantalla blanca; pausas.', nd: 0, ne: 2, nc: 10 },
      { p: 'Equipos conectados a la red', c: 'elec', ef: 'Contacto eléctrico', ctrl: 'Computador con su cargador certificado en toma con GFCI; sin líquidos cerca.', nd: 0, ne: 2, nc: 25 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Mire la pantalla a través del polarizador y gírelo: identifique la posición de máxima transmisión (θ = 0°).',
      'Con el celular en posición, gire el polarizador de 0° a 180° en pasos de 15° y anote la iluminancia en cada posición.',
      'Tape la pantalla con una cartulina y mida la luz de fondo.',
      'Repita la serie dos veces.',
      'Ponga un segundo polarizador entre la pantalla y el primero, a 45°, con los otros dos cruzados: observe y explique lo que pasa.'
    ],
    tabla: { cols: ['θ (°)', 'cos²θ', '<i>I</i> serie 1 (lx)', '<i>I</i> serie 2 (lx)', '<i>I</i> promedio (lx)'], filas: 13 },
    analisis: [
      'Grafique I contra θ: ¿qué forma tiene la curva?',
      'Grafique I contra cos²θ y ajuste una recta: la pendiente es I₀ y el intercepto, el fondo; compárelo con la medida tapando la pantalla.',
      'Calcule la razón de extinción I<sub>mín</sub>/I<sub>máx</sub> del polarizador.',
      'Explique por qué la luz natural del Sol, no polarizada, pierde la mitad de su intensidad al pasar por un polarizador.'
    ],
    esperado: 'La iluminancia sigue I₀ cos²θ más un fondo: con I₀ = 300 lx y 5 lx de fondo, a 45° se leen unos 155 lx y a 90° solo el fondo más la fuga del polarizador. La gráfica de I contra cos²θ es una recta. Los polarizadores comerciales baratos dejan pasar de cruzados del orden de 1 % o menos.',
    errores: [
      ['Brillo automático de la pantalla o del celular encendido.', 'Cambia la luz mientras se mide; se desactiva.'],
      ['Usar una pantalla OLED.', 'Muchas no emiten luz polarizada; se verifica primero mirando a través del polarizador.'],
      ['Gafas de cine 3D como polarizador.', 'Suelen ser polarizadores circulares y no siguen la ley de Malus para luz lineal; se usan láminas lineales o gafas de sol polarizadas.'],
      ['Luz ambiente variable.', 'Se cubre el espacio entre el filtro y el sensor con un tubo negro y se mide el fondo.']
    ],
    orientadoras: [
      '¿Cómo podrían saber si la luz de una pantalla está polarizada?',
      '¿Qué medirán y en función de qué variable?',
      '¿Qué modelo esperan que siga la intensidad y qué gráfica lo pondría a prueba con una recta?',
      '¿Cómo controlarán la luz que no viene de la pantalla?'
    ],
    abierta: 'Los pescadores usan gafas polarizadas para ver bajo el agua y los fotógrafos, filtros polarizadores para oscurecer el cielo. Investiguen con el sensor de luz del celular qué fuentes y superficies producen luz polarizada (pantallas, reflejos en agua, cielo) y cómo depende la polarización del ángulo.',
    preguntas: [
      '¿Por qué la polarización demuestra que la luz es una onda transversal? ¿Se puede polarizar el sonido en el aire?',
      '¿Por qué un tercer polarizador a 45° entre dos cruzados deja pasar luz?',
      '¿Por qué las gafas polarizadas reducen el reflejo del agua o del pavimento?',
      'Si la intensidad máxima es 300 lx, ¿a qué ángulo pasa la cuarta parte?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Luz polarizada de intensidad I₀ atraviesa un polarizador cuyo eje forma 60° con la dirección de polarización. Según la ley de Malus, la intensidad transmitida es',
      opciones: ['I₀/4.', 'I₀/2.', '3I₀/4.', 'I₀.'],
      clave: 'A',
      just: 'I = I₀ cos²60° = I₀ (1/2)² = I₀/4.'
    },
    rubrica: [['Modelo de polarización', 'No relaciona el ángulo con la intensidad.', 'Describe que la intensidad cambia con el ángulo.', 'Verifica la ley de Malus por linealización con el fondo.', 'Explica la polarización como prueba de la transversalidad y analiza la extinción del filtro.']],
    referencias: ['É. L. Malus, «Sur une propriété de la lumière réfléchie», 1809.', 'S. Staacks et al., «Advanced tools for smartphone-based experiments: phyphox», <i>Physics Education</i> 53, 045009, 2018.']
  });
})();
