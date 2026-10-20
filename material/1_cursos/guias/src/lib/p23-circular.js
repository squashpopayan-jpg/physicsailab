/* Práctica F10-10 · Movimiento circular: tapón, tubo y masa colgante */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'circular', cod: 'F10-10', titulo: 'Fuerza centrípeta: el tapón que gira', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes (quien gira, cronometrista, registrador)', nivel: 1,
    dba: ['10.1', '9.1'], est: ['C3', 'C4', 'C5', 'C10', 'F1', 'F2'], comp: ['uso', 'ind'], temas: ['Dinámica', 'Cinemática'],
    pregunta: '¿Qué fuerza se necesita para mantener un objeto girando en un círculo y cómo depende del periodo de giro?',
    contexto: 'Una piedra amarrada a una cuerda, una lavadora que centrifuga y un carro que toma una curva en la vía al mar necesitan una fuerza dirigida hacia el centro para no salir en línea recta. Con un tapón de caucho, un tubo de lapicero y unas arandelas se mide esa fuerza y se pone a prueba la segunda ley en un movimiento curvo.',
    objetivos: [
      'Relacionar la fuerza que mantiene un movimiento circular con la masa que gira, el radio y el periodo.',
      'Linealizar la relación entre el periodo y la masa colgante para poner a prueba la segunda ley.',
      'Explicar por qué la cuerda no puede quedar horizontal y por qué eso no afecta la relación medida.'
    ],
    prediccion: 'Si se cuadruplica la masa colgante manteniendo la longitud de la cuerda, ¿el tapón deberá girar más rápido o más lento? ¿Cuántas veces cambia el periodo?',
    claves: [
      'Un cuerpo que gira con rapidez constante en un círculo de radio r acelera hacia el centro con a = v²/r = 4π² r/P², donde P es el periodo.',
      'Aquí la fuerza hacia el centro la hace la cuerda, cuya tensión es igual al peso de la masa colgante Mg.',
      'Aunque la cuerda quede inclinada, la relación exacta es Mg = m (2π/P)² L, con L la longitud de cuerda entre el tubo y el tapón.',
      'Graficando P² contra 1/M se obtiene una recta de pendiente 4π² m L/g.'
    ],
    materiales: [
      ['Tapón de caucho de unos 12 g', '1', 'Borrador o bola de plastilina forrada en cinta', 1000],
      ['Tubo de lapicero vacío con los bordes lijados', '1', 'Tubo de PVC delgado de 15 cm', 0],
      ['Hilo de nailon resistente de 1,5 m', '1', 'Hilo de pescar', 500],
      ['Arandelas de 10 g y un clip como portapesas', '12', 'Tuercas pesadas', 2000],
      ['Pinza de ropa o clip como marcador de la longitud', '1', 'Cinta de enmascarar', 300],
      ['Cronómetro del celular', '1', 'Cronómetro manual', 0],
      ['Flexómetro y balanza', '1', '—', 0]
    ],
    montaje: [
      'Amarre el tapón a un extremo del hilo con un nudo firme y pase el hilo por el tubo.',
      'Cuelgue el portapesas del otro extremo y pese tapón, portapesas y arandelas.',
      'Mida 50 cm de hilo desde el tapón y marque ese punto con la pinza, que debe quedar justo debajo del tubo mientras gira.',
      'Practique el giro sobre la cabeza con movimientos pequeños de la muñeca, en un espacio despejado.'
    ],
    seguridad: [
      { p: 'Tapón que se suelta y sale disparado', c: 'mec', ef: 'Golpe en la cara o los ojos de compañeros', ctrl: 'Nudo doble revisado; espacio de 2 m libre alrededor; gafas para quien gira y para los observadores cercanos.', nd: 2, ne: 3, nc: 25 },
      { p: 'Hilo que corta la mano', c: 'mec', ef: 'Cortes leves', ctrl: 'Tubo con bordes lijados; masas de máximo 150 g.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'gafas de seguridad para quien gira y para quienes estén a menos de 2 m.',
    procedimiento: [
      'Con 50 g colgando, gire el tapón en un círculo horizontal sobre la cabeza ajustando la velocidad para que la pinza se mantenga justo debajo del tubo.',
      'Cuando el giro sea estable, el cronometrista mide el tiempo de 20 vueltas. Repita tres veces.',
      'Repita con al menos cinco masas colgantes entre 30 g y 120 g, manteniendo la misma longitud.',
      'Registre la inclinación aproximada de la cuerda en los casos extremos.'
    ],
    tabla: { cols: ['<i>M</i> colgante (kg)', '1/<i>M</i> (kg⁻¹)', '<i>t</i>₂₀ (s)', '<i>P</i> (s)', '<i>P</i>² (s²)'], filas: 7 },
    analisis: [
      'Calcule el periodo P = t₂₀/20 y su incertidumbre.',
      'Grafique P² contra 1/M y ajuste una recta por el origen.',
      'Compare la pendiente con 4π² m L/g usando la masa del tapón, la longitud y la gravedad del municipio.',
      'Despeje la masa del tapón a partir de la pendiente y compárela con la balanza.'
    ],
    esperado: 'Con un tapón de 12 g, L = 50 cm y g = 9,776 m/s²: con 50 g colgando el periodo es 0,696 s, con 30 g, 0,899 s y con 120 g, 0,449 s. La pendiente de P² contra 1/M vale 0,0242 kg·s². La cuerda queda inclinada unos 14° bajo la horizontal con 50 g y más con masas pequeñas, sin alterar la relación.',
    errores: [
      ['Usar el radio horizontal en lugar de la longitud de la cuerda.', 'La relación exacta usa la longitud L; el radio horizontal es L cos α y daría un error en las masas pequeñas.'],
      ['Girar con el brazo en vez de la muñeca.', 'El tubo describe su propio círculo y el periodo pierde sentido; se gira con movimientos pequeños.'],
      ['No mantener la marca bajo el tubo.', 'Si la pinza sube o baja, L cambia; se descarta la medida.'],
      ['Fricción del hilo en el tubo.', 'Un tubo áspero hace que la tensión del lado del tapón difiera del peso colgante; se lijan los bordes.']
    ],
    orientadoras: [
      '¿Qué fuerza obliga al tapón a curvar su trayectoria y cómo pueden medirla?',
      '¿Qué variables pueden cambiar y cuáles deben mantener constantes?',
      '¿Cómo medirán el periodo de giro con buena precisión?',
      '¿Qué gráfica permite poner a prueba la relación entre fuerza y periodo?'
    ],
    abierta: 'En una curva cerrada de la vía, los buses deben reducir la velocidad. Usen el tapón y el tubo para investigar cómo depende la fuerza necesaria para girar de la rapidez y del radio, y expliquen con sus datos por qué las curvas cerradas se toman despacio.',
    preguntas: [
      '¿Qué le pasaría al tapón si el hilo se rompiera? Dibuje la trayectoria vista desde arriba.',
      '¿Por qué la cuerda no puede quedar exactamente horizontal? ¿Qué fuerza lo impide?',
      'Si se duplica la longitud de la cuerda con la misma masa colgante, ¿cómo cambia el periodo?',
      '¿Qué fuerza hace el papel de la tensión cuando un carro toma una curva?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Un tapón gira en un círculo horizontal sostenido por una cuerda cuya tensión es constante. Si el radio del círculo se reduce a la cuarta parte manteniendo la misma tensión y la misma masa, el periodo de giro',
      opciones: ['se reduce a la cuarta parte.', 'se reduce a la mitad.', 'no cambia.', 'se duplica.'],
      clave: 'B',
      just: 'Con T = m 4π² r/P², a tensión y masa constantes P² es proporcional a r: si r se divide entre 4, P se divide entre 2.'
    },
    rubrica: [['Dinámica del movimiento circular', 'No identifica la fuerza centrípeta.', 'Identifica que la tensión es la fuerza hacia el centro.', 'Pone a prueba la relación con la linealización P²–1/M.', 'Explica la inclinación de la cuerda y justifica la relación exacta con L.']],
    referencias: ['R. A. Serway y J. W. Jewett, <i>Física para ciencias e ingeniería</i>, cap. 6: movimiento circular.']
  });
})();
