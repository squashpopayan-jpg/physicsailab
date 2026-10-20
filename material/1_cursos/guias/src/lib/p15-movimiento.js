/* Práctica F10-02 · Movimiento rectilíneo acelerado en un riel */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'movimiento', cod: 'F10-02', titulo: 'Movimiento acelerado en un riel: el plano inclinado de Galileo', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 a 4 estudiantes (lanzador, camarógrafo, analista, registrador)', nivel: 1,
    dba: ['9.1', '10.1'], est: ['C3', 'C5', 'C6', 'C10', 'C12', 'F1', 'F2'], comp: ['ind', 'uso'], temas: ['Cinemática', 'Dinámica'],
    pregunta: '¿Cómo cambia la posición de una esfera que rueda por un riel inclinado y por qué su aceleración es menor que la de un bloque que se desliza sin fricción?',
    contexto: 'Galileo no podía cronometrar una caída libre, así que la «diluyó» en un plano inclinado y midió el tiempo con el agua que salía de un recipiente. Encontró que las distancias recorridas crecen como el cuadrado del tiempo. Con un riel de aluminio y la cámara del celular se repite hoy su experimento, y aparece un detalle que él no podía ver: la esfera rueda, y rodar cuesta energía.',
    objetivos: [
      'Registrar la posición de una esfera en función del tiempo con video y construir las gráficas x–t y v–t.',
      'Linealizar la relación x–t para obtener la aceleración con su incertidumbre, sin necesidad de conocer el instante exacto de partida.',
      'Comparar la aceleración medida con la de un cuerpo que se desliza sin fricción y explicar la diferencia por la rotación.'
    ],
    prediccion: 'Si la esfera recorre 20 cm en el primer segundo, ¿cuánto habrá recorrido al final del segundo segundo? ¿Rodará más rápido o más lento que un bloque que bajara deslizando sin fricción por el mismo riel? Justifiquen.',
    claves: [
      'Con aceleración constante a y partiendo del reposo, x = ½ a t²: la distancia crece como el cuadrado del tiempo.',
      'Como √x = √(a/2) · (t − t₀), la gráfica de √x contra t es una recta aunque no se conozca el instante t₀ de partida.',
      'Un bloque sin fricción baja con a = g sen θ; una esfera que rueda, con a = g sen θ / (1 + β), porque parte de la energía se va en girar.',
      'Para una esfera maciza que rueda sobre un plano, β = 2/5; en un canal que la toca por los bordes, β es mayor.'
    ],
    materiales: [
      ['Perfil de aluminio en U de 1/2 pulgada, 1,5 m', '1', 'Riel de cortina; dos reglas de madera con un canal', 12000],
      ['Esfera de acero de 3/4 pulgada (19 mm)', '1', 'Canica de vidrio de 16 mm', 3000],
      ['Tacos de madera para apoyar el riel (3 a 6 cm)', '2', 'Libros', 0],
      ['Cinta de enmascarar y marcador para marcas cada 20 cm', '1', '—', 3000],
      ['Flexómetro', '1', 'Regla de 1 m', 8000],
      ['Celular con cámara (30 o 60 cuadros por segundo) y trípode improvisado', '1', 'Cronómetros manuales en cada marca', 0],
      ['Tope de espuma o tela al final del riel', '1', 'Toalla doblada', 0]
    ],
    montaje: [
      'Apoye el riel sobre la mesa con un taco bajo un extremo. Mida las alturas de los dos extremos sobre la mesa y la longitud entre apoyos: sen θ = Δh / L.',
      'Pegue marcas de cinta cada 20 cm desde el punto de partida y numérelas.',
      'Ubique el celular a 1,5 m del riel, perpendicular a él, con la regla o las marcas en el mismo plano en que rueda la esfera.',
      'Coloque el tope al final del riel para que la esfera no caiga al piso.'
    ],
    seguridad: [
      { p: 'Esfera de acero que cae del riel o de la mesa', c: 'mec', ef: 'Golpe en los pies', ctrl: 'Tope al final del riel; bandeja o caja bajo el extremo; esfera de máximo 3/4 pulgada.', nd: 2, ne: 2, nc: 10 },
      { p: 'Bordes del perfil de aluminio', c: 'mec', ef: 'Cortes', ctrl: 'Extremos limados y cubiertos con cinta.', nd: 0, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Con una inclinación de 2° a 3°, suelte la esfera desde el reposo en la marca cero, sin empujarla, y grábela hasta el final del riel.',
      'Repita la grabación tres veces. Verifique en el video que la esfera no rebota ni se sale del canal.',
      'En el video, avance cuadro a cuadro y anote el número de cuadro en que la esfera pasa por cada marca. El tiempo es el número de cuadro dividido entre los cuadros por segundo.',
      'Cambie la inclinación (dos inclinaciones más) y repita.',
      'Si tiene un bloque o un carrito, déjelo bajar por el mismo riel para comparar cualitativamente.'
    ],
    tabla: { cols: ['Marca', '<i>x</i> (m)', 'Cuadro n.°', '<i>t</i> (s)', '√<i>x</i> (m<sup>1/2</sup>)', '<i>v</i> media del tramo (m/s)'], filas: 8 },
    analisis: [
      'Grafique x contra t: ¿es una recta o una curva?',
      'Grafique √x contra t y ajuste una recta. La pendiente vale √(a/2): calcule a = 2 · pendiente² y u(a) = 4 · pendiente · u(pendiente).',
      'Calcule la velocidad media de cada tramo y grafíquela contra el tiempo medio del tramo: la pendiente es otra estimación de a.',
      'Calcule g sen θ y g sen θ/(1 + β) con β = 2/5 y con el β del canal; compare con su medida usando z.',
      'Repita para las otras inclinaciones y grafique a contra sen θ.'
    ],
    esperado: 'Con sen θ = 0,0333 (5 cm de desnivel en 1,5 m) y la gravedad de Popayán, un bloque sin fricción bajaría con 0,326 m/s². Una esfera que rueda sobre un plano baja con 0,233 m/s²; la esfera de 19 mm en un canal de 11 mm, con β = 0,60, baja con 0,203 m/s² y tarda unos 3,7 s en recorrer 1,4 m. La fricción de rodadura reduce un poco más la aceleración.',
    errores: [
      ['Esperar que a sea g sen θ.', 'La esfera rueda: la diferencia de 30 % a 40 % no es error experimental sino física que hay que explicar.'],
      ['Usar t = 0 en el cuadro en que «parece» que se suelta.', 'El instante de partida es incierto en varios cuadros; la gráfica de √x contra t lo absorbe en el intercepto.'],
      ['Cámara oblicua o regla fuera del plano.', 'La perspectiva cambia las distancias; las marcas sobre el propio riel evitan el problema.'],
      ['Inclinaciones grandes.', 'Por encima de unos 10° la esfera puede deslizar además de rodar y el modelo deja de valer.']
    ],
    orientadoras: [
      '¿Qué magnitudes medirán y cómo obtendrán el tiempo en que la esfera pasa por cada posición?',
      '¿Qué gráfica esperan que sea una recta si el movimiento es uniformemente acelerado?',
      '¿Cómo medirán el ángulo de inclinación con la mejor precisión?',
      '¿Qué otro objeto podrían lanzar para comparar el efecto de la rotación?'
    ],
    abierta: 'Galileo afirmaba que todos los cuerpos caen igual. Sin embargo, una lata llena y una lata vacía bajan por una rampa con aceleraciones distintas. Diseñen una investigación sobre qué determina la aceleración de un objeto que rueda por una rampa.',
    preguntas: [
      '¿Cómo saben, a partir de sus gráficas, que la aceleración fue constante?',
      '¿Por qué la aceleración medida es menor que g sen θ? ¿A dónde va la energía potencial perdida?',
      'Si el riel se inclinara 90°, ¿la esfera caería con g? ¿Por qué el modelo de rodadura deja de valer mucho antes?',
      'Grafiquen la velocidad media de cada tramo contra el tiempo. ¿Qué representa el área bajo esa gráfica?'
    ],
    saber: {
      comp: 'uso',
      enunciado: 'Una esfera parte del reposo y rueda por un plano inclinado con aceleración constante. En el primer segundo recorre 10 cm. Si se mantiene la aceleración, la distancia total recorrida al cabo de 3 s es',
      opciones: ['30 cm.', '60 cm.', '90 cm.', '270 cm.'],
      clave: 'C',
      just: 'Con x = ½ a t², la distancia es proporcional al cuadrado del tiempo: al triplicar el tiempo, la distancia se multiplica por nueve. 10 cm × 9 = 90 cm.'
    },
    rubrica: [['Modelo cinemático y dinámico', 'No reconoce la relación cuadrática.', 'Reconoce que x crece más rápido que t.', 'Obtiene a por linealización con su incertidumbre.', 'Explica la diferencia con g sen θ mediante la energía de rotación y el factor β.']],
    referencias: ['Galileo Galilei, <i>Diálogos sobre dos nuevas ciencias</i>, Jornada tercera, 1638.', 'D. Brown, Tracker Video Analysis and Modeling Tool, Open Source Physics.']
  });
})();
